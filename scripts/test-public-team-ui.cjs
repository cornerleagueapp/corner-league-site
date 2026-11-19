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
const wouter = {
  Link: ({ href, children, ...props }) =>
    React.createElement("a", { href, ...props }, children),
};
const cards = compile("client/src/components/team-sports/GameCard.tsx", {
  wouter,
  "./TeamLogo": { default: () => null },
});
const game = {
  id: "g",
  homeTeamId: "a",
  awayTeamId: "b",
  startsAt: "2026-10-01T20:00:00Z",
  venue: "Court",
  status: "scheduled",
};
const result = {
  gameId: "g",
  status: "final",
  homeScore: 42,
  awayScore: 40,
  periods: [
    { label: "Q1", homeScore: 10, awayScore: 12 },
    { label: "Q2", homeScore: 10, awayScore: 8 },
    { label: "Q3", homeScore: 10, awayScore: 10 },
    { label: "Q4", homeScore: 12, awayScore: 10 },
  ],
};
const data = {
  game,
  result,
  seasonId: "season",
  organizationId: "org",
  sportKey: "basketball",
  periodLabel: "Quarter",
  scoreLabel: "Points",
  teams: [
    { id: "a", name: "A & B" },
    { id: "b", name: "B Team" },
  ],
  playerStats: [
    {
      gameId: "g",
      teamId: "a",
      profileId: "one",
      name: "First <Athlete>",
      values: { points: 12 },
    },
    {
      gameId: "g",
      teamId: "a",
      profileId: "two",
      name: "Tied Athlete",
      values: { points: 12 },
    },
    {
      gameId: "other",
      teamId: "a",
      profileId: "wrong",
      name: "Wrong Game",
      values: { points: 99 },
    },
  ],
};
let html = render(React.createElement(cards.default, { data }));
assert(html.includes("Q4"));
assert(html.includes("First &lt;Athlete&gt;"));
assert(html.includes("Tied Athlete"));
assert(!html.includes("Wrong Game"));
assert(html.includes("/athlete/one?sport=basketball"));
assert(html.includes("/sports/basketball/teams/season/a?org=org"));
assert(html.includes("cl-game-winner"));
assert(html.includes("Home"));
assert(html.includes("Away"));
html = render(React.createElement(cards.default, { data, sandbox: true }));
assert(!html.includes("href="));
assert.equal(
  cards.gameStatus(game, { ...result, status: "in-progress" }),
  "live",
);
assert.equal(
  cards.gameStatus({ ...game, status: "cancelled" }, result),
  "cancelled",
);
assert.equal(
  cards.gameStatus(game, null, Date.parse("2025-01-01")),
  "upcoming",
);
assert.equal(cards.gameStatus(game, null, Date.parse("2027-01-01")), "past");
// Published racket results retain their format, individual scores and set tiebreaks.
for (const sport of ["tennis", "pickleball"]) {
  const racket = { format: "doubles", bestOf: 3, pointsTo: 15, tennisTiebreakTo: 7, decidingMatchTiebreak: false };
  const r = { ...result, homeScore: 2, awayScore: 0, racket,
    periods: [{ label: "Set 1", homeScore: 7, awayScore: 6, homeTiebreak: 8, awayTiebreak: 6 }, {label: "Set 2", homeScore: 6, awayScore: 3}] };
  const rendered = render(React.createElement(cards.default, { data: {...data, sportKey: sport, periodLabel: sport === "tennis" ? "Set" : "Game", result: r} }));
  assert(rendered.includes("Doubles"));
  assert(rendered.includes(sport === "tennis" ? "Sets won" : "Games won"));
  assert(rendered.includes("Set 1"));
  if (sport === "tennis") assert(rendered.includes("8"));
  if (sport === "pickleball") assert(rendered.includes("Play to 15, win by two"));
}
html = render(React.createElement(cards.default, {data: {...data, sportKey: "hockey", result: {...result, homeScore: 2, awayScore: 2, decision: "shootout", tiebreakWinnerId: "b"}}}));
assert.equal((html.match(/cl-game-winner/g) || []).length, 1);
assert(html.includes('class="cl-game-winner"><th scope="row"><a href="/sports/hockey/teams/season/b?org=org"'));
const nav = compile("client/src/lib/sportNavigation.ts");
assert.equal(nav.sportHub("basketball"), "/sports/basketball");
assert.equal(
  nav.sportDirectory("basketball"),
  "/sports/basketball/organizations",
);
assert.equal(
  nav.sportOrganization("basketball", "org"),
  "/sports/basketball/organizations/org",
);
assert.equal(
  nav.resolveSport("/sports/jet-ski/events", "basketball", [
    { key: "jet-ski" },
    { key: "basketball" },
  ]),
  "jet-ski",
);
assert.equal(nav.sportHub("jet-ski"), "/scores/aqua");
for (const sport of ["hockey", "golf", "volleyball", "tennis", "pickleball"]) assert(nav.isShowcaseSport(sport));
for (const sport of ["onewheel-racing", "rc-racing"]) assert(!nav.isShowcaseSport(sport));
console.log(
  "PASS published quarter scoreboards, tied scoring leaders, escaped names, scoped team/athlete links, sandbox isolation, lifecycle labels and route-authoritative sport navigation",
);

const positions = compile("client/src/lib/athletePositions.ts");
assert.deepEqual(positions.positionOptions.tennis, ["S1", "D1", "D2"]);
assert(positions.positionLabel("pickleball", "D1").includes("Doubles"));
