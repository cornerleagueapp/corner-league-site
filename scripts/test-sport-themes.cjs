const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const ts = require("typescript");
const visualModule = new Module("sportVisuals.ts", module);
visualModule._compile(
  ts.transpileModule(
    fs.readFileSync("client/src/lib/sportVisuals.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  "sportVisuals.ts",
);
const moduleFile = new Module("sportTheme.ts", module);
moduleFile.require = (name) =>
  name === "./sportVisuals" ? visualModule.exports : require(name);
moduleFile._compile(
  ts.transpileModule(fs.readFileSync("client/src/lib/sportTheme.ts", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  "sportTheme.ts",
);
const { SPORT_THEMES, sportTheme, sportThemeStyle } = moduleFile.exports;
function luminance(rgb) {
  const channels = rgb
    .split(" ")
    .map(Number)
    .map((value) => {
      const s = value / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a, b) {
  const first = luminance(a),
    second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
for (const [key, palette] of Object.entries(SPORT_THEMES)) {
  assert(
    contrast(palette.accent, "247 244 236") >= 4.5,
    `${key} accent on cream`,
  );
  assert(
    contrast(palette.accent, "255 255 255") >= 4.5,
    `${key} white button labels`,
  );
  assert(
    contrast(palette.bright, "3 9 19") >= 4.5,
    `${key} dark navigation accents`,
  );
  assert.equal(sportThemeStyle(key)["--cl-accent"], palette.accent);
}
assert.equal(sportTheme("unknown"), SPORT_THEMES["jet-ski"]);
assert.equal(sportTheme("__proto__"), SPORT_THEMES["jet-ski"]);
assert.equal(sportTheme("constructor"), SPORT_THEMES["jet-ski"]);
assert(
  contrast("81 98 108", "247 244 236") >= 4.5,
  "muted copy remains readable",
);
const stylesheet = fs.readFileSync(
  "client/src/styles/consumer-theme.css",
  "utf8",
);
for (const token of ["success", "warning", "danger"]) {
  const values = [
    ...stylesheet.matchAll(new RegExp(`--cl-${token}: ([\\d ]+);`, "g")),
  ];
  assert.equal(values.length, 2, `${token} has light and media contexts`);
  assert(contrast(values[0][1], "247 244 236") >= 4.5, `${token} on cream`);
  assert(contrast(values[1][1], "3 9 19") >= 4.5, `${token} on dark media`);
}
console.log(
  "PASS all sport palette contrasts, safe unknown/prototype keys, and theme style selection.",
);
