// unit mbare · THE WITNESS (mlaw2 fork F7 B, forks row 1231) — the bare-state guard of the laws mode, planted both ways.
//   node ci/mbare/witness_mbare.mjs --org <dir> --base-org <dir>
// CONTRACT. <dir> is a checkout of a tree (the member hands LF trees with their tracked state; a CRLF checkout reads the same:
// every output is split on \r?\n and every source edit below is CR-tolerant). Everything is planted on COPIES under ONE temp
// dir made here (os.tmpdir()), removed at the end; nothing is written anywhere else, no state file of any checkout is touched.
//   Z(<tree>) = a copy of the tree with its dressing-room/state dir made EMPTY (none of his bytes);
//   T(<tree>) = a copy WITH the tracked state (its bytes are his: off T only counts and a 16-hex hash of the assert lines leave,
//               never a line).
// Each plant runs `node scripts/organism_test.mjs laws` in the FULL profile (the profile that judges a LIVE assert), with every
// home door under the temp dir, a refusing claude + gemini shim first on PATH (no live model call), every ARSENAL_*PORT door
// the tree's own scripts read handed a port the OS picked (listen 0, read, close: no fixed port, no live service, nothing
// POSTed at a daemon, nothing restarted), and every wait bounded by the tree's OWN member bound (HEAVY_BOUND_MS read off its
// organism_test.mjs; never typed here).
// CLAUSES (each RED on the base 5301f15, GREEN on the build; each has one mutant in run_mutants_mbare.mjs):
//   REACH         on Z(org) the laws mode runs to its end: no `MODE laws · ran to its end` red, and every LIVE assert key of
//                 org's LIVE_ASSERTS that T(org) judges in laws is PRINTED on Z(org) (ok, FAIL or BLOCKED): none unreached.
//   NEVER-A-PASS  on Z(org) the guard FIRES and never passes: ≥ 1 `BLOCKED BY ITS INPUT · <block> — the state input <x> is
//                 absent` red, each naming an input; every `BLOCKED <assert>` line names an input that one of those reds names;
//                 no BLOCKED assert is also printed `ok`; the mode exits non-zero.
//   TRANSPARENT   with the inputs present the guard changes nothing: T(org) prints zero BLOCKED lines and its assert lines are
//                 byte-identical (one hash) to T(base-org)'s — and the guard is armed (it fired on Z(org), whatever its verdict).
//   RETHROW       a throw that is NOT an absent input is never swallowed: on Z(org) with a planted `throw` at the head of the A9
//                 block, the mode ends with `MODE laws · ran to its end` carrying the planted message and no A9 block is
//                 BLOCKED — while the unplanted Z(org) run reaches its end (REACH's run): the stop is the plant's, not the bare dir's.
// CHECKS: BOUND — between base-org and org only the named files differ (scripts/organism_test.mjs and ci/mbare/**); its RED is
// the one a member tolerates when main moves on. LAST — no node process naming the temp dir survives.
// LAST LINE: GREEN MBARE <what> · <n> clause(s) (exit 0) or RED MBARE · <clauses> (exit 1).
import { spawnSync } from "node:child_process"; import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync, symlinkSync, existsSync, realpathSync, lstatSync } from "node:fs";
import { join, relative, sep } from "node:path"; import { tmpdir } from "node:os";
import { plantEnv } from "./tools/plant.mjs";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org"), BASEORG = arg("--base-org");
if (!ORG || !BASEORG) { console.log("RED MBARE · USAGE (node ci/mbare/witness_mbare.mjs --org <dir> --base-org <dir>)"); process.exit(1); }
const TMP = mkdtempSync(join(tmpdir(), "mbare-w-"));
// os.tmpdir() reads these at each call: every temp dir made after this line (plantEnv's homes and shims, each run's own) is
// made INSIDE TMP, so one removal at the end takes all of it
for (const k of ["TMPDIR", "TMP", "TEMP"]) process.env[k] = TMP;
const SD = join("dressing-room", "state");
const fold = (n) => String(n).replace(/\d+/g, "#");
const hash = (t) => createHash("sha256").update(t).digest("hex").slice(0, 16);
/** @type {Record<string, { ok: boolean, why: string }>} */ const clauses = {};
const say = (id, ok, why) => { clauses[id] = { ok, why }; console.log(`${ok ? "GREEN" : "RED  "} ${id} — ${why}`); };

/** a copy of <tree> under TMP; Z = its state dir EMPTY, T = with the tracked state. node_modules re-linked, never copied. */
let n = 0;
function plantOf(tree, side, edit) {
  const d = join(TMP, `${side}${++n}`);
  cpSync(tree, d, { recursive: true, filter: (src) => { const r = relative(tree, src).split(sep).join("/");
    return r !== "node_modules" && !r.startsWith("node_modules/") && r !== ".git" && !r.startsWith(".git/") && (side === "T" || !(r === "dressing-room/state" || r.startsWith("dressing-room/state/"))); } });
  mkdirSync(join(d, SD), { recursive: true });
  const nm = join(tree, "node_modules");
  if (existsSync(nm)) symlinkSync(realpathSync(nm), join(d, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  if (edit) { const f = join(d, "scripts", "organism_test.mjs"); writeFileSync(f, edit(readFileSync(f, "utf8"))); }
  return d;
}
const boundOf = (d) => { const m = /const HEAVY_BOUND_MS = (\d+);/.exec(readFileSync(join(d, "scripts", "organism_test.mjs"), "utf8")); if (!m) throw new Error("HEAVY_BOUND_MS not found in the tree's organism_test.mjs"); return Number(m[1]); };
/** run the laws mode, FULL profile, on a plant; returns its lines (the caller keeps off T only counts and hashes) */
async function laws(d) {
  const { env, home } = await plantEnv(d); delete env.ORGANISM_TEST_PROFILE;
  const t0 = Date.now(), bound = boundOf(d);
  const r = spawnSync(process.execPath, [join("scripts", "organism_test.mjs"), "laws"], { cwd: d, env, encoding: "utf8", timeout: bound, maxBuffer: 1 << 28, windowsHide: true });
  return { code: r.status, killed: r.status === null, ms: Date.now() - t0, bound, d, L: ((r.stdout || "") + (r.stderr || "")).split(/\r?\n/) };
}
const asserts = (L) => L.filter((l) => /^  (ok  |FAIL) |^  BLOCKED /.test(l));
/** LIVE_ASSERTS keys off a tree's own source */
function liveAssertKeys(d) {
  const s = readFileSync(join(d, "scripts", "organism_test.mjs"), "utf8").split(/\r?\n/);
  const a = s.findIndex((l) => l.startsWith("const LIVE_ASSERTS = Object.freeze({")), b = s.findIndex((l, i) => i > a && l.startsWith("});"));
  return a < 0 ? [] : s.slice(a + 1, b).filter((l) => !/^\s*\/\//.test(l)).map((l) => (/^\s+"([^"]+)":/.exec(l) || [])[1]).filter(Boolean);
}
const keyMatch = (k, name) => { const f = fold(name); return f.startsWith(k) || f.slice(0, 90) === k; };
const named = (L, k) => L.some((l) => { const m = /^  (?:ok  |FAIL|BLOCKED) (.*?)(?: — not judged: its input .*)?$/.exec(l); return !!m && keyMatch(k, m[1]); });
// the planted defect: a throw at the head of the A9 block's body (the first line opening a block after the A9 name, inside laws())
const DEFECT = "mbare planted defect: not an absent input";
const plantDefect = (txt) => { const L = txt.split("\n"); const lawsAt = L.findIndex((l) => /^async function laws\(\)/.test(l));
  const a = L.findIndex((l, i) => i > lawsAt && l.includes('"A9 · both study skills were readable'));
  const b = L.findIndex((l, i) => i >= a && /(\)\) \{|=> \{)\r?$/.test(l));
  if (a < 0 || b < 0) throw new Error("the A9 block was not found in the tree's laws()");
  L.splice(b + 1, 0, `      throw new Error(${JSON.stringify(DEFECT)});`); return L.join("\n"); };

try {
  // ── the runs ────────────────────────────────────────────────────────────────────────────────────────────────────────
  const zo = await laws(plantOf(ORG, "Z")), to = await laws(plantOf(ORG, "T")), tb = await laws(plantOf(BASEORG, "T"));
  const zd = await laws(plantOf(ORG, "Z", plantDefect));
  const keys = liveAssertKeys(ORG), toA = asserts(to.L), zoA = asserts(zo.L);
  const lawKeys = keys.filter((k) => named(toA, k));
  console.log(`runs · Z(org) exit ${zo.code} · ${zoA.length} assert line(s) · T(org) exit ${to.code} · ${toA.length} · T(base-org) exit ${tb.code} · ${asserts(tb.L).length} · Z(org)+defect exit ${zd.code} · ${asserts(zd.L).length} · ${lawKeys.length} LIVE laws key(s) judged on T(org)`);

  // THE STOP LINE (runner M order, architect row 1300 (2)): every red of the four clauses names WHERE each run ended, so a
  // red read on another machine explains itself — killed at the tree's bound (its ms against the bound), or threw (the
  // MODE red's first detail line, the plant's temp path masked: organ code text, never a state byte), or ran to its end.
  const stopOf = (x, tag) => {
    const i = x.L.findIndex((l) => l.startsWith("  FAIL MODE laws · ran to its end"));
    const before = asserts(x.L.slice(0, i < 0 ? x.L.length : i)).pop() || "(none)";
    const why = x.killed ? `KILLED at the tree's bound (${x.ms} of ${x.bound} ms)` : i < 0 ? `ended (${x.ms} ms, exit ${x.code})`
      : `THREW (${x.ms} ms): ${String(x.L.slice(i + 1).find((l) => l.trim()) || "(no detail)").trim().split(x.d).join("<plant>").split(TMP).join("<tmp>").slice(0, 240)}`;
    return `${tag} ${why} · last assert line before: ${before.trim().replace(/ — not judged: .*$/, "").slice(0, 120)}`;
  };
  for (const [x, tag] of [[zo, "Z(org)"], [to, "T(org)"], [tb, "T(base-org)"], [zd, "Z(org)+defect"]]) console.log(`stop · ${stopOf(x, tag)}`);

  // ── REACH ───────────────────────────────────────────────────────────────────────────────────────────────────────────
  const threw = zo.L.some((l) => l.startsWith("  FAIL MODE laws · ran to its end"));
  const unreached = lawKeys.filter((k) => !named(zoA, k));
  say("REACH", !zo.killed && !threw && lawKeys.length > 0 && unreached.length === 0,
    zo.killed ? "Z(org) was killed at the tree's member bound" : `Z(org): ${threw ? "the mode THREW (MODE laws · ran to its end)" : "the mode ran to its end"} · ${lawKeys.length - unreached.length} of ${lawKeys.length} LIVE laws key(s) printed${unreached.length ? ` · unreached: ${unreached.length}` : ""}`);

  // ── NEVER-A-PASS ────────────────────────────────────────────────────────────────────────────────────────────────────
  const guardReds = zo.L.map((l) => /^  FAIL BLOCKED BY ITS INPUT · (.+) — the state input (.+) is absent, so the block is not judged/.exec(l)).filter(Boolean);
  const inputs = new Set(guardReds.map((m) => m[2]));
  const blockedLines = zo.L.map((l) => /^  BLOCKED (.*) — not judged: its input (.+) is absent from the state dir$/.exec(l)).filter(Boolean);
  const orphan = blockedLines.filter((m) => !inputs.has(m[2]));
  const passed = blockedLines.filter((m) => zo.L.includes(`  ok   ${m[1]}`));
  say("NEVER-A-PASS", guardReds.length > 0 && guardReds.every((m) => m[2].trim().length > 0) && orphan.length === 0 && passed.length === 0 && zo.code !== 0,
    `Z(org): ${guardReds.length} guard red(s) naming ${inputs.size} input(s) · ${blockedLines.length} BLOCKED assert line(s)${orphan.length ? ` · ${orphan.length} naming no guard red's input` : ""}${passed.length ? ` · ${passed.length} ALSO printed ok` : ""} · exit ${zo.code}`);

  // ── TRANSPARENT ─────────────────────────────────────────────────────────────────────────────────────────────────────
  const tbA = asserts(tb.L), blockedT = toA.filter((l) => /^  BLOCKED |BLOCKED BY ITS INPUT/.test(l)).length;
  const same = hash(toA.join("\n")) === hash(tbA.join("\n"));
  const armed = zoA.some((l) => /^  BLOCKED |^  (?:ok  |FAIL) BLOCKED BY ITS INPUT · /.test(l));   // fired, whatever its verdict
  say("TRANSPARENT", !to.killed && !tb.killed && blockedT === 0 && same && toA.length > 0 && armed,
    `T(org) ${toA.length} assert line(s) h ${hash(toA.join("\n"))} · T(base-org) ${tbA.length} h ${hash(tbA.join("\n"))} · ${same ? "identical" : "DIFFER"} · BLOCKED on T(org) ${blockedT} · the guard ${armed ? "fired" : "NEVER fired"} on Z(org)`);

  // ── RETHROW ─────────────────────────────────────────────────────────────────────────────────────────────────────────
  const modeRed = zd.L.findIndex((l) => l.startsWith("  FAIL MODE laws · ran to its end"));
  const carries = modeRed >= 0 && (zd.L[modeRed + 1] || "").includes(DEFECT);
  const a9Blocked = zd.L.some((l) => /^  FAIL BLOCKED BY ITS INPUT · A9/.test(l) || (/^  BLOCKED A9 /.test(l)));
  say("RETHROW", carries && !a9Blocked && !threw,
    `Z(org)+defect: ${carries ? "the mode ended on the planted throw (re-thrown)" : "the planted throw did NOT end the mode"}${a9Blocked ? " · the A9 block was BLOCKED (swallowed as an input)" : ""} · the unplanted Z(org) ${threw ? "ALSO stopped (the stop is the bare dir's, not the plant's)" : "ran to its end"}`);

  // ── BOUND (check) ───────────────────────────────────────────────────────────────────────────────────────────────────
  const walk = (root) => { const out = new Map(); const go = (d) => { for (const e of readdirSync(d)) { const p = join(d, e), r = relative(root, p).split(sep).join("/");
    if (r === "node_modules" || r === ".git") continue; const st = lstatSync(p); if (st.isDirectory()) go(p); else if (st.isFile()) out.set(r, hash(readFileSync(p).toString("latin1").replace(/\r\n/g, "\n"))); } }; go(root); return out; };
  const wo = walk(ORG), wb = walk(BASEORG);
  const diff = [...new Set([...wo.keys(), ...wb.keys()])].filter((p) => wo.get(p) !== wb.get(p)).sort();
  const outside = diff.filter((p) => p !== "scripts/organism_test.mjs" && !p.startsWith("ci/mbare/"));
  say("BOUND", outside.length === 0, `${diff.length} path(s) differ base-org → org · outside the named files: ${outside.length ? outside.slice(0, 8).join(", ") + (outside.length > 8 ? " …" : "") : "none"}`);
} catch (e) {
  say("WITNESS", false, `the witness itself threw: ${String(e instanceof Error ? e.message : e).slice(0, 200)}`);
} finally {
  try { rmSync(TMP, { recursive: true, force: true }); } catch { /* LAST names what survives */ }
}

// ── LAST (check): no node process naming the temp dir survives ───────────────────────────────────────────────────────
const naming = (() => {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true });
    return String(r.stdout || "").split(/\r?\n/).filter((l) => l.toLowerCase().includes(TMP.toLowerCase())).map((l) => Number(l.trim().split(" ")[0])).filter((p) => p && p !== process.pid);
  }
  const out = []; for (const p of existsSync("/proc") ? readdirSync("/proc").filter((x) => /^\d+$/.test(x)) : []) {
    try { if (Number(p) !== process.pid && readFileSync(`/proc/${p}/cmdline`, "utf8").split("\0").join(" ").includes(TMP)) out.push(Number(p)); } catch { /* gone */ } }
  return out; })();
say("LAST", naming.length === 0, naming.length ? `${naming.length} node process(es) still name the temp dir` : "no node process names the temp dir");

const CLAUSES = ["REACH", "NEVER-A-PASS", "TRANSPARENT", "RETHROW"];
const red = Object.entries(clauses).filter(([, v]) => !v.ok).map(([k]) => k);
if (red.length) { console.log(`RED MBARE · ${red.join(" · ")}`); process.exit(1); }
console.log(`GREEN MBARE the laws mode passes a bare state dir by naming each blocked input, and changes nothing where the inputs exist · ${CLAUSES.length} clause(s)`);
process.exit(0);
