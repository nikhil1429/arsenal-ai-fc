#!/usr/bin/env node
// ci/mhot/measure_mhot.mjs — unit mhot (forks row 1172 (3)) · THE MEASUREMENT behind ci/mhot/MHOT_SPEC.md. Builds nothing.
// READS GIT OBJECTS ONLY (git show <sha>:<path>, git diff, git merge-tree --write-tree, which writes loose objects and moves
// no ref); writes nothing in the tree, never reads dressing-room/state, binds no port, spawns no organ.
//
//   node ci/mhot/measure_mhot.mjs landings [<ref>=origin/main] [<n>=20]   the shared lines each of the last n unit landings touched
//   node ci/mhot/measure_mhot.mjs queue <main> <ref>...                    the shared lines each unlanded ref touches from its merge base
//   node ci/mhot/measure_mhot.mjs conflict <ours> <theirs>                 which shared line a merge of the two conflicts on
//
// THE SHARED LINES (row 1172 (3)): in scripts/organism_test.mjs every top-level `const NAME = [`, `Object.freeze({` or `{`
// table (SUITE_NAMES, LIVE_SELFTESTS, LIVE_ASSERTS, LIVE_MODES, KNOWN_RED, MODES — derived from the file, never typed here);
// in package.json the three chain strings named by that file's own SUITE_NAMES line, read at each commit.
// A landing = a first-parent commit of <ref> whose subject starts "unit " (the groundsman's state pushes are not units).
import { spawnSync } from "node:child_process";

const git = (...a) => { const r = spawnSync("git", a, { encoding: "utf8", maxBuffer: 1 << 28 }); return { code: r.status, out: r.stdout || "", err: r.stderr || "" }; };
const blob = (sha, p) => { const r = git("show", `${sha}:${p}`); return r.code === 0 ? r.out : null; };
const OT = "scripts/organism_test.mjs", PJ = "package.json";

/** top-level tables of organism_test.mjs: name → { start, end } (1-based, inclusive) and their member keys */
export function tables(src) {
  const lines = String(src || "").split("\n"), out = {};
  for (let i = 0; i < lines.length; i++) {
    const m = /^(?:export )?const ([A-Z][A-Z0-9_]*) = (Object\.freeze\(\{|\[|\{)(.*)$/.exec(lines[i]);
    if (!m) continue;
    const close = m[2] === "[" ? "]" : "}";
    if (new RegExp(`\\${close}\\)?;\\s*(//.*)?$`).test(m[3])) { out[m[1]] = { start: i + 1, end: i + 1, keys: keysOf(m[1], [lines[i]]) }; continue; }
    let j = i + 1;
    while (j < lines.length && !new RegExp(`^\\${close}\\)?;`).test(lines[j])) j++;
    out[m[1]] = { start: i + 1, end: j + 1, keys: keysOf(m[1], lines.slice(i, j + 1)) };
  }
  return out;
}
function keysOf(name, ls) {
  const t = ls.join("\n");
  if (/^\s*const [A-Z_]+ = \[/.test(ls[0]) && ls.length === 1) return [...t.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  if (name === "MODES") return (/\{([^}]*)\}/.exec(t)?.[1] || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (name === "KNOWN_RED") return [...t.matchAll(/assert:\s*"([^"]+)"/g)].map((m) => m[1]);
  return [...t.matchAll(/^\s*(?:"([^"]+)"|([A-Za-z_][\w-]*)):\s/gm)].map((m) => m[1] || m[2]);
}
/** the chain strings: SUITE_NAMES read off the commit's own organism_test.mjs */
export function chains(pkgText, otText) {
  let pkg = {}; try { pkg = JSON.parse(pkgText || "{}"); } catch { /* unparsable = no chains */ }
  const names = tables(otText).SUITE_NAMES?.keys || [];
  const out = {};
  for (const n of names) out[n] = [...String(pkg.scripts?.[n] || "").matchAll(/scripts\/([A-Za-z0-9_\-]+)\.mjs/g)].map((m) => m[1]);
  return out;
}
const diffSets = (a = [], b = []) => ({ add: b.filter((x) => !a.includes(x)), del: a.filter((x) => !b.includes(x)) });

/** old-side hunk ranges of a -U0 diff */
function hunks(p, c, path) {
  const r = git("diff", "-U0", "--no-color", p, c, "--", path), out = [];
  for (const m of r.out.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm)) out.push({ s: +m[1], n: m[2] === undefined ? 1 : +m[2] });
  return out;
}
const touchedTables = (tbl, hs) => Object.entries(tbl).filter(([, t]) => hs.some((h) => (h.n === 0 ? h.s >= t.start && h.s < t.end : h.s <= t.end && h.s + h.n - 1 >= t.start))).map(([k]) => k);

function landings(ref = "origin/main", n = 20) {
  const log = git("log", "--first-parent", "--format=%H %P%x09%s", ref).out.split("\n").filter(Boolean);
  const rows = [];
  for (const l of log) {
    if (rows.length >= n) break;
    const [head, subj] = l.split("\t"), [c, p] = head.split(" ");
    if (!/^unit /.test(subj)) continue;
    const units = (/^unit ([^(:]+?)(?: \(| —|:| -)/.exec(subj)?.[1] || "?").split(/\s*\+\s*/).map((s) => s.trim());
    const otP = blob(p, OT), otC = blob(c, OT), tP = tables(otP), tC = tables(otC);
    const chP = chains(blob(p, PJ), otP), chC = chains(blob(c, PJ), otC);
    const tbl = touchedTables(tP, hunks(p, c, OT));
    const keyMoves = {};
    for (const k of new Set([...Object.keys(tP), ...Object.keys(tC)])) { const d = diffSets(tP[k]?.keys, tC[k]?.keys); if (d.add.length || d.del.length) keyMoves[k] = d; }
    const chainMoves = {};
    for (const k of new Set([...Object.keys(chP), ...Object.keys(chC)])) { const d = diffSets(chP[k], chC[k]); if (d.add.length || d.del.length || (chP[k] || []).join() !== (chC[k] || []).join()) chainMoves[k] = d; }
    rows.push({ sha: c.slice(0, 7), units, tables: tbl, keyMoves, chains: chainMoves });
  }
  return rows;
}

function conflict(ours, theirs) {
  const r = git("merge-tree", "--write-tree", "--name-only", ours, theirs);
  const [tree, ...rest] = r.out.split("\n");
  const files = []; for (const l of rest) { if (!l) break; files.push(l); }
  const out = [];
  for (const f of files) {
    const txt = blob(tree, f) || "", ls = txt.split("\n");
    for (let i = 0; i < ls.length; i++) {
      if (!ls[i].startsWith("<<<<<<< ")) continue;
      let where = "(outside every shared line)";
      if (f === PJ) { const k = /^\s*"([^"]+)":/.exec(ls[i + 1] || ""); where = k ? `package.json scripts["${k[1]}"]` : where; }
      else if (f === OT) {
        for (let j = i - 1; j >= 0; j--) {
          if (/^(?:\}\)?;|\];)/.test(ls[j])) break;
          const m = /^(?:export )?const ([A-Z][A-Z0-9_]*) = (?:Object\.freeze\(\{|\[|\{)/.exec(ls[j]); if (m) { where = m[1]; break; }
          const fn = /^(?:async )?function (\w+)/.exec(ls[j]); if (fn) { where = `function ${fn[1]}() (not a table)`; break; }
        }
      }
      out.push({ file: f, line: i + 1, where });
    }
  }
  return { clean: r.code === 0, files, hunks: out };
}

const [verb, a1, a2] = process.argv.slice(2);
if (verb === "landings") {
  const rows = landings(a1 || "origin/main", Number(a2) || 20);
  const by = {};
  for (const r of rows) {
    for (const t of r.tables) (by[`organism_test.mjs ${t}`] ||= []).push(r.sha);
    for (const c of Object.keys(r.chains)) (by[`package.json ${c}`] ||= []).push(r.sha);
  }
  for (const r of rows) console.log(JSON.stringify(r));
  for (const [k, v] of Object.entries(by)) console.log(`SHARED ${k} · ${v.length} landing(s): ${v.join(" ")}`);
  const shared = Object.values(by).filter((v) => v.length >= 2).length;
  const multi = rows.filter((r) => r.units.length > 1 && (r.tables.length || Object.keys(r.chains).length)).map((r) => `${r.sha}(${r.units.join("+")})`);
  console.log(`MHOT_LANDINGS ${JSON.stringify({ ref: a1 || "origin/main", landings: rows.length, first: rows.at(-1)?.sha, last: rows[0]?.sha, touched_any: rows.filter((r) => r.tables.length || Object.keys(r.chains).length).length, shared_lines_touched_by_two_or_more: shared, assembled_landings_touching: multi })}`);
} else if (verb === "queue" && a1) {
  // each unlanded ref against <main>: the shared lines it touches from its merge base with main (argv: <main> <ref>...)
  const [main, ...refs] = process.argv.slice(3), row = {};
  for (const ref of refs) {
    const p = git("merge-base", main, ref).out.trim(), otP = blob(p, OT), otC = blob(ref, OT);
    const tP = tables(otP), tC = tables(otC), chP = chains(blob(p, PJ), otP), chC = chains(blob(ref, PJ), otC);
    const keyMoves = {}; for (const k of new Set([...Object.keys(tP), ...Object.keys(tC)])) { const d = diffSets(tP[k]?.keys, tC[k]?.keys); if (d.add.length || d.del.length) keyMoves[k] = d; }
    const ch = {}; for (const k of Object.keys(chC)) { const d = diffSets(chP[k], chC[k]); if (d.add.length || d.del.length) ch[k] = d; }
    row[ref] = { base: p.slice(0, 7), tables: touchedTables(tP, hunks(p, ref, OT)), keyMoves, chains: ch };
    console.log(JSON.stringify({ ref, ...row[ref] }));
  }
  console.log(`MHOT_QUEUE ${JSON.stringify({ main, refs: refs.length, touching: Object.entries(row).filter(([, v]) => v.tables.length || Object.keys(v.chains).length).map(([k]) => k) })}`);
} else if (verb === "conflict" && a1 && a2) {
  const r = conflict(a1, a2);
  for (const h of r.hunks) console.log(`  CONFLICT ${h.file}:${h.line} · ${h.where}`);
  console.log(`MHOT_CONFLICT ${JSON.stringify({ ours: a1, theirs: a2, clean: r.clean, files: r.files, shared: r.hunks.map((h) => h.where) })}`);
} else { console.log("usage: measure_mhot.mjs landings [ref] [n] | conflict <ours> <theirs>"); process.exit(1); }
