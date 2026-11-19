#!/usr/bin/env node
// ============================================================================
// ci/mtail/witness_mtail.mjs — unit mtail (forks rows 1017 (2)-(5) / 1019 (1)): THE JUDGE TAIL — F-B (the close's judge child
// waits the judge budget PLUS the dispatch margin), F-C (the sitting CLI waits the longest close the daemon can take), the ONE
// auth literal at a leaf (claudegen.mjs), and mpm F1 (captureDay has ONE definition, in gaffer_brain.mjs).
// ----------------------------------------------------------------------------
// USAGE: node ci/mtail/witness_mtail.mjs --org <dir> [--base-org <dir>]
//   --org       a repository tree to witness (an LF git-archive tree, ci/mtail/sides.mjs; never his live tree)
//   --base-org  the BASE tree (main d0c8c96): T1's unmoved close budget, T2's OLD wait, T3's cycle count and T4's evidence
//               bytes are read against it, and BOUND needs it; absent, those clauses are RED.
// CONTRACT — every plant runs on its OWN COPY of a tree under os.tmpdir(), with its OWN empty dressing-room/state (only the
//   plant in it), its own HOME / USERPROFILE / ARSENAL_ARCHIVE / ARSENAL_CALL_STATE_DIR / ARSENAL_SITTING_STATE_DIR under the same
//   temp root, TZ=Asia/Kolkata, and a FIXED clock: postmatch's own clock door (ARSENAL_AUTOCLOSE_CLOCK) and deadline door
//   (ARSENAL_AUTOCLOSE_DEADLINE), both honoured only for a copy under os.tmpdir(). A FAKE claude (`claude` and `claude.cmd`)
//   sits FIRST on PATH and logs any spawn: no live model call can happen. The days are in 2099.
//   THE SCALED CLOCK: a budget of minutes cannot be waited out in a witness, so the two time-bound plants run on a clock
//   SCALE times faster: w_preload.mjs arms the organ's OWN timeout (a spawnSync timeout, an AbortSignal.timeout) at 1/SCALE
//   of its value, and the fake child / fake daemon run their planted duration at the same ratio. SCALE is a clock ratio, not
//   a budget. Every duration below is derived from the trees' own exports or source; none is typed.
//   Windows: a node_modules link is a junction; path keys use forward slashes; processes are listed without /proc.
// CLAUSES (each planted both ways — the effect, and its contrast):
//   T1  F-B · a queue-only MORNING close of one 2099 day, judge-due replaced by a FAKE child that runs past the judge budget ALONE
//       (RUN = JUDGE_BUDGET_MS + 3/4 JUDGE_DISPATCH_MS, both read from the tree's gaffer_brain.mjs). P1: the deadline leaves the
//       judge step JUDGE_BUDGET_MS + CHILD_TIMEOUT_MS + 1/4 JUDGE_DISPATCH_MS — the child is either not started (UNSETTLED, by
//       name) or started with a timeout ≥ budget + margin and finishes; never killed. P2 (the contrast): the deadline leaves
//       JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS + CHILD_TIMEOUT_MS + 1/4 JUDGE_DISPATCH_MS — it IS started, timeout ≥ budget + margin,
//       finishes, and the record's JUDGE line is the child's own. autocloseBudget() equals BASE's (the close budget does not move).
//   ~~T2  F-C · a FAKE sitting daemon on its own port answers /close after D = the midpoint of the OLD wait (BASE's typed /close
//       wait, read from its source) and the LONGEST close (the sum of ownerTimeoutMs over the owner(...) steps close() writes,
//       plus the session's close grace read from claudegen.mjs). `sitting.mjs close` must print its real result
//       ("sitting: CLOSED <id> …"), exit 0, its /close wait ≥ LONGEST. Contrast: the same CLI against a daemon that answers at
//       once prints the same result (the wait is not a delay).~~  (struck by unit mrt, forks row 1120 (1) / row 1112 (1))
//   T2  F-C (RE-CUT by unit mrt, forks row 1120 (1): T2 fate (a) RE-BASE, F2 A, naming unit mday rows 1075 / 1078 F10 A — the
//       CLI asks GET /status before it POSTs /close, and the old seam scaled that probe too, so a cold first fetch tripped it) ·
//       a FAKE sitting daemon on its own port answers /close after D = the midpoint of the OLD wait (BASE's typed /close wait,
//       read from its source) and the LONGEST close (the sum of ownerTimeoutMs over the owner(...) steps close() writes, plus
//       the session's close grace read from claudegen.mjs). `sitting.mjs close` must print its real result
//       ("sitting: CLOSED <id> …"), exit 0, its POST /close wait ≥ LONGEST, and its FIRST request is GET /status on its own
//       UNSCALED wait (mday's probe, asserted). Contrast: the same CLI against a daemon that answers at once prints the same
//       result (the wait is not a delay), probe first too. Only the POST /close wait runs on the scaled clock (w_preload.mjs).
//   T3  ONE auth literal · claudegen.mjs exports AUTH_REFUSAL_RE; gaffer_brain.mjs JUDGE_AUTH_RE and brain.mjs AUTH_FAIL_RE are
//       that SAME object; it matches the three observed refusals and no limit wall; no other file in scripts/ carries the OAuth
//       words as a PATTERN (an alternation, a regex literal or its string); ~~the depcruise no-circular count read on both trees
//       does not rise.~~  (struck by unit mrt, forks row 1120 (1) F5 B / row 1112 (1)) RE-CUT by unit mrt, forks row 1120 (1)
//       (T3 fate (b) REPAIR on main, F5 B the edge-set form): the depcruise no-circular count read on both trees does not rise
//       AND every no-circular from→to row of --org is a row of --base-org (a cycle swapped for another does not pass).
//   T4  mpm F1 · captureDay has ONE definition in scripts/ — gaffer_brain.mjs, exported; postmatch.mjs imports it and defines
//       none; the close evidence of mpm reads as before: the same queue-only close (captures either side of an IST midnight)
//       writes a post_match record byte-equal to BASE's, naming exactly the captures of that IST day.
//   BOUND --org differs from --base-org ONLY in the five named files (scripts/postmatch.mjs, sitting.mjs, gaffer_brain.mjs,
//       brain.mjs, claudegen.mjs); ci/mtail/** is this unit's own output and .claude/settings.json the seat's effort key, both
//       left out by name.
//   LAST no node process naming the temp root survives, and the fake claude logged no spawn.
// LAST LINE: GREEN MTAIL the judge tail · <n> clause(s)  (exit 0)  ·  RED MTAIL · <clauses>  (exit 1)
// ============================================================================
import { cpSync, mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, statSync, symlinkSync, chmodSync } from "node:fs";
import { join, resolve, relative, sep, delimiter, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PRELOAD = pathToFileURL(join(HERE, "w_preload.mjs")).href;
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? resolve(process.argv[i + 1]) : null; };
const ORG = arg("--org"), BASE_ORG = arg("--base-org");
if (!ORG || !existsSync(join(ORG, "scripts", "postmatch.mjs"))) { console.log("RED MTAIL · USAGE (--org <dir> with scripts/postmatch.mjs)"); process.exit(1); }

const SCALE = 100;   // THE CLOCK RATIO of the two time-bound plants (see the header): a ratio, never a budget
const NAMED = ["scripts/postmatch.mjs", "scripts/sitting.mjs", "scripts/gaffer_brain.mjs", "scripts/brain.mjs", "scripts/claudegen.mjs"];
const D = "2099-04-10";
const MORN = (d) => `${new Date(Date.parse(`${d}T00:00:00.000Z`) + 86400000).toISOString().slice(0, 10)}T02:00:00.000Z`;
const SKIP_TOP = new Set([".git", "node_modules"]);
const ROOT = mkdtempSync(join(tmpdir(), "mtail-wit-"));
const results = [];
const clause = (id, ok, why) => { results.push({ id, ok: !!ok }); console.log(`  ${ok ? "ok  " : "RED "} ${id} · ${why}`); };
const slash = (p) => p.split(sep).join("/");
const sha = (b) => createHash("sha256").update(b).digest("hex");
const read = (f) => (existsSync(f) ? readFileSync(f, "utf8") : null);
const rows = (f) => (read(f) || "").split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const codeOf = (t) => String(t || "").replace(/\r\n/g, "\n").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

// the fake claude, first on PATH (a .cmd beside it for Windows)
const FAKE = join(ROOT, "fakebin"), CLAUDE_LOG = join(ROOT, "claude_spawns.log");
mkdirSync(FAKE, { recursive: true });
writeFileSync(join(FAKE, "claude"), `#!/bin/sh\necho "spawn $*" >> "$MTAIL_FAKE_CLAUDE_LOG"\nexit 1\n`);
chmodSync(join(FAKE, "claude"), 0o755);
writeFileSync(join(FAKE, "claude.cmd"), `@echo spawn %* >> "%MTAIL_FAKE_CLAUDE_LOG%"\r\n@exit /b 1\r\n`);

let seq = 0;
/** a fresh copy of `src` with its own empty state dir, and `queue` planted as the gaffer grade queue; `keep` names TRACKED
 *  declaration files of the tree's state dir a plant needs to import an organ (brain.mjs reads registry.json at import) */
function copyOf(src, tag, queue = [], keep = []) {
  const dst = join(ROOT, `${tag}-${++seq}`);
  cpSync(src, dst, { recursive: true, filter: (p) => {
    const rel = slash(relative(src, p));
    if (!rel) return true;
    if (SKIP_TOP.has(rel.split("/")[0])) return false;
    return !(rel === "dressing-room/state" || rel.startsWith("dressing-room/state/"));
  } });
  const st = join(dst, "dressing-room", "state");
  mkdirSync(st, { recursive: true });
  if (existsSync(join(src, "node_modules"))) symlinkSync(join(src, "node_modules"), join(dst, "node_modules"), "junction");
  if (queue.length) writeFileSync(join(st, "gaffer_grade_queue.jsonl"), queue.map((r) => JSON.stringify(r)).join("\n") + "\n");
  for (const f of keep) { const from = join(src, "dressing-room", "state", f); if (existsSync(from)) cpSync(from, join(st, f)); }
  return dst;
}
function envFor(copy, extra = {}) {
  const tag = slash(relative(ROOT, copy)).replace(/\//g, "_");
  const home = join(ROOT, `home-${tag}`);
  mkdirSync(home, { recursive: true });
  const e = { ...process.env };
  for (const k of ["ANTHROPIC_API_KEY", "ARSENAL_DAY_KEY", "ARSENAL_AUTOCLOSE_DEADLINE", "ARSENAL_AUTOCLOSE_CLOCK", "ARSENAL_ORGAN", "NODE_OPTIONS"]) delete e[k];
  const pathKey = Object.keys(e).find((k) => k.toUpperCase() === "PATH") || "PATH";
  return { ...e, [pathKey]: `${FAKE}${delimiter}${e[pathKey] || ""}`, HOME: home, USERPROFILE: home, TZ: "Asia/Kolkata",
    ARSENAL_ARCHIVE: join(ROOT, `archive-${tag}`), ARSENAL_CALL_STATE_DIR: join(copy, "dressing-room", "state"),
    ARSENAL_SITTING_STATE_DIR: join(copy, "dressing-room", "state"), MTAIL_FAKE_CLAUDE_LOG: CLAUDE_LOG, ...extra };
}
/** the tree's own exports, read in a child inside the copy (nothing is imported into the witness itself) */
function exportsOf(copy, spec) {
  const code = `const out = {}; for (const [f, names] of Object.entries(${JSON.stringify(spec)})) { let m = {}; try { m = await import(new URL("./scripts/" + f, "${pathToFileURL(copy + "/").href}").href); } catch (e) { out[f + ":error"] = String(e && e.message || e).slice(0, 200); } for (const n of names) { const v = m[n]; out[f + ":" + n] = typeof v === "function" ? (n.endsWith("Ms") || n === "autocloseBudget" ? v() : "function") : v instanceof RegExp ? { re: v.source, flags: v.flags } : v === undefined ? null : v; } } console.log(JSON.stringify(out));`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", code], { cwd: copy, encoding: "utf8", env: envFor(copy), windowsHide: true });
  try { return JSON.parse(String(r.stdout || "").trim().split(/\r?\n/).at(-1)); } catch { return { error: `${r.status} ${String(r.stderr || "").slice(0, 200)}` }; }
}
const capture = (id, ts, day) => ({ kind: "capture", id, type: "axis_weld", ref: `witness:${id}`, spoken: "planted", ts, day });
function closeOnce(copy, { dlMs = null, runMs }) {
  const LOG = join(ROOT, `spawns-${slash(relative(ROOT, copy)).replace(/\//g, "_")}.jsonl`);
  const clock = MORN(D);
  const extra = { ARSENAL_AUTOCLOSE_CLOCK: clock, MTAIL_SPAWN_LOG: LOG, MTAIL_SCALE: String(SCALE), MTAIL_JUDGE_RUN_MS: String(runMs) };
  if (dlMs !== null) extra.ARSENAL_AUTOCLOSE_DEADLINE = new Date(Date.parse(clock) + dlMs).toISOString();
  const r = spawnSync(process.execPath, ["--import", PRELOAD, join(copy, "scripts", "postmatch.mjs"), "autoclose", "--date", D, "--anchor", "morning"],
    { cwd: copy, encoding: "utf8", env: envFor(copy, extra), windowsHide: true, input: "" });
  const rec = read(join(copy, "dressing-room", "state", "post_match", `${D}.md`));
  return { status: r.status, out: String(r.stdout || ""), err: String(r.stderr || ""), spawns: rows(LOG), rec, judgeLine: ((rec || "").match(/^JUDGE: .*$/m) || [""])[0] };
}

let exitCode = 1;
const live = [];
try {
  const K = { "gaffer_brain.mjs": ["JUDGE_BUDGET_MS", "JUDGE_DISPATCH_MS", "JUDGE_AUTH_RE", "captureDay"], "postmatch.mjs": ["CHILD_TIMEOUT_MS", "autocloseBudget"],
    "claudegen.mjs": ["AUTH_REFUSAL_RE", "SESSION_CLOSE_MS"], "sitting.mjs": ["ownerTimeoutMs", "closeWaitMs"] };
  const kOrg = exportsOf(copyOf(ORG, "k"), K);
  const kBase = BASE_ORG ? exportsOf(copyOf(BASE_ORG, "kb"), K) : {};
  const JB = kOrg["gaffer_brain.mjs:JUDGE_BUDGET_MS"], JD = kOrg["gaffer_brain.mjs:JUDGE_DISPATCH_MS"], CH = kOrg["postmatch.mjs:CHILD_TIMEOUT_MS"];
  const constsOk = [JB, JD, CH].every((v) => Number.isSafeInteger(v) && v > 0);

  // ── T1 · F-B ──
  {
    const RUN = JB + (3 * JD) / 4;
    const q = [capture("t1-a", `${D}T05:00:00.000Z`, D)];
    const p1 = closeOnce(copyOf(ORG, "t1p1", q), { dlMs: JB + CH + JD / 4, runMs: RUN });
    const p2 = closeOnce(copyOf(ORG, "t1p2", q), { dlMs: JB + JD + CH + JD / 4, runMs: RUN });
    const j1 = p1.spawns.filter((s) => s.kind === "judge"), j2 = p2.spawns.filter((s) => s.kind === "judge");
    const finished = (s) => s.status === 0 && !s.signal && !s.error;
    const p1ok = p1.status === 0 && (j1.length === 0 ? /^JUDGE: UNSETTLED · not reached/.test(p1.judgeLine) : j1.every((s) => s.timeout >= JB + JD && finished(s)));
    const p2ok = p2.status === 0 && j2.length === 1 && j2[0].timeout >= JB + JD && finished(j2[0]) && /^JUDGE: NOT DUE · gaffer_brain: not due \(day\.close\) — the witness's planted fake judge child/.test(p2.judgeLine);
    const budgetSame = BASE_ORG && kOrg["postmatch.mjs:autocloseBudget"] === kBase["postmatch.mjs:autocloseBudget"] && Number.isSafeInteger(kOrg["postmatch.mjs:autocloseBudget"]);
    const show = (j, p) => (j.length ? `spawned, timeout ${j[0].timeout} ms, ${finished(j[0]) ? "finished" : `KILLED (${j[0].error || j[0].signal || j[0].status})`}` : `not started (${p.judgeLine.slice(0, 60) || `exit ${p.status} ${p.err.trim().split(/\r?\n/).at(-1)}`})`);
    clause("T1 F-B", constsOk && RUN > JB && RUN < JB + JD && p1ok && p2ok && budgetSame,
      `fake child runs ${RUN} ms (> budget ${JB}, < budget + margin ${JB + JD}) · P1 (judge step left budget + card + ¼ margin): ${show(j1, p1)} · P2 (left budget + margin + card + ¼ margin): ${show(j2, p2)} · close budget ${kOrg["postmatch.mjs:autocloseBudget"]} vs BASE ${BASE_ORG ? kBase["postmatch.mjs:autocloseBudget"] : "(no --base-org)"}`);
  }

  // ── T2 · F-C ──
  {
    const own = read(join(ORG, "scripts", "sitting.mjs")) || "";
    const base = BASE_ORG ? read(join(BASE_ORG, "scripts", "sitting.mjs")) || "" : "";
    const oldM = /post\("\/close", \{[^}]*\}, (\d+)\)/.exec(base);
    const OLD = oldM ? Number(oldM[1]) : null;
    const c0 = own.indexOf("  async function close({ reason"), body = c0 < 0 ? "" : own.slice(c0, own.indexOf("\n  }\n", c0));
    const steps = [...body.matchAll(/owner\("([^"]+)", \[("[^"]+")/g)].map((m) => [m[1], JSON.parse(m[2])]);
    const cg = read(join(ORG, "scripts", "claudegen.mjs")) || "";
    const graceM = /^const SESSION_CLOSE_MS = (\d+);/m.exec(cg) || /resolve\(null\); \}, (\d+)\);/.exec(cg);
    const grace = graceM ? Number(graceM[1]) : null;
    const kc = copyOf(ORG, "t2k");
    const tm = (() => { const code = `const m = await import(new URL("./scripts/sitting.mjs", "${pathToFileURL(kc + "/").href}").href); console.log(JSON.stringify(${JSON.stringify(steps)}.map(([f, v]) => m.ownerTimeoutMs(f, [v]))));`;
      const r = spawnSync(process.execPath, ["--input-type=module", "-e", code], { cwd: kc, encoding: "utf8", env: envFor(kc), windowsHide: true }); try { return JSON.parse(String(r.stdout).trim().split(/\r?\n/).at(-1)); } catch { return null; } })();
    const LONGEST = Array.isArray(tm) && grace !== null && tm.every(Number.isSafeInteger) ? tm.reduce((a, b) => a + b, 0) + grace : null;
    const DUR = OLD !== null && LONGEST !== null ? Math.round((OLD + LONGEST) / 2) : null;
    const runCli = (delayMs) => new Promise((done) => {
      const copy = copyOf(ORG, "t2");
      const ALOG = join(ROOT, `abort-${seq}.jsonl`);
      const reply = { ok: true, id: "sit_20990410_0000_wit0", review: { units_delivered: 2, units_composed: 3, banked: 1, turns: 4, judge: { ok: true } }, intent_ok: true };
      const srv = createServer((req, res) => {
        let b = ""; req.on("data", (c) => { b += c; });
        req.on("end", () => { const go = () => { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(req.url === "/close" ? reply : { ok: true })); }; if (req.url === "/close") setTimeout(go, Math.max(1, Math.round(delayMs / SCALE))); else go(); });
      });
      srv.listen(0, "127.0.0.1", () => {
        const port = srv.address().port;
        const ch = spawn(process.execPath, ["--import", PRELOAD, join(copy, "scripts", "sitting.mjs"), "close"], { cwd: copy, env: envFor(copy, { ARSENAL_SITTING_PORT: String(port), MTAIL_ABORT_LOG: ALOG, MTAIL_SCALE: String(SCALE) }), windowsHide: true });
        live.push(ch);
        let out = "", err = "";
        ch.stdout.on("data", (c) => { out += c; }); ch.stderr.on("data", (c) => { err += c; });
        ch.on("close", (code) => { srv.close(); done({ code, out, err, aborts: rows(ALOG) }); });
      });
    });
    let slow = null, fast = null;
    if (DUR !== null && DUR > OLD && DUR < LONGEST) { slow = await runCli(DUR); fast = await runCli(0); }
    const printed = (r) => !!r && r.code === 0 && /^sitting: CLOSED sit_20990410_0000_wit0 — 2\/3 units spoken · 1 banked · 4 turns · judge ran$/m.test(r.out);
    // ~~const waitOf = (r) => (r && r.aborts.length ? r.aborts.at(-1).ms : null);~~ (struck by unit mrt, forks row 1120 (1) / row 1112 (1))
    const waitOf = (r) => { const c = r ? r.aborts.filter((a) => a.method === "POST" && a.path === "/close") : []; return c.length ? c.at(-1).ms : null; };
    // unit mrt re-base (forks row 1120 (1), F2 A; mday rows 1075 / 1078, F10 A): the CLI asks GET /status FIRST (the daemon-up probe), then POSTs /close
    const probed = (r) => !!r && r.aborts.length >= 2 && r.aborts[0].method === "GET" && r.aborts[0].path === "/status" && r.aborts[0].scaled === false;
    clause("T2 F-C", printed(slow) && waitOf(slow) >= LONGEST && printed(fast) && probed(slow) && probed(fast),
      `old wait ${OLD ?? "(no --base-org)"} ms · longest close ${LONGEST ?? "?"} ms (${steps.map(([f, v]) => `${f} ${v}`).join(" + ")} + session grace ${grace ?? "?"}) · a close of ${DUR ?? "?"} ms: ${slow ? (printed(slow) ? "printed its result" : `NOT printed (exit ${slow.code}: ${(slow.out + slow.err).trim().split(/\r?\n/).at(-1)?.slice(0, 90)})`) : "not run"} · CLI wait ${waitOf(slow) ?? "?"} ms · probe ${slow && slow.aborts[0] ? `${slow.aborts[0].method} ${slow.aborts[0].path} ${slow.aborts[0].ms} ms` : "none"} · contrast (an instant close): ${fast ? (printed(fast) ? "printed" : "NOT printed") : "not run"}${fast && !probed(fast) ? " (no probe first)" : ""}`);
  }

  // ── T3 · ONE auth literal ──
  {
    const cg = kOrg["claudegen.mjs:AUTH_REFUSAL_RE"];
    const same = (() => {
      const kc = copyOf(ORG, "t3", [], ["registry.json"]);
      const code = `const u = (f) => new URL("./scripts/" + f, "${pathToFileURL(kc + "/").href}").href; const c = await import(u("claudegen.mjs")), g = await import(u("gaffer_brain.mjs")), b = await import(u("brain.mjs"));
        const R = c.AUTH_REFUSAL_RE; console.log(JSON.stringify({ re: R instanceof RegExp, g: g.JUDGE_AUTH_RE === R, b: b.AUTH_FAIL_RE === R,
          hits: ["Not logged in · Please run /login", "Failed to authenticate", "OAuth session expired and could not be refreshed"].map((t) => !!(R && R.test(t))), wall: !!(R && R.test("You've hit your session limit · resets 8:30pm")) }));`;
      const r = spawnSync(process.execPath, ["--input-type=module", "-e", code], { cwd: kc, encoding: "utf8", env: envFor(kc), windowsHide: true });
      try { return JSON.parse(String(r.stdout).trim().split(/\r?\n/).at(-1)); } catch { return { error: String(r.stderr || "").trim().split(/\r?\n/).at(-1) }; }
    })();
    // a PATTERN carrying the OAuth words: an alternation next to them, in a regex literal or a pattern string, in any file's CODE
    const PAT = /oauth session expired\\?\||\|\\?oauth session expired|could not be refreshed\\?\||\|\\?could not be refreshed/i;
    const carriers = readdirSync(join(ORG, "scripts")).filter((f) => f.endsWith(".mjs")).filter((f) => PAT.test(codeOf(read(join(ORG, "scripts", f)))));
    const cyc = (tree) => {
      if (!tree) return null;
      const bin = join(tree, "node_modules", "dependency-cruiser", "bin", "dependency-cruise.mjs");
      const r = spawnSync(process.execPath, [bin, "--config", ".dependency-cruiser.cjs", "--output-type", "json", "scripts", "hooks"], { cwd: tree, encoding: "utf8", windowsHide: true, maxBuffer: 1 << 28 });
      // unit mrt (forks row 1120 (1) F5 B): the from→to ROWS, not only their count
      try { const o = String(r.stdout); return ((JSON.parse(o.slice(o.indexOf("{"), o.lastIndexOf("}") + 1)).summary || {}).violations || []).filter((v) => v.rule && v.rule.name === "no-circular").map((v) => `${v.from}→${v.to}`); } catch { return null; }
    };
    const eOrg = cyc(ORG), eBase = cyc(BASE_ORG);
    const cOrg = eOrg ? eOrg.length : null, cBase = eBase ? eBase.length : null;
    const newRows = eOrg && eBase ? eOrg.filter((e) => !eBase.includes(e)) : null;
    clause("T3 AUTH", !!cg && same.re && same.g && same.b && same.hits && same.hits.every(Boolean) && same.wall === false
      && carriers.length === 1 && carriers[0] === "claudegen.mjs" && cOrg !== null && cBase !== null && cOrg <= cBase && newRows !== null && newRows.length === 0,
      `claudegen AUTH_REFUSAL_RE ${cg ? "exported" : "ABSENT"} · gaffer_brain JUDGE_AUTH_RE ${same.g ? "IS it" : "is NOT it"} · brain AUTH_FAIL_RE ${same.b ? "IS it" : "is NOT it"}${same.error ? ` (${String(same.error).slice(0, 80)})` : ""} · matches ${(same.hits || []).filter(Boolean).length}/3, limit wall ${same.wall ? "MATCHED" : "not matched"} · files carrying the OAuth words as a pattern: ${carriers.join(", ") || "none"} · depcruise no-circular ${cOrg ?? "?"} vs BASE ${cBase ?? "(no --base-org)"} · rows not in BASE's: ${newRows ? (newRows.length ? newRows.join(", ") : "none") : "?"}`);
  }

  // ── T4 · mpm F1 ──
  {
    const defs = readdirSync(join(ORG, "scripts")).filter((f) => f.endsWith(".mjs"))
      .flatMap((f) => (codeOf(read(join(ORG, "scripts", f))).match(/^\s*(?:export\s+)?(?:async\s+)?function\s+captureDay\s*\(/gm) || []).map((m) => `${f}${/export/.test(m) ? " (exported)" : ""}`));
    const pm = read(join(ORG, "scripts", "postmatch.mjs")) || "";
    const imports = /import \{[^}]*\bcaptureDay\b[^}]*\} from "\.\/gaffer_brain\.mjs";/.test(pm);
    // captures either side of an IST midnight: 18:00Z on D-1 is 23:30 IST of D-1 (not D) · 20:00Z on D-1 is 01:30 IST of D ·
    // 05:00Z of D is D · 20:00Z of D is 01:30 IST of D+1 (not D) · no instant, the day D it carries · a day that is no calendar day
    const prev = new Date(Date.parse(`${D}T00:00:00.000Z`) - 86400000).toISOString().slice(0, 10);
    const q = [capture("t4-prev", `${prev}T18:00:00.000Z`, D), capture("t4-early", `${prev}T20:00:00.000Z`, prev), capture("t4-mid", `${D}T05:00:00.000Z`, D),
      capture("t4-late", `${D}T20:00:00.000Z`, D), capture("t4-dayonly", "", D), capture("t4-bad", "", "2099-02-30")];
    const RUN = JB + (3 * JD) / 4;
    const o = closeOnce(copyOf(ORG, "t4", q), { runMs: RUN });
    const b = BASE_ORG ? closeOnce(copyOf(BASE_ORG, "t4b", q), { runMs: RUN }) : null;
    const want = "t4-early, t4-mid, t4-dayonly";
    const named = (o.rec || "").includes(`grade queue: 3 outstanding capture(s) of ${D}`) && (o.rec || "").includes(want);
    clause("T4 F1", defs.length === 1 && defs[0] === "gaffer_brain.mjs (exported)" && imports && kOrg["gaffer_brain.mjs:captureDay"] === "function"
      && o.status === 0 && named && !!b && b.status === 0 && o.rec === b.rec,
      `captureDay defined in: ${defs.join(", ") || "none"} · postmatch ${imports ? "imports it from gaffer_brain.mjs" : "does NOT import it"} · the queue-only close of ${D} names ${named ? `exactly ${want}` : "NOT the planted IST day's captures"} · record ${b ? (o.rec === b.rec ? "byte-equal to BASE's" : "DIFFERS from BASE's") : "(no --base-org)"}`);
  }

  // ── BOUND ──
  {
    // the TRACKED files of each side (sides.mjs makes each a git tree): what the organs' own runs leave behind is not the build
    const files = (root) => {
      const acc = new Map();
      const r = spawnSync("git", ["-C", root, "ls-files", "-z"], { encoding: "utf8", maxBuffer: 1 << 28 });
      if (r.status !== 0) return null;
      for (const rel of String(r.stdout).split("\0").filter(Boolean)) { const p = join(root, rel); acc.set(rel, existsSync(p) ? sha(readFileSync(p)) : "(missing)"); }
      return acc;
    };
    let diff = null;
    if (BASE_ORG) {
      const a = files(ORG), bb = files(BASE_ORG);
      if (a && bb) diff = [...new Set([...a.keys(), ...bb.keys()])].filter((k) => a.get(k) !== bb.get(k)).filter((k) => !k.startsWith("ci/mtail/") && k !== ".claude/settings.json").sort();
    }
    const outside = diff ? diff.filter((k) => !NAMED.includes(k)) : null;
    clause("BOUND", !!diff && outside.length === 0, diff ? `differs from BASE in ${diff.length} tracked file(s): ${diff.join(", ") || "none"}${outside.length ? ` · OUTSIDE THE NAMED FIVE: ${outside.join(", ")}` : ""}` : BASE_ORG ? "a side is not a git tree (make it with ci/mtail/sides.mjs)" : "no --base-org");
  }
} catch (e) {
  clause("WITNESS", false, `threw: ${String((e && e.stack) || e).split("\n").slice(0, 3).join(" | ")}`);
} finally {
  // ── LAST ──
  for (const ch of live) { try { if (ch.exitCode === null) ch.kill(); } catch { } }
  const procs = (() => {
    const r = process.platform === "win32"
      ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true })
      : spawnSync("ps", ["-eo", "pid,args"], { encoding: "utf8" });
    const rootFwd = slash(ROOT);
    return String(r.stdout || "").split(/\r?\n/).filter((l) => (l.includes(ROOT) || l.includes(rootFwd)) && !l.includes(String(process.pid) + " ") && !/\b(ps|powershell)\b/.test(l));
  })();
  const spawned = (read(CLAUDE_LOG) || "").split(/\r?\n/).filter(Boolean);
  clause("LAST", procs.length === 0 && spawned.length === 0, `${procs.length} node process(es) naming the temp root survive · the fake claude logged ${spawned.length} spawn(s)`);
  try { rmSync(ROOT, { recursive: true, force: true }); } catch { }
  const red = results.filter((r) => !r.ok).map((r) => r.id);
  if (red.length) console.log(`RED MTAIL · ${red.join(" · ")}`);
  else { console.log(`GREEN MTAIL the judge tail · ${results.length} clause(s)`); exitCode = 0; }
  process.exitCode = exitCode;
}
