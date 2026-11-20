#!/usr/bin/env node
// ci/mhot/witness_mhot.mjs — THE UNIT WITNESS of unit mhot (forks rows 1172 (3) / 1187). HEADER = CONTRACT.
//
//   node ci/mhot/witness_mhot.mjs --org <build tree> --base-org <base tree> [--only <id>[,<id>…]]
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
//                       (as base's runner ran it) and its LIVE reason byte-equal; a base LIVE reason with no member is still
//                       in the tree's LIVE_SELFTESTS table, byte-equal
//   H8  FAILS CLOSED    the tree's instrument over a plant of --base-org's package.json and NO suite/: `suites` and
//                       `chain organism:selftest` both red NAMING "no member directory"; no "suite members pass" ok line
//   H9  LANDED READERS  the tree's own ci/mfac W7 (`--only W7`) and ci/mpool P read the BUILD tree GREEN (re-cut, F6 A);
//                       LIVE_ASSERTS / LIVE_MODES / KNOWN_RED literals each still present once (mf2, mr3, mrf, mrj, ms1 read them)
//   BOUND  only the named files differ from --base-org, package.json only at lines 17-22, audit.mjs only at 582-587
//   LAST   no node process naming the temp root survives
//
// LAST LINE   GREEN MHOT the member roll · <n> clause(s)   (exit 0)   or   RED MHOT · <clauses>   (exit 1)

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, rmSync, statSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, relative, sep } from "node:path";
import { createHash } from "node:crypto";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null, BASE = arg("--base-org") ? resolve(arg("--base-org")) : null;
const ONLY = arg("--only") ? arg("--only").split(",") : null;
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
    const lost = [], moved = [];
    const seen = new Set();
    for (const s of suitesOf) for (const m of String(bp.scripts[s]).matchAll(/scripts\/([A-Za-z0-9_\-]+)\.mjs/g)) {
      const o = m[1]; seen.add(o); const x = by.get(o);
      if (!x) { lost.push(o); continue; }
      const argv = bare.has(o) ? [] : ["selftest"];
      if (x.suite !== s || JSON.stringify(x.argv) !== JSON.stringify(argv) || x.live !== (Object.prototype.hasOwnProperty.call(live, o) ? live[o] : null)) moved.push(o);
    }
    const to = readFileSync(join(T, "scripts", "organism_test.mjs"), "utf8");
    const tt = to.slice(to.indexOf("const LIVE_SELFTESTS = Object.freeze({"), to.indexOf("});", to.indexOf("const LIVE_SELFTESTS = Object.freeze({")));
    const strayLost = Object.keys(live).filter((k) => !seen.has(k) && !tt.includes(`  ${JSON.stringify(k)}: ${JSON.stringify(live[k])},`));
    return { ok: seen.size > 0 && !lost.length && !moved.length && !strayLost.length, why: `${seen.size} base member(s) · lost ${lost.length}${lost.length ? ` (${lost.slice(0, 5).join(", ")})` : ""} · changed ${moved.length}${moved.length ? ` (${moved.slice(0, 5).join(", ")})` : ""} · non-member LIVE reasons lost ${strayLost.length}` };
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
const NAMED = (rel) => /^suite\/members\/[^/]+\.json$/.test(rel) || ["scripts/organism_test.mjs", "package.json", "scripts/audit.mjs", "ci/mfac/witness_mfac.mjs", "ci/mpool/witness_mpool.mjs"].includes(rel)
  || /^ci\/mhot\/(witness_mhot\.mjs|run_mutants_mhot\.mjs|BASE|PROOF\.md|LEDGER\.jsonl)$/.test(rel);
function hashes(tree) {
  const m = new Map();
  const walk = (dir) => { for (const f of readdirSync(dir)) { const p = join(dir, f); const rel = slash(relative(tree, p)); if (rel === ".git" || rel === "node_modules" || rel.endsWith("/node_modules")) continue;
    const st = statSync(p); if (st.isDirectory()) walk(p); else m.set(rel, createHash("sha256").update(readFileSync(p).toString("latin1").replace(/\r\n/g, "\n")).digest("hex")); } };
  walk(tree); return m;
}
function bound() {
  const a = hashes(BASE), b = hashes(ORG);
  const differ = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort();
  const beyond = differ.filter((k) => !NAMED(k));
  const L = (t, rel) => lines(rd(join(t, rel)) || "");
  const pa = L(BASE, "package.json"), pb = L(ORG, "package.json");
  const pkgOk = pa.length === pb.length && pa.every((l, i) => l === pb[i] || (i >= 16 && i <= 21));
  const aa = L(BASE, "scripts/audit.mjs"), ab = L(ORG, "scripts/audit.mjs");
  const tail = aa.length - 587;
  const audOk = aa.slice(0, 581).join("\n") === ab.slice(0, 581).join("\n") && aa.slice(587).join("\n") === ab.slice(ab.length - tail).join("\n");
  return { ok: !beyond.length && pkgOk && audOk, why: `${differ.length} file(s) differ · beyond the named: ${beyond.length ? beyond.slice(0, 8).join(", ") : "none"} · package.json only lines 17-22: ${pkgOk ? "yes" : "NO"} · audit.mjs only lines 582-587: ${audOk ? "yes" : "NO"}` };
}

// ── run ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
const bad = [];
let survivors = [];
console.log(`witness mhot · org ${ORG} · base ${BASE} · bound ${jobMin} min (suite.yml timeout-minutes) · tmp ${TMP}`);
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
  const b = bound();
  if (!b.ok) bad.push("BOUND");
  console.log(`  ${b.ok ? "ok  " : "FAIL"} BOUND · ${b.why}`);
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
console.log(`GREEN MHOT the member roll · ${CLAUSES.filter(([id]) => want(id)).length + 2} clause(s)`);
process.exit(0);
