const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const cache = new Map();
let queryState = { data: [] },
  queryOptions,
  response,
  request;
function compile(file) {
  if (cache.has(file)) return cache.get(file);
  const filename = path.resolve(file),
    m = new Module(filename, module);
  m.paths = module.paths;
  m.require = (name) => {
    if (name.endsWith("sports-atlas.webp"))
      return { default: "/sports-atlas.webp" };
    if (name === "@tanstack/react-query")
      return {
        useQuery: (options) => {
          queryOptions = options;
          return { refetch() {}, ...queryState };
        },
      };
    if (name === "@/lib/apiClient")
      return {
        apiFetch: async (...args) => {
          request = args;
          return response;
        },
      };
    if (name === "wouter")
      return {
        Link: ({ children, ...props }) =>
          React.createElement("a", props, children),
      };
    if (name.startsWith("@/") || name.startsWith(".")) {
      const base = name.startsWith("@/")
        ? path.resolve("client/src", name.slice(2))
        : path.resolve(path.dirname(filename), name);
      for (const ext of [".ts", ".tsx"])
        if (fs.existsSync(base + ext)) return compile(base + ext);
    }
    return require(name);
  };
  m._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2021,
      },
    }).outputText,
    filename,
  );
  cache.set(file, m.exports);
  return m.exports;
}
const visuals = compile("client/src/lib/sportVisuals.ts");
const rules = compile("client/src/lib/sportHubEvents.ts");
const row = {
  id: "e/1",
  name: "<script>unsafe</script>",
  sport: "golf",
  organizer: { id: "org/1", name: "Community Club" },
  startDate: "2035-01-03T00:00:00Z",
  endDate: "2035-01-04T00:00:00Z",
  imageUrl: "javascript:alert(1)",
};
const payload = {
  data: {
    sportEvents: [
      row,
      { ...row, sport: "basketball" },
      { ...row, startDate: "invalid" },
      { ...row, endDate: "2020-01-01" },
      { ...row, organizer: null },
    ],
  },
};
const events = rules.upcomingHubEvents(
  payload,
  "golf",
  Date.parse("2035-01-01"),
);
assert.equal(events.length, 1);
assert.equal(events[0].imageUrl, null);
assert.equal(
  rules.hubEventHref("golf", events[0]),
  "/sports/golf/organizations/org%2F1?event=e%2F1",
);
assert.match(rules.hubEventHref("jet-ski", events[0]), /orgId=org%2F1/);
assert.throws(() => rules.upcomingHubEvents({}, "golf"));
assert.deepEqual(rules.upcomingHubEvents(payload, "__proto__"), []);
const artwork = compile(
  "client/src/components/sport-hub/SportArtwork.tsx",
).default;
for (const [key, visual] of Object.entries(visuals.SPORT_VISUALS)) {
  const html = renderToStaticMarkup(
    React.createElement(artwork, { sport: key }),
  );
  assert.match(html, /sports-atlas.webp/);
  assert.ok(visual.tile >= 0 && visual.tile < 16);
  assert.ok(fs.existsSync("public" + visuals.sportLogo(key)));
}
assert.equal(visuals.sportVisual("__proto__").tile, 13);
assert.equal(
  visuals.sportLogo("constructor"),
  "/branding/sport-logo-default.svg",
);
const Hero = compile(
  "client/src/components/sport-hub/SportHubHero.tsx",
).default;
const heroHtml = renderToStaticMarkup(
  React.createElement(Hero, { sport: "golf" }),
);
assert.match(heroHtml, /Golf community/);
assert.match(heroHtml, /Your sport/);
assert.doesNotMatch(heroHtml, /gradient/);
const Events = compile(
  "client/src/components/sport-hub/UpcomingSportEvents.tsx",
).default;
const draw = () =>
  renderToStaticMarkup(React.createElement(Events, { sport: "golf" }));
queryState = { data: events };
let html = draw();
assert.match(html, /&lt;script&gt;unsafe&lt;\/script&gt;/);
assert.doesNotMatch(html, /javascript:/);
queryState = { isPending: true };
assert.match(draw(), /role="status"/);
queryState = { isError: true };
assert.match(draw(), /role="alert"/);
queryState = { data: [] };
assert.match(draw(), /New event dates/);
(async () => {
  response = { ok: true, json: async () => payload };
  await queryOptions.queryFn({ signal: undefined });
  assert.match(request[0], /sportKey=golf/);
  assert.equal(request[1].skipAuth, true);
  assert.equal(request[1].noRefresh, true);
  response = { ok: false };
  await assert.rejects(queryOptions.queryFn({ signal: undefined }), /Unable/);
  console.log(
    "PASS sport-specific artwork/default logos, prototype safety, cross-sport event isolation, dates, encoded links, escaped text, loading/error/empty states, and public event requests.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
