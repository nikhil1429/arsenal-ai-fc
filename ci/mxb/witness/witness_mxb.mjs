#!/usr/bin/env node
// unit mxb · THE WITNESS (spec seat). Judges an xray IR built from CODE ONLY — no state file's content is read.
//   node ci/mxb/witness/witness_mxb.mjs --org <tree> --base-org <tree> --p10 <mini tree>
// Each tree is planted by ci/mxb/witness/plant_tree.mjs under os.tmpdir(). --org carries the candidate
// scripts/xray.mjs, --base-org the base's. Each clause prints GREEN or RED with its evidence; the LAST line is the
// count. Exit 0 only when every clause is GREEN. No port, no service, no spawn, no model call, no wait.
import { pathToFileURL } from "node:url";
import { join, basename } from "node:path";

const arg = (k) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org"), BASE = arg("--base-org"), P10 = arg("--p10");
if (!ORG || !BASE || !P10) { console.log("witness_mxb: --org, --base-org and --p10 are required"); process.exit(2); }

// a fresh module instance per tree (the query string), so the two IRs never share a module's state
const load = async (root, tag) => import(pathToFileURL(join(root, "scripts", "xray.mjs")).href + `?w=${tag}`);
const xo = await load(ORG, "org"), xb = await load(BASE, "base"), xp = await load(P10, "p10");
const irO = xo.build(), irB = xb.build(), irP = xp.build();
const qO = xo.queries(irO), qB = xb.queries(irB);

let green = 0, red = 0;
const clause = (id, ok, why) => { ok ? green++ : red++; console.log(`${id} ${ok ? "GREEN" : "RED  "} · ${why}`); };
const STATE = "dressing-room/state/";
const fileOf = (ir, base) => ir.files.find((f) => f.path === STATE + base);

// W1-W6 — each blindness: the declared sole writer IS the IR's one (non-fixture) writer of its state file
const B = [
  ["W1", "B1", "models.json", "models.mjs"],
  ["W2", "B2", "sitting.json", "sitting.mjs"],
  ["W3", "B3", "brain_outcomes.jsonl", "scoreboard.mjs"],
  ["W4", "B4", "manager_notes.json", "manager.mjs"],
  ["W5", "B5", "rails_blind.jsonl", "rails.mjs"],
  ["W6", "B6", "teaching_gate.jsonl", "teaching_gate.mjs"],
];
for (const [id, b, file, organ] of B) {
  const f = fileOf(irO, file);
  const w = f ? f.writers : [];
  clause(id, w.length === 1 && w[0] === organ, `${b} ${file}: writers=[${w}] (want [${organ}])`);
}

// W7 — Q6 names exactly D1 (usage_reading.json, kept outside the repo by F11 A) and nothing else
const q6 = qO.Q6.map((r) => `${r.file}<${r.declared_by}`);
clause("W7", q6.length === 1 && q6[0] === "usage_reading.json<usage_tap.mjs", `Q6=[${q6.join(", ")}] (want [usage_reading.json<usage_tap.mjs])`);

// W8 — GUARD (GREEN on base by design; its mutant reds it): no writer is invented. Q2 holds exactly the base's rows,
// Q5 is empty, and every writer edge the build ADDS lands on a file no other organ writes.
const k2 = (q) => q.Q2.map((f) => `${f.path}<${f.writers.join("+")}`).sort().join(" | ");
const wB = new Map(irB.files.map((f) => [f.path, new Set(f.writers)]));
const added = irO.files.flatMap((f) => f.writers.filter((o) => !(wB.get(f.path) || new Set()).has(o)).map((o) => ({ path: f.path, organ: o, all: f.writers })));
const shared = added.filter((e) => e.all.length > 1 && !xo.MULTI_WRITER_ALLOWLIST.includes(e.path));
clause("W8", k2(qO) === k2(qB) && qO.Q5.length === 0 && shared.length === 0,
  `Q2 build=[${k2(qO)}] base=[${k2(qB)}] · Q5=${qO.Q5.length} · added writer edges ${added.length}, onto a shared file ${shared.length}${shared.length ? " " + shared.map((e) => `${e.path}<${e.organ}`).join(",") : ""}`);

// W9 — GUARD: no organ got blinder (unresolved sites per organ are non-increasing, base → build)
const up = Object.keys(irO.organs).filter((o) => irB.organs[o] && irO.organs[o].unresolved > irB.organs[o].unresolved)
  .map((o) => `${o}:${irB.organs[o].unresolved}->${irO.organs[o].unresolved}`);
clause("W9", up.length === 0, `unresolved total ${irB.unresolved_sinks} -> ${irO.unresolved_sinks}; organs that rose: [${up.join(" ")}]`);

// W10 — the fixture boundary on a planted idiom: a selftest's object value never binds a production parameter
const p10 = irP.organs["p10.mjs"] || { reads: [] };
const live = p10.reads.filter((r) => !r.fixture).map((r) => basename(r.path));
clause("W10", live.includes("p10_live.json") && !p10.reads.some((r) => /p10_testdir/.test(r.path) && !r.fixture),
  `p10.mjs live reads=[${live.join(", ")}] (want p10_live.json, and no p10_testdir path read as live)`);

console.log(`witness_mxb: ${green} GREEN, ${red} RED`);
process.exit(red ? 1 : 0);
