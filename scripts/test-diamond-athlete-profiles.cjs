const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const React = require("react");
const ts = require("typescript");
const { renderToStaticMarkup } = require("react-dom/server");

function load(file, mocks = {}) {
  const mod = new Module(file, module);
  mod.paths = module.paths;
  mod.require = (name) => mocks[name] ?? require(name);
  mod._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText, file);
  return mod.exports;
}

const positions = load("client/src/lib/athletePositions.ts");
const api = load("client/src/lib/sportRegistration.ts", { "./apiClient": {} });
const picker = load("client/src/components/community/AthletePositionPicker.tsx", {
  "@/lib/athletePositions": positions,
});
let sport;
const empty = { default: () => null };
const { default: Profiles } = load("client/src/pages/sport-athlete-profiles.tsx", {
  "@/components/community/AthletePositionPicker": picker,
  "@/components/community/AthleteDetailsFields": empty,
  "@/components/team-sports/PrivateTeamContact": empty,
  "@/components/team-sports/TeamRosterInvites": empty,
  "@/components/team-sports/SeasonRegistrationHistory": empty,
  "@/hooks/useAuth": { useAuth: () => ({ isAuthenticated: true, user: { id: "athlete" } }) },
  "@/hooks/useSportSelection": {
    useSportSelection: () => ({ sportKey: "basketball", sports: [{ key: "basketball" }] }),
  },
  "@/lib/sportRegistration": api,
  "@/lib/apiClient": {},
  "@tanstack/react-query": {
    useQuery: ({ queryKey }) => ({
      data: queryKey[0] === "sport-athletes" ? [] : { items: [], total: 0 },
    }),
    useQueryClient: () => ({}),
  },
  wouter: {
    Link: ({ children }) => children,
    useSearch: () => `sport=${sport}`,
    useLocation: () => ["/create-racer-profile", () => {}],
  },
});
for (const [key, label] of [["baseball", "Baseball"], ["softball", "Softball"]]) {
  sport = key;
  const html = renderToStaticMarkup(React.createElement(Profiles));
  assert.match(html, />Baseball<\/button>/);
  assert.match(html, />Softball<\/button>/);
  assert(html.includes(`Create your ${label} profile`));
  assert.match(html, /Pitcher \(P\)/);
  assert.match(html, /Shortstop \(SS\)/);
  assert.match(html, /Right field \(RF\)/);
  assert.equal((html.match(/type="checkbox"/g) || []).length, 9);
  const onChange = [];
  const element = picker.default({ sport, value: ["C"], onChange: (value) => onChange.push(value) });
  const labels = element.props.children[2].props.children;
  labels[0].props.children[0].props.onChange({ target: { checked: true } });
  assert.deepEqual(onChange, [["C", "P"]]);
}
assert.deepEqual(positions.positionOptions.basketball, ["PG", "SG", "SF", "PF", "C"]);
console.log("PASS first-time baseball and softball profiles, nine position choices, and multiple selections");
