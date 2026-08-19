import { useEffect, useMemo, useState } from "react";

import { Check, RotateCcw, ShieldCheck, X } from "lucide-react";

import type {
  CreateOrganizationMemberInput,
  OrganizationPermissionKey,
  OrganizationPermissionOverrides,
  OrganizationRegistrationMember,
  OrganizationRegistrationRole,
  UpdateOrganizationMemberInput,
} from "../../types/organizationMembers";

import {
  ORGANIZATION_PERMISSION_OPTIONS,
  ORGANIZATION_ROLE_OPTIONS,
} from "../../types/organizationMembers";

type Props = {
  open: boolean;

  member?: OrganizationRegistrationMember | null;

  isSaving?: boolean;

  error?: string | null;

  onClose: () => void;

  onCreate: (input: CreateOrganizationMemberInput) => Promise<void> | void;

  onUpdate: (input: UpdateOrganizationMemberInput) => Promise<void> | void;
};

type PermissionMode = "role" | "allow" | "deny";

function getPermissionMode(
  overrides: OrganizationPermissionOverrides,
  key: OrganizationPermissionKey,
): PermissionMode {
  if (overrides[key] === true) {
    return "allow";
  }

  if (overrides[key] === false) {
    return "deny";
  }

  return "role";
}

export function MemberEditorModal({
  open,
  member,
  isSaving = false,
  error,
  onClose,
  onCreate,
  onUpdate,
}: Props) {
  const editing = !!member;

  const [email, setEmail] = useState("");

  const [role, setRole] = useState<OrganizationRegistrationRole>("viewer");

  const [notes, setNotes] = useState("");

  const [permissionOverrides, setPermissionOverrides] =
    useState<OrganizationPermissionOverrides>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setEmail(member?.user?.email ?? "");

    setRole(member?.role ?? "viewer");

    setNotes(member?.notes ?? "");

    setPermissionOverrides({
      ...(member?.permissionOverrides ?? {}),
    });
  }, [open, member]);

  const overrideCount = useMemo(
    () =>
      Object.keys(permissionOverrides).filter(
        (key) =>
          permissionOverrides[key as OrganizationPermissionKey] !== undefined,
      ).length,
    [permissionOverrides],
  );

  if (!open) {
    return null;
  }

  function setPermission(key: OrganizationPermissionKey, mode: PermissionMode) {
    setPermissionOverrides((current) => {
      const next = { ...current };

      if (mode === "role") {
        delete next[key];
      } else {
        next[key] = mode === "allow";
      }

      return next;
    });
  }

  async function handleSubmit() {
    if (editing) {
      await onUpdate({
        role,

        permissionOverrides:
          Object.keys(permissionOverrides).length > 0
            ? permissionOverrides
            : null,

        notes: notes.trim(),
      });

      return;
    }

    if (!email.trim()) {
      return;
    }

    await onCreate({
      email: email.trim(),

      role,

      notes: notes.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close member editor"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!isSaving) {
            onClose();
          }
        }}
      />

      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] border border-white/10 bg-[#07111F] shadow-2xl sm:rounded-[30px]">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFB199]">
              Organization Access
            </div>

            <h2 className="mt-1 text-xl font-black uppercase tracking-[-0.02em] text-white sm:text-2xl">
              {editing ? "Edit Member" : "Add Member"}
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              {editing
                ? "Change this member's organization role or customize individual permissions."
                : "Add an existing Corner League account to this organization's administration team."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-6">
            {!editing ? (
              <section>
                <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Corner League Account Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="racer@example.com"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/30 focus:bg-cyan-300/[0.04]"
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  The user must already have a Corner League account.
                </p>
              </section>
            ) : (
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Member
                </div>

                <div className="mt-1 font-bold text-white">
                  {[member.user?.firstName, member.user?.lastName]
                    .filter(Boolean)
                    .join(" ") ||
                    member.user?.username ||
                    "Corner League User"}
                </div>

                <div className="mt-1 text-xs text-slate-400">
                  {member.user?.email ?? "No email available"}
                </div>
              </section>
            )}

            <section>
              <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Organization Role
              </label>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {ORGANIZATION_ROLE_OPTIONS.map((option) => {
                  const selected = option.value === role;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-cyan-300/30 bg-cyan-300/10"
                          : "border-white/10 bg-white/[0.025] hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-black text-white">
                          {option.label}
                        </span>

                        {selected ? (
                          <Check className="h-4 w-4 text-cyan-200" />
                        ) : null}
                      </div>

                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {editing ? (
              <section>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      Permission Overrides
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Leave a permission on Role Default to inherit access from
                      the selected role.
                    </p>
                  </div>

                  {overrideCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => setPermissionOverrides({})}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-slate-300 transition hover:text-white"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset {overrideCount}
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                  {ORGANIZATION_PERMISSION_OPTIONS.map((permission, index) => {
                    const mode = getPermissionMode(
                      permissionOverrides,
                      permission.key,
                    );

                    return (
                      <div
                        key={permission.key}
                        className={`p-4 ${
                          index > 0 ? "border-t border-white/10" : ""
                        }`}
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 shrink-0 text-slate-500" />

                              <span className="text-sm font-bold text-white">
                                {permission.label}
                              </span>
                            </div>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {permission.description}
                            </p>
                          </div>

                          <div className="grid shrink-0 grid-cols-3 rounded-xl border border-white/10 bg-black/20 p-1">
                            {(
                              ["role", "allow", "deny"] as PermissionMode[]
                            ).map((option) => {
                              const selected = option === mode;

                              return (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() =>
                                    setPermission(permission.key, option)
                                  }
                                  className={`rounded-lg px-3 py-2 text-[9px] font-black uppercase tracking-[0.1em] transition ${
                                    selected
                                      ? option === "allow"
                                        ? "bg-emerald-300/15 text-emerald-200"
                                        : option === "deny"
                                          ? "bg-red-300/15 text-red-200"
                                          : "bg-white/10 text-white"
                                      : "text-slate-500 hover:text-slate-300"
                                  }`}
                                >
                                  {option === "role" ? "Role" : option}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section>
              <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Internal Notes
              </label>

              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Optional notes about this administrator..."
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/30"
              />
            </section>

            {error ? (
              <div className="rounded-2xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-200">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-white/10 bg-[#07111F] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="rounded-full border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-300 transition hover:bg-white/[0.05] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSaving || (!editing && !email.trim())}
            onClick={handleSubmit}
            className="rounded-full bg-[#FF8F70] px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#07111F] transition hover:bg-[#FFA389] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : editing ? "Save Changes" : "Add Member"}
          </button>
        </footer>
      </div>
    </div>
  );
}
