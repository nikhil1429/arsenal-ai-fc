#!/usr/bin/env node
// ============================================================================
// awayday.mjs · ARSENAL AI FC — THE AWAY-DAY RUNNER (public-safe CI lane)
// ----------------------------------------------------------------------------
// WHAT:  The one lane allowed to run in a CLOUD runner (CYBORG_BRAIN.md §9):
//        genuinely public-safe deterministic chores on the PUBLIC repo —
//        selftest CI, bundle regen. A CI lane, NOT a home for the brain
//        (Actions can't hold a long-lived Claude OAuth session, and personal
//        data never leaves his house).
// THE GUARD: every job must carry `public_safe: true` in ci_manifest.json —
//        this runner REFUSES any job without the flag, so nothing touching
//        biometrics/transcripts can ever leak into a cloud runner, even by a
//        careless future edit. The refusal is loud and fails the run.
// MODES: node scripts/awayday.mjs run · list · selftest
// ============================================================================

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST = join(__dirname, "..", "ci_manifest.json");

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };

function vetJobs(manifest) {
  const jobs = (manifest && manifest.jobs) || [];
  const refused = jobs.filter(j => j.public_safe !== true);
  return { runnable: jobs.filter(j => j.public_safe === true), refused };
}
async function run(deps = {}) {
  const manifest = deps.manifest !== undefined ? deps.manifest : readJson(MANIFEST);
  if (!manifest) return { ok: false, why: "no ci_manifest.json — nothing runs in the cloud without the manifest" };
  const { runnable, refused } = vetJobs(manifest);
  if (refused.length) return { ok: false, why: `REFUSED: ${refused.map(j => j.name).join(", ")} lack public_safe:true — the away-day runner does not negotiate` };
  const exec = deps.exec || ((cmd) => execSync(cmd, { encoding: "utf8", stdio: "inherit", cwd: join(__dirname, ".."), timeout: 1200000 }));
  const ran = [];
  for (const j of runnable) { exec(j.run); ran.push(j.name); }
  return { ok: true, ran };
}

async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const good = { jobs: [{ name: "selftests", run: "npm run organism:selftest", public_safe: true }] };
  const sneaky = { jobs: [{ name: "selftests", run: "x", public_safe: true }, { name: "biometric-sync", run: "node scripts/oura_coach.mjs" }] };

  const r1 = await run({ manifest: good, exec: () => {} });
  assert("flagged jobs run", r1.ok && r1.ran.includes("selftests"));
  let executed = false;
  const r2 = await run({ manifest: sneaky, exec: () => { executed = true; } });
  assert("ONE unflagged job → the WHOLE run refused, loudly, nothing executes", r2.ok === false && r2.why.includes("biometric-sync") && executed === false);
  assert("no manifest → nothing runs in the cloud", (await run({ manifest: null })).ok === false);
  const real = readJson(MANIFEST);
  assert("the real manifest exists and every job is flagged", real && vetJobs(real).refused.length === 0 && vetJobs(real).runnable.length >= 1);
  assert("the real manifest contains no personal-file references", !JSON.stringify(real).match(/oura|readiness|reps_log|intake|hippocampus|transcript/i));

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "list") { const { runnable, refused } = vetJobs(readJson(MANIFEST)); console.log(`awayday: ${runnable.length} public-safe job(s)${refused.length ? ` · ${refused.length} REFUSED` : ""}`); return; }
  if (mode === "run") {
    const r = await run();
    if (!r.ok) { console.error(`awayday: ${r.why}`); process.exit(1); }
    console.log(`awayday: ran ${r.ran.join(", ")}`);
    return;
  }
  console.log("awayday.mjs — run | list | selftest");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { vetJobs, run };
