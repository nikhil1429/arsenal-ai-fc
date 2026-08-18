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
// CLI: node scripts/state.mjs [line|json|selftest]
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
  else { console.error(`state: unknown mode "${mode}" — modes: line | json | selftest`); process.exit(1); }
}
