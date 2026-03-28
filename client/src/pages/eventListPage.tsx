import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/apiClient";
import { Link } from "wouter";

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
        `/sport-event?page=${pageToLoad}&limit=${PAGE_SIZE}&sortBy=createdAt&order=DESC`,
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
  }, [page]);

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
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Events</h1>
          <p className="text-sm text-zinc-400">
            Manage your organization’s events.
          </p>
          <p className="mt-1 text-xs text-zinc-500">{rangeLabel}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-1 text-xs text-zinc-300">
            Total: {totalCount || events.length}
          </div>

          <Link href="/events/create">
            <Button className="bg-white text-black hover:bg-zinc-200" size="sm">
              + New Event
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-zinc-400">Loading…</div>
      ) : events.length === 0 ? (
        <Card className="border border-zinc-700 bg-zinc-900 p-6 text-zinc-300">
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
                  className="border border-zinc-700/70 bg-zinc-900/70 p-4 transition-colors hover:border-zinc-600"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="break-words text-base font-semibold text-white sm:text-lg">
                        {e.name}
                      </div>

                      {e.location ? (
                        <div className="mt-1 break-words text-xs text-zinc-400">
                          {e.location}
                        </div>
                      ) : null}

                      <div className="mt-1 text-xs text-zinc-500">
                        {dateRange} • {e.sport}
                      </div>

                      {e.description ? (
                        <p className="mt-2 line-clamp-2 text-sm text-zinc-300">
                          {e.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex gap-2 sm:self-start">
                      <Link href={`/organization/events/${e.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
                        >
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
                            className="text-red-400 hover:bg-red-950/30 hover:text-red-300"
                            onClick={() => setPendingDelete(e.id)}
                          >
                            Delete
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent className="border-zinc-700 bg-zinc-950 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete this event?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-400">
                              “{e.name}” will be permanently removed. This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel className="border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-500 text-white hover:bg-red-600"
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

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-zinc-400">
              Page {page} of {Math.max(totalPages, page)}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>

              <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
                {page}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading || (!hasNextPage && page >= totalPages)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
