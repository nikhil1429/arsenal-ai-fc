// unit mgat · does the law pack's OWN half (lawpack.mjs judgeBareCatch: a bare catch inside a production lane that guards fs I/O)
// name any of the six new sites? Reads the head files only; calls the exported pure judge.
import { judgeBareCatch, PRODUCTION_LANES } from "../../../scripts/lawpack.mjs";
const S = [["S1", "scripts/groundsman.mjs", 263], ["S2", "scripts/cortex.mjs", 2344], ["S3", "scripts/cortex.mjs", 2344], ["S4", "scripts/captains_call.mjs", 1691], ["S5", "scripts/captains_call.mjs", 1699], ["S6", "scripts/captains_call.mjs", 1699]];
const r = judgeBareCatch(S.map(([, file, line]) => ({ rule: "bare-catch", file, line, text: "catch {}" })));
const named = new Set((r.findings || []).map((f) => `${f.file}:${f.line}`));
for (const [id, f, l] of S) console.log(`${id} ${f}:${l} lane=${PRODUCTION_LANES.includes(f.split("/").pop().replace(".mjs", ""))} lawpack-bare-catch=${named.has(`${f}:${l}`) ? "NAMED" : "not named"}`);
console.log(`mgat lawsite: ${named.size} of ${S.length} new no-empty sites fall under the law pack's bare-catch half (lane ∧ fs I/O)`);
