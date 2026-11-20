#!/usr/bin/env node
// run_mutants_mxc.mjs — unit mxc: one string replacement per mutant in a COPY of the candidate xray.mjs; the mutant is
// copied into one org tree and one mini tree (both under os.tmpdir(), planted by plant_tree.mjs), and the witness runs in
// a synchronous child, each wait bounded by that child's own exit (nothing typed). An anchor not found EXACTLY once is
// UNAPPLIED: a RED runner, never a skip. Control: the unmutated candidate must be all GREEN.
// Usage: node run_mutants_mxc.mjs --repo <repo> --xray <candidate> --base-org <base tree>
import { readFileSync, writeFileSync, copyFileSync, mkdtempSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? resolve(process.argv[i + 1]) : null; };
const REPO = arg("--repo"), CAND = arg("--xray"), BASE = arg("--base-org");
const plant = (extra) => spawnSync(process.execPath, [join(HERE, "plant_tree.mjs"), "--repo", REPO, ...extra], { encoding: "utf8" }).stdout.trim().split("\n").pop();
const ORG = plant(["--tag", "mut-org"]), MINI = plant(["--mini", join(HERE, "plants"), "--tag", "mut-mini"]);
const src = readFileSync(CAND, "utf8");
const MUTANTS = [
  { id: "M1", kills: "W1", why: "join folds onto the analysing cwd again (join evaluated as resolve)",
    from: `if (name === "join") return C(slash(join(...parts)));`, to: `if (name === "join") return C(slash(pathResolve(...parts)));` },
  { id: "M2", kills: "W2", why: "a module-scope const arrow no longer names its body's ctx",
    from: `: CTX === "module" && n.type === "VariableDeclarator"`, to: `: false && n.type === "VariableDeclarator"` },
  { id: "M3", kills: "W3", why: "a nested body's locals are not collected over the enclosing scope",
    from: `if (locals) collectLocals(n.body.body, inner);`, to: `if (false) collectLocals(n.body.body, inner);` },
  { id: "M4", kills: "W4", why: "the nested collect reuses collectDecls (argv taint leaks into nested locals)",
    from: `if (locals) collectLocals(n.body.body, inner);`, to: `if (locals) collectDecls(n.body.body, inner);` },
  { id: "M5", kills: "W5", why: "a nested local no longer masks the outer binding of its name",
    from: `        for (const nm of bound(d.id)) scope.delete(nm);\n        if (!d.init || d.id.type !== "Identifier") continue;`, to: `        if (!d.init || d.id.type !== "Identifier") continue;` },
  { id: "M6", kills: "W6", why: "a const arrow names the ctx from ANY ctx (a nested arrow in a selftest goes live)",
    from: `: CTX === "module" && n.type === "VariableDeclarator"`, to: `: n.type === "VariableDeclarator"` },
  { id: "M7", kills: "W7", why: "a nested body is walked with ctx \"module\" (loses its probe/test ctx; watchman's thalamus_config write goes live)",
    from: `const prevCtx = CTX; if (n.id) CTX = n.id.name;\n          walkBody(n.body, inner, ctx);`, to: `const prevCtx = CTX; CTX = locals ? "module" : (n.id ? n.id.name : CTX);\n          walkBody(n.body, inner, ctx);` },
  { id: "M8", kills: "W8", why: "nested locals are collected only for a FunctionDeclaration (an arrow behind `||` stays unfolded)",
    from: `const locals = n.body.type === "BlockStatement"`, to: `const locals = n.type === "FunctionDeclaration" && n.body.type === "BlockStatement"` },
];
const runWitness = (text) => {
  const f = join(mkdtempSync(join(tmpdir(), "mxc-mut-")), "xray.mjs");
  writeFileSync(f, text);
  copyFileSync(f, join(ORG, "scripts", "xray.mjs")); copyFileSync(f, join(MINI, "scripts", "xray.mjs"));
  const r = spawnSync(process.execPath, [join(HERE, "witness_mxc.mjs"), "--org", ORG, "--base-org", BASE, "--mini", MINI], { encoding: "utf8" });
  const red = [...(r.stdout || "").matchAll(/^RED\s+(W\d+)/gm)].map((m) => m[1]);
  return { red, status: r.status, last: (r.stdout || r.stderr || "").trim().split("\n").pop() };
};
const ctl = runWitness(src);
console.log(`control: ${ctl.last} (exit ${ctl.status})`);
let killed = 0, bad = 0;
for (const m of MUTANTS) {
  const n = src.split(m.from).length - 1;
  if (n !== 1) { console.log(`${m.id} UNAPPLIED (anchor found ${n} times) · ${m.why}`); bad++; continue; }
  const r = runWitness(src.replace(m.from, m.to));
  const ok = r.red.includes(m.kills);
  if (ok) killed++; else bad++;
  console.log(`${m.id} ${ok ? "RED by " + m.kills : "SURVIVED " + m.kills} · red=[${r.red.join(",")}] · ${m.why}`);
}
const ctlOk = ctl.status === 0 && ctl.red.length === 0;
console.log(`run_mutants_mxc: ${killed} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${ctlOk ? "GREEN" : "RED"}`);
process.exit(bad || !ctlOk ? 1 : 0);
