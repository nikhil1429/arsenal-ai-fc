#!/usr/bin/env node
// ============================================================================
// ci/mpinl/witness_mpinl.mjs — UNIT mpin-law (mpinl) · forks row 1160 (2) / (4) / (5) / (6): the own-literal pin class held
//   by a COUNT on the law pack's machine line, its baseline read from the tree, F6 C, the F7 walk.
// ----------------------------------------------------------------------------
// USAGE: node ci/mpinl/witness_mpinl.mjs --org <dir> --base-org <dir> [--modules <dir>] [--only <clause>[,<clause>…]]
//   --org       the tree to witness (the build reads GREEN; the base fb42118 reads RED on every clause it lacks)
//   --base-org  the BASE tree (main fb42118, ci/mpinl/BASE) — BOUND needs it; absent, BOUND is RED
//   --modules   a dir whose node_modules (npm ci) the copies borrow when --org has none (else --base-org's)
//   --only      run only these clause ids (the mutant runner's door); BOUND and LAST always run
// CONTRACT — every plant runs on a COPY of --org under os.tmpdir() (never .git, never node_modules — that rides as a link, a
//   junction on Windows; never dressing-room/state — an EMPTY state dir is made: nothing of his is copied, read or printed).
//   Each copy is made a git repo by `git init` with core.autocrlf=false (row 1036) and `git add -A`, so the law pack's own
//   NUL scan (git ls-files) reads it. Every line read from a process is split on \r?\n, and BOUND hashes text with CRLF
//   folded. No port is bound, no service is named, nothing is POSTed and nothing restarted (row 1053's port class); no model
//   is called. No timeout is typed: every child is bounded by WITNESS_TIMEOUT_MS, the organism's own witness bound, read from
//   its owner (scripts/rung_receipt.mjs, which reads postmatch.mjs CHILD_TIMEOUT_MS); a child killed at it reads RED, named
//   killed. Processes are listed through PowerShell on Windows, `ps` elsewhere.
// THE SECOND METHOD (W1 / W1u) is the spec's own pair, copied VERBATIM into ci/mpinl/instruments/ (sha256 below) and run as
//   children on the same copy: mcon's census (ci/mcon/census_mcon.mjs @ 4c4feb8, blob 02bb94b, sha256 fd9f2c56…17a8) and the
//   spec's classifier (ci/mpin/classify_mpin.mjs @ fb7c6b2, blob c6ac462, sha256 cb0cdb54…dcd7f). Both are compared over the
//   law's own walk (scripts/ + hooks/); ci/ is F7's.
// CLAUSES (spec ci/mpin/MPIN_SPEC.md @ fb7c6b2 W1-W5; ruling row 1160 (2) (4) (5) — where they differ, the ruling wins):
//   W1   the machine line carries `own-literal-pin <n>`; n = the classifier's same-shape count over scripts/ + hooks/, and the
//        judge's own-literal sites equal the classifier's same-shape sites, file:line by file:line
//   W1u  (F6 b) the machine line carries `own-source-pin-unresolved <u>`; u = the census's unresolved sites minus those the
//        classifier finds same-shape (the ones F6 a resolves), site by site
//   W2   a copy plus one new whole-file self-source pin → `own-literal-pin ROSE` on the law pack's RED lines, at n + 1
//   W2u  a copy plus one new unresolved pin AND one that declares law-waiver:own-literal-pin → `own-source-pin-unresolved
//        ROSE` at exactly u + 1 (the waived one is not counted)
//   W3   acorn hidden (a planted resolver preload) → `INSTRUMENT DEAD — own-literal census`, and neither key prints a FALL
//   W4   (row 1160 (2)) the frozen line's own-literal-pin and own-source-pin-unresolved EQUAL the counts the law reads on the
//        tree it judges — the baseline is the tree's, read at the law's landing; a later unit lowers it as its last commit
//   W5   CLEAN: a narrowed ownCode subject, the house concatenated needle, a subject sliced off the selftest, a negative pin
//        and a value-use of .match hold zero pins of any kind; the real tree's concatenated needle (dugout's /transcript door
//        test) is not a finding
//   W6   (F6 a) the whole-line-comment filter is RESOLVED: a planted pin on a kept line is own-literal; on a dropped line it is
//        nothing; a filter whose predicate is not `!/re/.test(l)` stays UNRESOLVED (never silently clean)
//   F7   (row 1160 (5)) mcon's census over the tree's ci/ (this unit's own ci/mpinl excluded: it never lands) — zero hits ⇒ the
//        law's walk is exactly scripts+hooks; one or more ⇒ the walk takes ci (and W4 freezes the count with them)
//   ROW 1311 (1): W4 and F7 read WHOLE-TREE counts, so their ids are "W4 BOUND" and "F7 BOUND" (the WITNESSES member drops them
//        at head, scripts/organism_test.mjs boundIds). ROW 1307 (1): the witness runs in the bare form — --org and --base-org
//        only, from a copy of its own dir, node_modules found under --org or --base-org.
//   A RULE BORN WITH ITS BASELINE (forks row 1316 (1)-(3); ci/mpinl/AMENDMENT_1315.md §3, all nine rows). A count is BORN when
//        --org's BASELINE holds its key and --base-org's law pack does not count it:
//   V0   the train's red reproduced: --base-org's own verdict reader, on the two trees' real law pack lines, prints
//        `LAW PACK ROSE · <born> 0 → <n>` for every born count; --org's reader on the same lines reads GREEN
//   V1   --org's reader, through compare's own baseline door: a born count at its BASELINE → GREEN, one above → RED by numbers
//   V2   a copy whose BASELINE for a born key is raised, over a base that counts it → RED (a baseline raised later is a rise)
//   V3   a count with NO BASELINE key, at the head only → RED `0 → n` (kept guard: nothing is grandfathered)
//   P1a  mlaw's JUGAD clause (P1) on --org over plant B (--org minus the rule, plus one jugad finding) → ok
//   P1b  the same with an EXISTING BASELINE key raised at --org → RED (kept guard: per key the value is the base's, or born)
//   G3a  mrung's G3 on --org over plant B → GREEN
//   G3b  the born count one above its BASELINE (a planted own-literal pin) over plant B → RED (kept guard)
//   L1   lawpack's selftest carries its NEW LAW assert, green (kept guard: a count with no BASELINE key is RED)
//        (L2 is W4 BOUND.) "Kept guard" clauses read GREEN on both trees; each exists for its mutant (run_mutants_mpinl.mjs).
//   BOUND only the car's named files differ from --base-org: scripts/lawpack.mjs, scripts/ci_verdict.mjs,
//        ci/mlaw/witness_mlaw.mjs, ci/mrung/witness_mrung.mjs and ci/mpinl/**
//   LAST  no node process naming the temp root survives
// LAST LINE: GREEN MPINL <what> · <n> clause(s) (exit 0) or RED MPINL · <clauses> (exit 1)
// ============================================================================
import { cpSync, mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, statSync, symlinkSync } from "node:fs";
import { join, resolve, relative, sep, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
const ORG = opt("--org") ? resolve(opt("--org")) : null;
const BASE = opt("--base-org") ? resolve(opt("--base-org")) : null;
const ONLY = opt("--only") ? new Set(opt("--only").split(",")) : null;
// row 1311 (1): a clause that reads a WHOLE-TREE count (the tree's own baseline equality, the ci census) is a seat-time clause, so
// its id ends " BOUND" and the WITNESSES member drops it at head (scripts/organism_test.mjs boundIds)
const W4 = "W4 BOUND", F7 = "F7 BOUND";
// the car's named files (forks row 1316 (2): ONE commit carries the rule, the verdict caller's line and the two witness re-cuts)
const NAMED_FILES = new Set(["scripts/lawpack.mjs", "scripts/ci_verdict.mjs", "ci/mlaw/witness_mlaw.mjs", "ci/mrung/witness_mrung.mjs"]);
if (!ORG) { console.error("usage: node ci/mpinl/witness_mpinl.mjs --org <dir> --base-org <dir> [--modules <dir>] [--only <ids>]"); process.exit(1); }
const HERE = dirname(fileURLToPath(import.meta.url));
const CENSUS = join(HERE, "instruments", "census_mcon.mjs");
const CLASSIFY = join(HERE, "instruments", "classify_mpin.mjs");
const hasMods = (d) => d && existsSync(join(d, "node_modules", "acorn", "package.json")) && existsSync(join(d, "node_modules", "acorn-walk", "package.json"));
const MODS = [ORG, opt("--modules") ? resolve(opt("--modules")) : null, BASE].find(hasMods) || null;

const results = [];   // { id, ok, why }
const clause = (id, ok, why) => { results.push({ id, ok: Boolean(ok), why }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id} — ${why}`); };
const want = (id) => !ONLY || ONLY.has(id);
const lines = (s) => String(s || "").split(/\r?\n/);
const fold = (b) => b.toString("utf8").replace(/\r\n/g, "\n");

// ── THE BOUND: the organism's own witness bound, from its owner (never typed here) ──────────────────────────────────────
let BOUND_MS = null, boundWhy = null;
for (const t of [BASE, ORG].filter(Boolean)) {
  const f = join(t, "scripts", "rung_receipt.mjs");
  if (!existsSync(f)) continue;
  try { BOUND_MS = (await import(pathToFileURL(f).href)).WITNESS_TIMEOUT_MS; boundWhy = `WITNESS_TIMEOUT_MS from ${relative(t, f).split(sep).join("/")} (${t === BASE ? "--base-org" : "--org"})`; break; }
  catch (e) { boundWhy = `rung_receipt.mjs did not import (${String(e).slice(0, 120)})`; }
}
if (!Number.isFinite(BOUND_MS)) { console.log(`RED MPINL · BOUND-MS — no witness bound could be read (${boundWhy || "scripts/rung_receipt.mjs absent"})`); process.exit(1); }

const ROOT = mkdtempSync(join(tmpdir(), "mpinl-w-"));
const childEnv = () => { const e = { ...process.env }; delete e.NODE_OPTIONS; return e; };
/** one bounded child; a kill at the bound is named, never read as an answer */
function run(file, args, { cwd, pre = [] } = {}) {
  const r = spawnSync(process.execPath, [...pre, file, ...args], { cwd, env: childEnv(), encoding: "utf8", timeout: BOUND_MS, maxBuffer: 256 * 1024 * 1024, windowsHide: true });
  const killed = Boolean(r.error && /ETIMEDOUT/.test(String(r.error.code || r.error))) || r.signal != null;
  return { code: r.status, out: r.stdout || "", err: r.stderr || "", killed, why: killed ? `KILLED at the witness bound (${BOUND_MS} ms, ${boundWhy})` : null };
}

/** a COPY of --org under ROOT: no .git, no node_modules (linked), an EMPTY state dir; then git init with autocrlf off */
function copyOf(name, from = ORG) {
  const dst = join(ROOT, name);
  cpSync(from, dst, { recursive: true, filter: (src) => {
    const rel = relative(from, src).split(sep).join("/");
    return !(rel === ".git" || rel.startsWith(".git/") || rel === "node_modules" || rel.startsWith("node_modules/") || rel === "dressing-room/state" || rel.startsWith("dressing-room/state/"));
  } });
  mkdirSync(join(dst, "dressing-room", "state"), { recursive: true });
  if (MODS) symlinkSync(join(MODS, "node_modules"), join(dst, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  const g = (args) => spawnSync("git", args, { cwd: dst, encoding: "utf8", timeout: BOUND_MS, windowsHide: true });
  g(["-c", "core.autocrlf=false", "init", "-q"]);
  g(["config", "core.autocrlf", "false"]);
  g(["add", "-A"]);
  return dst;
}

/** the law pack's report on a tree: its machine line, frozen line, RED lines, ok lines and the own-literal census line */
function lawReport(dir, pre = []) {
  const r = run(join(dir, "scripts", "lawpack.mjs"), ["report"], { cwd: dir, pre });
  const L = lines(r.out);
  const machine = L.find((l) => /^lawpack · \d+ raw match/.test(l)) || "";
  const frozen = L.find((l) => /^\s+frozen: /.test(l)) || "";
  const num = (s, k) => { const m = new RegExp(`(?:^|· |: )${k} (\\d+)(?: ·|$)`).exec(s); return m ? Number(m[1]) : null; };
  return { r, L, machine, frozen, n: num(machine, "own-literal-pin"), u: num(machine, "own-source-pin-unresolved"),
    fn: num(frozen, "own-literal-pin"), fu: num(frozen, "own-source-pin-unresolved"),
    reds: L.filter((l) => /^\s+RED\s/.test(l)), oks: L.filter((l) => /^\s+ok\s/.test(l)), census: L.find((l) => /^\s+own-literal census · walk /.test(l)) || "" };
}
const inWalk = (at) => /^(scripts|hooks)\//.test(at);

const NEED_MAIN = ["W1", "W1u", W4, F7, "W5", "V0", "V1", "V2", "V3", "P1a", "P1b", "G3a", "G3b", "L1"].some(want);
console.log(`witness mpinl · org ${ORG} · base ${BASE || "(none)"} · node_modules ${MODS ? MODS : "NONE"} · bound ${boundWhy} · root ${ROOT}`);
try {
  if (!MODS) {
    for (const id of ["W1", "W1u", "W2", "W2u", "W3", W4, "W5", "W6", F7, "V0", "V1", "V2", "V3", "P1a", "P1b", "G3a", "G3b", "L1"].filter(want)) clause(id, false, "NOT MEASURABLE — no node_modules with acorn under --org, --modules or --base-org (npm ci)");
  } else {
    const main = copyOf("main");
    const rep = NEED_MAIN || want("W2") || want("W2u") ? lawReport(main) : null;
    if (rep && rep.r.killed) console.log(`  (the report child on the copy was ${rep.r.why})`);
    // the second method, on the SAME copy
    let census = null, classify = null;
    if (want("W1") || want("W1u")) {
      const c = run(CENSUS, ["--org", main, "--modules", MODS, "--json"], { cwd: ROOT });
      const cj = join(ROOT, "census.jsonl");
      writeFileSync(cj, c.out);
      census = c.killed ? null : lines(c.out).filter((l) => l.startsWith("{")).map((l) => JSON.parse(l));
      const k = run(CLASSIFY, ["--org", main, "--census", cj, "--modules", MODS, "--json"], { cwd: ROOT });
      classify = k.killed ? null : lines(k.out).filter((l) => l.startsWith("{")).map((l) => JSON.parse(l));
      if (c.killed || k.killed) console.log(`  (an instrument child was ${c.why || k.why})`);
    }
    // the judge's own lists, in process, from the copy's own lawpack.mjs (main guard: importing runs nothing)
    let L = null, judged = null, lwhy = null;
    try { L = await import(pathToFileURL(join(main, "scripts", "lawpack.mjs")).href); if (typeof L.ownLiteralPins === "function") judged = L.ownLiteralPins({ root: main }); else lwhy = "scripts/lawpack.mjs exports no ownLiteralPins"; }
    catch (e) { lwhy = `scripts/lawpack.mjs did not import (${String(e).slice(0, 120)})`; }
    const at = (p) => `${p.file}:${p.line}`;
    const multiset = (xs) => xs.slice().sort().join("\n");

    if (want("W1")) {
      if (!census || !classify) clause("W1", false, "the census or the classifier did not answer (killed at the bound, or no output)");
      else {
        const same = classify.filter((x) => x.cls === "same-shape" && inWalk(x.at)).map((x) => x.at);
        const mine = judged ? judged.findings.map(at) : [];
        clause("W1", rep.n !== null && judged && rep.n === same.length && multiset(mine) === multiset(same),
          rep.n === null ? `the machine line carries no own-literal-pin key (${rep.machine ? "line present, key absent" : "no machine line"}${lwhy ? `; ${lwhy}` : ""})`
            : `own-literal-pin ${rep.n} on the machine line · classifier same-shape ${same.length} over scripts+hooks · sites ${judged && multiset(mine) === multiset(same) ? "equal, file:line by file:line" : `DIFFER (judge-only: ${mine.filter((x) => !same.includes(x)).join(", ") || "-"} · classifier-only: ${same.filter((x) => !mine.includes(x)).join(", ") || "-"})`}`);
      }
    }
    if (want("W1u")) {
      if (!census || !classify) clause("W1u", false, "the census or the classifier did not answer (killed at the bound, or no output)");
      else {
        const sameAt = new Set(classify.filter((x) => x.cls === "same-shape" && x.census === "unresolved").map((x) => `${x.at}|${x.pin}`));
        const expect = census.filter((x) => x.kind === "unresolved" && inWalk(x.at) && !sameAt.has(`${x.at}|${x.pin}`)).map((x) => x.at);
        const mine = judged ? [...judged.unresolved, ...judged.waived].map(at) : [];
        clause("W1u", rep.u !== null && judged && rep.u === judged.unresolved.length && multiset(mine) === multiset(expect),
          rep.u === null ? `the machine line carries no own-source-pin-unresolved key${lwhy ? ` (${lwhy})` : ""}`
            : `own-source-pin-unresolved ${rep.u} on the machine line · census unresolved over scripts+hooks minus the classifier's same-shape among them = ${expect.length} · waived ${judged ? judged.waived.length : "?"} · sites ${judged && multiset(mine) === multiset(expect) ? "equal" : `DIFFER (judge-only: ${mine.filter((x) => !expect.includes(x)).join(", ") || "-"} · expected-only: ${expect.filter((x) => !mine.includes(x)).join(", ") || "-"})`}`);
      }
    }
    if (want("W2") || want("W2u")) {
      const p = copyOf("plant-rose");
      writeFileSync(join(p, "scripts", "zz_mpinl_plant_whole.mjs"), 'import { readFileSync } from "node:fs";\nimport { fileURLToPath } from "node:url";\nconst assert = (n, c) => c;\nexport function selftest() {\n  return assert("x", /ZZ_MPINL/.test(readFileSync(fileURLToPath(import.meta.url), "utf8")) && "ZZ");\n}\n');
      writeFileSync(join(p, "scripts", "zz_mpinl_plant_unres.mjs"), 'import { readFileSync } from "node:fs";\nconst assert = (n, c) => c;\nexport function selftest() {\n  const S = readFileSync(new URL(import.meta.url), "utf8");\n  return assert("x", /ZZ_MPINL/.test(S.toLowerCase()));\n}\n');
      writeFileSync(join(p, "scripts", "zz_mpinl_plant_waived.mjs"), 'import { readFileSync } from "node:fs";\nconst assert = (n, c) => c;\nexport function selftest() {\n  const S = readFileSync(new URL(import.meta.url), "utf8");\n  // law-waiver:own-literal-pin the planted why: a header doc-wire, read on purpose\n  return assert("x", /ZZ_MPINL/.test(S.toLowerCase()));\n}\n');
      spawnSync("git", ["add", "-A"], { cwd: p, timeout: BOUND_MS, windowsHide: true });
      const rp = lawReport(p);
      if (want("W2")) {
        const rose = rp.reds.find((l) => /own-literal-pin ROSE — \d+, baseline \d+/.test(l));
        clause("W2", rep.n !== null && rp.n === rep.n + 1 && Boolean(rose),
          rp.r.killed ? rp.r.why : rep.n === null ? "no own-literal-pin key on the machine line, so no new pin can rise" : `planted +1 whole-file pin → own-literal-pin ${rp.n} (was ${rep.n}) · ${rose ? rose.trim() : "NO 'own-literal-pin ROSE' RED line"}`);
      }
      if (want("W2u")) {
        const rose = rp.reds.find((l) => /own-source-pin-unresolved ROSE — \d+, baseline \d+/.test(l));
        clause("W2u", rep.u !== null && rp.u === rep.u + 1 && Boolean(rose),
          rp.r.killed ? rp.r.why : rep.u === null ? "no own-source-pin-unresolved key on the machine line" : `planted +1 unresolved and +1 waived → own-source-pin-unresolved ${rp.u} (was ${rep.u}; exactly +1 means the waiver held) · ${rose ? rose.trim() : "NO 'own-source-pin-unresolved ROSE' RED line"}`);
      }
    }
    if (want("W3")) {
      const pre = join(ROOT, "hide_acorn.mjs");
      writeFileSync(pre, 'import Module from "node:module";\nconst orig = Module._resolveFilename;\nModule._resolveFilename = function (request, ...rest) {\n  if (request === "acorn" || request === "acorn-walk") { const e = new Error("acorn hidden by the mpinl witness (planted)"); e.code = "MODULE_NOT_FOUND"; throw e; }\n  return orig.call(this, request, ...rest);\n};\n');
      const rd = lawReport(main, ["--import", pathToFileURL(pre).href]);
      const dead = rd.reds.find((l) => /INSTRUMENT DEAD — own-literal census/.test(l));
      const fell = [...rd.oks, ...rd.reds].filter((l) => /own-literal-pin FELL|own-source-pin-unresolved FELL/.test(l));
      clause("W3", Boolean(dead) && fell.length === 0 && rd.machine !== "",
        rd.r.killed ? rd.r.why : `acorn hidden → ${dead ? dead.trim().slice(0, 110) : "NO 'INSTRUMENT DEAD — own-literal census' line"} · FALL lines for the two keys: ${fell.length}`);
    }
    if (want(W4)) {
      clause(W4, rep.n !== null && rep.u !== null && rep.fn === rep.n && rep.fu === rep.u,
        rep.r.killed ? rep.r.why : `frozen own-literal-pin ${rep.fn ?? "absent"} vs read ${rep.n ?? "absent"} · frozen own-source-pin-unresolved ${rep.fu ?? "absent"} vs read ${rep.u ?? "absent"} (the baseline is the tree's own read)`);
    }
    if (want("W5")) {
      if (!judged) clause("W5", false, lwhy || "no judge");
      else {
        const cd = join(ROOT, "clean");
        mkdirSync(join(cd, "scripts"), { recursive: true });
        const H = 'import { readFileSync } from "node:fs";\nimport { fileURLToPath } from "node:url";\nconst assert = (n, c) => c;\n';
        writeFileSync(join(cd, "scripts", "n_narrowed.mjs"), 'import { fileURLToPath } from "node:url";\nimport { ownCode } from "./own_source.mjs";\nconst assert = (n, c) => c;\nexport function selftest() {\n  return assert("ttl in deal", /ZZ_TTL/.test(ownCode(fileURLToPath(import.meta.url), { fn: "deal" })));\n}\n');
        writeFileSync(join(cd, "scripts", "n_concat.mjs"), H + 'export function selftest() {\n  const SRC = readFileSync(fileURLToPath(import.meta.url), "utf8");\n  const N = (u) => `if (req.url === "/${u}") {`;\n  return assert("door", SRC.includes(N("trans" + "cript")) && SRC.includes("ZZ" + "DOOR"));\n}\n');
        writeFileSync(join(cd, "scripts", "n_sliced.mjs"), H + 'export const door = () => "ZZDOOR";\nexport function selftest() {\n  const SRC = readFileSync(fileURLToPath(import.meta.url), "utf8");\n  return assert("door", /ZZDOOR/.test(SRC.slice(0, SRC.indexOf("function selftest"))));\n}\n');
        writeFileSync(join(cd, "scripts", "n_negative.mjs"), H + 'export function selftest() {\n  return assert("no percent", !/ZZ_PERCENT/.test(readFileSync(fileURLToPath(import.meta.url), "utf8")));\n}\n');
        writeFileSync(join(cd, "scripts", "n_value.mjs"), H + 'export function selftest() {\n  const SRC = readFileSync(fileURLToPath(import.meta.url), "utf8");\n  return assert("count", SRC.match(/ZZ_COUNT/g).length === 1);\n}\n');
        const oc = L.ownLiteralPins({ root: cd });
        const any = [...oc.findings, ...oc.unresolved, ...oc.ownAssert, ...oc.waived].map((x) => `${x.kind}@${x.file}:${x.line}`);
        const needleSite = judged.findings.filter((x) => x.file === "scripts/dugout.mjs" && /trans|cript|N\(/.test(x.pin));
        clause("W5", oc.live && oc.files === 5 && any.length === 0 && needleSite.length === 0,
          `5 clean plants → ${any.length ? `PINS ${any.join(", ")}` : "zero pins of any kind"} · the real tree's concatenated needle as a finding: ${needleSite.length}`);
      }
    }
    if (want("W6")) {
      if (!judged) clause("W6", false, lwhy || "no judge");
      else {
        const fd = join(ROOT, "filter");
        mkdirSync(join(fd, "scripts"), { recursive: true });
        const H = 'import { readFileSync } from "node:fs";\nimport { fileURLToPath } from "node:url";\nconst assert = (n, c) => c;\nexport function selftest() {\n  const selfSrc = readFileSync(fileURLToPath(import.meta.url), "utf8");\n';
        writeFileSync(join(fd, "scripts", "f_kept.mjs"), H + '  const codeOnly = selfSrc.split(/\\r?\\n/).filter((l) => !/^\\s*(\\/\\/|\\*|\\/\\*)/.test(l)).join("\\n");\n  return assert("env used", /ZZ_COVERAGE/.test(codeOnly));\n}\n');
        writeFileSync(join(fd, "scripts", "f_dropped.mjs"), H + '  const kept = selfSrc.split("\\n").filter((l) => !/ZZ_DROP/.test(l)).join("\\n");\n  return assert("dropped", /ZZ_DROP/.test(kept));\n}\n');
        writeFileSync(join(fd, "scripts", "f_other.mjs"), H + '  const codeOnly = selfSrc.split("\\n").filter((l) => !l.trim().startsWith("//")).join("\\n");\n  return assert("env used", /ZZ_COVERAGE/.test(codeOnly));\n}\n');
        const of = L.ownLiteralPins({ root: fd });
        const k = (f) => [...of.findings.map((x) => ["own-literal", x]), ...of.unresolved.map((x) => ["unresolved", x]), ...of.ownAssert.map((x) => ["own-assert", x])].filter(([, x]) => x.file === `scripts/${f}`).map(([kind, x]) => `${kind}:${x.line}`).join(",");
        clause("W6", k("f_kept.mjs") === "own-literal:7" && k("f_dropped.mjs") === "" && k("f_other.mjs") === "unresolved:7",
          `kept line → ${k("f_kept.mjs") || "nothing"} (want own-literal:7) · dropped line → ${k("f_dropped.mjs") || "nothing"} (want nothing) · other predicate → ${k("f_other.mjs") || "nothing"} (want unresolved:7)`);
      }
    }
    if (want(F7)) {
      const cdir = join(ROOT, "ci-only");
      mkdirSync(cdir, { recursive: true });
      if (existsSync(join(ORG, "ci"))) cpSync(join(ORG, "ci"), join(cdir, "ci"), { recursive: true, filter: (s) => !relative(join(ORG, "ci"), s).split(sep).join("/").startsWith("mpinl") });
      const c = run(CENSUS, ["--org", cdir, "--modules", MODS], { cwd: ROOT });
      const last = lines(c.out).filter(Boolean).pop() || "";
      const m = /CENSUS MCON · (\d+) own-literal pin\(s\) in \d+ assert\(s\) · (\d+) own-assert · (\d+) unresolved · (\d+) file\(s\) walked/.exec(last);
      const hits = m ? Number(m[1]) + Number(m[2]) + Number(m[3]) : null;
      const walk = (/· walk (\S+) ·/.exec(rep.census) || [])[1] || null;
      const ok = !c.killed && hits !== null && walk !== null && (hits === 0 ? walk === "scripts+hooks" : walk.split("+").includes("ci"));
      clause(F7, ok, c.killed ? c.why : `census over ci/ (ci/mpinl excluded) → ${m ? `${hits} hit(s) in ${m[4]} file(s)` : `no census line (${last.slice(0, 80)})`} · the law's walk: ${walk || "NOT PRINTED (no own-literal census line)"} · branch: ${hits === 0 ? "zero hits ⇒ the walk stays scripts+hooks" : "one or more ⇒ the walk takes ci"}`);
    }

    // ── A RULE BORN WITH ITS BASELINE (forks row 1316 (1)-(3); spec ci/mpinl/AMENDMENT_1315.md §3, all nine rows) ──
    // A count is BORN at --org when --org's BASELINE holds its key and --base-org's law pack does not count it.
    const findingsOf = (machine) => { const c = {}; for (const mm of String(machine).split("findings:")[1]?.matchAll(/([a-z_-]+) (\d+)/g) || []) c[mm[1]] = Number(mm[2]); return c; };
    const tableIn = (dir) => { const r = run("--input-type=module", ["-e", `const m = await import(${JSON.stringify(pathToFileURL(join(dir, "scripts", "lawpack.mjs")).href)}); console.log(JSON.stringify(m.BASELINE));`], { cwd: dir }); try { return JSON.parse(lines(r.out).filter(Boolean).pop()); } catch { return null; } };
    const needV = ["V0", "V1", "V2", "V3"].some(want), needPG = ["P1a", "P1b", "G3a", "G3b"].some(want);
    let bcopy = null, repB = null, headC = null, baseC = null, BL = null, born = [];
    if (needV || needPG) {
      bcopy = copyOf("base", BASE || ORG);
      repB = lawReport(bcopy);
      headC = rep ? findingsOf(rep.machine) : {};
      baseC = findingsOf(repB.machine);
      BL = tableIn(main);
      born = BL ? Object.keys(headC).filter((k) => !(k in baseC) && k in BL) : [];
    }
    const VERDICT = 'ORGANISM_TEST_VERDICT {"modes":["lawpack"],"pass":1,"fail":0,"exit":0,"ruled":[],"unruled":[],"reds":[],"live":[],"profile":"hermetic"}';
    /** the verdict reader of <dir> on a planted head / base law pack line: { v, fresh } */
    const compare = (dir, h, b, tag) => {
      const hf = join(ROOT, `${tag}.head.txt`), bf = join(ROOT, `${tag}.base.txt`);
      writeFileSync(hf, `${VERDICT}\nORGANISM_TEST_LAWPACK ${JSON.stringify(h)}\n`);
      writeFileSync(bf, `${VERDICT}\nORGANISM_TEST_LAWPACK ${JSON.stringify(b)}\n`);
      const r = run(join(dir, "scripts", "ci_verdict.mjs"), ["compare", "--head", hf, "--base", bf, "--label", "suite"], { cwd: dir });
      const l = lines(r.out).find((x) => /B1_VERDICT \{/.test(x));
      let j = null; try { j = JSON.parse(l.slice(l.indexOf("B1_VERDICT {") + "B1_VERDICT ".length)); } catch { j = null; }
      return { v: j ? j.v : `UNREAD (${r.why || `exit ${r.code}`})`, fresh: j && Array.isArray(j.new) ? j.new : [] };
    };
    if (want("V0")) {
      const atBase = compare(bcopy, headC, baseC, "v0b"), atHead = compare(main, headC, baseC, "v0h");
      const wantNew = born.map((k) => `LAW PACK ROSE · ${k} 0 → ${headC[k]}`);
      clause("V0", born.length > 0 && atBase.v === "RED" && JSON.stringify(atBase.fresh) === JSON.stringify(wantNew) && atHead.v === "GREEN",
        `born at --org: ${born.join(", ") || "none"} · --base-org's reader → ${atBase.v} [${atBase.fresh.join(" | ")}] (the train's red) · --org's reader → ${atHead.v} [${atHead.fresh.join(" | ")}]`);
    }
    if (want("V1")) {
      const k = born[0];
      const at = k ? compare(main, { ...headC, [k]: BL[k] }, baseC, "v1a") : null, up = k ? compare(main, { ...headC, [k]: BL[k] + 1 }, baseC, "v1b") : null;
      clause("V1", !!k && at.v === "GREEN" && up.v === "RED" && up.fresh.includes(`LAW PACK ROSE · ${k} ${BL[k]} → ${BL[k] + 1}`),
        !k ? "no count is born at --org (no BASELINE key the base does not count)" : `born ${k} through compare's own baseline door: at its BASELINE ${BL[k]} → ${at.v} · one above → ${up.v} [${up.fresh.join(" | ")}]`);
    }
    if (want("V2")) {
      const k = born[0];
      let r = null;
      if (k) {
        const c2 = copyOf("v2-raised");
        const f = join(c2, "scripts", "lawpack.mjs");
        writeFileSync(f, readFileSync(f, "utf8").replace(new RegExp(`(\\n  "${k}": )(\\d+),`), (_m, a, n) => `${a}${Number(n) + 6},`));
        r = compare(c2, { ...headC, [k]: BL[k] + 6 }, { ...baseC, [k]: BL[k] }, "v2");
      }
      clause("V2", !!k && r.v === "RED" && r.fresh.includes(`LAW PACK ROSE · ${k} ${BL[k]} → ${BL[k] + 6}`),
        !k ? "no count is born at --org" : `the base counts ${k} ${BL[k]}, the head's BASELINE raised to ${BL[k] + 6} and its count with it → ${r.v} [${r.fresh.join(" | ")}] (a baseline raised later is a rise)`);
    }
    if (want("V3")) {
      const r = compare(main, { ...headC, "zz-unborn-law": 2 }, baseC, "v3");
      clause("V3", r.v === "RED" && r.fresh.includes("LAW PACK ROSE · zz-unborn-law 0 → 2"),
        `a count with NO BASELINE key, at the head only → ${r.v} [${r.fresh.join(" | ")}] (kept guard: nothing is grandfathered)`);
    }
    if (needPG) {
      // --org itself is handed over as `main`, the witness's own copy with node_modules linked (a mutant runner's copy carries none)
      // plant B: --org minus the rule (its two counts and its two BASELINE keys), plus ONE jugad finding so mlaw's JUGAD sees its fall
      const pb = copyOf("plant-b");
      const lf = join(pb, "scripts", "lawpack.mjs");
      writeFileSync(lf, readFileSync(lf, "utf8").replace(/^ {4}"own-[a-z-]+": olp\.[a-zA-Z]+\.length,\n/gm, "").replace(/^ {2}"own-(?:literal-pin|source-pin-unresolved)": \d+,\n/gm, ""));
      writeFileSync(join(pb, "scripts", "zz_mpinl_jugad.mjs"), 'export const ZZ_MPINL_KINDS = ["alpha", "beta"];\n');
      spawnSync("git", ["add", "-A"], { cwd: pb, timeout: BOUND_MS, windowsHide: true });
      const mlaw = (o, tag) => { const r = run(join(ORG, "ci", "mlaw", "witness_mlaw.mjs"), ["--org", o, "--base-org", pb], { cwd: ROOT }); const l = lines(r.out).find((x) => /^(ok|RED)\s+JUGAD\b/.test(x.trim())); return { l: l ? l.trim() : `NO JUGAD LINE (${r.why || `exit ${r.code}`}, ${tag})`, ok: !!l && /^ok\s/.test(l.trim()) }; };
      const mrung = (o, tag) => { const r = run(join(ORG, "ci", "mrung", "witness_mrung.mjs"), ["--org", o, "--base-org", pb, "--only", "G3"], { cwd: ROOT }); const l = lines(r.out).find((x) => /^(GREEN|RED)\s+G3\b/.test(x.trim())); return { l: l ? l.trim() : `NO G3 LINE (${r.why || `exit ${r.code}`}, ${tag})`, ok: !!l && /^GREEN\s/.test(l.trim()) }; };
      const raised = () => { const c = copyOf("plant-raised"); const f = join(c, "scripts", "lawpack.mjs"); writeFileSync(f, readFileSync(f, "utf8").replace(/(\n  "bare-catch": )(\d+),/, (_m, a, n) => `${a}${Number(n) + 1},`)); spawnSync("git", ["add", "-A"], { cwd: c, timeout: BOUND_MS, windowsHide: true }); return c; };
      const onePin = () => { const c = copyOf("plant-pin"); writeFileSync(join(c, "scripts", "zz_mpinl_pin.mjs"), 'import { readFileSync } from "node:fs";\nimport { fileURLToPath } from "node:url";\nconst assert = (n, c) => c;\nexport function selftest() {\n  return assert("x", /ZZ_MPINL/.test(readFileSync(fileURLToPath(import.meta.url), "utf8")));\n}\n'); spawnSync("git", ["add", "-A"], { cwd: c, timeout: BOUND_MS, windowsHide: true }); return c; };
      if (want("P1a")) { const r = mlaw(main, "P1a"); clause("P1a", born.length > 0 && r.ok, `--org over plant B (the rule absent, born here: ${born.join(", ") || "none"}) → mlaw ${r.l.slice(0, 220)}`); }
      if (want("P1b")) { const r = mlaw(raised(), "P1b"); clause("P1b", !r.ok && /^RED\s+JUGAD/.test(r.l), `an EXISTING key's BASELINE raised (bare-catch +1) over plant B → mlaw ${r.l.slice(0, 220)} (kept guard: no baseline raised later)`); }
      if (want("G3a")) { const r = mrung(main, "G3a"); clause("G3a", born.length > 0 && r.ok, `--org over plant B (born here: ${born.join(", ") || "none"}) → mrung ${r.l.slice(0, 200)}`); }
      if (want("G3b")) { const r = mrung(onePin(), "G3b"); clause("G3b", !r.ok && /^RED\s+G3/.test(r.l), `the born count one above its BASELINE (a planted own-literal pin) over plant B → mrung ${r.l.slice(0, 200)} (kept guard)`); }
    }
    if (want("L1")) {
      const r = run(join(main, "scripts", "lawpack.mjs"), ["selftest"], { cwd: main });
      const nl = lines(r.out).find((x) => /NEW LAW — a rule id that is not in the frozen baseline/.test(x)) || "";
      clause("L1", r.code === 0 && /✓/.test(nl), `lawpack selftest exit ${r.code} · ${nl.trim().slice(0, 120) || "NO 'NEW LAW' assert line"} (kept guard: a count with no BASELINE key is RED)`);
    }
  }

  // BOUND — only the named files differ (text hashed with CRLF folded)
  {
    if (!BASE) clause("BOUND", false, "no --base-org");
    else {
      const walkFiles = (root) => {
        const out = new Map();
        const go = (d) => { for (const e of readdirSync(join(root, d), { withFileTypes: true })) {
          const rel = d ? `${d}/${e.name}` : e.name;
          if (rel === ".git" || rel === "node_modules") continue;
          if (e.isDirectory()) go(rel); else if (e.isFile()) out.set(rel, createHash("sha256").update(fold(readFileSync(join(root, rel)))).digest("hex"));
        } };
        go("");
        return out;
      };
      const a = walkFiles(BASE), b = walkFiles(ORG);
      const diff = [...new Set([...a.keys(), ...b.keys()])].filter((f) => a.get(f) !== b.get(f)).sort();
      const named = (f) => NAMED_FILES.has(f) || f.startsWith("ci/mpinl/");
      const beyond = diff.filter((f) => !named(f));
      clause("BOUND", beyond.length === 0, `${diff.length} file(s) differ from --base-org · beyond the named files: ${beyond.length ? beyond.slice(0, 8).join(", ") : "none"}`);
    }
  }
} finally {
  // LAST — no node process naming the temp root survives (listed, killed if found, and RED)
  const procs = () => {
    const r = process.platform === "win32"
      ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", timeout: BOUND_MS, windowsHide: true })
      : spawnSync("ps", ["-eo", "pid=,args="], { encoding: "utf8", timeout: BOUND_MS });
    return lines(r.stdout).map((l) => l.trim()).filter((l) => l.includes(ROOT) && /node/i.test(l) && !l.startsWith(`${process.pid} `));
  };
  const left = procs();
  for (const l of left) { const pid = Number(l.split(/\s+/)[0]); try { process.kill(pid); } catch (e) { console.log(`  (could not kill ${pid}: ${String(e).slice(0, 60)})`); } }
  clause("LAST", left.length === 0, left.length ? `${left.length} node process(es) naming the temp root survived (killed now): ${left.map((l) => l.split(/\s+/)[0]).join(", ")}` : "no node process names the temp root");
  try { rmSync(ROOT, { recursive: true, force: true }); } catch (e) { console.log(`  (temp root not removed: ${String(e).slice(0, 80)})`); }
}
const red = results.filter((r) => !r.ok).map((r) => r.id);
const n = results.length;
if (red.length) { console.log(`RED MPINL · ${red.join(", ")}`); process.exit(1); }
console.log(`GREEN MPINL the own-literal pin class held by a count, its baseline the tree's own read · ${n} clause(s)`);
process.exit(0);
