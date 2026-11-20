#!/usr/bin/env node
// ============================================================================
// ci/mfac-floor/witness_mfac_floor.mjs — UNIT mfac · THE FLOOR, RULED (forks row 1103 (2))
// ----------------------------------------------------------------------------
// USAGE: node ci/mfac-floor/witness_mfac_floor.mjs --org <dir> --base-org <dir> [--only <clause>[,…]]
//   --org       the tree to witness (the build reads GREEN; the base, main a18c167, reads RED on every F4 clause)
//   --base-org  the BASE tree (main a18c167) — BOUND needs it; absent, BOUND is RED
// THE RULING: NIGHT_CONFIG.memory_floor_mb is 1536 MB — the standing 1.5 GB line of row 477 (5) — replacing the blind-rail
//   source, which is empty on his laptop. A floor that is not a positive number still refuses.
// CONTRACT — every plant runs on a COPY of --org under os.tmpdir() (never .git, never node_modules — that rides as a link),
//   its own dressing-room/state EMPTY but for the plant (nothing of his is copied or printed), the night's state door
//   ARSENAL_NIGHT_STATE_DIR pointing at the copy, the free-memory reading planted through ARSENAL_NIGHT_FREEMEM_MB behind that
//   door. No port is bound, no service named, nothing POSTed, no git repo planted; every line read is split on \r?\n and
//   BOUND hashes text with CRLF folded to LF. No timeout or ratio is typed; the planted readings are derived from the floor the
//   copy itself carries.
// CLAUSES:
//   F4.1  the shipped NIGHT_CONFIG.memory_floor_mb is the number 1536, and its line names forks row 1103 and row 477 (5)
//   F4.2  a numeric floor passes the floor check: on an armed, begun night, a reading AT the shipped floor → GO; one below → NO memory
//   F4.3  a non-number floor refuses: the copy's floor planted as FLOOR_UNSET and as the string "1536" → NO floor-unset each;
//         and night.mjs selftest carries the clause "a non-number floor refuses" GREEN with its headline 0 failed
//   BOUND only scripts/night.mjs differs from --base-org (ci/mfac-floor/** is this unit's own output)
//   LAST  no node process naming the temp root survives
// LAST LINE: GREEN MFAC-FLOOR <what> · <n> clause(s) (exit 0) or RED MFAC-FLOOR · <clauses> (exit 1)
// ============================================================================
import { cpSync, mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, symlinkSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null, BASE_ORG = arg("--base-org") ? resolve(arg("--base-org")) : null;
const ONLY = arg("--only") ? arg("--only").split(",") : null;
if (!ORG || !existsSync(join(ORG, "scripts", "night.mjs"))) { console.log("RED MFAC-FLOOR · USAGE (--org <dir> with scripts/night.mjs)"); process.exit(1); }
const NAMED = ["scripts/night.mjs"];
const SKIP_TOP = new Set([".git", "node_modules"]);
const ROOT = mkdtempSync(join(tmpdir(), "mfacfloor-wit-"));
const slash = (p) => p.split(sep).join("/");
const lf = (b) => b.toString("utf8").replace(/\r\n/g, "\n");
const lines = (s) => String(s || "").split(/\r?\n/).filter((l) => l.trim());
const results = [];
const clause = (id, ok, why) => { results.push({ id, ok: !!ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id} · ${why}`); };
const want = (id) => !ONLY || ONLY.includes(id);
const istDay = (d = new Date()) => new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 10);

const COPY = join(ROOT, "org");
cpSync(ORG, COPY, { recursive: true, filter: (p) => { const rel = slash(relative(ORG, p)); if (!rel) return true; if (SKIP_TOP.has(rel.split("/")[0])) return false; return !(rel === "dressing-room/state" || rel.startsWith("dressing-room/state/")) && !/\.log$/.test(rel); } });
if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(COPY, "node_modules"), "junction");
const STATE = join(COPY, "dressing-room", "state");
const NIGHT = join(COPY, "scripts", "night.mjs");
const SHIPPED = readFileSync(NIGHT, "utf8");
const FLOOR_LINE = SHIPPED.split(/\r?\n/).find((l) => /NIGHT_CONFIG = Object\.freeze\(\{ memory_floor_mb:/.test(l)) || "";
const SHIPPED_FLOOR = Number((/memory_floor_mb: (\d+) \}/.exec(FLOOR_LINE) || [])[1]);   // NaN when the floor is not a number
const env = (mem) => {
  const e = { ...process.env };
  for (const k of Object.keys(e)) if (/^ARSENAL_|^CLAUDE_CODE_/.test(k) || k === "ANTHROPIC_API_KEY") delete e[k];
  return { ...e, ARSENAL_NIGHT_STATE_DIR: STATE, ...(mem === undefined ? {} : { ARSENAL_NIGHT_FREEMEM_MB: String(mem) }) };
};
const night = (args, mem) => { const r = spawnSync(process.execPath, [NIGHT, ...args], { cwd: COPY, encoding: "utf8", windowsHide: true, env: env(mem) }); return { status: r.status, out: lines(r.stdout)[0] || lines(r.stderr).at(-1) || "" }; };
const fresh = () => { rmSync(STATE, { recursive: true, force: true }); mkdirSync(STATE, { recursive: true }); };
const armBegin = () => { fresh(); night(["arm", "--day", istDay(), "--by", "day.end"]); night(["begin", "--runner", "runner"]); };
const plantFloor = (literal) => writeFileSync(NIGHT, SHIPPED.replace(/memory_floor_mb: [^ }]+ \}/, `memory_floor_mb: ${literal} }`));
const listing = () => (process.platform === "win32"
  ? spawnSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true })
  : spawnSync("ps", ["-eo", "args"], { encoding: "utf8" }));

console.log(`witness mfac-floor · org ${ORG} · shipped floor line: ${FLOOR_LINE.trim().slice(0, 120) || "(none)"}`);
let code = 1;
try {
  if (want("F4.1")) clause("F4.1", SHIPPED_FLOOR === 1536 && /row 1103/.test(FLOOR_LINE) && /row 477 \(5\)/.test(FLOOR_LINE),
    `shipped floor ${Number.isFinite(SHIPPED_FLOOR) ? SHIPPED_FLOOR : "NOT A NUMBER"} · names row 1103 ${/row 1103/.test(FLOOR_LINE)} · names row 477 (5) ${/row 477 \(5\)/.test(FLOOR_LINE)}`);

  if (want("F4.2")) {
    armBegin();
    const at = night(["may", "--act", "launch"], Number.isFinite(SHIPPED_FLOOR) ? SHIPPED_FLOOR : 0);
    armBegin();
    const under = night(["may", "--act", "launch"], Number.isFinite(SHIPPED_FLOOR) ? SHIPPED_FLOOR - 1 : 0);
    clause("F4.2", at.status === 0 && /^GO launch/.test(at.out) && under.status === 1 && /^NO memory/.test(under.out),
      `reading at the floor → ${at.out.slice(0, 40)} (exit ${at.status}) · one under → ${under.out.slice(0, 40)} (exit ${under.status})`);
  }

  if (want("F4.3")) {
    const seen = [];
    for (const lit of ["FLOOR_UNSET", JSON.stringify("1536")]) {
      plantFloor(lit); armBegin();
      const m = night(["may", "--act", "launch"], Number.isFinite(SHIPPED_FLOOR) ? SHIPPED_FLOOR : 0);
      seen.push({ lit, ok: m.status === 1 && /^NO floor-unset/.test(m.out), out: m.out.slice(0, 30) });
    }
    writeFileSync(NIGHT, SHIPPED);
    const st = spawnSync(process.execPath, [NIGHT, "selftest"], { cwd: COPY, encoding: "utf8", windowsHide: true, env: env() });
    const sl = lines(st.stdout);
    const named = sl.find((l) => /a non-number floor refuses/.test(l)) || "";
    clause("F4.3", seen.every((x) => x.ok) && /^\s*ok\s/.test(named) && st.status === 0 && /, 0 failed$/.test(sl.at(-1) || ""),
      `${seen.map((x) => `${x.lit} → ${x.out}`).join(" · ")} · selftest clause ${named ? (/^\s*ok\s/.test(named) ? "ok" : "FAIL") : "ABSENT"} · ${sl.at(-1) || "(no headline)"}`);
  }

  let ok = false, why = "no --base-org";
  if (BASE_ORG && existsSync(BASE_ORG)) {
    const walk = (top) => { const m = new Map(); const w = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); const rel = slash(relative(top, p)); if (SKIP_TOP.has(rel.split("/")[0]) || rel === "dressing-room/state" || rel.startsWith("dressing-room/state/") || rel.startsWith("ci/mfac-floor/") || /\.log$/.test(rel)) continue; if (e.isDirectory()) w(p); else if (e.isFile()) m.set(rel, createHash("sha256").update(lf(readFileSync(p))).digest("hex")); } }; w(top); return m; };
    const a = walk(ORG), b = walk(BASE_ORG);
    const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k));
    const beyond = diff.filter((k) => !NAMED.includes(k));
    ok = beyond.length === 0; why = `differs: ${diff.join(", ") || "nothing"}${beyond.length ? ` · BEYOND THE NAMED: ${beyond.slice(0, 8).join(", ")}` : ""}`;
  }
  clause("BOUND", ok, why);
} finally {
  const left = lines(listing().stdout).filter((l) => l.includes(ROOT) && !/\bps -eo\b/.test(l));
  clause("LAST", left.length === 0, `${left.length} node process(es) naming the temp root`);
  try { rmSync(ROOT, { recursive: true, force: true }); } catch { /* best effort */ }
  const red = results.filter((r) => !r.ok).map((r) => r.id);
  if (red.length) console.log(`RED MFAC-FLOOR · ${red.join(" ")}`);
  else console.log(`GREEN MFAC-FLOOR the night's memory line is the ruled 1536 MB and a non-number floor still refuses · ${results.length} clause(s)`);
  code = red.length ? 1 : 0;
  process.exit(code);
}
