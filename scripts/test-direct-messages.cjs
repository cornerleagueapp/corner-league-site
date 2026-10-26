const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
let result = { unreadCount: 12 },
  auth = { user: { id: "user" }, isAuthenticated: true },
  options,
  requested;
function compile(file) {
  const m = new Module(__filename, module);
  m.paths = module.paths;
  m.require = (id) =>
    id === "@/lib/socialApi"
      ? {
          socialRequest: async (...args) => {
            requested = args;
            return result;
          },
        }
      : id === "@/hooks/useAuth"
        ? { useAuth: () => auth }
        : id === "@tanstack/react-query"
          ? {
              useQuery: (o) => {
                options = o;
                return {};
              },
            }
          : require(id);
  m._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    __filename,
  );
  return m.exports;
}
(async () => {
  const { loadUnreadMessages, useUnreadMessages } = compile(
    "client/src/components/community/DirectMessageCount.tsx",
  );
  assert.deepEqual(await loadUnreadMessages(), { unreadCount: 12 });
  assert.deepEqual(requested, ["GET", "me/threads/unread-count"]);
  for (const bad of [-1, "2", NaN]) {
    result = { unreadCount: bad };
    await assert.rejects(loadUnreadMessages);
  }
  useUnreadMessages();
  assert.deepEqual(options.queryKey, ["direct-message-count", "user"]);
  assert.equal(options.refetchInterval({ state: { error: null } }), 30000);
  assert.equal(
    options.refetchInterval({ state: { error: new Error("429") } }),
    false,
  );
  assert.equal(options.retry, false);
  assert.equal(options.refetchIntervalInBackground, false);
  auth = { user: null, isAuthenticated: false };
  useUnreadMessages();
  assert.equal(options.enabled, false);
  const { NotificationCount } = compile(
    "client/src/components/community/NotificationCount.tsx",
  );
  assert.equal(
    renderToStaticMarkup(
      React.createElement(NotificationCount, {
        count: 0,
        label: "direct messages",
      }),
    ),
    "",
  );
  const badge = renderToStaticMarkup(
    React.createElement(NotificationCount, {
      count: 123,
      label: "direct messages",
    }),
  );
  assert.ok(badge.includes("123 unread direct messages"));
  assert.ok(badge.includes("99+"));
  console.log(
    "PASS authenticated DM count, invalid data, polling pause on error, account scoping and accessible badges",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
