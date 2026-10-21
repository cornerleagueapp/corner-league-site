const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");

function hooks() {
  const slots = [];
  let cursor = 0;
  let effects = [];
  return {
    react: {
      ...React,
      useState(initial) {
        const i = cursor++;
        if (!(i in slots))
          slots[i] = typeof initial === "function" ? initial() : initial;
        return [
          slots[i],
          (value) => {
            slots[i] = typeof value === "function" ? value(slots[i]) : value;
          },
        ];
      },
      useEffect(fn, deps) {
        const i = cursor++;
        if (!slots[i] || deps.some((d, j) => !Object.is(d, slots[i][j]))) {
          slots[i] = deps;
          effects.push(fn);
        }
      },
      useMemo(fn) {
        return fn();
      },
    },
    render(fn) {
      cursor = 0;
      return fn();
    },
    async flush() {
      const pending = effects;
      effects = [];
      pending.forEach((fn) => fn());
      await new Promise(setImmediate);
    },
  };
}
function compile(relative, overrides) {
  const filename = path.resolve(__dirname, "..", relative),
    mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = module.paths;
  const fallback = mod.require.bind(mod);
  mod.require = (name) =>
    Object.hasOwn(overrides, name) ? overrides[name] : fallback(name);
  mod._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
  return mod.exports;
}
function all(node, predicate) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap((n) => all(n, predicate));
  return [
    ...(predicate(node) ? [node] : []),
    ...all(node.props?.children, predicate),
  ];
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join("");
  return node && typeof node === "object"
    ? text(node.props?.children)
    : String(node ?? "");
}
function button(tree, label) {
  const result = all(tree, (n) => n.type === "button" && text(n) === label)[0];
  assert(result, label);
  return result;
}
const common = {
  "@/seo/usePageSEO": { PageSEO: () => null },
  "@/components/ui/button": { Button: "button" },
  "@/components/ui/ConsumerMediaDialog": {
    __esModule: true,
    default: "media-dialog",
  },
  "@/components/media/GalleryThumbnail": {
    __esModule: true,
    default: "thumbnail",
  },
  "./racerProfileUtils": {
    getGalleryThumb: (item) => item.thumbnailUrl || item.url,
  },
};
(async () => {
  const h = hooks();
  const Thumbnail = compile(
    "client/src/components/media/GalleryThumbnail.tsx",
    { react: h.react },
  ).default;
  const thumb = (props) => h.render(() => Thumbnail(props));
  let tree = thumb({ src: "/broken.jpg", alt: "Finals" });
  tree.props.onError();
  tree = thumb({ src: "/broken.jpg", alt: "Finals" });
  assert.equal(tree.props.role, "img");
  assert.match(tree.props["aria-label"], /preview unavailable/);
  assert.equal(
    thumb({ src: "/new.jpg", alt: "New" }).type,
    "img",
    "A new source can load after a previous image failed",
  );
  assert.match(
    thumb({ video: true, alt: "Finals video" }).props["aria-label"],
    /video preview/,
  );

  const g = hooks();
  const Gallery = compile(
    "client/src/pages/racer-profile-parts/RacerGalleryView.tsx",
    { ...common, react: g.react },
  ).RacerGalleryView;
  const base = {
    racer: { racerName: "Test Racer" },
    items: [],
    loading: false,
    onBack() {},
  };
  const render = (extra) => g.render(() => Gallery({ ...base, ...extra }));
  assert.match(text(render()), /No gallery media/);
  tree = render({ loading: true });
  assert.equal(all(tree, (n) => n.props?.role === "status").length, 1);
  let retries = 0;
  tree = render({ error: "Could not load photos", onRetry: () => retries++ });
  assert.equal(all(tree, (n) => n.props?.role === "alert").length, 1);
  assert.doesNotMatch(text(tree), /No gallery media/);
  button(tree, "Try again").props.onClick();
  assert.equal(retries, 1);
  const media = [
    { id: "video", type: "video", url: "/clip.mp4", title: "Video" },
    {
      id: "image",
      type: "image",
      url: "/original.jpg",
      thumbnailUrl: "/small.jpg",
      title: "Photo",
    },
  ];
  tree = render({ items: media });
  const videoThumb = all(
    tree,
    (n) => n.type === "thumbnail" && n.props.video,
  )[0];
  assert.equal(videoThumb.props.src, undefined);
  const photoButton = all(
    tree,
    (n) => n.type === "button" && text(n) === "Photo",
  )[0];
  photoButton.props.onClick();
  tree = render({ items: media });
  assert.equal(
    all(tree, (n) => n.type === "img" && n.props.src === "/original.jpg")
      .length,
    1,
    "Preview must use the original photo",
  );
  all(tree, (n) => n.type === "media-dialog")[0].props.onClose();
  let rejectUpload;
  const uploadProps = {
    canUpload: true,
    onUpload: () =>
      new Promise((resolve, reject) => {
        rejectUpload = reject;
      }),
  };
  tree = render(uploadProps);
  button(tree, "Add Content").props.onClick();
  tree = render(uploadProps);
  all(
    tree,
    (n) => n.type === "input" && n.props.type === "file",
  )[0].props.onChange({ currentTarget: { files: [{ name: "test.jpg" }] } });
  tree = render(uploadProps);
  const uploading = button(tree, "Upload Media").props.onClick();
  tree = render(uploadProps);
  assert.equal(all(tree, (n) => n.type === "media-dialog")[0].props.busy, true);
  assert.equal(all(tree, (n) => n.type === "fieldset")[0].props.disabled, true);
  rejectUpload(Error("offline"));
  await uploading;
  tree = render(uploadProps);
  assert.equal(
    all(tree, (n) => n.type === "media-dialog")[0].props.busy,
    false,
  );
  assert.match(
    text(all(tree, (n) => n.props?.role === "alert")[0]),
    /could not upload/,
  );

  const f = hooks();
  let payload = { media: [] },
    fail = true,
    calls = 0;
  const Featured = compile(
    "client/src/components/FeaturedRacerGallerySection.tsx",
    {
      ...common,
      react: f.react,
      wouter: { Link: "a", useLocation: () => ["", () => {}] },
      "@/lib/apiClient": {
        apiRequest: async () => {
          calls++;
          if (fail) throw Error("offline");
          return payload;
        },
      },
    },
  ).default;
  const featured = () =>
    f.render(() => Featured({ sourcePage: "landing_page" }));
  tree = featured();
  assert.equal(tree.props.role, "status");
  await f.flush();
  tree = featured();
  assert.equal(tree.props.role, "alert");
  assert.doesNotMatch(text(tree), /Coming Soon/);
  fail = false;
  button(tree, "Try again").props.onClick();
  featured();
  await f.flush();
  tree = featured();
  assert.match(text(tree), /Coming Soon/);
  assert.equal(calls, 2);
  payload = { media: { invalid: true } };
  // Use a fresh mount to verify malformed payloads are treated as unavailable, not empty.
  const malformedHooks = hooks();
  const Malformed = compile(
    "client/src/components/FeaturedRacerGallerySection.tsx",
    {
      ...common,
      react: malformedHooks.react,
      wouter: { Link: "a", useLocation: () => ["", () => {}] },
      "@/lib/apiClient": { apiRequest: async () => payload },
    },
  ).default;
  const malformed = () =>
    malformedHooks.render(() => Malformed({ sourcePage: "aqua_hub" }));
  malformed();
  await malformedHooks.flush();
  assert.equal(malformed().props.role, "alert");
  const pageHooks = hooks();
  const GalleryPage = compile("client/src/pages/organizations/aqua-featured-gallery.tsx", {
    ...common, react: pageHooks.react,
    wouter: { useLocation: () => ["", () => {}] },
    "@/lib/apiClient": { apiRequest: async () => ({ media: [{ id: "photo", type: "image", title: "Championship", url: "/photo.jpg" }] }) },
  }).default;
  const renderPage = () => pageHooks.render(() => GalleryPage());
  renderPage(); await pageHooks.flush(); tree = renderPage();
  const search = all(tree, n => n.type === "input")[0];
  assert.equal(search.props["aria-label"], "Search featured gallery");
  search.props.onChange({ target: { value: "no such caption" } });
  tree = renderPage(); assert.match(text(tree), /No matching media/);
  assert.doesNotMatch(text(tree), /No featured gallery media yet/);
  button(tree, "Clear filters").props.onClick(); tree = renderPage();
  assert.match(text(tree), /Championship/);
  button(tree, "Videos").props.onClick(); tree = renderPage();
  assert.equal(button(tree, "Videos").props["aria-pressed"], true);
  assert.match(text(tree), /No matching media/);
  console.log(
    "PASS gallery empty/error/retry transitions, malformed responses, thumbnail recovery, video placeholders, original-image previews and upload rejection/busy states.",
  );
  console.log(
    "These component tests do not validate browser geometry, focus trapping, live APIs or screen readers.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
