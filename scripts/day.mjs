#!/usr/bin/env node
// ============================================================================
// day.mjs · ARSENAL AI FC — ONE START, ONE END, AND NOTHING FOR HIM TO REMEMBER (unit mday)
// ----------------------------------------------------------------------------
// HIS WORD 240 (forks rows 1044 / 1050), verbatim but one apostrophe: "i will not remember anything what to type when to
//   type where to type. all i do is start learning in claude code by /learn command will end my day from today onwards with
//   something like lets end the day here or something else (make sure sematic meaning is here, no exact words) so make sure
//   everything works accordingly"
// MEASURED at main 669200d (spec ci/mday/MDAY_SPEC.md @ 9421614, re-taken at this base): the day's START was prose (the
//   /learn skill told the session to run `sitting.mjs open --no-spawn`, which with the daemon down registered nothing), and
//   its END was three steps of prose (judge-round → sitting close → /full-time) that block on his answer. Nothing chained them.
// WHAT IT IS. An ORCHESTRATOR in the `postmatch.mjs autoclose` pattern: it composes the owners through their exported doors
//   or their own CLIs, in order, and prints ONE line per verb. SOLE WRITER OF NOTHING (ruling F1 A: no new state file; each
//   step's own owner records whether it ran, and that record is the "already").
// THE DOORS (ruling F2 C — both hooks, idempotent):
//   · UserPromptSubmit → turn_hook.mjs prompt(): a prompt whose LEADING token is the slash command /learn (a command token the
//     harness dispatches — measured on his laptop: a typed /learn arrives inline, with no Skill call) → `start` here, CALL shape.
//   · PreToolUse(Skill) → rails.mjs pretooluse: a Skill call naming learn (the MODEL's invoke) → `start --by hook:skill`.
//   Both bind the host from the HOOK PAYLOAD (G0's law: the model never types an id). A second start is a JOIN, never a fork.
//   `start` also runs usage_tap.mjs need ONCE (unit mpool, rows 1062 F8 A / 1091 (2)): the pool's ONE keyed card is filed at the
//   learn start, by the tap's own door, only on a WAIT for want of a source. Its one line rides the start line as `pool: …`.
// THE END is the session model's to call when it reads HIS MEANING that the study day is over — in any words. NO phrase list,
//   no regex of his words and no model call lives here (L6); the instruction rides CLAUDE.md and the SessionStart brief (F9).
// MODES:
//   start  [--session <payload id>] [--transcript <p>] [--by hook:prompt|hook:skill]   (no --session: the hook payload's own)
//   end    [--pointer "<the exact unanswered micro-question>"] [--dayq left|lost]       (the session model calls this, once —
//          twice on a day-close day: the first prints the ask and writes nothing, the second closes)
//   answer --hit HIT|MISS|PARTIAL|REST [--signal s] [--kal k] [--diag d] [--date D] [--route r]   (only if he answers, any time)
//   status (read-only: today's start/close state + the two code counts of ruling F8, one line each)
//   brief  (SessionStart: ONE line, only while a sitting opened today is open; silent otherwise)
// THE END, in this order (each through its owner; a step that cannot run says so and the next still runs):
//   0. THE DAY-CLOSE PAIR (unit mdayq, forks rows 1241 (1) / 1257 F4 A) — read-only: forge_session.mjs dayCloseDue over the
//      pacer's two files and the bank's rows (gaffer_brain bankRows). DUE (taught on D, no axis closed on D, fewer than two
//      `moment day_close` rows banked on D) and no --dayq → prints the DAYQ block (the day's material by code, F1 A: the
//      teacher composes both questions from it, one a turn, F8 A) and RETURNS, writing nothing, exit 0. --dayq left (he
//      leaves before answering) or --dayq lost (the bank refused his answer, F10 A) → the close runs, its line says the
//      day was taught and what was banked: no card is filed and nothing is red on him. A read that fails says so and the
//      close runs as before (his day end is never blocked by this read).
//   1. forge_session.mjs pointer "<--pointer>"   only when a forge concept is open and the pointer is given (L3: the words
//      are the model's; the door is the pacer's)
//   2. the sitting closes through its OWN door (sitting.mjs closeDoor: daemon up → POST only; down → the local door, F10)
//      with reason fulltime — its close fires the judge by code (sitting.mjs close, `judge-due --trigger sitting.close`)
//   3. postmatch.mjs autoclose --date <D> --anchor close   the MACHINE half of the day, no quiet-rule defer (ruling F3 A)
//   4. the evening organs measured idempotent by day (EVENING_ORGANS below — ruling F4; none is, today)
//   5a. night.mjs arm --day <D> --by day.end   the night factory is armed through its owner's CLI (unit mfac, ruling F1 A: only
//      this real close arms it — never the already or REFUSED path); the next `start` closes it and prints its ONE line
//   5. captains_call.mjs deal   ONE card (its own order decides which)
//   6. ONE line, then the ONE message of questions for him — answered or not, the day is already closed (R3)
// SAFE TWICE: a sitting closed today with reason fulltime IS the owner's "already" stamp — the second call writes nothing.
// SCOPE GUARD (ruling F5 A): a sitting open with a bound host that is not this session's (CLAUDE_CODE_SESSION_ID) REFUSES,
//   writes nothing, and says the night close (conductor dayclose) will still close the day.
// WHO ELSE COULD ACT ON THIS OUTPUT? the session model (the end line + the ONE message) · turn_hook.mjs (start, brief) ·
//   rails.mjs (start by the Skill door) · the night close reads what the owners wrote (postmatch.mjs autoclose).
// CLI: node scripts/day.mjs start|end|answer|status|brief
// ============================================================================
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const STATE_DIR = process.env.ARSENAL_SITTING_STATE_DIR || join(ROOT, "dressing-room", "state");   // the sitting owner's own dir rule
const PM_DIR = join(ROOT, "dressing-room", "state", "post_match");
const HANDOFF = "__ARSENAL_HOOK_STDIN__";   // turn_hook.mjs STDIN_HANDOFF (a named global, greppable)
const UUIDISH = /^[0-9a-f-]{36}$/;

// ── F4 (ruling row 1050): MEASURED by the witness's twice-run byte clause (ci/mday/witness_mday.mjs F4) — an organ whose second
// run on the same day rewrites no byte runs at `end` AND on `answer`; one that rewrites bytes runs on `answer` only. At this
// base none of the three is idempotent by day (each rewrote bytes on its second run: scorer trust_tiers.json, setpiece
// drills.json, viz wall_data.json + wall.html + its prompts), so all three ride his answer, as /full-time ran them.
export const EVENING_ORGANS = Object.freeze([
  Object.freeze({ file: "scorer.mjs", on: Object.freeze(["answer"]) }),
  Object.freeze({ file: "setpiece.mjs", on: Object.freeze(["answer"]) }),
  Object.freeze({ file: "viz.mjs", on: Object.freeze(["answer"]) }),
]);
export const END_LINE = "When HE means the study day is over — in any words — run `node scripts/day.mjs end` once; never ask him to type a command.";

const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const readRows = (p) => { try { return readFileSync(p, "utf8").split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; } };
export const istDay = (d = new Date()) => new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 10);   // his day is IST (sitting.mjs istDay's own rule)
const dayOf = (iso) => { const t = Date.parse(String(iso || "")); return Number.isFinite(t) ? istDay(new Date(t)) : null; };
const readSitting = () => readJson(join(STATE_DIR, "sitting.json"));
const isOpen = (s) => !!(s && s.id && !s.closed_at);
const short = (id) => String(id || "").slice(0, 8);
const lastLine = (r) => `${(r && r.stdout) || ""}\n${(r && r.stderr) || ""}`.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) || "";
const sitting = () => import(pathToFileURL(join(HERE, "sitting.mjs")).href);
/** an owner's own CLI, its stdout handed back (never ARSENAL_ORGAN: the deal must speak), killed at the owner's own bound */
async function ownerRun(file, args, timeout) {
  const t = timeout || (await sitting()).ownerTimeoutMs(file, args);
  const r = spawnSync(process.execPath, [join(HERE, file), ...args], { cwd: ROOT, encoding: "utf8", windowsHide: true, timeout: t });
  return { status: r.status, stdout: String(r.stdout || ""), stderr: String(r.stderr || ""), error: r.error };
}

/** the hook payload, when this runs inside turn_hook (CALL shape) — the dispatcher parked it on the handoff global */
function payloadOf() {
  const raw = globalThis[HANDOFF];
  if (typeof raw !== "string" || !raw.trim()) return {};
  try { const p = JSON.parse(raw); return p && typeof p === "object" ? p : {}; } catch { return {}; }
}

// unit mfac — THE NIGHT, through its owner's CLI (night.mjs is sole writer of night_log.jsonl): `end` arms it (step 5a), `start`
// closes it and hands back its ONE line (null when no night was armed — silent).
async function closeNight() {
  const n = await ownerRun("night.mjs", ["close", "--by", "learn-start"]);
  return n.stdout.split(/\r?\n/).find((l) => l.startsWith("NIGHT ")) || null;
}

// ── START ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
export async function start({ session = null, transcript = null, by = "hand", now = new Date() } = {}) {
  if (process.env.ARSENAL_ORGAN === "1") return { ok: true, silent: true };   // a headless organ is never his study day
  if (typeof session !== "string" || !UUIDISH.test(session)) return { ok: false, line: `day: start — no session id on the hook payload (${by}); nothing opened` };
  const S = await sitting();
  const D = istDay(now), cur = readSitting();
  let rolled = "";
  // a sitting left open from an EARLIER IST day is closed through the same door first — today's /learn opens TODAY's sitting
  if (isOpen(cur) && dayOf(cur.opened_at) && dayOf(cur.opened_at) < D) {
    const c = await S.closeDoor({ reason: "day-rollover" });
    rolled = c.ok ? ` · closed ${cur.id} of ${dayOf(cur.opened_at)} first (day-rollover)` : ` · ${cur.id} of ${dayOf(cur.opened_at)} could NOT be closed (${c.error})`;
  }
  const prevHost = isOpen(readSitting()) ? readSitting().host_session_id || null : null;
  const r = await S.openDoor({ surface: "code", session, transcript, by: `day start · ${by}` });
  // unit mpool (forks rows 1062 F8 A / 1091 (2)) — THE POOL AT THE LEARN START: ONE more owner call, usage_tap.mjs need, ONCE
  // per start. Its own door decides (it files ONE keyed card only on a WAIT for want of a source); this file writes nothing.
  const pool = await ownerRun("usage_tap.mjs", ["need"]);
  const poolNote = ` · pool: ${lastLine(pool).replace(/^usage tap · need: /, "").slice(0, 120) || `usage_tap exit ${pool.status}`}`;
  const night = await closeNight();   // unit mfac (F9 A): the learn start closes the night and never waits — its ONE line rides this start
  if (!r.ok) return { ok: false, r, night, line: `day: start ${D} — the sitting did not open: ${r.error}${r.resume ? ` → ${r.resume}` : ""}${rolled}${poolNote}` };
  const hostNote = r.joined ? (prevHost && prevHost !== session ? ` · host moved ${short(prevHost)} → ${short(r.host_session_id)} (this /learn session is the study session now)` : ` · host ${short(r.host_session_id)} (same session — JOINED, nothing new)`) : ` · host ${short(r.host_session_id)}`;
  return { ok: true, r, night, line: `day: START ${D} · sitting ${r.id} ${r.joined ? "JOINED" : "OPEN"} (door ${r.door}, ${by})${hostNote}${rolled}${poolNote} · the day ends when HE means it: node scripts/day.mjs end` };
}

// ── END ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const QUESTIONS = "ASK HIM, in ONE message, and never wait on it (the day is already closed): Result — HIT / MISS / PARTIAL / REST? · one signal worth naming? · KAL-line (tomorrow's first move)? · on a MISS only: start / block / sleep? — his answer, whenever it comes: node scripts/day.mjs answer --hit <X> --signal \"…\" --kal \"…\" [--diag …]";
// unit mdayq — step 0's read: the pacer's own pure skip over its own two files and the bank's rows, all read only
async function dayCloseRead(D) {
  try {
    const f = await import(pathToFileURL(join(HERE, "forge_session.mjs")).href);
    const g = await import(pathToFileURL(join(HERE, "gaffer_brain.mjs")).href);
    const reg = readJson(join(STATE_DIR, "concepts.json"));
    return f.dayCloseDue({ session: readJson(join(STATE_DIR, "forge_session.json")), history: readRows(join(STATE_DIR, "forge_sessions.jsonl")),
      D, bank: g.bankRows({}), axisNames: reg && reg.axes && typeof reg.axes === "object" ? reg.axes : {} });
  } catch (e) { return { due: false, failed: true, why: `the day-close read failed (${String((e && e.message) || e).split(/\r?\n/)[0].slice(0, 120)}) — the close runs as before` }; }
}
const PROBE_SAY = { recall: "recall — ONE idea taught today, in his words", negative_space: "what that same idea does NOT do" };
function dayqAsk(D, q) {
  const k = (q.asked || 0) + 1, ax = `${q.axis}${q.axis_name ? ` (${q.axis_name})` : ""}`;
  const mom = Object.entries(q.material.moments || {}).map(([m, n]) => `${m} ${n}`).join(", ") || "none";
  return [
    `DAYQ · ask first · ${D} was taught and no axis closed · concept ${q.concept} · axis ${ax} · today's material: axes ${q.material.axes.join(", ")} · moments ${mom} · banked ${q.asked || 0} of 2 · nothing written`,
    `DAYQ · Q${k} (${PROBE_SAY[q.next] || q.next}) — compose it from today's material and this conversation (a capsule may inform, never be the source) · ONE question this turn, the trio pakka / shayad / pata nahi its last line, after: node scripts/forge_session.mjs moment day_close`,
    `DAYQ · his answer → node scripts/gaffer_brain.mjs capture voice_rep ${q.concept}:${q.axis} --axis ${q.axis} --surface code --moment day_close --probe ${q.next} --asked "<the question, verbatim>" [--latency_ms <n>]   (his words and his gut word come off his own prompt record)`,
    `DAYQ · then run end again (same --pointer): node scripts/day.mjs end — it closes once two are banked · he leaves first: node scripts/day.mjs end --dayq left · the bank refused his answer: node scripts/day.mjs end --dayq lost   (the day closes as taught: no card, nothing red on him)`,
  ];
}
const dayqStep = (q, dayq) => {
  if (q.done) return `day-close: pair banked (${q.asked} row(s)) · the sitting close judges them`;
  if (!q.due) return `day-close: not due (${q.why})`;
  const banked = q.asked ? `${q.asked} of 2 banked` : "nothing banked";
  return dayq === "left" ? `day-close: unanswered (he left) · day taught · ${banked}` : `day-close: answer not banked (the door refused it) · day taught · ${banked}`;
};
export async function end({ pointer = null, dayq = null, now = new Date(), envSession = process.env.CLAUDE_CODE_SESSION_ID || null } = {}) {
  const D = istDay(now), s = readSitting();
  if (isOpen(s) && s.host_session_id && s.host_session_id !== envSession) {
    return { ok: false, refused: true, code: 1, lines: [`day: REFUSED — the open sitting ${s.id} belongs to his study session ${short(s.host_session_id)}, not this one (${envSession ? short(envSession) : "no session id"}); nothing written. The night close (conductor dayclose) will still close ${D}.`] };
  }
  if (!isOpen(s) && s && s.close_reason === "fulltime" && dayOf(s.closed_at) === D) {
    return { ok: true, already: true, code: 0, lines: [`day: already closed ${D} · sitting ${s.id} closed ${s.closed_at} (fulltime) · nothing changed`] };
  }
  // 0. the day-close pair (unit mdayq, F4 A) — due and not --dayq left|lost: the ask, nothing written
  const q = await dayCloseRead(D);
  if (q.due && dayq !== "left" && dayq !== "lost") return { ok: true, ask: true, code: 0, lines: dayqAsk(D, q) };
  const lines = [], steps = [dayqStep(q, dayq)];
  // 1. the pointer — only for an open concept, and only with the model's own words
  const forge = readJson(join(STATE_DIR, "forge_session.json"));
  if (pointer && forge && forge.concept && !forge.closed_at) {
    const p = await ownerRun("forge_session.mjs", ["pointer", String(pointer)]);
    steps.push(`pointer ${p.status === 0 ? "kept" : `NOT kept (${lastLine(p).slice(0, 80)})`}`);
  } else steps.push(pointer ? "pointer: no open concept" : "pointer: none given");
  // 2. the sitting — its own door; its close fires the judge by code
  const S = await sitting();
  const closeSitting = async () => {
    if (!isOpen(readSitting())) { steps.push("sitting: none open"); return; }
    const c = await S.closeDoor({ reason: "fulltime" });
    steps.push(c.ok ? `sitting ${c.id} closed (door ${c.door}${c.review && c.review.judge ? `, judge ${c.review.judge.ok ? "ran" : "FAILED"}` : ""})` : `sitting NOT closed (${c.error})`);
  };
  // 3. the machine half of the day — the close anchor (F3 A), no quiet-rule defer
  const machineHalf = async () => {
    const pm = await import(pathToFileURL(join(HERE, "postmatch.mjs")).href).catch(() => null);
    const a = await ownerRun("postmatch.mjs", ["autoclose", "--date", D, "--anchor", "close"], pm && pm.autocloseBudget ? pm.autocloseBudget() : undefined);
    const al = a.stdout.split(/\r?\n/).find((l) => l.startsWith("autoclose ·")) || lastLine(a);
    steps.push(`postmatch: ${al.replace(/^autoclose · /, "").slice(0, 160)}`);
  };
  await closeSitting();
  await machineHalf();
  // 4. the evening organs measured idempotent by day (F4)
  for (const o of EVENING_ORGANS.filter((x) => x.on.includes("end"))) { const r = await ownerRun(o.file, []); steps.push(`${o.file} exit ${r.status}`); }
  // 5a. the night (unit mfac, ruling F1 A: only this real close arms it — the already and REFUSED paths returned above)
  const night = await ownerRun("night.mjs", ["arm", "--day", D, "--by", "day.end"]);
  steps.push(night.status === 0 ? lastLine(night).replace(/^night: /, "night ") : `night NOT armed (${lastLine(night).slice(0, 80)})`);
  // 5. ONE card
  const deal = await ownerRun("captains_call.mjs", ["deal"]);
  const card = deal.stdout.split(/\r?\n/).filter((l) => l.trim());
  lines.push(`day: CLOSED ${D} · ${steps.join(" · ")}`);
  lines.push(...card);
  lines.push(QUESTIONS);
  return { ok: true, code: 0, lines };
}

// ── ANSWER (his word, any time; the UPGRADE door of postmatch for a machine-closed day) ───────────────────────────────
export async function answer(argv = []) {
  const p = await ownerRun("postmatch.mjs", argv, (await import(pathToFileURL(join(HERE, "postmatch.mjs")).href)).CHILD_TIMEOUT_MS);
  const lines = p.stdout.split(/\r?\n/).filter((l) => l.trim());
  if (p.status !== 0) return { ok: false, code: p.status || 1, lines: [...lines, `day: answer NOT recorded — postmatch ${p.status === null ? "did not finish" : `exit ${p.status}`}: ${lastLine(p).slice(0, 160)}`] };
  const ran = [];
  for (const o of EVENING_ORGANS.filter((x) => x.on.includes("answer"))) { const r = await ownerRun(o.file, []); ran.push(`${o.file.replace(/\.mjs$/, "")} ${r.status === 0 ? "ok" : `exit ${r.status}`}`); }
  const deal = await ownerRun("captains_call.mjs", ["deal"]);
  return { ok: true, code: 0, lines: [...lines, `day: answer recorded · ${ran.join(" · ")}`, ...deal.stdout.split(/\r?\n/).filter((l) => l.trim())] };
}

// ── STATUS + the two code counts (ruling F8 A — counted by code from what the owners wrote; never a card) ──────────────
/** closeCounts — PURE over the owners' records. learn days = IST days a sitting was opened (sitting_reviews.jsonl, the
 *  sitting's own close rows, plus the open sitting). (i) missed-close: a learn day whose post_match record was written by the
 *  NIGHT close (CLOSED-BY evening|morning) — he was not closed by `end` nor by his own line (a ceiling: some are days he
 *  walked away). (ii) false-close: an `end` (a fulltime close) followed the same IST day by another sitting of the same host. */
export function closeCounts({ reviews = readRows(join(STATE_DIR, "sitting_reviews.jsonl")), current = readSitting(), pmDir = PM_DIR } = {}) {
  const rows = reviews.filter((r) => r && r.kind === "sitting_review");
  const opens = rows.map((r) => ({ id: r.sitting_id, day: dayOf(r.opened_at || r.closed_at), opened_at: r.opened_at || null, host: r.host_session_id || null }));
  if (current && current.id && !rows.some((r) => r.sitting_id === current.id)) opens.push({ id: current.id, day: dayOf(current.opened_at), opened_at: current.opened_at, host: current.host_session_id || null });
  const learnDays = [...new Set(opens.map((o) => o.day).filter(Boolean))].sort();
  let pmNames = []; try { pmNames = readdirSync(pmDir); } catch { /* no records yet */ }
  const nightClosed = learnDays.filter((d) => pmNames.includes(`${d}.md`) && /^CLOSED-BY: code · (evening|morning) anchor · /m.test(String(readFileSync(join(pmDir, `${d}.md`), "utf8"))));
  const ends = rows.filter((r) => r.reason === "fulltime" && r.closed_at);
  const falseCloses = ends.filter((e) => opens.some((o) => o.id !== e.sitting_id && o.opened_at && Date.parse(o.opened_at) > Date.parse(e.closed_at) && o.day === dayOf(e.closed_at) && (!e.host_session_id || o.host === e.host_session_id)));
  return { learn_days: learnDays.length, missed: nightClosed.length, ends: ends.length, false_closes: falseCloses.length,
    line: `counts (F8, from the owners' records): missed-close ${nightClosed.length}/${learnDays.length} learn day(s) closed by the night instead of by end or his line · false-close ${falseCloses.length}/${ends.length} end(s) followed the same day by another sitting of the same host` };
}
/** dayProof — PURE over the sitting owner's close rows (unit mrung, ruling forks row 1122 (2) F1 b): IST day D is a REAL DAY iff
 *  a sitting_review row closed it with reason "fulltime" (the close only `end` makes, on his meaning — word 240) AND that sitting
 *  was bound to a host session. A day-rollover or night close, or a sitting with no host, is not a real day. The latest such row
 *  answers. Still SOLE WRITER OF NOTHING: rung_receipt.mjs reads this; the row's own writer is sitting.mjs. */
export function dayProof(D, { reviews = readRows(join(STATE_DIR, "sitting_reviews.jsonl")) } = {}) {
  const rows = reviews.filter((r) => r && r.kind === "sitting_review" && dayOf(r.closed_at) === D);
  if (!rows.length) return { real: false, why: `no sitting closed on ${D}` };
  const full = rows.filter((r) => r.reason === "fulltime");
  if (!full.length) return { real: false, why: `the sitting(s) of ${D} closed by ${[...new Set(rows.map((r) => r.reason || "?"))].join("/")}, never by a fulltime end` };
  const bound = full.filter((r) => typeof r.host_session_id === "string" && r.host_session_id);
  if (!bound.length) return { real: false, why: `the fulltime close of ${D} has no bound host` };
  const r = bound[bound.length - 1];
  return { real: true, sitting_id: String(r.sitting_id), closed_at: String(r.closed_at), reason: "fulltime" };
}
export function status({ now = new Date() } = {}) {
  const D = istDay(now), s = readSitting();
  const sit = !s || !s.id ? "no sitting on file" : isOpen(s) ? `sitting ${s.id} OPEN since ${s.opened_at} · host ${s.host_session_id ? short(s.host_session_id) : "NOT BOUND"}` : `sitting ${s.id} closed ${s.closed_at} (${s.close_reason || "?"})`;
  let pm = "no post_match record"; try { const t = readFileSync(join(PM_DIR, `${D}.md`), "utf8"); const m = /^CLOSED-BY: code · (\w+) anchor/m.exec(t); pm = /^RESULT:\s*\S/m.test(t) ? "his line recorded" : m ? `machine record (${m[1]} anchor)` : "a post_match file"; } catch { /* none */ }
  return [`day: ${D} · ${sit} · ${pm}`, closeCounts().line];
}

// ── BRIEF (SessionStart, ruling F9: the line reaches a session that starts while a sitting opened today is open) ─────────
export function brief({ now = new Date() } = {}) {
  if (process.env.ARSENAL_ORGAN === "1") return [];
  const s = readSitting();
  return isOpen(s) && dayOf(s.opened_at) === istDay(now) ? [`DAY: sitting ${s.id} is open for today. ${END_LINE}`] : [];
}

async function main() {
  const [mode, ...rest] = process.argv.slice(2);
  const opt = (k) => { const i = rest.indexOf(k); return i >= 0 && rest[i + 1] !== undefined && !String(rest[i + 1]).startsWith("--") ? rest[i + 1] : null; };
  switch (mode) {
    case "start": {
      const p = payloadOf();
      const r = await start({ session: opt("--session") || (typeof p.session_id === "string" ? p.session_id : null), transcript: opt("--transcript") || (typeof p.transcript_path === "string" ? p.transcript_path : null), by: opt("--by") || "hand" });
      if (r.line) console.log(r.line);
      if (r.night) console.log(r.night);   // unit mfac: the ONE night line, only when a night was armed
      return;   // HOOK PATH: never process.exit
    }
    case "end": { const r = await end({ pointer: opt("--pointer"), dayq: opt("--dayq") }); for (const l of r.lines) console.log(l); process.exitCode = r.code; return; }
    case "answer": { const r = await answer(rest); for (const l of r.lines) console.log(l); process.exitCode = r.code; return; }
    case "status": { for (const l of status()) console.log(l); return; }
    case "brief": { for (const l of brief()) console.log(l); return; }
    default:
      console.log("day: start [--session id] [--transcript p] [--by who] | end [--pointer \"…\"] [--dayq left|lost] | answer --hit X [--signal s] [--kal k] [--diag d] | status | brief");
      process.exitCode = mode ? 2 : 0;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
export { main as hookMain };
