#!/usr/bin/env node
// ci/mwit/plant_day.mjs — unit mwit (spec seat). Plants ONE study day under os.tmpdir() whose meter reads
// <greens>/11 and runs the REAL daily_green.mjs CLI over it (a copy of scripts/ in the temp root, so its ROOT is
// the temp root and the live ledger is never opened). Prints the meter's line and its process exit.
// No live state is read or written; no port, no network, no model.  Usage: node ci/mwit/plant_day.mjs [5|11]
import { readFileSync, cpSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const want = process.argv[2] || "5";
const root = mkdtempSync(join(tmpdir(), "mwit-day-"));
cpSync(join(REPO, "scripts"), join(root, "scripts"), { recursive: true });
cpSync(join(REPO, "package.json"), join(root, "package.json"));
const st = join(root, "dressing-room", "state");
const now = new Date();
const day = new Date(now.getTime() + 330 * 60000).toISOString().slice(0, 10);
const at = (m = 1) => new Date(now.getTime() - m * 60000).toISOString();
const jl = (rows) => rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
const files = {
  "sitting.json": JSON.stringify({ id: "s1", task: "t", route: "FORGE", opened_at: at(5), closed_at: at(1) }),
  "sitting_reviews.jsonl": "",
  "reps_log.jsonl": jl([{ ts: at(3), concept: "planted", correct: true }]),
  "forge_session.json": JSON.stringify({ concept: "planted", resume_pointer: { text: "q", step: 3, at: at(3) } }),
  "registry.json": (() => { // the tracked registry (gate.mjs derives its consumer map from it at import), read, never printed;
    const g = JSON.parse(readFileSync(join(REPO, "dressing-room", "state", "registry.json"), "utf8")); // + the note_blocks lane
    (g.tables.emit_contract = g.tables.emit_contract || []).push({ subject: "note_blocks", writes_to: "note_blocks.jsonl" });
    return JSON.stringify(g); })(),
  "note_blocks.jsonl": jl([{ ts: at(3), axis: "a" }]),
  "compiled_notes.jsonl": jl([{ ts: at(3), day, axis: "a" }]),   // the tracked registry names this file for note_blocks
  "gaffer_grade_queue.jsonl": jl([{ v: 2, kind: "settled", of: "x", ts: at(3), day }]),
  "captains_call.json": JSON.stringify({ cards: [{ id: "c1", dealt: [at(4)] }] }),
};
for (const [k, v] of Object.entries(files)) { mkdirSync(dirname(join(st, k)), { recursive: true }); writeFileSync(join(st, k), v); }
const r = spawnSync(process.execPath, [join(root, "scripts", "daily_green.mjs")], { cwd: root, encoding: "utf8", env: { ...process.env, ARSENAL_ORGAN: "1" } });
if (process.env.MWIT_DEBUG) console.error(r.stderr);
const last = String(r.stdout || "").trim().split(/\r?\n/).pop() || String(r.stderr || "").trim().split(/\r?\n/).pop();
const n = (/· (\d+)\/11 ·/.exec(last) || [])[1];
console.log(`PLANT want ${want}/11 · got ${n ?? "?"}/11 · meter exit ${r.status} · line: ${String(last).slice(0, 400)}`);
rmSync(root, { recursive: true, force: true });
