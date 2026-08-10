#!/usr/bin/env node
// ============================================================================
// scoreboard.mjs · ARSENAL AI FC — H1 THE SCOREBOARD (zero-LLM ground truth)
// ----------------------------------------------------------------------------
// PHASE H (approved 9-10 Aug 2026, his "i like phase H… let's build everything"
// + the 10 Aug amendment "everything should be built right now before using
// then we can weekly audit everything"). H1 is the brain's outcome ledger:
// deterministic joins between what the machine PREDICTED/PLANNED and what HIS
// OWN DATA says actually happened. No LLM anywhere in this file.
//
// THE GOODHART GUARD (the map's own law): the OUTCOME side of every join comes
// ONLY from his data — reps_log gut-words, the scorer's gaffer book (itself
// resolved by "reps landed"), mouth/timeaudit day facts. Brain-internal metrics
// (tokens, salience, ledger health) may appear only as PREDICTION-side context,
// never as an outcome. The scoreboard never scores the scoreboard.
//
// OWNER: this file is the SOLE WRITER of dressing-room/state/brain_outcomes.jsonl
// — the name is the approved map's own ("OUT brain_outcomes.jsonl (one owner)"),
// NOT brain.mjs's: brain_out/ is brain.mjs's declared-lanes dir and this file
// deliberately lives OUTSIDE it (G13 PASS 1b would flag a foreign dir there).
// The journal is gitignored in the same commit that created it: it re-exports
// day facts from two explicitly-ignored sources (timeaudit.json, drills.json
// via slip.jsonl) into what would otherwise be the PUBLIC repo.
//
// THE JOURNAL IS APPEND-ONLY WITH SUPERSEDE-BY-APPEND (scorer.mjs's own canon,
// :189-196 — "a matured proposal's resolved copy is a NEW row"). A verdict is
// never rewritten: when a revisit re-derives a DIFFERENT verdict for the same
// (day, kind, subject) — back-dated reps are a DESIGNED flow (capture.mjs
// :161-170 keeps a past ts_claimed, so a next-morning Colab paste lands reps on
// YESTERDAY) — a new row appends with rev+1, and every reader takes the LAST
// row per key. `run` (bare) therefore does today + a revisit of yesterday, and
// settles any still-pending drill rows whose slip verdict has since matured.
//
// THE THREE JOINS (refuter-corrected, 10 Aug 2026 — the first design draft had
// two joins that broke on the real machine; the adversarial pass caught both):
//   1. MISCONCEPTION — night coach's <D>.json (named for the morning it serves;
//      serve-date law proven live: the 22:00 run filed 2026-08-10.md) vs reps
//      whose LOCAL day == D. Concepts are canonicalized through the same
//      concepts.json alias machinery capture.mjs owns, with setpiece's
//      bidirectional-substring fallback — NEVER exact-equality against LLM free
//      text. A name that resolves to nothing = verdict "unresolvable_name"
//      (distinct from "untested": a naming miss must never masquerade as him
//      not studying). No .json sibling = "unmeasurable", said out loud — the
//      sibling is 0-for-1 lifetime as of 10 Aug 2026, so this lane is
//      HYPOTHESIS until the first real sibling lands (watchman watches for it).
//   2. DRILLS — a READ of the scorer's gaffer book in slip.jsonl (last-wins per
//      (date|claim), resolved rows carry hit + evidence "reps landed"/"no reps
//      on it" over the E2E-ruled horizon). The scoreboard does NOT re-derive
//      played-vs-benched: scorer.mjs already joins drills.json × reps_log with
//      arithmetic the E2E audit ruled on (window opens i=0), and two organs
//      disagreeing about the same truth is the exact disease H1 exists to end.
//      Unresolved rows are "pending_horizon", superseded when the slip matures.
//   3. SHEET DAY — data-only row: mouth_said[day] verbatim ("sheet"/"absence"),
//      formation_read ok from the brain ledger (.1-roll-aware read) plus, since
//      10 Aug 2026, that same row's inputs_present/declared/absent_names — brain's
//      finding-#64 accounting, written nightly since 2 Aug and read by no organ at
//      all until this join took it (formation_inputs; null today by MEASUREMENT, and
//      the comment on it says why — the cross-job answer is `brain status`), reps_n,
//      and timeaudit's own day fields (camelCase source mapped explicitly, only
//      when timeaudit.date == day; its generatedAt recorded so a stale same-date
//      file is distinguishable). NO invented verdict — the row is ground for H2
//      (agenda) and H6 (diary), and timeaudit's onTrack/flags are that organ's
//      own derivations, recorded as-is.
//
// READERS: watchman probeOutcomes (conditional — cracked>0 INFO, scoreboard-
// silent WARN, coach-json-absent INFO) · H2 agenda (job input) · H6 diary.
// SCHEDULE: one step in the conductor's EVENING chain at 22:38 (derived from
// its neighbours scorer 22:35 / setpiece 22:40 — after the scorer has proposed
// + matured today's gaffer rows, before setpiece rewrites drills.json for
// TOMORROW), needs ["scorer"].
// ============================================================================
import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STATE_DIR = join(ROOT, "dressing-room", "state");
const OUT_PATH = join(STATE_DIR, "brain_outcomes.jsonl");

// ---------------------------------------------------------------------------
// day + io helpers (the repo's own hard-won patterns, credited)
// ---------------------------------------------------------------------------
const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// physio.mjs:94-99 — a rep belongs to the day the captain lived, not the day
// UTC was having; date-only stamps are taken literally (no clock to convert).
const repLocalDay = (ts) => {
  const s = String(ts || "");
  if (!/[T ]/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? localDate(d) : s.slice(0, 10);
};
const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const readLines = (p) => {
  const out = [];
  try {
    for (const line of readFileSync(p, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try { out.push(JSON.parse(line)); } catch { }
    }
  } catch { }
  return out;
};
// E3's windowed-reader law: brain_ledger.jsonl rolls at 2MB keeping one .1
// generation — any day-windowed query must read .1 first, then the live file.
const readLinesRolled = (p) => readLines(p + ".1").concat(readLines(p));

// ---------------------------------------------------------------------------
// concept canonicalization — capture.mjs's alias machinery (normText order law:
// fold FIRST, then trim — the 30 Jul idempotency scar) + setpiece.mjs:147-151's
// bidirectional-substring fallback for LLM-written names.
// ---------------------------------------------------------------------------
const normText = (s) => String(s).toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

function loadAliasMap(conceptsPath) {
  const map = new Map();
  const j = readJson(conceptsPath);
  if (j && j.concepts) {
    for (const [id, def] of Object.entries(j.concepts)) {
      map.set(normText(id), id);
      for (const a of ((def && def.aliases) || [])) map.set(normText(a), id);
    }
  }
  return map;
}

export function resolveConcept(raw, aliasMap, knownIds) {
  if (typeof raw !== "string" || !raw.trim()) return { id: null, method: "absent", raw: raw ?? null };
  const key = normText(raw);
  if (aliasMap.has(key)) return { id: aliasMap.get(key), method: "alias", raw };
  for (const id of knownIds) {
    const nid = normText(id);
    if (nid === key || nid.includes(key) || key.includes(nid)) return { id, method: "substring", raw };
  }
  return { id: null, method: "unresolved", raw };
}

// ---------------------------------------------------------------------------
// the journal — append-only, supersede-by-append, last-wins per key
// ---------------------------------------------------------------------------
const keyOf = (r) => `${r.day}|${r.kind}|${r.subject}`;

export function lastPerKey(rows) {
  const m = new Map();
  for (const r of rows) m.set(keyOf(r), r);   // file order = append order = last wins
  return m;
}

// signature = everything that makes two verdict rows "the same finding" —
// ts/rev excluded so a re-run with unchanged ground appends nothing.
const sigOf = (r) => JSON.stringify({ ...r, ts: undefined, rev: undefined });

export function appendMissing(candidates, existingRows, outPath, dry = false) {
  const last = lastPerKey(existingRows);
  const appended = [];
  for (const c of candidates) {
    const prev = last.get(keyOf(c));
    if (prev && sigOf(prev) === sigOf(c)) continue;          // unchanged — skip
    const row = { ...c, rev: prev ? (prev.rev || 0) + 1 : 0 };
    appended.push(row);
    if (!dry) appendFileSync(outPath, JSON.stringify(row) + "\n");
    last.set(keyOf(row), row);
  }
  return appended;
}

// ---------------------------------------------------------------------------
// JOIN 1 — misconception day: night coach's <D>.json vs local-day-D reps
// ---------------------------------------------------------------------------
export function joinMisconceptions(day, deps) {
  const ncDir = deps.ncDir;
  const ts = deps.nowIso;
  const mdExists = existsSync(join(ncDir, day + ".md"));
  const nc = readJson(join(ncDir, day + ".json"));
  if (!nc || !Array.isArray(nc.misconceptions)) {
    return [{ ts, day, kind: "misconception_day", subject: day, verdict: "unmeasurable",
      why: mdExists ? "machine sibling (.json) absent — .md exists unparsed" : "no night_coach output for this morning" }];
  }
  const reps = deps.reps.filter((r) => repLocalDay(r.ts) === day);
  const known = [...new Set(reps.concat(deps.allReps || []).map((r) => r.concept).filter(Boolean))]
    .concat([...deps.aliasMap.values()]);
  const rows = [];
  // belt-and-braces from the refuter: trust the json's own day fields when sane
  const dayNote = (nc.date && nc.date !== day) ? `json.date=${nc.date} != file day` : null;
  const items = nc.misconceptions.map((m, i) => ({ m, kind: "misconception", i }))
    .concat(nc.lesson && typeof nc.lesson === "object" ? [{ m: nc.lesson, kind: "lesson", i: 0 }] : []);
  for (const { m, kind, i } of items) {
    const res = resolveConcept(m && m.concept, deps.aliasMap, known);
    const subject = res.id || `raw:${String((m && m.concept) || "?").slice(0, 40)}#${i}`;
    if (!res.id) {
      rows.push({ ts, day, kind, subject, verdict: res.method === "absent" ? "unmeasurable" : "unresolvable_name",
        raw_concept: res.raw, ...(dayNote ? { note: dayNote } : {}) });
      continue;
    }
    const cr = reps.filter((r) => r.concept === res.id);
    const nCorrect = cr.filter((r) => r.correct === true).length;
    const nWrong = cr.filter((r) => r.correct === false).length;
    const gut = {};
    for (const r of cr) gut[r.confidence] = (gut[r.confidence] || 0) + 1;
    const verdict = cr.length === 0 ? "untested" : nWrong === 0 ? "held" : nCorrect === 0 ? "cracked" : "mixed";
    rows.push({ ts, day, kind, subject, verdict, raw_concept: res.raw, match: res.method,
      reps_n: cr.length, n_correct: nCorrect, n_wrong: nWrong, gut,
      ...(dayNote ? { note: dayNote } : {}) });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// JOIN 2 — drills: a READ of the scorer's gaffer book (never a re-derive)
// ---------------------------------------------------------------------------
export function joinDrills(day, deps) {
  const ts = deps.nowIso;
  const gaffer = deps.slip.filter((s) => s.book === "gaffer" && s.date === day);
  // scorer's canon: last-wins per (date|claim); a resolved row retires its proposal
  const byClaim = new Map();
  for (const s of gaffer) {
    const prev = byClaim.get(s.claim);
    if (!prev || (s.resolved && !prev.resolved)) byClaim.set(s.claim, s);
  }
  const rows = [];
  for (const [claim, s] of byClaim) {
    rows.push({
      ts, day, kind: "drill", subject: claim, type: s.type || null,
      verdict: s.resolved ? (s.hit ? "hit" : "miss") : "pending_horizon",
      horizon_days: s.horizon_days ?? null, evidence: s.evidence || null,
    });
  }
  return rows;
}

// settle: any journal drill row still pending whose slip verdict has since
// matured gets its superseding row on THIS run — journal-driven, no window
// arithmetic of our own (the horizon lives in the slip rows themselves).
export function settleDrills(existingRows, deps) {
  const last = lastPerKey(existingRows);
  const out = [];
  for (const r of last.values()) {
    if (r.kind !== "drill" || r.verdict !== "pending_horizon") continue;
    const fresh = joinDrills(r.day, deps).find((c) => c.subject === r.subject);
    if (fresh && fresh.verdict !== "pending_horizon") out.push(fresh);
  }
  return out;
}

// ---------------------------------------------------------------------------
// JOIN 3 — sheet day: data-only facts, fields named for what they measure
// ---------------------------------------------------------------------------
export function joinSheetDay(day, deps) {
  const ts = deps.nowIso;
  const push = (deps.mouthSaid || {})[day] ?? null;         // "sheet" | "absence" | null
  const led = (deps.ledger || []).filter((r) => r.job === "formation_read" && repLocalDay(r.ts) === day);
  const ok = led.some((r) => r.ok === true);
  const lastRow = led.length ? led[led.length - 1] : null;
  const lastNote = lastRow ? (lastRow.note || null) : null;
  // WHAT THE SHEET WAS BUILT FROM (10 Aug 2026 wiring pass). brain.mjs has written
  // inputs_present / inputs_declared / inputs_absent_names on every ledger row since
  // its finding #64 — and a grep on 10 Aug found ZERO readers outside brain.mjs, so
  // "the sheet went out, but on how much evidence?" was recorded nightly and
  // answerable by nobody. It rides the row this join ALREADY opens: no new file, no
  // new read, no import. Prediction-side context on a data-only row, exactly like
  // formation_read_ok beside it — never an outcome (the Goodhart guard up top).
  // `null` when the row predates the accounting or the job declares no inputs at all
  // (the manager_m3 class) — the two cases brain's own comment keeps apart, and
  // neither is a measured zero.
  // MEASURED TODAY, SAID OUT LOUD (10 Aug 2026): formation_read is currently IN that
  // second class — its last four live rows (7/8/9/10 Aug) all carry inputs_declared:
  // null, because the sheet builds from live signals, not declared input files. So
  // this reads null every night as things stand, and that is the honest answer, not
  // a broken read. The lane is here so the day the sheet declares an input, the
  // journal records what it was built on instead of finding out weeks later — which
  // is the whole shape of the defect this repair came from. The full cross-job
  // answer lives where the aggregation lives: `node scripts/brain.mjs status`. It is
  // NOT re-derived here — two organs deriving the same truth is the disease H1 exists
  // to end (JOIN 2's own law), and brain.mjs already imports this file.
  const fInputs = (lastRow && typeof lastRow.inputs_declared === "number")
    ? { present: lastRow.inputs_present ?? null, declared: lastRow.inputs_declared,
        absent_names: lastRow.inputs_absent_names || [] }
    : null;
  const repsN = (deps.reps || []).filter((r) => repLocalDay(r.ts) === day).length;
  const ta = deps.timeaudit;
  const taRow = (ta && ta.date === day)
    ? { active_min: ta.activeMinutes ?? null, productive_min: ta.productiveMinutes ?? null,
        on_track: ta.onTrack ?? null, flags: ta.flags || [], generated_at: ta.generatedAt || null }
    : null;
  return [{ ts, day, kind: "sheet_day", subject: day,
    sheet_push_sent: push, formation_read_ok: led.length ? ok : null, formation_note: lastNote,
    formation_inputs: fInputs, reps_n: repsN, timeaudit: taRow }];
}

// ---------------------------------------------------------------------------
// run + report
// ---------------------------------------------------------------------------
function liveDeps(now = new Date()) {
  return {
    nowIso: now.toISOString(),
    ncDir: join(STATE_DIR, "brain_out", "night_coach"),
    reps: readLines(join(STATE_DIR, "reps_log.jsonl")),
    allReps: [],
    aliasMap: loadAliasMap(join(STATE_DIR, "concepts.json")),
    slip: readLines(join(STATE_DIR, "slip.jsonl")),
    mouthSaid: (readJson(join(STATE_DIR, "brain_queue.json")) || {}).mouth_said || {},
    ledger: readLinesRolled(join(STATE_DIR, "brain_ledger.jsonl")),
    timeaudit: readJson(join(STATE_DIR, "timeaudit.json")),
    outPath: OUT_PATH,
  };
}

export function runDay(day, deps, dry = false) {
  const existing = readLines(deps.outPath);
  const candidates = [
    ...joinMisconceptions(day, deps),
    ...joinDrills(day, deps),
    ...joinSheetDay(day, deps),
  ];
  const appended = appendMissing(candidates, existing, deps.outPath, dry);
  const settled = appendMissing(settleDrills(readLines(deps.outPath), deps), readLines(deps.outPath), deps.outPath, dry);
  return { day, appended: appended.length + settled.length, rows: appended.concat(settled) };
}

function report(daysArg) {
  const rows = readLines(OUT_PATH);
  const last = [...lastPerKey(rows).values()];
  const days = [...new Set(last.map((r) => r.day))].sort();
  const shown = daysArg ? days.slice(-daysArg) : days;
  console.log(`== THE SCOREBOARD (brain_outcomes.jsonl · ${rows.length} row(s), ${last.length} live after supersede) ==`);
  for (const d of shown) {
    const dr = last.filter((r) => r.day === d);
    console.log(`\n${d}:`);
    for (const r of dr) {
      const detail = r.kind === "sheet_day"
        ? `push=${r.sheet_push_sent ?? "—"} · sheet_ok=${r.formation_read_ok ?? "—"}${r.formation_inputs ? ` · built on ${r.formation_inputs.present}/${r.formation_inputs.declared}${r.formation_inputs.absent_names.length ? ` (absent: ${r.formation_inputs.absent_names.join(", ")})` : ""}` : ""} · reps=${r.reps_n}${r.timeaudit ? ` · active ${r.timeaudit.active_min}m` : " · timeaudit n/a"}`
        : r.kind === "drill" ? `${r.verdict}${r.evidence ? ` (${String(r.evidence).slice(0, 60)})` : ""}`
        : `${r.verdict}${r.reps_n !== undefined ? ` (${r.n_correct}✓/${r.n_wrong}✗ of ${r.reps_n})` : ""}${r.why ? ` — ${r.why}` : ""}`;
      console.log(`  ${r.kind.padEnd(18)} ${String(r.subject).padEnd(24)} ${detail}${r.rev ? `  [rev ${r.rev}]` : ""}`);
    }
  }
  if (!shown.length) console.log("  (no rows yet — the first evening run writes them)");
}

// ---------------------------------------------------------------------------
// selftest — sandboxed fixtures, no live state touched (isolation law)
// ---------------------------------------------------------------------------
function selftest() {
  let pass = 0, fail = 0;
  const ok = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };
  const root = mkdtempSync(join(tmpdir(), "scoreboard-"));
  const outPath = join(root, "brain_outcomes.jsonl");
  const ncDir = join(root, "nc");
  mkdirSync(ncDir, { recursive: true });
  const D = "2026-08-09";
  const aliasMap = new Map([["hallucinations", "hallucinations"], ["context window", "context"], ["embeddings", "embeddings"]]);
  const mkDeps = (over = {}) => ({
    nowIso: "2026-08-09T17:08:00.000Z", ncDir, outPath, aliasMap, allReps: [],
    reps: [
      { ts: "2026-08-09T05:00:00.000Z", concept: "hallucinations", confidence: "knew", correct: true },
      { ts: "2026-08-09T06:00:00.000Z", concept: "hallucinations", confidence: "guessed", correct: false },
      { ts: "2026-08-09T19:30:00.000Z", concept: "context", confidence: "shaky", correct: true }, // 01:00 IST Aug 10 — local-day law
    ],
    slip: [
      { date: D, book: "gaffer", type: "drill:recall", claim: "hallucinations", resolved: false, hit: null, horizon_days: 3 },
      { date: D, book: "gaffer", type: "drill:recall", claim: "embeddings", resolved: false, hit: null, horizon_days: 3 },
      { date: D, book: "twin", type: "floor_touched", claim: "x", resolved: true, hit: true },
    ],
    mouthSaid: { [D]: "sheet", "2026-08-08": "absence" },
    // the inputs_* quartet is brain.mjs's own row shape since its finding #64 — a
    // sheet built on 2 of 3 declared inputs, saying WHICH one was missing.
    ledger: [{ ts: "2026-08-09T01:24:00.000Z", job: "formation_read", ok: true, note: "sheet source=llm",
      inputs_present: 2, inputs_declared: 3, inputs_absent: 1, inputs_absent_names: ["season.json"] }],
    timeaudit: { date: D, activeMinutes: 252, productiveMinutes: 197, onTrack: false, flags: ["f1"], generatedAt: "2026-08-09T16:30:04.905Z" },
    ...over,
  });

  // JOIN 1 — no json sibling = honest unmeasurable, md presence named
  writeFileSync(join(ncDir, D + ".md"), "# coach md, no sibling");
  let rows = joinMisconceptions(D, mkDeps());
  ok("JOIN1 — no .json sibling = ONE 'unmeasurable' row naming the unparsed .md (the 0-for-1 lifetime truth)",
    rows.length === 1 && rows[0].verdict === "unmeasurable" && /sibling/.test(rows[0].why));

  // JOIN 1 — measured classes on a real sibling
  writeFileSync(join(ncDir, D + ".json"), JSON.stringify({
    date: D, study_day: "2026-08-08",
    misconceptions: [
      { concept: "Hallucinations (axis d)", evidence: "e" },   // resolves by substring
      { concept: "Context Window", evidence: "e" },            // resolves by alias → untested on D
      { concept: "quantum flux", evidence: "e" },              // resolves to nothing
      { evidence: "no concept field" },                        // absent
    ],
    lesson: { concept: "embeddings" },
  }));
  rows = joinMisconceptions(D, mkDeps());
  const by = (s) => rows.find((r) => r.subject === s);
  ok("JOIN1 — LLM free text canonicalizes (substring: 'Hallucinations (axis d)' → hallucinations) and joins reps as MIXED",
    by("hallucinations") && by("hallucinations").verdict === "mixed" && by("hallucinations").match === "substring"
    && by("hallucinations").n_correct === 1 && by("hallucinations").n_wrong === 1);
  ok("JOIN1 — alias resolve + zero same-day reps = UNTESTED (context: its one rep is 01:00 IST = NEXT local day)",
    by("context") && by("context").verdict === "untested");
  ok("JOIN1 — an unresolvable coach name is 'unresolvable_name' carrying the raw string, NEVER 'untested'",
    rows.some((r) => r.verdict === "unresolvable_name" && r.raw_concept === "quantum flux"));
  ok("JOIN1 — a missing concept field degrades per-row (unmeasurable), the rest of the map still joins",
    rows.some((r) => r.verdict === "unmeasurable" && r.kind === "misconception") && rows.length === 5);
  ok("JOIN1 — the lesson concept gets its own row (kind 'lesson')",
    rows.some((r) => r.kind === "lesson" && r.subject === "embeddings" && r.verdict === "untested"));

  // JOIN 2 — a READ of the gaffer book, never a re-derive
  rows = joinDrills(D, mkDeps());
  ok("JOIN2 — unresolved gaffer rows read as 'pending_horizon' (the horizon lives in the slip, not here)",
    rows.length === 2 && rows.every((r) => r.verdict === "pending_horizon" && r.horizon_days === 3));
  ok("JOIN2 — non-gaffer books (twin markets) never leak in", !rows.some((r) => r.subject === "x"));
  const settledDeps = mkDeps({ slip: [
    { date: D, book: "gaffer", type: "drill:recall", claim: "hallucinations", resolved: false, hit: null, horizon_days: 3 },
    { date: D, book: "gaffer", type: "drill:recall", claim: "hallucinations", resolved: true, hit: true, horizon_days: 3, evidence: "x | matured d+3: reps landed" },
    { date: D, book: "gaffer", type: "drill:recall", claim: "embeddings", resolved: true, hit: false, horizon_days: 3, evidence: "y | matured d+3: no reps on it" },
  ] });
  rows = joinDrills(D, settledDeps);
  ok("JOIN2 — a resolved row retires its proposal (scorer's last-wins canon): hit + miss read through",
    rows.find((r) => r.subject === "hallucinations").verdict === "hit"
    && rows.find((r) => r.subject === "embeddings").verdict === "miss");

  // JOIN 3 — data-only, fields named for what they measure
  rows = joinSheetDay(D, mkDeps());
  ok("JOIN3 — sheet_push_sent carries mouth_said VERBATIM and formation_read_ok rides the ledger day-join",
    rows[0].sheet_push_sent === "sheet" && rows[0].formation_read_ok === true && rows[0].reps_n === 2);
  // the wire, netted (10 Aug 2026): brain's inputs_* accounting had no reader
  // outside brain.mjs for eight days. If this join stops carrying it, the journal
  // goes back to saying the sheet ran without ever saying what it ran ON.
  ok("JOIN3 — formation_inputs carries brain's finding-#64 accounting off the SAME ledger row (present/declared + the absent names)",
    rows[0].formation_inputs && rows[0].formation_inputs.present === 2
    && rows[0].formation_inputs.declared === 3 && rows[0].formation_inputs.absent_names[0] === "season.json");
  ok("JOIN3 — a ledger row with NO inputs accounting reads null, never a measured zero (pre-#64 rows and the declares-no-inputs class)",
    joinSheetDay(D, mkDeps({ ledger: [{ ts: "2026-08-09T01:24:00.000Z", job: "formation_read", ok: true, note: "sheet source=llm" }] }))[0].formation_inputs === null);
  ok("JOIN3 — timeaudit camelCase mapped explicitly + generatedAt kept (stale same-date detectable)",
    rows[0].timeaudit && rows[0].timeaudit.active_min === 252 && rows[0].timeaudit.generated_at === "2026-08-09T16:30:04.905Z");
  ok("JOIN3 — an 'absence' morning reads through verbatim; a day timeaudit doesn't cover reads null",
    joinSheetDay("2026-08-08", mkDeps())[0].sheet_push_sent === "absence"
    && joinSheetDay("2026-08-08", mkDeps())[0].timeaudit === null);

  // the journal: append-only + supersede-by-append + idempotency
  let r1 = runDay(D, mkDeps());
  ok("RUN — first run appends rows", r1.appended > 0);
  const n1 = readLines(outPath).length;
  let r2 = runDay(D, mkDeps());
  ok("RUN — an unchanged re-run appends NOTHING (idempotent, no duplicate rows)",
    r2.appended === 0 && readLines(outPath).length === n1);
  // back-dated reps (capture's designed flow) flip a verdict → supersede, never rewrite
  const moreReps = mkDeps();
  moreReps.reps = moreReps.reps.concat([{ ts: "2026-08-09T10:00:00.000Z", concept: "context", confidence: "knew", correct: true }]);
  let r3 = runDay(D, moreReps);
  const ctxRows = readLines(outPath).filter((r) => r.subject === "context" && r.kind === "misconception");
  ok("RUN — a back-dated rep SUPERSEDES by append (rev 1, untested → held); the original row is never rewritten",
    r3.appended >= 1 && ctxRows.length === 2 && ctxRows[0].verdict === "untested" && ctxRows[1].verdict === "held" && ctxRows[1].rev === 1);
  ok("READERS — last-per-key sees only the superseding row",
    lastPerKey(readLines(outPath)).get(`${D}|misconception|context`).verdict === "held");
  // drill settlement: pending → hit when the slip matures later
  let r4 = runDay(D, settledDeps);
  const drillRows = readLines(outPath).filter((r) => r.subject === "hallucinations" && r.kind === "drill");
  ok("RUN — a pending drill settles when the gaffer book matures (supersede row, journal-driven, no own window math)",
    drillRows.length === 2 && drillRows[1].verdict === "hit" && drillRows[1].rev === 1);

  // Goodhart guard — the outcome path reads no brain-internal metric
  const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
  const verdictFns = src.slice(src.indexOf("function joinMisconceptions"), src.indexOf("// JOIN 3"));
  ok("GOODHART — the verdict-bearing joins (1+2) read no salience/token/ledger needle (his data only)",
    !/salience|token|brain_ledger|fuelboard/i.test(verdictFns));

  rmSync(root, { recursive: true, force: true });
  console.log(`\n${fail === 0 ? "ALL CHECKS PASSED" : "FAILURES: " + fail} (${pass} passed, ${fail} failed)`);
  return fail === 0;
}

// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "run").toLowerCase();
  if (mode === "selftest") process.exit(selftest() ? 0 : 1);
  if (mode === "report") {
    const di = process.argv.indexOf("--days");
    report(di > -1 ? Math.max(1, parseInt(process.argv[di + 1], 10) || 0) : null);
    return;
  }
  const now = new Date();
  const deps = liveDeps(now);
  if (mode === "backfill") {
    const di = process.argv.indexOf("--days");
    const n = di > -1 ? Math.max(1, parseInt(process.argv[di + 1], 10) || 3) : 3;   // 3 = the map's ruled proof window
    for (let i = n; i >= 1; i--) {
      const d = localDate(new Date(now.getTime() - i * 86400000));
      const r = runDay(d, deps);
      console.log(`scoreboard backfill ${d}: ${r.appended} row(s) appended`);
    }
    return;
  }
  if (mode === "run") {
    const di = process.argv.indexOf("--day");
    if (di > -1) {
      const r = runDay(String(process.argv[di + 1]), deps);
      console.log(`scoreboard ${r.day}: ${r.appended} row(s) appended`);
      return;
    }
    // bare run = today + revisit yesterday (back-dated reps are a designed flow)
    const today = localDate(now);
    const yday = localDate(new Date(now.getTime() - 86400000));
    const ry = runDay(yday, deps);
    const rt = runDay(today, deps);
    console.log(`scoreboard: ${yday} +${ry.appended} · ${today} +${rt.appended} → ${OUT_PATH.replace(ROOT, "").slice(1)}`);
    return;
  }
  console.log("scoreboard.mjs — run [--day YYYY-MM-DD] · report [--days N] · backfill --days N · selftest");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error("scoreboard error:", e.message); process.exit(1); });
}

export { localDate, repLocalDay, loadAliasMap, selftest };
