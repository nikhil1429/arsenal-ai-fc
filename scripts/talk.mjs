#!/usr/bin/env node
// ============================================================================
// talk.mjs · ARSENAL AI FC — THE ORGANISM: TALK MODE (Rung 2 + the button's core)
// ----------------------------------------------------------------------------
// WHAT:  Real to-and-fro conversation WITH the organism — the voice on the
//        other end reads the LIVE bus and speaks with the captain's measured
//        cognitive fingerprint. Voice in: Win+H (Windows dictation types into
//        this REPL — tap it once, talk, Enter). Voice out: neural TTS
//        (speak.mjs). The conversation partner IS the body: today's sheet,
//        drills, vitals, twin, tape room — all live at every turn.
// WHY:   For a high-dopamine ADHD-PI brain, a coach you can literally talk
//        to — hands-free in, spoken out, zero warm-up because it is already
//        briefed — is the membrane at its thinnest.
// LAWS:  Spoken register ≤3 sentences per turn (enforced in prompt AND
//        clipped in code). Honest frame; no hype; no countdowns; cracks are
//        data. Usage logs through brain.mjs's ledger writer (one window
//        accounting). Exchanges transcript → brain_out/talk/<date>.md.
// MODES: node scripts/talk.mjs [--robot] [--opus] · selftest
//        In the loop:  just talk (Win+H) · "bye" ends · "sheet" reads the sheet
// ============================================================================

import { readFileSync, existsSync, appendFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { say } from "./speak.mjs";
import { buildFingerprint } from "./brain.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const LEDGER    = join(STATE_DIR, "brain_ledger.jsonl");
const OUT_DIR   = join(STATE_DIR, "brain_out", "talk");

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const clip = (s, n) => { const t = typeof s === "string" ? s : JSON.stringify(s); return t && t.length > n ? t.slice(0, n) + "…" : (t || ""); };

// live bus snapshot, compact — refreshed EVERY turn (the coupling is the point)
function busSnapshot() {
  const sheetP = join(STATE_DIR, "team_sheet.md");
  return [
    existsSync(sheetP) ? "TODAY'S SHEET:\n" + readFileSync(sheetP, "utf8").split("\n").slice(0, 14).join("\n") : "no sheet yet",
    "DRILLS: " + clip(readJson(join(STATE_DIR, "drills.json")), 800),
    "VITALS: " + clip(readJson(join(STATE_DIR, "loop_vitals.json")), 400),
    "TWIN: " + clip(readJson(join(STATE_DIR, "twin.json")), 300),
    "SCOUT: " + clip(readJson(join(STATE_DIR, "scout.json")), 300),
    "TAPE ROOM: queue " + ((readJson(join(STATE_DIR, "tape_room.json")) || {}).queue || []).length + ", retired " + ((readJson(join(STATE_DIR, "tape_room.json")) || {}).doubts_retired || 0),
  ].join("\n\n");
}

function buildTurnPrompt(fingerprint, bus, history, userLine) {
  return `You are THE GAFFER in TALK MODE — a live spoken conversation with your captain, inside the organism (the state below is real and current). Speak like a coach at the touchline: warm, direct, Hinglish welds welcome.

HARD RULES: maximum THREE short sentences (this is voice — long answers die in the air). One idea per turn. Honest frame only — never "10x/exponential", never calendar pressure, never shame; cracks are data. Numbers only from the state below. If he Bolos a concept, probe exactly ONE crack. If he voices a doubt worth keeping, end with: "throw that in — ntfy, ten seconds."

${fingerprint}

=== LIVE BODY (refreshed this turn) ===
${bus}

=== CONVERSATION SO FAR ===
${history.map(h => `${h.who}: ${h.text}`).join("\n") || "(just started)"}

CAPTAIN (spoken): ${userLine}

Reply with ONLY your spoken words — no markdown, no lists, ≤3 sentences.`;
}

function callClaude(prompt, model, timeoutMs = 120000) {
  const t0 = Date.now();
  try {
    const stdout = execFileSync("claude", ["-p", "--output-format", "json", "--model", model], { input: prompt, timeout: timeoutMs, encoding: "utf8", windowsHide: true });
    let text = stdout, inTok = null, outTok = null;
    try { const j = JSON.parse(stdout); text = j.result !== undefined ? String(j.result) : stdout; if (j.usage) { inTok = j.usage.input_tokens ?? null; outTok = j.usage.output_tokens ?? null; } } catch { }
    return { ok: true, text: text.trim(), total_tokens: (inTok || 0) + (outTok || 0) || Math.ceil((prompt.length + text.length) / 4), duration_ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, text: null, total_tokens: 0, duration_ms: Date.now() - t0, error: String(e.message).slice(0, 150) };
  }
}

// spoken-register clamp in CODE, not just prompt: first 3 sentences only.
function clampSpoken(text) {
  const sents = String(text || "").replace(/\n+/g, " ").match(/[^.!?]+[.!?]+/g) || [String(text || "")];
  return sents.slice(0, 3).map(s => s.trim()).join(" ").trim().slice(0, 500);
}

// ---------------------------------------------------------------------------
// selftest — prompt assembly + clamps; no LLM, no audio
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const fp = buildFingerprint({ lexicon: { anchors: [{ phrase: "warehouse wala naksha" }] } });
  const p = buildTurnPrompt(fp, "TODAY'S SHEET:\nx", [{ who: "CAPTAIN", text: "embeddings samjha" }], "kya haal");
  assert("turn prompt carries the fingerprint", p.includes("warehouse wala naksha"));
  assert("turn prompt carries live bus + history + spoken law", p.includes("LIVE BODY") && p.includes("embeddings samjha") && p.includes("THREE short sentences"));
  assert("no-hype law travels", p.includes('never "10x/exponential"'));
  assert("clamp: 3 sentences max, hard", clampSpoken("One. Two! Three? Four. Five.") === "One. Two! Three?");
  assert("clamp survives unpunctuated rambles", clampSpoken("just words no periods at all").length > 0);
  assert("bus snapshot never crashes on bloodless state", typeof busSnapshot() === "string");
  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main — the loop
// ---------------------------------------------------------------------------
async function main() {
  if ((process.argv[2] || "").toLowerCase() === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  if (process.env.ANTHROPIC_API_KEY) { console.log("talk: REFUSING — ANTHROPIC_API_KEY set (subscription only, ever)."); process.exit(1); }
  const robot = process.argv.includes("--robot");
  const model = process.argv.includes("--opus") ? "opus" : "sonnet";
  const readline = await import("node:readline/promises");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const fingerprint = buildFingerprint({
    lexicon: readJson(join(STATE_DIR, "lexicon.json")),
    grammar: readJson(join(STATE_DIR, "doubt_grammar.json")),
    calibration: readJson(join(STATE_DIR, "calibration.json")),
    ls: readJson(join(STATE_DIR, "learning_state.json")),
  });
  const history = [];
  const today = localDate(new Date());
  mkdirSync(OUT_DIR, { recursive: true });
  console.log("⚪🔴 TALK MODE — Win+H to dictate, Enter to send. Say 'bye' to end.\n");
  const opener = "Captain. I'm here, fully briefed. Bol.";
  console.log("GAFFER: " + opener);
  await say(opener, { forceRobot: robot });

  for (;;) {
    const line = (await rl.question("\n🎙  > ")).trim();
    if (!line) continue;
    if (/^(bye|band|exit|quit|full time)$/i.test(line)) break;
    const prompt = buildTurnPrompt(fingerprint, busSnapshot(), history.slice(-8), line);
    const r = callClaude(prompt, model);
    const reply = r.ok ? clampSpoken(r.text) : "Line dropped — say that again, captain.";
    console.log("GAFFER: " + reply);
    history.push({ who: "CAPTAIN", text: line }, { who: "GAFFER", text: reply });
    appendFileSync(join(OUT_DIR, today + ".md"), `CAPTAIN: ${line}\nGAFFER: ${reply}\n\n`);
    appendFileSync(LEDGER, JSON.stringify({ ts: new Date().toISOString(), job: "talk", engine: "claude", model, input_tokens: null, output_tokens: null, total_tokens: r.total_tokens, duration_ms: r.duration_ms, ok: r.ok, error: r.error || null, limit_hit: false }) + "\n");
    await say(reply, { forceRobot: robot });
  }
  rl.close();
  const bye = "Good session. Full-time ka time ho toh: npm run postmatch.";
  console.log("GAFFER: " + bye);
  await say(bye, { forceRobot: robot });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { buildTurnPrompt, clampSpoken, busSnapshot };
