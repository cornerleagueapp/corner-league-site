const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup: render } = require("react-dom/server");
const { QueryClient } = require("@tanstack/react-query");
let auth = { user: { id: "a" }, isAuthenticated: true };
let identity = { data: { profile: { athleteId: "athlete" } } };
let payload;
let request;
let queryResult = {
  data: { items: [], total: 0, page: 1, hasNextPage: false },
  isError: false,
  isPending: false,
  refetch() {},
};
const options = [];
const mutations = [];
const modules = new Map();
global.window = {
  location: { search: "", origin: "https://cornerleague.com" },
};
function compile(relative) {
  if (modules.has(relative)) return modules.get(relative);
  const filename = path.resolve(__dirname, "..", relative);
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = module.paths;
  const requireOriginal = mod.require.bind(mod);
  mod.require = (name) => {
    if (name === "@/lib/apiClient")
      return {
        apiRequest: async (...args) => {
          request = args;
          if (payload instanceof Error) throw payload;
          return payload;
        },
      };
    if (name === "@/hooks/useAuth") return { useAuth: () => auth };
    if (name === "@/hooks/useMyRacerProfile")
      return { useMyRacerProfile: () => identity };
    if (name === "@tanstack/react-query")
      return {
        useQuery: (opts) => {
          options.push(opts);
          return queryResult;
        },
        useQueryClient: () => ({ invalidateQueries() {}, setQueryData() {} }),
        useMutation: (opts) => {
          mutations.push(opts);
          return { mutate() {}, isError: false, isPending: false };
        },
      };
    if (name === "wouter")
      return {
        Link: ({ children, ...props }) =>
          React.createElement("a", props, children),
        useLocation: () => ["/profile/bob", () => {}],
      };
    if (name.startsWith("@/"))
      name = path.resolve(__dirname, "../client/src", name.slice(2));
    if (name.startsWith("./"))
      name = path.resolve(path.dirname(filename), name);
    if (name.startsWith("/") && !name.includes("/node_modules/")) {
      for (const ext of [".tsx", ".ts"])
        if (fs.existsSync(name + ext))
          return compile(
            path.relative(path.resolve(__dirname, ".."), name + ext),
          );
    }
    return requireOriginal(name);
  };
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  mod._compile(source, filename);
  modules.set(relative, mod.exports);
  return mod.exports;
}
(async () => {
  const api = compile("client/src/lib/socialApi.ts");
  const post = {
    id: "post",
    content: "Hello",
    mediaUrls: [],
    createdAt: "2026-10-02",
    updatedAt: "2026-10-02",
    author: { id: "b", username: "bob" },
    athlete: null,
    likeCount: 0,
    commentCount: 0,
    liked: false,
    canEdit: false,
  };
  payload = {
    status: true,
    data: { items: [post], total: 1, page: 1, hasNextPage: false },
  };
  assert.equal(
    (await api.loadPosts(true, { feed: "following" }, 1)).items[0].content,
    "Hello",
  );
  assert.match(request[1], /^\/community\/me\/posts\?/);
  assert.equal(request[3].logoutOn401, true);
  payload = {
    status: true,
    data: { items: "not-array", total: 1, hasNextPage: false },
  };
  await assert.rejects(api.loadPosts(false, {}, 1), /Unable to read this list/);
  payload = {
    status: true,
    data: { items: [{ ...post, author: null }], total: 1, hasNextPage: false },
  };
  await assert.rejects(api.loadPosts(false, {}, 1), /Unable to read this post/);
  assert.throws(
    () => api.parsePreferences({ likes: "false" }),
    /Unable to read preferences/,
  );
  payload = { status: true, data: { items: "bad", unreadCount: 1 } };
  await assert.rejects(api.loadNotifications(1), /Unable to read this list/);
  payload = {
    status: true,
    data: {
      items: [{ id: "m", senderId: "b", content: "hi", sequence: "1" }],
      hasMore: false,
      latestSequence: 1,
    },
  };
  await assert.rejects(api.loadMessages("thread"), /Unable to read messages/);
  for (const unsafe of [
    "https://evil.test",
    "//evil.test",
    "/messages?thread=id&redirect=evil",
    "javascript:alert(1)",
    "/posts/id/extra",
  ])
    assert.equal(api.safeLocalHref(unsafe), null);
  assert.equal(
    api.safeLocalHref("/messages?thread=abc-123"),
    "/messages?thread=abc-123",
  );
  payload = {
    status: true,
    data: { items: [], total: 0, page: 2, hasNextPage: false },
  };
  await api.loadPeople("bob & alice", 2);
  assert.match(request[1], /search=bob%20%26%20alice&page=2&limit=20/);
  const posts = compile("client/src/components/community/SocialPosts.tsx");
  assert.match(
    render(React.createElement(posts.PostComposer)),
    /Share an update/,
  );
  assert.equal(
    render(
      React.createElement(posts.PostComposer, { athleteId: "other-athlete" }),
    ),
    "",
  );
  auth = { user: null, isAuthenticated: false };
  assert.equal(render(React.createElement(posts.PostComposer)), "");
  const controls = compile(
    "client/src/components/community/UserSocialControls.tsx",
  );
  assert.match(
    render(React.createElement(controls.UserSocialControls, { targetId: "b" })),
    /Sign in to follow or message/,
  );
  assert.match(
    render(React.createElement(controls.UserSocialControls, { targetId: "b" })),
    /href="\/auth\?next=/,
  );
  auth = { user: { id: "a" }, isAuthenticated: true };
  queryResult = {
    ...queryResult,
    data: { isFollowing: true, isBlocked: true, interactionBlocked: true },
  };
  const blocked = render(
    React.createElement(controls.UserSocialControls, { targetId: "b" }),
  );
  assert.match(blocked, /Unblock user/);
  assert.match(blocked, /disabled/);
  assert.match(blocked, /Interactions with this user are unavailable/);
  assert.match(
    render(React.createElement(controls.UserSocialControls, { targetId: "a" })),
    /Edit profile/,
  );
  queryResult = {
    ...queryResult,
    isError: true,
    error: new Error("Network unavailable"),
  };
  assert.match(
    render(React.createElement(posts.default, {})),
    /Network unavailable/,
  );
  const notifications = compile(
    "client/src/pages/profile/notifications.tsx",
  ).default;
  assert.match(
    render(React.createElement(notifications)),
    /Network unavailable/,
  );
  queryResult = {
    ...queryResult,
    isError: false,
    data: { items: [], total: 0, page: 1, hasNextPage: false },
  };
  const messages = compile("client/src/pages/profile/messages.tsx").default;
  assert.match(render(React.createElement(messages)), /No messages yet/);
  assert(
    options.some(
      (o) =>
        o.queryKey[0] === "direct-threads" &&
        o.queryKey[1] === "a" &&
        o.refetchIntervalInBackground === false,
    ),
  );
  const keyA = options.find((o) => o.queryKey[0] === "social-posts").queryKey;
  auth = { user: { id: "b" }, isAuthenticated: true };
  render(React.createElement(posts.default, {}));
  const keyB = options
    .filter((o) => o.queryKey[0] === "social-posts")
    .at(-1).queryKey;
  assert.notDeepEqual(keyA, keyB);
  const client = new QueryClient();
  client.setQueryData(["direct-messages", "a", "thread"], {
    content: "private",
  });
  client.setQueryData(["social-posts", "a"], [post]);
  client.setQueryData(["public-events"], [1]);
  compile("client/src/lib/socialCache.ts").clearCommunityCache(client);
  assert.equal(
    client.getQueryData(["direct-messages", "a", "thread"]),
    undefined,
  );
  assert.equal(client.getQueryData(["social-posts", "a"]), undefined);
  assert.deepEqual(client.getQueryData(["public-events"]), [1]);
  client.clear();
  console.log(
    "Community social checks passed: response envelopes, malformed lists, draft ownership, blocked controls, account cache isolation, safe links, bounded people search, and message/notification error states.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
