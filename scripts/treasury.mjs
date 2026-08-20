#!/usr/bin/env node
// ============================================================================
// treasury.mjs · ARSENAL AI FC — TOKEN TRUTH (12 Aug 2026)
//   Writes NOTHING. Owns no state file. Reads brain_ledger.jsonl + the IR.
// ----------------------------------------------------------------------------
// DELIBERATELY SMALL. An elaborate value-model ("what was this token WORTH")
// was designed and then killed: it is a research project, not an organ, and this
// repo does not need another thing that is 80% built. The meter already exists
// (`brain.mjs spend [days]`, cost-weighted input 1 · cache_write 1.25 ·
// cache_read 0.1 · output 5). Three things are added, and nothing else:
//
//  (a) METER SELF-CONSISTENCY. Assert total_tokens == Σ(the four parts) on every
//      row. This is the check whose absence let the C1 faults live for weeks:
//      the DMN wrote `total_tokens` as an in+out pair (5.86 crore metered as
//      10.19 lakh) and `haiku_pulse` wrote a prompt-LENGTH GUESS as spend. Both
//      were arithmetically impossible against their own components, and nothing
//      in the repo did the subtraction. Now something does, on every row.
//
//  (b) THE ρ TABLE. Per job: cost-weighted spend ÷ output tokens. High ρ with
//      low output means the lane is paying BOOT TAX, not thinking. The known
//      live target is midday_digest_2/3 — 46,652 weighted for 1,462 output, a
//      ratio of 32:1, writing cache it never reads.
//
//  (c) THE ASSEMBLY-VS-GENERATION RULE, as an audit rather than an opinion. Any
//      organ generating prose that ALREADY EXISTS ON DISK is a defect. This
//      conversion has paid off twice already (B6 and B14 were both rewritten
//      from generation to assembly and came out free, instant, and impossible to
//      stale). Candidates are FLAGGED, never auto-converted — the conversion is
//      a design decision and therefore his.
//
// ⚠ WHY ρ IS COMPUTED FROM COMPONENTS AND NEVER FROM total_tokens. `spendOf()`
// in brain.mjs derives from the four parts at READ time precisely so a lying
// total is never consulted, and the append-only ledger is never rewritten. This
// organ follows the same rule: if it trusted total_tokens it would inherit every
// historical lie in the file.
//
// LAWS: read-only · never proposes a number (a budget or a cadence is a free
//   parameter, and a patch containing a number this repo has not already ruled on
//   is a RULING, never an auto-fix) · reports MEASURED ratios.
// WHO ELSE COULD ACT ON THIS OUTPUT? audit.mjs (ranks the ρ outliers and the
//   meter-inconsistency rows alongside every other finding). Wired.
// CLI: node scripts/treasury.mjs [report|meter|rho|sensitivity|assembly|selftest] [days]
// ============================================================================
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const LEDGER = join(ROOT, "dressing-room", "state", "brain_ledger.jsonl");
const IR_PATH = join(ROOT, "dressing-room", "state", "xray_graph.json");

let pass = 0, fail = 0; const fails = [];
const assert = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; fails.push({ n, d }); console.log(`  FAIL ${n}${d ? `\n         ${d}` : ""}`); } };

// The cost weights are brain.mjs's, restated here as the single arithmetic this
// organ performs. They are NOT this organ's to change.
export const W = { input: 1, cache_creation: 1.25, cache_read: 0.1, output: 5 };
const n = (x) => (Number.isFinite(+x) ? +x : 0);
export const partsOf = (r) => ({
  input: n(r.input_tokens), cache_creation: n(r.cache_creation_tokens),
  cache_read: n(r.cache_read_tokens), output: n(r.output_tokens),
});
export const rawOf = (r) => { const p = partsOf(r); return p.input + p.cache_creation + p.cache_read + p.output; };
export const spendOf = (r) => { const p = partsOf(r); return p.input * W.input + p.cache_creation * W.cache_creation + p.cache_read * W.cache_read + p.output * W.output; };
// C1b (14 Aug 2026, unleash Phase 0) — the MODEL factor, brain.mjs's likewise and
// likewise not this organ's to change: published list input prices as ratios.
// Reporting only; the governor's ceiling stays in the model-blind unit (the WHY is
// written out at brain.mjs's spendOfModelAware — moving it would re-scale a guard).
export const M = { haiku: 1, sonnet: 3, opus: 5 };
export const modelKey = (r) => { const m = String((r && r.model) || "").toLowerCase(); return m.includes("haiku") ? "haiku" : m.includes("opus") ? "opus" : m.includes("sonnet") ? "sonnet" : null; };
export const spendOfModelAware = (r) => { const k = modelKey(r); return spendOf(r) * (k ? M[k] : 3); };

export function rows(days) {
  if (!existsSync(LEDGER)) return [];
  const all = readFileSync(LEDGER, "utf8").split("\n").filter((l) => l.trim())
    .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  if (!days) return all;
  const cut = Date.now() - days * 86400000;
  return all.filter((r) => new Date(r.ts || 0).getTime() >= cut);
}

// ── (a) METER SELF-CONSISTENCY ───────────────────────────────────────────────
export function meter(rs) {
  const bad = [];
  for (const r of rs) {
    const raw = rawOf(r);
    const claimed = n(r.total_tokens);
    // A row with NO components at all is an old-format row, not a lie; it is
    // counted separately so the two failure modes never get conflated.
    const hasParts = ["input_tokens", "output_tokens", "cache_creation_tokens", "cache_read_tokens"].some((k) => r[k] !== undefined && r[k] !== null);
    if (!hasParts) { bad.push({ ts: r.ts, job: r.job, kind: "no-components", claimed, raw }); continue; }
    if (claimed !== raw) bad.push({ ts: r.ts, job: r.job, kind: claimed < raw ? "UNDER-COUNT" : "OVER-COUNT", claimed, raw, ratio: raw ? +(claimed / raw).toFixed(4) : null });
  }
  return bad;
}

// ── (b) THE ρ TABLE ──────────────────────────────────────────────────────────
export function rho(rs) {
  const by = new Map();
  for (const r of rs) {
    const k = String(r.job || r.kind || "?");
    if (!by.has(k)) by.set(k, { job: k, n: 0, weighted: 0, aware: 0, model: "?", output: 0, raw: 0, cache_read: 0 });
    const e = by.get(k), p = partsOf(r);
    e.n++; e.weighted += spendOf(r); e.aware += spendOfModelAware(r); e.output += p.output; e.raw += rawOf(r); e.cache_read += p.cache_read;
    if (r.model) e.model = r.model;
  }
  // ρ keeps its published definition (weighted ÷ output) so the boot-tax outlier
  // rule is unchanged; `rho_aware` is the same ratio in real money, and the table
  // is ORDERED by model-aware spend — a model-blind order puts the cheap lane first.
  return [...by.values()].map((e) => ({ ...e, rho: e.output ? +(e.weighted / e.output).toFixed(1) : Infinity, rho_aware: e.output ? +(e.aware / e.output).toFixed(1) : Infinity }))
    .sort((a, b) => b.aware - a.aware);
}

// ── THE SENSITIVITY RATIO — bug class 5, and it needs NO ORACLE ──────────────
// The budget governor once metered cheap cache-reads at FULL price and then
// self-tuned from that corrupt observation, starving live organs for weeks. The
// test for that whole class is a DERIVATIVE, not a value: scale one component
// ×10 and see how far the verdict moves. If cache_read moves the number as much
// as input does, the weighting is wrong — and you can say that WITHOUT knowing
// what the right answer is, which is exactly why this needs no oracle.
//
// The expected ratio is the weight ratio itself. cache_read is weighted 0.1 and
// input 1.0, so a ×10 scale of cache_read must move weighted spend by ONE TENTH
// as much as the same scale of input. Anything near parity means the meter has
// silently flattened its own price list.
export function sensitivity(rs) {
  const base = rs.reduce((s, r) => s + spendOf(r), 0);
  const scaled = (key, factor) => rs.reduce((s, r) => {
    const p = partsOf(r);
    p[key] = p[key] * factor;
    return s + p.input * W.input + p.cache_creation * W.cache_creation + p.cache_read * W.cache_read + p.output * W.output;
  }, 0);
  const d = (key) => (base ? (scaled(key, 10) - base) / base : 0);
  const dInput = d("input"), dCacheRead = d("cache_read"), dOutput = d("output"), dCacheWrite = d("cache_creation");
  // ratio of the OBSERVED sensitivities, against the ratio the weights promise
  const observed = dInput ? dCacheRead / dInput : null;
  return {
    base_weighted: Math.round(base),
    delta_per_10x: { input: +dInput.toFixed(4), cache_read: +dCacheRead.toFixed(4), cache_write: +dCacheWrite.toFixed(4), output: +dOutput.toFixed(4) },
    cache_read_vs_input: observed === null ? null : +observed.toFixed(4),
    // what the declared weights REQUIRE, given this corpus's own component mix
    healthy: observed === null ? null : observed < 1,
    note: observed === null ? "no input tokens in range — ratio undefined"
      : observed < 1 ? "cache_read moves the verdict LESS than input, as the 0.1 weight requires"
        : "⚠ cache_read moves the verdict as much as or MORE than input — the price list has flattened, which is the exact C1 fault",
  };
}

// ── (c) ASSEMBLY VS GENERATION ───────────────────────────────────────────────
// A candidate is an organ that SPAWNS an LLM and whose own inputs already exist
// on disk. That is not proof — it is the shortlist a human should look at, and
// the ρ beside it is the evidence for how much the conversion would be worth.
export function assembly(ir, rhoTable) {
  const out = [];
  for (const [organ, o] of Object.entries(ir.organs)) {
    const llm = o.spawns.filter((s) => s.kind === "llm");
    if (!llm.length) continue;
    const readsState = o.reads.filter((r) => /dressing-room\/state\//.test(r.path) && !r.fixture);
    out.push({
      organ,
      llm_sites: llm.length,
      state_inputs: readsState.length,
      // the whole prompt is assembled from files this organ already opened
      candidate: readsState.length >= 3,
    });
  }
  return out.sort((a, b) => b.state_inputs - a.state_inputs);
}

// ── REPORT ───────────────────────────────────────────────────────────────────
function report(days) {
  const rs = rows(days);
  const ir = existsSync(IR_PATH) ? JSON.parse(readFileSync(IR_PATH, "utf8")) : { organs: {} };
  const bad = meter(rs);
  const table = rho(rs);
  const totalW = table.reduce((s, e) => s + e.weighted, 0);
  const totalOut = table.reduce((s, e) => s + e.output, 0);
  const totalCR = table.reduce((s, e) => s + e.cache_read, 0);
  const totalRaw = table.reduce((s, e) => s + e.raw, 0);

  console.log(`=== TREASURY — TOKEN TRUTH${days ? ` (last ${days}d)` : " (all time)"} ===`);
  console.log(`${rs.length} ledger row(s) · weighted ${Math.round(totalW).toLocaleString("en-IN")} · output ${totalOut.toLocaleString("en-IN")} · overall ρ ${totalOut ? (totalW / totalOut).toFixed(1) : "—"}`);
  console.log(`cache_read is ${totalRaw ? ((totalCR / totalRaw) * 100).toFixed(1) : "0"}% of raw traffic (weighted at ${W.cache_read}, not ${W.input} — the C1 mis-weight)\n`);

  console.log(`── (a) METER SELF-CONSISTENCY — total_tokens vs Σ(four parts)  (${bad.length} bad row(s))`);
  const byKind = new Map();
  for (const b of bad) byKind.set(b.kind, (byKind.get(b.kind) || 0) + 1);
  for (const [k, c] of byKind) console.log(`   ${k.padEnd(14)} ${c}`);
  const worst = bad.filter((b) => b.kind !== "no-components").sort((a, b) => Math.abs(b.raw - b.claimed) - Math.abs(a.raw - a.claimed)).slice(0, 5);
  for (const b of worst) console.log(`   ${b.job} ${b.ts}  claimed ${b.claimed.toLocaleString("en-IN")} vs real ${b.raw.toLocaleString("en-IN")}`);

  console.log(`\n── (b) THE ρ TABLE — weighted spend ÷ output. High ρ + low output = BOOT TAX, not thinking.`);
  console.log(`   ordered by MODEL-AWARE spend (haiku ${M.haiku} · sonnet ${M.sonnet} · opus ${M.opus}) — model-blind, a cheap high-volume lane outranks an expensive one.`);
  console.log(`   ${"job".padEnd(24)} ${"model".padEnd(7)} ${"runs".padStart(5)} ${"weighted".padStart(14)} ${"aware".padStart(14)} ${"output".padStart(10)} ${"ρ".padStart(9)}`);
  for (const e of table.slice(0, 18)) {
    console.log(`   ${e.job.slice(0, 24).padEnd(24)} ${String(e.model).slice(0, 6).padEnd(7)} ${String(e.n).padStart(5)} ${Math.round(e.weighted).toLocaleString("en-IN").padStart(14)} ${Math.round(e.aware).toLocaleString("en-IN").padStart(14)} ${e.output.toLocaleString("en-IN").padStart(10)} ${(e.rho === Infinity ? "∞" : e.rho.toFixed(1)).padStart(9)}`);
  }
  // ⚠ NO RUN-COUNT GATE. The first version required n >= 3 and therefore printed
  // "0 lanes at ρ > 25" with 31.9 and 39.6 sitting in the table two lines above
  // it — a summary contradicting its own data, which is worse than no summary.
  // midday_digest_2/3 run ONCE A DAY; a once-a-day lane at ρ 40 is the finding,
  // not a sampling artefact. The run count is printed instead of gated on, so the
  // reader can weigh the evidence rather than have it silently withheld.
  const outliers = table.filter((e) => e.rho === Infinity || e.rho > 25);
  console.log(`\n   ${outliers.length} lane(s) at ρ > 25 — each is paying to boot, not to think:`);
  for (const e of outliers.slice(0, 10)) console.log(`      ${e.job}  ρ=${e.rho === Infinity ? "∞ (ZERO output tokens)" : e.rho}  (${e.n} run${e.n === 1 ? "" : "s"}, ${Math.round(e.weighted).toLocaleString("en-IN")} weighted)`);

  const sens = sensitivity(rs);
  console.log(`
── THE SENSITIVITY RATIO (bug class 5 — needs NO oracle, it is a derivative)`);
  console.log(`   scale each component ×10 and watch the verdict move:`);
  for (const [k, v] of Object.entries(sens.delta_per_10x)) console.log(`      ${k.padEnd(13)} +${(v * 100).toFixed(1)}%`);
  console.log(`   cache_read ÷ input = ${sens.cache_read_vs_input}  →  ${sens.note}`);

  const cand = assembly(ir, table).filter((a) => a.candidate);
  console.log(`\n── (c) ASSEMBLY-VS-GENERATION candidates (${cand.length})`);
  console.log(`   an organ that spawns an LLM while its inputs already sit on disk. B6 and B14`);
  console.log(`   were both this shape and both came out free, instant, and impossible to stale.`);
  for (const a of cand) console.log(`   ${a.organ}  ${a.llm_sites} llm site(s), ${a.state_inputs} state input(s) already on disk`);
  return { bad, table, outliers, cand };
}

// ── SELFTEST ─────────────────────────────────────────────────────────────────
function selftest() {
  console.log("=== treasury.mjs selftest ===\n");
  // KNOWN-ANSWER ARITHMETIC first — if the weights are wrong every number below
  // is wrong, and this repo has already shipped a governor that metered cheap
  // cache-reads at full price for weeks.
  const r = { input_tokens: 100, cache_creation_tokens: 200, cache_read_tokens: 1000, output_tokens: 10, total_tokens: 1310 };
  assert("raw = the four parts summed", rawOf(r) === 1310);
  assert("weighted applies input 1 / cache_write 1.25 / cache_read 0.1 / output 5",
    spendOf(r) === 100 * 1 + 200 * 1.25 + 1000 * 0.1 + 10 * 5, String(spendOf(r)));
  assert("a cache_read is NOT billed at input price (the live C1 mis-weight)", spendOf(r) < rawOf(r));

  // (a) the meter check must catch BOTH historical faults
  const under = { job: "dmn_rollout", ts: "2026-08-09T00:00:00Z", input_tokens: 500000, output_tokens: 1000, cache_creation_tokens: 0, cache_read_tokens: 0, total_tokens: 501 };
  assert("METER catches the DMN UNDER-COUNT shape (total written as a pair, not a sum)",
    meter([under]).some((b) => b.kind === "UNDER-COUNT"));
  const over = { job: "haiku_pulse", ts: "2026-08-09T00:00:00Z", input_tokens: 500, output_tokens: 200, cache_creation_tokens: 0, cache_read_tokens: 0, total_tokens: 32567 };
  assert("METER catches the haiku_pulse OVER-COUNT shape (a prompt-length GUESS written as spend)",
    meter([over]).some((b) => b.kind === "OVER-COUNT"));
  const good = { job: "ok", ts: "2026-08-09T00:00:00Z", input_tokens: 5, output_tokens: 5, cache_creation_tokens: 0, cache_read_tokens: 0, total_tokens: 10 };
  assert("…and passes an arithmetically honest row", meter([good]).length === 0);
  assert("an OLD-FORMAT row with no components is 'no-components', never reported as a lie",
    meter([{ job: "old", ts: "x", total_tokens: 99 }])[0].kind === "no-components");

  // (b) ρ
  const t = rho([{ job: "boot", input_tokens: 40000, output_tokens: 100, cache_creation_tokens: 0, cache_read_tokens: 0, total_tokens: 40100 }]);
  assert("ρ is weighted-spend ÷ output, so a boot-tax lane stands out", t[0].rho === +((40000 * 1 + 100 * 5) / 100).toFixed(1), JSON.stringify(t[0]));
  assert("a lane with ZERO output tokens is ρ=∞, not a divide-by-zero crash",
    rho([{ job: "z", input_tokens: 10, output_tokens: 0 }])[0].rho === Infinity);

  // (c) ρ is derived from COMPONENTS, never from the (possibly lying) total
  assert("ρ never consults total_tokens — a lying total cannot poison the table",
    rho([under])[0].weighted === 500000 * 1 + 1000 * 5);

  // (c2) THE MODEL FACTOR (14 Aug 2026) — the blindness that inverted the board.
  assert("model-aware = weighted × the model's price ratio (haiku 1 · sonnet 3 · opus 5)",
    spendOfModelAware({ ...r, model: "haiku" }) === spendOf(r) &&
    spendOfModelAware({ ...r, model: "sonnet" }) === spendOf(r) * 3 &&
    spendOfModelAware({ ...r, model: "opus" }) === spendOf(r) * 5);
  assert("an UNSTATED model is charged as sonnet (the default engine), never as free",
    spendOfModelAware({ ...r }) === spendOf(r) * 3 && modelKey({ model: "claude-opus-5" }) === "opus");   // models-literal-ok — selftest fixture: the CLAUDE-side id must map to the weight key
  // The live inversion in one fixture: a big haiku lane vs a smaller sonnet one.
  const inv = rho([
    { job: "pulse_like", model: "haiku", input_tokens: 0, output_tokens: 1000, cache_creation_tokens: 100000, cache_read_tokens: 0 },
    { job: "night_like", model: "sonnet", input_tokens: 0, output_tokens: 1000, cache_creation_tokens: 60000, cache_read_tokens: 0 },
  ]);
  assert("THE INVERSION: model-blind ranks the haiku lane first; the table now ranks the sonnet lane first",
    inv[0].job === "night_like" && inv[0].weighted < inv[1].weighted && inv[0].aware > inv[1].aware);

  // THE SENSITIVITY RATIO, with a KNOWN-ANSWER corpus. A row that is ALL
  // cache_read must move far less than the same scale on input; if this ever
  // reads ~1, the meter has flattened its price list and self-tune will learn
  // from a lie, which is precisely what happened for weeks.
  const mix = [{ input_tokens: 1000, cache_read_tokens: 1000, cache_creation_tokens: 0, output_tokens: 0, total_tokens: 2000 }];
  const sens = sensitivity(mix);
  assert("SENSITIVITY — a ×10 on cache_read moves the verdict LESS than a ×10 on input", sens.cache_read_vs_input < 1, JSON.stringify(sens));
  assert("…and it is the WEIGHT RATIO, measured: 0.1 vs 1.0 ⇒ one tenth the movement",
    Math.abs(sens.cache_read_vs_input - 0.1) < 0.001, String(sens.cache_read_vs_input));
  assert("…and the flattened-price-list case is DETECTED, not assumed away",
    sensitivity([{ input_tokens: 0, cache_read_tokens: 100, output_tokens: 0, cache_creation_tokens: 0 }]).healthy === null);

  // the live file must at least parse
  const live = rows(0);
  assert("the live ledger parses", Array.isArray(live));
  console.log(`\ntreasury: ${pass} passed, ${fail} failed`);
  if (fail) for (const f of fails) console.log(`  · ${f.n}${f.d ? `\n      ${f.d}` : ""}`);
  process.exit(fail ? 1 : 0);
}

function main() {
  const mode = (process.argv[2] || "selftest").toLowerCase();
  const days = Number(process.argv[3] || 0) || 0;
  if (mode === "selftest") return selftest();
  if (mode === "report") { report(days); return; }
  if (mode === "meter") { console.log(JSON.stringify(meter(rows(days)), null, 1)); return; }
  if (mode === "rho") { console.log(JSON.stringify(rho(rows(days)), null, 1)); return; }
  if (mode === "sensitivity") { console.log(JSON.stringify(sensitivity(rows(days)), null, 1)); return; }
  if (mode === "assembly") { const ir = JSON.parse(readFileSync(IR_PATH, "utf8")); console.log(JSON.stringify(assembly(ir, []), null, 1)); return; }
  console.log("treasury: report | meter | rho | sensitivity | assembly | selftest  [days]");
  process.exit(1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
