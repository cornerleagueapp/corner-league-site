import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
type Activity = {
  id: string;
  title: string;
  kind: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  publicNotes: string;
};
type EventPlan = {
  eventId: string;
  organizationId: string;
  sportKey: string;
  activities: Activity[];
  publishedAt: string | null;
};
const time = (value: string) =>
  new Date(value).toLocaleString(undefined, { timeZoneName: "short" });
export default function PublicEventPlan({
  eventId,
  organizationId,
  sandbox = false,
}: {
  eventId: string;
  organizationId?: string;
  sandbox?: boolean;
}) {
  const query = useQuery<EventPlan | null>({
    queryKey: ["published-event-plan", eventId, organizationId, sandbox],
    enabled: !!eventId && !sandbox,
    queryFn: async ({ signal }) => {
      const response = await apiFetch(
        `/competition-plan/events/${encodeURIComponent(eventId)}`,
        { skipAuth: true, noRefresh: true, signal },
      );
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Event guidance could not be loaded.");
      const json = await response.json();
      const plan = (json.data ?? json) as EventPlan;
      if (
        plan.eventId !== eventId ||
        (organizationId && plan.organizationId !== organizationId) ||
        !Array.isArray(plan.activities)
      )
        throw new Error("Event guidance does not match this event.");
      return plan;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });
  if (sandbox) return null;
  if (query.isLoading)
    return (
      <p role="status" className="text-sm text-cl-muted">
        Loading event guidance…
      </p>
    );
  if (query.isError)
    return (
      <section
        aria-label="Event guidance"
        className="rounded-2xl border border-cl-border bg-cl-surface p-5"
      >
        <p role="alert" className="text-cl-muted">
          Event guidance is temporarily unavailable.
        </p>
        <button
          className="mt-3 min-h-11 rounded-full border border-cl-border px-5"
          onClick={() => void query.refetch()}
        >
          Retry guidance
        </button>
      </section>
    );
  if (!query.data?.activities.length) return null;
  return (
    <section
      aria-label="Published event guidance"
      className="rounded-[24px] border border-cl-accent/15 bg-cl-surface p-5 sm:p-7"
    >
      <h2 className="text-xl font-black text-cl-ink">
        Event guidance & activities
      </h2>
      <p className="mt-2 text-sm text-cl-muted">
        Organizer-published check-in, briefings and event activities.
        Competition schedules and results are shown separately.
      </p>
      <ol className="mt-5 space-y-4">
        {query.data.activities.map((activity) => (
          <li
            key={activity.id}
            className="rounded-2xl border border-cl-border p-4"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-cl-accent">
              {activity.kind.replace(/-/g, " ")}
            </p>
            <h3 className="mt-1 break-words font-bold text-cl-ink">
              {activity.title}
            </h3>
            <p className="mt-2 text-sm text-cl-muted">
              <time dateTime={activity.startsAt}>
                {time(activity.startsAt)}
              </time>{" "}
              – <time dateTime={activity.endsAt}>{time(activity.endsAt)}</time>
            </p>
            {activity.venue && (
              <p className="mt-2 break-words text-sm text-cl-ink">
                {activity.venue}
              </p>
            )}
            {activity.publicNotes && (
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-cl-muted">
                {activity.publicNotes}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
