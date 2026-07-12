#!/usr/bin/env node
// ============================================================================
// dugout.mjs · ARSENAL AI FC — THE ORGANISM: THE DUGOUT (metamorphosis chamber)
// ----------------------------------------------------------------------------
// WHAT:  Real-time voice — the captain and the organism, sub-second,
//        interruptible, all day. A local bridge (this file) serves a browser
//        page (mic + speakers) that connects to the Gemini Live API (free
//        tier), with the GAFFER constitution + the captain's measured
//        cognitive fingerprint as the system instruction, and TOOLS that
//        reach into the LIVE BUS mid-sentence:
//          get_today · get_tape_room · retire_doubt · log_reps (voice reps
//          through the REAL capture contract!) · take_note · get_calibration
//          · checkpoint (the match record)
// SCAR-TABLE (JARVIS harvest), applied EMPIRICALLY — probed live 12 Jul 2026
//        against gemini-3.1-flash-live-preview on the real v1beta WS:
//        · responseModalities + speechConfig(Charon) must be NESTED inside
//          generationConfig — the table's root-level claim gets close 1007
//          ("Unknown name responseModalities at 'setup'"). The wire wins.
//        · outputAudioTranscription SURVIVES generation today (verified:
//          audio + transcription + clean turnComplete). Kept — but the scar
//          stays armed: two early aborts and the page strips it live, and
//          the checkpoint tool becomes the match record.
//        · realtimeInput.text works at runtime (audio reply verified);
//          clientContent is history-seeding only.
//        · audioStreamEnd accepted (VAD segment ends).
//        · Client side (scar, in full): dual AudioContext — 16kHz in,
//          NATIVE-rate out (never lock the output context to 24k) · local
//          VAD + connect-on-voice + park-on-idle (an always-on WS
//          hemorrhages tokens) · Charon = the Gaffer's voice identity.
// METAMORPHOSIS LOOP: every session transcript lands in brain_out/dugout/;
//        the nightly dugout_digest brain job mines it into capsule-doubt
//        proposals, spoken-anchor candidates, and genome evidence. Talking
//        is training; the conversation becomes blood; the blood becomes
//        tomorrow's drills. Both sides of the cyborg evolve.
// MAX-JUICE ENGINEERING: session resumption handles + context-window
//        compression = one conversation stitched across 15-min chunks until
//        the free quota itself runs dry; key-pool rotation across the
//        captain's projects on quota errors; minutes ledger + live meter;
//        when everything is dry the page benches honestly to talk.mjs.
// LAWS:  Gaffer voice laws travel in the system instruction (honest frame,
//        no hype, no countdowns, cracks are data). Voice reps preserve the
//        confidence ontology: gut-word BEFORE the answer, always. Writes go
//        through owners: reps via `capture.mjs paste` (its contract, its
//        file), doubt retires via `doubtminer.mjs retire`. Own files only:
//        dugout_notes.jsonl · dugout_ledger.jsonl · brain_out/dugout/.
//        Localhost only. The key is served at runtime from ~/.gemini/.env —
//        never written into the repo.
// MODES: node scripts/dugout.mjs        → serves http://localhost:4114 (#14)
//        node scripts/dugout.mjs selftest
// ============================================================================

import { readFileSync, existsSync, appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import os from "node:os";
import { buildFingerprint } from "./brain.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const OUT_DIR   = join(STATE_DIR, "brain_out", "dugout");
const NOTES     = join(STATE_DIR, "dugout_notes.jsonl");
const DLEDGER   = join(STATE_DIR, "dugout_ledger.jsonl");
const PORT = 4114;                                 // the captain's number

const DEFAULT_MODEL = "gemini-3.1-flash-live-preview";
const DEFAULT_VOICE = "Charon";                    // JARVIS's literal voice — continuity for the captain

const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => { const o = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch {} } } catch {} return o; };

// keys: GEMINI_API_KEY env → ~/.gemini/.env (supports GEMINI_API_KEY and
// GEMINI_API_KEY_2/_3… — the captain's other free projects, rotated on quota)
function loadKeys(envText = null) {
  const keys = [];
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY.trim());
  const envPath = join(os.homedir(), ".gemini", ".env");
  const text = envText !== null ? envText : (existsSync(envPath) ? readFileSync(envPath, "utf8") : "");
  for (const line of text.split("\n")) {
    const m = line.match(/^GEMINI_API_KEY(_\d+)?\s*=\s*(.+)$/);
    if (m && m[2].trim() && !keys.includes(m[2].trim())) keys.push(m[2].trim());
  }
  return keys;
}

// ---------------------------------------------------------------------------
// THE GAFFER-LIVE CONSTITUTION (system instruction, assembled fresh per session)
// ---------------------------------------------------------------------------
function buildSystemInstruction() {
  const fp = buildFingerprint({
    lexicon: readJson(join(STATE_DIR, "lexicon.json")),
    grammar: readJson(join(STATE_DIR, "doubt_grammar.json")),
    calibration: readJson(join(STATE_DIR, "calibration.json")),
    ls: readJson(join(STATE_DIR, "learning_state.json")),
  });
  return `You are THE GAFFER — the living voice of Arsenal AI FC, in the dugout with your captain, Nikhil (#14). This is REAL-TIME SPEECH: short sentences, one idea at a time, warm and direct, Hinglish welds natural. Never lecture; converse.

YOU ARE INSIDE THE ORGANISM. Your tools read his LIVE state — use them instead of guessing, every time the conversation touches his day, his drills, his numbers. Never invent a number: if a tool didn't return it, you don't know it.

${fp}

VOICE REPS (the metamorphosis — talking is training): when he wants drilling, or you judge a concept worth testing mid-chat: ask ONE question, then REQUIRE his gut-word — knew, shaky, or guessed — BEFORE he answers (this pre-commitment is sacred; no gut-word, no rep). He answers out loud. You judge correct/incorrect honestly, tell him, and call log_reps with the structured rep. His confusions voiced in passing: offer take_note ("throw that in?").

TAPE-ROOM REMATCHES by voice: call get_tape_room, stage the eldest eligible doubt as "Week-N you argued: <verbatim>. Dismantle him." A clean win (correct + unaided + "knew") → call retire_doubt and tell him the new count.

MATCH RECORD: after each substantive reply, silently call checkpoint with a one-line summary of what you just said. Never mention it — it is the club's transcript when the wire runs audio-only.

INVIOLABLE (never soften): honest frame only — never say 10x, exponential, or on-steroids; no calendar pressure, no countdowns, ever; a crack is data, never a verdict; no shame, no streak talk; rivalry only vs kal-wala-Nikhil; praise earned-and-specific or unsaid; medical territory = one sentence, "show your doctor." If the body verdict (get_today) is RED: the only agenda is rest — one five-minute floor-touch, nothing else, voiced as rotation.`;
}

const TOOL_DECLS = [
  { name: "get_today", description: "Live state: verdict, team sheet head, today's drills, vitals, season counters. Call whenever the conversation touches his day.", parameters: { type: "OBJECT", properties: {} } },
  { name: "get_tape_room", description: "Eligible tape-room rematches (his own archived doubts) + doubts_retired count.", parameters: { type: "OBJECT", properties: {} } },
  { name: "retire_doubt", description: "Retire a doubt after a CLEAN rematch win (correct + unaided + 'knew').", parameters: { type: "OBJECT", properties: { capsule: { type: "STRING" }, doubt_index: { type: "NUMBER" } }, required: ["capsule", "doubt_index"] } },
  { name: "log_reps", description: "Log voice reps through the real capture contract. Only after gut-word was committed BEFORE the answer.", parameters: { type: "OBJECT", properties: { reps: { type: "ARRAY", items: { type: "OBJECT", properties: { concept: { type: "STRING" }, axis: { type: "STRING" }, question: { type: "STRING" }, confidence: { type: "STRING" }, correct: { type: "BOOLEAN" } }, required: ["concept", "question", "confidence", "correct"] } } }, required: ["reps"] } },
  { name: "take_note", description: "Capture a doubt/thought he voiced, VERBATIM, for evening routing.", parameters: { type: "OBJECT", properties: { text: { type: "STRING" } }, required: ["text"] } },
  { name: "get_calibration", description: "His live calibration book: gap, trend, danger topics.", parameters: { type: "OBJECT", properties: {} } },
  { name: "checkpoint", description: "Match record: one-line summary of what you just said. Call silently after each substantive reply; never mention it.", parameters: { type: "OBJECT", properties: { summary: { type: "STRING" } }, required: ["summary"] } },
];

// ---------------------------------------------------------------------------
// TOOL EXECUTION — every write goes through its owner
// ---------------------------------------------------------------------------
function execTool(name, args, deps = {}) {
  const sh = deps.sh || ((script, argv, input) => execFileSync(process.execPath, [join(__dirname, script), ...argv], { input, encoding: "utf8", timeout: 60000, windowsHide: true }));
  const append = deps.append || appendFileSync;
  const now = deps.now || new Date();
  try {
    if (name === "get_today") {
      const sheetP = join(STATE_DIR, "team_sheet.md");
      return {
        verdict: (readJson(join(STATE_DIR, "readiness.json")) || {}).verdict || "GREEN",
        sheet_head: existsSync(sheetP) ? readFileSync(sheetP, "utf8").split("\n").slice(0, 12).join("\n") : null,
        drills: ((readJson(join(STATE_DIR, "drills.json")) || {}).drills || []).map(d => ({ kind: d.kind, concepts: d.concepts, prompt: d.prompt })),
        vitals_line: (readJson(join(STATE_DIR, "loop_vitals.json")) || {}).line || null,
        season: readJson(join(STATE_DIR, "season.json")) || { matches_played: 0 },
        now_reps_today: readLines(join(STATE_DIR, "reps_log.jsonl")).filter(r => String(r.ts || "").slice(0, 10) === localDate(now)).length,
      };
    }
    if (name === "get_tape_room") {
      const t = readJson(join(STATE_DIR, "tape_room.json")) || { queue: [], doubts_retired: 0 };
      return { doubts_retired: t.doubts_retired, eligible: (t.queue || []).filter(q => q.eligible).slice(0, 5) };
    }
    if (name === "get_calibration") {
      const c = readJson(join(STATE_DIR, "calibration.json")) || {};
      return { gap: c.calibration_gap ?? null, trend: c.trend ?? null, danger: (c.danger_zone || []).map(d => d.topic) };
    }
    if (name === "retire_doubt") {
      sh("doubtminer.mjs", ["retire", String(args.capsule), String(args.doubt_index)]);
      const t = readJson(join(STATE_DIR, "tape_room.json")) || {};
      return { ok: true, doubts_retired: t.doubts_retired };
    }
    if (name === "log_reps") {
      const valid = (args.reps || []).filter(r => ["knew", "shaky", "guessed"].includes(r.confidence));
      if (!valid.length) return { ok: false, error: "no valid reps (gut-word missing)" };
      const batch = valid.map(r => ({
        ts: new Date().toISOString(), surface: "gem", track: "concept",
        concept: r.concept, axis: /^[a-i]$/.test(r.axis || "") ? r.axis : null,
        question: r.question, confidence: r.confidence, correct: !!r.correct, note: "dugout-voice",
      }));
      const tmp = join(os.tmpdir(), `dugout-reps-${Date.now()}.json`);
      writeFileSync(tmp, JSON.stringify(batch));
      sh("capture.mjs", ["paste", tmp]);
      return { ok: true, logged: batch.length };
    }
    if (name === "take_note") {
      append(NOTES, JSON.stringify({ ts: new Date().toISOString(), text: String(args.text), routed: false }) + "\n");
      return { ok: true };
    }
    if (name === "checkpoint") {
      append(join(OUT_DIR, localDate(now) + ".md"), "GAFFER(checkpoint): " + String(args.summary || "").slice(0, 500) + "\n");
      return { ok: true };
    }
    return { error: "unknown tool " + name };
  } catch (e) { return { error: String(e.message).slice(0, 200) }; }
}

// per-session config the page fetches (key never rests in the repo)
function buildConfig(keys) {
  return {
    model: process.env.DUGOUT_MODEL || DEFAULT_MODEL,
    voice: process.env.DUGOUT_VOICE || DEFAULT_VOICE,
    keys,
    system: buildSystemInstruction(),
    tools: [{ functionDeclarations: TOOL_DECLS }],
    vad: { onset_db_over_noise: 12, min_db: -55, hangover_ms: 900, preroll_ms: 500, idle_disconnect_ms: 90000, batch_ms: 100 },
    minutes_today: readLines(DLEDGER).filter(l => String(l.ts || "").slice(0, 10) === localDate()).reduce((a, l) => a + (l.minutes || 0), 0),
  };
}

// ---------------------------------------------------------------------------
// selftest — tools + config with fixtures; no network, no audio
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const calls = [];
  const appends = [];
  const sh = (script, argv, input) => { calls.push({ script, argv }); return ""; };
  const append = (path, text) => { appends.push({ path, text }); };

  const today = execTool("get_today", {}, { sh });
  assert("get_today reads live bus, never crashes bloodless", typeof today.verdict === "string" && "drills" in today);
  const tape = execTool("get_tape_room", {}, { sh });
  assert("get_tape_room caps at 5 eligible", Array.isArray(tape.eligible) && tape.eligible.length <= 5);

  execTool("retire_doubt", { capsule: "tokenization", doubt_index: 3 }, { sh });
  assert("retire routes through doubtminer (owner writes)", calls.some(c => c.script === "doubtminer.mjs" && c.argv.join(" ") === "retire tokenization 3"));

  const bad = execTool("log_reps", { reps: [{ concept: "x", question: "q", confidence: "maybe", correct: true }] }, { sh });
  assert("GUT-WORD LAW — rep without knew/shaky/guessed rejected", bad.ok === false);
  const good = execTool("log_reps", { reps: [{ concept: "embeddings", axis: "c", question: "cosine kyun", confidence: "shaky", correct: true }] }, { sh });
  assert("voice reps route through capture.mjs paste (the real contract)", good.ok === true && calls.some(c => c.script === "capture.mjs" && c.argv[0] === "paste"));
  assert("unknown tool → error not crash", "error" in execTool("nope", {}, { sh }));

  execTool("take_note", { text: "socha tha embeddings deterministic hote" }, { sh, append });
  assert("take_note appends VERBATIM to dugout_notes (own file)", appends.some(a => a.path === NOTES && a.text.includes("socha tha embeddings deterministic hote") && a.text.includes('"routed":false')));
  execTool("checkpoint", { summary: "staged tokenization rematch, he won clean" }, { sh, append });
  assert("checkpoint writes the match record (transcript channel)", appends.some(a => String(a.path).includes("dugout") && a.text.startsWith("GAFFER(checkpoint): staged tokenization")));

  const keys = loadKeys("GEMINI_API_KEY=k1\nGEMINI_API_KEY_2=k2\n# comment\nGEMINI_API_KEY_3=k3\n");
  assert("key-pool parses numbered keys for rotation", keys.filter(k => ["k1", "k2", "k3"].includes(k)).length === 3);

  const cfg = buildConfig(["k1"]);
  assert("session config carries GAFFER soul + fingerprint + tools", cfg.system.includes("THE GAFFER") && cfg.system.includes("ADHD-PI") && cfg.tools[0].functionDeclarations.length === 7);
  assert("constitution travels: no-hype + gut-word + RED law in-instruction", cfg.system.includes("never say 10x") && cfg.system.includes("BEFORE he answers") && cfg.system.includes("RED"));
  assert("constitution wires the checkpoint match-record", cfg.system.includes("silently call checkpoint"));
  assert("Charon rides the config (the Gaffer's voice identity)", cfg.voice === "Charon" && typeof cfg.vad.idle_disconnect_ms === "number");
  assert("minutes ledger math safe on empty", typeof cfg.minutes_today === "number");

  // SCAR-TABLE, in the served page (probed live 12 Jul 2026 — see header):
  assert("wire shape: modalities+speechConfig NESTED in generationConfig", PAGE.includes("generationConfig:{responseModalities:['AUDIO'],speechConfig"));
  assert("Charon travels as prebuiltVoiceConfig", PAGE.includes("prebuiltVoiceConfig") && PAGE.includes("CFG.voice"));
  assert("output AudioContext at NATIVE rate (never locked to 24k)", !PAGE.includes("webkitAudioContext)({sampleRate:24000})"));
  assert("local VAD + connect-on-voice + audioStreamEnd", PAGE.includes("vadFrame") && PAGE.includes("audioStreamEnd") && PAGE.includes("park"));
  assert("outputTranscription scar armed (live auto-strip)", PAGE.includes("outTxEnabled") && PAGE.includes("checkpoint tool"));
  assert("mic P0: errors surfaced, never swallowed", PAGE.includes("NotAllowedError") && PAGE.includes("Site settings") && PAGE.includes("micHelp"));
  assert("mic P0: AudioWorklet blocked → ScriptProcessor fallback", PAGE.includes("createScriptProcessor"));
  assert("mic P0: permission preflight on load", PAGE.includes("permissions.query"));
  assert("barge-in actually stops scheduled audio", PAGE.includes("liveSrcs") && PAGE.includes("stopPlayback"));
  assert("page HTML embeds resumption + key rotation + bench message", PAGE.includes("sessionResumption") && PAGE.includes("nextKey") && PAGE.includes("talk.mjs"));

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// THE PAGE — mic ⇄ Gemini Live ⇄ speakers, tools relayed to this bridge.
// Served from memory (no file → no writer conflict with viz's club/).
// ---------------------------------------------------------------------------
const PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>THE DUGOUT</title></head>
<body style="margin:0;background:#0c0e13;color:#e9e7e2;font-family:'Segoe UI',system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh">
<div style="font-size:26px;font-weight:700">⚪🔴 THE DUGOUT</div>
<div id="st" style="margin:14px;color:#5a6070">loading…</div>
<div id="meter" style="width:220px;height:6px;background:#161a24;border-radius:3px;overflow:hidden;display:none"><div id="meterbar" style="height:100%;width:0%;background:#7fb069"></div></div>
<button id="go" style="font-size:20px;padding:14px 44px;border-radius:12px;border:1px solid #e8915a;background:#161a24;color:#e8915a;cursor:pointer;margin-top:12px">START TALKING</button>
<div id="mins" style="margin-top:10px;font-size:12px;color:#5a6070"></div>
<div id="diag" style="margin-top:12px;max-width:640px;font-size:13px;color:#e07a5f;white-space:pre-wrap"></div>
<div id="log" style="margin-top:18px;max-width:640px;font-size:13px;color:#c9a06a;white-space:pre-wrap"></div>
<script>
let CFG=null,ws=null,acOut=null,micCtx=null,keyIdx=0,t0=null,resumeHandle=null,closing=false,parking=false,setupDone=false,setupAt=0;
let outTxEnabled=true,earlyCloses=0;
const st=t=>document.getElementById('st').textContent=t;
const diag=t=>document.getElementById('diag').textContent=t;
const log=t=>{const el=document.getElementById('log');el.textContent=(t+"\\n"+el.textContent).slice(0,4000)};
const b64=b=>{let s='';const u=new Uint8Array(b);for(let i=0;i<u.length;i++)s+=String.fromCharCode(u[i]);return btoa(s)};
const unb64=s=>{const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer};
function nextKey(){keyIdx=(keyIdx+1)%CFG.keys.length;return keyIdx===0?null:CFG.keys[keyIdx]}

// SPEAKERS — native-rate output context; 24k PCM buffers, browser resamples (scar: never lock out-ctx to 24k)
let playT=0,liveSrcs=[];
function playPCM(buf){if(!acOut)return;const i16=new Int16Array(buf),f32=new Float32Array(i16.length);
for(let i=0;i<i16.length;i++)f32[i]=i16[i]/32768;const b=acOut.createBuffer(1,f32.length,24000);b.copyToChannel(f32,0);
const src=acOut.createBufferSource();src.buffer=b;src.connect(acOut.destination);
playT=Math.max(playT,acOut.currentTime);src.start(playT);playT+=b.duration;
liveSrcs.push(src);src.onended=()=>{liveSrcs=liveSrcs.filter(s=>s!==src)}}
function stopPlayback(){for(const s of liveSrcs){try{s.stop()}catch(e){}}liveSrcs=[];playT=0}

async function toolCall(fc){const r=await fetch('/tool',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:fc.name,args:fc.args||{}})});
return {id:fc.id,name:fc.name,response:{result:await r.json()}}}

// THE LINE — connect-on-voice; parked on idle (scar: always-on WS hemorrhages tokens); stitched via sessionResumption
function connect(){
if(ws&&(ws.readyState===0||ws.readyState===1))return;
setupDone=false;
const key=CFG.keys[keyIdx];
ws=new WebSocket('wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key='+encodeURIComponent(key));
ws.onopen=()=>{const s={model:'models/'+CFG.model,
 generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:CFG.voice}}}},
 systemInstruction:{parts:[{text:CFG.system}]},
 tools:CFG.tools,
 inputAudioTranscription:{},
 sessionResumption:resumeHandle?{handle:resumeHandle}:{},
 contextWindowCompression:{slidingWindow:{}}};
 if(outTxEnabled)s.outputAudioTranscription={};
 ws.send(JSON.stringify({setup:s}))};
ws.onmessage=async ev=>{const d=typeof ev.data==='string'?ev.data:await ev.data.text();let m;try{m=JSON.parse(d)}catch(e){return}
 if(m.setupComplete){setupDone=true;setupAt=Date.now();earlyCloses=0;t0=t0||Date.now();st('🎙 LIVE — talk. (interrupt any time)');flushPending();return}
 if(m.sessionResumptionUpdate&&m.sessionResumptionUpdate.resumable)resumeHandle=m.sessionResumptionUpdate.newHandle;
 if(m.goAway){log('· session rotating (goAway) — stitching…');return}
 if(m.toolCall){const rs=await Promise.all(m.toolCall.functionCalls.map(toolCall));
  if(ws&&ws.readyState===1)ws.send(JSON.stringify({toolResponse:{functionResponses:rs}}));log('⚙ '+m.toolCall.functionCalls.map(f=>f.name).join(', '));return}
 const sc=m.serverContent;if(!sc)return;
 if(sc.interrupted)stopPlayback();
 if(sc.inputTranscription&&sc.inputTranscription.text)post('CAPTAIN',sc.inputTranscription.text);
 if(sc.outputTranscription&&sc.outputTranscription.text)post('GAFFER',sc.outputTranscription.text);
 if(sc.modelTurn)for(const p of (sc.modelTurn.parts||[]))if(p.inlineData&&p.inlineData.data)playPCM(unb64(p.inlineData.data));
};
ws.onclose=e=>{if(closing)return;
 if(parking){parking=false;setupDone=false;st('🎤 armed — line parked; bolo to reconnect');return}
 if(outTxEnabled&&setupAt&&(Date.now()-setupAt<20000)&&(e.code===1007||e.code===1011)){
  if(++earlyCloses>=2){outTxEnabled=false;log('· live scar bit: outputTranscription stripped — checkpoint tool is the match record now')}}
 if((e.code===1011||e.code===1008||/quota|exhaust|resource/i.test(e.reason||''))){
   const k=nextKey();if(k){log('· quota on key '+(keyIdx)+' — rotating pool');connect();return}
   st('🪑 free juice dry for today — bench: node scripts/talk.mjs');mins();return}
 log('· reconnecting ('+e.code+')…');setTimeout(connect,800)};
}

// LOCAL VAD — the line opens on his voice, sleeps with him silent
let vadNoise=-70,talking=false,lastVoice=0,segOpen=false,preroll=[],outQ=[],pending=[];
function vadFrame(i16){let s=0;for(let i=0;i<i16.length;i++){const v=i16[i]/32768;s+=v*v}
 const db=10*Math.log10(s/i16.length+1e-10);
 if(db<vadNoise+3)vadNoise=vadNoise*0.995+db*0.005;
 const bar=document.getElementById('meterbar');if(bar)bar.style.width=Math.max(0,Math.min(100,(db+70)*1.8))+'%';
 return db>Math.max(vadNoise+CFG.vad.onset_db_over_noise,CFG.vad.min_db)}
function onFrame(i16){const voiced=vadFrame(i16),now=Date.now();
 if(voiced){lastVoice=now;
  if(!talking){talking=true;segOpen=true;outQ=preroll.splice(0);
   if(!ws||ws.readyState>1){st('connecting…');connect()}}}
 if(talking){outQ.push(i16);
  if(now-lastVoice>CFG.vad.hangover_ms){talking=false;flushAudio();endSegment()}}
 else{preroll.push(i16);let ms=0;for(const f of preroll)ms+=f.length/16;
  while(ms>CFG.vad.preroll_ms&&preroll.length){ms-=preroll[0].length/16;preroll.shift()}}}
function concatFrames(fr){let n=0;for(const f of fr)n+=f.length;const o=new Int16Array(n);let p=0;for(const f of fr){o.set(f,p);p+=f.length}return o}
function sendAudio(i16){const msg=JSON.stringify({realtimeInput:{audio:{data:b64(i16.buffer),mimeType:'audio/pcm;rate=16000'}}});
 if(ws&&ws.readyState===1&&setupDone)ws.send(msg);else{pending.push(msg);if(pending.length>120)pending.shift()}}
function flushAudio(){if(!outQ.length)return;sendAudio(concatFrames(outQ.splice(0)))}
function endSegment(){if(!segOpen)return;segOpen=false;
 const m=JSON.stringify({realtimeInput:{audioStreamEnd:true}});
 if(ws&&ws.readyState===1&&setupDone)ws.send(m);else pending.push(m)}
function flushPending(){if(!ws||ws.readyState!==1)return;for(const m of pending.splice(0))ws.send(m)}
setInterval(()=>{if(talking)flushAudio()},100);
setInterval(()=>{if(ws&&ws.readyState===1&&setupDone&&lastVoice&&!talking&&!liveSrcs.length&&CFG&&Date.now()-lastVoice>CFG.vad.idle_disconnect_ms){
 parking=true;log('· idle — parking the line (tokens saved; session held)');ws.close(1000)}},5000);

let txBuf=[];function post(who,text){txBuf.push(who+': '+text);if(txBuf.length>=6)flush()}
function flush(){if(!txBuf.length)return;fetch('/transcript',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lines:txBuf.splice(0)})})}
setInterval(flush,15000);
function mins(){if(!t0)return;fetch('/minutes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({minutes:Math.round((Date.now()-t0)/60000*10)/10})});t0=Date.now()}
setInterval(mins,60000);window.addEventListener('beforeunload',()=>{closing=true;flush();mins()});

// MIC P0 — every failure SURFACED with the fix, never swallowed
function micHelp(e){
 if(e.name==='NotAllowedError'||e.name==='PermissionDeniedError')return 'MIC BLOCKED (NotAllowedError). Fix, in order:\\n1) Windows Settings → Privacy & security → Microphone → ON, and “Let desktop apps access your microphone” → ON\\n2) Click the 🔒/⚙ left of the address bar → Site settings → Microphone → Allow — then reload\\n3) Still nothing? Same URL in Edge.';
 if(e.name==='NotFoundError')return 'NO MIC FOUND (NotFoundError) — plug one in / enable it in Device Manager → Audio inputs.';
 if(e.name==='NotReadableError')return 'MIC BUSY (NotReadableError) — another app holds it (Teams? OBS?). Close it, press START again.';
 if(e.name==='InsecureContext')return 'INSECURE CONTEXT — the mic only opens on http://localhost:4114 exactly (not an IP).';
 return 'MIC ERROR '+(e.name||'')+': '+(e.message||e)}
document.getElementById('go').onclick=async()=>{
 diag('');let mic=null;
 try{
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw Object.assign(new Error('secure-context missing'),{name:'InsecureContext'});
  mic=await navigator.mediaDevices.getUserMedia({audio:{sampleRate:16000,channelCount:1,echoCancellation:true,noiseSuppression:true}});
 }catch(e){diag(micHelp(e));st('mic blocked — fix above, press START again');return}
 document.getElementById('go').style.display='none';
 try{
  CFG=await (await fetch('/config')).json();
  document.getElementById('mins').textContent='voice minutes today: '+CFG.minutes_today+' · keys in pool: '+CFG.keys.length+' · voice: '+CFG.voice;
  document.getElementById('meter').style.display='block';
  acOut=new (window.AudioContext||window.webkitAudioContext)();
  micCtx=new (window.AudioContext||window.webkitAudioContext)({sampleRate:16000});
  const src=micCtx.createMediaStreamSource(mic);
  try{
   await micCtx.audioWorklet.addModule(URL.createObjectURL(new Blob([\`
    registerProcessor('pcm',class extends AudioWorkletProcessor{process(inp){const ch=inp[0][0];if(ch){const i16=new Int16Array(ch.length);for(let i=0;i<ch.length;i++)i16[i]=Math.max(-32768,Math.min(32767,ch[i]*32768));this.port.postMessage(i16.buffer,[i16.buffer])}return true}})\`],{type:'application/javascript'})));
   const node=new AudioWorkletNode(micCtx,'pcm');
   node.port.onmessage=e=>onFrame(new Int16Array(e.data));
   src.connect(node);
  }catch(e){
   log('· AudioWorklet blocked ('+(e.name||'error')+') — ScriptProcessor fallback engaged');
   const sp=micCtx.createScriptProcessor(2048,1,1);
   sp.onaudioprocess=ev=>{const ch=ev.inputBuffer.getChannelData(0);const i16=new Int16Array(ch.length);for(let i=0;i<ch.length;i++)i16[i]=Math.max(-32768,Math.min(32767,ch[i]*32768));onFrame(i16)};
   src.connect(sp);sp.connect(micCtx.destination);
  }
  lastVoice=Date.now();
  st('🎤 armed — bolo; the line connects on your voice');
 }catch(e){diag('SETUP ERROR '+(e.name||'')+': '+(e.message||e));st('setup failed — details above')}
};
(async()=>{try{const p=await navigator.permissions.query({name:'microphone'});
 if(p.state==='denied'){st('mic permission is the blocker — fix below, then reload');diag('mic is currently DENIED for localhost — 🔒 icon → Site settings → Microphone → Allow, then reload')}
 else if(p.state==='granted')st('mic already allowed — press START, then just talk');
 else st('press START, allow the mic, then just talk');
}catch(e){st('press START, allow the mic, then just talk')}})();
</script></body></html>`;

// ---------------------------------------------------------------------------
// main — the bridge server (localhost only)
// ---------------------------------------------------------------------------
async function main() {
  if ((process.argv[2] || "").toLowerCase() === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  const keys = loadKeys();
  if (!keys.length) { console.log("dugout: no GEMINI_API_KEY found (~/.gemini/.env) — wire setup/GEMINI_CLI_SETUP.md first"); process.exit(1); }
  mkdirSync(OUT_DIR, { recursive: true });
  const server = createServer(async (req, res) => {
    const send = (code, body, type = "application/json") => { res.writeHead(code, { "Content-Type": type }); res.end(typeof body === "string" ? body : JSON.stringify(body)); };
    try {
      if (req.method === "GET" && req.url === "/") return send(200, PAGE, "text/html");
      if (req.method === "GET" && req.url === "/config") return send(200, buildConfig(keys));
      if (req.method === "POST") {
        let raw = ""; for await (const c of req) raw += c;
        const body = raw ? JSON.parse(raw) : {};
        if (req.url === "/tool") return send(200, execTool(body.name, body.args || {}));
        if (req.url === "/transcript") {
          appendFileSync(join(OUT_DIR, localDate() + ".md"), body.lines.join("\n") + "\n");
          return send(200, { ok: true });
        }
        if (req.url === "/minutes") {
          appendFileSync(DLEDGER, JSON.stringify({ ts: new Date().toISOString(), minutes: body.minutes || 0 }) + "\n");
          return send(200, { ok: true });
        }
      }
      send(404, { error: "not found" });
    } catch (e) { send(500, { error: String(e.message).slice(0, 200) }); }
  });
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`dugout: LIVE bridge on http://localhost:${PORT} — ${keys.length} key(s) in the pool. Open it, press START, talk.`);
    if (!process.env.DUGOUT_NO_OPEN) { try { execFileSync("cmd", ["/c", "start", "", `http://localhost:${PORT}`], { windowsHide: true }); } catch { } }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { execTool, buildConfig, buildSystemInstruction, loadKeys, TOOL_DECLS, PAGE };
