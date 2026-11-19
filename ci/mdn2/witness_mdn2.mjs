#!/usr/bin/env node
// ============================================================================
// ci/mdn2/witness_mdn2.mjs — WITNESS of unit mdn2 (forks row 1051 (4): proof forks 3, 5 and 6 of ci/mdone/PROOF.md on
// branch claude/mdone-build, made ONE unit for the cloud queue)
// ----------------------------------------------------------------------------
// CONTRACT:
//   node ci/mdn2/witness_mdn2.mjs --org <build tree> --base-org <base tree> [--node-modules <dir>] [--only <clauses>]
// Each plant is a COPY of a tree under os.tmpdir() with its dressing-room/state REPLACED by a synthetic one written by
// this script (a registry with planted lanes, planted consumption rows — nothing of his), node_modules linked in (xray
// needs acorn, lawpack needs ast-grep; --node-modules, else <org>/node_modules). No git repo is planted (row 1036's
// core.autocrlf clause has no subject here); every read splits on /\r?\n/ (CRLF-proof); every child is spawned
// node-direct with no shell, so it runs on Windows too. Every env door a child reads (ARSENAL_REGISTRY · _QUEUE_DIR ·
// _LAWS_REGISTER · _MEMORY_DIR · _RAW_FACTS) points under the temp dir or is blanked to the tree copy's own default.
// THE PORT CLASS (row 1053): no port is bound, no service named, nothing POSTed, nothing restarted; every child has a
// bounded wait — the measured node start (below) times a count of children, never a typed time.
//   N-FIELD  the registry's lanes rows carry a lane → file field: through the tree's own CLI (`registry.mjs set`), every
//            malformed `files` (a string · [] · absolute · a drive · a backslash · a `..` segment · a duplicate) is
//            REFUSED, a well-formed one lands, `get` reads it back, and the exported laneFiles() maps it (a row without
//            it is absent from the map).
//   N-REACH  done.mjs's static reach reads the DECLARED files: a lane whose file is not named by its subject but is
//            declared, written, read by its consumer and consumed → REACHED · a lane whose declared file nobody reads
//            stays static NO even though a file named by its subject IS read (the declaration wins, never a union) · a
//            lane declaring none keeps the subject-name reading (REACHED) · the line counts `files declared 2/3`.
//   N-CLEAN  lawpack.mjs exports CLEAN_PLANTS, one per rule id (RULE_IDS and every laws/*.yml id): scanned with the
//            tree's own ast-grep over the tree's own laws/ in a throwaway project, NO rule bites any clean plant, while
//            in a second throwaway project every RED plant still bites (the instrument is alive) · done.mjs --hermetic
//            then reads `laws n/n both ways (n/n RED-planted)`.
//   N-SUITE  ~~(the mode prints exactly 3 ok lines)~~ RE-CUT by unit ms1 (forks row 1154 (2), an ADDED edit; overtaking unit
//            mrung, row 1136, which lawfully added its RUNGS asserts to the same mode): THIS unit's own three named asserts
//            are present and ok and no `WHAT IS LEFT` line is red — never a count of all.
//            organism_test.mjs carries a `done` mode, a member of `all` (listed by its usage line), run under the
//            HERMETIC profile and never named LIVE: GREEN on the tree · RED (exit non-zero, the assert named) when the
//            planted done.mjs prints a second line · RED when one CLEAN_PLANTS entry is planted away.
// Each clause runs on --base-org (must be RED) and on --org (must be GREEN).
// CLOCK: the only clock-bound plant is a consumption row (N-REACH). Its stamp is now minus ONE node start measured in
//   this run (THIS process's own, process.uptime()), so its age is positive and its slack is the gate's own window — no ratio is typed here.
// BOUND: only scripts/done.mjs, scripts/registry.mjs, scripts/lawpack.mjs, scripts/organism_test.mjs and ci/mdn2/ differ.
// LAST: no node process naming the temp dir survives.
// LAST LINE: GREEN MDN2 lane files · clean plants · done in the suite · <n> clause(s)  (exit 0)  ·  RED MDN2 · <clauses>  (exit 1)
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, existsSync, cpSync, symlinkSync, copyFileSync } from "node:fs";
import { join, relative, sep, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null, BASE = arg("--base-org") ? resolve(arg("--base-org")) : null;
if (!ORG || !BASE) { console.log("RED MDN2 · usage: --org <dir> --base-org <dir> [--node-modules <dir>] [--only <clauses>]"); process.exit(1); }
const NM = resolve(arg("--node-modules") || join(ORG, "node_modules"));
const NAMED = ["scripts/done.mjs", "scripts/registry.mjs", "scripts/lawpack.mjs", "scripts/organism_test.mjs"], NAMED_DIRS = ["ci/mdn2/"];
const ROOT = mkdtempSync(join(os.tmpdir(), "witness-mdn2-"));
let seq = 0;

// THE BOUNDED WAIT, derived in the run: THIS process's own node start, measured (process.uptime() at the first line
// after the imports — no spawn, so the measurement itself waits on nothing). A child of this witness may itself spawn
// node children (organism_test → done.mjs → xray), so one child is bounded by CHILDREN × CHILDREN node starts, where
// CHILDREN is a COUNT (the spawns of one full run over both trees, counted from the clauses below), never a typed time.
const NODE_START = Math.max(1, Math.round(process.uptime() * 1000));
const CHILDREN = 2 * (11 + 1 + 2 + 4);   // per tree: N-FIELD 11 · N-REACH 1 · N-CLEAN 2 · N-SUITE 4
const WAIT = NODE_START * CHILDREN * CHILDREN;

const put = (dir, rel, text) => { const p = join(dir, ...rel.split("/")); mkdirSync(join(p, ".."), { recursive: true }); writeFileSync(p, text); };
const STATE_HEAD = `import { join, dirname } from "node:path";\nimport { fileURLToPath } from "node:url";\nconst STATE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "dressing-room", "state");\n`;
const WRITER = (...files) => `import { writeFileSync } from "node:fs";\n${STATE_HEAD}${files.map((f, i) => `export const w${i} = () => writeFileSync(join(STATE_DIR, "${f}"), "{}");\n`).join("")}`;
const READER = (...files) => `import { readFileSync } from "node:fs";\n${STATE_HEAD}${files.map((f, i) => `export const r${i} = () => readFileSync(join(STATE_DIR, "${f}"), "utf8");\n`).join("")}`;
const lane = (subject, consumer, extra = {}) => ({ subject, schema_owner: "plant_writer.mjs", consumers: [{ name: consumer }], consumer_kind: "organ", reach: "any", witness: "ci/mdn2 planted lane", why: "planted by the witness", ...extra });

function tree(src, lanes = []) {
  const dir = join(ROOT, `t${++seq}`);
  cpSync(src, dir, { recursive: true, filter: (s) => { const r = relative(src, s).split(sep).join("/"); return !(r === "node_modules" || r.startsWith("node_modules/") || r === ".git" || r === "dressing-room/state" || r.startsWith("dressing-room/state/")); } });
  if (existsSync(NM)) symlinkSync(NM, join(dir, "node_modules"), "junction");
  put(dir, "dressing-room/state/registry.json", JSON.stringify({ version: 1, updated_at: null, tables: { lanes } }));
  return dir;
}
// every env door under the temp dir or blanked to the tree copy's own default
const ENV = (dir, extra = {}) => ({ ...process.env, ORGANISM_TEST_PROFILE: "", ARSENAL_REGISTRY: "", ARSENAL_LAWS_REGISTER: "", ARSENAL_AUDIT_COLLAR: "",
  ARSENAL_QUEUE_DIR: join(dir, ".plant-queue"), ARSENAL_MEMORY_DIR: join(dir, ".plant-memory"), ARSENAL_RAW_FACTS: join(dir, ".plant-raw.jsonl"), ...extra });
const node = (dir, args, env = {}, input) => {
  const r = spawnSync(process.execPath, args, { cwd: dir, encoding: "utf8", windowsHide: true, timeout: WAIT, env: ENV(dir, env), ...(input !== undefined ? { input } : {}) });
  const out = `${r.stdout || ""}`.replace(/\s+$/, "");
  return { code: r.status, out, lines: out ? out.split(/\r?\n/) : [], err: `${r.stderr || ""}`.split(/\r?\n/).filter(Boolean).slice(-2).join(" | ").slice(0, 240) };
};

const CLAUSES = {
  "N-FIELD"(src) {
    const t = tree(src);
    const reg = join(t, ".plant-registry.json");
    const env = { ARSENAL_REGISTRY: reg };
    const set = (files) => node(t, [join(t, "scripts", "registry.mjs"), "set", "--table", "lanes", "--json", JSON.stringify(lane("plantfield", "plant_reader.mjs", { files }))], env).code;
    const bad = ["dressing-room/state/x.json", [], ["/abs/x.json"], ["C:/x.json"], ["dressing-room\\state\\x.json"], ["dressing-room/../x.json"], ["a/x.json", "a/x.json"]];
    const refused = bad.map((f) => set(f) !== 0);
    const good = ["dressing-room/state/brain_out/plantfield/out.json", "dressing-room/state/plant_other.json"];
    const landed = set(good) === 0;
    const got = node(t, [join(t, "scripts", "registry.mjs"), "get", "--table", "lanes", "--subject", "plantfield"], env);
    let back = null; try { back = JSON.parse(got.out); } catch { back = null; }
    node(t, [join(t, "scripts", "registry.mjs"), "set", "--table", "lanes", "--json", JSON.stringify(lane("plantnofiles", "plant_reader.mjs"))], env);
    const map = node(t, ["--input-type=module", "-e", `const m = await import(${JSON.stringify(pathToFileURL(join(t, "scripts", "registry.mjs")).href)}); console.log(JSON.stringify(typeof m.laneFiles === "function" ? m.laneFiles() : null));`], env);
    let lf = null; try { lf = JSON.parse(map.lines[map.lines.length - 1] || "null"); } catch { lf = null; }
    const readBack = !!back && JSON.stringify(back.files) === JSON.stringify(good);
    const mapped = !!lf && JSON.stringify(lf.plantfield) === JSON.stringify(good) && !("plantnofiles" in lf);
    return { ok: refused.every(Boolean) && landed && readBack && mapped, why: `malformed refused ${refused.filter(Boolean).length}/${bad.length} · well-formed lands ${landed} · read back ${readBack} · laneFiles maps it ${mapped}` };
  },
  "N-REACH"(src) {
    const t = tree(src, [
      lane("plantlane", "plant_reader.mjs"),                                                                  // no files: the subject-name reading
      lane("plantdecl", "plant_reader2.mjs", { files: ["dressing-room/state/plant_other.json"] }),           // declared, not named by its subject
      lane("plantwins", "plant_reader3.mjs", { files: ["dressing-room/state/plant_unread.json"] }),          // declared file nobody reads
    ]);
    put(t, "scripts/plant_writer.mjs", WRITER("plantlane.json", "plant_other.json", "plant_unread.json", "plantwins.json"));
    put(t, "scripts/plant_reader.mjs", READER("plantlane.json"));
    put(t, "scripts/plant_reader2.mjs", READER("plant_other.json"));
    put(t, "scripts/plant_reader3.mjs", READER("plantwins.json"));                                             // reads the NAME file, not the declared one
    const ts = new Date(Date.now() - NODE_START).toISOString();
    put(t, "dressing-room/state/consumption.jsonl", ["plantlane:plant_reader.mjs", "plantdecl:plant_reader2.mjs", "plantwins:plant_reader3.mjs"]
      .map((x) => { const [l, by] = x.split(":"); return JSON.stringify({ ts, lane: l, kind: "opened", by }); }).join("\n") + "\n");
    const a = node(t, [join(t, "scripts", "done.mjs"), "report"]);
    const row = (s) => (a.lines.find((l) => l.startsWith(`DONE reach    ${s}: `)) || "").slice(`DONE reach    ${s}: `.length);
    const fallback = row("plantlane") === "REACHED", decl = row("plantdecl") === "REACHED";
    const wins = /^static NO \(its declared consumer reads none of its files\) · window yes$/.test(row("plantwins"));
    const counted = /files declared 2\/3\)/.test(a.lines[0] || "");
    return { ok: a.code === 0 && fallback && decl && wins && counted,
      why: `name fallback REACHED ${fallback} · declared file REACHED ${decl} · declaration wins over the name ${wins} · line counts declared 2/3 ${counted}${a.code !== 0 ? " · " + a.err : ""}` };
  },
  "N-CLEAN"(src) {
    const t = tree(src);
    const probe = `const lp = await import(${JSON.stringify(pathToFileURL(join(t, "scripts", "lawpack.mjs")).href)});
import { mkdirSync, writeFileSync, readdirSync, copyFileSync } from "node:fs"; import { join } from "node:path";
const ids = readdirSync(${JSON.stringify(join(t, "laws"))}).filter((f) => f.endsWith(".yml")).map((f) => f.replace(/\\.yml$/, ""));
const proj = (name, plants) => { const d = join(${JSON.stringify(t)}, name); mkdirSync(join(d, "laws"), { recursive: true }); mkdirSync(join(d, "scripts"), { recursive: true });
  for (const f of readdirSync(${JSON.stringify(join(t, "laws"))})) if (f.endsWith(".yml")) copyFileSync(join(${JSON.stringify(join(t, "laws"))}, f), join(d, "laws", f));
  copyFileSync(${JSON.stringify(join(t, "sgconfig.yml"))}, join(d, "sgconfig.yml"));
  for (const [id, code] of Object.entries(plants || {})) writeFileSync(join(d, "scripts", "plant_" + id.replace(/-/g, "_") + ".mjs"), code);
  return lp.scan({ paths: ["scripts"], cwd: d, config: join(d, "sgconfig.yml") }); };
const C = lp.CLEAN_PLANTS || null; const red = proj("red-proj", lp.PLANTS); const clean = C ? proj("clean-proj", C) : { matches: [], code: null };
console.log(JSON.stringify({ sg: !!lp.sgBin(), ids, ruleIds: lp.RULE_IDS, clean: C ? Object.keys(C).filter((k) => typeof C[k] === "string") : null,
  bitRed: [...new Set(red.matches.map((m) => m.rule))], redCode: red.code, cleanHits: clean.matches.map((m) => m.rule + "@" + m.file), cleanCode: clean.code }));`;
    const p = node(t, ["--input-type=module", "-e", probe]);
    let j = null; try { j = JSON.parse(p.lines[p.lines.length - 1] || "null"); } catch { j = null; }
    if (!j) return { ok: false, why: `the probe printed no verdict ${p.err}` };
    const all = [...new Set([...j.ruleIds, ...j.ids])];
    const covered = !!j.clean && all.every((id) => j.clean.includes(id));
    const alive = j.sg && [0, 1].includes(j.redCode) && all.every((id) => j.bitRed.includes(id));
    const quiet = !!j.clean && [0, 1].includes(j.cleanCode) && j.cleanHits.length === 0;
    const d = node(t, [join(t, "scripts", "done.mjs"), "line", "--hermetic"]);
    const n = all.length, both = new RegExp(`laws ${n}/${n} both ways \\(${n}/${n} RED-planted\\)`).test(d.out);
    return { ok: covered && alive && quiet && both,
      why: `clean plant per id ${covered} (${j.clean ? j.clean.length : 0}/${n}) · every RED plant bites ${alive} · no rule bites a clean plant ${quiet}${j.cleanHits.length ? " (" + j.cleanHits.slice(0, 3).join(", ") + ")" : ""} · done reads ${(/laws [^|]+/.exec(d.out) || ["?"])[0].trim()}` };
  },
  "N-SUITE"(src) {
    const suite = (dir) => node(dir, [join(dir, "scripts", "organism_test.mjs"), "done"], { ORGANISM_TEST_PROFILE: "hermetic" });
    const t = tree(src);
    const g = suite(t);
    const usage = node(t, [join(t, "scripts", "organism_test.mjs"), "no-such-mode"]);
    const listed = /\|\s*done\s*\|/.test(usage.out) || /\bdone\s*\|\s*all\b/.test(usage.out);
    // ms1 (row 1154 (2)): this unit's OWN named asserts are present and ok, and no WHAT IS LEFT line is red — never a count of all
    const OWN = ["WHAT IS LEFT · done.mjs --hermetic exits 0 and prints exactly ONE", "WHAT IS LEFT · the hermetic form reads no live state", "WHAT IS LEFT · every laws/*.yml rule is planted BOTH ways"];
    const okLines = OWN.filter((n) => g.lines.some((l) => l.replace(/^\s*ok\s+/, "").startsWith(n) && /^\s*ok\s+/.test(l))).length;
    const anyRed = g.lines.some((l) => /^\s*FAIL\s+WHAT IS LEFT/.test(l));
    const green = g.code === 0 && okLines === OWN.length && !anyRed && /LIVE 0 \(hermetic/.test(g.out) && !/^\s*LIVE /m.test(g.out);
    const t2 = tree(src); const dp = join(t2, "scripts", "done.mjs");
    writeFileSync(dp, readFileSync(dp, "utf8") + `\nconsole.log("a second line, planted");\n`);
    const r2 = suite(t2), twoLines = r2.code !== 0 && /FAIL\s+WHAT IS LEFT · done\.mjs --hermetic exits 0 and prints exactly ONE/.test(r2.out);
    const t3 = tree(src); const lp = join(t3, "scripts", "lawpack.mjs");
    const lsrc = readFileSync(lp, "utf8").replace(/\r\n/g, "\n");
    const cut = lsrc.replace(/\n {2}"bare-catch": '[^\n]*\n/, (m) => (/CLEAN|plant: the reason/.test(m) ? "\n" : m));
    if (cut !== lsrc) writeFileSync(lp, cut);
    const r3 = suite(t3), oneAway = cut !== lsrc && r3.code !== 0 && /FAIL\s+WHAT IS LEFT · every laws\/\*\.yml rule is planted BOTH ways/.test(r3.out);
    return { ok: green && listed && twoLines && oneAway,
      why: `mode done GREEN hermetic, never LIVE ${green} (own ${okLines}/3 ok, a WHAT IS LEFT red ${anyRed}) · in \`all\` ${listed} · a second line RED ${twoLines} · a clean plant away RED ${oneAway}` };
  },
};

function files(dir) {
  const out = new Map();
  const walk = (d) => { for (const n of readdirSync(d)) { if (n === ".git" || n === "node_modules") continue; const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else out.set(relative(dir, p).split(sep).join("/"), createHash("sha256").update(readFileSync(p)).digest("hex")); } };
  walk(dir); return out;
}
function bound() {
  const a = files(BASE), b = files(ORG), diff = [];
  for (const k of new Set([...a.keys(), ...b.keys()])) if (a.get(k) !== b.get(k)) diff.push(k);
  const off = diff.filter((p) => !NAMED.includes(p) && !NAMED_DIRS.some((d) => p.startsWith(d)));
  return { ok: off.length === 0 && NAMED.every((p) => diff.includes(p)), why: off.length ? `off-bound: ${off.slice(0, 5).join(", ")}` : `${diff.length} differing path(s), all named` };
}
function survivors() {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true, timeout: WAIT });
    return String(r.stdout || "").split(/\r?\n/).filter((l) => l.includes(ROOT) && !l.includes("witness_mdn2")).length;
  }
  let n = 0;
  for (const p of existsSync("/proc") ? readdirSync("/proc") : []) {
    if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
    try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(ROOT)) n++; } catch { /* a process that ended between the list and the read */ }
  }
  return n;
}

const only = arg("--only");
const red = [];
try {
  if (!existsSync(NM)) { console.log(`  ✗ SETUP · no node_modules at ${NM} (xray needs acorn, lawpack ast-grep) — pass --node-modules`); red.push("SETUP"); }
  console.log(`  · node start measured ${NODE_START} ms → each child waits at most ${WAIT} ms`);
  for (const [name, fn] of Object.entries(CLAUSES)) {
    if (red.includes("SETUP")) break;
    if (only && !only.split(",").includes(name)) continue;
    let onBase, onBuild;
    try { onBase = fn(BASE); } catch (e) { onBase = { ok: false, why: "threw: " + String(e && e.message).split("\n")[0] }; }
    try { onBuild = fn(ORG); } catch (e) { onBuild = { ok: false, why: "threw: " + String(e && e.message).split("\n")[0] }; }
    const pass = !onBase.ok && onBuild.ok;
    console.log(`  ${pass ? "✓" : "✗"} ${name} · base ${onBase.ok ? "GREEN (does not discriminate)" : "RED"} · build ${onBuild.ok ? "GREEN" : "RED"} — ${onBuild.why}`);
    if (!pass) { red.push(name); console.log(`      base: ${onBase.why}`); }
  }
  const b = bound();
  console.log(`  ${b.ok ? "✓" : "✗"} BOUND · ${b.why}`);
  if (!b.ok) red.push("BOUND");
} finally {
  const n = survivors();
  console.log(`  ${n === 0 ? "✓" : "✗"} LAST · ${n} node process(es) naming the temp dir survive`);
  if (n) red.push("LAST");
  try { rmSync(ROOT, { recursive: true, force: true }); } catch { /* the OS reaps its temp dir */ }
}
const total = (only ? only.split(",").length : Object.keys(CLAUSES).length) + 2;
console.log(red.length ? `RED MDN2 · ${red.join(", ")}` : `GREEN MDN2 lane files · clean plants · done in the suite · ${total} clause(s)`);
process.exit(red.length ? 1 : 0);
