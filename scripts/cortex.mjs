#!/usr/bin/env node
// ============================================================================
// cortex.mjs · ARSENAL AI FC — THE CORTEX (the deep brain's waker)
// ----------------------------------------------------------------------------
// WHAT:  The prefrontal half of the two-speed brain (CYBORG_BRAIN.md §4.6).
//        M14 — THE OVERLAP: serves the thalamus's wake QUEUE (wake_queue.jsonl,
//        event-sourced; wake.json remains the legacy single-slot fallback) and
//        runs up to deep.concurrency (2) profound reads CONCURRENTLY on Claude
//        Opus with extended thinking (`claude -p`, Max subscription, NEVER an
//        API key) — one deep thought no longer blocks the next. Each read is
//        fed the bound moment + the relevant bus slice (twin · calibration ·
//        learning-state · the matching capsule). Answers are POSTed back to
//        the thalamus at :4113/deep-answer — the cortex NEVER writes a state
//        file the thalamus owns (single-writer preserved); its only files are
//        its own runtime (cortex_runtime.json) and the SHARED brain ledger
//        row it appends so the Opus spend counts against the real window
//        (same shape brain.mjs writes; windowUsage() sees every token).
//        A wake stuck in the queue past deep.queue_ttl_min is DECLINED as
//        expired-in-queue — nothing dangles, ever.
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
import { execFileSync, execFile } from "node:child_process";
import { headroom, loadConfig as loadBrainConfig, bannedPhraseCheck, maxThinkingFor } from "./brain.mjs";
import { loadConfig as loadThalamusConfig, pendingWakes } from "./thalamus.mjs";
// M8 — the Back Room: three cheap adversarial drafts before the one deep call
import { convene, councilSection } from "./council.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const WAKE      = join(STATE_DIR, "wake.json");
const WQUEUE    = join(STATE_DIR, "wake_queue.jsonl");   // M14 — read-only here; the thalamus is its sole writer
const RUNTIME   = join(STATE_DIR, "cortex_runtime.json");
const BLEDGER   = join(STATE_DIR, "brain_ledger.jsonl");
const THALAMUS  = "http://127.0.0.1:4113";
const LIMIT_RE  = /limit|overloaded|rate.?limit|resets \d/i;
const defaultPost = async (path, body) => { const r = await fetch(THALAMUS + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); return r.json(); };

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

// M14 — the ASYNC deep call: same contract as claudeDeep (frozen above), but
// non-blocking so two wakes can think at once. execFile + manual stdin.
function claudeDeepAsync(prompt, cfg, deps = {}) {
  const t0 = Date.now();
  return new Promise((resolve) => {
    const fail = (msg) => resolve({ ok: false, text: "", input_tokens: 0, output_tokens: 0, total_tokens: Math.ceil(prompt.length / 4), duration_ms: Date.now() - t0, limit_hit: LIMIT_RE.test(msg), error: msg.slice(0, 200) });
    try {
      const execFn = deps.execAsync || execFile;
      const child = execFn("claude", ["-p", "--output-format", "json", "--model", "opus"], {
        timeout: cfg.deep.timeout_ms, encoding: "utf8", windowsHide: true, maxBuffer: 16 * 1024 * 1024,
        env: { ...process.env, MAX_THINKING_TOKENS: String(cfg.deep.max_thinking_tokens) },   // extended thinking
      }, (err, stdout) => {
        if (err && !stdout) return fail(String((err && err.message) || err));
        try {
          const j = JSON.parse(stdout);
          const text = String(j.result || "");
          const inTok = (j.usage && j.usage.input_tokens) || 0, outTok = (j.usage && j.usage.output_tokens) || 0;
          resolve({ ok: j.is_error !== true && !!text, text, input_tokens: inTok, output_tokens: outTok, total_tokens: inTok + outTok || Math.ceil((prompt.length + text.length) / 4), duration_ms: Date.now() - t0, limit_hit: false, error: j.is_error ? String(j.result).slice(0, 200) : null });
        } catch (e) { fail(String((e && e.message) || e)); }
      });
      if (child && child.stdin) { child.stdin.on("error", () => {}); child.stdin.write(prompt); child.stdin.end(); }
    } catch (e) { fail(String((e && e.message) || e)); }
  });
}

// ---------------------------------------------------------------------------
// SERVE — guard → budget → attempts → think → validate → report back.
// serveOne handles ONE wake; serveWake keeps the legacy single-slot contract
// verbatim; serveWakes (M14) drains the queue up to deep.concurrency at once.
// ---------------------------------------------------------------------------
async function serveOne(wake, deps = {}) {
  const cfg = deps.cfg || loadThalamusConfig();
  const brainCfg = deps.brainCfg || loadBrainConfig();
  const env = deps.env || process.env;
  const now = deps.now || new Date();
  const post = deps.post || defaultPost;
  const ledger = deps.appendLedger || ((row) => appendFileSync(BLEDGER, JSON.stringify(row) + "\n"));
  const runtime = deps.runtime !== undefined ? deps.runtime : (readJson(RUNTIME) || { attempts: {} });
  const saveRuntime = deps.saveRuntime || ((o) => writeAtomic(RUNTIME, o));
  const log = deps.log || (() => {});

  // the $100 law — same refusal as brain.mjs
  if (brainCfg.guards && brainCfg.guards.refuse_if_api_key_env && env.ANTHROPIC_API_KEY) {
    log("cortex: ANTHROPIC_API_KEY set — REFUSING (Max plan only, never metered)");
    return { served: false, refused: true };
  }
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

  // second budget lock — the thalamus raised the bar; the cortex checks the vault.
  // P3 — thinking depth rides the moment (16k live / 48k overnight, capped to the
  // window) and the gate floor scales WITH it, so the deepest read never overshoots.
  const hr = deps.headroom || headroom(brainCfg, readLines(BLEDGER), readJson(join(STATE_DIR, "brain_queue.json")) || {}, now);
  const mtf = maxThinkingFor(hr.phase, hr.allowed);
  // the decline floor must cover the FULL call (input context + thinking + output), NOT just
  // 1.6x thinking — so NEVER drop below the config's conservative flat floor; only ever RAISE
  // it for the deep overnight reads (where think*1.6 overtakes it). Guards against a low-band
  // read firing with too little headroom and overshooting into his protected study/live reserve.
  const minHeadroom = Math.max((cfg.deep && cfg.deep.min_headroom_tokens) || 50000, mtf.min_headroom_tokens);
  const deepCfg = { ...cfg, deep: { ...cfg.deep, max_thinking_tokens: mtf.max_thinking_tokens, min_headroom_tokens: minHeadroom } };
  const call = deps.call || ((prompt) => claudeDeepAsync(prompt, deepCfg));
  if (hr.allowed < deepCfg.deep.min_headroom_tokens) {
    log(`cortex: window too low (${hr.allowed} < ${deepCfg.deep.min_headroom_tokens}) — declining, not draining`);
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
  const r = await call(prompt);
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

// the legacy single-slot contract, byte-compatible (layering — never replace)
async function serveWake(deps = {}) {
  const wake = (deps.readWake || (() => readJson(WAKE)))();
  return serveOne(wake, deps);
}

// M14 — THE OVERLAP: drain the queue, up to deep.concurrency wakes AT ONCE.
// Queue empty → the single-slot wake.json fallback (a pre-queue thalamus
// still gets served). Stale wakes are DECLINED as expired-in-queue.
async function serveWakes(deps = {}) {
  const cfg = deps.cfg || loadThalamusConfig();
  const now = deps.now || new Date();
  const post = deps.post || defaultPost;
  const rows = deps.readQueue ? deps.readQueue() : readLines(WQUEUE);
  let pending = pendingWakes(rows);
  if (!pending.length) {
    const wake = (deps.readWake || (() => readJson(WAKE)))();
    if (wake && wake.moment_id && !wake.consumed && wake.status === "pending") pending = [wake];
  }
  if (!pending.length) return { served: 0, idle: true };
  const ttlMs = ((cfg.deep && cfg.deep.queue_ttl_min) || 30) * 60000;
  const live = [];
  let expired = 0;
  for (const w of pending) {
    if (w.ts && now - new Date(w.ts) > ttlMs) {
      expired++;
      await post("/deep-answer", { moment_id: w.moment_id, declined: true, reason: "expired-in-queue", provenance: "cortex" });
    } else live.push(w);
  }
  if (!live.length) return { served: 0, expired, idle: true };
  const k = Math.max(1, (cfg.deep && cfg.deep.concurrency) || 2);
  const batch = live.slice(0, k);
  // ONE shared runtime object across the batch — concurrent saves merge instead
  // of last-write-wins clobbering the poison-guard's attempt counts
  const runtime = deps.runtime !== undefined ? deps.runtime : (readJson(RUNTIME) || { attempts: {} });
  const results = await Promise.all(batch.map(w => serveOne(w, { ...deps, cfg, now, post, runtime })));
  return { served: results.filter(r => r.served).length, results, expired, queued: live.length - batch.length };
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

  // M14 — THE OVERLAP: the queue serves TWO at once; expiry declines; legacy floor
  {
    const mkWake = (id, ts) => ({ moment_id: id, ts, status: "pending", spotlight: { modality: "voice", text: `doubt ${id}`, concept_tokens: [id], S: 0.7, comps: { self: 1 } }, bound_context: [] });
    const nowT = new Date("2026-07-15T03:00:00Z");
    const qRows = [
      mkWake("m_a", "2026-07-15T02:58:00Z"),
      mkWake("m_b", "2026-07-15T02:59:00Z"),
    ];
    let inflight = 0, peak = 0;
    const out = { posts: [], rows: [] };
    const slowCall = async () => {
      inflight++; peak = Math.max(peak, inflight);
      await new Promise(res => setTimeout(res, 25));
      inflight--;
      return { ok: true, text: "parallel deep read", input_tokens: 10, output_tokens: 10, total_tokens: 20, duration_ms: 25, limit_hit: false, error: null };
    };
    const mk = (rows) => ({
      cfg: loadThalamusConfig(), brainCfg, env: {}, now: nowT, council: null, bus,
      readQueue: () => rows, readWake: () => null,
      post: async (p, b) => { out.posts.push({ p, b }); return { ok: true }; },
      appendLedger: (r) => out.rows.push(r), runtime: { attempts: {} }, saveRuntime: () => {},
      headroom: { allowed: 300000, used: 0, cap: 800000, phase: "overnight" },
      call: slowCall,
    });
    const r = await serveWakes(mk(qRows));
    assert("TWO queued wakes are served CONCURRENTLY (the overlap is real)", r.served === 2 && peak === 2 && out.posts.length === 2);
    assert("each spend rides the shared brain ledger (two rows, both opus)", out.rows.length === 2 && out.rows.every(x => x.engine === "claude"));
    // three queued, concurrency 2 → one waits its turn (never dropped)
    out.posts.length = 0; out.rows.length = 0; peak = 0;
    const r3 = await serveWakes(mk([mkWake("m_1", "2026-07-15T02:58:00Z"), mkWake("m_2", "2026-07-15T02:58:30Z"), mkWake("m_3", "2026-07-15T02:59:00Z")]));
    assert("THREE queued, two lanes → 2 served now, 1 stays queued (never clobbered)", r3.served === 2 && r3.queued === 1 && peak === 2);
    // a stale wake is declined, never dangles
    out.posts.length = 0;
    const rOld = await serveWakes(mk([mkWake("m_old", "2026-07-15T01:00:00Z")]));
    assert("a wake stuck past the TTL is DECLINED as expired-in-queue", rOld.expired === 1 && out.posts[0].b.reason === "expired-in-queue");
    // a served resolution row closes the wake — the reducer sees it
    const closed = pendingWakes([...qRows, { moment_id: "m_a", status: "served", at: "x" }]);
    assert("the event-sourced reducer: a served row closes ONLY its wake", closed.length === 1 && closed[0].moment_id === "m_b");
    // legacy floor: no queue → the single-slot wake.json still serves
    out.posts.length = 0;
    const rLeg = await serveWakes({ ...mk([]), readWake: () => mkWake("m_legacy", "2026-07-15T02:59:30Z") });
    assert("LAYERING: queue empty → the pre-M14 single-slot contract still serves", rLeg.served === 1 && out.posts[0].b.moment_id === "m_legacy");
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
    const r = await serveWakes({ log: console.log });
    console.log(`cortex: ${r.served ? `served ${r.served} wake(s)${r.queued ? `, ${r.queued} still queued` : ""}` : r.idle ? "no pending wake" : (r.results || []).some(x => x.refused) ? "refused (API key)" : JSON.stringify(r)}`);
    return;
  }
  // SINGLETON LOCK — two cortexes racing one wake = double Opus spend. The
  // lock is a localhost port (4112, one below the thalamus), same pattern as
  // every daemon in the club: second instance stands down silently.
  const { createServer } = await import("node:http");
  const lock = createServer(() => {});
  await new Promise((resolve) => {
    lock.on("error", (e) => { if (e.code === "EADDRINUSE") { console.log("cortex: another cortex holds the lock (:4112) — standing down."); process.exit(0); } throw e; });
    lock.listen(4112, "127.0.0.1", resolve);
  });
  console.log("cortex: deep-brain daemon — watching wake_queue.jsonl (fs.watch + 5s poll, up to 2 concurrent lanes)");
  // M14 — PER-LANE dispatch: a wake arriving while another is being served
  // starts IMMEDIATELY in a free lane (a batch-wide busy flag would serialize
  // bursts). One shared runtime object so concurrent attempt-saves merge.
  const cfgT = loadThalamusConfig();
  const K = Math.max(1, (cfgT.deep && cfgT.deep.concurrency) || 2);
  const ttlMs = ((cfgT.deep && cfgT.deep.queue_ttl_min) || 30) * 60000;
  const inflight = new Set();
  const runtime = readJson(RUNTIME) || { attempts: {} };
  const fire = () => {
    try {
      let pending = pendingWakes(readLines(WQUEUE));
      if (!pending.length) {
        const w = readJson(WAKE);
        if (w && w.status === "pending" && w.moment_id && !w.consumed) pending = [w];
      }
      const now = new Date();
      for (const w of pending) {
        if (inflight.has(w.moment_id)) continue;
        if (inflight.size >= K) break;
        inflight.add(w.moment_id);
        if (w.ts && now - new Date(w.ts) > ttlMs) {
          defaultPost("/deep-answer", { moment_id: w.moment_id, declined: true, reason: "expired-in-queue", provenance: "cortex" })
            .catch(() => {}).finally(() => inflight.delete(w.moment_id));
          continue;
        }
        console.log(`cortex: lane open for ${w.moment_id} (${inflight.size}/${K})`);
        serveOne(w, { log: console.log, runtime })
          .catch(e => console.log("cortex: " + String(e.message).slice(0, 120)))
          .finally(() => { inflight.delete(w.moment_id); fire(); });
      }
    } catch (e) { console.log("cortex: " + String(e.message).slice(0, 120)); }
  };
  let deb = null;
  try { watch(STATE_DIR, (ev, f) => { if (f === "wake_queue.jsonl" || f === "wake.json") { clearTimeout(deb); deb = setTimeout(fire, 400); } }); } catch { }
  setInterval(fire, 5000);
  fire();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { serveWake, serveWakes, serveOne, buildDeepPrompt, claudeDeep, claudeDeepAsync, findCapsule };
