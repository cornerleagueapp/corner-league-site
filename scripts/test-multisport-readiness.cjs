const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react"),
  { renderToStaticMarkup } = require("react-dom/server");
function compile(file, overrides = {}) {
  const m = new Module(file, module);
  m.paths = module.paths;
  m.require = (n) => overrides[n] ?? require(n);
  m._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    file,
  );
  return m.exports;
}

const team = compile("client/src/lib/teamSports.ts", {
  "./sportRegistration": {},
  "./apiClient": {},
});
const d = {
  id: "season",
  organizationId: "org",
  sportKey: "soccer",
  scoreLabel: "Goals",
  periodLabel: "Period",
  divisions: [
    { id: "open", name: "Open" },
    { id: "junior", name: "Junior" },
  ],
  teams: Array.from({ length: 12 }, (_, i) => ({
    id: String(i),
    name: `Team ${i}`,
    divisionId: i < 10 ? "open" : "junior",
    players: [],
  })),
  games: [
    {
      id: "a",
      homeTeamId: "0",
      awayTeamId: "1",
      startsAt: "2026-11-01T12:00:00Z",
      status: "scheduled",
    },
    {
      id: "b",
      homeTeamId: "10",
      awayTeamId: "11",
      startsAt: "2026-11-02T12:00:00Z",
      status: "cancelled",
    },
    {
      id: "c",
      homeTeamId: "2",
      awayTeamId: "3",
      startsAt: "2026-11-03T12:00:00Z",
      status: "scheduled",
    },
  ],
  results: [
    { gameId: "c", homeScore: 1, awayScore: 0, status: "final", periods: [] },
  ],
  standings: [],
};
assert.equal(team.validatePublicTeamSeason(d, "season", "org", "soccer"), d);
assert.equal(team.seasonView(d, "open", "all").teams.length, 10);
assert.deepEqual(
  team.seasonView(d, "junior", "cancelled").games.map((g) => g.id),
  ["b"],
);
assert.deepEqual(
  team.seasonView(d, "open", "final").games.map((g) => g.id),
  ["c"],
);
assert.deepEqual(
  team.seasonView(d, "open", "scheduled").games.map((g) => g.id),
  ["a"],
);
assert.equal(team.pageItems(d.teams, 2, 6).items[0].id, "6");
assert.equal(team.pageItems(d.teams, 999, 6).page, 2);
assert.equal(team.pageItems([], 1, 6).pages, 1);
for (const bad of [
  null,
  { ...d, teams: [null] },
  { ...d, teams: [{ ...d.teams[0], players: [null] }] },
  { ...d, games: [{ ...d.games[0], awayTeamId: "foreign" }] },
  { ...d, results: [null] },
  { ...d, standings: [{ rows: [null] }] },
])
  assert.throws(
    () => team.validatePublicTeamSeason(bad, "season", "org", "soccer"),
    /Season data/,
  );
const ui = compile("client/src/components/team-sports/TeamSeasons.tsx", {
  "@/components/admissions/AdmissionOffer": { AdmissionOffer: () => null },
  "@/lib/teamSports": team,
  "@/pages/organizations/SandboxContext": { useSandbox: () => null },
  wouter: {
    Link: ({ href, children }) => React.createElement("a", { href }, children),
  },
});
const html = renderToStaticMarkup(
  React.createElement(ui.SeasonDetails, { data: d }),
);
assert(html.includes("Game status"));
assert(html.includes("All divisions"));
assert(html.includes("Next teams"));
assert(html.includes("local time zone"));
assert(html.includes('dateTime="2026-11-01T12:00:00Z"'));
assert(!html.includes("Team 6</h5>"));
console.log(
  "PASS division/status filters, bounded paging, local game times, mobile browsing markup and malformed nested data handling.",
);
