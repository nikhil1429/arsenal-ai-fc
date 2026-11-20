// unit mfix — every count of MFIX_SPEC.md derived from the measured rows (ci/mfix/census/*.jsonl), never typed.
//   node ci/mfix/tools/summarize.mjs [--table]
// Classes (selftests, from census.mjs Z/T): ZERO = green on the EMPTY plant (unit mlaw2's, no fixture) · PLANT = red on
// empty, green on the tracked state (unit mfix's) · RED-BOTH = red even on the tracked state on this machine.
// For each PLANT member (plantcheck.mjs): MINIMAL = the smallest tracked file set that keeps it green (one-at-a-time
// removal) · BEARING = read keys whose deletion turns it red (the non-vacuity plant) · SYNTH (synth.mjs `ids`): green
// on the synthetic transform of its minimal plant · COUPLED (coupled.mjs): rows that must stay verbatim.
// The registry's read site is always its owner's path (`REGISTRY_PATH`, registry.mjs:59): every reader rides registry.mjs.
import { readFileSync, existsSync } from "node:fs"; import { join, dirname } from "node:path"; import { fileURLToPath } from "node:url";
const D = join(dirname(fileURLToPath(import.meta.url)), "..", "census");
const rd = (f) => existsSync(join(D, f)) ? readFileSync(join(D, f), "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
const sf = rd("selftests.jsonl"), pc = new Map(rd("plantcheck.jsonl").map((r) => [r.organ, r]));
const syn = new Map(rd("synth.jsonl").map((r) => [r.organ, r])), cp = new Map([...rd("coupled.jsonl"), ...rd("coupled2.jsonl")].map((r) => [r.organ, r]));
const ck = new Map(rd("coupled_keys.jsonl").map((r) => [r.organ, r]));
const rds = new Map(rd("readers.jsonl").map((r) => [r.organ, r.sites]));
const cls = (r) => r.Z.code === 0 ? "ZERO" : r.T.code !== 0 ? "RED-BOTH" : "PLANT";
const rows = sf.map((r) => ({ ...r, c: cls(r) }));
const P = rows.filter((r) => r.c === "PLANT");
const n = (xs, c) => xs.filter((x) => x.c === c).length;
console.log(`selftests ${rows.length}: ZERO ${n(rows, "ZERO")} (mlaw2) · PLANT ${n(rows, "PLANT")} (mfix) · RED-BOTH ${n(rows, "RED-BOTH")}`);
const done = P.filter((r) => pc.has(r.organ)), minimal = done.filter((r) => pc.get(r.organ).minimal);
const fileCount = {}; for (const r of minimal) for (const f of pc.get(r.organ).minimal) fileCount[f] = (fileCount[f] || 0) + 1;
console.log(`plantcheck: ${done.length}/${P.length} measured · minimal plant green ${minimal.length} · with a load-bearing key ${done.filter((r) => pc.get(r.organ).bearing.length).length} · presence-only (no bearing key) ${done.filter((r) => !pc.get(r.organ).bearing.length).map((r) => r.organ).join(",") || "none"}`);
console.log(`minimal-plant files: ${Object.entries(fileCount).sort((a, b) => b[1] - a[1]).map(([f, c]) => `${f} ${c}`).join(" · ")}`);
const sy = P.filter((r) => syn.has(r.organ));
console.log(`synthetic (ids transform of the minimal plant): ${sy.length} measured · green ${sy.filter((r) => syn.get(r.organ).exit === 0).length} · red ${sy.filter((r) => syn.get(r.organ).exit !== 0).map((r) => r.organ).join(",")}`);
const cpr = [...cp.values()];
console.log(`code-coupled rows: ${cpr.length} members measured · green with all rows verbatim ${cpr.filter((r) => r.all_real_green).length} · rows kept verbatim: ${cpr.map((r) => `${r.organ} ${(r.real_rows || ["(not green)"]).join("+")}`).join(" · ")}`);
const ckr = [...ck.values()];
console.log(`code-coupled keys (config files): ${ckr.map((r) => `${r.organ} ${r.file} ${(r.real_keys || ["(not green)"]).join("+") || "none"} of ${r.keys}`).join(" · ")}`);
const rowsNeeded = {}; for (const r of cpr) for (const x of r.real_rows || []) rowsNeeded[x] = (rowsNeeded[x] || 0) + 1;
console.log(`verbatim registry rows, by members needing each: ${Object.entries(rowsNeeded).sort((a, b) => b[1] - a[1]).map(([k, c]) => `${k} ${c}`).join(" · ")} · distinct ${Object.keys(rowsNeeded).length}`);
const ar = rd("atlas_real.jsonl"); if (ar.length) console.log(`atlas (W6 plant): ${ar.map((x) => `${x.variant} exit ${x.exit} · ${(x.atlas_assert || "").split(" ")[0]}`).join(" · ")}`);
const mi = rd("modeplant_integrity.jsonl"); if (mi.length) console.log(`integrity mode: ${mi.map((x) => `${x.variant} ${Object.entries(x.verdicts).map(([l, v]) => `${l}:${v}`).join(",")}`).join(" · ")}`);
const ml = rd("modeplant_laws.jsonl"); if (ml.length) { const v = (x) => Object.values(x.verdicts); console.log(`laws mode: ${ml.map((x) => `${x.variant} ok ${v(x).filter((y) => y === "ok").length}/${v(x).length}`).join(" · ")}`); }
const cl = rd("coupled_laws.jsonl"); if (cl.length) console.log(`laws mode code-coupled rows: ${cl.map((r) => `${(r.real_rows || ["(not green)"]).join("+")} (live ok ${(r.live_ok || []).length})`).join(" · ")}`);
if (process.argv.includes("--table")) {
  console.log("\n| organ | LIVE line | minimal plant | read site (file:line) | load-bearing keys | non-vacuity plant (delete → red) | synthetic | verbatim rows |\n|---|---|---|---|---|---|---|---|");
  for (const r of P) { const p = pc.get(r.organ) || {}; const s = syn.get(r.organ); const c = cp.get(r.organ); const st = rds.get(r.organ) || {};
    const mn = p.minimal || []; console.log(`| ${r.organ} | ${r.line} | ${mn.join(" + ") || "—"} | ${mn.map((f) => f === "registry.json" ? "scripts/registry.mjs:59" : (st[f] || "?")).join(" · ") || "—"} | ${(p.bearing || []).length} | ${(p.bearing || [])[(p.bearing || []).length - 1] || "— (presence only)"} | ${s ? (s.exit === 0 ? "GREEN" : "red") : "—"} | ${c ? (c.real_rows || ["not green"]).join(" + ") || "none" : ck.get(r.organ) ? "keys: " + (ck.get(r.organ).real_keys || ["not green"]).join(" + ") : s && s.exit === 0 ? "none" : "—"} |`); }
}
