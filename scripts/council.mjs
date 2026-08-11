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
// LAWS:  EVERY SEAT IS BILLED TO THE BOOK THAT ACTUALLY PAID (corrected 11 Aug
//        2026 — this read "free-pool drafts ride T7's lane", which was true for
//        1 chair of 3: the prosecutor and the captain's-voice have ridden
//        `claude -p` haiku since 17 Jul, and both were charged to T7, a GEMINI
//        key's quota, while writing no brain_ledger row at all). Gemini seats
//        charge T7; every Claude seat — free-pool haiku and the sonnet
//        cross-chair alike — rides the Max window and ledgers into
//        brain_ledger.jsonl, so headroom() sees the spend the council causes.
//        The sonnet chair additionally is headroom-gated + refused outright if
//        a metered key is set. Failure degrades gracefully: 0 drafts → cortex
//        proceeds cold, exactly as before.
//        A SEAT'S DECLARED `family` IS ITS ENGINE (11 Aug 2026 — until today it
//        was an ORPHAN FIELD: council_config declared it, the router ignored it
//        for a `seat.id === "steelman"` test, and renaming that one seat would
//        have silently killed the cross-family lane. See familyRoute.)
// MODES: node scripts/council.mjs ask "<question>" · selftest
// ============================================================================

import { readFileSync, existsSync, readdirSync, appendFileSync, mkdirSync, writeFileSync, renameSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { generatePool } from "./hippocampus.mjs";
import { claudeGenAsync, ledgerForensics } from "./claudegen.mjs";
import { recordUse } from "./fuelboard.mjs";
import { headroom, loadConfig as loadBrainConfig } from "./brain.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CONFIG    = join(STATE_DIR, "council_config.json");
const FLAG      = join(STATE_DIR, "council_flag.json");
const BLEDGER   = join(STATE_DIR, "brain_ledger.jsonl");

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
// THE LEDGER IS HALF THE WINDOW, SO ITS READ MAY NOT SWALLOW (11 Aug 2026, wiring
// audit). What stood here was, verbatim:
//   const readLines = (p) => { const o = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch {} } } catch {} return o; };
// — one bare catch{} wrapped around the ENTIRE read, and exactly one caller in this
// file: the headroom() call that gates the 4th chair. brain.mjs's windowUsage() sums
// ledger rows and nothing else, so [] does not mean "unknown", it means "nothing has
// been spent" — the single most permissive answer the budget can be handed. Probed
// against the live files this morning:
//   headroom(loadConfig(), <4,694 real rows>, {}, now) → { allowed:         0, used: 1,831,748 }
//   headroom(loadConfig(), [],                {}, now) → { allowed: 1,520,000, used:         0 }
// …against the 10,000-token floor in council_config.json. So an EBUSY/EPERM on the
// one file in this repo most likely to be mid-write when we open it — the SHARED
// APPEND LANE, six live appenders — did not bench the chair: it took a HARD-EXHAUSTED
// window and read it as FULL CAP. That is the exact inverse of the law 450 lines down
// ("an unreadable window is not a spare window"), and only a throw out of
// brain_config/brain_queue was ever actually reaching that bench.
// The split below now matches what each failure MEANS:
//   · file absent     → [], honestly zero spend (brain.mjs's own reader agrees, :2899)
//   · torn tail line  → skipped in silence: a half-written last line on an append lane
//                       with six writers is that file's normal state, not a fault
//   · unreadable file → THROWS, into the bench-on-crash arm that already existed
const readLedger = (p) => {
  if (!existsSync(p)) return [];
  const o = [];
  for (const l of readFileSync(p, "utf8").split("\n")) {   // deliberately NOT wrapped — this throw IS the wire
    if (!l.trim()) continue;
    try { o.push(JSON.parse(l)); } catch {}
  }
  return o;
};
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

// THE BAKED BENCH — the fallback when council_config.json is missing/unreadable.
// FAMILIES CORRECTED 11 Aug 2026 (wiring audit, see familyRoute below): all three
// read `family: "gemini"` while the router sent two of them to `claude -p` haiku,
// so the baked bench lied about itself exactly the way the config file did. These
// two now DECLARE the engine they have actually ridden since 17 Jul. NO ENGINE
// MOVED — the selftest asserts familyRoute(s) === routeOfLegacy(s) for every seat
// here, which is the guard that this correction changed who decides, not what runs.
const DEFAULT_SEATS = [
  { id: "steelman", family: "gemini", brief: "You are THE STEELMAN. Build the strongest HONEST case / clearest mechanism-first explanation. No hedging, no straw." },
  { id: "prosecutor", family: "claude", brief: "You are THE PROSECUTOR. Attack the question's premises and every easy answer: where does it break, what's being conflated, what would a hostile staff engineer say. Honest attacks only." },
  { id: "captains_voice", family: "claude", brief: "You are THE CAPTAIN'S OWN VOICE — argue it the way HE would, using HIS anchors and phrasings from the capsule excerpts provided. Stay in his idiom (Hinglish welds fine)." },
];
// M15 — the 4th chair: a DIFFERENT family reads the same question. Families
// fail differently; where they diverge is exactly where his understanding
// needs a drill, not a consensus.
const CROSS_SEAT = { id: "cross_examiner", family: "claude", model: "sonnet", brief: "You are THE CROSS-EXAMINER, from a different model family than the other chairs. Answer the question yourself, first-principles, mechanism-first, dense. Do NOT hedge toward consensus; if the obvious answer has a crack, name it plainly." };
// The FREE-POOL seats that ride Claude do it on haiku (17 Jul: "the bus leaves
// in 25s"). Named ONCE, 11 Aug 2026, because the call site and the ledger row
// must never be able to disagree about which model was actually spent — the
// literal used to live only inside seatGen, where nothing else could read it.
const FREE_CLAUDE_MODEL = "haiku";

// ─────────────────────────────────────────────────────────────────────────────
// THE DECLARED FAMILY IS THE ROUTE (11 Aug 2026, wiring audit — the SIXTH door
// found built-but-not-wired, and the one that let canon lie about the bench).
//
// WHAT WAS BROKEN. Every seat carries a `family`; council_config.json declares one
// for all three chairs; loadSeats defaults it; councilSection prints it. NOTHING
// READ IT on the live path. The router was `seat.id === "steelman" ? "gemini" :
// "claude"` — an ID test — so a chair's declared family decided nothing about
// which engine it rode. Probed against the file on disk this morning (3 seats, all
// three declaring family "gemini"): ONE call reached the Gemini pool and TWO
// reached `claude -p`, and the labels came back steelman=gemini, prosecutor=claude,
// captains_voice=claude. The declaration and the engine had described different
// benches since 17 Jul. Two costs, both silent:
//   · ADD a chair to council_config declaring family "gemini" and it spends the
//     MAX WINDOW instead of the free pool — the same spend-blindness the free-seat
//     ledger block in convene() was written to end, walking back in through the
//     config door, and against a window the 4th chair is itself gated on.
//   · RENAME the steelman seat — a legitimate captain edit; the config's own _doc
//     says chairs shape the curriculum — and the ID test sends the WHOLE bench to
//     Claude. crossFamilySplit() then sees one family and returns null forever,
//     council_flag.json is never written again, and M15's disagreement-as-
//     curriculum lane dies with nothing in any file naming its death.
//
// THE FIX: the declared family picks the engine. An UNROUTABLE family is BENCHED
// BY NAME rather than quietly handed whichever engine is cheapest to call — a
// chair nobody can route is a canon typo, and this file's law is that an absence
// is named (councilSection's NOT AT THE TABLE line carries it into the Opus
// prompt). Adding a family here means teaching this map one key, in one place.
//
// NO BEHAVIOUR MOVED TODAY. The two seats that have ridden `claude -p` haiku since
// 17 Jul now SAY SO, in DEFAULT_SEATS and in council_config.json, so the live bench
// after this edit is the live bench before it. Whether those two belong back on the
// free Gemini pool — which is what the config's _doc used to claim — is a spend and
// latency call (17 Jul's reason was "the bus leaves in 25s"), HIS, not a wiring
// one, and this file does not make it.
const ENGINE_BY_FAMILY = { gemini: "gemini", claude: "claude" };
const familyRoute = (seat) => ENGINE_BY_FAMILY[String((seat && seat.family) || "").trim().toLowerCase()] || null;
// LAYERING — the PRE-AUDIT router, frozen verbatim; no longer the plan of record.
// It is kept because it is the only remaining record of which chair rode what
// before today, and because the selftest pins familyRoute against it across the
// baked bench: that assertion is what proves this repair moved the DECISION and
// not the ENGINES. It is also the shape any future id-test regression will match.
const routeOfLegacy = (seat) => (seat.id === "steelman" ? "gemini" : "claude");

function loadSeats(cfgObj) {
  const c = cfgObj !== undefined ? cfgObj : readJson(CONFIG);
  const seats = (c && Array.isArray(c.seats) && c.seats.length ? c.seats : DEFAULT_SEATS).map(s => ({ family: "gemini", ...s }));
  const cross = (c && c.cross_family === false) ? null : { ...CROSS_SEAT, ...((c && c.cross_seat) || {}) };
  return { seats, cross, min_headroom: (c && c.cross_min_headroom_tokens) || 20000 };
}

// ─────────────────────────────────────────────────────────────────────────────
// THE CAPTAIN'S DOOR (11 Aug 2026) — the FOURTH door found cut to the same shape.
//
// WHAT WAS BROKEN. capsuleExcerptsLegacy (frozen below) seeded the CAPTAIN'S-OWN-
// VOICE chair — the one seat whose entire job is his idiom — with three stacked
// silent cuts: `.slice(0, 200)` per bolo, `.slice(0, 900)` on the join, and
// `readdirSync().slice(0, 4)` on the file list. Measured live 11 Aug 2026: it
// returned 857 characters against 5,773 characters of `bolo` on disk = 14.8%,
// and every one of the four excerpts ended mid-WORD ("yaad nahi r", "vendor naam
// ke", "sab e^scores", "Vocab fact"). Worse than the arithmetic: only `bolo` was
// ever read. The chair's own brief says "Hinglish welds fine" — and the nine
// welds, threeWays and interviewLines, 40,822 further characters of his first-
// person voice, had no path into the seat AT ALL. Nothing in the payload named
// the drop. So the seat meant to argue in HIS idiom drafted from four cut-off
// sentences, and that draft is what councilSection() hands to cortex's ONE Opus
// integration call. Built, present, not wired — the same shape dugout.mjs:880-929
// fixed on 10 Aug (its 220-char per-axis cut) and cortex.mjs:102-141 fixed this
// morning (its 1,500-byte raw-bytes cut). The 200/900/4 shipped with no comment
// justifying any of them: three guessed numbers, which his standing rule forbids.
//
// THE FIX carries cortex's RULING across, not its code: emit his prose VERBATIM
// AND UNCUT, and NAME every layer deliberately left out with its exact character
// count, so the chair knows what it is not holding. NO NEW CAP REPLACES THE OLD
// CAPS — there is no `cap` argument any more, and the file list is no longer
// sliced (a fifth locked capsule used to be invisible here forever).
//
// WHY NOT simply import cortex.findCapsule(): cortex.mjs:55 imports THIS file, so
// the reverse edge would close an ESM cycle on the organism's most expensive
// lane. And the two doors have different jobs — cortex projects ONE capsule the
// wake is actually about (whole: mechanism, traps, all 26 doubts) into a one-shot
// Opus prompt; this door projects ALL capsules into a ≤150-word chair whose seed
// is labelled "HIS CAPSULE ANCHORS (his real words — use his idiom)".
//
// WHICH LAYERS TRAVEL, AND WHERE THAT CHOICE COMES FROM — not a threshold I
// picked. The default set is the four layers this repo ALREADY labels as his own
// first-person words: `bolo` ("how HE says it out loud — his voice, not yours",
// cortex.mjs:169), the faultLines strike+weld pair ("his own strike + weld,
// VERBATIM", cortex.mjs:172), `threeWays` ("THREE WAYS he explains it") and
// `interviewLines` ("INTERVIEW LINES (his own)"). Measured across the four live
// capsules that is 46,595 chars ≈ 11.6k tokens, 54x what the legacy door passed.
// Everything else — hook, mechanism, why, traps, doubts, and the `deep` re-learn
// layer (89,788 chars alone) — is CONTENT rather than idiom, and each is named in
// the payload footer with its size. If he wants any of them seated too, that is a
// one-key edit in council_config.json (`capsule_layers`), canon where the chairs
// already live — no code change, and no organ guessing on his behalf.
// ─────────────────────────────────────────────────────────────────────────────

const S_ = (v) => String(v == null ? "" : v);
// every layer a capsule can carry, and how to render it in HIS words. Order is
// the emission order; `id` is what council_config.capsule_layers names.
const CAPSULE_LAYERS = [
  { id: "bolo",           label: "BOLO (how HE says it out loud — his voice, not yours)", get: (j) => S_(j.bolo || j.anchor || (j.capsule && j.capsule.bolo)) },
  { id: "welds",          label: "HIS NINE AXES — his own strike + weld, VERBATIM (the Hinglish is his; keep it)", get: (j) => (Array.isArray(j.faultLines) ? j.faultLines : []).map(a => {
      const o = (a && typeof a === "object") ? a : {};
      return `[${S_(o.axis)}] ${S_(o.title)}${o.status ? ` (${S_(o.status)})` : ""}\n  STRIKE: ${S_(o.strike)}\n  WELD:   ${S_(o.weld)}`;
    }).join("\n") },
  { id: "threeWays",      label: "THREE WAYS he explains it", get: (j) => { const w = j.threeWays || {}; return (w.ceo || w.junior || w.skeptic) ? `  CEO:     ${S_(w.ceo)}\n  JUNIOR:  ${S_(w.junior)}\n  SKEPTIC: ${S_(w.skeptic)}` : ""; } },
  { id: "interviewLines", label: "INTERVIEW LINES (his own)", get: (j) => (Array.isArray(j.interviewLines) ? j.interviewLines : []).map(x => "- " + S_(x)).join("\n") },
  { id: "hook",           label: "HOOK", get: (j) => S_(j.hook) },
  { id: "mechanism",      label: "MECHANISM", get: (j) => S_(j.mechanism) },
  { id: "why",            label: "WHY", get: (j) => S_(j.why) },
  { id: "traps",          label: "TRAPS he has already walked into", get: (j) => (Array.isArray(j.traps) ? j.traps : []).map(t => "- " + (typeof t === "string" ? t : JSON.stringify(t))).join("\n") },
  { id: "doubts",         label: "DOUBTS HE ALREADY FOUGHT", get: (j) => (Array.isArray(j.doubts) ? j.doubts : []).map((d, i) => `${i + 1}. Q: ${S_(d.q || d.question)}\n   A: ${S_(d.a || d.answer)}`).join("\n") },
  { id: "deep",           label: "DEEP (his scratch-from-zero re-teach)", get: (j) => [...(Array.isArray(j.faultLines) ? j.faultLines : []).map(a => S_(a && a.deep)), S_(j.deep)].filter(x => x.trim()).join("\n\n") },
];
const VOICE_LAYERS = ["bolo", "welds", "threeWays", "interviewLines"];

// ── THE TORN CAPSULE (11 Aug 2026, wiring audit) — the same hole, one level UP ──
//
// WHAT WAS BROKEN. THE CAPTAIN'S DOOR above rebuilt the absence law at LAYER
// level: every layer left behind now names itself with its exact char count. The
// FILE level kept the old silence. Three skips dropped a whole locked capsule
// without a word: `catch { continue; }` on the parse, `if (!j || typeof j !==
// "object") continue;` on a non-object, and the un-pushed `parts.length > 1`
// tail. Then the footer — reached only by the survivors — affirmatively told the
// model the opposite: "Every layer of all N locked capsule(s) is above … nothing
// was dropped", with N counting the survivors, so a council that lost `inference`
// entirely read as a complete council of three.
// REPRODUCED, not assumed (probe, 11 Aug 2026, three fixture capsules a/b/c with
// c's JSON torn): the payload carried a and b only and the footer read
// "(Every layer of all 2 locked capsule(s) is above, VERBATIM and UNCUT — nothing
// was dropped.)" — the string `c` appeared nowhere in it. The four live capsules
// all parse today (checked the same morning: context 49,660 · embeddings 57,984 ·
// inference 60,805 · tokenization 41,107 bytes, all clean), which is exactly why
// this is worth wiring now rather than after: the producer is mirror.mjs, which
// re-fetches from the gist every 06:55 AND on every forge lock-close, so a torn
// pull is a network event away and this door is the one that would swallow it.
// Same silent starvation the 200/900/4 cuts caused, arriving through the mirror.
//
// THE FIX is councilSection()'s ruling, applied one level down: the empty chairs
// travel WITH the drafts. A file that could not be seated is named with its
// reason, the survivor count is stated as `N of M`, and "nothing was dropped" is
// now unreachable while anything was. No cap, no threshold, no new number — the
// only numbers here are counted from the directory listing.
// AND IT SURVIVES A TOTAL TEAR: with every file torn this used to return null,
// which the chair reads as "he has no locked capsules" — a lie of a different
// shape. It now returns the absence note alone. A genuinely EMPTY or missing
// capsules/ dir still returns null, because that one is true.
// No legacy freeze: this ADDS a report, it does not swap an engine — every
// surviving capsule renders byte-identically to this morning, and the pre-11-Aug
// door is already frozen verbatim as capsuleExcerptsLegacy below.
//
// his own words seed the third chair (READ-ONLY: capsules/ belongs to mirror.mjs
// — this file never writes there, never rewords a line, never re-emits one as
// its own). No cap, no file-list slice: see THE CAPTAIN'S DOOR above.
function capsuleExcerpts(dir = join(STATE_DIR, "capsules"), deps = {}) {
  try {
    const cfg = deps.config !== undefined ? deps.config : readJson(CONFIG);
    const want = (cfg && Array.isArray(cfg.capsule_layers) && cfg.capsule_layers.length) ? cfg.capsule_layers : VOICE_LAYERS;
    const on = CAPSULE_LAYERS.filter(L => want.includes(L.id));
    const off = CAPSULE_LAYERS.filter(L => !want.includes(L.id));
    const files = readdirSync(dir).filter(f => f.endsWith(".json"));   // ALL of them — a 5th capsule used to be invisible forever
    const blocks = [];
    const dropped = new Map();                                          // layer id → chars left behind, for the honest footer
    const unseated = [];                                                // file → why it never made the table (see THE TORN CAPSULE)
    for (const f of files) {
      let j = null;
      // the reason travels, the way seatFailure() carries a dead chair's cause:
      // "unreadable" and "the mirror wrote something that is not a capsule" are
      // different repairs, and a bare count could not tell them apart.
      try { j = JSON.parse(readFileSync(join(dir, f), "utf8")); }
      catch (e) { unseated.push(`${f} (unreadable — ${String((e && e.message) || e).slice(0, 120)})`); continue; }
      if (!j || typeof j !== "object") { unseated.push(`${f} (not a JSON object)`); continue; }
      const id = f.replace(/\.json$/, "");
      const parts = [`=== ${id}${j.title ? ` · ${S_(j.title)}` : ""}${j.lockedOn ? ` · locked ${S_(j.lockedOn)}` : ""} ===`];
      for (const L of on) { const t = L.get(j); if (t.trim()) parts.push(`${L.label}:\n${t}`); }   // VERBATIM AND UNCUT
      for (const L of off) { const n = L.get(j).length; if (n) dropped.set(L.id, (dropped.get(L.id) || 0) + n); }
      if (parts.length > 1) blocks.push(parts.join("\n"));
      // read fine, but carries nothing in the selected layers — the layer footer
      // cannot say this, because it reports SIZES summed across capsules and a
      // capsule contributing zero to every one of them is invisible in a sum.
      else unseated.push(`${id} (parsed, but no words in the selected layers: ${on.map(L => L.id).join("/")})`);
    }
    const torn = unseated.length
      ? `\n(⚠ NOT AT THE TABLE — ${unseated.length} of ${files.length} capsule file(s) could not be seated, so HIS WORDS IN THEM ARE MISSING, not absent: ${unseated.join(" · ")}. Do not read the bench above as his whole locked body of work.)`
      : "";
    if (!blocks.length) return torn ? torn.trim() : null;   // a total tear must not read as "he has no capsules"
    // ABSENCE IS NAMED — the silent drop IS the defect being removed here, so the
    // payload says its own shape and every layer it is not carrying says its size.
    // The `M` is the directory listing's own count, so the footer can no longer
    // claim completeness over files it never opened.
    const foot = dropped.size
      ? `\n(NOT INCLUDED, named so you know what you are not holding: ${[...dropped].map(([k, n]) => `${k} ${n} chars`).join(" · ")}. Everything above is his own words, VERBATIM and UNCUT, from ${blocks.length} of ${files.length} locked capsule(s).)${torn}`
      : torn
        ? `\n(Every layer of the ${blocks.length} capsule(s) above is here, VERBATIM and UNCUT — but not every capsule got here.)${torn}`
        : `\n(Every layer of all ${blocks.length} locked capsule(s) is above, VERBATIM and UNCUT — nothing was dropped.)`;
    return blocks.join("\n\n") + "\n" + foot;
  } catch { return null; }
}

// FROZEN VERBATIM (LAYERING law — the old engine never leaves the file). This is
// the door as it shipped until 11 Aug 2026; kept so the 14.8% starvation it
// caused stays auditable, and so any council_flag.json / cortex draft written
// before today can be read with the function that actually produced it in hand.
function capsuleExcerptsLegacy(dir = join(STATE_DIR, "capsules"), cap = 900) {
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

// the sonnet chair — async so the free chairs keep drafting while it thinks.
//
// LAYERING (10 Aug 2026, wiring audit): claudeChairAsyncLegacy below is the
// PRE-AUDIT chair, frozen verbatim; it is NO LONGER the plan of record. It
// spawned its own `claude -p` while this very file imported the shared engine
// at line 39 and used it for the haiku seats — built, present, not wired.
// Three costs, all measured in the live brain_ledger.jsonl:
//   · SPEND BLINDNESS. Its parser kept usage.input_tokens + output_tokens and
//     nothing else. All 5 council_chair rows ever written (7 Aug 2026) read
//     input 2 / total 340-473 and carry NO cache_creation key at all; same-
//     engine dmn_counter rows carry cache_creation ~14,400 on the same input 2.
//     The bulk of a CLI call lives in the cache pair (claudegen.mjs:123-127),
//     so the most expensive seat under-reported its real spend by ~30x into
//     the shared ledger the governor budgets against. The row builder below
//     was ALREADY reading r.cache_creation_tokens and r.limit_hit — the G1
//     honest meter arrived at the consumer and never at the producer.
//   · THE BOOT TAX. claudegen's LEAN_ARGS (G0, 9 Aug — measured 88.5% off a
//     bare probe) never reached this call, so the chair paid the full-CLI boot
//     every sitting, which is precisely the ~44k the lean flags exist to kill.
//   · THE SHIM. `execFile("claude", …)` used the bare name where claudegen's
//     BIN() probes %APPDATA%\npm\claude.cmd first — the exact EINVAL silent
//     death the 25 Jul E2E audit fixed in every other organ.
// The plan of record delegates to claudeGenAsync: one engine, one limit
// classifier, one honest meter, one binary probe. `ok` keeps the legacy's
// STRICTER reading (ok AND text) so a wordless seat still never sits — callers
// see byte-identical seating behaviour, only the meter changed.
function claudeChairAsync(prompt, model = "sonnet", timeoutMs = 20000, deps = {}) {
  const t0 = Date.now();
  const gen = deps.gen || claudeGenAsync;
  return Promise.resolve()
    .then(() => gen(prompt, model, timeoutMs))
    .then((r) => ({ ...r, ok: !!(r && r.ok && r.text), text: (r && r.text) || "" }))
    .catch((e) => ({ ok: false, text: "", total_tokens: 0, duration_ms: Date.now() - t0, error: String((e && e.message) || e).slice(0, 160) }));
}

// FROZEN VERBATIM (layering law) — the pre-10-Aug chair. Kept because it is the
// only record of what the 5 council_chair ledger rows above were produced by:
// read them with this function in hand, not the one above.
function claudeChairAsyncLegacy(prompt, model = "sonnet", timeoutMs = 20000, deps = {}) {
  const t0 = Date.now();
  return new Promise((resolve) => {
    const fail = (msg) => resolve({ ok: false, text: "", total_tokens: 0, duration_ms: Date.now() - t0, error: String(msg).slice(0, 160) });
    try {
      const execFn = deps.execAsync || execFile;
      const child = execFn("claude", ["-p", "--output-format", "json", "--model", model], {
        timeout: timeoutMs, encoding: "utf8", windowsHide: true, maxBuffer: 8 * 1024 * 1024,
        env: { ...process.env, ARSENAL_ORGAN: "1" },
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

// ── A CHAIR THAT DIES MUST SAY WHY ──────────────────────────────────────────
// 11 Aug 2026 (wiring audit). Both seat call sites ended `.catch(() => ({ ok:
// false }))`. The rejection's message went on the floor, and the ledger row
// built from that object came out with every field at its nothing-value. There
// is one on disk from the last live sitting:
//   {"ts":"2026-08-10T17:51:41.913Z","job":"council_chair", … "total_tokens":0,
//    "duration_ms":0,"ok":false,"error":null,"limit_hit":false,
//    "limit_signal":"none","http_status":null}
// The organism recorded that a chair died and recorded NOTHING about why —
// reproduced exactly by making the injected chair reject.
// THE CONSUMER IS REAL AND IT IS THE DAEMON ALARM. brain.mjs failureStreak()
// takes the non-gemini ok:false rows and reads forensicText(r) =
// `error_envelope || error` to name the cause; with both null the cause falls
// through to "unknown" (brain.mjs cause ladder) and the hint dies with it. So a
// council chair that dies because the CLI is NOT LOGGED IN — whose hint is
// "run `claude`, then /login" — is indistinguishable from one that hit the plan
// wall, whose hint is the opposite instruction. councilLedgerRow ALREADY reads
// r.error; the row was wired and the message never reached it. Built, present,
// not wired — the same shape as this morning's capsule door 200 lines up.
// duration_ms is MEASURED, never guessed: t0 is taken at the call site, the
// same way claudeChairAsync's own catch has always done it.
const seatFailure = (e, t0) => ({
  ok: false, text: "", total_tokens: 0, duration_ms: Date.now() - t0,
  error: String((e && e.message) || e || "chair threw with no message").slice(0, 160),
});

// ── ONE ROW SHAPE FOR EVERY CLAUDE SEAT AT THIS TABLE ───────────────────────
// Extracted 11 Aug 2026 (wiring audit) from the cross-chair's inline literal,
// field for field, so the free-pool seats could not be billed by a different
// hand than the 4th chair. The seat id rides too: `job: "council_chair"` keeps
// every existing council-spend reader working, and `seat` is what tells the 38
// haiku drafts apart from the 6 sonnet cross-reads inside it.
// WHY each field is what it is — the scars, in order:
//   · G1 (9 Aug 2026): limit_hit was hardcoded false, so a plan-limit chair
//     reply ledgered as an ordinary ok row and the window never learned it was
//     locked. The call's own verdict rides now.
//   · the CACHE PAIR is the honest meter (claudegen.mjs parseOut) — an
//     in+out-only row under-reports a CLI call by ~30x, and the governor
//     budgets on this number.
//   · the row is written for `r` at all, not only a good `r`: it used to live
//     inside the `if (r.ok && r.text)` branch, so the sitting the window most
//     needed to see — the chair that hit the wall — was the one that vanished.
//     A refused chair still paid the boot (brain.mjs does the same for every
//     night-shift job).
//   · `?? null`, never `|| 0`: an UNMEASURED number rendered as a measured zero
//     is the exact lie claudegen forbids; tokens_estimated rides beside it.
//   · ...ledgerForensics(r) is SPREAD, never hand-copied. The one caller that
//     copied its fields one at a time forgot error_envelope — the field
//     brain.mjs forensicText ORs FIRST, and the only thing that tells a 429
//     plan wall from a 500 server bug. claudegen.mjs's own selftest scans this
//     file's source for the spread; it goes red if a future edit drops it.
function councilLedgerRow(seatId, model, r) {
  return {
    ts: new Date().toISOString(), job: "council_chair", seat: seatId, engine: "claude", model,
    input_tokens: r.input_tokens ?? null, output_tokens: r.output_tokens ?? null,
    cache_creation_tokens: r.cache_creation_tokens ?? null, cache_read_tokens: r.cache_read_tokens ?? null,
    total_tokens: r.total_tokens || 0, tokens_estimated: r.tokens_estimated === true,
    duration_ms: r.duration_ms || 0, ok: !!(r.ok && r.text), error: r.error || null,
    limit_hit: r.limit_hit === true,
    ...ledgerForensics(r),
  };
}

async function convene(question, deps = {}) {
  const q = String(question || "").trim();
  if (!q) return { drafts: [], disagreement: 0, note: "no question" };
  const { seats, cross, min_headroom } = deps.seatsCfg !== undefined ? { min_headroom: 20000, cross: null, ...deps.seatsCfg } : loadSeats();
  // 17 Jul: the chairs ride Claude (haiku — the bus leaves in 25s) EXCEPT the
  // steelman seat, kept on Gemini deliberately: cross-FAMILY disagreement is
  // M15's whole signal, and an all-Claude bench would argue with one accent.
  // (11 Aug 2026: that arrangement is UNCHANGED, but it is now DECLARED — each
  // seat's `family`, in council_config.json and DEFAULT_SEATS — instead of being
  // hardcoded onto one seat's id, which is how a rename could kill the signal.)
  const gen = deps.generate || null;
  // THE ROUTE IS DECIDED ONCE (11 Aug 2026, wiring audit — see FREE_CLAUDE_MODEL).
  // The call, the tank charge, the ledger row and the family label all read this
  // one value now. They used to be two separate expressions — an id === "steelman"
  // test here and the identical one that built `fam` — which is how the spend and
  // the label could describe different engines without ever disagreeing in a way a
  // test could see. SECOND PASS, same day (see familyRoute): that surviving id test
  // is gone too. The DECLARED family now picks the engine; an undeclarable one is
  // benched by name and is never quietly given an engine it did not ask for.
  const routeOf = (seat) => gen ? "injected" : familyRoute(seat);
  const poolGen = deps.pool || ((p) => generatePool(p, { models: ["gemini-flash-latest"], maxOutputTokens: 2048 }));
  // THE BUS LEAVES ON TIME (live-arc scar, 14 Jul): a chair that misses the
  // deadline is dropped — the deep answer must land in the stuck→gone window,
  // and three perfect drafts 90s late are worth less than one on time.
  const deadline = deps.deadline_ms || 25000;
  // THE FREE SEATS GET THE BOARDING MARGIN TOO (11 Aug 2026, capsule-door audit).
  // These seats carried a HARDCODED 20000ms while the bus does not leave until
  // `deadline` (25000ms) — so a free seat shot itself 5s BEFORE the bus it was
  // trying to catch. seatMs is not a new number: it is the cross chair's own
  // formula below, verbatim, the one that already carries the comment "a hard 20s
  // cap benched it under contention (probed live: 11s alone, >20s busy)". The
  // free seats never got that lesson.
  // MEASURED on this lane 11 Aug 2026 — captains_voice on haiku, three live calls:
  //   · no capsule seed at all ....... 18,315ms  (cache_creation 10,457)
  //   · the legacy 857-char seed ..... 22,173ms  (cache_creation 10,737)  ← >20s: this
  //     seat was ALREADY being killed by its own cap, seed or no seed
  //   · the full 49,442-char payload . 19,033ms  (cache_creation 26,512)
  // So the wall clock is `claude -p` BOOT and is essentially flat in prompt size:
  // 2.5x the input tokens moved it by under a second, and the widest payload beat
  // the narrowest one. Serving his prose whole did not create this exposure — it
  // is what made it measurable. THE BUS DEADLINE IS UNTOUCHED: 25000 is his
  // number and it is tied to the stuck→gone window, not something this file may
  // widen on its own.
  const seatMs = Math.max(5000, deadline - 2000);
  // seatMs rides as a THIRD ARG rather than being closed over, so a test can see
  // the number the seat is actually given — a margin nothing can observe is how
  // the 20000 sat here unnoticed since 17 Jul (additive: an injected freeClaude
  // that only declares (p, model) is unaffected).
  const freeClaude = deps.freeClaude || ((p, model, ms) => claudeGenAsync(p, model, ms));
  const seatGen = (seat, route, p) => route === "injected" ? gen(p)
    : route === "gemini" ? poolGen(p)
    : freeClaude(p, seat.model || FREE_CLAUDE_MODEL, seatMs);
  const use = deps.recordUse || recordUse;
  const appendLedger = deps.appendLedger || ((row) => appendFileSync(BLEDGER, JSON.stringify(row) + "\n"));
  const capsules = deps.capsules !== undefined ? deps.capsules : capsuleExcerpts();
  // ── THE DRAFTS' DOOR (11 Aug 2026, wiring audit) — the SIXTH door found cut to
  // the same shape as the captain's door 300 lines up and the flag question below.
  //
  // WHAT WAS BROKEN. Both push sites wrote `text: String(r.text).slice(0, 1200)`.
  // Every chair's draft was amputated on the way OUT of this file, and the 1200
  // shipped with no comment justifying it: a guessed number, which his standing
  // rule forbids. Two consumers, both downstream of the cut:
  //   · cortex.mjs:735 — councilSection() is the ONLY field cortex reads off this
  //     result, and it embeds `d.text` whole into the ONE Opus integration prompt.
  //     So the deep read was handed drafts that stop mid-sentence and told to
  //     "integrate, don't average" them, with nothing in the payload naming the
  //     drop — the same silent-absence defect this file removed twice this morning.
  //   · disagreement() and crossFamilySplit(), right here — the jaccard word-sets
  //     are built from the SAME truncated strings. Two chairs that share a long
  //     preamble and diverge only PAST the cut score as clones: identical prefixes,
  //     jaccard 1, disagreement 0.00, cross_split false, no council_flag.json, no
  //     setpiece defend drill. The gate that reaches HIS curriculum was reading an
  //     amputated text. The selftest reproduces exactly that — search THE DRAFTS' DOOR.
  // MEASURED, not assumed: all five ok council_chair rows on the live ledger
  // (7 Aug 2026, job:"council_chair" ok:true) carry output_tokens 338 · 374 · 397 ·
  // 404 · 471. At the chars-per-token this repo already assumes for text —
  // claudegen's own estimator divides by 4 — that is ~1.35k-1.9k characters of
  // prose per chair, i.e. AT or PAST 1200 on every one of the five. claudegen sets
  // no thinking budget, so those are answer tokens, not hidden reasoning.
  //
  // THE FIX is the ruling this file has now carried across three times: VERBATIM
  // AND UNCUT. No new cap replaces the old cap. The drafts are already bounded by
  // the two things that legitimately bound them — the "≤150 words" every seat
  // prompt ends with (below) and the bus deadline — and their real spend is
  // ledgered per seat by councilLedgerRow, so the window sees the size honestly
  // rather than the prompt pretending it away. Cortex's lane is unaffected: its
  // reserve is a CONFIGURED est_tokens_per_wake of 40,000 (cortex.mjs:689), not a
  // measure of prompt length, and four uncut ≤150-word drafts move it by ~1k.
  // No legacy freeze — an inline `.slice()` is not an engine (same reading as the
  // flag question below), and the record of what the 7 Aug drafts were produced
  // by is this comment plus the ledger rows it cites.
  const drafts = [];
  // EVERY EMPTY SEAT, AND WHY (11 Aug 2026, wiring audit — see seatFailure and
  // councilSection). A chair failure used to be surfaced in exactly ONE case:
  // when ALL of them failed, via the `note` below. Anything short of a total
  // wipe — his own voice chair dying, the cross-family chair benched — left the
  // council looking merely smaller, never damaged.
  const benched = [];
  const bench = (seat, why) => benched.push({ seat, why: String(why).slice(0, 160) });
  const jobs = seats.map(async (seat) => {
    const seed = seat.id === "captains_voice" && capsules ? `\nHIS CAPSULE ANCHORS (his real words — use his idiom):\n${capsules}\n` : "";
    const route = routeOf(seat);
    // A CHAIR NOBODY CAN ROUTE DOES NOT GET A DEFAULT ENGINE (11 Aug 2026 — see
    // familyRoute). Falling through to gemini would hide a canon typo behind a
    // council that still looks healthy; falling through to claude would spend the
    // Max window on one. So the chair sits out, SAYS why, charges no tank and
    // writes no ledger row — a call that never happened must cost nothing and be
    // invisible nowhere.
    if (!route) { bench(seat.id, `unroutable family "${seat.family}" — this file routes ${Object.keys(ENGINE_BY_FAMILY).join(" / ")}; the chair sat out rather than be handed an engine it never declared`); return; }
    const t0 = Date.now();
    const r = await seatGen(seat, route, `${seat.brief}${seed}\nTHE QUESTION:\n${q}\n\nAnswer in ≤150 words, dense, no preamble.`).catch((e) => seatFailure(e, t0));
    // THE FREE SEATS' SPEND (11 Aug 2026, wiring audit — the defect this block
    // exists to close). Two of the three "free-pool" chairs have ridden
    // `claude -p` haiku since 17 Jul, and BOTH costs were being charged to the
    // wrong book:
    //   · the CHARGE. `use("T7", 1, 2500)` ran for every seat unconditionally.
    //     T7 is the DMN tank — key_index 5, model gemini-flash-latest, a numbered
    //     GEMINI key with a daily quota (fuelboard_config.json). A `claude -p`
    //     call never touched that key, so every sitting burned 3 units off a
    //     Gemini lane that had spent 1, and a 429 on that lane would have been
    //     charged to calls that never made it.
    //   · the LEDGER. claudeGenAsync is a pure ENGINE — it meters, it does not
    //     write (grep: no appendFileSync in claudegen.mjs); every caller writes
    //     its own brain_ledger row. These two seats never did. Census of the live
    //     brain_ledger.jsonl this morning: 4,564 rows, council_chair:6 — all six
    //     the 4th chair — and not one row for any free seat, against ~19
    //     cortex_wake convenes = up to 38 unledgered Max-window calls.
    //     brain.mjs windowUsage() sums ledger rows and nothing else, so
    //     headroom() — the gate that decides whether the deep Opus read may run,
    //     and the gate the 4th chair below is itself blocked by — was blind to
    //     spend the council itself caused. The header's LAW "free-pool drafts
    //     ride T7's lane" was true for 1 chair of 3.
    // The tank now sees only what actually hit a Gemini key; the window sees
    // every Claude token. Same row shape and same forensics spread as the 4th
    // chair (councilLedgerRow) — one shape, so the next seat added cannot be
    // forgotten the way these two were.
    if (route === "claude") appendLedger(councilLedgerRow(seat.id, seat.model || FREE_CLAUDE_MODEL, r));
    else use("T7", 1, 2500);
    // the family label follows the ENGINE that actually spoke — the
    // disagreement math groups by family and must never be lied to
    const fam = route === "injected" ? (seat.family || "gemini") : route;
    if (r.ok && r.text) drafts.push({ seat: seat.id, family: fam, text: String(r.text) });   // UNCUT — see THE DRAFTS' DOOR above
    // the GEMINI seat's death has nowhere else to go: it writes no ledger row by
    // law (the tank sees only what hit a Gemini key), so without this line a dry
    // pool takes the steelman off the bench leaving no trace in any file.
    else bench(seat.id, (r && r.error) || "empty reply — the chair spoke no words");
  });
  // M15 — the cross-family chair: headroom-gated, $100-law-guarded, ledgered
  if (cross) {
    jobs.push((async () => {
      // THE 4th CHAIR'S DECLARED FAMILY IS LOAD-BEARING TOO (11 Aug 2026, same
      // audit as familyRoute). This seat's engine is `claude -p` BY CONSTRUCTION —
      // the headroom gate, the $100 refusal, the sonnet model and the brain_ledger
      // row below are all Claude-shaped — yet its label was written straight from
      // cross.family. So `cross_seat: {"family":"gemini"}` in council_config would
      // have produced a CLAUDE draft wearing a GEMINI label, and crossFamilySplit()
      // groups by that label: two Claude chairs would have been compared as two
      // families, a >=0.85 divergence between them would have written
      // council_flag.json, and setpiece would have compiled HIM a defend drill off
      // a cross-family split that never happened. The free seats' law — the label
      // follows the engine that actually spoke — now covers this chair too, and
      // the bench says it out loud instead of the draft lying quietly.
      if (familyRoute(cross) !== "claude") { bench(cross.id, `declared family "${cross.family}" — this chair's engine is \`claude -p\` by construction (headroom gate, $100 law, ${cross.model}); only family "claude" can ride it`); return; }
      const env = deps.env || process.env;
      // never metered, ever — and the refusal now NAMES itself, in claudegen's
      // own refuse() wording, so the two lawful benches below can never be read
      // as the same event as a crash.
      if (env.ANTHROPIC_API_KEY) { bench(cross.id, "REFUSED — ANTHROPIC_API_KEY set (subscription only, ever)"); return; }
      let hr = deps.headroom;
      if (hr === undefined) {
        const hrFn = deps.headroomFn || (() => headroom(loadBrainConfig(), readLedger(BLEDGER), readJson(join(STATE_DIR, "brain_queue.json")) || {}, new Date()));
        // BENCHING ON A CRASH STAYS RIGHT: an unreadable window is not a spare
        // window, and the chair must never spend against a number nobody has.
        // What was wrong until 11 Aug 2026 is that the crash erased itself —
        // `catch { hr = { allowed: 0 } }` rendered an unparseable brain_config,
        // a corrupt brain_queue and an honestly-thin window as ONE silent bench,
        // so the seat could sit out indefinitely with nothing anywhere naming
        // the difference between "no room tonight" and "this is broken".
        // …and the BIGGEST of the three inputs was never reaching this arm at all
        // (same day, second pass): the ledger read swallowed its own errors and
        // handed headroom() an empty array, which is not a crash — it is a
        // confident "zero spent". readLedger() throws now (grep it — the whole
        // measurement is in its header), so the input this guard cares about
        // most finally lands in the catch with the other two.
        try { hr = hrFn(); }
        catch (e) { hr = { allowed: 0 }; bench(cross.id, `headroom unreadable — ${String((e && e.message) || e)}`); }
      }
      // the window belongs to deep reads first. The two numbers are MEASURED
      // (hr.allowed as returned, min_headroom as configured) — nothing here is
      // a threshold this file invented.
      if (!hr || hr.allowed < min_headroom) {
        if (!benched.some(b => b.seat === cross.id)) bench(cross.id, `window too thin — ${(hr && hr.allowed) || 0} < ${min_headroom} tokens allowed, deep reads have first call`);
        return;
      }
      // the chair gets the full bus window minus the boarding margin — a hard
      // 20s cap benched it under contention (probed live: 11s alone, >20s busy)
      const call = deps.claudeChair || ((p) => claudeChairAsync(p, cross.model, Math.max(5000, deadline - 2000)));
      const tX = Date.now();
      const r = await call(`${cross.brief}\nTHE QUESTION:\n${q}\n\nAnswer in ≤150 words, dense, no preamble.`).catch((e) => seatFailure(e, tX));
      // the spend rides the SHARED brain ledger — the window sees every token.
      // The row is built by councilLedgerRow (above): the field-by-field WHY —
      // G1's limit_hit, the honest meter, the ?? null law, the forensics spread
      // — lives there, because as of 11 Aug this seat is no longer the only
      // caller and a rationale nailed to one call site is how the free seats
      // went eight weeks unledgered.
      if (r) appendLedger(councilLedgerRow(cross.id, cross.model, r));
      if (r && r.ok && r.text) {
        // UNCUT — see THE DRAFTS' DOOR above. This seat is the one the cut hurt
        // most: it is the ONLY cross-family read, the only one paid for on the Max
        // window, and crossFamilySplit() scores it against the gemini bench.
        drafts.push({ seat: cross.id, family: cross.family || "claude", text: String(r.text) });
      } else bench(cross.id, (r && r.error) || "empty reply — the chair spoke no words");
    })());
  }
  await Promise.race([Promise.all(jobs), new Promise((res) => setTimeout(res, deadline))]);
  const seated = drafts.slice();                     // late chairs talk to an empty room
  const empty = benched.slice();                     // …and the empty chairs travel WITH the drafts, not instead of them
  const dis = disagreement(seated);
  // M15 — cross-family disagreement is CURRICULUM: flag it for the set-piece
  const cf = crossFamilySplit(seated);
  const crossSplit = !!(cf && cf.disagreement >= 0.85);
  if (crossSplit) {
    // THE DOOR TO THE DRILL (11 Aug 2026, wiring audit) — the FIFTH door found cut
    // to the same shape as the capsule door above, and the one that reaches HIM.
    //
    // WHAT WAS BROKEN. This wrote `question: q.slice(0, 200)`. The live
    // council_flag.json on disk this morning ends mid-WORD: "…Review: ~early
    // Septembe". That string is not a machine key — `q` is wake.spotlight.text
    // (cortex.mjs:623), which on this lane is HIS OWN typed Hinglish line — and it
    // has exactly two consumers, both in setpiece.mjs, both downstream of the cut:
    //   · :588 builds the defend drill's claim as `your own read of: "<question>"`,
    //     so the amputated sentence is quoted back to him AS HIS OWN WORDS. He is
    //     asked to defend a claim that stops mid-syllable.
    //   · :585 resolves the drill's `concepts` by running conceptsFromText() over
    //     that same truncated text against the concepts.json registry. A registry
    //     id living in the tail is simply gone, so the drill attaches to the wrong
    //     ids or to none — and scorer.gafferPropose() turns those ids into the
    //     gaffer book's CLAIM (the exact ledger poisoning setpiece.mjs:175-184
    //     already had to fix once, from the other end).
    // The 200 shipped with no comment justifying it: a guessed number, which his
    // standing rule forbids. Nothing downstream wants a shorter string — and this
    // file already hands the chairs the FULL `q` in a paid prompt at line 385, so
    // the whole question has always been affordable; only the drill was starved.
    //
    // THE FIX is the ruling this file already carried across for the captain's
    // door: VERBATIM AND UNCUT. No new cap replaces the old cap. No legacy freeze —
    // an inline `.slice()` is not an engine, and the record of what the 7 Aug flag
    // was produced by is this comment plus the file on disk.
    (deps.writeFlag || ((o) => writeAtomic(FLAG, o)))({
      date: localDate(deps.now || new Date()), ts: new Date().toISOString(),
      question: q, disagreement: cf.disagreement, families: cf.families,
      seats: seated.map(d => `${d.seat}(${d.family})`),
    });
  }
  return { drafts: seated, benched: empty, disagreement: dis, split: dis >= 0.85 && seated.length >= 2, cross_split: crossSplit, note: seated.length ? undefined : "every chair empty (pool dry/late) — the Bridge proceeds cold" };
}

// what cortex embeds in the Opus integration prompt
//
// ABSENCE IS NAMED HERE TOO (11 Aug 2026, wiring audit). cortex.mjs is the ONE
// caller of convene(), and it reads exactly one field off the result — this
// section — so `note`, and every empty chair, reached the deep read as nothing
// at all. A council that lost the CAPTAIN'S-OWN-VOICE seat and a council that
// never had one are the same three-block payload, and Opus is told to
// "integrate, don't average" a bench it cannot know is short. Worse, the two
// numbers underneath are computed over SURVIVORS: disagreement() ignores the
// chair that never spoke, and crossFamilySplit() returns null the moment the
// claude seat dies — so a dead chair reads downstream as CONSENSUS, and the
// council_flag → setpiece defend-drill lane goes quiet with nothing naming why.
// Same law this file applied to the capsule door 300 lines up this morning:
// say what you are not holding. The SEATS travel to the model, the CAUSES stay
// on the ledger row where brain.mjs's alarm reads them — a spawn EINVAL string
// is diagnostics, not context, and does not belong in a teaching prompt.
function councilSection(c) {
  if (!c || !c.drafts || !c.drafts.length) return "";
  const empty = (c.benched || []).filter(b => b && b.seat);
  const absent = empty.length
    ? `\n(NOT AT THE TABLE — named so you do not read a short bench as a full one: ${empty.map(b => b.seat.toUpperCase()).join(" · ")}. Their reads are MISSING, not withheld and not agreement; the disagreement number above is over the chairs that spoke.)`
    : "";
  return `\nTHE COUNCIL SAT FIRST (cheap adversarial drafts — integrate, don't average; name what each got right):\n${c.drafts.map(d => `[${d.seat.toUpperCase()}${d.family && d.family !== "gemini" ? " · " + d.family.toUpperCase() : ""}]\n${d.text}`).join("\n\n")}\n${absent}${c.split ? `\n⚠ THE CHAIRS SPLIT HARD (disagreement ${c.disagreement}) — the split itself is signal: name the crux they disagree on before answering.` : ""}${c.cross_split ? `\n⚠ TWO MODEL FAMILIES read this differently — the divergence is curriculum: say which family's read holds, and why.` : ""}\n`;
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
      // writeFlag stubbed per the HERMETIC law further down. It became load-bearing
      // HERE on 11 Aug 2026: with the baked bench now declaring its real families
      // (2 claude · 1 gemini), injected mode is two-family for the first time, so
      // genThree's three disjoint drafts trip the >=0.85 cross-family split and this
      // fixture would write a test question into the LIVE council_flag.json.
      recordUse: () => {}, capsules: 'tokenization: "subwords are lego blocks"', writeFlag: () => {},
    });
    assert("three adversarial chairs convene (steelman/prosecutor/his-voice)", c.drafts.length === 3 && new Set(c.drafts.map(d => d.seat)).size === 3);
    assert("the captain's chair is seeded with HIS capsule anchors", calls.some(p => p.includes("lego blocks")));
    const sec = councilSection(c);
    // The prosecutor's tag was `[PROSECUTOR]` here until 11 Aug 2026 — and that was
    // the STALE DECLARATION being asserted, not the live prompt. On the real path
    // fam has always been the route, so cortex's Opus prompt has read
    // `[PROSECUTOR · CLAUDE]` since 17 Jul; only this fixture, reading the baked
    // family "gemini", ever saw the bare tag. Now that the bench declares its real
    // engines the test says what the Opus call actually receives.
    assert("cortex gets all drafts, marked integrate-don't-average", sec.includes("[STEELMAN]") && sec.includes("[PROSECUTOR · CLAUDE]") && sec.includes("integrate, don't average"));
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
    const failRows = [];                               // hermetic — a refused chair now ledgers, and never into the real file
    const cFail = await convene("q question here", { seatsCfg: { seats: DEFAULT_SEATS, cross: CROSS_SEAT, min_headroom: 20000 }, generate: genThree, recordUse: () => {}, capsules: null, env: {}, headroom: { allowed: 300000 }, claudeChair: async () => ({ ok: false }), appendLedger: (r) => failRows.push(r), writeFlag: () => {} });
    // `&& !cFail.cross_split` was the second half of this until 11 Aug 2026, and it
    // only ever passed because the fixture's baked families were all "gemini". The
    // free bench is TWO families on the live path and always has been — that is the
    // whole reason 17 Jul kept the steelman on Gemini ("an all-Claude bench would
    // argue with one accent"), so a cross-family split with the 4th chair benched is
    // M15 working, not layering broken. What layering actually promises is the one
    // thing now asserted: the failed chair does not sit, and the other three do.
    assert("a failed chair degrades to the 3-chair council (layering)",
      cFail.drafts.length === 3 && !cFail.drafts.some(d => d.seat === "cross_examiner"));
  }
  // ── THE ENGINE WIRE (10 Aug 2026 wiring audit) ────────────────────────────
  // The chair used to spawn its OWN `claude -p` — no lean flags, no BIN() shim
  // probe, and a parser that read only input+output. Every assertion here fails
  // the moment that regresses: the cache pair is where a CLI call's real spend
  // lives, and the governor budgets on this row.
  {
    let seen = null;
    const fakeEngine = async (p, m, t) => { seen = { p, m, t }; return { ok: true, text: "the cache amortizes projections only", input_tokens: 2, output_tokens: 471, cache_creation_tokens: 14434, cache_read_tokens: 0, total_tokens: 14907, tokens_estimated: false, duration_ms: 16220, limit_hit: false, http_status: null, limit_signal: "none", error: null };
    };
    const r = await claudeChairAsync("brief + question", "sonnet", 18000, { gen: fakeEngine });
    assert("THE CHAIR RIDES THE SHARED ENGINE (model + timeout reach claudegen)", seen && seen.m === "sonnet" && seen.t === 18000 && seen.p.includes("question"));
    assert("THE CACHE PAIR SURVIVES THE DOOR (in+out-only parser = ~30x under-report)",
      r.ok === true && r.cache_creation_tokens === 14434 && r.cache_read_tokens === 0 && r.total_tokens === 14907);
    assert("the limit classifier travels with it (the chair no longer has its own)",
      r.limit_signal === "none" && r.tokens_estimated === false && "http_status" in r);
    // NO RAW SPAWN in the plan of record — the structural guard. If someone
    // re-inlines an execFile here, the lean flags and BIN() are lost again and
    // this assertion is the one that says so.
    assert("plan-of-record chair spawns NOTHING itself; the LEGACY is frozen beside it and still does",
      !/execFile|output-format/.test(String(claudeChairAsync))
      && /execFile/.test(String(claudeChairAsyncLegacy)) && /output-format/.test(String(claudeChairAsyncLegacy)));
    const rEmpty = await claudeChairAsync("p", "sonnet", 1000, { gen: async () => ({ ok: true, text: "" }) });
    assert("a wordless reply still never sits (legacy's stricter ok, byte-identical)", rEmpty.ok === false);
    const rThrow = await claudeChairAsync("p", "sonnet", 1000, { gen: async () => { throw new Error("spawn EINVAL"); } });
    assert("a thrown engine degrades, never rejects (the bus still leaves)", rThrow.ok === false && rThrow.error.includes("EINVAL"));
  }
  // ── THE FREE SEATS' BOOK (11 Aug 2026 wiring audit) ───────────────────────
  // Two of three "free-pool" chairs spend the Max window on `claude -p` haiku
  // and were charged to T7, a GEMINI key's daily quota, while writing NO ledger
  // row: 4,564 live rows, council_chair:6 (all six the sonnet chair), zero free
  // seats, against ~19 cortex_wake convenes. headroom() sums ledger rows only,
  // so the gate that decides whether the deep Opus read may run was blind to
  // spend the council itself caused.
  // These run the REAL routing path — no `generate` override — with both
  // engines injected, which is the only way the route/charge/label wiring is
  // actually under test. Every assertion here goes red if the free seats stop
  // ledgering, or start billing a Gemini tank for a Claude call again.
  {
    const rows = [], tanks = [];
    const HAIKU = { ok: true, text: "the premise conflates memory with compute entirely different bottlenecks", input_tokens: 2, output_tokens: 340, cache_creation_tokens: 14434, cache_read_tokens: 0, total_tokens: 14776, tokens_estimated: false, duration_ms: 8100, limit_hit: false, http_status: null, limit_signal: "none", error: null };
    const realRoute = {
      seatsCfg: { seats: DEFAULT_SEATS, cross: null }, capsules: null, env: {},
      pool: async () => ({ ok: true, text: "because the cache stores keys values but every new token still attends across all previous positions" }),
      freeClaude: async () => ({ ...HAIKU }),
      recordUse: (t) => tanks.push(t), appendLedger: (r) => rows.push(r), writeFlag: () => {},
    };
    const c = await convene("why does quadratic attention survive the kv cache?", realRoute);
    assert("THE FREE CLAUDE SEATS LEDGER (up to 38 Max-window calls the governor could not see)",
      rows.length === 2 && rows.every(r => r.job === "council_chair" && r.engine === "claude" && r.model === "haiku")
      && rows.map(r => r.seat).sort().join(",") === "captains_voice,prosecutor");
    // (rows[0] || {}) deliberately: when this wire breaks the array is EMPTY, and
    // a suite that dies on a TypeError reports one red line instead of five.
    assert("…with the honest meter intact (cache pair + estimated flag), same shape as the 4th chair",
      (rows[0] || {}).cache_creation_tokens === 14434 && (rows[0] || {}).total_tokens === 14776 && (rows[0] || {}).tokens_estimated === false && "error_envelope" in (rows[0] || {}));
    assert("ONLY THE GEMINI SEAT CHARGES T7 (a `claude -p` call never touched that key)",
      tanks.length === 1 && tanks[0] === "T7");
    assert("the family label still follows the engine that actually spoke",
      c.drafts.length === 3 && c.drafts.filter(d => d.family === "claude").length === 2 && c.drafts.filter(d => d.family === "gemini").length === 1);
    // a refused free seat still paid the CLI boot — same law as the 4th chair,
    // whose limit-hit row used to vanish inside the ok-branch.
    rows.length = 0; tanks.length = 0;
    await convene("q question here", { ...realRoute, freeClaude: async () => ({ ok: false, text: "", total_tokens: 44000, duration_ms: 900, limit_hit: true, http_status: 429, limit_signal: "api_error_status", error: "You've hit your weekly limit · resets Aug 12" }) });
    assert("a REFUSED free seat ledgers too (it paid the boot; the window must learn it is locked)",
      rows.length === 2 && rows.every(r => r.ok === false && r.limit_hit === true && r.http_status === 429 && r.total_tokens === 44000));
  }
  // ── THE DECLARED FAMILY IS THE ROUTE (11 Aug 2026 wiring audit) ───────────
  // seats[].family was an ORPHAN FIELD: council_config declared it, loadSeats
  // defaulted it, councilSection printed it — and routeOf ignored all of that for
  // `seat.id === "steelman"`. Probed against the live file that morning, 3 seats
  // all declaring "gemini": 1 reached the pool, 2 reached `claude -p`. These run
  // the REAL router (no `generate` override, both engines injected) and watch
  // which engine each chair actually reaches — the only way the wire is testable.
  {
    const bareCode = (fn) => String(fn).replace(/^[ \t]*\/\/[^\n]*$/gm, "").replace(/\s\/\/[^\n]*/g, "");
    const hit = { pool: [], claude: [] }, tanks = [], rows = [];
    const probe = {
      seatsCfg: { seats: [
        { id: "devil",     family: "gemini", brief: "BRIEF-DEVIL" },   // THE RENAME CASE: not "steelman", so the old id test shipped it to Claude
        { id: "historian", family: "claude", brief: "BRIEF-HISTORIAN" },
      ], cross: null },
      capsules: null, env: {},
      pool:       async (p) => { hit.pool.push(p);   return { ok: true, text: "pool draft keys values positions attend across previous handshakes" }; },
      freeClaude: async (p) => { hit.claude.push(p); return { ok: true, text: "claude draft memory compute bottlenecks entirely different flash", total_tokens: 10 }; },
      recordUse: (t) => tanks.push(t), appendLedger: (r) => rows.push(r), writeFlag: () => {},
    };
    const c = await convene("why does quadratic attention survive the kv cache?", probe);
    assert("A RENAMED GEMINI CHAIR STILL RIDES GEMINI (the id test sent every non-steelman seat to Claude, killing the cross-family lane)",
      hit.pool.length === 1 && hit.pool[0].includes("BRIEF-DEVIL")
      && hit.claude.length === 1 && hit.claude[0].includes("BRIEF-HISTORIAN"));
    assert("…and the declared family is what the BOOK is charged on (a config-added gemini chair must not spend the Max window)",
      tanks.length === 1 && tanks[0] === "T7"
      && rows.length === 1 && rows[0].seat === "historian" && rows[0].engine === "claude");
    assert("…and the label each draft carries is the family it declared and rode",
      c.drafts.find(d => d.seat === "devil").family === "gemini" && c.drafts.find(d => d.seat === "historian").family === "claude");
    // NO ENGINE MOVED, only the decider. This is the guard on the whole repair:
    // if a future edit re-declares a baked seat's family, it goes red and says so.
    assert("NO ENGINE MOVED: the baked bench routes by family exactly as the frozen id-router did",
      DEFAULT_SEATS.every(s => familyRoute(s) === routeOfLegacy(s)));
    assert("LAYERING: the pre-audit id-router is frozen verbatim and is no longer the plan of record",
      /seat\.id === "steelman"/.test(String(routeOfLegacy)) && !/seat\.id\s*===\s*"steelman"/.test(bareCode(convene)));
    // CANON MUST STAY ROUTABLE. Not a freeze on his choices — he may flip any
    // family here and the router obeys — a guard that the file on disk cannot
    // declare a chair this file has no engine for and only find out at 3am.
    const live = loadSeats();
    assert("THE LIVE council_config DECLARES ONLY ROUTABLE FAMILIES (canon and the bench can no longer disagree)",
      live.seats.length > 0 && live.seats.every(s => familyRoute(s) !== null) && (!live.cross || familyRoute(live.cross) === "claude"));
    // an unroutable chair is BENCHED BY NAME — never silently given an engine.
    const tanksU = [], rowsU = [];
    const cU = await convene("q question here", {
      ...probe, seatsCfg: { seats: [{ id: "oracle", family: "mistral", brief: "BRIEF-ORACLE" }], cross: null },
      pool:       async () => { throw new Error("must not be called"); },
      freeClaude: async () => { throw new Error("must not be called"); },
      recordUse: (t) => tanksU.push(t), appendLedger: (r) => rowsU.push(r),
    });
    assert("AN UNROUTABLE FAMILY IS BENCHED BY NAME, never quietly handed the cheapest engine",
      cU.drafts.length === 0 && cU.benched.length === 1 && cU.benched[0].seat === "oracle"
      && /mistral/.test(cU.benched[0].why) && tanksU.length === 0 && rowsU.length === 0);
    // THE 4th CHAIR: its gates are Claude-shaped, so a non-claude declaration must
    // bench it, not produce a Claude draft wearing another family's label — that
    // label is what crossFamilySplit groups on and what compiles HIS defend drill.
    let called = false;
    const cX = await convene("q question here", {
      seatsCfg: { seats: DEFAULT_SEATS, cross: { ...CROSS_SEAT, family: "gemini" }, min_headroom: 20000 },
      generate: genThree, recordUse: () => {}, capsules: null, env: {}, headroom: { allowed: 300000 },
      claudeChair: async () => { called = true; return { ok: true, text: "a claude draft wearing a gemini label" }; },
      appendLedger: () => {}, writeFlag: () => {},
    });
    assert("THE 4th CHAIR CANNOT WEAR A FAMILY IT DID NOT RIDE (a lying label = a fake cross-family split = a fake drill for him)",
      called === false && !cX.drafts.some(d => d.seat === "cross_examiner")
      && cX.benched.some(b => b.seat === "cross_examiner" && /gemini/.test(b.why)));
  }
  // ── THE LEDGER WIRE: what the governor actually reads ─────────────────────
  {
    const rows = [];
    const base = { seatsCfg: { seats: DEFAULT_SEATS, cross: CROSS_SEAT, min_headroom: 20000 }, generate: genThree, recordUse: () => {}, capsules: null, env: {}, headroom: { allowed: 300000 }, appendLedger: (r) => rows.push(r), writeFlag: () => {} };
    await convene("why does quadratic attention survive the kv cache?", { ...base, claudeChair: async () => ({ ok: true, text: "the cache only amortizes projections", input_tokens: 2, output_tokens: 471, cache_creation_tokens: 14434, cache_read_tokens: 0, total_tokens: 14907, tokens_estimated: false, duration_ms: 16220 }) });
    assert("THE LEDGER SEES THE BOOT TAX (all 5 live rows pre-fix carried no cache key at all)",
      rows.length === 1 && rows[0].cache_creation_tokens === 14434 && rows[0].total_tokens === 14907 && rows[0].tokens_estimated === false);
    // the row G1 added limit_hit for, which could never be written: it lived
    // inside the ok-branch, so the one sitting the window most needed to see
    // — the chair that hit the wall — was the one that vanished.
    rows.length = 0;
    const cLim = await convene("q question here", { ...base, claudeChair: async () => ({ ok: false, text: "", total_tokens: 44000, duration_ms: 900, limit_hit: true, http_status: 429, limit_signal: "api_error_status", error: "You've hit your weekly limit · resets Aug 12" }) });
    assert("A LIMIT-HIT CHAIR NOW LEDGERS (it used to vanish; the window never learned it was locked)",
      rows.length === 1 && rows[0].limit_hit === true && rows[0].ok === false && rows[0].http_status === 429 && rows[0].total_tokens === 44000);
    assert("…and it still degrades to the 3-chair council", cLim.drafts.length === 3);
    // #8 FORENSICS, THE THIRD FIELD (10 Aug 2026). The row hand-wrote
    // http_status + limit_signal and never carried error_envelope — the field
    // brain.mjs:662 forensicText reads FIRST, and the only discriminator
    // between a 429 plan wall and a 500 server bug (brain.mjs:3203-3213). This
    // goes red the moment someone drops `...ledgerForensics(r)` off the row.
    rows.length = 0;
    const envelope = '{"type":"result","is_error":true,"api_error_status":429,"session_id":"c-1","result":"You\'ve hit your weekly limit · resets Aug 12"}';
    await convene("q question here", { ...base, claudeChair: async () => ({ ok: false, text: "", total_tokens: 0, duration_ms: 700, limit_hit: true, http_status: 429, limit_signal: "api_error_status", error: "You've hit your weekly limit · resets Aug 12", error_envelope: envelope }) });
    assert("#8 FORENSICS: the failing ENVELOPE rides the row (0 of 4,558 live rows had it; the alarm reads it first)",
      rows[0].error_envelope === envelope && rows[0].http_status === 429 && rows[0].limit_signal === "api_error_status");
    // …and never a duplicate: parseErr sets error === error_envelope byte for
    // byte, so the projection drops the copy and brain.mjs ORs the two fields.
    rows.length = 0;
    await convene("q question here", { ...base, claudeChair: async () => ({ ok: false, text: "", total_tokens: 0, duration_ms: 700, error: "spawn EINVAL", error_envelope: "spawn EINVAL" }) });
    assert("…and no 600-char duplicate when the envelope says nothing `error` doesn't", rows[0].error_envelope === null && rows[0].error === "spawn EINVAL");
    // honesty law: an unmeasured number is null, never a measured zero
    rows.length = 0;
    await convene("q question here", { ...base, claudeChair: async () => ({ ok: true, text: "some answer", total_tokens: 500, tokens_estimated: true, duration_ms: 100 }) });
    assert("unmeasured components ride as NULL, never a fake zero (claudegen's law)",
      rows[0].input_tokens === null && rows[0].cache_creation_tokens === null && rows[0].tokens_estimated === true);
  }
  // ── THE CAPTAIN'S DOOR (11 Aug 2026 wiring audit) ─────────────────────────
  // The seat whose whole job is his idiom was fed 857 of 5,773 bolo chars (14.8%)
  // through three stacked slices, and read only `bolo` — his welds/threeWays/
  // interviewLines had no path in at all. Every assertion here goes red the
  // moment any of that comes back. The fixture is a HERMETIC capsule dir, so the
  // suite never depends on how many capsules happen to be locked today.
  {
    const capDir = join(STATE_DIR, "..", "..", "node_modules", ".arsenal-council-selftest");
    mkdirSync(capDir, { recursive: true });
    const long = (w, n) => Array.from({ length: n }, (_, i) => `${w}${i}`).join(" ");
    const mk = (id) => ({
      id, title: `${id} title`, lockedOn: "2026-07-01",
      bolo: `BOLOSTART ${long("bo", 120)} BOLOEND`,                          // ~700 chars — past the legacy's 200
      faultLines: [{ axis: "a", title: "ax-a", strike: "st-a", weld: `WELDSTART ${long("we", 90)} WELDEND` },
                   { axis: "b", title: "ax-b", strike: "st-b", weld: "WELD-B body", deep: "deep-b body text" }],
      threeWays: { ceo: "3W-CEO line", junior: "3W-JUNIOR line", skeptic: "3W-SKEPTIC line" },
      interviewLines: ["IVLINE one", "IVLINE two"],
      hook: "hook body", mechanism: "mech body", why: "why body",
      traps: ["trap one"], doubts: [{ q: "DOUBTQ?", a: "DOUBTA." }], deep: "capsule deep body",
    });
    // FIVE capsules — the legacy's readdirSync().slice(0,4) made the fifth invisible forever
    const ids = ["c1", "c2", "c3", "c4", "c5"];
    for (const id of ids) writeFileSync(join(capDir, `${id}.json`), JSON.stringify(mk(id)));
    writeFileSync(join(capDir, "notacapsule.txt"), "ignored");
    const out = capsuleExcerpts(capDir, { config: null });

    assert("HIS BOLO ARRIVES WHOLE (legacy cut every one at 200 chars, mid-word)",
      ids.every(id => out.includes(`${id} title`)) && (out.match(/BOLOSTART/g) || []).length === 5 && (out.match(/BOLOEND/g) || []).length === 5);
    assert("THE WELDS TRAVEL — the chair's own brief says \"Hinglish welds fine\" and they never arrived",
      out.includes("WELDSTART") && out.includes("WELDEND") && out.includes("WELD-B body") && out.includes("STRIKE: st-a"));
    assert("threeWays + interviewLines travel too (his other first-person layers)",
      out.includes("3W-CEO line") && out.includes("3W-SKEPTIC line") && out.includes("IVLINE one") && out.includes("IVLINE two"));
    assert("NO FILE-LIST SLICE: a 5th locked capsule is no longer invisible forever",
      out.includes("=== c5") && !out.includes("notacapsule"));
    assert("NO CAP anywhere: the payload is longer than the legacy's hard 900-char ceiling",
      out.length > 900 && capsuleExcerptsLegacy(capDir).length <= 900);
    assert("NOTHING ENDS MID-WORD (the legacy left 'yaad nahi r', 'vendor naam ke')",
      !/[A-Za-z0-9]$/.test(out.trimEnd().slice(-1) + "") || out.trimEnd().endsWith(")"));
    // the anti-silent-drop law: what is NOT carried says its own size
    assert("ABSENCE IS NAMED with exact sizes (hook/mechanism/why/traps/doubts/deep)",
      out.includes("NOT INCLUDED") && ["hook", "mechanism", "why", "traps", "doubts", "deep"].every(k => new RegExp(`${k} \\d+ chars`).test(out)));
    assert("…and the omitted layers are genuinely absent from the payload, not half-cut",
      !out.includes("DOUBTQ?") && !out.includes("capsule deep body") && !out.includes("mech body"));
    // CANON WIDENS IT, NOT CODE — council_config.capsule_layers is his one-key edit
    const wide = capsuleExcerpts(capDir, { config: { capsule_layers: ["bolo", "doubts", "deep"] } });
    assert("council_config.capsule_layers is honored (his call, no code change, no organ guessing)",
      wide.includes("DOUBTQ?") && wide.includes("capsule deep body") && !wide.includes("WELDSTART") && /welds \d+ chars/.test(wide));
    const all = capsuleExcerpts(capDir, { config: { capsule_layers: CAPSULE_LAYERS.map(L => L.id) } });
    assert("every layer selected → nothing dropped, and the footer says so honestly",
      all.includes("nothing was dropped") && !all.includes("NOT INCLUDED"));
    assert("a missing/empty capsule dir still returns null (the chair seats unseeded, as before)",
      capsuleExcerpts(join(capDir, "nope"), { config: null }) === null);

    // ── THE TORN CAPSULE (11 Aug 2026 wiring audit) ─────────────────────────
    // The layer footer above was rebuilt this morning and the FILE level kept
    // the old silence: three skips (parse throw · non-object · nothing in the
    // selected layers) dropped a whole locked capsule with no word anywhere,
    // and the survivor-counted footer then said "all N … nothing was dropped".
    // Probed live before the fix with three fixtures, one torn: the payload
    // carried two, the footer claimed all 2, and the torn id appeared nowhere.
    // Every assertion here goes red the moment any of those three skips goes
    // quiet again. mirror.mjs re-pulls this dir from the gist every 06:55 and
    // on every forge lock-close, so a torn file is one bad fetch away.
    writeFileSync(join(capDir, "tornfile.json"), '{"id":"tornfile","bolo":"BOLOSTART cut off here');
    writeFileSync(join(capDir, "notobject.json"), '"a bare string, not a capsule"');
    writeFileSync(join(capDir, "hollow.json"), "{}");
    const cut = capsuleExcerpts(capDir, { config: null });
    assert("A TORN CAPSULE IS NAMED, NOT SWALLOWED (the footer used to say 'nothing was dropped' over it)",
      cut.includes("NOT AT THE TABLE") && cut.includes("tornfile.json") && /tornfile\.json \(unreadable — /.test(cut));
    assert("…and each skip says WHICH repair it needs (unreadable ≠ not-a-capsule ≠ empty-in-these-layers)",
      /notobject\.json \(not a JSON object\)/.test(cut) && /hollow \(parsed, but no words in the selected layers: bolo\/welds/.test(cut));
    assert("the survivor count can no longer claim the files it never opened (N of M)",
      /from 5 of 8 locked capsule\(s\)/.test(cut) && cut.includes("=== c5"));
    // the exact sentence the probe caught lying — reachable ONLY when every
    // layer is selected, which is why the layer-level fixture above never bit it
    const allCut = capsuleExcerpts(capDir, { config: { capsule_layers: CAPSULE_LAYERS.map(L => L.id) } });
    assert("'nothing was dropped' is now UNREACHABLE while anything was (the affirmative lie)",
      !allCut.includes("nothing was dropped") && allCut.includes("but not every capsule got here") && allCut.includes("tornfile.json"));
    // a TOTAL tear used to return null, which the chair reads as "he has no
    // locked capsules" — a lie of a different shape, and the loudest failure
    // of the mirror is the one that must not be silent.
    const tornDir = join(capDir, "alltorn");
    mkdirSync(tornDir, { recursive: true });
    writeFileSync(join(tornDir, "only.json"), "{oops");
    const allTorn = capsuleExcerpts(tornDir, { config: null });
    assert("A TOTAL TEAR SAYS SO instead of returning null (null reads as 'he has no capsules')",
      typeof allTorn === "string" && allTorn.includes("only.json") && /1 of 1 capsule file\(s\)/.test(allTorn));
    // THE WIRE: it is worth nothing on disk — it has to reach the seat.
    const sawTorn = [];
    await convene("does the kv cache remove quadratic attention?", {
      seatsCfg: { seats: DEFAULT_SEATS, cross: null }, recordUse: () => {}, writeFlag: () => {},
      capsules: cut, generate: async (p) => { sawTorn.push(p); return { ok: true, text: "draft" }; },
    });
    assert("THE WIRE: the torn-capsule notice rides into the captain's chair prompt",
      (sawTorn.find(p => p.includes("CAPTAIN'S OWN VOICE")) || "").includes("tornfile.json"));
    rmSync(tornDir, { recursive: true, force: true });
    for (const f of ["tornfile.json", "notobject.json", "hollow.json"]) rmSync(join(capDir, f), { force: true });

    // THE WIRE ITSELF: the payload must reach the captain's_voice PROMPT, whole.
    const seen = [];
    // HERMETIC — writeFlag is stubbed on EVERY convene() in this suite. Learned
    // the hard way 11 Aug 2026: two fixtures here ran without it, tripped the
    // >=0.85 cross-family split, and wrote a fixture question into the LIVE
    // council_flag.json — the file setpiece.mjs:751 compiles into his drills
    // inside a +/-2 day window. A test must never be able to reach his curriculum.
    await convene("does the kv cache remove quadratic attention?", {
      seatsCfg: { seats: DEFAULT_SEATS, cross: null }, recordUse: () => {}, writeFlag: () => {},
      capsules: out, generate: async (p) => { seen.push(p); return { ok: true, text: "draft" }; },
    });
    const voiceP = seen.find(p => p.includes("CAPTAIN'S OWN VOICE"));
    assert("THE WIRE: his whole voice payload reaches the captain's chair prompt UNCUT",
      voiceP && voiceP.includes(out) && voiceP.includes("WELDEND") && voiceP.includes("=== c5"));
    assert("…and the OTHER chairs are still never seeded with it (only his seat argues in his idiom)",
      seen.filter(p => p.includes("WELDSTART")).length === 1);

    // THE BOARDING MARGIN. A free seat used to be killed at a hardcoded 20000ms
    // while its own bus did not leave until 25000ms — measured live 11 Aug 2026,
    // this seat took 18.3s with NO seed and 22.2s with the legacy 857-char seed,
    // so it was already dying on its own cap. Goes red if anyone re-hardcodes it.
    const ms = [];
    await convene("q question here", {
      seatsCfg: { seats: DEFAULT_SEATS, cross: null }, recordUse: () => {}, capsules: null,
      pool: async () => ({ ok: true, text: "gemini draft" }),
      freeClaude: async (p, model, t) => { ms.push(t); return { ok: true, text: "haiku draft" }; },
      appendLedger: () => {}, writeFlag: () => {},
    });
    assert("THE BOARDING MARGIN reaches the free seats (no seat dies 5s before its own bus)",
      ms.length === 2 && ms.every(t => t === 23000));
    const msShort = [];
    await convene("q question here", {
      seatsCfg: { seats: DEFAULT_SEATS, cross: null }, recordUse: () => {}, capsules: null, deadline_ms: 6000,
      pool: async () => ({ ok: true, text: "g" }), freeClaude: async (p, m, t) => { msShort.push(t); return { ok: true, text: "h" }; },
      appendLedger: () => {}, writeFlag: () => {},
    });
    assert("…derived from the bus, never hardcoded — and floored at 5s like the cross chair",
      msShort.every(t => t === 5000) && !/claudeGenAsync\(p, model, 20000\)/.test(String(convene)));
    for (const f of readdirSync(capDir)) rmSync(join(capDir, f));
    rmSync(capDir, { recursive: true, force: true });
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
    // ── THE DOOR TO THE DRILL (11 Aug 2026 wiring audit) ──────────────────────
    // `question` was written `.slice(0, 200)`; the live flag on disk ends mid-word
    // ("…~early Septembe"). setpiece.mjs:588 quotes it back to him as HIS OWN
    // claim and :585 resolves the drill's registry ids off the same amputated
    // text. The fixture below is the REAL live question, restored to full length.
    // Both assertions go red the moment any cap comes back — the first on the
    // value, the second structurally, so a cut re-introduced under a different
    // spelling (a cap arg, a helper) still cannot pass unnoticed.
    const longQ = "Decoy shapes (≥4 capsules + ≥60 doubts) · confusion-pairs (≥6 cracked) · R1 controller constants · saare thresholds — inke din ab ginne shuru honge kyunki data ab beh raha hai. Review: ~early September, uske baad hi number set honge.";
    let flagLong = null; const askedWith = [];
    await convene(longQ, {
      seatsCfg: { seats: DEFAULT_SEATS, cross: CROSS_SEAT, min_headroom: 20000 },
      generate: async (p) => { askedWith.push(p); return { ok: true, text: "retrieval grounding recall precision chunks reranker corpus quality embedding" }; },
      recordUse: () => {}, capsules: null, env: {}, headroom: { allowed: 300000 },
      claudeChair: async () => ({ ok: true, text: "parameters scaling emergent capability reasoning breadth compute frontier", total_tokens: 500, duration_ms: 100 }),
      appendLedger: () => {}, writeFlag: (o) => { flagLong = o; },
    });
    assert("HIS QUESTION REACHES THE DRILL WHOLE (the live flag ended mid-word at 200)",
      flagLong && flagLong.question === longQ && flagLong.question.length > 200 && flagLong.question.endsWith("number set honge."));
    // CODE ONLY, never the prose. String(fn) hands back the comments too, and the
    // block above deliberately quotes the removed `q.slice(0, 200)` verbatim so the
    // defect stays auditable — which made the first version of this guard fail on
    // its own documentation. Stripping `//` comments is what makes "the cut is
    // gone" checkable at all; the same trap sits under the boarding-margin guard
    // further down, and under any future structural assertion in this file.
    const codeOf = (fn) => String(fn).replace(/^[ \t]*\/\/[^\n]*$/gm, "").replace(/\s\/\/[^\n]*/g, "");
    assert("…and the flag can never disagree with what the chairs were actually asked",
      askedWith.length && askedWith.every(p => p.includes(longQ)) && !/q\.slice\(/.test(codeOf(convene)));
    let flag2 = null;
    const cSame = await convene("q question here", { seatsCfg: threeSeats, generate: async () => ({ ok: true, text: "identical words every chair speaks identical words every chair speaks" }), recordUse: () => {}, capsules: null, writeFlag: (o) => { flag2 = o; } });
    assert("same-family agreement → NO flag (the drill is for real splits)", flag2 === null && !cSame.cross_split);
  }
  // ── A CHAIR THAT DIES SAYS WHY (11 Aug 2026 wiring audit) ─────────────────
  // The defect, verbatim from the live file before this block existed: a
  // council_chair row stamped 2026-08-10T17:51:41.913Z reading ok:false with
  // error:null, duration_ms:0, total_tokens:0 — every field at its nothing-
  // value, because `.catch(() => ({ ok: false }))` threw the message away.
  // These assertions go red the moment either catch site forgets again.
  {
    const rows = [];
    const cDead = await convene("does the kv cache remove quadratic attention?", {
      seatsCfg: { seats: DEFAULT_SEATS, cross: CROSS_SEAT, min_headroom: 10000 },
      pool: async () => { throw new Error("T7 key 429 daily quota exhausted"); },
      freeClaude: async () => { throw new Error("Invalid API key · Please run /login"); },
      claudeChair: async () => { throw new Error("spawn claude EINVAL"); },
      recordUse: () => {}, capsules: null, env: {}, headroom: { allowed: 300000 },
      appendLedger: (r) => rows.push(r), writeFlag: () => {},
    });
    assert("A REJECTING CHAIR CARRIES ITS CAUSE INTO THE LEDGER ROW (the live 10 Aug row read error:null)",
      rows.length === 3 && rows.every(r => typeof r.error === "string" && r.error.length > 0));
    // the consumer, named: brain.mjs failureStreak() reads forensicText(r) =
    // `error_envelope || error`, and with both null its cause ladder falls to
    // "unknown" — so not_logged_in and plan_limit, whose hints are OPPOSITE
    // instructions, become the same row.
    assert("…so brain.mjs failureStreak can NAME it (not_logged_in vs plan_limit are opposite hints)",
      rows.some(r => /Please run \/login/.test(String(r.error_envelope || r.error || "")))
      && rows.some(r => /EINVAL/.test(String(r.error_envelope || r.error || ""))));
    assert("EVERY empty seat is on the record, gemini one included (it writes no ledger row by law)",
      cDead.benched.length === 4 && cDead.benched.some(b => b.seat === "steelman" && /429/.test(b.why))
      && cDead.benched.some(b => b.seat === "cross_examiner"));
    assert("…and a TOTAL wipe still returns the old honest note + empty section (layering)",
      cDead.drafts.length === 0 && cDead.note.includes("cold") && councilSection(cDead) === "");

    // THE WIRE TO CORTEX: a PARTIAL council must say it is partial. His own
    // voice chair dying used to look identical to a council that never had one.
    const cPart = await convene("does the kv cache remove quadratic attention?", {
      seatsCfg: { seats: DEFAULT_SEATS, cross: null },
      generate: async (p) => p.includes("CAPTAIN'S OWN VOICE") ? { ok: false, text: "" } : { ok: true, text: "a real draft about caches attention and recompute" },
      recordUse: () => {}, capsules: null, writeFlag: () => {},   // hermetic — see the law above; the bench is two-family as of 11 Aug
    });
    const secPart = councilSection(cPart);
    assert("A PARTIAL COUNCIL SAYS SO IN THE OPUS PROMPT (his seat can go missing silently)",
      cPart.drafts.length === 2 && secPart.includes("NOT AT THE TABLE") && secPart.includes("CAPTAINS_VOICE"));
    assert("…and the CAUSE stays on the ledger, never in the teaching prompt (EINVAL is not context)",
      !/EINVAL|429|spawn/.test(councilSection(cDead) + secPart));
    assert("a FULL bench adds nothing — a healthy council reads byte-identical to before",
      !councilSection({ drafts: [{ seat: "a", family: "gemini", text: "x" }], benched: [] }).includes("NOT AT THE TABLE"));

    // the three cross-chair benches are now THREE DIFFERENT sentences. They used
    // to be one silent `return` each, so "no room tonight" and "brain_config is
    // corrupt" were indistinguishable for as long as it lasted.
    const benchWhy = async (extra) => (await convene("q question here", {
      seatsCfg: { seats: DEFAULT_SEATS, cross: CROSS_SEAT, min_headroom: 20000 },
      generate: genThree, recordUse: () => {}, capsules: null, env: {},
      claudeChair: async () => { throw new Error("must not be called"); },
      appendLedger: () => {}, writeFlag: () => {}, ...extra,
    })).benched.find(b => b.seat === "cross_examiner");
    assert("A HEADROOM CRASH NO LONGER ERASES ITSELF (it read exactly like a thin window)",
      /headroom unreadable/.test((await benchWhy({ headroomFn: () => { throw new Error("brain_config.json: Unexpected token }"); } })).why));
    assert("a THIN WINDOW says its own two measured numbers, and neither is invented here",
      /window too thin — 5000 < 20000 tokens/.test((await benchWhy({ headroom: { allowed: 5000 } })).why));
    assert("the $100 LAW refusal names itself in claudegen's own words",
      /ANTHROPIC_API_KEY set/.test((await benchWhy({ headroom: { allowed: 300000 }, env: { ANTHROPIC_API_KEY: "sk-nope" } })).why));
    // …and the LEDGER's own failure now reaches that same bench (11 Aug 2026,
    // second wiring pass). The fixture reads a DIRECTORY: existsSync says yes,
    // readFileSync throws EISDIR — the portable stand-in for the EBUSY/EPERM a
    // six-writer append lane can hand us on Windows. Before readLedger() this
    // exact input produced `[]`, headroom() read it as zero spend, and the chair
    // SAT on a window measured at allowed:0 — so this assertion goes red the
    // moment any swallowing read comes back onto the budget path.
    assert("AN UNREADABLE LEDGER BENCHES THE CHAIR — [] is not 'unknown', it is 'nothing spent', and it opened the window to full cap",
      /headroom unreadable/.test((await benchWhy({ headroomFn: () => headroom(loadBrainConfig(), readLedger(STATE_DIR), readJson(join(STATE_DIR, "brain_queue.json")) || {}, new Date()) })).why));
    assert("…while the two HONEST reads still pass through untouched: a ledger never written is zero spend, and the live lane still parses",
      readLedger(join(STATE_DIR, "__no_such_ledger_ever__.jsonl")).length === 0
      && (!existsSync(BLEDGER) || readLedger(BLEDGER).length > 0));
    // the shape guard, same reason as THE DRAFTS' DOOR below: the rationale at
    // :57 only holds if the budget read keeps going through the strict reader.
    assert("the budget read stays on readLedger — no catch-all can creep back onto the one input headroom() trusts most",
      /readLedger\(BLEDGER\)/.test(String(convene)) && !/readLines\(BLEDGER\)/.test(String(convene)));
  }
  // ── THE DRAFTS' DOOR (11 Aug 2026 wiring audit) ───────────────────────────
  // Both push sites cut every chair's draft at 1200 chars on the way out of this
  // file — before cortex's Opus prompt AND before the jaccard math. The fixture
  // below is built so the cut is not merely visible but DECISIVE, and so it bites
  // on EITHER push site alone: the two families open with DIFFERENT 1,300-char
  // preambles (one repeated word each — wordSet is a Set, so a preamble costs
  // exactly one term) and CONVERGE on a shared conclusion that lives entirely past
  // the old cut. That is the council working as designed: the steelman and the
  // prosecutor frame it differently and land on the same mechanism.
  //   · uncut  → jaccard 9/11, disagreement 0.18, no split, no flag. Correct.
  //   · capped → the shared conclusion is amputated off whichever draft was cut,
  //     the word-sets stop intersecting, jaccard 0.00, disagreement 1.00,
  //     cross_split TRUE, council_flag.json written, and setpiece.mjs:588 compiles
  //     a defend drill for HIM off a disagreement that does not exist.
  // Every assertion goes red the moment any cap comes back — the first three on
  // the values, the last structurally, so a cut re-introduced under a different
  // spelling still cannot pass unnoticed.
  {
    const conclusion = "chairs converge recompute amortized projections bandwidth saturated kernels unavoidable";
    const alpha = "attention ".repeat(130) + conclusion;                   // 1,300-char preamble, ONE unique word
    const beta  = "quadratic ".repeat(130) + conclusion;                   // …a different one
    let flagD = null;
    const cD = await convene("does the kv cache remove quadratic attention?", {
      seatsCfg: { seats: DEFAULT_SEATS, cross: CROSS_SEAT, min_headroom: 20000 },
      generate: async () => ({ ok: true, text: alpha }),
      claudeChair: async () => ({ ok: true, text: beta, total_tokens: 500, duration_ms: 100 }),
      recordUse: () => {}, capsules: null, env: {}, headroom: { allowed: 300000 },
      appendLedger: () => {}, writeFlag: (o) => { flagD = o; },            // hermetic — a fixture must never reach his curriculum
    });
    assert("EVERY DRAFT LEAVES WHOLE (all 5 live ok chair rows measured 338-471 output tokens ≈ past 1200 chars)",
      cD.drafts.length === 4 && cD.drafts.every(d => d.text.length === (d.family === "claude" ? beta.length : alpha.length))
      && cD.drafts.every(d => d.text.length > 1200));
    assert("…and the tail reaches the ONE Opus integration prompt (cortex reads no other field)",
      (councilSection(cD).match(/saturated kernels unavoidable/g) || []).length === 4);
    // the damage the cut actually did, reproduced: the gate that reaches HIM.
    assert("THE JACCARD MATH SEES WHERE THEY AGREE — capped, chairs that converged read as DISJOINT (1.00) and a defend drill is compiled off an amputation",
      cD.disagreement < 0.85 && cD.cross_split === false && flagD === null);
    // comments stripped for the same reason as the flag-door guard above: the
    // rationale at the push sites quotes the removed `.slice(0, 1200)` verbatim.
    const codeOfD = (fn) => String(fn).replace(/^[ \t]*\/\/[^\n]*$/gm, "").replace(/\s\/\/[^\n]*/g, "");
    assert("no cap survives at either push site, under any spelling",
      !/drafts\.push\([^\n]*\.slice\(/.test(codeOfD(convene)) && !/r\.text[^\n]*\.slice\(/.test(codeOfD(convene)));
  }
  // disagreement math + graceful degradation (unchanged laws)
  {
    const clones = disagreement([{ text: "the quadratic cost comes from pairwise attention scores" }, { text: "the quadratic cost comes from pairwise attention scores" }]);
    const split = disagreement([{ text: "completely about memory bandwidth saturation hardware" }, { text: "entirely conceptual misunderstanding pedagogical framing" }]);
    assert("clones read ~0 disagreement; disjoint drafts read ~1", clones < 0.1 && split > 0.9);
    const cSplit = { drafts: [{ seat: "a", text: "x" }, { seat: "b", text: "y" }], disagreement: 0.92, split: true };
    assert("a hard split is SURFACED as the crux, never papered over", councilSection(cSplit).includes("SPLIT HARD") && councilSection(cSplit).includes("crux"));
    const c = await convene("q", { seatsCfg: threeSeats, generate: async () => ({ ok: false }), recordUse: () => {}, capsules: null, writeFlag: () => {} });
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
    // uncut here too (11 Aug 2026): `ask` is the only window a human has into what
    // the chairs actually said, and a silent 400-char display cut is how you read a
    // whole draft off the terminal and conclude the chair said only that much.
    for (const d of c.drafts) console.log(`\n[${d.seat}${d.family && d.family !== "gemini" ? " · " + d.family : ""}]\n${d.text}`);
    return;
  }
  console.log("council.mjs — ask \"<question>\" | selftest");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { convene, councilSection, disagreement, crossFamilySplit, capsuleExcerpts, capsuleExcerptsLegacy, CAPSULE_LAYERS, VOICE_LAYERS, loadSeats, claudeChairAsync, claudeChairAsyncLegacy, DEFAULT_SEATS, CROSS_SEAT };
