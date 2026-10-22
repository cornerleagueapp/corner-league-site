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
  return m.exports;
}
let request;
const directory = compile("client/src/lib/profileDirectory.ts", {
  "./apiClient": {
    apiFetch: async (...args) => {
      request = args;
      return {
        ok: true,
        json: async () => ({ items: [], page: 1, hasNextPage: false }),
      };
    },
  },
  "./selfRacerLookup": {
    racerResponseData: (value) => (value.status === true ? value.data : value),
  },
});
const page = {
  items: [
    {
      id: "a",
      name: "Jake",
      sportKey: "basketball",
      profileUrl: "/racer/a?sport=basketball",
    },
  ],
  page: 1,
  hasNextPage: false,
};
assert.equal(
  directory.parseDirectory(page, "athletes", "basketball").items.length,
  1,
);
assert.throws(() => directory.parseDirectory(page, "athletes", "golf"));
assert.throws(() =>
  directory.parseDirectory(
    {
      ...page,
      items: [{ ...page.items[0], profileUrl: "https://evil.example" }],
    },
    "basketball",
  ),
);
assert.throws(() =>
  directory.parseDirectory(
    { ...page, hasNextPage: "true" },
    "basketball",
  ),
);
assert.equal(directory.safeProfileImage("javascript:alert(1)"), null);
assert.equal(directory.safeProfileImage("//evil.example/pic"), null);
let mobile = false,
  signedIn = true,
  category = "athletes",
  query;
const box = ({ children }) => React.createElement("div", {}, children);
const radix = {
  Root: box,
  Anchor: box,
  Portal: box,
  Content: box,
  Trigger: ({ children, ...p }) =>
    React.createElement("button", { "aria-label": p["aria-label"] }, children),
  Overlay: () => null,
  Title: box,
  Close: ({ children, ...p }) =>
    React.createElement("button", { "aria-label": p["aria-label"] }, children),
};
const Search = compile("client/src/components/navigation/NavbarSearch.tsx", {
  react: {
    ...React,
    useSyncExternalStore: () => mobile,
    useState: (initial) => [
      typeof initial === "boolean"
        ? true
        : initial === "athletes"
          ? category
          : initial === ""
            ? "ja"
            : initial,
      () => {},
    ],
  },
  "@radix-ui/react-popover": radix,
  "@radix-ui/react-dialog": radix,
  "@/features/discovery/discovery.css": {},
  "@/features/discovery/api": {
    labels: {athletes:'Athletes',users:'Users'},
    searchUrl: (q,k,s)=>`/search_results?q=${q}&kind=${k}&sport=${s}`,
    discovery: async()=>({groups:[]}),
    visibleGroups: groups=>(groups||[]).filter(g=>g.items.length),
  },
  "@/features/discovery/DiscoveryCards": {DiscoveryImage:()=>null},
  "@tanstack/react-query": {
    useQueryClient: () => ({ cancelQueries: async () => {} }),
    useQuery: (options) => {
      query = options;
      return {
        data: { groups: [
          {kind:'athletes',items:Array.from({length:5},(_,i)=>({id:String(i),name:'Athlete '+i,href:'/racer/a?sport=basketball',sport:'basketball'})),hasNextPage:true},
          {kind:'users',items:[],signInRequired:!signedIn,hasNextPage:false}
        ] },
        hasNextPage: false,
        isPending: false,
        isError: false,
      };
    },
  },
  wouter: {
    useLocation: () => ["/basketball", () => {}],
    Link: ({ children, ...p }) => React.createElement("a", p, children),
  },
  "@/hooks/useAuth": {
    useAuth: () => ({
      user: signedIn ? { id: "owner" } : null,
      isAuthenticated: signedIn,
    }),
  },
  "@/hooks/useSportSelection": {
    useSportSelection: () => ({ sportKey: "basketball" }),
  },
  "@/lib/sportVisuals": { sportVisual: () => ({ label: "Basketball" }) },
  "@/lib/profileDirectory": directory,
  "@/components/community/AccountAvatar": {
    default: () => null,
    __esModule: true,
  },
}).default;
(async () => {
  const controller = new AbortController();
  await directory.directorySearch(
    "athletes",
    "basketball",
    "ja & ke",
    2,
    true,
    controller.signal,
  );
  assert.match(request[0], /\/community\/me\/directory-search\?/);
  assert.match(request[0], /sportKey=basketball/);
  assert.equal(request[1].signal, controller.signal);
  await directory.directorySearch(
    "athletes",
    "golf",
    "ja",
    1,
    false,
    controller.signal,
  );
  assert.match(request[0], /\/community\/directory\/athletes\?/);
  assert.equal(request[1].skipAuth, true);
  let html = render(React.createElement(Search));
  assert.match(html, /Athlete profile/);
  assert.match(html, /View all athletes/);
  assert.doesNotMatch(html, /Athlete 3/);
  assert.doesNotMatch(html, /<h3>Users<\/h3>/);
  assert.match(html, /navbar-search-desktop/);
  assert.match(html, /\/racer\/a\?sport=basketball/);
  assert.ok(query.enabled);
  assert.deepEqual(query.queryKey.slice(0, 3), [
    "universal-search-preview",
    "owner",
    "basketball",
  ]);
  mobile = true;
  html = render(React.createElement(Search));
  assert.match(html, /Search Corner League/);
  assert.match(html, /Close search/);
  assert.doesNotMatch(html, /navbar-search-desktop/);
  category = "users";
  signedIn = false;
  html = render(React.createElement(Search));
  assert.match(html, /Sign in to search users/);
  assert.equal(query.enabled, true);
  assert.equal(query.queryKey[1], "guest");
  console.log(
    "PASS directory validation, safe links/images, abort forwarding, public/auth routes, sport/account query isolation and desktop/mobile search rendering",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
