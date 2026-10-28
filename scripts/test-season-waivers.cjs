const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react");
function load(file, mocks = {}, extra = "") {
  const m = new Module(file, module);
  m.paths = module.paths;
  m.require = (id) => (Object.hasOwn(mocks, id) ? mocks[id] : require(id));
  m._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8") + extra, {
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
const hook = {
  ...React,
  useState: (v) => [typeof v === "function" ? v() : v, () => {}],
  useRef: (v) => ({ current: v }),
};
const components = load("client/src/components/waivers/SeasonWaivers.tsx", {
  react: hook,
  "@tanstack/react-query": {},
  "@/lib/apiClient": {},
  "@/lib/waiverReceipts": {},
  "@/lib/sportRegistration": {},
  "@/components/ui/button": {},
  "@/components/ui/dialog": {},
});
assert.match(
  components.waiverBlockedReason({ isPending: true, isError: false }),
  /Checking/,
);
assert.match(
  components.waiverBlockedReason({
    isPending: false,
    isFetching: true,
    isError: false,
  }),
  /Checking/,
);
assert.match(
  components.waiverBlockedReason({ isPending: false, isError: true }),
  /could not load/,
);
assert.match(
  components.waiverBlockedReason({
    isPending: false,
    isError: false,
    data: { complete: false },
  }),
  /required season waivers/,
);
assert.equal(
  components.waiverBlockedReason({
    isPending: false,
    isError: false,
    data: { complete: true },
  }),
  null,
);
let gate = {
    data: { complete: false },
    isError: false,
    isPending: false,
    isFetching: false,
    refetch: async () => {},
  },
  profile = {
    id: "p",
    name: "Athlete",
    age: 26,
    email: "a@example.com",
    phone: "555",
    contactName: "Athlete",
  },
  writes = [];
const { RegistrationForm } = load(
  "client/src/pages/season-registration.tsx",
  {
    react: hook,
    "@tanstack/react-query": {
      useQuery: () => ({ data: profile, isPending: false, isError: false }),
    },
    wouter: { Link: "Link" },
    "@/hooks/useAuth": {},
    "@/lib/apiClient": {
      apiRequest: async (...args) => {
        writes.push(args);
      },
    },
    "@/lib/sportRegistration": { unwrapSportData: (v) => v },
    "@/seo/usePageSEO": {},
    "@/components/ui/button": { Button: "Button" },
    "./sport-registration": { RegistrationLogo: "Logo" },
    "@/components/navigation/Breadcrumbs": { BreadcrumbTrail: "Breadcrumbs" },
    "@/components/sms/SeasonSmsContacts": { SeasonSmsContacts: "SmsContacts" },
    "@/components/waivers/SeasonWaivers": {
      SeasonWaiverSigning: "Waivers",
      useSeasonWaivers: () => gate,
      waiverBlockedReason: components.waiverBlockedReason,
    },
  },
  "\nexport {RegistrationForm};",
);
function nodes(n, test) {
  if (Array.isArray(n)) return n.flatMap((v) => nodes(v, test));
  if (!n || typeof n !== "object") return [];
  return [...(test(n) ? [n] : []), ...nodes(n.props?.children, test)];
}
function text(n) {
  return Array.isArray(n)
    ? n.map(text).join("")
    : n && typeof n === "object"
      ? text(n.props?.children)
      : String(n ?? "");
}
(async () => {
  let tree = RegistrationForm({
    id: "season",
    sport: "basketball",
    account: "user",
    onRefresh() {},
  });
  let button = nodes(
    tree,
    (n) =>
      n.type === "Button" && text(n).includes("Confirm season registration"),
  )[0];
  assert.equal(button.props.disabled, true);
  await tree.props.onSubmit({ preventDefault() {} });
  assert.equal(writes.length, 0);
  assert.match(text(tree), /required season waivers/);
  gate = { ...gate, data: { complete: true } };
  tree = RegistrationForm({
    id: "season",
    sport: "basketball",
    account: "user",
    onRefresh() {},
  });
  button = nodes(
    tree,
    (n) =>
      n.type === "Button" && text(n).includes("Confirm season registration"),
  )[0];
  assert.equal(button.props.disabled, false);
  await tree.props.onSubmit({ preventDefault() {} });
  assert.equal(writes.length, 1);
  assert.equal(writes[0][1], "/team-management/seasons/season/register");
  profile = {
    ...profile,
    enrollment: { status: "registered", teamName: "Falcons" },
  };
  tree = RegistrationForm({
    id: "season",
    sport: "basketball",
    account: "user",
    onRefresh() {},
    open: false,
  });
  assert.equal(nodes(tree, (n) => n.type === "Waivers").length, 1);
  assert.equal(
    nodes(
      tree,
      (n) =>
        n.type === "Button" && text(n).includes("Confirm season registration"),
    ).length,
    0,
  );
  console.log(
    "PASS required waiver loading/error/completion gates, blocked submit, registration payload and existing-member signing without duplicate registration",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
const contract = load("client/src/lib/sportRegistration.ts", {
  "./apiClient": {},
});
const receiptPath =
  "/season-waiver-records?season=11111111-1111-4111-a111-111111111111&signature=22222222-2222-4222-a222-222222222222";
assert.equal(contract.registrationReturnPath(receiptPath), receiptPath);
for (const path of [
  receiptPath + "&next=https://example.com",
  "//example.com",
  receiptPath.replace("signature=", "signature=bad"),
])
  assert.equal(contract.registrationReturnPath(path), undefined);
