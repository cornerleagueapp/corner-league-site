const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const org = {
  id: "sandbox-org",
  name: "Test Race Org",
  description: "Private test description",
  primarySportKey: "jet-ski",
  isTest: true,
};
const event = {
  id: "sandbox-event",
  name: "Sample race weekend",
  startDate: "2026-10-10T10:00:00Z",
  endDate: "2026-10-11T10:00:00Z",
  location: "Test venue",
};
const post = {
  id: "sandbox-post",
  title: "Private announcement",
  content: "Sandbox news",
  contentFormat: "plain",
  postType: "announcement",
  isPublished: true,
};
const photo = {
  id: "sandbox-photo",
  organizationId: org.id,
  organizationName: org.name,
  url: "data:image/png;base64,iVBORw0KGgo=",
  caption: "Sandbox image",
  album: "",
  capturedAt: "2026-10-10T10:00:00Z",
  uploadedAt: "2026-10-10T10:00:00Z",
  tags: [],
};
const queries = [];
const requests = [];
const api = {
  apiFetch: async (path, opts) => {
    requests.push([path, opts]);
    assert.equal(
      path,
      "/sandbox/organizations/sandbox-org/request",
      "private views must never call public resource endpoints",
    );
    const resource = opts.body.path;
    let data = resource.includes("/org-articles")
      ? {
          articles: [post],
          article: post,
          meta: { itemCount: 1, hasNextPage: false },
        }
      : resource.includes("/organization-gallery")
        ? { items: [photo], total: 1, page: 1, limit: 12 }
        : resource.includes("/sport-event/organization")
          ? { sportEvents: [event] }
          : { sportEvent: event, divisions: [] };
    return { ok: true, json: async () => ({ status: true, data }) };
  },
  apiRequest: async () => {
    throw new Error("Public gallery request in sandbox");
  },
};
const mocks = {
  "@/hooks/useSportSelection": {
    rememberSport: () => {
      throw new Error("Private preview changed public sport");
    },
  },
  "@/lib/sportNavigation": {
    sportDirectory: () => "/aqua-organizations",
    sportOrganization: (_key, id) => `/aqua-organizations/${id}`,
  },
  "@/lib/apiClient": api,
  "@tanstack/react-query": {
    useQuery: (config) => {
      queries.push(config);
      const key = config.queryKey[0];
      const data =
        key === "organization-public-posts"
          ? { articles: [post], meta: { itemCount: 1, hasNextPage: false } }
          : key === "organization-gallery"
            ? { items: [photo], total: 1 }
            : key === "/sport-event/organization"
              ? [event]
              : undefined;
      return {
        data,
        isLoading: false,
        isPending: false,
        isError: false,
        isFetching: false,
        refetch: async () => {},
      };
    },
    useQueryClient: () => ({ invalidateQueries: async () => {} }),
  },
  wouter: {
    useLocation: () => ["/internal/test-organizations/sandbox-org", () => {}],
    Link: ({ children, href, ...props }) =>
      React.createElement("a", { ...props, href }, children),
  },
  "@/lib/analytics": {
    trackEvent: () => {
      throw new Error("Sandbox tracked");
    },
  },
  "@/lib/analytics-events": { AnalyticsEvents: {} },
  "@/lib/contentEngagementApi": {
    trackContentEngagementToBackend: () => {
      throw new Error("Sandbox tracked");
    },
  },
  "@/seo/usePageSEO": { PageSEO: () => null },
};
function compile(file) {
  const mod = new Module(file, module);
  mod.paths = module.paths;
  mod.require = (name) => {
    if (mocks[name]) return mocks[name];
    if (name.startsWith("@/components/ui/"))
      return new Proxy(
        {},
        {
          get: (_t, key) =>
            key === "__esModule"
              ? true
              : (props) => React.createElement("div", {}, props.children),
        },
      );
    return require(name);
  };
  mod._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    file,
  );
  return mod.exports;
}
(async () => {
  const context = compile("client/src/pages/organizations/SandboxContext.tsx");
  mocks["@/pages/organizations/SandboxContext"] = context;
  mocks["./SandboxContext"] = context;
  mocks["./postPresentation"] = compile(
    "client/src/features/organization-posts/postPresentation.ts",
  );
  mocks["@/lib/organizationGallery"] = compile(
    "client/src/lib/organizationGallery.ts",
  );
  mocks["@/features/organization-posts/OrganizationPosts"] = compile(
    "client/src/features/organization-posts/OrganizationPosts.tsx",
  );
  mocks["@/components/OrganizationPhotoGallery"] = compile(
    "client/src/components/OrganizationPhotoGallery.tsx",
  );
  const Page = compile(
    "client/src/pages/organizations/aqua-organization-details.tsx",
  ).default;
  const sandbox = {
    id: org.id,
    account: "super-admin-account",
    data: {
      organization: org,
      events: [event],
      posts: [post],
      photos: [photo],
    },
  };
  const html = renderToStaticMarkup(
    React.createElement(
      context.SandboxContext.Provider,
      { value: sandbox },
      React.createElement(Page, { params: { id: org.id } }),
    ),
  );
  for (const content of [
    "Test Race Org",
    "Private test description",
    "Schedule",
    "Race Results",
    "News &amp; Updates",
    "Private announcement",
    "Photo Gallery",
    "Sandbox image",
  ])
    assert(html.includes(content), `Missing real organization UI: ${content}`);
  assert(
    html.includes("/internal/test-organizations/sandbox-org?post=sandbox-post"),
  );
  for (const config of queries.filter((q) => q.enabled !== false)) {
    assert.equal(
      config.gcTime,
      0,
      "private data must not remain in inactive query cache",
    );
    assert(
      config.queryKey.includes("super-admin-account"),
      "private reads must be account-scoped",
    );
    await config.queryFn();
  }
  assert(requests.length >= 2);
  const previewSource = fs.readFileSync(
    "client/src/pages/organizations/test-organization-preview.tsx",
    "utf8",
  );
  assert(previewSource.includes("SUPER_ADMIN"));
  assert(previewSource.includes("OrgEventDetailsPage"));
  assert(previewSource.includes("PublicRaceSchedulePage"));
  assert(previewSource.includes("noindex"));
  console.log(
    "PASS real consumer organization layout, private posts/gallery, account scope, no inactive cache and authenticated sandbox-only requests.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
