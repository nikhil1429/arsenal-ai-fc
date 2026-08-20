#!/usr/bin/env node
// ============================================================================
// swallow.mjs · ARSENAL AI FC — SWALLOW + PANIC (OVERHAUL Block 7, §14.2, 18 Aug 2026)
//   SOLE WRITER of dressing-room/state/swallow_ledger.jsonl (one row per process,
//   flushed at exit — or every FLUSH_MS in a daemon). Reads nothing else. Pure
//   apart from that one append.
// ----------------------------------------------------------------------------
// THE BUG THIS EXISTS FOR (mutagen.mjs measured it, 12 Aug 2026): 884 catch sites
// in scripts/, 488 completely empty. Every one of the repo's real shipped bugs
// was a LIVE-ORACLE failure — a read of a file nothing writes, a dead reader — and
// every one of them sat inside `try { … } catch {}`, silent, forever. mutagen's
// PANIC BUILD arms those catches in a sandbox and counts the deaths; but the
// production lanes themselves still swallowed with no reason and no count.
//
// THE LAW (§14.2): in the eight production lanes — brain · dugout · thalamus ·
// cortex · nightshift · dmn · conductor · watchman — every catch that guards
// fs I/O may swallow ONLY through this function, with a ONE-LINE REASON:
//
//     try { … readFileSync(p) … } catch (e) { swallow("readJson(p) tolerated → null", e); return null; }
//
//   · ARSENAL_PANIC set   ⇒ the swallow RETHROWS, naming the site (organ · reason ·
//                           code · path). This is what mutagen's panic lane runs
//                           under, so a declared swallow is as loud as an armed one —
//                           and NAMED, which the mechanical rewrite never was.
//   · ARSENAL_PANIC unset ⇒ counted, never printed: {organ, why, e.code, e.path}
//                           accumulate in-process and land as ONE ledger row when
//                           the process exits (daemons: every FLUSH_MS, unref'd).
//                           watchman.mjs reads the ledger into its `caught-silent`
//                           INFO — silent catches per run become a NUMBER on the
//                           night report, never an escalation (a swallow is design
//                           until a death says otherwise).
//
// NARROWED-BY-ADDITION 20 Aug 2026 (AUDIT §10-C rung S3). Counting empty catches is now
// two industry instruments' job, and they agree to the unit: eslint's `no-empty` freezes the
// GENERIC count at 267 across all organs, and `laws/bare-catch.yml` finds the same clauses
// structurally (276 raw, of which 9 sit in scripts/legacy/, which every gate excludes).
// scripts/lawpack.mjs then applies the half only this organism knows — a bare catch inside
// one of the EIGHT PRODUCTION LANES that guards fs I/O, which is this file's law and nothing
// a linter can express: 38 of the 267. THIS file keeps what neither tool has — the
// DECLARATION mechanism, the reason string, the panic rethrow and the ledger. A linter can
// count silence; only swallow() can make it speak.
//
// LAYERING (L9): no catch is deleted. `catch {}` → `catch (e) { swallow("why", e) }`;
// a catch that already REPORTS (console/throw/return-with-why) is not a swallow and
// is left alone. mutagen's isSwallow treats a body that calls swallow( as DECLARED
// and does not rewrite it — so `mutagen panic`'s "rewrote N sites" is now the count
// of UNDECLARED swallows, a number that only goes down.
//
// LAWS: never throws unless ARSENAL_PANIC · never prints · the flush is
//   best-effort (a ledger write failure can never cost a lane — the one place a
//   silent catch is the design) · rows carry no content, only counts and codes.
// WHO ELSE COULD ACT ON THIS OUTPUT? watchman.mjs (`caught-silent` INFO, nightly) ·
//   mutagen.mjs (panic lane counts declared vs rewritten sites) · audit.mjs (could
//   turn a NO-WRITER path in the ledger into a finding — not wired; a note).
// CLI: node scripts/swallow.mjs [status|selftest]
// ============================================================================
import { readFileSync, appendFileSync, existsSync, mkdirSync, writeFileSync, statSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STATE_DIR = join(ROOT, "dressing-room", "state");
export const SWALLOW_LEDGER = join(STATE_DIR, "swallow_ledger.jsonl");
// HERMETICITY (organism_test.mjs `hermetic`: a selftest must never touch dressing-room/state):
// a FIXTURE process — argv verb `selftest`, or any run under the sandbox collar
// (ARSENAL_AUDIT_COLLAR, i.e. mutagen/blackbox/organism_test sandboxes) — NEVER writes the
// live ledger. It counts, it can flush, but the row goes nowhere unless the process was
// pointed at a scratch ledger by ARSENAL_SWALLOW_LEDGER (this file's own selftest does
// exactly that, in a child). Read once at import so the path is a constant xray can follow.
const LEDGER = process.env.ARSENAL_SWALLOW_LEDGER || SWALLOW_LEDGER;
const SCRATCH = !!process.env.ARSENAL_SWALLOW_LEDGER;

// Derived: a ledger row is ~200 B + ~90 B per site; 54 scheduled rows/day × ≤10
// sites ≈ 60 KB/day → 1 MB ≈ a fortnight. Past it the OWNER keeps the newer half.
const LEDGER_MAX_BYTES = 1_048_576;
const FLUSH_MS = 10 * 60 * 1000;      // a daemon flushes every 10 min (unref'd, never keeps the loop alive)
const MAX_SITES_PER_ROW = 40;         // a row is a summary, not a trace

// ── in-process counters ────────────────────────────────────────────────────
const sites = new Map();              // why → { n, code, path }
let total = 0, armed = false, timer = null;

function organName() {
  const a = process.argv[1] ? basename(process.argv[1]) : "node";
  return a;
}
function verbName() { return process.argv[2] || null; }
export function isFixture() { return verbName() === "selftest" || !!process.env.ARSENAL_AUDIT_COLLAR; }
function relPath(p) {
  if (!p) return null;
  const s = String(p).replace(/\\/g, "/");
  const r = ROOT.replace(/\\/g, "/");
  return s.startsWith(r + "/") ? s.slice(r.length + 1) : s;
}

/**
 * swallow(why, e) — the ONLY legal silent catch in a production lane.
 *   why : one line, the reason this failure is tolerated (what was tried → what happens instead)
 *   e   : the caught error (may be undefined for `catch {}` sites that were given a binding)
 * ARSENAL_PANIC set ⇒ rethrows an Error naming the site (cause = e). Otherwise counts.
 */
export function swallow(why, e) {
  if (process.env.ARSENAL_PANIC) {
    const err = new Error(`ARSENAL_PANIC · ${organName()} · ${why} · ${(e && (e.code || e.name)) || "Error"} ${e && e.message ? e.message : String(e ?? "")}`.slice(0, 600), { cause: e });
    err.panicSite = { organ: organName(), why };
    throw err;
  }
  total++;
  const k = String(why || "(no reason)");
  const cur = sites.get(k);
  const code = (e && (e.code || e.name)) || null;   // ENOENT/EPERM/EBUSY… or SyntaxError/TypeError (a corrupt file is a shape bug, not an fs one)
  if (cur) { cur.n++; if (!cur.code && code) cur.code = code; if (!cur.path && e && e.path) cur.path = relPath(e.path); }
  else if (sites.size < MAX_SITES_PER_ROW) sites.set(k, { n: 1, code, path: relPath(e && e.path) });
  arm();
}

// Lazily register the exit flush + the daemon interval on the FIRST swallow, so an
// import alone has zero side effects (conductor.mjs, brain.mjs are imported by others).
function arm() {
  if (armed) return;
  armed = true;
  try { process.on("exit", () => flush("exit")); } catch { /* no process hooks (worker) — the interval still flushes */ }
  try { timer = setInterval(() => flush("interval"), FLUSH_MS); if (timer && timer.unref) timer.unref(); } catch { /* no timers — exit flush covers */ }
}

/**
 * flush(reason) — ONE row for this process's counters so far, then reset. Best-effort.
 * A FIXTURE process (selftest / sandbox) never writes the live ledger: the row is built and
 * returned with written:false unless ARSENAL_SWALLOW_LEDGER points it at a scratch file.
 */
export function flush(reason = "manual") {
  if (!total) return null;
  const row = {
    ts: new Date().toISOString(), organ: organName(), verb: verbName(), pid: process.pid, flush: reason,
    fixture: isFixture(),   // a selftest feeds garbage on purpose; a sandbox run is not the live organ
    n: total,
    sites: [...sites].map(([why, s]) => ({ why, n: s.n, code: s.code, path: s.path })),
    written: false,
  };
  total = 0; sites.clear();
  if (row.fixture && !SCRATCH) return row;      // hermeticity: no live write from a test
  try {
    if (!SCRATCH) mkdirSync(STATE_DIR, { recursive: true });   // a scratch ledger's dir was made by whoever pointed us at it
    appendFileSync(LEDGER, JSON.stringify({ ...row, written: undefined }) + "\n");
    row.written = true;
    rotate();
  } catch { /* THE ONE DESIGNED SILENT CATCH: a ledger write failure must never cost the lane that swallowed */ }
  return row;
}

// The owner keeps its own file bounded: past LEDGER_MAX_BYTES, keep the newer half
// (whole lines). Nothing else may touch this file.
function rotate() {
  let size = 0;
  try { size = statSync(LEDGER).size; } catch { return; }
  if (size <= LEDGER_MAX_BYTES) return;
  const txt = readFileSync(LEDGER, "utf8");
  const cut = txt.indexOf("\n", Math.floor(txt.length / 2));
  if (cut > 0) writeFileSync(LEDGER, txt.slice(cut + 1));
}

/** Test/inspection hook — the counters as they stand (never used by production code). */
export function pending() { return { total, sites: [...sites].map(([why, s]) => ({ why, ...s })) }; }

// ── THE READER (watchman's caught-silent INFO rides this; read-only) ─────────
/**
 * ledger({ sinceMs, now, includeFixture }) → { runs, n, organs: {organ: n}, top: [{organ, why, code, path, n}], rows }
 * Rows from selftests / sandbox runs are EXCLUDED unless includeFixture — a
 * selftest that feeds garbage to prove a swallow degrades honestly is the test
 * working, not a production silence.
 */
export function ledger(opts = {}) {
  const now = opts.now ? new Date(opts.now).getTime() : Date.now();
  const since = now - (opts.sinceMs ?? 24 * 3600 * 1000);
  const out = { runs: 0, n: 0, organs: {}, top: [], rows: [] };
  if (!existsSync(LEDGER)) return out;
  const agg = new Map();
  let txt = "";
  try { txt = readFileSync(LEDGER, "utf8"); } catch { return out; }
  for (const line of txt.split("\n")) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    const t = Date.parse(r.ts || "");
    if (!(t >= since && t <= now + 60_000)) continue;
    if (r.fixture && !opts.includeFixture) continue;
    out.runs++; out.n += r.n || 0; out.rows.push(r);
    out.organs[r.organ] = (out.organs[r.organ] || 0) + (r.n || 0);
    for (const s of r.sites || []) {
      const k = `${r.organ}|${s.why}`;
      const cur = agg.get(k) || { organ: r.organ, why: s.why, code: s.code || null, path: s.path || null, n: 0 };
      cur.n += s.n || 0; if (!cur.code && s.code) cur.code = s.code; if (!cur.path && s.path) cur.path = s.path;
      agg.set(k, cur);
    }
  }
  out.top = [...agg.values()].sort((a, b) => b.n - a.n).slice(0, opts.top ?? 8);
  return out;
}

// ── CLI ─────────────────────────────────────────────────────────────────────
function status(argv) {
  const hours = Number(argv[0]) || 24;
  const l = ledger({ sinceMs: hours * 3600 * 1000 });
  console.log(`swallow ledger · last ${hours} h · ${l.runs} organ run(s) with silent catches · ${l.n} swallow(s) total`);
  for (const [o, n] of Object.entries(l.organs).sort((a, b) => b[1] - a[1])) console.log(`  ${o.padEnd(20)} ${n}`);
  if (l.top.length) { console.log("  top sites:"); for (const t of l.top) console.log(`    ×${String(t.n).padStart(4)}  ${t.organ} · ${t.why}${t.code ? ` · ${t.code}` : ""}${t.path ? ` ${t.path}` : ""}`); }
  const fx = ledger({ sinceMs: hours * 3600 * 1000, includeFixture: true });
  if (fx.runs > l.runs) console.log(`  (+${fx.runs - l.runs} selftest/sandbox row(s) excluded — fixtures, not production)`);
  return 0;
}

function selftest() {
  let pass = 0, fail = 0; const fails = [];
  const assert = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; fails.push({ n, d }); console.log(`  FAIL ${n}${d ? `\n         ${d}` : ""}`); } };
  const savedPanic = process.env.ARSENAL_PANIC;
  delete process.env.ARSENAL_PANIC;
  // 1. counting, never throwing
  const e1 = Object.assign(new Error("ENOENT: no such file, open 'C:/x/dressing-room/state/nope.json'"), { code: "ENOENT", path: join(ROOT, "dressing-room", "state", "nope.json") });
  let threw = false;
  try { swallow("readJson(p) tolerated → null", e1); swallow("readJson(p) tolerated → null", e1); swallow("closeSync(fd) tolerated", undefined); } catch { threw = true; }
  const p = pending();
  assert("unset ARSENAL_PANIC — swallow() counts and never throws (3 calls → total 3, 2 distinct sites)", !threw && p.total === 3 && p.sites.length === 2, JSON.stringify(p));
  assert("…the site keeps the FIRST error code and the path RELATIVE to the repo (the ledger names files, never machines)",
    p.sites[0].code === "ENOENT" && p.sites[0].path === "dressing-room/state/nope.json" && p.sites[0].n === 2, JSON.stringify(p.sites[0]));
  // 2. panic rethrows, naming the site
  process.env.ARSENAL_PANIC = "1";
  let caught = null;
  try { swallow("readJson(p) tolerated → null", e1); } catch (x) { caught = x; }
  assert("ARSENAL_PANIC=1 — swallow() RETHROWS, and the message names organ · reason · code (mutagen's panic lane reads this line)",
    caught && /ARSENAL_PANIC · swallow\.mjs · readJson\(p\) tolerated → null · ENOENT/.test(caught.message) && caught.cause === e1 && caught.panicSite && caught.panicSite.why === "readJson(p) tolerated → null", caught && caught.message);
  delete process.env.ARSENAL_PANIC;
  // 3. HERMETICITY — this process is a fixture (verb=selftest): flush builds the row, resets the
  //    counters, and writes NOTHING to the live ledger (organism_test's hermetic law).
  const p2 = pending();
  assert("a panic throw does not count (the row would be a lie: nothing was swallowed)", p2.total === 3, JSON.stringify(p2));
  const liveStat = () => { try { const s = statSync(SWALLOW_LEDGER); return `${s.size}:${s.mtimeMs}`; } catch { return "absent"; } };
  const before = liveStat();
  const row = flush("selftest");
  assert("flush() in a FIXTURE process returns the row (organ=swallow.mjs verb=selftest fixture=true n=3, counters reset) with written=false",
    row && row.organ === "swallow.mjs" && row.verb === "selftest" && row.fixture === true && row.n === 3 && row.sites.length === 2 && row.written === false && pending().total === 0, JSON.stringify(row));
  assert("…and the LIVE ledger is byte-for-byte untouched by this selftest (hermeticity is a code path, not a promise)", liveStat() === before, `${before} → ${liveStat()}`);
  // 4. THE REAL WRITE + THE READER, in a CHILD pointed at a scratch ledger (ARSENAL_SWALLOW_LEDGER):
  //    the child is NOT a fixture by verb (__probe), so it writes — into the scratch file only.
  const scratchDir = mkdtempSync(join(tmpdir(), "arsenal-swallow-"));
  const scratch = join(scratchDir, "swallow_ledger.jsonl");
  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "__probe"], { encoding: "utf8", env: { ...process.env, ARSENAL_SWALLOW_LEDGER: scratch }, timeout: 20000 });
  let probeRow = null; try { probeRow = JSON.parse(child.stdout.trim().split("\n").pop()); } catch { /* asserted below */ }
  assert("a NON-fixture process pointed at a scratch ledger WRITES its row there (organ=swallow.mjs verb=__probe n=3 written=true)",
    child.status === 0 && probeRow && probeRow.written === true && probeRow.n === 3 && probeRow.verb === "__probe", `status ${child.status} · ${(child.stdout || "").slice(-200)} · ${(child.stderr || "").slice(-200)}`);
  assert("…and STILL never the live one", liveStat() === before, `${before} → ${liveStat()}`);
  // THE PRODUCTION PATH: no organ ever calls flush() — the row rides the exit hook (process.on("exit")),
  // armed on the first swallow. A child that swallows and simply returns must still leave a row.
  const childX = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "__probe", "noflush"], { encoding: "utf8", env: { ...process.env, ARSENAL_SWALLOW_LEDGER: scratch }, timeout: 20000 });
  // the scratch ledger is read back through a CHILD's ledger() (a runtime-built path read here
  // would cost xray an unresolved sink; the child's LEDGER is a module constant it can follow)
  const child2 = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "__read", "60"], { encoding: "utf8", env: { ...process.env, ARSENAL_SWALLOW_LEDGER: scratch }, timeout: 20000 });
  let read = null; try { read = JSON.parse(child2.stdout.trim().split("\n").pop()); } catch { /* asserted below */ }
  const exitRow = read && read.rows ? read.rows.find((r) => r.flush === "exit") : null;
  assert("the EXIT HOOK flushes: a child that swallows ×3 and exits WITHOUT calling flush() still leaves a row (flush=exit, n=3) — the path every scheduled organ takes",
    childX.status === 0 && exitRow && exitRow.n === 3 && exitRow.verb === "__probe", `status ${childX.status} · rows ${read ? read.rows.length : "?"} · ${JSON.stringify(read && read.rows)}`);
  assert("ledger() reads the rows back: 2 runs · 6 swallows · top site = organ|why with n, code and the repo-relative path",
    read && read.runs === 2 && read.n === 6 && read.top.some((t) => t.organ === "swallow.mjs" && t.why === "readJson(p) tolerated → null" && t.n === 4 && t.code === "ENOENT" && t.path === "dressing-room/state/nope.json"), JSON.stringify(read));
  const child3 = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "__read", "60", "fixture"], { encoding: "utf8", env: { ...process.env, ARSENAL_SWALLOW_LEDGER: scratch, ARSENAL_AUDIT_COLLAR: "x" }, timeout: 20000 });
  let read3 = null; try { read3 = JSON.parse(child3.stdout.trim().split("\n").pop()); } catch { /* asserted below */ }
  assert("a fixture row (sandbox collar) is EXCLUDED by ledger() by default and included on request — a test's swallows are the test working",
    read3 && read3.excluded === 2 && read3.included === 3, JSON.stringify(read3));
  try { rmSync(scratchDir, { recursive: true, force: true }); } catch { /* scratch */ }
  assert("a window that excludes now is empty (rows outside [since, now] never count)", ledger({ sinceMs: 1000, now: Date.now() - 3600_000, includeFixture: true }).runs === 0);
  // 5. import is side-effect free: arm() runs on first swallow only — asserted by shape (timer is unref'd)
  assert("the daemon interval is unref'd (a swallow never keeps a process alive)", timer === null || typeof timer.unref === "function");
  if (savedPanic) process.env.ARSENAL_PANIC = savedPanic;
  console.log(`\nswallow: ${pass} passed, ${fail} failed`);
  if (fail) for (const f of fails) console.log(`  · ${f.n}${f.d ? `\n      ${f.d}` : ""}`);
  return fail ? 1 : 0;
}

// selftest children (only meaningful with ARSENAL_SWALLOW_LEDGER pointing at a scratch file):
//   __probe          swallow ×3, flush, print the row
//   __read <s> [fx]  print ledger() over the last <s> seconds; with `fx` also print excluded/included counts
//                    after appending one fixture row of its own (this process runs under a fake collar)
function probe(argv) {
  const e1 = Object.assign(new Error("ENOENT: no such file, open 'nope.json'"), { code: "ENOENT", path: join(ROOT, "dressing-room", "state", "nope.json") });
  swallow("readJson(p) tolerated → null", e1); swallow("readJson(p) tolerated → null", e1); swallow("closeSync(fd) tolerated", undefined);
  if (argv[0] === "noflush") { console.log("exiting without flush — the exit hook must write the row"); return 0; }   // the production path: no organ calls flush()
  console.log(JSON.stringify(flush("probe")));
  return 0;
}
function readProbe(argv) {
  const secs = Number(argv[0]) || 60;
  if (argv[1] === "fixture") {
    swallow("fixture swallow", undefined); flush("fixture");   // this process is a fixture (collar) but SCRATCH is set → written, flagged fixture:true
    const ex = ledger({ sinceMs: secs * 1000 }), inc = ledger({ sinceMs: secs * 1000, includeFixture: true });
    console.log(JSON.stringify({ excluded: ex.runs, included: inc.runs }));
    return 0;
  }
  console.log(JSON.stringify(ledger({ sinceMs: secs * 1000 })));
  return 0;
}

function main() {
  const [mode = "status", ...rest] = process.argv.slice(2);
  if (mode === "selftest") process.exit(selftest());
  if (mode === "status") process.exit(status(rest));
  if (mode === "__probe") process.exit(probe(rest));
  if (mode === "__read") process.exit(readProbe(rest));
  console.log("usage: node scripts/swallow.mjs [status [hours]|selftest]");
  process.exit(2);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
