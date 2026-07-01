import { useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Clock, Trophy, Vote } from "lucide-react";
import type { Poll } from "../types/poll.types";
import { usePollResults, useVotePoll } from "../hooks/usePolls";
import { getAnonymousVoterKey } from "../utils/voterKey";
import { PollResultsBar } from "./PollResultsBar";
import { trackEvent } from "../../../lib/analytics";
import { AnalyticsEvents } from "../../../lib/analytics-events";
import AthleteSearchModal, {
  type AthleteLite,
} from "@/components/AthleteSearchModal";

interface PollCardProps {
  poll: Poll;
  sourcePage: string;
  userId?: string;
}

function formatPollCategory(category?: string | null) {
  return (category || "general").replace(/_/g, " ");
}

function formatDateTime(value?: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function PollCard({ poll, sourcePage, userId }: PollCardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [athleteModalOpen, setAthleteModalOpen] = useState(false);
  const [selectedRacer, setSelectedRacer] = useState<AthleteLite | null>(null);

  const anonymousVoterKey = useMemo(() => getAnonymousVoterKey(), []);

  const {
    data: results,
    isLoading: isResultsLoading,
    refetch: refetchResults,
  } = usePollResults({
    pollId: poll?.id,
    userId,
    enabled: Boolean(poll?.id),
  });

  const voteMutation = useVotePoll();

  const hasVoted = Boolean(results?.userHasVoted);
  const isClosed = poll?.status === "closed";
  const shouldShowResults = poll.showResultsBeforeClose || hasVoted || isClosed;
  const selectedResultOptionId = results?.selectedOptionId;
  const selectedResultRacerId = results?.selectedRacerId;

  useEffect(() => {
    if (!poll?.id || !poll?.title) return;

    trackEvent(AnalyticsEvents.POLL_VIEWED, {
      pollId: poll.id,
      pollTitle: poll.title,
      pollCategory: poll.category,
      organizationId: poll.organizationId,
      eventId: poll.eventId,
      sourcePage,
      isLoggedIn: Boolean(userId),
    });
  }, [
    poll?.id,
    poll?.title,
    poll?.category,
    poll?.organizationId,
    poll?.eventId,
    sourcePage,
    userId,
  ]);

  if (!poll?.id || !poll?.title) {
    return null;
  }

  function handleSelectOption(optionId: string, optionLabel: string) {
    if (hasVoted || isClosed) return;

    setSelectedOptionId(optionId);
    setLocalError(null);

    trackEvent(AnalyticsEvents.POLL_OPTION_SELECTED, {
      pollId: poll.id,
      pollTitle: poll.title,
      pollCategory: poll.category,
      optionId,
      optionLabel,
      organizationId: poll.organizationId,
      eventId: poll.eventId,
      sourcePage,
      isLoggedIn: Boolean(userId),
    });
  }

  async function handleVote() {
    if (isClosed) {
      setLocalError("This poll has already closed.");
      return;
    }

    if (poll.votingMode === "fixed_options" && !selectedOptionId) {
      setLocalError("Select an option before submitting your vote.");
      return;
    }

    if (poll.votingMode === "racer_search" && !selectedRacer) {
      setLocalError("Search and select a racer before submitting your vote.");
      return;
    }

    const selectedOption = poll.options.find(
      (option) => option.id === selectedOptionId,
    );

    setLocalError(null);

    try {
      await voteMutation.mutateAsync({
        pollId: poll.id,
        payload:
          poll.votingMode === "racer_search"
            ? {
                racerId: String(selectedRacer?.id),
                racerName: selectedRacer?.name ?? "",
                racerImageUrl: selectedRacer?.image ?? null,
                anonymousVoterKey,
                userId,
              }
            : {
                optionId: selectedOptionId ?? undefined,
                anonymousVoterKey,
                userId,
              },
      });

      trackEvent(AnalyticsEvents.POLL_VOTED, {
        pollId: poll.id,
        pollTitle: poll.title,
        pollCategory: poll.category,
        votingMode: poll.votingMode,
        status: poll.status,
        optionId: selectedOptionId,
        optionLabel:
          poll.votingMode === "racer_search"
            ? selectedRacer?.name
            : selectedOption?.label,
        racerId:
          poll.votingMode === "racer_search"
            ? String(selectedRacer?.id)
            : undefined,
        racerName:
          poll.votingMode === "racer_search" ? selectedRacer?.name : undefined,
        organizationId: poll.organizationId,
        eventId: poll.eventId,
        sourcePage,
        isLoggedIn: Boolean(userId),
      });

      await refetchResults();

      trackEvent(AnalyticsEvents.POLL_RESULTS_VIEWED, {
        pollId: poll.id,
        pollTitle: poll.title,
        pollCategory: poll.category,
        sourcePage,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to submit vote.";

      if (message.toLowerCase().includes("already voted")) {
        trackEvent(AnalyticsEvents.POLL_VOTE_DUPLICATE_ATTEMPTED, {
          pollId: poll.id,
          pollTitle: poll.title,
          pollCategory: poll.category,
          sourcePage,
          isLoggedIn: Boolean(userId),
        });
      } else {
        trackEvent(AnalyticsEvents.POLL_VOTE_FAILED, {
          pollId: poll.id,
          pollTitle: poll.title,
          pollCategory: poll.category,
          sourcePage,
          reason: message,
        });
      }

      setLocalError(message);
      await refetchResults();
    }
  }

  const endLabel = formatDateTime(poll.endsAt);

  return (
    <>
      <article className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#080812]/95 p-5 shadow-2xl shadow-black/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,45,85,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.16),transparent_32%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff2d55] to-transparent" />

        <div className="relative">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ff2d55]/30 bg-[#ff2d55]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-[#ff7b9a]">
              <Vote size={14} />
              Fan Vote
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/50">
              <BarChart3 size={14} />
              {formatPollCategory(poll.category)}
            </div>
          </div>

          {poll.rewardTitle ? (
            <div className="mb-4 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-3">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-yellow-200">
                <Trophy size={16} />
                {poll.rewardTitle}
              </div>

              {poll.rewardDescription ? (
                <p className="mt-1 text-xs leading-5 text-yellow-100/70">
                  {poll.rewardDescription}
                </p>
              ) : null}
            </div>
          ) : null}

          <h3 className="text-2xl font-black uppercase leading-tight tracking-tight text-white sm:text-3xl">
            {poll.title}
          </h3>

          {poll.description ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
              {poll.description}
            </p>
          ) : null}

          {endLabel ? (
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/45">
              <Clock size={14} />
              Voting closes {endLabel}
            </div>
          ) : null}

          {poll.votingMode === "racer_search" ? (
            <div className="mt-6 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.04] p-4">
              <div className="text-sm font-black uppercase tracking-[0.18em] text-white">
                Select Your Racer
              </div>

              <p className="mt-2 text-sm leading-6 text-white/55">
                Search for the racer you want to vote for, then submit your
                vote.
              </p>

              {selectedRacer ? (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <img
                    src={selectedRacer.image || "/stockprofilepicture.jpeg"}
                    alt={selectedRacer.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-black text-white">
                      {selectedRacer.name}
                    </div>
                    <div className="truncate text-xs text-white/45">
                      {selectedRacer.location || "Selected racer"}
                    </div>
                  </div>

                  {!hasVoted && !isClosed ? (
                    <button
                      type="button"
                      onClick={() => setSelectedRacer(null)}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60 hover:bg-white/10"
                    >
                      Change
                    </button>
                  ) : null}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    trackEvent(AnalyticsEvents.POLL_RACER_SEARCH_OPENED, {
                      pollId: poll.id,
                      pollTitle: poll.title,
                      votingMode: poll.votingMode,
                      sourcePage,
                    });

                    setAthleteModalOpen(true);
                  }}
                  disabled={hasVoted || isClosed}
                  className="mt-4 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 transition hover:bg-cyan-300/20 disabled:opacity-50"
                >
                  Search Racer
                </button>
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {poll.options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                const wasSelectedResult = selectedResultOptionId === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={hasVoted || isClosed || voteMutation.isPending}
                    onClick={() => handleSelectOption(option.id, option.label)}
                    className={[
                      "group w-full rounded-2xl border p-4 text-left transition",
                      hasVoted || isClosed
                        ? "cursor-default border-white/10 bg-white/[0.03]"
                        : "hover:-translate-y-0.5 hover:border-[#ff2d55]/60 hover:bg-[#ff2d55]/10",
                      isSelected
                        ? "border-[#ff2d55] bg-[#ff2d55]/15 shadow-lg shadow-[#ff2d55]/10"
                        : "border-white/10 bg-white/[0.04]",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      {option.imageUrl ? (
                        <img
                          src={option.imageUrl}
                          alt={option.label}
                          className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/10"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/50 ring-1 ring-white/10">
                          <Vote size={20} className="text-white/50" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-black uppercase tracking-wide text-white">
                            {option.label}
                          </p>

                          {wasSelectedResult ? (
                            <CheckCircle2
                              size={16}
                              className="text-[#ff7b9a]"
                            />
                          ) : null}
                        </div>

                        {option.description ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/45">
                            {option.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {localError ? (
            <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">
              {localError}
            </div>
          ) : null}

          {!hasVoted && !isClosed ? (
            <button
              type="button"
              disabled={voteMutation.isPending}
              onClick={handleVote}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#ff2d55] via-[#a855f7] to-[#38bdf8] px-5 py-4 text-sm font-black uppercase tracking-[0.22em] text-white shadow-xl shadow-[#ff2d55]/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {voteMutation.isPending ? "Submitting Vote..." : "Submit Vote"}
            </button>
          ) : isClosed ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-sm font-black uppercase tracking-[0.18em] text-white/70">
                Voting Closed
              </div>
              <p className="mt-1 text-xs leading-5 text-white/45">
                This poll has ended. Final results are shown below.
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-emerald-200">
                <CheckCircle2 size={18} />
                Thanks for voting
              </div>
              <p className="mt-1 text-xs leading-5 text-emerald-100/60">
                Your vote has been counted. Results update as more fans vote.
              </p>
            </div>
          )}

          {shouldShowResults ? (
            <div className="mt-7">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-black uppercase tracking-[0.22em] text-white/70">
                  Current Results
                </h4>

                <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">
                  {isResultsLoading
                    ? "Loading..."
                    : `${(results?.totalVotes ?? 0).toLocaleString()} votes`}
                </span>
              </div>

              <div className="space-y-3">
                {results?.options.map((option) => (
                  <PollResultsBar
                    key={option.optionId ?? option.racerId ?? option.label}
                    option={option}
                    isSelected={
                      option.optionId
                        ? selectedResultOptionId === option.optionId
                        : selectedResultRacerId === option.racerId
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}

          <p className="mt-5 text-[11px] leading-5 text-white/35">
            One vote per fan/device. Voting data may be used for Corner League
            community awards, engagement reporting, and sponsor insights.
          </p>
        </div>
      </article>

      <AthleteSearchModal
        open={athleteModalOpen}
        onClose={() => setAthleteModalOpen(false)}
        onPick={(athlete) => {
          trackEvent(AnalyticsEvents.POLL_RACER_SELECTED, {
            pollId: poll.id,
            pollTitle: poll.title,
            racerId: String(athlete.id),
            racerName: athlete.name,
            sourcePage,
          });

          setSelectedRacer(athlete);
          setAthleteModalOpen(false);
        }}
      />
    </>
  );
}
