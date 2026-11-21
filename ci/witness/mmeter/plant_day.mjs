#!/usr/bin/env node
// ============================================================================
// ci/witness/mmeter/plant_day.mjs — UNIT mmeter · THE DAY PLANTER (from ci/mwit/plant_day.mjs @ 88bf69d, moved and extended)
// ----------------------------------------------------------------------------
// USAGE: node ci/witness/mmeter/plant_day.mjs [5|11] [--org <dir>]
//   Plants ONE study day under os.tmpdir() whose meter reads <want>/11 and runs the REAL `daily_green.mjs` CLI of <org>
//   (default: this file's own repo) over it. Prints ONE line: PLANT want <w>/11 · got <n>/11 · meter exit <e> · line: <line>
// CONTRACT
//   · The temp root holds a COPY of <org>/scripts and <org>/package.json, so daily_green.mjs's ROOT (`join(HERE, "..")`) is
//     the temp root and the live ledger is never opened. Nothing of his state is copied but the TRACKED registry.json, which
//     is read and re-planted with a `note_blocks` lane (gate.mjs throws at import on an empty lanes table — ci/mwit ledger
//     row 2); nothing of it is printed.
//   · want 5:  clauses 1-4 and 6 planted GREEN; 5, 7-10 not born; 11 unreadable (no git in the root) — the spec's §1 day.
//   · want 11: every clause planted GREEN on the same study day — rejirah_log.jsonl + an empty capsules/ mirror (none due),
//     readiness.json for the day, post_match/<D>.md (RESULT + KAL-line), a fresh daemon_watchdog.json naming every daemon of
//     the org's own roster (daemon_watchdog.mjs DAEMONS) up, a fresh watchman_last.json, and clause 11 from a git repo made
//     with core.autocrlf=false at init, one commit pushed to a BARE origin under the same temp root (0 unpushed). The
//     commit's sha is what the build stamps as the row's code_sha.
//   · No port, no network, no model, no service; every child is spawnSync (it ends before this returns); the temp root is
//     removed before return. CRLF-proof: every line read from a child or a file is split on \r?\n.
//   · ONE PLANTED INSTANT (unit mclk, forks row 1214 (3)): the clock is read ONCE (`now`, or the `now` a caller hands in).
//     The planted day D is the IST date of that read; the planted instant T is that read, moved forward to D 00:06 IST when
//     it falls earlier (so every row's stamp, T minus one to five minutes, lies INSIDE D whatever the clock reads — before
//     row 1214 the rows were stamped from the raw read, and a read at 00:02 IST put them on D minus one). T is HANDED to the
//     meter child, never re-read by it: THE DOOR is a one-line Date preload written into the temp root (`mclk_clock.mjs`,
//     the instant a literal in it) and appended to the child's NODE_OPTIONS as `--import=<its file URL>` — the meter reads
//     the clock only through `new Date()` / `Date.now()` (scripts/daily_green.mjs witness() and state.mjs's facts), so a
//     Date preload in that one child is the narrowest door; no organ is edited and no env var is read by any organ.
// EXPORT: plantDay({ org, want, now }) → { want, n, exit, line, rows, day, at } (rows = the planted ledger's rows after the
//   run; day = D; at = T as ISO).
// ============================================================================
import { readFileSync, cpSync, mkdirSync, mkdtempSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const TMP_PREFIX = "mmeter-wit-";
const jl = (rows) => rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
const lines = (t) => String(t || "").split(/\r?\n/).filter((l) => l.trim());

function git(cwd, args) {
  const r = spawnSync("git", ["-c", "core.autocrlf=false", "-c", "user.name=mmeter-plant", "-c", "user.email=plant@invalid",
    "-c", "commit.gpgsign=false", "-c", "core.hooksPath=", ...args], { cwd, encoding: "utf8", windowsHide: true });
  if (r.status !== 0) throw new Error(`git ${args[0]} failed: ${lines(r.stderr).pop() || r.status}`);
  return String(r.stdout || "").trim();
}

/** Plant one day on a copy of <org> and run its real meter CLI. */
/** THE PLANTED INSTANT (row 1214 (3)): the day of ONE read and an instant inside it late enough that T minus five
 *  minutes is still that day. @param {Date} now @returns {{ day: string, T: number }} */
export function plantedInstant(now = new Date()) {
  const day = new Date(now.getTime() + 330 * 60000).toISOString().slice(0, 10);
  const T = Math.max(now.getTime(), Date.parse(`${day}T00:06:00+05:30`));
  return { day, T };
}
/** THE DOOR: a Date preload pinned at T, appended to the child's NODE_OPTIONS (the instant handed, never re-read). */
function clockDoor(root, T) {
  const f = join(root, "mclk_clock.mjs");
  writeFileSync(f, `const R = globalThis.Date, T = ${T};\nfunction D(...a) { if (!new.target) return new R(T).toString(); return a.length ? new R(...a) : new R(T); }\n` +
    `D.prototype = R.prototype; D.now = () => T; D.parse = R.parse; D.UTC = R.UTC;\nglobalThis.Date = D;\n`);
  return `${process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : ""}--import=${pathToFileURL(f).href}`;
}

export async function plantDay({ org = REPO, want = 5, now = new Date() } = {}) {
  const root = mkdtempSync(join(tmpdir(), TMP_PREFIX + "day-"));
  try {
    cpSync(join(org, "scripts"), join(root, "scripts"), { recursive: true });
    cpSync(join(org, "package.json"), join(root, "package.json"));
    const st = join(root, "dressing-room", "state");
    const { day, T } = plantedInstant(now);
    const at = (m = 1) => new Date(T - m * 60000).toISOString();
    const reg = JSON.parse(readFileSync(join(org, "dressing-room", "state", "registry.json"), "utf8"));
    (reg.tables.emit_contract = reg.tables.emit_contract || []).push({ subject: "note_blocks", writes_to: "note_blocks.jsonl" });
    const files = {
      "sitting.json": JSON.stringify({ id: "s1", task: "t", route: "FORGE", opened_at: at(5), closed_at: at(1) }),
      "sitting_reviews.jsonl": "",
      "reps_log.jsonl": jl([{ ts: at(3), concept: "planted", correct: true }]),
      "forge_session.json": JSON.stringify({ concept: "planted", resume_pointer: { text: "q", step: 3, at: at(3) } }),
      "registry.json": JSON.stringify(reg),
      "note_blocks.jsonl": jl([{ ts: at(3), axis: "a" }]),
      "compiled_notes.jsonl": jl([{ ts: at(3), day, axis: "a" }]),
      "gaffer_grade_queue.jsonl": jl([{ v: 2, kind: "settled", of: "x", ts: at(3), day }]),
      "captains_call.json": JSON.stringify({ cards: [{ id: "c1", dealt: [at(4)] }] }),
    };
    if (Number(want) === 11) Object.assign(files, {
      "rejirah_log.jsonl": "",
      "readiness.json": JSON.stringify({ ok: true, day }),
      [`post_match/${day}.md`]: `POST-MATCH · ${day}\n\nRESULT: HIT.\n\nKAL-LINE → start with axis b\n`,
      "watchman_last.json": JSON.stringify({ at: at(2), findings: [] }),
    });
    for (const [k, v] of Object.entries(files)) { mkdirSync(dirname(join(st, k)), { recursive: true }); writeFileSync(join(st, k), v); }
    if (Number(want) === 11) {
      // the roster is the org's own, imported from the COPY only after its registry is planted (gate.mjs reads it at import)
      const { DAEMONS } = await import(pathToFileURL(join(root, "scripts", "daemon_watchdog.mjs")).href);
      writeFileSync(join(st, "daemon_watchdog.json"), JSON.stringify({ at: at(2), ports: Object.fromEntries(DAEMONS.map((d) => [d.name, true])), unknown: [] }));
      mkdirSync(join(st, "capsules"), { recursive: true });
      const origin = join(root, "origin.git");
      git(root, ["init", "-q", "--bare", origin]);
      git(root, ["init", "-q"]);
      writeFileSync(join(root, "PLANTED.txt"), "planted\n");
      git(root, ["add", "PLANTED.txt"]);
      git(root, ["commit", "-q", "-m", "planted"]);
      git(root, ["remote", "add", "origin", origin]);
      git(root, ["push", "-q", "-u", "origin", "HEAD:refs/heads/planted"]);
      git(root, ["branch", "-q", "--set-upstream-to=origin/planted"]);
    }
    const r = spawnSync(process.execPath, [join(root, "scripts", "daily_green.mjs")], { cwd: root, encoding: "utf8", windowsHide: true, env: { ...process.env, ARSENAL_ORGAN: "1", NODE_OPTIONS: clockDoor(root, T) } });
    const last = lines(r.stdout).pop() || lines(r.stderr).pop() || "";
    const n = (/· (\d+)\/11 ·/.exec(last) || [])[1];
    const lp = join(st, "daily_green.jsonl");
    const rows = existsSync(lp) ? lines(readFileSync(lp, "utf8")).map((l) => { try { return JSON.parse(l); } catch { return null; } }) : [];
    return { want: Number(want), n: n === undefined ? null : Number(n), exit: r.status, line: last, rows, day, at: new Date(T).toISOString() };
  } finally { rmSync(root, { recursive: true, force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2);
  const oi = a.indexOf("--org");
  const want = a.find((x) => /^\d+$/.test(x)) || "5";
  const p = await plantDay({ org: oi >= 0 ? resolve(a[oi + 1]) : REPO, want });
  console.log(`PLANT want ${p.want}/11 · got ${p.n ?? "?"}/11 · meter exit ${p.exit} · line: ${String(p.line).slice(0, 400)}`);
}
