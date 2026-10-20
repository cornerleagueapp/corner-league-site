const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
let saved,
  blocked = false,
  systemDark = true,
  cleaned = 0;
const listeners = new Map();
const media = {
  get matches() {
    return systemDark;
  },
  addEventListener: (_, f) => listeners.set("system", f),
  removeEventListener: () => cleaned++,
};
const storage = {
  getItem: () => {
    if (blocked) throw Error();
    return saved;
  },
  setItem: (_, value) => {
    if (blocked) throw Error();
    saved = value;
  },
};
const document = {
  documentElement: { dataset: {}, style: {} },
  querySelector: () => ({ setAttribute() {} }),
};
const window = {
  matchMedia: () => media,
  addEventListener: (name, fn) => listeners.set(name, fn),
  removeEventListener: () => cleaned++,
  dispatchEvent: (event) => listeners.get(event.type)?.(),
};
const code = fs.readFileSync(
  path.join(root, "client/src/lib/colorMode.ts"),
  "utf8",
);
let subscribe;
const themeApi = {};
vm.runInNewContext(
  ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
    },
  }).outputText,
  {
    exports: themeApi,
    localStorage: storage,
    window,
    document,
    Event: class {
      constructor(type) {
        this.type = type;
      }
    },
    require: (name) => {
      assert.equal(name, "react");
      return {
        useSyncExternalStore: (fn, get) => {
          subscribe = fn;
          return get();
        },
      };
    },
  },
);
assert.equal(themeApi.currentColorMode(), "dark");
themeApi.applyColorMode();
assert.equal(document.documentElement.dataset.colorMode, "dark");
themeApi.setColorMode("light");
assert.equal(saved, "light");
assert.equal(themeApi.currentColorMode(), "light");
themeApi.useColorMode();
let updates = 0;
const dispose = subscribe(() => updates++);
systemDark = false;
listeners.get("system")();
assert.equal(updates, 0);
saved = "dark";
listeners.get("storage")({ key: themeApi.COLOR_MODE_KEY });
assert.equal(document.documentElement.dataset.colorMode, "dark");
saved = undefined;
listeners.get("storage")({ key: null });
assert.equal(themeApi.currentColorMode(), "light");
blocked = true;
themeApi.setColorMode("dark");
assert.equal(themeApi.currentColorMode(), "dark");
themeApi.setColorMode("light");
assert.equal(themeApi.currentColorMode(), "light");
dispose();
assert.equal(cleaned, 3);
for (const preference of [undefined, "light", "dark", "invalid"]) {
  blocked = false;
  saved = preference;
  systemDark = true;
  vm.runInNewContext(
    fs.readFileSync(path.join(root, "public/consumer-theme-init.js"), "utf8"),
    { localStorage: storage, window, document },
  );
  assert.equal(
    document.documentElement.dataset.colorMode,
    preference === "light" ? "light" : "dark",
  );
}
const lum = (rgb) =>
  rgb
    .map((v) => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    })
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) =>
  (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
for (const bg of [
  [22, 24, 28],
  [34, 38, 45],
  [44, 49, 57],
])
  for (const fg of [
    [244, 246, 248],
    [186, 196, 207],
    [103, 232, 249],
  ])
    assert.ok(contrast(fg, bg) >= 4.5);
console.log(
  "PASS device/default theme, saved toggle, first paint, cross-tab updates, blocked storage, cleanup and Graphite text contrast",
);

const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const skeletonExports = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(
      path.join(root, "client/src/components/ui/LoadingCards.tsx"),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText,
  { exports: skeletonExports, require },
);
const markup = renderToStaticMarkup(
  React.createElement(skeletonExports.default, {
    label: "Loading athletes…",
    count: 3,
  }),
);
assert.match(markup, /role="status"/);
assert.match(markup, /aria-busy="true"/);
assert.match(markup, /aria-hidden="true"/);
assert.match(markup, /Loading athletes/);
assert.equal((markup.match(/class="cl-loading-card"/g) || []).length, 3);
console.log(
  "PASS bounded static skeletons, one announced status and decorative placeholders hidden from screen readers",
);
