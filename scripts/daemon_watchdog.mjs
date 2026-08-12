#!/usr/bin/env node
// ============================================================================
// daemon_watchdog.mjs · ARSENAL AI FC — THE DAEMON WATCHDOG (LADDER D2, 9 Aug 2026)
// ----------------------------------------------------------------------------
// WHY: the resident daemons carry the organism's nervous system — turnstile
//   (:4111), cortex (:4112), thalamus (:4113), the brain pacemaker (:4116), and
//   since 10 Aug 2026 the ambient context bridge (no port — see DAEMONS) —
//   and until this file, a daemon that died mid-day stayed dead until the NEXT
//   morning conductor (09:15) or a matchday boot. Every afferent in between
//   fell on the floor. This watchdog runs every 10 minutes: probe → relaunch
//   DOWN daemons through the same VBS cloak the conductor uses (a visible
//   console begs to be closed — the 0xC000013A scar) → and, one pass AFTER the
//   thalamus answers again, dispatch the two resyncs that re-deliver what the
//   outage dropped (mcp-memory resync · harvest resync). The delay is the
//   point: a daemon that just booted needs its boot, not a burst of retries.
//
// THE DUGOUT (:4114) IS DELIBERATELY EXCLUDED. It is HIS interactive voice
//   surface — it opens when he opens it, dies when he closes it, and a watchdog
//   relaunching it headless every 10 minutes would be the machine overriding
//   his own hands. Its lanes already run headless via ArsenalFC-DugoutReminders
//   and ArsenalFC-ShadowDetect (fixed in LADDER A2).
//
// LAWS: sole writer of daemon_watchdog.json · never kills anything (relaunch
//   only — EADDRINUSE singletons make a double-start harmless) · resync is
//   dispatched at most once per recovery · every decision is recorded ·
//   every ACTION is reported off its OUTCOME, never off the decision that asked
//   for it (11 Aug 2026 — see THE DISPATCH IS NOT THE OUTCOME below) ·
//   conductor.json is READ-ONLY here and the only cross-organ write is through
//   an owner's own CLI (captains_call.mjs file), never into its file.
// MODES: pass (default) · status · selftest
// ============================================================================

import { readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { portOpen, launchDetached, processStartMs, processStartRead, clipStderr } from "./conductor.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..");
// READ-ONLY. The manual restart verb — the same file watchman.mjs:750 points him at.
// The selftest reads it to prove the table below still matches the real logon lane.
const DAEMONS_VBS = join(REPO, "setup", "START_DAEMONS.vbs");
const STATE_DIR = process.env.ARSENAL_WATCHDOG_STATE_DIR || join(__dirname, "..", "dressing-room", "state");
const STATE = () => join(STATE_DIR, "daemon_watchdog.json");
// The morning chain's own receipt. Read-only from here — conductor.mjs owns it.
const MORNING_REPORT = () => join(STATE_DIR, "conductor.json");

const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const localDayOf = (ts) => { const d = new Date(String(ts || "")); return Number.isFinite(d.getTime()) ? localDate(d) : null; };

// The residents. args = exactly what their installers/conductor launch.
//
// THE 5th RESIDENT WAS MISSING (10 Aug 2026, wire repair). Since D7 (9 Aug) the
// ambient context bridge runs as a logon daemon — it is the LAST line of
// ArsenalFC-Brain.bat and of setup/START_DAEMONS.vbs — and it appeared in no
// liveness table anywhere: not this one, not watchman.mjs's DAEMON_PORTS, not
// conductor.mjs's three `daemon:` steps. Live proof the day it was found: ONE
// `node scripts\context.mjs daemon` in the process table (PID 21308, booted
// 09-08-2026 13:08:39) — running, unprobed, and unrelaunchable if it ever stopped.
// It could have been dark for weeks and nothing in the organism would have said so.
//
// WHY IT NEEDS A DIFFERENT PROBE: the other four hold a localhost port, so "is it
// up" is a TCP connect. The bridge is a POLL, not a server — it holds no port (no
// createServer/listen anywhere in context.mjs). So `match` marks it, and liveness
// comes from the process table via conductor.mjs's own processStartMs(), the same
// exported probe this file already uses for the STALE-BUILD read below. `match` is
// the FULL command tail, never the bare filename, so a `context.mjs once|status`
// invocation can never be mistaken for the resident.
export const DAEMONS = [
  { name: "turnstile", port: 4111, args: ["scripts/turnstile.mjs"] },
  { name: "cortex",    port: 4112, args: ["scripts/cortex.mjs"] },
  { name: "thalamus",  port: 4113, args: ["scripts/thalamus.mjs"] },
  { name: "brain",     port: 4116, args: ["scripts/brain.mjs", "daemon"] },   // :4115 is the tick LOCK; :4116 is the daemon singleton
  { name: "context",   port: null, match: "context.mjs daemon", args: ["scripts/context.mjs", "daemon"] },
];

const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
// The shared append lane — READ-ONLY here, and it is the only file this organ opens
// that it does not own (brain.mjs owns its schema; six organs append to it).
const LEDGER = () => join(STATE_DIR, "brain_ledger.jsonl");
const readText = (p) => { try { return readFileSync(p, "utf8"); } catch { return null; } };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(obj, null, 2));
  renameSync(tmp, path);
}

// Liveness for a PORTLESS resident (the context bridge). null means UNKNOWN and
// never "down": off Windows there is no Win32_Process to read at all, so "I could
// not look" is the only honest answer — reporting that as DOWN would relaunch a
// bridge that is very much alive.
//
// PROBE HONESTY (WIRING AUDIT, 11 Aug 2026) — THE LINE ABOVE WAS RIGHT, THE CODE WAS NOT.
// This comment used to continue: "On Windows a null from the probe IS a real
// not-in-the-table reading, and the confirm rule in decidePass covers the rare case
// where the powershell call itself failed." Both halves were false, and MEASURED false
// on his box the hour this was written:
//   · processStartMs collapsed "the shell was killed before it could answer" into the
//     same bare null as "I read the table and it is not there". Get-CimInstance
//     Win32_Process costs 3.4-8.9s on this laptop against that probe's 5000ms cap, so
//     2 of 5 consecutive live calls for PID 21308 — a bridge that was up and emitting —
//     came back null (spawnSync: error ETIMEDOUT, signal SIGTERM). Not rare. ~a third.
//   · the confirm rule cannot cover it, because it only demands the PREVIOUS pass also
//     read `false`, and a one-in-three flake clears two passes in a row within the hour.
// The state file proved it was already armed: daemon_watchdog.json held
// `ports.context: false` with `unknown: []` while PID 21308 was alive in the process
// table — one more timed-out probe and decidePass would have launched a SECOND portless
// bridge, and two of them both POST the thalamus door. That double-ingest is the exact
// damage the portless entry exists to prevent.
// The repair invents nothing: conductor.mjs's processStartRead now reports `looked`, so
// a probe that could not run returns the UNKNOWN this function already had a lane for —
// and decidePass already refuses to relaunch off a reading it could not take. A
// genuinely dark bridge is still caught on any pass where the probe completes (~2 in 3),
// so the cost is a delay, never a bridge left dark.
// TRAP, hit while proving this live: the probe greps the command line of EVERY
// node.exe, so a process that merely MENTIONS the match string reports itself as the
// daemon (a `node -e "…context.mjs daemon…"` probe returned UP for a lane that does
// not exist). The scheduled caller is `node scripts\daemon_watchdog.mjs pass`, which
// contains no such string — but never pass this a substring loose enough to catch a
// bystander, and verify a DOWN reading from a command line that does not name it.
export function processProbe(match, deps = {}) {
  const platform = deps.platform || process.platform;
  if (platform !== "win32") return null;
  try {
    // `procStart` stays the injection every existing check here uses: a plain ms|null,
    // which by definition HAS looked (a fixture cannot time out). `procRead` is the
    // richer door, and the live path takes it.
    const read = deps.procRead
      || (deps.procStart ? (m) => ({ ms: deps.procStart(m), looked: true }) : processStartRead);
    const r = read(match);
    if (!r || r.looked === false) return null;   // could not look → UNKNOWN, never DOWN
    return r.ms != null;
  } catch { return false; }
}

// ── PURE CORE — one pass, fully injected ────────────────────────────────────
// prev = last pass's state ({ports: {name: bool}, unknown: [name], thalamus_down_since,
// resync_pending}). Returns { state, actions } — the CLI layer performs the actions.
export function decidePass(prev, probes, nowIso) {
  const p = prev || { ports: {}, unknown: [], thalamus_down_since: null, resync_pending: false, resyncs: [], launched: [] };
  const actions = { launch: [], resync: false, stuck: [] };
  const ports = {};
  const unknown = [];
  for (const d of DAEMONS) {
    const seen = probes[d.name];
    ports[d.name] = seen === true;
    if (seen === true) continue;
    if (seen == null) { unknown.push(d.name); continue; }   // an unread probe is not a verdict
    // A PORT-LOCKED daemon is relaunched the moment it stops answering: its own
    // EADDRINUSE lock makes a double start harmless — this file's stated law.
    if (d.port != null) { actions.launch.push(d.name); continue; }
    // A PORTLESS one has NO such guard. Two context bridges would both POST the
    // thalamus door, which is the very damage this entry exists to prevent, so it
    // takes this file's OWN next-pass shape (the resync rule below — no new number
    // invented): relaunch only when the PREVIOUS pass also read it genuinely down,
    // never off a single reading, and never off a reading we could not take.
    if (p.ports && p.ports[d.name] === false && !(p.unknown || []).includes(d.name)) actions.launch.push(d.name);
  }
  // ── THE DISPATCH IS NOT THE OUTCOME (11 Aug 2026, wire repair) ─────────────
  // The launch loop below used to read `try { launchDetached(d.args); } catch { }`
  // — a failure swallowed whole, no record, no rethrow — while the operator line
  // printed `relaunched: <names>` off THIS decision, so scripts/daemon_watchdog.log
  // asserted an action that may never have happened, every 10 minutes, forever.
  //
  // AND A THROW WAS NEVER THE WHOLE STORY: launchDetached spawns DETACHED with
  // stdio ignored (conductor.mjs:405) and returns immediately. It cannot know
  // whether the daemon came up; a clean call proves only that a call was made.
  // So the honest report has two layers, and this is the second: the PROOF of a
  // relaunch is the NEXT pass's probe. A daemon this file dispatched last pass
  // that is genuinely DOWN again now did not come back — that is a fact, not a
  // guess, and it is where the machine's arm ends (a stuck daemon needs a human
  // hand on setup/START_DAEMONS.vbs, which is the same lane watchman.mjs points
  // him at). No new number is invented: the window is one pass, the file's own
  // next-pass shape, already used by the resync rule and the portless confirm.
  const attempted = (p.launched || []).map((x) => x && x.name).filter(Boolean);
  for (const name of attempted) {
    if (ports[name] === true) continue;                      // it came back — nothing to say
    if (unknown.includes(name)) continue;                    // a probe we could not take is never a verdict
    actions.stuck.push(name);
  }
  // ── THE OUTAGE LEDGER (11 Aug 2026, ORPHAN_FIELD repair) ──────────────────
  // `thalamus_down_since` was stamped here, carried faithfully across the whole
  // outage — and then set to null on recovery having been READ BY NOTHING.
  // `grep -rn "thalamus_down_since"` returned this file and the state file and
  // no other line in the repo; `status` printed the resync ARMED clause and the
  // resync count, never the stamp. So the one fact the resync arm exists to
  // justify — HOW LONG the nerve was dark — was held to the millisecond for the
  // entire outage and destroyed at the exact moment it became answerable. The
  // organism could never say "the thalamus was out 40 minutes and we dispatched
  // four relaunches into it", which is precisely the question a resync answers.
  //
  // THE STAMP'S LIFETIME IS UNCHANGED — it still goes on when the nerve drops and
  // still comes off at recovery, because an open-outage flag that never clears is
  // a broken flag. What changes is that the outage is WRITTEN DOWN before the
  // books are closed, into its own bounded ledger beside `resyncs`, with the same
  // slice(-20) bound this file already uses for them.
  //
  // TWO COUNTERS RIDE THE STAMP, so they need no reset rule of their own and no
  // invented number: `down_passes` (this organ's clock IS the pass — it has no
  // other) and `relaunch_tries` (what the arm ATTEMPTED during THIS outage; the
  // `launched` receipts above are per-pass and overwritten every 10 minutes, so
  // across a multi-pass outage the attempts cannot be counted after the fact).
  actions.outage = null;
  let { thalamus_down_since, resync_pending } = p;
  let down_passes = p.down_passes || 0;
  let relaunch_tries = { ...(p.relaunch_tries || {}) };
  let outages = p.outages || [];
  // An outage is OPEN from the pass the stamp goes on to the pass it comes off,
  // the hold pass included — so every relaunch dispatched while the nerve is dark
  // belongs to THIS outage and to no other. A relaunch outside an outage belongs
  // to no outage at all and stays with the per-pass receipts, where it is true.
  const outageOpen = !ports.thalamus || p.thalamus_down_since != null;
  if (outageOpen) for (const n of actions.launch) relaunch_tries[n] = (relaunch_tries[n] || 0) + 1;
  if (!ports.thalamus) {
    // down now — remember since when, and arm the resync for after it recovers
    thalamus_down_since = thalamus_down_since || nowIso;
    resync_pending = true;
    down_passes += 1;
  } else if (resync_pending && p.ports && p.ports.thalamus === true) {
    // THE NEXT-PASS RULE: it answered LAST pass too (a full pass of boot time) —
    // now the dropped deliveries get re-driven, exactly once per recovery.
    actions.resync = true;
    resync_pending = false;
    // CLOSE THE BOOKS BEFORE CLEARING THE STAMP. down_ms is arithmetic on two
    // stamps this file wrote itself — nothing estimated — and it is null when the
    // outage began before this ledger existed (an honest unknown, never a zero).
    actions.outage = {
      down_since: thalamus_down_since,
      recovered_at: nowIso,
      down_ms: thalamus_down_since ? Date.parse(nowIso) - Date.parse(thalamus_down_since) : null,
      down_passes,
      relaunch_tries,
    };
    outages = [...outages, actions.outage].slice(-20);
    thalamus_down_since = null;
    down_passes = 0;
    relaunch_tries = {};
  }
  // (thalamus up this pass but was down last pass ⇒ hold the resync one more
  // pass — p.ports.thalamus === false keeps resync_pending true above.)
  return {
    state: {
      at: nowIso, ports, unknown, thalamus_down_since, resync_pending, resyncs: p.resyncs || [],
      // The open outage's running totals; they live and die with the stamp above.
      down_passes, relaunch_tries, outages,
      // `launched` is THIS pass's dispatch receipts — filled by pass() once the
      // launches have actually been attempted, never by the decision. `stuck` is
      // last pass's dispatches that did not take.
      launched: [], stuck: actions.stuck.map((name) => ({ name })),
    },
    actions,
  };
}

// One word per daemon, and UNKNOWN is its own word — a probe that could not be taken
// must never print as DOWN (the same honesty the morning read's `verified` flag keeps).
export const upWord = (s, name) =>
  s.ports && s.ports[name] ? "UP" : ((s.unknown || []).includes(name) ? "UNKNOWN" : "DOWN");

// ── THE RESYNC ARMS — and what happens when one comes back empty-handed ─────
// (10 Aug 2026, a SILENT_FAILURE repair.) Until today this pair was two inline
// literals inside pass(); the loop recorded {ok:false, error} faithfully — and
// NOTHING read it. The pass line printed "RESYNC dispatched (mcp-memory +
// harvest) — the outage's dropped deliveries re-driven" the moment actions.resync
// fired, whether both arms delivered, one crashed, or both did; `status` printed
// only HOW MANY resyncs had ever run. A recovery that failed read, on every
// surface, as a recovery that happened.
//
// AND ok:true IS NOT DELIVERY. Both arms exit 0 while leaving work behind —
// harvest's own CLI says "<n> still undelivered" (harvest.mjs:313) and
// mcp-memory's prints {"pending":p,"reposted":r} (mcp-memory.mjs:568, from
// resyncScribeLog). An arm can succeed and have re-driven nothing. So the
// verdict below reads each arm's OWN printed receipt. It invents no number and
// no threshold: LEFT is whatever the arm itself said, and a receipt this file
// cannot parse is `left: null` = UNKNOWN — never a fabricated zero, never a
// fabricated failure. The selftest pins BOTH producers' output shapes, so a
// reworded receipt breaks loudly here instead of going quietly unread again.
//
// `backstop` = the organ that ALREADY surfaces this arm's leftovers on its own.
// mcp-memory has one: get_context prints "UNDELIVERED MOMENTS — n note(s) never
// reached the live bus" (mcp-memory.mjs:265) on the one door every session opens.
// harvest has NONE — its pending count lives only in `harvest.mjs status`, which
// no hook, task or anchor runs — so a stuck harvest arm is the one that must ride
// an anchor, as ONE card per arm per day on the same rolling key the stale
// verdict uses, filed through captains_call's OWN cli.
//
// WHY NO AUTO-RETRY: re-arming resync_pending would retry every 10 minutes
// forever on a permanent failure, and bounding that needs a number nobody has
// measured yet (his standing rule: 30-45-60 days of real data first). The
// machine already tried; the second attempt is HIS word, which is what the card
// asks for. AI proposes, code validates, human approves.
export const RESYNC_ARMS = [
  { name: "mcp-memory", argv: ["mcp-memory.mjs", "resync"], backstop: "get_context prints UNDELIVERED MOMENTS (mcp-memory.mjs:265)" },
  { name: "harvest",    argv: ["harvest.mjs", "resync"],    backstop: null },
];

// ── THE DOOR THAT ATE THE DIAGNOSIS (11 Aug 2026, TRUNCATED_AT_DOOR repair) ──
// The wire above finally gave a failed arm a reader — and it was reading six
// characters. Every arm receipt here was recorded as `String(e.message).slice(0,
// 120)`, and Node builds execFileSync's message as
//   "Command failed: <node.exe> <script> <args>\n<the child's own stderr>"
// MEASURED on this machine, 11 Aug 2026, from this repo's own absolute paths:
// that echo is 114 chars for `mcp-memory.mjs resync` and 111 for `harvest.mjs
// resync`. Against a 120-char budget the failing arm's own words got SIX
// characters, and NINE — and no field said a cut had happened. Worse now than
// when it was written, because resyncArmVerdict carries that text into `why`
// and resyncCardArgs puts `why` on a card in front of HIM: the card he would
// have been dealt read "dispatch hi FAIL ho gaya — Command failed: C:\Program
// Files\nodejs\node.exe C:\Users\nikhi\GitHub\arsenal…" — 100% path, 0% cause.
//
// TWO FIXES, NO NEW INSTRUMENT AND NO NEW NUMBER:
//  1. childSaid() spends nothing on the echo. execFileSync hangs the child's own
//     streams on the error object, so `e.stderr` is exactly what the arm printed
//     with no "Command failed:" in front of it (the repo's own shape — see
//     mcp-memory.mjs:338 and selfknowledge.mjs:206). e.message is the fallback,
//     because a failure that never spawned (ENOENT, timeout) has nothing else.
//  2. the trim is conductor.mjs's clipStderr — the SAME organ this file already
//     imports its probes from, written 10 Aug for this exact disease ("a
//     truncation nobody can see is the same class of lie as a silent success").
//     It hoists the reason line, spends the rest on the tail, NAMES the cut
//     inline, and returns the true byte count. So the budget is conductor's
//     declared STDERR_CAP, inherited by connecting to it — this file invents no
//     number of its own, and 120 was never anybody's measured number anyway.
//
// The `.slice(-20)` on the history below is deliberately LEFT ALONE: it drops
// whole OLD recoveries oldest-first, which is a bounded window, not a mutilated
// sentence — and the LAST dispatch, the only one every reader here reads
// (resyncVerdicts), is always intact.
export function childSaid(e) {
  if (!e) return "";
  const err = String((e.stderr) || "").trim();
  const out = String((e.stdout) || "").trim();
  return err || out || String(e.message || e).trim();
}
// One shape for both lanes: { text, bytes } — bytes is non-null ONLY when the
// text was cut, so a reader can never mistake a trimmed diagnosis for a whole one.
export function clipSaid(raw) {
  const c = clipStderr(raw);
  return { text: c.stderr, bytes: c.stderr_bytes };
}
// HIS card gets the REASON, not the stack. clipStderr already hoists the reason
// line to the front, so the first line IS the cause — and a line boundary is not
// a number I invented. The full clipped text stays in state and in the log line
// (the machine's face); the anchor stays one line, which is the anchor law.
export const reasonLine = (s) => String(s || "").split("\n")[0].trim();
// …and the LOG keeps one line per fact, so a multi-line clip is flattened there
// rather than shortened — nothing is dropped, the newlines just stop breaking
// the line shape scripts/daemon_watchdog.log is read in.
export const flatten = (s) => String(s == null ? "" : s).replace(/\s*\n\s*/g, " ⏎ ").trim();

// One recorded arm → one verdict. PURE, and it only ever quotes the arm itself.
export function resyncArmVerdict(row) {
  const cmd = String((row && row.cmd) || "");
  const arm = RESYNC_ARMS.find((a) => a.argv.join(" ") === cmd);
  const name = arm ? arm.name : (cmd.split(/[ .]/)[0] || "?");
  // the card receipt travels WITH the verdict, so the line that reports a stuck
  // arm also reports whether the ask actually reached him.
  const receipt = { card: (row && row.card) || null, card_error: (row && row.card_error) || null };
  if (!row || row.ok !== true) {
    // NOT re-cut here (11 Aug 2026). This hop used to `.slice(0, 120)` again,
    // blind and unnamed — a second cut that would have undone the door's repair
    // on the exact path that ends at HIS card. The door clipped it already and
    // declared its own bytes; this function only ever quotes the arm.
    return { name, ok: false, left: null, why: (row && row.error) || "dispatch failed", ...receipt };
  }
  const said = String(row.said || "");
  let left = null;
  const m = said.match(/(\d+)\s+still undelivered/);                 // harvest.mjs's own resync line
  if (m) left = Number(m[1]);
  else { try { const j = JSON.parse(said); if (Number.isFinite(j.pending) && Number.isFinite(j.reposted)) left = j.pending - j.reposted; } catch { } }
  return { name, ok: true, left, why: left ? `${left} still undelivered after the retry` : null, ...receipt };
}

// The LAST dispatch, read out. Older rows stay in state.resyncs as history.
export function resyncVerdicts(state) {
  const last = (((state || {}).resyncs) || []).slice(-1)[0];
  if (!last) return null;
  return { at: last.at || null, arms: (last.ran || []).map(resyncArmVerdict) };
}

// STUCK = it failed, or it succeeded and its own receipt says work is still on
// the floor. An unreadable receipt is NOT stuck — we do not invent failures.
export const resyncStuck = (v) => (v ? v.arms.filter((a) => !a.ok || (a.left != null && a.left > 0)) : []);

// The one-line voice of the resync — shared by `pass` and `status`, exactly as
// morningLine is, so the verdict can never be visible in only one surface.
export function resyncLine(state) {
  const v = resyncVerdicts(state);
  const armed = state && state.resync_pending ? " · resync ARMED (fires one pass after the thalamus answers)" : "";
  if (!v) return `resync: none ever dispatched${armed}`;
  const body = v.arms.map((a) => `${a.name} ${a.ok
    ? (a.left == null ? "ran (its receipt did not say how much landed)" : (a.left ? `LEFT ${a.left} UNDELIVERED` : "clean"))
    // FLATTENED, never re-cut: a clipped stderr is multi-line (reason, the cut
    // marker, tail) and this log keeps one line per fact. The whole diagnosis
    // travels — including clipStderr's own "[conductor: n of m chars cut]" — so
    // scripts/daemon_watchdog.log can never again assert less than state knows.
    : `FAILED — ${flatten(a.why)}`}${a.card ? ` [card ${a.card}]` : ""}${a.card_error ? ` [card FAILED: ${flatten(a.card_error)}]` : ""}`).join(" · ");
  const stuck = resyncStuck(v);
  return `resync: last ${v.at} · ${body}${stuck.length ? ` · NOT a completed recovery — ${stuck.map((a) => a.name).join(", ")} still owes the bus` : ""} · ${(state.resyncs || []).length} dispatched ever${armed}`;
}

// One card per stuck arm with no backstop. Same shape as staleCardArgs: it names
// what happened, what is still on the floor, and asks — it never runs anything.
export function resyncCardArgs(v, day) {
  // reasonLine, not the whole clip (11 Aug 2026): the state and the log carry the
  // full diagnosis; the card is an ANCHOR and stays one line. Before the door
  // repair this slot held 120 chars of "Command failed: C:\Program Files\…" —
  // the card reached him and told him nothing.
  const what = v.ok ? `${v.left} delivery(ies) abhi bhi bus tak nahi pahunchi` : `dispatch hi FAIL ho gaya — ${reasonLine(v.why)}`;
  return ["captains_call.mjs", "file",
    "--line", `${v.name} resync adhoora raha — ${what}. Outage ka data abhi bhi floor pe hai. Dobara chalaun?`,
    "--key", `resync:stuck:${v.name}:${day}`];
}

// ── THE MORNING REPORT'S FIRST READER (10 Aug 2026, wire repair) ────────────
// conductor.json — the morning chain's own receipt, "what ran, what failed, how
// long, in what order" — had NO reader anywhere in the repo. Only its evening
// twin ever got one (watchman.mjs probeEveningChain, H0, which opens by naming
// the same defect for the evening). Live proof the morning this was found:
// conductor.json (2026-08-10) carried failed=2 with thalamus AND cortex both
// "STALE BUILD" and both clocks named; six hours later the only automated word
// on the subject anywhere was watchman_last.json's "ArsenalFC-Morning-Conductor:
// result 1". The verdict existed, was correct, was specific — and nothing read
// it. He filed c31 BY HAND that same day for the brain daemon's stale code,
// which is the anchor law being paid for in his attention because no organ was
// carrying the verdict for him.
//
// THIS ORGAN, NOT ANOTHER: the watchdog is already the conductor's between-
// mornings deputy for exactly this disease — "a daemon that died mid-day stayed
// dead until the NEXT morning conductor (09:15)". STALE is that same sentence
// with the port still answering. It wakes every 10 minutes and it already
// imports this chain's own probes.
//
// IT PROPOSES, IT NEVER ACTS. Fixing a stale daemon needs a KILL, and both files
// refuse that by law (conductor: "a stale daemon is still never auto-relaunched"
// — the double-ingest scar; here: "never kills anything"). So the verdict rides
// an anchor instead, as ONE captain's-call card per daemon keyed
// `daemon:stale:<name>:<day>` — a ROLLING key, so a 10-minute cron cannot mint a
// second card while the same ask sits unanswered (captains_call fileGuard).
//
// THE DAY GATE: a STALE verdict is a claim about the process the chain probed
// THIS MORNING, and the chain re-issues it every morning — so stale verdicts are
// carried only from today's report; an older one is an old claim, not today's
// silence. `failed` (the whole chain's failed-step names) is carried from the
// last report whatever its day, WITH the day named — exactly how
// probeEveningChain reports its last run. Quiet is not dead at either end.
//
// ── THE DEGRADED LANE (11 Aug 2026 — the SAME defect, one field over) ───────
// The 10 Aug repair above gave conductor.json a reader for `ok:false` and for
// STALE BUILD, and stopped there. `degraded` — the field conductor.mjs:664
// writes when a step's declared `needs` did not produce, "ran on stale input —
// goalkeeper failed" — was still read by NOBODY. Repo-wide grep the day this
// was found: conductor.mjs writes it on BOTH chains; watchman.mjs:942 reads the
// EVENING twin only (conductor_evening.json) and the morning chain has no
// watchman arm at all; this file filtered conductor.json on `ok === false` and
// on /STALE BUILD/ in `daemon`, and a degraded step is `ok: TRUE` — it RAN. So
// it fell through every filter in the one organ that opens the file.
//
// WHY THAT MATTERS AND `failed` DOES NOT COVER IT: the two fields make two
// different claims. `failed` says an organ did not produce. `degraded` says a
// LATER step produced ANYWAY, on input the chain itself knows is stale — the
// 1 Aug scenario, the body read dies at 09:15 and the team sheet is built off
// yesterday's readiness. The failure was loud; the CONSEQUENCE — which artefact
// now on disk is untrustworthy — was the part nothing carried.
//
// NOT DAY-GATED, unlike `stale`. A STALE verdict is a claim about a process that
// may have been restarted since; a degraded artefact is a claim about a FILE the
// chain already wrote, and that file does not become fresh overnight. So it is
// carried from the last report whatever its day, with the day named — the exact
// treatment `failed` gets two lines up, and the exact treatment probeEveningChain
// gives evening degradation.
//
// AND IT NEVER ASKS. probeEveningChain grades its degraded steps INFO, not WARN,
// and files no card; the upstream organ that caused it is already named in this
// same line's FAILED clause, which is the ask. `outageLine`'s law applies word
// for word here — IT STATES, IT NEVER ASKS. A card would have to propose a
// re-run, and whether a half-day-old chain may be re-fired is his call, not a
// number this file gets to invent. `ok !== false` is watchman.mjs:942's own
// filter, borrowed whole: a step that FAILED is already in `failed`, and naming
// it twice would read as two defects where there is one.
//
// ── THE UNPRODUCED LANE (11 Aug 2026 — the SAME defect, one field further) ──
// `failed` above carries NAMES and nothing else. For almost every failure that is
// enough, because conductor.mjs also puts a reason on the row: `error` on a timeout
// or a spawn failure, clipped `stderr` on a non-zero exit. There is exactly ONE
// failure mode where BOTH of those are null by construction — the exit-0-but-did-
// not-produce step. conductor.mjs only computes `produced` when the child exited 0
// (its checkWrites), so a step that returns success and leaves its declared file
// untouched carries its whole explanation in a THIRD field, `stale`: "declared
// readiness.json but this run did not rewrite it — last written …, before this step
// started …". Repo-wide grep the day this was found: conductor.mjs wrote it at :646
// and NOTHING read it, including conductor's own FAIL printer (repaired the same
// day). This filter is why it fell through here too — `failed` matched the step and
// threw the sentence away, so the one failure that cannot explain itself anywhere
// else arrived as the bare word "goalkeeper".
//
// IT RIDES THE FAILED NAME, IT DOES NOT GET ITS OWN CLAUSE (morningLine below): the
// step is already in `failed`, and a second clause naming it again would read as two
// defects where there is one — the same rule the DEGRADED LANE states one paragraph
// up, applied from the other side.
//
// NOT DAY-GATED, and NO CARD, for the degraded lane's reasons word for word: this is
// a claim about a FILE that is missing or old on disk, not about a live process that
// may have been restarted since; and the ask — re-fire a half-day-old chain? — is
// his call, not a number this file gets to invent.
export function morningDaemonVerdicts(report, today) {
  if (!report || !Array.isArray(report.steps)) return { day: null, started: null, failed: [], stale: [], degraded: [], unproduced: [] };
  const day = localDayOf(report.started);
  const failed = report.steps.filter((s) => s && s.ok === false).map((s) => s.id);
  const stale = day !== today ? [] : report.steps
    .filter((s) => s && s.ok === false && /STALE BUILD/.test(String(s.daemon || "")))
    .map((s) => ({ name: s.id, port: s.port == null ? null : s.port, why: String(s.error || s.daemon || "").slice(0, 200) }));
  // Same clip as `why` above, same reason: the report keeps the full sentence,
  // the line stays a line.
  const degraded = report.steps
    .filter((s) => s && s.ok !== false && s.degraded)
    .map((s) => ({ name: s.id, why: String(s.degraded).slice(0, 200) }));
  // Same clip again, same reason. `ok === false` is deliberate and not redundant:
  // it is the guarantee that every name here is ALSO in `failed`, which is what
  // lets morningLine attach the why to the existing name instead of adding a clause.
  const unproduced = report.steps
    .filter((s) => s && s.ok === false && s.stale)
    .map((s) => ({ name: s.id, why: String(s.stale).slice(0, 200) }));
  return { day, started: report.started || null, failed, stale, degraded, unproduced };
}

// A verdict can be OVERTAKEN between 09:15 and now: he reads the card, restarts
// the daemon, and this morning's report still says STALE until tomorrow's chain.
// The process table already knows — conductor.mjs exports the very
// processStartMs() the chain used to catch cortex in the first place. A process
// that booted AFTER the report was written is a DIFFERENT process, so the
// verdict is void. Unknowable (null either side) ⇒ the verdict STANDS, marked
// unverified: an honest unknown, never a fabricated all-clear. No new number —
// the only comparison is the report's own `started` stamp.
export function voidedByRestart(reportStartedMs, procStartMs) {
  if (reportStartedMs == null || procStartMs == null) return false;
  return procStartMs > reportStartedMs;
}

// One card per open stale daemon. The line names the daemon, why it is stale and
// what the machine is NOT allowed to do — c31's own shape, which he wrote by
// hand the day before this organ learned to file it.
export function staleCardArgs(entry, day) {
  return ["captains_call.mjs", "file",
    "--line", `${entry.name} STALE BUILD — purane code pe chal raha hai (aaj ke conductor ne pakda). Restart karun? Live daemon kill sirf aapke word se.`,
    "--key", `daemon:stale:${entry.name}:${day}`];
}

// A STUCK daemon — dispatched last pass, still dark this pass — is where this
// organ's arm ends: it may relaunch, it may not kill, and the relaunch it is
// allowed to make has already been tried and did not take. So the fact rides an
// anchor, same shape as the stale card: ONE rolling day-key per daemon, filed
// through captains_call's own CLI, so the 10-minute cadence cannot mint a second
// ask while the first sits unanswered (captains_call fileGuard).
export function stuckCardArgs(name, day) {
  return ["captains_call.mjs", "file",
    "--line", `${name} daemon RELAUNCH NAHI CHADHA — watchdog ne start kiya, agla probe phir bhi chup. setup/START_DAEMONS.vbs aapke haath se chalana padega; machine yahan se aage nahi ja sakti.`,
    "--key", `daemon:stuck:${name}:${day}`];
}

// ── THE LEDGER IS A WITNESS TO THE BUILD (WIRING AUDIT, 11 Aug 2026) ────────
// THE DEFECT, measured on his box the hour this was written: the cortex daemon
//   (PID 13272) booted 2026-08-08T19:47:29Z and has never been restarted.
//   LADDER G1 landed 22h11m LATER (76a5cbb, 9 Aug 23:28 IST) and taught cortex
//   to parse the CLI's cache pair — so every cortex_wake row written since, the
//   10 Aug 11:21 and 11:33 serves included, still carries the PRE-G1 key set.
//   watchman.mjs:890's wake-economy re-fit accepts ONLY rows with the cache pair
//   present, so it has read 0/10 honest rows since the day it was built and
//   est_tokens_per_wake sits at the never-measured 40000 that cortex.mjs:618
//   reserves per in-flight lane and thalamus.mjs:549 divides the window by. The
//   re-fit built to kill that guess can never fire.
//   THE PARSE IS NOT THE PROBLEM: 435 of the 447 ledger rows written since 10 Aug
//   01:00 DO carry the pair, and every one of them came from the brain daemon —
//   which booted 01:29 that morning, i.e. AFTER G1. Only the process is old.
//
// WHY A SECOND WITNESS, when the conductor already catches this: it does, and
//   this file already cards it (c31/c34 `daemon:stale:cortex:2026-08-10` were
//   filed off exactly that read — conductor.mjs:561, "STALE BUILD … via process
//   table"). But that whole lane hangs on ONE artefact. morningDaemonVerdicts
//   DAY-GATES `stale`, and the newest conductor.json on disk is from 10 Aug
//   03:45, so on 11 Aug this organ's own state file says `stale: []` while the
//   same pre-G1 process is still serving wakes. The verdict expired; the
//   condition did not. And the probe behind it is the powershell process-table
//   read that times out ~1 in 3 on this laptop (conductor.mjs:395). The ledger
//   cannot expire and costs no spawn: it is dated by the writer itself.
//
// THE INFERENCE IS A PROOF, NOT A PROBE. cortex.mjs writes
//   `cache_read_tokens: r.cache_read_tokens ?? null`, so the KEY is on every row
//   today's code emits, even when the meter read null. A cortex_wake row with
//   the key ABSENT can only have come from a build older than the field.
//   Absence-of-key, never null-value: a null is an honest meter reading, a
//   missing key is an old writer. The selftest pins that shape against
//   cortex.mjs on disk, so this witness cannot go on believing in a field the
//   producer has renamed.
//
// IT PROVES A PAST, NOT A PRESENT — so it takes this file's OWN existing answer
//   to that, voidedByRestart(): a cortex process that booted AFTER the row is a
//   different process and the verdict is void. No new instrument, no new number,
//   and the powershell spawn is paid for ONLY once the ledger has already proved
//   the shape is old — the same "a healthy morning pays nothing" rule the
//   morning lane states above.
//
// IT PROPOSES, IT NEVER ACTS. The remedy is a KILL and this file may not kill
//   (its own stated law). The card rides staleCardArgs' OWN key family,
//   `daemon:stale:<name>:<day>`, so captains_call's rolling-key fileGuard dedups
//   it against the conductor lane and against any card of his still unanswered.
export const CORTEX_METER_KEY = "cache_read_tokens";

// Newest-first scan: the only row that says anything about the CURRENT build is
// the last one the serving process wrote. The cheap substring reject keeps the
// JSON.parse off the ~4,400 rows this file has no interest in.
export function newestCortexWake(raw) {
  if (!raw) return null;
  const lines = String(raw).split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i].trim();
    if (!l || !l.includes('"cortex_wake"')) continue;
    try { const j = JSON.parse(l); if (j && j.job === "cortex_wake") return j; } catch { /* a torn line is not a verdict */ }
  }
  return null;
}

export function ledgerBuildVerdict(row) {
  if (!row || !row.ts) return null;
  if (CORTEX_METER_KEY in row) return null;   // key present (null or number) ⇒ the serving build is current
  const ms = Date.parse(row.ts);
  return {
    name: "cortex", row_ts: row.ts, row_ms: Number.isFinite(ms) ? ms : null,
    why: `newest cortex_wake row (${row.ts}) carries no \`${CORTEX_METER_KEY}\` key — a shape today's cortex.mjs cannot write — so the process that served it predates LADDER G1; watchman's wake-economy re-fit discards every such row and est_tokens_per_wake stays at the unmeasured guess`,
  };
}

// Same key family as staleCardArgs on purpose (see the header): one ask per
// daemon per day, whichever witness gets there first. The line names the DAMAGE
// rather than the symptom — a restart he is being asked to authorise should say
// what it buys.
export function ledgerStaleCardArgs(entry, day) {
  return ["captains_call.mjs", "file",
    "--line", `${entry.name} STALE BUILD — ledger ne pakda (wake rows purane shape mein, cache meter hi nahi). Isi wajah se wake-economy re-fit 0/10 pe atka hai aur est_tokens_per_wake abhi tak bina-naapa 40000 hai. Restart karun? Live daemon kill sirf aapke word se.`,
    "--key", `daemon:stale:${entry.name}:${day}`];
}

// The one-line voice of the build witness — shared by `pass` and `status`, the
// launchLine/morningLine precedent, so it can never be visible in only one of
// them. Empty string = the ledger had nothing to say, which is the healthy case.
export function buildWitnessLine(lb) {
  if (!lb) return "";
  if (lb.cleared) return `build witness: ${lb.name} has restarted since its last cache-blind wake row (${lb.row_ts}) — verdict VOID, the next wake will meter honestly`;
  return `LEDGER BUILD WITNESS: ${lb.name} is serving from pre-meter code${lb.verified ? "" : " (process start unverified)"} — ${lb.why} · ${lb.card_error ? "card FAILED to file" : "card filed"}, restart needs HIS word`;
}

async function pass(deps = {}) {
  const nowIso = (deps.now || new Date()).toISOString();
  const probes = {};
  for (const d of DAEMONS) {
    // Two probes, one table: a port answers, or the process table names it. Both are
    // borrowed from conductor.mjs — this repair added no new instrument.
    probes[d.name] = d.port != null
      ? await (deps.probe || portOpen)(d.port)
      : (deps.procProbe || processProbe)(d.match, deps);
  }
  const prev = deps.prev !== undefined ? deps.prev : readJson(STATE());
  const { state, actions } = decidePass(prev, probes, nowIso);
  const shell = deps.exec || ((a) => execFileSync(process.execPath, [join(__dirname, a[0]), ...a.slice(1)], { encoding: "utf8", timeout: 60000 }));
  const today = deps.today || localDate(deps.now || new Date());
  for (const name of actions.launch) {
    const d = DAEMONS.find((x) => x.name === name);
    // THE RECEIPT (11 Aug 2026 wire repair — see decidePass' header). Was:
    //   `try { launchDetached(d.args); state.ports[`${name}_relaunched`] = true; } catch { }`
    // Two defects in one line. The empty catch dropped every failure on the
    // floor. And the receipt was written INTO `ports`, the liveness map — a key
    // no organ has ever read (`grep -rn "_relaunched"` returned this line and
    // nothing else) sitting in the one map that means "is it up", where any
    // future reader iterating it would count `thalamus_relaunched` as a daemon.
    // It now lands in its own lane, with the reason when it fails.
    try { (deps.launch || launchDetached)(d.args); state.launched.push({ name, ok: true }); }
    catch (e) { state.launched.push({ name, ok: false, error: String((e && e.message) || e).slice(0, 200) }); }
  }
  // The stuck verdict is the one thing here that needs HIS hands — it rides an
  // anchor and nothing else happens. This file never kills, never escalates.
  for (const row of state.stuck) {
    // Same door as the resync arms (see childSaid/clipSaid): a card that FAILS to
    // file is the anchor law failing silently, and diagnosing it off e.message
    // spends the whole budget on captains_call's own absolute path.
    try { row.card = clipSaid(String(shell(stuckCardArgs(row.name, today)))).text; }
    catch (err) { row.card_error = clipSaid(childSaid(err)).text; }
  }
  if (actions.resync) {
    const ran = [];
    for (const arm of RESYNC_ARMS) {
      try {
        const out = shell(arm.argv);
        // said is PARSED by resyncArmVerdict (harvest's "<n> still undelivered",
        // mcp-memory's {"pending":p,"reposted":r}) — a receipt cut mid-JSON reads
        // as `left: null` = "it did not say", which is a lie about a receipt that
        // did say. Same door, same clip, same declared cut.
        const s = clipSaid(String(out));
        ran.push({ cmd: arm.argv.join(" "), ok: true, said: s.text, said_bytes: s.bytes });
      } catch (e) {
        const c = clipSaid(childSaid(e));   // the CHILD's words, not the command echo
        ran.push({ cmd: arm.argv.join(" "), ok: false, error: c.text, error_bytes: c.bytes });
      }
    }
    state.resyncs = [...(state.resyncs || []), { at: nowIso, ran }].slice(-20);
    // THE WIRE (see RESYNC_ARMS' header). Until today this loop's ok:false rows
    // had no reader at all and the pass line called every dispatch a completed
    // recovery. Now each arm is judged by its own receipt, and the one arm with
    // no backstop of its own rides an anchor when it comes back short.
    for (const verdict of resyncStuck({ arms: ran.map(resyncArmVerdict) })) {
      const arm = RESYNC_ARMS.find((a) => a.name === verdict.name);
      const row = ran.find((r) => r.cmd === (arm ? arm.argv.join(" ") : null));
      if (arm && arm.backstop) { if (row) row.surfaced_by = arm.backstop; continue; }
      // captains_call's OWN cli, never its file — the owners-only law, same as
      // the stale card above. The rolling day-key means the 10-minute cadence
      // files at most one live card per arm.
      // Same door as the arm above: captains_call's own path echo is ~120 chars
      // by itself, so a card that FAILS to file must be diagnosed off the child's
      // stderr, not off e.message — otherwise the one record of "the ask never
      // reached him" is 100% path and the failure is invisible twice over.
      try { if (row) row.card = clipSaid(String(shell(resyncCardArgs(verdict, today)))).text; }
      catch (err) { if (row) row.card_error = clipSaid(childSaid(err)).text; }
    }
  }

  // ---- the morning report's read (see morningDaemonVerdicts' header) --------
  // The process-table call costs a powershell spawn, so it fires ONLY for a
  // daemon the report actually named stale — a healthy morning pays nothing.
  const report = deps.report !== undefined ? deps.report : readJson(MORNING_REPORT());
  const v = morningDaemonVerdicts(report, today);
  const startedMs = v.started ? Date.parse(v.started) : null;
  const stale = [];
  for (const e of v.stale) {
    const d = DAEMONS.find((x) => x.name === e.name);
    const procMs = d ? (deps.procStart || processStartMs)(d.args[0]) : null;
    const cleared = voidedByRestart(startedMs, procMs);
    const row = { ...e, cleared, verified: procMs != null };
    if (!cleared) {
      // The ask goes through captains_call's OWN cli — the owners-only law: this
      // file never touches captains_call.json, and the rolling key means the
      // 10-minute cadence files at most one live card per daemon.
      // …and the same door again (11 Aug 2026): the ONLY record that this ask
      // never reached him must be the child's own words, not 120 chars of path.
      try { row.card = clipSaid(String(shell(staleCardArgs(e, today)))).text; }
      catch (err) { row.card_error = clipSaid(childSaid(err)).text; }
    }
    stale.push(row);
  }
  // `degraded` rides straight through — no probe, no card, no spawn (see the
  // DEGRADED LANE header). It costs nothing and it is now ON DISK, so the next
  // organ that wants the morning's degradation does not have to re-open
  // conductor.json to find it.
  // `unproduced` rides through on the same terms as `degraded` (see the UNPRODUCED
  // LANE header): no probe, no card, no spawn — the step is already named in
  // `failed`, this is only the sentence that says WHY, and it is now on disk for the
  // next organ instead of dying inside conductor.json.
  state.morning_chain = { report_day: v.day, report_started: v.started, failed: v.failed, stale, degraded: v.degraded || [], unproduced: v.unproduced || [], read_at: nowIso };

  // ---- the ledger's own build witness (see THE LEDGER IS A WITNESS header) --
  // Gated on the port probe answering UP: "the build it is running is old" is
  // not the ask a DARK daemon needs — that one belongs to the relaunch arm and
  // the stuck card above, and a stale verdict on a dead process is noise.
  // A name the morning lane already carded on THIS pass is skipped so one pass
  // never spawns captains_call twice for one key.
  const cardedStale = new Set(stale.filter((s) => !s.cleared).map((s) => s.name));
  let ledgerStale = null;
  // `cortexRow` is the injection door, and EVERY selftest fixture passes it
  // (`cortexRow: null` = the ledger said nothing) — a hermetic pass must never
  // read his live brain_ledger.jsonl, the same law as `report` and `procProbe`.
  const lv = ledgerBuildVerdict(deps.cortexRow !== undefined ? deps.cortexRow : newestCortexWake(readText(LEDGER())));
  if (lv && probes[lv.name] === true) {
    const d = DAEMONS.find((x) => x.name === lv.name);
    // The spawn is paid for HERE and nowhere earlier — the ledger has already
    // proved the shape is old, so this call only ever answers "is it the same
    // process". Unknowable ⇒ the verdict STANDS, marked unverified: the same
    // honest-unknown rule voidedByRestart states for the morning lane.
    const procMs = d ? (deps.procStart || processStartMs)(d.args[0]) : null;
    const cleared = voidedByRestart(lv.row_ms, procMs);
    ledgerStale = { ...lv, cleared, verified: procMs != null };
    if (cleared) { /* a different process is serving now — nothing to ask */ }
    else if (cardedStale.has(lv.name)) ledgerStale.card = "the morning lane already carded this name on this pass (same rolling key)";
    else {
      // captains_call's OWN cli, never its file — the owners-only law, same door
      // and same clip as every other ask in this organ.
      try { ledgerStale.card = clipSaid(String(shell(ledgerStaleCardArgs(lv, today)))).text; }
      catch (err) { ledgerStale.card_error = clipSaid(childSaid(err)).text; }
    }
  }
  state.ledger_build = ledgerStale;

  if (!deps.dry) writeAtomic(STATE(), state);
  return { state, actions };
}

// The voice of the RELAUNCH ARM, read off the receipts and never off the
// decision — shared by `pass` and `status` (the morningLine precedent) so a
// stuck daemon is never visible in only one of them. Empty string = nothing was
// attempted and nothing is stuck, which is the honest way to say "quiet".
// The word is DISPATCHED, not "relaunched": a detached spawn is a dispatch, and
// the up/down word for that daemon on the NEXT line of the log is the outcome.
export function launchLine(s) {
  const tried = (s && s.launched) || [], stuck = (s && s.stuck) || [];
  const ok = tried.filter((x) => x.ok).map((x) => x.name);
  const threw = tried.filter((x) => !x.ok);
  const bits = [];
  if (ok.length) bits.push(`relaunch DISPATCHED: ${ok.join(", ")} (detached via the VBS cloak — a dispatch is not an UP; the next pass's probe is the proof)`);
  if (threw.length) bits.push(`RELAUNCH THREW: ${threw.map((x) => `${x.name} — ${x.error}`).join(" · ")}`);
  if (stuck.length) bits.push(`STILL DOWN after last pass's relaunch: ${stuck.map((x) => x.name + (x.card_error ? " (card FAILED to file)" : "")).join(", ")} — card filed, HIS hands needed (setup/START_DAEMONS.vbs)`);
  return bits.join(" · ");
}

// The one-line voice of the NERVE OUTAGE — the consumer `thalamus_down_since`
// never had. Shared by `pass` and `status` (the morningLine/launchLine
// precedent), so the duration can never be visible in only one surface. It reads
// the STAMP while an outage is open and the closed LEDGER afterwards.
//
// IT STATES, IT NEVER ASKS. A closed outage needs nobody — the machine handled
// it, and that is the whole point of the resync arm; an open one is already on
// the DOWN word of the line above, and the stuck-daemon card is the organ that
// escalates. No card, no threshold, no "an outage longer than N minutes" — the
// number that would need is exactly the number nobody has measured yet.
export function outageLine(s) {
  const tries = (o) => { const e = Object.entries(o || {}); return e.length ? e.map(([n, c]) => `${n}×${c}`).join(", ") : "none"; };
  // Display only, never a comparison: minutes are how a human reads a dark
  // stretch. The millisecond span stays on disk exactly as computed.
  const mins = (ms) => (ms == null ? "unknown (the outage began before this ledger existed)" : `${Math.round(ms / 60000)}m`);
  if (s && s.thalamus_down_since) {
    return `nerve outage OPEN: thalamus dark since ${s.thalamus_down_since} · ${s.down_passes || 0} pass(es) · relaunch tries this outage: ${tries(s.relaunch_tries)}`;
  }
  const last = ((s && s.outages) || []).slice(-1)[0];
  if (!last) return "nerve outage: none on record";
  return `last nerve outage: ${mins(last.down_ms)} dark (${last.down_since} → ${last.recovered_at}, ${last.down_passes} pass(es)) · relaunch tries: ${tries(last.relaunch_tries)} · ${(s.outages || []).length} outage(s) on record`;
}

// The one-line voice of the morning read — shared by `pass` and `status` so the
// verdict is never visible in only one of them.
export function morningLine(mc) {
  if (!mc || !mc.report_day) return "morning chain: NO report on disk (conductor.json absent — the chain may never have run here)";
  const open = (mc.stale || []).filter((s) => !s.cleared);
  // THE UNPRODUCED WHY rides the FAILED name itself rather than earning a clause of
  // its own (see the lane's header): the step is already listed here, and for the
  // exit-0 failure mode this sentence is the ONLY explanation that exists anywhere —
  // conductor's `error` and `stderr` are both null by construction on that path.
  // Absent ⇒ nothing is appended, so every other failure's line is byte-identical.
  const whyNotProduced = new Map((mc.unproduced || []).map((u) => [u.name, u.why]));
  const head = `morning chain (${mc.report_day}): ${(mc.failed || []).length ? `FAILED ${mc.failed.map((n) => n + (whyNotProduced.get(n) ? ` — ${whyNotProduced.get(n)}` : "")).join(", ")}` : "all steps ok"}`;
  // THE DEGRADED CLAUSE — appended to BOTH exits below, because the early return
  // for "no stale daemons" is the common case and is exactly where a degraded
  // sheet would otherwise disappear again: goalkeeper dies, no daemon is stale,
  // the line says "FAILED goalkeeper" and never says the sheet was built anyway.
  // Silent on a clean chain, like every other clause in this file.
  const deg = (mc.degraded || []).length
    ? ` · DEGRADED: ${mc.degraded.map((d) => `${d.name} — ${d.why}`).join(" · ")} (the step RAN and its artefact is on disk, built on input the chain could not refresh)`
    : "";
  if (!(mc.stale || []).length) return head + deg;
  const cleared = (mc.stale || []).filter((s) => s.cleared).map((s) => s.name);
  return `${head} · STALE BUILD: ${open.length ? open.map((s) => s.name + (s.verified ? "" : " (unverified)")).join(", ") + " — card filed, restart needs HIS word" : "none open"}${cleared.length ? ` · cleared by restart since the report: ${cleared.join(", ")}` : ""}${deg}`;
}

// ── CLI ─────────────────────────────────────────────────────────────────────
async function main() {
  const mode = process.argv[2] || "pass";
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "status") {
    const s = readJson(STATE());
    if (!s) { console.log("daemon_watchdog: never run"); return; }
    // the resync clause moved OUT of this line into resyncLine: "N resync(s) ever"
    // counted dispatches, which is not the same claim as "the outage's dropped
    // deliveries got re-driven" — the very conflation this repair exists to end.
    console.log(`daemon_watchdog: last pass ${s.at} · ${DAEMONS.map((d) => `${d.name} ${upWord(s, d.name)}${d.port == null ? " (process table)" : ""}`).join(" · ")}`);
    if (launchLine(s)) console.log(`daemon_watchdog: ${launchLine(s)}`);
    // `status` is the asked-for read, so the outage answers unconditionally here —
    // "none on record" is itself the answer to "how long was the nerve out".
    console.log(`daemon_watchdog: ${outageLine(s)}`);
    console.log(`daemon_watchdog: ${resyncLine(s)}`);
    console.log(`daemon_watchdog: ${morningLine(s.morning_chain)}`);
    if (buildWitnessLine(s.ledger_build)) console.log(`daemon_watchdog: ${buildWitnessLine(s.ledger_build)}`);
    return;
  }
  const { state, actions } = await pass();
  const up = DAEMONS.filter((d) => state.ports[d.name]).length;
  const dark = DAEMONS.filter((d) => upWord(state, d.name) === "DOWN").map((d) => d.name);
  // The relaunch clause is read off launchLine(state) — the RECEIPTS — never off
  // actions.launch, which is only what this pass decided to try (11 Aug repair).
  console.log(`daemon_watchdog: ${up}/${DAEMONS.length} up${dark.length ? ` · DOWN: ${dark.join(", ")}` : ""}${(state.unknown || []).length ? ` · UNKNOWN (probe not takeable): ${state.unknown.join(", ")}` : ""}${launchLine(state) ? ` · ${launchLine(state)}` : ""}`);
  // `pass` runs every 10 minutes into scripts/daemon_watchdog.log, so the outage
  // line is gated on there BEING one — an open outage, or one that closed on this
  // very pass. Same voice as `status`, printed only when it has something to say;
  // a healthy nerve does not repeat "none on record" 144 times a day.
  if (actions.outage || state.thalamus_down_since) console.log(`daemon_watchdog: ${outageLine(state)}`);
  // The resync clause is read off the RECEIPTS too. The line it replaces —
  // "RESYNC dispatched (mcp-memory + harvest) — the outage's dropped deliveries
  // re-driven" — was printed off `actions.resync`, i.e. off the DECISION to run
  // them, and said "re-driven" whether they had or not. It also kept speaking on
  // a pass that dispatched nothing, so long as the last dispatch is still stuck:
  // an owed delivery does not stop being owed ten minutes later.
  if (actions.resync || resyncStuck(resyncVerdicts(state)).length) console.log(`daemon_watchdog: ${resyncLine(state)}`);
  console.log(`daemon_watchdog: ${morningLine(state.morning_chain)}`);
  // Printed only when the ledger has something to say — a healthy build does not
  // repeat "the meter is current" 144 times a day (the outageLine rule).
  if (buildWitnessLine(state.ledger_build)) console.log(`daemon_watchdog: ${buildWitnessLine(state.ledger_build)}`);
}

// ── SELFTEST — hermetic, injected, every check can fail ─────────────────────
async function selftest() {
  let pass2 = 0, fail = 0;
  const assert = (n, c) => { if (c) { pass2++; console.log(`  ✓ ${n}`); } else { fail++; console.log(`  ✗ ${n}`); } };
  console.log("== daemon_watchdog selftest ==\n");
  const T = (h) => `2026-08-09T${String(h).padStart(2, "0")}:00:00.000Z`;

  assert("the dugout (:4114) is EXCLUDED — his surface, never the watchdog's",
    !DAEMONS.some((d) => d.port === 4114) && DAEMONS.length === 5
    && DAEMONS.find((d) => d.name === "brain").port === 4116);

  // ---- THE 5th RESIDENT (10 Aug 2026 wire repair) --------------------------
  // Every check here fails if the context bridge falls out of the liveness table
  // again — which is the whole defect: it ran as a logon daemon from 9 Aug and no
  // watcher in the organism could say whether it was alive.
  {
    const ctx = DAEMONS.find((d) => d.name === "context");
    assert("THE 5th RESIDENT — the ambient context bridge is IN the table, probed by process (it holds no port)",
      !!ctx && ctx.port === null && ctx.match === "context.mjs daemon"
      && ctx.args.join(" ") === "scripts/context.mjs daemon");
    // SOURCE TRUTH, not prose: the table's launch args must still name the lane the
    // machine actually starts. Rename or drop that VBS line and this goes red.
    const vbs = (() => { try { return readFileSync(DAEMONS_VBS, "utf8"); } catch { return ""; } })();
    assert("THE 5th RESIDENT — the relaunch args match the REAL logon lane in setup/START_DAEMONS.vbs",
      /context\.mjs daemon/.test(vbs) && vbs.includes(ctx.args[0].replace(/\//g, "\\")));
    assert("THE 5th RESIDENT — the process probe: named ⇒ UP · absent ⇒ DOWN · no process table ⇒ UNKNOWN, never DOWN",
      processProbe("context.mjs daemon", { platform: "win32", procStart: () => 1754800000000 }) === true
      && processProbe("context.mjs daemon", { platform: "win32", procStart: () => null }) === false
      && processProbe("context.mjs daemon", { platform: "linux", procStart: () => { throw new Error("must not shell off Windows"); } }) === null);
    // ---- PROBE HONESTY (11 Aug 2026) — THE TWIN THAT WAS ONE FLAKE AWAY -------
    // The probe below is the LIVE door (procRead), not the ms|null fixture above, because
    // the defect lived precisely in the step that turned a killed shell into `false`.
    // MEASURED the hour this was written: 2 of 5 consecutive real probes for PID 21308 —
    // up and emitting — returned ETIMEDOUT, and daemon_watchdog.json on disk already held
    // `ports.context:false` with `unknown:[]`, i.e. the confirm rule was one flake from
    // launching a twin onto the thalamus door. These fail if a could-not-look reading is
    // ever folded back into DOWN, or if an absent reading stops being actionable.
    assert("PROBE HONESTY — a probe KILLED at the timeout reads UNKNOWN, never DOWN; a clean look that finds nothing still reads DOWN",
      processProbe("context.mjs daemon", { platform: "win32", procRead: () => ({ ms: null, looked: false, reason: "ETIMEDOUT" }) }) === null
      && processProbe("context.mjs daemon", { platform: "win32", procRead: () => ({ ms: null, looked: true, reason: "absent" }) }) === false
      && processProbe("context.mjs daemon", { platform: "win32", procRead: () => ({ ms: 1754800000000, looked: true, reason: "found" }) }) === true);
    // THE WHOLE POINT, end to end: the armed state that was sitting on his disk, plus one
    // timed-out probe, must produce NO launch. Before this repair it produced a twin.
    {
      const armed = { ports: { turnstile: true, cortex: true, thalamus: true, brain: true, context: false }, unknown: [], thalamus_down_since: null, resync_pending: false, resyncs: [], launched: [] };
      const timedOut = processProbe("context.mjs daemon", { platform: "win32", procRead: () => ({ ms: null, looked: false, reason: "ETIMEDOUT" }) });
      const next = decidePass(armed, { turnstile: true, cortex: true, thalamus: true, brain: true, context: timedOut }, T(11));
      assert("PROBE HONESTY — the ARMED state on disk (ports.context:false, unknown:[]) + a timed-out probe launches NOTHING, so a live bridge never gets a twin double-POSTing the door",
        timedOut === null && next.actions.launch.length === 0 && next.state.unknown.join(",") === "context");
      // and the genuinely-dark bridge is NOT sacrificed to that caution
      const reallyDown = decidePass(armed, { turnstile: true, cortex: true, thalamus: true, brain: true, context: false }, T(12));
      assert("PROBE HONESTY — a bridge that is genuinely absent on a probe that COMPLETED is still relaunched; the caution costs a delay, never a dark bridge",
        reallyDown.actions.launch.join(",") === "context");
    }
    // An unread probe must never become a launch — that is how a live bridge gets a twin.
    const unk = decidePass(null, { turnstile: true, cortex: true, thalamus: true, brain: true, context: null }, T(10));
    assert("THE 5th RESIDENT — an UNKNOWN probe launches NOTHING and prints UNKNOWN, not DOWN",
      unk.actions.launch.length === 0 && unk.state.unknown.join(",") === "context"
      && upWord(unk.state, "context") === "UNKNOWN" && upWord(unk.state, "thalamus") === "UP");
    // No EADDRINUSE guard ⇒ one reading is not enough. A port daemon still relaunches at once.
    const ctxDown = { turnstile: true, cortex: true, thalamus: true, brain: true, context: false };
    const c1 = decidePass(null, ctxDown, T(10));
    const c2 = decidePass(c1.state, ctxDown, T(11));
    assert("THE 5th RESIDENT — a portless daemon takes TWO consecutive DOWN readings to relaunch (a flaky probe must not mint a second bridge)",
      c1.actions.launch.length === 0 && c2.actions.launch.join(",") === "context"
      && upWord(c1.state, "context") === "DOWN");
    assert("THE 5th RESIDENT — …and an UNKNOWN in between RESETS the confirm (we never relaunch off a reading we could not take)",
      decidePass(decidePass(c1.state, { ...ctxDown, context: null }, T(11)).state, ctxDown, T(12)).actions.launch.length === 0);
    assert("THE 5th RESIDENT — the four PORT daemons are unchanged: one failed answer is enough (their lock makes a double start harmless)",
      decidePass(null, { ...ctxDown, thalamus: false, context: true }, T(10)).actions.launch.join(",") === "thalamus");
  }

  const allUp = { turnstile: true, cortex: true, thalamus: true, brain: true, context: true };
  const d1 = decidePass(null, allUp, T(10));
  assert("all up ⇒ no launches, no resync, clean state",
    d1.actions.launch.length === 0 && d1.actions.resync === false && d1.state.resync_pending === false);

  const thalDown = { ...allUp, thalamus: false, brain: false };
  const d2 = decidePass(d1.state, thalDown, T(11));
  assert("a down daemon is relaunched; thalamus-down arms the resync and stamps since-when",
    d2.actions.launch.join(",") === "thalamus,brain"
    && d2.state.resync_pending === true && d2.state.thalamus_down_since === T(11));

  const d3 = decidePass(d2.state, allUp, T(12));
  assert("THE NEXT-PASS RULE — the pass where it first answers does NOT resync (boot time is boot time)",
    d3.actions.resync === false && d3.state.resync_pending === true);

  const d4 = decidePass(d3.state, allUp, T(13));
  assert("…and the pass AFTER that dispatches the resync exactly once, then disarms",
    d4.actions.resync === true && d4.state.resync_pending === false && d4.state.thalamus_down_since === null
    && decidePass(d4.state, allUp, T(14)).actions.resync === false);

  const d5 = decidePass(d2.state, thalDown, T(12));
  assert("still down ⇒ keeps the ORIGINAL down-since stamp (the outage is one outage)",
    d5.state.thalamus_down_since === T(11) && d5.actions.launch.includes("thalamus"));

  // ---- THE OUTAGE LEDGER (11 Aug 2026 ORPHAN_FIELD repair) -----------------
  // Every check below fails the moment the duration goes back to being computed
  // for a whole outage and then thrown away unread — which is the entire defect:
  // thalamus_down_since was stamped, carried, nulled, and never once spoken.
  // d2 (T11) and d5 (T12) are two dark passes of the SAME outage, each
  // dispatching thalamus+brain, so the closed record must carry 2 passes, 2 tries
  // per daemon, and the real span — and must be written BEFORE the stamp clears.
  {
    const hold = decidePass(d5.state, allUp, T(13));      // first answer back — hold, nothing closes
    const rec  = decidePass(hold.state, allUp, T(14));    // the pass AFTER — resync + close the books
    assert("OUTAGE LEDGER — recovery CLOSES the outage: the real span off this file's own two stamps, passes and relaunch tries counted across the whole dark stretch (the hold pass closes nothing)",
      hold.actions.outage == null && hold.state.thalamus_down_since === T(11)
      && rec.actions.resync === true && rec.actions.outage
      && rec.actions.outage.down_since === T(11) && rec.actions.outage.recovered_at === T(14)
      && rec.actions.outage.down_ms === 3 * 3600 * 1000 && rec.actions.outage.down_passes === 2
      && rec.actions.outage.relaunch_tries.thalamus === 2 && rec.actions.outage.relaunch_tries.brain === 2);

    assert("OUTAGE LEDGER — the closed outage is DURABLE (its own bounded lane, survives later passes) and the open-outage counters reset with the stamp so the NEXT outage starts clean",
      rec.state.outages.length === 1 && rec.state.outages[0].down_ms === 3 * 3600 * 1000
      && rec.state.thalamus_down_since === null && rec.state.down_passes === 0
      && Object.keys(rec.state.relaunch_tries).length === 0
      && decidePass(rec.state, allUp, T(15)).state.outages.length === 1
      && decidePass(rec.state, thalDown, T(15)).state.relaunch_tries.thalamus === 1);

    assert("OUTAGE LEDGER — THE WIRE ITSELF: the duration is SPOKEN. Open reads the stamp, closed reads the ledger, an empty ledger says so — delete outageLine's callers and this is the orphan again",
      /OPEN: thalamus dark since 2026-08-09T11:00/.test(outageLine(d2.state))
      && /relaunch tries this outage: thalamus×1, brain×1/.test(outageLine(d2.state))
      && /last nerve outage: 180m dark/.test(outageLine(rec.state))
      && /relaunch tries: thalamus×2, brain×2/.test(outageLine(rec.state))
      && /1 outage\(s\) on record/.test(outageLine(rec.state))
      && outageLine({}) === "nerve outage: none on record");

    assert("OUTAGE LEDGER — an outage that began before this ledger existed reports UNKNOWN, never a fabricated zero",
      decidePass({ ports: { thalamus: true }, resync_pending: true, thalamus_down_since: null }, allUp, T(14))
        .actions.outage.down_ms === null
      && /dark stretch|unknown/.test(outageLine({ outages: [{ down_ms: null, down_since: null, recovered_at: T(14), down_passes: 0, relaunch_tries: {} }] })));

    // THE WRITER must carry it too — a ledger the writer drops is the same orphan.
    const rp = await pass({
      dry: true, cortexRow: null, prev: hold.state, now: new Date(T(14)), report: null,
      probe: async () => true, procProbe: () => true, launch: () => {}, exec: () => "ok",
    });
    assert("OUTAGE LEDGER — pass(), the file's only writer, carries the closed outage onto the state it saves",
      rp.state.outages.length === 1 && rp.state.outages[0].down_passes === 2
      && rp.state.outages[0].down_ms === 3 * 3600 * 1000 && rp.state.thalamus_down_since === null);
  }

  // the full pass() with injected probe/launch/exec — no real ports, no real spawns
  {
    const launched = [];
    const execs = [];
    const r = await pass({
      dry: true, cortexRow: null, prev: d3.state, now: new Date(T(13)),
      probe: async () => true,
      procProbe: () => true,          // the portless resident's probe, injected — a selftest never shells the live process table
      launch: (a) => launched.push(a.join(" ")),
      exec: (a) => { execs.push(a.join(" ")); return "ok"; },
    });
    assert("pass() drives the decision: recovery pass runs BOTH resyncs (mcp-memory + harvest), records both",
      launched.length === 0 && execs.length === 2
      && execs[0] === "mcp-memory.mjs resync" && execs[1] === "harvest.mjs resync"
      && r.state.resyncs.length === 1 && r.state.resyncs[0].ran.every((x) => x.ok));
  }

  // ---- A FAILED RESYNC IS NOT A RECOVERY (10 Aug 2026 wire repair) ---------
  // Every check below fails the moment the resync's outcome loses its reader
  // again — which is the whole defect: {ok:false, error} was recorded on every
  // pass and read by nothing, while both surfaces said the dropped deliveries
  // had been re-driven.
  {
    const DAY = "2026-08-10";
    const V = (row) => resyncArmVerdict(row);
    assert("RESYNC VERDICT — each arm is judged by its OWN receipt: harvest's prose, mcp-memory's JSON, and a throw is a FAILURE",
      V({ cmd: "harvest.mjs resync", ok: true, said: "harvest: resync — 5 pending, 3 delivered, 2 still undelivered" }).left === 2
      && V({ cmd: "mcp-memory.mjs resync", ok: true, said: '{"pending":3,"reposted":1}' }).left === 2
      && V({ cmd: "mcp-memory.mjs resync", ok: true, said: '{"pending":2,"reposted":2}' }).left === 0
      && V({ cmd: "harvest.mjs resync", ok: false, error: "ENOENT" }).ok === false
      && V({ cmd: "harvest.mjs resync", ok: false, error: "ENOENT" }).name === "harvest");
    assert("RESYNC VERDICT — an UNREADABLE receipt is UNKNOWN (left:null), never a fabricated zero and never a fabricated failure",
      V({ cmd: "harvest.mjs resync", ok: true, said: "ok" }).left === null
      && V({ cmd: "harvest.mjs resync", ok: true, said: "ok" }).ok === true
      && resyncStuck({ arms: [V({ cmd: "harvest.mjs resync", ok: true, said: "ok" })] }).length === 0);
    assert("RESYNC VERDICT — STUCK = failed OR its own receipt says work is still on the floor; a clean arm is not stuck",
      resyncStuck({ arms: [V({ cmd: "harvest.mjs resync", ok: true, said: "0 still undelivered" })] }).length === 0
      && resyncStuck({ arms: [V({ cmd: "harvest.mjs resync", ok: true, said: "4 still undelivered" })] }).length === 1
      && resyncStuck({ arms: [V({ cmd: "harvest.mjs resync", ok: false, error: "boom" })] }).length === 1
      && resyncStuck(null).length === 0);

    // THE WIRE ITSELF: pass() must judge what it dispatched, say so on the
    // operator line, and hand the arm WITHOUT a backstop to captains_call's cli.
    const calls = [];
    const stuckOut = (a) => {
      if (a[0] === "harvest.mjs") return "harvest: resync — 4 pending, 1 delivered, 3 still undelivered";
      if (a[0] === "mcp-memory.mjs") return '{"pending":2,"reposted":0}';
      calls.push(a.join(" ")); return "captains_call: filed c77";
    };
    const r = await pass({
      dry: true, cortexRow: null, prev: d3.state, now: new Date(`${DAY}T18:00:00Z`), today: DAY, report: null,
      probe: async () => true, procProbe: () => true, launch: () => { },
      exec: (a) => stuckOut(a),
    });
    const line = resyncLine(r.state);
    assert("RESYNC WIRE — a dispatch that left work behind is NOT reported as a completed recovery, and both arms are named with what they owe",
      /NOT a completed recovery/.test(line) && /harvest LEFT 3 UNDELIVERED/.test(line)
      && /mcp-memory LEFT 2 UNDELIVERED/.test(line));
    assert("RESYNC WIRE — the arm with NO backstop rides an anchor: exactly ONE captains_call card, rolling day-key, through the OWNER's cli",
      calls.length === 1 && calls[0].startsWith("captains_call.mjs file --line ")
      && / --key resync:stuck:harvest:2026-08-10$/.test(calls[0]) && /resync adhoora raha/.test(calls[0]));
    assert("RESYNC WIRE — mcp-memory is NOT re-asked (get_context already surfaces its leftovers) but its backstop is NAMED in the record",
      !calls.some((c) => /resync:stuck:mcp-memory/.test(c))
      && /UNDELIVERED MOMENTS/.test(r.state.resyncs.slice(-1)[0].ran.find((x) => x.cmd === "mcp-memory.mjs resync").surfaced_by || "")
      && r.state.resyncs.slice(-1)[0].ran.find((x) => x.cmd === "harvest.mjs resync").card === "captains_call: filed c77");
    assert("RESYNC WIRE — a clean dispatch files NOTHING and says clean (a working recovery must never mint a card)",
      (await pass({ dry: true, cortexRow: null, prev: d3.state, now: new Date(`${DAY}T18:00:00Z`), today: DAY, report: null,
        probe: async () => true, procProbe: () => true, launch: () => { },
        exec: (a) => { if (a[0] === "captains_call.mjs") throw new Error("a clean resync must never reach the captain"); return a[0] === "harvest.mjs" ? "harvest: resync — 0 pending, 0 delivered, 0 still undelivered" : '{"pending":0,"reposted":0}'; },
      })).state.resyncs.slice(-1)[0].ran.every((x) => x.ok && !x.card));

    // SOURCE TRUTH, not prose — both halves of the wire, pinned to the files.
    // The verdict is parsed out of the arms' OWN printed receipts, so a reword at
    // either producer must go RED here rather than silently return left:null
    // forever, which is how this wire went dark the first time.
    const src = (rel) => { try { return readFileSync(join(__dirname, rel), "utf8"); } catch { return ""; } };
    assert("RESYNC WIRE — the two producers still print the receipts this file parses (rename them and this goes red, not quiet)",
      /still undelivered/.test(src("harvest.mjs"))
      && /JSON\.stringify\(await resyncScribeLog\(\)\)/.test(src("mcp-memory.mjs"))
      && /return \{ pending: pending\.length, reposted \}/.test(src("mcp-memory.mjs")));
    const own = src("daemon_watchdog.mjs");
    const mainSrc = own.slice(own.indexOf("async function main()"), own.indexOf("// ── SELFTEST"));
    assert("RESYNC WIRE — the operator line is read off the RECEIPTS: no claim left anywhere that fires off `actions.resync` alone",
      !/\$\{actions\.resync \? /.test(mainSrc) && /resyncLine\(state\)/.test(mainSrc) && /resyncLine\(s\)/.test(mainSrc));
  }

  // ---- THE DOOR THAT ATE THE DIAGNOSIS (11 Aug 2026, TRUNCATED_AT_DOOR) ----
  // Every check here fails the moment a failed arm's own words can be trimmed
  // away unnamed again. The old door was `String(e.message).slice(0, 120)`, and
  // Node opens that message with a command echo — so what reached state, the log
  // and HIS card was an absolute path and nothing else. The echo below is built
  // from the arm table and this machine's own node, never typed in, so the
  // measurement is re-taken on every run instead of quoted from a comment.
  {
    const DAY = "2026-08-11";
    const echo = `Command failed: ${process.execPath} ${join(__dirname, RESYNC_ARMS[0].argv[0])} resync`;
    const CHILD = "Error: thalamus door refused POST /afferent — 503, 7 pending items still on the floor";
    // exactly the shape execFileSync throws: the echo in .message, the child's
    // own words ALSO hung on .stderr (which is what this door now spends).
    const nodeErr = () => { const e = new Error(`${echo}\n${CHILD}\n`); e.stderr = `${CHILD}\n`; e.stdout = ""; e.status = 3; return e; };
    console.log(`  · measured now: the mcp-memory arm's command echo is ${echo.length} chars; the old 120-char door left ${Math.max(0, 120 - echo.length - 1)} for the child`);

    assert("THE DOOR — the CHILD's own stderr is what gets recorded, the command echo never enters the record, and .message is the fallback only when there is no stream",
      childSaid(nodeErr()) === CHILD && !/Command failed/.test(clipSaid(childSaid(nodeErr())).text)
      && childSaid({ message: "spawn ENOENT" }) === "spawn ENOENT" && childSaid(null) === "");

    assert("THE DOOR — a cut is NAMED in the text and counted in bytes; anything inside the budget is verbatim and declares nothing",
      (() => { const c = clipSaid("x".repeat(900)); return /chars cut/.test(c.text) && c.bytes === 900; })()
      && (() => { const c = clipSaid(CHILD); return c.text === CHILD && c.bytes === null; })());

    const calls = [];
    const r = await pass({
      dry: true, cortexRow: null, prev: d3.state, now: new Date(`${DAY}T18:00:00Z`), today: DAY, report: null,
      probe: async () => true, procProbe: () => true, launch: () => { },
      exec: (a) => {
        if (a[0] === "harvest.mjs") throw nodeErr();
        if (a[0] === "mcp-memory.mjs") return '{"pending":0,"reposted":0}';
        calls.push(a.join(" ")); return "captains_call: filed c88";
      },
    });
    const row = r.state.resyncs.slice(-1)[0].ran.find((x) => x.cmd === "harvest.mjs resync");
    assert("THE DOOR — a failed arm's diagnosis reaches STATE entire: the cause is there, the path echo is not, and nothing was silently dropped",
      row.ok === false && row.error === CHILD && !/Command failed/.test(row.error) && row.error_bytes === null);
    assert("THE DOOR — …and it survives the NEXT hop unchanged (the verdict must never re-cut what the door already clipped and declared)",
      resyncArmVerdict(row).why === CHILD);
    assert("THE DOOR — HIS card carries the CAUSE and stays ONE line (before this it carried 120 chars of C:\\Program Files\\nodejs\\…)",
      calls.length === 1 && /503, 7 pending items/.test(calls[0])
      && !/Command failed/.test(calls[0]) && !/\n/.test(calls[0]));
    assert("THE DOOR — the operator log shows the whole clipped diagnosis, flattened onto one line, never a shortened one",
      /FAILED — Error: thalamus door refused/.test(resyncLine(r.state)) && !/\n/.test(resyncLine(r.state)));

    // SOURCE TRUTH: the blind cut must not come back — not to this lane and not
    // to the two card receipts beside it, which had the identical shape and the
    // identical damage (captains_call's own path is ~120 chars by itself, so a
    // card that FAILED to file was diagnosed as an absolute path).
    const self = readFileSync(join(__dirname, "daemon_watchdog.mjs"), "utf8");
    const body = self.slice(self.indexOf("async function pass("), self.indexOf("// ── SELFTEST"));
    assert("THE DOOR — no blind .slice(0,120) survives ANYWHERE in pass() or its voices, and every catch here spends the child's stream",
      body.length > 0 && !/slice\(0, ?120\)/.test(body)
      // resync arm + stuck card + stale card, and since the LEDGER BUILD WITNESS
      // (11 Aug 2026) its card too — a fourth ask through the same door, held to
      // the same rule. This count is deliberately exact: a new catch that does
      // NOT spend the child's stream cannot slip in beside them unnoticed.
      && (body.match(/clipSaid\(childSaid\(err?\)\)/g) || []).length === 4);
  }

  // ---- THE DISPATCH IS NOT THE OUTCOME (11 Aug 2026 wire repair) -----------
  // Every check below fails the moment a relaunch failure can be swallowed again,
  // or the operator line goes back to claiming an action off the decision that
  // asked for it. That line ran every 10 minutes and could assert a relaunch that
  // never happened — scripts/daemon_watchdog.log, this organ's only human surface.
  {
    const DAY = "2026-08-11";
    const thalDark = async (port) => port !== 4113;         // :4113 silent, the rest answer
    const boom = await pass({
      dry: true, cortexRow: null, prev: null, now: new Date(`${DAY}T10:00:00Z`), today: DAY, report: null,
      probe: thalDark, procProbe: () => true,
      launch: () => { throw new Error("wscript.exe not found"); },
      exec: () => { throw new Error("nothing may be filed on the FIRST failed dispatch — one reading is not proof"); },
    });
    assert("DISPATCH ≠ OUTCOME — a relaunch that THROWS is recorded WITH its reason, never swallowed by an empty catch",
      boom.state.launched.length === 1 && boom.state.launched[0].name === "thalamus"
      && boom.state.launched[0].ok === false && /wscript\.exe not found/.test(boom.state.launched[0].error));
    assert("DISPATCH ≠ OUTCOME — …and the operator line says THREW; it can no longer print 'relaunched' for a launch that failed",
      /RELAUNCH THREW: thalamus — wscript/.test(launchLine(boom.state))
      && !/DISPATCHED: thalamus/.test(launchLine(boom.state)));
    assert("DISPATCH ≠ OUTCOME — the receipt is out of the LIVENESS map: `ports` holds the five daemons and nothing else",
      Object.keys(boom.state.ports).join(",") === DAEMONS.map((d) => d.name).join(","));

    const calls = [];
    const stuck = await pass({
      dry: true, cortexRow: null, prev: boom.state, now: new Date(`${DAY}T10:10:00Z`), today: DAY, report: null,
      probe: thalDark, procProbe: () => true, launch: () => {},
      exec: (a) => { calls.push(a.join(" ")); return "captains_call: filed c99"; },
    });
    assert("DISPATCH ≠ OUTCOME — the NEXT pass is the proof: dispatched-then-still-dark ⇒ STUCK, and the line says so",
      stuck.state.stuck.map((s) => s.name).join(",") === "thalamus"
      && /STILL DOWN after last pass's relaunch: thalamus/.test(launchLine(stuck.state))
      && /START_DAEMONS\.vbs/.test(launchLine(stuck.state)));
    assert("DISPATCH ≠ OUTCOME — the stuck verdict rides an anchor: ONE card, rolling day-key, through captains_call's OWN cli (never its file, never a kill)",
      calls.length === 1 && calls[0].startsWith("captains_call.mjs file --line ")
      && / --key daemon:stuck:thalamus:2026-08-11$/.test(calls[0])
      && /START_DAEMONS\.vbs/.test(calls[0]) && stuck.state.stuck[0].card === "captains_call: filed c99");

    const back = await pass({
      dry: true, cortexRow: null, prev: boom.state, now: new Date(`${DAY}T10:10:00Z`), today: DAY, report: null,
      probe: async () => true, procProbe: () => true, launch: () => {},
      exec: () => { throw new Error("a daemon that came back must file NOTHING"); },
    });
    assert("DISPATCH ≠ OUTCOME — a relaunch that WORKED is silent: no stuck row, no card, no ask (he is not told about a fixed thing)",
      back.state.stuck.length === 0 && back.state.launched.length === 0 && launchLine(back.state) === "");

    assert("DISPATCH ≠ OUTCOME — a probe we could NOT take is never a stuck verdict (UNKNOWN ≠ failed relaunch)",
      decidePass({ ports: { context: false }, unknown: [], launched: [{ name: "context", ok: true }] },
        { turnstile: true, cortex: true, thalamus: true, brain: true, context: null }, T(10)).actions.stuck.length === 0);
  }

  // ---- THE MORNING REPORT'S READ (10 Aug 2026 wire repair) -----------------
  // Every check below fails the moment conductor.json loses its reader again —
  // which is the whole defect: for weeks the report was correct and unread.
  {
    const DAY = "2026-08-10";
    const rep = {
      started: `${DAY}T09:15:02.000+05:30`, ran: 16, ok: 14, failed: 2,
      steps: [
        { id: "mirror", ok: true },
        { id: "thalamus", ok: false, port: 4113, daemon: "STALE BUILD — running code older than the file on disk", error: "booted 2026-08-08T19:47:26.953Z against a module last written 2026-08-09T17:52:58.217Z; restart it to load the repairs" },
        { id: "cortex", ok: false, port: 4112, daemon: "STALE BUILD — running code older than its module graph (via process table)", error: "booted 2026-08-08T19:47:29.714Z; scripts/brain.mjs last written 2026-08-10T03:16:25.258Z — restart it to load the repairs" },
        { id: "turnstile", ok: true, port: 4111, daemon: "already running (build current — via process table)" },
      ],
    };
    const v = morningDaemonVerdicts(rep, DAY);
    assert("MORNING READ — the live 10 Aug report's BOTH stale daemons are read out, with the conductor's own reason kept",
      v.failed.join(",") === "thalamus,cortex" && v.stale.length === 2
      && v.stale.map((s) => s.name).join(",") === "thalamus,cortex"
      && /module last written/.test(v.stale[0].why) && v.stale[1].port === 4112);

    assert("MORNING READ — a clean chain says nothing, and an absent report is silence not failure (quiet ≠ dead)",
      morningDaemonVerdicts({ started: `${DAY}T09:15:02.000+05:30`, steps: [{ id: "mirror", ok: true }] }, DAY).stale.length === 0
      && morningDaemonVerdicts(null, DAY).stale.length === 0 && morningDaemonVerdicts(null, DAY).day === null);

    assert("MORNING READ — THE DAY GATE: yesterday's STALE verdict never speaks as today's, but its failed steps stay named with their day",
      morningDaemonVerdicts(rep, "2026-08-11").stale.length === 0
      && morningDaemonVerdicts(rep, "2026-08-11").failed.length === 2
      && morningDaemonVerdicts(rep, "2026-08-11").day === DAY);

    const t0 = Date.parse(rep.started);
    assert("MORNING READ — a daemon restarted AFTER the report is VOID; before it still stale; an unknown boot clears NOTHING",
      voidedByRestart(t0, t0 + 60000) === true && voidedByRestart(t0, t0 - 60000) === false
      && voidedByRestart(t0, null) === false && voidedByRestart(null, t0) === false);

    // THE WIRE ITSELF: pass() must read the report and hand each open verdict to
    // captains_call's own CLI — never write the card file, never kill anything.
    const calls = [];
    const r = await pass({
      dry: true, cortexRow: null, prev: null, now: new Date(`${DAY}T18:00:00+05:30`), today: DAY, report: rep,
      probe: async () => true, launch: () => { throw new Error("a stale daemon must never be relaunched — the double-ingest law"); },
      procStart: (rel) => (rel === "scripts/cortex.mjs" ? Date.parse(rep.started) + 3600000 : Date.parse(rep.started) - 3600000),
      exec: (a) => { calls.push(a.join(" ")); return "captains_call: filed c99"; },
    });
    assert("MORNING WIRE — pass() READS conductor.json into state.morning_chain (the whole defect: it was written and never read)",
      r.state.morning_chain && r.state.morning_chain.report_day === DAY
      && r.state.morning_chain.failed.join(",") === "thalamus,cortex" && r.state.morning_chain.stale.length === 2);
    assert("MORNING WIRE — the OPEN verdict rides an anchor: exactly ONE captains_call card, rolling day-key, filed through the OWNER's cli",
      calls.length === 1 && calls[0].startsWith("captains_call.mjs file --line ")
      && / --key daemon:stale:thalamus:2026-08-10$/.test(calls[0]) && /STALE BUILD/.test(calls[0]));
    assert("MORNING WIRE — the daemon restarted since the report is CLEARED and gets NO card (his fix is not re-asked)",
      r.state.morning_chain.stale.find((s) => s.name === "cortex").cleared === true
      && !r.state.morning_chain.stale.find((s) => s.name === "cortex").card
      && r.state.morning_chain.stale.find((s) => s.name === "thalamus").cleared === false);
    assert("MORNING WIRE — the verdict is VISIBLE in both surfaces (pass + status share morningLine), naming the daemon and whose word restarts it",
      /STALE BUILD: thalamus/.test(morningLine(r.state.morning_chain))
      && /HIS word/.test(morningLine(r.state.morning_chain))
      && /cleared by restart since the report: cortex/.test(morningLine(r.state.morning_chain)));
    assert("MORNING WIRE — an unverifiable boot time is marked UNVERIFIED and still asks (never a fabricated all-clear)",
      (await pass({ dry: true, cortexRow: null, prev: null, now: new Date(`${DAY}T18:00:00+05:30`), today: DAY, report: rep,
        probe: async () => true, launch: () => {}, procStart: () => null, exec: () => "ok" }))
        .state.morning_chain.stale.every((s) => s.cleared === false && s.verified === false));
    assert("MORNING WIRE — it reads the REAL receipt path (a rename of conductor.json must break this, loudly)",
      MORNING_REPORT().replace(/\\/g, "/").endsWith("/dressing-room/state/conductor.json"));

    // ---- THE DEGRADED LANE (11 Aug 2026 wire repair) -----------------------
    // Every check here fails the moment conductor.json's `degraded` loses its
    // reader again. The fixture is the 1 Aug scenario in the chain's own shape:
    // the body read dies, and `sheet` (needs: goalkeeper, learningstate — line 84)
    // is built ANYWAY off yesterday's readiness. No daemon is stale, so this walks
    // the early-return path in morningLine, which is exactly where it vanished.
    const degRep = {
      started: `${DAY}T09:15:02.000+05:30`, ran: 4, ok: 3, failed: 1,
      steps: [
        { id: "goalkeeper", ok: false, degraded: null, error: "oura refused a non-persistable verdict" },
        { id: "learningstate", ok: true, degraded: null },
        { id: "sheet", ok: true, degraded: "ran on stale input — goalkeeper failed" },
        { id: "turnstile", ok: true, port: 4111, daemon: "already running (build current — via process table)" },
      ],
    };
    const dv = morningDaemonVerdicts(degRep, DAY);
    assert("DEGRADED LANE — the step that RAN on stale input is read out by name AND by the chain's own reason (ok:TRUE, which is why every old filter missed it)",
      dv.degraded.length === 1 && dv.degraded[0].name === "sheet"
      && dv.degraded[0].why === "ran on stale input — goalkeeper failed"
      && dv.failed.join(",") === "goalkeeper" && dv.stale.length === 0);
    assert("DEGRADED LANE — a FAILED step is never ALSO counted degraded (one defect, named once), and a clean chain's lane is empty",
      morningDaemonVerdicts({ started: degRep.started, steps: [{ id: "sheet", ok: false, degraded: "ran on stale input — goalkeeper failed" }] }, DAY).degraded.length === 0
      && morningDaemonVerdicts({ started: degRep.started, steps: [{ id: "sheet", ok: true, degraded: null }] }, DAY).degraded.length === 0
      && (morningDaemonVerdicts(null, DAY).degraded || []).length === 0);
    assert("DEGRADED LANE — NOT day-gated like STALE: an artefact built on stale input does not go fresh overnight, and the day stays named",
      morningDaemonVerdicts(degRep, "2026-08-11").degraded.length === 1
      && morningDaemonVerdicts(degRep, "2026-08-11").day === DAY);

    const degCalls = [];
    const dr = await pass({
      dry: true, cortexRow: null, prev: null, now: new Date(`${DAY}T18:00:00+05:30`), today: DAY, report: degRep,
      probe: async () => true, launch: () => {}, procStart: () => null,
      exec: (a) => { degCalls.push(a.join(" ")); return "captains_call: filed c99"; },
    });
    assert("DEGRADED WIRE — pass() carries it onto disk in state.morning_chain (the whole defect: conductor wrote it, nobody read it)",
      dr.state.morning_chain.degraded.length === 1 && dr.state.morning_chain.degraded[0].name === "sheet");
    assert("DEGRADED WIRE — IT STATES, IT NEVER ASKS: a degraded step files ZERO cards (probeEveningChain grades its twin INFO, and a re-run is HIS call)",
      degCalls.length === 0);
    assert("DEGRADED WIRE — the verdict is VISIBLE with NO stale daemon in sight — the early-return path where it used to disappear — naming the step and its reason",
      /FAILED goalkeeper/.test(morningLine(dr.state.morning_chain))
      && /DEGRADED: sheet — ran on stale input — goalkeeper failed/.test(morningLine(dr.state.morning_chain))
      && /artefact is on disk/.test(morningLine(dr.state.morning_chain)));
    assert("DEGRADED WIRE — a clean morning stays silent about degradation (no clause, no noise 144 times a day)",
      !/DEGRADED/.test(morningLine(r.state.morning_chain)));

    // ---- THE UNPRODUCED LANE (11 Aug 2026 wire repair) ---------------------
    // The fixture is a step in the shape conductor.mjs ACTUALLY writes on this path:
    // exit 0, error null, stderr null, and the whole explanation in `stale`. That
    // shape is the point — every other field a reader might fall back on is empty,
    // which is why "FAILED goalkeeper" was the entire morning verdict for weeks.
    const unpRep = {
      started: `${DAY}T09:15:02.000+05:30`, ran: 2, ok: 1, failed: 1,
      steps: [
        { id: "goalkeeper", ok: false, exit: 0, error: null, stderr: null, wrote: "readiness.json", produced: false,
          stale: "declared readiness.json but this run did not rewrite it — last written 2026-08-09T03:45:11.000Z, before this step started 2026-08-10T09:15:03.000Z" },
        { id: "sheet", ok: true, degraded: "ran on stale input — goalkeeper failed" },
      ],
    };
    const uv = morningDaemonVerdicts(unpRep, DAY);
    assert("UNPRODUCED LANE — the exit-0-but-did-not-produce step is read out with the chain's own sentence (error AND stderr are null here, so nothing else in the report can say why)",
      uv.unproduced.length === 1 && uv.unproduced[0].name === "goalkeeper"
      && /readiness\.json/.test(uv.unproduced[0].why) && /before this step started/.test(uv.unproduced[0].why)
      && uv.failed.join(",") === "goalkeeper");
    assert("UNPRODUCED LANE — NOT day-gated (a file that was never written does not appear overnight), and a chain with no such step has an empty lane",
      morningDaemonVerdicts(unpRep, "2026-08-11").unproduced.length === 1
      && morningDaemonVerdicts(degRep, DAY).unproduced.length === 0
      && (morningDaemonVerdicts(null, DAY).unproduced || []).length === 0);
    const unpCalls = [];
    const ur = await pass({
      dry: true, cortexRow: null, prev: null, now: new Date(`${DAY}T18:00:00+05:30`), today: DAY, report: unpRep,
      probe: async () => true, launch: () => {}, procStart: () => null,
      exec: (a) => { unpCalls.push(a.join(" ")); return "captains_call: filed c99"; },
    });
    assert("UNPRODUCED WIRE — pass() carries it to disk in state.morning_chain (the whole defect: conductor wrote the sentence, nobody read it)",
      ur.state.morning_chain.unproduced.length === 1 && ur.state.morning_chain.unproduced[0].name === "goalkeeper");
    assert("UNPRODUCED WIRE — morningLine says WHY beside the failed name, and files ZERO cards (it is already named in FAILED; a re-fire is HIS call)",
      /FAILED goalkeeper — declared readiness\.json but this run did not rewrite it/.test(morningLine(ur.state.morning_chain))
      && unpCalls.length === 0);
    assert("UNPRODUCED WIRE — a failure with no such sentence gets no invented why: the FAILED clause stays byte-identical",
      morningLine(dr.state.morning_chain).includes("FAILED goalkeeper ·")
      && morningLine(r.state.morning_chain).includes("FAILED thalamus, cortex ·"));
  }

  // ---- THE LEDGER BUILD WITNESS (11 Aug 2026 wire repair) ------------------
  // Every check below fails the moment this witness stops being able to tell a
  // cache-blind wake row from an honest one — which is the whole defect: the
  // cortex daemon served two wakes on 10 Aug from pre-G1 code, watchman's
  // wake-economy re-fit discarded both, and NOTHING anywhere connected "0/10
  // honest rows" to "the producer is running yesterday's build".
  {
    const DAY = "2026-08-11";
    const OLD = { ts: "2026-08-10T11:33:50.563Z", job: "cortex_wake", engine: "claude", model: "opus", input_tokens: 2, output_tokens: 1115, total_tokens: 1117, ok: true, error: null, limit_hit: false };
    const NEW = { ...OLD, ts: "2026-08-11T09:00:00.000Z", cache_creation_tokens: 0, cache_read_tokens: 0 };

    // SOURCE TRUTH, not prose — the same rule the START_DAEMONS.vbs check above
    // uses. Rename or drop that field in cortex.mjs and this goes red instead of
    // this organ quietly waiting on a key the producer no longer writes.
    const cortexSrc = (() => { try { return readFileSync(join(REPO, "scripts", "cortex.mjs"), "utf8"); } catch { return ""; } })();
    assert("BUILD WITNESS — the key it filters on is a key cortex.mjs ACTUALLY writes on its cortex_wake row, unconditionally (`?? null`, so present even when the meter read nothing)",
      new RegExp(`job:\\s*"cortex_wake"`).test(cortexSrc)
      && new RegExp(`${CORTEX_METER_KEY}:\\s*r\\.${CORTEX_METER_KEY}\\s*\\?\\?\\s*null`).test(cortexSrc));

    assert("BUILD WITNESS — key ABSENT ⇒ pre-meter writer · key present-but-NULL ⇒ honest meter, silence · key present ⇒ silence (a null is a reading, a missing key is an old build)",
      ledgerBuildVerdict(OLD) !== null
      && ledgerBuildVerdict({ ...OLD, cache_read_tokens: null }) === null
      && ledgerBuildVerdict(NEW) === null
      && ledgerBuildVerdict(null) === null);

    assert("BUILD WITNESS — the scan takes the NEWEST cortex_wake row and ignores every other job, so one honest brain row cannot vouch for a stale cortex",
      newestCortexWake([JSON.stringify(NEW), JSON.stringify({ ts: "2026-08-11T09:30:00Z", job: "haiku_pulse", cache_read_tokens: 0 }), JSON.stringify(OLD), "{torn"].join("\n")).ts === OLD.ts
      && newestCortexWake(`${JSON.stringify(OLD)}\n${JSON.stringify(NEW)}`).ts === NEW.ts
      && newestCortexWake("") === null);

    // A stale verdict is a claim about a PAST row, so the restart escape has to
    // hold here exactly as it does for the morning lane.
    const calls = [];
    const runWitness = (row, procMs, port = true) => pass({
      dry: true, cortexRow: row, prev: null, now: new Date(`${DAY}T18:00:00+05:30`), today: DAY, report: null,
      probe: async (p) => (p === 4112 ? port : true), procProbe: () => true, launch: () => {},
      procStart: () => procMs, exec: (a) => { calls.push(a.join(" ")); return "captains_call: filed c99"; },
    });

    const stale2 = await runWitness(OLD, Date.parse("2026-08-08T19:47:29.714Z"));   // his real boot stamp — 22h11m BEFORE G1
    assert("BUILD WITNESS — a cache-blind newest row + a process older than it ⇒ ONE card, on staleCardArgs' own rolling key (so the conductor lane cannot double-ask)",
      stale2.state.ledger_build.cleared === false && stale2.state.ledger_build.verified === true
      && calls.length === 1 && calls[0].startsWith("captains_call.mjs file --line ")
      && calls[0].endsWith(`--key daemon:stale:cortex:${DAY}`));
    assert("BUILD WITNESS — the card names the DAMAGE, not just the symptom: the re-fit it starves and the guess it leaves standing",
      /wake-economy re-fit 0\/10/.test(calls[0]) && /est_tokens_per_wake/.test(calls[0])
      && /aapke word se/.test(calls[0]));
    assert("BUILD WITNESS — the verdict reaches BOTH surfaces through one line function (pass and status), never only one",
      /LEDGER BUILD WITNESS: cortex is serving from pre-meter code/.test(buildWitnessLine(stale2.state.ledger_build))
      && buildWitnessLine(null) === "");

    calls.length = 0;
    const void2 = await runWitness(OLD, Date.parse("2026-08-11T06:00:00Z"));        // restarted since that row
    assert("BUILD WITNESS — voidedByRestart still governs: a process booted AFTER the row is a different process ⇒ verdict VOID, zero cards",
      void2.state.ledger_build.cleared === true && calls.length === 0
      && /verdict VOID/.test(buildWitnessLine(void2.state.ledger_build)));

    calls.length = 0;
    const dark = await runWitness(OLD, Date.parse("2026-08-08T19:47:29.714Z"), false);
    assert("BUILD WITNESS — a DOWN cortex is the relaunch arm's business, not this one: no build verdict, no card, no powershell spawn",
      dark.state.ledger_build === null && calls.length === 0);

    calls.length = 0;
    const healthy = await runWitness(NEW, Date.parse("2026-08-08T19:47:29.714Z"));
    assert("BUILD WITNESS — an honest metered row says NOTHING even from an old process: the meter, not the clock, is the evidence",
      healthy.state.ledger_build === null && calls.length === 0 && buildWitnessLine(healthy.state.ledger_build) === "");

    // The double-ask guard, from the other side: when the morning report has
    // ALREADY carded cortex on this pass, the ledger lane must not spawn again.
    calls.length = 0;
    // started is built from the MACHINE-LOCAL calendar, not a fixed +05:30 instant:
    // this test's premise is "a morning report from TODAY", and localDayOf reads the
    // machine clock — the fixed IST stamp read as YESTERDAY on a UTC runner, the
    // morning lane voided itself, the ledger lane filed its own card, and the
    // stand-down leg below went red in CI while green at home (E1, F9 class).
    const bothRep = { started: new Date(2026, 7, 11, 3, 45, 0).toISOString(), steps: [{ id: "cortex", ok: false, port: 4112, daemon: "STALE BUILD — running code older than its module graph (via process table)", error: "booted …" }] };
    const both = await pass({
      dry: true, cortexRow: OLD, prev: null, now: new Date(`${DAY}T18:00:00+05:30`), today: DAY, report: bothRep,
      probe: async () => true, procProbe: () => true, launch: () => {},
      procStart: () => Date.parse("2026-08-08T19:47:29.714Z"),
      exec: (a) => { calls.push(a.join(" ")); return "captains_call: filed c99"; },
    });
    // The expected day is DERIVED with the code's own localDayOf, not written as ${DAY}:
    // the morning lane keys its card off localDayOf(report.started), and started is
    // 03:45+05:30 — under a UTC clock that is the PREVIOUS local day, so a literal DAY
    // here passed at home and failed in CI (E1, F9 class). Date-derivation correctness
    // is pinned TZ-stably by the fixed-string key assertion above (mid-day input); this
    // assertion's target is the double-ask guard, which must hold under any clock.
    assert("BUILD WITNESS — both witnesses agreeing is still ONE ask: the morning lane cards it, the ledger lane stands down and says so",
      calls.length === 1 && calls[0].endsWith(`--key daemon:stale:cortex:${localDayOf(bothRep.started)}`)
      && /already carded this name on this pass/.test(both.state.ledger_build.card));
  }

  console.log(`\ndaemon_watchdog selftest: ${pass2} passed, ${fail} failed`);
  return fail === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
