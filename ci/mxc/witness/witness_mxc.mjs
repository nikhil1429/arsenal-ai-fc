#!/usr/bin/env node
// witness_mxc.mjs — unit mxc: seven clauses over the IR of scripts/xray.mjs (gaps 1-3 + guards).
// Usage: node witness_mxc.mjs --org <tree> --base-org <tree> --mini <mini tree>
// In-process build()/queries() of each tree's OWN scripts/xray.mjs (a fresh module instance per tree). Code only: the IR
// lists state FILE NAMES for on_disk; no state file's content is read. No port, no service, no spawn, no model call, no
// wait (THE PORT CLASS, row 1053). The second cwd is a fresh dir under os.tmpdir().
import { pathToFileURL } from "node:url";
import { join, resolve } from "node:path";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? resolve(process.argv[i + 1]) : null; };
const ORG = arg("--org"), BASE = arg("--base-org"), MINI = arg("--mini");
const load = (t) => import(pathToFileURL(join(t, "scripts", "xray.mjs")).href);
const at = (cwd, fn) => { const prev = process.cwd(); process.chdir(cwd); try { return fn(); } finally { process.chdir(prev); } };
const edges = (ir) => Object.entries(ir.organs).flatMap(([o, v]) => [
  ...v.reads.map((r) => `${o}\tR\t${r.path}\t${r.fixture ? "fx" : "live"}`),
  ...v.writes.map((w) => `${o}\tW\t${w.path}\t${w.fixture ? "fx" : "live"}`)]).sort();
const edge = (ir, organ, kind, path) => (ir.organs[organ]?.[kind === "R" ? "reads" : "writes"] || []).find((e) => e.path === path) || null;
const q2 = (q, ir) => JSON.stringify(q.Q2.map((f) => `${f.path}<${(ir.files.find((x) => x.path === f.path) || f).writers.join("+")}`).sort());

const other = mkdtempSync(join(tmpdir(), "mxc-cwd-"));
const xo = await load(ORG), xb = await load(BASE), xm = await load(MINI);
const irO = at(ORG, () => xo.build()), irOx = at(other, () => xo.build());
const irB = at(BASE, () => xb.build());
const irM = at(other, () => xm.build());                          // the mini tree is judged from a cwd that is NOT its root
const qO = xo.queries(irO), qB = xb.queries(irB);

const clauses = [];
const judge = (id, what, ok, why) => { clauses.push({ id, ok }); console.log(`${ok ? "GREEN" : "RED  "} ${id} · ${what}${ok ? "" : " — " + why}`); };

// W1 gap 1 — the IR does not depend on the analysing cwd; an empty path is no edge; a relative join under ROOT stays under ROOT
{
  const a = edges(irO), b = edges(irOx), sb = new Set(b);
  const moved = a.filter((e) => !sb.has(e)).length + b.filter((e) => !new Set(a).has(e)).length;
  const p1 = [...irM.organs["p1.mjs"].reads.map((r) => r.path)];
  const ok = moved === 0 && irO.files.length === irOx.files.length && p1.length === 1 && p1[0] === "docs/p1_doc.md";
  judge("W1", "the IR is the same from any cwd (repo tree + plant P1)", ok, `edges moved ${moved}, files ${irO.files.length}/${irOx.files.length}, P1 reads ${JSON.stringify(p1)}`);
}
// W2 gap 2 — a module-scope const-arrow selftest's read is a FIXTURE
{
  const e = edge(irM, "p2.mjs", "R", "dressing-room/state/p2_fixture.json");
  judge("W2", "P2: `const selftest = () => …` read is fixture", !!e && e.fixture === true, `edge ${JSON.stringify(e)}`);
}
// W3 gap 3 — a nested closure's local from its enclosing parameter folds (plant P3 + capture.mjs's quarantine sidecar)
{
  const p = edge(irM, "p3.mjs", "W", "dressing-room/state/p3.jsonl.side.jsonl");
  const c = edge(irO, "capture.mjs", "W", "dressing-room/state/gemini_quality.jsonl.quarantine.jsonl");
  judge("W3", "P3 nested `fail` writes path+\".side.jsonl\"; capture.mjs:962 writes the quarantine sidecar", !!p && !p.fixture && !!c && !c.fixture, `P3 ${JSON.stringify(p)} · capture ${JSON.stringify(c)}`);
}
// W4 GUARD — no organ's verb set moves (the nested collect records no argv taint)
{
  const diff = Object.keys(irB.organs).filter((o) => JSON.stringify(irB.organs[o].verbs) !== JSON.stringify(irO.organs[o]?.verbs));
  judge("W4", "GUARD · verb sets build = base", diff.length === 0, `changed: ${diff.join(", ")}`);
}
// W5 gap 3 (shadow) — a nested local named like a module const never reads the module path
{
  const e = edge(irM, "p5.mjs", "R", "dressing-room/state/p5_outer.json");
  judge("W5", "P5: shadowing nested `const OUTER` reads no p5_outer.json", e === null, `edge ${JSON.stringify(e)}`);
}
// W6 GUARD — a const arrow NESTED in a selftest keeps the selftest ctx (cortex.mjs gateStat, :1053)
{
  const e = edge(irO, "cortex.mjs", "R", "dressing-room/state/brain_out/gate.jsonl"), eb = edge(irB, "cortex.mjs", "R", "dressing-room/state/brain_out/gate.jsonl");
  judge("W6", "GUARD · cortex gateStat read stays a fixture", !!e && e.fixture === true && !!eb && eb.fixture === true, `build ${JSON.stringify(e)} · base ${JSON.stringify(eb)}`);
}
// W7 GUARD — no writer invented: Q2 rows AND writer sets build = base; Q5 = 0
{
  const ok = q2(qO, irO) === q2(qB, irB) && qO.Q5.length === 0;
  judge("W7", "GUARD · Q2 rows+writers build = base, Q5 0", ok, `Q2 base ${q2(qB, irB)} build ${q2(qO, irO)} · Q5 ${qO.Q5.length}`);
}
const g = clauses.filter((c) => c.ok).length, r = clauses.length - g;
console.log(`witness_mxc: ${g} GREEN, ${r} RED`);
process.exit(r ? 1 : 0);
