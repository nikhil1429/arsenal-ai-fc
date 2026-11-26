#!/usr/bin/env node
// @ts-check
// ============================================================================
// learnstate.mjs · ARSENAL AI FC — THE SESSION-AGNOSTIC KICKOFF (working-memory)
// ----------------------------------------------------------------------------
// WHAT: prints a compact "where am I" brief that ANY Claude Code session reads at
//   start (via the .claude/settings.json SessionStart hook) — so a FRESH session
//   is oriented from STATE, not from its own chat history. This is what makes
//   "learn on Claude Code" session-agnostic: sprint position + where he left off
//   + open loop + watch-list + next-up + the day's Examiner target, in one read.
// READS (all read-only, defensive): sprint.json (curriculum + live progress),
//   working_set.json (the distiller's 4-slot memory), weaknesses.json (watch-list).
//   Writes NOTHING (single-writer law intact).
//   L3 (15 Oct 2026): also READS dressing-room/state/resume_pointer.jsonl through its owner
//   (resume_pointer.mjs `latest`) for the first act — never `consume`; every day key here is IST.
//   L6 (15 Oct 2026) — "Writes NOTHING" above is SUPERSEDED, kept and dated, not cut: learnstate is the
//   SOLE WRITER of dressing-room/state/brief_log.jsonl. APPEND-ONLY (a row is never rewritten, never
//   back-filled), ONE row per brief HIS session printed, written AFTER the print off the FINAL text, from
//   main() only — never from brief(), which the suite calls on fixture dirs — under recordBriefed's guards
//   (ARSENAL_ORGAN=1 records nothing; the same named residual: an agent that never sets it still records).
//   Row: {v:1, id, ts, day, pehla_kaam, carries_from, carry, rejirah[], asked_first}; every day key IST.
//   It also READS compiled_notes.jsonl (L1's compiler is its SOLE WRITER — asked-first, C22), never writes it.
// ROUTING: current.track 'concept' -> FORGE (9-axis) · 'skill' (Python) -> the
//   JS->Python 5-phase loop (Claude learn -> Colab -> Coach Gem + CLOSE-PACKET).
// MODES: brief (default — for the SessionStart hook) · json · selftest · born (brief_log.jsonl's birth at its landing,
//   forks row 787 (1): created EMPTY iff absent, never truncated, never written once it exists)
// ============================================================================
import { readFileSync, existsSync, mkdtempSync, writeFileSync, mkdirSync, appendFileSync } from "node:fs";   // appendFileSync: L6 — brief_log.jsonl, this file's one write
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";   // L6 — a brief row's own id
import { fileURLToPath, pathToFileURL } from "node:url";
import { courseBrief, fmtStamp } from "./course.mjs";   // audit #35 — the course tracker's one reader (fmtStamp: 11 Aug sweep, the resume address)
import { pythonBrief } from "./python_state.mjs";   // audit #107 #26 — the Python track's one reader
import { loadCapsules, readLog, pendingCloses, openRound, intervalsOf } from "./rejirah.mjs";   // #107 pass 2 — un-pasted rounds; P7.B — the arbiter's live overdue read
import { loadFreshDrill } from "./examiner.mjs";   // 11 Aug 2026 dead-wire sweep — the drill's age gate belongs to its owner (see nextup)
import { isStale as forgeIsStale, STEPS as FORGE_STEPS } from "./forge_session.mjs";   // W0-D — the PEHLA KAAM line asks the pacer whether its session is stale, instead of re-deriving it · L3 — "STEP n/N" from the pacer's own list
import { latest as latestPointer, istDay, readRows as pointerRows } from "./resume_pointer.mjs";   // L3 (15 Oct 2026) — the pointer ledger, READ-ONLY here (`latest`, never `consume`) · the ONE IST day key · L6 — readRows: its stamps key "the day before" (the witness's CLASS D), read through the owner
import { preCyborg, gameOnEpoch } from "./registry.mjs";   // L6 · fate 18 — THE GAME-ON EPOCH: the ONE predicate (a date, never a list of names) gates every Re-Jirah name this brief serves
import { order as syllabusOrder, idOf as syllabusIdOf, closedSet as syllabusClosed, readLog as syllabusLog, coverOf as syllabusCover } from "./syllabus.mjs";   // ROW 1400 (4) — the study syllabus, READ-ONLY here (syllabus.mjs is the sole writer of its file and its coverage log)
import { derivedFloor } from "./sprintsync.mjs";   // A4 (4 Sep 2026) — the SYLLABUS FLOOR belongs to sprint.json's owner; this file reads it, it does not re-derive it
import { gateableOf, TRAP_BAR } from "./notes_compiler.mjs";   // unit mtrap (mtrap-9 b) — C22 counts a thin note by the compiler's ONE predicate, never a second count
import { starvedNightFor, recordConsumption, consumptionRows } from "./brain.mjs";   // 11 Aug 2026 dead-wire sweep — WHY the diary page is blank, in the brain's own words (see diaryLine) · recordConsumption: THE GATE's "briefed" stamp (18 Aug 2026), owner-held

// audit #11 — read capsule_map.json (capsule_bridge's own output, read-only) and say
// what is overdue for Re-Jirah. Reads a file, never computes a second schedule.
// AUDIT #107 second pass (5 Aug 2026) — A ROUND HE SAT BUT NEVER PASTED IS INVISIBLE.
// `close` records the round in rejirah_log.jsonl, but the capsule's `reJirahDone` only
// changes when he pastes into the gist and mirror.mjs pulls it back. In that gap five
// organs (fsrs · deep · capsule_bridge · dugout · shipped) still read the round as never
// served, and the ONLY thing that would ever tell him is a command he has to remember to
// run. So it rides the kickoff, above the overdue line: an un-pasted round makes every
// other Re-Jirah number on this screen wrong, which makes it the more urgent of the two.
// D / B5-REVERSE — the Gaffer's last spoken sitting, in ONE line, for this mouth.
// READ-ONLY: gaffer_state.mjs is the sole writer of both files. Deliberately terse
// and deliberately CONDITIONAL — a sitting that went fine says nothing, because a
// brief that reports a good day every day is a brief nobody reads.
function gafferSittingLine(dir, now = Date.now()) {
  const rd = (p) => { try { return JSON.parse(readFileSync(join(dir, p), "utf8")); } catch { return null; } };
  const st = rd("gaffer_state.json"), stand = rd("gaffer_standing.json");
  const bits = [];
  if (st && st.captain_turns) {
    const ageH = st.last_turn_at ? Math.round((now - new Date(st.last_turn_at).getTime()) / 3600000) : null;
    const when = ageH === null ? "" : ageH < 1 ? " (just now)" : ageH < 24 ? ` (${ageH}h ago)` : ` (${Math.round(ageH / 24)}d ago)`;
    // only the things this mouth can ACT on: an unfinished plan, and a drift count.
    if (st.declared_plan) bits.push(`plan agreed by voice${when}: ${clip(st.declared_plan.text, 110)}`);
    if (st.forgot_flags) bits.push(`he had to say "you forgot" ${st.forgot_flags}× in it`);
    if (st.open_question) bits.push(`left unresolved: ${clip(st.open_question, 90)}`);
  }
  // a standing instruction he gave the GAFFER out loud binds THIS mouth too — one
  // organism, and he should never have to repeat himself to a second surface.
  const ins = (stand && stand.instructions) || [];
  if (ins.length) bits.push(`STANDING (he said these out loud, they bind you too): ${ins.slice(-3).map(i => `[${i.label}] ${clip(i.text, 80)}`).join(" · ")}`);
  return bits.length ? `GAFFER (the voice surface — same organism, same laws): ${bits.join(" · ")}` : null;
}

function rejirahPendingLine(dir) {
  const caps = loadCapsules(join(dir, "capsules"));
  const rows = readLog(join(dir, "rejirah_log.jsonl"));
  const pend = pendingCloses(caps, rows);
  if (!pend.length) return null;
  const head = pend.slice(0, 3).map((p) => `${p.concept} R${p.round} (${p.due})`).join(" · ");
  return `⚠ RE-JIRAH PENDING GIST-WRITE (${pend.length}): ${head}${pend.length > 3 ? " …" : ""}`
    + `  — round baith chuka, gist mein abhi nahi. Tab tak fsrs/deep/capsule_bridge use "hua hi nahi" padhte hain.`
    + `  Patch: \`node scripts/rejirah.mjs pending\``;
}

// AUDIT #108 (6 Aug 2026) — THE ONLY SLOT ON THIS SCREEN WITH NO AGE ON IT.
// Every other line in this brief that is fed by a file someone else refreshes says how
// old it is: the working_set carries WS_STALE_DAYS + the "(Nd ago)" tag, and the sprint
// spine got SPRINT-STALE on 5 Aug for exactly this reason. This line did not — it printed
// `embeddings 42d` as if the 42 had been computed this morning. capsule_map.json is
// written ONLY by capsule_bridge.mjs on the morning conductor's run (its `generated_at`
// on disk today reads 2026-08-05T13:58Z while this brief is being read on 6 Aug), so the
// day-counts drift one further day behind reality for every conductor run that does not
// happen — and an overdue count that is quietly wrong is worse than one that is loudly
// old, because the whole point of this line is to rank what is rotting fastest.
// SAME PATTERN, NOT A NEW ONE: the existing ageDays() helper, the same "more than a day"
// boundary the working_set tag already uses (`wsAge >= 1`), and a MISSING generated_at is
// CALLED OUT rather than assumed fresh — an untimestamped map is the one you can least
// afford to trust silently. No new threshold is invented here.
// L6 · fate 18 (15 Oct 2026): FROZEN as it stood (L9), referenced by no caller — the gated reader is right below it.
function rejirahDueLineLegacy(dir, now = Date.now()) {
  const p = join(dir, "capsule_map.json");
  if (!existsSync(p)) return null;
  const m = JSON.parse(readFileSync(p, "utf8"));
  const od = (m.rejirah_overdue || []).filter((r) => (r.overdue_days || 0) > 0)
    .sort((a, b) => (b.overdue_days || 0) - (a.overdue_days || 0));
  if (!od.length) return null;
  const never = od.filter((r) => (r.rounds_done || 0) === 0).length;
  const head = od.slice(0, 3).map((r) => `${r.concept} ${r.overdue_days}d`).join(" · ");
  // DEAD-WIRE SWEEP (10 Aug 2026) — THE OWNER'S OWN HEADLINE HAD NO READER.
  // capsule_bridge composes ONE Hinglish sentence (`line`, capsule_bridge.mjs:239-243)
  // naming the worst-overdue capsule AND how many strike questions are already written
  // for it. Live today: "embeddings ka Re-Jirah 47 din overdue hai — aur uske 9 strike
  // sawaal already likhe rakhe hain." Repo-wide it had ZERO consumers — its only other
  // surface is that organ's stdout, and its one automated invoker (heartbeat.mjs:54,
  // shelled with stdio "pipe") discards stdout, so on every scheduled run the sentence
  // was composed for nobody.
  // The counts above this brief DOES derive (rejirah_overdue carries them). What it can
  // never derive is the strike count — and that is the half that removes the activation
  // cost: "queue khol, sawaal already likhe hue hain" is a different ask from "queue
  // khol". So the owner's sentence is rendered VERBATIM, never re-composed — the same
  // producer-composes/reader-renders rule the benchmark `needs[]` line at :124 follows,
  // and the same one setpiece uses for capsule_bridge's `fsrs_due_note`. The one-concept
  // overlap with the head is the deliberate price of not writing a SECOND sentence about
  // the same fact (a re-derived strike count here is exactly the drift that left `line`
  // orphaned in the first place).
  // ABSENCE STAYS ABSENCE: no `line` (a map written before the field existed, or a
  // half-written one) ⇒ nothing appended, and this slot renders byte-identically to
  // before. Nothing is invented to fill it.
  const ownLine = typeof m.line === "string" && m.line.trim() ? `  ${m.line.trim()}` : "";
  const mapAge = ageDays(m.generated_at, now);
  const mapTag = mapAge === null
    ? `  (is map pe koi generated_at nahi — ye din-ginti kitni purani hai, pata nahi: \`node scripts/capsule_bridge.mjs\`)`
    : mapAge >= 1
      ? `  (MAP ${Math.floor(mapAge)}d purana — ye din-ginti us din ki hai, aaj ki nahi: \`node scripts/capsule_bridge.mjs\`)`
      : "";
  return `RE-JIRAH OVERDUE (${od.length}): ${head}${od.length > 3 ? " …" : ""}`
    + (never ? ` — ${never} ka ek bhi round nahi hua.` : "")
    + `  Overdue = RIPE, late nahi. Queue: \`node scripts/deep.mjs due\` (cold, sirf sawaal).`
    + ownLine
    + mapTag;
}

// ── L6 · fate 18 (15 Oct 2026) · THE OVERDUE LINE PASSES THE EPOCH GATE (C23 — the one schedule) ──────────────
// The body above named capsule_map.json's overdue list as written. The map's rows carry no lock date ({concept,
// overdue_days, next_due, rounds_done}, capsule_bridge.mjs:293), so a map written by older code or on an older morning
// named a capsule GAME ON withdrew as "overdue", and this screen served it to him (fate 18; the producer itself is gated
// since W0-B, its reader was not). Now every name is checked against its OWN capsule's proof date through
// registry.preCyborg — the ONE predicate, a DATE, never a list of names; the epoch is the registry's row, never re-typed
// here. A name with no capsule to prove it cannot pass (fail closed). The owner's `line` names the map's worst-overdue
// concept, so it rides only when THAT concept passed. A withheld name is SAID once, never silently dropped, and an
// unreadable epoch names nothing and says why. Nothing else in the line moved: same counts, same age tag, same order.
/** proofOf — the epoch reading of ONE capsule: {concept, anchored_at, epoch_ok}. `anchored_at` is the instant its proof
 *  stands on (the later of the lock and the re-lock, measured the way registry.preCyborg measures them); `epoch_ok` is
 *  "a readable anchor AND not preCyborg". Throws only when the registry's epoch is unreadable (preCyborg's own law).
 *  @param {*} c */
export function proofOf(c) {
  const lock = Date.parse(String((c && c.lockedOn) || "") + "T00:00:00Z");
  const re = Date.parse(String((c && c.relockedOn) || ""));
  const at = Number.isFinite(lock) ? (Number.isFinite(re) && re > lock ? re : lock) : null;
  return { concept: String((c && c.id) || ""), anchored_at: at === null ? null : new Date(at).toISOString(), epoch_ok: at !== null && !preCyborg(c) };
}
/** rejirahDue — the gated overdue line AND what it serves: {line, served: proofOf()[], withheld: string[]} | null.
 *  @param {string} dir @param {number} [now] */
function rejirahDue(dir, now = Date.now()) {
  const m = readJson(join(dir, "capsule_map.json"));
  if (!m) return null;
  const od = (Array.isArray(m.rejirah_overdue) ? m.rejirah_overdue : []).filter((/** @type {*} */ r) => (r.overdue_days || 0) > 0)
    .sort((/** @type {*} */ a, /** @type {*} */ b) => (b.overdue_days || 0) - (a.overdue_days || 0));
  if (!od.length) return null;
  /** @type {any[]} */
  let caps = [];
  try { caps = loadCapsules(join(dir, "capsules")); } catch { caps = []; }   // an unreadable mirror proves nothing: every name is withheld
  const byId = new Map(caps.map((c) => [String(c.id).toLowerCase(), c]));
  /** @type {{row: any, proof: any}[]} */
  const served = [];
  /** @type {string[]} */
  const withheld = [];
  try {
    for (const r of od) {
      const c = byId.get(String(r.concept || "").toLowerCase());
      const p = c ? proofOf(c) : null;
      if (p && p.epoch_ok) served.push({ row: r, proof: p }); else withheld.push(String(r.concept || "?"));
    }
  } catch (e) {
    return { line: `RE-JIRAH GATE: GAME ON ka epoch padha nahi gaya (${clip(String((e && /** @type {*} */ (e).message) || e), 90)}) — koi Re-Jirah naam nahi diya. Registry row: \`node scripts/registry.mjs get --table mechanisms --subject game_on_epoch\``,
      served: [], withheld: od.map((/** @type {*} */ r) => String(r.concept || "?")) };
  }
  if (!served.length) {
    return { line: `RE-JIRAH GATE: map ke ${withheld.length} overdue naam GAME ON gate pe ruke (${withheld.join(" · ")}) — proof 30 Aug 2026 se pehle ka, ya capsule hi nahi. Map dobara: \`node scripts/capsule_bridge.mjs\``,
      served: [], withheld };
  }
  const list = served.map((s) => s.row);
  const never = list.filter((r) => (r.rounds_done || 0) === 0).length;
  const head = list.slice(0, 3).map((r) => `${r.concept} ${r.overdue_days}d`).join(" · ");
  const ownLine = typeof m.line === "string" && m.line.trim() && served.some((s) => s.row === od[0]) ? `  ${m.line.trim()}` : "";
  const mapAge = ageDays(m.generated_at, now);
  const mapTag = mapAge === null
    ? `  (is map pe koi generated_at nahi — ye din-ginti kitni purani hai, pata nahi: \`node scripts/capsule_bridge.mjs\`)`
    : mapAge >= 1
      ? `  (MAP ${Math.floor(mapAge)}d purana — ye din-ginti us din ki hai, aaj ki nahi: \`node scripts/capsule_bridge.mjs\`)`
      : "";
  const gateTag = withheld.length ? `  (GAME ON gate: ${withheld.join(" · ")} roke — proof 30 Aug 2026 se pehle ka, ya capsule hi nahi; map dobara: \`node scripts/capsule_bridge.mjs\`)` : "";
  return {
    line: `RE-JIRAH OVERDUE (${list.length}): ${head}${list.length > 3 ? " …" : ""}`
      + (never ? ` — ${never} ka ek bhi round nahi hua.` : "")
      + `  Overdue = RIPE, late nahi. Queue: \`node scripts/deep.mjs due\` (cold, sirf sawaal).`
      + ownLine
      + mapTag
      + gateTag,
    served: served.map((s) => s.proof),
    withheld,
  };
}
/** rejirahDueLine — the brief's slot, its old signature (string | null), now the GATED line.
 *  @param {string} dir @param {number} [now] */
function rejirahDueLine(dir, now = Date.now()) {
  const r = rejirahDue(dir, now);
  return r ? r.line : null;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE = join(__dirname, "..", "dressing-room", "state");
// The SessionStart brief's byte bound (overhaul §7.4/§13, "SessionStart brief < 6 KB") —
// the DoD organism_test measures on the WHOLE printed brief. Held by the BYTE GUARD in
// the brief's main path (see there), never by a reserve tuned once.
export const BRIEF_BYTES_BOUND = 6000;

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };

// THE OUTWARD LINES (outward loop, 8 Aug 2026 — Ruling 5: benchmark + missions
// reach the kickoff brief; Ruling 2: the ≥2×/week floor is HIS ruled number).
// ≤2 mission lines + floor-when-unmet + season streak — doors, never debts.
// Derivation deliberately inline (house pattern: a reader derives its own
// display from the owner's state; scout.mjs owns missions.json, benchmark.mjs
// owns benchmark.json, postmatch.mjs owns season.json).
function outwardLines(dir, nowMs) {
  const L = [];
  const mj = readJson(join(dir, "missions.json"));
  const bj = readJson(join(dir, "benchmark.json"));
  if (mj && Array.isArray(mj.missions) && mj.missions.length) {
    const audit = mj.missions.filter((r) => r.type === "audit");
    const closed = !!(mj.syllabus_audit && mj.syllabus_audit.closed_at);
    if (audit.length && !closed) {
      const todo = audit.filter((r) => !r.ingested_at);
      L.push(todo.length
        ? `OUTWARD: full-syllabus audit ${audit.length - todo.length}/4 returned — fire ${todo[0].id} on Gemini Deep Research (dressing-room/missions/) · benchmark gated till audit-close`
        : `OUTWARD: all 4 audit returns in — diff review + audit-close (his word) unlocks the benchmark`);
    }
    // W0-A (1 Sep 2026, OL-05): a RETIRED mission is not work. This line shows exactly one
    // generated mission — the oldest open one — so a single piece of junk at the head of the
    // desk owned the only outward slot he ever sees. scout's missionLines() filters the same way.
    const gen = mj.missions.filter((r) => r.type !== "audit" && !r.ingested_at && !r.retired_at);
    if (gen.length) L.push(`OUTWARD: ${gen[0].id} staged — fire when he sits with Gemini (EMPHASIS only, syllabus canon)`);
    // the floor line only when UNMET — a met floor is silence, not applause
    const cutoff = nowMs - 7 * 86400000;
    const inWin = (iso) => { const t = Date.parse(iso || ""); return Number.isFinite(t) && t >= cutoff && t <= nowMs; };
    const returns = (mj.events || []).filter((e) => (e.kind === "ingest" || e.kind === "audit_close") && inWin(e.ts)).length;
    const benchRuns = ((bj && bj.runs) || []).filter(inWin).length;
    // THE FLOOR MAY ONLY PROMISE WHAT THE PRODUCER CAN DELIVER (wiring pass,
    // 11 Aug 2026). The tail read "a mission return or a benchmark run touches
    // it" on every branch — but pre-audit-close a benchmark run CANNOT touch
    // it: computeBenchmark's gated branch passes `runs` through untouched
    // (benchmark.mjs:406 + the early return at :417) and benchmark.mjs's own
    // selftest pins that on purpose at :543. Live proof, not theory —
    // benchmark.json is stamped generated_at 2026-08-10T17:15Z with `runs: []`.
    // So this line named a door that was welded shut and left the open one
    // (fire M02, bring the return back) as an afterthought. bj.status was
    // already in hand two lines below; the fix is to read it here too. Counting
    // is UNCHANGED — the ≥2 and "only RETURNS are outward work" are both his.
    const benchGated = !!(bj && bj.status === "gated_pre_audit");
    if (returns + benchRuns < 2) L.push(`OUTWARD FLOOR: ${returns + benchRuns}/2 this week (his 7 Aug ruling) — ${benchGated ? "benchmark GATED till audit-close (a gated run stamps nothing) — a mission return is what touches it" : "a mission return or a benchmark run touches it"}`);
  }
  if (bj && bj.status === "ok" && Array.isArray(bj.regressions) && bj.regressions.length) {
    L.push(`OUTWARD: benchmark regression — ${bj.regressions[0]}`);
  }
  // THE BENCHMARK'S NEEDS REACH THE KICKOFF (10 Aug 2026 wiring pass). Until
  // today the counts travelled to every surface and the NAMES travelled nowhere
  // — this brief said "B2 1/5" and never "unlock chunking, retrieval", which is
  // the only half that says what to DO. benchmark.mjs owns needs[] and composes
  // it (flattenNeeds); we render, never re-derive. First + a count of the rest,
  // the same brevity the regression line above already uses — a full list here
  // would be a report handed to him, which the ANCHOR LAW forbids; the sheet,
  // the wall and SEASON.md carry the whole list.
  if (bj && bj.status === "ok" && Array.isArray(bj.needs) && bj.needs.length) {
    L.push(`OUTWARD: benchmark need — ${bj.needs[0]}${bj.needs.length > 1 ? ` (+${bj.needs.length - 1} more · node scripts/benchmark.mjs report)` : ""}`);
  }
  return L;
}

// P2 (9 Aug 2026, his unleash word) — the night coach spoke overnight; the
// kickoff says so in ONE line. The producer serves next_morning (the file is
// NAMED for the morning it teaches), so: today's file = fresh, no tag (the
// healthy case stays quiet); yesterday's = tagged with its age; absent = SILENT
// (a brand-new organ that has not run is not a finding every morning).
// LOCAL date, never toISOString — in IST that reads yesterday's file all evening.
const ncLocalDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function nightCoachLine(dir, now) {
  const nowD = new Date(now);
  for (const [d, tag] of [[ncLocalDate(nowD), ""], [ncLocalDate(new Date(nowD.getTime() - 86400000)), " (1d purana — kal raat ka)"]]) {
    const nc = readJson(join(dir, "brain_out/night_coach", d + ".json"));
    if (nc && Array.isArray(nc.misconceptions)) {
      const lesson = nc.lesson && nc.lesson.concept ? ` · lesson tayyar: ${clip(nc.lesson.concept, 40)}` : "";
      return `🌙 NIGHT COACH${tag}: ${nc.misconceptions.length} misconception(s) mapped${lesson} — brain_out/night_coach/${d}.md`;
    }
  }
  return null;
}

// JOB 1d (11 Aug 2026) — THE ROUND READ's kickoff line. Built on his own design:
// the deep grade must not block the live voice, so it lands overnight and reaches
// him the next morning. Same freshness grammar as the night coach above — today
// untagged, yesterday tagged with its age, absent SILENT — because a lane that
// speaks when it has nothing is a lane he learns to skip.
// THE ONE LINE THAT MATTERS is the overconfident cell: axes he called "knew" and
// still cracked. That is the cell his whole calibration book exists to find, so
// it leads, ahead of the pattern count.
function roundReadLine(dir, now) {
  const nowD = new Date(now);
  for (const [d, tag] of [[ncLocalDate(nowD), ""], [ncLocalDate(new Date(nowD.getTime() - 86400000)), " (kal raat ka)"]]) {
    const rr = readJson(join(dir, "brain_out/nightshift", `round_read_${d}.json`));
    if (rr && Array.isArray(rr.patterns)) {
      const over = Array.isArray(rr.overconfident) && rr.overconfident.length
        ? ` · ⚠ "knew" bola aur crack hua: ${rr.overconfident.join(", ")}` : "";
      const first = rr.patterns.length ? ` — ${clip(rr.patterns[0], 90)}` : "";
      return `🧠 ROUND READ${tag}: ${rr.axes} axis ka gehra paath${over}${first} — brain_out/nightshift/round_read_${d}.json`;
    }
  }
  return null;
}

// H6 (10 Aug 2026) — the diary's kickoff one-liner: the brain's own WILL CHANGE
// line from last night's page. The machine sibling (.json, deterministic) is
// the healthy path; the .md's first non-heading line is the degraded fallback.
// Today's serve file first, yesterday's tagged — the nightCoachLine shape.
function diaryLine(dir, now) {
  const nowD = new Date(now);
  for (const [d, tag] of [[ncLocalDate(nowD), ""], [ncLocalDate(new Date(nowD.getTime() - 86400000)), " (1d purana)"]]) {
    const j = readJson(join(dir, "brain_out/diary", d + ".json"));
    if (j && j.will_change) return `📔 BRAIN DIARY${tag}: will change — ${clip(j.will_change, 120)} · brain_out/diary/${d}.md`;
    try {
      const md = readFileSync(join(dir, "brain_out/diary", d + ".md"), "utf8");
      const line = md.split("\n").find((l) => l.trim() && !/^#/.test(l.trim()));
      if (line) return `📔 BRAIN DIARY${tag}: ${clip(line.trim(), 120)} · brain_out/diary/${d}.md`;
    } catch { }
  }
  // #WIRE (11 Aug 2026) — CONSUMER_NO_PRODUCER, the diary end of it.
  // brain_out/diary/ has never existed: 0 `diary` RUNS in 4,693 ledger rows (the
  // engine:"budget" refusal rows that start appearing today are refusals, not runs),
  // so this line has been silent since H6 shipped and nothing said why. Traced at 04:37
  // IST today — `diary` was the ONLY eligible job in its 03:00–07:30 window and
  // headroom returned allowed 0 (used 1,901,322 / cap 1,520,000 in the rolling 5h
  // window, burnt by dmn_* and ns_*, last row 03:48 IST). The brain HAS been writing
  // that refusal down since 10 Aug (recordBudgetBlock → token_vitals.json.starved)
  // and no organ ever connected it to the blank it explains.
  // "Absence is silence, never a nag" still holds and the H6 assertion below still
  // pins it: with no measured cause this returns null exactly as before. It speaks
  // ONLY when the brain itself recorded the refusal — which is evidence, not a nag,
  // and it rides an anchor he already hits instead of a report he has to open.
  try {
    const st = starvedNightFor(readJson(join(dir, "token_vitals.json")), "diary", ncLocalDate(nowD));
    if (st) return `📔 BRAIN DIARY: page nahi likhi — ${st.why} · fuel: token_vitals.json`;
  } catch { }
  return null;
}

function seasonLine(dir) {
  const s = readJson(join(dir, "season.json"));
  if (!s || !s.season_day) return null;
  const rows = Array.isArray(s.rows) ? s.rows : [];
  let run = 0;
  for (let i = rows.length - 1; i >= 0; i--) { if (["HIT", "PARTIAL", "REST"].includes(rows[i].result)) run++; else break; }
  return `SEASON: day ${s.season_day} · matchday ${s.matches_played}${run ? ` · run ${run} won-day(s)` : ""} (logbook: dressing-room/SEASON.md)`;
}
// ---------------------------------------------------------------------------
// #WIRE (11 Aug 2026) — THE SECOND DOOR ON THE SAME CUT (TRUNCATED_AT_DOOR).
// ---------------------------------------------------------------------------
// distiller.mjs was repaired the same hour: its slot caps (open_loop 160,
// where_left_off 200, the LLM's own parseSet 200) were bare .slice()s, so his
// question stopped mid-word with nothing saying more had existed. It now spends
// one char of each cap on a "…" marker so the loss is legible.
// THIS clip is the door immediately after it, and it was a bare slice too — and
// its 180 is BELOW the producer's 200, so a slot the distiller had honestly
// marked would arrive here, get sliced at 180, LOSE THE MARKER, and reach the
// SessionStart brief as a silent mid-word cut again. Marking upstream and slicing
// downstream is not a repair; it is the same defect one hop later.
// Same rule as upstream, no new number: every cap stays the integer it was, the
// marker is spent from INSIDE it. Also used by the night-coach (40), diary (120)
// and every future caller — all of them were cutting his prose silently too.
const CLIP_MARK = "…";   // must match distiller.mjs TRUNC_MARK — one char, deliberately not imported: this file is a SessionStart hook and must not pull the distiller's import chain (presence.mjs, the pool) into the editor's boot path
// FROZEN verbatim (LAYERING law) — the bare cut, kept so the delta stays visible
// and the selftest can show what the brief used to hand him. Reference only.
const clipLegacy = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);
function clip(s, n) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return n <= 1 ? t.slice(0, n) : t.slice(0, n - 1) + CLIP_MARK;   // n<=1 has no room for a marker; a silly cap must never break SessionStart
}

// E2E audit 25 Jul 2026 (freshness): working_set.json carries a `ts` (the distiller
// stamps it every run) but the brief printed its slots verbatim, forever. If the
// distiller task dies, every SessionStart keeps serving "LAST SESSION / OPEN LOOP"
// from days ago as if it were this morning — the session then chases a loop he
// closed a week back. The brief is orientation, so age is part of the fact: past
// WS_STALE_DAYS the slot is archaeology and must be labelled as such, not hidden
// (hiding it would silently blind the kickoff instead of telling the truth).
const WS_STALE_DAYS = 7;
const ageDays = (ts, now) => { const t = Date.parse(String(ts || "")); return Number.isFinite(t) ? (now - t) / 86400000 : null; };

// ---------------------------------------------------------------------------
// DEAD-WIRE SWEEP, 11 Aug 2026 — THE RE-ENTRY CARD SAYS WHAT IT STOOD ON.
// distiller.mjs has written `have_need` (his_words vs sources_scanned) and
// `slot_sources` (llm | floor | empty, per slot) into working_set.json since the
// #106 pass — deliberately counters instead of a status word — and NOTHING in the
// organism read either one. Repo-wide grep: the only other `have_need` is dugout's
// unrelated presence-scan counter. So the collapse those counters exist to expose
// ran invisible: live on 11 Aug 2026 the card read his_words 12 / sources_scanned 25,
// and 13 of the 25 rows behind the LAST SESSION line below were MY OWN teaching
// output (the #108 self-capture class) — the brief printed the resulting slots with
// nothing saying half the evidence was the machine reading itself back.
// This is the brief's FOURTH provenance tag, same law as wsTag / spTag / cTag: a fact
// the reader would otherwise assume. COUNTS AND NAMES ONLY — no threshold, no verdict
// (his standing rule: numbers are ruled on after 30-45-60 days of real data), and it
// stays silent on a working_set that carries no counters at all.
function wsEvidenceLine(ws) {
  const h = ws && ws.have_need;
  if (!h || !Number.isFinite(h.his_words) || !Number.isFinite(h.sources_scanned)) return null;
  const why = [];
  if (Number.isFinite(h.self_rows_excluded)) {
    // the post-11-Aug card, split by cause
    if (h.self_rows_excluded) why.push(`${h.self_rows_excluded} were MY OWN teaching, not his`);
    if (h.captions_rejected) why.push(`${h.captions_rejected} window caption(s)`);
  } else if (h.sources_scanned > h.his_words) {
    // A pre-11-Aug card: its `captions_rejected` is the OLD AGGREGATE (captions + my
    // own rows) under a label that named only one of the two. Report the total it
    // really is rather than repeat the mislabel — the split arrives on the next
    // distiller run (15-min cadence).
    why.push(`${h.sources_scanned - h.his_words} were not his (older card — cause not recorded)`);
  }
  const src = ws.slot_sources && typeof ws.slot_sources === "object"
    ? ["where_left_off", "open_loop"].filter(k => ws[k] && ws.slot_sources[k]).map(k => `${k} ← ${ws.slot_sources[k]}`).join(" · ")
    : "";
  return `  ↳ EVIDENCE BEHIND THOSE LINES: ${h.his_words}/${h.sources_scanned} scanned row(s) were HIS words`
    + (why.length ? ` (${why.join(", ")})` : "")
    + (src ? ` · ${src}` : "")
    + (ws.engine ? ` · engine ${ws.engine}` : "")
    // DEAD-WIRE SWEEP, 11 Aug 2026 — "engine deterministic" READ HEALTHY WHEN IT WASN'T.
    // The line above has printed `engine` since this function was written, but that word
    // had exactly two values and FOUR causes behind them: a quiet stream, a dry free
    // pool, junk text back, and a thrown TypeError from a broken import all wrote
    // "deterministic". distiller.mjs swallowed the error unbound (`catch { /* pool dry →
    // floor stands */ }`), so a dead pool and a normal quiet morning were the same word
    // on this line, forever. The distiller now names which of the five paths ran
    // (`llm_status`, null on the healthy path) and THIS is its reader — the one surface
    // that already prints the slots that failure produces. Names only, no verdict: the
    // floor is legitimate output and this never calls it a fault.
    + (ws.llm_status ? ` (${ws.llm_status})` : "");
}

// ---------------------------------------------------------------------------
// MEMORY SPLICE (research 31 Jul 2026 — defect #4). This brief was the ONLY thing
// a fresh Claude Code session received, and it read exactly three files. The
// hippocampus — 2 identity facts, the consolidated who_he_is, 11 durable episodes
// — never reached the surface the captain actually studies on, so he was forced to
// re-explain himself. He did, in his own words, three separate times ("I have
// ADHD-PI... I don't know what I have created and how to in reality use it" ·
// "I think you forgot it"). The MCP tools existed and worked; nothing invited them,
// so arrival depended on a model volunteering a call. Intent is not a mechanism.
//
// LAWS this obeys:
//  · READ-ONLY. buildRehydrateCartridge (hippocampus.mjs:410) is pure disk reads —
//    no network, no embedding pool. The single-writer law is untouched.
//  · REPAIR TOWARD SILENCE. Lazy dynamic import inside try/catch: if hippocampus is
//    missing, broken, or slow, the brief prints exactly as it did before. A hook
//    must never bite the editor.
//  · SYNC SIGNATURE PRESERVED. brief() stays sync; memory arrives as an optional
//    third argument, so every existing caller and the export are unchanged.
//  · ORGAN-SAFE. Loaded only AFTER the ARSENAL_ORGAN guard in main(), so headless
//    `claude -p` organ prompts never get the captain's personal memory prepended.
const MEMO_MAX = 2200;          // orientation, not an archive — a wall of text read every session is a wall ignored
const MEMO_EPISODES = 6;

// ---------------------------------------------------------------------------
// THE TEACHING CARD (31 Jul 2026). learning-layer/HOW_HE_LEARNS.md is a forensic
// read of the whole Claude Project history — 21 findings, his own verbatim words,
// ending in a seventeen-rule cold-start card. Written to a file, it was read by
// NOBODY: same defect as the hippocampus, one day later. A rule that depends on a
// session choosing to open a file is not a rule, it is a hope.
//
// SINGLE SOURCE: the card is parsed out of the document between two explicit
// markers, so editing the doc updates every future session on its next boot and
// the two can never drift. Missing file, missing marker, empty block → null →
// the brief prints exactly as it did before. It never guesses at the boundaries.
//
// AUDIT 4 Aug 2026 (#14): this loader is now EXPORTED and reused by
// mcp-memory.mjs's get_context. It was reachable only from the SessionStart
// brief, while CLAUDE.md mandates `get_context` as *the* session-start call —
// so the door the captain is told to open was the one door with no teaching
// card behind it. One parser, two doors: forking a second copy into the MCP is
// exactly how the two would drift.
const CARD_FILE  = join(__dirname, "..", "learning-layer", "HOW_HE_LEARNS.md");
const CARD_BEGIN = "<!-- COLD-START-CARD:BEGIN";
const CARD_END   = "<!-- COLD-START-CARD:END";
const CARD_MAX   = 1800;
// THE CAP IS THE CALLER'S TOO (dead-wire sweep, 11 Aug 2026) — the same repair
// loadMemory got on 5 Aug (see the note under it), on the one door it was never applied
// to. context_manifest.mjs is the party that knows the whole budget, and until today it
// could not see this 1800: it called loadTeachingCard() bare, got back the ALREADY-CLIPPED
// string, and recorded THAT length as the card's size — so its footer billed `card 1800`
// as fully delivered and could never print `TRIMMED from N`. Exactly the ledger lie fixed
// for memory on 10 Aug (`TRIMMED from 1523` on a cut from 3,856). Not firing today (the
// live card is 1,431 chars, measured 11 Aug), which is why it survived: it is the
// seventeen-rule card growing past 1800 that would have made it lie, silently.
// THE DEFAULT IS UNCHANGED, so mcp-memory.mjs:273/494, main() below and every assertion in
// the selftest behave byte-for-byte as before. A caller that passes a cap no string can
// exceed now gets the card WHOLE and does its own cut — the only way it can honestly
// report the size it cut FROM.
function loadTeachingCard(path = CARD_FILE, cap = CARD_MAX) {
  try {
    if (!existsSync(path)) return null;
    const raw = readFileSync(path, "utf8");
    const a = raw.indexOf(CARD_BEGIN); if (a < 0) return null;
    const open = raw.indexOf("-->", a); if (open < 0) return null;
    const b = raw.indexOf(CARD_END, open); if (b < 0) return null;
    const body = raw.slice(open + 3, b).replace(/\*\*/g, "").trim();
    if (!body) return null;
    return body.length > cap ? body.slice(0, cap) + "\n… (truncated — full evidence in learning-layer/HOW_HE_LEARNS.md)" : body;
  } catch { return null; }
}
// AUDIT #107 (5 Aug 2026) — THE CAP IS NOW THE CALLER'S, NOT A CONSTANT.
// MEMO_MAX = 2200 was a reasonable guess in July and a measured bug in August: the live
// cartridge is 4,157 characters, so 1,957 of his durable memory were dropped at every
// SessionStart, silently, forever. The fix is not a bigger constant — it is that the
// party which knows the whole budget (context_manifest.mjs) decides the share, and
// says out loud whenever it had to cut. The default is UNCHANGED, so every existing
// caller and the frozen brief() path behave exactly as they did.
async function loadMemory(cap = MEMO_MAX) {
  try {
    const h = await import("./hippocampus.mjs");
    if (typeof h.buildRehydrateCartridge !== "function") return null;
    const raw = h.buildRehydrateCartridge({ n: MEMO_EPISODES });
    if (!raw || typeof raw !== "string") return null;
    const n = Number.isFinite(cap) && cap > 0 ? cap : MEMO_MAX;
    return raw.length > n ? raw.slice(0, n) + "\n… (truncated — full recall via the organism-memory MCP `get_context`)" : raw;
  } catch { return null; }
}

function gather(dir = STATE, now = Date.now()) {
  const sprint = readJson(join(dir, "sprint.json")) || {};
  const ws = readJson(join(dir, "working_set.json")) || {};
  const weak = readJson(join(dir, "weaknesses.json")) || {};
  const cur = (sprint.progress && sprint.progress.current) || null;
  const wsAge = ageDays(ws.ts, now);
  // E2E audit 25 Jul 2026: this read `w.axis` FIRST, but nemesis writes `axis` as a
  // bare axis LETTER ("a"), so the captain's daily brief printed "WATCH-LIST: a" —
  // and the final `|| w` fallback rendered a whole object as "[object Object]".
  // The human-readable name is `topic` (nemesis's real schema: id, topic, axis,
  // recurrence, evidence, score). Axis rides along as a suffix, never alone.
  const label = (w) => {
    if (typeof w === "string") return w;
    if (!w || typeof w !== "object") return null;
    const name = w.topic || w.concept || w.label || w.pattern || w.name || w.id;
    if (!name) return null;
    return w.axis && String(w.axis).length === 1 ? `${name} (${w.axis})` : String(name);
  };
  // E2E audit 25 Jul 2026 (part 2 of the same finding): `weak.patterns` was tested
  // FIRST and short-circuited the real list. nemesis.mjs is the single writer of
  // weaknesses.json and writes `weaknesses:[...]` only — nothing in the repo has
  // ever written `patterns`, so the day anything does (a hand-edit, a future
  // producer) the live watch-list would go dark. The producer's real key now wins;
  // `patterns` is kept as a tolerated legacy shape (layering, not deletion) but is
  // mapped through the SAME label() so it can never regress to a bare key again.
  const watchSrc = Array.isArray(weak.weaknesses) ? weak.weaknesses
    : Array.isArray(weak.patterns) ? weak.patterns
    : [];
  const watch = watchSrc.slice(0, 3).map(label).filter(Boolean);
  // track -> the session ritual (single source of truth, kept in sync with .claude/skills/learn/SKILL.md §1).
  // Was a binary skill/else ternary that mislabeled every non-skill track "FORGE 9-axis" — course/build/
  // domain/career now route explicitly; an unknown track falls to a safe SESSION line (never a stray FORGE).
  const MODE_BY_TRACK = {
    concept: "FORGE — the 9-axis concept capsule (Pehle-Guess, crack-map, gut-word law).",
    skill:   "PYTHON SKILL loop — JS->Python bridge, struggle-first; emit the CLOSE-PACKET (BLOCK-A->Colab, BLOCK-B->Coach Gem).",
    course:  "COURSE — guided active-recall Colab pass (predict -> work the cells -> retrieval quiz). NOT a Forge capsule.",
    build:   "BUILD — struggle-first build session on the artifact; you write it, hint-not-solve, Bolo the interview-defensible parts.",
    domain:  "DOMAIN — teach finance/tax from zero (no assumed recall) + Bolo; concept-style close, not Python.",
    career:  "CAREER — not a study session; orient + assist (draft/review), no reps.",
  };
  const modeLine = cur
    ? (MODE_BY_TRACK[cur.track] || "SESSION — read the task and decide what it needs; force no ritual.")
    : "no current task in sprint.json";
  // L3 · fate 07 — the json door (`learnstate.mjs json`, which the learn skill's orient step reads) serves the honest
  // split beside the sheet's own record: `done` is never rewritten; `learned` is `done` minus the sheet's own label.
  return { sprint, ws, cur, watch, modeLine, wsAge, learned: learnedOf(sprint), pre_restart: preRestartOf(sprint) };
}

// ── L3 (15 Oct 2026) · OPEN, WHERE AM I, RESUME — the first act, from code ──────────────
// EVERY DAY KEY THIS FILE COMPUTES IS IST (Asia/Kolkata), NEVER UTC (fate 18, learning-loop.txt:47): the briefed
// stamp and the FSRS freshness check keyed `toISOString().slice(0, 10)`, so between 00:00 and 05:30 IST "today"
// was yesterday — a lane briefed at 00:10 and again at 06:00 wrote two rows. ONE home for the key: resume_pointer.mjs
// istDay, the rung witness's own K. (`ncLocalDate` below is not a UTC key: it follows its producers' local-date
// file names and is left as it is.)
const dayKeyIST = (/** @type {*} */ t) => istDay(t);
const isDayKey = (/** @type {*} */ s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
// THE POINTER LEDGER, READ-ONLY: `latest`, NEVER `consume`. SessionStart also opens engineering sessions, so a
// kickoff that consumed would spend his question on a session that never asked it; the opens that consume are
// forge_session's (`resume`, `start`). Read through the owner, never a second reader of the file.
const pointerOf = (/** @type {string} */ dir, /** @type {string|null} */ concept) => latestPointer({ path: join(dir, "resume_pointer.jsonl"), concept });
/** whereLine — "you are here, this much is left", from code: STEP n/N and its name, the current axis, axes done / left. PURE.
 *  @param {{concept?: string, step?: number, current_axis?: string|null, axes_done?: string[], axes_deferred?: string[]}} pos */
export function whereLine(pos) {
  const AX = "abcdefghi".split("");
  const st = pos ? pos.step : undefined;
  const step = typeof st === "number" && Number.isInteger(st) && st >= 0 && st < FORGE_STEPS.length ? st : null;
  const ad = pos && Array.isArray(pos.axes_done) ? pos.axes_done : null;
  const known = !!ad;
  const done = ad ? ad.filter((a) => AX.includes(a)) : [];
  const def = pos && Array.isArray(pos.axes_deferred) ? pos.axes_deferred.filter((a) => AX.includes(a)) : [];
  const left = AX.filter((a) => !done.includes(a));
  return `you are here: ${(pos && pos.concept) || "?"} · STEP ${step === null ? "?" : `${step}/${FORGE_STEPS.length - 1} ${FORGE_STEPS[step]}`}`
    + (pos && pos.current_axis ? ` · ON axis ${pos.current_axis}` : "")
    + (known ? ` · this much is left: axes done ${done.length}/${AX.length} (${done.join("") || "—"}) · left ${left.length} (${left.join("") || "—"})${def.length ? ` · deferred ${def.join("")}` : ""}`
      : " · this much is left: UNKNOWN (no axis record)");
}
// fate 07 — THE SHEET'S OWN LABEL IS READ HERE. sprintsync's `done_pre_restart` (W0-B) names the done-claims GAME ON
// withdrew, in the sheet's own words, and until L3 learnstate never read it (outward.txt:11). It is a subset of
// `done`, string for string, so it is read as written: what may be served as LEARNED is `done` minus the label.
const preRestartOf = (/** @type {*} */ sprint) => { const p = sprint && sprint.progress; return Array.isArray(p && p.done_pre_restart) ? /** @type {unknown[]} */ (p.done_pre_restart).map((d) => String(d).trim()).filter(Boolean) : []; };
const learnedOf = (/** @type {*} */ sprint) => { const p = sprint && sprint.progress; const pre = new Set(preRestartOf(sprint)); return /** @type {unknown[]} */ (Array.isArray(p && p.done) ? p.done : []).map((d) => String(d).trim()).filter((d) => d && !pre.has(d)); };
/** briefedOn — PURE: the lanes already stamped `briefed` on IST day `day` (recordBriefed's one-row-per-lane-per-day rule).
 *  @param {any[]} rows @param {string|null} day */
export function briefedOn(rows, day) {
  const s = new Set();
  for (const r of rows || []) { if (!r || r.kind !== "briefed" || dayKeyIST(r.ts) !== day) continue; const k = r.job || r.lane; if (k) s.add(k); }
  return s;
}

// ── L6 (15 Oct 2026) · THE MORNING REFLECTS THE DAY BEFORE ─────────────────────────────────────────────────
// Rung L6 of the sheet of record: "the brief recorded on the latest study day names a first act, carries the previous
// study day, and every Re-Jirah name it served passed the epoch gate". Until L6 no brief was RECORDED (brief_log.jsonl had
// no writer — recordBriefed stamps only consumption.jsonl, through brain) and nothing on this screen named the day before.
//
// THE STUDY DAY IS READ EXACTLY AS THE RUNG WITNESS READS IT — its CLASS D (forks row 551 (2); cloud/ml6/witness/
// rung_L6.mjs:32-41): the stamps (ts || at || updated_at || started_at || created_at) of forge_sessions.jsonl and
// gaffer_grade_queue.jsonl; resume_pointer.jsonl's (that, written_at, consumed_at — through its owner's own reader); and
// the OPEN forge_session.json (no ended_at: its updated_at and every resumes[].at). brief_log.jsonl is NEVER a day key:
// SessionStart prints the brief for engineering sessions too. One reading, so the row and the rung can never disagree
// about which day was "the day before". Every day key is IST (dayKeyIST), never UTC. Every read here is READ-ONLY and
// rides the readStateText door (no new read site on a computed path).
const CARRY_TAG = "CARRIED FROM";
const PK_TAG = "▶ PEHLA KAAM: ";
const BRIEF_LOG = "brief_log.jsonl";
const stampOf = (/** @type {*} */ x) => x && (x.ts || x.at || x.updated_at || x.started_at || x.created_at);
const jsonlOf = (/** @type {string} */ dir, /** @type {string} */ name) => readStateText(dir, name).split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return {}; } });
const pointerRowsOf = (/** @type {string} */ dir) => { try { return pointerRows(join(dir, "resume_pointer.jsonl")); } catch { return []; } };
/** studyStamps — every CLASS D stamp in `dir`, unfiltered (the witness's ledgerStamps + openStamps). @param {string} dir */
export function studyStamps(dir) {
  const ptr = pointerRowsOf(dir);
  /** @type {*} */
  let open = null;
  try { open = JSON.parse(readStateText(dir, "forge_session.json")); } catch { open = null; }
  return [
    ...jsonlOf(dir, "forge_sessions.jsonl").map(stampOf),
    ...jsonlOf(dir, "gaffer_grade_queue.jsonl").map(stampOf),
    ...ptr.flatMap((x) => [stampOf(x), x.written_at, x.consumed_at]),
    ...(open && !open.ended_at ? [open.updated_at, ...(Array.isArray(open.resumes) ? open.resumes.map((/** @type {*} */ r) => r && r.at) : [])] : []),
  ];
}
/** carriedDay — the latest IST study day BEFORE the brief's own IST day, among the CLASS D stamps that stood at or before
 *  the brief (`nowMs`); null when no ledger holds an earlier study day. @param {string} dir @param {number} nowMs */
export function carriedDay(dir, nowMs) {
  const today = dayKeyIST(nowMs);
  const days = studyStamps(dir)
    .filter((t) => { const d = new Date(t); return !Number.isNaN(d.getTime()) && d.getTime() <= nowMs; })
    .map((t) => dayKeyIST(t))
    .filter((d) => isDayKey(d) && String(d) < String(today));
  return /** @type {string|null} */ (days.sort().at(-1) || null);
}
/** carryOf — ONE line of what `day` left open, READ ONLY: the newest pointer the ledger shows WRITTEN that IST day (where he
 *  stopped, named by id and place — its question is never re-printed here: an open one is the first act's already, and a
 *  consumed one is never re-served, L3), else the forge session closed that day (the axes its coverage left).
 *  @param {string} dir @param {string|null} day @returns {{line: string, concept: string|null}|null} */
export function carryOf(dir, day) {
  if (!day) return null;
  const ptr = pointerRowsOf(dir);
  const w = ptr.filter((r) => r && r.kind === "written" && dayKeyIST(r.written_at) === day).at(-1);
  if (w) {
    const c = ptr.find((r) => r && r.kind === "consumed" && r.of === w.id);
    const at = [w.step !== null && w.step !== undefined ? `STEP ${w.step}` : "", w.axis ? `axis ${w.axis}` : ""].filter(Boolean).join(" · ");
    return { concept: String(w.concept || "") || null,
      line: `${w.concept}${at ? ` (${at})` : ""} pe ruka — pointer ${w.id}${c ? `, open ne consume kiya ${dayKeyIST(c.consumed_at)} (wahi sawaal dobara nahi)` : ", abhi khula — agla open isi pe khulega"}` };
  }
  const s = jsonlOf(dir, "forge_sessions.jsonl").filter((r) => r && r.concept && dayKeyIST(stampOf(r)) === day).at(-1);
  if (s) {
    const left = [...(Array.isArray(s.axes_deferred) ? s.axes_deferred : []), ...(Array.isArray(s.axes_untouched) ? s.axes_untouched : [])];
    return { concept: String(s.concept), line: `${s.concept} ka session band hua (${s.ended_by || "close"}) — axes baaki: ${left.join("") || "koi nahi"}` };
  }
  return { concept: null, line: "us din ka koi pointer ya band session ledger pe nahi" };
}

// ── L6 · C22 (forks row 550 (2) F3) · ASKED-FIRST — THE STRIKE, THEN THE NOTE ON FAILURE ─────────────────────
// compiled_notes.jsonl is READ ONLY here: L1's compiler is its SOLE WRITER (row 550 (2) F4), and its two row kinds are the
// ones cloud/ml1/witness/rung_L1.mjs fixes — {kind:"compiled", id, ts, concept, axis, compiler, sources[] (, supersedes)}
// and {kind:"cold_gate", id, of, ts, verdict:"pass"|"fail", traps_named[], reader}. A note serves ONE strike only when its
// LATEST cold gate written at or before the brief PASSED with its traps named — never a failed note, never an ungated one,
// never one a recompile superseded. The strike is built from that gate's first named trap (a field the contract fixes;
// the note's body is never read first) and asked COLD; the note opens only if the strike fails. With no such note the
// brief prints, and the row records, ONE named absence.
/** askedFirst — {note_id, strike} | {absent}. `prefer` (the carried day's concept) wins a tie over the newest pass.
 *  @param {string} dir @param {number} nowMs @param {string|null} [prefer] @returns {{note_id: string, strike: string}|{absent: string}} */
export function askedFirst(dir, nowMs, prefer = null) {
  const text = readStateText(dir, "compiled_notes.jsonl");
  if (!text.trim()) return { absent: "compiled_notes.jsonl absent or empty — L1's compiler (its sole writer) has written no note yet" };
  /** @type {any[]} */
  const rows = text.split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((x) => x && typeof x === "object");
  const compiled = rows.filter((x) => x.kind === "compiled" && typeof x.id === "string" && x.id !== "");
  if (!compiled.length) return { absent: "compiled_notes.jsonl holds no compiled note yet" };
  const superseded = new Set(compiled.map((x) => x.supersedes).filter((s) => typeof s === "string" && s !== ""));
  const t = (/** @type {*} */ x) => Date.parse(x && x.ts);
  const cands = [];
  // unit mtrap (mtrap-9 b): the absence line COUNTS what it saw over every compiled note gated at or before now (superseded
  // ones too — row 1198 (4) names the five); a note under the compiler's bar (gateableOf) reads "not gateable" beside its
  // kept row, never "fail", and never serves a strike. Ungated = a live note with no pass/fail gate yet.
  const seen = { pass: 0, fail: 0, thin: 0, ungated: 0 };
  for (const n of compiled) {
    if (!(t(n) <= nowMs)) continue;
    const verdictRows = rows.filter((g) => g.kind === "cold_gate" && g.of === n.id && t(g) <= nowMs && (g.verdict === "pass" || g.verdict === "fail"));
    const gateable = gateableOf(n.note).gateable;
    if (!verdictRows.length) { if (!superseded.has(n.id)) seen.ungated++; }
    else if (!gateable) seen.thin++;
    else seen[verdictRows.at(-1).verdict === "pass" ? "pass" : "fail"]++;
    if (superseded.has(n.id) || !gateable) continue;
    const last = rows.filter((g) => g.kind === "cold_gate" && g.of === n.id && t(g) <= nowMs).at(-1);
    const traps = last && Array.isArray(last.traps_named) ? last.traps_named.filter((/** @type {*} */ s) => typeof s === "string" && s.trim() !== "") : [];
    if (last && last.verdict === "pass" && traps.length) cands.push({ n, last, traps });
  }
  if (!cands.length) return { absent: `no compiled note's latest cold gate has PASSED with its traps named by ${new Date(nowMs).toISOString()} — nothing is asked from a failed or ungated note — pass ${seen.pass} · fail ${seen.fail} · not gateable ${seen.thin} (fewer than ${TRAP_BAR} traps, kept fail rows beside them) · ungated ${seen.ungated}` };
  cands.sort((a, b) => (Number(!!prefer && b.n.concept === prefer) - Number(!!prefer && a.n.concept === prefer)) || (t(b.last) - t(a.last)));
  const { n, traps } = cands[0];
  return { note_id: n.id, strike: `${n.concept}${n.axis ? ` · axis ${n.axis}` : ""} — "${clip(traps[0], 160)}" — yeh kahan tootta hai, aur kyun? pehle khud jawab` };
}
/** morningOf — the brief's first lines over `dir` at `now`: the carried study day, what it left open, the asked-first line.
 *  @param {string} dir @param {number} [now] */
export function morningOf(dir, now = Date.now()) {
  const carries_from = carriedDay(dir, now);
  const carry = carryOf(dir, carries_from);
  return { carries_from, carry: carry ? carry.line : null, asked_first: askedFirst(dir, now, carry ? carry.concept : null) };
}
/** briefFactsOf — what a brief built at `now` over `dir` carries and serves, from the SAME readers brief() renders with:
 *  morningOf + every Re-Jirah name it serves (the gated overdue line, and the first act when the arbiter's winner is a
 *  rejirah-due round), each with its epoch reading. READ-ONLY. @param {string} dir @param {number} [now] */
export function briefFactsOf(dir, now = Date.now()) {
  const m = morningOf(dir, now);
  /** @type {{concept: string, anchored_at: string|null, epoch_ok: boolean}[]} */
  const served = [];
  const add = (/** @type {*} */ p) => { if (p && p.concept && !served.some((s) => s.concept === p.concept)) served.push(p); };
  try { const rj = rejirahDue(dir, now); for (const p of (rj && rj.served) || []) add(p); } catch { /* the line it feeds is fail-silent too */ }
  try {
    const nu = /** @type {*} */ (nextup(dir, now));
    if (nu && nu.winner && nu.winner.name === "rejirah-due" && nu.winner.concept) {
      const want = String(nu.winner.concept).toLowerCase();
      const c = loadCapsules(join(dir, "capsules")).find((x) => String(x.id).toLowerCase() === want);
      add(c ? proofOf(c) : { concept: String(nu.winner.concept), anchored_at: null, epoch_ok: false });
    }
  } catch { /* the first act is fail-silent in brief() too */ }
  return { ...m, rejirah: served };
}
/** briefRowOf — PURE: the brief_log row for the text a session PRINTED (its state line included), OFF THE FINAL TEXT: the
 *  PEHLA KAAM is cut from the printed line verbatim, and a carried day, a Re-Jirah name or an asked-first strike the
 *  printed text does not carry is never recorded as carried or served. @param {string} printed @param {*} facts
 *  @param {number} nowMs @param {string} id */
export function briefRowOf(printed, facts, nowMs, id) {
  const t = String(printed || "");
  const lines = t.split("\n");
  const pkLine = lines.find((l) => l.includes(PK_TAG)) || "";
  const rest = pkLine ? pkLine.slice(pkLine.indexOf(PK_TAG) + PK_TAG.length) : "";
  const k = rest.lastIndexOf("  (kyun: ");
  const pehla_kaam = (k >= 0 ? rest.slice(0, k) : rest).trim() || null;
  const f = facts || {};
  // a name counts as SERVED only where the brief serves it: the overdue line's head (`<concept> <n>d`, before its gate
  // note) or a rejirah-due first act (`Re-Jirah R<n> '<concept>'`) — never a concept id that happens to be a word elsewhere
  const esc = (/** @type {string} */ s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const overdue = (lines.find((l) => l.startsWith("RE-JIRAH OVERDUE")) || "").split("  (GAME ON gate:")[0];
  const named = (/** @type {string} */ c) => new RegExp(`(^|[^A-Za-z0-9_-])${esc(c)} \\d+d`).test(overdue) || new RegExp(`Re-Jirah R\\d+ '${esc(c)}'`).test(pkLine);
  const carried = typeof f.carries_from === "string" && t.includes(`${CARRY_TAG} ${f.carries_from} `);
  const af = f.asked_first || {};
  const asked_first = typeof af.strike === "string" && af.strike && t.includes(af.strike) ? { note_id: af.note_id, strike: af.strike }
    : typeof af.absent === "string" && af.absent && t.includes(af.absent) ? { absent: af.absent }
    : { absent: "the asked-first line did not reach the printed brief" };
  return {
    v: 1, id, ts: new Date(nowMs).toISOString(), day: dayKeyIST(nowMs),
    pehla_kaam,
    carries_from: carried ? f.carries_from : null,
    carry: carried ? (f.carry || null) : null,
    rejirah: (Array.isArray(f.rejirah) ? f.rejirah : []).filter((/** @type {*} */ r) => r && r.concept && named(r.concept)),
    asked_first,
  };
}
/** recordBrief — THE SOLE WRITER of brief_log.jsonl. Called from main() ONLY, AFTER the print, with the text that printed.
 *  APPEND-ONLY: the row is appended, read back off the disk, and only then ok:true; a row dated before the last recorded
 *  row is a BACK-FILL and is refused (the witness's CLASS A); a failed append is ok:false with its why — never a bare
 *  catch that reports ok. recordBriefed's guard: an organ session records nothing.
 *  @param {string} printed @param {{dir?: string, now?: number}} [opts]
 *  @returns {{ok: true, row: any}|{ok: false, why: string}} */
export function recordBrief(printed, { dir = STATE, now = Date.now() } = {}) {
  if (process.env.ARSENAL_ORGAN === "1") return { ok: false, why: "an organ session (ARSENAL_ORGAN=1) — not his brief; nothing recorded" };
  const msg = (/** @type {*} */ e) => String((e && e.message) || e).slice(0, 160);
  let row;
  try { row = briefRowOf(printed, briefFactsOf(dir, now), now, `b-${now.toString(36)}-${randomBytes(3).toString("hex")}`); }
  catch (e) { return { ok: false, why: `the row could not be built (${msg(e)}) — nothing written` }; }
  const before = readStateText(dir, BRIEF_LOG);
  const last = before.split("\n").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).at(-1);
  if (last && typeof last.ts === "string" && Date.parse(last.ts) > now) {
    return { ok: false, why: `back-fill refused — the last brief row (${last.id}) is dated ${last.ts}, after this brief (${row.ts}); nothing written` };
  }
  const line = JSON.stringify(row);
  try { appendFileSync(join(dir, BRIEF_LOG), (before && !before.endsWith("\n") ? "\n" : "") + line + "\n", "utf8"); }
  catch (e) { return { ok: false, why: `append failed (${msg(e)})` }; }
  const back = readStateText(dir, BRIEF_LOG).split("\n").filter((l) => l.trim());
  if (back[back.length - 1] !== line) return { ok: false, why: "the row is not on disk after the append (read-back mismatch)" };
  return { ok: true, row };
}
/** bornBriefLog — THE BIRTH of brief_log.jsonl at its landing (forks row 787 (1): every state file a landing gives birth to
 *  is BORN by its sole writer, an empty JSONL being lawful, and ADDED by pathspec, so the groundsman's `add -u` carries it).
 *  Exclusive create through the same append door (flag "ax"): EMPTY, never truncates, and a ledger that already exists is
 *  never written — its rows are the record.
 *  @param {{dir?: string}} [opts] @returns {{ok: boolean, op: string, path: string, why?: string}} */
export function bornBriefLog({ dir = STATE } = {}) {
  const p = join(dir, BRIEF_LOG), msg = (/** @type {*} */ e) => String((e && e.message) || e).slice(0, 160);
  if (existsSync(p)) return { ok: false, op: "refused", path: p, why: "brief_log.jsonl already exists — born never truncates and never writes a ledger that exists" };
  try { appendFileSync(p, "", { encoding: "utf8", flag: "ax" }); }
  catch (e) { return { ok: false, op: "refused", path: p, why: `exclusive create failed (${msg(e)})` }; }
  let size = -1;
  try { size = readFileSync(p).length; } catch (e) { return { ok: false, op: "refused", path: p, why: `read-back failed (${msg(e)})` }; }
  return size === 0 ? { ok: true, op: "born", path: p } : { ok: false, op: "refused", path: p, why: `read-back: ${size} byte(s), not an empty ledger` };
}

// ---------------------------------------------------------------------------
// THE ARBITER (P7.B, full-organism audit 7 Aug 2026). Six organs hold opinions
// about what he should do next — the open forge session, Re-Jirah (pending paste
// + overdue rounds), the sprint, the Examiner, Nemesis, the floor. Nobody
// arbitrated, so every kickoff listed them ALL and the choosing tax landed on the
// one brain this system exists to protect. This makes the call IN CODE, with a
// stated precedence, and names what lost and why — auditable, never silent:
//   1. an OPEN forge session — an open loop starves everything else; stale-open
//      means "close it first" (the coverage report is the only record it happened)
//   2. a Re-Jirah round SAT but never pasted — a 2-minute act; until it lands,
//      five organs read the round as never-served
//   3. the most-overdue Re-Jirah round — proof decays; overdue = ripe, not late
//   4. the sprint's current task — the plan of record
//   5. a staged Examiner drill — retrieval practice on the day's concept, and ONLY
//      one the owner's freshness gate passes (11 Aug 2026 sweep — see below)
// The WATCHMAN deliberately never ranks: organ repair is the machine's job (his
// 6 Aug ruling — "keep me out of this picture") and must never become his next
// thing. Nemesis feeds WHICH drill, not WHETHER — it rides inside 4/5, not beside
// them. Every read is fail-silent: this rides the SessionStart hook via brief().
export function nextup(dir = STATE, now = Date.now()) {
  const winnerOf = (name, line, why, rest, extra = {}) => ({ winner: { name, line, why, ...extra }, contenders: rest });   // L6: `extra` — a rejirah-due winner names its concept, so the recorded brief can gate what it served
  const losers = [];
  let forge = null;
  try { forge = readJson(join(dir, "forge_session.json")); } catch {}
  const forgeOpen = !!(forge && forge.concept && !forge.closed_at);
  let pend = [], overdue = [];
  try {
    const caps = loadCapsules(join(dir, "capsules"));
    const rows = readLog(join(dir, "rejirah_log.jsonl"));
    pend = pendingCloses(caps, rows);
    const iv = intervalsOf();
    for (const c of caps) {
      const r = openRound(c, iv);
      if (r && r.ok && r.due) {
        const od = Math.floor((now - Date.parse(r.due)) / 86400000);
        if (od > 0) overdue.push({ concept: c.id, round: r.round, due: r.due, overdue_days: od });
      }
    }
    overdue.sort((a, b) => b.overdue_days - a.overdue_days);
  } catch {}
  const sprint = readJson(join(dir, "sprint.json")) || {};
  const cur = (sprint.progress && sprint.progress.current) || null;
  // DEAD-WIRE SWEEP (11 Aug 2026) — THE EXAMINER'S AGE GATE WAS BYPASSED HERE.
  // This read examiner_drill.json RAW, so a drill staged in JANUARY could win the
  // PEHLA KAAM slot in AUGUST. Measured before the fix: nextup(tmp, 2026-08-10) on a
  // drill dated 2026-01-04 returned winner {name:"examiner", line:"staged drill on
  // tokenization"} — while the owner's loadFreshDrill() on that same object, that same
  // day, returned null. The gate is NOT invented here and no threshold is guessed: it
  // is the owner's own ("fresh = staged today OR yesterday evening", examiner.mjs, so
  // the 21:55 staging still rides tomorrow's session), and dugout.mjs — the scrimmage,
  // the drill's other consumer — has always gone through it (`grep -n "loadFreshDrill"
  // scripts/dugout.mjs`). This screen was the ONE bypass. `read` is pointed at the row
  // already loaded from THIS dir so the tmpdir selftests keep working and the file is
  // read exactly once.
  const examRaw = readJson(join(dir, "examiner_drill.json"));
  const exam = examRaw ? loadFreshDrill(new Date(now), { read: () => examRaw }) : null;
  const examStale = !!(examRaw && examRaw.concept && !exam);

  if (pend.length) losers.push({ name: "rejirah-pending", line: `${pend.length} closed round(s) un-pasted — \`node scripts/rejirah.mjs pending\`` });
  if (overdue.length) losers.push({ name: "rejirah-due", line: `R${overdue[0].round} ${overdue[0].concept} ${overdue[0].overdue_days}d ripe (+${overdue.length - 1} more) — \`node scripts/deep.mjs due\`` });
  if (cur) losers.push({ name: "sprint", line: `${cur.id} ${cur.task} [${cur.track}]` });
  // a gated-out drill stays VISIBLE, tagged, never silently vanished — same rule the
  // working_set's age tag follows two screens up: an old thing you can see beats an old
  // thing that disappeared, because only one of them tells him to re-stage.
  // 11 Aug 2026 dead-wire sweep — THE SERVE RECEIPT REACHES HIS ANCHOR.
  // examiner.mjs now stamps `served:[{by,at}]` when a surface actually embeds the drill
  // (it staged one nightly for weeks with nothing recording whether it was ever opened).
  // The card carries that fact and NOTHING else changes — the ranking is untouched, no
  // threshold is read, no organ acts: "already played today" and "still waiting" simply
  // stop looking identical on the one screen he actually opens.
  const examServed = Array.isArray(examRaw && examRaw.served) ? examRaw.served.filter((r) => r && r.by) : [];
  const examTag = examServed.length ? ` — khela ja chuka (${examServed.map((r) => r.by).join(" · ")})` : "";
  if (examRaw && examRaw.concept) losers.push({ name: "examiner", line: `staged drill on ${examRaw.concept} (${examRaw.date || "?"})${examStale ? " — STALE, gate ne rok diya: \`node scripts/examiner.mjs stage\`" : ""}${examTag}` });

  if (forgeOpen) {
    // W0-D (2 Sep 2026 · SD-04): asked of the pacer, not re-derived. This line was the
    // LAST hand-rolled copy of the predicate and the only one with a bare, unnamed 18 —
    // and it is the one he actually reads, as PEHLA KAAM, at every kickoff.
    const stale = forgeIsStale(forge, new Date(now));
    // AND IT USED TO ORDER THE WRONG THING. Its own words were "close … PHIR wahi
    // concept continue" — close it, then continue the same concept — which is exactly
    // what `resume` does in one move, without ending the session or spending the
    // coverage report on a concept he has not finished. Until 2 Sep that verb did not
    // exist, so the line was the best available advice; now it is simply wrong advice.
    // `close` stays named, because a concept he IS done with still owes its report.
    const line = stale
      ? `PEHLE \`node scripts/forge_session.mjs resume\` — '${forge.concept}' STEP ${forge.step} pe khula pada hai; wahin se aage, kuch dobara nahi. (Us concept se sach mein fursat ho tabhi \`close\` — coverage report wahi bachata hai.)`
      : `resume '${forge.concept}' @ STEP ${forge.step} — usi jagah se, kuch dobara nahi`;
    // row 69 (3) (6 Sep 2026): the `pointer` verb (row 68 (b)) writes the exact unanswered
    // micro-question at every stop; the ONE line he reads at kickoff carries it, so PEHLA KAAM
    // names the question and not just the step (his 11 Aug law: nothing he must remember).
    // Read, never derived; no pointer on disk = nothing invented. Capped like the boot line.
    // L3 (15 Oct 2026) — THE FIRST ACT READS THE POINTER LEDGER FIRST, READ-ONLY. A pointer the ledger holds OPEN
    // is the question; a newest pointer the ledger shows CONSUMED is never re-served (nothing repeated — not even
    // the session file's copy of it); the session file's own pointer answers only for a concept the ledger has
    // never seen (a session older than the ledger). Then "you are here, this much is left", from code.
    const led = pointerOf(dir, forge.concept);
    const legacy = forge.resume_pointer && typeof forge.resume_pointer.text === "string" ? forge.resume_pointer.text.trim() : "";
    const ptr = led.pointer ? led.pointer.question : (led.newest ? "" : legacy);
    const ptrTag = ptr ? ` · agla sawaal: "${ptr.length > 140 ? ptr.slice(0, 137) + "…" : ptr}"` : "";
    const ledTag = led.pointer
      ? ` (ledger pointer ${led.pointer.id} — the open consumes it: ${stale ? "`resume` prints it as its first line" : `\`node scripts/resume_pointer.mjs consume --concept ${forge.concept} --by learn\``})`
      : led.newest && led.consumed ? ` · ledger pointer ${led.newest.id} was consumed ${dayKeyIST(led.consumed.consumed_at)} — never ask it again; open with ONE fresh micro-question where he stopped` : "";
    return winnerOf("forge-open", line + ptrTag + ledTag + ` · ${whereLine(forge)}`, "ek khula loop sab kuch rok deta hai — pehle woh", losers);
  }
  if (pend.length) {
    return winnerOf("rejirah-pending", `gist paste: ${pend.slice(0, 2).map((p) => `${p.concept} R${p.round}`).join(" · ")} — \`node scripts/rejirah.mjs pending\` se patch lo`,
      "2 minute ka kaam; jab tak nahi hota, paanch organ round ko 'hua hi nahi' padhte hain", losers.filter((l) => l.name !== "rejirah-pending"));
  }
  if (overdue.length) {
    const o = overdue[0];
    return winnerOf("rejirah-due", `Re-Jirah R${o.round} '${o.concept}' (${o.overdue_days}d ripe) — shuru: \`node scripts/deep.mjs due\`, grade: \`node scripts/rejirah.mjs grade\``,
      "proof purana ho raha hai — jo June mein seekha uska aakhri saboot lock-day ka hai", losers.filter((l) => l.name !== "rejirah-due"), { concept: o.concept });
  }
  // L3 · fate 07 — A PRE-RESTART TOPIC IS NEVER SERVED AS LEARNED. Until L3 this rung named the sheet's next topic
  // as "plan of record" while the headline (A4) named the FLOOR on the same screen, so the first act stepped past
  // the topics GAME ON re-opened as if they were learned. A4's own law is applied here too: the floor (his override,
  // else the capsules — floorOf) outranks the sheet's row, and the sheet's OWN label (`done_pre_restart`, read since
  // L3) is named as NOT learned. With no floor and no label this rung is silent and the sheet's rung is unchanged.
  const pre = preRestartOf(sprint);
  const preTag = pre.length ? ` · sheet ke DONE mein pre-restart, seekhe hue NAHI (GAME ON 30 Aug): ${pre.join(" · ")}` : "";
  const fl = floorOf(dir, sprint);
  if (fl) {
    const sAfter = syllabusAfter(dir, fl.concept, 1);   // ROW 1400 (4) — the after-this clause is the syllabus's, whenever it exists
    return winnerOf("floor", `FLOOR ${fl.concept} [${fl.why}] — \`node scripts/forge_session.mjs start ${fl.concept}\`${sAfter ? (sAfter.length ? ` · uske baad syllabus ka ${sAfter[0].name}` : "") : cur ? ` · uske baad sheet ka ${cur.id} ${cur.task}` : ""}${preTag}`,
      "jo re-open hua woh seekha hua nahi — pehle floor, phir sheet ka agla", losers);
  }
  if (cur) {
    return winnerOf("sprint", `${cur.id} ${cur.task} [${cur.track}] — plan of record${preTag}`, "koi khula loop nahi, koi overdue proof nahi — ab aage ka kaam", losers.filter((l) => l.name !== "sprint"));
  }
  if (exam && exam.concept) {
    // the date rides ON the card now: this slot dispatches him to work, and the one
    // thing that decides whether the work is today's was the one thing not printed.
    return winnerOf("examiner", `staged drill on ${exam.concept} (${exam.date || "?"})${examTag}`, "sprint khali hai — staged drill hi agla kaam hai", losers.filter((l) => l.name !== "examiner"));
  }
  // last resort. If the ONLY thing on the board is a drill the gate just rejected, say
  // that instead of "kuch nahi mila" — otherwise the screen goes quiet about the very
  // file it just refused, which is how this wire stayed dead for weeks.
  return examStale
    ? winnerOf("none", `sirf PURANA drill pada hai (${examRaw.date || "?"} · '${examRaw.concept}') — usko aaj ka kaam mat samjho; naya: \`node scripts/examiner.mjs stage\``,
        // the drill is NOT filtered out here the way a winner's own row is: it did not
        // win, it LOST to its own age, and the contender row is where that stays legible.
        "har live source khali tha, aur jo mila woh owner ke freshness gate se bahar hai", losers)
    : winnerOf("none", "kuch nahi mila — `node scripts/sprintsync.mjs` chala ke sprint wapas lao", "har source khali/unreadable tha", losers);
}

// ── A4 + A5 + A6 (4 Sep 2026) · THE BRIEF OPENS ON HIS STUDY, NOT ON THE MACHINE
// ----------------------------------------------------------------------------
// MEASURED THE MORNING THIS LANDED, on his own laptop: line 1 of the brief read
// "LEARNING NOW: 1-04 Hallucinations" while the open forge session on disk was
// TOKENIZATION at step 3 — because this line has always rendered `sprint.progress
// .current`, the In-Progress row of a Sheet he last ticked before 30 August. The
// GAME-ON epoch existed in code (registry.mjs gameOnEpoch/preCyborg) and NO ROUTER
// CONSULTED IT. Under it sat 22 watchman findings, three OUTWARD lines and a season
// counter — so the first screen of a study session was a machine-health report with
// his topic in the wrong place.
//
// TWO CHANGES, both layerings:
//   · the FLOOR outranks the sheet's current whenever one exists (his override first,
//     else derived from the capsules the epoch disqualified — never a list of names).
//     The sheet's own current is NOT deleted; it moves to NEXT UP, where it is true.
//   · with a live forge session, the machine's own lines are COUNTED, not printed,
//     and one line says how many are parked and where to read them. Nothing is lost
//     and nothing is deleted — /organism-doctor still prints every one of them. With
//     no session open the brief is byte-for-byte what it was.
/** floorLine — {line, concept} for the syllabus floor, or null when the sheet's own
 *  current is the truth (every capsule re-locked, or an unreadable capsule mirror). */
// ONE DOOR for this rung's new state reads. Every fs call on a computed path is a
// permanent blind spot in this organ's xray budget and the per-organ ratchet charges for
// each SITE, so two readers of two files cost one between them. (The same discipline
// organism_test's `readOrgan` and sprintsync's literal-const SPRINT path already keep.)
const readStateText = (dir, name) => { try { return readFileSync(join(dir, name), "utf8"); } catch { return ""; } };
// ── ROW 1400 (4) · THE TEACHER-FACING NEXT IS THE SYLLABUS'S (his word 346, 26 Nov 2026) ─────────────────────────
// Whenever learning-layer/SYLLABUS.json exists (it sits two levels above the state dir, so a fixture dir without one
// keeps every older line byte-for-byte), the brief's NEXT UP line and the floor's "after this" clause name the
// syllabus's next concepts. The sheet's position stays in its own file and in the next-up verb's LOSING claims —
// kept (L9), never shown as what comes next: a teacher told the sheet's item follows will teach it.
function syllabusFor(dir) {
  try { const t = readStateText(join(dir, "..", "..", "learning-layer"), "SYLLABUS.json"); return t ? JSON.parse(t) : null; } catch { return null; }
}
/** syllabusAfter — the next `n` unclosed concepts after `afterConcept` in the syllabus order (from the start when
 *  `afterConcept` is not in it), or null when there is no syllabus file. */
function syllabusAfter(dir, afterConcept, n = 3) {
  const s = syllabusFor(dir);
  if (!s) return null;
  try {
    const closed = syllabusClosed(s, syllabusLog(dir));
    const all = syllabusOrder(s);
    const at = afterConcept ? all.findIndex((c) => c.id === syllabusIdOf(s, afterConcept)) : -1;
    return all.slice(at + 1).filter((c) => !closed.has(c.id)).slice(0, n);
  } catch { return null; }
}
/** syllabusListLine — the open concept's list (its coverage contract) on one line, or null. */
function syllabusListLine(dir, concept) {
  const s = syllabusFor(dir);
  if (!s || !concept) return null;
  try {
    const id = syllabusIdOf(s, concept);
    const c = id && syllabusOrder(s).find((x) => x.id === id);
    if (!c) return null;
    const cv = syllabusCover(s, syllabusLog(dir), c.id);
    const items = c.list.map((x, i) => `${i + 1}. ${x.length > 48 ? x.slice(0, 47) + "…" : x}${cv.covered.includes(i + 1) ? " ✓" : cv.owed.includes(i + 1) ? " (owed)" : ""}`);
    return `  SYLLABUS · ${c.name} [${c.depth}] · list ${cv.covered.length}/${c.list.length} covered · ${c.questions.length} reported questions — ${items.join(" · ")}  (poora: \`node scripts/syllabus.mjs topic ${c.id}\`)`;
  } catch { return null; }
}
function floorOf(dir, sprint) {
  try {
    const over = sprint && sprint.progress && sprint.progress.current_floor;
    // ROW 1400 (2): the floor's own by-label — a floor moved by code is never printed as his word.
    if (over && over.concept) return { concept: String(over.concept), why: String(over.by || "his word (sprintsync floor)") };
    const d = derivedFloor(loadCapsules(join(dir, "capsules")));
    return d ? { concept: d.id, why: "GAME ON — first topic not proven post-epoch" } : null;
  } catch { return null; }
}
/** fsrsDueLine — the scheduler of record's own count, read from ITS file, never
 *  re-derived here. Silent when the file is absent or was written for another day:
 *  a stale due-count presented as today's is worse than no count at all. */
function fsrsDue(dir, now = Date.now()) {
  try {
    const c = JSON.parse(readStateText(dir, "cards.json"));
    if (!c || typeof c.due_today !== "number") return null;
    const day = dayKeyIST(now);   // L3 — IST, never the UTC slice (between 00:00 and 05:30 IST that called today's count stale)
    const cday = isDayKey(c.date) ? String(c.date) : dayKeyIST(c.date);   // a bare day key is taken as written; an instant is keyed to IST
    return { due: c.due_today, overdue: typeof c.overdue === "number" ? c.overdue : null, stale: cday !== day, date: c.date || null };
  } catch { return null; }
}
/** studyBlock — the lines a session that is MID-CONCEPT needs, in the order it needs
 *  them. Pure: the session and the counts are handed in. */
function studyBlock(f, fs) {
  const AX = "abcdefghi".split("");
  const done = Array.isArray(f.axes_done) ? f.axes_done : [];
  const deferred = Array.isArray(f.axes_deferred) ? f.axes_deferred : [];
  const untouched = AX.filter((a) => !done.includes(a) && !deferred.includes(a));
  const L = [];
  // DEFERRED FIRST, then untouched — an axis he consciously put off is work he has
  // already decided to do; an axis nobody has opened is work nobody has decided about.
  const next = [...deferred, ...untouched];
  L.push(`  NEXT: STEP ${f.step}${f.current_axis ? ` · ON axis ${f.current_axis}` : ""} · pehle ${next.length ? next.slice(0, 4).join("") : "—"}`
    + `${deferred.length ? ` (deferred ${deferred.join("")} pehle — woh tay ho chuka kaam hai)` : ""}`
    + ` · done ${done.join("") || "—"}`);
  if (fs) L.push(`  FSRS: ${fs.due} card due${fs.overdue ? ` · ${fs.overdue} overdue` : ""}${fs.stale ? ` (⚠ ${fs.date || "undated"} ka count — aaj ka nahi; \`node scripts/fsrs.mjs recompute\`)` : ""}`);
  L.push(`  ▶ OPEN WITH ONE FRESH MICRO-QUESTION on where he stopped — never a recap, never "you already know this".`);
  return L;
}

function brief(dir = STATE, now = Date.now(), memory = null, card = null) {
  const { sprint, ws, cur, watch, modeLine, wsAge } = gather(dir, now);
  // age tag for the working-set slots (see WS_STALE_DAYS above). Same-day = no tag
  // (the common, healthy case stays quiet); a missing `ts` is called out rather
  // than assumed fresh — an untimestamped slot is exactly the one you can't trust.
  const wsTag = wsAge === null ? " (age unknown)"
    : wsAge >= WS_STALE_DAYS ? ` (STALE · ${Math.floor(wsAge)}d old — treat as history, confirm before acting on it)`
    : wsAge >= 1 ? ` (${Math.floor(wsAge)}d ago)`
    : "";
  // AUDIT #107 — THE SPINE GETS AN AGE TOO. sprint.json feeds this brief, the forge
  // nudge, the teaching contract's link-back and the drills; until 5 Aug it carried no
  // timestamp at all, so a Sheet that stopped syncing looked exactly like one that
  // just synced. Same rule as the working_set tag above: absent age is CALLED OUT, not
  // assumed fresh, because an untimestamped spine is the one you can least afford to
  // trust silently.
  const spAge = ageDays(sprint.progress && sprint.progress.synced_at, now);
  const spTag = spAge === null ? " (no sync stamp — run `node scripts/sprintsync.mjs`)"
    : spAge >= WS_STALE_DAYS ? ` (SPRINT STALE · ${Math.floor(spAge)}d since sync)`
    : "";
  const L = [];
  // ── A4 + A5 · DECIDED HERE, ABOVE EVERYTHING (4 Sep 2026; both halves are verifier
  // findings, both reproduced). Two mistakes lived in the first draft and both of them
  // turned this whole rung OFF in exactly the conditions it was built for:
  //   · STUDYING and the FLOOR were computed INSIDE `if (cur)` — i.e. gated on the SHEET
  //     having an In-Progress row. A failed sprintsync, a cleared row or an unreadable
  //     sprint.json produced no floor line, no study block and no collapse, with no error.
  //     The trigger for "is he mid-concept" is forge_session.json and nothing else.
  //   · STUDYING required the session to be FRESH (<18 h). His program is one topic per
  //     day, so on the morning of day 2 the session is ~20 h old, STUDYING went null, and
  //     the study block vanished on the exact session the rung exists for. The pacer's own
  //     law already says it: staleness silences the PACER, never the MEMORY (see
  //     forge_session's bootLines, which deliberately speaks on a stale session). An OPEN,
  //     unclosed session is a session he is in the middle of; `resume` is what wakes the
  //     pacer, and PEHLA KAAM already tells him to run it.
  const STUDYING = (() => {
    try {
      const f = JSON.parse(readStateText(dir, "forge_session.json"));
      return (f && f.concept && !f.closed_at) ? f : null;
    } catch { return null; }
  })();
  const FLOOR = floorOf(dir, sprint);
  // …and when he is MID-CONCEPT, the open concept is the answer to "where am I" — the floor
  // is the next thing, not this thing. Without this the first screen could say
  // "FLOOR tokenization" on line 1 and "ON axis a of embeddings" three lines later.
  const HEADLINE = STUDYING ? { concept: STUDYING.concept, why: "khuli hui session — wahin se aage" } : FLOOR;
  L.push("=== ARSENAL — SESSION KICKOFF (auto · session-agnostic · read from state, not chat) ===");
  // L6 (15 Oct 2026) — THE MORNING REFLECTS THE DAY BEFORE, in the brief's FIRST lines: the carried study day and what it
  // left open, then the asked-first line (C22: one cold strike from a gate-passed note, or its named absence). READ-ONLY
  // like every splice here, and fail-silent: a brief must never be the thing that breaks SessionStart. The recorded row
  // (main → recordBrief) is built from these same readers and checked against the text that printed.
  try {
    const mo = morningOf(dir, now);
    L.push(mo.carries_from ? `${CARRY_TAG} ${mo.carries_from} (pichhla study din, IST): ${mo.carry}` : `${CARRY_TAG}: koi pichhla study din ledger pe nahi — aaj se shuru`);
    const af = /** @type {*} */ (mo.asked_first);
    L.push(af.strike ? `  ASKED-FIRST (C22) — cold, note ${af.note_id} band: ${af.strike} (galat ho tabhi note khulega)` : `  ASKED-FIRST (C22) — koi strike nahi: ${af.absent}`);
  } catch { /* a brief must never be the thing that breaks SessionStart */ }
  // L3 (15 Oct 2026) — THE ARBITER NO LONGER RUNS ONLY INSIDE `if (cur)` (learning-loop.txt:47: "THE ARBITER IS
  // UNREACHABLE WITHOUT A SPRINT"). Its own rung 1 is the open forge session, so a morning with no sheet row was
  // exactly the morning the first act went silent. Decided ONCE here, placed by the branches below: one PEHLA KAAM
  // line whatever the sheet says, and it is the pointer's question when one is open (nextup reads the ledger).
  const FIRST_ACT = (() => {
    try {
      const nu = nextup(dir, now);
      return nu && nu.winner && nu.winner.name !== "none"
        ? `  ▶ PEHLA KAAM: ${nu.winner.line}  (kyun: ${nu.winner.why}${nu.contenders.length ? ` · haara: ${nu.contenders.map((c) => c.name).join(", ")} — poora: \`node scripts/learnstate.mjs nextup\`` : ""})`
        : null;
    } catch { return null; }   // a brief must never be the thing that breaks SessionStart
  })();
  if (!cur && HEADLINE) {
    // The sheet has no current task, but HE does. Before today this branch printed
    // "sprint.json has no current task — run the sprint sync" and nothing else.
    L.push(`LEARNING NOW: ${STUDYING ? "" : "FLOOR "}${HEADLINE.concept} [${HEADLINE.why}] — sheet pe koi current task nahi hai (\`node scripts/sprintsync.mjs\`), par yeh khula hai`);
    { const sl = syllabusListLine(dir, HEADLINE.concept); if (sl) L.push(sl); }   // ROW 1400 (4) — the topic's list reaches the teacher
    if (FIRST_ACT) L.push(FIRST_ACT);   // L3 — the first act speaks with no sheet row
    try { for (const l of studyBlock(STUDYING || { step: 0, axes_done: [], axes_deferred: [] }, fsrsDue(dir, now))) L.push(l); } catch { /* orientation, never a crash */ }
  }
  if (cur) {
    // E2E audit 25 Jul 2026: matched the sprint number as a bare string prefix, so
    // the first double-digit sprint mislabels — find() hits n=1 before n=10 because
    // "10-01".startsWith("1") is true. Task ids are always "<sprint>-<nn>", so the
    // separator is part of the match, not decoration.
    const sp = (sprint.sprints || []).find(s => String(cur.id).startsWith(String(s.n) + "-"));
    // A4 — THE FLOOR OUTRANKS THE SHEET, and an OPEN SESSION outranks the floor. His live
    // Sheet is untouched and still says what it says; it simply stops being the thing that
    // decides what he opens today.
    L.push(HEADLINE
      ? `LEARNING NOW: ${STUDYING ? "" : "FLOOR "}${HEADLINE.concept} [${HEADLINE.why}] — pehle yeh, phir sheet ka apna agla`
      : `LEARNING NOW: ${cur.id} ${cur.task} [${cur.track}${sp ? ` · S${sp.n} ${sp.theme}` : ""}] — ${cur.subtopics || ""}${spTag}`);
    // ROW 1400 (4): with a syllabus file the after-this clause is the syllabus's and the sheet is NOT named as next.
    const SA = HEADLINE ? syllabusAfter(dir, HEADLINE.concept, 1) : null;
    if (HEADLINE && SA) L.push(`  (iske baad syllabus ka: ${SA.length ? SA[0].name : "kuch nahi — har topic band"}. Sheet ki apni position sheet mein aur \`node scripts/learnstate.mjs nextup\` ke haare hue claims mein hai, mita nahi.)`);
    else if (HEADLINE) L.push(`  (sheet abhi bhi "${cur.id} ${cur.task}" par hai — woh NEXT UP mein hai, mita nahi.${STUDYING && FLOOR && FLOOR.concept !== STUDYING.concept ? ` Iske baad ka floor: ${FLOOR.concept}.` : ""} Floor hatana ho: \`node scripts/sprintsync.mjs floor <concept>\`)`);
    if (HEADLINE) { const sl = syllabusListLine(dir, HEADLINE.concept); if (sl) L.push(sl); }
    L.push(`  MODE: ${modeLine}`);
    // P7.B (7 Aug 2026) — ONE decision, made in code, so the kickoff never again
    // hands him a menu of six competing opinions. Fail-silent like every splice here.
    // L3: decided once above the branches (FIRST_ACT); its place in this branch is unchanged.
    if (FIRST_ACT) L.push(FIRST_ACT);
    // A5 — THE STUDY BLOCK SITS HERE, directly under "where he is" and above every
    // sheet/course/python line, because a session that is MID-CONCEPT needs step, axis
    // and what is left before it needs anything else on this screen.
    if (STUDYING) { try { for (const l of studyBlock(STUDYING, fsrsDue(dir, now))) L.push(l); } catch { /* orientation, never a crash */ } }
    // audit #35 — THE COURSE TRACKER GETS ITS ADDRESS.
    // course.mjs was 670 lines with zero callers and course.json had never existed, while
    // sprint.json's next_up is 1-05 and 1-06 — BOTH course-track, 9 chapters. So on 1-05 he
    // would have been ASKED where he is instead of being TOLD. courseBrief() takes no args,
    // never throws, and reports `present:false` honestly when nothing has been ingested yet.
    // NOTE: the reader is HERE, never sprintsync — sprint.json is Sheet-driven, single-writer.
    if (cur.track === "course") {
      try {
        // DEAD-WIRE SWEEP, 11 Aug 2026 — THE COURSE LINE GETS AN AGE, like the two
        // tags above it. course.mjs has stamped `current_at` on every `at <n>` since
        // 1 Aug and NOTHING in the organism read it, so a chapter he opened this
        // morning and one he stalled on for three weeks printed the identical line.
        // Same law as wsTag/spTag: a missing stamp is CALLED OUT rather than assumed
        // fresh, and the healthy same-day case stays quiet.
        // THE THRESHOLD IS NOT A NEW NUMBER — it is WS_STALE_DAYS, already in this
        // file (see its definition above), so the working_set, the sprint spine and
        // the course position all go stale on ONE clock instead of three.
        // The PATH is passed on purpose: courseBrief() defaults to the live
        // course.json, which would read the real file from a fixture dir and leave
        // this branch untestable. `dir` is the same state dir in production.
        const cb = courseBrief(join(dir, "course.json"));
        if (cb && cb.line) {
          const cAge = cb.current === null ? null : ageDays(cb.current_at, now);
          // DEAD-WIRE SWEEP, 11 Aug 2026 (pass 3) — THE UNSTAMPED POSITION SPEAKS.
          // The `cb.current === null` arm used to be "" with the comment "not started:
          // there is no position to age", and that was true of the AGE and false of
          // everything else. `at <n>` is the ONLY producer of `current`, and on 11 Aug
          // a trace found it had ZERO callers anywhere — no skill, no hook, no task
          // (`grep -rn "course.mjs at" --exclude-dir=.git` hit only course.mjs's usage
          // banner, the hint string on the line below, and doc prose). So `current`
          // has been null since the 7 Aug ingest, and this arm printed NOTHING about
          // it — while the hint that names the fix sat one line down, inside a branch
          // `current === null` gates off. SELF-SEALING: the one line that could have
          // reported the dead wire was unreachable BECAUSE of the dead wire.
          // Two shapes on purpose. With `done > 0` the sentence course.mjs prints is
          // self-contradictory — measured on the live state through the pure core,
          // markDone 1..5 still yields "…: not started — 6 chapters (5 done)" — so the
          // contradiction is named out loud rather than left for the reader to spot.
          // No new number, no write, no inference: only this session knows which
          // chapter he opened, so the brief ASKS for the stamp and never invents one.
          // Gated on `present`: an absent or UNREADABLE course already says what is
          // wrong in `cb.line` (course.mjs unreadableBrief), and a second complaint
          // there would point him at the wrong repair.
          const cTag = cb.present !== true ? ""
            : cb.current === null
              ? (cb.done > 0
                ? ` (POSITION UNSTAMPED · ${cb.done} chapter(s) closed, yet the line above still reads "not started" — \`node scripts/course.mjs at <n>\` when he opens one)`
                : " (position unstamped — `node scripts/course.mjs at <n>` the moment he opens one)")
            : cAge === null ? " (no position stamp — `node scripts/course.mjs at <n>` stamps it)"
            : cAge >= WS_STALE_DAYS ? ` (PARKED · ${Math.floor(cAge)}d on this chapter)`
            : cAge >= 1 ? ` (${Math.floor(cAge)}d ago)`
            : "";
          // DEAD-WIRE SWEEP, 11 Aug 2026 (pass 2) — THE NEXT CHAPTER GETS SPOKEN.
          // `cb.line` is course.mjs's statusLine(), and statusLine only ever describes
          // WHERE HE IS. On day one — the exact state on disk right now, current:null —
          // it reads "Anthropic API Fundamentals: not started — 6 chapters (0 done)" and
          // names no chapter, while the SAME object already carries
          // next={"n":1,"title":"Getting started"}. The organ computed the answer; this
          // door threw it away. Of the fields statusLine leaves out, `current_title`,
          // `total` and `done` are already inside its text (course.mjs:374-377) — the two
          // genuinely lost are the two he needs to press play: `next` (which chapter) and
          // `start_seconds` (where inside the video to resume).
          // NO FABRICATION: a chapter list pasted without timestamps stores
          // start_seconds:null on purpose (course.mjs "no timestamp anywhere ⇒ null,
          // never a fabricated 0"), so the stamp prints only when it is a real integer —
          // fmtStamp's own "--:--" placeholder is deliberately not shown here, because a
          // kickoff line must not imply a resume point that was never recorded.
          const at = (s) => (Number.isInteger(s) && s >= 0 ? ` @ ${fmtStamp(s)}` : "");
          // his position's own stamp — only meaningful once he is ON a chapter
          const resume = cb.current !== null ? at(cb.start_seconds) : "";
          const nextTag = cb.next && Number.isInteger(cb.next.n)
            ? ` → agla: ch${cb.next.n} ${cb.next.title || ""}${at(cb.next.start_seconds)}`
            : "";   // no `next` = every chapter covered; naming nothing is the honest answer
          // DEAD-WIRE SWEEP, 11 Aug 2026 (pass 3) — THE COURSE GETS ITS ADDRESS.
          // Same shape as the two fixes above, one field further along: course.mjs has
          // read `source_url` out of his paste, refused anything that is not http(s),
          // and preserved it across every re-ingest since 1 Aug — and nothing printed
          // it. So this line, which exists precisely so he is never asked where he is,
          // told him the chapter and left him to go find the course himself. The live
          // value is the anthropics/courses fundamentals folder.
          // Printed in FULL, never clipped: a truncated URL is not an address, it is a
          // riddle — unlike the prose slots above it, where clip() loses only detail.
          const where = cb.source_url ? ` · ${cb.source_url}` : "";   // null = he pasted no URL; inventing one is the one law of that organ
          L.push(`  📼 ${cb.line}${resume}${cTag}${nextTag}${where}`);
        }
      } catch { /* a brief must never be the thing that breaks SessionStart */ }
    }
    // audit #107 item #26 — THE PYTHON TRACK GETS ITS ADDRESS. Same defect as #35 above,
    // on the bigger rock: 1-07 is 16h and sprint.json calls it "Biggest rock", yet the
    // track had no state file at all, so a fresh thread inherited nothing and would have
    // ASKED him where he is. GEMINI_LOOP §13.4 makes the watch-list Claude's standing job
    // and §11.4 says it must travel thread-to-thread — that is why the hangovers ride the
    // brief and not just the packet: they are what the very next reply has to catch.
    if (cur.track === "skill") {
      try {
        const pb = pythonBrief();
        if (pb && pb.line) L.push(`  🐍 ${pb.line}`);
        if (pb && pb.watch_list && pb.watch_list.length) {
          L.push(`  ⚠️ JS-HANGOVERS (his repeats — inject these in every CLOSE-PACKET): ${pb.watch_list.join(" · ")}`);
        }
      } catch { /* a brief must never be the thing that breaks SessionStart */ }
    }
  } else {
    L.push("LEARNING NOW: (sprint.json has no current task — run the sprint sync)");
    if (FIRST_ACT && !HEADLINE) L.push(FIRST_ACT);   // L3 — no sheet row and no headline: the arbiter still speaks, once
  }
  if (ws.where_left_off) L.push(`LAST SESSION${wsTag}: ${clip(ws.where_left_off, 180)}`);
  if (ws.open_loop) L.push(`OPEN LOOP (still hanging)${wsTag}: ${clip(ws.open_loop, 180)}`);
  // the distiller's counters get their consumer (see wsEvidenceLine above). Only ever
  // printed under the slots it describes — an evidence line with nothing above it would
  // be a report, and this brief is orientation.
  if (ws.where_left_off || ws.open_loop) {
    try {
      const ev = wsEvidenceLine(ws);
      if (ev) L.push(ev);
    } catch { /* a brief must never be the thing that breaks SessionStart */ }
  }
  if (watch.length) L.push(`WATCH-LIST (his repeat JS-hangovers — catch these): ${watch.join(" · ")}`);
  // ROW 1400 (4): whenever the syllabus file exists, NEXT UP is the syllabus's next concepts after the headline one;
  // the sheet's next_up stays in sprint.json (L9) and prints only when there is no syllabus file.
  const SN = (() => { try { return syllabusAfter(dir, HEADLINE ? HEADLINE.concept : null, 3); } catch { return null; } })();
  const nx = (sprint.progress && sprint.progress.next_up) || [];
  if (SN) { if (SN.length) L.push(`NEXT UP (syllabus): ${SN.map((c) => c.name).join(" · ")}`); }
  else if (nx.length) L.push(`NEXT UP: ${nx.slice(0, 3).join(" · ")}`);
  // A4 — the evening test follows the FLOOR too. It named the sheet's task, so on a
  // floor day it would have tested him on the one topic he did not study.
  if (sprint.progress && sprint.progress.examiner_daily) L.push(`DAILY EXAMINER: at day's end, test today's concept (${(STUDYING && STUDYING.concept) || (cur ? cur.task : "current")}) — retrieval practice, not a full mock.`);
  // audit #11 — RE-JIRAH WAS INVISIBLE AT SESSION START.
  // Measured 4 Aug 2026: embeddings 41d, inference 38d, context 34d overdue, and
  // THREE of the four capsules had `rounds_done: 0` — never re-tempered once —
  // while 36 ready-written strike questions sat unused. Nothing surfaced that at
  // kickoff, so every session opened on "what's next" and never on "what's rotting".
  // Overdue is RIPE, not late: this line names it without scolding.
  try {
    const pendLine = rejirahPendingLine(dir);
    if (pendLine) L.push(pendLine);
  } catch { /* a brief must never be the thing that breaks SessionStart */ }
  try {
    const dueLine = rejirahDueLine(dir, now);   // #108 — the brief's clock, so the age tag is deterministic in test
    if (dueLine) L.push(dueLine);
  } catch { /* a brief must never be the thing that breaks SessionStart */ }
  // ---- D + B5-REVERSE (12 Aug 2026) — WHAT THE GAFFER DID REACHES THIS MOUTH.
  // B5 made Claude Code visible to the live Gaffer within seconds. The reverse was
  // left as "a harness limit" because nothing can inject into a running Claude Code
  // session — TRUE, and it quietly skipped the half that IS possible: this brief,
  // at SessionStart. So a spoken sitting was invisible here until someone asked.
  // ALSO closes a D violation of my own making: gaffer_state.mjs's header declares
  // learnstate as a consumer, and declaring a consumer without wiring it is exactly
  // the "built, declared, not wired" defect this repo keeps finding in other files.
  // ── A5 + A6 — THE MACHINE'S OWN LINES, COLLECTED RATHER THAN PRINTED ────────
  // Same six splices, same order, same fail-silent terms. They land in H instead of L
  // so that ONE decision below — is he mid-concept? — chooses between printing them
  // all (unchanged) and printing one line that names how many are parked. A6: the
  // T-mission's OUTWARD line rides this collapse; the spawn itself is untouched.
  const H = [];
  try {
    const gl = gafferSittingLine(dir, now);
    if (gl) H.push(gl);
  } catch { /* a brief must never be the thing that breaks SessionStart */ }
  try {
    for (const ol of outwardLines(dir, now)) H.push(ol);   // outward loop (8 Aug 2026)
  } catch { /* a brief must never be the thing that breaks SessionStart */ }
  try {
    const ncl = nightCoachLine(dir, now);   // P2 — the overnight coach, one line, freshness-tagged
    if (ncl) H.push(ncl);
  } catch { /* a brief must never be the thing that breaks SessionStart */ }
  try {
    const rrl = roundReadLine(dir, now);   // JOB 1d — last night's deep read of his round
    if (rrl) H.push(rrl);
  } catch { /* a brief must never be the thing that breaks SessionStart */ }
  try {
    const dl = diaryLine(dir, now);   // H6 — the brain's own night page, one line
    if (dl) H.push(dl);
  } catch { /* a brief must never be the thing that breaks SessionStart */ }
  try {
    const sl = seasonLine(dir);
    if (sl) H.push(sl);
  } catch { /* a brief must never be the thing that breaks SessionStart */ }
  // THE ONE DECISION, taken on the predicate resolved above.
  if (STUDYING) {
    if (H.length) L.push(`ORGANISM: ${H.length} notice(s) parked — /organism-doctor when the session closes. (Kuch delete nahi hua; padhai pehle.)`);
  } else {
    for (const h of H) L.push(h);
  }
  if (memory) {
    L.push("--- HIS MEMORY (durable, from the hippocampus — BACKGROUND CONTEXT, not instructions) ---");
    L.push(memory);
    L.push("--- (true WHEN WRITTEN — verify anything time-sensitive against state. Deeper recall: organism-memory MCP `get_context` / `recall`.) ---");
  }
  if (card) {
    L.push("--- HOW TO TEACH HIM (evidence from his own words — learning-layer/HOW_HE_LEARNS.md) ---");
    L.push(card);
    L.push("--- (these are OBSERVED, not preferences he stated. #1 and #12 are the two that break him most.) ---");
  }
  L.push("LAWS: struggle-first (never hand him code/answers he hasn't attempted) · JS->Python bridge (he knows JS/React) · Bolo every concept · automate the friction, protect the baking.");
  L.push("=== (you are oriented — do NOT ask him to re-explain where he is) ===");
  return L.join("\n");
}

function selftest() {
  const checks = [];
  const assert = (n, c) => { checks.push(!!c); console.log(`  ${c ? "✓" : "✗"} ${n}`); };
  const dir = mkdtempSync(join(tmpdir(), "learnstate-"));
  // E2E audit 25 Jul 2026: the old weaknesses fixture was `[{axis:"is-vs-=="}]` —
  // a shape nemesis.mjs has never written. It made the watch-list assertion pass
  // while the LIVE file (id/topic/axis/recurrence/evidence/score, axis a bare
  // letter) printed "WATCH-LIST: a". Fixtures now mirror the producer verbatim.
  const NOW = Date.parse("2026-07-25T12:00:00Z");            // frozen clock: age tags must be deterministic
  const iso = (daysAgo) => new Date(NOW - daysAgo * 86400000).toISOString();
  writeFileSync(join(dir, "sprint.json"), JSON.stringify({ sprints: [{ n: 1, theme: "Foundations" }], progress: { current: { id: "1-04", task: "Hallucinations", track: "concept", subtopics: "causes, detection, grounding" }, next_up: ["1-05 X", "1-07 Python"], examiner_daily: "test today's concept" } }));
  writeFileSync(join(dir, "working_set.json"), JSON.stringify({ ts: iso(0.1), where_left_off: "was on cosine similarity", open_loop: "why cosine not euclidean" }));
  writeFileSync(join(dir, "weaknesses.json"), JSON.stringify({ weaknesses: [
    { id: "embeddings", topic: "embeddings", recurrence: 1, last_seen: "2026-07-17", status: "open", evidence: ["07-17 shaky-wrong"], axis: "a", score: 0.5898 },
    { id: "is-vs-==", topic: "is vs ==", recurrence: 2, status: "open", axis: "c", score: 0.42 },
  ] }));
  const b = brief(dir, NOW);
  const watchLine = b.split("\n").find(l => l.startsWith("WATCH-LIST")) || "";
  assert("brief names the CURRENT concept from sprint.json", b.includes("1-04 Hallucinations"));
  assert("concept task routes to FORGE mode", b.includes("FORGE"));
  assert("brief carries where-left-off from the working_set", b.includes("cosine similarity"));
  assert("brief carries the open loop", b.includes("why cosine"));
  assert("brief carries the JS-hangover watch-list", watchLine.includes("is vs ==") || watchLine.includes("embeddings"));
  // REGRESSION (E2E audit): the watch-list must print nemesis's human-readable
  // `topic`, with the bare axis letter only ever riding as a suffix — never the
  // whole entry, never a stringified object.
  assert("watch-list prints the TOPIC (axis only as suffix), not a bare axis letter", watchLine.includes("embeddings (a)") && !/:\s*a(\s|·|$)/.test(watchLine));
  assert("watch-list never renders a raw object", !watchLine.includes("[object Object]"));
  // REGRESSION (E2E audit): nemesis's real `weaknesses` key must win over the
  // legacy `patterns` key, which used to short-circuit it and blank the list.
  const dirP = mkdtempSync(join(tmpdir(), "learnstate-patterns-"));
  writeFileSync(join(dirP, "weaknesses.json"), JSON.stringify({ patterns: [{ note: "legacy junk with no name key" }], weaknesses: [{ id: "chunking", topic: "chunking", axis: "b" }] }));
  const pb = brief(dirP, NOW);
  assert("legacy `patterns` never short-circuits nemesis's real `weaknesses` list", pb.includes("chunking (b)"));
  // REGRESSION (E2E audit): a working_set the distiller stopped refreshing must be
  // age-tagged, not served as this morning's orientation.
  const dirS = mkdtempSync(join(tmpdir(), "learnstate-stale-"));
  writeFileSync(join(dirS, "working_set.json"), JSON.stringify({ ts: iso(11), where_left_off: "was on cosine similarity", open_loop: "why cosine not euclidean" }));
  const staleBrief = brief(dirS, NOW);
  assert("an 11-day-old working_set is flagged STALE with its age", staleBrief.includes("STALE") && staleBrief.includes("11d"));
  assert("a same-day working_set carries NO age tag (healthy case stays quiet)", !b.includes("STALE") && !b.includes("age unknown") && b.includes("LAST SESSION:"));
  // ------------------------------------------------------------------------
  // DEAD-WIRE SWEEP (11 Aug 2026) — THE DISTILLER'S COUNTERS GET THEIR READER.
  // have_need + slot_sources had been written into working_set.json since the #106
  // pass with ZERO readers repo-wide, so the very collapse they exist to expose
  // (live that morning: his_words 12 / sources_scanned 25, 13 rows of my own
  // teaching) never reached the one surface that prints those slots. These fail if
  // this brief ever stops reading them — which is exactly how the wire died before.
  // The fixture mirrors distiller.mjs's real output shape, not an eyeballed one.
  // ------------------------------------------------------------------------
  const dirE = mkdtempSync(join(tmpdir(), "learnstate-evidence-"));
  writeFileSync(join(dirE, "working_set.json"), JSON.stringify({
    ts: iso(0.1), where_left_off: "was on cosine similarity", open_loop: "why cosine not euclidean",
    engine: "deterministic", slot_sources: { concept_in_motion: "floor", open_loop: "llm", where_left_off: "floor", next_step: "empty" },
    have_need: { his_words: 12, sources_scanned: 25, slots_filled: 3, slots_total: 4, captions_rejected: 0, self_rows_excluded: 13 },
  }));
  const evBrief = brief(dirE, NOW);
  const evLine = evBrief.split("\n").find(l => l.includes("EVIDENCE BEHIND")) || "";
  assert("the brief now READS have_need — the his-words ratio rides under the slots it explains",
    evLine.includes("12/25 scanned row(s) were HIS words"));
  assert("…and it names the CAUSE, so a self-capture leak is legible (#108's disease, not a caption's)",
    evLine.includes("13 were MY OWN teaching") && !evLine.includes("13 window caption"));
  assert("…and slot_sources rides too: the reader sees which slot came from the LLM vs the floor",
    evLine.includes("where_left_off ← floor") && evLine.includes("open_loop ← llm"));
  assert("a pre-#106 working_set (no counters at all) stays completely quiet — no invented numbers",
    !b.includes("EVIDENCE BEHIND"));
  // SILENT_FAILURE (dead-wire sweep, 11 Aug 2026) — "engine deterministic" is what a
  // healthy quiet morning writes AND what a dead pool writes, so this line could not
  // tell them apart. The distiller now names the path (llm_status); this is its only
  // reader. The fixture carries the exact string a renamed hippocampus export produces.
  const dirL = mkdtempSync(join(tmpdir(), "learnstate-llmstatus-"));
  writeFileSync(join(dirL, "working_set.json"), JSON.stringify({
    ts: iso(0.1), where_left_off: "was on cosine similarity", open_loop: "why cosine not euclidean",
    engine: "deterministic", llm_status: "threw: TypeError: generatePool is not a function",
    have_need: { his_words: 12, sources_scanned: 25, slots_filled: 3, slots_total: 4 },
  }));
  const llLine = brief(dirL, NOW).split("\n").find(l => l.includes("EVIDENCE BEHIND")) || "";
  assert("a BROKEN pool no longer reads as a healthy quiet morning — the brief names why the floor is standing",
    llLine.includes("engine deterministic") && llLine.includes("threw: TypeError: generatePool is not a function"));
  assert("…and a card the pool actually answered stays quiet: no llm_status, nothing appended (silent when healthy)",
    evLine.includes("engine deterministic") && !/engine deterministic \(/.test(evLine));
  // ------------------------------------------------------------------------
  // #WIRE (11 Aug 2026) — TRUNCATED_AT_DOOR, the second door. The distiller's LLM
  // path clamps a slot at 200 and now marks the cut; this brief clips at 180. A
  // bare slice here re-cut the marked slot BELOW its marker and served the captain
  // a silent mid-word stop all over again. The fixture is the real shape: a
  // 200-char open_loop that arrived already marked.
  // ------------------------------------------------------------------------
  const dirC = mkdtempSync(join(tmpdir(), "learnstate-clip-"));
  // built to EXACTLY the producer's 200-char cap (199 chars + the 1-char marker),
  // the way distiller.mjs's parseSet hands it over — not eyeballed to a length.
  const marked200 = "cosine similarity ka doubt hai — dot product bhi similarity deta hai na, phir normalize karke angle nikalne ka faayda kya hai jab dono vectors already same scale pe hain aur euclidean bhi kaam karega kya".slice(0, 199) + "…";
  writeFileSync(join(dirC, "working_set.json"), JSON.stringify({ ts: iso(0.1), where_left_off: marked200, open_loop: marked200 }));
  const clipBrief = brief(dirC, NOW);
  const openLine = clipBrief.split("\n").find(l => l.startsWith("OPEN LOOP")) || "";
  assert("#WIRE fixture is honest — the slot really is longer than this brief's 180 clip and arrives marked",
    marked200.length === 200 && marked200.endsWith(CLIP_MARK));
  assert("#WIRE the brief's own clip never hands him a silent mid-word cut — the marker survives the second door",
    openLine.includes("…") && !clipLegacy(marked200, 180).endsWith("…"));
  assert("#WIRE …and the clip still respects its cap exactly (marker spent from inside, no budget moved)",
    clip(marked200, 180).length === 180 && clip("short enough", 180) === "short enough");
  // REGRESSION (E2E audit): sprint match needs the "-" separator — "10-01" must not
  // fall into sprint 1 just because find() reaches n=1 first.
  const dirD = mkdtempSync(join(tmpdir(), "learnstate-doubledigit-"));
  writeFileSync(join(dirD, "sprint.json"), JSON.stringify({ sprints: [{ n: 1, theme: "Foundations" }, { n: 10, theme: "Deployment" }], progress: { current: { id: "10-01", task: "Shipping", track: "concept" } } }));
  const ddBrief = brief(dirD, NOW);
  assert("double-digit sprint id '10-01' labels S10, not S1", ddBrief.includes("S10 Deployment") && !ddBrief.includes("S1 Foundations"));
  assert("brief surfaces the daily Examiner reminder", b.toLowerCase().includes("daily examiner"));
  assert("brief tells the session NOT to re-ask where he is", b.includes("do NOT ask him to re-explain"));
  writeFileSync(join(dir, "sprint.json"), JSON.stringify({ sprints: [], progress: { current: { id: "1-07", task: "Python basics", track: "skill", subtopics: "types, f-strings" } } }));
  assert("skill task (Python) routes to the JS->Python CLOSE-PACKET loop", brief(dir, NOW).includes("CLOSE-PACKET"));
  writeFileSync(join(dir, "sprint.json"), JSON.stringify({ sprints: [], progress: { current: { id: "1-05", task: "Anthropic API", track: "course", subtopics: "messages, models" } } }));
  const courseBrief = brief(dir, NOW);
  assert("course task routes to COURSE (Colab) — NOT mislabeled FORGE", courseBrief.includes("COURSE") && !courseBrief.includes("FORGE"));
  // ---- DEAD-WIRE SWEEP (11 Aug 2026) — THE COURSE POSITION GETS ITS AGE ----
  // course.mjs stamped `current_at` on every `at <n>` from day one and no organ in the
  // repo read it, so a chapter he opened this morning printed the SAME line as one he
  // had been parked on for three weeks. These three fail if the field is dropped from
  // courseBrief() again, or if this branch stops asking for it.
  {
    const courseState = (currentAtIso) => JSON.stringify({
      version: 1,
      course: { id: "anthropic-api-fundamentals", title: "Anthropic API Fundamentals" },
      chapters: [
        { n: 1, title: "Getting started", covered: true, covered_at: iso(20) },
        { n: 2, title: "Messages format" },
      ],
      current: 2, current_at: currentAtIso, updated_at: iso(0),
    });
    writeFileSync(join(dir, "course.json"), courseState(iso(21)));   // 21d, well past WS_STALE_DAYS
    const parked = brief(dir, NOW);
    assert("a 21-day-old chapter position is flagged PARKED with its age (current_at finally has a reader)",
      parked.includes("📼") && parked.includes("PARKED") && parked.includes("21d"));
    writeFileSync(join(dir, "course.json"), courseState(iso(0.2)));
    const freshCourse = brief(dir, NOW);
    assert("a chapter he opened today carries NO age tag (the healthy case stays quiet)",
      freshCourse.includes("📼") && !freshCourse.includes("PARKED") && !freshCourse.includes("no position stamp"));
    writeFileSync(join(dir, "course.json"), courseState(null));
    assert("a position with NO stamp is called out, never assumed fresh (same law as wsTag/spTag)",
      brief(dir, NOW).includes("no position stamp"));
    // ---- DEAD-WIRE SWEEP pass 3 (11 Aug 2026) — THE NULL POSITION SPEAKS ----
    // THE DEFECT, exactly: `course.mjs at <n>` is the ONLY producer of `current`, and
    // it had zero callers anywhere in the organism, so `current` stayed null from the
    // 7 Aug ingest onward — and THIS branch printed nothing at all about that, while
    // the hint naming the fix lived in the arm above, which `current === null` gates
    // off. The dead wire hid itself. These two fail if the kickoff ever goes quiet
    // about an unstamped position again, or if the /learn skill stops calling `at`
    // (organism_test.mjs §2d holds the caller half of the same wire).
    const noPosition = (doneCount) => JSON.stringify({
      version: 1,
      course: { id: "anthropic-api-fundamentals", title: "Anthropic API Fundamentals" },
      chapters: [
        { n: 1, title: "Getting started", covered: doneCount >= 1, covered_at: doneCount >= 1 ? iso(3) : null },
        { n: 2, title: "Messages format", covered: false, covered_at: null },
      ],
      current: null, current_at: null, updated_at: iso(0),
    });
    writeFileSync(join(dir, "course.json"), noPosition(0));
    assert("an ingested course with NO position asks for the stamp (the arm that used to print nothing)",
      brief(dir, NOW).includes("position unstamped") && brief(dir, NOW).includes("course.mjs at <n>"));
    writeFileSync(join(dir, "course.json"), noPosition(1));
    const contradiction = brief(dir, NOW);
    assert("chapters closed but no position → the \"not started\" contradiction is named, not left to be spotted",
      contradiction.includes("POSITION UNSTAMPED") && contradiction.includes("1 chapter(s) closed")
      && contradiction.includes("not started"));
    // and the honest silence: an UNREADABLE course must not be told to stamp a
    // position — its own line already names the real repair (course.mjs:unreadableBrief).
    writeFileSync(join(dir, "course.json"), '{"version":1,"course":{"id":"x","title":"Py"},"chapters":[{"n":1,"cov');
    const broken = brief(dir, NOW);
    assert("an UNREADABLE course is NOT nagged for a stamp — one fault, one instruction",
      broken.includes("UNREADABLE") && !broken.includes("unstamped") && !broken.includes("UNSTAMPED"));
  }
  // ---- DEAD-WIRE SWEEP pass 2 (11 Aug 2026) — THE NEXT CHAPTER GETS SPOKEN ----
  // The regression these catch: this splice took `cb.line` alone, and statusLine() only
  // describes where he IS. On day one (current:null — the live state on disk) the kickoff
  // said "not started" and named no chapter, though courseBrief() had already worked out
  // that chapter 1 is "Getting started". Fails if `next`/`start_seconds` are dropped at
  // this door again, or from courseBrief() upstream.
  {
    const notStarted = JSON.stringify({
      version: 1,
      course: { id: "anthropic-api-fundamentals", title: "Anthropic API Fundamentals" },
      chapters: [
        { n: 1, title: "Getting started", start_seconds: 0, covered: false },
        { n: 2, title: "Messages format", start_seconds: 271, covered: false },
      ],
      current: null, current_at: null, updated_at: iso(0),
    });
    writeFileSync(join(dir, "course.json"), notStarted);
    const day1 = brief(dir, NOW);
    assert("DAY ONE — a not-started course still NAMES the chapter to open (the `next` field finally has a reader)",
      day1.includes("📼") && day1.includes("agla: ch1 Getting started"));
    writeFileSync(join(dir, "course.json"), JSON.stringify({
      version: 1,
      course: { id: "anthropic-api-fundamentals", title: "Anthropic API Fundamentals" },
      chapters: [
        { n: 1, title: "Getting started", start_seconds: 0, covered: true, covered_at: iso(2) },
        { n: 2, title: "Messages format", start_seconds: 271, covered: false },
        { n: 3, title: "Streaming", start_seconds: null, covered: false },
      ],
      current: 2, current_at: iso(0.2), updated_at: iso(0),
    }));
    const mid = brief(dir, NOW);
    assert("mid-course — his own chapter carries the resume second, and the NEXT one is named",
      mid.includes("@ 00:04:31") && mid.includes("agla: ch3 Streaming"));
    assert("a chapter with NO timestamp shows no stamp at all — never a fabricated 00:00:00",
      !mid.includes("--:--") && !/agla: ch3 Streaming @/.test(mid));
    // ---- DEAD-WIRE SWEEP pass 3 (11 Aug 2026) — THE COURSE ADDRESS GETS SPOKEN ----
    // course.mjs validated and stored `source_url` from day one and no organ returned
    // it, so this line named his chapter and never where to open it. The URL below is
    // the value live on disk today. Fails if the field is dropped at this door or from
    // courseBrief() upstream; the second half fails if anyone ever clips it (a
    // truncated address is worse than none).
    writeFileSync(join(dir, "course.json"), JSON.stringify({
      version: 1,
      course: { id: "anthropic-api-fundamentals", title: "Anthropic API Fundamentals", source_url: "https://github.com/anthropics/courses/tree/master/anthropic_api_fundamentals" },
      chapters: [{ n: 1, title: "Getting started", start_seconds: 0, covered: false }],
      current: null, current_at: null, updated_at: iso(0),
    }));
    const addressed = brief(dir, NOW);
    assert("the course line carries the course's ADDRESS, whole and unclipped (source_url finally has a reader)",
      addressed.includes("📼") && addressed.includes("https://github.com/anthropics/courses/tree/master/anthropic_api_fundamentals"));
    // and the honest absence: a paste with no URL prints no address and no empty tail
    writeFileSync(join(dir, "course.json"), JSON.stringify({
      version: 1,
      course: { id: "anthropic-api-fundamentals", title: "Anthropic API Fundamentals" },
      chapters: [{ n: 1, title: "Getting started", start_seconds: 0, covered: false }],
      current: null, current_at: null, updated_at: iso(0),
    }));
    const noAddress = brief(dir, NOW);
    assert("no URL in his paste ⇒ no address on the line, and no dangling ' · ' either",
      noAddress.includes("📼") && !noAddress.includes("http") && !/Getting started · \s*$/m.test(noAddress));
  }
  writeFileSync(join(dir, "sprint.json"), JSON.stringify({ sprints: [], progress: { current: { id: "1-08", task: "FinOps repo", track: "build", subtopics: "scaffold" } } }));
  const buildBrief = brief(dir, NOW);
  assert("build task routes to BUILD — never a stray FORGE label", buildBrief.includes("BUILD") && !buildBrief.includes("FORGE"));
  const dir2 = mkdtempSync(join(tmpdir(), "learnstate-empty-"));
  assert("empty state -> a valid brief, never a crash", typeof brief(dir2, NOW) === "string" && brief(dir2, NOW).includes("KICKOFF"));

  // ---- P2 — THE NIGHT COACH line (9 Aug 2026, his unleash word) ------------
  {
    const dirN = mkdtempSync(join(tmpdir(), "learnstate-nightcoach-"));
    const ld = (ms) => { const t = new Date(ms); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`; };
    mkdirSync(join(dirN, "brain_out", "night_coach"), { recursive: true });
    writeFileSync(join(dirN, "brain_out", "night_coach", ld(NOW) + ".json"),
      JSON.stringify({ date: ld(NOW), study_day: ld(NOW - 86400000), misconceptions: [{ concept: "context" }, { concept: "hallucinations" }], lesson: { concept: "context", check_question: "?" } }));
    const nb = brief(dirN, NOW);
    assert("P2 a TODAY night-coach file yields one line, NO age tag (healthy case stays quiet)",
      nb.includes("🌙 NIGHT COACH:") && nb.includes("2 misconception(s)") && !nb.includes("purana"));
    const dirN2 = mkdtempSync(join(tmpdir(), "learnstate-nightcoach-stale-"));
    mkdirSync(join(dirN2, "brain_out", "night_coach"), { recursive: true });
    writeFileSync(join(dirN2, "brain_out", "night_coach", ld(NOW - 86400000) + ".json"),
      JSON.stringify({ misconceptions: [{ concept: "context" }] }));
    assert("P2 a YESTERDAY file is tagged with its age, never served as fresh",
      brief(dirN2, NOW).includes("1d purana"));
    assert("P2 no night file ⇒ zero new lines (a new organ's silence is not a finding)",
      !brief(dir2, NOW).includes("NIGHT COACH"));
    const dirN3 = mkdtempSync(join(tmpdir(), "learnstate-nightcoach-shapeless-"));
    mkdirSync(join(dirN3, "brain_out", "night_coach"), { recursive: true });
    writeFileSync(join(dirN3, "brain_out", "night_coach", ld(NOW) + ".json"), JSON.stringify({ lesson: {} }));
    assert("P2 a shapeless file (no misconceptions[]) stays silent, never crashes the brief",
      typeof brief(dirN3, NOW) === "string" && !brief(dirN3, NOW).includes("NIGHT COACH"));

    // ---- H6 (10 Aug 2026) — THE DIARY line: sibling first, md fallback -----
    mkdirSync(join(dirN, "brain_out", "diary"), { recursive: true });
    writeFileSync(join(dirN, "brain_out", "diary", ld(NOW) + ".json"),
      JSON.stringify({ date: ld(NOW), will_change: "teach axis d through the artefact first" }));
    assert("H6 a TODAY diary sibling yields the WILL CHANGE line, deterministic path",
      brief(dirN, NOW).includes("📔 BRAIN DIARY:") && brief(dirN, NOW).includes("teach axis d"));
    const dirD2 = mkdtempSync(join(tmpdir(), "learnstate-diary-md-"));
    mkdirSync(join(dirD2, "brain_out", "diary"), { recursive: true });
    writeFileSync(join(dirD2, "brain_out", "diary", ld(NOW) + ".md"), "# DIARY\nattended: nine jobs ran clean tonight\n");
    assert("H6 no sibling ⇒ the md's first non-heading line (degraded path still speaks)",
      brief(dirD2, NOW).includes("nine jobs ran clean"));
    assert("H6 no diary at all ⇒ zero new lines (absence is silence, never a nag)",
      !brief(dir2, NOW).includes("BRAIN DIARY"));

    // ---- #WIRE (11 Aug 2026) — A BLANK WITH A MEASURED CAUSE IS NOT A BLANK ------
    // Goes red the moment this kickoff goes back to printing nothing while the brain
    // has the refusal written down — the CONSUMER_NO_PRODUCER shape that kept the
    // diary line silent for its whole life. Fixture is the LIVE record's shape
    // (brain.mjs recordBudgetBlock → tokenVitals.starved), and the shift day is
    // NOW − 1 because a `serve: next_morning` page is written on the night before
    // the morning it is named for. Numbers are the ones measured on his repo at
    // 04:37 IST on 11 Aug, not invented for the test.
    const dirSv = mkdtempSync(join(tmpdir(), "learnstate-diary-starved-"));
    writeFileSync(join(dirSv, "token_vitals.json"), JSON.stringify({
      starved: { shift_day: ld(NOW - 86400000), beats: 41,
        jobs: [{ id: "diary", beats: 41, phase: "overnight", used: 1901322, cap: 1520000, priority: 10 }] },
    }));
    const svLine = brief(dirSv, NOW).split("\n").find((l) => l.includes("BRAIN DIARY")) || "";
    assert("#WIRE — no diary page + a RECORDED budget starvation ⇒ the kickoff says WHY, with the brain's own measured numbers, and refuses the slept-through story",
      /page nahi likhi/.test(svLine) && /budget-starved on the /.test(svLine)
      // grouped through toLocaleString exactly as brain's own fuel summary does, so the
      // expectation is COMPUTED here rather than pasted — this box renders en-IN
      // ("19,01,322") and a pasted en-US string would go red on his laptop alone.
      && svLine.includes(`${(1901322).toLocaleString()}/${(1520000).toLocaleString()}`)
      && /41 beat\(s\) refused/.test(svLine) && /slot not consumed/.test(svLine)
      // and it stays ONE line — the ANCHOR LAW: the kickoff carries the measured fact,
      // the longer "the machine was awake" correction belongs to the Gaffer's own door
      // (dugout get_diary), which is the surface that would otherwise tell him the
      // wrong story out loud.
      && svLine.split("\n").length === 1 && !/slept-through/.test(svLine));
    // …and the discrimination itself: a starvation from ANOTHER night, or of another
    // job, explains nothing about this morning and must not be borrowed to fill it.
    writeFileSync(join(dirSv, "token_vitals.json"), JSON.stringify({
      starved: { shift_day: ld(NOW - 3 * 86400000), beats: 41,
        jobs: [{ id: "diary", beats: 41, phase: "overnight", used: 1901322, cap: 1520000 }] },
    }));
    assert("#WIRE — an OLD night's starvation is not an excuse for this morning (and neither is another job's) — silence returns",
      !brief(dirSv, NOW).includes("BRAIN DIARY"));
  }

  // ---- P7.B — THE ARBITER (7 Aug 2026): one winner, stated precedence, losers named
  const dirA = mkdtempSync(join(tmpdir(), "learnstate-arbiter-"));
  writeFileSync(join(dirA, "sprint.json"), JSON.stringify({ sprints: [], progress: { current: { id: "1-04", task: "Hallucinations", track: "concept" } } }));
  assert("ARBITER — with only a sprint, the sprint wins (plan of record)",
    nextup(dirA, NOW).winner.name === "sprint");
  // ONE FIXTURE WRITER (W0-D, 2 Sep 2026). This block had FIVE separate writeFileSync
  // call sites for the same file, and xray's per-organ ratchet counts unresolved fs
  // sinks BY CALL SITE — so adding the two W0-D fixtures below took learnstate 62 → 64
  // and turned the instrument red. The campaign's own precedent (S6-R/F-01, W0-A) is to
  // REUSE the walker rather than add a call site, so all five collapse into this one.
  // Net: 62 → 61, better than the baseline it was measured against, and a sixth fixture
  // costs the ratchet nothing.
  const forgeFx = (o) => writeFileSync(join(dirA, "forge_session.json"),
    JSON.stringify({ concept: "hallucinations", step: 4, ...o }));
  const hoursAgo = (h) => new Date(NOW - h * 3600000).toISOString();
  forgeFx({ started_at: hoursAgo(2) });
  assert("ARBITER — an OPEN fresh forge session beats the sprint, and says RESUME",
    (() => { const n = nextup(dirA, NOW); return n.winner.name === "forge-open" && /resume/.test(n.winner.line) && n.contenders.some((c) => c.name === "sprint"); })());
  // row 69 (3) (6 Sep 2026): the pointer rides the one line he reads. With a pointer on disk the
  // line names the question; without one it invents nothing (the fallback in disguise, refused).
  forgeFx({ started_at: hoursAgo(2), resume_pointer: { text: "Word-level itna simple hai — toh subword kyun?", axis: "b", step: 4, at: hoursAgo(1) } });
  assert("ARBITER row 69 (3) — the PEHLA KAAM line carries the pointer's exact question when one is on disk, and invents none when there is none",
    (() => { const withP = nextup(dirA, NOW).winner.line; forgeFx({ started_at: hoursAgo(2) }); const without = nextup(dirA, NOW).winner.line;
      return withP.includes('agla sawaal: "Word-level itna simple hai — toh subword kyun?"') && /resume 'hallucinations' @ STEP 4/.test(withP) && !without.includes("agla sawaal"); })());
  forgeFx({ started_at: hoursAgo(30) });
  // W0-D (2 Sep 2026): a stale-open session still WINS the slot — an open loop starves
  // everything, that ranking is untouched. What changed is the ACTION: the old line
  // ordered "close … PHIR wahi concept continue", which is `resume` spelled as two
  // steps, one of which throws away the session. Both doors are asserted so neither can
  // quietly vanish from the one line he reads every morning.
  assert("ARBITER — a STALE-open session wins, and the action is RESUME-first (close is still offered, for a concept he is actually done with)",
    (() => { const l = nextup(dirA, NOW).winner.line;
      return /PEHLE.*resume/.test(l) && /`close`/.test(l) && /hallucinations/.test(l); })());
  forgeFx({ started_at: hoursAgo(72), updated_at: hoursAgo(2) });
  assert("ARBITER W0-D — a TWO-SITTING concept (born 3 days ago, touched 2h ago) reads as LIVE here, so his kickoff stops ordering a close on work in progress",
    (() => { const w = nextup(dirA, NOW).winner; return w.name === "forge-open" && !/PEHLE/.test(w.line) && /resume 'hallucinations' @ STEP 4/.test(w.line); })());
  forgeFx({ started_at: hoursAgo(30) });
  forgeFx({ started_at: hoursAgo(30), closed_at: hoursAgo(20) });
  const capDirA = join(dirA, "capsules"); mkdirSync(capDirA, { recursive: true });
  // W0-B (2 Sep 2026): these ask whether an OVERDUE round outranks a closed session — a
  // RANKING question. The GAME-ON epoch closes the queue on any capsule locked before it,
  // so this fixture's world moves +92 days past the epoch (its own NOW included, for these
  // assertions only) and every interval stays identical to the unit. The rest of this suite
  // keeps its clock — its other fixtures have nothing to do with capsules.
  const NOW_POST = Date.parse("2026-10-25T12:00:00Z");   // NOW + 92d
  const writeCap = (lock) => writeFileSync(join(capDirA, "tokenization.json"), JSON.stringify({ id: "tokenization", lockedOn: lock, reJirahDone: [] }));
  writeCap("2026-09-15");
  assert("ARBITER — session closed + an overdue Re-Jirah round → Re-Jirah wins (proof decays first)",
    (() => { const n = nextup(dirA, NOW_POST); return n.winner.name === "rejirah-due" && /tokenization/.test(n.winner.line); })());
  assert("ARBITER · W0-B — and a PRE-restart capsule never reaches that slot at all: same fixture, lock moved back before GAME ON",
    (() => { writeCap("2026-06-15"); const n = nextup(dirA, NOW_POST); writeCap("2026-09-15");
      return n.winner.name !== "rejirah-due" && !n.contenders.some((c) => c.name === "rejirah-due"); })());
  writeFileSync(join(dirA, "rejirah_log.jsonl"), JSON.stringify({ kind: "round-close", concept: "tokenization", round: 1, due: "2026-09-18", closed_at: iso(1), axes_graded: ["a"] }) + String.fromCharCode(10));
  assert("ARBITER — a round SAT-but-unpasted beats a merely-due round (five organs read it as never-served)",
    nextup(dirA, NOW_POST).winner.name === "rejirah-pending");
  // ---- DEAD-WIRE SWEEP (11 Aug 2026): the Examiner slot must go through the OWNER's
  // freshness gate. Before the fix these three passed with a 7-month-old drill winning
  // the PEHLA KAAM slot. The dir carries no sprint/forge/rejirah, so the drill is the
  // only candidate — exactly the state in which the bug fired.
  const dirX = mkdtempSync(join(tmpdir(), "learnstate-examiner-"));
  const stamp = (d) => JSON.stringify({ date: d, staged_at: d + "T16:25:00.000Z", concept: "tokenization", template: "implement" });
  writeFileSync(join(dirX, "examiner_drill.json"), stamp("2026-01-04"));
  assert("EXAMINER GATE — a 7-month-stale drill NEVER wins PEHLA KAAM (owner's loadFreshDrill, not a raw read)",
    (() => { const n = nextup(dirX, NOW); return n.winner.name === "none" && /PURANA drill/.test(n.winner.line) && /examiner\.mjs stage/.test(n.winner.line); })());
  assert("EXAMINER GATE — the rejected drill stays VISIBLE as a contender, tagged STALE and dated",
    (() => { const c = nextup(dirX, NOW).contenders.find((x) => x.name === "examiner"); return !!c && /STALE/.test(c.line) && c.line.includes("2026-01-04"); })());
  writeFileSync(join(dirX, "examiner_drill.json"), stamp("2026-07-24"));   // NOW is 2026-07-25 → yesterday's 21:55 staging
  assert("EXAMINER GATE — yesterday's 21:55 staging still wins, and the card now carries its DATE",
    (() => { const n = nextup(dirX, NOW); return n.winner.name === "examiner" && n.winner.line.includes("tokenization") && n.winner.line.includes("2026-07-24"); })());
  // DEAD-WIRE GUARD (11 Aug 2026) — THE SERVE RECEIPT REACHES HIS ANCHOR.
  // The drill was staged nightly and nothing said whether a surface ever opened it, so
  // this card offered him work he might already have done. Both states must be legible,
  // and the ranking must NOT move — the receipt informs, it never decides.
  assert("EXAMINER RECEIPT — an unserved drill's card says nothing extra (silence is the honest default)",
    !/khela ja chuka/.test(nextup(dirX, NOW).winner.line));
  writeFileSync(join(dirX, "examiner_drill.json"), JSON.stringify({ ...JSON.parse(stamp("2026-07-24")), served: [{ by: "scrimmage-voice", at: "2026-07-25T04:00:00.000Z" }] }));
  assert("EXAMINER RECEIPT — a SERVED drill says so on the card, names the surface, and still ranks identically",
    (() => { const n = nextup(dirX, NOW); return n.winner.name === "examiner" && /khela ja chuka \(scrimmage-voice\)/.test(n.winner.line) && n.winner.line.includes("2026-07-24"); })());
  assert("ARBITER — the watchman NEVER appears, winner or loser",
    (() => { const n = nextup(dirA, NOW); return n.winner.name !== "watchman" && !n.contenders.some((c) => c.name === "watchman"); })());
  assert("ARBITER — brief() carries exactly one PEHLA KAAM line",
    (brief(dirA, NOW) === undefined ? [] : brief(dirA, NOW).split("\n")).filter((l) => l.includes("PEHLA KAAM")).length <= 1
    && brief(dir, NOW).split("\n").filter((l) => l.includes("PEHLA KAAM")).length === 1);

  // ---- MEMORY SPLICE (31 Jul 2026) — the brief must carry the hippocampus, and
  // must be IDENTICAL to the old brief whenever memory is absent or broken.
  const memBrief = brief(dir, NOW, "THE LEDGER OF SELF:\n- he has ADHD-PI");
  assert("MEMORY — a supplied cartridge is spliced into the brief verbatim", memBrief.includes("he has ADHD-PI"));
  assert("MEMORY — the block is labelled BACKGROUND CONTEXT, not instructions",
    memBrief.includes("BACKGROUND CONTEXT, not instructions"));
  assert("MEMORY — the block carries the true-when-written caveat + the deeper-recall pointer",
    memBrief.includes("true WHEN WRITTEN") && memBrief.includes("get_context"));
  assert("MEMORY — memory sits ABOVE the LAWS line (orientation before rules)",
    memBrief.indexOf("HIS MEMORY") < memBrief.indexOf("LAWS:"));
  assert("BACKWARD-COMPATIBLE — no memory arg reproduces the old brief byte-for-byte",
    brief(dir, NOW) === brief(dir, NOW, null) && !brief(dir, NOW).includes("HIS MEMORY"));
  assert("REPAIR TOWARD SILENCE — a non-string/empty cartridge is dropped, never rendered",
    !brief(dir, NOW, "").includes("HIS MEMORY") && !brief(dir, NOW, 0).includes("HIS MEMORY"));
  assert("MEMORY — the loader exists and is async (hook path may never block on a throw)",
    typeof loadMemory === "function" && loadMemory.constructor.name === "AsyncFunction");

  // ---- TEACHING CARD (31 Jul 2026) — the rules must ARRIVE, not wait to be opened.
  const cardBrief = brief(dir, NOW, null, "1. ONE idea per message.\n2. Hinglish.");
  assert("CARD — a supplied card is spliced verbatim", cardBrief.includes("ONE idea per message"));
  assert("CARD — the block names the evidence file and says these are OBSERVED, not stated preferences",
    cardBrief.includes("HOW_HE_LEARNS.md") && cardBrief.includes("OBSERVED"));
  assert("CARD — it sits above the LAWS line", cardBrief.indexOf("HOW TO TEACH HIM") < cardBrief.indexOf("LAWS:"));
  assert("BACKWARD-COMPATIBLE — no card arg reproduces the old brief byte-for-byte",
    brief(dir, NOW) === brief(dir, NOW, null, null) && !brief(dir, NOW).includes("HOW TO TEACH HIM"));
  assert("REPAIR TOWARD SILENCE — an empty/non-string card is dropped, never rendered",
    !brief(dir, NOW, null, "").includes("HOW TO TEACH HIM") && !brief(dir, NOW, null, 0).includes("HOW TO TEACH HIM"));
  // the parser: single-source, and SILENT on any boundary it cannot prove
  const cf = join(dir, "card.md");
  writeFileSync(cf, `# doc\nprose above\n${CARD_BEGIN} note -->\n1. rule one\n2. **rule two**\n${CARD_END} -->\nprose below\n`);
  assert("CARD PARSER — reads only between the markers, strips bold, drops the surrounding prose",
    loadTeachingCard(cf) === "1. rule one\n2. rule two");
  writeFileSync(cf, "# doc\nno markers here at all\n");
  assert("CARD PARSER — no markers -> null (never guesses at the boundaries)", loadTeachingCard(cf) === null);
  writeFileSync(cf, `# doc\n${CARD_BEGIN} note -->\n1. orphan begin, no end\n`);
  assert("CARD PARSER — a begin with no end -> null", loadTeachingCard(cf) === null);
  writeFileSync(cf, `${CARD_BEGIN} note -->\n   \n${CARD_END} -->\n`);
  assert("CARD PARSER — an empty block -> null", loadTeachingCard(cf) === null);
  assert("CARD PARSER — a missing file -> null, never a throw", loadTeachingCard(join(dir, "__nope__.md")) === null);
  writeFileSync(cf, `${CARD_BEGIN} n -->\n${"x".repeat(CARD_MAX + 500)}\n${CARD_END} -->\n`);
  assert("CARD PARSER — a runaway card is capped and says so (the brief stays orientation)",
    loadTeachingCard(cf).length <= CARD_MAX + 80 && loadTeachingCard(cf).includes("truncated"));
  // THE CALLER'S CAP (dead-wire sweep, 11 Aug 2026). The assertion above pins the frozen
  // DEFAULT; this one pins the parameter context_manifest.mjs needs, because a budget-owner
  // that cannot ask for the card WHOLE can never report how much of it it cut. It fails the
  // moment the cap goes back to being this file's private constant.
  assert("CARD PARSER — a caller's cap is honoured, and the WHOLE card is reachable with a cap no card can exceed",
    loadTeachingCard(cf, 50).length <= 50 + 80 && loadTeachingCard(cf, 50).includes("truncated")
    && loadTeachingCard(cf, Number.MAX_SAFE_INTEGER).length === CARD_MAX + 500
    && !loadTeachingCard(cf, Number.MAX_SAFE_INTEGER).includes("truncated"));
  assert("THE REAL DOC PARSES — the shipped HOW_HE_LEARNS.md yields all seventeen rules",
    (() => { const c = loadTeachingCard(); return !!c && /^1\. Give ONE new idea/m.test(c) && /^16\. /m.test(c); })());
  // ---- AUDIT #108 (6 Aug 2026) — the RE-JIRAH OVERDUE day-counts must carry their age.
  // Same defect the working_set and the sprint spine were both repaired for, on the one
  // slot that never got it: capsule_map.json is regenerated only by the morning conductor,
  // so its `42d` is as old as the map. Fixtures only — the live bus is never touched.
  // L6 · fate 18 (15 Oct 2026): the overdue line now names only a concept whose OWN capsule passed the GAME ON gate, so
  // these map fixtures carry that capsule, locked after the epoch — the assertions below keep asking their own question
  // (the map's age, the owner's sentence); the gate itself is asserted on its own in the L6 block.
  const passedCapsule = (/** @type {string} */ d) => { mkdirSync(join(d, "capsules"), { recursive: true }); writeFileSync(join(d, "capsules", "embeddings.json"), JSON.stringify({ id: "embeddings", num: "02", title: "Embeddings", lockedOn: "2026-09-13", faultLines: [], doubts: [] })); };
  const mapDir = (genAt) => {
    const d = mkdtempSync(join(tmpdir(), "learnstate-map-"));
    writeFileSync(join(d, "capsule_map.json"), JSON.stringify({
      ...(genAt === null ? {} : { generated_at: genAt }),
      rejirah_overdue: [{ concept: "embeddings", overdue_days: 42, rounds_done: 0 }],
    }));
    passedCapsule(d);
    return d;
  };
  const freshMap = brief(mapDir(iso(0.2)), NOW);
  const oldMap   = brief(mapDir(iso(3)), NOW);
  const noStamp  = brief(mapDir(null), NOW);
  assert("RE-JIRAH OVERDUE still prints its counts unchanged in every age branch",
    [freshMap, oldMap, noStamp].every((b) => b.includes("RE-JIRAH OVERDUE (1): embeddings 42d")
      && b.includes("Overdue = RIPE, late nahi")));
  assert("a same-day capsule_map carries NO age tag (the healthy case stays quiet)",
    !freshMap.includes("MAP ") && !freshMap.includes("generated_at nahi"));
  assert("a 3-day-old capsule_map says so — the day-counts are that day's, not today's",
    oldMap.includes("MAP 3d purana") && oldMap.includes("capsule_bridge.mjs"));
  assert("a capsule_map with NO generated_at is CALLED OUT, never assumed fresh",
    noStamp.includes("koi generated_at nahi") && noStamp.includes("capsule_bridge.mjs"));
  assert("the RE-JIRAH OVERDUE slot is still ONE line (the kickoff is not a wall)",
    (oldMap.split("\n").find((l) => l.startsWith("RE-JIRAH OVERDUE")) || "").length > 0
    && oldMap.split("\n").filter((l) => l.startsWith("RE-JIRAH OVERDUE")).length === 1);

  // ---- DEAD-WIRE SWEEP (10 Aug 2026) — capsule_bridge's `line` had ZERO readers.
  // The fixtures above deliberately carry NO `line` (that is the pre-wire shape, and it
  // must keep rendering byte-identically). This one carries the sentence off today's real
  // capsule_map.json. These fail the moment the brief goes back to speaking only its own
  // derived day-counts and drops the owner's strike-readiness fact — which is the whole
  // defect: the questions already exist and no surface said so.
  const OWN_LINE = "embeddings ka Re-Jirah 47 din overdue hai — aur uske 9 strike sawaal already likhe rakhe hain.";
  const lineDir = mkdtempSync(join(tmpdir(), "learnstate-mapline-"));
  writeFileSync(join(lineDir, "capsule_map.json"), JSON.stringify({
    generated_at: iso(0.2),
    rejirah_overdue: [{ concept: "embeddings", overdue_days: 47, rounds_done: 0 }],
    line: OWN_LINE,
  }));
  passedCapsule(lineDir);   // L6 · fate 18 — see the note on mapDir above
  const withLine = brief(lineDir, NOW);
  assert("SWEEP capsule_bridge's own headline reaches the kickoff VERBATIM — strike count and all",
    withLine.includes(OWN_LINE) && /9 strike sawaal/.test(withLine));
  assert("SWEEP it rides the SAME RE-JIRAH line, never re-composed into a second one",
    (withLine.split("\n").find((l) => l.startsWith("RE-JIRAH OVERDUE")) || "").includes(OWN_LINE)
    && withLine.split("\n").filter((l) => l.includes("strike sawaal")).length === 1);
  assert("SWEEP a map with NO `line` renders exactly as before (absence stays absence, nothing invented)",
    !freshMap.includes("strike sawaal") && freshMap.includes("RE-JIRAH OVERDUE (1): embeddings 42d"));

  // ---- THE OUTWARD LINES + SEASON (outward loop, 8 Aug 2026)
  const dirO = mkdtempSync(join(tmpdir(), "learnstate-outward-"));
  writeFileSync(join(dirO, "sprint.json"), JSON.stringify({ sprints: [], progress: { current: { id: "1-04", task: "Hallucinations", track: "concept" } } }));
  writeFileSync(join(dirO, "missions.json"), JSON.stringify({ missions: [
    { id: "M01", type: "audit", staged_at: iso(1), ingested_at: null },
    { id: "M02", type: "audit", staged_at: iso(1), ingested_at: null },
    { id: "M03", type: "audit", staged_at: iso(1), ingested_at: null },
    { id: "M04", type: "audit", staged_at: iso(1), ingested_at: null },
    { id: "T-hallucinations", type: "topic_open", staged_at: iso(1), ingested_at: null },
  ], syllabus_audit: { closed_at: null }, events: [] }));
  const ob = brief(dirO, NOW);
  assert("OUTWARD — audit status + next fire ride the kickoff brief",
    ob.includes("OUTWARD: full-syllabus audit 0/4 returned — fire M01"));
  assert("OUTWARD — a staged topic mission surfaces with the EMPHASIS-only reminder",
    ob.includes("OUTWARD: T-hallucinations staged") && ob.includes("EMPHASIS only"));
  assert("OUTWARD — the unmet floor surfaces as have/need (his ruled 2, never shame)",
    ob.includes("OUTWARD FLOOR: 0/2 this week") && !/behind|late|failed/i.test(ob.split("\n").find((l) => l.startsWith("OUTWARD FLOOR")) || ""));
  // THE GATED TERM (11 Aug 2026). Fails the moment this line goes back to
  // promising "a benchmark run touches it" while benchmark.mjs is gated and
  // structurally cannot stamp runs[] (its :406/:417 gated branch, pinned by its
  // own selftest at :543). The gated fixture below is the LIVE file's shape.
  writeFileSync(join(dirO, "benchmark.json"), JSON.stringify({ status: "gated_pre_audit", runs: [],
    gate: { reason: "Ruling 6 — benchmark ships AFTER the full-syllabus audit refresh", missions_line: "full-syllabus audit 0/4 returned" } }));
  const obGated = brief(dirO, NOW).split("\n").find((l) => l.startsWith("OUTWARD FLOOR")) || "";
  assert("OUTWARD — a GATED benchmark never promises a benchmark run can touch the floor; it names the one door that is open",
    /0\/2 this week/.test(obGated) && /benchmark GATED/.test(obGated) && /mission return is what touches it/.test(obGated)
    && !/or a benchmark run touches it/.test(obGated));
  writeFileSync(join(dirO, "benchmark.json"), JSON.stringify({ status: "ok", regressions: [],
    runs: [new Date(NOW - 86400000).toISOString(), new Date(NOW - 2 * 86400000).toISOString()] }));
  assert("OUTWARD — floor met (2 benchmark runs this week) ⇒ the floor line goes SILENT",
    !brief(dirO, NOW).includes("OUTWARD FLOOR"));
  writeFileSync(join(dirO, "benchmark.json"), JSON.stringify({ status: "ok", runs: [],
    regressions: ["B2 RAG: cold-held 2 → 1"] }));
  assert("OUTWARD — a benchmark regression reaches the kickoff brief (Ruling 5 edge)",
    brief(dirO, NOW).includes("OUTWARD: benchmark regression — B2 RAG"));
  // 10 Aug 2026 wiring pass — benchmark.mjs's needs[] had NO reader anywhere in
  // the organism; this brief is the SessionStart anchor, so it is where the
  // "what to DO" half has to land. Fails the moment the wire is cut again.
  writeFileSync(join(dirO, "benchmark.json"), JSON.stringify({ status: "ok", runs: [], regressions: [],
    needs: ["2-rag: unlock chunking, retrieval", "course: 6 chapters remain", "python: Phase A tiers T0→T4-lite"] }));
  const obN = brief(dirO, NOW);
  assert("OUTWARD — the benchmark's NEED NAMES reach the kickoff, first + count (never the whole list — ANCHOR LAW)",
    obN.includes("OUTWARD: benchmark need — 2-rag: unlock chunking, retrieval (+2 more")
    && !obN.includes("course: 6 chapters remain"));
  writeFileSync(join(dirO, "benchmark.json"), JSON.stringify({ status: "ok", runs: [], regressions: [], needs: [] }));
  assert("OUTWARD — zero needs ⇒ the need line goes SILENT (absence, never an empty debt)",
    !brief(dirO, NOW).includes("benchmark need"));
  writeFileSync(join(dirO, "benchmark.json"), JSON.stringify({ status: "ok", runs: [],
    regressions: ["B2 RAG: cold-held 2 → 1"] }));
  writeFileSync(join(dirO, "season.json"), JSON.stringify({ season_day: 3, matches_played: 2,
    rows: [{ result: "HIT" }, { result: "MISS" }, { result: "REST" }] }));
  assert("SEASON — the streak line rides the brief once a season exists",
    brief(dirO, NOW).includes("SEASON: day 3 · matchday 2 · run 1 won-day(s)"));
  assert("BACKWARD-COMPATIBLE — a world with no missions/benchmark/season shows ZERO outward noise",
    !brief(dir, NOW).includes("OUTWARD") && !brief(dir, NOW).includes("SEASON:"));

  // ── A4 + A5 + A6 (4 Sep 2026) · THE BRIEF OPENS ON HIS STUDY ────────────────
  // Driven on a FIXTURE state dir, four ways: mid-concept, mid-concept with a STALE
  // session, no sheet row at all, and nothing open. The last three each turned this
  // whole rung OFF in the first draft; every one of them is his normal Tuesday.
  {
    const d = mkdtempSync(join(tmpdir(), "ls-a5-"));
    const W = (n, o) => { mkdirSync(dirname(join(d, n)), { recursive: true }); writeFileSync(join(d, n), typeof o === "string" ? o : JSON.stringify(o)); };
    const NOW = Date.parse("2026-09-04T05:00:00.000Z");
    const SPRINT = { start: "2026-08-25", sprints: [{ n: 1, theme: "Foundations" }],
      progress: { synced_at: new Date(NOW).toISOString(), done: [], current: { id: "1-04", task: "Hallucinations", track: "concept", subtopics: "causes" }, next_up: [], examiner_daily: true } };
    W("sprint.json", SPRINT);
    W("working_set.json", { ts: new Date(NOW).toISOString() });
    W("cards.json", { date: "2026-09-04", total_cards: 9, due_today: 3, overdue: 1 });
    W("capsules/tokenization.json", { id: "tokenization", num: "01", title: "Tokenization", lockedOn: "2026-06-15", faultLines: [], doubts: [] });
    W("capsules/embeddings.json", { id: "embeddings", num: "02", title: "Embeddings", lockedOn: "2026-06-21", faultLines: [], doubts: [] });
    W("season.json", { season_day: 1, matches_played: 0, rows: [] });
    const LIVE = { concept: "tokenization", step: 3, current_axis: "a", closed_at: null,
      started_at: new Date(NOW - 3600000).toISOString(), updated_at: new Date(NOW - 3600000).toISOString(),
      steps_done: [0, 1, 2, 3], axes_done: ["a"], axes_deferred: ["c"], question_moments: {} };

    W("forge_session.json", LIVE);
    const withSession = brief(d, NOW);
    assert("A4 · MID-CONCEPT, the headline is the OPEN SESSION's concept — the floor is the NEXT thing, never a second answer to 'where am I' on the same screen",
      /LEARNING NOW: tokenization \[khuli hui session/.test(withSession) && !/LEARNING NOW: FLOOR/.test(withSession));
    assert("A4 · HIS SHEET IS NOT DELETED — the line says where its own current went, and names the one command that overrides the floor",
      /sheet abhi bhi "1-04 Hallucinations"/.test(withSession) && /sprintsync\.mjs floor/.test(withSession));
    assert("A5 · the STUDY BLOCK comes BEFORE the sheet's own lines — step, axis, what is left, FSRS, and the micro-question instruction",
      (() => { const L = withSession.split("\n"); const iNext = L.findIndex((x) => /^ {2}NEXT: STEP 3/.test(x)); const iSheet = L.findIndex((x) => /^NEXT UP:|^WATCH-LIST:/.test(x));
               return iNext > 0 && (iSheet === -1 || iNext < iSheet) && /ON axis a/.test(L[iNext]); })());
    assert("A5 · DEFERRED axes are offered before untouched ones — an axis he chose to put off is work already decided",
      /pehle c/.test(withSession) && /deferred c pehle/.test(withSession));
    assert("A5 · the FSRS count comes from the scheduler's OWN file, and a count written for another day is labelled rather than believed",
      /FSRS: 3 card due · 1 overdue/.test(withSession) && !/ka count/.test(withSession)
      && (() => { W("cards.json", { date: "2026-09-01", total_cards: 9, due_today: 3, overdue: 1 }); const o = brief(d, NOW); W("cards.json", { date: "2026-09-04", total_cards: 9, due_today: 3, overdue: 1 }); return /2026-09-01 ka count/.test(o); })());
    assert("A5 + A6 · with a session live the machine's own lines are PARKED behind one counted line — nothing deleted, and the OUTWARD/T-mission line rides the same collapse",
      /ORGANISM: \d+ notice\(s\) parked/.test(withSession) && /organism-doctor/.test(withSession));
    assert("A4 · the DAILY EXAMINER follows the topic he actually studied, not the sheet's",
      /test today's concept \(tokenization\)/.test(withSession));

    // ⚠ DAY 2 — the session the whole rung exists for (verifier finding, 4 Sep).
    assert("A5 · a STALE-but-OPEN session STILL renders the study block. Staleness silences the PACER, never the MEMORY — his program is one topic per day, so on the morning of day 2 the session is ~20 h old, and the first draft made the whole block vanish exactly then",
      (() => { W("forge_session.json", { ...LIVE, updated_at: new Date(NOW - 22 * 3600000).toISOString(), started_at: new Date(NOW - 22 * 3600000).toISOString() });
               const o = brief(d, NOW);
               return /^ {2}NEXT: STEP 3/m.test(o) && /ORGANISM: \d+ notice/.test(o) && /LEARNING NOW: tokenization/.test(o); })());

    // ⚠ NO SHEET ROW — a failed sprintsync must not switch the rung off (verifier finding).
    assert("A5 · with NO In-Progress row on the sheet, an open session STILL produces the headline and the study block — the trigger is forge_session.json, never the sheet",
      (() => { W("forge_session.json", LIVE); W("sprint.json", { ...SPRINT, progress: { ...SPRINT.progress, current: null } });
               const o = brief(d, NOW);
               return /LEARNING NOW: tokenization/.test(o) && /^ {2}NEXT: STEP 3/m.test(o) && /sprintsync/.test(o); })());
    W("sprint.json", SPRINT);

    // NOTHING OPEN — the floor takes the headline, and the brief is otherwise what it was.
    W("forge_session.json", { ...LIVE, closed_at: new Date(NOW).toISOString() });
    const noSession = brief(d, NOW);
    assert("A4 · with NOTHING open the FLOOR takes the headline, derived from the capsules the epoch disqualified — not the sheet's In-Progress row",
      /LEARNING NOW: FLOOR tokenization \[GAME ON/.test(noSession));
    assert("A5 · with nothing open there is no study block and no ORGANISM line — the machine's lines print in place, exactly as they did before this rung",
      !/ORGANISM: \d+ notice/.test(noSession) && !/^ {2}NEXT: STEP/m.test(noSession) && !/OPEN WITH ONE FRESH MICRO-QUESTION/.test(noSession));
    assert("A4 · HIS OVERRIDE outranks the derivation (sprintsync floor writes it; this file only reads it)",
      (() => { W("sprint.json", { ...SPRINT, progress: { ...SPRINT.progress, current_floor: { concept: "embeddings", set_at: "x", by: "his word", has_capsule: true } } });
               const o = brief(d, NOW); W("sprint.json", SPRINT); return /LEARNING NOW: FLOOR embeddings \[his word/.test(o); })());
    assert("A4 · once every capsule is re-locked the floor disappears by itself and the sheet's own current takes back over — no code change",
      (() => { for (const id of ["tokenization", "embeddings"]) W(`capsules/${id}.json`, { id, num: id === "tokenization" ? "01" : "02", title: id, lockedOn: "2026-06-15", relockedOn: "2026-09-03", faultLines: [], doubts: [] });
               const o = brief(d, NOW); return !/FLOOR/.test(o) && /LEARNING NOW: 1-04 Hallucinations/.test(o); })());
  }

  // ── ROW 1400 (4) · THE SYLLABUS'S NEXT, NEVER THE SHEET'S — on a FIXTURE root (state dir + learning-layer), never his
  {
    const root = mkdtempSync(join(tmpdir(), "ls-syl-"));
    const d = join(root, "dressing-room", "state");
    const W = (n, o) => { mkdirSync(dirname(join(d, n)), { recursive: true }); writeFileSync(join(d, n), typeof o === "string" ? o : JSON.stringify(o)); };
    const SYL = join(root, "learning-layer", "SYLLABUS.json");
    const NOW = Date.parse("2026-11-26T15:00:00.000Z");
    const SYLLABUS_FIX = { part: "study_syllabus", status: "draft", closures: [{ concept: "tokenization", ruling_row: "1338", at: "2026-11-25T05:36:00.000Z" }], tracks: [],
      stages: [{ id: "m", name: "model mechanism", concepts: [
        { id: "tokenization", name: "tokenization", depth: "standard", aliases: [], list: [], questions: [] },
        { id: "inference", name: "inference and sampling", depth: "core", aliases: [], list: ["KV cache", "prefill against decode"], questions: [] },
        { id: "self_attention", name: "self-attention and the transformer", depth: "standard", aliases: [], list: ["grouped-query attention", "RMSNorm"], questions: [{ id: "q01", text: "Explain attention.", source: "x" }] },
        { id: "context_window", name: "context window", depth: "core", aliases: [], list: ["context rot"], questions: [] }] }] };
    const SPRINT = { start: "2026-08-25", sprints: [{ n: 1, theme: "Foundations" }], progress: { synced_at: new Date(NOW).toISOString(), done: [],
      current: { id: "5-41", task: "RAG evaluation", track: "concept" }, next_up: ["5-42 Re-ranking", "5-43 M2: Bank Reconciliation"], examiner_daily: true,
      current_floor: { concept: "self_attention", set_at: new Date(NOW).toISOString(), by: "syllabus order, after inference closed", has_capsule: false, in_syllabus: true } } };
    W("sprint.json", SPRINT);
    W("working_set.json", { ts: new Date(NOW).toISOString() });
    W("season.json", { season_day: 1, matches_played: 0, rows: [] });
    W("forge_session.json", { concept: "inference", step: 3, closed_at: new Date(NOW).toISOString(), started_at: new Date(NOW - 7200000).toISOString(), updated_at: new Date(NOW).toISOString(), steps_done: [0, 3], axes_done: ["a", "b"], axes_deferred: [], question_moments: {} });
    W("syllabus_coverage.jsonl", JSON.stringify({ v: 1, kind: "closed", at: new Date(NOW).toISOString(), concept: "inference", by: "his word", his_words: "band karo", covered: [1], skipped: [2] }) + "\n");
    mkdirSync(dirname(SYL), { recursive: true });
    writeFileSync(SYL, JSON.stringify(SYLLABUS_FIX));
    const o = brief(d, NOW);
    const nextUp = o.split("\n").find((x) => /^NEXT UP/.test(x)) || "";
    assert("ROW 1400 (2) · a floor moved by the syllabus close is printed with ITS reason, never as his word",
      /LEARNING NOW: FLOOR self_attention \[syllabus order, after inference closed\]/.test(o) && !/FLOOR self_attention \[his word/.test(o));
    assert("ROW 1400 (4) · with the syllabus file present the NEXT UP line is the syllabus's, and the sheet's planted next_up item is ABSENT from it",
      /^NEXT UP \(syllabus\): context window$/.test(nextUp) && !/5-42/.test(nextUp));
    assert("ROW 1400 (4) · the after-this clause names the syllabus's next concept, not the sheet's item",
      /iske baad syllabus ka: context window/.test(o) && /uske baad syllabus ka context window/.test(o) && !/uske baad sheet ka/.test(o));
    assert("ROW 1400 (4) · the open concept's LIST reaches the teacher on the brief, with its reported-question count",
      /SYLLABUS · self-attention and the transformer \[standard\] · list 0\/2 covered · 1 reported questions — 1\. grouped-query attention · 2\. RMSNorm/.test(o));
    assert("ROW 1400 (4) · CONTROL: with NO syllabus file the sheet's NEXT UP line prints exactly as before (the planted sheet line comes back)",
      (() => { writeFileSync(SYL, ""); const o2 = brief(d, NOW); return /^NEXT UP: 5-42 Re-ranking · 5-43 M2: Bank Reconciliation$/m.test(o2) && !/NEXT UP \(syllabus\)/.test(o2); })());
  }

  // ── L3 (15 Oct 2026) · OPEN, WHERE AM I, RESUME — on FIXTURE state dirs, never his ──────────────
  {
    const d = mkdtempSync(join(tmpdir(), "ls-l3-"));
    const W = (/** @type {string} */ n, /** @type {*} */ o) => { mkdirSync(dirname(join(d, n)), { recursive: true }); writeFileSync(join(d, n), typeof o === "string" ? o : JSON.stringify(o)); };
    const NOW = Date.parse("2026-10-06T03:00:00.000Z");   // 08:30 IST, 6 Oct
    const hAgo = (/** @type {number} */ h) => new Date(NOW - h * 3600000).toISOString();
    const LIVE = { concept: "tokenization", step: 3, current_axis: "b", closed_at: null, started_at: hAgo(30), updated_at: hAgo(20),
      steps_done: [0, 1, 2, 3], axes_done: ["a"], axes_deferred: ["c"], question_moments: {},
      resume_pointer: { text: "the session file's own copy", step: 3, axis: "b", at: hAgo(21) } };
    W("forge_session.json", LIVE);
    W("sprint.json", { sprints: [], progress: { synced_at: new Date(NOW).toISOString(), current: null, done: [], next_up: [] } });
    const ledger = join(d, "resume_pointer.jsonl");
    const written = JSON.stringify({ v: 1, kind: "written", id: "p-open", written_at: hAgo(21), concept: "tokenization", step: 3, axis: "b", question: "Word-level itna simple hai — toh subword kyun?", session_id: `forge:${hAgo(30)}` }) + "\n";
    W("resume_pointer.jsonl", written);
    const b = brief(d, NOW);
    const pk = b.split("\n").filter((l) => l.includes("PEHLA KAAM"));
    assert("L3 · THE ARBITER IS NO LONGER ONLY INSIDE if (cur) — with NO sheet row and an open session, brief() prints exactly ONE PEHLA KAAM line (learning-loop.txt:47)",
      pk.length === 1 && /resume/.test(pk[0]));
    assert("L3 · THE FIRST ACT IS THE POINTER — the ledger's OPEN question (never the session file's copy) and its id, then 'you are here … this much is left' from code: STEP n/11 and its name, the axis, axes done k/9 and left",
      pk.length === 1 && pk[0].includes('agla sawaal: "Word-level itna simple hai — toh subword kyun?"') && pk[0].includes("ledger pointer p-open") && !pk[0].includes("the session file's own copy")
      && /you are here: tokenization · STEP 3\/11 SAMJHAO · ON axis b · this much is left: axes done 1\/9 \(a\) · left 8 \(bcdefghi\) · deferred c/.test(pk[0]));
    assert("L3 · THE KICKOFF NEVER CONSUMES — brief() and nextup() leave the ledger byte-identical, no consumed row (SessionStart also opens engineering sessions)",
      readFileSync(ledger, "utf8") === written && (nextup(d, NOW), readFileSync(ledger, "utf8") === written) && !/"kind":"consumed"/.test(readFileSync(ledger, "utf8")));
    // an open consumed it (forge_session's verb appends that row; here a fixture of its shape) → nothing is repeated
    W("resume_pointer.jsonl", written + JSON.stringify({ v: 1, kind: "consumed", id: "c-1", of: "p-open", consumed_at: hAgo(1), by: "forge_session resume" }) + "\n");
    const after = nextup(d, NOW).winner.line;
    assert("L3 · NOTHING REPEATED — once the ledger's newest pointer is consumed, the first act re-serves neither it nor the session file's copy, and says to open with a fresh micro-question",
      !after.includes("agla sawaal") && /ledger pointer p-open was consumed 2026-10-06/.test(after) && /fresh micro-question/.test(after));
    W("resume_pointer.jsonl", "");
    assert("L3 · A SESSION OLDER THAN THE LEDGER — with no ledger row for the concept, the session file's own pointer still answers (row 69 (3) unchanged)",
      nextup(d, NOW).winner.line.includes('agla sawaal: "the session file\'s own copy"'));
    // IST, never UTC
    const IST0010 = Date.parse("2026-10-05T18:40:00.000Z");   // 00:10 IST on 6 Oct; the UTC slice says 5 Oct
    const rowsB = [{ kind: "briefed", job: "diary", ts: "2026-10-05T18:20:00.000Z" }, { kind: "briefed", job: "night_coach", ts: "2026-10-05T18:40:00.000Z" }];
    assert("L3 · EVERY DAY KEY IS IST — briefedOn keys 18:40Z (00:10 IST) to 6 Oct and 18:20Z (23:50 IST) to 5 Oct; the old UTC slice called both 5 Oct",
      [...briefedOn(rowsB, "2026-10-06")].join() === "night_coach" && [...briefedOn(rowsB, "2026-10-05")].join() === "diary");
    W("cards.json", { date: "2026-10-06", total_cards: 9, due_today: 2, overdue: 0 });
    assert("L3 · EVERY DAY KEY IS IST — at 00:10 IST the FSRS count written for that IST day reads as TODAY's, not stale (the UTC key called it yesterday's)",
      (() => { const f = fsrsDue(d, IST0010); return !!f && f.stale === false && f.due === 2; })());
    // fate 07 — the sheet's own label is READ
    const SP3 = { sprints: [], progress: { synced_at: new Date(NOW).toISOString(), current: { id: "1-04", task: "Hallucinations", track: "concept" }, next_up: [],
      done: ["1-01 Embeddings (finish)", "1-02 Inference & sampling", "1-00 Python warmup"], done_pre_restart: ["1-01 Embeddings (finish)", "1-02 Inference & sampling"] } };
    W("sprint.json", SP3);
    W("forge_session.json", { ...LIVE, closed_at: hAgo(2) });
    W("capsules/embeddings.json", { id: "embeddings", num: "02", title: "Embeddings", lockedOn: "2026-06-21", faultLines: [], doubts: [] });
    const g = gather(d, NOW);
    const nf = nextup(d, NOW);
    assert("L3 · fate 07 — the sheet's OWN done_pre_restart is READ: gather() serves learned = done minus the label, his `done` untouched beside it",
      JSON.stringify(g.learned) === JSON.stringify(["1-00 Python warmup"]) && g.pre_restart.length === 2 && g.sprint.progress.done.length === 3);
    assert("L3 · fate 07 — A PRE-RESTART TOPIC IS NEVER SERVED AS LEARNED: the first act is the FLOOR (A4's law), not the sheet's next topic, and it names the label's topics as NOT learned",
      nf.winner.name === "floor" && /FLOOR embeddings/.test(nf.winner.line) && /seekhe hue NAHI/.test(nf.winner.line) && nf.winner.line.includes("1-01 Embeddings (finish)")
      && nf.contenders.some((/** @type {*} */ c) => c.name === "sprint"));
    // re-locked YESTERDAY, so its R1 (3 days on) is not yet due and no Re-Jirah round outranks the sheet's rung
    W("capsules/embeddings.json", { id: "embeddings", num: "02", title: "Embeddings", lockedOn: "2026-06-21", relockedOn: "2026-10-05", faultLines: [], doubts: [] });
    assert("L3 · fate 07 — with no floor (the capsule re-locked), the sheet's own label still reaches the plan-of-record line — never silently stepped past",
      (() => { const n = nextup(d, NOW); return n.winner.name === "sprint" && /plan of record/.test(n.winner.line) && /seekhe hue NAHI/.test(n.winner.line); })());
    // THE WIRE — what this file imports from the ledger, and the UTC keys that are gone (comments stripped)
    const srcL3 = readFileSync(fileURLToPath(import.meta.url), "utf8").replace(/\r\n/g, "\n");
    const code = srcL3.slice(0, srcL3.indexOf("function selftest()")).split("\n").map((l) => l.replace(/\/\/.*$/, "")).join("\n");
    const imp = (code.match(/import \{[^}]*\} from "\.\/resume_pointer\.mjs";/) || [""])[0];
    assert("L3 · WIRE — learnstate imports only the pointer ledger's READ verbs (`latest`, istDay — and since L6 `readRows`), never `consume`; no UTC day key (toISOString().slice(0, 10)) is left in its code",
      /latest as latestPointer/.test(imp) && !/consume/.test(imp) && !/toISOString\(\)\.slice\(0, ?10\)/.test(code) && !/String\(r\.ts \|\| ""\)\.slice\(0, ?10\)/.test(code));
  }
  // ── L6 (15 Oct 2026) · THE MORNING REFLECTS THE DAY BEFORE — on FIXTURE state dirs, never his ──────────────
  {
    const d = mkdtempSync(join(tmpdir(), "ls-l6-"));
    const W = (/** @type {string} */ n, /** @type {*} */ o) => { mkdirSync(dirname(join(d, n)), { recursive: true }); writeFileSync(join(d, n), typeof o === "string" ? o : JSON.stringify(o)); };
    const WL = (/** @type {string} */ n, /** @type {any[]} */ rows) => W(n, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
    const NOW6 = Date.parse("2026-10-06T04:00:00.000Z");   // 09:30 IST, 6 Oct
    const srcL6 = readFileSync(fileURLToPath(import.meta.url), "utf8");
    // his study, on the CLASS D sources: 3 Oct and 4 Oct on the voice queue, and 00:30 IST TODAY (18:30Z+ the day before in UTC)
    WL("gaffer_grade_queue.jsonl", [{ v: 2, kind: "capture", id: "q1", ts: "2026-10-03T09:00:00.000Z" }, { v: 2, kind: "capture", id: "q2", ts: "2026-10-04T10:00:00.000Z" },
      { v: 2, kind: "capture", id: "q3", ts: "2026-10-05T19:00:00.000Z" }]);
    // the stop on 4 Oct (a pointer), consumed by this morning's open
    WL("resume_pointer.jsonl", [{ v: 1, kind: "written", id: "p-l6", written_at: "2026-10-04T12:00:00.000Z", concept: "embeddings", step: 3, axis: "g", question: "Q-L6 never re-served", session_id: null },
      { v: 1, kind: "consumed", id: "c-l6", of: "p-l6", consumed_at: "2026-10-06T03:30:00.000Z", by: "forge_session resume" }]);
    W("forge_session.json", { concept: "embeddings", step: 3, current_axis: "g", closed_at: null, started_at: "2026-10-04T08:00:00.000Z", updated_at: "2026-10-06T03:30:00.000Z",
      steps_done: [0, 1, 2, 3], axes_done: ["a"], axes_deferred: [], question_moments: {}, resumes: [{ at: "2026-10-06T03:30:00.000Z" }] });
    // capsules are INPUTS (mirror's copies): one locked before GAME ON, one after, one re-locked after
    W("capsules/tokenization.json", { id: "tokenization", num: "01", title: "Tokenization", lockedOn: "2026-06-15", faultLines: [], doubts: [] });
    W("capsules/fresh.json", { id: "fresh", num: "05", title: "Fresh", lockedOn: "2026-09-05", faultLines: [], doubts: [] });
    W("capsules/again.json", { id: "again", num: "03", title: "Again", lockedOn: "2026-06-15", relockedOn: "2026-09-04", faultLines: [], doubts: [] });
    // a map written by older code: it lists the withdrawn capsule and a name with no capsule at all
    W("capsule_map.json", { generated_at: new Date(NOW6 - 3600000).toISOString(),
      rejirah_overdue: [{ concept: "tokenization", overdue_days: 110, rounds_done: 0 }, { concept: "fresh", overdue_days: 28, rounds_done: 0 },
        { concept: "ghost", overdue_days: 20, rounds_done: 0 }, { concept: "again", overdue_days: 10, rounds_done: 0 }],
      line: "tokenization ka Re-Jirah 110 din overdue hai — aur uske 9 strike sawaal already likhe rakhe hain." });

    assert("L6 · the header says it in the organism's own words: SOLE WRITER of dressing-room/state/brief_log.jsonl, APPEND-ONLY, one row per brief HIS session printed",
      (() => { const head = srcL6.slice(0, srcL6.indexOf("\nimport ")); return head.includes("SOLE WRITER of dressing-room/state/brief_log.jsonl") && head.includes("APPEND-ONLY") && head.includes("HIS session printed"); })());
    assert("L6 · THE DAY BEFORE IS KEYED IN IST, NEVER UTC — 19:00Z on 5 Oct is 00:30 IST TODAY, so the carried day is 4 Oct (the UTC slice would carry 5 Oct, a day he never studied)",
      carriedDay(d, NOW6) === "2026-10-04" && "2026-10-05T19:00:00.000Z".slice(0, 10) === "2026-10-05");
    assert("L6 · CLASS D, the witness's own reading — forge_sessions, the grade queue, the pointer ledger (written AND consumed) and the OPEN session (updated_at + resumes[].at, not once it carries ended_at) each key a study day; brief_log never does",
      (() => { const one = (/** @type {Record<string, any>} */ files) => { const x = mkdtempSync(join(tmpdir(), "ls-l6d-")); for (const [n, v] of Object.entries(files)) writeFileSync(join(x, n), typeof v === "string" ? v : v.map((/** @type {*} */ r) => JSON.stringify(r)).join("\n") + "\n"); return carriedDay(x, NOW6); };
               return one({ "forge_sessions.jsonl": [{ concept: "x", updated_at: "2026-10-02T09:00:00.000Z" }] }) === "2026-10-02"
                 && one({ "resume_pointer.jsonl": [{ v: 1, kind: "consumed", id: "c", of: "p", consumed_at: "2026-10-01T09:00:00.000Z", by: "t" }] }) === "2026-10-01"
                 && one({ "forge_session.json": JSON.stringify({ concept: "x", updated_at: "2026-10-06T03:00:00.000Z", resumes: [{ at: "2026-09-30T09:00:00.000Z" }] }) }) === "2026-09-30"
                 && one({ "forge_session.json": JSON.stringify({ concept: "x", updated_at: "2026-09-29T09:00:00.000Z", ended_at: "2026-09-29T10:00:00.000Z" }) }) === null
                 && one({ "brief_log.jsonl": [{ v: 1, id: "b", ts: "2026-10-03T09:00:00.000Z" }] }) === null; })());

    const b6 = brief(d, NOW6);
    const lines6 = b6.split("\n");
    const iCarry = lines6.findIndex((l) => l.startsWith(`${CARRY_TAG} 2026-10-04 `));
    assert("L6 · brief() WRITES NOTHING — the suite calls it on fixture dirs, so the row is never written from here (no brief_log.jsonl after it)",
      !existsSync(join(d, BRIEF_LOG)));
    assert("L6 · the brief PRINTS the carried day in its FIRST lines — the IST day and what it left open, the pointer named by id and place; a consumed pointer's question is never re-served (L3)",
      iCarry === 1 && /embeddings \(STEP 3 · axis g\) pe ruka — pointer p-l6, open ne consume kiya 2026-10-06/.test(lines6[iCarry]) && !b6.includes("Q-L6"));
    const rj6 = lines6.find((l) => l.startsWith("RE-JIRAH OVERDUE")) || "";
    assert("L6 · fate 18 — the overdue line names ONLY epoch-passed concepts: a capsule locked before GAME ON, and a name with no capsule, are never named due; a post-epoch lock and a re-lock after GAME ON pass",
      /^RE-JIRAH OVERDUE \(2\): fresh 28d · again 10d/.test(rj6) && !/tokenization \d+d/.test(b6) && !/ghost \d+d/.test(b6));
    assert("L6 · fate 18 — the owner's sentence names the map's worst concept, so it rides only when THAT concept passed; the withheld names are SAID once, never silently dropped",
      !b6.includes("tokenization ka Re-Jirah") && /GAME ON gate: tokenization · ghost roke/.test(rj6) && lines6.filter((l) => l.startsWith("RE-JIRAH")).length === 1);
    assert("L6 · fate 18 — what the brief SERVED is {concept, anchored_at, epoch_ok}: every entry epoch_ok, anchored at or after the registry's GAME ON (a re-lock anchors on the re-lock)",
      (() => { const f = briefFactsOf(d, NOW6).rejirah; const ep = gameOnEpoch();
               return f.length === 2 && f.every((r) => r.epoch_ok === true && Date.parse(String(r.anchored_at)) >= ep)
                 && (f.find((r) => r.concept === "again") || {}).anchored_at === "2026-09-04T00:00:00.000Z" && (f.find((r) => r.concept === "fresh") || {}).anchored_at === "2026-09-05T00:00:00.000Z"; })());
    assert("L6 · fate 18 — the ungated reader is kept FROZEN beside it (L9), referenced by no caller; on the same map it would have served the withdrawn capsule first",
      (() => { const body = srcL6.slice(0, srcL6.indexOf("function selftest()")); return (body.match(/rejirahDueLineLegacy/g) || []).length === 1; })()
      && /^RE-JIRAH OVERDUE \(4\): tokenization 110d/.test(rejirahDueLineLegacy(d, NOW6) || ""));

    // ASKED-FIRST (C22), on L1's two row kinds
    const nFail = { v: 1, kind: "compiled", id: "n-fail", ts: "2026-10-04T13:00:00.000Z", concept: "embeddings", axis: "g", compiler: "notes_compiler@1", sources: ["arc:1"] };
    const gFail = { v: 1, kind: "cold_gate", id: "g-fail", of: "n-fail", ts: "2026-10-04T14:00:00.000Z", verdict: "fail", traps_named: ["t-fail"], reader: "role:cold_reader" };
    // unit mtrap: a compiled row carries its note; the passing one stands at the bar of three counted traps (gateableOf)
    const trapsOf = (k, from = "crack") => Array.from({ length: k }, (_, i) => ({ from, bait: `bait ${i + 1}`, truth: "t", id: `T${i + 1}` }));
    const nPass = { v: 1, kind: "compiled", id: "n-pass", ts: "2026-10-05T09:00:00.000Z", concept: "fresh", axis: "c", compiler: "notes_compiler@1", sources: ["arc:2"], note: { traps: trapsOf(3) } };
    const gPass = { v: 1, kind: "cold_gate", id: "g-pass", of: "n-pass", ts: "2026-10-05T10:00:00.000Z", verdict: "pass", traps_named: ["cosine ko distance samajh liya"], reader: "role:cold_reader" };
    assert("L6 · C22 — no compiled note at all: ONE named absence, printed once",
      typeof (/** @type {*} */ (askedFirst(d, NOW6))).absent === "string" && lines6.filter((l) => l.includes("ASKED-FIRST (C22) — koi strike nahi:")).length === 1);
    WL("compiled_notes.jsonl", [nFail, gFail]);
    assert("L6 · C22 — NEVER A STRIKE FROM A FAILED NOTE: a note whose latest cold gate FAILED serves nothing, and the brief names the absence once",
      (() => { const a = /** @type {*} */ (askedFirst(d, NOW6)); return !a.note_id && !a.strike && typeof a.absent === "string" && /PASSED/.test(a.absent)
                 && brief(d, NOW6).split("\n").filter((l) => l.includes("ASKED-FIRST (C22)")).length === 1; })());
    WL("compiled_notes.jsonl", [nFail, gFail, nPass, gPass]);
    assert("L6 · C22 — ASKED FIRST: a note whose latest cold gate PASSED with its traps named, at or before the brief, serves ONE cold strike built from a named trap, the note shut",
      (() => { const a = /** @type {*} */ (askedFirst(d, NOW6)); const o = brief(d, NOW6);
               return a.note_id === "n-pass" && typeof a.strike === "string" && a.strike.includes("cosine ko distance samajh liya") && o.includes(`ASKED-FIRST (C22) — cold, note n-pass band: ${a.strike}`)
                 && o.split("\n").filter((l) => l.includes("ASKED-FIRST (C22)")).length === 1; })());
    WL("compiled_notes.jsonl", [nFail, gFail, nPass, gPass, { ...gFail, id: "g-late", of: "n-pass", ts: "2026-10-06T05:00:00.000Z" }]);
    assert("L6 · C22 — a gate written AFTER the brief does not count: the gates are read as they stood at the brief's ts",
      (/** @type {*} */ (askedFirst(d, NOW6))).note_id === "n-pass");
    WL("compiled_notes.jsonl", [nFail, gFail, nPass, gPass, { ...gFail, id: "g-refail", of: "n-pass", ts: "2026-10-05T12:00:00.000Z" }]);
    assert("L6 · C22 — the LATEST gate decides: a note that passed and then FAILED its next cold gate serves nothing",
      !(/** @type {*} */ (askedFirst(d, NOW6))).note_id);
    WL("compiled_notes.jsonl", [nFail, gFail, nPass, gPass, { ...nPass, id: "n-new", ts: "2026-10-05T11:00:00.000Z", supersedes: "n-pass" }]);
    assert("L6 · C22 — a SUPERSEDED note leaves the set (a recompile appended its successor), and the ungated successor never serves",
      !(/** @type {*} */ (askedFirst(d, NOW6))).note_id);
    // unit mtrap (mtrap-9 b) — the absence line COUNTS: five thin notes with kept FAIL rows (superseded ones included) read not gateable 5
    {
      const thin = (i, extra = {}) => ({ ...nFail, id: `n-thin-${i}`, ts: `2026-10-0${i}T09:00:00.000Z`, concept: "tokenization", axis: i < 4 ? "a" : "b", note: { traps: trapsOf(2) }, ...extra });
      const fails = [1, 2, 3, 4, 5].map((i) => ({ ...gFail, id: `g-thin-${i}`, of: `n-thin-${i}`, ts: `2026-10-0${i}T10:00:00.000Z` }));
      const five = [thin(1), thin(2, { supersedes: "n-thin-1" }), thin(3, { supersedes: "n-thin-2" }), thin(4), thin(5)];
      WL("compiled_notes.jsonl", [...five, ...fails]);
      const a5 = /** @type {*} */ (askedFirst(d, NOW6)), o5 = brief(d, NOW6);
      assert("L6 · C22 · MTRAP — five 2-trap notes with kept FAIL rows (two of them superseded) serve nothing and are COUNTED not gateable 5, fail 0, beside their kept rows",
        !a5.note_id && /pass 0 · fail 0 · not gateable 5 \(fewer than 3 traps, kept fail rows beside them\) · ungated 0/.test(a5.absent) && o5.split("\n").filter((l) => l.includes("not gateable 5")).length === 1);
      const fat = [6, 7, 8].map((i) => ({ ...nFail, id: `n-fat-${i}`, ts: `2026-10-0${i - 3}T11:00:00.000Z`, concept: "embeddings", axis: "c", note: { traps: trapsOf(5) } }));
      WL("compiled_notes.jsonl", [...fat, ...fat.map((n, i) => ({ ...gFail, id: `g-fat-${i}`, of: n.id, ts: `2026-10-0${i + 3}T12:00:00.000Z` }))]);
      assert("L6 · C22 · MTRAP — TRUE fails stand: three five-trap notes with kept FAIL rows count fail 3, not gateable 0",
        /pass 0 · fail 3 · not gateable 0 .* · ungated 0/.test((/** @type {*} */ (askedFirst(d, NOW6))).absent || ""));
      WL("compiled_notes.jsonl", [{ ...nPass, note: { traps: [...trapsOf(2), { from: "capsule", bait: "capsule bait", truth: "t", id: "T3" }] } }, gPass]);
      assert("L6 · C22 · MTRAP — a pass on a note whose third trap is a CAPSULE trap (mtrap-3 b) serves no strike and counts not gateable 1",
        (() => { const a = /** @type {*} */ (askedFirst(d, NOW6)); return !a.note_id && /not gateable 1 /.test(a.absent || ""); })());
    }
    WL("compiled_notes.jsonl", [nFail, gFail, nPass, gPass]);

    // THE RECORDED BRIEF
    const printed1 = "STATE · fixture line one\n" + brief(d, NOW6);
    const r1 = /** @type {*} */ (recordBrief(printed1, { dir: d, now: NOW6 }));
    const bytes1 = existsSync(join(d, BRIEF_LOG)) ? readFileSync(join(d, BRIEF_LOG), "utf8") : "";
    const r2 = /** @type {*} */ (recordBrief("STATE · fixture line one\n" + brief(d, NOW6 + 3600000), { dir: d, now: NOW6 + 3600000 }));
    const bytes2 = existsSync(join(d, BRIEF_LOG)) ? readFileSync(join(d, BRIEF_LOG), "utf8") : "";
    const rows2 = bytes2.split("\n").filter(Boolean).map((l) => JSON.parse(l));
    assert("L6 · fate 18 — THE RECORDED BRIEF IS APPEND-ONLY (the witness's CLASS A): the ledger before is a byte-prefix of the ledger after; two briefs, two rows, two ids; the first row byte-identical; no ts earlier than the row above",
      r1.ok === true && r2.ok === true && bytes1.length > 0 && bytes2.startsWith(bytes1) && rows2.length === 2 && rows2[0].id !== rows2[1].id
      && JSON.stringify(rows2[0]) === JSON.stringify(r1.row) && Date.parse(rows2[1].ts) >= Date.parse(rows2[0].ts));
    const row = r1.row || {};
    assert("L6 · fate 18 — the row is {v:1, id, ts, day, pehla_kaam, carries_from, carry, rejirah[], asked_first}: the ONE first act VERBATIM off the printed text, the carried IST day and what it left open, every Re-Jirah it served (epoch-gated), the asked-first strike",
      row.v === 1 && /^b-/.test(String(row.id)) && row.ts === new Date(NOW6).toISOString() && row.day === "2026-10-06"
      && typeof row.pehla_kaam === "string" && row.pehla_kaam.length > 0 && printed1.includes(`${PK_TAG}${row.pehla_kaam}  (kyun: `) && /^resume 'embeddings' @ STEP 3/.test(row.pehla_kaam)
      && row.carries_from === "2026-10-04" && typeof row.carry === "string" && row.carry.includes("p-l6") && !row.carry.includes("Q-L6")
      && Array.isArray(row.rejirah) && row.rejirah.map((/** @type {*} */ r) => r.concept).join() === "fresh,again" && row.rejirah.every((/** @type {*} */ r) => r.epoch_ok === true)
      && row.asked_first && row.asked_first.note_id === "n-pass" && typeof row.asked_first.strike === "string");
    const before3 = readFileSync(join(d, BRIEF_LOG), "utf8");
    const r3 = /** @type {*} */ (recordBrief(printed1, { dir: d, now: NOW6 - 3600000 }));
    assert("L6 · fate 18 — NEVER A BACK-FILL: a brief dated before the last recorded row is refused (ok:false, with its why) and the ledger stays byte-identical",
      r3.ok === false && /back-fill/.test(String(r3.why)) && readFileSync(join(d, BRIEF_LOG), "utf8") === before3);
    W("blocker", "a file, not a directory");
    const r4 = /** @type {*} */ (recordBrief(printed1, { dir: join(d, "blocker"), now: NOW6 }));
    assert("L6 · fate 18 — A FAILED APPEND IS ok:false with its why — never a bare catch that reports ok (the brief has already printed; main says it on stderr)",
      r4.ok === false && /append failed/.test(String(r4.why)) && !("row" in r4));
    const savedOrgan = process.env.ARSENAL_ORGAN;
    process.env.ARSENAL_ORGAN = "1";
    const r5 = /** @type {*} */ (recordBrief(printed1, { dir: d, now: NOW6 + 7200000 }));
    if (savedOrgan === undefined) delete process.env.ARSENAL_ORGAN; else process.env.ARSENAL_ORGAN = savedOrgan;
    assert("L6 · fate 18 — recordBriefed's guard holds: an organ session (ARSENAL_ORGAN=1) records nothing",
      r5.ok === false && /organ/.test(String(r5.why)) && readFileSync(join(d, BRIEF_LOG), "utf8") === before3);
    const trimmed = printed1.split("\n").filter((l) => !l.startsWith(CARRY_TAG) && !l.includes("ASKED-FIRST (C22)") && !l.startsWith("RE-JIRAH")).join("\n");
    const rt = briefRowOf(trimmed, briefFactsOf(d, NOW6), NOW6, "b-trim");
    assert("L6 · fate 18 — OFF THE FINAL TEXT: a line that never reached the printed brief is never recorded as carried or served (the carried day, the Re-Jirah names, the strike) — and a concept id that is also a plain word ('fresh' in the first act's 'fresh micro-question') is never mistaken for a served name",
      rt.carries_from === null && rt.carry === null && rt.rejirah.length === 0 && /did not reach/.test(String((/** @type {*} */ (rt.asked_first)).absent)) && rt.pehla_kaam === row.pehla_kaam
      && /fresh micro-question/.test(trimmed));
    // the first act that IS a Re-Jirah round is served too, and gated
    const e = mkdtempSync(join(tmpdir(), "ls-l6e-"));
    mkdirSync(join(e, "capsules"), { recursive: true });
    writeFileSync(join(e, "capsules", "fresh.json"), JSON.stringify({ id: "fresh", num: "05", title: "Fresh", lockedOn: "2026-09-05", faultLines: [], doubts: [] }));
    const pe = brief(e, NOW6), re6 = briefRowOf(pe, briefFactsOf(e, NOW6), NOW6, "b-e");
    assert("L6 · fate 18 — a Re-Jirah the FIRST ACT serves is recorded too, epoch-gated: the arbiter's rejirah-due winner names its concept and the row carries it; no earlier study day ⇒ carries_from null",
      /▶ PEHLA KAAM: Re-Jirah R1 'fresh'/.test(pe) && re6.rejirah.length === 1 && re6.rejirah[0].concept === "fresh" && re6.rejirah[0].epoch_ok === true
      && re6.carries_from === null && pe.includes(`${CARRY_TAG}: koi pichhla study din`));
    assert("L6 · fate 18 — the writer is called from main() ONLY, after the print, off the printed text — never from brief() (which the suite calls on fixture dirs)",
      (() => { const code = srcL6.split("\n").map((l) => l.replace(/\/\/.*$/, "")).join("\n");
               const bb = code.slice(code.indexOf("function brief("), code.indexOf("function selftest()")), mm = code.slice(code.search(/^async function main\(\) \{$/m));
               return !/recordBrief\(/.test(bb) && /console\.log\(p\);\s*printed = p;/.test(mm) && /recordBrief\(printed, \{ now \}\)/.test(mm)
                 && mm.indexOf("recordBrief(printed") > mm.lastIndexOf("console.log(p)"); })());
  }

  // ── BORN (forks row 787 (1), 17 Oct 2026) — brief_log.jsonl's birth at its landing, planted both ways ──
  {
    const bd = mkdtempSync(join(tmpdir(), "ls-born-"));
    const b1 = bornBriefLog({ dir: bd });
    assert("BORN — an absent brief_log.jsonl is born EMPTY (0 bytes) by its sole writer, and says so",
      b1.ok && b1.op === "born" && existsSync(join(bd, BRIEF_LOG)) && readFileSync(join(bd, BRIEF_LOG)).length === 0);
    const b2 = bornBriefLog({ dir: bd });
    assert("BORN — a brief_log.jsonl that exists (even empty) is REFUSED, never written again",
      b2.ok === false && b2.op === "refused" && /already exists/.test(String(b2.why)) && readFileSync(join(bd, BRIEF_LOG)).length === 0);
    const br = mkdtempSync(join(tmpdir(), "ls-born-rows-")), rowText = JSON.stringify({ v: 1, id: "b-x", ts: "2026-10-06T03:00:00.000Z" }) + "\n";
    writeFileSync(join(br, BRIEF_LOG), rowText);
    const b3 = bornBriefLog({ dir: br });
    assert("BORN NEVER TRUNCATES — a brief_log.jsonl holding a row is refused and stays byte-identical",
      b3.ok === false && b3.op === "refused" && readFileSync(join(br, BRIEF_LOG), "utf8") === rowText);
  }

  const passed = checks.every(Boolean);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "brief").toLowerCase();
  if (mode === "selftest") { process.exit(selftest() ? 0 : 1); }
  // SELF-INJECTION GUARD (audit 30 Jul 2026 — same scar as hooks/afferent-post.mjs
  // and forge_session.mjs). This runs as the SessionStart hook, so its stdout is
  // injected into the session. Every headless `claude -p` the organism spawns
  // (brain, nightshift, dmn, cortex, council, selfknowledge, talk) runs inside this
  // project, inherits .claude/settings.json and fires SessionStart — so the
  // captain's second-person study brief ("do NOT ask him to re-explain where he
  // is") was being prepended to organ prompts that are asked for STRICT JSON.
  // `json` and `selftest` stay reachable: they are read paths, not injection paths.
  if (process.env.ARSENAL_ORGAN === "1" && mode !== "json") return;
  if (mode === "json") { console.log(JSON.stringify(gather(), null, 2)); return; }
  if (mode === "born") {   // forks row 787 (1) — the ledger's birth at its landing; never from the hook, never from brief()
    const b = bornBriefLog();
    if (b.ok) console.log(`learnstate: born ${b.path} (0 bytes) — add it by pathspec in the landing commit (forks row 787 (1))`);
    else { console.error(`learnstate: born REFUSED — ${b.why} (${b.path})`); process.exitCode = 1; }
    return;
  }
  if (mode === "nextup") {
    // P7.B — the full arbitration, on demand: winner, why, and every loser named.
    const nu = nextup(STATE, Date.now());
    console.log(`\n== NEXT UP — THE ARBITER (deterministic · precedence stated in code) ==\n`);
    console.log(`  ▶ ${nu.winner.line}`);
    console.log(`    kyun: ${nu.winner.why}`);
    if (nu.contenders.length) {
      console.log(`\n  haare hue daave (order = precedence):`);
      for (const c of nu.contenders) console.log(`   · ${c.name}: ${c.line}`);
    }
    console.log(`\n  (watchman kabhi is list mein nahi aata — organ repair machine ka kaam hai, tumhara nahi.)\n`);
    return;
  }
  // AFTER the organ guard, never before — an organ prompt must never carry his memory.
  // AUDIT #107: the assembler decides each part's share of an explicit budget and
  // prints a manifest footer naming anything missing or trimmed. If it is unavailable
  // or throws, we fall back to the exact pre-#107 call — a hook must never be the
  // thing that breaks SessionStart.
  // THE STATE LINE (overhaul §7.1, 18 Aug 2026) — line ONE of every SessionStart and
  // PreCompact brief: pushed · daemons · suite · sitting · next · needs-you. Read
  // from state.mjs (deterministic, zero-LLM, read-only), fail-silent — a hook must
  // never be the thing that breaks SessionStart, and a missing line is not a wrong one.
  const stateLine = await (async () => { try { const { liveState } = await import("./state.mjs"); return (await liveState()).line; } catch { return null; } })();
  const withState = (t) => (stateLine ? stateLine + "\n" : "") + t;
  // L6 (15 Oct 2026) — ONE instant for the brief and its recorded row: the row's ts is the moment this brief was built, so
  // "the day before" is read as the ledgers stood at it (before L6 every assemble and the fallback each read their own clock).
  const now = Date.now();
  let printed = null;
  try {
    const { assemble, CEILING } = await import("./context_manifest.mjs");
    let out = await assemble({ dir: STATE, now });
    // THE BYTE GUARD (18 Aug 2026, OVERHAUL Block 4 close). The DoD is measured on the
    // WHOLE printed brief — `learnstate.mjs brief | wc -c` < 6,000 — but the manifest's
    // 5,300-char ceiling was DERIVED from two measured, LIVE numbers: the state line
    // (365 B that morning) and the multibyte inflation (268 B). Both move: on 18 Aug the
    // state line grew (dirty 14 · 13 cards) and the whole landed at 6,004 bytes — a
    // reserve tuned once is a budget, and L8 says guards, not budgets. So: measure the
    // bytes of what will actually print; if the whole is over, ask the assembler ONCE
    // for exactly the room the overrun took (+64 for the cut region's own multibyte
    // run). The footer names the ceiling it assembled to, so nothing here is silent.
    if (out && typeof out.text === "string" && out.text) {
      const over = Buffer.byteLength(withState(out.text), "utf8") - (BRIEF_BYTES_BOUND - 1);
      if (over > 0) {
        try { const tighter = await assemble({ dir: STATE, now, ceiling: Math.max(1000, CEILING - over - 64) }); if (tighter && typeof tighter.text === "string" && tighter.text) out = tighter; } catch { /* keep the first */ }
      }
    }
    if (out && typeof out.text === "string" && out.text) { const p = withState(out.text); console.log(p); printed = p; recordBriefed(out.text); }
  } catch { /* fall through to the frozen path */ }
  if (printed === null) {
    const text = brief(STATE, now, await loadMemory(), loadTeachingCard());
    const p = withState(text);
    console.log(p);
    printed = p;
    recordBriefed(text);
  }
  // L6 · fate 18 — THE RECORDED BRIEF: AFTER the print, off the FINAL text that printed, from here and nowhere else. A
  // failed append is SAID on stderr (stdout is the session's context) and the brief has already printed — never a bare
  // catch that reports ok.
  const rec = recordBrief(printed, { now });
  if (!rec.ok && "why" in rec) console.error(`learnstate: brief_log NOT recorded — ${rec.why}`);   // `in` narrows the union under checkJs (gates types, baseline 296)
}
// THE GATE (overhaul §5.2 "briefed", 18 Aug 2026). A SessionStart brief that a
// session actually printed is a place the brain's night work reached — the night
// coach line, the diary line and the round read ride it into the session that
// teaches him. Stamped AFTER the print, off the FINAL text (post-manifest budget:
// a line the assembler trimmed away never reached anyone), through the OWNER
// (brain.mjs recordConsumption — brain stays the sole writer of consumption.jsonl),
// fail-silent, and only on this main path — never from brief() itself, which the
// suite calls against fixture dirs. The diary's starvation line ("page nahi
// likhi") is the brain explaining an ABSENCE, not the page reaching him.
// ── R-05 + N-04 (W0-C, 2 Sep 2026) — "BRIEFED" MUST MEAN *HIS* SESSION ──────
// This stamp is what `reached_him` is computed from, and it was firing for EVERY
// session that rendered the brief — every headless `claude -p` the organism spawns,
// every SDK agent, and this audit campaign's own 25 subagents. Counted on his live
// consumption.jsonl the day this landed: **863 of 924 rows are `briefed`**, which is
// why "a lane reached him" and "a machine printed the brief" had become the same
// measurement. A number that cannot tell those apart is worse than no number: it
// closes gate C on lanes he has never once seen.
// TWO GUARDS, and they are deliberately different in kind:
//  1. ARSENAL_ORGAN=1 — the organism's own convention for a headless child. Every
//     organ spawn sets it, so the organism can no longer certify itself.
//  2. ONE ROW PER LANE PER DAY. This is the half that holds REGARDLESS OF SOURCE: 25
//     subagents on one day now leave one row, not twenty-five, and a re-opened session
//     does not re-certify a lane it already certified this morning.
// ⚠ THE RESIDUAL IS NAMED, NOT PAPERED OVER: an SDK or fleet agent that never sets
// ARSENAL_ORGAN still passes guard 1. Guard 2 caps what that can inflate to one row a
// day per lane, and `by` carries the provenance so a reader can tell what stamped it —
// but a machine session that renders his brief on a day he never opened one is still
// counted. Closing that needs a mark only HIS interactive surface can make; it is not
// invented here.
function recordBriefed(text) {
  try {
    if (process.env.ARSENAL_ORGAN === "1") return;        // an organ certifying itself is not evidence
    const t = String(text || "");
    const day = dayKeyIST(Date.now());   // L3 — the IST day (learning-loop.txt:47: the UTC key rolled at 05:30 IST and doubled early-morning rows)
    // read-only; brain.mjs stays the sole writer of consumption.jsonl
    let already = new Set();
    try {
      already = briefedOn(consumptionRows(), day);
    } catch { /* an unreadable ledger must not stop the stamp — it degrades to the old behaviour */ }
    const once = (evt) => { const k = evt.job || evt.lane; if (k && already.has(k)) return; if (k) already.add(k); recordConsumption({ ...evt, by: "learnstate brief (SessionStart · interactive)" }); };
    if (t.includes("🌙 NIGHT COACH")) once({ job: "night_coach", kind: "briefed" });
    if (t.includes("📔 BRAIN DIARY") && !t.includes("page nahi likhi")) once({ job: "diary", kind: "briefed" });
    if (t.includes("🧠 ROUND READ")) once({ lane: "ns_round_read", kind: "briefed" });
    // Block 2 §7.2 (18 Aug 2026): the SESSION INTENTS block is where the intent_digest
    // job's labels reach a session — its GATE (C) rides this stamp. Squeezed out = not consumed.
    if (t.includes("--- SESSION INTENTS")) once({ job: "intent_digest", kind: "briefed" });
  } catch { /* bookkeeping must never cost the brief */ }
}
// NOT `await main()` here, deliberately (18 Aug 2026, Block 1). It was tried for the
// one-process hook dispatcher and DEADLOCKED: brief() → assemble() → context_manifest
// dynamically imports ./learnstate.mjs (:281) while this module is still suspended in
// its own top-level await → "unsettled top-level await", exit 13, ZERO bytes of brief.
// The dispatcher instead imports this file as a library and awaits `hookMain` below
// (turn_hook.mjs contract 3, the `call` shape) — same main, same stdout, no cycle.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
// #14 — loadTeachingCard is exported so `get_context` can serve the SAME card
// from the SAME parser (see the note above it). CARD_MAX rides along so a
// consumer can state the cap it is honouring instead of inventing its own.
// hookMain — the CLI's own main, exported for scripts/turn_hook.mjs (SessionStart in
// ONE process): it reads process.argv[2] exactly as the CLI does, so the dispatcher
// shims the verb and awaits the print. Nothing else should call it.
export { brief, gather, loadTeachingCard, loadMemory, CARD_MAX, main as hookMain };
