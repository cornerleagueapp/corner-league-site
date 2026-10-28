const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path"),
  Module = require("node:module");
const ts = require("typescript"),
  React = require("react");
function compile(relative, mocks) {
  const file = path.resolve(__dirname, "..", relative),
    mod = new Module(file, module);
  mod.filename = file;
  mod.paths = module.paths;
  const fallback = mod.require.bind(mod);
  mod.require = (name) =>
    Object.hasOwn(mocks, name) ? mocks[name] : fallback(name);
  mod._compile(
    ts.transpileModule(
      fs.readFileSync(file, "utf8") + "\nexport { RegistrationForm };",
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      },
    ).outputText,
    file,
  );
  return mod.exports;
}
function nodes(node, test) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap((item) => nodes(item, test));
  return [...(test(node) ? [node] : []), ...nodes(node.props?.children, test)];
}
function copy(node) {
  return Array.isArray(node)
    ? node.map(copy).join("")
    : node && typeof node === "object"
      ? copy(node.props?.children)
      : String(node ?? "");
}
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
        return (slots[i] ??= { current: initial });
      },
      useMemo(fn, deps) {
        const i = cursor++;
        if (!slots[i] || deps.some((d, n) => d !== slots[i].deps[n]))
          slots[i] = { deps, value: fn() };
        return slots[i].value;
      },
      useCallback(fn, deps) {
        const i = cursor++;
        if (!slots[i] || deps.some((d, n) => d !== slots[i].deps[n]))
          slots[i] = { deps, value: fn };
        return slots[i].value;
      },
      useEffect(fn, deps) {
        const i = cursor++;
        if (!slots[i] || deps.some((value, n) => value !== slots[i][n])) {
          slots[i] = deps;
          effects.push(fn);
        }
      },
    },
    render(fn) {
      cursor = 0;
      return fn();
    },
    reset() {
      slots.length = 0;
      cursor = 0;
      effects = [];
    },
    async effects() {
      const pending = effects;
      effects = [];
      pending.forEach((fn) => fn());
      await new Promise(setImmediate);
    },
  };
}

const h = hooks();
let data = null,
  pending = false,
  error = null,
  writes = [];
const mocks = {
  "@/components/navigation/Breadcrumbs": { BreadcrumbTrail: "BreadcrumbTrail" },
  react: h.react,
  "@tanstack/react-query": {
    useQuery: () => ({
      data,
      isPending: pending,
      isError: !!error,
      error,
      refetch: async () => {},
    }),
  },
  wouter: { Link: "Link", useSearch: () => "" },
  "@/hooks/useAuth": { useAuth: () => ({}) },
  "@/lib/apiClient": {
    apiRequest: async (method, path, body) => {
      writes.push({ method, path, body });
      return {};
    },
  },
  "@/lib/sportRegistration": { unwrapSportData: (x) => x },
  "@/components/waivers/SeasonWaivers": {
    SeasonWaiverSigning: "SeasonWaiverSigning",
    useSeasonWaivers: () => ({
      data: { complete: true },
      isPending: false,
      isError: false,
      refetch: async () => {},
    }),
    waiverBlockedReason: () => null,
  },
  "@/seo/usePageSEO": { PageSEO: "SEO" },
  "@/components/ui/button": { Button: "Button" },
  "./sport-registration": { RegistrationLogo: "Logo" },
};
const { RegistrationForm } = compile(
  "client/src/pages/season-registration.tsx",
  mocks,
);
const render = () =>
  h.render(() =>
    RegistrationForm({
      id: "season",
      sport: "basketball",
      account: "account",
      onRefresh: () => {},
    }),
  );
const one = (t, type) => nodes(t, (n) => n.type === type)[0];
(async () => {
  let t = render();
  assert.ok(copy(t).includes("Create your basketball athlete profile"));
  assert.ok(one(t, "Link").props.href.includes("next="));
  data = {
    id: "athlete",
    name: "Player",
    age: 26,
    email: "p@example.com",
    phone: "",
    contactName: "Player",
  };
  t = render();
  assert.equal(one(t, "Button").props.disabled, true);
  assert.ok(copy(t).includes("phone number"));
  data.phone = "555";
  t = render();
  one(t, "input").props.onChange({ target: { value: "Coach Pat" } });
  one(t, "textarea").props.onChange({ target: { value: "Evenings" } });
  t = render();
  await one(t, "form").props.onSubmit({ preventDefault() {} });
  assert.deepEqual(writes[0].body, {
    profileId: "athlete",
    referredBy: "Coach Pat",
    notes: "Evenings",
  });
  assert.equal(writes[0].path, "/team-management/seasons/season/register");
  assert.ok(copy(render()).includes("You’re registered"));
  assert.ok(!("teamId" in writes[0].body));
  console.log(
    "PASS registration profile gate, missing contacts, season-only request and optional fields",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
