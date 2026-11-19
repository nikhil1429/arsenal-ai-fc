#!/usr/bin/env node
// ci/mid/plant_mid.mjs — unit mid (forks row 1148 (2)) · the SPEC's measurement, not a build.
// For every reader that folds or looks up by id: plant TWO rows with ONE id through the organ's OWN mint
// (Math.random pinned, one clock) under os.tmpdir(), and record what the reader does with them TODAY.
// It never touches dressing-room/state of any tree: every ledger is pointed at a temp file through the
// organ's own env door or `path`/`deps` argument; it binds no port, spawns no owner (exec is stubbed),
// makes no model call, and prints only planted rows.
// Usage: node ci/mid/plant_mid.mjs [--org <tree root>]   (default: this checkout)
// Prints one line per reader `PLANT <reader> · <verdict> · <json>` and a last line `PLANT_MID · <n> readers · ...`.
import { mkdtempSync, writeFileSync, readFileSync, existsSync, copyFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

const argOf = (f) => { const i = process.argv.indexOf(f); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(argOf("--org") || join(import.meta.dirname, "..", ".."));
const T = mkdtempSync(join(tmpdir(), "mid-plant-"));
// every env door BEFORE any import — no organ resolves a ledger under dressing-room/state
process.env.ARSENAL_OUTBOX_LEDGER = join(T, "outbox.jsonl");
process.env.ARSENAL_TASKS_LEDGER = join(T, "tasks.jsonl");
// the organs read their doors from the registry: a COPY of the tree's tracked registry under the temp dir (read, never printed)
const REG_SRC = join(ORG, "dressing-room", "state", "registry.json");
if (existsSync(REG_SRC)) copyFileSync(REG_SRC, join(T, "registry.json"));
process.env.ARSENAL_REGISTRY = join(T, "registry.json");
process.env.ARSENAL_SITTING_STATE_DIR = join(T, "sitting");
process.env.ARSENAL_SITTING_PORT = "0";          // the port class: an env door, never bound here
delete process.env.ANTHROPIC_API_KEY;
const imp = (f) => import(pathToFileURL(join(ORG, "scripts", f)).href);
const realRandom = Math.random, realNow = Date.now;
const pin = () => { Math.random = () => 0; };     // bucket "00" — the 1-in-1296 draw made certain
const unpin = () => { Math.random = realRandom; Date.now = realNow; };
const out = [];
const rec = (reader, verdict, data) => { out.push({ reader, verdict }); console.log(`PLANT ${reader} · ${verdict} · ${JSON.stringify(data)}`); };
const guard = async (reader, fn) => { try { await fn(); } catch (e) { unpin(); rec(reader, "ERROR", { error: String(e && e.message || e).slice(0, 200) }); } };
const NOW = new Date("2026-11-19T06:00:00.000Z");

// 1 · acts — dispatch twice on one clock, then undo the shared id
await guard("acts.undo", async () => {
  const A = await imp("acts.mjs");
  const rows = [], calls = [];
  const deps = { now: NOW, append: (r) => { rows.push(r); return true; }, exec: (organ, argv) => { calls.push({ organ, argv }); return { ok: true, out: '{"ok":true,"id":"m1"}' }; } };
  pin();
  const a = A.dispatch({ door: "cli", verb: "note", args: { text: "first act", kind: "thread" } }, deps);
  const b = A.dispatch({ door: "cli", verb: "pref", args: { text: "second act", axis: "how_to_speak" } }, deps);
  unpin();
  const before = calls.length;
  const u = A.undo(a.id, { ...deps, rows });
  const acted = calls.slice(before).map((c) => `${c.organ} ${c.argv.join(" ")}`);
  rec("acts.undo", a.id === b.id ? (u.ok ? "ACTS-ON-FIRST" : "REFUSED") : "IDS-DIFFER", { ids: [a.id, b.id], undo_ok: !!u.ok, why: u.why || null, owner_calls: acted });
});

// 2 · claims — mint twice on one clock; then name every reader of a claim id (none known)
await guard("claims.mint", async () => {
  const C = await imp("claims.mjs");
  const ledger = join(T, "claims.jsonl");
  pin();
  const a = C.fileClaim({ claim: "x one", cmd: "true", now: NOW, ledger, runner: () => ({ status: 0, stdout: "" }) });
  const b = C.fileClaim({ claim: "x two", cmd: "true", now: NOW, ledger, runner: () => ({ status: 0, stdout: "" }) });
  unpin();
  const rows = C.readRows(ledger);
  const fr = C.freshReceipt(rows, { now: NOW });
  rec("claims.mint", a.row.id === b.row.id ? "SHARED-ID" : "IDS-DIFFER", { ids: [a.row.id, b.row.id], rows: rows.length, freshReceipt_reads_id: false, fresh_ok: !!(fr && (fr.ok ?? fr)) });
});

// 3 · outbox — two posts of DIFFERENT things on one clock; fold + ack by the id
await guard("outbox.fold", async () => {
  const O = await imp("outbox.mjs");
  const rows = [];
  const deps = { rows, append: (r) => { rows.push(r); return true; }, now: NOW };
  pin();
  const p1 = O.post({ producedBy: "plant:a", kind: "material", subject: "planted subject ONE" }, deps);
  const p2 = O.post({ producedBy: "plant:b", kind: "material", subject: "planted subject TWO" }, deps);
  unpin();
  const f = O.fold(rows);
  const kept = f.get(p1.row.id);
  const ak = O.ack(p2.row.id, deps);
  const pend = (O.fold(rows).get(p2.row.id) || {}).acked_at ? "acked" : "open";
  rec("outbox.fold", p1.row.id === p2.row.id ? (f.size === 1 ? "DROP-SECOND" : "BOTH") : "IDS-DIFFER",
    { ids: [p1.row.id, p2.row.id], post_rows: rows.filter((r) => r.ev === "post").length, fold_size: f.size, kept_subject: kept && kept.subject, ack_of_second_lands_on: ak.ok ? (ak.row && ak.row.subject) : ak.why, state: pend });
});

// 4 · tasks — two creates of DIFFERENT asks on one clock; fold, then re-ask the FIRST
await guard("tasks.fold", async () => {
  const K = await imp("tasks.mjs");
  const rows = [];
  const deps = { rows, append: (r) => { rows.push(r); return true; }, now: NOW };
  pin();
  const c1 = K.create({ kind: "job", subject: "planted_job_one", door: "cli", by: "captain" }, deps);
  const c2 = K.create({ kind: "job", subject: "planted_job_two", door: "cli", by: "captain" }, deps);
  unpin();
  const f = K.foldTasks(rows);
  const again = K.create({ kind: "job", subject: "planted_job_one", door: "cli", by: "captain" }, deps);
  rec("tasks.fold", c1.task.id === c2.task.id ? (f.size === 1 ? "OVERWRITE-FIRST" : "BOTH") : "IDS-DIFFER",
    { ids: [c1.task.id, c2.task.id], create_rows: rows.filter((r) => r.ev === "create").length, fold_size: f.size, kept_subject: (f.get(c1.task.id) || {}).subject, reask_first_replays: !!again.replay });
});

// 5 · registry rulings — two rulings in one ms
await guard("registry.addRuling", async () => {
  const R = await imp("registry.mjs");
  const path = join(T, "registry_rulings_plant.json");   // an EMPTY registry: only the planted rulings
  pin(); Date.now = () => NOW.getTime();
  const r1 = R.addRuling({ text: "planted ruling ONE", scope: "architecture", card: false, path });
  const r2 = R.addRuling({ text: "planted ruling TWO", scope: "architecture", card: false, path });
  unpin();
  const reg = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
  const rul = ((reg.tables || {}).rulings || []).filter((x) => x && String(x.id || "").startsWith("rul-"));
  rec("registry.addRuling", r1.id === r2.id ? (rul.length === 1 ? "MERGE-SECOND-OVER-FIRST" : "BOTH") : "IDS-DIFFER",
    { ids: [r1.id, r2.id], ops: [r1.ok, r2.ok], rulings_rows: rul.length, kept_text: rul.map((x) => x.text) });
});

// 6 · sitting agenda — two asks in one ms; drop ONE by the id
await guard("sitting.agenda", async () => {
  const S = await imp("sitting.mjs");
  const a = S.agendaAdd("planted ask ONE", { now: NOW });
  const b = S.agendaAdd("planted ask TWO", { now: NOW });
  const openBefore = S.openAgenda().length;
  S.agendaMark("drop", [a.id], {}, NOW);
  const openAfter = S.openAgenda().length;
  rec("sitting.agenda", a.id === b.id ? (openAfter === 0 ? "DROP-ONE-CLOSES-BOTH" : "CLOSES-ONE") : "IDS-DIFFER", { ids: [a.id, b.id], open_before: openBefore, open_after_one_drop: openAfter });
});

// 7 · resume_pointer — a consumed pointer, then a NEW pointer sharing its id (near shape: 1 in 2^24 per pair per ms)
await guard("resume_pointer.state", async () => {
  const P = await imp("resume_pointer.mjs");
  const path = join(T, "resume_pointer.jsonl");
  const w = (id, at, q) => ({ v: 1, kind: "written", id, written_at: at, concept: "planted", step: 1, axis: "a", question: q, session_id: null });
  writeFileSync(path, [w("p-same", "2026-11-19T05:00:00.000Z", "old q"), { v: 1, kind: "consumed", id: "c-1", of: "p-same", consumed_at: "2026-11-19T05:10:00.000Z", by: "plant" }, w("p-same", "2026-11-19T06:00:00.000Z", "new q")].map((r) => JSON.stringify(r)).join("\n") + "\n");
  const st = P.pointerState(P.readRows(path), { concept: "planted" });
  rec("resume_pointer.state", st.open ? "SERVES-NEW" : "DROP-NEW (read as consumed)", { newest_q: st.newest && st.newest.question, open: !!st.open });
});

// 8 · notes_compiler — two compiled rows sharing an id; a recompile supersedes ONE (near shape)
await guard("notes_compiler.noteState", async () => {
  const N = await imp("notes_compiler.mjs");
  const c = (id, concept, extra = {}) => ({ v: 1, kind: "compiled", id, ts: "2026-11-19T06:00:00.000Z", concept, axis: "a", ...extra });
  const st = N.noteState([c("n-same", "planted_one"), c("n-same", "planted_two"), c("n-new", "planted_one", { supersedes: "n-same" }), { kind: "cold_gate", of: "n-same", verdict: "pass" }]);
  rec("notes_compiler.noteState", st.live.length === 1 ? "SUPERSEDE-ONE-RETIRES-BOTH" : "RETIRES-ONE", { live: st.live.map((r) => r.concept), gate_of_shared_id_applies_to: 2 });
});

// 9 · notes_corrections — the same shape as 8 on the corrections lane (near shape)
await guard("notes_corrections.active", async () => {
  const K = await imp("notes_corrections.mjs");
  const c = (id, concept, extra = {}) => ({ v: 1, kind: "correction", id, ts: "2026-11-19T06:00:00.000Z", concept, axis: null, claim: "x", correct: "y", ...extra });
  const act = K.active([c("c-same", "planted_one"), c("c-same", "planted_two"), c("c-new", "planted_one", { supersedes: "c-same" })]);
  rec("notes_corrections.active", act.length === 1 ? "SUPERSEDE-ONE-RETIRES-BOTH" : "RETIRES-ONE", { active: act.map((r) => r.concept) });
});

const n = out.length, err = out.filter((o) => o.verdict === "ERROR").length;
console.log(`PLANT_MID · ${n} readers · ${err} error(s) · ${out.map((o) => `${o.reader}=${o.verdict}`).join(" · ")} · tree ${ORG}`);
