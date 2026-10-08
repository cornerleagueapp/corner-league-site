const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react");
if (!global.crypto) global.crypto = require("node:crypto").webcrypto;
function compile(file, overrides = {}) {
  const m = new Module(file, module);
  m.paths = module.paths;
  m.require = (name) => overrides[name] ?? require(name);
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
let calls = [],
  response,
  fail = false;
const api = {
  apiRequest: async (...args) => {
    calls.push(args);
    if (fail) throw new Error("Connection lost");
    return response;
  },
  apiFetch: async (path, options) => {
    calls.push([path, options]);
    return { ok: true, json: async () => response };
  },
};
const contract = compile("client/src/lib/sportRegistration.ts", {
  "./apiClient": api,
});
const row = {
  id: "class",
  name: "Amateur",
  description: "",
  priceCents: 2500,
  pricePerDay: true,
  dates: ["2027-06-01", "2027-06-02"],
  capacity: 5,
  reservedCount: 0,
  minimumAge: 18,
  maximumAge: null,
  skillLevels: ["amateur"],
  enabled: true,
};
const config = {
  eventId: "event",
  sportKey: "motocross",
  open: true,
  settings: {
    termsText: "Terms",
    version: 1,
    currency: "USD",
    allowCash: true,
    publicRoster: false,
  },
  classes: [row],
};
let states = [],
  stateIndex = 0,
  refs = [],
  refIndex = 0;
const hooks = {
  ...React,
  useState(initial) {
    const index = stateIndex++;
    if (!(index in states))
      states[index] = typeof initial === "function" ? initial() : initial;
    return [
      states[index],
      (value) => {
        states[index] =
          typeof value === "function" ? value(states[index]) : value;
      },
    ];
  },
  useRef(initial) {
    const index = refIndex++;
    return refs[index] ?? (refs[index] = { current: initial });
  },
  useEffect() {},
};
const queries = [];
const page = compile(
  "client/src/components/sport-registration/SportEventRegistration.tsx",
  {
    react: hooks,
    "@/pages/organizations/SandboxContext": { useSandbox: () => null },
    "@/lib/sportRegistration": contract,
    "@/hooks/useAuth": {
      useAuth: () => ({ isAuthenticated: true, user: { id: "account" } }),
    },
    wouter: { Link: (props) => React.createElement("a", props) },
    "@tanstack/react-query": {
      useQuery(options) {
        queries.push(options);
        const data =
          options.queryKey[0] === "sport-athletes"
            ? [
                {
                  id: "profile",
                  sportKey: "motocross",
                  name: "Rider",
                  skillLevel: "amateur",
                },
              ]
            : options.queryKey[0] === "sport-registration"
              ? config
              : { items: [], total: 0 };
        return {
          data,
          isPending: false,
          isError: false,
          refetch: async () => ({ data }),
        };
      },
      useQueryClient: () => ({ invalidateQueries: async () => {} }),
    },
  },
).default;
function render() {
  stateIndex = refIndex = 0;
  const element = page({ eventId: "event", sportKey: "motocross" });
  return element.type(element.props);
}
function nodes(tree, predicate, result = []) {
  if (!tree || typeof tree !== "object") return result;
  if (predicate(tree)) result.push(tree);
  for (const child of React.Children.toArray(tree.props?.children))
    nodes(child, predicate, result);
  return result;
}
(async () => {
  assert.equal(
    contract.registrationReturnPath("https://evil.example"),
    undefined,
  );
  assert.equal(contract.registrationReturnPath("//evil.example"), undefined);
  assert.equal(
    contract.registrationReturnPath(
      "/sports/motocross/organizations/org?event=event",
    ),
    "/sports/motocross/organizations/org?event=event",
  );
  assert.equal(
    contract.estimateSportTotal(
      [row],
      [{ classId: "class", dates: row.dates }],
    ),
    5000,
  );
  assert.equal(
    contract.estimateSportTotal(
      [{ ...row, pricePerDay: false }],
      [{ classId: "class", dates: row.dates }],
    ),
    2500,
  );
  assert.throws(
    () =>
      contract.estimateSportTotal(
        [row],
        [{ classId: "class", dates: ["wrong"] }],
      ),
    /valid/,
  );
  response = { status: true, data: config };
  await contract.getSportConfig("event", "motocross");
  assert.equal(calls[0][1].skipAuth, true);
  assert.equal(calls[0][1].noRefresh, true);
  await assert.rejects(contract.getSportConfig("event", "rc-racing"), /match/);
  response = { data: { items: [] } };
  await assert.rejects(contract.mySportAthletes(), /Invalid/);
  response = { data: [{ id: "profile", sportKey: "rc-racing" }] };
  assert.equal((await contract.mySportAthletes()).length, 1);
  calls = [];
  let tree = render();
  nodes(
    tree,
    (n) => n.type === "input" && n.props.type === "checkbox",
  )[0].props.onChange();
  tree = render();
  nodes(
    tree,
    (n) => n.type === "input" && n.props.type === "email",
  )[0].props.onChange({ target: { value: "rider@example.com" } });
  nodes(
    tree,
    (n) => n.type === "input" && n.props.type === "tel",
  )[0].props.onChange({ target: { value: "5551234" } });
  const checks = nodes(
    tree,
    (n) => n.type === "input" && n.props.type === "checkbox",
  );
  checks[checks.length - 1].props.onChange({ target: { checked: true } });
  tree = render();
  fail = true;
  await nodes(tree, (n) => n.type === "form")[0].props.onSubmit({
    preventDefault() {},
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "POST");
  assert.equal(calls[0][1], "/sport-registration/events/event/registrations");
  assert.equal(calls[0][2].profileId, "profile");
  assert.equal(calls[0][2].quotedTotalCents, 2500);
  assert.equal(calls[0][2].termsVersion, 1);
  assert.equal(calls[0][2].termsAccepted, true);
  assert.equal(calls[0][2].watercraft, undefined);
  tree = render();
  fail = false;
  response = {
    data: {
      id: "registration",
      status: "awaiting_payment",
      totalCents: 2500,
      currency: "USD",
    },
  };
  await nodes(tree, (n) => n.type === "form")[0].props.onSubmit({
    preventDefault() {},
  });
  assert.equal(
    calls[0][2].clientRequestId,
    calls[1][2].clientRequestId,
    "retry must preserve its idempotency token",
  );
  tree = render();
  assert(nodes(tree, (n) => n.props?.role === "status").length > 0);
  assert(!nodes(tree, (n) => n.type === "form").length);
  assert(
    queries.some(
      (q) =>
        q.queryKey[0] === "sport-athletes" && q.queryKey.includes("account"),
    ),
  );
  console.log(
    "PASS sport-scoped responses, anonymous public reads, pricing, actual form submission, no watercraft payload, stable retry IDs and account-scoped profile cache.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
