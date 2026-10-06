const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const cache = new Map();
let queryState = {};
let queryOptions;
let fetchOptions;
function compile(relative) {
  if (cache.has(relative)) return cache.get(relative);
  const filename = path.resolve(__dirname, "..", relative);
  const compiled = new Module(filename, module);
  compiled.filename = filename;
  compiled.paths = module.paths;
  const load = compiled.require.bind(compiled);
  compiled.require = (name) => {
    if (name === "@/pages/organizations/SandboxContext") return { useOrganizationPageApi: () => ({ sandbox: null }) };
    if (name === "wouter")
      return {
        Link: ({ href, children, ...props }) =>
          React.createElement("a", { href, ...props }, children),
      };
    if (name === "@tanstack/react-query")
      return {
        useQuery: (options) => {
          queryOptions = options;
          return queryState;
        },
      };
    if (name === "@/lib/apiClient")
      return {
        apiFetch: async (url, options) => {
          fetchOptions = { url, options };
          return { ok: true, json: async () => ({ data: { articles: [] } }) };
        },
      };
    if (name === "@/seo/usePageSEO") return { PageSEO: () => null };
    if (name.startsWith("./"))
      return compile(
        `${path.posix.join(path.posix.dirname(relative), name)}.ts`,
      );
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
  cache.set(relative, compiled.exports);
  return compiled.exports;
}
const { hasMoreBelow } = compile("client/src/lib/sidebarScroll.ts");
assert.equal(hasMoreBelow(1000, 600, 0), true);
assert.equal(hasMoreBelow(1000, 600, 400), false);
assert.equal(hasMoreBelow(500, 600, 0), false);
const { safePostImage } = compile(
  "client/src/features/organization-posts/postPresentation.ts",
);
assert.equal(safePostImage("javascript:alert(1)"), undefined);
const { OrganizationPosts, PostBody, OrganizationPostPage, fetchPublicPost } =
  compile("client/src/features/organization-posts/OrganizationPosts.tsx");
const post = {
  id: "post-1",
  title: "News",
  content: "## Heading\n- **Bold**\n<script>bad</script>",
  postType: "announcement",
  contentFormat: "markdown",
  isPublished: true,
  organization: { id: "org-1", name: "Club" },
};
let html = renderToStaticMarkup(React.createElement(PostBody, { post }));
assert.match(html, /<h2/);
assert.match(html, /<strong>Bold/);
assert.match(html, /&lt;script&gt;/);
assert.doesNotMatch(html, /<script>/);
queryState = { data: { articles: [post], meta: { hasNextPage: true } } };
html = renderToStaticMarkup(
  React.createElement(OrganizationPosts, { organizationId: "org-1" }),
);
assert.match(html, /href="\/organization-posts\/post-1"/);
assert.match(html, /Announcement/);
assert.match(html, /Refresh organization posts/);
assert.deepEqual(queryOptions.queryKey, [
  "organization-public-posts",
  "org-1",
  1,
]);
assert.equal(queryOptions.refetchInterval, 60000);
queryState = { isLoading: true };
assert.match(
  renderToStaticMarkup(
    React.createElement(OrganizationPosts, { organizationId: "org-1" }),
  ),
  /Loading posts/,
);
queryState = { isError: true };
assert.match(
  renderToStaticMarkup(
    React.createElement(OrganizationPosts, { organizationId: "org-1" }),
  ),
  /Unable to load/,
);
assert.match(
  renderToStaticMarkup(
    React.createElement(OrganizationPostPage, { id: "draft" }),
  ),
  /unavailable or has returned to draft/,
);
(async () => {
  assert.deepEqual(
    await fetchPublicPost("/org-articles/organization/org-1/published"),
    { articles: [] },
  );
  assert.equal(fetchOptions.options.skipAuth, true);
  assert.equal(fetchOptions.options.noRefresh, true);
  console.log(
    "PASS public organization feed, shareable post links, formatted text escaping, loading/error states, refresh policy, and sidebar overflow",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
