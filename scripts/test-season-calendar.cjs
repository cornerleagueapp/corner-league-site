const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path"),
  Module = require("node:module"),
  ts = require("typescript");
const file = path.resolve(__dirname, "..", "client/src/lib/seasonCalendar.ts");
const m = new Module(file, module);
m.filename = file;
m.paths = module.paths;
m._compile(
  ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  file,
);
const { localDay, monthCells, initialMonth, shiftMonth, gamesInMonth } =
  m.exports;
process.env.TZ = "America/Los_Angeles";
assert.equal(localDay("2027-01-01T01:00:00.000Z"), "2026-12-31");
assert.equal(localDay("not a date"), "");
assert.equal(monthCells(new Date(2028, 1, 1)).filter(Boolean).length, 29);
assert.equal(monthCells(new Date(2027, 1, 1)).filter(Boolean).length, 28);
assert.equal(localDay(shiftMonth(new Date(2026, 11, 1), 1)), "2027-01-01");
const games = [
  { id: "late", startsAt: "2026-12-31T23:00:00-08:00" },
  { id: "early", startsAt: "2026-12-01T08:00:00-08:00" },
  { id: "newyear", startsAt: "2027-01-01T08:00:00-08:00" },
  { id: "invalid", startsAt: "invalid" },
];
assert.deepEqual(
  gamesInMonth(games, new Date(2026, 11, 1)).map((g) => g.id),
  ["early", "late"],
);
assert.deepEqual(
  gamesInMonth(games, new Date(2026, 11, 1), "2026-12-31").map((g) => g.id),
  ["late"],
);
assert.equal(
  localDay(initialMonth(games, new Date("2026-12-20T12:00:00-08:00"))),
  "2026-12-01",
);
assert.equal(
  localDay(initialMonth(games, new Date("2028-01-01T00:00:00-08:00"))),
  "2026-12-01",
);
assert.equal(gamesInMonth([], new Date()).length, 0);
assert.equal(localDay("2027-03-14T09:30:00Z"), "2027-03-14");
assert.equal(localDay("2027-03-14T10:30:00Z"), "2027-03-14");
console.log(
  "PASS: calendar local-day boundaries, DST, leap years, month navigation, sorting and empty states",
);
