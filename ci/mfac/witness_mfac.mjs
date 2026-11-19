#!/usr/bin/env node
// ============================================================================
// ci/mfac/witness_mfac.mjs — UNIT mfac · THE NIGHT FACTORY (forks rows 1069 / 1081)
// ----------------------------------------------------------------------------
// USAGE: node ci/mfac/witness_mfac.mjs --org <dir> --base-org <dir> [--only <clause>[,<clause>…]]
//   --org       the tree to witness (the build reads GREEN; the base, main 902b6cc, reads RED on every clause: it carries no night)
//   --base-org  the BASE tree (origin/main at the cut) — BOUND needs it; absent, BOUND is RED
//   --only      run only these clause ids (the mutant runner's door); BOUND and LAST always run
// CONTRACT — every plant runs on a COPY of --org under os.tmpdir() (never .git, never node_modules — that rides as a link),
//   with its OWN dressing-room/state (EMPTY but for the plant: nothing of his is copied, nothing printed), its own HOME /
//   USERPROFILE / ARSENAL_ARCHIVE under the same temp root. THE PORT CLASS (row 1053): no fixed port is bound and no live
//   service is named; the sitting door's port is a FREE port with nothing on it (the daemon DOWN), handed through
//   ARSENAL_SITTING_PORT; nothing is POSTed at a live daemon, nothing restarted. A FAKE `claude` (+ claude.cmd) sits FIRST
//   on PATH and logs any spawn (a planted model, never a live call). No git repo is planted (core.autocrlf: nothing is
//   cloned or init'd), every line read from a process is split on \r?\n, BOUND hashes text with CRLF folded to LF, and
//   processes are listed through PowerShell on Windows, `ps` elsewhere. No timeout, budget, size or ratio is typed: SLACK
//   is one node start measured in this run; every wait is bounded by the longest single run measured here plus SLACK.
//   The memory line is planted as THIS box's measured free memory (the F4 key rewritten in the copy — the runner's act),
//   and the free-memory reading is planted through ARSENAL_NIGHT_FREEMEM_MB behind the ARSENAL_NIGHT_STATE_DIR seam.
// CLAUSES (spec ci/mfac/MFAC_SPEC.md on claude/mfac-spec N1-N6; rulings row 1069 F1-F10 + ADDED — the ruling wins):
//   W1.1  one `day.mjs end` on his open sitting → exactly ONE armed row for D in night_log.jsonl
//   W1.2  `end` twice → still ONE armed row (the already path arms nothing)
//   W1.3  `night.mjs wait` on no armed night → still waiting at the bound; after the day end arms → exits 0 naming D
//   W1.4  F1 A: the evening autoclose of a never-ended day arms nothing, and `arm --by evening` REFUSES (only the day end arms)
//   W1.5  static (L6): night.mjs exists and spawns no claude, imports no model resolver, creates no scheduled task
//   F4    the SHIPPED night.mjs carries NIGHT_CONFIG.memory_floor_mb = FLOOR_UNSET and `may --act launch` answers NO floor-unset
//   W2.1  armed ∧ begun ∧ no sitting ∧ memory at the line → `may --act launch` GO, exit 0
//   W2.2  the same with a sitting OPEN → NO sitting-open, exit 1
//   W2.3  `may` before any arm → NO not-armed
//   W2.4  ADDED (ii): `may --act land` → NO land-attended even when launch is GO
//   W3.1  ADDED (ii): `mark --kind landed` REFUSED, no landed row; a land-ready night closes with its count and its card
//   W3.2  static: night.mjs moves no ref (no push / force / merge verb), never names the landing verb (its land.mjs
//         did-not-touch conjunct lives in BOUND: unit ms1, forks row 1119 (3)(b), the third ADDED edit)
//   W4.1  `stop --reason pool` (F3 A, the runner's gate) → NO stopped:pool
//   W4.2  the free-memory plant under the line → NO memory, and a stopped row with reason memory
//   W4.3  F5 A: `mark --kind red` → the next may says NO
//   W4.4  F6 A: `mark --kind fork` → may still GO; `stop --reason fork` → NO
//   W4.5  F9 A: a learn start (`day.mjs start`) after begin → the night is closed (stopped learn-start) and may says NO
//   W5.1  a planted night (armed by end, begun, 2 launches, 1 land-ready, stopped done) + `day.mjs start` → exactly ONE ^NIGHT line
//   W5.2  the same → exactly ONE live night:<D> card on the deck; start twice → still one
//   W5.3  a night with nothing waiting → zero night cards
//   W5.4  a day with no armed night → `day.mjs start` prints zero NIGHT lines and `night.mjs line` is silent
//   W5.5  names-gate: every night_log row the plants wrote holds only the organ's own keys (no words field, no name key)
//   W6.2  the ONE line counts every launch mark (a spend the runner made is visible in the morning)
//   W7    row 1100 (2), FORK 1 ruled the package.json way: `node scripts/night.mjs selftest` sits in exactly ONE suite string
//         of package.json, and organism_test.mjs carries no OWN_MEMBERS list
//   W8    row 1069 F10 A / row 1100 (4): .claude/skills/runner/SKILL.md carries THE NIGHT section naming the wait, begin,
//         `may --act launch`, the land-ready ceiling and the stops; day.mjs's header list names step 5a (row 1100 (3))
//   W9    row 1100 (1): `day.mjs start` runs BOTH owner calls — the pool line (usage_tap.mjs need) rides the start line AND
//         the night closes with its ONE line
//   BOUND only the named files differ from --base-org (ci/mfac/** is this unit's own output)
//   LAST  no node process naming the temp root survives (fake-claude spawns are counted and printed, planted)
// LAST LINE: GREEN MFAC <what> · <n> clause(s) (exit 0) or RED MFAC · <clauses> (exit 1)
// ============================================================================
import { cpSync, mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, symlinkSync, chmodSync } from "node:fs";
import { join, resolve, relative, sep, delimiter } from "node:path";
import { tmpdir, freemem } from "node:os";
import { spawnSync, spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { createServer } from "node:net";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null, BASE_ORG = arg("--base-org") ? resolve(arg("--base-org")) : null;
const ONLY = arg("--only") ? arg("--only").split(",") : null;
if (!ORG || !existsSync(join(ORG, "scripts", "day.mjs"))) { console.log("RED MFAC · USAGE (--org <dir> with scripts/day.mjs)"); process.exit(1); }
const NAMED = ["scripts/night.mjs", "scripts/day.mjs", "package.json", ".claude/skills/runner/SKILL.md", ".gitignore"];
const SKIP_TOP = new Set([".git", "node_modules"]);
const ROOT = mkdtempSync(join(tmpdir(), "mfac-wit-"));
const slash = (p) => p.split(sep).join("/");
const results = [];
const clause = (id, ok, why) => { results.push({ id, ok: !!ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id} · ${why}`); };
const want = (id) => !ONLY || ONLY.includes(id);
const t0 = Date.now(); spawnSync(process.execPath, ["-e", "0"]); const SLACK = Math.max(1, Date.now() - t0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = () => new Promise((res) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });
const lines = (s) => String(s || "").split(/\r?\n/).filter((l) => l.trim());
const istDay = (d = new Date()) => new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 10);
const lf = (b) => b.toString("utf8").replace(/\r\n/g, "\n");

function copyOrg(src, dst) {
  cpSync(src, dst, { recursive: true, filter: (p) => {
    const rel = slash(relative(src, p));
    if (!rel) return true;
    if (SKIP_TOP.has(rel.split("/")[0])) return false;
    return !(rel === "dressing-room/state" || rel.startsWith("dressing-room/state/")) && !/\.log$/.test(rel);
  } });
  if (existsSync(join(src, "node_modules"))) symlinkSync(join(src, "node_modules"), join(dst, "node_modules"), "junction");
}
const FAKE = join(ROOT, "fakebin"), CLAUDE_LOG = join(ROOT, "claude_spawns.log");
mkdirSync(FAKE, { recursive: true });
writeFileSync(join(FAKE, "claude"), `#!/bin/sh\necho "spawn $*" >> "$MFAC_FAKE_CLAUDE_LOG"\nexit 1\n`);
chmodSync(join(FAKE, "claude"), 0o755);
writeFileSync(join(FAKE, "claude.cmd"), `@echo spawn %* >> "%MFAC_FAKE_CLAUDE_LOG%"\r\n@exit /b 1\r\n`);
const COPY = join(ROOT, "org");
copyOrg(ORG, COPY);
const STATE = join(COPY, "dressing-room", "state");
const NIGHT_SRC = join(COPY, "scripts", "night.mjs");
const HAS_NIGHT = existsSync(NIGHT_SRC);
const SHIPPED = HAS_NIGHT ? readFileSync(NIGHT_SRC, "utf8") : "";
const FLOOR_MB = Math.floor(freemem() / 1048576);   // the plant's memory line: this box, measured now
let GEN = 0, PORT = 0, HOME = "", ARCHIVE = "", MAXMS = 0, MEM = String(FLOOR_MB);
async function fresh() {
  rmSync(STATE, { recursive: true, force: true }); mkdirSync(STATE, { recursive: true });
  GEN++; HOME = join(ROOT, `home-${GEN}`); ARCHIVE = join(ROOT, `archive-${GEN}`); mkdirSync(HOME, { recursive: true });
  PORT = await freePort();   // nothing listens on it: the daemon is DOWN
  MEM = String(FLOOR_MB);
}
function env(extra = {}) {
  const e = { ...process.env };
  for (const k of Object.keys(e)) if (/^ARSENAL_|^CLAUDE_CODE_/.test(k) || k === "ANTHROPIC_API_KEY") delete e[k];
  const pathKey = Object.keys(e).find((k) => k.toUpperCase() === "PATH") || "PATH";
  return { ...e, [pathKey]: `${FAKE}${delimiter}${e[pathKey] || ""}`, TZ: "Asia/Kolkata", HOME, USERPROFILE: HOME, ARSENAL_ARCHIVE: ARCHIVE,
    ARSENAL_SITTING_PORT: String(PORT), ARSENAL_NIGHT_STATE_DIR: STATE, ARSENAL_NIGHT_FREEMEM_MB: MEM, MFAC_FAKE_CLAUDE_LOG: CLAUDE_LOG, ...extra };
}
function node(args, { sid = null, extra = {} } = {}) {
  const t = Date.now();
  const r = spawnSync(process.execPath, args.map((a, i) => (i === 0 ? join(COPY, a) : a)), { cwd: COPY, encoding: "utf8", windowsHide: true, env: env({ ...(sid ? { CLAUDE_CODE_SESSION_ID: sid } : {}), ...extra }) });
  const ms = Date.now() - t; if (ms > MAXMS) MAXMS = ms;
  return { status: r.status, stdout: String(r.stdout || ""), stderr: String(r.stderr || ""), ms };
}
const night = (...a) => node(["scripts/night.mjs", ...a]);
const startDay = (sid) => node(["scripts/day.mjs", "start", "--session", sid, "--by", "hand"], { sid });
const endDay = (sid) => node(["scripts/day.mjs", "end"], { sid });
const readJ = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const rows = () => { try { return lines(readFileSync(join(STATE, "night_log.jsonl"), "utf8")).map((l) => JSON.parse(l)); } catch { return []; } };
const armed = (D) => rows().filter((r) => r.kind === "armed" && r.day === D);
const nightCards = (D) => { const c = readJ(join(STATE, "captains_call.json")); return c && Array.isArray(c.cards) ? c.cards.filter((x) => x.key === `night:${D}` && !x.retired_at && !x.answer) : []; };
const nightLines = (s) => lines(s).filter((l) => l.startsWith("NIGHT "));
const plantFloor = () => { if (HAS_NIGHT) writeFileSync(NIGHT_SRC, SHIPPED.replace(/memory_floor_mb: FLOOR_UNSET/, `memory_floor_mb: ${FLOOR_MB}`)); };
const plantSitting = (open) => writeFileSync(join(STATE, "sitting.json"), JSON.stringify(open ? { id: `s-${GEN}`, opened_at: new Date().toISOString() } : { id: `s-${GEN}`, opened_at: new Date().toISOString(), closed_at: new Date().toISOString() }));
/** a night armed by the REAL day end, begun by a runner — the shared plant */
async function armedNight() {
  await fresh();
  const sid = randomUUID();
  startDay(sid);
  const e = endDay(sid);
  const b = night("begin", "--runner", "runner");
  return { sid, e, b, D: istDay() };
}
const listing = () => (process.platform === "win32"
  ? spawnSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true })
  : spawnSync("ps", ["-eo", "args"], { encoding: "utf8" }));
const survivors = () => lines(listing().stdout).filter((l) => l.includes(ROOT) && !/\bps -eo\b/.test(l));

console.log(`witness mfac · org ${ORG} · slack ${SLACK} ms (one node start, measured) · day ${istDay()} (IST) · night.mjs ${HAS_NIGHT ? "present" : "ABSENT"}`);
const kids = [];
let exitCode = 1;
try {
  const D = istDay();

  // ── F4 — the shipped placeholder refuses (before the floor is planted) ──────────────────────────────────────────────
  if (want("F4")) {
    await fresh();
    const m = night("may", "--act", "launch");
    clause("F4", HAS_NIGHT && /memory_floor_mb: FLOOR_UNSET/.test(SHIPPED) && m.status === 1 && /^NO floor-unset/.test(lines(m.stdout)[0] || ""),
      `shipped key ${/memory_floor_mb: FLOOR_UNSET/.test(SHIPPED) ? "FLOOR_UNSET" : "absent/typed"} · may → ${(lines(m.stdout)[0] || lines(m.stderr).at(-1) || "").slice(0, 60)} (exit ${m.status})`);
  }
  plantFloor();   // the runner's act before the land branch, in the copy only

  if (want("W1.1") || want("W1.2") || want("W6.2")) {
    await fresh();
    const sid = randomUUID();
    startDay(sid);
    const e1 = endDay(sid);
    const a1 = armed(D).length;
    if (want("W1.1")) clause("W1.1", e1.status === 0 && a1 === 1, `end exit ${e1.status} · armed rows for ${D}: ${a1}`);
    const e2 = endDay(sid);
    if (want("W1.2")) clause("W1.2", e2.status === 0 && /already closed/.test(e2.stdout) && armed(D).length === 1, `armed after the first end: ${a1} · second end ${/already closed/.test(e2.stdout) ? "already" : "not already"} · armed rows: ${armed(D).length}`);
    if (want("W6.2")) {
      night("begin", "--runner", "runner");
      night("mark", "--kind", "launch", "--unit", "ua"); night("mark", "--kind", "launch", "--unit", "ub"); night("mark", "--kind", "launch", "--unit", "uc");
      const l = night("line");
      clause("W6.2", / · 3 launched · /.test(lines(l.stdout)[0] || ""), `line → ${(lines(l.stdout)[0] || "(none)").slice(0, 90)}`);
    }
  }

  if (want("W1.3")) {
    await fresh();
    const sid = randomUUID();
    startDay(sid);
    const before = new Date(Date.now() - SLACK).toISOString();
    const w = spawn(process.execPath, [join(COPY, "scripts", "night.mjs"), "wait", "--since", before], { cwd: COPY, env: env(), windowsHide: true });
    kids.push(w);
    let out = "", code = null;
    w.stdout.on("data", (d) => { out += d; });
    w.on("exit", (c) => { code = c; });
    const bound = () => MAXMS + SLACK;
    await sleep(bound());
    const stillWaiting = code === null;
    endDay(sid);
    const end = Date.now() + bound();
    while (code === null && Date.now() < end) await sleep(SLACK);
    clause("W1.3", HAS_NIGHT && stillWaiting && code === 0 && new RegExp(`ARMED ${D}`).test(out), `waiting before arm: ${stillWaiting} · after the day end: exit ${code} · ${lines(out).at(-1) || "(nothing)"}`);
    if (code === null) w.kill();
  }

  if (want("W1.4")) {
    await fresh();
    const a = node(["scripts/postmatch.mjs", "autoclose", "--date", D, "--anchor", "evening"]);
    const r = night("arm", "--day", D, "--by", "evening");
    clause("W1.4", HAS_NIGHT && armed(D).length === 0 && r.status === 1 && /REFUSED — only the day end arms/.test(r.stdout),
      `autoclose evening exit ${a.status} · armed rows ${armed(D).length} · arm --by evening → ${(lines(r.stdout)[0] || lines(r.stderr).at(-1) || "").slice(0, 70)}`);
  }

  if (want("W1.5")) {
    const body = HAS_NIGHT ? SHIPPED.slice(0, SHIPPED.indexOf("async function selftest(")) : "";
    clause("W1.5", HAS_NIGHT && body.length > 0 && !/spawn\w*\(\s*["'`]claude|models\.mjs|schtasks|ANTHROPIC/.test(body),
      HAS_NIGHT ? "night.mjs spawns no claude, imports no model resolver, names no scheduled task" : "night.mjs absent");
  }

  if (want("W2.1") || want("W2.4")) {
    const { b } = await armedNight();
    const m = night("may", "--act", "launch");
    if (want("W2.1")) clause("W2.1", b.status === 0 && m.status === 0 && /^GO launch/.test(lines(m.stdout)[0] || ""), `begin exit ${b.status} · may → ${(lines(m.stdout)[0] || lines(m.stderr).at(-1) || "").slice(0, 60)} (exit ${m.status})`);
    if (want("W2.4")) { const l = night("may", "--act", "land"); clause("W2.4", m.status === 0 && l.status === 1 && /^NO land-attended/.test(lines(l.stdout)[0] || ""), `launch exit ${m.status} · land → ${(lines(l.stdout)[0] || "").slice(0, 50)} (exit ${l.status})`); }
  }
  if (want("W2.2")) {
    await armedNight();
    plantSitting(true);
    const m = night("may", "--act", "launch");
    clause("W2.2", m.status === 1 && /^NO sitting-open/.test(lines(m.stdout)[0] || ""), `may → ${(lines(m.stdout)[0] || lines(m.stderr).at(-1) || "").slice(0, 60)} (exit ${m.status})`);
  }
  if (want("W2.3")) {
    await fresh();
    const m = night("may", "--act", "launch");
    clause("W2.3", m.status === 1 && /^NO not-armed/.test(lines(m.stdout)[0] || ""), `may → ${(lines(m.stdout)[0] || lines(m.stderr).at(-1) || "").slice(0, 60)} (exit ${m.status})`);
  }

  if (want("W3.1")) {
    const { sid } = await armedNight();
    const ld = night("mark", "--kind", "landed", "--unit", "ux");
    night("mark", "--kind", "land-ready", "--unit", "ux");
    const s = startDay(sid);
    const nl = nightLines(s.stdout);
    clause("W3.1", ld.status === 1 && !rows().some((r) => r.mark === "landed") && nl.length === 1 && / 1 land-ready \(no landing at night\) · 1 waiting for you /.test(nl[0]) && nightCards(D).length === 1,
      `landed mark exit ${ld.status} · line → ${(nl[0] || "(none)").slice(0, 110)} · night cards ${nightCards(D).length}`);
  }
  if (want("W3.2")) {
    const body = HAS_NIGHT ? SHIPPED.slice(0, SHIPPED.indexOf("async function selftest(")) : "";
    clause("W3.2", HAS_NIGHT && body.length > 0 && !/["'`](push|merge|--force|update-ref|reset)["'`]|git push|land\.mjs/.test(body),
      `${HAS_NIGHT ? "night.mjs moves no ref, names no landing verb" : "night.mjs absent"}`);
  }

  if (want("W4.1")) {
    await armedNight();
    const s = night("stop", "--reason", "pool");
    const m = night("may", "--act", "launch");
    clause("W4.1", s.status === 0 && m.status === 1 && /^NO stopped:pool/.test(lines(m.stdout)[0] || ""), `stop exit ${s.status} · may → ${(lines(m.stdout)[0] || "").slice(0, 50)}`);
  }
  if (want("W4.2")) {
    await armedNight();
    MEM = "0";
    const m = night("may", "--act", "launch");
    const st = rows().find((r) => r.kind === "stopped");
    clause("W4.2", m.status === 1 && /^NO memory/.test(lines(m.stdout)[0] || "") && st && st.reason === "memory", `may → ${(lines(m.stdout)[0] || "").slice(0, 50)} · stopped row ${st ? st.reason : "none"}`);
  }
  if (want("W4.3")) {
    await armedNight();
    night("mark", "--kind", "red", "--unit", "ur");
    const m = night("may", "--act", "launch");
    clause("W4.3", m.status === 1 && /^NO (stopped:red|red)/.test(lines(m.stdout)[0] || ""), `after a red mark, may → ${(lines(m.stdout)[0] || "").slice(0, 50)}`);
  }
  if (want("W4.4")) {
    await armedNight();
    night("mark", "--kind", "fork", "--unit", "uf");
    const m1 = night("may", "--act", "launch");
    night("stop", "--reason", "fork");
    const m2 = night("may", "--act", "launch");
    clause("W4.4", m1.status === 0 && m2.status === 1 && /^NO stopped:fork/.test(lines(m2.stdout)[0] || ""), `after a fork mark → ${(lines(m1.stdout)[0] || "").slice(0, 30)} · after stop fork → ${(lines(m2.stdout)[0] || "").slice(0, 30)}`);
  }
  if (want("W4.5")) {
    const { sid } = await armedNight();
    const m0 = night("may", "--act", "launch");
    startDay(sid);
    const m = night("may", "--act", "launch");
    const st = rows().find((r) => r.kind === "stopped"), cl = rows().find((r) => r.kind === "closed");
    clause("W4.5", m0.status === 0 && m.status === 1 && st && st.reason === "learn-start" && cl && cl.by === "learn-start", `before → ${(lines(m0.stdout)[0] || "").slice(0, 20)} · after the learn start → ${(lines(m.stdout)[0] || "").slice(0, 40)} · stopped ${st ? st.reason : "none"} · closed ${cl ? "yes" : "no"}`);
  }

  if (want("W5.1") || want("W5.2") || want("W5.5")) {
    const { sid } = await armedNight();
    night("mark", "--kind", "launch", "--unit", "u1"); night("mark", "--kind", "launch", "--unit", "u2"); night("mark", "--kind", "land-ready", "--unit", "u1");
    night("stop", "--reason", "done");
    const s1 = startDay(sid);
    const nl = nightLines(s1.stdout);
    if (want("W5.1")) clause("W5.1", nl.length === 1 && new RegExp(`^NIGHT ${D}: begun · 2 launched · 0 returned · 1 land-ready \\(no landing at night\\) · 1 waiting for you · stopped: done$`).test(nl[0]), `NIGHT lines ${nl.length} · ${(nl[0] || "(none)").slice(0, 120)}`);
    const c1 = nightCards(D).length;
    const s2 = startDay(sid);
    if (want("W5.2")) clause("W5.2", c1 === 1 && nightCards(D).length === 1 && nightLines(s2.stdout).length === 0, `night cards after start ${c1} · after a second start ${nightCards(D).length} · second start NIGHT lines ${nightLines(s2.stdout).length}`);
    if (want("W5.5")) {
      const KEYS = new Set(["ts", "day", "kind", "by", "runner", "mark", "unit", "note", "reason", "card"]);
      const rs = rows(), extra = [...new Set(rs.flatMap((r) => Object.keys(r).filter((k) => !KEYS.has(k))))];
      clause("W5.5", rs.length > 0 && extra.length === 0, `${rs.length} row(s) · keys outside the organ's own: ${extra.join(",") || "none"}`);
    }
  }
  if (want("W5.3")) {
    const { sid } = await armedNight();
    night("mark", "--kind", "launch", "--unit", "u1"); night("mark", "--kind", "return", "--unit", "u1");
    const s = startDay(sid);
    clause("W5.3", nightLines(s.stdout).length === 1 && nightCards(D).length === 0 && rows().some((r) => r.kind === "closed" && r.card === "none"), `NIGHT lines ${nightLines(s.stdout).length} · night cards ${nightCards(D).length}`);
  }
  if (want("W5.4")) {
    await fresh();
    const s = startDay(randomUUID());
    const l = night("line");
    clause("W5.4", HAS_NIGHT && l.status === 0 && lines(l.stdout).length === 0 && nightLines(s.stdout).length === 0, `start NIGHT lines ${nightLines(s.stdout).length} · line exit ${l.status} · ${lines(l.stdout).length} line(s)`);
  }

  if (want("W7")) {
    const pkg = readJ(join(COPY, "package.json")) || { scripts: {} };
    const hits = ["organism:selftest", "squad:selftest", "audit:selftest"].map((k) => (String(pkg.scripts[k] || "").match(/node scripts\/night\.mjs selftest/g) || []).length);
    const ot = readFileSync(join(COPY, "scripts", "organism_test.mjs"), "utf8");
    clause("W7", hits.reduce((a, b) => a + b, 0) === 1 && !/OWN_MEMBERS/.test(ot), `night.mjs selftest in suites: ${hits.join("/")} · organism_test OWN_MEMBERS ${/OWN_MEMBERS/.test(ot) ? "PRESENT" : "absent"}`);
  }
  if (want("W8")) {
    const sk = existsSync(join(COPY, ".claude", "skills", "runner", "SKILL.md")) ? readFileSync(join(COPY, ".claude", "skills", "runner", "SKILL.md"), "utf8") : "";
    const sec = sk.slice(Math.max(0, sk.indexOf("## THE NIGHT")));
    const body = sk.includes("## THE NIGHT") ? sec.slice(0, (sec.indexOf("\n## ", 4) + 1 || sec.length + 1) - 1) : "";
    const need = ["night.mjs wait", "night.mjs begin", "may --act launch", "land-ready", "stop --reason", "Never land at night"];
    const miss = need.filter((n) => !body.includes(n));
    const hdr = /^\/\/\s+5a\. night\.mjs arm/m.test(readFileSync(join(COPY, "scripts", "day.mjs"), "utf8"));
    clause("W8", body.length > 0 && miss.length === 0 && hdr, `THE NIGHT section ${body ? "present" : "ABSENT"}${miss.length ? ` · missing: ${miss.join(", ")}` : ""} · day.mjs header step 5a ${hdr ? "named" : "ABSENT"}`);
  }
  if (want("W9")) {
    const { sid } = await armedNight();
    night("mark", "--kind", "land-ready", "--unit", "up");
    const s = startDay(sid);
    const startLine = lines(s.stdout).find((l) => l.startsWith("day: START")) || "";
    clause("W9", / · pool: /.test(startLine) && nightLines(s.stdout).length === 1 && rows().some((r) => r.kind === "closed"), `start line ${/ · pool: /.test(startLine) ? "carries the pool" : "has NO pool"} · NIGHT lines ${nightLines(s.stdout).length} · night ${rows().some((r) => r.kind === "closed") ? "closed" : "NOT closed"}`);
  }

  // ── BOUND — only the named files differ ───────────────────────────────────────────────────────────────────────────
  {
    let ok = false, why = "no --base-org";
    if (BASE_ORG && existsSync(BASE_ORG)) {
      const walk = (top) => { const m = new Map(); const w = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); const rel = slash(relative(top, p)); const head = rel.split("/")[0]; if (SKIP_TOP.has(head) || rel === "dressing-room/state" || rel.startsWith("dressing-room/state/") || rel.startsWith("ci/mfac/") || /\.log$/.test(rel)) continue; if (e.isDirectory()) w(p); else if (e.isFile()) m.set(rel, createHash("sha256").update(lf(readFileSync(p))).digest("hex")); } }; w(top); return m; };
      const a = walk(ORG), b = walk(BASE_ORG);
      const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k));
      const beyond = diff.filter((k) => !NAMED.includes(k));
      // ms1 (row 1119 (3)(b)): W3.2's did-not-touch conjunct is a bound, so it is judged here — land.mjs byte-identical to base
      const landSame = existsSync(join(BASE_ORG, "scripts", "land.mjs")) && lf(readFileSync(join(ORG, "scripts", "land.mjs"))) === lf(readFileSync(join(BASE_ORG, "scripts", "land.mjs")));
      ok = beyond.length === 0 && landSame; why = `differs: ${diff.join(", ") || "nothing"}${beyond.length ? ` · BEYOND THE NAMED: ${beyond.slice(0, 8).join(", ")}` : ""} · land.mjs ${landSame ? "byte-identical to base" : "DIFFERS or unreadable"}`;
    }
    clause("BOUND", ok, why);
  }
} finally {
  for (const k of kids) { try { k.kill(); } catch { /* gone */ } }
  const end = Date.now() + MAXMS + SLACK;
  while (survivors().length && Date.now() < end) await sleep(SLACK);
  const left = survivors();
  const spawns = existsSync(CLAUDE_LOG) ? lines(readFileSync(CLAUDE_LOG, "utf8")).length : 0;
  clause("LAST", left.length === 0, `${left.length} node process(es) naming the temp root · fake-claude spawns ${spawns} (planted)`);
  try { rmSync(ROOT, { recursive: true, force: true }); } catch { /* best effort */ }
  const red = results.filter((r) => !r.ok).map((r) => r.id);
  const n = results.length;
  if (red.length) console.log(`RED MFAC · ${red.join(" ")}`);
  else console.log(`GREEN MFAC the night armed by the day end, held to its stops, closed by the learn start in ONE line · ${n} clause(s)`);
  exitCode = red.length ? 1 : 0;
  process.exit(exitCode);
}
