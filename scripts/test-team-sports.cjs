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
const requests = [];
let response;
const api = {
  apiRequest: async (...a) => {
    requests.push(a);
    return { status: true, data: response };
  },
  apiFetch: async (...a) => {
    requests.push(a);
    return { ok: true, json: async () => ({ status: true, data: response }) };
  },
};
const registration = compile("client/src/lib/sportRegistration.ts", {
  "./apiClient": api,
});
const team = compile("client/src/lib/teamSports.ts", {
  "./apiClient": api,
  "./sportRegistration": registration,
});
const d = {
  id: "season",
  organizationId: "org",
  sportKey: "soccer",
  name: "Fall",
  leagueName: "League",
  startsOn: "2026-11-01",
  endsOn: "2026-12-01",
  publishedAt: "2026-11-01T10:00:00Z",
  scoreLabel: "Goals",
  periodLabel: "Period",
  divisions: [{ id: "division", name: "Open" }],
  teams: [
    {
      id: "home",
      divisionId: "division",
      name: "Home",
      players: [
        {
          profileId: "player",
          name: "Player",
          number: "7",
          position: "Forward",
        },
      ],
    },
    { id: "away", divisionId: "division", name: "Away", players: [] },
  ],
  games: [
    {
      id: "game",
      homeTeamId: "home",
      awayTeamId: "away",
      startsAt: "2026-11-01T12:00:00Z",
      venue: "Field",
      status: "scheduled",
    },
  ],
  results: [
    {
      gameId: "game",
      status: "final",
      homeScore: 2,
      awayScore: 1,
      tiebreakWinnerId: null,
      periods: [{ label: "First", homeScore: 2, awayScore: 1 }],
    },
  ],
  standings: [
    {
      divisionId: "division",
      name: "Open",
      rows: [
        {
          teamId: "home",
          name: "Home",
          played: 1,
          wins: 1,
          draws: 0,
          losses: 0,
          scoredFor: 2,
          scoredAgainst: 1,
          difference: 1,
          points: 3,
        },
      ],
    },
  ],
};
let sandbox = null,
  queries = [],
  search = "?season=season",
  location = "/sports/soccer/organizations/org";
const component = compile("client/src/components/team-sports/TeamSeasons.tsx", {
  "@/lib/teamSports": team,
  "@/pages/organizations/SandboxContext": { useSandbox: () => sandbox },
  wouter: {
    useSearch: () => search,
    useLocation: () => [location, () => {}],
    Link: ({ href, children, ...p }) =>
      React.createElement("a", { href, ...p }, children),
  },
  "@tanstack/react-query": {
    useQuery: (q) => {
      queries.push(q);
      return {
        isPending: false,
        isError: false,
        data:
          q.queryKey[0] === "team-seasons"
            ? {
                items: [{ id: "season", name: "Fall", leagueName: "League" }],
                total: 1,
              }
            : d,
      };
    },
  },
});
(async () => {
  for (const key of registration.teamSportKeys) {
    assert(registration.isAthleteSport(key));
    assert(!registration.isRacingSport(key));
  }
  assert(!registration.isAthleteSport("golf"));
  response = [{ id: "player", sportKey: "soccer" }];
  assert.equal((await registration.mySportAthletes())[0].sportKey, "soccer");
  response = { items: "broken", total: 1 };
  await assert.rejects(team.myTeamInvitations(1), /Invalid/);
  response = { organizationId: "org", sportKey: "soccer", items: [], total: 0 };
  await team.listTeamSeasons("org", "soccer", 2);
  assert(requests.at(-1)[0].includes("page=2"));
  response = { ...response, sportKey: "baseball" };
  await assert.rejects(
    team.listTeamSeasons("org", "soccer", 1),
    /does not match/,
  );
  response = d;
  assert.equal(
    (await team.readTeamSeason("season", "org", "soccer")).name,
    "Fall",
  );
  await assert.rejects(
    team.readTeamSeason("season", "other", "soccer"),
    /does not match/,
  );
  for (const change of [
    { teams: { bad: true } },
    { teams: [{ ...d.teams[0], players: null }] },
    { results: [{ ...d.results[0], periods: null }] },
    { standings: [{ ...d.standings[0], rows: null }] },
  ])
    assert.throws(
      () =>
        team.validatePublicTeamSeason(
          { ...d, ...change },
          "season",
          "org",
          "soccer",
        ),
      /does not match/,
    );
  let html = renderToStaticMarkup(
    React.createElement(component.default, {
      organizationId: "org",
      sportKey: "soccer",
    }),
  );
  assert(html.includes("Goals for"));
  assert(html.includes("2 – 1"));
  assert(html.includes("Player"));
  assert(html.includes("/racer/player?sport=soccer"));
  assert(!html.includes("Race Results"));
  queries = [];
  sandbox = { id: "org", account: "super-admin" };
  html = renderToStaticMarkup(
    React.createElement(component.default, {
      organizationId: "org",
      sportKey: "soccer",
    }),
  );
  assert(!html.includes("/racer/player"));
  assert(queries.every((q) => q.queryKey.includes("super-admin")));
  response = d;
  await queries.find((q) => q.queryKey[0] === "team-season").queryFn();
  assert.equal(requests.at(-1)[0], "/sandbox/organizations/org/request");
  assert.equal(requests.at(-1)[1].body.path, "/team-sports/seasons/season");
  sandbox.account = "other-admin";
  queries = [];
  renderToStaticMarkup(
    React.createElement(component.default, {
      organizationId: "org",
      sportKey: "soccer",
    }),
  );
  assert(queries.every((q) => q.queryKey.includes("other-admin")));
  response = { status: "accepted" };
  await team.respondToTeamInvitation("invite", "accept");
  assert.deepEqual(requests.at(-1).slice(0, 3), [
    "POST",
    "/team-sports/me/roster/invite/respond",
    { action: "accept" },
  ]);
  let user = { id: "account" },
    states = [],
    index = 0,
    refs = [],
    ri = 0,
    calls = [],
    confirm,
    queries2 = [];
  const hooks = {
    ...React,
    useState: (v) => {
      const i = index++;
      if (!(i in states)) states[i] = v;
      return [
        states[i],
        (n) => (states[i] = typeof n === "function" ? n(states[i]) : n),
      ];
    },
    useRef: (v) => refs[ri++] ?? (refs[ri - 1] = { current: v }),
    useEffect: () => {},
  };
  const invite = compile(
    "client/src/components/team-sports/TeamRosterInvites.tsx",
    {
      react: hooks,
      "@/hooks/useAuth": { useAuth: () => ({ isAuthenticated: !!user, user }) },
      "@/lib/teamSports": {
        myTeamInvitations: async () => {},
        respondToTeamInvitation: async (...args) => calls.push(args),
      },
      wouter: {
        Link: ({ children }) => React.createElement("a", null, children),
      },
      "@tanstack/react-query": {
        useQuery: (q) => {
          queries2.push(q);
          return {
            data: {
              items: [
                {
                  id: "invite",
                  status: "pending",
                  teamName: "Team",
                  seasonName: "Fall",
                  organizationName: "Org",
                  sportKey: "soccer",
                  organizationId: "org",
                  seasonId: "season",
                },
              ],
              total: 1,
            },
          };
        },
        useQueryClient: () => ({ invalidateQueries: async () => {} }),
      },
    },
  );
  const find = (node, test) => {
    if (!node || typeof node !== "object") return;
    if (test(node)) return node;
    for (const c of React.Children.toArray(node.props?.children)) {
      const r = find(c, test);
      if (r) return r;
    }
  };
  function render() {
    index = ri = 0;
    const outer = invite.default();
    return outer ? outer.type(outer.props) : null;
  }
  let tree = render();
  assert(queries2[0].queryKey.includes("account"));
  find(
    tree,
    (n) => n.type === "button" && n.props.children === "accept",
  ).props.onClick();
  tree = render();
  assert.equal(calls.length, 0, "consent requires confirmation");
  await find(
    tree,
    (n) => n.type === "button" && n.props.children === "Confirm",
  ).props.onClick();
  assert.deepEqual(calls, [["invite", "accept"]]);
  user = null;
  assert.equal(render(), null);
  user = { id: "other" };
  tree = invite.default();
  assert.equal(tree.key, "other");
  console.log(
    "PASS team profile routing, response contracts, public standings/rosters, isolated sandbox transport, account-scoped invitations and confirmed consent.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
