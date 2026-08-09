#!/usr/bin/env node
// ============================================================================
// captains_call.mjs · ARSENAL AI FC — THE CAPTAIN'S CALL (his word, one card)
// ----------------------------------------------------------------------------
// WHAT: the ADHD-PI decision surface (built 7 Aug 2026, his ruling, verbatim:
//   "my adhd pi brain will not remember it much and it is irritating … i get
//   solid reports and what to do what not to do as well but i do not want to
//   read it" · "how will i know when to do what").
//   The split that answers both: REPORTS ARE MACHINE-FACE — they stay on disk,
//   whole, for the Claude in the session to read. Anything that needs the
//   CAPTAIN'S WORD becomes ONE one-line CARD with a recommendation, dealt at an
//   anchor he already hits (session start · /matchday · /full-time). He answers
//   haan / na / baad — one syllable — and THIS organ runs the owner's own CLI.
//   He never reads a report, never remembers a ritual, never learns a command.
//
// THE ANCHOR LAW (engraved here because this organ IS its enforcement):
//   "If a thing needs the captain, it rides an anchor he already hits.
//    If it cannot ride an anchor, it does not need the captain."
//
// LAWS:
//   · sole writer of captains_call.json — nothing else touches it.
//   · PULL-DERIVE: every source is READ-ONLY (zero code and zero writes in the
//     source organs); every haan/na dispatch goes through the owner's own CLI
//     (owners-only law) — this file never edits another organ's state.
//   · ONE card per deal, silent otherwise. A list is a wall; a wall is unread.
//   · "baad" sleeps the card until the NEXT LOCAL DAY — no nagging inside a day.
//   · silent for headless organs (ARSENAL_ORGAN=1) and while a FRESH forge
//     session is open (his rule #12 — no system work mid-concept; cards wait
//     at /matchday, /full-time, or a session with no concept in motion).
//   · priority is an ORDER, never a number (no invented thresholds):
//     hand-filed (deliberate + rare) → staged drifts oldest-first (teaching
//     integrity) → market proposal (intelligence, ~weekly cadence).
//
// SOURCES v1 — only things that genuinely need HIS word, nothing else:
//   1. staged teaching drifts   teaching_contract.json .staged  (the proven
//      confirm/dismiss pattern this design generalizes)
//   2. the Scout's market proposal   brain_out/market/<date>.md (his 7 Aug
//      ruling: "it is important" — haan = the session Claude opens + walks it
//      in 3 lines; the captain still never reads the file)
//   3. hand-filed cards   `file --line "…"` (the audit's captain's-list class —
//      a session files the ask instead of parking it in a scratchpad he will
//      never open). v1 hand-filed cards carry NO exec — haan retires the card
//      and the session acts on his word; safety first, wiring later if earned.
//   4. THE MISSIONS DESK (outward loop, 8 Aug 2026) — missions.json (scout.mjs
//      owns it; this only reads): the fire-nudge while the full-syllabus audit
//      sits un-fired, and one diff-review card per ingested return (canon =
//      his word — the card is how the diff reaches him, per Ruling 6).
//   5. benchmark regression — benchmark.json (benchmark.mjs owns): a bucket's
//      counted evidence went DOWN since the last run (Ruling 5 max-flow edge:
//      "captains_call card on bucket regression").
//
// WRITES: dressing-room/state/captains_call.json (sole).
// READS (RO): teaching_contract.json · forge_session.json · brain_out/market/ ·
//   missions.json · benchmark.json · tape_room.json.
// MODES: sync · deal · answer <id> <haan|na|baad> · file --line "…" · status ·
//        list · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, readdirSync, renameSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
// ARSENAL_CALL_STATE_DIR is the selftest's seam and NOTHING else's (same pattern
// as teaching_audit.mjs's ARSENAL_AUDIT_STATE_DIR — proven there).
const STATE_DIR = process.env.ARSENAL_CALL_STATE_DIR || join(__dirname, "..", "dressing-room", "state");
const CALL = join(STATE_DIR, "captains_call.json");
const CONTRACT = join(STATE_DIR, "teaching_contract.json");
const FORGE = join(STATE_DIR, "forge_session.json");
const MARKET_DIR = join(STATE_DIR, "brain_out", "market");
const CONTRACT_MJS = join(__dirname, "teaching_contract.mjs");

// Mirrored from forge_session.mjs:115 (STALE_HOURS), with the same comment
// discipline as teaching_audit's CORE_AXES mirror: one constant that has never
// moved, and the owner's boot line + this deal-guard would disagree out loud if
// it ever does.
const FORGE_STALE_HOURS = 18;

const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const readLinesJson = (p) => { const o = []; try { for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch { } } } catch { } return o; };
const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const clip = (s, n) => { const t = String(s || "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(obj, null, 2));
  renameSync(tmp, path);
}

function loadState() {
  const j = readJson(CALL);
  if (j && typeof j === "object" && Array.isArray(j.cards)) return j;
  return { version: 1, next_id: 1, cards: [] };
}

// ── PURE CORE (no disk — the selftest never needs a file) ─────────────────────

// Derive the card set from the sources. Existing cards keep their identity (key),
// their deal history and their answers; sources only ADD new cards or RETIRE ones
// resolved at the source (he confirmed a drift directly — the card must not
// outlive the thing it asked about).
export function deriveCards(state, { staged = [], marketFile = null, marketHonest = "", gate2 = null, missions = null, bench = null, tiers = null,
  rejirah = null, gem = null, claudeOut = null, oura = null, geminiLogin = null, gatetune = null, pendingFacts = [], m2 = null, canonPatches = [], staleFacts = [] } = {}, now = new Date()) {
  const s = { ...state, cards: state.cards.map((c) => ({ ...c })) };
  const byKey = new Map(s.cards.map((c) => [c.key, c]));
  const ts = now.toISOString();

  // 1. staged teaching drifts — one card per staged entry, keyed by its `at`.
  const stagedAts = new Set(staged.map((e) => e.at));
  for (const e of staged) {
    const key = `drift:${e.at}`;
    if (byKey.has(key)) continue;
    s.cards.push({
      id: `c${s.next_id++}`, key, source: "teaching_contract.staged",
      line: `Drift report [${e.id}]: ${clip(e.why, 110)} — sahi hai?`,
      dispatch: { kind: "staged", at: e.at },
      filed_at: ts, dealt: [], answer: null, answered_at: null, sleep_until: null,
      retired_at: null, resolution: null,
    });
  }
  // auto-retire drift cards whose staged entry is gone (resolved at the source).
  for (const c of s.cards) {
    if (c.source === "teaching_contract.staged" && !c.retired_at && !c.answer
        && !stagedAts.has(c.dispatch.at)) {
      c.retired_at = ts; c.resolution = "resolved-at-source (staged entry gone — his word landed elsewhere)";
    }
  }

  // 1b. ONE Gate-2 flagged doubt (full-organism audit P5.2, 7 Aug 2026). 17 of 112
  // tape-room doubts violate the cold-reader standard (cryptic/meta/fragment) and are
  // therefore EXCLUDED from rematches — correct, but it left them with no repair path:
  // a list he will never open. This is the anchor-lawful flow instead: ONE doubt, one
  // line, at an anchor he already hits; haan = the session walks the rewrite with him
  // right now (≤3 lines) and hands him the gist patch. Serialized: a new card derives
  // only when no gate2 card is LIVE, so the 17 arrive one at a time, never as a list.
  // The 17 is a REGEX FLOOR, not the truth — the card says so ("regex floor").
  // HONEST LEAK, on the record: a haan answered but never pasted to the gist retires
  // the card while the doubt stays flagged; it gets a second lap only after every
  // other flagged doubt has had its first — the queue moves, nothing loops forever.
  if (gate2 && gate2.doubt) {
    const g = gate2.doubt;
    const key = `gate2:${g.capsule}:${g.doubt_index}`;
    const liveGate2 = s.cards.some((c) => c.source === "tape_room.gate2" && !c.answer && !c.retired_at);
    if (!byKey.has(key) && !liveGate2) {
      s.cards.push({
        id: `c${s.next_id++}`, key, source: "tape_room.gate2",
        line: `Doubt cold-readable nahi (${g.capsule}): "${clip(g.q_verbatim, 70)}" — abhi 1 line mein saath theek karein? (${gate2.fixed_or_carded + 1}/${gate2.total}+, regex floor)`,
        dispatch: { kind: "none" },
        filed_at: ts, dealt: [], answer: null, answered_at: null, sleep_until: null,
        retired_at: null, resolution: null,
      });
    }
  }

  // 3. THE MISSIONS DESK (outward loop, 8 Aug 2026) — PULL-DERIVE off scout's
  // missions.json. Two card shapes, both anchor-lawful:
  //   fire-nudge — while the full-syllabus audit sits staged with ZERO returns;
  //     haan = the session opens M01 and walks the fire with him right now.
  //     Auto-retires the moment any return lands (resolved at the source).
  //   diff-review — one per ingested return; haan = the session walks the diff
  //     in ≤3 lines. Canon changes only on his word (Ruling 6). Audit diff
  //     cards auto-retire when `mission audit-close` records that word.
  if (missions && Array.isArray(missions.missions)) {
    const rows = missions.missions;
    const auditRows = rows.filter((r) => r.type === "audit");
    const anyReturn = rows.some((r) => r.ingested_at);
    const auditClosed = !!(missions.syllabus_audit && missions.syllabus_audit.closed_at);
    if (auditRows.length && !anyReturn && !auditClosed) {
      const key = "mission:audit-fire";
      if (!byKey.has(key)) {
        s.cards.push({
          id: `c${s.next_id++}`, key, source: "missions.desk",
          line: `Outward: full-syllabus audit taiyaar (M01–M04, Gemini Deep Research) — abhi M01 saath fire karein?`,
          dispatch: { kind: "open", path: auditRows[0].file },
          filed_at: ts, dealt: [], answer: null, answered_at: null, sleep_until: null,
          retired_at: null, resolution: null,
        });
      }
    }
    for (const c of s.cards) {
      if (c.key === "mission:audit-fire" && !c.retired_at && !c.answer && (anyReturn || auditClosed)) {
        c.retired_at = ts; c.resolution = "resolved-at-source (a return landed — the fire happened)";
      }
    }
    for (const r of rows.filter((r) => r.ingested_at)) {
      if (r.type === "audit" && auditClosed) continue;
      const key = `mission:diff:${r.id}`;
      if (byKey.has(key)) continue;
      s.cards.push({
        id: `c${s.next_id++}`, key, source: "missions.desk",
        line: `Mission ${r.id} wapas aa gaya — diff 3 line mein sunein? (canon badlega sirf aapke word se)`,
        dispatch: { kind: "open", path: `dressing-room/state/${r.report}` },
        filed_at: ts, dealt: [], answer: null, answered_at: null, sleep_until: null,
        retired_at: null, resolution: null,
      });
    }
    if (auditClosed) {
      for (const c of s.cards) {
        if (/^mission:diff:M0[1-4]$/.test(c.key) && !c.answer && !c.retired_at) {
          c.retired_at = ts; c.resolution = "resolved-at-source (audit closed on his word)";
        }
      }
    }
  }

  // 3b. TRUST-TIER RATIFICATION (D2, 9 Aug 2026) — scorer.mjs computes when a
  // market qualifies for no-look and sets pending_ratification:true, and its own
  // header says "the captain ratifies once, out loud" — but NOTHING ever brought
  // the ask to him, so the door (`scorer.mjs ratify <type>`) could never be
  // walked through. One card per pending tier; haan = this organ walks the door.
  if (tiers && Array.isArray(tiers.tiers)) {
    for (const t of tiers.tiers.filter((x) => x && x.pending_ratification === true)) {
      const key = `trust:ratify:${t.type}`;
      if (byKey.has(key)) continue;
      s.cards.push({
        id: `c${s.next_id++}`, key, source: "trust_tiers.ratify",
        line: `Market "${t.type}" ${t.n} din se ${Math.round((t.hit_rate || 0) * 100)}% sahi — ab NO-LOOK (bina jhaanke) chale? Aapka word chahiye.`,
        dispatch: { kind: "ratify", type: t.type },
        filed_at: ts, dealt: [], answer: null, answered_at: null, sleep_until: null,
        retired_at: null, resolution: null,
      });
    }
    // a tier that stopped pending (ratified elsewhere, or fell below the bar)
    // takes its unanswered card with it.
    const pending = new Set((tiers.tiers || []).filter((x) => x && x.pending_ratification === true).map((x) => `trust:ratify:${x.type}`));
    for (const c of s.cards) {
      if (c.source === "trust_tiers.ratify" && !c.retired_at && !c.answer && !pending.has(c.key)) {
        c.retired_at = ts; c.resolution = "resolved-at-source (tier no longer pending)";
      }
    }
  }

  // 4. benchmark regression (Ruling 5 edge) — one card per regression DAY;
  // the line carries the first regression verbatim, count of the rest beside it.
  if (bench && Array.isArray(bench.regressions) && bench.regressions.length && bench.date) {
    const key = `benchmark:regression:${bench.date}`;
    if (!byKey.has(key)) {
      s.cards.push({
        id: `c${s.next_id++}`, key, source: "benchmark.regression",
        line: `Benchmark: ${clip(bench.regressions[0], 95)}${bench.regressions.length > 1 ? ` (+${bench.regressions.length - 1} aur)` : ""} — sunein?`,
        dispatch: { kind: "none" },
        filed_at: ts, dealt: [], answer: null, answered_at: null, sleep_until: null,
        retired_at: null, resolution: null,
      });
    }
  }

  // 2. the newest market proposal — one card per FILE, ever.
  if (marketFile) {
    const key = `market:${marketFile}`;
    if (!byKey.has(key)) {
      s.cards.push({
        id: `c${s.next_id++}`, key, source: "brain_out/market",
        line: `Scout ka market proposal (${marketFile.replace(/\.md$/, "")})${marketHonest ? `: "${clip(marketHonest, 90)}"` : ""} — 3 line mein sunna hai?`,
        dispatch: { kind: "open", path: `dressing-room/state/brain_out/market/${marketFile}` },
        filed_at: ts, dealt: [], answer: null, answered_at: null, sleep_until: null,
        retired_at: null, resolution: null,
      });
    }
  }

  // ── LADDER B (9 Aug 2026) — the card batch ─────────────────────────────────
  const mint = (key, source, line, dispatch) => {
    if (byKey.has(key)) return;
    const card = {
      id: `c${s.next_id++}`, key, source, line: clip(line, 155), dispatch,
      filed_at: ts, dealt: [], answer: null, answered_at: null, sleep_until: null,
      retired_at: null, resolution: null,
    };
    s.cards.push(card); byKey.set(key, card);
  };
  const retireAtSource = (pred, why) => {
    for (const c of s.cards) {
      if (pred(c) && !c.retired_at && !c.answer) { c.retired_at = ts; c.resolution = `resolved-at-source (${why})`; }
    }
  };

  // B1 — a Re-Jirah round closed but not in the gist. SERIALIZED (one at a time,
  // oldest close first — the gate2 pattern): the paste is a sit-down moment, not a
  // list. Retire-at-source runs FIRST so a landed paste frees the seat for the
  // next pending round in the SAME sync, not the one after.
  const stillPending = new Set(((rejirah && rejirah.pending) || []).map((p) => `rejirah:${p.concept}:${p.due}`));
  retireAtSource((c) => c.source === "rejirah.pending" && !stillPending.has(c.key), "the paste landed — the mirror carries it");
  if (rejirah && Array.isArray(rejirah.pending) && rejirah.pending.length) {
    const p = rejirah.pending[0];
    const liveRe = s.cards.some((c) => c.source === "rejirah.pending" && !c.answer && !c.retired_at);
    if (!liveRe) {
      mint(`rejirah:${p.concept}:${p.due}`, "rejirah.pending",
        `Re-Jirah ${p.concept} R${p.round} band hua par gist mein NAHI — patch abhi saath paste karein? (5 organs tab tak round ko andekha)`,
        { kind: "none" });
    }
  }

  // B2 — Gem sync overdue (physio's own 7d bar). One card per stamp-epoch.
  if (gem) {
    mint(`gem:sync:${gem.stamp}`, "gem.sync_due",
      `EXAMINER Gem ${gem.days == null ? "kabhi" : gem.days + " din se"} sync nahi hua — abhi /gem-sync bol dein? (5 min, Chrome)`,
      { kind: "none" });
  }
  retireAtSource((c) => c.source === "gem.sync_due" && !gem, "the Gem got synced");

  // B3 — the claude CLI is logged out: the whole overnight brain is dark until
  // his hands do the /login. One card per logged-out day.
  if (claudeOut) {
    mint(`claude:logout:${claudeOut.day}`, "brain.token_vitals",
      `claude CLI LOGGED OUT hai — terminal kholke \`claude\` chalao, phir /login. Raat ka poora brain tab tak andhera.`,
      { kind: "none" });
  }
  retireAtSource((c) => c.source === "brain.token_vitals" && !claudeOut, "the CLI is logged in again");

  // B4a — Oura token dead (auth-FATAL): the body read is dark until re-auth.
  if (oura) {
    mint(`oura:auth:${oura.day}`, "oura.auth_fatal",
      `Oura token MAR gaya (401) — 2 min: \`node oura_auth.mjs\` phir se chalana hoga. Body-read tab tak andhera.`,
      { kind: "none" });
  }
  retireAtSource((c) => c.source === "oura.auth_fatal" && !oura, "a verdict landed — the token works");

  // B4b — Gemini CLI needs its one-time login (dead-streak ≥ 5, brain's own bar).
  if (geminiLogin) {
    mint(`gemini:login:${geminiLogin.day}`, "brain.gemini_login",
      `Gemini CLI ${geminiLogin.streak} baar lagatar fail — ek baar terminal mein \`gemini\` chala ke login kar dein? Raat ke renders ruke hain.`,
      { kind: "none" });
  }
  retireAtSource((c) => c.source === "brain.gemini_login" && !geminiLogin, "a gemini run succeeded");

  // B5 — the wind tunnel's un-applied proposal; haan = gate_tune.mjs apply (the
  // declared owner), then a 14d watch with out-of-band auto-revert.
  if (gatetune) {
    mint(`gatetune:${gatetune.id}`, "nightshift.gate_tune",
      `Gate-tune ${gatetune.id}: ${clip(gatetune.effect, 70)} — apply karein? (${gatetune.window} din watch, out-of-band auto-revert)`,
      { kind: "gate-tune", file: gatetune.file });
  }

  // B6 — an MCP-staged identity fact awaits HIS word. SERIALIZED; haan =
  // hippocampus promote (canon), na = drop-pending (never canon). Retire first
  // (same same-sync seat-freeing as B1).
  const stillStaged = new Set((pendingFacts || []).map((p) => `fact:${p.ts}`));
  retireAtSource((c) => c.source === "hippocampus.pending_fact" && !stillStaged.has(c.key), "the staged fact settled elsewhere");
  if (Array.isArray(pendingFacts) && pendingFacts.length) {
    const liveFact = s.cards.some((c) => c.source === "hippocampus.pending_fact" && !c.answer && !c.retired_at);
    if (!liveFact) {
      const p = pendingFacts[0];
      mint(`fact:${p.ts}`, "hippocampus.pending_fact",
        `Yaad rakhun, canon mein? "${clip(p.text, 85)}"`,
        { kind: "pending-fact", at: p.ts });
    }
  }

  // B7 — the M-2 review of manager/system.md, one section per card, SERIALIZED,
  // resumed from #6 PRECEDENCE. A settled card (his haan walked it, or his na
  // declined it) is the reviewed-up-to marker — it lives in the keys themselves.
  if (m2 && Array.isArray(m2.sections)) {
    const liveM2 = s.cards.some((c) => c.source === "manager.m2_review" && !c.answer && !c.retired_at);
    if (!liveM2) {
      const next = m2.sections.find((sec) => !byKey.has(`m2:review:${sec}`));
      if (next) {
        mint(`m2:review:${next}`, "manager.m2_review",
          `Manager system.md §${next.replace(/-/g, " ")} — 5-10 min line-by-line review abhi saath karein? (M-2 ka bacha hua kaam)`,
          { kind: "open", path: "dressing-room/manager/system.md" });
      }
    }
  }

  // B9 — the audit-close card: fires when the LAST audit diff card RESOLVES
  // (sealed ordering — never on the 4th ingest itself).
  if (missions && Array.isArray(missions.missions)) {
    const auditRows2 = missions.missions.filter((r) => r.type === "audit");
    const allIngested = auditRows2.length > 0 && auditRows2.every((r) => r.ingested_at);
    const closed2 = !!(missions.syllabus_audit && missions.syllabus_audit.closed_at);
    const diffCards = s.cards.filter((c) => /^mission:diff:/.test(c.key) && auditRows2.some((r) => c.key === `mission:diff:${r.id}`));
    const allDiffsSettled = diffCards.length === auditRows2.length && diffCards.every((c) => c.answer || c.retired_at);
    if (allIngested && !closed2 && allDiffsSettled) {
      mint("mission:audit-close", "missions.desk",
        `Audit ke saare diff nipat gaye — audit-close bol dein? Aapki ek line (\`--note\`) benchmark ka gate kholti hai.`,
        { kind: "none" });
    }
    if (closed2) retireAtSource((c) => c.key === "mission:audit-close", "audit closed on his word");
  }

  // B10 — stale canon clauses; the card lives exactly as long as the stale text does.
  for (const cp of canonPatches || []) {
    mint(`canon:${cp.key}`, "canon.patch", cp.line, { kind: "open", path: "learning-layer/PROJECT_OS.md" });
  }
  const liveCanon = new Set((canonPatches || []).map((cp) => `canon:${cp.key}`));
  retireAtSource((c) => c.source === "canon.patch" && !liveCanon.has(c.key), "the canon text was patched");

  // B11 — the two dead 17-Jul facts; haan = hippocampus forget <id>, na = it stays.
  for (const f of staleFacts || []) {
    mint(`fact:forget:${f.id}`, "hippocampus.stale_fact",
      `Purana fact (17 Jul, ab jhootha): "${clip(f.text, 75)}" — bhool jaun?`,
      { kind: "forget-fact", id: f.id });
  }
  const liveStale = new Set((staleFacts || []).map((f) => `fact:forget:${f.id}`));
  retireAtSource((c) => c.source === "hippocampus.stale_fact" && !liveStale.has(c.key), "the fact is already gone");

  return s;
}

// Pick THE one card to deal. Order (an ORDER, not a number): hand-filed →
// staged drifts oldest-first → gate2 doubt-repairs → the outward tier
// (missions desk · benchmark · market — oldest filed first within the tier).
// Sleeping and answered cards never deal.
export function pickCard(state, { today }) {
  // B5 (9 Aug 2026): was `>=`, which kept a card asleep THROUGH its wake day —
  // "baad" promised tomorrow and delivered the day after. sleep_until IS the wake day.
  const live = state.cards.filter((c) => !c.answer && !c.retired_at
    && !(c.sleep_until && c.sleep_until > today));
  // LADDER B (9 Aug 2026): teaching/identity integrity (gate2 · rejirah · his
  // facts) shares the tier under the drifts; everything operational rides the
  // outward tier. Still an ORDER, never a number.
  const rank = (c) => (c.source === "hand-filed" ? 0
    : c.source === "teaching_contract.staged" ? 1
    : ["tape_room.gate2", "rejirah.pending", "hippocampus.pending_fact", "hippocampus.stale_fact"].includes(c.source) ? 2 : 3);
  // LADDER A1 (9 Aug 2026): the c9 monopoly. A serialized card nobody answered used
  // to deal at EVERY anchor forever while the outward tier waited behind it, never
  // seen once. Two rules end that, and neither invents a number:
  //   · a card dealt at any anchor TODAY rests for the rest of the day — the same
  //     day-unit "baad" already uses ("no nagging inside a day"), so the deck
  //     rotates to the next card at the next anchor instead of repeating itself;
  //   · among the rested deck, the LEAST-DEALT-EVER card goes first — every card
  //     gets its first hearing before any card gets its second; rank still breaks
  //     ties, so hand-filed leads any fresh deck exactly as before.
  const dealtToday = (c) => (c.dealt || []).some((t) => localDate(new Date(t)) === today);
  const fresh = live.filter((c) => !dealtToday(c));
  fresh.sort((a, b) => (a.dealt || []).length - (b.dealt || []).length
    || rank(a) - rank(b) || String(a.filed_at).localeCompare(String(b.filed_at)));
  return fresh[0] || null;
}

// LADDER A1 — the word alone, when the id would be noise. `answer haan` with no id
// binds to the card most recently DEALT (that is the one he just heard); if nothing
// was ever dealt but exactly one card is live, that one. Ambiguity errors out loud —
// a guessed dispatch would put his word on the wrong ask.
export function resolveAnswerArgs(state, a, b) {
  const WORDS = ["haan", "na", "baad"];
  if (WORDS.includes(a) && !b) {
    const live = state.cards.filter((c) => !c.answer && !c.retired_at);
    const dealt = live.filter((c) => (c.dealt || []).length)
      .sort((x, y) => String(y.dealt[y.dealt.length - 1]).localeCompare(String(x.dealt[x.dealt.length - 1])));
    if (dealt.length) return { id: dealt[0].id, word: a };
    if (live.length === 1) return { id: live[0].id, word: a };
    return { error: live.length ? "kaunsa card? id bhi do (node scripts/captains_call.mjs list)" : "koi live card nahi" };
  }
  return { id: a, word: b };
}

// LADDER A1 — a card re-dealt PAST TEN times without his word earns ONE line on the
// morning sheet push (brain.mjs manager_m3 reads captains_call.json and calls this).
// The 10 is the approved ladder's own floor ("re-dealt>10"), not a guess made here.
export function redealtSheetLine(cards, today) {
  const worn = (cards || []).filter((c) => !c.answer && !c.retired_at
    && !(c.sleep_until && c.sleep_until > today) && (c.dealt || []).length > 10)
    .sort((a, b) => b.dealt.length - a.dealt.length);
  if (!worn.length) return null;
  const c = worn[0];
  return `🎴 ${c.id} ab tak ${c.dealt.length}× poochha, jawab nahi${worn.length > 1 ? ` (+${worn.length - 1} aur)` : ""} — ek word kaafi: haan/na/baad.`;
}

// Apply his word. Returns {state, action} — the CLI layer EXECUTES the action so
// this stays pure and the selftest can assert dispatch without spawning anything.
export function applyAnswer(state, id, word, now = new Date()) {
  const s = { ...state, cards: state.cards.map((c) => ({ ...c })) };
  const c = s.cards.find((x) => x.id === id);
  if (!c) return { state: s, action: { kind: "error", why: `no card ${id}` } };
  if (c.answer || c.retired_at) return { state: s, action: { kind: "error", why: `${id} already settled (${c.resolution || c.answer})` } };
  const ts = now.toISOString();

  if (word === "baad") {
    // sleep until the NEXT local day — resurfaces at tomorrow's first anchor.
    const d = new Date(now); d.setDate(d.getDate() + 1);
    c.sleep_until = localDate(d);
    return { state: s, action: { kind: "sleep", until: c.sleep_until } };
  }
  c.answer = word; c.answered_at = ts;
  if (c.dispatch.kind === "staged") {
    return { state: s, action: { kind: "staged-dispatch", verb: word === "haan" ? "confirm" : "dismiss", at: c.dispatch.at, cardId: c.id } };
  }
  if (c.dispatch.kind === "open" && word === "haan") {
    c.resolution = "haan — the session walks it now";
    return { state: s, action: { kind: "open", path: c.dispatch.path } };
  }
  if (c.dispatch.kind === "ratify" && word === "haan") {
    // D2: his word walks scorer's own door — the CLI layer executes it.
    return { state: s, action: { kind: "ratify-dispatch", type: c.dispatch.type, cardId: c.id } };
  }
  // LADDER B6 — a staged fact: haan promotes to canon, na drops; both are
  // hippocampus.mjs's own doors, dispatched by the CLI layer.
  if (c.dispatch.kind === "pending-fact") {
    return { state: s, action: { kind: "pending-fact-dispatch", verb: word === "haan" ? "promote" : "drop-pending", at: c.dispatch.at, cardId: c.id } };
  }
  // LADDER B11 — haan forgets via the owner's own CLI; na falls through (fact stays).
  if (c.dispatch.kind === "forget-fact" && word === "haan") {
    return { state: s, action: { kind: "forget-dispatch", id: c.dispatch.id, cardId: c.id } };
  }
  // LADDER B5 — haan applies the wind-tunnel proposal via gate_tune.mjs (the owner).
  if (c.dispatch.kind === "gate-tune" && word === "haan") {
    return { state: s, action: { kind: "gatetune-dispatch", file: c.dispatch.file, cardId: c.id } };
  }
  c.resolution = word === "haan" ? "haan — done on his word (no exec by design, v1)" : "na — retired";
  c.retired_at = ts;
  return { state: s, action: { kind: "done", resolution: c.resolution } };
}

// ── DEAL GUARDS (injectable for the selftest) ────────────────────────────────
export function dealGuard({ organEnv, forge, now = new Date() }) {
  if (organEnv === "1") return { silent: true, why: "headless organ" };
  if (forge && forge.concept && !forge.closed_at) {
    const h = (now - new Date(forge.started_at)) / 36e5;
    if (Number.isFinite(h) && h >= 0 && h <= FORGE_STALE_HOURS) {
      return { silent: true, why: "fresh forge session open — no system asks mid-concept (his rule #12); cards wait at matchday/full-time/close" };
    }
  }
  return { silent: false, why: null };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function gatherSources() {
  const contract = readJson(CONTRACT);
  const staged = contract && Array.isArray(contract.staged) ? contract.staged : [];
  let marketFile = null, marketHonest = "";
  try {
    const files = readdirSync(MARKET_DIR).filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort().reverse();
    if (files.length) {
      marketFile = files[0];
      const txt = readFileSync(join(MARKET_DIR, marketFile), "utf8");
      const m = txt.match(/\*\*Honest read:\*\*\s*([^\n]+)/i);
      if (m) marketHonest = m[1];
    }
  } catch { /* no market dir yet — no card */ }
  // P5.2 — the first Gate-2 flagged doubt not yet carded (read-only on tape_room.json;
  // doubtminer.mjs owns that file, this only reads the flags it wrote).
  let gate2 = null;
  try {
    const tape = readJson(join(STATE_DIR, "tape_room.json"));
    const q = (tape && Array.isArray(tape.queue)) ? tape.queue : [];
    const flagged = q.filter((x) => Array.isArray(x.gate2_flag) && x.gate2_flag.length);
    if (flagged.length) {
      const call = loadState();
      const carded = new Set(call.cards.filter((c) => c.source === "tape_room.gate2").map((c) => c.key));
      const nextDoubt = flagged.find((x) => !carded.has(`gate2:${x.capsule}:${x.doubt_index}`));
      if (nextDoubt) gate2 = { doubt: nextDoubt, total: flagged.length, fixed_or_carded: carded.size };
    }
  } catch { /* no tape room yet — no card */ }
  // THE MISSIONS DESK + benchmark (outward loop, 8 Aug 2026) — read-only pulls;
  // scout.mjs owns missions.json, benchmark.mjs owns benchmark.json. Absence of
  // either file = no cards, never an error.
  const missions = readJson(join(STATE_DIR, "missions.json"));
  const bench = readJson(join(STATE_DIR, "benchmark.json"));
  const tiers = readJson(join(STATE_DIR, "trust_tiers.json"));   // D2: scorer owns it, this only reads

  // ── LADDER B (9 Aug 2026) — the card batch's sources, every one READ-ONLY ──
  const now = new Date();
  // B1 — rejirah rounds closed but not in the gist. The pending predicate is a
  // MIRROR of rejirah.mjs:229-238 (landed = due ∈ capsule.reJirahDone) — same
  // discipline as the FORGE_STALE_HOURS mirror above: one predicate, two homes,
  // and the owner's own `pending` mode would disagree out loud if they drift.
  let rejirah = null;
  try {
    const closes = readLinesJson(join(STATE_DIR, "rejirah_log.jsonl")).filter((r) => r.kind === "round-close");
    const pend = [];
    for (const r of closes) {
      const cap = readJson(join(STATE_DIR, "capsules", `${r.concept}.json`));
      if (!(cap && Array.isArray(cap.reJirahDone) && cap.reJirahDone.includes(r.due))) {
        pend.push({ concept: r.concept, round: r.round, due: r.due, closed_at: r.ts });
      }
    }
    if (pend.length) rejirah = { pending: pend.sort((a, b) => String(a.closed_at).localeCompare(String(b.closed_at))) };
  } catch { /* no log yet — no card */ }
  // B2 — Gem sync overdue. The 7-day bar is physio's OWN existing threshold
  // (physio.mjs:723-728 bleeds gem_sync_due at >=7d) — reused, not invented.
  let gem = null;
  try {
    const s = readJson(join(STATE_DIR, "gem_sync_stamp.json"));
    const days = s && s.at ? (now - Date.parse(s.at)) / 86400000 : Infinity;
    if (!(days < 7)) gem = { days: Number.isFinite(days) ? Math.floor(days) : null, stamp: s && s.at ? String(s.at).slice(0, 10) : "never" };
  } catch { /* unreadable = unknown, not a card */ }
  // B3 — the claude CLI logged out. brain.mjs writes token_vitals.json every
  // tick; health.not_logged_in is its own earned verdict (brain.mjs:608-621).
  const vitals = readJson(join(STATE_DIR, "token_vitals.json"));
  const claudeOut = vitals && vitals.health && vitals.health.not_logged_in === true
    ? { day: String(vitals.ts || now.toISOString()).slice(0, 10) } : null;
  // B4a — Oura auth FATAL (oura_coach.mjs owns oura_auth_state.json; fatal:false on recovery)
  const ouraAuth = readJson(join(STATE_DIR, "oura_auth_state.json"));
  const oura = ouraAuth && ouraAuth.fatal === true ? { day: String(ouraAuth.at || "").slice(0, 10) } : null;
  // B4b — Gemini CLI likely needs its one-time login. brain's failureStreak
  // EXCLUDES gemini rows (brain.mjs:609), so this reads the ledger's gemini tail
  // itself — the dead-bar (streak >= 5) is brain.mjs:613's own constant, mirrored.
  let geminiLogin = null;
  try {
    const g = readLinesJson(join(STATE_DIR, "brain_ledger.jsonl"))
      .filter((r) => r && r.engine === "gemini" && typeof r.ok === "boolean").slice(-25);
    let streak = 0;
    for (let i = g.length - 1; i >= 0 && g[i].ok === false; i--) streak++;
    if (streak >= 5) geminiLogin = { streak, day: String((g[g.length - 1] || {}).ts || now.toISOString()).slice(0, 10) };
  } catch { /* no ledger — no card */ }
  // B5 — the newest un-applied wind-tunnel proposal (gate_tune.mjs is the applier)
  let gatetune = null;
  try {
    const dir = join(STATE_DIR, "brain_out", "nightshift");
    const fs2 = readdirSync(dir).filter((f) => /^wind_tunnel_\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
    if (fs2.length) {
      const f = fs2[fs2.length - 1];
      const p = readJson(join(dir, f));
      if (p && p.status === "proposed" && p.id
          && !readLinesJson(join(STATE_DIR, "gate_tune_ledger.jsonl")).some((r) => r.id === p.id)) {
        gatetune = { id: p.id, file: `dressing-room/state/brain_out/nightshift/${f}`, effect: p.predicted_effect || "", window: p.review_after_days };
      }
    }
  } catch { /* no proposals — no card */ }
  // B6 — MCP-staged identity facts awaiting HIS word (hippocampus.mjs promote/drop-pending are the hands)
  let pendingFacts = [];
  try {
    pendingFacts = readLinesJson(join(STATE_DIR, "..", "hippocampus", "identity_facts.pending.jsonl"))
      .filter((r) => r && r.status === "pending");
  } catch { /* none staged */ }
  // B7 — the M-2 line-by-line review of manager/system.md, resumed from #6
  // PRECEDENCE (CONDUCTOR_LOG's own RESUME line). Section list = the file's
  // scaffolding comment (system.md:1-16); the five drafted-not-LOCKED + #6.
  const m2 = existsSync(join(STATE_DIR, "..", "manager", "system.md"))
    ? { sections: ["6-PRECEDENCE", "7-THE-SEASON-ARC", "8-THE-SOUL-VOICE", "9-VERIFIED-CANON", "10-THE-OUTPUT-CONTRACT", "11-THE-EXEMPLARS"] }
    : null;
  // B10 — two stale canon clauses in PROJECT_OS.md; the card exists ONLY while
  // the stale text still matches (patched at source ⇒ resolved at source).
  const canonPatches = [];
  try {
    const osTxt = readFileSync(join(STATE_DIR, "..", "..", "learning-layer", "PROJECT_OS.md"), "utf8");
    if (/Cloud-Routine \(laptop-off wala\)[\s\S]{0,120}?SKIP/.test(osTxt)) {
      canonPatches.push({ key: "cloud-routine-skip", line: `PROJECT_OS kehta "Cloud-Routine = SKIP" par sentinel LIVE chal raha hai (P3) — canon patch karein? (sirf aapke word se)` });
    }
    if (/append NAHI kar sakta/.test(osTxt)) {
      canonPatches.push({ key: "drive-append-stale", line: `PROJECT_OS kehta Drive doc append impossible — Drive tools ab hain, paste-ritual retire karein? (sirf aapke word se)` });
    }
  } catch { /* canon unreadable = no card, never a crash */ }
  // B11 — the two dead 17-Jul identity facts, by id (his blanket ladder haan
  // covers PROPOSING them; each forget still rides its own card = his word).
  const staleFacts = [];
  try {
    const f = readJson(join(STATE_DIR, "..", "hippocampus", "identity_facts.json"));
    for (const id of ["fb5d5a86", "88e5349a"]) {
      const row = ((f && f.facts) || []).find((x) => x.id === id);
      if (row) staleFacts.push({ id, text: row.text });
    }
  } catch { /* ledger unreadable — no card */ }

  return { staged, marketFile, marketHonest, gate2, missions, bench, tiers,
    rejirah, gem, claudeOut, oura, geminiLogin, gatetune, pendingFacts, m2, canonPatches, staleFacts };
}

function sync(now = new Date()) {
  const next = deriveCards(loadState(), gatherSources(), now);
  writeAtomic(CALL, next);
  return next;
}

// LAUNCH AUDIT A1 (9 Aug 2026): this used to send `confirm <idx+1>` — a positional
// number teaching_contract's dispatch has NEVER accepted (confirmFlag matches staged
// rule IDs), so every haan on a drift card would exit 1 while the card got consumed
// and the drift stayed staged forever. The args are now built by stagedDispatchArgs
// (pure, selftested): rule id + `--at`, so the owner drops the EXACT entry this card
// asked about — not the most recent entry sharing its rule id.
export function stagedDispatchArgs(verb, entry) {
  return [verb, entry.id, "--at", entry.at];
}
function runStagedDispatch(action) {
  // `at` is the stable identity — indexes renumber on every settle and id can repeat.
  const contract = readJson(CONTRACT);
  const staged = contract && Array.isArray(contract.staged) ? contract.staged : [];
  const entry = staged.find((e) => e.at === action.at);
  if (!entry) return { ok: false, settle: true, note: "resolved-at-source (staged entry already settled elsewhere)" };
  try {
    const out = execFileSync(process.execPath, [CONTRACT_MJS, ...stagedDispatchArgs(action.verb, entry)], { encoding: "utf8" });
    return { ok: true, settle: true, note: clip(out, 140) };
  } catch (e) {
    // A failed dispatch must NOT consume the card (that was the second half of the
    // blocker): his word stays unrecorded, so the card must come back at the next
    // anchor instead of dying with a "dispatch failed" epitaph.
    return { ok: false, settle: false, note: `dispatch failed: ${clip(e.message, 100)}` };
  }
}

function main() {
  const mode = process.argv[2] || "deal";
  const now = new Date();

  if (mode === "selftest") { process.exit(selftest() ? 0 : 1); }

  if (mode === "sync") {
    const s = sync(now);
    const live = s.cards.filter((c) => !c.answer && !c.retired_at).length;
    console.log(`captains_call: synced — ${live} live card(s)`);
    return;
  }

  if (mode === "deal") {
    const g = dealGuard({ organEnv: process.env.ARSENAL_ORGAN, forge: readJson(FORGE), now });
    if (g.silent) return;                       // silence is the default (hook path)
    const s = sync(now);
    const c = pickCard(s, { today: localDate(now) });
    if (!c) return;
    c.dealt.push(now.toISOString());
    writeAtomic(CALL, s);
    // LADDER A1 — one live card ⇒ the id is noise; his word alone routes (resolveAnswerArgs).
    const liveCount = s.cards.filter((x) => !x.answer && !x.retired_at).length;
    console.log(`🎴 CAPTAIN'S CALL${liveCount === 1 ? "" : ` [${c.id}]`}: ${c.line}`);
    console.log(liveCount === 1
      ? `   → haan / na / baad  (bas word bol de — session chala degi: node scripts/captains_call.mjs answer <word>)`
      : `   → haan / na / baad  (bol de — session chala degi: node scripts/captains_call.mjs answer ${c.id} <word>)`);
    return;
  }

  if (mode === "answer") {
    // LADDER A1 — `answer haan` (id elided) binds to the most recently dealt live card.
    const r = resolveAnswerArgs(loadState(), process.argv[3], process.argv[4]);
    if (r.error) { console.error(`captains_call: ${r.error}`); process.exit(1); }
    const { id, word } = r;
    if (!id || !["haan", "na", "baad"].includes(word)) {
      console.error("captains_call: answer [<id>] <haan|na|baad>"); process.exit(1);
    }
    const { state, action } = applyAnswer(loadState(), id, word, now);
    if (action.kind === "error") { console.error(`captains_call: ${action.why}`); process.exit(1); }
    if (action.kind === "staged-dispatch") {
      const r = runStagedDispatch(action);
      if (!r.settle) {
        // his word did NOT land — discard the in-memory answer so the card
        // stays live and re-deals at the next anchor (A1, 9 Aug 2026).
        console.error(`captains_call: ${id} ${word} NOT recorded — ${r.note} (card stays live, agle anchor pe wapas)`);
        process.exit(1);
      }
      const c = state.cards.find((x) => x.id === id);
      c.resolution = r.note; c.retired_at = now.toISOString();
      writeAtomic(CALL, state);
      console.log(`captains_call: ${id} ${word} → ${r.note}`);
      return;
    }
    if (action.kind === "ratify-dispatch") {
      try {
        const out = execFileSync(process.execPath, [join(__dirname, "scorer.mjs"), "ratify", action.type], { encoding: "utf8" });
        const c = state.cards.find((x) => x.id === id);
        c.resolution = clip(out.trim() || `ratified ${action.type}`, 140); c.retired_at = now.toISOString();
        writeAtomic(CALL, state);
        console.log(`captains_call: ${id} haan → ${c.resolution}`);
      } catch (e) {
        console.error(`captains_call: ${id} haan NOT recorded — scorer ratify failed: ${clip(e.message, 100)} (card stays live)`);
        process.exit(1);
      }
      return;
    }
    // LADDER B — the three owner-CLI dispatches, all on the ratify pattern:
    // success retires the card with the owner's own words; failure keeps the
    // card LIVE (his word must never be consumed by a dispatch that died).
    if (["pending-fact-dispatch", "forget-dispatch", "gatetune-dispatch"].includes(action.kind)) {
      const argvFor = action.kind === "pending-fact-dispatch"
        ? [join(__dirname, "hippocampus.mjs"), action.verb, "--at", action.at]
        : action.kind === "forget-dispatch"
          ? [join(__dirname, "hippocampus.mjs"), "forget", action.id]
          : [join(__dirname, "gate_tune.mjs"), "apply", join(__dirname, "..", action.file)];
      try {
        const out = execFileSync(process.execPath, argvFor, { encoding: "utf8" });
        const c = state.cards.find((x) => x.id === id);
        c.resolution = clip(String(out).trim() || `${word} — dispatched`, 140); c.retired_at = now.toISOString();
        writeAtomic(CALL, state);
        console.log(`captains_call: ${id} ${word} → ${c.resolution}`);
      } catch (e) {
        console.error(`captains_call: ${id} ${word} NOT recorded — dispatch failed: ${clip(e.message, 100)} (card stays live, agle anchor pe wapas)`);
        process.exit(1);
      }
      return;
    }
    writeAtomic(CALL, state);
    if (action.kind === "sleep") console.log(`captains_call: ${id} sota hai — kal ke pehle anchor pe wapas (${action.until})`);
    else if (action.kind === "open") console.log(`captains_call: ${id} haan — read it now and walk him through it in ≤3 lines: ${action.path}`);
    else console.log(`captains_call: ${id} — ${action.resolution}`);
    return;
  }

  if (mode === "file") {
    const li = process.argv.indexOf("--line");
    const line = li >= 0 ? process.argv[li + 1] : "";
    if (!line) { console.error("captains_call: file --line \"<one-line ask>\" [--key <stable-key>]"); process.exit(1); }
    // LADDER B8 (9 Aug 2026): --key makes filing IDEMPOTENT so a nightly organ
    // (the watchman's canon check) can re-file without minting duplicates — a
    // key ever seen (live OR settled) files nothing.
    const ki = process.argv.indexOf("--key");
    const key = ki >= 0 && process.argv[ki + 1] ? process.argv[ki + 1] : `manual:${now.toISOString()}`;
    const s = loadState();
    if (ki >= 0 && s.cards.some((c) => c.key === key)) {
      console.log(`captains_call: ${key} already filed — nothing minted (idempotent by key)`);
      return;
    }
    s.cards.push({
      id: `c${s.next_id++}`, key, source: "hand-filed",
      line: clip(line, 140), dispatch: { kind: "none" },
      filed_at: now.toISOString(), dealt: [], answer: null, answered_at: null,
      sleep_until: null, retired_at: null, resolution: null,
    });
    writeAtomic(CALL, s);
    console.log(`captains_call: filed ${s.cards[s.cards.length - 1].id} — it deals at his next anchor`);
    return;
  }

  if (mode === "status") {
    const s = sync(now);
    const live = s.cards.filter((c) => !c.answer && !c.retired_at);
    const today = localDate(now);
    const sleeping = live.filter((c) => c.sleep_until && c.sleep_until >= today);
    const fresh = live.filter((c) => c.dealt.length === 0);
    console.log(`captains_call: ${live.length} pending (${fresh.length} naya, ${sleeping.length} sleeping) · answered ever: ${s.cards.filter((c) => c.answer).length}`);
    return;
  }

  if (mode === "list") {
    const s = loadState();
    for (const c of s.cards) {
      const st = c.retired_at ? `settled: ${clip(c.resolution, 60)}` : c.answer ? c.answer : c.sleep_until ? `sleeping→${c.sleep_until}` : "LIVE";
      console.log(`  ${c.id} [${c.source}] ${st}\n     ${c.line}`);
    }
    if (!s.cards.length) console.log("  (no cards ever)");
    return;
  }

  console.log("captains_call: sync | deal | answer <id> <haan|na|baad> | file --line \"…\" | status | list | selftest");
}

// ── SELFTEST — hermetic, fixture-driven, every check can fail ────────────────
function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };
  const T0 = new Date("2026-08-07T10:00:00+05:30");
  const blank = () => ({ version: 1, next_id: 1, cards: [] });
  const STAGED = [
    { id: "his-word", why: "axis a bina arg ke mark", at: "2026-08-06T12:58:45.685Z" },
    { id: "coverage", why: "aadha jawab", at: "2026-08-06T14:08:00.000Z" },
  ];

  console.log("== captains_call selftest ==\n");

  // derive
  const s1 = deriveCards(blank(), { staged: STAGED, marketFile: "2026-08-01.md", marketHonest: "no contradiction with existing scout" }, T0);
  assert("derive — one card per staged entry + one per market file, stable keys",
    s1.cards.length === 3 && s1.cards.filter((c) => c.key.startsWith("drift:")).length === 2
    && s1.cards.some((c) => c.key === "market:2026-08-01.md"));
  assert("derive — idempotent: a second sync adds NOTHING (keys are identity)",
    deriveCards(s1, { staged: STAGED, marketFile: "2026-08-01.md" }, T0).cards.length === 3);
  assert("derive — a card line is ONE line with the ask, never the whole report",
    s1.cards.every((c) => !c.line.includes("\n") && c.line.length <= 160));
  const gone = deriveCards(s1, { staged: [STAGED[1]], marketFile: "2026-08-01.md" }, T0);
  assert("derive — a staged entry settled at the source auto-retires its card (a card must not outlive its ask)",
    gone.cards.find((c) => c.key === `drift:${STAGED[0].at}`).retired_at !== null
    && gone.cards.find((c) => c.key === `drift:${STAGED[1].at}`).retired_at === null);

  // P5.2 — the gate2 doubt lane (7 Aug 2026)
  const G2 = { doubt: { capsule: "embeddings", doubt_index: 0, q_verbatim: "Map kaunsa hai? Ye map kya cheez hai?" }, total: 17, fixed_or_carded: 0 };
  const sg = deriveCards(blank(), { gate2: G2 }, T0);
  assert("GATE2 — one flagged doubt becomes ONE card, quote + regex-floor honesty in the line",
    sg.cards.length === 1 && sg.cards[0].source === "tape_room.gate2"
    && /Map kaunsa hai/.test(sg.cards[0].line) && /regex floor/.test(sg.cards[0].line) && /1\/17/.test(sg.cards[0].line));
  assert("GATE2 — serialized: while one gate2 card is LIVE, a second flagged doubt derives NOTHING",
    deriveCards(sg, { gate2: { ...G2, doubt: { capsule: "inference", doubt_index: 3, q_verbatim: "doosra" } } }, T0).cards.length === 1);
  assert("GATE2 — idempotent on the same doubt (key is identity)",
    deriveCards(sg, { gate2: G2 }, T0).cards.length === 1);
  assert("GATE2 — ranks AFTER staged drifts, BEFORE market (his confirmations first)",
    (() => { const mix = deriveCards(sg, { staged: [STAGED[0]], marketFile: "2026-08-01.md" }, T0);
      const first = pickCard(mix, { today: "2026-08-07" });
      const afterDrift = pickCard({ ...mix, cards: mix.cards.map((c) => c.key.startsWith("drift:") ? { ...c, answer: "haan" } : c) }, { today: "2026-08-07" });
      return first.key.startsWith("drift:") && afterDrift.source === "tape_room.gate2"; })());

  // pick
  assert("pick — ONE card, oldest staged before market (order, not a number)",
    pickCard(s1, { today: "2026-08-07" }).key === `drift:${STAGED[0].at}`);
  const withManual = { ...s1, cards: [...s1.cards, { id: "c9", key: "manual:x", source: "hand-filed", line: "x", dispatch: { kind: "none" }, filed_at: "2026-08-07T09:00:00Z", dealt: [], answer: null, answered_at: null, sleep_until: null, retired_at: null, resolution: null }] };
  assert("pick — a hand-filed card outranks everything (deliberate + rare)",
    pickCard(withManual, { today: "2026-08-07" }).id === "c9");
  assert("pick — nothing live ⇒ null (silence is the default)",
    pickCard(blank(), { today: "2026-08-07" }) === null);

  // answer
  const a1 = applyAnswer(s1, s1.cards[0].id, "baad", T0);
  assert("answer — 'baad' sleeps until the NEXT local day and stays unanswered",
    a1.action.kind === "sleep" && a1.action.until === "2026-08-08"
    && a1.state.cards[0].answer === null);
  assert("answer — a sleeping card does not deal today, and WAKES ON its wake day (B5: was >=, slept one day too long)",
    pickCard(a1.state, { today: "2026-08-07" }).id !== a1.state.cards[0].id
    && pickCard(a1.state, { today: "2026-08-08" }).id === a1.state.cards[0].id);
  const a2 = applyAnswer(s1, s1.cards[0].id, "haan", T0);
  assert("answer — haan on a drift card ⇒ staged-dispatch action carrying the stable `at` (never a stored index)",
    a2.action.kind === "staged-dispatch" && a2.action.verb === "confirm" && a2.action.at === STAGED[0].at);
  assert("A1 (9 Aug) — dispatch args are rule ID + --at, never a positional index",
    JSON.stringify(stagedDispatchArgs("confirm", { id: "his-word", at: "2026-08-07T10:00:00Z" }))
    === JSON.stringify(["confirm", "his-word", "--at", "2026-08-07T10:00:00Z"]));
  const a3 = applyAnswer(s1, s1.cards.find((c) => c.key.startsWith("market:")).id, "haan", T0);
  assert("answer — haan on the market card hands the PATH to the session (Claude reads, captain listens)",
    a3.action.kind === "open" && /brain_out\/market\/2026-08-01\.md$/.test(a3.action.path));
  {
    // D2 (9 Aug) — trust-tier ratification lane: pending tier ⇒ ONE card whose haan
    // dispatches scorer's own door; tier no longer pending ⇒ card resolves at source.
    const TIERS = { tiers: [{ type: "first_focus_by_0930", n: 24, hit_rate: 0.92, no_look: false, pending_ratification: true }] };
    const st = deriveCards(blank(), { tiers: TIERS }, T0);
    assert("D2 — a pending_ratification tier mints exactly one ratify card",
      st.cards.length === 1 && st.cards[0].dispatch.kind === "ratify" && st.cards[0].dispatch.type === "first_focus_by_0930"
      && deriveCards(st, { tiers: TIERS }, T0).cards.length === 1);
    const rat = applyAnswer(st, st.cards[0].id, "haan", T0);
    assert("D2 — haan on a ratify card hands the scorer dispatch to the CLI layer",
      rat.action.kind === "ratify-dispatch" && rat.action.type === "first_focus_by_0930");
    const gone = deriveCards(st, { tiers: { tiers: [{ type: "first_focus_by_0930", pending_ratification: false }] } }, T0);
    assert("D2 — a tier that stopped pending takes its unanswered card with it",
      gone.cards[0].retired_at && /resolved-at-source/.test(gone.cards[0].resolution));
  }
  assert("answer — a settled card refuses a second word",
    applyAnswer(a2.state, a2.state.cards[0].id, "na", T0).action.kind === "error");
  assert("answer — an unknown id is an error, never a silent no-op",
    applyAnswer(s1, "c404", "haan", T0).action.kind === "error");

  // THE MISSIONS DESK + benchmark (outward loop, 8 Aug 2026)
  const MISS_STAGED = { missions: [
    { id: "M01", type: "audit", file: "dressing-room/missions/M01__x.md", staged_at: "2026-08-08T09:00:00Z", ingested_at: null, report: null },
    { id: "M02", type: "audit", file: "dressing-room/missions/M02__x.md", staged_at: "2026-08-08T09:00:00Z", ingested_at: null, report: null },
  ], syllabus_audit: { closed_at: null } };
  const sm1 = deriveCards(blank(), { missions: MISS_STAGED }, T0);
  assert("MISSIONS — staged audit with zero returns ⇒ ONE fire-nudge card opening M01",
    sm1.cards.length === 1 && sm1.cards[0].key === "mission:audit-fire"
    && sm1.cards[0].dispatch.kind === "open" && /M01/.test(sm1.cards[0].dispatch.path));
  assert("MISSIONS — fire-nudge idempotent across syncs",
    deriveCards(sm1, { missions: MISS_STAGED }, T0).cards.length === 1);
  const MISS_RET = { missions: [
    { id: "M01", type: "audit", file: "f", staged_at: "2026-08-08T09:00:00Z", ingested_at: "2026-08-09T10:00:00Z", report: "scout_reports/mission_M01_2026-08-09.md" },
    { id: "M02", type: "audit", file: "f", staged_at: "2026-08-08T09:00:00Z", ingested_at: null, report: null },
    { id: "T-embeddings", type: "topic_open", file: "f", staged_at: "2026-08-08T09:00:00Z", ingested_at: "2026-08-09T11:00:00Z", report: "scout_reports/mission_T-EMBEDDINGS_2026-08-09.md" },
  ], syllabus_audit: { closed_at: null } };
  const sm2 = deriveCards(sm1, { missions: MISS_RET }, T0);
  assert("MISSIONS — a landed return auto-retires the fire-nudge (resolved at source)",
    sm2.cards.find((c) => c.key === "mission:audit-fire").retired_at !== null);
  assert("MISSIONS — one diff-review card per ingested return, dispatch opens the verbatim report",
    sm2.cards.filter((c) => c.key.startsWith("mission:diff:")).length === 2
    && sm2.cards.find((c) => c.key === "mission:diff:M01").dispatch.path.endsWith("mission_M01_2026-08-09.md"));
  assert("MISSIONS — diff line names his word as the only canon key",
    /aapke word/.test(sm2.cards.find((c) => c.key === "mission:diff:M01").line));
  const MISS_CLOSED = { ...MISS_RET, syllabus_audit: { closed_at: "2026-08-10T10:00:00Z" } };
  const sm3 = deriveCards(sm2, { missions: MISS_CLOSED }, T0);
  assert("MISSIONS — audit-close on his word auto-retires unanswered audit diff cards, topic diffs live on",
    sm3.cards.find((c) => c.key === "mission:diff:M01").retired_at !== null
    && sm3.cards.find((c) => c.key === "mission:diff:T-embeddings").retired_at === null);

  const sb1 = deriveCards(blank(), { bench: { date: "2026-08-15", regressions: ["bucket-2 RAG: held-cold 2 → 1 (embeddings cracked in Re-Jirah)", "bucket-5: chapters covered 3 → 2"] } }, T0);
  assert("BENCH — a regression day mints ONE card carrying the first regression + count of the rest",
    sb1.cards.length === 1 && sb1.cards[0].key === "benchmark:regression:2026-08-15"
    && /bucket-2 RAG/.test(sb1.cards[0].line) && /\+1 aur/.test(sb1.cards[0].line));
  assert("BENCH — no regressions ⇒ no card (silence is the default)",
    deriveCards(blank(), { bench: { date: "2026-08-15", regressions: [] } }, T0).cards.length === 0);
  assert("OUTWARD TIER — hand-filed and drifts still outrank mission/bench cards",
    (() => { const mix = deriveCards(sm1, { staged: [STAGED[0]], missions: MISS_STAGED }, T0);
      return pickCard(mix, { today: "2026-08-08" }).key.startsWith("drift:"); })());

  // deal guards
  assert("guard — ARSENAL_ORGAN=1 is silent (an organ must never be dealt his card)",
    dealGuard({ organEnv: "1", forge: null, now: T0 }).silent === true);
  assert("guard — a FRESH open forge session is silent (rule #12: no system asks mid-concept)",
    dealGuard({ organEnv: undefined, forge: { concept: "hallucinations", started_at: "2026-08-07T08:00:00+05:30" }, now: T0 }).silent === true);
  assert("guard — a STALE open session deals (staleness silences the pacer, never the call), and closed/no session deals",
    dealGuard({ organEnv: undefined, forge: { concept: "x", started_at: "2026-08-05T08:00:00+05:30" }, now: T0 }).silent === false
    && dealGuard({ organEnv: undefined, forge: { concept: "x", started_at: "2026-08-07T08:00:00+05:30", closed_at: "2026-08-07T09:00:00+05:30" }, now: T0 }).silent === false
    && dealGuard({ organEnv: undefined, forge: null, now: T0 }).silent === false);

  // LADDER A1 (9 Aug 2026) — the monopoly is dead: rotation, day-rest, word-alone, sheet nag
  {
    const T = new Date("2026-08-09T10:00:00+05:30");
    const mk = (id, source, filed, dealt) => ({ id, key: `k:${id}`, source, line: "x",
      dispatch: { kind: "none" }, filed_at: filed, dealt, answer: null, answered_at: null,
      sleep_until: null, retired_at: null, resolution: null });
    const deck = { version: 1, next_id: 9, cards: [
      mk("g1", "tape_room.gate2", "2026-08-07T09:00:00Z", ["2026-08-09T03:00:00Z"]),  // dealt TODAY (08:30 IST)
      mk("m1", "missions.desk", "2026-08-08T09:00:00Z", []),
      mk("b1", "benchmark.regression", "2026-08-08T10:00:00Z", []),
    ] };
    assert("A1 — a card dealt today RESTS; the next live card deals at the next anchor (monopoly dead)",
      pickCard(deck, { today: localDate(T) }).id === "m1");
    const allDealtToday = { ...deck, cards: deck.cards.map((c) => ({ ...c, dealt: ["2026-08-09T03:00:00Z"] })) };
    assert("A1 — every live card already dealt today ⇒ silence (the day-unit baad already uses)",
      pickCard(allDealtToday, { today: localDate(T) }) === null);
    const acrossDays = { ...deck, cards: [
      { ...deck.cards[0], dealt: ["2026-08-07T03:00:00Z", "2026-08-08T03:00:00Z"] },
      { ...deck.cards[1], dealt: ["2026-08-08T04:00:00Z"] },
      { ...deck.cards[2], dealt: [] },
    ] };
    assert("A1 — least-dealt-ever first: every card gets its first hearing before any gets its third",
      pickCard(acrossDays, { today: localDate(T) }).id === "b1");
    assert("A1 — rank still breaks a fresh-deck tie (hand-filed leads, gate2 before outward)",
      pickCard({ ...deck, cards: deck.cards.map((c) => ({ ...c, dealt: [] })) }, { today: localDate(T) }).id === "g1");
    const r1 = resolveAnswerArgs(deck, "haan", undefined);
    assert("A1 — word alone binds to the most recently dealt live card",
      r1.id === "g1" && r1.word === "haan");
    assert("A1 — word alone with NOTHING dealt and one live card binds to it; ambiguous errors out loud",
      resolveAnswerArgs({ version: 1, next_id: 2, cards: [mk("solo", "hand-filed", "2026-08-09T05:00:00Z", [])] }, "na", undefined).id === "solo"
      && !!resolveAnswerArgs({ ...deck, cards: deck.cards.map((c) => ({ ...c, dealt: [] })) }, "haan", undefined).error);
    assert("A1 — explicit id + word passes through untouched",
      JSON.stringify(resolveAnswerArgs(deck, "m1", "baad")) === JSON.stringify({ id: "m1", word: "baad" }));
    const eleven = Array.from({ length: 11 }, (_, i) => `2026-07-${String(i + 10).padStart(2, "0")}T03:00:00Z`);
    assert("A1 — redealt line only PAST ten deals, carries the count and the word menu",
      redealtSheetLine([mk("c9", "tape_room.gate2", "2026-07-01T09:00:00Z", eleven)], "2026-08-09").includes("11×")
      && redealtSheetLine([mk("c9", "tape_room.gate2", "2026-07-01T09:00:00Z", eleven.slice(0, 10))], "2026-08-09") === null
      && redealtSheetLine([], "2026-08-09") === null);
  }

  // LADDER B (9 Aug 2026) — the card batch: every new source derives, retires at
  // source, ranks in its tier, and dispatches through the owner's own CLI.
  {
    const T = new Date("2026-08-09T10:00:00+05:30");
    // B1 — rejirah pending: serialized, retires when the paste lands
    const RJ = { pending: [
      { concept: "embeddings", round: 1, due: "2026-08-05", closed_at: "2026-08-08T10:00:00Z" },
      { concept: "inference", round: 1, due: "2026-08-06", closed_at: "2026-08-09T10:00:00Z" },
    ] };
    const sr = deriveCards(blank(), { rejirah: RJ }, T);
    assert("B1 — one rejirah card at a time (oldest close), a second pending derives NOTHING while it lives",
      sr.cards.length === 1 && sr.cards[0].key === "rejirah:embeddings:2026-08-05"
      && deriveCards(sr, { rejirah: RJ }, T).cards.length === 1);
    const srLanded = deriveCards(sr, { rejirah: { pending: [RJ.pending[1]] } }, T);
    assert("B1 — the paste landing retires the card at source AND the next pending takes the seat",
      srLanded.cards.find((c) => c.key === "rejirah:embeddings:2026-08-05").retired_at !== null
      && srLanded.cards.some((c) => c.key === "rejirah:inference:2026-08-06" && !c.retired_at));
    // B2/B3/B4 — the infra lane: derive + resolve-at-source
    const sg2 = deriveCards(blank(), { gem: { days: 10, stamp: "2026-07-30" }, claudeOut: { day: "2026-08-09" }, oura: { day: "2026-08-09" }, geminiLogin: { streak: 6, day: "2026-08-09" } }, T);
    assert("B2/B3/B4 — gem-sync, claude-logout, oura-fatal, gemini-login each mint ONE keyed card",
      sg2.cards.length === 4 && ["gem:sync:2026-07-30", "claude:logout:2026-08-09", "oura:auth:2026-08-09", "gemini:login:2026-08-09"].every((k) => sg2.cards.some((c) => c.key === k))
      && deriveCards(sg2, { gem: { days: 10, stamp: "2026-07-30" }, claudeOut: { day: "2026-08-09" }, oura: { day: "2026-08-09" }, geminiLogin: { streak: 6, day: "2026-08-09" } }, T).cards.length === 4);
    const healed = deriveCards(sg2, {}, T);
    assert("B2/B3/B4 — every infra card retires at source the moment the thing heals",
      healed.cards.every((c) => c.retired_at !== null && /resolved-at-source/.test(c.resolution)));
    // B5 — gate-tune: haan dispatches the owner's apply
    const sgt = deriveCards(blank(), { gatetune: { id: "wt-2026-08-09-tau1_base", file: "dressing-room/state/brain_out/nightshift/wind_tunnel_2026-08-09.json", effect: "wakes/day toward band", window: 14 } }, T);
    const gtA = applyAnswer(sgt, sgt.cards[0].id, "haan", T);
    assert("B5 — the wind-tunnel card carries the proposal file; haan hands gate_tune.mjs apply to the CLI layer",
      sgt.cards.length === 1 && sgt.cards[0].key === "gatetune:wt-2026-08-09-tau1_base"
      && gtA.action.kind === "gatetune-dispatch" && /wind_tunnel_2026-08-09\.json$/.test(gtA.action.file));
    // B6 — pending fact: serialized; haan → promote, na → drop-pending
    const PF = [{ ts: "2026-08-09T08:00:00Z", text: "sunday mornings are for FinOps", status: "pending" }];
    const spf = deriveCards(blank(), { pendingFacts: PF }, T);
    const pfH = applyAnswer(spf, spf.cards[0].id, "haan", T);
    const pfN = applyAnswer(spf, spf.cards[0].id, "na", T);
    assert("B6 — a staged fact becomes ONE card; haan → promote, na → drop-pending (both the owner's doors)",
      spf.cards.length === 1 && pfH.action.kind === "pending-fact-dispatch" && pfH.action.verb === "promote"
      && pfN.action.kind === "pending-fact-dispatch" && pfN.action.verb === "drop-pending" && pfH.action.at === "2026-08-09T08:00:00Z");
    // B7 — m2 review: serialized, keys ARE the reviewed-up-to marker
    const M2 = { sections: ["6-PRECEDENCE", "7-THE-SEASON-ARC"] };
    const sm2a = deriveCards(blank(), { m2: M2 }, T);
    assert("B7 — the review resumes at #6 PRECEDENCE, one section at a time",
      sm2a.cards.length === 1 && sm2a.cards[0].key === "m2:review:6-PRECEDENCE"
      && deriveCards(sm2a, { m2: M2 }, T).cards.length === 1);
    const sm2b = deriveCards({ ...sm2a, cards: sm2a.cards.map((c) => ({ ...c, answer: "haan", resolution: "walked" })) }, { m2: M2 }, T);
    assert("B7 — a settled section advances the marker to the next section",
      sm2b.cards.some((c) => c.key === "m2:review:7-THE-SEASON-ARC" && !c.answer));
    // B9 — audit-close fires when the LAST diff card resolves, never on ingest
    const MISS_ALL = { missions: [
      { id: "M01", type: "audit", file: "f", staged_at: "2026-08-08T09:00:00Z", ingested_at: "2026-08-09T10:00:00Z", report: "scout_reports/m1.md" },
      { id: "M02", type: "audit", file: "f", staged_at: "2026-08-08T09:00:00Z", ingested_at: "2026-08-09T11:00:00Z", report: "scout_reports/m2.md" },
    ], syllabus_audit: { closed_at: null } };
    const sac1 = deriveCards(blank(), { missions: MISS_ALL }, T);
    assert("B9 — all returns in but diffs UNSETTLED ⇒ no audit-close card (sealed ordering)",
      !sac1.cards.some((c) => c.key === "mission:audit-close"));
    const sac2 = deriveCards({ ...sac1, cards: sac1.cards.map((c) => (/^mission:diff:/.test(c.key) ? { ...c, answer: "haan" } : c)) }, { missions: MISS_ALL }, T);
    assert("B9 — the LAST diff settling mints the audit-close card, and close retires it",
      sac2.cards.some((c) => c.key === "mission:audit-close" && !c.retired_at)
      && deriveCards(sac2, { missions: { ...MISS_ALL, syllabus_audit: { closed_at: "2026-08-10T09:00:00Z" } } }, T)
        .cards.find((c) => c.key === "mission:audit-close").retired_at !== null);
    // B10 — canon patches live exactly as long as the stale text
    const CP = [{ key: "cloud-routine-skip", line: "PROJECT_OS kehta SKIP par sentinel LIVE — patch?" }];
    const scp = deriveCards(blank(), { canonPatches: CP }, T);
    assert("B10 — a stale canon clause mints ONE card; the patch landing retires it at source",
      scp.cards.length === 1 && scp.cards[0].key === "canon:cloud-routine-skip"
      && deriveCards(scp, { canonPatches: [] }, T).cards[0].retired_at !== null);
    // B11 — forget cards: haan dispatches the owner's forget; the fact vanishing retires
    const SF = [{ id: "fb5d5a86", text: "this is the first day…" }, { id: "88e5349a", text: "I am bringing my friend…" }];
    const ssf = deriveCards(blank(), { staleFacts: SF }, T);
    const sfH = applyAnswer(ssf, ssf.cards[0].id, "haan", T);
    const sfN = applyAnswer(ssf, ssf.cards[1].id, "na", T);
    assert("B11 — both dead facts carded; haan → forget-dispatch by id, na → plain retire (the fact stays)",
      ssf.cards.length === 2 && sfH.action.kind === "forget-dispatch" && sfH.action.id === "fb5d5a86"
      && sfN.action.kind === "done" && /na — retired/.test(sfN.action.resolution));
    assert("B11 — a fact already gone retires its card at source",
      deriveCards(ssf, { staleFacts: [SF[1]] }, T).cards.find((c) => c.key === "fact:forget:fb5d5a86").retired_at !== null);
    // ranks — integrity tier vs outward tier
    const mixed = deriveCards(blank(), { rejirah: RJ, gem: { days: 10, stamp: "2026-07-30" } }, T);
    assert("B — rejirah (integrity) outranks the infra tier on a fresh deck",
      pickCard(mixed, { today: "2026-08-09" }).source === "rejirah.pending");
  }

  console.log(`\ncaptains_call selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { loadState, sync };
