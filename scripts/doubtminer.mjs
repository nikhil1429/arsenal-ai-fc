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
  // min_content_words (#4) — see isConnectivePhrase() for the measurement that
  // earned the 1. It is a config key precisely so it can be retuned from data
  // rather than re-argued in code.
  lexicon: { min_ngram: 2, max_ngram: 5, min_count: 2, min_content_words: 1 },
  // GATE 2 (#34) — FORGE_SPEC's cold-reader slip-catcher. fragment_max_tokens is
  // MEASURED, not guessed: across the 112 live doubts (4 Aug 2026) the token-count
  // distribution is p10=4, p25=6, median=8 — only ONE doubt in the whole bank sits
  // at ≤2 tokens ("Polysemy kya?"). A 2-token bar therefore sits below the 10th
  // percentile and cannot sweep up a normal atomic doubt; it catches exactly the
  // stub shape the spec names ("Zyada temp = ?").
  gate2: { enabled: true, fragment_max_tokens: 2, near_duplicate_prefix_tokens: 6 },
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
        gate2: { ...DEFAULTS.gate2, ...(j.gate2 || {}) },
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
    // AUDIT #106 — a bare gated word ("warming_up") tells him nothing: not how far
    // off he is, not which half is short. `status` keeps its enum (manager.mjs:159
    // and calibration.mjs pattern-match that vocabulary — changing it would break
    // them), and this line carries the have/need pair beside it.
    gate_line: `${capsules.length}/${cfg.gates.min_capsules} capsules · ${total}/${cfg.gates.min_doubts} doubts`,
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
// FROZEN VERBATIM (layering law) — the pre-#4 stopword list. Kept because
// extractAnchorsLegacy below is frozen against it and must keep behaving exactly
// as it did on 4 Aug 2026.
const STOP_V0 = new Set(("the a an is are was were hai hain ka ki ke ko se me mein par aur ya to of in on at for with and or but it this that yeh woh jo bhi nahi nhi ho kar karta karti karte hota hoti hote agar toh phir jaise matlab like when what why how i you he she we they").split(" "));

// AUDIT #4 (4 Aug 2026) — THE MINED LEXICON WAS FILLER, NOT HIS VOICE.
// The 25 anchors live on 4 Aug included "karne se pehle", "yahan asli baat",
// "do alag level", "saare purane", "pehle saare", "yaad nahi -" and "tokenization
// ne" — pure connective tissue served to him as GHAR KI BOLI, his own metaphors.
// The cause is that STOP_V0 above is an ENGLISH list with a token handful of
// Hindi words bolted on, while he writes Hinglish: `karne`, `pehle`, `saare`,
// `yahan`, `ne`, `wala`, `kaise`, `kya`, `abhi`, `chahiye` were all invisible to
// it, so an n-gram made entirely of them passed the boundary test.
// This list ADDS the missing Hinglish function words (postpositions, pronouns,
// auxiliaries, question words, quantifiers) plus the English closed class.
// It is a superset — nothing that was a stopword stopped being one.
const STOP_HINGLISH = ("be been being if then than these those its as by from into about over under not no do does did have has had will would can could should shall may might must me my your his her our their there here which who whom whose so such very just also only more most some any each every other same too much many both either neither one two three ek do teen char tha thi hona hone honge hogi hoga na ne haan wo vo yahan wahan kahan kaise kaisa kaisi kya kyu kyun kyunki jaisa jaisi fir ab abhi tab kab sab saare saara saari sabhi kuch koi apna apne apni uska uski uske iska iski iske isko usko inko unko mera meri mere tera teri tere hum tum aap unka unki unke wala wale wali karo karna karne kiya kiye kare karenge raha rahi rahe rakhna dena lena leta deta hi bas pehle baad liye chahiye padega padta padti sakta sakti sakte gaya gayi gaye diya diye laga lagi lage lagta dekhna dekho socho samajh chalta chalte chalti banta bante banti nikalta nikalti lekin magar sirf tak wagera").split(" ");
const STOP = new Set([...STOP_V0, ...STOP_HINGLISH]);

// A token that carries meaning: not a function word, and long enough to be a word
// rather than an initial. The length floor (3) is NOT new — it is the same floor
// the extraction engine has always used at the `gram.every(...)` guard below.
const isContentWord = (w) => !STOP.has(w) && String(w).length >= 3;
// The normalizer keeps `-` and `₹`, so a phrase can end on a bare "-" ("yaad nahi -"
// was a live anchor). A boundary token must contain an actual letter or digit.
const hasAlnum = (w) => /[\p{L}\p{N}]/u.test(String(w));

// THE QUALITY FILTER (#4). A candidate is CONNECTIVE TISSUE — not an anchor — when
// its edges are function words / punctuation, or when it carries fewer than
// `min_content_words` real words.
//   MEASURED, not guessed (live capsules, 4 Aug 2026): the engine mined 25 anchors.
//   Boundary + Hinglish stops alone drop 9 of them; adding min_content_words = 1
//   drops the 10th ("yaad nahi -"), leaving 15 — every survivor a phrase he
//   actually coined ("business cliffhanger", "frozen vocab", "vector search",
//   "diagram poore concept ki reed", "reply ke andar kv-memory", "code validates").
//   min_content_words = 2 was also measured: it removes only "ai proposes", a real
//   phrase of his, for no filler gain — so 1 is the earned value, and it lives in
//   config (`lexicon.min_content_words`) rather than in this line.
function isConnectivePhrase(phrase, minContentWords) {
  const w = String(phrase).split(" ").filter(Boolean);
  if (!w.length) return true;
  const first = w[0], last = w[w.length - 1];
  if (STOP.has(first) || STOP.has(last)) return true;
  if (!hasAlnum(first) || !hasAlnum(last)) return true;
  return w.filter(isContentWord).length < minContentWords;
}

// ---------------------------------------------------------------------------
// FROZEN VERBATIM (CLAUDE.md layering law) — the pre-#4 extractor, byte-for-byte
// as it stood on 4 Aug 2026, still reachable and still exported. It is the engine
// that produced the 25 live anchors; the selftest below runs it side-by-side with
// the repaired one so the improvement is a MEASURED difference, not a claim.
// It reads STOP_V0 deliberately: freezing an engine and letting its data drift is
// not freezing it.
// ---------------------------------------------------------------------------
function extractAnchorsLegacy(capsules, cfg) {
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
        if (STOP_V0.has(gram[0]) || STOP_V0.has(gram[gram.length - 1])) continue;
        if (gram.every(w => STOP_V0.has(w) || w.length < 3)) continue;
        const phrase = gram.join(" ");
        const e = counts.get(phrase) || { count: 0, sources: new Set(), capsules: new Set() };
        e.count++; e.sources.add(src.capsule + ":" + src.field); e.capsules.add(src.capsule);
        counts.set(phrase, e);
      }
    }
  }
  const verbatim = sources.map(s => String(s.text).toLowerCase().replace(/\s+/g, " "));
  const isVerbatim = (phrase) => verbatim.some(t => t.includes(phrase));
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

// THE PLAN OF RECORD (#4). Same extraction engine — the EXTRACTION LAW below is
// untouched — with the connective-tissue filter applied at candidate time, so a
// filler n-gram can no longer swallow (via longest-first dedup) the real anchor
// nested inside it and then be discarded itself, taking the anchor with it.
// `stats` is an optional out-param the caller may pass to learn how much glue was
// rejected. It exists because the obvious counter — legacy_count − new_count — is a
// LIE: the keep-list is capped at 25, so every filtered phrase is immediately
// backfilled by the next candidate and the difference reads 0 while ten connectives
// were in fact removed (measured live, 4 Aug 2026). Count the rejections, not the
// survivors.
function extractAnchors(capsules, cfg, stats = null) {
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
        // #4 — this admission guard stays on STOP_V0 ON PURPOSE. Every NEW rejection
        // is made in one place (isConnectivePhrase, below) so it can be COUNTED.
        // Tightening the guard here instead would produce the same anchor list while
        // reporting "0 filtered", because the glue would be dropped before it was ever
        // a candidate — a counter that reads 0 for a filter that fired is the same
        // class of lie as the literal assertions this audit exists to repair.
        if (STOP_V0.has(gram[0]) || STOP_V0.has(gram[gram.length - 1])) continue;
        if (gram.every(w => STOP_V0.has(w) || w.length < 3)) continue;
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
  const minContent = Number.isFinite(cfg.lexicon && cfg.lexicon.min_content_words) ? cfg.lexicon.min_content_words : DEFAULTS.lexicon.min_content_words;
  let filtered = 0;
  const cands = [...counts.entries()]
    .filter(([phrase, e]) => {
      if (!(e.count >= cfg.lexicon.min_count && e.capsules.size >= 2 && isVerbatim(phrase))) return false;
      if (isConnectivePhrase(phrase, minContent)) { filtered++; return false; }   // #4 — GHAR KI BOLI, not grammar glue
      return true;
    })
    .sort((a, b) => b[0].length - a[0].length || b[1].count - a[1].count);
  if (stats) stats.connectives_filtered = filtered;
  const kept = [];
  for (const [phrase, e] of cands) {
    if (kept.some(k => k.phrase.includes(phrase))) continue;
    kept.push({ phrase, count: e.count, sources: [...e.capsules], breaking_point: null });
    if (kept.length >= 25) break;
  }
  return kept;
}

function buildLexicon(capsules, cfg, now = new Date()) {
  // #4 — the filter's own receipt: how many candidate n-grams were rejected as
  // connective tissue. Printed, not gated on; it is how a future drift shows up.
  const stats = { connectives_filtered: 0 };
  const anchors = extractAnchors(capsules, cfg, stats);
  return {
    date: localDate(now),
    status: anchors.length ? "ok" : "awaiting_data",
    low_confidence: capsules.length < 4,
    generated_at: now.toISOString(),
    // #106 — a counter, not a bare word
    anchor_line: `${anchors.length} anchors kept · ${stats.connectives_filtered} connective n-gram(s) rejected (#4)`,
    filtered_connectives: stats.connectives_filtered,
    anchors,
    law: "reach for his anchors first; a foreign analogy only when no anchor fits — and never past its breaking point",
  };
}

// ---------------------------------------------------------------------------
// GATE 2 — THE COLD-READER SLIP-CATCHER (audit #34, 4 Aug 2026)
// ---------------------------------------------------------------------------
// FORGE_SPEC.md §3/§5 mandates a GATE 2 content-verify at every LOCK/SAVE: every
// doubts[].q checked against the COLD-READER STANDARD — cryptic / fragment / meta
// / near-duplicate → FLAG → captain approves the fix → only then "done". It has
// existed as prose since 2026-07-02 and NEVER ONCE FIRED: no runtime surface
// carries it (.claude/skills/forge/SKILL.md step 10 transcribes GATE 1 and stops,
// and that skill is the only artifact loaded at a lock). A deterministic scan on
// 4 Aug 2026 found 16-17 of the 112 live doubts violating the spec's OWN named
// failure patterns — and all of them sit in tape_room.json's queue as VERBATIM
// rematch prompts, so a cold future-Nikhil is served "ye to inference vali cheez
// hi hai na?" with no way to know what "ye" was.
//
// THIS IS FLAG-ONLY, BY DESIGN AND BY NECESSITY:
//   · by design — GATE 2 is a flag→approval→fix procedure in the spec itself;
//   · by necessity — capsules are read-only MIRRORS of the canonical gist, so no
//     local write could repair one. The repair must reach the gist through the
//     captain. This organ's whole job is to make sure he KNOWS.
// It lives here because doubtminer already walks every doubt nightly at 21:45 and
// already owns the queue — so a bad doubt is caught in the same pass that would
// otherwise arm it as a rematch prompt.
//
// Every pattern below is one the spec names in its own words (FORGE_SPEC.md §3,
// "3 failure-patterns (yahi pakadne — Gate 2 inhe flag karta)"). Nothing is
// invented, and no threshold is guessed — see DEFAULTS.gate2 for the arithmetic.
const GATE2_PATTERNS = {
  // 1. CRYPTIC — the subject is not named. The spec forbids a dangling
  //    ye / woh / Map / second-enemy / (pehle-guess) by name (FORGE_SPEC.md §3).
  cryptic: [
    /^\s*[("[]?\s*(ye|yeh|woh|wo|is|us|iska|uska|inka|unka)\b/i,
    /\(\s*pehle[-\s]?guess\s*\)/i,
    /\bsecond enemy\b/i,
    /\bmap kaunsa\b/i,
    /\bhar layer pe same kv\b/i,      // the spec's verbatim ❌ CRYPTIC example
  ],
  // 2. FRAGMENT — hangs off the doubt next to it; alone it says nothing.
  //    "Zyada temp = ?" is the spec's verbatim ❌ example.
  fragment: [
    /=\s*\??\s*$/,                     // trails off into an equals sign
    /^\s*\?+\s*$/,
  ],
  // 3. META / TO-DO — not a knowledge doubt at all: curriculum planning, a status
  //    note, a deferral. The spec says PRUNE ("koi cold-reader jawab banta hi nahi").
  meta: [
    /\[\s*resolved/i,
    /\bnahi seekhna\b/i, /\bnahi seekhn/i, /\bseekhunga\b/i, /\bseekhna hai\b/i,
    /\bkitni depth\b/i, /\bkacha samajh\b/i,
    /\bsamajhna (hai|zaroori|chahiye)\b/i,
    /\byaad rakhna pad/i,
    /\bderive karna chahiye\b/i,
    /\babhi nahi\b/i,
  ],
};

const gate2Norm = (q) => String(q || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);

// Returns { checked, flagged, by_pattern, flags[] } — never throws, never writes,
// never rewrites a single character of his content.
function gate2Flags(capsules, cfg = DEFAULTS, now = new Date()) {
  const g = { ...DEFAULTS.gate2, ...((cfg && cfg.gate2) || {}) };
  const flags = [];
  const by_pattern = { cryptic: 0, fragment: 0, meta: 0, near_duplicate: 0 };
  let checked = 0;
  const prefixes = new Map();   // first-N-tokens → the doubt that claimed it
  for (const c of capsules || []) {
    for (const [i, d] of (c.doubts || []).entries()) {
      checked++;
      const q = String((d && d.q) || "");
      const tokens = gate2Norm(q);
      const hit = [];
      if (GATE2_PATTERNS.cryptic.some(r => r.test(q))) hit.push("cryptic");
      // a one- or two-word question carries no confusion-journey — the spec's
      // "ATOMIC ≠ terse" clause. Threshold is config, derivation in DEFAULTS.
      if (GATE2_PATTERNS.fragment.some(r => r.test(q)) || tokens.length <= g.fragment_max_tokens) hit.push("fragment");
      if (GATE2_PATTERNS.meta.some(r => r.test(q))) hit.push("meta");
      const key = `${c.id}|${tokens.slice(0, g.near_duplicate_prefix_tokens).join(" ")}`;
      if (tokens.length && prefixes.has(key)) hit.push("near_duplicate");
      else if (tokens.length) prefixes.set(key, `${c.id}#${i}`);
      if (!hit.length) continue;
      for (const h of hit) by_pattern[h]++;
      flags.push({
        capsule: c.id, doubt_index: i, patterns: hit,
        // VERBATIM, truncated only for the report — the queue still carries the full q
        q_first_100: q.slice(0, 100),
        duplicate_of: hit.includes("near_duplicate") ? prefixes.get(key) : undefined,
      });
    }
  }
  return {
    checked, flagged: flags.length, by_pattern, flags,
    // #106 — a have/need counter, never a bare gated word
    line: `${flags.length}/${checked} live doubts violate FORGE_SPEC GATE 2 (cold-reader standard)`,
    law: "FLAG ONLY. Capsules mirror the gist — the repair reaches the gist through the captain, never through this organ.",
    checked_at: now.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// THE TAPE ROOM — rematch queue + doubts_retired
// ---------------------------------------------------------------------------
function buildTapeRoom(capsules, retired, cfg, now = new Date()) {
  const retiredKeys = new Set(retired.map(r => `${r.capsule}#${r.doubt_index}`));
  // #34 — GATE 2 runs BEFORE the queue is built, so every rematch prompt carries
  // the verdict on its own cold-readability. `/rematch` can then refuse to serve a
  // flagged doubt (or serve it with the warning) instead of confronting a cold
  // future-Nikhil with "ye to inference vali cheez hi hai na?" and no antecedent.
  const g2 = gate2Flags(capsules, cfg, now);
  const g2By = new Map(g2.flags.map(f => [`${f.capsule}#${f.doubt_index}`, f.patterns]));
  const queue = [];
  for (const c of capsules) {
    const ageDays = c.lockedOn ? (now - new Date(c.lockedOn)) / 86400000 : 0;
    for (const [i, d] of (c.doubts || []).entries()) {
      const key = `${c.id}#${i}`;
      if (retiredKeys.has(key)) continue;
      // HARM CONTAINMENT (audit #107, 5 Aug 2026 — captain approved).
      // Gate 2 has flagged 17 of 112 live doubts as cryptic/fragment/meta, and every
      // one of them was still `eligible: true` — so a cold future-Nikhil would be
      // served *"ye to inference vali cheez hi hai na?"* with no antecedent, which is
      // the precise harm the COLD-READER STANDARD exists to prevent. Fixing the TEXT
      // is his (the prose is sacred, and only he can edit the gist). Fixing the
      // SERVING is ours, and needs no approval on content: a flagged doubt is held OUT
      // of the queue until its flag clears. The row stays, verbatim, carrying its flag
      // and its reason — nothing is deleted, nothing is rewritten, and the moment he
      // repairs the wording the next run re-admits it automatically.
      const g2flag = g2By.get(key) || null;
      const oldEnough = ageDays >= cfg.tape_room.min_age_days;
      queue.push({
        capsule: c.id, doubt_index: i, q_verbatim: d.q, locked_on: c.lockedOn || null,
        eligible: oldEnough && !g2flag,
        ineligible_reason: !oldEnough ? "too young" : g2flag ? "gate2: not cold-readable yet" : null,
        gate2_flag: g2flag,
      });
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
    // #106 — the progress bar as a have/need pair, so "0" is never read as "fine"
    retire_line: `${retiredKeys.size}/${retiredKeys.size + queue.length} doubts retired`,
    // #34 — the GATE 2 verdict rides on the queue's own file, minus the per-doubt
    // duplication (each entry already carries its gate2_flag).
    gate2: { checked: g2.checked, flagged: g2.flagged, by_pattern: g2.by_pattern, line: g2.line, law: g2.law, flags: g2.flags,
      // #107 — say what the flag now COSTS, so "flagged" is never read as "noted and served anyway"
      withheld_from_queue: queue.filter(q => q.gate2_flag && !q.eligible).length,
      withheld_note: "flagged doubts are held OUT of the rematch queue until the wording is repaired — content untouched, re-admitted automatically" },
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

  // ---- AUDIT #4 — THE MINED LEXICON WAS FILLER --------------------------------
  // Proven as a DIFFERENCE against the frozen pre-#4 engine, on a fixture built
  // from the shapes that were actually live on 4 Aug ("karne se pehle",
  // "yahan asli baat", "saare purane"). Both engines run; only one may serve glue.
  {
    const fillerCaps = ["a", "b"].map((id) => ({
      id, lockedOn: "2026-06-15",
      bolo: "warehouse wala naksha socho. yeh karne se pehle woh dekhna hota hai. yahan asli baat alag hai",
      deep: "warehouse wala naksha phir se. yeh karne se pehle woh dekhna hota hai. yahan asli baat alag hai",
      doubts: [{ q: "q", a: "warehouse wala naksha yahan chalta hai" }],
    }));
    const before = extractAnchorsLegacy(fillerCaps, cfg).map(a => a.phrase);
    const after = extractAnchors(fillerCaps, cfg).map(a => a.phrase);
    const isGlue = (p) => /karne se pehle|yahan asli baat/.test(p);
    assert("#4 — the FROZEN engine really does mine connective tissue (the bug, reproduced)", before.some(isGlue));
    assert("#4 — the repaired engine serves NONE of it", !after.some(isGlue));
    assert("#4 — and his real anchor survives the filter (a filter that eats his voice is worse than the filler)",
      after.some(p => p.includes("warehouse wala naksha")));
    assert("#4 — Hinglish function words are stopwords now (they were invisible to the English-only list)",
      ["karne", "pehle", "saare", "yahan", "ne", "wala", "kaise", "kya", "abhi", "chahiye", "isko", "uska", "matlab", "raha", "bhi"].every(w => STOP.has(w))
      && !STOP_V0.has("karne") && !STOP_V0.has("pehle"));
    assert("#4 — a phrase that is ALL glue, or ends on bare punctuation, is connective; a real one is not",
      isConnectivePhrase("karne se pehle", 1) && isConnectivePhrase("yaad nahi -", 1)
      && isConnectivePhrase("do alag level", 1) && !isConnectivePhrase("warehouse wala naksha", 1)
      && !isConnectivePhrase("business cliffhanger", 1));
    assert("#4 — the filter is a CONFIG key, not a constant (min_content_words raises the bar)",
      isConnectivePhrase("ai ka ml", 1) === true && isConnectivePhrase("ai proposes", 1) === false && isConnectivePhrase("ai proposes", 2) === true);
    const lexF = buildLexicon(fillerCaps, cfg, now);
    // the counter must count REJECTIONS, not the survivor delta: the keep-list is
    // capped at 25, so on the live bank the delta reads 0 while 10 connectives were
    // actually removed. A counter that reports 0 for a filter that fired is the
    // same class of lie as the literal assertions this audit is repairing.
    const probe = { connectives_filtered: -1 };
    extractAnchors(fillerCaps, cfg, probe);
    assert("#4 — the lexicon reports REJECTIONS, not the survivor delta (the cap would hide the delta)",
      probe.connectives_filtered > 0 && lexF.filtered_connectives === probe.connectives_filtered
      && /connective n-gram\(s\) rejected/.test(lexF.anchor_line));
  }

  // ---- AUDIT #34 — FORGE_SPEC GATE 2, THE COLD-READER SLIP-CATCHER ------------
  // Every fixture below is a doubt that is LIVE in his capsules right now, or a
  // verbatim ❌ example from FORGE_SPEC.md §3. Nothing invented.
  {
    const g2caps = [{
      id: "context", lockedOn: "2026-06-15", doubts: [
        { q: "model ko pura input yaad rahe — kaunsa enemy pehle marta? (pehle-guess)" },  // spec:113 — named token
        { q: "ye to inference vali cheez hi hai na?" },                                     // dangling `ye`
        { q: "second enemy = menu size jo logits se banta?" },                              // spec:113 + trailing =
        { q: "har layer pe SAME KV cache?" },                                               // spec:120 verbatim ❌ CRYPTIC
        { q: "chop/summarize/RAG kaise chalta - nahi seekhna?" },                           // spec:122 verbatim ❌ META
        { q: "Zyada temp = ?" },                                                            // spec:121 verbatim ❌ FRAGMENT
        { q: "[RESOLVED 21 Jun] ANN cold-recall - 4 din pehle nervous, ab?" },              // spec:122 verbatim ❌ META
        // the control: a doubt that PASSES. If the scanner ever flags this, it is
        // flagging his good work and the check must go red.
        { q: "maine socha embeddings ka cosine aur dot product same cheez hain kyunki dono direction dekhte, phir laga normalize karne ke baad hi same hote — toh bina normalize kiye kaunsa sahi hai?" },
      ],
    }, {
      id: "dupes", lockedOn: "2026-06-15", doubts: [
        { q: "tokenizer frozen vocab ke bahar ka shabd kaise todta hai jab woh dictionary mein hai hi nahi" },
        { q: "tokenizer frozen vocab ke bahar ka shabd kaise todta hai — dobara wahi sawaal" },
      ],
    }];
    const g2 = gate2Flags(g2caps, cfg, now);
    const flagged = new Set(g2.flags.map(f => `${f.capsule}#${f.doubt_index}`));
    assert("#34 — GATE 2 flags the spec's own named CRYPTIC patterns (dangling ye, second-enemy, (pehle-guess), the KV example)",
      ["context#0", "context#1", "context#2", "context#3"].every(k => flagged.has(k)));
    assert("#34 — it flags the spec's verbatim META and FRAGMENT examples too",
      flagged.has("context#4") && flagged.has("context#5") && flagged.has("context#6"));
    assert("#34 — a GOOD doubt is NOT flagged (a scanner that flags everything flags nothing)",
      !flagged.has("context#7"));
    assert("#34 — a near-duplicate is caught and NAMED, not just counted",
      flagged.has("dupes#1") && g2.flags.find(f => f.capsule === "dupes").duplicate_of === "dupes#0");
    assert("#34 — patterns are reported per-kind, and the count is a have/need line (#106)",
      g2.by_pattern.cryptic > 0 && g2.by_pattern.meta > 0 && g2.by_pattern.fragment > 0 && g2.by_pattern.near_duplicate === 1
      && g2.checked === 10 && /\d+\/10 live doubts/.test(g2.line));
    assert("#34 — FLAG ONLY: not one character of his content is rewritten",
      g2caps[0].doubts[1].q === "ye to inference vali cheez hi hai na?" && /FLAG ONLY/.test(g2.law));
    // the address: the flag rides on the rematch prompt itself, in the queue
    const tapeG2 = buildTapeRoom(g2caps, [], cfg, now);
    assert("#34 — every queued rematch prompt carries its own GATE 2 verdict (that is the surface)",
      tapeG2.queue.every(q => "gate2_flag" in q)
      && tapeG2.queue.find(q => q.capsule === "context" && q.doubt_index === 1).gate2_flag.includes("cryptic")
      && tapeG2.queue.find(q => q.capsule === "context" && q.doubt_index === 7).gate2_flag === null);
    assert("#34 — the tape room reports the flagged count beside the queue it armed",
      tapeG2.gate2.flagged === g2.flagged && tapeG2.gate2.checked === 10);
    assert("#34 — a clean bank flags nothing and still reports honestly (0/n, never silence)",
      (() => { const clean = gate2Flags([{ id: "x", doubts: [{ q: g2caps[0].doubts[7].q }] }], cfg, now); return clean.flagged === 0 && clean.checked === 1 && /0\/1 live doubts/.test(clean.line); })());
  }

  // ---- AUDIT #106 — every gated status carries its have/need counter -----------
  {
    const gated = mineGrammar(caps(5), cfg, now);
    assert("#106 — a 'warming_up' grammar says HOW SHORT it is, not just the word",
      gated.status === "warming_up" && gated.gate_line === `4/${cfg.gates.min_capsules} capsules · 20/${cfg.gates.min_doubts} doubts`);
    const open = mineGrammar(caps(20), cfg, now);
    assert("#106 — the counter is live in the OPEN state too (it never becomes decoration)",
      open.status === "ok" && open.gate_line === `4/${cfg.gates.min_capsules} capsules · 80/${cfg.gates.min_doubts} doubts`);
    const t = buildTapeRoom(caps(3), [{ capsule: "tok", doubt_index: 0 }], cfg, now);
    assert("#106 — doubts_retired is reported as retired/total, so 0 is never read as 'fine'",
      t.retire_line === `1/${t.queue.length + 1} doubts retired`);
  }

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
  console.log(`doubtminer: ${capsules.length} capsule(s), ${tape.queue.length} in the tape-room queue, ${tape.retire_line} → ${TAPE}`);
  // #34 — GATE 2's whole point is that the captain SEES the count. A flag nobody
  // reads is the prose gate all over again.
  if (tape.gate2.flagged) {
    console.log(`doubtminer: ⚠ GATE 2 — ${tape.gate2.line}`);
    console.log(`  by pattern: ${Object.entries(tape.gate2.by_pattern).filter(([, n]) => n).map(([k, n]) => `${k}=${n}`).join(" · ")}`);
    for (const f of tape.gate2.flags) console.log(`    ${f.patterns.join("+").padEnd(18)} ${(f.capsule + "#" + f.doubt_index).padEnd(16)} ${JSON.stringify(f.q_first_100)}`);
    console.log("  These are queued as VERBATIM rematch prompts. Capsules mirror the gist — repair them there, not here.");
  } else {
    console.log(`doubtminer: GATE 2 — ${tape.gate2.line}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { mineGrammar, buildLexicon, buildTapeRoom, extractAnchors, classifyShape, loadConfig, loadCapsules,
         loadRetiredSafe, validateRetireTarget, resolveMode,     // guards exported for the audit's regression tests (25 Jul 2026)
         extractAnchorsLegacy, isConnectivePhrase, STOP, STOP_V0,   // #4 — frozen engine + the filter, both reachable
         gate2Flags, GATE2_PATTERNS };                              // #34 — GATE 2, so a reader can flag without re-implementing
