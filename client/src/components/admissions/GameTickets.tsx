import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  admissionAvailability,
  admissionData,
  admissionKey,
  type AdmissionType,
} from "@/lib/admissions";

export function GameTickets({
  season,
  game,
  startsAt,
  enabled,
  compact = false,
  title,
}: {
  season: string;
  game: string;
  startsAt: string;
  enabled: boolean;
  compact?: boolean;
  title?: string;
}) {
  const key = admissionKey(`game:${season}:${game}`);
  const upcoming = enabled && Date.parse(startsAt) > Date.now();
  const result = useQuery({
    queryKey: ["public-game-ticket-options", key],
    queryFn: () =>
      admissionData<{ items: AdmissionType[] }>(
        `/admissions/events/${key}/types`,
      ),
    enabled: upcoming,
    staleTime: 30000,
    retry: false,
  });
  if (!upcoming || !result.data?.items.some((t) => !admissionAvailability(t)))
    return null;
  const link = (
    <Link
      href={`/admissions/${key}`}
      className="inline-flex min-h-11 items-center rounded-xl bg-cl-accent px-4 font-bold text-cl-contrast"
    >
      Get tickets
    </Link>
  );
  if (title)
    return (
      <article className="admission-card">
        <div className="admission-card-body">
          <h2>{title}</h2>
          <p>{new Date(startsAt).toLocaleString()}</p>
          {link}
        </div>
      </article>
    );
  return compact ? (
    link
  ) : (
    <section className="cl-team-panel">
      <h2>Get tickets</h2>
      <p>Reserve your place at this game.</p>
      {link}
    </section>
  );
}
