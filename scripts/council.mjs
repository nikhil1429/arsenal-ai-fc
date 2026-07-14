#!/usr/bin/env node
// ============================================================================
// council.mjs · ARSENAL AI FC — THE COUNCIL ("The Back Room")
// ----------------------------------------------------------------------------
// WHAT:  Cheap parallel breadth before expensive serial judgment
//        (CYBORG_BRAIN.md §7b). When the reflex hits the Bridge, instead of
//        one cold Opus call, free-pool chairs draft the question first with
//        ADVERSARIAL framings — the Steelman (best honest case), the
//        Prosecutor (hardest honest attack), and the Captain's-Own-Voice
//        (how HE would defend it, seeded from his locked capsules) — and the
//        drafts become context for cortex.mjs's ONE Opus-extended
//        integration call. If the drafts split hard, the DISAGREEMENT ITSELF
//        is surfaced as signal (never papered over).
// M15 — THE FULL SQUAD (the cyborg stretch):
//        · chairs live in council_config.json (canon — chairs shape the
//          curriculum; the three original seats are the baked fallback).
//        · a FOURTH chair sits on a DIFFERENT model family — the
//          Cross-Examiner on Claude sonnet via `claude -p` (Max plan, the
//          $100 law enforced) — HEADROOM-GATED: it only sits when the real
//          window can spare it; its spend rides brain_ledger.jsonl so the
//          budget sees every token. Chair fails/low window → the old
//          3-chair council, byte-identical (layering).
//        · CROSS-FAMILY disagreement is CURRICULUM: when the two families
//          read the same question disjointly, council_flag.json is written
//          (this organ's ONE file) and the set-piece coach compiles it into
//          a defend drill — disagreement-as-curriculum.
// LAWS:  free-pool drafts ride T7's lane; the sonnet chair rides the Max
//        window, ledgered + headroom-gated + refused outright if a metered
//        key is set. Failure degrades gracefully: 0 drafts → cortex proceeds
//        cold, exactly as before.
// MODES: node scripts/council.mjs ask "<question>" · selftest
// ============================================================================

import { readFileSync, existsSync, readdirSync, appendFileSync, mkdirSync, writeFileSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { generatePool } from "./hippocampus.mjs";
import { recordUse } from "./fuelboard.mjs";
import { headroom, loadConfig as loadBrainConfig } from "./brain.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CONFIG    = join(STATE_DIR, "council_config.json");
const FLAG      = join(STATE_DIR, "council_flag.json");
const BLEDGER   = join(STATE_DIR, "brain_ledger.jsonl");

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => { const o = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch {} } } catch {} return o; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

const DEFAULT_SEATS = [
  { id: "steelman", family: "gemini", brief: "You are THE STEELMAN. Build the strongest HONEST case / clearest mechanism-first explanation. No hedging, no straw." },
  { id: "prosecutor", family: "gemini", brief: "You are THE PROSECUTOR. Attack the question's premises and every easy answer: where does it break, what's being conflated, what would a hostile staff engineer say. Honest attacks only." },
  { id: "captains_voice", family: "gemini", brief: "You are THE CAPTAIN'S OWN VOICE — argue it the way HE would, using HIS anchors and phrasings from the capsule excerpts provided. Stay in his idiom (Hinglish welds fine)." },
];
// M15 — the 4th chair: a DIFFERENT family reads the same question. Families
// fail differently; where they diverge is exactly where his understanding
// needs a drill, not a consensus.
const CROSS_SEAT = { id: "cross_examiner", family: "claude", model: "sonnet", brief: "You are THE CROSS-EXAMINER, from a different model family than the other chairs. Answer the question yourself, first-principles, mechanism-first, dense. Do NOT hedge toward consensus; if the obvious answer has a crack, name it plainly." };

function loadSeats(cfgObj) {
  const c = cfgObj !== undefined ? cfgObj : readJson(CONFIG);
  const seats = (c && Array.isArray(c.seats) && c.seats.length ? c.seats : DEFAULT_SEATS).map(s => ({ family: "gemini", ...s }));
  const cross = (c && c.cross_family === false) ? null : { ...CROSS_SEAT, ...((c && c.cross_seat) || {}) };
  return { seats, cross, min_headroom: (c && c.cross_min_headroom_tokens) || 20000 };
}

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
const wordSet = (t) => new Set(String(t).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 4));
function jaccardPair(a, b) {
  const A = wordSet(a), B = wordSet(b);
  const inter = [...A].filter(w => B.has(w)).length;
  const uni = new Set([...A, ...B]).size || 1;
  return inter / uni;
}
function disagreement(drafts) {
  if (!drafts || drafts.length < 2) return 0;
  let minJac = 1;
  for (let i = 0; i < drafts.length; i++) for (let j = i + 1; j < drafts.length; j++) {
    minJac = Math.min(minJac, jaccardPair(drafts[i].text, drafts[j].text));
  }
  return Math.round((1 - minJac) * 100) / 100;       // 0 = clones · 1 = disjoint
}
// M15 — the CROSS-FAMILY read: the most disjoint pair that spans families
function crossFamilySplit(drafts) {
  const fams = [...new Set((drafts || []).map(d => d.family || "gemini"))];
  if (fams.length < 2) return null;
  const a = drafts.filter(d => (d.family || "gemini") === fams[0]);
  const b = drafts.filter(d => (d.family || "gemini") !== fams[0]);
  let minJac = 1;
  for (const x of a) for (const y of b) minJac = Math.min(minJac, jaccardPair(x.text, y.text));
  return { disagreement: Math.round((1 - minJac) * 100) / 100, families: fams };
}

// the sonnet chair — async so the free chairs keep drafting while it thinks
function claudeChairAsync(prompt, model = "sonnet", timeoutMs = 20000, deps = {}) {
  const t0 = Date.now();
  return new Promise((resolve) => {
    const fail = (msg) => resolve({ ok: false, text: "", total_tokens: 0, duration_ms: Date.now() - t0, error: String(msg).slice(0, 160) });
    try {
      const execFn = deps.execAsync || execFile;
      const child = execFn("claude", ["-p", "--output-format", "json", "--model", model], {
        timeout: timeoutMs, encoding: "utf8", windowsHide: true, maxBuffer: 8 * 1024 * 1024,
      }, (err, stdout) => {
        if (err && !stdout) return fail((err && err.message) || err);
        try {
          const j = JSON.parse(stdout);
          const text = String(j.result || "");
          const inTok = (j.usage && j.usage.input_tokens) || 0, outTok = (j.usage && j.usage.output_tokens) || 0;
          resolve({ ok: j.is_error !== true && !!text, text, input_tokens: inTok, output_tokens: outTok, total_tokens: inTok + outTok || Math.ceil((prompt.length + text.length) / 4), duration_ms: Date.now() - t0, error: null });
        } catch (e) { fail((e && e.message) || e); }
      });
      if (child && child.stdin) { child.stdin.on("error", () => {}); child.stdin.write(prompt); child.stdin.end(); }
    } catch (e) { fail((e && e.message) || e); }
  });
}

async function convene(question, deps = {}) {
  const q = String(question || "").trim();
  if (!q) return { drafts: [], disagreement: 0, note: "no question" };
  const { seats, cross, min_headroom } = deps.seatsCfg !== undefined ? { min_headroom: 20000, cross: null, ...deps.seatsCfg } : loadSeats();
  const gen = deps.generate || ((p) => generatePool(p, { models: ["gemini-flash-latest"], maxOutputTokens: 2048 }));
  const use = deps.recordUse || recordUse;
  const capsules = deps.capsules !== undefined ? deps.capsules : capsuleExcerpts();
  const drafts = [];
  // THE BUS LEAVES ON TIME (live-arc scar, 14 Jul): a chair that misses the
  // deadline is dropped — the deep answer must land in the stuck→gone window,
  // and three perfect drafts 90s late are worth less than one on time.
  const deadline = deps.deadline_ms || 25000;
  const jobs = seats.map(async (seat) => {
    const seed = seat.id === "captains_voice" && capsules ? `\nHIS CAPSULE ANCHORS (his real words — use his idiom):\n${capsules}\n` : "";
    const r = await gen(`${seat.brief}${seed}\nTHE QUESTION:\n${q}\n\nAnswer in ≤150 words, dense, no preamble.`).catch(() => ({ ok: false }));
    use("T7", 1, 2500);
    if (r.ok && r.text) drafts.push({ seat: seat.id, family: seat.family || "gemini", text: String(r.text).slice(0, 1200) });
  });
  // M15 — the cross-family chair: headroom-gated, $100-law-guarded, ledgered
  if (cross) {
    jobs.push((async () => {
      const env = deps.env || process.env;
      if (env.ANTHROPIC_API_KEY) return;               // never metered, ever
      let hr = deps.headroom;
      if (hr === undefined) {
        try { hr = headroom(loadBrainConfig(), readLines(BLEDGER), readJson(join(STATE_DIR, "brain_queue.json")) || {}, new Date()); } catch { hr = { allowed: 0 }; }
      }
      if (!hr || hr.allowed < min_headroom) return;    // the window belongs to deep reads first
      // the chair gets the full bus window minus the boarding margin — a hard
      // 20s cap benched it under contention (probed live: 11s alone, >20s busy)
      const call = deps.claudeChair || ((p) => claudeChairAsync(p, cross.model, Math.max(5000, deadline - 2000)));
      const r = await call(`${cross.brief}\nTHE QUESTION:\n${q}\n\nAnswer in ≤150 words, dense, no preamble.`).catch(() => ({ ok: false }));
      if (r && r.ok && r.text) {
        drafts.push({ seat: cross.id, family: cross.family || "claude", text: String(r.text).slice(0, 1200) });
        // the spend rides the SHARED brain ledger — the window sees every token
        (deps.appendLedger || ((row) => appendFileSync(BLEDGER, JSON.stringify(row) + "\n")))({ ts: new Date().toISOString(), job: "council_chair", engine: "claude", model: cross.model, input_tokens: r.input_tokens || 0, output_tokens: r.output_tokens || 0, total_tokens: r.total_tokens || 0, duration_ms: r.duration_ms || 0, ok: true, error: null, limit_hit: false });
      }
    })());
  }
  await Promise.race([Promise.all(jobs), new Promise((res) => setTimeout(res, deadline))]);
  const seated = drafts.slice();                     // late chairs talk to an empty room
  const dis = disagreement(seated);
  // M15 — cross-family disagreement is CURRICULUM: flag it for the set-piece
  const cf = crossFamilySplit(seated);
  const crossSplit = !!(cf && cf.disagreement >= 0.85);
  if (crossSplit) {
    (deps.writeFlag || ((o) => writeAtomic(FLAG, o)))({
      date: localDate(deps.now || new Date()), ts: new Date().toISOString(),
      question: q.slice(0, 200), disagreement: cf.disagreement, families: cf.families,
      seats: seated.map(d => `${d.seat}(${d.family})`),
    });
  }
  return { drafts: seated, disagreement: dis, split: dis >= 0.85 && seated.length >= 2, cross_split: crossSplit, note: seated.length ? undefined : "every chair empty (pool dry/late) — the Bridge proceeds cold" };
}

// what cortex embeds in the Opus integration prompt
function councilSection(c) {
  if (!c || !c.drafts || !c.drafts.length) return "";
  return `\nTHE COUNCIL SAT FIRST (cheap adversarial drafts — integrate, don't average; name what each got right):\n${c.drafts.map(d => `[${d.seat.toUpperCase()}${d.family && d.family !== "gemini" ? " · " + d.family.toUpperCase() : ""}]\n${d.text}`).join("\n\n")}\n${c.split ? `\n⚠ THE CHAIRS SPLIT HARD (disagreement ${c.disagreement}) — the split itself is signal: name the crux they disagree on before answering.` : ""}${c.cross_split ? `\n⚠ TWO MODEL FAMILIES read this differently — the divergence is curriculum: say which family's read holds, and why.` : ""}\n`;
}

async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const threeSeats = { seats: DEFAULT_SEATS, cross: null };
  const genThree = async (p) => ({ ok: true, text: p.includes("STEELMAN") ? "because the cache stores keys values but every new token still attends across all previous positions handshakes" : p.includes("PROSECUTOR") ? "the premise conflates memory with compute entirely different bottlenecks and flash attention changes it" : "dekho bhai cache recompute bachata hai lekin har naya token sabse milta hai" });

  // the three chairs (the pre-M15 council, byte-compatible)
  {
    const calls = [];
    const c = await convene("why does quadratic attention survive the kv cache?", {
      seatsCfg: threeSeats,
      generate: async (p) => { calls.push(p); return genThree(p); },
      recordUse: () => {}, capsules: 'tokenization: "subwords are lego blocks"',
    });
    assert("three adversarial chairs convene (steelman/prosecutor/his-voice)", c.drafts.length === 3 && new Set(c.drafts.map(d => d.seat)).size === 3);
    assert("the captain's chair is seeded with HIS capsule anchors", calls.some(p => p.includes("lego blocks")));
    const sec = councilSection(c);
    assert("cortex gets all drafts, marked integrate-don't-average", sec.includes("[STEELMAN]") && sec.includes("[PROSECUTOR]") && sec.includes("integrate, don't average"));
  }
  // M15 — chairs live in CONFIG (canon), defaults as the floor
  {
    const custom = loadSeats({ seats: [{ id: "devil", brief: "x" }], cross_seat: { model: "sonnet" }, cross_min_headroom_tokens: 30000 });
    assert("CONFIG: custom seats honored, family defaults to gemini", custom.seats.length === 1 && custom.seats[0].id === "devil" && custom.seats[0].family === "gemini");
    assert("CONFIG: the cross chair + its headroom floor ride the config", custom.cross.id === "cross_examiner" && custom.min_headroom === 30000);
    const off = loadSeats({ cross_family: false });
    assert("CONFIG: cross_family:false benches the 4th chair (3-chair council)", off.cross === null && off.seats.length === 3);
    assert("CONFIG: no file → the three original seats verbatim", loadSeats(null).seats.length === 3);
  }
  // M15 — the FOURTH chair: seated on headroom, refused on the $100 law
  {
    const rows = [];
    const c = await convene("why does quadratic attention survive the kv cache?", {
      seatsCfg: { seats: DEFAULT_SEATS, cross: CROSS_SEAT, min_headroom: 20000 },
      generate: genThree, recordUse: () => {}, capsules: null, env: {},
      headroom: { allowed: 300000 },
      claudeChair: async () => ({ ok: true, text: "the cache only amortizes projections the attention matrix itself is unavoidable growth", input_tokens: 900, output_tokens: 120, total_tokens: 1020, duration_ms: 4000 }),
      appendLedger: (r) => rows.push(r), writeFlag: () => {},
    });
    assert("FOUR chairs: the cross-examiner sits when the window can spare it", c.drafts.length === 4 && c.drafts.some(d => d.family === "claude"));
    assert("the sonnet spend rides the SHARED brain ledger", rows.length === 1 && rows[0].job === "council_chair" && rows[0].model === "sonnet" && rows[0].total_tokens === 1020);
    assert("the family travels into the Opus prompt", councilSection(c).includes("CROSS_EXAMINER · CLAUDE"));
    const cLow = await convene("q question here", { seatsCfg: { seats: DEFAULT_SEATS, cross: CROSS_SEAT, min_headroom: 20000 }, generate: genThree, recordUse: () => {}, capsules: null, env: {}, headroom: { allowed: 5000 }, claudeChair: async () => { throw new Error("must not be called"); }, appendLedger: () => { throw new Error("no"); }, writeFlag: () => {} });
    assert("HEADROOM GATE: a thin window benches the chair (window = deep reads first)", cLow.drafts.length === 3);
    const cKey = await convene("q question here", { seatsCfg: { seats: DEFAULT_SEATS, cross: CROSS_SEAT, min_headroom: 20000 }, generate: genThree, recordUse: () => {}, capsules: null, env: { ANTHROPIC_API_KEY: "sk-nope" }, headroom: { allowed: 300000 }, claudeChair: async () => { throw new Error("must not be called"); }, writeFlag: () => {} });
    assert("$100 LAW: a metered key benches the chair outright", cKey.drafts.length === 3);
    const cFail = await convene("q question here", { seatsCfg: { seats: DEFAULT_SEATS, cross: CROSS_SEAT, min_headroom: 20000 }, generate: genThree, recordUse: () => {}, capsules: null, env: {}, headroom: { allowed: 300000 }, claudeChair: async () => ({ ok: false }), writeFlag: () => {} });
    assert("a failed chair degrades to the 3-chair council (layering)", cFail.drafts.length === 3 && !cFail.cross_split);
  }
  // M15 — cross-family disagreement ⇒ council_flag ⇒ curriculum
  {
    let flag = null;
    const c = await convene("is retrieval quality worth more than model size?", {
      seatsCfg: { seats: DEFAULT_SEATS, cross: CROSS_SEAT, min_headroom: 20000 },
      generate: async () => ({ ok: true, text: "retrieval grounding recall precision chunks reranker corpus quality embedding" }),
      recordUse: () => {}, capsules: null, env: {}, headroom: { allowed: 300000 },
      claudeChair: async () => ({ ok: true, text: "parameters scaling emergent capability reasoning breadth compute frontier" , total_tokens: 500, duration_ms: 100 }),
      appendLedger: () => {},                          // hermetic — the real ledger never sees a fixture
      writeFlag: (o) => { flag = o; }, now: new Date("2026-07-15T03:30:00"),
    });
    assert("CROSS-FAMILY split ⇒ council_flag written (disagreement-as-curriculum)", c.cross_split && flag && flag.disagreement >= 0.85 && flag.families.length === 2 && flag.question.includes("retrieval"));
    assert("the flag is dated + names the seats", flag.date === "2026-07-15" && flag.seats.some(s => s.includes("claude")));
    let flag2 = null;
    const cSame = await convene("q question here", { seatsCfg: threeSeats, generate: async () => ({ ok: true, text: "identical words every chair speaks identical words every chair speaks" }), recordUse: () => {}, capsules: null, writeFlag: (o) => { flag2 = o; } });
    assert("same-family agreement → NO flag (the drill is for real splits)", flag2 === null && !cSame.cross_split);
  }
  // disagreement math + graceful degradation (unchanged laws)
  {
    const clones = disagreement([{ text: "the quadratic cost comes from pairwise attention scores" }, { text: "the quadratic cost comes from pairwise attention scores" }]);
    const split = disagreement([{ text: "completely about memory bandwidth saturation hardware" }, { text: "entirely conceptual misunderstanding pedagogical framing" }]);
    assert("clones read ~0 disagreement; disjoint drafts read ~1", clones < 0.1 && split > 0.9);
    const cSplit = { drafts: [{ seat: "a", text: "x" }, { seat: "b", text: "y" }], disagreement: 0.92, split: true };
    assert("a hard split is SURFACED as the crux, never papered over", councilSection(cSplit).includes("SPLIT HARD") && councilSection(cSplit).includes("crux"));
    const c = await convene("q", { seatsCfg: threeSeats, generate: async () => ({ ok: false }), recordUse: () => {}, capsules: null });
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
    console.log(`council: ${c.drafts.length} chair(s) drafted · disagreement ${c.disagreement}${c.split ? " — SPLIT (the crux is the signal)" : ""}${c.cross_split ? " — FAMILIES SPLIT (flagged for a drill)" : ""}`);
    for (const d of c.drafts) console.log(`\n[${d.seat}${d.family && d.family !== "gemini" ? " · " + d.family : ""}]\n${d.text.slice(0, 400)}`);
    return;
  }
  console.log("council.mjs — ask \"<question>\" | selftest");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { convene, councilSection, disagreement, crossFamilySplit, capsuleExcerpts, loadSeats, claudeChairAsync, DEFAULT_SEATS, CROSS_SEAT };
