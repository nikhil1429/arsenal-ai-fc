#!/usr/bin/env node
// ============================================================================
// state.mjs · ARSENAL AI FC — THE STATE LINE (ORGANISM_OVERHAUL 18 Aug 2026 §7.1)
//   ONE line, deterministic, ZERO LLM, READ-ONLY. Built on his word (R4: 60+ prompts
//   of "is everything pushed / working / aligned / can I start?" and no organ that
//   answered in one line at an anchor). LAW L10: verifiable to him in one line, every
//   anchor. LAW L7: nothing he must remember or read.
// ----------------------------------------------------------------------------
// THE LINE (every field is a fact off disk, or a stated "?" — never a guess):
//   pushed ✓/✗ (git ahead N · dirty M) · daemons k/N (as of the watchdog's last pass)
//   · suite ✓/✗ (last nightly sweep) · sitting: <open?> · next: <kickoff's first task>
//   · needs you: <n> card(s), first: <id line>
// WHERE IT RIDES (§7.1): the first line of `learnstate.mjs brief` (SessionStart +
//   PreCompact) · /matchday · organism-doctor step 0 · the morning sheet push. The
//   Gaffer's opening joins in Block 3 (the sitting brain).
// WHAT IT NEVER DOES: spawn a model · write a file · probe a port (it reads the
//   watchdog's own last pass, and SAYS how old that pass is — a probe here would be a
//   second daemon-monitor with a second opinion) · invent a number.
// PURE CORE: stateFrom(parts, now) → { line, json }. The live gatherers each return
//   a small fact object or a stated-unknown; the selftest drives the core with
//   fixtures and never touches git, the state dir or the network.
// SOLE WRITER of: nothing. WHO ELSE COULD ACT ON THIS OUTPUT? learnstate.mjs (brief
//   line 1) · brain.mjs (sheet push body) · the two skills · a future sitting.mjs open.
// CLI: node scripts/state.mjs [line|json|week [days] [--json]|selftest]   (week = the Block 9 board, read-only)
// ============================================================================
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { pickCard } from "./captains_call.mjs";   // the deck's own picker — the "first" card is the one HE would be dealt next

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STATE_DIR = join(ROOT, "dressing-room", "state");
const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const ageMin = (iso, now) => { const t = Date.parse(iso || ""); return Number.isFinite(t) ? Math.max(0, Math.round((now.getTime() - t) / 60000)) : null; };
const fmtAge = (m) => m === null ? "?" : m < 60 ? `${m}m` : m < 48 * 60 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`;
const clip = (s, n) => { const t = String(s || "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };

// ── THE GATHERERS (live; each returns a fact or a stated unknown) ─────────────
export function gitFacts({ cwd = ROOT, exec = execFileSync } = {}) {
  try {
    const opts = { cwd, encoding: "utf8", timeout: 8000, windowsHide: true, stdio: ["ignore", "pipe", "ignore"] };
    const dirty = String(exec("git", ["status", "--porcelain"], opts) || "").split("\n").filter((l) => l.trim()).length;
    let ahead = null;
    try { ahead = Number(String(exec("git", ["rev-list", "--count", "@{u}..HEAD"], opts) || "").trim()); if (!Number.isFinite(ahead)) ahead = null; } catch { ahead = null; }   // no upstream = unknown, not zero
    return { known: true, dirty, ahead };
  } catch { return { known: false }; }
}
export function daemonFacts({ stateDir = STATE_DIR, now = new Date() } = {}) {
  const w = readJson(join(stateDir, "daemon_watchdog.json"));
  if (!w || !w.ports || typeof w.ports !== "object") return { known: false };
  const names = Object.keys(w.ports);
  const up = names.filter((n) => w.ports[n] === true);
  return { known: true, up: up.length, total: names.length, down: names.filter((n) => w.ports[n] !== true), age_min: ageMin(w.at, now) };
}
export function suiteFacts({ stateDir = STATE_DIR, now = new Date() } = {}) {
  const w = readJson(join(stateDir, "watchman_last.json"));
  if (!w || !Array.isArray(w.findings)) return { known: false };
  const red = w.findings.find((f) => f && (f.id === "suite-red" || f.id === "suite-unrunnable"));
  return { known: true, ok: !red, why: red ? red.id : null, age_min: ageMin(w.at, now), reds: w.findings.filter((f) => f && f.level === "RED").map((f) => f.id) };
}
export function sittingFacts({ stateDir = STATE_DIR } = {}) {
  const s = readJson(join(stateDir, "sitting.json"));   // Block 3's file; until then, none
  if (!s || typeof s !== "object" || !s.id || s.closed_at) return { open: false };
  return { open: true, id: s.id, task: s.task || null, route: s.route || null, opened_at: s.opened_at || null };
}
export async function nextFacts({ stateDir = STATE_DIR, now = new Date() } = {}) {
  // The kickoff's own arbiter (learnstate.mjs nextup) is THE answer; sprint.json is
  // the fallback when it cannot be loaded. Dynamic import: learnstate imports
  // brain, and brain rides this file's line into the sheet push — a static edge
  // here would be a cycle.
  try {
    const ls = await import("./learnstate.mjs");
    if (typeof ls.nextup === "function") {
      const nu = ls.nextup(stateDir, now.getTime());
      if (nu && nu.winner && nu.winner.name !== "none") return { known: true, line: nu.winner.line, why: nu.winner.why || null };
    }
  } catch { /* fall through */ }
  const sp = readJson(join(stateDir, "sprint.json"));
  const cur = sp && sp.progress && sp.progress.current;
  if (cur && cur.id) return { known: true, line: `${cur.id} ${cur.task || ""}`.trim(), why: "sprint.json current (arbiter unavailable)" };
  return { known: false };
}
export function cardFacts({ stateDir = STATE_DIR, now = new Date() } = {}) {
  const s = readJson(join(stateDir, "captains_call.json"));
  if (!s || !Array.isArray(s.cards)) return { known: false };
  const today = localDate(now);
  const live = s.cards.filter((c) => c && !c.answer && !c.retired_at && !(c.sleep_until && c.sleep_until >= today));
  let first = null;
  try { first = pickCard(s, { today }); } catch { first = null; }
  // pickCard rests every card dealt today (A1's no-nagging-inside-a-day law), so on
  // a day he has already met the deck it returns null. The line still names what
  // waits — the least-dealt live card — and SAYS it rested, never re-deals it.
  if (!first && live.length) {
    const least = [...live].sort((a, b) => (a.dealt || []).length - (b.dealt || []).length || String(a.filed_at).localeCompare(String(b.filed_at)))[0];
    return { known: true, live: live.length, first: { id: least.id, line: least.line, rested: true } };
  }
  return { known: true, live: live.length, first: first ? { id: first.id, line: first.line } : null };
}

// ── THE PURE CORE ────────────────────────────────────────────────────────────
export function stateFrom({ git, daemons, suite, sitting, next, cards } = {}, now = new Date()) {
  const g = git || { known: false }, d = daemons || { known: false }, s = suite || { known: false }, si = sitting || { open: false }, n = next || { known: false }, c = cards || { known: false };
  const pushed = !g.known ? "pushed ? (git unreadable)"
    : (g.ahead === 0 && g.dirty === 0) ? "pushed ✓"
    : `pushed ✗ (${g.ahead === null ? "ahead ?" : `ahead ${g.ahead}`} · dirty ${g.dirty})`;
  const dm = !d.known ? "daemons ? (no watchdog pass)"
    : `daemons ${d.up}/${d.total}${d.down.length ? ` (down: ${d.down.join(",")})` : ""}${d.age_min !== null && d.age_min > 20 ? ` as of ${fmtAge(d.age_min)} ago` : ""}`;
  const su = !s.known ? "suite ? (no sweep)"
    : `suite ${s.ok ? "✓" : "✗"}${s.ok ? "" : ` (${s.why})`}${s.reds && s.reds.filter((r) => r !== "suite-red").length ? ` · ${s.reds.filter((r) => r !== "suite-red").length} other RED` : ""} (sweep ${fmtAge(s.age_min)} ago)`;
  const st = si.open ? `sitting: OPEN ${si.route ? si.route + " " : ""}${si.task ? "'" + clip(si.task, 30) + "'" : si.id}` : "sitting: none";
  const nx = n.known ? `next: ${clip(n.line, 70)}` : "next: ? (no kickoff)";
  const cd = !c.known ? "needs you: ?"
    : c.live === 0 ? "needs you: nothing"
    : `needs you: ${c.live} card${c.live === 1 ? "" : "s"}${c.first ? ` — ${c.first.id}: ${clip(c.first.line, 60)}${c.first.rested ? " (aaj deal ho chuka — kal ke anchor pe)" : ""}` : ""}`;
  const line = `STATE · ${pushed} · ${dm} · ${su} · ${st} · ${nx} · ${cd}`;
  return { line, json: { at: now.toISOString(), git: g, daemons: d, suite: s, sitting: si, next: n, cards: c } };
}
export async function liveState({ stateDir = STATE_DIR, now = new Date(), cwd = ROOT } = {}) {
  return stateFrom({
    git: gitFacts({ cwd }), daemons: daemonFacts({ stateDir, now }), suite: suiteFacts({ stateDir, now }),
    sitting: sittingFacts({ stateDir }), next: await nextFacts({ stateDir, now }), cards: cardFacts({ stateDir, now }),
  }, now);
}

// ── THE WEEK BOARD (OVERHAUL Block 9 · SEVEN REAL DAYS — measure, no build; 18 Aug 2026) ──
// ONE read-only verb, `node scripts/state.mjs week [days]`, that prints the seven numbers Block 9
// exists to measure — every one from an owner's own file, none guessed:
//   day N of 7        days since the commit that added FREEZE.md (freeze.mjs status → since)
//   sittings          sitting.mjs stats(days): sittings · turns · latency · weighted
//   contact_share     L1 — the largest model sits IN THE CONVERSATION: (sitting weighted + the
//                     Gaffer's own turns in brain_ledger) ÷ (that + every other ledger job)
//   gate              brain_out/gate.jsonl: wake/sleep transitions per lane in the window
//   dark spend        brain_ledger rows between 00:00 and 08:00 IST per day, weighted (the
//                     "≤ 3 lakh dark" line), beside the day total
//   intents           intent.mjs showLines(days): study vs build vs other
//   swallow           swallow.mjs ledger(days): rows · top sites
//   freeze            freeze.mjs status: guarded commits since · broken
//   awake             herd.mjs awakeModel: awake hours in the window · nights asleep at 03:20 IST
//                     (the dark lane's slot) — THE KENNEL's numbers (§17-A)
// Pure over injected rows (`weekBoard`), gathered live by `liveWeek()`; the selftest drives the
// pure half on fixtures. Everything heavy is imported LAZILY inside liveWeek so `state line`
// (line 1 of every session) stays as light as it was.
export const WEIGHT = { input: 1, cache_write: 1.25, cache_read: 0.1, output: 5 };   // brain.mjs SPEND weights, restated
export const CONTACT_JOBS = /^(gaffer_respond|gaffer_verify|gaffer_judge|gaffer_claim_audit|sitting_|dugout_respond|talk_)/;
const weighted = (r) => (Number(r.input_tokens) || 0) * WEIGHT.input + (Number(r.cache_creation_tokens) || 0) * WEIGHT.cache_write + (Number(r.cache_read_tokens) || 0) * WEIGHT.cache_read + (Number(r.output_tokens) || 0) * WEIGHT.output;
const istHour = (iso) => { const t = Date.parse(iso); if (!Number.isFinite(t)) return null; return ((t + 5.5 * 3600000) % 86400000 + 86400000) % 86400000 / 3600000; };
const istDay = (iso) => { const t = Date.parse(iso); if (!Number.isFinite(t)) return null; const d = new Date(t + 5.5 * 3600000); return d.toISOString().slice(0, 10); };

export function weekBoard({ now = new Date(), days = 7, freeze = null, sitting = null, ledger = [], gate = [], intents = [], swallow = null, awake = null, models = undefined, acts = undefined } = {}) {
  const since = now.getTime() - days * 86400000;
  const inWin = (iso) => { const t = Date.parse(iso || ""); return Number.isFinite(t) && t >= since && t <= now.getTime(); };
  // day N of 7
  let dayN = null, sinceFreeze = null;
  // 18 Aug 2026 evening (MODELS + ACTS Block 0): the freeze was DEFERRED by his word — FREEZE.md moved to the
  // archive, guard dormant — but Block 9's seven days keep counting from the SAME anchor (the commit that
  // added FREEZE.md; freeze.mjs status keeps `since` armed or not). So the day counter reads since_at, not armed.
  if (freeze && freeze.since_at) { const t = Date.parse(freeze.since_at); if (Number.isFinite(t)) { sinceFreeze = t; dayN = Math.floor((now.getTime() - t) / 86400000); } }   // day 0 = the freeze day; the seventh REAL day after it is day 7
  // ledger: contact vs the rest, dark vs day, per IST day
  const L = ledger.filter((r) => r && inWin(r.ts));
  let contactLedger = 0, other = 0, dark = 0, total = 0;
  const perDay = {};
  for (const r of L) {
    const w = weighted(r);
    total += w;
    if (CONTACT_JOBS.test(String(r.job || ""))) contactLedger += w; else other += w;
    const h = istHour(r.ts);
    const d = istDay(r.ts);
    if (d) { perDay[d] = perDay[d] || { total: 0, dark: 0, rows: 0 }; perDay[d].total += w; perDay[d].rows++; }
    if (h !== null && h < 8) { dark += w; if (d) perDay[d].dark += w; }
  }
  const sittingW = sitting && Number.isFinite(sitting.weighted) ? sitting.weighted : 0;
  const contact = contactLedger + sittingW;
  const denom = contact + other;
  const contactShare = denom > 0 ? contact / denom : null;
  // gate transitions per lane
  const G = gate.filter((r) => r && inWin(r.ts));
  const lanes = {};
  for (const r of G) { const k = r.lane || r.job || "?"; lanes[k] = lanes[k] || { awake: 0, asleep: 0 }; if (r.to === "awake" || r.state === "awake") lanes[k].awake++; else if (r.to === "asleep" || r.state === "asleep") lanes[k].asleep++; }
  const wakes = Object.values(lanes).reduce((a, b) => a + b.awake, 0), sleeps = Object.values(lanes).reduce((a, b) => a + b.asleep, 0);
  // intents study vs build
  const kinds = { study: 0, build: 0, other: 0 };
  for (const l of intents) { const s = String(l); if (/\bstudy\b/i.test(s)) kinds.study++; else if (/\bbuild\b/i.test(s)) kinds.build++; else if (/^\s*20\d\d-\d\d-\d\d/.test(s)) kinds.other++; }
  // awake + the kennel numbers: nights (00:00–08:00 IST) with < 15 min awake around 03:20 IST
  let awakeH = null, nightsAsleepAtSlot = null, nights = 0;
  if (awake && awake.available) {
    awakeH = awake.awakeHoursSince(since);
    nightsAsleepAtSlot = 0;
    for (let i = 0; i <= days; i++) {
      // 03:20 IST on each night inside the window = 21:50 UTC the previous calendar day
      const slot = new Date(now.getTime()); slot.setUTCHours(21, 50, 0, 0); slot.setUTCDate(slot.getUTCDate() - i);
      if (slot.getTime() > now.getTime() || slot.getTime() < since) continue;
      nights++;
      const around = awake.awakeHoursSince(slot.getTime() - 15 * 60000) - awake.awakeHoursSince(slot.getTime() + 15 * 60000);
      if (around < 0.05) nightsAsleepAtSlot++;
    }
  }
  return {
    at: now.toISOString(), days, dayN, sinceFreeze: sinceFreeze ? new Date(sinceFreeze).toISOString() : null,
    sitting: sitting ? { sittings: sitting.sittings, turns: sitting.turns, weighted: sitting.weighted, heads: sitting.heads } : null,
    contact: { share: contactShare, contact_weighted: Math.round(contact), of_which_sitting: Math.round(sittingW), of_which_gaffer_ledger: Math.round(contactLedger), other_weighted: Math.round(other) },
    ledger: { rows: L.length, weighted: Math.round(total), dark_weighted: Math.round(dark), per_day: perDay },
    gate: { transitions: G.length, wakes, sleeps, lanes },
    intents: kinds,
    swallow: swallow ? { rows: swallow.runs ?? swallow.rows ?? null, n: swallow.n ?? null, top: (swallow.top || []).slice(0, 3) } : null,
    freeze: freeze ? { armed: !!freeze.armed, deferred: !!freeze.deferred, guarded_commits: (freeze.commits || []).length, broken: (freeze.broken || []).length, carded: freeze.carded, exempt: freeze.exempt } : null,
    models: models === undefined ? undefined : (models && models.line ? models.line : null),   // LAW M (18 Aug 2026): models.mjs boardLine — one line, roles → live models, keys ok n/N
    acts: acts === undefined ? undefined : (acts && acts.line ? acts.line : null),               // LAW A (18 Aug 2026): acts.mjs boardLine — acts n · ok · failed · undone · doors
    awake: { hours: awakeH === null ? null : +awakeH.toFixed(1), nights, nights_asleep_at_0320: nightsAsleepAtSlot },
  };
}
export function weekLines(b) {
  const L = [];
  const lakh = (n) => n === null || n === undefined ? "?" : (n / 100000).toFixed(2) + " lakh";
  L.push(`WEEK BOARD · ${b.at.slice(0, 16)}Z · last ${b.days} d · ${b.dayN === null ? "freeze not yet committed — day 0" : b.dayN === 0 ? `the freeze day (day 0 of 7 · ${b.sinceFreeze.slice(0, 10)})` : `day ${Math.min(b.dayN, 7)} of 7 since the freeze commit (${b.sinceFreeze.slice(0, 10)}${b.freeze && b.freeze.deferred ? " · freeze DEFERRED by his word, the count stands" : ""})`}`);
  L.push(`  sittings   ${b.sitting ? `${b.sitting.sittings} sitting(s) · ${b.sitting.turns} turn row(s) · weighted ${lakh(b.sitting.weighted)} · heads ${b.sitting.heads && b.sitting.heads.length ? b.sitting.heads.join(", ") : "—"}` : "? (sitting log unreadable)"}`);
  L.push(`  contact    L1 share ${b.contact.share === null ? "? (no spend in window)" : Math.round(b.contact.share * 100) + "%"} — contact ${lakh(b.contact.contact_weighted)} (sitting ${lakh(b.contact.of_which_sitting)} + gaffer ledger ${lakh(b.contact.of_which_gaffer_ledger)}) vs other ${lakh(b.contact.other_weighted)}`);
  L.push(`  spend      ${b.ledger.rows} ledger row(s) · weighted ${lakh(b.ledger.weighted)} · DARK (00–08 IST) ${lakh(b.ledger.dark_weighted)} · per day: ${Object.entries(b.ledger.per_day).sort().map(([d, v]) => `${d.slice(5)} ${lakh(v.total)}${v.dark ? ` (dark ${lakh(v.dark)})` : ""}`).join(" · ") || "—"}`);
  L.push(`  gate       ${b.gate.transitions} transition(s) · ${b.gate.wakes} wake · ${b.gate.sleeps} sleep · lanes: ${Object.entries(b.gate.lanes).map(([k, v]) => `${k} ${v.awake}↑${v.asleep}↓`).join(" · ") || "—"}`);
  L.push(`  intents    study ${b.intents.study} · build ${b.intents.build} · other ${b.intents.other}`);
  L.push(`  swallow    ${b.swallow ? `${b.swallow.n ?? "?"} silent catch(es) across ${b.swallow.rows ?? "?"} run(s)${b.swallow.top.length ? " — top: " + b.swallow.top.map((t) => `${String(t.organ || "").replace(/\.mjs$/, "")} · ${t.why} ×${t.n}`).join(" | ") : ""}` : "? (ledger unreadable)"}`);
  if (b.models !== undefined) L.push(`  ${b.models || "gemini: never probed — `node scripts/models.mjs probe`"}`);   // LAW M — the model board, one line
  if (b.acts !== undefined) L.push(`  ${b.acts || "acts: none yet (his next explicit ask → a receipt — `node scripts/acts.mjs status`)"}`);   // LAW A — the act lane, one line
  L.push(`  freeze     ${b.freeze ? (b.freeze.armed ? `IN FORCE · ${b.freeze.guarded_commits} guarded commit(s) · carded ${b.freeze.carded} · exempt ${b.freeze.exempt} · BROKEN ${b.freeze.broken}` : b.freeze.deferred ? "DEFERRED by his word 18 Aug 2026 (guard dormant · `node scripts/freeze.mjs status`)" : "NOT in force") : "? (git unreadable)"}`);
  L.push(`  awake      ${b.awake.hours === null ? "? (no presence log)" : `${b.awake.hours} h awake in ${b.days} d · nights asleep at the 03:20 IST dark slot: ${b.awake.nights_asleep_at_0320}/${b.awake.nights} — THE KENNEL (§17-A): the dark lane catches up on wake and keys its day by the slot (herd risks 0), so a night asleep costs nothing but latency; default stays "not now" unless a lane must run WHILE he sleeps`}`);
  return L;
}
export async function liveWeek({ days = 7, now = new Date() } = {}) {
  const [{ status: freezeStatus }, { stats: sittingStats }, { showLines }, { ledger: swallowLedger }, { awakeModel }, { board: modelsBoard, boardLine: modelsLine }, { stats: actsStats, boardLine: actsLine }] = await Promise.all([
    import("./freeze.mjs"), import("./sitting.mjs"), import("./intent.mjs"), import("./swallow.mjs"), import("./herd.mjs"), import("./models.mjs"), import("./acts.mjs"),
  ]);
  const safe = (f, dflt = null) => { try { return f(); } catch { return dflt; } };
  const freeze = safe(() => { const s = freezeStatus(); if (s && s.since) { try { s.since_at = execFileSync("git", ["show", "-s", "--format=%aI", s.since], { cwd: ROOT, encoding: "utf8", timeout: 8000, windowsHide: true }).trim(); } catch { s.since_at = null; } } return s; });
  const sitting = safe(() => sittingStats({ days }));
  const readL = (p) => { try { return readFileSync(p, "utf8").split("\n").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; } };
  const ledger = readL(join(STATE_DIR, "brain_ledger.jsonl"));
  const gate = readL(join(STATE_DIR, "brain_out", "gate.jsonl"));
  const intents = safe(() => showLines({ days, now }), []);
  const swallow = safe(() => swallowLedger({ sinceMs: days * 86400000, now: now.getTime(), top: 5 }));
  const awake = safe(() => awakeModel({ sinceMs: now.getTime() - days * 86400000, now: now.getTime() }));
  const models = safe(() => ({ line: modelsLine(modelsBoard()) }), null);   // LAW M (18 Aug 2026)
  const acts = safe(() => ({ line: actsLine(actsStats(days)) }), null);       // LAW A (18 Aug 2026)
  return weekBoard({ now, days, freeze, sitting, ledger, gate, intents, swallow, awake, models, acts });
}

// ── SELFTEST — fixtures only; no git, no state dir, no network ───────────────
function selftest() {
  let pass = 0, fail = 0;
  const assert = (n, c) => { if (c) pass++; else fail++; console.log(`  ${c ? "✓" : "✗"} ${n}`); };
  const NOW = new Date("2026-08-18T05:00:00Z");
  const full = stateFrom({
    git: { known: true, dirty: 0, ahead: 0 },
    daemons: { known: true, up: 4, total: 5, down: ["brain"], age_min: 3 },
    suite: { known: true, ok: true, why: null, age_min: 300, reds: [] },
    sitting: { open: false },
    next: { known: true, line: "Re-Jirah R2 'tokenization' (56d ripe) — shuru: `node scripts/deep.mjs due`", why: "proof purana" },
    cards: { known: true, live: 2, first: { id: "c9", line: "Doubt cold-readable nahi (embeddings): \"Map kaunsa hai?\" — abhi theek karein?" } },
  }, NOW);
  assert("LINE — one line, starts with STATE, every field present in the §7.1 order",
    !full.line.includes("\n") && /^STATE · pushed ✓ · daemons 4\/5 \(down: brain\) · suite ✓ \(sweep 5h ago\) · sitting: none · next: Re-Jirah R2 'tokenization'/.test(full.line) && /needs you: 2 cards — c9: Doubt cold-readable/.test(full.line));
  assert("LINE — stays short: a long kickoff line and a long card line are clipped, the line stays under 320 chars",
    full.line.length < 320 && /…/.test(full.line));
  const dirty = stateFrom({ git: { known: true, dirty: 3, ahead: 2 } }, NOW);
  assert("PUSHED — dirty or ahead ⇒ ✗ with both numbers; no upstream ⇒ 'ahead ?' never 0",
    /pushed ✗ \(ahead 2 · dirty 3\)/.test(dirty.line) && /ahead \?/.test(stateFrom({ git: { known: true, dirty: 0, ahead: null } }, NOW).line));
  const unknown = stateFrom({}, NOW);
  assert("UNKNOWN IS SAID, NEVER GUESSED — no git, no watchdog, no sweep, no kickoff, no deck ⇒ each field reads '?' with its reason; nothing invents a ✓",
    /pushed \? \(git unreadable\)/.test(unknown.line) && /daemons \? \(no watchdog pass\)/.test(unknown.line) && /suite \? \(no sweep\)/.test(unknown.line)
    && /next: \? \(no kickoff\)/.test(unknown.line) && /needs you: \?/.test(unknown.line) && !/✓/.test(unknown.line));
  assert("DAEMONS — a stale watchdog pass says how old it is (a fact from 3h ago is labelled, not passed off as now); a fresh one is not",
    /daemons 2\/5 \(down: brain,cortex,thalamus\) as of 3h ago/.test(stateFrom({ daemons: { known: true, up: 2, total: 5, down: ["brain", "cortex", "thalamus"], age_min: 180 } }, NOW).line)
    && !/as of/.test(full.line));
  assert("SUITE — a red sweep names why and counts the OTHER reds beside it; a green sweep with other REDs still counts them",
    /suite ✗ \(suite-red\) · 2 other RED/.test(stateFrom({ suite: { known: true, ok: false, why: "suite-red", age_min: 60, reds: ["suite-red", "task-errors", "time-unmeasured"] } }, NOW).line)
    && /suite ✓ · 1 other RED/.test(stateFrom({ suite: { known: true, ok: true, why: null, age_min: 60, reds: ["task-errors"] } }, NOW).line));
  assert("SITTING — an open sitting shows route + task; a closed/absent one reads none",
    /sitting: OPEN FORGE 'hallucinations'/.test(stateFrom({ sitting: { open: true, id: "s1", route: "FORGE", task: "hallucinations" } }, NOW).line)
    && /sitting: none/.test(stateFrom({ sitting: { open: false } }, NOW).line));
  assert("CARDS — zero live cards reads 'nothing' (the ANCHOR LAW's happy case), one card is singular, a deck fully dealt today names the least-dealt card and SAYS it rested",
    /needs you: nothing/.test(stateFrom({ cards: { known: true, live: 0, first: null } }, NOW).line)
    && /needs you: 1 card — c1: x/.test(stateFrom({ cards: { known: true, live: 1, first: { id: "c1", line: "x" } } }, NOW).line)
    && /needs you: 3 cards — c9: y \(aaj deal ho chuka/.test(stateFrom({ cards: { known: true, live: 3, first: { id: "c9", line: "y", rested: true } } }, NOW).line));
  assert("JSON — the machine face carries every part verbatim + the instant",
    full.json.at === NOW.toISOString() && full.json.daemons.up === 4 && full.json.cards.first.id === "c9" && full.json.next.why === "proof purana");
  // the gatherers' honesty on a bare directory (no state files) — no throw, stated unknown
  const bare = join(__dirname);   // scripts/ has no state files
  assert("GATHERERS — on a directory with no state files every gatherer returns known:false / open:false and none throws",
    daemonFacts({ stateDir: bare }).known === false && suiteFacts({ stateDir: bare }).known === false && sittingFacts({ stateDir: bare }).open === false && cardFacts({ stateDir: bare }).known === false);
  assert("GIT — an exec that throws reads known:false (never a fabricated pushed ✓)",
    gitFacts({ exec: () => { throw new Error("no git"); } }).known === false
    && gitFacts({ exec: (cmd, args) => args[0] === "status" ? " M a.txt\n?? b\n" : "1\n" }).dirty === 2
    && gitFacts({ exec: (cmd, args) => args[0] === "status" ? "" : "1\n" }).ahead === 1);
  // Block 9 — THE WEEK BOARD on fixtures (pure; the live gatherer is `state week`)
  {
    const N = new Date("2026-08-25T10:00:00Z");   // 15:30 IST
    const iso = (hAgo) => new Date(N.getTime() - hAgo * 3600000).toISOString();
    const b = weekBoard({
      now: N, days: 7,
      freeze: { armed: true, since_at: "2026-08-18T12:30:00+05:30", commits: [{}, {}], broken: [], carded: 1, exempt: 1 },
      sitting: { sittings: 4, turns: 120, weighted: 200000, heads: [14011, 15000] },
      ledger: [
        { ts: iso(2), job: "gaffer_respond", input_tokens: 100, output_tokens: 1000, cache_creation_tokens: 0, cache_read_tokens: 0 },      // 13:30 IST · contact 5100
        { ts: iso(3), job: "dmn_rollout", input_tokens: 0, output_tokens: 20000, cache_creation_tokens: 0, cache_read_tokens: 0 },        // 12:30 IST · other 100000, day
        { ts: new Date("2026-08-24T21:00:00Z").toISOString(), job: "night_coach", input_tokens: 0, output_tokens: 10000, cache_creation_tokens: 0, cache_read_tokens: 0 },   // 02:30 IST ⇒ dark 50000
        { ts: iso(24 * 9), job: "dmn_rollout", input_tokens: 0, output_tokens: 99999999, cache_creation_tokens: 0, cache_read_tokens: 0 }, // outside the window
      ],
      gate: [{ ts: iso(5), lane: "dmn", state: "asleep" }, { ts: iso(4), lane: "night_coach", state: "awake" }, { ts: iso(24 * 8), lane: "old", state: "awake" }],
      intents: ["HIS LAST SESSIONS' ASKS", "2026-08-20 code · study · 3 turns", "2026-08-21 code · build · x", "2026-08-22 voice · study"],
      swallow: { runs: 3, n: 7, top: [{ organ: "brain.mjs", why: "readJson: x", n: 5 }] },
      awake: { available: true, awakeHoursSince: (t) => Math.max(0, (N.getTime() - t) / 3600000) * 0.5 },   // awake half of every span ⇒ never asleep at 03:20
    });
    assert("WEEK — day N is counted from the commit that added FREEZE.md (18 Aug ⇒ 25 Aug is day 7)", b.dayN === 7);
    assert("WEEK — contact_share = (sitting + gaffer ledger) ÷ (that + other): (200000+5100)/(205100+150000) ≈ 58%, and the halves are printed",
      Math.abs(b.contact.share - 205100 / 355100) < 0.001 && b.contact.of_which_sitting === 200000 && b.contact.of_which_gaffer_ledger === 5100 && b.contact.other_weighted === 150000);
    assert("WEEK — dark spend is the 00–08 IST slice (night_coach at 02:30 IST counts, dmn at 12:30 IST does not) and a row outside the window is ignored",
      b.ledger.dark_weighted === 50000 && b.ledger.weighted === 155100 && b.ledger.rows === 3);
    assert("WEEK — gate transitions in the window per lane (1 wake · 1 sleep; the 8-day-old row is out)", b.gate.wakes === 1 && b.gate.sleeps === 1 && b.gate.lanes.dmn.asleep === 1);
    assert("WEEK — intents study vs build counted off the owner's lines (2 study · 1 build)", b.intents.study === 2 && b.intents.build === 1);
    assert("WEEK — the kennel numbers: 7 nights checked, 0 asleep at 03:20 when the machine is awake half of every span; freeze 2 guarded/0 broken; swallow 7 across 3",
      b.awake.nights === 7 && b.awake.nights_asleep_at_0320 === 0 && b.freeze.guarded_commits === 2 && b.freeze.broken === 0 && b.swallow.n === 7);
    const lines = weekLines(b);
    assert("WEEK — the board prints nine lines, the first names day 7 of 7, and every unknown reads '?' never a number",
      lines.length === 9 && /day 7 of 7/.test(lines[0]) && /L1 share 58%/.test(lines[2]) && /\? \(no presence log\)/.test(weekLines(weekBoard({ now: N, awake: { available: false, awakeHoursSince: () => null } })).slice(-1)[0]));
  }
  assert("READ-ONLY — this file has no write call and no model call (grep-held: the line is a fact, never a product)",
    !/writeFileSync|appendFileSync|renameSync|claude -p|claudeGen/.test(readFileSync(new URL(import.meta.url), "utf8").replace(/^\/\/.*$/gm, "").replace(/assert\("READ-ONLY[^\n]*\n[^\n]*/m, "")));
  console.log(`\nstate selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2] || "line";
  if (mode === "selftest") process.exit(selftest() ? 0 : 1);
  else if (mode === "json") liveState().then((s) => console.log(JSON.stringify(s.json, null, 1)));
  else if (mode === "line") liveState().then((s) => console.log(s.line));
  else if (mode === "week") liveWeek({ days: Math.max(1, Number(process.argv[3]) || 7) }).then((b) => { if (process.argv.includes("--json")) console.log(JSON.stringify(b, null, 1)); else for (const l of weekLines(b)) console.log(l); });
  else { console.error(`state: unknown mode "${mode}" — modes: line | json | week [days] | selftest`); process.exit(1); }
}
