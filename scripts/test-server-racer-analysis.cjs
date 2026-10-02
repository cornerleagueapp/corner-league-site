const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
let token = "session";
let response = { status: true, data: { text: "Server-generated analysis." } };
let request;
let calls = 0;
function compile(file, overrides) {
  const mod = new Module(file, module);
  mod.filename = file;
  mod.paths = module.paths;
  mod.require = (name) => overrides[name] ?? require(name);
  mod._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    file,
  );
  return mod.exports;
}
(async () => {
  const base = path.resolve(__dirname, "../client/src/lib");
  const api = {
    apiRequest: async (...args) => {
      calls++;
      request = args;
      if (response instanceof Error) throw response;
      return response;
    },
  };
  const normalizer = compile(path.join(base, "selfRacerLookup.ts"), {
    "@/lib/apiClient": api,
  });
  const analysis = compile(path.join(base, "geminiRacerAnalysis.ts"), {
    "@/lib/apiClient": api,
    "@/lib/token": { getAccessToken: () => token },
    "@/lib/selfRacerLookup": normalizer,
  });
  assert.equal(
    await analysis.generateRacerAnalysis({
      id: "racer-id",
      racerName: "Racer",
    }),
    "Server-generated analysis.",
  );
  assert.equal(request[0], "GET");
  assert.equal(request[1], "/community/me/racers/racer-id/analysis");
  assert.equal(request[2], undefined);
  token = null;
  await assert.rejects(
    analysis.generateRacerAnalysis({ id: "racer-id" }),
    /Sign in/,
  );
  assert.equal(calls, 1);
  token = "session";
  response = { status: true, data: { text: 123 } };
  await assert.rejects(
    analysis.generateRacerAnalysis({ id: "racer-id" }),
    /temporarily unavailable/,
  );
  const source = fs.readFileSync(
    path.join(base, "geminiRacerAnalysis.ts"),
    "utf8",
  );
  assert(!source.includes("VITE_GEMINI_API_KEY"));
  assert(!source.includes("GoogleGenerativeAI"));
  assert(!source.includes("generativelanguage.googleapis.com"));
  console.log(
    "PASS server-only analysis route, response normalization, guest/malformed handling, and removal of browser Gemini credentials.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
