const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react"),
  { renderToStaticMarkup } = require("react-dom/server");
function load(file, mocks = {}) {
  const m = new Module(file, module);
  m.paths = module.paths;
  m.require = (id) => (Object.hasOwn(mocks, id) ? mocks[id] : require(id));
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
(async () => {
  const options = load("client/src/lib/athletePositions.ts");
  let selected;
  const Picker = load(
    "client/src/components/community/AthletePositionPicker.tsx",
    { "@/lib/athletePositions": options },
  ).default;
  const node = Picker({
    sport: "basketball",
    value: ["PG"],
    onChange: (v) => (selected = v),
  });
  function walk(n, p) {
    if (!n || typeof n !== "object") return [];
    if (Array.isArray(n)) return n.flatMap((x) => walk(x, p));
    return [...(p(n) ? [n] : []), ...walk(n.props?.children, p)];
  }
  const inputs = walk(node, (n) => n.type === "input");
  assert.equal(inputs.length, 5);
  assert.equal(inputs[0].props.checked, true);
  inputs[1].props.onChange({ target: { checked: true } });
  assert.deepEqual(selected, ["PG", "SG"]);
  inputs[0].props.onChange({ target: { checked: false } });
  assert.deepEqual(selected, []);
  assert.equal(Picker({ sport: "golf", value: [], onChange() {} }), null);
  let request;
  const contract = load("client/src/lib/sportRegistration.ts", {
    "./apiClient": {
      apiRequest: async (...args) => {
        request = args;
        return { data: { id: "p", presentation: { positions: ["PG", "SG"] } } };
      },
    },
  });
  const saved = await contract.saveSportAthlete({
    sportKey: "basketball",
    positions: ["PG", "SG"],
  });
  assert.deepEqual(request[2].positions, ["PG", "SG"]);
  assert.deepEqual(saved.presentation.positions, ["PG", "SG"]);
  const trail = load("client/src/components/navigation/Breadcrumbs.tsx", {
    wouter: {
      Link: ({ href, children }) =>
        React.createElement("a", { href }, children),
    },
    "lucide-react": { Home: () => null, ChevronRight: () => null },
    "@/lib/breadcrumbs": {},
  }).BreadcrumbTrail;
  const html = renderToStaticMarkup(
    React.createElement(trail, {
      items: [
        { label: "Home", href: "/" },
        { label: "Basketball", href: "/sports/basketball" },
        { label: "Season" },
      ],
    }),
  );
  assert.ok(html.includes('aria-label="Breadcrumb"'));
  assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
  assert.ok(html.includes('href="/sports/basketball"'));
  assert.equal(trail({ items: [] }), null);
  console.log(
    "PASS multiple sport-specific position choices, submitted profile contract, shared breadcrumb semantics and empty trails",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
