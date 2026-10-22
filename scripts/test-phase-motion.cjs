const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  ts = require("typescript");
function activeJsx(file, test) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  assert.equal(
    source.parseDiagnostics.length,
    0,
    `Invalid TSX syntax in ${file}`,
  );
  let found = false;
  function visit(node) {
    if (test(node)) found = true;
    ts.forEachChild(node, visit);
  }
  visit(source);
  return found;
}
assert(
  !activeJsx(
    "client/src/components/team-sports/TeamSeasons.tsx",
    (n) =>
      ts.isJsxSelfClosingElement(n) && n.tagName.getText() === "AdmissionOffer",
  ),
);
assert(
  !activeJsx(
    "client/src/components/navigation/PublicTopNav.tsx",
    (n) =>
      ts.isCallExpression(n) &&
      n.expression.getText() === "navigateFromAccount" &&
      n.arguments[0]?.text === "/tickets",
  ),
);
for (const file of [
  "client/src/components/admissions/AdmissionOffer.tsx",
  "client/src/pages/admissions/admissions.tsx",
  "client/src/components/facilities/OrganizationFacilities.tsx",
])
  assert(fs.existsSync(file));
const css = fs.readFileSync("client/src/styles/consumer-motion.css", "utf8");
assert(css.includes("prefers-reduced-motion: no-preference"));
assert(css.includes("prefers-reduced-motion: reduce"));
assert(css.includes("animation: none"));
assert(
  !/\btransform\s*:/.test(css),
  "Keep fixed-position popovers in their existing containing block",
);
assert(css.includes("180ms"));
const app = fs.readFileSync("client/src/layout/AppShell.tsx", "utf8");
assert(app.includes("consumer-page-enter"));
assert(app.includes("key={location}"));
console.log(
  "PASS deferred consumer entry points are inactive, implementations retained, route entrance uses opacity with mobile timing and Reduce Motion.",
);
