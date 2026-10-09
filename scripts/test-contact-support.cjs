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

let states = [],
  refs = [],
  i = 0,
  ri = 0,
  calls = [],
  fail = true,
  resolve;
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
};
function nodes(n) {
  if (!n || typeof n !== "object") return [];
  return [n, ...React.Children.toArray(n.props?.children).flatMap(nodes)];
}
function render() {
  i = ri = 0;
  return draw();
}
const flush = () => new Promise((r) => setImmediate(r));

const nativeFetch = {
  apiFetch: async (path, opts) => {
    calls.push([path, opts]);
    return {
      ok: !fail,
      status: fail ? 500 : 201,
      json: async () =>
        fail
          ? { message: "Temporary failure" }
          : { status: true, data: { ticketId: "receipt" } },
    };
  },
};
const client = compile("client/src/lib/supportContact.ts", {
  "./apiClient": nativeFetch,
});
const footer = compile("client/src/components/SiteFooter.tsx", {
  wouter: {
    Link: ({ href, children, ...p }) =>
      React.createElement("a", { href, ...p }, children),
  },
  "@/lib/organizationSignup": {
    ORGANIZATION_SIGNUP_URL:
      "https://admin.cornerleague.com/create-organization",
  },
});
const overrides = {
  react: hooks,
  wouter: { Link: "a" },
  "@/lib/supportContact": client,
  "@/components/SiteFooter": { default: footer.default },
  "@/components/navigation/PublicTopNav": { default: () => null },
  "@/seo/usePageSEO": { PageSEO: () => null },
  "lucide-react": { MessageCircle: "i", ArrowUpRight: "i", CheckCircle2: "i" },
};
const page = compile("client/src/pages/clubs/contact.tsx", overrides),
  draw = () => page.default();
const initialPage = compile("client/src/pages/clubs/contact.tsx", {
  ...overrides,
  react: React,
});
const initialHtml = renderToStaticMarkup(
  React.createElement(initialPage.default),
);
for (const id of [
  "contact-name",
  "contact-email",
  "contact-category",
  "contact-title",
  "contact-message",
])
  assert(
    initialHtml.includes(`for="${id}"`) && initialHtml.includes(`id="${id}"`),
  );
assert.equal((initialHtml.match(/<footer/g) || []).length, 1);
assert(initialHtml.includes("sm:grid-cols-2"));
assert(initialHtml.includes("lg:grid-cols-"));

(async () => {
  let t = render();
  for (const [id, value] of [
    ["contact-name", "Jake"],
    ["contact-email", "jake@example.com"],
    ["contact-title", "Help please"],
    ["contact-message", "Please help with my profile"],
  ])
    nodes(t)
      .find((n) => n.props?.id === id)
      .props.onChange({ target: { value } });
  t = render();
  await nodes(t)
    .find((n) => n.type === "form")
    .props.onSubmit({ preventDefault() {} });
  assert(nodes(render()).some((n) => n.props?.role === "alert"));
  assert.equal(states[0].message, "Please help with my profile");
  fail = false;
  t = render();
  await nodes(t)
    .find((n) => n.type === "form")
    .props.onSubmit({ preventDefault() {} });
  assert.equal(calls[0][1].body.submissionId, calls[1][1].body.submissionId);
  assert.equal(calls[0][0], "/support-tickets/contact");
  assert(calls[0][1].skipAuth);
  assert.equal(states[3], "receipt");
  const html = renderToStaticMarkup(React.createElement(footer.default));
  assert(html.includes("Terms &amp; privacy"));
  assert(html.includes("Contact &amp; support"));
  assert(html.includes("noopener noreferrer"));
  assert(html.includes("/community"));
  assert(!html.includes("/clubs"));
  console.log(
    "PASS public contact uses configured API, preserves failed submissions, safely replays receipt IDs, and shared footer links are valid.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
