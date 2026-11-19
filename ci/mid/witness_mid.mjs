#!/usr/bin/env node
// ci/mid/witness_mid.mjs — unit mid (forks row 1159 (1)-(3)) · THE WITNESS. The header is the contract.
//
// USAGE   node ci/mid/witness_mid.mjs --org <build tree> --base-org <base tree>
//         (both are checkouts; the base is the main sha in ci/mid/BASE). Exit 0 iff every clause is GREEN.
// LAST LINE  `GREEN MID one shared mint + two-row refusals · <n> clause(s)` (exit 0)  or  `RED MID · <clauses>` (exit 1).
//
// EVERY CLAUSE IS PLANTED BOTH WAYS: it runs against --base-org and must read RED there, and against --org and must read
// GREEN there. A clause is GREEN only when both hold (a clause that is green on the base proves nothing).
//   W1 ONE PROCESS     each of the six mints (acts · claims · outbox · tasks · registry rulings · sitting agenda) 32× on ONE
//                      planted clock with Math.random pinned → 32 distinct ids per mint.
//   W2 TWO PROCESSES   two node children on one planted clock, the draw pinned, each mints once from all six → every pair differs.
//   W3 READ BACK       the tree's scripts/mint.mjs: parseId of mintId("t", clock, {pid: 7}) gives the planted ms, pid 7, bucket 0,
//                      and the sequence rises by one; every by-shape reader (MID_SPEC Q4) still matches an organ-minted id.
//   W4 OUTBOX PAIR     two legacy post rows with one id → ack, undeliver and the relay's deliver refuse it by name, no row appended;
//                      the fold names the pair.
//   W5 TASKS PAIR      two legacy create rows with one id → claim and finish refuse it by name, no row appended; the fold names it.
//   W6 REGISTRY        a registry holding rul-X; addRuling with the mint injected: X then Y → two rows, both texts; X always →
//                      refused by name, one row, the first text intact (a ruling row is never upserted over).
//   W7 AGENDA PAIR     two legacy agenda rows with one id → agendaMark drop and the CLI `agenda drop` refuse it; both stay open.
//   W8 BOUND           the files that differ between the trees are exactly scripts/mint.mjs, the six organs and package.json
//                      (plus ci/mid/). Read by `git diff --name-only` when the base sha is in the build's repository, else by
//                      content over the tracked files of each tree (CRLF-normalised). dressing-room/state/ is excluded from the
//                      compare (his live state is not code, and this build writes none of it).
//   LAST               no node process whose command line names this witness's temp dir survives.
//
// HERMETIC. Every ledger is a temp file under os.tmpdir() through the organ's own env door (ARSENAL_ACTS_LEDGER ·
// ARSENAL_CLAIMS_LEDGER · ARSENAL_OUTBOX_LEDGER · ARSENAL_TASKS_LEDGER · ARSENAL_SITTING_STATE_DIR · ARSENAL_REGISTRY = a COPY
// of the tree's tracked registry, read and never printed) or its deps/path argument; owner execs are stubbed (no spawn of an
// owner), no model call (ANTHROPIC_API_KEY is removed from every child). It never writes under any tree.
// THE PORT CLASS (row 1053): binds no port, names no live service, POSTs nothing, restarts nothing. sitting.mjs is imported
// (its main guard stays shut) and run as a CLI only for `agenda drop`, with ARSENAL_SITTING_PORT planted as an env door and
// its state dir under the temp dir. Every child wait is bounded by the organism's witness child bound, read from its owner
// (rung_receipt.mjs WITNESS_TIMEOUT_MS of the base tree) — not typed here.
// WINDOWS. No POSIX shell: every child is process.execPath; git is spawned directly; files are compared CRLF-normalised.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, copyFileSync, readdirSync, statSync, rmSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { tmpdir, platform } from "node:os";
import { spawnSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const argOf = (f) => { const i = process.argv.indexOf(f); return i > 0 ? process.argv[i + 1] : null; };
const NOW_ISO = "2026-11-19T06:00:00.000Z";
const N = 32;
const NAMED = ["scripts/mint.mjs", "scripts/acts.mjs", "scripts/claims.mjs", "scripts/outbox.mjs", "scripts/tasks.mjs", "scripts/registry.mjs", "scripts/sitting.mjs", "package.json"];

// ═══ PROBE MODE — one clause on one tree, in its own process; prints ONE JSON line {green, detail} ═══
if (argOf("--probe")) {
  const TREE = resolve(argOf("--tree")), T = resolve(argOf("--tmp"));
  const imp = (f) => import(pathToFileURL(join(TREE, "scripts", f)).href);
  const NOW = new Date(NOW_ISO);
  const realRandom = Math.random, realNow = Date.now;
  const pin = () => { Math.random = () => 0; Date.now = () => NOW.getTime(); };
  const unpin = () => { Math.random = realRandom; Date.now = realNow; };
  const say = (green, detail) => { console.log(JSON.stringify({ green: !!green, detail })); };
  const stub = { exec: () => ({ ok: true, out: '{"ok":true,"id":"m1"}' }), append: () => true };
  // one id from each of the six mints (the organ's OWN mint, through its own API), `i` varies the words so no dedupe fires
  const mintSix = async (i, regPath) => {
    const A = await imp("acts.mjs"), C = await imp("claims.mjs"), O = await imp("outbox.mjs"), K = await imp("tasks.mjs"), R = await imp("registry.mjs"), S = await imp("sitting.mjs");
    const orows = [], trows = [];
    pin();
    try {
      return {
        acts: A.dispatch({ door: "cli", verb: "note", args: { text: `act ${i}`, kind: "thread" } }, { now: NOW, ...stub }).id,
        claims: C.fileClaim({ claim: `x ${i}`, cmd: "true", now: NOW, ledger: join(T, "claims.jsonl"), runner: () => ({ status: 0, stdout: "" }) }).row.id,
        outbox: O.post({ producedBy: "plant:w", kind: "material", subject: `planted subject ${i}` }, { rows: orows, append: (r) => { orows.push(r); return true; }, now: NOW }).row.id,
        tasks: K.create({ kind: "job", subject: `planted_job_${i}`, door: "cli", by: "captain" }, { rows: trows, append: (r) => { trows.push(r); return true; }, now: NOW }).task.id,
        registry: R.addRuling({ text: `planted ruling ${i}`, scope: "architecture", card: false, path: regPath, at: NOW_ISO }).id,
        sitting: S.agendaAdd(`planted ask ${i}`, { now: NOW }).id,
      };
    } finally { unpin(); }
  };
  const probe = argOf("--probe");
  try {
    if (probe === "W1") {
      const per = {};
      const regPath = join(T, "registry_w1.json");
      for (let i = 0; i < N; i++) { const ids = await mintSix(i, regPath); for (const [k, v] of Object.entries(ids)) (per[k] = per[k] || new Set()).add(v); }
      const counts = Object.fromEntries(Object.entries(per).map(([k, s]) => [k, s.size]));
      say(Object.values(counts).length === 6 && Object.values(counts).every((n) => n === N), counts);
    } else if (probe === "mint-once") {
      say(true, await mintSix(0, join(T, "registry_once.json")));
    } else if (probe === "W3") {
      const mp = join(TREE, "scripts", "mint.mjs");
      if (!existsSync(mp)) { say(false, "no scripts/mint.mjs in this tree"); }
      else {
        const M = await import(pathToFileURL(mp).href);
        const id1 = M.mintId("t", NOW, { pid: 7, random: () => 0 }), id2 = M.mintId("t", NOW, { pid: 7, random: () => 0 });
        const p1 = M.parseId("t", id1), p2 = M.parseId("t", id2);
        const back = !!p1 && !!p2 && p1.ms === NOW.getTime() && p1.pid === 7 && p1.bucket === 0 && p2.seq === p1.seq + 1;
        const ids = await mintSix("w3", join(T, "registry_w3.json"));
        const O = await imp("outbox.mjs");
        const ref = O.parseCloseRef(`agenda:${ids.sitting}`), tref = O.parseCloseRef(`task:${ids.tasks}`);
        const shapes = {
          closeRef_agenda: !!ref && ref.id === ids.sitting,
          closeRef_task: !!tref && tref.id === ids.tasks,
          organism_test_agenda_line: /^\s*(ag\S+)\s.*BLOCK 4 close ka test/m.test(`  ${ids.sitting} 2026-11-19T06:00 (served) BLOCK 4 close ka test`),
          task_prefix: /^t/.test(ids.tasks),
          act_charset: /^a[0-9a-z]+$/.test(ids.acts),
          parsed_by_prefix: ["a", "k", "o", "t", "rul-", "ag"].every((p, j) => !!M.parseId(p, [ids.acts, ids.claims, ids.outbox, ids.tasks, ids.registry, ids.sitting][j])),
        };
        say(back && Object.values(shapes).every(Boolean), { p1, p2, shapes });
      }
    } else if (probe === "W4") {
      const O = await imp("outbox.mjs");
      const id = "oLEGACYPAIR";
      const post = (subject) => ({ ev: "post", id, ts: NOW_ISO, produced_by: "plant:legacy", kind: "material", subject, idempotency_key: subject, priority: 50 });
      const mk = (extra = []) => { const rows = [post("planted subject ONE"), post("planted subject TWO"), ...extra]; let appended = 0; return { rows, deps: { rows, now: NOW, append: (r) => { rows.push(r); appended++; return true; }, exec: () => ({ ok: true, out: "" }) }, n: () => appended }; };
      const a = mk(); const ak = O.ack(id, a.deps);
      const u = mk([{ ev: "deliver", of: id, ts: NOW_ISO, via: "code" }]); const un = O.undeliver(id, "planted", u.deps);
      const r = mk(); const rl = O.relay(O.SURFACES[0], r.deps);
      const deliverRows = r.rows.filter((x) => x.ev === "deliver" && x.of === id).length;
      const named = (O.fold(a.rows).get(id) || {}).ambiguous === 2;
      const detail = { ack: ak.ok ? "LANDED" : ak.why, ack_rows: a.n(), undeliver: un.ok ? "LANDED" : un.why, undeliver_rows: u.n(), relay_deliver_rows: deliverRows, relay_refused: rl.refused_ambiguous || null, fold_names_pair: named };
      say(!ak.ok && /ambiguous/.test(ak.why || "") && a.n() === 0 && !un.ok && /ambiguous/.test(un.why || "") && u.n() === 0 && deliverRows === 0 && (rl.refused_ambiguous || []).length === 1 && named, detail);
    } else if (probe === "W5") {
      const K = await imp("tasks.mjs");
      const id = "tLEGACYPAIR";
      const create = (subject) => ({ ev: "create", id, ts: NOW_ISO, key: subject, kind: "job", subject, args: {}, door: "cli", by: "captain", ttl_h: 24 });
      const mk = () => { const rows = [create("planted_job_one"), create("planted_job_two")]; let appended = 0; return { rows, deps: { rows, now: NOW, append: (r) => { rows.push(r); appended++; return true; } }, n: () => appended }; };
      const c = mk(); const cl = K.claim(id, c.deps, "witness");
      const f = mk(); const fi = K.finish(id, "planted", f.deps);
      const named = (K.foldTasks(c.rows).get(id) || {}).ambiguous === 2;
      say(!cl.ok && /ambiguous/.test(cl.why || "") && c.n() === 0 && !fi.ok && /ambiguous/.test(fi.why || "") && f.n() === 0 && named,
        { claim: cl.ok ? "LANDED" : cl.why, claim_rows: c.n(), finish: fi.ok ? "LANDED" : fi.why, finish_rows: f.n(), fold_names_pair: named });
    } else if (probe === "W6") {
      const R = await imp("registry.mjs");
      const X = `rul-${NOW.getTime().toString(36)}00`;   // what the base's inline mint gives on this clock with the draw pinned
      const plantReg = (p) => writeFileSync(p, JSON.stringify({ version: 1, updated_at: NOW_ISO, tables: { rulings: [{ id: X, at: NOW_ISO, scope: "architecture", by: "captain", source: "plant", text: "planted ruling ONE", added_at: NOW_ISO, updated_at: NOW_ISO }] } }));
      const texts = (p) => (((JSON.parse(readFileSync(p, "utf8")).tables || {}).rulings) || []).map((r) => r.text);
      const p1 = join(T, "reg_remint.json"); plantReg(p1);
      const seqMint = [X, "rul-WITNESSY"]; let k = 0;
      pin(); const r1 = R.addRuling({ text: "planted ruling TWO", scope: "architecture", card: false, path: p1, at: NOW_ISO, mint: () => seqMint[Math.min(k++, 1)] }); unpin();
      const t1 = texts(p1);
      const p2 = join(T, "reg_always.json"); plantReg(p2);
      pin(); const r2 = R.addRuling({ text: "planted ruling THREE", scope: "architecture", card: false, path: p2, at: NOW_ISO, mint: () => X }); unpin();
      const t2 = texts(p2);
      const remint = r1.ok && t1.length === 2 && t1.includes("planted ruling ONE") && t1.includes("planted ruling TWO");
      const refused = !r2.ok && /ruling/.test(r2.why || "") && t2.length === 1 && t2[0] === "planted ruling ONE";
      say(remint && refused, { remint: { ok: !!r1.ok, id: r1.id || null, texts: t1 }, always_x: { ok: !!r2.ok, why: r2.why || null, texts: t2 } });
    } else if (probe === "W7") {
      const S = await imp("sitting.mjs");
      const id = "agLEGACYPAIR";
      const dir = process.env.ARSENAL_SITTING_STATE_DIR; mkdirSync(dir, { recursive: true });
      const file = join(dir, "sitting_agenda.jsonl");
      const plant = () => writeFileSync(file, [{ kind: "agenda", id, ts: NOW_ISO, text: "planted ask ONE", by: "captain" }, { kind: "agenda", id, ts: NOW_ISO, text: "planted ask TWO", by: "captain" }].map((r) => JSON.stringify(r)).join("\n") + "\n");
      plant();
      const before = S.openAgenda().length;
      const named = before === 2 && S.openAgenda().every((r) => r.ambiguous === 2);
      S.agendaMark("drop", [id]);
      const afterMark = S.openAgenda().length;
      plant();
      const cli = spawnSync(process.execPath, [join(TREE, "scripts", "sitting.mjs"), "agenda", "drop", id], { encoding: "utf8", env: process.env, cwd: T, timeout: Number(argOf("--bound")), windowsHide: true });
      const afterCli = S.openAgenda().length;
      say(before === 2 && afterMark === 2 && named && cli.status !== 0 && /ambiguous/.test(String(cli.stdout)) && afterCli === 2,
        { open_before: before, open_after_mark_drop: afterMark, open_names_pair: named, cli_exit: cli.status, cli_said: String(cli.stdout || cli.stderr || "").trim().split("\n").at(-1), open_after_cli_drop: afterCli });
    } else say(false, `unknown probe ${probe}`);
  } catch (e) { unpin(); say(false, `ERROR ${String((e && e.message) || e).slice(0, 240)}`); }
  process.exit(0);
}

// ═══ DRIVER ═══
const ORG = argOf("--org") ? resolve(argOf("--org")) : null, BASE = argOf("--base-org") ? resolve(argOf("--base-org")) : null;
if (!ORG || !BASE || !existsSync(join(ORG, "scripts")) || !existsSync(join(BASE, "scripts"))) {
  console.log("usage: node ci/mid/witness_mid.mjs --org <build tree> --base-org <base tree>");
  console.log("RED MID · USAGE");
  process.exit(1);
}
const BOUND = (await import(pathToFileURL(join(BASE, "scripts", "rung_receipt.mjs")).href)).WITNESS_TIMEOUT_MS;
const ROOT_T = mkdtempSync(join(tmpdir(), "mid-wit-"));
let seq = 0;
const childEnv = (dir, tree) => {
  mkdirSync(dir, { recursive: true });
  const reg = join(tree, "dressing-room", "state", "registry.json");
  if (existsSync(reg)) copyFileSync(reg, join(dir, "registry.json"));
  const env = { ...process.env, ARSENAL_REGISTRY: join(dir, "registry.json"), ARSENAL_ACTS_LEDGER: join(dir, "acts.jsonl"), ARSENAL_CLAIMS_LEDGER: join(dir, "claims.jsonl"),
    ARSENAL_OUTBOX_LEDGER: join(dir, "outbox.jsonl"), ARSENAL_TASKS_LEDGER: join(dir, "tasks.jsonl"), ARSENAL_SITTING_STATE_DIR: join(dir, "sitting"), ARSENAL_SITTING_PORT: "0" };
  delete env.ANTHROPIC_API_KEY;
  return env;
};
const runProbe = (probe, tree) => {
  const dir = join(ROOT_T, `${probe}-${++seq}`);
  const r = spawnSync(process.execPath, [SELF, "--probe", probe, "--tree", tree, "--tmp", dir, "--bound", String(BOUND)], { encoding: "utf8", env: childEnv(dir, tree), cwd: dir, timeout: BOUND, windowsHide: true });
  const line = String(r.stdout || "").trim().split(/\r?\n/).filter((l) => l.startsWith("{")).at(-1);
  try { return JSON.parse(line); } catch { return { green: false, detail: `no verdict (exit ${r.status}${r.signal ? " " + r.signal : ""}) ${String(r.stderr || "").trim().split(/\r?\n/).at(-1) || ""}` }; }
};
const results = [];
const clause = (name, baseV, orgV) => {
  const ok = baseV.green === false && orgV.green === true;
  results.push({ name, ok });
  console.log(`${ok ? "GREEN" : "RED  "} ${name} · base ${baseV.green ? "GREEN" : "RED"} · build ${orgV.green ? "GREEN" : "RED"}`);
  console.log(`      base  ${JSON.stringify(baseV.detail)}`);
  console.log(`      build ${JSON.stringify(orgV.detail)}`);
};
const both = (p) => clause(p, runProbe(p, BASE), runProbe(p, ORG));

both("W1");
// W2 — two children on one clock: every one of the six mints must differ between them
const twoProc = (tree) => {
  const a = runProbe("mint-once", tree), b = runProbe("mint-once", tree);
  if (!a.green || !b.green) return { green: false, detail: { child1: a.detail, child2: b.detail } };
  const same = Object.keys(a.detail).filter((k) => a.detail[k] === b.detail[k]);
  return { green: Object.keys(a.detail).length === 6 && same.length === 0, detail: { same: same.length ? same : "none", child1: a.detail, child2: b.detail } };
};
clause("W2", twoProc(BASE), twoProc(ORG));
for (const p of ["W3", "W4", "W5", "W6", "W7"]) both(p);

// W8 — BOUND
const git = (cwd, args) => spawnSync("git", args, { cwd, encoding: "utf8", timeout: BOUND, windowsHide: true });
const headOf = (d) => { const r = git(d, ["rev-parse", "HEAD"]); return r.status === 0 ? r.stdout.trim() : null; };
const tracked = (d) => {
  const r = git(d, ["ls-files", "-z"]);
  if (r.status === 0 && r.stdout) return r.stdout.split("\0").filter(Boolean);
  const out = [];
  const walk = (p) => { for (const e of readdirSync(p)) { if (e === "node_modules" || e === ".git") continue; const f = join(p, e); const st = statSync(f); if (st.isDirectory()) walk(f); else out.push(relative(d, f).split(sep).join("/")); } };
  walk(d); return out;
};
const norm = (p) => { try { return readFileSync(p).toString("latin1").replace(/\r\n/g, "\n"); } catch { return null; } };
const differing = (a, b) => {
  const ha = headOf(a), hb = headOf(b);
  if (ha && hb && git(a, ["cat-file", "-e", `${hb}^{commit}`]).status === 0) {
    const r = git(a, ["diff", "--name-only", hb, ha]);
    if (r.status === 0) return { how: `git diff --name-only ${hb.slice(0, 7)} ${ha.slice(0, 7)}`, files: r.stdout.split(/\r?\n/).filter(Boolean) };
  }
  const files = [...new Set([...tracked(a), ...tracked(b)])].filter((f) => !f.startsWith("dressing-room/state/"));
  return { how: "content over tracked files (CRLF-normalised)", files: files.filter((f) => norm(join(a, f)) !== norm(join(b, f))).sort() };
};
const bound = (a, b) => {
  const d = differing(a, b);
  const code = d.files.filter((f) => !f.startsWith("ci/mid/") && !f.startsWith("dressing-room/state/"));
  const outside = code.filter((f) => !NAMED.includes(f)), missing = NAMED.filter((f) => !code.includes(f));
  return { green: outside.length === 0 && missing.length === 0, detail: { how: d.how, outside: outside.length ? outside : "none", unchanged_named: missing.length ? missing : "none" } };
};
clause("W8", bound(BASE, BASE), bound(ORG, BASE));

// LAST — no node process naming the temp dir survives
const procLines = () => {
  if (platform() === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { $_.ProcessId.ToString() + ' ' + $_.CommandLine }"], { encoding: "utf8", timeout: BOUND, windowsHide: true });
    return String(r.stdout || "").split(/\r?\n/);
  }
  if (existsSync("/proc")) {
    const out = [];
    for (const p of readdirSync("/proc")) { if (!/^\d+$/.test(p)) continue; try { out.push(`${p} ${readFileSync(`/proc/${p}/cmdline`, "utf8").split("\0").join(" ")}`); } catch { /* the process ended between readdir and read */ } }
    return out;
  }
  const r = spawnSync("ps", ["-axo", "pid=,command="], { encoding: "utf8", timeout: BOUND });
  return String(r.stdout || "").split("\n");
};
const survivors = procLines().filter((l) => l.includes(ROOT_T) && !l.trim().startsWith(`${process.pid} `));
results.push({ name: "LAST", ok: survivors.length === 0 });
console.log(`${survivors.length === 0 ? "GREEN" : "RED  "} LAST · ${survivors.length} node process(es) name the temp dir`);
try { rmSync(ROOT_T, { recursive: true, force: true }); } catch { /* a temp dir left is named by the OS's own sweep, never by this witness */ }

const red = results.filter((r) => !r.ok).map((r) => r.name);
if (red.length) { console.log(`RED MID · ${red.join(", ")}`); process.exit(1); }
console.log(`GREEN MID one shared mint + two-row refusals · ${results.length} clause(s)`);
process.exit(0);
