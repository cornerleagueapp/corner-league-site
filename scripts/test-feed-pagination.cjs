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
assert.match(render({ page: 2, count: 2, hasNext: false }), /all caught up/);
assert.match(render({ busy: true }), /disabled="">Loading/);
assert.match(
  render({ page: 49, hasNext: false, atLimit: true }),
  /browsing limit/,
);
console.log(
  "PASS consumer pagination first/middle/last/loading/limit states and accessible controls",
);
