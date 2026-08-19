import { useMemo, useState } from "react";
import {
  AlertTriangle,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  UserRoundCheck,
  UserRoundX,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useCreateOrganizationMember,
  useOrganizationMembers,
  useReactivateOrganizationMember,
  useRemoveOrganizationMember,
  useSuspendOrganizationMember,
  useUpdateOrganizationMember,
} from "../hooks/useOrganizationMembers";
import type {
  OrganizationRegistrationMember,
  OrganizationRegistrationMemberStatus,
} from "../types/organizationMembers";
import {
  MemberRoleBadge,
  MemberStatusBadge,
} from "../components/members/MemberRoleBadge";
import { OrganizationAdminLayout } from "../components/OrganizationAdminLayout";
import { MemberEditorModal } from "../components/members/MemberEditorModal";

type Props = {
  organizationId: string;
};

type StatusFilter = "all" | OrganizationRegistrationMemberStatus;

function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function getMemberName(member: OrganizationRegistrationMember) {
  const fullName = [member.user?.firstName, member.user?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    fullName ||
    member.user?.username ||
    member.user?.email ||
    "Corner League User"
  );
}

export function OrganizationMembersPage({ organizationId }: Props) {
  const { user } = useAuth();

  const membersQuery = useOrganizationMembers(organizationId);

  const createMutation = useCreateOrganizationMember(organizationId);

  const updateMutation = useUpdateOrganizationMember(organizationId);

  const suspendMutation = useSuspendOrganizationMember(organizationId);

  const reactivateMutation = useReactivateOrganizationMember(organizationId);

  const removeMutation = useRemoveOrganizationMember(organizationId);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [editorOpen, setEditorOpen] = useState(false);

  const [selectedMember, setSelectedMember] =
    useState<OrganizationRegistrationMember | null>(null);

  const [actionMemberId, setActionMemberId] = useState<string | null>(null);

  const members = membersQuery.data?.members ?? [];

  const filteredMembers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return members.filter((member) => {
      if (statusFilter !== "all" && member.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        getMemberName(member),
        member.user?.email,
        member.user?.username,
        member.role,
        member.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [members, search, statusFilter]);

  const activeCount = members.filter(
    (member) => member.status === "active",
  ).length;

  const suspendedCount = members.filter(
    (member) => member.status === "suspended",
  ).length;

  const ownerCount = members.filter((member) => member.role === "owner").length;

  const modalError = createMutation.error || updateMutation.error;

  const isModalSaving = createMutation.isPending || updateMutation.isPending;

  function openCreate() {
    createMutation.reset();

    updateMutation.reset();

    setSelectedMember(null);

    setEditorOpen(true);
  }

  function openEdit(member: OrganizationRegistrationMember) {
    createMutation.reset();

    updateMutation.reset();

    setSelectedMember(member);

    setActionMemberId(null);

    setEditorOpen(true);
  }

  async function handleCreate(
    input: Parameters<typeof createMutation.mutateAsync>[0],
  ) {
    await createMutation.mutateAsync(input);

    setEditorOpen(false);
  }

  async function handleUpdate(
    input: Parameters<typeof updateMutation.mutateAsync>[0]["input"],
  ) {
    if (!selectedMember) {
      return;
    }

    await updateMutation.mutateAsync({
      memberId: selectedMember.id,
      input,
    });

    setEditorOpen(false);

    setSelectedMember(null);
  }

  async function handleSuspend(member: OrganizationRegistrationMember) {
    const confirmed = window.confirm(
      `Suspend organization access for ${getMemberName(member)}?`,
    );

    if (!confirmed) {
      return;
    }

    await suspendMutation.mutateAsync(member.id);

    setActionMemberId(null);
  }

  async function handleReactivate(member: OrganizationRegistrationMember) {
    await reactivateMutation.mutateAsync(member.id);

    setActionMemberId(null);
  }

  async function handleRemove(member: OrganizationRegistrationMember) {
    const confirmed = window.confirm(
      `Remove ${getMemberName(member)} from organization administration?`,
    );

    if (!confirmed) {
      return;
    }

    await removeMutation.mutateAsync(member.id);

    setActionMemberId(null);
  }

  if (membersQuery.isLoading) {
    return (
      <div className="rounded-[24px] border border-white/10 bg-white/[0.025] p-6">
        <div className="h-4 w-32 animate-pulse rounded bg-white/10" />

        <div className="mt-4 h-8 w-64 animate-pulse rounded bg-white/10" />

        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-2xl bg-white/[0.04]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (membersQuery.isError) {
    return (
      <div className="rounded-[24px] border border-red-300/20 bg-red-300/[0.06] p-6">
        <AlertTriangle className="h-6 w-6 text-red-300" />

        <h2 className="mt-4 text-xl font-black uppercase text-white">
          Members could not be loaded
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {getErrorMessage(membersQuery.error)}
        </p>

        <button
          type="button"
          onClick={() => membersQuery.refetch()}
          className="mt-5 rounded-full border border-white/10 px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <OrganizationAdminLayout organizationId={organizationId}>
        <div className="space-y-6">
          {/* Header */}
          <section>
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                  Organization Team
                </div>

                <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">
                  Members & Permissions
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                  Control who can administer this organization, assign staff
                  roles, and manage exactly which areas each member can access.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreate}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#04101C] transition hover:bg-cyan-200"
              >
                <Plus className="h-4 w-4" />
                Add Member
              </button>
            </div>
          </section>

          {/* Stats */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[24px] border border-white/10 bg-[#0B1726] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
                  <Users className="h-5 w-5" />
                </div>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Total
                </span>
              </div>

              <div className="mt-5 text-3xl font-black text-white">
                {members.length}
              </div>

              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                Members
              </div>
            </div>

            <div className="rounded-[24px] border border-emerald-300/10 bg-[#0B1726] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] text-emerald-200">
                  <UserRoundCheck className="h-5 w-5" />
                </div>

                <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-200">
                  Active
                </span>
              </div>

              <div className="mt-5 text-3xl font-black text-white">
                {activeCount}
              </div>

              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                Active Members
              </div>
            </div>

            <div className="rounded-[24px] border border-amber-300/10 bg-[#0B1726] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] text-amber-200">
                  <UserRoundX className="h-5 w-5" />
                </div>

                <span className="rounded-full border border-amber-300/15 bg-amber-300/[0.06] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-amber-200">
                  Restricted
                </span>
              </div>

              <div className="mt-5 text-3xl font-black text-white">
                {suspendedCount}
              </div>

              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                Suspended
              </div>
            </div>

            <div className="rounded-[24px] border border-cyan-300/10 bg-[#0B1726] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-200">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-cyan-200">
                  Owners
                </span>
              </div>

              <div className="mt-5 text-3xl font-black text-white">
                {ownerCount}
              </div>

              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                Organization Owners
              </div>
            </div>
          </section>

          {/* Member Management */}
          <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[#07111F] shadow-[0_28px_85px_rgba(0,0,0,0.24)]">
            <div className="border-b border-white/10 px-5 py-5 sm:px-6 lg:px-7">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200/65">
                    Access Management
                  </div>

                  <h2 className="mt-1 text-xl font-black uppercase tracking-[-0.02em] text-white sm:text-2xl">
                    Organization Members
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Search existing members, review roles, and manage
                    organization access.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row xl:min-w-[520px]">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search member, email, role..."
                      className="h-12 w-full rounded-[16px] border border-white/10 bg-white/[0.035] pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/25 focus:bg-cyan-300/[0.035] focus:ring-2 focus:ring-cyan-300/10"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as StatusFilter)
                    }
                    className="h-12 rounded-[16px] border border-white/10 bg-[#0A1727] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/25"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="invited">Invited</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 lg:p-6">
              {filteredMembers.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.015] px-5 py-14 text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.04] text-cyan-200/55">
                    <Users className="h-6 w-6" />
                  </div>

                  <h3 className="mt-5 text-lg font-black uppercase text-white">
                    No members found
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    {members.length
                      ? "No members match the current search or status filter."
                      : "Add an existing Corner League account to begin building this organization's administration team."}
                  </p>

                  {!members.length ? (
                    <button
                      type="button"
                      onClick={openCreate}
                      className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-300 hover:text-[#06111D]"
                    >
                      <Plus className="h-4 w-4" />
                      Add First Member
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {filteredMembers.map((member) => {
                    const isCurrentUser =
                      String(member.user?.id) === String(user?.id);

                    const actionOpen = actionMemberId === member.id;

                    return (
                      <article
                        key={member.id}
                        className="relative rounded-[24px] border border-white/10 bg-[#0B1726] p-5 transition hover:border-cyan-300/15 hover:bg-[#0C1A2B]"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                            {member.user?.profilePicture ? (
                              <img
                                src={member.user.profilePicture}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-black text-cyan-100">
                                {getMemberName(member).charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-base font-black text-white">
                                {getMemberName(member)}
                              </h3>

                              {isCurrentUser ? (
                                <span className="rounded-full border border-[#FF6B35]/15 bg-[#FF6B35]/[0.06] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.13em] text-[#FFB199]">
                                  You
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-1 truncate text-xs text-slate-500">
                              {member.user?.email ??
                                member.user?.username ??
                                "No email available"}
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <MemberRoleBadge role={member.role} />
                              <MemberStatusBadge status={member.status} />

                              {member.permissionOverrides &&
                              Object.keys(member.permissionOverrides).length >
                                0 ? (
                                <span className="rounded-full border border-purple-300/15 bg-purple-300/[0.06] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.13em] text-purple-200">
                                  Custom Permissions
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setActionMemberId(actionOpen ? null : member.id)
                              }
                              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.025] text-slate-400 transition hover:border-cyan-300/15 hover:bg-cyan-300/[0.06] hover:text-white"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>

                            {actionOpen ? (
                              <div className="absolute right-0 top-12 z-30 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0A1524] p-1.5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
                                <button
                                  type="button"
                                  onClick={() => openEdit(member)}
                                  className="w-full rounded-xl px-3 py-2.5 text-left text-xs font-bold text-slate-200 transition hover:bg-white/[0.06]"
                                >
                                  Edit Role & Permissions
                                </button>

                                {member.status === "suspended" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleReactivate(member)}
                                    className="w-full rounded-xl px-3 py-2.5 text-left text-xs font-bold text-emerald-200 transition hover:bg-emerald-300/10"
                                  >
                                    Reactivate Access
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={
                                      isCurrentUser || member.role === "owner"
                                    }
                                    onClick={() => handleSuspend(member)}
                                    className="w-full rounded-xl px-3 py-2.5 text-left text-xs font-bold text-amber-200 transition hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:opacity-30"
                                  >
                                    Suspend Access
                                  </button>
                                )}

                                <div className="my-1 border-t border-white/10" />

                                <button
                                  type="button"
                                  disabled={
                                    isCurrentUser || member.role === "owner"
                                  }
                                  onClick={() => handleRemove(member)}
                                  className="w-full rounded-xl px-3 py-2.5 text-left text-xs font-bold text-red-300 transition hover:bg-red-300/10 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  Remove Member
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </OrganizationAdminLayout>

      <MemberEditorModal
        open={editorOpen}
        member={selectedMember}
        isSaving={isModalSaving}
        error={modalError ? getErrorMessage(modalError) : null}
        onClose={() => {
          if (!isModalSaving) {
            setEditorOpen(false);
            setSelectedMember(null);
          }
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </>
  );
}
