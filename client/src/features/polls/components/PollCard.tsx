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
      <article className="relative overflow-hidden rounded-[28px] border border-cl-border bg-cl-surface p-5 shadow-2xl shadow-black/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,45,85,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.16),transparent_32%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cl-accent to-transparent" />

        <div className="relative">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cl-accent/30 bg-cl-accent/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-cl-accent">
              <Vote size={14} />
              Fan Vote
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-cl-border bg-cl-subtle px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cl-muted">
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

          <h3 className="text-2xl font-black uppercase leading-tight tracking-tight text-cl-ink sm:text-3xl">
            {poll.title}
          </h3>

          {poll.description ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-cl-muted">
              {poll.description}
            </p>
          ) : null}

          {endLabel ? (
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cl-muted">
              <Clock size={14} />
              Voting closes {endLabel}
            </div>
          ) : null}

          {poll.votingMode === "racer_search" ? (
            <div className="mt-6 rounded-2xl border border-cl-accent/10 bg-cl-accent/[0.04] p-4">
              <div className="text-sm font-black uppercase tracking-[0.18em] text-cl-ink">
                Select Your Racer
              </div>

              <p className="mt-2 text-sm leading-6 text-cl-muted">
                Search for the racer you want to vote for, then submit your
                vote.
              </p>

              {selectedRacer ? (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-cl-border bg-cl-subtle p-3">
                  <img
                    src={selectedRacer.image || "/stockprofilepicture.jpeg"}
                    alt={selectedRacer.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-black text-cl-ink">
                      {selectedRacer.name}
                    </div>
                    <div className="truncate text-xs text-cl-muted">
                      {selectedRacer.location || "Selected racer"}
                    </div>
                  </div>

                  {!hasVoted && !isClosed ? (
                    <button
                      type="button"
                      onClick={() => setSelectedRacer(null)}
                      className="rounded-full border border-cl-border px-3 py-1 text-xs text-cl-muted hover:bg-cl-subtle"
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
                  className="mt-4 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-cl-accent transition hover:bg-cl-accent/20 disabled:opacity-50"
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
                        ? "cursor-default border-cl-border bg-cl-subtle"
                        : "hover:-translate-y-0.5 hover:border-cl-accent/60 hover:bg-cl-accent/10",
                      isSelected
                        ? "border-cl-accent bg-cl-accent/15 shadow-lg shadow-[#ff2d55]/10"
                        : "border-cl-border bg-cl-subtle",
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
                        <div className="cl-dark flex h-12 w-12 items-center justify-center rounded-xl bg-black/50 ring-1 ring-white/10">
                          <Vote size={20} className="text-cl-muted" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-black uppercase tracking-wide text-cl-ink">
                            {option.label}
                          </p>

                          {wasSelectedResult ? (
                            <CheckCircle2
                              size={16}
                              className="text-cl-accent"
                            />
                          ) : null}
                        </div>

                        {option.description ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-cl-muted">
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
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-cl-accent via-cl-accent to-cl-accent px-5 py-4 text-sm font-black uppercase tracking-[0.22em] text-cl-ink shadow-xl shadow-[#ff2d55]/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {voteMutation.isPending ? "Submitting Vote..." : "Submit Vote"}
            </button>
          ) : isClosed ? (
            <div className="mt-5 rounded-2xl border border-cl-border bg-cl-subtle p-4">
              <div className="text-sm font-black uppercase tracking-[0.18em] text-cl-muted">
                Voting Closed
              </div>
              <p className="mt-1 text-xs leading-5 text-cl-muted">
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
                <h4 className="text-sm font-black uppercase tracking-[0.22em] text-cl-muted">
                  Current Results
                </h4>

                <span className="text-xs font-bold uppercase tracking-[0.16em] text-cl-muted">
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

          <p className="mt-5 text-[11px] leading-5 text-cl-muted">
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
