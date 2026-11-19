#!/usr/bin/env node
// ============================================================================
// ci/witness/mfactory/witness_factory.mjs — UNIT mfactory · B-factory:four-numbers (forks rows 1162 / 1163; spec
//   ci/mwit/MWIT_SPEC.md on claude/mwit-spec @ 88bf69d, §B-factory:four-numbers; UNITS row 9). A ci-only unit: no organ
//   file is edited (row 1162 (4)); the suite file is not edited (row 1162 (2), F11 — unit mmeter's member runs `plants`).
// ----------------------------------------------------------------------------
// USAGE
//   node ci/witness/mfactory/witness_factory.mjs --window <id> --campaign <dir> [--table <file>]
//        THE CLAUSE. Reads the campaign's factory-window table and judges the row of window <id>.
//   node ci/witness/mfactory/witness_factory.mjs plants [--org <dir>] [--base-org <dir>] [--only <clause>[,<clause>…]]
//   node ci/witness/mfactory/witness_factory.mjs --org <dir> --base-org <dir> [--only …]      (the same plants mode)
//        THE PLANTS. Every clause planted both ways: RED on --base-org, GREEN on --org. --org defaults to the tree this
//        file sits in; --base-org defaults to an LF tree of the commit in ci/mfactory/BASE (private index, core.autocrlf
//        false, under os.tmpdir()); a base that cannot be built leaves BOUND RED. --only is the mutant runner's door;
//        BOUND and LAST always run.
// THE CLAUSE'S EXIT LAW (spec §0): 0 the row carries all four numbers · 1 RED, a number is missing / not finite / its
//   source is not its owner's reader · 2 UNREAD, the table or the row is absent or unreadable — NEVER a green.
// THE FOUR NUMBERS (spec §B-factory (a), each with the owner whose reader a row's `source` must name):
//   landings     the LANDED rows of .git/land_ledger.jsonl               owner scripts/land.mjs (record :65, outcome :162)
//   hands        the stops a HUMAN resolved, same ledger (human: true)   owner scripts/land.mjs (HUMAN_STOPS :45, :162)
//   memory_wait  the night's waits on the memory floor (reason memory)   owner scripts/night.mjs (REASONS :59, may :154)
//   test_loads   the laptop's test loads                                 owner NONE in this repo (NAMED N9): any named reader
//   An owner is DERIVED from its own source in the tree this file sits in, never trusted from a list: land.mjs must still
//   declare HUMAN_STOPS and write the LANDED outcome, night.mjs must still list "memory" among its REASONS; an owner that
//   no longer declares its fact makes the clause UNREAD (2), never green.
// THE TABLE (NAMED N9 — the window row's file and writer live in the campaign tree, not here; PROOF FORK MF-1/MF-2):
//   --table <file> wins; else <campaign>/factory_windows.jsonl. JSONL, one row per window, the LAST row of a window wins
//   (an append-only table corrects by appending). Row: { "window": "<id>", "<field>": { "value": <number>, "source":
//   "<reader>" } × 4 }. One unparseable line makes the table UNREAD (2). The clause prints field NAMES, never a value.
// PLANT CLAUSES (each runs on a COPY under os.tmpdir(): the reader file + its two owner organs, nothing of his):
//   P1  four numbers: four finite fields → 0 · three → 1 · a string "n/a" → 1 · a null value → 1 · another window only → 2
//   P2  sources: every source names its owner → 0 · landings sourced to night.mjs → 1 · an empty source → 1
//   P3  unread is never green: no --campaign/--table → 2 · the table absent → 2 · a corrupt line beside a good row → 2
//   P4  owners derived: night.mjs without "memory" in REASONS → 2 · land.mjs without HUMAN_STOPS → 2 · both intact → 0
//   Each P-clause is GREEN iff the --org copy gives every expected exit AND the --base-org copy does not (RED on base: the
//   base carries no reader, so it computes none of them).
//   BOUND only the named files differ from --base-org: ci/witness/mfactory/**, ci/mfactory/**, and the one effort receipt
//         campaign-2026-09/receipts_effort/mfactory_00.json (dressing-room/state, .git, node_modules never walked)
//   LAST  no node process naming the temp root survives (Windows through PowerShell, /proc elsewhere)
// PORT CLASS (row 1053): binds no port, names no live service, POSTs nothing, restarts nothing, reaches no network, calls
//   no model. Every child is spawnSync, so every wait is bounded by the child's own exit; no timeout is typed.
// PORTABLE: no POSIX-only shell; every line read is split on \r?\n; BOUND hashes text with CRLF folded to LF; the one git
//   tree it builds is checked out with core.autocrlf=false, core.eol=lf (row 1036); no git repo is planted.
// LAST LINE: GREEN MFACTORY <what> · <n> clause(s) (exit 0) or RED MFACTORY · <clauses> (exit 1)
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, readdirSync, statSync, cpSync } from "node:fs";
import { join, resolve, relative, dirname, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const TREE = resolve(HERE, "..", "..", "..");
const SELF_REL = "ci/witness/mfactory/witness_factory.mjs";
const UNIT = "MFACTORY";
const TABLE_NAME = "factory_windows.jsonl";   // PROOF FORK MF-1: the campaign's window table, proposed; N9 names the real one
const FIELDS = Object.freeze(["landings", "hands", "memory_wait", "test_loads"]);
const OWNER_OF = Object.freeze({ landings: "scripts/land.mjs", hands: "scripts/land.mjs", memory_wait: "scripts/night.mjs", test_loads: null });
const NAMED = (rel) => rel.startsWith("ci/witness/mfactory/") || rel.startsWith("ci/mfactory/") || rel === "campaign-2026-09/receipts_effort/mfactory_00.json";
const SKIP_TOP = new Set([".git", "node_modules"]);
const slash = (p) => p.split(sep).join("/");
const lines = (s) => String(s || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null; };

// ── THE OWNERS, derived from their own source in <tree> ─────────────────────────────────────────────────────────────
/** @param {string} tree @returns {{ ok: boolean, why: string }} */
function ownersDeclare(tree) {
  const read = (rel) => { try { return readFileSync(join(tree, rel), "utf8"); } catch { return null; } };
  const land = read("scripts/land.mjs"), night = read("scripts/night.mjs");
  if (land === null || night === null) return { ok: false, why: `owner unreadable: ${land === null ? "scripts/land.mjs" : "scripts/night.mjs"}` };
  if (!/\bconst HUMAN_STOPS = new Set\(/.test(land)) return { ok: false, why: "scripts/land.mjs no longer declares HUMAN_STOPS (the hands owner)" };
  if (!/outcome\s*===\s*"LANDED"/.test(land)) return { ok: false, why: "scripts/land.mjs no longer reads a LANDED outcome (the landings owner)" };
  const m = /export const REASONS = Object\.freeze\(\[([^\]]*)\]\)/.exec(night);
  if (!m || !/"memory"/.test(m[1])) return { ok: false, why: "scripts/night.mjs no longer lists \"memory\" among its REASONS (the memory-wait owner)" };
  return { ok: true, why: "owners declare their facts" };
}

// ── THE CLAUSE ───────────────────────────────────────────────────────────────────────────────────────────────────────
/** @returns {{ code: 0|1|2, line: string }} */
function judgeWindow() {
  const win = opt("--window"), campaign = opt("--campaign"), tableArg = opt("--table");
  const out = (code, what) => ({ code, line: `FACTORY ${win || "?"} · ${code === 0 ? "GREEN" : code === 1 ? "RED" : "UNREAD"} · ${what}` });
  if (!win) return out(2, "no --window <id> given");
  if (!tableArg && !campaign) return out(2, "no --campaign <dir>: the factory window table lives in the campaign tree (NAMED N9), never read here");
  const own = ownersDeclare(TREE);
  if (!own.ok) return out(2, own.why);
  const table = resolve(tableArg || join(/** @type {string} */ (campaign), TABLE_NAME));
  let text;
  try { text = readFileSync(table, "utf8"); } catch { return out(2, `the window table is absent or unreadable (${tableArg ? "--table" : `<campaign>/${TABLE_NAME}`})`); }
  let row = null, n = 0;
  for (const l of lines(text)) {
    n++;
    let r;
    try { r = JSON.parse(l); } catch { return out(2, `table line ${n} does not parse — an unread table is not a clean one`); }
    if (r && typeof r === "object" && r.window === win) row = r;
  }
  if (!row) return out(2, `no row for window ${win} in the table`);
  const bad = [];
  for (const f of FIELDS) {
    const c = row[f];
    if (!c || typeof c !== "object") { bad.push(`${f} missing`); continue; }
    if (!Number.isFinite(c.value)) { bad.push(`${f} not a finite number`); continue; }
    if (typeof c.source !== "string" || !c.source.trim()) { bad.push(`${f} names no source`); continue; }
    const owner = OWNER_OF[f];
    if (owner && !c.source.split(/[\s"'`]+/).some((t) => t.replace(/\\/g, "/").endsWith(owner))) bad.push(`${f} source is not its owner's reader (${owner})`);
  }
  if (bad.length) return out(1, bad.join(" · "));
  return out(0, `${FIELDS.join(", ")}: four finite numbers, each with its owner's reader`);
}

// ── THE PLANTS ───────────────────────────────────────────────────────────────────────────────────────────────────────
const results = [];
const clause = (id, ok, why) => { results.push({ id, ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id} · ${why}`); };

/** an LF tree of <sha> under <into>, through a private index (core.autocrlf=false, core.eol=lf) @returns {string|null} error */
function lfTree(root, shaArg, into) {
  mkdirSync(into, { recursive: true });
  const r = spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "-C", root, `--work-tree=${into}`, "checkout", "-q", shaArg, "--", "."],
    { encoding: "utf8", windowsHide: true, env: { ...process.env, GIT_INDEX_FILE: `${into}.index` } });
  return r.status === 0 ? null : (lines(r.stderr)[0] || `git exit ${r.status}`);
}
/** node processes whose command line names <dir> */
function namingProcs(dir) {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true });
    return lines(r.stdout).filter((l) => l.toLowerCase().includes(dir.toLowerCase())).map((l) => Number(l.split(" ")[0])).filter((p) => p && p !== process.pid);
  }
  const found = [];
  for (const p of existsSync("/proc") ? readdirSync("/proc") : []) {
    if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
    try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(dir)) found.push(Number(p)); } catch { /* gone */ }
  }
  return found;
}

function plants() {
  const only = (opt("--only") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const want = (id) => !only.length || only.includes(id);
  const ROOT = mkdtempSync(join(tmpdir(), "mfactory-"));
  const ORG = resolve(opt("--org") || TREE);
  let BASE_ORG = opt("--base-org") ? resolve(/** @type {string} */ (opt("--base-org"))) : null;
  let baseWhy = "";
  if (!BASE_ORG) {
    let b = null;
    try { b = readFileSync(join(ORG, "ci", "mfactory", "BASE"), "utf8").trim(); } catch { /* absent */ }
    if (!b || !/^[0-9a-f]{40}$/.test(b)) baseWhy = "no --base-org and no ci/mfactory/BASE line";
    else { const e = lfTree(ORG, b, join(ROOT, "base")); if (e) baseWhy = `the BASE ${b.slice(0, 7)} tree could not be built: ${e}`; else BASE_ORG = join(ROOT, "base"); }
  }
  let exitCode = 1;
  try {
    // a plant tree: the reader + its two owner organs, copied from <from>; `edit` rewrites an owner in the copy
    let k = 0;
    const plantTree = (from, edit = null) => {
      const d = join(ROOT, `t${++k}`);
      for (const rel of [SELF_REL, "scripts/land.mjs", "scripts/night.mjs"]) {
        const src = join(from, rel);
        if (!existsSync(src)) continue;
        mkdirSync(dirname(join(d, rel)), { recursive: true });
        cpSync(src, join(d, rel));
      }
      if (edit) { const p = join(d, edit.file); if (existsSync(p)) writeFileSync(p, readFileSync(p, "utf8").replace(edit.from, edit.to)); }
      return d;
    };
    const tableOf = (rows) => { const p = join(ROOT, `table${++k}.jsonl`); writeFileSync(p, rows.map((r) => (typeof r === "string" ? r : JSON.stringify(r))).join("\n") + "\n"); return p; };
    const runReader = (tree, args) => {
      const f = join(tree, SELF_REL);
      if (!existsSync(f)) return { code: null, last: "no reader in this tree" };
      const r = spawnSync(process.execPath, [f, ...args], { encoding: "utf8", windowsHide: true, cwd: ROOT });
      const ls = lines(`${r.stdout || ""}\n${r.stderr || ""}`);
      return { code: r.status, last: ls[ls.length - 1] || "" };
    };
    const SRC = { landings: "node scripts/land.mjs count", hands: "node scripts/land.mjs count", memory_wait: "node scripts/night.mjs line", test_loads: "the laptop test-load recorder (N9)" };
    const full = (win, over = {}) => ({ window: win, ...Object.fromEntries(FIELDS.map((f, i) => [f, { value: i, source: SRC[f] }])), ...over });
    const W = "w-plant";
    // each case: [what, tree-edit|null, reader args builder, expected exit]
    const groups = {
      P1: [
        ["four finite fields", null, () => ["--window", W, "--table", tableOf([full(W)])], 0],
        ["three fields", null, () => { const r = full(W); delete r.test_loads; return ["--window", W, "--table", tableOf([r])]; }, 1],
        ['a string "n/a"', null, () => ["--window", W, "--table", tableOf([full(W, { hands: { value: "n/a", source: SRC.hands } })])], 1],
        ["a null value", null, () => ["--window", W, "--table", tableOf([full(W, { memory_wait: { value: null, source: SRC.memory_wait } })])], 1],
        ["another window only", null, () => ["--window", W, "--table", tableOf([full("w-other")])], 2],
      ],
      P2: [
        ["every source names its owner", null, () => ["--window", W, "--table", tableOf([full(W)])], 0],
        ["landings sourced to night.mjs", null, () => ["--window", W, "--table", tableOf([full(W, { landings: { value: 3, source: "node scripts/night.mjs line" } })])], 1],
        ["an empty source", null, () => ["--window", W, "--table", tableOf([full(W, { test_loads: { value: 2, source: " " } })])], 1],
      ],
      P3: [
        ["no --campaign / --table", null, () => ["--window", W], 2],
        ["the table absent", null, () => ["--window", W, "--campaign", join(ROOT, "no-campaign")], 2],
        ["a corrupt line beside a good row", null, () => ["--window", W, "--table", tableOf(["{ not json", full(W)])], 2],
      ],
      P4: [
        ['night.mjs without "memory" in REASONS', { file: "scripts/night.mjs", from: '"pool", "memory",', to: '"pool",' }, () => ["--window", W, "--table", tableOf([full(W)])], 2],
        ["land.mjs without HUMAN_STOPS", { file: "scripts/land.mjs", from: "const HUMAN_STOPS = new Set(", to: "const STOPS_OF_HIS = new Set(" }, () => ["--window", W, "--table", tableOf([full(W)])], 2],
        ["both owners intact", null, () => ["--window", W, "--table", tableOf([full(W)])], 0],
      ],
    };
    for (const [id, cases] of Object.entries(groups)) {
      if (!want(id)) continue;
      const miss = [];
      let baseRed = 0;
      for (const [what, edit, args, exp] of cases) {
        const b = runReader(plantTree(ORG, edit), args());
        if (b.code !== exp) miss.push(`${what}: want ${exp}, got ${b.code} (${b.last.slice(0, 120)})`);
        if (BASE_ORG) { const r = runReader(plantTree(BASE_ORG, edit), args()); if (r.code !== exp) baseRed++; }
      }
      const baseOk = !BASE_ORG ? false : baseRed > 0;
      clause(id, miss.length === 0 && baseOk,
        `${cases.length - miss.length}/${cases.length} plant(s) as designed on --org · base ${BASE_ORG ? `${baseRed}/${cases.length} not as designed (RED on base)` : `UNREAD (${baseWhy || "no base"})`}${miss.length ? ` · ${miss.join(" · ")}` : ""}`);
    }
    // ── BOUND ──
    if (!BASE_ORG) clause("BOUND", false, baseWhy || "no --base-org");
    else {
      const walk = (dir, acc = new Map(), top = dir) => {
        for (const name of readdirSync(dir)) {
          const p = join(dir, name), rel = slash(relative(top, p));
          if (SKIP_TOP.has(rel.split("/")[0]) || rel === "dressing-room/state" || rel.startsWith("dressing-room/state/")) continue;
          const st = statSync(p);
          if (st.isDirectory()) walk(p, acc, top);
          else acc.set(rel, createHash("sha256").update(readFileSync(p, "utf8").replace(/\r\n/g, "\n")).digest("hex"));
        }
        return acc;
      };
      // a file the tree's own git IGNORES (a selftest's .log, his gitignored tokens) is no part of a commit: dropped, asked of
      // that tree's git (a tree that is no git work tree ignores nothing)
      const unignored = (dir, m) => {
        const r = spawnSync("git", ["-C", dir, "check-ignore", "--no-index", "--stdin"], { input: [...m.keys()].join("\n"), encoding: "utf8", windowsHide: true });
        if (r.status !== 0 && r.status !== 1) return m;
        for (const p of lines(r.stdout)) m.delete(slash(p));
        return m;
      };
      const a = unignored(ORG, walk(ORG)), b = unignored(BASE_ORG, walk(BASE_ORG));
      const diff = [...new Set([...a.keys(), ...b.keys()])].filter((x) => a.get(x) !== b.get(x)).sort();
      const extra = diff.filter((f) => !NAMED(f));
      clause("BOUND", extra.length === 0, `${diff.length} file(s) differ from --base-org${extra.length ? ` · BEYOND THE NAMED: ${extra.slice(0, 6).join(", ")}` : ", all named"}`);
    }
    exitCode = 0;
  } catch (e) {
    clause("WITNESS", false, `threw: ${String((e && e.stack) || e).split(/\r?\n/).slice(0, 3).join(" | ").slice(0, 300)}`);
  }
  // ── LAST ──
  const left = namingProcs(ROOT);
  for (const p of left) { try { process.kill(p); } catch { /* gone */ } }
  rmSync(ROOT, { recursive: true, force: true });
  clause("LAST", left.length === 0, `${left.length} node process(es) naming the temp root survive`);
  const red = results.filter((r) => !r.ok).map((r) => r.id);
  if (red.length || exitCode) { console.log(`RED ${UNIT} · ${red.join(", ") || "WITNESS"}`); process.exit(1); }
  console.log(`GREEN ${UNIT} the factory window's four numbers are read, each from its owner, and an unread window is never green · ${results.length} clause(s)`);
  process.exit(0);
}

if (argv[0] === "plants" || (opt("--org") !== null && opt("--window") === null)) plants();
else { const r = judgeWindow(); console.log(r.line); process.exit(r.code); }
