const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
function compile(relative, overrides = {}) {
  const filename = path.resolve(__dirname, "..", relative);
  const m = new Module(filename, module);
  m.filename = filename;
  m.paths = module.paths;
  const fallback = m.require.bind(m);
  m.require = (name) =>
    Object.hasOwn(overrides, name) ? overrides[name] : fallback(name);
  m._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    filename,
  );
  return m.exports;
}
// A deterministic hook runner exercises event/effect transitions without a browser dependency.
function hooks() {
  const slots = [];
  let cursor = 0,
    effects = [];
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
      useRef(initial) {
        const i = cursor++;
        return (slots[i] ||= { current: initial });
      },
      useId() {
        const i = cursor++;
        return `test-${i}`;
      },
      useEffect(effect, deps) {
        const i = cursor++;
        const old = slots[i];
        if (!old || !deps || deps.some((d, j) => !Object.is(d, old.deps[j]))) {
          slots[i] = { deps, cleanup: old?.cleanup };
          effects.push(() => {
            old?.cleanup?.();
            slots[i].cleanup = effect();
          });
        }
      },
    },
    render(fn) {
      cursor = 0;
      return fn();
    },
    flush() {
      const work = effects;
      effects = [];
      work.forEach((fn) => fn());
    },
    unmount() {
      slots.forEach((slot) => slot?.cleanup?.());
    },
  };
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

(async () => {
  function events() {
    const handlers = new Map();
    return {
      addEventListener(type, fn) {
        if (!handlers.has(type)) handlers.set(type, new Set());
        handlers.get(type).add(fn);
      },
      removeEventListener(type, fn) {
        handlers.get(type)?.delete(fn);
      },
      emit(type, event = {}) {
        handlers.get(type)?.forEach((fn) => fn(event));
      },
      count() {
        return [...handlers.values()].reduce((n, set) => n + set.size, 0);
      },
    };
  }
  const doc = { ...events(), hidden: false, activeElement: null };
  const win = events(),
    motion = { ...events(), matches: false },
    connection = { ...events(), saveData: false };
  global.document = doc;
  global.window = Object.assign(win, { matchMedia: () => motion });
  Object.defineProperty(global, "navigator", {
    configurable: true,
    value: { connection },
  });
  let intersection,
    disconnected = 0;
  global.IntersectionObserver = class {
    constructor(fn) {
      intersection = fn;
    }
    observe() {}
    disconnect() {
      disconnected++;
    }
  };
  const h = hooks();
  const { DeferredPromoVideo, shouldPlayPromo } = compile(
    "client/src/components/media/DeferredPromoVideo.tsx",
    { react: h.react },
  );
  const initial = {
    visible: true,
    hidden: false,
    reducedMotion: false,
    saveData: false,
    userStarted: false,
    paused: false,
  };
  assert.equal(shouldPlayPromo(initial), true);
  for (const state of [
    { hidden: true },
    { visible: false },
    { reducedMotion: true },
    { saveData: true },
    { paused: true },
  ])
    assert.equal(shouldPlayPromo({ ...initial, ...state }), false);
  assert.equal(
    shouldPlayPromo({
      ...initial,
      reducedMotion: true,
      saveData: true,
      userStarted: true,
    }),
    true,
  );
  let plays = 0,
    pauses = 0,
    reject = false;
  const video = {
    play() {
      plays++;
      return reject
        ? Promise.reject(new Error("autoplay blocked"))
        : Promise.resolve();
    },
    pause() {
      pauses++;
    },
  };
  let tree;
  function render() {
    tree = h.render(() =>
      DeferredPromoVideo({ src: "/promo.mp4", poster: "/poster.jpg" }),
    );
    all(tree, (n) => n.type === "video")[0].ref.current = video;
    all(tree, (n) => n.type === "div")[0].ref.current = {};
    h.flush();
    return tree;
  }
  function media() {
    return all(tree, (n) => n.type === "video")[0];
  }
  function button() {
    return all(tree, (n) => n.type === "button")[0];
  }
  render();
  render();
  assert.equal(media().props.src, undefined, "Offscreen media must not fetch");
  assert.equal(media().props.preload, "none");
  intersection([{ isIntersecting: true }]);
  render();
  render();
  assert.equal(media().props.src, "/promo.mp4");
  assert.equal(plays, 1);
  media().props.onPlay();
  render();
  assert.equal(text(button()), "Pause partner video");
  button().props.onClick();
  render();
  assert(pauses > 0);
  media().props.onPause();
  render();
  assert.equal(text(button()), "Play partner video");
  intersection([{ isIntersecting: false }]);
  render();
  intersection([{ isIntersecting: true }]);
  render();
  assert.equal(plays, 1, "Scrolling must not undo an explicit pause");
  button().props.onClick();
  render();
  assert.equal(plays, 2);
  doc.hidden = true;
  doc.emit("visibilitychange");
  render();
  assert.equal(
    shouldPlayPromo({ ...initial, hidden: true, userStarted: true }),
    false,
  );
  h.unmount();
  assert.equal(disconnected, 1);
  assert.equal(doc.count(), 0);
  assert.equal(connection.count(), 0);
  assert.equal(motion.count(), 0);
  // A fresh reduced-motion/data-saver visitor keeps only the poster until deliberate play.
  for (const preference of ["motion", "data"]) {
    motion.matches = preference === "motion";
    connection.saveData = preference === "data";
    doc.hidden = false;
    const local = hooks();
    const component = compile(
      "client/src/components/media/DeferredPromoVideo.tsx",
      { react: local.react },
    ).DeferredPromoVideo;
    function draw() {
      const t = local.render(() =>
        component({ src: "/promo.mp4", poster: "/poster.jpg" }),
      );
      all(t, (n) => n.type === "video")[0].ref.current = video;
      all(t, (n) => n.type === "div")[0].ref.current = {};
      local.flush();
      return t;
    }
    let t = draw();
    intersection([{ isIntersecting: true }]);
    t = draw();
    t = draw();
    assert.equal(all(t, (n) => n.type === "video")[0].props.src, undefined);
    reject = true;
    all(t, (n) => n.type === "button")[0].props.onClick();
    draw();
    draw();
    await Promise.resolve();
    draw();
    reject = false;
    local.unmount();
  }
  // Exercise the actual disclosure handlers: Escape restores its own trigger, Tab-away closes, and outside clicks never move focus.
  const nh = hooks();
  const nav = compile("client/src/components/navigation/PublicTopNav.tsx", {
    react: nh.react,
    "@/components/community/NotificationCount": {
      useUnreadNotifications: () => ({ data: { unreadCount: 2 } }),
      NotificationCount: () => null,
    },
    "@/hooks/useSportSelection": {
      useSportSelection: () => ({
        sports: [{ key: "golf", label: "Golf" }],
        sport: { key: "golf", label: "Golf" },
        selectSport() {},
        isJetSki: false,
      }),
    },
    "@/components/MyRacerProfileLink": {
      __esModule: true,
      default: () => null,
    },
    wouter: { useLocation: () => ["/golf", () => {}] },
    "@/hooks/useAuth": {
      useAuth: () => ({ user: { username: "test" }, isAuthenticated: true }),
    },
    "@/lib/logout": { logout() {} },
    "@assets/CL_Logo.png": "logo.png",
  }).default;
  let navTree;
  const inside = {},
    outside = {};
  let focused = 0;
  const trigger = {
    focus() {
      focused++;
      doc.activeElement = trigger;
    },
  };
  function drawNav() {
    navTree = nh.render(() => nav({}));
    const refs = all(navTree, (n) => n.type === "div" && n.ref);
    refs[0].ref.current = {
      contains: (node) => node === inside || node === trigger,
      querySelector: () =>
        all(
          navTree,
          (n) => n.type === "button" && n.props["aria-expanded"] === true,
        ).length
          ? trigger
          : null,
    };
    refs[1].ref.current = { contains: () => false, querySelector: () => null };
    nh.flush();
    return navTree;
  }
  drawNav();
  let triggers = all(
    navTree,
    (n) => n.type === "button" && typeof n.props["aria-expanded"] === "boolean",
  );
  triggers[0].props.onClick();
  drawNav();
  triggers = all(
    navTree,
    (n) => n.type === "button" && typeof n.props["aria-expanded"] === "boolean",
  );
  assert.equal(triggers[0].props["aria-expanded"], true);
  assert.equal(
    all(navTree, (n) => n.props?.id === triggers[0].props["aria-controls"])
      .length,
    1,
  );
  assert.equal(
    all(
      navTree,
      (n) => n.props?.role === "menu" || n.props?.role === "menuitem",
    ).length,
    0,
  );
  doc.activeElement = inside;
  let prevented = false;
  win.emit("keydown", {
    key: "Escape",
    preventDefault() {
      prevented = true;
    },
  });
  drawNav();
  assert(prevented);
  assert.equal(focused, 1);
  triggers = all(
    navTree,
    (n) => n.type === "button" && typeof n.props["aria-expanded"] === "boolean",
  );
  assert.equal(triggers[0].props["aria-expanded"], false);
  triggers[0].props.onClick();
  drawNav();
  doc.emit("focusin", { target: outside });
  drawNav();
  assert.equal(
    all(
      navTree,
      (n) => n.type === "button" && n.props["aria-expanded"] === true,
    ).length,
    0,
  );
  assert.equal(focused, 1);
  nh.unmount();
  assert.equal(win.count(), 0);
  assert.equal(doc.count(), 0);
  // Importing the Arcade wrapper must not request Phaser/the canvas before rendering a race.
  let imports = 0;
  const deferred = compile(
    "client/src/components/arcade/DeferredArcadeCanvas.tsx",
    {
      react: {
        ...React,
        lazy(loader) {
          return function Deferred() {
            imports++;
            return loader();
          };
        },
      },
    },
  ).default;
  const arcadeTree = deferred({ course: {}, cpuRacers: [], onExit() {} });
  assert.equal(imports, 0);
  const suspense = all(arcadeTree, (n) => n.type === React.Suspense)[0];
  assert(text(suspense.props.fallback).includes("Loading game"));
  let exited = false;
  const failed = new arcadeTree.type({
    onExit() {
      exited = true;
    },
  });
  failed.state = { failed: true };
  const failure = failed.render();
  assert.equal(all(failure, (n) => n.props?.role === "alert").length, 1);
  all(failure, (n) => n.type === "button")[0].props.onClick();
  assert(exited);
  const home = fs.readFileSync(
    path.resolve(__dirname, "../client/src/pages/landing/home.tsx"),
    "utf8",
  );
  assert(home.includes("<DeferredPromoVideo"));
  assert(home.includes("aria-pressed={motionPaused}"));
  assert(home.includes('loading={imgIndex === 0 ? "eager" : "lazy"}'));
  const css = fs.readFileSync(
    path.resolve(__dirname, "../client/src/index.css"),
    "utf8",
  );
  assert(css.includes(".home-motion-paused .background-column"));
  assert(css.includes("animation: none !important"));
  console.log(
    "PASS deferred media, reduced motion/data saver, explicit play/pause, hidden-page pause, rejected autoplay, cleanup, disclosure Escape/focus restoration, Tab-away closing, and decorative animation controls.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
