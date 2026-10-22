const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react");
const { renderToStaticMarkup: render } = require("react-dom/server");
function compile(relative, mocks = {}) {
  const filename = path.resolve(__dirname, "..", relative),
    m = new Module(filename, module);
  m.filename = filename;
  m.paths = module.paths;
  const fallback = m.require.bind(m);
  m.require = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith("@/") || name.startsWith(".")) {
      const base = name.startsWith("@/")
        ? "client/src/" + name.slice(2)
        : path.join(path.dirname(relative), name);
      for (const ext of [".ts", ".tsx"])
        if (fs.existsSync(path.resolve(__dirname, "..", base + ext)))
          return compile(base + ext, mocks);
    }
    return fallback(name);
  };
  m._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2021,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
  return m.exports;
}
const streams = compile("client/src/lib/eventLivestream.ts");
for (const url of [
  "https://youtu.be/dQw4w9WgXcQ",
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=2",
  "https://youtube.com/live/dQw4w9WgXcQ",
  "https://www.youtube.com/embed/dQw4w9WgXcQ",
])
  assert.equal(
    streams.youtubeEmbedUrl(url),
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0",
  );
for (const url of [
  "javascript:alert(1)",
  "https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ",
  "https://evil.test/embed/dQw4w9WgXcQ",
  "https://user:pass@youtube.com/watch?v=dQw4w9WgXcQ",
  "https://youtu.be/short",
  "http://youtube.com/watch?v=dQw4w9WgXcQ",
])
  assert.equal(streams.youtubeEmbedUrl(url), null, url);
const Stream = compile(
  "client/src/components/events/EventLivestream.tsx",
).default;
let html = render(
  React.createElement(Stream, {
    url: "https://youtu.be/dQw4w9WgXcQ",
    name: "Race weekend",
  }),
);
assert.match(html, /youtube-nocookie.com\/embed/);
assert.match(html, /title="Race weekend livestream"/);
assert.match(html, /loading="lazy"/);
assert.doesNotMatch(html, /autoplay/);
assert.equal(render(React.createElement(Stream, { name: "Race weekend" })), "");
const { breadcrumbsFor } = compile("client/src/lib/breadcrumbs.ts");
assert.deepEqual(breadcrumbsFor("/"), []);
assert.deepEqual(breadcrumbsFor("/auth"), []);
assert.deepEqual(
  breadcrumbsFor("/aqua-organizations/event-details/secret-id?orgId=org"),
  [
    { label: "Home", href: "/" },
    { label: "Organizations", href: "/aqua-organizations" },
    { label: "Event" },
  ],
);
assert.equal(breadcrumbsFor("/sports/golf").at(-1).label, "Golf");
assert.equal(breadcrumbsFor("/community/thread/edit").at(-1).label, "Edit");
assert.ok(
  !JSON.stringify(breadcrumbsFor("/profile/private-username")).includes(
    "private-username",
  ),
);
const org = compile("client/src/lib/organizationPresentation.ts");
const sections = org.organizationSections(false, true, false);
assert.ok(!sections.some((s) => ["shop", "facilities"].includes(s.key)));
assert.equal(org.organizationSection("?shop=1", sections), "overview");
assert.equal(
  org.organizationSection("?section=facilities", sections),
  "overview",
);
const publishing = compile("client/src/lib/publishingApi.ts", {
  "./socialApi": { socialRequest: () => {}, parsePage: () => {} },
});
assert.equal(
  publishing.publishingSports.length,
  new Set(publishing.publishingSports).size,
);
assert.ok(!publishing.publishingSports.includes("football"));
assert.ok(!publishing.publishingSports.includes("running"));
assert.equal(
  publishing.canonicalPublishingSport("football"),
  "american-football",
);
assert.equal(publishing.canonicalPublishingSport("running"), "track-running");
let signedIn = false;
const queries = [];
const Gallery = compile("client/src/components/events/EventPhotoGallery.tsx", {
  "@/hooks/useAuth": {
    useAuth: () => ({
      user: signedIn ? { id: "viewer" } : null,
      isAuthenticated: signedIn,
    }),
  },
  "@tanstack/react-query": {
    useQuery: (options) => {
      queries.push(options);
      return {
        isPending: false,
        isError: false,
        data: { items: [], total: 0, canModerate: false },
      };
    },
    useQueryClient: () => ({ invalidateQueries: async () => {} }),
  },
  "@/lib/apiClient": { apiRequest: async () => ({}) },
  "@/lib/eventGallery": {
    loadEventGallery: async () => ({}),
    writeEventPhoto: async () => ({}),
    responseData: (v) => v,
  },
  wouter: {
    Link: ({ children, ...props }) => React.createElement("a", props, children),
  },
}).default;
html = render(React.createElement(Gallery, { eventId: "event" }));
assert.match(html, /Sign in to share/);
assert.doesNotMatch(html, /type="file"/);
assert.equal(queries.find((q) => q.queryKey.includes("review")).enabled, false);
signedIn = true;
queries.length = 0;
html = render(React.createElement(Gallery, { eventId: "event" }));
assert.match(html, /Upload a photo/);
assert.match(html, /Submit for review/);
assert.match(html, /type="checkbox"[^>]*required/);
assert.match(html, /<button(?=[^>]*type="submit")(?=[^>]*disabled)[^>]*>/);
assert.doesNotMatch(html, /type="checkbox"[^>]*checked/);
assert.ok(
  queries
    .find((q) => q.queryKey.includes("review"))
    .queryKey.includes("viewer"),
);
console.log(
  "PASS safe stream embeds, breadcrumb hierarchy, hidden future tabs, canonical sport choices, authenticated uploads and required sharing consent",
);
