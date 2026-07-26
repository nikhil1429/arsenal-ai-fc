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
  // EXTRACTION LAW — the honest test (REPAIRED; the E2E audit of 25 Jul 2026
  // found the old one was tautological dead code). The old filter ran AFTER the
  // dedup loop and rebuilt its haystack with the SAME pipeline that produced the
  // n-grams:
  //     sources.map(s => s.text.toLowerCase()
  //       .replace(/[^\p{L}\p{N}₹\s-]/gu, " ").replace(/\s+/g, " "))
  // Every kept phrase is by construction a contiguous token run of exactly that
  // normalized text, so `t.includes(phrase)` could never be false — the law
  // verified nothing. Worse, because punctuation had already been flattened to
  // space, phrases that STRADDLE a punctuation break ("recon; jaise" → "recon
  // jaise", "resolution 0 — warehouse" → "resolution 0 warehouse") were served
  // to him as "his anchor metaphors" — invention wearing extraction's shirt,
  // the exact thing this law exists to stop.
  // The repaired test keeps punctuation and collapses whitespace only: a phrase
  // is verbatim only if his raw words ran together with nothing but space
  // between them. It is applied to the CANDIDATES (not after dedup) so a bogus
  // cross-punctuation phrase can no longer swallow the real sub-phrase it
  // contains and then vanish, taking the real anchor down with it.
  const verbatim = sources.map(s => String(s.text).toLowerCase().replace(/\s+/g, " "));
  const isVerbatim = (phrase) => verbatim.some(t => t.includes(phrase));
  // recurring across ≥min_count occurrences AND ≥2 capsules (a personal anchor,
  // not a one-capsule phrase); longest-first dedup (drop sub-phrases of kept ones)
  const cands = [...counts.entries()]
    .filter(([phrase, e]) => e.count >= cfg.lexicon.min_count && e.capsules.size >= 2 && isVerbatim(phrase))
    .sort((a, b) => b[0].length - a[0].length || b[1].count - a[1].count);
  const kept = [];
  for (const [phrase, e] of cands) {
    if (kept.some(k => k.phrase.includes(phrase))) continue;
    kept.push({ phrase, count: e.count, sources: [...e.capsules], breaking_point: null });
    if (kept.length >= 25) break;
  }
  return kept;
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
    // E2E audit (25 Jul 2026) found: this was `retired.length` while the queue
    // exclusion above used the de-duplicating retiredKeys Set. Two entries for
    // the same capsule#index (a hand-repair, or an unlocked dugout-retire racing
    // the 21:45 run) removed ONE doubt from the queue but added TWO to the
    // counter — the one progress bar this brain believes, inflated forever and
    // never repairable by more running. The counter now counts what the queue
    // counts: distinct retired doubts.
    doubts_retired: retiredKeys.size,
    retired,  // raw list kept verbatim — it carries retired_on dates; it is his data, not a derived count
  };
}

// ---------------------------------------------------------------------------
// THE TAPE ROOM — guards on the way in (all three added by the E2E audit, 25 Jul 2026)
// ---------------------------------------------------------------------------

// GUARD 1 — never confuse "no history yet" with "history I could not read".
// E2E audit (25 Jul 2026) found: main() read prior retires via readJson(TAPE),
// which returns null on a MISSING file and on an unreadable/corrupt one alike.
// retired then fell back to [] and the run unconditionally writeAtomic()'d over
// tape_room.json. One malformed byte (hand-edit typo) or a transient EBUSY at
// the scheduled 21:45 run — the moment another organ happened to have the file
// open — and every doubt he ever retired was erased, silently, with a cheerful
// "doubts_retired=0" on stdout. There is no recovering that from the capsules.
// So: absent → legitimately start empty; present-but-unreadable → ABORT the run,
// write NOTHING, and say so loudly. A skipped night costs nothing; a wiped
// counter costs the only progress bar this brain believes.
// io is injected so the selftest can exercise every branch without touching disk.
function loadRetiredSafe(path, io = { exists: existsSync, read: readFileSync }) {
  if (!io.exists(path)) return { ok: true, retired: [], reason: "absent — fresh start" };
  let raw;
  try { raw = io.read(path, "utf8"); } catch (e) { return { ok: false, retired: null, reason: `unreadable (${e.message})` }; }
  let j;
  try { j = JSON.parse(raw); } catch (e) { return { ok: false, retired: null, reason: `not valid JSON (${e.message})` }; }
  if (!j || typeof j !== "object" || !Array.isArray(j.retired)) {
    return { ok: false, retired: null, reason: "parses, but carries no retired[] array — this is not a tape_room.json" };
  }
  return { ok: true, retired: j.retired, reason: "loaded" };
}

// GUARD 2 — a retire must name a doubt that EXISTS.
// E2E audit (25 Jul 2026) found: retire mode checked only that <capsule> was
// truthy and <doubt_index> parsed as an int — never that the pair existed in the
// capsules. A near-miss id from the dugout's rematch call ('tokenisation' for
// 'tokenization') appended a phantom retire: doubts_retired climbed by one
// forever while the REAL doubt stayed in the queue, unbeaten. That directly
// breaks the header's constitutional line "doubts_retired only ever climbs by
// real retires". Validate against what is actually on disk, and on failure print
// the valid ids/range so the caller can self-correct.
function validateRetireTarget(capsules, capsule, idx) {
  const c = capsules.find(x => x.id === capsule);
  if (!c) return { ok: false, reason: `unknown capsule "${capsule}"`, valid: capsules.map(x => x.id) };
  const n = Array.isArray(c.doubts) ? c.doubts.length : 0;
  if (!Number.isInteger(idx) || idx < 0 || idx >= n) {
    return { ok: false, reason: n ? `doubt_index ${idx} out of range for "${capsule}" (valid 0..${n - 1})` : `capsule "${capsule}" has no doubts`, valid: [] };
  }
  return { ok: true, reason: "valid target", valid: [] };
}

// GUARD 3 — an unrecognised mode is an error, not a run.
// E2E audit (25 Jul 2026) found: mode came straight from argv[2] and anything
// unrecognised fell through to the default `run` path — so a fat-fingered
// `selftst` or `retrie` fired the REAL writer against real state while the
// captain believed he was testing. Modes are an allowlist now; unknown → usage
// and exit 1, before a single file is touched.
const MODES = new Set(["run", "retire", "selftest"]);
const USAGE = "usage: node scripts/doubtminer.mjs [run | retire <capsule> <doubt_index> | selftest]";
const resolveMode = (argv2) => { const m = String(argv2 ?? "run").toLowerCase(); return MODES.has(m) ? m : null; };

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
  // E2E audit (25 Jul 2026): this check used to assert `a.phrase.length > 0` — it
  // asserted NOTHING, guarding a filter that itself could never fire. Real test
  // now: rebuild the raw sources with punctuation INTACT (whitespace collapsed
  // only) and demand every anchor appear inside one of them. Against the old
  // code this fails loudly — the fixture's ~20 "resolution <n> warehouse wala
  // naksha" anchors leap the em-dash in "crisp resolution 0 — warehouse …",
  // words he never once said back to back.
  const rawSources = [];
  for (const c of caps(20)) { rawSources.push(c.bolo, c.deep); for (const d of c.doubts) rawSources.push(d.a); }
  const rawSpaced = rawSources.map(t => t.toLowerCase().replace(/\s+/g, " "));
  assert("EXTRACTION LAW — every anchor verbatim in a source (punctuation respected)",
    lex.anchors.length > 0 && lex.anchors.every(a => rawSpaced.some(t => t.includes(a.phrase))));
  assert("EXTRACTION LAW — no anchor leaps a punctuation break", !lex.anchors.some(a => /resolution \d+ warehouse/.test(a.phrase)));
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
  // E2E audit (25 Jul 2026): the line above only ever checked the QUEUE side of
  // idempotence — doubts_retired was retired.length and quietly read 2 for one
  // retired doubt. This is the half that was missing.
  const dup = buildTapeRoom(caps(3), [{ capsule: "tok", doubt_index: 0, retired_on: "2026-07-12" }, { capsule: "tok", doubt_index: 0, retired_on: "2026-07-13" }], cfg, now);
  assert("duplicate retires counted ONCE (doubts_retired de-duplicated like the queue)", dup.doubts_retired === 1 && dup.retired.length === 2);

  // GUARDS on the way in (E2E audit 25 Jul 2026) — no disk touched; io injected
  const io = (content) => ({ exists: () => true, read: () => { if (content instanceof Error) throw content; return content; } });
  const absentIo = { exists: () => false, read: () => { throw new Error("must not be read"); } };
  assert("absent tape_room.json = legitimate fresh start", (() => { const r = loadRetiredSafe("x", absentIo); return r.ok === true && r.retired.length === 0; })());
  assert("good tape_room.json returns its retires", loadRetiredSafe("x", io(JSON.stringify({ retired: [{ capsule: "tok", doubt_index: 0 }] }))).retired.length === 1);
  assert("CORRUPT tape_room.json ABORTS — never silently reset to zero retires", loadRetiredSafe("x", io("{ not json")).ok === false && loadRetiredSafe("x", io("{ not json")).retired === null);
  assert("unreadable tape_room.json (EBUSY) ABORTS, does not read as empty", loadRetiredSafe("x", io(Object.assign(new Error("EBUSY"), {}))).ok === false);
  assert("tape_room.json with no retired[] ABORTS", loadRetiredSafe("x", io("{}")).ok === false);

  const rcaps = caps(3);
  assert("retire target — real capsule#index accepted", validateRetireTarget(rcaps, "tok", 0).ok === true);
  assert("retire target — typo'd capsule id REJECTED (no phantom retire)", validateRetireTarget(rcaps, "tokenisation", 0).ok === false);
  assert("retire target — out-of-range doubt_index REJECTED", validateRetireTarget(rcaps, "tok", 3).ok === false && validateRetireTarget(rcaps, "tok", -1).ok === false);

  assert("unknown argv mode rejected, never falls through to a real run", resolveMode("selftst") === null && resolveMode("retrie") === null && resolveMode(undefined) === "run" && resolveMode("RETIRE") === "retire");

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const mode = resolveMode(process.argv[2]);   // GUARD 3 — unknown modes no longer fall through to a real run
  if (mode === null) { console.error(`doubtminer: unknown mode "${process.argv[2]}" — nothing written.\n${USAGE}`); process.exit(1); }
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  const cfg = loadConfig();
  const now = new Date();
  // GUARD 1 — corrupt tape_room.json must never be mistaken for an empty one
  const prevTape = loadRetiredSafe(TAPE);
  if (!prevTape.ok) {
    console.error(`doubtminer: REFUSING TO RUN — ${TAPE} exists but ${prevTape.reason}.`);
    console.error("  Writing now would reset doubts_retired to 0 and erase every retire. Nothing was written.");
    console.error("  Repair (or move aside) that file, then re-run. The queue rebuilds itself from the capsules; the retires do not.");
    process.exit(1);
  }
  let retired = prevTape.retired;

  const capsules = loadCapsules();   // loaded BEFORE retire now — GUARD 2 validates the target against it

  if (mode === "retire") {
    const capsule = process.argv[3];
    const idx = parseInt(process.argv[4], 10);
    if (!capsule || Number.isNaN(idx)) { console.log("usage: node scripts/doubtminer.mjs retire <capsule> <doubt_index>"); process.exit(1); }
    const target = validateRetireTarget(capsules, capsule, idx);   // GUARD 2 — no phantom retires
    if (!target.ok) {
      console.error(`doubtminer: refusing to retire — ${target.reason}. Nothing written.`);
      if (target.valid.length) console.error(`  known capsules: ${target.valid.join(", ")}`);
      process.exit(1);
    }
    if (!retired.some(r => r.capsule === capsule && r.doubt_index === idx)) {
      retired = retired.concat([{ capsule, doubt_index: idx, retired_on: localDate(now) }]);
    }
  }

  writeAtomic(GRAMMAR, mineGrammar(capsules, cfg, now));
  writeAtomic(LEXICON, buildLexicon(capsules, cfg, now));
  const tape = buildTapeRoom(capsules, retired, cfg, now);
  writeAtomic(TAPE, tape);
  console.log(`doubtminer: ${capsules.length} capsule(s), ${tape.queue.length} in the tape-room queue, doubts_retired=${tape.doubts_retired} → ${TAPE}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { mineGrammar, buildLexicon, buildTapeRoom, extractAnchors, classifyShape, loadConfig, loadCapsules,
         loadRetiredSafe, validateRetireTarget, resolveMode };   // guards exported for the audit's regression tests (25 Jul 2026)
