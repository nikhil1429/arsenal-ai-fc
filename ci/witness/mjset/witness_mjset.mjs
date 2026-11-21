#!/usr/bin/env node
// ============================================================================
// ci/witness/mjset/witness_mjset.mjs — UNIT mjset · THE JUDGE THAT NEVER SETTLES, BY PLANTS
//   (spec ci/mjset/MJSET_SPEC.md on claude/mjset-spec @ 09d7f71 §7 / §16; rulings forks rows 1244 / 1245 / 1260 (2) / 1269 —
//    where they differ the ruling wins, and ci/mjset/PROOF.md names each difference)
// ----------------------------------------------------------------------------
// USAGE
//   node ci/witness/mjset/witness_mjset.mjs plants [--tree <dir>] [--only <id,…>] [--tmp <dir>]
//   --tree   the tree under test (default: this file's repository). Its scripts/ + package.json are COPIED under --tmp.
//   --tmp    an existing dir to plant under (the unit witness ci/mjset/witness_mjset.mjs hands its own, for LAST).
// OUTPUT: one `CLAUSE <id> GREEN|RED · <why>` line per clause, then `plants: <n> clause(s) · <k> GREEN`.
// CONTRACT
//   · Every plant is a COPY under os.tmpdir(): <tree>/scripts + package.json, node_modules linked, an EMPTY planted
//     dressing-room/state made by THIS file's node code (mkdirSync) — the repository's own state dir is never opened. The clauses
//     run in ONE child node process per tree (`inner`), which imports scripts/gaffer_brain.mjs, scripts/postmatch.mjs and
//     scripts/registry.mjs FROM THE COPY and hands gradeJudge planted rows, a planted judge history, a planted judge
//     (`generate`), planted owners, a planted card door and a planted clock. No live state is read.
//   · NO LIVE MODEL CALL: the child's env deletes every ARSENAL_* variable, ANTHROPIC_API_KEY and CLAUDE_CODE_SESSION_ID, and
//     puts a PLANTED `claude` first on its PATH (and, on Windows, %APPDATA%\npm\claude.cmd under the temp dir, the shim
//     claudegen.mjs BIN() looks for): it appends one line to a marker file under the temp dir and prints a fixed result
//     envelope. Three clauses (W9, W12 J1, W13 (b)) reach it ON PURPOSE through the organ's own default judge, to prove what the
//     un-injected lane does; every other clause plants `generate`. The registry is planted under the temp dir through its own env
//     door (ARSENAL_REGISTRY, registry.mjs:59).
//   · THE PORT CLASS (row 1053): no port is bound (no CLI judge round runs: `judge-round` / `judge-due` hold the judge port, so
//     every round here is gradeJudge imported), no service is named, nothing is POSTed, nothing restarts. Every wait is a
//     spawnSync that ends with its child; the outer bound is the caller's. No timeout, budget or size is typed here: every
//     number a clause compares is read off the tree's own exports (JUDGE_BUDGET_MS, settleReserveMs) or is a planted ledger row.
//   · CRLF-proof: every read splits on \r?\n; no POSIX-only shell; no git repo is planted.
// THE CLAUSES (each RED on base f635d68, GREEN on the build; planted both ways on the tree it judges)
//   W1  SELF-BLOCK OPENS (F1 C, the estimator) the runner's history (1 ok row 172766 ms / 1 capture + kills at 15000, 30000,
//       40000, 90086 ms / 1) + 2 captures → exactly ONE call of ONE capture sized BY THE ESTIMATOR (not the guard), margin 0,
//       its dispatching + settled rows land. Base: "NO BATCH FITS", 0 calls.
//   W2  ONE-CAPTURE FLOOR (F1 C, the guard) history = ONE killed one-capture row at 240000 ms → ONE guarded call. Base: 0 calls.
//   W3  A GUARD, NOT A GATE (F2 B) W2's history: the guarded call is killed at JUDGE_BUDGET_MS − settleReserveMs([head]) (≤
//       JUDGE_BUDGET_MS); AND a history whose OK rate (400000 ms / 1) exceeds that bound still starts NO call (row 963 (1) kept).
//   W4  NO LOOP W2's history: (a) the guarded call KILLED → `judge-one-capture-past-budget`, exactly 1 call; (b) the guarded call
//       ok, 2 captures → still exactly 1 call (the guard fires once per round; the next batch is the estimator's).
//   W5  THE ONE CARD W2's history, the call refuses "OAuth session expired and could not be refreshed" → `judge-auth-refused`,
//       exactly ONE card, key judge:auth:<IST day>. Base: 0 calls, 0 cards.
//   W6  RETRY AT THE NEXT CARRIER round 1 (no history) killed at its bound; its killed row appended; round 2 → 1 + 1 calls.
//       Base: 1 + 0 (the kill alone blocks for ever, P4).
//   W7  PRE-CYBORG FATE (F5 A) the registry's game_on_epoch planted at 2026-08-30T02:00:00Z; captures at 01:59Z and 02:01Z →
//       the 01:59Z one set aside by ONE pre_cyborg row (floor = the epoch), never handed to the judge; capture rows byte-identical;
//       the receipt names it; the 02:01Z one judged.
//   W8  HEAD-OF-LINE (F3 A) the judge declines every capture; two rounds (the first's rows carried) → c1, then c2. Base: c1, c1.
//   W9  DRY TOUCHES NOTHING (F4 A) gradeJudge({ dry }) with NO planted judge → the planted `claude` is never reached (no marker),
//       the receipt says settled nothing: dry. Base: the marker is written (a dry round made a call).
//   W11 THE JUDGE LINE KEPT PER CARRIER (row 1245 (1), postmatch.mjs) an evening try (NOT BANKED, killed), then a morning try
//       (NOT BANKED, cannot fit) of the same day's record → both JUDGE TRY lines, each with its anchor and instant, the evening's
//       byte for byte; the ONE `JUDGE:` line is the morning's; and autoclose's redo goes through that door (no text.replace).
//   W12 SETTLED NOTHING, BY NAME (row 1245 (2)) the six planted join paths J1-J6: J1 dry · J3 missed · J4 deferred · J5 diamond ·
//       J6 refused each end ok, graded 0, `settled_nothing` = its name; J2 unparseable stays ok:false "unparseable" (a
//       regression check, GREEN on both); the CLI head line says it. Base: no reason on the receipt.
//   W13 THE COST FIELD (row 1260 (2)) (a) judgeLedgerRow carries the CLI's `total_cost_usd` unchanged, null when absent, never 0;
//       (b) the organ's own default judge, through the planted `claude` (its envelope carries total_cost_usd), appends a ledger
//       row that HAS the field and never reads 0. Base: no field.
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, cpSync, existsSync, symlinkSync, writeFileSync, readFileSync, rmSync, chmodSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const MODE = process.argv[2];
const IDS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W11", "W12", "W13"];

if (MODE === "plants") {
  const TREE = resolve(arg("--tree") || join(HERE, "..", "..", ".."));
  const TMP = arg("--tmp") ? resolve(arg("--tmp")) : mkdtempSync(join(tmpdir(), "mjset-plants-"));
  const copy = mkdtempSync(join(TMP, "tree-"));
  for (const p of ["scripts", "package.json"]) if (existsSync(join(TREE, p))) cpSync(join(TREE, p), join(copy, p), { recursive: true });
  mkdirSync(join(copy, "dressing-room", "state"), { recursive: true });
  const nm = [join(TREE, "node_modules"), join(HERE, "..", "..", "..", "node_modules")].find((x) => existsSync(x));
  if (nm) symlinkSync(nm, join(copy, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  // the planted `claude`: a node script, reached as `claude` on PATH (POSIX) or %APPDATA%\npm\claude.cmd (Windows)
  const bin = join(copy, "..", `${copy.split(/[\\/]/).pop()}-bin`); mkdirSync(bin, { recursive: true });
  const shim = join(bin, "claude_shim.mjs");
  writeFileSync(shim, [
    'import { appendFileSync } from "node:fs";',
    'let input = ""; process.stdin.setEncoding("utf8"); process.stdin.on("data", (d) => { input += d; });',
    'process.stdin.on("end", () => {',
    '  if (process.env.MJSET_SHIM_MARK) appendFileSync(process.env.MJSET_SHIM_MARK, `called ${input.length}\\n`);',
    '  process.stdout.write(JSON.stringify({ type: "result", subtype: "success", is_error: false, result: JSON.stringify({ grades: [] }), total_cost_usd: 0.4321,',
    '    usage: { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } }));',
    '});',
  ].join("\n"));
  if (process.platform === "win32") {
    mkdirSync(join(bin, "appdata", "npm"), { recursive: true });
    writeFileSync(join(bin, "appdata", "npm", "claude.cmd"), `@"${process.execPath}" "${shim}" %*\r\n`);
  } else {
    writeFileSync(join(bin, "claude"), `#!${process.execPath}\nimport(${JSON.stringify(pathToFileURL(shim).href)});\n`);
    chmodSync(join(bin, "claude"), 0o755);
  }
  // the planted registry (its own env door): his floor, the instant of the GAME ON canon
  const reg = join(bin, "registry.json");
  writeFileSync(reg, JSON.stringify({ version: 1, updated_at: null, tables: { mechanisms: [{ subject: "game_on_epoch", subjects: ["2026-08-30T02:00:00.000Z"], why: "planted by the mjset witness" }] } }));
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (/^ARSENAL_/i.test(k) || k === "ANTHROPIC_API_KEY" || k === "CLAUDE_CODE_SESSION_ID" || k === "ORGANISM_TEST_PROFILE" || /^MJSET_/.test(k)) delete env[k];
  const sep = process.platform === "win32" ? ";" : ":";
  const pk = Object.keys(env).find((k) => k.toUpperCase() === "PATH") || "PATH";
  env[pk] = `${bin}${sep}${env[pk] || ""}`;
  if (process.platform === "win32") env.APPDATA = join(bin, "appdata");
  env.ARSENAL_REGISTRY = reg;
  env.TMPDIR = env.TEMP = env.TMP = TMP;
  const only = arg("--only");
  const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "inner", "--copy", copy, "--marks", bin, ...(only ? ["--only", only] : [])], { cwd: copy, env, encoding: "utf8", windowsHide: true });
  const out = String(r.stdout || "");
  process.stdout.write(out);
  if (!/^plants: /m.test(out)) console.log(`plants: the inner child ended without its verdict (exit ${r.status}) · ${String(r.stderr || "").split(/\r?\n/).filter(Boolean).slice(-3).join(" | ").slice(0, 400)}`);
  if (!arg("--tmp")) rmSync(TMP, { recursive: true, force: true });
  process.exit(0);
}

if (MODE !== "inner") { console.log("usage: witness_mjset.mjs plants [--tree <dir>] [--only <id,…>] [--tmp <dir>]"); process.exit(2); }

// ── inner: the clauses, in ONE child, over the copy ───────────────────────────────────────────────────────────────────
const COPY = resolve(arg("--copy")), MARKS = resolve(arg("--marks"));
const ONLY = arg("--only") ? arg("--only").split(",").map((s) => s.trim()).filter(Boolean) : null;
const GB = await import(pathToFileURL(join(COPY, "scripts", "gaffer_brain.mjs")).href);
let PM = null, pmErr = null;
try { PM = await import(pathToFileURL(join(COPY, "scripts", "postmatch.mjs")).href); } catch (e) { pmErr = String((e && e.message) || e).slice(0, 200); }
const REG = await import(pathToFileURL(join(COPY, "scripts", "registry.mjs")).href);
const SRC_GB = readFileSync(join(COPY, "scripts", "gaffer_brain.mjs"), "utf8").replace(/\r\n/g, "\n");
const SRC_PM = readFileSync(join(COPY, "scripts", "postmatch.mjs"), "utf8").replace(/\r\n/g, "\n");
const JOB = GB.JUDGE_JOB, BUDGET = GB.JUDGE_BUDGET_MS;
const NOW = new Date("2026-11-21T10:00:00.000Z");
const IST_DAY = new Date(NOW.getTime() + 5.5 * 3600000).toISOString().slice(0, 10);
const cap = (id, ts, type = "voice_rep") => ({ v: 2, kind: "capture", id, ts, type, ref: `tokenization:${id}`, concept: "tokenization", label: `planted ${id}`, gut: "knew",
  spoken: "a planted answer, never his", asked: "a planted question", key: null, axis: null, latency_ms: null, note: null, surface: "code" });
const C1 = cap("c1", "2026-11-10T10:00:00.000Z"), C2 = cap("c2", "2026-11-11T10:00:00.000Z");
const RUNNER = [{ job: JOB, ok: true, duration_ms: 172766, items: 1 }, ...[15000, 30000, 40000, 90086].map((f) => ({ job: JOB, ok: false, killed: true, duration_ms: f, items: 1, error: `KILLED (SIGTERM) after ${f}ms` }))];
const KILL1 = [{ job: JOB, ok: false, killed: true, duration_ms: 240000, items: 1, error: "KILLED (SIGTERM) after 240000ms" }];
const legal = (t) => (GB.VERDICT_TYPES[t] || { verdicts: ["landed"] }).verdicts[0];
const idsIn = (p, caps) => caps.filter((c) => String(p).includes(`id ${c.id}`)).map((c) => c.id);
/** a planted judge: records each call, answers by `answer(ids, call)` */
const judge = (calls, caps, answer) => async (p, call = {}) => { const ids = idsIn(p, caps); calls.push({ ids, budget_ms: call.budget_ms, items: call.items }); return answer(ids, call); };
const gradesFor = (ids, caps, dur = 1000) => ({ ok: true, duration_ms: dur, text: JSON.stringify({ grades: ids.map((id) => ({ id, verdict: legal((caps.find((c) => c.id === id) || {}).type), why: "planted" })) }) });
const queueOf = () => { const rows = []; return { rows, appendRow: (f, row) => { rows.push(row); return { ok: true }; } }; };
const base = (extra) => ({ now: NOW, clock: () => 0, dispatch: () => ({ ok: true }), verify: async () => ({ ran: false, why: "planted: no external check", checks: {}, calls: 0 }), headRides: false, ...extra });
const markFile = (id) => join(MARKS, `mark-${id}.txt`);
const marked = (id) => existsSync(markFile(id)) ? readFileSync(markFile(id), "utf8").split(/\r?\n/).filter(Boolean).length : 0;

const out = [];
const say = (id, ok, why) => { out.push({ id, ok }); console.log(`CLAUSE ${id} ${ok ? "GREEN" : "RED"} · ${String(why).replace(/\r?\n/g, " ").slice(0, 400)}`); };
const run = async (id, fn) => {
  if (ONLY && !ONLY.includes(id)) return;
  try { const [ok, why] = await fn(); say(id, ok, why); } catch (e) { say(id, false, `threw: ${String((e && e.stack) || e).split("\n").slice(0, 2).join(" ")}`); }
};

await run("W1", async () => {
  const calls = [], q = queueOf();
  const r = await GB.gradeJudge(base({ rows: [C1, C2], judgeHistory: RUNNER, generate: judge(calls, [C1, C2], (ids) => gradesFor(ids, [C1, C2], 172766)), appendRow: q.appendRow }));
  const b = (r.batches || [])[0] || {};
  const kinds = q.rows.filter((x) => x.of === "c1").map((x) => x.kind).join(",");
  const ok = calls.length === 1 && calls[0].ids.length === 1 && calls[0].ids[0] === "c1" && b.guarded === false && b.sizing && b.sizing.margin_ms === 0 && kinds === "dispatching,settled";
  return [ok, `calls ${calls.length} · ids ${JSON.stringify(calls.map((c) => c.ids))} · guarded ${b.guarded} · margin ${b.sizing && b.sizing.margin_ms} · c1 rows [${kinds}] · reason ${r.reason || "-"}`];
});
await run("W2", async () => {
  const calls = [];
  const r = await GB.gradeJudge(base({ rows: [C1], judgeHistory: KILL1, generate: judge(calls, [C1], (ids) => gradesFor(ids, [C1])), appendRow: queueOf().appendRow }));
  const b = (r.batches || [])[0] || {};
  return [calls.length === 1 && calls[0].items === 1 && b.guarded === true && r.ok === true && r.graded === 1, `calls ${calls.length} · guarded ${b.guarded} · ok ${r.ok} · graded ${r.graded} · reason ${r.reason || "-"}`];
});
await run("W3", async () => {
  const calls = [];
  await GB.gradeJudge(base({ rows: [C1], judgeHistory: KILL1, generate: judge(calls, [C1], (ids) => gradesFor(ids, [C1])), appendRow: queueOf().appendRow }));
  const want = BUDGET - GB.settleReserveMs([C1]);
  const slowCalls = [];
  const slow = await GB.gradeJudge(base({ rows: [C1], judgeHistory: [{ job: JOB, ok: true, duration_ms: 400000, items: 1 }], generate: judge(slowCalls, [C1], (ids) => gradesFor(ids, [C1])), appendRow: queueOf().appendRow }));
  const ok = calls.length === 1 && calls[0].budget_ms === want && calls[0].budget_ms <= BUDGET && slowCalls.length === 0 && slow.reason === "judge-batch-cannot-fit";
  return [ok, `guarded call budget ${calls[0] ? calls[0].budget_ms : "no call"} (want ${want} = JUDGE_BUDGET_MS − settleReserveMs([head])) · an ok rate past the bound: ${slowCalls.length} call(s), reason ${slow.reason || "-"}`];
});
await run("W4", async () => {
  const ca = [];
  const a = await GB.gradeJudge(base({ rows: [C1, C2], judgeHistory: KILL1, generate: judge(ca, [C1, C2], () => ({ ok: false, killed: true, duration_ms: 240000, error: "KILLED (SIGTERM) after 240000ms" })), appendRow: queueOf().appendRow }));
  const cb = [];
  const b = await GB.gradeJudge(base({ rows: [C1, C2], judgeHistory: KILL1, generate: judge(cb, [C1, C2], (ids) => gradesFor(ids, [C1, C2])), appendRow: queueOf().appendRow }));
  const ok = a.reason === "judge-one-capture-past-budget" && ca.length === 1 && cb.length === 1 && b.ok === true && b.graded === 1;
  return [ok, `(a) killed: ${ca.length} call(s), reason ${a.reason || "-"} · (b) ok: ${cb.length} call(s), graded ${b.graded}, stopped ${b.stopped || "-"}`];
});
await run("W5", async () => {
  const calls = [], cards = [];
  const r = await GB.gradeJudge(base({ rows: [C1], judgeHistory: KILL1, generate: judge(calls, [C1], () => ({ ok: false, duration_ms: 3000, error: "OAuth session expired and could not be refreshed" })),
    fileCard: (line, key) => { cards.push(key); return { ok: true, out: "captains_call: filed c1" }; }, appendRow: queueOf().appendRow }));
  return [r.reason === "judge-auth-refused" && calls.length === 1 && cards.length === 1 && cards[0] === `judge:auth:${IST_DAY}`, `calls ${calls.length} · cards ${JSON.stringify(cards)} · reason ${r.reason || "-"}`];
});
await run("W6", async () => {
  const c1 = [], c2 = [];
  const kill = (ids, call) => ({ ok: false, killed: true, duration_ms: call.budget_ms, error: `KILLED (SIGTERM) after ${call.budget_ms}ms` });
  await GB.gradeJudge(base({ rows: [C1], judgeHistory: [], generate: judge(c1, [C1], kill), appendRow: queueOf().appendRow }));
  const hist = c1.map((c) => ({ job: JOB, ok: false, killed: true, duration_ms: c.budget_ms, items: c.items, error: `KILLED (SIGTERM) after ${c.budget_ms}ms` }));
  const r2 = await GB.gradeJudge(base({ rows: [C1], judgeHistory: hist, generate: judge(c2, [C1], kill), appendRow: queueOf().appendRow }));
  return [c1.length === 1 && c2.length === 1, `round 1: ${c1.length} call(s) · round 2 (its kill on the history): ${c2.length} call(s), reason ${r2.reason || "-"}`];
});
await run("W7", async () => {
  const P = cap("m7a", "2026-08-30T01:59:00.000Z"), Q = cap("m7b", "2026-08-30T02:01:00.000Z");
  const rows = [P, Q], before = JSON.stringify(rows);
  const calls = [], q = queueOf();
  const r = await GB.gradeJudge(base({ rows, gameOnEpoch: () => REG.gameOnEpoch(), judgeHistory: [], generate: judge(calls, rows, (ids) => gradesFor(ids, rows)), appendRow: q.appendRow }));
  const pre = q.rows.filter((x) => x.kind === "pre_cyborg");
  const seen = calls.flatMap((c) => c.ids);
  const ok = pre.length === 1 && pre[0].of === "m7a" && pre[0].floor === "2026-08-30T02:00:00.000Z" && !seen.includes("m7a") && seen.includes("m7b")
    && JSON.stringify(rows) === before && r.pre_cyborg && r.pre_cyborg.set_aside === 1;
  return [ok, `pre_cyborg rows ${JSON.stringify(pre.map((x) => [x.of, x.floor]))} · judged ${JSON.stringify(seen)} · capture rows byte-identical ${JSON.stringify(rows) === before} · receipt set_aside ${r.pre_cyborg ? r.pre_cyborg.set_aside : "absent"}`];
});
await run("W8", async () => {
  const caps = [C1, C2], q = queueOf();
  const hist = [{ job: JOB, ok: true, duration_ms: 172766, items: 1 }];
  const c1 = [], c2 = [];
  const decline = () => ({ ok: true, duration_ms: 1000, text: JSON.stringify({ grades: [] }) });
  await GB.gradeJudge(base({ rows: caps, judgeHistory: hist, generate: judge(c1, caps, decline), appendRow: q.appendRow }));
  await GB.gradeJudge(base({ rows: [...caps, ...q.rows], judgeHistory: hist, generate: judge(c2, caps, decline), appendRow: queueOf().appendRow }));
  const h1 = (c1[0] || { ids: [] }).ids.join(), h2 = (c2[0] || { ids: [] }).ids.join();
  return [h1 === "c1" && h2 === "c2", `round 1 head ${h1 || "none"} · round 2 head ${h2 || "none"}`];
});
await run("W9", async () => {
  process.env.MJSET_SHIM_MARK = markFile("W9");
  const r = await GB.gradeJudge({ now: NOW, clock: () => 0, dry: true, rows: [C1], judgeHistory: [], headRides: false });
  delete process.env.MJSET_SHIM_MARK;
  const n = marked("W9");
  return [n === 0 && r.settled_nothing === "dry", `the planted claude reached ${n} time(s) · settled_nothing ${r.settled_nothing || "absent"} · ok ${r.ok}`];
});
await run("W11", async () => {
  if (!PM || typeof PM.keepJudgeTry !== "function" || typeof PM.judgeTryLine !== "function") {
    const replaces = /text = text\.replace\(dec\.prev\.judge_line/.test(SRC_PM);
    return [false, `postmatch.mjs exports no kept-try door${pmErr ? ` (${pmErr})` : ""}; its redo ${replaces ? "REPLACES the earlier JUDGE line in place (text.replace(dec.prev.judge_line, …))" : "is not the kept-try door"}`];
  }
  const EV = "JUDGE: NOT BANKED · exit 1 · gaffer_brain: RED · ONE CAPTURE PAST THE BUDGET — batch 1 held ONE capture and the lane died (KILLED (SIGTERM) after 240000ms)";
  const MO = "JUDGE: NOT BANKED · exit 1 · gaffer_brain: RED · NO BATCH FITS THE BUDGET — not even ONE capture fits";
  const AT_EV = "2026-11-19T18:10:12.000Z", AT_MO = "2026-11-20T03:45:00.000Z";
  const evTry = PM.judgeTryLine("evening", AT_EV, EV);
  const rec = PM.renderMachineRecord({ day: "2026-11-19", anchor: "evening", at: AT_EV, ev: { sessions: [], misses: [], read: {} }, tt: { turns: 0, last_ts: "2026-11-19T12:00:00.000Z", outside: 0, per_session: {} },
    archiveLine: "caught up (planted)", compileLine: "COMPILE: DONE · planted", judgeLine: EV, judgeTries: [evTry] });
  const after = PM.keepJudgeTry(rec, MO, { anchor: "morning", at: AT_MO });
  const tries = PM.judgeTriesOf(after);
  const dec = PM.parseMachineRecord(after) || {};
  const doors = /text = keepJudgeTry\(text, l,/.test(SRC_PM) && !/text = text\.replace\(dec\.prev\.judge_line/.test(SRC_PM) && /ownTry = judgeTryLine\(/.test(SRC_PM);
  const ok = tries.length === 2 && tries[0] === evTry && tries[1] === PM.judgeTryLine("morning", AT_MO, MO) && dec.judge_line === MO && dec.judge_settled === false
    && (after.match(/^JUDGE: /gm) || []).length === 1 && doors;
  return [ok, `tries ${tries.length} · evening kept byte for byte ${tries[0] === evTry} · morning try ${tries[1] ? tries[1].slice(0, 44) : "absent"} · the JUDGE line is the morning's ${dec.judge_line === MO} · autoclose redo through the door ${doors}`];
});
await run("W12", async () => {
  const got = {};
  // J1 dry — no planted judge (the organ's own default under dry), the planted claude behind it
  process.env.MJSET_SHIM_MARK = markFile("W12");
  const j1 = await GB.gradeJudge({ now: NOW, clock: () => 0, dry: true, rows: [C1], judgeHistory: [], headRides: false });
  delete process.env.MJSET_SHIM_MARK;
  got.J1 = [j1.ok === true && j1.graded === 0 && j1.settled_nothing === "dry", `dry→${j1.settled_nothing || "-"}`];
  const j2 = await GB.gradeJudge(base({ rows: [C1], judgeHistory: [], generate: async () => ({ ok: true, duration_ms: 1000, text: "sure!" }), appendRow: queueOf().appendRow }));
  got.J2 = [j2.ok === false && j2.reason === "unparseable", `unparseable→${j2.reason || "-"}`];
  const j3 = await GB.gradeJudge(base({ rows: [C1], judgeHistory: [], generate: async () => ({ ok: true, duration_ms: 1000, text: JSON.stringify({ grades: [{ id: "not-c1", verdict: "landed", why: "x" }] }) }), appendRow: queueOf().appendRow }));
  got.J3 = [j3.ok === true && j3.graded === 0 && j3.settled_nothing === "missed", `missed→${j3.settled_nothing || "-"}`];
  let t = 0;
  const j4 = await GB.gradeJudge(base({ rows: [C1], judgeHistory: [], clock: () => t, generate: async (p) => { t = BUDGET - 1000; return gradesFor(idsIn(p, [C1]), [C1]); }, appendRow: queueOf().appendRow }));
  got.J4 = [j4.ok === true && j4.graded === 0 && j4.settled_nothing === "deferred", `deferred→${j4.settled_nothing || "-"}`];
  const H = cap("h1", "2026-11-12T10:00:00.000Z", "hidden_test");
  const j5 = await GB.gradeJudge(base({ rows: [H], judgeHistory: [], generate: async () => ({ ok: true, duration_ms: 1000, text: JSON.stringify({ grades: [{ id: "h1", verdict: "passed", why: "x" }] }) }),
    secondOpinion: async () => ({ ok: true, verdict: "failed", engine: "planted", why: "y" }), fileCard: () => ({ ok: true, out: "captains_call: filed c2" }), appendRow: queueOf().appendRow }));
  got.J5 = [j5.ok === true && j5.graded === 0 && j5.settled_nothing === "diamond", `diamond→${j5.settled_nothing || "-"}`];
  const j6 = await GB.gradeJudge(base({ rows: [C1], judgeHistory: [], generate: async (p) => gradesFor(idsIn(p, [C1]), [C1]), appendRow: (f, row) => (row.kind === "dispatching" ? { ok: false, error: "planted refusal" } : { ok: true }) }));
  got.J6 = [j6.ok === true && j6.graded === 0 && j6.settled_nothing === "refused", `refused→${j6.settled_nothing || "-"}`];
  const head = /SETTLED NOTHING: \$\{r\.settled_nothing\}/.test(SRC_GB);
  const ok = Object.values(got).every((x) => x[0]) && head;
  return [ok, `${Object.entries(got).map(([k, v]) => `${k} ${v[0] ? "ok" : "NO"} (${v[1]})`).join(" · ")} · the CLI head line names it ${head}`];
});
await run("W13", async () => {
  const pure = typeof GB.judgeLedgerRow === "function"
    ? (() => { const a = GB.judgeLedgerRow({ ok: true, total_cost_usd: 0.4321 }), b = GB.judgeLedgerRow({ ok: true }); return a.total_cost_usd === 0.4321 && Object.prototype.hasOwnProperty.call(b, "total_cost_usd") && b.total_cost_usd === null; })()
    : false;
  process.env.MJSET_SHIM_MARK = markFile("W13");
  const r = await GB.gradeJudge({ now: NOW, clock: () => 0, rows: [C1], judgeHistory: [], headRides: false, dispatch: () => ({ ok: true }), appendRow: queueOf().appendRow,
    verify: async () => ({ ran: false, why: "planted: no external check", checks: {}, calls: 0 }) });
  delete process.env.MJSET_SHIM_MARK;
  const led = join(COPY, "dressing-room", "state", "brain_ledger.jsonl");
  const rows = existsSync(led) ? readFileSync(led, "utf8").split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((x) => x && x.job === JOB) : [];
  const last = rows[rows.length - 1];
  const has = !!last && Object.prototype.hasOwnProperty.call(last, "total_cost_usd");
  const e2e = has && last.total_cost_usd !== 0 && (last.total_cost_usd === null || last.total_cost_usd === 0.4321);
  return [pure && e2e && marked("W13") === 1, `judgeLedgerRow carries it unchanged and null when absent ${pure} · the live-path row (planted claude, its envelope carries 0.4321; reached ${marked("W13")}×) total_cost_usd ${has ? JSON.stringify(last.total_cost_usd) : "ABSENT"}${has && last.total_cost_usd === null ? " (claudegen.mjs parseOut does not hand the field back yet: FORK mjset-cost)" : ""} · round ok ${r.ok}`];
});

console.log(`plants: ${out.length} clause(s) · ${out.filter((x) => x.ok).length} GREEN`);
process.exit(0);
