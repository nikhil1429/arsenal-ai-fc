#!/usr/bin/env node
// deck_lint.mjs — THE FIRST-USE LAW, AS A CODE PATH (his word, 15 Nov 2026, acts amwi45hl1i3 · amwi45ibx9f · amwi45izhcq).
//
// A PURE READER. It reads one revision deck (an .html built from learning-layer/AXIS_RECAP_DECK_TEMPLATE.html),
// evaluates ONLY its `LINES` + `I` data in a node:vm sandbox (the engine never runs), walks the beats in the order
// he sees them, and reports every place the deck breaks his 15 Nov law. It writes nothing, anywhere.
//
// Why it exists: on 15 Nov he annotated 12 doubts on the neuralnet axis a deck. Most were ONE class: a term used
// before the card that opens it (learning rate, activation, ReLU, "sabse chhoti machine"), an acronym without its
// full form, and an answer card that did not repeat its question. The coverage sweep (14 Nov) was obeyed and still
// failed him, because it asks "is every term opened SOMEWHERE", not "opened AT ITS FIRST USE". This lint asks the
// second question, by code. Law text: .claude/skills/learn/SKILL.md "FIRST USE, NOT JUST SOMEWHERE".
//
// THE RULES (each finding names its rule):
//   R1 first-use   a term (anything inside <span class="term">) appears in an EARLIER beat than the one that opens it,
//                  and that beat's `ahead` (the 📍 line) does not name it. A card with `overview:true` (the naksha /
//                  map card) is exempt from R1 usage: its job is to name everything once before it opens.
//                  "Opens" = the term inside a .term span or <b>…</b>, or written "X = …" / "X: …" / "ko X kehte" /
//                  "X kehte hain". A card's picture counts as used at the card's FIRST beat (he sees it there).
//   R2 acronym     an acronym (2+ capitals, e.g. ReLU, GELU) at its first use has neither its full form in that beat
//                  ("ReLU = Rectified …" or "ReLU (Rectified …)") nor an `ahead` that names it with "poora naam" /
//                  "poore naam" / "full form". Words he already owns are in KNOWN (below) or the deck's own
//                  `var KNOWN=[…]`.
//   R3 recall      an answer beat (tag says jawab/answer, or any beat of a card whose id is "doubts") has no `recall`
//                  (the "Sawaal tha:" box). His words: "i have forgotten the question now".
// NOT checked (judgement, not computable): "every number says who sets it" and "a cross-topic link at both ends".
// Those ride the digest line and the skill text; the architect escalation of 15 Nov asks how to make them code.
//
// CLI:  node scripts/deck_lint.mjs <deck.html>     exit 0 = GREEN, 1 = findings (one line each), 2 = unreadable
//       node scripts/deck_lint.mjs selftest        planted mutants, each RED by its named rule, plus a GREEN control
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.join(HERE, "..", "learning-layer", "AXIS_RECAP_DECK_TEMPLATE.html");

// Words he already owns: closed topics (1-05 API Fundamentals), his own domain (Blinkit SKU, GST, FinOps), his own
// words (AuDHD), and the deck's subject itself (LLM). Adding here is a claim about HIM — name the reason.
export const KNOWN = Object.freeze(["AI", "LLM", "LLMs", "API", "ID", "IDs", "SKU", "GST", "FinOps", "AuDHD", "ADHD", "OK"]);

const strip = (h) => String(h || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const usedRe = (t) => new RegExp("(^|[^A-Za-z])" + esc(t) + "(s|es)?(?![A-Za-z])", "i");

// ---- load: evaluate LINES + I only, never the engine ----------------------------------------------------------
export function loadDeck(html) {
  const start = html.search(/var\s+LINES\s*=|var\s+I\s*=\s*\[/);
  const end = html.indexOf("/* ---------- ENGINE");
  if (start < 0 || end < 0 || end < start) throw new Error("not a template deck: no `var LINES`/`var I` before the ENGINE marker");
  const known = /var\s+KNOWN\s*=\s*(\[[^\]]*\])/.exec(html);
  const ctx = { document: {}, $: () => null, window: {}, location: {} };
  vm.createContext(ctx);
  const out = vm.runInContext(html.slice(start, end) + "\n;({ I: I, LINES: (typeof LINES === 'undefined' ? [] : LINES) })", ctx, { timeout: 2000 });
  return { I: out.I, known: known ? JSON.parse(known[1].replace(/'/g, '"')) : [] };
}

// ---- the walk -------------------------------------------------------------------------------------------------
export function lint(I, { known = [] } = {}) {
  const KN = new Set([...KNOWN, ...known]);
  const beats = [];
  I.forEach((card, ci) => (card.beats || []).forEach((b, bi) => {
    const pic = bi === 0 ? strip(card.pic) : "";
    beats.push({ card, ci, b, bi, raw: String(b.html || "") + " " + String(b.ahead || ""), text: [strip(b.html), strip(b.why), pic].join(" "), ahead: strip(b.ahead) });
  }));
  const findings = [];
  const say = (x, rule, word) => findings.push({ card: x.card.name || x.card.id, beat: x.b.tag, rule, word });

  // R1 — every term's opening index, then every earlier use
  const terms = new Set();
  for (const x of beats) for (const m of x.raw.matchAll(/<span class="term">([^<]+)<\/span>/g)) terms.add(m[1].trim());
  const opensAt = (t) => beats.findIndex((x) => {
    const e = esc(t);
    return new RegExp('<span class="term">\\s*' + e + "\\s*</span>", "i").test(x.raw)
      || new RegExp("<b>\\s*" + e + "\\s*</b>", "i").test(x.raw)
      || new RegExp("(^|[^A-Za-z])" + e + "\\s*(=|:)", "i").test(strip(x.raw))
      || new RegExp("\\bko\\s+" + e + "\\s+kehte|(^|[^A-Za-z])" + e + "\\s+kehte\\s+hain", "i").test(strip(x.raw));
  });
  for (const t of terms) {
    const o = opensAt(t), re = usedRe(t);
    for (let k = 0; k < o; k++) {
      const x = beats[k];
      if (x.card.overview) continue;
      // the card that opens a term teaches it dukaan → asli naam: its own earlier beats ARE the opening in progress.
      // The failure he caught was LEAKAGE — a term on another card before its own (learning rate on the Bias card).
      if (x.ci === beats[o].ci) continue;
      if (re.test(x.text) && !re.test(x.ahead)) say(x, "R1 first-use", t);
    }
  }
  // R2 — every acronym at its first use
  const seen = new Set();
  // Hinglish EMPHASIS ("EK input", "NAHI hai") is all-caps but not an acronym: an all-caps word whose lowercase form
  // is written somewhere in the deck in lowercase is a word he reads, not a short form.
  const lower = new Set();
  for (const x of beats) for (const m of (x.text + " " + x.ahead).matchAll(/(?<![A-Za-z])([a-z]+)(?![A-Za-z])/g)) lower.add(m[1]);
  for (const x of beats) {
    const all = x.text + " " + x.ahead;
    for (const m of all.matchAll(/(?<![A-Za-z])([A-Za-z]*[A-Z][A-Za-z]*[A-Z][A-Za-z]*)(?![A-Za-z])/g)) {
      const a = m[1];
      if (KN.has(a) || seen.has(a) || (a === a.toUpperCase() && lower.has(a.toLowerCase()))) continue;
      seen.add(a);
      const e = esc(a);
      const full = new RegExp(e + "\\s*(=|\\()\\s*<?[^)]*?[A-Z][a-z]+", "").test(String(x.b.html || "")) || new RegExp(e + "\\s*(=|\\()\\s*[A-Z][a-z]+").test(strip(x.b.html));
      const pointed = new RegExp(e).test(x.ahead) && /poor[ae]\s+naam|full\s+form/i.test(x.ahead);
      if (!full && !pointed) say(x, "R2 acronym", a);
    }
  }
  // R3 — the question on every answer beat
  for (const x of beats) if ((/jawab|answer/i.test(x.b.tag || "") || x.card.id === "doubts") && !x.b.recall) say(x, "R3 recall", x.b.tag);
  return findings;
}

export const fmt = (f) => `${f.card} › ${f.beat} › ${f.rule} › ${f.word}`;

// ---- selftest -------------------------------------------------------------------------------------------------
function selftest() {
  const T = (name, tag, html, extra = {}) => ({ tag, html, ...extra });
  const clean = () => [
    { id: "naksha", name: "Naksha", overview: true, pic: "<span>input × weight → output</span>", beats: [T(0, "Map", "<p>input, weight, output, sab aage khulte hain.</p>")] },
    { id: "w", name: "Weight", pic: "", beats: [T(0, "Dukaan", "<p>Knob ghumao.</p>"), T(0, "Asli naam", '<p><span class="term">weight</span>: seekha hua number.</p>')] },
    { id: "a", name: "Activation", pic: "", beats: [T(0, "Asli naam", "<p>ReLU = Rectified Linear Unit. Minus ho toh 0.</p>")] },
    { id: "s", name: "Sharp", pic: "", beats: [T(0, "Jawab", "<p>Yeh raha.</p>", { recall: "Sawaal yeh tha" })] },
  ];
  const cases = [];
  const run = (name, I, wantRule) => {
    const f = lint(I);
    const pass = wantRule ? f.some((x) => x.rule === wantRule) && f.every((x) => x.rule === wantRule) : f.length === 0;
    cases.push([name, pass, f.map(fmt).join(" | ")]);
  };
  run("control: a clean deck is GREEN", clean(), null);
  const early = (html, pic = "", ahead) => { const I = clean(); I.splice(1, 0, { id: "x", name: "Early", pic, beats: [T(0, "Dukaan", html, ahead ? { ahead } : {})] }); return I; };
  run("mutant: a term used on an EARLIER card than its own → R1", early("<p>Weight ghumao, abhi.</p>"), "R1 first-use");
  run("mutant healed: the same use with an ahead naming it is GREEN", early("<p>Weight ghumao.</p>", "", "Weight agle card pe khulta hai."), null);
  run("mutant: a term in an earlier card's PICTURE → R1 at that card's first beat", early("<p>Knob.</p>", "<span>weight 1.5</span>"), "R1 first-use");
  { const I = clean(); I[1].beats[0].html = "<p>Weight ghumao.</p>"; run("control: the card that opens a term may use it in its own dukaan beats first", I, null); }
  { const I = clean(); I[2].beats[0].html = "<p>ReLU = Rectified Linear Unit. EK rule, NAHI toh 0; ek baar, nahi toh.</p>"; run("control: Hinglish emphasis in capitals (EK, NAHI) is not an acronym", I, null); }
  { const I = clean(); I[0].beats[0].html = "<p>weight bhi.</p>"; run("control: the overview card may name a term before it opens", I, null); }
  { const I = clean(); I[2].beats[0].html = "<p>ReLU: minus ho toh 0.</p>"; run("mutant: an acronym with no full form → R2", I, "R2 acronym"); }
  { const I = clean(); I[2].beats[0].html = "<p>Iske roop GELU hain.</p>"; I[2].beats[0].ahead = "GELU ka poora naam axis f mein."; run("mutant healed: an acronym whose ahead says where its poora naam opens is GREEN", I, null); }
  { const I = clean(); delete I[3].beats[0].recall; run("mutant: a jawab beat with no recall → R3", I, "R3 recall"); }
  { const I = clean(); I.push({ id: "doubts", name: "Doubts", pic: "", beats: [T(0, "Doubt 1", "<p>Jawab.</p>")] }); run("mutant: a doubts-card beat with no recall → R3", I, "R3 recall"); }
  { let ok = false, note = ""; try { const d = loadDeck(fs.readFileSync(TEMPLATE, "utf8")); const f = lint(d.I, { known: d.known }); ok = f.length === 0; note = f.length ? f.length + " finding(s): " + f.slice(0, 4).map(fmt).join(" | ") : "GREEN"; } catch (e) { note = "unreadable: " + e.message; }
    cases.push(["the template itself is GREEN (every future deck starts clean)", ok, note]); }
  { let threw = false; try { loadDeck("<p>no deck here</p>"); } catch { threw = true; } cases.push(["a page that is not a template deck is refused, never passed", threw, ""]); }
  let ok = 0;
  for (const [n, p, note] of cases) { console.log((p ? "  ok   " : "  FAIL ") + n + (note && !p ? " · " + note : "")); if (p) ok++; }
  console.log(`deck_lint selftest ${ok}/${cases.length}` + (ok === cases.length ? " — all clauses hold" : " — RED"));
  process.exit(ok === cases.length ? 0 : 1);
}

const arg = process.argv[2];
if (arg === "selftest") selftest();
else if (arg) {
  let d;
  try { d = loadDeck(fs.readFileSync(arg, "utf8")); } catch (e) { console.error("deck_lint: cannot read " + arg + " — " + e.message); process.exit(2); }
  const f = lint(d.I, { known: d.known });
  if (!f.length) { console.log("deck_lint: GREEN · " + d.I.length + " cards · R1 first-use · R2 acronym · R3 recall all hold"); process.exit(0); }
  for (const x of f) console.log(fmt(x));
  console.log(`deck_lint: RED · ${f.length} finding(s) — fix before opening the deck for him`);
  process.exit(1);
} else { console.log("usage: node scripts/deck_lint.mjs <deck.html> | selftest"); process.exit(2); }
