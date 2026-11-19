#!/usr/bin/env node
// ============================================================================
// ci/mcon/witness_mcon.mjs — UNIT mcon · forks row 1132 (3), unit mtxt3's FORK F4: the conductor.mjs selftest assert
//   "S9 · FOLD — the fallback mode RUNS NOTHING" reads the fallback mode's REAL output from a child run on a copy (it used
//   to slice its own source from its own string literal, so its /NOTHING WAS RUN/ pin satisfied itself); and the spec
//   question, answered by census: how many selftest asserts in the repo are satisfied by their own literal.
// ----------------------------------------------------------------------------
// USAGE: node ci/mcon/witness_mcon.mjs --org <dir> --base-org <dir> [--only <clause>[,<clause>…]]
//   --org       the tree to witness (the build reads GREEN; the base, given as --org too, reads RED)
//   --base-org  the BASE tree (the sha in ci/mcon/BASE); absent ⇒ every clause RED
//   --only      run only these clause ids (the mutant runner's door); LAST always runs
// CONTRACT — READ-ONLY on --org and --base-org. Every process it starts runs on a COPY of a tree (all but .git and
//   node_modules) under ONE os.tmpdir() root made here, by node — never a shell copy — with TMPDIR / TEMP / TMP / HOME /
//   USERPROFILE / ARSENAL_ARCHIVE pointing under that root, so the conductor selftest's own child copy lands there too.
//   No state file is read or printed by the witness itself. No git repo is planted here (the runner clones with
//   core.autocrlf=false). Every text read folds \r\n to \n; no POSIX-only shell is used (PowerShell lists processes on
//   Windows). THE PORT CLASS (row 1053): no port is bound, no live service is named, nothing is POSTed, nothing is
//   restarted, no model is called. No timeout, budget or size is typed: every child is awaited by spawnSync, which returns
//   when it exits (the selftest's own child is bounded by the file's own STEP_TIMEOUT_MS).
// CLAUSES (each RED on the base, GREEN on the build):
//   F1  SPAWN — a copy of --org whose `fallback` branch is mutated to RUN something (one spawnSync before its last line):
//       the org's conductor selftest prints ✗ on the S9 RUNS NOTHING assert and exits non-zero
//   F2  SILENT — a copy whose fallback console line no longer says NOTHING WAS RUN (the mtxt3 T2 mutant): ✗ and non-zero
//   F3  STATE — a copy whose fallback writes one file into its state dir: ✗ and non-zero
//   F4  CONTROL — the unmutated copy: conductor.mjs differs from the base ∧ its selftest exits 0 ∧ its headline reads
//       "0 failed" with the base's pass count ∧ the S9 RUNS NOTHING line is ✓
//   C1  CENSUS — ci/mcon/census_mcon.mjs (the org's own; the shape is defined there by code) on --org and on --base-org:
//       the base carries ≥ 1 own-literal pin in scripts/conductor.mjs, the org carries none there, and the org's other
//       own-literal pins are exactly the base's (file + pin text, as multisets) — nothing beyond that one assert moved
//   ONE — scripts/conductor.mjs with its S9 (6) block cut out (from the line holding "(6) ⛔ IT REPORTS, IT DOES NOT RUN"
//       to the selftest's ALL CHECKS PASSED line) is byte-identical to the base's cut the same way, and the block differs
//   BOUND — only scripts/conductor.mjs and ci/mcon/** differ from --base-org (conductor.mjs DOES differ); .git and
//       node_modules are not walked; text is hashed with CRLF folded to LF
//   LAST — no node process naming this run's temp root survives (ps; PowerShell on Windows)
// LAST LINE: GREEN MCON <what> · <n> clause(s) (exit 0) or RED MCON · <clauses> (exit 1)
// ============================================================================
import { readFileSync, existsSync, mkdtempSync, mkdirSync, cpSync, rmSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve, relative, sep, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
const ORG = opt("--org") ? resolve(opt("--org")) : null;
const BASE = opt("--base-org") ? resolve(opt("--base-org")) : null;
const ONLY = opt("--only") ? new Set(opt("--only").split(",")) : null;
const want = (id) => !ONLY || ONLY.has(id);

const COND = "scripts/conductor.mjs";
const fold = (s) => s.replace(/\r\n/g, "\n");
const rd = (root, p) => { try { return fold(readFileSync(join(root, p), "utf8")); } catch { return null; } };

const ROOT = mkdtempSync(join(tmpdir(), "mcon-witness-"));
const TMP = join(ROOT, "tmp"); mkdirSync(TMP, { recursive: true });
const HOME = join(ROOT, "home"); mkdirSync(HOME, { recursive: true });
const childEnv = () => {
  const e = { ...process.env, TMPDIR: TMP, TEMP: TMP, TMP, HOME, USERPROFILE: HOME, ARSENAL_ARCHIVE: join(ROOT, "archive") };
  delete e.ARSENAL_DAY_KEY; delete e.ARSENAL_SCHEDULED;
  return e;
};
const results = [];
const clause = (id, ok, why) => { results.push({ id, ok: !!ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id} · ${why}`); };

// ---- a copy of a tree (all but .git / node_modules), made by node ----
let seq = 0;
function copyOf(tree, tag) {
  const dst = join(ROOT, `tree-${tag}-${seq++}`);
  cpSync(tree, dst, { recursive: true, filter: (p) => { const r = relative(tree, p).split(sep); return r[0] !== ".git" && !r.includes("node_modules"); } });
  return dst;
}

// ---- the three fallback mutants, planted into a copy (an anchor that is missing is a refusal, never a silent pass) ----
const LAST_FB_LINE = '    console.log("conductor: NOTHING WAS RUN — this reports what the fold no longer covers.';
export const FALLBACK_MUTANTS = {
  F1: (s) => s.replace(LAST_FB_LINE, '    spawnSync(process.execPath, ["-e", "0"]);\n' + LAST_FB_LINE),
  F2: (s) => s.replace(LAST_FB_LINE, '    console.log("conductor: this reports what the fold no longer covers.'),
  F3: (s) => s.replace(LAST_FB_LINE, '    writeFileSync(join(STATE_DIR, "mcon_fallback_mutant.json"), "{}");\n' + LAST_FB_LINE),
};

const S9 = "S9 · FOLD — the fallback mode RUNS NOTHING";
function selftest(tree) {
  const r = spawnSync(process.execPath, [join(tree, COND), "selftest"], { cwd: tree, encoding: "utf8", env: childEnv(), windowsHide: true });
  const lines = fold(String(r.stdout || "")).split("\n").filter(Boolean);
  const s9 = lines.find((l) => l.includes(S9)) || null;
  return { code: r.status, headline: lines[lines.length - 1] || "(no output)", s9, s9mark: s9 ? s9.trim().slice(0, 1) : null };
}

let exit = 0;
try {
  if (!ORG || !BASE || !existsSync(join(ORG, COND)) || !existsSync(join(BASE, COND))) {
    for (const id of ["F1", "F2", "F3", "F4", "C1", "ONE", "BOUND"]) if (want(id)) clause(id, false, "--org / --base-org missing or carries no scripts/conductor.mjs");
  } else {
    const orgSrc = rd(ORG, COND), baseSrc = rd(BASE, COND);
    const differs = orgSrc !== baseSrc;

    for (const id of ["F1", "F2", "F3"]) {
      if (!want(id)) continue;
      const t = copyOf(ORG, id.toLowerCase());
      const p = join(t, COND);
      const before = fold(readFileSync(p, "utf8"));
      const after = FALLBACK_MUTANTS[id](before);
      if (after === before) { clause(id, false, "the fallback anchor line is absent — the mutant could not be planted"); continue; }
      writeFileSync(p, after);
      const r = selftest(t);
      clause(id, r.s9mark === "✗" && r.code !== 0, `${{ F1: "fallback mutated to RUN a child", F2: "fallback line stripped of NOTHING WAS RUN", F3: "fallback mutated to WRITE state" }[id]} → S9 assert ${r.s9mark || "absent"} · selftest exit ${r.code} · ${r.headline}`);
      rmSync(t, { recursive: true, force: true });
    }

    if (want("F4")) {
      const t = copyOf(ORG, "f4"), b = copyOf(BASE, "f4base");
      const r = selftest(t), rb = selftest(b);
      const n = (h) => (h.match(/\((\d+) passed, 0 failed\)/) || [])[1] || null;
      clause("F4", differs && r.code === 0 && /0 failed/.test(r.headline) && n(r.headline) && n(r.headline) === n(rb.headline) && r.s9mark === "✓",
        `${differs ? "conductor.mjs differs" : "conductor.mjs is the base's"} · org ${r.headline} (exit ${r.code}) · base ${rb.headline} · S9 ${r.s9mark || "absent"}`);
      rmSync(t, { recursive: true, force: true }); rmSync(b, { recursive: true, force: true });
    }

    if (want("C1")) {
      const census = join(ORG, "ci", "mcon", "census_mcon.mjs");
      if (!existsSync(census)) clause("C1", false, "the org carries no ci/mcon/census_mcon.mjs — the census is absent");
      else {
        const run = (tree) => {
          const r = spawnSync(process.execPath, [census, "--org", tree, "--modules", existsSync(join(ORG, "node_modules")) ? ORG : BASE, "--json"], { encoding: "utf8", env: childEnv(), windowsHide: true });
          const lines = fold(String(r.stdout || "")).split("\n").filter(Boolean);
          const rows = lines.filter((l) => l.startsWith("{")).map((l) => JSON.parse(l)).filter((h) => h.kind === "own-literal");
          return { code: r.status, last: lines[lines.length - 1] || "(no output)", rows };
        };
        const o = run(ORG), b = run(BASE);
        const key = (h) => `${h.at.split(":")[0]} ${h.pin}`;
        const inCond = (h) => h.at.startsWith(`${COND}:`);
        const ms = (rows) => rows.filter((h) => !inCond(h)).map(key).sort().join("\n");
        const bc = b.rows.filter(inCond).length, oc = o.rows.filter(inCond).length;
        clause("C1", o.code === 0 && b.code === 0 && bc >= 1 && oc === 0 && ms(o.rows) === ms(b.rows),
          `base ${b.last} · org ${o.last} · conductor own-literal pins base ${bc} → org ${oc} · others ${ms(o.rows) === ms(b.rows) ? "identical" : "DIFFER"}${o.code ? ` · census exit ${o.code}` : ""}`);
      }
    }

    if (want("ONE")) {
      const cut = (src) => {
        const L = src.split("\n");
        const a = L.findIndex((l) => l.includes("(6) ⛔ IT REPORTS, IT DOES NOT RUN"));
        const b = L.findIndex((l, i) => i > a && l.includes("ALL CHECKS PASSED"));
        return a < 0 || b < 0 ? null : { rest: [...L.slice(0, a), ...L.slice(b)].join("\n"), block: L.slice(a, b).join("\n") };
      };
      const o = cut(orgSrc), b = cut(baseSrc);
      clause("ONE", !!o && !!b && o.rest === b.rest && o.block !== b.block,
        !o || !b ? "the S9 (6) block is not found in both files" : o.rest !== b.rest ? "conductor.mjs differs OUTSIDE the S9 (6) assert block" : o.block === b.block ? "the S9 (6) block is the base's — the unit is absent" : "conductor.mjs differs only inside the S9 (6) assert block");
    }

    if (want("BOUND")) {
      const list = (root) => {
        const out = new Map();
        const walk = (d) => { for (const n of readdirSync(d, { withFileTypes: true })) {
          if (n.name === ".git" || n.name === "node_modules") continue;
          const p = join(d, n.name);
          if (n.isDirectory()) walk(p); else if (n.isFile()) out.set(relative(root, p).split(sep).join("/"), createHash("sha256").update(fold(readFileSync(p, "latin1"))).digest("hex"));
        } };
        walk(root); return out;
      };
      const o = list(ORG), b = list(BASE);
      const diff = [...new Set([...o.keys(), ...b.keys()])].filter((k) => o.get(k) !== b.get(k)).sort();
      const extra = diff.filter((k) => k !== COND && !k.startsWith("ci/mcon/"));
      clause("BOUND", !extra.length && diff.includes(COND), extra.length ? `a file beyond the named ones differs: ${extra.slice(0, 5).join(", ")}${extra.length > 5 ? ` (+${extra.length - 5})` : ""}` : diff.includes(COND) ? `only the named files differ (${diff.length} path(s))` : "scripts/conductor.mjs does not differ (the unit is absent)");
    }
  }
} catch (e) { console.log(`  witness threw: ${e && e.message}`); results.push({ id: "THREW", ok: false }); }

// ---- LAST ----
// THE MUTANT DOOR (run_mutants' LAST mutant only): MCON_PLANT_ORPHAN=1 leaves one detached node process whose command line
//   names ROOT, and prints its pid so the runner kills it. Never set outside the runner.
if (process.env.MCON_PLANT_ORPHAN === "1") {
  const { spawn } = await import("node:child_process");
  const c = spawn(process.execPath, ["-e", "setInterval(()=>{}, 2 ** 31 - 1)", ROOT], { detached: true, stdio: "ignore" });
  c.unref(); console.log(`  planted orphan pid ${c.pid}`);
}
try { rmSync(ROOT, { recursive: true, force: true }); } catch {}
let survivors = [];
try {
  const list = process.platform === "win32"
    ? execFileSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8" })
    : execFileSync("ps", ["-eo", "pid,args"], { encoding: "utf8" });
  survivors = list.split(/\r?\n/).filter((l) => l.includes(ROOT) && /node/.test(l) && !l.includes(String(process.pid)));
} catch (e) { survivors = [`(process list unreadable: ${e && e.message})`]; }
clause("LAST", survivors.length === 0, survivors.length ? `${survivors.length} process(es) name the temp root` : "no node process names the temp root");

const reds = results.filter((r) => !r.ok).map((r) => r.id);
const n = results.length;
if (reds.length) { console.log(`RED MCON · ${reds.join(", ")}`); exit = 1; }
else console.log(`GREEN MCON the conductor S9 fallback assert reads a child run's real output (three fallback mutants RED it), the census of own-literal pins derived by code, only that one assert edited · ${n} clause(s)`);
process.exit(exit);
