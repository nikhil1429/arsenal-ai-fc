#!/usr/bin/env node
// learn_digest.mjs — THE ONE SCREEN a study session boots from (22 Sep 2026, his word "please make it right now").
//
// WHY THIS EXISTS (measured, forks ruling row 242): the Desktop /learn session of 22 Sep held 204,096 cached
// tokens BEFORE its first teaching word — the skill body, SAMJHAO_MERGED, VISUAL_CONTRACT, the forge skill twice,
// the act skill, sitting.mjs — and re-ran all of it every turn. LAW T: a deterministic render is free and better.
// The architect role got the same cure on 8 Sep (boot_digest, row 153). This is the study lane's.
//
// WHAT IT IS:  TIER 0 · zero tokens · READ-ONLY over the state bus and the capsule mirror · one render ≤ 16 KB.
//              It WRITES NOTHING. Every owner keeps its file (forge_session.mjs owns forge_session.json, mirror.mjs
//              owns capsules/, learnstate.mjs owns learning_state.json).
// WHAT IT IS NOT: a replacement for the canon. The canon stands where it is (L9); the digest tells the session
//              WHERE to look when a step needs the exact wording, so nothing is loaded that this turn does not need.
//
// Usage:  node scripts/learn_digest.mjs            # the screen
//         node scripts/learn_digest.mjs --json     # the same facts as JSON (for a checker)
//         node scripts/learn_digest.mjs selftest   # renders on the live state, checks the contract below
//
// THE CONTRACT (selftest): rendered ≤ 16,384 bytes · the resume pointer appears VERBATIM when a session is open ·
// no markdown table row in the render (his "no tables" ruling — the screen may be pasted to him) · the four live
// duties are present · the bank line carries the live concept:axis · the day is opened and ended by code (no hand-typed
// sitting open, no judge-round before the close — unit mday2) · exit 0 with or without an open session.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
// the legal moment kinds are the pacer's OWN list (forks row 266): printed from it, never typed here
import { MOMENTS, STEPS } from "./forge_session.mjs";
// the day's END line is day.mjs's OWN (unit mday2, forks row 1089 (2)): printed from its one home, never a copy here
import { END_LINE } from "./day.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATE = path.join(ROOT, "dressing-room", "state");
const CAPSULES = path.join(STATE, "capsules");
const CRASH_BELT = "C:/Users/nikhi/arsenal-samjhao"; // out of repo by his 14 Aug privacy law; optional here
const CAP_BYTES = 16384;

const STEP_NAMES = STEPS.map((s, i) => `${i} ${s}`);   // forks row 649 (0): read from THE METHOD's one home, never a copy
const AXES = "abcdefghi".split("");

const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "")); } catch { return null; } };
const ist = (iso) => { const d = new Date(iso); if (isNaN(d)) return "?"; return new Date(d.getTime() + 330 * 60000).toISOString().replace("T", " ").slice(0, 16) + " IST"; };
const hoursSince = (iso) => { const t = Date.parse(iso); return isNaN(t) ? null : (Date.now() - t) / 3600000; };
const one = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

// his revision decks (his word, 15 Nov 2026): saved under Downloads\AI\<topic>, served read-only by
// .claude/deck_server.mjs on 127.0.0.1:4791 so the Browser pane opens them live, with his annotation tools.
// "merko thodi yaad rahega har bari kab kya bolna hain" — so the boot finds the newest deck itself and says open it.
const DECK_ROOT = "C:/Users/nikhi/Downloads/AI";
const DECK_PORT = 4791;
function newestDeck(concept) {
  try {
    const hits = [];
    for (const d of fs.readdirSync(DECK_ROOT, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      for (const f of fs.readdirSync(path.join(DECK_ROOT, d.name))) {
        if (!/\.html?$/i.test(f)) continue;
        if (concept && !f.toLowerCase().startsWith(concept.toLowerCase() + "__")) continue;
        hits.push({ dir: d.name, file: f, mtime: fs.statSync(path.join(DECK_ROOT, d.name, f)).mtimeMs });
      }
    }
    if (!hits.length) return null;
    hits.sort((a, b) => b.mtime - a.mtime);
    const h = hits[0];
    return { dir: h.dir, file: h.file, url: `http://localhost:${DECK_PORT}/${encodeURIComponent(h.dir)}/${encodeURIComponent(h.file)}` };
  } catch { return null; }   // no Downloads\AI on this machine is a state, not an error
}

// ---- gather ---------------------------------------------------------------------------------------------------
export function gather() {
  const fsx = readJson(path.join(STATE, "forge_session.json"));
  const open = !!(fsx && fsx.concept && !fsx.closed_at);
  const concept = open ? fsx.concept : null;
  const axis = open ? (fsx.current_axis || null) : null;
  const done = open ? (fsx.axes_done || []) : [];
  const deferred = open ? (fsx.axes_deferred || []) : [];
  const left = AXES.filter((a) => !done.includes(a) && !deferred.includes(a));
  const capsule = concept ? readJson(path.join(CAPSULES, concept + ".json")) : null;
  const line = capsule && axis ? (capsule.faultLines || []).find((f) => f.axis === axis) : null;

  // the per-axis doubt map lives on the crash belt (TOKENIZATION_BLOCKS.md, "THE DOUBT MAP"); optional, read-only
  let doubtMap = null;
  if (concept) {
    const p = path.join(CRASH_BELT, concept.toUpperCase() + "_BLOCKS.md");
    try {
      const txt = fs.readFileSync(p, "utf8");
      const rows = [...txt.matchAll(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([a-i])\s*\|\s*([A-Z]+)\s*\|\s*([^|]+?)\s*\|\s*$/gm)];
      if (rows.length) doubtMap = rows.map((m) => ({ n: +m[1], short: m[2], axis: m[3], kind: m[4], beat: m[5] }));
    } catch { /* absent is a state, not an error */ }
  }
  const doubtsAll = capsule ? (capsule.doubts || []) : [];
  const doubtsHere = doubtMap && axis
    ? doubtMap.filter((d) => d.axis === axis).map((d) => ({ ...d, q: doubtsAll[d.n - 1]?.q, a: doubtsAll[d.n - 1]?.a }))
    : null;

  const learning = readJson(path.join(STATE, "learning_state.json"));
  const watch = learning && Array.isArray(learning.weaknesses) ? learning.weaknesses.slice(0, 6) : null;

  return { now: new Date().toISOString(), open, concept, step: open ? fsx.step : null, axis, done, deferred, left,
    pointer: open ? fsx.resume_pointer : null, resumes: open ? (fsx.resumes || []).length : 0,
    lastTouchH: open ? hoursSince(fsx.updated_at) : null, moments: open ? fsx.question_moments : null,
    checkQPass: open ? fsx.check_q_this_pass : null, checkQRefused: open ? fsx.check_q_refused : null,
    momentsByAxis: open ? fsx.moments_by_axis : null,
    capsule: capsule ? { id: capsule.id, status: capsule.status, doubts: doubtsAll.length, traps: (capsule.traps || []).length,
      line: line ? { title: line.title, strike: line.strike } : null, traps_list: capsule.traps || [],
      calibration: capsule.calibration || "", doubtsHere, doubtMapFound: !!doubtMap } : null,
    watch, deck: newestDeck(concept) };
}

// ---- render ---------------------------------------------------------------------------------------------------
export function render(g) {
  const L = [];
  const push = (s = "") => L.push(s);
  push(`LEARN DIGEST · ${ist(g.now)} · read from disk by code, nothing typed · TIER 0 · this screen replaces the canon READ, not the canon`);
  push("");
  if (!g.open) {
    push("POSITION · NO FORGE SESSION IS OPEN. Route by state, never by chat:");
    let nextup = "";
    try { nextup = execFileSync(process.execPath, [path.join(ROOT, "scripts", "learnstate.mjs"), "nextup"], { encoding: "utf8", timeout: 60000 }); } catch (e) { nextup = "  (learnstate nextup did not answer: " + one(e.message, 120) + ")"; }
    push(nextup.trim().split("\n").slice(0, 12).map((l) => "  " + l).join("\n"));
    push("  → a CONCEPT task = `node scripts/forge_session.mjs start <concept>` then re-run this digest. Python/course tasks: /learn REFERENCE.md §1 by track.");
  } else {
    const stepName = STEP_NAMES[g.step] || String(g.step);
    push(`POSITION · ${g.concept} · STEP ${stepName} · ON axis ${g.axis}${g.capsule?.line ? " — " + one(g.capsule.line.title, 90) : ""}`);
    push(`  axes done ${g.done.join("") || "—"} · deferred ${g.deferred.join("") || "—"} · left ${g.left.join("")} · resumed ${g.resumes}× · last touched ${g.lastTouchH == null ? "?" : g.lastTouchH.toFixed(1) + " h ago"}`);
    push(`  moments this session: ${MOMENTS.map((m) => `${m} ${g.moments?.[m] ?? 0}`).join(" · ")} · check-Q this pass ${g.checkQPass ?? 0} (refused ${g.checkQRefused ?? 0})`);
    push("");
    push("▶ THE FIRST MESSAGE OF THIS SESSION IS THIS QUESTION, WORD FOR WORD — no recap, no 'you already know this', nothing before it:");
    push(`  «${g.pointer?.text || "(no pointer recorded — ask ONE fresh micro-question on axis " + g.axis + " and set the pointer)"}»`);
    if (g.pointer?.at) push(`  (pointer set ${ist(g.pointer.at)} at step ${g.pointer.step} axis ${g.pointer.axis})`);
    push("");
    if (g.capsule) {
      push(`THIS AXIS FROM THE CAPSULE (${g.capsule.id} · ${g.capsule.doubts} doubts · ${g.capsule.traps} traps · IMMUTABLE · PRE-CYBORG: a map of where he breaks, NEVER proof of what he knows)`);
      if (g.capsule.line) push(`  the stored strike is BURNED by teaching — never serve it as a cold question: «${one(g.capsule.line.strike, 220)}»`);
      if (g.capsule.doubtsHere && g.capsule.doubtsHere.length) {
        push(`  HIS OWN DOUBTS mapped to axis ${g.axis} (crash-belt doubt map) — place each at its beat, answer-hidden from him:`);
        for (const d of g.capsule.doubtsHere) push(`   · #${d.n} [${d.kind}] ${one(d.q || d.short, 160)} → beat: ${one(d.beat, 90)}${d.a ? " → truth: " + one(d.a, 200) : ""}`);
      } else if (g.capsule.doubtMapFound) {
        push(`  HIS OWN DOUBTS: none mapped to axis ${g.axis} in the doubt map.`);
      } else {
        push(`  HIS OWN DOUBTS (no per-axis map found — the whole list, short; place the ones this axis touches):`);
        for (const [i, d] of (readJson(path.join(CAPSULES, g.concept + ".json"))?.doubts || []).entries()) push(`   · #${i + 1} ${one(d.q, 110)}`);
      }
      push(`  THE TRAPS he fell for (capsule-wide; spring the ones this axis touches, impersonally — refute the model, never the person):`);
      for (const [i, t] of g.capsule.traps_list.entries()) push(`   · T${i + 1} bait «${one(t.bait, 120)}» → truth «${one(t.truth, 160)}»`);
      if (g.capsule.calibration) push(`  HIS CALIBRATION (what he predicted about himself): ${one(g.capsule.calibration, 700)}`);
      push("");
    }
  }
  const ca = g.open ? `${g.concept}:${g.axis}` : "<concept>:<axis>";
  const ax = g.open ? g.axis : "<a-i>";
  push("THE FOUR LIVE DUTIES (THE NOTES LAW, row 240, his word 22 Sep) — extraction from the archive cannot recover what was never SAID:");
  push("  1 gut-word before EVERY answer: pakka / shayad / pata nahi (→ knew / shaky / guessed).");
  push("  2 the moment a crack fires: ask 'main atka kahan — maine socha X, phir Y ne toda' in HIS words, and write the ONE ```diff block right there (+ sahi / - galat). That block IS the crack log. Never log a crack later.");
  push("  3 axis close: his BOLO (Hinglish, dictated, pasted verbatim).  4 the English interview line (the sentence he would say in the room).");
  push("  NO hand-written note block · NO build_exchanges mid-lesson · NO Re-Jirah on the four re-opened topics · NO `start` while a session is open · NO re-teaching a done axis.");
  push("");
  push("THE COMMANDS (owners only; you type them, he never does):");
  push(`  bank    node scripts/gaffer_brain.mjs capture voice_rep ${ca} --axis ${ax} --gut knew|shaky|guessed --asked "<verbatim>" --said "<his words — the bank keeps HIS bytes from the prompt record; a copy not inside his message is refused>" --surface code [--latency_ms <from the hook line, verbatim, or OMIT>] [--probe recall|reconstruct|defend|novel|negative_space|cross_axis] [--register interview]`);
  push("          three banked moments an axis: the sharp check (declare `moment sharp_check`, gut trio pehle) · the Bolo · the interview line. Say «bank mein gaya · axis " + ax + " · judge shaam ko». Never a verdict, never seconds.");
  push('  pointer node scripts/forge_session.mjs pointer "<the exact unanswered micro-question + gut-word ask + where in the axis>"   ← at EVERY stop, before anything else');
  push(`  axis    node scripts/forge_session.mjs axis ${ax} done   (gate: ≥1 Hinglish bank + ≥1 --register interview since the axis opened)  ·  contract: node scripts/forge_session.mjs contract`);
  push(`  moments node scripts/forge_session.mjs moment ${MOMENTS.join("|")}   (only these ${MOMENTS.length} are legal question-moments; the list is the pacer's own, forks row 266)`);
  push('  crack   the ```diff block in the message (the marker) · his ruling → node scripts/acts.mjs do rule --door claude-code --text "…" · your drift → node scripts/teaching_contract.mjs flag <rule-id> --why "…"');
  push("  day end " + END_LINE + " (it closes the sitting, whose close fires the judge by code, writes the machine half of the day and prints the ONE message of questions; a second end says already closed)");
  push("");
  push("THE TURN SHAPE (the hook prints the live contract every turn — obey the hook, this is the spine):");
  push("  ONE new idea per message, ONE check-question at its end · DHEEMA not LAMBA: one thing fully opened, small steps · THREE LAYERS per idea: DUKAAN (an everyday physical analogy — food, shop, house, city, his own FinOps/Blinkit data; never geometry) → ASLI NAAM (the real term, opened in one line, `backticked`) → TECHNICAL LINE (the interview-ready English sentence)");
  push("  HINGLISH = English content words on Hindi glue (no akshar/sira/niyam) · NO tables anywhere he reads · position BY NAME (concept > axis > idea), never a count · 'samajh nahi aaya' = stop and restart from zero · stop him with a two-option question, never a lecture · struggle first: never hand him an answer he has not attempted · own your own mistake first");
  push("  DESKTOP TRAP (22 Sep): text written ABOVE a tool call is replaced on his screen — run every tool FIRST, write the whole teaching message LAST, self-contained.");
  // forks row 276 (1)(b), his words #22 / #23 (24 Sep 2026)
  push("  PICTURE FIRST (his word, 24 Sep: \"pictures first then text, combine them both\"): the Board at this open · at EVERY new idea ONE picture first (mcp__visualize__show_widget, then `moment widget_gate`), then its text, both in the same message · the step-4 concept widget after axis g stays.");
  push("  REAL TERMS (his word, 24 Sep): the AI industry's real name every time, a Hinglish gloss beside it, never a pet word in its place.");
  // his word, 16 Nov 2026 (neuralnet axis b): "my AuDHD brain needs to know and see the entire picture first before we start studying"
  push("  BIG PICTURE FIRST (his word, 16 Nov: \"ideally this should have been told/taught by the previous session without my saying\"): every topic opens, UNASKED, before axis a, with ONE picture + text: why this topic exists · its weight in his role (AI Product Engineer, any domain) and in interviews · which later topics it feeds, by name · the nine axes by name with what each will answer for THIS topic. Every axis open gets the one-line version: what this axis answers and how it serves the topic.");
  // his 12 annotations on the neuralnet axis a deck, 15 Nov 2026 (acts amwi45hl1i3 · amwi45ibx9f · amwi45izhcq)
  push("  FIRST USE (his word, 15 Nov: \"teaching me new words here without opening them or telling me where when i will learn it, my AuDHD brain got confused\"): in chat AND in every deck, every term, acronym and pet phrase is opened in one line AT ITS FIRST USE, or that same line says exactly where and when it opens (axis by name) · an acronym gets its full form and what each word means (ReLU = Rectified Linear Unit) · every number says who sets it: learned in training, chosen by a human (hyperparameter), or from the data · every answer repeats its question, he never has to remember it · a cross-topic link he asks for is said at BOTH ends (open links he ordered: inference & sampling opens by joining neuralnet's last layer → probabilities → sampling, weights ≠ scores · hallucinations opens by joining neuralnet axis b doubt 1: an unseen question still runs the same fixed weights and still gets scores, no built-in \"I don't know\"). In decks: the template's `ahead` field (📍 line) on the first-use beat, `recall` (\"Sawaal tha:\") on every answer beat. DECK LINT before opening or sending any deck: node scripts/deck_lint.mjs <file> — RED = fix first, never show him a red deck.");
  push("  AXIS CLOSE RECAP (his word, 14-15 Nov): a DECK, never a scroll page. One idea per screen; the picture stays fixed and lights the exact part each text step names; the picture always shows the numbers the current text uses (khud-karo loads the question's inputs, answer hidden); typed khud-karo boxes. Coverage sweep FIRST (every term the axis used gets opened). Build from learning-layer/AXIS_RECAP_DECK_TEMPLATE.html: copy the engine, replace the ideas, ENHANCE NEVER REGRESS (an improvement goes back into the template). Save to C:\\Users\\nikhi\\Downloads\\AI\\<topic subfolder>\\ and send from there, never from the repo path (his video calls). OPEN it for him in the Browser pane (his annotation tools live only there): preview_start name revision-decks, then http://localhost:4791/<topic subfolder>/<file>.html; the Artifact link is only the backup. Full law: .claude/skills/learn/SKILL.md 'THE RECAP IS A DECK'.");
  push("  ▶ OPEN AT BOOT, UNASKED (his word, 15 Nov: \"merko thodi yaad rahega har bari kab kya bolna hain\"): preview_start name revision-decks, then navigate to "
    + (g.deck ? g.deck.url + " (newest" + (g.concept ? " " + g.concept : "") + " deck)" : `http://localhost:${DECK_PORT}/ (the decks home; no deck for this concept yet)`)
    + ". Do it before the first teaching message, and again the same turn any deck is published. He never has to ask for it.");
  if (g.watch && g.watch.length) push("  WATCH-LIST (his repeat hangovers): " + g.watch.map((w) => one(typeof w === "string" ? w : (w.concept || w.name || JSON.stringify(w)), 40)).join(" · "));
  push("");
  push("WHERE THE FULL WORDING LIVES (open ONLY the section a step needs — never the whole file):");
  push("  step 3 turn shape + THE BANK + the three gates → .claude/skills/forge/SKILL.md §'THE BANK' · per-idea picture + Board → learning-layer/VISUAL_CONTRACT.md §4 PICTURE FIRST block · step 4 widget → §4 (one DRIVEN widget after axis g, stepper, no autoplay, ≤6 objects) · steps 9–10 (Jirah once at CONCEPT level, then LOCK) → forge SKILL 'step 10' gate line · the axis loop's substance → docs/archive/SAMJHAO_MERGED__2026-08-30.md §3 · the notes law in full → .claude/skills/learn/SKILL.md 'THE NOTES LAW' · the whole method → learning-layer/PROJECT_OS.md");
  push("  boot: the day's container is ALREADY OPEN by code (unit mday: his /learn prompt or the Skill call naming learn ran day.mjs start, which opens or JOINS today's sitting) · node scripts/day.mjs status shows it · never type the open yourself");
  return L.join("\n") + "\n";
}

// ---- selftest ---------------------------------------------------------------------------------------------------
function selftest() {
  const g = gather();
  const out = render(g);
  const checks = [
    ["rendered ≤ 16,384 bytes", Buffer.byteLength(out) <= CAP_BYTES, Buffer.byteLength(out) + " bytes"],
    ["no markdown table row in the render", !/^\|.*\|\s*$/m.test(out), ""],
    ["the four live duties are present", /THE FOUR LIVE DUTIES/.test(out) && /gut-word/.test(out) && /diff/.test(out) && /BOLO/.test(out) && /interview line/.test(out), ""],
    ["the bank line carries the live concept:axis", g.open ? out.includes(`capture voice_rep ${g.concept}:${g.axis} --axis ${g.axis}`) : out.includes("capture voice_rep <concept>:<axis>"), ""],
    ["the pointer appears verbatim when a session is open", !g.open || !g.pointer?.text || out.includes(g.pointer.text), ""],
    ["the first message is ruled to be the pointer question, no recap", !g.open || /WORD FOR WORD — no recap/.test(out), ""],
    ["the render names where the full wording lives, never the whole file", /never the whole file/.test(out), ""],
    ["his 24 Sep words ride the render: the Board at open, a picture FIRST at every new idea, the real industry term (forks row 276)", /PICTURE FIRST/.test(out) && /Board at this open/.test(out) && /EVERY new idea ONE picture first/.test(out) && /REAL TERMS/.test(out), ""],
    ["his 14-15 Nov recap law rides the render: the deck, its template, the Downloads\\AI home", /AXIS CLOSE RECAP/.test(out) && /AXIS_RECAP_DECK_TEMPLATE/.test(out) && /ENHANCE NEVER REGRESS/.test(out) && /Downloads\\AI/.test(out) && /revision-decks/.test(out) && /localhost:4791/.test(out), ""],
    ["his 15 Nov first-use law rides the render: term opened at first use or where+when, acronym full form, who sets each number, question on every answer, both ends of a cross-topic link", /FIRST USE/.test(out) && /AT ITS FIRST USE/.test(out) && /full form/.test(out) && /who sets it/.test(out) && /`recall`/.test(out) && /`ahead`/.test(out) && /BOTH ends/.test(out), ""],
    ["his 16 Nov big-picture law rides the render: topic open unasked with why, role weight, the topics it feeds and the nine axes", /BIG PICTURE FIRST/.test(out) && /UNASKED, before axis a/.test(out) && /which later topics it feeds/.test(out) && /nine axes by name/.test(out), ""],
    ["the deck lint rides the render and exists on disk (his 15 Nov law as a code path)", /DECK LINT before opening/.test(out) && /deck_lint\.mjs <file>/.test(out) && fs.existsSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "deck_lint.mjs")), ""],
    ["the boot opens his newest deck in the Browser pane, unasked (his word, 15 Nov)", /OPEN AT BOOT, UNASKED/.test(out) && /navigate to http:\/\/localhost:4791\//.test(out), ""],
    ["the digest writes nothing (no write call in its own source)", !/\b(writeFileSync|appendFileSync|writeFile)\s*\(/.test(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").replace(/\/\/.*$/gm, "").replace(/"the digest writes nothing[^"]*"/, "")), ""],
    ["the day is opened and ended by code (unit mday2, forks row 1089): no hand-typed sitting open, no judge-round or hand sitting close before the close, day.mjs status and day.mjs end ride the render", !/sitting\.mjs open/.test(out) && !/judge-round/.test(out) && !/sitting\.mjs close/.test(out) && !/\/full-time/.test(out) && /day\.mjs status shows it/.test(out) && out.includes(END_LINE), ""],
    ["--json round-trips the gathered facts", (() => { try { return JSON.parse(JSON.stringify(g)).open === g.open; } catch { return false; } })(), ""],
  ];
  let ok = 0;
  for (const [name, pass, note] of checks) { console.log((pass ? "  ok   " : "  FAIL ") + name + (note ? " · " + note : "")); if (pass) ok++; }
  console.log(`learn_digest selftest ${ok}/${checks.length}` + (ok === checks.length ? " — all clauses hold" : " — RED"));
  process.exit(ok === checks.length ? 0 : 1);
}

const verb = process.argv[2];
if (verb === "selftest") selftest();
else if (verb === "--json") process.stdout.write(JSON.stringify(gather(), null, 2) + "\n");
else { const g = gather(); const out = render(g); process.stdout.write(out); if (Buffer.byteLength(out) > CAP_BYTES) { console.error(`learn_digest: render is ${Buffer.byteLength(out)} bytes, over the ${CAP_BYTES} cap — trim the section that grew`); process.exit(2); } }
