#!/usr/bin/env node
// ============================================================================
// rehearse.mjs · ARSENAL AI FC — THE NIGHT REHEARSAL (unit mrehearse)
//   SOLE WRITER of dressing-room/state/rehearsal_log.jsonl (append only, one row per rehearsal)
// ----------------------------------------------------------------------------
// THE CLAUSE (spec ci/mwit/MWIT_SPEC.md @ 88bf69d, B-rehearsal:night-replay): at night the NEW code replays the day he
//   recorded, and the night SAYS whether that day would read 11/11 on it.
// WHAT IT DOES, `run` (an act of the night; the runner calls it inside a begun night):
//   1. reads the night now in force through night.mjs's own exported reader (nightOf over its log, read only); no begun,
//      unclosed night → REFUSED, nothing written. The recorded day D is that night's day.
//   2. measures the commit this tree runs at (git rev-parse HEAD) — the code_sha of the row, never typed;
//   3. snapshots the state dir into a fresh os.tmpdir() root and writes that commit's scripts/ + package.json beside it,
//      read out of git (ls-tree + cat-file), so the replay runs exactly the committed code (ruling F3 A: the planter's
//      proven method; daily_green.mjs's own ROOT is then the temp root and the live ledger is never opened);
//   4. runs the REAL `daily_green.mjs --json --date D` there and keeps each clause's STATUS only (no reason text: a reason
//      may carry a session prefix — nothing of his reaches this log);
//   5. ruling F4 A: clauses 9-11 read the machine NOW (daily_green.mjs header, "clauses 9-11 read the machine NOW"), so
//      they are CARRIED from the recorded day's meter row (the latest row for D — the meter's own rule, "the last row for
//      a date wins", daily_green.mjs latestByDate); no recorded row → they read UNREAD and would_be_11 is null (unread);
//   6. appends ONE row { at, night, day, code_sha, greens, clauses[{n,status}], would_be_11, carried, replay } here, deletes
//      the temp root, and reports the act to the night through its CLI: `night.mjs mark --kind rehearse --unit rehearse`
//      (the night measures its own head on that row — the fact the witness compares code_sha with).
// IT NEVER: calls a model, reads a key, opens a port, moves a ref, writes any file but its own log (the snapshot is a temp
//   copy, deleted), or writes another organ's file (the night is reached through its CLI only).
// ITS TEST is the clause witness ci/witness/mrehearse/witness_rehearse.mjs (plants both ways on temp trees); this organ
//   carries no selftest mode of its own (the coverage law would then name it for a suite line: package.json is not a
//   file of this unit, row 1162 (2)).
// CLI:
//   run                      (inside a begun night) replay the night's day on HEAD's code, append ONE row, mark the night
//   last [--night YYYY-MM-DD]  read-only: ONE line for the latest row (of that night)
// ============================================================================
import { readFileSync, appendFileSync, mkdirSync, mkdtempSync, rmSync, cpSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { nightOf, LOG_NAME as NIGHT_LOG } from "./night.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const STATE = join(ROOT, "dressing-room", "state");
export const LOG_NAME = "rehearsal_log.jsonl";
const LOG = join(STATE, LOG_NAME);
const METER = "daily_green.jsonl";          // the meter's ledger (sole writer daily_green.mjs) — read from the snapshot only
export const CARRIED = Object.freeze([9, 10, 11]);   // F4 A: the clauses daily_green.mjs reads off the machine NOW
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const SHA = /^[0-9a-f]{40}$/;

const readRows = (p) => { try { return readFileSync(p, "utf8").split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; } };
const git = (args, opts = {}) => spawnSync("git", args, { cwd: ROOT, windowsHide: true, maxBuffer: 1 << 30, ...opts });

/** the recorded meter row for a day: the LAST row for that date (daily_green.mjs latestByDate's rule). PURE. */
export function recordedRow(rows, day) {
  let last = null;
  for (const r of rows) if (r && r.date === day) last = r;
  return last;
}

/** fold the replay's clauses with the carried ones (F4 A) into the row's verdict. PURE. */
export function verdictOf(replayClauses, recorded) {
  const status = (list, n) => { const c = (Array.isArray(list) ? list : []).find((x) => x && x.n === n); return c && typeof c.status === "string" ? c.status : null; };
  const clauses = [];
  for (let n = 1; n <= 11; n++) {
    const s = CARRIED.includes(n) ? (recorded ? status(recorded.clauses, n) : null) : status(replayClauses, n);
    clauses.push({ n, status: s || "UNREAD" });
  }
  const greens = clauses.filter((c) => c.status === "GREEN").length;
  const unread = clauses.some((c) => c.status === "UNREAD");
  return { clauses, greens, would_be_11: unread ? null : greens === 11 };
}

/** write commit `sha`'s scripts/ and package.json under `dest`, read out of git in ONE cat-file pass (binary-safe) */
function materialize(sha, dest) {
  const ls = git(["ls-tree", "-r", "-z", sha, "--", "scripts", "package.json"]);
  if (ls.status !== 0) return `ls-tree ${String(ls.stderr || "").trim().slice(0, 80)}`;
  const entries = String(ls.stdout).split("\0").filter(Boolean).map((e) => { const t = e.indexOf("\t"); const [mode, type, obj] = e.slice(0, t).split(" "); return { mode, type, obj, path: e.slice(t + 1) }; })
    .filter((e) => e.type === "blob");
  if (!entries.some((e) => e.path === "scripts/daily_green.mjs")) return "no scripts/daily_green.mjs at that commit";
  const cat = git(["cat-file", "--batch"], { input: entries.map((e) => e.obj).join("\n") + "\n" });
  if (cat.status !== 0) return `cat-file ${String(cat.stderr || "").trim().slice(0, 80)}`;
  const buf = cat.stdout;
  let at = 0;
  for (const e of entries) {
    const nl = buf.indexOf(10, at);
    const head = buf.subarray(at, nl).toString("utf8").split(" ");
    if (head[0] !== e.obj || head[1] !== "blob") return `cat-file answered ${head.join(" ").slice(0, 60)}`;
    const size = Number(head[2]);
    const p = join(dest, ...e.path.split("/"));
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, buf.subarray(nl + 1, nl + 1 + size));
    at = nl + 1 + size + 1;
  }
  return null;
}

/** replay day D on commit `sha`'s code over a snapshot of the state dir; { clauses|null, why } */
function replay(sha, day) {
  const root = mkdtempSync(join(tmpdir(), "rehearse-"));
  try {
    if (existsSync(STATE)) cpSync(STATE, join(root, "dressing-room", "state"), { recursive: true });
    else mkdirSync(join(root, "dressing-room", "state"), { recursive: true });
    const recorded = recordedRow(readRows(join(root, "dressing-room", "state", METER)), day);   // the snapshot, before the replay
    const bad = materialize(sha, root);
    if (bad) return { clauses: null, recorded, why: `materialize: ${bad}` };
    const r = spawnSync(process.execPath, [join(root, "scripts", "daily_green.mjs"), "--json", "--date", day], { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26, env: { ...process.env, ARSENAL_ORGAN: "1" } });
    let out = null;
    try { out = JSON.parse(String(r.stdout || "")); } catch { out = null; }
    if (r.status !== 0 || !out || !Array.isArray(out.clauses) || out.date !== day) return { clauses: null, recorded, why: `meter exit ${r.status}${out ? "" : " · no json"}` };
    return { clauses: out.clauses, recorded, why: "ok" };
  } finally { rmSync(root, { recursive: true, force: true }); }
}

function run() {
  const n = nightOf(readRows(join(STATE, NIGHT_LOG)));
  if (!n || !n.begun || n.closed) return { code: 1, out: "rehearse: REFUSED — no begun night (the rehearsal is an act of the night; nothing written)" };
  if (!DAY.test(String(n.day))) return { code: 1, out: "rehearse: REFUSED — the night carries no day" };
  const h = git(["rev-parse", "HEAD"], { encoding: "utf8" });
  const sha = h.status === 0 ? String(h.stdout || "").trim() : "";
  if (!SHA.test(sha)) return { code: 2, out: "rehearse: UNREAD — git rev-parse HEAD unreadable; nothing written" };
  const rp = replay(sha, n.day);
  const v = rp.clauses ? verdictOf(rp.clauses, rp.recorded) : { clauses: [], greens: 0, would_be_11: null };
  const row = { at: new Date().toISOString(), night: n.day, day: n.day, code_sha: sha, greens: v.greens, clauses: v.clauses, would_be_11: v.would_be_11,
    carried: { clauses: [...CARRIED], from: rp.recorded ? (rp.recorded.at || "row") : null }, replay: rp.why === "ok" ? "ok" : rp.why.slice(0, 80) };
  mkdirSync(STATE, { recursive: true });
  appendFileSync(LOG, JSON.stringify(row) + "\n");
  const m = spawnSync(process.execPath, [join(HERE, "night.mjs"), "mark", "--kind", "rehearse", "--unit", "rehearse"], { cwd: ROOT, encoding: "utf8", windowsHide: true });
  const said = v.would_be_11 === null ? "unread" : v.would_be_11 ? "yes" : "no";
  const line = `REHEARSAL ${n.day} · code ${sha.slice(0, 7)} · ${v.greens}/11 · would be 11/11: ${said}${rp.why === "ok" ? "" : ` · replay ${row.replay}`} · night mark ${m.status === 0 ? "ok" : "REFUSED"}`;
  return { code: m.status === 0 ? 0 : 1, out: line };
}

function last(night) {
  const rows = readRows(LOG).filter((r) => !night || r.night === night);
  const r = rows.at(-1);
  if (!r) return { code: 2, out: `rehearse: no row${night ? ` for night ${night}` : ""}` };
  const said = r.would_be_11 === null ? "unread" : r.would_be_11 ? "yes" : "no";
  return { code: 0, out: `REHEARSAL ${r.night} · code ${String(r.code_sha).slice(0, 7)} · ${r.greens}/11 · would be 11/11: ${said} · at ${r.at}` };
}

function main() {
  const [mode, ...rest] = process.argv.slice(2);
  const opt = (k) => { const i = rest.indexOf(k); return i >= 0 && rest[i + 1] !== undefined ? rest[i + 1] : null; };
  const say = (r) => { if (r.out) console.log(r.out); process.exitCode = r.code; };
  if (mode === "run") return say(run());
  if (mode === "last") return say(last(opt("--night")));
  console.log("rehearse: run | last [--night YYYY-MM-DD]");
  process.exitCode = mode ? 2 : 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
