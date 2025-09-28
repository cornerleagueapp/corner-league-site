// /components/userSearchModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import stockAvatar from "../assets/stockprofilepicture.jpeg";

type UserLite = {
  id: string | number;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string | null;
};

export default function UserSearchModal({
  open,
  onClose,
  onSelectUser,
}: {
  open: boolean;
  onClose: () => void;
  onSelectUser: (u: UserLite) => void;
}) {
  const [q, setQ] = useState("");
  const [all, setAll] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(false);

  // lock scroll behind the modal
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        // Pull all users once; filter on client as you type (fast UX, minimal backend work).
        const res = await apiRequest<{ data: { users: UserLite[] } }>(
          "GET",
          "/users"
        );
        if (!ignore)
          setAll(Array.isArray(res?.data?.users) ? res.data.users : []);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all.slice(0, 50); // show first page
    return all.filter((u) =>
      [u.username, u.firstName, u.lastName]
        .filter(Boolean)
        .some((t) => String(t).toLowerCase().includes(s))
    );
  }, [q, all]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      {/* Backdrop */}
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Dialog: mobile full-screen; md+ centered card */}
      <div className="relative z-10 mx-auto md:mt-20 md:max-w-xl">
        <div
          className={cn(
            "bg-[#0b0f18] border border-white/10 rounded-none md:rounded-xl w-full",
            "fixed inset-0 md:static md:h-auto"
          )}
        >
          <div className="p-4 border-b border-white/10 sticky top-0 bg-[#0b0f18]">
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search users…"
                className="flex-1 h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm outline-none placeholder:text-white/40 focus:bg-white/7 text-white"
              />
              <button
                onClick={onClose}
                className="h-9 px-3 rounded-md border border-white/10 text-white/80 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>

          <div className="p-2 max-h-[calc(100vh-60px)] overflow-y-auto">
            {loading ? (
              <div className="py-12 text-center text-white/60">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-white/60">
                No users found.
              </div>
            ) : (
              filtered.map((u) => (
                <button
                  key={String(u.id)}
                  onClick={() => onSelectUser(u)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/7 text-left"
                >
                  <img
                    src={u.profilePicture || stockAvatar}
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (img.src !== stockAvatar) img.src = stockAvatar;
                    }}
                    alt={`${u.username} avatar`}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {(u.firstName || "") + " " + (u.lastName || "")}
                    </div>
                    <div className="text-xs text-white/70 truncate">
                      @{u.username}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
