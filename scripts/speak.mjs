#!/usr/bin/env node
// ============================================================================
// speak.mjs · ARSENAL AI FC — THE ORGANISM: THE VOICE (output half)
// ----------------------------------------------------------------------------
// WHAT:  The organism's mouth, upgraded to a real voice. Primary engine:
//        Microsoft Edge neural TTS (msedge-tts — free, no key, no billing
//        possible; "JARVIS-adjacent"). Fallback: Windows System.Speech
//        (offline, robotic, always works).
// WHO ACTUALLY CALLS IT (audited 4 Aug 2026; line-numbers dropped 9 Aug — they rot,
// the CALLER NAMES are the truth, grep them):
//        say()          ← talk.mjs:128/:141/:146 (TALK MODE) · dugout.mjs:241
//                         (fireReminders) · turnstile.mjs:176/:181 (the live
//                         capture daemon) · .claude/skills/talk/SKILL.md:11
//                         (Claude shells this file directly). All human- or
//                         daemon-triggered; NO scheduled task speaks out loud.
//        synthToFile()  ← brain.mjs:1320 (team-talk mp3s) · dugout.mjs:261 (ACK
//                         fillers). This half runs nightly and its output is
//                         real: club/media/*.mp3, embedded on the wall.
// NOT A LANE — setup/SPEAK.ps1 is an ORPHANED PRE-NEURAL DUPLICATE (audit #55).
//        This header used to advertise it as the organism's scheduled way of
//        speaking. It is not one: there is no ArsenalFC-Speak installed, it
//        never touches this file (it calls System.Speech directly, so it would
//        bypass en-US-ChristopherNeural entirely), and it reads team_sheet.md —
//        which today still opens "I don't know you yet". Installing it as-is
//        would robot-voice that sentence at him every morning. It is kept, not
//        deleted (layering law), as the pre-neural ancestor of say(); it is
//        documented as opt-in in setup/VOICE_SETUP.md:51 and stays uninstalled.
//        To revive that lane it must first be rewritten to shell
//        `node scripts/speak.mjs "<line>"` — .ps1 files are not this file's to edit.
// LAWS:  Speaks ONLY what it is handed — no generation here. Text is
//        sanitized for the ear (markdown/emoji stripped). Bias-to-silence: no
//        scheduled job may make this machine talk out loud unasked.
// MODES: node scripts/speak.mjs "text to say" [--robot] · selftest
//        node scripts/speak.mjs "text" --to-file <path.mp3>   (no playback —
//        the MEDIA ENGINE lane: team talks, ACK fillers)
// ============================================================================

import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import os from "node:os";

const VOICE = "en-US-ChristopherNeural";   // warm, low, coach-register

// make text listenable: strip markdown, emoji, badges, urls
function earClean(text) {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, " code block omitted ")
    .replace(/[#*_`>|]/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]|⚪|🔴/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

async function sayNeural(text) {
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const tmp = join(os.tmpdir(), `arsenal-say-${Date.now()}`);
  mkdirSync(tmp, { recursive: true });                 // toFile writes audio.mp3 INSIDE this dir
  const { audioFilePath } = await tts.toFile(tmp, text);
  // play the mp3 headlessly via WPF MediaPlayer, wait for natural end
  const ps = `Add-Type -AssemblyName PresentationCore; $p = New-Object System.Windows.Media.MediaPlayer; ` +
    `$p.Open([Uri]'${audioFilePath.replace(/'/g, "''")}'); $p.Play(); ` +
    `while (-not $p.NaturalDuration.HasTimeSpan) { Start-Sleep -Milliseconds 100 }; ` +
    `Start-Sleep -Milliseconds ([int]$p.NaturalDuration.TimeSpan.TotalMilliseconds + 300); $p.Close()`;
  execFileSync("powershell", ["-NoProfile", "-Command", ps], { windowsHide: true, timeout: 120000 });
  try { rmSync(tmp, { recursive: true, force: true }); } catch { }
}

function sayRobot(text) {
  const ps = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; ` +
    `$s.Rate = 0; $s.Speak('${text.replace(/'/g, "''")}'); $s.Dispose()`;
  execFileSync("powershell", ["-NoProfile", "-Command", ps], { windowsHide: true, timeout: 120000 });
}

// public: synthesize to an mp3 file (no playback) — the MEDIA ENGINE's lane
// (team talks, ACK fillers). Neural only; returns {wrote:false} offline.
async function synthToFile(text, outPath) {
  const clean = earClean(text);
  if (!clean) return { wrote: false, error: "empty text" };
  try {
    const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
    const tts = new MsEdgeTTS();
    await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const tmp = join(os.tmpdir(), `arsenal-say-${Date.now()}-${Math.floor(Math.random() * 1e6)}`);
    mkdirSync(tmp, { recursive: true });
    const { audioFilePath } = await tts.toFile(tmp, clean);
    mkdirSync(dirname(outPath), { recursive: true });
    copyFileSync(audioFilePath, outPath);
    try { rmSync(tmp, { recursive: true, force: true }); } catch { }
    return { wrote: true, path: outPath };
  } catch (e) { return { wrote: false, error: String(e.message).slice(0, 120) }; }
}

// public: speak text; neural first, robot fallback; never throws.
async function say(text, { forceRobot = false } = {}) {
  const clean = earClean(text);
  if (!clean) return { spoke: false, engine: null };
  if (!forceRobot) {
    try { await sayNeural(clean); return { spoke: true, engine: "neural" }; }
    catch { /* fall through to robot */ }
  }
  try { sayRobot(clean); return { spoke: true, engine: "robot" }; }
  catch { return { spoke: false, engine: null }; }
}

// ---------------------------------------------------------------------------
// selftest — text hygiene + engine logic only; no audio in selftests
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  assert("earClean strips markdown + emoji + badge", earClean("**Captain.** ⚪🔴 `one` [link](http://x.y) idea 🏆") === "Captain. one link idea");
  assert("earClean drops code blocks", earClean("say\n```js\nlet x=1\n```\ndone").includes("code block omitted"));
  assert("earClean caps length for the ear", earClean("a ".repeat(2000)).length <= 1200);
  assert("empty text → silent, no crash", (await say("", {})).spoke === false);
  assert("neural voice configured (coach register)", VOICE.includes("Neural"));
  assert("synthToFile lane exists (media engine's mouth)", typeof synthToFile === "function");
  assert("synthToFile refuses empty text without touching disk", (await synthToFile("  ", "X:/nope.mp3")).wrote === false);

  // #55 — DOC-DRIFT REGRESSION NET. The defect this suite missed for a month was
  // not in the code: the header advertised a "scheduled-utterance lane" that has
  // no installed task and does not use this engine. A header that describes a
  // capability the machine does not have is the same class of lie as a status
  // field that says "ok" over a bleed — so it gets an assertion like any other.
  const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
  const header = src.slice(0, src.indexOf("import "));
  assert("#55 header no longer claims SPEAK.ps1 is a scheduled-utterance lane", !/scheduled-utterance lane/.test(header));
  assert("#55 header names SPEAK.ps1 as the orphaned pre-neural duplicate it is",
    /SPEAK\.ps1/.test(header) && /ORPHANED PRE-NEURAL DUPLICATE/i.test(header));
  assert("#55 header's caller list names the three real say() callers", ["talk.mjs", "dugout.mjs", "turnstile.mjs"].every(c => header.includes(c)));

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const arg = process.argv[2];
  if ((arg || "").toLowerCase() === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  if (!arg) { console.log('usage: node scripts/speak.mjs "text" [--robot] [--to-file <path>] | selftest'); process.exit(1); }
  const tf = process.argv.indexOf("--to-file");
  if (tf >= 0) {
    const out = process.argv[tf + 1];
    if (!out) { console.log("speak: --to-file needs a path"); process.exit(1); }
    const r = await synthToFile(arg, out);
    console.log(r.wrote ? `speak: wrote ${r.path}` : `speak: could not write (${r.error})`);
    process.exit(r.wrote ? 0 : 1);
  }
  const r = await say(arg, { forceRobot: process.argv.includes("--robot") });
  console.log(`speak: ${r.spoke ? "spoke (" + r.engine + ")" : "silent"}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { say, earClean, synthToFile };
