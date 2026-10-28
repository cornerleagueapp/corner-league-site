const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  Module = require("node:module"),
  ts = require("typescript"),
  React = require("react");
let slots = [],
  cursor = 0,
  active = false,
  configured = true,
  writes = [];
const hooks = {
  ...React,
  useState(v) {
    const i = cursor++;
    if (!(i in slots)) slots[i] = typeof v === "function" ? v() : v;
    return [
      slots[i],
      (v) => (slots[i] = typeof v === "function" ? v(slots[i]) : v),
    ];
  },
  useRef(v) {
    const i = cursor++;
    return (slots[i] ??= { current: v });
  },
};
const file = "client/src/components/sms/SeasonSmsContacts.tsx",
  m = new Module(file, module);
m.paths = module.paths;
const mocks = {
  react: hooks,
  "@tanstack/react-query": {
    useQuery: () => ({
      data: {
        seasonId: "season",
        profileId: "profile",
        configured,
        organizationName: "Org",
        seasonName: "Spring",
        consentText: "I control this number. SMS consent is optional.",
        items: active
          ? [
              {
                id: "contact",
                name: "Parent",
                relationship: "parent",
                phone: "••• ••• 0101",
                active: true,
              },
            ]
          : [],
      },
      isPending: false,
      isError: false,
      refetch: async () => {},
    }),
  },
  "@/lib/apiClient": {
    apiRequest: async (method, path, body) => {
      writes.push({ method, path, body });
      if (path.endsWith("/verify")) {
        active = true;
        return { verified: true };
      }
      if (path.endsWith("/revoke")) {
        active = false;
        return { revoked: true };
      }
      return {
        seasonId: "season",
        contactId: "contact",
        phone: "••• ••• 0101",
      };
    },
  },
  "@/lib/sportRegistration": { unwrapSportData: (v) => v },
  "@/components/ui/button": { Button: "Button" },
  "@/components/ui/dialog": {
    Dialog: "Dialog",
    DialogContent: "Content",
    DialogHeader: "Header",
    DialogTitle: "Title",
    DialogDescription: "Description",
  },
};
m.require = (n) => (Object.hasOwn(mocks, n) ? mocks[n] : require(n));
m._compile(
  ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  file,
);
function nodes(n, p) {
  if (Array.isArray(n)) return n.flatMap((v) => nodes(v, p));
  if (!n || typeof n !== "object") return [];
  return [...(p(n) ? [n] : []), ...nodes(n.props?.children, p)];
}
function text(n) {
  return Array.isArray(n)
    ? n.map(text).join("")
    : n && typeof n === "object"
      ? text(n.props?.children)
      : String(n ?? "");
}
function render() {
  cursor = 0;
  return m.exports.SeasonSmsContacts({
    season: "season",
    profile: "profile",
    account: "account",
    name: "Player",
    phone: "2025550101",
  });
}
const button = (t, label) =>
  nodes(t, (n) => n.type === "Button" && text(n) === label)[0];
(async () => {
  let t = render();
  button(t, "Manage text alerts").props.onClick();
  t = render();
  assert.equal(button(t, "Send verification code").props.disabled, true);
  const consent = nodes(
    t,
    (n) => n.type === "input" && n.props.type === "checkbox",
  )[0];
  assert.equal(consent.props.checked, false);
  consent.props.onChange({ target: { checked: true } });
  t = render();
  assert.equal(button(t, "Send verification code").props.disabled, false);
  button(t, "Send verification code").props.onClick();
  await new Promise(setImmediate);
  assert.equal(writes[0].body.consent, true);
  assert.equal(writes[0].body.profileId, "profile");
  assert.equal(writes[0].path, "/team-sms/seasons/season/contacts");
  t = render();
  assert.equal(button(t, "Verify & enable alerts").props.disabled, true);
  nodes(
    t,
    (n) =>
      n.type === "input" && n.props["aria-label"] === "SMS verification code",
  )[0].props.onChange({ target: { value: "123456" } });
  t = render();
  button(t, "Verify & enable alerts").props.onClick();
  await new Promise(setImmediate);
  t = render();
  assert.match(text(t), /Phone verified/);
  assert.match(text(t), /does not submit your registration/);
  const revoke = nodes(
    t,
    (n) => n.type === "Button" && text(n).startsWith("Disable alerts for"),
  )[0];
  revoke.props.onClick();
  await new Promise(setImmediate);
  t = render();
  assert.match(text(t), /Text alerts disabled/);
  assert.equal(writes.length, 3);
  assert(writes.every((w) => !w.path.endsWith("/register")));
  slots = [];
  configured = false;
  t = render();
  assert.match(text(t), /SMS coming soon/);
  assert.equal(button(t, "Send verification code"), undefined);
  console.log(
    "PASS optional SMS consent, own-profile verification flow, separate registration and contact revocation",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
