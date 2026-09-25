#!/usr/bin/env node
// ============================================================================
// home_pin.mjs · ARSENAL AI FC — THE HOME-CHECKOUT PIN (forks row 328, 26 Sep 2026)
// ----------------------------------------------------------------------------
// WHAT: ONE check every writer that reaches OUTSIDE this checkout calls before it
//   writes — his archive, his phone, anything under the home directory. It asks
//   one question: IS THIS CHECKOUT THE ONE HE PINNED? The answer is the realpath
//   of this checkout's root compared to a PIN recorded once, by a verb.
//
// THE INCIDENT THAT PUT IT HERE (measured 26 Sep 2026): a FRESH CLONE of this
//   repo, opened by the Claude Code CLI in a temp folder on his laptop, loaded the
//   CLONE's .claude/settings.json and ran its hooks there. SessionEnd ran the
//   clone's `archivist.mjs run`, whose archive root is home-relative — so the clone
//   appended to HIS REAL ARCHIVE: 4 outbox records, 1 swallow_ledger record, 8
//   source-resync health rows, and it MOVED _writer/checkpoints.json offsets to the
//   clone's file sizes (the checkpoints were keyed by relpath only, so his older
//   state files read as rewritten in place). Nothing was deleted; the chain held.
//   THE CLASS: any checkout that is not his home checkout could write into his
//   archive — and anything else outside the repo — through the hooks.
//
// THE PIN IS DATA, NEVER A LITERAL. No path of his machine lives in code: the pin
//   is written by `archivist.mjs pin` (and by `init`), and it lives WITH THE
//   ARCHIVE (_writer/root_pin.json), so one pin serves every writer that can find
//   the archive — and the archive is what a foreign checkout must not touch.
//   WHERE the archive is, and the pin's one writer, stay in archivist.mjs: this
//   file only READS the pin (the archivist's SINGLE WRITER plant holds that — no
//   second organ knows the archive's path, let alone writes into it).
//
// THREE STATES, and the middle one is the backward-compatible one:
//   home      — pinned, and this checkout IS the pin          → proceed
//   unpinned  — no pin recorded yet                           → proceed as before,
//               one stderr line UNPINNED (the pin verb has not run on his laptop)
//   foreign   — pinned, and this checkout is somewhere else   → REFUSE, write nothing
//
// WRITES NOTHING. The pin file's sole writer is archivist.mjs (`pin` · `init`).
//
// MODES: status · selftest
// ============================================================================
import { writeFileSync, mkdirSync, mkdtempSync, rmSync, cpSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
// THE PIN'S CORE LIVES WITH ITS OWNER. Where the archive is, how the pin reads and
// how a checkout compares all belong to archivist.mjs — the archive's single writer
// and the pin's — and this file only re-exports them with the one guard below. The
// import runs ONE way (archivist never imports this file): a cycle between two
// organs is the owners-only question with no answer (.dependency-cruiser.cjs rule 1).
import { archiveRoot, pinFileOf, realRoot, pinIdOf, readPin, homeCheck, calledAsHook, refusalLine, unpinnedLine } from "./archivist.mjs";
export { archiveRoot, realRoot, readPin, homeCheck, calledAsHook };
export const pinPath = (archive = archiveRoot()) => pinFileOf(archive);

// THE GUARD every outside-writer calls: true = go ahead, false = write nothing.
// Silent on "home"; one stderr line otherwise (quiet:true suppresses it for a
// capture nerve whose output must stay empty).
export function mayWriteOutside(who, opts = {}) {
  const c = homeCheck(opts);
  if (c.state === "foreign") { if (!opts.quiet) process.stderr.write(refusalLine(who, c) + "\n"); return false; }
  if (c.state === "unpinned" && !opts.quiet && opts.sayUnpinned !== false) process.stderr.write(unpinnedLine(who, c) + "\n");
  return true;
}

// ── SELFTEST (hermetic: temp dirs only; never reads or writes a real home archive) ──
function selftest() {
  let pass = 0, fail = 0;
  const ok = (name, cond, detail) => { if (cond) { pass++; console.log(`  ok   ${name}`); } else { fail++; console.log(`  FAIL ${name}${detail ? `\n         ${detail}` : ""}`); } };
  const tmp = mkdtempSync(join(tmpdir(), "arsenal-homepin-test-"));
  try {
    const arc = join(tmp, "archive"), A = join(tmp, "A"), B = join(tmp, "B");
    mkdirSync(join(A, "scripts"), { recursive: true });
    writeFileSync(join(A, "scripts", "x.mjs"), "// x\n");
    cpSync(A, B, { recursive: true });                       // the byte-copy clone
    // a FIXTURE pin in a temp archive — the real pin's writer is archivist.mjs
    const plantPin = (dir) => { mkdirSync(dirname(pinPath(arc)), { recursive: true }); writeFileSync(pinPath(arc), JSON.stringify({ realpath: realRoot(dir), pinned_at: new Date().toISOString(), by: "selftest" }) + "\n"); };
    ok("UNPINNED · no pin file ⇒ state unpinned and the guard lets the writer proceed (backward compatible)",
      homeCheck({ repo: A, archive: arc }).state === "unpinned" && mayWriteOutside("t", { repo: A, archive: arc, quiet: true }) === true);
    plantPin(A);
    ok("PIN · read back as data: realpath + pinned_at + by — no path literal anywhere", readPin(arc).realpath === realRoot(A) && !!readPin(arc).pinned_at);
    ok("HOME · the pinned checkout reads home and may write", homeCheck({ repo: A, archive: arc }).state === "home" && mayWriteOutside("t", { repo: A, archive: arc, quiet: true }) === true);
    ok("FOREIGN · a byte-copy at another realpath reads foreign and may NOT write",
      homeCheck({ repo: B, archive: arc }).state === "foreign" && mayWriteOutside("t", { repo: B, archive: arc, quiet: true }) === false);
    writeFileSync(pinPath(arc), "{ not json");
    ok("UNREADABLE PIN · a torn pin file reads as unpinned (proceed, and say so) — never as a crash", homeCheck({ repo: B, archive: arc }).state === "unpinned");
    ok("PIN ID · stable per path, different across paths", pinIdOf(realRoot(A)) === pinIdOf(realRoot(A)) && pinIdOf(realRoot(A)) !== pinIdOf(realRoot(B)));
    ok("HOOK DETECTION · CLAUDE_PROJECT_DIR marks a hook; its absence marks a hand", calledAsHook({ CLAUDE_PROJECT_DIR: "/x" }) === true && calledAsHook({}) === false);
    ok("PIN FILE · lives with the archive, in its writer directory", pinPath(arc) === join(resolve(arc), "_writer", "root_pin.json"));
  } finally { try { rmSync(tmp, { recursive: true, force: true }); } catch { /* windows locks */ } }
  console.log(`\nhome_pin selftest: ${pass} passed, ${fail} failed`);
  return fail === 0 ? 0 : 1;
}

function main() {
  const mode = (process.argv[2] || "status").toLowerCase();
  if (mode === "selftest") return process.exit(selftest());
  if (mode === "status") {
    const c = homeCheck();
    console.log(`home pin · ${c.state.toUpperCase()} · this checkout ${c.here}${c.pinned ? ` · pinned ${c.pinned} (${c.pin.pinned_at})` : " · no pin recorded (node scripts/archivist.mjs pin)"} · pin file ${pinPath()}`);
    return process.exit(0);
  }
  console.log("home_pin: status | selftest   (the pin is written by `node scripts/archivist.mjs pin`)");
  return process.exit(1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
