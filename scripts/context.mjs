#!/usr/bin/env node
// ============================================================================
// context.mjs · ARSENAL AI FC — THE AMBIENT CONTEXT BRIDGE (working-memory P3)
// ----------------------------------------------------------------------------
// WHAT: graduates ambient sight from presence.mjs's STALL-only reads to a
//   DELTA-only stream: on every app/title CHANGE it POSTs one 'context' afferent
//   to the thalamus (:4113), so every bound moment carries what-app / what-concept
//   he was on. This is the multi-surface RIVER that finally gives the never-fired
//   cortex something to reason over. Metadata only (AW app+title) — NO pixels,
//   never the screen's contents.
// FLOOR: ~60s. "delta-only" = emit iff the window changed since the last emit;
//   the ~60s floor is the poll/scheduler cadence (a resident --daemon poll or a
//   1-min schtasks), so a flapping title can't become a firehose.
// LAWS: single-writer — owns ONLY context_state.json (last window + emit stamp).
//   The thalamus stays the SOLE writer of afferent (context.mjs only POSTs the
//   door). Fail-silent: AW down or thalamus down → no emit, no crash, no tax.
//   ROW 880 (2) (s880b, 14 Nov 2026): the same file also carries the resident's
//   PER-POLL STAMP (poll_ts, pid, boot_ts), written on every poll beside the delta
//   fields and never moving them. Still one file, still this one writer.
//   ROW 897 (s893, 14 Nov 2026): `status` reads the resident off that same stamp
//   (fresh = running, stale = down, missing = unknown), never the process table.
// MODES: node scripts/context.mjs daemon   → THE SANCTIONED PATH: one resident ~60s poll
//                                            ROW 880 (2): `daemon` is now the KEEPER
//                                            (scripts/keeper.mjs, the brain shape) over
//                                            `daemon-worker`, which IS that poll; it
//                                            never exits on its own (see main())
//        node scripts/context.mjs daemon-worker → the poll itself, the keeper's child
//        node scripts/context.mjs once     → one delta check — the manual probe and the
//                                            fallback (its per-minute schtask was DELETED
//                                            9 Aug 2026; see D7 below)
//        node scripts/context.mjs status   → what this bridge is buying, as counters.
//                                            CONSUMED, since 11 Aug 2026, by the
//                                            /organism-doctor skill's step-1 pass — it
//                                            had no caller at all before that (see THE
//                                            WIRE in selftest). Read-only; every other
//                                            verb is screened by MODES near main().
//        node scripts/context.mjs selftest → baked-mock checks (no AW, no net)
//
// #22 (audit 2 Aug 2026, finding 14) — WHY `daemon` IS NOW THE SANCTIONED PATH.
//   Measured: `ArsenalFC-Context` runs `cmd /c cd /d ... && node scripts\context.mjs
//   once` EVERY MINUTE, indefinitely = 1,440 cold cmd+node starts a day, for a
//   measured mean of ~145 actual emits (1,743 over 12 active days). ~1,296 of those
//   spawns are pure no-ops. `daemon` has the identical delta-only semantics, the
//   identical ~60s floor and the identical single-writer law, in ONE process.
//   `once` is NOT deleted — it stays the fallback and the manual probe (layering
//   law), and the scheduler change is a captain/schtasks action, not a code one.
//
// D7 (LADDER, 9 Aug 2026) — THE SWAP HAPPENED. `ArsenalFC-Context` was DELETED and
//   the bridge became the 5th resident daemon: `ArsenalFC-Brain.bat` (the live logon
//   persistence) and `setup/START_DAEMONS.vbs:30` (the manual restart verb) both start
//   `node scripts\context.mjs daemon` through the hidden_run cloak. The installer keeps
//   its retired row as history (INSTALL_CYBORG_TASKS.ps1:65) and tasks_expected.json
//   lists the task designed-ABSENT, so the watchman REDs its resurrection.
//   `status` therefore no longer describes a swap to perform — it READS the live lane.
// ============================================================================
import { readFileSync, existsSync, writeFileSync, renameSync, mkdirSync, realpathSync } from "node:fs";
import { join, dirname, relative, isAbsolute } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
// #22/#6 — the ONE concept canon (concepts.json via capture.mjs's registry), reused
// from presence.mjs rather than copied a third time. A window TITLE is the only place
// the concept he is on ever appears in this stream; a window title word is not a
// concept until the canon says so.
// (presenceTailReport is a FILE-GENERIC jsonl tail reader that happens to live in
// presence.mjs, the organ that needed it first — `status` uses it on afferent.jsonl
// so a health read never parses an unbounded log whole.)
import { canonToken, conceptRegistry, presenceTailReport as jsonlTailReport } from "./presence.mjs";
// D7 — the process-table probe daemon_watchdog.mjs already uses for its four port-locked
// daemons. This bridge holds NO port (it is a poll, not a server), so the command line in
// the process table is the only place "is it up?" is answerable.
// D9 (11 Aug 2026) — newestGraphMtime is the SAME organ's stale-build instrument, the one
// the conductor uses on its three port-daemons and this bridge could never reach. See the
// D9 block above buildVerdict(). No new instrument was written for this repair.
// PROBE HONESTY (11 Aug 2026) — processStartRead is the SAME probe processStartMs has
// always run, reporting whether it actually got to look. See lane() and conductor's own
// block: a killed shell used to arrive here as a bare null and print as a dark bridge.
// ROW 897 (s893, 14 Nov 2026) — SUPERSEDED, kept as history: processStartRead is no longer
// imported. `status`'s lane reads the bridge's OWN per-poll stamp (see lane()), so this file reads
// no process table at all, on any platform. The import was `{ processStartRead, newestGraphMtime }`.
import { newestGraphMtime } from "./conductor.mjs";
// ROW 880 (2) F2 (s880b, 14 Nov 2026) — THE KEEPER, adopted exactly as brain.mjs adopted it
// (brain.mjs:89; forks rows 746 (2) / 753 (2): every resident adopts it "when next touched").
import { keep, KEEP_EXIT } from "./keeper.mjs";
import { judgeHeld } from "./keeper.mjs";   // unit mlv0 (row 1031 M4 A) — the judge round's port: no retire while it is held

const __dirname = dirname(fileURLToPath(import.meta.url));
// THE TEST DOOR (row 880 (2), s880b) — ONE door, for a witness's fixture, and it opens ONLY under
// the OS temp dir. ARSENAL_CONTEXT_STATE_DIR moves this bridge's state dir to a fixture and, only
// then, ARSENAL_CONTEXT_POLL_MS shortens the poll (never below the wait's own 500 ms step). A dir
// that does not resolve under os.tmpdir() is IGNORED, so no env var can re-point or speed up his
// live organ: on his tree the dir is dressing-room/state and the cadence is FLOOR_MS. PURE, so the
// selftest drives it both ways.
export function contextDoor(env = process.env, tmp = tmpdir()) {
  let stateDir = null;
  if (env.ARSENAL_CONTEXT_STATE_DIR) {
    try {
      const real = realpathSync(env.ARSENAL_CONTEXT_STATE_DIR);
      const rel = relative(realpathSync(tmp), real);
      if (rel && rel.split(/[\\/]/)[0] !== ".." && !isAbsolute(rel)) stateDir = real;
    } catch { stateDir = null; }   // a dir that does not exist opens nothing
  }
  const pollMs = stateDir && /^\d+$/.test(String(env.ARSENAL_CONTEXT_POLL_MS || "")) ? Math.max(500, Number(env.ARSENAL_CONTEXT_POLL_MS)) : null;
  return { stateDir, pollMs };
}
const DOOR = contextDoor();
const STATE_DIR = DOOR.stateDir || join(__dirname, "..", "dressing-room", "state");
const CONTEXT_STATE = join(STATE_DIR, "context_state.json");        // own file (gitignored)
const AFFERENT = join(STATE_DIR, "afferent.jsonl");                 // READ-ONLY here (the thalamus owns it)
const LEDGER = join(STATE_DIR, "salience_ledger.jsonl");            // READ-ONLY here (the thalamus owns it) — see fate()
const TASKS_EXPECTED = join(STATE_DIR, "tasks_expected.json");      // READ-ONLY (the watchman's snapshot)
const DAEMONS_VBS = join(__dirname, "..", "setup", "START_DAEMONS.vbs"); // READ-ONLY (the manual restart verb)
const RESIDENT_MATCH = "context.mjs daemon";                        // the full command line, so a `status` run can't detect itself
// ROW 880 (2): under the keeper TWO processes carry RESIDENT_MATCH: the keeper (`context.mjs daemon`,
// which never retires) and its worker (`context.mjs daemon-worker`, the poll). conductor's probe takes
// the FIRST match (conductor.mjs:453), so `status`'s lane probes the WORKER by its own verb: its boot is
// the one D9's build line must compare. The restart-verb check still reads RESIDENT_MATCH off the .vbs.
// ROW 897 (s893, 14 Nov 2026) — SUPERSEDED, kept as history: `const WORKER_MATCH = "context.mjs
// daemon-worker"` is gone with the probe it fed. The lane now reads the stamp, and only the WORKER
// writes the stamp (stampPoll in `daemon-worker`), so its pid and boot_ts are the worker's by birth.
const AW = process.env.AW_API_BASE || process.env.ARSENAL_AW || "http://localhost:5600";   // unit mpres F7 A: ONE name, AW_API_BASE; ARSENAL_AW (this organ's old name) read as an alias
const THALAMUS = process.env.ARSENAL_THALAMUS || "http://127.0.0.1:4113";
const FLOOR_MS = 60000;                                             // resident poll cadence (~60s floor)
// ROW 880 (2) F1 — the bridge's OWN cadence, exported, and ONE freshness rule derived from it. The
// watchdog imports both (derive, never type): a stamp no older than three polls is FRESH (UP), an
// older one is STALE (DOWN), and an absent / unparseable / poll_ts-less stamp is UNKNOWN, never green.
export const CONTEXT_POLL_MS = DOOR.pollMs || FLOOR_MS;
export const STAMP_FRESH_MS = 3 * CONTEXT_POLL_MS;

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
function writeAtomic(p, obj) { mkdirSync(dirname(p), { recursive: true }); const tmp = p + "." + process.pid + ".tmp"; writeFileSync(tmp, JSON.stringify(obj, null, 2)); renameSync(tmp, p); }
const clip = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

// ---------------------------------------------------------------------------
// ROW 880 (2) F1 (s880b, 14 Nov 2026) — THE BRIDGE IS SEEN BY ITS OWN STAMP
// ---------------------------------------------------------------------------
// MEASURED (row 880, lane S): daemon_watchdog read this portless bridge off the Win32_Process
// COMMAND LINE, and to his non-elevated account the command line of a process owned by the
// service account `.\arsenal-svc` reads NULL (the 14 Nov query found nothing for the live
// cortex and thalamus either). So the bridge read DOWN alive or dead. The one reader that is
// never blind to this process is this process: every poll it stamps its own file with
// `poll_ts` (ISO), `pid` and `boot_ts`, emit or no emit, and the watchdog reads the stamp.
// The delta law is untouched: app / title / emit_ts move only on a window CHANGE (sense()).
// context_state.json is gitignored on his tree (checked 14 Nov), so a per-poll write moves
// nothing in git.
// law-waiver:jugad the bridge stamp's own three KEYS, a closed schema stampOf / withStamp read and the S880B asserts pin, never a subject list (forks row 649 (0))
const STAMP_KEYS = ["poll_ts", "pid", "boot_ts"];

// PURE. The stamp ONLY, never app/title: a reader of liveness has no business with his window.
export function stampOf(st) {
  if (!st || typeof st !== "object" || !STAMP_KEYS.some((k) => st[k] !== undefined)) return null;
  return { poll_ts: st.poll_ts ?? null, pid: st.pid ?? null, boot_ts: st.boot_ts ?? null };
}
// The stamp as it stands on disk; null for no file, an unparseable file, or a file with no stamp.
export const readStamp = (file = CONTEXT_STATE) => stampOf(readJson(file));

// PURE. A NEW object: the stamp keys replaced, every other field (app, title, emit_ts,
// daemon_fault) carried through verbatim. `stamp` null strips the keys.
export function withStamp(prev, stamp) {
  const base = prev && typeof prev === "object" ? { ...prev } : {};
  for (const k of STAMP_KEYS) delete base[k];
  return stamp ? { ...base, poll_ts: stamp.poll_ts, pid: stamp.pid, boot_ts: stamp.boot_ts } : base;
}

// THE ONE FRESHNESS RULE. true = FRESH (UP) · false = STALE (DOWN) · null = UNKNOWN, never green:
// no stamp, no poll_ts, an unreadable poll_ts, or one further in the FUTURE than the bound (a
// clock that moved is not a reading). `now` is a Date or epoch ms.
export function stampLiveness(stamp, now = Date.now()) {
  const t = stamp && typeof stamp.poll_ts === "string" ? Date.parse(stamp.poll_ts) : NaN;
  const n = now instanceof Date ? now.getTime() : Number(now);
  if (!Number.isFinite(t) || !Number.isFinite(n)) return null;
  const age = n - t;
  if (age < -STAMP_FRESH_MS) return null;
  return age <= STAMP_FRESH_MS;
}

// ALIVE by the brief's rule: process.kill(pid, 0) succeeds, or throws EPERM (a process another
// account owns, e.g. the service's) → alive; ESRCH, or anything else → dead.
export function pidAlive(pid, kill = (p, s) => process.kill(p, s)) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { kill(pid, 0); return true; } catch (e) { return !!(e && e.code === "EPERM"); }
}

// THE PORTLESS SINGLETON. This bridge holds no port, so its keeper cannot bind-test it
// (keeper.mjs:91 skips the test when port is null), and START_DAEMONS.vbs:33 can start a second
// keeper beside the service's. Another resident IS the bridge iff its stamp is FRESH, its pid is
// not this process, and that pid is ALIVE: then this worker exits KEEP_EXIT.ALREADY_RESIDENT (69)
// and its keeper waits a poll (keeper.mjs:54). A fresh stamp of a DEAD pid (the worker that just
// retired) or this process's own stamp → this worker runs. Returns the other pid, or null.
export function otherResident(stamp, { now = Date.now(), pid = process.pid, alive = pidAlive } = {}) {
  if (stampLiveness(stamp, now) !== true) return null;
  const p = Number(stamp.pid);
  if (!Number.isInteger(p) || p <= 0 || p === pid) return null;
  return alive(p) ? p : null;
}

// One poll's stamp, deps-injected so the selftest drives it with no disk. The worker calls it on
// EVERY poll, after the poll's own try/catch, so a faulting poll stamps too: the stamp says the
// loop TURNS, D10's daemon_fault block says whether it WORKS.
function stampPoll({ bootMs, now = new Date(), pid = process.pid, load = () => readJson(CONTEXT_STATE), save = (o) => writeAtomic(CONTEXT_STATE, o) } = {}) {
  const next = withStamp(load(), { poll_ts: now.toISOString(), pid, boot_ts: new Date(bootMs).toISOString() });
  save(next);
  return next;
}

// ---------------------------------------------------------------------------
// D8 (WIRING AUDIT, 10 Aug 2026) — A CUT MUST NAME ITSELF AT THE DOOR
// ---------------------------------------------------------------------------
// MEASURED on the live bus, not inferred: of 3,000 `context` rows in afferent.jsonl,
// 19 sit at EXACTLY 200 characters of `title` and 16 at exactly 240 of `text` — and
// the longest title in the whole file is 200, the longest text 240. That is the CAP
// speaking, not the data. Not one of those rows carries a field saying so. One of
// them is a real question of his, sheared mid-word:
//   "…i can buy helium 10 platinum as well and want to first work w"
// Every receiver read that stub as the whole title: the thalamus tokenizes `evt.text`
// for concept/capsule matching (thalamus.mjs:530/867/934) and binds it into
// bound_context (:837); the distiller renders the window line from `last.title`
// (distiller.mjs:106). None of them could know a word was missing.
//
// THE CAPS THEMSELVES DO NOT MOVE. 200/240 are what this door has always shipped, the
// distiller re-clamps to 120 of its own accord, and picking a bigger number here would
// be a guessed number — his standing rule. What was missing was never ROOM, it was
// HONESTY. clipNamed returns the identical string clip() has always produced, plus the
// raw length and whether anything was lost, so the cut travels WITH the row.
// (No engine is replaced, so nothing is frozen *Legacy: clip() is untouched and still
// serves the display path in status().)
const TITLE_CAP = 200;   // verbatim, the value this door has shipped since the bridge was built
const TEXT_CAP = 240;    // ditto — measured above as the live ceiling, not a new choice
const clipNamed = (s, n) => {
  const raw = String(s || "").replace(/\s+/g, " ").trim();   // same normalisation clip() does
  return { value: raw.slice(0, n), len: raw.length, truncated: raw.length > n };
};

// pull the CURRENT window (app + title) from ActivityWatch — metadata, never pixels
async function currentWindow(deps = {}) {
  const fetchFn = deps.fetch || fetch;
  try {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 1500);
    const buckets = await (await fetchFn(`${AW}/api/0/buckets`, { signal: ctrl.signal })).json();
    const win = Object.keys(buckets || {}).find(b => b.startsWith("aw-watcher-window"));
    if (!win) { clearTimeout(to); return null; }
    const events = await (await fetchFn(`${AW}/api/0/buckets/${encodeURIComponent(win)}/events?limit=1`, { signal: ctrl.signal })).json();
    clearTimeout(to);
    const e = Array.isArray(events) && events[0];
    if (!e || !e.data) return null;
    return { app: String(e.data.app || ""), title: String(e.data.title || "") };
  } catch { return null; }
}

async function defaultPost(evt, deps = {}) {
  const fetchFn = deps.fetch || fetch;
  try {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 400);
    const r = await fetchFn(THALAMUS + "/afferent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(evt), signal: ctrl.signal });
    clearTimeout(to); return !!(r && r.ok);
  } catch { return false; }
}

// ---------------------------------------------------------------------------
// #22 — THE CONCEPT IN THE TITLE MUST REACH THE SCORER
// ---------------------------------------------------------------------------
// Measured over 1,743 live context afferents: 17 distinct event_keys, ALL app-only
// (`context:chrome.exe` 663, `context:WindowsTerminal.exe` 542, `context:claude.exe`
// 342), because the key was built from `win.app` alone. Habituation (thalamus
// signalKey) therefore saturated per-APP: hours on one concept and hours of idle
// tab-flipping in the same browser were the same signal, and the concept sitting in
// the title never reached the scorer at all.
//
// THE TRAP, from the audit's own verifier (CORRECTION 3), which this deliberately
// avoids: putting the RAW title into the key/tokens would push `system32`, `cmd`,
// `Terminal` into the thalamus's `seen` vocabulary — permanently poisoning the
// concept namespace used by novelty and by capsule/pre-answer matching — and would
// explode the habituation map to thousands of keys. So the title is admitted ONLY
// through the canon: a registered concept/skill id, or nothing at all.
//   · title canonicalizes  → `context:<app>:<concept>` + concept_tokens [<concept>]
//   · title is just chrome → `context:<app>` VERBATIM, concept_tokens [] — today's
//     behaviour, byte for byte, so nothing about the quiet case changes.
// Honest by construction: an empty array is an empty array (#4).
function conceptOfTitle(title, deps = {}) {
  const reg = deps.registry !== undefined ? deps.registry : conceptRegistry();
  for (const w of String(title || "").toLowerCase().split(/[^a-z0-9_]+/)) {
    if (w.length <= 3) continue;                       // same >3-char floor the rest of the organism uses
    const id = canonToken(w, reg);
    if (id) return id;
  }
  return null;
}

// THE DELTA DECISION (deps-injected for tests) — emit iff the window CHANGED since the
// last emit. On emit: POST a 'context' afferent + record the new state. Returns
// { emitted, posted?, evt?, state, reason? }.
async function sense(deps = {}) {
  const now = deps.now || new Date();
  const win = deps.window !== undefined ? deps.window : await currentWindow(deps);
  const prev = deps.prev !== undefined ? deps.prev : readJson(CONTEXT_STATE);
  if (!win || !win.app) return { emitted: false, reason: "no-window", state: prev };
  const changed = !prev || prev.app !== win.app || prev.title !== win.title;
  if (!changed) return { emitted: false, reason: "no-change", state: prev };
  const concept = conceptOfTitle(win.title, deps);     // #22 — still on the RAW title, BEFORE any cut
  const t = clipNamed(win.title, TITLE_CAP);
  const x = clipNamed(`${win.app} · ${win.title}`, TEXT_CAP);
  const evt = {
    modality: "context", source: "activitywatch",
    app: win.app, title: t.value,
    text: x.value,
    // D8 — the cut, NAMED, and ALWAYS emitted both ways. `false` here is a MEASURED
    // "nothing was lost"; a row from before 10 Aug 2026 has no such field at all and
    // the honest answer there is UNKNOWN. Three states, never two — the same law
    // setpiece.mjs:1199 keeps ("UNKNOWN is a real THIRD producer state"). The lengths
    // are the raw, pre-cut char counts, so a receiver can see HOW MUCH it is missing.
    title_len: t.len, title_truncated: t.truncated,
    text_len: x.len, text_truncated: x.truncated,
    concept_tokens: concept ? [concept] : [],          // canon ids only — never a raw window word
    concept_source: concept ? "window-title-canon" : "none",
    event_key: concept ? `context:${win.app}:${concept}` : `context:${win.app}`, ts: now.toISOString(),
  };
  const posted = await (deps.post || ((e) => defaultPost(e, deps)))(evt);
  // ONLY advance state when the afferent actually LANDED. If the thalamus was momentarily
  // down (posted === false), leave prev untouched so the NEXT poll re-detects this same
  // change and retries — self-healing (e.g. a daemon that booted before the thalamus).
  // Advancing on a failed post would drop that window's context afferent forever.
  const state = { app: win.app, title: win.title, emit_ts: now.toISOString() };
  // ROW 880 (2): the default save carries the resident's per-poll stamp through, so an emit (or a
  // `once` run beside the resident) never blanks the liveness the watchdog reads. `state` is still
  // exactly the delta fields, and an emit still drops daemon_fault (D10).
  if (posted) (deps.save || ((o) => writeAtomic(CONTEXT_STATE, withStamp(o, stampOf(readJson(CONTEXT_STATE))))))(state);
  return { emitted: posted, posted, evt, state, reason: posted ? undefined : "post-failed-will-retry" };
}

// ---------------------------------------------------------------------------
// #22/#106 — WHAT THIS BRIDGE IS BUYING, AS COUNTERS (never the word "ok")
// ---------------------------------------------------------------------------
// SCAN_ROWS is a scan WINDOW, not a budget: `complete:false` says out loud when the
// history ran deeper than the scan, so a short look is never reported as a total.
const SCAN_ROWS = 2000;

// ---------------------------------------------------------------------------
// D7 — THE LANE IS READ LIVE, NEVER ASSERTED IN PROSE (10 Aug 2026)
// ---------------------------------------------------------------------------
// Until today `status` printed, on EVERY run, "The scheduler still runs the legacy
// lane" plus a `schtasks /Change /TN ArsenalFC-Context …` line for him to type. Both
// had been false since 9 Aug: the task was deleted (verified — `schtasks /Query /TN
// ArsenalFC-Context` → "ERROR: The system cannot find the file specified.") and the
// resident daemon had been the live lane for a day (PID 21308, `node scripts\context.mjs
// daemon`). So the organ's ONLY health surface stated a false fact about his running
// system and handed him a command that errors — a command-to-remember for a task that
// no longer exists, which the anchor law forbids.
// The repair is not fresher prose (prose rots on the next schedule change, which is how
// this line died). The lane is DERIVED from the authorities that already exist:
//   · the PROCESS TABLE via conductor.mjs's exported processStartRead — is the bridge up
//     (it was processStartMs until 11 Aug 2026; see the PROBE HONESTY note in lane());
//   · setup/START_DAEMONS.vbs — would a restart bring it back;
//   · tasks_expected.json `designed_absent` — the same snapshot watchman.mjs:826 REDs
//     the task's resurrection from. Read-only in all three; this organ owns only
//     context_state.json.
// ROW 897 (s893, 14 Nov 2026) — SUPERSEDED, kept as history: the first authority above is now the
// bridge's OWN STAMP (context_state.json poll_ts / pid / boot_ts, judged by stampLiveness), never
// the process table. See the ROW 897 block in lane().
// Facts only, never an imperative: selftest asserts the printed lines carry no command.
// ---------------------------------------------------------------------------
// D9 (WIRING AUDIT, 11 Aug 2026) — A RESIDENT THAT OUTLIVES ITS OWN CODE
// ---------------------------------------------------------------------------
// The organism's ONE stale-build detector lives in conductor.mjs (the `if (up)` arm of
// its daemon step) and it structurally cannot see this bridge: that arm is reached only
// from a chain step carrying `daemon: { port }`, entered via `probe(step.daemon.port)`,
// and MORNING holds exactly three of those — thalamus/cortex/turnstile. This bridge opens
// no server, so it is in no such table and gets no build check at all. daemon_watchdog.mjs
// added it to the LIVENESS table on 10 Aug (DAEMONS, via `match`), and that file's own
// header says exactly what liveness buys: "up is not current". Its stale lane only RELAYS
// verdicts it reads back out of conductor.json (morningDaemonVerdicts), so a daemon the
// conductor never probes can never appear in it.
//
// MEASURED the hour this was written, 11 Aug 2026, off this box's own process table:
// the live bridge booted 2026-08-09T07:38:39Z, and the newest file in its module graph
// (scripts/conductor.mjs) was written 2026-08-11T00:23:56Z. ~41 hours of a resident
// emitting on code the repo had already moved past — no card, no RED, no line anywhere.
//
// THE FIX IS THE ONE THIS ORGANISM ALREADY BLESSED, not a new one. brain.mjs's daemon
// retires itself the moment a file in its own source graph is written after its boot
// (the KAAM 1 scar, 10 Aug 2026 — "an ESM process cannot reload its code, so staying up
// means running the OLD brain"), and daemon_watchdog.mjs relaunches it on the new code.
// Same sentence, same instruments: the graph comes from conductor.mjs's exported
// newestGraphMtime (the whole IMPORT GRAPH, not just the entry file — audit #108's own
// correction, after a repaired dependency left a genuinely stale daemon reading "build
// current"), and the comparison is the exact `>` the conductor makes, whose comment
// records why there is no tolerance to invent: five consecutive live reads, delta 0.
//
// THE COST, NAMED. This bridge is PORTLESS, so the watchdog relaunches it only after TWO
// consecutive down passes (its decidePass rule — a portless double-start would double-POST
// the thalamus door, the very damage that entry exists to prevent) = up to ~20 min without
// ambient sight after a retire, against days of a frozen bridge. And an edit to ANY file
// in the graph retires it, not just this one: watching only the entry file is precisely
// the defect audit #108 found in the conductor's first cut.
//
// SUPERSEDED BY ROW 880 (2) (s880b, 14 Nov 2026), kept as history: the two relaunch sentences
// above ("daemon_watchdog.mjs relaunches it on the new code", "up to ~20 min without ambient
// sight") stopped being true on 28 Aug, when S9 made the watchdog a reporter. MEASURED since:
// 12 retires, each followed by WinSW's "Failed to open the service control manager database.
// Access is denied" and a wrapper with no child, 544.5 h dark in total. Now the retiring worker
// exits KEEP_EXIT.RETIRED (75) and its keeper (scripts/keeper.mjs) respawns it AT ONCE on the
// new code; the process the OS launched (`daemon`) never exits on its own. The retire rule
// itself (the whole graph, conductor's `>`, no tolerance) is unchanged.
//
// IT NEVER ASKS, AND THE ONLY PROCESS IT EVER STOPS IS ITSELF.
const SELF_REL = "scripts/context.mjs";     // the graph root, in the repo-relative shape conductor's probes take

// Fail-soft like every other read in this file: a graph that cannot be walked is UNKNOWN,
// never an implicit all-clear (buildVerdict turns it into checked:false).
function graphNow(deps = {}) {
  if (deps.graph !== undefined) return deps.graph;
  try { return newestGraphMtime(SELF_REL); } catch { return { ms: null, file: null }; }
}

// PURE, and shared by BOTH callers — the daemon's retirement check and `status`'s printed
// line — so the running organ and the health surface can never drift into two answers.
// UNKNOWN is its own state and is never "current": an unreadable graph must not license a
// stale resident to keep emitting, and must not fabricate a stale verdict either. Both
// callers report `checked:false` as UNVERIFIED, the same honest unknown the conductor
// prints when a daemon has no /status stamp.
export function buildVerdict(bootMs, graph) {
  const ms = graph && graph.ms != null ? graph.ms : null;
  const file = (graph && graph.file) || null;
  if (bootMs == null || ms == null) return { checked: false, stale: null, booted_ms: bootMs == null ? null : bootMs, newest_file: file, newest_ms: ms };
  return { checked: true, stale: ms > bootMs, booted_ms: bootMs, newest_file: file, newest_ms: ms };
}

// ---------------------------------------------------------------------------
// D10 (WIRING AUDIT, 11 Aug 2026) — A WEDGED POLL MUST NOT LOOK LIKE A QUIET ONE
// ---------------------------------------------------------------------------
// MEASURED in this file, before this repair: the daemon arm's ENTIRE error path was
// `catch { /* never taxes */ }` — no counter, no console line, nothing on disk. Only
// an EMIT ever printed. So all three ways this loop can break look identical to the
// organism, and identical to a captain who simply did not change windows:
//   · sense() throws every poll (an AW client change, an unreadable registry, an ESM
//     error anywhere in the import graph) — the process keeps its PID and emits nothing;
//   · writeAtomic() on context_state.json throws — state never advances, so the SAME
//     window re-POSTs the thalamus door every 60s for as long as it lasts;
//   · anything unforeseen — swallowed by the same empty catch.
// Every liveness surface reads UP through all three: daemon_watchdog.mjs probes the
// PROCESS TABLE (processProbe, :75 — "up is not current", and up is not WORKING either),
// physio bleeds daemon_watchdog.json, and the conductor never probes a portless daemon
// at all. Ambient sight could go dark for days with no surface anywhere able to say so.
//
// THE WIRE IS ONE THAT ALREADY EXISTS — no new file, no new organ. The fault is recorded
// in context_state.json, the ONLY file this bridge owns, and read back out by `status`,
// which has had a live caller since earlier today (the /organism-doctor step-1 pass,
// pinned by THE WIRE assertions in the selftest). The console line goes to
// scripts/context.log through the VBS cloak — the forensic lane, and NO organ reads that
// log (`grep -rn "context.log" --include=*.mjs .` → awayday.mjs quotes it in a comment,
// nothing opens it), which is exactly why the on-disk counter had to exist too.
//
// NO THRESHOLD IS INVENTED. This counts consecutive faults and stamps them. It does not
// decide how many is "wedged", does not retire the resident, and does not ask the watchdog
// to relaunch anything — that is a policy number, and numbers here wait for real data (his
// standing rule). The reader draws the conclusion, same law as DOWNSTREAM and the build line.
//
// THE DELTA FIELDS ARE CARRIED THROUGH VERBATIM. A fault must never move `app`/`title`/
// `emit_ts`, or the retry law above (never advance state on a failed post) would be broken
// by the very code reporting the failure. withFault() is the only shape that touches them.
const FAULT_MSG_CAP = TITLE_CAP;   // 200 — the cap this door already ships a title at, reused; not a new number

// PURE. `fault` null = clear the block. Returns a NEW object; the delta fields ride through
// untouched, and a state file that never had the block is unchanged by a clear.
export function withFault(prev, fault) {
  const base = prev && typeof prev === "object" ? { ...prev } : {};
  delete base.daemon_fault;
  return fault ? { ...base, daemon_fault: fault } : base;
}

// PURE. Builds the next block from the one on disk, so a streak SURVIVES the poll that
// could not write (and survives a relaunch mid-streak: `since` is the first sighting,
// `pid` is whoever is reporting now — a new resident that polls cleanly clears it anyway).
export function faultNote(prev, err, nowIso, pid) {
  const had = prev && prev.daemon_fault ? prev.daemon_fault : null;
  const msg = String((err && err.message) || err || "unknown").replace(/\s+/g, " ").trim().slice(0, FAULT_MSG_CAP);
  return {
    consecutive: (had && Number.isFinite(had.consecutive) ? had.consecutive : 0) + 1,
    since: (had && had.since) || nowIso,
    last_ts: nowIso,
    last_error: msg,
    pid,
  };
}

function lane(deps = {}) {
  const expected = deps.expected !== undefined ? deps.expected : readJson(TASKS_EXPECTED);
  const note = (expected && expected.designed_absent && expected.designed_absent["ArsenalFC-Context"]) || null;
  // The probe shells PowerShell (Win32_Process). On a non-Windows checkout — the away-day
  // CI shape — there is no process table to read, and "I could not look" must never print
  // as "it is down". null = UNKNOWN, and it says so.
  // PROBE HONESTY (11 Aug 2026) — a probe KILLED before it could read the table is not a
  // dark bridge. This line used to take processStartMs's bare null and print "NOT IN THE
  // PROCESS TABLE — the bridge is dark, nothing is emitting ambient context" over a
  // resident that was up and emitting, roughly one run in three (the Get-CimInstance cost
  // straddles that probe's 5s cap — see conductor.mjs's D10 block for the measurements).
  // `looked:false` folds into the SAME UNKNOWN this function already reports off Windows,
  // with the reason carried so the surface can say which unknown it is.
  // ROW 897 (s893, 14 Nov 2026) — F1 FOLDED (s880b's FORK F1): THE LANE READS THE BRIDGE'S OWN STAMP.
  // SUPERSEDED, kept as history (layer, never replace): until today the block here read the PROCESS
  // TABLE, `processStartRead("context.mjs daemon-worker")` on win32 only, with `residentStartMs` and
  // `procRead` as its test doors. MEASURED (row 880, lane S): to his non-elevated account the command
  // line of a process owned by the service account `.\arsenal-svc` reads NULL, so the service-run
  // bridge printed "NOT IN THE PROCESS TABLE" alive or dead, and off Windows this line could never
  // look at all. The worker stamps context_state.json on EVERY poll (stampPoll: poll_ts, pid,
  // boot_ts) and daemon_watchdog already judges that stamp by the ONE freshness rule; `status` now
  // reads the same stamp by the same rule (stampLiveness), so the health surface and the watchdog
  // can never hold two answers: FRESH = running (UP since its boot_ts) · STALE = down · missing / no
  // readable poll_ts / a clock that moved = UNKNOWN, never green and never down. PURE when `stamp`
  // and `now` are injected (the selftest's doors). No process table is read here, on any platform.
  const nowMs = deps.now !== undefined ? new Date(deps.now).getTime() : Date.now();
  const stamp = deps.stamp !== undefined ? deps.stamp : readStamp();
  const live = stampLiveness(stamp, nowMs);
  const pollMs = stamp && typeof stamp.poll_ts === "string" ? Date.parse(stamp.poll_ts) : NaN;
  const bootMs = live === true && typeof stamp.boot_ts === "string" && Number.isFinite(Date.parse(stamp.boot_ts)) ? Date.parse(stamp.boot_ts) : null;
  const vbs = deps.vbs !== undefined ? deps.vbs
    : (existsSync(DAEMONS_VBS) ? (() => { try { return readFileSync(DAEMONS_VBS, "utf8"); } catch { return null; } })() : null);
  return {
    platform: process.platform,
    probe: "stamp",
    resident_running: live,
    resident_since: bootMs != null ? new Date(bootMs).toISOString() : null,
    resident_pid: live === true && Number.isInteger(stamp.pid) ? stamp.pid : null,
    stamp_poll_ts: Number.isFinite(pollMs) ? stamp.poll_ts : null,
    stamp_age_s: Number.isFinite(pollMs) && Number.isFinite(nowMs) ? Math.round((nowMs - pollMs) / 1000) : null,
    stamp_bound_s: STAMP_FRESH_MS / 1000,
    // WHICH unknown this is (null unless resident_running is null). Until row 897 it was the process
    // probe's spawnSync reason (ETIMEDOUT the measured one), or null off Windows.
    probe_reason: live !== null ? null
      : !stamp ? "context_state.json holds no stamp"
        : !Number.isFinite(pollMs) ? "its stamp has no readable poll_ts"
          : !Number.isFinite(nowMs) ? "there is no readable clock to judge it by"
            : "its poll_ts lies further in the future than the bound (a clock moved)",
    restart_verb_wired: vbs == null ? null : vbs.includes(RESIDENT_MATCH),
    per_minute_task_designed_absent: !!note,
    designed_absent_note: note,
    // D9 — IS THE RUNNING BRIDGE THE BRIDGE ON DISK? The resident retires itself within a
    // poll (see main's daemon arm), so this normally reads `current`; it reads STALE in the
    // window before the next poll, and — the case that actually matters — on a resident
    // whose loop is wedged and can never retire itself. The boot stamp is the same process
    // table reading this lane already took, so the answer costs one graph walk and no new
    // probe. UNVERIFIED whenever either side is unreadable, never a fabricated all-clear.
    // ROW 897 (s893): the boot is the STAMP's boot_ts now (the worker's own BOOT_MS, the instant D9
    // always meant), read only off a FRESH stamp: a stale one has no running build to compare, and
    // an unknown one is UNVERIFIED. It was the process table's start stamp (`startedMs`).
    build: buildVerdict(bootMs, graphNow(deps)),
  };
}

// ---------------------------------------------------------------------------
// WIRING AUDIT (10 Aug 2026) — THE COUNTER MUST BE ABLE TO SEE ITS OWN DEAD WIRE
// ---------------------------------------------------------------------------
// Everything `status` counted was about whether this bridge SPEAKS — emits/day, concept
// coverage, distinct habituation keys, last emit. Nothing about whether anything HEARD.
// So it read healthy for weeks over a wire that never reached its stated target: MEASURED
// this run, salience_ledger.jsonl holds 2,999 moments whose modalities include `context`
// and ALL 2,999 came back outcome:"reflex" (highest S ever 0.244, against a tau1_eff that
// never fell below 0.40); of the 48 moments in the ledger that DID leave reflex, not one
// carries `context`, so wake_queue.jsonl's 38 rows hold zero. A producer health-read that
// cannot say "0 of N crossed" is exactly how a dead wire keeps its green light — the same
// shape as the recital audit that was written every turn and read by nobody.
// READ-ONLY on salience_ledger.jsonl: the thalamus is its sole writer and stays it.
// NO THRESHOLD and NO VERDICT is added here — the ceiling actually reached and the bar
// actually faced are both counters, and a "healthy/unhealthy" line would be a guessed
// number. The reader draws the conclusion; this only makes it visible.
function fate(deps = {}) {
  const rep = deps.ledgerRep !== undefined ? deps.ledgerRep : jsonlTailReport(SCAN_ROWS, { file: LEDGER });
  // the ledger keys the modality LIST (thalamus.mjs:843 `modalities`), not `modality` —
  // a bound moment can carry several, and context rides as one of them.
  const ctx = rep.rows.filter(r => r && Array.isArray(r.modalities) && r.modalities.includes("context"));
  const crossed = ctx.filter(r => r.outcome && r.outcome !== "reflex");
  const sVals = ctx.map(r => Number(r.S)).filter(Number.isFinite);
  const tVals = ctx.map(r => Number(r.tau1_eff)).filter(Number.isFinite);
  return {
    scored_moments: ctx.length,
    left_reflex: crossed.length,
    outcomes: [...new Set(crossed.map(r => String(r.outcome)))],
    max_S: sVals.length ? Math.max(...sVals) : null,
    min_tau1_eff: tVals.length ? Math.min(...tVals) : null,
    ledger_scan_complete: rep.complete,
  };
}

function status(deps = {}) {
  const rep = deps.rep || jsonlTailReport(SCAN_ROWS, { file: AFFERENT });
  const ctx = rep.rows.filter(r => r && r.modality === "context");
  const keys = new Set(ctx.map(r => String(r.event_key || "")));
  const conceptKeys = [...keys].filter(k => k.split(":").length > 2);
  const withConcept = ctx.filter(r => Array.isArray(r.concept_tokens) && r.concept_tokens.length).length;
  // D8 — THE FLAG HAS A READER FROM THE HOUR IT WAS BORN. A producer with no consumer is
  // a black box, which is the exact defect this repair exists to end: the cut is counted
  // here, on the organ's own health surface, so a door that starts shearing his titles
  // shows up as a number instead of as silence. Rows with no flag are the pre-D8 history
  // and are counted SEPARATELY as unknown — never folded into "clean".
  const cutRows = ctx.filter(r => r.title_truncated === true || r.text_truncated === true).length;
  const unknownCut = ctx.filter(r => r.title_truncated === undefined).length;
  const longestRaw = ctx.reduce((m, r) => (Number.isFinite(r.title_len) && r.title_len > m ? r.title_len : m), 0);
  const days = new Set(ctx.map(r => String(r.ts || "").slice(0, 10)).filter(Boolean));
  const st = deps.state !== undefined ? deps.state : readJson(CONTEXT_STATE);
  const nowMs = (deps.now ? new Date(deps.now) : new Date()).getTime();
  const emitMs = st && st.emit_ts ? Date.parse(st.emit_ts) : NaN;
  return {
    scanned_rows: rep.rows.length, scan_complete: rep.complete,
    context_rows: ctx.length, active_days: days.size,
    emits_per_day: days.size ? Math.round(ctx.length / days.size) : 0,
    distinct_keys: keys.size, concept_bearing_keys: conceptKeys.length,
    rows_with_concept: withConcept, rows_total: ctx.length,
    rows_title_or_text_cut: cutRows, rows_cut_unknown: unknownCut, longest_raw_title_len: longestRaw,
    title_cap: TITLE_CAP, text_cap: TEXT_CAP,
    // its OWN file — the last window it actually shipped, as a stamp and a raw age.
    // No freshness threshold lives here: an age is a counter, a verdict would be a
    // guessed number (his standing rule).
    last_emit: st && st.emit_ts ? st.emit_ts : null,
    last_emit_age_min: Number.isFinite(emitMs) ? Math.round((nowMs - emitMs) / 60000) : null,
    last_window: st && st.app ? `${st.app} · ${clip(st.title, 60)}` : null,
    // D10 — the loop's own fault block, straight off the file this bridge owns. Counters
    // and stamps, never a verdict. `null` here means no fault RECORDED, which is not the
    // same fact as "healthy" — see the printed line, which says so out loud.
    daemon_fault: st && st.daemon_fault ? st.daemon_fault : null,
    state_present: !!st,
    lane: deps.lane !== undefined ? deps.lane : lane(deps),
    // what the stream's emits actually BECAME downstream (see fate() above)
    fate: deps.fate !== undefined ? deps.fate : fate(deps),
  };
}

// The printed surface, as a pure function, so the selftest can assert what it SAYS —
// the old rot was in a console.log nothing could reach.
function statusLines(s) {
  const ln = s.lane || {};
  const l = [];
  l.push(`context: ${s.context_rows} emit(s) across ${s.active_days} day(s) = ~${s.emits_per_day}/day, from the last ${s.scanned_rows} afferent row(s)` +
    (s.scan_complete ? "" : " (the scan reached the start of the log)"));
  l.push(`  ${s.rows_with_concept}/${s.rows_total} emit(s) carry a canon concept · ${s.concept_bearing_keys}/${s.distinct_keys} distinct habituation key(s) name a concept`);
  l.push(`  ${s.rows_title_or_text_cut} emit(s) shipped a CUT title/text (cap ${s.title_cap}/${s.text_cap}, longest raw title seen ${s.longest_raw_title_len || "—"})` +
    (s.rows_cut_unknown ? ` · ${s.rows_cut_unknown} older row(s) predate the flag — whether they were cut is UNKNOWN` : ""));
  l.push(`  LANE: the resident daemon is the live path (\`node scripts/context.mjs daemon\`); \`once\` is the manual probe + fallback.`);
  // ROW 897 (s893, 14 Nov 2026) — read off the bridge's OWN STAMP (lane()), never the process table.
  // SUPERSEDED, kept as history (layer, never replace): this line printed the process probe's two
  // UNKNOWNs, "UNKNOWN — the process probe never got to look (<reason>); a probe that could not run is
  // not a DOWN reading" and "UNKNOWN — the process probe is Windows-only (platform=<p>)", then "UP since
  // <the process table's start stamp>" and "NOT IN THE PROCESS TABLE — the bridge is dark, nothing is
  // emitting ambient context". PROBE HONESTY's law stands over the stamp: a reading that could not be
  // taken is UNKNOWN with its reason, never DOWN, and DOWN is a stale stamp, never a missing one.
  l.push(`    resident process: ` + (ln.resident_running === null
    ? `UNKNOWN — ${ln.probe_reason || "its own stamp could not be read"}; a stamp that cannot be read is not a DOWN reading`
    : ln.resident_running
      ? `UP since ${ln.resident_since || "an unreadable boot_ts"} — its own stamp is fresh (last poll ${ln.stamp_poll_ts}, ${ln.stamp_age_s} s ago, pid ${ln.resident_pid}; the bound is ${ln.stamp_bound_s} s)`
      : `DOWN — its own stamp is STALE (last poll ${ln.stamp_poll_ts}, ${ln.stamp_age_s} s ago, past the ${ln.stamp_bound_s} s bound): the bridge is dark, nothing is emitting ambient context`));
  // D9 — the stale-build word this organ could never say. Facts and two stamps, no verdict
  // adjective and no threshold: the reader draws the conclusion, same law as DOWNSTREAM.
  // ROW 897 (s893): the UNVERIFIED reasons follow the stamp; they named the process probe until then
  // ("the process probe never got to look (<reason>)" · "the process probe is Windows-only (…)").
  const bd = ln.build || {};
  l.push(`    running build: ` + (bd.checked !== true
    ? `UNVERIFIED — ` + (ln.resident_running === null
      ? `its own stamp could not be read (${ln.probe_reason || "unknown"})`
      : ln.resident_running === false ? `nothing is running, so there is no build to compare`
        : bd.booted_ms == null ? `its stamp carries no readable boot_ts`
          : `its module graph could not be read from here`)
    : bd.stale
      // SUPERSEDED BY ROW 880 (2), kept as history (layer, never replace): this line ended
      // "…this resident retires itself on its next poll and daemon_watchdog.mjs relaunches it on
      // the new code." The watchdog has only reported since S9 (28 Aug); the keeper respawns now.
      ? `STALE — booted ${new Date(bd.booted_ms).toISOString()}, but ${bd.newest_file} was written ${new Date(bd.newest_ms).toISOString()}. An ESM process cannot reload its code; this resident retires itself on its next poll and its keeper (scripts/keeper.mjs) respawns it on the new code at once.`
      : `current — nothing in its module graph has been written since it booted (newest: ${bd.newest_file} @ ${new Date(bd.newest_ms).toISOString()})`));
  l.push(`    restart verb: ` + (ln.restart_verb_wired === null
    ? `setup/START_DAEMONS.vbs not readable from here`
    : ln.restart_verb_wired ? `setup/START_DAEMONS.vbs carries the \`${RESIDENT_MATCH}\` line`
      : `setup/START_DAEMONS.vbs has NO \`${RESIDENT_MATCH}\` line — a restart would not bring the bridge back`));
  l.push(`    per-minute task: ` + (ln.per_minute_task_designed_absent
    ? `retired by design — tasks_expected.json: ${ln.designed_absent_note}`
    : `tasks_expected.json does not list ArsenalFC-Context as designed-absent — the retirement is unrecorded where the watchman reads it`));
  l.push(`    last emit: ` + (s.last_emit ? `${s.last_emit} (${s.last_emit_age_min} min ago) · ${s.last_window}` : `context_state.json holds no emit stamp yet`));
  // D10 — the word a swallowed throw could never say. Three states, never two: FAULTING,
  // nothing recorded, and no state at all. An absent block is reported as an absent block,
  // not as health — the same honesty the D8 cut line keeps for its pre-flag rows.
  const dfl = s.daemon_fault;
  l.push(`    loop faults: ` + (dfl
    ? `FAULTING — ${dfl.consecutive} consecutive poll(s) have thrown since ${dfl.since}, latest ${dfl.last_ts} (pid ${dfl.pid}): ${dfl.last_error}. Unlike a STALE build this does NOT self-heal: the process keeps its PID, so the watchdog's liveness probe and everything bleeding off it still read UP.`
    : s.state_present
      ? `none recorded — the resident clears this block on its first clean poll. Absence is not health: a state file written before 11 Aug 2026 carries no block either, and a fault whose own disk write failed leaves its trace only in scripts/context.log.`
      : `UNKNOWN — context_state.json holds no state at all yet, so there is nothing to read a fault out of`));
  // WHERE THE EMITS LANDED — the half this surface could not see until 10 Aug 2026.
  const f = s.fate || {};
  l.push(`  DOWNSTREAM: ${f.left_reflex}/${f.scored_moments} scored moment(s) carrying context left reflex` +
    (f.left_reflex ? ` (${f.outcomes.join(", ")})` : ``) +
    (f.max_S == null ? `` : ` · highest S reached ${f.max_S} against a lowest tau1_eff of ${f.min_tau1_eff}`) +
    (f.ledger_scan_complete ? `` : ` (the ledger scan reached the start of the log)`));
  l.push(`    the cortex reads this stream as the ambient WHERE-HE-WAS line on every wake (cortex.mjs ambientWindow),`);
  l.push(`    which is corroboration — it is NOT a wake trigger, and crossing tau1 is not what this stream is for.`);
  return l;
}

async function selftest() {
  const checks = [];
  const assert = (n, c) => { checks.push(!!c); console.log(`  ${c ? "✓" : "✗"} ${n}`); };
  const now = new Date("2026-07-18T10:00:00Z");
  // A FIXTURE of capture.mjs's registry shape. Every sense() below injects it, so the
  // verdict can never depend on what the captain happens to have in concepts.json
  // (the same law presence.mjs's FIXTURE_BUCKETS follows — adding a concept to his
  // own canon must not turn this file red).
  const REG = { loaded: true,
    conceptAlias: new Map([["hallucinations", "hallucinations"], ["hallucination", "hallucinations"], ["embeddings", "embeddings"]]),
    skillAlias: new Map([["fastapi", "fastapi"]]) };
  const EMPTY_REG = { loaded: false, conceptAlias: new Map(), skillAlias: new Map() };
  let saved = null, posted = null;
  const r1 = await sense({ now, registry: REG, window: { app: "Code.exe", title: "drill.py" }, prev: { app: "chrome.exe", title: "youtube", emit_ts: "2026-07-18T09:58:00Z" }, post: async (e) => { posted = e; return true; }, save: (o) => { saved = o; } });
  assert("emit on window CHANGE → modality 'context', app+title carried", r1.emitted && r1.evt.modality === "context" && r1.evt.app === "Code.exe" && /drill\.py/.test(r1.evt.text));
  assert("emit routes to the thalamus door + records the new state", posted && posted.event_key === "context:Code.exe" && saved.app === "Code.exe" && saved.emit_ts === now.toISOString());
  const r2 = await sense({ now, registry: REG, window: { app: "Code.exe", title: "drill.py" }, prev: { app: "Code.exe", title: "drill.py", emit_ts: "2026-07-18T09:59:00Z" }, post: async () => { throw new Error("must not post on no-change"); }, save: () => { throw new Error("must not write on no-change"); } });
  assert("no emit when the window is unchanged (delta-only, never a firehose)", r2.emitted === false && r2.reason === "no-change");
  const r3 = await sense({ now, registry: REG, window: { app: "Obsidian.exe", title: "notes" }, prev: null, post: async () => true, save: () => {} });
  assert("first-ever window (no prior state) → emits", r3.emitted === true);
  const r4 = await sense({ now, registry: REG, window: null, prev: null, post: async () => { throw new Error("no post without a window"); }, save: () => {} });
  assert("AW down / no window → no emit, no crash", r4.emitted === false && r4.reason === "no-window");
  const r5 = await sense({ now, registry: REG, window: { app: "chrome.exe", title: "attention paper" }, prev: { app: "chrome.exe", title: "youtube", emit_ts: "2026-07-18T09:50:00Z" }, post: async () => true, save: () => {} });
  assert("title-only change still emits (the title carries the concept)", r5.emitted === true);
  let s6 = "unset";
  const r6 = await sense({ now, registry: REG, window: { app: "x.exe", title: "t" }, prev: null, post: async () => false, save: (o) => { s6 = o; } });
  assert("thalamus down → NOT emitted + state NOT advanced (retries next poll, no afferent dropped)", r6.posted === false && r6.emitted === false && s6 === "unset" && r6.reason === "post-failed-will-retry");

  // ------------------------------------------------------------------------
  // #22 REGRESSIONS (audit 2 Aug 2026, finding 14). Live before this fix: 17
  // distinct event_keys, ALL app-only, so habituation saturated per-app and the
  // concept in the title reached the scorer in 0 of 1,743 emits.
  // ------------------------------------------------------------------------
  let pc = null;
  const rc = await sense({ now, registry: REG, window: { app: "chrome.exe", title: "Hallucinations in LLMs — grounding" }, prev: null, post: async (e) => { pc = e; return true; }, save: () => {} });
  assert("#22 a canon concept in the title reaches the SCORER — it is in the hab key and in concept_tokens",
    rc.emitted && pc.event_key === "context:chrome.exe:hallucinations" && pc.concept_tokens.length === 1 &&
    pc.concept_tokens[0] === "hallucinations" && pc.concept_source === "window-title-canon");
  let pd = null;
  await sense({ now, registry: REG, window: { app: "chrome.exe", title: "Embeddings 101" }, prev: null, post: async (e) => { pd = e; return true; }, save: () => {} });
  assert("#22 two concepts in ONE app are now two habituation keys — hours of one concept no longer read like tab-churn",
    pd.event_key === "context:chrome.exe:embeddings" && pd.event_key !== pc.event_key);
  let pn = null;
  await sense({ now, registry: REG, window: { app: "WindowsTerminal.exe", title: "C:\\WINDOWS\\system32\\cmd.EXE" }, prev: null, post: async (e) => { pn = e; return true; }, save: () => {} });
  assert("#22 TRAP AVOIDED — raw window words never enter the key or the vocabulary: `system32`/`cmd` canonicalize to NOTHING",
    pn.event_key === "context:WindowsTerminal.exe" && Array.isArray(pn.concept_tokens) && pn.concept_tokens.length === 0 && pn.concept_source === "none");
  assert("#22 the quiet case is byte-identical to the pre-fix behaviour (no habituation churn introduced)",
    posted.event_key === "context:Code.exe" && Array.isArray(posted.concept_tokens) && posted.concept_tokens.length === 0);
  let pe = null;
  await sense({ now, registry: EMPTY_REG, window: { app: "chrome.exe", title: "Hallucinations in LLMs" }, prev: null, post: async (e) => { pe = e; return true; }, save: () => {} });
  assert("#22 NO registry on disk → app-only key and no tokens (a missing canon is never a licence to ship titles)",
    pe.event_key === "context:chrome.exe" && pe.concept_tokens.length === 0);
  assert("#22 the canon filter itself: a registered alias resolves, chrome does not",
    conceptOfTitle("hallucination detection notes", { registry: REG }) === "hallucinations" &&
    conceptOfTitle("Google Chrome — new tab", { registry: REG }) === null &&
    conceptOfTitle("fastapi routing", { registry: REG }) === "fastapi");
  // #106 — status is a set of counters, never the word "ok"
  const REP = { rows: [
    { modality: "context", ts: "2026-08-01T10:00:00Z", event_key: "context:chrome.exe", concept_tokens: [] },
    { modality: "context", ts: "2026-08-01T11:00:00Z", event_key: "context:chrome.exe:embeddings", concept_tokens: ["embeddings"] },
    { modality: "voice", ts: "2026-08-02T11:00:00Z", event_key: "voice:x" },
  ], complete: true };
  // the downstream fixture, injected for the same FIXTURE-law reason as REG above: without
  // it every status() below would tail the LIVE salience_ledger and the verdict would move
  // with whatever the thalamus scored this afternoon.
  const LEDGER_REP = { rows: [
    { modalities: ["context"], S: 0.244, tau1_eff: 0.4, outcome: "reflex" },
    { modalities: ["context"], S: 0.0, tau1_eff: 0.75, outcome: "reflex" },
    { modalities: ["voice", "context"], S: 0.7, tau1_eff: 0.4, outcome: "wake" },
    { modalities: ["code"], S: 0.6, tau1_eff: 0.4, outcome: "wake" },
  ], complete: true };
  const FATE = fate({ ledgerRep: LEDGER_REP });
  const st = status({ rep: REP, lane: {}, state: null, fate: FATE });
  assert("#22/#106 status reports have/need counters, not a status word",
    st.context_rows === 2 && st.rows_with_concept === 1 && st.concept_bearing_keys === 1 && st.distinct_keys === 2 && st.active_days === 1);

  // ------------------------------------------------------------------------
  // D8 REGRESSION (WIRING AUDIT, 10 Aug 2026) — THE CUT MUST NAME ITSELF, AND
  // SOMETHING MUST READ THE NAME.
  // Live before this fix: 19 of 3,000 context rows at EXACTLY 200 chars of title,
  // 16 at exactly 240 of text, longest-in-file = the cap, and ZERO rows carrying any
  // field that said so — one of them a real question of his sheared at "first work w".
  // These fail if the flag is dropped, if it ever LIES about the string beside it, if
  // the quiet case stops emitting a measured `false`, or if `status` stops counting it.
  // ------------------------------------------------------------------------
  const LONG = "i sell products on amazon usa from india so which AI platform is the best to understand how to do marketing and how to run amazon PPC ads, i can buy helium 10 platinum as well and want to first work without it so search deep on";
  let pl = null;
  await sense({ now, registry: REG, window: { app: "chrome.exe", title: LONG }, prev: null, post: async (e) => { pl = e; return true; }, save: () => {} });
  assert("D8 an over-length title ships its cut NAMED — title_truncated + the raw length it was cut from",
    pl.title_truncated === true && pl.title_len === LONG.length && pl.title_len === 227 && pl.title.length === 200);
  // THE BOUNDARY, and it is not a nicety: this very row's `text` is 240 chars — EXACTLY
  // the cap — because `chrome.exe · ` + 227 = 240. Nothing was lost, so the honest answer
  // is false. A cheaper flag written as `length >= cap` would have called this a cut and
  // taught every receiver to distrust a complete string. (Found by this assertion failing
  // on its first run, 10 Aug 2026 — the fixture is the real sheared row from the live bus.)
  assert("D8 a string landing EXACTLY on the cap is NOT a cut — nothing lost, so the flag says false",
    pl.text.length === 240 && pl.text_len === 240 && pl.text_truncated === false &&
    pl.text === `chrome.exe · ${LONG}`);
  let px = null;
  await sense({ now, registry: REG, window: { app: "WindowsTerminal.exe", title: LONG }, prev: null, post: async (e) => { px = e; return true; }, save: () => {} });
  assert("D8 one char past the cap IS a cut, and the text side names it too",
    px.text_len === `WindowsTerminal.exe · ${LONG}`.length && px.text_len > 240 &&
    px.text_truncated === true && px.text.length === 240);
  assert("D8 the flag cannot LIE — the shipped string is exactly min(raw length, cap) in both fields",
    pl.title.length === Math.min(pl.title_len, 200) && pl.text.length === Math.min(pl.text_len, 240) &&
    pl.title === LONG.slice(0, 200) && pl.text === `chrome.exe · ${LONG}`.slice(0, 240));
  let ps = null;
  await sense({ now, registry: REG, window: { app: "Code.exe", title: "drill.py" }, prev: null, post: async (e) => { ps = e; return true; }, save: () => {} });
  assert("D8 a short title emits a MEASURED false, never an absent field (absent = the pre-D8 UNKNOWN, a different fact)",
    ps.title_truncated === false && ps.text_truncated === false && ps.title_len === 8 &&
    ps.text_len === "Code.exe · drill.py".length && ps.title === "drill.py");
  assert("D8 the cut never touches the concept wire — conceptOfTitle still reads the RAW title, before the clip",
    pl.event_key === "context:chrome.exe" && pl.title_truncated === true &&
    conceptOfTitle(LONG + " embeddings", { registry: REG }) === "embeddings");
  // THE CONSUMER — a flag no organ reads is the very defect this repair ends.
  const CUTREP = { rows: [
    { modality: "context", ts: "2026-08-10T10:00:00Z", event_key: "context:chrome.exe", concept_tokens: [], title_truncated: true, title_len: 236, text_truncated: true },
    { modality: "context", ts: "2026-08-10T11:00:00Z", event_key: "context:Code.exe", concept_tokens: [], title_truncated: false, title_len: 8, text_truncated: false },
    { modality: "context", ts: "2026-07-20T11:00:00Z", event_key: "context:chrome.exe", concept_tokens: [] },   // pre-D8: no flag at all
  ], complete: true };
  const cs = status({ rep: CUTREP, lane: {}, state: null });
  assert("D8 status COUNTS the cut and keeps pre-flag rows as a separate UNKNOWN, never folded into clean",
    cs.rows_title_or_text_cut === 1 && cs.rows_cut_unknown === 1 && cs.longest_raw_title_len === 236 &&
    cs.title_cap === 200 && cs.text_cap === 240);
  assert("D8 the health surface SAYS it — the cut reaches the printed lines, with the cap and the raw length",
    statusLines(cs).some(l => /1 emit\(s\) shipped a CUT title\/text \(cap 200\/240, longest raw title seen 236\)/.test(l)) &&
    statusLines(cs).some(l => /1 older row\(s\) predate the flag — whether they were cut is UNKNOWN/.test(l)));

  // ------------------------------------------------------------------------
  // D7 REGRESSION (10 Aug 2026) — THE HEALTH SURFACE MUST NOT NAME A DEAD TASK.
  // Before this fix `status` printed "The scheduler still runs the legacy lane" and a
  // `schtasks /Change /TN ArsenalFC-Context` line — a false fact plus a command that
  // errors, weeks after that task was deleted. These fail if either comes back, and if
  // the lane ever stops being DERIVED from the process table / restart verb /
  // tasks_expected.json.
  // ROW 897 (s893, 14 Nov 2026): the first authority is the bridge's OWN STAMP now, never the process
  // table, so these fixtures hand lane() a stamp and a clock where they handed it a process-table boot
  // (`residentStartMs`) or a process probe (`procRead`). The SAME facts: a FRESH stamp whose boot_ts is
  // the old fixture's start instant is the resident that was UP; a STALE stamp is the dark bridge. The
  // stamps are placed by STAMP_FRESH_MS (a second inside the bound, a minute past it), never a typed age.
  // ------------------------------------------------------------------------
  // (D9 injects `graph` from here on, so the lane's build word is a fixture and never the
  // mtimes of whatever the captain happened to edit this minute.)
  const D7_NOW = "2026-08-10T05:00:00Z";
  const freshAt = (now, bootMs) => ({ poll_ts: new Date(Date.parse(now) - 1000).toISOString(), pid: 21308, boot_ts: new Date(bootMs).toISOString() });
  const staleAt = (now, bootMs) => ({ poll_ts: new Date(Date.parse(now) - STAMP_FRESH_MS - 60000).toISOString(), pid: 21308, boot_ts: new Date(bootMs).toISOString() });
  const laneUp = lane({ expected: { designed_absent: { "ArsenalFC-Context": "the bridge rides the resident daemon now" } },
    stamp: freshAt(D7_NOW, Date.parse("2026-08-10T04:00:00Z")), now: D7_NOW, vbs: 'sh.Run "…hidden_run.vbs"" node scripts\\context.mjs daemon", 0, False',
    graph: { ms: Date.parse("2026-08-09T22:00:00Z"), file: "scripts/presence.mjs" } });
  assert("D7 the lane is DERIVED — its own stamp (row 897; the process table until then) + restart verb + tasks_expected, never prose",
    laneUp.resident_running === true && laneUp.resident_since === "2026-08-10T04:00:00.000Z" &&
    laneUp.restart_verb_wired === true && laneUp.per_minute_task_designed_absent === true);
  const laneDark = lane({ expected: { designed_absent: {} }, stamp: staleAt(D7_NOW, Date.parse("2026-08-09T07:38:39Z")), now: D7_NOW, vbs: "' this restart verb forgot the bridge",
    graph: { ms: null, file: null } });
  assert("D7 a dark bridge is NAMED, not silent (a stale stamp · unwired restart verb · unrecorded retirement)",
    laneDark.resident_running === false && laneDark.restart_verb_wired === false && laneDark.per_minute_task_designed_absent === false);
  // ------------------------------------------------------------------------
  // PROBE HONESTY REGRESSION (11 Aug 2026) — A KILLED PROBE IS NOT A DARK BRIDGE.
  // Live when this was found: `status` printed "NOT IN THE PROCESS TABLE — the bridge is
  // dark, nothing is emitting ambient context" while PID 21308 sat in the process table
  // emitting, because Get-CimInstance costs 3.4-8.9s here against processStartMs's 5000ms
  // cap and 2 of 5 consecutive probes were killed (ETIMEDOUT). The same false DOWN also
  // silently voided D9: `build` degrades to UNVERIFIED and the resident's own row
  // attribution disappears, so the surface loses BOTH halves at once.
  // These fail if a could-not-look reading is ever printed as a down bridge again, or if
  // the two different UNKNOWNs (off-Windows vs killed shell) get folded into one sentence.
  // ROW 897 (s893, 14 Nov 2026): the process probe is gone from lane(), and with it both of its
  // UNKNOWNs (no Windows-only reading is left, and no shell to kill). The SAME honesty now holds over
  // the STAMP, and these four hold it: a stamp that cannot be read (no file, no readable poll_ts, a
  // clock that moved) is UNKNOWN with its reason, never `false`, never a borrowed boot stamp, never
  // "the bridge is dark"; DOWN is a STALE stamp and only that. Until today these four drove
  // `procRead` ({ looked:false, reason:"ETIMEDOUT" } and { looked:true, reason:"absent" }).
  // ------------------------------------------------------------------------
  const laneKilled = lane({ expected: { designed_absent: {} }, vbs: "", graph: { ms: 1, file: "scripts/context.mjs" },
    stamp: { poll_ts: "not a time", pid: 21308, boot_ts: "2026-08-09T07:38:39.000Z" }, now: D7_NOW });
  assert("PROBE HONESTY — a stamp that cannot be read is UNKNOWN with its reason, never `false`, and never invents a boot stamp (row 897: the stamp, not the process probe)",
    laneKilled.resident_running === null && laneKilled.probe_reason === "its stamp has no readable poll_ts" && laneKilled.resident_since === null);
  const killedLines = statusLines(status({ rep: REP, lane: laneKilled, state: null, fate: FATE }));
  assert("PROBE HONESTY — the surface says the stamp could not be read, and NEVER says the bridge is dark off a reading it could not take",
    killedLines.some(l => /resident process: UNKNOWN — its stamp has no readable poll_ts; a stamp that cannot be read is not a DOWN reading/.test(l)) &&
    killedLines.every(l => !/the bridge is dark/.test(l)) &&
    killedLines.every(l => !/resident process: DOWN/.test(l)));
  assert("PROBE HONESTY — the D9 build word degrades HONESTLY on an unreadable stamp: UNVERIFIED naming the stamp, never 'nothing is running'",
    killedLines.some(l => /running build: UNVERIFIED — its own stamp could not be read \(its stamp has no readable poll_ts\)/.test(l)) &&
    killedLines.every(l => !/nothing is running, so there is no build to compare/.test(l)));
  assert("PROBE HONESTY — UNKNOWN and DOWN stay different facts: a STALE stamp is still a DARK bridge, a missing stamp is UNKNOWN (never false), on every platform (row 897: no Windows-only reading is left)",
    lane({ expected: {}, vbs: "", graph: { ms: null, file: null }, stamp: null, now: D7_NOW }).resident_running === null &&
    lane({ expected: {}, vbs: "", graph: { ms: null, file: null }, stamp: null, now: D7_NOW }).probe_reason === "context_state.json holds no stamp" &&
    statusLines(status({ rep: REP, lane: laneDark, state: null, fate: FATE })).some(l => /resident process: DOWN — its own stamp is STALE/.test(l)) &&
    laneDark.probe_reason == null);
  const upLines = statusLines(status({ rep: REP, lane: laneUp, now: "2026-08-10T05:00:00Z", fate: FATE,
    state: { app: "chrome.exe", title: "Embeddings 101", emit_ts: "2026-08-10T04:45:00Z" } }));
  assert("D7 status hands him NO command and names NO dead task — the anchor law",
    upLines.every(l => !/schtasks/i.test(l)) && upLines.every(l => !/scheduler still runs|legacy lane|ArsenalFC-Context\s/i.test(l)));
  assert("D7 status states the LIVE lane: the resident daemon, with its start stamp and last emit",
    upLines.some(l => /resident process: UP since 2026-08-10T04:00:00\.000Z/.test(l)) &&
    upLines.some(l => /last emit: 2026-08-10T04:45:00Z \(15 min ago\) · chrome\.exe · Embeddings 101/.test(l)));
  const darkLines = statusLines(status({ rep: REP, lane: laneDark, state: null, fate: FATE }));
  // ------------------------------------------------------------------------
  // WIRING AUDIT REGRESSION (10 Aug 2026) — THE BLIND COUNTER, HELD OPEN.
  // Before this fix `status` counted only emits and knew nothing of their fate, so it
  // read healthy across 2,999 consecutive reflex outcomes. These fail if the downstream
  // read is dropped, if it stops keying on the ledger's `modalities` LIST, or if the
  // printed surface stops naming "N of M left reflex".
  // ------------------------------------------------------------------------
  assert("#wire fate() reads the ledger's modalities LIST and separates crossed from reflex",
    FATE.scored_moments === 3 && FATE.left_reflex === 1 && FATE.outcomes.join() === "wake");
  assert("#wire it reports the ceiling REACHED against the bar FACED — counters, never a verdict word",
    FATE.max_S === 0.7 && FATE.min_tau1_eff === 0.4 && !/ok|healthy|fine/i.test(JSON.stringify(FATE)));
  assert("#wire the printed surface names the downstream count, so a dead wire can never show a green light again",
    upLines.some(l => /DOWNSTREAM: 1\/3 scored moment\(s\) carrying context left reflex/.test(l)) &&
    upLines.some(l => /highest S reached 0\.7 against a lowest tau1_eff of 0\.4/.test(l)));
  assert("#wire the surface names its CONSUMER — the cortex's ambient line — and says crossing tau1 is not the point",
    upLines.some(l => /cortex\.mjs ambientWindow/.test(l)) && upLines.some(l => /NOT a wake trigger/.test(l)));
  assert("#wire an EMPTY ledger reports zero honestly, never null-crashes the surface",
    fate({ ledgerRep: { rows: [], complete: true } }).scored_moments === 0 &&
    fate({ ledgerRep: { rows: [], complete: true } }).max_S === null &&
    statusLines(status({ rep: REP, lane: laneDark, state: null, fate: fate({ ledgerRep: { rows: [], complete: true } }) }))
      .some(l => /DOWNSTREAM: 0\/0/.test(l)));
  // ROW 897 (s893): the bridge-down word is the stale stamp's now ("NOT IN THE PROCESS TABLE" until then).
  assert("D7 the dark case speaks in full — bridge down, restart verb unwired, no emit stamp",
    darkLines.some(l => /resident process: DOWN — its own stamp is STALE/.test(l)) &&
    darkLines.some(l => /has NO `context\.mjs daemon` line/.test(l)) &&
    darkLines.some(l => /holds no emit stamp yet/.test(l)));
  // ------------------------------------------------------------------------
  // D9 REGRESSION (11 Aug 2026) — THE STALE-BUILD WIRE THIS BRIDGE NEVER HAD.
  // Before this fix the ONLY stale-build detector in the organism sat behind
  // conductor.mjs's `daemon: { port }` gate, which a portless poll can never enter, and the
  // live resident had been running 41h-old code with nothing anywhere able to say so.
  // These fail if the retirement is lifted out of the daemon loop, if it stops reading the
  // whole import GRAPH through conductor's own probe, if a tolerance is invented for the
  // comparison, or if an unreadable graph ever starts reading as "current".
  // ------------------------------------------------------------------------
  const BOOT = Date.parse("2026-08-09T07:38:39Z");
  assert("D9 a graph file written AFTER the boot is STALE; written before is current — conductor's own `>`, no tolerance invented",
    buildVerdict(BOOT, { ms: Date.parse("2026-08-11T00:23:56Z"), file: "scripts/conductor.mjs" }).stale === true &&
    buildVerdict(BOOT, { ms: Date.parse("2026-08-09T07:00:00Z"), file: "scripts/presence.mjs" }).stale === false &&
    buildVerdict(BOOT, { ms: BOOT, file: "scripts/context.mjs" }).stale === false);
  assert("D9 UNKNOWN is its own answer — an unreadable graph or an unfindable process is UNVERIFIED, never a fabricated all-clear",
    buildVerdict(BOOT, { ms: null, file: null }).checked === false &&
    buildVerdict(BOOT, { ms: null, file: null }).stale === null &&
    buildVerdict(null, { ms: 1, file: "x.mjs" }).checked === false &&
    buildVerdict(null, { ms: 1, file: "x.mjs" }).stale === null);
  assert("D9 graphNow() takes the injected graph verbatim, and the LIVE walk answers with a real file + stamp (conductor's newestGraphMtime, not a bare mtime of this file)",
    graphNow({ graph: { ms: 7, file: "scripts/z.mjs" } }).file === "scripts/z.mjs" &&
    /\.mjs$/.test(String(graphNow().file || "")) && Number.isFinite(graphNow().ms));
  // ROW 897 (s893): the running bridge's boot is its FRESH stamp's boot_ts (it was `residentStartMs: BOOT`).
  const laneStale = lane({ expected: { designed_absent: {} }, stamp: freshAt("2026-08-11T00:30:00Z", BOOT), now: "2026-08-11T00:30:00Z", vbs: "",
    graph: { ms: Date.parse("2026-08-11T00:23:56Z"), file: "scripts/conductor.mjs" } });
  const staleLines = statusLines(status({ rep: REP, lane: laneStale, state: null, fate: FATE }));
  assert("D9 the health surface SAYS it — a running-but-stale bridge is named with BOTH stamps and the file that moved",
    laneStale.build.stale === true &&
    staleLines.some(l => /running build: STALE — booted 2026-08-09T07:38:39\.000Z, but scripts\/conductor\.mjs was written 2026-08-11T00:23:56\.000Z/.test(l)));
  assert("D9 a current build and an unreadable one print DIFFERENTLY, and neither borrows the other's word",
    statusLines(status({ rep: REP, lane: laneUp, state: null, fate: FATE }))
      .some(l => /running build: current — nothing in its module graph has been written since it booted \(newest: scripts\/presence\.mjs/.test(l)) &&
    statusLines(status({ rep: REP, lane: laneDark, state: null, fate: FATE }))
      .some(l => /running build: UNVERIFIED — nothing is running/.test(l)));
  // THE WIRE ITSELF, held by SOURCE — a pure verdict function nobody calls is exactly the
  // defect class this repair exists to end (physio.mjs:1332 pins its own consumer the same
  // way). The check must sit INSIDE the daemon arm and BEFORE the poll spends anything.
  const SELF = readFileSync(fileURLToPath(import.meta.url), "utf8");
  // Split on the arm's own head as a REGEX — a plain-string split would also cut on this
  // assertion's own copy of that literal and hand the check a slice of the selftest.
  // (Found by this assertion failing on its first run, 11 Aug 2026.)
  // ROW 880 (2) (s880b): the loop moved under `daemon-worker` (the `daemon` arm is now the keeper),
  // so the slice follows the LOOP to its new head. Same meaning: the loop really runs the check.
  const arm = ((SELF.split(/if \(mode === "daemon-worker"\) \{/)[1]) || "").split("--daemon stopped")[0];
  assert("D9 the daemon loop REALLY runs the check — buildVerdict(BOOT_MS, graphNow()) sits in the arm, ahead of sense(), and breaks the loop with a RETIRING line",
    /const BOOT_MS = Date\.now\(\) - process\.uptime\(\) \* 1000;/.test(arm) &&
    /buildVerdict\(BOOT_MS, graphNow\(\)\)/.test(arm) &&
    arm.indexOf("buildVerdict(BOOT_MS") < arm.indexOf("await sense(") &&
    /--daemon RETIRING/.test(arm) && /\bbreak;/.test(arm));
  assert("D9 the instrument stays BORROWED — the graph walker is imported from conductor.mjs, so this file never grows a second stale-build engine",
    /import \{[^}]*newestGraphMtime[^}]*\} from "\.\/conductor\.mjs";/.test(SELF) &&
    /newestGraphMtime\(SELF_REL\)/.test(SELF));


  // ------------------------------------------------------------------------
  // THE WIRE (wiring audit, 11 Aug 2026) — status() HAD NO CALLER AT ALL.
  // Measured the day of this repair: `grep -rn "context.mjs status|context:status"
  // scripts/ hooks/ .claude/ setup/ package.json` returned exactly one hit in the
  // live tree — this file's own MODES header, line 21. Three repairs' worth of
  // health surface (#22's concept coverage, D7's derived lane, D8's cut counter,
  // and the downstream fate read) were dealt to NOBODY: reachable only if the
  // captain remembered to type a command, which is the shape the anchor law
  // exists to refuse. The caller is now the /organism-doctor skill, an anchor he
  // already hits ("doctor", "kya haal hai", anything feels off).
  // HELD BY SOURCE, the same net physio.mjs uses on its own first-consumer wire
  // (`gatherWorld() REALLY reads daemon_watchdog.json`): a doc wire lives BETWEEN
  // two files, so neither file's normal tests can see it break. These go red the
  // day the bullet is deleted, renamed, or reworded off the command.
  // ------------------------------------------------------------------------
  const DOCTOR = join(__dirname, "..", ".claude", "skills", "organism-doctor", "SKILL.md");
  const doctorMd = existsSync(DOCTOR) ? readFileSync(DOCTOR, "utf8") : "";
  assert("#wire the health surface HAS A CALLER — /organism-doctor runs `node scripts/context.mjs status`",
    /node scripts\/context\.mjs status/.test(doctorMd));
  assert("#wire the doctor is sent at the READ-ONLY verb — the bullet names `status`, never the bare command that emits",
    doctorMd.split(/\r?\n/).filter(l => /scripts\/context\.mjs/.test(l))
      .every(l => !/`node scripts\/context\.mjs`/.test(l)));
  const selfSrc = readFileSync(fileURLToPath(import.meta.url), "utf8");
  // The doctor bullet tells a session which line to read FIRST and quotes its
  // label. That is a two-ended wire: rename the line here and the doc sends the
  // reader hunting for text that no longer prints. Both ends, one assertion.
  assert("#wire the doctor's named first-reading really EXISTS on the surface — `running build:` is printed and the bullet points at it",
    /running build:/.test(doctorMd) && upLines.some(l => /^\s+running build: /.test(l)));
  assert("#wire a fat-fingered verb can never turn that read into a WRITE — main() screens argv against the allowlist first",
    MODES.has("status") && MODES.has("once") && MODES.has("daemon") && MODES.has("selftest") &&
    !MODES.has("staus") && !MODES.has("zzznotamode") &&
    /const mode = \(process\.argv\[2\] \|\| "once"\)\.toLowerCase\(\)\.trim\(\);\s*\n\s*if \(!MODES\.has\(mode\)\)/.test(selfSrc));

  // ------------------------------------------------------------------------
  // D10 REGRESSION (WIRING AUDIT, 11 Aug 2026) — THE SILENT CATCH.
  // Before this fix the daemon arm's whole error path was `catch { /* never taxes */ }`.
  // A loop throwing on EVERY poll kept its PID, so daemon_watchdog's process probe read
  // UP, physio bled green off it, the conductor never probed a portless daemon at all,
  // and not one file anywhere carried a mark. These go red if the catch goes silent
  // again, if the streak stops being recorded in the bridge's own file, if a clean poll
  // stops clearing it, if the fault ever moves the delta fields, or if the printed
  // surface stops naming it.
  // ------------------------------------------------------------------------
  const PREV = { app: "chrome.exe", title: "Embeddings 101", emit_ts: "2026-08-11T04:45:00Z" };
  const f1 = faultNote(PREV, new Error("connect ECONNREFUSED 127.0.0.1:5600"), "2026-08-11T05:00:00Z", 4242);
  assert("D10 the first fault is counted, stamped and QUOTED — a throw is never nothing again",
    f1.consecutive === 1 && f1.since === "2026-08-11T05:00:00Z" && f1.last_ts === "2026-08-11T05:00:00Z" &&
    f1.pid === 4242 && /ECONNREFUSED/.test(f1.last_error));
  const f2 = faultNote(withFault(PREV, f1), new Error("EPERM: operation not permitted, rename"), "2026-08-11T05:01:00Z", 4242);
  assert("D10 faults ACCUMULATE off the block on disk and keep the FIRST stamp — a wedge is a streak, not an incident",
    f2.consecutive === 2 && f2.since === "2026-08-11T05:00:00Z" && f2.last_ts === "2026-08-11T05:01:00Z" && /EPERM/.test(f2.last_error));
  const held = withFault(PREV, f2);
  assert("D10 the fault rides the bridge's OWN file and never moves the delta fields — the retry law is untouched by the code reporting the failure",
    held.app === PREV.app && held.title === PREV.title && held.emit_ts === PREV.emit_ts && held.daemon_fault.consecutive === 2);
  assert("D10 a clean poll CLEARS the block, delta fields still verbatim",
    withFault(held, null).daemon_fault === undefined && withFault(held, null).emit_ts === PREV.emit_ts &&
    withFault(PREV, null).app === "chrome.exe");
  const faultLines = statusLines(status({ rep: REP, lane: laneUp, fate: FATE, state: held, now: "2026-08-11T05:02:00Z" }));
  assert("D10 the health surface SAYS it — the count, the first stamp, the last error, and that an UP probe proves nothing here",
    faultLines.some(l => /loop faults: FAULTING — 2 consecutive poll\(s\) have thrown since 2026-08-11T05:00:00Z/.test(l)) &&
    faultLines.some(l => /EPERM/.test(l) && /does NOT self-heal/.test(l) && /still read UP/.test(l)));
  assert("D10 no-fault and no-state print DIFFERENTLY, and neither is reported as health",
    statusLines(status({ rep: REP, lane: laneUp, fate: FATE, state: PREV })).some(l => /loop faults: none recorded/.test(l) && /Absence is not health/.test(l)) &&
    statusLines(status({ rep: REP, lane: laneUp, fate: FATE, state: null })).some(l => /loop faults: UNKNOWN/.test(l)));
  assert("D10 no threshold and no verdict is invented — the block is five counters/stamps and nothing in it decides 'wedged'",
    Object.keys(f2).sort().join() === "consecutive,last_error,last_ts,pid,since" &&
    !/wedged|unhealthy|dead|ok\b/i.test(JSON.stringify(f2)));
  // THE CATCH ITSELF, held by SOURCE — the defect was a SHAPE, not a value, and only the
  // source can prove the shape is gone (the same net D9's arm assertion uses above; `arm`
  // is that slice of main()).
  assert("D10 the daemon arm's catch BINDS the error, counts it, records it in its own file and prints it — never `catch { /* never taxes */ }` again",
    !/catch \{ \/\* never taxes \*\/ \}/.test(arm) && /catch \(e\) \{[\s\S]*faultNote\(/.test(arm) &&
    /faults\+\+/.test(arm) && /writeAtomic\(CONTEXT_STATE, withFault\(readJson\(CONTEXT_STATE\), note\)\)/.test(arm) &&
    /--daemon poll FAULTED/.test(arm) && /--daemon recovered/.test(arm));
  assert("D10 the doctor is pointed at the new line, and the surface really prints that label — a two-ended wire, both ends here",
    /loop faults:/.test(doctorMd) && faultLines.some(l => /^\s+loop faults: /.test(l)));

  // ------------------------------------------------------------------------
  // ── S880B SELFTESTS (row 880 (2), 14 Nov 2026): THE KEEPER, THE STAMP, THE SINGLETON ──
  // Each holds by BEHAVIOUR where the behaviour is reachable without a process, and by SOURCE
  // where the defect was a SHAPE (the D9/D10 nets above). Every predicate runs inside held():
  // a predicate that THROWS reads ✗, so this same block, transplanted onto $BASE's code
  // (cloud/s880b/fix/witness/selftest_on_base.mjs), reds there by name instead of crashing.
  // The live end-to-end (a real keeper, a real retire, a real second keeper) is the witness's.
  // ------------------------------------------------------------------------
  {
    const held = (f) => { try { return !!f(); } catch { return false; } };
    const SRC = readFileSync(fileURLToPath(import.meta.url), "utf8").replace(/\r\n/g, "\n");
    // the PRINTED source: a comment may quote history, a live line may not promise it
    const code = SRC.split(/\r?\n/).filter((l) => !/^\s*(\/\/|\*)/.test(l)).join("\n");
    const keeperArm = ((SRC.split(/if \(mode === "daemon" \|\| mode === "--daemon"\) \{/)[1]) || "").split(/if \(mode === "daemon-worker"\) \{/)[0];
    const workerAll = (SRC.split(/if \(mode === "daemon-worker"\) \{/)[1]) || "";
    const workerArm = workerAll.split("--daemon stopped")[0];
    const workerTail = workerAll.split(/\n {2}const r = await sense\(\);/)[0];
    const T0 = Date.parse("2026-11-14T00:00:00Z"), at = (ms) => new Date(T0 + ms).toISOString();

    assert("S880B THE KEEPER — `daemon` runs keep() from scripts/keeper.mjs over `daemon-worker` (the brain shape: port null, pollMs = the bridge's own CONTEXT_POLL_MS) and holds no loop of its own; `daemon-worker` is an allowed mode",
      held(() => /import \{ keep, KEEP_EXIT \} from "\.\/keeper\.mjs";/.test(SRC)
        && /await keep\(\{ name: "context", worker: \[process\.execPath, fileURLToPath\(import\.meta\.url\), "daemon-worker", \.\.\.process\.argv\.slice\(3\)\], port: null, pollMs: CONTEXT_POLL_MS \}\);\s*\n\s*return;/.test(keeperArm)
        && !/await sense\(|while \(!stop\)/.test(keeperArm)
        && MODES.has("daemon-worker") && MODES.has("daemon") && MODES.has("--daemon")));

    assert("S880B A RETIRE EXITS 75 — the worker exits KEEP_EXIT.RETIRED after a retire, ALREADY_RESIDENT (69) when it yields, CLEAN (0) on a signal; the RETIRING line names the keeper, and no printed line promises the watchdog relaunch",
      held(() => KEEP_EXIT.RETIRED === 75 && KEEP_EXIT.ALREADY_RESIDENT === 69 && KEEP_EXIT.CLEAN === 0
        && /--daemon RETIRING[\s\S]*?retired = true;\s*\n\s*break;/.test(workerArm)
        && /process\.exitCode = retired \? KEEP_EXIT\.RETIRED : yielded \? KEEP_EXIT\.ALREADY_RESIDENT : KEEP_EXIT\.CLEAN;/.test(workerTail)
        && code.split("\n").filter((l) => /console\.log\(`context: --daemon RETIRING/.test(l)).length === 1
        && code.split("\n").filter((l) => /console\.log\(`context: --daemon RETIRING/.test(l)).every((l) => /its keeper \(scripts\/keeper\.mjs\) respawns the worker on the new code at once/.test(l))
        && !/daemon_watchdog\.mjs relaunches/.test(code)));

    // THE STAMP MOVES ON A QUIET POLL: two polls, the SAME window, a fake disk. sense() must not
    // post or write (delta-only), stampPoll() must move poll_ts, and emit_ts must not move.
    let quiet = null;
    try {
      let disk = { app: "Code.exe", title: "drill.py", emit_ts: "2026-11-13T23:00:00.000Z" };
      const load = () => JSON.parse(JSON.stringify(disk)), save = (o) => { disk = JSON.parse(JSON.stringify(o)); };
      const poll = async (iso) => {
        const r = await sense({ now: new Date(iso), registry: REG, window: { app: "Code.exe", title: "drill.py" }, prev: load(),
          post: async () => { throw new Error("must not post on no-change"); }, save: () => { throw new Error("must not write the delta on no-change"); } });
        stampPoll({ bootMs: T0, now: new Date(iso), pid: 4242, load, save });
        return { r, disk: load() };
      };
      quiet = [await poll(at(60000)), await poll(at(120000))];
    } catch { quiet = null; }
    assert("S880B THE STAMP MOVES ON A POLL WITH NO WINDOW CHANGE — poll_ts moves, emit_ts/app/title do not, pid + boot_ts ride along; and the worker stamps on EVERY poll (after the poll's catch, never only on an emit)",
      held(() => quiet && quiet.every((q) => q.r.emitted === false && q.r.reason === "no-change")
        && quiet[0].disk.poll_ts === at(60000) && quiet[1].disk.poll_ts === at(120000)
        && quiet[0].disk.emit_ts === "2026-11-13T23:00:00.000Z" && quiet[1].disk.emit_ts === "2026-11-13T23:00:00.000Z"
        && quiet[1].disk.app === "Code.exe" && quiet[1].disk.title === "drill.py"
        && quiet[1].disk.pid === 4242 && quiet[1].disk.boot_ts === at(0)
        && /\n {6}\}\n(?: {6}\/\/[^\n]*\n)* {6}try \{ stampPoll\(\{ bootMs: BOOT_MS \}\); \}/.test(workerArm)
        && workerArm.indexOf("try { stampPoll({ bootMs: BOOT_MS }); }") > workerArm.indexOf("--daemon poll FAULTED")
        && workerArm.indexOf("try { stampPoll({ bootMs: BOOT_MS }); }") < workerArm.indexOf("await new Promise((res) => { const step = 500;")
        && !/if \(r\.emitted\) \{[^\n]*stampPoll\(/.test(workerArm)));

    assert("S880B ONE FRESHNESS RULE — stampLiveness: fresh → true (UP), stale → false (DOWN), missing / unparseable / no poll_ts / beyond-the-bound future → null (UNKNOWN); the bound is STAMP_FRESH_MS = 3 × CONTEXT_POLL_MS, written as that expression",
      held(() => STAMP_FRESH_MS === 3 * CONTEXT_POLL_MS
        && /export const STAMP_FRESH_MS = 3 \* CONTEXT_POLL_MS;/.test(SRC)
        && /export const CONTEXT_POLL_MS = DOOR\.pollMs \|\| FLOOR_MS;/.test(SRC)
        && stampLiveness({ poll_ts: at(0) }, T0) === true
        && stampLiveness({ poll_ts: at(0) }, T0 + STAMP_FRESH_MS) === true
        && stampLiveness({ poll_ts: at(0) }, new Date(T0 + STAMP_FRESH_MS + 1)) === false
        && stampLiveness({ poll_ts: at(0) }, T0 + 10 * STAMP_FRESH_MS) === false
        && stampLiveness(null, T0) === null && stampLiveness({}, T0) === null
        && stampLiveness({ pid: 4242, boot_ts: at(0) }, T0) === null
        && stampLiveness({ poll_ts: "not a time" }, T0) === null
        && stampLiveness({ poll_ts: at(2 * STAMP_FRESH_MS) }, T0) === null));

    const fresh = (pid) => ({ poll_ts: at(0), pid, boot_ts: at(-60000) });
    const errWith = (code) => () => { const e = new Error(code); e.code = code; throw e; };
    assert("S880B THE PORTLESS SINGLETON — a FRESH stamp of a foreign LIVE pid → that pid (the worker exits 69); a fresh stamp of a DEAD pid → runs; its OWN pid → runs; a STALE or absent stamp → runs; alive = kill(pid, 0) succeeds or EPERM, ESRCH = dead",
      held(() => otherResident(fresh(4242), { now: T0, pid: 777, alive: () => true }) === 4242
        && otherResident(fresh(4242), { now: T0, pid: 777, alive: () => false }) === null
        && otherResident(fresh(777), { now: T0, pid: 777, alive: () => true }) === null
        && otherResident(fresh(4242), { now: T0 + STAMP_FRESH_MS + 1, pid: 777, alive: () => true }) === null
        && otherResident(null, { now: T0, pid: 777, alive: () => true }) === null
        && pidAlive(4242, () => true) === true && pidAlive(4242, errWith("EPERM")) === true
        && pidAlive(4242, errWith("ESRCH")) === false && pidAlive(0, () => true) === false
        && pidAlive(process.pid) === true));

    assert("S880B THE SINGLETON IS WIRED — the worker asks otherResident(readStamp()) at BOOT (exit KEEP_EXIT.ALREADY_RESIDENT before the loop) and before EVERY poll's sense(), and a yielder breaks out before it posts or stamps",
      held(() => /const resident = otherResident\(readStamp\(\), \{ now: Date\.now\(\) \}\);\s*\n\s*if \(resident\) \{[\s\S]*?process\.exitCode = KEEP_EXIT\.ALREADY_RESIDENT;\s*\n\s*return;/.test(workerArm)
        && workerArm.indexOf("const resident = otherResident(") > -1
        && workerArm.indexOf("const resident = otherResident(") < workerArm.indexOf("while (!stop)")
        && workerArm.indexOf("const rival = otherResident(readStamp()") > workerArm.indexOf("while (!stop)")
        && workerArm.indexOf("const rival = otherResident(readStamp()") < workerArm.indexOf("await sense(")
        && /if \(rival\) \{[\s\S]*?yielded = true;\s*\n\s*break;/.test(workerArm)));

    const before = { app: "chrome.exe", title: "Embeddings 101", emit_ts: "2026-08-10T04:45:00Z", daemon_fault: { consecutive: 1 } };
    assert("S880B THE STAMP RIDES BESIDE THE DELTA — withStamp never moves app/title/emit_ts/daemon_fault; stampOf/readStamp hand a liveness reader the stamp ONLY (never his window); an emit's default save carries the stamp through",
      held(() => {
        const s = withStamp(before, { poll_ts: at(0), pid: 4242, boot_ts: at(-60000) });
        return s.app === before.app && s.title === before.title && s.emit_ts === before.emit_ts && s.daemon_fault.consecutive === 1
          && s.poll_ts === at(0) && s.pid === 4242 && s.boot_ts === at(-60000)
          && withStamp(s, null).poll_ts === undefined && withStamp(s, null).emit_ts === before.emit_ts
          && Object.keys(stampOf(s)).sort().join() === "boot_ts,pid,poll_ts"
          && stampOf({ app: "x", title: "y", emit_ts: "z" }) === null && stampOf(null) === null
          && readStamp(join(tmpdir(), `s880b-no-such-state-${process.pid}.json`)) === null
          && /if \(posted\) \(deps\.save \|\| \(\(o\) => writeAtomic\(CONTEXT_STATE, withStamp\(o, stampOf\(readJson\(CONTEXT_STATE\)\)\)\)\)\)\(state\);/.test(SRC);
      }));

    // ROW 897 (s893, 14 Nov 2026) — SUPERSEDED, kept as history: this assert pinned the lane's
    // process-table call on the worker's verb (`(deps.procRead || processStartRead)(WORKER_MATCH)`, and
    // never on RESIDENT_MATCH). Its meaning holds over the stamp: only the WORKER stamps, so the lane's
    // pid and boot_ts are the worker's, the boot D9 compares; the restart verb is still the .vbs's.
    assert("S880B STATUS KEEPS ITS MEANING — under the keeper two processes carry `context.mjs daemon`; the lane reads the WORKER's own stamp (row 897: never the process table), whose boot_ts is the worker's BOOT_MS that D9 compares, and the restart verb is still read off the .vbs's `daemon` line",
      held(() => RESIDENT_MATCH === "context.mjs daemon"
        && /try \{ stampPoll\(\{ bootMs: BOOT_MS \}\); \}/.test(workerArm)
        && !/stampPoll\(/.test(keeperArm)
        && /const stamp = deps\.stamp !== undefined \? deps\.stamp : readStamp\(\);/.test(SRC)
        && /vbs\.includes\(RESIDENT_MATCH\)/.test(SRC)));

    const orgDir = dirname(__dirname);
    assert("S880B THE TEST DOOR — ARSENAL_CONTEXT_STATE_DIR opens only for an existing dir UNDER the temp root (else ignored), the poll door only with it (floored at the 500 ms wait step), and no env leaves his live dir and the 60 s floor",
      held(() => {
        const inDoor = contextDoor({ ARSENAL_CONTEXT_STATE_DIR: __dirname, ARSENAL_CONTEXT_POLL_MS: "1000" }, orgDir);
        const floor = contextDoor({ ARSENAL_CONTEXT_STATE_DIR: __dirname, ARSENAL_CONTEXT_POLL_MS: "50" }, orgDir);
        const outside = contextDoor({ ARSENAL_CONTEXT_STATE_DIR: orgDir, ARSENAL_CONTEXT_POLL_MS: "1000" }, __dirname);
        const itself = contextDoor({ ARSENAL_CONTEXT_STATE_DIR: orgDir, ARSENAL_CONTEXT_POLL_MS: "1000" }, orgDir);
        const pollOnly = contextDoor({ ARSENAL_CONTEXT_POLL_MS: "1000" }, orgDir);
        const missing = contextDoor({ ARSENAL_CONTEXT_STATE_DIR: join(__dirname, "no-such-dir-s880b"), ARSENAL_CONTEXT_POLL_MS: "1000" }, orgDir);
        const none = contextDoor({}, orgDir);
        return inDoor.stateDir === realpathSync(__dirname) && inDoor.pollMs === 1000 && floor.pollMs === 500
          && outside.stateDir === null && outside.pollMs === null && itself.stateDir === null
          && pollOnly.stateDir === null && pollOnly.pollMs === null && missing.stateDir === null
          && none.stateDir === null && none.pollMs === null && FLOOR_MS === 60000
          && /const STATE_DIR = DOOR\.stateDir \|\| join\(__dirname, "\.\.", "dressing-room", "state"\);/.test(SRC);
      }));
  }
  // ── /S880B ──

  // ------------------------------------------------------------------------
  // ── S893 SELFTESTS (row 897, F1 folded, 14 Nov 2026): STATUS READS ITS OWN STAMP, NEVER THE PROCESS TABLE ──
  // Planted both ways, as the brief orders: a FRESH stamp with NO process-table line reads running,
  // and a STALE stamp WITH a process-table line reads down. Every reading hands lane() a `procRead`
  // that says the OPPOSITE of the stamp and counts its calls, so a lane that still consulted the
  // process table would follow it (or, off Windows, read UNKNOWN) and red here. Every predicate runs
  // inside held(): this block, transplanted onto s880b's context.mjs (cloud/s893/fix/mutants/
  // f1_on_s880b.mjs), reds there BY NAME instead of crashing.
  // ------------------------------------------------------------------------
  {
    const held = (f) => { try { return !!f(); } catch { return false; } };
    const SRC = readFileSync(fileURLToPath(import.meta.url), "utf8").replace(/\r\n/g, "\n");
    const codeOf = (s) => s.split(/\r?\n/).filter((l) => !/^\s*(\/\/|\*)/.test(l)).join("\n");
    const laneCode = codeOf((SRC.split(/\nfunction lane\(deps = \{\}\) \{\n/)[1] || "").split(/\n\}\n/)[0]);
    const NOW = Date.parse("2026-11-14T06:00:00Z"), iso = (ms) => new Date(NOW + ms).toISOString();
    const BOOT_ISO = iso(-3600000);
    const FRESH = { poll_ts: iso(-1000), pid: 4242, boot_ts: BOOT_ISO };
    const STALE = { poll_ts: iso(-(STAMP_FRESH_MS + 60000)), pid: 4242, boot_ts: BOOT_ISO };
    let tableCalls = 0;
    const noLine = () => { tableCalls++; return { ms: null, looked: true, reason: "absent" }; };          // the table holds NO line for the bridge
    const aLine = () => { tableCalls++; return { ms: NOW - 600000, looked: true, reason: "found" }; };   // the table DOES hold one
    const OLDER = { ms: NOW - 7200000, file: "scripts/presence.mjs" }, NEWER = { ms: NOW - 60000, file: "scripts/presence.mjs" };
    const laneOf = (d) => { try { return lane({ expected: {}, vbs: "", now: NOW, ...d }); } catch { return null; } };
    const fresh = laneOf({ stamp: FRESH, procRead: noLine, graph: OLDER });
    const freshNewer = laneOf({ stamp: FRESH, procRead: noLine, graph: NEWER });
    const stale = laneOf({ stamp: STALE, procRead: aLine, graph: OLDER });
    const missing = laneOf({ stamp: null, procRead: aLine, graph: OLDER });
    const unreadable = laneOf({ stamp: { poll_ts: "not a time", pid: 4242, boot_ts: BOOT_ISO }, procRead: aLine, graph: OLDER });
    const linesOf = (ln) => { try { return statusLines(status({ rep: REP, lane: ln, state: null, fate: FATE })); } catch { return []; } };

    assert("S893 F1 A FRESH STAMP WITH NO PROCESS-TABLE LINE READS RUNNING — resident_running true, UP since the stamp's boot_ts, and the D9 build line compares THAT boot (current before it, STALE after it)",
      held(() => fresh.resident_running === true && fresh.resident_since === BOOT_ISO && fresh.resident_pid === 4242
        && fresh.build.checked === true && fresh.build.booted_ms === Date.parse(BOOT_ISO) && fresh.build.stale === false
        && freshNewer.build.stale === true && freshNewer.build.booted_ms === Date.parse(BOOT_ISO)));
    assert("S893 F1 A STALE STAMP READS DOWN, even with a process-table line — resident_running false, no boot borrowed, the build UNVERIFIED (nothing running)",
      held(() => stale.resident_running === false && stale.resident_since === null && stale.resident_pid === null
        && stale.build.checked === false && stale.probe_reason === null));
    assert("S893 F1 A MISSING OR UNREADABLE STAMP READS UNKNOWN (never green, never down), with its reason, even with a process-table line",
      held(() => missing.resident_running === null && missing.probe_reason === "context_state.json holds no stamp"
        && unreadable.resident_running === null && unreadable.probe_reason === "its stamp has no readable poll_ts"
        && missing.resident_since === null && unreadable.resident_since === null));
    assert("S893 F1 NEVER THE PROCESS TABLE — across these readings the process probe was called 0 times; lane()'s code reads readStamp() and judges by stampLiveness(); none of its code names a process probe, and context.mjs imports none",
      held(() => tableCalls === 0 && !!fresh && !!stale && !!missing && !!unreadable
        && /readStamp\(\)/.test(laneCode) && /stampLiveness\(stamp, nowMs\)/.test(laneCode)
        && !/processStart|procRead|Win32_Process|powershell/i.test(laneCode)
        && !/import \{[^}]*processStartRead[^}]*\} from "\.\/conductor\.mjs";/.test(SRC)));
    assert("S893 F1 THE SURFACE SAYS IT — UP names the fresh stamp and its boot; DOWN names the STALE stamp past its bound; UNKNOWN names its reason and never says the bridge is dark; the STALE build word carries the stamp's boot",
      held(() => linesOf(fresh).some((l) => l.includes(`resident process: UP since ${BOOT_ISO} — its own stamp is fresh`))
        && linesOf(stale).some((l) => /resident process: DOWN — its own stamp is STALE \(last poll [^,]+, \d+ s ago, past the \d+(\.\d+)? s bound\)/.test(l))
        && linesOf(stale).some((l) => /running build: UNVERIFIED — nothing is running/.test(l))
        && linesOf(missing).some((l) => /resident process: UNKNOWN — context_state\.json holds no stamp; a stamp that cannot be read is not a DOWN reading/.test(l))
        && linesOf(missing).every((l) => !/the bridge is dark/.test(l))
        && linesOf(freshNewer).some((l) => l.includes(`running build: STALE — booted ${BOOT_ISO}`))));
    assert("S893 F1 status() WIRES IT — with no lane injected, status() hands lane() its own deps, so the stamp it is given (else readStamp() off disk) decides resident_running",
      held(() => status({ rep: REP, state: null, fate: FATE, expected: {}, vbs: "", graph: OLDER, now: NOW, stamp: FRESH, procRead: noLine }).lane.resident_running === true
        && status({ rep: REP, state: null, fate: FATE, expected: {}, vbs: "", graph: OLDER, now: NOW, stamp: STALE, procRead: aLine }).lane.resident_running === false
        && tableCalls === 0));
  }
  // ── /S893 ──

  const passed = checks.every(Boolean);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// THE MODE GUARD (wiring audit, 11 Aug 2026) — ADDED THE DAY `status` GOT A CALLER
// ---------------------------------------------------------------------------
// Until today nothing invoked `status`, so the fall-through below was harmless.
// It is not harmless the moment a doctor is sent here: every unrecognised argv
// lands in the default branch, which is `once` — and `once` POSTs a live afferent
// to the thalamus and rewrites context_state.json. `context.mjs staus` would have
// MUTATED the organ someone was trying to take the temperature of, printed a
// success-shaped line and exited 0. Same defect, same ruling as examiner.mjs
// (11 Aug 2026) and timeaudit.mjs C5: modes are an ALLOWLIST, unknown → usage on
// stderr + exit 1, before anything is read, posted or written.
// BARE ARGV STILL MEANS `once`, byte for byte — that is what it has always meant
// and no live caller passes it (START_DAEMONS.vbs and ArsenalFC-Brain.bat both
// pass `daemon`; package.json passes `selftest`). Nothing is replaced here, so
// nothing is frozen *Legacy.
// ROW 880 (2) (s880b): `daemon-worker` joins the allowlist, the loop the keeper spawns. It is still an
// allowlist: an unknown mode refuses before anything is read, posted or written.
const MODES = new Set(["once", "status", "daemon", "--daemon", "daemon-worker", "selftest"]);
const USAGE = "usage: node scripts/context.mjs [once | status | daemon | daemon-worker | selftest]   (bare = once, which EMITS — `status` is the read-only one; `daemon` is the keeper, `daemon-worker` its poll)";

async function main() {
  const mode = (process.argv[2] || "once").toLowerCase().trim();
  if (!MODES.has(mode)) { console.error(`context: unknown mode "${process.argv[2]}"`); console.error(USAGE); process.exit(1); }
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "status") {
    for (const l of statusLines(status())) console.log(l);
    return;
  }
  if (mode === "daemon" || mode === "--daemon") {
    // THE KEEPER (row 880 (2) F2; scripts/keeper.mjs, forks rows 746 (2) / 753 (2)), the brain shape
    // exactly (brain.mjs:7617-7625). What the OS launches (the ArsenalFC-Context service, whose
    // <arguments> stay `scripts/context.mjs daemon`, and START_DAEMONS.vbs:33) is no longer the loop:
    // keep() spawns `daemon-worker` (the loop below) and never exits on its own, so the WinSW wrapper
    // never sees its child end. MEASURED (row 880, cloud/s880b/measure): 12 times since 30 Aug a retire
    // ended this process, WinSW's report of the exit to the SCM was refused ("Failed to open the
    // service control manager database. Access is denied"), and the wrapper stayed a zombie reading
    // Running with no child: 544.5 h dark, dark again since 13 Nov 22:47. brain.mjs's wrapper, kept
    // by the keeper since 15 Oct, logged 11 such deaths before it and ZERO after. `port: null`
    // because this bridge holds no port: the worker brings its own singleton (otherResident) and
    // exits 69 so that a second keeper waits a poll instead of minting a second bridge.
    await keep({ name: "context", worker: [process.execPath, fileURLToPath(import.meta.url), "daemon-worker", ...process.argv.slice(3)], port: null, pollMs: CONTEXT_POLL_MS });
    return;
  }
  if (mode === "daemon-worker") {
    // THE RESIDENT POLL, run under the keeper (row 880 (2)). Until row 880 this loop WAS `daemon`.
    // Every exit follows KEEP_EXIT (keeper.mjs:44): 75 RETIRED (its graph moved: respawn now) ·
    // 69 ALREADY RESIDENT (another live worker's fresh stamp: wait a poll) · 0 a clean stop by
    // signal. REFUSED (78) has no cause here: this bridge never reads ANTHROPIC_API_KEY and never
    // spends. A throw outside the poll's own catch is a crash, which the keeper backs off 10/30/60 s.
    // D9 — the boot instant, by brain.mjs's own formula (now minus uptime), so the stamp is
    // the PROCESS's start and not the moment this line executed. Measured once at boot; the
    // graph is re-read every poll, BEFORE the poll emits anything — an out-of-date resident
    // must not ship one more afferent on code the repo has moved past.
    const BOOT_MS = Date.now() - process.uptime() * 1000;
    // THE PORTLESS SINGLETON, at boot: before AW is read or the thalamus door is touched.
    const resident = otherResident(readStamp(), { now: Date.now() });
    if (resident) {
      console.log(`context: --daemon ALREADY RESIDENT — pid ${resident} stamped context_state.json within ${STAMP_FRESH_MS / 1000} s and is alive; this worker (pid ${process.pid}) exits ${KEEP_EXIT.ALREADY_RESIDENT} instead of a second bridge POSTing the door, and its keeper asks again in ${CONTEXT_POLL_MS / 1000} s.`);
      process.exitCode = KEEP_EXIT.ALREADY_RESIDENT;
      return;
    }
    let stop = false, emits = 0, retired = false, yielded = false, judgeDeferred = false;
    // D10 — this resident's own fault streak, plus whether a PREVIOUS resident left a block
    // behind: a fault from a process that no longer exists must not read as live, so the
    // first clean poll of a fresh daemon clears it too.
    let faults = 0;
    let faultOnDisk = !!(readJson(CONTEXT_STATE) || {}).daemon_fault;
    const onSig = () => { stop = true; };
    process.on("SIGINT", onSig); process.on("SIGTERM", onSig);
    console.log(`context: --daemon up (pid ${process.pid}, poll ~${CONTEXT_POLL_MS / 1000}s) — ambient AW → :4113 on window change, its liveness stamped on context_state.json every poll (row 880). Booted ${new Date(BOOT_MS).toISOString()}; retires itself if any file in its own module graph is written after that (D9), and its keeper respawns it. Ctrl-C to stop.`);
    while (!stop) {
      const bv = buildVerdict(BOOT_MS, graphNow());
      // unit mlv0 (forks row 1031 M4 A): a judge round holds its port (keeper.mjs JUDGE_PORT) — no retire while it runs; the
      // next poll checks again (a deferral, never a skipped retire).
      const judgeRunning = bv.checked && bv.stale ? await judgeHeld() : false;
      if (judgeRunning && !judgeDeferred) { console.log("context: --daemon retire DEFERRED — its graph moved after boot, but a judge round holds its port; retiring once it closes."); judgeDeferred = true; }
      if (bv.checked && bv.stale && !judgeRunning) {
        // The console is not a void: the VBS cloak redirects it to scripts/context.log
        // (audit finding #10), which is the same lane brain.mjs's retirement prints to.
        // SUPERSEDED BY ROW 880 (2), kept as history (layer, never replace): until 14 Nov this line
        // ended "Releasing the lane: daemon_watchdog.mjs relaunches it on the new code (portless ⇒
        // after two consecutive down passes, ≤~20 min), and `node scripts/context.mjs once` is the
        // manual probe meanwhile." That relaunch had not existed since S9 (28 Aug): each of the 12
        // measured retires left the WinSW wrapper a zombie. The keeper respawns at once now.
        console.log(`context: --daemon RETIRING — booted ${new Date(bv.booted_ms).toISOString()}, and ${bv.newest_file} was written ${new Date(bv.newest_ms).toISOString()}. An ESM process cannot reload its code, so staying up means emitting on the OLD bridge. Releasing the lane: its keeper (scripts/keeper.mjs) respawns the worker on the new code at once (exit ${KEEP_EXIT.RETIRED}); run with no keeper, \`node scripts/context.mjs once\` is the manual probe meanwhile.`);
        retired = true;
        break;
      }
      // THE PORTLESS SINGLETON, every poll, before anything is read or posted. Two workers that
      // boot within one poll of each other both pass the boot check (neither has stamped yet);
      // at the next poll the one that reads the other's fresh live stamp yields, and a yielder
      // writes nothing, so exactly one stays (row 880 (2): never a second bridge on the door).
      const rival = otherResident(readStamp(), { now: Date.now() });
      if (rival) {
        console.log(`context: --daemon ALREADY RESIDENT — pid ${rival} stamped context_state.json after this worker (pid ${process.pid}) did and is alive; this one yields (exit ${KEEP_EXIT.ALREADY_RESIDENT}) so ONE bridge POSTs the door.`);
        yielded = true;
        break;
      }
      try {
        const r = await sense();
        if (r.emitted) { emits++; console.log(`context: → ${r.evt.text}${r.evt.concept_tokens.length ? ` [${r.evt.concept_tokens.join(", ")}]` : ""}`); }
        // D10 — a poll that RETURNED is a poll that did not throw, emit or no emit. Clear
        // the block the moment the loop works again, or a healed bridge reads FAULTING
        // forever. sense()'s own save writes only the delta fields, so an emit already
        // drops it; this covers the quiet polls (no-change / no-window / post-failed),
        // which are the majority and never write at all.
        if (faults || faultOnDisk) {
          const cur = readJson(CONTEXT_STATE);
          if (cur && cur.daemon_fault) { try { writeAtomic(CONTEXT_STATE, withFault(cur, null)); } catch {} }
          console.log(`context: --daemon recovered — ${faults} consecutive faulting poll(s) ended; the loop is polling again.`);
          faults = 0; faultOnDisk = false;
        }
      } catch (e) {
        // NEVER TAXES STILL HOLDS — the loop continues, nothing is pushed, nobody is asked.
        // What changed is that it no longer happens in silence: the streak lands in the one
        // file this bridge owns (delta fields untouched, per withFault) so `status` — and
        // through it the /organism-doctor pass — can see a wedged loop that keeps its PID.
        faults++;
        const note = faultNote(readJson(CONTEXT_STATE), e, new Date().toISOString(), process.pid);
        // Wrapped: a throwing writeAtomic is one of the three faults being reported, so the
        // console line below has to survive it. That is the forensic lane; the disk block is
        // the organ-readable one, and when the disk is the problem only the log will have it.
        try { writeAtomic(CONTEXT_STATE, withFault(readJson(CONTEXT_STATE), note)); faultOnDisk = true; } catch {}
        console.log(`context: --daemon poll FAULTED — ${faults} in a row in this resident, ${note.consecutive} on disk since ${note.since} (continuing; the health surface carries the streak): ${note.last_error}`);
      }
      // F1 · THE PER-POLL STAMP (row 880 (2)) — on EVERY poll: emit or no emit, fault or no fault.
      // It is how daemon_watchdog sees this bridge (fresh UP, stale DOWN, missing UNKNOWN). A stamp
      // that cannot be written goes stale, and DOWN is then the truth about a bridge that cannot
      // write its own file; the line below is the forensic trace.
      try { stampPoll({ bootMs: BOOT_MS }); }
      catch (e) { console.log(`context: --daemon stamp write FAILED (it will read stale, so DOWN): ${String((e && e.message) || e).replace(/\s+/g, " ").trim().slice(0, FAULT_MSG_CAP)}`); }
      await new Promise((res) => { const step = 500; let el = 0; const iv = setInterval(() => { el += step; if (stop || el >= CONTEXT_POLL_MS) { clearInterval(iv); res(); } }, step); });
    }
    console.log(`context: --daemon stopped (${emits} emit(s)).`);
    // What the keeper reads (keeper.mjs decide, :49-57): 75 respawn now · 69 wait a poll · 0 a clean stop.
    process.exitCode = retired ? KEEP_EXIT.RETIRED : yielded ? KEEP_EXIT.ALREADY_RESIDENT : KEEP_EXIT.CLEAN;
    return;
  }
  const r = await sense();
  // sense() returns emitted === posted, so an emitted-but-not-posted arm can never
  // print — the two "(thalamus down…)" clauses that used to sit here were dead code,
  // and the `once` one claimed "state updated" when a failed post deliberately does
  // NOT advance state (retry law above). A failed post speaks through the honest
  // branch: "no emit (post-failed-will-retry)". (Audit, 7 Aug 2026.)
  console.log(r.emitted
    ? `context: emitted → ${r.evt.text}${r.evt.concept_tokens.length ? ` [concept: ${r.evt.concept_tokens.join(", ")}]` : ""}`
    : `context: no emit (${r.reason})`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { sense, currentWindow, conceptOfTitle, status, lane, statusLines };
