// ci/mjud/w_drive.mjs — ONE witness driver child: node --import <w_preload.mjs> w_drive.mjs <copy-dir> <part>
// It imports the COPY's organs (never the live tree's), drives one part on planted inputs and a fixed clock, and prints
// ONE JSON line of FACTS. It judges nothing: ci/mjud/witness_mjud.mjs reads the facts and decides each clause.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const [copy, part] = process.argv.slice(2);
const mod = (f) => import(pathToFileURL(join(copy, "scripts", f)).href);
const spawns = () => (existsSync(process.env.MJUD_SPAWN_LOG || "") ? readFileSync(process.env.MJUD_SPAWN_LOG, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const isGaffer = (s) => s.args.some((a) => /(^|\/)gaffer_brain\.mjs$/.test(a));
const out = (o) => { process.stdout.write(JSON.stringify(o) + "\n"); process.exit(0); };
const FIXED = Date.parse("2026-09-10T06:00:00.000Z");   // the fixed clock of every gaffer plant

async function sitting() {
  const S = await mod("sitting.mjs");
  const G = await mod("gaffer_brain.mjs");
  const d = S.createSitting({});
  const srv = await d.serve(0, "127.0.0.1");
  const r = await fetch(`http://127.0.0.1:${srv.port}/close`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason: "witness" }) }).then((x) => x.json());
  const all = spawns().filter(isGaffer);
  const judge = all.find((s) => s.args.includes("judge-due") || s.args.includes("judge-round"));
  const others = spawns().filter((s) => /\.mjs$/.test(s.args[0] || "") && !(s.args.includes("judge-due") || s.args.includes("judge-round")));
  out({ part, closed: !!r.ok, budget: G.JUDGE_BUDGET_MS, dispatch: G.JUDGE_DISPATCH_MS ?? null, judge: judge || null,
    others: others.map((s) => ({ fn: s.fn, organ: s.args[0].split("/").pop(), verb: s.args[1], timeout: s.timeout })) });
}

async function dugout() {
  const D = await mod("dugout.mjs");
  const G = await mod("gaffer_brain.mjs");
  let jr = null, other = null;
  try { jr = D.execTool("judge_round", {}, {}); } catch (e) { jr = { threw: String(e && e.message || e).slice(0, 120) }; }
  try { other = D.execTool("retire_doubt_legacy", { capsule: "witness", doubt_index: 0 }, {}); } catch (e) { other = { threw: String(e && e.message || e).slice(0, 120) }; }
  const all = spawns();
  out({ part, budget: G.JUDGE_BUDGET_MS, dispatch: G.JUDGE_DISPATCH_MS ?? null, tool_ok: !!(jr && jr.ok),
    judge: all.find((s) => isGaffer(s) && s.args.includes("judge-round")) || null,
    others: all.filter((s) => !isGaffer(s)).map((s) => ({ organ: (s.args[0] || "").split("/").pop(), verb: s.args[1], timeout: s.timeout })) });
}

// the planted round: n hidden_test captures (a checked type, so the external check is eligible), oldest first
const plantRows = (n) => Array.from({ length: n }, (_, i) => ({ v: 2, kind: "capture", id: `w${i}`, type: "hidden_test", ref: `witness:${i}`, concept: "witness-none",
  label: `witness ${i}`, gut: "knew", spoken: "planted answer", asked: "planted question", ts: new Date(FIXED - (n - i) * 60000).toISOString() }));

async function gaffer() {
  const G = await mod("gaffer_brain.mjs");
  const legal = G.VERDICT_TYPES.hidden_test.verdicts[0];
  const judgeCalls = [];
  const grade = (dur = 1000) => async (p, call) => { judgeCalls.push({ budget_ms: call && call.budget_ms, items: call && call.items }); const ids = (String(p).match(/id (w\d+)/g) || []).map((m) => m.slice(3));
    return { ok: true, duration_ms: dur, text: JSON.stringify({ grades: [...new Set(ids)].map((id) => ({ id, verdict: legal, missing: [], why: "planted" })) }) }; };
  const base = { dry: true, cartridge: "PLANTED HEAD", headRides: false, dispatch: () => ({ ok: true }), fileCard: () => ({ ok: true, out: "captains_call: filed c1" }),
    secondOpinion: async () => ({ ok: false, reason: "planted: no second reader" }), now: new Date(FIXED), clock: () => FIXED };
  const B = G.JUDGE_BUDGET_MS;
  const facts = { part, budget: B };
  // F3-a — a check that EATS the budget
  { judgeCalls.length = 0; const handed = [];
    const r = await G.gradeJudge({ ...base, rows: plantRows(3), judgeHistory: [], generate: grade(),
      verifyGenerate: async (p, call) => { handed.push(call && call.budget_ms); return { ok: true, text: '{"items":[]}', duration_ms: B }; } });
    facts.eat = { ok: r.ok, reason: r.reason, say: String(r.say || "").slice(0, 200), batches: (r.batches || []).length, judge_calls: judgeCalls.length, handed }; }
  // F3-b — a check that takes a third: the first batch is killed at what it left
  { judgeCalls.length = 0; const handed = [];
    const r = await G.gradeJudge({ ...base, rows: plantRows(3), judgeHistory: [{ job: G.JUDGE_JOB, ok: true, duration_ms: 1000, items: 1 }], generate: grade(),
      verifyGenerate: async (p, call) => { handed.push(call && call.budget_ms); return { ok: true, text: '{"items":[]}', duration_ms: B / 3 }; } });
    facts.third = { ok: r.ok, first_budget: judgeCalls[0] ? judgeCalls[0].budget_ms : null, handed, graded: r.graded }; }
  // mjd2 — a killed batch of 10 on the ledger beside a fast ok row; then the size that died next
  const fast = { job: G.JUDGE_JOB, ok: true, duration_ms: 10000, items: 1 };
  const kill = (n) => ({ job: G.JUDGE_JOB, ok: false, duration_ms: B, items: n, error: "spawnSync claude ETIMEDOUT" });
  { judgeCalls.length = 0; const r = await G.gradeJudge({ ...base, rows: plantRows(12), judgeHistory: [fast, kill(10)], verify: async () => ({ ran: false, why: "planted", checks: {}, calls: 0 }), generate: grade(10) });
    const first = (r.batches || [])[0]; facts.kill1 = { first_size: first ? first.size : null, killed_size: 10 }; }
  { judgeCalls.length = 0; const r1 = await G.gradeJudge({ ...base, rows: plantRows(12), judgeHistory: [fast, kill(10)], verify: async () => ({ ran: false, why: "planted", checks: {}, calls: 0 }), generate: grade(10) });
    const s1 = (r1.batches || [])[0] ? r1.batches[0].size : null;
    const r2 = await G.gradeJudge({ ...base, rows: plantRows(12), judgeHistory: [fast, kill(10), kill(s1 || 1)], verify: async () => ({ ran: false, why: "planted", checks: {}, calls: 0 }), generate: grade(10) });
    facts.kill2 = { s1, s2: (r2.batches || [])[0] ? r2.batches[0].size : null }; }
  // mjd2, the other way — a refusal and an un-killed failure are no floor: the size is the ok-only size
  { const refused = { job: G.JUDGE_JOB, ok: false, duration_ms: 3000, items: 1, error: "OAuth session expired and could not be refreshed" };
    const lost = { job: G.JUDGE_JOB, ok: false, duration_ms: B, items: 59 };
    // the queue (40) is longer than either size could be, so a floor that should not exist cannot hide behind `left`
    const ra = await G.gradeJudge({ ...base, rows: plantRows(40), judgeHistory: [fast], verify: async () => ({ ran: false, why: "planted", checks: {}, calls: 0 }), generate: grade(10) });
    const rb = await G.gradeJudge({ ...base, rows: plantRows(40), judgeHistory: [fast, refused, lost], verify: async () => ({ ran: false, why: "planted", checks: {}, calls: 0 }), generate: grade(10) });
    facts.nofloor = { a: (ra.batches || [])[0] ? ra.batches[0].size : null, b: (rb.batches || [])[0] ? rb.batches[0].size : null }; }
  // the auth canary, kept — the observed OAuth refusal stops the round RED with ONE card
  { const cards = []; const r = await G.gradeJudge({ ...base, rows: plantRows(2), judgeHistory: [], verify: async () => ({ ran: false, why: "planted", checks: {}, calls: 0 }),
      generate: async () => ({ ok: false, duration_ms: 3000, error: "OAuth session expired and could not be refreshed" }), fileCard: (line, key) => { cards.push(key); return { ok: true, out: "captains_call: filed c1" }; } });
    facts.auth = { reason: r.reason, cards: cards.length }; }
  // the output fields of an ok round (every caller field read today must stay)
  { const r = await G.gradeJudge({ ...base, rows: plantRows(2), judgeHistory: [fast], verify: async () => ({ ran: false, why: "planted", checks: {}, calls: 0 }), generate: grade(10) });
    facts.fields = Object.keys(r).sort(); facts.fields_ok = r.ok; }
  out(facts);
}

async function brain() {
  const G = await mod("gaffer_brain.mjs");
  const B = await mod("brain.mjs");
  const re = B.AUTH_FAIL_RE;
  out({ part, exported: re instanceof RegExp, same: re === G.JUDGE_AUTH_RE,
    matches: re instanceof RegExp ? ["Not logged in · Please run /login", "Failed to authenticate", "OAuth session expired and could not be refreshed"].map((t) => re.test(t)) : [] });
}

({ sitting, dugout, gaffer, brain })[part]().catch((e) => out({ part, threw: String((e && e.stack) || e).slice(0, 400) }));
