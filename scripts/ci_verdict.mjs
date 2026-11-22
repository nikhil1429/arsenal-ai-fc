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
// UNIT mdtl2 (forks row 1220): every OTHER new red's cause is kept only if red_cause.mjs verify() rebuilds it from the kind's own
// tracked source in this workspace (one `git ls-files` read, only when such a cause exists); a run with no machine line names
// its last section (payload `cause["(head)"]` / `cause["(base)"]`, F7 A); a leg with no verdict annotation costs ONE more call,
// for its failed step's name (F6 A). Still no annotation added, and a GREEN head's output byte-identical.
// THE FOLD (unit mshard, forks rows 1171 (3) / 1188, spec ci/mshard/MSHARD_SPEC.md on claude/mshard-spec c82a0e6): the
// witnesses member runs as K shard jobs per node (F-SHAPE B, F-K b), beside the suite job, and a small fold job keeps the
// leg's name `npm test · node N` (F-JOB J2), so this reader still reads ONE verdict per leg. Jobs carry DIGESTS, never raw
// outputs (F-CARRY a): `digest` keeps the machine lines' names, shas and numbers only — no `detail`, no other line.
// `compare --head-part <digest>` (one per shard) folds the parts into ONE suite before the unchanged judge: a red in any
// shard is a red of the leg by the same name, and a missing, doubled or unjudged shard or unit is a red BY NAME, never a
// pass (row 1188 (2)). The `causes` channel of unit mdtl, when a machine line carries it, rides through the digest and the
// fold unchanged (row 1188 (2)). `times` prints the measured table ci/mshard/TIMES for a seat to commit (F-TABLE a); the
// suite never reaches the network.
// MODES: compare · digest · times · selftest · <sha>
// CLI: node scripts/ci_verdict.mjs <sha> [--repo owner/name]
//      node scripts/ci_verdict.mjs compare --head <file> --base <file> --label <l> [--head-sha s] [--base-sha s] [--base-instrument f] [--head-part <file>]…
//      node scripts/ci_verdict.mjs digest <raw organism_test output>
//      node scripts/ci_verdict.mjs times <sha> [--repo owner/name] | times --from-log <job log>…
// ============================================================================
import { readFileSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { verifyCause, sourcePaths } from "./witness_cause.mjs";
import { verify, kindOf, sectionCause, stepCause } from "./red_cause.mjs";

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
// ── unit mshard · the digest and the fold ───────────────────────────────────────────────────────────────────────────────
const TAGS = { verdict: "ORGANISM_TEST_VERDICT ", plan: "WITNESS_PLAN ", shard: "WITNESS_SHARD ", lawpack: `${LAWPACK_LINE} ` };
/** the JSON of the first line opening with `tag`, or null @param {string} text @param {string} tag */
export function machineLine(text, tag) {
  const line = String(text).split(/\r?\n/).find((l) => l.startsWith(tag));
  if (!line) return null;
  try { const j = JSON.parse(line.slice(tag.length)); return j && typeof j === "object" ? j : null; } catch { return null; }
}
const strs = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === "string") : []);
const num = (x) => (typeof x === "number" && Number.isFinite(x) ? x : null);
const nums = (o) => Object.fromEntries(Object.entries(o && typeof o === "object" ? o : {}).filter(([, v]) => num(v) !== null));
/** F-CARRY a: a raw organism_test output → its digest, the only bytes that leave a job. Every key is picked by name and every
 *  value checked for its type (a string, a number, or a list of them): `unruled[].detail` and every printed line are dropped,
 *  and a key this list does not name never travels. × unit mdtl2 (F7 A): a run with NO verdict line carries ONE section line, the
 *  last section it reached as sectionCause rebuilds it from <osSrc> (the workspace's organism_test.mjs) — the public spelling,
 *  never the raw line; `── (withheld)` when it is not public bytes; nothing when no section was reached — so the fold's judge
 *  names the same last section a whole raw output would have. @param {string} raw @param {string} [osSrc] @returns {string[]} */
export function digest(raw, osSrc = "") {
  const out = [];
  const v = machineLine(raw, TAGS.verdict);
  if (!(v && Array.isArray(v.reds))) {
    const c = sectionCause(raw, osSrc), LAST = "last section · ";
    if (c.startsWith(LAST)) out.push(`── ${c.slice(LAST.length)} ──`);
    else if (c !== "no section reached") out.push("── (withheld) ──");
  }
  if (v && Array.isArray(v.reds)) {
    const d = { modes: strs(v.modes), pass: num(v.pass), fail: num(v.fail), exit: num(v.exit),
      ruled: (Array.isArray(v.ruled) ? v.ruled : []).map((r) => ({ assert: String(r && r.assert), row: num(r && r.row), owner: String(r && r.owner) })),
      unruled: (Array.isArray(v.unruled) ? v.unruled : []).map((r) => ({ assert: String(r && r.assert) })),
      stale: strs(v.stale), invalid: strs(v.invalid), profile: String(v.profile || ""), reds: strs(v.reds), live: strs(v.live) };
    if (Array.isArray(v.causes)) d.causes = strs(v.causes);   // unit mdtl's channel: public bytes by its own law, carried as they are
    out.push(`${TAGS.verdict}${JSON.stringify(d)}`);
  }
  const lp = parseLawpack(raw);   // unit mlaw's counts (F3 A): {law: n}, names and numbers by parseLawpack's own filter
  if (lp) out.push(`${TAGS.lawpack}${JSON.stringify(lp)}`);
  const p = machineLine(raw, TAGS.plan);
  if (p) out.push(`${TAGS.plan}${JSON.stringify({ n: num(p.n), head: String(p.head || ""), units: strs(p.units), shards: (Array.isArray(p.shards) ? p.shards : []).map(strs), unknown: strs(p.unknown), stale: strs(p.stale) })}`);
  const s = machineLine(raw, TAGS.shard);
  if (s) out.push(`${TAGS.shard}${JSON.stringify({ k: num(s.k), n: num(s.n), head: String(s.head || ""), plan: strs(s.plan), judged: strs(s.judged), secs: nums(s.secs) })}`);
  return out;
}
/** every leaf a name (a string) or a number — the measured property of a digest (F-CARRY a's condition) @param {any} x @returns {boolean} */
export const namesAndNumbers = (x) => x === null || typeof x === "string" || (typeof x === "number" && Number.isFinite(x))
  || (Array.isArray(x) ? x.every(namesAndNumbers) : typeof x === "object" && Object.values(x).every(namesAndNumbers));

/** THE FOLD: the suite job's digest and one digest per shard → ONE parsed suite, as one process holding every red would have
 *  printed it. Unsharded (no plan line, no part) it is parseSuite(head), byte for byte. Every way a shard or a unit can go
 *  missing is a red BY NAME (row 1188 (2)): never zero reds by absence.
 *  @param {string} headText @param {string[]} partTexts */
export function mergeParts(headText, partTexts = []) {
  const head = parseSuite(headText), plan = machineLine(headText, TAGS.plan);
  if (!plan && !partTexts.length) return { suite: head, shards: null };
  if (!head) return { suite: null, shards: null };
  const reds = [];
  if (!plan) {
    reds.push("WITNESS PLAN · the suite job names the witness plan its shard parts judge (unit mshard)");
    return { suite: { ...head, fail: head.fail + reds.length, reds: [...head.reds, ...reds] }, shards: null };
  }
  const n = Number(plan.n) || 0, units = strs(plan.units), want = (Array.isArray(plan.shards) ? plan.shards : []).map(strs);
  const parts = partTexts.map((t) => ({ v: parseSuite(t), s: machineLine(t, TAGS.shard) }));
  let pass = head.pass, fail = head.fail;
  const all = [...head.reds], live = [...head.live], causes = [...head.causes], shards = [];
  /** @type {Map<string, number>} */
  const seen = new Map();
  const unitRed = new Set();
  const red = (u) => unitRed.add(u);
  if (!(n > 0) || want.length !== n) reds.push(`WITNESS PLAN · names ${n} shard(s) and carries ${want.length} (unit mshard)`);
  for (let k = 1; k <= n; k++) {
    const mine = parts.filter((p) => p.s && Number(p.s.k) === k && p.v);
    const tag = `WITNESS SHARD ${k}/${n}`;
    if (!mine.length) { reds.push(`${tag} · produced its machine line (unit mshard)`); for (const u of want[k - 1] || []) red(u); continue; }
    if (mine.length > 1) reds.push(`${tag} · produced exactly one part (unit mshard)`);
    for (const p of mine) {
      const s = /** @type {any} */ (p.s), v = /** @type {NonNullable<ReturnType<typeof parseSuite>>} */ (p.v);
      if (String(s.head) !== String(plan.head) || Number(s.n) !== n) reds.push(`${tag} · judged the head and the plan the suite job names (unit mshard)`);
      const sp = strs(s.plan), jd = new Set(strs(s.judged)), mineWant = new Set(want[k - 1] || []);
      for (const u of sp) { seen.set(u, (seen.get(u) || 0) + 1); if (!jd.has(u) || !mineWant.has(u)) red(u); }
      for (const u of mineWant) if (!sp.includes(u)) red(u);
      pass += v.pass; fail += v.fail; all.push(...v.reds); live.push(...v.live); causes.push(...v.causes);
      shards.push({ k, units: sp, secs: nums(s.secs) });
    }
  }
  // a part with no shard line or no verdict line names no k: the k it should have carried is red above (produced its machine line)
  for (const p of parts) if (p.s && p.v && !(Number(p.s.k) >= 1 && Number(p.s.k) <= n)) reds.push(`WITNESS SHARD ${p.s.k}/${n} · is a shard of the plan (unit mshard)`);
  for (const u of units) if (seen.get(u) !== 1) red(u);
  for (const u of seen.keys()) if (!units.includes(u)) red(u);
  for (const u of [...unitRed].sort()) reds.push(`WITNESS ‹${u}› · judged in exactly one shard (unit mshard)`);
  return { suite: { pass, fail: fail + reds.length, reds: [...all, ...reds], live, profile: head.profile, causes, lawpack: head.lawpack }, shards };
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
/** @param {{ head: string, base: string } | null} [text] the two raw outputs (unit mdtl2, K14 / K15: a side with no machine line
 *  names its last section, rebuilt from <osSrc>, the workspace's organism_test.mjs) @param {string} [osSrc] */
export function judge(head, base, baseSrc = "", baseline = null, text = null, osSrc = "") {
  if (!head) return { v: "RED", why: "the head run produced no headline line", fresh: [], old: [], fixed: [], lost: text ? { "(head)": [sectionCause(text.head, osSrc)] } : {} };
  if (!base) return { v: "RED", why: "the merge-base run produced no headline line (no base to compare against)", fresh: [...head.reds], old: [], fixed: [], lost: text ? { "(base)": [sectionCause(text.base, osSrc)] } : {} };
  const baseKeys = new Set(base.reds.map(keyOf)), headKeys = new Set(head.reds.map(keyOf));
  const fresh = head.reds.filter((n) => !baseKeys.has(keyOf(n)) || newInInstrument(n, baseSrc));
  fresh.push(...lawpackRises(head.lawpack, base.lawpack, baseline));
  const old = head.reds.filter((n) => !fresh.includes(n));
  const fixed = base.reds.filter((n) => !headKeys.has(keyOf(n)));
  return { v: fresh.length ? "RED" : "GREEN", why: fresh.length ? `${fresh.length} member(s) red that are not red at the merge base` : "no member red that is not red at the merge base", fresh, old, fixed, lost: {} };
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

/** unit mdtl: the verified causes of every NEW red that owns one, { "<red name>": ["<ID> · <text>", …] } (empty when none).
 *  unit mdtl2: a `WITNESS ‹u› · GREEN at head …` red goes to mdtl's verifyCause, unchanged; every other red to red_cause.mjs
 *  verify, through the workspace doors (default: none, so every such cause is WITHHELD; main passes the workspace's)
 *  @param {string[]} fresh @param {string[]} causes @param {(unit: string) => string} readSrc
 *  @param {(path: string) => string} [readFile] @param {() => Set<string>} [tracked] */
export function causesFor(fresh, causes, readSrc, readFile = () => "", tracked = () => new Set()) {
  /** @type {Record<string, string[]>} */
  const out = {};
  const byLength = [...fresh].sort((a, b) => b.length - a.length);
  for (const l of causes) {
    const red = byLength.find((r) => String(l).startsWith(`${r} · `));
    const v = !red ? null : kindOf(red).kind === "witness" ? verifyCause(l, fresh, readSrc) : verify(l, fresh, readFile, tracked());
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
/** unit mdtl2: the workspace's tracked files (ONE `git ls-files`, read only when a non-witness cause is verified) and a file door
 *  (a tracked path only — verify never asks for another); "" when unreadable (unreadable = WITHHELD) */
let trackedHere = null;
export const workspaceTracked = () => (trackedHere ??= new Set(String(spawnSync("git", ["-C", fileURLToPath(new URL("../", import.meta.url)), "ls-files", "-z"], { encoding: "utf8", windowsHide: true }).stdout || "").split("\0").filter(Boolean)));
export const workspaceFile = (p) => { try { return readFileSync(new URL(`../${p}`, import.meta.url), "utf8"); } catch (e) { void e; return ""; } };

/** every line `compare` prints, in order: the reds, then the ONE verdict annotation, then the plain verdict line.
 *  readSrc is the witness-source door (default: none, so every witness cause is WITHHELD; main passes workspaceSrc)
 *  @param {ReturnType<typeof parseSuite>} head @param {ReturnType<typeof parseSuite>} base @param {string} label
 *  @param {string} [headSha] @param {string} [baseSha] @param {string} [baseSrc] @param {Record<string, number> | null} [baseline]
 *  @param {(unit: string) => string} [readSrc]
 *  @param {{ readFile?: (p: string) => string, tracked?: () => Set<string>, text?: { head: string, base: string } | null }} [io] unit mdtl2's workspace doors
 *  @param {{ k: number, units: string[], secs: Record<string, number> }[] | null} [shards] unit mshard: the fold's per-shard seconds (absent when unsharded) */
export function compareLines(head, base, label, headSha = "", baseSha = "", baseSrc = "", baseline = null, readSrc = () => "", io = {}, shards = null) {
  /** unit mdtl2: io = { readFile, tracked, text } — the workspace doors and the two raw outputs (absent: the pure default) */
  const { readFile = () => "", tracked = () => new Set(), text = null } = /** @type {{ readFile?: (p: string) => string, tracked?: () => Set<string>, text?: { head: string, base: string } | null }} */ (io);
  const j = judge(head, base, baseSrc, baseline, text, text ? readFile("scripts/organism_test.mjs") : "");
  const lines = [];
  const cause = { ...causesFor(j.fresh, head ? head.causes : [], readSrc, readFile, tracked), ...j.lost };
  const shown = j.fresh.map((n) => (cause[n] ? [n, ...cause[n].map((c) => `cause · ${c}`)].join("\n") : n));
  lines.push(...annotate("error", `NEW RED · ${label}`, shown, j.v === "RED" ? 9 : 10));
  lines.push(...annotate("warning", `BASE RED · ${label}`, j.old));
  const payload = { v: j.v, label, head: headSha, base: baseSha, why: j.why, new: j.fresh, base_red: j.old.length, fixed: j.fixed.length,
    pass: head ? head.pass : null, fail: head ? head.fail : null, live: head ? head.live.length : null, profile: head ? head.profile : null,
    instrument: baseSrc ? "head (the base's own died before its machine line)" : "base", ...(Object.keys(cause).length ? { cause } : {}),
    ...(shards ? { shards } : {}) };   // unit mshard: {k, units, secs} per shard (the times table's source); absent when unsharded
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
  // unit mshard: suite.yml carries several matrix jobs (suite, witnesses, the fold), so the leg's NAME is read from the job whose
  // own name derives names of the leg's form (LEG); its NODES stay unit mlaw's read, the file's first node list — the
  // ci_verdict selftest holds every node list equal to REQUIRED_LEGS, so the lists cannot part while the suite is green
  const jobs = /^jobs:\s*$/m.test(t) ? t.slice(t.search(/^jobs:\s*$/m)).split(/\n(?=  [\w-]+:\s*$)/m).slice(1) : [t];
  const matrix = /^\s*node:\s*\[([^\]]*)\]/m.exec(t);
  if (!matrix) return [];
  const nodes = matrix[1].split(",").map((x) => x.trim()).filter(Boolean);
  for (const b of jobs) {
    const name = /^\s*name:\s*(.*?)\$\{\{\s*matrix\.node\s*\}\}\s*$/m.exec(b);
    if (!name) continue;
    const legs = nodes.map((n) => `${name[1]}${n}`);
    if (legs.length && legs.every((l) => LEG.test(l))) return legs;
  }
  return [];
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
    if (!p) {
      // unit mdtl2 (K17, F6 A): ONE more call, the leg's job, for its first failed step — named only when the workflow names it
      let job = null;
      try { job = await call(`/repos/${repo}/actions/jobs/${leg.id}`); } catch (e) { job = null; void e; }   // an unreadable job is said, never guessed
      const st = (job && Array.isArray(job.steps) ? job.steps : []).find((x) => x && x.conclusion && x.conclusion !== "success" && x.conclusion !== "skipped");
      const yml = st ? (() => { try { return readFileSync(SUITE_YML, "utf8"); } catch (e) { void e; return ""; } })() : "";
      const step = st ? ` · ${stepCause(String(st.name), String(st.conclusion), yml)}` : job ? "" : " · step (unreadable)";
      red = true; parts.push(`${leg.name}: RED (${leg.conclusion}; no verdict annotation — the run never reached its verdict${step}) [run ${leg.id}]`); continue;
    }
    if (p.v !== "GREEN") red = true;
    const why = (n) => (p.cause && Array.isArray(p.cause[n]) && p.cause[n].length ? `${n} — cause: ${p.cause[n].join(" ; ")}` : n);   // unit mdtl
    const lost = ["(head)", "(base)"].filter((k) => p.cause && Array.isArray(p.cause[k]) && p.cause[k].length).map((k) => ` · ${why(k)}`).join("");   // unit mdtl2 (K14 / K15)
    parts.push(`${leg.name}: ${p.v} (base ${String(p.base).slice(0, 7)} · ${p.new.length} new red${p.new.length ? `: ${p.new.map(why).join(" ; ")}` : ""} · ${p.base_red} base red · ${p.live} live${lost}) [run ${leg.id}]`);
  }
  return { line: `ci_verdict ${short} ${red ? "RED" : "GREEN"} — ${parts.join(" | ")} (${calls} calls)`, calls, v: red ? "RED" : "GREEN" };
}

// ── unit mshard · F-TABLE a: the measured times table, PRINTED for a seat to commit (the suite never reaches the network) ──
/** the B5 seconds lines of one job log (`WITNESS ‹u› · ran in N s (B5)`) → {unit: seconds} @param {string} text */
export function secsFromLog(text) {
  /** @type {Record<string, number>} */
  const m = {};
  for (const x of String(text).matchAll(/WITNESS ‹([a-z0-9-]+)› · ran in (\d+(?:\.\d+)?) s \(B5\)/g)) m[x[1]] = Math.max(m[x[1]] ?? 0, Number(x[2]));
  return m;
}
/** the table: the LARGEST seconds per unit over every map handed in (a slow leg is the one that meets the bound)
 *  @param {Record<string, number>[]} maps @param {string} source @param {string} when */
export function timesTable(maps, source, when) {
  /** @type {Record<string, number>} */
  const max = {};
  for (const m of maps) for (const [u, v] of Object.entries(nums(m))) if (/^[a-z0-9-]+$/.test(u)) max[u] = Math.max(max[u] ?? 0, v);
  return [`# ci/mshard/TIMES · unit → seconds, the largest over ${source} · printed by node scripts/ci_verdict.mjs times (F-TABLE a), never typed · ${when}`,
    ...Object.keys(max).sort().map((u) => `${u} ${max[u].toFixed(1)}`)];
}
/** the fold payloads' per-shard seconds of a commit, one map per leg, in at most 3 anonymous calls (as readVerdict)
 *  @param {string} sha @param {string} repo @param {(path: string) => Promise<any>} get */
export async function readTimesOf(sha, repo, get) {
  const runs = await get(`/repos/${repo}/commits/${sha}/check-runs?per_page=100`);
  const { legs, missing } = pickLegs((runs && runs.check_runs) || []);
  const maps = [], named = [];
  for (const leg of legs) {
    const anns = await get(`/repos/${repo}/check-runs/${leg.id}/annotations?per_page=100`);
    const vAnn = (Array.isArray(anns) ? anns : []).find((a) => String(a.title || "").startsWith(VERDICT_TITLE) && String(a.message || "").startsWith("B1_VERDICT "));
    let p = null;
    try { p = vAnn ? JSON.parse(String(vAnn.message).slice("B1_VERDICT ".length)) : null; } catch { p = null; }
    const m = Object.assign({}, ...((p && Array.isArray(p.shards)) ? p.shards : []).map((x) => nums(x && x.secs)));
    if (Object.keys(m).length) { maps.push(m); named.push(`${leg.name} [run ${leg.id}]`); }
  }
  return { maps, named, missing };
}

/** the anonymous network door: no token, ever @param {string} p */
async function anonymousGet(p) {
  const r = await fetch(`https://api.github.com${p}`, { headers: { Accept: "application/vnd.github+json", "User-Agent": "ci-verdict-reader" } });
  if (!r.ok) throw new Error(`GET ${p} answered ${r.status}`);
  return r.json();
}

/** unit mshard: the jobs that MAKE the leg, read from suite.yml's text — the job named like a leg (the fold) and every job its
 *  `needs:` names — each as {id, bounds} (its own timeout-minutes lines). [] when no job is named like a leg. A job outside the
 *  leg (main's `hermetic-twice`, unit mherm) is not a part of the split and is not judged here (PROOF names it as a fork).
 *  @param {string} wf @returns {{ id: string, bounds: number[] }[]} */
export function legJobs(wf) {
  const body = String(wf).replace(/\r\n/g, "\n").split(/^jobs:\s*$/m)[1] || "";
  const blocks = body.split(/\n(?= {2}[a-z0-9_-]+:\s*$)/m).map((b) => ({ id: (/^ {2}([a-z0-9_-]+):\s*$/m.exec(b) || [])[1], b })).filter((x) => x.id);
  const leg = blocks.find((x) => { const n = /^ {4}name:\s*(.+?)\s*$/m.exec(x.b); return !!n && LEG.test(n[1].replace(/\$\{\{\s*matrix\.node\s*\}\}/g, "22")); });
  if (!leg) return [];
  const needs = (/^ {4}needs:\s*\[([^\]]*)\]/m.exec(leg.b) || /^ {4}needs:\s*([a-z0-9_-]+)\s*$/m.exec(leg.b) || ["", ""])[1].split(",").map((x) => x.trim()).filter(Boolean);
  const want = [leg.id, ...needs];
  return want.map((id) => { const x = blocks.find((y) => y.id === id); return { id, bounds: x ? [...x.b.matchAll(/^\s*timeout-minutes:\s*(\d+)\s*$/gm)].map((m) => Number(m[1])) : [] }; });
}
/** unit mshard, the workflow's shape, read from suite.yml's text (W-S10 / W-S11): ONE job is named like a leg (the fold), no
 *  other job's name can read as a leg, and every job of the LEG (the fold and every job it needs) carries exactly one
 *  timeout-minutes, all equal (the bound is one bound, never raised by a split) @param {string} wf @returns {[string, boolean][]} */
export function workflowLaws(wf) {
  const names = [...String(wf).matchAll(/^ {4}name:\s*(.+?)\s*$/gm)].map((m) => m[1]);
  const legLike = names.filter((n) => LEG.test(n.replace(/\$\{\{\s*matrix\.node\s*\}\}/g, "22")));
  const lj = legJobs(wf), first = lj.length && lj[0].bounds.length ? lj[0].bounds[0] : NaN;
  return [
    ["exactly ONE job of suite.yml is named like a leg (`npm test · node N`): the fold, so the reader reads one verdict per leg", legLike.length === 1],
    ["every job of the leg (the fold and every job it needs) carries ONE timeout-minutes, all equal (a split never raises the bound)", lj.length > 1 && lj.every((j) => j.bounds.length === 1 && j.bounds[0] === first)],
  ];
}
/** unit mshard, the digest and the fold, planted both ways (fixtures only) @returns {[string, boolean][]} */
function foldLaws() {
  const H = "a".repeat(40);
  const v = (reds, extra = {}) => `ORGANISM_TEST_VERDICT ${JSON.stringify({ modes: ["witnesses"], pass: 5, fail: reds.length, exit: reds.length ? 1 : 0, ruled: [], unruled: reds.map((r) => ({ assert: r, detail: "SECRET-DETAIL" })), stale: [], invalid: [], profile: "hermetic", reds, live: [], ...extra })}`;
  const plan = `WITNESS_PLAN ${JSON.stringify({ n: 3, head: H, units: ["a", "b", "c", "d"], shards: [["a", "d"], ["b"], ["c"]], unknown: [], stale: [] })}`;
  const part = (k, units, reds = [], judged = units, head = H) => `${v(reds)}\nWITNESS_SHARD ${JSON.stringify({ k, n: 3, head, plan: units, judged, secs: Object.fromEntries(units.map((u) => [u, 1.5])) })}\n  detail line SECRET-DETAIL`;
  const top = `${v(["S"])}\n${plan}`;
  const full = mergeParts(top, [part(1, ["a", "d"], ["WITNESS ‹a› · GREEN at head against its BASE"]), part(2, ["b"]), part(3, ["c"])]);
  const gone = mergeParts(top, [part(1, ["a", "d"]), part(3, ["c"])]);
  const unj = mergeParts(top, [part(1, ["a", "d"], [], ["a"]), part(2, ["b"]), part(3, ["c"])]);
  const dbl = mergeParts(top, [part(1, ["a", "d"]), part(2, ["b", "a"]), part(3, ["c"])]);
  const sha = mergeParts(top, [part(1, ["a", "d"]), part(2, ["b"], [], ["b"], "b".repeat(40)), part(3, ["c"])]);
  const lone = mergeParts(top, []);
  const dg = digest(part(2, ["b"], ["R"]));
  const plain = `${v(["S"])}`;
  const has = (m, n) => !!m.suite && m.suite.reds.some((r) => r.startsWith(n));
  return [
    ["fold: a red in any shard is a red of the leg by the same name, the suite job's reds kept, pass and fail summed", !!full.suite && full.suite.reds.includes("S") && full.suite.reds.includes("WITNESS ‹a› · GREEN at head against its BASE") && full.suite.reds.length === 2 && full.suite.pass === 20],
    ["fold: a missing shard is a red BY NAME (WITNESS SHARD 2/3), and its units are named, never a pass", has(gone, "WITNESS SHARD 2/3 · produced its machine line") && has(gone, "WITNESS ‹b› · judged in exactly one shard")],
    ["fold: a unit a shard planned and never judged is a red by name", has(unj, "WITNESS ‹d› · judged in exactly one shard") && !has(unj, "WITNESS ‹a› · judged")],
    ["fold: a unit in two shards is a red by name", has(dbl, "WITNESS ‹a› · judged in exactly one shard")],
    ["fold: a part naming another head sha is a red by name", has(sha, "WITNESS SHARD 2/3 · judged the head")],
    ["fold: a plan line with NO part is red for every shard (fails closed)", [1, 2, 3].every((k) => has(lone, `WITNESS SHARD ${k}/3 · produced`))],
    ["fold: no plan line and no part is parseSuite byte for byte (F-UNSHARDED a)", JSON.stringify(mergeParts(plain, []).suite) === JSON.stringify(parseSuite(plain)) && mergeParts(plain, []).shards === null],
    ["fold: parts with no plan line is a red by name", has(mergeParts(plain, [part(1, ["a"])]), "WITNESS PLAN · ")],
    ["fold: unit mdtl's causes ride through (the suite job's and every part's, in order)", (() => { const c = mergeParts(`${v([], { causes: ["c0"] })}\n${plan}`, [part(1, ["a", "d"]).replace('"live":[]', '"live":[],"causes":["c1"]'), part(2, ["b"]), part(3, ["c"])]); return !!c.suite && JSON.stringify(c.suite.causes) === JSON.stringify(["c0", "c1"]); })()],
    ["fold × mlaw: the digest carries the law pack line and the folded suite keeps its counts, so a rise is still a NEW red after the fold", (() => { const lpl = `${LAWPACK_LINE} ${JSON.stringify({ "jugad-literal-subject-list": 92 })}`; const d = digest(`${top}\n${lpl}`).join("\n"); const f = mergeParts(d, [part(1, ["a", "d"]), part(2, ["b"]), part(3, ["c"])]); const b = parseSuite(`${v(["S"])}\n${LAWPACK_LINE} ${JSON.stringify({ "jugad-literal-subject-list": 91 })}`); return d.includes(lpl) && !!f.suite && JSON.stringify(f.suite.lawpack) === JSON.stringify({ "jugad-literal-subject-list": 92 }) && judge(f.suite, b).fresh.some((r) => r.startsWith("LAW PACK ROSE · jugad-literal-subject-list 91 → 92")); })()],
    ["fold × mdtl2 (F7 A): a run with no verdict line digests to the section sectionCause names on the whole raw output (real, forged, none), and a run with one carries no section line",
      (() => { const os = 'section("SUITES — every member run");'; const L = (x) => `noise\n── ${x} ────\nmore`; return ["SUITES — every member run", "FORGED-SECTION"].every((x) => sectionCause(digest(L(x), os).join("\n"), os) === sectionCause(L(x), os)) && !digest(L("FORGED-SECTION"), os).join("\n").includes("FORGED") && digest("died", os).length === 0 && !digest(`${L("SUITES — every member run")}\n${v([])}`, os).some((l) => l.startsWith("── ")); })()],
    ["digest: the machine lines only, no detail key, no detail line; every leaf a name or a number", dg.length === 2 && !dg.join("\n").includes("SECRET-DETAIL") && !dg.join("\n").includes("detail") && dg.every((l) => namesAndNumbers(JSON.parse(l.slice(l.indexOf(" ") + 1))))],
  ];
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
  // unit mdtl2 (forks row 1220): every other red's cause, verified by red_cause.mjs through the doors; a run with no machine line
  const SM = "SUITE MEMBER · toy selftest exits 0", tsrc = 'ok("the toy check fails on purpose", false);';
  const doors = { readFile: (p) => (p === "scripts/toy.mjs" ? tsrc : p === "scripts/organism_test.mjs" ? 'section("SUITES — every member");' : ""), tracked: () => new Set(["scripts/toy.mjs", "scripts/organism_test.mjs"]) };
  const mc = [`${SM} · exit 1 · FAIL the toy check fails on purpose · and 2 more`, `${SM} · exit 1 · FAIL FORGED-TEXT-IN-NO-SOURCE`, `${W} · P1 · the planted clause claims one thing`];
  const m2 = compareLines(parseSuite(suite(["B", SM, W], { causes: mc })), parseSuite(suite(["B"])), "node 22", "", "", "", null, wsrc, doors);
  const m2Pay = JSON.parse((/B1_VERDICT (\{.*\})$/.exec(m2.lines.find((l) => l.includes(VERDICT_TITLE)) || "") || ["", "{}"])[1].replace(/%0A/g, "\n").replace(/%25/g, "%"));
  ok("mdtl2 · a NEW member red keeps the cause red_cause rebuilds from its own source, a forged one is WITHHELD, a witness red is still mdtl's",
    JSON.stringify(m2Pay.cause[SM]) === JSON.stringify(["exit 1 · FAIL the toy check fails on purpose · and 2 more", "WITHHELD · a cause that is not public bytes of its own tracked source was withheld"])
    && JSON.stringify(m2Pay.cause[W]) === JSON.stringify(["P1 · the planted clause claims one thing"]) && !m2.lines.some((l) => l.includes("FORGED-TEXT-IN-NO-SOURCE")));
  const m3 = compareLines(parseSuite(suite(["B", SM], { causes: [mc[0]] })), parseSuite(suite(["B"])), "node 22");
  ok("mdtl2 · with no doors (the pure default) a member red's cause is WITHHELD", m3.lines.some((l) => l.includes("%0Acause · WITHHELD · a cause that is not public bytes")) && !m3.lines.some((l) => l.includes("the toy check fails")));
  const hl = (t) => compareLines(null, parseSuite(suite(["B"])), "node 22", "", "", "", null, () => "", { ...doors, text: { head: t, base: "" } });
  const hp = (c) => JSON.parse((/B1_VERDICT (\{.*\})$/.exec(c.lines.find((l) => l.includes(VERDICT_TITLE)) || "") || ["", "{}"])[1].replace(/%0A/g, "\n").replace(/%25/g, "%")).cause;
  ok("mdtl2 · F7 A: a head with no machine line names its last section (a literal of organism_test.mjs); a forged one is WITHHELD; none reached is said",
    JSON.stringify(hp(hl("── SUITES — every member ────\nnoise"))) === JSON.stringify({ "(head)": ["last section · SUITES — every member"] })
    && hp(hl("── SUITES — every member ──\n── FORGED-SECTION ──"))["(head)"][0].startsWith("WITHHELD · ") && !hl("── FORGED-SECTION ──").lines.some((l) => l.includes("FORGED-SECTION"))
    && hp(hl("died"))["(head)"][0] === "no section reached" && hl("x").verdict === "RED" && compareLines(null, parseSuite(suite([])), "n").lines.every((l) => !l.includes('"cause"')));
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
    const job = (name) => ({ steps: [{ name: "Set up job", conclusion: "success" }, { name, conclusion: "failure" }, { name: "Complete job", conclusion: "success" }] });
    const DJ = await readVerdict("d".repeat(40), DEFAULT_REPO, fake([["/check-runs?", runs()], ["/check-runs/1/", []], ["/check-runs/2/", ann("GREEN", [])], ["/actions/jobs/1", job("npm test · hermetic · head")]]));
    const DX = await readVerdict("d".repeat(40), DEFAULT_REPO, fake([["/check-runs?", runs()], ["/check-runs/1/", []], ["/check-runs/2/", ann("GREEN", [])], ["/actions/jobs/1", job("FORGED-STEP-NAME")]]));
    const DU = await readVerdict("d".repeat(40), DEFAULT_REPO, fake([["/check-runs?", runs()], ["/check-runs/1/", []], ["/check-runs/2/", ann("GREEN", [])]]));
    ok("mdtl2 · F6 A: a leg with no verdict annotation reads its failed step in ONE more call — a workflow step by name, any other `(unnamed)`, an unreadable job said",
      DJ.v === "RED" && DJ.calls === 4 && DJ.line.includes("step npm test · hermetic · head · failure") && DX.line.includes("step (unnamed) · failure") && !DX.line.includes("FORGED-STEP-NAME") && DU.line.includes("step (unreadable)") && DU.v === "RED");
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
    let wf = "";
    try { wf = readFileSync(new URL("../.github/workflows/suite.yml", import.meta.url), "utf8"); } catch { wf = ""; }
    // unit mshard (W-S11): EVERY `node: [...]` list (the suite, the shards, the fold) equals REQUIRED_LEGS — before, only the first was read
    const lists = [...wf.matchAll(/^\s*node:\s*\[([^\]]*)\]/gm)].map((m) => m[1].split(",").map((x) => x.trim()).filter(Boolean));
    ok("mrdr · REQUIRED_LEGS equals EVERY node matrix list of suite.yml, one leg per node (checked, never trusted; unit mshard reads them all)", lists.length > 0 && lists.every((nodes) => JSON.stringify(nodes.map((n) => `npm test · node ${n}`)) === JSON.stringify(REQUIRED_LEGS)));
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
    for (const [what, cond] of workflowLaws(wf)) ok(`mshard · ${what}`, cond);
    // the leg's jobs, planted both ways: a job OUTSIDE the leg with no bound is not judged; a job the leg needs with none is refused
    const wfp = (b) => `jobs:\n  s:\n    name: s · node \${{ matrix.node }}\n${b}    timeout-minutes: 7\n  x:\n    name: x · node \${{ matrix.node }}\n  f:\n    name: npm test · node \${{ matrix.node }}\n    needs: [s]\n    timeout-minutes: 7\n`;
    ok("mshard · ONEBOUND judges the leg's jobs (the fold and its needs): a job outside the leg with no bound holds, a needed job's second or raised bound is refused",
      workflowLaws(wfp("")).every(([, c]) => c) && JSON.stringify(legJobs(wfp("")).map((j) => j.id)) === '["f","s"]' && !workflowLaws(wfp("    timeout-minutes: 8\n")).every(([, c]) => c) && !workflowLaws(wfp("").replace("needs: [s]\n    timeout-minutes: 7", "needs: [s]\n    timeout-minutes: 8")).every(([, c]) => c));
    for (const [what, cond] of foldLaws()) ok(`mshard · ${what}`, cond);
    console.log(`\nci_verdict selftest: ${pass} passed, ${fail} failed`);
    console.log(fail ? "SELFTEST FAILED" : "ALL CHECKS PASSED");
    return fail ? 1 : 0;
  })();
}

const flag = (n) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : undefined; };
/** every value of a repeatable flag, in order @param {string} n */
const flags = (n) => process.argv.flatMap((a, i) => (a === `--${n}` && i + 1 < process.argv.length ? [process.argv[i + 1]] : []));

async function main() {
  const mode = process.argv[2] || "";
  if (mode === "selftest") { process.exitCode = await selftest(); return; }
  if (mode === "compare") {
    const read = (p) => { try { return p ? readFileSync(p, "utf8") : ""; } catch { return ""; } };   // an unreadable run is a run with no headline
    // --base-instrument: the base's OWN organism_test.mjs, passed only when the base was measured by the head's instead
    // --head-part (unit mshard): one shard digest each; the fold makes them ONE suite before the unchanged judge
    const folded = mergeParts(read(flag("head")), flags("head-part").map(read));
    const head = folded.suite, base = parseSuite(read(flag("base")));
    // unit mlaw (F3 A): only a base with no law pack line needs the frozen baseline, read from lawpack.mjs itself (never typed here)
    const baseline = head && head.lawpack && base && !base.lawpack ? await frozenBaseline() : null;
    const { lines, verdict } = compareLines(head, base, flag("label") || "suite", flag("head-sha") || "", flag("base-sha") || "", read(flag("base-instrument")), baseline, workspaceSrc,
      { readFile: workspaceFile, tracked: workspaceTracked, text: { head: read(flag("head")), base: read(flag("base")) } }, folded.shards);   // unit mdtl2: the workspace doors
    for (const l of lines) console.log(l);
    process.exitCode = verdict === "GREEN" ? 0 : 1;
    return;
  }
  if (mode === "digest") {
    let raw = "";
    try { raw = readFileSync(String(process.argv[3] || ""), "utf8"); } catch { raw = ""; }   // an unreadable run digests to nothing: the fold reds it by name
    for (const l of digest(raw, workspaceFile("scripts/organism_test.mjs"))) console.log(l);   // × mdtl2 F7 A: the section is rebuilt from the workspace
    return;
  }
  if (mode === "times") {
    const logs = flags("from-log");
    const when = new Date().toISOString().slice(0, 10);
    if (logs.length) { for (const l of timesTable(logs.map((f) => { try { return secsFromLog(readFileSync(f, "utf8")); } catch { return {}; } }), `${logs.length} job log(s), their B5 lines`, when)) console.log(l); return; }
    const sha = String(process.argv[3] || "");
    if (!/^[0-9a-f]{7,40}$/i.test(sha)) { console.log("ci_verdict: times <sha> [--repo owner/name] | times --from-log <job log>…"); process.exitCode = 2; return; }
    try {
      const { maps, named, missing } = await readTimesOf(sha, flag("repo") || DEFAULT_REPO, anonymousGet);
      if (!maps.length) { console.log(`ci_verdict times ${sha.slice(0, 7)} NONE — no leg's verdict carries shard seconds${missing.length ? `; missing ${missing.join(" · ")}` : ""}`); process.exitCode = 1; return; }
      for (const l of timesTable(maps, `the fold of ${sha.slice(0, 7)} (${named.join(" · ")})`, when)) console.log(l);
    } catch (e) { console.log(`ci_verdict times ${sha.slice(0, 7)} UNREADABLE — ${e instanceof Error ? e.message : String(e)}`); process.exitCode = 2; }
    return;
  }
  if (!/^[0-9a-f]{7,40}$/i.test(mode)) { console.log("ci_verdict: <sha> [--repo owner/name] | compare --head f --base f --label l [--head-part f]… | digest <file> | times <sha> | selftest"); process.exitCode = 2; return; }
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
