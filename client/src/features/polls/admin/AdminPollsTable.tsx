import { Link } from "wouter";
import { Edit, Eye, Star, Trash2 } from "lucide-react";
import type { AdminPollListItem } from "../types/poll.types";
import { PollStatusBadge } from "./PollStatusBadge";

interface AdminPollsTableProps {
  polls: AdminPollListItem[];
  loading?: boolean;
  selectedPollId?: string | null;
  onSelectPoll: (poll: AdminPollListItem) => void;
  onEditPoll: (poll: AdminPollListItem) => void;
  onSetFeatured: (poll: AdminPollListItem) => void;
  onDeletePoll: (poll: AdminPollListItem) => void;
}

function labelize(value: string) {
  return value.replace(/_/g, " ");
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AdminPollsTable({
  polls,
  loading,
  selectedPollId,
  onSelectPoll,
  onEditPoll,
  onSetFeatured,
  onDeletePoll,
}: AdminPollsTableProps) {
  if (loading) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#07111F]/90 p-8 text-center text-white/50">
        Loading polls...
      </div>
    );
  }

  if (!polls.length) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#07111F]/90 p-8 text-center text-white/50">
        No polls created yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#07111F]/90">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 p-3">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.2em] text-white/40">
              <th className="px-3 py-2">Poll</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Votes</th>
              <th className="px-3 py-2">Options</th>
              <th className="px-3 py-2">Featured</th>
              <th className="px-3 py-2">Public</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {polls.map((poll) => {
              const selected = selectedPollId === poll.id;

              return (
                <tr
                  key={poll.id}
                  className={`text-sm text-white/70 ${
                    selected ? "bg-cyan-300/10" : "bg-white/[0.025]"
                  }`}
                >
                  <td className="rounded-l-2xl px-3 py-4">
                    <button
                      onClick={() => onSelectPoll(poll)}
                      className="text-left"
                    >
                      <div className="max-w-[360px] truncate font-black uppercase tracking-wide text-white">
                        {poll.title}
                      </div>
                      <div className="mt-1 text-xs capitalize text-white/40">
                        {labelize(poll.category)}
                      </div>
                    </button>
                  </td>

                  <td className="px-3 py-4">
                    <PollStatusBadge status={poll.status} />
                  </td>

                  <td className="px-3 py-4 font-black text-white">
                    {poll.totalVotes.toLocaleString()}
                  </td>

                  <td className="px-3 py-4">{poll.optionsCount}</td>

                  <td className="px-3 py-4">
                    {poll.isFeatured ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-2.5 py-1 text-xs font-bold text-yellow-200">
                        <Star className="h-3.5 w-3.5" />
                        Yes
                      </span>
                    ) : (
                      <span className="text-white/35">No</span>
                    )}
                  </td>

                  <td className="px-3 py-4">
                    {poll.isPublic ? (
                      <span className="text-emerald-300">Public</span>
                    ) : (
                      <span className="text-white/35">Hidden</span>
                    )}
                  </td>

                  <td className="px-3 py-4">{formatDate(poll.createdAt)}</td>

                  <td className="rounded-r-2xl px-3 py-4">
                    <div className="flex justify-end gap-2">
                      <Link href={`/polls/${poll.id}`}>
                        <button className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white/60 hover:bg-white/10 hover:text-white">
                          <Eye className="h-4 w-4" />
                        </button>
                      </Link>

                      <button
                        onClick={() => onEditPoll(poll)}
                        className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-2 text-cyan-100 hover:bg-cyan-300/20"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onSetFeatured(poll)}
                        className="rounded-xl border border-yellow-300/20 bg-yellow-300/10 p-2 text-yellow-100 hover:bg-yellow-300/20"
                      >
                        <Star className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onDeletePoll(poll)}
                        className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-red-200 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
