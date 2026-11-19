#!/usr/bin/env node
// ============================================================================
// ci/mrung/witness_mrung.mjs — UNIT mrung · THE RUNG RECEIPT (row 1058 (5) · rulings forks row 1122 (2))
// ----------------------------------------------------------------------------
// USAGE: node ci/mrung/witness_mrung.mjs --org <dir> --base-org <dir> [--only <clause>[,<clause>…]]
//   --org       the tree to witness (the build reads GREEN; the base, main 224f9b9 — ci/mrung/BASE — reads RED on every W clause)
//   --base-org  the BASE tree — BOUND needs it; absent, BOUND is RED
//   --only      run only these clause ids (the mutant runner's door); BOUND and LAST always run
// CONTRACT — every plant runs on a COPY of --org under os.tmpdir(): its tracked (and untracked, not ignored) files, never
//   .git, never node_modules (that rides as a link), and an EMPTY dressing-room/state (nothing of his is copied or printed).
//   The copy is made a git repo here, `git init` with core.autocrlf=false (row 1036), so HEADs are the copy's own. Each clause
//   plants its own state dir under the same temp root, reached ONLY through the env doors ARSENAL_RUNG_STATE_DIR (rung_receipt.mjs,
//   honoured under os.tmpdir() only) and ARSENAL_SITTING_STATE_DIR (day.mjs's own door): the meter, the sitting close rows and
//   the receipts are planted files, written by this script. THE PORT CLASS (row 1053): no port is bound, no service named, nothing
//   POSTed, nothing restarted; no model is called (nothing here spawns claude). Every child is a spawnSync, bounded by
//   rung_receipt.mjs's own WITNESS_TIMEOUT_MS when the org exports it, else by the longest child this run measured — never a typed
//   number. Every line read from a process is split on \r?\n; BOUND hashes text with CRLF folded to LF; processes are listed
//   through PowerShell on Windows, `ps` elsewhere.
// CLAUSES (spec ci/mrung/MRUNG_SPEC.md @ 0e0f001 §6; where the ruling of row 1122 differs, the ruling wins):
//   W1   TYPED-REFUSED     a legacy hand rung file ("RED hand typed"/"GREEN hand typed"/"x"=="x") counts in nothing: hand 1 REFUSED
//   W2   NO-GUESSED-ZERO   an empty rungs/ and a plan with rungs [] both print UNREAD, never 0/0
//   W3   NO-RECEIPT-UNREAD a plan of 2 clauses, a full receipt for 1 → 1/2 GREEN · 1 UNREAD
//   W4   WRITER-MEASURES   `red` records the child's own exit (1, and 2 in a sub-plant), sha256 of its output, the copy's HEAD
//   W5   RED-MUST-BE-RED   `red` on a witness that exits 0 is refused, the receipt byte-unchanged
//   W6   NO-TYPED-FLAG     `red … --exit 1` and `green … --verdict GREEN` refused before any child runs (no marker left)
//   W7   REAL-DAY (F1 b)   `green --day D`: (a) no close row, (b) a day-rollover close, (d) a fulltime close with no host → refused;
//                          (c) a fulltime close with a bound host → a green row whose day_proof names that sitting
//   W8   METER-EQUAL       a witness that appends to the meter during `green` → meter row equal:false, done prints RED (meter moved)
//   W9   CHAIN             a well-shaped row with a wrong prev_sha256 → verify exit 1, done REFUSED (chain), `red` refuses to append
//   W10  SAME-WITNESS      `green` at the red row's HEAD refused; a plan whose witness changed reads RED (witness changed)
//   W11  HERMETIC-PLANTED  done --hermetic --receipts <planted> reads the green clause GREEN; without --receipts every clause is
//                          UNREAD even with a GREEN receipt planted at the state path (the state file is never opened)
//   W12  ONE-WRITER        xray over the copy: rung_receipts.jsonl has exactly ONE writer, rung_receipt.mjs, and done.mjs reads it
//   W13  PRIVATE (F9 b)    the TRACKED receipt holds none of his words and no name: a planted close row carrying a marker word and
//                          a witness printing a marker leave neither in the receipt; every row's keys are the contract's own
//   G1   OLD-DAY (carried) the meter's 2026-11-13 row reading GREEN keeps a clause from GREEN (both trees)
//   G2   ONE-LINE (carried) done.mjs line --hermetic prints ONE `DONE · ` line holding `rungs UNREAD` (both trees)
//   BOUND only the named files differ from --base-org (ci/mrung/** is this unit's own output)
//   LAST  no node process naming the temp root survives
// LAST LINE: GREEN MRUNG <what> · <n> clause(s) (exit 0) or RED MRUNG · <clauses> (exit 1)
// ============================================================================
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, statSync, symlinkSync, appendFileSync, copyFileSync } from "node:fs";
import { join, resolve, relative, dirname, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const UNIT = "MRUNG";
const argv = process.argv.slice(2);
const flag = (k) => { const i = argv.indexOf(k); return i > -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null; };
const ORG = flag("--org") ? resolve(flag("--org")) : null;
const BASE_ORG = flag("--base-org") ? resolve(flag("--base-org")) : null;
const ONLY = flag("--only") ? new Set(flag("--only").split(",").map((s) => s.trim()).filter(Boolean)) : null;
const NAMED = ["scripts/rung_receipt.mjs", "scripts/done.mjs", "scripts/day.mjs", "package.json"];
const SKIP_TOP = new Set([".git", "node_modules"]);
const slash = (p) => p.split(sep).join("/");
const sha = (b) => createHash("sha256").update(b).digest("hex");
const lines = (t) => String(t || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const results = [];
const clause = (id, ok, why) => { results.push({ id, ok: !!ok }); console.log(`${ok ? "GREEN" : "RED  "} ${id} · ${why}`); };
const want = (id) => !ONLY || ONLY.has(id);
if (!ORG) { console.log(`RED ${UNIT} · WITNESS (no --org)`); process.exit(1); }

const TMP = mkdtempSync(join(tmpdir(), "mrung-witness-"));
const P = join(TMP, "org");
let maxMs = 0;
let BOUND_MS = null;   // set from the org's own export once the copy exists
const run = (file, args, { cwd = P, env = {}, input } = {}) => {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [file, ...args], { cwd, encoding: "utf8", windowsHide: true, input, env: { ...process.env, ...env, ORGANISM_TEST_PROFILE: "" }, ...(BOUND_MS ? { timeout: BOUND_MS } : {}) });
  maxMs = Math.max(maxMs, Date.now() - t0);
  return { code: r.status, out: `${r.stdout || ""}${r.stderr || ""}`, stdout: r.stdout || "", stderr: r.stderr || "" };
};
const git = (args, cwd = P) => spawnSync("git", ["-c", "core.autocrlf=false", "-c", "user.name=witness", "-c", "user.email=witness@invalid", "-c", "commit.gpgsign=false", ...args], { cwd, encoding: "utf8", windowsHide: true });

let exitCode = 1;
try {
  // ── THE COPY ──────────────────────────────────────────────────────────────────────────────────────────────────
  const listed = (() => {
    if (existsSync(join(ORG, ".git"))) {
      const r = spawnSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: ORG, encoding: "utf8" });
      if (r.status === 0) return r.stdout.split("\0").filter(Boolean);
    }
    const acc = []; const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n), rel = slash(relative(ORG, p)); if (SKIP_TOP.has(rel.split("/")[0])) continue; if (statSync(p).isDirectory()) walk(p); else acc.push(rel); } }; walk(ORG); return acc;
  })();
  for (const rel of listed) {
    if (rel.startsWith("dressing-room/state/") || SKIP_TOP.has(rel.split("/")[0])) continue;
    const src = join(ORG, rel); if (!existsSync(src) || statSync(src).isDirectory()) continue;
    mkdirSync(dirname(join(P, rel)), { recursive: true }); copyFileSync(src, join(P, rel));
  }
  mkdirSync(join(P, "dressing-room", "state"), { recursive: true });
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(P, "node_modules"), "junction");
  // the planted witness: its exit is ci/plant/mode.txt; it appends to the meter when ci/plant/append.txt exists; it leaves a marker
  // in the rung state dir when it runs; its output carries a marker word that must never reach the receipt (W13)
  mkdirSync(join(P, "ci", "plant"), { recursive: true });
  writeFileSync(join(P, "ci", "plant", "w.mjs"), [
    'import { readFileSync, existsSync, appendFileSync, writeFileSync } from "node:fs";',
    'import { join, dirname } from "node:path";',
    'import { fileURLToPath } from "node:url";',
    'const here = dirname(fileURLToPath(import.meta.url));',
    'const sd = process.env.ARSENAL_RUNG_STATE_DIR;',
    'if (sd) writeFileSync(join(sd, "ran.marker"), "ran");',
    'if (sd && existsSync(join(here, "append.txt"))) appendFileSync(join(sd, "daily_green.jsonl"), JSON.stringify({ date: "2026-11-21", green: true }) + "\\n");',
    'console.log("planted witness · MARKER-WITNESS-OUTPUT-WORD");',
    'process.exit(Number(readFileSync(join(here, "mode.txt"), "utf8").trim()));', ""].join("\n"));
  writeFileSync(join(P, "ci", "plant", "mode.txt"), "1\n");
  const gi = git(["init", "-q"]); if (gi.status) throw new Error(`git init: ${gi.stderr}`);
  git(["add", "-A"]); const gc = git(["commit", "-q", "-m", "plant"]); if (gc.status) throw new Error(`git commit: ${gc.stderr}`);
  const HAS = existsSync(join(P, "scripts", "rung_receipt.mjs"));
  if (HAS) { try { BOUND_MS = (await import(pathToFileURL(join(P, "scripts", "rung_receipt.mjs")).href)).WITNESS_TIMEOUT_MS || null; } catch { BOUND_MS = null; } }
  const W = "node ci/plant/w.mjs";
  const head = () => String(git(["rev-parse", "HEAD"]).stdout).trim();
  let n = 0;
  const commit = (mode, { append = false } = {}) => {
    writeFileSync(join(P, "ci", "plant", "mode.txt"), `${mode}\n`);
    if (append) writeFileSync(join(P, "ci", "plant", "append.txt"), "1\n"); else rmSync(join(P, "ci", "plant", "append.txt"), { force: true });
    writeFileSync(join(P, "ci", "plant", "tick.txt"), `${++n}\n`);
    git(["add", "-A"]); git(["commit", "-q", "-m", `tick ${n}`]);
    return head();
  };
  const D = "2026-11-20";
  const REVIEW = (o) => JSON.stringify({ kind: "sitting_review", sitting_id: o.id, closed_at: o.closed_at || "2026-11-20T15:00:00.000Z", reason: o.reason, opened_at: "2026-11-20T04:00:00.000Z", host_session_id: o.host === undefined ? "11111111-2222-3333-4444-555555555555" : o.host, concept: "MARKER-HIS-WORD", task: "MARKER-HIS-WORD" });
  const state = (name, { reviews = [{ id: "sit-real", reason: "fulltime" }], oldGreen = false } = {}) => {
    const S = join(TMP, "state-" + name); mkdirSync(S, { recursive: true });
    writeFileSync(join(S, "sitting_reviews.jsonl"), reviews.map(REVIEW).join("\n") + (reviews.length ? "\n" : ""));
    writeFileSync(join(S, "daily_green.jsonl"), JSON.stringify({ date: "2026-11-13", green: oldGreen }) + "\n");
    return S;
  };
  const rr = (S, args) => run(join(P, "scripts", "rung_receipt.mjs"), args, { env: { ARSENAL_RUNG_STATE_DIR: S, ARSENAL_SITTING_STATE_DIR: S } });
  const receipts = (S) => join(S, "rung_receipts.jsonl");
  const rows = (S) => { try { return lines(readFileSync(receipts(S), "utf8")).map((l) => JSON.parse(l)); } catch { return []; } };
  const bytes = (p) => { try { return sha(readFileSync(p)); } catch { return "absent"; } };
  const camp = (name, plan, hand) => {
    const C = join(TMP, "camp-" + name); mkdirSync(join(C, "rungs"), { recursive: true });
    if (plan) writeFileSync(join(C, "rungs", "plan_v3.json"), JSON.stringify({ plan: "v3", source: "plan_v3.md", source_sha256: sha("planted plan"), ...plan }));
    if (hand) writeFileSync(join(C, "rungs", "S1.json"), JSON.stringify(hand));
    return C;
  };
  const done = (args) => run(join(P, "scripts", "done.mjs"), ["report", "--hermetic", ...args]);
  const rungLine = (o) => (lines(o.out).find((l) => l.startsWith("DONE rungs")) || lines(o.out).slice(-1)[0] || "").slice(0, 300);
  const plan1 = (rung, clauses, witness = W) => ({ rungs: [{ rung, clauses: clauses.map((id) => ({ id, witness })) }], loops: [] });
  /** the happy path: red at mode 1 → commit mode 0 → green on the real day; returns the state dir */
  const happy = (name, rung, { oldGreen = false } = {}) => {
    commit(1); const S = state(name, { oldGreen });
    const a = rr(S, ["red", "--rung", rung, "--clause", "c1", "--cmd", W]); commit(0);
    const b = rr(S, ["green", "--rung", rung, "--clause", "c1", "--day", D]);
    return { S, a, b };
  };
  const HAND = { rung: "S1", clauses: [{ id: "c1", red_before: "RED hand typed", green_real_day: "GREEN hand typed", meter_before: "x", meter_after: "x" }] };

  if (want("W1")) {
    const M = join(TMP, "meter-w1.jsonl"); writeFileSync(M, JSON.stringify({ date: "2026-11-13", green: false }) + "\n");
    const a = done(["--campaign", camp("w1a", null, HAND), "--meter", M]);
    const b = done(["--campaign", camp("w1b", plan1("S2", ["c1"]), HAND), "--meter", M]);
    const ok = /hand 1 REFUSED/.test(a.out) && !/rungs 1\/1/.test(a.out) && /0\/1 GREEN/.test(b.out) && /hand 1 REFUSED/.test(b.out);
    clause("W1", ok, `hand file alone: ${rungLine(a)} | with a plan: ${rungLine(b)}`);
  }
  if (want("W2")) {
    const a = done(["--campaign", camp("w2a")]), b = done(["--campaign", camp("w2b", { rungs: [], loops: [] })]);
    const ok = [a, b].every((x) => !/0\/0/.test(x.out) && /DONE rungs\s+UNREAD/.test(x.out)) && /holds no clause/.test(b.out);
    clause("W2", ok, `empty rungs/: ${rungLine(a)} | plan rungs []: ${rungLine(b)}`);
  }
  if (want("W3")) {
    const h = happy("w3", "S3");
    const o = done(["--campaign", camp("w3", plan1("S3", ["c1", "c2"])), "--receipts", receipts(h.S)]);
    clause("W3", /1\/2 GREEN · 1 UNREAD/.test(o.out) && /S3:c2 UNREAD/.test(o.out), rungLine(o));
  }
  if (want("W4")) {
    const h1 = commit(1); const S = state("w4");
    const a = rr(S, ["red", "--rung", "S4", "--clause", "c1", "--cmd", W]);
    const direct = spawnSync(process.execPath, [join(P, "ci", "plant", "w.mjs")], { cwd: P, encoding: "buffer", env: { ...process.env, ARSENAL_RUNG_STATE_DIR: S } });
    const outSha = sha(Buffer.concat([direct.stdout, direct.stderr]));
    const r1 = rows(S)[0] || {};
    commit(2); const S2 = state("w4b");
    rr(S2, ["red", "--rung", "S4", "--clause", "c2", "--cmd", W]);
    const r2 = rows(S2)[0] || {};
    const ok = a.code === 0 && r1.kind === "red" && r1.exit === 1 && r1.out_sha256 === outSha && r1.head_sha === h1 && r2.exit === 2;
    clause("W4", ok, `red exit ${r1.exit} · out ${String(r1.out_sha256).slice(0, 12)} vs measured ${outSha.slice(0, 12)} · sub-plant exit ${r2.exit} · ${lines(a.out).slice(-1)[0] || ""}`.slice(0, 300));
  }
  if (want("W5")) {
    commit(0); const S = state("w5"); const before = bytes(receipts(S));
    const a = rr(S, ["red", "--rung", "S5", "--clause", "c1", "--cmd", W]);
    clause("W5", HAS && a.code === 1 && /REFUSED/.test(a.out) && bytes(receipts(S)) === before, `${(lines(a.out).slice(-1)[0] || "").slice(0, 200)} · receipt ${bytes(receipts(S)) === before ? "byte-unchanged" : "MOVED"}`);
  }
  if (want("W6")) {
    commit(1); const S = state("w6");
    const a = rr(S, ["red", "--rung", "S6", "--clause", "c1", "--cmd", W, "--exit", "1"]);
    const m1 = existsSync(join(S, "ran.marker"));
    const b = rr(S, ["green", "--rung", "S6", "--clause", "c1", "--day", D, "--verdict", "GREEN"]);
    const m2 = existsSync(join(S, "ran.marker"));
    clause("W6", HAS && a.code === 1 && b.code === 1 && /REFUSED/.test(a.out) && /REFUSED/.test(b.out) && !m1 && !m2 && !existsSync(receipts(S)), `--exit: exit ${a.code} · --verdict: exit ${b.code} · marker ${m1 || m2 ? "LEFT (a child ran)" : "absent"}`);
  }
  if (want("W7")) {
    const try1 = (name, reviews) => { commit(1); const S = state(name, { reviews }); rr(S, ["red", "--rung", "S7", "--clause", "c1", "--cmd", W]); commit(0); const g = rr(S, ["green", "--rung", "S7", "--clause", "c1", "--day", D]); return { g, rows: rows(S) }; };
    const a = try1("w7a", []);
    const b = try1("w7b", [{ id: "sit-roll", reason: "day-rollover" }]);
    const d = try1("w7d", [{ id: "sit-nohost", reason: "fulltime", host: null }]);
    const c = try1("w7c", [{ id: "sit-real", reason: "fulltime" }]);
    const gc = c.rows.find((r) => r.kind === "green");
    const refused = (x) => x.g.code === 1 && /not a real day/.test(x.g.out) && !x.rows.some((r) => r.kind === "green");
    clause("W7", HAS && refused(a) && refused(b) && refused(d) && c.g.code === 0 && gc && gc.day_proof && gc.day_proof.sitting_id === "sit-real",
      `(a) ${refused(a) ? "refused" : "ACCEPTED"} · (b) rollover ${refused(b) ? "refused" : "ACCEPTED"} · (d) no host ${refused(d) ? "refused" : "ACCEPTED"} · (c) ${gc ? `green, day_proof ${gc.day_proof && gc.day_proof.sitting_id}` : "no green row"}`);
  }
  if (want("W8")) {
    commit(1); const S = state("w8"); rr(S, ["red", "--rung", "S8", "--clause", "c1", "--cmd", W]); commit(0, { append: true });
    const g = rr(S, ["green", "--rung", "S8", "--clause", "c1", "--day", D]); commit(0);
    const m = rows(S).find((r) => r.kind === "meter");
    const o = done(["--campaign", camp("w8", plan1("S8", ["c1"])), "--receipts", receipts(S)]);
    clause("W8", HAS && g.code === 0 && m && m.equal === false && /S8:c1 RED \(meter moved\)/.test(o.out), `meter row equal ${m ? m.equal : "absent"} · ${rungLine(o)}`);
  }
  if (want("W9")) {
    const h = happy("w9", "S9");
    const rs = rows(h.S); const last = rs[rs.length - 1] || {};
    if (rs.length) appendFileSync(receipts(h.S), JSON.stringify({ ...last, prev_sha256: "f".repeat(64) }) + "\n");
    const v = rr(h.S, ["verify"]);
    const o = done(["--campaign", camp("w9", plan1("S9", ["c1"])), "--receipts", receipts(h.S)]);
    const before = bytes(receipts(h.S)); commit(1);
    const r = rr(h.S, ["red", "--rung", "S9", "--clause", "c2", "--cmd", W]);
    clause("W9", HAS && rs.length === 3 && v.code === 1 && /S9:c1 REFUSED \(chain\)/.test(o.out) && r.code === 1 && bytes(receipts(h.S)) === before,
      `verify exit ${v.code} · ${rungLine(o)} · red onto the broken file: exit ${r.code}, file ${bytes(receipts(h.S)) === before ? "unchanged" : "MOVED"}`.slice(0, 300));
  }
  if (want("W10")) {
    commit(1); const S = state("w10"); rr(S, ["red", "--rung", "S10", "--clause", "c1", "--cmd", W]);
    const same = rr(S, ["green", "--rung", "S10", "--clause", "c1", "--day", D]);
    const noGreen = !rows(S).some((r) => r.kind === "green");
    commit(0); const g = rr(S, ["green", "--rung", "S10", "--clause", "c1", "--day", D]);
    const o = done(["--campaign", camp("w10", plan1("S10", ["c1"], "node ci/plant/w.mjs --changed")), "--receipts", receipts(S)]);
    clause("W10", HAS && same.code === 1 && noGreen && g.code === 0 && /S10:c1 RED \(witness changed\)/.test(o.out), `same HEAD: exit ${same.code}${noGreen ? " (no green row)" : " (A GREEN ROW)"} · moved: exit ${g.code} · ${rungLine(o)}`.slice(0, 300));
  }
  if (want("W11")) {
    const h = happy("w11", "S11");
    const C = camp("w11", plan1("S11", ["c1"]));
    const a = done(["--campaign", C, "--receipts", receipts(h.S)]);
    if (existsSync(receipts(h.S))) copyFileSync(receipts(h.S), join(P, "dressing-room", "state", "rung_receipts.jsonl"));
    const b = done(["--campaign", C]);
    rmSync(join(P, "dressing-room", "state", "rung_receipts.jsonl"), { force: true });
    clause("W11", /1\/1 GREEN/.test(a.out) && /0\/1 GREEN · 1 UNREAD/.test(b.out), `--receipts: ${rungLine(a)} | none (a GREEN receipt planted at the state path): ${rungLine(b)}`.slice(0, 300));
  }
  if (want("W12")) {
    const probe = join(TMP, "xq.mjs");
    writeFileSync(probe, `import { pathToFileURL } from "node:url";\nconst m = await import(pathToFileURL(process.argv[2]).href);\nconst ir = m.build();\nconst f = ir.files.find((x) => x.path === "dressing-room/state/rung_receipts.jsonl");\nconst q = m.queries(ir);\nconsole.log(JSON.stringify(f ? { w: f.writers, r: f.readers, q2: q.Q2.some((x) => x.path === f.path) } : null));\n`);
    const o = run(probe, [join(P, "scripts", "xray.mjs")]);
    let f = null; try { f = JSON.parse(lines(o.stdout).slice(-1)[0]); } catch { f = null; }
    clause("W12", !!f && f.w.length === 1 && f.w[0] === "rung_receipt.mjs" && f.r.includes("done.mjs") && !f.q2, f ? `writers ${f.w.join(",") || "none"} · readers ${f.r.join(",")}` : "the receipt file is not in the xray graph");
  }
  if (want("W13")) {
    const h = happy("w13", "S13");
    const text = (() => { try { return readFileSync(receipts(h.S), "utf8"); } catch { return ""; } })();
    const CONTRACT = { red: ["cmd", "cmd_sha256", "head_sha", "exit", "out_sha256"], green: ["cmd", "cmd_sha256", "head_sha", "red_head_sha", "red_sha", "ancestor", "exit", "out_sha256", "day", "day_proof"], meter: ["meter", "before_sha256", "after_sha256", "equal", "old_day", "old_day_green", "green_sha"] };
    const COMMON = ["v", "kind", "key", "rung", "clause", "at", "by", "prev_sha256", "row_sha256"];
    const rs = rows(h.S);
    const keysOk = rs.length === 3 && rs.every((r) => CONTRACT[r.kind] && Object.keys(r).every((k) => COMMON.includes(k) || CONTRACT[r.kind].includes(k)));
    const proofOk = rs.filter((r) => r.kind === "green").every((r) => Object.keys(r.day_proof || {}).sort().join(",") === "closed_at,reason,sitting_id,source");
    const leaks = ["MARKER-HIS-WORD", "MARKER-WITNESS-OUTPUT-WORD", "11111111-2222-3333-4444-555555555555", "witness@invalid"].filter((m) => text.includes(m));
    clause("W13", keysOk && proofOk && !leaks.length, `${rs.length} row(s) · keys ${keysOk ? "the contract's own" : "BEYOND THE CONTRACT"} · day_proof ${proofOk ? "4 fields" : "WIDER"} · leaks ${leaks.length ? leaks.join(",") : "none"}`);
  }
  if (want("G1")) {
    let ok, why;
    if (HAS) {
      const h = happy("g1", "G1", { oldGreen: true });
      const o = done(["--campaign", camp("g1", plan1("G1", ["c1"])), "--receipts", receipts(h.S)]);
      ok = /0\/1 GREEN/.test(o.out) && /G1:c1 RED \(old day reads GREEN\)/.test(o.out); why = `receipt path: ${rungLine(o)}`;
    } else {
      const M = join(TMP, "meter-g1.jsonl"); writeFileSync(M, JSON.stringify({ date: "2026-11-13", green: true }) + "\n");
      const o = done(["--campaign", camp("g1", null, HAND), "--meter", M]);
      ok = /0\/1 clauses/.test(o.out); why = `hand path: ${rungLine(o)}`;
    }
    clause("G1", ok, why);
  }
  if (want("G2")) {
    const o = run(join(P, "scripts", "done.mjs"), ["line", "--hermetic"]);
    const L = lines(o.stdout);
    clause("G2", o.code === 0 && L.length === 1 && /^DONE · /.test(L[0]) && /rungs UNREAD/.test(L[0]), `exit ${o.code} · ${L.length} line(s) · ${(L[0] || "").slice(0, 120)}`);
  }

  // ── BOUND ─────────────────────────────────────────────────────────────────────────────────────────────────────
  if (!BASE_ORG) clause("BOUND", false, "no --base-org given");
  else {
    const OUT = (rel) => rel.startsWith("ci/mrung/") || rel.startsWith("dressing-room/state/");
    const walk = (dir, acc = new Map(), top = dir) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name), rel = slash(relative(top, p));
        if (SKIP_TOP.has(rel.split("/")[0]) || OUT(rel) || /\.log$/.test(rel)) continue;
        const st = statSync(p);
        if (st.isDirectory()) walk(p, acc, top); else acc.set(rel, sha(readFileSync(p, "utf8").replace(/\r\n/g, "\n")));
      }
      return acc;
    };
    const a = walk(ORG), b = walk(BASE_ORG);
    const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort(), extra = diff.filter((f) => !NAMED.includes(f));
    clause("BOUND", extra.length === 0, `${diff.length} file(s) differ from --base-org${diff.length ? ` (${diff.join(", ")})` : ""}${extra.length ? ` · BEYOND THE NAMED: ${extra.slice(0, 6).join(", ")}` : ""}`.slice(0, 400));
  }
  exitCode = 0;
} catch (e) {
  clause("WITNESS", false, `threw: ${String((e && e.stack) || e).split(/\r?\n/).slice(0, 3).join(" | ").slice(0, 300)}`);
}

// ── LAST ────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const survivors = () => {
    const r = process.platform === "win32"
      ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true })
      : spawnSync("ps", ["-eo", "args"], { encoding: "utf8" });
    return lines(r.stdout).filter((l) => l.includes(TMP) && !l.includes("witness_mrung.mjs"));
  };
  const left = survivors();
  rmSync(TMP, { recursive: true, force: true });
  clause("LAST", left.length === 0, `${left.length} node process(es) naming the temp root survive · the longest child ran ${maxMs} ms${BOUND_MS ? ` (the organ's WITNESS_TIMEOUT_MS ${BOUND_MS} ms)` : ""} · no model spawned`);
}
const red = results.filter((r) => !r.ok).map((r) => r.id);
if (red.length || exitCode) { console.log(`RED ${UNIT} · ${red.join(", ") || "WITNESS"}`); process.exit(1); }
console.log(`GREEN ${UNIT} the rung receipt measures red before, a real day's green and the meter, and done.mjs reads it UNREAD before it guesses · ${results.length} clause(s)`);
process.exit(0);
