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
//        STALE-SAFE: age may only ever DEGRADE a verdict, never lift one — a
//        Governor older than 36h (or one whose stamp won't parse) drops GREEN to
//        nominal, but a stale RED stays conserve, and an UNREADABLE verdict is
//        conserve at any age. The failure direction is always toward rest.
// LAWS:  sole writer of tone.json. This file never reads Oura data — only
//        readiness.json's verdict field. One knob, no second opinion.
// MODES: node scripts/tone.mjs          → derive + write tone.json
//        node scripts/tone.mjs status · selftest
// ============================================================================

import { readFileSync, existsSync, mkdirSync, writeFileSync, appendFileSync, renameSync, rmSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const TONE      = join(STATE_DIR, "tone.json");

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
// AUDIT (30 Jul 2026): the temp name was the FIXED `path + ".tmp"` and the rename had
// no retry, so on Windows a transient lock on tone.json (indexer, AV scan, a reader
// mid-read) threw EPERM and killed the whole run — ArsenalFC-Tone exited 1, tone.json
// was never written for that hour, and nothing logged why. Reproduced at 39/40 failures
// under contention in a sandbox. Now: per-process temp (two writers can't collide) and
// a short backoff, because these locks clear in milliseconds. The final failure still
// throws — a write that genuinely cannot land must not be swallowed.
function writeAtomic(path, obj, attempts = 5) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  for (let i = 0; ; i++) {
    try { renameSync(tmp, path); return; }
    catch (e) {
      const transient = e && (e.code === "EPERM" || e.code === "EBUSY" || e.code === "EACCES");
      if (!transient || i >= attempts - 1) {
        try { if (existsSync(tmp)) rmSync(tmp, { force: true }); } catch {}
        // THE OTHER HALF OF THE ROOT CAUSE (audit 30 Jul 2026): the retry stopped the crash
        // but "nothing logged why" was still true — ArsenalFC-Tone's schtasks command has no
        // redirect, so stderr goes nowhere and a genuine failure is invisible forever. Every
        // other organ here keeps a sibling .log; tone now does too. Best-effort, then rethrow.
        try {
          appendFileSync(join(__dirname, "tone.log"),
            `${new Date().toISOString()} writeAtomic FAILED after ${attempts} attempt(s) on ${path}: ${e?.code || ""} ${e?.message || String(e)}\n`, "utf8");
        } catch { /* a log that cannot be written must not become the failure */ }
        throw e;
      }
      // busy-wait a few ms — Atomics.wait is the only sync sleep available here
      const sab = new Int32Array(new SharedArrayBuffer(4));
      Atomics.wait(sab, 0, 0, 20 * (i + 1));
    }
  }
}

// the effects every organ reads — ONE table, so the whole brain moves together
const EFFECTS = {
  conserve: { tau1_bump: 0.10, frame_ms_mult: 2.0, dmn_allowed: false, reflex_note: "the body verdict is RED — conserve: shorter turns, gentler pace, rest is the agenda" },
  nominal:  { tau1_bump: 0.00, frame_ms_mult: 1.0, dmn_allowed: true,  reflex_note: "" },
  open:     { tau1_bump: -0.03, frame_ms_mult: 0.75, dmn_allowed: true, reflex_note: "" },
};

// E2E audit (25 Jul 2026) found the ORDER here inverted the file's own law.
//   ff1e08dd: the staleness clamp ran BEFORE the verdict was ever read, so a
//     stale RED was PROMOTED to nominal — DMN un-muted, frames back to ×1.0 —
//     purely because the Oura sync had stopped. That is exactly what a sick
//     captain's week looks like (Governor RED Monday, no sync Tue/Wed), i.e. the
//     organism sped up at the precise moment it was told to rest. Same for a
//     garbage verdict, which stale-first also lifted out of conserve. The
//     conserve verdicts are now decided FIRST; age may only ever DEGRADE.
//   58de7fb1: the live path is ALWAYS the day+06:00 fallback (oura_coach writes
//     { ok, engine, day, mode, ... } — no generated_at anywhere), and an
//     unparseable day made `age` NaN, where `NaN > 36` is false: a week-old
//     GREEN then stayed 'open' forever. An unreadable stamp is now UNKNOWN AGE,
//     which is treated as not-fresh and can never licence 'open'.
function deriveArousal(readiness, now = new Date()) {
  if (!readiness || !readiness.verdict) return { arousal: "conserve", why: "no readable Governor — fail toward rest" };
  const v = String(readiness.verdict).toUpperCase();
  // --- the conserve verdicts, decided first: nothing below may lift them ---
  if (v === "RED") return { arousal: "conserve", why: "Governor RED — the only agenda is rest" };
  if (v !== "AMBER" && v !== "GREEN") return { arousal: "conserve", why: `unknown verdict "${v}" — fail toward rest` };
  // --- only now does age speak, and it may only ever push DOWN toward rest ---
  const stamp = readiness.generated_at || (readiness.day ? String(readiness.day) + "T06:00:00" : null);
  const ageMs = stamp ? (now - new Date(stamp)) : null;
  if (stamp && !Number.isFinite(ageMs)) return { arousal: "nominal", why: `Governor stamp unreadable ("${stamp}") — nominal, never open on unknown-age data` };
  const age = ageMs === null ? null : ageMs / 3600000;
  if (age !== null && age > 36) return { arousal: "nominal", why: `Governor stale (${Math.round(age)}h) — nominal, never open on old data` };
  if (v === "AMBER") return { arousal: "nominal", why: "Governor AMBER" };
  return { arousal: "open", why: "Governor GREEN — the grind is honored" };
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
  // E2E audit 25 Jul 2026 (ff1e08dd): staleness used to be read BEFORE the verdict,
  // so both of these came back "nominal" — age LIFTING a rest verdict. Age may only degrade.
  assert("stale RED stays CONSERVE — age never lifts a rest verdict", deriveArousal({ verdict: "RED", generated_at: new Date(now - 40 * 3600000).toISOString() }, now).arousal === "conserve");
  assert("stale garbage verdict stays CONSERVE", deriveArousal({ verdict: "PURPLE", generated_at: new Date(now - 40 * 3600000).toISOString() }, now).arousal === "conserve");
  // E2E audit 25 Jul 2026 (58de7fb1): production readiness.json has NO generated_at,
  // so day+06:00 is the only path the live organism ever takes — test it directly.
  assert("day-only (the LIVE path, no generated_at): fresh GREEN → open", deriveArousal({ verdict: "GREEN", day: "2026-07-14" }, now).arousal === "open");
  assert("day-only: 52h-old GREEN → nominal", deriveArousal({ verdict: "GREEN", day: "2026-07-12" }, now).arousal === "nominal");
  assert("unparseable day → nominal, NOT open (NaN age is not freshness)", deriveArousal({ verdict: "GREEN", day: "week-27" }, now).arousal === "nominal");

  assert("conserve: wake bar UP, frames SLOWER, DMN MUTED", EFFECTS.conserve.tau1_bump > 0 && EFFECTS.conserve.frame_ms_mult > 1 && EFFECTS.conserve.dmn_allowed === false);
  assert("open: the inverse — bar down a touch, frames fuller, dreaming allowed", EFFECTS.open.tau1_bump < 0 && EFFECTS.open.frame_ms_mult < 1 && EFFECTS.open.dmn_allowed === true);

  let written = null;
  const t = writeTone({ readiness: { verdict: "GREEN", generated_at: now.toISOString() }, now, write: (o) => { written = o; } });
  assert("tone.json carries arousal + effects + provenance verdict + ts", written.arousal === "open" && written.effects.dmn_allowed === true && written.from_verdict === "GREEN" && written.ts);

  assert("consumers: fresh tone reads through", currentTone({ read: () => written, now }).arousal === "open");
  // E2E audit 25 Jul 2026 (8a0e182f): this only asserted `.stale === true` while the
  // fixture is 'open' — a stale branch that just flagged the file and kept arousal/effects
  // (DMN still dreaming on 3-day-old data) would have passed a check whose name says otherwise.
  const st = currentTone({ read: () => written, now: new Date(now.getTime() + 27 * 3600000) });
  assert("consumers: stale tone (>26h) self-degrades to nominal", st.stale === true && st.arousal === "nominal" && st.effects === EFFECTS.nominal);
  assert("consumers: missing tone → nominal, never crashes", currentTone({ read: () => null }).arousal === "nominal");

  // WRITE-PATH COVERAGE (audit 30 Jul 2026). The selftest injects `write`, so writeAtomic —
  // the ONLY thing the EPERM hardening changed — never executed here: 16/16 green while the
  // fix was an untested hypothesis. CLAUDE.md: "unrun system = hypothesis". Now it runs.
  const box = join(tmpdir(), `tone_selftest_${process.pid}`);
  mkdirSync(box, { recursive: true });
  const okPath = join(box, "ok.json");
  writeAtomic(okPath, { hello: "world" });
  assert("writeAtomic lands a parseable file and leaves NO temp behind",
    JSON.parse(readFileSync(okPath, "utf8")).hello === "world"
    && readdirSync(box).filter(f => f.includes(".tmp")).length === 0);
  assert("the temp is per-process (two writers cannot share one temp name)",
    !existsSync(okPath + ".tmp"));
  // rename ONTO a directory is a permanent, non-transient failure: it must give up fast,
  // rethrow, clean its temp, and leave a line in tone.log — not die silently on a schedule.
  const dirTarget = join(box, "iamadir");
  mkdirSync(dirTarget, { recursive: true });
  let threw = null;
  const t0 = Date.now();
  try { writeAtomic(dirTarget, { x: 1 }); } catch (e) { threw = e; }
  const elapsed = Date.now() - t0;
  assert("a doomed rename rethrows rather than being swallowed", !!threw);
  assert("it cleans its own temp on the failure path",
    readdirSync(box).filter(f => f.includes(".tmp")).length === 0);
  assert("the retry budget is bounded (no spin): under 2s", elapsed < 2000);
  assert("the failure leaves a line in scripts/tone.log — 'nothing logged why' is closed",
    existsSync(join(__dirname, "tone.log")) && /writeAtomic FAILED/.test(readFileSync(join(__dirname, "tone.log"), "utf8")));
  rmSync(box, { recursive: true, force: true });

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
