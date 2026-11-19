#!/usr/bin/env node
// @ts-check
// ============================================================================
// ci/witness/mcanary/witness_canary.mjs — UNIT mcanary · THE THREE B-CANARY CLAUSES, ONE READER (spec ci/mwit/MWIT_SPEC.md
//   @ 88bf69d §B-canary · UNITS row 8 · rulings forks rows 1162 / 1163; where they differ the ruling wins)
// ----------------------------------------------------------------------------
// TWO MODES.
//   node ci/witness/mcanary/witness_canary.mjs <id>          THE CLAUSE READ (the receipt's witness form, F4 (a)) — reads the
//        tracked ci/witness/mcanary/canaries.jsonl beside this file (its one writer: canary.mjs) and judges ONE canary id:
//        launch-no-laptop | opus-vs-fable | design-fleet. It never writes. Exit law (spec §0): 0 HOLDS · 1 RED · 2 UNREAD.
//   node ci/witness/mcanary/witness_canary.mjs plants [--org <dir>] [--base-org <dir>] [--only <id>[,<id>…]]
//        THE PLANTS — every case below on a COPY under os.tmpdir(): the --org tree's scripts/ and ci/witness/mcanary/ are
//        copied into a temp root with an EMPTY canary file, a git repo made with core.autocrlf=false, a bare origin and a
//        seat repo beside it (every git repo planted is init'ed with core.autocrlf=false; HOME points under the temp root),
//        and the copy's OWN writer and witness are run as children. Nothing under --org is written; no port is bound, no
//        service is named, no network is read, no model is called (the served-model labels are planted words, never ids).
//        --base-org: the same plants on the BASE tree must read RED (the base has no canary organ) — and BOUND needs it.
//        Without --base-org the base half and BOUND are NOT JUDGED and the last line says so (the suite member's form).
// THE CLAUSE (one reader, three predicates — each run row names its pass row's sha, so an edit after the run is seen):
//   exit 2 · no canary file, no pass row for the id, no run row for it, or a fact the predicate needs is null (unread)
//   exit 1 · the chain is broken (a row was edited by a hand) · the run names another pass row · the run started at or
//            before its pass line · the predicate fails
//   launch-no-laptop  ONE seat; its session's environment_kind is the cloud's ("anthropic_cloud", the value get_session
//                     reports for a cloud container — measured on this seat's own record) and its push reached its branch
//   opus-vs-fable     TWO seats on ONE unit; each seat served the model it was configured with (no fallback), the two
//                     served models differ, and both pushes reached their branches
//   design-fleet      EVERY seat the pass row names returned: its push reached and its status bucket reads review-ready
//                     or completed
// CASES (plants mode):
//   launch-no-laptop  ok → 0 · empty file → 2 · pass only → 2 · run before pass → 1 · pass edited after run → 1 ·
//                     a non-cloud environment → 1 · push not reached → 1 · a hand-edited row → 1 ·
//                     the writer REFUSES (exit 2, nothing appended): a run with no pass · a flag outside its set ·
//                     a seat the pass row does not name · an unreadable remote · `verify` 0 on the ok file, 1 on the edited
//   opus-vs-fable     ok → 0 · empty → 2 · mismatched units → 1 · same served model → 1 · a fallback → 1 · one seat → 1 ·
//                     no served model in the record → 2
//   design-fleet      three of three returned → 0 · empty → 2 · one still working → 1 · two of three recorded → 1
//   BOUND             only the named files differ from --base-org (dressing-room/state is the organism's data, not code)
//   LAST              no node process naming a temp root survives
// LAST LINE: GREEN MCANARY <what> · <n> clause(s) (exit 0) or RED MCANARY · <clauses> (exit 1)
// ============================================================================
import { cpSync, mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, statSync } from "node:fs";
import { join, resolve, relative, dirname, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readCanaries, latest, IDS, CANARY_FILE } from "./canary.mjs";
import { WITNESS_TIMEOUT_MS } from "../../../scripts/rung_receipt.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLOUD = "anthropic_cloud";
const RETURNED = /(?:^|_)(?:REVIEW_READY|COMPLETED)$/i;

// ── THE CLAUSE ────────────────────────────────────────────────────────────────────────────────────────────────────
const seatOf = (r, name) => (Array.isArray(r.seats) ? r.seats.find((s) => s && s.seat === name) || null : null);
/** @returns {{ code: 0|1|2, why: string }} */
const PRED = {
  "launch-no-laptop": (p, r) => {
    if (p.seats.length !== 1) return { code: 1, why: `the pass row names ${p.seats.length} seat(s), the clause one` };
    const s = seatOf(r, p.seats[0]);
    if (!s) return { code: 1, why: `the run carries no record of seat ${p.seats[0]}` };
    if (!s.session_id || !s.environment_kind) return { code: 2, why: "the seat's session id or environment kind is unread" };
    if (s.environment_kind !== CLOUD) return { code: 1, why: `the seat ran in ${s.environment_kind}, not the cloud` };
    if (!s.reached_sha) return { code: 1, why: "the seat's push did not reach its branch" };
    return { code: 0, why: `one cloud seat, its push ${s.reached_sha.slice(0, 7)} on ${s.branch}` };
  },
  "opus-vs-fable": (p, r) => {
    if (p.seats.length !== 2) return { code: 1, why: `the pass row names ${p.seats.length} seat(s), the clause two` };
    const [a, b] = p.seats.map((n) => seatOf(r, n));
    if (!a || !b) return { code: 1, why: "the run carries one seat of the two" };
    if ([a, b].some((s) => !s.unit || !s.served_model || !s.configured_model)) return { code: 2, why: "a seat's unit or model is unread" };
    if (a.unit !== b.unit) return { code: 1, why: `the two seats ran two units (${a.unit} · ${b.unit})` };
    if ([a, b].some((s) => s.served_model !== s.configured_model)) return { code: 1, why: "a seat was served another model than it was configured with (a fallback)" };
    if (a.served_model === b.served_model) return { code: 1, why: "both seats were served the same model — no comparison" };
    if (![a, b].every((s) => s.reached_sha)) return { code: 1, why: "a seat's push did not reach its branch" };
    return { code: 0, why: `two seats on ${a.unit}, two served models, both pushes reached` };
  },
  "design-fleet": (p, r) => {
    if (!p.seats.length) return { code: 1, why: "the pass row names no seat" };
    const back = p.seats.map((n) => seatOf(r, n)).filter((s) => s && s.reached_sha && RETURNED.test(String(s.status_bucket || "")));
    if (back.length !== p.seats.length) return { code: 1, why: `${back.length} of ${p.seats.length} seat(s) returned` };
    return { code: 0, why: `${back.length} of ${p.seats.length} seat(s) returned` };
  },
};
/** judge ONE canary id over the file's rows */
export function judge(id, rr) {
  if (!IDS.includes(id)) return { code: 2, why: `no such canary id (${IDS.join(" | ")})` };
  if (!rr.present) return { code: 2, why: "no canary file" };
  if (rr.brokenAt >= 0) return { code: 1, why: `the chain is broken at row ${rr.brokenAt + 1} — a row was edited by a hand` };
  const p = latest(rr, "pass", id);
  if (!p) return { code: 2, why: "no pass row for it" };
  const r = latest(rr, "run", id);
  if (!r) return { code: 2, why: "no run row for it" };
  if (r.pass_sha !== p.row_sha256) return { code: 1, why: "the run names another pass row — the pass line was edited after the run" };
  if (!r.started_at || !Number.isFinite(Date.parse(r.started_at))) return { code: 2, why: "the run's start is unread" };
  if (!(Date.parse(r.started_at) > Date.parse(p.at))) return { code: 1, why: "the run started at or before its pass line" };
  return PRED[id](p, r);
}

// ── THE PLANTS ────────────────────────────────────────────────────────────────────────────────────────────────────
const slash = (p) => p.split(sep).join("/");
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const NAMED = Object.freeze(["ci/witness/mcanary/witness_canary.mjs", "ci/witness/mcanary/canaries.jsonl", "ci/witness/mcanary/canary.mjs",
  "ci/mcanary/PROOF.md", "ci/mcanary/LEDGER.jsonl", "ci/mcanary/BASE", "ci/mcanary/run_mutants_mcanary.mjs"]);
const ROOTS = [];
const tick = (ms) => { while (Date.now() <= ms) { /* the clock's next millisecond: the only wait, bounded by the clock */ } };

function plantRoot(tree) {
  const R = mkdtempSync(join(tmpdir(), "mcanary-")); ROOTS.push(R);
  const org = join(R, "org"), home = join(R, "home"); mkdirSync(home, { recursive: true });
  cpSync(join(tree, "scripts"), join(org, "scripts"), { recursive: true });
  const own = join(tree, "ci", "witness", "mcanary");
  if (existsSync(own)) { cpSync(own, join(org, "ci", "witness", "mcanary"), { recursive: true }); writeFileSync(join(org, "ci", "witness", "mcanary", "canaries.jsonl"), ""); }
  const env = { ...process.env, HOME: home, USERPROFILE: home, GIT_CONFIG_NOSYSTEM: "1", GIT_TERMINAL_PROMPT: "0" };
  const g = (cwd, args) => { const x = spawnSync("git", ["-c", "core.autocrlf=false", "-c", "user.name=plant", "-c", "user.email=plant@invalid", "-c", "commit.gpgsign=false", ...args], { cwd, env, encoding: "utf8", windowsHide: true, timeout: WITNESS_TIMEOUT_MS }); if (x.status !== 0) throw new Error(`plant git ${args.join(" ")}: ${x.stderr}`); return x; };
  const origin = join(R, "origin.git"), seatRepo = join(R, "seat"), rec = join(R, "rec");
  mkdirSync(origin); mkdirSync(seatRepo); mkdirSync(rec);
  g(origin, ["init", "-q", "--bare"]);
  g(org, ["init", "-q"]); g(org, ["config", "core.autocrlf", "false"]); g(org, ["remote", "add", "origin", origin]);
  g(seatRepo, ["init", "-q"]); g(seatRepo, ["config", "core.autocrlf", "false"]); g(seatRepo, ["remote", "add", "origin", origin]);
  let n = 0;
  const node = (file, args) => spawnSync(process.execPath, [join(org, "ci", "witness", "mcanary", file), ...args], { cwd: org, env, encoding: "utf8", windowsHide: true, timeout: WITNESS_TIMEOUT_MS });
  const fileP = join(org, "ci", "witness", "mcanary", "canaries.jsonl");
  return {
    R, org, fileP,
    reset: () => { if (existsSync(dirname(fileP))) writeFileSync(fileP, ""); },
    rows: () => { try { return readFileSync(fileP, "utf8").split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l)); } catch { return []; } },
    writer: (args) => node("canary.mjs", args),
    witness: (id) => node("witness_canary.mjs", [id]),
    /** plant one seat: a branch on the bare origin (its commit carrying the session's trailer unless pushed:false) + its record */
    seat: ({ name, unit = "mcanary", created, envKind = CLOUD, bucket = "SESSION_STATUS_BUCKET_COMPLETED", configured = "plant-model-a", served, pushed = true, branch: noBranch }) => {
      n += 1;
      const sid = `session_PLANT${randomBytes(6).toString("hex")}`, branch = `claude/${unit}-plant${n}`;
      g(seatRepo, ["checkout", "-q", "--orphan", branch]);
      writeFileSync(join(seatRepo, "f.txt"), `${branch}\n`); g(seatRepo, ["add", "-A"]);
      g(seatRepo, ["commit", "-q", "-m", pushed ? `plant ${n}\n\nClaude-Session: https://claude.ai/code/${sid}` : `plant ${n} (no trailer)`]);
      g(seatRepo, ["push", "-q", "origin", branch]);
      const record = { ccr: { id: sid, created_at: created, environment_kind: envKind, status_bucket: bucket, configured_model: configured,
        session_context: { model: configured, outcomes: [{ git_repository: { git_info: { repo: "plant/repo", branches: [noBranch === false ? `claude/${unit}-absent${n}` : branch] } } }] },
        external_metadata: served === null ? {} : { last_served_model: served === undefined ? configured : served } } };
      const f = join(rec, `${n}.json`); writeFileSync(f, JSON.stringify(record));
      return `${name}=${f}`;
    },
  };
}

/** one scenario: pass line, seats' run, then the copy's witness — the exit it reads (or "setup: …" when the plant failed) */
function scenario(P, id, { seats, specs = [], before = false, editAfter = false, tamper = false, noPass = false, noRun = false }) {
  P.reset();
  let created = null;
  if (before) { created = new Date().toISOString(); tick(Date.parse(created)); }
  if (!noPass) { const w = P.writer(["pass", "--id", id, "--line", `plant pass line for ${id}`, ...seats.flatMap((s) => ["--seat", s])]); if (w.status !== 0) return `setup: pass exit ${w.status}`; }
  if (!before) { const p = P.rows().filter((r) => r.kind === "pass").at(-1); tick(p ? Date.parse(p.at) : Date.now()); created = new Date().toISOString(); }
  if (!noRun) {
    const sess = specs.map((s) => P.seat({ created, ...s }));
    const w = P.writer(["run", "--id", id, ...sess.flatMap((s) => ["--session", s])]);
    if (w.status !== 0) return `setup: run exit ${w.status} ${String(w.stdout).trim()}`;
  }
  if (editAfter) P.writer(["pass", "--id", id, "--line", `plant pass line for ${id}, edited`, ...seats.flatMap((s) => ["--seat", s])]);
  if (tamper) {
    const rows = P.rows(); const r = rows.findLast((x) => x.kind === "run");
    if (r) { r.seats[0].environment_kind = `${r.seats[0].environment_kind}-x`; writeFileSync(P.fileP, rows.map((x) => JSON.stringify(x)).join("\n") + "\n"); }
  }
  return P.witness(id).status;
}

const CASES = {
  "launch-no-laptop": [
    ["ok → 0", 0, { seats: ["s1"], specs: [{ name: "s1" }] }],
    ["empty file → 2", 2, { seats: ["s1"], noPass: true, noRun: true }],
    ["pass only → 2", 2, { seats: ["s1"], noRun: true }],
    ["run before pass → 1", 1, { seats: ["s1"], specs: [{ name: "s1" }], before: true }],
    ["pass edited after run → 1", 1, { seats: ["s1"], specs: [{ name: "s1" }], editAfter: true }],
    ["a non-cloud environment → 1", 1, { seats: ["s1"], specs: [{ name: "s1", envKind: "plant_laptop" }] }],
    ["push not reached → 1", 1, { seats: ["s1"], specs: [{ name: "s1", pushed: false }] }],
    ["record's branch absent on origin → 1", 1, { seats: ["s1"], specs: [{ name: "s1", branch: false }] }],
    ["a hand-edited row → 1", 1, { seats: ["s1"], specs: [{ name: "s1" }], tamper: true }],
  ],
  "opus-vs-fable": [
    ["ok → 0", 0, { seats: ["a", "b"], specs: [{ name: "a" }, { name: "b", configured: "plant-model-b" }] }],
    ["empty → 2", 2, { seats: ["a", "b"], noPass: true, noRun: true }],
    ["mismatched units → 1", 1, { seats: ["a", "b"], specs: [{ name: "a" }, { name: "b", unit: "mother", configured: "plant-model-b" }] }],
    ["same served model → 1", 1, { seats: ["a", "b"], specs: [{ name: "a" }, { name: "b" }] }],
    ["a fallback → 1", 1, { seats: ["a", "b"], specs: [{ name: "a" }, { name: "b", configured: "plant-model-b", served: "plant-model-c" }] }],
    ["one seat of two → 1", 1, { seats: ["a", "b"], specs: [{ name: "a" }] }],
    ["no served model → 2", 2, { seats: ["a", "b"], specs: [{ name: "a" }, { name: "b", configured: "plant-model-b", served: null }] }],
  ],
  "design-fleet": [
    ["three of three returned → 0", 0, { seats: ["d1", "d2", "d3"], specs: [{ name: "d1" }, { name: "d2", bucket: "SESSION_STATUS_BUCKET_REVIEW_READY" }, { name: "d3" }] }],
    ["empty → 2", 2, { seats: ["d1", "d2", "d3"], noPass: true, noRun: true }],
    ["one still working → 1", 1, { seats: ["d1", "d2", "d3"], specs: [{ name: "d1" }, { name: "d2" }, { name: "d3", bucket: "SESSION_STATUS_BUCKET_WORKING" }] }],
    ["two of three recorded → 1", 1, { seats: ["d1", "d2", "d3"], specs: [{ name: "d1" }, { name: "d2" }] }],
  ],
};

/** the writer's own refusals (launch-no-laptop's group) — each must exit 2 and append nothing */
function writerChecks(P) {
  const out = [];
  const refused = (what, args) => { const before = P.rows().length; const w = P.writer(args); out.push([what, w.status === 2 && P.rows().length === before, `exit ${w.status}`]); };
  P.reset();
  refused("writer: a run with no pass row is REFUSED", ["run", "--id", "launch-no-laptop", "--session", P.seat({ name: "s1", created: new Date().toISOString() })]);
  refused("writer: a flag outside its set is REFUSED", ["pass", "--id", "launch-no-laptop", "--line", "x", "--seat", "s1", "--verdict", "GREEN"]);
  P.writer(["pass", "--id", "launch-no-laptop", "--line", "plant", "--seat", "s1"]);
  tick(Date.parse(P.rows().at(-1).at));
  refused("writer: a seat the pass row does not name is REFUSED", ["run", "--id", "launch-no-laptop", "--session", P.seat({ name: "zz", created: new Date().toISOString() })]);
  refused("writer: an unreadable remote is REFUSED", ["run", "--id", "launch-no-laptop", "--remote", "plant-nowhere", "--session", P.seat({ name: "s1", created: new Date().toISOString() })]);
  P.writer(["run", "--id", "launch-no-laptop", "--session", P.seat({ name: "s1", created: new Date().toISOString() })]);
  const v0 = P.writer(["verify"]).status;
  const rows = P.rows(); rows[0].line += " (edited)"; writeFileSync(P.fileP, rows.map((x) => JSON.stringify(x)).join("\n") + "\n");
  const v1 = P.writer(["verify"]).status;
  out.push(["writer: verify 0 on its own rows, 1 on a hand-edited row", v0 === 0 && v1 === 1, `verify ${v0} → ${v1}`]);
  return out;
}

function plants() {
  const ORG = resolve(arg("--org") || join(HERE, "..", "..", ".."));
  const BASE_ORG = arg("--base-org") ? resolve(String(arg("--base-org"))) : null;
  const only = arg("--only") ? String(arg("--only")).split(",") : null;
  const ids = IDS.filter((id) => !only || only.includes(id));
  const results = [];
  const clause = (id, ok, detail) => { results.push({ id, ok }); console.log(`${ok ? "  GREEN" : "  RED  "} ${id} · ${detail}`); };
  const P = plantRoot(ORG), B = BASE_ORG ? plantRoot(BASE_ORG) : null;
  for (const id of ids) {
    const lines = [];
    for (const [what, want, opts] of CASES[id]) { const got = scenario(P, id, opts); lines.push([`build ${what}`, got === want, `read ${got}`]); }
    if (id === "launch-no-laptop") lines.push(...writerChecks(P));
    if (B) { const got = scenario(B, id, CASES[id][0][2]); lines.push([`base: the ok plant is not green (no canary organ at the base)`, got !== 0, `read ${got}`]); }
    for (const [what, ok, d] of lines) console.log(`    ${ok ? "ok  " : "FAIL"} ${what} — ${d}`);
    const bad = lines.filter((l) => !l[1]);
    clause(id, bad.length === 0, `${lines.length - bad.length} of ${lines.length} case(s)${B ? "" : " (base half NOT JUDGED: no --base-org)"}`);
  }
  // the live read: the tracked file at this tree — PRINTED, never judged (on the cloud it reads UNREAD until a real run lands)
  for (const id of IDS) { const w = spawnSync(process.execPath, [join(ORG, "ci", "witness", "mcanary", "witness_canary.mjs"), id], { cwd: ORG, encoding: "utf8", windowsHide: true, timeout: WITNESS_TIMEOUT_MS }); console.log(`  live  ${id} · exit ${w.status} · ${String(w.stdout).trim().split(/\r?\n/).at(-1) || ""}`); }
  // BOUND
  if (B && BASE_ORG) {
    const SKIP = new Set([".git", "node_modules"]);
    const walk = (dir, acc = new Map(), top = dir) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name), rel = slash(relative(top, p));
        if (SKIP.has(rel.split("/")[0]) || rel.startsWith("dressing-room/state/") || /\.log$/.test(rel)) continue;
        const st = statSync(p);
        if (st.isDirectory()) walk(p, acc, top); else acc.set(rel, createHash("sha256").update(readFileSync(p, "utf8").replace(/\r\n/g, "\n")).digest("hex"));
      }
      return acc;
    };
    const a = walk(ORG), b = walk(BASE_ORG);
    const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort(), extra = diff.filter((f) => !NAMED.includes(f));
    clause("BOUND", extra.length === 0, `${diff.length} file(s) differ from --base-org${extra.length ? ` · BEYOND THE NAMED: ${extra.slice(0, 6).join(", ")}` : ""}`);
  }
  for (const R of ROOTS) rmSync(R, { recursive: true, force: true });
  // LAST
  const ps = process.platform === "win32"
    ? spawnSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true, timeout: WITNESS_TIMEOUT_MS })
    : spawnSync("ps", ["-eo", "args"], { encoding: "utf8", timeout: WITNESS_TIMEOUT_MS });
  const procs = String(ps.stdout || "").split(/\r?\n/);
  const left = procs.filter((l) => ROOTS.some((R) => l.includes(R)));
  clause("LAST", ps.status === 0 && left.length === 0, ps.status === 0 ? `${left.length} node process(es) naming a temp root survive` : "the process table is unreadable");
  const red = results.filter((r) => !r.ok).map((r) => r.id);
  const n = results.filter((r) => IDS.includes(r.id)).length;
  if (red.length) { console.log(`RED MCANARY · ${red.join(", ")}`); process.exit(1); }
  console.log(`GREEN MCANARY ${B ? "plants both ways, BOUND held" : "build plants (no --base-org: base half and BOUND NOT JUDGED)"} · ${n} clause(s)`);
  process.exit(0);
}

function clauseRead(id) {
  const v = judge(id, readCanaries(CANARY_FILE));
  console.log(`CANARY ${id} ${["GREEN", "RED", "UNREAD"][v.code]} · ${v.why}`);
  process.exit(v.code);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv[2];
  if (a === "plants") plants();
  else if (a && IDS.includes(a)) clauseRead(a);
  else { console.log(`usage: witness_canary.mjs <${IDS.join("|")}> | plants [--org <dir>] [--base-org <dir>] [--only <ids>]`); process.exit(2); }
}
