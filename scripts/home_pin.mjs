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
// A SECOND, WIDER DOOR FOR POSTERS (forks row 334): the three hook-reached writers
//   that send his words OUT — afferent-post (thalamus) · sitting touch/host (the
//   sitting daemon) · acts note (hippocampus mark → the Gemini embed) — ask
//   mayPostHome() instead: home, unpinned, OR a live git worktree of the pinned root
//   posts; a clone, a byte-copy, a worktree of another repo, a stale entry → nothing
//   sent, exit 0, one stderr line. mayWriteOutside() above it stays home-only.
//
// WRITES NOTHING. The pin file's sole writer is archivist.mjs (`pin` · `init`).
//
// MODES: status · selftest
// ============================================================================
import { writeFileSync, mkdirSync, mkdtempSync, rmSync, cpSync, existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import http from "node:http";
import { join, dirname, resolve, relative, sep } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
// THE PIN'S CORE LIVES WITH ITS OWNER. Where the archive is, how the pin reads and
// how a checkout compares all belong to archivist.mjs — the archive's single writer
// and the pin's — and this file only re-exports them with the one guard below. The
// import runs ONE way (archivist never imports this file): a cycle between two
// organs is the owners-only question with no answer (.dependency-cruiser.cjs rule 1).
import { archiveRoot, pinFileOf, realRoot, pinIdOf, readPin, homeCheck, postCheck, postingFixture, archiveEnv, calledAsHook, refusalLine, unpinnedLine } from "./archivist.mjs";
export { archiveRoot, realRoot, readPin, homeCheck, postCheck, postingFixture, calledAsHook };
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

// THE POSTERS' GUARD: true = post, false = send nothing. Silent on home and on a
// worktree of the pin; one stderr line otherwise (opts.warn captures it in a selftest).
export function mayPostHome(who, opts = {}) {
  const c = postCheck(opts);
  const say = opts.warn || ((l) => process.stderr.write(l + "\n"));
  if (c.state === "foreign") { if (!opts.quiet) say(refusalLine(who, c, { posting: true })); return false; }
  if (c.state === "unpinned" && !opts.quiet && opts.sayUnpinned !== false) say(unpinnedLine(who, c));
  return true;
}

// What a checkout needs for hooks/afferent-post.mjs to run in a selftest fixture: the
// hook, the guard, the pin core and its two imports, and the spool it writes ahead to —
// i.e. the hook's relative-import closure (static and literal dynamic imports). DERIVED
// from the hook's own source, never listed (26 Sep 2026, forks row 368 (4)): a roster
// goes stale the day the hook grows an import; a closure cannot (organism_test's NO SHIM
// CALLEE walk is the precedent). Walked only when the selftest asks, never on a hook's path.
const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
function importClosure(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  for (const m of readFileSync(join(REPO, file), "utf8").matchAll(/(?:\bfrom\s+|\bimport\s*\(\s*|^\s*import\s+)["'](\.{1,2}\/[^"']+)["']/gm))
    importClosure(relative(REPO, join(REPO, dirname(file), m[1])).split(sep).join("/"), seen);
  return seen;
}
const posterFiles = () => [...importClosure("hooks/afferent-post.mjs")];

// ── SELFTEST (hermetic: temp dirs only; never reads or writes a real home archive) ──
async function selftest() {
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

    // ── THE POSTERS — the real hooks/afferent-post.mjs, run from each
    // checkout of a real git fixture, against a COUNTING stub thalamus on an ephemeral
    // port (never a real daemon; the archive is a temp one; the spool a temp db).
    const fx = postingFixture(join(tmp, "posting"), { files: posterFiles() });
    const parc = join(tmp, "posting-archive");
    const pinTo = (dir) => { mkdirSync(dirname(pinPath(parc)), { recursive: true }); writeFileSync(pinPath(parc), JSON.stringify({ realpath: realRoot(dir), pinned_at: new Date().toISOString(), by: "selftest" }) + "\n"); };
    const guard = (k) => { const w = []; const r = mayPostHome("t", { repo: fx[k], archive: parc, warn: (l) => w.push(l) }); return { r, w }; };
    const hit = { conns: 0, bytes: 0 };
    const srv = http.createServer((req, res) => { req.on("data", (d) => { hit.bytes += d.length; }); req.on("end", () => { res.writeHead(200, { "content-type": "application/json" }); res.end("{}"); }); });
    srv.on("connection", () => { hit.conns++; });
    await new Promise((r) => srv.listen(0, "127.0.0.1", r));
    const port = srv.address().port;
    const fire = (k) => new Promise((done) => {
      hit.conns = 0; hit.bytes = 0;
      const env = { ...process.env, ARSENAL_THALAMUS: `http://127.0.0.1:${port}`, ...archiveEnv(parc), ARSENAL_SPOOL_DB: join(tmp, `spool-${k}.db`), CLAUDE_PROJECT_DIR: fx[k], NODE_NO_WARNINGS: "1" };   // node:sqlite's ExperimentalWarning is node's line, not the hook's
      delete env.ARSENAL_ORGAN;
      const c = spawn(process.execPath, [join(fx[k], "hooks", "afferent-post.mjs")], { cwd: fx[k], env, windowsHide: true });
      let out = "", err = "";
      c.stdout.on("data", (d) => { out += d; }); c.stderr.on("data", (d) => { err += d; });
      c.on("close", (code) => done({ code, out, err: err.split("\n").filter(Boolean), conns: hit.conns, bytes: hit.bytes, spooled: existsSync(join(tmp, `spool-${k}.db`)) }));
      c.stdin.end(JSON.stringify({ hook_event_name: "UserPromptSubmit", prompt: "posting fixture — meri baat, verbatim", session_id: "fx", cwd: fx[k] }));
    });
    try {
      // (f) UNPINNED — no pin file: all post as today, ONE UNPINNED line each
      const u = { home: await fire("home"), wt: await fire("wt"), clone: await fire("clone") };
      ok("POST (f) · UNPINNED: home, worktree and clone all POST as today (one request each), exit 0, stdout EMPTY, ONE stderr line saying UNPINNED",
        Object.values(u).every((x) => x.code === 0 && x.out === "" && x.conns === 1 && x.bytes > 0 && x.err.length === 1 && /UNPINNED/.test(x.err[0])), JSON.stringify(u));
      pinTo(fx.home);
      const a = await fire("home");
      ok("POST (a) · HOME: the pinned checkout's afferent-post POSTs once — silent on stderr, stdout empty, exit 0",
        a.code === 0 && a.out === "" && a.conns === 1 && a.bytes > 0 && a.err.length === 0, JSON.stringify(a));
      const b = await fire("wt");
      ok("POST (b) · WORKTREE: a `git worktree add` of the pinned root POSTs too — silent, stdout empty, exit 0",
        b.code === 0 && b.out === "" && b.conns === 1 && b.bytes > 0 && b.err.length === 0, JSON.stringify(b));
      const c = await fire("clone");
      ok("POST (c) · CLONE: a `git clone` of the pinned root sends ZERO bytes (no connection at all), exit 0, stdout EMPTY, ONE stderr line naming both paths",
        c.code === 0 && c.out === "" && c.conns === 0 && c.bytes === 0 && c.err.length === 1 && /REFUSED/.test(c.err[0]) && c.err[0].includes(realRoot(fx.clone)) && c.err[0].includes(realRoot(fx.home)), JSON.stringify(c));
      ok("POST (c) · …and its LOCAL write-ahead is unchanged: the clone spools exactly as home does (the spool is inside the checkout)", c.spooled === a.spooled);
      const d = await fire("stale"), f = await fire("forged");
      ok("POST (d) · STALE WORKTREE: an unrelated folder at a deleted worktree's name — and a byte-copy of a live worktree — send zero bytes",
        [d, f].every((x) => x.code === 0 && x.out === "" && x.conns === 0 && x.err.length === 1 && /REFUSED/.test(x.err[0])), JSON.stringify({ d, f }));
      const e = await fire("otherwt");
      ok("POST (e) · FOREIGN-REPO WORKTREE: a worktree of a DIFFERENT repo sends zero bytes",
        e.code === 0 && e.out === "" && e.conns === 0 && e.err.length === 1 && /REFUSED/.test(e.err[0]), JSON.stringify(e));
      ok("GUARD · mayPostHome: home + worktree true and silent; clone false with ONE line — and mayWriteOutside stays home-only (the worktree may post, may NOT write)",
        guard("home").r && !guard("home").w.length && guard("wt").r && !guard("wt").w.length && !guard("clone").r && guard("clone").w.length === 1
        && mayWriteOutside("t", { repo: fx.wt, archive: parc, quiet: true }) === false && mayWriteOutside("t", { repo: fx.home, archive: parc, quiet: true }) === true);
    } finally { srv.close(); }
  } finally { try { rmSync(tmp, { recursive: true, force: true }); } catch { /* windows locks */ } }
  console.log(`\nhome_pin selftest: ${pass} passed, ${fail} failed`);
  return fail === 0 ? 0 : 1;
}

async function main() {
  const mode = (process.argv[2] || "status").toLowerCase();
  if (mode === "selftest") return process.exit(await selftest());
  if (mode === "status") {
    const c = homeCheck();
    console.log(`home pin · ${c.state.toUpperCase()} · this checkout ${c.here}${c.pinned ? ` · pinned ${c.pinned} (${c.pin.pinned_at})` : " · no pin recorded (node scripts/archivist.mjs pin)"} · pin file ${pinPath()}`);
    return process.exit(0);
  }
  console.log("home_pin: status | selftest   (the pin is written by `node scripts/archivist.mjs pin`)");
  return process.exit(1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
