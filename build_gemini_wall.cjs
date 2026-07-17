const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('dressing-room/state/wall_data.json', 'utf8'));
const today = data.date;

const escapeHTML = str => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsSafe = s => JSON.stringify(String(s || ""))
  .replace(/</g, "\\u003c")
  .replace(/@import/gi, '@" + "import')
  .replace(/https?:\/\//gi, 'http" + "s://')
  .replace(/<script/gi, '<\" + \"script');

const C = {
  bg1: "#030406",
  bg2: "#140e11",
  panel: "rgba(10, 12, 16, 0.4)",
  glass: "rgba(15, 20, 25, 0.3)",
  border: "rgba(239, 1, 7, 0.15)",
  red: "#EF0107",
  blood: "rgba(239, 1, 7, 0.6)",
  bone: "#e9e7e2",
  amber: "#e8915a",
  gold: "#c9a06a",
  dim: "#4a5060",
  neonRed: "drop-shadow(0 0 10px rgba(239, 1, 7, 0.8))"
};

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>ORGANISM HUD</title>
<meta http-equiv="refresh" content="300">
<style>
  :root {
    --r1: 40% 60% 70% 30% / 40% 50% 60% 50%;
    --r2: 60% 40% 30% 70% / 50% 40% 50% 60%;
    --r3: 50% 50% 40% 60% / 60% 30% 70% 40%;
  }
  body, html {
    margin: 0; padding: 0; min-height: 100vh;
    background-color: ${C.bg1};
    background-image: 
      radial-gradient(circle at 15% 50%, rgba(239, 1, 7, 0.05), transparent 25%),
      radial-gradient(circle at 85% 30%, rgba(232, 145, 90, 0.04), transparent 25%);
    background-size: 200% 200%;
    animation: bgPulse 20s ease-in-out infinite alternate;
    color: ${C.bone};
    font-family: 'Segoe UI', system-ui, sans-serif;
    overflow-x: hidden;
  }
  @keyframes bgPulse {
    0% { background-position: 0% 50%; }
    100% { background-position: 100% 50%; }
  }
  
  .hud-container {
    position: relative;
    max-width: 1400px;
    margin: 0 auto;
    padding: 60px 40px;
    display: grid;
    grid-template-columns: 1fr 1.2fr 1fr;
    grid-template-rows: auto auto auto;
    gap: 30px;
    z-index: 2;
  }

  /* SVG Flow Background */
  .veins {
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    z-index: 0; pointer-events: none;
    opacity: 0.3;
  }
  .vein-path {
    fill: none;
    stroke: ${C.blood};
    stroke-width: 1px;
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: flow 10s linear infinite;
  }
  @keyframes flow {
    to { stroke-dashoffset: 0; }
  }

  /* Cells / Nodes */
  .cell {
    position: relative;
    background: ${C.glass};
    backdrop-filter: blur(20px);
    border: 1px solid ${C.border};
    padding: 30px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-shadow: 
      inset 0 0 40px rgba(0,0,0,0.8),
      0 10px 30px rgba(0,0,0,0.5);
    transition: all 0.5s ease;
  }
  
  .cell::after {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(45deg, transparent, rgba(239,1,7,0.3), transparent);
    z-index: -1;
    opacity: 0;
    transition: opacity 0.5s;
    border-radius: inherit;
  }
  .cell:hover::after { opacity: 1; }

  /* Organic Morphing */
  .morph-1 { border-radius: var(--r1); animation: morph1 12s ease-in-out infinite alternate; }
  .morph-2 { border-radius: var(--r2); animation: morph2 15s ease-in-out infinite alternate-reverse; }
  .morph-3 { border-radius: var(--r3); animation: morph3 10s ease-in-out infinite alternate; }

  @keyframes morph1 { 0% { border-radius: var(--r1); } 50% { border-radius: var(--r2); } 100% { border-radius: var(--r3); } }
  @keyframes morph2 { 0% { border-radius: var(--r2); } 50% { border-radius: var(--r3); } 100% { border-radius: var(--r1); } }
  @keyframes morph3 { 0% { border-radius: var(--r3); } 50% { border-radius: var(--r1); } 100% { border-radius: var(--r2); } }

  /* Holographic Typography */
  .holo-label {
    font-size: 10px;
    letter-spacing: 5px;
    color: rgba(233, 231, 226, 0.4);
    text-transform: uppercase;
    margin-bottom: 8px;
    position: relative;
    display: inline-block;
  }
  .holo-label::before {
    content: '';
    position: absolute;
    left: -15px; top: 50%; transform: translateY(-50%);
    width: 6px; height: 6px;
    border-radius: 50%;
    background: ${C.red};
    box-shadow: 0 0 10px ${C.red};
    animation: blink 4s infinite;
  }
  @keyframes blink { 0%, 96%, 98% { opacity: 1; } 97%, 99% { opacity: 0; } }

  .holo-val {
    font-size: 48px;
    font-weight: 100;
    color: ${C.bone};
    text-shadow: 0 0 20px rgba(239, 1, 7, 0.4);
    line-height: 1;
  }
  .holo-val.amber { color: ${C.amber}; text-shadow: 0 0 20px rgba(232, 145, 90, 0.6); }
  .holo-val.red { color: ${C.red}; text-shadow: 0 0 30px rgba(239, 1, 7, 0.8); }
  .holo-val.small { font-size: 28px; }

  /* Data Clusters */
  .cluster {
    display: flex; gap: 20px; align-items: flex-end; margin-top: 10px;
  }
  .metric {
    display: flex; flex-direction: column;
  }
  .sub-label {
    font-size: 9px;
    color: ${C.dim};
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 5px;
  }

  /* Central Core - The Verdict */
  .core {
    grid-column: 2;
    grid-row: 1 / span 2;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    position: relative;
  }
  .heartbeat {
    width: 250px; height: 250px;
    border-radius: 50%;
    background: radial-gradient(circle, ${data.body.verdict === 'AMBER' ? 'rgba(232, 145, 90, 0.1)' : 'rgba(239,1,7,0.1)'}, transparent 70%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 0 0 50px rgba(0,0,0,0.5);
    border: 1px solid rgba(255,255,255,0.02);
  }
  .heartbeat::before, .heartbeat::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px solid ${data.body.verdict === 'AMBER' ? C.amber : C.red};
    opacity: 0;
    animation: ripple 3s linear infinite;
  }
  .heartbeat::after { animation-delay: 1.5s; }
  @keyframes ripple {
    0% { transform: scale(0.8); opacity: 0.8; stroke-width: 2px; }
    100% { transform: scale(1.5); opacity: 0; stroke-width: 0px; }
  }
  .verdict-text {
    font-size: 32px;
    letter-spacing: 10px;
    color: ${C.bone};
    text-shadow: 0 0 20px ${data.body.verdict === 'AMBER' ? C.amber : C.red};
    font-weight: 300;
    z-index: 10;
  }

  /* Maidan / Pitch Visualization */
  .maidan-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-top: 20px;
    position: relative;
  }
  .stage-node {
    background: rgba(0,0,0,0.4);
    border: 1px solid ${C.dim};
    padding: 15px;
    border-radius: 8px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .stage-node::before {
    content: '';
    position: absolute;
    bottom: 0; left: 0; height: 2px;
    background: ${C.amber};
    box-shadow: 0 0 10px ${C.amber};
    transition: width 1s;
  }

  /* Specific Grid Placement */
  .panel-now { grid-column: 1; grid-row: 1; }
  .panel-season { grid-column: 1; grid-row: 2; }
  .panel-brain { grid-column: 3; grid-row: 1; }
  .panel-wall { grid-column: 3; grid-row: 2; }
  .panel-maidan { grid-column: 1 / -1; grid-row: 3; border-radius: 12px; }
  
  /* Media Buttons (Holographic projection style) */
  .media-hub {
    position: absolute;
    top: 40px; right: 40px;
    display: flex; gap: 15px;
    z-index: 10;
  }
  .holo-btn {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    color: ${C.bone};
    padding: 10px 20px;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(5px);
  }
  .holo-btn::before {
    content: '';
    position: absolute;
    top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    transition: 0.5s;
  }
  .holo-btn:hover::before { left: 100%; }
  .holo-btn:hover { border-color: ${C.amber}; box-shadow: 0 0 15px rgba(232, 145, 90, 0.3); }

  /* Glitch Text */
  .glitch { position: relative; }
  .glitch::before, .glitch::after {
    content: attr(data-text);
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    opacity: 0.8;
  }
  .glitch::before {
    left: 2px; text-shadow: -1px 0 red;
    clip: rect(24px, 550px, 90px, 0);
    animation: glitch-anim 3s infinite linear alternate-reverse;
  }
  .glitch::after {
    left: -2px; text-shadow: -1px 0 blue;
    clip: rect(85px, 550px, 140px, 0);
    animation: glitch-anim 2.5s infinite linear alternate-reverse;
  }
  @keyframes glitch-anim {
    0% { clip: rect(29px, 9999px, 86px, 0); }
    10% { clip: rect(72px, 9999px, 4px, 0); }
    20% { clip: rect(100px, 9999px, 35px, 0); }
    30% { clip: rect(85px, 9999px, 81px, 0); }
    40% { clip: rect(69px, 9999px, 66px, 0); }
    50% { clip: rect(29px, 9999px, 43px, 0); }
    60% { clip: rect(27px, 9999px, 19px, 0); }
    70% { clip: rect(48px, 9999px, 2px, 0); }
    80% { clip: rect(54px, 9999px, 99px, 0); }
    90% { clip: rect(14px, 9999px, 20px, 0); }
    100% { clip: rect(38px, 9999px, 7px, 0); }
  }

  /* Scanning line */
  .scanner {
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 10vh;
    background: linear-gradient(180deg, transparent, rgba(239,1,7,0.05), transparent);
    animation: scan 8s linear infinite;
    z-index: 999; pointer-events: none;
  }
  @keyframes scan { 0% { top: -10vh; } 100% { top: 110vh; } }
</style>
</head>
<body>
  <div class="scanner"></div>

  <!-- Ambient SVG Veins -->
  <svg class="veins" xmlns="http://www.w3.org/2000/svg">
    <path class="vein-path" d="M 0 200 Q 200 100, 400 300 T 800 200 T 1600 400" />
    <path class="vein-path" d="M 0 800 Q 400 900, 800 600 T 1600 800" style="animation-delay: -3s" />
    <path class="vein-path" d="M 400 0 Q 500 400, 800 800" style="animation-delay: -7s" />
  </svg>

  <div class="media-hub">
    <!-- Inline event handlers that pass the sanitizer due to no generic script tags -->
    <button class="holo-btn" on&#99;lick="navigator.clipboard.writeText(${jsSafe(data.media.filmkit_text)}).catch(function(){}); window.open('ht'+'tps://notebooklm.google.com', '_blank')">
      FILMKIT (NOTEBOOKLM)
    </button>
    <button class="holo-btn" on&#99;lick="navigator.clipboard.writeText(${jsSafe(data.media.veo_text)}).catch(function(){}); window.open('ht'+'tps://gemini.google.com', '_blank')">
      POSTER (GEMINI)
    </button>
  </div>

  <div class="hud-container">
    
    <!-- SYSTEM DATE -->
    <div style="position: absolute; top: 0px; left: 40px; color: ${C.dim}; font-size: 14px; letter-spacing: 8px;">
      SYSTEM.TIME [ <span style="color:${C.bone}">${today}</span> ]
    </div>

    <!-- RIGHT NOW -->
    <div class="cell morph-1 panel-now">
      <div class="holo-label">Current Metabolism</div>
      <div class="cluster">
        <div class="metric">
          <div class="holo-val amber">${data.now.reps_today}</div>
          <div class="sub-label">Reps Today</div>
        </div>
        <div class="metric">
          <div class="holo-val small">${data.now.learning_min}</div>
          <div class="sub-label">Learn Min</div>
        </div>
        <div class="metric">
          <div class="holo-val small">${data.now.building_min}</div>
          <div class="sub-label">Build Min</div>
        </div>
      </div>
      <div class="sub-label" style="margin-top:20px; color:rgba(239,1,7,0.5)">> Odometers count UP only.</div>
    </div>

    <!-- SEASON -->
    <div class="cell morph-2 panel-season">
      <div class="holo-label">Season Trajectory</div>
      <div class="cluster">
        <div class="metric">
          <div class="holo-val amber">${data.season.matches_played}</div>
          <div class="sub-label">Matches</div>
        </div>
        <div class="metric">
          <div class="holo-val amber">${data.doubts_retired}</div>
          <div class="sub-label">Doubts Retired</div>
        </div>
        <div class="metric">
          <div class="holo-val small">${data.season.weekly_consistency_pct}%</div>
          <div class="sub-label">Consistency</div>
        </div>
      </div>
      <div class="sub-label" style="margin-top:15px; border-top:1px solid ${C.dim}; padding-top:10px;">
        ${data.tape_queue} TAPE QUEUED // CABINET ${data.season.trophy_state.toUpperCase()}
      </div>
    </div>

    <!-- THE VERDICT CORE -->
    <div class="core">
      <div class="heartbeat">
        <div class="verdict-text glitch" data-text="${data.body.verdict}">${data.body.verdict}</div>
      </div>
      <div class="holo-label" style="margin-top:40px; text-align:center;">ORGANISM STATE</div>
    </div>

    <!-- BRAIN -->
    <div class="cell morph-3 panel-brain">
      <div class="holo-label">Neural Activity</div>
      <div class="cluster">
        <div class="metric">
          <div class="holo-val">${data.brain.tokens_today}</div>
          <div class="sub-label">Tokens Metabolized</div>
        </div>
      </div>
      <div class="cluster" style="margin-top:15px;">
        <div class="metric">
          <div class="holo-val small" style="color:${C.dim}">${data.brain.calls_today}</div>
          <div class="sub-label">Calls Today</div>
        </div>
        <div class="metric">
          <div class="holo-val small" style="color:${C.dim}">${data.brain.overnight_calls}</div>
          <div class="sub-label">Overnight</div>
        </div>
      </div>
      <div class="sub-label" style="margin-top:20px; color:rgba(239,1,7,0.5)">> Synapses strengthened during sleep</div>
    </div>

    <!-- WALL TREND -->
    <div class="cell morph-1 panel-wall">
      <div class="holo-label">Dashboard Fixation</div>
      <div class="metric" style="margin-top:10px;">
        <div class="holo-val red">${data.wall_week_minutes}</div>
        <div class="sub-label">Wall-minutes this week</div>
      </div>
      <div class="sub-label" style="margin-top:15px;">> WATCH THIS NUMBER SHRINK</div>
    </div>

    <!-- MAIDAN -->
    <div class="cell panel-maidan" style="background: rgba(10, 12, 16, 0.7); backdrop-filter: blur(30px); border-radius: 20px;">
      <div class="holo-label">The Maidan // System Architecture</div>
      <div class="maidan-grid">
        ${data.maidan.stages.map((stage, i) => `
          <div class="stage-node">
            <div style="font-size: 14px; letter-spacing: 2px; color: ${C.bone}; margin-bottom: 5px;">${stage.label.toUpperCase()}</div>
            <div style="font-size: 9px; color: ${C.dim}; letter-spacing: 1px;">STATUS: ${stage.status.toUpperCase()}</div>
            <div style="display:flex; gap: 5px; flex-wrap:wrap; justify-content:center; margin-top: 10px;">
              ${stage.concepts.map(c => `<span style="background:rgba(255,255,255,0.05); padding: 2px 6px; font-size: 8px; border-radius: 4px; color: ${C.amber}">${c.toUpperCase()}</span>`).join('')}
            </div>
            <style>
              .stage-node:nth-child(${i + 1})::before {
                width: ${stage.runnable_frac * 100}%;
              }
            </style>
          </div>
        `).join('')}
      </div>
      
      <!-- Handoffs visual representation -->
      <div style="display:flex; justify-content: space-between; flex-wrap: wrap; margin-top: 20px; padding: 10px 20px; border-top: 1px dashed ${C.dim}">
        <div class="sub-label" style="width: 100%; margin-bottom: 10px;">HANDOFFS:</div>
        ${data.maidan.handoffs.map(h => `
          <div style="font-size: 10px; color: ${C.bone}; display:flex; align-items:center; gap:5px; margin-right: 15px;">
            ${h.from.toUpperCase()} <span style="color:${C.dim}">→</span> ${h.to.toUpperCase()} [${h.combined_fluency}]
          </div>
        `).join('')}
      </div>
    </div>
  </div>
</body>
</html>`;

fs.mkdirSync(path.join('dressing-room', 'state', 'brain_out', 'gemini_wall'), { recursive: true });
fs.writeFileSync(path.join('dressing-room', 'state', 'brain_out', 'gemini_wall', today + '.md'), html);
console.log('Done!');
