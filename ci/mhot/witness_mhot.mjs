#!/usr/bin/env node
// ci/mhot/witness_mhot.mjs — THE UNIT WITNESS of unit mhot (forks rows 1172 (3) / 1187). HEADER = CONTRACT.
//
//   node ci/mhot/witness_mhot.mjs --org <build tree> --base-org <base tree> [--bound-base <tree>] [--only <id>[,<id>…]]
//
// THE SPLIT (forks row 1200 (2)-(3), a standing class): the clauses H1-H9 are judged against --base-org, the commit
// ci/mhot/BASE names (red there, green on the build), and BOUND against --bound-base, the PARENT of the land commit — after a
// main-moved rebuild that parent carries paths other units landed. Absent, the bound base is --base-org. BOUND finds the
// unit's two in-file edits by ANCHOR in the bound base (package.json's six keys _selftest_coverage_law … _runner_law;
// audit.mjs's "suite members" block), never by line number, because main moving shifts them. No BASE file is rewritten.
//
// WHAT IT PROVES. A suite member is ONE FILE (suite/members/<organ>.json), so two units that each add or move a member
// never edit one line together; the coverage law, the independent runner and the fast-fail chain all read those files;
// nothing the three && strings held was lost in the move. Every clause H1-H9 is planted BOTH WAYS: it must be RED on
// --base-org and GREEN on --org (a clause GREEN on the base is vacuous and reads RED). BOUND and LAST are guards, judged
// on the build only, and always run (--only never skips them).
//
// HOW IT PLANTS (the laws it keeps):
//   · copies, never the trees it is handed: a plant is a temp dir under ONE os.tmpdir() root holding the tree's own
//     scripts/organism_test.mjs and package.json (read from the tree, never from the working tree), an EMPTY
//     suite/members when the tree has one, and three planted organs: scripts/zz_mhot_a.mjs (selftest prints MHOT_A_RAN,
//     exit 0), zz_mhot_b.mjs (MHOT_B_RED, exit 1), zz_mhot_c.mjs (MHOT_C_RAN, exit 0). A plant has NO dressing-room/ at
//     all: nothing of dressing-room/state is read, copied or written, no credential is copied.
//   · "THE TREE'S OWN DOOR" (H1, H2): a tree with suite/members adds a member by writing its file and moves its LIVE
//     reason by editing that file; a tree without one appends ` && node scripts/<organ>.mjs selftest` to the
//     organism:selftest string and inserts / deletes a line of its LIVE_SELFTESTS table. H3-H5 use the member-file door on
//     both trees: their subject is that a member added BY ITS FILE is covered, run and chained.
//   · every git repo it plants is made with core.autocrlf=false (init and every command); text is split on \r?\n; BOUND
//     hashes text with CRLF folded to LF. Every child is process.execPath / git / npm with argv (npm through npm_execpath
//     when it is set, else `npm`, through cmd only on Windows) — no POSIX-only shell.
//   · THE PORT CLASS (row 1053): no port is bound, no live service named, nothing POSTed, nothing restarted. A planted
//     organ prints and exits. Every child's TMPDIR / TMP / TEMP points under this run's temp root; ARSENAL_*,
//     CLAUDE_CODE_*, ANTHROPIC_API_KEY and ORGANISM_TEST_PROFILE are removed from every child's env.
//   · every wait is bounded by --org's own job timeout-minutes (.github/workflows/suite.yml), read at run time, never typed.
//   · LAST: every child it started is dead at the end, and no node process names the temp root (/proc, or PowerShell).
//
// CLAUSES (spec ci/mhot/MHOT_SPEC.md §6 on claude/mhot-spec 099123f; rulings row 1187 — the ruling wins):
//   H1  DISJOINT ADD    A adds zz_mhot_a, B adds zz_mhot_b, each by the tree's door; `git merge-tree --write-tree A B` exits 0
//   H2  DISJOINT LIVE   both start LIVE; A un-LIVEs a, B un-LIVEs b by the tree's door; the merge is clean
//   H3  COVERAGE        `organism_test.mjs coverage`: a, b, c's files → no orphan; c's file removed → the orphan is exactly zz_mhot_c
//   H4  EVERY MEMBER    `organism_test.mjs suites`: a ok, b FAIL, c ok AFTER b (one red never hides the rest)
//   H5  FAST-FAIL CHAIN `npm run organism:selftest`: MHOT_A_RAN and MHOT_B_RED printed, MHOT_C_RAN not, exit ≠ 0
//   H6  ONE READER      no organ under scripts/ or hooks/ but organism_test.mjs names a suite-name literal or the member
//                       regex in code, and scripts/audit.mjs reads `roll --json`
//   H7  NOTHING LOST    the tree's `roll --json` holds every member of --base-org's three strings in its suite with its argv
//                       (as base's runner ran it) and its LIVE reason byte-equal OR null (un-LIVEd = stricter, never hidden);
//                       a base LIVE reason with no member is in the tree's table, or in the member file a later unit gave it
//   H8  FAILS CLOSED    the tree's instrument over a plant of --base-org's package.json and NO suite/: `suites` and
//                       `chain organism:selftest` both red NAMING "no member directory"; no "suite members pass" ok line
//   H9  LANDED READERS  the tree's own ci/mfac W7 (`--only W7`) and ci/mpool P read the BUILD tree GREEN (re-cut, F6 A);
//                       LIVE_ASSERTS / LIVE_MODES / KNOWN_RED literals each still present once (mf2, mr3, mrf, mrj, ms1 read them)
//   HB     THE SPLIT, planted: this witness as a child over a planted land commit whose parent carries two foreign landed
//          paths reads BOUND green against --bound-base <parent>, RED naming them against the BASE-as-bound, and RED naming
//          exactly the one unit path planted outside the named files
//   BOUND  only the named files differ from --bound-base, package.json only in its six keys, audit.mjs only in its block —
//          judged ONLY when --bound-base is named (row 1307 (1)'s bare form, row 1309 (3)); bare: `CLAUSE BOUND NOT JUDGED`
//   LAST   no node process naming the temp root survives
//
// LAST LINE   GREEN MHOT the member roll · <n> clause(s)   (exit 0)   or   RED MHOT · <clauses>   (exit 1)

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, rmSync, statSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, relative, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null, BASE = arg("--base-org") ? resolve(arg("--base-org")) : null;
const ONLY = arg("--only") ? arg("--only").split(",") : null;
// forks row 1200 (2)-(3), THE STANDING SPLIT: the CLAUSES are judged against --base-org (the ci/mhot/BASE commit: red there,
// green on the build); BOUND is judged against --bound-base, the PARENT of the land commit (after a main-moved rebuild the
// parent carries paths other units landed, which are not this unit's). Absent, the bound base is --base-org (the cut).
const BOUND_BASE = arg("--bound-base") ? resolve(arg("--bound-base")) : BASE;
// forks row 1309 (3) → row 1307 (1)'s BARE FORM: the form the suite's witnesses member runs (--org / --base-org only) never judges
// BOUND against a frozen sha. BOUND is judged only when the caller NAMES the bound base (--bound-base: the adoption re-run, the
// mutant runner); bare, it prints `CLAUSE BOUND NOT JUDGED` on its own line and the verdict line says so.
const BOUND_JUDGED = !!arg("--bound-base");
if (!ORG || !BASE || !existsSync(join(ORG, "package.json")) || !existsSync(join(BASE, "package.json"))) { console.log("RED MHOT · USAGE (--org <dir> --base-org <dir>, each with package.json)"); process.exit(1); }
const T0 = Date.now();
const wf = (() => { try { return readFileSync(join(ORG, ".github", "workflows", "suite.yml"), "utf8"); } catch { return ""; } })();
const jobMin = Number((/timeout-minutes:\s*(\d+)/.exec(wf) || [])[1]);
if (!(jobMin > 0)) { console.log("RED MHOT · BOUNDS (no timeout-minutes in --org's .github/workflows/suite.yml)"); process.exit(1); }
const left = () => Math.max(1, T0 + jobMin * 60000 - Date.now());
const TMP = mkdtempSync(join(tmpdir(), "mhot-wit-"));
const CTMP = join(TMP, "childtmp"); mkdirSync(CTMP);
const children = new Set();
const slash = (p) => p.split(sep).join("/");
const want = (id) => !ONLY || ONLY.includes(id);
const env = () => {
  const e = { ...process.env, TMPDIR: CTMP, TMP: CTMP, TEMP: CTMP };
  for (const k of Object.keys(e)) if (/^ARSENAL_|^CLAUDE_CODE_/.test(k) || k === "ANTHROPIC_API_KEY" || k === "ORGANISM_TEST_PROFILE") delete e[k];
  return e;
};
/** @returns {{ code: number|null, out: string, stdout: string }} */
const sh = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { encoding: "utf8", windowsHide: true, timeout: left(), maxBuffer: 1 << 26, env: env(), ...opts });
  if (r.pid) children.add(r.pid);
  return { code: r.status, out: String(r.stdout || "") + String(r.stderr || ""), stdout: String(r.stdout || "") };
};
const lines = (s) => String(s).split(/\r?\n/);
const rd = (p) => { try { return readFileSync(p, "utf8"); } catch { return null; } };
const isRoll = (tree) => existsSync(join(tree, "suite", "members"));

// ── the plant ────────────────────────────────────────────────────────────────────────────────────────────────────────
let nPlant = 0;
/** @param {string} tree @param {string} label @param {{ pkgFrom?: string, members?: boolean }} [o] */
function plant(tree, label, o = {}) {
  const d = join(TMP, `${label}-${++nPlant}`);
  mkdirSync(join(d, "scripts"), { recursive: true });
  copyFileSync(join(tree, "scripts", "organism_test.mjs"), join(d, "scripts", "organism_test.mjs"));
  copyFileSync(join(o.pkgFrom || tree, "package.json"), join(d, "package.json"));
  if (o.members !== false && isRoll(tree)) mkdirSync(join(d, "suite", "members"), { recursive: true });
  return d;
}
const TAGS = { zz_mhot_a: ["MHOT_A_RAN", 0], zz_mhot_b: ["MHOT_B_RED", 1], zz_mhot_c: ["MHOT_C_RAN", 0] };
function organ(d, name) {
  const [tag, code] = TAGS[name];
  writeFileSync(join(d, "scripts", `${name}.mjs`), `#!/usr/bin/env node\n// planted by ci/mhot/witness_mhot.mjs — prints and exits, nothing else\nif (process.argv[2] === "selftest" || process.argv.length === 2) { console.log("${tag}"); process.exit(${code}); }\nconsole.log("usage: selftest");\n`);
}
// the member-file door
const fileAdd = (d, name, live = null) => { mkdirSync(join(d, "suite", "members"), { recursive: true }); writeFileSync(join(d, "suite", "members", `${name}.json`), JSON.stringify({ suite: "organism:selftest", argv: ["selftest"], live }) + "\n"); };
// the string door
function stringAdd(d, name) {
  const p = join(d, "package.json"); const ls = readFileSync(p, "utf8").split("\n");
  const i = ls.findIndex((l) => /^\s*"organism:selftest":\s*"/.test(l));
  const m = i >= 0 ? /^(\s*"organism:selftest":\s*)("(?:[^"\\]|\\.)*")(,?\s*)$/.exec(ls[i]) : null;
  if (!m) throw new Error("no organism:selftest line");
  ls[i] = m[1] + JSON.stringify(JSON.parse(m[2]) + ` && node scripts/${name}.mjs selftest`) + m[3];
  writeFileSync(p, ls.join("\n"));
}
function tableAdd(d, name, why) {
  const p = join(d, "scripts", "organism_test.mjs"); const s = readFileSync(p, "utf8");
  const a = s.indexOf("const LIVE_SELFTESTS = Object.freeze({"); const b = a < 0 ? -1 : s.indexOf("});", a);
  if (b < 0) throw new Error("no LIVE_SELFTESTS table");
  writeFileSync(p, s.slice(0, b) + `  ${JSON.stringify(name)}: ${JSON.stringify(why)},\n` + s.slice(b));
}
function tableDel(d, name) {
  const p = join(d, "scripts", "organism_test.mjs"); const s = readFileSync(p, "utf8");
  writeFileSync(p, s.split("\n").filter((l) => !l.startsWith(`  ${JSON.stringify(name)}: `)).join("\n"));
}
const addMember = (d, tree, name) => (isRoll(tree) ? fileAdd(d, name) : stringAdd(d, name));
const addLiveMember = (d, tree, name) => (isRoll(tree) ? fileAdd(d, name, "planted LIVE (H2)") : (stringAdd(d, name), tableAdd(d, name, "planted LIVE (H2)")));
const unLive = (d, tree, name) => (isRoll(tree) ? fileAdd(d, name, null) : tableDel(d, name));

// ── git, always core.autocrlf=false ──────────────────────────────────────────────────────────────────────────────────
const g = (d, ...a) => sh("git", ["-C", d, "-c", "core.autocrlf=false", "-c", "user.name=mhot-witness", "-c", "user.email=witness@invalid", "-c", "commit.gpgsign=false", ...a]);
/** base commit, then branch A and branch B each from it; returns the merge-tree result */
function forked(d, setup, onA, onB) {
  const i = sh("git", ["-c", "core.autocrlf=false", "init", "-q", d]); if (i.code !== 0) return { code: -1, out: i.out };
  g(d, "config", "core.autocrlf", "false");
  setup(); g(d, "add", "-A"); g(d, "commit", "-q", "-m", "base");
  const base = g(d, "rev-parse", "HEAD").stdout.trim();
  g(d, "checkout", "-q", "-b", "A", base); onA(); g(d, "add", "-A"); g(d, "commit", "-q", "-m", "A");
  g(d, "checkout", "-q", "-b", "B", base); onB(); g(d, "add", "-A"); g(d, "commit", "-q", "-m", "B");
  return g(d, "merge-tree", "--write-tree", "A", "B");
}
const node = (d, args) => sh(process.execPath, [join(d, "scripts", "organism_test.mjs"), ...args], { cwd: d });
const assertLine = (out, name) => { const ls = lines(out); const i = ls.findIndex((l) => l.includes(name) && /^\s*(ok|FAIL)\s/.test(l)); return i < 0 ? null : { ok: /^\s*ok\s/.test(ls[i]), detail: /^\s*FAIL\s/.test(ls[i]) && ls[i + 1] && /^\s{6,}\S/.test(ls[i + 1]) ? ls[i + 1].trim() : "", at: i }; };
const ORPHAN = "EVERY organ with a selftest is wired into a suite";

// ── the clauses: (tree) → { ok, why } ────────────────────────────────────────────────────────────────────────────────
const CLAUSES = [
  ["H1", "DISJOINT ADD — two units each add a member by the tree's door, and the merge is clean", (T) => {
    const d = plant(T, "h1");
    const r = forked(d, () => {}, () => { organ(d, "zz_mhot_a"); addMember(d, T, "zz_mhot_a"); }, () => { organ(d, "zz_mhot_b"); addMember(d, T, "zz_mhot_b"); });
    return { ok: r.code === 0, why: `merge-tree exit ${r.code}${r.code ? ` · ${lines(r.out).filter((l) => /CONFLICT/.test(l)).join(" | ").slice(0, 200)}` : ""}` };
  }],
  ["H2", "DISJOINT LIVE — two units each move one member's LIVE reason by the tree's door, and the merge is clean", (T) => {
    const d = plant(T, "h2");
    const r = forked(d, () => { for (const n of ["zz_mhot_a", "zz_mhot_b"]) { organ(d, n); addLiveMember(d, T, n); } }, () => unLive(d, T, "zz_mhot_a"), () => unLive(d, T, "zz_mhot_b"));
    return { ok: r.code === 0, why: `merge-tree exit ${r.code}${r.code ? ` · ${lines(r.out).filter((l) => /CONFLICT/.test(l)).join(" | ").slice(0, 200)}` : ""}` };
  }],
  ["H3", "COVERAGE READS EVERY MEMBER FILE — no orphan with three files; the one removed is the one named", (T) => {
    const d = plant(T, "h3");
    for (const n of Object.keys(TAGS)) { organ(d, n); fileAdd(d, n); }
    const a = assertLine(node(d, ["coverage"]).out, ORPHAN);
    unlinkSync(join(d, "suite", "members", "zz_mhot_c.json"));
    const b = assertLine(node(d, ["coverage"]).out, ORPHAN);
    return { ok: !!a && a.ok && !!b && !b.ok && b.detail === "orphaned: zz_mhot_c", why: `three files: ${a ? (a.ok ? "ok" : `FAIL ${a.detail}`) : "no line"} · c removed: ${b ? (b.ok ? "ok" : `FAIL ${b.detail}`) : "no line"}` };
  }],
  ["H4", "EVERY MEMBER RUN INDEPENDENTLY — a ok, b FAIL, c ok and run AFTER b's red", (T) => {
    const d = plant(T, "h4");
    for (const n of Object.keys(TAGS)) { organ(d, n); fileAdd(d, n); }
    const out = node(d, ["suites"]).out;
    const [a, b, c] = Object.keys(TAGS).map((n) => assertLine(out, `SUITE MEMBER · ${n} selftest exits 0`));
    return { ok: !!a && a.ok && !!b && !b.ok && !!c && c.ok && c.at > b.at, why: ["a", "b", "c"].map((k, i) => `${k} ${[a, b, c][i] ? ([a, b, c][i].ok ? "ok" : "FAIL") : "unrun"}`).join(" · ") };
  }],
  ["H5", "THE CHAIN FAST-FAILS — `npm run organism:selftest` runs a, stops at b's red, never reaches c", (T) => {
    const d = plant(T, "h5");
    for (const n of Object.keys(TAGS)) { organ(d, n); fileAdd(d, n); }
    const ep = process.env.npm_execpath;
    const r = ep && /\.(c?js|mjs)$/.test(ep) && existsSync(ep) ? sh(process.execPath, [ep, "run", "organism:selftest"], { cwd: d }) : sh("npm", ["run", "organism:selftest"], { cwd: d, shell: process.platform === "win32" });
    const A = /MHOT_A_RAN/.test(r.out), B = /MHOT_B_RED/.test(r.out), C = /MHOT_C_RAN/.test(r.out);
    return { ok: A && B && !C && r.code !== 0 && r.code !== null, why: `A ${A ? "ran" : "never ran"} · B ${B ? "red" : "never ran"} · C ${C ? "RAN" : "not reached"} · exit ${r.code}` };
  }],
  ["H6", "ONE READER — no organ but organism_test.mjs keeps the suite names or the member regex; audit.mjs reads roll --json", (T) => {
    const hits = [];
    const walk = (dir) => { for (const f of existsSync(dir) ? readdirSync(dir) : []) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else if (f.endsWith(".mjs")) {
      const rel = slash(relative(T, p)); if (rel === "scripts/organism_test.mjs") continue;
      lines(readFileSync(p, "utf8")).forEach((l, i) => { const t = l.trim(); if (/^(\/\/|\*|\/\*)/.test(t)) return;
        if (/["'`](organism|squad|audit):selftest["'`]/.test(l) || l.includes("scripts\\/([A-Za-z0-9_\\-]+)\\.mjs")) hits.push(`${rel}:${i + 1}`); });
    } } };
    walk(join(T, "scripts")); walk(join(T, "hooks"));
    const audit = rd(join(T, "scripts", "audit.mjs")) || "";
    const reads = /"roll", "--json"/.test(audit);
    return { ok: hits.length === 0 && reads, why: `${hits.length} copy site(s)${hits.length ? `: ${hits.join(", ")}` : ""} · audit.mjs reads roll --json: ${reads ? "yes" : "no"}` };
  }],
  ["H7", "NOTHING LOST IN THE MOVE — every base member in its suite, its argv, its LIVE reason byte-equal", (T) => {
    const bp = JSON.parse(readFileSync(join(BASE, "package.json"), "utf8"));
    const bo = readFileSync(join(BASE, "scripts", "organism_test.mjs"), "utf8");
    const tb = bo.slice(bo.indexOf("const LIVE_SELFTESTS = Object.freeze({"), bo.indexOf("});", bo.indexOf("const LIVE_SELFTESTS = Object.freeze({")));
    /** @type {Record<string,string>} */ const live = {};
    for (const m of tb.matchAll(/^ {2}"([^"]+)": ("(?:[^"\\]|\\.)*"),\r?$/gm)) live[m[1]] = JSON.parse(m[2]);
    const bare = new Set([...bo.matchAll(/m === "([A-Za-z0-9_-]+)" \? \[file\]/g)].map((m) => m[1]));   // base's runner: the bare-argv organs
    // the three suites, as base's own instrument names them (its SUITE_NAMES line), never typed here
    const suitesOf = [...((/const SUITE_NAMES = \[([^\]]*)\]/.exec(bo) || [])[1] || "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    const r = sh(process.execPath, [join(T, "scripts", "organism_test.mjs"), "roll", "--json"], { cwd: T });
    let roll = null; try { roll = JSON.parse(r.stdout); } catch { roll = null; }
    if (r.code !== 0 || !roll || !Array.isArray(roll.members)) return { ok: false, why: `roll --json exit ${r.code} · ${roll ? "no members" : "no JSON"}` };
    const by = new Map(roll.members.map((m) => [m.organ, m]));
    // RE-CUT at the merge of main cebe3eb (forks rows 1201 / 1200 (2)), an ADDED edit holding the same property: ~~every LIVE
    // reason byte-equal~~ → nothing HIDDEN and nothing LOST: a member's reason is base's byte-equal, OR null — a later unit that
    // made a member run in the hermetic profile (mlaw's lawpack) made the net stricter, never looser. A reason that changed text,
    // or a member that became LIVE, is still a red. A base reason with no member (home_pin) is found byte-equal in the table OR
    // in the member file a later unit gave it (mcov), or is null there (stricter).
    const lost = [], moved = [], unlived = [];
    const seen = new Set();
    for (const s of suitesOf) for (const m of String(bp.scripts[s]).matchAll(/scripts\/([A-Za-z0-9_\-]+)\.mjs/g)) {
      const o = m[1]; seen.add(o); const x = by.get(o);
      if (!x) { lost.push(o); continue; }
      const argv = bare.has(o) ? [] : ["selftest"];
      const want = Object.prototype.hasOwnProperty.call(live, o) ? live[o] : null;
      if (x.suite !== s || JSON.stringify(x.argv) !== JSON.stringify(argv) || (x.live !== want && x.live !== null)) moved.push(o);
      else if (x.live !== want) unlived.push(o);
    }
    const to = readFileSync(join(T, "scripts", "organism_test.mjs"), "utf8");
    const tt = to.slice(to.indexOf("const LIVE_SELFTESTS = Object.freeze({"), to.indexOf("});", to.indexOf("const LIVE_SELFTESTS = Object.freeze({")));
    const strayLost = Object.keys(live).filter((k) => !seen.has(k) && !tt.includes(`  ${JSON.stringify(k)}: ${JSON.stringify(live[k])},`)
      && !(by.has(k) && (by.get(k).live === live[k] || by.get(k).live === null)));
    return { ok: seen.size > 0 && !lost.length && !moved.length && !strayLost.length, why: `${seen.size} base member(s) · lost ${lost.length}${lost.length ? ` (${lost.slice(0, 5).join(", ")})` : ""} · changed ${moved.length}${moved.length ? ` (${moved.slice(0, 5).join(", ")})` : ""} · un-LIVEd since (stricter) ${unlived.length}${unlived.length ? ` (${unlived.join(", ")})` : ""} · non-member LIVE reasons lost ${strayLost.length}` };
  }],
  ["H8", "FAILS CLOSED ON AN OLD TREE — the tree's instrument over base's package.json and no suite/ reds by name", (T) => {
    const d = plant(T, "h8", { pkgFrom: BASE, members: false });
    const s = node(d, ["suites"]), c = node(d, ["chain", "organism:selftest"]);
    const named = (o) => /no member directory/.test(o);
    const vacuous = lines(s.out).some((l) => /^\s*ok\s+all \d+ .*suite members pass/.test(l));
    return { ok: named(s.out) && s.code !== 0 && named(c.out) && c.code !== 0 && c.code !== null && !vacuous, why: `suites exit ${s.code} ${named(s.out) ? "names" : "does NOT name"} the missing directory${vacuous ? " · and an ok 'suite members pass' line" : ""} · chain exit ${c.code} ${named(c.out) ? "names" : "does NOT name"} it` };
  }],
  ["H9", "LANDED READERS HOLD — the tree's own mfac W7 and mpool P read the build GREEN; the literals mf2/mr3/mrf/mrj/ms1 read stand", (T) => {
    const mf = existsSync(join(T, "ci", "mfac", "witness_mfac.mjs")) ? sh(process.execPath, [join(T, "ci", "mfac", "witness_mfac.mjs"), "--org", ORG, "--base-org", BASE, "--only", "W7"], { cwd: TMP }) : null;
    const w7 = !!mf && lines(mf.out).some((l) => /^\s*GREEN W7 ·/.test(l));
    const mp = existsSync(join(T, "ci", "mpool", "witness_mpool.mjs")) ? sh(process.execPath, [join(T, "ci", "mpool", "witness_mpool.mjs"), "--org", ORG, "--base-org", pBase()], { cwd: TMP }) : null;
    const p = !!mp && lines(mp.out).some((l) => /^\s*ok\s+P · build GREEN · base RED/.test(l));
    const ot = rd(join(T, "scripts", "organism_test.mjs")) || "";
    const once = (lit) => ot.split(lit).length === 2;
    const lits = once("const LIVE_ASSERTS = Object.freeze({") && once("const LIVE_MODES = Object.freeze({") && once("const KNOWN_RED = [");
    return { ok: w7 && p && lits, why: `mfac W7 ${w7 ? "GREEN" : "RED"} · mpool P ${p ? "GREEN (base RED)" : "not GREEN"} · reader literals ${lits ? "stand" : "MOVED"}` };
  }],
];
// mpool P's own "before" tree: the build's scripts, package.json, runner skill, settings and member files, usage_tap removed
let PB = null;
function pBase() {
  if (PB) return PB;
  PB = join(TMP, "pbase");
  mkdirSync(join(PB, "scripts"), { recursive: true });
  for (const f of readdirSync(join(ORG, "scripts"))) if (f.endsWith(".mjs") && f !== "usage_tap.mjs") copyFileSync(join(ORG, "scripts", f), join(PB, "scripts", f));
  copyFileSync(join(ORG, "package.json"), join(PB, "package.json"));
  for (const rel of [[".claude", "skills", "runner", "SKILL.md"], [".claude", "settings.json"]]) if (existsSync(join(ORG, ...rel))) { mkdirSync(join(PB, ...rel.slice(0, -1)), { recursive: true }); copyFileSync(join(ORG, ...rel), join(PB, ...rel)); }
  if (isRoll(ORG)) { mkdirSync(join(PB, "suite", "members"), { recursive: true }); for (const f of readdirSync(join(ORG, "suite", "members"))) if (f !== "usage_tap.json") copyFileSync(join(ORG, "suite", "members", f), join(PB, "suite", "members", f)); }
  return PB;
}

// ── BOUND: only the named files differ ───────────────────────────────────────────────────────────────────────────────
const NAMED = (rel) => /^suite\/members\/[^/]+\.json$/.test(rel) || ["scripts/organism_test.mjs", "package.json", "scripts/audit.mjs", "ci/mfac/witness_mfac.mjs", "ci/mpool/witness_mpool.mjs",
  "ci/mlaw/witness_mlaw.mjs" /* forks row 1204: COVERAGE and HERMETIC re-cut by this unit (MHOT-M3 option A) */,
  "ci/mcov/witness_mcov.mjs", "ci/mprk/witness_mprk.mjs", "ci/mdtl2/witness_mdtl2.mjs" /* forks row 1309 (1): MHOT-M2 = A */,
  "ci/mpinr/witness_mpinr.mjs" /* forks row 1332 (2): MHOT-M5 = A, clause SUITE */].includes(rel)
  || /^ci\/mhot\/(witness_mhot\.mjs|run_mutants_mhot\.mjs|BASE|PROOF\.md|LEDGER\.jsonl)$/.test(rel);
function hashes(tree) {
  const m = new Map();
  const walk = (dir) => { for (const f of readdirSync(dir)) { const p = join(dir, f); const rel = slash(relative(tree, p)); if (rel === ".git" || rel === "node_modules" || rel.endsWith("/node_modules")) continue;
    const st = statSync(p); if (st.isDirectory()) walk(p); else m.set(rel, createHash("sha256").update(readFileSync(p).toString("latin1").replace(/\r\n/g, "\n")).digest("hex")); } };
  walk(tree); return m;
}
/** the changed region of b against a, as [first, endA) in a's lines (common prefix / suffix), or null when equal */
const region = (a, b) => { let p = 0; while (p < a.length && p < b.length && a[p] === b[p]) p++; if (p === a.length && p === b.length) return null;
  let q = 0; while (q < a.length - p && q < b.length - p && a[a.length - 1 - q] === b[b.length - 1 - q]) q++; return [p, a.length - q]; };
// the unit's two in-file regions, found by ANCHOR in the bound base (its line numbers move once main moves): package.json's
// six keys _selftest_coverage_law … _runner_law (lines 17-22 at 5759cce) and audit.mjs's "suite members" derive (582-587)
const pkgSpan = (a) => { const i = a.findIndex((l) => /^\s*"_selftest_coverage_law":/.test(l)), j = a.findIndex((l) => /^\s*"_runner_law":/.test(l)); return i >= 0 && j >= i ? [i, j + 1] : null; };
const audSpan = (a) => { const i = a.findIndex((l) => /^\s*"suite members": \(\) => \{/.test(l)); if (i < 0) return null; const j = a.findIndex((l, k) => k > i && /^ {4}\},\s*$/.test(l)); return j > i ? [i, j + 1] : null; };
const inside = (r, span) => r === null || (!!span && r[0] >= span[0] && r[1] <= span[1]);
/** @param {string} from the bound base (the land commit's parent) @param {string} to the build */
function bound(from = BOUND_BASE, to = ORG) {
  const a = hashes(from), b = hashes(to);
  const differ = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort();
  const beyond = differ.filter((k) => !NAMED(k));
  const L = (t, rel) => lines(rd(join(t, rel)) || "");
  const pa = L(from, "package.json"), pkgOk = inside(region(pa, L(to, "package.json")), pkgSpan(pa));
  const aa = L(from, "scripts/audit.mjs"), audOk = inside(region(aa, L(to, "scripts/audit.mjs")), audSpan(aa));
  return { ok: !beyond.length && pkgOk && audOk, beyond, why: `against ${from === BASE ? "the BASE tree" : "the bound base (the land commit's parent)"} · ${differ.length} file(s) differ · beyond the named: ${beyond.length ? beyond.slice(0, 8).join(", ") : "none"} · package.json only its six law/suite keys: ${pkgOk ? "yes" : "NO"} · audit.mjs only its suite-members block: ${audOk ? "yes" : "NO"}` };
}
// ── HB · THE SPLIT, PLANTED (row 1200 (2)-(3)) — this witness run as a child over three planted trees ────────────────
// P (a land commit's parent) = the BASE's package.json, audit.mjs and suite.yml PLUS two paths another unit landed; L (the
// rebuilt land commit) = P plus this unit's own edits (the build's package.json and audit.mjs, one member file); L2 = L plus
// one unit path outside the named files. GREEN iff: L against --bound-base P reads BOUND green; L against BASE-as-bound
// (no --bound-base: P without the foreign paths) reads them as foreign, RED; L2 against P reads RED naming only that path.
function hb() {
  const mk = (name) => { const d = join(TMP, `hb-${name}`); mkdirSync(join(d, "scripts"), { recursive: true }); mkdirSync(join(d, ".github", "workflows"), { recursive: true }); return d; };
  const put = (d, rel, txt) => { mkdirSync(join(d, ...rel.split("/").slice(0, -1)), { recursive: true }); writeFileSync(join(d, ...rel.split("/")), txt); };
  const seed = (d) => { copyFileSync(join(BASE, "package.json"), join(d, "package.json")); copyFileSync(join(BASE, "scripts", "audit.mjs"), join(d, "scripts", "audit.mjs")); put(d, ".github/workflows/suite.yml", wf); };
  const Bp = mk("base"), P = mk("parent"), Lt = mk("land"), L2 = mk("land2");
  seed(Bp);
  for (const d of [P, Lt, L2]) { seed(d); put(d, "scripts/zz_landed_elsewhere.mjs", "// another unit's landed organ (planted)\n"); put(d, "ci/zz_other/witness_zz_other.mjs", "// another unit's landed witness (planted)\n"); }
  for (const d of [Lt, L2]) { copyFileSync(join(ORG, "package.json"), join(d, "package.json")); copyFileSync(join(ORG, "scripts", "audit.mjs"), join(d, "scripts", "audit.mjs")); put(d, "suite/members/zz_mhot_a.json", JSON.stringify({ suite: "organism:selftest", argv: ["selftest"], live: null }) + "\n"); }
  put(L2, "scripts/zz_outside_named.mjs", "// a unit path outside its named files (planted)\n");
  const me = join(HERE, "witness_mhot.mjs");
  const last = (r) => lines(r.out).map((x) => x.trim()).filter(Boolean).pop() || "";
  const bline = (r) => (lines(r.out).find((l) => /^\s*(ok|FAIL)\s+BOUND ·/.test(l)) || "").trim();
  const go = (org, extra) => sh(process.execPath, [me, "--org", org, "--base-org", Bp, ...extra, "--only", "HB-NONE"], { cwd: TMP });
  const a = go(Lt, ["--bound-base", P]), b = go(Lt, ["--bound-base", Bp]), c = go(L2, ["--bound-base", P]);
  const ok = a.code === 0 && /^GREEN MHOT /.test(last(a))
    && b.code === 1 && last(b) === "RED MHOT · BOUND" && /zz_landed_elsewhere\.mjs/.test(bline(b)) && /witness_zz_other\.mjs/.test(bline(b))
    && c.code === 1 && last(c) === "RED MHOT · BOUND" && /beyond the named: scripts\/zz_outside_named\.mjs ·/.test(bline(c));
  return { ok, why: `land vs parent: ${last(a)} · land vs BASE: ${last(b)} (${/zz_landed_elsewhere/.test(bline(b)) ? "the foreign paths named" : "foreign paths NOT named"}) · land+outside vs parent: ${last(c)}${/zz_outside_named/.test(bline(c)) ? " (names the outside path)" : ""}` };
}

// ── run ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
const bad = [];
let survivors = [];
console.log(`witness mhot · org ${ORG} · base ${BASE} (clauses) · bound base ${BOUND_BASE === BASE ? "= base" : BOUND_BASE} (BOUND) · bound ${jobMin} min (suite.yml timeout-minutes) · tmp ${TMP}`);
try {
  for (const [id, name, fn] of CLAUSES) {
    if (!want(id)) continue;
    let gr, br;
    try { gr = fn(ORG); } catch (e) { gr = { ok: false, why: `threw: ${String(e instanceof Error ? e.message : e)}` }; }
    try { br = fn(BASE); } catch (e) { br = { ok: false, why: `threw: ${String(e instanceof Error ? e.message : e)}` }; }
    const ok = gr.ok && !br.ok;
    if (!ok) bad.push(id);
    console.log(`  ${ok ? "ok  " : "FAIL"} ${id} · build ${gr.ok ? "GREEN" : "RED"} · base ${br.ok ? "GREEN (vacuous)" : "RED"} · ${name}\n         build: ${gr.why}\n         base:  ${br.why}`);
  }
  if (want("HB")) {
    let h; try { h = hb(); } catch (e) { h = { ok: false, why: `threw: ${String(e instanceof Error ? e.message : e)}` }; }
    if (!h.ok) bad.push("HB");
    console.log(`  ${h.ok ? "ok  " : "FAIL"} HB · THE BOUND SPLIT (row 1200 (2)-(3)), planted · ${h.why}`);
  }
  if (BOUND_JUDGED) {
    const b = bound();
    if (!b.ok) bad.push("BOUND");
    console.log(`  ${b.ok ? "ok  " : "FAIL"} BOUND · ${b.why}`);
  } else console.log("CLAUSE BOUND NOT JUDGED · no --bound-base named: the bare form never judges BOUND against a frozen sha (row 1307 (1), row 1309 (3))");
} finally {
  // ── LAST ──
  for (const pid of children) { try { process.kill(pid, 0); survivors.push(pid); try { process.kill(pid); } catch { /* gone */ } } catch { /* dead — good */ } }
  const naming = () => {
    if (process.platform === "win32") {
      const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true, timeout: left() });
      return lines(r.stdout).filter((l) => l.toLowerCase().includes(TMP.toLowerCase())).map((l) => Number(l.trim().split(" ")[0])).filter((p) => p && p !== process.pid);
    }
    const out = [];
    for (const p of existsSync("/proc") ? readdirSync("/proc") : []) {
      if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
      try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(TMP)) out.push(Number(p)); } catch { /* raced */ }
    }
    return out;
  };
  for (const p of naming()) { survivors.push(p); try { process.kill(p); } catch { /* gone */ } }
  try { rmSync(TMP, { recursive: true, force: true }); } catch { /* best effort */ }
}
console.log(`  ${survivors.length ? "FAIL" : "ok  "} LAST · no node process naming the temp root survives${survivors.length ? ` (${survivors.join(", ")})` : ""}`);
if (survivors.length) bad.push("LAST");
if (bad.length) { console.log(`RED MHOT · ${bad.join(", ")}`); process.exit(1); }
console.log(`GREEN MHOT the member roll · ${CLAUSES.filter(([id]) => want(id)).length + (want("HB") ? 1 : 0) + (BOUND_JUDGED ? 2 : 1)} clause(s)${BOUND_JUDGED ? "" : " · BOUND NOT JUDGED"}`);
process.exit(0);
