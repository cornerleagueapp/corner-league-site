import { useState } from "react";
import { X, Plus, Trash2, UserPlus } from "lucide-react";
import { useCreatePoll } from "../hooks/usePolls";
import type {
  CreatePollInput,
  PollCategory,
  PollStatus,
  PollVotingMode,
} from "../types/poll.types";
import AthleteSearchModal, {
  type AthleteLite,
} from "@/components/AthleteSearchModal";

interface CreatePollModalProps {
  open: boolean;
  onClose: () => void;
}

type OptionDraft = {
  label: string;
  description: string;
  imageUrl: string;
  racerId?: string | null;
};

const categoryOptions: PollCategory[] = [
  "fan_vote",
  "sponsor_research",
  "event_award",
  "general",
];

const statusOptions: PollStatus[] = ["draft", "active", "closed"];

function labelize(value: string) {
  return value.replace(/_/g, " ");
}

export function CreatePollModal({ open, onClose }: CreatePollModalProps) {
  const createPoll = useCreatePoll();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<PollCategory>("fan_vote");
  const [votingMode, setVotingMode] = useState<PollVotingMode>("fixed_options");
  const [status, setStatus] = useState<PollStatus>("draft");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardDescription, setRewardDescription] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [athleteModalOpen, setAthleteModalOpen] = useState(false);
  const [options, setOptions] = useState<OptionDraft[]>([
    { label: "", description: "", imageUrl: "" },
    { label: "", description: "", imageUrl: "" },
  ]);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function updateOption(index: number, key: keyof OptionDraft, value: string) {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [key]: value } : option,
      ),
    );
  }

  function addOption() {
    setOptions((current) => [
      ...current,
      { label: "", description: "", imageUrl: "" },
    ]);
  }

  function removeOption(index: number) {
    setOptions((current) =>
      current.filter((_, optionIndex) => optionIndex !== index),
    );
  }

  async function handleSubmit() {
    try {
      setError(null);

      const cleanOptions = options
        .map((option, index) => ({
          label: option.label.trim(),
          description: option.description.trim() || null,
          imageUrl: option.imageUrl.trim() || null,
          racerId: option.racerId ?? null,
          sortOrder: index,
        }))
        .filter((option) => option.label.length > 0);

      if (title.trim().length < 3) {
        setError("Poll title must be at least 3 characters.");
        return;
      }

      if (votingMode === "fixed_options" && cleanOptions.length < 2) {
        setError("Add at least two poll options.");
        return;
      }

      const payload: CreatePollInput = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        votingMode,
        status,
        isFeatured,
        isPublic,
        coverImageUrl: coverImageUrl.trim() || null,
        rewardTitle: rewardTitle.trim() || null,
        rewardDescription: rewardDescription.trim() || null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        allowAnonymousVotes: true,
        showResultsBeforeClose: true,
        options: votingMode === "fixed_options" ? cleanOptions : [],
      };

      await createPoll.mutateAsync(payload);
      onClose();
    } catch (e: any) {
      setError(e?.message || "Failed to create poll.");
    }
  }

  function addAthleteAsOption(athlete: AthleteLite) {
    const athleteId = String(athlete.id);

    setOptions((current) => {
      const alreadyAdded = current.some(
        (option) => String(option.racerId ?? "") === athleteId,
      );

      if (alreadyAdded) {
        setError(`${athlete.name} is already added as a poll option.`);
        return current;
      }

      const cleanedCurrent = current.filter(
        (option) =>
          option.label.trim().length > 0 ||
          option.description.trim().length > 0 ||
          option.imageUrl.trim().length > 0 ||
          option.racerId,
      );

      return [
        ...cleanedCurrent,
        {
          label: athlete.name,
          description:
            athlete.location || athlete.boatManufacturers
              ? [athlete.location, athlete.boatManufacturers]
                  .filter(Boolean)
                  .join(" • ")
              : "Racer profile option",
          imageUrl: athlete.image ?? "",
          racerId: athleteId,
        },
      ];
    });

    setAthleteModalOpen(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[30px] border border-cyan-300/10 bg-[#07111F] shadow-2xl sm:rounded-[30px]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200/70">
              Super Admin
            </div>
            <h2 className="mt-1 text-2xl font-black uppercase text-white">
              Create Poll
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/70 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {error ? (
            <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="fld"
                placeholder="Who had the best ride?"
              />
            </Field>

            <Field label="Cover Image URL">
              <input
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className="fld"
                placeholder="https://..."
              />
            </Field>

            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PollCategory)}
                className="fld"
              >
                {categoryOptions.map((item) => (
                  <option key={item} value={item}>
                    {labelize(item)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Voting Mode">
              <select
                value={votingMode}
                onChange={(e) =>
                  setVotingMode(e.target.value as PollVotingMode)
                }
                className="fld"
              >
                <option value="fixed_options">Fixed Options</option>
                <option value="racer_search">Racer Search</option>
              </select>
            </Field>

            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PollStatus)}
                className="fld"
              >
                {statusOptions.map((item) => (
                  <option key={item} value={item}>
                    {labelize(item)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Voting Ends At">
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="fld"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Toggle
                label="Public"
                checked={isPublic}
                onChange={setIsPublic}
              />
              <Toggle
                label="Featured"
                checked={isFeatured}
                onChange={setIsFeatured}
              />
            </div>
          </div>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="fld min-h-[110px]"
              placeholder="Describe the poll..."
            />
          </Field>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Reward Title">
              <input
                value={rewardTitle}
                onChange={(e) => setRewardTitle(e.target.value)}
                className="fld"
                placeholder="Fan Favorite Award"
              />
            </Field>

            <Field label="Reward Description">
              <input
                value={rewardDescription}
                onChange={(e) => setRewardDescription(e.target.value)}
                className="fld"
                placeholder="Winner gets featured..."
              />
            </Field>
          </div>

          {votingMode === "fixed_options" ? (
            <div className="mt-6">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.22em] text-white/70">
                    Options
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-white/40">
                    Add custom options manually or search existing racers for
                    MVP / Fan Favorite style polls.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAthleteModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#FFB199] hover:bg-[#FF6B35]/20"
                  >
                    <UserPlus className="h-4 w-4" />
                    Search Racer
                  </button>

                  <button
                    type="button"
                    onClick={addOption}
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 hover:bg-cyan-300/20"
                  >
                    <Plus className="h-4 w-4" />
                    Add Option
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {options.map((option, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-white/45">
                        Option {index + 1}
                        {option.racerId ? (
                          <span className="ml-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2 py-0.5 text-[10px] text-cyan-200">
                            Racer
                          </span>
                        ) : null}
                      </div>

                      {options.length > 2 ? (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="rounded-full border border-red-400/20 bg-red-500/10 p-2 text-red-200 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <input
                        value={option.label}
                        onChange={(e) =>
                          updateOption(index, "label", e.target.value)
                        }
                        className="fld"
                        placeholder="Racer A"
                      />
                      <input
                        value={option.description}
                        onChange={(e) =>
                          updateOption(index, "description", e.target.value)
                        }
                        className="fld"
                        placeholder="Short description"
                      />
                      <input
                        value={option.imageUrl}
                        onChange={(e) =>
                          updateOption(index, "imageUrl", e.target.value)
                        }
                        className="fld"
                        placeholder="Image URL"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[20px] border border-cyan-300/10 bg-cyan-300/[0.04] p-4">
              <div className="text-sm font-semibold text-white">
                Racer Search Voting Enabled
              </div>
              <p className="mt-2 text-sm leading-6 text-white/55">
                Users will search and select any racer as their vote. You do not
                need to create fixed options for this poll.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-white/10 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/70 hover:bg-white/10"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={createPoll.isPending}
            className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-cyan-100 hover:bg-cyan-300/20 disabled:opacity-50"
          >
            {createPoll.isPending ? "Creating..." : "Create Poll"}
          </button>
        </div>
      </div>

      <style>{`
        .fld {
            width: 100%;
            min-height: 48px;
            border-radius: 14px;
            background: rgba(255,255,255,0.055);
            border: 1px solid rgba(255,255,255,0.10);
            padding: 0 14px;
            color: white;
            outline: none;
            transition:
            border-color 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
        }

        .fld::placeholder {
            color: rgba(255,255,255,0.34);
        }

        .fld:focus {
            border-color: rgba(103,232,249,0.34);
            box-shadow: 0 0 0 3px rgba(34,211,238,0.10);
            background: rgba(255,255,255,0.075);
        }

        textarea.fld {
            height: auto;
            padding: 12px 14px;
            resize: vertical;
        }

        select.fld {
            appearance: none;
        }
        `}</style>

      <AthleteSearchModal
        open={athleteModalOpen}
        onClose={() => setAthleteModalOpen(false)}
        onPick={addAthleteAsOption}
      />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-4 block">
      <div className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-white/45">
        {label}
      </div>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`mt-4 rounded-2xl border px-4 py-3 text-left ${
        checked
          ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
          : "border-white/10 bg-white/[0.03] text-white/50"
      }`}
    >
      <div className="text-xs font-black uppercase tracking-[0.2em]">
        {label}
      </div>
      <div className="mt-1 text-sm">{checked ? "Enabled" : "Disabled"}</div>
    </button>
  );
}
