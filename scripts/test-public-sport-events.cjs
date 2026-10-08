const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react"),
  { renderToStaticMarkup } = require("react-dom/server");
let wrongOrg = false,
  wrongSport = false,
  unavailable = false,
  requests = [],
  loaded;
const fixtures = {
  organization: { id: "org", name: "MX Club", primarySportKey: "motocross" },
  sportProfile: {
    key: "motocross",
    label: "Motocross",
    eventSport: "motocross",
  },
};
function compile(file, overrides) {
  const m = new Module(file, module);
  m.paths = module.paths;
  m.require = (name) => overrides[name] ?? require(name);
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
const navigation = compile("client/src/lib/sportNavigation.ts", {}),
  livestream = compile("client/src/lib/eventLivestream.ts", {});
const page = compile("client/src/pages/organizations/public-sport-event.tsx", {
  "@/lib/growthAnalytics": { trackGrowth: () => {} },
  "@/lib/analytics": { trackEvent: () => {} },
  "@/lib/analytics-events": { AnalyticsEvents: {} },
  "@/lib/contentEngagementApi": {
    trackContentEngagementToBackend: async () => {},
  },
  "@/lib/apiClient": {
    apiFetch: async (path, options) => {
      requests.push([path, options]);
      return {
        ok: !unavailable,
        json: async () =>
          path.startsWith("/organizations/")
            ? {
                data: {
                  ...fixtures,
                  organization: {
                    ...fixtures.organization,
                    primarySportKey: wrongSport ? "jet-ski" : "motocross",
                  },
                },
              }
            : {
                sportEvent: {
                  id: "event",
                  name: "MX Weekend",
                  description: "Public event information",
                  sport: "motocross",
                  organizer: { id: wrongOrg ? "other" : "org" },
                  startDate: "2026-11-01",
                  endDate: "2026-11-02",
                  location: "Track",
                  livestreamUrl: "https://example.com/live",
                },
              },
      };
    },
  },
  "@/lib/sportNavigation": navigation,
  "@/lib/eventLivestream": livestream,
  "@/seo/usePageSEO": { PageSEO: () => null },
  wouter: {
    Link: ({ children, ...props }) => React.createElement("a", props, children),
  },
  "@tanstack/react-query": {
    useQuery: (config) => ({ data: loaded, isLoading: false, isError: false }),
  },
});
(async () => {
  loaded = await page.fetchPublicSportEvent("motocross", "org", "event");
  assert.equal(loaded.event.name, "MX Weekend");
  assert(requests.every(([, opts]) => opts.skipAuth && opts.noRefresh));
  const html = renderToStaticMarkup(
    React.createElement(page.default, {
      sportKey: "motocross",
      organizationId: "org",
      eventId: "event",
    }),
  );
  assert(
    html.includes("MX Weekend") &&
      html.includes("MX Club") &&
      html.includes("Track") &&
      html.includes("Watch livestream"),
  );
  assert(
    !html.includes("Jet Ski") &&
      !html.includes("RacePod") &&
      !html.includes("Final Results"),
  );
  wrongOrg = true;
  await assert.rejects(
    page.fetchPublicSportEvent("motocross", "org", "event"),
    /not found/,
  );
  wrongOrg = false;
  wrongSport = true;
  await assert.rejects(
    page.fetchPublicSportEvent("motocross", "org", "event"),
    /not found/,
  );
  wrongSport = false;
  unavailable = true;
  await assert.rejects(
    page.fetchPublicSportEvent("motocross", "org", "event"),
    /unavailable/,
  );
  console.log(
    "PASS public sport event presentation, wrapped/raw contracts, anonymous requests, correct sport/organization boundaries and unavailable handling.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
