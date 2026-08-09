#!/usr/bin/env node
// ============================================================================
// captains_call.mjs · ARSENAL AI FC — THE CAPTAIN'S CALL (his word, one card)
// ----------------------------------------------------------------------------
// WHAT: the ADHD-PI decision surface (built 7 Aug 2026, his ruling, verbatim:
//   "my adhd pi brain will not remember it much and it is irritating … i get
//   solid reports and what to do what not to do as well but i do not want to
//   read it" · "how will i know when to do what").
//   The split that answers both: REPORTS ARE MACHINE-FACE — they stay on disk,
//   whole, for the Claude in the session to read. Anything that needs the
//   CAPTAIN'S WORD becomes ONE one-line CARD with a recommendation, dealt at an
//   anchor he already hits (session start · /matchday · /full-time). He answers
//   haan / na / baad — one syllable — and THIS organ runs the owner's own CLI.
//   He never reads a report, never remembers a ritual, never learns a command.
//
// THE ANCHOR LAW (engraved here because this organ IS its enforcement):
//   "If a thing needs the captain, it rides an anchor he already hits.
//    If it cannot ride an anchor, it does not need the captain."
//
// LAWS:
//   · sole writer of captains_call.json — nothing else touches it.
//   · PULL-DERIVE: every source is READ-ONLY (zero code and zero writes in the
//     source organs); every haan/na dispatch goes through the owner's own CLI
//     (owners-only law) — this file never edits another organ's state.
//   · ONE card per deal, silent otherwise. A list is a wall; a wall is unread.
//   · "baad" sleeps the card until the NEXT LOCAL DAY — no nagging inside a day.
//   · silent for headless organs (ARSENAL_ORGAN=1) and while a FRESH forge
//     session is open (his rule #12 — no system work mid-concept; cards wait
//     at /matchday, /full-time, or a session with no concept in motion).
//   · priority is an ORDER, never a number (no invented thresholds):
//     hand-filed (deliberate + rare) → staged drifts oldest-first (teaching
//     integrity) → market proposal (intelligence, ~weekly cadence).
//
// SOURCES v1 — only things that genuinely need HIS word, nothing else:
//   1. staged teaching drifts   teaching_contract.json .staged  (the proven
//      confirm/dismiss pattern this design generalizes)
//   2. the Scout's market proposal   brain_out/market/<date>.md (his 7 Aug
//      ruling: "it is important" — haan = the session Claude opens + walks it
//      in 3 lines; the captain still never reads the file)
//   3. hand-filed cards   `file --line "…"` (the audit's captain's-list class —
//      a session files the ask instead of parking it in a scratchpad he will
//      never open). v1 hand-filed cards carry NO exec — haan retires the card
//      and the session acts on his word; safety first, wiring later if earned.
//   4. THE MISSIONS DESK (outward loop, 8 Aug 2026) — missions.json (scout.mjs
//      owns it; this only reads): the fire-nudge while the full-syllabus audit
//      sits un-fired, and one diff-review card per ingested return (canon =
//      his word — the card is how the diff reaches him, per Ruling 6).
//   5. benchmark regression — benchmark.json (benchmark.mjs owns): a bucket's
//      counted evidence went DOWN since the last run (Ruling 5 max-flow edge:
//      "captains_call card on bucket regression").
//
// WRITES: dressing-room/state/captains_call.json (sole).
// READS (RO): teaching_contract.json · forge_session.json · brain_out/market/ ·
//   missions.json · benchmark.json · tape_room.json.
// MODES: sync · deal · answer <id> <haan|na|baad> · file --line "…" · status ·
//        list · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, readdirSync, renameSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
// ARSENAL_CALL_STATE_DIR is the selftest's seam and NOTHING else's (same pattern
// as teaching_audit.mjs's ARSENAL_AUDIT_STATE_DIR — proven there).
const STATE_DIR = process.env.ARSENAL_CALL_STATE_DIR || join(__dirname, "..", "dressing-room", "state");
const CALL = join(STATE_DIR, "captains_call.json");
const CONTRACT = join(STATE_DIR, "teaching_contract.json");
const FORGE = join(STATE_DIR, "forge_session.json");
const MARKET_DIR = join(STATE_DIR, "brain_out", "market");
const CONTRACT_MJS = join(__dirname, "teaching_contract.mjs");

// Mirrored from forge_session.mjs:115 (STALE_HOURS), with the same comment
// discipline as teaching_audit's CORE_AXES mirror: one constant that has never
// moved, and the owner's boot line + this deal-guard would disagree out loud if
// it ever does.
const FORGE_STALE_HOURS = 18;

const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const clip = (s, n) => { const t = String(s || "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(obj, null, 2));
  renameSync(tmp, path);
}

function loadState() {
  const j = readJson(CALL);
  if (j && typeof j === "object" && Array.isArray(j.cards)) return j;
  return { version: 1, next_id: 1, cards: [] };
}

// ── PURE CORE (no disk — the selftest never needs a file) ─────────────────────

// Derive the card set from the sources. Existing cards keep their identity (key),
// their deal history and their answers; sources only ADD new cards or RETIRE ones
// resolved at the source (he confirmed a drift directly — the card must not
// outlive the thing it asked about).
export function deriveCards(state, { staged = [], marketFile = null, marketHonest = "", gate2 = null, missions = null, bench = null } = {}, now = new Date()) {
  const s = { ...state, cards: state.cards.map((c) => ({ ...c })) };
  const byKey = new Map(s.cards.map((c) => [c.key, c]));
  const ts = now.toISOString();

  // 1. staged teaching drifts — one card per staged entry, keyed by its `at`.
  const stagedAts = new Set(staged.map((e) => e.at));
  for (const e of staged) {
    const key = `drift:${e.at}`;
    if (byKey.has(key)) continue;
    s.cards.push({
      id: `c${s.next_id++}`, key, source: "teaching_contract.staged",
      line: `Drift report [${e.id}]: ${clip(e.why, 110)} — sahi hai?`,
      dispatch: { kind: "staged", at: e.at },
      filed_at: ts, dealt: [], answer: null, answered_at: null, sleep_until: null,
      retired_at: null, resolution: null,
    });
  }
  // auto-retire drift cards whose staged entry is gone (resolved at the source).
  for (const c of s.cards) {
    if (c.source === "teaching_contract.staged" && !c.retired_at && !c.answer
        && !stagedAts.has(c.dispatch.at)) {
      c.retired_at = ts; c.resolution = "resolved-at-source (staged entry gone — his word landed elsewhere)";
    }
  }

  // 1b. ONE Gate-2 flagged doubt (full-organism audit P5.2, 7 Aug 2026). 17 of 112
  // tape-room doubts violate the cold-reader standard (cryptic/meta/fragment) and are
  // therefore EXCLUDED from rematches — correct, but it left them with no repair path:
  // a list he will never open. This is the anchor-lawful flow instead: ONE doubt, one
  // line, at an anchor he already hits; haan = the session walks the rewrite with him
  // right now (≤3 lines) and hands him the gist patch. Serialized: a new card derives
  // only when no gate2 card is LIVE, so the 17 arrive one at a time, never as a list.
  // The 17 is a REGEX FLOOR, not the truth — the card says so ("regex floor").
  // HONEST LEAK, on the record: a haan answered but never pasted to the gist retires
  // the card while the doubt stays flagged; it gets a second lap only after every
  // other flagged doubt has had its first — the queue moves, nothing loops forever.
  if (gate2 && gate2.doubt) {
    const g = gate2.doubt;
    const key = `gate2:${g.capsule}:${g.doubt_index}`;
    const liveGate2 = s.cards.some((c) => c.source === "tape_room.gate2" && !c.answer && !c.retired_at);
    if (!byKey.has(key) && !liveGate2) {
      s.cards.push({
        id: `c${s.next_id++}`, key, source: "tape_room.gate2",
        line: `Doubt cold-readable nahi (${g.capsule}): "${clip(g.q_verbatim, 70)}" — abhi 1 line mein saath theek karein? (${gate2.fixed_or_carded + 1}/${gate2.total}+, regex floor)`,
        dispatch: { kind: "none" },
        filed_at: ts, dealt: [], answer: null, answered_at: null, sleep_until: null,
        retired_at: null, resolution: null,
      });
    }
  }

  // 3. THE MISSIONS DESK (outward loop, 8 Aug 2026) — PULL-DERIVE off scout's
  // missions.json. Two card shapes, both anchor-lawful:
  //   fire-nudge — while the full-syllabus audit sits staged with ZERO returns;
  //     haan = the session opens M01 and walks the fire with him right now.
  //     Auto-retires the moment any return lands (resolved at the source).
  //   diff-review — one per ingested return; haan = the session walks the diff
  //     in ≤3 lines. Canon changes only on his word (Ruling 6). Audit diff
  //     cards auto-retire when `mission audit-close` records that word.
  if (missions && Array.isArray(missions.missions)) {
    const rows = missions.missions;
    const auditRows = rows.filter((r) => r.type === "audit");
    const anyReturn = rows.some((r) => r.ingested_at);
    const auditClosed = !!(missions.syllabus_audit && missions.syllabus_audit.closed_at);
    if (auditRows.length && !anyReturn && !auditClosed) {
      const key = "mission:audit-fire";
      if (!byKey.has(key)) {
        s.cards.push({
          id: `c${s.next_id++}`, key, source: "missions.desk",
          line: `Outward: full-syllabus audit taiyaar (M01–M04, Gemini Deep Research) — abhi M01 saath fire karein?`,
          dispatch: { kind: "open", path: auditRows[0].file },
          filed_at: ts, dealt: [], answer: null, answered_at: null, sleep_until: null,
          retired_at: null, resolution: null,
        });
      }
    }
    for (const c of s.cards) {
      if (c.key === "mission:audit-fire" && !c.retired_at && !c.answer && (anyReturn || auditClosed)) {
        c.retired_at = ts; c.resolution = "resolved-at-source (a return landed — the fire happened)";
      }
    }
    for (const r of rows.filter((r) => r.ingested_at)) {
      if (r.type === "audit" && auditClosed) continue;
      const key = `mission:diff:${r.id}`;
      if (byKey.has(key)) continue;
      s.cards.push({
        id: `c${s.next_id++}`, key, source: "missions.desk",
        line: `Mission ${r.id} wapas aa gaya — diff 3 line mein sunein? (canon badlega sirf aapke word se)`,
        dispatch: { kind: "open", path: `dressing-room/state/${r.report}` },
        filed_at: ts, dealt: [], answer: null, answered_at: null, sleep_until: null,
        retired_at: null, resolution: null,
      });
    }
    if (auditClosed) {
      for (const c of s.cards) {
        if (/^mission:diff:M0[1-4]$/.test(c.key) && !c.answer && !c.retired_at) {
          c.retired_at = ts; c.resolution = "resolved-at-source (audit closed on his word)";
        }
      }
    }
  }

  // 4. benchmark regression (Ruling 5 edge) — one card per regression DAY;
  // the line carries the first regression verbatim, count of the rest beside it.
  if (bench && Array.isArray(bench.regressions) && bench.regressions.length && bench.date) {
    const key = `benchmark:regression:${bench.date}`;
    if (!byKey.has(key)) {
      s.cards.push({
        id: `c${s.next_id++}`, key, source: "benchmark.regression",
        line: `Benchmark: ${clip(bench.regressions[0], 95)}${bench.regressions.length > 1 ? ` (+${bench.regressions.length - 1} aur)` : ""} — sunein?`,
        dispatch: { kind: "none" },
        filed_at: ts, dealt: [], answer: null, answered_at: null, sleep_until: null,
        retired_at: null, resolution: null,
      });
    }
  }

  // 2. the newest market proposal — one card per FILE, ever.
  if (marketFile) {
    const key = `market:${marketFile}`;
    if (!byKey.has(key)) {
      s.cards.push({
        id: `c${s.next_id++}`, key, source: "brain_out/market",
        line: `Scout ka market proposal (${marketFile.replace(/\.md$/, "")})${marketHonest ? `: "${clip(marketHonest, 90)}"` : ""} — 3 line mein sunna hai?`,
        dispatch: { kind: "open", path: `dressing-room/state/brain_out/market/${marketFile}` },
        filed_at: ts, dealt: [], answer: null, answered_at: null, sleep_until: null,
        retired_at: null, resolution: null,
      });
    }
  }
  return s;
}

// Pick THE one card to deal. Order (an ORDER, not a number): hand-filed →
// staged drifts oldest-first → gate2 doubt-repairs → the outward tier
// (missions desk · benchmark · market — oldest filed first within the tier).
// Sleeping and answered cards never deal.
export function pickCard(state, { today }) {
  // B5 (9 Aug 2026): was `>=`, which kept a card asleep THROUGH its wake day —
  // "baad" promised tomorrow and delivered the day after. sleep_until IS the wake day.
  const live = state.cards.filter((c) => !c.answer && !c.retired_at
    && !(c.sleep_until && c.sleep_until > today));
  const rank = (c) => (c.source === "hand-filed" ? 0
    : c.source === "teaching_contract.staged" ? 1
    : c.source === "tape_room.gate2" ? 2 : 3);
  live.sort((a, b) => rank(a) - rank(b) || String(a.filed_at).localeCompare(String(b.filed_at)));
  return live[0] || null;
}

// Apply his word. Returns {state, action} — the CLI layer EXECUTES the action so
// this stays pure and the selftest can assert dispatch without spawning anything.
export function applyAnswer(state, id, word, now = new Date()) {
  const s = { ...state, cards: state.cards.map((c) => ({ ...c })) };
  const c = s.cards.find((x) => x.id === id);
  if (!c) return { state: s, action: { kind: "error", why: `no card ${id}` } };
  if (c.answer || c.retired_at) return { state: s, action: { kind: "error", why: `${id} already settled (${c.resolution || c.answer})` } };
  const ts = now.toISOString();

  if (word === "baad") {
    // sleep until the NEXT local day — resurfaces at tomorrow's first anchor.
    const d = new Date(now); d.setDate(d.getDate() + 1);
    c.sleep_until = localDate(d);
    return { state: s, action: { kind: "sleep", until: c.sleep_until } };
  }
  c.answer = word; c.answered_at = ts;
  if (c.dispatch.kind === "staged") {
    return { state: s, action: { kind: "staged-dispatch", verb: word === "haan" ? "confirm" : "dismiss", at: c.dispatch.at, cardId: c.id } };
  }
  if (c.dispatch.kind === "open" && word === "haan") {
    c.resolution = "haan — the session walks it now";
    return { state: s, action: { kind: "open", path: c.dispatch.path } };
  }
  c.resolution = word === "haan" ? "haan — done on his word (no exec by design, v1)" : "na — retired";
  c.retired_at = ts;
  return { state: s, action: { kind: "done", resolution: c.resolution } };
}

// ── DEAL GUARDS (injectable for the selftest) ────────────────────────────────
export function dealGuard({ organEnv, forge, now = new Date() }) {
  if (organEnv === "1") return { silent: true, why: "headless organ" };
  if (forge && forge.concept && !forge.closed_at) {
    const h = (now - new Date(forge.started_at)) / 36e5;
    if (Number.isFinite(h) && h >= 0 && h <= FORGE_STALE_HOURS) {
      return { silent: true, why: "fresh forge session open — no system asks mid-concept (his rule #12); cards wait at matchday/full-time/close" };
    }
  }
  return { silent: false, why: null };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function gatherSources() {
  const contract = readJson(CONTRACT);
  const staged = contract && Array.isArray(contract.staged) ? contract.staged : [];
  let marketFile = null, marketHonest = "";
  try {
    const files = readdirSync(MARKET_DIR).filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort().reverse();
    if (files.length) {
      marketFile = files[0];
      const txt = readFileSync(join(MARKET_DIR, marketFile), "utf8");
      const m = txt.match(/\*\*Honest read:\*\*\s*([^\n]+)/i);
      if (m) marketHonest = m[1];
    }
  } catch { /* no market dir yet — no card */ }
  // P5.2 — the first Gate-2 flagged doubt not yet carded (read-only on tape_room.json;
  // doubtminer.mjs owns that file, this only reads the flags it wrote).
  let gate2 = null;
  try {
    const tape = readJson(join(STATE_DIR, "tape_room.json"));
    const q = (tape && Array.isArray(tape.queue)) ? tape.queue : [];
    const flagged = q.filter((x) => Array.isArray(x.gate2_flag) && x.gate2_flag.length);
    if (flagged.length) {
      const call = loadState();
      const carded = new Set(call.cards.filter((c) => c.source === "tape_room.gate2").map((c) => c.key));
      const nextDoubt = flagged.find((x) => !carded.has(`gate2:${x.capsule}:${x.doubt_index}`));
      if (nextDoubt) gate2 = { doubt: nextDoubt, total: flagged.length, fixed_or_carded: carded.size };
    }
  } catch { /* no tape room yet — no card */ }
  // THE MISSIONS DESK + benchmark (outward loop, 8 Aug 2026) — read-only pulls;
  // scout.mjs owns missions.json, benchmark.mjs owns benchmark.json. Absence of
  // either file = no cards, never an error.
  const missions = readJson(join(STATE_DIR, "missions.json"));
  const bench = readJson(join(STATE_DIR, "benchmark.json"));
  return { staged, marketFile, marketHonest, gate2, missions, bench };
}

function sync(now = new Date()) {
  const next = deriveCards(loadState(), gatherSources(), now);
  writeAtomic(CALL, next);
  return next;
}

// LAUNCH AUDIT A1 (9 Aug 2026): this used to send `confirm <idx+1>` — a positional
// number teaching_contract's dispatch has NEVER accepted (confirmFlag matches staged
// rule IDs), so every haan on a drift card would exit 1 while the card got consumed
// and the drift stayed staged forever. The args are now built by stagedDispatchArgs
// (pure, selftested): rule id + `--at`, so the owner drops the EXACT entry this card
// asked about — not the most recent entry sharing its rule id.
export function stagedDispatchArgs(verb, entry) {
  return [verb, entry.id, "--at", entry.at];
}
function runStagedDispatch(action) {
  // `at` is the stable identity — indexes renumber on every settle and id can repeat.
  const contract = readJson(CONTRACT);
  const staged = contract && Array.isArray(contract.staged) ? contract.staged : [];
  const entry = staged.find((e) => e.at === action.at);
  if (!entry) return { ok: false, settle: true, note: "resolved-at-source (staged entry already settled elsewhere)" };
  try {
    const out = execFileSync(process.execPath, [CONTRACT_MJS, ...stagedDispatchArgs(action.verb, entry)], { encoding: "utf8" });
    return { ok: true, settle: true, note: clip(out, 140) };
  } catch (e) {
    // A failed dispatch must NOT consume the card (that was the second half of the
    // blocker): his word stays unrecorded, so the card must come back at the next
    // anchor instead of dying with a "dispatch failed" epitaph.
    return { ok: false, settle: false, note: `dispatch failed: ${clip(e.message, 100)}` };
  }
}

function main() {
  const mode = process.argv[2] || "deal";
  const now = new Date();

  if (mode === "selftest") { process.exit(selftest() ? 0 : 1); }

  if (mode === "sync") {
    const s = sync(now);
    const live = s.cards.filter((c) => !c.answer && !c.retired_at).length;
    console.log(`captains_call: synced — ${live} live card(s)`);
    return;
  }

  if (mode === "deal") {
    const g = dealGuard({ organEnv: process.env.ARSENAL_ORGAN, forge: readJson(FORGE), now });
    if (g.silent) return;                       // silence is the default (hook path)
    const s = sync(now);
    const c = pickCard(s, { today: localDate(now) });
    if (!c) return;
    c.dealt.push(now.toISOString());
    writeAtomic(CALL, s);
    console.log(`🎴 CAPTAIN'S CALL [${c.id}]: ${c.line}`);
    console.log(`   → haan / na / baad  (bol de — session chala degi: node scripts/captains_call.mjs answer ${c.id} <word>)`);
    return;
  }

  if (mode === "answer") {
    const [, , , id, word] = process.argv;
    if (!id || !["haan", "na", "baad"].includes(word)) {
      console.error("captains_call: answer <id> <haan|na|baad>"); process.exit(1);
    }
    const { state, action } = applyAnswer(loadState(), id, word, now);
    if (action.kind === "error") { console.error(`captains_call: ${action.why}`); process.exit(1); }
    if (action.kind === "staged-dispatch") {
      const r = runStagedDispatch(action);
      if (!r.settle) {
        // his word did NOT land — discard the in-memory answer so the card
        // stays live and re-deals at the next anchor (A1, 9 Aug 2026).
        console.error(`captains_call: ${id} ${word} NOT recorded — ${r.note} (card stays live, agle anchor pe wapas)`);
        process.exit(1);
      }
      const c = state.cards.find((x) => x.id === id);
      c.resolution = r.note; c.retired_at = now.toISOString();
      writeAtomic(CALL, state);
      console.log(`captains_call: ${id} ${word} → ${r.note}`);
      return;
    }
    writeAtomic(CALL, state);
    if (action.kind === "sleep") console.log(`captains_call: ${id} sota hai — kal ke pehle anchor pe wapas (${action.until})`);
    else if (action.kind === "open") console.log(`captains_call: ${id} haan — read it now and walk him through it in ≤3 lines: ${action.path}`);
    else console.log(`captains_call: ${id} — ${action.resolution}`);
    return;
  }

  if (mode === "file") {
    const li = process.argv.indexOf("--line");
    const line = li >= 0 ? process.argv[li + 1] : "";
    if (!line) { console.error("captains_call: file --line \"<one-line ask>\""); process.exit(1); }
    const s = loadState();
    s.cards.push({
      id: `c${s.next_id++}`, key: `manual:${now.toISOString()}`, source: "hand-filed",
      line: clip(line, 140), dispatch: { kind: "none" },
      filed_at: now.toISOString(), dealt: [], answer: null, answered_at: null,
      sleep_until: null, retired_at: null, resolution: null,
    });
    writeAtomic(CALL, s);
    console.log(`captains_call: filed ${s.cards[s.cards.length - 1].id} — it deals at his next anchor`);
    return;
  }

  if (mode === "status") {
    const s = sync(now);
    const live = s.cards.filter((c) => !c.answer && !c.retired_at);
    const today = localDate(now);
    const sleeping = live.filter((c) => c.sleep_until && c.sleep_until >= today);
    const fresh = live.filter((c) => c.dealt.length === 0);
    console.log(`captains_call: ${live.length} pending (${fresh.length} naya, ${sleeping.length} sleeping) · answered ever: ${s.cards.filter((c) => c.answer).length}`);
    return;
  }

  if (mode === "list") {
    const s = loadState();
    for (const c of s.cards) {
      const st = c.retired_at ? `settled: ${clip(c.resolution, 60)}` : c.answer ? c.answer : c.sleep_until ? `sleeping→${c.sleep_until}` : "LIVE";
      console.log(`  ${c.id} [${c.source}] ${st}\n     ${c.line}`);
    }
    if (!s.cards.length) console.log("  (no cards ever)");
    return;
  }

  console.log("captains_call: sync | deal | answer <id> <haan|na|baad> | file --line \"…\" | status | list | selftest");
}

// ── SELFTEST — hermetic, fixture-driven, every check can fail ────────────────
function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };
  const T0 = new Date("2026-08-07T10:00:00+05:30");
  const blank = () => ({ version: 1, next_id: 1, cards: [] });
  const STAGED = [
    { id: "his-word", why: "axis a bina arg ke mark", at: "2026-08-06T12:58:45.685Z" },
    { id: "coverage", why: "aadha jawab", at: "2026-08-06T14:08:00.000Z" },
  ];

  console.log("== captains_call selftest ==\n");

  // derive
  const s1 = deriveCards(blank(), { staged: STAGED, marketFile: "2026-08-01.md", marketHonest: "no contradiction with existing scout" }, T0);
  assert("derive — one card per staged entry + one per market file, stable keys",
    s1.cards.length === 3 && s1.cards.filter((c) => c.key.startsWith("drift:")).length === 2
    && s1.cards.some((c) => c.key === "market:2026-08-01.md"));
  assert("derive — idempotent: a second sync adds NOTHING (keys are identity)",
    deriveCards(s1, { staged: STAGED, marketFile: "2026-08-01.md" }, T0).cards.length === 3);
  assert("derive — a card line is ONE line with the ask, never the whole report",
    s1.cards.every((c) => !c.line.includes("\n") && c.line.length <= 160));
  const gone = deriveCards(s1, { staged: [STAGED[1]], marketFile: "2026-08-01.md" }, T0);
  assert("derive — a staged entry settled at the source auto-retires its card (a card must not outlive its ask)",
    gone.cards.find((c) => c.key === `drift:${STAGED[0].at}`).retired_at !== null
    && gone.cards.find((c) => c.key === `drift:${STAGED[1].at}`).retired_at === null);

  // P5.2 — the gate2 doubt lane (7 Aug 2026)
  const G2 = { doubt: { capsule: "embeddings", doubt_index: 0, q_verbatim: "Map kaunsa hai? Ye map kya cheez hai?" }, total: 17, fixed_or_carded: 0 };
  const sg = deriveCards(blank(), { gate2: G2 }, T0);
  assert("GATE2 — one flagged doubt becomes ONE card, quote + regex-floor honesty in the line",
    sg.cards.length === 1 && sg.cards[0].source === "tape_room.gate2"
    && /Map kaunsa hai/.test(sg.cards[0].line) && /regex floor/.test(sg.cards[0].line) && /1\/17/.test(sg.cards[0].line));
  assert("GATE2 — serialized: while one gate2 card is LIVE, a second flagged doubt derives NOTHING",
    deriveCards(sg, { gate2: { ...G2, doubt: { capsule: "inference", doubt_index: 3, q_verbatim: "doosra" } } }, T0).cards.length === 1);
  assert("GATE2 — idempotent on the same doubt (key is identity)",
    deriveCards(sg, { gate2: G2 }, T0).cards.length === 1);
  assert("GATE2 — ranks AFTER staged drifts, BEFORE market (his confirmations first)",
    (() => { const mix = deriveCards(sg, { staged: [STAGED[0]], marketFile: "2026-08-01.md" }, T0);
      const first = pickCard(mix, { today: "2026-08-07" });
      const afterDrift = pickCard({ ...mix, cards: mix.cards.map((c) => c.key.startsWith("drift:") ? { ...c, answer: "haan" } : c) }, { today: "2026-08-07" });
      return first.key.startsWith("drift:") && afterDrift.source === "tape_room.gate2"; })());

  // pick
  assert("pick — ONE card, oldest staged before market (order, not a number)",
    pickCard(s1, { today: "2026-08-07" }).key === `drift:${STAGED[0].at}`);
  const withManual = { ...s1, cards: [...s1.cards, { id: "c9", key: "manual:x", source: "hand-filed", line: "x", dispatch: { kind: "none" }, filed_at: "2026-08-07T09:00:00Z", dealt: [], answer: null, answered_at: null, sleep_until: null, retired_at: null, resolution: null }] };
  assert("pick — a hand-filed card outranks everything (deliberate + rare)",
    pickCard(withManual, { today: "2026-08-07" }).id === "c9");
  assert("pick — nothing live ⇒ null (silence is the default)",
    pickCard(blank(), { today: "2026-08-07" }) === null);

  // answer
  const a1 = applyAnswer(s1, s1.cards[0].id, "baad", T0);
  assert("answer — 'baad' sleeps until the NEXT local day and stays unanswered",
    a1.action.kind === "sleep" && a1.action.until === "2026-08-08"
    && a1.state.cards[0].answer === null);
  assert("answer — a sleeping card does not deal today, and WAKES ON its wake day (B5: was >=, slept one day too long)",
    pickCard(a1.state, { today: "2026-08-07" }).id !== a1.state.cards[0].id
    && pickCard(a1.state, { today: "2026-08-08" }).id === a1.state.cards[0].id);
  const a2 = applyAnswer(s1, s1.cards[0].id, "haan", T0);
  assert("answer — haan on a drift card ⇒ staged-dispatch action carrying the stable `at` (never a stored index)",
    a2.action.kind === "staged-dispatch" && a2.action.verb === "confirm" && a2.action.at === STAGED[0].at);
  assert("A1 (9 Aug) — dispatch args are rule ID + --at, never a positional index",
    JSON.stringify(stagedDispatchArgs("confirm", { id: "his-word", at: "2026-08-07T10:00:00Z" }))
    === JSON.stringify(["confirm", "his-word", "--at", "2026-08-07T10:00:00Z"]));
  const a3 = applyAnswer(s1, s1.cards.find((c) => c.key.startsWith("market:")).id, "haan", T0);
  assert("answer — haan on the market card hands the PATH to the session (Claude reads, captain listens)",
    a3.action.kind === "open" && /brain_out\/market\/2026-08-01\.md$/.test(a3.action.path));
  assert("answer — a settled card refuses a second word",
    applyAnswer(a2.state, a2.state.cards[0].id, "na", T0).action.kind === "error");
  assert("answer — an unknown id is an error, never a silent no-op",
    applyAnswer(s1, "c404", "haan", T0).action.kind === "error");

  // THE MISSIONS DESK + benchmark (outward loop, 8 Aug 2026)
  const MISS_STAGED = { missions: [
    { id: "M01", type: "audit", file: "dressing-room/missions/M01__x.md", staged_at: "2026-08-08T09:00:00Z", ingested_at: null, report: null },
    { id: "M02", type: "audit", file: "dressing-room/missions/M02__x.md", staged_at: "2026-08-08T09:00:00Z", ingested_at: null, report: null },
  ], syllabus_audit: { closed_at: null } };
  const sm1 = deriveCards(blank(), { missions: MISS_STAGED }, T0);
  assert("MISSIONS — staged audit with zero returns ⇒ ONE fire-nudge card opening M01",
    sm1.cards.length === 1 && sm1.cards[0].key === "mission:audit-fire"
    && sm1.cards[0].dispatch.kind === "open" && /M01/.test(sm1.cards[0].dispatch.path));
  assert("MISSIONS — fire-nudge idempotent across syncs",
    deriveCards(sm1, { missions: MISS_STAGED }, T0).cards.length === 1);
  const MISS_RET = { missions: [
    { id: "M01", type: "audit", file: "f", staged_at: "2026-08-08T09:00:00Z", ingested_at: "2026-08-09T10:00:00Z", report: "scout_reports/mission_M01_2026-08-09.md" },
    { id: "M02", type: "audit", file: "f", staged_at: "2026-08-08T09:00:00Z", ingested_at: null, report: null },
    { id: "T-embeddings", type: "topic_open", file: "f", staged_at: "2026-08-08T09:00:00Z", ingested_at: "2026-08-09T11:00:00Z", report: "scout_reports/mission_T-EMBEDDINGS_2026-08-09.md" },
  ], syllabus_audit: { closed_at: null } };
  const sm2 = deriveCards(sm1, { missions: MISS_RET }, T0);
  assert("MISSIONS — a landed return auto-retires the fire-nudge (resolved at source)",
    sm2.cards.find((c) => c.key === "mission:audit-fire").retired_at !== null);
  assert("MISSIONS — one diff-review card per ingested return, dispatch opens the verbatim report",
    sm2.cards.filter((c) => c.key.startsWith("mission:diff:")).length === 2
    && sm2.cards.find((c) => c.key === "mission:diff:M01").dispatch.path.endsWith("mission_M01_2026-08-09.md"));
  assert("MISSIONS — diff line names his word as the only canon key",
    /aapke word/.test(sm2.cards.find((c) => c.key === "mission:diff:M01").line));
  const MISS_CLOSED = { ...MISS_RET, syllabus_audit: { closed_at: "2026-08-10T10:00:00Z" } };
  const sm3 = deriveCards(sm2, { missions: MISS_CLOSED }, T0);
  assert("MISSIONS — audit-close on his word auto-retires unanswered audit diff cards, topic diffs live on",
    sm3.cards.find((c) => c.key === "mission:diff:M01").retired_at !== null
    && sm3.cards.find((c) => c.key === "mission:diff:T-embeddings").retired_at === null);

  const sb1 = deriveCards(blank(), { bench: { date: "2026-08-15", regressions: ["bucket-2 RAG: held-cold 2 → 1 (embeddings cracked in Re-Jirah)", "bucket-5: chapters covered 3 → 2"] } }, T0);
  assert("BENCH — a regression day mints ONE card carrying the first regression + count of the rest",
    sb1.cards.length === 1 && sb1.cards[0].key === "benchmark:regression:2026-08-15"
    && /bucket-2 RAG/.test(sb1.cards[0].line) && /\+1 aur/.test(sb1.cards[0].line));
  assert("BENCH — no regressions ⇒ no card (silence is the default)",
    deriveCards(blank(), { bench: { date: "2026-08-15", regressions: [] } }, T0).cards.length === 0);
  assert("OUTWARD TIER — hand-filed and drifts still outrank mission/bench cards",
    (() => { const mix = deriveCards(sm1, { staged: [STAGED[0]], missions: MISS_STAGED }, T0);
      return pickCard(mix, { today: "2026-08-08" }).key.startsWith("drift:"); })());

  // deal guards
  assert("guard — ARSENAL_ORGAN=1 is silent (an organ must never be dealt his card)",
    dealGuard({ organEnv: "1", forge: null, now: T0 }).silent === true);
  assert("guard — a FRESH open forge session is silent (rule #12: no system asks mid-concept)",
    dealGuard({ organEnv: undefined, forge: { concept: "hallucinations", started_at: "2026-08-07T08:00:00+05:30" }, now: T0 }).silent === true);
  assert("guard — a STALE open session deals (staleness silences the pacer, never the call), and closed/no session deals",
    dealGuard({ organEnv: undefined, forge: { concept: "x", started_at: "2026-08-05T08:00:00+05:30" }, now: T0 }).silent === false
    && dealGuard({ organEnv: undefined, forge: { concept: "x", started_at: "2026-08-07T08:00:00+05:30", closed_at: "2026-08-07T09:00:00+05:30" }, now: T0 }).silent === false
    && dealGuard({ organEnv: undefined, forge: null, now: T0 }).silent === false);

  console.log(`\ncaptains_call selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { loadState, sync };
