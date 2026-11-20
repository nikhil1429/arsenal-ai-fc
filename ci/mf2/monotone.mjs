// ============================================================================
// monotone.mjs — unit mrf (forks row 1120 (2) F-1 C · row 1120 (4)): THE MONOTONE RULE that mf2's F2 and F4 read.
// CONTRACT: monotone(base, build) over two member lists [[verdict "ok"|"FAIL", folded name], …] (the witness's own fold).
//   A member is a (name, occurrence) pair: the k-th time a folded name is judged in a run is its k-th occurrence.
//   red    · vanished — a base occurrence the build does not judge at all
//          · moved    — a base occurrence judged ok that the build judges FAIL
//   named  · added    — a build occurrence beyond the base's count of that name (any verdict): a member some unit ADDED
//          · gained   — a base occurrence judged FAIL that the build judges ok
//   Additions and FAIL → ok are NAMED in the clause line and never red (the spec's form (C)); nothing else is read.
// Pure: no file, no process, no clock. Imported by witness_mf2.mjs and planted both ways by ci/mrf/witness_mrf.mjs.
// ============================================================================
/** @param {[string, string][]} base @param {[string, string][]} build */
export function monotone(base, build) {
  const occ = (list) => { const m = new Map(); for (const [v, n] of list) { if (!m.has(n)) m.set(n, []); m.get(n).push(v); } return m; };
  const B = occ(base), O = occ(build);
  const vanished = [], moved = [], added = [], gained = [];
  for (const [n, vs] of B) {
    const ws = O.get(n) || [];
    vs.forEach((v, k) => {
      if (k >= ws.length) vanished.push(n);
      else if (v === "ok" && ws[k] === "FAIL") moved.push(n);
      else if (v === "FAIL" && ws[k] === "ok") gained.push(n);
    });
  }
  for (const [n, ws] of O) { const have = (B.get(n) || []).length; for (let k = have; k < ws.length; k++) added.push(`${ws[k]} ${n}`); }
  return { ok: base.length > 0 && vanished.length === 0 && moved.length === 0, vanished, moved, added, gained };
}
/** one clause line's tail, every list named @param {ReturnType<typeof monotone>} r */
export const monoLine = (r) => {
  const l = (xs) => (xs.length ? `${xs.length}: ${xs.map((x) => x.slice(0, 70)).join(" · ")}` : "none");
  return `vanished ${l(r.vanished)} · ok→FAIL ${l(r.moved)} · added (named, never red) ${l(r.added)} · FAIL→ok (named) ${l(r.gained)}`;
};
