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
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    f,
  );
  return m.exports;
}
const nav = compile("client/src/lib/sportNavigation.ts"),
  visual = compile("client/src/lib/sportVisuals.ts"),
  Link = ({ href, children, ...props }) =>
    React.createElement("a", { href, ...props }, children);
for (const sport of ["jet-ski", "basketball", "soccer", "golf", "motocross"]) {
  assert(
    nav
      .sportMoreLinks(sport)
      .some(
        (l) =>
          l.label === "Registration" && l.href === nav.sportRegistration(sport),
      ),
  );
  if (sport !== "jet-ski")
    assert.equal(nav.routeSport(nav.sportRegistration(sport)), sport);
}
const Cards = compile("client/src/components/sport-hub/SportHubSections.tsx", {
  wouter: { Link },
  "@/lib/sportNavigation": nav,
  "@/lib/sportVisuals": visual,
}).default;
const html = render(React.createElement(Cards, { sport: "basketball" }));
assert.equal((html.match(/<h3>/g) || []).length, 6);
for (const href of [
  "/sports/basketball/organizations",
  "/community?sport=basketball",
  "/racer?sport=basketball",
  "/sports/basketball/events",
  "/articles?sport=basketball",
  "/sports/basketball/registration",
])
  assert(html.includes(`href="${href}"`));
assert(!html.includes("Fantasy"));
let mode = "current",
  calls = [];
const game = (id, date = "2026-10-25T12:00:00Z") => ({
  sportKey: "basketball",
  game: { id, startsAt: date },
});
const api = compile("client/src/lib/hubGames.ts", {
  "./sportRegistration": {
    publicSportData: async (url) => {
      calls.push(url);
      const p = new URL("https://test" + url).searchParams,
        status = p.get("status"),
        page = Number(p.get("page"));
      if (mode === "wrong") return { sportKey: "jet-ski", items: [], total: 0 };
      let items =
        mode === "current"
          ? status === "live"
            ? [game("live")]
            : [game("next")]
          : status === "past"
            ? page === 1
              ? [game("old")]
              : [game("new-1"), game("new-2")]
            : [];
      return {
        sportKey: "basketball",
        items,
        total: mode === "past" && status === "past" ? 8 : items.length,
        page,
        limit: 6,
      };
    },
  },
});
(async () => {
  assert.deepEqual(
    (await api.loadHubGames("basketball")).map((g) => g.game.id),
    ["live", "next"],
  );
  assert.equal(calls.length, 2);
  mode = "past";
  calls = [];
  assert.deepEqual(
    (await api.loadHubGames("basketball")).map((g) => g.game.id),
    ["new-2", "new-1"],
  );
  assert(calls.some((c) => c.includes("page=2")));
  mode = "wrong";
  await assert.rejects(api.loadHubGames("basketball"), /match this sport/);
  assert.equal(api.shortName("Crown Town League"), "CTL");
  let enabled = [];
  const Strip = compile("client/src/components/sport-hub/HubGameCarousel.tsx", {
    wouter: { Link },
    "@/lib/hubGames": { ...api, loadHubGames: async () => [] },
    "@/lib/teamSports": { readTeamSeason: () => {} },
    "@/lib/sportNavigation": nav,
    "@/components/team-sports/GameCard": { gameStatus: () => "past" },
    "@tanstack/react-query": {
      useQuery: (config) => {
        if (config.queryKey[0] === "sport-hub-score-strip")
          return {
            data: [
              {
                ...game("final"),
                organizationId: "org",
                organizationName: "Crown Town League",
                seasonId: "season",
                game: {
                  id: "final",
                  startsAt: "2026-10-25T12:00:00Z",
                  homeTeamId: "a",
                  awayTeamId: "b",
                },
                result: { status: "final", homeScore: 0, awayScore: 12 },
                teams: [
                  { id: "a", name: "Home Team" },
                  { id: "b", name: "Away Team" },
                ],
              },
            ],
          };
        enabled.push(config.enabled);
        return {};
      },
    },
  }).default;
  const strip = render(React.createElement(Strip, { sport: "basketball" }));
  assert(strip.includes("FINAL"));
  assert(strip.includes('cl-compact-score">0</span>'));
  assert(strip.includes('cl-compact-score">12</span>'));
  assert(strip.indexOf("Away Team") < strip.lastIndexOf("Home Team"));
  assert.deepEqual(enabled, [false]);
  assert(strip.includes("Previous games") && strip.includes("Next games"));
  console.log(
    "PASS sport registration destinations, six hub sections, live/upcoming ordering, latest-page results fallback, sport isolation, zero scores and no unnecessary record requests.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
