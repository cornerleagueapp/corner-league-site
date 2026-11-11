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
  m.filename = filename;
  m.paths = module.paths;
  const fallback = m.require.bind(m);
  m.require = (name) =>
    Object.hasOwn(mocks, name) ? mocks[name] : fallback(name);
  m._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
  return m.exports;
}
let result = { rulebook: null, publishedAt: null },
  failed = false,
  pending = false,
  options;
const rules = compile("client/src/components/team-sports/SeasonRulebooks.tsx", {
  "@tanstack/react-query": {
    useQuery: (value) => {
      options = value;
      return {
        data: result,
        isPending: pending,
        isError: failed,
        refetch() {},
      };
    },
  },
  "@/lib/apiClient": { apiFetch: async () => {} },
  "@/lib/sportRegistration": { publicSportData: async (value) => value },
});
const render = () =>
  renderToStaticMarkup(
    React.createElement(rules.default, { seasonId: "season-one" }),
  );
(async () => {
  assert.match(render(), /hasn’t published/);
  assert.deepEqual(options.queryKey, ["season-rulebook", "season-one"]);
  assert.equal(
    await options.queryFn(),
    "/team-sports/seasons/season-one/rulebook",
  );
  result = {
    publishedAt: "2027-01-01",
    rulebook: {
      title: "<script>alert(1)</script>",
      text: "<img src=x onerror=alert(1)>",
      externalUrl: "https://example.com/rules",
      documents: [
        {
          id: "document",
          name: "rules.pdf",
          size: 1024,
          mediaType: "application/pdf",
        },
      ],
    },
  };
  const html = render();
  assert.ok(!html.includes("<script>"));
  assert.match(html, /&lt;img/);
  assert.match(html, /Download rules.pdf/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.equal(rules.safeRulebookLink("javascript:alert(1)"), null);
  assert.equal(
    rules.safeRulebookLink("https://user:password@example.com"),
    null,
  );
  failed = true;
  assert.match(render(), /Try again/);
  failed = false;
  pending = true;
  assert.match(render(), /Loading season rulebooks/);
  const nav = compile("client/src/lib/seasonNavigation.ts");
  assert.equal(
    nav.seasonTabs.findIndex(([key]) => key === "rulebooks"),
    nav.seasonTabs.findIndex(([key]) => key === "photos") + 1,
  );
  assert.match(
    nav.seasonHref("softball", "season-one", "org", "rulebooks"),
    /tab=rulebooks/,
  );
  assert.match(
    fs.readFileSync("client/src/pages/public-season.tsx", "utf8"),
    /tab === "rulebooks" && <SeasonRulebooks seasonId={d.id}/,
  );
  console.log(
    "PASS public rulebooks: season scoping, publication states, plain-text escaping, safe links, download controls and tab order",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
