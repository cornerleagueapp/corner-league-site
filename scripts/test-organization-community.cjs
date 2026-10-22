const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
function compile(file, overrides = {}) {
  const filename = path.resolve(file),
    m = new Module(filename, module);
  m.paths = module.paths;
  m.require = (name) =>
    Object.hasOwn(overrides, name) ? overrides[name] : require(name);
  m._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2021,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
  return m.exports;
}
const rules = compile("client/src/lib/organizationPresentation.ts");
const racing = rules.organizationSections(false, true),
  team = rules.organizationSections(true, true),
  sandboxLinks = rules.organizationSections(true, false, true);
assert(!racing.some((x) => x.key === "competition"));
assert(team.some((x) => x.key === "competition"));
assert(!sandboxLinks.some((x) => ["shop", "facilities"].includes(x.key)));
assert.equal(rules.organizationSection("?shop=1", racing), "shop");
assert.equal(rules.organizationSection("?season=s1", team), "competition");
assert.equal(rules.organizationSection("?season=s1", racing), "overview");
assert.equal(rules.organizationSection("?shop=1", sandboxLinks), "overview");
assert.equal(rules.organizationSection("?section=__proto__", team), "overview");
assert.equal(
  rules.organizationSectionPath(
    "/sports/golf/organizations/o",
    "?shop=1&utm_source=demo",
    "gallery",
  ),
  "/sports/golf/organizations/o?utm_source=demo&section=gallery",
);
assert.equal(
  rules.organizationSectionPath(
    "/org",
    "?season=s1&section=competition",
    "overview",
  ),
  "/org",
);
assert.match(
  rules.organizationEventHref("golf", "org/one", "event/one"),
  /organizations\/org%2Fone\?event=event%2Fone/,
);
assert.match(
  rules.organizationEventHref("jet-ski", "org", "event"),
  /orgId=org/,
);
assert.equal(
  rules.organizationEventHref("golf", "org", "event", "sandbox/one"),
  "/internal/test-organizations/sandbox%2Fone?event=event",
);
const event = {
  id: "e",
  name: "<script>bad</script>",
  startDate: "2035-01-01",
  endDate: "2035-01-02",
  organizer: { id: "org" },
  imageUrl: "javascript:alert(1)",
};
const eventResponse = {
  data: {
    sportEvents: [event, event, { ...event, id: "bad", startDate: "bad" }],
    meta: { itemCount: 25, hasNextPage: true },
  },
};
const parsed = rules.organizationEventPage(eventResponse, "org");
assert.equal(parsed.items.length, 1);
assert.equal(parsed.items[0].imageUrl, undefined);
assert.equal(parsed.total, 25);
assert.equal(parsed.hasNextPage, true);
assert.throws(
  () =>
    rules.organizationEventPage(
      { sportEvents: [{ ...event, organizer: { id: "foreign" } }] },
      "org",
    ),
  /another organization/,
);
assert.throws(() => rules.organizationEventPage({}, "org"), /Invalid/);
assert.equal(
  rules.organizationEventDate("invalid", "invalid"),
  "Date to be announced",
);
const Link = ({ children, ...props }) =>
  React.createElement("a", props, children);
const cards = compile(
  "client/src/components/organization-community/OrganizationEventCards.tsx",
  {
    wouter: { Link },
    "@/lib/organizationPresentation": rules,
    "@/components/sport-hub/SportArtwork": {
      __esModule: true,
      default: () => React.createElement("span", { "data-stock-art": true }),
    },
  },
).default;
const markup = renderToStaticMarkup(
  React.createElement(cards, {
    events: parsed.items,
    organizationId: "org",
    sport: "golf",
  }),
);
assert.match(markup, /&lt;script&gt;bad&lt;\/script&gt;/);
assert.doesNotMatch(markup, /javascript:/);
assert.match(markup, /data-stock-art/);
let search = "",
  sport = "golf",
  sandbox = null,
  pending = false,
  failed = false,
  responseOrgId = "org",
  request,
  calls = [];
const boundary = (name) => ({
  __esModule: true,
  default: ({ organizationId }) =>
    React.createElement(
      "div",
      { "data-module": name, "data-org": organizationId },
      name,
    ),
});
const navig = compile("client/src/lib/sportNavigation.ts");
const Page = compile(
  "client/src/pages/organizations/aqua-organization-details.tsx",
  {
    "@/lib/organizationPresentation": rules,
    "@/lib/sportNavigation": navig,
    "@/lib/sportVisuals": { sportVisual: () => ({ label: sport }) },
    "@/lib/sportRegistration": {
      isTeamSport: (key) =>
        [
          "basketball",
          "baseball",
          "soccer",
          "hockey",
          "american-football",
        ].includes(key),
    },
    "@/hooks/useSportSelection": { rememberSport() {} },
    "./SandboxContext": {
      useOrganizationPageApi: () => ({
        sandbox,
        fetch: async (...args) => {
          request = args;
          return {
            ok: true,
            json: async () => ({
              organization: {
                id: responseOrgId,
                primarySportKey: sport,
                name: "Org",
              },
              sportProfile: {
                label: sport,
                capabilities: { eventManagement: true },
              },
            }),
          };
        },
      }),
    },
    wouter: {
      Link,
      useLocation: () => ["/sports/" + sport + "/organizations/org", () => {}],
      useSearch: () => search,
    },
    "@tanstack/react-query": {
      useQuery: (options) => {
        calls.push(options);
        return options.queryKey[0] === "/organizations"
          ? {
              data: {
                id: "org",
                name: "Org",
                primarySportKey: sport,
                description: "<img onerror=bad>",
                sportProfile: {
                  label: sport,
                  capabilities: { eventManagement: true },
                },
              },
              isPending: pending,
              isError: failed,
              refetch() {},
            }
          : {
              data: parsed,
              isPending: false,
              isError: false,
              isFetching: false,
              refetch() {},
            };
      },
    },
    "@/components/branding/ConsumerBrandingHero": {
      __esModule: true,
      default: ({ name, headingLevel }) =>
        React.createElement("h" + headingLevel, null, name),
    },
    "@/components/organization-community/OrganizationEventCards": {
      __esModule: true,
      default: cards,
    },
    "@/components/facilities/OrganizationFacilities": boundary("facilities"),
    "@/features/merchandise/OrganizationShop": {
      OrganizationShop: boundary("shop").default,
    },
    "@/components/team-sports/TeamSeasons": boundary("seasons"),
    "@/features/organization-posts/OrganizationPosts": {
      OrganizationPosts: ({ previewLimit }) =>
        React.createElement("div", {
          "data-module": "posts",
          "data-preview": previewLimit,
        }),
    },
    "@/components/OrganizationPhotoGallery": boundary("gallery"),
    "@/seo/usePageSEO": { PageSEO: () => null },
    "@/lib/analytics": { trackEvent() {} },
    "@/lib/analytics-events": { AnalyticsEvents: {} },
    "@/lib/contentEngagementApi": {
      trackContentEngagementToBackend: async () => {},
    },
  },
).default;
function draw() {
  calls = [];
  return renderToStaticMarkup(
    React.createElement(Page, {
      params: { id: "org" },
      expectedSportKey: sport,
    }),
  );
}
let html = draw();
assert.match(html, /<h1>Org<\/h1>/);
assert.match(html, /data-preview="2"/);
assert.doesNotMatch(
  html,
  /data-module="shop"|data-module="facilities"|data-module="seasons"/,
);
assert.match(html, /&lt;img onerror=bad&gt;/);
search = "?shop=1";
html = draw();
assert.match(html, /data-module="shop"/);
assert.doesNotMatch(html, /data-module="posts"|data-module="gallery"/);
search = "?section=gallery";
html = draw();
assert.match(html, /data-module="gallery"/);
assert.doesNotMatch(html, /data-module="shop"/);
sport = "basketball";
search = "?season=s1";
html = draw();
assert.match(html, /data-module="seasons"/);
sport = "jet-ski";
search = "?section=competition";
html = draw();
assert.doesNotMatch(html, /data-module="seasons"/);
search = "?section=events";
html = draw();
assert.match(html, /Organization event pages/);
assert.match(html, /25 events/);
const orgQuery = calls.find((x) => x.queryKey[0] === "/organizations");
(async () => {
  await orgQuery.queryFn({ signal: undefined });
  assert.match(request[0], /organizations\/org/);
  assert.equal(request[1].skipAuth, true);
  responseOrgId = "foreign";
  await assert.rejects(orgQuery.queryFn({ signal: undefined }), /not found/);
  responseOrgId = "org";
  sandbox = {
    id: "sandbox",
    account: "account-a",
    data: {
      organization: { id: "org", name: "Private", primarySportKey: "golf" },
    },
  };
  search = "?shop=1";
  html = draw();
  assert.doesNotMatch(html, /data-module="shop"|Facilities &amp; access/);
  assert.equal(calls[0].enabled, false);
  assert(calls[0].queryKey.includes("sandbox:account-a"));
  sandbox = null;
  pending = true;
  html = draw();
  assert.match(html, /role="status"/);
  assert.doesNotMatch(html, /data-module="shop"/);
  pending = false;
  failed = true;
  html = draw();
  assert.match(html, /role="alert"/);
  assert.doesNotMatch(html, /aria-label="Organization sections"/);
  console.log(
    "PASS organization sections, legacy shop/season links, sport-aware competition, scoped event parsing/paging, safe cards, preview news, sandbox isolation, identity validation, loading/error boundaries and shop-only cart mounting.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
