#!/usr/bin/env node
// ============================================================================
// viz.mjs · ARSENAL AI FC — THE ORGANISM: THE CLUB WALL (visualization organ)
// ----------------------------------------------------------------------------
// WHAT:  Visualization as a first-class organ (ORGANISM_ANATOMY §6). One
//        self-contained dark HTML file — inline SVG only, zero network, opens
//        offline from disk — rendering the whole body as living pictures: the
//        Maidan pitch, the season arc, calibration, the derby table,
//        doubts_retired, the wall trend, the body strip, the brain meter,
//        and ≤3 validated brain insights. He is ADHD-PI and thinks in
//        pictures; the wall is the daily-consumption surface OPS_STATE always
//        intended.
// CONSTITUTIONAL (each selftested):
//   · NEVER FAKE DATA — empty states render as honest, handsome "awaiting
//     blood" panels; no NaN/null/undefined ever leaks into the HTML.
//   · NO STREAKS — weekly-consistency % only; the word "streak" never renders.
//   · NO RAW BIOMETRICS — the body strip shows verdict + tier only; no
//     hrv/rhr/temp numbers on a rendered surface.
//   · WALL TREND is weekly-only and hidden entirely on RED days; RED days
//     render the minimal wall (KAL-line + floor) — his own wall never shows
//     him a loss before he's chosen to look.
//   · Brain insights render only if EVERY number in them exists in wall_data
//     (the Manager's zero-invented-numbers law, reused).
//
// INPUT (read-only): the whole bus. OUTPUT: wall_data.json +
//   dressing-room/club/wall.html (sole writer of both).
// MODES:  run (default) · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CLUB_DIR  = join(__dirname, "..", "dressing-room", "club");
const WALL_DATA = join(STATE_DIR, "wall_data.json");
const WALL_HTML = join(CLUB_DIR, "wall.html");

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => {
  const out = [];
  try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch {} } } catch {}
  return out;
};
function writeAtomic(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, typeof text === "string" ? text : JSON.stringify(text, null, 2) + "\n");
  renameSync(tmp, path);
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const safe = (v, fallback = "—") => (v === null || v === undefined || (typeof v === "number" && Number.isNaN(v))) ? fallback : v;

// ---------------------------------------------------------------------------
// data assembly (pure)
// ---------------------------------------------------------------------------
function assembleWallData(bus, now = new Date()) {
  const { learning_state, season, calibration, tape_room, history, readiness, brainLedger, vitals, drills, twin } = bus;
  const verdict = readiness && readiness.verdict ? String(readiness.verdict).toUpperCase() : "GREEN";

  // weekly consistency: won-days / days-elapsed over last 7 recorded days
  const days = (history || []).slice(-7);
  const weekly_consistency_pct = days.length
    ? Math.round(100 * days.filter(d => d.struggle && d.struggle !== "no_data").length / days.length) : null;

  // wall trend: weekly aggregate ONLY
  const wall_week_minutes = (history || []).slice(-7).reduce((a, d) => a + (d.wall_minutes || 0), 0);

  // brain meter from ledger
  const today = localDate(now);
  const todayCalls = (brainLedger || []).filter(l => String(l.ts || "").slice(0, 10) === today);
  const overnight = todayCalls.filter(l => { const h = new Date(l.ts).getHours(); return h >= 22 || h < 8; });

  return {
    date: today, generated_at: now.toISOString(), verdict,
    maidan: learning_state && learning_state.maidan ? learning_state.maidan : null,
    weak_connection: learning_state ? learning_state.weak_connection : null,
    season: {
      matches_played: season ? safe(season.matches_played, 0) : 0,
      trophy_state: season ? safe(season.trophy_state, "unlit") : "unlit",
      weekly_consistency_pct,
    },
    calibration: calibration && calibration.status === "ok" ? {
      gap: calibration.calibration_gap, trend: calibration.trend,
      buckets: calibration.buckets, danger: (calibration.danger_zone || []).map(d => d.topic),
    } : null,
    derby: learning_state && Array.isArray(learning_state.confusion_pairs) ? learning_state.confusion_pairs.slice(0, 5) : [],
    doubts_retired: tape_room ? safe(tape_room.doubts_retired, 0) : 0,
    tape_queue: tape_room && Array.isArray(tape_room.queue) ? tape_room.queue.length : 0,
    wall_week_minutes,
    body: { verdict },                                    // verdict ONLY — never raw biometrics
    bleeds: vitals && Array.isArray(vitals.bleeds) ? vitals.bleeds.map(b => b.kind) : [],
    brain: { calls_today: todayCalls.length, overnight_calls: overnight.length,
             tokens_today: todayCalls.reduce((a, l) => a + (l.total_tokens || 0), 0) },
    kal_line: bus.kal_line || null,
    drills_tomorrow: drills && Array.isArray(drills.drills) ? drills.drills.map(d => ({ kind: d.kind, emoji: d.probe_type_emoji })) : [],
    twin_voice: twin ? twin.voice : null,
    media: bus.media || null,   // {teamtalk_am,teamtalk_pm,poster,filmkit} — presence flags only
    commitments: Array.isArray(bus.commitments) ? bus.commitments.slice(-7) : [],   // kal-lines, kept (U4)
    // THE NOW STRIP (captain's call, high-dopamine): live odometers that only
    // count UP + the struggle verdict in forge-framing. No quota bars, no
    // wall-minutes daily meter (that law stands), hidden entirely on RED.
    now: {
      struggle: bus.pitch_read && bus.pitch_read.date === today ? bus.pitch_read.struggle.verdict : "no_data",
      learning_min: bus.timeaudit && bus.timeaudit.buckets && bus.timeaudit.buckets.Learning ? Math.round(bus.timeaudit.buckets.Learning.minutes || 0) : 0,
      building_min: bus.timeaudit && bus.timeaudit.buckets && bus.timeaudit.buckets.Building ? Math.round(bus.timeaudit.buckets.Building.minutes || 0) : 0,
      reps_today: bus.repsToday || 0,
    },
  };
}

// numbers whitelist (Manager's law, reused) for insight validation
function allowedNumbers(data) {
  const s = new Set();
  (function walk(v) {
    if (typeof v === "number" && Number.isFinite(v)) { s.add(String(v)); s.add(String(Math.round(v))); }
    else if (typeof v === "string") for (const m of v.match(/\d+(\.\d+)?/g) || []) s.add(m);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  })(data);
  for (let i = 0; i <= 31; i++) s.add(String(i));
  return s;
}
function validateInsights(text, data) {
  if (!text || !text.trim()) return null;
  const allowed = allowedNumbers(data);
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean).slice(0, 3);
  const stripped = lines.join(" ").replace(/\d{4}-\d{2}-\d{2}/g, "").replace(/\d{1,2}:\d{2}/g, "");
  for (const n of stripped.match(/\d+(\.\d+)?/g) || []) if (!allowed.has(n)) return null;   // reject-and-omit
  if (/10x|exponential|on steroids/i.test(stripped)) return null;
  return lines;
}

// ---------------------------------------------------------------------------
// render (pure) — cold steel, warm core
// ---------------------------------------------------------------------------
const C = { bg: "#0c0e13", panel: "#12151d", amber: "#e8915a", body: "#e9e7e2", gold: "#c9a06a", dim: "#5a6070", green: "#7fb069", red: "#c05a5a", yellow: "#d9b45a" };

function panel(title, inner) {
  return `<section style="background:${C.panel};border:1px solid #1c2030;border-radius:10px;padding:16px 18px;margin:10px;flex:1;min-width:280px">
  <h2 style="font-size:11px;letter-spacing:2px;color:${C.gold};margin:0 0 10px;text-transform:uppercase">${esc(title)}</h2>${inner}</section>`;
}
const awaiting = (what) => `<div style="color:${C.dim};font-size:13px;padding:8px 0">awaiting blood — ${esc(what)} flows in with your first reps</div>`;
const fluColor = (f) => String(f).includes("🟢") ? C.green : String(f).includes("🟡") ? C.yellow : C.red;

function renderMaidan(d) {
  if (!d.maidan || !Array.isArray(d.maidan.stages) || !d.maidan.stages.length) return panel("The Maidan — your field", awaiting("the fluency map"));
  const stages = d.maidan.stages;
  const W = 640, H = 180, gap = W / (stages.length + 1);
  let svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;background:#0e1410;border-radius:8px">
    <rect x="4" y="4" width="${W - 8}" height="${H - 8}" fill="none" stroke="#1e3325" stroke-width="2" rx="6"/>
    <line x1="${W / 2}" y1="4" x2="${W / 2}" y2="${H - 4}" stroke="#1e3325"/>
    <circle cx="${W / 2}" cy="${H / 2}" r="26" fill="none" stroke="#1e3325"/>`;
  stages.forEach((s, i) => {
    const x = gap * (i + 1), y = H / 2 + (i % 2 ? -34 : 34);
    const col = s.status === "runnable" ? C.green : s.status === "building" ? C.yellow : C.dim;
    svg += `<circle cx="${x}" cy="${y}" r="14" fill="${col}" opacity="0.85"/>
      <text x="${x}" y="${y + 30}" text-anchor="middle" font-size="10" fill="${C.body}">${esc(s.label || s.id)}</text>`;
    if (i > 0) {
      const px = gap * i, py = H / 2 + ((i - 1) % 2 ? -34 : 34);
      const frayed = d.weak_connection && d.weak_connection.includes(String(s.id));
      svg += `<line x1="${px}" y1="${py}" x2="${x}" y2="${y}" stroke="${frayed ? C.red : "#2c4434"}" stroke-width="2" ${frayed ? 'stroke-dasharray="4 4"' : ""}/>`;
    }
  });
  svg += "</svg>";
  const weak = d.weak_connection ? `<div style="color:${C.red};font-size:12px;margin-top:8px">frayed pass: ${esc(d.weak_connection)}</div>` : "";
  return panel("The Maidan — your field", svg + weak);
}

function renderSeason(d) {
  const s = d.season;
  const cons = s.weekly_consistency_pct === null ? "—" : s.weekly_consistency_pct + "%";
  return panel("Season", `
    <div style="display:flex;gap:24px;align-items:baseline">
      <div><span style="font-size:34px;color:${C.amber};font-weight:700">${safe(s.matches_played, 0)}</span>
        <div style="font-size:11px;color:${C.dim}">matches played</div></div>
      <div><span style="font-size:34px;color:${C.amber};font-weight:700">${d.doubts_retired}</span>
        <div style="font-size:11px;color:${C.dim}">doubts retired · ${d.tape_queue} rematches waiting</div></div>
      <div><span style="font-size:22px;color:${C.body}">${esc(cons)}</span>
        <div style="font-size:11px;color:${C.dim}">weekly consistency</div></div>
      <div><span style="font-size:22px">${s.trophy_state === "lit" ? "🏆" : "🔒"}</span>
        <div style="font-size:11px;color:${C.dim}">the cabinet ${esc(s.trophy_state)}</div></div>
    </div>`);
}

function renderCalibration(d) {
  if (!d.calibration) return panel("Calibration — the book on your knowing", awaiting("calibration"));
  const c = d.calibration;
  const bucket = (name, b, target) => {
    const acc = b && b.accuracy !== null && b.n ? Math.round(b.accuracy * 100) : null;
    return `<div style="margin:4px 0;font-size:12px;color:${C.body}">${name}: ${acc === null ? "—" : acc + "%"} <span style="color:${C.dim}">(target ${Math.round(target * 100)}%, n=${b ? b.n : 0})</span></div>`;
  };
  return panel("Calibration — the book on your knowing",
    `<div style="font-size:26px;color:${C.amber};font-weight:700">${safe(c.gap)}</div>
     <div style="font-size:11px;color:${C.dim};margin-bottom:8px">${esc(safe(c.trend, ""))}</div>` +
    bucket("knew", c.buckets && c.buckets.knew, 0.95) + bucket("shaky", c.buckets && c.buckets.shaky, 0.65) + bucket("guessed", c.buckets && c.buckets.guessed, 0.30) +
    (c.danger && c.danger.length ? `<div style="color:${C.red};font-size:12px;margin-top:8px">danger: ${esc(c.danger.join(", "))}</div>` : ""));
}

function renderDerby(d) {
  if (!d.derby.length) return panel("Derby table — confusions", awaiting("confusion pairs"));
  return panel("Derby table — confusions", d.derby.map(p =>
    `<div style="font-size:13px;color:${C.body};margin:4px 0">${esc(p.from)} <span style="color:${C.amber}">vs</span> ${esc(p.to)} <span style="color:${C.dim}">×${p.count}</span></div>`).join(""));
}

function renderBody(d) {
  const col = d.verdict === "GREEN" ? C.green : d.verdict === "AMBER" ? C.yellow : C.red;
  const bleeds = d.bleeds.length ? `<div style="color:${C.yellow};font-size:12px;margin-top:6px">physio: ${esc(d.bleeds.join(", "))}</div>` : "";
  return panel("The body", `<div style="display:flex;align-items:center;gap:10px">
    <div style="width:16px;height:16px;border-radius:50%;background:${col}"></div>
    <div style="font-size:18px;color:${C.body}">${esc(d.verdict)}</div>
    <div style="font-size:11px;color:${C.dim}">verdict only — the numbers stay with the Goalkeeper</div></div>${bleeds}`);
}

function renderBrain(d) {
  return panel("The brain — got sharper while you slept",
    `<div style="font-size:13px;color:${C.body}">${d.brain.calls_today} call(s) today · ${d.brain.overnight_calls} overnight</div>
     <div style="font-size:11px;color:${C.dim};margin-top:4px">${d.brain.tokens_today.toLocaleString()} tokens metabolized</div>`);
}

function renderWallTrend(d) {
  if (d.verdict === "RED") return "";                                  // hidden entirely on RED
  return panel("The wall — weekly trend only",
    `<div style="font-size:13px;color:${C.body}">${d.wall_week_minutes} wall-minutes this week</div>
     <div style="font-size:11px;color:${C.dim};margin-top:4px">a stat you watch shrink — never a daily meter</div>`);
}

function renderDrills(d) {
  if (!d.drills_tomorrow.length) return panel("Tomorrow's set pieces", awaiting("compiled drills"));
  return panel("Tomorrow's set pieces", d.drills_tomorrow.map(x =>
    `<span style="font-size:14px;margin-right:12px">${esc(x.emoji || "")} ${esc(x.kind)}</span>`).join(""));
}

const FORGE_FRAME = {
  productive: ["the forge is working", "#7fb069"],
  spinning: ["same crack — a different door is queued", "#d9b45a"],
  cruising: ["cruising — room to interleave harder", "#7fb069"],
  no_data: ["quiet pitch", "#5a6070"],
};
function renderNow(d) {
  const [label, col] = FORGE_FRAME[d.now.struggle] || FORGE_FRAME.no_data;
  return panel("Right now", `
    <div style="display:flex;gap:26px;align-items:baseline;flex-wrap:wrap">
      <div><span style="font-size:28px;color:${C.amber};font-weight:700">${d.now.reps_today}</span>
        <div style="font-size:11px;color:${C.dim}">reps today</div></div>
      <div><span style="font-size:28px;color:${C.body};font-weight:700">${d.now.learning_min}</span>
        <div style="font-size:11px;color:${C.dim}">learning min</div></div>
      <div><span style="font-size:28px;color:${C.body};font-weight:700">${d.now.building_min}</span>
        <div style="font-size:11px;color:${C.dim}">building min</div></div>
      <div><span style="font-size:14px;color:${col}">● ${esc(label)}</span>
        <div style="font-size:11px;color:${C.dim}">odometers only — they count up, never against you</div></div>
    </div>`);
}

// MEDIA — the club's channel (media engine): today's team talks as playable
// audio, the daily poster, the film kit. Renders nothing when nothing exists.
function renderMedia(d) {
  const m = d.media || {};
  if (!m.teamtalk_am && !m.teamtalk_pm && !m.poster && !m.filmkit) return "";
  const audio = (label, src) => `<div style="margin:6px 0"><div style="font-size:11px;color:${C.dim}">${esc(label)}</div><audio controls preload="none" style="width:100%;height:32px" src="${esc(src)}"></audio></div>`;
  let inner = "";
  if (m.teamtalk_am) inner += audio("morning team talk", `media/teamtalk_${d.date}_am.mp3`);
  if (m.teamtalk_pm) inner += audio("evening team talk", `media/teamtalk_${d.date}_pm.mp3`);
  const links = [];
  if (m.poster) links.push(`<a href="poster.svg" style="color:${C.amber}">today's poster</a>`);
  if (m.filmkit) links.push(`<a href="filmkit_${d.date}.md" style="color:${C.amber}">film kit (NotebookLM source)</a>`);
  links.push(`<a href="prompts/season_film.md" style="color:${C.gold}">Veo prompt</a>`);
  inner += `<div style="font-size:12px;margin-top:6px">${links.join(" · ")}</div>`;
  return panel("Media — the club's channel", inner);
}

// THE FILM KIT — one-click season film: a NotebookLM-ready source doc in true
// numbers (his single tap on their side = Generate Video Overview). Veo API
// stays money-gated; this is the honest ceiling, automated to one click.
function buildFilmKit(d, notebook) {
  const L = [];
  L.push(`# Arsenal AI FC — Season Film Source · ${d.date}`);
  L.push("");
  L.push("Source document for a NotebookLM **Video Overview**. Upload this file (or point NotebookLM at the Drive copy), choose Video Overview, generate. That's the whole ritual.");
  L.push("");
  L.push(`## The season, in true numbers (as of ${d.date})`);
  L.push(`- Matches played: ${safe(d.season.matches_played, 0)}`);
  L.push(`- Doubts retired: ${d.doubts_retired} · rematches still waiting: ${d.tape_queue}`);
  if (d.season.weekly_consistency_pct !== null) L.push(`- Weekly consistency: ${d.season.weekly_consistency_pct}%`);
  if (d.calibration) L.push(`- Calibration gap: ${safe(d.calibration.gap)} (${d.calibration.trend || "—"})`);
  if (d.maidan && Array.isArray(d.maidan.stages)) L.push(`- Maidan stages runnable: ${d.maidan.stages.filter(s => s.status === "runnable").length} of ${d.maidan.stages.length}`);
  if (d.kal_line) L.push(`- Tomorrow's first move, in his own words: "${d.kal_line}"`);
  const moments = notebook && Array.isArray(notebook.moments) ? notebook.moments.slice(-10) : [];
  if (moments.length) {
    L.push("");
    L.push("## Real moments from the season notebook");
    for (const mo of moments) L.push(`- ${mo.date}: ${mo.line}${mo.result ? ` (${mo.result})` : ""}`);
  }
  L.push("");
  L.push("## Tone laws (constitutional — the film obeys the club)");
  L.push("Quiet, earned, no triumphalism. Honest frame: compounding, never hype. No countdowns, no deadlines. Cracks are data, not verdicts. A lone footballer training under floodlights is the recurring image. End on the crest and the words \"kal phir\".");
  return L.join("\n") + "\n";
}

// COMMITMENTS — his own kal-lines and what happened next. Won days get the
// tick; a miss reads "went again" (no-shame law); the newest waits unjudged.
function renderCommitments(d) {
  if (!d.commitments || !d.commitments.length) return "";
  const WON = new Set(["HIT", "PARTIAL", "LOAD-MANAGED"]);
  const rows = d.commitments.map(c => {
    const mark = c.next_result === null || c.next_result === undefined ? `<span style="color:${C.dim}">·</span>`
      : WON.has(String(c.next_result).toUpperCase()) ? `<span style="color:${C.green}">✓</span>`
      : `<span style="color:${C.dim}">↻ went again</span>`;
    return `<div style="font-size:12px;color:${C.body};margin:4px 0">${mark} <span style="color:${C.dim}">${esc(c.date)}</span> "${esc(c.kal)}"</div>`;
  }).join("");
  return panel("Commitments — your own words", rows);
}

function renderWall(data, insights) {
  const red = data.verdict === "RED";
  const head = `<meta http-equiv="refresh" content="300"><header style="padding:18px 22px 4px;display:flex;justify-content:space-between;align-items:baseline">
    <div style="font-size:20px;color:${C.body};font-weight:700">⚪🔴 THE CLUB WALL <span style="font-size:10px;color:${C.dim}">· living — refreshes itself</span></div>
    <div style="font-size:12px;color:${C.dim}">${esc(data.date)}</div></header>`;
  const kal = data.kal_line ? `<div style="margin:6px 22px;padding:12px 16px;background:#161a24;border-left:3px solid ${C.amber};color:${C.body};font-size:15px">${esc(data.kal_line)}</div>` : "";
  let body;
  if (red) {
    // minimal wall: KAL-line + floor only — never a loss before he chooses to look
    body = kal + panel("Today", `<div style="font-size:15px;color:${C.body}">Rotation day. One five-minute floor-touch is the whole match. The rest of the wall waits for you.</div>`);
  } else {
    const insightHtml = insights && insights.length
      ? panel("The read", insights.map(l => `<div style="font-size:13px;color:${C.body};margin:4px 0">${esc(l)}</div>`).join("")) : "";
    const voice = data.twin_voice ? panel("The book", `<div style="font-size:14px;color:${C.amber}">${esc(data.twin_voice)}</div>`) : "";
    body = kal + `<div style="display:flex;flex-wrap:wrap">` +
      renderNow(data) + renderMaidan(data) + renderSeason(data) + renderCalibration(data) + renderDerby(data) +
      renderDrills(data) + renderMedia(data) + renderCommitments(data) + renderBody(data) + renderBrain(data) + renderWallTrend(data) + `</div>` + voice + insightHtml;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><title>THE CLUB WALL</title></head>
<body style="margin:0;background:${C.bg};font-family:'Segoe UI',system-ui,sans-serif;padding-bottom:30px">${head}${body}
<footer style="padding:14px 22px;color:${C.dim};font-size:11px">the loop wastes nothing you generate, loses nothing you are · COYG</footer></body></html>`;
}

// ---------------------------------------------------------------------------
// THE GEMINI LANE — the organism writes his Gemini prompts every render, and
// folds Gemini's answer back in ONLY through a sanitizer (superpower pass).
// ---------------------------------------------------------------------------
const PROMPT_LAWS = `LAWS (constitutional, travel with every render): every number must come from the JSON below — invent nothing; no hype words (10x/exponential/on steroids); no streak counts (weekly consistency only); no raw biometrics (verdict color only); no dates-as-deadlines; cold steel warm core palette — deep charcoal #0c0e13 base, warm amber #e8915a accents, off-white #e9e7e2 text, muted gold #c9a06a secondary; football register welcome (the Maidan is a pitch, confusions are derbies, healed weaknesses are trophies); ONE glance = ONE story; output ONLY the artifact, no commentary.`;

function promptPack(data, renderNotes = null) {
  const json = JSON.stringify(data, null, 1);
  const notes = renderNotes && renderNotes.trim()
    ? `\n\nRENDER NOTES from the design coach (last night's critique — apply them):\n${renderNotes.trim().slice(0, 1500)}\n` : "";
  return {
    "wall_painter.md": `# Wall-Painter — tonight's render (auto-written by the organism)\n\nCreate ONE dense, beautiful, dark single-file HTML dashboard (inline SVG, no external anything) from this state. Sections: the Maidan as a real pitch diagram (stages = zones, fluency colors, the weak connection drawn as a frayed pass) · season strip (matches, doubts retired, weekly consistency) · calibration curve vs targets · derby table · tomorrow's set pieces · body verdict band · brain meter ("got sharper while you slept").${notes}\n\n${PROMPT_LAWS}\n\n\`\`\`json\n${json}\n\`\`\`\n`,
    "match_poster.md": `# Match Poster — this week (auto-written by the organism)\n\nCreate ONE portrait SVG poster (print-worthy, 3:4) of this week as a football match: headline = the biggest true number in the data (doubts retired, matches played, or a derby settled); sub-line = the weekly consistency; one visual motif from the Maidan. Understated, premium, cold-steel-warm-core.\n\n${PROMPT_LAWS}\n\n\`\`\`json\n${json}\n\`\`\`\n`,
    "season_film.md": `# Season Film — Veo prompt (auto-written; paste into the Gemini app's video tool)\n\nWrite me a 30-second cinematic video-generation prompt: a lone footballer training under floodlights at dawn, ONE scene per true milestone in the JSON (matches played, doubts retired, stages runnable) — rendered as scoreboard glimpses and pitch markings, never text-heavy. Tone: quiet, earned, no triumphalism. End on the crest ⚪🔴 and the words "kal phir".\n\n${PROMPT_LAWS}\n\n\`\`\`json\n${json}\n\`\`\`\n`,
    "voice_brief.md": voiceBrief(data),
  };
}

// THE VOICE BRIEF — the daily context capsule for the Voice Gaffer Gem
// (setup/VOICE_SETUP.md): he pastes this once, then TALKS to the organism —
// Gemini Live carries the conversation, this carries today's truth. Spoken
// register, ≤20 short lines, numbers only from the wall data.
function voiceBrief(d) {
  const L = [];
  L.push("# Voice Brief — paste me into the Voice Gaffer Gem, then just talk");
  L.push("");
  L.push(`Today: ${d.date}. Body verdict: ${d.verdict}.`);
  if (d.kal_line) L.push(`His KAL-line (his own words, the day starts here): "${d.kal_line}"`);
  L.push(`Season: ${d.season.matches_played} matches played · ${d.doubts_retired} doubts retired · ${d.tape_queue} rematches waiting.`);
  if (d.season.weekly_consistency_pct !== null) L.push(`Weekly consistency: ${d.season.weekly_consistency_pct}%.`);
  if (d.calibration) L.push(`Calibration gap ${d.calibration.gap} (${d.calibration.trend || "—"}).${d.calibration.danger && d.calibration.danger.length ? " Danger topic: " + d.calibration.danger[0] + "." : ""}`);
  if (d.drills_tomorrow.length) L.push(`Tomorrow's set pieces: ${d.drills_tomorrow.map(x => x.kind).join(", ")}.`);
  if (d.derby.length) L.push(`Hot derby: ${d.derby[0].from} vs ${d.derby[0].to} (×${d.derby[0].count}).`);
  if (d.twin_voice) L.push(`The book's earned line: ${d.twin_voice}`);
  if (d.bleeds.length) L.push(`Physio note: ${d.bleeds.join(", ")}.`);
  L.push("");
  L.push("Rules for this conversation: spoken register, one idea at a time, honest frame (compounding, never hype), no calendar pressure, cracks are data never verdicts, rivalry only vs kal-wala-Nikhil. If he Bolos a concept, listen fully, then probe ONE crack, warmly.");
  return L.join("\n") + "\n";
}

// safety gate for Gemini output entering the club: inline SVG/HTML only —
// no scripts of any kind, no external refs. Reject = null (deterministic wall
// is always the surface of record).
function sanitizeGemini(text) {
  if (!text || typeof text !== "string") return null;
  const t = text.trim().replace(/^```(html|svg|xml)?/i, "").replace(/```$/,"").trim();
  const looksRight = /^<!doctype html/i.test(t) || /^<html/i.test(t) || /^<svg/i.test(t);
  if (!looksRight) return null;
  // W3C namespace URIs are mandatory in inline SVG — exempt them, then hunt
  // real network refs. \b on the handler check ("content=" is not "onload=").
  const scan = t.replace(/https?:\/\/www\.w3\.org\/[^"'\s>]*/gi, "W3C_NS");
  if (/<script|javascript:|\bon\w+\s*=|https?:\/\/|@import|<iframe|<object|<embed|<link/i.test(scan)) return null;
  return t;
}

// ---------------------------------------------------------------------------
// selftest — fixtures only
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const now = new Date(2026, 6, 12, 22, 0, 0);

  // bloodless world
  const empty = assembleWallData({ history: [] }, now);
  const emptyHtml = renderWall(empty, null);
  assert("bloodless wall renders honest awaiting-blood panels", emptyHtml.includes("awaiting blood"));
  assert("NEVER-FAKE — no NaN/undefined/null leaks", !/NaN|undefined|null</.test(emptyHtml));
  assert("NO-STREAK LAW — the word streak never renders", !/streak/i.test(emptyHtml));

  // full world
  const bus = {
    learning_state: {
      maidan: { stages: [{ id: "fundamentals", label: "fundamentals", status: "runnable" }, { id: "rag_pipeline", label: "rag pipeline", status: "building" }, { id: "agents", label: "agents", status: "awaiting_data" }] },
      weak_connection: "tokenization → embeddings (edge cold)",
      confusion_pairs: [{ from: "tokenization", to: "embeddings", count: 4 }],
    },
    season: { matches_played: 12, trophy_state: "unlit" },
    calibration: { status: "ok", calibration_gap: 0.14, trend: "narrowing (0.19 → 0.14)", buckets: { knew: { n: 30, accuracy: 0.9 }, shaky: { n: 12, accuracy: 0.6 }, guessed: { n: 5, accuracy: 0.4 } }, danger_zone: [{ topic: "context" }] },
    tape_room: { doubts_retired: 24, queue: Array(88).fill({}) },
    history: [{ wall_minutes: 24, struggle: "productive" }, { wall_minutes: 10, struggle: "productive" }],
    readiness: { verdict: "GREEN", hrv: 22.7, rhr: 76.4 },
    brainLedger: [{ ts: "2026-07-12T02:10:00", total_tokens: 52000 }, { ts: "2026-07-12T13:30:00", total_tokens: 8000 }],
    vitals: { bleeds: [{ kind: "effort_uncaptured" }] },
    drills: { drills: [{ kind: "tape_room", probe_type_emoji: "🟣" }] },
    twin: { voice: null },
    kal_line: "pehla move: context Re-Jirah",
  };
  const data = assembleWallData(bus, now);
  const html = renderWall(data, null);
  assert("Maidan pitch SVG renders with frayed pass", html.includes("<svg") && html.includes("frayed pass"));
  assert("doubts_retired + matches_played render big", html.includes(">24<") && html.includes(">12<"));
  assert("NO RAW BIOMETRICS — hrv/rhr numbers never render", !html.includes("22.7") && !html.includes("76.4"));
  assert("body strip carries verdict only", html.includes("GREEN") && html.includes("verdict only"));
  assert("brain meter shows overnight sharpening", html.includes("overnight") && html.includes("60,000"));
  assert("KAL-line front and center", html.includes("pehla move: context Re-Jirah"));
  assert("wall trend weekly-only wording", html.includes("wall-minutes this week") && html.includes("never a daily meter"));

  // NOW strip (captain's call) + living refresh
  const nowData = assembleWallData({ ...bus, pitch_read: { date: "2026-07-12", struggle: { verdict: "productive" } }, timeaudit: { buckets: { Learning: { minutes: 95 }, Building: { minutes: 40 } } }, repsToday: 7 }, now);
  const nowHtml = renderWall(nowData, null);
  assert("NOW strip renders odometers + forge-framed verdict", nowHtml.includes("reps today") && nowHtml.includes(">7<") && nowHtml.includes("the forge is working"));
  assert("NOW strip has no quota/target bars (odometers only)", !/target|quota|%\s*of/i.test(nowHtml.split("Right now")[1].split("</section>")[0]));
  assert("wall is LIVING — meta refresh present", nowHtml.includes('http-equiv="refresh"'));

  // RED-day minimal wall
  const redData = assembleWallData({ ...bus, readiness: { verdict: "RED" } }, now);
  const redHtml = renderWall(redData, null);
  assert("RED wall = KAL-line + floor only", redHtml.includes("Rotation day") && !redHtml.includes("Calibration"));
  assert("RED wall hides the wall trend entirely", !redHtml.includes("wall-minutes"));
  assert("RED wall hides the NOW strip too (never a loss before he looks)", !redHtml.includes("Right now"));

  // insights validation
  assert("insight with real numbers passes", validateInsights("24 doubts retired and the gap sits at 0.14 — the book is honest.", data) !== null);
  assert("insight with INVENTED number rejected (omitted)", validateInsights("Your recall jumped 97% this week.", data) === null);
  assert("hype in insights rejected", validateInsights("You are on a 10x trajectory.", data) === null);
  assert("insights capped at 3 lines", (validateInsights("a\nb\nc\nd", data) || []).length <= 3);

  // GEMINI LANE
  const pack = promptPack(data);
  assert("prompt pack: four prompts auto-written", Object.keys(pack).length === 4 && pack["wall_painter.md"].includes("frayed pass"));
  assert("voice brief speaks his day (KAL + counters + spoken rules)", pack["voice_brief.md"].includes("pehla move: context Re-Jirah") && pack["voice_brief.md"].includes("24 doubts retired") && pack["voice_brief.md"].includes("spoken register"));
  assert("voice brief carries no hype/streak/countdown", !/10x|exponential|streak|days left/i.test(pack["voice_brief.md"]));
  const packNoted = promptPack(data, "1. The derby table drowned the Maidan — shrink it.\n2. More whitespace at the top.");
  assert("CLAUDE↔GEMINI LOOP — render notes feed the next night's prompt", packNoted["wall_painter.md"].includes("RENDER NOTES") && packNoted["wall_painter.md"].includes("derby table drowned"));
  assert("no notes → clean prompt (no empty section)", !pack["wall_painter.md"].includes("RENDER NOTES"));
  assert("prompt pack embeds the real numbers", pack["match_poster.md"].includes('"doubts_retired": 24'));
  assert("visual prompts carry the render laws", ["wall_painter.md", "match_poster.md", "season_film.md"].every(k => pack[k].includes("invent nothing") && pack[k].includes("#0c0e13")));
  assert("sanitizer accepts clean inline SVG", sanitizeGemini("<svg viewBox='0 0 10 10'><rect/></svg>") !== null);
  assert("sanitizer allows the W3C svg namespace (not a network ref)", sanitizeGemini('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>') !== null);
  assert("sanitizer allows content= (no false handler match)", sanitizeGemini('<html><meta name="viewport" content="width=device-width"><body>x</body></html>') !== null);
  assert("sanitizer strips code fences", sanitizeGemini("```html\n<html><body>ok</body></html>\n```") !== null);
  assert("sanitizer rejects scripts", sanitizeGemini("<html><script>alert(1)</script></html>") === null);
  assert("sanitizer rejects external refs", sanitizeGemini("<svg><image href='https://x.test/a.png'/></svg>") === null);
  assert("sanitizer rejects event handlers", sanitizeGemini("<svg onload=alert(1)></svg>") === null);
  assert("sanitizer rejects non-artifacts", sanitizeGemini("Here is your dashboard, captain!") === null);

  // MEDIA ENGINE — the club's channel
  const mediaData = assembleWallData({ ...bus, media: { teamtalk_am: true, teamtalk_pm: false, poster: true, filmkit: true } }, now);
  const mediaHtml = renderWall(mediaData, null);
  assert("MEDIA panel: team talk playable + poster + film kit links", mediaHtml.includes("<audio") && mediaHtml.includes("teamtalk_2026-07-12_am.mp3") && mediaHtml.includes("poster.svg") && mediaHtml.includes("filmkit_2026-07-12.md"));
  assert("MEDIA panel absent when nothing exists (no empty shell)", !renderWall(assembleWallData(bus, now), null).includes("the club's channel"));
  assert("MEDIA panel hidden on RED (minimal wall law wins)", !renderWall(assembleWallData({ ...bus, readiness: { verdict: "RED" }, media: { teamtalk_am: true } }, now), null).includes("<audio"));
  const kit = buildFilmKit(mediaData, { moments: [{ date: "2026-07-10", line: "the Tuesday you thought you'd break and didn't", result: "HIT" }] });
  assert("film kit: NotebookLM source doc in true numbers", kit.includes("Video Overview") && kit.includes("Doubts retired: 24") && kit.includes("Matches played: 12"));
  assert("film kit folds real notebook moments", kit.includes("the Tuesday you thought"));
  assert("film kit carries the tone laws, zero hype", kit.includes("kal phir") && !/10x|exponential|on steroids|countdown to/i.test(kit));

  // COMMITMENTS VIEW (U4) — kal-lines, kept; no shame ever
  const cData = assembleWallData({ ...bus, commitments: [
    { date: "2026-07-09", kal: "pehla move: parser test", next_result: "HIT" },
    { date: "2026-07-10", kal: "context Re-Jirah first", next_result: "MISS" },
    { date: "2026-07-11", kal: "one green ball at 09:00", next_result: null },
  ] }, now);
  const cHtml = renderWall(cData, null);
  assert("commitments panel: his words + won-day tick", cHtml.includes("Commitments") && cHtml.includes("parser test") && cHtml.includes("✓"));
  assert("NO-SHAME — a missed kal-line reads 'went again', never failure", cHtml.includes("went again") && !/fail|broke your|streak/i.test(cHtml.split("Commitments")[1].split("</section>")[0]));
  assert("newest commitment waits unjudged", cHtml.split("Commitments")[1].split("</section>")[0].includes("·"));
  assert("no commitments → no panel", !renderWall(assembleWallData(bus, now), null).includes("Commitments"));

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "run").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  const now = new Date();
  const today = localDate(now);
  // KAL-line from yesterday's post-match (the sheet's first-touch law, on the wall too)
  let kal = null;
  for (let i = 0; i <= 1; i++) {
    const d = localDate(new Date(now.getTime() - i * 86400000));
    const p = join(STATE_DIR, "post_match", d + ".md");
    if (existsSync(p)) { const m = readFileSync(p, "utf8").match(/KAL-?LINE\s*→\s*(.+)/i); if (m) { kal = m[1].trim(); break; } }
  }
  const bus = {
    learning_state: readJson(join(STATE_DIR, "learning_state.json")),
    season: readJson(join(STATE_DIR, "season.json")),
    calibration: readJson(join(STATE_DIR, "calibration.json")),
    tape_room: readJson(join(STATE_DIR, "tape_room.json")),
    history: readLines(join(STATE_DIR, "pitch_read_history.jsonl")),
    readiness: readJson(join(STATE_DIR, "readiness.json")),
    brainLedger: readLines(join(STATE_DIR, "brain_ledger.jsonl")),
    vitals: readJson(join(STATE_DIR, "loop_vitals.json")),
    drills: readJson(join(STATE_DIR, "drills.json")),
    twin: readJson(join(STATE_DIR, "twin.json")),
    kal_line: kal,
    pitch_read: readJson(join(STATE_DIR, "pitch_read.json")),
    timeaudit: readJson(join(STATE_DIR, "timeaudit.json")),
    repsToday: readLines(join(STATE_DIR, "reps_log.jsonl")).filter(r => String(r.ts || "").slice(0, 10) === today).length,
  };
  // COMMITMENTS (U4): last week of kal-lines + what the next day said
  const commitments = [];
  for (let i = 7; i >= 0; i--) {
    const d = localDate(new Date(now.getTime() - i * 86400000));
    const p = join(STATE_DIR, "post_match", d + ".md");
    if (!existsSync(p)) continue;
    const txt = readFileSync(p, "utf8");
    const km = txt.match(/KAL-?LINE\s*→\s*(.+)/i);
    if (!km) continue;
    const np = join(STATE_DIR, "post_match", localDate(new Date(now.getTime() - (i - 1) * 86400000)) + ".md");
    let next_result = null;
    if (i > 0 && existsSync(np)) { const rm = readFileSync(np, "utf8").match(/RESULT:\s*(LOAD-MANAGED|HIT|MISS|PARTIAL)/i); if (rm) next_result = rm[1].toUpperCase(); }
    commitments.push({ date: d, kal: km[1].trim(), next_result });
  }
  bus.commitments = commitments;
  // MEDIA ENGINE: poster fold (through the sanitizer, always) + film kit + presence flags
  let posterOk = false;
  const posterPath = join(STATE_DIR, "brain_out", "poster", today + ".md");
  if (existsSync(posterPath)) {
    const cleanPoster = sanitizeGemini(readFileSync(posterPath, "utf8"));
    if (cleanPoster && /^<svg/i.test(cleanPoster)) { writeAtomic(join(CLUB_DIR, "poster.svg"), cleanPoster); posterOk = true; }
  }
  bus.media = {
    teamtalk_am: existsSync(join(CLUB_DIR, "media", `teamtalk_${today}_am.mp3`)),
    teamtalk_pm: existsSync(join(CLUB_DIR, "media", `teamtalk_${today}_pm.mp3`)),
    poster: posterOk || existsSync(join(CLUB_DIR, "poster.svg")),
    filmkit: true,   // written below, every render
  };
  const data = assembleWallData(bus, now);
  // film kit: club copy + Drive copy (one-click NotebookLM lane; G: optional)
  const kit = buildFilmKit(data, readJson(join(STATE_DIR, "notebook.json")));
  writeAtomic(join(CLUB_DIR, `filmkit_${today}.md`), kit);
  try {
    const gdir = "G:\\My Drive\\arsenal";
    if (existsSync(gdir)) writeFileSync(join(gdir, `filmkit_${today}.md`), kit);
  } catch { }
  const insightPath = join(STATE_DIR, "brain_out", "wall_insights", today + ".md");
  const insights = existsSync(insightPath) ? validateInsights(readFileSync(insightPath, "utf8"), data) : null;
  writeAtomic(WALL_DATA, data);
  writeAtomic(WALL_HTML, renderWall(data, insights));
  // the Gemini lane: write tonight's ready-made prompts (with last night's
  // design-coach critique folded in — the Claude↔Gemini loop) + fold in renders
  let renderNotes = null;
  for (let i = 0; i <= 2; i++) {
    const d = localDate(new Date(now.getTime() - i * 86400000));
    const p = join(STATE_DIR, "brain_out", "wall_review", d + ".md");
    if (existsSync(p)) { renderNotes = readFileSync(p, "utf8"); break; }
  }
  const pack = promptPack(data, renderNotes);
  for (const [name, text] of Object.entries(pack)) writeAtomic(join(CLUB_DIR, "prompts", name), text);
  let geminiNote = "";
  const gPath = join(STATE_DIR, "brain_out", "gemini_wall", today + ".md");
  if (existsSync(gPath)) {
    const clean = sanitizeGemini(readFileSync(gPath, "utf8"));
    if (clean) { writeAtomic(join(CLUB_DIR, "wall_gemini.html"), clean); geminiNote = " + gemini render folded in"; }
    else geminiNote = " (gemini render REJECTED by sanitizer — deterministic wall stands)";
  }
  console.log(`viz: wall rendered (${data.verdict}${insights ? ", " + insights.length + " insights" : ""})${geminiNote} · 3 Gemini prompts refreshed → ${WALL_HTML}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { assembleWallData, renderWall, validateInsights, allowedNumbers, promptPack, sanitizeGemini, renderMedia, buildFilmKit };
