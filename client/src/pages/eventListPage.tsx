// pages/eventListPage.tsx
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

export default function EventListPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch(
        "/sport-event?page=1&limit=50&sortBy=createdAt&order=DESC",
        { method: "GET" }
      );
      const json = await res.json();
      const list = json?.data?.sportEvents ?? json?.sportEvents ?? [];
      setEvents(Array.isArray(list) ? list : []);
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
    load();
  }, []);

  async function doDelete(id: string) {
    try {
      const res = await apiFetch(`/sport-event/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Delete failed");
      }
      toast({ title: "Deleted", description: "Event deleted successfully." });
      setEvents((prev) => prev.filter((e) => e.id !== id));
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

  return (
    <div className="w-full max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Events</h1>
          <p className="text-sm text-zinc-400">
            Manage your organization’s events.
          </p>
        </div>
        <Link href="/events/create">
          <Button className="bg-white text-black hover:bg-zinc-200" size="sm">
            + New Event
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-zinc-400">Loading…</div>
      ) : events.length === 0 ? (
        <Card className="bg-zinc-900 border border-zinc-700 p-6 text-zinc-300">
          No events yet.
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((e) => {
            const dateRange = `${fmtDate(e.startDate)} → ${fmtDate(e.endDate)}`;
            return (
              <Card
                key={e.id}
                className="bg-zinc-900/70 border border-zinc-700/70 hover:border-zinc-600 transition-colors p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-base sm:text-lg font-semibold text-white break-words">
                      {e.name}
                    </div>

                    {e.location ? (
                      <div className="text-xs text-zinc-400 mt-1 break-words">
                        {e.location}
                      </div>
                    ) : null}

                    {/* Dates + sport */}
                    <div className="text-xs text-zinc-500 mt-1">
                      {dateRange} • {e.sport}
                    </div>

                    {e.description ? (
                      <p className="mt-2 text-sm text-zinc-300 line-clamp-2">
                        {e.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex gap-2 sm:items-center sm:self-start">
                    <Link href={`/organization/events/${e.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
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
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                          onClick={() => setPendingDelete(e.id)}
                        >
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-zinc-950 border-zinc-700 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete this event?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-zinc-400">
                            “{e.name}” will be permanently removed. This action
                            cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600 text-white"
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
      )}
    </div>
  );
}
