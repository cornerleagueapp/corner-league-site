const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react"),
  { renderToStaticMarkup } = require("react-dom/server");
function load(file, mocks = {}) {
  const m = new Module(file, module);
  m.paths = module.paths;
  m.require = (n) =>
    Object.hasOwn(mocks, n) ? mocks[n] : n.endsWith(".css") ? {} : require(n);
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
const data = load("client/src/features/local-discovery/data.ts");
const row = {
  id: "id",
  title: "Adult basketball",
  summary: "Public program details.",
  sport: "basketball",
  city: "Riverside",
  county: "Riverside",
  audience: "adult",
  eligibility: "18+",
  type: "registration",
  sourceUrl: "https://parks.example.org/info",
  actionUrl: "https://parks.example.org/signup",
  source: { name: "City Parks", url: "https://parks.example.org/info" },
  lastVerifiedAt: "2026-11-01T12:00:00Z",
  expiresAt: "2026-11-08T12:00:00Z",
  startsAt: null,
  endsAt: null,
  registrationOpensAt: null,
  registrationClosesAt: null,
  sourcePublishedAt: null,
};
assert.equal(data.localOpportunity(row), row);
for (const change of [
  { actionUrl: "javascript:alert(1)" },
  { source: { name: "Bad", url: "http://bad.example.org" } },
  { lastVerifiedAt: "bad" },
  { startsAt: "bad" },
  { title: "" },
])
  assert.throws(() => data.localOpportunity({ ...row, ...change }));
const Card = load(
  "client/src/features/local-discovery/LocalDiscoveryCard.tsx",
  {
    "./data": data,
    wouter: {
      Link: ({ href, children, ...props }) =>
        React.createElement("a", { href, ...props }, children),
    },
    "@/components/sport-hub/SportArtwork": {
      default: () => React.createElement("div", null, "Sport artwork"),
    },
    "@/lib/sportVisuals": { SPORT_VISUALS: { basketball: {} } },
    "lucide-react": { MapPin: () => null, ExternalLink: () => null },
  },
).default;
const html = renderToStaticMarkup(React.createElement(Card, { item: row }));
for (const re of [
  /Local discovery/,
  /18\+/,
  /Source:/,
  /City Parks/,
  /Last verified/,
  /href="https:\/\/parks.example.org\/signup"/,
  /rel="noopener noreferrer"/,
  /href="\/local-discovery\/id"/,
])
  assert.match(html, re);
const detail = renderToStaticMarkup(
  React.createElement(Card, {
    item: { ...row, sport: "pickleball" },
    detail: true,
  }),
);
assert.match(detail, /<h1>Adult basketball<\/h1>/);
assert.match(detail, /Corner League is not its organizer/);
assert.doesNotMatch(detail, /Sport artwork/);
console.log(
  "Local discovery validation, attribution, safe links, fallback artwork and detail rendering passed",
);

const news = renderToStaticMarkup(
  React.createElement(Card, {
    item: {
      ...row,
      type: "announcement",
      sourcePublishedAt: "2026-10-20T12:00:00Z",
    },
  }),
);
assert.match(news, /News &amp; updates/);
assert.match(news, /Read article/);
assert.match(news, /Published /);
assert.match(news, /dateTime="2026-10-20T12:00:00Z"/);
assert.doesNotMatch(
  news,
  /Last verified|<dt>Who<|View organizer details|local-discovery-facts/,
);
const newsDetail = renderToStaticMarkup(
  React.createElement(Card, {
    item: { ...row, type: "announcement" },
    detail: true,
  }),
);
assert.match(newsDetail, /Publication date unavailable/);
assert.match(newsDetail, /original publisher/);
assert.doesNotMatch(newsDetail, /provides the program/);
