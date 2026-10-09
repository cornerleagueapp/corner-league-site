const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
let access = {
  isSuccess: true,
  isError: false,
  data: {
    isGlobalAdmin: false,
    organizations: [{ organizationId: "org", role: "owner" }],
  },
};
let auth = { user: { id: "user-a" }, isAuthenticated: true };
const queryOptions = [];
const cache = new Map();
function compile(relative) {
  if (cache.has(relative)) return cache.get(relative);
  const filename = path.resolve(__dirname, "..", relative);
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const compiled = new Module(filename, module);
  compiled.filename = filename;
  compiled.paths = module.paths;
  const load = compiled.require.bind(compiled);
  compiled.require = (name) => {
    if (name === "@/hooks/useSportSelection")
      return {
        useSportSelection: () => ({
          sportKey: "jet-ski",
          sport: { label: "Jet ski" },
          isJetSki: true,
        }),
      };
    if (name === "@/lib/sportNavigation")
      return {
        sportDirectory: () => "/aqua-organizations",
        sportHub: () => "/scores/aqua",
      };
    if (name === "wouter")
      return {
        useLocation: () => ["/", () => undefined],
        Link: ({ href, children }) =>
          React.createElement("a", { href }, children),
      };
    if (
      name ===
      "@/features/organization-admin/hooks/useMyOrganizationAdminOrganizations"
    )
      return { useMyOrganizationAdminOrganizations: () => access };
    if (name === "@/lib/sidebarScroll")
      return compile("client/src/lib/sidebarScroll.ts");
    if (name === "@/hooks/useAuth") return { useAuth: () => auth };
    if (name === "@tanstack/react-query")
      return {
        useQuery: (options) => {
          queryOptions.push(options);
          return access;
        },
      };
    if (name === "../api/myOrganizationAdminApi")
      return { getMyOrganizationAdminOrganizations: () => undefined };
    if (name.startsWith("./"))
      return compile(
        path.posix.join(path.posix.dirname(relative), `${name}.tsx`),
      );
    return load(name);
  };
  compiled._compile(output, filename);
  cache.set(relative, compiled.exports);
  return compiled.exports;
}
const { canOpenOrgDashboard, OrgDashboardLink, ORG_DASHBOARD_URL } = compile(
  "client/src/components/OrgDashboardLink.tsx",
);
assert.equal(ORG_DASHBOARD_URL, "https://admin.cornerleague.com");
assert.equal(canOpenOrgDashboard(false, access.data), false);
assert.equal(
  canOpenOrgDashboard(true, { isGlobalAdmin: false, organizations: [] }),
  false,
);
assert.equal(
  canOpenOrgDashboard(true, { isGlobalAdmin: true, organizations: [] }),
  true,
);
assert.equal(canOpenOrgDashboard(true, access.data), true);
assert.equal(canOpenOrgDashboard(true, { organizations: [{}] }), false);
for (const collapsed of [false, true]) {
  const html = renderToStaticMarkup(
    React.createElement(OrgDashboardLink, { collapsed }),
  );
  assert.match(html, /href="https:\/\/admin.cornerleague.com"/);
  assert.match(html, /aria-label="Go to Org Dashboard"/);
  assert.doesNotMatch(html, /token=/);
  if (!collapsed) assert.match(html, />Go to Org Dashboard<\/span>/);
}
const { useAppSidebarSections, default: SidebarPanel } = compile(
  "client/src/components/sidebarPanel.tsx",
);
let sections;
function Sidebar({ guestMode = false, isSuperAdmin = false }) {
  sections = useAppSidebarSections({ guestMode, isSuperAdmin });
  return React.createElement(SidebarPanel, {
    sections,
    isOpen: true,
    onClose: () => undefined,
    activeKey: "home",
    onChange: () => undefined,
  });
}
function check(show, options = {}) {
  const html = renderToStaticMarkup(React.createElement(Sidebar, options));
  assert.equal(html.includes('aria-label="Go to Org Dashboard"'), show);
  assert.equal(
    sections.some(
      (section) => section.title === "Admin" || section.title === "Org Admin",
    ),
    false,
  );
  assert.equal(
    html.includes('aria-label="Create your own Org"'),
    !options.guestMode && auth.isAuthenticated,
  );
  if (!options.guestMode && auth.isAuthenticated)
    assert.equal(sections[0].organizationCreation, true);
  const keys = sections.flatMap((section) =>
    section.items.map((item) => item.key),
  );
  assert.equal(
    keys.some(
      (key) => key.startsWith("admin-") || key.startsWith("org-admin-"),
    ),
    false,
  );
  for (const key of [
    "home",
    "racing-hub",
    "race-registration",
    "race-organizations",
    "polls",
    "arcade",
  ])
    assert.ok(keys.includes(key));
  if (show)
    assert.ok(sections.some((section) => section.organizationDashboard));
}
check(true);
check(false, { guestMode: true });
access = {
  isSuccess: true,
  isError: false,
  data: { isGlobalAdmin: false, organizations: [] },
};
check(false);
access = { isSuccess: false, isError: false };
check(false, { isSuperAdmin: true });
access = {
  isSuccess: true,
  isError: true,
  data: { isGlobalAdmin: true, organizations: [] },
};
check(false);
access = {
  isSuccess: true,
  isError: false,
  data: { isGlobalAdmin: true, organizations: [] },
};
check(true, { isSuperAdmin: true });
const { useMyOrganizationAdminOrganizations } = compile(
  "client/src/features/organization-admin/hooks/useMyOrganizationAdminOrganizations.ts",
);
useMyOrganizationAdminOrganizations();
assert.deepEqual(queryOptions.at(-1).queryKey, [
  "my-organization-admin-organizations",
  "user-a",
]);
auth = { user: { id: "user-b" }, isAuthenticated: true };
useMyOrganizationAdminOrganizations();
assert.deepEqual(queryOptions.at(-1).queryKey, [
  "my-organization-admin-organizations",
  "user-b",
]);
useMyOrganizationAdminOrganizations(false);
assert.equal(queryOptions.at(-1).enabled, false);
auth = { user: null, isAuthenticated: false };
useMyOrganizationAdminOrganizations();
assert.equal(queryOptions.at(-1).enabled, false);
console.log(
  "PASS consumer sidebar handoff: organization/global access, guest/loading/error states, account-scoped query, accessible expanded/collapsed link, preserved consumer navigation, removed admin tabs",
);
