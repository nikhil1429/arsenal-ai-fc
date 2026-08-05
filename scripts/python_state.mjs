#!/usr/bin/env node
// ============================================================================
// scripts/python_state.mjs · ARSENAL AI FC — THE PYTHON TRACK STATE
// ----------------------------------------------------------------------------
// WHAT: sole writer of dressing-room/state/python_state.json — WHICH Python subtopic
//   he is standing on, which tier it belongs to, its fluency rung, when its CLOSE-SIGN
//   fired, the JS-hangover watch-list, and the last CLOSE-PACKET emitted.
//   Deterministic · zero-LLM · zero-network · zero-dependency · empty-safe.
//
// WHY (5 Aug 2026, audit #107 item #26): the Python track is `sprint.json`'s biggest
//   rock — 1-07 (16h, "Biggest rock — spreads into S2") and 2-10 — and it had NO state
//   file at all. GEMINI_LOOP.md §13.4 gives Claude a standing job on this track ("har
//   subtopic-close pe PACKET v2 emit · fluency-state track 🔴/🟡/🟢 · WATCH-LIST LEDGER
//   own + HAR packet mein inject · kaunsa subtopic due-for-volume") and §11.4 says the
//   ledger must be thread-agnostic. All of it lived in chat. A fresh thread inherited
//   nothing, so on the day he starts Python the machine would ASK him where he is —
//   the same defect audit #35 fixed for the course tracker.
//
// NOTHING HERE WAS DESIGNED. Every rule below is lifted from canon, cited in place:
//   · the six fields          — the captain's own shape, HANDOFF_audit107.md §4.3
//   · SUBTOPIC = the daily unit, TIER = a milestone with NO capsule, foundations-concept
//     = never on Python                                        — GEMINI_LOOP.md §11.3
//   · 🔴 learning · 🟡 held · 🟢 fluent (dṛḍhabhūmi)             — GEMINI_LOOP.md §12.1
//   · fluency is DECLARED with a reason, never computed         — GEMINI_LOOP.md §11.4
//     ("State read: 🔴/🟡 + 1-line kyun — FINAL call Claude ka")
//   · 🟢 only on load-bearing CORE, peripheral stops at 🟡       — GEMINI_LOOP.md §12.4
//     + PYTHON_SYLLABUS.md §0 (selective fluency) — the CORE list is canon's, not mine
//   · Bolo light/optional on raw fundamentals, non-negotiable on core + FinOps
//                                                               — GEMINI_LOOP.md §11.0
//   · the FLOOR: a bad day is WARM + 1 drill + 1 Bolo, never zero — GEMINI_LOOP.md §13.2
//   · tier list + which tiers are core                          — PYTHON_SYLLABUS.md §2-3
//
// NO INVENTED NUMBERS (his standing rule, 1 Aug 2026: "koi bhi number GUESS karke mat
//   lagao... 30-45-60 din ka asli data jama karo, PHIR number tay karo"). There is not
//   one threshold in this file. Fluency does not advance on a rep count — he declares it
//   and must say why, exactly as the handoff shape prescribes. What the file DOES do is
//   record the raw rounds so that in 30-45 days there is real data to set a rule from.
//
// IT WARNS, IT NEVER BLOCKS. Two canon pace-guards fire here — 🟢 on a peripheral
//   subtopic (§12.4) and a missing Bolo on a core subtopic (§11.0). Both print loudly and
//   record `guard_warnings` on the entry; neither refuses the write. Precedent is the
//   captain's D7 (5 Aug): no auto-close, "his agency, not the machine's". A guard that
//   overrides him is a guard that gets worked around.
//
// THE WATCH-LIST BOUNDARY (read this before adding a second one).
//   GEMINI_LOOP v2.4 says the packet watch-list is a MIRROR of the canonical ledger-keeper
//   — "ek store, ek write-authority, do projection" — and in THIS repo ledger-keeper
//   reconciles to `weaknesses.json` / `nemesis.mjs` (MASTERPLAN reconciliation table).
//   That store is NOT duplicated here. It derives concept MISSES from `reps_log.jsonl`
//   (gate: 20 reps). A JS-hangover arriving in a Gemini 📋 HANDOFF never enters reps_log,
//   so nemesis structurally cannot hold it and today it has no store anywhere. This
//   watch_list is that missing store and ONLY that: Python-track JS-hangovers, by name,
//   with ×N counts (§11.2's packet template asks for exactly that). Different signal,
//   different producer, zero overlap. If a JS-hangover ever starts flowing through
//   reps_log, nemesis is the owner and this list must become its reader, not its rival.
//
// STATE (single writer, atomic temp→rename). The captain's six fields are the contract;
//   `subtopics` / `tiers` / `version` / `updated_at` are ADDITIVE and load-bearing, the
//   same way course.mjs's `current_at` is: `subtopic`+`fluency` are scalars, so without a
//   history every close would destroy the previous subtopic's rung — and §11.3 TIER-close
//   needs "saare subtopic 🟢/🟡" to be answerable. Consumers may ignore the extras.
//   { version, subtopic|null, tier|null, fluency, close_sign_at|null,
//     watch_list: [ { name, count, first_seen, last_seen } ],
//     last_packet: { subtopic, tier, emitted_at, drills, state_target }|null,
//     subtopics: [ { name, tier, fluency, why, bolo, floor, closed_at, rounds,
//                    guard_warnings[] } ],
//     tiers:     [ { tier, artifact, closed_at } ],
//     updated_at }
//
// HOOK-SAFE: `status` · `brief` · `json` never throw and always exit 0 — a state file must
//   never be the thing that blocks his prompt. The write verbs DO exit non-zero on a
//   refusal, because a refusal he cannot see is a refusal that did not happen.
//
// CLI: subtopic <name> [--tier T0] | close <name> [--fluency 🟡|held] [--why "..."]
//        [--bolo done|skipped] [--floor] | tier-close <tier> --artifact "..."
//      | watch <name> | unwatch <name> | packet <name> [--drills 5] [--target 🟡]
//      | status | brief | json | selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const STATE = join(STATE_DIR, "python_state.json");
const VERSION = 1;

// ---------------------------------------------------------------------------
// CANON TABLES — copied from the two canon files, never inferred.
// ---------------------------------------------------------------------------

// GEMINI_LOOP.md §12.1. The rung IS the emoji in canon; the words are typing aliases
// only, because entering an emoji in a Windows terminal is its own small tax.
export const FLUENCY = ["🔴", "🟡", "🟢"];
const FLUENCY_ALIAS = {
  "🔴": "🔴", red: "🔴", learning: "🔴",
  "🟡": "🟡", yellow: "🟡", held: "🟡",
  "🟢": "🟢", green: "🟢", fluent: "🟢", dridhabhumi: "🟢",
};
const FLUENCY_LABEL = { "🔴": "🔴 learning", "🟡": "🟡 held", "🟢": "🟢 fluent (dṛḍhabhūmi)" };

// PYTHON_SYLLABUS.md §2-3, in order. `core` = the load-bearing build-skills canon names
// in §0 + GEMINI_LOOP §12.4 (Pydantic · FastAPI · async · API+error-handling · parsers ·
// data-manip) — these are the ONLY tiers allowed to climb to 🟢. T0 raw fundamentals and
// the Phase-B peripherals stop at 🟡 by canon's own pace-guard, not by my opinion.
export const TIERS = [
  { tier: "T0",    title: "Python Core, JS-bridged",             phase: "A", core: false },
  { tier: "T0.5",  title: "Classes / OOP",                       phase: "A", core: true  },
  { tier: "T1",    title: "Pydantic v2",                         phase: "A", core: true  },
  { tier: "T2",    title: "FastAPI Essentials",                  phase: "A", core: true  },
  { tier: "T3",    title: "async Essentials",                    phase: "A", core: true  },
  { tier: "T4-lite", title: "anthropic SDK + Structured Output", phase: "A", core: true  },
  { tier: "T3+",   title: "async Depth",                         phase: "B", core: true  },
  { tier: "T4-full", title: "openai SDK + Cost + Vector Clients", phase: "B", core: true  },
  { tier: "T5",    title: "pandas / numpy / eval (LIGHT)",       phase: "B", core: false },
  { tier: "T6",    title: "pytest / logging / Docker",           phase: "B", core: false },
  { tier: "Interview-Polish", title: "decorators · context managers · comprehensions · GIL", phase: "B", core: false },
];
const TIER_IDS = TIERS.map((t) => t.tier);
export const isCoreTier = (tier) => !!(TIERS.find((t) => t.tier === tier) || {}).core;

// ---------------------------------------------------------------------------
// PURE CORE — everything testable lives here; disk is the thin layer below.
// ---------------------------------------------------------------------------

export function emptyState() {
  return {
    version: VERSION,
    subtopic: null, tier: null, fluency: "🔴", close_sign_at: null,
    watch_list: [], last_packet: null,
    subtopics: [], tiers: [], updated_at: null,
  };
}

export function normalizeFluency(v) {
  if (v === undefined || v === null) return null;
  const k = String(v).trim().toLowerCase();
  return FLUENCY_ALIAS[k] || FLUENCY_ALIAS[String(v).trim()] || null;
}

export function normalizeTier(v) {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const raw = String(v).trim();
  const hit = TIER_IDS.find((t) => t.toLowerCase() === raw.toLowerCase());
  return hit || null;
}

// THE THREE-GRAIN GUARD (§11.3). "Python close = light. Foundations close = bhaari.
// Kabhi mat mix karo." The overwhelm canon warns about comes from mixing the grains, so
// any capsule/Jirah/axis word aimed at this organ is refused by NAME, loudly. This is the
// one hard refusal in the file, because it is canon's one "KABHI nahi".
const CAPSULE_WORDS = /\b(capsule|jirah|9-axis|nine-axis|axis|tempered|re-?jirah|forge)\b/i;
export function capsuleGuard(text) {
  const m = CAPSULE_WORDS.exec(String(text || ""));
  return m ? { ok: false, why: `"${m[0]}" is Forge grammar — GEMINI_LOOP §11.3: the 9-axis capsule ritual is NEVER run on Python. Python closes LIGHT (subtopic) or as a TIER milestone. Foundations concepts go to forge_session.mjs.` } : { ok: true };
}

// WATCH-LIST — a repeat-mistake ledger is only worth having if it COUNTS repeats
// (§11.2 asks the packet for "repeat-mistakes by name, ×N counts"), so a second sighting
// increments rather than duplicating. Matching is case-insensitive on the trimmed name:
// "dict access" and "Dict Access" are the same hangover and must not split the count.
export function addWatch(list, name, at) {
  const clean = String(name || "").trim();
  if (!clean) return { ok: false, why: "watch: a hangover needs a name" };
  const out = (list || []).map((w) => ({ ...w }));
  const hit = out.find((w) => String(w.name).trim().toLowerCase() === clean.toLowerCase());
  if (hit) { hit.count = (Number(hit.count) || 1) + 1; hit.last_seen = at; }
  else out.push({ name: clean, count: 1, first_seen: at, last_seen: at });
  // Most-repeated first: the packet injects the top offenders, so the order IS the signal.
  out.sort((a, b) => (b.count - a.count) || String(a.name).localeCompare(String(b.name)));
  return { ok: true, list: out, repeat: !!hit };
}

export function dropWatch(list, name) {
  const clean = String(name || "").trim().toLowerCase();
  const out = (list || []).filter((w) => String(w.name).trim().toLowerCase() !== clean);
  return { ok: out.length !== (list || []).length, list: out };
}

// THE CLOSE (§11.3 SUBTOPIC close = packet CLOSE-SIGN, LIGHT, roz-ka unit → 🟡 Held).
// Re-closing the same subtopic is ADDITIVE: `rounds` increments and the rung is updated
// in place. That is how 🟡→🟢 actually happens — §12.3 says the volume reps that earn 🟢
// come on LATER days, so a second close must never read as a second subtopic.
export function closeSubtopic(state, input = {}, now = new Date().toISOString()) {
  const name = String(input.name || "").trim();
  if (!name) return { ok: false, why: "close: which subtopic?" };
  const guard = capsuleGuard(name);
  if (!guard.ok) return guard;

  const fluency = input.fluency === undefined ? "🟡" : normalizeFluency(input.fluency);
  if (!fluency) return { ok: false, why: `close: fluency must be 🔴|🟡|🟢 (or red|held|fluent) — got "${input.fluency}"` };

  const prev = (state.subtopics || []).find((s) => s.name.toLowerCase() === name.toLowerCase());
  const tier = normalizeTier(input.tier) || (prev ? prev.tier : state.tier) || null;
  if (input.tier && !normalizeTier(input.tier)) {
    return { ok: false, why: `close: unknown tier "${input.tier}" — PYTHON_SYLLABUS tiers are ${TIER_IDS.join(" · ")}` };
  }

  // §11.4 — the state read always carries "1-line kyun". Without it the rung is a claim
  // with no evidence, and in 30 days there is nothing to tune a real rule from.
  const why = String(input.why || "").trim();
  if (!why) return { ok: false, why: `close: --why is required (GEMINI_LOOP §11.4 — the state read is "🔴/🟡 + 1-line kyun"). A rung with no reason is a rung with no evidence.` };

  const warnings = [];
  // PACE-GUARD 1 (§12.4 selective fluency). Peripheral drilled to 🟢 = reps on the wrong rock.
  if (fluency === "🟢" && tier && !isCoreTier(tier)) {
    warnings.push(`🟢 on ${tier} — §12.4 SELECTIVE FLUENCY: 🟢 is for load-bearing core only (Pydantic · FastAPI · async · API+error-handling · parsers · data-manip). Peripheral stops at 🟡 or "look it up". Recorded anyway — your call.`);
  }
  // PACE-GUARD 2 (§11.0 BOLO-POLICY gradient). Raw T0 fundamentals: Bolo light/optional,
  // skip is guilt-free. Core build-skills: Bolo is the interview-defense muscle, never skipped.
  const bolo = input.bolo === undefined || input.bolo === null ? null : String(input.bolo).trim().toLowerCase();
  if (tier && isCoreTier(tier) && bolo !== "done" && !input.floor) {
    warnings.push(`Bolo not marked done on ${tier} — §11.0 BOLO-POLICY: on CORE build-skills Bolo is NON-NEGOTIABLE (cold-explain is the interview-defense muscle). On raw T0 fundamentals it is light/optional. Recorded anyway — your call.`);
  }

  const entry = {
    name, tier, fluency, why,
    bolo: bolo || (input.floor ? "floor-day" : null),
    // §13.2 THE FLOOR — a bad day recorded as a floor-day keeps the chain alive and is
    // NOT a failed close. Naming it is the anti-spiral; hiding it is what breaks nairantarya.
    floor: !!input.floor,
    closed_at: now,
    rounds: prev ? (Number(prev.rounds) || 1) + 1 : 1,
    guard_warnings: warnings,
  };
  const subtopics = (state.subtopics || []).filter((s) => s.name.toLowerCase() !== name.toLowerCase());
  subtopics.push(entry);

  return {
    ok: true, warnings, entry,
    state: { ...state, subtopic: name, tier, fluency, close_sign_at: now, subtopics, updated_at: now },
  };
}

// THE TIER CLOSE (§11.3 MILESTONE). "saare subtopic 🟢/🟡 + tier-artifact COLD likha +
// Bolo. NO capsule." The artifact is mandatory and the 🔴 check is a real gate — but it
// reports, it does not refuse, for the same D7 reason as everything else here.
export function closeTier(state, tier, artifact, now = new Date().toISOString()) {
  const t = normalizeTier(tier);
  if (!t) return { ok: false, why: `tier-close: unknown tier "${tier}" — ${TIER_IDS.join(" · ")}` };
  const art = String(artifact || "").trim();
  if (!art) return { ok: false, why: `tier-close: --artifact is required (§11.3 — a tier closes on the artifact written COLD, e.g. T0 = the invoice calculator bina dekhe).` };
  const mine = (state.subtopics || []).filter((s) => s.tier === t);
  const warnings = [];
  if (!mine.length) warnings.push(`no subtopics recorded under ${t} — closing a tier with nothing closed inside it.`);
  const red = mine.filter((s) => s.fluency === "🔴").map((s) => s.name);
  if (red.length) warnings.push(`${red.length} subtopic(s) still 🔴 under ${t}: ${red.join(" · ")} — §11.3 wants all 🟢/🟡 at a tier close. Recorded anyway — your call.`);
  const tiers = (state.tiers || []).filter((x) => x.tier !== t);
  tiers.push({ tier: t, artifact: art, closed_at: now, subtopics: mine.length });
  return { ok: true, warnings, state: { ...state, tiers, updated_at: now } };
}

// ---------------------------------------------------------------------------
// THE ADDRESS — the one-call reader, shaped exactly like course.mjs's courseBrief().
// ---------------------------------------------------------------------------

export function statusLine(state) {
  if (!state || !state.subtopic) {
    const n = (state && state.subtopics || []).length;
    return n
      ? `python: no current subtopic — ${n} closed · \`node scripts/python_state.mjs subtopic <name> --tier T0\``
      : "python: not started — `node scripts/python_state.mjs subtopic <name> --tier T0` when 1-07 opens";
  }
  const t = state.tier ? ` [${state.tier}]` : "";
  const held = (state.subtopics || []).filter((s) => s.fluency !== "🔴").length;
  const total = (state.subtopics || []).length;
  return `python: ${state.subtopic}${t} — ${FLUENCY_LABEL[state.fluency] || state.fluency} · ${held}/${total} subtopics at 🟡+`;
}

export function pythonBrief(state) {
  try {
    const s = state || loadState().state;
    const line = statusLine(s);
    if (!s || !s.subtopic) {
      return { present: false, line, subtopic: null, tier: null, fluency: s ? s.fluency : "🔴", watch_list: (s && s.watch_list) || [], closed: (s && s.subtopics || []).length, tiers_closed: (s && s.tiers || []).length, last_packet: null };
    }
    return {
      present: true, line,
      subtopic: s.subtopic, tier: s.tier, fluency: s.fluency,
      fluency_label: FLUENCY_LABEL[s.fluency] || s.fluency,
      close_sign_at: s.close_sign_at,
      // §13.4 — the ledger must travel into every session and every packet. Top 3 is what
      // the brief's 5-line anti-wall law affords; the full list is one `json` away.
      watch_list: (s.watch_list || []).slice(0, 3).map((w) => `${w.name} ×${w.count}`),
      watch_total: (s.watch_list || []).length,
      closed: (s.subtopics || []).length,
      tiers_closed: (s.tiers || []).length,
      last_packet: s.last_packet,
      core_tier: isCoreTier(s.tier),
    };
  } catch {
    // Same law as courseBrief(): unreadable reads as "not present", loudly-but-safely.
    return { present: false, line: "python: unreadable — `node scripts/python_state.mjs status` for the reason", subtopic: null, tier: null, fluency: "🔴", watch_list: [], closed: 0, tiers_closed: 0, last_packet: null };
  }
}

// ---------------------------------------------------------------------------
// DISK — thin, always guarded.
// ---------------------------------------------------------------------------

export function loadState(path = STATE) {
  try {
    if (!existsSync(path)) return { ok: true, fresh: true, state: emptyState() };
    const raw = readFileSync(path, "utf8");
    if (!raw.trim()) return { ok: true, fresh: true, state: emptyState() };
    const j = JSON.parse(raw);
    if (!j || typeof j !== "object") return { ok: false, why: "python_state.json is not an object", state: emptyState() };
    return { ok: true, fresh: false, state: { ...emptyState(), ...j } };
  } catch (e) {
    return { ok: false, why: `python_state.json unreadable (${(e && e.message) || e})`, state: emptyState() };
  }
}

// atomic: temp → rename, temp unique per process AND per call (capture.mjs's scar — a
// fixed `path + ".tmp"` lets two live writers rename each other's half-written file).
let tmpSeq = 0;
export function writeAtomic(obj, path = STATE) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.${++tmpSeq}.${Date.now().toString(36)}.tmp`;
  try {
    writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
    renameSync(tmp, path);
  } catch (e) {
    try { rmSync(tmp, { force: true }); } catch { /* best-effort; the throw below is the truth */ }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// SELFTEST — unrun = hypothesis.
// ---------------------------------------------------------------------------

function selftest() {
  let pass = 0, fail = 0;
  const assert = (n, c) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; console.log(`  FAIL ${n}`); } };
  const NOW = "2026-08-05T12:00:00.000Z";
  const S0 = emptyState();

  assert("EMPTY ENVELOPE — the captain's six fields exist before anything is written",
    ["subtopic", "tier", "fluency", "close_sign_at", "watch_list", "last_packet"].every((k) => k in S0)
    && S0.fluency === "🔴" && Array.isArray(S0.watch_list) && S0.last_packet === null);

  assert("FLUENCY — the emoji is canon, the words are aliases, junk is refused",
    normalizeFluency("🟡") === "🟡" && normalizeFluency("held") === "🟡"
    && normalizeFluency("FLUENT") === "🟢" && normalizeFluency("done") === null);

  assert("TIERS — the syllabus list is honoured and an unknown tier is refused",
    normalizeTier("t0.5") === "T0.5" && normalizeTier("T4-lite") === "T4-lite" && normalizeTier("T9") === null);

  assert("SELECTIVE FLUENCY — canon's own core list: T1/T2/T3 core, T0 and T5 are not",
    isCoreTier("T1") && isCoreTier("T2") && isCoreTier("T3") && !isCoreTier("T0") && !isCoreTier("T5"));

  // §11.3 — the one hard refusal in the file.
  assert("THREE-GRAIN GUARD — Forge grammar is refused BY NAME on the Python track",
    !capsuleGuard("f-strings capsule").ok && !capsuleGuard("jirah on dicts").ok
    && capsuleGuard("dicts vs JS objects").ok);

  assert("CLOSE — needs a name, needs a reason (§11.4 '1-line kyun'), refuses a bad tier",
    !closeSubtopic(S0, { name: "" }).ok
    && !closeSubtopic(S0, { name: "dicts" }).ok
    && !closeSubtopic(S0, { name: "dicts", why: "clean", tier: "T99" }).ok);

  const c1 = closeSubtopic(S0, { name: "dicts vs JS objects", tier: "T0", why: "D1-D5 clean, slow on .get()" }, NOW);
  assert("CLOSE — the daily unit lands on 🟡 Held by default (§11.3 subtopic close)",
    c1.ok && c1.state.fluency === "🟡" && c1.state.subtopic === "dicts vs JS objects"
    && c1.state.tier === "T0" && c1.state.close_sign_at === NOW && c1.entry.rounds === 1);

  assert("CLOSE — a T0 raw fundamental with NO Bolo is silent (§11.0: light/optional there)",
    c1.warnings.length === 0);

  const core = closeSubtopic(S0, { name: "BaseModel", tier: "T1", why: "wrote it cold" }, NOW);
  assert("PACE-GUARD 2 — a CORE close with no Bolo WARNS (§11.0 non-negotiable) but still writes",
    core.ok && core.warnings.some((w) => /BOLO-POLICY/.test(w)) && core.state.subtopic === "BaseModel");
  assert("PACE-GUARD 2 — the same close WITH Bolo done is silent",
    closeSubtopic(S0, { name: "BaseModel", tier: "T1", why: "cold", bolo: "done" }, NOW).warnings.length === 0);

  const periph = closeSubtopic(S0, { name: "f-strings", tier: "T0", why: "fast+cold", fluency: "🟢", bolo: "done" }, NOW);
  assert("PACE-GUARD 1 — 🟢 on a PERIPHERAL tier warns (§12.4) and is recorded anyway (D7 agency)",
    periph.ok && periph.state.fluency === "🟢" && periph.warnings.some((w) => /SELECTIVE FLUENCY/.test(w))
    && periph.entry.guard_warnings.length === 1);
  assert("PACE-GUARD 1 — 🟢 on a CORE tier is silent, which is the whole point of selectivity",
    closeSubtopic(S0, { name: "gather", tier: "T3", why: "cold+fast", fluency: "🟢", bolo: "done" }, NOW).warnings.length === 0);

  // §12.3 — 🟢 is earned by volume reps on LATER days, so a re-close must be the SAME row.
  const c2 = closeSubtopic(c1.state, { name: "Dicts vs JS Objects", why: "cold and fast now", fluency: "🟢" }, "2026-08-09T12:00:00.000Z");
  assert("RE-CLOSE IS ADDITIVE — round 2 updates the SAME subtopic, never forks a duplicate",
    c2.ok && c2.state.subtopics.length === 1 && c2.entry.rounds === 2 && c2.state.fluency === "🟢");
  assert("RE-CLOSE — the tier is inherited, so he never re-types it",
    c2.state.tier === "T0" && c2.entry.tier === "T0");

  // §13.2
  const fl = closeSubtopic(S0, { name: "loops", tier: "T1", why: "floor day — warm + 1 drill", floor: true }, NOW);
  assert("THE FLOOR — a floor-day is recorded as a floor-day, guilt-free, and suppresses the Bolo nag",
    fl.ok && fl.entry.floor === true && fl.entry.bolo === "floor-day" && fl.warnings.length === 0);

  // §11.2 — "repeat-mistakes by name, ×N counts"
  let wl = addWatch([], "dict .get() vs obj.key", NOW);
  assert("WATCH-LIST — a first sighting lands at ×1", wl.ok && wl.list[0].count === 1 && wl.repeat === false);
  wl = addWatch(wl.list, "Dict .Get() vs Obj.Key", "2026-08-06T00:00:00.000Z");
  assert("WATCH-LIST — case-insensitive: a repeat INCREMENTS, it does not split the count",
    wl.list.length === 1 && wl.list[0].count === 2 && wl.repeat === true && wl.list[0].first_seen === NOW);
  wl = addWatch(wl.list, "i++ muscle memory", NOW);
  assert("WATCH-LIST — most-repeated sorts first (the packet injects top offenders)",
    wl.list.length === 2 && wl.list[0].count === 2 && wl.list[1].count === 1);
  assert("WATCH-LIST — a hangover can be retired when it stops repeating",
    dropWatch(wl.list, "I++ MUSCLE MEMORY").ok && dropWatch(wl.list, "i++ muscle memory").list.length === 1
    && !dropWatch(wl.list, "never seen").ok);
  assert("WATCH-LIST — a nameless hangover is refused", !addWatch([], "   ").ok);

  // §11.3 tier close
  assert("TIER-CLOSE — the COLD artifact is mandatory, an unknown tier is refused",
    !closeTier(S0, "T0", "").ok && !closeTier(S0, "T77", "x").ok);
  const tc = closeTier(c1.state, "T0", "invoice calculator, Aristo Eco → GST → total, bina dekhe", NOW);
  assert("TIER-CLOSE — a milestone records the artifact and NO capsule is created",
    tc.ok && tc.state.tiers[0].artifact.startsWith("invoice calculator") && !("capsule" in tc.state));
  const tcRed = closeTier(closeSubtopic(S0, { name: "sets", tier: "T0", why: "shaky", fluency: "🔴" }, NOW).state, "T0", "artifact", NOW);
  assert("TIER-CLOSE — a still-🔴 subtopic under the tier is NAMED (§11.3) but does not block",
    tcRed.ok && tcRed.warnings.some((w) => /still 🔴/.test(w)));

  assert("PURITY — closeSubtopic never mutates the state it was handed",
    JSON.stringify(S0) === JSON.stringify(emptyState()));

  // The reader contract other organs depend on.
  const b0 = pythonBrief(emptyState());
  assert("BRIEF — an empty track reports present:false HONESTLY, and says the next command",
    b0.present === false && /not started/.test(b0.line) && b0.subtopic === null);
  const b1 = pythonBrief({ ...c1.state, watch_list: wl.list });
  assert("BRIEF — a live track carries subtopic + tier + rung + the top watch-list",
    b1.present === true && b1.subtopic === "dicts vs JS objects" && b1.tier === "T0"
    && b1.fluency === "🟡" && b1.watch_list[0] === "dict .get() vs obj.key ×2" && b1.watch_total === 2);
  assert("BRIEF — never throws, whatever it is handed", pythonBrief(null).present === false && pythonBrief({}).present === false);

  assert("STATUS LINE — always a have/need shape, never a bare word (audit #100/#106 law)",
    /0\/0|\d+\/\d+/.test(statusLine(c1.state)) && /not started/.test(statusLine(emptyState())));

  // UNRUN = HYPOTHESIS — the write path is exercised for real against a temp file.
  assert("THE WRITE PATH — state round-trips through disk and reads back identical",
    (() => {
      const p = join(STATE_DIR, `.python_state.selftest.${process.pid}.json`);
      try {
        writeAtomic(c1.state, p);
        const back = loadState(p);
        const okr = back.ok && back.state.subtopic === "dicts vs JS objects" && back.state.fluency === "🟡";
        rmSync(p, { force: true });
        return okr;
      } catch { try { rmSync(p, { force: true }); } catch {} return false; }
    })());
  assert("READER IS SAFE — a missing file is a fresh empty state, never a crash",
    loadState(join(STATE_DIR, "__no_such_python_state__.json")).state.subtopic === null);

  console.log(`\npython_state selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function flag(name, argv) { const i = argv.indexOf("--" + name); return i >= 0 ? argv[i + 1] : undefined; }
function has(name, argv) { return argv.includes("--" + name); }

function commit(next, warnings = []) {
  writeAtomic(next);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
  console.log(statusLine(next));
}

function main() {
  const argv = process.argv.slice(2);
  const cmd = (argv[0] || "").toLowerCase();
  const now = new Date().toISOString();

  // HOOK PATHS FIRST — never throw, always exit 0.
  if (cmd === "status") { try { console.log(statusLine(loadState().state)); } catch { /* silence is the contract */ } process.exit(0); }
  if (cmd === "brief")  { try { console.log(JSON.stringify(pythonBrief())); } catch { console.log(JSON.stringify({ present: false, line: "python: unavailable" })); } process.exit(0); }
  if (cmd === "json")   { try { console.log(JSON.stringify(loadState().state, null, 2)); } catch { console.log(JSON.stringify(emptyState(), null, 2)); } process.exit(0); }
  if (cmd === "selftest") process.exit(selftest() ? 0 : 1);

  const { ok, why, state } = loadState();
  if (!ok) { console.error(`python_state: ${why}`); process.exit(1); }

  if (cmd === "subtopic") {
    const name = argv[1];
    if (!name) { console.error("python_state: subtopic <name> [--tier T0]"); process.exit(1); }
    const g = capsuleGuard(name);
    if (!g.ok) { console.error(`python_state: ${g.why}`); process.exit(1); }
    const tierArg = flag("tier", argv);
    const tier = tierArg ? normalizeTier(tierArg) : state.tier;
    if (tierArg && !tier) { console.error(`python_state: unknown tier "${tierArg}" — ${TIER_IDS.join(" · ")}`); process.exit(1); }
    const prev = (state.subtopics || []).find((s) => s.name.toLowerCase() === String(name).toLowerCase());
    commit({ ...state, subtopic: String(name).trim(), tier: tier || null, fluency: prev ? prev.fluency : "🔴", close_sign_at: prev ? prev.closed_at : null, updated_at: now });
    return;
  }

  if (cmd === "close") {
    const r = closeSubtopic(state, {
      name: argv[1], tier: flag("tier", argv), fluency: flag("fluency", argv),
      why: flag("why", argv), bolo: flag("bolo", argv), floor: has("floor", argv),
    }, now);
    if (!r.ok) { console.error(`python_state: ${r.why}`); process.exit(1); }
    console.log(`🏁 CLOSE-SIGN — ${r.entry.name}${r.entry.tier ? ` [${r.entry.tier}]` : ""} → ${FLUENCY_LABEL[r.entry.fluency]} (round ${r.entry.rounds})${r.entry.floor ? " · FLOOR day, chain zinda" : ""}`);
    commit(r.state, r.warnings);
    return;
  }

  if (cmd === "tier-close") {
    const r = closeTier(state, argv[1], flag("artifact", argv), now);
    if (!r.ok) { console.error(`python_state: ${r.why}`); process.exit(1); }
    console.log(`🏁 TIER MILESTONE — ${normalizeTier(argv[1])} closed on a COLD artifact. NO capsule (§11.3).`);
    commit(r.state, r.warnings);
    return;
  }

  if (cmd === "watch" || cmd === "unwatch") {
    const name = argv.slice(1).filter((a) => !a.startsWith("--")).join(" ");
    const r = cmd === "watch" ? addWatch(state.watch_list, name, now) : dropWatch(state.watch_list, name);
    if (!r.ok) { console.error(`python_state: ${cmd === "watch" ? r.why : `"${name}" is not on the watch-list`}`); process.exit(1); }
    if (cmd === "watch") { const hit = r.list.find((w) => w.name.toLowerCase() === name.trim().toLowerCase()); console.log(`⚠️ watch-list: ${hit.name} ×${hit.count}${r.repeat ? " (repeat — inject it in the next packet)" : ""}`); }
    else console.log(`watch-list: "${name}" retired.`);
    commit({ ...state, watch_list: r.list, updated_at: now });
    return;
  }

  if (cmd === "packet") {
    const name = argv[1] || state.subtopic;
    if (!name) { console.error("python_state: packet <subtopic> — nothing current to record"); process.exit(1); }
    const last_packet = {
      subtopic: String(name).trim(), tier: state.tier, emitted_at: now,
      drills: Number(flag("drills", argv)) || 5,          // §11.2's template is a 5-drill packet
      state_target: normalizeFluency(flag("target", argv)) || "🟡",
      watch_injected: (state.watch_list || []).slice(0, 3).map((w) => `${w.name} ×${w.count}`),
    };
    console.log(`📦 packet recorded — ${last_packet.subtopic} · ${last_packet.drills} drills · target ${last_packet.state_target}`
      + (last_packet.watch_injected.length ? `\n   ⚠️ injected: ${last_packet.watch_injected.join(" · ")}` : "\n   ⚠️ watch-list empty — observe today, name the hangovers in the handoff"));
    commit({ ...state, last_packet, updated_at: now });
    return;
  }

  console.log(`python_state: subtopic <name> [--tier T0] | close <name> [--fluency held|🟢] --why "..." [--bolo done] [--floor]
                    | tier-close <tier> --artifact "..." | watch <name> | unwatch <name>
                    | packet [<name>] [--drills 5] [--target 🟡] | status | brief | json | selftest
  tiers: ${TIER_IDS.join(" · ")}   (core → 🟢 allowed: ${TIERS.filter((t) => t.core).map((t) => t.tier).join(" · ")})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
export { selftest };
