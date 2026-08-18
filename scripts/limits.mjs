// ============================================================================
// scripts/limits.mjs — THE NUMBERS LEDGER
//
// WHY (captain, 1 Aug 2026, his own words): "why are we setting numerical limits
// in the entire organism when we are starting it from scratch? shouldn't
// everything be fully opened and then we analyze the data in 30-45-60 days and
// then think what should be the numerical limits?"
//
// He is right, and the repo already said so and then did the opposite:
// brain_config.json — "these start conservative and SELF-TUNE … the ledger LEARNS
// the plan's real shape instead of PRETENDING TO KNOW IT"; brain.mjs's pulse —
// "cheap enough to be continuous is ASSERTED, NEVER DERIVED … MEASURE, then tune."
// 853 pulses later nobody had measured. Meanwhile four of the seven core organs
// sit at status "warming_up" behind rep gates the captain was never shown.
//
// WHAT: every number that decides something, in one place, next to the REAL data
// it is being judged against — so a threshold is either EARNED or exposed as a
// guess. Read-only. No config is changed by this file, ever.
//
// ORIGIN is the whole point of the table:
//   guessed   — a human picked it; no data behind it. THESE are what he means.
//   measured  — derived from this captain's own recorded history
//   external  — a wall we do not own (plan limits, API shapes, sleep science)
//   guard     — not a budget: it stops one identical failure repeating forever.
//               Guards stay open-ended systems' only protection and are NOT
//               subject to the 30-60-day rule.
// Anything not in the curated table is reported `unclassified` — never guessed at,
// because silently calling a number "fine" is the exact failure this file exists for.
// ============================================================================
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..");
const STATE = join(REPO, "dressing-room", "state");
const SCRIPTS = join(REPO, "scripts");

const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const readLines = (p) => { try { return readFileSync(p, "utf8").trim().split("\n").filter(Boolean); } catch { return []; } };

// ---- WHAT THE CAPTAIN ACTUALLY HAS RIGHT NOW -------------------------------
export function measureReality(stateDir = STATE) {
  const reps = readLines(join(stateDir, "reps_log.jsonl")).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const capsules = (() => { try { return readdirSync(join(stateDir, "capsules")).filter(f => f.endsWith(".json")).length; } catch { return 0; } })();
  const dg = readJson(join(stateDir, "doubt_grammar.json"));
  const lex = readJson(join(stateDir, "lexicon.json"));
  const ledger = readLines(join(stateDir, "brain_ledger.jsonl")).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const days = (() => {
    const ts = reps.map(r => String(r.ts || "").slice(0, 10)).filter(Boolean).sort();
    if (!ts.length) return 0;
    return Math.round((Date.parse(ts[ts.length - 1]) - Date.parse(ts[0])) / 86400000) + 1;
  })();
  return {
    reps: reps.length,
    rep_days: new Set(reps.map(r => String(r.ts || "").slice(0, 10))).size,
    span_days: days,
    capsules,
    doubts: dg && Array.isArray(dg.doubts) ? dg.doubts.length : (dg && dg.total_doubts) || 0,
    // WIRING AUDIT (11 Aug 2026) — THE LEXICON'S OWN COUNTERS, which no organ read.
    // doubtminer.mjs publishes three numbers about how his anchor list was built:
    // `filtered_connectives` (#4's rejection count, live value 38) and, since the
    // same-day cap repair, `anchors_mined` + `dropped_by_cap`. A grep for any of
    // them across scripts/ and .claude/skills/ hit doubtminer.mjs and nothing else —
    // producer with no consumer, the same shape as brain_calls_estimated below.
    // Worse, doubtminer.mjs's own DEFAULTS comment stated as fact that max_anchors
    // "is registered in limits.mjs BUDGETS as `guessed`" while `grep -n max_anchors
    // scripts/limits.mjs` returned nothing — the ONE lexicon knob that had just been
    // given a config key still had no ledger row, and the evidence for whether 25 is
    // still the right cap reached a console.log and stopped. That row now EXISTS
    // ("lexicon anchor cap", BUDGETS, below) — landed in this same 11 Aug wiring
    // pass, minutes after this paragraph was written, which is why the paragraph is
    // in the past tense. The counters below are the other half: the row carries the
    // number, these carry what the number actually did to his anchor list.
    // A NAME IS NOT A READ. That row's note first ended by POINTING at these counters
    // ("read that before retuning this") — a measurement discharged by asking someone
    // to remember where to look, which is the same ANCHOR-LAW break the distiller
    // cadence row was repaired for hours earlier in this file ("sat unread by every
    // organ for its whole life"). So the row READS them, via `measure` — the device
    // GATES has always used for `have` — and these fields are that read.
    // COUNTS ONLY — this file never judges the number, it exposes it for his
    // 30-45-60-day read (the whole contract in this file's header).
    // ABSENT IS NOT ZERO: the lexicon.json this paragraph was written against was
    // the 2026-08-10 file, which predates anchors_mined/dropped_by_cap and carried
    // neither key. (The owner has since re-run — the file on disk now carries both,
    // 25 of 45 kept, 20 dropped — but the guard stands for every stale or
    // never-re-run copy, and doubtminer's task sits Disabled in schtasks.) Reporting
    // 0 dropped for a cap that in fact cut 20 of his phrases is the exact lie
    // doubtminer's own selftest is written against — "a counter that reports 0 for a
    // filter that fired". A missing key reads null here and prints "?" in the table.
    lexicon_date: lex && lex.date ? String(lex.date) : null,
    lexicon_anchors: lex && Array.isArray(lex.anchors) ? lex.anchors.length : null,
    lexicon_anchors_mined: lex && Number.isFinite(lex.anchors_mined) ? lex.anchors_mined : null,
    lexicon_dropped_by_cap: lex && Array.isArray(lex.dropped_by_cap) ? lex.dropped_by_cap.length : null,
    lexicon_connectives_filtered: lex && Number.isFinite(lex.filtered_connectives) ? lex.filtered_connectives : null,
    // WIRING AUDIT (11 Aug 2026) — THE FSRS COLLAPSE ARITHMETIC, the FOURTH
    // producer-with-no-consumer this ledger has adopted (after cal_gate,
    // tokens_estimated and distiller_latency — all three below/above, same shape,
    // same repair). fsrs.mjs:413-415 writes per-card raw_reps / review_events /
    // collapsed / review_unit into fsrs_store.json, and :455-466 sums them into
    // cards.json's `collapse` block plus publishes its ungate counter as `gate`
    // (audit #106's "a refusal must be a measurement with its denominator shown").
    // A grep for raw_reps / review_events / cards.collapse / cards.gate across every
    // .mjs, .md and .json in the repo hit fsrs.mjs and the two state files it writes
    // — nothing else. Every real consumer of cards.json (manager · dugout ·
    // setpiece · examiner · capsule_bridge · thalamus · nightshift) reads only the
    // counters and the names. So audit #24's whole point — its own words, "a
    // printed number and not an inference" — reached fsrs's stdout and stopped
    // there, and conductor.mjs keeps only stderr on failure. Live on 10 Aug 2026:
    // 27 raw reps → 12 review events, 15 merged. Objects, not scalars, so `human()`
    // skips them here and the GATES + BUDGETS tables print them on their own rows.
    fsrs_gate: (readJson(join(stateDir, "cards.json")) || {}).gate || null,
    fsrs_collapse: fsrsCollapse(readJson(join(stateDir, "cards.json")), readJson(join(stateDir, "fsrs_store.json"))),
    afferents: readLines(join(stateDir, "afferent.jsonl")).length,
    salience_moments: readLines(join(stateDir, "salience_ledger.jsonl")).length,
    wakes: readLines(join(stateDir, "wake_queue.jsonl")).length,
    brain_calls: ledger.length,
    pulses: ledger.filter(r => r.job === "haiku_pulse").length,
    // WIRING AUDIT (10 Aug 2026) — THE HONESTY FLAG NOBODY READ. claudegen.mjs:137
    // stamps `tokens_estimated` on every result, because :132 falls back to a LENGTH
    // ESTIMATE — (prompt+text).length/4 — whenever the CLI returns no usage block,
    // and parseErr ALWAYS does. brain.mjs windowUsage:256 then sums total_tokens
    // BLIND: unstamped, a guess and a measurement are the same row to the governor
    // that rations the window (and to window_capacity_est_tokens, which self-tunes
    // against that same arithmetic — see BUDGETS below). Producer with no consumer,
    // exactly the cal_gate shape repaired below. Measured this night: 4,559 rows →
    // 1,320 stamped, 3,239 carrying no such key at all, and 23 rows with a nonzero
    // total and all four components null (an estimate by construction, stamped or
    // not). COUNTS ONLY — nothing here judges the number or sets a bar; it exposes
    // how much of the window's arithmetic rests on a guess, which is this file's job.
    brain_calls_estimated: ledger.filter(r => r.tokens_estimated === true).length,
    brain_calls_unstamped: ledger.filter(r => !("tokens_estimated" in r)).length,
    // WIRING AUDIT (11 Aug 2026) — WHICH CLI THE ORGANS ACTUALLY BOOTED. Same shape,
    // same door, same day as the flag above. claudegen.mjs picks between the LEAN
    // invocation (G0: --system-prompt + --tools "" + --strict-mcp-config, measured
    // 88.5% off a bare probe) and the full CLI, and it picked SILENTLY: the fallback
    // is not a config key he can open, it is `existsSync(%APPDATA%\npm\claude.cmd)`
    // — an INSTALLATION. Reinstall the CLI via npm and every organ on that door
    // (nightshift · dmn · council · thalamus) reverts to the full boot tax with
    // nothing anywhere able to name why spend tripled; spend itself cannot say it,
    // because a row that costs 3× looks the same whether the model thought harder or
    // the tax came back. claudegen now names the lane on every result and projects
    // it through ledgerForensics; these two counters are its first and only reader.
    // NO `unstamped` COUNTER HERE, deliberately, and unlike the pair above: brain.mjs
    // does NOT ride this door — it has its own claudeExec with its own LEAN_ARGS and
    // its own switch (budget.lean_calls, a key he can read in brain_config.json), so
    // an unstamped count would have a permanent floor that is not a defect, and this
    // table's whole job is to not print a number that reads as a failing.
    // COUNTS ONLY, no verdict: `full_cli` above 0 is not automatically wrong (he can
    // set ARSENAL_CLAUDEGEN_FULL=1 himself) — it is the thing that must be VISIBLE.
    brain_calls_lean: ledger.filter(r => r.arg_profile === "lean").length,
    brain_calls_full_cli: ledger.filter(r => typeof r.arg_profile === "string" && r.arg_profile !== "lean").length,
    // KEPT (layering law) — this is what the twin gate USED to be judged against,
    // wrongly. It is a real number about a real file (voice take_notes), it is
    // just not the twin's denominator. See twin_resolutions_best_type below.
    voice_resolutions: readLines(join(stateDir, "dugout_notes.jsonl")).length,
    // AUDIT #78 (4 Aug 2026) — THE TWIN MAPPING WAS WRONG.
    // `gates.twin_voice_min_resolutions` was printed next to dugout_notes.jsonl's
    // line count. Those are the Dugout's take_note writes — a voice feature that
    // has nothing to do with the twin. physio.mjs:456-457 computes the real
    // denominator: rows of slip.jsonl where book === "twin" && resolved, collapsed
    // last-wins per (book|type|date|claim) so an appended correction cannot pay the
    // gate twice (physio.mjs:93-97, E2E audit 25 Jul), counted PER CLAIM-TYPE, and
    // the gate opens when ANY ONE type reaches the threshold (physio.mjs:480 uses
    // .some, :502 takes the max). So the honest "have" is the best single type —
    // which is why this reads the max, not the total. Replicated here rather than
    // imported because limits.mjs must stay a read-only observer with no importers.
    twin_resolutions_best_type: twinBestType(readLines(join(stateDir, "slip.jsonl"))),
    throwins: readLines(join(stateDir, "loose_balls.jsonl")).length,
    // AUDIT (10 Aug 2026) — THE PUBLISHED CALIBRATION COUNTER, finally read.
    // calibration.mjs:264-279 buildGate() computes have/need for ALL THREE of its
    // gates and writes them into calibration.json (`gate` + `gate.sub`). Nothing in
    // the organism read that field — a producer with no consumer — so this ledger
    // re-derived the answer from the raw rep count and got it wrong: on 10 Aug it
    // printed `window_size 21/20 OPEN` on the same morning calibration.json wrote
    // "establishing baseline (21/40 reps)" and its own gate.sub said trend
    // {have:21, need:40, open:false}. Same shape as the #78 twin repair below —
    // read what the OWNER computed, never re-guess the owner's arithmetic here.
    // Object, not a scalar: `human()` skips it and the GATES table displays it.
    cal_gate: (readJson(join(stateDir, "calibration.json")) || {}).gate || null,
    // WIRING AUDIT (11 Aug 2026) — THE SWALLOWED LINE, read where it contradicts something.
    // calibration.mjs's loader dropped every unparseable and every invalid reps_log line
    // behind a bare `catch { /* skip */ }` with no count, no reason and no published field:
    // total_reps and `N/20 reps` rode the survivors and said so nowhere. It counts and
    // publishes now (calibration.json `corpus`), and THIS is the row that makes the count
    // mean something, because `reps` at the top of this same ledger is the RAW line count of
    // reps_log.jsonl — and four GATES rows (nemesis · learning_state ×3 · boot room · signal
    // table) are judged against it. The day those two numbers disagree, one of the two
    // denominators in this table is wrong, and until today nothing anywhere could see it.
    // ABSENT IS NOT ZERO, the same law as the lexicon counters above: a calibration.json
    // written before the block existed, or never written at all, reads null and prints
    // "null" — reporting "0 dropped" for a read that in fact threw lines away is precisely
    // the lie both organs are written against.
    // COUNTS AND REASONS ONLY, NO REP TEXT — reps_log is gitignored derived study data, so
    // only the producer's own field-name reasons come back out of here, joined into one
    // scalar so the ledger's WHAT-HE-ACTUALLY-HAS table can print them beside the count.
    cal_reps_used: (() => { const c = (readJson(join(stateDir, "calibration.json")) || {}).corpus; return c && Number.isFinite(c.reps_used) ? c.reps_used : null; })(),
    cal_reps_dropped: (() => { const c = (readJson(join(stateDir, "calibration.json")) || {}).corpus; return c && Number.isFinite(c.dropped) ? c.dropped : null; })(),
    cal_reps_dropped_why: (() => {
      const c = (readJson(join(stateDir, "calibration.json")) || {}).corpus;
      if (!c || !c.reasons || !c.dropped) return null;          // null = nothing dropped, or nothing measured
      return Object.entries(c.reasons).map(([why, n]) => `${n}× ${why}`).join(" · ");
    })(),
    // WIRING AUDIT (11 Aug 2026) — IS THAT NEED EVEN HIS? The three rows above read
    // calibration's published have/need and print them straight, and until today a
    // DISCARDED edit was indistinguishable from an honoured one. calibration.mjs
    // normalizeConfig() numOr-clamps every non-numeric leaf of calibration_config.json
    // to its built-in DEFAULTS — proven: normalizeConfig({min_reps:"12"}) → 20 — and
    // published nothing about it, while that config's own _comment invites him to
    // retune ("A deliberate SEED, not sacred"). So the day he types "12" instead of
    // 12, this ledger prints `min_reps 21 20 OPEN` and he reads 20 as HIS NUMBER.
    // That is worse than the unread counters below: not a missing measurement, an
    // ACTIVELY WRONG one, in the one table whose entire job is to say where a number
    // came from. calibration.mjs now publishes the config read as `config`; this is
    // its consumer. Object, not a scalar, so `human()`'s ledger skips it — it prints
    // on the GATES rows it invalidates, which is the only place it means anything.
    cal_config: (readJson(join(stateDir, "calibration.json")) || {}).config || null,
    // WIRING AUDIT (11 Aug 2026) — the distiller's switch-to-read journal, read
    // at last. Same shape and same reason as cal_gate directly above: an object,
    // so `human()`'s scalar ledger skips it and the CADENCES table prints it on
    // the one row it judges — the distiller's own. See distillerLatency().
    distiller_latency: distillerLatency(readLines(join(stateDir, "distiller_latency.jsonl"))),
    // Phase 6 (14 Aug 2026): the physio gate rows read their bar from HERE — the
    // same file physio.mjs merges over its DEFAULTS — instead of a literal copy.
    physio_config: readJson(join(stateDir, "physio_config.json")),
    // BLOCK 2 of the overhaul (18 Aug 2026): the four sibling configs whose gates this
    // table used to MIRROR as literals (`need: 20`, `need: 12`, `need: 60` …). A mirror
    // rots the moment the owner's file moves — and today every one of them moved. Read
    // the owner's file, exactly as physio_config has been read since 14 Aug.
    nemesis_config: readJson(join(stateDir, "nemesis_config.json")),
    learning_state_config: readJson(join(stateDir, "learning_state_config.json")),
    doubtminer_config: readJson(join(stateDir, "doubtminer_config.json")),
    twin_config: readJson(join(stateDir, "twin_config.json")),
  };
}

// One sub-gate out of calibration's published counter, BY NAME. Returns null when
// the producer has not run — a "?" row is the honest read, and a number invented
// here would be exactly the lie this file exists to catch. `__root__` is the
// top-level gate (calibration.mjs:267-269), which is the min_reps/danger_zone one.
export function calGateRead(calGate, name) {
  if (!calGate) return null;
  if (name === "__root__") {
    return Number.isFinite(calGate.have) && Number.isFinite(calGate.need) ? { have: calGate.have, need: calGate.need } : null;
  }
  const s = Array.isArray(calGate.sub) ? calGate.sub.find((x) => x && x.name === name) : null;
  return s && Number.isFinite(s.have) && Number.isFinite(s.need) ? { have: s.have, need: s.need } : null;
}
const calHave = (name) => (m) => { const g = calGateRead(m.cal_gate, name); return g ? g.have : null; };
const calNeed = (name) => (m) => { const g = calGateRead(m.cal_gate, name); return g ? g.need : null; };

// ── THE PHYSIO GATES, READ LIVE (14 Aug 2026, unleash Phase 6) ──────────────
// These four rows hardcoded their `need` as a literal (200 / 30 / 8 / 84), which
// is the exact defect this file exists to catch, one level up: physio.mjs merges
// physio_config.json over its DEFAULTS on every run, so the moment a gate was
// tuned this table went on printing the OLD bar — and printed SHUT beside an
// organ that had just been opened. Found by tuning three of them and watching
// the table not move. Same rule as the calibration rows above: the number comes
// from where the ORGAN reads it, never from a copy kept here. Dotted path, so
// `gates.apni_ghadi.min_cards` resolves without a translation table to rot.
// Falls back to physio.mjs's own DEFAULTS literal when the config file is
// missing or the leaf is not a number — the same value physio itself would use.
const physioNeed = (path, fallback) => (m) => {
  const cfg = m.physio_config;
  let v = cfg && cfg.gates;
  for (const k of String(path).split(".")) { if (!v || typeof v !== "object") { v = null; break; } v = v[k]; }
  return Number.isFinite(v) ? v : fallback;
};
// The same shape for any owner config this ledger carries (BLOCK 2, 18 Aug 2026):
// `cfgNeed("nemesis_config", "warming_up_min_reps", 20)` reads the OWNER's file off
// `measure`, and falls back to the organ's own code DEFAULT only when the file is
// missing — never to a number this table typed. Dotted paths walk nested objects.
// A BUDGETS row's `value` read off the owner's file — resolved at build() time against
// `measure`, so a table cell is never a stale copy of a config the owner has moved.
function cfgValue(cfgKey, path, fallback) { return { __cfg: cfgKey, path, fallback }; }
const cfgNeed = (cfgKey, path, fallback) => (m) => {
  let v = m[cfgKey];
  for (const k of String(path).split(".")) { if (!v || typeof v !== "object") { v = null; break; } v = v[k]; }
  return Number.isFinite(v) ? v : fallback;
};

// The discard, if any, behind ONE calibration knob. The GATES rows are keyed by the
// very path calibration.mjs journals ("min_reps" · "window_size" ·
// "danger.min_knew_reps"), so the two line up without a translation table to rot.
// Null when the producer never ran, when it published no block (a pre-11-Aug
// calibration.json), or when the leaf was honoured — never a manufactured "fine".
export function calConfigRejected(calConfig, key) {
  if (!calConfig || !Array.isArray(calConfig.rejected)) return null;
  return calConfig.rejected.find((r) => r && r.key === key) || null;
}

// The twin's real denominator, as a PURE function of the slip lines, so the
// selftest can prove it on a fixture without this read-only file ever opening a
// writer. Mirrors physio.mjs:93-97 (lastWinsSlip) + :457 (filter) + :502 (max).
export function twinBestType(slipLines = []) {
  const lastWins = new Map();
  for (const line of slipLines) {
    let s; try { s = JSON.parse(line); } catch { continue; }
    if (!s || s.book !== "twin" || !s.resolved) continue;
    lastWins.set(`${s.book}|${s.type}|${s.date}|${s.claim}`, s);   // last row for a day+claim wins
  }
  const perType = {};
  for (const s of lastWins.values()) perType[s.type] = (perType[s.type] || 0) + 1;
  const counts = Object.values(perType);
  return counts.length ? Math.max(...counts) : 0;   // the gate opens on ONE type, not the sum
}

// ---- THE REP→REVIEW COLLAPSE (wiring audit, 11 Aug 2026) -------------------
// The reading behind the BUDGETS row "rep→review collapse unit". Pure, so the
// selftest can prove it on fixtures without this read-only file ever opening a
// writer — same construction as twinBestType above and distillerLatency below.
//
// IT READS, IT DOES NOT RE-DERIVE. `line` is taken VERBATIM from cards.json,
// because re-computing the owner's arithmetic here is precisely how this table
// came to print `window_size 21/20 OPEN` on the morning calibration.json said
// 21/40 (see cal_gate). fsrs.mjs is the only writer of both files; this is a copy
// of its sentence, not a second opinion.
//
// COUNTS ONLY, NO CONCEPT NAMES — deliberately, and for the distiller journal's
// reason: cards.json and fsrs_store.json are BOTH gitignored ("derived personal
// study data: concepts + schedule", .gitignore:56), so only numbers come back out
// of here. That is why the per-card half reports how many cards carry a merge and
// the largest single merge, rather than naming them the way the lexicon row names
// dropped_by_cap (lexicon.json is not ignored).
//
// ABSENT IS NOT ZERO. Producer never ran ⇒ null, and the table prints "?". A
// pre-#24 cards.json with no `collapse` block reads null per field, never 0 —
// reporting "0 merged" for a policy that in fact merged 15 of his 27 reps is the
// exact lie the counter was built to end.
export function fsrsCollapse(cards, store) {
  const c = cards && typeof cards === "object" && cards.collapse ? cards.collapse : null;
  const hasStore = !!(store && Array.isArray(store.cards));
  if (!c && !hasStore) return null;                       // neither producer output on disk
  const rows = hasStore ? store.cards.filter(Boolean) : [];
  const merges = rows.map(r => r.collapsed).filter(Number.isFinite);
  const num = (v) => (Number.isFinite(v) ? v : null);
  return {
    unit: c && c.unit != null ? String(c.unit) : null,
    rating: c && c.rating != null ? String(c.rating) : null,
    raw_reps: c ? num(c.raw_reps) : null,
    review_events: c ? num(c.review_events) : null,
    collapsed: c ? num(c.collapsed) : null,
    line: c && c.line ? String(c.line) : null,            // the owner's own sentence, verbatim
    cards_total: hasStore ? rows.length : null,
    cards_merged: merges.length ? merges.filter(n => n > 0).length : null,
    worst_card_merged: merges.length ? Math.max(...merges) : null,
    on: cards && cards.date ? String(cards.date) : null,
  };
}

// ---- THE DISTILLER'S SWITCH-TO-READ LATENCY (wiring audit, 11 Aug 2026) ----
// The THIRD producer-with-no-consumer this ledger has adopted, after cal_gate
// and tokens_estimated (both 10 Aug 2026, both below). distiller.mjs has
// journalled every context-switch it caught into distiller_latency.jsonl since
// the G16 sliver (10 Aug 2026) — 64 rows on the day this was wired — and the
// ONLY address that measurement had in the whole organism was a note STRING on
// the distiller CADENCE row telling a reader to run `node scripts/distiller.mjs
// latency` by hand. THE ANCHOR LAW forbids exactly that ("never a command to
// remember"), so the counter built to retire this table's own `15min / guessed`
// row could not reach the table, or him. It does now: the row carries the reading.
// REPLICATED, not imported, for the same reason twinBestType above is — this file
// keeps zero importers and imports no organ. It is deliberately only the
// AGGREGATION half of distiller.mjs latencyReport(): the journal's ROWS are the
// contract between the two files, and the arithmetic here is min/median/mean/max
// over their `switches[].lag_ms`. Lower median (`(n-1) >> 1` after an ascending
// sort) is taken verbatim from the owner — a counter, not a statistic dressed up.
// NO VERDICT, NO THRESHOLD, and NO APP NAMES: the journal is gitignored because
// its rows name his apps, so only counts and lags come back out of here. The
// 15-min value stays tagged `guessed` until the captain reads this data and
// rules — his 30-45-60-day standing rule, which is this file's reason to exist.
export function distillerLatency(lines = []) {
  const rows = [];
  for (const l of lines) { try { rows.push(JSON.parse(l)); } catch { /* one bad row must not poison the read */ } }
  const all = rows.flatMap(r => (r && Array.isArray(r.switches) ? r.switches : []).map(s => s && s.lag_ms))
    .filter(Number.isFinite).sort((a, b) => a - b);
  return {
    runs: rows.length, switches: all.length,
    min_ms: all.length ? all[0] : null,
    median_ms: all.length ? all[(all.length - 1) >> 1] : null,
    mean_ms: all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : null,
    max_ms: all.length ? all[all.length - 1] : null,
    span: rows.length ? `${String(rows[0].ts).slice(0, 10)} → ${String(rows[rows.length - 1].ts).slice(0, 10)}` : null,
  };
}

// ---- THE GATES: numbers that decide whether an organ may SPEAK AT ALL -------
// Each carries the LIVE reading it is judged against, so "shut" is a fact, not a claim.
export const GATES = [
  // ── BLOCK 2 of the overhaul (18 Aug 2026), §5.4 made mechanical ─────────────
  // Every row now carries a CLASS beside its origin, because "guessed" alone conflated
  // three different kinds of number: a GATE (may the organ speak at all), a WINDOW (how
  // far back / how much of the stream — his 1 Aug ruling permits a guessed window) and a
  // DEFINITION (what a word MEANS: "held" = 2 in a row; a pattern = ≥2 concepts). The
  // rule the DoD asserts below: NO gate and NO budget may be `guessed`. Every speak-gate
  // that WAS a guessed volume bar was OPENED to its arithmetic floor (1 — you cannot
  // compute on an empty set) in the OWNER's config file, each with an
  // `_opened_2026_08_18` note; origin `opened` records that a human ruling did it, on
  // which day, and that `n` is now printed instead of a wall. `derived` = arithmetic.
  // NEED IS READ OFF THE OWNER'S FILE — the literals this table used to mirror rotted the
  // morning the owners moved.
  { organ: "calibration",   file: "calibration.mjs",   key: "min_reps",                    need: calNeed("__root__"),             have: calHave("__root__"),             origin: "opened", cls: "gate", effect: "calibration_gap + the overconfidence read, on what he has (n printed)" },
  { organ: "calibration",   file: "calibration.mjs",   key: "window_size",                 need: calNeed("trend"),                have: calHave("trend"),                origin: "guessed", cls: "window", effect: "trend WINDOW — the trend needs 2 × window_size reps (a lookback, not a wall)" },
  { organ: "calibration",   file: "calibration.mjs",   key: "danger.min_knew_reps",        need: calNeed("danger.min_knew_reps"), have: calHave("danger.min_knew_reps"), origin: "derived", cls: "gate", effect: "danger-zone topics need ≥1 KNEW-rep to exist — arithmetic" },
  { organ: "calibration",   file: "concepts.json",     key: "registry — concepts.json must parse", need: calNeed("registry"),     have: calHave("registry"),             origin: "derived", cls: "gate", effect: "aliases stop collapsing: the danger zone and the knew-gate both UNDER-read, and an empty danger_zone reads as acquittal" },
  { organ: "nemesis",       file: "nemesis.mjs",       key: "warming_up_min_reps",         need: cfgNeed("nemesis_config", "warming_up_min_reps", 20),  have: (m) => m.reps,     origin: "opened", cls: "gate", effect: "the weakness headline reaches the sheet on what he has (n printed)" },
  { organ: "nemesis",       file: "nemesis.mjs",       key: "axis_cluster_min_concepts",   need: cfgNeed("nemesis_config", "axis_cluster_min_concepts", 3), have: (m) => m.capsules, origin: "derived", cls: "definition", effect: "a cross-concept PATTERN is plural — ≥2 concepts on one axis" },
  { organ: "learning_state",file: "learning_state.mjs",key: "thresholds.warming_up_min_reps", need: cfgNeed("learning_state_config", "thresholds.warming_up_min_reps", 12), have: (m) => m.reps, origin: "opened", cls: "gate", effect: "fluency state + maidan focus, on what he has (n printed)" },
  { organ: "learning_state",file: "learning_state.mjs",key: "thresholds.held_streak",      need: cfgNeed("learning_state_config", "thresholds.held_streak", 2),   have: (m) => m.reps, origin: "guessed", cls: "definition", effect: "the LADDER's word: 🟡 held = this many consecutive correct" },
  { organ: "learning_state",file: "learning_state.mjs",key: "thresholds.fluent_streak",    need: cfgNeed("learning_state_config", "thresholds.fluent_streak", 3), have: (m) => m.reps, origin: "guessed", cls: "definition", effect: "the LADDER's word: 🟢 fluent = this many consecutive cold-fast" },
  { organ: "doubtminer",    file: "doubtminer.mjs",    key: "gates.min_capsules",          need: cfgNeed("doubtminer_config", "gates.min_capsules", 4),  have: (m) => m.capsules, origin: "opened", cls: "gate", effect: "doubt clustering over what exists (gate_line prints n)" },
  { organ: "doubtminer",    file: "doubtminer.mjs",    key: "gates.min_doubts",            need: cfgNeed("doubtminer_config", "gates.min_doubts", 60),   have: (m) => m.doubts,   origin: "opened", cls: "gate", effect: "doubt clustering over what exists (gate_line prints n)" },
  { organ: "doubtminer",    file: "doubtminer.mjs",    key: "lexicon.min_count",           need: cfgNeed("doubtminer_config", "lexicon.min_count", 2),   have: (m) => m.capsules, origin: "derived", cls: "definition", effect: "an anchor is a phrase that RECURS — once is not recurring" },
  { organ: "doubtminer",    file: "doubtminer.mjs",    key: "tape_room.min_age_days",      need: cfgNeed("doubtminer_config", "tape_room.min_age_days", 14), have: (m) => m.span_days, origin: "guessed", cls: "window", effect: "rematch spacing WINDOW — a doubt too fresh is not a rematch" },
  { organ: "boot room",     file: "physio.mjs",        key: "gates.bootroom_min_reps",     need: physioNeed("bootroom_min_reps", 200), have: (m) => m.reps,              origin: "opened", cls: "gate", effect: "the genome proposes on evidence-proportional n (each mutation still carries its own metric.min_events + auto-extending window)" },
  // #78: `have` was m.voice_resolutions (dugout_notes.jsonl lines) — the wrong file
  // entirely. It now reads the same thing physio.mjs:457/:502 counts.
  { organ: "twin",          file: "physio.mjs",        key: "gates.twin_voice_min_resolutions", need: physioNeed("twin_voice_min_resolutions", 30), have: (m) => m.twin_resolutions_best_type, origin: "opened", cls: "gate", effect: "the cold-start gag is now 'beats base rate over what it has' (win-only law untouched; twin_config.voice_min_resolutions moved with it)" },
  { organ: "apni ghadi",    file: "physio.mjs",        key: "gates.apni_ghadi.min_cards",  need: physioNeed("apni_ghadi.min_cards", 8),   have: (m) => m.capsules,          origin: "opened", cls: "gate", effect: "personal-interval calibration on what he has (min_reps_per_card 4 = the definition of a matured card)" },
  { organ: "body archive",  file: "physio.mjs",        key: "gates.body_archive_min_days", need: physioNeed("body_archive_min_days", 84),  have: (m) => m.span_days,         origin: "external", cls: "gate", effect: "seasonal body baseline — 12 weeks is a real physiological window" },
  { organ: "signal table",  file: "physio.mjs",        key: "signal_table.min_n",          need: cfgNeed("physio_config", "signal_table.min_n", 20),  have: (m) => m.reps,   origin: "opened", cls: "gate", effect: "per-signal reliability table on what he has — brier/hit-rate land at n≥1, n printed" },
  // WIRING AUDIT (11 Aug 2026) — fsrs published an ungate counter (audit #106) that
  // no organ read. Reads the PRODUCER's have/need, exactly as the calibration rows
  // do; no cards.json ⇒ both read "?" and the row prints "  ?  ", never an invented
  // number. ORIGIN `derived`, not `guessed`: fsrs.mjs's need is 1 because you cannot
  // rank an empty set — arithmetic, not a typed threshold — and the CADENCES table
  // already defines `derived` as exactly that. Tagging it `guessed` would put a
  // false row on his 30-45-60-day re-fit list, which is the failure this table exists
  // to prevent (the bundle already caught two rows mis-tagged the other way).
  { organ: "fsrs",          file: "fsrs.mjs",          key: "gate.need — one card must exist", need: (m) => (m.fsrs_gate ? m.fsrs_gate.need : null), have: (m) => (m.fsrs_gate ? m.fsrs_gate.have : null), origin: "derived", cls: "gate", effect: "no due_today, no overdue, no hardest_due — the decay guard says nothing" },
  // THE THALAMUS WAKE BAR moved to GUARDS (18 Aug 2026): tau1 is a headroom-coupled
  // spend guard (tau1_eff = tau1_base + budget_k × (1 − headroom)) under a hard
  // wake_cap_per_day — it stops ONE failure repeating (Opus woken on reflex until the
  // window is gone), which is this table's definition of a guard, and its live cost is
  // measured beside it there. It was never a "may the organ speak" gate.
];

// ---- BUDGETS: numbers that cap SPEND ---------------------------------------
export const BUDGETS = [
  // ── BLOCK 2 of the overhaul (18 Aug 2026), §5.4: NO budget may be `guessed`. ─────
  // Each former guess was re-read against what it actually IS in the code that holds it:
  //   · the two pulse "caps" are GUARDS by brain.mjs's own words ("NOT a budget — a
  //     runaway-loop backstop"; "FLOOR DERIVED, NOT GUESSED (#66)") → moved to GUARDS;
  //   · daily_token_frac is a MEASUREMENT WINDOW ("not a guessed cap") on a lane HE
  //     stopped 15 Aug ("stop the pulse right now") — a window, allowed guessed;
  //   · gemini_defer_threshold_min is a WINDOW of voice minutes — allowed guessed;
  //   · day_reserve / overnight_target are the plan's own Block-9 numbers: "read after
  //     7 real days; then set defaults from data (his 1 Aug law), never before" → the
  //     ledger's existing `measured-pending` class, with the exact read named;
  //   · the lexicon cap was OPENED (25 → 0 = none) — his voice is not a budget.
  { name: "pulse daily token budget",  where: "brain.mjs pulseConfig.daily_token_frac",       value: 0.10,     origin: "guessed",  cls: "window", note: "a MEASUREMENT WINDOW, not a cap (brain_config pulse._measurement_window_note): what share of the weekly plan the pulse may observe with. The lane is STOPPED by his word since 15 Aug (pulse.enabled=false), so it meters nothing today; G14 unpauses it as a pure instrument. Was 0.05 (1 Aug); doubled 2 Aug." },
  { name: "window capacity estimate",  where: "brain_config.budget.window_capacity_est_tokens", value: 1600000, origin: "measured", note: "SELF-TUNES from observed limit events (observed_window_ceiling); DOUBLED 9 Aug 2026 (P1 unleash, his word) for the doubled plan" },
  { name: "weekly capacity estimate",  where: "brain_config.budget.weekly_capacity_est_tokens", value: 24000000, origin: "external", note: "the Claude Max plan's real wall — not ours to choose; DOUBLED 9 Aug 2026 (P1 unleash) for the doubled plan" },
  { name: "day reserve fraction",      where: "brain_config.budget.day_reserve_frac",         value: 0.4,      origin: "measured-pending", note: "how much of the window is held back during his study hours. BLOCK 9 (ORGANISM_OVERHAUL §15/§16): set from the ledger's 7-real-day read — day-window spend vs the sitting_log contact_share the sitting brain will publish (a `measure` lands on this row the day sitting_log exists) — never before, never by guess. Until then the 9 Aug value stands as the working number, tagged as waiting on that read." },
  { name: "overnight target fraction", where: "brain_config.budget.overnight_target_frac",    value: 0.95,     origin: "measured-pending", note: "how hard the night is allowed to run. BLOCK 9: the dark-lane share of the same 7-real-day ledger read against overnight.reserve (§10 says the night is THREE jobs now); set from that data, in the same commit as this row." },
  { name: "gemini defer threshold",    where: "brain_config.dugout_pool.gemini_defer_threshold_min", value: 30, origin: "guessed", cls: "window", note: "a WINDOW of live-voice minutes before daytime gemini jobs step aside (they run overnight regardless) — a lookback, not a spend cap; the sitting brain (§6) retires the Gemini brain lane it protects" },
  // 11 Aug 2026 — this row exists because the knob had NO address at all: the 25
  // was a literal inside doubtminer.mjs's keep-loop, so the config sweep could not
  // see it, this table could not carry it, and the lexicon's own output never said
  // it had fired. It caps SPEND in the truest sense here — the anchors ride the
  // cognitive fingerprint at the head of EVERY LLM call (brain.mjs buildFingerprint,
  // the Gaffer's system prompt via dugout.mjs + talk.mjs) — but its real cost was
  // his voice: on 11 Aug it silently cut 20 of 45 mined anchors, "kv cache" (23×,
  // 2× the top survivor) among them, because the cut ran in DEDUP order (longest
  // phrase first) instead of by recurrence. The ordering was repaired 11 Aug; the
  // NUMBER was OPENED 18 Aug 2026 (Block 2): max_anchors 0 = no cap, every mined
  // anchor ships, the connective filter + min_count remain the guards. The measure
  // beside it now reads dropped 0 — the receipt that the cap is gone.
  { name: "lexicon anchor cap",        where: "doubtminer_config.json lexicon.max_anchors",   value: cfgValue("doubtminer_config", "lexicon.max_anchors", 25), origin: "opened", note: "0 = NO CAP (18 Aug 2026): how many of his mined anchors reach every prompt — all of them. What a cap CUT is named in lexicon.json dropped_by_cap and READ here, so the receipt travels with the number",
    measure: (m) => m.lexicon_anchors == null ? null : {
      shipped: m.lexicon_anchors, mined: m.lexicon_anchors_mined,
      dropped: m.lexicon_dropped_by_cap, connectives: m.lexicon_connectives_filtered, on: m.lexicon_date } },
  // WIRING AUDIT (11 Aug 2026) — the same defect as the lexicon cap directly above,
  // one organ over. This knob caps SPEND in the only currency the learning layer has:
  // how much of the work he actually logged reaches the scheduler. On 10 Aug it cut
  // 27 reps to 12 review events — 15 merged, 56% of what he logged — and that
  // arithmetic, which fsrs.mjs itself calls "a printed number and not an inference",
  // reached fsrs's stdout and NOTHING ELSE. It is read here now, verbatim.
  // ORIGIN `external` on the owner's own evidence, not on a shrug: fsrs.mjs's THE
  // REVIEW UNIT (:290) shows ts-fsrs floors the millisecond gap to whole days, so two
  // reviews inside one day carry elapsed_days = 0 and are arithmetically incapable of
  // carrying interval information — "the unit is read off the algorithm's own
  // resolution, not chosen". That is a wall we do not own, which is this table's
  // definition of external. The DIRECTION (`worst`) is ours and is a documented
  // choice, not a measured number — it is named in the value so it cannot hide behind
  // the tag. Nothing here judges the 56%: whether that much merging is right is HIS
  // read on his 30-45-60-day rule, which is this file's whole reason to exist.
  { name: "rep→review collapse unit",  where: "fsrs.mjs CFG.review_unit + collapse_rating",   value: "local_day/worst", origin: "external", note: "how much of what he LOGGED becomes a review FSRS can schedule from. Same-day reps merge to one event at the day's worst grade; the pre-audit per-rep replay is frozen as buildStoreLegacy (review_unit \"none\"). What it MERGED is published in cards.json collapse + fsrs_store per-card — and READ here rather than pointed at, so the policy's cost arrives with the policy",
    measure: (m) => m.fsrs_collapse },
  { name: "metacognition night fraction", where: "brain_config jobs.diary._metacognition_note", value: "unset", origin: "measured-pending", note: "H2/H6 (10 Aug 2026): NO cap set — the measurement window is open (ledger rows job∈{agenda,diary} ÷ overnight total, the G14 pulse pattern); when measured, the fraction + any cap land here AND in that _note in the same commit" },
];

// ---- GUARDS: not budgets. They stop ONE identical failure repeating forever. --
export const GUARDS = [
  { name: "max attempts per shift",   where: "brain_config.guards.max_attempts_per_shift", value: 3,      earned: "25 Jul: a deterministically-failing job re-ran ~1150x/day at full model cost" },
  { name: "pulse failure backoff",    where: "brain.mjs pulseConfig.max_consecutive_failures", value: 3,   earned: "21 Jul: 164 failures burned all 200 slots on a logged-out CLI" },
  { name: "bell grace window",        where: "brain.mjs BELLS.fulltime.grace_min",         value: 75,     earned: "29 Jul: the 21:30 bell fired at 15:23 as schtasks catch-up" },
  { name: "step timeout",             where: "conductor.mjs STEP_TIMEOUT_MS",              value: 180000, earned: "a hung organ must not eat the morning" },
  { name: "heartbeat timeout",        where: "heartbeat.mjs timeout_ms",                   value: 120000, earned: "" },
  { name: "sheet line cap",           where: "manager.mjs LINE_CAP",                       value: 40,     earned: "one glance = one story; a 200-line sheet is not a sheet" },
  // BLOCK 2 (18 Aug 2026) — three rows that were filed as guessed GATES/BUDGETS and are
  // guards by the owning code's own words:
  { name: "pulse daily call cap",     where: "brain.mjs pulseConfig.daily_cap",            value: 200,    earned: "21 Jul: a runaway pulse loop — brain.mjs calls it 'NOT a budget — a runaway-loop backstop, one of the two permitted exceptions'; post-lean it binds first (2.4M/1.1k ≈ 2,180 » 200), which is backstop work. Lane STOPPED by his 15 Aug word anyway." },
  { name: "pulse min headroom",       where: "brain.mjs pulseConfig.min_headroom_tokens",  value: 20000,  earned: "2 Aug audit #66: 'FLOOR DERIVED, NOT GUESSED' — the live floor is max(20,000, the measured deep-read headroom); it stops a pulse from spending the last of the window a sitting needs" },
  { name: "thalamus wake bar (tau1)", where: "thalamus_config.tiers (tau1_base + budget_k × (1 − headroom)) under wake_cap_per_day", value: "0.20 + 0.35·(1−h) · cap 15/day", earned: "the Tier-2 wake bar stops Opus being woken on reflex until the window is gone (853 pulses → 0 wakes was the OTHER failure, fixed 4 Aug by the measured pulse base-rate). Live 18 Aug (salience_ledger, 2,447 moments since 11 Aug): S p50 0 · p90 0.20 · p97 0.32 · p99 0.37 · max 0.65 · 13 tier-2 wakes lifetime · 2/15 today. Blocks 3/5 change the game: the sitting brain puts Opus IN the conversation and cortex/council wake only with no sitting open." },
];

// ---- LADDER G5 (9 Aug 2026) — CADENCES: every timer the organism runs on, ----
// with its provenance. ZERO rows existed before this; every cadence was a
// number someone typed once and nobody could audit. origin ∈ measured (from a
// live observation) · derived (arithmetic from another number, shown) · ruled
// (his word or an approved-plan number) · guessed (typed on a vibe — the ones
// to re-fit first). Timer changes update this table IN THE SAME COMMIT.
export const CADENCES = [
  { name: "brain daemon beat",        where: "brain_config.daemon.poll_ms",              value: "15s",        origin: "ruled",    note: "G5 (approved ladder) — was fallback 75000ms; :2771 re-read makes the config value live" },
  { name: "pulse spacing",            where: "brain.mjs pulseConfig.min_spacing_s",      value: "150s",       origin: "derived",  note: "2 old beats × 75s — pinned in SECONDS so a faster pacer cannot quintuple the pulse (G5 coupling fix)" },
  { name: "BrainTick fallback",       where: "schtasks ArsenalFC-BrainTick",             value: "30min",      origin: "guessed",  note: "lock-coordinated fallback when the daemon is down" },
  { name: "morning conductor",        where: "schtasks ArsenalFC-Morning-Conductor",     value: "09:15",      origin: "ruled",    note: "his 7 Aug word" },
  { name: "evening conductor",        where: "schtasks ArsenalFC-Evening-Conductor",     value: "22:00",      origin: "ruled",    note: "the Bell's hour is HIS (D1)" },
  { name: "daemon watchdog",          where: "schtasks ArsenalFC-Daemon-Watchdog",       value: "10min",      origin: "guessed",  note: "D2 — probe + VBS relaunch; resync one pass after thalamus answers" },
  { name: "groundsman push",          where: "schtasks ArsenalFC-Groundsman-Push",       value: "03:45",      origin: "derived",  note: "after the night writers (02:40/03:00), before the sentinel's 10:30 read (D3)" },
  { name: "wake probe",               where: "schtasks ArsenalFC-WakeProbe",             value: "03:52",      origin: "derived",  note: "inside the night lane it measures; WakeToRun, NO catch-up (E1/F14)" },
  { name: "timeaudit pulse",          where: "schtasks ArsenalFC-TimeAuditor-Pulse",     value: "12/15/18h",  origin: "ruled",    note: "the 3-bucket day split (ORGANISM_CLOCK.md:48)" },
  { name: "timeaudit full",           where: "schtasks ArsenalFC-TimeAuditor-Full",      value: "22:00",      origin: "guessed",  note: "day's end read" },
  { name: "capture pull",             where: "schtasks ArsenalFC-CapturePull",           value: "60min",      origin: "guessed",  note: "" },
  { name: "wall live render",         where: "schtasks ArsenalFC-Wall-Live",             value: "30min",      origin: "guessed",  note: "" },
  { name: "dugout reminders task",    where: "schtasks ArsenalFC-DugoutReminders",       value: "1min",       origin: "derived",  note: "G6 — reconciled to dugout.mjs:3371's own 30000ms in-process interval (was 30min: a task 60× slower than the code it mirrors)" },
  { name: "shadow detect task",       where: "schtasks ArsenalFC-ShadowDetect",          value: "10min",      origin: "derived",  note: "G6 — reconciled to dugout.mjs:3377's own 600000ms interval (was hourly)" },
  { name: "presence sense",           where: "schtasks ArsenalFC-Presence",              value: "1min",       origin: "ruled",    note: "G6 — the stall sensor samples fast, its WINDOW is untouched" },
  // WIRING AUDIT (11 Aug 2026): this row's note used to END at an address — "read
  // `node scripts/distiller.mjs latency`" — i.e. it discharged a measurement by
  // asking someone to remember a command, which the ANCHOR LAW forbids, and so the
  // G16 counter sat unread by every organ for its whole life. `measure` is the same
  // device the GATES table has always used for `have`: the row now READS the
  // producer's journal, and report() resolves it to plain data.
  { name: "distiller",                where: "schtasks ArsenalFC-Distiller",             value: "15min",      origin: "guessed",  note: "the free working-set refresh; its switch-to-read latency is MEASURED (G16 sliver, 10 Aug 2026) and printed live beside this guess — counts + lags only, no verdict. The value stays guessed until he rules on that data",
    measure: (m) => m.distiller_latency },
  { name: "DMN",                      where: "schtasks ArsenalFC-DMN",                   value: "60min",      origin: "ruled",    note: "G16 KEEPS hourly — its gate is human-timescale (away/tone/headroom decide, not the timer)" },
  { name: "tone",                     where: "schtasks ArsenalFC-Tone",                  value: "5min",       origin: "ruled",    note: "G16 — zero-LLM; LATENCY is its failure mode, so it samples fast" },
  { name: "hippo index sweep",        where: "schtasks ArsenalFC-HippoIndex",            value: "60min",      origin: "guessed",  note: "" },
  { name: "recall arrival debounce",  where: "dugout.mjs /afferent-relay",               value: "300s",       origin: "ruled",    note: "F3/G16 — embeds ≤116/day vs the 1,000 embedding quota" },
  { name: "consolidate",              where: "schtasks ArsenalFC-Consolidate",           value: "02:10",      origin: "guessed",  note: "night lane order: consolidate → store → nightshift → conceptgraph" },
  { name: "hippo store",              where: "schtasks ArsenalFC-HippoStore",            value: "02:20",      origin: "guessed",  note: "" },
  { name: "night shift",              where: "schtasks ArsenalFC-NightShift",            value: "02:40",      origin: "guessed",  note: "" },
  { name: "concept graph",            where: "schtasks ArsenalFC-ConceptGraph",          value: "03:00",      origin: "guessed",  note: "the ONE nightly Opus path (cortex consolidate)" },
  { name: "watchman",                 where: "schtasks ArsenalFC-Watchman",              value: "23:55",      origin: "derived",  note: "after the whole day, before midnight rolls the local date" },
  { name: "thalamus refractory",      where: "thalamus_config.refractory_min",           value: "45min",      origin: "guessed",  note: "same-key wake suppression" },
  { name: "agenda (night's 1st thought)", where: "brain_config jobs.agenda.at",           value: "22:45",      origin: "derived",  note: "H2 (10 Aug 2026) — after H1's scoreboard writes at 22:38 in the evening chain; rides the wrap-aware at-gate" },
  { name: "diary (night's last page)",  where: "brain_config jobs.diary.at",              value: "03:00",      origin: "derived",  note: "H6 (10 Aug 2026) — after the night writers (nightshift 02:40 + minutes); a slept-through slot = no page that morning, said by absence" },
];

// ---- generic sweep: every numeric leaf in every *_config.json ---------------
export function sweepConfigs(stateDir = STATE) {
  const out = [];
  let files = [];
  try { files = readdirSync(stateDir).filter(f => /_config\.json$|_profile\.json$/.test(f)); } catch { }
  for (const f of files) {
    const j = readJson(join(stateDir, f));
    if (!j) continue;
    (function walk(v, path) {
      if (typeof v === "number") { out.push({ file: f, path, value: v }); return; }
      if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${path}[${i}]`));
      if (v && typeof v === "object") return Object.entries(v).forEach(([k, x]) => { if (!k.startsWith("_")) walk(x, path ? `${path}.${k}` : k); });
    })(j, "");
  }
  return out;
}

// ---- generic sweep: numeric literals inside each script's DEFAULTS block ----
export function sweepScriptDefaults(dir = SCRIPTS) {
  const out = [];
  let files = [];
  try { files = readdirSync(dir).filter(f => f.endsWith(".mjs")); } catch { }
  for (const f of files) {
    let src = "";
    try { src = readFileSync(join(dir, f), "utf8"); } catch { continue; }
    const i = src.indexOf("const DEFAULTS = {");
    if (i < 0) continue;
    let depth = 0, j = src.indexOf("{", i);
    const start = j;
    for (; j < src.length; j++) { if (src[j] === "{") depth++; else if (src[j] === "}") { depth--; if (!depth) break; } }
    // strip line comments so a number inside prose is never reported as a knob
    const block = src.slice(start, j + 1).split("\n").map(l => l.replace(/\/\/.*$/, "")).join("\n");
    const re = /([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(-?\d+(?:\.\d+)?)\s*[,}]/g;
    let m;
    while ((m = re.exec(block))) out.push({ file: f, key: m[1], value: Number(m[2]) });
  }
  return out;
}

// `m` is a parameter (11 Aug 2026) purely so the selftest can drive the WHOLE table
// off a fixture bus — this file may not write a fixture directory to disk (its own
// last assertion proves it calls no writer), and a wire that can only be checked
// against today's clean state is a wire that cannot be checked at all. Default
// behaviour is byte-identical: nothing in the repo passes it.
export function report(stateDir = STATE, m = measureReality(stateDir)) {
  const gates = GATES.map(g => {
    const have = g.have ? g.have(m) : null;
    // `need` may be a function too (10 Aug 2026) — a row whose denominator is
    // PUBLISHED by the organ that owns it reads it live instead of carrying a copy
    // that rots. Both are resolved to plain numbers here, so the JSON dump and the
    // printed table never see a function.
    const need = typeof g.need === "function" ? g.need(m) : g.need;
    // ...and whether that `need` is the captain's edit or the organ's fallback after
    // his edit was thrown away (11 Aug 2026). Calibration is the only organ publishing
    // a config read today, so it is the only one asked; every other row carries null,
    // which prints nothing — an honest "not known", never an implied "fine".
    const rejected = g.organ === "calibration" ? calConfigRejected(m.cal_config, g.key) : null;
    return { ...g, have, need, rejected, open: have == null || need == null ? null : have >= need, have_fn: undefined };
  });
  // A cadence row may carry a live MEASUREMENT since the 11 Aug 2026 wiring audit —
  // the same device as `have` above, resolved here so the JSON dump and the printed
  // table never see a function. `measured: null` is the honest reading for the rows
  // whose number nothing measures yet; it is never a zero.
  const cadences = CADENCES.map(c => ({ ...c, measured: c.measure ? c.measure(m) : null, measure: undefined }));
  // A BUDGET row may carry a live measurement too (11 Aug 2026) — same device, same
  // reason as the cadences above: a capped number whose COST is only reachable by
  // remembering another command is a number nobody re-fits. Rows without `measure`
  // resolve to `measured: null` and are byte-identical to before.
  // …and a BUDGET row's `value` may be a read off the owner's file (cfgValue, Block 2):
  // resolved here so the printed cell is the live number, never a stale copy.
  const budgets = BUDGETS.map(b => {
    const value = (b.value && typeof b.value === "object" && b.value.__cfg) ? cfgNeed(b.value.__cfg, b.value.path, b.value.fallback)(m) : b.value;
    return { ...b, value, measured: b.measure ? b.measure(m) : null, measure: undefined };
  });
  return { measured: m, gates, budgets, guards: GUARDS, cadences, config_numbers: sweepConfigs(stateDir), script_defaults: sweepScriptDefaults(), law: guessedLaw({ gates, budgets }) };
}

// ── §5.4 MADE MECHANICAL (BLOCK 2, 18 Aug 2026) ─────────────────────────────
// "a `guessed` number may only appear as a GUARD or as a WINDOW, never as a BUDGET
// or a CALENDAR GATE." Pure and exported: the selftest holds it, `human()` prints it,
// and any future row that re-introduces a guessed gate or budget goes red by name.
// A row's CLASS defaults to its table: a GATES row is a `gate` unless it says `window`
// or `definition`; a BUDGETS row is a `budget` unless it says `window`.
export function guessedLaw({ gates = [], budgets = [] } = {}) {
  const badGates = gates.filter(g => (g.cls || "gate") === "gate" && g.origin === "guessed").map(g => `${g.organ} ${g.key}`);
  const badBudgets = budgets.filter(b => (b.cls || "budget") === "budget" && b.origin === "guessed").map(b => b.name);
  return { ok: badGates.length === 0 && badBudgets.length === 0, guessed_gates: badGates, guessed_budgets: badBudgets };
}

function human(r) {
  const m = r.measured;
  console.log("\n=== WHAT HE ACTUALLY HAS ===");
  // SCALAR ledger — one number per row. Published counters read from another
  // organ's state (cal_gate) are objects; they are printed in the GATES table
  // below, with their own have/need, so skipping them here hides nothing.
  for (const [k, v] of Object.entries(m)) { if (v && typeof v === "object") continue; console.log(`  ${k.padEnd(20)} ${String(v).padStart(7)}`); }

  console.log("\n=== GATES — numbers that decide whether an organ MAY SPEAK ===");
  console.log(`  ${"organ".padEnd(15)}${"knob".padEnd(38)}${"have".padStart(6)}${"need".padStart(7)}   status   origin`);
  for (const g of r.gates) {
    const st = g.open === null ? "  ?   " : g.open ? " OPEN " : " SHUT ";
    console.log(`  ${g.organ.padEnd(15)}${g.key.padEnd(38)}${String(g.have ?? "-").padStart(6)}${String(g.need ?? "-").padStart(7)}   ${st}  ${g.origin}`);
    // A DISCARDED EDIT, PRINTED ON THE ROW IT INVALIDATED (11 Aug 2026). Not a
    // footnote and not a separate section: the lie was that this row's `need` looked
    // like his number, so the correction belongs under that number or nowhere.
    if (!g.rejected) continue;
    console.log(`           DISCARDED  └─ calibration_config.json  ${g.rejected.key} = ${g.rejected.got}  was THROWN AWAY (not a number) — the ${g.need} above is calibration.mjs's built-in default ${g.rejected.using}, NOT his edit`);
  }
  const shut = r.gates.filter(g => g.open === false);
  const gateRows = r.gates.filter(g => (g.cls || "gate") === "gate");
  const winRows = r.gates.filter(g => g.cls === "window"), defRows = r.gates.filter(g => g.cls === "definition");
  console.log(`  → ${shut.length} of ${r.gates.length} rows SHUT · ${gateRows.length} are speak-GATES (${gateRows.filter(g => g.origin === "guessed").length} guessed — the §5.4 law says 0; ${gateRows.filter(g => g.origin === "opened").length} opened 18 Aug 2026 to the arithmetic floor, n printed) · ${winRows.length} WINDOWS + ${defRows.length} DEFINITIONS may stay guessed.`);
  // The rest of the same read: leaves with no gate row (the ECE targets), keys that
  // are pure no-ops, and a config file that could not be parsed at all. Printed only
  // when there is something to say — a line that always prints is a line nobody reads.
  const cc = r.measured.cal_config;
  if (cc && cc.clean === false) {
    const rowKeys = new Set(r.gates.filter(g => g.rejected).map(g => g.rejected.key));
    const rest = (cc.rejected || []).filter(x => !rowKeys.has(x.key));
    if (cc.error) console.log(`  ! calibration_config.json is UNREADABLE (${cc.source}) — EVERY calibration number above is a built-in default: ${cc.error}`);
    for (const x of rest) console.log(`  ! calibration_config.json  ${x.key} = ${x.got}  THROWN AWAY (not a number) — using ${x.using}`);
    for (const k of (cc.unknown || [])) console.log(`  ! calibration_config.json  ${k}  is not a knob this organ reads — a misspelled key is a silent no-op`);
  }

  console.log("\n=== BUDGETS — numbers that cap spend ===");
  for (const b of r.budgets) {
    console.log(`  ${b.origin.padEnd(9)} ${String(b.value).padStart(9)}  ${b.name}${b.cls === "window" ? "  [WINDOW]" : ""}  ·  ${b.where}`);
    // What the cap COST, printed where the cap is. A "?" is the honest reading for a
    // producer that has not re-run since it gained the counter — never a 0.
    if (!b.measured) continue;
    const q = b.measured, n = (v) => v == null ? "?" : v;
    // TWO measured rows since 11 Aug 2026, so this can no longer print ONE hardcoded
    // sentence — it printed "? of ? mined anchors shipped" for anything that was not
    // the lexicon. A row whose producer already PHRASED the number arrives carrying
    // `line`; it is echoed verbatim, for the cal_gate reason (re-wording an owner's
    // arithmetic here is how this table came to disagree with its own producer).
    if (q.line !== undefined) {
      console.log(`           MEASURED  └─ ${n(q.line)}${q.on ? `  ·  cards.json ${q.on}` : ""}`);
      console.log(`                     └─ ${n(q.cards_merged)} of ${n(q.cards_total)} card(s) carry a merge · largest single-card merge ${n(q.worst_card_merged)} rep(s) · unit ${n(q.unit)}/${n(q.rating)}${q.raw_reps == null ? "  [cards.json predates the collapse counter — re-run fsrs]" : ""}`);
      continue;
    }
    console.log(`           MEASURED  └─ ${n(q.shipped)} of ${n(q.mined)} mined anchors shipped · ${n(q.dropped)} dropped by the cap · ${n(q.connectives)} connective n-gram(s) rejected (#4)${q.mined == null ? "  [lexicon.json " + n(q.on) + " predates the mined/dropped counters — re-run doubtminer]" : ""}`);
  }

  {
    const law = r.law || guessedLaw(r);
    console.log(`  → §5.4 LAW (0 guessed budgets, 0 guessed gates): ${law.ok ? "HOLDS" : "BROKEN — " + [...law.guessed_gates, ...law.guessed_budgets].join(", ")}`);
  }

  console.log("\n=== GUARDS — not budgets; they stop one failure repeating ===");
  for (const g of r.guards) console.log(`  ${String(g.value).padStart(7)}  ${g.name.padEnd(26)} ${g.earned ? "earned: " + g.earned : ""}`);

  console.log("\n=== CADENCES — every timer, with its provenance (G5) ===");
  const secs = (ms) => (Number.isFinite(ms) ? `${Math.round(ms / 1000)}s` : "-");
  for (const c of r.cadences) {
    console.log(`  ${c.origin.padEnd(8)} ${String(c.value).padStart(9)}  ${c.name.padEnd(26)} ·  ${c.where}`);
    // The measurement a guessed row is waiting on, printed WHERE THE GUESS IS —
    // that is the whole repair (11 Aug 2026). Counts and lags, never a verdict:
    // "is 15 minutes too slow" stays his ruling, on his 30-45-60-day rule.
    if (!c.measured) continue;
    const q = c.measured;
    console.log(q.switches
      ? `           MEASURED  └─ ${q.switches} switch(es) caught over ${q.runs} run(s) · ${q.span} · lag min ${secs(q.min_ms)} · median ${secs(q.median_ms)} · mean ${secs(q.mean_ms)} · max ${secs(q.max_ms)}`
      : `           MEASURED  └─ nothing yet (${q.runs} run(s) journalled) — the window opens on the first run that catches a switch`);
  }
  const measuredRows = r.cadences.filter(c => c.measured);
  console.log(`  → ${r.cadences.filter(c => c.origin === "guessed").length} of ${r.cadences.length} cadences are GUESSES — the re-fit list. ${measuredRows.length} of them carry a live measurement; none carries a verdict (that is his).`);

  console.log(`\n=== SWEEP === ${r.config_numbers.length} numeric knobs across ${new Set(r.config_numbers.map(c => c.file)).size} config files · ${r.script_defaults.length} in script DEFAULTS blocks`);
  console.log("(run `node scripts/limits.mjs json` for the full machine-readable dump)\n");
}

function selftest() {
  let pass = 0, fail = 0;
  const ok = (n, c) => { if (c) { pass++; console.log("  ✓ " + n); } else { fail++; console.log("  ✗ " + n); } };
  const r = report();
  ok("measures reality from the live bus, never from a constant", typeof r.measured.reps === "number" && typeof r.measured.capsules === "number");
  // `derived` joined the vocabulary 11 Aug 2026 with the fsrs row — the CADENCES
  // table has always defined it ("arithmetic from another number, shown") and a
  // gate that is arithmetic must not be filed under `guessed`, or his re-fit list
  // grows a row with nothing to re-fit.
  // `opened` joined 18 Aug 2026 (BLOCK 2 of the overhaul): a human ruling opened a speak-
  // gate to its arithmetic floor and the organ prints n — recorded, dated, re-fittable.
  ok("every gate declares an origin", r.gates.every(g => ["guessed", "measured", "external", "guard", "derived", "opened"].includes(g.origin)));
  ok("every gate declares a class — gate | window | definition (Block 2, §5.4)", r.gates.every(g => ["gate", "window", "definition"].includes(g.cls || "gate")));
  // ── THE §5.4 LAW, HELD HERE (BLOCK 2, 18 Aug 2026) — the DoD of Block 2 ─────────
  // "limits.mjs shows 0 guessed budgets/gates". Pure over the live tables, named on red.
  {
    const law = guessedLaw(r);
    ok(`§5.4 — NO guessed speak-GATE remains (windows + definitions may): ${law.guessed_gates.length ? law.guessed_gates.join(", ") : "0"}`, law.guessed_gates.length === 0);
    ok(`§5.4 — NO guessed BUDGET remains (windows may): ${law.guessed_budgets.length ? law.guessed_budgets.join(", ") : "0"}`, law.guessed_budgets.length === 0);
    ok("§5.4 — the law is pure and would go RED on a re-introduced guessed gate (fixture)",
      guessedLaw({ gates: [{ organ: "x", key: "k", origin: "guessed" }], budgets: [] }).ok === false
      && guessedLaw({ gates: [{ organ: "x", key: "k", origin: "guessed", cls: "window" }], budgets: [{ name: "b", origin: "guessed", cls: "window" }] }).ok === true
      && guessedLaw({ gates: [], budgets: [{ name: "b", origin: "guessed" }] }).ok === false);
    ok("§5.4 — the opened gates read their bar off the OWNER's config (need 1 today), never a literal kept here",
      cfgNeed("nemesis_config", "warming_up_min_reps", 20)({ nemesis_config: { warming_up_min_reps: 1 } }) === 1
      && cfgNeed("nemesis_config", "warming_up_min_reps", 20)({}) === 20
      && r.gates.filter(g => g.origin === "opened").every(g => Number.isFinite(g.need)));
  }
  ok("a gate's status is computed from live data, never asserted", r.gates.filter(g => g.have != null).every(g => g.open === (g.have >= g.need)));
  ok("the sweep finds config knobs", r.config_numbers.length > 0);
  ok("the sweep finds script DEFAULTS knobs", r.script_defaults.length > 0);
  // LADDER G5 — the cadence registry: zero rows existed before 9 Aug 2026
  ok("G5: every cadence row carries a tagged origin and a where",
    r.cadences.length >= 26 && r.cadences.every(c => ["measured", "derived", "ruled", "guessed"].includes(c.origin) && c.where && c.name));
  ok("G5: the two coupling-critical rows exist — the 15s beat and the SECONDS-pinned pulse spacing",
    r.cadences.some(c => c.where === "brain_config.daemon.poll_ms" && c.value === "15s")
    && r.cadences.some(c => /min_spacing_s/.test(c.where) && c.origin === "derived"));
  ok("comment text is stripped — no prose number reported as a knob", !r.script_defaults.some(d => d.key === "E2E" || d.key === "audit"));

  // ---- WIRING AUDIT (11 Aug 2026) — THE LEXICON CAP READS ITS OWN COST --------
  // The defect this is written against: doubtminer.mjs publishes filtered_connectives
  // / anchors_mined / dropped_by_cap and NO organ read them; the ledger row that
  // finally named the 25-cap ended at an ADDRESS instead of a read. This goes red if
  // the row loses its `measure`, if measureReality stops reading lexicon.json, or if
  // a missing counter is ever reported as 0 instead of null (that last one is the
  // whole lesson — doubtminer's own selftest calls a false 0 "the same class of lie").
  {
    const cap = r.budgets.find(b => b.name === "lexicon anchor cap");
    // 18 Aug 2026 (Block 2): the cap is OPENED (max_anchors 0 = none) — the row stays,
    // its origin says so, and its value is READ off doubtminer_config, not copied here.
    ok("the lexicon cap is registered as doubtminer.mjs's comment claims (BUDGETS) — and OPENED 18 Aug 2026, value read off the owner's config",
      !!cap && cap.origin === "opened" && /max_anchors/.test(cap.where) && cap.value === 0);
    ok("and it READS the lexicon's own counters — a named cap with no measurement is the address-only defect again",
      !!cap && cap.measured !== undefined
      && (cap.measured === null || Number.isFinite(cap.measured.shipped)));
    // ABSENT ≠ ZERO, proved on fixtures rather than asserted about today's file.
    const bare = measureReality(join(REPO, "scripts"));   // no lexicon.json here
    ok("a lexicon that was never written reads null on every counter, never 0",
      bare.lexicon_anchors === null && bare.lexicon_anchors_mined === null
      && bare.lexicon_dropped_by_cap === null && bare.lexicon_connectives_filtered === null);
    // the LIVE file (2026-08-10) predates the cap counters but DOES carry #4's — so
    // this pins both halves at once: the old counter read, the new ones honestly null.
    ok("the live lexicon's #4 rejection counter now has a reader outside doubtminer.mjs",
      r.measured.lexicon_connectives_filtered === null || Number.isFinite(r.measured.lexicon_connectives_filtered));
    // MEASURED rows are a NAMED set, so adding one is a deliberate act and a row
    // that quietly grows a `measure` still trips this. Two since 11 Aug 2026.
    const MEASURED_ROWS = ["lexicon anchor cap", "rep→review collapse unit"];
    ok("rows with no measurement are untouched — `measure` never leaks into the dump",
      r.budgets.every(b => !("measure" in b) || b.measure === undefined)
      && r.budgets.filter(b => !MEASURED_ROWS.includes(b.name)).every(b => b.measured === null));
  }

  // ---- THE FSRS COLLAPSE (11 Aug 2026 wiring audit) ------------------------
  // THE DEFECT: fsrs.mjs wrote cards.json's `collapse` + `gate` blocks and
  // fsrs_store's per-card raw_reps / review_events / collapsed / review_unit on
  // every run, and NO organ in the repo read one of them — a producer with no
  // consumer is a black box, not a feedback loop. Live cost the day this was
  // wired: 27 raw reps → 12 review events, 15 merged; audit #24's "a printed
  // number and not an inference" was reachable only through fsrs's stdout, which
  // the conductor discards. These assertions are the net: the read on fixtures,
  // then BOTH WIRES, then the producer.
  {
    const cards = { date: "2026-08-10", gate: { have: 5, need: 1, line: "5/1 cards", open: true },
      collapse: { unit: "local_day", rating: "worst", raw_reps: 27, review_events: 12, collapsed: 15,
                  line: "12/27 review events (15 same-day reps merged)" } };
    const store = { cards: [ { collapsed: 0 }, { collapsed: 1 }, { collapsed: 14 }, { collapsed: 0 }, { collapsed: 0 } ] };
    const q = fsrsCollapse(cards, store);
    // the owner's sentence, character for character — a paraphrase here is the
    // cal_gate defect (this table disagreeing with the organ that owns the number).
    ok("the collapse row copies the PRODUCER's own line verbatim, and never re-derives it",
      q.line === "12/27 review events (15 same-day reps merged)" && q.raw_reps === 27 && q.review_events === 12 && q.collapsed === 15);
    ok("the per-card half counts CARDS that merged and the largest single merge (2 of 5, worst 14)",
      q.cards_merged === 2 && q.cards_total === 5 && q.worst_card_merged === 14);
    // ABSENT ≠ ZERO — the whole lesson of the lexicon repair, proved on fixtures.
    ok("a pre-#24 cards.json with no collapse block reads null per field, never a measured 0",
      (() => { const p = fsrsCollapse({ date: "2026-07-01", total_cards: 3 }, store);
               return p.raw_reps === null && p.collapsed === null && p.line === null && p.cards_total === 5; })());
    ok("neither producer on disk ⇒ null, so the table prints '?' instead of inventing a number",
      fsrsCollapse(null, null) === null && fsrsCollapse(undefined, undefined) === null);
    // COUNTS ONLY: cards.json + fsrs_store.json are gitignored personal study data
    // (.gitignore:56), so no concept name may leave this read — the distiller
    // journal's own rule, held here.
    ok("no concept NAME leaves the read — gitignored study data comes back out as counts only",
      !JSON.stringify(q).toLowerCase().includes("concept") && Object.values(q).every(v => v === null || typeof v === "number" || typeof v === "string")
      && !Object.values(q).some(v => Array.isArray(v)));

    // THE WIRE #1 — the BUDGETS row. Strip `measure` and this goes red, instead of
    // fsrs journalling its own arithmetic into the dark for another few weeks.
    const cRow = r.budgets.find(b => b.name === "rep→review collapse unit");
    // IDENTITY, not tolerance. This first read `measured === null || …`, to be kind to
    // a machine where fsrs never ran — and that made it UNFAILABLE: cutting `measure`
    // left it green (proved by cutting it and re-running; only the two gate rows went
    // red). An assertion that cannot fail is the same class of defect as the unread
    // counter it guards, so the row must now equal the bus read EXACTLY — object for
    // object when the producer has run, null for null when it has not.
    ok("THE WIRE: the collapse budget row CARRIES the live reading (it had no row at all until 11 Aug 2026)",
      !!cRow && cRow.measured === r.measured.fsrs_collapse
      && (r.measured.fsrs_collapse === null || typeof cRow.measured === "object"));
    ok("the measurement stays a COUNTER: no verdict, no threshold, no pass/fail on how much merged",
      !!cRow && (!cRow.measured || (!("verdict" in cRow.measured) && !("threshold" in cRow.measured) && !("open" in cRow.measured) && !("ok" in cRow.measured))));
    // THE WIRE #2 — the GATES row, reading fsrs's published ungate counter.
    const gRow = r.gates.find(g => g.organ === "fsrs");
    ok("THE WIRE: fsrs's #106 ungate counter has a reader outside fsrs.mjs at last",
      !!gRow && gRow.origin === "derived" && (r.measured.fsrs_gate === null
        ? (gRow.have === null && gRow.need === null)
        : (gRow.have === r.measured.fsrs_gate.have && gRow.need === r.measured.fsrs_gate.need)));
    ok("no cards.json ⇒ the fsrs gate reads '?', never a number invented in this file",
      (() => { const g = GATES.find(x => x.organ === "fsrs"); const blind = { fsrs_gate: null };
               return g.have(blind) === null && g.need(blind) === null; })());
    // LIVE, when the producer has run on this machine: the printed row IS the file.
    ok("LIVE: the printed collapse row equals cards.json's own published block",
      (() => { const disk = readJson(join(STATE, "cards.json"));
               if (!disk || !disk.collapse || !cRow || !cRow.measured) return true;   // producer never ran here
               return cRow.measured.line === disk.collapse.line && cRow.measured.raw_reps === disk.collapse.raw_reps
                 && cRow.measured.review_events === disk.collapse.review_events; })());
    // ANTI-STRAND (the calibration + claudegen + distiller repairs' own check): the
    // fields this reads must be the fields the producer still writes. Rename them in
    // fsrs.mjs and it goes red HERE, instead of the counters stranding again silently.
    const fSrc = readFileSync(join(SCRIPTS, "fsrs.mjs"), "utf8");
    ok("fsrs.mjs still publishes the collapse block + the per-card counters this row depends on",
      /collapse:\s*\{/.test(fSrc) && /raw_reps:\s*raw,\s*review_events:\s*events/.test(fSrc)
      && /raw_reps:\s*sorted\.length,\s*review_events:\s*events\.length/.test(fSrc)
      && /gate:\s*\{/.test(fSrc));
    // THE LAW THAT BROKE, held table-wide (the cadences carry the same one): a
    // BUDGETS row may not discharge its measurement by naming a command to run.
    ok("ANCHOR LAW: no budget row hands its measurement to a human as a command to run",
      !r.budgets.some(b => /`node scripts\//.test(b.note || "")));
  }

  // ---- AUDIT #78 — THE TWIN MAPPING ----------------------------------------
  // The bug was that the twin gate's `have` read dugout_notes.jsonl (voice
  // take_notes) instead of the twin's own resolved slips. The fixture below makes
  // the two sources DISAGREE on purpose — that disagreement is the entire defect —
  // so this assertion goes red the moment the mapping drifts back.
  {
    const slip = [
      { date: "2026-07-01", book: "twin",   type: "floor_touched", claim: "c", resolved: true },
      { date: "2026-07-02", book: "twin",   type: "floor_touched", claim: "c", resolved: true },
      { date: "2026-07-02", book: "twin",   type: "floor_touched", claim: "c", resolved: true },  // appended correction, same day
      { date: "2026-07-03", book: "twin",   type: "floor_touched", claim: "c", resolved: true },
      { date: "2026-07-04", book: "twin",   type: "session_abandon", claim: "c", resolved: true }, // a DIFFERENT claim-type
      { date: "2026-07-05", book: "gaffer", type: "floor_touched", claim: "c", resolved: true },  // not the twin's book
      { date: "2026-07-06", book: "twin",   type: "floor_touched", claim: "c", resolved: false }, // not resolved yet
      "{ not json",
    ].map(x => typeof x === "string" ? x : JSON.stringify(x));
    ok("#78 — the twin gate counts RESOLVED twin slips on ONE claim-type, last-wins (3, not 4, not 5, not 7)",
      twinBestType(slip) === 3);
    ok("#78 — no slips at all reads 0, never null or NaN", twinBestType([]) === 0 && twinBestType(["{}"]) === 0);
    // the table row itself, fed a measurement where the two candidate sources
    // disagree — the old mapping returns 7 here, the repaired one returns 3.
    const twinRow = GATES.find(g => g.organ === "twin");
    ok("#78 — the twin row's have() reads twin_resolutions_best_type, NOT dugout_notes' take_note count",
      !!twinRow && twinRow.have({ voice_resolutions: 7, twin_resolutions_best_type: 3 }) === 3);
  }

  // ---- THE CALIBRATION COUNTER (10 Aug 2026) -------------------------------
  // calibration.mjs publishes have/need for all three of its gates in
  // calibration.json (`gate`/`gate.sub`) and NO organ read it, so this ledger
  // judged all three against the raw rep count — and printed `window_size 21/20
  // OPEN` on the morning the producer wrote "establishing baseline (21/40 reps)".
  // The fixture makes the two candidate sources DISAGREE on purpose (21 raw reps
  // vs a trend gate at 21/40 and 3 knew-reps of 3): the old mapping returns 21/20
  // OPEN for the trend row, the wired one returns 21/40 SHUT.
  {
    const calGate = {
      have: 21, need: 20, open: true,
      sub: [
        { name: "danger_zone",          have: 21, need: 20, open: true },
        { name: "trend",                have: 21, need: 40, open: false },
        { name: "danger.min_knew_reps", have: 3,  need: 3,  open: true },
      ],
    };
    const rd = (key, m) => { const g = GATES.find(x => x.organ === "calibration" && x.key === key);
      return { have: g.have(m), need: typeof g.need === "function" ? g.need(m) : g.need }; };
    const m = { reps: 21, cal_gate: calGate };
    // PHASE 6 REGRESSION WITNESS (14 Aug 2026) — the four physio rows carried
    // their bar as a LITERAL, so tuning a gate moved the organ and not the table:
    // three gates were opened and this report went on printing SHUT beside the
    // old number. The bar now comes from where physio.mjs reads it.
    ok("the physio gates read their bar from physio_config.json, not from a copy kept here",
      physioNeed("bootroom_min_reps", 200)({ physio_config: { gates: { bootroom_min_reps: 20 } } }) === 20
      && physioNeed("apni_ghadi.min_cards", 8)({ physio_config: { gates: { apni_ghadi: { min_cards: 4 } } } }) === 4);
    ok("...and falls back to physio.mjs's OWN default when the file is missing or the leaf is not a number — never to zero",
      physioNeed("bootroom_min_reps", 200)({}) === 200
      && physioNeed("bootroom_min_reps", 200)({ physio_config: { gates: { bootroom_min_reps: "20" } } }) === 200);
    ok("the trend gate reads the PRODUCER's 21/40 (2 × window_size) and is SHUT — not the raw rep count against 20",
      rd("window_size", m).have === 21 && rd("window_size", m).need === 40 && rd("window_size", m).have < rd("window_size", m).need);
    ok("danger.min_knew_reps counts KNEW-reps (3/3), never every rep (21/3)",
      rd("danger.min_knew_reps", m).have === 3 && rd("danger.min_knew_reps", m).need === 3);
    ok("min_reps reads the published root counter (21/20)",
      rd("min_reps", m).have === 21 && rd("min_reps", m).need === 20);
    const blind = { reps: 21, cal_gate: null };
    ok("no calibration.json ⇒ all three rows read '?', never a number invented in this file",
      ["min_reps", "window_size", "danger.min_knew_reps"].every(k => rd(k, blind).have === null && rd(k, blind).need === null));
    // THE ANTI-STRAND CHECK: the names this table asks for must be the names the
    // producer still emits. Rename a sub in calibration.mjs and this goes red here
    // instead of silently stranding the field again for another few weeks.
    const calSrc = readFileSync(join(SCRIPTS, "calibration.mjs"), "utf8");
    ok("the sub-gate names this table maps to are the ones calibration.mjs buildGate() still emits",
      ['name: "danger_zone"', 'name: "trend"', 'name: "danger.min_knew_reps"', 'name: "registry"'].every(n => calSrc.includes(n)));

    // ---- THE SILENT REGISTRY (11 Aug 2026 wiring audit) --------------------
    // calibration.mjs read concepts.json through a bare catch and published NOTHING
    // when it failed, so a dead alias table produced a run byte-identical to a healthy
    // one — and the two rows above (which key on canonicalised topics) under-read with
    // nothing saying why. It now emits a `registry` sub row; this ledger is its
    // consumer, so the fault has an address a human already visits.
    const regGate = { have: 22, need: 20, open: true, sub: [
      { name: "danger_zone", have: 22, need: 20, open: true },
      { name: "trend", have: 22, need: 40, open: false },
      { name: "danger.min_knew_reps", have: 2, need: 3, open: false },
      { name: "registry", have: 0, need: 1, open: false, error: "concepts.json unreadable: Unexpected non-whitespace character" },
    ] };
    ok("a dead concepts.json prints as its own SHUT gate (0/1) beside the two rows it silently degrades",
      rd("registry — concepts.json must parse", { cal_gate: regGate }).have === 0
      && rd("registry — concepts.json must parse", { cal_gate: regGate }).need === 1
      && rd("registry — concepts.json must parse", { cal_gate: regGate }).have < rd("registry — concepts.json must parse", { cal_gate: regGate }).need);
    ok("a healthy registry reads 1/1, and a producer that never ran reads '?' — never a 1 invented in this file",
      rd("registry — concepts.json must parse", { cal_gate: { ...regGate, sub: [{ name: "registry", have: 1, need: 1, open: true, error: null }] } }).have === 1
      && rd("registry — concepts.json must parse", blind).have === null && rd("registry — concepts.json must parse", blind).need === null);
    // and it is NOT tagged `guessed`: there is no threshold here to re-fit after 30-45-60
    // days, only "the file parsed or it did not" (same reason as the fsrs row below).
    ok("the registry row is ORIGIN derived — it must never land on his re-fit list as a phantom guessed number",
      GATES.find(x => x.organ === "calibration" && x.key === "registry — concepts.json must parse").origin === "derived");
    // And the live wire, when the producer has actually run on this machine.
    const liveGate = r.measured.cal_gate;
    ok("LIVE: the three printed rows equal calibration.json's own published counter",
      !liveGate || ["min_reps", "window_size", "danger.min_knew_reps"].every(k => {
        const row = r.gates.find(x => x.organ === "calibration" && x.key === k);
        const src = calGateRead(liveGate, k === "min_reps" ? "__root__" : k === "window_size" ? "trend" : k);
        return row && src && row.have === src.have && row.need === src.need;
      }));
  }

  // ---- IS THAT NEED EVEN HIS? (11 Aug 2026 wiring audit) --------------------
  // THE DEFECT, one layer under the block above: those three rows print calibration's
  // published `need` as fact, and calibration.mjs silently numOr-clamped any
  // non-numeric leaf of calibration_config.json to its own DEFAULTS —
  // normalizeConfig({min_reps:"12"}) → 20, with no field anywhere naming the discard.
  // The config's own _comment invites him to retune it, so the failure mode is not
  // exotic: he edits, the edit is thrown away, and THIS TABLE tells him 20 is his
  // number. Not an unread counter — an actively wrong one, in the ledger built to
  // catch exactly that. The producer now publishes `config`; these are its consumer.
  {
    const cfgBlock = {
      source: "file", path: "…/calibration_config.json", error: null,
      rejected: [{ key: "min_reps", got: '"12"', using: 20 }],
      defaults_used: ["min_reps"], unknown: ["min_rep"], clean: false,
    };
    ok("the discard is found by the very key the GATES row is named with — no translation table between the two",
      calConfigRejected(cfgBlock, "min_reps").got === '"12"' && calConfigRejected(cfgBlock, "min_reps").using === 20);
    ok("an honoured knob reads null, and so does a producer that never ran or predates the block — never a manufactured 'fine'",
      calConfigRejected(cfgBlock, "window_size") === null && calConfigRejected(null, "min_reps") === null
      && calConfigRejected({ source: "file" }, "min_reps") === null);

    // THE WIRE, end to end through report() itself, on a bus where the published
    // need (20) and the captain's edit ("12") DISAGREE — that disagreement is the
    // whole defect. Cut `rejected` out of report()'s row map and this goes red.
    const dirty = report(STATE, { ...r.measured, cal_config: cfgBlock });
    const mrRow = dirty.gates.find(g => g.organ === "calibration" && g.key === "min_reps");
    ok("THE WIRE: the row whose need was faked by a discarded edit now CARRIES that discard (it printed 20 as his number until 11 Aug 2026)",
      !!mrRow && !!mrRow.rejected && mrRow.rejected.key === "min_reps" && mrRow.rejected.got === '"12"' && mrRow.rejected.using === 20);
    ok("...and ONLY that row — the two honoured calibration knobs stay clean, so the flag means something when it appears",
      dirty.gates.filter(g => g.organ === "calibration" && g.key !== "min_reps").every(g => g.rejected === null));
    ok("every other organ's row carries an explicit null, never undefined — no organ is implied 'fine' by a missing field",
      dirty.gates.filter(g => g.organ !== "calibration").every(g => g.rejected === null));
    // and the live table, which must agree with whatever is actually on disk today
    ok("LIVE: each calibration row's flag IS the live read — identity, so a severed wire cannot pass as a clean bus",
      r.gates.filter(g => g.organ === "calibration")
        .every(g => "rejected" in g && g.rejected === calConfigRejected(r.measured.cal_config, g.key)));
    // ANTI-STRAND (the cal_gate / claudegen / distiller repairs' own check): the field
    // and the key PATHS this reads must be the ones the producer still writes. Rename
    // them in calibration.mjs and it goes red HERE, not weeks later in a doc audit.
    const calSrc2 = readFileSync(join(SCRIPTS, "calibration.mjs"), "utf8");
    ok("calibration.mjs still PUBLISHES the config read, and journals it under the same three key paths this table is named with",
      /config:\s*configRead\(cfg\)/.test(calSrc2) && /read\.rejected\.push/.test(calSrc2)
      && ['"min_reps"', '"window_size"', '"danger.min_knew_reps"'].every(k => calSrc2.includes(k)));
  }

  // ---- THE SWALLOWED LINE (11 Aug 2026 wiring audit) -----------------------
  // THE DEFECT, one layer under the two blocks above: those rows print calibration's
  // have/need as fact, and calibration.mjs's loader dropped every unparseable and every
  // invalid reps_log line behind `catch { /* skip */ }` with no count and no published
  // field — so `total_reps`, `N/20 reps` and this ledger's own `reps` scalar could quietly
  // describe two different corpora and nothing in the organism could see the gap. The
  // producer counts and publishes now (`corpus`); this is its consumer, and the fixture
  // makes the two candidate denominators DISAGREE on purpose (23 raw lines, 21 counted).
  {
    // LIVE, when the producer has run on this machine: the two counters this ledger
    // prints must add back up to the ledger the producer actually read.
    const liveCorpus = (readJson(join(STATE, "calibration.json")) || {}).corpus || null;
    ok("LIVE: the printed corpus counters ARE the producer's own, and used + dropped = the lines it read",
      !liveCorpus
      || (r.measured.cal_reps_used === liveCorpus.reps_used && r.measured.cal_reps_dropped === liveCorpus.dropped
          && liveCorpus.reps_used + liveCorpus.dropped === liveCorpus.lines_seen));
    // ABSENT IS NOT ZERO, on a fixture rather than asserted about today's file — the same
    // law the lexicon rows above are written against. A calibration.json that predates the
    // block, or was never written, must not report a clean read it never performed.
    const bare = measureReality(join(REPO, "scripts"));   // no calibration.json here
    ok("no calibration.json (or one predating the block) ⇒ every corpus counter reads null, never a confident 0 dropped",
      bare.cal_reps_used === null && bare.cal_reps_dropped === null && bare.cal_reps_dropped_why === null);
    // and a real block resolves through the same reader the live bus uses
    const withBlock = { corpus: { lines_seen: 23, reps_used: 21, dropped: 2, clean: false,
      reasons: { "unparseable JSON line": 1, "correct not boolean": 1 } } };
    const read = (c) => ({
      used: c.corpus && Number.isFinite(c.corpus.reps_used) ? c.corpus.reps_used : null,
      dropped: c.corpus && Number.isFinite(c.corpus.dropped) ? c.corpus.dropped : null,
      why: c.corpus && c.corpus.reasons && c.corpus.dropped
        ? Object.entries(c.corpus.reasons).map(([w, n]) => `${n}× ${w}`).join(" · ") : null,
    });
    ok("a dropped line arrives WITH its reason — '2 dropped' alone sends a human hunting a gitignored ledger by eye",
      read(withBlock).used === 21 && read(withBlock).dropped === 2
      && read(withBlock).why === "1× unparseable JSON line · 1× correct not boolean");
    ok("a clean read reports 0 dropped and no reason string — the flag means something because it is usually absent",
      read({ corpus: { lines_seen: 21, reps_used: 21, dropped: 0, clean: true, reasons: {} } }).dropped === 0
      && read({ corpus: { lines_seen: 21, reps_used: 21, dropped: 0, clean: true, reasons: {} } }).why === null);
    // THE DISAGREEMENT THIS ROW EXISTS FOR: `reps` at the top of this ledger is the RAW
    // line count, and four GATES rows are judged against it. When the producer says it
    // counted fewer, the two denominators in this table are not the same number.
    ok("the raw `reps` scalar and the producer's counted corpus are BOTH published, so a disagreement is visible instead of silent",
      "reps" in r.measured && "cal_reps_used" in r.measured && "cal_reps_dropped" in r.measured
      && (r.measured.cal_reps_used === null || r.measured.cal_reps_used <= r.measured.reps));
    // ANTI-STRAND (the cal_gate / config / claudegen / distiller repairs' own check): the
    // field this reads must be the field the producer still writes, and the loader must
    // still be COUNTING. Re-swallow the drop in calibration.mjs and it goes red here.
    const calSrc3 = readFileSync(join(SCRIPTS, "calibration.mjs"), "utf8");
    ok("calibration.mjs still publishes `corpus` AND its loader still counts what it drops (the swallow cannot silently return)",
      /corpus:\s*corpusBlock\(corpusStats\)/.test(calSrc3)
      && /stats\.dropped\+\+/.test(calSrc3) && /dropped_reasons/.test(calSrc3)
      && !/try\s*\{\s*const o = JSON\.parse\(s\); if \(validRep\(o\)\) out\.push\(o\); \}\s*catch\s*\{\s*\/\* skip \*\//.test(calSrc3));
  }

  // ---- THE TOKEN-HONESTY FLAG (10 Aug 2026 wiring audit) -------------------
  // `tokens_estimated` was produced by claudegen on every result and read by NO
  // organ — so these two counters are its first consumer. Both are derived from
  // the live bus, never asserted; the second one only ever shrinks as writers are
  // wired, which is the point of printing it.
  {
    const m = r.measured;
    ok("the ledger's estimated/unstamped counts are READ from the bus, and neither can exceed the rows they came from",
      Number.isInteger(m.brain_calls_estimated) && Number.isInteger(m.brain_calls_unstamped)
      && m.brain_calls_estimated <= m.brain_calls && m.brain_calls_unstamped <= m.brain_calls);
    // ANTI-STRAND (the calibration repair's own check, same reason): the field
    // this row reads must be the field the producer still emits. Drop the stamp
    // in claudegen and this goes red here, instead of the counter quietly
    // reading 0 forever and calling every guess a measurement.
    const cgSrc = readFileSync(join(SCRIPTS, "claudegen.mjs"), "utf8");
    ok("claudegen still STAMPS tokens_estimated on its results (the producer this counter depends on)",
      /tokens_estimated:\s*!measured/.test(cgSrc) && /tokens_estimated:\s*true/.test(cgSrc));
    // and the night shift — the lane that carried 50 unstamped rows until this
    // audit — still puts the flag on the row it appends to the shared ledger.
    // Scoped to the ROW BUILDER, not the file: a bare /tokens_estimated/ over
    // nightshift.mjs stayed GREEN with the field cut out of the row, because the
    // selftest fixtures below still name it — an assertion that cannot fail is
    // the defect this whole audit is about, so it is anchored to the builder.
    const nsSrc = readFileSync(join(SCRIPTS, "nightshift.mjs"), "utf8");
    const nsRow = nsSrc.slice(nsSrc.indexOf("function nsLedgerRow"), nsSrc.indexOf("const genLedgered"));
    ok("the night shift's ledger ROW BUILDER still carries the flag (50 ns_ rows had none before 10 Aug 2026)",
      nsRow.length > 0 && /tokens_estimated:/.test(nsRow) && /\.\.\.ledgerForensics\(/.test(nsRow));
  }

  // ---- WHICH CLI THE ORGANS BOOTED (11 Aug 2026 wiring audit) --------------
  // claudegen's arg-set was chosen silently — the SHIM GUARD comment promised a
  // shimmed box would "SAY so … never silently" and no field, row or organ carried
  // the choice. It names the lane now; these counters are the read. Derived from
  // the live bus, never asserted, and neither can exceed the rows it came from.
  {
    const m = r.measured;
    ok("the arg-set counts are READ from the bus, and lean+full can never exceed the rows they came from",
      Number.isInteger(m.brain_calls_lean) && Number.isInteger(m.brain_calls_full_cli)
      && m.brain_calls_lean + m.brain_calls_full_cli <= m.brain_calls);
    // ANTI-STRAND, both ends. The producer must still NAME the lane (ARG_PROFILE),
    // still stamp it on the result, and still project it onto the row — cut any one
    // of the three and these counters read 0 forever, which would print as "no organ
    // ever booted the full CLI" on the very table whose job is to say where a number
    // came from. Comments stripped first, for the reason claudegen's own scans give:
    // a guard a comment can satisfy is not a guard.
    const cgSrc2 = readFileSync(join(SCRIPTS, "claudegen.mjs"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    ok("claudegen still NAMES its arg-set, stamps it on the result, and projects it onto the ledger row",
      /const ARG_PROFILE = \(\) =>/.test(cgSrc2)
      && /return "full-shim";/.test(cgSrc2) && /return "lean";/.test(cgSrc2)
      && /arg_profile: ARG_PROFILE\(\)/.test(cgSrc2)
      && /arg_profile: o\.arg_profile \|\| null/.test(cgSrc2));
    // …and ARGS must still be DERIVED from the name. Re-inline the two `return base`
    // branches and the name can drift off the argv silently — the exact defect class
    // this repair belongs to, one level up.
    ok("…and ARGS is still DERIVED from that name, so the lane it reports cannot drift from the argv it sent",
      /ARG_PROFILE\(\) === "lean" \? \[\.\.\.base, \.\.\.LEAN_ARGS\] : base/.test(cgSrc2));
  }

  // ---- THE DISTILLER LATENCY JOURNAL (11 Aug 2026 wiring audit) ------------
  // distiller.mjs wrote distiller_latency.jsonl every run and NO organ read it —
  // a producer with no consumer is a black box, not a feedback loop. Its only
  // address was a note STRING on the cadence row below. These assertions are the
  // net: the aggregation on a fixture, then THE WIRE ITSELF, then the producer.
  {
    const lines = [
      JSON.stringify({ ts: "2026-08-10T10:15:00.000Z", n: 2, switches: [{ lag_ms: 1000 }, { lag_ms: 3000 }] }),
      JSON.stringify({ ts: "2026-08-10T10:30:00.000Z", n: 1, switches: [{ lag_ms: 2000 }] }),
      "{ not json",                                                    // one bad row must not poison the read
      JSON.stringify({ ts: "2026-08-11T10:45:00.000Z", n: 1, switches: [{ lag_ms: 9000 }] }),
    ];
    const q = distillerLatency(lines);
    // mean 3750 vs median 2000: the fixture is skewed ON PURPOSE, because the owner
    // publishes a LOWER MEDIAN and a mean, and a copy that quietly averaged instead
    // would read as healthy while disagreeing with distiller.mjs latency.
    ok("the journal aggregates per SWITCH, not per run — 4 switches over 3 readable rows",
      q.runs === 3 && q.switches === 4);
    ok("min/median/mean/max are computed off lag_ms, lower-median exactly as distiller.mjs publishes it",
      q.min_ms === 1000 && q.median_ms === 2000 && q.mean_ms === 3750 && q.max_ms === 9000 && q.span === "2026-08-10 → 2026-08-11");
    ok("an absent or empty journal reads zero runs and NULL lags — never a number invented in this file",
      (() => { const e = distillerLatency([]); return e.runs === 0 && e.switches === 0 && e.min_ms === null && e.median_ms === null && e.span === null; })());
    // THE WIRE. If the row ever goes back to being a note-string address, `measured`
    // is null and this goes red — instead of the counter journalling into the dark
    // for another few weeks the way it did from 10 Aug 2026 until this audit.
    const dRow = r.cadences.find(c => c.name === "distiller");
    ok("THE WIRE: the distiller cadence row CARRIES the live journal reading (it was a note-string address until 11 Aug 2026)",
      !!dRow && !!dRow.measured && Number.isInteger(dRow.measured.runs) && Number.isInteger(dRow.measured.switches));
    // both of the next two are guarded on the wire above rather than assuming it:
    // a severed wire must read as ONE clean red line, not a TypeError that takes
    // the rest of the suite down with it (proven by cutting `measure` and re-running).
    ok("the measurement stays a COUNTER: no verdict, no threshold, and the 15-min value is still tagged guessed",
      !!dRow && !!dRow.measured && dRow.origin === "guessed" && dRow.value === "15min"
      && !("verdict" in dRow.measured) && !("threshold" in dRow.measured) && !("open" in dRow.measured));
    ok("LIVE: the printed row equals the journal on disk, row for row",
      (() => { if (!dRow || !dRow.measured) return false;
               const disk = distillerLatency(readLines(join(STATE, "distiller_latency.jsonl")));
               return dRow.measured.runs === disk.runs && dRow.measured.switches === disk.switches && dRow.measured.median_ms === disk.median_ms; })());
    // ANTI-STRAND (the calibration + claudegen repairs' own check, same reason):
    // the fields this read depends on must be the fields the producer still writes.
    // Rename the journal or drop lag_ms in distiller.mjs and this goes red HERE.
    const dSrc = readFileSync(join(SCRIPTS, "distiller.mjs"), "utf8");
    ok("distiller.mjs still appends distiller_latency.jsonl rows carrying switches[].lag_ms (the producer this row depends on)",
      /LATENCY_LOG\s*=\s*join\(STATE_DIR,\s*"distiller_latency\.jsonl"\)/.test(dSrc)
      && /appendFileSync\(LATENCY_LOG/.test(dSrc) && /lag_ms:\s*n\s*-\s*new Date/.test(dSrc));
    // THE LAW THAT BROKE, held table-wide: a row may not discharge a measurement by
    // asking a human to remember a command. If it can be measured, this table reads it.
    ok("ANCHOR LAW: no cadence row hands its measurement to a human as a command to run",
      !r.cadences.some(c => /`node scripts\//.test(c.note || "")));
  }

  // This used to be `typeof globalThis.writeFileSync === "undefined"` — always true
  // on every Node process ever, i.e. an assertion that could not fail guarding the
  // file's loudest claim ("Read-only. No config is changed by this file, ever").
  // Now it reads this module's OWN source and demands no writer is even called.
  {
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8")
      .split("\n").filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
    ok("READ-ONLY: this file calls no writer — measured against its own source, not asserted",
      !/\bwriteFileSync\s*\(|\bappendFileSync\s*\(|\brenameSync\s*\(|\bmkdirSync\s*\(|\brmSync\s*\(|\bunlinkSync\s*\(/.test(src));
  }
  console.log(fail === 0 ? `\nALL CHECKS PASSED (${pass} passed, 0 failed)` : `\n${fail} FAILED (${pass} passed)`);
  return fail === 0;
}

function main() {
  const mode = (process.argv[2] || "human").toLowerCase();
  if (mode === "selftest") process.exit(selftest() ? 0 : 1);
  const r = report();
  if (mode === "json") { console.log(JSON.stringify(r, null, 2)); return; }
  human(r);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
