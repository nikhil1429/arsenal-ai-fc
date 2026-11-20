#!/usr/bin/env node
// ============================================================================
// ci/mport/witness_mport.mjs — UNIT mport · ONE GUARD, ONE HOME FOR EVERY PLANTED PORT (forks row 1064 (6) + (1))
// ----------------------------------------------------------------------------
// USAGE: node ci/mport/witness_mport.mjs --org <dir> --base-org <dir> [--only <clause>[,<clause>…]]
//   --org       the tree to witness (the build reads GREEN; the base, main as cut, reads RED on every clause)
//   --base-org  the BASE tree — BOUND needs it; absent, BOUND is RED
//   --only      run only these clauses (the mutant runner's door); BOUND and LAST always run
// CONTRACT — nothing under --org is written. Every plant is a COPY of --org's scripts/*.mjs (no secret, no log, no json of
//   scripts/ is copied) plus the ONE tracked state file the import chain needs at load (dressing-room/state/registry.json,
//   gate.mjs's lane table; copied by this node script, never printed), all under ONE root in os.tmpdir(). Each organ copy
//   gets ONE appended line that exports the ports it chose at load (cortex: CORTEX_PORT, THALAMUS_PORT, JUDGE_AT; thalamus:
//   PORT, JUDGE_AT — the same names on base and build) — the witness's instrument on a copy, never on --org.
//   "Under the temp dir" and "outside it" are BOTH planted: each child runs with its OWN TMPDIR / TMP / TEMP pointing at a
//   chosen dir inside the plant root, so os.tmpdir() as the organ sees it either holds the planted tree or does not — his
//   real tree is never the "outside" case, and nothing is written outside the real temp dir. The split cases put keeper.mjs
//   in its own dir (the organ tree's keeper.mjs is a one-line `export *` stub of it), so the guard is seen to follow
//   keeper.mjs's place, not the organ's own (row 1064 (1)).
// THE PORT CLASS (row 1053): NO daemon is started, NOTHING binds a service port, nothing is POSTed: each child only IMPORTS
//   the planted organ and prints the numbers. The planted env ports are OS-picked (bind :0 on 127.0.0.1, released at once)
//   and only ever reach a child whose env door points under the plant root. Every child wait is bounded by keeper.mjs's
//   own KEEP_POLL_MS, read from --org (never a typed number). No git repo is planted (core.autocrlf: nothing to clone/init).
//   CRLF-proof: every line read is split on \r?\n, BOUND hashes text with CRLF folded to LF; processes are listed through
//   PowerShell on Windows, `ps` elsewhere.
// CLAUSES:
//   P1  HIS MACHINE READS THE FIXED PORTS — with every ARSENAL_*_PORT set: (a) the tree outside the temp dir → cortex
//       4112/4113/4118, thalamus 4113/4118; (b) KEEPER outside the temp dir, the organs under it → the same fixed ports
//       (one guard: keeper's place decides); (c) under the temp dir with a value that is not a port → the fixed ports
//   P2  A PLANTED TREE IS HONOURED, THROUGH KEEPER'S GUARD — (a) the tree under the temp dir → every env port, both organs;
//       (b) KEEPER under the temp dir, the organs outside it → every env port
//   P3  ONE HOME (static) — keeper.mjs exports plantedPort and derives JUDGE_PORT from it; cortex.mjs and thalamus.mjs import
//       plantedPort from ./keeper.mjs, define no copy of it, and read no ARSENAL_*_PORT except through plantedPort("…")
//   BOUND (guard) only the named files differ from --base-org (ci/mport/** is this unit's own output)
//   LAST  (guard) no node process naming the plant root survives
// LAST LINE: GREEN MPORT <what> · <n> clause(s) (exit 0) or RED MPORT · <clauses> (exit 1)
// ============================================================================
import { cpSync, mkdirSync, mkdtempSync, writeFileSync, readFileSync, appendFileSync, existsSync, rmSync, readdirSync, statSync } from "node:fs";
import { join, resolve, relative, sep, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:net";
import { pathToFileURL } from "node:url";

const UNIT = "MPORT";
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || "."), BASE_ORG = arg("--base-org") ? resolve(arg("--base-org")) : null;
const ONLY = arg("--only") ? new Set(arg("--only").split(",")) : null;
const want = (id) => !ONLY || ONLY.has(id);
const NAMED = ["scripts/cortex.mjs", "scripts/thalamus.mjs", "scripts/keeper.mjs"];
const FIXED = { cortex: 4112, thalamus: 4113, judge: 4118 };   // keeper.mjs port registry (comment at keeper.mjs:78-79 on the base)
const slash = (p) => p.split(sep).join("/");
const lines = (s) => String(s || "").split(/\r?\n/).filter((l) => l.trim());
const results = [];
const clause = (id, ok, detail) => { results.push({ id, ok }); console.log(`${ok ? "✓" : "✗"} ${id} · ${detail}`); };

const ROOT = mkdtempSync(join(tmpdir(), "mport-wit-"));
const { KEEP_POLL_MS } = await import(pathToFileURL(join(ORG, "scripts", "keeper.mjs")).href);   // the one bound, keeper's own

// ── THE PLANT ────────────────────────────────────────────────────────────────────────────────────────────────────────
const copyScripts = (dst) => {
  cpSync(join(ORG, "scripts"), join(dst, "scripts"), { recursive: true, filter: (p) => statSync(p).isDirectory() || /\.mjs$/.test(p) });
  const reg = join(ORG, "dressing-room", "state", "registry.json");
  if (existsSync(reg)) { mkdirSync(join(dst, "dressing-room", "state"), { recursive: true }); cpSync(reg, join(dst, "dressing-room", "state", "registry.json")); }
  appendFileSync(join(dst, "scripts", "cortex.mjs"), "\nexport const __MPORT = { cortex: CORTEX_PORT, thalamus: THALAMUS_PORT, judge: JUDGE_AT };\n");
  appendFileSync(join(dst, "scripts", "thalamus.mjs"), "\nexport const __MPORT = { thalamus: PORT, judge: JUDGE_AT };\n");
};
const IN = join(ROOT, "in"), OUT = join(ROOT, "out"), KX = join(ROOT, "kx");   // three would-be temp dirs, all under the real one
for (const d of [IN, OUT, KX]) mkdirSync(d, { recursive: true });
const TREE = join(IN, "tree"), SPLIT = join(IN, "split");
copyScripts(TREE);
copyScripts(SPLIT);
mkdirSync(join(KX, "scripts"), { recursive: true });
cpSync(join(ORG, "scripts", "keeper.mjs"), join(KX, "scripts", "keeper.mjs"));
writeFileSync(join(SPLIT, "scripts", "keeper.mjs"), `export * from ${JSON.stringify(pathToFileURL(join(KX, "scripts", "keeper.mjs")).href)};\n`);

const freePort = () => new Promise((res, rej) => { const s = createServer(); s.on("error", rej); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });
const ENVP = { cortex: await freePort(), thalamus: await freePort(), judge: await freePort() };
const envDoors = (v) => ({ ARSENAL_CORTEX_PORT: String(v ? v.cortex : "not-a-port"), ARSENAL_THALAMUS_PORT: String(v ? v.thalamus : "not-a-port"), ARSENAL_JUDGE_PORT: String(v ? v.judge : "not-a-port") });

// one child: import the planted organ with os.tmpdir() = tmp, print the ports it chose
const choose = (tree, organ, tmp, doors) => {
  const env = { ...process.env, TMPDIR: tmp, TMP: tmp, TEMP: tmp, ...doors };
  delete env.ANTHROPIC_API_KEY;
  const url = pathToFileURL(join(tree, "scripts", `${organ}.mjs`)).href;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", `const m = await import(${JSON.stringify(url)}); console.log("MPORT " + JSON.stringify(m.__MPORT)); process.exit(0);`],
    { cwd: tree, env, encoding: "utf8", timeout: KEEP_POLL_MS, windowsHide: true });
  const l = lines(r.stdout).find((x) => x.startsWith("MPORT "));
  return l ? JSON.parse(l.slice(6)) : { error: `exit ${r.status}${r.signal ? ` ${r.signal}` : ""}: ${lines(r.stderr).slice(-1)[0] || "no output"}`.slice(0, 200) };
};
const expectAll = (got, exp) => Object.keys(got).length > 0 && !got.error && Object.keys(got).every((k) => got[k] === exp[k]);
const show = (got) => (got.error ? got.error : Object.entries(got).map(([k, v]) => `${k} ${v}`).join("/"));
const both = (tree, tmp, doors, exp, label) => {
  const c = choose(tree, "cortex", tmp, doors), t = choose(tree, "thalamus", tmp, doors);
  return { ok: expectAll(c, exp) && expectAll(t, exp), line: `${label}: cortex ${show(c)} · thalamus ${show(t)}` };
};

let failed = false;
try {
  if (want("P1")) {
    const a = both(TREE, OUT, envDoors(ENVP), FIXED, "(a) tree outside");
    const b = both(SPLIT, IN, envDoors(ENVP), FIXED, "(b) keeper outside, organs under");
    const c = both(TREE, IN, envDoors(null), FIXED, "(c) under, not a port");
    clause("P1", a.ok && b.ok && c.ok, `his machine reads the fixed ports — ${[a, b, c].map((x) => `${x.ok ? "" : "✗"}${x.line}`).join(" | ")}`);
  }
  if (want("P2")) {
    const a = both(TREE, IN, envDoors(ENVP), ENVP, "(a) tree under");
    const b = both(SPLIT, KX, envDoors(ENVP), ENVP, "(b) keeper under, organs outside");
    clause("P2", a.ok && b.ok, `a planted tree is honoured through keeper's guard — ${[a, b].map((x) => `${x.ok ? "" : "✗"}${x.line}`).join(" | ")}`);
  }
  if (want("P3")) {
    const code = (f) => readFileSync(join(ORG, f), "utf8").split(/\r?\n/).filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
    const k = code("scripts/keeper.mjs"), bad = [];
    if (!/export function plantedPort\b/.test(k)) bad.push("keeper.mjs exports no plantedPort");
    if (!/export const JUDGE_PORT = plantedPort\("ARSENAL_JUDGE_PORT"/.test(k)) bad.push("keeper.mjs JUDGE_PORT is not read through plantedPort");
    for (const f of ["scripts/cortex.mjs", "scripts/thalamus.mjs"]) {
      const s = code(f);
      if (!/import\s*\{[^}]*\bplantedPort\b[^}]*\}\s*from\s*"\.\/keeper\.mjs"/.test(s)) bad.push(`${f} does not import plantedPort from ./keeper.mjs`);
      if (/function\s+plantedPort\b|(?:const|let|var)\s+plantedPort\b/.test(s)) bad.push(`${f} defines its own plantedPort`);
      const stray = s.split("\n").filter((l) => /ARSENAL_\w+_PORT/.test(l) && !/plantedPort\("ARSENAL_\w+_PORT"/.test(l));
      if (stray.length) bad.push(`${f} reads ${stray.length} ARSENAL_*_PORT outside plantedPort`);
    }
    clause("P3", bad.length === 0, bad.length ? bad.join(" · ") : "keeper.mjs holds the one plantedPort (JUDGE_PORT through it); cortex + thalamus import it, keep no copy, read no port env beside it");
  }
  // ── BOUND (guard) ──────────────────────────────────────────────────────────────────────────────────────────────
  if (!BASE_ORG) clause("BOUND", false, "no --base-org given");
  else {
    const OWN = (rel) => rel.startsWith("ci/mport/") || rel.startsWith("dressing-room/state/") || /\.log$/.test(rel);
    const list = (dir) => {
      const g = spawnSync("git", ["-C", dir, "ls-files", "-co", "--exclude-standard"], { encoding: "utf8" });
      if (g.status === 0 && !relative(lines(spawnSync("git", ["-C", dir, "rev-parse", "--show-toplevel"], { encoding: "utf8" }).stdout)[0] || "", dir)) return lines(g.stdout);
      const acc = [], walk = (d) => { for (const n of readdirSync(d)) { if (n === ".git" || n === "node_modules") continue; const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else acc.push(slash(relative(dir, p))); } };
      walk(dir); return acc;
    };
    const hashes = (dir) => new Map(list(dir).filter((r) => !OWN(r) && existsSync(join(dir, r))).map((r) => [r, createHash("sha256").update(readFileSync(join(dir, r), "utf8").replace(/\r\n/g, "\n")).digest("hex")]));
    const a = hashes(ORG), b = hashes(BASE_ORG);
    const diff = [...new Set([...a.keys(), ...b.keys()])].filter((x) => a.get(x) !== b.get(x)).sort(), extra = diff.filter((f) => !NAMED.includes(f));
    clause("BOUND", extra.length === 0, `${diff.length} file(s) differ from --base-org${diff.length ? ` (${diff.join(", ")})` : ""}${extra.length ? ` · BEYOND THE NAMED: ${extra.slice(0, 6).join(", ")}` : ""}`);
  }
} catch (e) {
  failed = true;
  clause("WITNESS", false, `threw: ${String((e && e.stack) || e).split(/\r?\n/).slice(0, 3).join(" | ").slice(0, 300)}`);
}

// ── LAST (guard) ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  const listing = process.platform === "win32"
    ? spawnSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true, timeout: KEEP_POLL_MS })
    : spawnSync("ps", ["-eo", "args"], { encoding: "utf8", timeout: KEEP_POLL_MS });
  const left = lines(listing.stdout).filter((l) => l.includes(ROOT) && !/\bps -eo\b/.test(l));
  rmSync(ROOT, { recursive: true, force: true });
  clause("LAST", left.length === 0 && !existsSync(ROOT), `${left.length} node process(es) naming the plant root survive · root removed ${!existsSync(ROOT)}`);
}
const GUARDS = new Set(["BOUND", "LAST", "WITNESS"]);
const red = results.filter((r) => !r.ok).map((r) => r.id);
if (red.length || failed) { console.log(`RED ${UNIT} · ${red.join(", ") || "WITNESS"}`); process.exit(1); }
console.log(`GREEN ${UNIT} cortex and thalamus read every planted port through keeper's one guard; his machine reads the fixed ports · ${results.filter((r) => !GUARDS.has(r.id)).length} clause(s)`);
process.exit(0);
