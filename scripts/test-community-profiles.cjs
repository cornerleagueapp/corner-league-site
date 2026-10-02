const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
let auth = { user: { id: "account-a" }, isAuthenticated: true };
let response;
let savedUser;
let request;
let state = {
  data: {
    athleteId: "athlete",
    isFollowing: false,
    isOwnAthlete: false,
    followerCount: 3,
  },
  isPending: false,
  isError: false,
  refetch: () => {},
};
let list = {
  data: { items: [], total: 0, page: 1, limit: 12, hasNextPage: false },
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: () => {},
};
let mutation;
let mutationOptions;
let navigated;
const queryOptions = [];
const saved = [];
const invalidated = [];
const cache = {
  setQueryData: (...args) => saved.push(args),
  invalidateQueries: async (options) => invalidated.push(options),
};
const modules = new Map();
function compile(relative) {
  if (modules.has(relative)) return modules.get(relative);
  const filename = path.resolve(__dirname, "..", relative);
  const compiled = new Module(filename, module);
  compiled.filename = filename;
  compiled.paths = module.paths;
  const load = compiled.require.bind(compiled);
  compiled.require = (name) => {
    if (name === "@/lib/apiClient")
      return {
        scheduleProactiveRefresh: () => {},
        apiRequest: async (...args) => {
          request = args;
          if (response instanceof Error) throw response;
          return response;
        },
      };
    if (name === "@/lib/token")
      return {
        getAccessToken: () => "token",
        getRefreshToken: () => null,
        loadUser: () => null,
        saveUser: (user) => {
          savedUser = user;
        },
      };
    if (name === "@/hooks/useAuth") return { useAuth: () => auth };
    if (name === "wouter")
      return {
        Link: ({ children, ...props }) =>
          React.createElement("a", props, children),
        useLocation: () => [
          "/",
          (url) => {
            navigated = url;
          },
        ],
      };
    if (name === "@tanstack/react-query")
      return {
        useQueryClient: () => cache,
        useQuery: (options) => {
          queryOptions.push(options);
          return options.queryKey[0] === "profile-athletes"
            ? list
            : options.queryKey[0] === "athlete-follow-summary"
              ? { data: { followerCount: 3 } }
              : state;
        },
        useMutation: (options) => {
          mutationOptions = options;
          return {
            mutate: (value) => {
              mutation = value;
            },
            isPending: false,
            isError: false,
          };
        },
      };
    if (name.startsWith("@/assets/")) return "avatar.png";
    if (name.startsWith("@/")) {
      const base = "client/src/" + name.slice(2);
      return compile(
        base +
          (fs.existsSync(path.resolve(__dirname, "..", base + ".tsx"))
            ? ".tsx"
            : ".ts"),
      );
    }
    return load(name);
  };
  compiled._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2021,
      },
    }).outputText,
    filename,
  );
  modules.set(relative, compiled.exports);
  return compiled.exports;
}
const wrap = (data) => ({ status: true, data, statusCode: 200 });
const render = (component, props) =>
  renderToStaticMarkup(React.createElement(component, props));
(async () => {
  const api = compile("client/src/lib/communityApi.ts");
  const racer = {
    athleteId: "athlete",
    name: "Racer",
    imageUrl: null,
    profileUrl: "/racer/detail",
    sportKey: "jet-ski",
    isVerifiedAthlete: true,
  };
  const profile = {
    user: {
      id: "account",
      username: "jake",
      tags: { profile: [] },
      sportInterests: [],
    },
    racerProfile: racer,
  };
  response = wrap(profile);
  assert.deepEqual(await api.getCommunityProfile("jake"), profile);
  assert.equal(request[1], "/community/profiles/jake");
  response = wrap({
    ...profile,
    racerProfile: { ...racer, profileUrl: "javascript:alert(1)" },
  });
  await assert.rejects(api.getCommunityProfile("jake"));
  response = wrap(state.data);
  assert.deepEqual(await api.setAthleteFollow("athlete", true), state.data);
  assert.deepEqual(request.slice(0, 2), [
    "PUT",
    "/community/me/athlete-follows/athlete",
  ]);
  await api.setAthleteFollow("athlete", false);
  assert.deepEqual(request.slice(0, 2), [
    "DELETE",
    "/community/me/athlete-follows/athlete",
  ]);
  response = wrap({ items: [racer], total: 1, hasNextPage: false });
  assert.equal(
    (await api.getProfileAthletes("jake", 2)).items[0].profileUrl,
    "/racer/detail",
  );
  assert.equal(request[1], "/community/profiles/jake/athletes?page=2&limit=12");
  for (const bad of [
    {},
    { items: {} },
    { items: [null], total: 1, hasNextPage: false },
  ]) {
    response = wrap(bad);
    await assert.rejects(api.getProfileAthletes("jake", 1));
  }
  const Identity = compile(
    "client/src/components/community/RacerIdentityCard.tsx",
  ).default;
  assert.match(
    render(Identity, { profile: racer, isOwn: false }),
    /Verified athlete/,
  );
  assert.match(
    render(Identity, { profile: racer, isOwn: false }),
    /href="\/racer\/detail"/,
  );
  assert.doesNotMatch(
    render(Identity, {
      profile: { ...racer, isVerifiedAthlete: false },
      isOwn: false,
    }),
    /Verified athlete/,
  );
  assert.equal(render(Identity, { profile: null, isOwn: false }), "");
  assert.match(
    render(Identity, { profile: null, isOwn: true }),
    /Create or claim/,
  );
  const Button = compile(
    "client/src/components/community/AthleteFollowButton.tsx",
  ).default;
  assert.match(render(Button, { athleteId: "athlete" }), /3 followers/);
  assert.deepEqual(queryOptions.at(-1).queryKey, [
    "athlete-follow-state",
    "account-a",
    "athlete",
  ]);
  let element = Button({ athleteId: "athlete" });
  element.props.children[0].props.onClick();
  assert.deepEqual(mutation, {
    athleteId: "athlete",
    accountId: "account-a",
    following: true,
  });
  const changed = { ...state.data, isFollowing: true, followerCount: 4 };
  // A completed request must retain its original account/athlete cache key
  // even if the user navigates or switches accounts before the response arrives.
  auth = { user: { id: "account-b" }, isAuthenticated: true };
  Button({ athleteId: "other-athlete" });
  mutationOptions.onSuccess(changed, mutation);
  assert.deepEqual(saved[0], [
    ["athlete-follow-state", "account-a", "athlete"],
    changed,
  ]);
  assert.deepEqual(invalidated[0], { queryKey: ["profile-athletes"] });
  state.data = changed;
  assert.match(render(Button, { athleteId: "athlete" }), /Following athlete/);
  state.data = { ...changed, isOwnAthlete: true, isFollowing: false };
  assert.match(render(Button, { athleteId: "athlete" }), /disabled=""/);
  assert.match(
    render(Button, { athleteId: "athlete" }),
    /Your athlete profile/,
  );
  state.data = { ...changed, isOwnAthlete: true };
  assert.doesNotMatch(render(Button, { athleteId: "athlete" }), /disabled=""/);
  assert.match(
    render(Button, { athleteId: "athlete" }),
    /Unfollow your athlete profile/,
  );
  auth = { user: null, isAuthenticated: false };
  global.window = { location: { pathname: "/racer/detail" } };
  element = Button({ athleteId: "athlete" });
  assert.equal(queryOptions.at(-1).enabled, false);
  element.props.children[0].props.onClick();
  assert.equal(navigated, "/login?next=%2Fracer%2Fdetail");
  const Panel = compile(
    "client/src/components/community/FollowedAthletesPanel.tsx",
  ).default;
  assert.match(
    render(Panel, { username: "jake", isOwn: true }),
    /Follow an athlete from their racer page/,
  );
  list = { ...list, isError: true };
  assert.match(
    render(Panel, { username: "jake", isOwn: true }),
    /Unable to load athletes/,
  );
  list = {
    ...list,
    isError: false,
    data: { ...list.data, items: [racer], total: 1, hasNextPage: true },
  };
  assert.match(
    render(Panel, { username: "jake", isOwn: true }),
    /View results &amp; profile/,
  );
  assert.match(render(Panel, { username: "jake", isOwn: true }), />Next</);
  const actualAuth = compile("client/src/hooks/useAuth.ts");
  actualAuth.useAuth();
  const sessionQuery = queryOptions.at(-1);
  response = wrap({
    id: "fresh-account",
    username: "jake",
    isVerifiedAthlete: true,
  });
  assert.equal((await sessionQuery.queryFn()).id, "fresh-account");
  assert.equal(savedUser.id, "fresh-account");
  assert.equal(request[1], "/auth/me");
  response = Object.assign(new Error("Unauthorized"), { status: 401 });
  assert.equal(await sessionQuery.queryFn(), null);
  response = wrap({});
  await assert.rejects(sessionQuery.queryFn(), /Invalid account response/);
  console.log(
    "PASS wrapped profile/follow/list contracts, unsafe URLs, reviewed badges, distinct detail IDs, guest login, own-athlete blocking, account-scoped cache, mutation invalidation, and list empty/error/pagination states",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
