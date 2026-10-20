const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react");
const { renderToStaticMarkup: render } = require("react-dom/server");
function compile(relative, mocks = {}) {
  const filename = path.resolve(__dirname, "..", relative),
    m = new Module(filename, module);
  m.filename = filename;
  m.paths = module.paths;
  const fallback = m.require.bind(m);
  m.require = (name) =>
    Object.hasOwn(mocks, name) ? mocks[name] : fallback(name);
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
  return m.exports.default;
}

let options,
  state = {
    data: { items: [], hasNextPage: false },
    isPending: false,
    isError: false,
    isFetching: false,
    refetch() {},
  };
const box = ({ children }) => React.createElement("div", {}, children);
const social = {
  Pagination: () => null,
  SocialFailure: ({ error }) =>
    React.createElement("p", { role: "alert" }, error.message),
  socialButton: "button",
};
const Results = compile("client/src/components/community/FollowedResults.tsx", {
  "@tanstack/react-query": {
    useQuery: (o) => {
      options = o;
      return state;
    },
  },
  wouter: {
    Link: ({ children, ...p }) => React.createElement("a", p, children),
  },
  "@/lib/apiClient": {
    apiFetch: async () => ({
      ok: true,
      json: async () => ({ items: [], hasNextPage: false }),
    }),
  },
  "@/lib/selfRacerLookup": { racerResponseData: (v) => v },
  "./SocialPosts": social,
});
let html = render(
  React.createElement(Results, { username: "jake", isOwn: true }),
);
assert.match(html, /No result updates yet/);
assert.deepEqual(options.queryKey, ["followed-results", "jake", 1]);
assert.equal(options.refetchInterval, 30000);
assert.equal(options.refetchIntervalInBackground, false);
state = {
  ...state,
  data: {
    items: [
      {
        id: "r",
        athleteName: "Josh Simon",
        eventName: "World Finals",
        divisionName: "Pro",
        raceName: "Final",
        position: 2,
        points: 18,
        status: "FINISHED",
        updatedAt: "2026-10-19T12:00:00Z",
        profileUrl: "/racer/racer",
      },
    ],
    hasNextPage: false,
  },
};
html = render(React.createElement(Results, { username: "jake", isOwn: true }));
assert.match(html, /Josh Simon/);
assert.match(html, /#2/);
assert.match(html, /World Finals/);
assert.match(html, /18 points/);
state = { ...state, isError: true, error: new Error("Unavailable") };
html = render(React.createElement(Results, { username: "jake", isOwn: true }));
assert.match(html, /Retry results/);
const Dialog = compile("client/src/components/community/PeopleDialog.tsx", {
  "@radix-ui/react-dialog": {
    Root: box,
    Portal: box,
    Overlay: () => null,
    Content: ({ children }) =>
      React.createElement("div", { role: "dialog" }, children),
    Title: box,
    Close: ({ children }) => React.createElement("button", {}, children),
  },
  wouter: { useLocation: () => ["/profile/jake", () => {}] },
  "./UserSocialControls": {
    PeoplePanel: ({ kind }) => React.createElement("p", {}, kind + " list"),
  },
});
html = render(
  React.createElement(Dialog, {
    username: "jake",
    kind: "followers",
    onClose() {},
    returnFocus: null,
  }),
);
assert.match(html, /role="dialog"/);
assert.match(html, /followers list/);
console.log(
  "PASS follower dialog rendering, followed-result content/empty/error states, profile query scope and foreground refresh interval",
);
