// ============================================================================
// livenarrow.mjs — unit mgat (forks row 1174 (2)): mf2's F3 RE-STATED AS ITS PROPERTY — THE LIVE SET NEVER WITHHOLDS MORE.
//   (the snapshot class of forks row 1154: a clause that froze a SNAPSHOT of the base's live names is re-cut as the property it
//   was guarding.) Imported by witness_mf2.mjs; pure (no file, no process, no clock) except narrowsOf, which reads source TEXT.
// CONTRACT: liveNarrow({ baseLive, headLive, baseCount, headCount, narrows })
//   baseLive / headLive  the folded LIVE names each hermetic run printed
//   baseCount / headCount the LIVE count on each hermetic headline (null = no headline)
//   narrows               the HEAD tree's own declaration, scripts/organism_test.mjs LIVE_NARROWS: new LIVE name → the base
//                         LIVE name it narrows (read by narrowsOf from that tree's source, never typed here)
//   GREEN iff  headCount ≤ baseCount, and every name LIVE at head but not at the base is ADMITTED: the tree declares the base
//              name it narrows, that partner WAS live at the base, it is GONE at head, and no partner is claimed twice.
//   RED        a count that rose, or a new LIVE name with no declared partner, a partner never live at the base, a partner
//              still live at head, or a partner claimed by two names (the live set would then withhold more).
// SELFTEST: node ci/mf2/livenarrow.mjs selftest  (each rule planted both ways; last line `livenarrow selftest: n of n`).
// ============================================================================
const fold = (n) => String(n).replace(/\d+/g, "#");
/** the LIVE_NARROWS table of one tree's scripts/organism_test.mjs source text (absent → {}) @param {string} src */
export function narrowsOf(src) {
  const i = src.indexOf("const LIVE_NARROWS = Object.freeze({");
  if (i < 0) return {};
  const tbl = src.slice(i, src.indexOf("});", i));
  return Object.fromEntries([...tbl.matchAll(/^\s*"((?:[^"\\]|\\.)*)":\s*"((?:[^"\\]|\\.)*)"/gm)].map((m) => [m[1], m[2]]));
}
/** @param {{ baseLive: string[], headLive: string[], baseCount: number|null, headCount: number|null, narrows: Record<string,string> }} a */
export function liveNarrow({ baseLive, headLive, baseCount, headCount, narrows }) {
  const N = Object.fromEntries(Object.entries(narrows || {}).map(([k, v]) => [fold(k), fold(v)]));
  const extra = headLive.filter((n) => !baseLive.includes(n));
  const admitted = [], refused = [], used = new Set();
  for (const n of extra) {
    const p = N[n];
    const why = !p ? "no narrowed partner declared" : !baseLive.includes(p) ? `its partner "${p}" was not LIVE at the base`
      : headLive.includes(p) ? `its partner "${p}" is still LIVE at head` : used.has(p) ? `its partner "${p}" is claimed twice` : null;
    if (why) refused.push(`${n} (${why})`); else { used.add(p); admitted.push(`${n} ← ${p}`); }
  }
  const countOk = headCount !== null && baseCount !== null && headCount <= baseCount;
  return { ok: countOk && refused.length === 0, countOk, extra, admitted, refused };
}
export const narrowLine = (r) => `admitted (narrows a base name now gone): ${r.admitted.length ? r.admitted.join(" · ") : "none"} · refused: ${r.refused.length ? r.refused.join(" · ") : "none"}`;

if (process.argv[2] === "selftest") {
  let n = 0, k = 0; const t = (name, cond) => { n++; if (cond) k++; console.log(`  ${cond ? "ok  " : "FAIL"} ${name}`); };
  const B = ["MODE gates", "MODE lawpack"], C = 2;
  t("RED · a new LIVE name with no narrowed partner", !liveNarrow({ baseLive: B, headLive: ["gates schema half", "MODE lawpack"], baseCount: C, headCount: C, narrows: {} }).ok);
  t("GREEN · the same name, declared as narrowing a base name that is gone at head", liveNarrow({ baseLive: B, headLive: ["gates schema half", "MODE lawpack"], baseCount: C, headCount: C, narrows: { "gates schema half": "MODE gates" } }).ok);
  t("RED · the declared partner is still LIVE at head (the set grew)", !liveNarrow({ baseLive: B, headLive: ["gates schema half", "MODE gates", "MODE lawpack"], baseCount: C, headCount: C, narrows: { "gates schema half": "MODE gates" } }).ok);
  t("RED · the declared partner was never LIVE at the base", !liveNarrow({ baseLive: ["MODE lawpack"], headLive: ["gates schema half", "MODE lawpack"], baseCount: C, headCount: C, narrows: { "gates schema half": "MODE gates" } }).ok);
  t("RED · two new names claim one partner", !liveNarrow({ baseLive: B, headLive: ["a half", "b half", "MODE lawpack"], baseCount: C, headCount: C, narrows: { "a half": "MODE gates", "b half": "MODE gates" } }).ok);
  t("RED · the headline LIVE count rose", !liveNarrow({ baseLive: B, headLive: B, baseCount: C, headCount: C + 1, narrows: {} }).ok);
  t("RED · no headline", !liveNarrow({ baseLive: B, headLive: B, baseCount: null, headCount: C, narrows: {} }).ok);
  t("GREEN · nothing new, count equal", liveNarrow({ baseLive: B, headLive: B, baseCount: C, headCount: C, narrows: {} }).ok);
  t("narrowsOf reads the table from source text, and an absent table is {}", narrowsOf('const LIVE_NARROWS = Object.freeze({\n  "x half": "MODE x",\n});\n')["x half"] === "MODE x" && Object.keys(narrowsOf("nothing")).length === 0);
  console.log(`livenarrow selftest: ${k} of ${n}`); process.exitCode = k === n ? 0 : 1;
}
