#!/usr/bin/env node
// ci/mguard/witness_mguard.mjs — THE WITNESS of unit mguard, the spend guard (forks rows 1163 (6) / 1176 / 1177 (3)).
// HEADER = CONTRACT.
//
//   node ci/mguard/witness_mguard.mjs --org <dir> --base-org <dir>
//
// WHAT IT PROVES. Every clause below is planted BOTH WAYS: on a copy of --base-org (the cut) it must be RED, and on a
// copy of --org (the build) it must be GREEN. A clause GREEN on the base is vacuous and reads RED here. The real-day
// judge is --org's own ci/witness/mguard/witness_guard.mjs (the spec's P5 path), run against each planted copy with
// --org <copy>; so a mutant of the judge is judged by this file too.
//
// THE CLAUSES
//   R1176.3  no root variable: the statusline line reads RED by the door's name and names the reading DROPPED; status
//            and verdict read RED by the same name (row 1176 (3), built first)
//   U1177    row 1177 (3): a day whose presence rows record NO away span (AFK truth with no afk, and no AFK truth at all)
//            reads UNREAD by name in the judge, never a day with no spend
//   G1       a day with an AFK stretch and his return → the focus row records away + back_at and the judge finds the
//            closed span; a day where he is still away → the judge reads G1 UNREAD (never green)
//   G2       renders before he leaves (one earlier, at a lower figure) and after he returns → the return line names ONLY
//            the span's spend (+5 / +1, left 55 / 39) and the judge reads G2 HOLDS; a bracket whose edge row is older
//            than the planted age bound → the line reads "spend unread (unbracketed)" and the judge G2 UNREAD
//   G3       the judge finds exactly one writer of the history (the tap); a planted second writer → judge exit 1, G3 RED
//   G4       the return render's history row carries `shown` equal to the read → the judge exits 0; a planted wrong
//            `shown` → judge exit 1, G4 RED
//   LAST     no node process naming the temp dir survives
//
// HOW IT PLANTS (the laws it keeps):
//   · copies, never the trees it is handed: each org's top-level scripts/*.mjs is copied under ONE os.tmpdir() dir; a
//     campaign root (with a planted law home) is planted beside each copy and reached ONLY through ARSENAL_CAMPAIGN_ROOT;
//     the copy's presence ledger (its own dressing-room/state, under the temp dir) is written ONLY by the copy's
//     presence.mjs `sense` (default append) and, for the stale and tamper plants, by this node script — never a shell.
//     No file of the real dressing-room/state is read or written.
//   · THE PORT CLASS (row 1053): no port is bound, no live service is named, nothing is POSTed (sense gets a `post` that
//     returns false), nothing restarted, ActivityWatch is never called (sense gets its events and AFK events injected).
//     No model is called.
//   · every wait is bounded: each child is capped at the job's own timeout-minutes read from --org's
//     .github/workflows/suite.yml (never typed here); the in-plant clock gaps are the MEASURED node start, never typed.
//   · CRLF-proof and Windows-proof: every text is split on \r?\n, every child is process.execPath with argv (no shell);
//     it plants no git repo.
//
// LAST LINE   GREEN MGUARD the spend guard · <n> clause(s)   (exit 0)   or   RED MGUARD · <clauses>   (exit 1)

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, rmSync, appendFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const argOf = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined; };
const ORG = argOf("--org") && resolve(argOf("--org")), BASE = argOf("--base-org") && resolve(argOf("--base-org"));
if (!ORG || !BASE) { console.error("usage: node ci/mguard/witness_mguard.mjs --org <dir> --base-org <dir>"); console.log("RED MGUARD · usage"); process.exit(1); }

// THE RULINGS' VALUES, each cited — the plant needs them; no clause invents one.
const RULED_F4_BOUND_MIN = 5 * 60;        // row 1062 F4: "bound five hours until a row moves it" — planted in the law home
const MIN = 60 * 1000;                    // unit conversion
const TMP = mkdtempSync(join(tmpdir(), "mguard-witness-"));
const children = new Set();
const JUDGE = join(ORG, "ci", "witness", "mguard", "witness_guard.mjs");

// the cap on every child: the job's own bound, read from its home (never typed)
const CAP_MS = (() => {
  try { const m = /timeout-minutes:\s*(\d+)/.exec(readFileSync(join(ORG, ".github", "workflows", "suite.yml"), "utf8")); return m ? Number(m[1]) * MIN : null; } catch { return null; }
})();
// the in-plant clock gap: the slowest of three bare node starts, MEASURED
const GAP_MS = Math.max(...[0, 1, 2].map(() => { const t = Date.now(); spawnSync(process.execPath, ["-e", ""]); return Date.now() - t; }));
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.max(0, ms));
const iso = (ms) => new Date(ms).toISOString();
const readJ = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const lines = (p) => { try { return readFileSync(p, "utf8").split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l)); } catch { return []; } };

// the presence pass, run in a child against a copy's presence.mjs (sense with injected events — never AW, never a POST)
const PASS = join(TMP, "plant_pass.mjs");
writeFileSync(PASS, [
  'import { pathToFileURL } from "node:url";',
  "const [presP, afkJson] = process.argv.slice(2);",
  "const m = await import(pathToFileURL(presP).href);",
  "const afk = JSON.parse(afkJson);",
  "const r = await m.sense({ now: new Date(), events: [], afk, tone: { arousal: \"open\", effects: {} }, signature: m.SIGNATURE, matcher: () => false,",
  "  prevEdge: { edge: false }, prevFocus: { break_live: false }, roll: null, registry: { loaded: true, conceptAlias: new Map(), skillAlias: new Map() }, sprint: null, post: async () => false });",
  "console.log(JSON.stringify({ day: r.focus && r.focus.day, ts: r.focus && r.focus.ts }));",
].join("\n") + "\n");

// the history's home, from the BUILD tap's own export (never typed here)
const TAPMOD = await import(pathToFileURL(join(ORG, "scripts", "usage_tap.mjs")).href).catch(() => null);
const histOf = (root) => (TAPMOD && typeof TAPMOD.historyPath === "function" ? TAPMOD.historyPath(root) : null);

// ── one planted copy per org ─────────────────────────────────────────────────────────────────────────────────────────
function plant(src, label) {
  const at = join(TMP, label), org = join(at, "org");
  mkdirSync(join(org, "scripts"), { recursive: true });
  for (const f of readdirSync(join(src, "scripts"))) if (f.endsWith(".mjs")) copyFileSync(join(src, "scripts", f), join(org, "scripts", f));
  const c = { label, org, at, tap: join(org, "scripts", "usage_tap.mjs"), presence: join(org, "scripts", "presence.mjs"), root: join(at, "root") };
  c.state = join(org, "dressing-room", "state");
  c.plog = join(c.state, "presence_log.jsonl");
  c.fresh = () => {
    rmSync(c.root, { recursive: true, force: true }); rmSync(c.state, { recursive: true, force: true });
    mkdirSync(join(c.root, "tools"), { recursive: true }); mkdirSync(c.state, { recursive: true });
    writeFileSync(join(c.root, "tools", "model_law.mjs"), `// the campaign's law home (planted)\r\nexport const POOL_READING_MAX_AGE_MIN = ${RULED_F4_BOUND_MIN};\r\n`);
  };
  c.env = (withRoot = true) => {
    const e = { ...process.env };
    for (const k of Object.keys(e)) if (/^ARSENAL_/.test(k)) delete e[k];
    if (withRoot) e.ARSENAL_CAMPAIGN_ROOT = c.root;
    return e;
  };
  const run = (argv, { input, env } = {}) => {
    const r = spawnSync(process.execPath, argv, { cwd: c.org, input: input ?? "", env: env || c.env(), encoding: "utf8", timeout: CAP_MS || undefined, windowsHide: true });
    if (r.pid) children.add(r.pid);
    return { code: r.status, out: r.stdout || "", err: r.stderr || "" };
  };
  c.tapRun = (args, o) => run([c.tap, ...args], o);
  c.pass = (afk) => { const r = run([PASS, c.presence, JSON.stringify(afk)]); try { return JSON.parse(r.out.trim().split(/\r?\n/).pop()); } catch { return null; } };
  c.judge = (day) => run([JUDGE, "--day", String(day), "--org", c.org]);
  return c;
}

const epoch = (ms) => Math.floor(ms / 1000);
const RESETS = { five: Date.now() + 120 * MIN, week: Date.now() + 3000 * MIN };   // fixed per run: no reset falls inside any plant
const block = (f, w) => JSON.stringify({ version: "2.1.327", session_id: "witness", rate_limits: { five_hour: { used_percentage: f, resets_at: epoch(RESETS.five) }, seven_day: { used_percentage: w, resets_at: epoch(RESETS.week) } } });
const lastLine = (s) => s.trim().split(/\r?\n/).pop() || "";

/** the main plant: an earlier render, the render before he leaves, an AFK span and his return, the presence pass, the
 *  return render. → { day, line, judge } */
function mainPlant(c) {
  c.fresh();
  c.tapRun(["statusline"], { input: block(30, 50) });
  sleep(GAP_MS);
  c.tapRun(["statusline"], { input: block(40, 60) });
  const T0 = Date.now(), S = T0 + GAP_MS, E = S + GAP_MS;
  const afk = [{ timestamp: iso(S), duration: GAP_MS / 1000, data: { status: "afk" } }, { timestamp: iso(E), duration: GAP_MS / 1000, data: { status: "not-afk" } }];
  sleep(E + GAP_MS - Date.now());
  const p = c.pass(afk);
  const r1 = c.tapRun(["statusline"], { input: block(45, 61) });
  return { day: p && p.day, span: [iso(S), iso(E)], line: lastLine(r1.out), judge: p && p.day ? c.judge(p.day) : { code: null, out: "" } };
}
const EXPECT_LINE = /^five-hour 45% · weekly 61% · back · away \S+–\S+ IST · spent five-hour \+5% weekly \+1% · left five-hour 55% weekly 39%$/;

// ── the clauses ─────────────────────────────────────────────────────────────────────────────────────────────────────
const CLAUSES = [
  ["R1176.3", "no root variable → the statusline reads RED by the door's name and names the reading DROPPED; status and verdict read RED by name", (c) => {
    c.fresh(); const e = c.env(false);
    const s = c.tapRun(["statusline"], { input: block(1, 2), env: e }), st = c.tapRun(["status"], { env: e }), v = c.tapRun(["verdict"], { env: e });
    return s.code === 0 && /^RED · .*ARSENAL_CAMPAIGN_ROOT unset.*DROPPED/.test(lastLine(s.out)) && /five-hour 1%/.test(s.out)
      && st.out.split(/\r?\n/).filter(Boolean).every((l) => /^RED · .*ARSENAL_CAMPAIGN_ROOT unset/.test(l)) && /^RED · .*ARSENAL_CAMPAIGN_ROOT unset/.test(v.out) && v.code === 3;
  }],
  ["U1177", "row 1177 (3): a day with NO away-span rows (AFK truth without afk; no AFK truth) → the judge reads U1177 UNREAD by name, exit 2", (c) => {
    const one = (afk) => {
      c.fresh(); c.tapRun(["statusline"], { input: block(40, 60) });
      const p = c.pass(afk); c.tapRun(["statusline"], { input: block(45, 61) });
      const j = p && p.day ? c.judge(p.day) : null;
      return !!j && j.code === 2 && /^\s*U1177 · UNREAD · no away-span rows/m.test(j.out) && /never a day with no spend/.test(j.out);
    };
    return one([{ timestamp: iso(Date.now() - GAP_MS), duration: GAP_MS / 1000, data: { status: "not-afk" } }]) && one(null);
  }],
  ["G1", "an AFK stretch and his return → the focus row records away + back_at and the judge finds the closed span; still away → G1 UNREAD", (c) => {
    const m = mainPlant(c);
    const row = lines(c.plog).filter((r) => r.kind === "focus").pop();
    const recorded = !!row && Array.isArray(row.away) && row.away.length === 1 && row.away[0][0] === m.span[0] && row.away[0][1] === m.span[1] && row.back_at === m.span[1];
    c.fresh(); c.tapRun(["statusline"], { input: block(40, 60) });
    const p = c.pass([{ timestamp: iso(Date.now() - GAP_MS), duration: GAP_MS / 1000, data: { status: "afk" } }]);
    const j = p && p.day ? c.judge(p.day) : null;
    return recorded && /^\s*G1 · HOLDS/m.test(m.judge.out) && !!j && j.code === 2 && /^\s*G1 · UNREAD/m.test(j.out);
  }],
  ["G2", "renders bracket the span → the return line names ONLY the span's spend and the judge reads G2 HOLDS; a stale edge row → 'spend unread (unbracketed)', G2 UNREAD", (c) => {
    const m = mainPlant(c);
    const fresh = EXPECT_LINE.test(m.line) && /^\s*G2 · HOLDS/m.test(m.judge.out);
    // the stale plant: one history row older than the age bound, a recorded closed span after it, then a render
    c.fresh();
    const hp = histOf(c.root); if (!hp) return false;
    const now = Date.now(), old = now - (RULED_F4_BOUND_MIN + RULED_F4_BOUND_MIN) * MIN;
    const reading = (t, f, w) => ({ v: 1, source: "statusline", read_at: iso(t), five: { pct: f, resets_at: iso(epoch(RESETS.five) * 1000) }, week: { pct: w, resets_at: iso(epoch(RESETS.week) * 1000) }, cli_version: null, session_id: "witness" });
    writeFileSync(hp, JSON.stringify(reading(old, 40, 60)) + "\n");
    const p = c.pass(null); if (!p || !p.day) return false;
    const S = now - (RULED_F4_BOUND_MIN - RULED_F4_BOUND_MIN / 5) * MIN, E = now - RULED_F4_BOUND_MIN / 5 * MIN;
    appendFileSync(c.plog, JSON.stringify({ ts: iso(now), day: p.day, kind: "focus", away: [[iso(S), iso(E)]], back_at: iso(E) }) + "\n");
    const r = c.tapRun(["statusline"], { input: block(45, 61) });
    const j = c.judge(p.day);
    return fresh && /· back · away \S+–\S+ IST · spend unread \(unbracketed\)$/.test(lastLine(r.out)) && j.code === 2 && /^\s*G2 · UNREAD · .*unbracketed/m.test(j.out);
  }],
  ["G3", "the judge finds exactly one writer of the history (the tap); a planted second writer → judge exit 1, G3 RED", (c) => {
    const m = mainPlant(c);
    const rogue = join(c.org, "scripts", "rogue_history_writer.mjs");
    writeFileSync(rogue, 'import { appendFileSync } from "node:fs";\nimport { historyPath } from "./usage_tap.mjs";\nexport const w = (root) => appendFileSync(historyPath(root), "{}\\n");\n');
    let j; try { j = c.judge(m.day); } finally { unlinkSync(rogue); }
    return /^\s*G3 · HOLDS/m.test(m.judge.out) && j.code === 1 && /^\s*G3 · RED/m.test(j.out);
  }],
  ["G4", "the return render's row carries `shown` equal to the read → the judge exits 0; a planted wrong `shown` → judge exit 1, G4 RED", (c) => {
    const m = mainPlant(c);
    const hp = histOf(c.root); if (!hp) return false;
    const H = lines(hp), last = H[H.length - 1];
    const ok = m.judge.code === 0 && /^\s*G4 · HOLDS/m.test(m.judge.out) && !!last && Array.isArray(last.shown) && last.shown.length === 1 && last.shown[0].read === true && last.shown[0].five.spent === 5 && last.shown[0].week.spent === 1;
    if (!ok) return false;
    last.shown[0].five.spent += 7;
    writeFileSync(hp, H.map((r) => JSON.stringify(r)).join("\n") + "\n");
    const j = c.judge(m.day);
    return j.code === 1 && /^\s*G4 · RED/m.test(j.out);
  }],
];

// ── run both ways ───────────────────────────────────────────────────────────────────────────────────────────────────
const bad = [];
const survivors = [];
try {
  console.log(`witness_mguard · node start measured ${GAP_MS} ms (the in-plant clock gap) · child cap ${CAP_MS === null ? "UNREAD" : `${CAP_MS / MIN} min (suite.yml timeout-minutes)`} · tmp ${TMP}`);
  if (CAP_MS === null) bad.push("CAP");
  if (!existsSync(JUDGE)) { console.log("  FAIL the judge is absent at --org (ci/witness/mguard/witness_guard.mjs)"); bad.push("JUDGE"); }
  const build = plant(ORG, "org"), base = plant(BASE, "base");
  if (!bad.length) for (const [id, name, fn] of CLAUSES) {
    let g = false, b = true;
    try { g = !!(await fn(build)); } catch (e) { g = false; console.log(`    (build threw: ${String(e && e.message || e).split(/\r?\n/)[0]})`); }
    try { b = !!(await fn(base)); } catch { b = false; }
    const ok = g && !b;
    if (!ok) bad.push(id);
    console.log(`  ${ok ? "ok  " : "FAIL"} ${id} · build ${g ? "GREEN" : "RED"} · base ${b ? "GREEN (vacuous)" : "RED"} · ${name}`);
  }
} finally {
  // LAST: every child dead; where /proc exists, no node process names the temp dir
  for (const pid of children) { try { process.kill(pid, 0); survivors.push(pid); try { process.kill(pid); } catch { /* gone */ } } catch { /* dead — good */ } }
  if (existsSync("/proc")) {
    for (const p of readdirSync("/proc")) {
      if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
      try { const cl = readFileSync(join("/proc", p, "cmdline"), "utf8"); if (cl.includes(TMP) && /node/.test(cl)) { survivors.push(Number(p)); try { process.kill(Number(p)); } catch { /* gone */ } } } catch { /* raced */ }
    }
  }
  rmSync(TMP, { recursive: true, force: true });
}
console.log(`  ${survivors.length ? "FAIL" : "ok  "} LAST · no node process naming the temp dir survives${survivors.length ? ` (${survivors.join(", ")})` : ""}`);
if (survivors.length) bad.push("LAST");
if (bad.length) { console.log(`RED MGUARD · ${bad.join(", ")}`); process.exit(1); }
console.log(`GREEN MGUARD the spend guard · ${CLAUSES.length + 1} clause(s)`);
process.exit(0);
