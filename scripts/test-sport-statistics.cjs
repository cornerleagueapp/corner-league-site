const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  Module = require("node:module"),
  ts = require("typescript");
const file = "client/src/lib/sportStatistics.ts",
  m = new Module(file, module);
m._compile(
  ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  file,
);
const { statTotals, derivedStatistics, statLabel } = m.exports;
assert.equal(
  derivedStatistics(
    statTotals(
      [
        { values: { fieldGoalsMade: 1, fieldGoalsAttempted: 1 } },
        { values: { fieldGoalsMade: 1, fieldGoalsAttempted: 9 } },
      ],
      "basketball",
    ),
    "basketball",
  ).fieldGoalPercentage,
  20,
);
assert.equal(derivedStatistics({}, "basketball").fieldGoalPercentage, null);
assert.equal(
  derivedStatistics({ hits: 1, atBats: 3 }, "baseball").battingAverage,
  0.333,
);
assert.equal(statLabel("fieldGoalsMade"), "Field Goals Made");
assert.equal(
  statTotals(
    [{ values: { rushingYards: -4 } }, { values: { rushingYards: 10 } }],
    "american-football",
  ).rushingYards,
  6,
);
console.log(
  "PASS public sport totals, weighted percentages, missing-attempt state, labels and negative yardage",
);
