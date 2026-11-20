#!/usr/bin/env node
// @ts-check
// ============================================================================
// senses.mjs · ARSENAL AI FC — THE SENSES READER (unit mpres, forks rows 1177 (2) / 1191)
//   SOLE WRITER of: NOTHING. Zero LLM · no network · no port · no spawn. It READS.
// ----------------------------------------------------------------------------
// THE CLASS (row 1177 (2), verbatim): "a sensor whose input is dead must read red by name on the one
//   state line, never exit 0 with a zero." Each sensor's OWN writer records its dead input in its OWN
//   file (owners-only law); this organ folds those files into wounds, and state.mjs appends
//   ` · senses ✗ <sensor>: <input> dead since <IST time>` ONLY while a sensor is hurt (L7: a healthy
//   body costs him zero characters). The line rides the SessionStart brief, so it reaches him with no
//   act of his (F4 A: no card — his 7 Aug ruling already decides it).
//
// THE TABLE LIVES IN THE REGISTRY (F3 B), seeded by the LANDER, never by a cloud seat: the mechanisms
//   row `senses` (schema_owner senses.mjs) — `subjects` is the enumeration (adding a sensor is a ROW
//   EDIT), `rows` carries each sensor's declarative half {subject, owner, file, input}. A `mechanisms`
//   row holds it without a new closed-set table (registry.mjs TABLES stays as it is). The PREDICATE —
//   "is this file's record a dead input, since when" — is CODE, so it lives here in DEAD, keyed by
//   subject. A row whose subject has no predicate, a file absent or unreadable, a row that names a path
//   outside the state dir: each is a STATED UNKNOWN (`presence ?`), never a pass and never a red (a bare
//   clone is not a dead laptop — pulse.mjs's NOT-MEASURABLE precedent). No registry row ⇒ `known:false`
//   with the why, and the line says `senses ?`.
//
// THE FILES IT READS (each named by its owner's header as that owner's sole-written file):
//   presence_input.json (presence.mjs) · pitch_read.json (touchline.mjs) · timeaudit.json (timeaudit.mjs)
//   · dmn_input.json (dmn.mjs) · mirror_manifest.json (mirror.mjs) · capture_pull.json (capture.mjs)
//   · throwin_state.json (throwin.mjs). Read as JSON, read-only; none of their writers is imported, so
//   the one state line stays as light as it was.
//
// CLI: node scripts/senses.mjs [status|json|selftest]
// ============================================================================
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { rowOf, REGISTRY_PATH } from "./registry.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
export const SENSES_MECHANISM = "senses";

/** @param {string} p */
const readJson = (p) => { try { return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : undefined; } catch { return null; } };
/** @param {any} s @param {number} n */
const clip = (s, n) => { const t = String(s == null ? "" : s).replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };

/** "17 Nov 10:58 IST" — he reads IST. A stamp that does not parse is "?", never a guess.
 * @param {string|null|undefined} iso */
export function istStamp(iso) {
  const t = Date.parse(String(iso || ""));
  if (!Number.isFinite(t)) return "?";
  const d = new Date(t + 330 * 60000);
  const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()];
  return `${d.getUTCDate()} ${mon} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} IST`;
}

// THE PREDICATES — one per sensor; each owner's record shape is its writer's (named in the header above).
// A predicate returns {dead:false} or {dead:true, since, since_kind, evidence}. "since" when the owner
// carries the first dead pass (dead_since), "as of" when it stamps only the pass that saw it dead.
/** @typedef {{dead:boolean, since?:string|null, since_kind?:string, evidence?:string|null}} Verdict */
/** @type {Record<string, (o:any) => Verdict>} */
export const DEAD = Object.freeze({
  presence: (o) => {
    if (o.alive !== false) return { dead: false };
    const r = o.repair || null;
    // F9 B: a FAILED ask reads red by name; the other outcomes are said, never hidden
    const evidence = !r ? null : r.result === "failed" ? `repair FAILED (${clip(r.why, 24)})` : r.result === "asked" ? "launcher asked" : r.result === "asking" ? "launcher asked, no answer recorded" : r.result === "none" ? "no repair door" : null;
    return { dead: true, since: o.dead_since || o.at, since_kind: "since", evidence };
  },
  touchline: (o) => {
    const i = o.input && typeof o.input === "object" ? o.input : null;
    const dead = (i && i.activitywatch === false) || (o.tunnel && o.tunnel.state === "input_dead");
    return dead ? { dead: true, since: (i && i.dead_since) || o.generated_at, since_kind: i && i.dead_since ? "since" : "as of", evidence: null } : { dead: false };
  },
  timeaudit: (o) => o.dataOk === false && o.mode !== "selftest"
    ? { dead: true, since: o.generatedAt || null, since_kind: "as of", evidence: "dataOk false" } : { dead: false },
  dmn: (o) => o.alive === false ? { dead: true, since: o.dead_since || o.at, since_kind: "since", evidence: null } : { dead: false },
  // an `ok` enumeration with have 0 is a gist with nothing locked — NOT dead; only a failed listing that fetched nothing is
  mirror: (o) => o.enumeration && o.enumeration.ok === false && o.have === 0
    ? { dead: true, since: o.generated_at || o.fetched_at || null, since_kind: "as of", evidence: "gist unreachable" } : { dead: false },
  // an unconfigured inbox is dormant, never dead (configured:false)
  capture: (o) => o.configured === true && o.alive === false ? { dead: true, since: o.dead_since || o.at, since_kind: "since", evidence: "configured inbox missing" } : { dead: false },
  // a dormant throwin (wired:false, no topic) is not dead
  throwin: (o) => o.wired === true && o.last_error ? { dead: true, since: o.last_poll_at || null, since_kind: "as of", evidence: clip(o.last_error, 24) } : { dead: false },
});

/** a row's `file` is a bare file name inside the state dir — anything else is refused (a reader that
 *  follows a row out of the state dir would be a door, not a read)
 * @param {any} f */
const safeFile = (f) => typeof f === "string" && /^[A-Za-z0-9._-]+$/.test(f) && f !== "." && f !== "..";

/** the table, read through the registry's own reader at CALL time (never at import)
 * @param {string} [path] */
export function senseTable(path = REGISTRY_PATH) {
  let row;
  try { row = rowOf("mechanisms", SENSES_MECHANISM, path); }
  catch (e) { return { known: false, why: `registry unreadable (${clip(e && /** @type {any} */ (e).message, 40)})`, rows: [] }; }
  if (!row || row.retired) return { known: false, why: "no mechanisms/senses row (the lander seeds it)", rows: [] };
  const subjects = Array.isArray(row.subjects) ? row.subjects.filter((s) => typeof s === "string") : [];
  const decl = Array.isArray(row.rows) ? row.rows : [];
  const rows = subjects.map((subject) => {
    const d = decl.find((r) => r && r.subject === subject) || null;
    return { subject, owner: d ? d.owner : null, file: d ? d.file : null, input: d ? d.input : null };
  });
  return { known: true, why: null, rows };
}

/** senseFacts — the fold. {known, why, wounds:[{sensor,input,since,since_ist,since_kind,evidence,file}], unknown:[subject], healthy:[subject]}
 *  The LINE is state.mjs's (stateFrom renders it, one renderer); this organ hands it the IST stamp ready-made.
 * @param {{stateDir?:string, registryPath?:string, table?:any}} [o] */
export function senseFacts({ stateDir = STATE_DIR, registryPath = REGISTRY_PATH, table = null } = {}) {
  const t = table || senseTable(registryPath);
  if (!t.known) return { known: false, why: t.why, wounds: [], unknown: [], healthy: [] };
  /** @type {any[]} */ const wounds = [];
  /** @type {string[]} */ const unknown = [], healthy = [];
  for (const r of t.rows) {
    const pred = DEAD[r.subject];
    if (!pred || !safeFile(r.file) || !r.input) { unknown.push(r.subject); continue; }
    const o = readJson(join(stateDir, r.file));
    if (!o || typeof o !== "object") { unknown.push(r.subject); continue; }
    let v;
    try { v = pred(o); } catch { unknown.push(r.subject); continue; }
    if (v.dead) wounds.push({ sensor: r.subject, input: r.input, since: v.since || null, since_ist: istStamp(v.since), since_kind: v.since_kind || "as of", evidence: v.evidence || null, file: r.file });
    else healthy.push(r.subject);
  }
  return { known: true, why: null, wounds, unknown, healthy };
}

// THE SEED the lander runs (F3 B) — printed by `status` when the row is absent, and written verbatim in
// ci/mpres/PROOF.md. This seat never runs it.
export const SEED_ROW = Object.freeze({
  subject: SENSES_MECHANISM, schema_owner: "senses.mjs",
  witness: "scripts/senses.mjs DEAD — one predicate per subject; ci/mpres/witness_mpres.mjs plants each both ways",
  subjects: ["presence", "touchline", "timeaudit", "dmn", "mirror", "capture", "throwin"],
  rows: [
    { subject: "presence", owner: "presence.mjs", file: "presence_input.json", input: "activitywatch" },
    { subject: "touchline", owner: "touchline.mjs", file: "pitch_read.json", input: "activitywatch" },
    { subject: "timeaudit", owner: "timeaudit.mjs", file: "timeaudit.json", input: "activitywatch" },
    { subject: "dmn", owner: "dmn.mjs", file: "dmn_input.json", input: "activitywatch" },
    { subject: "mirror", owner: "mirror.mjs", file: "mirror_manifest.json", input: "capsule-gist" },
    { subject: "capture", owner: "capture.mjs", file: "capture_pull.json", input: "drive-inbox" },
    { subject: "throwin", owner: "throwin.mjs", file: "throwin_state.json", input: "ntfy" },
  ],
  notes: "unit mpres (forks rows 1177 (2) / 1191, F3 B): a sensor whose input is dead reads red by name on the one state line; a new sensor is a ROW ADD here plus its predicate in senses.mjs DEAD",
});

function selftest() {
  let pass = 0, fail = 0;
  /** @param {string} n @param {any} c */
  const assert = (n, c) => { if (c) pass++; else fail++; console.log(`  ${c ? "✓" : "✗"} ${n}`); };
  const root = mkdtempSync(join(tmpdir(), "senses-selftest-"));
  try {
    const sd = join(root, "state"), reg = join(root, "registry.json");
    mkdirSync(sd, { recursive: true });
    /** @param {string} f @param {any} o */
    const plant = (f, o) => writeFileSync(join(sd, f), JSON.stringify(o));
    writeFileSync(reg, JSON.stringify({ version: 1, tables: { mechanisms: [SEED_ROW] } }));
    const facts = () => senseFacts({ stateDir: sd, registryPath: reg });
    // W13 · an absent state dir: every sensor a stated unknown, no red
    const bare = senseFacts({ stateDir: join(root, "no-such-dir"), registryPath: reg });
    assert("W13 — an absent state dir names every sensor UNKNOWN and none dead (a bare clone is not a dead laptop)",
      bare.known === true && bare.wounds.length === 0 && bare.unknown.length === SEED_ROW.subjects.length && bare.unknown[0] === "presence");
    assert("no registry row ⇒ known:false and the why says the lander seeds it — never a silent pass",
      (() => { const a = senseFacts({ stateDir: sd, registryPath: join(root, "absent.json") }); return a.known === false && /lander/.test(String(a.why)); })());
    // W3 · presence
    plant("presence_input.json", { at: "2026-11-17T05:29:00.000Z", input: "activitywatch", alive: false, dead_since: "2026-11-17T05:28:00.000Z", repair: { span: "2026-11-17T05:28:00.000Z", result: "failed", why: "ENOENT" } });
    let f = facts();
    assert("W3 — a dead presence snapshot is a wound named presence, since its FIRST dead pass, its failed repair by name",
      f.wounds.length === 1 && f.wounds[0].sensor === "presence" && f.wounds[0].since === "2026-11-17T05:28:00.000Z" && /repair FAILED \(ENOENT\)/.test(f.wounds[0].evidence));
    assert("W4 — the wound carries its IST stamp ready for the line: 17 Nov 10:58 IST, kind `since`",
      f.wounds[0].since_ist === "17 Nov 10:58 IST" && f.wounds[0].since_kind === "since" && f.wounds[0].input === "activitywatch");
    plant("presence_input.json", { at: "x", input: "activitywatch", alive: true, dead_since: null });
    // healthy everywhere ⇒ zero characters (W5)
    plant("pitch_read.json", { tunnel: { state: "clear" }, input: { activitywatch: true } });
    plant("timeaudit.json", { dataOk: true, generatedAt: "2026-11-17T05:00:00Z" });
    plant("dmn_input.json", { alive: true });
    plant("mirror_manifest.json", { enumeration: { ok: true }, have: 0, need: 0 });
    plant("capture_pull.json", { configured: false, alive: null });
    plant("throwin_state.json", { wired: false });
    f = facts();
    assert("W5 — every sensor healthy ⇒ no wound and no unknown (the line adds nothing, L7); a gist with nothing locked, a dormant inbox and a dormant throwin are healthy",
      f.wounds.length === 0 && f.unknown.length === 0 && f.healthy.length === SEED_ROW.subjects.length);
    // W6 · touchline
    plant("pitch_read.json", { tunnel: { state: "input_dead" }, generated_at: "2026-11-17T06:00:00Z", input: { activitywatch: false, dead_since: "2026-11-17T05:30:00Z" } });
    assert("W6 — touchline input_dead is a wound, since its carried dead_since", (() => { const w = facts().wounds; return w.length === 1 && w[0].sensor === "touchline" && w[0].since === "2026-11-17T05:30:00Z"; })());
    plant("pitch_read.json", { tunnel: { state: "no_data" }, input: { activitywatch: true } });
    // W7 · timeaudit
    plant("timeaudit.json", { dataOk: false, generatedAt: "2026-11-17T05:00:00Z", mode: "pulse" });
    assert("W7 — timeaudit dataOk:false is a wound (as of its pass); dataOk ABSENT is not read as false",
      facts().wounds.some((w) => w.sensor === "timeaudit" && w.since_kind === "as of") && (plant("timeaudit.json", { generatedAt: "x" }), !facts().wounds.some((w) => w.sensor === "timeaudit")));
    // W8 · mirror
    plant("mirror_manifest.json", { enumeration: { ok: false, error: "fetch_fail" }, have: 0, need: 4, generated_at: "2026-11-17T05:00:00Z" });
    assert("W8 — a failed gist listing that fetched nothing is a wound named mirror", facts().wounds.some((w) => w.sensor === "mirror"));
    plant("mirror_manifest.json", { enumeration: { ok: true }, have: 0, need: 0 });
    assert("W8 — an ok listing with have 0 (nothing locked) is NOT", !facts().wounds.some((w) => w.sensor === "mirror"));
    // W9 · throwin
    plant("throwin_state.json", { wired: true, last_error: "fetch_fail", last_poll_at: "2026-11-17T05:00:00Z" });
    assert("W9 — a wired throwin with last_error is a wound named throwin", facts().wounds.some((w) => w.sensor === "throwin"));
    plant("throwin_state.json", { wired: false, last_error: "fetch_fail" });
    assert("W9 — a DORMANT throwin (wired:false) is not, whatever its last_error", !facts().wounds.some((w) => w.sensor === "throwin"));
    // W10 · dmn · W11 · capture
    plant("dmn_input.json", { alive: false, dead_since: "2026-11-17T05:00:00Z" });
    plant("capture_pull.json", { configured: true, alive: false, dead_since: "2026-11-17T04:00:00Z" });
    f = facts();
    assert("W10/W11 — a dead dmn gate and a configured-missing inbox are both wounds, in table order",
      f.wounds.map((w) => w.sensor).join(",") === "dmn,capture");
    plant("capture_pull.json", { configured: false, alive: null });
    assert("W11 — an unconfigured inbox is dormant, never a wound", !facts().wounds.some((w) => w.sensor === "capture"));
    // refusals: a row out of the state dir, an unparseable file, a subject with no predicate
    writeFileSync(reg, JSON.stringify({ version: 1, tables: { mechanisms: [{ ...SEED_ROW, subjects: ["presence", "ghost"], rows: [{ subject: "presence", owner: "x", file: "../escape.json", input: "aw" }, { subject: "ghost", owner: "x", file: "g.json", input: "y" }] }] } }));
    f = facts();
    assert("a row naming a path outside the state dir, and a subject with no predicate, are STATED UNKNOWNS (never followed, never a pass)",
      f.wounds.length === 0 && f.unknown.join(",") === "presence,ghost");
    writeFileSync(reg, JSON.stringify({ version: 1, tables: { mechanisms: [SEED_ROW] } }));
    writeFileSync(join(sd, "presence_input.json"), "{not json");
    assert("an unparseable owner file is UNKNOWN, never a pass", facts().unknown.includes("presence"));
    assert("istStamp — IST, and an unparseable stamp is '?'", istStamp("2026-11-17T05:28:00Z") === "17 Nov 10:58 IST" && istStamp("nope") === "?");
    assert("SEED — every seeded subject has a predicate here, and every predicate a seeded subject",
      SEED_ROW.subjects.every((s) => typeof DEAD[s] === "function") && Object.keys(DEAD).every((s) => SEED_ROW.subjects.includes(s)));
    assert("READ-ONLY — this organ has no write into the state dir, no network, no spawn (its only writes are this selftest's temp plants)",
      !/fetch\(|spawn|execFile|appendFileSync|renameSync/.test(readFileSync(fileURLToPath(import.meta.url), "utf8").replace(/^\s*\/\/.*$/gm, "").replace(/assert\("READ-ONLY[^\n]*\n[^\n]*/m, "")));
  } finally { try { rmSync(root, { recursive: true, force: true }); } catch { /* a temp dir the OS reaps */ } }
  console.log(`\nsenses selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2] || "status";
  if (mode === "selftest") process.exit(selftest() ? 0 : 1);
  const s = senseFacts();
  if (mode === "json") console.log(JSON.stringify(s, null, 1));
  else if (mode === "status") {
    if (!s.known) {
      console.log(`senses: ? — ${s.why}`);
      console.log(`  the lander seeds it: node scripts/registry.mjs set --table mechanisms --json '${JSON.stringify(SEED_ROW)}'`);
    } else {
      console.log(`senses: ${s.wounds.length} dead · ${s.unknown.length} unknown · ${s.healthy.length} healthy`);
      for (const w of s.wounds) console.log(`  ✗ ${w.sensor}: ${w.input} dead ${w.since_kind} ${istStamp(w.since)}${w.evidence ? ` · ${w.evidence}` : ""} (${w.file})`);
      for (const u of s.unknown) console.log(`  ? ${u}: no readable record`);
    }
  } else { console.error(`senses: unknown mode "${mode}" — status | json | selftest`); process.exit(1); }
}
