const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let authenticated = true;
let access = { isSuccess: true, isError: false, data: { organizations: [] } };
function compile(relative, mock = {}) {
  const filename = path.resolve(__dirname, '..', relative);
  const mod = new Module(filename, module);
  mod.filename = filename; mod.paths = module.paths;
  const fallback = mod.require.bind(mod);
  mod.require = name => Object.hasOwn(mock, name) ? mock[name] : fallback(name);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }
  }).outputText, filename);
  return mod.exports;
}
const org = compile('client/src/components/OrgDashboardLink.tsx');
const creation = compile('client/src/components/CreateOrganizationLink.tsx');
const Nav = compile('client/src/components/navigation/PublicTopNav.tsx', {
  react: { ...React, useState: () => [true, () => {}], useEffect: () => {} },
  '@/hooks/useAuth': { useAuth: () => ({ isAuthenticated: authenticated, user: authenticated ? { id: 'u', username: 'user' } : null }) },
  '@/features/organization-admin/hooks/useMyOrganizationAdminOrganizations': { useMyOrganizationAdminOrganizations: () => access },
  '@/components/OrgDashboardLink': org,
  '@/components/CreateOrganizationLink': creation,
  '@/components/community/NotificationCount': { useUnreadNotifications: () => ({ data: { unreadCount: 0 } }), NotificationCount: () => null },
  '@/hooks/useSportSelection': { useSportSelection: () => ({ sports: [], sport: null, selectSport() {}, isJetSki: false }) },
  '@/components/MyRacerProfileLink': { __esModule: true, default: () => null },
  '@/lib/logout': { logout() {} },
  '@assets/CL_Logo.png': 'logo.png',
  wouter: { useLocation: () => ['/', () => {}] },
}).default;
function renderNav() { return renderToStaticMarkup(React.createElement(Nav)); }
assert.match(renderNav(), /Create your own Org/);
assert.doesNotMatch(renderNav(), /Go to Org Dashboard/);
access = { isSuccess: true, isError: false, data: { organizations: [{ organizationId: 'org-1' }] } };
let html = renderNav();
assert.match(html, /Go to Org Dashboard/);
assert.match(html, /href="https:\/\/admin.cornerleague.com" target="_blank" rel="noopener noreferrer"/);
access = { ...access, isSuccess: false };
assert.doesNotMatch(renderNav(), /Go to Org Dashboard/);
access = { ...access, isSuccess: true, isError: true };
assert.doesNotMatch(renderNav(), /Go to Org Dashboard/);
access = { isSuccess: true, isError: false, data: { isGlobalAdmin: true } };
assert.match(renderNav(), /Go to Org Dashboard/);
authenticated = false;
assert.doesNotMatch(renderNav(), /Go to Org Dashboard|Create your own Org/);
const Promo = compile('client/src/components/OrganizationPromoCard.tsx', { './CreateOrganizationLink': creation }).default;
html = renderToStaticMarkup(React.createElement(Promo));
assert.match(html, /Create your own Org/);
assert.match(html, /create-organization\?mode=login/);
assert.match(html, /rel="noopener noreferrer"/);
assert.doesNotMatch(html, /token=|gradient|overlay/);
const source = name => fs.readFileSync(path.resolve(__dirname, '..', name), 'utf8');
assert.doesNotMatch(source('client/src/components/sidebarPanel.tsx'), /<CreateOrganizationLink|<OrgDashboardLink/);
assert.match(source('client/src/layout/AppShell.tsx'), /consumer-page-frame/);
assert.match(source('client/src/components/SiteFooter.tsx'), /Create your own Org/);
console.log('PASS account organizer links: member/admin access, pending/error denial, guest isolation, safe external links, organizer promotion, and sidebar removal.');
