import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, X } from "lucide-react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useSportSelection } from "@/hooks/useSportSelection";
import { sportVisual } from "@/lib/sportVisuals";
import { directorySearch } from "@/lib/profileDirectory";
import AccountAvatar from "@/components/community/AccountAvatar";
function subscribeMobile(callback: () => void) {
  const m = window.matchMedia("(max-width: 1023px)");
  m.addEventListener("change", callback);
  return () => m.removeEventListener("change", callback);
}
function mobileSnapshot() {
  return window.matchMedia("(max-width: 1023px)").matches;
}
export default function NavbarSearch() {
  const mobile = useSyncExternalStore(
    subscribeMobile,
    mobileSnapshot,
    () => false,
  );
  const auth = useAuth();
  const client = useQueryClient();
  const { sportKey } = useSportSelection();
  const label = sportVisual(sportKey).label;
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<"users" | "athletes">("athletes");
  const anchor = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  useEffect(() => {
    const openAthletes = () => {
      setKind("athletes"); setOpen(true);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    };
    window.addEventListener("racer-search:open", openAthletes);
    return () => window.removeEventListener("racer-search:open", openAthletes);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(input.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [input]);
  useEffect(() => {
    setOpen(false);
    setInput("");
    setSearch("");
  }, [location, auth.user?.id]);
  useEffect(() => {
    setInput("");
    setSearch("");
  }, [sportKey]);
  const enabled =
    open &&
    search.length >= 2 &&
    search === input.trim() &&
    (kind === "athletes" || auth.isAuthenticated);
  const results = useInfiniteQuery({
    queryKey: [
      "navbar-directory",
      auth.user?.id ?? "guest",
      kind,
      kind === "athletes" ? sportKey : "",
      search,
    ],
    queryFn: ({ pageParam, signal }) =>
      directorySearch(
        kind,
        sportKey,
        search,
        pageParam,
        auth.isAuthenticated,
        signal,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNextPage ? last.page + 1 : undefined),
    enabled,
    staleTime: 30_000,
    retry: false,
  });
  useEffect(() => {
    const key = [
      "navbar-directory",
      auth.user?.id ?? "guest",
      kind,
      kind === "athletes" ? sportKey : "",
      search,
    ];
    if (!enabled) void client.cancelQueries({ queryKey: key, exact: true });
    return () => {
      void client.cancelQueries({ queryKey: key, exact: true });
    };
  }, [client, auth.user?.id, kind, sportKey, search, enabled]);
  // Closing, clearing, switching tab/sport, or typing again cancels an in-flight request.
  const cacheKey = `${auth.user?.id ?? "guest"}:${kind}:${sportKey}:${search}`;
  const tabs = (
    <div className="navbar-search-tabs" aria-label="Search category">
      <button
        type="button"
        aria-pressed={kind === "users"}
        onClick={() => setKind("users")}
      >
        Users
      </button>
      <button
        type="button"
        aria-pressed={kind === "athletes"}
        onClick={() => setKind("athletes")}
      >
        {label} Athletes
      </button>
    </div>
  );
  const field = () => (
    <label className="navbar-search-field">
      <Search size={18} aria-hidden="true" />
      <span className="sr-only">Search users or athletes</span>
      <input
        ref={inputRef}
        type="search"
        maxLength={80}
        value={input}
        placeholder="Search users or athletes…"
        onFocus={() => setOpen(true)}
        onChange={(e) => setInput(e.target.value)}
        aria-controls={open ? id : undefined}
        autoComplete="off"
      />
    </label>
  );
  const body = (
    <>
      {tabs}
      {kind === "users" && !auth.isAuthenticated ? (
        <p>
          <Link href="/auth">Sign in to search users</Link>
        </p>
      ) : input.trim().length < 2 ? (
        <p role="status">Enter at least 2 characters.</p>
      ) : input.trim() !== search ? (
        <p role="status">Waiting for your search…</p>
      ) : results.isPending ? (
        <p role="status">Searching…</p>
      ) : results.isError ? (
        <div role="alert">
          <p>{results.error.message}</p>
          <button type="button" onClick={() => void results.refetch()}>
            Retry search
          </button>
        </div>
      ) : (
        <>
          {!results.data?.pages.some((p) => p.items.length) && (
            <p role="status">
              No matching {kind === "users" ? "users" : `${label} athletes`}.
            </p>
          )}
          <div className="navbar-search-results" key={cacheKey}>
            {results.data?.pages
              .flatMap((p) => p.items)
              .filter(
                (item, index, all) =>
                  all.findIndex((a) => a.id === item.id) === index,
              )
              .map((item) => (
                <Link
                  key={item.id}
                  href={item.profileUrl}
                  onClick={() => setOpen(false)}
                  className="navbar-search-result"
                >
                  <AccountAvatar
                    picture={item.imageUrl}
                    username={item.username || item.name}
                  />
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {item.username
                        ? `@${item.username}`
                        : item.detail || label}
                    </small>
                  </span>
                </Link>
              ))}
          </div>
          {results.hasNextPage && (
            <button
              className="navbar-search-more"
              type="button"
              disabled={results.isFetchingNextPage}
              onClick={() => void results.fetchNextPage()}
            >
              {results.isFetchingNextPage ? "Loading…" : "Load more"}
            </button>
          )}
        </>
      )}
    </>
  );
  if (mobile)
    return (
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger
          className="navbar-search-mobile-trigger"
          aria-label="Search users or athletes"
        >
          <Search size={21} aria-hidden="true" />
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="navbar-search-mobile-overlay" />
          <Dialog.Content
            className="navbar-search-mobile-panel"
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              inputRef.current?.focus();
            }}
          >
            <div className="navbar-search-mobile-heading">
              <Dialog.Title>Search Corner League</Dialog.Title>
              <Dialog.Close aria-label="Close search">
                <X size={22} />
              </Dialog.Close>
            </div>
            {field()}
            <div id={id}>{body}</div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div
          ref={anchor}
          className="navbar-search-desktop"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              window.requestAnimationFrame(() =>
                document
                  .getElementById(id)
                  ?.querySelector<HTMLButtonElement>("button,a")
                  ?.focus(),
              );
            }
          }}
        >
          {field()}
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          aria-label="Search results"
          id={id}
          className="navbar-search-desktop-panel"
          sideOffset={8}
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (anchor.current?.contains(e.target as Node)) e.preventDefault();
          }}
          onEscapeKeyDown={() => inputRef.current?.focus()}
        >
          {body}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
