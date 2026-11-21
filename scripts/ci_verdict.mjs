#!/usr/bin/env node
// @ts-check
// ============================================================================
// ci_verdict.mjs · ARSENAL AI FC — THE NEUTRAL VERDICT, READ AND JUDGED (unit B1, 18 Nov 2026)
//   SOLE WRITER of: NOTHING. It prints; it never writes a file, never touches state.
// ----------------------------------------------------------------------------
// WHY IT EXISTS. suite.yml ran 220 times with 0 successes: a red that is red on EVERY push says
// nothing about the push. The verdict here is NEUTRAL: a push is GREEN when no member is red that
// is not already red at its merge base, and every base red is NAMED (never hidden, never fixed by
// silence). Two halves, one file, so the judge and the reader can never disagree on the format:
//   · compare — the CI half. Reads two `organism_test.mjs` outputs (the head tree and the merge
//     base, both measured by the HEAD's instrument), prints ONE workflow annotation per red (new
//     reds as errors, base reds as warnings; GitHub renders 10 per level per step, so a tenth
//     annotation carries every red past the ninth — none is dropped), then ONE verdict annotation,
//     and exits 0 GREEN / 1 RED.
//   · <sha> — the reader. ONE verdict line for a commit in AT MOST 3 ANONYMOUS API CALLS (the
//     anonymous limit is about 60 an hour, so it NEVER polls): 1 · the commit's check runs,
//     2-3 · the annotations of the two `npm test · node N` legs. No token is ever sent.
//   · selftest — every pure part on fixtures, and the reader on a planted fetch (no network).
// A red is identified by its assert NAME with digit runs folded ("all 122 organs" and "all 123
// organs" are one member): a tree that gains a file must not turn an old red into a new one.
// Annotations carry NAMES only — never a detail line, which can quote a state file. UNIT mdtl (forks row 1186 F1 A · F2 R2):
// a NEW witness red also carries its CAUSE inside its own NEW RED message and the verdict payload (`cause`), and only a
// cause that verifyCause (scripts/witness_cause.mjs) rebuilds byte for byte from the witness's own tracked source or a
// member literal; anything else is WITHHELD. No annotation is added; a GREEN head's output is byte-identical to before.
// MODES: compare · selftest · <sha>
// CLI: node scripts/ci_verdict.mjs <sha> [--repo owner/name]
//      node scripts/ci_verdict.mjs compare --head <file> --base <file> --label <l> [--head-sha s] [--base-sha s] [--base-instrument f]
// ============================================================================
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { verifyCause, sourcePaths } from "./witness_cause.mjs";

const DEFAULT_REPO = "nikhil1429/arsenal-ai-fc";
const VERDICT_TITLE = "B1 VERDICT";
const LEG = /^npm test · node (\d+)$/;
const LAWPACK_LINE = "ORGANISM_TEST_LAWPACK";   // organism_test.mjs's law pack machine line (unit mlaw, forks row 1137 (2) F3 A)

/** lawpack.mjs's frozen BASELINE, read from that file (its own export), or null when it cannot be read
 *  @returns {Promise<Record<string, number> | null>} */
export async function frozenBaseline(href = new URL("./lawpack.mjs", import.meta.url).href) {
  try {
    const b = (await import(href)).BASELINE;
    return b && typeof b === "object" && Object.values(b).every((v) => Number.isSafeInteger(v)) ? { ...b } : null;
  } catch { return null; }
}

/** the machine line organism_test.mjs prints, parsed; null when the run never reached it (no headline)
 *  @param {string} text @returns {{ pass: number, fail: number, reds: string[], live: string[], profile: string, lawpack: Record<string, number> | null, causes: string[] } | null} */
export function parseSuite(text) {
  const line = String(text).split(/\r?\n/).find((l) => l.startsWith("ORGANISM_TEST_VERDICT "));
  if (!line) return null;
  let j = null;
  try { j = JSON.parse(line.slice("ORGANISM_TEST_VERDICT ".length)); } catch { return null; }
  if (!j || !Array.isArray(j.reds)) return null;
  return { pass: Number(j.pass) || 0, fail: Number(j.fail) || 0, reds: j.reds.map(String), live: Array.isArray(j.live) ? j.live.map(String) : [], profile: String(j.profile || "full"), lawpack: parseLawpack(text),
    causes: Array.isArray(j.causes) ? j.causes.map(String) : [] };
}

/** THE LAW PACK'S COUNTS (unit mlaw, forks row 1137 (2) F3 A): organism_test.mjs's `ORGANISM_TEST_LAWPACK {"<law>":<n>,…}` line,
 *  or null when the run printed none (a base older than mlaw, or a run that never reached the law pack's gate)
 *  @param {string} text @returns {Record<string, number> | null} */
export function parseLawpack(text) {
  const line = String(text).split(/\r?\n/).find((l) => l.startsWith(`${LAWPACK_LINE} `));
  if (!line) return null;
  let j = null;
  try { j = JSON.parse(line.slice(LAWPACK_LINE.length + 1)); } catch { return null; }
  if (!j || typeof j !== "object" || Array.isArray(j)) return null;
  /** @type {Record<string, number>} */ const c = {};
  for (const [k, v] of Object.entries(j)) if (Number.isSafeInteger(v) && v >= 0) c[k] = v;
  return c;
}

/** A RISE IS A NEW RED, BY NUMBER (unit mlaw, forks row 1137 (2) F3 A). A law already over its baseline that rises again carries
 *  the SAME folded assert name on both sides, so by name it is "a base red" forever (ci/mlaw/MLAW_SPEC.md §1.5). Here every law
 *  whose count is higher at the head than at the merge base is a NEW red named by law and numbers. The base's count is its own
 *  machine line; a base with NO such line is compared against `baseline` — lawpack.mjs's frozen BASELINE, read from that file by
 *  the caller, never typed. A law the base does not count compares against the baseline's, else 0 (nothing is grandfathered).
 *  Stricter only: an equal or a lower count adds nothing. No head line ⇒ nothing to judge; a base with no line and no readable
 *  baseline is itself a NEW red (never GREEN by absence).
 *  @param {Record<string, number> | null | undefined} headLp @param {Record<string, number> | null | undefined} baseLp
 *  @param {Record<string, number> | null} [baseline] @returns {string[]} */
export function lawpackRises(headLp, baseLp, baseline = null) {
  if (!headLp) return [];
  if (!baseLp && !baseline) return [`LAW PACK BASELINE UNREADABLE · the base printed no ${LAWPACK_LINE} line and scripts/lawpack.mjs's BASELINE could not be read`];
  const out = [];
  for (const [law, h] of Object.entries(headLp)) {
    const b = baseLp && law in baseLp ? baseLp[law] : baseline && Number.isSafeInteger(baseline[law]) ? baseline[law] : 0;
    if (h > b) out.push(`LAW PACK ROSE · ${law} ${b} → ${h}${baseLp ? "" : " (the base printed no law pack line: against lawpack.mjs BASELINE)"}`);
  }
  return out;
}

/** a member's identity across two trees: its name with every digit run folded @param {string} n */
// F4 A (unit ms1, forks row 1066): the text inside ‹ › is a UNIT NAME and keeps its digits — mlv0 and mlv1, mjd3/mjd4/mjd5,
// mf2 and mf4 are distinct members; every digit run outside ‹ › still folds.
export const keyOf = (n) => String(n).split(/(‹[^›]*›)/).map((p, i) => (i % 2 ? p : p.replace(/\d+/g, "#"))).join("").replace(/\s+/g, " ").trim();

/** the neutral verdict: GREEN iff every head red is red at the base too
 *  @param {ReturnType<typeof parseSuite>} head @param {ReturnType<typeof parseSuite>} base */
/** THE INSTRUMENT'S OWN NEW MEMBERS (B1 witness, 18 Nov 2026). When the base is measured by the HEAD's organism_test.mjs
 *  (its own died before its machine line), an assert the head's instrument ADDED would be red on both sides and pass as
 *  "old" — the plant branch proved it: a planted red read GREEN. So, in that case, an assert whose literal opening is
 *  absent from the BASE's own organism_test.mjs source is a member the base never had, and its red is NEW. Per-member
 *  lines (`SUITE MEMBER · <organ> …`) judge the base tree's organs, not the instrument, and stay comparable.
 *  @param {string} name @param {string} baseSrc */
export function newInInstrument(name, baseSrc) {
  if (!baseSrc || /^SUITE MEMBER · /.test(name)) return false;
  const open = String(name).split(/(?<=[\s(])\d|[`'"$\\]/)[0];   // up to a standalone number (an interpolated count) or a quote
  if (open.length < 12) return false;   // too short to be a fingerprint: never call it new on a guess
  return !String(baseSrc).replace(/\r\n/g, "\n").includes(open);
}

/** @param {ReturnType<typeof parseSuite>} head @param {ReturnType<typeof parseSuite>} base @param {string} [baseSrc]
 *  @param {Record<string, number> | null} [baseline] lawpack.mjs's frozen BASELINE, for a base with no law pack line */
export function judge(head, base, baseSrc = "", baseline = null) {
  if (!head) return { v: "RED", why: "the head run produced no headline line", fresh: [], old: [], fixed: [] };
  if (!base) return { v: "RED", why: "the merge-base run produced no headline line (no base to compare against)", fresh: [...head.reds], old: [], fixed: [] };
  const baseKeys = new Set(base.reds.map(keyOf)), headKeys = new Set(head.reds.map(keyOf));
  const fresh = head.reds.filter((n) => !baseKeys.has(keyOf(n)) || newInInstrument(n, baseSrc));
  fresh.push(...lawpackRises(head.lawpack, base.lawpack, baseline));
  const old = head.reds.filter((n) => !fresh.includes(n));
  const fixed = base.reds.filter((n) => !headKeys.has(keyOf(n)));
  return { v: fresh.length ? "RED" : "GREEN", why: fresh.length ? `${fresh.length} member(s) red that are not red at the merge base` : "no member red that is not red at the merge base", fresh, old, fixed };
}

/** a workflow-command value, escaped per the spec (%, CR, LF) @param {string} s */
const esc = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const escProp = (s) => esc(s).replace(/:/g, "%3A").replace(/,/g, "%2C");

/** one annotation per name, the tenth carrying every name past the ninth (GitHub renders 10 per level per step)
 *  @param {"error"|"warning"|"notice"} level @param {string} title @param {string[]} names @param {number} [cap] */
export function annotate(level, title, names, cap = 10) {
  const out = [];
  const singles = names.length > cap ? names.slice(0, cap - 1) : names;
  singles.forEach((n, i) => out.push(`::${level} title=${escProp(`${title} ${i + 1}/${names.length}`)}::${esc(n)}`));
  if (names.length > cap) {
    const rest = names.slice(cap - 1);
    out.push(`::${level} title=${escProp(`${title} ${cap}-${names.length}/${names.length}`)}::${esc(rest.join("\n"))}`);
  }
  return out;
}

/** unit mdtl: the verified causes of every NEW red that owns one, { "<red name>": ["<ID> · <text>", …] } (empty when none)
 *  @param {string[]} fresh @param {string[]} causes @param {(unit: string) => string} readSrc */
export function causesFor(fresh, causes, readSrc) {
  /** @type {Record<string, string[]>} */
  const out = {};
  for (const l of causes) {
    const v = verifyCause(l, fresh, readSrc);
    if (v && !(out[v.member] || []).includes(v.cause)) (out[v.member] = out[v.member] || []).push(v.cause);
  }
  return out;
}

/** the witness source of <unit> in the tree this file sits in (the workspace on the neutral machine); "" when unreadable
 *  @param {string} unit */
export const workspaceSrc = (unit) => {
  for (const p of sourcePaths(unit)) { try { return readFileSync(new URL(`../${p}`, import.meta.url), "utf8"); } catch { /* the other spelling, then "" (unreadable = WITHHELD) */ } }
  return "";
};

/** every line `compare` prints, in order: the reds, then the ONE verdict annotation, then the plain verdict line.
 *  readSrc is the witness-source door (default: none, so every witness cause is WITHHELD; main passes workspaceSrc)
 *  @param {ReturnType<typeof parseSuite>} head @param {ReturnType<typeof parseSuite>} base @param {string} label
 *  @param {string} [headSha] @param {string} [baseSha] @param {string} [baseSrc] @param {Record<string, number> | null} [baseline]
 *  @param {(unit: string) => string} [readSrc] */
export function compareLines(head, base, label, headSha = "", baseSha = "", baseSrc = "", baseline = null, readSrc = () => "") {
  const j = judge(head, base, baseSrc, baseline);
  const lines = [];
  const cause = causesFor(j.fresh, head ? head.causes : [], readSrc);
  const shown = j.fresh.map((n) => (cause[n] ? [n, ...cause[n].map((c) => `cause · ${c}`)].join("\n") : n));
  lines.push(...annotate("error", `NEW RED · ${label}`, shown, j.v === "RED" ? 9 : 10));
  lines.push(...annotate("warning", `BASE RED · ${label}`, j.old));
  const payload = { v: j.v, label, head: headSha, base: baseSha, why: j.why, new: j.fresh, base_red: j.old.length, fixed: j.fixed.length,
    pass: head ? head.pass : null, fail: head ? head.fail : null, live: head ? head.live.length : null, profile: head ? head.profile : null,
    instrument: baseSrc ? "head (the base's own died before its machine line)" : "base", ...(Object.keys(cause).length ? { cause } : {}) };
  lines.push(`::${j.v === "GREEN" ? "notice" : "error"} title=${escProp(`${VERDICT_TITLE} · ${label}`)}::${esc(`B1_VERDICT ${JSON.stringify(payload)}`)}`);
  lines.push(`B1_VERDICT ${label} ${j.v} — ${j.why} · head ${headSha.slice(0, 7) || "?"} · base ${baseSha.slice(0, 7) || "?"} · ${j.fresh.length} new red · ${j.old.length} base red · ${j.fixed.length} base red now passing`);
  return { lines, verdict: j.v };
}

/** THE LEGS THE VERDICT NEEDS (unit mrdr, forks row 1022 (1)), DERIVED from their one owner (unit mlaw, forks row 1137 (1) F1 B):
 *  suite.yml's own job name line (`name: <prefix>${{ matrix.node }}`) and its matrix line (`node: [ … ]`), one leg per node. The
 *  typed copy this replaces was the law pack's jugad-literal-subject-list finding 91 (ci/mlaw/MLAW_SPEC.md §1.3 on claude/mlaw-spec).
 *  A suite.yml with no such lines derives NO leg, and the reader then answers NONE — never GREEN by an empty list.
 *  @param {string} yml @returns {string[]} */
export function legsOf(yml) {
  const t = String(yml).replace(/\r\n/g, "\n");
  const name = /^\s*name:\s*(.*?)\$\{\{\s*matrix\.node\s*\}\}\s*$/m.exec(t);
  const matrix = /^\s*node:\s*\[([^\]]*)\]/m.exec(t);
  if (!name || !matrix) return [];
  return matrix[1].split(",").map((s) => s.trim()).filter(Boolean).map((n) => `${name[1]}${n}`);
}
const SUITE_YML = new URL("../.github/workflows/suite.yml", import.meta.url);
export const REQUIRED_LEGS = Object.freeze(legsOf((() => { try { return readFileSync(SUITE_YML, "utf8"); } catch { return ""; } })()));

/** ONE run per leg NAME, the NEWEST (the highest id: a re-run or a second check suite on the same sha — a sha pushed to
 *  two branches — mints a later run), in REQUIRED_LEGS order; every required leg with no run is named in `missing`.
 *  Before mrdr the reader took the first two runs after a name sort, so a sha with two suites read node 22 TWICE and
 *  node 24 NEVER (measured on 2bed314, row 1022): a RED node 24 could read GREEN.
 *  @param {any[]} checkRuns @returns {{ legs: any[], missing: string[] }} */
export function pickLegs(checkRuns) {
  /** @type {Map<string, any>} */
  const newest = new Map();
  for (const r of checkRuns) {
    const name = String(r && r.name);
    if (!LEG.test(name)) continue;
    const cur = newest.get(name);
    if (!cur || Number(r.id) > Number(cur.id)) newest.set(name, r);
  }
  const legs = REQUIRED_LEGS.filter((n) => newest.has(n)).map((n) => newest.get(n));
  return { legs, missing: REQUIRED_LEGS.filter((n) => !newest.has(n)) };
}

/** the reader, in at most 3 calls. `get` is the one network door (planted in the selftest).
 *  @param {string} sha @param {string} repo @param {(path: string) => Promise<any>} get */
export async function readVerdict(sha, repo, get) {
  let calls = 0;
  const call = async (p) => { calls++; return get(p); };
  const runs = await call(`/repos/${repo}/commits/${sha}/check-runs?per_page=100`);
  const short = String(sha).slice(0, 7);
  const { legs, missing } = pickLegs((runs && runs.check_runs) || []);
  if (!legs.length) return { line: `ci_verdict ${short} NONE — no "npm test · node N" check run on this commit; missing ${missing.join(" · ")} (${calls} call)`, calls, v: "NONE" };
  if (missing.length) return { line: `ci_verdict ${short} PENDING — a required leg has no check run: missing ${missing.join(" · ")} (${calls} call; read again later, never poll; never GREEN without every leg)`, calls, v: "PENDING" };
  if (legs.some((r) => r.status !== "completed")) return { line: `ci_verdict ${short} PENDING — ${legs.map((r) => `${r.name}: ${r.status}`).join(" · ")} (${calls} call; read again later, never poll)`, calls, v: "PENDING" };
  const parts = [];
  let red = false;
  for (const leg of legs) {
    const anns = await call(`/repos/${repo}/check-runs/${leg.id}/annotations?per_page=100`);
    const vAnn = (Array.isArray(anns) ? anns : []).find((a) => String(a.title || "").startsWith(VERDICT_TITLE) && String(a.message || "").startsWith("B1_VERDICT "));
    let p = null;
    try { p = vAnn ? JSON.parse(String(vAnn.message).slice("B1_VERDICT ".length)) : null; } catch { p = null; }
    if (!p) { red = true; parts.push(`${leg.name}: RED (${leg.conclusion}; no verdict annotation — the run never reached its verdict) [run ${leg.id}]`); continue; }
    if (p.v !== "GREEN") red = true;
    const why = (n) => (p.cause && Array.isArray(p.cause[n]) && p.cause[n].length ? `${n} — cause: ${p.cause[n].join(" ; ")}` : n);   // unit mdtl
    parts.push(`${leg.name}: ${p.v} (base ${String(p.base).slice(0, 7)} · ${p.new.length} new red${p.new.length ? `: ${p.new.map(why).join(" ; ")}` : ""} · ${p.base_red} base red · ${p.live} live) [run ${leg.id}]`);
  }
  return { line: `ci_verdict ${short} ${red ? "RED" : "GREEN"} — ${parts.join(" | ")} (${calls} calls)`, calls, v: red ? "RED" : "GREEN" };
}

/** the anonymous network door: no token, ever @param {string} p */
async function anonymousGet(p) {
  const r = await fetch(`https://api.github.com${p}`, { headers: { Accept: "application/vnd.github+json", "User-Agent": "ci-verdict-reader" } });
  if (!r.ok) throw new Error(`GET ${p} answered ${r.status}`);
  return r.json();
}

function selftest() {
  let pass = 0, fail = 0;
  const ok = (name, cond) => { if (cond) pass++; else fail++; console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const suite = (reds, extra = {}) => `noise\nORGANISM_TEST_VERDICT ${JSON.stringify({ pass: 10, fail: reds.length, reds, live: ["L1"], profile: "hermetic", ...extra })}\n\norganism_test: 10 passed`;
  ok("parseSuite reads the machine line; a run with no machine line is null (no headline)", !!parseSuite(suite(["a"])) && parseSuite("organism_test: died") === null && parseSuite(suite(["a"]).replace(/\n/g, "\r\n")).reds[0] === "a");
  ok("keyOf folds digit runs: a tree that gains a file keeps an old red old", keyOf("all 122 organs parse") === keyOf("all 123 organs parse") && keyOf("A9 · x") !== keyOf("A8 · y"));
  ok("keyOf keeps a unit's digits inside ‹ › (F4 A): WITNESS ‹mlv0› and WITNESS ‹mlv1› are two members, a digit run outside ‹ › still folds",
    keyOf("WITNESS ‹mlv0› · GREEN at head against its BASE") !== keyOf("WITNESS ‹mlv1› · GREEN at head against its BASE")
    && keyOf("WITNESS ‹mf2› · 12 s") === keyOf("WITNESS ‹mf2› · 13 s") && keyOf("WITNESS ‹mjd3› · x") !== keyOf("WITNESS ‹mjd4› · x"));
  const wv = judge(parseSuite(suite(["WITNESS ‹mlv1› · GREEN at head against its BASE"])), parseSuite(suite(["WITNESS ‹mlv0› · GREEN at head against its BASE"])));
  ok("judge: a unit red at the head and ANOTHER unit red at the base is RED (one unit never hides behind its sibling)", wv.v === "RED" && wv.fresh.length === 1);
  const g = judge(parseSuite(suite(["all 121 x", "B"])), parseSuite(suite(["all 120 x", "B", "C"])));
  ok("judge: every head red red at the base too is GREEN, and a base red now passing is counted, never hidden", g.v === "GREEN" && g.old.length === 2 && g.fixed.length === 1 && g.fresh.length === 0);
  const r = judge(parseSuite(suite(["B", "PLANTED"])), parseSuite(suite(["B"])));
  ok("judge: a red absent at the base is RED BY NAME", r.v === "RED" && r.fresh.length === 1 && r.fresh[0] === "PLANTED");
  const src = 'assert("an old assert of the base · 1", x);';
  const h = judge(parseSuite(suite(["B1 PLANTED RED · new", "an old assert of the base · 2", "SUITE MEMBER · fsrs selftest exits 0"])), parseSuite(suite(["B1 PLANTED RED · new", "an old assert of the base · 2", "SUITE MEMBER · fsrs selftest exits 0"])), src);
  ok("judge: under the HEAD's instrument, an assert the base's own instrument never had is NEW even when red on both sides; an old assert and a per-member line stay old", h.v === "RED" && h.fresh.length === 1 && h.fresh[0] === "B1 PLANTED RED · new" && h.old.length === 2);
  ok("judge: no head headline is RED; no base headline is RED (no silent pass on a dead base)", judge(null, parseSuite(suite([]))).v === "RED" && judge(parseSuite(suite([])), null).v === "RED");
  // unit mlaw (forks row 1137 (2) F3 A): a law pack RISE is a new red BY NUMBER, planted both ways
  const LP = "LAW PACK — every rule file present, and no law's finding count rose (a gate may only get stricter)";
  const lp = (reds, counts) => `${suite(reds)}\n${counts ? `${LAWPACK_LINE} ${JSON.stringify(counts)}\n` : ""}`;
  ok("parseLawpack reads the law pack machine line (CRLF too); a run with none is null",
    JSON.stringify(parseLawpack(lp([], { a: 3 }))) === '{"a":3}' && JSON.stringify(parseLawpack(lp([], { a: 3 }).replace(/\n/g, "\r\n"))) === '{"a":3}' && parseLawpack(suite([])) === null && parseSuite(lp([], { a: 3 })).lawpack.a === 3);
  const rise = judge(parseSuite(lp([LP], { jugad: 92, dc: 7 })), parseSuite(lp([LP], { jugad: 91, dc: 7 })));
  ok("PLANTED mlaw · the law pack red on BOTH sides (one folded name) and a law RISES 91 → 92: RED, the rise a NEW red named by law and numbers",
    rise.v === "RED" && rise.fresh.length === 1 && rise.fresh[0] === "LAW PACK ROSE · jugad 91 → 92" && rise.old.length === 1);
  const fall = judge(parseSuite(lp([LP], { jugad: 91, dc: 7 })), parseSuite(lp([LP], { jugad: 92, dc: 7 })));
  const same = judge(parseSuite(lp([LP], { jugad: 92 })), parseSuite(lp([LP], { jugad: 92 })));
  ok("PLANTED mlaw · a FALL or an equal count adds no red (stricter only): GREEN, the law pack red still a base red", fall.v === "GREEN" && same.v === "GREEN" && fall.old.length === 1);
  const noBase = (b) => judge(parseSuite(lp([], { jugad: 91 })), parseSuite(lp([], null)), "", b);
  ok("PLANTED mlaw · a base with NO law pack line is compared against lawpack.mjs's BASELINE: above it RED, at it GREEN, no baseline readable RED",
    noBase({ jugad: 90 }).v === "RED" && /^LAW PACK ROSE · jugad 90 → 91 /.test(noBase({ jugad: 90 }).fresh[0] || "") && noBase({ jugad: 91 }).v === "GREEN"
    && noBase(null).v === "RED" && /^LAW PACK BASELINE UNREADABLE/.test(noBase(null).fresh[0] || ""));
  ok("PLANTED mlaw · a law the base does not count is judged against the baseline, else 0 (nothing grandfathered); no head line judges nothing",
    lawpackRises({ fresh: 1 }, { jugad: 90 }).length === 1 && lawpackRises({ fresh: 0 }, { jugad: 90 }).length === 0 && lawpackRises(null, null).length === 0);
  const many = Array.from({ length: 14 }, (_, i) => `red-${i}`);
  const a = annotate("warning", "BASE RED", many);
  ok("annotate: 14 reds ride 10 annotations, the tenth carrying the last five — every red emitted", a.length === 10 && many.every((n) => a.some((l) => l.includes(n))) && a[9].includes("red-13"));
  ok("annotate escapes the workflow-command specials (a name never breaks its own line)", annotate("error", "T: x", ["a%b\nc"])[0] === "::error title=T%3A x 1/1::a%25b%0Ac");
  const c = compareLines(parseSuite(suite(["B", "PLANTED"])), parseSuite(suite(["B"])), "node 22", "a".repeat(40), "b".repeat(40));
  ok("compare: RED prints the new red as an error, the base red as a warning, ONE verdict error, exit RED", c.verdict === "RED" && c.lines.filter((l) => l.startsWith("::error title=NEW RED")).length === 1 && c.lines.filter((l) => l.startsWith("::warning")).length === 1 && c.lines.filter((l) => l.includes(VERDICT_TITLE)).length === 1);
  // unit mdtl (forks row 1186): the cause rides the NEW RED message and the payload, verified against the witness's own source
  const W = "WITNESS ‹toy› · GREEN at head against its BASE";
  const wsrc = (u) => (u === "toy" ? '// CONTRACT\n//   P1 · the planted clause claims one thing\n//   BOUND outside ci/\nimport x from "y";\nclause("P1", a, b);' : "");
  const cz = compareLines(parseSuite(suite(["B", W], { causes: [`${W} · P1 · the planted clause claims one thing`, `${W} · P1 · FORGED-TEXT-IN-NO-SOURCE`] })), parseSuite(suite(["B"])), "node 22", "", "", "", null, wsrc);
  const czNew = cz.lines.find((l) => l.startsWith("::error title=NEW RED")) || "";
  const czPay = JSON.parse((/B1_VERDICT (\{.*\})$/.exec(cz.lines.find((l) => l.includes(VERDICT_TITLE)) || "") || ["", "{}"])[1].replace(/%0A/g, "\n").replace(/%25/g, "%"));
  ok("mdtl · a NEW witness red carries its verified cause in its own NEW RED message and the payload; no annotation is added",
    czNew.includes("%0Acause · P1 · the planted clause claims one thing") && JSON.stringify(czPay.cause) === JSON.stringify({ [W]: ["P1 · the planted clause claims one thing", "WITHHELD · a clause id that is not a literal of the witness's own source was withheld"] }) && cz.lines.length === c.lines.length);
  ok("mdtl · a forged cause text never leaves: compare re-writes it to WITHHELD (the second check)", !cz.lines.some((l) => l.includes("FORGED-TEXT-IN-NO-SOURCE")));
  const cd = compareLines(parseSuite(suite(["B", W], { causes: [`${W} · P1 · the planted clause claims one thing`] })), parseSuite(suite(["B"])), "node 22");
  ok("mdtl · with no source door (the pure default) every witness cause is WITHHELD", cd.lines.some((l) => l.includes("%0Acause · WITHHELD · ")) && !cd.lines.some((l) => l.includes("claims one thing")));
  const g0 = compareLines(parseSuite(suite(["B"])), parseSuite(suite(["B"])), "node 22", "a", "b"), g1 = compareLines(parseSuite(suite(["B"], { causes: [`${W} · P1 · x`] })), parseSuite(suite(["B"])), "node 22", "a", "b", "", null, wsrc);
  ok("mdtl · a GREEN head's compare output is byte-identical with or without causes (no new red owns them)", JSON.stringify(g0.lines) === JSON.stringify(g1.lines));
  const runs = (st = "completed") => ({ check_runs: [{ id: 2, name: "npm test · node 24", status: st, conclusion: "success" }, { id: 1, name: "npm test · node 22", status: st, conclusion: "success" }, { id: 9, name: "public-safe-chores", status: "completed" }] });
  const ann = (v, nw) => [{ title: "BASE RED · node 22 1/1", message: "B" }, { title: `${VERDICT_TITLE} · node 22`, message: `B1_VERDICT ${JSON.stringify({ v, base: "c".repeat(40), new: nw, base_red: 1, live: 3 })}` }];
  const fake = (map) => async (p) => { for (const [k, v] of map) if (p.includes(k)) return v; throw new Error(`unplanted ${p}`); };
  return (async () => {
    const G = await readVerdict("d".repeat(40), DEFAULT_REPO, fake([["/check-runs?", runs()], ["/check-runs/1/", ann("GREEN", [])], ["/check-runs/2/", ann("GREEN", [])]]));
    ok("reader: two GREEN legs read GREEN in exactly 3 calls", G.v === "GREEN" && G.calls === 3 && G.line.startsWith("ci_verdict ddddddd GREEN"));
    const R = await readVerdict("d".repeat(40), DEFAULT_REPO, fake([["/check-runs?", runs()], ["/check-runs/1/", ann("GREEN", [])], ["/check-runs/2/", ann("RED", ["PLANTED"])]]));
    ok("reader: one RED leg reads RED and NAMES the new red", R.v === "RED" && R.line.includes("PLANTED") && R.calls === 3);
    const RC = await readVerdict("d".repeat(40), DEFAULT_REPO, fake([["/check-runs?", runs()], ["/check-runs/1/", ann("GREEN", [])],
      ["/check-runs/2/", [{ title: `${VERDICT_TITLE} · node 24`, message: `B1_VERDICT ${JSON.stringify({ v: "RED", base: "c".repeat(40), new: [W, "PLANTED"], cause: { [W]: ["P1 · the planted clause claims one thing"] }, base_red: 0, live: 3 })}` }]]]));
    ok("mdtl · reader: a new red with a cause reads `— cause: <ID> · <text>`, a red with none reads its name alone", RC.v === "RED" && RC.line.includes(`${W} — cause: P1 · the planted clause claims one thing ; PLANTED ·`));
    const P = await readVerdict("d".repeat(40), DEFAULT_REPO, fake([["/check-runs?", runs("in_progress")]]));
    ok("reader: a leg still running is PENDING after ONE call (it never polls)", P.v === "PENDING" && P.calls === 1);
    const N = await readVerdict("d".repeat(40), DEFAULT_REPO, fake([["/check-runs?", { check_runs: [] }]]));
    ok("reader: no leg is NONE after ONE call", N.v === "NONE" && N.calls === 1);
    const D = await readVerdict("d".repeat(40), DEFAULT_REPO, fake([["/check-runs?", runs()], ["/check-runs/1/", []], ["/check-runs/2/", ann("GREEN", [])]]));
    ok("reader: a leg with no verdict annotation is RED, never GREEN by absence", D.v === "RED");
    // unit mrdr (row 1022 (1)): TWO CHECK SUITES on one sha (the 2bed314 shape: node 22 ×2, node 24 ×2, the older suite first)
    const two = { check_runs: [{ id: 11, name: "npm test · node 22", status: "completed" }, { id: 12, name: "npm test · node 24", status: "completed" }, { id: 21, name: "npm test · node 22", status: "completed" }, { id: 22, name: "npm test · node 24", status: "completed" }] };
    const DR = await readVerdict("d".repeat(40), DEFAULT_REPO, fake([["/check-runs?", two], ["/check-runs/21/", ann("GREEN", [])], ["/check-runs/22/", ann("RED", ["PLANTED"])], ["/check-runs/11/", ann("GREEN", [])], ["/check-runs/12/", ann("GREEN", [])]]));
    ok("PLANTED mrdr · two suites, the NEWEST node 24 RED: reads RED by name in 3 calls, reading node 22 once and node 24 once (never node 22 twice)", DR.v === "RED" && DR.line.includes("PLANTED") && DR.calls === 3 && DR.line.includes("[run 21]") && DR.line.includes("[run 22]") && !DR.line.includes("[run 11]"));
    const DG = await readVerdict("d".repeat(40), DEFAULT_REPO, fake([["/check-runs?", two], ["/check-runs/21/", ann("GREEN", [])], ["/check-runs/22/", ann("GREEN", [])], ["/check-runs/11/", ann("RED", ["OLD"])], ["/check-runs/12/", ann("RED", ["OLD"])]]));
    ok("PLANTED mrdr · two suites, the newest of each leg GREEN (an older run red): reads GREEN off the newest runs only", DG.v === "GREEN" && DG.calls === 3 && !DG.line.includes("OLD"));
    const M = await readVerdict("d".repeat(40), DEFAULT_REPO, fake([["/check-runs?", { check_runs: [{ id: 21, name: "npm test · node 22", status: "completed" }, { id: 31, name: "npm test · node 22", status: "completed" }] }], ["/check-runs/31/", ann("GREEN", [])], ["/check-runs/21/", ann("GREEN", [])]]));
    ok("PLANTED mrdr · a required leg with no run (node 24 missing, node 22 twice): PENDING after ONE call, naming the missing leg — never GREEN", M.v === "PENDING" && M.calls === 1 && M.line.includes("missing npm test · node 24"));
    const N2 = await readVerdict("d".repeat(40), DEFAULT_REPO, fake([["/check-runs?", { check_runs: [{ id: 9, name: "public-safe-chores", status: "completed" }] }]]));
    ok("PLANTED mrdr · no leg at all: NONE after ONE call, naming both missing legs", N2.v === "NONE" && N2.calls === 1 && REQUIRED_LEGS.every((n) => N2.line.includes(n)));
    let matrix = "";
    try { matrix = (readFileSync(new URL("../.github/workflows/suite.yml", import.meta.url), "utf8").match(/^\s*node:\s*\[([^\]]*)\]/m) || ["", ""])[1]; } catch { matrix = ""; }
    const nodes = matrix.split(",").map((s) => s.trim()).filter(Boolean);
    ok("mrdr · REQUIRED_LEGS equals suite.yml's own matrix line, one leg per node (checked, never trusted)", nodes.length > 0 && JSON.stringify(nodes.map((n) => `npm test · node ${n}`)) === JSON.stringify(REQUIRED_LEGS));
    const FB = await frozenBaseline();
    ok("mlaw · lawpack.mjs's frozen BASELINE is readable from this file (the base-with-no-line comparison has its numbers)",
      !!FB && Number.isSafeInteger(FB["jugad-literal-subject-list"]) && (await frozenBaseline("file:///nonexistent/lawpack.mjs")) === null);
    // unit mlaw (forks row 1137 (1) F1 B): the legs are DERIVED, so the derivation is planted both ways
    const yml = (m, nm = "    name: npm test · node ${{ matrix.node }}") => `jobs:\n  t:\n${nm}\n    strategy:\n      matrix:\n${m}\n`;
    const three = legsOf(yml("        node: [22, 24, 26]")), crlf = legsOf(yml("        node: [22, 24]").replace(/\n/g, "\r\n"));
    ok("PLANTED mlaw · a matrix that gains a node gains a leg (derived from suite.yml, never typed), CRLF-proof",
      JSON.stringify(three) === JSON.stringify(["npm test · node 22", "npm test · node 24", "npm test · node 26"]) && JSON.stringify(crlf) === JSON.stringify(["npm test · node 22", "npm test · node 24"]));
    ok("PLANTED mlaw · a suite.yml with no matrix line or no job name line derives NO leg (the reader then says NONE, never GREEN)",
      legsOf(yml("")).length === 0 && legsOf(yml("        node: [22]", "    name: npm test")).length === 0 && legsOf("").length === 0);
    console.log(`\nci_verdict selftest: ${pass} passed, ${fail} failed`);
    console.log(fail ? "SELFTEST FAILED" : "ALL CHECKS PASSED");
    return fail ? 1 : 0;
  })();
}

const flag = (n) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : undefined; };

async function main() {
  const mode = process.argv[2] || "";
  if (mode === "selftest") { process.exitCode = await selftest(); return; }
  if (mode === "compare") {
    const read = (p) => { try { return p ? readFileSync(p, "utf8") : ""; } catch { return ""; } };   // an unreadable run is a run with no headline
    // --base-instrument: the base's OWN organism_test.mjs, passed only when the base was measured by the head's instead
    const head = parseSuite(read(flag("head"))), base = parseSuite(read(flag("base")));
    // unit mlaw (F3 A): only a base with no law pack line needs the frozen baseline, read from lawpack.mjs itself (never typed here)
    const baseline = head && head.lawpack && base && !base.lawpack ? await frozenBaseline() : null;
    const { lines, verdict } = compareLines(head, base, flag("label") || "suite", flag("head-sha") || "", flag("base-sha") || "", read(flag("base-instrument")), baseline, workspaceSrc);
    for (const l of lines) console.log(l);
    process.exitCode = verdict === "GREEN" ? 0 : 1;
    return;
  }
  if (!/^[0-9a-f]{7,40}$/i.test(mode)) { console.log("ci_verdict: <sha> [--repo owner/name] | compare --head f --base f --label l | selftest"); process.exitCode = 2; return; }
  try {
    const { line, v } = await readVerdict(mode, flag("repo") || DEFAULT_REPO, anonymousGet);
    console.log(line);
    process.exitCode = v === "GREEN" ? 0 : 1;
  } catch (e) {
    console.log(`ci_verdict ${mode.slice(0, 7)} UNREADABLE — ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 2;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
