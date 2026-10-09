const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
function compile(file, overrides = {}) {
  const mod = new Module(file, module);
  mod.paths = module.paths;
  mod.require = (name) => overrides[name] ?? require(name);
  mod._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    file,
  );
  return mod.exports;
}
(async () => {
  const navigation = compile("client/src/lib/sportNavigation.ts");
  assert.equal(
    navigation.routeSport("/sports/motocross/organizations/one"),
    "motocross",
  );
  assert.equal(navigation.routeSport("/scores/aqua"), "jet-ski");
  assert.equal(navigation.routeSport("/aqua-organizations"), "jet-ski");
  assert.equal(navigation.routeSport("/aqua-organizations/one"), undefined);
  assert.equal(navigation.routeSport("/sports/.."), undefined);
  const sports = [
    { key: "jet-ski", label: "Jet Ski" },
    { key: "motocross", label: "Motocross" },
  ];
  assert.equal(
    navigation.resolveSport("/profile", "motocross", sports),
    "motocross",
  );
  assert.equal(
    navigation.resolveSport("/sports/motocross", "jet-ski", sports),
    "motocross",
  );
  assert.equal(
    navigation.resolveSport("/scores/aqua", "motocross", sports),
    "jet-ski",
  );
  assert.equal(
    navigation.resolveSport("/profile", "removed", sports),
    "jet-ski",
  );
  assert.equal(
    navigation.sportOrganization("motocross", "a/b"),
    "/sports/motocross/organizations/a%2Fb",
  );
  let stored = null,
    location = "/profile",
    available = sports,
    subscriptions;
  const events = new EventTarget();
  global.window = {
    localStorage: {
      getItem: () => stored,
      setItem: (_key, value) => {
        stored = value;
      },
    },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
  };
  const selection = compile("client/src/hooks/useSportSelection.ts", {
    react: {
      useEffect: (cb) => cb(),
      useSyncExternalStore: (subscribe, snapshot) => {
        subscriptions = subscribe;
        return snapshot();
      },
    },
    wouter: { useLocation: () => [location] },
    "./usePublicSports": {
      usePublicSports: () => ({ data: available, isError: false }),
    },
    "@/lib/sportNavigation": navigation,
  });
  selection.useSportSelection().selectSport("motocross");
  assert.equal(stored, "motocross");
  assert.equal(selection.useSportSelection().sportKey, "motocross");
  selection.useSportSelection().selectSport("test");
  assert.equal(stored, "motocross");
  location = "/scores/aqua";
  assert.equal(selection.useSportSelection().sportKey, "jet-ski");
  assert.equal(stored, "jet-ski");
  location = "/sports/motocross";
  assert.equal(selection.useSportSelection().sportKey, "motocross");
  location = "/messages";
  available = [sports[0]];
  assert.equal(selection.useSportSelection().sportKey, "jet-ski");
  assert.equal(stored, "jet-ski");
  available = sports;
  window.localStorage = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };
  selection.useSportSelection().selectSport("motocross");
  assert.equal(selection.useSportSelection().sportKey, "motocross");
  let changes = 0;
  const cleanup = subscriptions(() => changes++);
  selection.rememberSport("jet-ski");
  assert.equal(changes, 1);
  cleanup();
  selection.rememberSport("motocross");
  assert.equal(changes, 1);
  delete global.window;
  // Exercise real sidebar callbacks rather than source-text snapshots.
  let sections,
    selected = "motocross",
    target;
  const sidebar = compile("client/src/components/sidebarPanel.tsx", {
    "@/hooks/useSportSelection": {
      useSportSelection: () => ({
        sportKey: selected,
        sport: sports.find((s) => s.key === selected),
        isJetSki: selected === "jet-ski",
      }),
    },
    "@/lib/sportNavigation": navigation,
    "@/lib/sidebarScroll": { hasMoreBelow: () => false },
    "@/hooks/useAuth": { useAuth: () => ({ isAuthenticated: false }) },
    "./CreateOrganizationLink": { CreateOrganizationLink: () => null },
    "./OrgDashboardLink": {
      canOpenOrgDashboard: () => false,
      OrgDashboardLink: () => null,
    },
    "@/features/organization-admin/hooks/useMyOrganizationAdminOrganizations": {
      useMyOrganizationAdminOrganizations: () => ({}),
    },
    wouter: {
      useLocation: () => ["/profile", (path) => (target = path)],
      Link: () => null,
    },
  });
  function ReadSidebar() {
    sections = sidebar.useAppSidebarSections({ guestMode: true });
    return null;
  }
  renderToStaticMarkup(React.createElement(ReadSidebar));
  let items = sections.flatMap((s) => s.items);
  assert(
    !items.some(
      (s) =>
        s.key === "race-registration" ||
        s.key === "search-racers" ||
        s.key === "event-map",
    ),
  );
  items.find((s) => s.key === "race-organizations").onSelect();
  assert.equal(target, "/sports/motocross");
  items.find((s) => s.key === "home").onSelect();
  assert.equal(target, "/sports/motocross");
  selected = "jet-ski";
  renderToStaticMarkup(React.createElement(ReadSidebar));
  items = sections.flatMap((s) => s.items);
  assert(items.some((s) => s.key === "race-registration"));
  items.find((s) => s.key === "race-organizations").onSelect();
  assert.equal(target, "/aqua-organizations");
  // Server paging + response boundaries keep all-sport data out of the hub.
  let requests = [],
    mismatch = false;
  const directory = compile("client/src/lib/sportOrganizations.ts", {
    "@/lib/apiClient": {
      apiFetch: async (path, opts) => {
        requests.push([path, opts]);
        const page = Number(
          new URL("https://test" + path).searchParams.get("page"),
        );
        return {
          ok: true,
          json: async () => ({
            sport: { key: "jet-ski", label: "Jet Ski" },
            organizations: [
              {
                id: String(page),
                name: "Org " + page,
                primarySportKey: mismatch ? "motocross" : "jet-ski",
              },
            ],
            meta: { hasNextPage: page < 2, itemCount: 2 },
          }),
        };
      },
    },
  });
  assert.deepEqual(
    (await directory.fetchAllSportOrganizations("jet-ski")).map((o) => o.id),
    ["1", "2"],
  );
  assert(
    requests.every(
      ([path, opts]) =>
        path.startsWith("/sports/catalog/jet-ski/organizations?") &&
        opts.skipAuth &&
        opts.noRefresh,
    ),
  );
  mismatch = true;
  await assert.rejects(
    directory.fetchSportOrganizations("jet-ski"),
    /Invalid sport/,
  );
  // Render the shared real organization page with public sport capabilities.
  let configs = [],
    organization = {
      id: "mx-org",
      name: "Motocross League",
      description: "Club description",
      primarySportKey: "motocross",
      sportProfile: {
        label: "Motocross",
        capabilities: { eventManagement: false },
      },
    };
  const shared = compile(
    "client/src/pages/organizations/aqua-organization-details.tsx",
    {
      "@/components/team-sports/TeamSeasons": { default: () => null },
      "@/lib/sportRegistration": { isTeamSport: () => false },
      "@/hooks/useSportSelection": { rememberSport: () => {} },
      "@/lib/sportNavigation": navigation,
      "./SandboxContext": {
        useOrganizationPageApi: () => ({
          sandbox: null,
          fetch: async () => ({
            ok: true,
            json: async () => ({
              organization,
              sportProfile: organization.sportProfile,
            }),
          }),
        }),
      },
      wouter: {
        useLocation: () => ["/sports/motocross/organizations/mx-org", () => {}],
      },
      "@tanstack/react-query": {
        useQuery: (config) => {
          configs.push(config);
          return {
            data: config.queryKey[0] === "/organizations" ? organization : [],
            isLoading: false,
            isError: false,
          };
        },
      },
      "@/components/ui/button": { Button: () => null },
      "@/seo/usePageSEO": { PageSEO: () => null },
      "@/lib/analytics": { trackEvent: () => {} },
      "@/lib/analytics-events": { AnalyticsEvents: {} },
      "@/lib/contentEngagementApi": {
        trackContentEngagementToBackend: () => Promise.resolve(),
      },
      "@/features/organization-posts/OrganizationPosts": {
        OrganizationPosts: ({ organizationId }) =>
          React.createElement("p", {}, "Official news for " + organizationId),
      },
      "@/components/OrganizationPhotoGallery": {
        __esModule: true,
        default: ({ organizationId }) =>
          React.createElement("p", {}, "Gallery for " + organizationId),
      },
    },
  ).default;
  const html = renderToStaticMarkup(
    React.createElement(shared, {
      params: { id: "mx-org" },
      expectedSportKey: "motocross",
    }),
  );
  assert(
    html.includes("Motocross League") &&
      html.includes("Club description") &&
      html.includes("Official news for mx-org") &&
      html.includes("Gallery for mx-org"),
  );
  assert(
    !html.includes("Jet Ski") &&
      !html.includes("Race Results") &&
      !html.includes(">Schedule<"),
  );
  assert.equal(
    configs.find((c) => c.queryKey[0] === "/sport-event/organization").enabled,
    false,
  );
  const orgQuery = configs.find((c) => c.queryKey[0] === "/organizations");
  await orgQuery.queryFn();
  organization = { ...organization, primarySportKey: "jet-ski" };
  await assert.rejects(orgQuery.queryFn(), /not found for this sport/);
  configs = [];
  organization = {
    ...organization,
    sportProfile: { label: "Jet Ski", capabilities: { eventManagement: true } },
  };
  const jetHtml = renderToStaticMarkup(
    React.createElement(shared, { params: { id: "mx-org" } }),
  );
  assert(
    jetHtml.includes("Gallery for mx-org") &&
      jetHtml.includes("Race Results") &&
      jetHtml.includes(">Schedule<"),
  );
  console.log(
    "PASS sport persistence, direct-link precedence, removed choices, unavailable storage, cross-component updates, real sidebar destinations, paginated sport filtering and mismatched-response rejection.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
