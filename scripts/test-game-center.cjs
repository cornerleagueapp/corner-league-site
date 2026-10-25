const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react"),
  { renderToStaticMarkup: render } = require("react-dom/server");
function compile(rel, mocks = {}) {
  const f = path.resolve(rel),
    m = new Module(f, module);
  m.paths = module.paths;
  m.require = (n) => mocks[n] ?? require(n);
  m._compile(
    ts.transpileModule(fs.readFileSync(f, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    f,
  );
  return m.exports;
}

const Link = ({ href, children, ...props }) =>
  React.createElement("a", { href, ...props }, children);
const logo = { default: () => null, teamColor: () => "#123456" };
const card = compile("client/src/components/team-sports/GameCard.tsx", {
  wouter: { Link },
  "./TeamLogo": logo,
});
const team = (id, name) => ({
  id,
  name,
  divisionId: "d",
  players: [
    {
      profileId: id + "p",
      name: name + " Player",
      number: "1",
      position: "Guard",
    },
  ],
});
const season = {
  id: "season",
  organizationId: "org",
  sportKey: "basketball",
  name: "Winter",
  leagueName: "League",
  teams: [team("a", "Alpha"), team("b", "Beta")],
  games: [
    {
      id: "game",
      homeTeamId: "a",
      awayTeamId: "b",
      startsAt: "2026-11-01T20:00:00Z",
      venue: "Court",
      status: "scheduled",
    },
  ],
  results: [
    {
      gameId: "game",
      status: "final",
      homeScore: 0,
      awayScore: 2,
      periods: [{ label: "Q1", homeScore: 0, awayScore: 2 }],
    },
  ],
  playerStats: [
    {
      profileId: "ap",
      name: "Alpha Player",
      gameId: "game",
      teamId: "a",
      values: { points: 0, assists: 2 },
    },
    {
      profileId: "bp",
      name: "Beta Player",
      gameId: "game",
      teamId: "b",
      values: { points: 2 },
    },
  ],
  standings: [
    {
      divisionId: "d",
      name: "West",
      rows: [
        { teamId: "a", name: "Alpha", wins: 0, losses: 1, played: 1 },
        { teamId: "b", name: "Beta", wins: 1, losses: 0, played: 1 },
      ],
    },
  ],
};
let data = season;
const Page = compile("client/src/pages/public-game.tsx", {
  wouter: {
    Link,
    useRoute: () => [
      true,
      { sportKey: "basketball", seasonId: "season", gameId: "game" },
    ],
    useSearch: () => "?org=org",
  },
  "@tanstack/react-query": { useQuery: () => ({ data }) },
  "@/lib/teamSports": {},
  "@/lib/sportNavigation": {
    sportOrganization: () => "/sports/basketball/organizations/org",
  },
  "@/components/team-sports/GameCard": card,
  "@/components/team-sports/TeamLogo": logo,
  "@/seo/usePageSEO": { PageSEO: () => null },
}).default;
const html = render(React.createElement(Page));
for (const text of [
  "Game leaders",
  "Box score",
  "Team stats",
  "Division standings",
  "Game information",
  "Q1",
])
  assert(html.includes(text), text);
assert(html.includes("/athlete/ap?sport=basketball"));
assert(html.includes("/sports/basketball/teams/season/a?org=org"));
assert(html.includes("<strong>0</strong>"), "preserve zero scores");
assert(html.includes("Not recorded"), "missing stat differs from zero");
data = { ...season, results: [], playerStats: [] };
const empty = render(React.createElement(Page));
assert(empty.includes("Player statistics will appear here when published."));
assert(!empty.includes("NaN"));
data = undefined;
assert(render(React.createElement(Page)).includes("unavailable"));
console.log(
  "PASS game details: linked teams/players, period scores, zero values, missing stats, unpublished/error state.",
);
