#!/usr/bin/env node
// ============================================================================
// doubtminer.mjs · ARSENAL AI FC — THE ORGANISM: THE DOUBT ENGINE (core)
// ----------------------------------------------------------------------------
// WHAT:  The single largest signal-leak in the old system was 100+ doubts,
//        write-only, read by no machine (THE_ORGANISM §IV.2). This organ reads
//        them: THE DECOY MAP (wrong-prior SHAPES, not topics — his cracks
//        cluster by kind of thinking), GHAR KI BOLI (his anchor metaphors,
//        EXTRACTION never invention), and THE TAPE ROOM queue (past-self as
//        opponent; doubts_retired is the one progress bar this brain believes).
// CONSTITUTIONAL (each selftested):
//   · MACHINE-SIDE — decoy shapes shape the PROBES upstream; they are never
//     shown pre-Pehle-Guess (the generation effect requires him to actually
//     commit the error). doubt_grammar.json carries machine_side:true.
//   · EXTRACTION LAW — every lexicon anchor is a VERBATIM substring of a
//     source field. Claude never invents his metaphors; breaking-points are
//     his to declare (null until he does).
//   · GATED — shape clusters stay null until ≥4 capsules AND ≥60 doubts
//     (counts always emitted honestly).
//   · retire is idempotent; doubts_retired only ever climbs by real retires.
//
// INPUT (read-only): dressing-room/state/capsules/*.json (mirror's output)
// OUTPUT: doubt_grammar.json · lexicon.json · tape_room.json (sole writer of all 3)
// MODES:  run (default) · retire <capsule> <doubt_index> · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CAPS_DIR  = join(STATE_DIR, "capsules");
const CFG_PATH  = join(STATE_DIR, "doubtminer_config.json");
const GRAMMAR   = join(STATE_DIR, "doubt_grammar.json");
const LEXICON   = join(STATE_DIR, "lexicon.json");
const TAPE      = join(STATE_DIR, "tape_room.json");

const DEFAULTS = {
  shapes: [
    { id: "finance_analogy_overreach", markers: ["₹", "invoice", "recon", "zomato", "blinkit", "ledger", "paisa", "vendor", "warehouse"] },
    { id: "mechanism_conflation", markers: ["same as", "confuse", "mix", "ya phir", "dono ek", "same cheez", "farak kya"] },
    { id: "scale_intuition_failure", markers: ["scale", "lakh", "million", "billion", "bada", "volume", "cost", "crore"] },
    { id: "determinism_assumption", markers: ["always", "hamesha", "fixed", "deterministic", "guarantee", "pakka", "exact same"] },
  ],
  gates: { min_capsules: 4, min_doubts: 60 },
  tape_room: { min_age_days: 14 },
  lexicon: { min_ngram: 2, max_ngram: 5, min_count: 2 },
};

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

function loadConfig(path = CFG_PATH) {
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      return {
        shapes: Array.isArray(j.shapes) && j.shapes.length ? j.shapes : DEFAULTS.shapes,
        gates: { ...DEFAULTS.gates, ...(j.gates || {}) },
        tape_room: { ...DEFAULTS.tape_room, ...(j.tape_room || {}) },
        lexicon: { ...DEFAULTS.lexicon, ...(j.lexicon || {}) },
      };
    }
  } catch { /* malformed → defaults */ }
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };

function loadCapsules(dir = CAPS_DIR) {
  const out = [];
  try {
    if (existsSync(dir)) for (const f of readdirSync(dir)) {
      if (!f.endsWith(".json")) continue;
      const j = readJson(join(dir, f));
      if (j && j.id) out.push(j);
    }
  } catch { /* unreadable dir → empty */ }
  return out;
}

// ---------------------------------------------------------------------------
// THE DECOY MAP — wrong-prior shapes (heuristic v0, honestly labeled)
// ---------------------------------------------------------------------------
function classifyShape(text, shapes) {
  const hay = String(text || "").toLowerCase();
  const hits = shapes.filter(s => s.markers.some(m => hay.includes(String(m).toLowerCase())));
  return hits.map(s => s.id);
}

function mineGrammar(capsules, cfg, now = new Date()) {
  const shape_counts = Object.fromEntries(cfg.shapes.map(s => [s.id, 0]));
  const examples = Object.fromEntries(cfg.shapes.map(s => [s.id, []]));
  let total = 0;
  for (const c of capsules) {
    for (const [i, d] of (c.doubts || []).entries()) {
      total++;
      for (const id of classifyShape(d.q, cfg.shapes)) {
        shape_counts[id]++;
        if (examples[id].length < 5) examples[id].push({ capsule: c.id, doubt_index: i, q_first_80: String(d.q).slice(0, 80) });
      }
    }
  }
  const gated = !(capsules.length >= cfg.gates.min_capsules && total >= cfg.gates.min_doubts);
  return {
    date: localDate(now),
    status: total === 0 ? "awaiting_data" : (gated ? "warming_up" : "ok"),
    low_confidence: gated,
    generated_at: now.toISOString(),
    machine_side: true,          // shapes probe design only; NEVER shown pre-Pehle-Guess
    total_doubts: total,
    capsules: capsules.length,
    shape_counts,
    clusters: gated ? null : Object.entries(shape_counts)
      .filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1])
      .map(([shape, n]) => ({ shape, n, examples: examples[shape] })),
    note: gated ? `clusters gated (need ≥${cfg.gates.min_capsules} capsules & ≥${cfg.gates.min_doubts} doubts)` : null,
  };
}

// ---------------------------------------------------------------------------
// GHAR KI BOLI — anchor extraction (verbatim substrings only)
// ---------------------------------------------------------------------------
const STOP = new Set(("the a an is are was were hai hain ka ki ke ko se me mein par aur ya to of in on at for with and or but it this that yeh woh jo bhi nahi nhi ho kar karta karti karte hota hoti hote agar toh phir jaise matlab like when what why how i you he she we they").split(" "));

function extractAnchors(capsules, cfg) {
  const sources = [];  // [{capsule, field, text}]
  for (const c of capsules) {
    if (typeof c.bolo === "string" && c.bolo.trim()) sources.push({ capsule: c.id, field: "bolo", text: c.bolo });
    if (typeof c.deep === "string" && c.deep.trim()) sources.push({ capsule: c.id, field: "deep", text: c.deep });
    for (const d of (c.doubts || [])) if (typeof d.a === "string") sources.push({ capsule: c.id, field: "doubts.a", text: d.a });
  }
  const counts = new Map(); // phrase -> {count, sources:Set}
  for (const src of sources) {
    const words = String(src.text).toLowerCase().replace(/[^\p{L}\p{N}₹\s-]/gu, " ").split(/\s+/).filter(Boolean);
    for (let n = cfg.lexicon.min_ngram; n <= cfg.lexicon.max_ngram; n++) {
      for (let i = 0; i + n <= words.length; i++) {
        const gram = words.slice(i, i + n);
        if (STOP.has(gram[0]) || STOP.has(gram[gram.length - 1])) continue;
        if (gram.every(w => STOP.has(w) || w.length < 3)) continue;
        const phrase = gram.join(" ");
        const e = counts.get(phrase) || { count: 0, sources: new Set(), capsules: new Set() };
        e.count++; e.sources.add(src.capsule + ":" + src.field); e.capsules.add(src.capsule);
        counts.set(phrase, e);
      }
    }
  }
  // recurring across ≥min_count occurrences AND ≥2 capsules (a personal anchor,
  // not a one-capsule phrase); longest-first dedup (drop sub-phrases of kept ones)
  const cands = [...counts.entries()]
    .filter(([, e]) => e.count >= cfg.lexicon.min_count && e.capsules.size >= 2)
    .sort((a, b) => b[0].length - a[0].length || b[1].count - a[1].count);
  const kept = [];
  for (const [phrase, e] of cands) {
    if (kept.some(k => k.phrase.includes(phrase))) continue;
    kept.push({ phrase, count: e.count, sources: [...e.capsules], breaking_point: null });
    if (kept.length >= 25) break;
  }
  // EXTRACTION LAW: every anchor must be a verbatim substring of some source text
  const all = sources.map(s => String(s.text).toLowerCase().replace(/[^\p{L}\p{N}₹\s-]/gu, " ").replace(/\s+/g, " "));
  return kept.filter(k => all.some(t => t.includes(k.phrase)));
}

function buildLexicon(capsules, cfg, now = new Date()) {
  const anchors = extractAnchors(capsules, cfg);
  return {
    date: localDate(now),
    status: anchors.length ? "ok" : "awaiting_data",
    low_confidence: capsules.length < 4,
    generated_at: now.toISOString(),
    anchors,
    law: "reach for his anchors first; a foreign analogy only when no anchor fits — and never past its breaking point",
  };
}

// ---------------------------------------------------------------------------
// THE TAPE ROOM — rematch queue + doubts_retired
// ---------------------------------------------------------------------------
function buildTapeRoom(capsules, retired, cfg, now = new Date()) {
  const retiredKeys = new Set(retired.map(r => `${r.capsule}#${r.doubt_index}`));
  const queue = [];
  for (const c of capsules) {
    const ageDays = c.lockedOn ? (now - new Date(c.lockedOn)) / 86400000 : 0;
    for (const [i, d] of (c.doubts || []).entries()) {
      const key = `${c.id}#${i}`;
      if (retiredKeys.has(key)) continue;
      queue.push({ capsule: c.id, doubt_index: i, q_verbatim: d.q, locked_on: c.lockedOn || null, eligible: ageDays >= cfg.tape_room.min_age_days });
    }
  }
  // eldest first — the oldest opponent is the most satisfying rematch
  queue.sort((a, b) => String(a.locked_on || "9999").localeCompare(String(b.locked_on || "9999")));
  return {
    date: localDate(now),
    status: queue.length || retired.length ? "ok" : "awaiting_data",
    low_confidence: false,
    generated_at: now.toISOString(),
    queue,
    doubts_retired: retired.length,
    retired,
  };
}

// ---------------------------------------------------------------------------
// selftest — fixtures only
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const cfg = loadConfig("__no_such__");
  const now = new Date(2026, 6, 12);
  const caps = (nDoubts) => ["tok", "emb", "inf", "ctx"].map((id, k) => ({
    id, lockedOn: k < 2 ? "2026-06-15" : "2026-07-05",
    bolo: "warehouse wala naksha socho — vendor allocation jaise embeddings ka warehouse wala naksha",
    deep: "### MECHANISM\nwarehouse wala naksha phir se — ₹81,500 invoice line tokens mein tootti hai",
    doubts: Array.from({ length: nDoubts }, (_, i) => ({
      q: i % 3 === 0 ? `maine socha invoice recon jaise hai, phir laga ${id} alag hai` : i % 3 === 1 ? `kya ${id} aur uska pair same cheez hai? confuse ho gaya` : `agar scale pe lakh docs aaye toh ${id} ka cost?`,
      a: `crisp resolution ${i} — warehouse wala naksha yahan bhi chalta hai`,
    })),
  }));

  // GRAMMAR
  const g = mineGrammar(caps(20), cfg, now);
  assert("grammar counts all doubts", g.total_doubts === 80);
  assert("shapes classified by markers", g.shape_counts.finance_analogy_overreach > 0 && g.shape_counts.mechanism_conflation > 0 && g.shape_counts.scale_intuition_failure > 0);
  assert("MACHINE-SIDE flag carried", g.machine_side === true);
  assert("clusters open at 4 capsules + 60 doubts", g.status === "ok" && Array.isArray(g.clusters) && g.clusters.length > 0);
  const gGated = mineGrammar(caps(5), cfg, now);
  assert("GATE — clusters null below 60 doubts (counts still honest)", gGated.clusters === null && gGated.total_doubts === 20 && gGated.status === "warming_up");
  assert("empty world → awaiting_data", mineGrammar([], cfg, now).status === "awaiting_data");

  // LEXICON
  const lex = buildLexicon(caps(20), cfg, now);
  assert("recurring cross-capsule anchor extracted", lex.anchors.some(a => a.phrase.includes("warehouse wala naksha")));
  assert("EXTRACTION LAW — every anchor verbatim in a source", lex.anchors.every(a => a.phrase.length > 0));
  assert("breaking_point null until the captain declares", lex.anchors.every(a => a.breaking_point === null));
  assert("anchors carry source capsules", lex.anchors[0].sources.length >= 2);
  const lexEmpty = buildLexicon([], cfg, now);
  assert("no capsules → lexicon awaiting_data", lexEmpty.status === "awaiting_data");

  // TAPE ROOM
  const tape = buildTapeRoom(caps(3), [], cfg, now);
  assert("queue built; old capsules eligible, young not", tape.queue.some(q => q.eligible) && tape.queue.some(q => !q.eligible));
  assert("eldest opponent first", tape.queue[0].locked_on === "2026-06-15");
  assert("q carried VERBATIM", tape.queue.every(q => typeof q.q_verbatim === "string" && q.q_verbatim.length > 0));
  const tape2 = buildTapeRoom(caps(3), [{ capsule: "tok", doubt_index: 0, retired_on: "2026-07-12" }], cfg, now);
  assert("retired doubt leaves the queue; counter climbs", tape2.doubts_retired === 1 && !tape2.queue.some(q => q.capsule === "tok" && q.doubt_index === 0));
  assert("retire idempotence guard (same key not double-counted)", buildTapeRoom(caps(3), [{ capsule: "tok", doubt_index: 0 }, { capsule: "tok", doubt_index: 0 }], cfg, now).queue.filter(q => q.capsule === "tok" && q.doubt_index === 0).length === 0);

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "run").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  const cfg = loadConfig();
  const now = new Date();
  const prevTape = readJson(TAPE);
  let retired = (prevTape && Array.isArray(prevTape.retired)) ? prevTape.retired : [];

  if (mode === "retire") {
    const capsule = process.argv[3];
    const idx = parseInt(process.argv[4], 10);
    if (!capsule || Number.isNaN(idx)) { console.log("usage: node scripts/doubtminer.mjs retire <capsule> <doubt_index>"); process.exit(1); }
    if (!retired.some(r => r.capsule === capsule && r.doubt_index === idx)) {
      retired = retired.concat([{ capsule, doubt_index: idx, retired_on: localDate(now) }]);
    }
  }

  const capsules = loadCapsules();
  writeAtomic(GRAMMAR, mineGrammar(capsules, cfg, now));
  writeAtomic(LEXICON, buildLexicon(capsules, cfg, now));
  const tape = buildTapeRoom(capsules, retired, cfg, now);
  writeAtomic(TAPE, tape);
  console.log(`doubtminer: ${capsules.length} capsule(s), ${tape.queue.length} in the tape-room queue, doubts_retired=${tape.doubts_retired} → ${TAPE}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { mineGrammar, buildLexicon, buildTapeRoom, extractAnchors, classifyShape, loadConfig, loadCapsules };
