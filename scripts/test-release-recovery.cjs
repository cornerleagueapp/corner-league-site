const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react"),
  { renderToStaticMarkup } = require("react-dom/server");
const file = "client/src/components/ErrorBoundary.tsx",
  m = new Module(file, module);
m.paths = module.paths;
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
const Boundary = m.exports.default,
  b = new Boundary({
    children: React.createElement("p", null, "Healthy page"),
  });
assert(renderToStaticMarkup(b.render()).includes("Healthy page"));
b.state = { hasError: true, error: new Error("private account payload") };
const html = renderToStaticMarkup(b.render());
assert(html.includes('role="alert"'));
assert(html.includes("Reload page"));
assert(html.includes('href="/contact"'));
assert(!html.includes("private account payload"));
let reloaded = false;
global.window = {
  location: {
    reload: () => {
      reloaded = true;
    },
  },
};
const tree = b.render();
const buttons = tree.props.children[2];
buttons.props.children[0].props.onClick();
assert(reloaded);
delete global.window;
console.log(
  "PASS page recovery, accessible fallback, support link and no raw error exposure.",
);
