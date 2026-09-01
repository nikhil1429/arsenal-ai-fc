#!/usr/bin/env node
// ============================================================================
// claims.mjs · ARSENAL AI FC — THE CLAIMS GATE: LAW A, POINTED AT THE ASSISTANT
//   (THE BLUEPRINT §6 · rung 0.1+0.2, 1 Sep 2026 — the Day-0 enforcement floor)
//   SOLE WRITER of dressing-room/state/claims.jsonl (machine-local, gitignored —
//   session bookkeeping, same class as the session_meter cache).
//   Writes NOTHING else, ever. A gate that can write elsewhere can be part of the accident.
// ----------------------------------------------------------------------------
// THE BUG THIS EXISTS FOR (measured, this campaign): the organism's laws asked HIM for a
//   gut-word before an answer, and asked ITS OWN sessions for nothing. Sessions closed turns
//   with "verified", "sab green", "poora padh liya" and the record was the sentence itself.
//   The 1-Sep audit re-ran the headline claims by hand and TWO numbers on record did not
//   reproduce (the suite baseline; S12's input predicate) — both had been asserted in prose
//   by a session that never wrote its working down. LAW A already turned HIS word into a
//   receipt; nothing turned MINE into one.
//
// THE RULE: *a session may not claim work it cannot show a receipt for.* Same shape as the
//   gut-word law, one actor over. To say "done", file the claim WITH the command that proves
//   it; the organ runs the command itself, stores the exit code and a hash of the output, and
//   REFUSES the claim when the command fails. Then the Stop hook asks one question at the
//   anchor: this turn claims something — is there a witness?
//
// WHY IT BLOCKS AT Stop AND NOWHERE ELSE: the claim only exists once the turn is written.
//   A PreToolUse rail cannot see a sentence that has not been said yet.
//
// MEASURED BEFORE IT WAS BUILT (§10-D rule 5 — the fear was a LEAD until a run settled it):
//   the worry was that this would block his STUDY turns, because teaching prose says "done".
//   Over every transcript in this project's Claude history: 20,674 assistant text blocks in
//   forge-marked sessions, 2,117 regex hits (10.2%); 8,970 blocks elsewhere, 551 hits (6.1%).
//   The 381 hits with no obvious work-marker were sampled and READ: every one is a work-claim
//   ("BLOCK 8 done", "C4 done", "revert done", "commit + push"), not teaching. The gate binds
//   work-claims. That is its design, and the number is on the record instead of the fear.
//
// THE EXEMPTIONS, EACH ONE NAMED (§5 defect 1 of the blueprint — the nightly lanes must never
//   be blocked mid-flight):
//   1. ARSENAL_ORGAN=1 — the env EVERY organ-spawned `claude -p` already sets (brain.mjs:2404,
//      talk.mjs:145, claudegen.mjs, selfknowledge.mjs, cortex, council, outbox, tasks, dugout).
//      Verified by grep, not assumed.
//   2. `stop_hook_active` — Claude Code sets it on a stop that is ALREADY continuing from a
//      hook block. Honouring it makes a loop impossible: this gate blocks at most once.
//   3. Nothing to judge — no assistant text on the payload and no readable transcript => allow.
//   4. ARSENAL_CLAIMS_EXEMPT=1 — the DECLARED belt for a headless lane that does not go through
//      an organ spawn. Entrypoint strings are deliberately NOT hardcoded: this machine measures
//      CLAUDE_CODE_ENTRYPOINT=claude-desktop and the headless value set was never measured here,
//      so matching on it would be an unverified gate pretending to be a verified one.
//   FAIL-OPEN on any internal throw (the archive tripwire's precedent, and rails.mjs's): a gate
//   that halts all work when IT is broken gets uninstalled, and an uninstalled gate guards nothing.
//   THERE IS NO OFF SWITCH. The compliant path is always one command away (§10-D rule 6).
//
// THE WINDOW, AND WHY IT IS ALSO SESSION-SCOPED: a receipt counts when it is ok, inside
//   --minutes (default 30 — one work stretch), and from THIS session. Time alone is not enough:
//   two sessions in parallel would let one session's suite run excuse the other's claim, which
//   is the exact hole this closes. MEASURED before it was trusted: the live Stop payload's
//   `session_id` and the env `CLAUDE_CODE_SESSION_ID` are the same string on this machine
//   (teaching_audit_last.json holds the payload's own value), so both sides land on one id.
// LEDGER ROW: {id, ts, session, claim, cmd, exit, ok, out_sha16, ms}
// CLI: node scripts/claims.mjs claim "<text>" --cmd "<command>" [--session <id>]
//      | check [--minutes N] [--session <id>] | stop | status [n] | selftest
// WHO ELSE COULD ACT ON THIS OUTPUT? .claude/settings.json Stop (wired — its OWN process, so a
//   gate never shares stdout with the printers on that anchor) · the 4 hookify rules in
//   .claude/hookify.*.local.md say the same law in the readable surface, all `warn`, because
//   hookify's rule language has no env predicate and a warn can never block an organ lane.
// ============================================================================
import { readFileSync, appendFileSync, existsSync, mkdirSync, statSync, openSync, readSync, closeSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STATE_DIR = join(ROOT, "dressing-room", "state");
export const CLAIMS_LEDGER = process.env.ARSENAL_CLAIMS_LEDGER || join(STATE_DIR, "claims.jsonl");

// THE CLAIM VERBS — the blueprint's corridor, verbatim. Not widened here: a gate may only get
// stricter (§10-D rule 6), and widening it in the same breath as building it would mean the
// measurement above was taken against a different rule than the one that ships.
export const CLAIM_RE = /\b(verified|confirmed|checked|sab green|poora padh|done|complete)\b/i;
export const DEFAULT_MINUTES = 30;

const sha16 = (s) => createHash("sha256").update(String(s == null ? "" : s), "utf8").digest("hex").slice(0, 16);
const newId = (now) => `k${now.getTime().toString(36)}${Math.floor(Math.random() * 1296).toString(36).padStart(2, "0")}`;
const argOf = (flag, argv = process.argv) => { const i = argv.indexOf(flag); return i > 0 && argv[i + 1] != null ? String(argv[i + 1]) : null; };
export const sessionOfEnv = (env = process.env) => String(env.CLAUDE_CODE_SESSION_ID || "").trim() || null;

export function readRows(p = CLAIMS_LEDGER) {
  try {
    if (!existsSync(p)) return [];
    return readFileSync(p, "utf8").split("\n").filter((l) => l.trim())
      .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
}

function appendRow(row, p = CLAIMS_LEDGER) {
  try { mkdirSync(dirname(p), { recursive: true }); appendFileSync(p, JSON.stringify(row) + "\n", "utf8"); return true; }
  catch { return false; }   // a ledger that cannot be written is reported, never fatal
}

// ── THE CLAIM — the command RUNS, and the run is the receipt ─────────────────
// The command is run through the shell on purpose: what a session claims is usually proven by
// a shell line it just typed (`npm test`, `node scripts/x.mjs selftest`), and re-typing it in
// argv form would be a second, different command — i.e. a different witness.
export function fileClaim({ claim, cmd, session = null, now = new Date(), ledger = CLAIMS_LEDGER, runner = null } = {}) {
  const text = String(claim == null ? "" : claim).trim();
  const command = String(cmd == null ? "" : cmd).trim();
  if (!text) return { ok: false, misuse: true, why: "a claim needs its own words — what is being claimed?" };
  if (!command) return { ok: false, misuse: true, why: 'a claim needs --cmd "<the command that proves it>": an unwitnessed claim is the thing this organ exists to refuse' };
  const t0 = Date.now();
  let exit = 127, out = "";
  try {
    const r = runner ? runner(command) : spawnSync(command, { shell: true, encoding: "utf8", cwd: ROOT, timeout: 900000, windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
    exit = r.status == null ? (r.error ? 127 : 1) : r.status;
    out = `${r.stdout || ""}${r.stderr || ""}`;
  } catch (e) { exit = 127; out = String((e && e.message) || e); }
  const row = { id: newId(now), ts: now.toISOString(), session: session || sessionOfEnv(), claim: text, cmd: command, exit, ok: exit === 0, out_sha16: sha16(out), ms: Date.now() - t0 };
  const stored = appendRow(row, ledger);
  return { ok: row.ok, stored, row, tail: out.split("\n").filter(Boolean).slice(-3).join("\n") };
}

// ── THE PROBE — is this claim witnessed? ────────────────────────────────────
export function freshReceipt(rows, { now = new Date(), minutes = DEFAULT_MINUTES, session = null } = {}) {
  const floor = now.getTime() - minutes * 60000;
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    if (!r || r.ok !== true) continue;
    const t = Date.parse(r.ts || "");
    if (!Number.isFinite(t) || t < floor) continue;
    if (session && r.session && r.session !== session) continue;   // another session's receipt is not this one's witness
    return r;
  }
  return null;
}

// ── THE ASSISTANT'S OWN WORDS — the payload first, the transcript as the fallback ──
// Claude Code hands `last_assistant_message` on Stop (afferent-post.mjs:189 and
// teaching_audit.mjs:934 have both read it in production since 30 Jul 2026). The transcript
// tail is the belt for a payload shape that ever drops it: only the last 256 KB is read, so a
// megabyte-scale study transcript never turns this hook into a file scan.
export function assistantText(payload = {}) {
  const direct = String(payload.last_assistant_message || "").trim();
  if (direct) return direct;
  const p = String(payload.transcript_path || "").trim();
  if (!p || !existsSync(p)) return "";
  let raw = "";
  try {
    const size = statSync(p).size;
    const span = Math.min(size, 256 * 1024);
    const fd = openSync(p, "r");
    try { const buf = Buffer.alloc(span); readSync(fd, buf, 0, span, size - span); raw = buf.toString("utf8"); } finally { closeSync(fd); }
  } catch { return ""; }
  const lines = raw.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i].trim(); if (!l.startsWith("{")) continue;
    let j; try { j = JSON.parse(l); } catch { continue; }
    if (!j || j.type !== "assistant") continue;
    const c = j.message && j.message.content;
    if (!Array.isArray(c)) continue;
    const t = c.filter((x) => x && x.type === "text").map((x) => x.text).join("\n").trim();
    if (t) return t;
  }
  return "";
}

// ── THE GATE — the whole decision, PURE, so the selftest drives every branch with no I/O ──
export function decide({ payload = {}, rows = [], now = new Date(), env = process.env, minutes = DEFAULT_MINUTES } = {}) {
  const allow = (why, extra = {}) => ({ decision: "allow", why, ...extra });
  if (String(env.ARSENAL_ORGAN || "") === "1") return allow("EXEMPT — ARSENAL_ORGAN=1: this is the organism's own headless lane, not a session making a claim");
  if (String(env.ARSENAL_CLAIMS_EXEMPT || "") === "1") return allow("EXEMPT — ARSENAL_CLAIMS_EXEMPT=1 declared for this lane");
  if (payload.stop_hook_active === true) return allow("this stop is already continuing from a hook block — the gate speaks once, never twice");
  const text = assistantText(payload);
  if (!text) return allow("no assistant text on this stop — nothing to judge");
  const m = CLAIM_RE.exec(text);
  if (!m) return allow("the turn claims nothing");
  const session = String(payload.session_id || "").trim() || sessionOfEnv(env);
  const witness = freshReceipt(rows, { now, minutes, session });
  if (witness) return allow(`the claim is witnessed — \`${witness.cmd}\` exited 0 at ${String(witness.ts).slice(11, 19)}Z`, { verb: m[1], witness: witness.id });
  const reason = `CLAIMS GATE — this turn says "${m[1]}" and no witness was filed in the last ${minutes} min.
   A claim in this organism is a RECEIPT, not a sentence — the same law that binds HIS gut-word, pointed at you.
   FIX: node scripts/claims.mjs claim "<what you are claiming>" --cmd "<the command that proves it>"
        (it RUNS the command, stores the exit code and a hash of the output, and REFUSES the claim if the command fails)
   OR: restate the turn without the claim — "not verified yet" is always allowed, and is never a defect.`;
  return { decision: "block", verb: m[1], reason };
}

// ── THE Stop HOOK — Claude Code's contract: a JSON decision on stdout, exit 0 ──
export function stopHook({ raw = null, env = process.env, now = new Date(), ledger = CLAIMS_LEDGER } = {}) {
  let payload = {};
  try {
    const handed = globalThis.__ARSENAL_HOOK_STDIN__;
    let text;
    if (raw !== null) text = raw;
    else if (typeof handed === "string") text = handed;
    else if (process.stdin.isTTY) text = "";
    else text = readFileSync(0, "utf8");
    payload = text && text.trim() ? JSON.parse(text) : {};
  } catch { payload = {}; }
  let d;
  try { d = decide({ payload, rows: readRows(ledger), now, env }); }
  catch (e) { return { decision: "allow", why: `the gate threw and fails OPEN by design: ${(e && e.message) || e}` }; }
  if (d.decision === "block") process.stdout.write(JSON.stringify({ decision: "block", reason: d.reason, systemMessage: d.reason }) + "\n");
  return d;   // silence = the turn closes normally
}

// ── SELFTEST ────────────────────────────────────────────────────────────────
let pass = 0, fail = 0; const fails = [];
const assert = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; fails.push({ n, d }); console.log(`  FAIL ${n}${d ? `\n         ${d}` : ""}`); } };

function selftest() {
  console.log("=== claims.mjs selftest — the gate BITES on a planted fake claim, and never on an organ ===\n");
  const now = new Date("2026-09-01T18:00:00.000Z");
  const at = (minAgo) => new Date(now.getTime() - minAgo * 60000).toISOString();
  const SID = "sess-A", OTHER = "sess-B";
  const rowOk = (minAgo, session = SID, cmd = "npm test") => ({ id: `k${minAgo}`, ts: at(minAgo), session, claim: "suite green", cmd, exit: 0, ok: true, out_sha16: "0".repeat(16), ms: 10 });
  const P = (msg, extra = {}) => ({ hook_event_name: "Stop", session_id: SID, last_assistant_message: msg, ...extra });
  const D = (payload, rows = [], env = {}) => decide({ payload, rows, now, env });

  // 1 — the verbs, exactly as the corridor wrote them
  assert("VERBS — all seven claim verbs match", ["it is verified", "confirmed working", "I checked it", "sab green hai", "poora padh liya", "Done.", "task complete"].every((s) => CLAIM_RE.test(s)));
  assert("VERBS — ordinary prose does not match", !CLAIM_RE.test("tokenization ek chhota sa kaam hai, chalo aage badhte hain"));
  assert("VERBS — the verb must be a WORD, not a fragment", !CLAIM_RE.test("donementia") && !CLAIM_RE.test("undonely"));

  // 2 — THE PLANTED FAKE CLAIM (the DoD)
  const blocked = D(P("Verified — the whole chain is green."));
  assert("PLANTED — a claim with NO witness is BLOCKED, and the reason names the fix", blocked.decision === "block" && /claims\.mjs claim/.test(blocked.reason) && blocked.verb.toLowerCase() === "verified", JSON.stringify(blocked).slice(0, 200));
  assert("PLANTED — a turn that claims nothing is never touched", D(P("Yeh raha plan, ab batao aage kya karein?")).decision === "allow");

  // 3 — the witness
  assert("WITNESS — a fresh ok receipt from THIS session lets the claim through", D(P("done"), [rowOk(2)]).decision === "allow");
  assert("WITNESS — a receipt older than the window does not count", D(P("done"), [rowOk(90)]).decision === "block");
  assert("WITNESS — a FAILED command is not a witness", D(P("done"), [{ ...rowOk(2), ok: false, exit: 1 }]).decision === "block");
  assert("WITNESS — another session's receipt does not excuse this session's claim", D(P("done"), [rowOk(2, OTHER)]).decision === "block");
  assert("WITNESS — a receipt filed with no session id still counts (a machine receipt, not another session's)", D(P("done"), [rowOk(2, null)]).decision === "allow");

  // 4 — the exemptions, one by one
  assert("EXEMPT — ARSENAL_ORGAN=1 (the nightly claude -p lanes) passes untouched", D(P("verified"), [], { ARSENAL_ORGAN: "1" }).decision === "allow");
  assert("EXEMPT — ARSENAL_CLAIMS_EXEMPT=1 passes untouched", D(P("verified"), [], { ARSENAL_CLAIMS_EXEMPT: "1" }).decision === "allow");
  assert("EXEMPT — stop_hook_active makes a second block impossible (no loop, ever)", D(P("verified", { stop_hook_active: true })).decision === "allow");
  assert("EXEMPT — an empty payload has nothing to judge", D({ hook_event_name: "Stop" }).decision === "allow");

  // 5 — the ledger, for real, in a throwaway file
  const tmpLedger = join(process.env.TEMP || process.env.TMP || ".", `arsenal-claims-selftest-${process.pid}.jsonl`);
  const okRun = fileClaim({ claim: "the fixture command succeeds", cmd: "IGNORED", ledger: tmpLedger, session: SID, runner: () => ({ status: 0, stdout: "fixture ok\n", stderr: "" }) });
  assert("LEDGER — a succeeding command stores a receipt with exit 0 and a hash of the output", okRun.ok === true && okRun.row.exit === 0 && /^[0-9a-f]{16}$/.test(okRun.row.out_sha16), JSON.stringify(okRun.row));
  const badRun = fileClaim({ claim: "the fixture command fails", cmd: "IGNORED", ledger: tmpLedger, session: SID, runner: () => ({ status: 3, stdout: "", stderr: "boom\n" }) });
  assert("LEDGER — a FAILING command REFUSES the claim, and the refusal is still on the record", badRun.ok === false && badRun.row.exit === 3 && badRun.row.ok === false);
  const rows = readRows(tmpLedger);
  assert("LEDGER — both rows are on disk, append-only, newest last", rows.length >= 2 && rows[rows.length - 1].exit === 3);
  assert("LEDGER — the refused row is not a witness; the good one is", freshReceipt(rows, { now: new Date(), minutes: DEFAULT_MINUTES, session: SID }).exit === 0);
  assert("MISUSE — a claim with no --cmd is refused as misuse, and nothing is written", fileClaim({ claim: "trust me", ledger: tmpLedger }).misuse === true);
  assert("MISUSE — a --cmd with no claim text is refused too", fileClaim({ cmd: "npm test", ledger: tmpLedger }).misuse === true);
  try { unlinkSync(tmpLedger); } catch { /* the fixture is disposable */ }

  // 6 — the hook path end to end, through stdin, with no ledger at all
  const noLedger = join(process.env.TEMP || ".", "arsenal-claims-nonexistent.jsonl");
  const hookBlock = stopHook({ raw: JSON.stringify(P("All checked and done.")), env: {}, now, ledger: noLedger });
  assert("HOOK — a fake-claim payload on stdin produces decision:block", hookBlock.decision === "block");
  assert("HOOK — malformed stdin fails OPEN (a broken gate never halts the work)", stopHook({ raw: "{not json", env: {}, now, ledger: noLedger }).decision === "allow");
  assert("HOOK — an organ payload on stdin passes", stopHook({ raw: JSON.stringify(P("verified")), env: { ARSENAL_ORGAN: "1" }, now, ledger: noLedger }).decision === "allow");

  // 7 — the organ writes exactly one file and never another
  const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
  const writeCalls = (src.match(/appendFileSync\(|writeFileSync\(/g) || []).length;
  assert("OWNERS-ONLY — this organ has exactly ONE write call, into its own ledger", writeCalls === 1, `found ${writeCalls}`);

  console.log(`\n${fail ? "✗" : "✓"} claims.mjs selftest — ${pass} passed, ${fail} failed`);
  for (const f of fails) console.log(`   FAIL ${f.n}${f.d ? ` · ${f.d}` : ""}`);
  process.exit(fail ? 1 : 0);
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
function main() {
  const mode = (process.argv[2] || "status").toLowerCase();
  if (mode === "selftest") return selftest();

  if (mode === "claim") {
    const claim = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : null;
    const r = fileClaim({ claim, cmd: argOf("--cmd"), session: argOf("--session") });
    if (r.misuse) { console.error(`claims: ${r.why}`); process.exit(2); }
    if (!r.stored) console.error("claims: WARNING — the receipt could not be written to the ledger; the command still ran and its verdict stands");
    if (r.ok) { console.log(`claims: RECEIPT ${r.row.id} · \`${r.row.cmd}\` exit 0 · ${r.row.ms} ms · out ${r.row.out_sha16} — the claim stands`); process.exit(0); }
    console.error(`claims: REFUSED — \`${r.row.cmd}\` exited ${r.row.exit}, so the claim is NOT witnessed (the refusal is on the record as ${r.row.id}).${r.tail ? `\n   last lines:\n   ${r.tail.replace(/\n/g, "\n   ")}` : ""}`);
    process.exit(1);
  }

  if (mode === "check") {
    const minutes = Number(argOf("--minutes")) > 0 ? Number(argOf("--minutes")) : DEFAULT_MINUTES;
    const session = argOf("--session");
    const w = freshReceipt(readRows(), { now: new Date(), minutes, session });
    if (w) { console.log(`claims: WITNESSED — ${w.id} · \`${w.cmd}\` exit 0 at ${w.ts}`); process.exit(0); }
    console.log(`claims: NO RECEIPT in the last ${minutes} min${session ? ` for session ${String(session).slice(0, 8)}` : ""}`);
    process.exit(1);
  }

  if (mode === "stop") { stopHook(); return; }

  if (mode === "status") {
    const n = Number(process.argv[3]) > 0 ? Number(process.argv[3]) : 10;
    const rows = readRows();
    if (!rows.length) { console.log("claims: no receipts yet — the ledger is empty"); return; }
    const ok = rows.filter((r) => r.ok).length;
    console.log(`claims: ${rows.length} receipt(s) · ${ok} witnessed · ${rows.length - ok} REFUSED`);
    for (const r of rows.slice(-n)) console.log(`  ${r.ok ? "✓" : "✗"} ${String(r.ts).slice(0, 16)} exit ${r.exit} · ${String(r.claim).slice(0, 60)} ← \`${String(r.cmd).slice(0, 60)}\``);
    return;
  }

  console.log('claims: claim "<text>" --cmd "<command>" [--session <id>] | check [--minutes N] [--session <id>] | stop | status [n] | selftest');
  process.exit(2);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
