const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react"),
  { renderToStaticMarkup } = require("react-dom/server");
function compile(file, overrides = {}) {
  const m = new Module(file, module);
  m.paths = module.paths;
  m.require = (n) => overrides[n] ?? require(n);
  m._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText,
    file,
  );
  return m.exports;
}
const calls = [];
let failed = false;
const client = compile("client/src/lib/marketingPreferences.ts", {
  "./apiClient": {
    apiFetch: async (path, o) => {
      calls.push([path, o]);
      if (failed) throw new Error("provider unavailable");
      return { ok: true, json: async () => ({}) };
    },
    apiRequest: async () => ({ data: { status: "none" } }),
  },
});
const checkbox = compile(
  "client/src/components/marketing/SignupMarketingCheckbox.tsx",
  {
    "@/lib/sportRegistration": {},
    "@tanstack/react-query": { useQuery: () => ({}) },
  },
);
const consent =
  "I am 18 or older and agree to receive optional Corner League marketing.";
const html = renderToStaticMarkup(
  React.createElement(checkbox.default, {
    checked: false,
    onChange: () => {},
    consentText: consent,
  }),
);
assert(html.includes('type="checkbox"'));
assert(!html.includes('checked=""'));
assert(!html.includes('required=""'));
assert(html.includes("does not affect account creation"));
let identity = { id: "user-a" },
  status = {
    enabled: true,
    consentText: consent,
    email: "a@example.com",
    status: "none",
    delivery: "none",
    promptEligible: true,
  };
const prefs = compile(
  "client/src/components/marketing/MarketingPreferences.tsx",
  {
    "@/hooks/useAuth": { useAuth: () => ({ user: identity }) },
    "@/hooks/use-toast": { useToast: () => ({ toast: () => {} }) },
    "@tanstack/react-query": {
      useQuery: () => ({
        data: status,
        isPending: false,
        isError: false,
        isFetching: false,
        refetch: () => {},
      }),
      useQueryClient: () => ({}),
    },
    "@/lib/marketingPreferences": client,
    "@/lib/apiClient": {},
    "@/components/ui/dialog": {
      Dialog: () => null,
      DialogContent: () => null,
      DialogDescription: () => null,
      DialogHeader: () => null,
      DialogTitle: () => null,
    },
  },
);
function markup() {
  return renderToStaticMarkup(
    React.createElement(prefs.MarketingPreferences, {}),
  );
}
assert(markup().includes("Subscribe to email updates"));
assert(!markup().includes('checked=""'));
status = { ...status, status: "pending" };
assert(markup().includes("Cancel email subscription request"));
assert(markup().includes("Request confirmation again"));
status = { ...status, status: "confirmed", delivery: "suppressed" };
assert(markup().includes("Paused by your email provider preferences"));
assert(markup().includes("Unsubscribe from marketing emails"));
assert(!markup().includes("Subscribe to email updates"));
const a = prefs.MarketingInvitation();
identity = { id: "user-b" };
const b = prefs.MarketingInvitation();
assert.notEqual(a.key, b.key);
const pa = prefs.MarketingPreferences({});
identity = { id: "user-c" };
const pb = prefs.MarketingPreferences({});
assert.notEqual(pa.key, pb.key);
(async () => {
  await client.saveSignupMarketing("test-token", false, true);
  assert.equal(calls.length, 0);
  await client.saveSignupMarketing("test-token", true, false);
  assert.equal(calls[0][0], "/marketing/me/prompt/dismiss");
  assert.deepEqual(calls[0][1].body, {});
  const notice = await client.saveSignupMarketing("test-token", true, true);
  assert.equal(calls[1][0], "/marketing/me/subscribe");
  assert.equal(calls[1][1].body.consent, true);
  assert.equal(calls[1][1].body.adult, true);
  assert.equal(calls[1][1].body.source, "consumer-signup");
  assert(!("email" in calls[1][1].body));
  assert.equal(calls[1][1].headers.Authorization, "Bearer test-token");
  assert(notice.includes("confirm"));
  failed = true;
  assert(
    (await client.saveSignupMarketing("test-token", true, true)).includes(
      "account is ready",
    ),
  );
  console.log(
    "PASS optional signup checkbox, explicit consent, safe auth completion, notification preference states and account isolation.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
// Exercise the invitation lifecycle: claiming consumes eligibility but must not close
// the dialog before a person can choose, and a later mount must not re-open it.
let slots = [],
  slot = 0,
  eligibility = true,
  claimShow = true;
const hooks = {
  ...React,
  useState: (initial) => {
    const i = slot++;
    if (!(i in slots)) slots[i] = initial;
    return [
      slots[i],
      (v) => {
        slots[i] = typeof v === "function" ? v(slots[i]) : v;
      },
    ];
  },
  useEffect: (fn) => {
    fn();
  },
};
const invitation = compile(
  "client/src/components/marketing/MarketingPreferences.tsx",
  {
    react: hooks,
    "@/hooks/useAuth": { useAuth: () => ({ user: { id: "invite-account" } }) },
    "@/hooks/use-toast": { useToast: () => ({ toast: () => {} }) },
    "@tanstack/react-query": {
      useQuery: (opts) =>
        opts.queryKey[0] === "marketing-account"
          ? {
              data: { ...status, status: "none", promptEligible: eligibility },
              isFetching: false,
            }
          : { data: { show: claimShow } },
      useQueryClient: () => ({
        setQueryData: () => {},
        invalidateQueries: async () => {},
      }),
    },
    "@/lib/marketingPreferences": client,
    "@/lib/apiClient": {},
    "@/components/ui/dialog": {
      Dialog: "dialog",
      DialogContent: "div",
      DialogDescription: "p",
      DialogHeader: "header",
      DialogTitle: "h2",
    },
  },
);
function drawInvitation() {
  slot = 0;
  const element = invitation.MarketingInvitation();
  return element.type(element.props);
}
drawInvitation();
assert.equal(drawInvitation().props.open, true);
eligibility = false;
assert.equal(drawInvitation().props.open, true);
drawInvitation().props.onOpenChange(false);
assert.equal(drawInvitation().props.open, false);
slots = [];
assert.equal(drawInvitation().props.open, false);
assert.equal(drawInvitation().props.open, false);
console.log(
  "PASS one-time invitation survives preference refresh and does not reopen on a later visit.",
);

// Confirmation emails require this consumer route to be present in the build.
const routeSource = fs.readFileSync("client/src/App.tsx", "utf8");
const routeAst = ts.createSourceFile(
  "App.tsx",
  routeSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let emailUpdatesRoute = false;
function visitRoutes(node) {
  if (
    (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
    node.tagName.getText(routeAst) === "Route"
  ) {
    for (const attr of node.attributes.properties) {
      if (
        ts.isJsxAttribute(attr) &&
        attr.name.getText(routeAst) === "path" &&
        attr.initializer &&
        ts.isStringLiteral(attr.initializer) &&
        attr.initializer.text === "/email-updates"
      )
        emailUpdatesRoute = true;
    }
  }
  ts.forEachChild(node, visitRoutes);
}
visitRoutes(routeAst);
assert(
  emailUpdatesRoute,
  "Missing /email-updates route in client/src/App.tsx. Do not deploy until the consumer email route is restored.",
);
console.log("PASS consumer /email-updates route is registered.");
