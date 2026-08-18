#!/usr/bin/env node
// ============================================================================
// turn_hook.mjs · ARSENAL AI FC — THE TURN HOOK: one process per anchor
//                                    (18 Aug 2026, OVERHAUL Block 1 · §7.4 / §14.8)
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. Every prompt he typed booted FIVE node processes
// (UserPromptSubmit: afferent-post · forge_session contract · teaching_contract
// print · teaching_audit hook · hippocampus recall-hint) and every session start
// booted five more. Measured 18 Aug 2026 on his laptop: bare `node -e 0` = 172 ms,
// each callee 217–267 ms wall — i.e. ~80% of every hook's cost was node booting,
// not the organ working (R8 in the overhaul: complexity is the token sink; a
// study prompt should cost one process, not a herd).
//
// WHAT IT IS. A THIN DISPATCHER. It reads the hook payload once, hands it down,
// and imports each callee IN-PROCESS with `process.argv` shimmed to what the
// callee would have seen as its own CLI — so the callee's OWN dispatch runs its
// OWN hook path and prints its OWN stdout. Byte-identical by construction: there
// is no second implementation of any callee's output here, only the callee.
// The four (or five) commands run in the SAME ORDER settings.json listed them.
//
// THE THREE CONTRACTS a callee must honour to ride this dispatcher (all four
// UserPromptSubmit and five SessionStart callees do, as of this commit):
//   1. THE STDIN HANDOFF — a hook payload arrives on fd 0, a ONE-SHOT pipe. The
//      dispatcher reads it once and parks it on `globalThis[STDIN_HANDOFF]`; every
//      callee's stdin reader checks that global FIRST and falls back to fd 0 only
//      when it is unset (standalone CLI). Grep the name: `__ARSENAL_HOOK_STDIN__`.
//   2. NO process.exit ON THE HOOK PATH — the callee's hook verb ends by falling
//      off the end / `break` / `return`. (Safety net below: an exit call that
//      slipped through becomes ONE stderr line and the rest still run — never a
//      silent loss of the callees after it.)
//   3. AWAITABLE — a callee whose main is async either awaits it at top level
//      (`await main()` behind the argv[1] guard — hippocampus gained that in this
//      block; teaching_audit already had `await hookMain()`) or, when a top-level
//      await would deadlock on a circular import, EXPORTS its main for the `call`
//      shape (learnstate → `hookMain`; see runOrgan). Either way the next callee
//      cannot start before this one has printed. forge_session, teaching_contract,
//      watchman and captains_call dispatch synchronously.
//
// LAWS: this organ WRITES NOTHING — sole writer of no state file, ever. Every
//   write on a hook turn is the callee's own, through the callee's own owner
//   path (teaching_contract.json by teaching_contract, teaching_audit_last.json
//   by teaching_audit, consumption.jsonl through brain's helper, …). It never
//   composes, never teaches, never re-orders. FAIL-OPEN PER CALLEE: a throwing
//   callee costs one stderr line; the callees after it still run; exit is 0.
//   ARSENAL_ORGAN=1 is honoured by every callee's own guard, so a headless organ
//   session prints ZERO bytes through here (asserted in the selftest).
// WHO ELSE COULD ACT ON THIS OUTPUT? Claude Code (the ONLY consumer today —
//   .claude/settings.json UserPromptSubmit → `prompt`, SessionStart → `start`);
//   sitting.mjs (Block 3, §6.3) must prepend the same pacer block to every
//   voice turn — it should call `runOrgan` from here, not re-spawn five nodes;
//   xray.mjs (the `runOrgan(...)` calls below are LAYER B' in-process edges, so
//   the callees' hook verbs stay reachable in the verb graph, not orphaned).
// MEASURED (18 Aug 2026, his laptop, warm, before settings.json was switched —
//   scratch proof: same payload, same state snapshot, restored between runs):
//   prompt · OLD 4 processes 550 ms wall → NEW 182 ms wall, in-process 89 ms · stdout
//     996 B = 996 B BYTE-IDENTICAL · same two files touched (teaching_contract.json,
//     teaching_audit_last.json).
//   start  · OLD 5 processes 833 ms wall → NEW 528 ms wall, in-process 425 ms (the
//     brief itself is ~350 of it: brain.mjs import + manifest + state line) · stdout
//     11,804 B = 11,804 B BYTE-IDENTICAL · same files touched.
//   floors under ARSENAL_ORGAN=1 (every callee silent): prompt 18 ms · start 85 ms
//     — what he pays even when nothing speaks; the selftest holds both ≤ 300 ms.
// CLI: node scripts/turn_hook.mjs prompt|start [--time] | selftest
//   --time → ONE line on STDERR (`turn_hook: <seq> · <n> organ(s) · <ms> ms`);
//   stdout stays exactly the callees'.
// ============================================================================
import { readFileSync, mkdtempSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { performance } from "node:perf_hooks";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

// THE STDIN HANDOFF — the one name every callee's stdin reader checks first.
export const STDIN_HANDOFF = "__ARSENAL_HOOK_STDIN__";

// The two anchors this organ serves, in the exact order settings.json listed the
// commands before the collapse (18 Aug 2026). Written as EXPLICIT calls, one per
// line, deliberately: xray's verb graph reads `runOrgan("<file>", "<verb>")` as an
// organ→verb edge (LAYER B'), so `contract` / `print` / `hook` / `recall-hint` /
// `reset-turns` / `brief` / `boot` / `deal` remain "invoked", not orphan verbs.
export async function prompt(opts = {}) {
  const r = { ran: 0, failed: [] };
  await runOrgan("forge_session.mjs", "contract", opts, r);
  await runOrgan("teaching_contract.mjs", "print", opts, r);
  await runOrgan("teaching_audit.mjs", "hook", opts, r);
  await runOrgan("hippocampus.mjs", "recall-hint", opts, r);
  return r;
}
export async function start(opts = {}) {
  const r = { ran: 0, failed: [] };
  await runOrgan("teaching_contract.mjs", "reset-turns", opts, r);
  // learnstate rides the `call` shape (library import + awaited `hookMain`), NOT the
  // argv[1] shim: its brief() dynamically imports context_manifest, which imports
  // learnstate back — a top-level `await main()` there DEADLOCKED (unsettled TLA,
  // exit 13, zero bytes). Measured 18 Aug 2026; see learnstate.mjs's guard comment.
  await runOrgan("learnstate.mjs", "brief", { ...opts, call: "hookMain" }, r);
  await runOrgan("forge_session.mjs", "boot", opts, r);
  await runOrgan("watchman.mjs", "brief", opts, r);
  await runOrgan("captains_call.mjs", "deal", opts, r);
  return r;
}
export const SEQUENCES = { prompt, start };

// Read the hook payload ONCE. A TTY is never read (a human at a terminal would
// hang on a pipe that never ends — the same guard every callee carries).
export function readHookStdin() {
  try {
    if (process.stdin.isTTY) return "";
    return readFileSync(0, "utf8");
  } catch { return ""; }
}

class HookExit extends Error {
  constructor(code) { super(`process.exit(${code})`); this.code = code; this.hookExit = true; }
}

// ONE callee, in-process. `dir` and `importer` are injectable so the selftest can
// drive fixture modules; the live path uses this file's own directory and a real
// dynamic import. TWO SHAPES:
//   · SHIM (default) — `process.argv[1]` = the callee's absolute path (so its
//     `import.meta.url === pathToFileURL(process.argv[1]).href` guard is TRUE, or its
//     top-level `switch (process.argv[2])` runs) and `process.argv[2..]` = the verb;
//     the import IS the run. For a top-level-dispatch or a guarded-`await main()` file.
//   · CALL (`opts.call = "<export>"`) — argv[1] is left alone (the guard stays FALSE),
//     argv[2..] = the verb, the file is imported as a library and the named export is
//     AWAITED. For a callee whose main cannot be top-level-awaited (learnstate: its
//     brief() dynamically imports a module that imports learnstate back).
// Either way: same code path as the CLI, same stdout. Restored in `finally`, always.
export async function runOrgan(file, verb, opts = {}, r = { ran: 0, failed: [] }) {
  const dir = opts.dir || HERE;
  const importer = opts.importer || ((href) => import(href));
  const stdin = typeof opts.stdin === "string" ? opts.stdin : "";
  const err = opts.stderr || ((s) => process.stderr.write(s + "\n"));
  const abs = join(dir, file);
  const savedArgv = process.argv;
  const savedExit = process.exit;
  globalThis[STDIN_HANDOFF] = stdin;
  process.argv = [savedArgv[0], opts.call ? savedArgv[1] : abs, ...(verb == null ? [] : [String(verb)]), ...(opts.extraArgs || [])];
  // THE SAFETY NET (contract 2). A callee that still calls process.exit on its hook
  // path must not take the callees after it down silently: the call becomes an
  // exception, is reported on stderr in ONE line, and the sequence continues.
  process.exit = (code) => { throw new HookExit(code == null ? 0 : code); };
  r.ran++;                              // attempted — whatever happens next is recorded in `failed`
  try {
    const mod = await importer(pathToFileURL(abs).href);
    if (opts.call) {
      if (!mod || typeof mod[opts.call] !== "function") throw new Error(`no exported function \`${opts.call}\``);
      await mod[opts.call]();
    }
  } catch (e) {
    r.failed.push({ file, verb, why: e && e.hookExit ? e.message : String((e && e.message) || e).slice(0, 160) });
    err(`turn_hook: ${file} ${verb || ""} — ${e && e.hookExit ? `called ${e.message} on its hook path (its output stands; the callees after it still ran)` : `threw: ${String((e && e.message) || e).slice(0, 160)} (the callees after it still ran)`}`);
  } finally {
    process.exit = savedExit;
    process.argv = savedArgv;
  }
  return r;
}

// ── SELFTEST — hermetic: fixture callees in a temp dir, no live state written ──
function selftest() {
  let pass = 0, fail = 0;
  const fails = [];
  const assert = (name, cond, detail) => {
    if (cond) { pass++; console.log(`  ok   ${name}`); }
    else { fail++; fails.push({ name, detail }); console.log(`  FAIL ${name}${detail ? `\n         ${detail}` : ""}`); }
  };
  console.log("=== turn_hook.mjs selftest (hermetic — fixture callees, live callees only under ARSENAL_ORGAN=1) ===\n");

  return (async () => {
    // 1. FIXTURES — five callees covering every shape a real one has.
    const tmp = mkdtempSync(join(tmpdir(), "turn_hook-"));
    const W = (n, s) => writeFileSync(join(tmp, n), s);
    // a: top-level dispatch (forge_session / teaching_contract shape) + reads the handoff
    W("a.mjs", `const [mode] = process.argv.slice(2);\nconst raw = globalThis["${STDIN_HANDOFF}"];\nlet p = null; try { p = JSON.parse(raw || "{}").prompt || null; } catch {}\nif (mode === "contract") console.log("A:" + mode + ":" + p);\n`);
    // b: ASYNC top-level await (teaching_audit shape) — proves ordering survives an async callee
    W("b.mjs", `await new Promise((res) => setTimeout(res, 25));\nconsole.log("B:" + process.argv[2]);\n`);
    // c: guarded async main (learnstate / hippocampus shape) with `await main()`
    W("c.mjs", `import { pathToFileURL } from "node:url";\nasync function main() { await new Promise((res) => setTimeout(res, 10)); console.log("C:" + process.argv[2] + ":" + (process.argv[1].endsWith("c.mjs") ? "argv1-ok" : "argv1-BAD")); }\nif (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();\n`);
    // d: throws at top level — must cost ONE stderr line and nothing else
    W("d.mjs", `throw new Error("fixture-boom");\n`);
    // e: calls process.exit(0) on its hook path — the safety net must catch it
    W("e.mjs", `console.log("E:before-exit");\nprocess.exit(0);\nconsole.log("E:after-exit-MUST-NOT-PRINT");\n`);
    // f: last — proves the sequence continued after d and e
    W("f.mjs", `console.log("F:" + process.argv[2]);\n`);
    // g: the CALL shape (learnstate shape) — guarded async main NOT awaited at top level
    //    (a circular import would deadlock), exported as hookMain; the guard must stay
    //    FALSE (argv[1] untouched) so main runs exactly ONCE, via the awaited export.
    W("g.mjs", `import { pathToFileURL } from "node:url";\nlet runs = 0;\nasync function main() { runs++; await new Promise((res) => setTimeout(res, 10)); console.log("G:" + process.argv[2] + ":runs=" + runs + ":" + (process.argv[1].endsWith("g.mjs") ? "argv1-SHIMMED-BAD" : "argv1-untouched")); }\nif (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();\nexport { main as hookMain };\n`);
    // h: after g — proves the CALL shape was awaited (h prints after g's 10 ms wait)
    W("h.mjs", `console.log("H:" + process.argv[2]);\n`);

    const captured = [];
    const errs = [];
    const realWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk, ...rest) => { captured.push(String(chunk)); return true; };
    const argvBefore = process.argv.slice();
    let r;
    try {
      r = { ran: 0, failed: [] };
      const opts = { dir: tmp, stdin: JSON.stringify({ prompt: "namaste" }), stderr: (s) => errs.push(s) };
      // `drive`, not `runOrgan`, on purpose: xray reads a literal `runOrgan("x.mjs", "verb")`
      // as a LAYER B′ organ→verb edge, and these fixtures are not organs.
      const drive = runOrgan;
      await drive("a.mjs", "contract", opts, r);
      await drive("b.mjs", "hook", opts, r);
      await drive("c.mjs", "brief", opts, r);
      await drive("d.mjs", "boom", opts, r);
      await drive("e.mjs", "exit", opts, r);
      await drive("f.mjs", "deal", opts, r);
      await drive("g.mjs", "brief", { ...opts, call: "hookMain" }, r);
      await drive("h.mjs", "after", opts, r);
    } finally {
      process.stdout.write = realWrite;
    }
    const out = captured.join("");
    const lines = out.split("\n").filter(Boolean);
    assert("ORDER — every callee's output lands in sequence order, async callees included (a, b, c, e, f, g, h)",
      JSON.stringify(lines) === JSON.stringify(["A:contract:namaste", "B:hook", "C:brief:argv1-ok", "E:before-exit", "F:deal", "G:brief:runs=1:argv1-untouched", "H:after"]), JSON.stringify(lines));
    assert("THE STDIN HANDOFF — the payload read once reached a callee through the named global", lines[0] === "A:contract:namaste");
    assert("THE ARGV SHIM — a guarded-main callee saw ITSELF as argv[1] (its own guard opened)", lines[2] === "C:brief:argv1-ok");
    assert("THE CALL SHAPE — an exported main ran exactly ONCE (guard stayed shut, export awaited) and the next callee waited for it", lines[5] === "G:brief:runs=1:argv1-untouched" && lines[6] === "H:after");
    assert("FAIL-OPEN — a throwing callee cost ONE stderr line and the callees after it still ran",
      errs.filter((s) => /d\.mjs boom — threw: fixture-boom/.test(s)).length === 1 && lines.includes("F:deal"), JSON.stringify(errs));
    assert("THE SAFETY NET — a callee's process.exit on its hook path was caught: its output stands, nothing after the exit printed, the sequence continued",
      errs.some((s) => /e\.mjs exit — called process\.exit\(0\)/.test(s)) && !out.includes("MUST-NOT-PRINT") && lines.includes("F:deal"));
    assert("process.argv and process.exit are RESTORED after every callee (finally, always)",
      JSON.stringify(process.argv) === JSON.stringify(argvBefore) && typeof process.exit === "function" && !String(process.exit).includes("HookExit"));
    assert("the run record counts what happened — 8 attempted, 2 failed (d threw, e exited)", r.ran === 8 && r.failed.length === 2, JSON.stringify(r));
    rmSync(tmp, { recursive: true, force: true });

    // 2. THE THREE CONTRACTS, checked against the REAL callees' source (the cheapest
    //    guard against a future edit that quietly re-adds a fd-0 read or an exit).
    const src = (f) => { try { return readFileSync(join(HERE, f), "utf8"); } catch { return ""; } };
    for (const f of ["teaching_contract.mjs", "teaching_audit.mjs", "hippocampus.mjs"]) {
      assert(`contract 1 — ${f} (a stdin-reading callee) checks the handoff global before fd 0`, src(f).includes(STDIN_HANDOFF), `grep ${STDIN_HANDOFF} in ${f}`);
    }
    assert("contract 3 — hippocampus.mjs awaits its async main behind the argv[1] guard (no circular import there, so a top-level await is safe)",
      /pathToFileURL\(process\.argv\[1\]\)\.href\)\s*await main\(\)/.test(src("hippocampus.mjs")));
    assert("contract 3 — learnstate.mjs exports its main as `hookMain` for the CALL shape (its brief() has a circular dynamic import, so a top-level await would deadlock)",
      /main as hookMain/.test(src("learnstate.mjs")) && !/pathToFileURL\(process\.argv\[1\]\)\.href\)\s*await main\(\)/.test(src("learnstate.mjs")));
    assert("contract 3 — teaching_audit.mjs awaits its hook main at top level", /await hookMain\(\)/.test(src("teaching_audit.mjs")));
    // The wiring itself (L4: a law is a code path). settings.json must name exactly
    // this organ for the two anchors — and NOT the five commands it replaced.
    let settings = null;
    try { settings = JSON.parse(readFileSync(join(ROOT, ".claude", "settings.json"), "utf8")); } catch {}
    const cmds = (ev) => ((settings && settings.hooks && settings.hooks[ev]) || []).flatMap((g) => (g.hooks || []).map((h) => h.command));
    const ups = cmds("UserPromptSubmit"), ss = cmds("SessionStart");
    assert("WIRING — UserPromptSubmit = exactly [afferent-post, turn_hook prompt] (5 processes → 2)",
      ups.length === 2 && ups[0] === "node hooks/afferent-post.mjs" && ups[1] === "node scripts/turn_hook.mjs prompt", JSON.stringify(ups));
    assert("WIRING — SessionStart = exactly [turn_hook start] (5 processes → 1)",
      ss.length === 1 && ss[0] === "node scripts/turn_hook.mjs start", JSON.stringify(ss));

    // 3. THE LIVE CALLEES UNDER ARSENAL_ORGAN=1 — hermetic by every callee's own
    //    guard (no read of his state reaches stdout, no write lands), so this both
    //    proves the SILENCE LAW for headless organs through the dispatcher and
    //    measures the load FLOOR he pays on every prompt even when every callee is
    //    silent. Budget (§14.8): ≤ 300 ms for the sequence itself, node boot excluded.
    const payload = JSON.stringify({ session_id: "selftest", transcript_path: "", cwd: ROOT, hook_event_name: "UserPromptSubmit", prompt: "selftest probe" });
    for (const seq of ["prompt", "start"]) {
      const t0 = performance.now();
      const p = spawnSync(process.execPath, [fileURLToPath(import.meta.url), seq, "--time"], { input: payload, encoding: "utf8", cwd: ROOT, env: { ...process.env, ARSENAL_ORGAN: "1" }, timeout: 60000 });
      const wall = performance.now() - t0;
      const m = /turn_hook: \w+ · \d+ organ\(s\) · (\d+) ms/.exec(p.stderr || "");
      const ms = m ? Number(m[1]) : NaN;
      assert(`SILENCE LAW — \`${seq}\` under ARSENAL_ORGAN=1 printed ZERO bytes on stdout (every callee's own guard, through the dispatcher)`, p.status === 0 && (p.stdout || "") === "", `status ${p.status} stdout=${JSON.stringify((p.stdout || "").slice(0, 200))} stderr=${JSON.stringify((p.stderr || "").slice(0, 300))}`);
      assert(`BUDGET — \`${seq}\` sequence ran in-process in ${Number.isFinite(ms) ? ms : "?"} ms (≤ 300 ms law; wall incl. node boot ${Math.round(wall)} ms)`, Number.isFinite(ms) && ms <= 300, `stderr=${JSON.stringify((p.stderr || "").slice(0, 300))}`);
    }

    console.log(`\nturn_hook: ${pass} passed, ${fail} failed`);
    if (fail) for (const f of fails) console.log(`  · ${f.name}${f.detail ? `\n      ${f.detail}` : ""}`);
    process.exit(fail ? 1 : 0);
  })();
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") return selftest();
  const seq = SEQUENCES[mode];
  if (!seq) {
    console.log("turn_hook: prompt | start  [--time]  | selftest   (one process per anchor — runs the hook callees in-process, in order, byte-identical stdout)");
    process.exit(mode ? 1 : 0);
  }
  const time = process.argv.includes("--time");
  const stdin = readHookStdin();
  const t0 = performance.now();
  const r = await seq({ stdin });
  if (time) process.stderr.write(`turn_hook: ${mode} · ${r.ran} organ(s) · ${Math.round(performance.now() - t0)} ms${r.failed.length ? ` · ${r.failed.length} failed` : ""}\n`);
  // Exit 0 once stdout has DRAINED (Windows pipes are async), and exit at all —
  // a callee that left a timer or socket open must not hold his prompt hostage.
  process.stdout.write("", () => process.exit(0));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
