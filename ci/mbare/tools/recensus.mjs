// unit mbare · THE RE-CENSUS of the BLOCKED asserts (mlaw2 fork F7 B, forks row 1231). A census tool, not an organ.
//   node ci/mbare/tools/recensus.mjs <base-sha> <build-sha>        → writes ci/mbare/census/{blocked.jsonl,runs.jsonl,SUMMARY.txt}
//   node ci/mbare/tools/recensus.mjs --table                         → prints census/blocked.jsonl as a markdown table (no run)
// It runs `scripts/organism_test.mjs laws` in the FULL profile (the only profile that judges a LIVE assert) on planted trees
// (ci/mbare/tools/plant.mjs, copied from mlaw2): Z = the sha with an EMPTY state dir (no fixture, none of his bytes), T = the
// sha with its tracked state (what a fresh clone reads; its bytes are his, so off T only a FOLDED name and a verdict are kept,
// never a line). Runs: Z(base) once, T(base) once, Z(build) TWICE on fresh plants (stability), T(build) once.
// THE BLOCKED SET (re-measured at <base>, never typed): every LIVE_ASSERTS key (read off <base>'s own source, file:line) that
// the laws mode judges on T(base) and that Z(base) leaves UNREACHED because the mode threw — minus the asserts of the block
// that threw (their need is their OWN read: a fixture member by mlaw2's rule). The throwing block is found on Z(build): it is
// the guarded block whose input names the row/file of Z(base)'s throw.
// THE CLASSES, per blocked assert, read off the two Z(build) runs (rules here, nothing typed per assert):
//   RIDES        ok on both Z(build) runs, ok on T, and not VACUOUS
//   VACUOUS      ok on Z(build), but judging less than on T: a digit run printed 0 in the Z name where T's is non-zero
//                (zero-subject), or the assert's own condition reads only an exit code (`.code !== 0`) so a refusal for the
//                missing input passes it as well as a refusal for the law (exit-only) — named, how measured
//   NEEDS-FIXTURE FAIL on Z(build) (its detail names the input) or BLOCKED by its input (the guard names it, and the read's
//                file:line); the input and the file:line are extracted from the Z detail
//   NOT-DECIDABLE the two Z(build) runs disagree, or T(base) is not ok (red on the fresh clone's state too: mlaw2 §9 N2)
// Each row carries the assert's own organism_test.mjs line at <build>. Z text is scrubbed (temp paths masked, JSON lines withheld).
import { spawnSync } from "node:child_process"; import { createHash } from "node:crypto"; import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path"; import { fileURLToPath } from "node:url";
import { plant, plantEnv, memberBound, liveTables } from "./plant.mjs";
const HERE = dirname(fileURLToPath(import.meta.url)); const OUTD = join(HERE, "..", "census");
if (process.argv[2] === "--table") {
  const rows = readFileSync(join(OUTD, "blocked.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  const cell = (t) => String(t).replace(/\|/g, "\\|").replace(/`/g, "'");
  console.log("| base line | build line | class | Z · Z · T | the assert (folded key) | input (file:line of the read) · or how measured |\n|---|---|---|---|---|---|");
  for (const r of rows) { const w = r.why; const how = typeof w === "string" ? w.replace(/ · Z out: .*$/, "")
      : `${w.input.files.join(", ")}${w.input.row ? ` · mechanisms row "${w.input.row}"` : ""}${w.input.table ? ` · ${w.input.table} table` : ""}${w.input.row_cut ? " · row name cut by the organ's message" : ""} · read at ${w.input.at.join(" ← ") || "—"} · from ${w.input_from}`;
    console.log(`| ${r.base_line} | ${r.build_line} | ${r.cls} | ${r.Z1} · ${r.Z2} · ${r.T_base} | ${cell(r.key.slice(0, 80))} | ${cell(how).slice(0, 400)} |`); }
  process.exit(0);
}
const [BASE, BUILD] = process.argv.slice(2);
if (!BASE || !BUILD) { console.error("usage: node ci/mbare/tools/recensus.mjs <base-sha> <build-sha>"); process.exit(2); }
const fold = (n) => String(n).replace(/\d+/g, "#");
const keyMatch = (k, n) => { const f = fold(n); return f.startsWith(k) || f.slice(0, 90) === k; };
const scrub = (t, d) => String(t).split(d).join("<plant>").replace(/(?:[A-Za-z]:)?[\\/](?:tmp|Users|home)[\\/][^\s'"`]*?[\\/](?=scripts[\\/]|dressing-room[\\/])/g, "<tree>/")
  .replace(/(?:[A-Za-z]:)?[\\/]tmp[\\/][^\s'"`]+/g, "<tmp>").split(/\r?\n/).filter((l) => !/^\s*[{[]/.test(l)).join(" ⏎ ").slice(0, 600);
/** run laws on a fresh plant; Z keeps names + scrubbed details, T keeps folded names + verdicts only */
async function laws(sha, side, patch) {
  const d = plant(sha, { trackedState: side === "T", tag: `${side}` }); const { env, home } = await plantEnv(d); delete env.ORGANISM_TEST_PROFILE;
  if (patch) { const f = join(d, "scripts", "organism_test.mjs"); writeFileSync(f, patch(readFileSync(f, "utf8"))); }
  const r = spawnSync(process.execPath, ["scripts/organism_test.mjs", "laws"], { cwd: d, env, encoding: "utf8", timeout: memberBound(d), maxBuffer: 1 << 28 });
  const L = ((r.stdout || "") + (r.stderr || "")).split(/\r?\n/);
  /** @type {{ v: string, name: string, detail?: string }[]} */ const rows = [];
  let sec = 0;
  const detailAt = (i) => { const out = []; for (let j = i + 1; j < L.length && j < i + 60; j++) { if (/^  (ok  |FAIL) |^  BLOCKED |^── |^ORGANISM_TEST_VERDICT/.test(L[j])) break; out.push(L[j].trim()); } return out.filter(Boolean).join("\n"); };
  L.forEach((l, i) => {
    if (/^── /.test(l)) sec++;
    let m = /^  (ok  |FAIL) (.*)$/.exec(l);
    if (m) { const det = m[1] === "FAIL" ? detailAt(i) : "";
      rows.push(side === "Z" ? { v: m[1].trim(), name: m[2], sec, ...(det ? { detail: scrub(det, d) } : {}) } : { v: m[1].trim(), name: fold(m[2]).slice(0, 90) }); return; }
    m = /^  BLOCKED (.*) — not judged: its input (.*) is absent from the state dir$/.exec(l);
    if (m) rows.push(side === "Z" ? { v: "BLOCKED", name: m[1], sec, detail: m[2] } : { v: "BLOCKED", name: fold(m[1]).slice(0, 90) });
  });
  const tables = side === "Z" ? liveTables(d) : null;
  const src = side === "Z" ? readFileSync(join(d, "scripts", "organism_test.mjs"), "utf8").split("\n") : null;
  const head = L.filter((l) => /^organism_test: /.test(l)).pop() || "";
  // a probe's output SHAPE: scrubbed, digits folded, hashed — the only thing ever kept off T
  const shapeHash = (t) => createHash("sha256").update(fold(scrub(t, d))).digest("hex").slice(0, 16);
  const probes = L.map((l) => /^PROBE (\d+) exit (\S+) (.*)$/.exec(l)).filter(Boolean).map((m) => ({ line: Number(m[1]), exit: m[2], h: shapeHash(JSON.parse(m[3])),
    ...(side === "Z" ? { out: scrub(JSON.parse(m[3]), d) } : {}) }));
  const out = { sha, side, exit: r.status, head, rows, tables, src, probes };
  rmSync(d, { recursive: true, force: true }); rmSync(home, { recursive: true, force: true });
  return out;
}
const zb = await laws(BASE, "Z"), tb = await laws(BASE, "T"), z1 = await laws(BUILD, "Z"), z2 = await laws(BUILD, "Z"), tB = await laws(BUILD, "T");
const runs = [zb, tb, z1, z2, tB].map((x) => ({ sha: x.sha, side: x.side, exit: x.exit, head: x.head, ok: x.rows.filter((r) => r.v === "ok").length, fail: x.rows.filter((r) => r.v === "FAIL").length, blocked: x.rows.filter((r) => r.v === "BLOCKED").length }));
const baseThrow = zb.rows.find((r) => r.name.startsWith("MODE laws · ran to its end"));
const throwRow = baseThrow ? (/no live mechanisms row "([^"]+)"/.exec(baseThrow.detail || "") || [])[1] : null;
const guards = z1.rows.filter((r) => r.v === "FAIL" && r.name.startsWith("BLOCKED BY ITS INPUT · "));
const throwBlock = guards.find((g) => throwRow && g.name.includes(`"${throwRow}"`));
const ownNames = throwBlock ? z1.rows.filter((r) => r.v === "BLOCKED" && r.detail && r.detail.includes(`"${throwRow}"`)).map((r) => r.name) : [];
const keys = zb.tables.asserts;   // LIVE_ASSERTS at BASE, file:line
const find = (rows, k, side) => rows.filter((r) => keyMatch(k, side === "T" ? r.name : r.name));
const blocked = [];
for (const k of keys) {
  const t = find(tb.rows, k.key, "T"); if (!t.length) continue;            // not judged by laws on T: not a laws assert
  if (find(zb.rows, k.key, "Z").length) continue;                          // reached on Z(base): not blocked
  if (ownNames.some((n) => keyMatch(k.key, n))) continue;                   // the throwing block's own asserts
  blocked.push(k);
}
// the innermost laws() block (a liveBlock / bareGuard / skipLive block, or a bare `{`) holding a source line, as "open-close"
const blockOf = (line) => { if (!line) return null; const s = z1.src;
  for (let i = line - 1; i > 0 && !/^async function laws\(\)/.test(s[i]); i--) {
    const m = /^(\s*)(?:await liveBlock\(|await bareGuard\(|if \(!skipLive\(|\{$)/.exec(s[i]); if (!m) continue;
    const close = s.findIndex((l, j) => j > i && (l === `${m[1]}}` || l === `${m[1]}});`));
    if (close >= line - 1) return `${i + 1}-${close + 1}`;
  }
  return null; };
// the assert's OWN line: the occurrence of its name on (or right after) an `assert(` call; else the last occurrence
const srcLine = (name) => { const s = z1.src; const probe = name.slice(0, 50).replace(/\d+/g, "");
  const hits = s.map((l, i) => (l.replace(/\$\{[^}]*\}|\d+/g, "").includes(probe) ? i : -1)).filter((i) => i >= 0);
  const call = hits.find((i) => /\bassert\(\s*["`]/.test(s[i]) || /\bassert\(\s*$/.test(s[i - 1] || ""));
  const i = call !== undefined ? call : hits.pop(); return i === undefined ? null : i + 1; };
const inputOf = (det) => {
  const files = [...new Set([...String(det).matchAll(/\b([\w-]+\.jsonl?)\b/g)].map((m) => m[1]))];
  const row = ([...String(det).matchAll(/mechanisms row \\?"([^"\\$]+)\\?"/g)][0] || [])[1];
  const lanes = /registry lanes table is EMPTY/.test(String(det));
  const at = [...String(det).matchAll(/([\w-]+\.mjs):(\d+)/g)].map((m) => `${m[1]}:${m[2]}`);
  // an organ that quotes registry.mjs's throw and CUTS it (samjhao: "...registry: no live mecha)") still names that input: the
  // registry's mechanisms table; the row name is lost in the cut and is then inferred (labelled) from its block's earlier red
  if (!row && /registry: no live mecha|registry\.mjs:134\b/.test(String(det)) && !files.includes("registry.json")) files.push("registry.json");
  const cut = !row && /registry: no live mecha|registry\.mjs:134\b/.test(String(det));
  return { ...(cut ? { row_cut: "the organ's own message cuts the row name off" } : {}), files: files.filter((f) => !/^(package|tsconfig)\.json$/.test(f)), ...(row ? { row } : {}), ...(lanes ? { table: "registry.json lanes" } : {}), at: [...new Set(at)].slice(0, 4) };
};
// THE CONDITION'S SHAPE (read off the assert call's own source span, `assert(` to its closing `);`):
//   exit-only      the condition is `<x>.code !== 0` and nothing else — a refusal for the ABSENT INPUT passes it as well as one for the law
//   negative-only  the condition is one `!/re/.test(<call>.out)` — an output that is empty, or a crash, passes it as well as a clean run
const spanOf = (line) => { const s = z1.src; let j = line - 1; while (j < s.length - 1 && !/\);\s*$/.test(s[j])) j++; return s.slice(line - 1, j + 1).join("\n"); };
const condOf = (line) => { const t = spanOf(line); const q = t.search(/["`]\s*,/); return q < 0 ? "" : t.slice(q + 2).replace(/,\s*`[^`]*`\s*\);\s*$|\);\s*$/, "").trim(); };
const shapeOf = (line) => { if (!line) return null; const c = condOf(line);
  if (/^(?:[\w.]+(?:\((?:[^()]|\([^()]*\))*\))?)\.code !== 0$/.test(c)) return "exit-only";
  if (/^!\/(?:[^/\\]|\\.)+\/\.test\((?:[\w.]+\((?:[^()]|\([^()]*\))*\))\.out\)$/.test(c)) return "negative-only";
  return null; };
// THE PROBE: a fresh Z(build) plant whose (temp, never committed) organism_test.mjs prints, for each probed assert, the exit code and
// output of the very command its condition reads, and so does a fresh T(build) plant (off T: an exit code and a 16-hex hash of the
// output's folded SHAPE, never a line). The assert RIDES only if Z's refusal / run is CLEAN (no throw signature, not empty) AND its
// shape and exit equal T's — the same answer the full state gives; else it is VACUOUS (it passes for another cause).
const THROWN = /\bError:|ENOENT|registry: no live|EMPTY\/unreachable|\bat [\w.<>]+ \(|\.mjs:\d+:\d+|Cannot read properties/;
const rowsOut = [];
for (const k of blocked) {
  const a = find(z1.rows, k.key, "Z"), b = find(z2.rows, k.key, "Z"), t = find(tb.rows, k.key, "T"), tt = find(tB.rows, k.key, "T");
  const v = (x) => x.length ? (x.every((r) => r.v === "ok") ? "ok" : x.some((r) => r.v === "BLOCKED") ? "BLOCKED" : "FAIL") : "unreached";
  const name = (a[0] || b[0] || { name: k.key }).name;
  const line = srcLine(name);
  let cls, why;
  const tv = v(t);
  if (v(a) !== v(b)) { cls = "NOT-DECIDABLE"; why = `the two Z(build) runs disagree: ${v(a)} / ${v(b)}`; }
  else if (tv !== "ok") { cls = "NOT-DECIDABLE"; why = `red on T(base) too (${tv}): the fresh clone's tracked state does not judge it green (mlaw2 §9 N2)`; }
  else if (v(a) === "ok") {
    const zDigits = (a[0].name.match(/\d+/g) || []).map(Number);
    const zero = zDigits.includes(0) && fold(a[0].name).slice(0, 90) === t[0].name;
    const sh = shapeOf(line);
    if (zero) { cls = "VACUOUS"; why = "zero-subject: a digit run in its Z name is 0 (T's folded name is the same)"; }
    else if (sh) { cls = "PROBE"; why = sh; }
    else { cls = "RIDES"; why = "ok on both Z(build) runs and on T; its condition reads more than an exit code (not exit-only, not a lone negative test), not zero-subject"; }
  } else { cls = "NEEDS-FIXTURE"; const me = a.find((r) => r.detail) || a[0]; const det = (me && me.detail) || "";
    const guard = v(a) === "BLOCKED" ? z1.rows.find((r) => r.v === "FAIL" && r.name.startsWith("BLOCKED BY ITS INPUT") && r.name.includes(det)) : null;
    let input = inputOf(`${det} ${(guard && guard.detail) || ""}`), via = null;
    if (!input.files.length && !input.table) {   // named nowhere in its own detail: the block's earlier red that names one
      const idx = z1.rows.indexOf(me), blk = blockOf(line);
      const up = z1.rows.slice(0, idx).reverse().find((r) => r.v !== "ok" && r.detail && blk && blockOf(srcLine(r.name)) === blk && (inputOf(r.detail).files.length || inputOf(r.detail).table));
      if (up) { input = inputOf(up.detail); via = fold(up.name).slice(0, 90); }
    }
    const own = !via && (input.files.length > 0 || !!input.table);
    why = { verdict: v(a), input, input_from: own ? "its own detail (the guard's line for a BLOCKED one)" : via ? "INFERRED: the nearest earlier red of its block that names an input" : "named nowhere", ...(via ? { via_earlier_red_of_its_block: via } : {}), detail: det.slice(0, 300) }; }
  rowsOut.push({ base_line: k.line, build_line: line, block: blockOf(line), key: k.key, cls, Z1: v(a), Z2: v(b), T_base: tv, T_build: v(tt), why, ...(v(a) === "ok" || v(a) === "unreached" ? {} : {}) });
}
const probed = rowsOut.filter((r) => r.cls === "PROBE");
// a NEEDS-FIXTURE row whose own detail names no input is probed too: the first `<call>.out|.code` (or `<var>.out|.code`) its
// condition reads prints its output, and THAT names the input (a guess from the block's earlier red is kept only as a fallback)
const unnamed = rowsOut.filter((r) => r.cls === "NEEDS-FIXTURE" && !/^its own/.test(r.why.input_from) && r.build_line);
const OPERAND = /(\b[A-Za-z_]\w*\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)|\b[A-Za-z_]\w*)\.(out|code)\b/;
if (probed.length || unnamed.length) {
  const patch = (txt) => { const L = txt.split("\n");
    for (const r of [...probed, ...unnamed]) { const i = r.build_line - 1; let j = i; while (j < L.length - 1 && !/\);\s*$/.test(L[j])) j++;
      let span = L.slice(i, j + 1).join("\n");
      if (r.cls === "PROBE") span = span.replace(/((?:[\w.]+(?:\((?:[^()]|\([^()]*\))*\))?))\.code !== 0/, `__probe(${r.build_line}, $1).code !== 0`)
        .replace(/\.test\(([\w.]+\((?:[^()]|\([^()]*\))*\))\.out\)/, `.test(__probe(${r.build_line}, $1).out)`);
      else { const q = span.search(/["`]\s*,/); if (q >= 0) span = span.slice(0, q + 2) + span.slice(q + 2).replace(OPERAND, (m0, x, k) => `__probe(${r.build_line}, ${x}).${k}`); }
      L.splice(i, j - i + 1, ...span.split("\n")); }
    return L.join("\n").replace("\nconst HERE = dirname", '\nconst __probe = (n, r) => { console.log(`PROBE ${n} exit ${r.code} ${JSON.stringify(String(r.out))}`); return r; };\nconst HERE = dirname'); };
  const zp = await laws(BUILD, "Z", patch), tp = await laws(BUILD, "T", patch);
  for (const r of unnamed) { const p = zp.probes.find((x) => x.line === r.build_line); if (!p) { r.why.probe = "printed nothing"; continue; }
    const named = inputOf(p.out); r.why.probe = `exit ${p.exit} · ${p.out.slice(0, 240)}`;
    if (named.files.length || named.table) {
      if (named.row_cut && r.why.input.row) { named.row = r.why.input.row; named.row_inferred = `from the block's earlier red: ${r.why.via_earlier_red_of_its_block || "(none)"}`; }
      r.why.input = named; if (!named.row_inferred) delete r.why.via_earlier_red_of_its_block; r.why.input_from = "the probe: the output of the command its condition reads"; }
    else r.why.input_from += " (its own command's output, probed, names none)"; }
  for (const r of probed) { const p = zp.probes.find((x) => x.line === r.build_line), q = tp.probes.find((x) => x.line === r.build_line); const shape = r.why;
    const clean = !!p && !THROWN.test(p.out) && p.out.trim().length > 0 && (shape === "exit-only" ? p.exit !== "0" : p.exit === "0");
    const same = !!p && !!q && p.h === q.h && p.exit === q.exit;
    r.cls = clean && same ? "RIDES" : "VACUOUS";
    r.why = p ? `${shape}, probed on a fresh Z(build) and T(build): Z exit ${p.exit}${q ? ` · T exit ${q.exit}` : " · T printed no probe"} · ${!clean ? "Z NOT clean: its output carries a throw signature or is empty, so the assert passes on the absent input"
      : same ? "a CLEAN " + (shape === "exit-only" ? "refusal" : "run") + " whose output SHAPE equals T's (the same answer the full state gives)" : "clean on Z, but its output SHAPE differs from T's: it answers for another cause (the absent input upstream), not for its law"} · Z out: ${p.out.slice(0, 200)}` : `${shape}, and the probe printed nothing for it`; }
  runs.push({ sha: tp.sha, side: "T+probe", exit: tp.exit, head: tp.head, ok: tp.rows.filter((r) => r.v === "ok").length, fail: tp.rows.filter((r) => r.v === "FAIL").length, blocked: tp.rows.filter((r) => r.v === "BLOCKED").length });
  runs.push({ sha: zp.sha, side: "Z+probe", exit: zp.exit, head: zp.head, ok: zp.rows.filter((r) => r.v === "ok").length, fail: zp.rows.filter((r) => r.v === "FAIL").length, blocked: zp.rows.filter((r) => r.v === "BLOCKED").length });
}
mkdirSync(OUTD, { recursive: true });
writeFileSync(join(OUTD, "runs.jsonl"), runs.map((r) => JSON.stringify(r)).join("\n") + "\n");
writeFileSync(join(OUTD, "blocked.jsonl"), rowsOut.map((r) => JSON.stringify(r)).join("\n") + "\n");
const by = (c) => rowsOut.filter((r) => r.cls === c).length;
const summary = [
  `mbare re-census ${BASE.slice(0, 7)} → ${BUILD.slice(0, 7)} (laws, FULL profile, planted trees; node ${process.version} ${process.platform})`,
  `LIVE_ASSERTS at base: ${keys.length} · judged by laws on T(base): ${keys.filter((k) => find(tb.rows, k.key, "T").length).length} · base throw: ${throwRow ? `registry row "${throwRow}"` : "none"} · its block's own asserts: ${ownNames.length}`,
  ...runs.map((r) => `run ${r.side}(${r.sha.slice(0, 7)}) exit ${r.exit} · ok ${r.ok} · FAIL ${r.fail} · BLOCKED ${r.blocked} · ${r.head}`),
  `mbare re-census: ${rowsOut.length} BLOCKED asserts at base · RIDES ${by("RIDES")} · NEEDS-FIXTURE ${by("NEEDS-FIXTURE")} · VACUOUS ${by("VACUOUS")} · NOT-DECIDABLE ${by("NOT-DECIDABLE")}`,
];
writeFileSync(join(OUTD, "SUMMARY.txt"), summary.join("\n") + "\n");
console.log(summary.join("\n"));
