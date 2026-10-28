const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react");
const hooks = {
  ...React,
  useState: (v) => [v, () => {}],
  useRef: (v) => ({ current: v }),
};
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
const contract = load("client/src/lib/sportRegistration.ts", {
  "./apiClient": {},
});
assert.equal(contract.unwrapSportData({ status: true, data: null }), null);
const athlete = {
  id: "p",
  name: "Player",
  age: 26,
  email: "p@example.com",
  phone: "555",
};
assert.deepEqual(
  contract.unwrapSportData({ status: true, data: athlete }),
  athlete,
);
assert.deepEqual(contract.unwrapSportData(athlete), athlete);
assert.throws(() => contract.unwrapSportData({ status: false, data: null }));
const logo = load("client/src/pages/sport-registration.tsx", {
  react: hooks,
  wouter: {},
  "@tanstack/react-query": {},
  "@/lib/sportRegistration": contract,
  "@/components/waivers/SeasonWaivers": {
    SeasonWaiverSigning: "SeasonWaiverSigning",
    useSeasonWaivers: () => ({
      data: { complete: true },
      isPending: false,
      isError: false,
      refetch: async () => {},
    }),
    waiverBlockedReason: () => null,
  },
  "@/lib/sportVisuals": {},
  "@/lib/apiClient": {},
  "@/lib/sportHubEvents": {},
  "@/seo/usePageSEO": {},
}).RegistrationLogo;
assert.equal(logo({ name: undefined }).props.children, "CO");
assert.equal(logo({ name: "Player" }).props.children, "PL");
let profile = null;
const page = load("client/src/pages/season-registration.tsx", {
  react: hooks,
  wouter: {
    Link: "a",
    useSearch: () => "?season=11111111-1111-1111-1111-111111111111",
  },
  "@/hooks/useAuth": {
    useAuth: () => ({
      user: { id: "me" },
      isAuthenticated: true,
      isLoading: false,
    }),
  },
  "@tanstack/react-query": {
    useQuery: (q) =>
      q.queryKey[0] === "season-registration-public"
        ? {
            data: {
              id: "s",
              name: "Season",
              leagueName: "League",
              sportKey: "basketball",
              open: true,
            },
          }
        : { data: profile, isPending: false, isError: false },
  },
  "@/lib/apiClient": {},
  "@/lib/sportRegistration": contract,
  "@/components/waivers/SeasonWaivers": {
    SeasonWaiverSigning: "SeasonWaiverSigning",
    useSeasonWaivers: () => ({
      data: { complete: true },
      isPending: false,
      isError: false,
      refetch: async () => {},
    }),
    waiverBlockedReason: () => null,
  },
  "@/components/navigation/Breadcrumbs": { BreadcrumbTrail: "nav" },
  "@/seo/usePageSEO": { PageSEO: "seo" },
  "@/components/ui/button": { Button: "button" },
  "./sport-registration": { RegistrationLogo: logo },
}).default;
function walk(n, p) {
  if (!n || typeof n !== "object") return [];
  if (Array.isArray(n)) return n.flatMap((x) => walk(x, p));
  return [...(p(n) ? [n] : []), ...walk(n.props?.children, p)];
}
const form = walk(
  page(),
  (n) => typeof n.type === "function" && n.type.name === "RegistrationForm",
)[0];
assert.ok(form);
const empty = form.type(form.props);
assert.ok(
  walk(empty, (n) => n.type === "a").some(
    (n) => n.props.children === "Create athlete profile",
  ),
);
profile = athlete;
assert.equal(form.type(form.props).type, "form");
profile = { ...athlete, phone: "" };
const blocked = form.type(form.props),
  button = walk(
    blocked,
    (n) => n.type === "button" && n.props.type === "submit",
  )[0];
assert.equal(button.props.disabled, true);
assert.equal(button.props["aria-describedby"], "registration-blocked-reason");
const reason = walk(
  blocked,
  (n) => n.props?.id === "registration-blocked-reason",
)[0];
assert.ok(JSON.stringify(reason).includes("phone number"));
assert.ok(!JSON.stringify(reason).includes("date of birth"));
profile = athlete;
assert.equal(
  walk(
    form.type(form.props),
    (n) => n.type === "button" && n.props.type === "submit",
  )[0].props.disabled,
  false,
);
console.log(
  "PASS null profile envelope, missing-name logo fallback, create-profile path and existing-athlete form",
);

for (const [status, copy] of [
  ["registered", "already registered"],
  ["assigned", "already registered"],
  ["withdrawn", "Registration cancelled"],
  ["invited", "Invitation awaiting acceptance"],
  ["requested", "Join request pending"],
]) {
  profile = {
    ...athlete,
    enrollment: { status, teamName: status === "assigned" ? "Comets" : null },
  };
  const receipt = form.type({ ...form.props, open: false });
  assert.notEqual(receipt.type, "form");
  assert.ok(JSON.stringify(receipt).includes(copy));
  assert.equal(
    walk(receipt, (n) => n.type === "button" && n.props.type === "submit")
      .length,
    0,
  );
}
profile = athlete;
const closed = form.type({
  ...form.props,
  open: false,
  closedReason: "This season has ended.",
});
assert.ok(JSON.stringify(closed).includes("This season has ended."));
assert.notEqual(closed.type, "form");
console.log(
  "PASS existing enrollment receipts, assigned/withdrawn/pending states, closed seasons and no duplicate registration form",
);
