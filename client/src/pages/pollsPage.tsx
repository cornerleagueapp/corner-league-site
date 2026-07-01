import { Link } from "wouter";
import { BarChart3, ChevronRight, Trophy, Vote } from "lucide-react";
import {
  useFeaturedPoll,
  usePublicPolls,
} from "@/features/polls/hooks/usePolls";
import { PollCard } from "@/features/polls/components/PollCard";
import type { Poll } from "@/features/polls/types/poll.types";

function labelize(value: string) {
  return value.replace(/_/g, " ");
}

function formatDate(value?: string | null) {
  if (!value) return null;

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PollsPage() {
  const { data: featuredPoll, isLoading: featuredLoading } = useFeaturedPoll();
  const { data, isLoading } = usePublicPolls();

  const polls = Array.isArray(data) ? data : [];

  const activePolls = polls.filter((poll) => poll.status === "active");
  const closedPolls = polls.filter((poll) => poll.status === "closed");

  return (
    <div className="min-h-screen bg-[#030913] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(255,107,53,0.08),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <main className="relative mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-8 overflow-hidden rounded-[34px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.96)_0%,rgba(4,10,19,0.98)_100%)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.38)] sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200">
            <Vote className="h-4 w-4" />
            Corner League Polls
          </div>

          <h1 className="mt-5 text-5xl font-black uppercase leading-none tracking-tight text-white sm:text-6xl">
            Fan Voting
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            Vote on racers, events, brands, and community awards. Polls help
            power Corner League community recognition, sponsor insights, and fan
            engagement.
          </p>
        </section>

        {featuredLoading ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8 text-white/50">
            Loading featured poll...
          </div>
        ) : featuredPoll ? (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-yellow-200">
                  <Trophy className="h-3.5 w-3.5" />
                  Featured Poll
                </div>
              </div>

              <Link href={`/polls/${featuredPoll.id}`}>
                <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/70 hover:bg-white/10 hover:text-white">
                  Open Full Page
                  <ChevronRight className="h-4 w-4" />
                </button>
              </Link>
            </div>

            <PollCard poll={featuredPoll} sourcePage="polls_page_featured" />
          </section>
        ) : null}

        <PollGrid
          title="Active Polls"
          polls={activePolls}
          loading={isLoading}
        />

        {closedPolls.length > 0 ? (
          <div className="mt-12">
            <PollGrid title="Closed Polls" polls={closedPolls} />
          </div>
        ) : null}
      </main>
    </div>
  );
}

function PollGrid({
  title,
  polls,
  loading,
}: {
  title: string;
  polls: Poll[];
  loading?: boolean;
}) {
  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">
          {title}
        </h2>

        <div className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
          {polls.length} polls
        </div>
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8 text-white/50">
          Loading polls...
        </div>
      ) : polls.length === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8 text-white/50">
          No polls available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {polls.map((poll) => (
            <Link key={poll.id} href={`/polls/${poll.id}`}>
              <button className="group h-full w-full overflow-hidden rounded-[28px] border border-cyan-300/10 bg-[#07111F]/90 p-5 text-left shadow-[0_18px_45px_rgba(0,0,0,0.25)] transition hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-cyan-300/[0.045]">
                {poll.coverImageUrl ? (
                  <img
                    src={poll.coverImageUrl}
                    alt={poll.title}
                    className="mb-4 h-40 w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="mb-4 flex h-40 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-cyan-200/50">
                    <Vote className="h-10 w-10" />
                  </div>
                )}

                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">
                    {labelize(poll.category)}
                  </span>

                  <span className="inline-flex items-center gap-1 text-xs text-white/40">
                    <BarChart3 className="h-3.5 w-3.5" />
                    {poll.status}
                  </span>
                </div>

                <h3 className="line-clamp-2 text-xl font-black uppercase leading-tight text-white group-hover:text-cyan-100">
                  {poll.title}
                </h3>

                {poll.description ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/55">
                    {poll.description}
                  </p>
                ) : null}

                {poll.endsAt ? (
                  <div className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-white/35">
                    Ends {formatDate(poll.endsAt)}
                  </div>
                ) : null}
              </button>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
