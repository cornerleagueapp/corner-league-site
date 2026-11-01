const assert = require("node:assert/strict"),
  fs = require("fs"),
  path = require("path"),
  Module = require("module"),
  ts = require("typescript"),
  React = require("react"),
  { renderToStaticMarkup: render } = require("react-dom/server");
function loader(mocks = {}) {
  const cache = new Map();
  function compile(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const m = new Module(file, module);
    m.filename = file;
    m.paths = module.paths;
    cache.set(file, m.exports);
    m.require = (n) => {
      if (n === "./apiClient" && mocks["@/lib/apiClient"])
        return mocks["@/lib/apiClient"];
      if (Object.hasOwn(mocks, n))
        return mocks[n]?.default ? { __esModule: true, ...mocks[n] } : mocks[n];
      if (n.endsWith(".css")) return {};
      if (n.startsWith("@/") || n.startsWith(".")) {
        const base = n.startsWith("@/")
          ? path.resolve("client/src", n.slice(2))
          : path.resolve(path.dirname(file), n);
        const target = [
          base,
          base + ".ts",
          base + ".tsx",
          path.join(base, "index.tsx"),
        ].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
        if (target && /\.tsx?$/.test(target)) return compile(target);
      }
      return require(n);
    };
    m._compile(
      ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      }).outputText,
      file + ".cjs",
    );
    cache.set(file, m.exports);
    return m.exports;
  }
  return compile;
}
let tab = "overview",
  state = "ok",
  requests = [],
  signed = true;
const auth = () => ({
  user: signed ? { id: "viewer", username: "jake" } : null,
  isAuthenticated: signed,
});
const season = {
  id: "season",
  organizationId: "org",
  sportKey: "basketball",
  name: "2027",
  leagueName: "City League",
  startsOn: "2027-01-01",
  endsOn: "2027-12-01",
  publishedAt: "2026-10-31T00:00:00Z",
  scoreLabel: "Points",
  periodLabel: "Quarter",
  divisions: [{ id: "d", name: "West" }],
  teams: [
    { id: "a", divisionId: "d", name: "Alpha", players: [] },
    { id: "b", divisionId: "d", name: "Beta", players: [] },
  ],
  games: [
    {
      id: "g",
      homeTeamId: "a",
      awayTeamId: "b",
      startsAt: "2027-04-01T18:00:00Z",
      venue: "Arena",
      status: "final",
    },
    {
      id: "future",
      homeTeamId: "a",
      awayTeamId: "b",
      startsAt: "2099-04-01T18:00:00Z",
      venue: "Arena",
      status: "scheduled",
    },
    {
      id: "canceled",
      homeTeamId: "a",
      awayTeamId: "b",
      startsAt: "2027-05-01T18:00:00Z",
      venue: "Arena",
      status: "cancelled",
    },
  ],
  results: [
    {
      gameId: "g",
      status: "final",
      homeScore: 20,
      awayScore: 15,
      periods: [],
      tiebreakWinnerId: null,
    },
    {
      gameId: "canceled",
      status: "final",
      homeScore: 99,
      awayScore: 99,
      periods: [],
      tiebreakWinnerId: null,
    },
  ],
  standings: [
    {
      divisionId: "d",
      name: "West",
      rows: [
        {
          teamId: "a",
          name: "Alpha",
          position: 1,
          played: 1,
          wins: 1,
          losses: 0,
          draws: 0,
          scoredFor: 20,
          scoredAgainst: 15,
          difference: 5,
          points: 2,
        },
      ],
    },
  ],
  playerStats: [
    {
      gameId: "g",
      teamId: "a",
      profileId: "p",
      name: "Alice",
      values: { points: 20, rebounds: 3 },
    },
    {
      gameId: "canceled",
      teamId: "a",
      profileId: "p",
      name: "Alice",
      values: { points: 99 },
    },
    {
      gameId: "future",
      teamId: "a",
      profileId: "p",
      name: "Alice",
      values: { points: 88 },
    },
  ],
  excellence: { publishedAt: "2027-01-01", allStarGameId: "g", awards: [] },
};
const baseMocks = {
  "@/hooks/useAuth": { useAuth: auth },
  "@/seo/usePageSEO": { PageSEO: () => null },
  "@/components/branding/ConsumerBrandingHero": {
    default: () => React.createElement("div", {}, "Season banner"),
  },
  "@/pages/organizations/SandboxContext": {
    useSandbox: () => null,
    useOrganizationPageApi: () => ({ sandbox: null }),
  },
  wouter: {
    Link: ({ href, children, ...props }) =>
      React.createElement("a", { href, ...props }, children),
    useLocation: () => ["/sports/basketball/seasons/season", () => {}],
    useSearch: () => "?org=org&tab=" + tab,
    useRoute: () => [true, { sportKey: "basketball", seasonId: "season" }],
  },
  "@/lib/apiClient": {
    apiRequest: async (...a) => {
      requests.push(a);
      return { items: [], total: 0 };
    },
  },
  "@tanstack/react-query": {
    useQuery: (o) => {
      requests.push(o);
      return o.queryKey[0] === "organization-gallery"
        ? { data: { items: [], total: 0 }, isPending: false }
        : state === "error"
          ? { isError: true, refetch() {} }
          : { data: season, isPending: false };
    },
    useQueryClient: () => ({}),
  },
};
const compile = loader(baseMocks),
  nav = compile("client/src/lib/seasonNavigation.ts"),
  stats = compile("client/src/lib/seasonStatistics.ts");
assert.deepEqual(
  nav.seasonTabs.map((t) => t[0]),
  ["overview", "schedule", "standings", "teams", "stats", "awards", "photos"],
);
assert.equal(
  nav.seasonHref("basketball", "a/b", "o&x", "stats"),
  "/sports/basketball/seasons/a%2Fb?org=o%26x&tab=stats",
);
assert.equal(stats.seasonStats(season).players[0].totals.points, 20);
const transferred = stats.seasonStats({
  ...season,
  playerStats: [
    ...season.playerStats,
    { ...season.playerStats[0], teamId: "b", values: { points: 3 } },
  ],
});
assert.equal(transferred.players.length, 1);
assert.equal(transferred.players[0].totals.points, 23);
assert.deepEqual(transferred.players[0].teamIds, ["a", "b"]);
assert.equal(stats.seasonStats(season, "missing").rows.length, 0);
const Page = compile("client/src/pages/public-season.tsx").default;
for (const key of nav.seasonTabs.map((t) => t[0])) {
  tab = key;
  requests = [];
  const html = render(React.createElement(Page));
  assert.match(html, /Season registration/);
  assert.match(html, /aria-label="Season sections"/);
  assert.match(html, /aria-current="page"/);
  assert.doesNotMatch(html, /NaN|undefined/);
  if (key === "overview") {
    assert.match(html, /Up next/);
    assert.doesNotMatch(html, /Team statistics/);
  }
  if (key === "stats") {
    assert.match(html, /Alice/);
    assert.match(html, /Team statistics/);
    assert.doesNotMatch(html, />99</);
  }
  if (key === "photos") {
    assert.match(html, /Season photos/);
    const o = requests.find((q) => q.queryKey?.[0] === "organization-gallery");
    assert(o.queryKey.includes("season"));
  }
  if (key === "awards") {
    assert.match(html, /All-Star game/);
  }
}
state = "error";
assert.match(render(React.createElement(Page)), /Season unavailable/);
state = "ok";
let captured;
const profileCompile = loader({
  ...baseMocks,
  "@/hooks/useSportSelection": {
    useSportSelection: () => ({ sportKey: "basketball" }),
  },
  "@/components/community/SocialPosts": {
    default: (p) => {
      captured = p;
      return React.createElement("div", {}, p.title);
    },
    socialButton: "button",
  },
  "@/lib/communityApi": {},
  "@/lib/socialApi": {},
  "@/components/team-sports/ProfileHonors": { default: () => null },
  "@/components/community/PeopleDialog": { default: () => null },
  "@/components/community/FollowedResults": { default: () => null },
  "@/components/community/OrganizationFollowing": {},
  "@/components/sport-registration/AthleteAccountLinks": {
    default: () => null,
  },
  "@/components/community/ProfilePhotoViewer": { default: () => null },
  "@/components/community/ProfileHeader": { default: () => null },
  "@/components/community/Publishing": {},
  "@/components/community/RacerIdentityCard": { default: () => null },
  "@/components/community/FollowedAthletesPanel": { default: () => null },
  "@/components/community/UserSocialControls": {},
});
const ProfileFeed = profileCompile(
  "client/src/pages/profile/user-profile.tsx",
).ProfileFeed;
assert.match(
  render(React.createElement(ProfileFeed, { username: "jake", isOwn: true })),
  /Followers’ posts/,
);
assert.equal(captured.username, "jake");
assert.equal(captured.feed, "all");
assert.doesNotMatch(
  render(React.createElement(ProfileFeed, { username: "other", isOwn: false })),
  /Followers’ posts/,
);
assert.equal(captured.compose, false);
console.log(
  "PASS dedicated season tabs/routes, registration, summary, final-only stats, scoped photo cache, all-star game without awards, error states and owner-only profile filters",
);
