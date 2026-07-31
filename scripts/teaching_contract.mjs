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
// when you are about to loose the context"): a turn counter is kept per forge session
// and a loud line fires at `context_warn_at`, so the warning is a MEASURED signal the
// machine raises, not a promise the model has to remember to keep.
//
// OWNER DISCIPLINE: this file is the sole writer of state/teaching_contract.json.
// `print` is HOOK-SAFE — it fails silent and always exits 0. A broken teaching contract
// must never be able to block his prompt.
//
// CLI: print | list | add <id> <line...> | hit <id> | drop <id> | reset-turns | selftest

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const STATE = join(ROOT, "dressing-room", "state", "teaching_contract.json");
const SPRINT = join(ROOT, "dressing-room", "state", "sprint.json");
const FORGE = join(ROOT, "dressing-room", "state", "forge_session.json");

const MAX_BLOCK_LINES = 5;      // the anti-wall law, this organ's own copy
const DEFAULT_WARN_AT = 40;

// ── SEED ──────────────────────────────────────────────────────────────────────
// These four are not invented: each is a drift that actually happened on 31 Jul and
// that he named himself. Everything after this comes in through `add`.
function seed(now = new Date()) {
  const ts = now.toISOString();
  const r = (id, line) => ({ id, line, hits: 0, last_hit: null, born: ts });
  return {
    version: 1,
    show_n: 2,
    context_warn_at: DEFAULT_WARN_AT,
    turns: { session_started_at: null, count: 0 },
    rules: [
      r("his-word", "Uska saaf bola hua instruction > meri samajh. Scope kaatna/badalna ho to PEHLE poochho, khud mat kaato."),
      r("hinglish", "HINGLISH — shuddh Hindi nahi. Technical shabd ANGREZI mein hi rehne dena."),
      r("terminology", "Asli terminology bolo (token · vocabulary · next-token · sampling · groundedness). Hindi anuvaad se naam mat badlo — analogy alag cheez hai, naam alag."),
      r("link-back", "Naya concept hamesha pehle band ho chuke concepts se NAAM le kar jodo."),
      r("decided", "Jo faisla wo pehle le chuka hai wo zinda hai — har naye message se intent dobara mat nikaalo."),
    ],
  };
}

// ── PURE CORE (no disk — the selftest never needs a file) ─────────────────────

function rank(rules) {
  // Worst offender first. Ties break on recency, then on birth order (stable).
  return [...rules].sort((a, b) =>
    (b.hits - a.hits)
    || String(b.last_hit || "").localeCompare(String(a.last_hit || ""))
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

function dropRule(state, id) {
  if (!state.rules.some((x) => x.id === id)) return { ok: false, why: `no rule "${id}"`, state };
  return { ok: true, state: { ...state, rules: state.rules.filter((x) => x.id !== id) } };
}

// A new forge session resets the turn clock; the same one keeps counting.
function bumpTurn(state, sessionStartedAt) {
  const t = state.turns || { session_started_at: null, count: 0 };
  const fresh = t.session_started_at !== (sessionStartedAt || null);
  return { ...state, turns: { session_started_at: sessionStartedAt || null, count: fresh ? 1 : t.count + 1 } };
}

function blockLines(state, done, now = new Date()) {
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

// ── DISK ──────────────────────────────────────────────────────────────────────

function load() {
  try {
    if (!existsSync(STATE)) return seed();
    const s = JSON.parse(readFileSync(STATE, "utf8"));
    if (!s || !Array.isArray(s.rules)) return seed();
    return s;
  } catch { return seed(); }
}

function save(s) {
  try {
    mkdirSync(dirname(STATE), { recursive: true });
    writeFileSync(STATE, JSON.stringify(s, null, 2) + "\n");
    return true;
  } catch { return false; }
}

function doneConcepts() {
  try {
    const sp = JSON.parse(readFileSync(SPRINT, "utf8"));
    const d = sp && sp.progress && Array.isArray(sp.progress.done) ? sp.progress.done : [];
    return d.map((x) => String(x).replace(/\s*\(finish\)\s*$/i, "").trim()).filter(Boolean);
  } catch { return []; }
}

function forgeStartedAt() {
  try {
    const f = JSON.parse(readFileSync(FORGE, "utf8"));
    return f && !f.closed_at ? (f.started_at || null) : null;
  } catch { return null; }
}

// ── SELFTEST ──────────────────────────────────────────────────────────────────

function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond) => { if (cond) { pass++; console.log(`  ok   ${name}`); } else { fail++; console.log(`  FAIL ${name}`); } };
  const T0 = new Date("2026-07-31T18:00:00Z");
  const base = seed(T0);

  assert("seed carries the five drifts he actually named", base.rules.length === 5);

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
  assert("add grows the set without touching this file", grown.ok && grown.state.rules.length === 6);
  assert("add refuses a duplicate id", addRule(grown.state, "no-praise", "x", T0).ok === false);
  assert("hit refuses an unknown id", hitRule(base, "nope", T0).ok === false);
  assert("drop removes", dropRule(base, "hinglish").state.rules.length === 4);

  const t1 = bumpTurn(base, "S1");
  assert("turn clock starts at 1 for a new session", t1.turns.count === 1);
  assert("same session keeps counting", bumpTurn(t1, "S1").turns.count === 2);
  assert("a NEW forge session resets the clock", bumpTurn(bumpTurn(t1, "S1"), "S2").turns.count === 1);

  const done = ["1-01 Embeddings", "1-02 Inference & sampling"];
  const lines = blockLines(t1, done, T0);
  assert("block names the closed concepts, derived from sprint.json — never typed here",
    lines.some((l) => l.includes("1-02 Inference & sampling")));
  assert("ANTI-WALL LAW — the block is never more than 5 lines, in any reachable state",
    (() => {
      let worst = 0;
      for (let t = 0; t < 60; t++) {
        let s = { ...base, turns: { session_started_at: "S", count: t }, show_n: 4 };
        worst = Math.max(worst, blockLines(s, done, T0).length);
      }
      return worst <= MAX_BLOCK_LINES;
    })());

  const warned = { ...base, turns: { session_started_at: "S", count: 40 } };
  assert("CONTEXT WARNING fires at the threshold, loudly",
    blockLines(warned, done, T0).some((l) => /CONTEXT WARNING/.test(l)));
  assert("…and stays quiet before it",
    !blockLines({ ...base, turns: { session_started_at: "S", count: 39 } }, done, T0).some((l) => /CONTEXT WARNING/.test(l)));
  assert("HOOK-SAFE — no rules injects nothing", blockLines({ rules: [] }, done, T0).length === 0);
  assert("HOOK-SAFE — garbage state injects nothing", blockLines(null, done, T0).length === 0);

  console.log(`\nteaching_contract selftest: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

// ── CLI ───────────────────────────────────────────────────────────────────────

const cmd = process.argv[2];
const arg = process.argv[3];

switch (cmd) {
  case "print": {                               // HOOK PATH — never throws, never blocks
    // SELF-INJECTION GUARD — same scar as forge_session.mjs:808. Headless organs run
    // `claude -p` inside this repo; without this they would be handed (and would bump
    // the turn clock of) the captain's teaching contract.
    if (process.env.ARSENAL_ORGAN === "1") process.exit(0);
    try {
      const s = bumpTurn(load(), forgeStartedAt());
      save(s);
      const lines = blockLines(s, doneConcepts());
      if (lines.length) console.log(lines.join("\n"));
    } catch { /* silence is the contract */ }
    process.exit(0);
  }
  case "list": {
    const s = load();
    console.log(`teaching_contract · ${s.rules.length} rules · turn ${(s.turns || {}).count || 0}/${s.context_warn_at || DEFAULT_WARN_AT}`);
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
  case "drop": {
    const res = dropRule(load(), arg);
    if (!res.ok) { console.error(`teaching_contract: ${res.why}`); process.exit(1); }
    save(res.state);
    console.log(`teaching_contract: dropped "${arg}"`);
    break;
  }
  case "reset-turns": {
    save({ ...load(), turns: { session_started_at: forgeStartedAt(), count: 0 } });
    console.log("teaching_contract: turn clock reset");
    break;
  }
  case "selftest": selftest(); break;
  default:
    console.log("teaching_contract: print | list | add <id> <line...> | hit <id> | drop <id> | reset-turns | selftest");
}
