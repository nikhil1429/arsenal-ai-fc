#!/usr/bin/env node
// ============================================================================
// tone.mjs · ARSENAL AI FC — NEUROMODULATION (one scalar, whole-brain effect)
// ----------------------------------------------------------------------------
// WHAT:  The organism's arousal knob (CYBORG_BRAIN.md §8): ONE scalar
//        `arousal ∈ {conserve, nominal, open}` derived ONLY from the already-
//        computed Governor verdict — NEVER from biometrics directly (the
//        medical clamp: raw physiology cannot drive behavior; the Goalkeeper's
//        clamped verdict is the only legal source, and even that only WEIGHTS).
//        Every organ reads tone.json as a multiplier:
//          RED    → conserve: reflex dampened (shorter turns, slower frames),
//                   the DMN is MUTED (a depleted captain rests — no dreaming),
//                   the thalamus wake bar RISES (protect the window).
//          AMBER  → nominal.
//          GREEN  → open: the inverse — fuller frames, dreaming allowed.
//        STALE-SAFE: a Governor older than 36h → nominal, and an UNREADABLE
//        verdict → conserve. The failure direction is always toward rest.
// LAWS:  sole writer of tone.json. This file never reads Oura data — only
//        readiness.json's verdict field. One knob, no second opinion.
// MODES: node scripts/tone.mjs          → derive + write tone.json
//        node scripts/tone.mjs status · selftest
// ============================================================================

import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const TONE      = join(STATE_DIR, "tone.json");

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

// the effects every organ reads — ONE table, so the whole brain moves together
const EFFECTS = {
  conserve: { tau1_bump: 0.10, frame_ms_mult: 2.0, dmn_allowed: false, reflex_note: "the body verdict is RED — conserve: shorter turns, gentler pace, rest is the agenda" },
  nominal:  { tau1_bump: 0.00, frame_ms_mult: 1.0, dmn_allowed: true,  reflex_note: "" },
  open:     { tau1_bump: -0.03, frame_ms_mult: 0.75, dmn_allowed: true, reflex_note: "" },
};

function deriveArousal(readiness, now = new Date()) {
  if (!readiness || !readiness.verdict) return { arousal: "conserve", why: "no readable Governor — fail toward rest" };
  const age = readiness.generated_at ? (now - new Date(readiness.generated_at)) / 3600000 : (readiness.day ? (now - new Date(readiness.day + "T06:00:00")) / 3600000 : null);
  if (age !== null && age > 36) return { arousal: "nominal", why: `Governor stale (${Math.round(age)}h) — nominal, never open on old data` };
  const v = String(readiness.verdict).toUpperCase();
  if (v === "RED") return { arousal: "conserve", why: "Governor RED — the only agenda is rest" };
  if (v === "AMBER") return { arousal: "nominal", why: "Governor AMBER" };
  if (v === "GREEN") return { arousal: "open", why: "Governor GREEN — the grind is honored" };
  return { arousal: "conserve", why: `unknown verdict "${v}" — fail toward rest` };
}

function writeTone(deps = {}) {
  const readiness = deps.readiness !== undefined ? deps.readiness : readJson(join(STATE_DIR, "readiness.json"));
  const now = deps.now || new Date();
  const { arousal, why } = deriveArousal(readiness, now);
  const out = { arousal, why, effects: EFFECTS[arousal], from_verdict: (readiness && readiness.verdict) || null, ts: now.toISOString() };
  (deps.write || ((o) => writeAtomic(TONE, o)))(out);
  return out;
}
// every consumer calls this — stale tone (>26h) degrades to nominal by itself
function currentTone(deps = {}) {
  const t = (deps.read || (() => readJson(TONE)))();
  const now = deps.now || new Date();
  if (!t || !t.arousal || !EFFECTS[t.arousal]) return { arousal: "nominal", effects: EFFECTS.nominal, stale: true };
  if (t.ts && (now - new Date(t.ts)) > 26 * 3600000) return { arousal: "nominal", effects: EFFECTS.nominal, stale: true };
  return { ...t, stale: false };
}

async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const now = new Date("2026-07-14T10:00:00");

  assert("RED → conserve (rest is the agenda)", deriveArousal({ verdict: "RED", generated_at: now.toISOString() }, now).arousal === "conserve");
  assert("AMBER → nominal · GREEN → open", deriveArousal({ verdict: "AMBER", generated_at: now.toISOString() }, now).arousal === "nominal" && deriveArousal({ verdict: "GREEN", generated_at: now.toISOString() }, now).arousal === "open");
  assert("stale Governor (>36h) → NOMINAL, never open on old data", deriveArousal({ verdict: "GREEN", generated_at: new Date(now - 40 * 3600000).toISOString() }, now).arousal === "nominal");
  assert("no Governor at all → CONSERVE (fail toward rest)", deriveArousal(null, now).arousal === "conserve");
  assert("garbage verdict → CONSERVE (fail toward rest)", deriveArousal({ verdict: "PURPLE", generated_at: now.toISOString() }, now).arousal === "conserve");

  assert("conserve: wake bar UP, frames SLOWER, DMN MUTED", EFFECTS.conserve.tau1_bump > 0 && EFFECTS.conserve.frame_ms_mult > 1 && EFFECTS.conserve.dmn_allowed === false);
  assert("open: the inverse — bar down a touch, frames fuller, dreaming allowed", EFFECTS.open.tau1_bump < 0 && EFFECTS.open.frame_ms_mult < 1 && EFFECTS.open.dmn_allowed === true);

  let written = null;
  const t = writeTone({ readiness: { verdict: "GREEN", generated_at: now.toISOString() }, now, write: (o) => { written = o; } });
  assert("tone.json carries arousal + effects + provenance verdict + ts", written.arousal === "open" && written.effects.dmn_allowed === true && written.from_verdict === "GREEN" && written.ts);

  assert("consumers: fresh tone reads through", currentTone({ read: () => written, now }).arousal === "open");
  assert("consumers: stale tone (>26h) self-degrades to nominal", currentTone({ read: () => written, now: new Date(now.getTime() + 27 * 3600000) }).stale === true);
  assert("consumers: missing tone → nominal, never crashes", currentTone({ read: () => null }).arousal === "nominal");

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "status") {
    const t = currentTone();
    console.log(`tone: ${t.arousal}${t.stale ? " (stale-degraded)" : ""} — τ1 ${t.effects.tau1_bump >= 0 ? "+" : ""}${t.effects.tau1_bump} · frames ×${t.effects.frame_ms_mult} · DMN ${t.effects.dmn_allowed ? "allowed" : "MUTED"}`);
    return;
  }
  const t = writeTone();
  console.log(`tone: ${t.arousal} (${t.why})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { deriveArousal, writeTone, currentTone, EFFECTS };
