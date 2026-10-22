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
const tournament = compile("client/src/lib/teamTournament.ts");
const bracket = compile("client/src/components/team-sports/TeamBracket.tsx", {
  "@/lib/teamTournament": tournament,
}).default;
const season = {
  id: "s",
  teams: [
    { id: "a", name: "Alpha", divisionId: "d" },
    { id: "b", name: "Beta", divisionId: "d" },
    { id: "c", name: "Gamma", divisionId: "d" },
  ],
  divisions: [{ id: "d", name: "Open" }],
  games: [
    {
      id: "bye",
      homeTeamId: "a",
      awayTeamId: "a",
      startsAt: "2026-11-01T12:00:00Z",
      status: "scheduled",
      competition: {
        id: "cup",
        kind: "single-elimination",
        round: 1,
        match: 1,
        fieldSize: 3,
        homeSeed: 1,
        bye: true,
      },
    },
    {
      id: "semi",
      homeTeamId: "b",
      awayTeamId: "c",
      startsAt: "2026-11-01T13:00:00Z",
      status: "scheduled",
      competition: {
        id: "cup",
        kind: "single-elimination",
        round: 1,
        match: 2,
        fieldSize: 3,
      },
    },
  ],
  results: [],
};
assert.equal(tournament.tournamentWinner(season, season.games[0]), "a");
assert.equal(tournament.tournamentWinner(season, season.games[1]), null);
let html = renderToStaticMarkup(
  React.createElement(bracket, { season, division: "" }),
);
assert.match(html, /BYE/);
assert.match(html, /Automatic advancement/);
assert.match(html, /Matchup not published/);
assert.match(html, /Final/);
assert.match(html, /href="#bracket-cup-2-1"/);
assert(!html.includes("Champion:"));
assert(!html.includes('Alpha</p><p class="font-black text-cl-accent">Alpha'));
assert.equal(
  renderToStaticMarkup(
    React.createElement(bracket, { season, division: "other" }),
  ),
  "",
);
season.games.push({
  id: "final",
  homeTeamId: "a",
  awayTeamId: "b",
  startsAt: "2026-11-02T12:00:00Z",
  status: "scheduled",
  competition: {
    id: "cup",
    kind: "single-elimination",
    round: 2,
    match: 1,
    fieldSize: 3,
  },
});
season.results.push({
  gameId: "final",
  status: "final",
  homeScore: 3,
  awayScore: 1,
});
html = renderToStaticMarkup(
  React.createElement(bracket, { season, division: "" }),
);
assert.match(html, /Champion: <!-- -->Alpha|Champion: Alpha/);
season.games[2].status = "cancelled";
html = renderToStaticMarkup(
  React.createElement(bracket, { season, division: "" }),
);
assert(!html.includes("Champion:"));
const golf = compile(
  "client/src/components/sport-registration/GolfEventResults.tsx",
).default;
const data = {
  schedule: [
    {
      id: "f",
      className: "Open",
      label: "Morning",
      round: 1,
      startsAt: "2026-11-01T12:00:00Z",
      holePars: Array(9).fill(4),
      golfScoring: "stableford",
      participants: [{ id: "e", name: "Golfer" }],
    },
  ],
  results: [
    {
      heatId: "f",
      rows: [
        {
          id: "e",
          name: "Golfer",
          status: "finished",
          position: 1,
          grossStrokes: 45,
          toPar: 9,
          netStrokes: 36,
          netToPar: 0,
          playingHandicap: 9,
          stablefordPoints: 18,
          holeScores: [],
        },
      ],
    },
  ],
  golfStandings: [
    {
      classId: "c",
      className: "Open",
      scoring: "stableford",
      rows: [
        {
          profileId: "p",
          name: "Golfer",
          position: 1,
          completedRounds: 1,
          totalRounds: 1,
          grossStrokes: 45,
          toPar: 9,
          netStrokes: 36,
          netToPar: 0,
          stablefordPoints: 18,
        },
      ],
    },
  ],
};
html = renderToStaticMarkup(React.createElement(golf, { data }));
for (const text of [
  "Net Stableford",
  "Playing handicap",
  "Stableford points",
  "Net to par",
  "18",
])
  assert(html.includes(text));
assert(!html.includes("undefined"));
data.schedule = [];
data.golfStandings = [];
html = renderToStaticMarkup(React.createElement(golf, { data }));
assert.match(html, /not published flights/);
console.log(
  "PASS published bye brackets, future rounds, advancement links, division isolation, final champions, cancellation handling, net/Stableford leaderboards and empty golf state.",
);
