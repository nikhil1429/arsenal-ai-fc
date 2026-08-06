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
// the paid-answer lifeboat: answers that could not be reported back (thalamus
// down / restarting) wait here instead of evaporating. Drained on the next serve.
const UNSENT    = join(STATE_DIR, "cortex_unsent.jsonl");
const BLEDGER   = join(STATE_DIR, "brain_ledger.jsonl");
const THALAMUS  = "http://127.0.0.1:4113";
const LIMIT_RE  = /limit|overloaded|rate.?limit|resets \d/i;
// E2E audit 25 Jul 2026: this used to be an unguarded fetch. If the thalamus was
// down or slow, the POST threw, the exception escaped serveOne, and the Opus
// answer the captain had ALREADY PAID FOR was discarded — the wake stayed pending
// and the same expensive question was bought again on the next attempt, until it
// finally died as "gave-up". An answer that cost money must never be lost to a
// transport hiccup: report failures now come back as a value, and the caller
// SPOOLS the text to disk (see UNSENT) so it can be delivered later.
const defaultPost = async (path, body) => {
  try {
    const r = await fetch(THALAMUS + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) return { ok: false, error: `thalamus ${r.status}` };
    try { return { ok: true, ...(await r.json()) }; } catch { return { ok: true }; }
  } catch (e) { return { ok: false, error: String((e && e.message) || e).slice(0, 160) }; }
};

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => { const o = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch {} } } catch {} return o; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
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
      env: { ...process.env, MAX_THINKING_TOKENS: String(cfg.deep.max_thinking_tokens), ARSENAL_ORGAN: "1" },   // extended thinking
    });
    const j = JSON.parse(raw);
    const text = String(j.result || "");
    const inTok = (j.usage && j.usage.input_tokens) || 0, outTok = (j.usage && j.usage.output_tokens) || 0;
    // E2E audit 25 Jul 2026: limit_hit was hardcoded `false` on every response the
    // CLI managed to serialise — but a Max plan-limit is NOT a thrown exception: the
    // CLI exits 0 with {is_error:true, result:"You've hit your session limit · resets
    // 7am"}. So the single most common failure of the whole $100 law was ledgered as
    // an ordinary error, the window never learned it was locked, and the wake burned
    // both its attempts inside the lockout. brain.mjs:507 has always read the
    // envelope (`isErr && LIMIT_RE.test(text)`); the cortex now reads it the same way.
    return { ok: j.is_error !== true && !!text, text, input_tokens: inTok, output_tokens: outTok, total_tokens: inTok + outTok || Math.ceil((prompt.length + text.length) / 4), duration_ms: Date.now() - t0, limit_hit: j.is_error === true && LIMIT_RE.test(text), error: j.is_error ? String(j.result).slice(0, 200) : null };
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
        env: { ...process.env, MAX_THINKING_TOKENS: String(cfg.deep.max_thinking_tokens), ARSENAL_ORGAN: "1" },   // extended thinking
      }, (err, stdout) => {
        if (err && !stdout) return fail(String((err && err.message) || err));
        try {
          const j = JSON.parse(stdout);
          const text = String(j.result || "");
          const inTok = (j.usage && j.usage.input_tokens) || 0, outTok = (j.usage && j.usage.output_tokens) || 0;
          // E2E audit 25 Jul 2026: same envelope blindness as claudeDeep above — the
          // async lane is the one the daemon actually uses, so THIS is where a plan
          // limit was being ledgered as limit_hit:false and killing queued wakes.
          resolve({ ok: j.is_error !== true && !!text, text, input_tokens: inTok, output_tokens: outTok, total_tokens: inTok + outTok || Math.ceil((prompt.length + text.length) / 4), duration_ms: Date.now() - t0, limit_hit: j.is_error === true && LIMIT_RE.test(text), error: j.is_error ? String(j.result).slice(0, 200) : null });
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
// E2E audit 25 Jul 2026 — THE CONCURRENT-LANE OVERSHOOT. Every lane computed its
// headroom gate from the LEDGER, and the ledger only learns about a deep read
// AFTER it returns. With deep.concurrency lanes opening back-to-back (serveWakes'
// Promise.all, and the daemon's fire() loop), lane 2 read the same "allowed" that
// lane 1 had already committed to spend: two 48k-thinking reads could both clear a
// floor sized for ONE and land together inside his protected study reserve. This
// counter is the missing in-flight book: a lane reserves its estimated spend the
// instant it clears the gate and releases it when the call returns, so the next
// lane gates against what is REALLY left. Module-level on purpose — the daemon and
// serveWakes dispatch from different places into the same window.
let inflightReserve = 0;

// E2E audit 25 Jul 2026: the daemon's fire() re-entered itself from `.finally`, i.e.
// after EVERY lane outcome. When a serve did not actually close the wake (deep call
// failed, answer spooled because the thalamus was down, API-key refusal) the wake was
// still pending, so the immediate re-entry re-dispatched the same moment with zero
// delay — a tight loop that burned the 2-attempt cap, and real Opus tokens, in
// milliseconds. Re-enter ONLY when the thalamus has ACKNOWLEDGED a close (served /
// gave-up / declined, and the report-back itself got through): that is the only state
// in which the wake is guaranteed gone from the next queue read. Everything else waits
// for the 5s poll, which is the natural backoff.
const laneResolved = (r) => !!(r && (r.served || r.gave_up || r.declined) && r.reported !== false);

// E2E audit 25 Jul 2026: cortex_runtime.json's attempts map was append-only — no code
// path ever deleted a key, not on success, not on give-up, not on decline. Every
// moment_id ever woken lived there forever, and every single serve paid a full-file
// parse + rewrite of an ever-growing JSON. A moment that is no longer pending can
// never be served again, so its bookkeeping is dead weight: prune to the live queue.
// The unsent flags are pruned FIRST so a still-undelivered paid answer keeps its
// attempt row (it is the one thing that must survive a closed-looking queue).
function pruneRuntime(runtime, liveIds = []) {
  const live = new Set(liveIds);
  let removed = 0;
  if (runtime.unsent) for (const k of Object.keys(runtime.unsent)) if (!live.has(k)) { delete runtime.unsent[k]; removed++; }
  if (runtime.attempts) for (const k of Object.keys(runtime.attempts)) {
    if (!live.has(k) && !(runtime.unsent && runtime.unsent[k])) { delete runtime.attempts[k]; removed++; }
  }
  return removed;
}

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

  // E2E audit 25 Jul 2026 — THE RE-BUY. The lifeboat below spools an answer whose
  // report-back failed, but ONLY the thalamus can close a queue row: with the
  // thalamus still down the wake is STILL pending, and the very next pass walked
  // straight back into a fresh Opus read of the same question — paying twice for one
  // thought, which is exactly what the lifeboat exists to prevent. A moment whose
  // answer is already bought and waiting on the wire is RE-DELIVERED (free), never
  // re-thought. This sits ahead of the attempts cap on purpose: a paid answer must
  // reach him even if the wake has otherwise run out of attempts.
  runtime.unsent = runtime.unsent || {};
  if (runtime.unsent[wake.moment_id]) {
    const d = await drainUnsent({ ...deps, log });
    const stillHeld = (d.held_ids || []).includes(wake.moment_id);
    if (!stillHeld) { delete runtime.unsent[wake.moment_id]; saveRuntime(runtime); }
    log(`cortex: ${wake.moment_id} is ALREADY PAID FOR — ${stillHeld ? "thalamus still unreachable, holding the spooled answer" : "spooled answer delivered"} (no second Opus read)`);
    return { served: !stillHeld, redelivered: !stillHeld, reported: !stillHeld, moment_id: wake.moment_id };
  }

  // E2E audit 25 Jul 2026 — THE LOCKOUT HOLD. A plan-limit is the WINDOW's state, not
  // this wake's fault, and it lasts until the window resets. Without a hold the daemon
  // re-fired `claude -p` every 5s inside the lockout and each wake spent both its
  // attempts within seconds, so a 03:00 session limit permanently killed every queued
  // doubt as "gave-up-after-2-attempts" for reads that were never actually attempted.
  if (runtime.limit_hold_until && now < new Date(runtime.limit_hold_until)) {
    log(`cortex: plan-limit hold until ${runtime.limit_hold_until} — ${wake.moment_id} waits (no call, no attempt burned)`);
    return { served: false, limit_held: true };
  }

  // attempts cap — a poisoned wake never loops the window dry
  runtime.attempts = runtime.attempts || {};
  const tries = runtime.attempts[wake.moment_id] || 0;
  if (tries >= 2) {
    // E2E audit 25 Jul 2026: the report-back result is now carried out as `reported`
    // so the daemon only re-enters its dispatch loop on a close the thalamus actually
    // ACKNOWLEDGED — an unacknowledged decline leaves the wake pending, and re-firing
    // on it is the busy-loop (see laneResolved).
    const s = await post("/deep-answer", { moment_id: wake.moment_id, declined: true, reason: "gave-up-after-2-attempts", provenance: "cortex" });
    return { served: false, gave_up: true, reported: !(s && s.ok === false) };
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
  // E2E audit 25 Jul 2026: gate against what is left AFTER the lanes already in flight
  // (see inflightReserve above) — the ledger cannot see a read that has not returned yet.
  const est = Math.max(0, (cfg.deep && cfg.deep.est_tokens_per_wake) || 40000);
  const freeNow = hr.allowed - inflightReserve;
  if (freeNow < deepCfg.deep.min_headroom_tokens) {
    log(`cortex: window too low (${freeNow}${inflightReserve ? ` = ${hr.allowed} - ${inflightReserve} in flight` : ""} < ${deepCfg.deep.min_headroom_tokens}) — declining, not draining`);
    const s = await post("/deep-answer", { moment_id: wake.moment_id, declined: true, reason: "no-headroom", provenance: "cortex" });
    return { served: false, declined: "no-headroom", reported: !(s && s.ok === false) };
  }

  // M8 — THE COUNCIL sits first (three free adversarial drafts), then ONE
  // Opus integration adjudicates. Council dry/failed → the old cold path.
  let council = null, r;
  inflightReserve += est;                       // the lane is committed from here
  try {
    if (deps.council !== undefined) council = deps.council;
    else if (cfg.council !== false) {
      try { council = await convene(String((wake.spotlight || {}).text || (wake.spotlight || {}).event_key || ""), {}); } catch { council = null; }
    }
    const prompt = buildDeepPrompt(wake, deps.bus || {}, councilSection(council));
    r = await call(prompt);
  } finally { inflightReserve = Math.max(0, inflightReserve - est); }
  ledger({ ts: new Date().toISOString(), job: "cortex_wake", engine: "claude", model: "opus", input_tokens: r.input_tokens, output_tokens: r.output_tokens, total_tokens: r.total_tokens, duration_ms: r.duration_ms, ok: r.ok, error: r.error, limit_hit: r.limit_hit });
  if (!r.ok) {
    if (r.limit_hit) {
      // E2E audit 25 Jul 2026: give the attempt BACK and hold the lane. A read that the
      // plan refused to even start must not count against the poison-guard's 2-attempt
      // cap — otherwise one locked window silently kills the whole night's queue. With
      // the attempt refunded the TTL (expired-in-queue), not the lockout, decides.
      runtime.attempts[wake.moment_id] = tries;
      const holdMin = (cfg.deep && cfg.deep.limit_backoff_min) || 15;
      runtime.limit_hold_until = new Date(now.getTime() + holdMin * 60000).toISOString();
      saveRuntime(runtime);
      log(`cortex: PLAN LIMIT (${r.error}) — attempt refunded, lane held ${holdMin}min (until ${runtime.limit_hold_until})`);
      return { served: false, error: r.error, limit_hit: true };
    }
    log(`cortex: deep call failed (${r.error}) — wake stays pending (attempt ${tries + 1}/2)`);
    return { served: false, error: r.error };
  }

  // honest-frame validator — a law-breaking answer is DECLINED, never softened
  const banned = bannedPhraseCheck(r.text, (brainCfg.guards && brainCfg.guards.banned_phrases) || []);
  if (banned.length) {
    const s = await post("/deep-answer", { moment_id: wake.moment_id, declined: true, reason: `banned-phrase:${banned.join(",")}`, provenance: "cortex" });
    return { served: false, declined: "banned-phrase", reported: !(s && s.ok === false) };
  }
  const payload = { moment_id: wake.moment_id, text: r.text, provenance: "opus-extended", tokens: r.total_tokens };
  const sent = await post("/deep-answer", payload);
  if (sent && sent.ok === false) {
    // the answer is BOUGHT AND GOOD — the wire failed, not the thought. Spool it.
    try { (deps.spool || spoolUnsent)(payload); } catch { }
    // E2E audit 25 Jul 2026: remember, in the runtime, that this moment is ALREADY PAID
    // FOR. The wake stays pending (only the thalamus closes rows), so without this flag
    // the next pass re-read the same question on Opus — the spool saved the text but not
    // the money. The re-buy guard at the top of serveOne reads exactly this.
    runtime.unsent[wake.moment_id] = (now instanceof Date ? now : new Date()).toISOString();
    saveRuntime(runtime);
    log(`cortex: deep answer for ${wake.moment_id} could NOT be reported (${sent.error}) — SPOOLED to cortex_unsent.jsonl, will deliver on the next pass (never re-bought)`);
    return { served: false, spooled: true, moment_id: wake.moment_id, error: sent.error };
  }
  log(`cortex: deep answer served for ${wake.moment_id} (${r.total_tokens} tok, ${Math.round(r.duration_ms / 1000)}s)`);
  return { served: true, moment_id: wake.moment_id, tokens: r.total_tokens, reported: true };
}

// ── THE PAID-ANSWER LIFEBOAT (E2E audit 25 Jul 2026) ────────────────────────
// A deep answer costs real Opus tokens. If the report-back POST fails, the text
// is spooled here and re-delivered on the next serve pass, so a thalamus restart
// costs a few seconds of latency instead of the answer plus a second purchase.
function spoolUnsent(payload) {
  mkdirSync(dirname(UNSENT), { recursive: true });
  appendFileSync(UNSENT, JSON.stringify({ ...payload, spooled_at: new Date().toISOString() }) + "\n");
}
async function drainUnsent(deps = {}) {
  const post = deps.post || defaultPost;
  const rows = deps.readUnsent ? deps.readUnsent() : readLines(UNSENT);
  // E2E audit 25 Jul 2026: held_ids added so serveOne's re-buy guard can tell whether
  // THIS moment's paid answer got through, rather than guessing from a global count.
  if (!rows.length) return { delivered: 0, still_held: 0, held_ids: [] };
  const held = [];
  let delivered = 0;
  for (const row of rows) {
    const { spooled_at, ...payload } = row;
    const r = await post("/deep-answer", payload);
    if (r && r.ok === false) held.push(row); else delivered++;
  }
  const write = deps.writeUnsent || ((lines) => { if (lines.length) writeFileSync(UNSENT, lines.map(l => JSON.stringify(l)).join("\n") + "\n"); else if (existsSync(UNSENT)) writeFileSync(UNSENT, ""); });
  write(held);
  // E2E audit 25 Jul 2026: this said `(deps.log || log)` — there is no module-level
  // `log`, so the ONE line that fires on a successful recovery threw a ReferenceError.
  // serveWakes swallows it in its try/catch, but the daemon's re-buy guard now calls
  // drainUnsent on every held moment, so the throw would have masked the recovery.
  if (delivered) (deps.log || (() => {}))(`cortex: delivered ${delivered} spooled deep answer(s) that would otherwise have been lost`);
  return { delivered, still_held: held.length, held_ids: held.map(h => h && h.moment_id).filter(Boolean) };
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
  // deliver anything a previous pass paid for but could not hand over
  if (deps.drain !== false) { try { await drainUnsent(deps); } catch { } }
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
  // E2E audit 25 Jul 2026: prune the dead bookkeeping BEFORE the batch writes it back,
  // so cortex_runtime.json stays the size of the live queue instead of the size of his
  // whole history (see pruneRuntime). Pending — not `live` — is the survival set: a
  // wake awaiting its expiry decline still owns its attempt row.
  if (pruneRuntime(runtime, pending.map(w => w.moment_id))) (deps.saveRuntime || ((o) => writeAtomic(RUNTIME, o)))(runtime);
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
  // E2E audit 25 Jul 2026: the suite used to build its cfg with loadThalamusConfig(),
  // i.e. it read the LIVE, approval-gated dressing-room/state/thalamus_config.json —
  // and several checks silently depended on its values (the overlap check needs
  // deep.concurrency === 2, the expiry check needs queue_ttl_min < 120). Halving
  // concurrency to calm the window — a documented, supported knob — turned the suite
  // red for a regression that did not exist. Every other dep here is injected; the
  // config is a frozen fixture now too, mirroring thalamus.mjs's DEFAULT_CONFIG.deep.
  const CFG_FIX = Object.freeze({
    council: false,   // the live council never convenes inside a selftest
    deep: Object.freeze({ deadline_ms: 45000, min_headroom_tokens: 50000, max_thinking_tokens: 16000, timeout_ms: 300000, concurrency: 2, est_tokens_per_wake: 40000, queue_ttl_min: 30, limit_backoff_min: 15 }),
  });
  const mkDeps = (over = {}) => {
    const out = { posts: [], rows: [], runtime: { attempts: {} }, saved: [] };
    return {
      out,
      deps: {
        cfg: CFG_FIX, brainCfg, env: {}, readWake: () => wake, bus,
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
    // E2E audit 25 Jul 2026 — THE LOCKOUT. A plan limit used to be charged to the WAKE:
    // the attempt stayed spent, so two failures inside one locked window killed the
    // doubt as "gave-up-after-2-attempts" for reads Opus never even started.
    const refund = out.saved[1] || {};
    assert("PLAN LIMIT: the burnt attempt is given BACK (a locked window must not kill the wake)", out.saved.length === 2 && out.saved[0].attempts.m_1 === 1 && (refund.attempts || {}).m_1 === 0);
    assert("PLAN LIMIT: the lane is HELD until the window can pay again (no 5s hammering)", typeof refund.limit_hold_until === "string" && new Date(refund.limit_hold_until) > new Date());
  }
  // ...and while that hold stands, a wake waits instead of spending
  {
    let called = 0;
    const { deps, out } = mkDeps({
      runtime: { attempts: {}, limit_hold_until: new Date(Date.now() + 60000).toISOString() },
      call: () => { called++; return { ok: true, text: "should never be bought during a lockout", input_tokens: 1, output_tokens: 1, total_tokens: 2, duration_ms: 1, limit_hit: false, error: null }; },
    });
    const r = await serveWake(deps);
    assert("PLAN LIMIT: while the hold stands the wake waits — zero Opus calls, zero ledger rows, zero posts", r.limit_held === true && called === 0 && out.rows.length === 0 && out.posts.length === 0);
  }
  // the CLI's plan-limit envelope: exit 0, is_error:true, limit text in `result`
  {
    const tinyCfg = { deep: { timeout_ms: 1000, max_thinking_tokens: 1000 } };
    const limitJson = JSON.stringify({ is_error: true, result: "You've hit your session limit · resets 7am" });
    const rl = claudeDeep("p", tinyCfg, { exec: () => limitJson });
    assert("ENVELOPE: a plan limit reported as exit-0 JSON is read as limit_hit (sync lane)", rl.ok === false && rl.limit_hit === true);
    const rh = claudeDeep("p", tinyCfg, { exec: () => JSON.stringify({ result: "a real deep read", usage: { input_tokens: 5, output_tokens: 5 } }) });
    assert("ENVELOPE: a healthy answer is never mislabelled a limit", rh.ok === true && rh.limit_hit === false);
    const ra = await claudeDeepAsync("p", tinyCfg, { execAsync: (_f, _a, _o, cb) => { cb(null, JSON.stringify({ is_error: true, result: "5-hour limit reached · resets 3am" })); return null; } });
    assert("ENVELOPE: the ASYNC lane (the one the daemon uses) reads it too", ra.ok === false && ra.limit_hit === true);
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

  // THE PAID-ANSWER LIFEBOAT (E2E audit 25 Jul 2026) — a report-back failure must
  // never destroy an answer the captain already paid Opus for. Before the fix the
  // unguarded fetch THREW here: the text was dropped, the wake stayed pending, and
  // the same question was bought a second time.
  {
    const spooled = [];
    const { deps } = mkDeps({});
    deps.call = () => ({ ok: true, text: "the expensive read", input_tokens: 10, output_tokens: 90, total_tokens: 100, duration_ms: 5, limit_hit: false, error: null });
    deps.post = async () => ({ ok: false, error: "connect ECONNREFUSED 127.0.0.1:4113" });
    deps.spool = (p) => spooled.push(p);
    const out = await serveWake(deps);
    assert("THALAMUS DOWN: serving does not throw and reports honestly", out && out.served === false && out.spooled === true);
    assert("THALAMUS DOWN: the paid answer is SPOOLED verbatim, never lost", spooled.length === 1 && spooled[0].text === "the expensive read" && spooled[0].tokens === 100);
    // and it is delivered on the next pass, without re-buying it
    const held = spooled.map(p => ({ ...p, spooled_at: "2026-07-25T00:00:00.000Z" }));
    const sent = []; let written = null;
    const drained = await drainUnsent({
      post: async (path, body) => { sent.push(body); return { ok: true }; },
      readUnsent: () => held, writeUnsent: (l) => { written = l; }, log: () => {},
    });
    assert("RECOVERY: the spooled answer is delivered on the next pass", drained.delivered === 1 && sent.length === 1 && sent[0].text === "the expensive read");
    assert("RECOVERY: the spool is emptied once delivered (never replayed forever)", Array.isArray(written) && written.length === 0);
    // E2E audit 25 Jul 2026 — THE RE-BUY. The spool saved the TEXT but not the MONEY:
    // only the thalamus can close a queue row, so the wake was still pending and the
    // very next pass walked back into a fresh Opus read of the same doubt.
    let bought = 0;
    deps.call = () => { bought++; return { ok: true, text: "a SECOND paid read of the same doubt", input_tokens: 10, output_tokens: 90, total_tokens: 100, duration_ms: 5, limit_hit: false, error: null }; };
    const redeliver = [];
    deps.post = async (p, b) => { redeliver.push(b); return { ok: true }; };
    deps.readUnsent = () => spooled.map(p => ({ ...p, spooled_at: "2026-07-25T00:00:00.000Z" }));
    deps.writeUnsent = () => {};
    const second = await serveWake(deps);
    assert("NO RE-BUY: the still-pending wake is re-DELIVERED from the spool, Opus is never called twice", second.redelivered === true && bought === 0 && redeliver.length === 1 && redeliver[0].text === "the expensive read");
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
      cfg: CFG_FIX, brainCfg, env: {}, now: nowT, council: null, bus,
      readQueue: () => rows, readWake: () => null,
      post: async (p, b) => { out.posts.push({ p, b }); return { ok: true }; },
      appendLedger: (r) => out.rows.push(r), runtime: { attempts: {} }, saveRuntime: () => {},
      headroom: { allowed: 300000, used: 0, cap: 800000, phase: "overnight" },
      call: slowCall,
    });
    const K = CFG_FIX.deep.concurrency;   // derived, not hardcoded — the fixture IS the contract
    const r = await serveWakes(mk(qRows));
    assert("TWO queued wakes are served CONCURRENTLY (the overlap is real)", r.served === K && peak === K && out.posts.length === K);
    assert("each spend rides the shared brain ledger (two rows, both opus)", out.rows.length === K && out.rows.every(x => x.engine === "claude"));
    // three queued, concurrency 2 → one waits its turn (never dropped)
    out.posts.length = 0; out.rows.length = 0; peak = 0;
    const r3 = await serveWakes(mk([mkWake("m_1", "2026-07-15T02:58:00Z"), mkWake("m_2", "2026-07-15T02:58:30Z"), mkWake("m_3", "2026-07-15T02:59:00Z")]));
    assert("THREE queued, two lanes → 2 served now, 1 stays queued (never clobbered)", r3.served === K && r3.queued === 3 - K && peak === K);
    // E2E audit 25 Jul 2026 — THE CONCURRENT-LANE OVERSHOOT. allowed=100k, overnight →
    // the floor for ONE 48k-thinking read is 76.8k. Both lanes used to read the SAME
    // 100k (the ledger cannot see a call that has not returned), both cleared the floor,
    // and their JOINT spend landed inside the reserve the floor exists to protect.
    // Lane 2 must now gate against 100k MINUS lane 1's in-flight estimate.
    out.posts.length = 0; out.rows.length = 0; peak = 0;
    const rTight = await serveWakes({ ...mk([mkWake("m_t1", "2026-07-15T02:58:00Z"), mkWake("m_t2", "2026-07-15T02:58:30Z")]), headroom: { allowed: 100000, used: 700000, cap: 800000, phase: "overnight" } });
    assert("TIGHT WINDOW: lane 2 gates against lane 1's IN-FLIGHT spend — one read fires, one is declined", rTight.served === 1 && out.rows.length === 1 && out.posts.filter(p => p.b.reason === "no-headroom").length === 1);
    assert("TIGHT WINDOW: the reserve is released again (a lane never leaks headroom)", inflightReserve === 0);
    // E2E audit 25 Jul 2026 — the attempts map was append-only and grew forever.
    out.posts.length = 0; out.rows.length = 0;
    const savedR = [];
    const rP = await serveWakes({
      ...mk([mkWake("m_live", "2026-07-15T02:59:00Z")]),
      runtime: { attempts: { m_live: 0, m_dead_1: 1, m_dead_2: 2 }, unsent: { m_gone: "2026-07-01T00:00:00.000Z" } },
      saveRuntime: (o) => savedR.push(JSON.parse(JSON.stringify(o))),
    });
    const lastSave = savedR[savedR.length - 1];
    assert("PRUNE: bookkeeping for wakes that are no longer pending is dropped (the runtime can't grow forever)", rP.served === 1 && lastSave && !("m_dead_1" in lastSave.attempts) && !("m_dead_2" in lastSave.attempts) && lastSave.attempts.m_live === 1 && !(lastSave.unsent && lastSave.unsent.m_gone));
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
    // E2E audit 25 Jul 2026 — THE BUSY-LOOP. The daemon's fire() re-entered itself from
    // `.finally`, i.e. after every outcome. Only the thalamus closes a queue row, so an
    // outcome that did NOT get an acknowledged close left the moment pending and the
    // instant re-entry re-dispatched the SAME wake with zero delay. laneResolved is the
    // predicate that gate now uses (fire() itself lives in main() and cannot be tested
    // without opening the :4112 lock, so the contract is asserted here).
    assert("DAEMON LANE: only an ACKNOWLEDGED close re-opens the dispatcher (no busy-loop)",
      laneResolved({ served: true, reported: true }) === true && laneResolved({ gave_up: true, reported: true }) === true && laneResolved({ declined: "no-headroom", reported: true }) === true
      && laneResolved({ served: false, spooled: true }) === false && laneResolved({ served: false, error: "boom" }) === false
      && laneResolved({ limit_held: true }) === false && laneResolved({ refused: true }) === false
      && laneResolved({ declined: "no-headroom", reported: false }) === false && laneResolved(null) === false);
  }

  // the prompt itself
  {
    const p = buildDeepPrompt(wake, bus);
    assert("prompt carries the bound moment (spotlight + context)", p.includes("attention scaling") && p.includes("bound_context"));
    assert("prompt carries the bus slice, and the no-invented-numbers law", p.includes("calibration_gap") && p.includes("never a number that is not in the data"));
    assert("prompt carries the honest-frame law + speakable contract", p.includes('never "10x"') && p.includes("250 words"));
    assert("prompt itself breaks no banned-phrase law", bannedPhraseCheck(p.replace(/never "10x", "exponential", "on steroids"/, ""), ["on steroids"]).length === 0);
  }

  // OVERNIGHT DEEPENING (P5) — the concept graph, deps-injected (no live Opus)
  {
    const concepts = ["embeddings", "vector-search", "attention", "hallucinations"];
    const lstate = { concepts: [{ id: "embeddings", fluency: "🟢 fluent" }, { id: "attention", fluency: "🔴 learning" }] };
    const goodGraph = JSON.stringify({ nodes: [{ id: "embeddings", fluency: "fluent" }, { id: "attention", fluency: "expert" }, { id: "attention", fluency: "learning" }, { id: "not-a-real-concept", fluency: "fluent" }], edges: [{ from: "embeddings", to: "vector-search", kind: "prereq" }, { from: "attention", to: "ghost", kind: "related" }], clusters: [{ name: "rag", concepts: ["embeddings", "ghost-concept"] }, { name: "all-ghost", concepts: ["nope"] }], next_unlocks: ["vector-search", "ghost"] });
    const okHr = { allowed: 400000, phase: "overnight" };
    const base = { concepts, lstate, headroom: okHr, now: new Date("2026-07-18T03:00:00Z"), env: {}, brainCfg: { guards: {} }, cfg: { deep: { min_headroom_tokens: 50000 } } };
    let wrote = null, metered = [];
    const r = await runConsolidation({ ...base, appendLedger: (o) => metered.push(o), write: (o) => { wrote = o; }, call: async () => ({ ok: true, text: goodGraph, total_tokens: 12000, input_tokens: 8000, output_tokens: 4000, duration_ms: 30000 }) });
    assert("CONSOLIDATE — writes a concept graph, metered as cortex_consolidate", r.ok && wrote && metered.length === 1 && metered[0].job === "cortex_consolidate");
    assert("CONSOLIDATE — grounds it: nodes/edges/unlocks NOT in the concept set are dropped (no ghosts)", wrote && wrote.nodes.length === 2 && wrote.edges.length === 1 && wrote.next_unlocks.length === 1 && wrote.next_unlocks[0] === "vector-search");
    assert("CONSOLIDATE — clusters grounded (ghost concepts dropped, all-ghost cluster removed) + nodes deduped + fluency clamped to enum", wrote.clusters.length === 1 && wrote.clusters[0].concepts.length === 1 && wrote.clusters[0].concepts[0] === "embeddings" && wrote.node_count === 2 && wrote.nodes.find(n => n.id === "attention").fluency === "unknown");
    const skip = await runConsolidation({ ...base, headroom: { allowed: 10000, phase: "study" }, call: async () => { throw new Error("must not call with no headroom"); }, write: () => { throw new Error("no write"); }, appendLedger: () => {} });
    assert("CONSOLIDATE — no headroom → skip, no Opus call, no write (never overshoots the meter)", skip.ok === false && /headroom/.test(skip.skipped));
    let m2 = [];
    const bad = await runConsolidation({ ...base, appendLedger: (o) => m2.push(o), write: () => { throw new Error("no write on malformed"); }, call: async () => ({ ok: true, text: "not json at all", total_tokens: 500 }) });
    assert("CONSOLIDATE — malformed graph → metered but NOT written (a bad graph never lands)", bad.ok === false && m2.length === 1);
    const realShape = gatherCorpus({ concepts: { version: 1, _comment: "x", axes: { a: "..." }, concepts: { tokenization: {}, embeddings: {} }, skills: { pydantic: {} } }, lstate: null });
    assert("CONSOLIDATE — reads the REAL concepts.json shape (concepts+skills objects), NOT its metadata keys", realShape.concepts.includes("tokenization") && realShape.concepts.includes("pydantic") && !realShape.concepts.includes("_comment") && !realShape.concepts.includes("axes"));

    // ── #71 · THE SILENT NO-OP ─────────────────────────────────────────────
    // Measured over the live ledger on 4 Aug 2026: 11 cortex_consolidate rows on
    // 8 distinct days for a DAILY job registered 18 Jul — 10 of 18 days left NO
    // trace at all, because every early return happened before the first append.
    // Task Scheduler read that as success, indefinitely. Each gate now bills a
    // row that says it did not run, and why.
    {
      const rowsOf = async (over) => { const m = []; const res = await runConsolidation({ ...base, appendLedger: (o) => m.push(o), write: () => { throw new Error("no write"); }, call: async () => { throw new Error("no call"); }, ...over }); return { m, res }; };
      const noHead = await rowsOf({ headroom: { allowed: 10000, phase: "study" } });
      assert("#71: a no-headroom skip LEAVES A ROW (it used to leave nothing at all)",
        noHead.m.length === 1 && noHead.m[0].job === "cortex_consolidate" && noHead.m[0].ran === false && noHead.m[0].ok === false && noHead.m[0].total_tokens === 0);
      assert("#71: the row NAMES the gate, as a have/need counter (#106)",
        /no-headroom \(10000\/\d+ needed/.test(noHead.m[0].skipped) && noHead.m[0].headroom_needed > 0);
      const thin = await rowsOf({ concepts: ["only", "two"] });
      assert("#71: a too-few-concepts skip leaves a row too (every gate, not just this one)",
        thin.m.length === 1 && thin.m[0].ran === false && thin.m[0].skipped.includes("2/3 needed"));
      const refused = await rowsOf({ brainCfg: { guards: { refuse_if_api_key_env: true } }, env: { ANTHROPIC_API_KEY: "sk-no" } });
      assert("#71: the API-key refusal is recorded too (the $100 law leaves a receipt)",
        refused.res.refused === true && refused.m.length === 1 && refused.m[0].ran === false);
      // a successful pass is marked ran:true so the two are never confused
      let mOK = [];
      const okRun = await runConsolidation({ ...base, appendLedger: (o) => mOK.push(o), write: () => {}, call: async () => ({ ok: true, text: goodGraph, total_tokens: 12000, input_tokens: 8000, output_tokens: 4000, duration_ms: 3 }) });
      assert("#71: a real pass is marked ran:true — a skip can never be read as a run", okRun.ok && mOK.length === 1 && mOK[0].ran === true && mOK[0].total_tokens === 12000);
      // and a ledger fault must not kill the pass (telemetry ≠ the work)
      const survive = await runConsolidation({ ...base, appendLedger: () => { throw new Error("EPERM: brain_ledger.jsonl busy"); }, write: () => {}, call: async () => ({ ok: true, text: goodGraph, total_tokens: 10, duration_ms: 1 }) });
      assert("#71: a ledger write fault never kills the consolidation (telemetry ≠ the work)", survive.ok === true);
      // THE EXIT-CODE STANDARD: the job is daily, so 'today' is its own contract
      const today = new Date("2026-07-18T03:00:00Z");
      assert("#71: freshness is measured against the job's OWN daily cadence, no invented threshold",
        graphFreshness(today, { graph: { generated_at: "2026-07-18T02:00:00Z" } }).fresh === true
        && graphFreshness(today, { graph: { generated_at: "2026-07-16T02:00:00Z" } }).age_days === 2
        && graphFreshness(today, { graph: { generated_at: "2026-07-16T02:00:00Z" } }).fresh === false
        && graphFreshness(today, { graph: null }).exists === false);
    }

    // ── #72 · THE READER'S CONTRACT ────────────────────────────────────────
    // setpiece.mjs is being wired as the first reader this file has ever had.
    // These assertions ARE the contract; break one and the reader breaks.
    {
      let g = null;
      await runConsolidation({ ...base, appendLedger: () => {}, write: (o) => { g = o; }, call: async () => ({ ok: true, text: goodGraph, total_tokens: 1, duration_ms: 1 }) });
      assert("#72: the written shape carries every field the reader is promised",
        g.schema_version === 1 && typeof g.generated_at === "string" && /^\d{4}-\d{2}-\d{2}$/.test(g.date)
        && g.node_count === g.nodes.length && g.edge_count === g.edges.length
        && Array.isArray(g.clusters) && Array.isArray(g.next_unlocks));
      assert("#72: next_unlocks are BARE STRINGS (a reader must not have to guess)",
        g.next_unlocks.every(x => typeof x === "string"));
      assert("#72: nodes/edges/clusters/next_unlocks are ALL grounded in the concept set",
        g.nodes.every(n => concepts.includes(n.id)) && g.edges.every(e => concepts.includes(e.from) && concepts.includes(e.to))
        && g.clusters.every(c => c.concepts.every(x => concepts.includes(x))) && g.next_unlocks.every(x => concepts.includes(x)));
      assert("#72/#106: the graph ships its own have/need counter — fluency measured for N of M",
        g.concepts_considered === 4 && g.fluency_known === 2);
    }
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// OVERNIGHT DEEPENING (P5) — THE CONCEPT GRAPH. A nightly consolidation routed
// through the ONE Opus path (cortex), NEVER grafted onto dmn.mjs (dmn stays the
// FREE Gemini dreamer — a second unmetered Opus path would breach Law 2). Reads
// his concept list + fluency, asks Opus to synthesise a prereq/relation graph,
// writes concept_graph.json. Gated on headroom + metered like every deep read.
// DESIGN NOTE: the architecture suggested a thalamus-enqueued 'consolidation'
// WAKE; this direct `cortex consolidate` mode is the SAME single Opus path with
// less surgery (no new afferent-recognition path, thalamus stays sole wake
// writer untouched), and a scheduled nightly batch fits a mode better than a
// reactive wake. Same law kept: one metered Opus path, dmn free.
// ---------------------------------------------------------------------------
const CONCEPTS      = join(STATE_DIR, "concepts.json");
const LSTATE        = join(STATE_DIR, "learning_state.json");
const CONCEPT_GRAPH = join(STATE_DIR, "concept_graph.json");

// ── #72 · THE concept_graph.json CONTRACT (organism audit, 4 Aug 2026) ───────
// This file had a writer and, for its whole life, ZERO readers. setpiece.mjs is
// now being wired as the reader, so the shape below is a CONTRACT, not an
// implementation detail. Nothing here may be renamed or reordered without
// updating the reader in the same change.
//
//   {
//     schema_version : 1                       // bump only on a breaking change
//     generated_at   : ISO-8601 string         // when THIS graph was synthesised
//     date           : "YYYY-MM-DD" (local)    // the day it belongs to
//     source         : "cortex-consolidate (opus)"
//     node_count     : int  (=== nodes.length)
//     edge_count     : int  (=== edges.length)
//     nodes          : [{ id: <concept id from concepts.json>,
//                         fluency: "learning"|"holding"|"fluent"|"unknown" }]
//     edges          : [{ from: <id>, to: <id>, kind: "prereq"|"related"|"confused-with" }]
//     clusters       : [{ name: <short theme>, concepts: [<id>, …] }]
//     next_unlocks   : [<id>, …]               // BARE STRINGS, not objects
//     concepts_considered : int                // the size of the grounding set
//     fluency_known  : int                     // how many of those have a MEASURED fluency
//   }
//
// GROUNDING GUARANTEE the reader may rely on: every id in nodes/edges/clusters/
// next_unlocks is a member of concepts.json's concept ∪ skill id set. Anything
// the model invented is dropped before the write. Arrays are always present
// (possibly empty) — a reader never has to null-check them.
//
// HONESTY the reader MUST carry through (#106): `fluency_known / concepts_considered`
// is a have/need counter. Live on 4 Aug 2026 it reads 2/38 — 36 nodes say
// "unknown" because learning_state.json has only ever seen two concepts. A
// surface that presents `next_unlocks` as a ready plan without showing that
// ratio is reporting a 2-datapoint inference as a 38-datapoint one.
const CONCEPT_GRAPH_SCHEMA = 1;

function buildConsolidationPrompt(concepts, fluency) {
  const cList = concepts.slice(0, 120).join(", ");
  const fLines = fluency.slice(0, 60).map(f => `${f.id}: ${f.fluency}`).join(" · ");
  return `You build a CONCEPT GRAPH for a personal AI-learning system — a map of how the learner's concepts connect, so his overnight brain can see the terrain. Use ONLY the concepts listed; invent no fluency he hasn't shown. Reply with STRICT JSON, no prose, no code fence:
{"nodes":[{"id":"<concept from the list>","fluency":"learning|holding|fluent|unknown"}],"edges":[{"from":"<concept>","to":"<concept>","kind":"prereq|related|confused-with"}],"clusters":[{"name":"<short theme>","concepts":["<concept>"]}],"next_unlocks":["<concept he is ready to learn next: its prereqs are fluent/holding>"]}
Every node id and every edge endpoint MUST be one of the listed concepts. Ground edges in real dependency (e.g. embeddings -> vector-search is a prereq).
CONCEPTS: ${cList}
CURRENT FLUENCY: ${fLines || "(none logged yet)"}`;
}

function gatherCorpus(deps = {}) {
  const cj = deps.concepts !== undefined ? deps.concepts : readJson(CONCEPTS);
  const idOf = (c) => typeof c === "string" ? c : (c && (c.id || c.concept || c.name));
  const idsOf = (coll) => Array.isArray(coll) ? coll.map(idOf).filter(Boolean) : (coll && typeof coll === "object" ? Object.keys(coll) : []);
  let concepts = [];
  if (Array.isArray(cj)) concepts = cj.map(idOf).filter(Boolean);
  // canonical concepts.json = { concepts: {id:{...}}, skills: {id:{...}}, version, _comment, axes }
  else if (cj && typeof cj === "object" && (cj.concepts || cj.skills)) concepts = [...idsOf(cj.concepts), ...idsOf(cj.skills)];
  else if (cj && typeof cj === "object") concepts = Object.keys(cj).filter(k => !k.startsWith("_"));   // last-resort flat map
  const lj = deps.lstate !== undefined ? deps.lstate : readJson(LSTATE);
  const arr = lj && (lj.concepts || lj.ladder);
  const fluency = Array.isArray(arr)
    ? arr.map(c => ({ id: idOf(c), fluency: String(c.fluency || c.stage || "unknown").replace(/[^a-z]/gi, "") || "unknown" })).filter(c => c.id)
    : [];
  return { concepts: [...new Set(concepts)], fluency };
}

// ── #71 · THE SILENT NO-OP ──────────────────────────────────────────────────
// MEASURED 4 Aug 2026 over the live brain_ledger.jsonl: `cortex_consolidate` has
// 11 rows on 8 DISTINCT DAYS (18, 19, 20, 22, 23, 25, 29 Jul · 2 Aug) — for a
// task that fires DAILY at 03:00 and has been registered since 18 Jul. 18
// calendar days, 8 with a trace: on the other 10 the pass returned before the
// FIRST ledger append, printed a line into a wscript window with no redirect,
// and exited 0. Task Scheduler recorded "Last Result 0" — clean success — for a
// nightly Opus consolidation that never ran. dressing-room/club/
// ORGANISM_RESEARCH_2026-07-31.md:203 named this on 31 Jul; it was still true
// today (concept_graph.json's generated_at was 2 days stale).
// The fix is not to force the pass through the gate — the gate is correct. It is
// that EVERY outcome now leaves a row. A skip is a fact about the organism's
// budget; an unrecorded skip is an unmeasured silence rendered as success.
function consolidationLedgerRow(now, extra = {}) {
  return {
    ts: now.toISOString(), job: "cortex_consolidate", engine: "claude", model: "opus",
    input_tokens: null, output_tokens: null, total_tokens: 0, duration_ms: 0,
    ok: false, error: null, limit_hit: false, ran: false, ...extra,
  };
}
async function runConsolidation(deps = {}) {
  const now = deps.now || new Date();
  const brainCfg = deps.brainCfg || loadBrainConfig();
  const cfg = deps.cfg || loadThalamusConfig();
  const env = deps.env || process.env;
  const log = deps.log || (() => {});
  const ledger = deps.appendLedger || ((row) => appendFileSync(BLEDGER, JSON.stringify(row) + "\n"));
  // a ledger write is telemetry: it must never be able to kill the pass it measures
  const meter = (row) => { try { ledger(row); } catch { } };
  // every early return goes through here — that is the whole point of #71
  const bail = (skipped, extra = {}) => {
    meter(consolidationLedgerRow(now, { skipped, error: `did not run: ${skipped}`, ...extra }));
    log(`cortex: consolidate did NOT run — ${skipped}`);
    return { ok: false, skipped, ...extra };
  };
  if (brainCfg.guards && brainCfg.guards.refuse_if_api_key_env && env.ANTHROPIC_API_KEY) {
    return { ...bail("API-key refusal (Max plan only, never metered)"), refused: true };
  }
  const { concepts, fluency } = gatherCorpus(deps);
  if (concepts.length < 3) return bail(`too few concepts (${concepts.length}/3 needed)`);
  // budget gate — the SAME conservative floor as a deep read (never overshoot the meter)
  const hr = deps.headroom || headroom(brainCfg, readLines(BLEDGER), readJson(join(STATE_DIR, "brain_queue.json")) || {}, now);
  const mtf = maxThinkingFor(hr.phase, hr.allowed);
  const minHeadroom = Math.max((cfg.deep && cfg.deep.min_headroom_tokens) || 50000, mtf.min_headroom_tokens);
  if (hr.allowed < minHeadroom) return bail(`no-headroom (${hr.allowed}/${minHeadroom} needed, phase ${hr.phase})`, { headroom_allowed: hr.allowed, headroom_needed: minHeadroom });
  const deepCfg = { ...cfg, deep: { ...cfg.deep, max_thinking_tokens: mtf.max_thinking_tokens } };
  const call = deps.call || ((p) => claudeDeep(p, deepCfg));
  const r = await call(buildConsolidationPrompt(concepts, fluency));
  meter({ ts: now.toISOString(), job: "cortex_consolidate", engine: "claude", model: "opus", input_tokens: r.input_tokens ?? null, output_tokens: r.output_tokens ?? null, total_tokens: r.total_tokens || 0, duration_ms: r.duration_ms || 0, ok: !!r.ok, error: r.error || null, limit_hit: !!r.limit_hit, ran: true });
  if (!r.ok) return { ok: false, error: r.error, tokens: r.total_tokens || 0 };
  let graph;
  try { graph = JSON.parse(String(r.text || "").replace(/^```json\s*|\s*```$/g, "").trim()); } catch { return { ok: false, error: "unparseable graph", tokens: r.total_tokens }; }
  // GROUND it — ONLY concepts from the real set survive (no hallucinated ids in ANY lane),
  // nodes deduped, fluency clamped to the enum. Every concept-bearing field is filtered.
  const set = new Set(concepts);
  const FLU = new Set(["learning", "holding", "fluent", "unknown"]);
  const seen = new Set();
  const nodes = (Array.isArray(graph.nodes) ? graph.nodes : [])
    .filter(n => n && set.has(n.id) && !seen.has(n.id) && seen.add(n.id))
    .map(n => ({ id: n.id, fluency: FLU.has(String(n.fluency)) ? n.fluency : "unknown" }));
  const edges = (Array.isArray(graph.edges) ? graph.edges : []).filter(e => e && set.has(e.from) && set.has(e.to) && e.from !== e.to);
  if (!nodes.length) return { ok: false, error: "no valid nodes", tokens: r.total_tokens };
  const clusters = (Array.isArray(graph.clusters) ? graph.clusters : [])
    .map(c => ({ name: c && c.name, concepts: Array.isArray(c && c.concepts) ? c.concepts.filter(x => set.has(x)) : [] }))
    .filter(c => c.concepts.length);
  // #72 — THE FILE THE READER RELIES ON. Field names and types are the contract
  // documented at CONCEPT_GRAPH_SCHEMA above; every array is always present.
  // fluency_known/concepts_considered is the have/need counter (#106) that stops
  // a downstream surface from presenting a 2-datapoint inference as a 38-datapoint
  // one — `fluency` here is only as good as learning_state.json's coverage.
  const measuredFluency = (fluency || []).filter(f => f && f.fluency && f.fluency !== "unknown" && set.has(f.id));
  const out = {
    schema_version: CONCEPT_GRAPH_SCHEMA,
    generated_at: now.toISOString(),
    date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    source: "cortex-consolidate (opus)",
    node_count: nodes.length, edge_count: edges.length,
    nodes, edges, clusters,
    next_unlocks: Array.isArray(graph.next_unlocks) ? graph.next_unlocks.filter(x => set.has(x)) : [],
    concepts_considered: concepts.length,
    fluency_known: measuredFluency.length,
  };
  (deps.write || ((o) => writeAtomic(CONCEPT_GRAPH, o)))(out);
  return { ok: true, nodes: nodes.length, edges: edges.length, tokens: r.total_tokens, next_unlocks: out.next_unlocks, concepts_considered: out.concepts_considered, fluency_known: out.fluency_known };
}

// #71 — how stale is the artifact on disk? A DAILY job's own contract is that
// the graph is today's; anything else means one or more nightly passes did not
// land. No threshold is invented here — the cadence IS the standard.
function graphFreshness(now = new Date(), deps = {}) {
  const g = deps.graph !== undefined ? deps.graph : readJson(CONCEPT_GRAPH);
  if (!g) return { exists: false, fresh: false, age_days: null, generated_at: null };
  const gen = g.generated_at ? new Date(g.generated_at) : null;
  if (!gen || isNaN(gen)) return { exists: true, fresh: false, age_days: null, generated_at: g.generated_at || null };
  const dayOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const age = Math.floor((new Date(dayOf(now)) - new Date(dayOf(gen))) / 86400000);
  return { exists: true, fresh: age <= 0, age_days: age, generated_at: g.generated_at };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  if (mode === "tick") {
    // E2E audit 25 Jul 2026: tick used to return BEFORE the :4112 singleton lock below,
    // whose whole reason for existing is "two cortexes racing one wake = double Opus
    // spend". A queue row only closes when an answer posts back, so a manual poke while
    // the daemon was 40s into an extended read served the SAME moment a second time —
    // the attempt counter lives in a file and gives no cross-process protection. tick now
    // takes the same lock, and stands down if the daemon already holds it (the daemon is
    // already serving that queue, within 5s). The lock is released before we exit.
    const { createServer: mkSrv } = await import("node:http");
    const held = await new Promise((resolve) => {
      const s = mkSrv(() => {});
      s.on("error", () => resolve(null));
      s.listen(4112, "127.0.0.1", () => resolve(s));
    });
    if (!held) { console.log("cortex: the daemon holds the lock (:4112) and is already serving the queue — tick stands down."); return; }
    try {
      const r = await serveWakes({ log: console.log });
      console.log(`cortex: ${r.served ? `served ${r.served} wake(s)${r.queued ? `, ${r.queued} still queued` : ""}` : r.idle ? "no pending wake" : (r.results || []).some(x => x.refused) ? "refused (API key)" : JSON.stringify(r)}`);
    } finally { try { held.close(); } catch { } }
    return;
  }
  if (mode === "consolidate") {
    // OVERNIGHT DEEPENING (P5) — one nightly Opus pass → concept_graph.json
    const r = await runConsolidation({ log: console.log });
    console.log(r.ok
      ? `cortex: concept graph → ${r.nodes} nodes, ${r.edges} edges${r.next_unlocks && r.next_unlocks.length ? " · next: " + r.next_unlocks.slice(0, 3).join(", ") : ""} (${(r.tokens || 0).toLocaleString()} tok) · fluency measured for ${r.fluency_known}/${r.concepts_considered} concepts`
      : `cortex: consolidate DID NOT RUN — ${r.skipped || r.error || (r.refused ? "API-key refusal" : "unknown")}`);
    // #71 — THE EXIT CODE IS THE ONLY THING THE CAPTAIN EVER SEES. This job runs
    // under wscript with no redirect (see finding #16), so the line above dies in
    // a closing window; Task Scheduler's "Last Result" is the whole surface. It
    // read 0 — clean success — on the 10 of 18 days this pass never ran at all.
    // The standard is the job's OWN daily cadence, not an invented threshold:
    // green iff the graph on disk is today's.
    const f = graphFreshness(new Date());
    if (!f.exists) console.log("cortex: concept_graph.json does NOT exist — no consolidation has ever landed");
    else if (!f.fresh) console.log(`cortex: concept_graph.json on disk is ${f.age_days === null ? "undated" : `${f.age_days} day(s) old`} (generated_at ${f.generated_at}) — a DAILY pass that leaves a stale artifact is not a success`);
    process.exitCode = f.fresh ? 0 : 1;
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
      // E2E audit 25 Jul 2026: the daemon rewrote cortex_runtime.json on every attempt
      // but never dropped a closed moment, so the file grew for the life of the system.
      pruneRuntime(runtime, pending.map(w => w.moment_id).concat([...inflight]));
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
        // E2E audit 25 Jul 2026: the re-entry used to be unconditional (`.finally(… fire())`).
        // A lane that did NOT close its wake — failed call, spooled answer, plan-limit hold,
        // API-key refusal — left the moment pending, so re-entering immediately re-dispatched
        // the SAME wake with no delay: a hot loop that ate the attempt cap (and, before the
        // lifeboat, real Opus spend) in milliseconds. Only an acknowledged close re-opens the
        // dispatcher; anything else waits for the 5s poll. See laneResolved.
        let resolved = false;
        serveOne(w, { log: console.log, runtime })
          .then(r => { resolved = laneResolved(r); })
          .catch(e => console.log("cortex: " + String(e.message).slice(0, 120)))
          .finally(() => { inflight.delete(w.moment_id); if (resolved) fire(); });
      }
    } catch (e) { console.log("cortex: " + String(e.message).slice(0, 120)); }
  };
  let deb = null;
  try { watch(STATE_DIR, (ev, f) => { if (f === "wake_queue.jsonl" || f === "wake.json") { clearTimeout(deb); deb = setTimeout(fire, 400); } }); } catch { }
  setInterval(fire, 5000);
  fire();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { serveWake, serveWakes, serveOne, buildDeepPrompt, claudeDeep, claudeDeepAsync, findCapsule, runConsolidation, buildConsolidationPrompt, gatherCorpus,
  // audit 4 Aug 2026 — #71/#72 seams: the staleness standard and the reader's
  // schema version, exported so a consumer can assert the contract it relies on
  graphFreshness, CONCEPT_GRAPH_SCHEMA, CONCEPT_GRAPH };
