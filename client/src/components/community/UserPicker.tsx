import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { loadPeople, type Person } from "@/lib/socialApi";
import {
  Pagination,
  SocialFailure,
  socialBox,
  socialButton,
  socialInput,
} from "./SocialPosts";
export default function UserPicker({
  open,
  onClose,
  onSelectUser,
}: {
  open: boolean;
  onClose: () => void;
  onSelectUser: (person: Person) => void;
}) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [page, setPage] = useState(1);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  const query = useQuery({
    queryKey: ["social-user-search", user?.id, submitted, page],
    queryFn: () => loadPeople(submitted, page),
    enabled: open && !!user?.id,
    retry: false,
    staleTime: 30_000,
  });
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClose={onClose}
      aria-labelledby="message-user-title"
      className="w-[min(95vw,540px)] max-h-[85vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#07111f] p-0 text-white backdrop:bg-black/70"
    >
      <section className={socialBox}>
        <div className="flex items-center justify-between gap-2">
          <h2 id="message-user-title" className="text-xl font-bold">
            New message
          </h2>
          <button type="button" className={socialButton} onClick={onClose}>
            Close
          </button>
        </div>
        <form
          className="my-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(search.trim());
            setPage(1);
          }}
        >
          <input
            aria-label="Search users"
            maxLength={80}
            placeholder="Name or username"
            className={socialInput}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className={socialButton}>Search</button>
        </form>
        {query.isPending ? (
          <p role="status">Loading users…</p>
        ) : query.isError ? (
          <>
            <SocialFailure error={query.error} />
            <button
              className={socialButton}
              onClick={() => void query.refetch()}
            >
              Retry
            </button>
          </>
        ) : (
          <>
            {!query.data?.items.length && (
              <p className="py-6 text-white/60">No matching users.</p>
            )}
            {query.data?.items.map((person) => (
              <button
                key={person.id}
                type="button"
                className="mb-2 w-full rounded-xl border border-white/10 p-3 text-left hover:bg-white/10"
                onClick={() => onSelectUser(person)}
              >
                <strong>@{person.username}</strong>
                <span className="ml-2 text-sm text-white/50">
                  {person.firstName} {person.lastName}
                </span>
              </button>
            ))}
            <Pagination
              page={page}
              hasNext={query.data?.hasNextPage ?? false}
              setPage={setPage}
            />
          </>
        )}
      </section>
    </dialog>
  );
}
