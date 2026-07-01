import { useMemo, useState } from "react";
import { Plus, RefreshCcw, Vote } from "lucide-react";
import {
  useAdminPolls,
  useDeletePoll,
  useSetFeaturedPoll,
} from "@/features/polls/hooks/usePolls";
import type { AdminPollListItem } from "@/features/polls/types/poll.types";
import { AdminPollsTable } from "@/features/polls/admin/AdminPollsTable";
import { CreatePollModal } from "@/features/polls/admin/CreatePollModal";
import { EditPollModal } from "@/features/polls/admin/EditPollModal";
import { PollResultsPanel } from "@/features/polls/admin/PollResultsPanel";

export default function AdminPollsPage() {
  const { data, isLoading, refetch } = useAdminPolls();

  const polls = Array.isArray(data) ? data : [];
  const setFeaturedMutation = useSetFeaturedPoll();
  const deletePollMutation = useDeletePoll();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState<AdminPollListItem | null>(
    null,
  );
  const [selectedPoll, setSelectedPoll] = useState<AdminPollListItem | null>(
    null,
  );

  const stats = useMemo(() => {
    const totalVotes = polls.reduce((sum, poll) => sum + poll.totalVotes, 0);
    const active = polls.filter((poll) => poll.status === "active").length;
    const featured = polls.find((poll) => poll.isFeatured);

    return {
      totalPolls: polls.length,
      active,
      totalVotes,
      featuredTitle: featured?.title ?? "None selected",
    };
  }, [polls]);

  async function handleSetFeatured(poll: AdminPollListItem) {
    if (!window.confirm(`Set "${poll.title}" as the featured poll?`)) return;

    await setFeaturedMutation.mutateAsync(poll.id);
    await refetch();
  }

  async function handleDelete(poll: AdminPollListItem) {
    if (
      !window.confirm(
        `Delete "${poll.title}"? This cannot be undone and will remove votes.`,
      )
    ) {
      return;
    }

    await deletePollMutation.mutateAsync(poll.id);

    if (selectedPoll?.id === poll.id) {
      setSelectedPoll(null);
    }

    await refetch();
  }

  return (
    <div className="min-h-screen bg-[#030913] text-white">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),linear-gradient(90deg,rgba(4,19,34,0.98),rgba(0,34,68,0.92),rgba(4,19,34,0.98))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.38)] sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200">
            <Vote className="h-4 w-4" />
            Super Admin · Polls
          </div>

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
                Polls Console
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Create fan votes, monitor live results, choose the featured
                poll, and manage public voting across Corner League.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void refetch()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/75 hover:bg-white/10"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>

              <button
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-cyan-100 hover:bg-cyan-300/20"
              >
                <Plus className="h-4 w-4" />
                Create Poll
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Stat label="Total Polls" value={stats.totalPolls} />
            <Stat label="Active Polls" value={stats.active} />
            <Stat label="Total Votes" value={stats.totalVotes} />
            <Stat label="Featured" value={stats.featuredTitle} truncate />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <AdminPollsTable
            polls={polls}
            loading={isLoading}
            selectedPollId={selectedPoll?.id}
            onSelectPoll={setSelectedPoll}
            onEditPoll={setEditingPoll}
            onSetFeatured={handleSetFeatured}
            onDeletePoll={handleDelete}
          />

          <PollResultsPanel poll={selectedPoll} />
        </div>
      </div>

      <CreatePollModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <EditPollModal
        open={Boolean(editingPoll)}
        poll={editingPoll}
        onClose={() => setEditingPoll(null)}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  truncate,
}: {
  label: string;
  value: string | number;
  truncate?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/60">
        {label}
      </div>
      <div
        className={`mt-2 text-xl font-black text-white ${
          truncate ? "truncate" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
