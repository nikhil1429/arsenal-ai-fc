// unit mlaw Q2 — derive every census count from the measured rows (ci/mlaw/census/*.jsonl), never typed.
//   node ci/mlaw/tools/summarize.mjs [--table]
// Classes (selftests): ZERO = green on a planted EMPTY state dir · PLANT = red on empty, green on the files its LIVE reason
// names (or on the minimal set census_min.mjs found) · RED-BOTH = red even on the sha's whole tracked state on this machine.
// Asserts: ZERO = ok on the empty plant (minus SUBJECT: its subject IS his live state, so a plant measures nothing) ·
// PLANT = reached and ok only on the tracked plant · RED-ON-PLANT = reached on the tracked plant and FAIL.
// Modes: ruled per row below from the measurement named beside it.
import { readFileSync } from "node:fs"; import { join, dirname } from "node:path"; import { fileURLToPath } from "node:url";
const D = join(dirname(fileURLToPath(import.meta.url)), "..", "census");
const rd = (f) => readFileSync(join(D, f), "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
const sf = rd("selftests.jsonl"), R = new Map(rd("plant_named.jsonl").filter((r) => r.organ !== "brain").map((r) => [r.organ, r]));
const MIN = new Map(rd("plant_minimal.jsonl").map((r) => [r.organ, r]));
const cls = (r) => {
  if (r.Z.code === 0) return { c: "ZERO", plant: "empty state dir" };
  if (r.T.code !== 0) return { c: "RED-BOTH", plant: null };
  const p = R.get(r.organ); if (p && p.R.code === 0) return { c: "PLANT", plant: p.keep.join(" + ") };
  const m = MIN.get(r.organ); if (m && m.minimal) return { c: "PLANT", plant: m.minimal.join(" + ") + " (reason names " + m.named.length + ", +" + m.extra.join(" + ") + ")" };
  return { c: "UNPLANTED", plant: null };
};
const rows = sf.map((r) => ({ ...r, ...cls(r) }));
const as = rd("modes.jsonl").filter((r) => r.kind === "assert");
const SUBJECT = new Set([203, 204]);   // "every state .json parses" · "every state .jsonl parses": the subject is his bytes
const acls = (r) => SUBJECT.has(r.line) ? "SUBJECT" : r.Z && r.Z.v === "ok" ? "ZERO" : r.T && r.T.v === "ok" ? "PLANT" : r.T ? "RED-ON-PLANT" : "UNREACHED";
const arows = as.map((r) => ({ ...r, c: acls(r) }));
const MODES = [
  { mode: "lawpack", c: "ZERO", why: "gate output byte-identical with the state dir absent and present (lawstate.mjs)" },
  { mode: "gates", c: "SPLIT", why: "the lint / tsc half reads no state; the ajv half's subject is the schema'd state files (gatesz.mjs: 0/0 measured on the empty plant)" },
  { mode: "alive", c: "PLANT-UNRUN", why: "pulse.mjs has fixture doors ARSENAL_PULSE_TASKS_JSON (:74), ARSENAL_PULSE_STATE_DIR (:64), ARSENAL_PULSE_NOW (:228); on linux it answers NOT-MEASURABLE, so the plant is named, not measured" },
  { mode: "atlas", c: "SUBJECT", why: "`flow_atlas check` re-derives the atlas from state/xray_graph.json, the live IR: its subject is the live state" },
  { mode: "path", c: "NETWORK", why: "mirror.mjs:157 fetches his gist (mirror.mjs:73); not run from the cloud (port class: no live service)" },
];
const count = (xs, c) => xs.filter((x) => x.c === c).length;
const yes = (x) => ["ZERO", "PLANT"].includes(x.c);
console.log(`selftests ${rows.length}: ZERO ${count(rows, "ZERO")} · PLANT ${count(rows, "PLANT")} · RED-BOTH ${count(rows, "RED-BOTH")} · UNPLANTED ${count(rows, "UNPLANTED")}`);
console.log(`asserts ${arows.length}: ZERO ${count(arows, "ZERO")} · PLANT ${count(arows, "PLANT")} · RED-ON-PLANT ${count(arows, "RED-ON-PLANT")} · SUBJECT ${count(arows, "SUBJECT")} · UNREACHED ${count(arows, "UNREACHED")}`);
console.log(`modes ${MODES.length}: ${MODES.map((m) => `${m.mode} ${m.c}`).join(" · ")}`);
const all = [...rows, ...arows, ...MODES];
console.log(`mlaw census: ${all.length} full-only members · CAN ride hermetic on a plant ${all.filter(yes).length} · CANNOT (or not shown) ${all.length - all.filter(yes).length}`);
if (process.argv.includes("--table")) {
  console.log("\n| organ | `organism_test.mjs` line | class | plant (or the live dependency) |\n|---|---|---|---|");
  for (const r of rows) console.log(`| ${r.organ} | ${r.line} | ${r.c} | ${r.plant || r.why} |`);
  console.log("\n| line | class | mode | assert key (folded) |\n|---|---|---|---|");
  for (const r of arows) console.log(`| ${r.line} | ${r.c} | ${(r.T || r.Z || {}).mode || "—"} | ${r.key.replace(/\|/g, "\\|").slice(0, 80)} |`);
}
