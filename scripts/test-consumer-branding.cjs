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
const rules = compile("client/src/lib/consumerBranding.ts");
assert.equal(rules.stockHeader("golf"), "/branding/stock-golf.svg");
assert.equal(rules.stockHeader("basketball"), "/branding/stock-team.svg");
assert.equal(rules.stockHeader("motocross"), "/branding/stock-racing.svg");
for (const bad of [
  "javascript:alert(1)",
  "http://example.com/image.png",
  "data:image/svg+xml;base64,abc",
  "https://example.com/with space",
])
  assert.equal(rules.brandingImage(bad), null);
assert.equal(rules.brandingImage("data:image/png;base64,aGVsbG8="), null);
assert.equal(
  rules.brandingImage("data:image/png;base64,aGVsbG8=", true),
  "data:image/png;base64,aGVsbG8=",
);
let sandbox = null,
  queries = [],
  queryError = false,
  failed = false,
  response = {
    kind: "season",
    resourceId: "season",
    organizationId: "org",
    revision: 1,
    effectiveLogoUrl: "https://example.com/logo.png",
    effectiveHeaderImageUrl: "https://example.com/header.png",
  };
const component = compile(
  "client/src/components/branding/ConsumerBrandingHero.tsx",
  {
    react: { ...React, useState: () => [failed, (v) => (failed = v)] },
    "@/pages/organizations/SandboxContext": { useSandbox: () => sandbox },
    "@/tanstack/react-query": {},
    "@tanstack/react-query": {
      useQuery: (q) => {
        queries.push(q);
        return { data: response, isError: queryError };
      },
    },
    "@/lib/sportRegistration": {
      publicSportData: async () => response,
      sandboxSportData: async () => response,
    },
    "@/lib/consumerBranding": rules,
  },
);
const props = {
  kind: "season",
  id: "season",
  organizationId: "org",
  sport: "golf",
  name: "Autumn Open",
};
(async () => {
  let html = renderToStaticMarkup(
    React.createElement(component.default, props),
  );
  assert.match(html, /https:\/\/example.com\/header.png/);
  assert.match(html, /Autumn Open logo/);
  assert.match(html, /Autumn Open branding/);
  assert.match(html, /object-cover/);
  await queries.at(-1).queryFn();
  response = { ...response, organizationId: "wrong" };
  await assert.rejects(queries.at(-1).queryFn(), /does not match/);
  response = { ...response, organizationId: "org" };
  sandbox = { id: "sandbox", account: "account" };
  renderToStaticMarkup(React.createElement(component.default, props));
  assert(queries.at(-1).queryKey.includes("sandbox"));
  assert(queries.at(-1).queryKey.includes("account"));
  assert.equal(queries.at(-1).gcTime, 0);
  queryError = true;
  html = renderToStaticMarkup(React.createElement(component.default, props));
  assert.match(html, /stock-golf.svg/);
  assert.match(html, /stock-logo.svg/);
  assert(!html.includes("example.com/header"));
  const imageProps = {
    src: "https://example.com/broken.png",
    fallback: "/branding/stock-logo.svg",
    alt: "Logo",
    className: "",
  };
  let image = component.BrandingImage(imageProps);
  image.props.onError();
  image = component.BrandingImage(imageProps);
  assert.equal(image.props.src, "/branding/stock-logo.svg");
  for (const name of ["team", "golf", "racing", "logo"])
    assert(
      fs
        .readFileSync(`public/branding/stock-${name}.svg`, "utf8")
        .includes("<svg"),
    );
  console.log(
    "PASS safe image URLs, bundled sport defaults, branded hero rendering, failed-image fallback, query failure fallback, and sandbox/organization isolation.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
