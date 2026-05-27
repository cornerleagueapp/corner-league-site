import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/apiClient";
import { Link } from "wouter";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  Search,
  Trash2,
  Pencil,
  X,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type SportEvent = {
  id: string;
  name: string;
  description: string;
  sport: string;
  location: string;
  startDate: string;
  endDate: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

const PAGE_SIZE = 25;

export default function EventListPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  async function load(pageToLoad = page) {
    setLoading(true);
    try {
      const res = await apiFetch(
        `/sport-event?page=${pageToLoad}&limit=${PAGE_SIZE}&sortBy=startDate&order=DESC${search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ""}`,
        { method: "GET" },
      );
      const json = await res.json();

      const list =
        json?.data?.sportEvents ??
        json?.sportEvents ??
        json?.data?.items ??
        json?.items ??
        [];

      const meta = json?.data?.meta ?? json?.meta ?? {};

      const parsedEvents = Array.isArray(list) ? list : [];
      const explicitTotal =
        meta?.totalItems ??
        meta?.total ??
        meta?.itemCount ??
        meta?.count ??
        null;

      const explicitHasNext =
        typeof meta?.hasNextPage === "boolean"
          ? meta.hasNextPage
          : typeof meta?.nextPage === "number"
            ? true
            : null;

      setEvents(parsedEvents);

      if (typeof explicitTotal === "number") {
        setTotalCount(explicitTotal);
      } else {
        // fallback if backend does not expose total
        setTotalCount((prev) =>
          pageToLoad === 1
            ? parsedEvents.length
            : Math.max(
                prev,
                (pageToLoad - 1) * PAGE_SIZE + parsedEvents.length,
              ),
        );
      }

      if (typeof explicitHasNext === "boolean") {
        setHasNextPage(explicitHasNext);
      } else {
        setHasNextPage(parsedEvents.length === PAGE_SIZE);
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Failed to load events.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(page);
  }, [page, search]);

  async function doDelete(id: string) {
    try {
      const res = await apiFetch(`/sport-event/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Delete failed");
      }

      toast({ title: "Deleted", description: "Event deleted successfully." });
      setPendingDelete(null);

      const newTotal = Math.max(0, totalCount - 1);
      const newTotalPages = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));

      if (page > newTotalPages) {
        setPage(newTotalPages);
      } else {
        await load(page);
      }

      setTotalCount(newTotal);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Failed to delete event.",
      });
    } finally {
      setPendingDelete(null);
    }
  }

  const rangeLabel = useMemo(() => {
    if (events.length === 0) return "Showing 0 events";
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = start + events.length - 1;
    return totalCount > 0
      ? `Showing ${start}-${end} of ${totalCount} events`
      : `Showing ${events.length} events`;
  }, [events.length, page, totalCount]);

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#030913] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(255,107,53,0.10),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 pb-24 sm:px-6 sm:py-12 lg:px-8">
        <section className="relative overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.94)_0%,rgba(4,10,19,0.98)_100%)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)] sm:rounded-[38px] sm:p-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
          </div>

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
                  Admin Events
                </div>

                <div className="inline-flex items-center rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB199]">
                  {rangeLabel}
                </div>
              </div>

              <h1 className="text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
                Manage{" "}
                <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#7CF4FF_35%,#FF7849_100%)] bg-clip-text text-transparent">
                  Events
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Search, edit, delete, and create jet ski racing events for the
                Corner League platform.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex items-center justify-center rounded-full border border-cyan-300/15 bg-cyan-300/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
                Total: {totalCount || events.length}
              </div>

              <Link href="/events/create">
                <Button
                  className="h-12 w-full rounded-full bg-cyan-300 px-6 text-xs font-black uppercase tracking-[0.16em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.25)] hover:bg-cyan-200 sm:w-auto"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Event
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <Card className="overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/90 p-0 shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
          <div className="border-b border-white/10 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300/80">
                  Event Search
                </div>
                <p className="mt-1 text-sm text-white/50">
                  Filter by event name, sport, or location.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                <div className="flex h-12 w-full items-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.05] px-3 lg:w-[380px]">
                  <Search className="h-4 w-4 shrink-0 text-white/45" />
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setPage(1);
                        setSearch(searchInput);
                      }
                    }}
                    placeholder="Search events..."
                    className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                  />
                </div>

                <Button
                  variant="outline"
                  className="h-12 rounded-full border-cyan-300/15 bg-cyan-300/10 px-5 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-300/15 hover:text-white"
                  onClick={() => {
                    setPage(1);
                    setSearch(searchInput);
                  }}
                >
                  Search
                </Button>

                <Button
                  variant="ghost"
                  className="h-12 rounded-full border border-white/10 px-5 text-xs font-black uppercase tracking-[0.14em] text-white/65 hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    setPage(1);
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {loading ? (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 text-sm text-white/60">
                Loading events…
              </div>
            ) : events.length === 0 ? (
              <Card className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 text-white/60">
                No events yet.
              </Card>
            ) : (
              <>
                <div className="grid gap-4">
                  {events.map((e) => {
                    const dateRange = `${fmtDate(e.startDate)} → ${fmtDate(e.endDate)}`;

                    return (
                      <Card
                        key={e.id}
                        className="group overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.045] p-0 transition hover:border-cyan-300/25 hover:bg-white/[0.06]"
                      >
                        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {e.sport || "Sport"}
                              </div>

                              {e.location ? (
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/15 bg-[#FF6B35]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB199]">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span className="max-w-[210px] truncate">
                                    {e.location}
                                  </span>
                                </div>
                              ) : null}
                            </div>

                            <div className="mt-3 break-words text-lg font-black uppercase tracking-[-0.02em] text-white sm:text-xl">
                              {e.name}
                            </div>

                            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                              {dateRange}
                            </div>

                            {e.description ? (
                              <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-300">
                                {e.description}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:flex-col">
                            <Link href={`/organization/events/${e.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-11 w-full rounded-full border-cyan-300/15 bg-cyan-300/10 px-5 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-300/15 hover:text-white lg:w-[120px]"
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                            </Link>

                            <AlertDialog
                              open={pendingDelete === e.id}
                              onOpenChange={(open) => {
                                if (!open) setPendingDelete(null);
                              }}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-11 w-full rounded-full border border-red-400/15 bg-red-500/10 px-5 text-xs font-black uppercase tracking-[0.14em] text-red-200 hover:bg-red-500/20 hover:text-red-100 lg:w-[120px]"
                                  onClick={() => setPendingDelete(e.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>

                              <AlertDialogContent className="rounded-[28px] border border-cyan-300/10 bg-[#07111F] text-white shadow-[0_30px_90px_rgba(0,0,0,0.52)]">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-xl font-black uppercase tracking-[-0.02em] text-white">
                                    Delete this event?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-300">
                                    “{e.name}” will be permanently removed. This
                                    action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-full border border-white/10 bg-white/[0.05] px-5 text-white hover:bg-white/10">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    className="rounded-full bg-red-500 px-5 text-white hover:bg-red-600"
                                    onClick={() => doDelete(e.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-white/55">
                    Page {page} of {Math.max(totalPages, page)}
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-11 rounded-full border-white/10 bg-white/[0.05] px-4 text-white hover:bg-white/10"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || loading}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>

                    <div className="grid h-11 min-w-11 place-items-center rounded-full border border-cyan-300/15 bg-cyan-300/10 px-4 text-sm font-black text-cyan-100">
                      {page}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-11 rounded-full border-white/10 bg-white/[0.05] px-4 text-white hover:bg-white/10"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={loading || (!hasNextPage && page >= totalPages)}
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
