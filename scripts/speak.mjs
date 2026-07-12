#!/usr/bin/env node
// ============================================================================
// speak.mjs · ARSENAL AI FC — THE ORGANISM: THE VOICE (output half)
// ----------------------------------------------------------------------------
// WHAT:  The organism's mouth, upgraded to a real voice. Primary engine:
//        Microsoft Edge neural TTS (msedge-tts — free, no key, no billing
//        possible; "JARVIS-adjacent"). Fallback: Windows System.Speech
//        (offline, robotic, always works). Consumed by talk.mjs and the
//        /talk skill; SPEAK.ps1 stays the scheduled-utterance lane.
// LAWS:  Speaks ONLY what it is handed — no generation here. Text is
//        sanitized for the ear (markdown/emoji stripped). Never called on a
//        schedule except the two sanctioned utterances.
// MODES: node scripts/speak.mjs "text to say" [--robot] · selftest
//        node scripts/speak.mjs "text" --to-file <path.mp3>   (no playback —
//        the MEDIA ENGINE lane: team talks, ACK fillers)
// ============================================================================

import { writeFileSync, existsSync, unlinkSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
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
