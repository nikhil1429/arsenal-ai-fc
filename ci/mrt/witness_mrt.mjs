#!/usr/bin/env node
// ============================================================================
// ci/mrt/witness_mrt.mjs — unit mrt (forks rows 1107 (2) / 1108 / 1109 / 1119 (4) F-c / 1120 (1) (4)): mtail T3 AUTH fate (b)
// REPAIR, F1 A — sourceGraph / staleSources live in scripts/keeper.mjs (a leaf again), brain.mjs re-exports them, keeper's dynamic
// import of brain.mjs (mlv1's, the one edge that closed six new import cycles) is gone. (mtail T2's re-base, F2 A / F3 A, and T3's
// edge-set form, F5 B, are re-cut in ci/mtail/ and judged by that witness; this one judges the repair.)
// ----------------------------------------------------------------------------
// USAGE: node ci/mrt/witness_mrt.mjs --org <dir> --base-org <dir>
//   --org       a repository tree to witness (an LF tree; never his live tree — every organ run is on a COPY of it)
//   --base-org  the BASE tree (ci/mrt/BASE): R1's frozen gate (lawpack.mjs BASELINE.depcruise_errors AS THE BASE HAS IT, so a
//               build cannot loosen the gate it is judged by) and its cycle count are read from it, and BOUND needs it.
// CONTRACT — every organ run (an import, a selftest, lawpack gate, dependency-cruiser) is on its OWN COPY of a tree under
//   os.tmpdir(), with its own empty dressing-room/state (registry.json, a TRACKED declaration file, copied in: brain.mjs reads it at
//   import), its own HOME / USERPROFILE / ARSENAL_ARCHIVE under the same temp root. No live model call (a FAKE claude and gemini
//   sit FIRST on PATH and log any spawn), no fixed service port (keeper's judge port reaches its selftest ONLY through its env door
//   ARSENAL_JUDGE_PORT, an OS-picked listen(0) port, honoured only for a copy under the OS temp dir), nothing POSTed, nothing
//   restarted; every child is a bounded spawnSync that ends by itself. Windows: node_modules links are junctions, path keys use
//   forward slashes, every read is CRLF-proof, processes are listed without /proc.
// CLAUSES (each planted both ways: RED on the BASE, GREEN on the build — ci/mrt/run_mutants_mrt.mjs breaks each one alone):
//   R1  CYCLES · dependency-cruiser no-circular on --org: its count ≤ lawpack's frozen BASELINE.depcruise_errors read from
//       --base-org, ≤ --base-org's own count, and NO dependency edge marked circular touches scripts/keeper.mjs.
//   R2  LEAF · scripts/keeper.mjs has no local dependency (dependency-cruiser's own module record: static or dynamic), and
//       brain.mjs's sourceGraph / staleSources ARE keeper.mjs's objects (===, imported in a child on a copy).
//   R3  MLV1 KEPT (the contrast: the repair must not undo mlv1) · `node scripts/keeper.mjs selftest` on a copy exits 0 with no
//       FAIL line, and its RETIRE WHEN IDLE assert (units mlv1-mlv3) is in the copy's source.
//   R4  LAWPACK · `node scripts/lawpack.mjs gate` on a copy ran (its "lawpack:" verdict line is printed) and prints no
//       "depcruise_errors ROSE" line (the jugad-literal-subject-list line is not this clause: unit mlaw, forks row 1120 (1) F4 A).
//   BOUND --org differs from --base-org ONLY in the named files (scripts/brain.mjs, scripts/keeper.mjs, scripts/organism_test.mjs,
//       ci/mtail/w_preload.mjs, ci/mtail/witness_mtail.mjs); ci/mrt/** is this unit's own output and .claude/settings.json the
//       seat's effort key, both left out by name. Tracked files (git ls-files) when the side is a git tree, else every file.
//   LAST no node process naming the temp root survives, and the fake claude / gemini logged no spawn.
// LAST LINE: GREEN MRT the T3 repair · <n> clause(s)  (exit 0)  ·  RED MRT · <clauses>  (exit 1)
// ============================================================================
import { cpSync, mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, symlinkSync, chmodSync } from "node:fs";
import { join, resolve, relative, sep, delimiter } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:net";
import { pathToFileURL } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? resolve(process.argv[i + 1]) : null; };
const ORG = arg("--org"), BASE_ORG = arg("--base-org");
if (!ORG || !existsSync(join(ORG, "scripts", "keeper.mjs"))) { console.log("RED MRT · USAGE (--org <dir> with scripts/keeper.mjs)"); process.exit(1); }

const NAMED = ["scripts/brain.mjs", "scripts/keeper.mjs", "scripts/organism_test.mjs", "ci/mtail/w_preload.mjs", "ci/mtail/witness_mtail.mjs"];
const SKIP_TOP = new Set([".git", "node_modules"]);
const ROOT = mkdtempSync(join(tmpdir(), "mrt-wit-"));
const results = [];
const clause = (id, ok, why) => { results.push({ id, ok: !!ok }); console.log(`  ${ok ? "ok  " : "RED "} ${id} · ${why}`); };
const slash = (p) => p.split(sep).join("/");
const sha = (b) => createHash("sha256").update(b).digest("hex");
const read = (f) => (existsSync(f) ? readFileSync(f, "utf8").replace(/\r\n/g, "\n") : null);
const lines = (t) => String(t || "").split(/\r?\n/);

// the fake claude and gemini, first on PATH (a .cmd beside each for Windows)
const FAKE = join(ROOT, "fakebin"), FAKE_LOG = join(ROOT, "fake_spawns.log");
mkdirSync(FAKE, { recursive: true });
for (const tool of ["claude", "gemini"]) {
  writeFileSync(join(FAKE, tool), `#!/bin/sh\necho "${tool} $*" >> "$MRT_FAKE_LOG"\nexit 1\n`);
  chmodSync(join(FAKE, tool), 0o755);
  writeFileSync(join(FAKE, `${tool}.cmd`), `@echo ${tool} %* >> "%MRT_FAKE_LOG%"\r\n@exit /b 1\r\n`);
}

let seq = 0;
/** a fresh copy of `src` with its own empty state dir (registry.json kept), node_modules linked */
function copyOf(src, tag) {
  const dst = join(ROOT, `${tag}-${++seq}`);
  cpSync(src, dst, { recursive: true, filter: (p) => {
    const rel = slash(relative(src, p));
    if (!rel) return true;
    if (SKIP_TOP.has(rel.split("/")[0])) return false;
    return !(rel === "dressing-room/state" || rel.startsWith("dressing-room/state/"));
  } });
  const st = join(dst, "dressing-room", "state");
  mkdirSync(st, { recursive: true });
  const reg = join(src, "dressing-room", "state", "registry.json");
  if (existsSync(reg)) cpSync(reg, join(st, "registry.json"));
  if (existsSync(join(src, "node_modules"))) symlinkSync(join(src, "node_modules"), join(dst, "node_modules"), "junction");
  return dst;
}
function envFor(copy, extra = {}) {
  const tag = slash(relative(ROOT, copy)).replace(/\//g, "_");
  const home = join(ROOT, `home-${tag}`);
  mkdirSync(home, { recursive: true });
  const e = { ...process.env };
  for (const k of ["ANTHROPIC_API_KEY", "NODE_OPTIONS", "ARSENAL_ORGAN"]) delete e[k];
  const pathKey = Object.keys(e).find((k) => k.toUpperCase() === "PATH") || "PATH";
  return { ...e, [pathKey]: `${FAKE}${delimiter}${e[pathKey] || ""}`, HOME: home, USERPROFILE: home, ARSENAL_ARCHIVE: join(ROOT, `archive-${tag}`), MRT_FAKE_LOG: FAKE_LOG, ...extra };
}
const node = (copy, args, extra = {}) => {
  const r = spawnSync(process.execPath, args, { cwd: copy, encoding: "utf8", env: envFor(copy, extra), windowsHide: true, maxBuffer: 1 << 28, input: "" });
  return { status: r.status, out: String(r.stdout || ""), err: String(r.stderr || ""), error: r.error ? String(r.error.code || r.error.message) : null };
};
/** dependency-cruiser's own JSON on a copy of `tree` (the witness's mtail call): violations + module records */
function cruise(tree, tag) {
  if (!tree) return null;
  const copy = copyOf(tree, tag);
  const bin = join(copy, "node_modules", "dependency-cruiser", "bin", "dependency-cruise.mjs");
  if (!existsSync(bin)) return null;
  const r = node(copy, [bin, "--config", ".dependency-cruiser.cjs", "--output-type", "json", "scripts", "hooks"]);
  try { return JSON.parse(r.out.slice(r.out.indexOf("{"), r.out.lastIndexOf("}") + 1)); } catch { return null; }
}
/** an OS-picked free port (bound to 0, read, released) — never a fixed one */
const freePort = () => new Promise((res, rej) => { const s = createServer(); s.once("error", rej); s.listen(0, "127.0.0.1", () => { const a = s.address(); s.close(() => res(typeof a === "object" && a ? a.port : 0)); }); });

let exitCode = 1;
try {
  const dOrg = cruise(ORG, "dc"), dBase = cruise(BASE_ORG, "dcb");
  const cyc = (d) => (d ? ((d.summary || {}).violations || []).filter((v) => v.rule && v.rule.name === "no-circular") : null);
  const keeperMod = (d) => (d ? (d.modules || []).find((m) => m.source === "scripts/keeper.mjs") : null);

  // ── R1 · CYCLES ──
  {
    const vOrg = cyc(dOrg), vBase = cyc(dBase);
    const frozen = (() => {
      if (!BASE_ORG) return null;
      const c = copyOf(BASE_ORG, "lpb");
      const r = node(c, ["--input-type=module", "-e", `const m = await import(${JSON.stringify(pathToFileURL(join(c, "scripts", "lawpack.mjs")).href)}); console.log(JSON.stringify(m.BASELINE && m.BASELINE.depcruise_errors));`]);
      const v = Number(lines(r.out.trim()).at(-1));
      return Number.isSafeInteger(v) && v >= 0 ? v : null;
    })();
    const touching = dOrg ? (dOrg.modules || []).flatMap((m) => (m.dependencies || []).filter((d) => d.circular && (m.source === "scripts/keeper.mjs" || d.resolved === "scripts/keeper.mjs")).map((d) => `${m.source}→${d.resolved}`)) : null;
    clause("R1 CYCLES", !!vOrg && !!vBase && frozen !== null && vOrg.length <= frozen && vOrg.length <= vBase.length && !!touching && touching.length === 0,
      `depcruise no-circular ${vOrg ? vOrg.length : "?"} · lawpack's frozen BASELINE.depcruise_errors (BASE) ${frozen ?? "?"} · BASE's own count ${vBase ? vBase.length : "(no --base-org)"} · circular edges touching keeper.mjs: ${touching ? (touching.join(", ") || "none") : "?"}`);
  }

  // ── R2 · LEAF ──
  {
    const k = keeperMod(dOrg);
    const local = k ? (k.dependencies || []).filter((d) => !d.coreModule).map((d) => `${d.resolved}${d.dynamic ? " (dynamic)" : ""}`) : null;
    const same = (() => {
      const c = copyOf(ORG, "r2");
      const u = (f) => JSON.stringify(pathToFileURL(join(c, "scripts", f)).href);
      const r = node(c, ["--input-type=module", "-e", `const k = await import(${u("keeper.mjs")}), b = await import(${u("brain.mjs")});
        console.log(JSON.stringify({ g: typeof k.sourceGraph === "function" && b.sourceGraph === k.sourceGraph, s: typeof k.staleSources === "function" && b.staleSources === k.staleSources }));`]);
      try { return JSON.parse(lines(r.out.trim()).at(-1)); } catch { return { error: lines(r.err.trim()).at(-1) }; }
    })();
    clause("R2 LEAF", !!local && local.length === 0 && same.g === true && same.s === true,
      `keeper.mjs local dependencies: ${local ? (local.join(", ") || "none") : "? (no module record)"} · brain sourceGraph ${same.g ? "IS keeper's" : "is NOT keeper's"} · brain staleSources ${same.s ? "IS keeper's" : "is NOT keeper's"}${same.error ? ` (${String(same.error).slice(0, 90)})` : ""}`);
  }

  // ── R3 · MLV1 KEPT ──
  {
    const c = copyOf(ORG, "r3");
    const r = node(c, [join(c, "scripts", "keeper.mjs"), "selftest"], { ARSENAL_JUDGE_PORT: String(await freePort()) });
    const all = lines(r.out + r.err);
    const failsL = all.filter((l) => /^\s*FAIL /.test(l));
    const head = all.filter((l) => /^keeper selftest: \d+ passed, \d+ failed$/.test(l.trim())).at(-1) || null;
    const has = /\bok\("RETIRE WHEN IDLE: /.test(read(join(c, "scripts", "keeper.mjs")) || "");
    clause("R3 MLV1 KEPT", r.status === 0 && failsL.length === 0 && !!head && / 0 failed$/.test(head) && has,
      `keeper selftest exit ${r.status} · ${head ? head.trim() : "no headline"}${failsL.length ? ` · ${failsL.map((l) => l.trim().slice(0, 90)).join(" | ")}` : ""} · RETIRE WHEN IDLE assert ${has ? "present" : "ABSENT"}`);
  }

  // ── R4 · LAWPACK ──
  {
    const c = copyOf(ORG, "r4");
    const r = node(c, [join(c, "scripts", "lawpack.mjs"), "gate"]);
    const all = lines(r.out + r.err);
    const verdict = all.filter((l) => /^lawpack: /.test(l.trim())).at(-1) || null;
    const rose = all.filter((l) => /depcruise_errors ROSE/.test(l)).map((l) => l.trim());
    clause("R4 LAWPACK", !!verdict && rose.length === 0,
      `lawpack gate exit ${r.status} · ${verdict ? verdict.trim().slice(0, 100) : "no verdict line"} · depcruise_errors: ${rose.length ? rose[0].slice(0, 100) : "not risen"}`);
  }

  // ── BOUND ──
  {
    const files = (root) => {
      const acc = new Map();
      const g = existsSync(join(root, ".git")) ? spawnSync("git", ["-C", root, "ls-files", "-z"], { encoding: "utf8", maxBuffer: 1 << 28, windowsHide: true }) : null;
      let rels;
      if (g && g.status === 0) rels = String(g.stdout).split("\0").filter(Boolean);
      else {
        rels = [];
        const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name), rel = slash(relative(root, p)); if (SKIP_TOP.has(rel.split("/")[0])) continue; if (e.isDirectory()) walk(p); else if (e.isFile()) rels.push(rel); } };
        walk(root);
      }
      for (const rel of rels) { const p = join(root, rel); acc.set(rel, existsSync(p) ? sha(Buffer.from(readFileSync(p, "latin1").replace(/\r\n/g, "\n"), "latin1")) : "(missing)"); }
      return acc;
    };
    let diff = null;
    if (BASE_ORG) {
      const a = files(ORG), bb = files(BASE_ORG);
      diff = [...new Set([...a.keys(), ...bb.keys()])].filter((k) => a.get(k) !== bb.get(k)).filter((k) => !k.startsWith("ci/mrt/") && k !== ".claude/settings.json").sort();
    }
    const outside = diff ? diff.filter((k) => !NAMED.includes(k)) : null;
    clause("BOUND", !!diff && outside.length === 0, diff ? `differs from BASE in ${diff.length} file(s): ${diff.join(", ") || "none"}${outside.length ? ` · OUTSIDE THE NAMED: ${outside.slice(0, 12).join(", ")}${outside.length > 12 ? ` … (+${outside.length - 12})` : ""}` : ""}` : "no --base-org");
  }
} catch (e) {
  clause("WITNESS", false, `threw: ${String((e && e.stack) || e).split("\n").slice(0, 3).join(" | ")}`);
} finally {
  // ── LAST ──
  const procs = (() => {
    const r = process.platform === "win32"
      ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true })
      : spawnSync("ps", ["-eo", "pid,args"], { encoding: "utf8" });
    const rootFwd = slash(ROOT);
    return lines(r.stdout).filter((l) => (l.includes(ROOT) || l.includes(rootFwd)) && !l.trim().startsWith(String(process.pid) + " ") && !/\b(ps|powershell)\b/.test(l));
  })();
  const spawned = lines(read(FAKE_LOG)).filter(Boolean);
  clause("LAST", procs.length === 0 && spawned.length === 0, `${procs.length} node process(es) naming the temp root survive · the fake claude / gemini logged ${spawned.length} spawn(s)`);
  try { rmSync(ROOT, { recursive: true, force: true }); } catch { }
  const red = results.filter((r) => !r.ok).map((r) => r.id);
  if (red.length) console.log(`RED MRT · ${red.join(" · ")}`);
  else { console.log(`GREEN MRT the T3 repair · ${results.length} clause(s)`); exitCode = 0; }
  process.exitCode = exitCode;
}
