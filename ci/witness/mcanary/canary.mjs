#!/usr/bin/env node
// @ts-check
// ============================================================================
// ci/witness/mcanary/canary.mjs — UNIT mcanary · THE CANARY FILE'S ONE WRITER (spec ci/mwit/MWIT_SPEC.md @ 88bf69d,
//   UNITS row 8 · rulings forks rows 1162 / 1163)
//   SOLE WRITER of ci/witness/mcanary/canaries.jsonl (SOLE WRITER: ci/witness/mcanary/canary.mjs)
// ----------------------------------------------------------------------------
// WHAT IT IS. The three B-canary clauses (launch-no-laptop · opus-vs-fable · design-fleet) are judged by ONE reader,
//   ci/witness/mcanary/witness_canary.mjs, over ONE tracked file, canaries.jsonl. This verb is the only hand that appends
//   to it. A canary has two rows: its PASS row (the pass line, written BEFORE the launch) and its RUN row (the launch's
//   measured outcome, written at return). The run row names the pass row's sha, so a pass line edited after the run is
//   seen: the edit is a NEW pass row, and the run no longer names the latest one.
// NO OUTCOME IS EVER AN ARGUMENT. The run row is MEASURED here:
//   · each seat's session facts are read out of the record the session tool returned for that seat (`get_session`, the
//     JSON saved to a file at return): id, created_at, environment_kind, status_bucket, configured_model,
//     external_metadata.last_served_model and the session's ONE outcome branch. No model id is typed anywhere in this file.
//   · "its push reached its branch" is read by git: the branch's tip on the remote (`git ls-remote`), fetched, and the
//     newest commit in its history whose message carries that session's own `Claude-Session: …/<session id>` trailer.
//   · the seat's unit is read off its branch name (`claude/<unit>-…`), never typed.
//   The only typed things are the canary id, the pass line's words and the seat names — the plan's words, not a verdict.
// CHAIN. Every row is hash-chained exactly as the rung receipt chains its own (rowSha / parseReceipts are IMPORTED from
//   scripts/rung_receipt.mjs:101,107 — one chain, never a copy): row_sha256 = sha256(prev_sha256 + canonical JSON of the
//   row without row_sha256); the first prev is 64 zeros. A row of the file holds ids, shas, times, branch names and the
//   session's own served-model label — no transcript text, no word of his, no person name (code public, data private).
// CLI (any flag outside a verb's own set is REFUSED before anything is written):
//   node ci/witness/mcanary/canary.mjs pass   --id <canary> --line <the pass line> --seat <name> [--seat <name>…]
//   node ci/witness/mcanary/canary.mjs run    --id <canary> --session <seat>=<record.json> [--session …] [--remote <name>]
//   node ci/witness/mcanary/canary.mjs show                 (read-only)
//   node ci/witness/mcanary/canary.mjs verify               (read-only; exit 1 on a broken chain)
// WHO ELSE COULD ACT ON THIS OUTPUT? witness_canary.mjs (the one reader) · the runner (the line each verb prints).
// ============================================================================
import { readFileSync, appendFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { rowSha, parseReceipts, sha256, ZERO, WITNESS_TIMEOUT_MS } from "../../../scripts/rung_receipt.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, "..", "..", "..");
export const CANARY_FILE = join(HERE, "canaries.jsonl");
export const BY = "ci/witness/mcanary/canary.mjs";
/** the three canary ids this file carries (the spec's B-canary clause ids, minus the prefix) */
export const IDS = Object.freeze(["launch-no-laptop", "opus-vs-fable", "design-fleet"]);
const NAME_RE = /^[A-Za-z0-9._-]+$/;
// the git children's ONE bound: the receipt's own witness bound, read from its owner (never typed here)
const git = (args) => spawnSync("git", args, { cwd: ROOT, encoding: "utf8", windowsHide: true, timeout: WITNESS_TIMEOUT_MS });

/** read the file: { present, rows: [{ row, i, chain }], brokenAt } — the receipt's own walk */
export function readCanaries(path = CANARY_FILE) {
  let text; try { text = readFileSync(path, "utf8"); } catch { text = null; }
  return parseReceipts(text);
}
const lastSha = (rr) => { const ok = rr.rows.filter((x) => x.chain); return ok.length ? ok[ok.length - 1].row.row_sha256 : ZERO; };
/** the latest row of a kind for an id, inside the unbroken chain only */
export function latest(rr, kind, id) {
  const hit = rr.rows.filter((x) => x.chain && x.row.kind === kind && x.row.id === id);
  return hit.length ? hit[hit.length - 1].row : null;
}

/** the facts of ONE seat's session record, read — every one null when the record does not carry it */
export function sessionFacts(rec) {
  const s = rec && typeof rec === "object" ? (rec.ccr && typeof rec.ccr === "object" ? rec.ccr : rec) : {};
  const str = (v) => (typeof v === "string" && v ? v : null);
  const outs = Array.isArray(s.session_context && s.session_context.outcomes) ? s.session_context.outcomes : [];
  const branches = outs.flatMap((o) => { const b = o && o.git_repository && o.git_repository.git_info && o.git_repository.git_info.branches; return Array.isArray(b) ? b : []; });
  const branch = branches.length === 1 && typeof branches[0] === "string" && NAME_RE.test(branches[0].replace(/\//g, "")) ? branches[0] : null;
  const m = branch ? /^claude\/([a-z0-9]+)(?:-|$)/.exec(branch) : null;
  const created = str(s.created_at);
  return {
    session_id: str(s.id) && /^session_[A-Za-z0-9]+$/.test(s.id) ? s.id : null,
    created_at: created && Number.isFinite(Date.parse(created)) ? created : null,
    environment_kind: str(s.environment_kind),
    status_bucket: str(s.status_bucket),
    configured_model: str(s.configured_model) || str(s.session_context && s.session_context.model),
    served_model: str(s.external_metadata && s.external_metadata.last_served_model),
    branch, unit: m ? m[1] : null,
  };
}

/** did the seat's push reach its branch? read by git on the remote — { tip, reached_sha } or { why } when unreadable */
export function pushReached(remote, branch, sessionId) {
  if (!branch || !sessionId) return { tip: null, reached_sha: null };
  const ls = git(["ls-remote", remote, `refs/heads/${branch}`]);
  if (ls.status !== 0) return { why: `git ls-remote ${remote} answered ${ls.status} — the push cannot be read` };
  const tip = (String(ls.stdout).trim().split(/\s+/)[0] || "").trim() || null;
  if (!tip) return { tip: null, reached_sha: null };
  const f = git(["fetch", "--no-tags", "-q", remote, `refs/heads/${branch}`]);
  if (f.status !== 0) return { why: `git fetch ${remote} ${branch} answered ${f.status} — the push cannot be read` };
  const lg = git(["log", "-F", `--grep=claude.ai/code/${sessionId}`, "-n", "1", "--format=%H", tip]);
  if (lg.status !== 0) return { why: `git log ${tip.slice(0, 7)} answered ${lg.status}` };
  return { tip, reached_sha: String(lg.stdout).trim() || null };
}

function append(path, body) {
  const rr = readCanaries(path);
  if (rr.brokenAt >= 0) return { ok: false, why: `the canary chain is broken at row ${rr.brokenAt + 1} — nothing appended` };
  const row = { v: 1, ...body, at: new Date().toISOString(), by: BY, prev_sha256: lastSha(rr) };
  row.row_sha256 = rowSha(row);
  appendFileSync(path, JSON.stringify(row) + "\n");
  return { ok: true, row };
}

/** the pass row: the pass line, written before the launch */
export function pass({ id, line, seats }, path = CANARY_FILE) {
  if (!IDS.includes(String(id))) return { ok: false, why: `--id must be one of ${IDS.join(" | ")}` };
  if (typeof line !== "string" || !line.trim()) return { ok: false, why: "--line is the pass line's words, and it is empty" };
  if (!Array.isArray(seats) || !seats.length || !seats.every((x) => NAME_RE.test(String(x))) || new Set(seats).size !== seats.length) return { ok: false, why: "--seat names each seat once (letters, digits, . _ -)" };
  return append(path, { kind: "pass", id, line: line.trim(), seats: [...seats] });
}

/** the run row: every seat's outcome, MEASURED */
export function run({ id, sessions, remote = "origin" }, path = CANARY_FILE) {
  if (!IDS.includes(String(id))) return { ok: false, why: `--id must be one of ${IDS.join(" | ")}` };
  const p = latest(readCanaries(path), "pass", id);
  if (!p) return { ok: false, why: `no pass row for ${id} — a run is recorded only after its pass line` };
  if (!Array.isArray(sessions) || !sessions.length) return { ok: false, why: "--session <seat>=<record.json> at least once" };
  const seats = [];
  for (const { seat, file } of sessions) {
    if (!p.seats.includes(seat)) return { ok: false, why: `seat ${seat} is not named by the pass row of ${id}` };
    if (seats.some((x) => x.seat === seat)) return { ok: false, why: `seat ${seat} given twice` };
    let bytes; try { bytes = readFileSync(file); } catch { return { ok: false, why: `${file}: no such session record` }; }
    let rec; try { rec = JSON.parse(bytes.toString("utf8")); } catch { return { ok: false, why: `${file}: not JSON` }; }
    const f = sessionFacts(rec);
    const r = pushReached(remote, f.branch, f.session_id);
    if ("why" in r) return { ok: false, why: r.why };
    seats.push({ seat, ...f, tip: r.tip, reached_sha: r.reached_sha, record_sha256: sha256(bytes) });
  }
  const times = seats.map((s) => s.created_at).filter(Boolean).sort();
  return append(path, { kind: "run", id, pass_sha: p.row_sha256, started_at: times.length === seats.length ? times[0] : null, seats });
}

// ── CLI ───────────────────────────────────────────────────────────────────────────────────────────────────────────
const VERBS = Object.freeze({ pass: ["--id", "--line", "--seat"], run: ["--id", "--session", "--remote"], show: [], verify: [] });
function parseArgs(argv) {
  const [verb, ...rest] = argv;
  if (!verb || !(verb in VERBS)) return { why: `usage: canary.mjs ${Object.keys(VERBS).join(" | ")}` };
  const allowed = VERBS[/** @type {keyof typeof VERBS} */ (verb)], out = /** @type {Record<string,string[]>} */ ({});
  for (let i = 0; i < rest.length; i += 2) {
    const k = rest[i], v = rest[i + 1];
    if (!allowed.includes(k) || v === undefined) return { why: `${verb}: ${k} is not one of its flags (${allowed.join(" ") || "none"}) — refused` };
    (out[k] = out[k] || []).push(v);
  }
  return { verb, out };
}
function main() {
  const a = parseArgs(process.argv.slice(2));
  if ("why" in a) { console.log(`canary: ${a.why}`); process.exit(2); }
  const one = (k) => (a.out[k] || [])[0];
  if (a.verb === "show" || a.verb === "verify") {
    const rr = readCanaries();
    if (a.verb === "show") for (const x of rr.rows) console.log(`${x.chain ? "  " : "✗ "}${x.row.kind || "?"} ${x.row.id || "?"} ${String(x.row.row_sha256 || "").slice(0, 12)} ${x.row.at || ""}`);
    console.log(`canary ${a.verb}: ${rr.present ? `${rr.rows.length} row(s)` : "no canary file"} · chain ${rr.brokenAt < 0 ? "holds" : `BROKEN at row ${rr.brokenAt + 1}`}`);
    process.exit(rr.brokenAt < 0 ? 0 : 1);
  }
  let r;
  if (a.verb === "pass") r = pass({ id: one("--id"), line: one("--line"), seats: a.out["--seat"] || [] });
  else {
    const sessions = (a.out["--session"] || []).map((s) => { const i = s.indexOf("="); return { seat: s.slice(0, i), file: resolve(s.slice(i + 1)) }; });
    r = run({ id: one("--id"), sessions, remote: one("--remote") || "origin" });
  }
  if (!r.ok) { console.log(`canary ${a.verb}: REFUSED — ${r.why}`); process.exit(2); }
  console.log(`canary ${a.verb}: ${r.row.id} · row ${r.row.row_sha256.slice(0, 12)} appended to ${existsSync(CANARY_FILE) ? "canaries.jsonl" : "?"}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
