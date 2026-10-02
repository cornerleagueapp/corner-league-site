const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
let auth = { user: { id: "a", username: "jake" }, isAuthenticated: true },
  payload,
  request,
  result = { data: { unreadCount: 137 } },
  search = "",
  accountOpen = false;
const options = [],
  mutations = [],
  invalidations = [],
  modules = new Map();
function compile(relative) {
  if (modules.has(relative)) return modules.get(relative);
  const filename = path.resolve(__dirname, "..", relative),
    m = new Module(filename, module);
  m.filename = filename;
  m.paths = module.paths;
  const fallback = m.require.bind(m);
  m.require = (name) => {
    if (name === "react")
      return {
        ...React,
        useState: (initial) =>
          typeof initial === "string"
            ? [search, () => {}]
            : typeof initial === "boolean"
              ? [accountOpen, () => {}]
              : React.useState(initial),
      };
    if (name === "@/lib/apiClient")
      return {
        apiRequest: async (...args) => {
          request = args;
          if (payload instanceof Error) throw payload;
          return payload;
        },
      };
    if (name === "@/hooks/useAuth") return { useAuth: () => auth };
    if (
      name === "@/components/MyRacerProfileLink" ||
      name === "@/seo/usePageSEO"
    )
      return name.includes("MyRacer")
        ? { default: () => null, __esModule: true }
        : { PageSEO: () => null };
    if (name === "@/lib/logout") return { logout: async () => {} };
    if (name.startsWith("@assets/") || name.endsWith(".jpeg"))
      return "asset.png";
    if (name === "wouter")
      return {
        Link: ({ children, ...props }) =>
          React.createElement("a", props, children),
        useLocation: () => ["/profile/jake", () => {}],
      };
    if (name === "@tanstack/react-query")
      return {
        useQuery: (opts) => {
          options.push(opts);
          return { refetch: () => {}, ...result };
        },
        useQueryClient: () => ({
          invalidateQueries: async (opts) => invalidations.push(opts),
        }),
        useMutation: (opts) => {
          mutations.push(opts);
          return { isPending: false, isError: false, mutate: () => {} };
        },
      };
    if (
      name === "./SocialPosts" ||
      name === "@/components/community/SocialPosts"
    )
      return {
        socialBox: "box",
        socialInput: "input",
        socialButton: "button",
        Pagination: () => null,
        SocialFailure: ({ error }) =>
          React.createElement("p", { role: "alert" }, error.message),
      };
    if (name.startsWith("@/") || name.startsWith(".")) {
      const base = name.startsWith("@/")
        ? "client/src/" + name.slice(2)
        : path.join(path.dirname(relative), name);
      for (const ext of [".tsx", ".ts"])
        if (fs.existsSync(path.resolve(__dirname, "..", base + ext)))
          return compile(base + ext);
    }
    return fallback(name);
  };
  m._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2021,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
  modules.set(relative, m.exports);
  return m.exports;
}
const render = (component, props = {}) =>
  renderToStaticMarkup(React.createElement(component, props));
(async () => {
  const count = compile(
    "client/src/components/community/NotificationCount.tsx",
  );
  payload = { status: true, data: { unreadCount: 137 } };
  assert.equal((await count.loadUnreadNotifications()).unreadCount, 137);
  assert.equal(request[1], "/community/me/notifications/unread-count");
  for (const unreadCount of [-1, "4", 1.5]) {
    payload = { status: true, data: { unreadCount } };
    await assert.rejects(count.loadUnreadNotifications());
  }
  assert.equal(render(count.NotificationCount, { count: 0 }), "");
  assert.equal(render(count.NotificationCount, {}), "");
  const badge = render(count.NotificationCount, { count: 137 });
  assert.match(badge, /99\+/);
  assert.match(badge, /137 unread notifications/);
  const Nav = compile(
    "client/src/components/navigation/PublicTopNav.tsx",
  ).default;
  accountOpen = true;
  const nav = render(Nav);
  assert.match(nav, /Notifications/);
  assert.match(nav, /137 unread notifications/);
  assert.ok(
    options.some(
      (o) =>
        o.queryKey[0] === "social-notification-count" &&
        o.queryKey[1] === "a" &&
        o.enabled,
    ),
  );
  auth = { user: null, isAuthenticated: false };
  const guest = render(Nav);
  assert.doesNotMatch(guest, /unread notifications/);
  assert.equal(options.at(-1).enabled, false);
  auth = { user: { id: "b" }, isAuthenticated: true };
  render(Nav);
  assert.equal(options.at(-1).queryKey[1], "b");
  const Panel = compile(
    "client/src/components/community/UserSearchPanel.tsx",
  ).default;
  search = "";
  render(Panel);
  assert.equal(options.at(-1).enabled, false);
  search = "sam";
  result = {
    data: {
      items: [{ id: "c", username: "sam/name", firstName: "Sam" }],
      page: 1,
      total: 1,
      hasNextPage: false,
    },
  };
  assert.match(render(Panel), /\/profile\/sam%2Fname/);
  assert.ok(options.at(-1).enabled);
  result = { isError: true, error: new Error("Search failed") };
  assert.match(render(Panel), /Search failed/);
  result = { data: { items: [], hasNextPage: false } };
  assert.match(render(Panel), /No matching users/);
  const Page = compile("client/src/pages/profile/notifications.tsx").default;
  result = { data: { items: [], unreadCount: 0, hasNextPage: false } };
  const page = render(Page);
  assert.match(page, /No notifications yet/);
  await mutations.at(-1).onSuccess();
  assert.ok(
    invalidations.some(
      (x) =>
        x.queryKey[0] === "social-notification-count" && x.queryKey[1] === "b",
    ),
  );
  assert.ok(
    invalidations.some((x) => x.queryKey[0] === "social-notifications"),
  );
  console.log(
    "Account notification/search checks passed: total count, response validation, capped accessible badges, guest/account isolation, user search states, safe profile links, and read invalidation.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
