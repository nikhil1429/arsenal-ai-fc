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
//   · AT-SOURCE (10 Aug 2026 wiring repair, see AT_SOURCE_KEY): a card that runs
//     nothing AND whose key only moves when the work lands is NOT finished by his
//     haan — the haan is recorded, the card sleeps a day and stays live, and only
//     retire-at-source may kill it. An ask must never be destroyed by being answered.
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
import { resolveIntent } from "./acts.mjs";   // LOAD ZERO BLOCK 5: the ONE intent door

const __dirname = dirname(fileURLToPath(import.meta.url));
// ARSENAL_CALL_STATE_DIR is the selftest's seam and NOTHING else's (same pattern
// as teaching_audit.mjs's ARSENAL_AUDIT_STATE_DIR — proven there).
const STATE_DIR = process.env.ARSENAL_CALL_STATE_DIR || join(__dirname, "..", "dressing-room", "state");
const CALL = join(STATE_DIR, "captains_call.json");
const CONTRACT = join(STATE_DIR, "teaching_contract.json");
const FORGE = join(STATE_DIR, "forge_session.json");
const MARKET_DIR = join(STATE_DIR, "brain_out", "market");
const GATE_JOURNAL = join(STATE_DIR, "brain_out", "gate.jsonl");   // LOAD ZERO BLOCK 6 — brain.mjs is its SOLE WRITER; this is a read of what that owner published (a module-level const so xray can resolve the sink)
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

// Is there still an ENGINE behind the B4b gemini-login ask? (pure, so the selftest
// needs no brain_config.json.) This is deliberately brain.mjs's OWN eligibility gate,
// mirrored — brain.mjs:810 `if (j.engine === "gemini" && !cfg.gemini.enabled) return
// false`, plus the job table itself: a lane with the flag on and nobody riding it
// renders nothing, so a login changes nothing. Absent `gemini` block = disabled,
// which is brain.mjs's own DEFAULTS (`gemini: { enabled: false }`), not a guess.
export function geminiLaneLive(brainCfg) {
  if (!brainCfg || !brainCfg.gemini || brainCfg.gemini.enabled === false) return false;
  const jobs = Array.isArray(brainCfg.jobs) ? brainCfg.jobs : [];
  return jobs.some((j) => j && j.engine === "gemini" && j.enabled !== false);
}

// ── WIRING REPAIR (11 Aug 2026) — THE MARKET CARD HAD NO CONTENT WIRE ────────
// FOUND by a dead-wire tracing pass: the market card's ONLY content was a
// `**Honest read:**` line scraped out of brain_out/market/<date>.md — a field
// NOTHING in this organism produces. It is not in market_scan's job config, not
// in its prompt, not in any doc (`grep -c "Honest read"
// dressing-room/state/brain_config.json` → 0); exactly ONE of the four market
// files ever written happens to contain the phrase (2026-08-01 — one LLM turn's
// own choice of words). So the live deck carries c11 and c12 reading
// `Scout ka market proposal (2026-08-09) — 3 line mein sunna hai?` with no quote
// and no field naming the absence: an anchor spent asking him to hear a report
// the card cannot describe. Worse — BOTH of those files say in their own text
// "Market data: NOT AVAILABLE … Nothing to propose to `OPPONENT_SCOUT.md` this
// week", so the honest answer to "sunna hai?" was "there is nothing to hear".
// THE FIX is two wires, both CONSUMER-SIDE on purpose: brain_config.json is
// brain.mjs's file and writing the producer a new output contract is neither
// this organ's job nor a thing to do by hand.
//   1. LAYERED extraction (marketGist) — the legacy scrape stays FIRST and
//      verbatim, then the markers the four live files actually carry, then the
//      first real prose line. A card now describes what it points at.
//   2. the NO-OP gate (marketNoopWhy) — when the proposal declares IN ITS OWN
//      WORDS that it has nothing to propose, no card is minted, and a card
//      already standing on such a file retires AT SOURCE (never `answer` — his
//      word is never forged). The ANCHOR LAW decides this, not a threshold:
//      a thing that cannot be described cannot need the captain. Nothing is
//      lost either way — the file stays on disk for the session Claude, and
//      `brain status` still prints it by path (market_scan's own surface).

// FROZEN VERBATIM (layering law) — the 7 Aug engine, and the entire content wire
// this organ had until 11 Aug 2026. Kept as layer 1, not deleted, because when
// the producer DOES write an honest-read line it is the best sentence in the
// file (2026-08-01, live: "no contradiction with existing scout — this
// reinforces it, doesn't overturn it").
export function marketHonestLegacy(txt) {
  const m = String(txt || "").match(/\*\*Honest read:\*\*\s*([^\n]+)/i);
  return m ? m[1] : "";
}

// the lines under a `## <heading>` section, up to the next heading.
function mdSection(txt, headingRe) {
  const lines = String(txt || "").split(/\r?\n/);
  const i = lines.findIndex((l) => headingRe.test(l.trim()));
  if (i < 0) return "";
  const out = [];
  for (let j = i + 1; j < lines.length; j++) {
    if (/^#{1,6}\s/.test(lines[j])) break;
    out.push(lines[j]);
  }
  return out.join("\n").trim();
}

// last-ditch layer: the first line that is actual prose — not a heading, not the
// italic sub-title every market file opens with, not a bare bold label ending in
// a colon (`**Top 5 requested this week:**`), not a rule.
function mdFirstProse(txt) {
  for (const raw of String(txt || "").split(/\r?\n/)) {
    const l = raw.trim();
    if (!l) continue;
    if (/^#{1,6}\s/.test(l) || /^[-*_]{3,}$/.test(l)) continue;
    if (/^\*[^*].*\*$/.test(l)) continue;                 // wholly italic sub-title
    if (/^\*\*[^*]+:\*\*$/.test(l)) continue;             // bare bold label
    return l.replace(/^\d+\.\s*/, "").replace(/\*\*/g, "");
  }
  return "";
}

// Ordered probes. Every marker here is taken from a market file that EXISTS on
// disk today — no field name is invented, which is the exact mistake being
// repaired. Order = how much the sentence tells him, best first.
const MARKET_PROBES = [
  ["honest-read", (t) => marketHonestLegacy(t)],
  // "## Recommendation" — the section 2026-08-08 and 2026-08-09 both end on.
  ["recommendation", (t) => (mdSection(t, /^#{1,6}\s*recommendation\b/i).split(/\r?\n/)[0] || "").trim()],
  // "**Diff vs your coverage:** …" (2026-07-19) / "**Diff vs your current coverage…**" (2026-08-01)
  ["diff", (t) => { const m = String(t || "").match(/\*\*Diff vs[^*]*\*\*[:\s]*([^\n]+)/i); return m ? m[1] : ""; }],
  // "**Confidence:** …" (2026-07-19)
  ["confidence", (t) => { const m = String(t || "").match(/\*\*Confidence:\*\*\s*([^\n]+)/i); return m ? m[1] : ""; }],
  ["first-prose", (t) => mdFirstProse(t)],
];

export function marketGist(txt) {
  for (const [via, probe] of MARKET_PROBES) {
    const g = String(probe(txt) || "").replace(/`/g, "").trim();
    if (g) return { gist: g, via };
  }
  return { gist: "", via: null };            // unreadable ⇒ the old bare line, never a crash
}

// Does the proposal declare ITSELF a no-op? Structural on purpose — a heading, a
// bold status line, or the Recommendation section — so the same words appearing
// inside a REAL proposal's body can never silence it. Returns the reason (which
// becomes the retire epitaph) or null.
export function marketNoopWhy(txt) {
  const t = String(txt || "");
  for (const raw of t.split(/\r?\n/)) {
    const l = raw.trim();
    // 2026-08-09, live: "## Market data: NOT AVAILABLE"
    if (/^#{1,6}\s*market data:\s*not available\b/i.test(l)) return "the file's own heading — market data NOT AVAILABLE, nothing to propose";
    // 2026-08-08, live: "**Status: no-op this week.**"
    if (/^\*\*status:\s*no-?op\b/i.test(l)) return "the file's own status line — no-op, nothing to propose";
  }
  // 2026-08-08 "No canon edit proposed." · 2026-08-09 "Nothing to propose to
  // `OPPONENT_SCOUT.md` this week." — read ONLY inside ## Recommendation.
  const rec = mdSection(t, /^#{1,6}\s*recommendation\b/i);
  if (rec && /\b(no|nothing)\b[^.\n]{0,40}\bpropos/i.test(rec)) return "the file's own Recommendation — nothing to propose this week";
  return null;
}

// ── WIRING REPAIR (10 Aug 2026) — AN ASK MUST NOT BE DESTROYED BY BEING ANSWERED
// A dead-wire tracing pass found three cards that carry NO exec (`kind:"none"`)
// AND a key pinned to a source that only moves when the WORK lands:
//   gem:sync:<date>        the LAST SUCCESSFUL sync (gem_sync_stamp.at, :689)
//   rejirah:<c>:<due>      moves when the gist paste lands and the mirror re-fetches
//   mission:return:<id>:…  moves when the return is ingested (scout's ingested_at)
// A haan on those set answer + retired_at ("no exec by design, v1", applyAnswer)
// and mint()'s `if (byKey.has(key)) return` then refused that key FOREVER — so
// answering the card KILLED the ask while the work stayed undone, silently.
// Live proof at the moment of this repair: card c13, key `gem:sync:2026-07-30`,
// stamp unmoved for 11 days — one haan there and THE EXAMINER Gem goes stale
// forever with the organ printing "done on his word".
// The fix keeps v1's no-exec rule and moves the FINISH LINE to the source: these
// now dispatch `kind:"at-source"` — his haan is RECORDED (acted[]) and the card
// SLEEPS one day (the file's own day-unit, the same one "baad" and the A1
// rest-rule already use — no new number invented) but stays LIVE, so ONLY
// retire-at-source may kill it, with the true epitaph it already writes ("the
// Gem got synced" · "the paste landed" · "the return landed"). Work landed ⇒
// gone at the next sync. Work didn't ⇒ back tomorrow, carrying his haan.
// `na` still retires on the spot: a refusal IS a decision, and it needs no proof.
// KEY-SHAPED, not source-shaped, on purpose: `missions.desk` also mints the
// fire-nudge and the diff-review (both `kind:"open"`, both genuinely finished by
// his word), and `hand-filed` has no source condition at all — a haan there MUST
// still retire. The key prefix is the exact identity of the three affected mints.
export const AT_SOURCE_KEY = /^(gem:sync:|rejirah:|mission:return:)/;

// ── THE STALE-DAEMON CARD GETS A DOOR (11 Aug 2026, dead-wire repair) ────────
// daemon_watchdog.mjs:541 files "<name> STALE BUILD — purane code pe chal raha
// hai … Restart karun? Live daemon kill sirf aapke word se." through
// `file --line`, which hardcodes dispatch {kind:"none"} — so his haan RETIRED
// the ask and restarted nothing. The card promised an action the organism could
// not perform: nothing in the repo could restart a resident daemon at all (the
// only kill anywhere is setup/open_dugout.ps1:12, his own voice surface).
// Live at the moment of this repair: c33 (thalamus) and c34 (cortex), both
// filed 2026-08-10T18:04, both dealt 0×, while PID 13272 `node
// scripts\cortex.mjs` (CreationDate 09-08-2026 01:17:29) went on serving deep
// reads from code older than every repair in cortex.mjs — including the capsule
// door and the moment door that file documents as fixed.
//
// A TABLE, NOT AN ARGV THE CARD CARRIES. A card must never be able to name an
// arbitrary command to run; the card names a DAEMON and this file decides what
// that means. A daemon earns a row only once it has a door that retires it
// WITHOUT a kill — cortex's POST :4112/restart, which waits for its in-flight
// Opus lanes and lets daemon_watchdog's existing dead-port arm bring the fresh
// build up (`grep -n "THE RESTART DOOR" scripts/cortex.mjs`).
// THALAMUS IS DELIBERATELY ABSENT. It has no such door yet, so c33 keeps v1's
// no-exec behaviour rather than being handed a lie. Building that door is
// thalamus.mjs's own repair; adding a row here is all this side then needs.
export const RESTART_DOOR = { cortex: ["cortex.mjs", "restart"] };
// The watchdog's own key shape (staleCardArgs: `daemon:stale:<name>:<day>`).
export const STALE_DAEMON_KEY = /^daemon:stale:([a-z_]+):\d{4}-\d{2}-\d{2}$/;

// Derive the card set from the sources. Existing cards keep their identity (key),
// their deal history and their answers; sources only ADD new cards or RETIRE ones
// resolved at the source (he confirmed a drift directly — the card must not
// outlive the thing it asked about).
// ════════════════════════════════════════════════════════════════════════════
// THE DECISION GATE — LOAD ZERO BLOCK 6 (19 Aug 2026)
// ----------------------------------------------------------------------------
// THE LAW, one sentence: an organ may put a thing in HIS lane only if it can say
// WHY CODE COULD NOT DECIDE IT. Otherwise the code decides, and the outbox carries the
// DECISION — never the question.
//
// WHY THIS EXISTS. Measured 19 Aug 2026, 03:49 IST: 28 open cards. Triaged one by one against the
// state each one names — not against its own text — they came out: 10 STALE-FALSE (the condition
// they describe is no longer true and nothing retires them), 5 DECIDABLE (the card's own `haan`
// branch IS the code default, e.g. "lane so gaya · haan = sone do", when gate.mjs's header already
// says "asleep is health, not disease — it wakes itself"), 5 INFORM (a report wearing a card's
// clothes: it asks nothing, it needs DELIVERY), and 8 HIS-WORD. So 20 of 28 things queued on his
// memory were never his to decide. That is the LOAD number, and it is why it rose for five straight
// blocks while every ratchet went green.
//
// WHY A DECLARED TABLE AND NOT A FLAG PER CALL SITE. Cards are minted at 20 sites in this file
// alone. A per-site flag is 20 chances to write "because I said so", and no one place to READ what
// the organism believes it may ask him. This table IS that one place: it is the complete list of
// things this organism is permitted to put on the captain, each with the reason, and it is what the
// suite ratchets. Same shape as the repo's other declared exceptions (xray's MULTI_WRITER_ALLOWLIST,
// models' LABELS, BLOCK 5's DECLARED_WORD_ROUTING) — a list whose count may only SHRINK.
//
// KEYED BY KEY-PREFIX, NOT BY SOURCE, because one source mints both kinds: `missions.desk` mints
// the FIRE card (his Gemini account, his Chrome — code cannot authenticate as him) and the DIFF
// card (a 3-line readout that asks nothing). A source-level table would have to lie about one of
// them.
//
// A card that matches nothing here is NOT refused into silence — silence is the disease. It is
// posted to the road (outbox `finding`) and retired at source with its epitaph, so it still reaches
// him, once, on the surface he touches next, as news instead of homework.
export const WHY_CODE_CANNOT_DECIDE = Object.freeze({
  "gem:sync:":        "the sync writes tonight's cartridge into HIS Gemini account through a Chrome rail only his signed-in browser can open — code cannot authenticate as him",
  "claude:logout:":   "a login is his hands on his own credentials; code must never enter one",
  "oura:auth:":       "re-authorising Oura is his account and his consent — code must never enter a credential",
  "gemini:login:":    "a login is his hands on his own credentials; code must never enter one",
  "mission:audit-fire": "the fire opens a Deep Research run inside HIS Gemini account through the Chrome rail — code cannot authenticate as him",
  "mission:audit-close": "closing an audit CHANGES CANON, and canon moves only on his word",
  "trust:ratify:":    "granting NO-LOOK is a delegation of his own trust — a hit-rate is evidence for the ask, never the answer to it",
  "fact:":            "a staged identity fact becomes canon only on his confirmation — Law 4 puts the promotion in his hands alone",
  "fact:forget:":     "forgetting a fact the organism holds about him is his call, never the organism's",
  "gate2:":           "the doubt text is his own writing inside a locked capsule, and doubts[] is one of the only two paste-writes he owns — code may flag it unreadable but may never reword it",
  "rejirah:":         "the gist is the capsule's master and HIS Save click is the only write to it — code can prepare the patch, never land it",
  "canon:":           "canon moves only on his word (PROJECT_OS.md is his method, not the organism's)",
  "m2:review:":       "a line-by-line review of prose canon is his judgement on wording — code can diff the section but cannot decide what it should say",
  "drift:":           "his own drift report is his lane alone — the `hits` counter is his and no organ may answer it for him",
  "secrets:":         "moving a live credential is an action only his hands may take — code must never read, copy or re-enter one",
  // A card filed with NO --key was typed by a HAND, not minted by a loop: a loop MUST key its card
  // or fileGuard cannot stop it re-minting on every pass, so an unkeyed card is one he (or someone
  // acting as him) filed deliberately. Retiring his own note as "news" would be this gate deleting
  // the very thing it exists to protect. Measured: c56 (his own 18 Aug Instagram reading task) is
  // the live case, and it is the one card in the deck whose key is `manual:<iso>`.
  "manual:":          "he filed this himself with no key — it is his own note, and only he can say it is done or move the day",
});
// The `file --line` door carries its own reason per call (--why-code-cannot-decide), because a
// hand-filed ask has no fixed source to key on. `manual:` keys with no stated reason are gated
// exactly like everything else.
export function whyForCard(card) {
  if (!card) return null;
  if (card.why_code_cannot_decide) return String(card.why_code_cannot_decide);
  const key = String(card.key || "");
  let hit = null;
  for (const p of Object.keys(WHY_CODE_CANNOT_DECIDE)) {
    if (key.startsWith(p) && (!hit || p.length > hit.length)) hit = p;   // longest prefix wins: fact:forget: beats fact:
  }
  return hit ? WHY_CODE_CANNOT_DECIDE[hit] : null;
}
// decisionGate(state, now, post) → {kept, routed:[{id, line, key}]}
// Runs on every sync, over the LIVE deck. A card he has already answered, or one already retired,
// is history and is never touched (the same rule retireAtSource has always held). `post` is the
// road — injected so this is testable without a live outbox, and so the owners law holds: this
// organ never writes outbox.jsonl, it asks outbox.mjs to.
export function decisionGate(state, now = new Date(), post = null) {
  const ts = now.toISOString();
  const routed = [];
  let kept = 0;
  for (const c of (state.cards || [])) {
    if (!c || c.answer || c.retired_at) continue;
    if (whyForCard(c)) { kept++; continue; }
    routed.push({ id: c.id, key: c.key, line: c.line, source: c.source });
    c.retired_at = ts;
    c.resolution = "resolved-at-source (THE DECISION GATE: nothing here needs HIS word — it went on the road as news, not homework)";
  }
  if (post) for (const r of routed) post(r);
  return { kept, routed };
}

export function deriveCards(state, { staged = [], marketFile = null, marketHonest = "", marketNoopFiles = [], gate2 = null, missions = null, bench = null, tiers = null,
  rejirah = null, gem = null, claudeOut = null, oura = null, geminiLogin = null, geminiLane = { live: true }, gatetune = null, gatetuneSource = null, pendingFacts = [], m2 = null, canonPatches = [], staleFacts = [], model = null, awayday = null,
  gateStates = null, daemonPorts = null, watchmanLast = null } = {}, now = new Date()) {
  const s = { ...state, cards: state.cards.map((c) => ({ ...c })) };
  const byKey = new Map(s.cards.map((c) => [c.key, c]));
  const ts = now.toISOString();

  // MIGRATION for the repair above (10 Aug 2026). Cards minted BEFORE it still
  // carry `kind:"none"`, and mint() will never re-mint their keys — so the live
  // deck (c13 `gem:sync:2026-07-30` among them) would still be destroyed by the
  // next haan. Only UNSETTLED cards are touched; a retired card's history is its
  // own and is never rewritten.
  for (const c of s.cards) {
    if (c.answer || c.retired_at) continue;
    if (AT_SOURCE_KEY.test(String(c.key || "")) && c.dispatch && c.dispatch.kind === "none") {
      c.dispatch = { kind: "at-source" };
    }
  }

  // BACKFILL for the 11 Aug locator repair (see fileDispatch). c27 and c36 were
  // filed by awayday.mjs BEFORE it could hand its URL over, and both are STILL
  // LIVE — without this they keep dealing him a bare 11-digit run id, which is
  // the very defect the repair exists to end. The link is DERIVED, never
  // guessed: awayday.json's own `repo` + the run id already inside the card key,
  // in the exact shape GitHub itself returned for c37, the first card filed
  // under the repair (`https://github.com/<repo>/actions/runs/<id>`).
  // No repo in state ⇒ nothing is written. A wrong link is worse than none.
  const awaySlug = awayday && typeof awayday.repo === "string" && awayday.repo ? awayday.repo : null;
  if (awaySlug) {
    for (const c of s.cards) {
      if (c.answer || c.retired_at) continue;                 // settled history is never rewritten
      const m = /^awayday:red:(\d+)$/.exec(String(c.key || ""));
      if (!m || !c.dispatch || c.dispatch.kind !== "none") continue;
      c.dispatch = { kind: "open", path: `https://github.com/${awaySlug}/actions/runs/${m[1]}` };
    }
  }

  // THE STALE-DAEMON DISPATCH (11 Aug 2026 — see RESTART_DOOR above). DERIVED
  // here, not filed by the watchdog: daemon_watchdog.mjs owns the card's WORDS
  // and this file owns its DISPATCH (the pull-derive law in the header), so the
  // watchdog needs no change and every stale card — the ones already on the deck
  // included — gets the door the moment its daemon has one. A daemon with no
  // door keeps kind:"none" and v1's honest no-exec. Settled history is never
  // rewritten; same rule as the two migrations above.
  for (const c of s.cards) {
    if (c.answer || c.retired_at) continue;
    const m = STALE_DAEMON_KEY.exec(String(c.key || ""));
    if (!m || !RESTART_DOOR[m[1]]) continue;
    if (!c.dispatch || c.dispatch.kind !== "none") continue;
    c.dispatch = { kind: "restart-daemon", name: m[1] };
  }

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
  //
  // RETIRE-AT-SOURCE (11 Aug 2026 — this lane was a PRODUCER WITH NO CONSUMER for a
  // month). Every other serialized lane in this file watches its source and hands the
  // seat back when the ask dies at the source (B1 rejirah, B6 pending_fact, B2/B3/B4).
  // Gate-2 had no such watch: doubtminer rewrites `gate2_flag` from the LIVE capsule
  // doubts on every run, so the moment he rewrites a doubt on the gist and the mirror
  // pulls it, the flag is gone — and the card sat on unchanged, unanswerable, holding
  // the single seat this lane deliberately allows. Measured 11 Aug: c9
  // (gate2:embeddings:0) dealt 20× since 7 Aug with the other 16 flagged doubts unable
  // to reach him behind it. That is the same "a card must not outlive its ask" failure
  // the drift lane's own retire (just above) exists to prevent.
  // The retire runs BEFORE the mint on purpose, exactly as B1's does: a doubt repaired
  // at the gist frees the seat for the next flagged one in the SAME sync, not the one
  // after.
  // GUARDED on `live_keys` being an ARRAY, never on its emptiness: `readJson` returns
  // null for a missing or corrupt tape_room.json (line 84 — it swallows, it does not
  // throw), so a file that failed to load would otherwise read as "nothing is flagged
  // any more" and silently retire an ask he never answered. The producer attaches
  // live_keys only when it actually read a queue; the old three-field shape (which
  // this file's own selftest seam still passes) therefore retires nothing.
  if (gate2 && Array.isArray(gate2.live_keys)) {
    const stillFlagged = new Set(gate2.live_keys);
    for (const c of s.cards) {
      if (c.source === "tape_room.gate2" && !c.retired_at && !c.answer && !stillFlagged.has(c.key)) {
        c.retired_at = ts;
        c.resolution = "resolved-at-source (the q reads cold now — doubtminer's gate-2 flag is gone)";
      }
    }
  }
  if (gate2 && gate2.doubt) {
    const g = gate2.doubt;
    // 11 Aug 2026 — the candidate may now be a DOUBT (`doubt_index`/`q_verbatim`,
    // the shape this lane has always been handed) or a BRIDGE (`ref`/`q`). Both
    // shapes are read here rather than normalized upstream so the pure-function
    // seam this file's selftest drives keeps accepting the original one.
    const ref = g.ref !== undefined ? String(g.ref) : String(g.doubt_index);
    const qText = g.q !== undefined ? g.q : g.q_verbatim;
    const isBridge = g.kind === "bridge";
    const key = `gate2:${g.capsule}:${ref}`;
    const liveGate2 = s.cards.some((c) => c.source === "tape_room.gate2" && !c.answer && !c.retired_at);
    if (!byKey.has(key) && !liveGate2) {
      s.cards.push({
        id: `c${s.next_id++}`, key, source: "tape_room.gate2",
        // The card must name WHICH ARRAY on the gist: `doubts[]` and `bridges[]` are
        // different rows in the same file, and a card that says "doubt" for a bridge
        // sends him editing the wrong one. A bridge is addressed the way it is
        // findable — by the concept it points at, never by its index.
        line: isBridge
          ? `Bridge-Q cold-readable nahi (${g.capsule} → ${g.to || "?"}): "${clip(qText, 60)}" — abhi 1 line mein saath theek karein? (${gate2.fixed_or_carded + 1}/${gate2.total}+, regex floor)`
          : `Doubt cold-readable nahi (${g.capsule}): "${clip(qText, 70)}" — abhi 1 line mein saath theek karein? (${gate2.fixed_or_carded + 1}/${gate2.total}+, regex floor)`,
        dispatch: { kind: "none" },
        filed_at: ts, dealt: [], answer: null, answered_at: null, sleep_until: null,
        retired_at: null, resolution: null,
      });
    }
  }

  // 3. THE MISSIONS DESK (outward loop, 8 Aug 2026) — PULL-DERIVE off scout's
  // missions.json. Two card shapes, both anchor-lawful:
  //   fire-nudge — ONE card for the NEXT un-fired audit mission (auditFireTarget,
  //     keyed by that mission's id); haan = the session opens it and walks the
  //     fire with him right now. His fire (scout's `fired_at`) retires it, the
  //     nudge then advances M01→M02→M03→M04, and it stays silent while one is
  //     in flight. See auditFireTarget's header for the 10 Aug wiring repair.
  //   diff-review — one per ingested return; haan = the session walks the diff
  //     in ≤3 lines. Canon changes only on his word (Ruling 6). Audit diff
  //     cards auto-retire when `mission audit-close` records that word.
  if (missions && Array.isArray(missions.missions)) {
    const rows = missions.missions;
    const auditRows = rows.filter((r) => r.type === "audit");
    const auditClosed = !!(missions.syllabus_audit && missions.syllabus_audit.closed_at);
    const fireTarget = auditFireTarget(rows, auditClosed);
    const fireKey = fireTarget ? `mission:audit-fire:${fireTarget.id}` : null;
    if (fireTarget && !byKey.has(fireKey)) {
      const back = auditRows.filter((r) => r.ingested_at).length;
      s.cards.push({
        id: `c${s.next_id++}`, key: fireKey, source: "missions.desk",
        line: `Outward: full-syllabus audit ${back}/${auditRows.length} wapas — abhi ${fireTarget.id} saath fire karein? (Gemini Deep Research)`,
        dispatch: { kind: "open", path: fireTarget.file },
        filed_at: ts, dealt: [], answer: null, answered_at: null, sleep_until: null,
        retired_at: null, resolution: null,
      });
    }
    // retire-at-source: a fire card that is no longer THE target. The reason is
    // read off that mission's own row so the epitaph is never a guess — and the
    // pre-repair key ("mission:audit-fire", no id) retires here too.
    for (const c of s.cards) {
      if (!/^mission:audit-fire(?::|$)/.test(c.key) || c.retired_at || c.answer) continue;
      if (fireKey && c.key === fireKey) continue;
      const row = rows.find((r) => r.id === c.key.split(":")[2]);
      c.retired_at = ts;
      c.resolution = "resolved-at-source (" + (
        row && row.fired_at ? "he fired it — scout stamped fired_at"
        : row && row.ingested_at ? "the return landed"
        : auditClosed ? "audit closed on his word"
        : "no longer the next fire") + ")";
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
    // LADDER C2 (9 Aug 2026) — the return-leg watcher: HIS click fired it (the
    // /fire stamp), 24h passed (the ladder's own number), nothing came back.
    // One card per fire-epoch; a landed return retires it at source.
    for (const r of rows.filter((x) => x.fired_at && !x.ingested_at)) {
      const hrs = (now - new Date(r.fired_at)) / 36e5;
      if (!(Number.isFinite(hrs) && hrs > 24)) continue;
      const key = `mission:return:${r.id}:${String(r.fired_at).slice(0, 10)}`;
      if (byKey.has(key)) continue;
      s.cards.push({
        id: `c${s.next_id++}`, key, source: "missions.desk",
        line: `Mission ${r.id} ${Math.floor(hrs / 24)} din pehle fire hua tha — Gemini mein report taiyaar hogi. "le lo" bol dein to utha lun?`,
        // 10 Aug repair: only the INGESTED return finishes this (see AT_SOURCE_KEY)
        dispatch: { kind: "at-source" },
        filed_at: ts, dealt: [], answer: null, answered_at: null, sleep_until: null,
        retired_at: null, resolution: null,
      });
    }
    for (const c of s.cards) {
      if (!/^mission:return:/.test(c.key) || c.retired_at || c.answer) continue;
      const row = rows.find((x) => x.id === c.key.split(":")[2]);
      if (!row || row.ingested_at) { c.retired_at = ts; c.resolution = "resolved-at-source (the return landed)"; }
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
  // 11 Aug 2026 (see the MARKET CARD wiring repair above): `marketNoopFiles` are
  // the proposals that declare themselves empty. They are not carded, and one
  // already standing retires AT SOURCE — the source condition of this card was
  // always "there is a proposal to hear", and for those files there never was.
  const noopMkt = new Set(marketNoopFiles.map((x) => (x && x.file) || x));
  if (marketFile && !noopMkt.has(marketFile)) {
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
  for (const c of s.cards) {
    if (c.source !== "brain_out/market" || c.retired_at || c.answer) continue;
    const f = String(c.key || "").slice("market:".length);
    const hit = marketNoopFiles.find((x) => ((x && x.file) || x) === f);
    if (!hit) continue;
    c.retired_at = ts;
    c.resolution = `resolved-at-source (${(hit && hit.why) || "the file declares no proposal"} — nothing to hear)`;
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

  // ══ LOAD ZERO BLOCK 6 (19 Aug 2026) — THE STALE-CARD CLASSES ════════════════════════════════
  // Measured 19 Aug 03:49 IST: TEN of the 28 open cards described a condition that WAS NO LONGER
  // TRUE, and nothing anywhere retired them. Not one of the ten was wrong when it was minted; every
  // one of them was wrong by the time he read it. That is the disease his 11 Aug ruling names —
  // "jo bhi cheez USE yaad rakhni pade, woh ek DESIGN FAILURE hai" — because the only thing left
  // that could close them was his memory.
  // Each rule below asks the OWNER of the fact, never the card's own text (his 15 Aug law: no organ
  // may pattern-match the words of the last incident), and each retires ONLY on a POSITIVE reading
  // — an absent or unreadable source is "no opinion", never "retire". That asymmetry is deliberate:
  // the failure mode of a liveness check is a false positive (the work order paid for that lesson
  // three times in one night), so a source that cannot speak leaves the card exactly where it is.

  // 1 · GATE CARDS — "<lane> SO GAYA". brain.mjs's own transition journal is the truth; a lane whose
  //     newest row reads `awake` is not asleep, so the card is answering a question that closed.
  //     This is the class BLOCK 6 part 1 just made retirable: three of these lanes woke the moment
  //     the gate could see the outbox road (16 awake/14 asleep → 19/11, measured).
  if (gateStates && gateStates.size) {
    retireAtSource((c) => {
      const m = /^gate:(?!batch:)([^:]+):/.exec(String(c.key || ""));
      const row = m && gateStates.get(m[1]);
      return !!row && row.state === "awake";
    }, "the lane is AWAKE again on brain's own gate journal — it wakes itself, exactly as L5 says");
    // a BATCH card ("N lanes so gaye") dies when NO lane is asleep any more; while some still are,
    // the count in its line is stale but its subject is live, so it stands and the gate routes it.
    retireAtSource((c) => /^gate:batch:/.test(String(c.key || "")) && ![...gateStates.values()].some((r) => r.state === "asleep"),
      "every lane in that batch is awake again (brain's gate journal)");
  }
  // 2 · DAEMON CARDS — "RELAUNCH NAHI CHADHA" / "STALE BUILD". daemon_watchdog.mjs publishes its own
  //     probe result; a port reading UP on a pass taken AFTER the card was filed is the proof the
  //     card was asking for. The watchdog's own header is explicit that a dispatch is not an UP and
  //     that only the NEXT pass's probe proves it — so this reads the probe, never the dispatch, and
  //     an UNKNOWN port (neither true nor false) retires nothing.
  if (daemonPorts && daemonPorts.ports && daemonPorts.at) {
    retireAtSource((c) => {
      const m = /^daemon:(?:stale|stuck):([^:]+):/.exec(String(c.key || ""));
      if (!m || daemonPorts.ports[m[1]] !== true) return false;
      return Date.parse(daemonPorts.at) > Date.parse(c.filed_at || 0);
    }, "the watchdog's next probe found it UP — code restarted it, his hands were never needed");
  }
  // 3 · CANON-DRIFT CARDS — "<file> mein UNCOMMITTED badlav hai". The watchman re-reads
  //     `git status --porcelain` every sweep and publishes its findings; the finding disappearing IS
  //     the tree being clean. Read the published sweep rather than spawning git here — one file read
  //     on a path that runs at every SessionStart.
  if (watchmanLast && Array.isArray(watchmanLast.findings)) {
    const stillDirty = new Set(watchmanLast.findings.filter((f) => f && /^canon-drift-/.test(String(f.id))).map((f) => String(f.id).replace(/^canon-drift-/, "")));
    retireAtSource((c) => {
      const m = /^canon:(.+):\d{4}-\d{2}-\d{2}$/.exec(String(c.key || ""));
      return !!m && !stillDirty.has(m[1]);
    }, "the working tree is clean again on the watchman's own latest sweep — the change was committed");
  }


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
        { kind: "at-source" });   // 10 Aug repair: only the LANDED paste finishes this
    }
  }

  // B2 — Gem sync overdue (physio's own 7d bar). One card per stamp-epoch.
  if (gem) {
    mint(`gem:sync:${gem.stamp}`, "gem.sync_due",
      `EXAMINER Gem ${gem.days == null ? "kabhi" : gem.days + " din se"} sync nahi hua — abhi /gem-sync bol dein? (5 min, Chrome)`,
      { kind: "at-source" });   // 10 Aug repair: only a MOVED stamp finishes this
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
  // DEAD WIRE, repaired 10 Aug 2026 — this was a CONSUMER WITH NO PRODUCER. The card
  // asks him to log in so "raat ke renders" resume, and it retires only when a gemini
  // row lands with ok:true. But on 17 Jul the captain's own ENGINE LAW moved every
  // committed job onto Claude (brain.mjs asserts it: `cfg.jobs.every(j => (j.engine ||
  // "claude") === "claude")`), so brain_ledger.jsonl's LAST gemini row is dated
  // 2026-07-17 and no further row of either polarity can ever be written. Measured
  // this run: 10 gemini rows in 4,558, all ok:false, all 17 Jul; 0 of 30 configured
  // jobs carry engine=gemini. The streak froze at 10, the retire test became
  // unreachable, and card c14 held a permanent seat in a one-card-per-anchor deck
  // telling him about a 24-day-old failure of an engine nothing calls — even after a
  // login. The ask is now gated on the engine still HAVING a rider (geminiLane, from
  // geminiLaneLive below); add a gemini job back to brain_config.json and the card
  // re-arms by itself. No new threshold: the streak bar is still brain.mjs's own 5.
  const geminiAsk = geminiLane && geminiLane.live === false ? null : geminiLogin;
  if (geminiAsk) {
    mint(`gemini:login:${geminiAsk.day}`, "brain.gemini_login",
      `Gemini CLI ${geminiAsk.streak} baar lagatar fail — ek baar terminal mein \`gemini\` chala ke login kar dein? Raat ke renders ruke hain.`,
      { kind: "none" });
  }
  retireAtSource((c) => c.source === "brain.gemini_login" && !geminiAsk,
    geminiLane && geminiLane.live === false
      ? "no committed job rides the gemini engine — the ask has no engine behind it"
      : "a gemini run succeeded");

  // B5 — the wind tunnel's un-applied proposal; haan = gate_tune.mjs apply (the
  // declared owner), then a 14d watch with out-of-band auto-revert.
  // Retire-at-source FIRST (B1/B6's same-sync seat-freeing): last night's card dies
  // in the same sync that mints tonight's, so the deck holds AT MOST ONE gate-tune
  // ask — which is what the SERIAL LAW downstream can actually honour. Both reasons
  // come from the source's own two facts; no new threshold, no new file, no clock.
  if (gatetuneSource) {
    const gtId = (c) => (c.source === "nightshift.gate_tune" && c.key.startsWith("gatetune:") ? c.key.slice(9) : null);
    retireAtSource((c) => { const id = gtId(c); return id !== null && gatetuneSource.ledgerIds.has(id); },
      "gate_tune.mjs has a ledger row for this proposal");
    // Superseded only against a proposal we actually SAW. newestId null (folder
    // readable but every wind_tunnel file gone) = unknown ⇒ his card lives.
    retireAtSource((c) => { const id = gtId(c); return id !== null && gatetuneSource.newestId !== null && id !== gatetuneSource.newestId; },
      "a newer wind-tunnel proposal replaced it — the nightly tunnel re-measures the same knobs");
  }
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

  // H3 (10 Aug 2026) — THE WEEKLY MODEL AUDIT, the H-verdict's replacement for
  // the dead calendar gate: ONE card per week, keyed to that week's Sunday,
  // minted from the Sunday ONWARD so a slept-through Sunday still mints at
  // Monday's first anchor. Counts + the warming-but-never-resolving number
  // (expiry's event-gated heir) are PRECOMPUTED by the owner — this file never
  // derives. Last week's unanswered card is superseded, never stacked.
  if (model && Array.isArray(model.edges) && model.edges.length) {
    const d = new Date(now);
    const sKey = localDate(new Date(d.getTime() - d.getDay() * 86400000));   // this week's Sunday
    const mc = model.counts || {};
    const stale = model.stale_warming || 0;
    mint(`model:audit:${sKey}`, "nikhil_model.weekly",
      `Model audit (hafta): ${mc.tested || 0} tested · ${mc.warming || 0} warming · ${mc.retired || 0} retired${stale ? ` · ${stale} warming-jo-kabhi-resolve-nahi-hue` : ""} — koi edge galat lage to \`node scripts/nikhil_model.mjs galat <id>\`, warna haan`,
      { kind: "none" });
    retireAtSource((c) => c.source === "nikhil_model.weekly" && c.key !== `model:audit:${sKey}` && !c.answer,
      "superseded by this week's audit card");
  }

  return s;
}

// WIRING REPAIR (10 Aug 2026) — THE FIRE-NUDGE READS THE FIRE STAMP.
// scout.mjs:365 has stamped `fired_at` since LADDER C2 (9 Aug), and this lane —
// the one card that ASKS him to fire — never read it. Two live consequences,
// both found on the real missions.json (M01 fired 11:12, ingested 15:41):
//   · between fire and return the nudge kept dealing "abhi M01 saath fire
//     karein?" — a haan there re-fires a Deep Research run he already spent;
//   · the retire test was `anyReturn || auditClosed`, so M01's RETURN retired
//     the nudge forever (c10, retired 17:15) and M02–M04 never got a fire card
//     at all — the outward loop's first leg died on its own first success.
// The target is now DERIVED, per-mission, from the row's own two stamps:
//   fired_at answers the ask (the fire happened) · ingested_at ends the mission.
// While an audit mission is IN FLIGHT (fired, no return) this stays SILENT —
// that state already has its own card, the C2 return-leg watcher below, and the
// file's serialization law (gate2 · B1 · B6 · B7) puts one ask on his desk at a
// time. No number invented: every branch reads a stamp that already exists.
export function auditFireTarget(rows, auditClosed) {
  if (auditClosed) return null;
  const audit = (rows || []).filter((r) => r && r.type === "audit");
  if (!audit.length) return null;
  if (audit.some((r) => r.fired_at && !r.ingested_at)) return null;   // in flight — C2 owns it
  return audit.find((r) => !r.fired_at && !r.ingested_at) || null;
}

// FROZEN VERBATIM (layering law) — the pre-repair engine, kept so the change is
// readable next to what it replaced. It took no target: one card, always pointed
// at auditRows[0], minted only while ZERO returns existed, and retired on the
// first return. Reference only; nothing calls it.
export function auditFireTargetLegacy(rows, auditClosed) {
  const auditRows = (rows || []).filter((r) => r.type === "audit");
  const anyReturn = (rows || []).some((r) => r.ingested_at);
  if (auditRows.length && !anyReturn && !auditClosed) return auditRows[0];
  return null;
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
  // WIRING REPAIR (10 Aug 2026) — see AT_SOURCE_KEY's header for the full trace.
  // These cards run NOTHING (v1's rule, unchanged) and their key only moves when
  // the WORK lands, so `answer` must not be the finish line: his haan is recorded
  // and the card sleeps one day, but stays LIVE for retire-at-source to kill with
  // the truth. This sits ABOVE `c.answer = word` on purpose — an `answer` would
  // both hide the card from pickCard and disqualify it from every retireAtSource
  // predicate (`!c.answer`), which is the zombie the old path created.
  if (c.dispatch.kind === "at-source") {
    if (word === "na") {
      c.answer = word; c.answered_at = ts;
      c.resolution = "na — retired"; c.retired_at = ts;
      return { state: s, action: { kind: "done", resolution: c.resolution } };
    }
    const d = new Date(now); d.setDate(d.getDate() + 1);   // same day-unit as "baad"
    c.acted = [...(c.acted || []), ts];
    c.sleep_until = localDate(d);
    return { state: s, action: { kind: "at-source", source: c.source, until: c.sleep_until, times: c.acted.length } };
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
  // 11 Aug 2026 dead-wire repair — haan on a STALE BUILD card walks the daemon's
  // OWN restart door (RESTART_DOOR). `na` falls through to the retire below: a
  // refusal IS a decision and the stale build simply keeps running, which is what
  // it was doing anyway.
  if (c.dispatch.kind === "restart-daemon" && word === "haan") {
    return { state: s, action: { kind: "restart-dispatch", name: c.dispatch.name, cardId: c.id } };
  }
  // THE GATE'S CARD (overhaul §5.3, 18 Aug 2026) — the ONE card whose `na` acts:
  // "lane X so gaya … haan=sone do · na=jagao". haan = the verdict stands and the
  // lane wakes itself when its evidence/consumption returns; na = his override,
  // dispatched through the owner's own door (`brain.mjs gate wake <lane|all>`), a
  // force for one window — never a switch, never a list.
  if (c.dispatch.kind === "gate-wake") {
    if (word === "na") return { state: s, action: { kind: "gate-wake-dispatch", lane: c.dispatch.lane, cardId: c.id } };
    c.resolution = "haan — sota rahega; evidence/consumption lautte hi khud jaagega (THE GATE)";
    c.retired_at = ts;
    return { state: s, action: { kind: "done", resolution: c.resolution } };
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

// LOAD ZERO BLOCK 6 — the gate journal's LAST state per lane. brain.mjs is its sole writer; this is
// a READ of what that owner already published, exactly like the awayday/tiers/missions reads below.
// A transition journal, so the newest row for a lane IS its current state.
function liveGateStates() {
  const m = new Map();
  try {
    for (const l of readFileSync(GATE_JOURNAL, "utf8").split(/\r?\n/)) {
      if (!l.trim()) continue;
      let r; try { r = JSON.parse(l); } catch { continue; }
      if (r && r.lane && r.state) m.set(r.lane, r);
    }
  } catch { /* no journal = no opinion; a card is never retired on an absent source */ }
  return m;
}
function gatherSources() {
  const contract = readJson(CONTRACT);
  const staged = contract && Array.isArray(contract.staged) ? contract.staged : [];
  // 11 Aug 2026 wiring repair (see the MARKET CARD block above): the newest file
  // gets a LAYERED gist so the card can describe what it points at, and EVERY
  // market file is checked for a self-declared no-op — the whole set, not just
  // the newest, because c11/c12 are already standing on two of them and only a
  // retire-at-source pass can take them off the anchor without forging his word.
  // Four files today, ~one a week: cheap enough to read whole, every sync.
  let marketFile = null, marketHonest = "", marketVia = null;
  const marketNoopFiles = [];
  try {
    const files = readdirSync(MARKET_DIR).filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort().reverse();
    for (const f of files) {
      let txt; try { txt = readFileSync(join(MARKET_DIR, f), "utf8"); } catch { continue; }
      const why = marketNoopWhy(txt);
      if (why) marketNoopFiles.push({ file: f, why });
      if (f === files[0]) { marketFile = f; const g = marketGist(txt); marketHonest = g.gist; marketVia = g.via; }
    }
  } catch { /* no market dir yet — no card */ }
  // P5.2 — the first Gate-2 flagged doubt not yet carded (read-only on tape_room.json;
  // doubtminer.mjs owns that file, this only reads the flags it wrote).
  let gate2 = null;
  try {
    const tape = readJson(join(STATE_DIR, "tape_room.json"));
    const q = (tape && Array.isArray(tape.queue)) ? tape.queue : [];
    const flagged = q.filter((x) => Array.isArray(x.gate2_flag) && x.gate2_flag.length);
    // THE BRIDGES WIRE (11 Aug 2026) — GATE 2's other half reaches him HERE, and
    // this is the only lawful door it has. FORGE_SPEC §5 binds `bridges[].q` to the
    // same COLD-READER STANDARD as `doubts[].q`, doubtminer scans both since today
    // (`grep -n "bridges_checked" scripts/doubtminer.mjs`) — but a bridge flag has
    // no rematch queue to ride on (bridges are deliberately not queued; that call
    // is his), so without this read it would be a file nobody opens.
    // A flagged DOUBT still outranks a flagged BRIDGE: the doubt is armed as a
    // verbatim rematch prompt, so its wording costs him something every day it
    // stands. Same serialization as before — ONE gate2 card lives at a time.
    const bridgeFlagged = (tape && tape.gate2 && Array.isArray(tape.gate2.bridge_flags)) ? tape.gate2.bridge_flags : [];
    const cands = [
      ...flagged.map((x) => ({ kind: "doubt", capsule: x.capsule, ref: String(x.doubt_index), q: x.q_verbatim })),
      ...bridgeFlagged.map((f) => ({ kind: "bridge", capsule: f.capsule, ref: `b${f.bridge_index}`, q: f.q_first_100, to: f.to || null })),
    ];
    // THE READ-BACK (11 Aug 2026, dead-wire repair) — `live_keys` is every key that
    // is STILL flagged right now, and it is what lets a repaired doubt's card die
    // (see the retire in deriveCards). It is attached only when tape_room.json really
    // parsed with a queue array: `readJson` returns null for a missing/corrupt file
    // instead of throwing, so a bad read must look like "I don't know", never like
    // "nothing is flagged". No queue ⇒ no live_keys ⇒ nothing retires.
    const readOk = !!(tape && Array.isArray(tape.queue));
    const liveKeys = readOk ? cands.map((x) => `gate2:${x.capsule}:${x.ref}`) : null;
    if (cands.length || readOk) {
      const call = loadState();
      const carded = new Set(call.cards.filter((c) => c.source === "tape_room.gate2").map((c) => c.key));
      // the key gains a `b` prefix for bridges — doubt keys are numeric, so the two
      // id-spaces can never collide and an old doubt card keeps its exact identity.
      // `|| null` because the payload now also travels with NO next doubt — the last
      // flagged q can be repaired, and its card must still be told so.
      const nextDoubt = cands.find((x) => !carded.has(`gate2:${x.capsule}:${x.ref}`)) || null;
      gate2 = { doubt: nextDoubt, total: cands.length, fixed_or_carded: carded.size, live_keys: liveKeys };
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
  // …and does that streak still MEAN anything? brain.mjs owns brain_config.json; this
  // only reads it. An unreadable config is UNKNOWN, not dead — same discipline as B2's
  // "unreadable = unknown, not a card" — and unknown must never retire his card.
  const brainCfg = readJson(join(STATE_DIR, "brain_config.json"));
  const geminiLane = { live: brainCfg ? geminiLaneLive(brainCfg) : true };
  // B5 — the newest un-applied wind-tunnel proposal (gate_tune.mjs is the applier)
  // …and, since 11 Aug 2026, the READ-BACK that lets an old one die. DEAD WIRE,
  // PRODUCER_NO_CONSUMER: B5 was the only lane in this file that minted with no
  // retire-at-source (`grep -n 'retireAtSource(' scripts/captains_call.mjs` — ten
  // lanes, this one absent). The ledger row gated the MINT only, so the nightly
  // tunnel filed ONE PERMANENT CARD PER NIGHT for the identical diff: measured on
  // the live deck this morning, c15 (wt-2026-08-09), c22 (wt-2026-08-10) and c38
  // (wt-2026-08-11), all tau0-epsilon, all answer=null, all retired_at=null. Worse
  // than clutter — apply ONE and gate_tune's SERIAL LAW (gate_tune.mjs:99) refuses
  // every sibling, and the dispatch here exits 1 with "card stays live" (:1055), so
  // the leftovers become unanswerable AND unretirable forever.
  // `gatetuneSource` carries the two facts the mint already reads, and is null when
  // the folder is UNREADABLE — B2's discipline, unknown never retires his card.
  let gatetune = null, gatetuneSource = null;
  try {
    const dir = join(STATE_DIR, "brain_out", "nightshift");
    const fs2 = readdirSync(dir).filter((f) => /^wind_tunnel_\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
    // Same "any row with this id" test the mint gate has always used (a revert row
    // settles a proposal too) — one read, now shared by the mint and the retire.
    const ledgerIds = new Set(readLinesJson(join(STATE_DIR, "gate_tune_ledger.jsonl"))
      .map((r) => r && r.id).filter(Boolean));
    let newestId = null;
    if (fs2.length) {
      const f = fs2[fs2.length - 1];
      const p = readJson(join(dir, f));
      if (p && p.id) newestId = p.id;
      if (p && p.status === "proposed" && p.id && !ledgerIds.has(p.id)) {
        gatetune = { id: p.id, file: `dressing-room/state/brain_out/nightshift/${f}`, effect: p.predicted_effect || "", window: p.review_after_days };
      }
    }
    gatetuneSource = { newestId, ledgerIds };
  } catch { /* no proposals — no card, and UNKNOWN never retires one */ }
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
  // H3 — the model file, read whole (counts + stale_warming precomputed by its owner)
  const model = readJson(join(STATE_DIR, "nikhil_model.json"));
  // 11 Aug locator backfill — READ-ONLY on awayday.mjs's own state; all this
  // needs from it is the repo slug (see the backfill block in deriveCards).
  const awayday = readJson(join(STATE_DIR, "awayday.json"));

  return { staged, marketFile, marketHonest, marketVia, marketNoopFiles, gate2, missions, bench, tiers,
    rejirah, gem, claudeOut, oura, geminiLogin, geminiLane, gatetune, gatetuneSource, pendingFacts, m2, canonPatches, staleFacts, model, awayday,
    // LOAD ZERO BLOCK 6 (19 Aug 2026) — THE THREE STALE-CARD CLASSES, each read from the OWNER's own
    // published state, read-only, no spawn. See the retire-at-source block in deriveCards for why.
    gateStates: liveGateStates(), daemonPorts: readJson(join(STATE_DIR, "daemon_watchdog.json")), watchmanLast: readJson(join(STATE_DIR, "watchman_last.json")) };
}

// LOAD ZERO BLOCK 6 (19 Aug 2026) — THE ROAD, as this organ reaches it. Owners-only: this file
// never writes outbox.jsonl; it shells outbox.mjs's own `post` door, exactly as it already shells
// teaching_contract / hippocampus / brain for every dispatch. A road that is down must never cost
// him a card, so a failed post RE-OPENS nothing and simply leaves the card standing — the gate is
// re-run on the next sync and will route it then.
function postToRoad(card, now) {
  // A routed card is NEWS, and a card's line ends in the two words he could have said
  // ("· haan=sone do · na=sab 14d jagao"). Delivered as news that tail is an invitation to answer a
  // question whose door no longer exists — the reader would look for a card that is not there.
  // This strips the ORGANISM'S OWN card grammar (built by brain.mjs gateCardArgs), never his words:
  // his 19 Aug law binds code that branches on HIS speech, and this is code reading its own format.
  const subject = String(card.line || "").replace(/\s*·\s*haan=.*$/i, "").trim().slice(0, 280);
  const args = ["post", "--produced-by", `captains_call:${card.source || "card"}`, "--kind", "finding",
    "--subject", subject || String(card.line || "").slice(0, 280), "--key", `card:${card.key || card.id}`];
  try {
    const r = execFileSync(process.execPath, [join(__dirname, "outbox.mjs"), ...args],
      { encoding: "utf8", timeout: 20000, windowsHide: true, env: { ...process.env, ARSENAL_ORGAN: "1" } });
    return { ok: true, out: String(r || "") };
  } catch (e) { return { ok: false, why: String((e && e.message) || e).slice(0, 160) }; }
}
function sync(now = new Date()) {
  const next = deriveCards(loadState(), gatherSources(), now);
  // THE DECISION GATE runs AFTER derive, so it sees this sync's fresh mints too: a card minted and
  // gated in the same pass never reaches his lane at all. It runs BEFORE the write, so the retire
  // and the road row land together or not at all.
  const posted = [];
  decisionGate(next, now, (r) => { const p = postToRoad(r, now); if (p.ok) posted.push(r.id); else r._road_failed = p.why; });
  for (const r of (next.cards || [])) {
    // a card whose road post FAILED must not be left retired-with-no-delivery: put it back and let
    // the next sync try again. Silence is the disease this whole block exists to cure.
    if (r && r.resolution && /THE DECISION GATE/.test(r.resolution) && !posted.includes(r.id) && r.retired_at === now.toISOString()) {
      r.retired_at = null; r.resolution = null;
    }
  }
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

// ---------------------------------------------------------------------------
// THE ROLLING-KEY GUARD (10 Aug 2026, wire repair — pure so the selftest can
// hold it). B8's `--key` idempotency was EXACT-MATCH ONLY, and its only nightly
// caller defeated it: watchman.mjs probeCanon files `canon:<file>:<today>`, so
// an UNCHANGED condition minted four brand-new keys every night. Live proof at
// the time of the repair: c23–c26 filed 2026-08-10T13:31 while `git status
// --porcelain` on the same four canon files still returned the same four ` M`
// rows — so tonight would have minted c32–c35, tomorrow four more. Hand-filed
// is rank 0 and the fresh deck sorts least-dealt-first, so four fresh
// top-priority duplicates a night out-run his ~3 anchors/day: c9's gate2 doubt,
// gem-sync, gate-tune, the m2 review and the market cards become unreachable
// for as long as any canon file sits uncommitted. "baad" died the same way — a
// slept card is not an answered card, so the next night's mint walked straight
// past his own "not now".
// The caller does not have to change its key (watchman is owned elsewhere). A
// key ending in a bare :YYYY-MM-DD is a ROLLING key; its FAMILY — everything
// before that date — is the real identity. Family already LIVE (his word not
// yet on it, sleeping counts) ⇒ the ask is on the deck ⇒ nothing mints. Once he
// answers it, the same condition recurring tomorrow is a NEW fact and mints
// normally, which is the daily-key's only defensible intent.
// NOT touched: the event-day keys minted inside deriveCards (gem:sync:<stamp>,
// oura:auth:<day>, gemini:login:<day>) — their date names WHEN THE EVENT
// HAPPENED, so it is already stable and they never roll.
// ---------------------------------------------------------------------------
export const ROLLING_KEY = /^(.+):(\d{4}-\d{2}-\d{2})$/;
export function fileGuard(cards, key, keyed) {
  if (!keyed) return { mint: true, why: null };                       // no --key = the old free-mint path
  if ((cards || []).some((c) => c.key === key)) return { mint: false, why: `${key} already filed — nothing minted (idempotent by key)` };
  const m = ROLLING_KEY.exec(key);
  if (!m) return { mint: true, why: null };
  const family = m[1];
  const live = (cards || []).find((c) => !c.answer && !c.retired_at
    && ROLLING_KEY.test(String(c.key || "")) && ROLLING_KEY.exec(String(c.key))[1] === family);
  if (live) return { mint: false, why: `${family} already live as ${live.id} (${live.key}) — rolling day-key, nothing minted (same unanswered ask)` };
  return { mint: true, why: null };
}
// ---------------------------------------------------------------------------
// THE HAND-FILED LOCATOR (11 Aug 2026, wire repair — pure so the selftest can
// hold it). `file --line` hardcoded `dispatch:{kind:"none"}`, so an organ that
// KNEW where the evidence lived could not hand that over: awayday.mjs had the
// failing run's html_url in scope and could only spell the run NUMBER into the
// 140-char line (live proof: c27/c36, dispatch none, line "…(run 31359935125).
// Dekh lein?" while awayday.json:14 held the URL). His haan then left the
// session holding a bare integer — a command to remember, which the ANCHOR LAW
// forbids. `--open` lets the FILING organ carry the locator on the card, using
// the dispatch kind the derived mission cards have always used.
// NOT clipped, deliberately: this is a machine-supplied locator, not prose, and
// a URL cut at the tail is worse than no URL — it points nowhere and looks
// right. `clip` stays on `line`, which is what he actually reads.
// STILL NO EXEC: `open` only PRINTS the locator on haan (see applyAnswer) — the
// session reads it and walks him through it. Nothing acts for him.
// ---------------------------------------------------------------------------
export function fileDispatch(argv) {
  // THE GATE (18 Aug 2026): `--gate-wake <lane|all>` — the filing organ (brain.mjs)
  // names the lane whose `na` should wake it. Same shape as --open: a machine-
  // supplied locator on the card, and the CLI layer walks the owner's door.
  const gi = (argv || []).indexOf("--gate-wake");
  const lane = gi >= 0 ? argv[gi + 1] : "";
  if (lane && !String(lane).startsWith("--")) return { kind: "gate-wake", lane: String(lane) };
  const oi = (argv || []).indexOf("--open");
  const path = oi >= 0 ? argv[oi + 1] : "";
  if (!path || String(path).startsWith("--")) return { kind: "none" };
  return { kind: "open", path: String(path) };
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

async function main() {
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
    // 10 Aug repair: an at-source card can return AFTER a haan. Asking him the
    // same thing with no memory of his last word would read as the organ
    // forgetting — say it out loud instead. Count comes from acted[], not a guess.
    if ((c.acted || []).length) console.log(`   (pehle ${c.acted.length}× haan bola tha — source pe abhi tak nahi utra)`);
    console.log(liveCount === 1
      ? `   → haan / na / baad  (bas word bol de — session chala degi: node scripts/captains_call.mjs answer <word>)`
      : `   → haan / na / baad  (bol de — session chala degi: node scripts/captains_call.mjs answer ${c.id} <word>)`);
    return;
  }

  if (mode === "answer") {
    // LADDER A1 — `answer haan` (id elided) binds to the most recently dealt live card.
    const r = resolveAnswerArgs(loadState(), process.argv[3], process.argv[4]);
    if (r.error) { console.error(`captains_call: ${r.error}`); process.exit(1); }
    const { id, word: raw } = r;
    // LOAD ZERO BLOCK 5 (19 Aug 2026): the answer had to be LITERALLY haan|na|baad. He does not
    // speak in a three-word vocabulary — "nahi yaar", "haan kar do", "abhi nahi, kal", "chalega"
    // were all rejected by a door built for his convenience. The three words stay the FAST path
    // (they are already the answer, so nothing is spent); anything else is read for MEANING by the
    // one resolver. A lane that is down refuses rather than guessing — his answer is not a coin toss.
    let word = raw;
    if (!["haan", "na", "baad"].includes(word)) {
      const r = await resolveIntent(raw, { expects: ["yes", "no", "defer"], surface: "card" });
      word = { yes: "haan", no: "na", defer: "baad" }[r.intent] || null;
      if (!word) { console.error(`captains_call: "${raw}" ka matlab pakka nahi — haan | na | baad mein se ek bolo (${r.why || r.intent})`); process.exit(1); }
    }
    if (!id) { console.error("captains_call: answer [<id>] <haan|na|baad — ya apne shabdon mein>"); process.exit(1); }
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
    if (["pending-fact-dispatch", "forget-dispatch", "gatetune-dispatch", "gate-wake-dispatch", "restart-dispatch"].includes(action.kind)) {
      // 11 Aug 2026: restart-dispatch joins the same pattern. The argv comes from
      // the RESTART_DOOR TABLE keyed by the daemon's name — never from the card —
      // so a hand-edited state file can name a daemon but never a command. An
      // unknown name is a refusal, not a guess.
      const doorArgv = action.kind === "restart-dispatch" ? RESTART_DOOR[action.name] : null;
      if (action.kind === "restart-dispatch" && !doorArgv) {
        console.error(`captains_call: ${id} ${word} NOT recorded — no restart door for daemon "${action.name}" (card stays live)`);
        process.exit(1);
      }
      const argvFor = action.kind === "pending-fact-dispatch"
        ? [join(__dirname, "hippocampus.mjs"), action.verb, "--at", action.at]
        : action.kind === "forget-dispatch"
          ? [join(__dirname, "hippocampus.mjs"), "forget", action.id]
          : action.kind === "restart-dispatch"
            ? [join(__dirname, doorArgv[0]), ...doorArgv.slice(1)]
            : action.kind === "gate-wake-dispatch"
              ? [join(__dirname, "brain.mjs"), "gate", "wake", action.lane]   // THE GATE — his `na`, through the owner's door
              : [join(__dirname, "gate_tune.mjs"), "apply", join(__dirname, "..", action.file)];
      try {
        const out = execFileSync(process.execPath, argvFor, { encoding: "utf8", env: action.kind === "gate-wake-dispatch" ? { ...process.env, ARSENAL_GATE_BY: `card ${id} (his na)` } : process.env });
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
    else if (action.kind === "at-source") {
      // 10 Aug repair. His haan is recorded, not spent: the card comes back
      // tomorrow unless the SOURCE says the work landed. The door named here is
      // the existing owner surface for that source — this organ runs none of it
      // (no auto-act), it tells the session what he just said yes to.
      const door = action.source === "gem.sync_due" ? "run the /gem-sync skill NOW (it ends with `node scripts/nightshift.mjs gem-stamp`, which is what clears this card)"
        : action.source === "rejirah.pending" ? "run the /gist-patch skill NOW (his Save + mirror.mjs re-fetch is what clears this card)"
        : "walk the return leg NOW — /fire's \"le lo\", i.e. `node scripts/scout.mjs mission ingest <ID>` (the ingest is what clears this card)";
      console.log(`captains_call: ${id} haan (${action.times}× ab tak) — ${door}`);
      console.log(`   → card RETIRED nahi hui: source pe kaam dikhega tabhi jayegi, warna kal wapas (${action.until}).`);
    }
    else if (action.kind === "open") console.log(`captains_call: ${id} haan — read it now and walk him through it in ≤3 lines: ${action.path}`);
    else console.log(`captains_call: ${id} — ${action.resolution}`);
    return;
  }

  if (mode === "file") {
    const li = process.argv.indexOf("--line");
    const line = li >= 0 ? process.argv[li + 1] : "";
    if (!line) { console.error("captains_call: file --line \"<one-line ask>\" [--key <stable-key>] [--open <path-or-url>]"); process.exit(1); }
    // LADDER B8 (9 Aug 2026): --key makes filing IDEMPOTENT so a nightly organ
    // (the watchman's canon check) can re-file without minting duplicates — a
    // key ever seen (live OR settled) files nothing. The decision moved into
    // fileGuard() on 10 Aug (see its header) because exact-match alone was
    // silently defeated by that very caller's rolling `:<today>` suffix.
    const ki = process.argv.indexOf("--key");
    const key = ki >= 0 && process.argv[ki + 1] ? process.argv[ki + 1] : `manual:${now.toISOString()}`;
    const s = loadState();
    const guard = fileGuard(s.cards, key, ki >= 0);
    if (!guard.mint) {
      console.log(`captains_call: ${guard.why}`);
      return;
    }
    // LOAD ZERO BLOCK 6 (19 Aug 2026) — THE DECISION GATE at the hand-filed door. A derived card is
    // keyed and its reason lives in WHY_CODE_CANNOT_DECIDE; a hand-filed one has no fixed key, so
    // the FILING ORGAN states the reason here, per call. Absent ⇒ this is not a question, and the
    // decision gate (sync) puts it on the road as news instead of into his lane as homework.
    // Deliberately NOT a refusal at this door: 20 filing sites across 9 organs only clip this
    // command's stdout, so an `exit 1` here would make asks VANISH — the exact disease, one level
    // down. The card is accepted, and the gate decides where it belongs.
    const wi = process.argv.indexOf("--why-code-cannot-decide");
    const why = wi >= 0 && process.argv[wi + 1] ? clip(process.argv[wi + 1], 240) : null;
    s.cards.push({
      id: `c${s.next_id++}`, key, source: "hand-filed",
      // `--open` (11 Aug 2026) — the filing organ's own locator, see fileDispatch.
      line: clip(line, 140), dispatch: fileDispatch(process.argv),
      why_code_cannot_decide: why,
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
  // ── THE MARKET CARD'S CONTENT WIRE (11 Aug 2026 dead-wire repair) ─────────
  // Fixtures are the LIVE files' own shapes, trimmed: 2026-07-19 (a real proposal
  // that carries NO honest-read line — 3 of the 4 files on disk are this shape)
  // and 2026-08-09 (the producer declaring its own no-op).
  const MKT_HONEST = "## proposal\n\n**Honest read:** no contradiction with existing scout — this reinforces it.\n";
  const MKT_REAL = "# OPPONENT_SCOUT — Weekly Scan Proposal (2026-07-19)\n*THE SCOUT · proposal only, not written to canon*\n\n**Top 5 requested this week:**\n1. RAG — 6,196 open roles\n\n**Diff vs your coverage:** Maidan shape already matches — rag_pipeline stage = skills #1/#4.\n\n**Confidence:** counts are live posting totals — directional.\n";
  const MKT_NOOP = "# OPPONENT_SCOUT — Weekly Market Scan (proposal, 2026-08-09)\n\n## Market data: NOT AVAILABLE\nNo live scan payload in this job's input.\n\n## Recommendation\nNothing to propose to `OPPONENT_SCOUT.md` this week.\n";
  assert("market gist — LAYERING: the frozen honest-read scrape still wins when the producer writes one",
    marketGist(MKT_HONEST).via === "honest-read" && /no contradiction with existing scout/.test(marketGist(MKT_HONEST).gist));
  // THE DEAD WIRE ITSELF. `**Honest read:**` is a field NOTHING produces (grep it
  // in brain_config.json → 0), so on 3 of 4 live files the card had zero content.
  // This fails the moment the extraction narrows back to one unproduced field.
  assert("market gist — a file with NO 'Honest read:' line still yields a real quote (the dead wire, 11 Aug 2026)",
    marketHonestLegacy(MKT_REAL) === "" && /Maidan shape already matches/.test(marketGist(MKT_REAL).gist));
  assert("market card — the LINE carries that quote (no more anchor spent on a report it cannot describe)",
    (() => { const c = deriveCards(blank(), { marketFile: "2026-07-19.md", marketHonest: marketGist(MKT_REAL).gist }, T0)
      .cards.find((x) => x.key === "market:2026-07-19.md");
      return !!c && /Maidan shape already matches/.test(c.line); })());
  assert("market no-op — the producer's own 'NOT AVAILABLE' declaration mints NO card (anchor law)",
    marketNoopWhy(MKT_NOOP) !== null
    && !deriveCards(blank(), { marketFile: "2026-08-09.md", marketNoopFiles: [{ file: "2026-08-09.md", why: marketNoopWhy(MKT_NOOP) }] }, T0)
      .cards.some((c) => c.key === "market:2026-08-09.md"));
  assert("market no-op — a card already standing on a no-op file retires AT SOURCE, never as his answer",
    (() => { const pre = deriveCards(blank(), { marketFile: "2026-08-09.md" }, T0);          // minted the pre-repair way
      const post = deriveCards(pre, { marketFile: "2026-08-09.md", marketNoopFiles: [{ file: "2026-08-09.md", why: marketNoopWhy(MKT_NOOP) }] }, T0);
      const c = post.cards.find((x) => x.key === "market:2026-08-09.md");
      return !!c && !!c.retired_at && c.answer === null && /NOT AVAILABLE/.test(c.resolution); })());
  assert("market no-op — a REAL proposal is never silenced by the gate",
    marketNoopWhy(MKT_REAL) === null && marketNoopWhy(MKT_HONEST) === null);

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
  // THE BRIDGES WIRE (11 Aug 2026) — GATE 2's other half had no door to him.
  // doubtminer now scans `bridges[].q` (FORGE_SPEC §5 demanded it from 2026-07-02
  // and the code never did it), but a bridge flag rides no rematch queue, so this
  // card IS its only path to the captain. These go red if that read is removed.
  const G2B = { doubt: { kind: "bridge", capsule: "tokenization", ref: "b2", to: "hallucinations", q: "ye wala kaise judta?" }, total: 3, fixed_or_carded: 0 };
  const sb = deriveCards(blank(), { gate2: G2B }, T0);
  assert("GATE2/BRIDGE — a flagged bridge q becomes ONE card that names the BRIDGE and the concept it points at (not 'doubt' — wrong array on the gist)",
    sb.cards.length === 1 && sb.cards[0].source === "tape_room.gate2"
    && /Bridge-Q/.test(sb.cards[0].line) && /tokenization → hallucinations/.test(sb.cards[0].line)
    && /ye wala kaise judta/.test(sb.cards[0].line));
  assert("GATE2/BRIDGE — its key is b-prefixed, so a bridge and a doubt at the same index can never collide",
    sb.cards[0].key === "gate2:tokenization:b2" && sb.cards[0].key !== "gate2:tokenization:2");
  assert("GATE2/BRIDGE — the doubt shape still works unchanged (this lane's original callers are untouched)",
    /^Doubt cold-readable nahi/.test(sg.cards[0].line) && sg.cards[0].key === "gate2:embeddings:0");
  assert("GATE2/BRIDGE — serialization holds across kinds: one live gate2 card blocks the next, doubt or bridge",
    deriveCards(sg, { gate2: G2B }, T0).cards.length === 1);
  // RETIRE-AT-SOURCE (11 Aug 2026) — the dead wire. These four go red if the read-back
  // is dropped again: 1+2 are the wire itself and the same-sync seat hand-back, 3 is the
  // safety that stops an unreadable tape_room.json from retiring an ask he never
  // answered, 4 is the old payload shape still being inert.
  const NEXT = { capsule: "inference", doubt_index: 3, q_verbatim: "doosra flagged doubt" };
  const sgFixed = deriveCards(sg, { gate2: { doubt: NEXT, total: 16, fixed_or_carded: 1, live_keys: ["gate2:inference:3"] } }, T0);
  assert("GATE2/RETIRE — a doubt repaired at the gist (its flag gone) retires its card: it must not outlive its ask",
    sgFixed.cards.find((c) => c.key === "gate2:embeddings:0").retired_at !== null
    && /gate-2 flag is gone/.test(sgFixed.cards.find((c) => c.key === "gate2:embeddings:0").resolution));
  assert("GATE2/RETIRE — the freed seat is refilled in the SAME sync (B1's discipline), so the next flagged doubt is not one anchor late",
    sgFixed.cards.length === 2
    && sgFixed.cards.some((c) => c.key === "gate2:inference:3" && !c.retired_at && !c.answer));
  assert("GATE2/RETIRE — a still-flagged doubt is NEVER retired (live_keys still holds its key)",
    deriveCards(sg, { gate2: { ...G2, live_keys: ["gate2:embeddings:0"] } }, T0)
      .cards.find((c) => c.key === "gate2:embeddings:0").retired_at === null);
  assert("GATE2/RETIRE — unknown ≠ repaired: no live_keys (unreadable tape_room.json, or the pre-11-Aug payload) retires NOTHING",
    deriveCards(sg, { gate2: null }, T0).cards.find((c) => c.key === "gate2:embeddings:0").retired_at === null
    && deriveCards(sg, { gate2: G2 }, T0).cards.find((c) => c.key === "gate2:embeddings:0").retired_at === null);
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
    sm1.cards.length === 1 && sm1.cards[0].key === "mission:audit-fire:M01"
    && sm1.cards[0].dispatch.kind === "open" && /M01/.test(sm1.cards[0].dispatch.path));
  assert("MISSIONS — fire-nudge idempotent across syncs",
    deriveCards(sm1, { missions: MISS_STAGED }, T0).cards.length === 1);
  {
    // WIRING REPAIR (10 Aug 2026) — the fire-nudge must READ scout's fire stamp.
    // Pre-repair, `fired_at` had no reader here: the card kept asking him to fire
    // an already-fired M01 (a haan = a re-burnt Deep Research run), and the first
    // RETURN retired the nudge forever so M02–M04 never got a fire card (live
    // proof: c10 in captains_call.json, retired 2026-08-10T17:15 on M01's ingest).
    const fired = (over) => ({ ...MISS_STAGED, missions: MISS_STAGED.missions.map((m) => (m.id === "M01" ? { ...m, ...over } : m)) });
    const smF = deriveCards(sm1, { missions: fired({ fired_at: "2026-08-10T11:12:14.640Z" }) }, T0);
    assert("FIRE STAMP — his fire retires the M01 nudge by reading fired_at, and NOTHING re-asks while it is in flight",
      smF.cards.find((c) => c.key === "mission:audit-fire:M01").retired_at !== null
      && /fired_at/.test(smF.cards.find((c) => c.key === "mission:audit-fire:M01").resolution)
      && !smF.cards.some((c) => /^mission:audit-fire/.test(c.key) && !c.retired_at));
    const smA = deriveCards(smF, { missions: fired({ fired_at: "2026-08-10T11:12:14.640Z", ingested_at: "2026-08-10T15:41:08.736Z", report: "scout_reports/m1.md" }) }, T0);
    assert("FIRE STAMP — the return ADVANCES the nudge to M02 (pre-repair the first return killed it forever)",
      smA.cards.some((c) => c.key === "mission:audit-fire:M02" && !c.retired_at && /M02/.test(c.dispatch.path) && /1\/2 wapas/.test(c.line)));
    assert("FIRE STAMP — target is derived from the row's own stamps; the frozen legacy engine still shows the old blindness",
      auditFireTarget(fired({ fired_at: "2026-08-10T11:12:14.640Z" }).missions, false) === null
      && auditFireTargetLegacy(fired({ fired_at: "2026-08-10T11:12:14.640Z" }).missions, false).id === "M01"
      && auditFireTarget(MISS_STAGED.missions, true) === null);
  }
  const MISS_RET = { missions: [
    { id: "M01", type: "audit", file: "f", staged_at: "2026-08-08T09:00:00Z", ingested_at: "2026-08-09T10:00:00Z", report: "scout_reports/mission_M01_2026-08-09.md" },
    { id: "M02", type: "audit", file: "f", staged_at: "2026-08-08T09:00:00Z", ingested_at: null, report: null },
    { id: "T-embeddings", type: "topic_open", file: "f", staged_at: "2026-08-08T09:00:00Z", ingested_at: "2026-08-09T11:00:00Z", report: "scout_reports/mission_T-EMBEDDINGS_2026-08-09.md" },
  ], syllabus_audit: { closed_at: null } };
  const sm2 = deriveCards(sm1, { missions: MISS_RET }, T0);
  assert("MISSIONS — a landed return auto-retires THAT mission's fire-nudge and hands the seat to the next un-fired one",
    sm2.cards.find((c) => c.key === "mission:audit-fire:M01").retired_at !== null
    && sm2.cards.some((c) => c.key === "mission:audit-fire:M02" && !c.retired_at));
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

    // ── WIRING REPAIR (10 Aug 2026) — AN ASK MUST NOT DIE BY BEING ANSWERED ───
    // The dead wire, verbatim from the live deck: c13 `gem:sync:2026-07-30`,
    // dispatch `none`, stamp unmoved 11 days. A haan retired it AND mint() then
    // refused that key forever, so the Gem could go stale in silence with the
    // organ printing "done on his word". These five checks fail if that returns.
    {
      const GEM = { days: 11, stamp: "2026-07-30" };
      const s0 = deriveCards(blank(), { gem: GEM }, T);
      const card = s0.cards.find((c) => c.source === "gem.sync_due");
      assert("REPAIR 10 Aug — the three source-verified asks dispatch `at-source`, never `none`",
        card.dispatch.kind === "at-source"
        && deriveCards(blank(), { rejirah: RJ }, T).cards[0].dispatch.kind === "at-source"
        && deriveCards(blank(), { missions: { missions: [{ id: "M01", type: "audit", file: "f", fired_at: "2026-08-07T09:00:00Z", ingested_at: null }], syllabus_audit: { closed_at: null } } }, T)
             .cards.find((c) => c.key.startsWith("mission:return:")).dispatch.kind === "at-source");

      const h = applyAnswer(s0, card.id, "haan", T);
      const after = h.state.cards.find((c) => c.id === card.id);
      assert("REPAIR 10 Aug — haan RECORDS his word and sleeps a day, but does NOT retire and does NOT set answer",
        h.action.kind === "at-source" && h.action.until === "2026-08-10"
        && after.answer === null && after.retired_at === null && (after.acted || []).length === 1
        && after.sleep_until === "2026-08-10");

      // THE WIRE ITSELF: source unmoved ⇒ the same card is back tomorrow. Under
      // the old engine this deck was empty forever and the ask was unreachable.
      const T2 = new Date("2026-08-10T10:00:00+05:30");
      const stillDue = deriveCards(h.state, { gem: GEM }, T2);
      assert("REPAIR 10 Aug — stamp unmoved ⇒ the SAME card is live again the next day (the ask survived his haan)",
        stillDue.cards.filter((c) => c.source === "gem.sync_due").length === 1
        && stillDue.cards.find((c) => c.id === card.id).retired_at === null
        && (pickCard(stillDue, { today: "2026-08-10" }) || {}).id === card.id);

      // …and the work landing is still the ONLY true ending.
      const done = deriveCards(h.state, { gem: null }, T2);
      assert("REPAIR 10 Aug — the Gem actually synced ⇒ retire-at-source, with the true epitaph",
        done.cards.find((c) => c.id === card.id).retired_at !== null
        && /the Gem got synced/.test(done.cards.find((c) => c.id === card.id).resolution || ""));

      // GUARDS on the other side of the line: `na` is a decision (needs no proof),
      // and a hand-filed card has NO source condition — haan must still end it.
      const n = applyAnswer(s0, card.id, "na", T);
      const hf = { ...blank(), cards: [{ id: "cH", key: "manual:x", source: "hand-filed", line: "x", dispatch: { kind: "none" }, filed_at: "2026-08-09T09:00:00Z", dealt: [], answer: null, answered_at: null, sleep_until: null, retired_at: null, resolution: null }] };
      const hfA = applyAnswer(hf, "cH", "haan", T);
      assert("REPAIR 10 Aug — na still retires on the spot, and a hand-filed haan still ends its card (no source to verify)",
        n.action.kind === "done" && n.state.cards.find((c) => c.id === card.id).retired_at !== null
        && hfA.action.kind === "done" && hfA.state.cards[0].retired_at !== null);

      // MIGRATION: a pre-repair card already on the live deck (exactly c13's shape)
      // gets the new dispatch at the next sync; settled history is never rewritten.
      const legacy = { version: 1, next_id: 2, cards: [
        { id: "c13", key: "gem:sync:2026-07-30", source: "gem.sync_due", line: "x", dispatch: { kind: "none" }, filed_at: "2026-08-09T09:00:00Z", dealt: [], answer: null, answered_at: null, sleep_until: null, retired_at: null, resolution: null },
        { id: "c1", key: "rejirah:old:2026-07-01", source: "rejirah.pending", line: "y", dispatch: { kind: "none" }, filed_at: "2026-07-01T09:00:00Z", dealt: [], answer: "haan", answered_at: "2026-07-02T09:00:00Z", sleep_until: null, retired_at: "2026-07-02T09:00:00Z", resolution: "haan — done on his word (no exec by design, v1)" },
      ] };
      const mig = deriveCards(legacy, { gem: GEM }, T);
      assert("REPAIR 10 Aug — the live pre-repair card migrates to at-source; a settled one keeps its history verbatim",
        mig.cards.find((c) => c.id === "c13").dispatch.kind === "at-source"
        && mig.cards.find((c) => c.id === "c1").dispatch.kind === "none"
        && mig.cards.find((c) => c.id === "c1").retired_at === "2026-07-02T09:00:00Z");
    }
    // B4b DEAD-WIRE GUARD (10 Aug 2026) — the ask must have an ENGINE behind it.
    // brain_config live this run: gemini.enabled=true but 0 of 30 jobs ride it, and
    // the ledger's last gemini row is 17 Jul, so the streak can never move again.
    // If this ever fails, c14 is back to holding an anchor seat forever.
    const GL = { streak: 6, day: "2026-08-09" };
    const DEAD = { live: false };
    assert("B4b — engine liveness is brain's own gate: flag ON but no job riding it = DEAD (that is today's brain_config)",
      geminiLaneLive({ gemini: { enabled: true }, jobs: [{ id: "x", engine: "claude" }] }) === false
      && geminiLaneLive({ gemini: { enabled: true }, jobs: [{ id: "g1", engine: "gemini" }] }) === true
      && geminiLaneLive({ gemini: { enabled: false }, jobs: [{ id: "g1", engine: "gemini" }] }) === false
      && geminiLaneLive({ jobs: [{ id: "g1", engine: "gemini" }] }) === false
      && geminiLaneLive(null) === false);
    assert("B4b — a frozen streak with NO engine behind it mints NOTHING (a consumer with no producer must not ask him)",
      deriveCards(blank(), { geminiLogin: GL, geminiLane: DEAD }, T).cards.length === 0);
    const sgDead = deriveCards(deriveCards(blank(), { geminiLogin: GL }, T), { geminiLogin: GL, geminiLane: DEAD }, T);
    assert("B4b — an already-live gemini card retires when the engine retires, with the HONEST reason (not 'a gemini run succeeded' — that row can never be written)",
      sgDead.cards.length === 1 && sgDead.cards[0].retired_at !== null
      && /no committed job rides the gemini engine/.test(sgDead.cards[0].resolution));
    assert("B4b — the day a gemini job returns to brain_config, the ask re-arms by itself (gated, never deleted)",
      deriveCards(blank(), { geminiLogin: GL, geminiLane: { live: true } }, T).cards.some((c) => c.key === "gemini:login:2026-08-09"));
    // B5 — gate-tune: haan dispatches the owner's apply
    const sgt = deriveCards(blank(), { gatetune: { id: "wt-2026-08-09-tau1_base", file: "dressing-room/state/brain_out/nightshift/wind_tunnel_2026-08-09.json", effect: "wakes/day toward band", window: 14 } }, T);
    const gtA = applyAnswer(sgt, sgt.cards[0].id, "haan", T);
    assert("B5 — the wind-tunnel card carries the proposal file; haan hands gate_tune.mjs apply to the CLI layer",
      sgt.cards.length === 1 && sgt.cards[0].key === "gatetune:wt-2026-08-09-tau1_base"
      && gtA.action.kind === "gatetune-dispatch" && /wind_tunnel_2026-08-09\.json$/.test(gtA.action.file));
    // B5 RETIRE-AT-SOURCE (11 Aug 2026) — the dead wire that let three cards
    // (c15/c22/c38, one per night, identical tau0-epsilon diff) sit unretirable in
    // the live deck. Fails loudly if the read-back is ever unwired again.
    const GT9 = { id: "wt-2026-08-09-tau1_base", file: "dressing-room/state/brain_out/nightshift/wind_tunnel_2026-08-09.json", effect: "wakes/day toward band", window: 14 };
    const GT10 = { id: "wt-2026-08-10-tau1_base", file: "dressing-room/state/brain_out/nightshift/wind_tunnel_2026-08-10.json", effect: "wakes/day toward band", window: 14 };
    const src = (newestId, ids = []) => ({ newestId, ledgerIds: new Set(ids) });
    const gtNight2 = deriveCards(sgt, { gatetune: GT10, gatetuneSource: src("wt-2026-08-10-tau1_base") }, T);
    const gtOld = gtNight2.cards.find((c) => c.key === "gatetune:wt-2026-08-09-tau1_base");
    const gtNew = gtNight2.cards.find((c) => c.key === "gatetune:wt-2026-08-10-tau1_base");
    assert("B5 — tonight's proposal RETIRES last night's card in the same sync: never two gate-tune asks in the deck (the SERIAL LAW cannot honour two)",
      gtNight2.cards.length === 2 && gtOld.retired_at !== null && /newer wind-tunnel proposal replaced it/.test(gtOld.resolution)
      && gtNew.retired_at === null
      && gtNight2.cards.filter((c) => c.source === "nightshift.gate_tune" && !c.answer && !c.retired_at).length === 1);
    const gtApplied = deriveCards(sgt, { gatetune: null, gatetuneSource: src("wt-2026-08-09-tau1_base", ["wt-2026-08-09-tau1_base"]) }, T);
    assert("B5 — a ledger row (apply OR revert) retires the card at source: gate_tune.mjs settled it, so the ask is over",
      gtApplied.cards[0].retired_at !== null && /ledger row for this proposal/.test(gtApplied.cards[0].resolution));
    assert("B5 — an UNREADABLE proposal folder retires NOTHING (B2's discipline: unknown never kills his card), and neither does an empty one",
      deriveCards(sgt, { gatetune: null, gatetuneSource: null }, T).cards[0].retired_at === null
      && deriveCards(sgt, { gatetune: null, gatetuneSource: src(null) }, T).cards[0].retired_at === null);
    assert("B5 — a card he ALREADY answered keeps HIS resolution; the retire never rewrites his word",
      (() => {
        const answered = applyAnswer(deriveCards(blank(), { gatetune: GT9, gatetuneSource: src("wt-2026-08-09-tau1_base") }, T), "c1", "na", T).state;
        const after = deriveCards(answered, { gatetune: GT10, gatetuneSource: src("wt-2026-08-10-tau1_base") }, T);
        return after.cards.find((c) => c.key === "gatetune:wt-2026-08-09-tau1_base").resolution === "na — retired";
      })());
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
    // ── THE STALE-DAEMON DOOR (11 Aug 2026 dead-wire repair — see RESTART_DOOR) ──
    // These fail the moment a STALE BUILD card goes back to promising a restart it
    // cannot perform. The fixture is the LIVE shape, copied off c33/c34 on the deck:
    // watchdog-worded, hand-filed, dispatch kind "none".
    const staleCard = (name, id) => ({ id, key: `daemon:stale:${name}:2026-08-10`, source: "hand-filed",
      line: `${name} STALE BUILD — purane code pe chal raha hai (aaj ke conductor ne pakda). Restart karun? Live daemon kill sirf aapke word se.`,
      dispatch: { kind: "none" }, filed_at: "2026-08-10T18:04:50.824Z", dealt: [], answer: null,
      answered_at: null, sleep_until: null, retired_at: null, resolution: null });
    const deck = deriveCards({ ...blank(), cards: [staleCard("cortex", "c34"), staleCard("thalamus", "c33")] }, {}, T);
    const dCortex = deck.cards.find((c) => c.id === "c34"), dThal = deck.cards.find((c) => c.id === "c33");
    assert("STALE DAEMON — a daemon WITH a restart door loses the dead kind:\"none\"; one without keeps v1's honest no-exec rather than a lie",
      dCortex.dispatch.kind === "restart-daemon" && dCortex.dispatch.name === "cortex"
      && dThal.dispatch.kind === "none" && !RESTART_DOOR.thalamus);
    const rH = applyAnswer(deck, "c34", "haan", T), rN = applyAnswer(deck, "c34", "na", T);
    assert("STALE DAEMON — haan walks the daemon's OWN door from the table (never an argv the card carries); na retires and the stale build just keeps running",
      rH.action.kind === "restart-dispatch" && rH.action.name === "cortex"
      && (RESTART_DOOR[rH.action.name] || []).join(" ") === "cortex.mjs restart"
      && rN.action.kind === "done" && /na — retired/.test(rN.action.resolution));
    assert("STALE DAEMON — settled history is never rewritten, and the CLI's dispatch block still routes restart-dispatch to the owner",
      deriveCards({ ...blank(), cards: [{ ...staleCard("cortex", "c40"), retired_at: "2026-08-10T19:00:00Z" }] }, {}, T).cards[0].dispatch.kind === "none"
      && /"restart-dispatch"\]\.includes\(action\.kind\)/.test(readFileSync(fileURLToPath(import.meta.url), "utf8")));
    // H3 — the weekly model audit: week-keyed to Sunday, minted from Sunday
    // ONWARD (a slept-through Sunday still mints Monday), counts precomputed
    // by the owner, last week's unanswered card superseded never stacked.
    const NM = { edges: [{ id: "a>b", status: "tested" }], counts: { tested: 1, warming: 0, retired: 0 }, stale_warming: 0 };
    const tueT = new Date(2026, 7, 11, 10, 0);   // Tue 11 Aug — Sunday of that week = 09 Aug
    const snm = deriveCards(blank(), { model: NM }, tueT);
    assert("H3 — the weekly model-audit card mints week-keyed to Sunday, even minted mid-week, counts from the owner",
      snm.cards.length === 1 && snm.cards[0].key === "model:audit:2026-08-09"
      && /1 tested/.test(snm.cards[0].line) && snm.cards[0].source === "nikhil_model.weekly");
    const nextWk = deriveCards(snm, { model: NM }, new Date(2026, 7, 18, 10, 0));   // Tue next week
    assert("H3 — next week's card supersedes the unanswered one (retired at source, never stacked)",
      nextWk.cards.some((c) => c.key === "model:audit:2026-08-16")
      && nextWk.cards.find((c) => c.key === "model:audit:2026-08-09").retired_at !== null);
    assert("H3 — an empty model mints NO card (machinery precedes the audit)",
      deriveCards(blank(), { model: { edges: [] } }, tueT).cards.length === 0);
    // ranks — integrity tier vs outward tier
    const mixed = deriveCards(blank(), { rejirah: RJ, gem: { days: 10, stamp: "2026-07-30" } }, T);
    assert("B — rejirah (integrity) outranks the infra tier on a fresh deck",
      pickCard(mixed, { today: "2026-08-09" }).source === "rejirah.pending");
    // LADDER C2 — the return-leg watcher
    const MISS_FIRED = { missions: [
      { id: "M01", type: "audit", file: "f", staged_at: "2026-08-06T09:00:00Z", fired_at: "2026-08-07T10:00:00Z", ingested_at: null, report: null },
      { id: "M02", type: "audit", file: "f", staged_at: "2026-08-06T09:00:00Z", fired_at: "2026-08-09T09:30:00+05:30", ingested_at: null, report: null },
      { id: "M03", type: "audit", file: "f", staged_at: "2026-08-06T09:00:00Z", fired_at: "2026-08-07T10:00:00Z", ingested_at: "2026-08-08T10:00:00Z", report: "r.md" },
    ], syllabus_audit: { closed_at: null } };
    const src2 = deriveCards(blank(), { missions: MISS_FIRED }, T);
    assert("C2 — fired >24h with no return ⇒ ONE 'le lo?' card; a fresh fire and an ingested one stay silent",
      src2.cards.filter((c) => /^mission:return:/.test(c.key)).length === 1
      && src2.cards.some((c) => c.key === "mission:return:M01:2026-08-07" && /le lo/.test(c.line)));
    const src3 = deriveCards(src2, { missions: { ...MISS_FIRED, missions: MISS_FIRED.missions.map((m) => (m.id === "M01" ? { ...m, ingested_at: "2026-08-09T11:00:00Z" } : m)) } }, T);
    assert("C2 — the return landing retires the watcher card at source",
      src3.cards.find((c) => c.key === "mission:return:M01:2026-08-07").retired_at !== null);

    // ── THE ROLLING-KEY GUARD (10 Aug 2026 wire repair) ────────────────────
    // Replayed exactly as watchman.mjs probeCanon fires it: one
    // `file --key canon:<file>:<today>` per dirty canon file, EVERY night,
    // against a condition that has not changed. Before the guard that minted
    // four permanent rank-0 duplicates a night — live evidence c23–c26, filed
    // 2026-08-10T13:31, with the same four ` M` rows still in git status.
    const mkFiled = (id, key, over = {}) => ({
      id, key, source: "hand-filed", line: "Canon OPS_STATE.md mein UNCOMMITTED badlav hai (M) — aapke word se tha?",
      dispatch: { kind: "none" }, filed_at: "2026-08-10T13:31:04.054Z", dealt: [], answer: null,
      answered_at: null, sleep_until: null, retired_at: null, resolution: null, ...over,
    });
    const night1 = [mkFiled("c24", "canon:OPS_STATE.md:2026-08-10")];
    assert("ROLLING KEY — the same unchanged canon drift on a NEW day mints NOTHING (a :<today> suffix can no longer defeat --key)",
      fileGuard(night1, "canon:OPS_STATE.md:2026-08-11", true).mint === false
      && fileGuard(night1, "canon:OPS_STATE.md:2026-08-12", true).mint === false
      && fileGuard(night1, "canon:OPS_STATE.md:2026-08-10", true).mint === false);
    assert("ROLLING KEY — 'baad' is not an answer: a sleeping card still blocks tomorrow's re-mint (no walking past his own not-now)",
      fileGuard([mkFiled("c24", "canon:OPS_STATE.md:2026-08-10", { sleep_until: "2026-08-11" })], "canon:OPS_STATE.md:2026-08-11", true).mint === false);
    assert("ROLLING KEY — a DIFFERENT canon file is a different ask and still mints (the guard dedups the ask, not the lane)",
      fileGuard(night1, "canon:THE_GAFFER.md:2026-08-11", true).mint === true);
    assert("ROLLING KEY — once his word lands, the condition recurring tomorrow is a NEW fact and mints again",
      fileGuard([mkFiled("c24", "canon:OPS_STATE.md:2026-08-10", { answer: "haan", answered_at: "2026-08-10T18:00:00Z" })], "canon:OPS_STATE.md:2026-08-11", true).mint === true
      && fileGuard([mkFiled("c24", "canon:OPS_STATE.md:2026-08-10", { retired_at: "2026-08-10T18:00:00Z" })], "canon:OPS_STATE.md:2026-08-11", true).mint === true);
    assert("ROLLING KEY — non-rolling keys untouched: awayday's run-id key and an un-keyed hand file behave exactly as before",
      fileGuard([mkFiled("c27", "awayday:red:31359935125")], "awayday:red:31359935126", true).mint === true
      && fileGuard([mkFiled("c27", "awayday:red:31359935125")], "awayday:red:31359935125", true).mint === false
      && fileGuard(night1, "manual:2026-08-11T05:00:00.000Z", false).mint === true);
    // The guard is only real if the CLI actually routes through it (awayday.mjs:538
    // precedent — assert the shape of the code, not just the pure function).
    const ownSrc = readFileSync(join(__dirname, "captains_call.mjs"), "utf8");
    const fileMode = ownSrc.slice(ownSrc.indexOf('if (mode === "file")'), ownSrc.indexOf('if (mode === "status")'));
    assert("ROLLING KEY — `file` mode routes its mint decision through fileGuard, with no inline exact-match left to regress to",
      /fileGuard\(s\.cards, key, ki >= 0\)/.test(fileMode) && !/s\.cards\.some\(\(c\) => c\.key === key\)/.test(fileMode));

    // ── THE HAND-FILED LOCATOR (11 Aug 2026) ────────────────────────────────
    // These fail the moment a filing organ's locator stops reaching him: either
    // the parser drops it, the CLI hardcodes `none` again, or haan stops
    // printing it. c27/c36 (awayday) are the live cards that had no locator.
    const URL_ = "https://github.com/nikhil1429/arsenal-ai-fc/actions/runs/31436912105";
    assert("LOCATOR — `--open` on a hand file becomes an `open` dispatch carrying the URL VERBATIM (a clipped URL points nowhere and looks right)",
      fileDispatch(["node", "captains_call.mjs", "file", "--line", "x", "--key", "awayday:red:1", "--open", URL_]).kind === "open"
      && fileDispatch(["node", "captains_call.mjs", "file", "--line", "x", "--open", URL_]).path === URL_);
    assert("LOCATOR — no `--open` (or a bare flag with no value) stays `none`: every existing caller is untouched",
      fileDispatch(["node", "x", "file", "--line", "x"]).kind === "none"
      && fileDispatch(["node", "x", "file", "--open"]).kind === "none"
      && fileDispatch(["node", "x", "file", "--open", "--key", "k"]).kind === "none");
    assert("LOCATOR — `file` mode actually WIRES fileDispatch; the hardcoded `{ kind: \"none\" }` is gone from it",
      /dispatch: fileDispatch\(process\.argv\)/.test(fileMode) && !/dispatch: \{ kind: "none" \}/.test(fileMode));
    {
      // The far end: his haan must hand the SESSION the locator, not a number.
      const s0 = { ...blank(), next_id: 2, cards: [{
        id: "c1", key: "awayday:red:31436912105", source: "hand-filed",
        line: "away-day CI lane RED on 8df28ba — the cloud clean-checkout is failing (run 31436912105). Dekh lein?",
        dispatch: { kind: "open", path: URL_ }, filed_at: "2026-08-11T00:00:00Z",
        dealt: ["2026-08-11T01:00:00Z"], answer: null, answered_at: null, sleep_until: null, retired_at: null, resolution: null }] };
      const hn = applyAnswer(s0, "c1", "haan", new Date("2026-08-11T02:00:00Z"));
      assert("LOCATOR — haan on an awayday red hands the session the RUN URL (no exec, no auto-act — it is printed for the session to read)",
        hn.action.kind === "open" && hn.action.path === URL_);

      // The two cards already on the deck (c27, c36) were filed before the repair.
      const AW = { repo: "nikhil1429/arsenal-ai-fc", run_url: URL_ };
      const old = { ...blank(), next_id: 3, cards: [
        mkFiled("c27", "awayday:red:31359935125"),
        mkFiled("c36", "awayday:red:31436912105", { answer: "haan", answered_at: "2026-08-11T00:00:00Z" }),
      ] };
      const mg = deriveCards(old, { awayday: AW }, T0);
      assert("LOCATOR BACKFILL — a live pre-repair awayday card gains the derived run link (repo from awayday.json + the run id in its own key); a settled one is never rewritten",
        mg.cards[0].dispatch.kind === "open"
        && mg.cards[0].dispatch.path === "https://github.com/nikhil1429/arsenal-ai-fc/actions/runs/31359935125"
        && mg.cards[1].dispatch.kind === "none");
      assert("LOCATOR BACKFILL — no repo in awayday.json ⇒ NOTHING is written (a wrong link is worse than none)",
        deriveCards(old, { awayday: null }, T0).cards[0].dispatch.kind === "none"
        && deriveCards(old, { awayday: { repo: "" } }, T0).cards[0].dispatch.kind === "none");
    }
    // ── THE GATE'S CARD (overhaul §5.3, 18 Aug 2026) ────────────────────────
    // "lane X so gaya … haan=sone do · na=jagao": the ONE hand-filed card whose NA
    // acts. brain.mjs files it with `--gate-wake <lane|all>`; his na walks the
    // owner's own door (`brain gate wake`), his haan lets the verdict stand.
    {
      assert("GATE CARD — `--gate-wake <lane>` becomes a gate-wake dispatch naming the lane; `all` rides verbatim; a bare flag stays none",
        fileDispatch(["node", "x", "file", "--line", "l", "--key", "gate:teamtalk_am:2026-08-18", "--gate-wake", "teamtalk_am"]).kind === "gate-wake"
        && fileDispatch(["node", "x", "file", "--line", "l", "--gate-wake", "teamtalk_am"]).lane === "teamtalk_am"
        && fileDispatch(["node", "x", "file", "--line", "l", "--gate-wake", "all"]).lane === "all"
        && fileDispatch(["node", "x", "file", "--line", "l", "--gate-wake"]).kind === "none");
      const g0 = { ...blank(), next_id: 2, cards: [{
        id: "c1", key: "gate:teamtalk_am:2026-08-18", source: "hand-filed",
        line: "teamtalk_am SO GAYA (C: never consumed) · jaagega: its output reaches him · haan=sone do · na=14d jagao",
        dispatch: { kind: "gate-wake", lane: "teamtalk_am" }, filed_at: "2026-08-18T00:00:00Z",
        dealt: [], answer: null, answered_at: null, sleep_until: null, retired_at: null, resolution: null }] };
      const na = applyAnswer(g0, "c1", "na", new Date("2026-08-18T01:00:00Z"));
      const ha = applyAnswer(g0, "c1", "haan", new Date("2026-08-18T01:00:00Z"));
      assert("GATE CARD — his NA hands the CLI a gate-wake-dispatch for that lane (the owner's door runs it; a failed dispatch keeps the card live, same as every owner-CLI dispatch)",
        na.action.kind === "gate-wake-dispatch" && na.action.lane === "teamtalk_am" && na.state.cards[0].answer === "na");
      assert("GATE CARD — his HAAN retires the card with the verdict standing (no exec: sleep is a verdict on evidence, and it wakes itself)",
        ha.action.kind === "done" && /khud jaagega|sota rahega/.test(ha.state.cards[0].resolution) && !!ha.state.cards[0].retired_at);
      assert("GATE CARD — the CLI's dispatch block routes gate-wake-dispatch to brain.mjs `gate wake <lane>` (grep-held, like restart-dispatch)",
        /"gate-wake-dispatch", "restart-dispatch"\]\.includes\(action\.kind\)/.test(readFileSync(fileURLToPath(import.meta.url), "utf8"))
        && /\[join\(__dirname, "brain\.mjs"\), "gate", "wake", action\.lane\]/.test(readFileSync(fileURLToPath(import.meta.url), "utf8")));
      // the rolling-key guard makes the card ONE per (lane, sleep episode)
      const g1 = { ...g0 };
      assert("GATE CARD — one per (lane, sleep-episode): a second file with the same family while the first is live mints nothing; after his word, a new episode's day-key mints again",
        fileGuard(g1.cards, "gate:teamtalk_am:2026-08-19", true).mint === false
        && fileGuard(na.state.cards, "gate:teamtalk_am:2026-08-25", true).mint === true);
    }
  }

  console.log(`\ncaptains_call selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();

export { loadState, sync };
