#!/usr/bin/env node
// ============================================================================
// touchline.mjs · ARSENAL AI FC — THE ORGANISM: THE TOUCHLINE
// ----------------------------------------------------------------------------
// WHAT:  The in-day nervous system (THE_ORGANISM §V). Four senses: the TUNNEL
//        READ (the initiation wall, seen from outside), the TOUCHLINE READ
//        (productive struggle vs stuck-spinning vs cruising), the HEAVY-TOUCH
//        GAUGE (evening trim → a visible bench, never a deletion), the
//        WEAK-FOOT READ (deferral streaks — a fact, not a fit). The fifth
//        sense (MIXED-ZONE EAR) is EXILED from the confessional by law.
// LAW:   SENSING IS NOT INTERRUPTING. This organ never notifies, never pings,
//        never asks. Its only actuator is files other organs already put in
//        front of the captain. It may lighten, reorder, re-frame — it may
//        NEVER add work mid-day. Its output is data; it contains no imperative
//        addressed to the captain.
// CONSTITUTIONAL (each selftested):
//   · productive struggle ⇒ verdict only — DO NOTHING fields (desirable
//     difficulty is sacred ground; the classifier's refusal to touch it is
//     what keeps this scientific).
//   · the ear ships {enabled:false, surface:"scrimmage_only"} hardcoded;
//     FORGE-Bolo remains unmeasured ground, forever.
//   · wall minutes carry {trend_only:true} — rendered weekly, never a daily
//     meter, hidden on RED days (viz enforces; the marker rides here).
//   · no push/notify code path exists in this organ.
//
// INPUT:  touchline_config.json (canon) · ActivityWatch REST (injectable) ·
//         buckets.json (app classification) · reps_log.jsonl · cards.json ·
//         own pitch_read_history.jsonl
// OUTPUT: pitch_read.json + pitch_read_history.jsonl (sole writer of both)
// MODES:  run (default) · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CFG_PATH  = join(STATE_DIR, "touchline_config.json");
const OUT       = join(STATE_DIR, "pitch_read.json");
const HIST      = join(STATE_DIR, "pitch_read_history.jsonl");

const DEFAULTS = {
  aw_base_env: "AW_API_BASE",
  aw_default: "http://localhost:5600",
  kickoff: "09:00",
  tunnel: { window_min: 45, min_switches: 11, max_learning_min: 5 },
  struggle: { last_n: 6, spin_axis_repeat: 3, fast_ms: 8000 },
  tank: { above_line: 6 },
  weak_foot: { deferral_streak: 3 },
  ear: { enabled: false, surface: "scrimmage_only" },
};

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

function loadConfig(path = CFG_PATH) {
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      return {
        aw_base_env: j.aw_base_env || DEFAULTS.aw_base_env,
        aw_default: j.aw_default || DEFAULTS.aw_default,
        kickoff: j.kickoff || DEFAULTS.kickoff,
        tunnel: { ...DEFAULTS.tunnel, ...(j.tunnel || {}) },
        struggle: { ...DEFAULTS.struggle, ...(j.struggle || {}) },
        tank: { ...DEFAULTS.tank, ...(j.tank || {}) },
        weak_foot: { ...DEFAULTS.weak_foot, ...(j.weak_foot || {}) },
        ear: { enabled: false, surface: "scrimmage_only" },   // hardcoded — config cannot enable it
      };
    }
  } catch { /* malformed → defaults */ }
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => {
  const out = [];
  try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch {} } } catch {}
  return out;
};

// classify an app/title into a bucket via committed buckets.json rules (same
// substring semantics as timeaudit.mjs — duplicated by house law, not imported).
function classifyApp(app, title, buckets) {
  if (!buckets || !buckets.rules) return "Meta";
  const hay = `${app || ""} ${title || ""}`.toLowerCase();
  for (const bucket of ["Learning", "Building", "Meta"]) {
    const rule = buckets.rules[bucket];
    if (!rule) continue;
    for (const a of (rule.apps || [])) if (hay.includes(String(a).toLowerCase())) return bucket;
    for (const d of (rule.domains || [])) if (hay.includes(String(d).toLowerCase())) return bucket;
  }
  return buckets.default || "Meta";
}

// ---------------------------------------------------------------------------
// senses (pure)
// ---------------------------------------------------------------------------
// TUNNEL: present-but-circling after kickoff — many short window-hops, none in
// the Learning bucket. Wall minutes accumulate across runs on the same date.
function tunnelRead(windowEvents, buckets, cfg, now, prevSameDay) {
  const kick = new Date(now); {
    const [h, m] = cfg.kickoff.split(":").map(Number);
    kick.setHours(h, m, 0, 0);
  }
  if (now < kick) return { state: "pre_kickoff", wall_minutes_today: prevSameDay ? prevSameDay.tunnel.wall_minutes_today : 0, evidence: "before kickoff", trend_only: true };
  const cutoff = now.getTime() - cfg.tunnel.window_min * 60000;
  const recent = (windowEvents || []).filter(e => new Date(e.timestamp).getTime() >= cutoff);
  if (!recent.length) return { state: "no_data", wall_minutes_today: prevSameDay ? prevSameDay.tunnel.wall_minutes_today : 0, evidence: "no window events", trend_only: true };
  const switches = recent.length;
  const learnMin = recent.filter(e => classifyApp(e.data && e.data.app, e.data && e.data.title, buckets) === "Learning")
    .reduce((a, e) => a + (e.duration || 0), 0) / 60;
  const wall = switches >= cfg.tunnel.min_switches && learnMin <= cfg.tunnel.max_learning_min;
  const prevWall = prevSameDay ? prevSameDay.tunnel.wall_minutes_today : 0;
  return {
    state: wall ? "wall" : "clear",
    wall_minutes_today: wall ? prevWall + cfg.tunnel.window_min / 3 : prevWall,   // conservative accrual per read
    evidence: `${switches} window-switches, ${Math.round(learnMin)} Learning-min in last ${cfg.tunnel.window_min}min`,
    trend_only: true,
  };
}

// STRUGGLE over the last N reps today: the verdict the captain cannot feel
// from inside. productive ⇒ DO NOTHING.
function struggleRead(repsToday, cfg) {
  const last = repsToday.slice(-cfg.struggle.last_n);
  if (last.length < cfg.struggle.last_n) return { verdict: "no_data", basis: `${last.length} reps today (< ${cfg.struggle.last_n})` };
  const confRank = { guessed: 0, shaky: 1, knew: 2 };
  const lat = last.map(r => typeof r.latency_ms === "number" ? r.latency_ms : null);
  const latKnown = lat.filter(x => x !== null);
  const latRising = latKnown.length >= 3 && latKnown[latKnown.length - 1] > latKnown[0];
  const confFalling = confRank[last[last.length - 1].confidence] < confRank[last[0].confidence];
  const correctFrac = last.filter(r => r.correct).length / last.length;
  const wrongSameAxis = (() => {
    const axes = last.filter(r => !r.correct && r.axis).map(r => r.axis);
    const counts = {};
    for (const a of axes) counts[a] = (counts[a] || 0) + 1;
    return Math.max(0, ...Object.values(counts));
  })();
  const guessedWrong = last.filter(r => !r.correct && r.confidence === "guessed").length;
  if (wrongSameAxis >= cfg.struggle.spin_axis_repeat || (guessedWrong >= 3 && correctFrac < 0.34))
    return { verdict: "spinning", basis: `wrong repeating on one axis ×${wrongSameAxis}, correct ${Math.round(correctFrac * 100)}%` };
  if (correctFrac >= 0.5 && (latRising || confFalling))
    return { verdict: "productive", basis: `correct holding ${Math.round(correctFrac * 100)}%, latency ${latRising ? "climbing" : "steady"}, confidence ${confFalling ? "falling" : "steady"}` };
  const allFastKnew = last.every(r => r.correct && r.confidence === "knew" && (r.latency_ms === null || r.latency_ms === undefined || r.latency_ms <= cfg.struggle.fast_ms));
  if (allFastKnew) return { verdict: "cruising", basis: "fast + correct + knew across the window" };
  return { verdict: "productive", basis: `mixed window, correct ${Math.round(correctFrac * 100)}% — the forge working` };
}

// TANK: visible bench over the due list — never a silent deletion.
function tankRead(cards, cfg) {
  const due = (cards && Array.isArray(cards.hardest_due)) ? cards.hardest_due : [];
  const above = due.slice(0, cfg.tank.above_line);
  const benched = due.slice(cfg.tank.above_line);
  return {
    above_line: above,
    benched,
    note: due.length ? `${above.length} above the line, ${benched.length} benched — doable by doing them` : "no due queue yet",
  };
}

// WEAK-FOOT: served-but-not-returned across consecutive history days — a fact.
function weakFootRead(history, repsByDate, cfg) {
  const streaks = {};
  const days = history.slice(-7);
  for (const day of days) {
    const served = new Set(day.due_served || []);
    const played = repsByDate[day.date] || new Set();
    for (const c of served) {
      if (played.has(c)) streaks[c] = 0;
      else streaks[c] = (streaks[c] || 0) + 1;
    }
  }
  return { streaks: Object.entries(streaks).filter(([, n]) => n >= cfg.weak_foot.deferral_streak).map(([concept, n]) => ({ concept, n })) };
}

function buildRead({ tunnel, struggle, tank, weak_foot, now }) {
  return {
    date: localDate(now),
    status: "ok",
    low_confidence: false,
    generated_at: now.toISOString(),
    tunnel, struggle, tank, weak_foot,
    ear: { enabled: false, surface: "scrimmage_only" },
  };
}

async function awFetch(base, path, timeout = 10000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  try { const res = await fetch(base + path, { signal: ctl.signal }); return res.ok ? await res.json() : null; }
  catch { return null; }
  finally { clearTimeout(t); }
}

// ---------------------------------------------------------------------------
// selftest — fixtures only
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const cfg = loadConfig("__no_such__");
  const now = new Date(2026, 6, 12, 10, 30, 0);
  const buckets = { default: "Meta", rules: { Learning: { apps: ["gemini", "colab"], domains: ["gemini.google.com"] }, Building: { apps: ["code"], domains: [] }, Meta: { apps: ["youtube"], domains: [] } } };

  // TUNNEL
  const hop = (minAgo, app, durS = 30) => ({ timestamp: new Date(now.getTime() - minAgo * 60000).toISOString(), duration: durS, data: { app, title: "" } });
  const wallEvents = Array.from({ length: 14 }, (_, i) => hop(i * 3, i % 2 ? "explorer" : "spotify"));
  const t1 = tunnelRead(wallEvents, buckets, cfg, now, null);
  assert("tunnel: many hops + no Learning = wall", t1.state === "wall" && t1.wall_minutes_today > 0);
  const clearEvents = [hop(5, "gemini", 1800), hop(40, "colab", 900)];
  const t2 = tunnelRead(clearEvents, buckets, cfg, now, { tunnel: { wall_minutes_today: 24 } });
  assert("tunnel: Learning present = clear, wall minutes carried not reset", t2.state === "clear" && t2.wall_minutes_today === 24);
  assert("tunnel carries trend_only marker (weekly trend, never daily meter)", t1.trend_only === true);
  const t3 = tunnelRead([], buckets, cfg, new Date(2026, 6, 12, 8, 0, 0), null);
  assert("tunnel: before kickoff = pre_kickoff (no wall accrues)", t3.state === "pre_kickoff");

  // STRUGGLE
  const rep = (correct, conf, lat, axis) => ({ correct, confidence: conf, latency_ms: lat, axis });
  const productive = [rep(true, "knew", 4000), rep(true, "knew", 6000), rep(false, "shaky", 8000), rep(true, "shaky", 10000), rep(true, "shaky", 12000), rep(true, "guessed", 15000)];
  const sp = struggleRead(productive, cfg);
  assert("struggle: latency↑ conf↓ correct-holding = productive", sp.verdict === "productive");
  assert("PRODUCTIVE = DO-NOTHING — verdict+basis only, no actuator fields", Object.keys(sp).sort().join(",") === "basis,verdict");
  const spinning = [rep(false, "guessed", 5000, "e"), rep(false, "guessed", 5000, "e"), rep(false, "shaky", 5000, "e"), rep(true, "guessed", 5000, "a"), rep(false, "guessed", 5000, "e"), rep(false, "guessed", 5000, "e")];
  assert("struggle: wrong repeating on one axis = spinning", struggleRead(spinning, cfg).verdict === "spinning");
  const cruising = Array(6).fill(rep(true, "knew", 3000));
  assert("struggle: fast+correct+knew = cruising", struggleRead(cruising, cfg).verdict === "cruising");
  assert("struggle: thin data = no_data (never guesses)", struggleRead([rep(true, "knew", 1)], cfg).verdict === "no_data");

  // TANK
  const tank = tankRead({ hardest_due: ["a", "b", "c", "d", "e", "f", "g", "h"] }, cfg);
  assert("tank: bench visible, never deleted", tank.above_line.length === 6 && tank.benched.length === 2 && tank.note.includes("benched"));
  assert("tank: empty due queue safe", tankRead(null, cfg).above_line.length === 0);

  // WEAK-FOOT
  const hist = [
    { date: "2026-07-09", due_served: ["chunking", "embeddings"] },
    { date: "2026-07-10", due_served: ["chunking", "embeddings"] },
    { date: "2026-07-11", due_served: ["chunking"] },
  ];
  const repsBy = { "2026-07-10": new Set(["embeddings"]) };
  const wf = weakFootRead(hist, repsBy, cfg);
  assert("weak-foot: 3-day served-not-returned streak fires (a fact, not a fit)", wf.streaks.some(s => s.concept === "chunking" && s.n === 3));
  assert("weak-foot: returned concept resets", !wf.streaks.some(s => s.concept === "embeddings"));

  // EAR + no-push law
  const read = buildRead({ tunnel: t1, struggle: sp, tank, weak_foot: wf, now });
  assert("EAR EXILED — hardcoded disabled + scrimmage_only", read.ear.enabled === false && read.ear.surface === "scrimmage_only");
  const cfgTampered = loadConfigFromObject({ ear: { enabled: true, surface: "forge_bolo" } });
  assert("EAR cannot be enabled via config (confessional stays unmeasured)", cfgTampered.ear.enabled === false && cfgTampered.ear.surface === "scrimmage_only");
  const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
  // structural: no push-channel client anywhere (needle built dynamically so
  // this assert never matches itself), and the only fetch is a GET (no method:)
  const needle = "nt" + "fy.sh";
  assert("NO-PING LAW — no push-channel client, fetch is GET-only", !src.includes(needle) && !/method\s*:\s*["']POST/i.test(src));
  const asJson = JSON.stringify(read);
  assert("no imperative to the captain in output (data only)", !/do this now|you must|you should/i.test(asJson));

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

function loadConfigFromObject(j) {
  return {
    ...JSON.parse(JSON.stringify(DEFAULTS)),
    ...(j || {}),
    ear: { enabled: false, surface: "scrimmage_only" },      // hardcoded, always
  };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "run").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  const cfg = loadConfig();
  const now = new Date();
  const today = localDate(now);
  const base = process.env[cfg.aw_base_env] || cfg.aw_default;
  const buckets = readJson(join(STATE_DIR, "buckets.json"));
  const cards = readJson(join(STATE_DIR, "cards.json"));
  const reps = readLines(join(STATE_DIR, "reps_log.jsonl"));
  const repsToday = reps.filter(r => String(r.ts || "").slice(0, 10) === today);
  const history = readLines(HIST);
  const prevSameDay = readJson(OUT);
  const prev = prevSameDay && prevSameDay.date === today ? prevSameDay : null;

  // AW window events for today (graceful when AW is down)
  let windowEvents = null;
  const bucketMap = await awFetch(base, "/api/0/buckets/");
  if (bucketMap) {
    const winId = Object.keys(bucketMap).find(b => b.startsWith("aw-watcher-window"));
    if (winId) {
      const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
      windowEvents = await awFetch(base, `/api/0/buckets/${encodeURIComponent(winId)}/events?start=${dayStart.toISOString()}&end=${now.toISOString()}&limit=2000`);
    }
  }

  const repsByDate = {};
  for (const r of reps) {
    const d = String(r.ts || "").slice(0, 10);
    (repsByDate[d] = repsByDate[d] || new Set()).add(String(r.concept || "").toLowerCase());
  }

  const read = buildRead({
    tunnel: tunnelRead(windowEvents, buckets, cfg, now, prev),
    struggle: struggleRead(repsToday, cfg),
    tank: tankRead(cards, cfg),
    weak_foot: weakFootRead(history, repsByDate, cfg),
    now,
  });
  writeAtomic(OUT, read);
  // one daily summary line in history (idempotent per date: only append once/day)
  if (!history.some(h => h.date === today)) {
    appendFileSync(HIST, JSON.stringify({
      date: today,
      due_served: (cards && cards.hardest_due) || [],
      wall_minutes: read.tunnel.wall_minutes_today,
      struggle: read.struggle.verdict,
    }) + "\n");
  }
  console.log(`touchline: tunnel=${read.tunnel.state} struggle=${read.struggle.verdict} bench=${read.tank.benched.length} weak-foot=${read.weak_foot.streaks.length} → ${OUT}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { tunnelRead, struggleRead, tankRead, weakFootRead, buildRead, classifyApp, loadConfig, loadConfigFromObject };
