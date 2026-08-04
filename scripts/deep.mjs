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
//
// SOURCE: dressing-room/state/capsules/*.json — the LOCAL MIRROR that mirror.mjs
//         pulls from the gist every morning at 06:55. The gist stays canonical;
//         this reads the mirror so a session never needs the network.
//
// MODES: node scripts/deep.mjs                       · what exists, what is due
//        node scripts/deep.mjs due                   · Re-Jirah queue, questions only (COLD)
//        node scripts/deep.mjs <concept>             · the capsule's spine + axis list
//        node scripts/deep.mjs <concept> <axis>      · ONE axis, fully opened
//        node scripts/deep.mjs <concept> all         · every axis (asks you to confirm the wall)
//        node scripts/deep.mjs <concept> doubts      · his 112-doubt bank for that concept
//        node scripts/deep.mjs selftest
// ============================================================================

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CAPSULES  = join(STATE_DIR, "capsules");
const PROFILE   = join(STATE_DIR, "forge_profile.json");

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const AXES = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];

// ---------------------------------------------------------------------------
// load
// ---------------------------------------------------------------------------
function loadCapsules(dir = CAPSULES) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson(join(dir, f)))
    .filter((c) => c && c.id)
    .sort((a, b) => String(a.num || "").localeCompare(String(b.num || "")));
}

// Re-Jirah is date-driven off `lockedOn` + the profile's intervals, and rounds
// already done are listed in `reJirahDone`. This mirrors capsule_bridge.mjs's
// reading — it does NOT invent a second scheduler.
export function rejirahStatus(capsule, intervals, now = new Date()) {
  const locked = new Date(capsule.lockedOn + "T00:00:00Z");
  if (Number.isNaN(locked.getTime())) return { round: null, status: "unknown", overdueDays: null, nextDue: null };
  const done = Array.isArray(capsule.reJirahDone) ? capsule.reJirahDone.length : 0;
  if (done >= intervals.length) return { round: done, status: "complete", overdueDays: 0, nextDue: null };
  const nextDue = new Date(locked.getTime() + intervals[done] * 86400000);
  const overdueDays = Math.floor((now.getTime() - nextDue.getTime()) / 86400000);
  const status = overdueDays > 0 ? "overdue" : overdueDays === 0 ? "due" : "up";
  return { round: done + 1, status, overdueDays: Math.max(0, overdueDays), nextDue: nextDue.toISOString().slice(0, 10) };
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
      : `R${r.round} → ${r.nextDue}`;
    console.log(`  ${String(c.num || "??").padEnd(3)} ${String(c.id).padEnd(14)} ${String(c.status || "?").padEnd(10)} ${fl.length} axes · ${(c.doubts || []).length} doubts · ${tag}`);
  }
  console.log(`\n  ${deepChars.toLocaleString()} characters of DEEP across ${deepAxes}/${totalAxes} axes — tumhare apne shabd.`);
  console.log("\n  node scripts/deep.mjs due                → Re-Jirah queue (sirf sawaal, COLD)");
  console.log("  node scripts/deep.mjs <concept>          → us capsule ki spine");
  console.log("  node scripts/deep.mjs <concept> <axis>   → ek axis, poora khula\n");
}

// ALWAYS-COLD: questions only. The weld is one deliberate command away.
function due(caps, intervals, now) {
  const rows = caps.map((c) => ({ c, r: rejirahStatus(c, intervals, now) }))
    .filter(({ r }) => r.status === "overdue" || r.status === "due")
    .sort((a, b) => b.r.overdueDays - a.r.overdueDays);

  if (!rows.length) { console.log("\nRe-Jirah: abhi kuch due nahi hai.\n"); return; }

  console.log(`\n== RE-JIRAH DUE (${rows.length}) — COLD. Notes band. ==`);
  console.log("   Pehle khud jawab do. Weld dekhne ke liye: deep.mjs <concept> <axis>\n");
  for (const { c, r } of rows) {
    // OVERDUE = RIPE. Only severe overdue gets called out; a little overdue is a
    // high-value recall opportunity, not a failure to scold him with.
    const ripe = r.overdueDays > 30 ? "  ← bahut overdue, isi se shuru karo" : "";
    console.log(`\n${"═".repeat(70)}`);
    console.log(`${c.title || c.id}  ·  round R${r.round}  ·  ${r.overdueDays}d overdue${ripe}`);
    console.log(`${"═".repeat(70)}`);
    for (const a of c.faultLines || []) {
      const strike = (a.strike || "").trim();
      console.log(`\n  ${a.axis})  ${strike || "(is axis pe koi strike-sawaal nahi likha)"}`);
    }
    console.log(`\n  → jawab dene ke baad: node scripts/deep.mjs ${c.id} <axis>`);
  }
  console.log("");
}

function capsuleSpine(c, intervals, now) {
  const r = rejirahStatus(c, intervals, now);
  console.log(`\n${"═".repeat(70)}`);
  console.log(`${c.num ? c.num + " · " : ""}${c.title || c.id}   [${c.status || "?"}]`);
  console.log(`locked ${c.lockedOn}  ·  Re-Jirah R${r.round || "-"} ${r.status}${r.overdueDays ? ` (${r.overdueDays}d)` : ""}`);
  console.log(`${"═".repeat(70)}`);
  field("HOOK", c.hook);
  field("MECHANISM", c.mechanism);
  field("DEEP (capsule-level)", c.deep);
  rule("AXES");
  for (const a of c.faultLines || []) {
    const has = (a.deep || "").trim() ? `${a.deep.length} chars` : "NO DEEP";
    console.log(`  ${a.axis})  ${String(a.title || "").padEnd(38)} ${String(a.status || "?").padEnd(8)} ${has}`);
  }
  if (c.bolo && String(c.bolo).trim()) { rule("BOLO — tumhare apne shabd"); console.log("  " + String(c.bolo).trim().split("\n").join("\n  ")); if (c.bolo_by) console.log(`\n  ${c.bolo_by}`); }
  console.log(`\n  ek axis kholne ke liye: node scripts/deep.mjs ${c.id} a`);
  console.log(`  doubts dekhne ke liye:  node scripts/deep.mjs ${c.id} doubts\n`);
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
  ok("all rounds done → 'complete', never a phantom overdue",
    rejirahStatus({ ...cap, reJirahDone: ["a", "b", "c"] }, iv, now).status === "complete");
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
  if (sub === "doubts") return doubts(c);
  if (sub === "all") { for (const a of c.faultLines || []) oneAxis(c, String(a.axis).toLowerCase()); return; }
  if (AXES.includes(sub)) return oneAxis(c, sub);
  console.log(`\ndeep: "${arg2}" samajh nahi aaya. axis a-i, ya "doubts", ya "all".\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { loadCapsules, due, oneAxis, capsuleSpine, selftest };
