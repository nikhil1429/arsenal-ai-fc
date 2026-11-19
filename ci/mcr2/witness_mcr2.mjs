#!/usr/bin/env node
// ci/mcr2/witness_mcr2.mjs — unit mcr2 (forks row 1022 (4)): THE SELFTEST THAT READS ITS OWN SOURCE IS LINE-END-PROOF.
//
// CONTRACT
//   node ci/mcr2/witness_mcr2.mjs --org <dir> [--base-org <dir>]
//   <dir> is a tree of the organism (a git work tree — its TRACKED files are used — or a plain export such as
//   a git archive). Nothing is run inside <dir>: every run is on a COPY under os.tmpdir().
//
//   For each tree it builds two copies: an LF copy (every text file with LF line ends) and a CRLF copy (every
//   text file with CR LF, the way a Windows checkout under core.autocrlf=true writes it under this repo's
//   .gitattributes: `* text=auto`, so a file is text when its first 8000 bytes hold no NUL, and the four eol=lf
//   rules — hooks/pre-commit, hooks/commit-msg, dressing-room/state/*.json, dressing-room/state/*.jsonl — stay LF).
//   A node_modules directory in <dir> is linked into each copy (a junction on Windows), never copied.
//   Every child runs with cwd = the copy, TMPDIR/TEMP/TMP = a directory of its own under the witness's temp root
//   (its own state dir: the copy's tree is its only state, never his), TZ=UTC, ANTHROPIC_API_KEY removed, and a
//   FAKE `claude` (a sh script and a claude.cmd beside it) first on PATH that logs every spawn and exits 1 — no
//   live model call can happen. The clock the clauses judge by is each selftest's own fixed NOW; the witness's
//   verdict reads no wall clock.
//
//   CLAUSES (one line each; ✓ or ✗ and the reason)
//     C-<file>  one per BUILT file (NAMED below): its selftest exits 0 on the LF copy AND on the CRLF copy of
//               --org; on the CRLF copy of --base-org it exits non-zero and its ✗ lines are EXACTLY the clause
//               names this unit measured for that file (PROOF.md section 1); and --org's check count is not below
//               --base-org's (a selftest count never falls).
//     BOUND     --org differs from --base-org ONLY in the NAMED files (line ends ignored; ci/mcr2/** and
//               .claude/settings.json — this unit's own home and the seat key that never lands — are not compared),
//               EVERY named file differs, and inside each named file every changed line is a line of selftest()
//               whose own-source read `readFileSync(fileURLToPath(import.meta.url), "utf8")` gained exactly
//               `.replace(/\r\n/g, "\n")` and nothing else.
//     LAST      no node process naming the witness's temp root survives (ps on POSIX, Win32_Process through
//               PowerShell on Windows — never /proc), and the fake claude logged no spawn.
//   LAST LINE:  GREEN MCR2 <what> · <n> clause(s)   (exit 0)
//               RED MCR2 · <clause> <clause> …       (exit 1)
//   On BASE (main d0c8c96, --org = --base-org = BASE) it exits 1, RED at every C-<file> and at BOUND.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, rmSync, mkdtempSync, symlinkSync, realpathSync, chmodSync } from "node:fs";
import { join, dirname, resolve, delimiter } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

/** the RED-on-CRLF-only members this unit builds, each with the ✗ clause names its BASE selftest prints on CRLF */
const NAMED = {
  "scripts/context.mjs": ["S880B THE STAMP MOVES ON A POLL WITH NO WINDOW CHANGE", "S893 F1 NEVER THE PROCESS TABLE"],
  "scripts/fuelboard.mjs": ["FUEL VERB is dispatched FIRST"],
  "scripts/learnstate.mjs": ["L3 · WIRE — learnstate imports only the pointer ledger's READ verbs"],
};
const READ = 'readFileSync(fileURLToPath(import.meta.url), "utf8")';
const NORM = '.replace(/\\r\\n/g, "\\n")';
const NOT_COMPARED = (/** @type {string} */ p) => p.startsWith("ci/mcr2/") || p === ".claude/settings.json";
const FORCED_LF = (/** @type {string} */ p) => p === "hooks/pre-commit" || p === "hooks/commit-msg" || /^dressing-room\/state\/[^/]+\.jsonl?$/.test(p);

const argv = process.argv.slice(2);
const opt = (/** @type {string} */ k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? resolve(argv[i + 1]) : null; };
const ORG = opt("--org"), BASE_ORG = opt("--base-org");
if (!ORG || !existsSync(ORG)) { console.log("usage: node ci/mcr2/witness_mcr2.mjs --org <dir> [--base-org <dir>]"); console.log("RED MCR2 · USAGE"); process.exit(1); }

/** @param {string} root @returns {string[]} forward-slash paths of the tree's files */
function filesOf(root) {
  if (existsSync(join(root, ".git"))) {
    const r = spawnSync("git", ["-C", root, "ls-files", "-z"], { encoding: "utf8" });
    if (r.status === 0) return r.stdout.split("\0").filter((p) => p && existsSync(join(root, p)) && statSync(join(root, p)).isFile());
  }
  /** @type {string[]} */ const out = [];
  const walk = (/** @type {string} */ rel) => {
    for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
      const p = rel ? rel + "/" + e.name : e.name;
      if (e.name === ".git" || e.name === "node_modules") continue;
      if (e.isDirectory()) walk(p); else if (e.isFile()) out.push(p);
    }
  };
  walk("");
  return out;
}
const isText = (/** @type {Buffer} */ b) => !b.subarray(0, 8000).includes(0);
const toLF = (/** @type {string} */ s) => s.replace(/\r\n/g, "\n");

const TMP = mkdtempSync(join(tmpdir(), "witness-mcr2-"));
const BIN = join(TMP, "bin"), SPAWNLOG = join(TMP, "bin", "spawn.log");
mkdirSync(BIN, { recursive: true });
writeFileSync(join(BIN, "claude"), `#!/bin/sh\necho "claude $*" >> "${SPAWNLOG.replace(/\\/g, "/")}"\nexit 1\n`);
try { chmodSync(join(BIN, "claude"), 0o755); } catch { /* Windows: the .cmd below is the one found */ }
writeFileSync(join(BIN, "claude.cmd"), `@echo off\r\necho claude %* >> "${SPAWNLOG}"\r\nexit /b 1\r\n`);

/** @param {string} src @param {"lf"|"crlf"} eol @param {string} name */
function copyTree(src, eol, name) {
  const dst = join(TMP, name);
  for (const p of filesOf(src)) {
    const b = readFileSync(join(src, p));
    const target = join(dst, ...p.split("/"));
    mkdirSync(dirname(target), { recursive: true });
    if (!isText(b)) { writeFileSync(target, b); continue; }
    const lf = toLF(b.toString("utf8"));
    writeFileSync(target, eol === "crlf" && !FORCED_LF(p) ? lf.replace(/\n/g, "\r\n") : lf);
  }
  const nm = join(src, "node_modules");
  if (existsSync(nm)) symlinkSync(realpathSync(nm), join(dst, "node_modules"), "junction");
  return dst;
}

let runN = 0;
/** @param {string} tree @param {string} file */
function selftest(tree, file) {
  const own = join(TMP, "state-" + (++runN));
  mkdirSync(own, { recursive: true });
  const env = { ...process.env, PATH: BIN + delimiter + (process.env.PATH || ""), TMPDIR: own, TEMP: own, TMP: own, TZ: "UTC" };
  delete env.ANTHROPIC_API_KEY;
  if (process.platform === "win32") env.Path = env.PATH;
  const r = spawnSync(process.execPath, [file, "selftest"], { cwd: tree, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const text = (r.stdout || "") + (r.stderr || "");
  const lines = text.split(/\r?\n/);
  return {
    code: r.status,
    bad: lines.filter((l) => /^\s*✗ /.test(l)).map((l) => l.replace(/^\s*✗ /, "")),
    checks: lines.filter((l) => /^\s*[✓✗] /.test(l)).length,
    last: lines.filter((l) => l.trim()).pop() || "(no output)",
  };
}

/** @type {[string, boolean, string][]} */ const clauses = [];
const clause = (/** @type {string} */ n, /** @type {boolean} */ ok, /** @type {string} */ why) => { clauses.push([n, ok, why]); console.log(`  ${ok ? "✓" : "✗"} ${n} — ${why}`); };

const orgLF = copyTree(ORG, "lf", "org-lf"), orgCR = copyTree(ORG, "crlf", "org-crlf");
const baseCR = BASE_ORG ? copyTree(BASE_ORG, "crlf", "base-crlf") : null;

for (const [file, names] of Object.entries(NAMED)) {
  const id = "C-" + file.replace(/^scripts\//, "").replace(/\.mjs$/, "");
  const a = selftest(orgLF, file), b = selftest(orgCR, file);
  const c = baseCR ? selftest(baseCR, file) : null;
  const baseRedByName = !!c && c.code !== 0 && names.every((n) => c.bad.some((l) => l.startsWith(n))) && c.bad.every((l) => names.some((n) => l.startsWith(n)));
  const ok = a.code === 0 && b.code === 0 && baseRedByName && !!c && a.checks >= c.checks && b.checks >= c.checks;
  clause(id, ok, `org LF exit ${a.code} (${a.checks} checks, ${a.last}) · org CRLF exit ${b.code} (${b.checks} checks, ${b.last}) · `
    + (c ? `base CRLF exit ${c.code} (${c.checks} checks) red by [${c.bad.map((l) => l.slice(0, 48)).join(" | ")}]${baseRedByName ? "" : ` — want exactly [${names.join(" | ")}]`}` : "no --base-org given"));
}

{
  /** @type {string[]} */ const why = [];
  if (!BASE_ORG) why.push("no --base-org given");
  else {
    const fo = new Set(filesOf(ORG).filter((p) => !NOT_COMPARED(p))), fb = new Set(filesOf(BASE_ORG).filter((p) => !NOT_COMPARED(p)));
    const read = (/** @type {string} */ root, /** @type {string} */ p) => { const b = readFileSync(join(root, p)); return isText(b) ? toLF(b.toString("utf8")) : b.toString("base64"); };
    /** @type {string[]} */ const differ = [];
    for (const p of new Set([...fo, ...fb])) if (!fo.has(p) || !fb.has(p) || read(ORG, p) !== read(BASE_ORG, p)) differ.push(p);
    const stray = differ.filter((p) => !(p in NAMED));
    if (stray.length) why.push(`differs outside the named files: ${stray.slice(0, 6).join(", ")}${stray.length > 6 ? ` (+${stray.length - 6})` : ""}`);
    for (const p of Object.keys(NAMED)) {
      if (!differ.includes(p)) { why.push(`${p} does not differ (the build never fed it)`); continue; }
      const o = read(ORG, p).split("\n"), b = read(BASE_ORG, p).split("\n");
      if (o.length !== b.length) { why.push(`${p}: line count ${b.length} -> ${o.length}`); continue; }
      const s0 = b.findIndex((l) => /^(async )?function selftest\(/.test(l)), s1 = b.findIndex((l, i) => i > s0 && /^\}/.test(l));
      b.forEach((l, i) => {
        if (o[i] === l) return;
        const inSelftest = s0 >= 0 && i > s0 && i < s1;
        if (!inSelftest || l.split(READ).length !== 2 || o[i] !== l.replace(READ, READ + NORM)) why.push(`${p}:${i + 1} changed ${inSelftest ? "beyond the own-source read's normalisation" : "OUTSIDE selftest()"}`);
      });
    }
  }
  clause("BOUND", why.length === 0, why.length ? why.join("; ") : `only ${Object.keys(NAMED).join(", ")} differ, each only by ${NORM} on an own-source read inside selftest()`);
}

{
  const root = TMP.replace(/\\/g, "/").toLowerCase();
  const list = process.platform === "win32"
    ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { [string]$_.ProcessId + ' ' + $_.CommandLine }"], { encoding: "utf8" })
    : spawnSync("ps", ["-eo", "pid=,args="], { encoding: "utf8" });
  const rows = String(list.stdout || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const alive = rows.filter((l) => /node/i.test(l) && l.replace(/\\/g, "/").toLowerCase().includes(root) && !l.startsWith(String(process.pid) + " "));
  const spawned = existsSync(SPAWNLOG) ? readFileSync(SPAWNLOG, "utf8").split(/\r?\n/).filter(Boolean) : [];
  const listed = list.status === 0 && rows.length > 0;
  clause("LAST", listed && alive.length === 0 && spawned.length === 0,
    `${listed ? `${rows.length} processes listed, ${alive.length} node naming the temp root` : "the process table could not be listed"}${alive.length ? ` [${alive.slice(0, 3).join(" | ")}]` : ""} · fake claude spawns ${spawned.length}`);
}

try { rmSync(TMP, { recursive: true, force: true }); } catch (e) { console.log(`  (temp root not removed: ${/** @type {Error} */ (e).message})`); }
const red = clauses.filter((c) => !c[1]).map((c) => c[0]);
console.log(red.length ? `RED MCR2 · ${red.join(" ")}` : `GREEN MCR2 own-source selftest reads are line-end-proof (${Object.keys(NAMED).length} files) · ${clauses.length} clause(s)`);
process.exit(red.length ? 1 : 0);
