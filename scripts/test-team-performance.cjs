const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react"),
  { renderToStaticMarkup } = require("react-dom/server");
function compile(rel, overrides) {
  const file = path.resolve(rel),
    m = new Module(file, module);
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
let query = { isPending: true };
let options;
const gameCard = compile("client/src/components/team-sports/GameCard.tsx", {wouter:{Link:({href,children})=>React.createElement('a',{href},children)}});
const Screen = compile(
  "client/src/components/team-sports/AthleteTeamPerformance.tsx",
  {
    "./GameCard": gameCard,
    wouter: {Link:({href,children})=>React.createElement("a",{href},children)},
    "@tanstack/react-query": {
      useQuery: (o) => {
        options = o;
        return query;
      },
    },
    "@/lib/sportRegistration": {
      publicSportData: async () => ({
        profileId: "wrong",
        sportKey: "basketball",
      }),
    },
  },
).default;
const render = () =>
  renderToStaticMarkup(
    React.createElement(Screen, { id: "athlete", sportKey: "basketball" }),
  );
(async () => {
  assert.match(render(), /Loading performance/);
  query = { isError: true };
  assert.match(render(), /Try again/);
  query = { data: { metrics: ["points", "rebounds"], seasons: [] } };
  assert.match(render(), /No published season/);
  query = {
    data: {
      metrics: ["points", "rebounds"],
      seasons: [
        {
          id: "s",
          name: "Demo season",
          leagueName: "Demo league",
          teamName: "Raptors",
          summary: {
            games: 10,
            totals: { points: 120, rebounds: 40 },
            averages: { points: 12, rebounds: 4 },
          },
          games: [
            {
              gameId: "g",
              startsAt: "2026-10-01T17:00:00Z",
              opponent: "Comets",
              values: { points: 12, rebounds: 4 },
            },
          ],
        },
      ],
    },
  };
  const html = render();
  assert.match(html, /12 total|120 total/);
  assert.match(html, /Points \/ game/);
  assert.match(html, /scroll horizontally/);
  assert.match(html, /Comets/);
  assert.doesNotMatch(html, /NaN|undefined/);
  await assert.rejects(options.queryFn(), /mismatch/);
  const { seasonView } = compile("client/src/lib/teamSports.ts", {
    "./sportRegistration": {},
    "./apiClient": {},
  });
  const state = {
    teams: [
      { id: "a", divisionId: "west" },
      { id: "b", divisionId: "east" },
    ],
    games: [{ id: "g", homeTeamId: "a", awayTeamId: "b", status: "scheduled" }],
    results: [],
    standings: [],
  };
  assert.equal(seasonView(state, "west", "all").games.length, 1);
  assert.equal(seasonView(state, "east", "all").games.length, 1);
  console.log(
    "PASS performance loading/error/empty states, sport metrics, game log, response scope and cross-division schedule filters",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
