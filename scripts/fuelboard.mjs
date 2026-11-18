#!/usr/bin/env node
// ============================================================================
// fuelboard.mjs · ARSENAL AI FC — THE FUELBOARD (eight tanks, one gauge)
// ----------------------------------------------------------------------------
// WHAT:  The account-allocation ledger that makes "7 parallel regions" real
//        (CYBORG_BRAIN.md §5, §8). Rate limits are per-PROJECT, so 7 accounts
//        = 7 independent quota pools, each pinned to a DIFFERENT region/model:
//        T1 Gaffer (mouth) · T2 Watcher (vision) · T3 Cochlea (ears, OFF by
//        default) · T4 Bridge (Opus via cortex — not a Gemini tank) · T5 Scout
//        (research) · T6 Hippocampus (embeddings) · T7 DMN (default-mode +
//        failover shock absorber) · T8 Distiller (working-set — added with the
//        working-memory build; §5's seven regions + one).
// LAWS:  sole writer of tanks.json (gitignored runtime). THE STARVATION GUARD
//        (ported verbatim from the brain's P0 fix): a 429 records
//        observed_ceiling = Math.max(quota_est, used_today) — a limit event at
//        low usage can NEVER strand a region at ceiling=1. pickTank NEVER
//        borrows T1/T2 mid-conversation (a user-visible stall is worse than a
//        deferred job). All tanks cold → the caller degrades (drop vision →
//        drop to text → HARD STOP) — a quota outage never silently drains the
//        Opus window. The DMN may only spend a tank's measured headroom
//        (ceiling − used − reserve): use-it-or-lose-it, blast radius $0.
//        naive_shadow counter: callers report what a naive all-Opus run would
//        have cost, so the gauge shows the real multiplier the thalamus saves.
//        UNIT FUEL (13 Nov 2026, forks row 841): a tank names a ROLE (T4 an
//        ENGINE label) and its model is READ through models.mjs at read time;
//        `config migrate-roles` is the SOLE WRITER of fuelboard_config.json.
// MODES: node scripts/fuelboard.mjs status        → the 7-bar fuel gauge
//        node scripts/fuelboard.mjs use <id> [units] [naive_tokens]
//        node scripts/fuelboard.mjs fault <id>    → record a 429 on a tank
//        node scripts/fuelboard.mjs config migrate-roles --why "<text>" [--config <path>]
//                                                 → the ONE named rewrite of fuelboard_config.json
//        node scripts/fuelboard.mjs selftest
// ============================================================================

import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync, rmSync, statSync, utimesSync, mkdtempSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";   // unit FUEL — the owner verb prints the file's sha256 before and after
import { resolveSync as modelsResolve, SEED } from "./models.mjs";   // LAW M (18 Aug 2026): tanks name roles; the resolver names the model
import { swallow } from "./swallow.mjs";   // Vgates (forks rows 871 / 873): the selftest's temp-dir cleanup is declared, never silent (Block 7)

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CONFIG    = join(STATE_DIR, "fuelboard_config.json");
const TANKS     = join(STATE_DIR, "tanks.json");
const TANK_LOCK = TANKS + ".lock";

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const has = (o, k) => !!o && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k);

// LAW M (MODELS + ACTS Block 1, 18 Aug 2026): a tank names a ROLE; the model shown is what the
// resolver names for that role right now (env → nightly probe → seed) — this file never carries a
// literal model name (`node scripts/models.mjs check`). Cochlea's is the live role's second seed
// candidate (the warm-but-shallow native-audio option), still disabled.
// UNIT FUEL (row 841, 13 Nov 2026): the defaults carry NO model — it is resolved at READ time (readTank,
// below), so an env set or a probe run after this module loads still moves the board. T4 Bridge names
// an ENGINE, a LABEL for the Opus window (row 841 (2)): no model key, no role.
const roleModel = (role) => modelsResolve(role).model;
const pickModel = (id, role) => (id === "T3" && role === "live" && SEED.live[1]) || roleModel(role);   // T3 keeps its pick since LAW M
const DEFAULT_TANKS = [
  { id: "T1", name: "Gaffer",      region: "mouth",        key_index: 0,    role: "live",                quota_est: 90,   enabled: true },
  { id: "T2", name: "Watcher",     region: "vision",       key_index: 1,    role: "live",                quota_est: 90,   enabled: true },
  { id: "T3", name: "Cochlea",     region: "ears",         key_index: 2,    role: "live",                quota_est: 60,   enabled: false },
  { id: "T4", name: "Bridge",      region: "prefrontal",   key_index: null, engine: "opus-via-cortex",   quota_est: 0,    enabled: true },
  { id: "T5", name: "Scout",       region: "research",     key_index: 3,    role: "pro",                 quota_est: 50,   enabled: true },
  { id: "T6", name: "Hippocampus", region: "memory",       key_index: 4,    role: "embed",               quota_est: 1000, enabled: true },
  { id: "T7", name: "DMN",         region: "default-mode", key_index: 5,    role: "text",                quota_est: 250,  enabled: true },
  { id: "T8", name: "Distiller",   region: "working-set",  key_index: 6,    role: "text",                quota_est: 250,  enabled: true },
];
// UNIT FUEL · THE READ RULE (row 841) — what a tank row NAMES, decided when it is read, never stored:
//   · a row with `role`   → the model models.mjs resolves for that role NOW; a `model` beside the role is IGNORED;
//   · a row with `engine` → a LABEL (T4): no model is resolved, and the board shows the engine;
//   · a row with none of role / engine / model → its DEFAULT_TANKS twin by id lends its role (or engine) and
//     whatever field the row lacks — the FILE's own fields win, so the reader never turns a tank on or off;
//   · a row with `model` only is a file the owner verb has not migrated → its literal shows, marked as such
//     (the verb, not the reader, changes what the board names: the discrimination).
function readTank(row) {
  if (!row || typeof row !== "object") return row;
  if (has(row, "role")) return { ...row, model: typeof row.role === "string" ? pickModel(row.id, row.role) : null };
  if (has(row, "engine")) return { ...row, model: null };
  if (has(row, "model")) return { ...row };
  const twin = DEFAULT_TANKS.find((d) => d.id === row.id);
  return twin ? readTank({ ...twin, ...row }) : { ...row, model: null };
}
function loadTankConfig(path = CONFIG) {
  const c = readJson(path);
  return ((c && Array.isArray(c.tanks) && c.tanks.length) ? c.tanks : DEFAULT_TANKS).map(readTank);
}

// ---------------------------------------------------------------------------
// THE BOARD — config ⊕ runtime, day-reset at local midnight
// ---------------------------------------------------------------------------
function loadBoard(deps = {}) {
  const cfgTanks = deps.config ? deps.config.map(readTank) : loadTankConfig();
  const rt = (deps.readState || (() => readJson(TANKS)))() || {};
  const today = localDate(deps.now || new Date());
  const tanks = cfgTanks.map(t => {
    const s = (rt.tanks && rt.tanks[t.id]) || {};
    const fresh = s.day === today;
    return {
      ...t,
      day: today,
      used_today: fresh ? (s.used_today || 0) : 0,
      faults_today: fresh ? (s.faults_today || 0) : 0,
      // the ceiling survives the day-reset (it is a learned property of the
      // account, not of the day) — but the STARVATION GUARD floors it always
      observed_ceiling: Math.max(t.quota_est, s.observed_ceiling || 0),
      last_429: fresh ? (s.last_429 || null) : null,
    };
  });
  return { day: today, tanks, naive_shadow_tokens: rt.naive_shadow_tokens || 0, actual_units: rt.actual_units || 0 };
}
function saveBoard(board, deps = {}) {
  const out = { day: board.day, updated_at: new Date().toISOString(), naive_shadow_tokens: board.naive_shadow_tokens, actual_units: board.actual_units, tanks: {} };
  for (const t of board.tanks) out.tanks[t.id] = { day: t.day, used_today: t.used_today, faults_today: t.faults_today, observed_ceiling: t.observed_ceiling, last_429: t.last_429, state: stateOf(t) };
  (deps.writeState || ((o) => writeAtomic(TANKS, o)))(out);
  return out;
}
function stateOf(t) {
  if (!t.enabled) return "DEAD";
  if (t.key_index === null) return t.id === "T4" ? "HOT" : "DEAD";   // the Bridge is budgeted by the brain ledger, not here
  if (t.last_429) return "COLD";                                      // faulted → cold till local midnight
  const ceiling = Math.max(t.quota_est, t.observed_ceiling || 0);
  if (!ceiling) return "DEAD";
  return t.used_today < ceiling * 0.8 ? "HOT" : "WARM";
}
// what the DMN may spend: measured headroom minus a reserve — never the core
function headroomOf(t, reserveFrac = 0.15) {
  const ceiling = Math.max(t.quota_est, t.observed_ceiling || 0);
  return Math.max(0, Math.floor(ceiling * (1 - reserveFrac)) - t.used_today);
}

// ---------------------------------------------------------------------------
// THE TANK LOCK — cross-PROCESS mutual exclusion around load→mutate→save.
// E2E audit (25 Jul 2026, finding 3e32616e): "single writer" held only INSIDE
// one process. The verbs are fully synchronous, so no two of them interleave in
// a single node — but many PROCESSES import them: the hourly dmn pass fires
// 50-100 recordUse writes across a stadium night, council.mjs records seat
// spends whenever cortex/nightshift convenes it, and `fuelboard.mjs status`
// re-saves the whole board. Two of those overlapping = classic lost update:
// both load "T7 used 40", both write 41, one unit of spend evaporates and the
// gauge under-reports — which is exactly the number the STARVATION GUARD later
// freezes into observed_ceiling on a 429. So the whole read-modify-write now
// runs under an exclusive lockfile (O_EXCL create, atomic on Windows + POSIX).
// Two deliberate degradations, because a fuel ledger must never block a spend:
//   · a STALE lock (holder crashed mid-write) is broken after LOCK_STALE_MS —
//     a dead organ can never wedge the board for the season;
//   · if the wait budget expires we proceed UNLOCKED and say so (`locked:false`)
//     — that is exactly today's behaviour, so we are never worse than before.
// ---------------------------------------------------------------------------
const LOCK_STALE_MS = 10_000;   // no honest holder keeps a sync file write this long
const LOCK_WAIT_MS  = 2_000;    // patience before we give up and write anyway
const LOCK_STEALS   = 3;        // bounded stale-breaking: never spin forever
const sleepSync = (ms) => {
  // synchronous sleep — the verbs are sync by contract and callers depend on
  // the return value being the settled board, so we must not go async here
  try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }
  catch { const end = Date.now() + ms; while (Date.now() < end) { /* spin */ } }
};
function acquireTankLock(lockPath = TANK_LOCK, { waitMs = LOCK_WAIT_MS, staleMs = LOCK_STALE_MS } = {}) {
  const deadline = Date.now() + waitMs;
  let steals = 0;
  for (;;) {
    try {
      mkdirSync(dirname(lockPath), { recursive: true });
      writeFileSync(lockPath, JSON.stringify({ pid: process.pid, at: new Date().toISOString() }), { flag: "wx" });
      return () => { try { rmSync(lockPath, { force: true }); } catch {} };
    } catch (e) {
      if (!e || e.code !== "EEXIST") return () => {};   // fs unusable → never block the spend
      let age = Infinity;
      try { age = Date.now() - statSync(lockPath).mtimeMs; } catch {}
      if (age > staleMs && steals < LOCK_STEALS) { steals += 1; try { rmSync(lockPath, { force: true }); } catch {} continue; }
      if (Date.now() >= deadline) return null;          // waited long enough → caller proceeds unlocked
      sleepSync(25);
    }
  }
}
// deps.readState/writeState = an in-memory board (selftest, or a caller that
// owns its own state) → it never touches the shared file, so it needs no lock.
// deps.acquireLock is honoured either way so the lock discipline is testable.
function withTankLock(deps, fn) {
  const inMemory = !!(deps.readState || deps.writeState);
  const acquire  = deps.acquireLock || (inMemory ? null : acquireTankLock);
  const release  = acquire ? acquire(deps.lockPath || TANK_LOCK) : null;
  try { return fn(release !== null); }
  finally { if (typeof release === "function") release(); }
}

// ---------------------------------------------------------------------------
// THE LEDGER VERBS (single writer: every mutation loads → mutates → saves,
// now serialised across processes by the tank lock above)
// ---------------------------------------------------------------------------
function recordUse(tankId, units = 1, naiveTokens = 0, deps = {}) {
  return withTankLock(deps, (locked) => {
    const board = loadBoard(deps);
    const t = board.tanks.find(x => x.id === tankId);
    if (!t) return { ok: false, error: "no such tank" };
    t.used_today += Math.max(0, Number(units) || 0);
    board.actual_units += Math.max(0, Number(units) || 0);
    board.naive_shadow_tokens += Math.max(0, Number(naiveTokens) || 0);
    saveBoard(board, deps);
    return { ok: true, used_today: t.used_today, state: stateOf(t), locked };
  });
}
function record429(tankId, deps = {}) {
  return withTankLock(deps, (locked) => {
    const board = loadBoard(deps);
    const t = board.tanks.find(x => x.id === tankId);
    if (!t) return { ok: false, error: "no such tank" };
    // THE STARVATION GUARD (the brain's P0 fix, ported): the observed ceiling is
    // NEVER recorded below the conservative estimate — a 429 at low usage must
    // not strand the region at ceiling≈0 and silently kill it for the season.
    t.observed_ceiling = Math.max(t.quota_est, t.used_today);
    t.last_429 = new Date().toISOString();
    t.faults_today += 1;
    saveBoard(board, deps);
    return { ok: true, observed_ceiling: t.observed_ceiling, state: stateOf(t), locked };
  });
}

// ---------------------------------------------------------------------------
// THE ROUTER — pinned tank first, T7 shock-absorber second, any idle HOT third.
// NEVER borrows T1/T2 mid-conversation (a user-visible stall breaks the voice).
// Returns null when everything is cold: the caller must DEGRADE, never touch
// the Opus window for reflex work.
// ---------------------------------------------------------------------------
function pickTank(region, { inConversation = false, board } = {}, deps = {}) {
  const b = board || loadBoard(deps);
  const usable = (t) => ["HOT", "WARM"].includes(stateOf(t)) && t.key_index !== null;
  const pinned = b.tanks.find(t => t.region === region);
  if (pinned && usable(pinned)) return pinned;
  const t7 = b.tanks.find(t => t.id === "T7");
  if (t7 && t7.region !== region && usable(t7)) return t7;
  for (const t of b.tanks) {
    if (t.region === region || t.id === "T7") continue;
    if (inConversation && (t.id === "T1" || t.id === "T2")) continue;   // never mid-talk
    if (usable(t)) return t;
  }
  return null;                                       // all cold → degrade, hard stop before Opus
}

// UNIT FUEL: what the line SHOWS a tank naming — the role and the model the read rule resolved for it, the
// Bridge's engine label, or (an un-migrated file) the literal as the file wrote it, marked as one.
function nameOf(t) {
  if (has(t, "role")) return `role ${t.role} → ${t.model || "NO model (models.mjs resolves none for it)"}`;
  if (has(t, "engine")) return `engine ${t.engine}`;
  if (t.model) return `${t.model} (file literal, not migrated)`;
  return "names no model";
}
// the gauge — the organism's interoception, 7 bars
function gaugeLines(board = loadBoard()) {
  return board.tanks.map(t => {
    const ceiling = Math.max(t.quota_est, t.observed_ceiling || 0) || 1;
    const pct = Math.max(0, Math.min(1, 1 - t.used_today / ceiling));
    const bars = "▓".repeat(Math.round(pct * 8)).padEnd(8, "░");
    return `${t.id} ${t.name.padEnd(11)} ${bars} ${String(Math.round(pct * 100)).padStart(3)}% · ${stateOf(t)} · ${nameOf(t)}${t.faults_today ? ` · ${t.faults_today} fault(s)` : ""}`;
  });
}
function summary(board = loadBoard()) {
  return board.tanks.map(t => {
    const ceiling = Math.max(t.quota_est, t.observed_ceiling || 0) || 1;
    return { id: t.id, name: t.name, state: stateOf(t), pct: Math.round(Math.max(0, Math.min(1, 1 - t.used_today / ceiling)) * 100), key_index: t.key_index, model: t.model, role: has(t, "role") ? t.role : null, engine: has(t, "engine") ? t.engine : null, enabled: t.enabled };
  });
}

// ---------------------------------------------------------------------------
// UNIT FUEL · THE OWNER VERB (13 Nov 2026 — forks row 841 (1)(2)(3))
//   node scripts/fuelboard.mjs config migrate-roles --why "<text>" [--config <path>]
// fuelboard_config.json had NO writer: hand-written 7 Aug, before LAW M, it carried eight model literals and no
// role, and loadTankConfig returns the FILE's tanks — so July's names won the board for three months while
// DEFAULT_TANKS named roles. This verb is its SOLE WRITER, for ONE named rewrite (row 841 (1): not a setter
// that imitates a hand), dispatched FIRST in main() — above every mode that writes — and:
//   · REFUSES with exit 2 and a named line: tanks that do not match DEFAULT_TANKS by id · an already-migrated
//     file (a role or an engine on any tank, or a receipt key: never a second rewrite) · a missing --why · an
//     unparsable file · a --config not named fuelboard_config.json — plus the narrow fences: any other verb,
//     an unknown flag, a file that is not a JSON object with a `tanks` array, a file that is not UTF-8;
//   · gives each tank its DEFAULT_TANKS twin's naming key by id, in the seat its `model` held: `role` for
//     seven, `engine: "opus-via-cortex"` for T4 (a LABEL, row 841 (2) — no model, no role);
//   · moves every tank's literal `model` into ONE dated receipt key `_tank_models_retired_<YYYY-MM-DD>`,
//     directly after `tanks`: each id's old value, the why, and the FORMAT CHANGE named (nothing deleted, L9);
//   · keeps every other key and `_doc` verbatim, and NEVER touches id, name, region, key_index, quota_est or
//     enabled — the post-condition proves it before a byte moves: it renames what a tank names, it never
//     turns a tank on or off;
//   · THE FORMAT (row 841 (1)): his hand-aligned table round-trips under no JSON.stringify form, so this first
//     write changes it ONCE to the verb's own form — this organ's writeAtomic form, JSON.stringify(o, null, 2)
//     + "\n" (tanks.json's) — and from then on the file round-trips under it;
//   · writes atomically through writeAtomic (per-pid tmp + rename), and ends on ONE line:
//     `fuelboard config: migrate-roles · <n> tank(s) roled · T4 engine · receipt <key> · sha <12> -> <12>`.
// It reads nothing but the one file and writes nothing but that file: never tanks.json, never the lock.
// ---------------------------------------------------------------------------
const VERB_USAGE = `node scripts/fuelboard.mjs config migrate-roles --why "<text>" [--config <path>]`;
const RECEIPT_PREFIX = "_tank_models_retired_";
const VERB_FORM = (o) => JSON.stringify(o, null, 2) + "\n";        // = writeAtomic's form (the selftest pins the two together)
const FORMAT_CHANGE = "hand-aligned table (one tank per line, padded columns; it round-trips under no JSON.stringify form) -> the verb's own form JSON.stringify(o, null, 2) + \"\\n\" (fuelboard.mjs writeAtomic, tanks.json's form); from this write on the file round-trips under it";
// law-waiver:jugad the config file's own tank KEYS the verb keeps byte-equal, a closed schema its selftest pins, never a subject list (forks row 649 (0))
const SIX_FIELDS = ["id", "name", "region", "key_index", "quota_est", "enabled"];
const sha12 = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 12);
// PURE: the text the verb would write, or the named reason it refuses. No fs here.
function migrateRolesEdit(text, why, now = new Date()) {
  let o;
  try { o = JSON.parse(text); } catch (e) { return { ok: false, why: `the file is unparsable JSON (${String((e && e.message) || e).slice(0, 160)}) — nothing written` }; }
  if (!o || typeof o !== "object" || Array.isArray(o)) return { ok: false, why: "the file is not a JSON object — nothing written" };
  if (!Array.isArray(o.tanks)) return { ok: false, why: "the file has no `tanks` array — this verb migrates his registry, it never invents one; nothing written" };
  // NEVER A SECOND REWRITE: a role or an engine on any tank, or any receipt key, means the rewrite has happened
  const named = o.tanks.filter((t) => has(t, "role") || has(t, "engine")).map((t) => String(t.id));
  const receipts = Object.keys(o).filter((k) => k.startsWith(RECEIPT_PREFIX));
  if (named.length || receipts.length) return { ok: false, why: `the file is already migrated (${[named.length ? `role/engine on ${named.join(", ")}` : "", receipts.length ? `receipt ${receipts.join(", ")}` : ""].filter(Boolean).join(" · ")}) — never a second rewrite; nothing written` };
  // BY ID: every tank is a DEFAULT_TANKS twin, each exactly once, all eight present
  const ids = o.tanks.map((t) => (t && typeof t === "object" ? t.id : undefined));
  const want = DEFAULT_TANKS.map((d) => d.id);
  const dup = [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))], missing = want.filter((x) => !ids.includes(x)), extra = ids.filter((x) => !want.includes(x));
  if (dup.length || missing.length || extra.length) return { ok: false, why: `the file's tanks do not match DEFAULT_TANKS by id (${[extra.length ? `unknown ${extra.map(String).join(", ")}` : "", missing.length ? `missing ${missing.join(", ")}` : "", dup.length ? `twice ${dup.map(String).join(", ")}` : ""].filter(Boolean).join(" · ")}; DEFAULT_TANKS: ${want.join(" ")}) — nothing written` };
  const key = `${RECEIPT_PREFIX}${localDate(now)}`;
  const models = {};
  const tanks = o.tanks.map((t) => {
    const twin = DEFAULT_TANKS.find((d) => d.id === t.id);
    const naming = has(twin, "engine") ? { engine: twin.engine } : { role: twin.role };
    models[t.id] = has(t, "model") ? t.model : null;
    const nt = {};
    let seated = false;
    for (const [k, v] of Object.entries(t)) {
      if (k === "model") { Object.assign(nt, naming); seated = true; continue; }   // the naming key takes the literal's seat
      nt[k] = v;                                                                     // every other field rides through as the FILE has it
    }
    if (!seated) Object.assign(nt, naming);
    return nt;
  });
  const receipt = { why, models, format: FORMAT_CHANGE, by: "node scripts/fuelboard.mjs config migrate-roles (unit FUEL, forks row 841)" };
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    out[k] = k === "tanks" ? tanks : v;
    if (k === "tanks") out[key] = receipt;
  }
  // THE POST-CONDITION, checked before any byte moves: every other key byte-identical and in place, the receipt
  // directly after `tanks`, and each tank's six fields exactly as the FILE had them (value AND presence).
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const keys = Object.keys(o), at = keys.indexOf("tanks");
  const held = same(Object.keys(out), [...keys.slice(0, at + 1), key, ...keys.slice(at + 1)])
    && keys.every((k) => k === "tanks" || same(out[k], o[k]))
    && out.tanks.length === o.tanks.length
    && out.tanks.every((nt, i) => SIX_FIELDS.every((f) => has(nt, f) === has(o.tanks[i], f) && same(nt[f], o.tanks[i][f]))
      && !has(nt, "model") && (has(nt, "engine") ? !has(nt, "role") : typeof nt.role === "string"))
    && same(Object.keys(out[key].models), ids);
  if (!held) return { ok: false, why: "the rewrite would touch more than each tank's naming key plus ONE receipt — nothing written" };
  const outText = VERB_FORM(out);
  if (VERB_FORM(JSON.parse(outText)) !== outText) return { ok: false, why: "the rewrite would not round-trip under the verb's own form — nothing written" };
  return { ok: true, out: outText, obj: out, key, retired: ids.length, roled: tanks.filter((t) => has(t, "role")).length, engines: tanks.filter((t) => has(t, "engine")).map((t) => t.id) };
}
// the CLI around it: parse, refuse by name, write atomically, one last line. Returns the exit code.
function configMain(args, io = {}) {
  const say = io.say || ((m) => console.log(m));
  const refuse = (why) => { say(`fuelboard config: REFUSED — ${why}`); return 2; };
  const a = Array.isArray(args) ? args.map(String) : [];
  if (a[0] !== "migrate-roles") return refuse(`the one verb is \`${VERB_USAGE}\` — fuelboard_config.json has ONE writer and ONE named rewrite (row 841 (1)); nothing written`);
  let why = null, path = CONFIG, bad = null;
  for (let i = 1; i < a.length && !bad; i++) {
    if (a[i] === "--why") { why = a[++i]; continue; }
    if (a[i] === "--config") { path = a[++i]; continue; }
    bad = a[i].startsWith("--") ? `unknown flag ${a[i]}` : `an unexpected argument "${a[i]}"`;
  }
  if (bad) return refuse(`${bad} — usage: ${VERB_USAGE}; nothing written`);
  if (typeof why !== "string" || !why.trim()) return refuse(`--why "<text>" is required — the receipt carries it; nothing written`);
  if (typeof path !== "string" || !path) return refuse(`--config needs a path — usage: ${VERB_USAGE}; nothing written`);
  if (basename(path) !== basename(CONFIG)) return refuse(`--config must name a ${basename(CONFIG)} (got ${basename(path)}) — this verb writes that one file and no other; nothing written`);
  let buf;
  try { buf = readFileSync(path); } catch (e) { return refuse(`cannot read ${path} (${(e && e.code) || e}); nothing written`); }
  const text = buf.toString("utf8");
  if (!Buffer.from(text, "utf8").equals(buf)) return refuse(`${path} is not valid UTF-8 — nothing written`);
  const ed = migrateRolesEdit(text, why.trim(), io.now || new Date());
  if (!ed.ok) return refuse(ed.why);
  try { writeAtomic(path, ed.obj); } catch (e) { say(`fuelboard config: WRITE FAILED — ${(e && e.message) || e} (tmp + rename: the file is as it was)`); return 1; }
  say(`fuelboard config: retired ${ed.retired} model literal(s) into ${ed.key} (directly after tanks) · the format change is named in it: hand-aligned -> JSON.stringify(o, null, 2) + "\\n"`);
  say(`fuelboard config: migrate-roles · ${ed.roled} tank(s) roled · ${ed.engines.join(" ")} engine · receipt ${ed.key} · sha ${sha12(buf)} -> ${sha12(Buffer.from(ed.out, "utf8"))}`);
  return 0;
}

// ---------------------------------------------------------------------------
// selftest
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const mem = (init = null) => { let s = init; return { readState: () => s, writeState: (o) => { s = o; }, get: () => s }; };
  const liveBefore = existsSync(CONFIG) ? sha12(readFileSync(CONFIG)) : null;   // unit FUEL: his file, read once, never written

  // the board + day reset
  {
    const m = mem({ day: "2026-07-13", tanks: { T1: { day: "2026-07-13", used_today: 55, observed_ceiling: 120, last_429: "x" } } });
    const b = loadBoard({ ...m, now: new Date("2026-07-14T08:00:00") });
    const t1 = b.tanks.find(t => t.id === "T1");
    assert("local-midnight reset: usage + faults + 429 clear, day rolls", t1.used_today === 0 && t1.last_429 === null);
    assert("the LEARNED ceiling survives the day-reset (property of the account)", t1.observed_ceiling === 120);
    assert("eight tanks, eight regions, each a different job", b.tanks.length === 8 && new Set(b.tanks.map(t => t.region)).size === 8);
  }
  // THE STARVATION GUARD (the P0 fix, ported)
  {
    const m = mem();
    recordUse("T7", 3, 0, m);
    const r = record429("T7", m);
    assert("STARVATION GUARD: a 429 at LOW usage floors the ceiling at the estimate", r.observed_ceiling === 250 && r.observed_ceiling !== 3);
    const m2 = mem({ day: localDate(), tanks: { T7: { day: localDate(), used_today: 400, observed_ceiling: 0 } } });
    const r2 = record429("T7", m2);
    assert("a 429 at HIGH usage records the true observed ceiling", r2.observed_ceiling === 400);
    assert("faulted tank reads COLD (till midnight)", r2.state === "COLD");
  }
  // the router
  {
    const b = loadBoard({ readState: () => null });
    const pick = pickTank("vision", { board: b });
    assert("pinned tank first: vision → T2", pick && pick.id === "T2");
    b.tanks.find(t => t.id === "T2").last_429 = "now";
    const fall = pickTank("vision", { board: b });
    assert("pinned cold → T7 absorbs the region (the shock absorber)", fall && fall.id === "T7");
    b.tanks.find(t => t.id === "T7").last_429 = "now";
    const third = pickTank("vision", { board: b, inConversation: true });
    assert("T7 also cold → borrows an idle tank, NEVER T1 mid-conversation", third && third.id !== "T1" && third.id !== "T2" && third.id !== "T7");
    for (const t of b.tanks) if (t.key_index !== null) t.last_429 = "now";
    assert("ALL tanks cold → null (degrade; hard stop before the Opus window)", pickTank("vision", { board: b }) === null);
  }
  // DMN headroom + the dead/disabled states
  {
    const b = loadBoard({ readState: () => null });
    const t7 = b.tanks.find(t => t.id === "T7");
    t7.used_today = 100;
    assert("DMN headroom = ceiling·(1−reserve) − used (use-it-or-lose-it only)", headroomOf(t7) === Math.floor(250 * 0.85) - 100);
    const t3 = b.tanks.find(t => t.id === "T3");
    assert("Cochlea ships DISABLED (a preview surface behind a pref) → DEAD", stateOf(t3) === "DEAD");
    const t4 = b.tanks.find(t => t.id === "T4");
    assert("the Bridge tank is budgeted by the brain ledger, not this board", stateOf(t4) === "HOT" && headroomOf(t4) === 0);
  }
  // the naive-shadow multiplier + the gauge
  {
    const m = mem();
    recordUse("T1", 5, 40000, m);
    recordUse("T7", 2, 80000, m);
    assert("naive_shadow accumulates what all-Opus would have cost", m.get().naive_shadow_tokens === 120000 && m.get().actual_units === 7);
    const lines = gaugeLines(loadBoard(m));
    assert("the gauge draws 8 bars with states", lines.length === 8 && lines.every(l => /[▓░]{8}/.test(l)) && lines.some(l => l.includes("HOT")));
    const s = summary(loadBoard(m));
    assert("the page summary carries id/state/pct for the fuel line", s.length === 8 && s.every(x => "pct" in x && "state" in x));
  }
  // THE TANK LOCK (E2E audit 25 Jul 2026, 3e32616e — lost updates across
  // processes). Runs against a throwaway lock path in the OS temp dir so the
  // selftest never touches the captain's live tanks.json or its lock.
  {
    const lp = join(tmpdir(), `fuelboard_selftest_${process.pid}.lock`);
    try { rmSync(lp, { force: true }); } catch {}
    const rel = acquireTankLock(lp, { waitMs: 0 });
    assert("tank lock: the first writer takes the board", typeof rel === "function");
    assert("tank lock: a SECOND process cannot enter the read-modify-write", acquireTankLock(lp, { waitMs: 0 }) === null);
    rel();
    const rel2 = acquireTankLock(lp, { waitMs: 0 });
    assert("tank lock: released → the next spend walks straight in", typeof rel2 === "function");
    rel2();
    // a holder that crashed mid-write: backdate the lock past LOCK_STALE_MS so
    // this exercises the REAL staleness rule, not a doctored threshold
    writeFileSync(lp, JSON.stringify({ pid: 999999, at: "crashed" }));
    const old = new Date(Date.now() - 10 * 60_000);
    utimesSync(lp, old, old);
    const relStale = acquireTankLock(lp, { waitMs: 0 });
    assert("tank lock: a STALE holder is broken — a dead organ never wedges the board", typeof relStale === "function");
    if (typeof relStale === "function") relStale();
    try { rmSync(lp, { force: true }); } catch {}
  }
  {
    const m = mem();
    let held = 0, freed = 0;
    const spy = { ...m, acquireLock: () => { held += 1; return () => { freed += 1; }; } };
    recordUse("T7", 1, 0, spy);
    record429("T7", spy);
    assert("EVERY ledger spend runs inside the tank lock, and releases it", held === 2 && freed === 2);
    let held2 = 0, freed2 = 0;
    const spy2 = { ...mem(), acquireLock: () => { held2 += 1; return () => { freed2 += 1; }; } };
    recordUse("T99-nope", 1, 0, spy2);
    assert("a REJECTED spend still releases the lock (no wedged fuelboard)", held2 === 1 && freed2 === 1);
  }

  // THE FAULT WIRE (11 Aug 2026) — record429 sat in this file for weeks with NO
  // producer for the LIVE tanks: only dmn.mjs (borrowed lanes) and distiller.mjs
  // (T8) ever called it. The Dugout socket DETECTED real quota exhaustion,
  // rotated the key pool and benched the captain with "free juice dry" — and
  // never told this board, so stateOf() could not return COLD for T1/T2, the
  // STARVATION GUARD never learned a real ceiling for any live tank, and
  // physio.mjs's `mouth_cold` bleed (written because "T1 and T2 sat COLD from a
  // 429 storm and no organ in the body said so") was unreachable by the real
  // path. Live tanks.json and both vault snapshots agreed: last_429 null on all
  // eight tanks, ever. A consumer with no producer is a black box, not a
  // feedback loop — so this asserts the PRODUCER, from the consumer's side.
  {
    let dugoutSrc = "";
    try { dugoutSrc = readFileSync(join(__dirname, "dugout.mjs"), "utf8"); } catch { }
    assert("record429 HAS a live producer: the Dugout's /tank-fault door shells `fuelboard.mjs fault`",
      dugoutSrc.includes("/tank-fault") && /"fuelboard\.mjs"\), "fault", id\]/.test(dugoutSrc));
    assert("…and the voice page still knocks on it when a key really runs dry",
      dugoutSrc.includes("function reportFault(") && dugoutSrc.includes("reportFault(keyIdx,"));
  }

  // ── UNIT FUEL (forks row 841, 13 Nov 2026) · THE READ RULE, planted both ways (fixture rows; his env as found) ──
  const lineOf = (row) => gaugeLines(loadBoard({ config: [row], readState: () => null }))[0];
  {
    const saved = process.env.ARSENAL_MODEL_LIVE;
    try {
      delete process.env.ARSENAL_MODEL_LIVE;
      const resolvedLive = roleModel("live");
      process.env.ARSENAL_MODEL_LIVE = "fixture-live-x";   // set AFTER this module loaded: only a READ-time resolver sees it
      const roled = readTank({ id: "T1", name: "Gaffer", region: "mouth", key_index: 0, role: "live", model: "stale-july-literal", quota_est: 90, enabled: true });
      const july = readTank({ id: "T1", name: "Gaffer", region: "mouth", key_index: 0, model: "stale-july-literal", quota_est: 90, enabled: true });
      const cochlea = readTank({ id: "T3", name: "Cochlea", region: "ears", key_index: 2, role: "live", quota_est: 60, enabled: false });
      assert("FUEL READ RULE: a ROLE row resolves through models.mjs at READ time (an env set after import moves it) and a `model` beside the role is IGNORED; a July row (a model, no role) still shows its literal — the verb, not the reader, changes the board; T3 keeps the live role's second seed (its pick since LAW M)",
        resolvedLive !== "fixture-live-x" && roled.model === "fixture-live-x" && /· role live → fixture-live-x$/.test(lineOf(roled))
        && july.model === "stale-july-literal" && /· stale-july-literal \(file literal, not migrated\)$/.test(lineOf(july))
        && cochlea.model === (SEED.live[1] || resolvedLive) && DEFAULT_TANKS.every((d) => !has(d, "model")));
    } finally { if (saved === undefined) delete process.env.ARSENAL_MODEL_LIVE; else process.env.ARSENAL_MODEL_LIVE = saved; }
  }
  {
    const bridge = readTank({ id: "T4", name: "Bridge", region: "prefrontal", key_index: null, engine: "opus-via-cortex", quota_est: 0, enabled: true });
    const julyBridge = readTank({ id: "T4", name: "Bridge", region: "prefrontal", key_index: null, model: "opus-via-cortex", quota_est: 0, enabled: true });
    const twin4 = DEFAULT_TANKS.find((d) => d.id === "T4");
    assert("FUEL READ RULE: an `engine` row (T4) is a LABEL — no model is resolved and the line shows the engine; DEFAULT_TANKS' T4 is `engine: opus-via-cortex` with no model and no role; the July T4 (`model: opus-via-cortex`) still shows its literal",
      bridge.model === null && /· HOT · engine opus-via-cortex$/.test(lineOf(bridge)) && summary(loadBoard({ config: [bridge], readState: () => null }))[0].engine === "opus-via-cortex"
      && twin4.engine === "opus-via-cortex" && !has(twin4, "model") && !has(twin4, "role")
      && julyBridge.model === "opus-via-cortex" && /opus-via-cortex \(file literal, not migrated\)$/.test(lineOf(julyBridge)));
  }
  {
    const bare = readTank({ id: "T5", name: "Scout", region: "research", key_index: 3, quota_est: 50, enabled: false });
    const sparse = readTank({ id: "T4", enabled: false });
    const orphan = readTank({ id: "T9", name: "Nobody", region: "nowhere", key_index: 9, quota_est: 1, enabled: true });
    assert("FUEL READ RULE: a row naming NEITHER role, engine nor model takes its DEFAULT_TANKS twin by id — the twin's role resolves (or its engine labels), and the FILE's own fields win (enabled false stays false: the reader never turns a tank on); an id with no twin names no model",
      bare.role === "pro" && bare.model === roleModel("pro") && bare.enabled === false && bare.quota_est === 50
      && sparse.engine === "opus-via-cortex" && sparse.model === null && sparse.enabled === false && sparse.name === "Bridge"
      && orphan.model === null && !has(orphan, "role") && /· names no model$/.test(lineOf(orphan)));
  }
  {
    const lines = gaugeLines(loadBoard({ config: DEFAULT_TANKS, readState: () => null }));
    const at = (id) => lines.find((l) => l.startsWith(`${id} `)) || "";
    assert("FUEL STATUS LINE: every tank line names what the read rule resolved — `role <r> → <model>` for the seven, `engine opus-via-cortex` for T4 (the defaults name no literal, so no line shows one)",
      lines.length === 8 && at("T1").endsWith(`· role live → ${roleModel("live")}`) && at("T5").endsWith(`· role pro → ${roleModel("pro")}`)
      && at("T6").endsWith(`· role embed → ${roleModel("embed")}`) && at("T8").endsWith(`· role text → ${roleModel("text")}`)
      && at("T4").endsWith("· engine opus-via-cortex") && lines.every((l) => !/file literal/.test(l)));
  }

  // ── UNIT FUEL · THE OWNER VERB, on temp copies (never his file) ──
  {
    const tdir = mkdtempSync(join(tmpdir(), "fuelboard-verb-"));
    const tcfg = join(tdir, "fuelboard_config.json");
    const NOW = new Date(2026, 10, 13);                       // a fixed LOCAL day → a fixed receipt key
    const RKEY = "_tank_models_retired_2026-11-13";
    // placeholders, not model names: the verb MOVES a value, it never reads one (so this file names no literal)
    const LIT = { T1: "july-live-a", T2: "july-live-a", T3: "july-audio-b", T4: "opus-via-cortex", T5: "july-pro-c", T6: "july-embed-d", T7: "july-text-e", T8: "july-text-e" };
    const FIX_DOC = "fixture registry for the verb's selftest (§5) — hand-aligned like his: one tank per line, padded";
    const julyRows = (patch = (r) => r) => DEFAULT_TANKS.map((d) => patch({ id: d.id, name: d.name, region: d.region, key_index: d.key_index, model: LIT[d.id], quota_est: d.quota_est, enabled: d.enabled }));
    const cell = ([k, v], i, all) => i === all.length - 1 ? `${JSON.stringify(k)}: ${JSON.stringify(v)}` : `${JSON.stringify(k)}: ${JSON.stringify(v)},`.padEnd(24);
    const hand = (rows, tail = {}) => `{\n  "_doc": ${JSON.stringify(FIX_DOC)},\n  "tanks": [\n${rows.map((r) => `    { ${Object.entries(r).map(cell).join(" ")} }`).join(",\n")}\n  ]${Object.entries(tail).map(([k, v]) => `,\n  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join("")}\n}\n`;
    const said = [];
    const run = (args, text, at = tcfg) => { if (text !== undefined) writeFileSync(at, text); said.length = 0; const code = configMain([...args, "--config", at], { say: (m) => said.push(m), now: NOW }); return { code, last: said[said.length - 1] || "", all: said.join("\n") }; };
    const bytes = (at = tcfg) => readFileSync(at, "utf8");
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const ROLES_BY_ID = { T1: "live", T2: "live", T3: "live", T5: "pro", T6: "embed", T7: "text", T8: "text" };   // row 841 / the spec's list
    try {
      // PASS — his shape plus a tail key and a tank with a field of its own, so "every key verbatim" is planted, not assumed
      const base = hand(julyRows((r) => r.id === "T7" ? { ...r, note: "rides through" } : r), { policy: { kept: true } });
      const o0 = JSON.parse(base);
      const r1 = run(["migrate-roles", "--why", "unit FUEL — the tanks name roles"], base);
      const after = bytes(), o1 = JSON.parse(after);
      assert("FUEL VERB PASS (temp copy): exit 0 · every key kept in place and `_doc` byte-for-byte (its line too) · the seven get their DEFAULT_TANKS role in the seat `model` held · T4 `engine: opus-via-cortex`, no model, no role · ONE receipt directly after `tanks` holding all eight old values + the why · the last line names it",
        r1.code === 0 && same(Object.keys(o1), ["_doc", "tanks", RKEY, "policy"]) && o1._doc === FIX_DOC && after.split("\n")[1] === base.split("\n")[1] && same(o1.policy, o0.policy)
        && o1.tanks.every((t) => t.id === "T4" ? (t.engine === "opus-via-cortex" && !has(t, "model") && !has(t, "role")) : (t.role === ROLES_BY_ID[t.id] && !has(t, "model") && !has(t, "engine")))
        && o1.tanks.every((t, i) => same(Object.keys(t), Object.keys(o0.tanks[i]).map((k) => k === "model" ? (t.id === "T4" ? "engine" : "role") : k)))
        && same(o1[RKEY].models, LIT) && o1[RKEY].why === "unit FUEL — the tanks name roles" && o1.tanks.find((t) => t.id === "T7").note === "rides through"
        && /^fuelboard config: migrate-roles · 7 tank\(s\) roled · T4 engine · receipt _tank_models_retired_2026-11-13 · sha ([0-9a-f]{12}) -> ([0-9a-f]{12})$/.test(r1.last)
        && r1.last.endsWith(`sha ${sha12(Buffer.from(base, "utf8"))} -> ${sha12(readFileSync(tcfg))}`));
      // THE SIX FIELDS come from the FILE, never from DEFAULT_TANKS — planted where the two differ
      const odd = hand(julyRows((r) => r.id === "T5" ? { ...r, enabled: false } : r.id === "T2" ? { ...r, key_index: 9 } : r.id === "T6" ? { ...r, quota_est: 7 } : r.id === "T8" ? { ...r, name: "Distiller-b", region: "working-set-b" } : r));
      const oOdd = JSON.parse(odd);
      const r2 = run(["migrate-roles", "--why", "x"], odd), o2 = JSON.parse(bytes());
      assert("FUEL VERB never writes the six fields: id · name · region · key_index · quota_est · enabled stand as the FILE has them, even where they differ from DEFAULT_TANKS (T5 off stays off, T3 off stays off, T2 key 9, T6 quota 7, T8 renamed) — it names, it never turns a tank on or off",
        r2.code === 0 && o2.tanks.every((t, i) => SIX_FIELDS.every((f) => same(t[f], oOdd.tanks[i][f])))
        && o2.tanks.find((t) => t.id === "T5").enabled === false && o2.tanks.find((t) => t.id === "T3").enabled === false && o2.tanks.find((t) => t.id === "T2").key_index === 9);
      const forms = [undefined, 0, 1, 2, 3, 4, "\t"].flatMap((n) => ["", "\n"].map((nl) => JSON.stringify(o0, null, n) + nl));
      assert("FUEL VERB FORMAT (row 841 (1)): the hand-aligned file round-trips under no JSON.stringify form; the written file round-trips under the verb's own form, JSON.stringify(o, null, 2) + \"\\n\" — the form writeAtomic writes — and the receipt NAMES the change",
        forms.every((f) => f !== base) && after === VERB_FORM(o1) && after === JSON.stringify(o1, null, 2) + "\n"
        && /^hand-aligned table .* -> the verb's own form JSON\.stringify\(o, null, 2\) \+ "\\n"/.test(o1[RKEY].format));
      // THE REFUSALS — each exit 2, a named line, the copy byte-for-byte as it was
      const good = hand(julyRows());
      const refusals = [
        ["by id: an unknown tank (T9 for T8)", ["migrate-roles", "--why", "x"], hand(julyRows((r) => r.id === "T8" ? { ...r, id: "T9" } : r)), /do not match DEFAULT_TANKS by id \(unknown T9 · missing T8/],
        ["by id: a tank missing (seven)", ["migrate-roles", "--why", "x"], hand(julyRows().slice(0, 7)), /do not match DEFAULT_TANKS by id \(missing T8/],
        ["by id: a tank twice", ["migrate-roles", "--why", "x"], hand(julyRows((r) => r.id === "T8" ? { ...r, id: "T7" } : r)), /do not match DEFAULT_TANKS by id \(missing T8 · twice T7/],
        ["already migrated: a role present", ["migrate-roles", "--why", "x"], hand(julyRows((r) => r.id === "T1" ? { ...r, role: "live" } : r)), /already migrated \(role\/engine on T1\) — never a second rewrite/],
        ["already migrated: a receipt present", ["migrate-roles", "--why", "x"], hand(julyRows(), { [RKEY]: "an earlier receipt" }), /already migrated \(receipt _tank_models_retired_2026-11-13\)/],
        ["a missing --why", ["migrate-roles"], good, /--why "<text>" is required/],
        ["an empty --why", ["migrate-roles", "--why", "   "], good, /--why "<text>" is required/],
        ["an unparsable file", ["migrate-roles", "--why", "x"], good.replace(/\}\n$/, ""), /unparsable JSON/],
        ["an unknown flag", ["migrate-roles", "--why", "x", "--force"], good, /unknown flag --force/],
      ].map(([name, args, text, re]) => { const r = run(args, text); return { name, ok: r.code === 2 && bytes() === text && /^fuelboard config: REFUSED — /.test(r.last) && re.test(r.last), last: r.last }; });
      assert(`FUEL VERB REFUSES with exit 2 and a NAMED line, the copy byte-for-byte as it was — ${refusals.map((x) => x.name).join(" · ")}`,
        refusals.every((x) => x.ok));
      const wrong = join(tdir, "thalamus_config.json");
      writeFileSync(wrong, good);
      said.length = 0;
      const rPath = configMain(["migrate-roles", "--why", "x", "--config", wrong], { say: (m) => said.push(m), now: NOW });
      const pathLast = said[said.length - 1] || "";
      const rVerb = run(["set-model", "T1", "x", "--why", "x"], good);
      assert("FUEL VERB is NARROW: a --config not named fuelboard_config.json is refused (exit 2, that file untouched), and any verb but migrate-roles is refused (exit 2, the copy untouched)",
        rPath === 2 && /must name a fuelboard_config\.json \(got thalamus_config\.json\)/.test(pathLast) && readFileSync(wrong, "utf8") === good
        && rVerb.code === 2 && /the one verb is/.test(rVerb.last) && bytes() === good);
      run(["migrate-roles", "--why", "first"], good);
      const once = bytes();
      const r3 = run(["migrate-roles", "--why", "again"]);
      assert("FUEL VERB run TWICE: the second run on its own output is refused (exit 2, `already migrated`, never a second rewrite) and the file stays byte-for-byte the first run's",
        r3.code === 2 && /already migrated \(role\/engine on T1, T2, T3, T4, T5, T6, T7, T8 · receipt _tank_models_retired_2026-11-13\)/.test(r3.last) && bytes() === once);
      const src = readFileSync(fileURLToPath(import.meta.url), "utf8").replace(/\r\n/g, "\n");
      const mainSrc = src.slice(src.indexOf("\nasync function main() {"));   // the real definition (column 0), never this line's own literal
      const verbSrc = src.slice(src.indexOf("function migrateRolesEdit("), src.indexOf("// selftest\n"));
      const firstWrite = Math.min(...['mode === "selftest"', "recordUse(", "record429(", "withTankLock(", "saveBoard("].map((s) => mainSrc.indexOf(s)).filter((i) => i > 0));
      assert("FUEL VERB is dispatched FIRST: `config` leaves main() above every mode that writes (selftest, use, fault, status's saveBoard), and the verb's own code never touches tanks.json, the board or the tank lock",
        mainSrc.indexOf('mode === "config"') > 0 && mainSrc.indexOf('mode === "config"') < firstWrite
        && !/saveBoard\(|loadBoard\(|withTankLock\(|acquireTankLock\(|\bTANKS\b|TANK_LOCK/.test(verbSrc));
      const { configCheck } = await import("./models.mjs");
      writeFileSync(tcfg, good);
      const before = configCheck({ files: [tcfg] });
      run(["migrate-roles", "--why", "x"]);
      const afterScan = configCheck({ files: [tcfg] });
      assert("FUEL × LAW M: the July file's eight `model` values are eight findings of the config scan; the migrated file has NONE — 0 hits, 0 declared (the old values sit in a `_` receipt, which the scan reads as history)",
        before.hits.length + before.declared.length === 8 && afterScan.ok && afterScan.hits.length === 0 && afterScan.declared.length === 0);
    } finally { try { rmSync(tdir, { recursive: true, force: true }); } catch (e) { swallow("fuelboard selftest: the FUEL temp dir, held by a Windows lock", e); } }
  }
  assert("FUEL: the selftest left the live fuelboard_config.json byte-for-byte as it found it (every verb run above was on a temp copy)",
    (existsSync(CONFIG) ? sha12(readFileSync(CONFIG)) : null) === liveBefore);

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  // UNIT FUEL: the owner verb leaves FIRST — above every mode that writes (status re-saves tanks.json)
  if (mode === "config") process.exit(configMain(process.argv.slice(3)));
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "use") { console.log(JSON.stringify(recordUse(process.argv[3], Number(process.argv[4] || 1), Number(process.argv[5] || 0)))); return; }
  if (mode === "fault") { console.log(JSON.stringify(record429(process.argv[3]))); return; }
  // status (default)
  // E2E audit (25 Jul 2026, 3e32616e): status is a read-modify-write too — it
  // re-saves the WHOLE board, so a status run overlapping a dmn/council spend
  // used to write its own stale snapshot over that spend. Load and save now sit
  // inside one lock hold; the printing happens after, outside the critical path.
  const board = withTankLock({}, () => {
    const b = loadBoard();
    saveBoard(b);                                    // persist any day-reset
    return b;
  });
  console.log(`⛽ THE FUELBOARD · ${board.day}`);
  for (const l of gaugeLines(board)) console.log("  " + l);
  if (board.naive_shadow_tokens) console.log(`  naive-Opus shadow: ~${Math.round(board.naive_shadow_tokens / 1000)}k tokens avoided (${board.actual_units} free units spent instead)`);
  const literal = board.tanks.filter((t) => !has(t, "role") && !has(t, "engine") && t.model).map((t) => t.id);
  if (literal.length) console.log(`  ${literal.length} tank(s) still name a file literal (${literal.join(" ")}): fuelboard_config.json is not migrated — ${VERB_USAGE}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { loadBoard, saveBoard, stateOf, headroomOf, recordUse, record429, pickTank, gaugeLines, summary, loadTankConfig, acquireTankLock, withTankLock };
