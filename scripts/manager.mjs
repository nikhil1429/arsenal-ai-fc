// ============================================================================
// scripts/manager.mjs — THE MANAGER · Agent #1 (roster) / capstone (build).
//
// WHAT:  The deterministic wrapper — §9 THE SPLIT, Part 1. NO LLM lives in here.
//        It globs the state bus, staleness-checks it, computes ALL the numbers
//        (the ONLY numbers allowed downstream), assembles the formation-read +
//        compressed prompt, calls a PLUGGED llm() (M-1 default = stub ⇒ always
//        falls back), validates the output (template · line-cap · no-invented-
//        number), and writes team_sheet.md — the sheet appears UNCONDITIONALLY.
// SPLIT: Part 2 (Opus, judgment only) is M-3 — it swaps the stub for `claude -p`.
//        Opus never does math and never invents a number; it reasons over the
//        FEATURES this wrapper computed.  (THE_MANAGER §9.)
// LAW:   Bias-to-silence propagates UP — a null / awaiting_data agent field
//        NEVER produces a line.  The fallback skeleton doubles as the cold-start
//        (Matchday-1 · Introduction) sheet.  (THE_MANAGER §5, §11 Example A.)
// READS (dressing-room/state/, all missing/parse-fail ⇒ null, never throws):
//        readiness.json · timeaudit.json · cards.json · calibration.json ·
//        weaknesses.json · learning_state.json · season.json · captain_note.md ·
//        post_match/<yesterday>.md
// WRITES (sole writer): team_sheet.md · manager_notes.json (run log — NOT
//        matches_played; that increments at post-match, a later milestone).
// MODES: node scripts/manager.mjs            → generate today's team sheet (real state)
//        node scripts/manager.mjs selftest   → baked mocks (real state never touched)
// GUARDS (M-3): ANTHROPIC_API_KEY never set + Extra-Usage OFF = hard $100 ceiling.
// ENV:   ESM entry-check uses pathToFileURL(process.argv[1]).  Atomic temp→rename.
// ============================================================================
import { readFileSync, writeFileSync, mkdirSync, renameSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Script-anchored (CWD-independent, matches fsrs/calibration) — override via stateDir / ARSENAL_STATE_DIR.
const DEFAULT_STATE = join(__dirname, "..", "dressing-room", "state");
const mkP = (dir) => (f) => join(dir, f);
// LOCAL date (matches the signal agents' localDate) — NEVER UTC toISOString (that skews vs local-stamped agents).
const todayISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const shiftDay = (iso, n) => { const [y, m, dd] = iso.split("-").map(Number); const d = new Date(y, m - 1, dd); d.setDate(d.getDate() + n); return todayISO(d); };

// ---- load bus (missing / parse-fail ⇒ null, never throws) -------------------
function loadBus(P, today) {
  const readJSON = (f) => { try { return JSON.parse(readFileSync(P(f), "utf8")); } catch { return null; } };
  const readText = (f) => { try { return readFileSync(P(f), "utf8").trim(); } catch { return null; } };
  const yday = shiftDay(today, -1);
  return {
    readiness: readJSON("readiness.json"),
    timeaudit: readJSON("timeaudit.json"),
    cards: readJSON("cards.json"),
    calibration: readJSON("calibration.json"),
    weaknesses: readJSON("weaknesses.json"),
    learning_state: readJSON("learning_state.json"),
    season: readJSON("season.json"),
    season_read: readJSON("season_read.json"),         // M18 — the night's whole-season re-read
    captain_note: readText("captain_note.md"),
    last_post_match: readText(join("post_match", yday + ".md")),
  };
}

// ---- staleness: a JSON source is fresh iff its `date` === today -------------
function readinessFresh(R, today) {
  if (R == null) return "missing";
  const day = R.day || R.date || null;                 // Goalkeeper stamps `day` (Oura sleep-day)
  if (!day) return "stale(?)";
  const lag = daysBetween(day, today);
  return (lag != null && lag >= 0 && lag <= 2) ? "fresh" : `stale(${day})`;   // Oura sync lag ≤2d is NORMAL
}
function staleness(bus, today) {
  const exact = (s) => s == null ? "missing" : (s.date === today ? "fresh" : `stale(${s.date || "?"})`);
  const map = { readiness: readinessFresh(bus.readiness, today) };
  for (const k of ["timeaudit", "cards", "calibration", "weaknesses", "learning_state"]) map[k] = exact(bus[k]);
  return map;
}

// ---- Season Arc phase (§6) — keyed on matches_played, regression-honest -----
function phaseFor(mp = 0) {
  if (mp <= 1) return { key: "introduction", emoji: "🤝", name: "Introduction" };
  if (mp <= 8) return { key: "building", emoji: "🌱", name: "Building Trust" };
  if (mp <= 25) return { key: "partnership", emoji: "🤜", name: "Partnership" };
  return { key: "brotherhood", emoji: "⚔️", name: "Brotherhood" };
}
function daysBetween(a, b) { const ms = Date.parse(b) - Date.parse(a); return Number.isFinite(ms) ? Math.round(ms / 86400000) : null; }

// ---- FEATURES: the ONLY numbers allowed downstream. Everything null-safe. ----
// Bias-to-silence: a section is present ONLY when its agent is status "ok" with content.
function computeFeatures(bus, today) {
  const S = bus.season || {};
  const mp = Number.isInteger(S.matches_played) ? S.matches_played : 0;
  const phase = phaseFor(mp);
  const R = bus.readiness, T = bus.timeaudit;
  const okCards = bus.cards && bus.cards.status === "ok";
  const okCal = bus.calibration && bus.calibration.status === "ok";
  const kal = (() => { const pm = bus.last_post_match; if (!pm) return null; const m = pm.match(/KAL-?LINE\s*→\s*(.+)/i); return m ? m[1].trim() : null; })();
  return {
    date: today,
    matchday: mp + 1,                                  // today is the next match
    phase,
    season: {
      season_day: Number.isInteger(S.season_day) ? S.season_day : 1,
      matches_played: mp,
      trophy: S.trophy || "the trophy",
      trophy_state: S.trophy_state || "unlit",
      pipeline_item: S.pipeline_item || null,
      days_to_ship: S.target_ship ? daysBetween(today, S.target_ship) : null,
      paused_until: S.paused_until || null,
    },
    readiness: R ? {
      verdict: R.verdict || null, ceiling: R.ceiling || null,
      // real Goalkeeper: workType = array (not work_type_overlay); timing = object (not string) — normalise both
      work_type: Array.isArray(R.workType) ? R.workType : (R.work_type_overlay ? [R.work_type_overlay] : []),
      timing: R.timing || null,                        // object|string — rendered via shapeFromTiming()
      convergence: R.convergence || (R.signals && R.signals.verdict_driver) || null,
      flags: Array.isArray(R.flags) ? R.flags : [],
    } : null,                                          // missing ⇒ grind honored downstream
    time: T ? {
      building_pct: T.building_pct ?? null, building_target: T.building_target ?? null,
      meta_pct: T.meta_pct ?? null, on_track: T.on_track || null,
    } : null,
    study: okCards ? {
      due_today: bus.cards.due_today ?? 0, overdue: bus.cards.overdue ?? 0,
      hardest_due: bus.cards.hardest_due || [],
    } : null,
    calibration: okCal ? {
      gap: bus.calibration.calibration_gap, trend: bus.calibration.trend || null,
      danger: bus.calibration.danger_zone || [],       // agent already gated to "ok"
    } : null,
    // Nemesis already surfaces these (Fork A3) — consume, never re-derive. null-safe.
    headline: bus.weaknesses ? bus.weaknesses.headline : null,        // {id,topic,axis,one_line}|null
    axis_pattern: bus.weaknesses ? bus.weaknesses.axis_pattern : null,
    formation: bus.learning_state ? {
      maidan_stage_focus: bus.learning_state.maidan_stage_focus || null,
      weak_connection: bus.learning_state.weak_connection || null,
      python_fluency: bus.learning_state.python_fluency || {},
      rejirah_due: bus.learning_state.rejirah_due || [],
      core_vs_light: bus.learning_state.core_vs_light || {},          // {core,light} fixed keys
    } : null,
    captain_note: bus.captain_note || null,
    kal_line: kal,
    // M18 — the season re-read (bias-to-silence: fresh ≤7d AND non-empty, else null)
    season_read: (() => {
      const sr = bus.season_read;
      if (!sr || !sr.date) return null;
      const lag = daysBetween(sr.date, today);
      if (lag == null || lag < 0 || lag > 7) return null;
      const contradiction = (sr.contradictions || [])[0] || null;
      const edge = (sr.confusion_edges || [])[0] || null;
      const thread = (sr.open_threads || [])[0] || null;
      if (!contradiction && !edge && !thread) return null;
      return { date: sr.date, contradiction, edge, open_thread: thread };
    })(),
  };
}

// ---- formation-read INPUTS (§6.5) — candidates only; the LLM makes the pick --
function formationInputs(F) {
  const verdict = F.readiness?.verdict || "GREEN";      // missing readiness ⇒ grind honored
  const intensity = verdict === "RED" ? "rest/consolidate — floor only"
    : verdict === "AMBER" ? "consolidate one HELD connection (not first-exposure)"
    : "hardest connection at match-intensity (adversarial, cross-concept)";
  return {
    weak_handoff: F.formation?.weak_connection || null,
    top_weakness_line: F.headline?.one_line || null,
    axis_pattern: F.axis_pattern || null,
    due_high_leverage: (F.formation?.rejirah_due || [])[0] || null,
    intensity,
    shipping_candidate: F.season.pipeline_item,
  };
}

// ---- zero-hallucination: allowed-number set from EVERY numeric token in F ----
function allowedNumbers(F) {
  const set = new Set();
  const eat = (v) => {
    if (v == null) return;
    if (typeof v === "number") { set.add(String(v)); return; }
    if (typeof v === "string") { (v.match(/\d+(?:\.\d+)?/g) || []).forEach((n) => set.add(n)); return; }
    if (Array.isArray(v)) return v.forEach(eat);
    if (typeof v === "object") return Object.values(v).forEach(eat);
  };
  eat(F);
  for (let i = 0; i <= 31; i++) set.add(String(i));    // ordinals / small counts / matchday
  return set;
}

// ---- assemble the compressed prompt (FEATURES + formation, NOT raw JSON) -----
function assemblePrompt(F, fin) {
  return [
    `PHASE: ${F.phase.emoji} ${F.phase.name} (matchday ${F.matchday}, ${F.season.matches_played} played)`,
    `READINESS: ${F.readiness ? `${F.readiness.verdict} · ${F.readiness.ceiling} · ${(F.readiness.work_type || []).join("; ")}` : "no verdict (grind honored)"}`,
    `TIME: ${F.time ? `Building ${F.time.building_pct}%/${F.time.building_target}% · Meta ${F.time.meta_pct}%` : "no audit yet"}`,
    `CARDS: ${F.study ? `${F.study.due_today} due, ${F.study.overdue} overdue [${F.study.hardest_due.join(", ")}]` : "awaiting data"}`,
    `WEAKNESS: ${F.headline ? F.headline.one_line : "none surfaced (bias-to-silence)"}`,
    `DANGER: ${F.calibration?.danger?.length ? F.calibration.danger.map((d) => d.topic).join(", ") : "none"}`,
    `FORMATION: ${F.formation?.weak_connection ? `weak handoff ${F.formation.weak_connection}` : "awaiting data"}`,
    `INTENSITY: ${fin.intensity}`,
    `SHIPPING: ${fin.shipping_candidate || "n/a"}`,
    `KAL-LINE (yesterday): ${F.kal_line || "none"}`,
    `SEASON RE-READ: ${F.season_read ? [F.season_read.contradiction ? `contradiction — "${F.season_read.contradiction.a}" vs "${F.season_read.contradiction.b}"` : null, F.season_read.edge ? `cross-week blur ${F.season_read.edge.from} ↔ ${F.season_read.edge.to}` : null, F.season_read.open_thread ? `never closed — ${F.season_read.open_thread.thread}` : null].filter(Boolean).join(" · ") : "none fresh"}`,
    `TASK: write team_sheet.md per template, Gaffer voice, phase-appropriate. Use ONLY the numbers above.`,
  ].join("\n");
}

// ---- validate an LLM sheet: template + line-cap + no-invented-number ---------
const LINE_CAP = 40;
function validate(text, F) {
  if (!text || typeof text !== "string") return { ok: false, reason: "empty" };
  const lines = text.split("\n");
  if (lines.length > LINE_CAP) return { ok: false, reason: `line-cap (${lines.length}>${LINE_CAP})` };
  if (!/TEAM SHEET/.test(text) || !/COYG/.test(text)) return { ok: false, reason: "template markers missing" };
  const allowed = allowedNumbers(F);
  const nums = text.replace(/\d{4}-\d{2}-\d{2}/g, "").replace(/\d{1,2}:\d{2}/g, "").match(/\d+(?:\.\d+)?/g) || [];
  const invented = nums.filter((n) => !allowed.has(n));
  if (invented.length) return { ok: false, reason: `invented number(s): ${[...new Set(invented)].join(", ")}` };
  return { ok: true };
}

// timing may be Goalkeeper's object {wake,peak1,dip,peak2,blocks} or a plain string — one line either way
function shapeFromTiming(timing) {
  if (!timing) return "one clean 90-min block in your peak, then reps";
  if (typeof timing === "string") return timing;
  const range = (s) => (typeof s === "string" ? s.split("(")[0].trim() : "");
  const peaks = [range(timing.peak1), range(timing.peak2)].filter(Boolean).join(" & ");
  const blocks = typeof timing.blocks === "string" ? timing.blocks : "";
  return peaks ? `peak windows ${peaks}${blocks ? "; " + blocks : ""}` : (blocks || "one clean 90-min block, then reps");
}

// ---- FALLBACK skeleton = deterministic sheet from F alone (also = cold-start) -
function fallbackSkeleton(F, fin) {
  const L = [];
  L.push(`⚪🔴 TEAM SHEET — ${F.date} · Matchday ${F.matchday} · ${F.phase.emoji} ${F.phase.name}`);
  L.push("────────────────────────────────");
  L.push("THE GAFFER:");
  if (F.phase.key === "introduction") L.push("Captain. We start today. I don't know you yet — every day you show up, I learn you. Behaviour over reputation. Let's go to work.");
  else L.push("Captain. Fresh sheet. Control the controllables — one clean block, then the reps.");
  L.push("");
  const one = fin.shipping_candidate || fin.weak_handoff || "the first brick of the trophy";
  L.push(`⚽ TODAY'S ONE THING: ${one}`);
  L.push(`   └ why this, not that: ${fin.weak_handoff ? "the weak handoff is the highest-leverage drill" : "it's the first brick; polish can wait"}`);
  L.push("");
  const rv = F.readiness?.verdict || "GREEN";
  const wt0 = F.readiness?.work_type?.[0] || null;
  L.push(`🔋 ENERGY: ${rv} — ${F.readiness?.ceiling || "full ceiling"}${wt0 ? " · " + wt0 : ""}`);
  L.push(`🕐 SHAPE: ${shapeFromTiming(F.readiness?.timing)}`);
  L.push(`🪑 BENCHED TODAY: no system-tinkering, no rig-tweaks — ${fin.intensity.includes("rest") ? "rest is the work today" : "build the thing"}`);
  L.push("");
  L.push("📋 SQUAD REPORTS (reconciled):");
  const rep = [];
  if (F.headline) rep.push(`   • ${F.headline.one_line}`);
  if (F.calibration?.danger?.length) rep.push(`   • confident-wrong: ${F.calibration.danger.map((d) => d.topic).join(", ")} → tighter interval`);
  if (F.study && (F.study.due_today || F.study.overdue)) rep.push(`   • cards due: ${F.study.due_today} (+${F.study.overdue} overdue)`);
  if (F.time && F.time.on_track) rep.push(`   • ${F.time.on_track}`);
  if (F.season_read) {                                 // M18 — one line, the sharpest find first
    const sr = F.season_read;
    if (sr.contradiction) rep.push(`   • season re-read: "${sr.contradiction.a}" vs "${sr.contradiction.b}" — un-reconciled`);
    else if (sr.edge) rep.push(`   • season re-read: ${sr.edge.from} ↔ ${sr.edge.to} keep blurring across weeks`);
    else if (sr.open_thread) rep.push(`   • season re-read: still open — ${sr.open_thread.thread}`);
  }
  if (!rep.length) rep.push("   • the rest of the squad reports in as we go — today it's just you and me.");
  for (const r of rep) L.push(r);
  L.push("");
  L.push(`🗣️ BOLO: ${F.headline ? `say one line out loud on ${F.headline.topic}` : "say one line out loud on today's why"}`);
  L.push(`🛟 FLOOR (never-zero): ${F.kal_line || "one file logged / one rep done. That's a won day."}`);
  const dts = F.season.days_to_ship;
  L.push(`🏆 TROPHY: ${F.season.trophy_state === "lit" ? "🟢 lit" : "🔒 unlit"} — ${F.season.pipeline_item || F.season.trophy}${dts != null ? ` · ${dts}d to ship` : ""}`);
  L.push("────────────────────────────────");
  L.push("COYG. ⚪🔴");
  return L.join("\n");
}

function writeAtomic(dir, path, text) {
  mkdirSync(dir, { recursive: true });
  const tmp = path + ".tmp"; writeFileSync(tmp, text + "\n"); renameSync(tmp, path);
}

// ---- run: llm is INJECTED (default stub returns null ⇒ M-1 = fallback) -------
export async function runManager({ today = todayISO(), llm = async () => null, stateDir } = {}) {
  const dir = stateDir || process.env.ARSENAL_STATE_DIR || DEFAULT_STATE;
  const P = mkP(dir);
  const bus = loadBus(P, today);
  const stale = staleness(bus, today);
  const F = computeFeatures(bus, today);
  const fin = formationInputs(F);
  const prompt = assemblePrompt(F, fin);
  let sheet = null, source = "fallback", reason = "no-llm (M-1)";
  try {
    const out = await llm(prompt);
    const v = validate(out, F);
    if (v.ok) { sheet = out; source = "llm"; reason = "validated"; }
    else if (out != null) reason = `llm rejected: ${v.reason}`;
  } catch (e) { reason = `llm error: ${e.message}`; }
  if (!sheet) sheet = fallbackSkeleton(F, fin);                       // sheet appears UNCONDITIONALLY
  writeAtomic(dir, P("team_sheet.md"), sheet);
  const notes = { last_run: F.date, matchday: F.matchday, phase: F.phase.key, source, reason, staleness: stale };
  writeAtomic(dir, P("manager_notes.json"), JSON.stringify(notes, null, 2));
  return { sheet, source, reason, staleness: stale, features: F, prompt };
}

// ============================================================================
// selftest — baked mocks in a temp dir; the real state is NEVER touched.
// Fixtures below are VERBATIM real agent outputs (fsrs / calibration / nemesis /
// learning-state) captured on a rich rep-log + on the empty cold-start.
// ============================================================================
const FX = {
  rich: {
    cards: {"date":"2026-07-10","engine":"fsrs-6 (ts-fsrs 5.4.1)","request_retention":0.9,"total_cards":7,"due_today":0,"overdue":2,"hardest_due":["tool_use","chunking"],"status":"ok","generated_at":"2026-07-10T23:27:32.282Z"},
    calibration: {"date":"2026-07-10","calibration_gap":0.1932,"trend":"establishing baseline (37 reps)","overconfidence_rate":0.1923,"buckets":{"knew":{"n":26,"accuracy":0.8077},"shaky":{"n":9,"accuracy":0.3333},"guessed":{"n":2,"accuracy":0}},"danger_zone":[{"topic":"chunking","confidence":"high","accuracy":"low","axis":"f","note":"confident-wrong = the dangerous illusion → tighter interval"}],"total_reps":37,"status":"ok","low_confidence":false,"generated_at":"2026-07-10T23:27:32.338Z"},
    weaknesses: {"date":"2026-07-10","status":"ok","low_confidence":false,"headline":{"id":"chunking","topic":"chunking","axis":"f","one_line":"5× miss on chunking — axis f keeps breaking. today's #1 to scout — drill it before it drills you."},"axis_pattern":{"axis":"f","concepts":["chunking","retrieval","tool_use"],"strength":3,"note":"3 concepts (chunking, retrieval, tool_use) all break on axis f — the pattern is the opponent, not the topic. scout the KIND of thinking."},"weaknesses":[{"id":"chunking","topic":"chunking","recurrence":5,"last_seen":"2026-07-09","status":"open","evidence":["06-22 knew-wrong"],"axis":"f","score":2.6051}],"total_reps":37,"generated_at":"2026-07-10T23:27:32.372Z"},
    learning_state: {"date":"2026-07-10","generated_at":"2026-07-10T23:27:32.402Z","total_reps":37,"status":"ok","low_confidence":false,"maidan_stage_focus":"chunking → embeddings handoff","weak_connection":"chunking → embeddings (chunks → vectors)","python_fluency":{"pydantic":"🔴 learning","variables_types":"🔴 learning"},"rejirah_due":[{"concept":"tool_use","axis":"f (tradeoffs)","overdue_days":4},{"concept":"chunking","axis":"f (tradeoffs)","overdue_days":1}],"core_vs_light":{"core":"spine: 2/6 fluent","light":"0/1 fluent"}},
    readiness: {"engine":"v2-recalibrated","day":"2026-07-10","verdict":"AMBER","ceiling":"MODERATE","workType":["RETRIEVE/REVIEW known material (encoding capacity reduced) — favour consolidation over first-exposure learning"],"timing":{"wake":"07:30","peak1":"11:30–14:30  (hardest adversarial work)","dip":"15:30–17:00  (admin, easy review)","peak2":"17:30–20:30  (second hard block)","blocks":"~90-min deep-focus blocks; break between"}},
    season: {"phase":"partnership","season_day":14,"matches_played":12,"trophy":"FinOps Copilot live + eval-passing","trophy_state":"unlit","pipeline_item":"M1 extraction + Supabase (Building)","target_ship":"2026-08-20","paused_until":null},
  },
  cold: {
    cards: {"date":"2026-07-10","engine":"fsrs-6 (ts-fsrs 5.4.1)","request_retention":0.9,"total_cards":0,"due_today":0,"overdue":0,"hardest_due":[],"status":"awaiting_data","generated_at":"2026-07-10T23:28:02.795Z"},
    calibration: {"date":"2026-07-10","calibration_gap":null,"trend":"establishing baseline (0 reps)","overconfidence_rate":null,"buckets":{"knew":{"n":0,"accuracy":null},"shaky":{"n":0,"accuracy":null},"guessed":{"n":0,"accuracy":null}},"danger_zone":[],"total_reps":0,"status":"awaiting_data","low_confidence":true,"generated_at":"2026-07-10T23:28:02.831Z"},
    weaknesses: {"date":"2026-07-10","status":"awaiting_data","low_confidence":true,"headline":null,"axis_pattern":null,"weaknesses":[],"total_reps":0,"generated_at":"2026-07-10T23:28:02.860Z"},
    learning_state: {"date":"2026-07-10","generated_at":"2026-07-10T23:28:02.888Z","total_reps":0,"status":"awaiting_data","low_confidence":true,"maidan_stage_focus":null,"weak_connection":null,"python_fluency":{},"rejirah_due":[],"core_vs_light":{}},
    readiness: {"engine":"v2-recalibrated","day":"2026-07-10","verdict":"GREEN","ceiling":"HIGH","workType":["ENCODE: front-load new factual/declarative learning + memorisation","SYNTHESISE: creative synthesis, architecture / system-design, connecting concepts"],"timing":{"wake":"07:00","peak1":"11:00–14:00  (hardest adversarial work: mocks, timed system-design, novel problems)","dip":"15:00–16:30  (admin, email, easy review, MOVEMENT)","peak2":"17:00–20:00  (second hard block)","blocks":"~90-min deep-focus blocks; genuine non-screen break between; movement snack every 30–60 min"}},
    season: {"phase":"introduction","season_day":1,"matches_played":0,"trophy":"FinOps Copilot live + eval-passing","trophy_state":"unlit","pipeline_item":"M1 upload hub — accept one real invoice","target_ship":"2026-08-20","paused_until":null},
  },
};

async function selftest() {
  const TODAY = "2026-07-10";
  let pass = 0, fail = 0;
  const ok = (n, c) => { if (c) { pass++; console.log("  ✓ " + n); } else { fail++; console.log("  ✗ " + n); } };
  const stage = (kind) => {
    const dir = mkdtempSync(join(tmpdir(), "arsenal_manager_selftest_"));
    for (const [name, obj] of Object.entries(FX[kind])) {
      writeFileSync(join(dir, name + ".json"), JSON.stringify(obj));      // fixtures carry their own date/day
    }
    return dir;
  };

  // 1) COLD-START — the real state today (all agents awaiting_data)
  const cold = await runManager({ today: TODAY, stateDir: stage("cold") });
  ok("cold: no crash on null/empty surface fields", true);
  ok("cold: phase = Introduction (matches_played 0)", cold.features.phase.name === "Introduction");
  ok("cold: matchday = 1", cold.features.matchday === 1);
  ok("cold: NO weakness line (headline null ⇒ bias-to-silence)", !/•.*miss on/.test(cold.sheet));
  ok("cold: NO danger line (calibration awaiting)", !/confident-wrong/.test(cold.sheet));
  ok("cold: NO cards line (awaiting)", !/cards due/.test(cold.sheet));
  ok("cold: squad = 'just you and me' fallback line", /just you and me/.test(cold.sheet));
  ok("cold: no NaN/null/undefined leaked into sheet", !/(NaN|null|undefined)/.test(cold.sheet));
  ok("cold: trophy line present + unlit", /🏆 TROPHY: 🔒 unlit/.test(cold.sheet));
  ok("cold: template intact (header + COYG)", /TEAM SHEET/.test(cold.sheet) && /COYG/.test(cold.sheet));
  ok("cold: source = fallback (no LLM in M-1)", cold.source === "fallback");
  ok("cold: manager_notes written with phase", cold.staleness && cold.features.phase.key === "introduction");
  ok("cold: NO [object Object] (timing object rendered, not stringified)", !/\[object Object\]/.test(cold.sheet));
  ok("cold: SHAPE renders a real window from timing object", /🕐 SHAPE:.*11:00/.test(cold.sheet));
  ok("cold: workType directive rendered in ENERGY", /🔋 ENERGY:.*ENCODE/.test(cold.sheet));
  ok("cold: readiness reads fresh (day===today, Oura-lag tolerant)", cold.staleness.readiness === "fresh");

  // 2) RICH — verbatim real agent outputs
  const rich = await runManager({ today: TODAY, stateDir: stage("rich") });
  ok("rich: phase = Partnership (matches_played 12)", rich.features.phase.name === "Partnership");
  ok("rich: matchday = 13", rich.features.matchday === 13);
  ok("rich: consumes nemesis headline VERBATIM (not re-derived)", rich.sheet.includes("5× miss on chunking"));
  ok("rich: danger line fires on chunking", /confident-wrong: chunking/.test(rich.sheet));
  ok("rich: cards line = 0 due (+2 overdue)", /cards due: 0 \(\+2 overdue\)/.test(rich.sheet));
  ok("rich: formation weak_connection in prompt", rich.prompt.includes("chunking → embeddings"));
  ok("rich: core_vs_light read as {core} fixed key (not dummy arbitrary)", rich.features.formation.core_vs_light.core === "spine: 2/6 fluent");
  ok("rich: AMBER intensity = consolidate held", rich.prompt.includes("consolidate one HELD"));
  ok("rich: no NaN/null/undefined leaked", !/(NaN|null|undefined)/.test(rich.sheet));
  ok("rich: NO [object Object] (timing object rendered)", !/\[object Object\]/.test(rich.sheet));
  ok("rich: workType (RETRIEVE) rendered in ENERGY", /🔋 ENERGY:.*RETRIEVE/.test(rich.sheet));

  // 3) ZERO-HALLUCINATION — invented number rejected ⇒ fallback
  const bad = await runManager({ today: TODAY, stateDir: stage("rich"), llm: async () => "⚪🔴 TEAM SHEET — 2026-07-10 · Matchday 13\nYou're 73% Building today.\nCOYG. ⚪🔴" });
  ok("guard: invented '73' rejected ⇒ falls back", bad.source === "fallback" && /invented number/.test(bad.reason));

  // 4) VALID LLM sheet (numbers ∈ FEATURES) ⇒ accepted
  const good = await runManager({ today: TODAY, stateDir: stage("rich"), llm: async () => "⚪🔴 TEAM SHEET — 2026-07-10 · Matchday 13\nCaptain, chunking has missed 5 times — today we scout it.\nCOYG. ⚪🔴" });
  ok("guard: clean sheet (5 ∈ features) accepted ⇒ source=llm", good.source === "llm");

  // 4b) M18 — SEASON RE-READ: fresh read lands one line; stale is silent
  const srDir = stage("rich");
  writeFileSync(join(srDir, "season_read.json"), JSON.stringify({ date: TODAY, contradictions: [{ a: "kv cache fixes quadratic", b: "attention stays n-squared", where: "capsule vs dugout" }], open_threads: [], confusion_edges: [{ from: "tokenization", to: "embeddings", evidence: "3 sessions" }], note: "x" }));
  const sr = await runManager({ today: TODAY, stateDir: srDir });
  ok("season-read: fresh contradiction rides the sheet (one line)", /season re-read: .*un-reconciled/.test(sr.sheet));
  ok("season-read: the prompt carries the re-read for the LLM", /SEASON RE-READ: contradiction/.test(sr.prompt));
  const srStaleDir = stage("rich");
  writeFileSync(join(srStaleDir, "season_read.json"), JSON.stringify({ date: "2026-06-20", contradictions: [{ a: "x", b: "y" }], open_threads: [], confusion_edges: [] }));
  const srStale = await runManager({ today: TODAY, stateDir: srStaleDir });
  ok("season-read: a stale read (>7d) is SILENT (bias-to-silence)", srStale.features.season_read === null && !/season re-read/.test(srStale.sheet));

  // 5) MISSING readiness ⇒ grind honored, no crash, no RED-from-absence
  const nordDir = stage("rich");
  writeFileSync(join(nordDir, "readiness.json"), ""); // corrupt ⇒ parse-fail ⇒ null (simulates absence)
  const nord = await runManager({ today: TODAY, stateDir: nordDir });
  ok("missing-readiness: no crash", true);
  ok("missing-readiness: energy defaults GREEN (grind honored)", /🔋 ENERGY: GREEN/.test(nord.sheet));

  // 6) STALENESS — agents dated 07-10 flagged stale when today = 07-12
  const future = await runManager({ today: "2026-07-12", stateDir: stage("rich") });
  ok("staleness: cards flagged stale when today=07-12", /stale/.test(future.staleness.cards));

  // 7) DEFAULT date basis is LOCAL (not UTC) — stamp fixtures with the ACTUAL local today, pass NO today arg
  const LOCAL = todayISO();
  const localDir = mkdtempSync(join(tmpdir(), "arsenal_manager_selftest_"));
  for (const [name, obj] of Object.entries(FX.cold)) {
    const o = (name === "readiness") ? { ...obj, day: LOCAL } : { ...obj, date: LOCAL };
    writeFileSync(join(localDir, name + ".json"), JSON.stringify(o));
  }
  const def = await runManager({ stateDir: localDir });   // no `today` ⇒ uses local todayISO()
  ok("default-today: header uses LOCAL date (not UTC)", def.sheet.includes(LOCAL));
  ok("default-today: signal agent dated local-today reads fresh", def.staleness.cards === "fresh");
  ok("default-today: readiness (day=local-today) reads fresh", def.staleness.readiness === "fresh");

  console.log(`\n${fail === 0 ? "ALL CHECKS PASSED" : "FAILURES: " + fail} (${pass} passed, ${fail} failed)`);
  return fail === 0;
}

// ---- entry ------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  const r = await runManager();
  console.log(r.sheet);
  console.error(`\n[source=${r.source} · ${r.reason}]`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
