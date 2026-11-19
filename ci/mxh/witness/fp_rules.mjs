// mxh: score candidate false-positive rules over every F2-fixed declaration, against the IR's truth
// (a declaration is TRUE when the declaring organ is among the IR writers of a file with that basename).
// Prints counts and organ:line:file triples only.
// usage: node ci/mxh/witness/fp_rules.mjs <copy>/scripts/xray.mjs
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
const xp = process.argv[2];
const x = await import(xp);
const ir = x.build();
const scripts = dirname(xp);
const RULES = {
  // R0: base behaviour — keep every token
  R0: () => false,
  // R1: drop when a FOREIGN `<x>.mjs` is named on the SAME source line before the file token
  R1: (f, head, ls, abs) => foreign(f, head.slice(ls, abs)),
  // R2: R1, plus the PREVIOUS source line (a sentence that wraps)
  R2: (f, head, ls, abs) => foreign(f, head.slice(head.lastIndexOf("\n", ls - 2) + 1, abs)),
  // R3: drop when a FOREIGN `<x>.mjs` is named in the same SENTENCE before the file token: walk back
  // over `//` comment lines until a sentence end (`.` + space/EOL), an empty comment line, or code.
  R3: (f, head, ls, abs) => foreign(f, sentence(head, ls, abs)),
  // R4: the CLAUSE rule — R3 with `;` also a stop, and the token must sit in the marker's own clause
  // (no stop between the marker and the token). THE PROPOSED RULE (MXH_SPEC §2).
  R4: (f, head, ls, abs, mi) => lastStop(head.slice(mi, abs), true) >= 0 || foreign(f, sentence(head, ls, abs, true)),
};
export function sentence(head, ls, abs, semi = false) {
  let start = ls, txt = head.slice(ls, abs);
  for (let i = 0; i < 6; i++) {                 // a sentence spans at most a few comment lines
    const cut = lastStop(txt, semi);
    if (cut >= 0) return txt.slice(cut);
    if (start === 0) return txt;
    const ps = head.lastIndexOf("\n", start - 2) + 1;
    const prev = head.slice(ps, start - 1);
    if (!/^\s*\/\//.test(prev) || /^\s*\/\/\s*$/.test(prev)) return txt;
    txt = prev + "\n" + txt; start = ps;
  }
  return txt;
}
function lastStop(t, semi = false) { let k = -1; for (const m of t.matchAll(semi ? /\.(?=\s|$)|;/g : /\.(?=\s|$)/g)) k = m.index + 1; return k; }
function foreign(f, txt) { return [...txt.matchAll(/([A-Za-z0-9_\-]+)\.mjs/g)].some((t) => t[1] + ".mjs" !== f); }
const res = Object.fromEntries(Object.keys(RULES).map((k) => [k, { kept_true: 0, kept_false: [], dropped_true: [], dropped_false: 0 }]));
for (const f of readdirSync(scripts).filter((n) => n.endsWith(".mjs")).sort()) {
  const head = readFileSync(join(scripts, f), "utf8").slice(0, 12000);
  for (const m of head.matchAll(/(?:SOLE WRITER|sole writer|Single writer|single writer|SINGLE WRITER)[^\n]{0,160}/g)) {
    const ls = head.lastIndexOf("\n", m.index) + 1, ln = head.slice(0, m.index).split("\n").length;
    for (const fm of m[0].matchAll(/([A-Za-z0-9_\-.]+\.jsonl?)(?![A-Za-z0-9_])/g)) {
      const hits = ir.files.filter((p) => p.path.split("/").pop() === fm[1]);
      if (!hits.length) continue;                       // not in the IR: Q5 cannot see it either way
      const anyW = hits.some((h) => h.writers.length);
      if (!anyW) continue;                              // zero writers: F5's census, not Q5's
      const truth = hits.some((h) => h.writers.includes(f));
      const id = `${f}:${ln}:${fm[1]}`;
      for (const [k, rule] of Object.entries(RULES)) {
        const drop = rule(f, head, ls, m.index + fm.index, m.index);
        const r = res[k];
        if (drop) truth ? r.dropped_true.push(id) : r.dropped_false++;
        else truth ? r.kept_true++ : r.kept_false.push(id);
      }
    }
  }
}
for (const [k, r] of Object.entries(res)) console.log(JSON.stringify({ rule: k, kept_true: r.kept_true, dropped_false: r.dropped_false, kept_false: r.kept_false, dropped_true: r.dropped_true }));
