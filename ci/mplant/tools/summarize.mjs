// unit mplant · derives every count of the non-LIVE census from ci/mplant/census/nonlive.jsonl — nothing typed.
//   node ci/mplant/tools/summarize.mjs [--table] [--mlaw2 <mlaw2 nonlive.jsonl>]
// --table prints the per-member table (a fenced block in the spec). --mlaw2 names every difference from the mlaw2 contrast
// census (90b6ba7:ci/mlaw2/census/nonlive.jsonl, measured at 6a6bdff with the statejournal preload on Z and copied modules
// for two members only).
import { readFileSync } from "node:fs"; import { join, dirname } from "node:path"; import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const a = process.argv.slice(2), opt = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
const rd = (p) => readFileSync(p, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
const rows = rd(join(HERE, "..", "census", "nonlive.jsonl"));
const c = (t, f) => rows.filter((r) => r[t] && f(r[t])).length;
const green = (t) => c(t, (x) => x.code === 0);
const killed = rows.filter((r) => ["ZL", "ZC", "ZJ"].some((t) => r[t] && r[t].killed)).map((r) => r.organ);
const reds = (t) => rows.filter((r) => r[t] && r[t].code !== 0).map((r) => r.organ);
const touch = rows.filter((r) => r.ZJ && r.ZJ.checkout.touches > 0).map((r) => r.organ);
const writers = rows.filter((r) => r.ZJ && r.ZJ.plant.writes.length).map((r) => r.organ);
const readers = rows.filter((r) => r.ZJ && r.ZJ.plant.absent_reads.length).map((r) => r.organ);
if (a.includes("--table")) {
  console.log("| organ | ZL (linked) | ZC (copied) · the verdict | ZJ (journal) | T (tracked) | ZC last line | plant state reads (absent) · writes |");
  console.log("|---|---|---|---|---|---|---|");
  for (const r of rows) {
    const e = (t) => (r[t] ? `${r[t].code}${r[t].killed ? " KILLED" : ""}` : "—");
    console.log(`| ${r.organ} | ${e("ZL")} | ${e("ZC")} | ${e("ZJ")} | ${e("T")} | \`${String(r.ZC ? r.ZC.last : "").replace(/\|/g, "\\|").replace(/`/g, "'").slice(0, 90)}\` | ${r.ZJ ? `${r.ZJ.plant.absent_reads.slice(0, 4).join(", ")}${r.ZJ.plant.absent_reads.length > 4 ? ` … (${r.ZJ.plant.absent_reads.length})` : ""} · ${r.ZJ.plant.writes.join(", ") || "none"}` : "—"} |`);
  }
}
const m2 = opt("--mlaw2");
if (m2) {
  const old = new Map(rd(m2).map((r) => [r.organ, r]));
  const now = new Map(rows.map((r) => [r.organ, r]));
  const added = [...now.keys()].filter((k) => !old.has(k)), gone = [...old.keys()].filter((k) => !now.has(k));
  const moved = [...now.keys()].filter((k) => old.has(k) && (old.get(k).Z.code === 0) !== (now.get(k).ZC.code === 0));
  console.log(`vs mlaw2: added ${added.length} (${added.join(" ")}) · gone ${gone.length} (${gone.join(" ")}) · verdict moved on the empty plant ${moved.length} (${moved.map((k) => `${k}: mlaw2 Z ${old.get(k).Z.code} → ZC ${now.get(k).ZC.code}`).join("; ")})`);
}
console.log(`mplant census: ${rows.length} non-LIVE members · ZC (empty plant, modules copied, no preload) green ${green("ZC")} · ZL (linked before commit) green ${green("ZL")} · ZJ (journaled) green ${green("ZJ")} · T green ${green("T")} · killed ${killed.length} · ZC red [${reds("ZC").join(" ")}] · ZL red [${reds("ZL").join(" ")}] · ZJ red [${reds("ZJ").join(" ")}] · T red [${reds("T").join(" ")}] · touch the checkout's state dir from the plant ${touch.length} · write under the plant's state dir ${writers.length} [${writers.join(" ")}] · read an absent plant state path ${readers.length}`);
