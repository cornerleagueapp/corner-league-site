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
let sandbox = null,
  queries = [],
  requests = [];
const data = {
  eventId: "event",
  organizationId: "org",
  sportKey: "marathon",
  workflow: "timed-endurance",
  schedule: [
    {
      id: "heat",
      classId: "class",
      className: "5K Open",
      label: "Morning wave",
      startsAt: "2026-11-01T09:00:00.000Z",
      durationMinutes: 60,
      round: 1,
      timingBasis: "chip",
      distanceMeters: 5000,
      participants: [
        { id: "entry", profileId: "athlete", name: "Runner", number: "9" },
      ],
    },
  ],
  results: [
    {
      heatId: "heat",
      rows: [
        {
          id: "entry",
          profileId: "athlete",
          name: "Runner",
          number: "9",
          status: "finished",
          position: 1,
          laps: 0,
          elapsedMs: 1230000,
          chipTimeMs: 1200000,
          penaltyMs: 1000,
          adjustedMs: 1201000,
          points: 0,
        },
      ],
    },
  ],
  standings: [],
  schedulePublishedAt: "2026-11-01T08:00:00Z",
  resultsPublishedAt: "2026-11-01T10:00:00Z",
};
const page = compile(
  "client/src/components/sport-registration/SportEventOperations.tsx",
  {
    "@tanstack/react-query": {
      useQuery: (q) => {
        queries.push(q);
        return { data, isError: false, isLoading: false };
      },
    },
    wouter: {
      Link: ({ href, children, ...props }) =>
        React.createElement("a", { href, ...props }, children),
    },
    "@/pages/organizations/SandboxContext": { useSandbox: () => sandbox },
    "@/lib/sportRegistration": {
      publicSportData: async (path) => {
        requests.push(["public", path]);
        return data;
      },
      sandboxSportData: async (id, path) => {
        requests.push(["sandbox", id, path]);
        return data;
      },
    },
  },
);
(async () => {
  assert.equal(page.formatFinishTime(1201000), "0:20:01.000");
  assert.equal(page.formatFinishTime(null), "—");
  assert.throws(() =>
    page.validatePublicOperations(
      { ...data, sportKey: "jet-ski" },
      "event",
      "marathon",
      "org",
    ),
  );
  assert.throws(() =>
    page.validatePublicOperations(
      { ...data, organizationId: "other" },
      "event",
      "marathon",
      "org",
    ),
  );
  const props = {
    eventId: "event",
    sportKey: "marathon",
    organizationId: "org",
  };
  let html = renderToStaticMarkup(React.createElement(page.default, props));
  assert.match(html, /Start waves/);
  assert.match(html, /5 km/);
  assert.match(html, /0:20:01.000/);
  assert.match(html, /chip time/);
  assert.match(html, /\/racer\/athlete\?sport=marathon/);
  assert(!html.includes("Laps"));
  await queries.at(-1).queryFn();
  assert.deepEqual(requests.at(-1), [
    "public",
    "/sport-operations/events/event",
  ]);
  sandbox = { id: "sandbox-org", account: "super-admin" };
  html = renderToStaticMarkup(React.createElement(page.default, props));
  await queries.at(-1).queryFn();
  assert.deepEqual(requests.at(-1), [
    "sandbox",
    "sandbox-org",
    "/sport-operations/events/event",
  ]);
  assert(!html.includes("/racer/athlete"));
  assert(queries.at(-1).queryKey.includes("super-admin"));
  assert(queries.at(-1).queryKey.includes("sandbox-org"));
  data.workflow = "heat-racing";
  data.sportKey = "motocross";
  data.standings = [
    {
      classId: "class",
      className: "Open",
      rows: [{ profileId: "athlete", name: "Runner", points: 20, finishes: 1 }],
    },
  ];
  html = renderToStaticMarkup(
    React.createElement(page.default, { ...props, sportKey: "motocross" }),
  );
  assert.match(html, /Laps/);
  assert.match(html, /Event points standings/);
  assert.match(html, /20 points/);
  console.log(
    "PASS published consumer schedules/results, gun/chip times, sport boundaries, athlete links, racing standings and private sandbox transport/cache identity.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
