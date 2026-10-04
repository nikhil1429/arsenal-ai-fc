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
// WHO ELSE COULD ACT ON THIS OUTPUT? Stage 3.2 (vacuity by mutagen) reads the receipts'
//   lens A; Stage 3.4's refuters D / E read B and C; Stage 3.5's `npm run probes` lane
//   runs `run` + `report`. None is wired yet — named here so none is a declared-but-
//   unwired consumer by surprise.
// CLI: node scripts/probe.mjs import --population <jsonl> --out <probes.jsonl>
//      node scripts/probe.mjs run --probes <f> --out <receipts.jsonl> [--ids a,b] [--root <dir>] [--timeout-ms N] [--host-only]
//      node scripts/probe.mjs status --probes <f> --receipts <f> [--root <dir>]
//      node scripts/probe.mjs report --receipts <f>
//      node scripts/probe.mjs selftest
// EXIT: 0 ok · 1 selftest RED, or a run wrote into --root (TREE-WRITTEN) · 2 usage / refused
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
  "COLLAR-NOT-ARMED": "scripts/sandbox.mjs loads beside probe.mjs, builds from --root, and assertArmed passes (and the call is not --host-only)",
  "TREE-WRITTEN": "the run leaves --root as it found it: git status --porcelain --ignored and the listing of its top level and of every cwd the run enters are unchanged — the engine never deletes what a verb wrote: read it, remove it, re-run",
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
    admits: "grep [admitted flags] <pattern> [paths inside the snapshot]; -r only over the snapshot; never -R (it follows symlinks out of it); exact long names only (an abbreviation is not in the table)",
    short_bool: "nEFivcwxohHlLrsqP", short_val: "ABCme",
    long_bool: Object.freeze(["--line-number", "--extended-regexp", "--fixed-strings", "--ignore-case", "--invert-match", "--count", "--word-regexp", "--line-regexp", "--only-matching", "--no-filename", "--with-filename", "--files-with-matches", "--files-without-match", "--recursive", "--no-messages", "--quiet", "--perl-regexp"]),
    long_val: Object.freeze(["--after-context", "--before-context", "--context", "--max-count", "--regexp"]),
    verbs: Object.freeze([]), flags: null, refused: Object.freeze(["-f", "--file"]) }),
  Object.freeze({ tool: "sed", rows: "363 (1) · 364 (2) · 365 (1)", usage: "--help", exit_max: 1, exits_cite: "fork 0353 (a), ruled row 471 (1)",
    admits: "sed -n '<script>' [paths]; the script ONLY line-address print commands (Np, N,Mp) joined by ';' inside the one argument",
    verbs: Object.freeze([]), flags: Object.freeze(["-n"]), refused: Object.freeze(["-i", "-e", "-f"]) }),
  Object.freeze({ tool: "head", rows: "363 (1) · 365 (1)", usage: "--help", exit_max: 1, exits_cite: "fork 0353 (a), ruled row 471 (1)", admits: "head [admitted flags] [paths]",
    short_bool: "qv", short_val: "nc", long_bool: Object.freeze(["--quiet", "--verbose"]), long_val: Object.freeze(["--lines", "--bytes"]), num_flag: true,
    verbs: Object.freeze([]), flags: null, refused: Object.freeze([]) }),
  Object.freeze({ tool: "tail", rows: "363 (1) · 365 (1)", usage: "--help", exit_max: 1, exits_cite: "fork 0353 (a), ruled row 471 (1)", admits: "tail [admitted flags] [paths]; never -f / -F",
    short_bool: "qv", short_val: "nc", long_bool: Object.freeze(["--quiet", "--verbose"]), long_val: Object.freeze(["--lines", "--bytes"]), num_flag: true,
    verbs: Object.freeze([]), flags: null, refused: Object.freeze(["-f", "-F", "--follow"]) }),
  Object.freeze({ tool: "wc", rows: "363 (1) · 365 (1)", usage: "--help", exit_max: 1, exits_cite: "fork 0353 (a), ruled row 471 (1)", admits: "wc [admitted flags] [paths]",
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
  for (const w of words) {
    if (w.text === "-") continue;
    const m = treePath(w.text, cwdRel);
    if (!m.ok) return { ok: false, reason: m.reason, detail: w.text.length > 120 ? `${w.text.slice(0, 120)}…` : w.text };
  }
  return { ok: true };
}
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
    return { ok: true, spec: { tool: "sed", argv: args.map(w => w.text), cwd: cwdRel } };
  }
  // grep · head · tail · wc
  const row = TABLE[tool];
  const f = parseFlags(row, args);
  if (!f.ok) return R(f.reason, f.detail);
  let ops = f.operands;
  if (tool === "grep" && !f.patternGiven) { if (!ops.length) return R("GREP-NO-PATTERN", "grep with no pattern"); ops = ops.slice(1); }
  const p = pathOperands(ops, cwdRel);
  if (!p.ok) return R(p.reason, p.detail);
  return { ok: true, spec: { tool, argv: args.map(w => w.text), cwd: cwdRel } };
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
function spawnSegment(bin, args, o) {
  SPAWNS.count++;
  const opts = { cwd: o.cwd, input: o.input, timeout: o.timeout, maxBuffer: o.cap, shell: false, env: o.env, windowsHide: true, killSignal: "SIGKILL" };
  SPAWNS.last = { bin, args, shell: opts.shell, windowsHide: opts.windowsHide, cwd: opts.cwd };
  return spawnSync(bin, args, opts);
}
const ENV_KEEP = ["PATH", "Path", "PATHEXT", "SYSTEMROOT", "SystemRoot", "WINDIR", "COMSPEC", "TEMP", "TMP", "TMPDIR", "HOME", "USERPROFILE", "LANG", "LC_ALL", "LC_CTYPE"];
function hostEnv() { const env = {}; for (const k of ENV_KEEP) if (process.env[k] !== undefined) env[k] = process.env[k]; return env; }
const joinRel = (base, rel) => (rel ? path.join(base, ...rel.split("/")) : base);
// ADAPTED from adjudicate.mjs runReceipt(): one plan inside one tree → { exit, stdout, seconds, timed_out, capped, crashed }
// A segment that ends outside its verb's declared exit set ends the plan there: crashed names it, exit keeps its raw status.
export function runPlan(plan, tree, env, o) {
  const timeout = o.timeout || SEG_TIMEOUT_MS, cap = o.cap || OUTPUT_CAP, verbs = o.verbs;
  const real = a => (a === TREE ? tree : a.startsWith(`${TREE}/`) ? joinRel(tree, a.slice(TREE.length + 1)) : a);
  const genv = { ...env, GIT_CEILING_DIRECTORIES: path.dirname(path.resolve(tree)), GIT_PAGER: "cat" };
  const t0 = process.hrtime.bigint();
  let out = Buffer.alloc(0), exit = 0, cwd = "", timedOut = false, capped = false, crashed = null;
  outer: for (const pipeline of plan) {
    if (pipeline.length === 1 && pipeline[0].tool === "cd") {
      let isDir = false; try { isDir = fs.statSync(joinRel(tree, pipeline[0].cwd)).isDirectory(); } catch {}
      if (!isDir) { exit = 1; break; }
      cwd = pipeline[0].cwd; exit = 0; continue;
    }
    let input = Buffer.alloc(0), last = null;
    for (const s of pipeline) {
      const bin = verbs[s.tool];
      const r = spawnSegment(bin, s.argv.map(real), { cwd: joinRel(tree, cwd), input, timeout, cap, env: genv });
      if (r.error && r.error.code === "ETIMEDOUT") { timedOut = true; out = Buffer.concat([out, r.stdout || Buffer.alloc(0)]); exit = null; break outer; }
      if (r.error && r.error.code === "ENOBUFS") { capped = true; out = Buffer.concat([out, r.stdout || Buffer.alloc(0)]); exit = null; break outer; }
      crashed = crashOf(s.tool, r);
      if (crashed) { out = Buffer.concat([out, r.stdout || Buffer.alloc(0)]); exit = crashed.status; break outer; }
      last = { status: r.status, stdout: r.stdout || Buffer.alloc(0) };
      input = last.stdout;
    }
    out = Buffer.concat([out, last.stdout]);
    exit = last.status;
    if (out.length > cap) { out = out.subarray(0, cap); capped = true; exit = null; break; }
    if (exit !== 0) break;           // `&&`: a failed link ends the chain, as the shell would
  }
  const seconds = Number((Number(process.hrtime.bigint() - t0) / 1e9).toFixed(3));
  return { exit, stdout: normalize(out.toString("utf8")), bytes: out.length, seconds, timed_out: timedOut, capped, crashed };
}

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
// one run on one axis → the run's observed fields (held is set by the caller)
async function runAxis(axis, plan, ctx, { remove = [], check = [] } = {}) {
  if (axis === "host") { const ab = absentReads(ctx.root, check); return ab.length ? { ...NOT_RUN, read_absent: ab } : { ...runPlan(plan, ctx.root, hostEnv(), ctx) }; }
  const collar = await collarOf(ctx);
  let sb;
  try { sb = collar.buildSandbox({ trace: false }); }
  catch (e) { throw new CollarError(`buildSandbox threw: ${String(e && e.message || e).slice(0, 200)}`); }
  const stateDir = path.join(sb.root, STATE_REL);
  try {
    try { collar.assertArmed(sb); }
    catch (e) { throw new CollarError(`assertArmed refused: ${String(e && e.message || e).slice(0, 200)}`); }
    const extra = {};
    if (axis === "fixture") {
      const live = path.join(ctx.root, STATE_REL);
      if (fs.existsSync(live)) { fs.mkdirSync(stateDir, { recursive: true }); fs.cpSync(live, stateDir, { recursive: true, force: true }); }
    }
    for (const r of remove) { const m = treePath(r, ""); if (m.ok && m.rel) fs.rmSync(joinRel(sb.root, m.rel), { recursive: true, force: true }); }
    if (axis === "fixture") { setMode(stateDir, 0o444); extra.state_sha256 = hashTree(stateDir); }
    const ab = absentReads(sb.root, check);
    const r = ab.length ? { ...NOT_RUN, read_absent: ab } : runPlan(plan, sb.root, { ...sb.env }, ctx);
    if (axis === "fixture") { const after = hashTree(stateDir); extra.fixture_dirtied = after !== extra.state_sha256; }
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
    if (c.class !== "RUNNABLE") return { quarantine: Q(c.why, c.reason, c.detail, c.why === "UNPARSABLE" ? null : axis) };
    plans[axis] = c.plan;
  }
  for (const plan of Object.values(plans)) for (const pl of plan) for (const s of pl) if (s.tool !== "cd" && !verbs[s.tool]) return { quarantine: Q("VERB-NOT-FOUND", s.tool, `${s.tool} is not on PATH nor in the usr/bin beside git`) };
  return { plans };
}
const stubRun = (axis, cmd, why) => ({ axis, cmd, exit: null, stdout_sha256: null, stdout_head: "", bytes: 0, seconds: 0, timed_out: false, capped: false, crashed: null, read_absent: null, tree_written: null, held: null, skipped: why });
function shapeRun(axis, cmd, r, expect) {
  const incomplete = r.timed_out || r.capped || Boolean(r.crashed) || Boolean(r.read_absent);
  const o = { axis, cmd, exit: r.exit, stdout_sha256: sha256(Buffer.from(r.stdout, "utf8")), stdout_head: Buffer.from(r.stdout, "utf8").subarray(0, HEAD_BYTES).toString("utf8"),
    bytes: r.bytes, seconds: r.seconds, timed_out: r.timed_out, capped: r.capped, crashed: r.crashed || null, read_absent: r.read_absent || null, tree_written: null,
    held: incomplete ? null : expectHolds(expect, r) };
  if ("fixture_dirtied" in r) { o.state_sha256 = r.state_sha256; o.fixture_dirtied = r.fixture_dirtied; }
  return o;
}
// why a run is incomplete (never held, never not-held), or null
export const incompleteWhy = r => (r.timed_out ? "timed out" : r.capped ? "hit the output cap" : r.crashed ? `VERB-CRASHED ${r.crashed.verb} ${r.crashed.why}`
  : r.read_absent ? `READ-ABSENT ${r.read_absent.join(", ")}` : r.skipped ? `NOT-RUN ${r.skipped}` : null);
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
// one run under THE TREE WATCHER: → { r, written } — written = the --root paths the run changed (empty = untouched). A
// collar error is re-thrown carrying what was written before it, so a build that wrote is never filed as "not armed".
async function watched(axis, plan, ctx, o) {
  const dirs = watchDirs(axis, plan), before = treeView(ctx, dirs);
  let r = null, err = null;
  try { r = await runAxis(axis, plan, ctx, o); } catch (e) { err = e; }
  const written = treeDiff(before, treeView(ctx, dirs));
  if (err) { if (err instanceof CollarError && written.length) err.written = written; throw err; }
  return { r, written };
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
        const w = await watched(axis, sc.plans[axis], ctx, { check });
        const run = shapeRun(axis, cmd, w.r, p.expect);
        runs[i] = run;
        if (w.written.length) { run.tree_written = w.written; run.held = null; quarantine = Q("TREE-WRITTEN", null, w.written.join(", "), axis); break; }
        if (run.crashed && COLLAR_AXES.has(axis) && !collarCrash) collarCrash = { axis, verb: run.crashed.verb, why: run.crashed.why };
      }
      catch (e) { if (e instanceof CollarError) { quarantine = collarFail(e, axis); break; } throw e; }
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
        const w = await watched(axis, sc.plans[axis], ctx, { remove: reads }), r = w.r;
        if (w.written.length) { quarantine = Q("TREE-WRITTEN", null, w.written.join(", "), axis); v = verdictOf(runs, quarantine); A = { reading: "NOT-APPLICABLE", why: `the ablation run on ${axis} wrote into --root: ${w.written.join(", ")}`, axis, removed: reads }; }
        else if (r.timed_out || r.capped || r.crashed) A = { reading: "NOT-APPLICABLE", why: `the ablation run on ${axis} was incomplete${r.crashed ? ` (VERB-CRASHED ${r.crashed.verb} ${r.crashed.why})` : ""}`, axis, removed: reads };
        else {
          const held = expectHolds(p.expect, r), was = v.verdict === "CONFIRMED";
          A = held === was ? { reading: "VACUOUS", why: `held stayed ${held} on ${axis} with every reads[] path removed`, axis, removed: reads }
            : { reading: "NOT-APPLICABLE", why: `held flipped ${was} → ${held} on ${axis} with reads[] removed: the predicate rests on them`, axis, removed: reads };
        }
      } catch (e) {
        if (!(e instanceof CollarError)) throw e;
        if (e.written) { quarantine = collarFail(e, axis); v = verdictOf(runs, quarantine); }
        A = { reading: "NOT-APPLICABLE", why: `the ablation collar did not arm: ${e.message}` };
      }
    }
  }
  return { probe_id: p && typeof p.id === "string" ? p.id : null, tree_sha: ctx.tree_sha, dirty_reads, runs, verdict: v.verdict, ...(v.why ? { verdict_why: v.why } : {}),
    lenses: { A, B: lensB(p && p.source, v.verdict), C: lensC(runs) }, quarantine, at };
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
  return [
    `QUARANTINE ${nq} of ${receipts.length}${nq ? ` · by why: ${fmt(by)}` : ""}`,
    `VERDICTS ${fmt(v)}`,
    `LENSES A: ${fmt(a)} | B: ${fmt(b)} | C: ${fmt(c)}`,
  ];
}
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
  const written = receipts.filter(r => r.quarantine && r.quarantine.why === "TREE-WRITTEN");
  if (written.length) { log(`RED: ${written.length} probe(s) wrote into --root ${fwd(ctx.root)}: ${written.map(r => `${r.probe_id} → ${r.quarantine.detail}`).join(" · ")} — the engine deleted nothing; read and remove them`); return 1; }
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
  let good = 0, ran = 0;
  const ok = (c, name, detail = "") => { ran++; if (c) good++; console.log(`${c ? "PASS" : "FAIL"}  ${name}${!c && detail ? `  — ${detail}` : ""}`); };
  const tc = async (name, fn) => { try { const r = await fn(); ok(r === true, name, r === true ? "" : String(r)); } catch (e) { ok(false, name, `THREW ${e && e.stack ? e.stack.split(NL).slice(0, 2).join(" | ") : String(e)}`); } };
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
        buildSandbox() {
          if (o.leakTo) fs.writeFileSync(o.leakTo, "a collar build that wrote outside its own temp dir\n");
          const sb = fs.mkdtempSync(path.join(T, "sb-"));
          for (const rel of String(git(root, "ls-files", "-z").stdout).split("\0").filter(Boolean)) { const src = path.join(root, rel); if (!fs.existsSync(src)) continue; fs.mkdirSync(path.dirname(path.join(sb, rel)), { recursive: true }); fs.copyFileSync(src, path.join(sb, rel)); }
          log.push({ ev: "build", root: sb });
          return { root: sb, env: { ...hostEnv(), FAKE_COLLAR: "collared" } };
        },
        assertArmed(sb) { if (o.disarmed) { log.push({ ev: "refused", root: sb.root }); throw new Error("sandbox: REFUSING — the collar did not load (no heartbeat)"); } log.push({ ev: "armed", root: sb.root }); return true; },
        destroy(sb) { fs.rmSync(sb.root, { recursive: true, force: true }); log.push({ ev: "destroy", root: sb.root }); },
      };
    };
    const ctxFor = async (o = {}) => { const collar = o.collar || makeCollar(REPO); const ctx = await makeCtx({ root: REPO }, { sandbox: collar, verbs: o.verbs || verbs, timeout: o.timeout, cap: o.cap }); return { ctx, collar }; };
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
      const { r } = await run1(P("st", "grep -c STATE_MARK dressing-room/state/bus.json", { exit: 0 }, "host"));
      return r.runs.map(x => x.held).join(",") === "true,false,true" || why(r.runs.map(x => [x.axis, x.exit]));
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
    await tc("VERDICT NON-DETERMINISTIC · mixed runs are named", async () => { const { r } = await run1(P("vn", "grep -c STATE_MARK dressing-room/state/bus.json", { exit: 0 })); return r.verdict === "NON-DETERMINISTIC" && /^mixed: host=held sandbox=not fixture=held/.test(r.verdict_why) || why(r); });
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
      return keys === "at,dirty_reads,lenses,probe_id,quarantine,runs,tree_sha,verdict" && r.tree_sha === HEAD1 && rk === "axis,bytes,capped,cmd,crashed,exit,held,read_absent,seconds,stdout_head,stdout_sha256,timed_out,tree_written"
        && r.runs.every(x => x.crashed === null && x.read_absent === null && x.tree_written === null)
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
    await tc("LENS C HOST-ONLY · the gitignored state holds on host, not on the tracked-only sandbox", async () => { const { r } = await run1(P("ch", "grep -c STATE_MARK dressing-room/state/bus.json", { exit: 0 }, "host")); return r.lenses.C.split === "HOST-ONLY" || why(r.lenses.C); });
    await tc("LENS C COLLAR-ONLY · a missing-file expectation holds on the sandbox only", async () => { const { r } = await run1(P("cc", "wc -l dressing-room/state/bus.json", { exit: 1 }, "host")); return r.lenses.C.split === "COLLAR-ONLY" || why(r.lenses.C); });
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
    const runW = async (p, v = wv, o = {}) => { const collar = makeCollar(WREPO); const ctx = await makeCtx({ root: WREPO }, { sandbox: collar, verbs: v }); if (o.hostOnly) ctx.hostOnly = true; return runProbe(p, ctx); };
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
      const v = { ...verbs, head: process.execPath };
      const n0 = SPAWNS.count; const { r } = await run1(P("ecrash", "head scripts/exit.mjs 200", { exit: 0 }, "host"), { verbs: v }); const n1 = SPAWNS.count;
      const { r: r2 } = await run1(P("eok", "head scripts/exit.mjs 1", { exit: 1 }, "host"), { verbs: v }); const n2 = SPAWNS.count;
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
    await tc("L7b TREE WATCHER · a COLLAR run that leaks into --root is TREE-WRITTEN too: a main run, and lens A's ablation run (its verdict withdrawn)", async () => {
      try {
        const r = await runW(P("lmain", "node scripts/leak.mjs docs/nothere.md", { stdout_includes: ["ok"] }, "sandbox"), verbs);
        const leakedMain = fs.existsSync(LEAK); rmW("leaked.txt");
        const r2 = await runW(P("labl", "node scripts/leak.mjs docs/notes.md", { stdout_includes: ["ok"] }, "sandbox", ["docs/notes.md"]), verbs);
        return r.verdict === "UNRUNNABLE" && r.quarantine.why === "TREE-WRITTEN" && r.quarantine.detail === "leaked.txt" && r.runs[0].axis === "sandbox" && leakedMain
          && r2.verdict === "UNRUNNABLE" && r2.quarantine.why === "TREE-WRITTEN" && r2.runs.every(x => x.held === true) && /the ablation run on sandbox wrote into --root: leaked.txt/.test(r2.lenses.A.why) || why({ r: [r.verdict, r.quarantine], r2: [r2.verdict, r2.quarantine, r2.lenses.A] });
      } finally { rmW("leaked.txt"); }
    });
    await tc("L7b TREE WATCHER · a collar BUILD that writes into --root and then refuses to arm is TREE-WRITTEN, never filed as COLLAR-NOT-ARMED", async () => {
      const lb = path.join(WREPO, "leakbuild.txt");
      try {
        const ctx = await makeCtx({ root: WREPO }, { sandbox: makeCollar(WREPO, { disarmed: true, leakTo: lb }), verbs });
        const r = await runProbe(P("lbuild", "wc -l docs/notes.md", { exit: 0 }, "sandbox"), ctx);
        return r.verdict === "UNRUNNABLE" && r.quarantine.why === "TREE-WRITTEN" && r.quarantine.detail === "leakbuild.txt" || why(r.quarantine);
      } finally { fs.rmSync(lb, { force: true }); }
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
    await tc("CLI · an unknown verb is usage (exit 2), never a run", async () => { const r = spawnSync(process.execPath, [SELF, "frobnicate"], { encoding: "utf8", shell: false, windowsHide: true, timeout: 60000 }); return r.status === 2 && /usage/.test(String(r.stderr)) || why({ code: r.status }); });
  } catch (e) {
    ok(false, "selftest threw outside a case", e && e.stack ? e.stack.split(NL).slice(0, 3).join(" | ") : String(e));
  } finally { try { fs.rmSync(T, { recursive: true, force: true }); } catch {} }
  console.log(`probe selftest: ${good}/${ran} ok${good === ran ? " · GREEN" : " · RED"}`);
  return good === ran ? 0 : 1;
}

// ---------------------------------------------------------------------------- main
const USAGE = "usage: node scripts/probe.mjs import --population <jsonl> --out <probes.jsonl> | run --probes <f> --out <receipts.jsonl> [--ids a,b] [--root <dir>] [--timeout-ms N] [--host-only] | status --probes <f> --receipts <f> [--root <dir>] | report --receipts <f> | selftest";
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
  if (!["import", "run", "status", "report"].includes(verb)) throw new Stop(USAGE);
  const o = args(argv);
  if (verb === "import") return cmdImport(o);
  if (verb === "run") return cmdRun(o);
  if (verb === "status") return cmdStatus(o);
  return cmdReport(o);
}
if (process.argv[1] && path.resolve(process.argv[1]) === SELF) {
  main(process.argv.slice(2)).then(code => { process.exitCode = code; }, e => {
    if (e instanceof Stop) { console.error(e.message); process.exitCode = e.code; }
    else { console.error(`probe: INTERNAL ${e && e.message ? e.message.slice(0, 300) : String(e)}`); process.exitCode = 2; }
  });
}
