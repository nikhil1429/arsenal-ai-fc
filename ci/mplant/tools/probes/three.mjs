// unit mplant probe · `node ci/mplant/tools/probes/three.mjs <sha> <preload.mjs> patch`: as two.mjs, with the PLANT COPY of audit_preload.mjs given one syncBuiltinESMExports line (never the checkout file).
// measure: the collar with ONE added line (syncBuiltinESMExports after patching) in a PLANT copy only, under a bare preload
import { plant, plantEnv } from "../../plant.mjs";
import { spawnSync } from "node:child_process"; import { pathToFileURL } from "node:url"; import { readFileSync, writeFileSync } from "node:fs";
const [sha, pre, patch] = process.argv.slice(2);
const d = plant(sha, { copyModules: true, tag: "dbg" });
if (patch) { const p = d + "/scripts/audit_preload.mjs"; let s = readFileSync(p, "utf8");
  s = s.replace('  process.on("exit", (c) => done(c));', '  require_("module").syncBuiltinESMExports();\n  process.on("exit", (c) => done(c));'); writeFileSync(p, s); }
const { env } = await plantEnv(d, pre ? { NODE_OPTIONS: `--import=${pathToFileURL(pre).href}` } : {});
const r = spawnSync(process.execPath, ["scripts/sandbox.mjs", "selftest"], { cwd: d, env, encoding: "utf8" });
console.log((r.stdout + r.stderr).split("\n").filter(l => /FAIL|passed/.test(l)).join("\n"));
