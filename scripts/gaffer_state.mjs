#!/usr/bin/env node
// ---------------------------------------------------------------------------
// GAFFER_STATE — THE ROLLING STATE (B2) + THE STANDING INSTRUCTIONS (B8)
// ---------------------------------------------------------------------------
// SOLE WRITER of: dressing-room/state/gaffer_state.json      (rolling, per-sitting)
//                 dressing-room/state/gaffer_standing.json    (durable, survives all)
// Nothing else may write either file. Read them from anywhere.
//
// WHY THIS EXISTS — measured, from his own transcript of 12 Aug 2026
// (dressing-room/state/brain_out/dugout/2026-08-12.md, 93 CAPTAIN lines):
//   "Have you changed your key? Because you forgot what we were doing."
//   "you forgot completely what you were doing earlier"
//   "Oh my fucking god, you forgot that we were... telling me the structure"
//   "It was so frustrating you keep on forgetting every time."
//   "I am literally about to cry now because it's so frustrating"
// He said a variant of "you forgot" NINE times in one sitting. The Gaffer's
// memory is not breaking; its LIFE is. A tab opens, an instance is born, it
// talks, the tab closes, it dies — and a key rotation kills it mid-sentence.
//
// THE FAULT, EXACTLY (dugout.mjs). On quota, the page runs
//   reportFault(keyIdx) → nextKey() → dropResume('key rotation') → connect()
// and the fresh socket re-seeds from `CFG.rehydrate` — which was built ONCE, at
// PAGE LOAD, by buildConfig. Forty minutes into a sitting that snapshot is forty
// minutes stale, so the Gaffer wakes up believing the conversation is where it
// was when the tab opened. He diagnosed this himself before I found it.
//
// THE TWO LAWS THIS FILE OBEYS
//   · O(1) PER TURN. Never re-read the transcript. `observe` is handed the turn
//     DELTA the /transcript door already has in its hands, and touches only the
//     small state object. Cost is independent of how long he has been talking.
//   · SILENCE IS FREE (C3 principle 4). There is NO model call anywhere in the
//     per-turn path — every extraction here is deterministic pattern work. An
//     organ that spends tokens to conclude "nothing changed" is a defect.
//
// WHO ELSE COULD ACT ON THIS OUTPUT? (the standing design question, D)
//   · dugout.mjs   — /rehydrate re-seeds a rotated session from it (B1); the
//                    opening briefing (B4) and the live injection channel read it
//   · the supervisor (B3) — its whole input is this state + the last turn
//   · learnstate.mjs brief / captains_call — a sitting left mid-plan is a real
//                    open loop and belongs at the next anchor
//   · scoreboard / bootroom — a sitting that drifted is evidence
// ---------------------------------------------------------------------------
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const STATE = join(STATE_DIR, "gaffer_state.json");
const STANDING = join(STATE_DIR, "gaffer_standing.json");

const readJson = (p, d = null) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return d; } };
const writeJson = (p, o) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(o, null, 2)); };
// IST is his timeline — he put it in the ledger himself on 12 Aug ("I live in New
// Delhi so my time line is IST"). A sitting that crosses UTC midnight is still
// one evening to him.
const istDay = (d = new Date()) => new Date(d.getTime() + 5.5 * 3600000).toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// STANDING INSTRUCTIONS (B8) — what survives the session
// ---------------------------------------------------------------------------
// Today `set_depth` persists and an explicit "remember that…" persists (verified
// 12 Aug — all three facts he dictated to the Gaffer landed in the ledger).
// EVERYTHING ELSE DIES WITH THE SESSION: "dheere bolo", "ye mat karo", "pehle
// mujhse poocho". Those are the ones he had to repeat, and repeating himself is
// the thing he called frustrating.
//
// THE MARKERS ARE HIS OWN WORDS, taken from the transcript — not invented
// grammar. Each pattern below is followed by the line it was lifted from.
const PERMANENCE = [
  /\bhamesha\b/i,                    // "स्पीड हमेशा ही आपकी बोलने की धीरे होनी चाहिए"
  /हमेशा/,                            // same, in Devanagari — he switches script mid-sentence
  /\bpermanent(ly)?\b/i,             // "I want you to permanently remember this thing"
  /\balways\b/i,                     // "Every time you should use opus or sonnet"
  /\bevery ?time\b/i,
  /\bfrom now on(wards)?\b/i,        // "for all of the topics which we are going to cover from now onwards"
  /\bfor the rest of my life\b/i,    // "from the entire gapper from now onwards for the rest of my life"
  /\bnote (karo|kar lo|kar lena)\b/i,// "मेरे को हमेशा के लिए नोट करो"
  /\byaad rakh/i,
  /\bremember (this|that|it)\b/i,
  /के लिए नोट/,
  /\bnever\b/i,
  /\bkabhi (mat|nahi)\b/i,
];
// A prohibition is a standing instruction even without a permanence marker — he
// should not have to say "never do X, permanently". "mat karo" is enough.
const PROHIBITION = [/\bmat karo\b/i, /\bmat\b\s*\w+o\b/i, / मत /, /\bdo ?n[o']?t\b/i, /\bnahi chahiye\b/i, /\bnahi karna\b/i];

// The AXES a standing instruction can land on. Keeping them named (rather than
// storing free text alone) is what lets a LATER instruction on the same axis
// REPLACE an earlier one instead of piling up — he changes his mind out loud and
// a store that only ever appends would hand the Gaffer two contradictory laws.
const AXES = [
  { id: "pace",      test: /\b(dheere|dheere|slow|speed)\b|धीरे|स्पीड/i,                       label: "speaking pace" },
  { id: "intensity", test: /\bintensit|\bdepth\b|\bbreadth\b|\bbreath\b|इंटेंसिटी|डेप्थ/i,        label: "depth / intensity" },
  { id: "language",  test: /\b(hinglish|english|hindi|accent|british|bihari)\b|एक्सेंट|इंग्लिश/i, label: "language / accent" },
  { id: "verbatim",  test: /\bverbatim\b|word (by|to) word|वर्बेटिम|वर्ड बाय वर्ड/i,               label: "verbatim vs samjhao" },
  { id: "interact",  test: /\binteractiv|\bquestion|\bpoochh?o\b|इंटरेक्टिव/i,                    label: "interactivity" },
  { id: "brain",     test: /\buse brain\b|\bopus\b|\bsonnet\b|\bcall brain\b/i,                 label: "which brain to use" },
  { id: "map",       test: /\bstrategy\b|\bstructure\b|\bplan\b|स्ट्रेटजी|स्ट्रक्चर/i,             label: "declare the map first" },
];
const axisOf = (text) => (AXES.find(a => a.test.test(text)) || { id: "general", label: "general" });

// A DIRECTIVE marker — the line must actually TELL THE GAFFER to do something.
// MEASURED, not assumed (12 Aug 2026): permanence-or-prohibition ALONE was run over
// his real 228-line transcript and returned 10 laws, of which FOUR were noise —
//   "Ja, vor, ja, vor… we don't need to do it anymore."      (garbled, matched "don't")
//   "You got my point? … from now onwards for the rest of my life?"  (a question)
//   "It was so frustrating you keep on forgetting every time."       (a complaint)
//   "We never talked about 104 hallucination…"                       (matched "never")
// A 40% false-positive rate matters here in a way it would not in a log: this text
// is INJECTED into his live context window, so noise costs tokens AND dilutes the
// six real laws sitting beside it. Requiring a directive drops all four.
const DIRECTIVE = [
  /\bi want you to\b/i,                     // "I want you to permanently remember this thing"
  /\bnote (it down|karo|kar lo|kar lena)\b/i,// "I want you to note it down permanently"
  /नोट कर/, /\byaad rakh/i, /\bremember (this|that|it)\b/i,
  /\byou should\b/i, /\bevery ?time you\b/i, // "Every time you should use opus or sonnet"
  /\bkeep (the|your|it|yourself)\b/i,        // "keep the intensity as much as possible"
  /\bchahiye\b/i, /चाहिए/,                   // "स्पीड … धीरे होनी चाहिए"
  /\b(karo|karna|rakho|rakhna|bolo|bolna|batao|padho)\b/i,
  /रखना|रखो|करो|करना|बोलिए|बोलो|बताओ/,
  /\bmat\b/i, / मत /,                         // "Mere ko rejeera mat batao"
  /\bdo ?n[o']?t\b/i,
];
// …and lines that carry a marker but are plainly NOT laws. Each entry is here
// because it fired on a real line above, not because it might.
const NOT_A_LAW = [
  /\bwe do ?n[o']?t (need|have to)\b/i,   // "we don't need to do it anymore" — momentary, and "we", not "you"
  /\bit was\b/i,                          // "It was so frustrating…" — a report about the past
  /\byou keep on forgetting\b/i,
];

// isStanding — does this captain line create a law that must outlive the session?
export function isStanding(text) {
  const t = String(text || "").trim();
  if (t.length < 8) return false;                       // "Hello." is not a law
  if (/^(hello|haan|yes|ok|okay|no|nope)\b[.!? ]*$/i.test(t)) return false;
  if (NOT_A_LAW.some(r => r.test(t))) return false;
  if (!DIRECTIVE.some(r => r.test(t))) return false;    // it must TELL him something
  return PERMANENCE.some(r => r.test(t)) || PROHIBITION.some(r => r.test(t));
}

// A DECLARED PLAN is him naming the SHAPE of the sitting. B7 is the Gaffer owing
// him one; this is the machine noticing when one has been agreed, so a rotation
// cannot lose it. His, verbatim: "टोकेनाइजेशन से स्टार्ट करना ऑब्वियसली टोकेनाइजेशन
// देन एम्बेडिंग देन इन्फरेंस सैंपलिंग देन कॉन्टेक्स्ट विंडो।"
const PLAN_MARKERS = [/\bthen\b.*\bthen\b/i, /देन.*देन/, /\bphir\b.*\bphir\b/i, /→/, /\bstart karna\b/i, /\bstart (with|karenge)\b/i, /\bfirst\b.*\bthen\b/i];
export const looksLikePlan = (t) => PLAN_MARKERS.some(r => r.test(String(t || "")));

// ---------------------------------------------------------------------------
// THE ROLLING STATE
// ---------------------------------------------------------------------------
export function emptyState(now = new Date()) {
  return {
    day: istDay(now), opened_at: now.toISOString(), last_turn_at: null,
    turns: 0, captain_turns: 0,
    declared_plan: null,        // { text, at } — the SHAPE he was promised (B7)
    where: null,                // the "you are here" marker
    covered: [],                // what this sitting has actually closed
    open_question: null,        // his last unanswered question
    last_captain_line: null,
    repeats: [],                // { text, count } — an idea he has raised more than once
    forgot_flags: 0,            // how many times he has had to say "you forgot"
    reseeds: 0,                 // how many times this sitting was re-seeded (rotation/reload)
    _writer: "gaffer_state.mjs",
  };
}

// HE SAID IT TWICE — the single strongest signal in the whole transcript. A2/A3:
// escalation rides HIS WORDS, not a score. Normalised hard so "what were we
// talking about?" and "Bhai, what were we talking about?" are the same idea.
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-zऀ-ॿ ]+/g, " ").replace(/\s+/g, " ").trim();
const FORGOT = /\bforgot|\bforget|bhul (gaye|gaya)|भूल गए|\bdrifting\b|\byaad nahi\b|keep on forgetting/i;
const CONFUSED = /samajh nahi aaya|समझ नहीं आया|\bnot understanding\b|\bdidn.?t (get|understand)\b|\brepeat\b/i;

// observe — THE PER-TURN CALL. O(state), never O(transcript).
// `lines` is the delta the /transcript door already holds: ["CAPTAIN: …", "GAFFER: …"].
export function observe(state, lines, now = new Date(), standing = null) {
  const s = state && state.day === istDay(now) ? { ...state } : emptyState(now);
  const st = standing || readJson(STANDING, { instructions: [], _writer: "gaffer_state.mjs" });
  const newStanding = [];
  for (const raw of (lines || [])) {
    const line = String(raw || "");
    s.turns++;
    s.last_turn_at = now.toISOString();
    if (!/^CAPTAIN:/i.test(line)) continue;
    const text = line.replace(/^CAPTAIN:\s*/i, "").trim();
    if (!text) continue;
    s.captain_turns++;
    s.last_captain_line = text.slice(0, 400);
    if (FORGOT.test(text)) s.forgot_flags++;
    if (CONFUSED.test(text)) s.open_question = text.slice(0, 300);
    if (looksLikePlan(text) && text.length > 25) s.declared_plan = { text: text.slice(0, 600), at: now.toISOString() };
    // repeats — the second time an idea appears, it is a FLAG, not a coincidence
    const k = norm(text).split(" ").slice(0, 12).join(" ");
    if (k.length > 12) {
      const hit = s.repeats.find(r => r.key === k);
      if (hit) { hit.count++; hit.last_at = now.toISOString(); }
      else s.repeats.push({ key: k, text: text.slice(0, 200), count: 1, last_at: now.toISOString() });
    }
    if (isStanding(text)) {
      const ax = axisOf(text);
      const rec = { axis: ax.id, label: ax.label, text: text.slice(0, 400), at: now.toISOString(), day: istDay(now) };
      // LATER WINS ON THE SAME AXIS (see AXES above) — but a general instruction
      // never silently swallows another general one; those accumulate.
      if (ax.id !== "general") st.instructions = st.instructions.filter(i => i.axis !== ax.id);
      st.instructions.push(rec);
      newStanding.push(rec);
    }
  }
  // keep the repeat list bounded — a sitting is a few hundred turns, not a database
  if (s.repeats.length > 200) s.repeats = s.repeats.slice(-200);
  return { state: s, standing: st, newStanding };
}

// brief — the state rendered for a MACHINE mouth. This is what a rotated session
// is re-seeded with (B1) and what the supervisor (B3) reads. Deliberately terse:
// it rides INTO a live context window, so every line must earn its tokens.
export function renderBrief(state, standing, { forRotation = false } = {}) {
  const s = state || emptyState();
  const st = standing || { instructions: [] };
  const L = [];
  L.push(forRotation
    ? "[CONTINUITY — the line dropped and reconnected. You did NOT lose the conversation. Do NOT recap, do NOT greet, do NOT ask where you were. Carry on from exactly here:]"
    : "[SITTING STATE]");
  if (s.declared_plan) L.push(`AGREED PLAN (you promised him this shape): ${s.declared_plan.text}`);
  if (s.where) L.push(`YOU ARE HERE: ${s.where}`);
  if (s.covered && s.covered.length) L.push(`ALREADY COVERED this sitting (do NOT redo): ${s.covered.join(" · ")}`);
  if (s.open_question) L.push(`HIS LAST UNRESOLVED POINT — go back to it: ${s.open_question}`);
  if (s.last_captain_line) L.push(`HIS LAST WORDS: ${s.last_captain_line}`);
  const rep = (s.repeats || []).filter(r => r.count > 1).sort((a, b) => b.count - a.count).slice(0, 3);
  if (rep.length) L.push(`HE HAS SAID THESE MORE THAN ONCE (the first answer did not land): ${rep.map(r => `"${r.text}" ×${r.count}`).join(" · ")}`);
  if (st.instructions && st.instructions.length) {
    L.push("STANDING INSTRUCTIONS — he gave these out loud and they do NOT expire:");
    for (const i of st.instructions.slice(-12)) L.push(`  · [${i.label}] ${i.text}`);
  }
  if (s.forgot_flags > 0) L.push(`⚠ He has had to tell you "you forgot" ${s.forgot_flags}× today. Do not make it ${s.forgot_flags + 1}.`);
  return L.join("\n");
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function load() { return { state: readJson(STATE, null), standing: readJson(STANDING, { instructions: [], _writer: "gaffer_state.mjs" }) }; }
function save(state, standing) { writeJson(STATE, state); if (standing) writeJson(STANDING, standing); }

async function main() {
  const cmd = (process.argv[2] || "brief").toLowerCase();
  const { state, standing } = load();

  if (cmd === "observe") {
    // lines arrive on argv or stdin — the bridge calls the in-process export, not this
    const lines = process.argv.slice(3);
    const r = observe(state, lines, new Date(), standing);
    save(r.state, r.standing);
    console.log(`gaffer_state: ${r.state.turns} turns · ${r.state.captain_turns} his · plan ${r.state.declared_plan ? "SET" : "none"} · standing ${r.standing.instructions.length}${r.newStanding.length ? ` (+${r.newStanding.length} new: ${r.newStanding.map(i => i.label).join(", ")})` : ""}`);
    return;
  }
  if (cmd === "brief") { console.log(renderBrief(state, standing, { forRotation: process.argv.includes("--rotation") })); return; }
  if (cmd === "where") {
    const where = process.argv.slice(3).join(" ");
    const s = state || emptyState();
    if (!where) { console.log(s.where || "(no marker set)"); return; }
    s.where = where.slice(0, 300);
    if (!s.covered.includes(where)) s.covered.push(where.slice(0, 120));
    save(s, standing); console.log(`gaffer_state: you-are-here → ${s.where}`); return;
  }
  if (cmd === "reseed") { const s = state || emptyState(); s.reseeds++; save(s, standing); console.log(`gaffer_state: reseed #${s.reseeds} recorded`); return; }
  if (cmd === "standing") {
    if (!standing.instructions.length) { console.log("gaffer_state: no standing instructions yet — he has not given one out loud since this store was built."); return; }
    for (const i of standing.instructions) console.log(`  [${i.axis}] ${i.day} — ${i.text}`);
    return;
  }
  if (cmd === "forget") {
    const axis = process.argv[3];
    if (!axis) { console.error("usage: gaffer_state.mjs forget <axis>"); process.exit(1); }
    const before = standing.instructions.length;
    standing.instructions = standing.instructions.filter(i => i.axis !== axis);
    save(state || emptyState(), standing);
    console.log(`gaffer_state: dropped ${before - standing.instructions.length} standing instruction(s) on axis "${axis}"`); return;
  }
  if (cmd === "selftest") return selftest();
  console.error("usage: gaffer_state.mjs [observe <lines…>|brief [--rotation]|where <text>|reseed|standing|forget <axis>|selftest]");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// SELFTEST — in the SAME commit as the organ (C3 principle 7). Zero live calls.
// Every fixture below is a REAL line from his 12 Aug transcript.
// ---------------------------------------------------------------------------
function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond) => { if (cond) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name); } };
  const T0 = new Date("2026-08-12T06:30:00.000Z");

  // --- standing detection, on his own words
  assert("HIS WORDS — 'हमेशा' makes a line standing (speed, said 4× because it never stuck)",
    isStanding("भाई स्पीड हमेशा ही आपकी बोलने की धीरे होनी चाहिए। हर चीज में जब समझाओ चले"));
  assert("HIS WORDS — 'permanently remember this thing' is standing",
    isStanding("I want you to permanently remember this thing. I am not preparing for this field to compete in the market."));
  assert("HIS WORDS — 'मेरे को हमेशा के लिए नोट करो' is standing",
    isStanding("हां, ठीक है। मेरे को हमेशा के लिए नोट करो। ब्रेन में जाना चाहिए दैट अ रिवीजन में भी इंटेंसिटी शुड बी हाई।"));
  assert("a bare greeting is NOT a law", !isStanding("Hello.") && !isStanding("Hello hello.") && !isStanding("haan"));
  assert("a one-off question is NOT a law", !isStanding("So what time is it right now?"));

  // THE FOUR FALSE POSITIVES, held by source. Permanence-or-prohibition alone
  // returned 10 laws over his real 228-line transcript and FOUR were noise. This
  // text is injected into his live window, so each one cost tokens and diluted the
  // six real laws beside it. Any loosening of DIRECTIVE/NOT_A_LAW brings them back.
  assert("NOISE — garbled audio carrying a stray 'don't' is not a law",
    !isStanding("Ja, vor, ja, vor, ja, vor, ja, vor. Äh, we don't need to do it anymore."));
  assert("NOISE — a QUESTION carrying 'from now onwards' is not a law",
    !isStanding("You You got my point? Like what what is my aim from the entire organism and from the entire gapper from now onwards for the rest of my life?"));
  assert("NOISE — a complaint about the past carrying 'every time' is not a law",
    !isStanding("It was so frustrating you keep on forgetting every time."));
  assert("NOISE — 'we never talked about X' is a correction, not a standing law",
    !isStanding("We never talked about 104 hallucination. What were we talking about? Go and find it out."));
  // …and the six REAL ones still stand, so the tightening was precision, not recall loss.
  assert("KEPT — 'Every time you should use opus or sonnet' survives the tightening",
    isStanding("By go into the brain and find out everything. Go into the brain use opus now. Every time you should use opus or sonnet. Do not rely on your semantic things it's pathetic."));
  assert("KEPT — 'mat batao' (a Hinglish prohibition) survives",
    isStanding("Mere ko rejeera mat batao. I am saying the your strategy for revising all of the topics"));

  // --- the axis rule: later wins, so two contradictory laws can never both stand
  {
    let { state, standing } = observe(emptyState(T0), ["CAPTAIN: धीरे बोलो भाई, स्पीड हमेशा धीरे रखो"], T0, { instructions: [] });
    ({ state, standing } = observe(state, ["CAPTAIN: ab thoda normal speed pe bolo, hamesha"], T0, standing));
    const paceLaws = standing.instructions.filter(i => i.axis === "pace");
    assert("LATER WINS on one axis — he changes his mind out loud and the store never holds two contradictory laws", paceLaws.length === 1 && /normal speed/.test(paceLaws[0].text));
  }

  // --- the plan survives, which is the whole of B1
  {
    const plan = "CAPTAIN: टोकेनाइजेशन से स्टार्ट करना ऑब्वियसली टोकेनाइजेशन देन एम्बेडिंग देन इन्फरेंस सैंपलिंग देन कॉन्टेक्स्ट विंडो।";
    const { state, standing } = observe(emptyState(T0), [plan], T0, { instructions: [] });
    assert("A DECLARED PLAN IS CAPTURED — the exact line he had to repeat three times", !!state.declared_plan && /टोकेनाइजेशन/.test(state.declared_plan.text));
    const brief = renderBrief(state, standing, { forRotation: true });
    assert("B1 — the rotation brief carries the plan and forbids a recap", brief.includes("AGREED PLAN") && brief.includes("Do NOT recap") && /टोकेनाइजेशन/.test(brief));
  }

  // --- "you forgot" is counted, because he said it nine times in one sitting
  {
    const lines = ["CAPTAIN: Have you changed your key? Because you forgot what we were doing.",
                   "CAPTAIN: are you drifting? because you forgot completely what you were doing earlier.",
                   "CAPTAIN: It was so frustrating you keep on forgetting every time."];
    const { state } = observe(emptyState(T0), lines, T0, { instructions: [] });
    assert("HE SAID 'YOU FORGOT' — every instance is counted, not just noticed", state.forgot_flags === 3);
    assert("the brief SAYS the count back, so the next turn knows the cost of a fourth", renderBrief(state, null).includes("3×"));
  }

  // --- A3: escalation by HIS WORDS. The second time is the signal.
  {
    const l = "CAPTAIN: Bhai, what were we talking about? Do you have that in mind?";
    let r = observe(emptyState(T0), [l], T0, { instructions: [] });
    r = observe(r.state, [l], T0, r.standing);
    const rep = r.state.repeats.find(x => x.count > 1);
    assert("A3 — a REPEATED idea is flagged the second time, deterministically (never a score)", !!rep && rep.count === 2);
    assert("and the brief names it as 'the first answer did not land'", renderBrief(r.state, null).includes("MORE THAN ONCE"));
  }

  // --- "samajh nahi aaya" must never be walked past
  {
    const { state } = observe(emptyState(T0), ["CAPTAIN: bhai samajh nahi aaya, phir se batao"], T0, { instructions: [] });
    assert("B3 — 'samajh nahi aaya' becomes the OPEN point, so the next turn goes back to it", !!state.open_question);
  }

  // --- the two hard laws of this file
  {
    const big = Array.from({ length: 500 }, (_, i) => `CAPTAIN: line number ${i} of a very long sitting indeed`);
    const t0 = process.hrtime.bigint();
    const { state } = observe(emptyState(T0), big, T0, { instructions: [] });
    const t1 = process.hrtime.bigint();
    assert("O(1)-PER-TURN — 500 turns of state work stays trivial (never re-reads a transcript)", Number(t1 - t0) / 1e6 < 250 && state.repeats.length <= 200);
    // SILENCE IS FREE, held STRUCTURALLY. A text search for "claude -p" fails here
    // for a funny reason — the search string is itself in the file, so the assertion
    // matches its own source and can never go green. The real property is narrower
    // and stronger anyway: this organ cannot reach a model because it cannot reach
    // the network or a subprocess. The needles are built by concatenation so this
    // check does not trip over its own text the same way.
    const src = readFileSync(new URL(import.meta.url), "utf8");
    const imports = src.split(/\r?\n/).filter(l => /^import /.test(l)).join(" ");
    const forbidden = ["child" + "_process", "node:" + "http", "claude" + "gen.mjs", "brain" + ".mjs"];
    assert("SILENCE IS FREE — no model call is even REACHABLE: no subprocess, no network, no brain import",
      forbidden.every(n => !imports.includes(n)) && !src.includes("fetch" + "("));
  }

  // --- a new day is a new sitting, but the standing store is NOT reset
  {
    const old = { ...emptyState(new Date("2026-08-11T06:00:00Z")), turns: 40, forgot_flags: 5 };
    const { state, standing } = observe(old, ["CAPTAIN: hello"], T0, { instructions: [{ axis: "pace", label: "speaking pace", text: "dheere bolo", at: "x", day: "2026-08-11" }] });
    assert("a NEW DAY starts a clean sitting", state.turns === 1 && state.forgot_flags === 0 && state.day === istDay(T0));
    assert("B8 — but a standing instruction SURVIVES the day, the reconnect and the rotation", standing.instructions.length === 1);
  }

  console.log(`\ngaffer_state selftest: ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
}

// The house pattern (captains_call.mjs, mirror.mjs), and it is guarded for a real
// reason: argv[1] is UNDEFINED under `node -e` / `node --input-type=module`, and an
// unguarded .replace() there throws before a single export can be imported. The
// bridge imports this module — a crash here would take the whole dugout down.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
