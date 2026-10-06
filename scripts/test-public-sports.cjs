const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const Module = require("node:module");
const file = path.resolve(__dirname, "../client/src/lib/publicSports.ts");
const mod = new Module(file, module);
mod._compile(
  ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  file,
);
const { publicSports } = mod.exports;
assert.deepEqual(publicSports(null), []);
assert.deepEqual(publicSports({ data: { sports: {} } }), []);
const rows = [
  { key: "jet-ski", label: "Jet ski", organizationCount: 2 },
  { key: "motocross", label: "Motocross", organizationCount: 1 },
  { key: "baseball", label: "Baseball", organizationCount: 0 },
  { key: "golf", label: "Golf", organizationCount: null },
  { key: "../bad", label: "Bad", organizationCount: 4 },
  { key: "motocross", label: "Duplicate", organizationCount: 3 },
];
const output = publicSports({ status: true, data: { sports: rows } });
assert.deepEqual(
  output.map((s) => s.key),
  ["jet-ski", "motocross"],
);
assert.equal(output[0].href, "/scores/aqua");
assert.equal(output[1].href, "/sports/motocross");
assert.deepEqual(publicSports({ sports: rows }), output);
console.log(
  "PASS public sport availability: empty/malformed/zero-count choices omitted, stable keys, duplicate filtering, and safe sport-specific navigation.",
);
