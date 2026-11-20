// unit mgat · THE PROPOSED CODE PATH as exact edits (each `from` must match ONCE in the base file, or the build refuses).
// A spec seat builds nothing on a branch: these edits are applied only to a temp tree under os.tmpdir() by witness.mjs.
// MUTANTS: each undoes ONE clause's reason, so its clause must turn RED on the build.
import { readFileSync, writeFileSync } from "node:fs"; import { join } from "node:path";

const C = "  try { lock.closeAllConnections && lock.closeAllConnections(); } catch { }\n      try { lock.close(); } catch { }\n";
export const EDITS = [
  { id: "S1", file: "scripts/groundsman.mjs",
    from: "} finally { try { rmSync(idx, { force: true }); } catch {} }",
    to: "} finally { try { rmSync(idx, { force: true }); } catch { /* the private index under os.tmpdir(): force covers ENOENT, and any other failure leaves one temp file — the push result above is already decided */ } }" },
  { id: "S2S3-fn", file: "scripts/cortex.mjs",
    from: "  function retireIfArmed() {\n",
    to: "  // unit mgat: the ONE lock release, called by both retire paths (the copy in the keeper's retire callback was\n  // re-typed without this reason beside it). The OS frees the port on exit regardless; these two are tidiness, and\n  // closeAllConnections is what stops a keep-alive socket from holding close() open.\n  function releaseLock() {\n    try { lock.closeAllConnections && lock.closeAllConnections(); } catch { }\n    try { lock.close(); } catch { }\n  }\n  function retireIfArmed() {\n" },
  { id: "S2S3-a", file: "scripts/cortex.mjs",
    from: "      // The OS frees the port on exit regardless; these two are tidiness, and\n      // closeAllConnections is what stops a keep-alive socket from holding close()\n      // open. No wait, no timeout — an exit that needs a deadline is a hang.\n    " + C,
    to: "      // No wait, no timeout — an exit that needs a deadline is a hang (releaseLock's header says why the release is tidiness).\n      releaseLock();\n" },
  { id: "S2S3-b", file: "scripts/cortex.mjs",
    from: "retire: () => { exiting = true; try { lock.closeAllConnections && lock.closeAllConnections(); } catch { } try { lock.close(); } catch { } process.exit(KEEP_EXIT.RETIRED); } });",
    to: "retire: () => { exiting = true; releaseLock(); process.exit(KEEP_EXIT.RETIRED); } });" },
  { id: "S4", file: "scripts/captains_call.mjs",
    from: "try { o.push(JSON.parse(l)); } catch { } } return o; };\n// The ONE disk door",
    to: "try { o.push(JSON.parse(l)); } catch { /* a torn tail never parses and the cursor stays before it (seatGradeCursor); a merged line drops a settled row, so its card stays LIVE — the safe side */ } } return o; };\n// The ONE disk door" },
  { id: "S5", file: "scripts/captains_call.mjs",
    from: "if (!n) break; got += n; } } catch { } finally {",
    to: "if (!n) break; got += n; } } catch { /* a short read: readGradeQueueSince's anchor-length check falls back to ONE whole read */ } finally {" },
  { id: "S6", file: "scripts/captains_call.mjs",
    from: "if (fd !== null) { try { closeSync(fd); } catch { } } }",
    to: "if (fd !== null) { try { closeSync(fd); } catch { /* opened above, closed only here: EBADF is the one way in, and a finally has nothing to hand back */ } } }" },
  { id: "LIVE", file: "scripts/organism_test.mjs",
    from: "  gates: \"validates every schema-d file of dressing-room/state (ajv) and reads state/laws_register.json\",\n",
    to: "" },
  { id: "HALF", file: "scripts/organism_test.mjs",
    from: "  const r = run([join(ROOT, \"scripts\", \"gates.mjs\"), \"report\"], { timeout: 600000 });\n",
    to: "  // unit mgat: the hermetic profile runs the STATE-FREE half — `gates.mjs lint` (tsc + eslint), whose output was byte-identical\n  // with the state folder absent, empty and tracked-present (ci/mgat/MGAT_SPEC.md §3). The ajv half validates his state files: LIVE, named.\n  const half = PROFILE === \"hermetic\";\n  if (half) liveNamed(\"gates schema half\", \"validates every schema-d file of dressing-room/state (ajv); the tsc + eslint half runs\");\n  const r = run([join(ROOT, \"scripts\", \"gates.mjs\"), half ? \"lint\" : \"report\"], { timeout: 600000 });\n" },
  // forks row 1156 (1) FK1 B — scripts/rung_receipt.mjs, the unit's fifth file: the two other counts of the same gate, risen by
  // the same cause (a landing that did not read the gate). Each site's fate by measurement (PROOF.md §8).
  { id: "RR-sep", file: "scripts/rung_receipt.mjs",
    from: "import { join, dirname, resolve, relative, isAbsolute, basename, sep } from \"node:path\";",
    to: "import { join, dirname, resolve, relative, isAbsolute, basename } from \"node:path\";" },
  { id: "RR-rowsha", file: "scripts/rung_receipt.mjs",
    from: "export function rowSha(row) { const { row_sha256, ...rest } = row; return sha256(String(row.prev_sha256) + canon(rest)); }",
    to: "export function rowSha(row) { const rest = { ...row }; delete rest.row_sha256; return sha256(String(row.prev_sha256) + canon(rest)); }" },
  { id: "RR-red", file: "scripts/rung_receipt.mjs",
    from: "    const row = append(path, rr, { kind: \"red\", key,",
    to: "    append(path, rr, { kind: \"red\", key," },
  { id: "RR-ts", file: "scripts/rung_receipt.mjs",
    from: "  if (!sd.ok) return { code: 1, lines: [`rung_receipt: REFUSED · ${sd.why}`] };\n",
    to: "  // `=== false`, not `!sd.ok`: tsconfig.json keeps strict off, and without strictNullChecks a negation does not narrow a\n  // true/false discriminant, so `sd.why` read as absent (TS2339). The equality narrows; the behaviour is the same.\n  if (sd.ok === false) return { code: 1, lines: [`rung_receipt: REFUSED · ${sd.why}`] };\n" },
  // forks row 1174 (1) — unit ms1's five rises in scripts/organism_test.mjs (f052188, 0b3f8a8), the gate read hermetically for the first
  // time by this unit's LIVE exit. Each empty catch gets its HANDLING (no ignore comment); the type diagnostic is repaired at its cause.
  { id: "MS-proc", file: "scripts/organism_test.mjs",
    from: "    try { if (readFileSync(`/proc/${p}/cmdline`, \"utf8\").replace(/\\0/g, \" \").includes(dir)) out.push(Number(p)); } catch {}\n",
    to: "    let cmd;\n    try { cmd = readFileSync(`/proc/${p}/cmdline`, \"utf8\"); } catch { continue; }   // that process exited between readdir and the read: it names nothing\n    if (cmd.replace(/\\0/g, \" \").includes(dir)) out.push(Number(p));\n" },
  { id: "MS-kill", file: "scripts/organism_test.mjs",
    from: "      for (const p of namingProcs(tmp)) { try { process.kill(p); } catch {} }\n",
    to: "      for (const p of namingProcs(tmp)) { try { process.kill(p); } catch (e) { if (e && e.code !== \"ESRCH\") console.log(`  witness ‹${unit}› · survivor ${p} not killed (${e.code || e.message})`); } }\n" },
  { id: "MS-code", file: "scripts/organism_test.mjs",
    from: "const killed = !!(r.error && /ETIMEDOUT/.test(String(r.error.code || r.error.message)))",
    to: "const killed = !!(r.error && /ETIMEDOUT/.test(String((\"code\" in r.error ? r.error.code : \"\") || r.error.message)))" },
  { id: "MS-unlink", file: "scripts/organism_test.mjs",
    from: "      for (const t of [\"org\", \"base\"]) { try { unlinkSync(join(tmp, t, \"node_modules\")); } catch {} }\n",
    to: "      for (const t of [\"org\", \"base\"]) { try { unlinkSync(join(tmp, t, \"node_modules\")); } catch (e) { if (e && e.code !== \"ENOENT\") console.log(`  witness ‹${unit}› · the node_modules link in ${t} was not removed (${e.code || e.message})`); } }\n" },
  { id: "MS-rm", file: "scripts/organism_test.mjs",
    from: "      try { rmSync(tmp, { recursive: true, force: true }); } catch {}\n",
    to: "      try { rmSync(tmp, { recursive: true, force: true }); } catch (e) { console.log(`  witness ‹${unit}› · temp dir ${tmp} left behind (${e.code || e.message})`); }\n" },
];

// one mutant per witness clause (see MGAT_SPEC.md §5)
export const MUTANTS = {
  M1: { why: "S1 left undeclared", drop: ["S1"] },
  M2: { why: "S5's declaring comment stripped back to catch { }", drop: ["S5"] },
  M3: { why: "gates put back in LIVE_MODES", drop: ["LIVE"] },
  M4: { why: "the hermetic half runs report (the ajv half reads state) instead of lint", patch: [["half ? \"lint\" : \"report\"", "half ? \"report\" : \"report\""]] },
  M5: { why: "the schema half is no longer named LIVE", patch: [["  if (half) liveNamed(\"gates schema half\"", "  if (false) liveNamed(\"gates schema half\""]] },
  M6: { why: "the retire callback re-types the release inline", drop: ["S2S3-b"] },
  M7: { why: "the hermetic gates mode returns before it runs the gate", patch: [["  const half = PROFILE === \"hermetic\";\n", "  const half = PROFILE === \"hermetic\";\n  if (half) return;\n"]] },
  M8: { why: "rung_receipt's unused sep import left in (no-unused-vars rises by one)", drop: ["RR-sep"] },
  M9: { why: "rung_receipt's negation left in (the TS2339 diagnostic returns)", drop: ["RR-ts"] },
  M10: { why: "ms1's /proc read catch left empty (no-empty rises by one)", drop: ["MS-proc"] },
  M11: { why: "ms1's r.error.code left unnarrowed (the TS2339 diagnostic returns)", drop: ["MS-code"] },
};

/** apply EDITS (minus a mutant's drops, plus its patches) inside tree d */
export function applyBuild(d, mutant = null) {
  const m = mutant ? MUTANTS[mutant] : {};
  const byFile = {};
  for (const e of EDITS) {
    if ((m.drop || []).includes(e.id)) continue;
    const p = join(d, e.file); const src = byFile[e.file] ?? readFileSync(p, "utf8");
    const n = src.split(e.from).length - 1;
    if (n !== 1) throw new Error(`build: edit ${e.id} matched ${n} times in ${e.file} (must be exactly 1)`);
    byFile[e.file] = src.replace(e.from, () => e.to);
  }
  for (const [from, to] of m.patch || []) {
    const f = Object.keys(byFile).find((k) => byFile[k].includes(from));
    if (!f) throw new Error(`build: mutant ${mutant} patch did not match`);
    byFile[f] = byFile[f].replace(from, () => to);
  }
  for (const [f, s] of Object.entries(byFile)) writeFileSync(join(d, f), s);
  return Object.keys(byFile);
}
