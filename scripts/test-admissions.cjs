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
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    file,
  );
  return m.exports;
}
const apiCalls = [];
let fail = true;
const api = {
  apiFetch: async (path, opts) => {
    apiCalls.push([path, opts]);
    return {
      ok: !fail,
      json: async () =>
        fail
          ? { message: "Temporary failure" }
          : { status: true, data: { ticketIds: ["pass-one"] } },
    };
  },
};
const data = compile("client/src/lib/admissions.ts", {
  "./apiClient": api,
  "./sportRegistration": { unwrapSportData: (x) => x.data ?? x },
});
const now = Date.now(),
  ticketType = {
    id: "type",
    name: "General",
    description: "Join the crowd.",
    capacity: 10,
    issued: 0,
    priceCents: 0,
    currency: "USD",
    coverUrl: null,
    salesStart: new Date(now - 10000).toISOString(),
    salesEnd: new Date(now + 10000).toISOString(),
    entryStart: new Date(now - 10000).toISOString(),
    entryEnd: new Date(now + 10000).toISOString(),
  };
assert.equal(data.admissionAvailability(ticketType, now), "Reserve free pass");
assert.equal(
  data.admissionAvailability({ ...ticketType, issued: 10 }, now),
  "Sold out",
);
assert.equal(
  data.admissionAvailability({ ...ticketType, priceCents: 100 }, now),
  "Paid checkout coming soon",
);
assert.equal(
  data.admissionAvailability(
    { ...ticketType, salesEnd: new Date(now - 1).toISOString() },
    now,
  ),
  "Reservations closed",
);
assert.match(data.admissionRequestId(), /^[a-f0-9-]{36}$/);
let states = [],
  refs = [],
  i = 0,
  ri = 0;
const hooks = {
  ...React,
  useState: (v) => {
    const n = i++;
    if (!(n in states)) states[n] = v;
    return [
      states[n],
      (v) => (states[n] = typeof v === "function" ? v(states[n]) : v),
    ];
  },
  useRef: (v) => refs[ri++] ?? (refs[ri - 1] = { current: v }),
  useEffect: () => {},
};
let query = {
  data: {
    event: {
      key: "event:id",
      name: "Race weekend",
      startsAt: new Date(now).toISOString(),
      location: "Beach",
      organizationName: "League",
    },
    items: [
      ticketType,
      { ...ticketType, id: "paid", name: "VIP", priceCents: 10000 },
      { ...ticketType, id: "sold", name: "Sold out", issued: 10 },
    ],
  },
  isPending: false,
  isError: false,
  refetch: async () => {},
};
const Link = (p) => React.createElement("a", p, p.children),
  SEO = () => null;
const page = compile("client/src/pages/admissions/admissions.tsx", {
  "@/pages/organizations/SandboxContext": { useSandbox: () => null },
  react: hooks,
  "./admissions.css": {},
  wouter: { Link },
  "@/hooks/useAuth": {
    useAuth: () => ({ user: { id: "account" }, isAuthenticated: true }),
  },
  "@tanstack/react-query": {
    useQuery: () => query,
    useQueryClient: () => ({ invalidateQueries: async () => {} }),
  },
  "@/seo/usePageSEO": { PageSEO: SEO },
  "@/lib/admissions": data,
});
function nodes(n) {
  if (!n || typeof n !== "object") return [];
  return [n, ...React.Children.toArray(n.props?.children).flatMap(nodes)];
}
function draw() {
  i = ri = 0;
  const n = page.AdmissionPage({ eventKey: "event:id" });
  return n.type(n.props);
}
(async () => {
  let tree = draw();
  let buttons = nodes(tree).filter(
    (n) => n.type === "button" && n.props.children === "Reserve free pass",
  );
  assert.equal(buttons.length, 1);
  assert(
    nodes(tree).some(
      (n) =>
        n.props?.disabled && n.props.children === "Paid checkout coming soon",
    ),
  );
  await buttons[0].props.onClick();
  await new Promise((r) => setImmediate(r));
  tree = draw();
  assert(nodes(tree).some((n) => n.props?.role === "alert"));
  await nodes(tree)
    .find(
      (n) => n.type === "button" && n.props.children === "Reserve free pass",
    )
    .props.onClick();
  await new Promise((r) => setImmediate(r));
  assert.equal(apiCalls[0][1].body.requestId, apiCalls[1][1].body.requestId);
  assert.equal(apiCalls[0][1].body.quantity, 1);
  assert.equal(apiCalls[0][1].cache, "no-store");
  fail = false;
  tree = draw();
  await nodes(tree)
    .find(
      (n) => n.type === "button" && n.props.children === "Reserve free pass",
    )
    .props.onClick();
  await new Promise((r) => setImmediate(r));
  assert(renderToStaticMarkup(draw()).includes("Your passes are reserved."));
  // Render actual pass markup with a scannable-image placeholder. No browser print is invoked here.
  states = [];
  refs = [];
  i = ri = 0;
  query = {
    data: {
      id: "ticket-one",
      status: "valid",
      qr: "data:image/png;base64,placeholder",
      checkedInAt: null,
      snapshot: {
        eventName: "Race weekend",
        typeName: "General admission",
        organizationName: "League",
        location: "Beach",
        startsAt: new Date(now).toISOString(),
        coverUrl: null,
      },
    },
    isPending: false,
    isError: false,
    isFetching: false,
  };
  let pass = page.TicketPass({
    id: "ticket-one",
    account: "account",
    close: () => {},
  });
  const html = renderToStaticMarkup(pass);
  assert(html.includes("Your admission QR code"));
  assert(html.includes("admission-print-pass"));
  assert(html.includes("One guest"));
  assert(
    nodes(pass).find(
      (n) => n.type === "button" && Array.isArray(n.props.children),
    ).props.disabled,
  );
  nodes(pass)
    .find((n) => n.type === "img" && n.props.alt === "Your admission QR code")
    .props.onLoad();
  i = ri = 0;
  pass = page.TicketPass({
    id: "ticket-one",
    account: "account",
    close: () => {},
  });
  assert.equal(
    nodes(pass).find(
      (n) => n.type === "button" && Array.isArray(n.props.children),
    ).props.disabled,
    false,
  );
  query.data = { ...query.data, status: "cancelled", qr: null };
  i = ri = 0;
  pass = page.TicketPass({
    id: "ticket-one",
    account: "account",
    close: () => {},
  });
  assert(!renderToStaticMarkup(pass).includes("Your admission QR code"));
  assert(renderToStaticMarkup(pass).includes("cancelled"));
  const offer = compile("client/src/components/admissions/AdmissionOffer.tsx", {
    wouter: { Link },
    "@/pages/admissions/admissions": { AdmissionPage: () => null },
  });
  assert(
    renderToStaticMarkup(
      React.createElement(offer.AdmissionOffer, { eventKey: "event:123" }),
    ).includes("/admissions/event%3A123"),
  );
  assert(
    !renderToStaticMarkup(
      React.createElement(offer.AdmissionOffer, {
        eventKey: "event:123",
        sandbox: true,
      }),
    ).includes("href="),
  );
  const app = fs.readFileSync("client/src/App.tsx", "utf8");
  assert(app.includes('path="/tickets"'));
  assert(app.includes('path="/admissions/:key"'));
  assert(
    fs
      .readFileSync("client/src/components/sidebarPanel.tsx", "utf8")
      .includes("My tickets"),
  );
  const css = fs.readFileSync(
    "client/src/pages/admissions/admissions.css",
    "utf8",
  );
  assert(css.includes("@media print"));
  assert(css.includes("body.admission-print-mode *"));
  assert(!/body\s+\*\s*\{\s*visibility/.test(css));
  assert(css.includes("min(100%, 300px)"));
  assert(css.includes("focus-visible"));
  console.log(
    "PASS admission reservation replay, free/paid/sold-out states, private account keys, pass markup, print readiness, revoked QR removal, and sandbox-safe event links.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
