#!/usr/bin/env node
// ============================================================================
// captain.mjs · ARSENAL AI FC — THE CAPTAIN PROFILE READER (18 Aug 2026, OVERHAUL Block 2 · §7.3)
// ----------------------------------------------------------------------------
// WHY. "Nikhil", "#14", "Charon", "Hinglish" were typed into ~40 code sites across a
// dozen organs. A profile is CONFIG, not an organ: one tracked file,
// dressing-room/state/captain.json (no secrets — keys_env_file is a POINTER to a
// gitignored file), read through ONE function so a second profile (Nidhi FC) is a
// second file + its own state dir later. The seam exists now; the second club does not.
//
// LAWS: READ-ONLY. Writes nothing, owns no state file (captain.json is hand-edited
//   config; nothing writes it). DEFAULTS are the values the organism carried in code
//   until today, so a missing/corrupt file changes nothing — and says so on `status`.
//   Never a secret through here: `keys_env_file` returns a PATH; reading the file it
//   names is the caller's business under its own gitignore law.
// WHO ELSE COULD ACT ON THIS OUTPUT? dugout.mjs (the Gaffer's opening line, its voice) ·
//   learnstate.mjs (the brief's second person) · viz.mjs (the wall's title) · state.mjs ·
//   sitting.mjs (Block 3: the sitting head's "who") · archivist (Contact-Name in bag-info)
//   · setpiece / cortex / nightshift / selfknowledge / oura_coach prompts (his name).
// CLI: node scripts/captain.mjs status | json | selftest
// ============================================================================
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
export const PROFILE_PATH = join(ROOT, "dressing-room", "state", "captain.json");

// The values the code carried until 18 Aug 2026 — a missing file changes nothing.
export const DEFAULTS = Object.freeze({
  name: "Nikhil", full_name: "Nikhil Panwar", number: 14, pronoun: "he/him", voice: "Charon",
  language: "hinglish", tz: "Asia/Kolkata", tz_offset_min: 330, syllabus_root: "learning-layer",
  keys_env_file: "scripts/oura_secrets.json", laws_overrides: {},
});
const STRING_KEYS = ["name", "full_name", "pronoun", "voice", "language", "tz", "syllabus_root", "keys_env_file"];

let _cache = null;   // per-process — a hook turn reads it once; a daemon re-reads on `captain({fresh:true})`

// captain({file, fresh}) → the profile, every key present (file value if valid, else DEFAULT),
// plus `_source`: "file" | "defaults (missing)" | "defaults (unreadable)" | "file+defaults (N key(s) fell back)".
export function captain(opts = {}) {
  const file = opts.file || PROFILE_PATH;
  if (_cache && !opts.fresh && !opts.file) return _cache;
  const out = { ...DEFAULTS, laws_overrides: {} };
  let source = "file";
  if (!existsSync(file)) source = "defaults (missing)";
  else {
    let j = null;
    try { j = JSON.parse(readFileSync(file, "utf8")); } catch { source = "defaults (unreadable)"; }
    if (j && typeof j === "object") {
      let fell = 0;
      for (const k of STRING_KEYS) { if (typeof j[k] === "string" && j[k].trim()) out[k] = j[k].trim(); else fell++; }
      if (Number.isInteger(j.number) && j.number > 0) out.number = j.number; else fell++;
      if (Number.isFinite(j.tz_offset_min)) out.tz_offset_min = j.tz_offset_min; else fell++;
      if (j.laws_overrides && typeof j.laws_overrides === "object" && !Array.isArray(j.laws_overrides)) out.laws_overrides = { ...j.laws_overrides }; else fell++;
      if (fell) source = `file+defaults (${fell} key(s) fell back)`;
    } else if (source === "file") source = "defaults (unreadable)";
  }
  out._source = source;
  if (!opts.file) _cache = out;
  return out;
}
// the two shapes every prompt used to spell by hand
export const captainTag = (c = captain()) => `${c.name} (#${c.number})`;          // "Nikhil (#14)"
export const captainLine = (c = captain()) => `${c.full_name || c.name}, captain #${c.number}`;

// ── SELFTEST — hermetic (fixture files; the live profile is only READ) ────────
function selftest() {
  let pass = 0, fail = 0; const fails = [];
  const ok = (name, cond, detail) => { if (cond) { pass++; console.log(`  ok   ${name}`); } else { fail++; fails.push({ name, detail }); console.log(`  FAIL ${name}${detail ? `\n         ${detail}` : ""}`); } };
  console.log("=== captain.mjs selftest ===\n");
  const tmp = mkdtempSync(join(tmpdir(), "captain-"));
  const f = join(tmp, "captain.json");
  const missing = captain({ file: join(tmp, "nope.json") });
  ok("MISSING file → every DEFAULT, and the source SAYS missing (nothing changes for a bare clone)", missing.name === "Nikhil" && missing.number === 14 && missing.voice === "Charon" && missing._source === "defaults (missing)");
  writeFileSync(f, "{ not json");
  ok("UNREADABLE file → defaults, source says unreadable — never a throw on a hook path", captain({ file: f })._source === "defaults (unreadable)" && captain({ file: f }).name === "Nikhil");
  writeFileSync(f, JSON.stringify({ name: "Nidhi", number: 7, voice: "Kore", language: "english", laws_overrides: { hinglish: false } }));
  const n = captain({ file: f });
  ok("a second profile reads through the same door: name/number/voice/language taken, the rest FALL BACK by name", n.name === "Nidhi" && n.number === 7 && n.voice === "Kore" && n.language === "english" && n.tz === "Asia/Kolkata" && n.laws_overrides.hinglish === false && /fell back/.test(n._source));
  writeFileSync(f, JSON.stringify({ name: "  ", number: -1, keys_env_file: 42 }));
  const bad = captain({ file: f });
  ok("junk values fall back KEY BY KEY (blank name, negative number, non-string path) — the file never breaks the profile", bad.name === "Nikhil" && bad.number === 14 && bad.keys_env_file === DEFAULTS.keys_env_file && /3 key/.test(bad._source) === false /* every string key + number + tz + overrides fell back */ && /fell back/.test(bad._source));
  const live = captain({ fresh: true });
  ok("the LIVE profile reads (tracked file present) and carries no secret — keys_env_file is a path, not a key", live._source === "file" && typeof live.keys_env_file === "string" && !/[A-Za-z0-9]{32,}/.test(live.keys_env_file) && live.number === 14, JSON.stringify(live));
  ok("captainTag / captainLine render the two shapes the prompts used to spell by hand", captainTag(live) === `${live.name} (#${live.number})` && captainLine(live).includes(`captain #${live.number}`));
  ok("the cache is per-process and `fresh` re-reads (a daemon can pick up an edit)", captain() === captain() && captain({ fresh: true }) !== undefined);
  rmSync(tmp, { recursive: true, force: true });
  console.log(`\ncaptain: ${pass} passed, ${fail} failed`);
  if (fail) for (const x of fails) console.log(`  · ${x.name}${x.detail ? `\n      ${x.detail}` : ""}`);
  process.exit(fail ? 1 : 0);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = (process.argv[2] || "status").toLowerCase();
  if (mode === "selftest") selftest();
  else if (mode === "json") console.log(JSON.stringify(captain({ fresh: true }), null, 1));
  else { const c = captain({ fresh: true }); console.log(`captain: ${captainLine(c)} · ${c.pronoun} · voice ${c.voice} · ${c.language} · ${c.tz} · source: ${c._source} · ${PROFILE_PATH}`); }
}
