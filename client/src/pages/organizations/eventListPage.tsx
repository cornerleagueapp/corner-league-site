import React, { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/apiClient";

import { OrganizationAdminLayout } from "@/features/organization-admin/components/OrganizationAdminLayout";

type SportEventOrganizer = {
  id: string;
  name: string;
  abbreviation?: string | null;
};

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

  organizer?: SportEventOrganizer | null;
  organizerId?: string | null;
};

type OrganizationFilterOption = {
  id: string;
  name: string;
  abbreviation?: string | null;
};

type EventListPageProps = {
  organizationId?: string;
};

const PAGE_SIZE = 25;

function getOrganizerId(event: SportEvent) {
  return event.organizer?.id ?? event.organizerId ?? null;
}

function getOrganizerLabel(event: SportEvent) {
  return (
    event.organizer?.abbreviation || event.organizer?.name || "Organization"
  );
}

export default function EventListPage({ organizationId }: EventListPageProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const isSuperAdmin = String(user?.role ?? "").toUpperCase() === "SUPER_ADMIN";

  /**
   * Normal organization admins are permanently scoped to the org from
   * the route.
   *
   * SUPER_ADMIN starts with "all" and may optionally filter by org.
   */
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>(
    isSuperAdmin ? "all" : (organizationId ?? ""),
  );

  const [organizationOptions, setOrganizationOptions] = useState<
    OrganizationFilterOption[]
  >([]);

  const [loadingOrganizations, setLoadingOrganizations] = useState(false);

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const effectiveOrganizationId = useMemo(() => {
    if (!isSuperAdmin) {
      return organizationId ?? "";
    }

    return selectedOrganizationId === "all" ? "" : selectedOrganizationId;
  }, [isSuperAdmin, organizationId, selectedOrganizationId]);

  const fmtDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  /**
   * Keep normal organization members locked to their own organization
   * even if the prop changes.
   */
  useEffect(() => {
    if (!isSuperAdmin) {
      setSelectedOrganizationId(organizationId ?? "");
    }
  }, [isSuperAdmin, organizationId]);

  /**
   * SUPER_ADMIN organization selector.
   *
   * We build the selectable org list from loaded events so this page does
   * not depend on a second organization-list API.
   *
   * If you later want every organization listed even when it has zero
   * events, replace this with your existing organization-list service.
   */
  useEffect(() => {
    if (!isSuperAdmin) {
      return;
    }

    const organizerMap = new Map<string, OrganizationFilterOption>();

    for (const event of events) {
      const id = getOrganizerId(event);

      if (!id) {
        continue;
      }

      organizerMap.set(id, {
        id,
        name: event.organizer?.name ?? "Organization",
        abbreviation: event.organizer?.abbreviation ?? null,
      });
    }

    setOrganizationOptions((current) => {
      const merged = new Map(
        current.map((organization) => [organization.id, organization]),
      );

      for (const organization of organizerMap.values()) {
        merged.set(organization.id, organization);
      }

      return Array.from(merged.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    });
  }, [events, isSuperAdmin]);

  async function load(pageToLoad = page) {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(pageToLoad),
        limit: String(PAGE_SIZE),
        sortBy: "startDate",
        order: "DESC",
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      /**
       * Normal org admins:
       * always scoped to organizationId.
       *
       * SUPER_ADMIN:
       * no organizerId = all events
       * organizerId set = filtered organization
       */
      const endpoint = effectiveOrganizationId
        ? `/sport-event/organization/${encodeURIComponent(
            effectiveOrganizationId,
          )}?${params.toString()}`
        : `/sport-event?${params.toString()}`;

      const res = await apiFetch(endpoint, {
        method: "GET",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json?.message || json?.error || "Failed to load events.",
        );
      }

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
        setTotalCount((previous) =>
          pageToLoad === 1
            ? parsedEvents.length
            : Math.max(
                previous,
                (pageToLoad - 1) * PAGE_SIZE + parsedEvents.length,
              ),
        );
      }

      if (typeof explicitHasNext === "boolean") {
        setHasNextPage(explicitHasNext);
      } else {
        setHasNextPage(parsedEvents.length === PAGE_SIZE);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Unable to load events",
        description: error?.message || "Failed to load events.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(page);
  }, [page, search, effectiveOrganizationId]);

  async function doDelete(id: string) {
    try {
      const res = await apiFetch(`/sport-event/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));

        throw new Error(json?.message || "Delete failed");
      }

      toast({
        title: "Deleted",
        description: "Event deleted successfully.",
      });

      setPendingDelete(null);

      const newTotal = Math.max(0, totalCount - 1);

      const newTotalPages = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));

      if (page > newTotalPages) {
        setPage(newTotalPages);
      } else {
        await load(page);
      }

      setTotalCount(newTotal);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Unable to delete event",
        description: error?.message || "Failed to delete event.",
      });
    } finally {
      setPendingDelete(null);
    }
  }

  const rangeLabel = useMemo(() => {
    if (events.length === 0) {
      return "Showing 0 events";
    }

    const start = (page - 1) * PAGE_SIZE + 1;

    const end = start + events.length - 1;

    return totalCount > 0
      ? `Showing ${start}-${end} of ${totalCount} events`
      : `Showing ${events.length} events`;
  }, [events.length, page, totalCount]);

  const pageEyebrow = isSuperAdmin
    ? effectiveOrganizationId
      ? "Filtered Organization Events"
      : "Platform Events"
    : "Organization Events";

  const pageDescription = isSuperAdmin
    ? effectiveOrganizationId
      ? "Search, create, edit, and manage events for the selected organization."
      : "Search, create, edit, and manage events across the Corner League platform."
    : "Search, create, edit, and manage events belonging to this organization.";

  /**
   * A normal org admin always creates within their org.
   *
   * SUPER_ADMIN:
   * - if filtering one organization, create under that org
   * - otherwise fall back to the global create-event route
   */
  const createEventHref = effectiveOrganizationId
    ? `/organizations/${encodeURIComponent(
        effectiveOrganizationId,
      )}/admin/events/create`
    : "/events/create";

  const content = (
    <div className="space-y-6">
      {/* Page heading */}
      <section>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                {pageEyebrow}
              </div>

              <div className="inline-flex items-center rounded-full border border-[#FF6B35]/15 bg-[#FF6B35]/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#FFB199]">
                {rangeLabel}
              </div>
            </div>

            <h2 className="text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">
              Manage Events
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              {pageDescription}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] px-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300">
              Total: {totalCount || events.length}
            </div>

            <Link href={createEventHref}>
              <Button
                className="h-11 w-full rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-[#04101C] transition hover:bg-cyan-200 sm:w-auto"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Event
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.025]">
        <div className="border-b border-white/10 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200/70">
                Event Search
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Filter by event name, sport, location
                {isSuperAdmin ? ", or organization." : "."}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 lg:flex-row xl:w-auto">
              {isSuperAdmin ? (
                <div className="relative min-w-0 lg:w-[280px]">
                  <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                  <select
                    value={selectedOrganizationId}
                    disabled={loadingOrganizations}
                    onChange={(event) => {
                      setSelectedOrganizationId(event.target.value);

                      setPage(1);
                    }}
                    className="h-12 w-full appearance-none rounded-[16px] border border-white/10 bg-[#0A1727] pl-11 pr-10 text-sm font-bold text-white outline-none transition focus:border-cyan-300/25"
                  >
                    <option value="all">All Organizations</option>

                    {organizationOptions.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.abbreviation
                          ? `${organization.abbreviation} — ${organization.name}`
                          : organization.name}
                      </option>
                    ))}
                  </select>

                  <Filter className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
              ) : null}

              <div className="flex h-12 w-full items-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.035] px-3 lg:w-[360px]">
                <Search className="h-4 w-4 shrink-0 text-slate-500" />

                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      setPage(1);
                      setSearch(searchInput);
                    }
                  }}
                  placeholder="Search events..."
                  className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                />
              </div>

              <Button
                variant="outline"
                className="h-12 rounded-full border-cyan-300/15 bg-cyan-300/10 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-300/15 hover:text-white"
                onClick={() => {
                  setPage(1);
                  setSearch(searchInput);
                }}
              >
                Search
              </Button>

              <Button
                variant="ghost"
                className="h-12 rounded-full border border-white/10 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 hover:bg-white/10 hover:text-white"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);

                  if (isSuperAdmin) {
                    setSelectedOrganizationId("all");
                  }
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
            <div className="rounded-[22px] border border-white/10 bg-white/[0.025] p-8 text-center text-sm text-slate-500">
              Loading events…
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.015] px-5 py-12 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.04] text-cyan-200/55">
                <CalendarDays className="h-5 w-5" />
              </div>

              <h3 className="mt-4 text-base font-black uppercase text-white">
                No events found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {search || effectiveOrganizationId
                  ? "No events match the current filters."
                  : "No Corner League events are available yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {events.map((event) => {
                  const dateRange = `${fmtDate(event.startDate)} → ${fmtDate(
                    event.endDate,
                  )}`;

                  const eventOrganizerId = getOrganizerId(event);

                  /**
                   * Prefer the event's own organizer for SUPER_ADMIN
                   * edit links when viewing all organizations.
                   *
                   * For normal admins, effectiveOrganizationId is always
                   * the route org.
                   */
                  const editOrganizationId =
                    eventOrganizerId || effectiveOrganizationId;

                  const editHref = editOrganizationId
                    ? `/organizations/${encodeURIComponent(
                        editOrganizationId,
                      )}/admin/events/${event.id}`
                    : `/organization/events/${event.id}`;

                  return (
                    <Card
                      key={event.id}
                      className="group overflow-hidden rounded-[22px] border border-white/10 bg-[#0B1726] p-0 transition hover:border-cyan-300/20 hover:bg-[#0C1A2B]"
                    >
                      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-cyan-200">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {event.sport || "Sport"}
                            </div>

                            {isSuperAdmin && event.organizer ? (
                              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-300">
                                <Building2 className="h-3.5 w-3.5 text-cyan-200" />

                                {getOrganizerLabel(event)}
                              </div>
                            ) : null}

                            {event.location ? (
                              <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/15 bg-[#FF6B35]/[0.06] px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#FFB199]">
                                <MapPin className="h-3.5 w-3.5" />

                                <span className="max-w-[220px] truncate">
                                  {event.location}
                                </span>
                              </div>
                            ) : null}
                          </div>

                          <div className="mt-3 break-words text-lg font-black uppercase tracking-[-0.02em] text-white sm:text-xl">
                            {event.name}
                          </div>

                          <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                            {dateRange}
                          </div>

                          {event.description ? (
                            <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-400">
                              {event.description}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:flex-col">
                          <Link href={editHref}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-11 w-full rounded-full border-cyan-300/15 bg-cyan-300/10 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-300/15 hover:text-white lg:w-[120px]"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                          </Link>

                          <AlertDialog
                            open={pendingDelete === event.id}
                            onOpenChange={(open) => {
                              if (!open) {
                                setPendingDelete(null);
                              }
                            }}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-11 w-full rounded-full border border-red-400/15 bg-red-500/10 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-red-200 hover:bg-red-500/20 hover:text-red-100 lg:w-[120px]"
                                onClick={() => setPendingDelete(event.id)}
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
                                  “{event.name}” will be permanently removed.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-full border border-white/10 bg-white/[0.05] px-5 text-white hover:bg-white/10">
                                  Cancel
                                </AlertDialogCancel>

                                <AlertDialogAction
                                  className="rounded-full bg-red-500 px-5 text-white hover:bg-red-600"
                                  onClick={() => doDelete(event.id)}
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
                <div className="text-sm text-slate-500">
                  Page {page} of {Math.max(totalPages, page)}
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 rounded-full border-white/10 bg-white/[0.035] px-4 text-slate-300 hover:bg-white/10 hover:text-white"
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
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
                    className="h-11 rounded-full border-white/10 bg-white/[0.035] px-4 text-slate-300 hover:bg-white/10 hover:text-white"
                    onClick={() => setPage((current) => current + 1)}
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
      </section>
    </div>
  );

  /**
   * Org-admin route:
   * use the exact same shell/padding/header as Results, Members,
   * Payments, etc.
   *
   * The SUPER_ADMIN "all organizations" behavior still works inside the
   * organization admin shell because global admin access bypasses normal
   * membership checks.
   */
  if (organizationId) {
    return (
      <OrganizationAdminLayout organizationId={organizationId}>
        {content}
      </OrganizationAdminLayout>
    );
  }

  /**
   * Legacy/global event-list route.
   *
   * Keep it usable for SUPER_ADMIN without forcing an organization
   * context.
   */
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#030913] text-white">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {content}
      </main>
    </div>
  );
}
