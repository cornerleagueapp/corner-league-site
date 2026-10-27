const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  Module = require("node:module"),
  ts = require("typescript");
function load(name) {
  const file = path.resolve(__dirname, "../client/src/lib/" + name + ".ts"),
    m = new Module(file, module);
  m.filename = file;
  m.paths = module.paths;
  const fallback = m.require.bind(m);
  m.require = (n) =>
    n === "./seasonCalendar" ? load("seasonCalendar") : fallback(n);
  m._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    file,
  );
  return m.exports;
}
const { dayDate, dayWindow, shiftDay, localDay } = load("eventDay");
process.env.TZ = "America/Los_Angeles";
assert.equal(dayDate("2027-02-29"), null);
assert.ok(dayDate("2028-02-29"));
assert.equal(shiftDay("2026-12-31", 1), "2027-01-01");
assert.equal(shiftDay("2027-01-01", -1), "2026-12-31");
assert.equal(localDay("2027-01-01T01:00:00Z"), "2026-12-31");
for (const [date, hours] of [
  ["2027-03-14", 23],
  ["2027-11-07", 25],
  ["2027-02-04", 24],
]) {
  const w = dayWindow(date);
  assert.equal((Date.parse(w.to) - Date.parse(w.from)) / 3600000, hours);
  assert.equal(localDay(w.from), date);
  assert.equal(localDay(w.to), shiftDay(date, 1));
}
assert.throws(() => dayWindow("invalid"));
process.env.TZ = "Asia/Tokyo";
assert.equal(dayWindow("2027-01-01").from, "2026-12-31T15:00:00.000Z");
console.log(
  "PASS local day ranges, UTC year boundaries, DST 23/25-hour days, leap dates and navigation",
);
