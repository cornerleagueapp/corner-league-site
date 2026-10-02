const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
let auth = { user: { id: "account" }, isAuthenticated: true },
  response,
  request,
  state = {},
  mutations = [];
const queries = [],
  modules = new Map();
function compile(relative) {
  if (modules.has(relative)) return modules.get(relative);
  const filename = path.resolve(__dirname, "..", relative),
    compiled = new Module(filename, module);
  compiled.filename = filename;
  compiled.paths = module.paths;
  const fallback = compiled.require.bind(compiled);
  compiled.require = (name) => {
    if (name === "@/lib/apiClient")
      return {
        apiRequest: async (...args) => {
          request = args;
          if (response instanceof Error) throw response;
          return response;
        },
      };
    if (name === "@/seo/usePageSEO") return { PageSEO: () => null };
    if (name === "@/hooks/useAuth") return { useAuth: () => auth };
    if (name === "wouter")
      return {
        Link: ({ children, ...props }) =>
          React.createElement("a", props, children),
        useLocation: () => ["/", () => {}],
      };
    if (name === "@tanstack/react-query")
      return {
        useQueryClient: () => ({ invalidateQueries: async () => {} }),
        useQuery: (options) => {
          queries.push(options);
          return (
            state[options.queryKey[0]] || {
              isLoading: false,
              refetch: () => {},
            }
          );
        },
        useMutation: (options) => {
          mutations.push(options);
          return { isPending: false, isError: false, mutate: () => {} };
        },
      };
    if (name === "./SocialPosts")
      return {
        socialBox: "box",
        socialInput: "input",
        socialButton: "button",
        SocialFailure: ({ error }) =>
          React.createElement(
            "p",
            { role: "alert" },
            error?.message || "Error",
          ),
        Pagination: () => null,
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
const render = (component, props) => {
  mutations = [];
  return renderToStaticMarkup(React.createElement(component, props));
};
const publication = {
  id: "publication",
  kind: "article",
  title: "Story",
  body: "Text",
  excerpt: "Text",
  sport: "jet-ski",
  category: "discussion",
  coverUrl: null,
  published: false,
  revision: 4,
  createdAt: "2026-10-02T12:00:00Z",
  updatedAt: "2026-10-02T12:00:00Z",
  author: { id: "account", username: "author" },
  canEdit: true,
  score: 0,
  vote: 0,
  replyCount: 0,
};
(async () => {
  const { addCommunityDirectories } = await import("./make-sitemap.mjs");
  const xml =
    "<urlset><url><loc>https://www.cornerleague.com/scores</loc></url></urlset>";
  const updated = addCommunityDirectories(xml);
  assert.match(updated, /cornerleague.com\/scores/);
  assert.match(updated, /cornerleague.com\/community/);
  assert.match(updated, /cornerleague.com\/articles/);
  assert.equal(addCommunityDirectories(updated), updated);
  assert.doesNotMatch(updated, /writer/);
  assert.throws(() => addCommunityDirectories("invalid"));
  const api = compile("client/src/lib/publishingApi.ts");
  response = wrap({
    items: [publication],
    total: 1,
    page: 1,
    hasNextPage: false,
  });
  assert.equal(
    (await api.loadPublications("article", true, { page: 1, mine: true }))
      .items[0].title,
    "Story",
  );
  assert.equal(request[1], "/community/me/articles/mine?limit=20&page=1");
  for (const bad of [
    null,
    { items: { bad: true }, page: 1, total: 0, hasNextPage: false },
    {
      items: [{ ...publication, author: null }],
      page: 1,
      total: 1,
      hasNextPage: false,
    },
  ]) {
    response = wrap(bad);
    await assert.rejects(api.loadPublications("article", false, { page: 1 }));
  }
  response = wrap(publication);
  await api.loadPublication("article", false, "publication");
  assert.equal(request[1], "/community/articles/publication");
  for (const bad of [
    { ...publication, body: undefined },
    { ...publication, kind: "forum" },
  ]) {
    response = wrap(bad);
    await assert.rejects(api.loadPublication("article", true, "publication"));
  }
  assert.equal(api.isPublication({ ...publication, vote: 2 }), false);
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,payload",
    "//evil.example",
    "https://user:pass@example.com",
  ])
    assert.equal(api.safePublishingUrl(url), null);
  assert.equal(
    api.safePublishingUrl("https://example.com/path?a=1"),
    "https://example.com/path?a=1",
  );
  const Body = compile(
    "client/src/components/community/PublicationBody.tsx",
  ).default;
  const html = render(Body, {
    body: "# Heading\n**bold**\n[Unsafe](javascript:evil)\n[Shop](https://store.example/?aff=123)\n<img src=x onerror=alert(1)>",
  });
  assert.match(html, /<h2/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /&lt;img/);
  assert.doesNotMatch(html, /<img|href="javascript:/);
  assert.match(html, /ugc sponsored/);
  assert.match(html, /https:\/\/store.example/);
  const ui = compile("client/src/components/community/Publishing.tsx");
  auth = { user: null, isAuthenticated: false };
  const signIn = render(ui.PublicationEditor, { kind: "article" });
  assert.match(signIn, /Sign in/);
  assert.doesNotMatch(signIn, /<textarea/);
  state = { "publishing-detail": { data: publication, refetch: () => {} } };
  auth = { user: { id: "account" }, isAuthenticated: true };
  const draft = render(ui.PublicationPage, {
    kind: "article",
    id: "publication",
  });
  assert.match(draft, /Private draft/);
  assert.doesNotMatch(draft, />Share</);
  assert.match(draft, /Edit/);
  state["publishing-detail"].data = {
    ...publication,
    published: true,
    canEdit: false,
  };
  const publicView = render(ui.PublicationPage, {
    kind: "article",
    id: "publication",
  });
  assert.doesNotMatch(publicView, /Edit \/ Publish|>Delete</);
  assert.match(publicView, /Share/);
  state["publishing-detail"].data = publication;
  const editor = render(ui.PublicationEditor, {
    kind: "article",
    id: "publication",
  });
  assert.match(editor, /Save draft/);
  response = wrap({ ...publication, revision: 5 });
  await mutations[0].mutationFn();
  assert.equal(request[0], "PATCH");
  assert.equal(request[2].revision, 4);
  assert.equal(request[2].published, false);
  assert.equal(request[2].coverMediaId, undefined);
  state = {
    "publishing-list": {
      isError: true,
      error: new Error("Could not load"),
      refetch: () => {},
    },
  };
  assert.match(render(ui.PublicationList, { kind: "forum" }), /Could not load/);
  state = {
    "publishing-list": {
      data: { items: [], total: 0, page: 1, hasNextPage: false },
      refetch: () => {},
    },
  };
  assert.match(
    render(ui.PublicationList, { kind: "forum" }),
    /No discussions yet/,
  );
  assert.ok(
    queries.some(
      (q) => q.queryKey[0] === "publishing-list" && q.staleTime === 120000,
    ),
  );
  const safety = compile("client/src/lib/socialApi.ts");
  assert.equal(safety.safeLocalHref("/community/uuid"), "/community/uuid");
  assert.equal(safety.safeLocalHref("https://evil.example"), null);
  const cleared = [],
    cleaner = compile("client/src/lib/socialCache.ts");
  cleaner.clearCommunityCache({
    cancelQueries: ({ predicate }) => {
      for (const key of [
        "publishing-list",
        "publishing-detail",
        "publishing-replies",
        "public-events",
      ])
        if (predicate({ queryKey: [key] })) cleared.push(key);
    },
    removeQueries: () => {},
  });
  assert.deepEqual(cleared, [
    "publishing-list",
    "publishing-detail",
    "publishing-replies",
  ]);
  const racer = fs.readFileSync(
    path.resolve(__dirname, "../client/src/pages/racer-profile.tsx"),
    "utf8",
  );
  assert.doesNotMatch(
    racer,
    /generateRacerAnalysis|AI Racer Analysis|setAnalysisLoading/,
  );
  console.log(
    "Community publishing: response contracts, safe formatting, drafts, ownership controls, account cache, and AI removal passed.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
