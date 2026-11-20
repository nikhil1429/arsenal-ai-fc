// unit mlaw2 · derive every census count from the measured rows (ci/mlaw2/census/*.jsonl) — never typed.
//   node ci/mlaw2/tools/summarize.mjs [--table] [--claim] [--mlaw <the mlaw selftests.jsonl at da6d5e8>]
// Z = the planted tree (state EMPTY, no fixture) · T = the contrast tree (the sha's tracked state).
// SELFTEST classes (census_selftests.mjs + vacuity.mjs):
//   RIDES         Z exit 0, not killed, and vacuity.mjs finds it NOT vacuous
//   VACUOUS       Z exit 0, but vacuity.mjs measured it judging less on Z than on T: more NOT-MEASURED lines, a zero-subject
//                 line ("measured 0", "0 file(s)") T does not print, or an error line it SWALLOWED. EXCLUDED from the claim.
//   NEEDS-FIXTURE Z red, T green: the fixture is what the statejournal shows it tried to read and the plant lacked
//   RED-BOTH      red on Z and on T on this machine: not decidable here (NAMED NOT GUESSED)
// ASSERT classes (census_asserts.mjs, the full profile, + refusal_probe.mjs):
//   RIDES         ok on Z, and not vacuous (an `exit !== 0` assert counts only when refusal_probe shows the refusal names its law)
//   VACUOUS       ok on Z over an empty subject: a "(0 … checked)" name, its subject IS the state dir's files, or it judges the
//                 same zero-entry set as a vacuous sibling in its block. EXCLUDED.
//   NEEDS-FIXTURE reached on Z and not ok (a FAIL, or its mode threw at its own read), ok on T
//   BLOCKED       unreached on Z because its mode THREW earlier (at another block's state read), reached on T: needs at least
//                 the file that throw names; its own need is unmeasured on the plant
//   RED-BOTH      not ok on T either (on this machine)
// MODE classes (census_asserts.mjs mode-asserts rows): VACUOUS (Z answers NOT MEASURABLE / measured NOTHING) · RED-BOTH ·
//   RIDES · NETWORK (path: never run — the port class forbids a live service)
import { readFileSync, existsSync } from "node:fs"; import { join, dirname } from "node:path"; import { fileURLToPath } from "node:url";
const D = join(dirname(fileURLToPath(import.meta.url)), "..", "census");
const rd = (f) => existsSync(join(D, f)) ? readFileSync(join(D, f), "utf8").trim().split("\n").filter((l) => l.startsWith("{")).map((l) => JSON.parse(l)) : [];
const VAC = new Map(rd("vacuity.jsonl").map((r) => [r.organ, r]));
const REF = new Map(rd("refusal.jsonl").map((r) => [r.line, r]));
const raw = rd("asserts_raw.jsonl");
const THROWS = new Map(rd("throws.jsonl").map((r) => [r.mode, r]));
const SRC = readFileSync(join(D, "..", "..", "..", "scripts", "organism_test.mjs"), "utf8").split("\n");   // this branch = base 6a6bdff: the file is untouched
export function selftestClass(r) {
  if (r.Z.code !== 0 || r.Z.killed) return r.T.code === 0 && !r.T.killed ? "NEEDS-FIXTURE" : "RED-BOTH";
  const v = VAC.get(r.organ); if (!v) return "UNPROBED";
  return v.vacuous ? "VACUOUS" : "RIDES";
}
// copy_modules.jsonl re-measures a member whose Z red was the PLANTER's linked node_modules ("cannot copy a directory"), on a
// plant with node_modules copied: its row replaces the linked-plant row (the linked row stays in selftests.jsonl, measured)
const CM = new Map(rd("copy_modules.jsonl").map((r) => [r.organ, r]));
const sf = rd("selftests.jsonl").map((r) => CM.get(r.organ) || r).map((r) => ({ ...r, c: selftestClass(r) }));
const modeRow = (side, m) => raw.find((x) => x.kind === "mode" && x.mode === m)?.[side];
const SUBJECT_IS_STATE = /^every state \.jsonl? parses/;
const ZERO_NAME = /\(0 .*checked\)/;
const TABLE_END = SRC.findIndex((l, i) => i > SRC.findIndex((x) => x.startsWith("const LIVE_ASSERTS = Object.freeze({")) && l.startsWith("});")) + 1;
const asr = raw.filter((r) => r.kind === "assert");
const zeroBlocks = new Set(asr.filter((r) => r.Z && (r.Z.names || []).some((n) => ZERO_NAME.test(n))).map((r) => r.Z.mode + ":" + (r.why || "")));
export function assertClass(r) {
  const zok = r.Z && r.Z.v === "ok", tok = r.T && r.T.v === "ok";
  if (zok) {
    if (SUBJECT_IS_STATE.test(r.key) || (r.Z.names || []).some((n) => ZERO_NAME.test(n))) return "VACUOUS";
    if (zeroBlocks.has(r.Z.mode + ":" + (r.why || "")) && r.key.startsWith("…and")) return "VACUOUS";   // the same block's zero set
    // an assert whose SUBJECT is another member's run ("snapshots … around <organ> selftest") judges nothing in the hermetic
    // profile while that member stays LIVE (organism_test.mjs:2314 `if (!liveSelftest("thalamus")) run(…)`): vacuous there
    const around = /around (\S+) selftest/.exec(r.why || ""); if (around) { const m = sf.find((x) => x.organ === around[1]); if (m && m.c !== "RIDES") return "VACUOUS"; }
    const p = REF.get(r.line); if (p && (!p.names_gut_law && p.exit !== 0 || p.crash)) return "VACUOUS";
    return "RIDES";
  }
  if (!tok) return r.T ? "RED-BOTH" : "UNREACHED";
  if (r.Z) return "NEEDS-FIXTURE";
  // unreached on Z: its mode threw (throws.jsonl). The assert's block is the first source line that names it (the key's
  // folded digits matched back as digit runs). A block at or before the throw line HOLDS the throw: its own read needs the
  // fixture. A block after it is BLOCKED by another block's read.
  const th = THROWS.get(r.T.mode); if (!th || th.throw_line == null) return "UNREACHED";
  const re = new RegExp(r.key.slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/#/g, "(?:\\d+|\\$\\{[^}]+\\})"));
  const at = SRC.findIndex((l, i) => i >= TABLE_END && re.test(l)) + 1;   // past the LIVE_ASSERTS table, which names every key
  return at > 0 && at <= th.throw_line ? "NEEDS-FIXTURE" : "BLOCKED";
}
const as = asr.map((r) => ({ ...r, c: assertClass(r) }));
const modeClass = (m) => {
  const z = raw.find((x) => x.kind === "mode-asserts" && x.mode === m && x.side === "Z"), t = raw.find((x) => x.kind === "mode-asserts" && x.mode === m && x.side === "T");
  if (!z) return { mode: m, c: "NETWORK", why: "not run: mirror.mjs reaches his gist (the port class forbids a live service)" };
  const own = z.rows.filter((x) => !/KNOWN-RED/.test(x));   // the four KNOWN-RED rows are the suite's own ruling harness, printed by every mode
  if (own.some((x) => /NOT[ -]MEASURABLE|measured NOTHING/.test(x))) return { mode: m, c: "VACUOUS", why: own.map((x) => x.slice(0, 120)).join(" · ") };
  if (own.some((x) => x.startsWith("FAIL"))) return { mode: m, c: t && t.rows.some((x) => x.startsWith("FAIL")) ? "RED-BOTH" : "NEEDS-FIXTURE", why: (modeRow("Z", m) || {}).last };
  return { mode: m, c: "RIDES", why: own.join(" · ").slice(0, 160) };
};
const modes = ["path", "alive", "gates", "atlas"].map(modeClass);
const cnt = (xs, c) => xs.filter((x) => x.c === c).length;
const CL = ["RIDES", "VACUOUS", "NEEDS-FIXTURE", "BLOCKED", "RED-BOTH", "UNREACHED", "UNPROBED", "NETWORK"];
const line = (label, xs) => `${label} ${xs.length}: ${CL.filter((c) => cnt(xs, c)).map((c) => `${c} ${cnt(xs, c)}`).join(" · ")}`;
console.log(line("selftests", sf)); console.log(line("asserts", as)); console.log(`modes ${modes.length}: ${modes.map((m) => `${m.mode} ${m.c}`).join(" · ")}`);
const all = [...sf, ...as, ...modes];
const fixture = cnt(all, "NEEDS-FIXTURE") + cnt(all, "BLOCKED");
console.log(`mlaw2 census: ${all.length} full-only members · RIDE the hermetic profile on the planted tree with NO fixture ${cnt(all, "RIDES")} · VACUOUS (named, excluded) ${cnt(all, "VACUOUS")} · need a fixture ${fixture} · not decidable here ${all.length - cnt(all, "RIDES") - cnt(all, "VACUOUS") - fixture}`);
if (process.argv.includes("--claim")) {
  console.log(`CLAIM selftests ${sf.filter((r) => r.c === "RIDES").map((r) => r.organ).join(" ")}`);
  console.log(`CLAIM asserts ${as.filter((r) => r.c === "RIDES").map((r) => r.line).join(" ")}`);
  console.log(`CLAIM modes ${modes.filter((r) => r.c === "RIDES").map((r) => r.mode).join(" ") || "none"}`);
  console.log(`EXCLUDED-VACUOUS selftests ${sf.filter((r) => r.c === "VACUOUS").map((r) => r.organ).join(" ")} · asserts ${as.filter((r) => r.c === "VACUOUS").map((r) => r.line).join(" ")} · modes ${modes.filter((r) => r.c === "VACUOUS").map((r) => r.mode).join(" ")}`);
}
const mi = process.argv.indexOf("--mlaw");
if (mi > 0) {
  const ml = readFileSync(process.argv[mi + 1], "utf8").trim().split("\n").map((l) => JSON.parse(l));
  const mz = new Set(ml.filter((r) => r.Z.code === 0).map((r) => r.organ));
  const names = [...new Set([...ml.map((r) => r.organ), ...sf.map((r) => r.organ)])].sort();
  console.log(`diff vs mlaw selftests (its ZERO = Z exit 0): ${names.filter((o) => mz.has(o) !== (sf.find((r) => r.organ === o) || {}).c?.startsWith("RIDES") || !sf.find((r) => r.organ === o)).map((o) => `${o}: mlaw ${mz.has(o) ? "ZERO" : "not ZERO"} → mlaw2 ${(sf.find((r) => r.organ === o) || { c: "not LIVE at 6a6bdff" }).c}`).join(" · ")}`);
}
if (process.argv.includes("--table")) {
  const esc = (s) => String(s ?? "").replace(/\|/g, "\\|");
  console.log("\n| organ | `organism_test.mjs` line | class | Z exit · last line | what the plant lacks (statejournal: absent reads) · or the vacuity measured |\n|---|---|---|---|---|");
  for (const r of sf) { const v = VAC.get(r.organ);
    const what = r.c === "RIDES" ? (r.Z.shape === r.T.shape ? "output shape equal on Z and T" : `vacuity: unmeasured ${v.Z.unmeasured}/${v.T.unmeasured} · zero-subject ${v.Z.zeroSubject}/${v.T.zeroSubject} · swallowed no`)
      : r.c === "VACUOUS" ? `vacuity: unmeasured Z ${v.Z.unmeasured} / T ${v.T.unmeasured} · zero-subject ${v.Z.zeroSubject}/${v.T.zeroSubject} · swallowed ${v.swallowed ? "YES" : "no"}`
      : r.journal.absent_reads.slice(0, 6).join(", ") + (r.journal.absent_reads.length > 6 ? ` … (${r.journal.absent_reads.length})` : "");
    console.log(`| ${r.organ} | ${r.line} | ${r.c} | ${r.Z.killed ? "killed" : r.Z.code} · \`${esc(r.Z.last).slice(0, 80)}\` | ${esc(what)} |`); }
  console.log("\n| line | class | mode | Z | T | assert key (folded) |\n|---|---|---|---|---|---|");
  for (const r of as) console.log(`| ${r.line} | ${r.c} | ${(r.Z || r.T || {}).mode || "—"} | ${r.Z ? r.Z.v : "unreached"} | ${r.T ? r.T.v : "unreached"} | ${esc(r.key).slice(0, 80)} |`);
  console.log("\n| mode | class | measured on Z |\n|---|---|---|");
  for (const m of modes) console.log(`| ${m.mode} | ${m.c} | ${esc(m.why).slice(0, 200)} |`);
}
