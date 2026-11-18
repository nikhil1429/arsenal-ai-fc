#!/usr/bin/env node
// ============================================================================
// ci/mpm/witness_mpm.mjs — unit mpm PART 1 (F5): THE DAY CLOSE JUDGES ONLY A DAY THE ARCHIVE SAW, and an outstanding capture
// of day D on the gaffer grade queue IS evidence for the close of D (each capture keeps its own IST day — the mjday rule,
// gaffer_brain.mjs captureDay).
// ----------------------------------------------------------------------------
// USAGE: node ci/mpm/witness_mpm.mjs --org <dir> [--base-org <dir>]
//   --org       a repository tree to witness (an LF git-archive tree; never his live tree)
//   --base-org  the BASE tree (main 5767e21) — the BOUND clause and Q2's byte-equal reading need it; absent, both are RED
// CONTRACT — every plant runs on a COPY of a tree under os.tmpdir(), with its OWN empty dressing-room/state (the queue planted
//   there, nothing of his), its own HOME / USERPROFILE / ARSENAL_ARCHIVE under the same temp root, and the step's clock FIXED
//   through postmatch's own clock door (ARSENAL_AUTOCLOSE_CLOCK, honoured only for a copy under os.tmpdir()). A FAKE claude
//   (`claude` and `claude.cmd`) sits FIRST on PATH and logs any spawn; no live model call can happen. No timeout is typed.
//   Windows: a node_modules link is a junction; path keys use forward slashes; processes are listed without /proc.
// THE PLANT (one queue, four rows; D = 2099-03-02, the clock 2099-03-03T02:00Z = 07:30 IST on D+1, the MORNING anchor):
//   wq-a  capture  ts 2099-03-01T20:00Z   = 01:30 IST on D        → OUTSTANDING, D's (its UTC date is D-1)
//   wq-b  capture  ts 2099-03-02T10:00Z   + a settled row of it   → NOT outstanding
//   wq-c  capture  ts 2099-03-02T19:00Z   = 00:30 IST on D+1      → OUTSTANDING, not D's (its UTC date is D)
//   The judge's own rule (judgeDue, the real clock) reads the newest outstanding capture as not yet idle, so the judge step
//   answers NOT DUE out loud and no model is reached.
// CLAUSES:
//   Q1  QUEUE-ONLY DAY CLOSES — D (no study session, only an outstanding capture) closes by code: exit 0, post_match/D.md is a
//       machine record (CLOSED-BY morning), its compile line is "nothing to compile" (no compile spawned), and its JUDGE line is
//       gaffer_brain's own answer (the judge step ran), never "pending".
//   Q2  NEITHER STAYS AS TODAY — 2099-03-05 (no study, no capture of its IST day) prints "no evidence · nothing run", exit 0,
//       writes no post_match file, and its stdout equals BASE's byte for byte (the copy's root path read as <ORG>).
//   Q3  THE mjday RULE — D's record names exactly wq-a (1 outstanding capture of D): never the settled wq-b, never wq-c (D+1's).
//   BOUND --org differs from --base-org ONLY in scripts/postmatch.mjs (ci/mpm/** is this unit's own output; .claude/settings.json
//       is the seat's effort key, which never lands on main — both are left out of the comparison by name).
//   LAST  no node process naming the temp root survives, and the fake claude logged no spawn.
// LAST LINE: GREEN MPM queue evidence closes its day · <n> clause(s)  (exit 0)  ·  RED MPM · <clauses>  (exit 1)
// ============================================================================
import { cpSync, mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, statSync, symlinkSync, chmodSync } from "node:fs";
import { join, resolve, relative, sep, delimiter } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? resolve(process.argv[i + 1]) : null; };
const ORG = arg("--org"), BASE_ORG = arg("--base-org");
if (!ORG || !existsSync(join(ORG, "scripts", "postmatch.mjs"))) { console.log("RED MPM · USAGE (--org <dir> with scripts/postmatch.mjs)"); process.exit(1); }

const D = "2099-03-02", NEITHER = "2099-03-05", CLOCK = "2099-03-03T02:00:00.000Z";
const SKIP_TOP = new Set([".git", "node_modules"]);
const ROOT = mkdtempSync(join(tmpdir(), "mpm-wit-"));
const results = [];
const clause = (id, ok, why) => { results.push({ id, ok: !!ok }); console.log(`  ${ok ? "ok  " : "RED "} ${id} · ${why}`); };
const slash = (p) => p.split(sep).join("/");

function copyOrg(src, dst) {
  cpSync(src, dst, { recursive: true, filter: (p) => {
    const rel = slash(relative(src, p));
    if (!rel) return true;
    if (SKIP_TOP.has(rel.split("/")[0])) return false;
    return !(rel === "dressing-room/state" || rel.startsWith("dressing-room/state/"));
  } });
  mkdirSync(join(dst, "dressing-room", "state"), { recursive: true });   // its OWN state dir, empty but for the plant
  if (existsSync(join(src, "node_modules"))) symlinkSync(join(src, "node_modules"), join(dst, "node_modules"), "junction");
}
function plant(dst) {
  const q = [
    { kind: "capture", id: "wq-a", type: "axis_weld", ref: "witness:a", spoken: "planted", ts: "2099-03-01T20:00:00.000Z", day: "2099-03-02" },
    { kind: "capture", id: "wq-b", type: "axis_weld", ref: "witness:b", spoken: "planted", ts: "2099-03-02T10:00:00.000Z", day: "2099-03-02" },
    { kind: "settled", id: "wq-sb", of: "wq-b", ts: "2099-03-02T11:00:00.000Z" },
    { kind: "capture", id: "wq-c", type: "axis_weld", ref: "witness:c", spoken: "planted", ts: "2099-03-02T19:00:00.000Z", day: "2099-03-03" },
  ];
  writeFileSync(join(dst, "dressing-room", "state", "gaffer_grade_queue.jsonl"), q.map((r) => JSON.stringify(r)).join("\n") + "\n");
}
// the fake claude, first on PATH (a .cmd beside it for Windows)
const FAKE = join(ROOT, "fakebin"), CLAUDE_LOG = join(ROOT, "claude_spawns.log");
mkdirSync(FAKE, { recursive: true });
writeFileSync(join(FAKE, "claude"), `#!/bin/sh\necho "spawn $*" >> "$MPM_FAKE_CLAUDE_LOG"\nexit 1\n`);
chmodSync(join(FAKE, "claude"), 0o755);
writeFileSync(join(FAKE, "claude.cmd"), `@echo spawn %* >> "%MPM_FAKE_CLAUDE_LOG%"\r\n@exit /b 1\r\n`);
function envFor(copy) {
  const home = join(ROOT, `home-${slash(relative(ROOT, copy)).replace(/\//g, "_")}`);
  mkdirSync(home, { recursive: true });
  const e = { ...process.env };
  delete e.ANTHROPIC_API_KEY; delete e.ARSENAL_DAY_KEY; delete e.ARSENAL_AUTOCLOSE_DEADLINE;
  const pathKey = Object.keys(e).find((k) => k.toUpperCase() === "PATH") || "PATH";
  return { ...e, [pathKey]: `${FAKE}${delimiter}${e[pathKey] || ""}`, HOME: home, USERPROFILE: home,
    ARSENAL_ARCHIVE: join(ROOT, `archive-${slash(relative(ROOT, copy)).replace(/\//g, "_")}`), ARSENAL_CALL_STATE_DIR: join(copy, "dressing-room", "state"),
    ARSENAL_AUTOCLOSE_CLOCK: CLOCK, MPM_FAKE_CLAUDE_LOG: CLAUDE_LOG };
}
const close = (copy, day) => {
  const r = spawnSync(process.execPath, [join(copy, "scripts", "postmatch.mjs"), "autoclose", "--date", day, "--anchor", "morning"],
    { cwd: copy, encoding: "utf8", env: envFor(copy), windowsHide: true });
  return { status: r.status, stdout: String(r.stdout || ""), stderr: String(r.stderr || "") };
};
const norm = (s, copy) => s.split(copy).join("<ORG>").split(slash(copy)).join("<ORG>").split(ROOT).join("<TMP>");
const pmOf = (copy, day) => join(copy, "dressing-room", "state", "post_match", `${day}.md`);

let exitCode = 1;
try {
  const org = join(ROOT, "org");
  copyOrg(ORG, org); plant(org);
  let base = null;
  if (BASE_ORG) { base = join(ROOT, "base"); copyOrg(BASE_ORG, base); plant(base); }

  // Q2 first, on fresh copies (the archive's own first run is the same on both sides)
  const n = close(org, NEITHER), nb = base ? close(base, NEITHER) : null;
  const nLine = n.stdout.split(/\r?\n/).find((l) => l.startsWith("autoclose ·")) || "";
  clause("Q2", n.status === 0 && nLine.startsWith(`autoclose · ${NEITHER} · no evidence · nothing run`) && !existsSync(pmOf(org, NEITHER))
      && !!nb && norm(n.stdout, org) === norm(nb.stdout, base),
    `neither day: exit ${n.status} · ${nLine ? nLine.slice(0, 70) : "no autoclose line"} · file ${existsSync(pmOf(org, NEITHER)) ? "WRITTEN" : "none"} · ${nb ? (norm(n.stdout, org) === norm(nb.stdout, base) ? "stdout = BASE's" : "stdout DIFFERS from BASE's") : "no --base-org"}`);

  const q = close(org, D);
  const rec = existsSync(pmOf(org, D)) ? readFileSync(pmOf(org, D), "utf8") : "";
  const judge = (/^JUDGE: .*$/m.exec(rec) || [""])[0], compile = (/^COMPILE: .*$/m.exec(rec) || [""])[0];
  clause("Q1", q.status === 0 && /^CLOSED-BY: code · morning anchor · 2099-03-03T02:00:00\.000Z$/m.test(rec)
      && compile.startsWith(`COMPILE: DONE · nothing to compile — no study session on ${D}`)
      && /^JUDGE: (?!pending)\S.* · gaffer_brain: /.test(judge) && /closed by code \(morning anchor\)/.test(q.stdout),
    `queue-only day: exit ${q.status} · record ${rec ? "written" : "NONE"} · ${compile.slice(0, 60) || "no compile line"} · ${judge.slice(0, 90) || "no judge line"}`);

  const ql = (/^  · grade queue: .*$/m.exec(rec) || [""])[0];
  clause("Q3", ql.startsWith(`  · grade queue: 1 outstanding capture(s) of ${D}`) && /\bwq-a\b/.test(ql) && !/\bwq-b\b|\bwq-c\b/.test(ql),
    `the record's queue line: ${ql.trim().slice(0, 110) || "absent"}`);

  // BOUND — the two trees, file by file (path keys with forward slashes)
  if (!BASE_ORG) clause("BOUND", false, "no --base-org given");
  else {
    const OUT = (rel) => rel.startsWith("ci/mpm/") || rel === ".claude/settings.json";
    const walk = (dir, acc = new Map(), top = dir) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name), rel = slash(relative(top, p));
        if (SKIP_TOP.has(rel.split("/")[0]) || OUT(rel)) continue;
        const st = statSync(p);
        if (st.isDirectory()) walk(p, acc, top); else acc.set(rel, createHash("sha256").update(readFileSync(p)).digest("hex"));
      }
      return acc;
    };
    const a = walk(ORG), b = walk(BASE_ORG);
    const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort();
    clause("BOUND", diff.length === 1 && diff[0] === "scripts/postmatch.mjs", `differs in ${diff.length} file(s): ${diff.slice(0, 6).join(", ") || "none"}`);
  }

  // LAST — no node process naming the temp root survives; the fake claude logged no spawn
  const listing = process.platform === "win32"
    ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true })
    : spawnSync("ps", ["-eo", "args"], { encoding: "utf8" });
  const procs = String(listing.stdout || "").split(/\r?\n/).filter((l) => /node/i.test(l) && (l.includes(ROOT) || l.includes(slash(ROOT))) && !l.includes("witness_mpm"));
  const spawns = existsSync(CLAUDE_LOG) ? readFileSync(CLAUDE_LOG, "utf8").trim() : "";
  clause("LAST", listing.status === 0 && procs.length === 0 && !spawns,
    `process list ${listing.status === 0 ? "read" : "NOT READ"} · ${procs.length} node process(es) naming the temp root · fake claude ${spawns ? `logged ${spawns.split(/\r?\n/).length} spawn(s)` : "logged no spawn"}`);
} catch (e) {
  clause("RUN", false, `the witness threw: ${(e && e.message) || e}`);
} finally {
  try { rmSync(ROOT, { recursive: true, force: true }); } catch {}
}
const red = results.filter((r) => !r.ok).map((r) => r.id);
if (!red.length) { console.log(`GREEN MPM queue evidence closes its day · ${results.length} clause(s)`); exitCode = 0; }
else console.log(`RED MPM · ${red.join(" ")}`);
process.exitCode = exitCode;
