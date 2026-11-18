#!/usr/bin/env node
// ci/mpool/run_mutants_mpool.mjs — THE MUTANTS of unit mpool (forks rows 1062 / 1066). HEADER = CONTRACT.
//
//   node ci/mpool/run_mutants_mpool.mjs --org <dir> --base-org <dir>
//
// ONE mutant per witness clause. Each mutant is a COPY of --org under os.tmpdir() (the tap and its neighbours in
// scripts/*.mjs, the runner skill, the project settings, package.json, and this unit's witness + PROOF.md), with ONE
// textual mutation planted (every `from` must occur EXACTLY once, or the mutant is INVALID and counts as not killed).
// The copy's own witness then runs `--org <copy> --base-org <base>`; the mutant is KILLED only when the witness's last
// line is RED MPOOL and names the clause that names the mutant. A CONTROL (the copy, unmutated) must read GREEN.
// The org it is handed is never written. No port, no service, no network; every wait is bounded by a hang cap derived
// from the control's own measured run; every temp dir is removed.
//
// LAST LINE  run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN   (exit 0 iff k = n)

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const argOf = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined; };
const ORG = argOf("--org"), BASE = argOf("--base-org");
if (!ORG || !BASE) { console.error("usage: node ci/mpool/run_mutants_mpool.mjs --org <dir> --base-org <dir>"); process.exit(1); }

const TAP = "scripts/usage_tap.mjs", SKILL = ".claude/skills/runner/SKILL.md", OT = "scripts/organism_test.mjs", PROOF = "ci/mpool/PROOF.md";
const HAS_PROC = existsSync("/proc");

// [clause, why, [[file, from, to], ...], onlyWhere]
const MUTANTS = [
  ["W1.1", "five.pct written from seven_day", [[TAP, "five: five.v, week: week.v,", "five: week.v, week: five.v,"]]],
  ["W1.2", "an empty reading written when rate_limits is absent", [[TAP, "if (!rl || typeof rl !== \"object\") return { reading: null,", "if (!rl || typeof rl !== \"object\") return { reading: { v: 1, source: \"statusline\", read_at: now.toISOString(), five: null, week: null },"]]],
  ["W1.3", "a missing window defaults to a zero", [[TAP, "if (w === undefined || w === null) return { ok: true, v: null };", "if (w === undefined || w === null) return { ok: true, v: { pct: 0, resets_at: null } };"]]],
  ["W1.4", "a refused stdin exits non-zero (the statusLine breaks the CLI)", [[TAP, "return finish(`usage tap · ${why} — nothing written`); }", "process.exit(1); }"]]],
  ["W1.5", "the organism's spend gauge named as a fallback source", [[TAP, "const CALL = join(__dirname, \"captains_call.mjs\");", "const CALL = join(__dirname, \"captains_call.mjs\");\nconst VITALS = join(__dirname, \"..\", \"dressing-room\", \"state\", \"token_vitals.json\");"]]],
  ["WA.i", "the fail-open guard removed (a held-open stdin hangs the terminal)", [[TAP, "setTimeout(() => finish(\"usage tap · stdin did not close", "(() => ({ unref() {} }))(() => finish(\"usage tap · stdin did not close"]]],
  ["WA.ii", "root absent claims a read instead of saying nothing was written", [[TAP, "if (!root) return finish(`${shown} · no campaign root (${ROOT_DOOR} unset) — nothing written`);", "if (!root) return finish(`${shown} · read now`);"]]],
  ["W2.1", "GO never returned", [[TAP, "return { ...base, go: true, age_min, why: \"fresh and whole\" };", "return { ...base, go: false, age_min, why: \"fresh and whole\" };"]]],
  ["W2.2", "the age bound loosened (doubled)", [[TAP, "if (age >= rule.maxAgeMin) return W(", "if (age > rule.maxAgeMin + rule.maxAgeMin) return W("]]],
  ["W2.3", "age measured from the file's mtime", [[TAP, "return { root, v: verdict(readReading(readingPath(root)), new Date(), readRule(root)) };", "return { root, v: verdict((() => { const r = readReading(readingPath(root)); if (r) r.read_at = statSync(readingPath(root)).mtime.toISOString(); return r; })(), new Date(), readRule(root)) };"]]],
  ["W2.4", "a future stamp accepted", [[TAP, "if (at > now.getTime()) return W(", "if (false) return W("]]],
  ["W2.5", "the rolled-window test dropped (rule 4)", [[TAP, "if (now.getTime() >= r) return W(", "if (false) return W("]]],
  ["W2.6", "a null window treated as zero", [[TAP, "if (!reading.five || !reading.week || !pctOk(reading.five.pct) || !pctOk(reading.week.pct)) return W(", "reading.five = reading.five || { pct: 0, resets_at: null }; reading.week = reading.week || { pct: 0, resets_at: null }; if (false) return W("]]],
  ["W2.7", "a hard-coded fallback bound", [[TAP, "let t; try { t = readFileSync(join(root, ...LAW_HOME), \"utf8\"); } catch { return null; }", "let t; try { t = readFileSync(join(root, ...LAW_HOME), \"utf8\"); } catch { return { maxAgeMin: 300 }; }"], [TAP, "return Number.isInteger(n) && n > 0 ? { maxAgeMin: n } : null;", "return Number.isInteger(n) && n > 0 ? { maxAgeMin: n } : { maxAgeMin: 300 };"]]],
  ["W2.8", "a typed age bound in the tap", [[TAP, "const MS_PER_MIN = 60 * MS_PER_S;", "const MS_PER_MIN = 60 * MS_PER_S;\nconst FALLBACK_AGE_MIN = 300;"]]],
  ["W3.1", "the tap opens a POOL.json path for write", [[TAP, "const CALL = join(__dirname, \"captains_call.mjs\");", "const CALL = join(__dirname, \"captains_call.mjs\");\nif (process.env.MPOOL_NEVER_SET) writeFileSync(join(campaignRoot() || \".\", \"POOL.json\"), \"{}\");"]]],
  ["W3.2", "the tap stores a GO in the reading", [[TAP, "v: 1, source: \"statusline\", read_at: now.toISOString(), five: five.v,", "v: 1, go: true, source: \"statusline\", read_at: now.toISOString(), five: five.v,"]]],
  ["W3.4", "verdict stamps a last-verdict file", [[TAP, "else if (mode === \"verdict\") { const { v } = judge();", "else if (mode === \"verdict\") { const { v } = judge(); writeFileSync(join(__dirname, \"..\", \"..\", \"last_verdict.json\"), String(Date.now()));"]]],
  ["W4.1", "need never files", [[TAP, "if (v.go || !v.no_source) { console.log(", "if (true) { console.log("]]],
  ["W4.2", "the card filed without its key", [[TAP, "\"--key\", `usage:panel:${istDay(new Date())}`, ", ""]]],
  ["W4.3", "need files even on GO", [[TAP, "if (v.go || !v.no_source) { console.log(", "if (false) { console.log("]]],
  ["W4.4", "need files on every WAIT", [[TAP, "if (v.go || !v.no_source) { console.log(", "if (v.go) { console.log("]]],
  ["W4.5", "the panel reading skips the age law", [[TAP, "if (age >= rule.maxAgeMin) return W(", "if (age >= rule.maxAgeMin && reading.source !== \"his-panel\") return W("]]],
  ["W4.6", "the panel command put in the card line", [[TAP, "export const CARD_LINE = \"Pool ka panel:", "export const CARD_LINE = \"node scripts/usage_tap.mjs panel --five N --week N · Pool ka panel:"]]],
  ["F2", "a credential file named in code", [[TAP, "const CALL = join(__dirname, \"captains_call.mjs\");", "const CALL = join(__dirname, \"captains_call.mjs\");\nconst CRED = join(process.env.HOME || \".\", \".claude\", \".credentials.json\");"]]],
  ["F5", "a percent line in the tap (the tap decides)", [[TAP, "return { ...base, go: true, age_min, why: \"fresh and whole\" };", "if (reading.five.pct >= PCT_SCALE - MS_PER_S / PCT_SCALE) return W(\"over the line\", { age_min });\n  return { ...base, go: true, age_min, why: \"fresh and whole\" };"]]],
  ["F9", "a panel reading with no reset is treated as rolled", [[TAP, "if (w.resets_at == null) continue;", "if (w.resets_at == null) return W(\"no reset time\", { age_min });"]]],
  ["C", "the runner twin's fallback-card line drops the need verb", [[SKILL, "run `node scripts/usage_tap.mjs need`", "run the usage tap"]]],
  ["J", "the hermetic chain stops judging the tap's selftest", [[OT, "const tap = hermeticRuns.get(runKey([join(ROOT, \"scripts\", \"usage_tap.mjs\"), \"selftest\"]));", "const tap = { code: 0, out: \"\" };"]]],
  ["S", "the SETTINGS LINE runs a verb that is not the statusline", [[PROOF, "/scripts/usage_tap.mjs\\\" statusline\"", "/scripts/usage_tap.mjs\\\" status\""]]],
  ["LAST", "the statusline leaves a detached node process naming the campaign root", [[TAP, "import { spawnSync } from \"node:child_process\";", "import { spawnSync, spawn } from \"node:child_process\";"], [TAP, "function statusline() {\n", "function statusline() {\n  spawn(process.execPath, [\"-e\", \"setTimeout(() => {}, 60000)\", String(campaignRoot())], { detached: true, stdio: \"ignore\" }).unref();\n"]], "proc"],
];

function copyOrg(src, dst) {
  mkdirSync(join(dst, "scripts"), { recursive: true });
  for (const f of readdirSync(join(src, "scripts"))) if (f.endsWith(".mjs")) copyFileSync(join(src, "scripts", f), join(dst, "scripts", f));
  for (const rel of [SKILL, ".claude/settings.json", "package.json", "ci/mpool/witness_mpool.mjs", PROOF]) {
    const from = join(src, ...rel.split("/")); if (!existsSync(from)) continue;
    mkdirSync(join(dst, ...rel.split("/").slice(0, -1)), { recursive: true }); copyFileSync(from, join(dst, ...rel.split("/")));
  }
}
function witness(dir, cap) {
  const r = spawnSync(process.execPath, [join(dir, "ci", "mpool", "witness_mpool.mjs"), "--org", dir, "--base-org", BASE], { encoding: "utf8", ...(cap ? { timeout: cap } : {}) });
  const lines = String(r.stdout || "").trim().split(/\r?\n/);
  return { code: r.status, last: lines[lines.length - 1] || "", timedOut: !!r.error };
}

const ROOT = mkdtempSync(join(tmpdir(), "mpool-mutants-"));
let killed = 0, counted = 0, controlOk = false;
try {
  const ctl = join(ROOT, "control"); copyOrg(ORG, ctl);
  const t0 = Date.now(); const c = witness(ctl); const controlMs = Date.now() - t0;
  controlOk = c.code === 0 && /^GREEN MPOOL /.test(c.last);
  console.log(`  control · ${controlOk ? "GREEN" : "NOT GREEN"} · ${c.last} · ${controlMs} ms`);
  const cap = (controlMs + 1) * (MUTANTS.length + 1);   // a hang cap from the control's measured run — never a judgement
  for (const [id, why, edits, only] of MUTANTS) {
    if (only === "proc" && !HAS_PROC) { console.log(`  SKIP ${id} · ${why} · needs /proc to see a survivor (not on this OS) — not counted`); continue; }
    counted++;
    const dir = join(ROOT, `m-${id.replace(/\W/g, "_")}`); copyOrg(ORG, dir);
    let valid = true;
    for (const [file, from, to] of edits) {
      const p = join(dir, ...file.split("/")); const t = readFileSync(p, "utf8");
      if (t.split(from).length !== 2) { valid = false; break; }
      writeFileSync(p, t.replace(from, () => to));
    }
    if (!valid) { console.log(`  FAIL ${id} · ${why} · INVALID (the mutation's anchor is not unique in the copy)`); continue; }
    const r = witness(dir, cap);
    const reds = /^RED MPOOL · (.*)$/.exec(r.last);
    const hit = !!reds && reds[1].split(", ").includes(id);
    if (hit) killed++;
    console.log(`  ${hit ? "ok  " : "FAIL"} ${id} · ${why} · ${r.timedOut ? "witness hit the hang cap · " : ""}${r.last}`);
  }
} finally { rmSync(ROOT, { recursive: true, force: true }); }
console.log(`run_mutants: ${killed} of ${counted} mutant(s) RED by the clause that names them · control ${controlOk ? "GREEN" : "NOT GREEN"}`);
process.exit(killed === counted && controlOk ? 0 : 1);
