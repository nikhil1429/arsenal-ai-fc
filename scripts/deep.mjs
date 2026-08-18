#!/usr/bin/env node
// ============================================================================
// deep.mjs · ARSENAL AI FC — THE RE-READ SURFACE (the locker's key)
// ----------------------------------------------------------------------------
// WHAT:  Prints the capsule content he already wrote — WELD (short defended
//        answer), DEEP (the scratch-from-zero re-learn layer), the strikes, the
//        traps, the bridges — inside Claude Code, where he now studies.
//
// WHY:   FORGE_SPEC.md marks `deep` "MUST RENDER (completeness req)" and, in the
//        SAME line, "Currently embedded-but-not-rendered = SKIP = fix PENDING".
//        FORGE_DEEP_RENDER_BRIEF.md is blunter: the content is
//        "DATA ke roop mein build ke andar EMBEDDED hai, par koi screen/tab/
//        trigger use RENDER nahi karta … iske bina re-read pe notes SHALLOW lagte
//        hain aur concepts dimaag mein judte nahi. Yeh INTERVIEW-FAILURE RISK hai."
//        Pending since 30 Jun 2026. Measured 4 Aug 2026: **80,511 characters of
//        `deep` across 36 of 36 axes — every axis has it — and zero readers.**
//        ~45 A4 pages of his own defended explanations, openable only by opening
//        a JSON file by hand.
//        The shipped THE-FORGE.html is baked-only and renders neither `deep` nor
//        `viz`, so a browser was never going to be the fix. This is.
//
// LAWS (from PROJECT_OS.md / FORGE_SPEC.md — this file obeys, never re-decides):
//   · READER ONLY. Capsules are IMMUTABLE and their prose is SACRED (`bolo`,
//     `weld`, `deep`, `mechanism`, `hook`, `why`, `traps`, `threeWays`,
//     `interviewLines`). This file NEVER writes, never rewrites, never
//     summarises, never invents. It prints his words verbatim or it says the
//     field is empty. A summary here would silently replace the thing he will
//     have to defend out loud.
//   · ALWAYS-COLD (Re-Jirah controller v0, knob 1). `due` shows the STRIKE
//     QUESTIONS ONLY — never the welds. "notes band. Struggle = feature, bug
//     nahi." Answers need a second, deliberate command.
//   · DEEPER, NEVER LONGER (HOW_HE_LEARNS rule 17). One axis at a time is the
//     default. A 36-axis dump is exactly the wall-of-text that breaks him.
//   · OVERDUE = RIPE. A little overdue is high-value recall, not an alarm — only
//     severe overdue is flagged, because ADHD compounding-avoidance dies here.
//   · EXIT 0 on a successful run. A verdict in an exit code makes a healthy organ
//     look broken to Task Scheduler and to /organism-doctor.
//   · NEVER SWALLOW A FILE. A capsule that is ON DISK but cannot be read gets
//     NAMED before any count is printed. See LOAD FAILURES below — a locked
//     concept silently ceasing to exist on the re-read surface is the worst
//     failure this file can have, and it had it until 11 Aug 2026.
//
// SOURCE: dressing-room/state/capsules/*.json — the LOCAL MIRROR that mirror.mjs
//         pulls from the gist every morning at 06:55. The gist stays canonical;
//         this reads the mirror so a session never needs the network.
//
// MODES: node scripts/deep.mjs                       · what exists, what is due
//        node scripts/deep.mjs due                   · Re-Jirah queue, questions only (COLD)
//        node scripts/deep.mjs <concept>             · the capsule's spine + axis list + what else is inside
//        node scripts/deep.mjs <concept> <axis>      · ONE axis, fully opened
//        node scripts/deep.mjs <concept> all --yes   · every axis (--yes IS the wall-confirm; without it, it refuses)
//        node scripts/deep.mjs <concept> doubts      · his doubt bank for that concept
//        node scripts/deep.mjs <concept> traps       · the seductive-wrong bank (bait · galat · sach)
//        node scripts/deep.mjs <concept> bridges     · the wires to the neighbouring concepts
//        node scripts/deep.mjs <concept> threeways   · the same thing told three ways
//        node scripts/deep.mjs <concept> lines       · interview lines, cold-speakable English
//        node scripts/deep.mjs <concept> calibration · predicted-vs-actual, his own log
//        node scripts/deep.mjs <concept> build       · where it lands in FinOps
//        node scripts/deep.mjs selftest
//
// (The seven commands after `doubts` were added 10 Aug 2026 — see CAPSULE-LEVEL
//  LAYERS below for what they were doing before that, which was nothing.)
// ============================================================================

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { burnedAxes } from "./samjhao.mjs";   // LOAD ZERO BLOCK 2 (19 Aug 2026): samjhao OPENS a weld, so that axis's strike can never again be served as a COLD question

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CAPSULES  = join(STATE_DIR, "capsules");
const PROFILE   = join(STATE_DIR, "forge_profile.json");

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const AXES = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];

// ---------------------------------------------------------------------------
// load
//
// LOAD FAILURES ARE NAMED, NEVER SWALLOWED (traced + repaired 11 Aug 2026).
// This was `.map(readJson).filter((c) => c && c.id)` over a readJson whose whole
// error handler is `catch {}` — so a capsule file that is ON DISK but unreadable
// simply ceased to exist, in every mode, with no message anywhere.
// RAN IT: four capsule files copied to a scratch dir, context.json truncated to
// `{ "id": "context", "lockedOn":` → loadCapsules returned 3 (tokenization,
// embeddings, inference) and printed nothing. The overview header would then read
// `LOCKED CAPSULES (3)` and the footer would recompute "N/N axes" around the
// survivors: a full, healthy tally of a book missing a chapter, on the one screen
// PROJECT_OS.md:57 calls THE re-read surface. No bug is needed to reach it — a
// hand-edit, a half-written mirror pull, or a restore out of capsule_backups/
// (mirror.mjs) all produce exactly this file.
// Sibling defect, same file, repaired the same night: a capsule that loads fine
// but carries an unreadable `lockedOn` (see rejirahStatus's `why` below). That one
// is about a capsule that cannot be SCHEDULED; this one is about a capsule that
// never arrives at all.
// NOT AN ENGINE SWAP — no *Legacy freeze is owed here. For every file that used to
// load, the returned object and the sort are byte-identical; the only new thing is
// an error channel where there was none.
// READER ONLY still holds absolutely. This NAMES the file and stops: it does not
// repair it, re-parse it, guess at it, or write one byte. capsules/ has exactly one
// writer and it is mirror.mjs.
// ---------------------------------------------------------------------------
let LOAD_FAILURES = [];

// The judgement, split out from the disk read so BOTH refusal branches are
// testable without this file ever writing a fixture — deep.mjs contains no
// writeFileSync/appendFileSync at all and that stays true (.claude/skills/
// learn/SKILL.md:41 cites the grep as its evidence that this surface is cheap
// and read-only).
export function classifyCapsuleFile(file, text) {
  let c = null;
  try { c = JSON.parse(text); }
  catch (e) { return { failure: { file, why: `JSON toota hua hai — ${e.message}` } }; }
  // The second silent drop, and the quieter one: a file that parses but has no
  // `id`. No command in this file can address it (main() matches on id), so
  // dropping it without a word hides it just as completely as a parse failure.
  if (!c || !c.id) return { failure: { file, why: "JSON theek hai par `id` field hi nahi — is capsule ko koi command address nahi kar sakta" } };
  return { capsule: c };
}

function loadCapsules(dir = CAPSULES) {
  LOAD_FAILURES = [];
  if (!existsSync(dir)) return [];
  const good = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    let text = null;
    try { text = readFileSync(join(dir, f), "utf8"); }
    catch (e) { LOAD_FAILURES.push({ file: f, why: `disk se khuli hi nahi — ${e.message}` }); continue; }
    const v = classifyCapsuleFile(f, text);
    if (v.failure) { LOAD_FAILURES.push(v.failure); continue; }
    good.push(v.capsule);
  }
  return good.sort((a, b) => String(a.num || "").localeCompare(String(b.num || "")));
}

// Read-only accessor. Exported so a future organ (a watchman check, the doctor)
// can ask this file WHICH capsules it could not open without re-implementing the
// read — the mistake that produced the six-week orphan-field gap below.
export const loadFailures = () => LOAD_FAILURES.slice();

// THE WIRE. Every mode reaches the disk through the single loadCapsules() call in
// main(), so one call there covers overview · due · spine · axis · all · and all
// seven section commands — a new mode added tomorrow is covered for free.
// Printed BEFORE any count, because the damage was never the missing capsule: it
// was the tally underneath it reading as complete.
function printLoadFailures() {
  if (!LOAD_FAILURES.length) return false;
  console.log(`\n⚠  ${LOAD_FAILURES.length} file capsules/ mein hai par khuli nahi — neeche ki HAR ginti (capsules · axes · DEEP chars) inke BINA hai:`);
  for (const f of LOAD_FAILURES) console.log(`   ✗ ${f.file}  ·  ${f.why}`);
  console.log("   yeh sirf mirror hai, master gist hai — dobara kheencho: node scripts/mirror.mjs");
  return true;
}

// Re-Jirah is date-driven off `lockedOn` + the profile's intervals, and rounds
// already done are listed in `reJirahDone`. This mirrors capsule_bridge.mjs's
// reading — it does NOT invent a second scheduler.
export function rejirahStatus(capsule, intervals, now = new Date()) {
  const locked = new Date(capsule.lockedOn + "T00:00:00Z");
  // DEAD WIRE, traced + repaired overnight 10→11 Aug 2026. This branch returned a bare
  // status:"unknown" and then NOTHING said so: `due`'s filter below keeps only overdue/due,
  // so the capsule fell out of every cold round in silence, and the header count printed
  // next to it stayed confident and wrong. It matters because mirror.mjs validates only
  // `.id` before writing a capsule (its "no_id_field" branch) — never lockedOn — so one
  // typo in HIS hand-written gist JSON lands legitimately and quietly retires that concept
  // from Re-Jirah forever. The reason travels with the verdict now, and both surfaces print
  // it. Wording follows the sibling reading this file claims to mirror: rejirah.mjs's
  // roundSchedule refuses the same input with "inventing one would be a fabricated date".
  if (Number.isNaN(locked.getTime())) return { round: null, status: "unknown", overdueDays: null, nextDue: null,
    why: `lockedOn "${capsule.lockedOn ?? ""}" padha nahi ja saka — schedule compute nahi ho sakta, aur date bana dena jhooth hoga.` };
  // B7 (9 Aug 2026): this counted reJirahDone.length raw, while capsule_bridge (the
  // reading this claims to mirror) ISO-filters the entries into a done-Set keyed by
  // DUE date. A junk entry or an out-of-order round made the two organs disagree on
  // which round is next. Now it really mirrors: rounds match by their due date.
  const doneSet = new Set((Array.isArray(capsule.reJirahDone) ? capsule.reJirahDone : []).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d))));
  const dueStr = (n) => new Date(locked.getTime() + n * 86400000).toISOString().slice(0, 10);
  const nextIdx = intervals.findIndex((n) => !doneSet.has(dueStr(n)));
  if (nextIdx === -1) return { round: intervals.length, status: "complete", overdueDays: 0, nextDue: null };
  const nextDue = new Date(locked.getTime() + intervals[nextIdx] * 86400000);
  const overdueDays = Math.floor((now.getTime() - nextDue.getTime()) / 86400000);
  const status = overdueDays > 0 ? "overdue" : overdueDays === 0 ? "due" : "up";
  return { round: nextIdx + 1, status, overdueDays: Math.max(0, overdueDays), nextDue: nextDue.toISOString().slice(0, 10) };
}

// ---------------------------------------------------------------------------
// print helpers — never fabricate, always say when a field is empty
// ---------------------------------------------------------------------------
const rule = (s = "") => console.log(s ? `\n── ${s} ` + "─".repeat(Math.max(0, 66 - s.length)) : "─".repeat(70));
function field(label, value) {
  const v = typeof value === "string" ? value.trim() : "";
  if (!v) { console.log(`  ${label}: (khaali — is capsule mein yeh field bhara hi nahi hai)`); return false; }
  console.log(`\n${label}:\n`);
  console.log(v.split("\n").map((l) => "  " + l).join("\n"));
  return true;
}

// ---------------------------------------------------------------------------
// modes
// ---------------------------------------------------------------------------
function overview(caps, intervals, now) {
  if (!caps.length) {
    console.log("\ndeep: koi capsule nahi mila.");
    console.log(`  dekha: ${CAPSULES}`);
    console.log("  mirror.mjs har subah 06:55 pe gist se kheenchta hai — `node scripts/mirror.mjs` se abhi bhi.");
    return;
  }
  console.log(`\n== LOCKED CAPSULES (${caps.length}) ==\n`);
  let deepChars = 0, deepAxes = 0, totalAxes = 0;
  for (const c of caps) {
    const r = rejirahStatus(c, intervals, now);
    const fl = c.faultLines || [];
    totalAxes += fl.length;
    for (const a of fl) if ((a.deep || "").trim()) { deepChars += a.deep.length; deepAxes++; }
    const tag = r.status === "overdue" ? `R${r.round} ${r.overdueDays}d OVERDUE`
      : r.status === "due" ? `R${r.round} DUE`
      : r.status === "complete" ? "saare round done"
      // Before the 10→11 Aug repair an unreadable lockedOn fell through to the last
      // branch and rendered as the string "Rnull → null" — a broken date shown as a
      // schedule. Named honestly now, with the raw value, so the row says what to fix.
      : r.status === "unknown" ? `lockedOn "${c.lockedOn ?? ""}" — Re-Jirah band`
      : `R${r.round} → ${r.nextDue}`;
    console.log(`  ${String(c.num || "??").padEnd(3)} ${String(c.id).padEnd(14)} ${String(c.status || "?").padEnd(10)} ${fl.length} axes · ${(c.doubts || []).length} doubts · ${tag}`);
  }
  console.log(`\n  ${deepChars.toLocaleString()} characters of DEEP across ${deepAxes}/${totalAxes} axes — tumhare apne shabd.`);
  // The capsule-level layers, counted live off the same capsules — measured, never
  // written into prose. Printed here because until 10 Aug 2026 this screen gave no
  // hint they existed at all.
  const layerChars = caps.reduce((n, c) => n + SECTIONS.reduce((m, s) => m + s.keys.reduce((k2, k) => k2 + JSON.stringify(c[k] ?? "").length, 0), 0), 0);
  console.log(`  ${layerChars.toLocaleString()} characters more in traps · bridges · threeways · lines · calibration · build · doubts.`);
  console.log("\n  node scripts/deep.mjs due                → Re-Jirah queue (sirf sawaal, COLD)");
  console.log("  node scripts/deep.mjs <concept>          → us capsule ki spine + andar kya-kya hai");
  console.log("  node scripts/deep.mjs <concept> <axis>   → ek axis, poora khula\n");
}

// ALWAYS-COLD: questions only. The weld is one deliberate command away.
function due(caps, intervals, now) {
  const scored = caps.map((c) => ({ c, r: rejirahStatus(c, intervals, now) }));
  const rows = scored
    .filter(({ r }) => r.status === "overdue" || r.status === "due")
    .sort((a, b) => b.r.overdueDays - a.r.overdueDays);

  // A capsule the scheduler cannot read is NOT "not due" — it is UNSCHEDULED, and staying
  // quiet about it is exactly how a concept leaves the rotation forever without anyone
  // noticing. It goes FIRST and unconditionally, before the header and before the
  // nothing-due line, for the reason rejirah.mjs's `due` already prints its pending line
  // first: it is the one thing that makes every other number on this screen wrong.
  // READER-ONLY holds — this file cannot fix the date. The gist is the master, mirror.mjs
  // is the only writer of capsules/, so the repair is his edit and then a re-pull.
  const unreadable = scored.filter(({ r }) => r.status === "unknown");
  if (unreadable.length) {
    console.log(`\n⚠ ${unreadable.length} capsule Re-Jirah queue se BAAHAR hai (schedule ban hi nahi saka): `
      + unreadable.map(({ c }) => `${c.id} (lockedOn: "${c.lockedOn ?? ""}")`).join(" · "));
    console.log("   Gist mein lockedOn ko YYYY-MM-DD karo, phir `node scripts/mirror.mjs` — tab tak yeh concept kisi bhi cold round mein nahi aayega.");
  }

  if (!rows.length) { console.log("\nRe-Jirah: abhi kuch due nahi hai.\n"); return; }

  console.log(`\n== RE-JIRAH DUE (${rows.length}) — COLD. Notes band. ==`);
  console.log("   Pehle khud jawab do. Weld dekhne ke liye: deep.mjs <concept> <axis>");
  // The gut-word rides HERE and not on the grade line below, because canon puts it
  // BEFORE the answer and forbids re-grading it after (CLAUDE.md, "Gut-word before the
  // answer … never re-graded after"). By the time the weld is on screen it is too late
  // to commit one honestly — so the screen that shows the strike is the only place it
  // can be asked for. rejirah.mjs refuses a round with no gut-word outright
  // (organism_test.mjs:252, "GUT-WORD LAW"), which is what makes this line load-bearing.
  console.log("   Har axis pe jawab se PEHLE gut-word bol do: knew | shaky | guessed — baad mein badalta nahi.\n");
  for (const { c, r } of rows) {
    // OVERDUE = RIPE. Only severe overdue gets called out; a little overdue is a
    // high-value recall opportunity, not a failure to scold him with.
    const ripe = r.overdueDays > 30 ? "  ← bahut overdue, isi se shuru karo" : "";
    console.log(`\n${"═".repeat(70)}`);
    console.log(`${c.title || c.id}  ·  round R${r.round}  ·  ${r.overdueDays}d overdue${ripe}`);
    console.log(`${"═".repeat(70)}`);
    // THE COLDNESS GUARANTEE (19 Aug 2026, LOAD ZERO §4). A samjhao REVISION opens the weld for an
    // axis, which means that axis's stored `strike` is no longer a cold question — he was shown
    // its answer, on a date this can name. Serving it anyway would make the round WARM while
    // calling itself COLD, which is the worst of both. So a burned axis is NOT served: it is
    // named, with the date, and the round is told to generate a FRESH question on the
    // re-activated material. samjhao.mjs holds the fact; this screen decides what to serve.
    let burnedOf = new Map();
    try { burnedOf = new Map(burnedAxes(c.id).map((b) => [b.axis, b.at])); } catch { burnedOf = new Map(); }
    for (const a of c.faultLines || []) {
      const strike = (a.strike || "").trim();
      if (burnedOf.has(a.axis)) {
        console.log(`\n  ${a.axis})  is axis ka strike SAMJHAO mein khul chuka (${String(burnedOf.get(a.axis)).slice(0, 10)}) — purana sawaal ab COLD nahi hai.`);
        console.log("        FRESH sawaal chahiye, re-activated material pe. Purana strike dobara mat poochho.");
        continue;
      }
      console.log(`\n  ${a.axis})  ${strike || "(is axis pe koi strike-sawaal nahi likha)"}`);
    }
    // ── THE RETURN LEG (traced + wired 11 Aug 2026) ────────────────────────
    // BUILT, PRESENT, NOT WIRED. `rejirah.mjs due` has pointed AT this screen since
    // #107 — its own footer reads "Cold sawaal: `node scripts/deep.mjs due`"
    // (grep -n "Cold sawaal" scripts/rejirah.mjs) — and this screen pointed back at
    // NOTHING. The only exit it ever named was the weld. So the entire cold round can
    // be sat here, end to end, and leave zero rows behind: `rejirah_log.jsonl` HAS
    // NEVER EXISTED on this machine (`ls dressing-room/state/rejirah_log.jsonl` → no
    // such file) while THIS screen was, the day it was traced, listing four capsules
    // 14–47 days overdue. The recorder is not missing; its DOOR was.
    // Downstream that starvation is not cosmetic: fsrs.mjs:166 readRejirahRounds()
    // gets an empty Map on every run, so every reJirahDone date keeps replaying as the
    // frozen `seed_basis:"legacy-gist"` knew/correct seed — the exact unconditional
    // Rating.Easy the #108 bridge was written to stop. The bridge is fully built and
    // fully tested (fsrs.mjs:592-627) and has never once seen a real round.
    // A command AT THE POINT OF USE, never one to remember (ANCHOR LAW) — the same
    // pattern as the weld line above it and the bridges' far-end command below.
    console.log(`\n  → jawab dene ke baad: node scripts/deep.mjs ${c.id} <axis>`);
    console.log(`  → phir result likho:  node scripts/rejirah.mjs grade ${c.id} <axis> held|cracked --gut <word>`);
  }
  // Printed once, at the bottom, because a round closes ONCE — repeating it per capsule
  // would read as "close after every axis", which is not what a round is.
  console.log("\n  Saare due axes grade ho jayein, tab round band karo: node scripts/rejirah.mjs close <concept>");
  console.log("");
}

function capsuleSpine(c, intervals, now) {
  const r = rejirahStatus(c, intervals, now);
  console.log(`\n${"═".repeat(70)}`);
  console.log(`${c.num ? c.num + " · " : ""}${c.title || c.id}   [${c.status || "?"}]`);
  console.log(`locked ${c.lockedOn}  ·  Re-Jirah R${r.round || "-"} ${r.status}${r.overdueDays ? ` (${r.overdueDays}d)` : ""}`);
  // stream/dot/viz/source are one-word fields — they ride the header rather than
  // earning a command of their own. Printed, not skipped: the completeness footer
  // below only means anything if every field really does have a home.
  const meta = [c.stream && `stream ${c.stream}`, c.dot && `dot ${c.dot}`, String(c.viz || "").trim() && `viz ${String(c.viz).trim()}`].filter(Boolean).join("  ·  ");
  if (meta) console.log(meta);
  if (String(c.source || "").trim()) console.log(`source: ${String(c.source).trim()}`);
  console.log(`${"═".repeat(70)}`);
  field("WHY (yeh concept hai hi kyun)", c.why);   // 10 Aug 2026: `why` rendered nowhere in this file until today
  field("HOOK", c.hook);
  field("MECHANISM", c.mechanism);
  field("DEEP (capsule-level)", c.deep);
  rule("AXES");
  for (const a of c.faultLines || []) {
    const has = (a.deep || "").trim() ? `${a.deep.length} chars` : "NO DEEP";
    console.log(`  ${a.axis})  ${String(a.title || "").padEnd(38)} ${String(a.status || "?").padEnd(8)} ${has}`);
  }
  if (c.bolo && String(c.bolo).trim()) { rule("BOLO — tumhare apne shabd"); console.log("  " + String(c.bolo).trim().split("\n").join("\n  ")); if (c.bolo_by) console.log(`\n  ${c.bolo_by}`); }

  // THE INDEX. Nothing here is a command he has to remember (ANCHOR LAW) — the
  // capsule tells him what else it is carrying, with the count, at the moment he
  // opens it. Before 10 Aug 2026 this list did not exist and neither did six of
  // the seven commands on it.
  rule("AUR KYA IS CAPSULE MEIN HAI");
  for (const s of SECTIONS) {
    const n = s.count(c);
    const left = `  ${s.label.padEnd(12)} ${n ? `${String(n).padStart(4)} ${s.unit}` : "   (khaali)"}`;
    console.log(`${left.padEnd(34)}  node scripts/deep.mjs ${c.id} ${s.cmd}`);
  }

  // COMPLETENESS — the defect reports itself. See PLACED above.
  const extra = Object.keys(c).filter((k) => !PLACED.includes(k));
  const total = Object.keys(c).length;
  console.log(`\n  completeness: ${total} fields · ${total - extra.length} ka apna ghar hai${extra.length ? `  ·  ⚠ ${extra.length} ka KOI RENDER NAHI: ${extra.join(", ")}` : "  ·  0 skipped"}`);
  console.log(`\n  ek axis kholne ke liye: node scripts/deep.mjs ${c.id} a\n`);
}

function oneAxis(c, axis) {
  const a = (c.faultLines || []).find((f) => String(f.axis).toLowerCase() === axis);
  if (!a) {
    console.log(`\ndeep: "${c.id}" mein axis "${axis}" nahi mila.`);
    console.log(`  maujood: ${(c.faultLines || []).map((f) => f.axis).join(", ") || "(koi nahi)"}\n`);
    return;
  }
  console.log(`\n${"═".repeat(70)}`);
  console.log(`${c.title || c.id}  ·  axis ${a.axis}  ·  ${a.title || ""}`);
  console.log(`status: ${a.status || "?"}`);
  console.log(`${"═".repeat(70)}`);
  field("STRIKE (interviewer ka sawaal)", a.strike);
  field("WELD (defended jawab)", a.weld);
  const had = field("DEEP (scratch se re-learn)", a.deep);
  if (!had) console.log("\n  (is axis pe deep layer likhi hi nahi gayi — yeh gap hai, koi bug nahi)");
  // THE RETURN LEG, second door (11 Aug 2026). This is the exact instant he learns
  // held-vs-cracked — the weld is on screen and the comparison is done. `due` names the
  // recorder for the whole queue; this names it for THIS axis, pre-filled, so the round
  // can be recorded from whichever screen he is standing on. The gut-word is deliberately
  // NOT re-asked here: it was committed on the `due` screen before the weld, and asking
  // again after the answer is visible is precisely the re-grade canon forbids.
  console.log(`\n  → is axis ka result: node scripts/rejirah.mjs grade ${c.id} ${a.axis} held|cracked --gut <jo weld se pehle bola tha>`);
  console.log("");
}

function doubts(c) {
  const d = c.doubts || [];
  console.log(`\n== ${c.title || c.id} — ${d.length} doubts (tumhare atke hue sawaal) ==\n`);
  if (!d.length) { console.log("  (koi doubt record nahi hua)\n"); return; }
  d.forEach((x, i) => {
    console.log(`${String(i + 1).padStart(3)}. Q: ${String(x.q || "").trim()}`);
    console.log(`     A: ${String(x.a || "").trim().split("\n").join("\n        ")}\n`);
  });
}

// ---------------------------------------------------------------------------
// CAPSULE-LEVEL LAYERS — the seven fields this file printed nothing of until
// 10 Aug 2026.
//
// BUILT, PRESENT, NOT WIRED. `why` · `traps` · `bridges` · `threeWays` ·
// `interviewLines` · `calibration` · `buildHook` sit in all four capsules from
// the day each one locked, the header of THIS file has advertised "the strikes,
// the traps, the bridges" since 4 Aug 2026 — and
// `grep -n "traps\|bridges\|threeWays\|interviewLines" scripts/deep.mjs`
// returned ZERO hits until this block. Measured over the four live capsules the
// day it was fixed: traps 10,188 · calibration 6,803 · interviewLines 6,609 ·
// bridges 5,427 · threeWays 5,147 · buildHook 3,234 · why 1,224 characters of
// his own defended prose, reachable only by opening a JSON file by hand — the
// exact complaint FORGE_DEEP_RENDER_BRIEF.md filed about `deep`, one layer up,
// on a surface PROJECT_OS.md:57 names as THE re-read surface.
//
// EACH IS ITS OWN DELIBERATE COMMAND, never bolted onto the spine: DEEPER,
// NEVER LONGER (HOW_HE_LEARNS rule 17). `traps` alone is 12 entries on
// `embeddings`; printed with the spine it becomes the wall-of-text this file
// exists to avoid. `doubts` set that precedent on 4 Aug and it still holds.
// READER ONLY, same as everything above — verbatim or "khaali", never a
// summary, never a re-word (capsule prose is SACRED).
// ---------------------------------------------------------------------------
function sectionTraps(c) {
  const t = Array.isArray(c.traps) ? c.traps : [];
  console.log(`\n== ${c.title || c.id} — ${t.length} TRAPS (jo galat jawab sahi lagta hai) ==\n`);
  if (!t.length) { console.log("  (is capsule mein koi trap likha hi nahi hai)\n"); return; }
  t.forEach((x, i) => {
    console.log(`${String(i + 1).padStart(3)}. BAIT : ${String(x.bait || "").trim().split("\n").join("\n            ")}`);
    console.log(`     GALAT: ${String(x.wrong || "").trim().split("\n").join("\n            ")}`);
    console.log(`     SACH : ${String(x.truth || "").trim().split("\n").join("\n            ")}\n`);
  });
}

// A bridge is a real wire between two capsules, so it prints the command that
// opens the far end — but only when that capsule is actually in the mirror. A
// bridge to a concept he has not locked yet is still worth reading; advertising
// a command that would answer "koi locked capsule nahi hai" is not.
function sectionBridges(c, caps = []) {
  const b = Array.isArray(c.bridges) ? c.bridges : [];
  const known = new Set(caps.map((x) => String(x.id).toLowerCase()));
  console.log(`\n== ${c.title || c.id} — ${b.length} BRIDGES (yahan se aage kahan judta hai) ==\n`);
  if (!b.length) { console.log("  (is capsule mein koi bridge likha hi nahi hai)\n"); return; }
  b.forEach((x, i) => {
    console.log(`${String(i + 1).padStart(3)}. → ${String(x.to || "?").trim()}   [${String(x.conn || "").trim()}]`);
    console.log(`     Q: ${String(x.q || "").trim().split("\n").join("\n        ")}`);
    console.log(`     A: ${String(x.a || "").trim().split("\n").join("\n        ")}`);
    if (known.has(String(x.to || "").toLowerCase())) console.log(`     us capsule tak: node scripts/deep.mjs ${String(x.to).toLowerCase()}`);
    console.log("");
  });
}

// Object.keys, NOT a hardcoded ceo/junior/skeptic. The whole defect this block
// repairs is a renderer that knew fewer fields than the data carried; a fourth
// voice added to the gist tomorrow must print, not vanish.
function sectionThreeWays(c) {
  const t = c.threeWays && typeof c.threeWays === "object" ? c.threeWays : {};
  const keys = Object.keys(t).filter((k) => String(t[k] || "").trim());
  console.log(`\n== ${c.title || c.id} — TEEN TAREEKE (${keys.length}) ==`);
  if (!keys.length) { console.log("\n  (threeWays is capsule mein bhara hi nahi hai)\n"); return; }
  for (const k of keys) field(k.toUpperCase(), t[k]);
  console.log("");
}

function sectionLines(c) {
  const l = Array.isArray(c.interviewLines) ? c.interviewLines : [];
  console.log(`\n== ${c.title || c.id} — ${l.length} INTERVIEW LINES (cold bolne layak) ==\n`);
  if (!l.length) { console.log("  (koi interview line likhi hi nahi hai)\n"); return; }
  l.forEach((x, i) => console.log(`${String(i + 1).padStart(3)}. ${String(x || "").trim()}\n`));
}

function sectionString(c, key, label, empty) {
  console.log(`\n${"═".repeat(70)}`);
  console.log(`${c.title || c.id}  ·  ${label}`);
  console.log(`${"═".repeat(70)}`);
  if (!field(label, c[key])) console.log(`\n  (${empty})`);
  console.log("");
}

// ONE table, two consumers: the dispatcher in main() and the spine's index +
// completeness footer. They cannot drift apart — a section added here is
// callable AND advertised in the same edit, which is the failure mode that put
// 38k characters of his prose out of reach for six weeks.
const SECTIONS = [
  { cmd: "doubts",      keys: ["doubts"],         label: "doubts",      unit: "sawaal",      count: (c) => (c.doubts || []).length,         render: (c) => doubts(c) },
  { cmd: "traps",       keys: ["traps"],          label: "traps",       unit: "baits",       count: (c) => (c.traps || []).length,          render: (c) => sectionTraps(c) },
  { cmd: "bridges",     keys: ["bridges"],        label: "bridges",     unit: "wires",       count: (c) => (c.bridges || []).length,        render: (c, caps) => sectionBridges(c, caps) },
  { cmd: "threeways",   keys: ["threeWays"],      label: "threeways",   unit: "nazariye",    count: (c) => Object.keys(c.threeWays || {}).length, render: (c) => sectionThreeWays(c), alias: ["3ways", "threeway"] },
  { cmd: "lines",       keys: ["interviewLines"], label: "lines",       unit: "lines",       count: (c) => (c.interviewLines || []).length, render: (c) => sectionLines(c), alias: ["interviewlines", "interview"] },
  { cmd: "calibration", keys: ["calibration"],    label: "calibration", unit: "chars",       count: (c) => String(c.calibration || "").trim().length, render: (c) => sectionString(c, "calibration", "CALIBRATION (predicted vs actual)", "calibration log is capsule mein likha hi nahi gaya") },
  { cmd: "build",       keys: ["buildHook"],      label: "build",       unit: "chars",       count: (c) => String(c.buildHook || "").trim().length, render: (c) => sectionString(c, "buildHook", "BUILD HOOK (FinOps mein exact jagah)", "build hook is capsule mein likha hi nahi gaya"), alias: ["buildhook"] },
];

// Every capsule key this file has a designed home for. Anything outside it gets
// NAMED on the spine instead of silently dropped — the pattern is lifted from
// setup/build_forge_html.mjs:103, whose "Fields with no designed section yet
// (rendered raw — never skipped)" footer is the reason the HTML never carried
// this defect while the CLI did. A field added to the gist tomorrow now reports
// itself on the next spine open; it does not wait for a tracing pass.
const PLACED = [
  // spine header + metadata line
  "id", "num", "title", "status", "lockedOn", "reJirahDone", "stream", "dot", "source", "viz",
  // spine body
  "why", "hook", "mechanism", "deep", "faultLines", "bolo", "bolo_by",
  // the deliberate commands
  ...SECTIONS.flatMap((s) => s.keys),
];

// ---------------------------------------------------------------------------
// selftest — fixtures only, never touches the live capsules
// ---------------------------------------------------------------------------
function selftest() {
  let pass = 0, fail = 0;
  const ok = (n, c) => { if (c) { pass++; console.log(`  ✓ ${n}`); } else { fail++; console.log(`  ✗ ${n}`); } };
  const now = new Date("2026-08-04T12:00:00Z");
  const iv = [3, 14, 42];

  const cap = { id: "x", num: "01", title: "X", lockedOn: "2026-06-21", reJirahDone: [], status: "tempered",
    faultLines: [{ axis: "a", title: "T", strike: "S?", weld: "W", status: "held", deep: "D" }] };

  const r = rejirahStatus(cap, iv, now);
  ok("R1 due-date = lockedOn + first interval, and overdue is measured not guessed",
    r.round === 1 && r.status === "overdue" && r.overdueDays === 41 && r.nextDue === "2026-06-24");
  ok("a completed round advances to the NEXT interval, never repeats R1",
    rejirahStatus({ ...cap, reJirahDone: ["2026-06-24"] }, iv, now).round === 2);
  ok("all rounds done → 'complete', never a phantom overdue (B7: matched by DUE date, junk entries no longer count)",
    rejirahStatus({ ...cap, reJirahDone: ["2026-06-24", "2026-07-05", "2026-08-02"] }, iv, now).status === "complete"
    && rejirahStatus({ ...cap, reJirahDone: ["a", "b", "c"] }, iv, now).status !== "complete");
  ok("a future due-date reads 'up', not overdue",
    rejirahStatus({ ...cap, lockedOn: "2026-08-03" }, iv, now).status === "up");
  ok("a junk lockedOn degrades honestly instead of throwing",
    rejirahStatus({ ...cap, lockedOn: "not-a-date" }, iv, now).status === "unknown");

  // ALWAYS-COLD is the load-bearing law here: `due` must never leak a weld.
  const out = [];
  const realLog = console.log;
  console.log = (...a) => out.push(a.join(" "));
  try { due([cap], iv, now); } finally { console.log = realLog; }
  const text = out.join("\n");
  ok("ALWAYS-COLD: `due` prints the STRIKE question", /S\?/.test(text));
  ok("ALWAYS-COLD: `due` NEVER prints the weld (notes band — struggle is the feature)",
    !/\bW\b/.test(text.replace(/[═─]/g, "")));
  ok("`due` names the exact command that opens the answer", /deep\.mjs x <axis>/.test(text));

  // ── THE RETURN LEG (wired 11 Aug 2026) ────────────────────────────────────
  // These go red the moment this file stops naming the recorder — the state it was in
  // for weeks, which is why `rejirah_log.jsonl` has never existed and fsrs.mjs's #108
  // bridge has never seen a real round. A round sat on a screen that names no recorder
  // is a round that never happened, to every organ downstream.
  ok("THE RETURN LEG: `due` routes the round back to its recorder, concept pre-filled",
    /rejirah\.mjs grade x <axis> held\|cracked/.test(text));
  ok("THE RETURN LEG: `due` names the round CLOSE too — a graded round nobody closes never reaches the gist",
    /rejirah\.mjs close/.test(text));
  ok("GUT-WORD LAW: `due` asks for the gut-word BEFORE the weld, where it is still honest",
    /PEHLE gut-word/.test(text) && /knew \| shaky \| guessed/.test(text));

  const outRL = [];
  console.log = (...a) => outRL.push(a.join(" "));
  try { oneAxis(cap, "a"); } finally { console.log = realLog; }
  ok("THE RETURN LEG: the axis screen — where held-vs-cracked is actually learned — names the recorder with concept AND axis filled in",
    /rejirah\.mjs grade x a held\|cracked/.test(outRL.join("\n")));
  ok("GUT-WORD LAW: the axis screen does NOT re-ask for a gut-word after showing the weld (that is the re-grade canon forbids)",
    !/--gut (knew|<word>)/.test(outRL.join("\n")));

  // A missing deep must be SAID, never silently rendered as nothing.
  const out2 = [];
  console.log = (...a) => out2.push(a.join(" "));
  try { oneAxis({ ...cap, faultLines: [{ axis: "a", title: "T", strike: "S", weld: "W" }] }, "a"); } finally { console.log = realLog; }
  ok("a MISSING deep layer is named out loud, not rendered as silence",
    /deep layer likhi hi nahi gayi/.test(out2.join("\n")));

  const out3 = [];
  console.log = (...a) => out3.push(a.join(" "));
  try { oneAxis(cap, "z"); } finally { console.log = realLog; }
  ok("an unknown axis lists what DOES exist instead of crashing", /nahi mila/.test(out3.join("\n")));

  ok("loadCapsules on a missing dir returns [] and never throws",
    Array.isArray(loadCapsules(join(STATE_DIR, "no-such-dir-here"))));

  // ── THE SWALLOWED FILE (traced + repaired 11 Aug 2026) ────────────────────
  // These fail the moment loadCapsules goes back to `.map(readJson).filter(c => c && c.id)`
  // over a bare `catch {}` — the shape that made a truncated context.json vanish from
  // every mode with no message while the footer counted "N/N axes" over the survivors.
  // No fixture is written: the parse branch is checked on the pure classifier, and the
  // WIRE is checked against the repo root, a real directory that always holds parseable
  // .json files with no `id` (package.json is copied into the CI sandbox by name —
  // organism_test.mjs:451 — so this holds on a fresh checkout too).
  ok("a TRUNCATED capsule file is refused with a reason, never returned as nothing",
    !!classifyCapsuleFile("context.json", '{ "id": "context", "lockedOn":').failure);
  ok("a parseable file with NO `id` is refused too — nothing can address it, so nothing may hide it",
    !!classifyCapsuleFile("stray.json", '{"title":"no id here"}').failure
    && !classifyCapsuleFile("ok.json", '{"id":"x"}').failure);

  const rootCaps = loadCapsules(join(__dirname, ".."));
  const named = loadFailures();
  ok("THE WIRE: loadCapsules NAMES every .json it dropped instead of swallowing it",
    rootCaps.length === 0 && named.length > 0 && named.some((f) => f.file === "package.json"));
  ok("every dropped file carries a REASON, never a bare filename",
    named.every((f) => String(f.why || "").trim().length > 0));

  const out6 = [];
  console.log = (...a) => out6.push(a.join(" "));
  const shouted = printLoadFailures();
  console.log = realLog;
  ok("the failure is PRINTED before any count, names the file, and points at the one writer that can fix it",
    shouted === true && /package\.json/.test(out6.join("\n")) && /mirror\.mjs/.test(out6.join("\n")));

  loadCapsules(join(STATE_DIR, "no-such-dir-here"));   // reset the lane
  const out7 = [];
  console.log = (...a) => out7.push(a.join(" "));
  const quiet = printLoadFailures();
  console.log = realLog;
  ok("a healthy load stays SILENT — no false alarm on the screen he re-reads from",
    quiet === false && out7.length === 0);

  // THE SILENT DROP (traced + repaired overnight 10→11 Aug 2026). Two capsules in, one with
  // an unreadable lockedOn: the header used to read "RE-JIRAH DUE (1)" with the second
  // concept nowhere on the screen at all. MEASURED, not assumed — reverting the three repair
  // hunks in a sandbox copy turns the 1st and 3rd of these red (20 passed, 2 failed).
  // The 2nd one never went red on the old code and is not meant to: it guards the OPPOSITE
  // mistake, an over-eager future fix that folds unscheduled capsules INTO the due count.
  // A dropped capsule must be named beside the number, never counted inside it.
  const ghost = { ...cap, id: "ghost", lockedOn: "" };
  const out4 = [];
  console.log = (...a) => out4.push(a.join(" "));
  try { due([cap, ghost], iv, now); } finally { console.log = realLog; }
  const text4 = out4.join("\n");
  ok("an UNREADABLE lockedOn is NAMED in `due`, never silently dropped from the cold queue",
    /ghost/.test(text4) && /BAAHAR/.test(text4) && /lockedOn: ""/.test(text4));
  ok("`due`'s header count stays honest — it counts the real due rows, and the dropped capsule is not folded into it",
    /RE-JIRAH DUE \(1\)/.test(text4));

  const out5 = [];
  console.log = (...a) => out5.push(a.join(" "));
  try { overview([ghost], iv, now); } finally { console.log = realLog; }
  const text5 = out5.join("\n");
  ok("the overview tags an unreadable lockedOn honestly — never the old 'Rnull → null' fake schedule",
    !/Rnull/.test(text5) && !/→ null/.test(text5) && /Re-Jirah band/.test(text5));

  // ── ORPHAN-FIELD GUARD (10 Aug 2026) ──────────────────────────────────────
  // Until today `traps` · `bridges` · `threeWays` · `interviewLines` ·
  // `calibration` · `buildHook` · `why` were in every capsule and rendered by
  // nothing here — ~38k characters of his sacred prose reachable only by opening
  // a JSON file. These checks fail the moment any of them goes dark again.
  const full = { ...cap, why: "WHYMARK", stream: "foundations", dot: "magenta", source: "SRC", viz: "",
    traps: [{ bait: "BAITMARK", wrong: "WRONGMARK", truth: "TRUTHMARK" }],
    bridges: [{ to: "x", conn: "CONNMARK", q: "BRIDGEQMARK", a: "BRIDGEAMARK" }],
    threeWays: { ceo: "CEOMARK", junior: "JUNIORMARK", skeptic: "SKEPTICMARK" },
    interviewLines: ["LINEMARK"], calibration: "CALIBMARK", buildHook: "BUILDMARK",
    doubts: [{ q: "DQMARK", a: "DAMARK" }], bolo: "BOLOMARK", bolo_by: "—N" };
  const grab = (fn) => { const o = []; console.log = (...a) => o.push(a.join(" ")); try { fn(); } finally { console.log = realLog; } return o.join("\n"); };

  // Every SECTIONS command must actually print its field VERBATIM. Driven off the
  // table, so a section added later is covered by this assertion for free.
  const marks = { doubts: "DAMARK", traps: "TRUTHMARK", bridges: "BRIDGEAMARK", threeways: "SKEPTICMARK", lines: "LINEMARK", calibration: "CALIBMARK", build: "BUILDMARK" };
  const dark = SECTIONS.filter((s) => !new RegExp(marks[s.cmd]).test(grab(() => s.render(full, [full]))));
  ok(`every capsule-level layer renders verbatim (${SECTIONS.map((s) => s.cmd).join(", ")})`,
    dark.length === 0 && Object.keys(marks).length === SECTIONS.length);
  if (dark.length) realLog(`      dark sections: ${dark.map((s) => s.cmd).join(", ")}`);

  const spineOut = grab(() => capsuleSpine(full, iv, now));
  ok("`why` reaches the spine (it rendered nowhere in this file before 10 Aug 2026)", /WHYMARK/.test(spineOut));
  ok("the spine INDEXES every section with its live count + the exact command",
    SECTIONS.every((s) => new RegExp(`deep\\.mjs x ${s.cmd}\\b`).test(spineOut)));
  ok("COMPLETENESS: a capsule whose every field has a home reports 0 skipped",
    /0 skipped/.test(spineOut) && !/KOI RENDER NAHI/.test(spineOut));
  ok("COMPLETENESS: an UNRENDERED field is NAMED out loud, never silently dropped",
    /KOI RENDER NAHI: heroViz/.test(grab(() => capsuleSpine({ ...full, heroViz: "H" }, iv, now))));
  ok("threeWays is walked by Object.keys — a voice the code never heard of still prints",
    /FOURTHMARK/.test(grab(() => sectionThreeWays({ ...full, threeWays: { ...full.threeWays, cfo: "FOURTHMARK" } }))));
  ok("a bridge only advertises `deep.mjs <to>` when that capsule is really in the mirror",
    /deep\.mjs x\b/.test(grab(() => sectionBridges(full, [full]))) && !/deep\.mjs x\b/.test(grab(() => sectionBridges(full, []))));
  ok("an EMPTY layer says so instead of printing a blank screen",
    /koi trap likha hi nahi/.test(grab(() => sectionTraps({ ...full, traps: [] }))));

  console.log(`\n${fail === 0 ? "ALL CHECKS PASSED" : "FAILURES: " + fail} (${pass} passed, ${fail} failed)`);
  return fail === 0;
}

// ---------------------------------------------------------------------------
function main() {
  const [arg1, arg2] = process.argv.slice(2);
  const mode = String(arg1 || "").toLowerCase();
  if (mode === "selftest") process.exit(selftest() ? 0 : 1);

  const profile = readJson(PROFILE) || {};
  const intervals = Array.isArray(profile.rejirah_intervals_days) && profile.rejirah_intervals_days.length
    ? profile.rejirah_intervals_days : [3, 14, 42];
  const caps = loadCapsules();
  printLoadFailures();   // named BEFORE any count — see LOAD FAILURES above
  const now = new Date();

  if (!mode) return overview(caps, intervals, now);
  if (mode === "due") return due(caps, intervals, now);

  const c = caps.find((x) => String(x.id).toLowerCase() === mode);
  if (!c) {
    console.log(`\ndeep: "${arg1}" naam ka koi locked capsule nahi hai.`);
    console.log(`  maujood: ${caps.map((x) => x.id).join(", ") || "(koi nahi)"}\n`);
    return;                                        // exit 0 — not-found is not a crash
  }
  const sub = String(arg2 || "").toLowerCase();
  if (!sub) return capsuleSpine(c, intervals, now);
  // ONE dispatch off the SECTIONS table (10 Aug 2026) — `doubts` used to be a
  // hand-written special case, which is exactly why the six layers next to it
  // never got one. No axis letter collides: axes are a-i, commands are words.
  const section = SECTIONS.find((s) => s.cmd === sub || (s.alias || []).includes(sub));
  if (section) return section.render(c, caps);
  // B6 (9 Aug 2026): the header always promised "asks you to confirm the wall" and
  // this line never asked — it dumped every axis on a fat-fingered `all`. --yes IS
  // the confirmation (deterministic, works headless and TTY alike).
  if (sub === "all") {
    if (!process.argv.includes("--yes")) {
      console.log(`\ndeep: "${c.id} all" poori wall kholta hai — ${(c.faultLines || []).length} axes ek saath. Pakka? To:\n  node scripts/deep.mjs ${c.id} all --yes\n`);
      return;
    }
    for (const a of c.faultLines || []) oneAxis(c, String(a.axis).toLowerCase());
    return;
  }
  if (AXES.includes(sub)) return oneAxis(c, sub);
  console.log(`\ndeep: "${arg2}" samajh nahi aaya. axis a-i, "all", ya: ${SECTIONS.map((s) => s.cmd).join(" · ")}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { loadCapsules, printLoadFailures, due, oneAxis, capsuleSpine, selftest };
