const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const script = path.resolve(__dirname, "make-sitemap.mjs");
const runner = `
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const mode=process.env.SITEMAP_TEST_MODE;
globalThis.fetch=async (url,options)=>{
  assert.notEqual(mode,'no-api');
  assert.ok(options.signal);
  const rows=[{id:'public-item'}];
  const json=mode==='wrapped' ? {status:true,data:{items:rows}} : mode==='array' ? rows : mode==='wrapped-array' ? {status:true,data:rows} : {data:{items:{unexpected:true}}};
  return {ok:true,json:async()=>json};
};
const {main}=await import(pathToFileURL(process.argv[2]).href);
await main();
`;
for (const mode of [
  "wrapped",
  "array",
  "wrapped-array",
  "malformed",
  "no-api",
]) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "corner-league-sitemap-"));
  try {
    execFileSync(
      process.execPath,
      ["--input-type=module", "-e", runner, "test", script],
      {
        cwd,
        env: {
          ...process.env,
          SITE_ORIGIN: "https://preview.cornerleague.com",
          CL_API_URL:
            mode === "no-api" ? "" : "https://api.example.invalid/api",
          SITEMAP_TEST_MODE: mode,
        },
        stdio: "pipe",
      },
    );
    const xml = fs.readFileSync(path.join(cwd, "public/sitemap.xml"), "utf8");
    for (const route of ["/scores", "/community", "/articles"])
      assert.ok(
        xml.includes(`<loc>https://preview.cornerleague.com${route}</loc>`),
      );
    assert.doesNotMatch(
      xml,
      /<loc>[^<]*\/(?:writer|auth|notifications|settings)(?:\/|<)/,
    );
    if (["wrapped", "array", "wrapped-array"].includes(mode))
      for (const route of [
        "/aqua-organizations/public-item",
        "/aqua-organizations/event-details/public-item",
        "/racer/public-item",
        "/polls/public-item",
      ])
        assert.ok(
          xml.includes(`<loc>https://preview.cornerleague.com${route}</loc>`),
        );
    else assert.doesNotMatch(xml, /public-item|\[object Object\]/);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
}
console.log(
  "PASS sitemap: custom origin, existing static/dynamic routes, wrapped/raw arrays, malformed responses, no-API builds, and public community directories.",
);
