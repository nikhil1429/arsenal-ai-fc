#!/usr/bin/env node
// ============================================================================
// night.mjs · ARSENAL AI FC — THE NIGHT FACTORY (unit mfac)
// ----------------------------------------------------------------------------
// HIS WORD 240 (verbatim except the quote marks): i will not remember anything what to type when to type where to type.
// HIS WORD 243: keep working with runner continuously, do not sit idle at any moment please. plan things accordingly.
// HIS WORD 248: Haan, build karo (the night factory) · Sirf laptop pe (the night log stays out of git).
// WHAT IT IS. The day end of unit mday (`day.mjs end`) ARMS a night through this CLI; the runner session, already alive by
//   word 243, holds on `wait` (a shell process the harness watches — zero tokens) and wakes when the arm lands; every act
//   of the night is a row here; the next learn start (`day.mjs start`) CLOSES the night and prints exactly ONE line.
// SOLE WRITER of dressing-room/state/night_log.jsonl (append only, one row per event). Rows carry a day, a kind, a unit id,
//   a reason word, a count — never his words, never a person name, never the content of another state file.
// IT NEVER: calls a model, spawns a session, starts a process that outlives it, creates a scheduled task, moves a ref of
//   the repository, or calls the landing verb. The furthest a night marks a unit is LAND-READY (ruling ADDED (ii)).
//   The one other organ it reaches is captains_call.mjs, through its own `file --key` door (ONE card, keyed by night).
// RULINGS (row 1069), each a code path below:
//   F1 A  only the day end arms a night            → arm refuses any --by but day.end
//   F2 A  no spawn: a dead runner = never begun     → the line says "never begun" when no begun row exists
//   F3 A  launches stop when the pool reading ages  → the runner's gate says so: `stop --reason pool` (the pool lives in the
//         campaign; this organ names no campaign path, F7 A)
//   F4 A  the memory line is a config key here      → NIGHT_CONFIG.memory_floor_mb, RULED 1536 (row 1103); a non-number: `may` answers
//         NO "floor unset" (the 1.5 GB line of row 477 (5) replaced the blind-rail source, which is empty on his laptop)
//   F5 A  one red stops the night                   → mark --kind red appends a stopped row; every later may says NO
//   F6 A  a fork outside class stops that thread    → mark --kind fork stops nothing; it waits for the architect on the card
//   F7 A  the campaign calls this by CLI            → no campaign path, no campaign file read
//   F9 A  the learn start closes and never waits    → close --by learn-start; nothing here blocks on the runner
//   ADDED (ii) no landing at night                  → may --act land is always NO; mark --kind landed is refused
// CLI:
//   arm    --day <YYYY-MM-DD> --by day.end          (day.mjs end, and only it)
//   wait   [--since <iso>] [--once]                 (the runner's hold; exit 0 when an armed, unbegun night exists)
//   begin  --runner <role>                          (the runner, on waking)
//   mark   --kind launch|return|land-ready|fork|red --unit <id> [--note <word>]
//   stop   --reason pool|memory|red|fork|context|his-word|learn-start|done [--note <word>]
//   may    --act launch|land                        (ONE line: GO exit 0 · NO <reason> exit 1)
//   close  --by learn-start                         (day.mjs start, and only it; prints the ONE line)
//   line                                            (read-only: the ONE morning line, silent when no night was armed)
//   selftest
// ============================================================================
import { readFileSync, appendFileSync, mkdirSync, mkdtempSync, rmSync, watch } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { freemem, tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SEAM = process.env.ARSENAL_NIGHT_STATE_DIR || null;   // the selftest's and the witness's door, NOTHING else's
const STATE_DIR = SEAM || join(ROOT, "dressing-room", "state");
const SITTING_DIR = process.env.ARSENAL_SITTING_STATE_DIR || STATE_DIR;   // the sitting owner's own dir rule (read only)
export const LOG_NAME = "night_log.jsonl";

// ── F4 A — THE MEMORY LINE, RULED 1536 MB by forks row 1103 (2): the standing 1.5 GB line of row 477 (5) — under it nothing
// parallel starts on his laptop. It replaces the blind-rail source the F4 A text named, which is EMPTY on his laptop (row 1103).
// A floor that is not a positive number still REFUSES: `may` answers NO "floor unset" (FLOOR_UNSET stays the named non-value).
export const FLOOR_UNSET = "FLOOR_UNSET";
export const NIGHT_CONFIG = Object.freeze({ memory_floor_mb: 1536 });   // forks row 1103 · the 1.5 GB line of row 477 (5)

export const KINDS = Object.freeze(["launch", "return", "land-ready", "fork", "red"]);
export const REASONS = Object.freeze(["pool", "memory", "red", "fork", "context", "his-word", "learn-start", "done"]);
const ACTS = Object.freeze(["launch", "land"]);
const TOKEN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;   // a unit id, a role, a reason word — never prose
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const tok = (v) => (typeof v === "string" && TOKEN.test(v) ? v.slice(0, 64) : null);

const readRows = (p) => { try { return readFileSync(p, "utf8").split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; } };
const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };

/** the night now in force: the LAST armed row whose day has no closed row. PURE over rows. */
export function nightOf(rows) {
  const armed = rows.filter((r) => r.kind === "armed");
  const last = armed.at(-1);
  if (!last) return null;
  const mine = rows.filter((r) => r.day === last.day);
  const closed = mine.some((r) => r.kind === "closed");
  const begun = mine.find((r) => r.kind === "begun") || null;
  const stopped = mine.find((r) => r.kind === "stopped") || null;
  const marks = mine.filter((r) => r.kind === "mark");
  const count = (k) => marks.filter((m) => m.mark === k).length;
  return { day: last.day, armed_at: last.ts, closed, begun, stopped, marks,
    launched: count("launch"), returned: count("return"), land_ready: count("land-ready"), forks: count("fork"), reds: count("red") };
}

/** THE ONE LINE. PURE. Counts only — no unit names, none of his words. */
export function lineOf(n) {
  if (!n) return null;
  const waiting = n.land_ready + n.forks;
  const state = n.stopped ? `stopped: ${n.stopped.reason}` : n.closed ? "stopped: none" : "running";
  return `NIGHT ${n.day}: ${n.begun ? "begun" : "never begun"} · ${n.launched} launched · ${n.returned} returned · ${n.land_ready} land-ready (no landing at night) · ${waiting} waiting for you · ${state}`;
}

/** the organ, bound to one state dir; every door injectable so the selftest never reaches a live file */
export function organ({ dir = STATE_DIR, sittingDir = SITTING_DIR, now = () => new Date(), freeMb = () => Math.floor(freemem() / 1048576),
  floor = NIGHT_CONFIG.memory_floor_mb, fileCard = defaultFileCard } = {}) {
  const LOG = join(dir, LOG_NAME);
  const rows = () => readRows(LOG);
  const append = (row) => { mkdirSync(dir, { recursive: true }); appendFileSync(LOG, JSON.stringify({ ts: now().toISOString(), ...row }) + "\n"); };
  const sittingOpen = () => { const s = readJson(join(sittingDir, "sitting.json")); return !!(s && s.id && !s.closed_at); };
  const live = () => { const n = nightOf(rows()); return n && !n.closed ? n : null; };

  function arm({ day, by }) {
    if (by !== "day.end") return { code: 1, out: `night: arm REFUSED — only the day end arms a night (ruling F1 A); --by ${by || "(none)"}` };
    if (!DAY.test(String(day || ""))) return { code: 1, out: "night: arm REFUSED — --day YYYY-MM-DD" };
    if (rows().some((r) => r.kind === "armed" && r.day === day)) return { code: 0, out: `night: already armed ${day} · nothing new` };
    append({ day, kind: "armed", by });
    return { code: 0, out: `night: ARMED ${day} · the runner's wait wakes on it` };
  }
  /** an armed night that no runner has begun, armed after `since` */
  function waiting(since = null) {
    const n = live();
    if (!n || n.begun || n.stopped) return null;
    if (since && !(Date.parse(n.armed_at) > Date.parse(since))) return null;
    return n;
  }
  function begin({ runner }) {
    const who = tok(runner);
    if (!who) return { code: 1, out: "night: begin REFUSED — --runner <role> (a token, never a name)" };
    const n = live();
    if (!n) return { code: 1, out: "night: begin REFUSED — no armed night" };
    if (n.stopped) return { code: 1, out: `night: begin REFUSED — the night of ${n.day} is stopped (${n.stopped.reason})` };
    if (n.begun) return { code: 0, out: `night: already begun ${n.day} · nothing new` };
    append({ day: n.day, kind: "begun", runner: who });
    return { code: 0, out: `night: BEGUN ${n.day}` };
  }
  function stop({ reason, note = null }) {
    if (!REASONS.includes(reason)) return { code: 1, out: `night: stop REFUSED — --reason ${REASONS.join("|")}` };
    const n = live();
    if (!n) return { code: 1, out: "night: stop — no armed night" };
    if (n.stopped) return { code: 0, out: `night: already stopped ${n.day} (${n.stopped.reason}) · nothing new` };
    append({ day: n.day, kind: "stopped", reason, ...(tok(note) ? { note: tok(note) } : {}) });
    return { code: 0, out: `night: STOPPED ${n.day} · ${reason}` };
  }
  function mark({ kind, unit, note = null }) {
    if (kind === "landed") return { code: 1, out: "night: mark REFUSED — no landing at night; land-ready is the ceiling (ruling ADDED (ii))" };
    if (!KINDS.includes(kind)) return { code: 1, out: `night: mark REFUSED — --kind ${KINDS.join("|")}` };
    const u = tok(unit);
    if (!u) return { code: 1, out: "night: mark REFUSED — --unit <id> (a token)" };
    const n = live();
    if (!n || !n.begun) return { code: 1, out: "night: mark REFUSED — no begun night" };
    append({ day: n.day, kind: "mark", mark: kind, unit: u, ...(tok(note) ? { note: tok(note) } : {}) });
    if (kind === "red" && !n.stopped) append({ day: n.day, kind: "stopped", reason: "red", unit: u });   // F5 A: one red stops the night
    return { code: 0, out: `night: MARK ${kind} ${u}${kind === "red" ? " · the night stops (F5 A)" : kind === "fork" ? " · that thread waits for the architect; the night goes on (F6 A)" : ""}` };
  }
  function may({ act }) {
    if (!ACTS.includes(act)) return { code: 1, out: `NO usage · --act ${ACTS.join("|")}` };
    if (act === "land") return { code: 1, out: "NO land-attended · no landing at night: land-ready is the ceiling until a row grants unattended landing (ruling ADDED (ii))" };
    if (typeof floor !== "number" || !Number.isFinite(floor) || floor <= 0) return { code: 1, out: "NO floor-unset · NIGHT_CONFIG.memory_floor_mb is not a positive number of MB (ruled 1536 by forks row 1103, the 1.5 GB line of row 477 (5))" };
    const n = live();
    if (!n) return { code: 1, out: "NO not-armed · no night is armed (only the day end arms one)" };
    if (n.stopped) return { code: 1, out: `NO stopped:${n.stopped.reason}` };
    if (n.reds) return { code: 1, out: "NO red" };
    if (!n.begun) return { code: 1, out: "NO not-begun · the runner begins the night first" };
    if (sittingOpen()) return { code: 1, out: "NO sitting-open · his study is on" };
    const free = freeMb();
    if (!(free >= floor)) { append({ day: n.day, kind: "stopped", reason: "memory" }); return { code: 1, out: "NO memory · free memory under the line; the night stops" }; }
    return { code: 0, out: `GO launch · night ${n.day}` };
  }
  function close({ by }) {
    if (by !== "learn-start") return { code: 1, out: `night: close REFUSED — only the learn start closes a night (ruling F9 A); --by ${by || "(none)"}` };
    let n = live();
    if (!n) return { code: 0, out: "" };   // nothing armed and open: silent
    if (n.begun && !n.stopped) append({ day: n.day, kind: "stopped", reason: "learn-start" });
    n = nightOf(rows());
    const waitingFor = n.land_ready + n.forks;
    let card = "none";
    if (waitingFor > 0) card = fileCard({ key: `night:${n.day}`, line: `NIGHT ${n.day}: ${n.land_ready} land-ready landing(s) + ${n.forks} fork(s) wait for your word`.slice(0, 140) }) ? "filed" : "not-filed";
    append({ day: n.day, kind: "closed", by, card });
    return { code: 0, out: lineOf(nightOf(rows())) };
  }
  const line = () => { const n = nightOf(rows()); return { code: 0, out: lineOf(n) || "" }; };
  return { arm, waiting, begin, stop, mark, may, close, line, LOG };
}

/** ONE card, through its owner's own CLI and its keyed door (idempotent by key) */
function defaultFileCard({ key, line }) {
  const why = "a landing to main moves only on his word (no unattended landing is granted at night) and a fork outside the runner's class is the architect's";
  const r = spawnSync(process.execPath, [join(HERE, "captains_call.mjs"), "file", "--key", key, "--line", line, "--why-code-cannot-decide", why], { cwd: ROOT, encoding: "utf8", windowsHide: true });
  return r.status === 0;
}

/** the hold: resolves when an armed, unbegun night exists. Event-driven (fs.watch on the dir) — no poll interval typed. */
export function waitFor(o, { since = null, dir = STATE_DIR } = {}) {
  return new Promise((res) => {
    const hit = () => o.waiting(since);
    const first = hit();
    if (first) return res(first);
    mkdirSync(dir, { recursive: true });
    const w = watch(dir, () => { const n = hit(); if (n) { w.close(); res(n); } });
  });
}

// ── SELFTEST — every plant under os.tmpdir(), every door injected; nothing live is read or written ──────────────────────
async function selftest() {
  const tmp = mkdtempSync(join(tmpdir(), "night-st-"));
  let pass = 0, fail = 0;
  const ok = (name, cond) => { if (cond) pass++; else fail++; console.log(`  ${cond ? "ok  " : "FAIL"} ${name}`); };
  try {
    const sdir = join(tmp, "sit"); mkdirSync(sdir, { recursive: true });
    const cards = [];
    const F = Math.floor(freemem() / 1048576);   // the plant's line IS this box's measured free memory; never a typed number
    let mem = 0;
    const mk = (extra = {}) => organ({ dir: join(tmp, "st"), sittingDir: sdir, floor: F, freeMb: () => mem, fileCard: (c) => { if (!cards.some((x) => x.key === c.key)) cards.push(c); return true; }, ...extra });
    const o = mk();
    const floorNo = (f) => /^NO floor-unset/.test(organ({ dir: join(tmp, "x"), sittingDir: sdir, floor: f }).may({ act: "launch" }).out);
    ok("a non-number floor refuses (F4 A, row 1103) — FLOOR_UNSET and a string give NO floor-unset; a numeric floor passes that check",
      floorNo(FLOOR_UNSET) && floorNo("1536") && !floorNo(NIGHT_CONFIG.memory_floor_mb) && typeof NIGHT_CONFIG.memory_floor_mb === "number");
    ok("arm refuses any hand but the day end (F1 A)", o.arm({ day: "2026-11-18", by: "evening" }).code === 1 && !o.waiting());
    ok("may before any arm → NO not-armed", /^NO not-armed/.test(o.may({ act: "launch" }).out));
    ok("arm → one armed row; a second arm writes nothing", o.arm({ day: "2026-11-18", by: "day.end" }).code === 0 && /already/.test(o.arm({ day: "2026-11-18", by: "day.end" }).out) && readRows(o.LOG).filter((r) => r.kind === "armed").length === 1);
    ok("an armed, unbegun night is what the wait wakes on", !!o.waiting() && !o.waiting(new Date(Date.now() + 864e5).toISOString()));
    ok("may before begin → NO not-begun", /^NO not-begun/.test(o.may({ act: "launch" }).out));
    ok("begin refuses a non-token runner", o.begin({ runner: "two words" }).code === 1);
    ok("begin → the wait no longer wakes", o.begin({ runner: "runner" }).code === 0 && !o.waiting());
    mem = F;
    ok("armed ∧ begun ∧ no sitting ∧ memory at the line → GO", o.may({ act: "launch" }).code === 0);
    ok("may --act land is always NO (ADDED (ii))", /^NO land-attended/.test(o.may({ act: "land" }).out));
    ok("mark --kind landed is refused (ADDED (ii))", o.mark({ kind: "landed", unit: "u1" }).code === 1);
    o.mark({ kind: "launch", unit: "u1" }); o.mark({ kind: "return", unit: "u1" }); o.mark({ kind: "land-ready", unit: "u1" });
    o.mark({ kind: "fork", unit: "u2" });
    ok("a fork stops that thread only — may still GO (F6 A)", o.may({ act: "launch" }).code === 0);
    writeSitting(sdir, { id: "s1", opened_at: new Date().toISOString() });
    ok("a sitting open → NO sitting-open", /^NO sitting-open/.test(o.may({ act: "launch" }).out));
    writeSitting(sdir, { id: "s1", closed_at: new Date().toISOString() });
    mem = 0;
    ok("memory under the line → NO memory, and a stopped row (reason memory)", /^NO memory/.test(o.may({ act: "launch" }).out) && nightOf(readRows(o.LOG)).stopped.reason === "memory");
    mem = F;
    ok("after a stop, may stays NO", /^NO stopped:memory/.test(o.may({ act: "launch" }).out));
    const c = o.close({ by: "learn-start" });
    ok("close prints ONE NIGHT line with the counts", /^NIGHT 2026-11-18: begun · 1 launched · 1 returned · 1 land-ready \(no landing at night\) · 2 waiting for you · stopped: memory$/.test(c.out) && c.out.split(/\r?\n/).length === 1);
    ok("close files ONE keyed card; a second close is silent and files none", cards.length === 1 && cards[0].key === "night:2026-11-18" && o.close({ by: "learn-start" }).out === "" && cards.length === 1);
    ok("close refuses any hand but the learn start (F9 A)", o.close({ by: "evening" }).code === 1);
    const o2 = mk({ dir: join(tmp, "st2") });
    o2.arm({ day: "2026-11-19", by: "day.end" }); o2.begin({ runner: "runner" }); o2.mark({ kind: "red", unit: "u3" });
    ok("one red stops the night (F5 A)", /^NO stopped:red/.test(o2.may({ act: "launch" }).out));
    const o3 = mk({ dir: join(tmp, "st3") });
    o3.arm({ day: "2026-11-20", by: "day.end" });
    const before = cards.length;
    ok("a night never begun → 'never begun', no card when nothing waits (F2 A)", /^NIGHT 2026-11-20: never begun · 0 launched/.test(o3.close({ by: "learn-start" }).out) && cards.length === before);
    ok("no armed night → the line is silent", mk({ dir: join(tmp, "st4") }).line().out === "");
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
    ok("static: no model, no spawned session, no scheduled task, no ref moved", !/spawn\w*\(\s*["']claude|models\.mjs["']|schtasks|["']push["']|["']--force|["']merge["']/.test(src.slice(0, src.indexOf("async function selftest("))));
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  console.log(`night selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}
function writeSitting(dir, obj) { mkdirSync(dir, { recursive: true }); rmSync(join(dir, "sitting.json"), { force: true }); appendFileSync(join(dir, "sitting.json"), JSON.stringify(obj)); }

async function main() {
  const [mode, ...rest] = process.argv.slice(2);
  const opt = (k) => { const i = rest.indexOf(k); return i >= 0 && rest[i + 1] !== undefined && !String(rest[i + 1]).startsWith("--") ? rest[i + 1] : null; };
  const seamMem = SEAM && process.env.ARSENAL_NIGHT_FREEMEM_MB !== undefined ? Number(process.env.ARSENAL_NIGHT_FREEMEM_MB) : null;   // the witness's free-memory plant, only behind the state seam
  const o = organ(seamMem === null ? {} : { freeMb: () => seamMem });
  const say = (r) => { if (r.out) console.log(r.out); process.exitCode = r.code; };
  switch (mode) {
    case "arm": return say(o.arm({ day: opt("--day"), by: opt("--by") }));
    case "begin": return say(o.begin({ runner: opt("--runner") }));
    case "mark": return say(o.mark({ kind: opt("--kind"), unit: opt("--unit"), note: opt("--note") }));
    case "stop": return say(o.stop({ reason: opt("--reason"), note: opt("--note") }));
    case "may": return say(o.may({ act: opt("--act") }));
    case "close": return say(o.close({ by: opt("--by") }));
    case "line": return say(o.line());
    case "wait": {
      if (rest.includes("--once")) { const n = o.waiting(opt("--since")); console.log(n ? `night: ARMED ${n.day} · begin it` : "night: nothing armed"); process.exitCode = n ? 0 : 1; return; }
      const n = await waitFor(o, { since: opt("--since") });
      console.log(`night: ARMED ${n.day} · begin it`); process.exit(0);
    }
    case "selftest": { const g = await selftest(); process.exitCode = g ? 0 : 1; return; }
    default:
      console.log("night: arm --day D --by day.end | wait [--since iso] [--once] | begin --runner r | mark --kind k --unit u | stop --reason r | may --act launch|land | close --by learn-start | line | selftest");
      process.exitCode = mode ? 2 : 0;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
