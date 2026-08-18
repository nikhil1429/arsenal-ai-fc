#!/usr/bin/env node
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
// ROUTING: current.track 'concept' -> FORGE (9-axis) · 'skill' (Python) -> the
//   JS->Python 5-phase loop (Claude learn -> Colab -> Coach Gem + CLOSE-PACKET).
// MODES: brief (default — for the SessionStart hook) · json · selftest
// ============================================================================
import { readFileSync, existsSync, mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { courseBrief, fmtStamp } from "./course.mjs";   // audit #35 — the course tracker's one reader (fmtStamp: 11 Aug sweep, the resume address)
import { pythonBrief } from "./python_state.mjs";   // audit #107 #26 — the Python track's one reader
import { loadCapsules, readLog, pendingCloses, openRound, intervalsOf } from "./rejirah.mjs";   // #107 pass 2 — un-pasted rounds; P7.B — the arbiter's live overdue read
import { loadFreshDrill } from "./examiner.mjs";   // 11 Aug 2026 dead-wire sweep — the drill's age gate belongs to its owner (see nextup)
import { starvedNightFor, recordConsumption } from "./brain.mjs";   // 11 Aug 2026 dead-wire sweep — WHY the diary page is blank, in the brain's own words (see diaryLine) · recordConsumption: THE GATE's "briefed" stamp (18 Aug 2026), owner-held

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
function rejirahDueLine(dir, now = Date.now()) {
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE = join(__dirname, "..", "dressing-room", "state");

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
    const gen = mj.missions.filter((r) => r.type !== "audit" && !r.ingested_at);
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
  return { sprint, ws, cur, watch, modeLine, wsAge };
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
  const winnerOf = (name, line, why, rest) => ({ winner: { name, line, why }, contenders: rest });
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
    const stale = (now - Date.parse(forge.started_at || "")) / 3600000 > 18;
    const line = stale
      ? `PEHLE \`node scripts/forge_session.mjs close\` — '${forge.concept}' kal se khula pada hai; coverage report zor se padho, PHIR wahi concept continue`
      : `resume '${forge.concept}' @ STEP ${forge.step} — usi jagah se, kuch dobara nahi`;
    return winnerOf("forge-open", line, "ek khula loop sab kuch rok deta hai — pehle woh", losers);
  }
  if (pend.length) {
    return winnerOf("rejirah-pending", `gist paste: ${pend.slice(0, 2).map((p) => `${p.concept} R${p.round}`).join(" · ")} — \`node scripts/rejirah.mjs pending\` se patch lo`,
      "2 minute ka kaam; jab tak nahi hota, paanch organ round ko 'hua hi nahi' padhte hain", losers.filter((l) => l.name !== "rejirah-pending"));
  }
  if (overdue.length) {
    const o = overdue[0];
    return winnerOf("rejirah-due", `Re-Jirah R${o.round} '${o.concept}' (${o.overdue_days}d ripe) — shuru: \`node scripts/deep.mjs due\`, grade: \`node scripts/rejirah.mjs grade\``,
      "proof purana ho raha hai — jo June mein seekha uska aakhri saboot lock-day ka hai", losers.filter((l) => l.name !== "rejirah-due"));
  }
  if (cur) {
    return winnerOf("sprint", `${cur.id} ${cur.task} [${cur.track}] — plan of record`, "koi khula loop nahi, koi overdue proof nahi — ab aage ka kaam", losers.filter((l) => l.name !== "sprint"));
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
  L.push("=== ARSENAL — SESSION KICKOFF (auto · session-agnostic · read from state, not chat) ===");
  if (cur) {
    // E2E audit 25 Jul 2026: matched the sprint number as a bare string prefix, so
    // the first double-digit sprint mislabels — find() hits n=1 before n=10 because
    // "10-01".startsWith("1") is true. Task ids are always "<sprint>-<nn>", so the
    // separator is part of the match, not decoration.
    const sp = (sprint.sprints || []).find(s => String(cur.id).startsWith(String(s.n) + "-"));
    L.push(`LEARNING NOW: ${cur.id} ${cur.task} [${cur.track}${sp ? ` · S${sp.n} ${sp.theme}` : ""}] — ${cur.subtopics || ""}${spTag}`);
    L.push(`  MODE: ${modeLine}`);
    // P7.B (7 Aug 2026) — ONE decision, made in code, so the kickoff never again
    // hands him a menu of six competing opinions. Fail-silent like every splice here.
    try {
      const nu = nextup(dir, now);
      if (nu && nu.winner && nu.winner.name !== "none") L.push(`  ▶ PEHLA KAAM: ${nu.winner.line}  (kyun: ${nu.winner.why}${nu.contenders.length ? ` · haara: ${nu.contenders.map((c) => c.name).join(", ")} — poora: \`node scripts/learnstate.mjs nextup\`` : ""})`);
    } catch { /* a brief must never be the thing that breaks SessionStart */ }
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
  const nx = (sprint.progress && sprint.progress.next_up) || [];
  if (nx.length) L.push(`NEXT UP: ${nx.slice(0, 3).join(" · ")}`);
  if (sprint.progress && sprint.progress.examiner_daily) L.push(`DAILY EXAMINER: at day's end, test today's concept (${cur ? cur.task : "current"}) — retrieval practice, not a full mock.`);
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
  try {
    const gl = gafferSittingLine(dir, now);
    if (gl) L.push(gl);
  } catch { /* a brief must never be the thing that breaks SessionStart */ }
  try {
    for (const ol of outwardLines(dir, now)) L.push(ol);   // outward loop (8 Aug 2026)
  } catch { /* a brief must never be the thing that breaks SessionStart */ }
  try {
    const ncl = nightCoachLine(dir, now);   // P2 — the overnight coach, one line, freshness-tagged
    if (ncl) L.push(ncl);
  } catch { /* a brief must never be the thing that breaks SessionStart */ }
  try {
    const rrl = roundReadLine(dir, now);   // JOB 1d — last night's deep read of his round
    if (rrl) L.push(rrl);
  } catch { /* a brief must never be the thing that breaks SessionStart */ }
  try {
    const dl = diaryLine(dir, now);   // H6 — the brain's own night page, one line
    if (dl) L.push(dl);
  } catch { /* a brief must never be the thing that breaks SessionStart */ }
  try {
    const sl = seasonLine(dir);
    if (sl) L.push(sl);
  } catch { /* a brief must never be the thing that breaks SessionStart */ }
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
  writeFileSync(join(dirA, "forge_session.json"), JSON.stringify({ concept: "hallucinations", started_at: new Date(NOW - 2 * 3600000).toISOString(), step: 4 }));
  assert("ARBITER — an OPEN fresh forge session beats the sprint, and says RESUME",
    (() => { const n = nextup(dirA, NOW); return n.winner.name === "forge-open" && /resume/.test(n.winner.line) && n.contenders.some((c) => c.name === "sprint"); })());
  writeFileSync(join(dirA, "forge_session.json"), JSON.stringify({ concept: "hallucinations", started_at: new Date(NOW - 30 * 3600000).toISOString(), step: 4 }));
  assert("ARBITER — a STALE-open session wins but the action is CLOSE-first (coverage report is the record)",
    /PEHLE.*close/.test(nextup(dirA, NOW).winner.line));
  writeFileSync(join(dirA, "forge_session.json"), JSON.stringify({ concept: "hallucinations", started_at: new Date(NOW - 30 * 3600000).toISOString(), step: 4, closed_at: new Date(NOW - 20 * 3600000).toISOString() }));
  const capDirA = join(dirA, "capsules"); mkdirSync(capDirA, { recursive: true });
  writeFileSync(join(capDirA, "tokenization.json"), JSON.stringify({ id: "tokenization", lockedOn: "2026-06-15", reJirahDone: [] }));
  assert("ARBITER — session closed + an overdue Re-Jirah round → Re-Jirah wins (proof decays first)",
    (() => { const n = nextup(dirA, NOW); return n.winner.name === "rejirah-due" && /tokenization/.test(n.winner.line); })());
  writeFileSync(join(dirA, "rejirah_log.jsonl"), JSON.stringify({ kind: "round-close", concept: "tokenization", round: 1, due: "2026-06-18", closed_at: iso(1), axes_graded: ["a"] }) + "\n");
  assert("ARBITER — a round SAT-but-unpasted beats a merely-due round (five organs read it as never-served)",
    nextup(dirA, NOW).winner.name === "rejirah-pending");
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
  const mapDir = (genAt) => {
    const d = mkdtempSync(join(tmpdir(), "learnstate-map-"));
    writeFileSync(join(d, "capsule_map.json"), JSON.stringify({
      ...(genAt === null ? {} : { generated_at: genAt }),
      rejirah_overdue: [{ concept: "embeddings", overdue_days: 42, rounds_done: 0 }],
    }));
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
    console.log(`\n  (watchman kabhi is list mein nahi aata — organ repair machine ka kaam hai, tera nahi.)\n`);
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
  try {
    const { assemble } = await import("./context_manifest.mjs");
    const out = await assemble({ dir: STATE, now: Date.now() });
    if (out && typeof out.text === "string" && out.text) { console.log(withState(out.text)); recordBriefed(out.text); return; }
  } catch { /* fall through to the frozen path */ }
  const text = brief(STATE, Date.now(), await loadMemory(), loadTeachingCard());
  console.log(withState(text));
  recordBriefed(text);
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
function recordBriefed(text) {
  try {
    const t = String(text || "");
    if (t.includes("🌙 NIGHT COACH")) recordConsumption({ job: "night_coach", kind: "briefed", by: "learnstate brief (SessionStart)" });
    if (t.includes("📔 BRAIN DIARY") && !t.includes("page nahi likhi")) recordConsumption({ job: "diary", kind: "briefed", by: "learnstate brief (SessionStart)" });
    if (t.includes("🧠 ROUND READ")) recordConsumption({ lane: "ns_round_read", kind: "briefed", by: "learnstate brief (SessionStart)" });
    // Block 2 §7.2 (18 Aug 2026): the SESSION INTENTS block is where the intent_digest
    // job's labels reach a session — its GATE (C) rides this stamp. Squeezed out = not consumed.
    if (t.includes("--- SESSION INTENTS")) recordConsumption({ job: "intent_digest", kind: "briefed", by: "learnstate brief (SessionStart)" });
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
