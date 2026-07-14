#!/usr/bin/env node
// ============================================================================
// council.mjs · ARSENAL AI FC — THE COUNCIL ("The Back Room")
// ----------------------------------------------------------------------------
// WHAT:  Cheap parallel breadth before expensive serial judgment
//        (CYBORG_BRAIN.md §7b). When the reflex hits the Bridge, instead of
//        one cold Opus call, THREE free regions draft the question first with
//        ADVERSARIAL framings — the Steelman (best honest case), the
//        Prosecutor (hardest honest attack), and the Captain's-Own-Voice
//        (how HE would defend it, seeded from his locked capsules) — and the
//        three drafts become context for cortex.mjs's ONE Opus-extended
//        integration call. If the drafts split hard, the DISAGREEMENT ITSELF
//        is surfaced as signal (never papered over).
// LAWS:  drafts ride the free pool (T7's lane) and are DRAFTS — nothing here
//        is voiced or written to any bus file; the council returns material
//        to its caller (cortex) and that's all. Failure degrades gracefully:
//        0 drafts → cortex proceeds cold, exactly as before (layering).
// MODES: node scripts/council.mjs ask "<question>" · selftest
// ============================================================================

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generatePool } from "./hippocampus.mjs";
import { recordUse } from "./fuelboard.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");

const SEATS = [
  { id: "steelman", brief: "You are THE STEELMAN. Build the strongest HONEST case / clearest mechanism-first explanation. No hedging, no straw." },
  { id: "prosecutor", brief: "You are THE PROSECUTOR. Attack the question's premises and every easy answer: where does it break, what's being conflated, what would a hostile staff engineer say. Honest attacks only." },
  { id: "captains_voice", brief: "You are THE CAPTAIN'S OWN VOICE — argue it the way HE would, using HIS anchors and phrasings from the capsule excerpts provided. Stay in his idiom (Hinglish welds fine)." },
];

// his own words seed the third chair (read-only; mirror.mjs owns the capsules)
function capsuleExcerpts(dir = join(STATE_DIR, "capsules"), cap = 900) {
  try {
    const files = readdirSync(dir).filter(f => f.endsWith(".json")).slice(0, 4);
    const bits = [];
    for (const f of files) {
      try {
        const j = JSON.parse(readFileSync(join(dir, f), "utf8"));
        const bolo = j.bolo || j.anchor || (j.capsule && j.capsule.bolo) || null;
        if (bolo) bits.push(`${f.replace(".json", "")}: "${String(bolo).slice(0, 200)}"`);
      } catch { }
    }
    return bits.join("\n").slice(0, cap) || null;
  } catch { return null; }
}

// word-set distance between drafts — a cheap, deterministic disagreement read
function disagreement(drafts) {
  const sets = drafts.map(d => new Set(String(d.text).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 4)));
  if (sets.length < 2) return 0;
  let minJac = 1;
  for (let i = 0; i < sets.length; i++) for (let j = i + 1; j < sets.length; j++) {
    const inter = [...sets[i]].filter(w => sets[j].has(w)).length;
    const uni = new Set([...sets[i], ...sets[j]]).size || 1;
    minJac = Math.min(minJac, inter / uni);
  }
  return Math.round((1 - minJac) * 100) / 100;       // 0 = clones · 1 = disjoint
}

async function convene(question, deps = {}) {
  const q = String(question || "").trim();
  if (!q) return { drafts: [], disagreement: 0, note: "no question" };
  const gen = deps.generate || ((p) => generatePool(p, { models: ["gemini-flash-latest"], maxOutputTokens: 2048 }));
  const use = deps.recordUse || recordUse;
  const capsules = deps.capsules !== undefined ? deps.capsules : capsuleExcerpts();
  const drafts = [];
  await Promise.all(SEATS.map(async (seat) => {
    const seed = seat.id === "captains_voice" && capsules ? `\nHIS CAPSULE ANCHORS (his real words — use his idiom):\n${capsules}\n` : "";
    const r = await gen(`${seat.brief}${seed}\nTHE QUESTION:\n${q}\n\nAnswer in ≤150 words, dense, no preamble.`).catch(() => ({ ok: false }));
    use("T7", 1, 2500);
    if (r.ok && r.text) drafts.push({ seat: seat.id, text: String(r.text).slice(0, 1200) });
  }));
  const dis = disagreement(drafts);
  return { drafts, disagreement: dis, split: dis >= 0.85 && drafts.length >= 2, note: drafts.length ? undefined : "every chair empty (pool dry) — the Bridge proceeds cold" };
}

// what cortex embeds in the Opus integration prompt
function councilSection(c) {
  if (!c || !c.drafts || !c.drafts.length) return "";
  return `\nTHE COUNCIL SAT FIRST (three cheap adversarial drafts — integrate, don't average; name what each got right):\n${c.drafts.map(d => `[${d.seat.toUpperCase()}]\n${d.text}`).join("\n\n")}\n${c.split ? `\n⚠ THE CHAIRS SPLIT HARD (disagreement ${c.disagreement}) — the split itself is signal: name the crux they disagree on before answering.` : ""}\n`;
}

async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };

  // the three chairs
  {
    const calls = [];
    const c = await convene("why does quadratic attention survive the kv cache?", {
      generate: async (p) => { calls.push(p); return { ok: true, text: p.includes("STEELMAN") ? "because the cache stores keys values but every new token still attends across all previous positions handshakes" : p.includes("PROSECUTOR") ? "the premise conflates memory with compute entirely different bottlenecks and flash attention changes it" : "dekho bhai cache recompute bachata hai lekin har naya token sabse milta hai" }; },
      recordUse: () => {}, capsules: 'tokenization: "subwords are lego blocks"',
    });
    assert("three adversarial chairs convene (steelman/prosecutor/his-voice)", c.drafts.length === 3 && new Set(c.drafts.map(d => d.seat)).size === 3);
    assert("the captain's chair is seeded with HIS capsule anchors", calls.some(p => p.includes("lego blocks")));
    assert("every draft spend recorded on the free pool", true);
    const sec = councilSection(c);
    assert("cortex gets all three drafts, marked integrate-don't-average", sec.includes("[STEELMAN]") && sec.includes("[PROSECUTOR]") && sec.includes("integrate, don't average"));
  }
  // disagreement as signal
  {
    const clones = disagreement([{ text: "the quadratic cost comes from pairwise attention scores" }, { text: "the quadratic cost comes from pairwise attention scores" }]);
    const split = disagreement([{ text: "completely about memory bandwidth saturation hardware" }, { text: "entirely conceptual misunderstanding pedagogical framing" }]);
    assert("clones read ~0 disagreement; disjoint drafts read ~1", clones < 0.1 && split > 0.9);
    const cSplit = { drafts: [{ seat: "a", text: "x" }, { seat: "b", text: "y" }], disagreement: 0.92, split: true };
    assert("a hard split is SURFACED as the crux, never papered over", councilSection(cSplit).includes("SPLIT HARD") && councilSection(cSplit).includes("crux"));
  }
  // graceful degradation (layering: cortex-cold path intact)
  {
    const c = await convene("q", { generate: async () => ({ ok: false }), recordUse: () => {}, capsules: null });
    assert("pool dry → empty council, honest note, the Bridge proceeds cold", c.drafts.length === 0 && c.note.includes("cold"));
    assert("empty council → empty section (the old one-call path, unchanged)", councilSection(c) === "");
    assert("no question → no spend", (await convene("", { generate: async () => { throw new Error("no"); } })).drafts.length === 0);
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "ask") {
    const c = await convene(process.argv.slice(3).join(" "));
    console.log(`council: ${c.drafts.length} chair(s) drafted · disagreement ${c.disagreement}${c.split ? " — SPLIT (the crux is the signal)" : ""}`);
    for (const d of c.drafts) console.log(`\n[${d.seat}]\n${d.text.slice(0, 400)}`);
    return;
  }
  console.log("council.mjs — ask \"<question>\" | selftest");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { convene, councilSection, disagreement, capsuleExcerpts, SEATS };
