#!/usr/bin/env node
// ============================================================================
// probe.mjs · ARSENAL AI FC — STAGE 3.1 · THE PROBE ENGINE (30 Sep 2026)
// ----------------------------------------------------------------------------
// WHY THIS EXISTS, IN ONE FACT. The campaign holds 161 claims about this organism.
// Each was read by a reader against an OLD snapshot, its receipt was rerun by the
// adjudicator, and two blind judges weighed it — and not one of them was ever run
// against the organism AS IT IS. A claim nobody re-derived on the live tree is a
// hypothesis, and CLAUDE.md's law is that an unrun system IS a hypothesis. So this
// file turns every claim into a PROBE — a TIER-0 predicate plus an expectation —
// and runs it three times, on three axes, each run with a receipt naming the tree.
//
// THE PROBE (one JSON line): {id, claim, source:{population_id, seed_file, seed_line,
//   verdict_claimed, aj_final, tier0}, predicate_cmd, expect, tier: 0, lane, reads[],
//   authored_at_tree}. `expect` carries at least one of {exit, stdout_includes[],
//   stdout_excludes[], stdout_lines:{op: == | >= | <=, n}} and EVERY key given must
//   hold. The CLAIM holds on a tree exactly when the expectation holds there.
//
// LAWS (each is a code path, and the selftest plants each one both ways):
//   1. NO SHELL, EVER. predicate_cmd is DATA until the copied adjudicator tokenizer
//      has parsed it: quotes honoured, nothing expanded, split on `&&` and `|` outside
//      quotes. `;`, redirection, `$(`, backtick, `$VAR`, globs, `||`, `&`, subshells =
//      UNRUNNABLE with the reason. Segments are spawned one by one, shell:false,
//      windowsHide:true, stdin = the previous segment's stdout, a timeout per segment
//      and an output cap. Never a guess, never a partial parse.
//   2. THE VERB TABLE, organism-side: git show|ls-files|log|cat-file (no write flag),
//      grep (never -R), sed -n (line prints only), head, tail, wc — the adjudicator's
//      rows WITH their flag rules — plus `cd` INSIDE the probed tree only, plus ONE row
//      of our own: `node scripts/<file>.mjs [args]`, admitted ONLY on a collar axis.
//      Every verb is resolved to an absolute executable at start: PATH first, then the
//      usr/bin beside git (on his laptop grep/sed/head/tail/wc live beside Git for
//      Windows). A verb that does not resolve is UNRUNNABLE (VERB-NOT-FOUND), never a pass.
//   3. THREE AXES. host = the live --root working tree, read verbs only · sandbox = a
//      FRESH buildSandbox() tree, assertArmed first, fail-closed · fixture = a fresh
//      sandbox + a READ-ONLY COPY of the gitignored state bus (dressing-room/state/),
//      hashed before and after — a changed copy is recorded as fixture_dirtied. A lane
//      fixes the three runs: host → host,sandbox,fixture · live-readonly → host,fixture,
//      fixture · sandbox → sandbox,sandbox,fixture · FIXTURE → fixture ×3. Every collar
//      run is a fresh instance, destroyed after. runs.length is ALWAYS 3.
//   4. VERDICTS. CONFIRMED = all 3 held · REFUTED = all 3 not held · NON-DETERMINISTIC =
//      mixed, or any run incomplete (timed out / capped / VERB-CRASHED / READ-ABSENT —
//      named) · UNRUNNABLE = the probe
//      is on THE QUARANTINE REGISTER {id, why, runnable_if}, counted BY WHY on the first
//      lines of every report · STALE is emitted only by `status`: the receipt's tree_sha
//      is not HEAD and `git diff --name-only <tree_sha> HEAD` (or a dirty path) touches
//      the probe's reads[].
//   5. THE LENSES as code (D / E are Stage 3.4's, not here):
//      A · VACUOUS, the PRE-MUTAGEN form — a CONFIRMED or REFUTED probe is run ONCE more
//          in a fresh collar tree with every reads[] path removed; `held` unchanged =
//          VACUOUS. ⚠ Stage 3.2 REPLACES this with mutagen flips (a mutated tree must
//          flip the predicate); deletion is the crude floor of that, not the ceiling.
//      B · ALREADY-FIXED — a pure field {seed, aj, now}: the seed confirmed a defect the
//          probe now refutes.
//      C · THIS MACHINE ONLY — host and a collar axis disagree: HOST-ONLY or COLLAR-ONLY.
//   6. WRITES ONLY WHERE TOLD. Nothing is ever written into --root or any organism
//      path, and no state file is born. `run` writes only its --out file and REFUSES an
//      --out inside --root; `import` writes only its --out; the collar writes only its
//      own temp dir. This file owns no state file.
//   7. A CRASH IS NEVER A VERDICT, AND NEITHER IS AN ABSENT READ (forks row 471, the laptop
//      proof of V438: Git for Windows' grep 3.0 aborts on -i with two or more -e, status
//      34304, and the engine had graded that REFUTED ×3).
//      a · every spawned segment's status must lie in its verb's DECLARED exit set (the
//          table's exit_max, cited per row); outside it, killed by a signal, or failed to
//          spawn = the run is incomplete (VERB-CRASHED), held null, never held or not-held.
//      b · THE TREE WATCHER: `git status --porcelain --ignored` of --root plus a listing
//          (name, size, mtime) of its top level and of every cwd the run enters, before and
//          after EVERY run. Any change = that run RED and the probe quarantined TREE-WRITTEN
//          naming the path(s); the engine never deletes what a verb wrote, the operator
//          reads it; `run` then exits 1. A crashed msys verb writes <verb>.exe.stackdump into
//          its cwd, gitignored, so a porcelain without --ignored is blind to it. MEASURED 30
//          Sep 2026 on his laptop (grep 3.0, git 2.38.0.windows.1): no MSYS / CYGWIN value
//          turns that dumper off (error_start:<missing> and dumper:0 still dump;
//          error_start:<a real program> hangs the verb to its timeout) — so the no-write
//          law is WATCHED, not assumed.
//      c · a run whose reads[] path is absent on its axis is incomplete (READ-ABSENT) and
//          nothing is spawned, unless expect.reads_absent declares that path absent. Lens
//          A's ablation run removes reads[] on purpose and is exempt.
//      d · `run` REFUSES a --root the collar does not build from (or a collar that does
//          not load) while any collar axis is due, before anything is spawned — unless
//          --host-only, which runs the host axis alone and quarantines the collar axes.
//      e · COLLAR FIRST (row 477 (2), his word #75): a lane's collar runs go BEFORE its host
//          run, and a plan that crashed on ANY collar axis is never run on --root — the host
//          run is filed NOT-RUN (COLLAR-CRASHED) naming the crash, incomplete. A crash that
//          depends on the flags (F1) is so caught in a throwaway tree before it can write a
//          dump into --root; (b) stays armed for a crash that happens only on the host. The
//          receipt's runs[] keep the lane's order. --host-only keeps the host first.
//      f · ANOTHER WRITER IS NAMED, NOT BLAMED (forks rows 494 / 495; the live run's probe 36:
//          his own daemon's atomic write, brain_queue.json.8020.tmp, landed in --root while a
//          COLLAR axis ran). A change (b) sees is filed on the run as other_writer {path, pid,
//          session, name, rule} and the run is GRADED, never quarantined, in exactly two
//          shapes; every other change stays TREE-WRITTEN:
//          A · seen while a COLLAR axis ran, the collar armed: the run's verbs work inside the
//              collar's temp tree, and its node verbs are denied every write outside it
//              (audit_preload), so a --root change then is another writer's. A collar that
//              failed (not armed, a build or copy that threw) proves nothing: rule B there.
//          B · any other window (the HOST axis): a path shaped `<existing file>.<pid>.tmp` (the
//              organs' writeAtomic) ONLY when that pid is live, is NOT in this engine's own
//              process tree, and the file is gone (renamed or removed) within SETTLE_MS of the
//              after-check, its <existing file> present.
//          STRICTER THAN A, ON EVERY AXIS: a pid-named tmp whose pid IS in this engine's own
//          process tree stays TREE-WRITTEN. The pids come from ONE snapshot of the process
//          table per attribution (Win32_Process on Windows, /proc elsewhere); no snapshot =
//          nothing confirmed = B never grades. `run` names every other writer on a NOTE line.
//      g · A LOCKED FILE IS RETRIED, BOUNDED AND NAMED (rows 494 (4) / 495 (1); the live run's
//          probe 16: Node read Windows ERROR_LOCK_VIOLATION (33) as errno 33 = EDOM while the
//          fixture copied his live state bus). The collar build and the fixture's state copy
//          are retried on EDOM / EBUSY, RETRY_TRIES attempts, the wait doubling from
//          RETRY_BASE_MS; every failed attempt is named on the run (`retries`). Exhausted, the
//          probe is COLLAR-NOT-ARMED naming the lock, never an INTERNAL crash.
//      h · ARGV FIDELITY (Stage 3.3, forks row 545; the census cloud/V33/derive/, 6 Oct 2026): node quotes only a
//          word carrying a space or a quote, and the MSYS runtime of Git for Windows' grep / sed / head / tail / wc
//          GLOBS and UNESCAPES every unquoted word it receives from a Windows process — `password\s*[:=]` reached
//          grep as `passwords*[:=]`, `\(` as `(`. MEASURED with the MSYS printf beside grep printing back what its
//          runtime parsed: 3 of the face's 255 segments arrived with other bytes, and the engine graded two claims
//          on a pattern that never compiled (grep exit 2) and one on a pattern it never searched. So on win32 EVERY
//          spawned word is quoted by the engine itself (a quote escaped, the backslashes before it or before the
//          closing quote doubled), windowsVerbatimArguments on, the program path quoted as argv0: 255 of 255
//          byte-equal; git.exe and node.exe 22 of 22 planted words either way. The one shape the quoted form
//          still alters — a text-verb word OPENING with two backslashes arrives with one — is UNRUNNABLE
//          ARGV-UNFAITHFUL by name, on every platform (one register everywhere), never guessed. `MSYS=noglob` is
//          NOT the fix: it breaks every embedded quote (35 of the face's probes).
//      i · AN ERROR STATUS IS NEVER EVIDENCE (row 545): a segment ending in its verb's ERROR status (the table's
//          errs: grep 2, sed / head / tail / wc 1) makes the run incomplete (VERB-ERRORED naming verb, status and
//          stderr head), held null — upstream in a pipe included, where the last segment's exit used to hide it.
//          THE ONE EXCEPTION: the error is explained by a missing path expect.reads_absent declares (every tree
//          path of that segment that is absent is declared), and then it is the claim's evidence — `wc -l` of a
//          never-born file. Lens A's ablation run declares the reads[] it removed on purpose.
//   8. VACUITY, Stage 3.2 (forks rows 523 / 524) — `vacuity` asks of every graded probe: does
//      the predicate REST ON THE LINES ITS CLAIM CITES? Lens A's deletion floor removes whole
//      files, and on the face of record it read the VERDICT's direction (REFUTED → VACUOUS
//      58 of 63, CONFIRMED → NOT-APPLICABLE 66 of 67), not the predicate; mutagen as written
//      changes the first match in a file, and 6 of 1,305 such mutants landed inside a cited
//      window. So each cited line is mutated ON ITS OWN and the predicate re-run.
//      a · THE MUTANT SET (F1 (B)): per cited line, LINE-DEL (the line blanked, its EOL kept, so
//          every other line keeps its number) + each of mutagen.mjs's CODE_OPS applied to THAT
//          line alone (its own functions, imported lazily, unchanged; on .mjs / .js / .cjs lines,
//          mutagen's own target). Cited = the reads[] windows (path:N, path:N-M, the receipt's
//          tree's line numbers); for a whole-file read, the line numbers the unmutated collar run
//          PRINTS (grep -n's N: / path:N:). A whole-file read with none has NO WINDOW and the
//          deletion floor (A_floor) stands for it, named.
//      b · ONE FRESH COLLAR PER PROBE (F2 (b), stricter): armed first; the unmutated BASELINE run
//          must reproduce the verdict of record or nothing is mutated (BASELINE-DIFFERS); a mutant
//          is written ONLY inside the collar's copy (mutationGuard refuses every other path), run,
//          restored, and the file's sha256 checked against the bytes the collar built — a
//          mismatch REFUSES the probe (RESTORE-MISMATCH). A read that moved since the receipt's
//          tree, or is dirty now, is never mutated (STALE). THE TREE WATCHER wraps the whole
//          probe: a --root change is TREE-WRITTEN (exit 1) unless law 7f names another writer.
//      c · THE READINGS (F3): NOT-VACUOUS = a complete mutant flipped held (every flip named
//          {op, path, line}, the first first) · VACUOUS = complete mutants ran, none flipped, and
//          a deletion COULD have flipped it (its evidence is not where the claim says) ·
//          NOT-DECIDABLE-BY-DELETION = none flipped and no deletion could have (deletionCanFlip,
//          key by key on the unmutated run: F3's REFUTED "the text is there", and its mirror, a
//          CONFIRMED "the text is NOT there"; the insertion co-flip is to be built) · a mutant run
//          that crashes, times out or caps is INCOMPLETE, never a flip; no complete mutant =
//          INCOMPLETE. STRICTER THAN F3 AS WRITTEN: the mutants run on EVERY graded probe, so the
//          not-decidable label is only ever the reading of a no-flip and never hides a flip.
//      d · WRITES: only --out (refused inside --root); the receipts of record are read, never
//          rewritten; lens A of record is carried beside as A_floor (L9).
//   9. SILENT SUCCESS, Stage 3.3 (row 545) — exit 0 is not evidence of work; touching the file is (blackbox.mjs's
//      own argument, at the grain of one probe). A plan with a `node scripts/<f>.mjs` segment builds its collar
//      with the TRACE on and labels each node segment; a node segment that exits 0 having made 0 reads, 0 writes
//      and 0 spawns (its trace rows, children included; its module loader's own reads of code files are counted
//      apart as code_reads — see nodeTrace) reads SILENT-SUCCESS on its run (silent_success) and on
//      the receipt (silent). It is a reading, never a verdict change: the claim may be exactly "it does nothing".
//      The face of 6 Oct 2026 has 0 node segments, so the reading guards the probes not yet authored. blackbox.mjs
//      itself (every organ, one collar) is NOT run by this file — an npm-test-sized load, his word's class.
//
// THE COLLAR is scripts/sandbox.mjs, reached through an injectable deps.sandbox and
//   loaded LAZILY from ./sandbox.mjs only when a collar axis runs — importing this file
//   never fails without it. The collar builds from ITS OWN root; a --root it does not
//   build from is refused (COLLAR-NOT-ARMED), never silently probed on another tree.
//
// COPIED, NEVER IMPORTED (the organism never imports the campaign folder). From
//   campaign-2026-09/tools/adjudicate.mjs, sha256
//   0e9bde3523b29483719d697bae7326db781facf23c6e58fd5a7b96d3213a129e (forks rows 363 /
//   364 / 365): tokenize (verbatim) · parseFlags (verbatim) · SED_SCRIPT (verbatim) ·
//   normalize (verbatim) · isAbs / fwd (verbatim) · the git / grep / sed / head / tail /
//   wc rows of VERB_TABLE (verbatim, their `rows` citations kept) · checkSegment and
//   runReceipt (ADAPTED: the snapshot path map and unit_slice are dropped, cd resolves
//   inside the probed tree, the node row is ours).
//
// WHO ELSE COULD ACT ON THIS OUTPUT? `vacuity` (law 8) reads the receipts of record; Stage
//   3.4's refuters D / E read B and C; Stage 3.5's `npm run probes` lane runs `run` +
//   `report`. None is wired yet — named here so none is a declared-but-unwired consumer by
//   surprise.
// CLI: node scripts/probe.mjs import --population <jsonl> --out <probes.jsonl>
//      node scripts/probe.mjs run --probes <f> --out <receipts.jsonl> [--ids a,b] [--root <dir>] [--timeout-ms N] [--host-only]
//      node scripts/probe.mjs vacuity --probes <f> --receipts <receipts of record> --out <vacuity.jsonl> [--ids a,b] [--root <dir>] [--timeout-ms N]
//      node scripts/probe.mjs status --probes <f> --receipts <f> [--root <dir>]
//      node scripts/probe.mjs report --receipts <f>
//      node scripts/probe.mjs selftest            (PROBE_SELFTEST_ONLY=<prefix> runs only the cases so named, and says so)
// EXIT: 0 ok · 1 selftest RED, or a run / vacuity wrote into --root (TREE-WRITTEN) · 2 usage / refused
// ============================================================================
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const HERE = path.dirname(SELF);
export const DEFAULT_ROOT = path.join(HERE, "..");
const NL = "\n";
const SEG_TIMEOUT_MS = 30000, OUTPUT_CAP = 1 << 20, HEAD_BYTES = 2048;
const RETRY_TRIES = 4, RETRY_BASE_MS = 250, SETTLE_MS = 5000, SETTLE_STEP_MS = 100;   // (g) · (f) B
const STATE_REL = path.join("dressing-room", "state");
const WIN = process.platform === "win32";

export const LANES = Object.freeze({
  host: Object.freeze(["host", "sandbox", "fixture"]),
  "live-readonly": Object.freeze(["host", "fixture", "fixture"]),
  sandbox: Object.freeze(["sandbox", "sandbox", "fixture"]),
  FIXTURE: Object.freeze(["fixture", "fixture", "fixture"]),
});
const COLLAR_AXES = new Set(["sandbox", "fixture"]);
const RUNNABLE_IF = Object.freeze({
  "PROBE-MALFORMED": "id is a string, lane is host | live-readonly | sandbox | FIXTURE, tier is 0 and reads[] is an array of repo paths",
  UNAUTHORED: "a TIER-0 predicate_cmd and its expect are authored from the claim, its seed receipt and the evidence",
  "EXPECT-MALFORMED": "expect carries at least one of exit (0-255) · stdout_includes[] · stdout_excludes[] · stdout_lines {op: == | >= | <=, n}, optionally reads_absent[] (paths of reads[] declared absent), and nothing else",
  UNPARSABLE: "predicate_cmd is words, quotes, `&&` and `|` only — no shell syntax",
  "VERB-OUTSIDE-AXIS": "every segment is in the organism verb table for every axis the lane runs on (node only on a collar axis)",
  "VERB-NOT-FOUND": "the verb resolves to an executable on PATH or in the usr/bin beside git",
  "COLLAR-NOT-ARMED": "scripts/sandbox.mjs loads beside probe.mjs, builds from --root, and assertArmed passes, its build and the fixture's state copy complete (a locked file is retried, bounded) (and the call is not --host-only)",
  "ARGV-UNFAITHFUL": "no word of a grep / sed / head / tail / wc segment opens with two backslashes (the MSYS runtime parses it back with one even quoted: measured 6 Oct 2026, row 545) — write the pattern another way",
  "TREE-WRITTEN": "the run leaves --root as it found it: git status --porcelain --ignored and the listing of its top level and of every cwd the run enters are unchanged, save what law 7f names as another writer's — the engine never deletes what a verb wrote: read it, remove it, re-run",
});

class Stop extends Error { constructor(msg, code = 2) { super(msg); this.code = code; } }
class CollarError extends Error {}
const sha256 = b => crypto.createHash("sha256").update(b).digest("hex");
// ---- copied verbatim from adjudicate.mjs (sha256 above)
const fwd = p => String(p).replace(/\\/g, "/");
const isAbs = p => /^([A-Za-z]:[\\/]|[\\/]|~)/.test(p) || /^[A-Za-z]:$/.test(p);
export const normalize = t => String(t).replace(/\r\n/g, "\n").split("\n").map(l => l.replace(/[ \t\f\v\r]+$/, "")).join("\n");

// ---------------------------------------------------------------------------- THE VERB TABLE (DATA, frozen)
// The adjudicator's git / grep / sed / head / tail / wc rows, verbatim with their flag rules (rows 363 (1) · 364 (2) ·
// 365 (1)); unit_slice and the snapshot path map are DROPPED; cd and node are this organism's own rows.
// exit_max (row 471 (1)(a) / (4)): every spawned verb's DECLARED exit set is 0..exit_max; a status above it, a signal,
// or a failed spawn is VERB-CRASHED, never a verdict. grep's set is its own --help; the rest are the fork's ruled 0/1
// (their --help states no set, so the stricter ruled set stands — git's die() = 128 is therefore a crash here too).
export const VERB_TABLE = Object.freeze([
  Object.freeze({ tool: "cd", rows: "V438 brief law 3", admits: "one relative argument resolving INSIDE the probed tree; never in a pipe",
    verbs: Object.freeze([]), flags: Object.freeze([]), refused: Object.freeze([]) }),
  Object.freeze({ tool: "node", rows: "V438 brief law 3 · row 460", axes: "collar", admits: "node scripts/<file>.mjs [args] — collar axes (sandbox / fixture) ONLY; no node option; no script outside scripts/",
    exit_max: 128, exits_cite: "Node's exit codes: 0-128 are its own and the script's; >128 is a signal exit",
    verbs: Object.freeze([]), flags: Object.freeze([]), refused: Object.freeze([]) }),
  Object.freeze({ tool: "git", rows: "363 (1) · 365 (1)", usage: "git-help", exit_max: 1, exits_cite: "fork 0353 (a), ruled row 471 (1)",
    admits: "git show|ls-files|log|cat-file with no global option and no write flag; spawned as git -C <cwd in snapshot> --no-pager (show/log also --no-ext-diff --no-textconv)",
    verbs: Object.freeze(["show", "ls-files", "log", "cat-file"]), flags: Object.freeze(["-C", "--no-pager"]),
    refused: Object.freeze(["-o", "--output", "--output-directory", "--ext-diff", "--textconv", "--filters", "--exec"]),
    refused_in_usage: false }),
  Object.freeze({ tool: "grep", rows: "363 (1) · 365 (1)", usage: "--help", exit_max: 2, exits_cite: "grep --help: 'Exit status is 0 if any line is selected, 1 otherwise; if any error occurs and -q is not given, the exit status is 2.'",
    errs: Object.freeze([2]), errs_cite: "the same --help sentence: 2 = an error occurred (row 545, law 7i)",
    admits: "grep [admitted flags] <pattern> [paths inside the snapshot]; -r only over the snapshot; never -R (it follows symlinks out of it); exact long names only (an abbreviation is not in the table)",
    short_bool: "nEFivcwxohHlLrsqP", short_val: "ABCme",
    long_bool: Object.freeze(["--line-number", "--extended-regexp", "--fixed-strings", "--ignore-case", "--invert-match", "--count", "--word-regexp", "--line-regexp", "--only-matching", "--no-filename", "--with-filename", "--files-with-matches", "--files-without-match", "--recursive", "--no-messages", "--quiet", "--perl-regexp"]),
    long_val: Object.freeze(["--after-context", "--before-context", "--context", "--max-count", "--regexp"]),
    verbs: Object.freeze([]), flags: null, refused: Object.freeze(["-f", "--file"]) }),
  Object.freeze({ tool: "sed", rows: "363 (1) · 364 (2) · 365 (1)", usage: "--help", exit_max: 1, exits_cite: "fork 0353 (a), ruled row 471 (1)",
    errs: Object.freeze([1]), errs_cite: "a print-only sed has no 'no match' status: its 1 is a failure (row 545, law 7i); its 2 (an input file not opened, measured 6 Oct on GNU sed 4.8) already lies outside the ruled 0..1 and is VERB-CRASHED by law 7a",
    admits: "sed -n '<script>' [paths]; the script ONLY line-address print commands (Np, N,Mp) joined by ';' inside the one argument",
    verbs: Object.freeze([]), flags: Object.freeze(["-n"]), refused: Object.freeze(["-i", "-e", "-f"]) }),
  Object.freeze({ tool: "head", rows: "363 (1) · 365 (1)", usage: "--help", exit_max: 1, exits_cite: "fork 0353 (a), ruled row 471 (1)", admits: "head [admitted flags] [paths]",
    errs: Object.freeze([1]), errs_cite: "head has no 'no match' status: its 1 is a failure, e.g. a missing file (row 545, law 7i)",
    short_bool: "qv", short_val: "nc", long_bool: Object.freeze(["--quiet", "--verbose"]), long_val: Object.freeze(["--lines", "--bytes"]), num_flag: true,
    verbs: Object.freeze([]), flags: null, refused: Object.freeze([]) }),
  Object.freeze({ tool: "tail", rows: "363 (1) · 365 (1)", usage: "--help", exit_max: 1, exits_cite: "fork 0353 (a), ruled row 471 (1)", admits: "tail [admitted flags] [paths]; never -f / -F",
    errs: Object.freeze([1]), errs_cite: "tail has no 'no match' status: its 1 is a failure, e.g. a missing file (row 545, law 7i)",
    short_bool: "qv", short_val: "nc", long_bool: Object.freeze(["--quiet", "--verbose"]), long_val: Object.freeze(["--lines", "--bytes"]), num_flag: true,
    verbs: Object.freeze([]), flags: null, refused: Object.freeze(["-f", "-F", "--follow"]) }),
  Object.freeze({ tool: "wc", rows: "363 (1) · 365 (1)", usage: "--help", exit_max: 1, exits_cite: "fork 0353 (a), ruled row 471 (1)", admits: "wc [admitted flags] [paths]",
    errs: Object.freeze([1]), errs_cite: "wc has no 'no match' status: its 1 is a failure, e.g. a missing file (row 545, law 7i)",
    short_bool: "lcwmL", short_val: "", long_bool: Object.freeze(["--lines", "--bytes", "--words", "--chars", "--max-line-length"]), long_val: Object.freeze([]),
    verbs: Object.freeze([]), flags: null, refused: Object.freeze(["--files0-from"]) }),
]);
const TABLE = Object.fromEntries(VERB_TABLE.map(r => [r.tool, r]));
export const EXTERNAL_VERBS = Object.freeze(["git", "grep", "sed", "head", "tail", "wc"]);

// ---------------------------------------------------------------------------- 1 · PARSE (no shell, ever)
// COPIED VERBATIM from adjudicate.mjs tokenize(): { ok, chain } where chain = [pipeline, …] joined by `&&`, pipeline =
// [segment, …] joined by `|`, segment = [word, …], word = { text, quoted }. Or { ok:false, reason, detail }.
export function tokenize(s) {
  const U = (reason, detail) => ({ ok: false, reason, detail });
  if (typeof s !== "string" || !s.trim()) return U("NO-CMD", "receipt.cmd is empty or not a string");
  const chain = [[[]]];
  let word = null;
  const seg = () => { const p = chain[chain.length - 1]; return p[p.length - 1]; };
  const endWord = () => { if (word) { seg().push(word); word = null; } };
  const take = (c, quoted = false) => { if (!word) word = { text: "", quoted: false }; word.text += c; if (quoted) word.quoted = true; };
  const NAMECH = /[A-Za-z_{(0-9@*#?$!-]/;
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === "'") {
      const j = s.indexOf("'", i + 1);
      if (j < 0) return U("UNTERMINATED-QUOTE", `a ' opened at ${i} never closes`);
      take("", true); word.text += s.slice(i + 1, j); i = j + 1; continue;
    }
    if (c === '"') {
      take("", true);
      let j = i + 1;
      for (;;) {
        if (j >= s.length) return U("UNTERMINATED-QUOTE", `a " opened at ${i} never closes`);
        const d = s[j];
        if (d === '"') break;
        if (d === "\\" && j + 1 < s.length && '"\\$`\n'.includes(s[j + 1])) { if (s[j + 1] !== "\n") word.text += s[j + 1]; j += 2; continue; }
        if (d === "`") return U("BACKTICK", `a backtick inside "…" at ${j}`);
        if (d === "$" && NAMECH.test(s[j + 1] || "")) return U(s[j + 1] === "(" ? "SUBSTITUTION" : "EXPANSION", `$${s[j + 1]} inside "…" at ${j}`);
        word.text += d; j++;
      }
      i = j + 1; continue;
    }
    if (c === "\\") {
      if (i + 1 >= s.length) return U("TRAILING-BACKSLASH", "the command ends in a bare backslash");
      if (s[i + 1] === "\n") { i += 2; continue; }
      take(s[i + 1], true); i += 2; continue;
    }
    if (c === " " || c === "\t") { endWord(); i++; continue; }
    if (c === "\n" || c === "\r") return U("NEWLINE", `a line break outside quotes at ${i} separates commands`);
    if (c === ";") return U("SEMICOLON", `';' outside quotes at ${i}`);
    if (c === "`") return U("BACKTICK", `a backtick outside quotes at ${i}`);
    if (c === "$") {
      if (s[i + 1] === "(") return U("SUBSTITUTION", `'$(' at ${i}`);
      if (NAMECH.test(s[i + 1] || "")) return U("EXPANSION", `'$${s[i + 1]}' at ${i}`);
      if (s[i + 1] === "'" || s[i + 1] === '"') return U("EXPANSION", `$-quoting at ${i}`);
      take(c); i++; continue;
    }
    if (c === "<" || c === ">") return U("REDIRECTION", `'${c}' outside quotes at ${i}`);
    if (c === "&") {
      if (s[i + 1] === "&") { endWord(); if (!seg().length) return U("EMPTY-SEGMENT", `nothing before '&&' at ${i}`); chain.push([[]]); i += 2; continue; }
      return U("BACKGROUND", `a single '&' at ${i}`);
    }
    if (c === "|") {
      if (s[i + 1] === "|") return U("OR-CHAIN", `'||' at ${i}`);
      endWord(); if (!seg().length) return U("EMPTY-SEGMENT", `nothing before '|' at ${i}`);
      chain[chain.length - 1].push([]); i++; continue;
    }
    if (c === "*" || c === "?" || c === "[") return U("GLOB", `'${c}' outside quotes at ${i}`);
    if (c === "(" || c === ")") return U("SUBSHELL", `'${c}' outside quotes at ${i}`);
    if (c === "{" || c === "}") return U("BRACE", `'${c}' outside quotes at ${i}`);
    if (c === "#" && !word) return U("COMMENT", `'#' begins a word at ${i}`);
    if (c === "~" && !word) return U("TILDE", `'~' begins a word at ${i}`);
    take(c); i++;
  }
  endWord();
  if (!seg().length) return U("EMPTY-SEGMENT", "the command ends in an operator");
  return { ok: true, chain };
}

// ---------------------------------------------------------------------------- 2 · THE TABLE CHECK (per axis)
// A path resolves ONLY inside the tree being probed: absolute = refused, `..` out of it = refused.
export function treePath(p, cwdRel, { cd = false } = {}) {
  const f = fwd(p);
  if (isAbs(f)) return { ok: false, reason: cd ? "CD-OUTSIDE-TREE" : "PATH-OUTSIDE-TREE" };
  const rel = path.posix.normalize(path.posix.join(cwdRel || ".", f));
  if (rel === ".." || rel.startsWith("../")) return { ok: false, reason: cd ? "CD-OUTSIDE-TREE" : "PATH-ESCAPES-TREE" };
  return { ok: true, rel: rel === "." ? "" : rel.replace(/\/+$/, "") };
}
const TREE = "<tree>";
// COPIED VERBATIM from adjudicate.mjs parseFlags(): generic flag parser for grep / head / tail / wc
function parseFlags(row, args) {
  const operands = []; let patternGiven = false, dashdash = false;
  const nope = a => ({ ok: false, reason: (row.refused || []).some(r => a === r || a.startsWith(`${r}=`) || (r.length === 2 && a.startsWith(r))) ? "FLAG-REFUSED" : "FLAG-NOT-IN-TABLE", detail: `${row.tool} ${a}` });
  for (let i = 0; i < args.length; i++) {
    const a = args[i].text;
    if (dashdash || a === "-" || !a.startsWith("-")) { operands.push(args[i]); continue; }
    if (a === "--") { dashdash = true; continue; }
    if (a.startsWith("--")) {
      const name = a.split("=")[0];
      if ((row.long_bool || []).includes(name) && !a.includes("=")) continue;
      if ((row.long_val || []).includes(name)) { if (!a.includes("=")) { if (i + 1 >= args.length) return { ok: false, reason: "FLAG-VALUE-MISSING", detail: a }; i++; } if (name === "--regexp") patternGiven = true; continue; }
      return nope(a);
    }
    if (row.num_flag && /^-\d+$/.test(a)) continue;
    const cl = a.slice(1);
    for (let k = 0; k < cl.length; k++) {
      const ch = cl[k];
      if ((row.short_bool || "").includes(ch)) continue;
      if ((row.short_val || "").includes(ch)) {
        if (k === cl.length - 1) { if (i + 1 >= args.length) return { ok: false, reason: "FLAG-VALUE-MISSING", detail: a }; i++; }
        if (ch === "e") patternGiven = true;
        break;
      }
      return nope(`-${ch}`);
    }
  }
  return { ok: true, operands, patternGiven };
}
function pathOperands(words, cwdRel) {
  const rels = [];
  for (const w of words) {
    if (w.text === "-") continue;
    const m = treePath(w.text, cwdRel);
    if (!m.ok) return { ok: false, reason: m.reason, detail: w.text.length > 120 ? `${w.text.slice(0, 120)}…` : w.text };
    rels.push(m.rel);
  }
  return { ok: true, rels };                                 // the tree paths the segment opens (law 7i's one exception reads them)
}
// law 7h: the text verbs ride Git for Windows' MSYS runtime; a word of theirs opening with two backslashes is altered even quoted
const TEXT_VERBS = new Set(["grep", "sed", "head", "tail", "wc"]);
export const argvUnfaithful = (tool, words) => (TEXT_VERBS.has(tool) ? words.find(w => w.text.startsWith("\\\\")) || null : null);
const SED_SCRIPT = /^\d+(,\d+)?p(;\d+(,\d+)?p)*$/;
const NODE_SCRIPT = /^scripts\/[A-Za-z0-9_.-]+\.mjs$/;
// ADAPTED from adjudicate.mjs checkSegment(): one segment on one axis → { ok, spec:{ tool, argv, cwd }, cwdAfter } or a refusal
export function checkSegment(words, cwdRel, inPipe, axis) {
  const R = (reason, detail) => ({ ok: false, reason, detail });
  const tool = words[0].text, args = words.slice(1);
  if (!TABLE[tool]) return R("VERB-NOT-IN-TABLE", tool.length > 60 ? `${tool.slice(0, 60)}…` : tool);
  if (tool === "cd") {
    if (inPipe) return R("CD-IN-PIPE", "a cd inside a pipeline changes nothing");
    if (args.length !== 1) return R("CD-OUTSIDE-TREE", `cd with ${args.length} arguments`);
    const m = treePath(args[0].text, cwdRel, { cd: true });
    if (!m.ok) return R(m.reason, args[0].text);
    return { ok: true, spec: { tool: "cd", argv: [m.rel], cwd: m.rel }, cwdAfter: m.rel };
  }
  if (tool === "node") {
    if (!COLLAR_AXES.has(axis)) return R("NODE-OFF-COLLAR", `node is admitted only on a collar axis (sandbox / fixture), never on ${axis}`);
    if (!args.length) return R("NODE-SCRIPT-NOT-IN-TABLE", "node with no script");
    if (args[0].text.startsWith("-")) return R("NODE-OPTION", `node ${args[0].text}`);
    const m = treePath(args[0].text, cwdRel);
    if (!m.ok || !NODE_SCRIPT.test(m.rel)) return R("NODE-SCRIPT-NOT-IN-TABLE", args[0].text);
    return { ok: true, spec: { tool: "node", argv: [`${TREE}/${m.rel}`, ...args.slice(1).map(w => w.text)], cwd: cwdRel } };
  }
  if (tool === "git") {
    const row = TABLE.git;
    if (!args.length) return R("GIT-SUBCOMMAND", "git with no subcommand");
    if (args[0].text.startsWith("-")) return R("GIT-GLOBAL-OPTION", `git ${args[0].text}`);
    const sub = args[0].text;
    if (!row.verbs.includes(sub)) return R("GIT-SUBCOMMAND", `git ${sub}`);
    const out = [];
    for (const w of args.slice(1)) {
      const a = w.text;
      // git takes an unambiguous ABBREVIATION of a long option (--outp=x is --output=x), so a prefix of a refused one is refused too
      const name = a.split("=")[0];
      if (row.refused.some(r => a === r || a.startsWith(`${r}=`) || (r === "-o" && /^-o./.test(a)) || (r.startsWith("--") && (a.startsWith(r) || (name.length > 2 && name.startsWith("--") && r.startsWith(name)))))) return R("GIT-WRITE-FLAG", `git ${sub} ${name}`);
      if (isAbs(fwd(a)) || /(^|\/)\.\.(\/|$)/.test(fwd(a))) {
        const m = treePath(a, cwdRel);
        if (!m.ok) return R(m.reason, a);
      }
      out.push(a);
    }
    const safe = sub === "show" || sub === "log" ? ["--no-ext-diff", "--no-textconv"] : [];
    return { ok: true, spec: { tool: "git", argv: ["-C", `${TREE}${cwdRel ? `/${cwdRel}` : ""}`, "--no-pager", sub, ...safe, ...out], cwd: cwdRel } };
  }
  if (tool === "sed") {
    if (!args.length || args[0].text !== "-n") return R("SED-FORM", `sed ${args[0] ? args[0].text : ""}`.trim().slice(0, 80));
    const script = args[1];
    if (!script) return R("SED-SCRIPT", "sed -n with no script");
    if (!SED_SCRIPT.test(script.text)) return R("SED-SCRIPT", `sed -n ${JSON.stringify(script.text).slice(0, 80)}`);
    if (script.text.includes(";") && !script.quoted) return R("SED-SCRIPT", "a ';' in a sed script outside its one quoted argument");
    for (const w of args.slice(2)) if (w.text.startsWith("-") && w.text !== "-") return R("FLAG-NOT-IN-TABLE", `sed ${w.text}`);
    const p = pathOperands(args.slice(2), cwdRel);
    if (!p.ok) return R(p.reason, p.detail);
    return { ok: true, spec: { tool: "sed", argv: args.map(w => w.text), cwd: cwdRel, paths: p.rels } };
  }
  // grep · head · tail · wc
  const row = TABLE[tool];
  const f = parseFlags(row, args);
  if (!f.ok) return R(f.reason, f.detail);
  let ops = f.operands;
  if (tool === "grep" && !f.patternGiven) { if (!ops.length) return R("GREP-NO-PATTERN", "grep with no pattern"); ops = ops.slice(1); }
  const p = pathOperands(ops, cwdRel);
  if (!p.ok) return R(p.reason, p.detail);
  return { ok: true, spec: { tool, argv: args.map(w => w.text), cwd: cwdRel, paths: p.rels } };
}
// the whole predicate on one axis → { class: RUNNABLE, plan } or { class: UNRUNNABLE, why, reason, detail }
export function classify(cmd, axis) {
  const t = tokenize(cmd);
  if (!t.ok) return { class: "UNRUNNABLE", why: "UNPARSABLE", reason: t.reason, detail: t.detail };
  let cwd = "";
  const plan = [];
  for (const pipeline of t.chain) {
    const specs = [];
    for (const segment of pipeline) {
      const u = argvUnfaithful(segment[0].text, segment.slice(1));
      if (u) return { class: "UNRUNNABLE", why: "ARGV-UNFAITHFUL", reason: "ARGV-UNFAITHFUL", detail: `${segment[0].text} ${u.text.length > 80 ? `${u.text.slice(0, 80)}…` : u.text}` };
      const c = checkSegment(segment, cwd, pipeline.length > 1, axis);
      if (!c.ok) return { class: "UNRUNNABLE", why: "VERB-OUTSIDE-AXIS", reason: c.reason, detail: c.detail, axis };
      specs.push(c.spec);
      if (c.cwdAfter !== undefined) cwd = c.cwdAfter;
    }
    plan.push(specs);
  }
  return { class: "RUNNABLE", plan };
}

// ---------------------------------------------------------------------------- 3 · VERB RESOLUTION (at start)
// PATH first, then the usr/bin beside git (Git for Windows ships grep / sed / head / tail / wc there, off PATH).
// On win32 only .exe / .com are taken: a .cmd / .bat cannot be spawned without a shell, and this file has none.
export function resolveVerbs({ env = process.env, platform = process.platform } = {}) {
  const win = platform === "win32";
  const PATHV = String(env.PATH || env.Path || "");
  const dirs = PATHV.split(win ? ";" : ":").filter(Boolean);
  const exts = win ? [".exe", ".com"] : [""];
  const isExe = p => { try { const s = fs.statSync(p); if (!s.isFile()) return false; if (!win) fs.accessSync(p, fs.constants.X_OK); return true; } catch { return false; } };
  const find = (name, inDirs) => { for (const d of inDirs) for (const e of exts) { const p = path.join(d, name + e); if (isExe(p)) return p; } return null; };
  const out = {};
  for (const v of EXTERNAL_VERBS) out[v] = find(v, dirs);
  if (out.git) {
    const g = path.dirname(out.git);
    const beside = [path.join(g, "..", "usr", "bin"), path.join(g, "usr", "bin"), path.join(g, "..", "..", "usr", "bin")];
    for (const v of EXTERNAL_VERBS) if (!out[v]) { const p = find(v, beside); if (p) out[v] = path.resolve(p); }
  }
  out.node = process.execPath;
  return out;
}

// ---------------------------------------------------------------------------- 4 · THE EXPECTATION
const OUT_KEYS = ["exit", "stdout_includes", "stdout_excludes", "stdout_lines"];
const EXPECT_KEYS = [...OUT_KEYS, "reads_absent"];
// → null when well-formed, else the reason. reads_absent is a DECLARATION (row 471 (1)(c)), never an expectation alone.
export function expectProblem(e) {
  if (!e || typeof e !== "object" || Array.isArray(e)) return "expect is not an object";
  const keys = Object.keys(e);
  if (!keys.length) return "expect carries no key";
  const extra = keys.filter(k => !EXPECT_KEYS.includes(k));
  if (extra.length) return `expect carries unknown key(s): ${extra.join(", ")}`;
  if (!keys.some(k => OUT_KEYS.includes(k))) return `expect carries none of ${OUT_KEYS.join(" / ")}`;
  if ("reads_absent" in e && !(Array.isArray(e.reads_absent) && e.reads_absent.length && e.reads_absent.every(s => typeof s === "string" && s.length))) return "expect.reads_absent is not a non-empty array of non-empty strings";
  if ("exit" in e && !(Number.isInteger(e.exit) && e.exit >= 0 && e.exit <= 255)) return "expect.exit is not an integer 0-255";
  for (const k of ["stdout_includes", "stdout_excludes"]) if (k in e && !(Array.isArray(e[k]) && e[k].length && e[k].every(s => typeof s === "string" && s.length))) return `expect.${k} is not a non-empty array of non-empty strings`;
  if ("stdout_lines" in e) {
    const l = e.stdout_lines;
    if (!l || typeof l !== "object" || Array.isArray(l) || Object.keys(l).sort().join(",") !== "n,op" || !["==", ">=", "<="].includes(l.op) || !(Number.isInteger(l.n) && l.n >= 0)) return "expect.stdout_lines is not {op: == | >= | <=, n: integer >= 0}";
  }
  return null;
}
export const lineCount = t => { const s = normalize(t); if (!s) return 0; const a = s.split("\n"); return a[a.length - 1] === "" ? a.length - 1 : a.length; };
// every key given must hold
export function expectHolds(e, run) {
  const out = normalize(run.stdout);
  if ("exit" in e && run.exit !== e.exit) return false;
  if ("stdout_includes" in e && !e.stdout_includes.every(s => out.includes(normalize(s)))) return false;
  if ("stdout_excludes" in e && e.stdout_excludes.some(s => out.includes(normalize(s)))) return false;
  if ("stdout_lines" in e) {
    const n = lineCount(out), { op, n: want } = e.stdout_lines;
    if (op === "==" && n !== want) return false;
    if (op === ">=" && n < want) return false;
    if (op === "<=" && n > want) return false;
  }
  return true;
}

// A CRASH IS NEVER A VERDICT (row 471 (1)(a) / (4)): → null when the segment ended inside its verb's declared exit set,
// else what crashed. `r` is spawnSync's result; a timeout / the output cap are handled before this and are not crashes.
export function crashOf(tool, r) {
  const max = TABLE[tool] && Number.isInteger(TABLE[tool].exit_max) ? TABLE[tool].exit_max : 0;
  const c = why => ({ verb: tool, status: r.status ?? null, signal: r.signal || null, exit_max: max, why });
  if (r.error) return c(`spawn failed (${r.error.code || "error"})`);
  if (r.status === null || r.status === undefined) return c(`killed by ${r.signal || "a signal"}`);
  if (!(Number.isInteger(r.status) && r.status >= 0 && r.status <= max)) return c(`exit ${r.status} outside its declared 0..${max}`);
  return null;
}

// ---------------------------------------------------------------------------- 5 · RUN (spawn only, never a shell)
// THE ONE SPAWN of a predicate segment. `SPAWNS` counts every call and keeps the last options, so the selftest can
// prove shell:false and windowsHide:true on the path actually taken.
export const SPAWNS = { count: 0, last: null };
// law 7h: one word → the form the Windows command line must carry for its program to parse back exactly that word (the
// CommandLineToArgvW / MSYS rule: a quote is escaped, the backslashes before a quote or before the closing quote doubled)
export const winQuote = a => `"${String(a).replace(/(\\*)"/g, (m, b) => `${b}${b}\\"`).replace(/(\\+)$/, "$1$1")}"`;
// → { argv, extra } for spawnSync(bin, argv, { ...opts, ...extra }): on win32 every word quoted by THIS file, node quoting
// nothing (windowsVerbatimArguments), the program path quoted as argv0; elsewhere the words as they are
export function spawnForm(bin, args, win = WIN) {
  return win ? { argv: args.map(winQuote), extra: { windowsVerbatimArguments: true, argv0: winQuote(bin) } } : { argv: args, extra: {} };
}
function spawnSegment(bin, args, o) {
  SPAWNS.count++;
  const f = spawnForm(bin, args);
  const opts = { cwd: o.cwd, input: o.input, timeout: o.timeout, maxBuffer: o.cap, shell: false, env: o.env, windowsHide: true, killSignal: "SIGKILL", ...f.extra };
  SPAWNS.last = { bin, args, argv: f.argv, shell: opts.shell, windowsHide: opts.windowsHide, verbatim: Boolean(opts.windowsVerbatimArguments), cwd: opts.cwd };
  return spawnSync(bin, f.argv, opts);
}
// law 7i: → the error a segment's status is, or null (a status in its verb's errs, outside law 7a's crash)
export function errorOf(tool, r) {
  const errs = TABLE[tool] && TABLE[tool].errs;
  if (!errs || !errs.includes(r.status)) return null;
  const e = Buffer.isBuffer(r.stderr) ? r.stderr.toString("utf8") : String(r.stderr || "");
  return { verb: tool, status: r.status, stderr: normalize(e).trim().slice(0, 300) };
}
// the one exception: every tree path of the segment that is absent in `tree` is declared absent, and there is at least one
export function declaredAbsence(spec, tree, declared) {
  if (!declared || !declared.size || !Array.isArray(spec.paths)) return null;
  const gone = spec.paths.filter(p => p && !fs.existsSync(joinRel(tree, p)));
  return gone.length && gone.every(p => declared.has(p)) ? gone : null;
}
export const nodeLabel = k => `probe-seg-${k}`;
const ENV_KEEP = ["PATH", "Path", "PATHEXT", "SYSTEMROOT", "SystemRoot", "WINDIR", "COMSPEC", "TEMP", "TMP", "TMPDIR", "HOME", "USERPROFILE", "LANG", "LC_ALL", "LC_CTYPE"];
function hostEnv() { const env = {}; for (const k of ENV_KEEP) if (process.env[k] !== undefined) env[k] = process.env[k]; return env; }
const joinRel = (base, rel) => (rel ? path.join(base, ...rel.split("/")) : base);
// ADAPTED from adjudicate.mjs runReceipt(): one plan inside one tree → { exit, stdout, seconds, timed_out, capped, crashed,
// errored, declared_absent, node_segs }. A segment that ends outside its verb's declared exit set ends the plan there:
// crashed names it, exit keeps its raw status. Law 7i: a segment ending in its verb's ERROR status ends it too, wherever it
// sits in its pipeline (errored names it), unless o.declared (a Set of tree paths) explains it — then declared_absent
// names the paths and the plan goes on. Law 9: each node segment runs labelled (nodeLabel(k)), and node_segs lists them.
export function runPlan(plan, tree, env, o) {
  const timeout = o.timeout || SEG_TIMEOUT_MS, cap = o.cap || OUTPUT_CAP, verbs = o.verbs;
  const real = a => (a === TREE ? tree : a.startsWith(`${TREE}/`) ? joinRel(tree, a.slice(TREE.length + 1)) : a);
  const genv = { ...env, GIT_CEILING_DIRECTORIES: path.dirname(path.resolve(tree)), GIT_PAGER: "cat" };
  const t0 = process.hrtime.bigint();
  let out = Buffer.alloc(0), exit = 0, cwd = "", timedOut = false, capped = false, crashed = null, errored = null, declaredAbsent = null, k = 0;
  const nodeSegs = [];
  outer: for (const pipeline of plan) {
    if (pipeline.length === 1 && pipeline[0].tool === "cd") {
      let isDir = false; try { isDir = fs.statSync(joinRel(tree, pipeline[0].cwd)).isDirectory(); } catch {}
      if (!isDir) { exit = 1; break; }
      cwd = pipeline[0].cwd; exit = 0; continue;
    }
    let input = Buffer.alloc(0), last = null;
    for (const s of pipeline) {
      const bin = verbs[s.tool], seg = k++;
      const senv = s.tool === "node" ? { ...genv, ARSENAL_AUDIT_LABEL: nodeLabel(seg) } : genv;
      const r = spawnSegment(bin, s.argv.map(real), { cwd: joinRel(tree, cwd), input, timeout, cap, env: senv });
      if (s.tool === "node") nodeSegs.push({ seg, label: nodeLabel(seg), script: String(s.argv[0]).replace(`${TREE}/`, ""), status: r.status ?? null });
      if (r.error && r.error.code === "ETIMEDOUT") { timedOut = true; out = Buffer.concat([out, r.stdout || Buffer.alloc(0)]); exit = null; break outer; }
      if (r.error && r.error.code === "ENOBUFS") { capped = true; out = Buffer.concat([out, r.stdout || Buffer.alloc(0)]); exit = null; break outer; }
      crashed = crashOf(s.tool, r);
      if (crashed) { out = Buffer.concat([out, r.stdout || Buffer.alloc(0)]); exit = crashed.status; break outer; }
      const er = errorOf(s.tool, r);
      if (er) {
        const gone = declaredAbsence(s, tree, o.declared);
        if (!gone) { errored = { ...er, segment: seg }; out = Buffer.concat([out, r.stdout || Buffer.alloc(0)]); exit = er.status; break outer; }
        declaredAbsent = [...new Set([...(declaredAbsent || []), ...gone])];
      }
      last = { status: r.status, stdout: r.stdout || Buffer.alloc(0) };
      input = last.stdout;
    }
    out = Buffer.concat([out, last.stdout]);
    exit = last.status;
    if (out.length > cap) { out = out.subarray(0, cap); capped = true; exit = null; break; }
    if (exit !== 0) break;           // `&&`: a failed link ends the chain, as the shell would
  }
  const seconds = Number((Number(process.hrtime.bigint() - t0) / 1e9).toFixed(3));
  return { exit, stdout: normalize(out.toString("utf8")), bytes: out.length, seconds, timed_out: timedOut, capped, crashed, errored, declared_absent: declaredAbsent, node_segs: nodeSegs };
}
// law 9: the node segments of one traced collar run → [{ seg, script, status, reads, code_reads, writes, spawns, silent }].
// MEASURED 6 Oct 2026 on the real preload (witness_v33 member 8 found it): Node's module loader shows as reads — the entry
// script and every static or dynamic import, each a readFileSync + openSync of a .mjs file — so a script that does nothing
// "read" its own code. A read of a code file (.mjs / .cjs / .js) is therefore counted apart as code_reads (distinct paths),
// and `reads` counts every other file. The edge, named: a script that reads code files as DATA and touches nothing else
// reads SILENT-SUCCESS.
const CODE_FILE = /\.(mjs|cjs|js)$/i;
export function nodeTrace(nodeSegs, traceRows) {
  return nodeSegs.map(n => {
    const rows = traceRows.filter(x => x && x.organ === n.label);
    const c = ev => rows.filter(x => x.ev === ev).length;
    const rd = rows.filter(x => x.ev === "read"), code = rd.filter(x => CODE_FILE.test(String(x.path || "")));
    const t = { seg: n.seg, script: n.script, status: n.status, reads: rd.length - code.length, code_reads: new Set(code.map(x => String(x.path))).size, writes: c("write"), spawns: c("spawn") };
    return { ...t, silent: t.status === 0 && t.reads + t.writes + t.spawns === 0 };
  });
}
const readTrace = f => { try { return fs.readFileSync(f, "utf8").split(/\r?\n/).filter(l => l.trim()).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return null; } };

// ---------------------------------------------------------------------------- 6 · THE AXES
function walkFiles(dir, base = dir, acc = []) {
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of ents.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, base, acc); else acc.push(p);
  }
  return acc;
}
// the state copy's fingerprint: every file's relative path and sha256, sorted
export function hashTree(dir) {
  if (!fs.existsSync(dir)) return "absent";
  const lines = walkFiles(dir).map(p => `${fwd(path.relative(dir, p))}\0${sha256(fs.readFileSync(p))}`);
  return sha256(Buffer.from(lines.join("\n"), "utf8"));
}
function setMode(dir, mode) { for (const p of walkFiles(dir)) { try { fs.chmodSync(p, mode); } catch {} } }
const samePath = (a, b) => { const n = p => { let r = path.resolve(p); try { r = fs.realpathSync.native(r); } catch {} return WIN ? r.toLowerCase() : r; }; return n(a) === n(b); };
const inside = (child, parent) => { const n = p => { let r = path.resolve(p); try { r = fs.realpathSync.native(r); } catch {} return WIN ? r.toLowerCase() : r; }; const rel = path.relative(n(parent), n(child)); return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel)); };

async function collarOf(ctx) {
  if (!ctx._collar) {
    if (ctx.deps.sandbox) ctx._collar = { mod: ctx.deps.sandbox };
    else {
      try { ctx._collar = { mod: await import(pathToFileURL(path.join(HERE, "sandbox.mjs")).href) }; }
      catch (e) { ctx._collar = { error: `scripts/sandbox.mjs could not be loaded beside probe.mjs (${e && e.code ? e.code : "load failed"})` }; }
    }
    const m = ctx._collar.mod;
    if (m && !(typeof m.buildSandbox === "function" && typeof m.assertArmed === "function" && typeof m.destroy === "function")) ctx._collar = { error: "the collar module lacks buildSandbox / assertArmed / destroy" };
    else if (m && !(m.ROOT && samePath(m.ROOT, ctx.root))) ctx._collar = { error: `the collar builds from its own ROOT, which is not --root (${fwd(m.ROOT || "?")} vs ${fwd(ctx.root)})` };
  }
  if (ctx.hostOnly) throw new CollarError(`--host-only: the collar axes are not run on this call${ctx._collar.error ? ` (nor could they be: ${ctx._collar.error})` : ""}`);
  if (ctx._collar.error) throw new CollarError(ctx._collar.error);
  return ctx._collar.mod;
}
// READ-ABSENT (row 471 (1)(c)): the reads[] paths (line suffix stripped) not present in this axis's tree; a path that is
// not a tree path at all can never be present. `check` excludes what expect.reads_absent declares absent.
export function absentReads(tree, check) {
  return check.filter(r => { const m = treePath(r, ""); return !(m.ok && fs.existsSync(joinRel(tree, m.rel))); });
}
const NOT_RUN = Object.freeze({ exit: null, stdout: "", bytes: 0, seconds: 0, timed_out: false, capped: false, crashed: null });
// (g) A LOCKED FILE: the code of a lock error (EDOM = Node reading Windows' ERROR_LOCK_VIOLATION 33 as an errno), else null
const LOCKED = new Set(["EDOM", "EBUSY"]);
export const lockedCode = e => { const c = e && (e.code || (/^(EDOM|EBUSY)\b/.exec(String(e.message || "")) || [])[1]); return LOCKED.has(c) ? c : null; };
const sleepSync = ms => { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); };
// one step of the collar, retried on a LOCKED file only, at most `tries` attempts, the wait doubling from baseMs. Every
// failed attempt is pushed onto `named` (the run's `retries`); exhausted = a CollarError naming the lock. Any other error
// is thrown on its first attempt, never retried.
export function retryLocked(step, fn, named, { tries = RETRY_TRIES, baseMs = RETRY_BASE_MS, sleep = sleepSync } = {}) {
  for (let a = 1; ; a++) {
    try { return fn(); }
    catch (e) {
      const code = lockedCode(e);
      if (!code) throw e;
      named.push({ step, code, attempt: a, error: String(e && e.message || e).slice(0, 200) });
      if (a >= tries) throw new CollarError(`${step} stayed locked after ${a} attempt(s), ${code}: ${String(e && e.message || e).slice(0, 200)}`);
      sleep(baseMs * 2 ** (a - 1));
    }
  }
}
// one run on one axis → the run's observed fields (held is set by the caller)
async function runAxis(axis, plan, ctx, { remove = [], check = [], declared = null } = {}) {
  const o = { verbs: ctx.verbs, timeout: ctx.timeout, cap: ctx.cap, declared };
  if (axis === "host") { const ab = absentReads(ctx.root, check); return ab.length ? { ...NOT_RUN, read_absent: ab } : { ...runPlan(plan, ctx.root, hostEnv(), o) }; }
  const collar = await collarOf(ctx);
  const retries = [], ro = ctx.deps.retryBaseMs ? { baseMs: ctx.deps.retryBaseMs } : {};
  const hasNode = plan.some(pl => pl.some(s => s.tool === "node"));      // law 9: the trace only where a node segment runs
  let sb;
  try { sb = retryLocked("buildSandbox", () => collar.buildSandbox({ trace: hasNode }), retries, ro); }
  catch (e) { if (e instanceof CollarError) throw e; throw new CollarError(`buildSandbox threw: ${String(e && e.message || e).slice(0, 200)}`); }
  const stateDir = path.join(sb.root, STATE_REL);
  try {
    try { collar.assertArmed(sb); }
    catch (e) { throw new CollarError(`assertArmed refused: ${String(e && e.message || e).slice(0, 200)}`); }
    const extra = { retries };
    if (axis === "fixture") {
      const live = path.join(ctx.root, STATE_REL), copy = ctx.deps.copyState || ((from, to) => fs.cpSync(from, to, { recursive: true, force: true }));
      if (fs.existsSync(live)) { fs.mkdirSync(stateDir, { recursive: true }); retryLocked("the fixture's state copy", () => copy(live, stateDir), retries, ro); }
    }
    for (const r of remove) { const m = treePath(r, ""); if (m.ok && m.rel) fs.rmSync(joinRel(sb.root, m.rel), { recursive: true, force: true }); }
    if (axis === "fixture") { setMode(stateDir, 0o444); extra.state_sha256 = hashTree(stateDir); }
    const ab = absentReads(sb.root, check);
    const r = ab.length ? { ...NOT_RUN, read_absent: ab } : runPlan(plan, sb.root, { ...sb.env }, o);
    if (axis === "fixture") { const after = hashTree(stateDir); extra.fixture_dirtied = after !== extra.state_sha256; }
    if (hasNode && !ab.length) { const rows = sb.trace ? readTrace(sb.trace) : null; extra.node_trace = rows ? nodeTrace(r.node_segs || [], rows) : null; if (!rows) extra.node_trace_why = "the collar kept no trace"; }
    return { ...r, ...extra };
  } finally {
    setMode(stateDir, 0o644);
    try { collar.destroy(sb); } catch {}
  }
}

// ---------------------------------------------------------------------------- 7 · THE PROBE → ITS RECEIPT
export const readsPath = r => fwd(String(r)).replace(/^\.\//, "").replace(/(:|@L)\d+(-\d+)?(,\d+(-\d+)?)*$/, "").replace(/\/+$/, "");
const Q = (why, reason = null, detail = null, axis = null) => ({ why, reason, detail, axis, runnable_if: RUNNABLE_IF[why] });
// the checks that need no tree: → { quarantine } or { plans: {axis: plan} }
export function staticCheck(p, verbs) {
  if (!p || typeof p !== "object" || typeof p.id !== "string" || !p.id || !LANES[p.lane] || p.tier !== 0 || !Array.isArray(p.reads) || !p.reads.every(r => typeof r === "string" && r))
    return { quarantine: Q("PROBE-MALFORMED", null, "id / lane / tier / reads[]") };
  if (p.predicate_cmd === null || p.predicate_cmd === undefined) return { quarantine: Q("UNAUTHORED", null, p.unrunnable_why || null) };
  const ep = expectProblem(p.expect);
  if (ep) return { quarantine: Q("EXPECT-MALFORMED", null, ep) };
  if (p.expect.reads_absent) {
    const rs = new Set(p.reads.map(readsPath)), off = p.expect.reads_absent.map(readsPath).filter(r => !rs.has(r));
    if (off.length) return { quarantine: Q("EXPECT-MALFORMED", null, `expect.reads_absent names ${off.join(", ")}, which reads[] does not`) };
  }
  const plans = {};
  for (const axis of new Set(LANES[p.lane])) {
    const c = classify(p.predicate_cmd, axis);
    if (c.class !== "RUNNABLE") return { quarantine: Q(c.why, c.reason, c.detail, c.why === "UNPARSABLE" || c.why === "ARGV-UNFAITHFUL" ? null : axis) };
    plans[axis] = c.plan;
  }
  for (const plan of Object.values(plans)) for (const pl of plan) for (const s of pl) if (s.tool !== "cd" && !verbs[s.tool]) return { quarantine: Q("VERB-NOT-FOUND", s.tool, `${s.tool} is not on PATH nor in the usr/bin beside git`) };
  return { plans };
}
const stubRun = (axis, cmd, why) => ({ axis, cmd, exit: null, stdout_sha256: null, stdout_head: "", bytes: 0, seconds: 0, timed_out: false, capped: false, crashed: null, errored: null, read_absent: null, tree_written: null, other_writer: null, retries: null, held: null, skipped: why });
function shapeRun(axis, cmd, r, expect) {
  const incomplete = r.timed_out || r.capped || Boolean(r.crashed) || Boolean(r.errored) || Boolean(r.read_absent);
  const o = { axis, cmd, exit: r.exit, stdout_sha256: sha256(Buffer.from(r.stdout, "utf8")), stdout_head: Buffer.from(r.stdout, "utf8").subarray(0, HEAD_BYTES).toString("utf8"),
    bytes: r.bytes, seconds: r.seconds, timed_out: r.timed_out, capped: r.capped, crashed: r.crashed || null, errored: r.errored || null, read_absent: r.read_absent || null, tree_written: null,
    other_writer: null, retries: r.retries && r.retries.length ? r.retries : null, held: incomplete ? null : expectHolds(expect, r) };
  if (r.declared_absent && r.declared_absent.length) o.declared_absent = r.declared_absent;   // law 7i's one exception, named
  if ("fixture_dirtied" in r) { o.state_sha256 = r.state_sha256; o.fixture_dirtied = r.fixture_dirtied; }
  if ("node_trace" in r) {                                                                     // law 9
    o.node_trace = r.node_trace;
    o.silent_success = r.node_trace ? r.node_trace.some(n => n.silent) : null;
    if (r.node_trace_why) o.node_trace_why = r.node_trace_why;
  }
  return o;
}
// why a run is incomplete (never held, never not-held), or null
export const incompleteWhy = r => (r.timed_out ? "timed out" : r.capped ? "hit the output cap" : r.crashed ? `VERB-CRASHED ${r.crashed.verb} ${r.crashed.why}`
  : r.errored ? `VERB-ERRORED ${r.errored.verb} exit ${r.errored.status}${r.errored.stderr ? `: ${r.errored.stderr.split(NL)[0].slice(0, 160)}` : ""}`
  : r.read_absent ? `READ-ABSENT ${r.read_absent.join(", ")}` : r.skipped ? `NOT-RUN ${r.skipped}` : null);
// law 9 · the receipt's reading: the collar runs whose node segment exited 0 touching nothing, or null when none ran traced
export function silentOf(runs) {
  const traced = runs.filter(r => r && Array.isArray(r.node_trace));
  if (!traced.length) return null;
  const hit = traced.filter(r => r.silent_success);
  return hit.length ? { reading: "SILENT-SUCCESS", why: `exit 0 with 0 reads, 0 writes, 0 spawns on ${hit.map(r => r.axis).join(" + ")}: ${[...new Set(hit.flatMap(r => r.node_trace.filter(n => n.silent).map(n => n.script)))].join(", ")}` }
    : { reading: "NOT-SILENT", why: `every traced node segment read, wrote or spawned, or did not exit 0 (${traced.length} run(s))` };
}
export function verdictOf(runs, quarantine) {
  if (quarantine) return { verdict: "UNRUNNABLE", why: null };
  const inc = runs.map((r, i) => { const w = incompleteWhy(r); return w ? `run ${i + 1} (${r.axis}) ${w}` : null; }).filter(Boolean);
  if (inc.length) return { verdict: "NON-DETERMINISTIC", why: `incomplete: ${inc.join("; ")}` };
  if (runs.every(r => r.held === true)) return { verdict: "CONFIRMED", why: null };
  if (runs.every(r => r.held === false)) return { verdict: "REFUTED", why: null };
  return { verdict: "NON-DETERMINISTIC", why: `mixed: ${runs.map(r => `${r.axis}=${r.held ? "held" : "not"}`).join(" ")}` };
}
// LENS B · pure: the seed confirmed a defect the probe now refutes
export function lensB(source, verdict) {
  const seed = source && source.verdict_claimed || null, aj = source && source.aj_final || null;
  return { seed, aj, now: verdict, reading: (seed === "CONFIRM" || seed === "EXTEND") && verdict === "REFUTED" ? "ALREADY-FIXED" : null };
}
// LENS C · this machine only: host and a collar axis disagree
export function lensC(runs) {
  const host = runs.filter(r => r.axis === "host" && r.held !== null), coll = runs.filter(r => COLLAR_AXES.has(r.axis) && r.held !== null);
  if (!host.length || !coll.length) return { split: null, why: host.length ? "no complete collar run" : "the lane has no complete host run" };
  const h = host[0].held, off = coll.filter(r => r.held !== h).map(r => r.axis);
  if (!off.length) return { split: "AGREE", why: null };
  return { split: h ? "HOST-ONLY" : "COLLAR-ONLY", why: `host ${h ? "held" : "did not hold"}; ${[...new Set(off)].join(" + ")} ${h ? "did not" : "held"}` };
}
// (f) THE TMP SHAPE of the organs' writeAtomic: <existing file>.<pid>.tmp
export const TMP_SHAPE = /^(.*[^/])\.(\d{1,10})\.tmp$/;
// one Win32_Process CSV row ("pid","ppid","session","name") → {pid, ppid, session, name}, or null (the header, a blank)
export function cimRow(l) {
  const m = /^"(\d+)","(\d*)","(\d*)","(.*)"$/.exec(String(l).trim());
  return m ? { pid: Number(m[1]), ppid: m[2] === "" ? null : Number(m[2]), session: m[3] === "" ? null : Number(m[3]), name: m[4] } : null;
}
// one /proc/<pid>/stat → {ppid, session, name}; the name (comm) may hold spaces and parentheses, so the fields are cut
// after its LAST ")": state ppid pgrp session …
export function statFields(s) {
  const f = s.slice(s.lastIndexOf(")") + 2).split(" ");
  return { ppid: Number(f[1]), session: Number(f[3]), name: s.slice(s.indexOf("(") + 1, s.lastIndexOf(")")) };
}
// ONE snapshot of the process table → Map pid → {ppid, session, name}, or null when it cannot be read (then nothing is confirmed)
export function procSnapshot() {
  const snap = new Map();
  try {
    if (WIN) {
      const r = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,SessionId,Name | ConvertTo-Csv -NoTypeInformation"], { encoding: "utf8", shell: false, windowsHide: true, timeout: SEG_TIMEOUT_MS });
      if (r.status !== 0) return null;
      for (const l of String(r.stdout).split(/\r?\n/)) { const c = cimRow(l); if (c) snap.set(c.pid, { ppid: c.ppid, session: c.session, name: c.name }); }
    } else if (fs.existsSync("/proc/self/stat")) {
      for (const d of fs.readdirSync("/proc")) {
        if (!/^\d+$/.test(d)) continue;
        let s; try { s = fs.readFileSync(`/proc/${d}/stat`, "utf8"); } catch { continue; }
        snap.set(Number(d), statFields(s));
      }
    } else {
      const r = spawnSync("ps", ["-A", "-o", "pid=", "-o", "ppid=", "-o", "comm="], { encoding: "utf8", shell: false, timeout: SEG_TIMEOUT_MS });
      if (r.status !== 0) return null;
      for (const l of String(r.stdout).split("\n")) { const m = /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(l); if (m) snap.set(Number(m[1]), { ppid: Number(m[2]), session: null, name: m[3].trim() }); }
    }
  } catch { return null; }
  return snap.size ? snap : null;
}
// is pid in the process tree rooted at `self` (this engine)? walks the ppid chain up the snapshot, bounded, cycle-safe
export function inOwnTree(pid, snap, self = process.pid) {
  const seen = new Set();
  for (let p = pid, i = 0; p !== null && p !== undefined && i < 64 && !seen.has(p); i++) {
    if (p === self) return true;
    seen.add(p);
    const e = snap.get(p);
    if (!e) return false;
    p = e.ppid;
  }
  return false;
}
// LAW 7f: the --root paths a run changed → { own: [stay TREE-WRITTEN], other: [{path, pid, session, name, rule}] }.
// collarRan = a collar axis whose collar ARMED and ran (rule A); anything else gets rule B. The snapshot is taken only
// when something was written; B's settle polls (async) so the other writer can finish its rename.
export async function attribute(written, ctx, { collarRan }) {
  const own = [], other = [], pending = [];
  if (!written.length) return { own, other };
  const snap = written.some(r => TMP_SHAPE.test(r)) ? (ctx.deps.procSnapshot || procSnapshot)() : null, self = process.pid;
  for (const rel of written) {
    const m = TMP_SHAPE.exec(rel), pid = m ? Number(m[2]) : null, e = m && snap ? snap.get(pid) || null : null;
    const facts = { path: rel, pid, session: e ? e.session : null, name: e ? e.name : null };
    if (m && snap && inOwnTree(pid, snap, self)) { own.push(rel); continue; }       // stricter than A, on every axis
    if (collarRan) { other.push({ ...facts, rule: "A" }); continue; }
    if (m && e) pending.push({ rel, base: m[1], facts }); else own.push(rel);
  }
  const settle = ctx.deps.settleMs ?? SETTLE_MS, t0 = Date.now(), still = x => fs.existsSync(joinRel(ctx.root, x.rel));
  for (let left = pending.filter(still); left.length && Date.now() - t0 < settle; left = left.filter(still)) await new Promise(res => setTimeout(res, SETTLE_STEP_MS));
  for (const x of pending) {
    if (!fs.existsSync(joinRel(ctx.root, x.rel)) && fs.existsSync(joinRel(ctx.root, x.base))) other.push({ ...x.facts, rule: "B" });
    else own.push(x.rel);
  }
  return { own: own.sort(), other };
}
// one run under THE TREE WATCHER: → { r, written, other } — written = the --root paths the run changed that law 7f does
// not name as another writer's (empty = untouched). A collar error is re-thrown carrying what was written before it,
// so a build that wrote is never filed as "not armed" — and a collar that failed proves nothing, so rule B judges it.
async function watched(axis, plan, ctx, o) {
  const dirs = watchDirs(axis, plan), before = treeView(ctx, dirs);
  let r = null, err = null;
  try { r = await runAxis(axis, plan, ctx, o); } catch (e) { err = e; }
  const att = await attribute(treeDiff(before, treeView(ctx, dirs)), ctx, { collarRan: !err && COLLAR_AXES.has(axis) });
  if (err) { if (err instanceof CollarError) { if (att.own.length) err.written = att.own; if (att.other.length) err.other_writer = att.other; } throw err; }
  return { r, written: att.own, other: att.other };
}
export async function runProbe(p, ctx) {
  const at = new Date().toISOString();
  const axes = p && LANES[p.lane] ? LANES[p.lane] : ["host", "host", "host"];
  const cmd = p && typeof p.predicate_cmd === "string" ? p.predicate_cmd : null;
  const reads = p && Array.isArray(p.reads) ? [...new Set(p.reads.map(readsPath))] : [];
  const dirty_reads = reads.filter(r => ctx.dirty.some(d => d === r || d.startsWith(`${r}/`)));
  const declaredAbsent = new Set(p && p.expect && Array.isArray(p.expect.reads_absent) ? p.expect.reads_absent.map(readsPath) : []);
  const check = reads.filter(r => !declaredAbsent.has(r));
  const sc = staticCheck(p, ctx.verbs);
  let quarantine = sc.quarantine || null;
  const runs = axes.map(() => null);
  const collarFail = (e, axis) => (e.written ? Q("TREE-WRITTEN", null, e.written.join(", "), axis) : Q("COLLAR-NOT-ARMED", null, e.message, axis));
  // (e) COLLAR FIRST: the collar runs execute before the host run (a stable sort keeps each group's lane order); runs[] keep the lane's order
  const order = axes.map((a, i) => i);
  if (!ctx.hostOnly) order.sort((i, j) => (axes[i] === "host") - (axes[j] === "host"));
  let collarCrash = null;
  if (!quarantine) {
    for (const i of order) {
      const axis = axes[i];
      if (axis === "host" && collarCrash) { runs[i] = stubRun(axis, cmd, `COLLAR-CRASHED — the plan crashed on ${collarCrash.axis} (${collarCrash.verb} ${collarCrash.why}); a crashed verb writes into its cwd, so it is never run on --root`); continue; }
      try {
        const w = await watched(axis, sc.plans[axis], ctx, { check, declared: declaredAbsent });
        const run = shapeRun(axis, cmd, w.r, p.expect);
        runs[i] = run;
        if (w.other.length) run.other_writer = w.other;
        if (w.written.length) { run.tree_written = w.written; run.held = null; quarantine = Q("TREE-WRITTEN", null, w.written.join(", "), axis); break; }
        if (run.crashed && COLLAR_AXES.has(axis) && !collarCrash) collarCrash = { axis, verb: run.crashed.verb, why: run.crashed.why };
      }
      catch (e) {
        if (!(e instanceof CollarError)) throw e;
        quarantine = collarFail(e, axis);
        if (e.other_writer) runs[i] = { ...stubRun(axis, cmd, quarantine.why), other_writer: e.other_writer };
        break;
      }
    }
  }
  for (let i = 0; i < runs.length; i++) if (!runs[i]) runs[i] = stubRun(axes[i], cmd, quarantine ? quarantine.why : "not run");
  let v = verdictOf(runs, quarantine);
  let A = { reading: "NOT-APPLICABLE", why: `verdict is ${v.verdict}` };
  if (v.verdict === "CONFIRMED" || v.verdict === "REFUTED") {
    const axis = LANES[p.lane].includes("sandbox") ? "sandbox" : "fixture";
    if (!reads.length) A = { reading: "NOT-APPLICABLE", why: "the probe names no reads[]" };
    else {
      try {
        // law 7i: the ablation removes reads[] ON PURPOSE, so an error those removals explain is declared, never VERB-ERRORED
        const w = await watched(axis, sc.plans[axis], ctx, { remove: reads, declared: new Set([...reads, ...declaredAbsent]) }), r = w.r, ow = w.other.length ? { other_writer: w.other } : {};
        if (w.written.length) { quarantine = Q("TREE-WRITTEN", null, w.written.join(", "), axis); v = verdictOf(runs, quarantine); A = { reading: "NOT-APPLICABLE", why: `the ablation run on ${axis} wrote into --root: ${w.written.join(", ")}`, axis, removed: reads, ...ow }; }
        else if (r.timed_out || r.capped || r.crashed || r.errored) A = { reading: "NOT-APPLICABLE", why: `the ablation run on ${axis} was incomplete${r.crashed || r.errored ? ` (${incompleteWhy(r)})` : ""}`, axis, removed: reads, ...ow };
        else {
          const held = expectHolds(p.expect, r), was = v.verdict === "CONFIRMED";
          A = held === was ? { reading: "VACUOUS", why: `held stayed ${held} on ${axis} with every reads[] path removed`, axis, removed: reads, ...ow }
            : { reading: "NOT-APPLICABLE", why: `held flipped ${was} → ${held} on ${axis} with reads[] removed: the predicate rests on them`, axis, removed: reads, ...ow };
        }
      } catch (e) {
        if (!(e instanceof CollarError)) throw e;
        if (e.written) { quarantine = collarFail(e, axis); v = verdictOf(runs, quarantine); }
        A = { reading: "NOT-APPLICABLE", why: `the ablation collar did not arm: ${e.message}`, ...(e.other_writer ? { other_writer: e.other_writer } : {}) };
      }
    }
  }
  return { probe_id: p && typeof p.id === "string" ? p.id : null, tree_sha: ctx.tree_sha, dirty_reads, runs, verdict: v.verdict, ...(v.why ? { verdict_why: v.why } : {}),
    lenses: { A, B: lensB(p && p.source, v.verdict), C: lensC(runs) }, silent: silentOf(runs), quarantine, at };
}

// ---------------------------------------------------------------------------- 7b · VACUITY (law 8 · Stage 3.2, forks rows 523 / 524)
const LINE_DEL = "LINE-DEL";
const OP_FILE = /\.(mjs|js|cjs)$/;                     // the lines mutagen's code operators take: mutagen's own target files
// one reads[] entry → { path, lines } — path:N · path:N-M · path@LN · comma lists of either; a bare path has lines null
export function citedLines(r) {
  const s = fwd(String(r)).replace(/^\.\//, "");
  const m = /^(.*?)(?::|@L)(\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*)$/.exec(s);
  if (!m) return { path: readsPath(s), lines: null };
  const lines = new Set();
  for (const part of m[2].split(",")) { const [a, b = a] = part.split("-").map(Number); for (let n = Math.min(a, b); n <= Math.max(a, b); n++) lines.add(n); }
  return { path: m[1].replace(/\/+$/, ""), lines: [...lines].sort((x, y) => x - y) };
}
// the line numbers a run PRINTED, per whole-file read: grep -n's `N:` (no file named → every whole-file read; an extra
// mutant at worst, and a flip there is still a flip of that line) and `path:N:` (its own read). A context line (`N-`) is
// not a match and is never cited.
export function printedLines(stdout, wholeReads) {
  const out = new Map(wholeReads.map(p => [p, new Set()]));
  for (const l of String(stdout).split("\n")) {
    let m = /^(\d+):/.exec(l);
    if (m) { for (const p of wholeReads) out.get(p).add(Number(m[1])); continue; }
    m = /^(.+?):(\d+):/.exec(l);
    if (m) { const f = fwd(m[1]).replace(/^\.\//, ""); for (const p of wholeReads) if (p === f || p.endsWith(`/${f}`)) out.get(p).add(Number(m[2])); }
  }
  return out;
}
// one cited line's mutants → [{ op, line, body }]: LINE-DEL (the line blanked), then each op that changes THE LINE ALONE
// (mutagen's functions, on an op file only). The line's own CR stays out of what an op sees and is kept on what it
// returns. A blank line, or a number past the last line, has none.
export function lineMutants(lines, n, file, ops) {
  if (!(n >= 1 && n <= lines.length) || (n === lines.length && lines[n - 1] === "")) return [];
  const raw = lines[n - 1], cr = raw.endsWith("\r"), body = cr ? raw.slice(0, -1) : raw, eol = cr ? "\r" : "";
  if (body === "") return [];
  const out = [{ op: LINE_DEL, line: n, body: eol }];
  if (OP_FILE.test(file)) for (const [op, fn] of Object.entries(ops || {})) {
    let nb; try { nb = fn(body); } catch { continue; }
    if (typeof nb === "string" && nb !== body) out.push({ op, line: n, body: nb + eol });
  }
  return out;
}
// row 524 (2): a mutation is written ONLY inside the collar's copy; any other target is refused before a byte is written
export function mutationGuard(target, collarRoot, root) {
  if (samePath(collarRoot, root) || inside(collarRoot, root) || inside(root, collarRoot) || !inside(target, collarRoot) || samePath(target, collarRoot))
    throw new Stop(`probe: REFUSED — a vacuity mutant targets ${fwd(target)}, which is not inside the collar's copy ${fwd(collarRoot)} (--root ${fwd(root)}); nothing was written`);
}
// COULD A DELETION FLIP IT? Judged key by key on the UNMUTATED run, because a mutant only ever takes text away. Held → some
// key a deletion can BREAK (exit 0 · an included string · a line count >= or ==). Not held → EVERY failing key is one a
// deletion can FIX (an exit other than 0 expected and 0 seen · an excluded string present · a line count <= or == that is
// too high); a failing key asking for MORE text (exit 0 · an included string missing · a count too low) no deletion can
// fix. A no-flip on a predicate no deletion could flip is NOT-DECIDABLE-BY-DELETION, never VACUOUS — so a REFUTED
// "the text is there" claim (F3's presence case) and a CONFIRMED "the text is NOT there" claim are both named, not
// graded. Conservative where a count verb blurs the line: an included digit that a deletion might produce reads as
// "asks for more text", so the label claims LESS, never more; a real flip is read first in every case.
export function deletionCanFlip(e, run, held) {
  if (!e || typeof e !== "object") return false;
  const lines = e.stdout_lines || null, inc = Array.isArray(e.stdout_includes) ? e.stdout_includes : [], exc = Array.isArray(e.stdout_excludes) ? e.stdout_excludes : [];
  if (held) return e.exit === 0 || inc.length > 0 || Boolean(lines && (lines.op === ">=" || lines.op === "=="));
  const out = normalize(run.stdout), n = lineCount(out);
  let failing = 0;
  if ("exit" in e && run.exit !== e.exit) { failing++; if (!(e.exit !== 0 && run.exit === 0)) return false; }
  if (inc.some(s => !out.includes(normalize(s)))) return false;
  if (exc.some(s => out.includes(normalize(s)))) failing++;
  if (lines) {
    const bad = lines.op === "==" ? n !== lines.n : lines.op === ">=" ? n < lines.n : n > lines.n;
    if (bad) { failing++; if (n < lines.n) return false; }
  }
  return failing > 0;
}
export function vacuityReading({ decidable, complete, flips }) {
  if (flips.length) return "NOT-VACUOUS";
  if (!complete) return "INCOMPLETE";
  return decidable ? "VACUOUS" : "NOT-DECIDABLE-BY-DELETION";
}
// mutagen.mjs's CODE_OPS beside probe.mjs (or in `dir`), unchanged — loaded only when `vacuity` runs
export async function loadCodeOps(dir = HERE) {
  let m;
  try { m = await import(pathToFileURL(path.join(dir, "mutagen.mjs")).href); }
  catch (e) { throw new Stop(`probe: REFUSED — vacuity takes mutagen.mjs's CODE_OPS from beside probe.mjs and it could not be loaded (${e && e.code ? e.code : String(e && e.message || e).slice(0, 120)}); nothing was spawned`); }
  const ops = m && m.CODE_OPS;
  if (!ops || typeof ops !== "object" || !Object.keys(ops).length || !Object.values(ops).every(f => typeof f === "function")) throw new Stop("probe: REFUSED — mutagen.mjs exports no CODE_OPS of functions; nothing was spawned");
  return ops;
}
// one probe's mutants inside ONE fresh collar → the reading's fields. Throws CollarError only before the collar armed.
async function vacuityInCollar(p, plan, axis, ctx, cites, was, onArmed) {
  const collar = await collarOf(ctx), ops = ctx._ops;
  const retries = [], ro = ctx.deps.retryBaseMs ? { baseMs: ctx.deps.retryBaseMs } : {};
  let sb;
  try { sb = retryLocked("buildSandbox", () => collar.buildSandbox({ trace: false }), retries, ro); }
  catch (e) { if (e instanceof CollarError) throw e; throw new CollarError(`buildSandbox threw: ${String(e && e.message || e).slice(0, 200)}`); }
  const stateDir = path.join(sb.root, STATE_REL);
  try {
    try { collar.assertArmed(sb); }
    catch (e) { throw new CollarError(`assertArmed refused: ${String(e && e.message || e).slice(0, 200)}`); }
    onArmed();
    const extra = retries.length ? { retries } : {};
    if (axis === "fixture") {
      const live = path.join(ctx.root, STATE_REL), copy = ctx.deps.copyState || ((from, to) => fs.cpSync(from, to, { recursive: true, force: true }));
      if (fs.existsSync(live)) { fs.mkdirSync(stateDir, { recursive: true }); retryLocked("the fixture's state copy", () => copy(live, stateDir), retries, ro); }
      setMode(stateDir, 0o444); extra.state_sha256 = hashTree(stateDir);
    }
    const declaredAbsent = new Set(p.expect && Array.isArray(p.expect.reads_absent) ? p.expect.reads_absent.map(readsPath) : []);
    const check = [...new Set(p.reads.map(readsPath))].filter(r => !declaredAbsent.has(r));
    const po = { verbs: ctx.verbs, timeout: ctx.timeout, cap: ctx.cap, declared: declaredAbsent };   // law 7i on every mutant run too
    const once = () => { const ab = absentReads(sb.root, check); return ab.length ? { ...NOT_RUN, read_absent: ab } : runPlan(plan, sb.root, { ...sb.env }, po); };
    const b = once(), bw = incompleteWhy(b);
    const baseline = { exit: b.exit, held: bw ? null : expectHolds(p.expect, b), stdout_sha256: sha256(Buffer.from(b.stdout, "utf8")), seconds: b.seconds, ...(bw ? { incomplete: bw } : {}) };
    if (bw) return { reading: "INCOMPLETE", why: `the unmutated baseline run was incomplete: ${bw} — nothing mutated`, baseline, ...extra };
    if (baseline.held !== was) return { reading: "BASELINE-DIFFERS", why: `the unmutated collar run ${baseline.held ? "held" : "did not hold"}, the verdict of record is ${was ? "CONFIRMED" : "REFUTED"} — nothing mutated`, baseline, ...extra };
    // what is cited: the windows, then the lines the baseline printed for each whole-file read
    const targets = new Map();
    for (const c of cites) if (c.lines) { const s = targets.get(c.path) || new Set(); for (const n of c.lines) s.add(n); targets.set(c.path, s); }
    const no_window = [];
    for (const [f, s] of printedLines(b.stdout, [...new Set(cites.filter(c => !c.lines).map(c => c.path))])) {
      if (s.size) { const t = targets.get(f) || new Set(); for (const n of s) t.add(n); targets.set(f, t); }
      else if (!targets.has(f)) no_window.push(f);
    }
    if (!targets.size) return { reading: "NO-WINDOW", why: `no read cites a line and the baseline printed none (${no_window.join(", ")}): the deletion floor (A_floor) stands`, baseline, no_window, ...extra };
    const cited = {}, flips = [], incomplete = [], skipped = [];
    let tried = 0;
    for (const [rel, set] of [...targets].sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0))) {
      const m = treePath(rel, "");
      if (!m.ok || !m.rel) { skipped.push({ path: rel, why: `not a tree path (${m.reason || "the root"})` }); continue; }
      const file = joinRel(sb.root, m.rel);
      mutationGuard(file, sb.root, ctx.root);
      let orig; try { orig = fs.readFileSync(file); } catch { skipped.push({ path: rel, why: "absent in the collar's copy" }); continue; }
      const sha0 = sha256(orig), lines = orig.toString("utf8").split("\n"), last = lines[lines.length - 1] === "" ? lines.length - 1 : lines.length;
      const ns = [...set].sort((x, y) => x - y), past = ns.filter(n => n > last);
      if (past.length) skipped.push({ path: rel, why: `line(s) past its last line ${last}: ${past.join(",")}` });
      cited[rel] = ns.filter(n => n <= last);
      const ro = axis === "fixture" && inside(file, stateDir);
      for (const n of cited[rel]) for (const mu of lineMutants(lines, n, rel, ops)) {
        const text = lines.slice(); text[n - 1] = mu.body;
        if (ro) fs.chmodSync(file, 0o644);
        fs.writeFileSync(file, text.join("\n"));
        let r;
        try { r = once(); }
        finally { fs.writeFileSync(file, orig); if (ctx.deps.afterRestore) ctx.deps.afterRestore(file); if (ro) fs.chmodSync(file, 0o444); }
        tried++;
        if (sha256(fs.readFileSync(file)) !== sha0) return { reading: "RESTORE-MISMATCH", why: `${rel} did not restore to the bytes the collar built after ${mu.op} at line ${n} — the probe is REFUSED`, baseline, cited, mutants_tried: tried, flips, incomplete, ...extra };
        const w = incompleteWhy(r);
        if (w) { incomplete.push({ op: mu.op, path: rel, line: n, why: w }); continue; }
        if (expectHolds(p.expect, r) !== was) flips.push({ op: mu.op, path: rel, line: n });
      }
    }
    if (axis === "fixture") extra.fixture_dirtied = hashTree(stateDir) !== extra.state_sha256;
    const complete = tried - incomplete.length, decidable = deletionCanFlip(p.expect, b, was);
    const reading = vacuityReading({ decidable, complete, flips });
    const nLines = Object.values(cited).reduce((s, a) => s + a.length, 0), resting = new Set(flips.map(f => `${f.path}:${f.line}`)).size;
    const why = reading === "NOT-VACUOUS" ? `${flips.length} of ${complete} complete mutant(s) flipped held, on ${resting} of ${nLines} cited line(s); first: ${flips[0].op} at ${flips[0].path}:${flips[0].line}`
      : reading === "INCOMPLETE" ? `no mutant run completed (${incomplete.length} incomplete${tried ? "" : ", none tried"})`
      : reading === "NOT-DECIDABLE-BY-DELETION" ? `${was ? "CONFIRMED" : "REFUTED"} and no deletion of text could flip it (its ${was ? "holding" : "failing"} keys ask for ${was ? "text to be absent" : "more text"}): ${complete} complete mutant(s) over ${nLines} cited line(s), none flipped — the insertion co-flip is to be built`
      : `${complete} complete mutant(s) over ${nLines} cited line(s), none flipped held: the predicate does not rest on the lines its claim cites`;
    return { reading, why, baseline, cited, ...(no_window.length ? { no_window } : {}), mutants_tried: tried, mutants_complete: complete, lines_resting: resting, flips, first_flip: flips[0] || null, incomplete, ...(skipped.length ? { skipped } : {}), deletion_can_flip: decidable, ...extra };
  } finally {
    setMode(stateDir, 0o644);
    try { collar.destroy(sb); } catch {}
  }
}
// one probe + its receipt of record → its VACUITY receipt. `moved` = the paths changed between the receipt's tree and HEAD
// (null = that tree is not in this repo).
export async function vacuityProbe(p, rec, ctx, moved) {
  const at = new Date().toISOString();
  const base = { probe_id: p && typeof p.id === "string" ? p.id : null, tree_sha: ctx.tree_sha, receipt_tree_sha: rec ? rec.tree_sha || null : null, verdict: rec ? rec.verdict : null,
    A_floor: rec && rec.lenses && rec.lenses.A ? rec.lenses.A.reading || null : null };
  const done = (reading, why, extra = {}) => ({ ...base, reading, why, ...extra, at });
  if (!rec) return done("NOT-APPLICABLE", "no receipt of record for this probe");
  if (rec.verdict !== "CONFIRMED" && rec.verdict !== "REFUTED") return done("NOT-APPLICABLE", `the verdict of record is ${rec.verdict}`);
  const sc = staticCheck(p, ctx.verbs);
  if (sc.quarantine) return done("NOT-APPLICABLE", `the probe is on the register now: ${sc.quarantine.why}`);
  const cites = p.reads.map(citedLines), paths = [...new Set(cites.map(c => c.path))];
  if (moved === null) return done("STALE", `the receipt's tree ${String(rec.tree_sha).slice(0, 12)} is not in this repo — its line numbers cannot be trusted`);
  const touched = paths.filter(x => [...(moved || []), ...ctx.dirty].some(d => d === x || d.startsWith(`${x}/`)));
  if (touched.length) return done("STALE", `read(s) moved since ${String(rec.tree_sha).slice(0, 12)} or dirty now: ${touched.join(", ")} — the cited line numbers no longer hold, nothing mutated`, { stale_reads: touched });
  const axis = LANES[p.lane].includes("sandbox") ? "sandbox" : "fixture", plan = sc.plans[axis], was = rec.verdict === "CONFIRMED";
  const dirs = watchDirs(axis, plan), before = treeView(ctx, dirs);
  let res = null, err = null, armed = false;
  try { res = await vacuityInCollar(p, plan, axis, ctx, cites, was, () => { armed = true; }); } catch (e) { err = e; }
  const att = await attribute(treeDiff(before, treeView(ctx, dirs)), ctx, { collarRan: armed });
  const ow = att.other.length ? { other_writer: att.other } : {};
  if (att.own.length) return { ...base, axis, ...(res || {}), reading: "TREE-WRITTEN", why: `the vacuity session wrote into --root: ${att.own.join(", ")} — the engine deleted nothing${res ? ` (its mutants read ${res.reading}, withdrawn)` : ""}`, tree_written: att.own, ...ow, at };
  if (err) { if (!(err instanceof CollarError)) throw err; return done("COLLAR-NOT-ARMED", err.message, { axis, ...ow }); }
  return { ...base, axis, ...res, ...ow, at };
}
export function vacuityFace(rows) {
  const by = new Map(), split = new Map();
  const inc = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  for (const r of rows) { inc(by, r.reading); if (r.verdict === "CONFIRMED" || r.verdict === "REFUTED") inc(split, `${r.verdict} ${r.reading}`); }
  const fmt = m => [...m].sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1)).map(([k, n]) => `${k} ${n}`).join(" · ") || "none";
  const n = k => rows.reduce((s, r) => s + (Number(r[k]) || 0), 0);
  return [
    `VACUITY ${fmt(by)} (of ${rows.length})`,
    `BY VERDICT OF RECORD ${fmt(split)}`,
    `MUTANTS tried ${n("mutants_tried")} · complete ${n("mutants_complete")} · flips ${rows.reduce((s, r) => s + (r.flips ? r.flips.length : 0), 0)} · cited lines resting ${n("lines_resting")}`,
  ];
}

// ---------------------------------------------------------------------------- 8 · THE TREE (git, through the resolved verb)
// --no-optional-locks: a `git status` otherwise refreshes a stale index INTO .git (a linked worktree's index lives in HIS
// live repo's .git/worktrees/) — reading the tree must write nothing, there either.
function gitAt(ctx, args) { return spawnSync(ctx.verbs.git, ["-C", ctx.root, "--no-optional-locks", ...args], { encoding: "utf8", shell: false, windowsHide: true, timeout: SEG_TIMEOUT_MS, env: { ...hostEnv(), GIT_CEILING_DIRECTORIES: path.dirname(path.resolve(ctx.root)) } }); }
// THE TREE WATCHER (row 471 (1)(b)): a view of --root = what `git status --porcelain --ignored` sees + (name, size, mtime)
// of every entry of each listed dir ("" = the top level; the host axis adds every cwd its plan enters). Keys are
// "git:<path>" / "ls:<path>"; the diff names the paths whose entry appeared, vanished or changed.
export function treeView(ctx, dirs) {
  const v = new Map();
  const s = gitAt(ctx, ["status", "--porcelain", "-z", "--ignored"]);
  if (s.status !== 0) v.set("git:(git status failed)", String(s.status));
  else { const parts = String(s.stdout || "").split("\0"); for (let i = 0; i < parts.length; i++) { const e = parts[i]; if (e.length < 4) continue; v.set(`git:${fwd(e.slice(3))}`, e.slice(0, 2)); if (e[0] === "R" || e[0] === "C") i++; } }
  for (const d of new Set(dirs)) {
    let ents; try { ents = fs.readdirSync(joinRel(ctx.root, d), { withFileTypes: true }); } catch { v.set(`ls:${d || "."}/`, "unreadable"); continue; }
    for (const e of ents) {
      const rel = d ? `${d}/${e.name}` : e.name;
      if (e.isDirectory()) { v.set(`ls:${rel}/`, "dir"); continue; }
      let st = null; try { st = fs.statSync(joinRel(ctx.root, rel)); } catch {}
      v.set(`ls:${rel}`, st ? `${st.size}:${st.mtimeMs}` : "unstatable");
    }
  }
  return v;
}
export function treeDiff(a, b) {
  const out = new Set(), name = k => k.slice(k.indexOf(":") + 1);
  for (const [k, x] of a) if (b.get(k) !== x) out.add(name(k));
  for (const k of b.keys()) if (!a.has(k)) out.add(name(k));
  return [...out].sort();
}
// the dirs a run on this axis may write into without a flag: --root's top level, and on the host axis every cwd it enters
const watchDirs = (axis, plan) => ["", ...(axis === "host" ? plan.flat().map(s => s.cwd || "") : [])];
function treeFacts(ctx) {
  if (!ctx.verbs.git) throw new Stop("probe: git does not resolve on this machine — the tree cannot be named, refusing");
  const h = gitAt(ctx, ["rev-parse", "HEAD"]);
  if (h.status !== 0) throw new Stop(`probe: --root ${fwd(ctx.root)} is not a git work tree with a HEAD — refusing`);
  const s = gitAt(ctx, ["status", "--porcelain", "-z", "--untracked-files=all"]);
  const parts = String(s.stdout || "").split("\0"), dirty = [];
  for (let i = 0; i < parts.length; i++) { const e = parts[i]; if (e.length < 4) continue; dirty.push(fwd(e.slice(3))); if (e[0] === "R" || e[0] === "C") dirty.push(fwd(parts[++i] || "")); }
  return { tree_sha: String(h.stdout).trim(), dirty };
}
export async function makeCtx(o = {}, deps = {}) {
  const ctx = { root: path.resolve(o.root || deps.defaultRoot || DEFAULT_ROOT), verbs: deps.verbs || resolveVerbs(), deps, timeout: Number(o["timeout-ms"]) || deps.timeout || SEG_TIMEOUT_MS, cap: deps.cap || OUTPUT_CAP };
  Object.assign(ctx, treeFacts(ctx));
  return ctx;
}

// ---------------------------------------------------------------------------- 9 · THE FACE (first lines of every report)
export function face(receipts, { stale = null } = {}) {
  const by = new Map(), v = new Map(), a = new Map(), b = new Map(), c = new Map();
  const inc = (m, k) => { if (k) m.set(k, (m.get(k) || 0) + 1); };
  for (const r of receipts) {
    if (r.quarantine) inc(by, r.quarantine.why);
    inc(v, stale && stale.has(r.probe_id) ? "STALE" : r.verdict);
    inc(a, r.lenses && r.lenses.A && r.lenses.A.reading); inc(b, r.lenses && r.lenses.B && r.lenses.B.reading); inc(c, r.lenses && r.lenses.C && r.lenses.C.split);
  }
  const fmt = m => [...m].sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1)).map(([k, n]) => `${k} ${n}`).join(" · ") || "none";
  const nq = [...by.values()].reduce((s, n) => s + n, 0);
  const ow = receipts.filter(r => otherWriters(r).length).length;
  const er = receipts.filter(r => (r.runs || []).some(x => x && x.errored)).length;
  const si = receipts.filter(r => r.silent && r.silent.reading === "SILENT-SUCCESS").length;
  return [
    `QUARANTINE ${nq} of ${receipts.length}${nq ? ` · by why: ${fmt(by)}` : ""}`,
    `VERDICTS ${fmt(v)}`,
    `LENSES A: ${fmt(a)} | B: ${fmt(b)} | C: ${fmt(c)}`,
    ...(ow ? [`OTHER-WRITER ${ow} of ${receipts.length} · another writer changed --root during a run, named on the run and graded (law 7f, rows 494 / 495)`] : []),
    ...(er ? [`VERB-ERRORED ${er} of ${receipts.length} · a run ended in its verb's error status, so it read nothing it could grade (law 7i, row 545)`] : []),
    ...(si ? [`SILENT-SUCCESS ${si} of ${receipts.length} · a node segment exited 0 with 0 reads, 0 writes, 0 spawns (law 9, row 545)`] : []),
  ];
}
// law 7f: every other_writer a receipt names (its runs', and lens A's ablation run's)
export const otherWriters = r => [...(r.runs || []).flatMap(x => (x && x.other_writer) || []), ...((r.lenses && r.lenses.A && r.lenses.A.other_writer) || [])];
const readJsonl = f => fs.readFileSync(f, "utf8").split(/\r?\n/).filter(l => l.trim()).map((l, i) => { try { return JSON.parse(l); } catch { throw new Stop(`probe: ${fwd(f)} line ${i + 1} is not JSON`); } });

// ---------------------------------------------------------------------------- 10 · THE VERBS
export function cmdImport(o, log = console.log) {
  if (!o.population || !o.out) throw new Stop(USAGE);
  const rows = readJsonl(o.population);
  const probes = rows.map(r => ({ id: r.id, claim: r.seed_claim,
    source: { population_id: r.id, seed_file: r.seed_file ?? null, seed_line: r.seed_line ?? null, verdict_claimed: r.verdict_claimed ?? null, aj_final: r.aj && r.aj.final || null, tier0: r.adjudication && r.adjudication.tier0 || null },
    predicate_cmd: null, expect: null, tier: 0, lane: "host", reads: [], authored_at_tree: null }));
  fs.writeFileSync(o.out, probes.map(p => JSON.stringify(p)).join(NL) + NL);
  const receipts = probes.map(p => ({ probe_id: p.id, verdict: "UNRUNNABLE", quarantine: staticCheck(p, {}).quarantine, lenses: {} }));
  for (const l of face(receipts)) log(l);
  log(`import: ${probes.length} skeletons → ${fwd(o.out)} (predicate_cmd null: UNRUNNABLE / UNAUTHORED until authored)`);
  return 0;
}
export async function cmdRun(o, deps = {}, log = console.log) {
  if (!o.probes || !o.out) throw new Stop(USAGE);
  const ctx = await makeCtx(o, deps);
  const outAbs = path.resolve(o.out);
  if (inside(path.dirname(outAbs), ctx.root) || inside(outAbs, ctx.root)) throw new Stop(`probe: REFUSED — --out ${fwd(outAbs)} is inside --root ${fwd(ctx.root)}; nothing is ever written into the probed tree`);
  if (!fs.existsSync(path.dirname(outAbs))) throw new Stop(`probe: --out's directory does not exist: ${fwd(path.dirname(outAbs))}`);
  let probes = readJsonl(o.probes);
  if (o.ids) { const want = new Set(String(o.ids).split(",").map(s => s.trim()).filter(Boolean)); probes = probes.filter(p => p && want.has(p.id)); }
  // (d) · row 471 (1)(d)/(2): the collar binds --root BEFORE anything is spawned, or the call is --host-only
  if (o["host-only"] === true) ctx.hostOnly = true;
  else if (probes.some(p => !staticCheck(p, ctx.verbs).quarantine && LANES[p.lane].some(a => COLLAR_AXES.has(a)))) {
    try { await collarOf(ctx); }
    catch (e) { if (e instanceof CollarError) throw new Stop(`probe: REFUSED — a collar axis is due and the collar does not bind --root ${fwd(ctx.root)}: ${e.message}. Nothing was spawned. Run on the tree scripts/sandbox.mjs builds from, or pass --host-only (the host axis alone; the collar axes quarantined)`); throw e; }
  }
  const receipts = [];
  for (const p of probes) receipts.push(await runProbe(p, ctx));
  fs.writeFileSync(outAbs, receipts.map(r => JSON.stringify(r)).join(NL) + (receipts.length ? NL : ""));
  for (const l of face(receipts)) log(l);
  for (const r of receipts) log(`${r.probe_id}  ${r.verdict}${r.quarantine ? `  ${r.quarantine.why}${r.quarantine.reason ? `(${r.quarantine.reason})` : ""}` : ""}${r.verdict_why ? `  ${r.verdict_why}` : ""}`);
  log(`run: ${receipts.length} receipt(s) at tree ${ctx.tree_sha.slice(0, 12)} → ${fwd(outAbs)}`);
  for (const r of receipts) for (const x of otherWriters(r)) log(`NOTE: ${r.probe_id} saw another writer in --root (law 7f rule ${x.rule}, graded): ${x.path}${x.pid !== null ? ` · pid ${x.pid}${x.name ? ` ${x.name}` : ""}${x.session !== null ? ` · session ${x.session}` : ""}` : ""}`);
  const written = receipts.filter(r => r.quarantine && r.quarantine.why === "TREE-WRITTEN");
  if (written.length) { log(`RED: ${written.length} probe(s) wrote into --root ${fwd(ctx.root)}: ${written.map(r => `${r.probe_id} → ${r.quarantine.detail}`).join(" · ")} — the engine deleted nothing; read and remove them`); return 1; }
  return 0;
}
// law 8 · VACUITY: every probe against its receipt of record (the latest per probe_id in --receipts), ONE fresh collar each
export async function cmdVacuity(o, deps = {}, log = console.log) {
  if (!o.probes || !o.receipts || !o.out) throw new Stop(USAGE);
  const ctx = await makeCtx(o, deps);
  const outAbs = path.resolve(o.out);
  if (inside(path.dirname(outAbs), ctx.root) || inside(outAbs, ctx.root)) throw new Stop(`probe: REFUSED — --out ${fwd(outAbs)} is inside --root ${fwd(ctx.root)}; nothing is ever written into the probed tree`);
  if (!fs.existsSync(path.dirname(outAbs))) throw new Stop(`probe: --out's directory does not exist: ${fwd(path.dirname(outAbs))}`);
  let probes = readJsonl(o.probes);
  if (o.ids) { const want = new Set(String(o.ids).split(",").map(s => s.trim()).filter(Boolean)); probes = probes.filter(p => p && want.has(p.id)); }
  const latest = new Map(); for (const r of readJsonl(o.receipts)) latest.set(r.probe_id, r);
  // the collar and mutagen's operators bind BEFORE anything is spawned, whenever a graded probe is due
  if (probes.some(p => { const r = p && latest.get(p.id); return r && (r.verdict === "CONFIRMED" || r.verdict === "REFUTED"); })) {
    try { await collarOf(ctx); }
    catch (e) { if (e instanceof CollarError) throw new Stop(`probe: REFUSED — vacuity mutates only inside the collar, and it does not bind --root ${fwd(ctx.root)}: ${e.message}. Nothing was spawned`); throw e; }
    ctx._ops = deps.codeOps || await loadCodeOps(deps.opsDir || HERE);
  }
  const movedBy = new Map();
  const movedOf = sha => {
    if (sha === ctx.tree_sha) return [];
    if (!movedBy.has(sha)) { const d = /^[0-9a-f]{40}$/.test(String(sha)) ? gitAt(ctx, ["diff", "--name-only", sha, "HEAD"]) : { status: 128 }; movedBy.set(sha, d.status === 0 ? String(d.stdout).split(/\r?\n/).filter(Boolean).map(fwd) : null); }
    return movedBy.get(sha);
  };
  const rows = [];
  for (const p of probes) { const rec = latest.get(p && p.id); rows.push(await vacuityProbe(p, rec, ctx, rec ? movedOf(rec.tree_sha) : [])); }
  fs.writeFileSync(outAbs, rows.map(r => JSON.stringify(r)).join(NL) + (rows.length ? NL : ""));
  for (const l of vacuityFace(rows)) log(l);
  for (const r of rows) log(`${r.probe_id}  ${r.verdict || "-"}  ${r.reading}  ${r.why}`);
  log(`vacuity: ${rows.length} probe(s) at tree ${ctx.tree_sha.slice(0, 12)} → ${fwd(outAbs)}`);
  for (const r of rows) for (const x of r.other_writer || []) log(`NOTE: ${r.probe_id} saw another writer in --root (law 7f rule ${x.rule}, graded): ${x.path}${x.pid !== null ? ` · pid ${x.pid}${x.name ? ` ${x.name}` : ""}` : ""}`);
  const written = rows.filter(r => r.reading === "TREE-WRITTEN");
  if (written.length) { log(`RED: ${written.length} vacuity session(s) wrote into --root ${fwd(ctx.root)}: ${written.map(r => `${r.probe_id} → ${r.tree_written.join(", ")}`).join(" · ")} — the engine deleted nothing; read and remove them`); return 1; }
  return 0;
}
// STALE: the receipt's tree is not HEAD and the diff since it (or a dirty path now) touches the probe's reads[]
export async function statusOf(o, deps = {}) {
  const ctx = await makeCtx(o, deps);
  const probes = readJsonl(o.probes), receipts = readJsonl(o.receipts);
  const latest = new Map(); for (const r of receipts) latest.set(r.probe_id, r);
  const diffs = new Map(), rows = [];
  for (const p of probes) {
    const r = latest.get(p.id);
    if (!r) { rows.push({ id: p.id, status: "NO-RECEIPT", why: null }); continue; }
    const reads = (p.reads || []).map(readsPath);
    let moved = [];
    if (r.tree_sha !== ctx.tree_sha) {
      if (!diffs.has(r.tree_sha)) {
        const d = /^[0-9a-f]{40}$/.test(String(r.tree_sha)) ? gitAt(ctx, ["diff", "--name-only", r.tree_sha, "HEAD"]) : { status: 128 };
        diffs.set(r.tree_sha, d.status === 0 ? String(d.stdout).split(/\r?\n/).filter(Boolean).map(fwd) : null);
      }
      moved = diffs.get(r.tree_sha);
    }
    const touch = list => reads.filter(x => (list || []).some(d => d === x || d.startsWith(`${x}/`)));
    if (moved === null) { rows.push({ id: p.id, status: "STALE", why: `tree_sha ${String(r.tree_sha).slice(0, 12)} is not in this repo` }); continue; }
    const t = [...new Set([...touch(moved), ...touch(ctx.dirty)])];
    rows.push(t.length ? { id: p.id, status: "STALE", why: `reads moved since ${String(r.tree_sha).slice(0, 12)}: ${t.join(", ")}`, was: r.verdict } : { id: p.id, status: r.verdict, why: r.tree_sha === ctx.tree_sha ? null : "tree moved, reads untouched" });
  }
  return { head: ctx.tree_sha, rows, latest };
}
export async function cmdStatus(o, deps = {}, log = console.log) {
  if (!o.probes || !o.receipts) throw new Stop(USAGE);
  const s = await statusOf(o, deps);
  const stale = new Set(s.rows.filter(r => r.status === "STALE").map(r => r.id));
  for (const l of face([...s.latest.values()], { stale })) log(l);
  for (const r of s.rows) log(`${r.id}  ${r.status}${r.why ? `  ${r.why}` : ""}`);
  log(`status: ${s.rows.length} probe(s) against HEAD ${s.head.slice(0, 12)}`);
  return 0;
}
export function cmdReport(o, log = console.log) {
  if (!o.receipts) throw new Stop(USAGE);
  const receipts = readJsonl(o.receipts);
  for (const l of face(receipts)) log(l);
  const reg = receipts.filter(r => r.quarantine);
  if (reg.length) { log("QUARANTINE REGISTER {id, why, runnable_if}:"); for (const r of reg) log(JSON.stringify({ id: r.probe_id, why: r.quarantine.why, reason: r.quarantine.reason, runnable_if: r.quarantine.runnable_if })); }
  for (const r of receipts) log(`${r.probe_id}  ${r.verdict}  A:${r.lenses && r.lenses.A ? r.lenses.A.reading : "-"} B:${r.lenses && r.lenses.B && r.lenses.B.reading || "-"} C:${r.lenses && r.lenses.C && r.lenses.C.split || "-"}  tree ${String(r.tree_sha || "").slice(0, 12)}`);
  return 0;
}

// ---------------------------------------------------------------------------- 11 · SELFTEST (hermetic, planted both ways)
// A fixture git repo in the OS temp dir and an INJECTED FAKE COLLAR that records every build, arm and destroy. Every case
// is its own try: a throw is a RED naming its case, never a crash, and the summary line is always reached.
async function selftest() {
  const T = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "probe-selftest-")));
  let good = 0, ran = 0, skippedCases = 0;
  // PROBE_SELFTEST_ONLY=<prefix>: only the cases whose name starts with it run (an engine mutant's harness); the skip is SAID
  const ONLY = process.env.PROBE_SELFTEST_ONLY || "";
  const ok = (c, name, detail = "") => { ran++; if (c) good++; console.log(`${c ? "PASS" : "FAIL"}  ${name}${!c && detail ? `  — ${detail}` : ""}`); };
  const tc = async (name, fn) => { if (ONLY && !name.startsWith(ONLY)) { skippedCases++; return; } try { const r = await fn(); ok(r === true, name, r === true ? "" : String(r)); } catch (e) { ok(false, name, `THREW ${e && e.stack ? e.stack.split(NL).slice(0, 2).join(" | ") : String(e)}`); } };
  const w = (p, c) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c); };
  const verbs = resolveVerbs();
  const git = (dir, ...a) => spawnSync(verbs.git || "git", ["-C", dir, "-c", "user.name=fixture", "-c", "user.email=fixture@invalid", "-c", "commit.gpgsign=false", ...a], { encoding: "utf8", shell: false, windowsHide: true });
  const why = (d, detail) => `${detail || ""} ${JSON.stringify(d).slice(0, 400)}`;
  try {
    // ---- the fixture organism: tracked scripts + docs, a gitignored state bus
    const REPO = path.join(T, "repo");
    w(path.join(REPO, "scripts", "alpha.mjs"), "// line one\n// ALPHA_MARK here\n// cost $HOME literal\n");
    w(path.join(REPO, "scripts", "tool.mjs"), "console.log('TOOL_RAN:' + (process.env.FAKE_COLLAR || 'naked') + ':' + process.argv.slice(2).join(','));\n");
    w(path.join(REPO, "scripts", "sleepy.mjs"), "setTimeout(() => {}, 60000);\n");
    w(path.join(REPO, "scripts", "loud.mjs"), "process.stdout.write('x'.repeat(5000) + '\\n');\n");
    w(path.join(REPO, "scripts", "dirty.mjs"), "import fs from 'node:fs';\nfs.writeFileSync('dressing-room/state/NEW_BORN.json', '{}');\nconsole.log('wrote');\n");
    w(path.join(REPO, "scripts", "exit.mjs"), "console.log('exiting');\nprocess.exit(Number(process.argv[2]));\n");
    w(path.join(REPO, "scripts", "gone.mjs"), "import fs from 'node:fs';\nif (!fs.existsSync(process.argv[2])) process.exit(200);\nconsole.log('present');\n");
    w(path.join(REPO, "scripts", "present.mjs"), "import fs from 'node:fs';\nif (fs.existsSync(process.argv[2])) process.exit(200);\nconsole.log('absent');\n");
    w(path.join(REPO, "docs", "notes.md"), "one\ntwo\nthree\nfour\nfive\n");
    w(path.join(REPO, ".gitignore"), "dressing-room/state/\n");
    w(path.join(REPO, "dressing-room", "state", "bus.json"), '{"k":"STATE_MARK"}\n');
    git(REPO, "init", "-q"); git(REPO, "add", "-A"); git(REPO, "commit", "-q", "-m", "fixture");
    const HEAD1 = String(git(REPO, "rev-parse", "HEAD").stdout).trim();
    const STATE0 = hashTree(path.join(REPO, "dressing-room", "state"));
    const OUTD = path.join(T, "out"); fs.mkdirSync(OUTD);
    // the REAL Windows crash (forks row 471): Git for Windows' grep 3.0 aborts on -i with two or more -e. MEASURED here, in a
    // throwaway dir, never assumed: where it reproduces the L7 cases plant it; where grep is sound they plant the other way.
    const REAL = (() => {
      const d = path.join(T, "crashprobe"); w(path.join(d, "f.txt"), "one\ntwo\n");
      const r = verbs.grep ? spawnSync(verbs.grep, ["-c", "-i", "-e", "one", "-e", "two", "f.txt"], { cwd: d, encoding: "utf8", shell: false, windowsHide: true, timeout: 30000 }) : null;
      return { crashes: Boolean(r && crashOf("grep", r)), status: r ? r.status : null };
    })();
    console.log(`NOTE  the real grep crash (-i with two -e) ${REAL.crashes ? "REPRODUCES" : "does not reproduce"} on this machine (status ${REAL.status})`);

    // ---- the fake collar: builds a tracked-files copy (like the real one), records every call
    const makeCollar = (root, o = {}) => {
      const log = [];
      return { log, ROOT: root,
        buildSandbox(bo = {}) {
          if (o.leakTo) fs.writeFileSync(o.leakTo, "a collar build that wrote outside its own temp dir\n");
          if (o.during) o.during();                                    // another writer, acting while this collar axis runs
          if (o.lockFirst && !log.some(e => e.ev === "locked")) { log.push({ ev: "locked" }); const e = new Error(`${o.lockFirst}, The process cannot access the file because another process has locked a portion of the file.`); e.code = o.lockFirst; throw e; }
          const sb = fs.mkdtempSync(path.join(T, "sb-"));
          for (const rel of String(git(root, "ls-files", "-z").stdout).split("\0").filter(Boolean)) { const src = path.join(root, rel); if (!fs.existsSync(src)) continue; fs.mkdirSync(path.dirname(path.join(sb, rel)), { recursive: true }); fs.copyFileSync(src, path.join(sb, rel)); }
          // law 9: like the real collar, a trace file only when asked; the planted node scripts write the preload's rows themselves
          const trace = bo.trace ? path.join(sb, ".trace.jsonl") : "";
          if (trace) fs.writeFileSync(trace, "");
          log.push({ ev: "build", root: sb, ...(trace ? { trace: true } : {}) });
          return { root: sb, env: { ...hostEnv(), FAKE_COLLAR: "collared", ...(trace ? { ARSENAL_AUDIT_TRACE: trace } : {}) }, ...(trace ? { trace } : {}) };
        },
        assertArmed(sb) { if (o.disarmed) { log.push({ ev: "refused", root: sb.root }); throw new Error("sandbox: REFUSING — the collar did not load (no heartbeat)"); } log.push({ ev: "armed", root: sb.root }); return true; },
        destroy(sb) { fs.rmSync(sb.root, { recursive: true, force: true }); log.push({ ev: "destroy", root: sb.root }); },
      };
    };
    const ctxFor = async (o = {}) => { const collar = o.collar || makeCollar(REPO); const ctx = await makeCtx({ root: REPO }, { sandbox: collar, verbs: o.verbs || verbs, timeout: o.timeout, cap: o.cap, ...(o.deps || {}) }); return { ctx, collar }; };
    const P = (id, cmd, expect, lane = "host", reads = [], extra = {}) => ({ id, claim: `planted ${id}`, source: { population_id: id, seed_file: "fixture.md", seed_line: 1, verdict_claimed: "CONFIRM", aj_final: "UPHELD", tier0: "LITERALS-HOLD" }, predicate_cmd: cmd, expect, tier: 0, lane, reads, authored_at_tree: HEAD1, ...extra });
    const run1 = async (p, o = {}) => { const { ctx, collar } = await ctxFor(o); const r = await runProbe(p, ctx); return { r, collar, ctx }; };

    // ================= LAW 1 · THE PROBE / THE EXPECTATION
    await tc("L1 expect · exit holds (0) and fails (1) — both ways", async () => expectHolds({ exit: 0 }, { exit: 0, stdout: "" }) && !expectHolds({ exit: 0 }, { exit: 1, stdout: "" }));
    await tc("L1 expect · stdout_includes holds and fails — both ways", async () => expectHolds({ stdout_includes: ["b c"] }, { exit: 0, stdout: "a b c\n" }) && !expectHolds({ stdout_includes: ["b c", "zz"] }, { exit: 0, stdout: "a b c\n" }));
    await tc("L1 expect · stdout_excludes holds and fails — both ways (ANY excluded string present = not held)", async () => expectHolds({ stdout_excludes: ["zz", "yy"] }, { exit: 0, stdout: "a\n" }) && !expectHolds({ stdout_excludes: ["zz", "a"] }, { exit: 0, stdout: "a\n" }));
    await tc("L1 expect · stdout_lines == / >= / <= each both ways", async () => {
      const r = { exit: 0, stdout: "1\n2\n3\n" };
      return expectHolds({ stdout_lines: { op: "==", n: 3 } }, r) && !expectHolds({ stdout_lines: { op: "==", n: 2 } }, r)
        && expectHolds({ stdout_lines: { op: ">=", n: 3 } }, r) && !expectHolds({ stdout_lines: { op: ">=", n: 4 } }, r)
        && expectHolds({ stdout_lines: { op: "<=", n: 3 } }, r) && !expectHolds({ stdout_lines: { op: "<=", n: 2 } }, r)
        && lineCount("") === 0 && lineCount("x") === 1 || `lineCount ${lineCount("1\n2\n3\n")}`;
    });
    await tc("L1 expect · EVERY key given must hold (exit holds, includes fails → not held)", async () => !expectHolds({ exit: 0, stdout_includes: ["nope"] }, { exit: 0, stdout: "yes\n" }) && expectHolds({ exit: 0, stdout_includes: ["yes"] }, { exit: 0, stdout: "yes\n" }));
    await tc("L1 expect · CRLF output normalized before matching (his Windows)", async () => expectHolds({ stdout_includes: ["a\nb"], stdout_lines: { op: "==", n: 2 } }, { exit: 0, stdout: "a\r\nb\r\n" }));
    await tc("L1 EXPECT-MALFORMED · {} / exit '0' / unknown key / op != / empty includes all refused; a well-formed one is not", async () => {
      const bad = [{}, { exit: "0" }, { bogus: 1 }, { stdout_lines: { op: "!=", n: 1 } }, { stdout_includes: [] }, null, [1]].map(expectProblem);
      return bad.every(Boolean) && bad[0] === "expect carries no key" && expectProblem({ exit: 0, stdout_includes: ["a"], stdout_excludes: ["b"], stdout_lines: { op: ">=", n: 0 } }) === null || JSON.stringify(bad);
    });
    await tc("L1 EXPECT-MALFORMED · a probe with a malformed expect is UNRUNNABLE on the register, 3 stub runs, nothing spawned", async () => {
      const n0 = SPAWNS.count; const { r } = await run1(P("em", "wc -l docs/notes.md", { exit: "0" }));
      return r.verdict === "UNRUNNABLE" && r.quarantine.why === "EXPECT-MALFORMED" && r.runs.length === 3 && SPAWNS.count === n0 || why(r);
    });
    await tc("L1 UNAUTHORED · predicate_cmd null → UNRUNNABLE / UNAUTHORED with runnable_if; authored → not", async () => {
      const { r } = await run1(P("un", null, null)); const { r: r2 } = await run1(P("au", "wc -l docs/notes.md", { exit: 0 }));
      return r.verdict === "UNRUNNABLE" && r.quarantine.why === "UNAUTHORED" && /authored/.test(r.quarantine.runnable_if) && r2.quarantine === null || why(r);
    });
    await tc("L1 PROBE-MALFORMED · an unknown lane is refused; a known one is not", async () => {
      const { r } = await run1(P("pm", "wc -l docs/notes.md", { exit: 0 }, "everywhere"));
      return r.quarantine && r.quarantine.why === "PROBE-MALFORMED" && r.runs.length === 3 && staticCheck(P("pm2", "wc -l docs/notes.md", { exit: 0 }), verbs).plans !== undefined || why(r);
    });

    // ================= LAW 2 · NO SHELL, EVER
    const refusals = [["SEMICOLON", "wc -l a ; wc -l b"], ["REDIRECTION", "wc -l docs/notes.md > x"], ["SUBSTITUTION", "wc -l $(echo x)"], ["BACKTICK", "wc -l `x`"],
      ["EXPANSION", "grep -c $HOME docs/notes.md"], ["GLOB", "wc -l docs/*.md"], ["OR-CHAIN", "wc -l a || wc -l b"], ["BACKGROUND", "wc -l a &"], ["SUBSHELL", "(wc -l a)"]];
    for (const [reason, cmd] of refusals) {
      await tc(`L2 NO SHELL · ${reason} refused as UNPARSABLE (${cmd})`, async () => { const c = classify(cmd, "host"); return c.class === "UNRUNNABLE" && c.why === "UNPARSABLE" && c.reason === reason || why(c); });
    }
    await tc("L2 NO SHELL · the same metacharacters INSIDE quotes are data, admitted (both ways)", async () => classify("grep -c 'a;b>c*d|e' docs/notes.md", "host").class === "RUNNABLE" && classify("grep -c \"x && y\" docs/notes.md", "host").class === "RUNNABLE");
    await tc("L2 NO SHELL · a metachar probe lands on the register as UNPARSABLE with its reason, no spawn", async () => {
      const n0 = SPAWNS.count; const { r } = await run1(P("semi", "wc -l docs/notes.md ; wc -l x", { exit: 0 }));
      return r.verdict === "UNRUNNABLE" && r.quarantine.why === "UNPARSABLE" && r.quarantine.reason === "SEMICOLON" && SPAWNS.count === n0 || why(r);
    });
    await tc("L2 SPAWN · shell:false and windowsHide:true on the path actually taken; a quoted space and a literal $HOME reach grep intact", async () => {
      const c = classify("grep -c 'ALPHA_MARK here' scripts/alpha.mjs", "host"), c2 = classify("grep -cF '$HOME' scripts/alpha.mjs", "host");
      const a = runPlan(c.plan, REPO, hostEnv(), { verbs }), last = SPAWNS.last, b = runPlan(c2.plan, REPO, hostEnv(), { verbs });
      return a.stdout.trim() === "1" && b.stdout.trim() === "1" && last.shell === false && last.windowsHide === true || why({ a, b, last });
    });
    await tc("L2 PIPES BY SPAWN · sed | wc wires stdout → stdin (3 lines), and sed alone prints the 3 lines", async () => {
      const a = runPlan(classify("sed -n '1,3p' docs/notes.md | wc -l", "host").plan, REPO, hostEnv(), { verbs });
      const b = runPlan(classify("sed -n '1,3p' docs/notes.md", "host").plan, REPO, hostEnv(), { verbs });
      return a.stdout.trim() === "3" && b.stdout === "one\ntwo\nthree\n" || why({ a, b });
    });
    await tc("L2 && · a failed link ends the chain (second segment never runs); a passing link continues", async () => {
      const a = runPlan(classify("grep -c NOPE_NOT_THERE docs/notes.md && wc -l docs/notes.md", "host").plan, REPO, hostEnv(), { verbs });
      const b = runPlan(classify("grep -c three docs/notes.md && wc -l docs/notes.md", "host").plan, REPO, hostEnv(), { verbs });
      return a.exit === 1 && a.stdout.trim() === "0" && b.exit === 0 && /1\n5 docs\/notes.md/.test(b.stdout) || why({ a, b });
    });
    await tc("L2 TIMEOUT PER SEGMENT · a sleeping segment is cut, recorded timed_out, and the verdict is NON-DETERMINISTIC naming it", async () => {
      const { r } = await run1(P("slow", "node scripts/sleepy.mjs", { exit: 0 }, "sandbox"), { timeout: 700 });
      return r.verdict === "NON-DETERMINISTIC" && r.runs[0].timed_out === true && r.runs[0].held === null && /timed out/.test(r.verdict_why) || why(r);
    });
    await tc("L2 OUTPUT CAP · an over-cap segment is recorded capped, NON-DETERMINISTIC; under the cap it completes", async () => {
      const { r } = await run1(P("loud", "node scripts/loud.mjs", { exit: 0 }, "sandbox"), { cap: 1024 });
      const { r: r2 } = await run1(P("loud2", "node scripts/loud.mjs", { exit: 0 }, "sandbox"));
      return r.verdict === "NON-DETERMINISTIC" && r.runs[0].capped === true && /output cap/.test(r.verdict_why) && r2.verdict === "CONFIRMED" || why(r);
    });

    // ================= LAW 3 · THE VERB TABLE (every verb both ways)
    const admitted = [["git show", "git show HEAD:docs/notes.md", "three"], ["git ls-files", "git ls-files docs", "docs/notes.md"], ["git log", "git log --oneline -1", "fixture"],
      ["git cat-file", "git cat-file -p HEAD:docs/notes.md", "four"], ["grep", "grep -n two docs/notes.md", "2:two"], ["sed", "sed -n '2p;4p' docs/notes.md", "two\nfour"],
      ["head", "head -n 2 docs/notes.md", "one\ntwo"], ["tail", "tail -n 1 docs/notes.md", "five"], ["wc", "wc -l docs/notes.md", "5 docs/notes.md"], ["cd", "cd docs && wc -l notes.md", "5 notes.md"]];
    for (const [verb, cmd, want] of admitted) {
      await tc(`L3 VERB ${verb} · admitted on host and runs (${cmd})`, async () => { const c = classify(cmd, "host"); if (c.class !== "RUNNABLE") return why(c); const r = runPlan(c.plan, REPO, hostEnv(), { verbs }); return r.exit === 0 && r.stdout.includes(want) || why(r); });
    }
    const refused = [["git push", "git push", "GIT-SUBCOMMAND"], ["git write flag", "git show --output=x HEAD", "GIT-WRITE-FLAG"], ["git abbreviated write flag", "git log --outp=x", "GIT-WRITE-FLAG"], ["git global option", "git -c a=b show", "GIT-GLOBAL-OPTION"],
      ["grep -R", "grep -R x docs", "FLAG-NOT-IN-TABLE"], ["grep -f", "grep -f pats docs/notes.md", "FLAG-REFUSED"], ["sed -i", "sed -i 1d docs/notes.md", "SED-FORM"], ["sed s///", "sed -n 's/a/b/p' docs/notes.md", "SED-SCRIPT"],
      ["head --bogus", "head --bogus docs/notes.md", "FLAG-NOT-IN-TABLE"], ["tail -f", "tail -f docs/notes.md", "FLAG-REFUSED"], ["wc --files0-from", "wc --files0-from=x", "FLAG-REFUSED"],
      ["cd absolute", "cd /etc && wc -l passwd", "CD-OUTSIDE-TREE"], ["cd ..", "cd .. && wc -l x", "CD-OUTSIDE-TREE"], ["cd in pipe", "cd docs | wc -l", "CD-IN-PIPE"],
      ["absolute path operand", "wc -l /etc/hostname", "PATH-OUTSIDE-TREE"], ["../ path operand", "wc -l ../x", "PATH-ESCAPES-TREE"], ["verb outside the table (cat)", "cat docs/notes.md", "VERB-NOT-IN-TABLE"],
      ["node option", "node --eval 1", "NODE-OPTION"], ["node script outside scripts/", "node docs/x.mjs", "NODE-SCRIPT-NOT-IN-TABLE"]];
    for (const [verb, cmd, reason] of refused) {
      await tc(`L3 REFUSED ${verb} → VERB-OUTSIDE-AXIS(${reason})`, async () => { const c = classify(cmd, "sandbox"); return c.class === "UNRUNNABLE" && c.why === "VERB-OUTSIDE-AXIS" && c.reason === reason || why(c); });
    }
    await tc("L3 NODE · node on the HOST axis refused (NODE-OFF-COLLAR); on sandbox and fixture admitted", async () => {
      const h = classify("node scripts/tool.mjs a", "host"), s = classify("node scripts/tool.mjs a", "sandbox"), f = classify("node scripts/tool.mjs a", "fixture");
      return h.class === "UNRUNNABLE" && h.reason === "NODE-OFF-COLLAR" && s.class === "RUNNABLE" && f.class === "RUNNABLE" || why({ h, s });
    });
    await tc("L3 NODE · a host-lane node probe is UNRUNNABLE (VERB-OUTSIDE-AXIS on host), nothing spawned; a sandbox-lane one runs under the collar env", async () => {
      const n0 = SPAWNS.count; const { r } = await run1(P("nh", "node scripts/tool.mjs a,b", { stdout_includes: ["TOOL_RAN:collared"] }, "host"));
      const n1 = SPAWNS.count; const { r: r2 } = await run1(P("ns", "node scripts/tool.mjs a,b", { stdout_includes: ["TOOL_RAN:collared:a,b"] }, "sandbox"));
      return r.verdict === "UNRUNNABLE" && r.quarantine.why === "VERB-OUTSIDE-AXIS" && r.quarantine.reason === "NODE-OFF-COLLAR" && n1 === n0 && r2.verdict === "CONFIRMED" || why({ r, r2 });
    });
    await tc("L3 RESOLVE · PATH first; else the usr/bin beside git; else null (fake dirs, both ways)", async () => {
      const exe = WIN ? ".exe" : "", mk = p => { w(p, WIN ? "MZ" : "#!/bin/sh\n"); if (!WIN) fs.chmodSync(p, 0o755); };
      const onPath = path.join(T, "pathbin"), gitHome = path.join(T, "Git"), gitCmd = path.join(gitHome, "cmd"), usr = path.join(gitHome, "usr", "bin");
      mk(path.join(onPath, `grep${exe}`)); mk(path.join(gitCmd, `git${exe}`)); mk(path.join(usr, `sed${exe}`)); mk(path.join(usr, `grep${exe}`));
      const sep = WIN ? ";" : ":";
      const a = resolveVerbs({ env: { PATH: [onPath, gitCmd].join(sep) } }), b = resolveVerbs({ env: { PATH: onPath } });
      return a.grep === path.join(onPath, `grep${exe}`) && a.sed === path.resolve(path.join(usr, `sed${exe}`)) && a.wc === null && b.sed === null && b.git === null || why({ a, b });
    });
    await tc("L3 VERB-NOT-FOUND · an unresolvable verb makes the probe UNRUNNABLE, never a pass; resolved, it runs", async () => {
      const { r } = await run1(P("vnf", "wc -l docs/notes.md", { exit: 0 }), { verbs: { ...verbs, wc: null } });
      const { r: r2 } = await run1(P("vf", "wc -l docs/notes.md", { exit: 0 }));
      return r.verdict === "UNRUNNABLE" && r.quarantine.why === "VERB-NOT-FOUND" && r.quarantine.reason === "wc" && r2.verdict === "CONFIRMED" || why(r);
    });

    // ================= LAW 4 · THE AXES AND THE LANES
    // the brief's lane table, typed HERE as a literal so a drifted LANES constant cannot grade itself
    const WANT_LANES = { host: "host,sandbox,fixture", "live-readonly": "host,fixture,fixture", sandbox: "sandbox,sandbox,fixture", FIXTURE: "fixture,fixture,fixture" };
    await tc("L4 LANES · exactly the four lanes of the brief", async () => Object.keys(LANES).sort().join(",") === Object.keys(WANT_LANES).sort().join(",") || Object.keys(LANES).join(","));
    for (const lane of Object.keys(WANT_LANES)) {
      await tc(`L4 LANE ${lane} → ${WANT_LANES[lane]} · runs.length 3, one fresh collar per collar run, each destroyed`, async () => {
        const { r, collar } = await run1(P(`lane-${lane}`, "wc -l docs/notes.md", { exit: 0 }, lane, ["docs/notes.md"]));
        const builds = collar.log.filter(e => e.ev === "build"), destroys = collar.log.filter(e => e.ev === "destroy");
        const collarRuns = WANT_LANES[lane].split(",").filter(a => a !== "host").length + 1;          // + lens A's ablation run
        return r.runs.length === 3 && r.runs.map(x => x.axis).join(",") === WANT_LANES[lane] && builds.length === collarRuns && destroys.length === builds.length
          && new Set(builds.map(b => b.root)).size === builds.length && builds.every(b => !fs.existsSync(b.root)) || why({ axes: r.runs.map(x => x.axis), log: collar.log.map(e => e.ev) });
      });
    }
    await tc("L4 AXES DIFFER · the gitignored state is on host and fixture, absent on sandbox (tracked files only)", async () => {
      // law 7i (row 545): grep's exit 2 on the absent file is no longer 'not held' — the sandbox run read nothing, VERB-ERRORED
      const { r } = await run1(P("st", "grep -c STATE_MARK dressing-room/state/bus.json", { exit: 0 }, "host"));
      const { r: r2 } = await run1(P("st2", "grep -r -l STATE_MARK .", { exit: 0 }, "host"));
      return r.runs.map(x => x.held).join(",") === "true,,true" && r.runs[1].errored && r.runs[1].errored.status === 2 && r2.runs.map(x => x.held).join(",") === "true,false,true" || why({ r: r.runs.map(x => [x.axis, x.exit, x.errored]), r2: r2.runs.map(x => [x.axis, x.exit]) });
    });
    await tc("L4 FIXTURE · the copy is hashed before and after: a node run that births a file there is fixture_dirtied; a read-only run is not", async () => {
      const { r } = await run1(P("dirt", "node scripts/dirty.mjs", { stdout_includes: ["wrote"] }, "FIXTURE"));
      const { r: r2 } = await run1(P("clean", "grep -c STATE_MARK dressing-room/state/bus.json", { exit: 0 }, "FIXTURE"));
      return r.runs.every(x => x.fixture_dirtied === true) && r2.runs.every(x => x.fixture_dirtied === false && /^[0-9a-f]{64}$/.test(x.state_sha256)) && !fs.existsSync(path.join(REPO, "dressing-room", "state", "NEW_BORN.json")) || why({ r: r.runs, r2: r2.runs });
    });
    await tc("L4 COLLAR-NOT-ARMED · assertArmed refusing = UNRUNNABLE, fail-closed (no collar run happens); armed = runs", async () => {
      const collar = makeCollar(REPO, { disarmed: true });
      const { r } = await run1(P("dis", "wc -l docs/notes.md", { exit: 0 }, "sandbox"), { collar });
      return r.verdict === "UNRUNNABLE" && r.quarantine.why === "COLLAR-NOT-ARMED" && r.runs.every(x => x.held === null) && collar.log.some(e => e.ev === "refused") && collar.log.filter(e => e.ev === "destroy").length === 1 || why({ r, log: collar.log });
    });
    await tc("L4 COLLAR ROOT · a collar that builds from another root is refused (COLLAR-NOT-ARMED), never probed on the wrong tree — the collar going first, the host is not run either", async () => {
      const other = path.join(T, "elsewhere"); fs.mkdirSync(other, { recursive: true });
      const { r } = await run1(P("wr", "wc -l docs/notes.md", { exit: 0 }, "host"), { collar: makeCollar(other) });
      return r.verdict === "UNRUNNABLE" && r.quarantine.why === "COLLAR-NOT-ARMED" && /not --root/.test(r.quarantine.detail) && r.runs[0].held === null && r.runs[0].skipped === "COLLAR-NOT-ARMED" || why(r);
    });
    await tc("L4 LAZY COLLAR · a probe.mjs with no sandbox.mjs beside it still IMPORTS; `run` REFUSES (the collar is due), and with --host-only reports its collar axes COLLAR-NOT-ARMED", async () => {
      const lone = path.join(T, "lone", "scripts"); fs.mkdirSync(lone, { recursive: true }); fs.copyFileSync(SELF, path.join(lone, "probe.mjs"));
      const pf = path.join(OUTD, "lone.probes.jsonl"), rf = path.join(OUTD, "lone.receipts.jsonl");
      fs.writeFileSync(pf, JSON.stringify(P("lone", "wc -l docs/notes.md", { exit: 0 }, "host")) + NL);
      const cli = extra => spawnSync(process.execPath, [path.join(lone, "probe.mjs"), "run", "--probes", pf, "--out", rf, "--root", REPO, ...extra], { encoding: "utf8", shell: false, windowsHide: true, timeout: 60000 });
      const refused = cli([]), wroteOnRefusal = fs.existsSync(rf);
      const r = cli(["--host-only"]);
      const rec = fs.existsSync(rf) ? JSON.parse(fs.readFileSync(rf, "utf8").trim()) : null;
      return refused.status === 2 && /REFUSED/.test(refused.stderr) && /could not be loaded/.test(refused.stderr) && !wroteOnRefusal
        && r.status === 0 && rec && rec.quarantine && rec.quarantine.why === "COLLAR-NOT-ARMED" && /could not be loaded/.test(rec.quarantine.detail) && /--host-only/.test(rec.quarantine.detail) && rec.runs[0].held === true
        || why({ refused: refused.status, rerr: String(refused.stderr).slice(0, 200), code: r.status, err: String(r.stderr).slice(0, 300), rec });
    });

    // ================= LAW 5 · VERDICTS, THE REGISTER, STALE
    await tc("VERDICT CONFIRMED · all three held", async () => { const { r } = await run1(P("vc", "grep -c three docs/notes.md", { exit: 0, stdout_includes: ["1"] })); return r.verdict === "CONFIRMED" || why(r); });
    await tc("VERDICT REFUTED · all three not held", async () => { const { r } = await run1(P("vr", "grep -c three docs/notes.md", { exit: 1 })); return r.verdict === "REFUTED" || why(r); });
    // law 7i (row 545): the mixed plant no longer rides grep's exit 2 on a file absent on the sandbox — a recursive grep says 'no match' there
    await tc("VERDICT NON-DETERMINISTIC · mixed runs are named", async () => { const { r } = await run1(P("vn", "grep -r -l STATE_MARK .", { exit: 0 })); return r.verdict === "NON-DETERMINISTIC" && /^mixed: host=held sandbox=not fixture=held/.test(r.verdict_why) || why(r); });
    await tc("VERDICT UNRUNNABLE · the register row carries {why, runnable_if} (planted in every refusal case above)", async () => { const { r } = await run1(P("vu", null, null)); return r.verdict === "UNRUNNABLE" && r.quarantine.why === "UNAUTHORED" && typeof r.quarantine.runnable_if === "string" && r.quarantine.runnable_if.length > 0 || why(r); });
    await tc("VERDICT pure · verdictOf all-true / all-false / mixed / incomplete / quarantined", async () => {
      const h = b => ({ axis: "host", held: b, timed_out: false, capped: false });
      return verdictOf([h(true), h(true), h(true)]).verdict === "CONFIRMED" && verdictOf([h(false), h(false), h(false)]).verdict === "REFUTED" && verdictOf([h(true), h(false), h(true)]).verdict === "NON-DETERMINISTIC"
        && verdictOf([h(true), { ...h(null), capped: true }, h(true)]).verdict === "NON-DETERMINISTIC" && verdictOf([h(true), h(true), h(true)], { why: "X" }).verdict === "UNRUNNABLE";
    });
    await tc("REPORT FACE · the quarantine is counted BY WHY on the FIRST line of `report` (CLI), verdicts on the second", async () => {
      const { ctx } = await ctxFor();
      const recs = [await runProbe(P("f1", null, null), ctx), await runProbe(P("f2", null, null), ctx), await runProbe(P("f3", "wc -l a ; x", { exit: 0 }), ctx), await runProbe(P("f4", "wc -l docs/notes.md", { exit: 0 }), ctx)];
      const rf = path.join(OUTD, "face.receipts.jsonl"); fs.writeFileSync(rf, recs.map(x => JSON.stringify(x)).join(NL) + NL);
      const r = spawnSync(process.execPath, [SELF, "report", "--receipts", rf], { encoding: "utf8", shell: false, windowsHide: true, timeout: 60000 });
      const lines = String(r.stdout).split(/\r?\n/);
      return r.status === 0 && lines[0] === "QUARANTINE 3 of 4 · by why: UNAUTHORED 2 · UNPARSABLE 1" && /^VERDICTS UNRUNNABLE 3 · CONFIRMED 1$/.test(lines[1]) || why(lines.slice(0, 3));
    });
    await tc("REPORT FACE · a clean register says QUARANTINE 0 on line 1 (both ways)", async () => face([{ probe_id: "x", verdict: "CONFIRMED", quarantine: null, lenses: {} }])[0] === "QUARANTINE 0 of 1");

    // ================= LAW 6 · THE RECEIPT
    await tc("L6 RECEIPT · exact keys; tree_sha = HEAD of --root; runs[3] carry the run fields; stdout_head is the first 2 KB; sha256 of the normalized stdout", async () => {
      const { r } = await run1(P("rc", "node scripts/loud.mjs", { exit: 0 }, "sandbox", ["scripts/loud.mjs"]));
      const keys = Object.keys(r).sort().join(","), rk = Object.keys(r.runs[0]).sort().join(",");
      const full = "x".repeat(5000) + "\n";
      // row 545: the receipt gains `silent` (law 9); every run `errored` (law 7i); a run with a node segment its node_trace and silent_success
      return keys === "at,dirty_reads,lenses,probe_id,quarantine,runs,silent,tree_sha,verdict" && r.tree_sha === HEAD1 && rk === "axis,bytes,capped,cmd,crashed,errored,exit,held,node_trace,other_writer,read_absent,retries,seconds,silent_success,stdout_head,stdout_sha256,timed_out,tree_written"
        && r.runs.every(x => x.crashed === null && x.errored === null && x.read_absent === null && x.tree_written === null && x.other_writer === null && x.retries === null && Array.isArray(x.node_trace) && typeof x.silent_success === "boolean")
        && Buffer.byteLength(r.runs[0].stdout_head) === 2048 && r.runs[0].bytes === 5001 && r.runs[0].stdout_sha256 === sha256(Buffer.from(full)) && Object.keys(r.lenses).join(",") === "A,B,C" || why({ keys, rk });
    });

    // ================= LAW 7 · THE LENSES
    await tc("LENS A VACUOUS · removing reads[] the predicate does not rest on leaves held unchanged", async () => {
      const { r } = await run1(P("va", "wc -l docs/notes.md", { exit: 0 }, "host", ["scripts/alpha.mjs:2"]));
      return r.verdict === "CONFIRMED" && r.lenses.A.reading === "VACUOUS" && r.lenses.A.axis === "sandbox" || why(r.lenses);
    });
    await tc("LENS A NOT VACUOUS · removing the read it rests on flips held → NOT-APPLICABLE with the reason", async () => {
      const { r } = await run1(P("nva", "wc -l docs/notes.md", { exit: 0 }, "host", ["docs/notes.md:1-5"]));
      return r.verdict === "CONFIRMED" && r.lenses.A.reading === "NOT-APPLICABLE" && /flipped true → false/.test(r.lenses.A.why) || why(r.lenses);
    });
    await tc("LENS A · a FIXTURE-lane probe ablates on a fresh fixture (the state read removed flips it)", async () => {
      const { r } = await run1(P("fa", "grep -c STATE_MARK dressing-room/state/bus.json", { exit: 0 }, "FIXTURE", ["dressing-room/state/bus.json"]));
      return r.verdict === "CONFIRMED" && r.lenses.A.axis === "fixture" && r.lenses.A.reading === "NOT-APPLICABLE" || why(r.lenses);
    });
    await tc("LENS B · CONFIRM seed + REFUTED now = ALREADY-FIXED; CONFIRM + CONFIRMED and REFUTE + REFUTED are not (pure)", async () =>
      lensB({ verdict_claimed: "CONFIRM", aj_final: "UPHELD" }, "REFUTED").reading === "ALREADY-FIXED" && lensB({ verdict_claimed: "CONFIRM" }, "CONFIRMED").reading === null
      && lensB({ verdict_claimed: "REFUTE" }, "REFUTED").reading === null && lensB({ verdict_claimed: "EXTEND", aj_final: "X" }, "REFUTED").aj === "X");
    await tc("LENS B · end to end: a planted CONFIRM claim the tree now refutes reads ALREADY-FIXED", async () => { const { r } = await run1(P("bf", "grep -c three docs/notes.md", { exit: 1 })); return r.lenses.B.reading === "ALREADY-FIXED" && r.lenses.B.seed === "CONFIRM" && r.lenses.B.now === "REFUTED" || why(r.lenses); });
    // law 7i (row 545): neither split rides a verb's error status any more — HOST-ONLY by a recursive grep's 'no match' on the sandbox,
    // COLLAR-ONLY by the one sanctioned missing-file expectation, the absence DECLARED in reads_absent
    await tc("LENS C HOST-ONLY · the gitignored state holds on host, not on the tracked-only sandbox", async () => { const { r } = await run1(P("ch", "grep -r -l STATE_MARK .", { exit: 0 }, "host")); return r.lenses.C.split === "HOST-ONLY" || why(r.lenses.C); });
    await tc("LENS C COLLAR-ONLY · a missing-file expectation holds on the sandbox only", async () => { const { r } = await run1(P("cc", "wc -l dressing-room/state/bus.json", { exit: 1, reads_absent: ["dressing-room/state/bus.json"] }, "host", ["dressing-room/state/bus.json"])); return r.lenses.C.split === "COLLAR-ONLY" || why(r.lenses.C); });
    await tc("LENS C AGREE · host and collar agree; a lane with no host run names no split", async () => {
      const { r } = await run1(P("ca", "wc -l docs/notes.md", { exit: 0 }, "host")); const { r: r2 } = await run1(P("cn", "wc -l docs/notes.md", { exit: 0 }, "sandbox"));
      return r.lenses.C.split === "AGREE" && r2.lenses.C.split === null || why([r.lenses.C, r2.lenses.C]);
    });

    // ================= LAW 8 · WRITES ONLY WHERE TOLD
    const pf = path.join(OUTD, "w.probes.jsonl");
    fs.writeFileSync(pf, [P("sw", "wc -l docs/notes.md", { exit: 0 }, "host", ["docs/notes.md"]), P("sx", "grep -c ALPHA_MARK scripts/alpha.mjs", { exit: 0 }, "host", ["scripts/alpha.mjs"])].map(x => JSON.stringify(x)).join(NL) + NL);
    await tc("L8 --out INSIDE --root is REFUSED (nothing written); outside it is written", async () => {
      const inRoot = path.join(REPO, "receipts.jsonl");
      let refusedMsg = null; try { await cmdRun({ probes: pf, out: inRoot, root: REPO }, { sandbox: makeCollar(REPO), verbs }, () => {}); } catch (e) { refusedMsg = e instanceof Stop ? e.message : `other ${e.message}`; }
      const outside = path.join(OUTD, "w.receipts.jsonl");
      await cmdRun({ probes: pf, out: outside, root: REPO }, { sandbox: makeCollar(REPO), verbs }, () => {});
      return /REFUSED/.test(refusedMsg || "") && !fs.existsSync(inRoot) && fs.readFileSync(outside, "utf8").trim().split(NL).length === 2 || why({ refusedMsg });
    });
    await tc("L8 THE PROBED TREE IS UNTOUCHED · status, tracked bytes and the state bus identical after every run above", async () => {
      const st = String(git(REPO, "status", "--porcelain", "--ignored").stdout);
      return st.trim() === "!! dressing-room/" && hashTree(path.join(REPO, "dressing-room", "state")) === STATE0 && fs.readdirSync(path.join(REPO, "dressing-room", "state")).join(",") === "bus.json" || why(st);
    });
    await tc("L8 `import` writes only its --out: 2 rows → 2 skeletons, face UNAUTHORED 2", async () => {
      const pop = path.join(OUTD, "pop.jsonl"), outp = path.join(OUTD, "pop.probes.jsonl");
      fs.writeFileSync(pop, [{ id: "a1", seed_claim: "c", seed_file: "f", seed_line: 1, verdict_claimed: "CONFIRM", aj: { final: "UPHELD" }, adjudication: { tier0: "NO-LITERALS" } }, { id: "a2", seed_claim: "d", verdict_claimed: "REFUTE", aj: { final: "OVERTURNED" }, adjudication: { tier0: "LITERALS-HOLD" } }].map(x => JSON.stringify(x)).join(NL) + NL);
      const lines = []; cmdImport({ population: pop, out: outp }, l => lines.push(l));
      const sk = readJsonl(outp);
      return sk.length === 2 && sk.every(s => s.predicate_cmd === null && s.tier === 0 && Array.isArray(s.reads)) && sk[1].source.aj_final === "OVERTURNED" && lines[0] === "QUARANTINE 2 of 2 · by why: UNAUTHORED 2" || why(lines);
    });

    // ================= LAW 7 · A CRASH IS NEVER A VERDICT, NOR AN ABSENT READ; THE TREE IS WATCHED; THE COLLAR BINDS FIRST (row 471)
    // (a) VERB-CRASHED
    await tc("L7a crashOf · pure: each declared set both ways (grep 2 in / 3 out · wc 1 in / 2 out · node 128 in / 129 out) · a signal · a failed spawn", async () => {
      const s = (tool, status, extra = {}) => crashOf(tool, { status, signal: null, ...extra });
      return s("grep", 2) === null && s("grep", 3) !== null && s("wc", 1) === null && s("wc", 2) !== null && s("git", 128) !== null && s("node", 128) === null && s("node", 129) !== null
        && s("grep", 34304).why === "exit 34304 outside its declared 0..2" && s("grep", null, { signal: "SIGABRT" }).why === "killed by SIGABRT" && /spawn failed \(ENOENT\)/.test(s("wc", null, { error: { code: "ENOENT" } }).why) || "a set graded wrong";
    });
    await tc("L7a VERB-CRASHED · a segment outside its set (node exit 200) is incomplete → NON-DETERMINISTIC naming it, never REFUTED; an in-set exit (1) is graded REFUTED", async () => {
      const { r } = await run1(P("c200", "node scripts/exit.mjs 200", { exit: 0 }, "sandbox"));
      const { r: r2 } = await run1(P("c1", "node scripts/exit.mjs 1", { exit: 0 }, "sandbox"));
      return r.verdict === "NON-DETERMINISTIC" && r.runs.every(x => x.held === null && x.crashed && x.crashed.status === 200 && x.exit === 200) && /run 1 \(sandbox\) VERB-CRASHED node exit 200 outside its declared 0\.\.128/.test(r.verdict_why)
        && r2.verdict === "REFUTED" && r2.runs.every(x => x.crashed === null) || why({ r: [r.verdict, r.verdict_why], r2: r2.verdict });
    });
    await tc("L7a VERB-CRASHED · a crash in the FIRST segment of a pipe is not hidden by the last segment's clean exit; a clean first segment is graded", async () => {
      const v = { ...verbs, head: process.execPath };
      const { r } = await run1(P("cpipe", "head scripts/exit.mjs 200 | wc -l", { stdout_includes: ["1"] }, "sandbox"), { verbs: v });
      const { r: r2 } = await run1(P("cpipe0", "head scripts/exit.mjs 0 | wc -l", { stdout_includes: ["1"] }, "sandbox"), { verbs: v });
      return r.verdict === "NON-DETERMINISTIC" && r.runs.every(x => x.crashed && x.crashed.verb === "head") && /VERB-CRASHED head exit 200 outside its declared 0\.\.1/.test(r.verdict_why) && r2.verdict === "CONFIRMED" || why({ r: [r.verdict, r.verdict_why], r2: [r2.verdict, r2.verdict_why] });
    });
    await tc("L7a VERB-CRASHED · THE REAL CRASH where it reproduces (grep -i with two -e) is incomplete, never REFUTED; where grep is sound the same probe is CONFIRMED", async () => {
      const { r } = await run1(P("real", "grep -c -i -e one -e two docs/notes.md", { exit: 0, stdout_includes: ["2"] }, "sandbox"));
      if (!REAL.crashes) return r.verdict === "CONFIRMED" || why(r);
      return r.verdict === "NON-DETERMINISTIC" && r.runs.every(x => x.held === null && x.crashed && x.crashed.verb === "grep" && x.crashed.status > 2) && /VERB-CRASHED grep exit \d+ outside its declared 0\.\.2/.test(r.verdict_why) || why(r);
    });
    await tc("L7a VERB-CRASHED · lens A's ablation run that crashes is NOT-APPLICABLE naming the crash, never read as a flip", async () => {
      const { r } = await run1(P("gone", "node scripts/gone.mjs docs/notes.md", { exit: 0 }, "sandbox", ["docs/notes.md"]));
      return r.verdict === "CONFIRMED" && r.lenses.A.reading === "NOT-APPLICABLE" && /incomplete \(VERB-CRASHED node exit 200/.test(r.lenses.A.why) || why(r.lenses.A);
    });
    // (c) READ-ABSENT
    await tc("L7c READ-ABSENT · a FIXTURE read absent on its axis: incomplete, NOTHING spawned, NON-DETERMINISTIC naming the path — never REFUTED", async () => {
      const n0 = SPAWNS.count; const { r } = await run1(P("rab", "wc -l dressing-room/state/outbox.jsonl", { exit: 0 }, "FIXTURE", ["dressing-room/state/outbox.jsonl:3-5"]));
      return r.verdict === "NON-DETERMINISTIC" && SPAWNS.count === n0 && r.runs.every(x => x.held === null && x.read_absent && x.read_absent.join() === "dressing-room/state/outbox.jsonl")
        && /run 1 \(fixture\) READ-ABSENT dressing-room\/state\/outbox.jsonl/.test(r.verdict_why) || why(r);
    });
    await tc("L7c READ-ABSENT · declared absent by expect.reads_absent, the same probe runs and is graded (wc exits 1 on the missing file → CONFIRMED)", async () => {
      const { r } = await run1(P("rdec", "wc -l dressing-room/state/outbox.jsonl", { exit: 1, reads_absent: ["dressing-room/state/outbox.jsonl"] }, "FIXTURE", ["dressing-room/state/outbox.jsonl:3-5"]));
      return r.verdict === "CONFIRMED" && r.runs.every(x => x.read_absent === null && x.held === true) || why(r);
    });
    await tc("L7c READ-ABSENT · a host-lane read of gitignored state: the tracked-only sandbox run is READ-ABSENT, host and fixture graded", async () => {
      const { r } = await run1(P("rhost", "grep -c STATE_MARK dressing-room/state/bus.json", { exit: 0 }, "host", ["dressing-room/state/bus.json"]));
      return r.runs.map(x => x.held).join(",") === "true,,true" && r.runs[1].read_absent.join() === "dressing-room/state/bus.json" && r.verdict === "NON-DETERMINISTIC" && /run 2 \(sandbox\) READ-ABSENT/.test(r.verdict_why) || why(r.runs.map(x => [x.axis, x.held, x.read_absent]));
    });
    await tc("L7c READ-ABSENT · on the HOST axis too: a read absent everywhere (and one outside the tree) is READ-ABSENT on every run, nothing spawned", async () => {
      const n0 = SPAWNS.count; const { r } = await run1(P("rall", "wc -l docs/none.md", { exit: 0 }, "host", ["docs/none.md", "../outside.md"]));
      return r.verdict === "NON-DETERMINISTIC" && SPAWNS.count === n0 && r.runs.every(x => x.held === null && x.read_absent && x.read_absent.join() === "docs/none.md,../outside.md") && /run 1 \(host\) READ-ABSENT/.test(r.verdict_why) || why(r.runs.map(x => [x.axis, x.read_absent]));
    });
    await tc("L7c EXPECT-MALFORMED · reads_absent naming a path reads[] lacks, or standing alone, is refused; a well-formed one is not", async () => {
      const a = staticCheck(P("rx", "wc -l docs/notes.md", { exit: 0, reads_absent: ["docs/other.md"] }, "host", ["docs/notes.md"]), verbs).quarantine;
      const b = expectProblem({ reads_absent: ["docs/notes.md"] }), c = expectProblem({ exit: 0, reads_absent: [] });
      const ok2 = staticCheck(P("ry", "wc -l docs/notes.md", { exit: 0, reads_absent: ["docs/notes.md:2"] }, "host", ["docs/notes.md"]), verbs);
      return a && a.why === "EXPECT-MALFORMED" && /docs\/other.md/.test(a.detail) && /none of/.test(b || "") && /reads_absent/.test(c || "") && ok2.plans !== undefined || why({ a, b, c });
    });
    // (b) THE TREE WATCHER — its own fixture tree, since these cases WRITE into --root on purpose (the engine never deletes; the case does)
    const WREPO = path.join(T, "wrepo");
    w(path.join(WREPO, "scripts", "writer.mjs"), "import fs from 'node:fs';\nfs.writeFileSync(process.argv[2], 'written by the planted verb ' + Date.now() + '\\n');\nconsole.log('wrote');\n");
    w(path.join(WREPO, "docs", "notes.md"), "one\ntwo\nthree\n");
    w(path.join(WREPO, ".gitignore"), "dressing-room/state/\n*.stackdump\n");
    w(path.join(WREPO, "dressing-room", "state", "bus.json"), "{}\n");
    w(path.join(WREPO, "old.stackdump"), "old\n");
    git(WREPO, "init", "-q"); git(WREPO, "add", "-A"); git(WREPO, "commit", "-q", "-m", "wfixture");
    const wv = { ...verbs, wc: process.execPath };             // `wc scripts/writer.mjs <path>` = a verb that writes without a write flag
    const runW = async (p, v = wv, o = {}) => { const collar = o.collar || makeCollar(WREPO); const ctx = await makeCtx({ root: WREPO }, { sandbox: collar, verbs: v, ...(o.deps || {}) }); if (o.hostOnly) ctx.hostOnly = true; return runProbe(p, ctx); };
    const rmW = rel => fs.rmSync(path.join(WREPO, ...rel.split("/")), { force: true });
    const writtenCase = async (id, cmd, rel) => {
      const r = await runW(P(id, cmd, { stdout_includes: ["wrote"] }, "host"));
      const kept = fs.existsSync(path.join(WREPO, ...rel.split("/")));
      return r.verdict === "UNRUNNABLE" && r.quarantine.why === "TREE-WRITTEN" && r.quarantine.detail === rel && r.runs[0].tree_written.join() === rel && r.runs[0].held === null
        && r.runs.slice(1).every(x => x.tree_written === null) && kept || why({ v: r.verdict, q: r.quarantine, kept });
    };
    await tc("L7b TREE WATCHER · an untracked write (only the porcelain sees it) → TREE-WRITTEN naming it, the file KEPT (never deleted)", async () => { try { return await writtenCase("wa", "wc scripts/writer.mjs docs/new.txt", "docs/new.txt"); } finally { rmW("docs/new.txt"); } });
    await tc("L7b TREE WATCHER · an IGNORED write (only --ignored sees it) → TREE-WRITTEN", async () => { try { return await writtenCase("wb", "wc scripts/writer.mjs docs/x.stackdump", "docs/x.stackdump"); } finally { rmW("docs/x.stackdump"); } });
    await tc("L7b TREE WATCHER · an overwrite of an existing ignored top-level file (only the listing's size / mtime sees it) → TREE-WRITTEN", async () => writtenCase("wc", "wc scripts/writer.mjs old.stackdump", "old.stackdump"));
    await tc("L7b TREE WATCHER · a write into the cwd a `cd` enters inside an ignored dir (only the cwd listing sees it) → TREE-WRITTEN", async () => { try { return await writtenCase("wd", "cd dressing-room/state && wc ../../scripts/writer.mjs w.txt", "dressing-room/state/w.txt"); } finally { rmW("dressing-room/state/w.txt"); } });
    await tc("L7b TREE WATCHER · a read-only probe leaves the view identical: no tree_written, graded (the other way)", async () => {
      const r = await runW(P("wro", "grep -c two docs/notes.md", { exit: 0 }, "host"), verbs);
      return r.verdict === "CONFIRMED" && r.quarantine === null && r.runs.every(x => x.tree_written === null) || why(r);
    });
    await tc("L7b TREE WATCHER · THE REAL CRASH on the host axis (--host-only: no collar run goes first): its stackdump in --root is TREE-WRITTEN, the run VERB-CRASHED, never REFUTED (where grep is sound: graded, untouched)", async () => {
      try {
        const r = await runW(P("wreal", "grep -c -i -e one -e two docs/notes.md", { exit: 0, stdout_includes: ["2"] }, "host"), verbs, { hostOnly: true });
        if (!REAL.crashes) return r.runs[0].held === true && r.runs.every(x => x.tree_written === null) || why(r);
        return r.verdict === "UNRUNNABLE" && r.quarantine.why === "TREE-WRITTEN" && /grep\.exe\.stackdump/.test(r.quarantine.detail) && r.runs[0].crashed && r.runs[0].crashed.status > 2 && fs.existsSync(path.join(WREPO, "grep.exe.stackdump")) || why(r);
      } finally { rmW("grep.exe.stackdump"); }
    });
    // (e) COLLAR FIRST
    await tc("L7e COLLAR FIRST · THE REAL CRASH: the plan crashes on the collar, so it is never run on --root — NON-DETERMINISTIC / VERB-CRASHED, the host NOT-RUN, --root untouched (where grep is sound: CONFIRMED)", async () => {
      try {
        const r = await runW(P("ereal", "grep -c -i -e one -e two docs/notes.md", { exit: 0, stdout_includes: ["2"] }, "host"), verbs);
        const dumped = fs.existsSync(path.join(WREPO, "grep.exe.stackdump"));
        if (!REAL.crashes) return r.verdict === "CONFIRMED" && !dumped || why(r);
        return r.verdict === "NON-DETERMINISTIC" && r.quarantine === null && !dumped && r.runs[0].exit === null && /^COLLAR-CRASHED — the plan crashed on sandbox \(grep exit \d+/.test(r.runs[0].skipped)
          && r.runs.slice(1).every(x => x.crashed && x.crashed.verb === "grep" && x.tree_written === null) && /^incomplete: run 1 \(host\) NOT-RUN COLLAR-CRASHED/.test(r.verdict_why) || why({ v: r.verdict, q: r.quarantine, dumped, why: r.verdict_why });
      } finally { rmW("grep.exe.stackdump"); }
    });
    await tc("L7e COLLAR FIRST · a host-lane plan that crashes on the collar (exit 200) spawns nothing on the host; one that does not crash (an in-set exit 1) IS run there and graded", async () => {
      // law 7i (row 545): head's 1 is its error status now, so the in-set non-crash exit is grep's 1 (no match), node standing in
      const v = { ...verbs, head: process.execPath, grep: process.execPath };
      const n0 = SPAWNS.count; const { r } = await run1(P("ecrash", "head scripts/exit.mjs 200", { exit: 0 }, "host"), { verbs: v }); const n1 = SPAWNS.count;
      const { r: r2 } = await run1(P("eok", "grep scripts/exit.mjs 1", { exit: 1 }, "host"), { verbs: v }); const n2 = SPAWNS.count;
      return r.verdict === "NON-DETERMINISTIC" && n1 - n0 === 2 && r.runs[0].skipped && /COLLAR-CRASHED/.test(r.runs[0].skipped) && r.runs[1].crashed && r.runs[2].crashed && /run 1 \(host\) NOT-RUN COLLAR-CRASHED/.test(r.verdict_why)
        && r2.verdict === "CONFIRMED" && n2 - n1 === 3 && r2.runs[0].held === true || why({ spawned: [n1 - n0, n2 - n1], r: r.runs.map(x => [x.axis, x.skipped, x.crashed && x.crashed.status]), r2: r2.verdict });
    });
    await tc("L7e COLLAR FIRST · a crash on ANY collar axis (here only the fixture, the last one) keeps the plan off --root", async () => {
      const { r } = await run1(P("efix", "head scripts/present.mjs dressing-room/state/bus.json", { exit: 0 }, "host"), { verbs: { ...verbs, head: process.execPath } });
      return r.verdict === "NON-DETERMINISTIC" && r.runs[1].held === true && r.runs[2].crashed && r.runs[2].crashed.status === 200 && /the plan crashed on fixture/.test(r.runs[0].skipped || "") || why(r.runs.map(x => [x.axis, x.held, x.skipped, x.crashed && x.crashed.status]));
    });
    const LEAK = path.join(WREPO, "leaked.txt");
    w(path.join(WREPO, "scripts", "leak.mjs"), `import fs from 'node:fs';\nif (!fs.existsSync(process.argv[2])) fs.writeFileSync(${JSON.stringify(LEAK)}, 'leaked\\n');\nconsole.log('ok');\n`);
    git(WREPO, "add", "-A"); git(WREPO, "commit", "-q", "-m", "leak");
    // (f) rule A REPLACES row 471 (1)(b)'s "a collar run that leaks into --root is TREE-WRITTEN too" (row 495 (1)(A)): the
    // REAL collar's node verbs are denied every write outside its temp tree (audit_preload; sandbox.mjs canary); this FAKE
    // collar has no preload, so its verb can leak — and the leak is then named, kept, and the run graded.
    await tc("L7f-A0 (A) · a --root change while an ARMED COLLAR axis ran is other_writer rule A on the run, GRADED, the file KEPT: a main run, and lens A's ablation run", async () => {
      try {
        const r = await runW(P("lmain", "node scripts/leak.mjs docs/nothere.md", { stdout_includes: ["ok"] }, "sandbox"), verbs);
        const leakedMain = fs.existsSync(LEAK); rmW("leaked.txt");
        const r2 = await runW(P("labl", "node scripts/leak.mjs docs/notes.md", { stdout_includes: ["ok"] }, "sandbox", ["docs/notes.md"]), verbs);
        const ow = r.runs[0].other_writer, aw = r2.lenses.A.other_writer;
        return r.verdict === "CONFIRMED" && r.quarantine === null && r.runs[0].axis === "sandbox" && r.runs.every(x => x.tree_written === null) && leakedMain
          && ow && ow.length === 1 && ow[0].path === "leaked.txt" && ow[0].rule === "A" && ow[0].pid === null
          && r2.verdict === "CONFIRMED" && r2.quarantine === null && r2.lenses.A.reading === "VACUOUS" && aw && aw.length === 1 && aw[0].path === "leaked.txt" && aw[0].rule === "A"
          || why({ r: [r.verdict, r.quarantine, ow], r2: [r2.verdict, r2.quarantine, r2.lenses.A] });
      } finally { rmW("leaked.txt"); }
    });
    // ITS SIBLING (row 500, the architect's word): the same leak by the probe's OWN tree, named so it can be told — the verb
    // writes <existing file>.<its parent pid = this engine>.tmp into --root — still REDS on the collar axis
    const OWNLEAK = path.join(WREPO, "docs", `notes.md.${process.pid}.tmp`);
    w(path.join(WREPO, "scripts", "leakown.mjs"), `import fs from 'node:fs';\nif (!fs.existsSync(process.argv[2])) fs.writeFileSync(${JSON.stringify(path.join(WREPO, "docs"))} + '/notes.md.' + process.ppid + '.tmp', 'own\\n');\nconsole.log('ok');\n`);
    git(WREPO, "add", "-A"); git(WREPO, "commit", "-q", "-m", "leakown");
    await tc("L7f-A4 (A) the sibling · a COLLAR run whose verb (the probe's OWN tree) leaks a tmp named for this engine stays TREE-WRITTEN, the file kept: a main run, and lens A's ablation run (its verdict withdrawn)", async () => {
      const rel = `docs/notes.md.${process.pid}.tmp`;
      try {
        const r = await runW(P("lown", "node scripts/leakown.mjs docs/nothere.md", { stdout_includes: ["ok"] }, "sandbox"), verbs);
        const kept = fs.existsSync(OWNLEAK); rmW(rel);
        const r2 = await runW(P("lownabl", "node scripts/leakown.mjs docs/notes.md", { stdout_includes: ["ok"] }, "sandbox", ["docs/notes.md"]), verbs);
        return r.verdict === "UNRUNNABLE" && r.quarantine.why === "TREE-WRITTEN" && r.quarantine.detail === rel && r.runs[0].axis === "sandbox" && r.runs[0].other_writer === null && kept
          && r2.verdict === "UNRUNNABLE" && r2.quarantine.why === "TREE-WRITTEN" && r2.runs.every(x => x.held === true) && new RegExp(`the ablation run on sandbox wrote into --root: ${rel.replace(/\./g, "[.]")}`).test(r2.lenses.A.why) || why({ r: [r.verdict, r.quarantine, kept], r2: [r2.verdict, r2.quarantine, r2.lenses.A] });
      } finally { rmW(rel); }
    });
    await tc("L7b TREE WATCHER · a collar BUILD that writes into --root and then refuses to arm is TREE-WRITTEN, never filed as COLLAR-NOT-ARMED", async () => {
      const lb = path.join(WREPO, "leakbuild.txt");
      try {
        const ctx = await makeCtx({ root: WREPO }, { sandbox: makeCollar(WREPO, { disarmed: true, leakTo: lb }), verbs });
        const r = await runProbe(P("lbuild", "wc -l docs/notes.md", { exit: 0 }, "sandbox"), ctx);
        return r.verdict === "UNRUNNABLE" && r.quarantine.why === "TREE-WRITTEN" && r.quarantine.detail === "leakbuild.txt" || why(r.quarantine);
      } finally { fs.rmSync(lb, { force: true }); }
    });
    // (f) ANOTHER WRITER — the pids are REAL: a live FOREIGN one (an orphaned sleeper; its parent exited, so it is not in this
    // engine's process tree) and this engine's OWN (process.pid); DEAD is a pid no process holds (an exited child's pid can be
    // reused at once on Windows by any process the laptop starts, so it is not used). The snapshot is the real process table
    // of this machine; only B6 injects one (absent).
    const orphan = spawnSync(process.execPath, ["-e", "const c=require('child_process').spawn(process.execPath,['-e','setTimeout(()=>{},300000)'],{detached:true,stdio:'ignore',windowsHide:true});c.unref();console.log(c.pid)"], { encoding: "utf8", shell: false, windowsHide: true, timeout: 30000 });
    const DAEMON = Number(String(orphan.stdout).trim()), DEAD = 4294967291;
    // the other writer finishing its rename: removes the file the moment it is seen, at the engine's first await (B's settle)
    const removeWhenSeen = rel => { const f = path.join(WREPO, ...rel.split("/")); const t = setInterval(() => { if (fs.existsSync(f)) { fs.rmSync(f, { force: true }); clearInterval(t); } }, 40); return () => clearInterval(t); };
    const hostTmp = async (id, rel, { remove = true, deps = {} } = {}) => {
      const stop = remove ? removeWhenSeen(rel) : () => {};
      try { const r = await runW(P(id, `wc scripts/writer.mjs ${rel}`, { stdout_includes: ["wrote"] }, "host"), wv, { deps: { settleMs: 2500, ...deps } }); return { r, kept: fs.existsSync(path.join(WREPO, ...rel.split("/"))) }; }
      finally { stop(); rmW(rel); }
    };
    const staysWritten = (r, rel) => r.verdict === "UNRUNNABLE" && r.quarantine.why === "TREE-WRITTEN" && r.quarantine.detail === rel && r.runs[0].axis === "host" && r.runs[0].tree_written.join() === rel && r.runs[0].other_writer === null;
    await tc("L7f-P0 pure · TMP_SHAPE: <file>.<pid>.tmp both ways (no pid, a non-digit pid, an empty base are not the shape); inOwnTree walks the ppid chain both ways, bounded on a cycle", async () => {
      const m = TMP_SHAPE.exec("dressing-room/state/brain_queue.json.8020.tmp");
      const no = ["dressing-room/state/brain_queue.json.tmp", "x.json.80a0.tmp", "a/.8020.tmp", "x.json.8020.tmp.bak"].filter(s => TMP_SHAPE.test(s));
      const snap = new Map([[10, { ppid: 5 }], [5, { ppid: 1 }], [1, { ppid: 0 }], [0, { ppid: 0 }], [7, { ppid: 8 }], [8, { ppid: 7 }]]);
      return m && m[1] === "dressing-room/state/brain_queue.json" && m[2] === "8020" && no.length === 0
        && inOwnTree(10, snap, 5) && inOwnTree(5, snap, 5) && !inOwnTree(1, snap, 5) && !inOwnTree(99, snap, 5) && !inOwnTree(7, snap, 5) || why({ m, no });
    });
    await tc("L7f-P2 pure · the process-table parsers: a Win32_Process CSV row (the header and a blank are not rows) and a /proc stat line whose name holds spaces and parentheses", async () => {
      const c = cimRow('"8020","4532","0","node.exe"'), h = cimRow('"ProcessId","ParentProcessId","SessionId","Name"'), b = cimRow("");
      const s = statFields("4242 (node (x) y) S 17 4242 99 0 -1 4194560 0 0");
      return c && c.pid === 8020 && c.ppid === 4532 && c.session === 0 && c.name === "node.exe" && h === null && b === null && s.ppid === 17 && s.session === 99 && s.name === "node (x) y" || why({ c, h, s });
    });
    await tc("L7f-P1 the REAL process table · the orphan is live and foreign, this engine is its own tree, the dead pid is absent", async () => {
      const s = procSnapshot();
      return Boolean(s) && s.has(DAEMON) && !inOwnTree(DAEMON, s) && inOwnTree(process.pid, s) && !s.has(DEAD) || why({ snap: Boolean(s), DAEMON, DEAD, has: s && s.has(DAEMON), own: s && inOwnTree(DAEMON, s) });
    });
    await tc("L7f-B1 (B) · on the HOST axis a daemon-shaped <existing file>.<pid>.tmp, the pid live and foreign, gone within the settle = other_writer rule B naming pid and session — the run GRADED", async () => {
      const rel = `docs/notes.md.${DAEMON}.tmp`, { r } = await hostTmp("fb1", rel), ow = r.runs[0].other_writer;
      return r.verdict === "CONFIRMED" && r.quarantine === null && r.runs.every(x => x.tree_written === null) && ow && ow.length === 1 && ow[0].path === rel && ow[0].pid === DAEMON && ow[0].rule === "B" && ow[0].session !== null || why({ v: r.verdict, q: r.quarantine, ow });
    });
    await tc("L7f-B2 (B) · the pid in the name is THIS ENGINE'S OWN process tree → stays TREE-WRITTEN, though gone within the settle", async () => { const rel = `docs/notes.md.${process.pid}.tmp`, { r } = await hostTmp("fb2", rel); return staysWritten(r, rel) || why({ v: r.verdict, q: r.quarantine }); });
    await tc("L7f-B3 (B) · the pid in the name is DEAD → stays TREE-WRITTEN", async () => { const rel = `docs/notes.md.${DEAD}.tmp`, { r } = await hostTmp("fb3", rel); return staysWritten(r, rel) || why({ v: r.verdict, q: r.quarantine }); });
    await tc("L7f-B4 (B) · the tmp is NOT gone within the settle → stays TREE-WRITTEN, the file kept", async () => { const rel = `docs/notes.md.${DAEMON}.tmp`, { r, kept } = await hostTmp("fb4", rel, { remove: false, deps: { settleMs: 600 } }); return staysWritten(r, rel) && kept || why({ v: r.verdict, q: r.quarantine, kept }); });
    await tc("L7f-B5 (B) · no <existing file> beside the tmp → stays TREE-WRITTEN", async () => { const rel = `docs/nothere.md.${DAEMON}.tmp`, { r } = await hostTmp("fb5", rel); return staysWritten(r, rel) || why({ v: r.verdict, q: r.quarantine }); });
    await tc("L7f-B6 (B) · no process table (the snapshot unreadable) confirms nothing → stays TREE-WRITTEN", async () => { const rel = `docs/notes.md.${DAEMON}.tmp`, { r } = await hostTmp("fb6", rel, { deps: { procSnapshot: () => null } }); return staysWritten(r, rel) || why({ v: r.verdict, q: r.quarantine }); });
    const collarTmp = (rel, o = {}) => makeCollar(WREPO, { ...o, during: () => { const f = path.join(WREPO, ...rel.split("/")); if (!fs.existsSync(f)) fs.writeFileSync(f, "an atomic write in flight\n"); } });
    await tc("L7f-A1 (A) · a daemon-shaped tmp written while an ARMED COLLAR axis runs = other_writer rule A with its pid and session, the run GRADED, the file kept (no settle needed)", async () => {
      const rel = `docs/notes.md.${DAEMON}.tmp`;
      try {
        const r = await runW(P("fa1", "wc -l docs/notes.md", { exit: 0 }, "sandbox"), verbs, { collar: collarTmp(rel) }), ow = r.runs[0].other_writer, kept = fs.existsSync(path.join(WREPO, ...rel.split("/")));
        return r.verdict === "CONFIRMED" && r.quarantine === null && r.runs.every(x => x.tree_written === null) && kept && ow && ow.length === 1 && ow[0].path === rel && ow[0].pid === DAEMON && ow[0].session !== null && ow[0].rule === "A" || why({ v: r.verdict, q: r.quarantine, ow, kept });
      } finally { rmW(rel); }
    });
    await tc("L7f-A2 (A) stricter · a tmp named for THIS ENGINE'S OWN pid on a collar axis stays TREE-WRITTEN", async () => {
      const rel = `docs/notes.md.${process.pid}.tmp`;
      try { const r = await runW(P("fa2", "wc -l docs/notes.md", { exit: 0 }, "sandbox"), verbs, { collar: collarTmp(rel) }); return r.verdict === "UNRUNNABLE" && r.quarantine.why === "TREE-WRITTEN" && r.quarantine.detail === rel && r.quarantine.axis === "sandbox" || why({ v: r.verdict, q: r.quarantine }); }
      finally { rmW(rel); }
    });
    await tc("L7f-A3 (A) needs an ARMED collar · a collar that refused to arm proves nothing, so rule B judges its window: a daemon tmp still there stays TREE-WRITTEN; one gone within the settle is named on the stub, the probe COLLAR-NOT-ARMED", async () => {
      const rel = `docs/notes.md.${DAEMON}.tmp`;
      try {
        const r = await runW(P("fa3", "wc -l docs/notes.md", { exit: 0 }, "sandbox"), verbs, { collar: collarTmp(rel, { disarmed: true }), deps: { settleMs: 600 } }); rmW(rel);
        const stop = removeWhenSeen(rel);
        let r2; try { r2 = await runW(P("fa3b", "wc -l docs/notes.md", { exit: 0 }, "sandbox"), verbs, { collar: collarTmp(rel, { disarmed: true }), deps: { settleMs: 2500 } }); } finally { stop(); }
        const ow = r2.runs[0].other_writer;
        return r.verdict === "UNRUNNABLE" && r.quarantine.why === "TREE-WRITTEN" && r.quarantine.detail === rel
          && r2.verdict === "UNRUNNABLE" && r2.quarantine.why === "COLLAR-NOT-ARMED" && ow && ow.length === 1 && ow[0].rule === "B" && ow[0].pid === DAEMON || why({ r: r.quarantine, r2: [r2.quarantine, ow] });
      } finally { rmW(rel); }
    });
    await tc("L7f-R0 `run` · a probe that saw another writer is NOT red (exit 0): a NOTE line names it with its pid, and the face counts OTHER-WRITER", async () => {
      const rel = `docs/notes.md.${DAEMON}.tmp`, po = path.join(OUTD, "ow.probes.jsonl"), lines = [];
      fs.writeFileSync(po, JSON.stringify(P("frun", "wc -l docs/notes.md", { exit: 0 }, "sandbox")) + NL);
      try {
        const code = await cmdRun({ probes: po, out: path.join(OUTD, "ow.receipts.jsonl"), root: WREPO }, { sandbox: collarTmp(rel), verbs }, l => lines.push(l));
        return code === 0 && !lines.some(l => /^RED/.test(l)) && lines.some(l => l.startsWith(`NOTE: frun saw another writer in --root (law 7f rule A, graded): ${rel} · pid ${DAEMON}`)) && lines[3] && lines[3].startsWith("OTHER-WRITER 1 of 1") || why({ code, lines });
      } finally { rmW(rel); }
    });
    try { process.kill(DAEMON); } catch {}
    // (g) A LOCKED FILE — retried, bounded, named
    await tc("L7g-P0 pure · retryLocked: locked twice then fine = the value + 2 named + waits 250/500; locked past the bound = CollarError after 4 (waits 250/500/1000); any other error thrown at once, unnamed; EDOM read from the message too", async () => {
      const mk = code => Object.assign(new Error(`${code}, locked`), { code });
      let n = 0; const s1 = [], n1 = [], v = retryLocked("step", () => { if (n++ < 2) throw mk("EDOM"); return 42; }, n1, { sleep: ms => s1.push(ms) });
      const s2 = [], n2 = []; let e2 = null; try { retryLocked("the copy", () => { throw mk("EBUSY"); }, n2, { sleep: ms => s2.push(ms) }); } catch (e) { e2 = e; }
      const s3 = [], n3 = []; let e3 = null; try { retryLocked("x", () => { throw mk("ENOENT"); }, n3, { sleep: ms => s3.push(ms) }); } catch (e) { e3 = e; }
      return v === 42 && n1.length === 2 && n1.every(x => x.code === "EDOM" && x.step === "step") && s1.join() === "250,500"
        && e2 instanceof CollarError && /^the copy stayed locked after 4 attempt\(s\), EBUSY/.test(e2.message) && n2.length === 4 && s2.join() === "250,500,1000"
        && e3 && e3.code === "ENOENT" && n3.length === 0 && s3.length === 0
        && lockedCode({ message: "EDOM, The process cannot access the file" }) === "EDOM" && lockedCode({ code: "EPERM" }) === null || why({ v, n1, s1, e2: e2 && e2.message, s2, e3: e3 && e3.code });
    });
    await tc("L7g-C1 the collar BUILD locked once (EDOM) is retried and NAMED on that run; the probe GRADED", async () => {
      const { r } = await run1(P("gb", "wc -l docs/notes.md", { exit: 0 }, "sandbox"), { collar: makeCollar(REPO, { lockFirst: "EDOM" }), deps: { retryBaseMs: 1 } });
      const rt = r.runs[0].retries;
      return r.verdict === "CONFIRMED" && rt && rt.length === 1 && rt[0].step === "buildSandbox" && rt[0].code === "EDOM" && rt[0].attempt === 1 && r.runs.slice(1).every(x => x.retries === null) || why({ v: r.verdict, rt, q: r.quarantine });
    });
    await tc("L7g-C2 the fixture's state copy locked twice (EBUSY) is retried and NAMED; locked past the bound it is COLLAR-NOT-ARMED naming the lock — never an INTERNAL crash", async () => {
      let calls = 0; const copyState = (a, b) => { if (calls++ < 2) throw Object.assign(new Error("EBUSY, resource busy or locked"), { code: "EBUSY" }); fs.cpSync(a, b, { recursive: true, force: true }); };
      const { r } = await run1(P("gc", "grep -c STATE_MARK dressing-room/state/bus.json", { exit: 0 }, "FIXTURE"), { deps: { retryBaseMs: 1, copyState } });
      const rt = r.runs[0].retries;
      const { r: r2 } = await run1(P("gx", "grep -c STATE_MARK dressing-room/state/bus.json", { exit: 0 }, "FIXTURE"), { deps: { retryBaseMs: 1, copyState: () => { throw Object.assign(new Error("EDOM, locked a portion of the file"), { code: "EDOM" }); } } });
      return r.verdict === "CONFIRMED" && rt && rt.length === 2 && rt.every(x => x.step === "the fixture's state copy" && x.code === "EBUSY")
        && r2.verdict === "UNRUNNABLE" && r2.quarantine.why === "COLLAR-NOT-ARMED" && /the fixture's state copy stayed locked after 4 attempt\(s\), EDOM/.test(r2.quarantine.detail) || why({ r: [r.verdict, rt], r2: r2.quarantine });
    });
    await tc("L7g-C3 a NON-lock error in the copy is not retried: thrown on its first attempt, as before", async () => {
      let calls = 0, err = null;
      try { await run1(P("gn", "grep -c STATE_MARK dressing-room/state/bus.json", { exit: 0 }, "FIXTURE"), { deps: { retryBaseMs: 1, copyState: () => { calls++; throw Object.assign(new Error("ENOENT, no such file"), { code: "ENOENT" }); } } }); } catch (e) { err = e; }
      return err && err.code === "ENOENT" && calls === 1 || why({ calls, err: err && err.code });
    });
    await tc("L7b `run` · a probe that wrote --root makes the call RED (1) with a line naming it; a clean call is 0", async () => {
      const pw = path.join(OUTD, "wr.probes.jsonl"), pc = path.join(OUTD, "wc.probes.jsonl");
      fs.writeFileSync(pw, JSON.stringify(P("wrun", "wc scripts/writer.mjs docs/cli.txt", { stdout_includes: ["wrote"] }, "host")) + NL);
      fs.writeFileSync(pc, JSON.stringify(P("crun", "grep -c two docs/notes.md", { exit: 0 }, "host")) + NL);
      try {
        const la = [], lb = [];
        const a = await cmdRun({ probes: pw, out: path.join(OUTD, "wr.receipts.jsonl"), root: WREPO }, { sandbox: makeCollar(WREPO), verbs: wv }, l => la.push(l));
        const b = await cmdRun({ probes: pc, out: path.join(OUTD, "wc.receipts.jsonl"), root: WREPO }, { sandbox: makeCollar(WREPO), verbs }, l => lb.push(l));
        return a === 1 && la.some(l => /^RED: 1 probe\(s\) wrote into --root .* wrun → docs\/cli.txt/.test(l)) && b === 0 && !lb.some(l => /^RED/.test(l)) || why({ a, b, la: la.slice(-1) });
      } finally { rmW("docs/cli.txt"); }
    });
    await tc("L7b READING WRITES NOTHING · a stale index is never refreshed into .git by the engine's git status (--no-optional-locks); a plain git status does rewrite it", async () => {
      const idx = path.join(WREPO, ".git", "index"), sig = () => sha256(fs.readFileSync(idx));
      const later = new Date(Date.now() + 120000); fs.utimesSync(path.join(WREPO, "docs", "notes.md"), later, later);
      const before = sig(); await runW(P("wlock", "grep -c two docs/notes.md", { exit: 0 }, "host"), verbs); const afterEngine = sig();
      git(WREPO, "status", "--porcelain"); const afterPlain = sig();
      return afterEngine === before && afterPlain !== before || why({ engineWrote: afterEngine !== before, plainWrote: afterPlain !== before });
    });
    // (d) THE COLLAR BINDS FIRST
    await tc("L7d FOREIGN ROOT · `run` REFUSES before any spawn when the collar builds from another tree; --out not written", async () => {
      const other = path.join(T, "elsewhere2"); fs.mkdirSync(other, { recursive: true });
      const out = path.join(OUTD, "fr.receipts.jsonl"), n0 = SPAWNS.count;
      let msg = null; try { await cmdRun({ probes: pf, out, root: REPO }, { sandbox: makeCollar(other), verbs }, () => {}); } catch (e) { msg = e instanceof Stop ? e.message : `other ${e.message}`; }
      return /REFUSED — a collar axis is due/.test(msg || "") && /not --root/.test(msg) && SPAWNS.count === n0 && !fs.existsSync(out) || why({ msg, spawned: SPAWNS.count - n0 });
    });
    await tc("L7d --host-only · the same call runs the host axis alone: collar axes COLLAR-NOT-ARMED (--host-only), no collar built", async () => {
      const collar = makeCollar(path.join(T, "elsewhere2")), out = path.join(OUTD, "ho.receipts.jsonl");
      const code = await cmdRun({ probes: pf, out, root: REPO, "host-only": true }, { sandbox: collar, verbs }, () => {});
      const recs = readJsonl(out);
      return code === 0 && recs.length === 2 && recs.every(x => x.quarantine && x.quarantine.why === "COLLAR-NOT-ARMED" && /--host-only/.test(x.quarantine.detail) && x.runs[0].held === true) && !collar.log.some(e => e.ev === "build") || why({ code, q: recs.map(x => x.quarantine), log: collar.log });
    });
    await tc("L7d NOTHING DUE · a call whose probes are all on the register (no collar axis due) is not refused", async () => {
      const pu = path.join(OUTD, "un.probes.jsonl"), out = path.join(OUTD, "un.receipts.jsonl"); fs.writeFileSync(pu, JSON.stringify(P("onlyun", null, null)) + NL);
      const code = await cmdRun({ probes: pu, out, root: REPO }, { sandbox: makeCollar(path.join(T, "elsewhere2")), verbs }, () => {});
      return code === 0 && readJsonl(out)[0].quarantine.why === "UNAUTHORED" || why({ code });
    });

    // ================= STALE (status) · a moved read and a dirty read, both ways
    await tc("STALE · a committed change to a read → STALE; a probe whose reads did not move keeps its verdict", async () => {
      const rf = path.join(OUTD, "w.receipts.jsonl");
      fs.appendFileSync(path.join(REPO, "docs", "notes.md"), "six\n"); git(REPO, "commit", "-q", "-am", "move notes");
      const s = await statusOf({ probes: pf, receipts: rf, root: REPO }, { sandbox: makeCollar(REPO), verbs });
      const m = Object.fromEntries(s.rows.map(r => [r.id, r]));
      return m.sw.status === "STALE" && /docs\/notes.md/.test(m.sw.why) && m.sx.status === "CONFIRMED" && m.sx.why === "tree moved, reads untouched" || why(s.rows);
    });
    await tc("STALE · a DIRTY read is recorded in the receipt's dirty_reads and makes status STALE; a clean read does not", async () => {
      fs.appendFileSync(path.join(REPO, "scripts", "alpha.mjs"), "// dirty\n");
      const rf = path.join(OUTD, "d.receipts.jsonl");
      await cmdRun({ probes: pf, out: rf, root: REPO }, { sandbox: makeCollar(REPO), verbs }, () => {});
      const recs = readJsonl(rf), s = await statusOf({ probes: pf, receipts: rf, root: REPO }, { sandbox: makeCollar(REPO), verbs });
      const m = Object.fromEntries(s.rows.map(r => [r.id, r])), rx = recs.find(x => x.probe_id === "sx"), rw = recs.find(x => x.probe_id === "sw");
      git(REPO, "checkout", "--", "scripts/alpha.mjs");
      return rx.dirty_reads.join(",") === "scripts/alpha.mjs" && rw.dirty_reads.length === 0 && m.sx.status === "STALE" && m.sw.status === "CONFIRMED" || why({ rows: s.rows, dr: rx.dirty_reads });
    });
    await tc("STALE · the status face counts STALE among the verdicts (CLI)", async () => {
      fs.appendFileSync(path.join(REPO, "docs", "notes.md"), "seven\n"); git(REPO, "commit", "-q", "-am", "move again");
      const lines = []; await cmdStatus({ probes: pf, receipts: path.join(OUTD, "d.receipts.jsonl"), root: REPO }, { sandbox: makeCollar(REPO), verbs }, l => lines.push(l));
      return lines[0] === "QUARANTINE 0 of 2" && /STALE 1/.test(lines[1]) && /CONFIRMED 1/.test(lines[1]) || why(lines);
    });
    await tc("STATUS · a probe with no receipt is NO-RECEIPT, never a verdict", async () => {
      const p2 = path.join(OUTD, "nr.probes.jsonl"); fs.writeFileSync(p2, JSON.stringify(P("never", "wc -l docs/notes.md", { exit: 0 })) + NL);
      const s = await statusOf({ probes: p2, receipts: path.join(OUTD, "d.receipts.jsonl"), root: REPO }, { sandbox: makeCollar(REPO), verbs });
      return s.rows[0].status === "NO-RECEIPT" || why(s.rows);
    });
    // ================= LAW 8 · VACUITY (Stage 3.2, forks rows 523 / 524) — its OWN fixture repo, so no earlier case's edits reach it
    const VREPO = path.join(T, "vrepo");
    w(path.join(VREPO, "scripts", "alpha.mjs"), "// line one\n// ALPHA_MARK here\nconst a = 1, b = 2;\nif (a === b) console.log('same');\n");
    w(path.join(VREPO, "scripts", "flip.mjs"), "const x = 1;\nif (x === 1) console.log('OK'); else process.exit(200);\n");
    w(path.join(VREPO, "scripts", "crlf.mjs"), "first\r\nCRLF_MARK\r\nthird\r\n");
    w(path.join(VREPO, "docs", "notes.md"), "one\ntwo\nthree\nfour\nfive\n");
    w(path.join(VREPO, "docs", "eq.md"), "x === y\n");
    w(path.join(VREPO, ".gitignore"), "dressing-room/state/\n");
    w(path.join(VREPO, "dressing-room", "state", "bus.json"), '{"k":"STATE_MARK"}\n');
    git(VREPO, "init", "-q"); git(VREPO, "config", "core.autocrlf", "false"); git(VREPO, "add", "-A"); git(VREPO, "commit", "-q", "-m", "vacuity fixture");
    const VHEAD = String(git(VREPO, "rev-parse", "HEAD").stdout).trim();
    const VOPS = { COND_FLIP: s => s.replace(/([^!=<>])===/, "$1!==") };     // mutagen's COND_FLIP, verbatim; the real seven load in V32-26
    const vsig = () => sha256(Buffer.from(String(git(VREPO, "ls-files", "-z").stdout).split("\0").filter(Boolean).map(f => `${f}\0${sha256(fs.readFileSync(path.join(VREPO, f)))}`).join("\n") + sha256(fs.readFileSync(path.join(VREPO, "dressing-room", "state", "bus.json")))));
    const VSIG0 = vsig();
    const VP = (id, cmd, expect, reads, lane = "host") => ({ ...P(id, cmd, expect, lane, reads), authored_at_tree: VHEAD });
    const REC = (id, verdict, tree = VHEAD) => ({ probe_id: id, tree_sha: tree, verdict, lenses: { A: { reading: verdict === "REFUTED" ? "VACUOUS" : "NOT-APPLICABLE" } } });
    const vac = async (p, rec, o = {}) => {
      const collar = o.collar || makeCollar(VREPO, o.collarOpts || {});
      const ctx = await makeCtx({ root: VREPO }, { sandbox: collar, verbs, codeOps: VOPS, ...(o.deps || {}) });
      ctx._ops = VOPS;
      const r = await vacuityProbe(p, rec === undefined ? REC(p.id, "CONFIRMED") : rec, ctx, "moved" in o ? o.moved : []);
      return { r, collar, ctx };
    };
    const F = x => x && `${x.op}@${x.path}:${x.line}`;
    await tc("V32-1 NOT-VACUOUS · a CONFIRMED predicate resting on its cited line flips under LINE-DEL; the flip is named {op, path, line}", async () => {
      const { r } = await vac(VP("v1", "grep -n ALPHA_MARK scripts/alpha.mjs", { exit: 0 }, ["scripts/alpha.mjs:2"]));
      return r.reading === "NOT-VACUOUS" && F(r.first_flip) === "LINE-DEL@scripts/alpha.mjs:2" && JSON.stringify(r.cited) === '{"scripts/alpha.mjs":[2]}' && r.mutants_tried === 1 && r.lines_resting === 1 && r.A_floor === "NOT-APPLICABLE" || why(r);
    });
    await tc("V32-2 VACUOUS · the same predicate citing a line it does NOT rest on: complete mutants, none flips", async () => {
      const { r } = await vac(VP("v2", "grep -n ALPHA_MARK scripts/alpha.mjs", { exit: 0 }, ["scripts/alpha.mjs:1"]));
      return r.reading === "VACUOUS" && r.mutants_complete === 1 && r.flips.length === 0 && r.first_flip === null && /does not rest on the lines its claim cites/.test(r.why) || why(r);
    });
    await tc("V32-3 OPERATORS · mutagen's op on the cited line ALONE flips a predicate on that text; a line the op cannot change gets LINE-DEL only", async () => {
      const { r } = await vac(VP("v3", "grep -c 'a === b' scripts/alpha.mjs", { exit: 0 }, ["scripts/alpha.mjs:4"]));
      const { r: r2 } = await vac(VP("v3b", "grep -c 'a === b' scripts/alpha.mjs", { exit: 0 }, ["scripts/alpha.mjs:3"]));
      return r.reading === "NOT-VACUOUS" && r.flips.map(F).join(",") === "LINE-DEL@scripts/alpha.mjs:4,COND_FLIP@scripts/alpha.mjs:4" && r.mutants_tried === 2
        && r2.reading === "VACUOUS" && r2.mutants_tried === 1 || why({ r: [r.reading, r.flips, r.mutants_tried], r2: [r2.reading, r2.mutants_tried] });
    });
    await tc("V32-4 OPERATORS TAKE CODE LINES ONLY · a .md line carrying the op's pattern gets LINE-DEL alone; the .mjs line gets both", async () => {
      const { r } = await vac(VP("v4", "grep -c 'x === y' docs/eq.md", { exit: 0 }, ["docs/eq.md:1"]));
      return r.reading === "NOT-VACUOUS" && r.mutants_tried === 1 && r.flips.map(F).join(",") === "LINE-DEL@docs/eq.md:1" || why(r);
    });
    await tc("V32-5 REFUTED PRESENCE · none flips → NOT-DECIDABLE-BY-DELETION, never VACUOUS", async () => {
      const { r } = await vac(VP("v5", "grep -c NOPE_ABSENT docs/notes.md", { exit: 0 }, ["docs/notes.md:1-2"]), REC("v5", "REFUTED"));
      return r.reading === "NOT-DECIDABLE-BY-DELETION" && r.mutants_complete === 2 && r.deletion_can_flip === false && /REFUTED and no deletion of text could flip it/.test(r.why) || why(r);
    });
    await tc("V32-6 REFUTED ABSENCE · a deletion of its cited line flips it → NOT-VACUOUS; citing a line it does not rest on → VACUOUS", async () => {
      const { r } = await vac(VP("v6", "grep -c two docs/notes.md", { exit: 1 }, ["docs/notes.md:2"]), REC("v6", "REFUTED"));
      const { r: r2 } = await vac(VP("v6b", "grep -c two docs/notes.md", { exit: 1 }, ["docs/notes.md:4"]), REC("v6b", "REFUTED"));
      return r.reading === "NOT-VACUOUS" && F(r.first_flip) === "LINE-DEL@docs/notes.md:2" && r2.reading === "VACUOUS" && r2.deletion_can_flip === true || why({ r, r2 });
    });
    await tc("V32-7 deletionCanFlip · held: exit 0 / includes / lines >= or == breakable, exit 1 / excludes / lines <= not; not held: only failing keys a deletion FIXES", async () => {
      const R = (exit, stdout) => ({ exit, stdout });
      const held = [[{ exit: 0 }, true], [{ stdout_includes: ["a"] }, true], [{ stdout_lines: { op: ">=", n: 1 } }, true], [{ stdout_lines: { op: "==", n: 1 } }, true],
        [{ exit: 1 }, false], [{ stdout_excludes: ["a"] }, false], [{ stdout_lines: { op: "<=", n: 3 } }, false], [{ exit: 1, stdout_excludes: ["a"] }, false]];
      const not = [[{ exit: 0 }, R(1, ""), false], [{ exit: 1 }, R(0, "a\n"), true], [{ exit: 1 }, R(2, ""), false], [{ stdout_excludes: ["a"] }, R(0, "a\n"), true],
        [{ stdout_includes: ["zz"] }, R(0, "a\n"), false], [{ exit: 1, stdout_includes: ["a"] }, R(0, "b\n"), false], [{ stdout_lines: { op: "<=", n: 1 } }, R(0, "a\nb\n"), true],
        [{ stdout_lines: { op: "==", n: 1 } }, R(0, "a\nb\n"), true], [{ stdout_lines: { op: "==", n: 3 } }, R(0, "a\nb\n"), false], [{ stdout_lines: { op: ">=", n: 3 } }, R(0, "a\n"), false],
        [{ exit: 0, stdout_includes: ["x"], stdout_excludes: ["y"] }, R(1, ""), false]];
      const bad = [...held.filter(([e, want]) => deletionCanFlip(e, R(0, ""), true) !== want).map(x => ["held", x[0]]), ...not.filter(([e, run, want]) => deletionCanFlip(e, run, false) !== want).map(x => ["not", x[0]])];
      return bad.length === 0 && deletionCanFlip(null, R(0, ""), true) === false || why(bad);
    });
    await tc("V32-8 A FLIP IS READ FIRST · a REFUTED predicate the key test calls not-decidable (an included digit) that a deletion DOES flip reads NOT-VACUOUS", async () => {
      const { r } = await vac(VP("v8", "grep -c two docs/notes.md", { stdout_includes: ["0"] }, ["docs/notes.md:2"]), REC("v8", "REFUTED"));
      return r.deletion_can_flip === false && r.reading === "NOT-VACUOUS" && F(r.first_flip) === "LINE-DEL@docs/notes.md:2" || why(r);
    });
    await tc("V32-29 NEITHER DIRECTION OVERCLAIMS · a REFUTED presence claim with an excludes clause, and a CONFIRMED absence claim, read NOT-DECIDABLE-BY-DELETION, never VACUOUS", async () => {
      const { r } = await vac(VP("v29", "grep -c NOPE_ABSENT docs/notes.md", { exit: 0, stdout_includes: ["1"], stdout_excludes: ["x"] }, ["docs/notes.md:1"]), REC("v29", "REFUTED"));
      const { r: r2 } = await vac(VP("v29b", "grep -c NOPE_ABSENT docs/notes.md", { exit: 1 }, ["docs/notes.md:1"]), REC("v29b", "CONFIRMED"));
      return r.reading === "NOT-DECIDABLE-BY-DELETION" && r2.reading === "NOT-DECIDABLE-BY-DELETION" && /CONFIRMED and no deletion of text could flip it \(its holding keys ask for text to be absent\)/.test(r2.why) && r2.mutants_complete === 1 || why({ r: [r.reading, r.why], r2: [r2.reading, r2.why] });
    });
    await tc("V32-9 WHOLE-FILE READ · the lines the baseline PRINTS are cited (grep -n); none printed = NO-WINDOW, the floor named, nothing mutated", async () => {
      const { r } = await vac(VP("v9", "grep -n three docs/notes.md", { exit: 0 }, ["docs/notes.md"]));
      const { r: r2 } = await vac(VP("v9b", "wc -l docs/notes.md", { exit: 0 }, ["docs/notes.md"]));
      return r.reading === "NOT-VACUOUS" && JSON.stringify(r.cited) === '{"docs/notes.md":[3]}' && r2.reading === "NO-WINDOW" && r2.no_window.join(",") === "docs/notes.md" && r2.mutants_tried === undefined && /A_floor/.test(r2.why) || why({ r, r2 });
    });
    await tc("V32-10 printedLines · `N:` goes to every whole read, `path:N:` to its own read only, a context `N-` line never", async () => {
      const m = printedLines("3:three\ndocs/a.md:7:x\n9-context\nscripts/b.mjs:12:y\n", ["docs/a.md", "scripts/b.mjs"]);
      return [...m.get("docs/a.md")].sort().join(",") === "3,7" && [...m.get("scripts/b.mjs")].sort((a, b) => a - b).join(",") === "3,12" || why([...m].map(([k, s]) => [k, [...s]]));
    });
    await tc("V32-11 citedLines · path:N, path:N-M, path@LN, a comma list; a bare path has no window", async () => {
      const a = citedLines("scripts/x.mjs:7"), b = citedLines("scripts/x.mjs:640-643"), c = citedLines("docs/y.md@L5"), d = citedLines("s/z.mjs:1-2,9"), e = citedLines("./scripts/x.mjs"), f = citedLines("s/r.mjs:9-7");
      return a.path === "scripts/x.mjs" && a.lines.join(",") === "7" && b.lines.join(",") === "640,641,642,643" && c.path === "docs/y.md" && c.lines.join(",") === "5"
        && d.lines.join(",") === "1,2,9" && e.path === "scripts/x.mjs" && e.lines === null && f.lines.join(",") === "7,8,9" || why({ a, b, c, d, e, f });
    });
    await tc("V32-12 lineMutants · LINE-DEL blanks the line KEEPING its CR; an op sees the line without its CR and keeps it; a blank line and a line past the end yield none", async () => {
      const L = "first\r\nif (p === q) go();\r\n\r\nlast\n".split("\n");
      const ms = lineMutants(L, 2, "s/c.mjs", VOPS), del = ms.find(x => x.op === "LINE-DEL"), op = ms.find(x => x.op === "COND_FLIP");
      return del && del.body === "\r" && op && op.body === "if (p !== q) go();\r" && lineMutants(L, 3, "s/c.mjs", VOPS).length === 0 && lineMutants(L, 5, "s/c.mjs", VOPS).length === 0 && lineMutants(L, 0, "s/c.mjs", VOPS).length === 0
        && lineMutants(L, 2, "docs/c.md", VOPS).length === 1 || why(ms);
    });
    await tc("V32-13 NOT-APPLICABLE · no receipt, and a verdict of record that is not CONFIRMED / REFUTED, build no collar", async () => {
      const p = VP("v13", "grep -n ALPHA_MARK scripts/alpha.mjs", { exit: 0 }, ["scripts/alpha.mjs:2"]);
      const a = await vac(p, null), b = await vac(p, REC("v13", "NON-DETERMINISTIC")), c = await vac(p, REC("v13", "UNRUNNABLE"));
      return [a, b, c].every(x => x.r.reading === "NOT-APPLICABLE" && !x.collar.log.some(e => e.ev === "build")) && /NON-DETERMINISTIC/.test(b.r.why) || why([a.r, b.r]);
    });
    await tc("V32-14 STALE · a read moved since the receipt's tree, or dirty now, is never mutated (no collar); an untouched read runs", async () => {
      const p = VP("v14", "grep -n ALPHA_MARK scripts/alpha.mjs", { exit: 0 }, ["scripts/alpha.mjs:2"]);
      const a = await vac(p, undefined, { moved: ["scripts/alpha.mjs"] }), b = await vac(p, undefined, { moved: ["docs/other.md"] }), c = await vac(p, REC("v14", "CONFIRMED", "f".repeat(40)), { moved: null });
      fs.appendFileSync(path.join(VREPO, "scripts", "alpha.mjs"), "// dirty\n");
      let d; try { d = await vac(p); } finally { git(VREPO, "checkout", "--", "scripts/alpha.mjs"); }
      return a.r.reading === "STALE" && a.r.stale_reads.join(",") === "scripts/alpha.mjs" && !a.collar.log.some(e => e.ev === "build") && b.r.reading === "NOT-VACUOUS" && c.r.reading === "STALE" && /not in this repo/.test(c.r.why)
        && d.r.reading === "STALE" && /dirty now/.test(d.r.why) && !d.collar.log.some(e => e.ev === "build") || why({ a: a.r.reading, b: b.r.reading, c: c.r.why, d: d.r.reading });
    });
    await tc("V32-15 BASELINE-DIFFERS · a verdict of record the collar no longer reproduces mutates NOTHING; one that it reproduces does", async () => {
      const { r } = await vac(VP("v15", "grep -c NOPE_ABSENT docs/notes.md", { exit: 0 }, ["docs/notes.md:1"]), REC("v15", "CONFIRMED"));
      const { r: r2 } = await vac(VP("v15b", "grep -c NOPE_ABSENT docs/notes.md", { exit: 0 }, ["docs/notes.md:1"]), REC("v15b", "REFUTED"));
      return r.reading === "BASELINE-DIFFERS" && r.baseline.held === false && r.mutants_tried === undefined && r2.reading === "NOT-DECIDABLE-BY-DELETION" && r2.mutants_tried === 1 || why({ r, r2 });
    });
    await tc("V32-16 ONE FRESH COLLAR PER PROBE · five mutants, ONE build, armed before any run, destroyed; --root byte-identical after", async () => {
      const { r, collar } = await vac(VP("v16", "grep -c three docs/notes.md", { exit: 0 }, ["docs/notes.md:1-5"]));
      const ev = collar.log.map(e => e.ev).join(",");
      return r.reading === "NOT-VACUOUS" && r.mutants_tried === 5 && F(r.first_flip) === "LINE-DEL@docs/notes.md:3" && r.flips.length === 1 && ev === "build,armed,destroy" && !fs.existsSync(collar.log[0].root) && vsig() === VSIG0 || why({ r: [r.reading, r.mutants_tried, r.flips], ev });
    });
    await tc("V32-17 RESTORE-MISMATCH · a restore that does not return the built bytes REFUSES the probe by name; a true restore passes (V32-16)", async () => {
      const { r } = await vac(VP("v17", "grep -c three docs/notes.md", { exit: 0 }, ["docs/notes.md:1-5"]), undefined, { deps: { afterRestore: f => fs.appendFileSync(f, "tamper\n") } });
      return r.reading === "RESTORE-MISMATCH" && /docs\/notes\.md did not restore .* after LINE-DEL at line 1 — the probe is REFUSED/.test(r.why) && r.mutants_tried === 1 && vsig() === VSIG0 || why(r);
    });
    await tc("V32-18 mutationGuard · a target in --root, outside the copy, or the copy's root itself is refused before a write; inside the copy it is admitted", async () => {
      const sbx = fs.mkdtempSync(path.join(T, "sbx-")), refused = t => { try { mutationGuard(t, sbx, VREPO); return false; } catch (e) { return e instanceof Stop && /REFUSED — a vacuity mutant targets/.test(e.message); } };
      let admitted = true; try { mutationGuard(path.join(sbx, "docs", "notes.md"), sbx, VREPO); } catch { admitted = false; }
      let same = false; try { mutationGuard(path.join(VREPO, "docs", "notes.md"), VREPO, VREPO); } catch (e) { same = e instanceof Stop; }
      return refused(path.join(VREPO, "docs", "notes.md")) && refused(path.join(T, "elsewhere.txt")) && refused(sbx) && same && admitted || why({ admitted, same });
    });
    await tc("V32-19 A MUTANT THAT CRASHES IS INCOMPLETE, NEVER A FLIP · COND_FLIP drives node out of its exit set; LINE-DEL completes and flips", async () => {
      const { r } = await vac(VP("v19", "node scripts/flip.mjs", { stdout_includes: ["OK"] }, ["scripts/flip.mjs:2"], "sandbox"));
      return r.reading === "NOT-VACUOUS" && r.flips.map(F).join(",") === "LINE-DEL@scripts/flip.mjs:2" && r.incomplete.length === 1 && r.incomplete[0].op === "COND_FLIP" && /VERB-CRASHED node exit 200/.test(r.incomplete[0].why) && r.mutants_complete === 1 || why(r);
    });
    await tc("V32-20 vacuityReading · a flip → NOT-VACUOUS (decidable or not); no complete mutant → INCOMPLETE; no flip → VACUOUS only where a deletion could have flipped it", async () => {
      const f = [{ op: "x" }];
      return vacuityReading({ decidable: true, complete: 3, flips: f }) === "NOT-VACUOUS" && vacuityReading({ decidable: false, complete: 3, flips: f }) === "NOT-VACUOUS"
        && vacuityReading({ decidable: true, complete: 0, flips: [] }) === "INCOMPLETE" && vacuityReading({ decidable: false, complete: 2, flips: [] }) === "NOT-DECIDABLE-BY-DELETION"
        && vacuityReading({ decidable: true, complete: 2, flips: [] }) === "VACUOUS";
    });
    await tc("V32-21 THE FIXTURE AXIS · a cited line of the READ-ONLY state copy is mutated and restored; the copy is not dirtied; his live state untouched", async () => {
      const { r } = await vac(VP("v21", "grep -n STATE_MARK dressing-room/state/bus.json", { exit: 0 }, ["dressing-room/state/bus.json:1"], "FIXTURE"));
      return r.reading === "NOT-VACUOUS" && r.axis === "fixture" && r.fixture_dirtied === false && /^[0-9a-f]{64}$/.test(r.state_sha256) && vsig() === VSIG0 || why(r);
    });
    await tc("V32-22 THE TREE WATCHER wraps the session (law 7f) · a --root change with no armed collar is TREE-WRITTEN by name; while armed, another writer's (rule A) is named and the probe graded; a tmp of this engine's OWN pid stays TREE-WRITTEN, its mutants withdrawn", async () => {
      const leak = path.join(VREPO, "leak.txt"), own = path.join(VREPO, `.gitignore.${process.pid}.tmp`);
      const p = VP("v22", "grep -n ALPHA_MARK scripts/alpha.mjs", { exit: 0 }, ["scripts/alpha.mjs:2"]);
      try {
        const { r: a } = await vac(p, undefined, { collarOpts: { leakTo: leak, disarmed: true } }); fs.rmSync(leak, { force: true });
        const { r: b } = await vac(p, undefined, { collarOpts: { leakTo: leak } }); fs.rmSync(leak, { force: true });
        const snap = () => new Map([[process.pid, { ppid: null, session: 1, name: "node.exe" }]]);
        const { r: c } = await vac(p, undefined, { collarOpts: { during: () => fs.writeFileSync(own, "mine\n") }, deps: { procSnapshot: snap, settleMs: 0 } });
        return a.reading === "TREE-WRITTEN" && a.tree_written.join(",") === "leak.txt" && a.mutants_tried === undefined
          && b.reading === "NOT-VACUOUS" && b.other_writer && b.other_writer.length === 1 && b.other_writer[0].path === "leak.txt" && b.other_writer[0].rule === "A"
          && c.reading === "TREE-WRITTEN" && c.tree_written.join(",") === `.gitignore.${process.pid}.tmp` && /its mutants read NOT-VACUOUS, withdrawn/.test(c.why) && c.mutants_tried === 1
          || why({ a: [a.reading, a.tree_written], b: [b.reading, b.other_writer], c: [c.reading, c.tree_written, c.why] });
      } finally { fs.rmSync(leak, { force: true }); fs.rmSync(own, { force: true }); }
    });
    await tc("V32-23 COLLAR-NOT-ARMED · a disarmed collar mutates nothing and is destroyed", async () => {
      const collar = makeCollar(VREPO, { disarmed: true });
      const { r } = await vac(VP("v23", "grep -n ALPHA_MARK scripts/alpha.mjs", { exit: 0 }, ["scripts/alpha.mjs:2"]), undefined, { collar });
      return r.reading === "COLLAR-NOT-ARMED" && /assertArmed refused/.test(r.why) && r.mutants_tried === undefined && collar.log.map(e => e.ev).join(",") === "build,refused,destroy" || why({ r, log: collar.log });
    });
    await tc("V32-24 CLI `vacuity` · writes ONLY --out (refused inside --root), the face first, exit 0; the receipts of record are read, never rewritten", async () => {
      const pf2 = path.join(OUTD, "v.probes.jsonl"), rf2 = path.join(OUTD, "v.receipts.jsonl"), out = path.join(OUTD, "v.vacuity.jsonl");
      fs.writeFileSync(pf2, [VP("c1", "grep -n ALPHA_MARK scripts/alpha.mjs", { exit: 0 }, ["scripts/alpha.mjs:2"]), VP("c2", "grep -c NOPE_ABSENT docs/notes.md", { exit: 0 }, ["docs/notes.md:1"]), VP("c3", null, null, [])].map(x => JSON.stringify(x)).join(NL) + NL);
      fs.writeFileSync(rf2, [REC("c1", "CONFIRMED"), REC("c2", "REFUTED"), REC("c3", "UNRUNNABLE")].map(x => JSON.stringify(x)).join(NL) + NL);
      const rs0 = sha256(fs.readFileSync(rf2)), lines = [];
      const code = await cmdVacuity({ probes: pf2, receipts: rf2, out, root: VREPO }, { sandbox: makeCollar(VREPO), verbs, codeOps: VOPS }, l => lines.push(l));
      const rows = readJsonl(out);
      let inRoot = null; try { await cmdVacuity({ probes: pf2, receipts: rf2, out: path.join(VREPO, "v.jsonl"), root: VREPO }, { sandbox: makeCollar(VREPO), verbs, codeOps: VOPS }, () => {}); } catch (e) { inRoot = e instanceof Stop ? e.message : `other ${e.message}`; }
      return code === 0 && rows.map(x => x.reading).join(",") === "NOT-VACUOUS,NOT-DECIDABLE-BY-DELETION,NOT-APPLICABLE" && /^VACUITY /.test(lines[0]) && /^BY VERDICT OF RECORD /.test(lines[1]) && /^MUTANTS tried 2 /.test(lines[2])
        && sha256(fs.readFileSync(rf2)) === rs0 && /REFUSED — --out .* is inside --root/.test(inRoot || "") && !fs.existsSync(path.join(VREPO, "v.jsonl")) && vsig() === VSIG0 || why({ code, lines: lines.slice(0, 3), rows: rows.map(x => x.reading), inRoot });
    });
    await tc("V32-25 THE OPERATORS LOADER · CODE_OPS of functions load from mutagen.mjs beside; absent or empty REFUSES the call before any spawn", async () => {
      const good = path.join(T, "opsgood"), none = path.join(T, "opsnone"), bad = path.join(T, "opsbad");
      w(path.join(good, "mutagen.mjs"), "export const CODE_OPS = { STUB_OP: s => s + '!' };\n"); fs.mkdirSync(none, { recursive: true }); w(path.join(bad, "mutagen.mjs"), "export const CODE_OPS = {};\n");
      const ops = await loadCodeOps(good);
      const refusal = async d => { try { await loadCodeOps(d); return null; } catch (e) { return e instanceof Stop ? e.message : `other ${e.message}`; } };
      const a = await refusal(none), b = await refusal(bad);
      const pf3 = path.join(OUTD, "v3.probes.jsonl"), rf3 = path.join(OUTD, "v3.receipts.jsonl"), out = path.join(OUTD, "v3.vacuity.jsonl"), n0 = SPAWNS.count;
      fs.writeFileSync(pf3, JSON.stringify(VP("o1", "grep -n ALPHA_MARK scripts/alpha.mjs", { exit: 0 }, ["scripts/alpha.mjs:2"])) + NL); fs.writeFileSync(rf3, JSON.stringify(REC("o1", "CONFIRMED")) + NL);
      let cli = null; try { await cmdVacuity({ probes: pf3, receipts: rf3, out, root: VREPO }, { sandbox: makeCollar(VREPO), verbs, opsDir: none }, () => {}); } catch (e) { cli = e instanceof Stop ? e.message : `other ${e.message}`; }
      return Object.keys(ops).join(",") === "STUB_OP" && ops.STUB_OP("a") === "a!" && /could not be loaded/.test(a || "") && /exports no CODE_OPS/.test(b || "") && /REFUSED — vacuity takes mutagen\.mjs/.test(cli || "") && !fs.existsSync(out) && SPAWNS.count === n0 || why({ a, b, cli, spawned: SPAWNS.count - n0 });
    });
    if (fs.existsSync(path.join(HERE, "mutagen.mjs"))) {
      await tc("V32-26 THE REAL OPERATORS · mutagen.mjs beside probe.mjs loads its seven CODE_OPS, functions, unchanged", async () => {
        const ops = await loadCodeOps(HERE);
        return Object.keys(ops).join(",") === "FIELD_RENAME,PATH_LIT,COND_FLIP,SLICE_OB1,CATCH_RETHROW,CONST_SCALE,STMT_DEL" && ops.COND_FLIP("if (a === b) x();") === "if (a !== b) x();" || why(Object.keys(ops));
      });
    } else console.log("NOTE  V32-26 NOT RUN: no mutagen.mjs beside this probe.mjs (a build copy) — it runs where the organism's mutagen.mjs is");
    await tc("V32-28 LINE-DEL BLANKS, NEVER REMOVES · every other line keeps its number: sed -n '3p' citing line 2 stays VACUOUS, citing line 3 flips", async () => {
      const { r } = await vac(VP("v28", "sed -n '3p' docs/notes.md", { stdout_includes: ["three"] }, ["docs/notes.md:2"]));
      const { r: r2 } = await vac(VP("v28b", "sed -n '3p' docs/notes.md", { stdout_includes: ["three"] }, ["docs/notes.md:3"]));
      return r.reading === "VACUOUS" && r2.reading === "NOT-VACUOUS" && F(r2.first_flip) === "LINE-DEL@docs/notes.md:3" || why({ r: [r.reading, r.flips], r2: r2.reading });
    });
    await tc("V32-27 vacuityFace · readings counted on line 1, split by verdict of record on line 2, mutants on line 3", async () => {
      const rows = [{ reading: "NOT-VACUOUS", verdict: "CONFIRMED", mutants_tried: 3, mutants_complete: 3, flips: [1, 2], lines_resting: 1 }, { reading: "VACUOUS", verdict: "CONFIRMED", mutants_tried: 2, mutants_complete: 1, flips: [], lines_resting: 0 }, { reading: "NOT-APPLICABLE", verdict: "UNRUNNABLE" }];
      const f = vacuityFace(rows);
      return f[0] === "VACUITY NOT-APPLICABLE 1 · NOT-VACUOUS 1 · VACUOUS 1 (of 3)" && f[1] === "BY VERDICT OF RECORD CONFIRMED NOT-VACUOUS 1 · CONFIRMED VACUOUS 1" && f[2] === "MUTANTS tried 5 · complete 4 · flips 2 · cited lines resting 1" || why(f);
    });
    // ================= LAW 7h · 7i · 9 · STAGE 3.3 (row 545) — its OWN fixture repo
    const SREPO = path.join(T, "srepo"), NB = "dressing-room/state/never.jsonl";
    w(path.join(SREPO, "docs", "f.txt"), "write(GSTATE)\nabc\n");
    w(path.join(SREPO, "abc"), "a file in the cwd that an MSYS glob of [a-c]* would match\n");
    w(path.join(SREPO, "scripts", "idle.mjs"), "// exits 0 having touched nothing\n");
    w(path.join(SREPO, "scripts", "touch.mjs"), "import fs from 'node:fs';\nconst t = process.env.ARSENAL_AUDIT_TRACE;\nconst body = fs.readFileSync('docs/f.txt', 'utf8');\nif (t) fs.appendFileSync(t, JSON.stringify({ organ: process.env.ARSENAL_AUDIT_LABEL, ev: 'read', path: 'docs/f.txt' }) + '\\n');\nconsole.log(body.length);\n");
    w(path.join(SREPO, "scripts", "touchw.mjs"), "import fs from 'node:fs';\nconst t = process.env.ARSENAL_AUDIT_TRACE;\nif (t) fs.appendFileSync(t, JSON.stringify({ organ: process.env.ARSENAL_AUDIT_LABEL, ev: 'write', path: 'docs/w.txt' }) + '\\n');\n");
    w(path.join(SREPO, "scripts", "quit.mjs"), "process.exit(3);\n");
    // the real preload's rows for a module load (measured 6 Oct: readFileSync + openSync of the entry .mjs), written by hand here
    w(path.join(SREPO, "scripts", "loadonly.mjs"), "import fs from 'node:fs';\nimport path from 'node:path';\nconst t = process.env.ARSENAL_AUDIT_TRACE, me = path.resolve('scripts/loadonly.mjs').split(path.sep).join('/');\nif (t) for (const verb of ['readFileSync', 'openSync']) fs.appendFileSync(t, JSON.stringify({ organ: process.env.ARSENAL_AUDIT_LABEL, ev: 'read', verb, path: me }) + '\\n');\n");
    w(path.join(SREPO, ".gitignore"), "dressing-room/state/\n");
    git(SREPO, "init", "-q"); git(SREPO, "config", "core.autocrlf", "false"); git(SREPO, "add", "-A"); git(SREPO, "commit", "-q", "-m", "stage 3.3 fixture");
    const srun = async p => { const collar = makeCollar(SREPO); const ctx = await makeCtx({ root: SREPO }, { sandbox: collar, verbs }); return { r: await runProbe(p, ctx), collar }; };
    // an oracle written apart from winQuote: the CommandLineToArgvW rule (2n backslashes + quote = n and a delimiter; 2n+1 = n and a quote)
    const argvParse = s => {
      const out = []; let cur = "", inQ = false, any = false;
      for (let i = 0; i < s.length;) {
        if (s[i] === "\\") { let n = 0; while (s[i] === "\\") { n++; i++; } if (s[i] === '"') { cur += "\\".repeat(n >> 1); if (n & 1) { cur += '"'; i++; } } else cur += "\\".repeat(n); any = true; continue; }
        if (s[i] === '"') { inQ = !inQ; any = true; i++; continue; }
        if (!inQ && (s[i] === " " || s[i] === "\t")) { if (any) { out.push(cur); cur = ""; any = false; } i++; continue; }
        cur += s[i]; any = true; i++;
      }
      if (any) out.push(cur);
      return out;
    };
    const PLANT = ["plain", "two words", 'a"q', "write\\(GSTATE", "password\\s*[:=]", "[a-c]*", "x\\", "x\\\\", '\\"\\', "", "tab\there", "C:\\x\\y", "100%"];
    await tc("V33-01 ARGV FIDELITY · winQuote: every planted word parses back byte-equal by the Windows rule (an oracle written apart), and spawnForm quotes only on win32", async () => {
      const back = argvParse(PLANT.map(winQuote).join(" "));
      const f = spawnForm("C:/x/grep.exe", ["a b", "c"], true), g = spawnForm("/usr/bin/grep", ["a b", "c"], false);
      return back.length === PLANT.length && back.every((x, i) => x === PLANT[i]) && f.extra.windowsVerbatimArguments === true && f.extra.argv0 === '"C:/x/grep.exe"' && f.argv.join(" ") === '"a b" "c"'
        && g.argv.join(" ") === "a b c" && Object.keys(g.extra).length === 0 || why({ back, f, g });
    });
    const PRINTF = verbs.grep ? path.join(path.dirname(verbs.grep), "printf.exe") : null;
    if (WIN && PRINTF && fs.existsSync(PRINTF)) {
      await tc("V33-02 ARGV FIDELITY · THE INSTRUMENT, both ways: the MSYS printf beside grep prints back every planted word byte-equal under spawnForm; node's own quoting loses \\( \\s and globs [a-c]* against the cwd", async () => {
        const words = ["write\\(GSTATE", "password\\s*[:=]", "[a-c]*", 'a"q', "two words", "x\\", '\\"\\', "tab\there"], FMT = "%s\\0";
        const back = r => { const s = (r.stdout || Buffer.alloc(0)).toString("utf8").split("\0"); s.pop(); return s; };
        const f = spawnForm(PRINTF, [FMT, ...words]);
        const law = back(spawnSync(PRINTF, f.argv, { cwd: SREPO, env: hostEnv(), windowsHide: true, ...f.extra }));
        const today = back(spawnSync(PRINTF, [FMT, ...words], { cwd: SREPO, env: hostEnv(), windowsHide: true }));
        const lawOk = law.length === words.length && law.every((x, i) => x === words[i]);
        const mangled = words.slice(0, 3).every((x, i) => today[i] !== x);
        return lawOk && mangled || why({ law, today });
      });
    } else console.log("NOTE  V33-02 NOT RUN: no MSYS printf.exe beside grep on this machine (the instrument is Git for Windows')");
    await tc("V33-03 ARGV FIDELITY · THE ENGINE'S OWN PATH: grep -E 'write\\(GSTATE' finds its line and '[a-c]*' counts both lines with a cwd file named abc; the spawn is verbatim on win32", async () => {
      const a = runPlan(classify("grep -c -E 'write\\(GSTATE' docs/f.txt", "host").plan, SREPO, hostEnv(), { verbs }), lastA = SPAWNS.last;
      const b = runPlan(classify("grep -c '[a-c]*' docs/f.txt", "host").plan, SREPO, hostEnv(), { verbs });
      return a.exit === 0 && a.stdout.trim() === "1" && a.errored === null && b.exit === 0 && b.stdout.trim() === "2" && lastA.verbatim === WIN && lastA.shell === false && lastA.windowsHide === true || why({ a, b, lastA });
    });
    await tc("V33-04 ARGV-UNFAITHFUL · a text-verb word OPENING with two backslashes is UNRUNNABLE by name on every axis (register axis null); inside a word it is admitted; git and node words are not text-verb words", async () => {
      const bad = classify("grep -c '\\\\srv' docs/f.txt", "host"), badS = classify("sed -n '1p' '\\\\srv'", "sandbox"), ok1 = classify("grep -c 'a\\\\srv' docs/f.txt", "host");
      const sc = staticCheck(P("uf", "grep -c '\\\\srv' docs/f.txt", { exit: 0 }), verbs);
      return bad.class === "UNRUNNABLE" && bad.why === "ARGV-UNFAITHFUL" && bad.detail === "grep \\\\srv" && badS.why === "ARGV-UNFAITHFUL" && ok1.class === "RUNNABLE"
        && argvUnfaithful("git", [{ text: "\\\\x" }]) === null && argvUnfaithful("node", [{ text: "\\\\x" }]) === null
        && sc.quarantine && sc.quarantine.why === "ARGV-UNFAITHFUL" && sc.quarantine.axis === null && /two backslashes/.test(sc.quarantine.runnable_if) || why({ bad, badS, ok1, sc });
    });
    await tc("V33-05 VERB-ERRORED · grep exit 2 (a pattern that never compiled) is incomplete on every axis, held null, named in the verdict; grep exit 1 (no match) is still REFUTED", async () => {
      const { r } = await srun(P("e2", "grep -c -E '(' docs/f.txt", { exit: 0 }));
      const { r: r2 } = await srun(P("e1", "grep -c NOPE_ABSENT docs/f.txt", { exit: 0 }));
      return r.verdict === "NON-DETERMINISTIC" && /VERB-ERRORED grep exit 2/.test(r.verdict_why || "") && r.runs.every(x => x.held === null && x.errored && x.errored.verb === "grep" && x.errored.status === 2 && x.errored.stderr.length > 0)
        && r2.verdict === "REFUTED" && r2.runs.every(x => x.errored === null && x.exit === 1 && x.held === false) || why({ r: [r.verdict, r.verdict_why, r.runs.map(x => x.errored)], r2: r2.verdict });
    });
    await tc("V33-06 VERB-ERRORED UPSTREAM IN A PIPE · wc of a missing file piped into wc used to exit 0 and hold; now VERB-ERRORED at segment 0; the same pipe over a real file holds", async () => {
      const { r } = await srun(P("p1", "wc -l docs/missing.txt | wc -l", { exit: 0 }));
      const { r: r2 } = await srun(P("p2", "wc -l docs/f.txt | wc -l", { exit: 0, stdout_includes: ["1"] }));
      return r.verdict === "NON-DETERMINISTIC" && r.runs.every(x => x.held === null && x.errored && x.errored.verb === "wc" && x.errored.status === 1 && x.errored.segment === 0)
        && r2.verdict === "CONFIRMED" && r2.runs.every(x => x.errored === null) || why({ r: r.runs.map(x => [x.exit, x.held, x.errored]), r2: r2.verdict });
    });
    await tc("V33-07 THE ONE EXCEPTION · wc of a never-born file DECLARED in reads_absent is the claim's evidence (CONFIRMED, declared_absent named); undeclared, or a different missing path, is VERB-ERRORED", async () => {
      const { r } = await srun(P("x1", `wc -l ${NB}`, { exit: 1, stdout_lines: { op: "==", n: 0 }, reads_absent: [NB] }, "host", [NB]));
      const { r: r2 } = await srun(P("x2", `wc -l ${NB}`, { exit: 1, stdout_lines: { op: "==", n: 0 } }));
      const { r: r3 } = await srun(P("x3", `wc -l docs/gone.txt ${NB}`, { exit: 1, reads_absent: [NB] }, "host", [NB]));
      return r.verdict === "CONFIRMED" && r.runs.every(x => x.errored === null && JSON.stringify(x.declared_absent) === JSON.stringify([NB]))
        && r2.verdict === "NON-DETERMINISTIC" && r2.runs.every(x => x.errored && x.errored.verb === "wc")
        && r3.verdict === "NON-DETERMINISTIC" && r3.runs.every(x => x.errored && x.errored.verb === "wc") || why({ r: [r.verdict, r.runs.map(x => [x.errored, x.declared_absent])], r2: r2.verdict, r3: [r3.verdict, r3.runs.map(x => x.errored)] });
    });
    await tc("V33-08 LENS A UNCHANGED · the ablation removes reads[] on purpose: grep's exit 2 on the removed file is declared, so a CONFIRMED probe still reads 'held flipped', never incomplete", async () => {
      const { r } = await srun(P("a1", "grep -c GSTATE docs/f.txt", { exit: 0 }, "host", ["docs/f.txt"]));
      return r.verdict === "CONFIRMED" && r.lenses.A.reading === "NOT-APPLICABLE" && /held flipped true → false/.test(r.lenses.A.why) || why(r.lenses.A);
    });
    await tc("V33-09 SILENT-SUCCESS · a node segment exiting 0 with 0 reads / writes / spawns reads SILENT-SUCCESS (the collar built with its trace; its loader's .mjs reads counted apart); one that reads, one that writes, one that exits 3 do not; a plan with no node segment builds no trace and reads null", async () => {
      const a = await srun(P("s1", "node scripts/idle.mjs", { exit: 0 }, "sandbox"));
      const b = await srun(P("s2", "node scripts/touch.mjs", { exit: 0 }, "sandbox"));
      const c = await srun(P("s3", "node scripts/touchw.mjs", { exit: 0 }, "sandbox"));
      const d = await srun(P("s4", "node scripts/quit.mjs", { exit: 3 }, "sandbox"));
      const e = await srun(P("s5", "grep -c GSTATE docs/f.txt", { exit: 0 }, "sandbox"));
      const lo = await srun(P("s6", "node scripts/loadonly.mjs", { exit: 0 }, "sandbox"));
      const builds = x => x.collar.log.filter(l => l.ev === "build");
      if (!(lo.r.silent && lo.r.silent.reading === "SILENT-SUCCESS" && lo.r.runs.every(x => x.node_trace[0].reads === 0 && x.node_trace[0].code_reads === 1))) return why({ loadonly: [lo.r.silent, lo.r.runs.map(x => x.node_trace)] });
      return a.r.verdict === "CONFIRMED" && a.r.silent && a.r.silent.reading === "SILENT-SUCCESS" && /scripts\/idle\.mjs/.test(a.r.silent.why) && a.r.runs.every(x => x.silent_success === true && x.node_trace.length === 1 && x.node_trace[0].reads === 0) && builds(a).length === 3 && builds(a).every(l => l.trace === true)
        && b.r.silent.reading === "NOT-SILENT" && b.r.runs.every(x => x.silent_success === false && x.node_trace[0].reads === 1)
        && c.r.silent.reading === "NOT-SILENT" && c.r.runs.every(x => x.node_trace[0].writes === 1 && x.silent_success === false)
        && d.r.verdict === "CONFIRMED" && d.r.silent.reading === "NOT-SILENT" && d.r.runs.every(x => x.node_trace[0].status === 3)
        && e.r.silent === null && builds(e).every(l => !l.trace) && e.r.runs.every(x => !("node_trace" in x)) || why({ a: [a.r.verdict, a.r.silent, a.r.runs.map(x => x.node_trace)], b: b.r.silent, c: c.r.silent, d: [d.r.verdict, d.r.silent], e: e.r.silent });
    });
    await tc("V33-10 THE FACE · a VERB-ERRORED line and a SILENT-SUCCESS line when present, neither when absent", async () => {
      const R = (verdict, runs, silent = null) => ({ verdict, runs, silent, quarantine: null, lenses: {} });
      const f = face([R("NON-DETERMINISTIC", [{ errored: { verb: "grep", status: 2 } }]), R("CONFIRMED", [{}], { reading: "SILENT-SUCCESS" }), R("CONFIRMED", [{}])]), g = face([R("CONFIRMED", [{}], { reading: "NOT-SILENT" })]);
      return f.some(l => /^VERB-ERRORED 1 of 3 · /.test(l)) && f.some(l => /^SILENT-SUCCESS 1 of 3 · /.test(l)) && !g.some(l => /^(VERB-ERRORED|SILENT-SUCCESS)/.test(l)) || why({ f, g });
    });
    await tc("V33-11 VACUITY KEEPS LAW 7i · an erroring baseline is INCOMPLETE naming VERB-ERRORED (nothing mutated); a declared absence's baseline holds and reads NO-WINDOW", async () => {
      const { r } = await vac(VP("v33a", "grep -c -E '(' docs/notes.md", { exit: 0 }, ["docs/notes.md:1"]));
      const { r: r2 } = await vac(VP("v33b", `wc -l ${NB}`, { exit: 1, reads_absent: [NB] }, [NB]));
      return r.reading === "INCOMPLETE" && /VERB-ERRORED grep exit 2/.test(r.why) && r2.reading === "NO-WINDOW" && r2.baseline.held === true || why({ r: [r.reading, r.why], r2: [r2.reading, r2.why] });
    });
    await tc("CLI · an unknown verb is usage (exit 2), never a run", async () => { const r = spawnSync(process.execPath, [SELF, "frobnicate"], { encoding: "utf8", shell: false, windowsHide: true, timeout: 60000 }); return r.status === 2 && /usage/.test(String(r.stderr)) || why({ code: r.status }); });
  } catch (e) {
    ok(false, "selftest threw outside a case", e && e.stack ? e.stack.split(NL).slice(0, 3).join(" | ") : String(e));
  } finally { try { fs.rmSync(T, { recursive: true, force: true }); } catch {} }
  if (ONLY) console.log(`NOTE  PROBE_SELFTEST_ONLY="${ONLY}": ${skippedCases} case(s) NOT run — this is not the whole selftest`);
  console.log(`probe selftest: ${good}/${ran} ok${good === ran ? " · GREEN" : " · RED"}`);
  return good === ran ? 0 : 1;
}

// ---------------------------------------------------------------------------- main
const USAGE = "usage: node scripts/probe.mjs import --population <jsonl> --out <probes.jsonl> | run --probes <f> --out <receipts.jsonl> [--ids a,b] [--root <dir>] [--timeout-ms N] [--host-only] | vacuity --probes <f> --receipts <receipts of record> --out <vacuity.jsonl> [--ids a,b] [--root <dir>] [--timeout-ms N] | status --probes <f> --receipts <f> [--root <dir>] | report --receipts <f> | selftest";
const BOOL_FLAGS = new Set(["host-only"]);
function args(argv) {
  const o = {};
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) throw new Stop(`${USAGE}\nunexpected argument: ${a}`);
    if (BOOL_FLAGS.has(a.slice(2))) { o[a.slice(2)] = true; continue; }
    const k = a.slice(2), v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) throw new Stop(`${USAGE}\n--${k} needs a value`);
    o[k] = v; i++;
  }
  return o;
}
async function main(argv) {
  const verb = argv[0];
  if (verb === "selftest") return selftest();
  if (!["import", "run", "vacuity", "status", "report"].includes(verb)) throw new Stop(USAGE);
  const o = args(argv);
  if (verb === "import") return cmdImport(o);
  if (verb === "run") return cmdRun(o);
  if (verb === "vacuity") return cmdVacuity(o);
  if (verb === "status") return cmdStatus(o);
  return cmdReport(o);
}
if (process.argv[1] && path.resolve(process.argv[1]) === SELF) {
  main(process.argv.slice(2)).then(code => { process.exitCode = code; }, e => {
    if (e instanceof Stop) { console.error(e.message); process.exitCode = e.code; }
    else { console.error(`probe: INTERNAL ${e && e.message ? e.message.slice(0, 300) : String(e)}`); process.exitCode = 2; }
  });
}
