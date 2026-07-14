#!/usr/bin/env node
// ============================================================================
// cortex.mjs · ARSENAL AI FC — THE CORTEX (the deep brain's waker)
// ----------------------------------------------------------------------------
// WHAT:  The prefrontal half of the two-speed brain (CYBORG_BRAIN.md §4.6).
//        Watches wake.json — the thalamus's TIER-2 handoff contract — and for
//        each pending wake runs ONE profound read on Claude Opus with extended
//        thinking (`claude -p`, Max subscription, NEVER an API key), feeding
//        the bound moment + the relevant bus slice (twin · calibration ·
//        learning-state · the matching capsule). The answer is POSTed back to
//        the thalamus at :4113/deep-answer — the cortex NEVER writes a state
//        file the thalamus owns (single-writer preserved); its only files are
//        its own runtime (cortex_runtime.json) and the SHARED brain ledger
//        row it appends so the Opus spend counts against the real window
//        (same shape brain.mjs writes; windowUsage() sees every token).
// GUARDS: refuses to run if ANTHROPIC_API_KEY is set (the $100 law, same as
//        brain.mjs) · declines the wake when window headroom is under the
//        floor (the budget-coupled thalamus already raised the bar; this is
//        the second lock) · at most 2 attempts per moment · the answer passes
//        the banned-phrase validator (honest frame) or it is DECLINED, never
//        softened. A declined wake is still reported back — nothing dangles.
// MODES: node scripts/cortex.mjs             → daemon (watch + 5s poll)
//        node scripts/cortex.mjs tick        → serve one pending wake, exit
//        node scripts/cortex.mjs selftest
// ============================================================================

import { readFileSync, existsSync, appendFileSync, mkdirSync, writeFileSync, renameSync, watch, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { headroom, loadConfig as loadBrainConfig, bannedPhraseCheck } from "./brain.mjs";
import { loadConfig as loadThalamusConfig } from "./thalamus.mjs";
// M8 — the Back Room: three cheap adversarial drafts before the one deep call
import { convene, councilSection } from "./council.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const WAKE      = join(STATE_DIR, "wake.json");
const RUNTIME   = join(STATE_DIR, "cortex_runtime.json");
const BLEDGER   = join(STATE_DIR, "brain_ledger.jsonl");
const THALAMUS  = "http://127.0.0.1:4113";

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => { const o = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch {} } } catch {} return o; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

// ---------------------------------------------------------------------------
// THE PROMPT — laws travel with every wake; the moment is the question
// ---------------------------------------------------------------------------
function findCapsule(tokens = [], dir = join(STATE_DIR, "capsules")) {
  try {
    const files = readdirSync(dir).filter(f => f.endsWith(".json"));
    for (const t of tokens.map(x => String(x).toLowerCase())) {
      const f = files.find(f => f.toLowerCase().includes(t));
      if (f) return { name: f, text: readFileSync(join(dir, f), "utf8").slice(0, 1500) };
    }
  } catch { }
  return null;
}
function buildDeepPrompt(wake, bus = {}, extraSection = "") {
  const spot = wake.spotlight || {};
  const capsule = bus.capsule !== undefined ? bus.capsule : findCapsule(spot.concept_tokens);
  const twin = bus.twin !== undefined ? bus.twin : readJson(join(STATE_DIR, "twin.json"));
  const cal = bus.calibration !== undefined ? bus.calibration : readJson(join(STATE_DIR, "calibration.json"));
  const ls = bus.learning_state !== undefined ? bus.learning_state : readJson(join(STATE_DIR, "learning_state.json"));
  return `You are THE BRIDGE — the deep brain of Arsenal AI FC, woken by the thalamus for the ~5% of moments that need real reasoning. Your captain is Nikhil (#14), ADHD-PI, training for an AI Product Engineer interview. The reflex brain already answered fast; you now give the PROFOUND read the moment deserves.

THE MOMENT (bound by the thalamus — the spotlight is why you were woken):
${JSON.stringify({ spotlight: { modality: spot.modality, text: spot.text, event_key: spot.event_key, concept_tokens: spot.concept_tokens, salience: spot.S, components: spot.comps }, bound_context: (wake.bound_context || []).map(c => ({ modality: c.modality, text: c.text, event_key: c.event_key })) }, null, 1).slice(0, 2500)}

THE BUS SLICE (his real, live state — never invent beyond it):
${JSON.stringify({ twin_markets: ((twin || {}).markets || []).map(m => ({ id: m.id, p: m.p })), calibration_gap: (cal || {}).calibration_gap ?? null, danger_topics: ((cal || {}).danger_zone || []).map(d => d.topic).slice(0, 5), learning_state_status: (ls || {}).status || null }, null, 1).slice(0, 1500)}
${capsule ? `\nTHE CAPSULE (his own locked knowledge on this concept — build on HIS words):\n${capsule.text}\n` : ""}${extraSection}
YOUR JOB: one deep, mechanism-level read. If it is a concept doubt: the real mechanism, a worked example, where it breaks, and the one reframe that dissolves HIS specific confusion. If it is a pattern/strategy moment: what is REALLY going on underneath, and the single next move that changes his next ten minutes. Think hard first; then answer.

THE LAWS (inviolable): speakable Gaffer voice, Hinglish welds welcome, ≤250 words. Honest frame only — never "10x", "exponential", "on steroids"; no shame, no streaks, no countdowns; never a number that is not in the data above; medical territory = one sentence, "show your doctor". A crack is data, never a verdict.`;
}

// ---------------------------------------------------------------------------
// THE CALL — claude -p, Max plan, extended thinking via MAX_THINKING_TOKENS
// ---------------------------------------------------------------------------
function claudeDeep(prompt, cfg, deps = {}) {
  const exec = deps.exec || ((args, opts) => execFileSync("claude", args, opts));
  const t0 = Date.now();
  try {
    const raw = exec(["-p", "--output-format", "json", "--model", "opus"], {
      input: prompt, timeout: cfg.deep.timeout_ms, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], windowsHide: true,
      env: { ...process.env, MAX_THINKING_TOKENS: String(cfg.deep.max_thinking_tokens) },   // extended thinking
    });
    const j = JSON.parse(raw);
    const text = String(j.result || "");
    const inTok = (j.usage && j.usage.input_tokens) || 0, outTok = (j.usage && j.usage.output_tokens) || 0;
    return { ok: j.is_error !== true && !!text, text, input_tokens: inTok, output_tokens: outTok, total_tokens: inTok + outTok || Math.ceil((prompt.length + text.length) / 4), duration_ms: Date.now() - t0, limit_hit: false, error: j.is_error ? String(j.result).slice(0, 200) : null };
  } catch (e) {
    const msg = String((e && e.message) || e).slice(0, 200);
    return { ok: false, text: "", input_tokens: 0, output_tokens: 0, total_tokens: Math.ceil(prompt.length / 4), duration_ms: Date.now() - t0, limit_hit: /limit|overloaded|rate.?limit|resets \d/i.test(msg), error: msg };
  }
}

// ---------------------------------------------------------------------------
// SERVE ONE WAKE — guard → budget → attempts → think → validate → report back
// ---------------------------------------------------------------------------
async function serveWake(deps = {}) {
  const cfg = deps.cfg || loadThalamusConfig();
  const brainCfg = deps.brainCfg || loadBrainConfig();
  const env = deps.env || process.env;
  const now = deps.now || new Date();
  const readWake = deps.readWake || (() => readJson(WAKE));
  const post = deps.post || (async (path, body) => { const r = await fetch(THALAMUS + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); return r.json(); });
  const ledger = deps.appendLedger || ((row) => appendFileSync(BLEDGER, JSON.stringify(row) + "\n"));
  const runtime = deps.runtime !== undefined ? deps.runtime : (readJson(RUNTIME) || { attempts: {} });
  const saveRuntime = deps.saveRuntime || ((o) => writeAtomic(RUNTIME, o));
  const call = deps.call || ((prompt) => claudeDeep(prompt, cfg));
  const log = deps.log || (() => {});

  // the $100 law — same refusal as brain.mjs
  if (brainCfg.guards && brainCfg.guards.refuse_if_api_key_env && env.ANTHROPIC_API_KEY) {
    log("cortex: ANTHROPIC_API_KEY set — REFUSING (Max plan only, never metered)");
    return { served: false, refused: true };
  }
  const wake = readWake();
  if (!wake || !wake.moment_id || wake.consumed || wake.status !== "pending") return { served: false, idle: true };

  // attempts cap — a poisoned wake never loops the window dry
  runtime.attempts = runtime.attempts || {};
  const tries = runtime.attempts[wake.moment_id] || 0;
  if (tries >= 2) {
    await post("/deep-answer", { moment_id: wake.moment_id, declined: true, reason: "gave-up-after-2-attempts", provenance: "cortex" });
    return { served: false, gave_up: true };
  }
  runtime.attempts[wake.moment_id] = tries + 1;
  saveRuntime(runtime);

  // second budget lock — the thalamus raised the bar; the cortex checks the vault
  const hr = deps.headroom || headroom(brainCfg, readLines(BLEDGER), readJson(join(STATE_DIR, "brain_queue.json")) || {}, now);
  if (hr.allowed < cfg.deep.min_headroom_tokens) {
    log(`cortex: window too low (${hr.allowed} < ${cfg.deep.min_headroom_tokens}) — declining, not draining`);
    await post("/deep-answer", { moment_id: wake.moment_id, declined: true, reason: "no-headroom", provenance: "cortex" });
    return { served: false, declined: "no-headroom" };
  }

  // M8 — THE COUNCIL sits first (three free adversarial drafts), then ONE
  // Opus integration adjudicates. Council dry/failed → the old cold path.
  let council = null;
  if (deps.council !== undefined) council = deps.council;
  else if (cfg.council !== false) {
    try { council = await convene(String((wake.spotlight || {}).text || (wake.spotlight || {}).event_key || ""), {}); } catch { council = null; }
  }
  const prompt = buildDeepPrompt(wake, deps.bus || {}, councilSection(council));
  const r = call(prompt);
  ledger({ ts: new Date().toISOString(), job: "cortex_wake", engine: "claude", model: "opus", input_tokens: r.input_tokens, output_tokens: r.output_tokens, total_tokens: r.total_tokens, duration_ms: r.duration_ms, ok: r.ok, error: r.error, limit_hit: r.limit_hit });
  if (!r.ok) { log(`cortex: deep call failed (${r.error}) — wake stays pending (attempt ${tries + 1}/2)`); return { served: false, error: r.error }; }

  // honest-frame validator — a law-breaking answer is DECLINED, never softened
  const banned = bannedPhraseCheck(r.text, (brainCfg.guards && brainCfg.guards.banned_phrases) || []);
  if (banned.length) {
    await post("/deep-answer", { moment_id: wake.moment_id, declined: true, reason: `banned-phrase:${banned.join(",")}`, provenance: "cortex" });
    return { served: false, declined: "banned-phrase" };
  }
  await post("/deep-answer", { moment_id: wake.moment_id, text: r.text, provenance: "opus-extended", tokens: r.total_tokens });
  log(`cortex: deep answer served for ${wake.moment_id} (${r.total_tokens} tok, ${Math.round(r.duration_ms / 1000)}s)`);
  return { served: true, moment_id: wake.moment_id, tokens: r.total_tokens };
}

// ---------------------------------------------------------------------------
// selftest — guards, prompt, ledger shape, report-back contract; no network
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const wake = { moment_id: "m_1", status: "pending", spotlight: { modality: "voice", text: "i don't get attention scaling", concept_tokens: ["attention"], S: 0.7, comps: { self: 1 } }, bound_context: [{ modality: "vision", event_key: "frame" }] };
  const bus = { capsule: null, twin: { markets: [{ id: "session_happened", p: 0.5 }] }, calibration: { calibration_gap: 0.12, danger_zone: [{ topic: "eval metrics" }] }, learning_state: { status: "ok" } };
  const brainCfg = { guards: { refuse_if_api_key_env: true, banned_phrases: ["10x", "exponential", "on steroids"] }, budget: {} };
  const mkDeps = (over = {}) => {
    const out = { posts: [], rows: [], runtime: { attempts: {} }, saved: [] };
    return {
      out,
      deps: {
        cfg: loadThalamusConfig(), brainCfg, env: {}, readWake: () => wake, bus,
        council: null,                               // hermetic — the live council never convenes inside a selftest
        post: async (p, b) => { out.posts.push({ p, b }); return { ok: true }; },
        appendLedger: (r) => out.rows.push(r),
        runtime: over.runtime || { attempts: {} }, saveRuntime: (o) => out.saved.push(JSON.parse(JSON.stringify(o))),
        headroom: over.headroom || { allowed: 300000, used: 0, cap: 800000, phase: "overnight" },
        call: over.call || (() => ({ ok: true, text: "Attention scales quadratically kyunki har token har token se milta hai — n tokens, n² handshakes.", input_tokens: 1200, output_tokens: 240, total_tokens: 1440, duration_ms: 9000, limit_hit: false, error: null })),
        ...over.deps,
      },
    };
  };

  // the $100 law
  {
    const { deps } = mkDeps({ deps: { env: { ANTHROPIC_API_KEY: "sk-nope" } } });
    const r = await serveWake(deps);
    assert("ANTHROPIC_API_KEY set → REFUSES before anything runs", r.refused === true);
  }
  // the happy arc
  {
    const { deps, out } = mkDeps({});
    const r = await serveWake(deps);
    assert("pending wake → deep answer POSTed back to :4113 (never a file write)", r.served && out.posts.length === 1 && out.posts[0].p === "/deep-answer" && out.posts[0].b.text.includes("n²"));
    assert("provenance says opus-extended", out.posts[0].b.provenance === "opus-extended");
    const row = out.rows[0];
    assert("ledger row is brain-shaped (engine claude — the window SEES the spend)", row.job === "cortex_wake" && row.engine === "claude" && row.model === "opus" && row.total_tokens === 1440 && row.ok === true && "limit_hit" in row);
    assert("attempts recorded (poisoned wakes can't loop)", out.saved[0].attempts.m_1 === 1);
  }
  // budget lock
  {
    const { deps, out } = mkDeps({ headroom: { allowed: 10000, used: 790000, cap: 800000, phase: "study" } });
    const r = await serveWake(deps);
    assert("window under the floor → DECLINES (reported, never dangling)", r.declined === "no-headroom" && out.posts[0].b.declined === true && out.posts[0].b.reason === "no-headroom");
    assert("a declined wake spends ZERO Opus tokens", out.rows.length === 0);
  }
  // give-up cap
  {
    const { deps, out } = mkDeps({ runtime: { attempts: { m_1: 2 } } });
    const r = await serveWake(deps);
    assert("two failed attempts → gives up loudly (declined, reason named)", r.gave_up === true && out.posts[0].b.reason === "gave-up-after-2-attempts");
  }
  // honest-frame validator
  {
    const { deps, out } = mkDeps({ call: () => ({ ok: true, text: "This will 10x your learning, exponential gains!", input_tokens: 10, output_tokens: 10, total_tokens: 20, duration_ms: 100, limit_hit: false, error: null }) });
    const r = await serveWake(deps);
    assert("banned-phrase answer is DECLINED, never softened or served", r.declined === "banned-phrase" && out.posts[0].b.declined === true && out.posts[0].b.reason.includes("10x"));
  }
  // failed call leaves the wake pending
  {
    const { deps, out } = mkDeps({ call: () => ({ ok: false, text: "", input_tokens: 0, output_tokens: 0, total_tokens: 500, duration_ms: 100, limit_hit: true, error: "rate limit" }) });
    const r = await serveWake(deps);
    assert("failed call → NO post (wake stays pending for retry), ledger records limit", !r.served && out.posts.length === 0 && out.rows[0].limit_hit === true);
  }
  // consumed / absent wakes are idle
  {
    const { deps } = mkDeps({ deps: { readWake: () => ({ consumed: { moment_id: "m_0" } }) } });
    assert("consumed wake → idle (consumed-on-success honored)", (await serveWake(deps)).idle === true);
    const { deps: d2 } = mkDeps({ deps: { readWake: () => null } });
    assert("no wake file → idle, never crashes", (await serveWake(d2)).idle === true);
  }
  // M8 — the Council sits before the deep call
  {
    const councilFix = { drafts: [{ seat: "steelman", text: "the cache saves recompute" }, { seat: "prosecutor", text: "memory vs compute conflation" }], disagreement: 0.9, split: true };
    let seenPrompt = null;
    const { deps } = mkDeps({ deps: { council: councilFix }, call: undefined });
    deps.call = (p) => { seenPrompt = p; return { ok: true, text: "integrated read", input_tokens: 1, output_tokens: 1, total_tokens: 2, duration_ms: 1, limit_hit: false, error: null }; };
    await serveWake(deps);
    assert("COUNCIL: three drafts ride the ONE Opus integration prompt", seenPrompt.includes("[STEELMAN]") && seenPrompt.includes("[PROSECUTOR]") && seenPrompt.includes("integrate, don't average"));
    assert("a hard split is surfaced to the deep brain as the crux", seenPrompt.includes("SPLIT HARD"));
    const { deps: dCold } = mkDeps({ deps: { council: null } });
    let coldPrompt = null;
    dCold.call = (p) => { coldPrompt = p; return { ok: true, text: "cold read", input_tokens: 1, output_tokens: 1, total_tokens: 2, duration_ms: 1, limit_hit: false, error: null }; };
    await serveWake(dCold);
    assert("council dry → the old cold path, byte-identical shape (layering)", coldPrompt && !coldPrompt.includes("[STEELMAN]") && coldPrompt.includes("YOUR JOB"));
  }

  // the prompt itself
  {
    const p = buildDeepPrompt(wake, bus);
    assert("prompt carries the bound moment (spotlight + context)", p.includes("attention scaling") && p.includes("bound_context"));
    assert("prompt carries the bus slice, and the no-invented-numbers law", p.includes("calibration_gap") && p.includes("never a number that is not in the data"));
    assert("prompt carries the honest-frame law + speakable contract", p.includes('never "10x"') && p.includes("250 words"));
    assert("prompt itself breaks no banned-phrase law", bannedPhraseCheck(p.replace(/never "10x", "exponential", "on steroids"/, ""), ["on steroids"]).length === 0);
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  if (mode === "tick") {
    const r = await serveWake({ log: console.log });
    console.log(`cortex: ${r.served ? "served " + r.moment_id : r.idle ? "no pending wake" : r.refused ? "refused (API key)" : JSON.stringify(r)}`);
    return;
  }
  console.log("cortex: deep-brain daemon — watching wake.json (fs.watch + 5s poll)");
  let busy = false;
  const fire = async () => { if (busy) return; busy = true; try { await serveWake({ log: console.log }); } catch (e) { console.log("cortex: " + String(e.message).slice(0, 120)); } busy = false; };
  try { watch(STATE_DIR, (ev, f) => { if (f === "wake.json") fire(); }); } catch { }
  setInterval(fire, 5000);
  fire();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { serveWake, buildDeepPrompt, claudeDeep, findCapsule };
