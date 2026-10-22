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
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useSportSelection } from "@/hooks/useSportSelection";
import { sportVisual } from "@/lib/sportVisuals";
import { discovery, searchUrl, labels, visibleGroups, DiscoveryGroup } from "@/features/discovery/api";
import "@/features/discovery/discovery.css";
import { DiscoveryImage } from "@/features/discovery/DiscoveryCards";

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

  const { sportKey } = useSportSelection();

  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");

  const anchor = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  useEffect(() => {
    const openAthletes = () => {
      setOpen(true);
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
  const scopedSport = location === "/" || location === "/search_results" ? "" : sportKey;
  const enabled = open && search.length >= 2 && search === input.trim();
  const results = useQuery({
    queryKey: ["universal-search-preview", auth.user?.id ?? "guest", scopedSport, search],
    queryFn: ({signal}) => discovery<{groups: DiscoveryGroup[]}>("search", {q:search, ...(scopedSport?{sport:scopedSport}:{})}, auth.isAuthenticated, signal),
    enabled, staleTime:60000, retry:false,
  });
  const field = () => (
    <label className="navbar-search-field">
      <Search size={18} aria-hidden="true" />
      <span className="sr-only">Search Corner League</span>
      <input
        ref={inputRef}
        type="search"
        maxLength={80}
        value={input}
        placeholder="Search athletes, users, organizations, events, articles…"
        onKeyDown={e=>{if(e.key === "Enter" && input.trim().length >= 2){setOpen(false);navigate(searchUrl(input.trim(), "all", scopedSport));}}}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onChange={(e) => setInput(e.target.value)}
        aria-controls={open ? id : undefined}
        autoComplete="off"
      />
    </label>
  );
  const body = <>
    {input.trim().length<2?<p role="status">Enter at least two characters.</p>:search!==input.trim()?<p role="status">Waiting for your search…</p>:results.isPending?<p role="status">Searching…</p>:results.isError?<div role="alert">{results.error.message}<button onClick={()=>void results.refetch()}>Retry</button></div>:<>
    {!visibleGroups(results.data?.groups).length&&<p role="status">No results found</p>}
    {visibleGroups(results.data?.groups).map(g=><section className="discovery-preview-section" key={g.kind}><h3>{labels[g.kind]}</h3>{g.signInRequired?<Link href="/auth">Sign in to search users</Link>:!g.items.length?<p>No matches</p>:g.items.slice(0,3).map(i=><Link className="discovery-preview-result" key={i.id} href={i.href} onClick={()=>setOpen(false)}><DiscoveryImage item={i}/><span><strong>{i.name}</strong><small>{g.kind==='users'?'User account':g.kind==='athletes'?'Athlete profile':labels[g.kind]}{i.sport?` · ${sportVisual(i.sport).label}`:''}</small></span></Link>)}{g.hasNextPage&&<Link href={searchUrl(search,g.kind,scopedSport)} onClick={()=>setOpen(false)}>View all {labels[g.kind].toLowerCase()} →</Link>}</section>)}
    {results.data?.groups.some(g=>g.signInRequired)&&<Link href="/auth">Sign in to search users</Link>}
    <Link className="discovery-preview-all" href={searchUrl(search,'all',scopedSport)} onClick={()=>setOpen(false)}>View all results for “{search}” →</Link></>}
  </>;
  if (mobile)
    return (
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger
          className="navbar-search-mobile-trigger"
          aria-label="Search Corner League"
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
