const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
function compile(file, mocks = {}) {
  const filename = path.resolve(file),
    m = new Module(filename, module);
  m.paths = module.paths;
  const fallback = m.require.bind(m);
  m.require = (n) => (Object.hasOwn(mocks, n) ? mocks[n] : fallback(n));
  m._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
  return m.exports;
}
const contract = compile("client/src/widgets/contract.ts");
const data = {
  schemaVersion: 1,
  id: "widget",
  revision: 1,
  title: "<script>Scores</script>",
  kind: "team-scoreboard",
  theme: "dark",
  accent: "#ffffff",
  density: "comfortable",
  organization: { id: "org", name: "Club & League", sportKey: "basketball" },
  sections: [
    {
      id: "games",
      title: "Spring",
      columns: ["Home", "Score", "Away", "Score", "Status"],
      rows: [
        {
          id: "g",
          cells: ["Alpha", "0", "Beta", "0", "Final"],
          status: "final",
          winner: "home",
          startsAt: "2026-10-15T12:00:00Z",
        },
      ],
    },
  ],
  publishedAt: "2026-10-15T12:00:00Z",
  refreshedAt: "2026-10-15T12:00:00Z",
  sourceUrl: "https://www.cornerleague.com/sports/basketball/organizations/org",
};
assert.equal(
  contract.requireWidget(data, "widget", "https://www.cornerleague.com"),
  data,
);
for (const patch of [
  { id: "other" },
  { schemaVersion: 2 },
  { accent: "red;url(https://evil)" },
  { sourceUrl: "javascript:alert(1)" },
  { sourceUrl: "https://evil.example" },
  {
    sections: [
      { id: "x", title: "x", columns: [], rows: [{ id: "x", cells: [{}] }] },
    ],
  },
])
  assert.throws(() =>
    contract.requireWidget(
      { ...data, ...patch },
      "widget",
      "https://www.cornerleague.com",
    ),
  );
assert.throws(() =>
  contract.requireWidget(
    {
      ...data,
      sections: [
        {
          ...data.sections[0],
          rows: [{ ...data.sections[0].rows[0], startsAt: "invalid date" }],
        },
      ],
    },
    "widget",
    "https://www.cornerleague.com",
  ),
);
const { WidgetView } = compile("client/src/widgets/WidgetView.tsx", {
  "./contract": contract,
});
let html = renderToStaticMarkup(React.createElement(WidgetView, { data }));
assert(html.includes("&lt;script&gt;Scores&lt;/script&gt;"));
assert(!html.includes("<script>Scores"));
assert(html.includes("Alpha"));
assert(html.includes(">0</strong>"));
assert(html.includes("noopener noreferrer"));
assert(html.includes("Times in"));
assert(html.includes("Powered by"));
html = renderToStaticMarkup(
  React.createElement(WidgetView, {
    data: { ...data, kind: "team-standings" },
  }),
);
assert(html.includes("<caption"));
assert(html.includes('scope="col"'));
assert(html.includes('scope="row"'));
html = renderToStaticMarkup(
  React.createElement(WidgetView, { data: { ...data, kind: "team-bracket" } }),
);
assert(html.includes("scroll horizontally"));
assert(html.includes("List view"));
assert(html.includes('aria-pressed="false"'));
html = renderToStaticMarkup(
  React.createElement(WidgetView, { data: { ...data, sections: [] } }),
);
assert(html.includes("No published entries yet"));
const { startWidgetPolling } = compile("client/src/widgets/poller.ts");
const original = {
  document: global.document,
  setTimeout: global.setTimeout,
  clearTimeout: global.clearTimeout,
};
let hidden = false,
  serial = 0;
const timers = new Map(),
  listeners = new Set(),
  calls = [],
  received = [],
  busy = [],
  errors = [];
global.document = {
  get hidden() {
    return hidden;
  },
  addEventListener: (_n, fn) => listeners.add(fn),
  removeEventListener: (_n, fn) => listeners.delete(fn),
};
global.setTimeout = (fn, delay) => {
  const id = ++serial;
  timers.set(id, { fn, delay });
  return id;
};
global.clearTimeout = (id) => timers.delete(id);
const flush = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};
(async () => {
  try {
    const polling = startWidgetPolling({
      load: (signal) =>
        new Promise((resolve, reject) => {
          calls.push({ resolve, reject, signal });
          signal.addEventListener("abort", () => reject(Error("Aborted")), {
            once: true,
          });
        }),
      onData: (d) => received.push(d),
      onBusy: (v) => busy.push(v),
      onError: (e) => errors.push(e),
    });
    assert.equal(calls.length, 1);
    assert.equal(busy.at(-1), true);
    calls[0].resolve(data);
    await flush();
    assert.equal(received.at(-1), data);
    assert(
      [...timers.values()].some((t) => t.delay >= 60000 && t.delay < 65000),
    );
    hidden = true;
    listeners.forEach((fn) => fn());
    assert.equal(received.at(-1), undefined);
    hidden = false;
    listeners.forEach((fn) => fn());
    assert.equal(calls.length, 2);
    hidden = true;
    listeners.forEach((fn) => fn());
    hidden = false;
    listeners.forEach((fn) => fn());
    await flush();
    assert.equal(
      calls.length,
      3,
      "A quick tab return must immediately retry after the aborted request",
    );
    calls[2].reject(
      Error("This widget or its published source is no longer available."),
    );
    await flush();
    assert.equal(received.at(-1), undefined);
    assert(errors.at(-1).includes("no longer available"));
    assert([...timers.values()].some((t) => t.delay >= 120000));
    const count = received.length;
    polling.stop();
    assert.equal(listeners.size, 0);
    assert.equal(timers.size, 0);
    await flush();
    assert.equal(received.length, count);
  } finally {
    global.document = original.document;
    global.setTimeout = original.setTimeout;
    global.clearTimeout = original.clearTimeout;
  }
  if (fs.existsSync("dist/widgets/widget.js")) {
    const visited = new Set();
    let bytes = 0;
    function graph(file) {
      file = path.resolve(file);
      if (visited.has(file)) return;
      visited.add(file);
      const text = fs.readFileSync(file, "utf8");
      bytes += Buffer.byteLength(text);
      for (const match of text.matchAll(/from\s*["']([^"']+)["']/g))
        if (match[1].startsWith("."))
          graph(path.resolve(path.dirname(file), match[1]));
    }
    graph("dist/widgets/widget.js");
    assert(bytes < 250000, `Widget JS graph grew unexpectedly: ${bytes}`);
    assert(fs.existsSync("dist/widgets/widget.css"));
    console.log(
      `Widget JavaScript graph: ${bytes} bytes across ${visited.size} files.`,
    );
  }
  const entry = fs.readFileSync("client/src/widgets/entry.tsx", "utf8");
  assert(
    !/apiClient|localStorage|sessionStorage|firebase|Authorization/.test(entry),
  );
  assert(
    entry.includes("credentials:'omit'") ||
      entry.includes('credentials: "omit"'),
  );
  console.log(
    "PASS widget contract/version/origin checks, safe rendered text, zero scores, accessible standings/bracket states, empty states, hidden-tab clearing, rapid-resume race, failed-refresh revocation, backoff, cleanup and lightweight build output.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

for (const kind of ["event-card", "team-schedule", "athlete-spotlight", "sponsor-spotlight", "event-recap", "announcement"]) {
  assert.equal(contract.requireWidget({...data, kind}, "widget", "https://www.cornerleague.com").kind, kind);
}
console.log("PASS enhanced media widget contracts");
