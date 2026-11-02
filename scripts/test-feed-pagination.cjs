const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react"),
  { renderToStaticMarkup } = require("react-dom/server");
const file = "client/src/features/discovery/FeedPagination.tsx",
  m = new Module(file, module);
m.paths = module.paths;
m._compile(
  ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText,
  file,
);
const render = (p) =>
  renderToStaticMarkup(
    React.createElement(m.exports.default, {
      page: 0,
      count: 12,
      hasNext: true,
      busy: false,
      onPage: () => {},
      ...p,
    }),
  );
assert.match(render({}), /aria-label="Latest updates pages"/);
assert.match(render({}), /disabled="">← Previous/);
assert.doesNotMatch(render({}), /disabled="">Next/);
assert.match(
  render({ page: 2, count: 2, hasNext: false }),
  /Page 3 · 2 updates/,
);
assert.match(
  render({ page: 2, count: 2, hasNext: false }),
  /currently available updates/,
);
assert.match(render({ busy: true }), /disabled="">Loading/);
assert.match(
  render({ page: 49, hasNext: false, atLimit: true }),
  /browsing limit/,
);
console.log(
  "PASS consumer pagination first/middle/last/loading/limit states and accessible controls",
);

assert.match(
  render({ page: 1, count: 12, totalItems: 48, totalPages: 4 }),
  /Page 2 of 4.*13–24 of 48 updates/,
);
assert.match(
  render({ hasNext: false, partial: true }),
  /temporarily unavailable/,
);
