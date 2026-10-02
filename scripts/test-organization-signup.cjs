const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
function compile(relative) {
  const filename = path.resolve(__dirname, "..", relative);
  const compiled = new Module(filename, module);
  compiled.filename = filename;
  compiled.paths = module.paths;
  compiled._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    filename,
  );
  return compiled.exports;
}
const { ORGANIZATION_SIGNUP_URL, consumerAuthDestination } = compile(
  "client/src/lib/organizationSignup.ts",
);
assert.equal(
  consumerAuthDestination("", true),
  "https://admin.cornerleague.com/create-organization?mode=login",
);
assert.equal(
  consumerAuthDestination("?intent=organization", false),
  `${ORGANIZATION_SIGNUP_URL}?mode=login`,
);
assert.equal(consumerAuthDestination("?next=%2Fprofile", false), "/profile");
assert.equal(
  consumerAuthDestination("?next=https://evil.example", false),
  "/scores/aqua",
);
assert.equal(
  consumerAuthDestination("?next=//evil.example", false),
  "/scores/aqua",
);
const { CreateOrganizationLink } = compile(
  "client/src/components/CreateOrganizationLink.tsx",
);
for (const collapsed of [false, true]) {
  const html = renderToStaticMarkup(
    React.createElement(CreateOrganizationLink, { collapsed }),
  );
  assert.match(
    html,
    /href="https:\/\/admin.cornerleague.com\/create-organization\?mode=login"/,
  );
  assert.match(html, /aria-label="Create your own Org"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.doesNotMatch(html, /token=/);
}
console.log(
  "PASS organization signup destination, retained consumer redirects, safe new-tab creation CTA, and collapsed accessibility",
);

(async () => {
  const { signupThenSignIn } = compile("client/src/lib/organizationSignup.ts");
  let registrations = 0;
  assert.equal(
    await signupThenSignIn(
      async () => {
        registrations++;
      },
      async () => "signed-in",
    ),
    "signed-in",
  );
  await assert.rejects(
    signupThenSignIn(
      async () => {
        registrations++;
      },
      async () => {
        throw new Error("Login unavailable");
      },
    ),
    (error) =>
      error.accountCreated === true &&
      /account was created/.test(error.message),
  );
  await assert.rejects(
    signupThenSignIn(
      async () => {
        throw new Error("Email conflict");
      },
      async () => "unexpected",
    ),
    /Email conflict/,
  );
  assert.equal(registrations, 2);
  console.log(
    "PASS signup recovery distinguishes existing account creation from login failure",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
