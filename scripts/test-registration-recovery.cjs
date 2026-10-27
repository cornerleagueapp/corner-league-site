const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  Module = require("node:module"),
  ts = require("typescript");
function load(file, mocks) {
  const m = new Module(file, module);
  m.paths = module.paths;
  m.require = (id) => (Object.hasOwn(mocks, id) ? mocks[id] : require(id));
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
  return m.exports;
}
(async () => {
  let calls = 0,
    reply,
    finish;
  const api = {
    apiFetch: async (path, opts) => {
      calls++;
      assert.equal(opts.skipAuth, true);
      assert.equal(opts.noRefresh, true);
      return reply;
    },
  };
  let contract = load("client/src/lib/sportRegistration.ts", {
    "./apiClient": api,
  });
  reply = new Promise((r) => (finish = r));
  const a = contract.publicSportData("/public"),
    b = contract.publicSportData("/public");
  assert.equal(a, b);
  assert.equal(calls, 1);
  finish({ ok: true, json: async () => ({ data: { id: "s" } }) });
  assert.deepEqual(await a, { id: "s" });
  await b;
  reply = { ok: false, status: 429, headers: { get: () => "60" } };
  await assert.rejects(contract.publicSportData("/limited"), /Too many/);
  const before = calls;
  await assert.rejects(contract.publicSportData("/another"), /seconds/);
  assert.equal(
    calls,
    before,
    "Retry-After cooldown must suppress new anonymous requests",
  );
  contract = load("client/src/lib/sportRegistration.ts", {
    "./apiClient": {
      apiFetch: async () => {
        throw Error("Failed to fetch");
      },
    },
  });
  await assert.rejects(
    contract.publicSportData("/offline"),
    /server could not be reached/,
  );
  const app = fs.readFileSync("client/src/App.tsx", "utf8");
  const alias = [
      ...app.matchAll(/<Route path="\/profile\/notifications"/g),
    ].map((m) => m.index),
    dynamic = [...app.matchAll(/<Route path="\/profile\/:username"/g)].map(
      (m) => m.index,
    );
  assert.equal(alias.length, 2);
  assert.ok(alias.every((a, i) => a < dynamic[i]));
  assert.ok(
    fs
      .readFileSync("client/src/pages/season-registration.tsx", "utf8")
      .includes('href="/notifications"'),
  );
  console.log(
    "PASS anonymous request sharing, server cooldown, network error clarity, legacy notification aliases before username routes and canonical receipt link",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
