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
function nodes(n, p) {
  if (!n || typeof n !== "object") return [];
  if (Array.isArray(n)) return n.flatMap((x) => nodes(x, p));
  return [...(p(n) ? [n] : []), ...nodes(n.props?.children, p)];
}
(async () => {
  for (const action of ["confirm", "unsubscribe"]) {
    let state = [],
      cursor = 0,
      calls = [];
    global.window = { location: { hash: `#${action}=${"a".repeat(64)}` } };
    const hooks = {
      ...React,
      useEffect() {},
      useRef: (v) => ({ current: v }),
      useState: (init) => {
        const i = cursor++;
        if (!(i in state))
          state[i] = typeof init === "function" ? init() : init;
        return [
          state[i],
          (v) => (state[i] = typeof v === "function" ? v(state[i]) : v),
        ];
      },
    };
    const Page = load("client/src/pages/email-updates.tsx", {
      react: hooks,
      wouter: { Link: "a" },
      "@/components/marketing/NewsletterForm": { default: () => null },
      "@/lib/apiClient": {
        apiRequest: async (...args) => {
          calls.push(args);
          return { status: true, data: { message: "Confirmed successfully" } };
        },
      },
      "@/lib/sportRegistration": { unwrapSportData: (j) => j.data ?? j },
    }).default;
    const render = () => {
      cursor = 0;
      return Page();
    };
    const button = nodes(render(), (n) => n.type === "button")[0];
    button.props.onClick();
    await new Promise(setImmediate);
    const tree = render();
    assert.equal(calls[0][1], `/marketing/${action}`);
    assert.equal(calls.length, 1);
    assert.equal(nodes(tree, (n) => n.props.role === "alert").length, 0);
    assert.ok(JSON.stringify(tree).includes("Confirmed successfully"));
    assert.equal(nodes(tree, (n) => n.type === "button").length, 0);
  }
  const Honors = load(
    "client/src/components/team-sports/SeasonExcellence.tsx",
    {
      wouter: {
        Link: ({ href, children, ...p }) =>
          React.createElement("a", { href, ...p }, children),
      },
      "lucide-react": { Trophy: () => null, Star: () => null },
      "./GameCard": {
        default: ({ data }) =>
          React.createElement(
            "div",
            { "data-game": data.game.id },
            "Game card",
          ),
        athleteHref: (sport, id) => `/athlete/${id}?sport=${sport}`,
      },
    },
  ).default;
  const season = {
    sportKey: "basketball",
    id: "s",
    name: "2027",
    leagueName: "League",
    games: [{ id: "g", status: "scheduled" }],
    results: [],
    teams: [],
    excellence: {
      allStarGameId: "g",
      awards: [
        { title: "MVP", name: "Jordan", profileId: "p", group: null },
        { title: "All-Star", name: "Jordan", profileId: "p", group: "East" },
      ],
    },
  };
  const html = renderToStaticMarkup(React.createElement(Honors, { season }));
  assert.ok(html.includes("All-Stars &amp; Awards"));
  assert.ok(html.includes("/athlete/p?sport=basketball"));
  assert.ok(html.includes('data-game="g"'));
  assert.equal(Honors({ season: { ...season, excellence: null } }), null);
  assert.ok(
    !renderToStaticMarkup(
      React.createElement(Honors, { season: { ...season, games: [] } }),
    ).includes("data-game="),
  );
  delete global.window;
  console.log(
    "PASS parsed email confirmation/unsubscribe responses, success state, athlete honor links, published game association and hidden empty honors",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
