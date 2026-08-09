#!/usr/bin/env node
// ============================================================================
// gate_tune.mjs · ARSENAL AI FC — THE GATE-TUNE APPLIER (LADDER B5, 9 Aug 2026)
// ----------------------------------------------------------------------------
// WHY: nightshift's wind tunnel files a full Boot-Room-grammar mutation for
//   thalamus_config.json → tiers every time the gate drifts out of band — and
//   then the proposal DIES ON DISK, because thalamus_config is approval-gated
//   with no owner script and validateMutation (bootroom.mjs:109) rejects any
//   target outside forge_profile.json. Twelve gate_tune reports and six
//   wind_tunnel proposals sat unreachable by any hand but a manual edit.
//   The ladder's B5 (his blanket 9 Aug haan: "okay let's implement every
//   thing") gives the lane an OWNER: the proposal reaches him as ONE card,
//   his haan applies it HERE with a dated receipt, and the Boot Room's own
//   discipline — review window, min-events auto-extend, out-of-band
//   AUTO-REVERT — keeps the gate honest afterward. The gate still NEVER
//   retunes itself: every apply rides a card he answered.
//
// OWNER STATUS: this file is the DECLARED OWNER of thalamus_config.json's
//   `tiers` edits made under the wind-tunnel lane, and the SOLE WRITER of
//   gate_tune_ledger.jsonl. The receipt note pattern follows thalamus_config's
//   own `_gemini_lane_2026_08_09` precedent (P7): a gated file edited under a
//   ruling carries the ruling in itself, dated.
//
// LAWS:
//   · SERIAL — one live tier mutation at a time (bootroom.mjs:121's law).
//   · LAYERING — the old tiers are frozen verbatim into
//     `_gate_tune_legacy["tiers@<date>"]` before the new ones land.
//   · DRIFT GUARD — apply refuses if the config's tiers no longer equal the
//     proposal's diff.old (the config moved since the tunnel measured it).
//   · THE WINDOW — score: age < review_after_days ⇒ waiting; events under
//     metric.min_events ⇒ auto-extend +7d (a mutation judged on five events
//     is a coin flip — bootroom.mjs:140's law verbatim); in band ⇒ kept;
//     out of band ⇒ AUTO-REVERT via revert_diff, out loud.
//   · METRIC IS LIVE, NEVER REPLAYED — the salience ledger's own recorded
//     tier-2 rows (real wakes) over the window, not a re-simulation. Every
//     number here comes from the proposal itself or the ledger; none is
//     minted in this file.
//
// MODES: apply <wind_tunnel_*.json | latest> · score · status · selftest
// WRITES: thalamus_config.json (tiers, under the ruling above) ·
//         gate_tune_ledger.jsonl (sole)
// READS:  brain_out/nightshift/wind_tunnel_*.json · salience_ledger.jsonl
// ============================================================================

import { readFileSync, writeFileSync, existsSync, readdirSync, renameSync, mkdirSync, appendFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = process.env.ARSENAL_GATETUNE_STATE_DIR || join(__dirname, "..", "dressing-room", "state");
const CONFIG = () => join(STATE_DIR, "thalamus_config.json");
const LEDGER = () => join(STATE_DIR, "gate_tune_ledger.jsonl");
const SALIENCE = () => join(STATE_DIR, "salience_ledger.jsonl");
const TUNNEL_DIR = () => join(STATE_DIR, "brain_out", "nightshift");

const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const readLines = (p) => { const o = []; try { for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch { } } } catch { } return o; };
const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2));
  renameSync(tmp, path);
}

// ── PURE CORE ────────────────────────────────────────────────────────────────

// Bootroom-style validation, tuned to THIS lane's one legal target. Every
// required field is the wind tunnel's own grammar (nightshift.mjs:462-478).
export function validateProposal(p) {
  const errs = [];
  if (!p || typeof p !== "object") return ["no proposal"];
  for (const k of ["id", "target", "diff", "evidence", "predicted_effect", "metric", "review_after_days", "revert_diff"]) {
    if (p[k] == null) errs.push(`missing ${k}`);
  }
  if (p.target && p.target !== "thalamus_config.json → tiers") errs.push(`target must be "thalamus_config.json → tiers" (got "${p.target}") — this owner applies NOTHING else`);
  if (p.diff && (!p.diff.old || !p.diff.new)) errs.push("diff needs old AND new");
  if (p.revert_diff && !p.revert_diff.new) errs.push("revert_diff needs new");
  if (p.metric && (!p.metric.name || !Number.isFinite(p.metric.min_events) || !Number.isFinite(p.metric.window_days) || !Array.isArray(p.metric.band))) {
    errs.push("metric needs {name, min_events, window_days, band}");
  }
  if (Number.isFinite(p.review_after_days) && p.review_after_days < 7) errs.push("review_after_days must be ≥ 7 (bootroom's floor)");
  return errs;
}

// The one live (applied, unsettled) mutation in the ledger, or null.
export function liveMutation(rows) {
  const applied = new Map();
  for (const r of rows || []) {
    if (r.kind === "apply") applied.set(r.id, r);
    if (["kept", "reverted"].includes(r.kind)) applied.delete(r.id);
    if (r.kind === "extended" && applied.has(r.id)) applied.get(r.id).review_after_days = r.review_after_days;
  }
  const live = [...applied.values()];
  return live.length ? live[live.length - 1] : null;
}

export function applyProposal(p, cfg, ledgerRows, now = new Date()) {
  const errs = validateProposal(p);
  if (errs.length) return { ok: false, why: `invalid proposal: ${errs.join("; ")}` };
  const live = liveMutation(ledgerRows);
  if (live) return { ok: false, why: `SERIAL LAW: ${live.id} is still in its window (applied ${live.applied_on}) — score it out before a new apply` };
  if (!cfg || !cfg.tiers) return { ok: false, why: "thalamus_config has no tiers" };
  const cur = cfg.tiers;
  const drifted = Object.keys(p.diff.old).filter(k => cur[k] !== p.diff.old[k]);
  if (drifted.length) return { ok: false, why: `DRIFT GUARD: config tiers moved since the tunnel measured them (${drifted.map(k => `${k}: ${cur[k]} ≠ ${p.diff.old[k]}`).join(", ")}) — re-run the tunnel, never apply a stale diff` };
  const date = localDate(now);
  const next = { ...cfg };
  next._gate_tune_legacy = { ...(cfg._gate_tune_legacy || {}), [`tiers@${date}`]: { ...cur } };
  next.tiers = { ...cur, ...p.diff.new };
  next._gate_tune_receipt = {
    at: now.toISOString(), id: p.id,
    ruling: "his 9 Aug 2026 ladder haan (blanket) + the captains_call card answered haan — gate_tune.mjs is the declared owner of this edit",
    window_days: p.review_after_days,
    revert: "gate_tune.mjs score auto-reverts if wakes/day sits outside the band after the window",
  };
  const row = {
    ts: now.toISOString(), kind: "apply", id: p.id, applied_on: date,
    diff: p.diff, revert_diff: p.revert_diff, metric: p.metric, review_after_days: p.review_after_days,
  };
  return { ok: true, cfg: next, row };
}

// LIVE measurement: real recorded gate decisions since applied_on.
// A wake is a row the gate actually promoted to tier 2 (gateTuneReport's own
// predicate, nightshift.mjs:496 — mirrored, not invented).
export function measureWindow(salRows, appliedOn, now = new Date()) {
  const since = (salRows || []).filter(r => r && String(r.ts || "").slice(0, 10) >= appliedOn);
  const days = new Set(since.map(r => String(r.ts || "").slice(0, 10)));
  const wakes = since.filter(r => r.tier === 2).length;
  const nDays = Math.max(1, days.size);
  return { events: since.length, days: nDays, wakes, wakes_per_day: Math.round((wakes / nDays) * 100) / 100 };
}

export function scoreMutation(live, salRows, now = new Date()) {
  const ageDays = (now - new Date(live.applied_on)) / 86400000;
  if (ageDays < live.review_after_days) {
    return { action: "waiting", why: `day ${Math.floor(ageDays)}/${live.review_after_days} of the window` };
  }
  const m = measureWindow(salRows, live.applied_on, now);
  if (m.events < live.metric.min_events) {
    return { action: "extended", review_after_days: live.review_after_days + 7, measured: m,
      why: `${m.events}/${live.metric.min_events} events — a mutation judged on too few events is a coin flip; window +7d` };
  }
  const [lo, hi] = live.metric.band;
  const inBand = m.wakes_per_day >= lo && m.wakes_per_day <= hi;
  return inBand
    ? { action: "kept", measured: m, why: `${m.wakes_per_day} wakes/day inside [${lo}, ${hi}] over ${m.days} day(s)` }
    : { action: "reverted", measured: m, why: `${m.wakes_per_day} wakes/day OUTSIDE [${lo}, ${hi}] over ${m.days} day(s) — reverting to the proposal's own revert_diff` };
}

export function applyRevert(cfg, live, now = new Date()) {
  const next = { ...cfg, tiers: { ...cfg.tiers, ...live.revert_diff.new } };
  next._gate_tune_receipt = {
    ...(cfg._gate_tune_receipt || {}), reverted_at: now.toISOString(), reverted_id: live.id,
    revert_why: "out-of-band after the window — the auto-revert the apply promised",
  };
  return next;
}

// Newest proposal file on disk, or a named one.
export function findProposalFile(nameOrLatest) {
  if (nameOrLatest && nameOrLatest !== "latest") {
    return existsSync(nameOrLatest) ? nameOrLatest : join(TUNNEL_DIR(), nameOrLatest);
  }
  try {
    const fs = readdirSync(TUNNEL_DIR()).filter(f => /^wind_tunnel_\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
    return fs.length ? join(TUNNEL_DIR(), fs[fs.length - 1]) : null;
  } catch { return null; }
}

// ── CLI ──────────────────────────────────────────────────────────────────────
function main() {
  const mode = process.argv[2] || "status";
  const now = new Date();
  if (mode === "selftest") process.exit(selftest() ? 0 : 1);

  if (mode === "apply") {
    const f = findProposalFile(process.argv[3] || "latest");
    if (!f || !existsSync(f)) { console.error("gate_tune: no wind_tunnel proposal file found"); process.exit(1); }
    const p = readJson(f);
    const r = applyProposal(p, readJson(CONFIG()), readLines(LEDGER()), now);
    if (!r.ok) { console.error(`gate_tune: NOT applied — ${r.why}`); process.exit(1); }
    writeAtomic(CONFIG(), r.cfg);
    appendFileSync(LEDGER(), JSON.stringify(r.row) + "\n");
    console.log(`gate_tune: APPLIED ${p.id} → tiers ${JSON.stringify(r.cfg.tiers)} (receipt written; old tiers frozen in _gate_tune_legacy).`);
    console.log(`gate_tune: window ${p.review_after_days}d, band [${p.metric.band}] — score runs nightly; out-of-band auto-reverts. Restart the thalamus to load the new tiers (its own note says it never hot-reloads).`);
    return;
  }

  if (mode === "score") {
    const rows = readLines(LEDGER());
    const live = liveMutation(rows);
    if (!live) { console.log("gate_tune: no live mutation — nothing in a window (a measured absence, not a failure)"); return; }
    // E3: the salience journal rolls at 2 MB — the window reads both generations.
    const v = scoreMutation(live, [...readLines(SALIENCE() + ".1"), ...readLines(SALIENCE())], now);
    if (v.action === "waiting") { console.log(`gate_tune: ${live.id} waiting — ${v.why}`); return; }
    if (v.action === "extended") {
      appendFileSync(LEDGER(), JSON.stringify({ ts: now.toISOString(), kind: "extended", id: live.id, review_after_days: v.review_after_days, measured: v.measured, why: v.why }) + "\n");
      console.log(`gate_tune: ${live.id} EXTENDED — ${v.why}`);
      return;
    }
    if (v.action === "reverted") {
      const cfg = readJson(CONFIG());
      writeAtomic(CONFIG(), applyRevert(cfg, live, now));
    }
    appendFileSync(LEDGER(), JSON.stringify({ ts: now.toISOString(), kind: v.action, id: live.id, measured: v.measured, why: v.why }) + "\n");
    console.log(`gate_tune: ${live.id} ${v.action.toUpperCase()} — ${v.why}`);
    return;
  }

  if (mode === "status") {
    const rows = readLines(LEDGER());
    const live = liveMutation(rows);
    const f = findProposalFile("latest");
    console.log(`gate_tune: ${rows.length} ledger row(s) · live mutation: ${live ? `${live.id} (applied ${live.applied_on}, window ${live.review_after_days}d)` : "none"} · newest proposal: ${f ? basename(f) : "none"}`);
    return;
  }

  console.log("gate_tune.mjs — apply <wind_tunnel_*.json|latest> | score | status | selftest");
}

// ── SELFTEST — hermetic, injected, every check can fail ──────────────────────
function selftest() {
  let pass = 0, fail = 0;
  const assert = (n, c) => { if (c) { pass++; console.log(`  ✓ ${n}`); } else { fail++; console.log(`  ✗ ${n}`); } };
  console.log("== gate_tune selftest ==\n");
  const T0 = new Date("2026-08-09T10:00:00+05:30");
  const PROP = {
    id: "wt-2026-08-09-tau1_base", target: "thalamus_config.json → tiers",
    diff: { old: { tau0: 0.25, tau1_base: 0.4, epsilon: 0.1, budget_k: 0.35 }, new: { tau0: 0.25, tau1_base: 0.36, epsilon: 0.08, budget_k: 0.35 } },
    evidence: ["replay"], predicted_effect: "wakes/day toward band",
    metric: { name: "wakes_per_day_band", min_events: 200, window_days: 14, band: [1, 8] },
    review_after_days: 14, revert_diff: { new: { tau0: 0.25, tau1_base: 0.4, epsilon: 0.1, budget_k: 0.35 } },
    status: "proposed", proposed_on: "2026-08-09", engine: "wind_tunnel",
  };
  const CFG = { tiers: { tau0: 0.25, tau1_base: 0.4, epsilon: 0.1, budget_k: 0.35 }, refractory_min: 45, wake_cap_per_day: 15 };

  assert("validate — the tunnel's own grammar passes; a foreign target is refused",
    validateProposal(PROP).length === 0
    && validateProposal({ ...PROP, target: "forge_profile.json → x" }).some(e => /NOTHING else/.test(e))
    && validateProposal({ ...PROP, review_after_days: 3 }).some(e => /≥ 7/.test(e)));

  const a1 = applyProposal(PROP, CFG, [], T0);
  assert("apply — tiers move, old tiers frozen verbatim in _gate_tune_legacy, receipt carries the ruling + window",
    a1.ok && a1.cfg.tiers.tau1_base === 0.36
    && a1.cfg._gate_tune_legacy["tiers@2026-08-09"].tau1_base === 0.4
    && /9 Aug 2026 ladder haan/.test(a1.cfg._gate_tune_receipt.ruling)
    && a1.cfg._gate_tune_receipt.window_days === 14 && a1.row.kind === "apply");
  assert("apply — SERIAL LAW: a second apply refuses while the first sits in its window",
    applyProposal(PROP, a1.cfg, [a1.row], T0).ok === false
    && /SERIAL LAW/.test(applyProposal(PROP, a1.cfg, [a1.row], T0).why));
  assert("apply — DRIFT GUARD: config tiers that moved since the tunnel measured refuse the stale diff",
    applyProposal(PROP, { tiers: { ...CFG.tiers, tau1_base: 0.44 } }, [], T0).ok === false
    && /DRIFT GUARD/.test(applyProposal(PROP, { tiers: { ...CFG.tiers, tau1_base: 0.44 } }, [], T0).why));

  const mkSal = (n, day, tier2every) => Array.from({ length: n }, (_, i) => ({
    ts: `${day}T${String(8 + (i % 12)).padStart(2, "0")}:00:00Z`, S: 0.5, tier: i % tier2every === 0 ? 2 : 1, key: `k${i}`,
  }));
  const WIN = [];
  for (let d = 9; d <= 23; d++) WIN.push(...mkSal(20, `2026-08-${String(d).padStart(2, "0")}`, 5)); // 4 wakes/day, 300 events
  assert("score — inside the window ⇒ waiting, and it says which day",
    scoreMutation(a1.row, WIN, new Date("2026-08-12T10:00:00Z")).action === "waiting");
  assert("score — window over + enough events + in band ⇒ KEPT with the measured number",
    (() => { const v = scoreMutation(a1.row, WIN, new Date("2026-08-24T10:00:00Z"));
      return v.action === "kept" && v.measured.wakes_per_day === 4 && /inside/.test(v.why); })());
  assert("score — too few events ⇒ EXTENDED +7d, never judged on a coin flip",
    (() => { const v = scoreMutation(a1.row, WIN.slice(0, 100), new Date("2026-08-24T10:00:00Z"));
      return v.action === "extended" && v.review_after_days === 21; })());
  assert("score — out of band ⇒ REVERTED, and applyRevert restores the proposal's own revert_diff + stamps why",
    (() => {
      const flood = []; for (let d = 9; d <= 23; d++) flood.push(...mkSal(20, `2026-08-${String(d).padStart(2, "0")}`, 2)); // 10 wakes/day
      const v = scoreMutation(a1.row, flood, new Date("2026-08-24T10:00:00Z"));
      const back = applyRevert(a1.cfg, a1.row, T0);
      return v.action === "reverted" && back.tiers.tau1_base === 0.4 && /auto-revert/.test(back._gate_tune_receipt.revert_why);
    })());
  assert("ledger — liveMutation: apply opens, kept/reverted closes, extended stretches the window",
    liveMutation([a1.row]) !== null
    && liveMutation([a1.row, { kind: "kept", id: PROP.id }]) === null
    && liveMutation([a1.row, { kind: "extended", id: PROP.id, review_after_days: 21 }]).review_after_days === 21);

  console.log(`\ngate_tune selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { readLines as _readLines };
