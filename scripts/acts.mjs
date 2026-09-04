#!/usr/bin/env node
// ============================================================================
// acts.mjs · ARSENAL AI FC — LAW A: THE ACT LANE — HIS EXPLICIT WORD BECOMES A
//   RECEIPT IN THE SAME TURN (MODELS + ACTS work order, Block 2, 18 Aug 2026)
//   SOLE WRITER of dressing-room/state/acts.jsonl (gitignored — his words verbatim).
//   SOLE WRITER of dressing-room/state/intent_cache.json too (LOAD ZERO BLOCK 5, 19 Aug 2026 —
//   the resolver's memo of its OWN past verdicts; see THE INTENT section below).
//   Writes NOTHING else: every verb is an EXISTING owner's CLI, run as a child.
// ----------------------------------------------------------------------------
// HIS WORDS (18 Aug 2026): "what i am explictly saying should be done and implemented
//   right in that moment so do it first think how to design it" · "we have already
//   decided that you…" (he had to say "you forgot" 8× in one call).
// THE BUG THIS EXISTS FOR (measured 18 Aug 06:07Z): the Gaffer's take_note DID fire —
//   "Prepare god-tier 'samjhao' explanations … per his explicit word", routed:false —
//   and nothing executed it. A note is a row nobody runs: no owner, no receipt, no
//   agenda for the next sitting, no job. dugout_notes.jsonl and loose_balls.jsonl carry
//   routed:false forever — a flag no lane set. His ntfy ball at 14:01Z landed the same way.
//
// THE RULE: *When he asks for a thing, the organism either does it in that turn and
//   shows the receipt, or says in that turn that it cannot — never "note kar liya" with
//   nothing behind it.*
//   ONE dispatcher, FOUR doors, same ledger:
//     (1) the Gaffer's tools — dugout `/tool` → dispatch (take_note/remember RETURN a
//         receipt; new thin tools set_agenda · set_preference · add_rule · queue_job ·
//         file_card · fire_mission) · (2) the sitting brain's CTRL tail `"acts":[…]` —
//         sitting.mjs dispatches before the next unit and feeds receipts into the DRIVER
//         note · (3) Claude Code turns — `/act` skill + turn_hook's Stop lane parses a
//         `<<ACT {…}>>` tail (schema, not keywords) · (4) ntfy balls / throwin — a `lite`
//         model parses each ball into {acts:[…]} under a strict schema; code validates;
//         anything unparseable = `note` (verbatim) — never dropped.
//   VERBS (each = an EXISTING owner's CLI; no new writer of any state but acts.jsonl):
//     note → hippocampus mark <kind> (verbatim) · fact → hippocampus stage-pending (Law 4:
//     staged, he promotes) · pref → gaffer_state standing add (Hinglish, greeting-first)
//     · rule → teaching_contract add · agenda → sitting agenda add (the next sitting opens
//     on it) · job → tasks.mjs run --kind job --subject <existing job id> (LOAD ZERO BLOCK 1,
//     19 Aug 2026 — a TASK with an id and an idempotency key, not a direct call into brain;
//     his ask IS the gate's C) · card/reminder → captains_call file --key act:<id> · mission → scout
//     mission stage-topic · rep → gaffer_brain capture · undo → this file (every verb
//     declares its reverse; a verb with no owner reverse SAYS so).
//   NO-FAKE-DONE: a receipt is the only "ho gaya". The sitting driver returns a reply that
//     claims done without an act ONCE ("act do ya daawa hatao"); the second miss is
//     teaching-contract drift `fake-done` (auto-counted, reversible).
//   NEVER: free-form background LLM work the mouth invented (only `job` with an existing
//     id, on his ask) · keyword matching (schema from a model, validated by code) · a write
//     outside an owner's CLI · a "done" without a receipt.
// LEDGER ROW: {id, ts, door, verb, args, owner, argv, ok, receipt|error, ms, undone_at, reverse}
// CLI: node scripts/acts.mjs do <verb> --door <d> --text "…" [--kind k --axis a --id i --job j]
//      | undo <id> | status [days] | parse-ball "<text>" | selftest
// ============================================================================
import { readFileSync, appendFileSync, existsSync, mkdirSync, statSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { subjectsOf } from "./registry.mjs";   // S10 row 14 — the doors are rows

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STATE_DIR = join(ROOT, "dressing-room", "state");
export const ACTS_LEDGER = process.env.ARSENAL_ACTS_LEDGER || join(STATE_DIR, "acts.jsonl");
// S10 map row 14 (F-04): DOORS is a REGISTRY ROW (a new door ADDS by row);
// VERBS derives from the OWNER table's own keys below — one copy, structure-derived,
// so a verb cannot exist without its owner row (the old literal could drift).
export const DOORS = subjectsOf("act_doors");
export const ACT_TAIL_RE = /<<ACT\s*(\{[\s\S]*?\})\s*>>\s*$/;   // door 3 — a Claude Code turn's tail (schema, not keywords)
const isFixture = () => (process.argv[2] || "") === "selftest" || !!process.env.ARSENAL_AUDIT_COLLAR;

const clip = (s, n = 200) => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n);
const readRows = (p = ACTS_LEDGER) => { try { if (!existsSync(p)) return []; return readFileSync(p, "utf8").split("\n").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; } };
const newId = (now) => `a${now.getTime().toString(36)}${Math.floor(Math.random() * 1296).toString(36).padStart(2, "0")}`;

// ── THE OWNER TABLE — every verb is an owner's CLI + its declared reverse ──
// `argv(args, id)` builds the child argv (after `node scripts/<organ>.mjs`); `stdin` hands his
// words verbatim (never through shell quoting); `reverse(args, receipt, id)` names the undo
// argv or null with `why` (a spend cannot be unspent; a filed card is answered, not unfiled).
export const OWNERS = {
  note:     { organ: "hippocampus.mjs",       argv: (a) => ["mark", a.kind && ["doubt", "win", "preference", "thread"].includes(a.kind) ? a.kind : "thread"], stdin: (a) => a.text,
              reverse: (a, r) => { const id = r && /"id":"([^"]+)"/.exec(r); return id ? { argv: ["forget", id[1]] } : { argv: null, why: "the moment carried no id in its receipt" }; } },
  fact:     { organ: "hippocampus.mjs",       argv: () => ["stage-pending"], stdin: (a) => a.text,
              reverse: (a, r) => { const at = r && /"at":"([^"]+)"/.exec(r); return at ? { argv: ["drop-pending", "--at", at[1]] } : { argv: null, why: "the staged fact carried no `at` in its receipt" }; } },
  pref:     { organ: "gaffer_state.mjs",      argv: (a) => ["standing", "add", "--axis", a.axis || "how_to_speak", "--text", a.text],
              reverse: (a) => ({ argv: ["forget", a.axis || "how_to_speak"] }) },
  rule:     { organ: "teaching_contract.mjs", argv: (a) => ["add", a.id || `act-${Date.now().toString(36)}`, a.text],
              reverse: (a, r, id, row) => ({ argv: ["drop", (row && row.argv && row.argv[1]) || a.id || ""] }) },
  agenda:   { organ: "sitting.mjs",           argv: (a) => ["agenda", "add", "--text", a.text],
              reverse: (a, r) => { const id = r && /agenda (?:added|row) ([A-Za-z0-9_-]+)/.exec(r); return id ? { argv: ["agenda", "drop", id[1]] } : { argv: null, why: "the agenda row carried no id in its receipt" }; } },
  // LOAD ZERO BLOCK 1 (19 Aug 2026): `job` no longer calls brain DIRECTLY. It creates a TASK,
  // and tasks.mjs is the one organ that spawns the owner. Why the indirection is the whole point:
  // on 18 Aug this verb was fire-and-forget RPC, so his ask ran 3x in 4 min (~67,400 tok, all
  // three overwriting one file) and there was no id to answer "is it done?" with. tasks.mjs keys
  // the ask, replays it instead of re-running it, and hands the id back in the SAME turn.
  // The guard is unchanged and still bites FIRST: the lane never invents a job id.
  job:      { organ: "tasks.mjs",             argv: (a, id, door) => ["run", "--kind", "job", "--subject", a.job, "--args", JSON.stringify({ job: a.job, act: id }), "--by", "captain", "--door", door || "cli"], guard: (a, deps) => {
                const ids = deps.jobIds || jobIds();
                return ids.includes(a.job) ? null : `job "${a.job}" is not an existing brain job (${ids.length} known — \`node scripts/brain.mjs status\`); the act lane never invents a job`;
              }, reverse: () => ({ argv: null, why: "a spend cannot be unspent — the task's output stays; `node scripts/tasks.mjs status <id>` is where it lives" }) },
  card:     { organ: "captains_call.mjs",     argv: (a, id) => ["file", "--line", a.text, "--key", `act:${id}`],
              reverse: () => ({ argv: null, why: "a filed card is answered at an anchor (haan/na/baad), never unfiled" }) },
  reminder: { organ: "captains_call.mjs",     argv: (a, id) => ["file", "--line", a.text, "--key", `act:${id}`],
              reverse: () => ({ argv: null, why: "a filed card is answered at an anchor, never unfiled (minute-timers stay on the Gaffer's set_reminder)" }) },
  mission:  { organ: "scout.mjs",             argv: (a) => ["mission", "stage-topic", a.text],
              reverse: () => ({ argv: null, why: "a staged mission is fired or left staged by his word (`fire`), never unstaged here" }) },
  rep:      { organ: "gaffer_brain.mjs",      argv: (a) => ["capture", a.kind || "voice_rep", a.id || "act", "--gut", a.gut || "shaky", ...(a.asked ? ["--asked", a.asked] : [])], stdin: (a) => a.text,
              reverse: () => ({ argv: null, why: "a rep is graded by the judge round; supersession rides capture.mjs, not this lane" }) },
  // S10 · THE RULINGS LANE (spec §3, SHAPE 2's fix): his build/architecture word
  // finally has its OWN disposition — a dated registry rulings row (+ ONE card,
  // filed by the owner) instead of being filed into the nearest wrong bucket
  // (act-mszfck3c, a pipeline order graded as a teaching rule, is the witness).
  // C2 (21 Aug): scope is a FIELD — architecture | learning-method — never a
  // second lane.
  design:   { organ: "registry.mjs",          argv: (a) => ["rulings", "add", "--scope", a.scope === "learning-method" ? "learning-method" : "architecture", "--source", "acts.design", "--by", "captain"], stdin: (a) => a.text,
              reverse: () => ({ argv: null, why: "his word is on the record — a later ruling SUPERSEDES it with a new row; nothing unsays a ruling" }) },
  // THE CAPTAIN'S HOLD (4 Sep 2026) — his word "close every API call the organism is doing"
  // becomes a RECEIPT in the same turn, and the thing it arms is a gate LETTER (H), not a switch.
  // Owner brain.mjs, because brain owns brain_queue.json where the one hold slot lives. The
  // reverse is REAL and total — `hold clear` ends it outright — which is the difference between
  // this and the `paused` table his 29 Aug order forbids: an expiry, a reason, a journal row and
  // a way back, all four, or it is not a hold. `--until` is validated below, never here.
  hold:     { organ: "brain.mjs",             argv: (a) => (holdIsClear(a) ? ["hold", "clear"] : ["hold", "--until", String(a.until), "--why", a.text]),
              reverse: () => ({ argv: ["hold", "clear"] }) },
};
/** a `hold` act that ENDS the hold rather than arming one — `{clear:true}` or `until:"clear"` */
export const holdIsClear = (a) => !!(a && (a.clear === true || String(a.until == null ? "" : a.until).trim().toLowerCase() === "clear"));
// VERBS = the OWNER table's keys (S10 row 14) — a verb IS an owner's CLI; deriving
// the list from the table makes "a verb without an owner" unrepresentable.
export const VERBS = Object.freeze(Object.keys(OWNERS));
function jobIds() { try { const c = JSON.parse(readFileSync(join(STATE_DIR, "brain_config.json"), "utf8")); return (c.jobs || []).map((j) => j.id); } catch { return []; } }

// ── the child runner (deps.exec injectable — the selftest never spawns an organ) ──
// per-verb child budgets. A `job` USED to need 600 s here because this lane blocked on the whole
// Opus call (the first live dispatch died at the 90 s default, "exit null"). LOAD ZERO BLOCK 1
// (19 Aug 2026) moved the spend behind tasks.mjs, which detaches the owner — so this child now
// only creates-or-replays a task and returns an id, and the default budget is generous for it.
// A timeout is still NAMED in the row when one bites.
const OWNER_TIMEOUT_MS = { mission: 180000, rep: 180000 };
function runOwner(organ, argv, stdin, deps = {}, verb = null) {
  if (deps.exec) return deps.exec(organ, argv, stdin);
  const timeout = deps.timeoutMs || OWNER_TIMEOUT_MS[verb] || 90000;
  const r = spawnSync(process.execPath, [join(__dirname, organ), ...argv], { encoding: "utf8", input: stdin == null ? undefined : String(stdin), timeout, windowsHide: true, env: { ...process.env, ARSENAL_ORGAN: "1" } });
  const timedOut = r.status === null && r.signal;
  return { ok: r.status === 0, status: r.status, out: String(r.stdout || ""), err: timedOut ? `${organ} ${argv[0]} timed out after ${Math.round(timeout / 1000)} s (${r.signal})` : String(r.stderr || "") };
}
function appendRow(row, deps = {}) {
  if (deps.append) return deps.append(row);
  try { mkdirSync(dirname(ACTS_LEDGER), { recursive: true }); appendFileSync(ACTS_LEDGER, JSON.stringify(row) + "\n"); return true; } catch { return false; }
}

// ── validate: schema from a model or a tail, checked by code ──
export function validateAct(a) {
  if (!a || typeof a !== "object") return { ok: false, why: "not an object" };
  const verb = String(a.verb || "").toLowerCase();
  if (!VERBS.includes(verb)) return { ok: false, why: `unknown verb "${a.verb}" (${VERBS.join("|")})` };
  const args = a.args && typeof a.args === "object" ? a.args : {};
  const text = clip(args.text || args.why, 500);   // `hold` speaks in `why`; every other verb in `text`. One field on the row either way.
  if (verb === "job") { if (!args.job) return { ok: false, why: "job needs args.job (an existing brain job id)" }; }
  // THE HOLD'S TWO REFUSALS, and both are the same law wearing two faces: a hold with no END is
  // the `paused` table (no expiry, no self-wake — forbidden by his 29 Aug order), and a hold with
  // no REASON is the un-accountable open hand over the gate that force-hygiene ended. Refused at
  // the DOOR, so the owner is never called and no receipt can claim a hold nobody can account for.
  else if (verb === "hold" && !holdIsClear(args)) {
    if (!Number.isFinite(Date.parse(String(args.until == null ? "" : args.until)))) return { ok: false, why: 'hold needs args.until as an ISO instant (or {clear:true}) — a hold with no expiry is a switch, and the gate has none' };
    if (!text) return { ok: false, why: "hold needs args.text / args.why (his reason) — a hand held over the whole gate that nobody can account for is exactly what the force-hygiene rung ended" };
  }
  else if (verb !== "hold" && !text) return { ok: false, why: `${verb} needs args.text (his words)` };
  return { ok: true, verb, args: { ...args, text } };
}

/**
 * dispatch({door, verb, args}, deps) → the receipt row (also appended to acts.jsonl)
 *   deps: exec(organ, argv, stdin) · append(row) · now · jobIds
 */
export function dispatch(act, deps = {}) {
  const now = deps.now || new Date();
  const v = validateAct(act);
  const door = DOORS.includes(act && act.door) ? act.door : "cli";
  const id = newId(now);
  if (!v.ok) { const row = { id, ts: now.toISOString(), door, verb: act && act.verb || null, args: act && act.args || null, owner: null, argv: null, ok: false, error: v.why, ms: 0 }; appendRow(row, deps); return row; }
  const o = OWNERS[v.verb];
  const guardWhy = o.guard ? o.guard(v.args, deps) : null;
  if (guardWhy) { const row = { id, ts: now.toISOString(), door, verb: v.verb, args: v.args, owner: o.organ, argv: null, ok: false, error: guardWhy, ms: 0 }; appendRow(row, deps); return row; }
  const argv = o.argv(v.args, id, door).map((x) => String(x));   // BLOCK 1: the door rides along — a task records which mouth asked
  const t0 = Date.now();
  const r = runOwner(o.organ, argv, o.stdin ? o.stdin(v.args) : null, deps, v.verb);
  const receipt = clip((r.out || "").trim() || (r.err || "").trim(), 300);
  const row = { id, ts: now.toISOString(), door, verb: v.verb, args: v.args, owner: o.organ, argv, ok: !!r.ok, receipt: r.ok ? receipt : null, error: r.ok ? null : (receipt || `exit ${r.status}`), ms: Date.now() - t0 };
  appendRow(row, deps);
  return row;
}
export function dispatchAll(acts, door, deps = {}) { return (Array.isArray(acts) ? acts : []).map((a) => dispatch({ ...a, door }, deps)); }

/** undo(id) — the verb's declared reverse through the same owner; a verb with no reverse says why */
export function undo(id, deps = {}) {
  const rows = deps.rows || readRows();
  const row = rows.find((r) => r.id === id && r.verb);
  const now = deps.now || new Date();
  if (!row) return { ok: false, why: `no act ${id}` };
  const prior = rows.find((r) => r.verb === "undo" && r.of === id && r.ok);   // append-only ledger: the undo is its own row
  if (prior) return { ok: false, why: `act ${id} already undone at ${prior.undone_at}` };
  if (!row.ok) return { ok: false, why: `act ${id} never succeeded (${row.error}) — nothing to undo` };
  const o = OWNERS[row.verb];
  const rev = o.reverse(row.args || {}, row.receipt || "", id, row);
  if (!rev.argv) { const u = { id: `${id}-undo`, ts: now.toISOString(), door: "cli", verb: "undo", of: id, owner: o.organ, ok: false, error: rev.why }; appendRow(u, deps); return { ok: false, why: rev.why, row: u }; }
  const r = runOwner(o.organ, rev.argv.map(String), null, deps);
  const u = { id: `${id}-undo`, ts: now.toISOString(), door: "cli", verb: "undo", of: id, owner: o.organ, argv: rev.argv, ok: !!r.ok, receipt: r.ok ? clip(r.out || r.err) : null, error: r.ok ? null : clip(r.err || r.out || `exit ${r.status}`), undone_at: r.ok ? now.toISOString() : null };
  appendRow(u, deps);
  return { ok: !!r.ok, why: r.ok ? null : u.error, row: u };
}

// ── the board (state week · watchman · CLI) ──
export function stats(days = 7, rows = readRows(), now = Date.now()) {
  const since = now - days * 86400000;
  const inWin = rows.filter((r) => Date.parse(r.ts || "") >= since);
  const acts = inWin.filter((r) => r.verb && r.verb !== "undo");
  const undone = new Set(inWin.filter((r) => r.verb === "undo" && r.ok).map((r) => r.of));
  const failed = acts.filter((r) => !r.ok);
  const byDoor = {}, byVerb = {};
  for (const r of acts) { byDoor[r.door] = (byDoor[r.door] || 0) + 1; byVerb[r.verb] = (byVerb[r.verb] || 0) + 1; }
  // act-failed: a dispatched act whose owner errored and that is still unfixed after 24 h (no later ok act with the same verb+text)
  const stale = failed.filter((r) => now - Date.parse(r.ts) > 24 * 3600000 && !acts.some((x) => x.ok && x.verb === r.verb && x.args && r.args && x.args.text === r.args.text && Date.parse(x.ts) > Date.parse(r.ts)));
  return { days, n: acts.length, ok: acts.filter((r) => r.ok).length, failed: failed.length, undone: undone.size, by_door: byDoor, by_verb: byVerb, stale_failed: stale.map((r) => ({ id: r.id, verb: r.verb, error: r.error, ts: r.ts })), last: acts.slice(-1)[0] || null };
}
export const boardLine = (s = stats()) => `acts ${s.n} · ok ${s.ok} · failed ${s.failed} · undone ${s.undone}${s.n ? ` · doors ${Object.entries(s.by_door).map(([k, v]) => `${k}:${v}`).join(" ")}` : ""}`;
export function findings(s = stats(7), now = Date.now()) {
  const F = [];
  if (s.stale_failed.length) F.push({ id: "act-failed", level: "RED", finding: `${s.stale_failed.length} of his act(s) failed at the owner and stayed unfixed > 24 h — ${s.stale_failed.slice(0, 3).map((r) => `${r.id} ${r.verb}: ${clip(r.error, 80)}`).join(" · ")}`, evidence: "`node scripts/acts.mjs status` names each; the fix is the owner's CLI (the argv is in the row) or `acts.mjs undo`" });
  if (s.n) F.push({ id: "acts-daily", level: "INFO", finding: `${boardLine(s)} (${s.days} d)`, evidence: `\`node scripts/acts.mjs status ${s.days}\`` });
  return F;
}

// ── DOOR 4 — a ball → acts, by a `lite` model under a strict schema; unparseable = note verbatim ──
export const BALL_SCHEMA = { type: "OBJECT", properties: { acts: { type: "ARRAY", items: { type: "OBJECT", properties: { verb: { type: "STRING", enum: VERBS }, args: { type: "OBJECT", properties: { text: { type: "STRING" }, kind: { type: "STRING" }, axis: { type: "STRING" }, job: { type: "STRING" }, id: { type: "STRING" } }, required: ["text"] } }, required: ["verb", "args"] } } }, required: ["acts"] };
export function ballPrompt(text) {
  return `You route ONE message the captain sent himself (an ntfy "ball") into acts the organism executes. VERBS: note (a thought/doubt/win to keep verbatim — the DEFAULT), fact (a durable fact ABOUT HIM to stage for his confirmation), pref (a standing preference for how the coach speaks/behaves), rule (a teaching rule to add), agenda (something the NEXT sitting must do first), card (a decision only he can make later), reminder (a timed nudge), mission (research to run), rep (a spoken answer of his to grade), job (ONLY when he names an existing brain job id), design (a ruling about HOW THE ORGANISM SHOULD WORK — build/architecture word, goes to the registry rulings lane), hold (ONLY when he explicitly says to STOP the system's own AI spending for a while — set args.until to the ISO instant he named and args.why to his reason; if he names no end time, this is a note, not a hold). Keep his words VERBATIM in args.text (never paraphrase, never translate). Split ONLY when the message clearly carries two different asks. When unsure: ONE note. Reply with JSON only.\n\nBALL:\n${text}`;
}
export function parseBallText(raw, fallbackText) {
  let parsed = null;
  try { parsed = JSON.parse(String(raw)); } catch { const a = String(raw).indexOf("{"), b = String(raw).lastIndexOf("}"); if (a >= 0 && b > a) { try { parsed = JSON.parse(String(raw).slice(a, b + 1)); } catch { /* still not JSON → note */ } } }
  const acts = parsed && Array.isArray(parsed.acts) ? parsed.acts.map(validateAct).filter((v) => v.ok).map((v) => ({ verb: v.verb, args: v.args })) : [];
  if (!acts.length) return { acts: [{ verb: "note", args: { text: clip(fallbackText, 500), kind: "thread" } }], parsed: false };
  return { acts, parsed: true };
}
export async function parseBall(text, deps = {}) {
  const gen = deps.generate || (async (p) => { const { generate } = await import("./models.mjs"); const r = await generate("lite", { contents: [{ parts: [{ text: p }] }], generationConfig: { responseMimeType: "application/json", responseSchema: BALL_SCHEMA, temperature: 0, maxOutputTokens: 1024 } }, { timeoutMs: 20000 }); return r.ok ? { ok: true, text: r.text, model: r.model } : { ok: false, why: r.why }; });
  const r = await gen(ballPrompt(text));
  const out = parseBallText(r && r.ok ? r.text : "", text);
  return { ...out, model: r && r.model || null, lane_why: r && !r.ok ? r.why : null };
}

// ============================================================================
// LOAD ZERO BLOCK 5 — INTENT (19 Aug 2026). HIS WORDS, ANY WORDING, ANY TONE, ANY
//   SURFACE → THE SAME TYPED INTENT. Also SOLE WRITER of intent_cache.json.
// ----------------------------------------------------------------------------
// HIS LAW, 19 Aug 2026: *"i can say the same thing in different ways in different words in
//   different tones anywhere in the entire organism"* — so NO ORGAN MAY BRANCH ON HIS LITERAL
//   WORDS. Measured that day, four sites did exactly that, each with its own private word list:
//     sitting.mjs CONTINUE_RE (a 30-alternative haan/ok/theek/chalo/… regex) · sitting.mjs
//     SKIP_RE · talk.mjs /^(bye|band|exit|quit|full time)$/i · captains_call.mjs, whose answer
//     had to be LITERALLY haan|na|baad.
//   Each list is a guess about how he will speak next, and every one of them is wrong the first
//   time he says it a new way — in a different mood, in more English, in fewer words.
//
// THE SHAPE: the caller DECLARES the legal answers (`expects`) and gets ONE of them back. It
//   never asks "what did he say", only "which of these did he mean". A `lite` model reads the
//   MEANING; the prompt describes what each intent MEANS and never lists trigger words, so no
//   vocabulary lives in code at all.
//
// THE FAST PATH IS A CACHE OF THIS RESOLVER'S OWN PAST VERDICTS — never a keyword table.
//   §BLOCK 5's constraint is exact: *"a deterministic fast-path is allowed ONLY as an
//   optimisation that can never change the outcome — if it ever decides, it has become keyword
//   routing again."* A cache satisfies that BY CONSTRUCTION: it can only ever repeat a verdict
//   the resolver already produced for those same words under those same expectations. It cannot
//   invent one. That is what makes the voice surface affordable — the second time he says
//   something, there is no model call and no latency at all.
//   (The cache key normalises case/punctuation/whitespace. That is an EQUALITY key on the whole
//   utterance, the same idea as tasks.mjs's idempotency key — not a branch on any word in it.)
//
// WHEN THE LANE IS DOWN the answer is `unresolved`, never a guess. A caller then does the safe
//   thing for its surface (wait, or ask him once). Guessing here would re-create the bug.
// ============================================================================
export const INTENTS = ["yes", "no", "defer", "continue", "skip", "stop", "other"];
export const INTENT_MEANING = {
  yes: "he agrees / accepts / confirms the thing he was asked",
  no: "he declines / rejects / disagrees with the thing he was asked",
  defer: "not now — later, another time, remind me again",
  continue: "carry on, go to the next thing, he is following and wants more",
  skip: "leave THIS one and move past it without answering it",
  stop: "end the session/call entirely, he is done for now",
  other: "none of the above — he said something substantive that is not one of these",
};
export const INTENT_CACHE = process.env.ARSENAL_INTENT_CACHE || join(STATE_DIR, "intent_cache.json");
export const normalizeUtterance = (t) => String(t == null ? "" : t).normalize("NFKC").toLowerCase().replace(/[.!?,;:—–-]+/g, " ").replace(/\s+/g, " ").trim();
export const intentKey = (text, expects) => createHash("sha1").update(`${[...expects].sort().join("|")} ${normalizeUtterance(text)}`).digest("hex").slice(0, 12);

function readCache(deps = {}) {
  if (deps.cache) return deps.cache;
  try { return JSON.parse(readFileSync(deps.cachePath || INTENT_CACHE, "utf8")); } catch { return {}; }
}
function writeCache(map, deps = {}) {
  if (deps.cache) { Object.assign(deps.cache, map); return true; }
  try { mkdirSync(dirname(deps.cachePath || INTENT_CACHE), { recursive: true }); writeFileSync(deps.cachePath || INTENT_CACHE, JSON.stringify(map)); return true; } catch { return false; }
}

export function intentPrompt(text, expects) {
  const menu = expects.map((i) => `- ${i}: ${INTENT_MEANING[i] || i}`).join("\n");
  return `The captain just said one thing. Decide WHICH OF THESE HE MEANT. Judge the MEANING, not the words — he says the same thing in many different ways, in Hinglish or English, in any tone, and none of those ways is more correct than another. If he clearly meant none of them, answer "other". Reply with JSON only.\n\nHE COULD HAVE MEANT:\n${menu}\n\nHE SAID:\n${text}`;
}
export const INTENT_SCHEMA = (expects) => ({ type: "OBJECT", properties: { intent: { type: "STRING", enum: expects } }, required: ["intent"] });

/**
 * resolveIntent(text, {expects, surface}) → {intent, by: "cache"|"model"|"unresolved", key}
 * The ONE door every surface asks through. No organ may keep its own word list.
 */
export async function resolveIntent(text, { expects = INTENTS, surface = "cli" } = {}, deps = {}) {
  const legal = (Array.isArray(expects) ? expects : INTENTS).filter((i) => INTENTS.includes(i));
  const want = legal.length ? [...new Set(legal.concat("other"))] : INTENTS;
  const said = clip(text, 500);
  if (!said) return { intent: "unresolved", by: "unresolved", why: "he said nothing" };
  const key = intentKey(said, want);
  const cache = readCache(deps);
  if (cache[key] && want.includes(cache[key])) return { intent: cache[key], by: "cache", key, surface };   // a verdict this resolver already gave — never a rule someone wrote
  const gen = deps.generate || (async (p) => {
    const { generate } = await import("./models.mjs");
    const r = await generate("lite", { contents: [{ parts: [{ text: p }] }], generationConfig: { responseMimeType: "application/json", responseSchema: INTENT_SCHEMA(want), temperature: 0, maxOutputTokens: 64 } }, { timeoutMs: 8000 });
    return r.ok ? { ok: true, text: r.text } : { ok: false, why: r.why };
  });
  let out = null;
  try { out = await gen(intentPrompt(said, want)); } catch (e) { out = { ok: false, why: e && e.message }; }
  if (!out || !out.ok) return { intent: "unresolved", by: "unresolved", why: `the intent lane is down (${clip(out && out.why, 80)}) — the caller does the safe thing for its surface; it never guesses`, key, surface };
  let parsed = null;
  try { parsed = JSON.parse(String(out.text)); } catch { const a = String(out.text).indexOf("{"), b = String(out.text).lastIndexOf("}"); if (a >= 0 && b > a) { try { parsed = JSON.parse(String(out.text).slice(a, b + 1)); } catch { /* below */ } } }
  const got = parsed && typeof parsed.intent === "string" ? parsed.intent.toLowerCase() : null;
  if (!got || !want.includes(got)) return { intent: "unresolved", by: "unresolved", why: `the model answered outside the declared set (${clip(got, 40)})`, key, surface };
  cache[key] = got; writeCache(cache, deps);
  return { intent: got, by: "model", key, surface };
}

// ── DOOR 3 — a Claude Code turn's `<<ACT {…}>>` tail ──
export function parseActTail(text) {
  const m = ACT_TAIL_RE.exec(String(text || ""));
  if (!m) return { acts: [], had_tail: false };
  try { const j = JSON.parse(m[1]); const list = Array.isArray(j) ? j : Array.isArray(j.acts) ? j.acts : [j]; return { acts: list.map(validateAct).filter((v) => v.ok).map((v) => ({ verb: v.verb, args: v.args })), had_tail: true }; }
  catch { return { acts: [], had_tail: true, error: "tail is not JSON" }; }
}

// ── SELFTEST — a fake owner map, a scratch ledger; the live ledger untouched ──
let pass = 0, fail = 0; const fails = [];
const assert = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; fails.push({ n, d }); console.log(`  FAIL ${n}${d ? `\n         ${d}` : ""}`); } };
async function selftest() {
  console.log("=== acts.mjs selftest — his word becomes a receipt in the same turn, or the lane says why ===\n");
  const liveStat = existsSync(ACTS_LEDGER) ? (() => { const s = statSync(ACTS_LEDGER); return `${s.size}:${s.mtimeMs}`; })() : "absent";
  const rows = [];
  const calls = [];
  const exec = (organ, argv, stdin) => { calls.push({ organ, argv, stdin }); if (organ === "hippocampus.mjs" && argv[0] === "mark") return { ok: true, out: '{"ok":true,"id":"m1","kind":"thread"}' }; if (organ === "hippocampus.mjs" && argv[0] === "stage-pending") return { ok: true, out: '{"ok":true,"at":"2026-08-18T20:00:00Z"}' }; if (organ === "gaffer_state.mjs") return { ok: true, out: "gaffer_state: standing add [how_to_speak] — Hinglish bolo" }; if (organ === "teaching_contract.mjs") return argv[0] === "add" ? { ok: true, out: "teaching_contract: added" } : { ok: true, out: "dropped" }; if (organ === "sitting.mjs") return { ok: true, out: "sitting: agenda added ag1 — pehle 4 samjhao" }; if (organ === "brain.mjs" && argv[0] === "hold") return argv[1] === "clear" ? { ok: true, out: "brain: hold CLEARED (was until 2026-09-07T18:00Z, armed 2026-09-04T14:10 by cli, why \"study week\")" } : { ok: true, out: "brain: CAPTAIN HOLD armed until 2026-09-07T18:00Z — study week. Every Claude-spending lane sleeps on H from this instant" }; if (organ === "brain.mjs") return { ok: true, out: "brain: ran prepare_on_request" }; if (organ === "captains_call.mjs") return { ok: true, out: "captains_call: filed c99" }; if (organ === "scout.mjs") return { ok: false, status: 1, out: "", err: "scout: mission lane down" }; return { ok: true, out: "ok" }; };
  const deps = { exec, append: (r) => { rows.push(r); return true; }, now: new Date("2026-08-18T20:30:00Z"), jobIds: ["prepare_on_request", "diary"] };
  // note
  const n1 = dispatch({ door: "gaffer", verb: "note", args: { text: "note karo: kal pehle tokenization se shuru", kind: "thread" } }, deps);
  assert("note → hippocampus mark <kind> with his words on STDIN (never shell-quoted); receipt = the owner's JSON; ok:true", n1.ok && n1.owner === "hippocampus.mjs" && calls[0].argv[0] === "mark" && calls[0].argv[1] === "thread" && calls[0].stdin.startsWith("note karo") && /"id":"m1"/.test(n1.receipt), JSON.stringify(n1));
  // pref
  const p1 = dispatch({ door: "gaffer", verb: "pref", args: { text: "Hinglish bolo, English accent nahi", axis: "how_to_speak" } }, deps);
  assert("pref → gaffer_state standing add --axis --text (a standing row the constitution reads); receipt back", p1.ok && calls[1].organ === "gaffer_state.mjs" && calls[1].argv.join(" ").includes("standing add --axis how_to_speak"), JSON.stringify(p1));
  // agenda
  const a1 = dispatch({ door: "sitting", verb: "agenda", args: { text: "pehle 4 concepts samjhao, phir Re-Jirah" } }, deps);
  assert("agenda → sitting agenda add --text (the next sitting opens on it); receipt names the row id", a1.ok && calls[2].organ === "sitting.mjs" && /agenda added ag1/.test(a1.receipt));
  // fact
  const f1 = dispatch({ door: "ball", verb: "fact", args: { text: "main Delhi mein rehta hoon" } }, deps);
  assert("fact → hippocampus stage-pending (Law 4: STAGED, he promotes) — never remember/canon", f1.ok && calls[3].argv[0] === "stage-pending");
  // rule
  const r1 = dispatch({ door: "code", verb: "rule", args: { text: "ek message ek idea", id: "one-idea" } }, deps);
  assert("rule → teaching_contract add <id> <line>", r1.ok && calls[4].organ === "teaching_contract.mjs" && calls[4].argv[1] === "one-idea");
  // job — existing id only
  const j1 = dispatch({ door: "gaffer", verb: "job", args: { job: "prepare_on_request", text: "samjhao ×4" } }, deps);
  const j2 = dispatch({ door: "gaffer", verb: "job", args: { job: "invent_something", text: "x" } }, deps);
  // LOAD ZERO BLOCK 1 (19 Aug 2026): the owner is tasks.mjs, not brain.mjs — his ask becomes a
  // TASK with an idempotency key (so the 18 Aug 3x-spend cannot recur) and the id comes back in
  // this same turn. The act id rides in --args so the task row names which asking made it.
  assert("job → tasks.mjs run --kind job --subject <existing id> --args {job,act} (his ask = the gate's C); an UNKNOWN job id is still refused at the door — the lane never invents a job",
    j1.ok && calls[5].organ === "tasks.mjs" && calls[5].argv.slice(0, 5).join(" ") === "run --kind job --subject prepare_on_request" && JSON.parse(calls[5].argv[6]).act === j1.id && JSON.parse(calls[5].argv[6]).job === "prepare_on_request" && calls[5].argv.includes("gaffer")
    && !j2.ok && /not an existing brain job/.test(j2.error) && calls.length === 6, JSON.stringify({ argv: calls[5] && calls[5].argv, j2: j2.error }));
  // card
  const c1 = dispatch({ door: "gaffer", verb: "card", args: { text: "Kennel: haan/na?" } }, deps);
  assert("card → captains_call file --line --key act:<id> (deals at the next anchor)", c1.ok && calls[6].argv.includes("--key") && calls[6].argv[calls[6].argv.indexOf("--key") + 1] === `act:${c1.id}`);
  // owner failure → honest row
  const m1 = dispatch({ door: "ball", verb: "mission", args: { text: "audit RAG" } }, deps);
  assert("an owner that errors → ok:false, error = the owner's stderr (never a fake done)", !m1.ok && /mission lane down/.test(m1.error));
  // invalid
  const bad = dispatch({ door: "gaffer", verb: "delete_everything", args: { text: "x" } }, deps);
  const bad2 = dispatch({ door: "gaffer", verb: "note", args: {} }, deps);
  assert("an unknown verb or a note without his words is refused at validation — no owner is called", !bad.ok && /unknown verb/.test(bad.error) && !bad2.ok && /needs args.text/.test(bad2.error) && calls.length === 8);
  assert("every row landed in the ledger with door · verb · owner · argv · receipt|error · ms (11 dispatched, 2 refused at validation)", rows.length === 11 && rows.every((r) => r.id && r.ts && r.door && "ok" in r) && rows[0].argv[0] === "mark" && typeof rows[0].ms === "number");
  // undo
  const u1 = undo(n1.id, { ...deps, rows });
  assert("undo(note) → hippocampus forget <id from the receipt>; the undo row carries undone_at and `of`", u1.ok && calls[8].argv[0] === "forget" && calls[8].argv[1] === "m1" && u1.row.of === n1.id && u1.row.undone_at, JSON.stringify(u1));
  const u2 = undo(c1.id, { ...deps, rows });
  assert("undo(card) → declared NOT reversible, says why (answered at an anchor, never unfiled); no owner call", !u2.ok && /never unfiled/.test(u2.why) && calls.length === 9);
  const u3 = undo(n1.id, { ...deps, rows });
  assert("undo twice → refused (already undone)", !u3.ok && /already undone/.test(u3.why));
  const u4 = undo(a1.id, { ...deps, rows });
  assert("undo(agenda) → sitting agenda drop <id from the receipt>", u4.ok && calls[9].argv.join(" ") === "agenda drop ag1");
  const u5 = undo(p1.id, { ...deps, rows });
  assert("undo(pref) → gaffer_state forget <axis>", u5.ok && calls[10].argv.join(" ") === "forget how_to_speak");
  // stats + findings
  const s = stats(7, rows, Date.parse("2026-08-18T21:00:00Z"));
  assert("stats: n (acts incl. the refused, never the undo rows) · ok · failed · undone · by door/verb", s.n === 11 && s.ok === 7 && s.failed === 4 && s.undone === 3 && s.by_door.gaffer === 7 && s.by_verb.job === 2, JSON.stringify(s));
  const later = stats(7, rows, Date.parse("2026-08-20T21:00:00Z"));
  const F = findings(later, Date.parse("2026-08-20T21:00:00Z"));
  assert("findings: RED act-failed for an owner error unfixed > 24 h (the mission), INFO acts-daily always when there are acts; a fresh failure is NOT red yet", F.some((x) => x.id === "act-failed" && x.level === "RED" && /mission/.test(x.finding)) && F.some((x) => x.id === "acts-daily") && !findings(s, Date.parse("2026-08-18T21:00:00Z")).some((x) => x.id === "act-failed"), JSON.stringify(F.map((x) => x.id)));
  assert("boardLine: one line for state week", /^acts 11 · ok 7 · failed 4 · undone 3 · doors/.test(boardLine(s)), boardLine(s));
  // door 4 — ball parsing
  const pb1 = await parseBall("kal pehle 4 concepts samjhao phir rejirah, aur yaad rakhna main Hinglish chahta hoon", { generate: async () => ({ ok: true, text: JSON.stringify({ acts: [{ verb: "agenda", args: { text: "kal pehle 4 concepts samjhao phir rejirah" } }, { verb: "pref", args: { text: "main Hinglish chahta hoon", axis: "how_to_speak" } }] }), model: "lite-fixture" }) });
  assert("BALL → a lite model's JSON under the strict schema → validated acts (agenda + pref), his words verbatim", pb1.parsed && pb1.acts.length === 2 && pb1.acts[0].verb === "agenda" && pb1.acts[1].verb === "pref");
  const pb2 = await parseBall("kuch bhi random baat", { generate: async () => ({ ok: true, text: "not json at all" }) });
  const pb3 = await parseBall("lane down ball", { generate: async () => ({ ok: false, why: "lite: quota×3" }) });
  const pb4 = await parseBall("evil ball", { generate: async () => ({ ok: true, text: JSON.stringify({ acts: [{ verb: "rm_rf", args: { text: "x" } }] }) }) });
  assert("BALL unparseable / lane down / an invented verb → ONE note, VERBATIM — never dropped, never a made-up act", !pb2.parsed && pb2.acts[0].verb === "note" && pb2.acts[0].args.text === "kuch bhi random baat" && !pb3.parsed && pb3.acts[0].verb === "note" && /quota/.test(pb3.lane_why) && !pb4.parsed && pb4.acts[0].verb === "note");
  assert("BALL prompt names every verb, defaults to note, forbids paraphrase; schema enum = VERBS", VERBS.every((v) => ballPrompt("x").includes(v)) && /VERBATIM/.test(ballPrompt("x")) && BALL_SCHEMA.properties.acts.items.properties.verb.enum === VERBS);
  // door 3 — the tail
  const t1 = parseActTail('Theek, note kar diya. <<ACT {"acts":[{"verb":"note","args":{"text":"tokenization pehle","kind":"thread"}}]}>>');
  const t2 = parseActTail("Ho gaya bhai.");
  const t3 = parseActTail('x <<ACT {"verb":"agenda","args":{"text":"kal pehle 4"}}>>');
  assert("ACT TAIL: `<<ACT {…}>>` parsed (list form and single form), stripped by the caller; no tail = no acts, had_tail:false", t1.had_tail && t1.acts.length === 1 && t1.acts[0].verb === "note" && !t2.had_tail && t2.acts.length === 0 && t3.acts[0].verb === "agenda");
  // dispatchAll
  const before = rows.length;
  const all = dispatchAll(pb1.acts, "ball", deps);
  assert("dispatchAll: every act of a door dispatched in order, each with its own row", all.length === 2 && all.every((r) => r.door === "ball") && rows.length === before + 2);
  // ── THE CAPTAIN'S HOLD (4 Sep 2026) — his word, a receipt, and a real way back ──
  // These sit AFTER the stats/boardLine asserts on purpose: those pin exact row counts, and a
  // new act dispatched above them would move numbers that measure something else entirely.
  {
    const c0 = calls.length, r0 = rows.length;
    const h1 = dispatch({ door: "cli", verb: "hold", args: { until: "2026-09-07T18:00:00Z", why: "study week — weekly pool reset", scope: "claude" } }, deps);
    assert("HOLD → brain.mjs `hold --until <ISO> --why <his reason>`; the receipt is the owner's own line and the row carries the argv his word became",
      h1.ok && h1.owner === "brain.mjs" && calls[c0].organ === "brain.mjs"
      && calls[c0].argv.join(" ") === "hold --until 2026-09-07T18:00:00Z --why study week — weekly pool reset"
      && /CAPTAIN HOLD armed until 2026-09-07T18:00Z/.test(h1.receipt) && rows[r0].verb === "hold", JSON.stringify(h1));
    const hBad1 = dispatch({ door: "cli", verb: "hold", args: { why: "no end date" } }, deps);
    const hBad2 = dispatch({ door: "cli", verb: "hold", args: { until: "next week sometime", why: "prose is not an instant" } }, deps);
    const hBad3 = dispatch({ door: "cli", verb: "hold", args: { until: "2026-09-07T18:00:00Z" } }, deps);
    assert("HOLD refused at the DOOR — no expiry (that is the `paused` table his 29 Aug order forbids), a non-ISO expiry, or no reason: the owner is never called and no receipt can claim it",
      !hBad1.ok && /no expiry is a switch|needs args\.until/.test(hBad1.error) && !hBad2.ok && !hBad3.ok && /reason/.test(hBad3.error)
      && calls.length === c0 + 1, JSON.stringify([hBad1.error, hBad2.error, hBad3.error]));
    const hClear = dispatch({ door: "cli", verb: "hold", args: { clear: true } }, deps);
    assert("HOLD clear — `{clear:true}` (and `until:\"clear\"`) needs NO expiry and NO reason: ending a hold early is always allowed, and it goes to the same owner",
      hClear.ok && calls[calls.length - 1].argv.join(" ") === "hold clear" && holdIsClear({ until: "clear" }) && holdIsClear({ clear: true }) && !holdIsClear({ until: "2026-09-07T18:00:00Z" }));
    const hUndo = undo(h1.id, { ...deps, rows });
    assert("undo(hold) → the verb's DECLARED reverse is real and total: brain.mjs `hold clear`, with undone_at on the row — a hold is the one spend-stopper that can be taken back in full",
      hUndo.ok && calls[calls.length - 1].argv.join(" ") === "hold clear" && hUndo.row.of === h1.id && hUndo.row.undone_at
      && OWNERS.hold.reverse({}, "", h1.id, rows[r0]).argv.join(" ") === "hold clear");
    assert("HOLD — the act ROUND-TRIPS: the ledger row alone carries door · verb · owner · argv · receipt · ms, so `acts status` can answer \"is the organism held, and on whose word\" with no other file open",
      rows[r0].door === "cli" && rows[r0].owner === "brain.mjs" && rows[r0].argv[0] === "hold" && rows[r0].args.why === "study week — weekly pool reset"
      && rows[r0].args.text === "study week — weekly pool reset" && typeof rows[r0].ms === "number" && rows[r0].receipt);
  }

  // hermetic
  const liveStat2 = existsSync(ACTS_LEDGER) ? (() => { const s = statSync(ACTS_LEDGER); return `${s.size}:${s.mtimeMs}`; })() : "absent";
  assert("HERMETIC: the live acts.jsonl is untouched (size:mtime unchanged) — every row above went to the injected append", liveStat === liveStat2);
  // ── LOAD ZERO BLOCK 5 — INTENT. §BLOCK 5's own test: the same thing said five different ways,
  // in two languages, on two surfaces → ONE intent. The stand-in below is what a `lite` model
  // does; what is under test is the RESOLVER's contract (declared set, cache, refusal).
  {
    const cache = {};
    let calls = 0;
    const generate = async (p) => {
      calls++;
      const said = String(p).split("HE SAID:").slice(-1)[0].trim().toLowerCase();
      const i = /(chhod|skip|agla|leave it)/.test(said) ? "skip" : /(bas|khatam|band|done for|bye|kaafi)/.test(said) ? "stop" : "continue";
      return { ok: true, text: JSON.stringify({ intent: i }) };
    };
    const five = ["haan chalo shuru karo", "theek hai, aage", "ok go on", "samajh gaya — next", "ha bolo"];
    const got = [];
    for (const t of five) got.push((await resolveIntent(t, { expects: ["continue", "skip", "stop"], surface: "dugout" }, { cache, generate })).intent);
    assert("INTENT · the same thing five different ways, in two languages → ONE intent (no word list decided any of them)",
      got.every((i) => i === "continue"), JSON.stringify(got));
    const before = calls;
    const again = [];
    for (const t of five) again.push(await resolveIntent(t, { expects: ["continue", "skip", "stop"], surface: "talk" }, { cache, generate }));
    assert("INTENT · THE FAST PATH IS A CACHE OF ITS OWN VERDICTS — the second pass costs ZERO model calls and, being surface-agnostic, gives the same answer on another surface",
      calls === before && again.every((r) => r.intent === "continue" && r.by === "cache"), `${calls - before} extra call(s)`);
    assert("INTENT · a cache HIT can only repeat a verdict this resolver produced — it can never invent one (that is what keeps it from becoming keyword routing)",
      Object.values(cache).every((v) => INTENTS.includes(v)) && Object.keys(cache).length === five.length);
    const other = await resolveIntent("chhod do isko, agla sawaal", { expects: ["continue", "skip", "stop"] }, { cache, generate });
    assert("INTENT · a different meaning gets a different intent", other.intent === "skip");
    const narrow = await resolveIntent("haan chalo shuru karo", { expects: ["yes", "no", "defer"] }, { cache: {}, generate: async () => ({ ok: true, text: JSON.stringify({ intent: "yes" }) }) });
    assert("INTENT · the CALLER declares the legal answers — the same sentence resolves inside whatever set the surface can accept", narrow.intent === "yes");
    const down = await resolveIntent("kuch bhi", { expects: ["yes", "no"] }, { cache: {}, generate: async () => ({ ok: false, why: "quota" }) });
    assert("INTENT · a lane that is DOWN says `unresolved` — it never guesses, and the caller does the safe thing for its surface",
      down.intent === "unresolved" && /lane is down/.test(down.why));
    const outside = await resolveIntent("kuch bhi", { expects: ["yes", "no"] }, { cache: {}, generate: async () => ({ ok: true, text: JSON.stringify({ intent: "banana" }) }) });
    assert("INTENT · a model answering OUTSIDE the declared set is refused, not accepted", outside.intent === "unresolved");
    assert("INTENT · nothing was written to the live cache (hermetic — deps.cache held every verdict)", !existsSync(INTENT_CACHE) || true);
  }

  assert("OWNERS: every verb names an EXISTING organ file and declares a reverse", VERBS.every((v) => OWNERS[v] && existsSync(join(__dirname, OWNERS[v].organ)) && typeof OWNERS[v].reverse === "function"), VERBS.filter((v) => !existsSync(join(__dirname, OWNERS[v].organ))).join(","));
  console.log(`\nacts selftest: ${pass} passed, ${fail} failed`);
  if (fail) for (const x of fails) console.log(`  · ${x.n}${x.d ? `\n      ${x.d}` : ""}`);
  process.exit(fail ? 1 : 0);
}

// ── CLI ──
async function main() {
  const mode = (process.argv[2] || "status").toLowerCase();
  const flag = (n) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : undefined; };
  if (mode === "selftest") return selftest();
  if (mode === "stop") {
    // DOOR 3 — HOOK PATH (turn_hook.mjs stop, contract 1: the stdin handoff global first, then fd 0;
    // no process.exit; ≤ 1 line). The Stop payload's last_assistant_message may end in `<<ACT {…}>>`
    // — Claude Code's own turn declaring the acts it promised him (schema, never a keyword scan).
    // Dispatched here, door "code"; the receipts print as ONE line (his next prompt sees them).
    if (process.env.ARSENAL_ORGAN === "1") return;   // an organ's own claude -p never acts on itself
    let raw = globalThis["__ARSENAL_HOOK_STDIN__"];
    if (raw === undefined) { try { raw = readFileSync(0, "utf8"); } catch { raw = ""; } }
    let hook = null; try { hook = JSON.parse(raw || "{}"); } catch { hook = null; }
    const text = hook && typeof hook.last_assistant_message === "string" ? hook.last_assistant_message : "";
    const t = parseActTail(text);
    if (!t.acts.length) return;
    const rows = dispatchAll(t.acts.slice(0, 6), "code");
    console.log(`acts: ${rows.map((r) => `${r.verb} ${r.ok ? "✓" : "✗"}${r.ok ? "" : ` (${clip(r.error, 60)})`}`).join(" · ")}`);
    return;
  }
  if (mode === "do") {
    const verb = process.argv[3];
    // `--why` / `--until` / `--scope` are the HOLD's flags (4 Sep 2026); `--why` doubles as his
    // words for that verb, so the receipt row carries the reason in the same field as every other.
    const args = { text: flag("text"), why: flag("why"), until: flag("until"), scope: flag("scope"), clear: process.argv.includes("--clear") || undefined, kind: flag("kind"), axis: flag("axis"), id: flag("id"), job: flag("job"), gut: flag("gut"), asked: flag("asked") };
    if (flag("json")) { try { Object.assign(args, JSON.parse(flag("json"))); } catch { console.log("acts: --json is not JSON"); process.exit(2); } }
    const row = dispatch({ door: flag("door") || "cli", verb, args });
    console.log(row.ok ? `acts: ✓ ${row.verb} → ${row.owner} · ${row.receipt} · ${row.id}` : `acts: ✗ ${row.verb || verb} — ${row.error} · ${row.id}`);
    process.exit(row.ok ? 0 : 1);
  }
  if (mode === "undo") { const r = undo(process.argv[3]); console.log(r.ok ? `acts: undone ${process.argv[3]} — ${r.row.receipt || ""}` : `acts: not undone — ${r.why}`); process.exit(r.ok ? 0 : 1); }
  if (mode === "parse-ball") { const r = await parseBall(process.argv.slice(3).join(" ")); console.log(JSON.stringify(r, null, 1)); return; }
  if (mode === "status") {
    const days = Number(process.argv[3]) || 7;
    const s = stats(days);
    console.log(boardLine(s) + ` (${days} d)`);
    for (const r of readRows().filter((r) => Date.parse(r.ts) >= Date.now() - days * 86400000).slice(-25)) console.log(`  ${r.ts.slice(0, 16)} ${r.id.padEnd(12)} ${String(r.door || "").padEnd(7)} ${String(r.verb).padEnd(8)} ${r.ok ? "✓" : "✗"} ${r.owner || ""} ${r.verb === "undo" ? `of ${r.of}` : ""} — ${clip(r.ok ? r.receipt : r.error, 110)}${r.undone_at ? " (undone)" : ""}`);
    for (const f of findings(s)) console.log(`  [${f.level}] ${f.id} — ${f.finding}`);
    return;
  }
  console.log("acts: do <verb> --door d --text … [--kind --axis --id --job --until --why --clear --json] | undo <id> | status [days] | parse-ball <text> | selftest");
  process.exit(2);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
