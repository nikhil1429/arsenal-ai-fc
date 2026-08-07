#!/usr/bin/env node
// TEACHING CONTRACT — the per-turn re-injection of HOW he must be taught.
//
// WHY THIS EXISTS (31 Jul 2026, his own words: "why are you drifting so fuckin much??
// how to absolutely stop it for every new sessions as well? wtf is going wrong in the
// organism?").
//
// The organism already had two injectors:
//   SessionStart     -> learnstate.mjs brief      = the 17 HOW_HE_LEARNS rules, ONCE.
//   UserPromptSubmit -> forge_session.mjs contract = the METHOD (steps/axes/moments), EVERY TURN.
//
// So the pacing rules came back every turn and the TEACHING rules did not. Over a
// 5-hour session with compaction the 17 rules faded, and the observed result was
// exactly that asymmetry: ZERO method-drifts, FOUR teaching-drifts (scope, role,
// language, terminology). What comes back every turn is what holds.
//
// This organ closes that gap WITHOUT breaking the anti-wall law. forge_session.mjs
// asserts its contract can never exceed 9 lines, on purpose — a wall of text read
// every turn is a wall of text ignored every turn. So this is a SEPARATE, hard-bounded
// block (<= 5 lines), printed by its own hook.
//
// IT MUTATES WITH THE JOURNEY (his explicit requirement — "do it in a manner that
// mutates as per our learning journey and no [not] hardcoded"):
//   1. RULES LIVE IN STATE, not in this file. `add` grows the set as new drifts are
//      caught; nothing here needs editing again.
//   2. DRIFT-RANKED. `hit <id>` records a real violation. The rule with the most hits
//      is the one that gets re-injected first — the contract sharpens itself against
//      whatever is actually going wrong, instead of nagging uniformly forever.
//   3. ROTATION. Slot 1 = the worst offender (stable). Slot 2 rotates through the rest
//      by turn number, so a quiet rule still resurfaces and nothing goes stale-invisible.
//   4. THE LINK-BACK LINE IS DERIVED, NEVER TYPED. Already-closed concepts are read
//      live from sprint.json `progress.done`, so the moment he closes 1-04 the contract
//      starts demanding that 1-05 be tied back to it. Zero maintenance.
//
// CONTEXT WARNING (his second requirement — "explicitly tell me beforehand everytime
// when you are about to loose the context"): a turn counter is kept per CLAUDE CODE
// SESSION and a loud line fires at `context_warn_at`, so the warning is a MEASURED
// signal the machine raises, not a promise the model has to remember to keep.
//   CORRECTED 2 Aug 2026 (audit #38). This line used to read "per forge session", and
//   the code did exactly that — which is why the organ could pass its own selftest
//   18/18 while asserting something untrue to him. Context is a property of the CLAUDE
//   CODE session, not the study session, so the spec contradicted the purpose four
//   lines above it. Both were wrong together; both are fixed together. See THE ANCHOR
//   below for the precedence and for UNKNOWN NEVER RESETS.
//
// OWNER DISCIPLINE: this file is the sole writer of state/teaching_contract.json.
// `print` is HOOK-SAFE — it fails silent and always exits 0. A broken teaching contract
// must never be able to block his prompt.
//
// CLI: see USAGE at the bottom of this file — one string, printed by `default` and
// asserted by the selftest, so a command can never again exist in the switch and be
// invisible in the help (audit #108, 6 Aug 2026).

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const STATE = join(ROOT, "dressing-room", "state", "teaching_contract.json");
const SPRINT = join(ROOT, "dressing-room", "state", "sprint.json");
const FORGE = join(ROOT, "dressing-room", "state", "forge_session.json");
const CAPSULE_DIR = join(ROOT, "dressing-room", "state", "capsules");

const MAX_BLOCK_LINES = 5;      // the anti-wall law, this organ's own copy
const DEFAULT_WARN_AT = 40;

// ── THE FILL GAUGE (audit #107, 5 Aug 2026) ──────────────────────────────────
// MEASURED, not assumed. Audit #38 moved the clock off the forge session and onto
// the Claude Code session id, and that was right about the NOUN and wrong about the
// IDENTIFIER. Measured live on 5 Aug across three consecutive turns of ONE
// conversation: the session id changed mid-conversation (bd2d46c2… -> fa94c375…)
// and the counter went 1 -> 1 -> 2. So the clock zeroed at exactly the moment the
// context was LARGEST — a resume/fork. #38's failure mode was "always fires"; this
// is its mirror, "never fires", and it is the worse of the two because it is silent.
//
// transcript_path is not the fix either: the fork minted a NEW transcript file. But
// the new file INHERITED the history (710,280 -> 958,257 bytes), so while the
// transcript's IDENTITY breaks across a fork, its SIZE carries forward. Size is
// therefore the only resume-surviving proxy for context fill that we can read.
//
// THE CONSTANT IS DERIVED FROM HIS OWN HISTORY, never chosen: across 3,780
// transcripts in this project's Claude Code store — p50 28,197 · p90 63,367 ·
// p95 99,557 · p99 2,263,929 · max 12,171,532 bytes; only 49 (1.3%) ever pass 1 MB.
// A warn at 1.5 MB therefore fires on ~1% of sessions — the long study ones, which
// is precisely the population the warning exists for — and stays silent on the 99%,
// so it can never become the always-fires line he learns to ignore.
// It is still a v0 HYPOTHESIS (transcript bytes are not context tokens) and it lives
// in state, so it can be retuned from observation without editing this file.
// FROZEN 6 Aug 2026 (self-sustaining brief §5.8) — no longer the plan of record.
// The derivation above was real but answered the WRONG QUESTION: it measured "how
// long do his sessions historically get" and was then used to answer "how much can
// the model actually hold". First live test, 6 Aug: transcript 0.92 MB while the
// real context read 234.7k/1.0M tokens = 23% full — the soft warning fired at 23%
// real fill and advised abandoning a healthy session. A gauge that cries wolf
// trains him to ignore it, which is the exact failure its own comment names.
const DEFAULT_TRANSCRIPT_WARN_BYTES_LEGACY = 1_500_000;
// PLAN OF RECORD (6 Aug 2026, §5.8 repair). Derived from the RIGHT question, with
// the arithmetic on record so it can be checked and retuned:
//   measured 6 Aug: 964,000 transcript bytes ↔ 234,700 context tokens ≈ 4.1 bytes/token
//   the live window is 1.0M tokens → full window ≈ 4.1 * 1,000,000 ≈ 4.1 MB of transcript
// So the warn budget now IS the measured window: the soft line (SOFT_FRACTION 0.6,
// unchanged) fires at ~60% of REAL fill — the "beforehand" he asked for — and the
// hard line means the window is genuinely at capacity. Still a hypothesis (v1, one
// measurement), still retunable in state without touching this file; the watchman's
// nightly data is what will retune it, not a guess.
const MEASURED_BYTES_PER_TOKEN = 4.1;          // 964,000 / 234,700 — measured, 6 Aug 2026
const CONTEXT_WINDOW_TOKENS = 1_000_000;       // the live session's own readout, same day
const DEFAULT_TRANSCRIPT_WARN_BYTES = Math.round(MEASURED_BYTES_PER_TOKEN * CONTEXT_WINDOW_TOKENS);
const SOFT_FRACTION = 0.6;      // a heads-up BEFORE the hard line — he asked to be warned beforehand

// ── SEED ──────────────────────────────────────────────────────────────────────
// None of these is invented: the first five are the drifts that actually happened on
// 31 Jul, the next five are the drifts of 6 Aug — every line is one he named himself.
// GROWN TO TEN, 6 Aug 2026 (self-sustaining repair): the audit organ stages against
// six rule ids of which five lived ONLY in the state file — so a single re-seed event
// (missing/corrupt file) would have silently killed five of its six checks forever
// (`flag`/`autohit` refuse unknown ids and the caller discards the failure). The seed
// must carry every rule an automatic path depends on. Everything after this still
// comes in through `add`.
function seed(now = new Date()) {
  const ts = now.toISOString();
  const r = (id, line) => ({ id, line, hits: 0, last_hit: null, born: ts });
  return {
    version: 1,
    show_n: 2,
    context_warn_at: DEFAULT_WARN_AT,
    // Lives in STATE so the fill gauge can be retuned from observation without
    // editing this file — same discipline as `context_warn_at`. Absent in pre-#107
    // state files, and absent falls back to the derived default (never to silence).
    transcript_warn_bytes: DEFAULT_TRANSCRIPT_WARN_BYTES,
    turns: { session_started_at: null, count: 0 },
    rules: [
      r("his-word", "Uska saaf bola hua instruction > meri samajh. Scope kaatna/badalna ho to PEHLE poochho, khud mat kaato."),
      r("hinglish", "HINGLISH — shuddh Hindi nahi. Technical shabd ANGREZI mein hi rehne dena."),
      r("terminology", "Asli terminology bolo (token · vocabulary · next-token · sampling · groundedness). Hindi anuvaad se naam mat badlo — analogy alag cheez hai, naam alag."),
      r("link-back", "Naya concept hamesha pehle band ho chuke concepts se NAAM le kar jodo."),
      r("decided", "Jo faisla wo pehle le chuka hai wo zinda hai — har naye message se intent dobara mat nikaalo."),
      r("one-idea", "EK naya idea per message, aur ANT mein EK check-question. Ye uska rule #1 hai aur usko sabse zyada todta hai."),
      r("his-level", "Uska level uske apne shabd se upar mat rakho — koi 'dormant', koi 'ye to tumhe pata hai'."),
      r("no-system-mid-concept", "Concept ke beech koi system/notes/tool kaam nahi — naam lo, park karo, micro-question wapas haath mein do."),
      r("confusion-is-literal", "'samajh nahi aaya' ko literally lo — wahin ruko, zero se shuru karo, aage mat badho."),
      r("dheema-not-lamba", "DHEEMA = EK cheez poori tarah kholi hui, chhote kadam. LAMBA = ek message mein bahut cheezein. Kabhi lamba mat karo — hamesha GEHRA karo."),
      // 7 Aug 2026 (audit deliverable 1) — the half-answer/stopped-early class,
      // his worst miss, finally a first-class rule. Until today it had NO id, so
      // his three 6 Aug self-reports of exactly this class all landed under
      // his-word and distorted the ranking. teaching_audit.mjs checks its one
      // machine-readable fingerprint (core axis deferred); the semantic rest
      // stays his to flag — now under its own name.
      r("coverage", "Har axis ka POORA scope kholna Claude ka kaam hai — COVERAGE uske sawaalon pe kabhi depend nahi. Aadha jawab, kata scope, dabaya doubt, core-axis defer = drift."),
    ],
  };
}

// ── PURE CORE (no disk — the selftest never needs a file) ─────────────────────

// FROZEN 6 Aug 2026 (layering law) — the single-lane ranking, byte-for-byte. It read
// only his-confirmed `hits`, which was correct while his word was the only recorder;
// the drift-count ruling (his own, 6 Aug: "keep me out of the picture") added the
// code-measured lane below, so this stays for the record and the selftest.
function rankLegacy(rules) {
  // Worst offender first. Ties break on recency, then on birth order (stable).
  return [...rules].sort((a, b) =>
    (b.hits - a.hits)
    || String(b.last_hit || "").localeCompare(String(a.last_hit || ""))
    || String(a.born || "").localeCompare(String(b.born || "")));
}

// PLAN OF RECORD (6 Aug 2026 — THE TWO-LANE RULING, his word on the exact question:
// "keep me out of the picture"). A drift has two provenances and they are never mixed:
//   `hits`      — HIS lane: his `confirm` of a staged report, or a hand-run `hit`.
//   `auto_hits` — the CODE lane: teaching_audit.mjs measured the turn and recorded it.
//                 No model judgement is in this lane — a regex has no reputation to
//                 protect — so counting it is measurement, not self-grading, and per
//                 his ruling it asks nobody. Reversible via `unhit-auto` (§7.1 law).
// The RANKING reads both lanes summed: the rule he is being failed on most rises,
// whoever recorded the failure. Ties: most recent stamp in either lane, then birth.
const ruleWeight = (r) => (Number(r.hits) || 0) + (Number(r.auto_hits) || 0);
const newestStamp = (r) => {
  const a = Date.parse(r.last_hit || ""), b = Date.parse(r.last_auto_hit || "");
  return Math.max(Number.isFinite(a) ? a : 0, Number.isFinite(b) ? b : 0);
};
function rank(rules) {
  return [...rules].sort((a, b) =>
    (ruleWeight(b) - ruleWeight(a))
    || (newestStamp(b) - newestStamp(a))
    || String(a.born || "").localeCompare(String(b.born || "")));
}

function pick(rules, turn, showN) {
  const ranked = rank(rules);
  if (!ranked.length) return [];
  const n = Math.max(1, Math.min(showN || 2, ranked.length));
  const out = [ranked[0]];                                  // slot 1: stable, the worst
  const rest = ranked.slice(1);
  for (let k = 0; k < n - 1 && rest.length; k++) {          // slot 2+: rotates by turn
    out.push(rest[(turn + k) % rest.length]);
  }
  return out;
}

function addRule(state, id, line, now = new Date()) {
  if (!id || !line) return { ok: false, why: "id and line are both required", state };
  if (state.rules.some((x) => x.id === id)) return { ok: false, why: `rule "${id}" already exists — use \`hit\` or \`drop\``, state };
  return {
    ok: true,
    state: { ...state, rules: [...state.rules, { id, line, hits: 0, last_hit: null, born: now.toISOString() }] },
  };
}

function hitRule(state, id, now = new Date()) {
  if (!state.rules.some((x) => x.id === id)) return { ok: false, why: `no rule "${id}"`, state };
  return {
    ok: true,
    state: { ...state, rules: state.rules.map((x) => x.id === id ? { ...x, hits: x.hits + 1, last_hit: now.toISOString() } : x) },
  };
}

// ── THE CODE LANE (6 Aug 2026 — the two-lane ruling, see rank()) ─────────────
// `autohit` is called ONLY by teaching_audit.mjs's hook path, one spawn per measured
// drift. It touches auto_hits/last_auto_hit and never `hits` — his lane stays his.
function autoHitRule(state, id, why, now = new Date()) {
  if (!state.rules.some((x) => x.id === id)) return { ok: false, why: `no rule "${id}"`, state };
  return {
    ok: true,
    state: {
      ...state,
      rules: state.rules.map((x) => x.id === id
        ? { ...x, auto_hits: (Number(x.auto_hits) || 0) + 1, last_auto_hit: now.toISOString() }
        : x),
    },
  };
}
// The §7.1 reversibility law: every self-applied count has a one-command revert.
// Evidence for WHICH auto-hit to revert lives in teaching_audit.jsonl rows (the
// audit is that file's single writer); this only walks the counter back.
function unhitAutoRule(state, id, n = 1) {
  if (!state.rules.some((x) => x.id === id)) return { ok: false, why: `no rule "${id}"`, state };
  const k = Math.max(1, Number(n) || 1);
  return {
    ok: true,
    state: {
      ...state,
      rules: state.rules.map((x) => x.id === id
        ? { ...x, auto_hits: Math.max(0, (Number(x.auto_hits) || 0) - k) }
        : x),
    },
  };
}
// THE HEARTBEAT (6 Aug 2026). forge_session.mjs:378-393 has read `checked_at` off
// this file since audit #40 as the one fact that turns a zero into a measurement —
// and nothing ever stamped it, so the close report said NOT MEASURED forever. The
// audit organ stamps it on every audited turn via the `checked` CLI (single-writer
// law: teaching_audit never writes this file itself). "I looked" is the stamp's
// entire meaning — it carries no verdict.
function checkedStamp(state, now = new Date()) {
  return { ...state, checked_at: now.toISOString() };
}

// ── THE MISSING CALLER (audit 6 Aug 2026) ────────────────────────────────────
// `hit` is the only thing that writes a drift, and NOTHING in the machine called it.
// Measured: 5 of 10 rules had ever been hit, newest stamp 2026-07-31, and the whole
// injection ORDER is ranked off those hits — so the ranking was frozen while the
// forge close report cheerfully printed "TEACHING DRIFTS: NOT MEASURED". The report
// asked the right question out loud: *decide who is allowed to record a drift.*
//
// THE RULING, and why it is the only one consistent with this codebase: the captain
// is the one who NOTICES a drift, but he is mid-concept when it happens and his own
// law says anything he must remember to do is a design defect. Claude is the one who
// can notice it instantly — and is exactly the party you cannot let grade itself.
// So: the same shape `remember_fact` already uses for identity facts (mcp-memory.mjs
// Law 4) — the model STAGES, the human PROMOTES, and the staged queue is SURFACED so
// it cannot rot invisibly. AI proposes · code validates · human approves, unchanged.
//   flag <id> --why "..."   Claude self-reports the moment it catches itself. Stages
//                           ONLY: hits is untouched, so the ranking cannot be gamed
//                           by the thing being ranked.
//   confirm <id>            HIS word. Promotes the newest staged flag into a real hit.
//   dismiss <id>            HIS word. Drops it — a wrong self-report costs nothing.
function flagRule(state, id, why, now = new Date()) {
  if (!state.rules.some((x) => x.id === id)) return { ok: false, why: `no rule "${id}"`, state };
  // NO CAP on why (6 Aug 2026). This sliced at 240 and the live file proved the cost:
  // 3 of his 5 staged reports ended mid-word ("axis g ka ka", "Teen baar usne k") —
  // the root-cause TAIL is what a cap eats, the same scar the afferent caps left
  // before his "there should be no limit" ruling. Same ruling, same fix.
  const staged = [...(state.staged || []), { id, why: String(why || ""), at: now.toISOString() }];
  return { ok: true, state: { ...state, staged } };
}

// ── THE SELF-REPORT LANE, AUTOMATED (7 Aug 2026 — HIS RULING) ────────────────
// His words, verbatim, after the practical trace was laid out ("haan/na se sirf
// counter tick hota hai; enforcement teri haan pe kabhi tiki nahi thi"):
//   "if i say automate it and do not bring it to me will it be ok" → "ok do it.."
// So: a model self-report now COUNTS the moment it is filed — same auto_hits lane
// as the code-measured drifts, same `unhit-auto` revert, and the WHY is preserved
// in `self_reports` (append-only, uncapped per his no-limits ruling) so the
// nightly watchman review has evidence, not just a number. The old staging path
// (flagRule/confirmFlag/dismissFlag above) is FROZEN, not deleted — layering law —
// and stays legal for any legacy staged entry. What this knowingly trades away:
// the model now classifies its own violations unreviewed (the 6 Aug evidence says
// it classifies coarsely). The guard is VISIBILITY + REVERSIBILITY, not a gate.
function selfReport(state, id, why, now = new Date()) {
  const hit = autoHitRule(state, id, why, now);
  if (!hit.ok) return hit;
  const self_reports = [...(state.self_reports || []), { id, why: String(why || ""), at: now.toISOString() }];
  return { ok: true, state: { ...hit.state, self_reports } };
}

// One-time migration for the queue that existed when the ruling landed: every
// staged entry counts AS FILED (no re-classification — re-classifying them here
// would be the same coarse self-judgement the old gate existed to catch), its
// why moves to self_reports with the ORIGINAL filing time preserved, and the
// staged queue empties. Idempotent: an empty queue migrates to nothing.
function promoteStaged(state, now = new Date()) {
  let s = state;
  const q = [...(s.staged || [])];
  for (const e of q) {
    const hit = autoHitRule(s, e.id, e.why, now);
    if (!hit.ok) continue;                       // an unknown rule id stays staged rather than vanishing
    s = { ...hit.state, self_reports: [...(s.self_reports || []), { id: e.id, why: e.why, at: e.at, promoted_at: now.toISOString() }],
          staged: (s.staged || []).filter((x) => x !== e) };
  }
  return { ok: true, state: s, promoted: q.length - (s.staged || []).length, left: (s.staged || []).length };
}
function confirmFlag(state, id, now = new Date()) {
  const staged = state.staged || [];
  if (!staged.some((s) => s.id === id)) return { ok: false, why: `nothing staged for "${id}"`, state };
  let dropped = false;   // drop exactly ONE — a rule drifted twice is two hits
  const rest = [...staged].reverse().filter((s) => (s.id === id && !dropped) ? (dropped = true, false) : true).reverse();
  const hit = hitRule({ ...state, staged: rest }, id, now);
  return hit.ok ? hit : { ok: false, why: hit.why, state };
}
function dismissFlag(state, id) {
  const staged = state.staged || [];
  if (!staged.some((s) => s.id === id)) return { ok: false, why: `nothing staged for "${id}"`, state };
  let dropped = false;
  const rest = [...staged].reverse().filter((s) => (s.id === id && !dropped) ? (dropped = true, false) : true).reverse();
  return { ok: true, state: { ...state, staged: rest } };
}
// The staged queue must be VISIBLE or it becomes the very thing it replaced: a silent
// measurement that never lands. One line, only when non-empty.
function stagedLine(state) {
  const staged = (state && state.staged) || [];
  if (!staged.length) return null;
  const byId = {};
  for (const s of staged) byId[s.id] = (byId[s.id] || 0) + 1;
  return `  ⚑ ${staged.length} DRIFT(S) SELF-REPORTED, awaiting your word: `
    + Object.entries(byId).map(([k, n]) => `${k}${n > 1 ? `×${n}` : ""}`).join(" · ")
    + `  → \`node scripts/teaching_contract.mjs confirm <id>\` (ya \`dismiss <id>\`)`;
}

function dropRule(state, id) {
  if (!state.rules.some((x) => x.id === id)) return { ok: false, why: `no rule "${id}"`, state };
  return { ok: true, state: { ...state, rules: state.rules.filter((x) => x.id !== id) } };
}

// ── FROZEN ENGINES (layering law, CLAUDE.md) ─────────────────────────────────
// Both of these are the 31 Jul originals, kept BYTE-FOR-BYTE. They are no longer
// the plan of record — the engines below them are — but they stay so the audit's
// two findings remain reproducible from inside this file, and so the selftest can
// assert what the OLD engine actually did rather than describing it in a comment.
// Neither is called by any live path; both are called by the selftest.

// A new forge session resets the turn clock; the same one keeps counting.
function bumpTurnLegacy(state, sessionStartedAt) {
  const t = state.turns || { session_started_at: null, count: 0 };
  const fresh = t.session_started_at !== (sessionStartedAt || null);
  return { ...state, turns: { session_started_at: sessionStartedAt || null, count: fresh ? 1 : t.count + 1 } };
}

function blockLinesLegacy(state, done, now = new Date()) {
  if (!state || !Array.isArray(state.rules) || !state.rules.length) return [];
  const turn = (state.turns && state.turns.count) || 0;
  const warnAt = state.context_warn_at || DEFAULT_WARN_AT;
  const L = [];
  L.push(`TEACHING CONTRACT (drift-ranked · mutates with the journey) · turn ${turn}/${warnAt}`);
  for (const r of pick(state.rules, turn, state.show_n)) {
    L.push(`  ⚠ ${r.line}${r.hits ? `  [drifted ${r.hits}×]` : ""}`);
  }
  if (done && done.length) L.push(`  link back BY NAME to what is already closed: ${done.join(" · ")}`);
  if (turn >= warnAt) {
    L.push(`  ⛔ CONTEXT WARNING — turn ${turn}. TELL HIM NOW, before the next teaching pass, that context is close to compacting and what will be lost. He asked to be warned BEFOREHAND.`);
  }
  return L.slice(0, MAX_BLOCK_LINES);
}

// ── THE ANCHOR — what counts as "a session" for the turn clock (audit #38) ────
// THE DEFECT, measured on the live bus 2 Aug 2026:
//   · bumpTurnLegacy treats "the anchor string changed" as the ONLY reset, and the
//     anchor was the FORGE session's started_at. Live state today: forge_session.json
//     started_at 2026-08-02T09:04:09.246Z, teaching_contract.json turns.count 28 —
//     i.e. the counter rides a study session, not a Claude Code session.
//   · With NO forge session, forgeStartedAt() returns null, and after ONE bump the
//     stored anchor is already null, so `null !== null` is FALSE FOREVER. The count
//     rises monotonically across every future session with no reset path. Past
//     context_warn_at it then fires the CONTEXT WARNING on turn 1 of every fresh,
//     empty session — and a warning that always fires is one he learns to ignore.
//
// THE LAW THAT FIXES IT — **UNKNOWN NEVER RESETS.** Only a KNOWN anchor that DIFFERS
// from the stored one resets the count. A null/absent anchor means "I do not know
// which session this is", and not-knowing must never be read as a new session. This
// is the audit's named trap: making a null anchor reset would pin the counter at 1
// on exactly the non-forge days the warning matters most.
//
// ANCHOR CLASSES, in precedence order:
//   1. cc:<session_id>   — the Claude Code session id, read from the hook payload on
//      stdin. This is the boundary that actually governs CONTEXT, which is the thing
//      the warning is about. Same read hooks/afferent-post.mjs:44 has performed live
//      in this same UserPromptSubmit array since 25 Jul.
//   2. cc:local-<iso>    — minted by `reset-turns`. Wire `reset-turns` into
//      .claude/settings.json's SessionStart array and the clock has a real per-session
//      boundary with NO stdin dependency at all. (That wiring is the sanctioned fix;
//      class 1 is belt-and-braces so the counter is right even before it lands.)
//   3. forge:<started_at> — the ORIGINAL anchor, kept as the secondary reset trigger
//      the header at :36 has always described: a new `forge start` still resets.
//   4. null              — unknown. Held, never reset, and SAID OUT LOUD in the block
//      header, because "turn 28/40" is only true of a session we can actually name.
const CC_PREFIX = "cc:";
const FORGE_PREFIX = "forge:";
const TX_PREFIX = "tx:";        // audit #107 — the transcript, which survives a resume

// MIGRATION (one-shot, layered). Pre-fix state carried ONLY turns.session_started_at
// = the forge session's started_at ISO. Read that as a forge-class anchor so the
// upgrade itself does not silently reset his live counter on its first turn.
function storedAnchorOf(t) {
  if (!t || typeof t !== "object") return null;
  if (typeof t.anchor === "string" && t.anchor) return t.anchor;
  if (typeof t.session_started_at === "string" && t.session_started_at) return FORGE_PREFIX + t.session_started_at;
  return null;
}

function anchorKindOf(t) {
  if (t && typeof t.anchor_kind === "string" && t.anchor_kind) return t.anchor_kind;
  return storedAnchorOf(t) ? "forge" : "none";   // pre-fix state: a non-null anchor WAS a live forge anchor
}

// obs = { cc: <claude code session id|null>, forge: <forge started_at|null> }
// FROZEN 5 Aug 2026 (audit #107), byte-for-byte. No longer the plan of record — the
// engine below adds a transcript-class anchor above `cc` — but it stays so the #38
// invariants remain reproducible from inside this file and the selftest can assert
// what the OLD precedence actually did rather than describing it in a comment.
function resolveAnchorLegacy(stored, obs = {}) {
  const held = typeof stored === "string" && stored ? stored : null;
  const cc = obs.cc ? CC_PREFIX + String(obs.cc) : null;
  const forge = obs.forge ? FORGE_PREFIX + String(obs.forge) : null;
  if (cc) return { id: cc, kind: "cc" };
  // No session id THIS turn. If the stored anchor is session-class we cannot tell
  // whether we are still inside it — UNKNOWN NEVER RESETS, so hold it rather than
  // demote to the forge anchor (a demotion would look like "the anchor changed" and
  // would reset the clock on a turn where nothing actually changed).
  if (held && held.startsWith(CC_PREFIX)) return { id: held, kind: "cc_held" };
  if (forge) return { id: forge, kind: "forge" };
  return { id: held, kind: "none" };
}

// PLAN OF RECORD (audit #107). Same law — UNKNOWN NEVER RESETS — with one class
// added ABOVE `cc`: the transcript. A transcript survives what a session id does not
// (a plain resume keeps writing the same file), so anchoring on it removes the most
// common spurious reset. A FORK still mints a new transcript, which is why the
// context WARNING no longer rides this anchor at all — it rides the fill gauge, which
// carries forward across both. The anchor's remaining job is rule ROTATION, where a
// reset costs nothing.
// obs = { tx, cc, forge }
function resolveAnchor(stored, obs = {}) {
  const held = typeof stored === "string" && stored ? stored : null;
  const tx = obs.tx ? TX_PREFIX + String(obs.tx) : null;
  const cc = obs.cc ? CC_PREFIX + String(obs.cc) : null;
  const forge = obs.forge ? FORGE_PREFIX + String(obs.forge) : null;
  if (tx) return { id: tx, kind: "tx" };
  if (cc) return { id: cc, kind: "cc" };
  // No live identifier THIS turn. A held session-class anchor (tx or cc) cannot be
  // proven stale, so it is HELD rather than demoted — a demotion would read as "the
  // anchor changed" and would reset a clock on a turn where nothing changed.
  // The held KIND keeps the class it was held from — `cc_held` is the label #38's
  // invariant was written against, so it must survive verbatim; `tx_held` is its
  // transcript-class twin. A held anchor is never relabelled, only carried.
  if (held && held.startsWith(TX_PREFIX)) return { id: held, kind: "tx_held" };
  if (held && held.startsWith(CC_PREFIX)) return { id: held, kind: "cc_held" };
  if (forge) return { id: forge, kind: "forge" };
  return { id: held, kind: "none" };
}

// ── THE FILL GAUGE ───────────────────────────────────────────────────────────
// Pure read. Every failure path returns null, and a null fill means the block falls
// back to the turn counter — never to silence, and never to a fabricated number.
function transcriptFill(path, warnBytes = DEFAULT_TRANSCRIPT_WARN_BYTES) {
  try {
    if (!path || typeof path !== "string" || !existsSync(path)) return null;
    const bytes = statSync(path).size;
    if (!Number.isFinite(bytes) || bytes <= 0) return null;
    const limit = Number.isFinite(warnBytes) && warnBytes > 0 ? warnBytes : DEFAULT_TRANSCRIPT_WARN_BYTES;
    return { bytes, limit, pct: bytes / limit };
  } catch { return null; }
}

// PLAN OF RECORD. `anchor` may be the {id, kind} object from resolveAnchor, or a bare
// string (legacy call shape — read as a forge anchor, so the three original selftest
// invariants still hold verbatim against this engine).
function bumpTurn(state, anchor, now = new Date()) {
  const t = (state && state.turns) || {};
  const a = (anchor && typeof anchor === "object")
    ? anchor
    : { id: anchor ? FORGE_PREFIX + String(anchor) : null, kind: anchor ? "forge" : "none" };
  const prev = storedAnchorOf(t);
  const known = a.kind !== "none" && !!a.id;
  // Adopting an anchor where NONE was stored is "we learned which session this is",
  // not "a new session started" — so it does not reset either. Only known != known.
  const fresh = known && prev !== null && a.id !== prev;
  const count = fresh ? 1 : (Number.isInteger(t.count) ? t.count : 0) + 1;
  return {
    ...state,
    turns: {
      anchor: a.id,
      anchor_kind: a.kind,
      count,
      // FROZEN KEY: this is what pre-fix state and any human reading the file already
      // know to look for. It carries the forge ISO when the anchor is forge-class and
      // null otherwise — never a `cc:` string, so nothing that ever parsed it as a
      // timestamp can be handed a non-timestamp.
      session_started_at: a.id && a.id.startsWith(FORGE_PREFIX) ? a.id.slice(FORGE_PREFIX.length) : null,
      // WHEN this count started. Makes "28 prompts since <date>" a measured fact
      // rather than an unlabelled number when the clock is unanchored.
      since: (fresh || typeof t.since !== "string" || !t.since) ? now.toISOString() : t.since,
    },
  };
}

// ── THE BLOCK — non-droppable lines first (audit #39) ────────────────────────
// THE DEFECT: blockLinesLegacy ended `L.slice(0, MAX_BLOCK_LINES)`, which truncates
// from the TAIL — and the tail is exactly the CONTEXT WARNING, then the link-back.
// Reproduced by the audit against live state: show_n=3 loses the warning, show_n=4
// loses the link-back too. Both are the things the header calls the point of the
// organ; the rules are by design re-injected on later turns and the warning fires
// once. The truncation order sacrificed the one thing he asked for by name.
//
// THE FIX: the budget is spent on the non-droppables FIRST (header · link-back ·
// warning = at most 3), and the ROTATING RULES take whatever is left. Slot 1 (the
// worst offender) is index 0 of pick(), so truncation always eats a rotating rule
// and never the top-ranked one. The block is bounded BY CONSTRUCTION now, not by a
// slice — which is what finally makes the ANTI-WALL assertion falsifiable.
// ARITHMETIC (no guessed number anywhere): reserved is at most 1+1+1 = 3, so
// MAX_BLOCK_LINES - reserved is at least 5-3 = 2 rule slots in every reachable state.
// FROZEN 5 Aug 2026 (audit #107), byte-for-byte. Superseded by the engine below,
// which adds the fill gauge; kept so the #39 non-droppable-ordering invariant stays
// assertable against the engine that first satisfied it.
function blockLinesV2(state, done, now = new Date()) {
  if (!state || !Array.isArray(state.rules) || !state.rules.length) return [];
  const t = (state.turns && typeof state.turns === "object") ? state.turns : {};
  const turn = Number.isInteger(t.count) ? t.count : 0;
  const warnAt = state.context_warn_at || DEFAULT_WARN_AT;
  const anchored = anchorKindOf(t) !== "none";
  const total = state.rules.length;

  const link = (done && done.length)
    ? `  link back BY NAME to what is already closed: ${done.join(" · ")}`
    : null;
  // HONESTY (audit #38 + #106): an unanchored clock has counted prompts across
  // sessions, so it is NOT this session's turn count. It still fires — suppressing
  // it is the named trap — but it says which kind of number it is.
  const warn = turn >= warnAt
    ? `  ⛔ CONTEXT WARNING — turn ${turn}${anchored ? "" : " counted ACROSS sessions (clock unanchored)"}.`
      + ` TELL HIM NOW, before the next teaching pass, that context is close to compacting and what will be lost. He asked to be warned BEFOREHAND.`
    : null;

  const reserved = 1 + (link ? 1 : 0) + (warn ? 1 : 0);        // header + the two non-droppables
  const room = Math.max(0, MAX_BLOCK_LINES - reserved);
  const shown = pick(state.rules, turn, state.show_n).slice(0, room);

  const L = [];
  L.push(`TEACHING CONTRACT (drift-ranked · mutates with the journey) · turn ${turn}/${warnAt}`
    + (anchored ? "" : " · CLOCK UNANCHORED (no session boundary recorded — see reset-turns)")
    + ` · rules ${shown.length}/${total}`);                     // have/need, never the bare word
  for (const r of shown) L.push(`  ⚠ ${r.line}${r.hits ? `  [drifted ${r.hits}×]` : ""}`);
  if (link) L.push(link);
  if (warn) L.push(warn);
  return L;
}

const mb = (b) => (b / 1048576).toFixed(2) + " MB";

// PLAN OF RECORD (audit #107). Identical to V2 except for WHICH SIGNAL RAISES THE
// WARNING. The turn counter measures prompts; what he asked to be warned about is
// CONTEXT. Those two came apart the moment a fork reset the counter to 1 while the
// context kept everything — so the counter is now the FALLBACK and the transcript's
// size is the signal. Fill wins whenever it is readable: a 60-turn session with a
// small transcript is genuinely nowhere near compaction, and firing there is how a
// warning becomes noise.
// The line budget arithmetic is UNCHANGED (header + link + warn ≤ 3 reserved, so at
// least 2 rule slots survive in every reachable state), which keeps the #39
// non-droppable-ordering assertion true of this engine too.
//
// EXTENDED IN PLACE, 6 Aug 2026 (audit #108) — two additions, neither of which changes
// a single byte of output for a state that has no staged drifts and a readable
// transcript, which is why this is an extension and not a fourth frozen engine:
//
//  1. THE STAGED-DRIFT LINE IS RESERVED, NOT APPENDED. It was pushed onto the array in
//     the `print` CLI case AFTER this function had already spent its budget, so the
//     very first time the 6 Aug drift-caller law was actually used the block would be
//     SIX lines — MAX_BLOCK_LINES exists to stop exactly that, and the append walked
//     around it. A wall read every turn is a wall ignored every turn, and the newest
//     organ would have been the one to break it. Now it is a non-droppable reserved
//     line like the link-back and the warning, so a ROTATING RULE yields its slot —
//     the same trade audit #39 already ruled correct.
//  2. AN UNMEASURABLE FILL IS SAID OUT LOUD (`fillUnknown`). Before this, `fill === null`
//     below `warnAt` printed NOTHING about context — indistinguishable from "context is
//     fine". That is audit #107's failure mode inverted: #107 was a counter that reset
//     when context was fullest, this is a gauge that goes quiet when it cannot read,
//     and silence is the worse of the two because he cannot tell it apart from a
//     healthy session. It shares the warning's slot (it can only fire when no warning
//     fired), so the arithmetic still bounds at header 1 + link 1 + warn|unknown 1 +
//     staged 1 = 4 reserved → at least ONE rule slot, and slot 1 is pick()'s index 0,
//     so the worst offender is still never the line that gets eaten.
function blockLines(state, done, now = new Date(), fill = null, fillUnknown = false) {
  if (!state || !Array.isArray(state.rules) || !state.rules.length) return [];
  const t = (state.turns && typeof state.turns === "object") ? state.turns : {};
  const turn = Number.isInteger(t.count) ? t.count : 0;
  const warnAt = state.context_warn_at || DEFAULT_WARN_AT;
  const anchored = anchorKindOf(t) !== "none";
  const total = state.rules.length;

  const link = (done && done.length)
    ? `  link back BY NAME to what is already closed: ${done.join(" · ")}`
    : null;

  let warn = null;
  if (fill && fill.pct >= 1) {
    warn = `  ⛔ CONTEXT WARNING — transcript ${mb(fill.bytes)} (${Math.round(fill.pct * 100)}% of the ${mb(fill.limit)} warn budget).`
      + ` TELL HIM NOW, before the next teaching pass, that context is close to compacting and what will be lost. He asked to be warned BEFOREHAND.`;
  } else if (fill && fill.pct >= SOFT_FRACTION) {
    warn = `  ⚠ context filling — transcript ${mb(fill.bytes)} (${Math.round(fill.pct * 100)}% of the ${mb(fill.limit)} warn budget). Say it out loud at the next natural break, not mid-idea.`;
  } else if (!fill && turn >= warnAt) {
    // FALLBACK ONLY — the transcript was unreadable. Say which number this is: an
    // unanchored counter has counted prompts across sessions and is not this
    // session's turn count. Suppressing it is the named #38 trap; mislabelling it
    // is the #106 one.
    warn = `  ⛔ CONTEXT WARNING — turn ${turn}${anchored ? "" : " counted ACROSS sessions (clock unanchored)"}, transcript unreadable so this is a PROMPT count, not a context measure.`
      + ` TELL HIM NOW, before the next teaching pass, that context is close to compacting and what will be lost. He asked to be warned BEFOREHAND.`;
  }

  // Only when the caller TRIED and failed (see the `print` path) — a bare `print` with
  // no hook payload at all is a genuine no-op and stays silent, per the hook contract.
  const unknown = (!fill && fillUnknown && !warn)
    ? `  ⚠ context fill UNKNOWN this turn — transcript unreadable, so nothing measured it. turn ${turn} is a PROMPT count, not a context measure; if this session has been long, say so out loud rather than assume it is fine.`
    : null;

  const staged = stagedLine(state);
  const reserved = 1 + (link ? 1 : 0) + ((warn || unknown) ? 1 : 0) + (staged ? 1 : 0);
  const room = Math.max(0, MAX_BLOCK_LINES - reserved);
  const shown = pick(state.rules, turn, state.show_n).slice(0, room);

  const L = [];
  L.push(`TEACHING CONTRACT (drift-ranked · mutates with the journey) · turn ${turn}/${warnAt}`
    + (anchored ? "" : " · CLOCK UNANCHORED (no session boundary recorded — see reset-turns)")
    + (fill ? ` · context ${Math.round(fill.pct * 100)}%` : "")
    + ` · rules ${shown.length}/${total}`);
  // Both lanes shown, provenance visible (6 Aug two-lane ruling): "3× · 2 auto"
  // means 1 confirmed by him + 2 measured by code. A bare number would hide who
  // recorded it, and hidden provenance is how a lane gets gamed.
  for (const r of shown) {
    const n = ruleWeight(r);
    const auto = Number(r.auto_hits) || 0;
    L.push(`  ⚠ ${r.line}${n ? `  [drifted ${n}×${auto ? ` · ${auto} auto` : ""}]` : ""}`);
  }
  if (link) L.push(link);
  if (warn) L.push(warn);
  else if (unknown) L.push(unknown);
  if (staged) L.push(staged);
  return L;
}

// ── DISK ──────────────────────────────────────────────────────────────────────

// A TUNABLE THAT CANNOT BE TUNED IS NOT A TUNABLE (audit #108, 6 Aug 2026).
// The comment at :102 promises `transcript_warn_bytes` "lives in STATE so the fill
// gauge can be retuned from observation without editing this file". load() returned
// the stored object VERBATIM, so that promise held only for a state file BORN after
// the key existed: for any file that already existed, the key could never arrive, and
// every save() wrote the same key-less object straight back. Retuning would then have
// meant hand-editing state, which the single-writer law forbids.
// HONEST ABOUT THE EVIDENCE: checked on the live bus 6 Aug — his
// dressing-room/state/teaching_contract.json DOES carry the key today, because that
// file was re-seeded after #107 shipped. So this is luck, not design; the structural
// hole is real and the same trap waits for every future seed key (the four
// drift-caller commands of 6 Aug added no key, the next tunable will).
//
// THE FIX: spread the seed UNDER the stored state. Stored values always win, so no
// existing number, rule, hit count or anchor is touched; only genuinely MISSING keys
// are filled, and the next save() persists them. Pure and separately testable so the
// selftest can assert it without going near his live file.
function withSeedDefaults(stored, now = new Date()) {
  const s = { ...seed(now), ...stored };
  // ONE-SHOT MIGRATION (§5.8, 6 Aug 2026). The live file was seeded post-#107 and
  // carries the frozen 1.5 MB budget — the value derived for the wrong question.
  // Only the EXACT legacy default migrates; any other stored number is a value
  // someone chose on purpose and stored-wins keeps protecting it.
  if (s.transcript_warn_bytes === DEFAULT_TRANSCRIPT_WARN_BYTES_LEGACY) {
    s.transcript_warn_bytes = DEFAULT_TRANSCRIPT_WARN_BYTES;
  }
  return s;
}

// NEVER RESEED OVER LIVE DATA (6 Aug 2026, self-sustaining repair). The old load()
// returned a bare seed() whenever the file was corrupt/torn — and every caller
// save()s what it loaded, so one torn read would have silently WIPED his 10 rules,
// every hit in both lanes, and the whole staged queue. Now a file that EXISTS but
// cannot be read comes back marked `_unreadable`, save() refuses to persist that
// marker, and the on-disk data survives until a good read. The watchman's shape
// check is what raises the corruption to him; this just refuses to make it worse.
function load() {
  try {
    if (!existsSync(STATE)) return seed();
    const s = JSON.parse(readFileSync(STATE, "utf8"));
    if (!s || !Array.isArray(s.rules)) return { ...seed(), _unreadable: true };
    return withSeedDefaults(s);
  } catch { return { ...seed(), _unreadable: true }; }
}

function save(s) {
  try {
    if (s && s._unreadable) return false;   // never clobber a live file we could not read
    mkdirSync(dirname(STATE), { recursive: true });
    // ATOMIC (6 Aug 2026): this was a bare writeFileSync — truncate-then-write — while
    // the writer population grew to `print` (every prompt), `autohit`/`checked` (every
    // audited Stop) and `reset-turns` (every SessionStart). A reader catching the
    // truncated window parses "" → seed → the wipe described at load(). Per-pid tmp +
    // rename is the same shape forge_session.mjs:502-514 has used since 30 Jul.
    const tmp = `${STATE}.${process.pid}.tmp`;
    try {
      writeFileSync(tmp, JSON.stringify(s, null, 2) + "\n");
      renameSync(tmp, STATE);
    } catch (e) {
      try { if (existsSync(tmp)) rmSync(tmp, { force: true }); } catch {}
      throw e;
    }
    return true;
  } catch { return false; }
}

// AUDIT #107 — CLOSED MEANS LOCKED, NOT JUST TICKED ON THE SHEET.
// This read only sprint.progress.done, and the live Sheet lists 1-01 Embeddings ·
// 1-02 Inference · 1-03 Context — while `tokenization` has been a LOCKED, TEMPERED
// capsule since 15 Jun 2026 and appears nowhere in it. So the one rule whose whole job
// is "link the new concept back BY NAME to what is already closed" was structurally
// unable to name a quarter of what he has actually closed. A locked capsule is the
// harder evidence of the two — the Sheet is hand-maintained, a capsule is not — so
// both sources feed the line, de-duplicated, Sheet wording first.
function doneConcepts() {
  const out = [], seen = new Set();
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z]/g, "");
  // The two sources word the same concept differently — the Sheet says "Context window",
  // the capsule id is "context". An exact-key dedupe would print BOTH, which is worse
  // than the bug it was fixing: the rule would tell him to link back to one concept
  // twice. So a capsule matches if any Sheet entry CONTAINS its id.
  const push = (label, key) => {
    const k = norm(key || label);
    if (!k) return;
    for (const s of seen) if (s === k || s.includes(k) || k.includes(s)) return;
    seen.add(k); out.push(label);
  };
  try {
    const sp = JSON.parse(readFileSync(SPRINT, "utf8"));
    const d = sp && sp.progress && Array.isArray(sp.progress.done) ? sp.progress.done : [];
    for (const x of d) {
      const label = String(x).replace(/\s*\(finish\)\s*$/i, "").trim();
      if (label) push(label, label.replace(/^\d+-\d+\s*/, ""));   // "1-01 Embeddings" keys on "embeddings"
    }
  } catch {}
  try {
    for (const f of readdirSync(CAPSULE_DIR)) {
      if (!f.endsWith(".json")) continue;
      const c = JSON.parse(readFileSync(join(CAPSULE_DIR, f), "utf8"));
      if (c && c.id) push(`${c.title || c.id} (capsule locked)`, c.id);
    }
  } catch { /* no capsule mirror on this machine — the Sheet alone still works */ }
  return out;
}

function forgeStartedAt() {
  try {
    const f = JSON.parse(readFileSync(FORGE, "utf8"));
    return f && !f.closed_at ? (f.started_at || null) : null;
  } catch { return null; }
}

// THE CLAUDE CODE SESSION ID, straight from the hook payload (audit #38, class 1).
// Claude Code pipes the same JSON payload to every command in a hooks array, and
// hooks/afferent-post.mjs:44 has read fd 0 exactly this way in THIS SAME
// UserPromptSubmit array since 25 Jul — the read is proven in this hook position,
// not assumed. The repo's own rig guide documents the payload shape
// (learning-layer/Tier-2_Accountability_Rig_on_Windows…md:373 reads transcript_path
// off it), and session_id rides alongside it.
//
// NEVER BLOCKS: a TTY stdin is not read at all (a human at a terminal would hang on
// a pipe that never ends), and every failure path — no stdin, drained stdin because
// an earlier hook consumed it, junk JSON, no session_id — returns null. Under
// UNKNOWN NEVER RESETS, null is the safe direction: the clock holds, it does not
// jump. So the worst case of this read failing is exactly the behaviour we would
// have had without it.
// CACHED — fd 0 is a ONE-SHOT stream. Before audit #107 there was a single reader,
// so a plain `readFileSync(0)` per call was safe. Now two facts are needed off the
// same payload (session_id AND transcript_path) and a second read would return "" and
// silently blank the anchor. One read, memoised, is the only correct shape here.
let _payload;
function hookPayload() {
  if (_payload !== undefined) return _payload;
  _payload = null;
  try {
    if (process.stdin.isTTY) return _payload;
    const raw = readFileSync(0, "utf8");
    if (!raw || !raw.trim()) return _payload;
    const j = JSON.parse(raw);
    if (j && typeof j === "object") _payload = j;
  } catch { _payload = null; }
  return _payload;
}

function hookSessionId() {
  const j = hookPayload();
  const id = j && typeof j.session_id === "string" ? j.session_id.trim() : "";
  return id || null;
}

// The transcript is the container context actually lives in, and the repo's own rig
// guide documents this field on the payload
// (learning-layer/Tier-2_Accountability_Rig_on_Windows…md:373 reads transcript_path
// off it) — so this is a documented read, not a guess.
function hookTranscriptPath() {
  const j = hookPayload();
  const p = j && typeof j.transcript_path === "string" ? j.transcript_path.trim() : "";
  return p || null;
}

// The three numbers `list` and the close report both need: how many rules exist,
// how many have EVER been hit, and when the newest hit landed. Pure; no disk.
// (audit #40 — a zero here is only meaningful next to the date the recorder last ran.)
function hitStats(rules) {
  const arr = Array.isArray(rules) ? rules : [];
  let everHit = 0, newest = null;
  for (const r of arr) {
    // BOTH lanes count as "this rule has drifted" (6 Aug two-lane ruling) — the
    // stats answer "has the recorder ever recorded", not "who recorded".
    const a = Date.parse((r && r.last_hit) || "");
    const b = Date.parse((r && r.last_auto_hit) || "");
    const h = Math.max(Number.isFinite(a) ? a : -Infinity, Number.isFinite(b) ? b : -Infinity);
    if (Number.isFinite(h) && h > 0) {
      everHit++;
      const iso = new Date(h).toISOString();
      if (!newest || h > Date.parse(newest)) newest = (h === a) ? r.last_hit : (h === b ? r.last_auto_hit : iso);
    }
  }
  return { total: arr.length, ever_hit: everHit, newest_hit: newest };
}

// ── SELFTEST ──────────────────────────────────────────────────────────────────

function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond) => { if (cond) { pass++; console.log(`  ok   ${name}`); } else { fail++; console.log(`  FAIL ${name}`); } };
  const T0 = new Date("2026-07-31T18:00:00Z");
  const base = seed(T0);

  assert("seed carries all eleven rules he named himself (grown 6 Aug, again 7 Aug: a re-seed must never orphan the audit's rule ids)", base.rules.length === 11);
  assert("every rule id the audit organ stages against exists in the seed (the re-seed trap, closed)",
    ["one-idea", "dheema-not-lamba", "hinglish", "his-level", "no-system-mid-concept", "confusion-is-literal", "his-word", "coverage"]
      .every((id) => base.rules.some((r) => r.id === id)));

  const hit = hitRule(hitRule(base, "hinglish", T0).state, "hinglish", T0).state;
  assert("hit increments and stamps", hit.rules.find((r) => r.id === "hinglish").hits === 2);
  assert("DRIFT-RANKED — the worst offender takes slot 1", rank(hit.rules)[0].id === "hinglish");
  assert("slot 1 is stable across turns",
    pick(hit.rules, 1, 2)[0].id === "hinglish" && pick(hit.rules, 7, 2)[0].id === "hinglish");

  const secondSlots = new Set();
  for (let t = 0; t < 12; t++) secondSlots.add(pick(hit.rules, t, 2)[1].id);
  assert("ROTATION — every other rule resurfaces in slot 2 (nothing goes stale-invisible)",
    secondSlots.size === hit.rules.length - 1);

  const grown = addRule(base, "no-praise", "Praise sirf jab kamayi ho, aur specific ho.", T0);
  assert("add grows the set without touching this file", grown.ok && grown.state.rules.length === 12);
  assert("add refuses a duplicate id", addRule(grown.state, "no-praise", "x", T0).ok === false);
  assert("hit refuses an unknown id", hitRule(base, "nope", T0).ok === false);
  assert("drop removes", dropRule(base, "hinglish").state.rules.length === 10);

  // ---- the turn clock: the three ORIGINAL invariants, asserted against BOTH engines
  const t1L = bumpTurnLegacy(base, "S1");
  assert("FROZEN ENGINE — legacy turn clock starts at 1, keeps counting, resets on a new forge session",
    t1L.turns.count === 1 && bumpTurnLegacy(t1L, "S1").turns.count === 2
    && bumpTurnLegacy(bumpTurnLegacy(t1L, "S1"), "S2").turns.count === 1);

  const t1 = bumpTurn(base, "S1", T0);
  assert("turn clock starts at 1 for a new session", t1.turns.count === 1);
  assert("same session keeps counting", bumpTurn(t1, "S1", T0).turns.count === 2);
  assert("a NEW forge session resets the clock", bumpTurn(bumpTurn(t1, "S1", T0), "S2", T0).turns.count === 1);

  // ---- audit #38 — the anchor. Each of these can fail; none is a tautology.
  const nullAnchored = bumpTurn(bumpTurn(base, null, T0), null, T0);
  assert("THE TRAP — a NULL anchor never resets the clock (that would pin it at 1 on exactly the non-forge days the warning matters)",
    bumpTurn(base, null, T0).turns.count === 1 && nullAnchored.turns.count === 2
    && bumpTurn(nullAnchored, null, T0).turns.count === 3);
  assert("UNKNOWN NEVER RESETS — adopting an anchor where none was stored keeps counting, it does not restart",
    bumpTurn(nullAnchored, { id: "cc:A", kind: "cc" }, T0).turns.count === 3);
  const ccA = bumpTurn(base, { id: "cc:A", kind: "cc" }, T0);
  assert("A KNOWN, DIFFERENT session id DOES reset — this is the reset path the forge anchor never gave a non-forge day",
    bumpTurn(ccA, { id: "cc:A", kind: "cc" }, T0).turns.count === 2
    && bumpTurn(ccA, { id: "cc:B", kind: "cc" }, T0).turns.count === 1);
  assert("PRECEDENCE — the Claude Code session id beats the forge session; the forge session is only the fallback",
    resolveAnchor(null, { cc: "A", forge: "2026-08-02T09:04:09.246Z" }).id === "cc:A"
    && resolveAnchor(null, { cc: null, forge: "2026-08-02T09:04:09.246Z" }).id === "forge:2026-08-02T09:04:09.246Z"
    && resolveAnchor(null, {}).kind === "none");
  assert("A SESSION ANCHOR IS HELD when no session id is readable that turn — never demoted to the forge anchor (a demotion would read as a reset)",
    resolveAnchor("cc:A", { cc: null, forge: "2026-08-02T09:04:09.246Z" }).id === "cc:A"
    && resolveAnchor("cc:A", { cc: null, forge: "2026-08-02T09:04:09.246Z" }).kind === "cc_held"
    && bumpTurn({ ...base, turns: { anchor: "cc:A", anchor_kind: "cc", count: 9 } },
                resolveAnchor("cc:A", { cc: null, forge: "X" }), T0).turns.count === 10);
  assert("MIGRATION — pre-fix state (turns.session_started_at only) reads as a FORGE anchor, so the upgrade does not reset his live count",
    storedAnchorOf({ session_started_at: "2026-08-02T09:04:09.246Z", count: 28 }) === "forge:2026-08-02T09:04:09.246Z"
    && anchorKindOf({ session_started_at: "2026-08-02T09:04:09.246Z", count: 28 }) === "forge"
    && bumpTurn({ ...base, turns: { session_started_at: "2026-08-02T09:04:09.246Z", count: 28 } },
                { id: "forge:2026-08-02T09:04:09.246Z", kind: "forge" }, T0).turns.count === 29);
  assert("the frozen key survives: session_started_at still carries the forge ISO for a forge anchor, and null for a session anchor",
    bumpTurn(base, "S1", T0).turns.session_started_at === "S1"
    && bumpTurn(base, { id: "cc:A", kind: "cc" }, T0).turns.session_started_at === null);

  const done = ["1-01 Embeddings", "1-02 Inference & sampling"];
  const lines = blockLines(t1, done, T0);
  assert("block names the closed concepts, derived from sprint.json — never typed here",
    lines.some((l) => l.includes("1-02 Inference & sampling")));

  // ---- audit #39 — the block's budget. The old assertion here checked the length of
  // a value it had just sliced to that length and COULD NOT FAIL. blockLines no longer
  // slices — it is bounded by construction — so this same sentence is now falsifiable,
  // and the three below it are the ones that actually protect the two derived lines.
  const atShowN = (n, turn) => blockLines({ ...base, show_n: n, turns: { anchor: "cc:S", anchor_kind: "cc", count: turn } }, done, T0);
  assert("ANTI-WALL LAW — the block is never more than 5 lines, in any reachable state",
    (() => {
      let worst = 0;
      for (let n = 1; n <= 8; n++) for (let t = 0; t < 60; t++) worst = Math.max(worst, atShowN(n, t).length);
      return worst <= MAX_BLOCK_LINES;
    })());
  assert("THE CONTEXT WARNING IS NON-DROPPABLE — it survives at EVERY show_n 1..6 (the legacy slice ate it from show_n 3)",
    [1, 2, 3, 4, 5, 6].every((n) => atShowN(n, 40).some((l) => /CONTEXT WARNING/.test(l))));
  assert("THE LINK-BACK IS NON-DROPPABLE — it survives at every show_n 1..6 whenever sprint progress.done is non-empty",
    [1, 2, 3, 4, 5, 6].every((n) => atShowN(n, 40).some((l) => /link back BY NAME/.test(l))));
  assert("TRUNCATION EATS A ROTATING RULE, NEVER SLOT 1 — the worst offender is shown at every show_n",
    [1, 2, 3, 4, 5, 6].every((n) => atShowN(n, 40).some((l) => l.includes(rank(base.rules)[0].line))));
  // ARITHMETIC, so the numbers below are read not guessed. show_n=4, done non-empty:
  //   before the warning — reserved = header 1 + link 1 = 2 → room 3 → "rules 3/5"
  //   after  the warning — reserved = header 1 + link 1 + warn 1 = 3 → room 2 → "rules 2/5"
  // i.e. the warning costs a ROTATING RULE, which is exactly the trade the audit asked
  // for and the reverse of what the slice used to do.
  assert("HAVE/NEED — the header says how many rules are actually shown out of how many exist, so a truncation is visible",
    /rules 2\/11/.test(atShowN(4, 40)[0]) && /rules 3\/11/.test(atShowN(4, 1)[0]));
  assert("NO REGRESSION AT THE LIVE VALUE — at show_n 2 he still gets both rules, the link-back AND the warning, in 5 lines",
    atShowN(2, 40).length === 5 && /rules 2\/11/.test(atShowN(2, 40)[0])
    && atShowN(2, 40).filter((l) => /^ {2}⚠/.test(l)).length === 2
    && atShowN(2, 40).some((l) => /link back BY NAME/.test(l))
    && atShowN(2, 40).some((l) => /CONTEXT WARNING/.test(l)));
  assert("REGRESSION PIN — the FROZEN engine really did drop the warning at show_n 3 and the link-back at show_n 4 (why this file now has two)",
    !blockLinesLegacy({ ...base, show_n: 3, turns: { session_started_at: "S", count: 40 } }, done, T0).some((l) => /CONTEXT WARNING/.test(l))
    && !blockLinesLegacy({ ...base, show_n: 4, turns: { session_started_at: "S", count: 40 } }, done, T0).some((l) => /link back BY NAME/.test(l)));

  const warned = { ...base, turns: { session_started_at: "S", count: 40 } };
  assert("CONTEXT WARNING fires at the threshold, loudly",
    blockLines(warned, done, T0).some((l) => /CONTEXT WARNING/.test(l)));
  assert("…and stays quiet before it",
    !blockLines({ ...base, turns: { session_started_at: "S", count: 39 } }, done, T0).some((l) => /CONTEXT WARNING/.test(l)));
  assert("HONESTY — an UNANCHORED clock still warns (never suppressed) but says the count is across sessions, and an anchored one does not",
    blockLines({ ...base, turns: { anchor: null, anchor_kind: "none", count: 40 } }, done, T0).some((l) => /CONTEXT WARNING/.test(l) && /across sessions/i.test(l))
    && blockLines({ ...base, turns: { anchor: null, anchor_kind: "none", count: 40 } }, done, T0)[0].includes("CLOCK UNANCHORED")
    && !blockLines(warned, done, T0)[0].includes("CLOCK UNANCHORED"));
  assert("HOOK-SAFE — no rules injects nothing", blockLines({ rules: [] }, done, T0).length === 0);
  assert("HOOK-SAFE — garbage state injects nothing", blockLines(null, done, T0).length === 0);
  assert("HOOK-SAFE — a state with no turns block at all still renders turn 0 and never throws",
    blockLines({ ...base, turns: undefined }, done, T0)[0].includes("turn 0/40"));

  // ---- audit #107 — THE FILL GAUGE. Every assertion below can fail; none is a
  // tautology. The real file on disk is used as the transcript fixture so the gauge is
  // exercised against a genuine stat() rather than a mock that can drift from it.
  const SELF = join(HERE, "teaching_contract.mjs");
  const selfBytes = statSync(SELF).size;
  const fHard = transcriptFill(SELF, Math.floor(selfBytes / 2));       // pct ≈ 2.0
  const fSoft = transcriptFill(SELF, Math.floor(selfBytes / 0.8));     // pct = 0.8
  const fQuiet = transcriptFill(SELF, selfBytes * 100);                // pct = 0.01
  const quietState = { ...base, turns: { anchor: "tx:/t.jsonl", anchor_kind: "tx", count: 1 } };
  const busyState = { ...base, turns: { anchor: "tx:/t.jsonl", anchor_kind: "tx", count: 60 } };

  assert("FILL GAUGE — reads a real file and reports bytes/limit/pct",
    fHard && fHard.bytes === selfBytes && fHard.pct > 1.9 && fHard.pct < 2.1);
  assert("FILL GAUGE — a missing path, a non-string and a directory all yield null, never a throw",
    transcriptFill(join(HERE, "__nope__.mjs")) === null && transcriptFill(null) === null
    && transcriptFill(123) === null && transcriptFill(HERE) === null);
  assert("HARD TIER — at/over the budget the warning names the TRANSCRIPT and still says TELL HIM NOW",
    blockLines(quietState, done, T0, fHard).some((l) => /CONTEXT WARNING/.test(l) && /transcript/.test(l) && /TELL HIM NOW/.test(l)));
  assert("SOFT TIER — past 60% he is warned BEFOREHAND, and it is NOT the loud line",
    (() => { const L = blockLines(quietState, done, T0, fSoft);
      return L.some((l) => /context filling/.test(l)) && !L.some((l) => /CONTEXT WARNING/.test(l)); })());
  assert("QUIET — well under the budget nothing fires at all (the 99% of sessions stay silent)",
    !blockLines(quietState, done, T0, fQuiet).some((l) => /CONTEXT WARNING|context filling/.test(l)));
  assert("THE POINT OF #107 — a 60-turn session with a SMALL transcript does NOT warn; fill beats the prompt counter",
    !blockLines(busyState, done, T0, fQuiet).some((l) => /CONTEXT WARNING|context filling/.test(l))
    && blockLines(busyState, done, T0, null).some((l) => /CONTEXT WARNING/.test(l)));
  assert("FALLBACK IS LABELLED — with no readable transcript the turn-count warning says it is a PROMPT count",
    blockLines(busyState, done, T0, null).some((l) => /PROMPT count, not a context measure/.test(l)));
  assert("HEADER — the fill percentage is visible whenever it is known, and absent when it is not",
    /context 80%/.test(blockLines(quietState, done, T0, fSoft)[0])
    && !/context \d+%/.test(blockLines(quietState, done, T0, null)[0]));
  assert("ANTI-WALL HOLDS WITH THE GAUGE ON — still never more than 5 lines, at every show_n and both tiers",
    (() => { let worst = 0;
      for (const f of [fHard, fSoft, fQuiet, null]) for (let n = 1; n <= 8; n++) for (let t = 0; t < 60; t++)
        worst = Math.max(worst, blockLines({ ...base, show_n: n, turns: { anchor: "tx:/t", anchor_kind: "tx", count: t } }, done, T0, f).length);
      return worst <= MAX_BLOCK_LINES; })());

  // ---- audit #107 — THE ANCHOR. This is the measured defect, pinned.
  const TX = { tx: "/p/t.jsonl" };
  assert("ANCHOR — the transcript outranks the session id",
    resolveAnchor(null, { ...TX, cc: "S1" }).kind === "tx" && resolveAnchor(null, { ...TX, cc: "S1" }).id === "tx:/p/t.jsonl");
  assert("THE MEASURED DEFECT — a NEW session id on the SAME transcript no longer resets the clock",
    (() => { const a = bumpTurn(base, resolveAnchor(null, { ...TX, cc: "S1" }), T0);
      const b = bumpTurn(a, resolveAnchor(storedAnchorOf(a.turns), { ...TX, cc: "S2-forked" }), T0);
      return a.turns.count === 1 && b.turns.count === 2; })());
  assert("…and the FROZEN engine really did reset there (why this file now has two)",
    (() => { const a = bumpTurn(base, resolveAnchorLegacy(null, { cc: "S1" }), T0);
      const b = bumpTurn(a, resolveAnchorLegacy(storedAnchorOf(a.turns), { cc: "S2-forked" }), T0);
      return a.turns.count === 1 && b.turns.count === 1; })());
  assert("UNKNOWN NEVER RESETS — with nothing observable, a held transcript anchor is HELD, not demoted to forge",
    resolveAnchor("tx:/p/t.jsonl", { forge: "2026-08-02T09:04:09Z" }).id === "tx:/p/t.jsonl"
    && resolveAnchor("tx:/p/t.jsonl", { forge: "2026-08-02T09:04:09Z" }).kind === "tx_held");
  assert("FROZEN ENGINE — resolveAnchorLegacy has no concept of a transcript and still puts cc first",
    resolveAnchorLegacy(null, { tx: "/p/t.jsonl", cc: "S1" }).kind === "cc");
  assert("SEED — the fill budget lives in STATE so it is retunable without editing this file",
    seed(T0).transcript_warn_bytes === DEFAULT_TRANSCRIPT_WARN_BYTES);
  assert("BACKWARD-COMPATIBLE — pre-#107 state has no transcript_warn_bytes and falls back to the derived default",
    transcriptFill(SELF, undefined).limit === DEFAULT_TRANSCRIPT_WARN_BYTES);

  // ---- audit #108, 6 Aug 2026 — four repairs, each pinned to the defect it fixed.
  // None of these is a tautology: every one of them fails against the pre-#108 file.

  // T1 — the help hid the one command CLAUDE.md makes mandatory.
  assert("THE HELP ADMITS TO EVERY LIVE COMMAND — `flag`/`confirm`/`dismiss`/`staged` shipped 6 Aug and the usage line still listed only the 31 Jul set",
    ["print", "list", "add", "hit", "flag", "confirm", "dismiss", "staged", "autohit", "unhit-auto", "checked", "drop", "reset-turns", "selftest"]
      .every((c) => USAGE.includes(c)));

  // T2 — a seed key added later could never reach an EXISTING state file.
  const preFix = {
    version: 1, show_n: 1, context_warn_at: DEFAULT_WARN_AT,
    turns: { anchor: "cc:A", anchor_kind: "cc", count: 28 },
    rules: base.rules.slice(0, 2),
  };
  assert("RETUNABLE FOR REAL — a state file written before a seed key existed GAINS it on load, instead of being rewritten key-less every turn",
    !("transcript_warn_bytes" in preFix)
    && withSeedDefaults(preFix, T0).transcript_warn_bytes === DEFAULT_TRANSCRIPT_WARN_BYTES);
  assert("…and the backfill overwrites NOTHING — his rules, his tuned values and his live turn count all survive it",
    withSeedDefaults(preFix, T0).rules.length === 2
    && withSeedDefaults(preFix, T0).show_n === 1 && seed(T0).show_n !== 1
    && withSeedDefaults(preFix, T0).turns.count === 28
    && withSeedDefaults(preFix, T0).turns.anchor === "cc:A");

  // T3 — the staged-drift line was appended AFTER the budget, so the drift-caller law
  // being used at all would have pushed the block to 6 lines.
  const stagedState = (n, turn) => ({
    ...base, show_n: n,
    staged: [{ id: "hinglish", why: "answered him in English", at: T0.toISOString() }],
    turns: { anchor: "tx:/t", anchor_kind: "tx", count: turn },
  });
  assert("THE STAGED LINE IS PAID FOR OUT OF THE BUDGET — staged drift + link-back + warning is still <= 5 lines, at every show_n and every tier",
    (() => { let worst = 0;
      for (const f of [fHard, fSoft, fQuiet, null]) for (let n = 1; n <= 8; n++) for (let t = 0; t < 60; t++)
        worst = Math.max(worst, blockLines(stagedState(n, t), done, T0, f).length);
      return worst <= MAX_BLOCK_LINES; })());
  assert("…and it is NON-DROPPABLE — a ROTATING rule yields the slot, slot 1 never does",
    [1, 2, 3, 4, 5, 6].every((n) => {
      const L = blockLines(stagedState(n, 40), done, T0, null);
      return L.some((l) => /SELF-REPORTED/.test(l)) && L.some((l) => l.includes(rank(base.rules)[0].line));
    }));
  assert("NOTHING STAGED = NOTHING SAID — the line only exists when there is something awaiting his word",
    !blockLines(busyState, done, T0, null).some((l) => /SELF-REPORTED/.test(l)));

  // T4 — a fill the gauge could not compute printed NOTHING, which reads exactly like
  // a healthy session on the one turn (the first after a fork) it is least likely to be.
  assert("THE MISS IS VISIBLE — a transcript we TRIED and failed to read says so; a genuine no-op still says nothing",
    blockLines(quietState, done, T0, null, true).some((l) => /context fill UNKNOWN/.test(l))
    && !blockLines(quietState, done, T0, null, false).some((l) => /context fill UNKNOWN/.test(l)));
  assert("…it SHARES the warning's slot and never doubles it — past warn_at the loud #107 fallback wins and the unknown line stands down",
    (() => { const L = blockLines(busyState, done, T0, null, true);
      return L.some((l) => /CONTEXT WARNING/.test(l)) && !L.some((l) => /context fill UNKNOWN/.test(l)); })());
  assert("…and it never fires when the gauge actually read something",
    !blockLines(quietState, done, T0, fQuiet, true).some((l) => /context fill UNKNOWN/.test(l)));
  assert("ANTI-WALL HOLDS WITH BOTH #108 LINES ON — staged drift + unknown fill + link-back, still <= 5 lines at every show_n",
    (() => { let worst = 0;
      for (let n = 1; n <= 8; n++) for (let t = 0; t < 60; t++)
        worst = Math.max(worst, blockLines(stagedState(n, t), done, T0, null, true).length);
      return worst <= MAX_BLOCK_LINES; })());

  // ---- audit #40's numbers, computed here so the close report never has to guess
  assert("HIT STATS — total / ever-hit / newest are measured from the rules, and 'never hit' is null, never 0",
    hitStats(base.rules).ever_hit === 0 && hitStats(base.rules).newest_hit === null && hitStats(base.rules).total === 11
    && hitStats(hit.rules).ever_hit === 1 && hitStats(hit.rules).newest_hit === T0.toISOString());

  // ---- 6 Aug 2026 — THE TWO-LANE RULING, pinned. His exact words on the exact
  // question ("keep me out of the picture") are what authorise the auto lane; these
  // assertions are what keep it honest. None is a tautology.
  const auto2 = autoHitRule(autoHitRule(base, "one-idea", "x", T0).state, "one-idea", "y", T0).state;
  // THE 7 AUG RULING — self-reports auto-count, whys preserved, migration idempotent
  assert("SELF-REPORT — flag's engine now counts into auto_hits AND preserves the why in self_reports",
    (() => { const r = selfReport(base, "one-idea", "maine do sawaal pooche", T0);
      return r.ok && r.state.rules.find((x) => x.id === "one-idea").auto_hits === 1
        && r.state.self_reports.length === 1 && r.state.self_reports[0].why === "maine do sawaal pooche"; })());
  assert("SELF-REPORT — an unknown rule id still refuses (a typo must not vanish into a count)",
    !selfReport(base, "no-such-rule", "x").ok);
  assert("PROMOTE-STAGED — the pre-ruling queue counts AS FILED, whys+original timestamps preserved, queue empties, idempotent",
    (() => { const st = { ...base, staged: [{ id: "one-idea", why: "w1", at: "2026-08-06T12:00:00Z" }, { id: "his-word", why: "w2", at: "2026-08-06T13:00:00Z" }] };
      const p = promoteStaged(st, T0);
      const again = promoteStaged(p.state, T0);
      return p.promoted === 2 && p.state.staged.length === 0
        && p.state.rules.find((x) => x.id === "one-idea").auto_hits === 1
        && p.state.rules.find((x) => x.id === "his-word").auto_hits === 1
        && p.state.self_reports.length === 2 && p.state.self_reports[0].at === "2026-08-06T12:00:00Z"
        && again.promoted === 0; })());
  assert("PROMOTE-STAGED — an unknown rule id STAYS staged rather than vanishing",
    (() => { const p = promoteStaged({ ...base, staged: [{ id: "ghost-rule", why: "w", at: "x" }] }, T0);
      return p.state.staged.length === 1 && p.promoted === 0; })());
  assert("AUTO LANE — autohit increments auto_hits and stamps last_auto_hit, never touching his `hits`",
    auto2.rules.find((r) => r.id === "one-idea").auto_hits === 2
    && auto2.rules.find((r) => r.id === "one-idea").hits === 0
    && auto2.rules.find((r) => r.id === "one-idea").last_auto_hit === T0.toISOString());
  assert("AUTO LANE — unknown id refused, exactly like hit/flag (the silent-drop path the audit must record)",
    autoHitRule(base, "nope", "x", T0).ok === false);
  const mixed = autoHitRule(autoHitRule(hitRule(base, "hinglish", T0).state, "one-idea", "x", T0).state, "one-idea", "y", T0).state;
  assert("RANKING MERGES THE LANES — 2 auto-hits outrank 1 confirmed hit; the worst offender rises whoever recorded it",
    rank(mixed.rules)[0].id === "one-idea");
  assert("FROZEN ENGINE — rankLegacy still reads only his lane: 1 confirmed hit outranks 2 auto-hits there (why this file now has two rank engines)",
    rankLegacy(mixed.rules)[0].id === "hinglish");
  assert("REVERSIBLE (§7.1 law) — unhit-auto walks the count back and floors at zero, never negative",
    unhitAutoRule(auto2, "one-idea", 1).state.rules.find((r) => r.id === "one-idea").auto_hits === 1
    && unhitAutoRule(auto2, "one-idea", 99).state.rules.find((r) => r.id === "one-idea").auto_hits === 0);
  assert("PROVENANCE VISIBLE — the block prints the auto share next to the total, never a bare number",
    blockLines({ ...auto2, turns: { anchor: "cc:S", anchor_kind: "cc", count: 1 } }, [], T0)
      .some((l) => /\[drifted 2× · 2 auto\]/.test(l)));
  assert("HIT STATS COUNT BOTH LANES — an auto-only drift still reads as 'this rule has drifted'",
    hitStats(auto2.rules).ever_hit === 1 && hitStats(auto2.rules).newest_hit === T0.toISOString());
  assert("HEARTBEAT — checkedStamp writes an ISO checked_at (the fact forge_session.mjs:384 has read since audit #40)",
    checkedStamp(base, T0).checked_at === T0.toISOString());
  assert("§5.8 MIGRATION — the frozen 1.5 MB budget upgrades to the measured-window default, and ONLY the exact legacy value migrates",
    withSeedDefaults({ rules: [], transcript_warn_bytes: DEFAULT_TRANSCRIPT_WARN_BYTES_LEGACY }, T0).transcript_warn_bytes === DEFAULT_TRANSCRIPT_WARN_BYTES
    && withSeedDefaults({ rules: [], transcript_warn_bytes: 999999 }, T0).transcript_warn_bytes === 999999);
  assert("§5.8 — the new budget is DERIVED (bytes/token × window), not typed: 4.1 × 1,000,000",
    DEFAULT_TRANSCRIPT_WARN_BYTES === Math.round(4.1 * 1_000_000) && DEFAULT_TRANSCRIPT_WARN_BYTES !== DEFAULT_TRANSCRIPT_WARN_BYTES_LEGACY);
  assert("NEVER RESEED OVER LIVE DATA — save() refuses a state marked _unreadable, so a torn read can no longer wipe his rules",
    save({ _unreadable: true, rules: [] }) === false);
  assert("NO CAP ON WHY — a 300-char self-report survives whole (his 'no limit' ruling; 3 of his 5 live reports were cut mid-word at 240)",
    flagRule(base, "his-word", "x".repeat(300), T0).state.staged[0].why.length === 300);

  console.log(`\nteaching_contract selftest: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

// ── CLI ───────────────────────────────────────────────────────────────────────

// THE HELP HID THE LAW (audit #108, 6 Aug 2026). `flag`, `confirm`, `dismiss` and
// `staged` have been implemented in the switch below since 6 Aug, and CLAUDE.md makes
// `flag <rule-id> --why "…"` the MANDATORY drift-caller path — run in the turn the
// drift happens. The usage line still listed only the 31 Jul commands, so the one
// command the operating system requires was the one command the file would not admit
// to having. Hoisted into a const so the selftest can assert every live command
// appears here — a command can be forgotten in prose, not in an assertion.
const USAGE = "teaching_contract: print | list | add <id> <line...> | hit <id>"
  + " | flag <id> --why \"...\" (auto-counts — his 7 Aug ruling) | confirm <id> | dismiss <id> | staged | promote-staged"
  + " | autohit <id> --why \"...\" | unhit-auto <id> [--n <k>] | checked"
  + " | drop <id> | reset-turns | selftest";

const cmd = process.argv[2];
const arg = process.argv[3];

switch (cmd) {
  case "print": {                               // HOOK PATH — never throws, never blocks
    // SELF-INJECTION GUARD — same scar as forge_session.mjs:808. Headless organs run
    // `claude -p` inside this repo; without this they would be handed (and would bump
    // the turn clock of) the captain's teaching contract.
    if (process.env.ARSENAL_ORGAN === "1") process.exit(0);
    try {
      const st = load();
      // PRECEDENCE, resolved once per turn: transcript > Claude Code session id >
      // a held session anchor > the forge session > unknown (held, never reset).
      const tx = hookTranscriptPath();
      const held = storedAnchorOf(st.turns);
      const anchor = resolveAnchor(held, { tx, cc: hookSessionId(), forge: forgeStartedAt() });
      const s = bumpTurn(st, anchor);
      save(s);
      // The warning rides the FILL GAUGE, not the anchor — a fork resets the anchor
      // at exactly the moment the context is fullest (audit #107).
      //
      // THE GAUGE'S OWN BLIND SPOT (audit #108, 6 Aug 2026). This was a single read of
      // `tx` and nothing else, so it returned null — silently — on the FIRST prompt of a
      // session, when the new transcript file is not on disk yet, and on any turn whose
      // payload was already drained by an earlier hook in the same array. That is the
      // worst possible turn to go quiet: after a fork the context is FULLEST on prompt 1
      // (#107's own evidence, 710,280 -> 958,257 bytes), and #107's fix rides entirely
      // on this read.
      // So: fall back to the LAST transcript we anchored on. Its identity breaks across
      // a fork but its size carries forward — that is the measured fact #107 is built on
      // — so the previous file is a real lower bound on fill, not a guess. If even that
      // is unreadable, the miss is stated in the block instead of being invisible.
      //
      // REVIEW CORRECTION (audit #108 review pass, 6 Aug 2026). MEASURED against a copy of
      // this file with real hook payloads, because the paragraph above argues the fork case
      // and the wiring says otherwise: .claude/settings.json runs `reset-turns` as the FIRST
      // SessionStart hook, and it mints tx:<transcript_path> off that same payload — so on
      // prompt 1 the held anchor IS this turn's tx, `heldTx !== tx` is false, and this
      // fallback CANNOT fire there. Reproduced: prompt 1 with an on-disk-yet-missing
      // transcript printed the `context fill UNKNOWN` line (branch 2), never the fallback.
      // What the fallback actually buys is the DRAINED-PAYLOAD turn — tx null, held anchor
      // = this session's own transcript, size read correctly. That case is real, it is the
      // common one, and it is why the branch stays.
      // THE EDGE IT OPENS, on the record rather than found later: if the held anchor is a
      // DIFFERENT session's transcript (SessionStart's reset-turns did not run, or its save
      // failed) AND this turn's tx is unreadable, the fallback reports THAT file's size —
      // reproduced at "context 811%" off a stale 11.6 MB transcript on turn 1 of an empty
      // session. Across a FORK the previous file is a genuine lower bound; across an
      // UNRELATED session it is not, and a loud warning on a fresh session is #38's
      // "always fires" failure mode coming back. Narrowing the fallback to fire only when
      // `!tx` closes it and loses nothing that works today — NOT done here, because it is a
      // behaviour change outside the four assigned repairs. Captain's ruling.
      const heldTx = (held && held.startsWith(TX_PREFIX)) ? held.slice(TX_PREFIX.length) : null;
      let fill = transcriptFill(tx, st.transcript_warn_bytes);
      if (!fill && heldTx && heldTx !== tx) fill = transcriptFill(heldTx, st.transcript_warn_bytes);
      const fillUnknown = !fill && !!(tx || heldTx);   // we had something to measure and still failed
      // The staged-drift line is built INSIDE blockLines now and paid for out of the
      // 5-line budget. Pushing it on here (as this did until 6 Aug) spent a sixth line
      // the anti-wall law does not have — see audit #108 at blockLines.
      const lines = blockLines(s, doneConcepts(), new Date(), fill, fillUnknown);
      // …with one exception, preserved verbatim from the old append: with ZERO rules the
      // block is empty by the hook-safe law, and a staged drift would then have nowhere
      // to be seen. One line, still inside the budget.
      if (!lines.length) { const sl = stagedLine(s); if (sl) lines.push(sl); }
      if (lines.length) console.log(lines.join("\n"));
    } catch { /* silence is the contract */ }
    process.exit(0);
  }
  case "list": {
    const s = load();
    const t = s.turns || {};
    const hs = hitStats(s.rules);
    // HAVE/NEED, never a bare status word (audit #106) — and the drift recorder's
    // last run is printed next to the hit counts, because a hit count with no date
    // beside it reads as a live measurement when it is a two-day-old seeding burst.
    // CORRECTED 6 Aug 2026 (audit #108). This tail used to end "nothing in the machine
    // calls it", which was the true and damning finding of the 6 Aug audit — for about
    // an hour. `flag`/`confirm`/`dismiss` landed that same day and CLAUDE.md now makes
    // `flag` mandatory in the turn a drift happens, so the line was telling him the
    // ranking is dead at the exact moment it started being fed. It must name the two
    // paths that produce a real hit and the one that only stages, or he cannot read a
    // zero here correctly.
    console.log(`teaching_contract · rules ${s.rules.length} · turn ${t.count || 0}/${s.context_warn_at || DEFAULT_WARN_AT}`
      + ` · clock anchor ${anchorKindOf(t)} ${storedAnchorOf(t) || "(none)"}`
      + ` · drift hits recorded ${hs.ever_hit}/${hs.total} rules, last ${hs.newest_hit ? hs.newest_hit.slice(0, 10) : "never"}`
      + ` (hits = his word/hand; auto = code-measured AND model self-reports — the latter auto-count since his 7 Aug ruling, reversible via unhit-auto)`);
    for (const r of rank(s.rules)) console.log(`  ${r.id.padEnd(12)} hits=${String(r.hits).padStart(2)}  ${r.line}`);
    break;
  }
  case "add": {
    const line = process.argv.slice(4).join(" ");
    const res = addRule(load(), arg, line);
    if (!res.ok) { console.error(`teaching_contract: ${res.why}`); process.exit(1); }
    save(res.state);
    console.log(`teaching_contract: added "${arg}" (${res.state.rules.length} rules)`);
    break;
  }
  case "hit": {
    const res = hitRule(load(), arg);
    if (!res.ok) { console.error(`teaching_contract: ${res.why}`); process.exit(1); }
    save(res.state);
    const r = res.state.rules.find((x) => x.id === arg);
    console.log(`teaching_contract: "${arg}" now ${r.hits}× — it moves up the injection order`);
    break;
  }
  case "flag": {                                // CLAUDE'S PATH — auto-counts since his 7 Aug ruling
    // FROZEN 7 Aug 2026 (the staging dispatch, verbatim, until his "ok do it.." ruling):
    //   const res = flagRule(load(), arg, wi >= 0 ? process.argv[wi + 1] : "");
    //   console.log(`teaching_contract: "${arg}" STAGED (${...} awaiting his word) — hits unchanged; only he promotes it.`);
    const wi = process.argv.indexOf("--why");
    const res = selfReport(load(), arg, wi >= 0 ? process.argv[wi + 1] : "");
    if (!res.ok) { console.error(`teaching_contract: ${res.why}`); process.exit(1); }
    save(res.state);
    const r = res.state.rules.find((x) => x.id === arg);
    console.log(`teaching_contract: "${arg}" self-report auto-counted → ${r.auto_hits}× auto (${ruleWeight(r)}× total) — his 7 Aug ruling ("ok do it"): nobody is asked. Why preserved in self_reports; revert: unhit-auto ${arg}`);
    break;
  }
  case "promote-staged": {                      // one-time migration of the pre-ruling queue
    const res = promoteStaged(load());
    save(res.state);
    console.log(`teaching_contract: ${res.promoted} staged report(s) promoted as filed → auto lane (whys preserved in self_reports)${res.left ? ` · ${res.left} left (unknown rule id)` : ""}`);
    break;
  }
  case "confirm": {                             // HIS WORD — the only path to a real hit
    const res = confirmFlag(load(), arg);
    if (!res.ok) { console.error(`teaching_contract: ${res.why}`); process.exit(1); }
    save(res.state);
    const r = res.state.rules.find((x) => x.id === arg);
    console.log(`teaching_contract: "${arg}" confirmed → ${r.hits}× — it moves up the injection order`);
    break;
  }
  case "dismiss": {
    const res = dismissFlag(load(), arg);
    if (!res.ok) { console.error(`teaching_contract: ${res.why}`); process.exit(1); }
    save(res.state);
    console.log(`teaching_contract: "${arg}" dismissed — a wrong self-report costs nothing`);
    break;
  }
  case "staged": {
    // FULL CONTENT, not just counts (6 Aug 2026). stagedLine shows `his-word×5` and
    // NOTHING anywhere printed the whys — he was being asked to confirm/dismiss
    // reports whose content no command would show him. His word needs the evidence.
    const s = load();
    const q = s.staged || [];
    if (!q.length) { console.log("teaching_contract: koi drift staged nahi."); break; }
    console.log(`teaching_contract: ${q.length} staged drift(s) awaiting his word — confirm <id> | dismiss <id>\n`);
    q.forEach((e, i) => {
      const auto = /^\[auto\]/.test(String(e.why || ""));
      console.log(`  ${i + 1}. [${e.id}] ${String(e.at).slice(0, 16)} · filed by ${auto ? "CODE (audit)" : "the model (self-report)"}`);
      console.log(`     ${e.why || "(no why recorded)"}\n`);
    });
    break;
  }
  case "autohit": {                             // THE CODE LANE — teaching_audit.mjs only
    const wi = process.argv.indexOf("--why");
    const res = autoHitRule(load(), arg, wi >= 0 ? process.argv[wi + 1] : "");
    if (!res.ok) { console.error(`teaching_contract: ${res.why}`); process.exit(1); }
    save(res.state);
    const r = res.state.rules.find((x) => x.id === arg);
    console.log(`teaching_contract: "${arg}" auto-counted → ${r.auto_hits}× auto (${ruleWeight(r)}× total) — code measured it, nobody was asked (his 6 Aug ruling). Revert: unhit-auto ${arg}`);
    break;
  }
  case "unhit-auto": {                          // §7.1 reversibility — one command walks it back
    const ni = process.argv.indexOf("--n");
    const res = unhitAutoRule(load(), arg, ni >= 0 ? Number(process.argv[ni + 1]) : 1);
    if (!res.ok) { console.error(`teaching_contract: ${res.why}`); process.exit(1); }
    save(res.state);
    const r = res.state.rules.find((x) => x.id === arg);
    console.log(`teaching_contract: "${arg}" auto-count walked back → ${r.auto_hits || 0}× auto (${ruleWeight(r)}× total)`);
    break;
  }
  case "checked": {                             // THE HEARTBEAT — "I looked", stamped by the audit every audited turn
    const st = load();
    const res = checkedStamp(st);
    save(res);
    if (process.stdin.isTTY) console.log(`teaching_contract: checked_at stamped ${res.checked_at}`);
    break;
  }
  case "drop": {
    const res = dropRule(load(), arg);
    if (!res.ok) { console.error(`teaching_contract: ${res.why}`); process.exit(1); }
    save(res.state);
    console.log(`teaching_contract: dropped "${arg}"`);
    break;
  }
  case "reset-turns": {
    // THE SESSION BOUNDARY (audit #38). Wire this into .claude/settings.json's
    // SessionStart hooks array and the clock is anchored to the Claude Code session
    // — the boundary that actually governs context. It mints a SESSION-CLASS anchor
    // (never a forge one), so the next `print` sees an unchanged anchor and lands on
    // turn 1, not turn 2. When SessionStart's payload is readable the anchor IS the
    // real session id; otherwise `local-<iso>` is unique per invocation, which is all
    // the reset needs. SessionStart also fires on resume/compact — resetting right
    // after a compaction is correct, the context was just freed.
    // Mint the STRONGEST anchor available, so the very next `print` sees an unchanged
    // anchor and lands on turn 1 rather than 2. Transcript first (it survives a plain
    // resume), then the session id, then a local mint — which is unique per invocation,
    // and uniqueness is all a reset needs.
    const tx = hookTranscriptPath();
    const cc = hookSessionId();
    const id = tx ? TX_PREFIX + tx : CC_PREFIX + (cc || `local-${new Date().toISOString()}`);
    save({ ...load(), turns: { anchor: id, anchor_kind: tx ? "tx" : "cc", count: 0, session_started_at: null, since: new Date().toISOString() } });
    // SILENT IN HOOK MODE. A SessionStart hook's stdout is injected as context, and
    // "turn clock reset" is bookkeeping, not orientation — the same law
    // hooks/afferent-post.mjs:12-13 states for its own hook. A human running this by
    // hand (TTY) still gets the confirmation, and the anchor is on disk either way.
    if (process.stdin.isTTY) {
      console.log(`teaching_contract: turn clock reset · anchor ${id}${(tx || cc) ? "" : " (no transcript_path or session_id on stdin — minted a local one)"}`);
    }
    break;
  }
  case "selftest": selftest(); break;
  default:
    console.log(USAGE);
}
