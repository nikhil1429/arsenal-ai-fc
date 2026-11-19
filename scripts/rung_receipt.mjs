#!/usr/bin/env node
// @ts-check
// ============================================================================
// rung_receipt.mjs · ARSENAL AI FC — THE RUNG RECEIPT (unit mrung · row 1058 (5) · rulings forks row 1122 (2))
//   SOLE WRITER of dressing-room/state/rung_receipts.jsonl (SOLE WRITER: scripts/rung_receipt.mjs)
// ----------------------------------------------------------------------------
// ROW 1058 (5), verbatim: "the plan v3 rung clauses get a machine-readable receipt (red before, green on a real day, meter
//   equal); until it lands done.mjs keeps printing UNREAD, never a guessed zero."
// MEASURED at base (spec ci/mrung/MRUNG_SPEC.md §0): done.mjs read rungs from a HAND contract — free strings matched by
//   /^RED\b/ and /^GREEN\b/ — so a hand-typed verdict counted GREEN, and an empty rungs folder printed 0 of 0.
// WHAT IT IS. The ONE organ that MEASURES a rung clause and appends the measurement, hash-chained, to its own file. No verdict
//   is ever an argument: it runs the witness itself and records the child's exit status, the sha256 of its output and git HEAD.
//   done.mjs is the reader (readReceipts / clauseVerdict below are its doors); nothing else reads or writes the file.
// THE RULINGS (forks row 1122 (2)) it holds:
//   F1 (b) a REAL DAY is a full-time close with a bound host — read through day.mjs dayProof, the record only his own
//          day-end writes (word 240). F2 (a) the old hand contract is REFUSED and counted in nothing (done.mjs).
//   F3 (a) the plan v3 list is written campaign-side by lane M's own verb; the contract it must write is PLAN_CONTRACT below
//          and the one reader of it is readPlan. F4 (a) a witness is `node <a path git ls-files tracks> [args]` only.
//   F5 (a) ONE new door, ARSENAL_RUNG_STATE_DIR, honoured only under os.tmpdir(); the real-day read rides day.mjs's own
//          door ARSENAL_SITTING_STATE_DIR. F6 (a) loops ride this file as kind "loop", hashed by this organ.
//   F7 (a) the old recorded day stays the constant in done.mjs (OLD_RECORDED_DAY), recorded on every meter row.
//   F8 (b) the witness child's bound is the exported WITNESS_TIMEOUT_MS below (its value is READ from an owner, not typed).
//   F9 (b) the file is TRACKED: a row holds a day, a sitting id, shas and exits — no output text, no word of his, no name.
// ROW (every kind): { v, kind, key, rung, clause, at, by, prev_sha256, row_sha256, ...kind fields }
//   row_sha256 = sha256(prev_sha256 + canonical JSON of the row without row_sha256); the first prev is 64 zeros.
// CLI (no verdict, exit, sha or meter is ever a flag — any flag outside a verb's own set is REFUSED before anything runs):
//   node scripts/rung_receipt.mjs red    --rung <id> --clause <id> --cmd "node <tracked path> [args]"
//   node scripts/rung_receipt.mjs green  --rung <id> --clause <id> --day <YYYY-MM-DD IST>   (re-runs the red row's command)
//   node scripts/rung_receipt.mjs loop   --loop <id> --sheet <p> --page <p> --acts <p> --ladder <p>
//   node scripts/rung_receipt.mjs show   [--rung <id>]          (read-only)
//   node scripts/rung_receipt.mjs verify                        (read-only; exit 1 on a broken chain)
//   node scripts/rung_receipt.mjs selftest
// WHO ELSE COULD ACT ON THIS OUTPUT? done.mjs (rungs + loops by clause) · the runner (the line each verb prints).
// The witness of this organ is ci/mrung/witness_mrung.mjs.
// ============================================================================
import { readFileSync, appendFileSync, existsSync, mkdirSync, realpathSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname, resolve, relative, isAbsolute, basename, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { CHILD_TIMEOUT_MS } from "./postmatch.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
export const BY = "rung_receipt.mjs";
export const RECEIPTS_FILE = "rung_receipts.jsonl";
export const METER_FILE = "daily_green.jsonl";            // daily_green.mjs is its sole writer (its header :4); read here only
export const ZERO = "0".repeat(64);
// F8 (b): the witness child's ONE bound. Not typed here — it is the organism's own owner-CLI child bound, read from its owner
// (postmatch.mjs CHILD_TIMEOUT_MS). ci/mrung/PROOF.md measures every planted witness run against it.
export const WITNESS_TIMEOUT_MS = CHILD_TIMEOUT_MS;
const STATE_ENV = "ARSENAL_RUNG_STATE_DIR";

// ── F3 (a): THE CONTRACT lane M's campaign-side verb writes, and the ONE reader of it ─────────────────────────────────
// <campaign>/rungs/plan_v3.json = { plan: "v3", source: "<plan v3 file, relative to the campaign root>",
//   source_sha256: "<64 hex, sha256 of its bytes>", rungs: [{ rung: "<id>", clauses: [{ id: "<id>", witness: "node <path> …" }] }],
//   loops: [{ loop: "<id>" }] }   — keyed <rung>:<clause>, the key every receipt row carries (loops: loop:<id>).
export const PLAN_FILE = "plan_v3.json";
export const PLAN_CONTRACT = Object.freeze({ plan: "v3", source: "string", source_sha256: "64 hex", rungs: "[{ rung, clauses: [{ id, witness }] }]", loops: "[{ loop }]" });
const ID_RE = /^[A-Za-z0-9._-]+$/;
const HEX64 = /^[0-9a-f]{64}$/;
const GITSHA = /^[0-9a-f]{40}([0-9a-f]{24})?$/;

/** @param {string} campaign @returns {{ ok: true, clauses: {key:string, rung:string, clause:string, witness:string}[], loops: string[] } | { ok: false, why: string }} */
export function readPlan(campaign) {
  let p; try { p = JSON.parse(readFileSync(join(campaign, "rungs", PLAN_FILE), "utf8")); } catch { return { ok: false, why: "no plan v3 list" }; }
  if (!p || p.plan !== "v3" || typeof p.source !== "string" || !HEX64.test(String(p.source_sha256 || "")) || !Array.isArray(p.rungs)) return { ok: false, why: "no plan v3 list" };
  const clauses = [];
  for (const r of p.rungs) {
    if (!r || !ID_RE.test(String(r.rung || "")) || !Array.isArray(r.clauses)) return { ok: false, why: "the plan v3 list is malformed (a rung without an id or clauses)" };
    for (const c of r.clauses) {
      if (!c || !ID_RE.test(String(c.id || "")) || typeof c.witness !== "string") return { ok: false, why: `the plan v3 list is malformed (${r.rung}: a clause without an id or witness)` };
      clauses.push({ key: `${r.rung}:${c.id}`, rung: r.rung, clause: c.id, witness: c.witness });
    }
  }
  const loops = Array.isArray(p.loops) ? p.loops.map((l) => String((l && l.loop) || "")).filter((x) => ID_RE.test(x)) : [];
  return { ok: true, clauses, loops };
}

// ── the state dir (F5 a) ───────────────────────────────────────────────────────────────────────────────────────────
const real = (p) => { try { return realpathSync(p); } catch { return resolve(p); } };
const under = (child, parent) => { const r = relative(real(parent), real(child)); return !!r && !r.startsWith("..") && !isAbsolute(r); };
/** @returns {{ ok: true, dir: string } | { ok: false, why: string }} */
export function stateDir(env = process.env) {
  const d = env[STATE_ENV];
  if (!d) return { ok: true, dir: join(ROOT, "dressing-room", "state") };
  if (!under(d, tmpdir())) return { ok: false, why: `${STATE_ENV} is honoured only under os.tmpdir() — refused` };
  return { ok: true, dir: resolve(d) };
}
const RECEIPTS_DEFAULT = join(ROOT, "dressing-room", "state", "rung_receipts.jsonl");   // the tracked receipt (F9 b)

// ── hashing + the chain ───────────────────────────────────────────────────────────────────────────────────────────
export const sha256 = (b) => createHash("sha256").update(b).digest("hex");
/** canonical JSON: keys sorted at every depth */
export function canon(v) {
  if (Array.isArray(v)) return `[${v.map(canon).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(",")}}`;
  return JSON.stringify(v);
}
export function rowSha(row) { const { row_sha256, ...rest } = row; return sha256(String(row.prev_sha256) + canon(rest)); }

/** readReceipts — every line, the chain walked; rows from the first break on carry chain:false. A missing file is rows [] .
 *  @returns {{ present: boolean, rows: any[], brokenAt: number }} brokenAt = -1 when the chain holds */
export function readReceipts(path) {
  let text; try { text = readFileSync(path, "utf8"); } catch { text = null; }
  return parseReceipts(text);
}
/** parseReceipts — the same walk over the file's text (null = the file is absent); done.mjs reads the bytes itself */
export function parseReceipts(text) {
  if (typeof text !== "string") return { present: false, rows: [], brokenAt: -1 };
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const rows = []; let prev = ZERO, brokenAt = -1;
  lines.forEach((l, i) => {
    let r = null; try { r = JSON.parse(l); } catch { r = null; }
    const ok = brokenAt < 0 && r && typeof r === "object" && r.prev_sha256 === prev && r.row_sha256 === rowSha(r);
    if (!ok && brokenAt < 0) brokenAt = i;
    rows.push({ row: r || {}, i, chain: brokenAt < 0 });
    if (ok) prev = r.row_sha256;
  });
  return { present: true, rows, brokenAt };
}
const lastSha = (rr) => { const ok = rr.rows.filter((x) => x.chain); return ok.length ? ok[ok.length - 1].row.row_sha256 : ZERO; };

// ── THE ROW SHAPE (R2) — a row is the organ's measurement or it is TYPED ──────────────────────────────────────────────
const COMMON = ["v", "kind", "key", "rung", "clause", "at", "by", "prev_sha256", "row_sha256"];
const FIELDS = {
  red: ["cmd", "cmd_sha256", "head_sha", "exit", "out_sha256"],
  green: ["cmd", "cmd_sha256", "head_sha", "red_head_sha", "red_sha", "ancestor", "exit", "out_sha256", "day", "day_proof"],
  meter: ["meter", "before_sha256", "after_sha256", "equal", "old_day", "old_day_green", "green_sha"],
  loop: ["files"],
};
export const ROW_FIELDS = Object.freeze(Object.fromEntries(Object.entries(FIELDS).map(([k, v]) => [k, Object.freeze([...COMMON, ...v])])));
const LOOP_ROLES = ["sheet", "page", "acts", "ladder"];
/** rowProblem — null for a well-formed measurement, else the word why it is TYPED */
export function rowProblem(r) {
  if (!r || typeof r !== "object") return "typed: not a row";
  if (r.by !== BY) return "typed: not written by rung_receipt.mjs";
  if (r.v !== 1 || !FIELDS[r.kind]) return "typed: unknown kind";
  const allowed = new Set(ROW_FIELDS[r.kind]);
  const extra = Object.keys(r).filter((k) => !allowed.has(k));
  if (extra.length) return `typed: field ${extra[0]}`;
  const missing = ROW_FIELDS[r.kind].filter((k) => !(k in r));
  if (missing.length) return `typed: missing ${missing[0]}`;
  if (!ID_RE.test(String(r.rung)) || !ID_RE.test(String(r.clause)) || r.key !== `${r.rung}:${r.clause}`) return "typed: key";
  if (!HEX64.test(String(r.prev_sha256)) || !HEX64.test(String(r.row_sha256))) return "typed: sha";
  if (r.row_sha256 !== rowSha(r)) return "typed: row_sha256";
  for (const [k, v] of Object.entries(r)) if (!["key", "rung", "clause"].includes(k) && typeof v === "string" && /^(RED|GREEN)\b/.test(v)) return "typed: a verdict string";
  if (r.kind === "red" || r.kind === "green") {
    if (typeof r.cmd !== "string" || r.cmd_sha256 !== sha256(r.cmd)) return "typed: cmd_sha256";
    if (!Number.isInteger(r.exit)) return "typed: exit";
    if (!HEX64.test(String(r.out_sha256)) || !GITSHA.test(String(r.head_sha))) return "typed: sha";
  }
  if (r.kind === "green") {
    if (!GITSHA.test(String(r.red_head_sha)) || !HEX64.test(String(r.red_sha)) || !Number.isInteger(r.ancestor)) return "typed: green link";
    const p = r.day_proof;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(r.day)) || !p || typeof p !== "object" || p.source !== "sitting_reviews.jsonl" || typeof p.sitting_id !== "string" || typeof p.closed_at !== "string" || p.reason !== "fulltime") return "typed: day_proof";
  }
  if (r.kind === "meter") {
    if (!HEX64.test(String(r.before_sha256)) || !HEX64.test(String(r.after_sha256)) || !HEX64.test(String(r.green_sha))) return "typed: sha";
    if (typeof r.equal !== "boolean" || r.equal !== (r.before_sha256 === r.after_sha256)) return "typed: equal";
    if (![true, false, null].includes(r.old_day_green)) return "typed: old_day_green";
  }
  if (r.kind === "loop") {
    if (!Array.isArray(r.files) || r.files.length !== LOOP_ROLES.length || !LOOP_ROLES.every((role) => r.files.some((f) => f && f.role === role && HEX64.test(String(f.sha256)))))
      return "typed: loop files";
  }
  return null;
}

// ── THE READER (done.mjs's door) — one plan clause, its word and why ──────────────────────────────────────────────
/** @returns {{ word: "GREEN"|"RED"|"UNREAD"|"REFUSED", why: string }} */
export function clauseVerdict(key, witness, rr) {
  const mine = rr.rows.filter((x) => x.row && x.row.key === key);
  if (!mine.length) return { word: "UNREAD", why: "no receipt" };
  const latest = mine[mine.length - 1];
  if (!latest.chain) return { word: "REFUSED", why: "chain" };
  const bad = mine.map((x) => rowProblem(x.row)).find(Boolean);
  if (bad) return { word: "REFUSED", why: bad };
  const rows = mine.map((x) => x.row);
  const greens = rows.filter((r) => r.kind === "green");
  if (!greens.length) return rows.some((r) => r.kind === "red") ? { word: "UNREAD", why: "red recorded, no green" } : { word: "UNREAD", why: "no red, no green" };
  const g = greens[greens.length - 1];
  const red = rows.find((r) => r.kind === "red" && r.row_sha256 === g.red_sha);
  const meter = rows.find((r) => r.kind === "meter" && r.green_sha === g.row_sha256);
  if (!red || !meter) return { word: "REFUSED", why: !red ? "typed: green names no red row" : "typed: green has no meter row" };
  const want = sha256(String(witness));
  const fail = [
    [red.exit === 0, "red before exited 0"],
    [g.cmd_sha256 !== red.cmd_sha256, "green ran another command"],
    [red.cmd_sha256 !== want, "witness changed"],
    [g.head_sha === red.head_sha || g.red_head_sha !== red.head_sha, "nothing built between red and green"],
    [g.ancestor !== 0, "red HEAD is not an ancestor of green HEAD"],
    [g.exit !== 0, `green exited ${g.exit}`],
    [!meter.equal || meter.before_sha256 !== meter.after_sha256, "meter moved"],
    [meter.old_day_green === true, "old day reads GREEN"],
    [meter.old_day_green === null, "old day absent from the meter"],
  ].find(([b]) => b);
  return fail ? { word: "RED", why: String(fail[1]) } : { word: "GREEN", why: `day ${g.day} · sitting ${g.day_proof.sitting_id}` };
}
/** @returns {{ word: "GREEN"|"UNREAD"|"REFUSED", why: string }} */
export function loopVerdict(id, rr) {
  const mine = rr.rows.filter((x) => x.row && x.row.key === `loop:${id}`);
  if (!mine.length) return { word: "UNREAD", why: "no receipt" };
  const latest = mine[mine.length - 1];
  if (!latest.chain) return { word: "REFUSED", why: "chain" };
  const bad = rowProblem(latest.row);
  return bad ? { word: "REFUSED", why: bad } : { word: "GREEN", why: "four artefacts hashed by the organ" };
}

// ── git + the witness child ───────────────────────────────────────────────────────────────────────────────────────
const git = (args) => spawnSync("git", args, { cwd: ROOT, encoding: "utf8", windowsHide: true });
const headSha = () => { const r = git(["rev-parse", "HEAD"]); return r.status === 0 ? String(r.stdout).trim() : null; };
/** F4 (a): `node <repo-relative path git ls-files tracks> [plain args]` — the argv to spawn, or why not */
export function parseWitness(cmd) {
  const t = String(cmd || "").trim().split(/\s+/);
  if (t[0] !== "node" || t.length < 2) return { ok: false, why: "a witness is `node <tracked path> [args]` (F4 a)" };
  if (!t.every((x) => /^[A-Za-z0-9._/=:@,+-]+$/.test(x))) return { ok: false, why: "a witness carries no shell or quote character (F4 a)" };
  const p = t[1];
  if (isAbsolute(p) || p.split("/").includes("..")) return { ok: false, why: "the witness path is repo-relative (F4 a)" };
  if (git(["ls-files", "--error-unmatch", "--", p]).status !== 0) return { ok: false, why: `${p} is not tracked by git ls-files (F4 a)` };
  return { ok: true, argv: [join(ROOT, p), ...t.slice(2)] };
}
function runWitness(argv) {
  const r = spawnSync(process.execPath, argv, { cwd: ROOT, env: process.env, encoding: "buffer", windowsHide: true, timeout: WITNESS_TIMEOUT_MS });
  const out = Buffer.concat([r.stdout || Buffer.alloc(0), r.stderr || Buffer.alloc(0)]);
  const last = out.toString("utf8").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) || "";
  return { exit: Number.isInteger(r.status) ? r.status : null, out_sha256: sha256(out), last };
}
const fileSha = (p) => { try { return sha256(readFileSync(p)); } catch { return sha256(Buffer.alloc(0)); } };

// ── THE WRITER ────────────────────────────────────────────────────────────────────────────────────────────────────
function append(path, rr, body) {
  const row = { v: 1, ...body, at: new Date().toISOString(), by: BY, prev_sha256: lastSha(rr) };
  row.row_sha256 = rowSha(row);
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, JSON.stringify(row) + "\n");
  rr.rows.push({ row, i: rr.rows.length, chain: true });
  return row;
}
const VERBS = { red: ["--rung", "--clause", "--cmd"], green: ["--rung", "--clause", "--day"], loop: ["--loop", "--sheet", "--page", "--acts", "--ladder"], show: ["--rung"], verify: [], selftest: [] };
const REQUIRED = { red: ["--rung", "--clause", "--cmd"], green: ["--rung", "--clause", "--day"], loop: ["--loop", "--sheet", "--page", "--acts", "--ladder"] };
/** parseArgs — every flag must be the verb's own, each with a value; anything else refuses BEFORE anything runs */
export function parseArgs(argv) {
  const [verb, ...rest] = argv;
  if (!verb || !VERBS[verb]) return { ok: false, why: `unknown verb ${verb ? JSON.stringify(verb) : "(none)"}` };
  const o = {};
  for (let i = 0; i < rest.length; i += 2) {
    const k = rest[i], v = rest[i + 1];
    if (!VERBS[verb].includes(k)) return { ok: false, why: `flag ${JSON.stringify(k)} is not a ${verb} flag — no verdict, exit, sha or meter is ever typed` };
    if (v === undefined || String(v).startsWith("--")) return { ok: false, why: `flag ${k} has no value` };
    if (k in o) return { ok: false, why: `flag ${k} given twice` };
    o[k] = v;
  }
  for (const k of REQUIRED[verb] || []) if (!(k in o)) return { ok: false, why: `${verb} needs ${k}` };
  for (const k of ["--rung", "--clause", "--loop"]) if (k in o && !ID_RE.test(o[k])) return { ok: false, why: `${k} must match ${ID_RE}` };
  return { ok: true, verb, o };
}

/** @returns {Promise<{ code: number, lines: string[] }>} */
export async function cli(argv, env = process.env) {
  const a = parseArgs(argv);
  if (!a.ok) return { code: 1, lines: [`rung_receipt: REFUSED · ${a.why} · nothing ran, nothing written`] };
  if (a.verb === "selftest") return selftest();
  const sd = stateDir(env);
  if (!sd.ok) return { code: 1, lines: [`rung_receipt: REFUSED · ${sd.why}`] };
  const path = env[STATE_ENV] ? join(sd.dir, RECEIPTS_FILE) : RECEIPTS_DEFAULT;
  const meterPath = join(sd.dir, METER_FILE);
  const rr = readReceipts(path);
  const o = a.o;
  if (a.verb === "verify") {
    return rr.brokenAt < 0 ? { code: 0, lines: [`rung_receipt: verify · ${rr.rows.length} row(s) · chain holds`] } : { code: 1, lines: [`rung_receipt: verify · chain BROKEN at row ${rr.brokenAt + 1} of ${rr.rows.length}`] };
  }
  if (a.verb === "show") {
    const keys = [...new Set(rr.rows.map((x) => x.row && x.row.key).filter(Boolean))].filter((k) => !o["--rung"] || String(k).startsWith(`${o["--rung"]}:`));
    return { code: 0, lines: keys.length ? keys.map((k) => { const m = rr.rows.filter((x) => x.row.key === k); return `rung_receipt: ${k} · ${m.map((x) => x.row.kind + (x.chain ? "" : "(chain)")).join(" → ")}`; }) : ["rung_receipt: show · no receipt"] };
  }
  if (rr.brokenAt >= 0) return { code: 1, lines: [`rung_receipt: REFUSED · the chain is broken at row ${rr.brokenAt + 1} — nothing is appended onto a file verify rejects`] };
  if (a.verb === "loop") {
    const files = LOOP_ROLES.map((role) => {
      const p = resolve(o[role === "acts" ? "--acts" : `--${role}`]);
      return existsSync(p) ? { role, name: basename(p), sha256: sha256(readFileSync(p)) } : { role, missing: true };
    });
    const gone = files.filter((f) => f.missing).map((f) => f.role);
    if (gone.length) return { code: 1, lines: [`rung_receipt: REFUSED · loop ${o["--loop"]}: ${gone.join(", ")} not readable · nothing written`] };
    const row = append(path, rr, { kind: "loop", key: `loop:${o["--loop"]}`, rung: "loop", clause: o["--loop"], files });
    return { code: 0, lines: [`rung_receipt: loop ${o["--loop"]} · 4 artefact(s) hashed · row ${row.row_sha256.slice(0, 12)}`] };
  }
  const key = `${o["--rung"]}:${o["--clause"]}`;
  const head = headSha();
  if (!head) return { code: 1, lines: ["rung_receipt: REFUSED · git HEAD unreadable"] };
  if (a.verb === "red") {
    const w = parseWitness(o["--cmd"]);
    if (!w.ok) return { code: 1, lines: [`rung_receipt: REFUSED · ${w.why} · nothing ran, nothing written`] };
    const r = runWitness(w.argv);
    if (r.exit === null) return { code: 1, lines: [`rung_receipt: REFUSED · ${key}: the witness did not finish inside WITNESS_TIMEOUT_MS · nothing written`] };
    if (r.exit === 0) return { code: 1, lines: [`rung_receipt: REFUSED · ${key}: the witness exited 0 — a red-before that is not red is not a red-before · nothing written`] };
    const row = append(path, rr, { kind: "red", key, rung: o["--rung"], clause: o["--clause"], cmd: o["--cmd"], cmd_sha256: sha256(o["--cmd"]), head_sha: head, exit: r.exit, out_sha256: r.out_sha256 });
    return { code: 0, lines: [`rung_receipt: red ${key} · exit ${r.exit} · out ${r.out_sha256.slice(0, 12)} · head ${head.slice(0, 12)} · last: ${r.last.slice(0, 160)}`] };
  }
  // green
  const reds = rr.rows.filter((x) => x.row.key === key && x.row.kind === "red" && !rowProblem(x.row));
  if (!reds.length) return { code: 1, lines: [`rung_receipt: REFUSED · ${key}: no red row — a green needs its red before`] };
  const red = reds[reds.length - 1].row;
  if (head === red.head_sha) return { code: 1, lines: [`rung_receipt: REFUSED · ${key}: HEAD equals the red row's HEAD — nothing was built between`] };
  const ancestor = git(["merge-base", "--is-ancestor", red.head_sha, head]).status;
  if (ancestor !== 0) return { code: 1, lines: [`rung_receipt: REFUSED · ${key}: the red HEAD is not an ancestor of HEAD (merge-base exit ${ancestor})`] };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o["--day"])) return { code: 1, lines: [`rung_receipt: REFUSED · --day is YYYY-MM-DD (IST)`] };
  const day = await import(pathToFileURL(join(__dirname, "day.mjs")).href);
  const proof = day.dayProof(o["--day"]);
  if (!proof.real) return { code: 1, lines: [`rung_receipt: REFUSED · ${key}: ${o["--day"]} is not a real day (${proof.why}) · nothing ran, nothing written`] };
  const w = parseWitness(red.cmd);
  if (!w.ok) return { code: 1, lines: [`rung_receipt: REFUSED · ${key}: the red row's command no longer resolves (${w.why})`] };
  const { OLD_RECORDED_DAY } = await import(pathToFileURL(join(__dirname, "done.mjs")).href);
  const before = fileSha(meterPath);
  const r = runWitness(w.argv);
  const after = fileSha(meterPath);
  let old = null;
  try { const rows = readFileSync(meterPath, "utf8").split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((x) => x && x.date === OLD_RECORDED_DAY); const l = rows.pop(); old = l ? (l.green === true ? true : l.green === false ? false : null) : null; } catch { old = null; }
  const g = append(path, rr, { kind: "green", key, rung: o["--rung"], clause: o["--clause"], cmd: red.cmd, cmd_sha256: red.cmd_sha256, head_sha: head, red_head_sha: red.head_sha, red_sha: red.row_sha256, ancestor, exit: r.exit === null ? -1 : r.exit, out_sha256: r.out_sha256, day: o["--day"], day_proof: { source: "sitting_reviews.jsonl", sitting_id: proof.sitting_id, closed_at: proof.closed_at, reason: proof.reason } });
  append(path, rr, { kind: "meter", key, rung: o["--rung"], clause: o["--clause"], meter: METER_FILE, before_sha256: before, after_sha256: after, equal: before === after, old_day: OLD_RECORDED_DAY, old_day_green: old, green_sha: g.row_sha256 });
  return { code: 0, lines: [`rung_receipt: green ${key} · exit ${g.exit} · meter ${before === after ? "equal" : "MOVED"} · day ${o["--day"]} (sitting ${proof.sitting_id}) · head ${head.slice(0, 12)} · last: ${r.last.slice(0, 160)}`] };
}

// ── SELFTEST (pure: the chain, the shape, the reader, the flag door — no git, no child) ──────────────────────────────
function selftest() {
  const out = []; let bad = 0;
  const t = (name, ok) => { out.push(`  ${ok ? "ok  " : "FAIL"} ${name}`); if (!ok) bad++; };
  const dir = mkdtempSync(join(tmpdir(), "rung-receipt-st-"));
  try {
    const p = join(dir, RECEIPTS_FILE);
    const rr = readReceipts(p);
    t("an absent file reads as no rows, chain holding (never a measured zero)", !rr.present && rr.rows.length === 0 && rr.brokenAt === -1);
    const H1 = "a".repeat(40), H2 = "b".repeat(40), cmd = "node ci/x.mjs";
    const red = append(p, rr, { kind: "red", key: "S1:c1", rung: "S1", clause: "c1", cmd, cmd_sha256: sha256(cmd), head_sha: H1, exit: 1, out_sha256: sha256("o") });
    const g = append(p, rr, { kind: "green", key: "S1:c1", rung: "S1", clause: "c1", cmd, cmd_sha256: sha256(cmd), head_sha: H2, red_head_sha: H1, red_sha: red.row_sha256, ancestor: 0, exit: 0, out_sha256: sha256("p"), day: "2026-11-20", day_proof: { source: "sitting_reviews.jsonl", sitting_id: "s1", closed_at: "2026-11-20T15:00:00.000Z", reason: "fulltime" } });
    append(p, rr, { kind: "meter", key: "S1:c1", rung: "S1", clause: "c1", meter: METER_FILE, before_sha256: sha256("m"), after_sha256: sha256("m"), equal: true, old_day: "2026-11-13", old_day_green: false, green_sha: g.row_sha256 });
    const back = readReceipts(p);
    t("three appended rows read back with the chain holding", back.rows.length === 3 && back.brokenAt === -1);
    t("a complete triple on the plan's own witness reads GREEN", clauseVerdict("S1:c1", cmd, back).word === "GREEN");
    t("the same triple under a changed plan witness reads RED (witness changed)", clauseVerdict("S1:c1", "node ci/y.mjs", back).why === "witness changed");
    t("a key with no row reads UNREAD, never 0", clauseVerdict("S9:c9", cmd, back).word === "UNREAD");
    const typed = { ...back.rows[0].row, red_before: "RED hand typed" };
    t("a row carrying a hand field is REFUSED (typed)", /^typed/.test(String(rowProblem(typed))));
    t("a row written by another hand is REFUSED", rowProblem({ ...back.rows[0].row, by: "hand" }) === "typed: not written by rung_receipt.mjs");
    writeFileSync(p, readFileSync(p, "utf8") + JSON.stringify({ ...back.rows[2].row, prev_sha256: ZERO }) + "\n");
    const broke = readReceipts(p);
    t("a row with a wrong prev_sha256 breaks the chain from that row on", broke.brokenAt === 3 && clauseVerdict("S1:c1", cmd, broke).why === "chain");
    t("a typed verdict flag is refused before anything runs", !parseArgs(["green", "--rung", "S1", "--clause", "c1", "--day", "2026-11-20", "--verdict", "GREEN"]).ok);
    t("an unknown verb is refused", !parseArgs(["green-now"]).ok);
    t("ARSENAL_RUNG_STATE_DIR outside os.tmpdir() is refused", !stateDir({ [STATE_ENV]: join(dirname(real(tmpdir())), `not-tmp-${process.pid}`) }).ok && stateDir({ [STATE_ENV]: dir }).ok);
    t("the witness bound is read from an owner, a positive integer", Number.isInteger(WITNESS_TIMEOUT_MS) && WITNESS_TIMEOUT_MS > 0);
    t("the plan reader refuses an absent plan and a plan without source_sha256", !readPlan(dir).ok);
  } finally { rmSync(dir, { recursive: true, force: true }); }
  out.push(bad ? `rung_receipt selftest: ${bad} FAIL` : `rung_receipt selftest: all ${out.length} pass`);
  return { code: bad ? 1 : 0, lines: out };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = await cli(process.argv.slice(2));
  for (const l of r.lines) console.log(l);
  process.exitCode = r.code;
}
