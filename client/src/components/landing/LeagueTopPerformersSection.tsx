import { Link } from "wouter";
import type { OrgItem, PerformerItem } from "@/hooks/useScoresLandingData";

type Props = {
  organizations: OrgItem[];
  selectedOrgId: string;
  onSelectOrg: (orgId: string) => void;
  performersByOrg: Record<string, PerformerItem[]>;
  isLoading?: boolean;
};

export default function LeagueTopPerformersSection({
  organizations,
  selectedOrgId,
  onSelectOrg,
  performersByOrg,
  isLoading,
}: Props) {
  const selectedOrg =
    organizations.find((o) => o.id === selectedOrgId) ?? organizations[0];
  const rows = selectedOrg ? (performersByOrg[selectedOrg.id] ?? []) : [];

  return (
    <section id="rankings-section" className="pt-16">
      <div className="mb-2 text-xs uppercase tracking-[0.28em] text-white/40">
        Rankings
      </div>
      <h2 className="text-4xl font-black uppercase sm:text-5xl">
        Leagues &{" "}
        <span className="bg-[#ff9c9c]/25 px-2 text-[#ffb3b3]">
          Top Performers
        </span>
      </h2>

      <div className="mt-8 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max flex-nowrap gap-3 pr-4 sm:min-w-0 sm:flex-wrap sm:pr-0">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => onSelectOrg(org.id)}
              className={`shrink-0 whitespace-nowrap px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] ${
                selectedOrgId === org.id
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/70 hover:bg-white/15"
              }`}
            >
              {org.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="flex min-h-[420px] items-center justify-center bg-[linear-gradient(135deg,#6753a6_0%,#d6253d_55%,#f0a125_100%)] p-8">
          <div className="text-center text-5xl font-black uppercase text-white sm:text-6xl">
            {rows[0]?.name || "Coming Soon"}
          </div>
        </div>

        <div className="border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 px-4 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white/45">
            {selectedOrg?.name || "League"} Standings
          </div>

          {isLoading ? (
            <div className="px-4 py-8 text-white/60">Loading standings…</div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-8 text-white/60">
              Results and matches coming soon.
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10">
              {rows.map((person, idx) => (
                <div
                  key={`${person.participantId}-${idx}`}
                  className="grid grid-cols-[60px_1fr_auto] items-center gap-4 border-b border-white/10 px-4 py-5"
                >
                  <div className="text-4xl font-black text-white/45">
                    {String(idx + 1).padStart(2, "0")}
                  </div>

                  <div>
                    {person.racerHref ? (
                      <Link href={person.racerHref}>
                        <div className="cursor-pointer font-bold uppercase tracking-[0.06em] text-white hover:text-cyan-300">
                          {person.name}
                        </div>
                      </Link>
                    ) : (
                      <div className="font-bold uppercase tracking-[0.06em] text-white">
                        {person.name}
                      </div>
                    )}

                    <div className="mt-1 text-sm text-white/50">
                      {person.className}
                    </div>
                  </div>

                  <div className="text-3xl font-bold text-white">
                    {person.totalPoints}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
