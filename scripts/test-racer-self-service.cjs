const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
let auth = {
  user: { id: "account-a" },
  isAuthenticated: true,
  isLoading: false,
};
let identity = {
  data: { profile: null, pendingClaim: null },
  isPending: false,
  isError: false,
  refetch: () => undefined,
};
const queries = [];
function compile(relative) {
  const filename = path.resolve(__dirname, "..", relative);
  const compiled = new Module(filename, module);
  compiled.filename = filename;
  compiled.paths = module.paths;
  const load = compiled.require.bind(compiled);
  compiled.require = (name) => {
    if (name === "@/hooks/useAuth") return { useAuth: () => auth };
    if (name === "@/hooks/useMyRacerProfile")
      return { useMyRacerProfile: () => identity };
    if (name === "wouter") return { useLocation: () => ["/", () => undefined] };
    if (name === "@tanstack/react-query")
      return {
        useQuery: (options) => {
          queries.push(options);
          return identity;
        },
        useQueryClient: () => ({}),
      };
    if (name === "@/lib/apiClient") return { apiRequest: () => undefined };
    if (name === "@/components/ui/button")
      return {
        Button: (props) => React.createElement("button", props, props.children),
      };
    if (name === "@/lib/selfRacerLookup") return { searchSelfRacers: () => [] };
    if (name.includes("registrationRacerService"))
      return { searchRegistrationRacers: () => [] };
    if (name.includes("CreateRegistrationRacerModal"))
      return { default: () => null };
    if (name.startsWith("@/assets/")) return "avatar.png";
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
  return compiled.exports;
}
const Page = compile("client/src/pages/create-racer-profile.tsx").default;
const Link = compile("client/src/components/MyRacerProfileLink.tsx").default;
function render(component, props = {}) {
  return renderToStaticMarkup(React.createElement(component, props));
}
assert.match(render(Page), /Create your racer profile/);
assert.match(render(Page), /Full name/);
assert.match(
  render(Link, { onNavigate: () => undefined }),
  /Create racer profile/,
);
identity = { ...identity, isError: true };
assert.match(render(Page), /Try again before creating one/);
assert.doesNotMatch(render(Page), /<form/);
assert.doesNotMatch(
  render(Link, { onNavigate: () => undefined }),
  /Create racer profile/,
);
identity = {
  ...identity,
  isError: false,
  data: { profile: null, pendingClaim: { name: "Existing Racer" } },
};
assert.match(render(Page), /Claim pending: Existing Racer/);
assert.doesNotMatch(render(Page), /<form/);
identity = {
  ...identity,
  data: {
    profile: {
      athleteId: "athlete",
      name: "Linked Racer",
      profileUrl: "/racer/racer",
      isVerifiedAthlete: true,
    },
    pendingClaim: null,
  },
};
assert.match(render(Page), /verified athlete identity is linked/);
assert.match(render(Link, { onNavigate: () => undefined }), /My Racer Profile/);
assert.doesNotMatch(render(Page), /<form/);
identity.data.profile.isVerifiedAthlete = false;
assert.match(render(Page), /Submit an identity claim/);
const Step = compile(
  "client/src/features/registration/components/RacerLookupStep.tsx",
).default;
assert.match(
  render(Step, { selectedRacer: null, onSelectRacer: () => undefined }),
  /Register as Linked Racer/,
);
assert.doesNotMatch(
  render(Step, { selectedRacer: null, onSelectRacer: () => undefined }),
  /Verified athlete/,
);
auth.isAuthenticated = false;
assert.match(render(Page), /Sign in to continue/);
assert.doesNotMatch(render(Page), /<form/);
const hook = compile("client/src/hooks/useMyRacerProfile.ts");
hook.useMyRacerProfile();
assert.equal(queries.at(-1).enabled, false);
auth = { ...auth, isAuthenticated: true, user: { id: "account-b" } };
hook.useMyRacerProfile();
assert.deepEqual(queries.at(-1).queryKey, [
  "/athletes/me/racer-profile",
  "account-b",
]);
const { eventLivestreamUrl } = compile("client/src/lib/eventLivestream.ts");
for (const value of [
  "javascript:alert(1)",
  "http://example.com",
  "https://user:secret@example.com",
  undefined,
  null,
  "//example.com",
])
  assert.equal(eventLivestreamUrl(value), null);
assert.equal(
  eventLivestreamUrl("https://example.com/live"),
  "https://example.com/live",
);
const { mapDetail } = compile(
  "client/src/pages/racer-profile-parts/racerProfileUtils.ts",
);
for (const verified of [true, false]) {
  const mapped = mapDetail({
    id: "racer",
    athlete: {
      id: "athlete",
      name: "Linked Racer",
      age: 0,
      claimedByUser: { id: "account", isVerifiedAthlete: verified },
    },
  });
  assert.equal(mapped.isClaimed, true);
  assert.equal(mapped.isVerifiedAthlete, verified);
  assert.equal(mapped.racerAge, undefined);
}
console.log(
  "PASS racer creation/menu loading, failure, linked, pending and guest states; account-scoped cache; registration shortcut; reviewed badge; safe livestream URLs",
);
