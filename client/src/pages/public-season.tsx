import SeasonRulebooks from "@/components/team-sports/SeasonRulebooks";
import { useEffect, useRef } from "react";
import { Link, useRoute, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { readTeamSeason } from "@/lib/teamSports";
import { seasonHref, seasonTabs } from "@/lib/seasonNavigation";
import { sportOrganization } from "@/lib/sportNavigation";
import { sportVisual } from "@/lib/sportVisuals";
import { BreadcrumbTrail } from "@/components/navigation/Breadcrumbs";
import { SeasonDetails } from "@/components/team-sports/TeamSeasons";
import { PageSEO } from "@/seo/usePageSEO";
export default function PublicSeasonPage() {
  const [, p] = useRoute("/sports/:sportKey/seasons/:seasonId");
  const params = new URLSearchParams(useSearch()),
    org = params.get("org") || "";
  const requestedTab =
    params.get("tab") === "teams" ? "standings" : params.get("tab");
  const tab = seasonTabs.some(([key]) => key === requestedTab)
    ? requestedTab!
    : "overview";
  const q = useQuery({
    queryKey: ["team-season", "public", "guest", org, p?.sportKey, p?.seasonId],
    queryFn: () => readTeamSeason(p!.seasonId, org, p!.sportKey),
    enabled: !!p && !!org,
    staleTime: 15000,
    retry: false,
  });
  const navigationRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navigationRef.current;
    const current = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !current) return;
    const outer = nav.getBoundingClientRect(),
      inner = current.getBoundingClientRect();
    if (inner.left < outer.left || inner.right > outer.right)
      nav.scrollLeft += inner.left - outer.left - 8;
  }, [tab, q.data?.id]);
  if (q.isPending && org)
    return (
      <main className="p-6 text-cl-ink" role="status">
        Loading season…
      </main>
    );
  if (q.isError || !q.data || !p || !org)
    return (
      <main className="p-6 text-cl-ink" role="alert">
        <h1 className="text-2xl font-bold">Season unavailable</h1>
        <p>This season may be private or no longer published.</p>
        {org && (
          <button
            className="mt-3 min-h-11 underline"
            onClick={() => void q.refetch()}
          >
            Try again
          </button>
        )}
        <Link className="ml-4 underline" href="/">
          Return home
        </Link>
      </main>
    );
  const d = q.data;
  return (
    <main className="consumer-document-page min-w-0 space-y-5 p-3 text-cl-ink sm:p-6">
      <PageSEO
        title={`${d.leagueName} · ${d.name} · Corner League`}
        canonicalPath={seasonHref(d.sportKey, d.id, org)}
      />
      <BreadcrumbTrail
        items={[
          { label: "Home", href: "/" },
          {
            label: sportVisual(d.sportKey).label,
            href: `/sports/${d.sportKey}`,
          },
          {
            label: "Leagues & seasons",
            href: `${sportOrganization(d.sportKey, org)}?section=competition`,
          },
          { label: `${d.leagueName} · ${d.name}` },
        ]}
      />
      <section className="min-w-0 rounded-2xl border border-cl-border bg-cl-surface p-4 sm:p-6">
        <h1 className="sr-only">
          {d.leagueName} · {d.name}
        </h1>
        <SeasonDetails
          key={d.id}
          data={d}
          tab={tab}
          navigation={
            <>
              <nav
                ref={navigationRef}
                aria-label="Season sections"
                className="flex min-w-0 gap-2 overflow-x-auto border-y border-cl-border py-3"
              >
                {seasonTabs.map(([key, label]) => (
                  <Link
                    key={key}
                    href={seasonHref(d.sportKey, d.id, org, key)}
                    aria-current={tab === key ? "page" : undefined}
                    className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-semibold ${tab === key ? "border-cl-accent bg-cl-subtle text-cl-accent" : "border-cl-border bg-cl-subtle text-cl-ink"}`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              {tab === "rulebooks" && <SeasonRulebooks seasonId={d.id} />}
            </>
          }
        />
      </section>
    </main>
  );
}
