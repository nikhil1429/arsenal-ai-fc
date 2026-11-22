#!/usr/bin/env node
// ============================================================================
// ci/maud43/witness_maud43.mjs — UNIT maud43 · THE ONE-TIME REBUILD OF THE SESSION-MISMATCH TURNS
//   (forks rows 1250 (4) / 1282 / 1283 (2) / 1286; the ruled spec ci/maud43/MAUD43_SPEC.md §6)
// ----------------------------------------------------------------------------
//   node ci/maud43/witness_maud43.mjs --org <dir> [--base-org <dir>] [--only "<id>,…"]
// CONTRACT. Every clause plants its OWN tree under os.tmpdir() (a state dir and a HOME holding .claude/projects/<slug>/
// transcripts, written by node) and spawns `<tree>/scripts/teaching_audit.mjs rebuild-mismatch` with
// ARSENAL_AUDIT_STATE_DIR / HOME / USERPROFILE pointed into that plant and ARSENAL_AUDIT_NO_SPAWN=1 (so no path can reach a
// live teaching_contract.json). A clause is GREEN only when it holds on --org AND fails on --base-org (a clause that also
// passes on the base proves nothing). Without --base-org the base leg is not run and the line says so.
//   W1 REBUILD · W2 KEPT · W3 LOST · W4 ONCE · W5 DRY · W6 TIME ORDERS ONE FILE · W7 NO PROMPT BEFORE TS · W8 CROSS-CHECK ·
//   W9 OWN RECORD · W10 READERS BLIND · W11 NO AUTOHIT · W12 ANOTHER SESSION NEARER IN TIME · W13 SHARED TURN ·
//   W14 STOP-TIME new_idea — each plant is named at its clause below (the spec's §6 table is the same list)
//   BOUND  (seat-time, needs --bound-base <sha> and a git work tree at --org) only scripts/teaching_audit.mjs and ci/maud43/
//          differ from that base, by git's own diff of the committed tree
// THE PORT CLASS (row 1053): no port is bound, no service is named, nothing is POSTed, nothing restarts, no model is called.
// Every wait is a child's exit. The verb is NEVER spawned without the planted state dir (asserted in `run`).
// LAST LINE: GREEN MAUD43 … · <n> clause(s) (exit 0) or RED MAUD43 · <ids> (exit 1)
// ============================================================================
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
const BOUND_BASE = arg("--bound-base"), ONLY = arg("--only") ? arg("--only").split(",").map((s) => s.trim()) : null;
if (!ORG) { console.log("witness_maud43: usage --org <dir> [--base-org <dir>] [--bound-base <sha>] [--only <ids>]"); process.exit(1); }
const UNIT = "MAUD43";
const TMP = mkdtempSync(join(tmpdir(), "maud43-"));
const MM = "session-mismatch (parallel session's prompt discarded)";
const CANARY = "ZQX-MAUD43-CANARY", CONCEPT = "tokenization";
const WIN = ["--from", "2026-11-17T00:00:00+05:30", "--to", "2026-11-22T00:00:00+05:30"];
const sidOf = (c) => `${c.repeat(8)}-${c.repeat(4)}-${c.repeat(4)}-${c.repeat(4)}-${c.repeat(12)}`;
const at = (base, sec) => new Date(Date.parse(base) + sec * 1000).toISOString();
const T0 = "2026-11-18T05:00:00.000Z";
const sha = (s) => createHash("sha256").update(String(s), "utf8").digest("hex");
const slugOf = (root) => String(root).replace(/[:\\/]/g, "-");   // study_scope.mjs:99 projectSlug, the same rule

// ── plants ─────────────────────────────────────────────────────────────────
const u = (text, ts) => JSON.stringify({ type: "user", timestamp: ts, message: { role: "user", content: text } });
const a = (text, ts) => JSON.stringify({ type: "assistant", timestamp: ts, message: { role: "assistant", content: [{ type: "text", text }] } });
const tn = (ts) => u("<task-notification><task-id>x</task-id></task-notification>", ts);
const row = ({ sid, ts, src = MM, step = 4, seen = 0, idea = false }) => JSON.stringify({
  ts, session_id: sid, turn_id: null, scope: "study", sitting_id: null, concept: CONCEPT, step, drifts: [], evidence: [], excerpts: [],
  measured: { step }, user_text_source: src, staged: [], new_idea: idea, picture_present: false, picture_first: false, moment: "",
  picture_why: null, picture_recorded: null, samajh_check: { seen, restarted: seen, marker: seen ? "samajh nahi aaya" : null, source: "transcript_path" },
});
function plant(tree, name, { rows = [], files = {}, last = null, elsewhere = {} } = {}) {
  const dir = mkdtempSync(join(TMP, `${name}-`)), st = join(dir, "state"), home = join(dir, "home");
  const pd = join(home, ".claude", "projects", slugOf(tree));
  mkdirSync(st, { recursive: true }); mkdirSync(pd, { recursive: true });
  writeFileSync(join(st, "teaching_audit.jsonl"), rows.length ? rows.join("\n") + "\n" : "");
  if (last) writeFileSync(join(st, "teaching_audit_last.json"), JSON.stringify(last, null, 1));
  for (const [sid, lines] of Object.entries(files)) writeFileSync(join(pd, `${sid}.jsonl`), lines.join("\n") + "\n");
  const paths = {};
  for (const [sid, lines] of Object.entries(elsewhere)) { const p = join(dir, "elsewhere", `${sid}.jsonl`); mkdirSync(join(dir, "elsewhere"), { recursive: true }); writeFileSync(p, lines.join("\n") + "\n"); paths[sid] = p; }
  return { dir, st, home, pd, paths, log: join(st, "teaching_audit.jsonl") };
}
function run(tree, p, extra = []) {
  if (!p || !p.st || !p.st.startsWith(TMP)) throw new Error("refused: the verb is spawned only against a planted state dir");
  const env = { ...process.env, ARSENAL_AUDIT_STATE_DIR: p.st, HOME: p.home, USERPROFILE: p.home, ARSENAL_AUDIT_NO_SPAWN: "1" };
  delete env.ANTHROPIC_API_KEY; delete env.ARSENAL_ORGAN;
  const r = spawnSync(process.execPath, [join(tree, "scripts", "teaching_audit.mjs"), "rebuild-mismatch", ...WIN, ...extra], { encoding: "utf8", env, windowsHide: true });
  return { status: r.status, out: String(r.stdout || ""), err: String(r.stderr || ""), line: String(r.stdout || "").trim().split(/\r?\n/).pop() || "" };
}
const logRows = (p) => readFileSync(p.log, "utf8").split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
const rebuilt = (p) => logRows(p).filter((r) => r.rebuilt_from === "transcript");
const num = (line, re) => { const m = re.exec(line); return m ? Number(m[1]) : NaN; };

// session A — the W1 shape: a fresh turn at step 3, then his confused turn at step 4 written session-mismatch
const A = sidOf("a");
const filesA = { [A]: [u("ek sawaal hai", at(T0, 0)), a("Chalo dekhte hain.", at(T0, 20)), u(`samajh nahi aaya ${CANARY}`, at(T0, 600)), a("Aage badhte hain.", at(T0, 620))] };
const rowsA = [row({ sid: A, ts: at(T0, 30), src: "fresh", step: 3 }), row({ sid: A, ts: at(T0, 630), step: 4, seen: 1 })];
const lastA = { prompt: { text: "theek hai, aage chalo", session_id: sidOf("9"), at: at(T0, 625) }, prompts_by_session: {} };

// ── clauses: each returns { ok, why } for ONE tree ─────────────────────────
const CLAUSES = {
  W1(tree) {
    const p = plant(tree, "w1", { rows: rowsA, files: filesA, last: lastA });
    const r = run(tree, p, ["--apply"]); const rb = rebuilt(p);
    const x = rb[0] || {};
    const ok = rb.length === 1 && Array.isArray(x.supersedes) && x.supersedes.length === 1 && x.supersedes[0] === sha(rowsA[1])
      && x.user_text_source === "rebuilt-from-transcript" && (x.drifts_rebuilt || []).includes("confusion-is-literal") && x.prev_step === 3
      && typeof x.shared_turn_source === "string" && typeof x.stop_message_source === "string";
    return { ok, why: `${rb.length} rebuilt · drifts [${(x.drifts_rebuilt || []).join(",")}] · prev_step ${x.prev_step} · ${r.line.slice(0, 90)}` };
  },
  W2(tree) {
    const p = plant(tree, "w2", { rows: rowsA, files: filesA, last: lastA });
    const before = readFileSync(p.log, "utf8"); run(tree, p, ["--apply"]); const after = readFileSync(p.log, "utf8");
    const ok = after.length > before.length && after.startsWith(before) && rebuilt(p).length === 1;
    return { ok, why: `prefix ${after.startsWith(before) ? "byte-identical" : "CHANGED"} · ${rebuilt(p).length} rebuilt` };
  },
  W3(tree) {
    const B = sidOf("b");
    const p = plant(tree, "w3", { rows: [row({ sid: B, ts: at(T0, 630), seen: 0 })] });
    const r1 = run(tree, p, ["--apply"]);
    const lost1 = rebuilt(p).filter((x) => x.lost === true).length;
    writeFileSync(join(p.pd, `${B}.jsonl`), [u("theek", at(T0, 600)), a("Chalo.", at(T0, 610))].join("\n") + "\n");   // the file reappears
    const r2 = run(tree, p, ["--apply"]);
    const ok = lost1 === 1 && rebuilt(p).length === 1 && /written 0/.test(r2.line) && /lost 1/.test(r1.line);
    return { ok, why: `lost after run 1: ${lost1} · rows after run 2: ${rebuilt(p).length} · ${r2.line.slice(-60)}` };
  },
  W4(tree) {
    const p = plant(tree, "w4", { rows: rowsA, files: filesA, last: lastA });
    run(tree, p, ["--apply"]); const n1 = logRows(p).length; const r2 = run(tree, p, ["--apply"]);
    const ok = rebuilt(p).length === 1 && logRows(p).length === n1 && /already 1/.test(r2.line) && /written 0/.test(r2.line);
    return { ok, why: `${rebuilt(p).length} rebuilt after two runs · ${r2.line.slice(-70)}` };
  },
  W5(tree) {
    const p = plant(tree, "w5", { rows: rowsA, files: filesA, last: lastA });
    const before = readFileSync(p.log, "utf8"); const r = run(tree, p);
    const all = r.out + r.err;
    const ok = /^rebuild-mismatch · window /.test(r.line) && /DRY RUN: nothing written$/.test(r.line) && /candidates 1 · paired 1 · turns 1/.test(r.line)
      && readFileSync(p.log, "utf8") === before && !all.includes(CANARY) && !all.includes(CONCEPT) && !all.includes(A);
    return { ok, why: `${r.line.slice(0, 120)} · log ${readFileSync(p.log, "utf8") === before ? "unchanged" : "CHANGED"} · leak ${all.includes(CANARY) || all.includes(CONCEPT) || all.includes(A)}` };
  },
  W6(tree) {
    const C = sidOf("c");
    const files = { [C]: [u("pehla", at(T0, 0)), a("Ek.", at(T0, 20)), u("doosra", at(T0, 300)), a("Do.", at(T0, 320)),
      u("samajh nahi aaya", at(T0, 600)), a("Aage.", at(T0, 620)), u("chautha", at(T0, 900)), a("Char.", at(T0, 920))] };
    // two rows for four turns: the k-th row is NOT the k-th turn, the first and last prompts are not the row's turn
    const rows = [row({ sid: C, ts: at(T0, 30), src: "fresh", step: 3 }), row({ sid: C, ts: at(T0, 630), step: 4, seen: 1 })];
    const p = plant(tree, "w6", { rows, files });
    const r = run(tree, p, ["--apply"]); const x = rebuilt(p)[0] || {};
    const ok = rebuilt(p).length === 1 && (x.drifts_rebuilt || []).includes("confusion-is-literal") && /unpairable 0/.test(r.line);
    return { ok, why: `${rebuilt(p).length} rebuilt · drifts [${(x.drifts_rebuilt || []).join(",")}] · ${r.line.slice(0, 140)}` };
  },
  W7(tree) {
    const D = sidOf("d");
    const p = plant(tree, "w7", { rows: [row({ sid: D, ts: at(T0, 30), seen: 0 })], files: { [D]: [u("baad mein", at(T0, 600)), a("Theek.", at(T0, 620))] } });
    const r = run(tree, p, ["--apply"]);
    const ok = /unpairable 1 \(no prompt 1 /.test(r.line) && rebuilt(p).length === 0 && /written 0/.test(r.line);
    return { ok, why: `${r.line.slice(0, 150)} · ${rebuilt(p).length} written` };
  },
  W8(tree) {
    const E = sidOf("e");
    const p = plant(tree, "w8", { rows: [row({ sid: E, ts: at(T0, 630), seen: 1 })], files: { [E]: [u("theek hai", at(T0, 600)), a("Chalo.", at(T0, 620))] } });
    const r = run(tree, p, ["--apply"]);
    const ok = /cross-check 1 /.test(r.line) && rebuilt(p).length === 0;
    return { ok, why: `${r.line.slice(0, 150)} · ${rebuilt(p).length} written` };
  },
  W9(tree) {
    const F = sidOf("f");
    const lines = [u("pehla", at(T0, 0)), a("Ek.", at(T0, 20)), u("samajh nahi aaya", at(T0, 600)), a("Aage.", at(T0, 620))];
    const p0 = plant(tree, "w9", { rows: [row({ sid: F, ts: at(T0, 30), src: "fresh", step: 3 }), row({ sid: F, ts: at(T0, 630), step: 4, seen: 1 })], elsewhere: { [F]: lines } });
    writeFileSync(join(p0.st, "teaching_audit_last.json"), JSON.stringify({ prompts_by_session: { [F]: { stub: true, session_id: F, stop_at: at(T0, 630), stop_kinds: [], transcript_path: p0.paths[F] } } }));
    const r = run(tree, p0, ["--apply"]); const x = rebuilt(p0)[0] || {};
    const ok = rebuilt(p0).length === 1 && !x.lost && x.session_id === F && /lost 0/.test(r.line);
    return { ok, why: `${r.line.slice(0, 150)} · ${rebuilt(p0).length} rebuilt${x.lost ? " (LOST)" : ""}` };
  },
  async W10(tree) {
    const p = plant(tree, "w10", { rows: rowsA, files: filesA, last: lastA });
    const { windowDrift } = await import(pathToFileURL(join(tree, "scripts", "teaching_contract.mjs")).href);
    const now = new Date(at(T0, 86400)), ep = () => null;
    const before = JSON.stringify(windowDrift({ rows: logRows(p), now, entrypointOf: ep }).counts);
    run(tree, p, ["--apply"]);
    const afterRows = logRows(p), after = JSON.stringify(windowDrift({ rows: afterRows, now, entrypointOf: ep }).counts);
    const rb = afterRows.filter((r) => r.rebuilt_from === "transcript");
    const ok = rb.length === 1 && before === after && rb.every((r) => !("ts" in r) && !("scope" in r) && !("drifts" in r));
    return { ok, why: `${rb.length} rebuilt · windowDrift ${before} → ${after} · keys ${rb[0] ? Object.keys(rb[0]).filter((k) => ["ts", "scope", "drifts"].includes(k)).join(",") || "none of ts/scope/drifts" : "-"}` };
  },
  W11(tree) {
    const p = plant(tree, "w11", { rows: rowsA, files: filesA, last: lastA });
    run(tree, p, ["--apply"]);
    const src = readFileSync(join(tree, "scripts", "teaching_audit.mjs"), "utf8").replace(/\r\n/g, "\n");
    const i = src.indexOf("// UNIT maud43 · THE ONE-TIME REBUILD"), j = src.indexOf("// IMPORT GUARD (7 Sep 2026)");
    const sec = i > 0 && j > i ? src.slice(i, j) : "";
    const named = ["contractCall(", "autoHit(", "stampChecked(", "writeLastReal("].filter((n) => sec.includes(n));
    const rb = rebuilt(p);
    const ok = sec.length > 0 && named.length === 0 && rb.length === 1 && rb.every((r) => Array.isArray(r.staged) && r.staged.length === 0);
    return { ok, why: `section ${sec.length ? "found" : "ABSENT"} · names [${named.join(" ")}] · staged ${rb.map((r) => JSON.stringify(r.staged)).join(",") || "-"}` };
  },
  W12(tree) {
    const G = sidOf("1"), H = sidOf("2");
    const files = { [G]: [u("theek", at(T0, 0)), a("Chalo.", at(T0, 20))], [H]: [u("samajh nahi aaya", at(T0, 540)), a("Ruko.", at(T0, 545))] };
    const p = plant(tree, "w12", { rows: [row({ sid: G, ts: at(T0, 600), seen: 0 })], files });   // H's prompt is 9 min after G's, 1 min before G's row
    const r = run(tree, p, ["--apply"]); const x = rebuilt(p)[0] || {};
    const ok = rebuilt(p).length === 1 && x.session_id === G && (x.drifts_rebuilt || []).length === 0 && /paired 1 · turns 1/.test(r.line);
    return { ok, why: `${r.line.slice(0, 150)} · ${rebuilt(p).length} rebuilt · drifts [${(x.drifts_rebuilt || []).join(",")}]` };
  },
  W13(tree) {
    const K = sidOf("3");
    const files = { [K]: [u("pehla", at(T0, -120)), a("Ek.", at(T0, -100)), u("samajh nahi aaya", at(T0, 0)), a("Chalo.", at(T0, 20)), tn(at(T0, 40)), a("Aur aage.", at(T0, 60))] };
    const rows = [row({ sid: K, ts: at(T0, -90), src: "fresh", step: 3 }), row({ sid: K, ts: at(T0, 30), step: 4, seen: 1 }), row({ sid: K, ts: at(T0, 70), step: 4, seen: 1 })];
    const p = plant(tree, "w13", { rows, files });
    const r1 = run(tree, p, ["--apply"]); const rb = rebuilt(p); const r2 = run(tree, p, ["--apply"]);
    const x = rb[0] || {};
    const ok = rb.length === 1 && rebuilt(p).length === 1 && Array.isArray(x.supersedes) && x.supersedes.join() === [sha(rows[1]), sha(rows[2])].join()
      && /turns 1 \(shared 1, rows 2\)/.test(r1.line) && /written 0/.test(r2.line) && (x.drifts_rebuilt || []).includes("confusion-is-literal");
    return { ok, why: `${rb.length} rebuilt · supersedes ${Array.isArray(x.supersedes) ? x.supersedes.length : 0} · ${r1.line.slice(0, 120)}` };
  },
  W14(tree) {
    const N = sidOf("4");
    const files = { [N]: [u("aage", at(T0, 0)), a("Iska asli naam hai **tokenizer**.", at(T0, 20)), tn(at(T0, 50)), a("Theek hai, aage.", at(T0, 60))] };
    const p = plant(tree, "w14", { rows: [row({ sid: N, ts: at(T0, 30), seen: 0, idea: true })], files });
    const r = run(tree, p, ["--apply"]);
    const ok = rebuilt(p).length === 1 && /cross-check 0 /.test(r.line) && /paired 1/.test(r.line);
    return { ok, why: `${r.line.slice(0, 150)} · ${rebuilt(p).length} rebuilt` };
  },
};

// ── the legs ───────────────────────────────────────────────────────────────
const results = [];
const record = (id, ok, why) => { results.push({ id, ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id} · ${why}`); };
const ids = Object.keys(CLAUSES).filter((id) => !ONLY || ONLY.includes(id));
for (const id of ids) {
  let o, b = null;
  try { o = await CLAUSES[id](ORG); } catch (e) { o = { ok: false, why: `threw: ${String((e && e.message) || e).slice(0, 160)}` }; }
  if (BASE) { try { b = await CLAUSES[id](BASE); } catch (e) { b = { ok: false, why: `threw: ${String((e && e.message) || e).slice(0, 80)}` }; } }
  const ok = o.ok && (!b || !b.ok);
  record(id, ok, `build ${o.ok ? "holds" : "FAILS"}: ${o.why}${b ? ` || base ${b.ok ? "ALSO HOLDS (proves nothing)" : "fails, as it must"}` : " || base leg not run"}`);
}
if (BOUND_BASE && (!ONLY || ONLY.includes("BOUND"))) {
  const r = spawnSync("git", ["-C", ORG, "diff", "--name-only", BOUND_BASE, "HEAD"], { encoding: "utf8" });
  const diff = String(r.stdout || "").split(/\r?\n/).filter(Boolean);
  const extra = diff.filter((f) => f !== "scripts/teaching_audit.mjs" && !f.startsWith("ci/maud43/"));
  record("BOUND", r.status === 0 && diff.length > 0 && extra.length === 0, r.status === 0 ? `${diff.length} file(s) differ from ${BOUND_BASE.slice(0, 7)}${extra.length ? ` · BEYOND THE NAMED: ${extra.join(", ")}` : " · all named"}` : `git diff failed: ${r.stderr.trim().slice(0, 100)}`);
}
try { rmSync(TMP, { recursive: true, force: true }); } catch { /* a temp dir that outlives the run is litter, not a failure */ }
const red = results.filter((r) => !r.ok).map((r) => r.id);
if (red.length) { console.log(`RED ${UNIT} · ${red.join(", ")}`); process.exit(1); }
console.log(`GREEN ${UNIT} the session-mismatch turns rebuild once from their own session's file, appended, latched, unread by the rankers, never auto-counted${BASE ? "" : " (base leg not run)"} · ${results.length} clause(s)`);
process.exit(0);
