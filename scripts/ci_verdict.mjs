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
// Annotations carry NAMES only — never a detail line, which can quote a state file.
// MODES: compare · selftest · <sha>
// CLI: node scripts/ci_verdict.mjs <sha> [--repo owner/name]
//      node scripts/ci_verdict.mjs compare --head <file> --base <file> --label <l> [--head-sha s] [--base-sha s]
// ============================================================================
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const DEFAULT_REPO = "nikhil1429/arsenal-ai-fc";
const VERDICT_TITLE = "B1 VERDICT";
const LEG = /^npm test · node (\d+)$/;

/** the machine line organism_test.mjs prints, parsed; null when the run never reached it (no headline)
 *  @param {string} text @returns {{ pass: number, fail: number, reds: string[], live: string[], profile: string } | null} */
export function parseSuite(text) {
  const line = String(text).split(/\r?\n/).find((l) => l.startsWith("ORGANISM_TEST_VERDICT "));
  if (!line) return null;
  let j = null;
  try { j = JSON.parse(line.slice("ORGANISM_TEST_VERDICT ".length)); } catch { return null; }
  if (!j || !Array.isArray(j.reds)) return null;
  return { pass: Number(j.pass) || 0, fail: Number(j.fail) || 0, reds: j.reds.map(String), live: Array.isArray(j.live) ? j.live.map(String) : [], profile: String(j.profile || "full") };
}

/** a member's identity across two trees: its name with every digit run folded @param {string} n */
export const keyOf = (n) => String(n).replace(/\d+/g, "#").replace(/\s+/g, " ").trim();

/** the neutral verdict: GREEN iff every head red is red at the base too
 *  @param {ReturnType<typeof parseSuite>} head @param {ReturnType<typeof parseSuite>} base */
export function judge(head, base) {
  if (!head) return { v: "RED", why: "the head run produced no headline line", fresh: [], old: [], fixed: [] };
  if (!base) return { v: "RED", why: "the merge-base run produced no headline line (no base to compare against)", fresh: [...head.reds], old: [], fixed: [] };
  const baseKeys = new Set(base.reds.map(keyOf)), headKeys = new Set(head.reds.map(keyOf));
  const fresh = head.reds.filter((n) => !baseKeys.has(keyOf(n)));
  const old = head.reds.filter((n) => baseKeys.has(keyOf(n)));
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

/** every line `compare` prints, in order: the reds, then the ONE verdict annotation, then the plain verdict line */
export function compareLines(head, base, label, headSha = "", baseSha = "") {
  const j = judge(head, base);
  const lines = [];
  lines.push(...annotate("error", `NEW RED · ${label}`, j.fresh, j.v === "RED" ? 9 : 10));
  lines.push(...annotate("warning", `BASE RED · ${label}`, j.old));
  const payload = { v: j.v, label, head: headSha, base: baseSha, why: j.why, new: j.fresh, base_red: j.old.length, fixed: j.fixed.length,
    pass: head ? head.pass : null, fail: head ? head.fail : null, live: head ? head.live.length : null, profile: head ? head.profile : null };
  lines.push(`::${j.v === "GREEN" ? "notice" : "error"} title=${escProp(`${VERDICT_TITLE} · ${label}`)}::${esc(`B1_VERDICT ${JSON.stringify(payload)}`)}`);
  lines.push(`B1_VERDICT ${label} ${j.v} — ${j.why} · head ${headSha.slice(0, 7) || "?"} · base ${baseSha.slice(0, 7) || "?"} · ${j.fresh.length} new red · ${j.old.length} base red · ${j.fixed.length} base red now passing`);
  return { lines, verdict: j.v };
}

/** the reader, in at most 3 calls. `get` is the one network door (planted in the selftest).
 *  @param {string} sha @param {string} repo @param {(path: string) => Promise<any>} get */
export async function readVerdict(sha, repo, get) {
  let calls = 0;
  const call = async (p) => { calls++; return get(p); };
  const runs = await call(`/repos/${repo}/commits/${sha}/check-runs?per_page=100`);
  const legs = ((runs && runs.check_runs) || []).filter((r) => LEG.test(String(r.name))).sort((a, b) => (a.name < b.name ? -1 : 1));
  const short = String(sha).slice(0, 7);
  if (!legs.length) return { line: `ci_verdict ${short} NONE — no "npm test · node N" check run on this commit (${calls} call)`, calls, v: "NONE" };
  if (legs.some((r) => r.status !== "completed")) return { line: `ci_verdict ${short} PENDING — ${legs.map((r) => `${r.name}: ${r.status}`).join(" · ")} (${calls} call; read again later, never poll)`, calls, v: "PENDING" };
  const parts = [];
  let red = false;
  for (const leg of legs.slice(0, 2)) {
    const anns = await call(`/repos/${repo}/check-runs/${leg.id}/annotations?per_page=100`);
    const vAnn = (Array.isArray(anns) ? anns : []).find((a) => String(a.title || "").startsWith(VERDICT_TITLE) && String(a.message || "").startsWith("B1_VERDICT "));
    let p = null;
    try { p = vAnn ? JSON.parse(String(vAnn.message).slice("B1_VERDICT ".length)) : null; } catch { p = null; }
    if (!p) { red = true; parts.push(`${leg.name}: RED (${leg.conclusion}; no verdict annotation — the run never reached its verdict) [run ${leg.id}]`); continue; }
    if (p.v !== "GREEN") red = true;
    parts.push(`${leg.name}: ${p.v} (base ${String(p.base).slice(0, 7)} · ${p.new.length} new red${p.new.length ? `: ${p.new.join(" ; ")}` : ""} · ${p.base_red} base red · ${p.live} live) [run ${leg.id}]`);
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
  const g = judge(parseSuite(suite(["all 121 x", "B"])), parseSuite(suite(["all 120 x", "B", "C"])));
  ok("judge: every head red red at the base too is GREEN, and a base red now passing is counted, never hidden", g.v === "GREEN" && g.old.length === 2 && g.fixed.length === 1 && g.fresh.length === 0);
  const r = judge(parseSuite(suite(["B", "PLANTED"])), parseSuite(suite(["B"])));
  ok("judge: a red absent at the base is RED BY NAME", r.v === "RED" && r.fresh.length === 1 && r.fresh[0] === "PLANTED");
  ok("judge: no head headline is RED; no base headline is RED (no silent pass on a dead base)", judge(null, parseSuite(suite([]))).v === "RED" && judge(parseSuite(suite([])), null).v === "RED");
  const many = Array.from({ length: 14 }, (_, i) => `red-${i}`);
  const a = annotate("warning", "BASE RED", many);
  ok("annotate: 14 reds ride 10 annotations, the tenth carrying the last five — every red emitted", a.length === 10 && many.every((n) => a.some((l) => l.includes(n))) && a[9].includes("red-13"));
  ok("annotate escapes the workflow-command specials (a name never breaks its own line)", annotate("error", "T: x", ["a%b\nc"])[0] === "::error title=T%3A x 1/1::a%25b%0Ac");
  const c = compareLines(parseSuite(suite(["B", "PLANTED"])), parseSuite(suite(["B"])), "node 22", "a".repeat(40), "b".repeat(40));
  ok("compare: RED prints the new red as an error, the base red as a warning, ONE verdict error, exit RED", c.verdict === "RED" && c.lines.filter((l) => l.startsWith("::error title=NEW RED")).length === 1 && c.lines.filter((l) => l.startsWith("::warning")).length === 1 && c.lines.filter((l) => l.includes(VERDICT_TITLE)).length === 1);
  const runs = (st = "completed") => ({ check_runs: [{ id: 2, name: "npm test · node 24", status: st, conclusion: "success" }, { id: 1, name: "npm test · node 22", status: st, conclusion: "success" }, { id: 9, name: "public-safe-chores", status: "completed" }] });
  const ann = (v, nw) => [{ title: "BASE RED · node 22 1/1", message: "B" }, { title: `${VERDICT_TITLE} · node 22`, message: `B1_VERDICT ${JSON.stringify({ v, base: "c".repeat(40), new: nw, base_red: 1, live: 3 })}` }];
  const fake = (map) => async (p) => { for (const [k, v] of map) if (p.includes(k)) return v; throw new Error(`unplanted ${p}`); };
  return (async () => {
    const G = await readVerdict("d".repeat(40), DEFAULT_REPO, fake([["/check-runs?", runs()], ["/check-runs/1/", ann("GREEN", [])], ["/check-runs/2/", ann("GREEN", [])]]));
    ok("reader: two GREEN legs read GREEN in exactly 3 calls", G.v === "GREEN" && G.calls === 3 && G.line.startsWith("ci_verdict ddddddd GREEN"));
    const R = await readVerdict("d".repeat(40), DEFAULT_REPO, fake([["/check-runs?", runs()], ["/check-runs/1/", ann("GREEN", [])], ["/check-runs/2/", ann("RED", ["PLANTED"])]]));
    ok("reader: one RED leg reads RED and NAMES the new red", R.v === "RED" && R.line.includes("PLANTED") && R.calls === 3);
    const P = await readVerdict("d".repeat(40), DEFAULT_REPO, fake([["/check-runs?", runs("in_progress")]]));
    ok("reader: a leg still running is PENDING after ONE call (it never polls)", P.v === "PENDING" && P.calls === 1);
    const N = await readVerdict("d".repeat(40), DEFAULT_REPO, fake([["/check-runs?", { check_runs: [] }]]));
    ok("reader: no leg is NONE after ONE call", N.v === "NONE" && N.calls === 1);
    const D = await readVerdict("d".repeat(40), DEFAULT_REPO, fake([["/check-runs?", runs()], ["/check-runs/1/", []], ["/check-runs/2/", ann("GREEN", [])]]));
    ok("reader: a leg with no verdict annotation is RED, never GREEN by absence", D.v === "RED");
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
    const { lines, verdict } = compareLines(parseSuite(read(flag("head"))), parseSuite(read(flag("base"))), flag("label") || "suite", flag("head-sha") || "", flag("base-sha") || "");
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
