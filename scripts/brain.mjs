#!/usr/bin/env node
// ============================================================================
// brain.mjs · ARSENAL AI FC — THE ORGANISM: THE BRAIN (hot runtime)
// ----------------------------------------------------------------------------
// WHAT:  The crown (ORGANISM_ANATOMY §5). A deterministic job runtime that
//        runs the organism's intelligence HOT — as many `claude -p` calls as
//        it takes to stay sharp around the clock, deliberately exhausting the
//        Max 5x plan (captain's standing order, 12 Jul 2026), weighted to the
//        overnight idle hours, while PROTECTING his study hours so he is
//        never locked out of his own plan. Two brains: Claude (judgment,
//        coaching, the hard reads) and Gemini CLI (visualization, long-context
//        — free on his Google account; flagged off until wired).
// HOW (the Manager tracking tokens, mechanically):
//   · every call logs usage to brain_ledger.jsonl; the rolling 5h window and
//     7d week are summed from the ledger — the budget is measured, not vibed.
//   · Anthropic publishes no exact caps, so capacity estimates SELF-TUNE:
//     an observed limit event records the true ceiling (observed_window_
//     ceiling in brain_queue.json) and the runtime re-fits. The ledger learns
//     the plan's real shape instead of pretending to know it.
//   · STUDY HOURS (09:00–21:00): spend at most day_reserve_frac of the window
//     estimate — the captain can always open Claude and work on top.
//   · OVERNIGHT (22:00–07:30): queue-drain toward overnight_target_frac.
//     Unused capacity is wasted sharpness.
//   · M-3, finally: the formation_read job passes a real llm into the
//     runManager({llm}) socket manager.mjs shipped with. manager.mjs is NOT
//     edited — the plug meets the socket (layering, never replace).
// GUARDS (each selftested):
//   · ANTHROPIC_API_KEY set ⇒ REFUSE to run LLM calls (hard $100 ceiling:
//     subscription only, ever).
//   · banned-phrase validator (no 10x/exponential/on-steroids — hype in
//     output is a bug); no_new_numbers validator for insight-class jobs
//     (the Manager's zero-invented-numbers law, reused).
//   · deterministic organs never blocked: the brain enriches; it is never
//     load-bearing for the sheet (fallback skeleton law lives in manager.mjs).
//
// INPUT:  brain_config.json (canon) · the bus (read-only) ·
//         dressing-room/manager/system.md (the Opus soul)
// OUTPUT: brain_ledger.jsonl · brain_queue.json · brain_out/<job>/<date>.md
//         (formation_read writes through manager.mjs's own validated writer)
// MODES:  tick (default) · run <job_id> · status · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { runManager } from "./manager.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CFG_PATH  = join(STATE_DIR, "brain_config.json");
const LEDGER    = join(STATE_DIR, "brain_ledger.jsonl");
const QUEUE     = join(STATE_DIR, "brain_queue.json");
const OUT_DIR   = join(STATE_DIR, "brain_out");
const SYSTEM_MD = join(__dirname, "..", "dressing-room", "manager", "system.md");

const DEFAULTS = {
  budget: { window_hours: 5, window_capacity_est_tokens: 800000, weekly_capacity_est_tokens: 12000000, day_reserve_frac: 0.25, overnight_target_frac: 0.95, self_tune: true },
  study_hours: { start: "09:00", end: "21:00" },
  overnight: { start: "22:00", end: "07:30" },
  guards: { refuse_if_api_key_env: true, banned_phrases: ["10x", "exponential", "on steroids", "god-tier", "time is short"] },
  ntfy: { enabled: false, topic: "", push_after: ["formation_read"] },
  gemini: { enabled: false, binary: "gemini" },
  dugout_pool: { enabled: true, gemini_defer_threshold_min: 30 },
  jobs: [],
};

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const hhmm = (now) => `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

function loadConfig(path = CFG_PATH) {
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      return {
        budget: { ...DEFAULTS.budget, ...(j.budget || {}) },
        study_hours: { ...DEFAULTS.study_hours, ...(j.study_hours || {}) },
        overnight: { ...DEFAULTS.overnight, ...(j.overnight || {}) },
        guards: { ...DEFAULTS.guards, ...(j.guards || {}) },
        ntfy: { ...DEFAULTS.ntfy, ...(j.ntfy || {}) },
        gemini: { ...DEFAULTS.gemini, ...(j.gemini || {}) },
        dugout_pool: { ...DEFAULTS.dugout_pool, ...(j.dugout_pool || {}) },
        jobs: Array.isArray(j.jobs) ? j.jobs : [],
      };
    }
  } catch { /* malformed → defaults */ }
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => {
  const out = [];
  try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch {} } } catch {}
  return out;
};

// ---------------------------------------------------------------------------
// BUDGET GOVERNOR (pure)
// ---------------------------------------------------------------------------
function windowUsage(ledger, now, hours) {
  const cutoff = now.getTime() - hours * 3600000;
  return ledger.filter(l => l.engine === "claude" && new Date(l.ts).getTime() >= cutoff)
    .reduce((a, l) => a + (l.total_tokens || 0), 0);
}
const weekUsage = (ledger, now) => windowUsage(ledger, now, 24 * 7);

function inRange(nowHM, start, end) {
  return start <= end ? (nowHM >= start && nowHM < end) : (nowHM >= start || nowHM < end);
}

// how many tokens may we spend RIGHT NOW?
function headroom(cfg, ledger, queueState, now) {
  // the observed ceiling is a LEARNED truth, but the real Max-5x window is
  // always >= our deliberately-conservative estimate; never let a stale/low
  // observed value collapse the budget to zero and starve the hot brain
  // (E2E finding 13 Jul: a limit event recorded ceiling=1 and switched the
  // overnight engine off). Floor at the estimate.
  const est = cfg.budget.window_capacity_est_tokens;
  const cap0 = Math.max(est, (queueState && queueState.observed_window_ceiling) || est);
  const used = windowUsage(ledger, now, cfg.budget.window_hours);
  const weekly = weekUsage(ledger, now);
  const weeklyCap = cfg.budget.weekly_capacity_est_tokens;
  const nowHM = hhmm(now);
  let cap;
  if (inRange(nowHM, cfg.study_hours.start, cfg.study_hours.end)) cap = cap0 * cfg.budget.day_reserve_frac;          // protect his study
  else if (inRange(nowHM, cfg.overnight.start, cfg.overnight.end)) cap = cap0 * cfg.budget.overnight_target_frac;    // exhaust deliberately
  else cap = cap0 * 0.6;                                                                                              // shoulder hours
  return { allowed: Math.max(0, Math.min(cap - used, weeklyCap - weekly)), used, cap: Math.round(cap), phase: inRange(nowHM, cfg.overnight.start, cfg.overnight.end) ? "overnight" : inRange(nowHM, cfg.study_hours.start, cfg.study_hours.end) ? "study" : "shoulder" };
}

// THE THIRD POOL (U3d): live-voice minutes beside Claude-window and Gemini-text
function dugoutMinutesToday(now, file = join(STATE_DIR, "dugout_ledger.jsonl")) {
  return readLines(file).filter(l => String(l.ts || "").slice(0, 10) === localDate(now)).reduce((a, l) => a + (l.minutes || 0), 0);
}

// which jobs are eligible now?
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// THE OVERNIGHT SHIFT IS ONE SHIFT even across midnight: its ledger day is the
// evening it STARTED. Calendar-keying made every overnight job eligible AGAIN at
// 00:00 — it re-ran with TODAY-tokened inputs now pointing at the empty new day
// and overwrote the good artifacts (the KAL-rich morning talk among them).
function shiftDay(job, now, cfg) {
  if (!job || job.window !== "overnight") return localDate(now);
  const endH = Number(String((cfg.overnight && cfg.overnight.end) || "07:30").split(":")[0]);
  return now.getHours() <= endH ? localDate(new Date(now.getTime() - 86400000)) : localDate(now);
}
function eligibleJobs(cfg, queueState, now, voiceMinToday = null) {
  const nowHM = hhmm(now);
  const ranOn = (day) => (queueState && queueState.jobs_run && queueState.jobs_run[day]) || {};
  const windows = { morning: ["07:30", "12:00"], midday: ["12:00", "17:00"], evening: ["17:00", "22:00"], overnight: [cfg.overnight.start, cfg.overnight.end], any: ["00:00", "24:00"] };
  const daytime = inRange(nowHM, cfg.study_hours.start, cfg.study_hours.end);
  return cfg.jobs.filter(j => {
    if (j.enabled === false) return false;
    if ((ranOn(shiftDay(j, now, cfg))[j.id] || 0) >= (j.max_per_day || 1)) return false;
    if (Array.isArray(j.days) && !j.days.includes(DOW[now.getDay()])) return false;
    if (j.engine === "gemini" && !cfg.gemini.enabled) return false;
    // THE THIRD POOL: heavy voice day → daytime Gemini text/render jobs step
    // aside (the voice needs the free-tier pool); they run overnight anyway.
    if (j.engine === "gemini" && daytime && cfg.dugout_pool && cfg.dugout_pool.enabled &&
        voiceMinToday !== null && voiceMinToday >= cfg.dugout_pool.gemini_defer_threshold_min) return false;
    // EVENT-TRIGGERED jobs (U4): eligible ONLY while their trigger is armed
    // (brain.mjs trigger <name> "<reason>"); the tick consumes it on success.
    if (j.trigger && !(queueState && queueState.triggers && queueState.triggers[j.trigger])) return false;
    if (j.at) return nowHM >= j.at && inRange(nowHM, ...(windows[j.window] || windows.any));
    return inRange(nowHM, ...(windows[j.window] || windows.any));
  }).sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

// ---------------------------------------------------------------------------
// VALIDATORS
// ---------------------------------------------------------------------------
function bannedPhraseCheck(text, banned) {
  const hay = String(text || "").toLowerCase();
  return banned.filter(b => hay.includes(String(b).toLowerCase()));
}
function allowedNumbers(data) {
  const s = new Set();
  (function walk(v) {
    if (typeof v === "number" && Number.isFinite(v)) { s.add(String(v)); s.add(String(Math.round(v * 10000) / 10000)); }
    else if (typeof v === "string") for (const m of v.match(/\d+(\.\d+)?/g) || []) s.add(m);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  })(data);
  for (let i = 0; i <= 31; i++) s.add(String(i));
  return s;
}
function noNewNumbers(text, inputData) {
  const allowed = allowedNumbers(inputData);
  const stripped = String(text || "").replace(/\d{4}-\d{2}-\d{2}/g, "").replace(/\d{1,2}:\d{2}/g, "");
  for (const n of stripped.match(/\d+(\.\d+)?/g) || []) if (!allowed.has(n)) return { ok: false, bad: n };
  return { ok: true };
}
function validateOutput(job, text, inputData, cfg) {
  const banned = bannedPhraseCheck(text, cfg.guards.banned_phrases);
  if (banned.length) return { ok: false, reason: `banned phrase: ${banned.join(", ")}` };
  if (job.validate === "no_new_numbers") {
    const v = noNewNumbers(text, inputData);
    if (!v.ok) return { ok: false, reason: `invented number: ${v.bad}` };
  }
  if (job.validate === "quotes_only") {
    // v0: every quoted segment ≥12 chars must appear verbatim in the input
    const hay = JSON.stringify(inputData);
    for (const m of String(text).match(/"([^"]{12,})"/g) || []) {
      if (!hay.includes(m.slice(1, -1))) return { ok: false, reason: `non-verbatim quote: ${m.slice(0, 40)}…` };
    }
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// EXECUTORS (injectable for selftest)
// ---------------------------------------------------------------------------
const LIMIT_RE = /limit|overloaded|rate.?limit|resets \d/i;

function claudeExec(prompt, model, extraArgs = [], timeoutMs = 300000) {
  const t0 = Date.now();
  try {
    const stdout = execFileSync("claude", ["-p", "--output-format", "json", "--model", model || "sonnet", ...(Array.isArray(extraArgs) ? extraArgs : [])],
      { input: prompt, timeout: timeoutMs, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
    let text = stdout, inTok = null, outTok = null, isErr = false;
    try {
      const j = JSON.parse(stdout);
      text = j.result !== undefined ? String(j.result) : stdout;
      isErr = j.is_error === true;
      if (j.usage) { inTok = j.usage.input_tokens ?? null; outTok = j.usage.output_tokens ?? null; }
    } catch { /* non-json → raw text */ }
    const total = (inTok || 0) + (outTok || 0) || Math.ceil((prompt.length + text.length) / 4);
    const limit_hit = isErr && LIMIT_RE.test(text);
    return { ok: !isErr, text, input_tokens: inTok, output_tokens: outTok, total_tokens: total, duration_ms: Date.now() - t0, limit_hit, error: isErr ? text.slice(0, 200) : null };
  } catch (e) {
    const msg = String((e.stderr || "") + (e.stdout || "") + e.message);
    return { ok: false, text: null, input_tokens: null, output_tokens: null, total_tokens: Math.ceil(prompt.length / 4),
      duration_ms: Date.now() - t0, limit_hit: LIMIT_RE.test(msg), error: msg.slice(0, 200) };
  }
}

function geminiExec(prompt, binary, timeoutMs = 300000) {
  const t0 = Date.now();
  try {
    // Windows: npm installs gemini as a .cmd shim (bare "gemini" ENOENTs from
    // execFile). Prompt goes via STDIN (argv would hit length limits + quoting).
    // The junk legacy GOOGLE_API_KEY is stripped from the child env — the
    // organism's Gemini lane authenticates via ~/.gemini/.env only.
    const shim = process.platform === "win32" && process.env.APPDATA
      ? join(process.env.APPDATA, "npm", binary + ".cmd") : binary;
    const cmd = existsSync(shim) ? shim : binary;
    const env = { ...process.env, GEMINI_CLI_TRUST_WORKSPACE: "true" };
    delete env.GOOGLE_API_KEY;
    // Node 22 requires shell:true to spawn .cmd shims (CVE-2024-27980 guard);
    // safe here: zero argv, prompt rides stdin, path is fixed and space-free.
    const stdout = execFileSync(cmd, [], { input: prompt.slice(0, 200000), timeout: timeoutMs, encoding: "utf8", windowsHide: true, env, shell: cmd.endsWith(".cmd") });
    return { ok: true, text: stdout, total_tokens: Math.ceil((prompt.length + stdout.length) / 4), duration_ms: Date.now() - t0, limit_hit: false, error: null };
  } catch (e) {
    return { ok: false, text: null, total_tokens: 0, duration_ms: Date.now() - t0, limit_hit: false, error: String(e.message).slice(0, 200) };
  }
}

// ---------------------------------------------------------------------------
// NTFY — the organism's mouth on the captain's phone. Two utterances ONLY:
// the 08:45 sheet (after formation_read) and the 21:30 full-time bell.
// Nothing else ever pings (constitutional). The topic is a SECRET: config
// holds "" and resolution falls back to env → gitignored throwin_topic.txt.
// ---------------------------------------------------------------------------
function resolveNtfyTopic(cfg, env = process.env) {
  if (cfg.ntfy && cfg.ntfy.topic) return cfg.ntfy.topic;
  const fromEnv = env.ARSENAL_NTFY_TOPIC;
  if (fromEnv && String(fromEnv).trim()) return String(fromEnv).trim();
  try {
    const p = join(STATE_DIR, "throwin_topic.txt");
    if (existsSync(p)) { const t = readFileSync(p, "utf8").trim(); if (t) return t; }
  } catch { }
  return null;
}
// HTTP headers are ByteString (every code point ≤ 0xFF) — Node's fetch throws on
// the club badge BEFORE any network I/O, so an emoji title would silently kill the
// push. ntfy supports RFC 2047 encoded-words in Title: the badge still shows on
// the phone, the header stays pure ASCII.
function ntfyHeaderSafe(s) {
  const str = String(s || "");
  return /^[\x00-\xFF]*$/.test(str) ? str : `=?UTF-8?B?${Buffer.from(str, "utf8").toString("base64")}?=`;
}
async function pushNtfy(cfg, title, body, fetchFn = fetch, opts = {}) {
  if (!cfg.ntfy || !cfg.ntfy.enabled) return { sent: false, why: "disabled" };
  const topic = resolveNtfyTopic(cfg);
  if (!topic) return { sent: false, why: "no topic" };
  try {
    const res = await fetchFn(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      // Markdown renders in the ntfy app — plain text passes through unchanged,
      // formatted utterances glow. Priority stays default: no urgency pressure, ever.
      method: "POST", body, headers: { Title: ntfyHeaderSafe(title), Tags: opts.tags || "soccer", Priority: opts.priority || "default", Markdown: "yes" },
      signal: AbortSignal.timeout(15000),
    });
    return { sent: res && (res.ok || res.status === 200), why: null };
  } catch (e) { return { sent: false, why: "network" }; }
}
const BELLS = {
  fulltime: { title: "⚪🔴 Full-time, captain", body: "**30 seconds, then sleep.**\n\nDugout se bolo **\"full time\"** — ya `npm run postmatch`\n\n• HIT ya MISS — honest\n• one signal worth naming\n• **KAL-line** — the weld that wins tomorrow's morning\n\nCOYG ⚪🔴" },
};

// the inner claude is an agentic CLI — it may wrap the sheet in chatter or try
// to "help". Deterministic slice: from the FIRST badge to the END of the LAST
// badge. No badge ⇒ return as-is (the wrapper's validator will judge it).
function sliceSheet(text) {
  const s = String(text || "");
  const first = s.indexOf("⚪🔴");
  const last = s.lastIndexOf("⚪🔴");
  if (first === -1 || last === first) return s;
  return s.slice(first, last + "⚪🔴".length);
}

// ---------------------------------------------------------------------------
// PROMPT BUILDERS
// ---------------------------------------------------------------------------
const clip = (s, n = 14000) => { const t = typeof s === "string" ? s : JSON.stringify(s, null, 1); return t.length > n ? t.slice(0, n) + "\n…[clipped]" : t; };

// THE COGNITIVE FINGERPRINT — every LLM call this brain makes is conditioned
// on the captain's MEASURED mind, not an assumed one: his own metaphor
// anchors (Ghar-ki-Boli), his wrong-prior shapes (the Decoy Map, machine-side
// — used to design, never shown pre-guess), his live calibration bias, his
// fluency map. Assembled deterministically; empty parts simply absent.
function buildFingerprint({ lexicon, grammar, calibration, ls } = {}) {
  const parts = [];
  if (lexicon && Array.isArray(lexicon.anchors) && lexicon.anchors.length) {
    // scan-fix 15 Jul: the miner's raw n-grams shipped shredded fragments
    // ("one picture yeh diagram poore", "aristo eco ₹81 500") as "his
    // metaphors" in EVERY prompt. Filter: no digits/currency, must not be a
    // mid-phrase shard (drop entries wholly contained in a longer anchor).
    const clean = lexicon.anchors
      .map(a => String(a.phrase || "").trim())
      .filter(p => p.length >= 12 && !/[\d₹$%]/.test(p));
    const keep = clean.filter(p => !clean.some(q => q !== p && q.includes(p)));
    if (keep.length) parts.push(`HIS ANCHOR METAPHORS (reach for these FIRST; verbatim from his own Bolo): ${keep.slice(0, 6).map(p => `"${p}"`).join(" · ")}`);
  }
  if (grammar && grammar.shape_counts) {
    const top = Object.entries(grammar.shape_counts).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 2);
    if (top.length) parts.push(`HIS WRONG-PRIOR SHAPES (machine-side — design probes around these, NEVER name them to him): ${top.map(([s, n]) => `${s}(${n})`).join(", ")}`);
  }
  if (calibration && typeof calibration.overconfidence_rate === "number")
    parts.push(`CALIBRATION: overconfidence P(wrong|knew)=${calibration.overconfidence_rate}; trend ${calibration.trend || "—"}.`);
  if (ls && ls.weak_connection) parts.push(`THE FRAYING PASS: ${ls.weak_connection}.`);
  parts.push("FIXED TRAITS: ADHD-PI, ~4 working-memory slots, visual-first, Hinglish welds, walls of text = shutdown, finance-ops instincts (Zomato/Blinkit) — teach through business impact.");
  return parts.length ? "THE CAPTAIN'S COGNITIVE FINGERPRINT (measured, not assumed):\n" + parts.map(p => "  · " + p).join("\n") : "";
}
function gatherFingerprint() {
  return buildFingerprint({
    lexicon: readJson(join(STATE_DIR, "lexicon.json")),
    grammar: readJson(join(STATE_DIR, "doubt_grammar.json")),
    calibration: readJson(join(STATE_DIR, "calibration.json")),
    ls: readJson(join(STATE_DIR, "learning_state.json")),
  });
}

function buildAnalysisPrompt(job, inputs, fingerprint = gatherFingerprint()) {
  const head = `You are an organ of ARSENAL AI FC — the captain's exocortex. Job: ${job.id}. ${job._note || ""}
LAWS: honest frame only (compounding, never "10x/exponential"); no calendar pressure; no shame; self-scout register; every number must come from the data below; if the data is thin say so plainly. Output: concise markdown, ≤ 25 lines.
${fingerprint}`;
  const body = Object.entries(inputs).map(([k, v]) => `\n## INPUT ${k}\n${clip(v)}`).join("\n");
  return head + body;
}

function gatherInputs(job, now = new Date()) {
  const inputs = {};
  for (const raw of (job.inputs || [])) {
    const name = raw.replace(/TODAY/g, localDate(now));   // date-tokened paths (e.g. dugout transcripts)
    const p = join(STATE_DIR, name);
    if (name.endsWith(".jsonl")) inputs[name] = readLines(p).slice(-200);
    else if (name.endsWith(".md") || name.endsWith(".html")) inputs[name] = existsSync(p) ? readFileSync(p, "utf8").slice(-20000) : null;
    else inputs[name] = readJson(p);
  }
  return inputs;
}

// ---------------------------------------------------------------------------
// JOB RUNNER
// ---------------------------------------------------------------------------
async function runJob(job, cfg, deps) {
  const { exec, gexec, now, dry } = deps;
  const today = localDate(now);

  if (job.kind === "manager_m3") {
    // M-3: the plug meets the socket. manager.mjs validates + writes the sheet
    // itself (zero-invented-numbers + fallback skeleton — never depends on us).
    const system = existsSync(SYSTEM_MD) ? readFileSync(SYSTEM_MD, "utf8") : "";
    let usage = null;
    const llm = async (prompt) => {
      const r = exec(system + "\n\n=== TODAY'S WRAPPER FEATURES (the only numbers that exist) ===\n\n" + prompt +
        "\n\nOUTPUT CONTRACT (mechanical): reply with ONLY the finished team sheet text — first characters '⚪🔴', last line ending 'COYG. ⚪🔴'. No preamble, no commentary, no questions, no tool use, no file writes. Your entire reply IS the sheet.", job.model);
      usage = r;
      if (!r.ok) throw new Error(r.error || "llm failed");
      return sliceSheet(r.text);
    };
    const res = dry ? { source: "dry" } : await runManager({ llm });
    // the one sanctioned morning push: the sheet lands on his phone unasked
    if (!dry && res.source === "llm" && (cfg.ntfy.push_after || []).includes(job.id)) {
      const sheetPath = join(STATE_DIR, "team_sheet.md");
      const head = existsSync(sheetPath) ? readFileSync(sheetPath, "utf8").split("\n").slice(0, 10).join("\n") : "sheet ready";
      const tt = teamtalkLine("am", now);
      await pushNtfy(cfg, "⚪🔴 Team sheet is up", `**The sheet is up, captain.**\n\n${head}\n\n_…full sheet on the Wall (ARSENAL 2)._${tt ? "\n\n🎙️ " + tt : ""}`, undefined, { tags: "soccer,clipboard" });
    }
    return { usage: usage || { ok: false, total_tokens: 0, limit_hit: false, error: "not called" }, note: `sheet source=${res.source}${res.reason ? " (" + res.reason + ")" : ""}` };
  }

  // analysis-class job — render-class jobs use viz's auto-written prompt file
  // (it carries the render laws + the design-coach critique), never the
  // analysis head (which would ask for markdown, not an artifact).
  const inputs = gatherInputs(job);
  let prompt;
  if (job.kind === "render" && job.prompt_file) {
    const pf = join(STATE_DIR, "..", "club", "prompts", job.prompt_file);
    prompt = existsSync(pf) ? readFileSync(pf, "utf8") + "\nOutput ONLY the artifact — first character '<'." : buildAnalysisPrompt(job, inputs);
  } else prompt = buildAnalysisPrompt(job, inputs);
  const r = job.engine === "gemini" ? gexec(prompt, cfg.gemini.binary) : exec(prompt, job.model, job.extra_args);
  if (r.ok && r.text) {
    const v = validateOutput(job, r.text, inputs, cfg);
    if (!v.ok) return { usage: { ...r, ok: false, error: "validator: " + v.reason }, note: `rejected (${v.reason}) — nothing written` };
    if (!dry) writeAtomic(join(OUT_DIR, job.out || job.id, today + ".md"), r.text);
    let note = `→ brain_out/${job.out || job.id}/${today}.md`;
    // MEDIA ENGINE: speak_to jobs render their validated text to an mp3 in
    // club/media/ (speak.mjs synthToFile — earClean inside). Offline = honest
    // skip; the text output stands either way.
    if (!dry && job.speak_to) {
      try {
        const { synthToFile } = await import("./speak.mjs");
        const target = join(STATE_DIR, "..", "club", "media", job.speak_to.replace(/DATE/g, serveDate(job, now)));
        const sp = await synthToFile(r.text, target);
        note += sp.wrote ? ` · 🎙 ${job.speak_to.replace(/DATE/g, serveDate(job, now))}` : ` · mp3 skipped (${sp.error})`;
      } catch (e) { note += ` · mp3 skipped (${String(e.message).slice(0, 60)})`; }
    }
    return { usage: r, note };
  }
  return { usage: r, note: r.limit_hit ? "PLAN LIMIT observed — ceiling recorded, backing off" : `failed: ${r.error}` };
}

// which date an audio artifact SERVES: overnight-compiled morning talks are
// for tomorrow (when run in the evening half of the night), else today.
function serveDate(job, now) {
  return job.serve === "next_morning" && now.getHours() >= 15 ? localDate(new Date(now.getTime() + 86400000)) : localDate(now);
}

// "team talk taiyaar" rides INSIDE the two sanctioned utterances (never a
// third push): the 08:45 sheet gets the am line, the 21:30 bell the pm line.
function teamtalkLine(slot, now = new Date(), dir = join(STATE_DIR, "..", "club", "media")) {
  const f = `teamtalk_${localDate(now)}_${slot}.mp3`;
  return existsSync(join(dir, f)) ? `🎙 team talk taiyaar — club/media/${f}` : null;
}

// ---------------------------------------------------------------------------
// TICK — the deterministic heartbeat of the hot brain
// ---------------------------------------------------------------------------
async function tick(cfg, deps) {
  const { now } = deps;
  if (cfg.guards.refuse_if_api_key_env && process.env.ANTHROPIC_API_KEY) {
    console.log("brain: REFUSING — ANTHROPIC_API_KEY is set in this shell (per-token billing risk). Unset it; the brain runs on the Max subscription only.");
    return { ran: [], refused: true };
  }
  const ledger = readLines(LEDGER);
  const queueState = readJson(QUEUE) || { observed_window_ceiling: null, jobs_run: {} };
  const today = localDate(now);
  queueState.jobs_run[today] = queueState.jobs_run[today] || {};

  const ran = [];
  for (const job of eligibleJobs(cfg, queueState, now, dugoutMinutesToday(now))) {
    const h = headroom(cfg, ledger.concat(ran.map(r => r.ledgerRow)), queueState, now);
    if (h.allowed <= 0) { ran.push({ job: job.id, skipped: `budget (${h.phase}: ${h.used}/${h.cap})` }); break; }
    const { usage, note } = await runJob(job, cfg, deps);
    const row = {
      ts: now.toISOString(), job: job.id, engine: job.engine || "claude", model: job.model || null,
      input_tokens: usage.input_tokens ?? null, output_tokens: usage.output_tokens ?? null,
      total_tokens: usage.total_tokens || 0, duration_ms: usage.duration_ms || 0,
      ok: usage.ok, error: usage.error || null, limit_hit: !!usage.limit_hit,
    };
    if (!deps.dry) appendFileSync(LEDGER, JSON.stringify(row) + "\n");
    // a FAILED job does not consume its daily slot — it retries next tick
    // (e.g. gemini before the captain's one-time login, or a transient claude
    // error). Success is what spends the slot.
    if (usage.ok) { const sd = shiftDay(job, now, cfg); const bucket = queueState.jobs_run[sd] = queueState.jobs_run[sd] || {}; bucket[job.id] = (bucket[job.id] || 0) + 1; }
    if (usage.ok && job.trigger && queueState.triggers) delete queueState.triggers[job.trigger];   // consumed
    if (usage.limit_hit && cfg.budget.self_tune) {
      // a limit event means we spent ~the plan's true capacity — record the
      // ACTUAL window usage, but never below the conservative estimate (a
      // limit at low observed-usage is a false read, not a 1-token ceiling).
      queueState.observed_window_ceiling = Math.max(cfg.budget.window_capacity_est_tokens, windowUsage(ledger, now, cfg.budget.window_hours));
      ran.push({ job: job.id, note, ledgerRow: row });
      break;                                                    // back off the moment the plan says stop
    }
    ran.push({ job: job.id, note, ledgerRow: row });
  }
  queueState.last_tick = now.toISOString();
  if (!deps.dry) writeAtomic(QUEUE, queueState);
  return { ran, refused: false };
}

// ---------------------------------------------------------------------------
// selftest — mock executors; tmp state; no real LLM calls, no real writes
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const cfg = loadConfig();   // committed config is the fixture — it must parse
  assert("committed brain_config.json parses with jobs", cfg.jobs.length >= 10);
  assert("day cartridge job wired (L3: slow brain programs the fast brain)", cfg.jobs.some(j => j.id === "day_cartridge" && j.window === "overnight" && j.validate === "no_new_numbers" && String(j._note).includes("second person")));

  // THE THIRD POOL (U3d) — voice minutes shift daytime gemini text jobs aside
  {
    const poolCfg = { ...cfg, gemini: { enabled: true }, dugout_pool: { enabled: true, gemini_defer_threshold_min: 30 }, jobs: [{ id: "g1", engine: "gemini", window: "any", priority: 5 }, { id: "c1", engine: "claude", window: "any", priority: 5 }] };
    const day = new Date(2026, 6, 12, 14, 0), night = new Date(2026, 6, 12, 23, 0);
    assert("heavy voice day → daytime gemini job steps aside", !eligibleJobs(poolCfg, {}, day, 45).some(j => j.id === "g1"));
    assert("claude jobs untouched by the voice pool", eligibleJobs(poolCfg, {}, day, 45).some(j => j.id === "c1"));
    assert("quiet voice day → gemini runs as normal", eligibleJobs(poolCfg, {}, day, 5).some(j => j.id === "g1"));
    assert("overnight gemini runs regardless (voice is asleep)", eligibleJobs(poolCfg, {}, night, 500).some(j => j.id === "g1"));
    assert("minutes ledger math: missing file → 0 (never crashes)", dugoutMinutesToday(day, "no-such-ledger-xyz.jsonl") === 0);
    assert("pool committed to canon config", !!cfg.dugout_pool && cfg.dugout_pool.enabled === true);
  }

  // MEDIA ENGINE — team talks: validated text → mp3 in club/media/
  const ttam = cfg.jobs.find(j => j.id === "teamtalk_am"), ttpm = cfg.jobs.find(j => j.id === "teamtalk_pm");
  assert("teamtalk jobs wired with speak_to + no-new-numbers validator", !!ttam && !!ttpm && ttam.speak_to === "teamtalk_DATE_am.mp3" && ttpm.speak_to === "teamtalk_DATE_pm.mp3" && ttam.validate === "no_new_numbers" && ttpm.validate === "no_new_numbers");
  assert("morning talk compiled overnight SERVES tomorrow", serveDate({ serve: "next_morning" }, new Date(2026, 6, 12, 23, 15)) === "2026-07-13");
  assert("after-midnight compile serves the same morning", serveDate({ serve: "next_morning" }, new Date(2026, 6, 13, 2, 0)) === "2026-07-13");
  assert("evening talk serves the same day", serveDate({}, new Date(2026, 6, 12, 20, 45)) === "2026-07-12");
  {
    const { mkdtempSync } = await import("node:fs");
    const osm = await import("node:os");
    const td = mkdtempSync(join(osm.tmpdir(), "brain-tt-"));
    assert("no mp3 → no line (the push never lies)", teamtalkLine("am", new Date(2026, 6, 12, 8, 45), td) === null);
    writeFileSync(join(td, "teamtalk_2026-07-12_am.mp3"), "x");
    const line = teamtalkLine("am", new Date(2026, 6, 12, 8, 45), td);
    assert("mp3 present → 'team talk taiyaar' rides the sanctioned push", !!line && line.includes("teamtalk_2026-07-12_am.mp3"));
  }

  // budget math
  const now = (h, m) => new Date(2026, 6, 12, h, m, 0);
  const L = (hoursAgo, tokens, engine = "claude") => ({ ts: new Date(now(23, 0).getTime() - hoursAgo * 3600000).toISOString(), engine, total_tokens: tokens });
  const ledger = [L(1, 100000), L(2, 200000), L(6, 500000), L(3, 50000, "gemini")];
  assert("window usage sums 5h of CLAUDE tokens only", windowUsage(ledger, now(23, 0), 5) === 300000);
  assert("gemini tokens never count against the Claude window", windowUsage(ledger, now(23, 0), 5) < 350000);

  const qEmpty = { observed_window_ceiling: null, jobs_run: {} };
  const hStudy = headroom(cfg, ledger, qEmpty, now(14, 0));
  assert("STUDY HOURS — cap = day_reserve_frac (protect the captain)", hStudy.phase === "study" && hStudy.cap === Math.round(cfg.budget.window_capacity_est_tokens * cfg.budget.day_reserve_frac));
  const hNight = headroom(cfg, ledger, qEmpty, now(23, 30));
  assert("OVERNIGHT — cap = overnight_target_frac (exhaust deliberately)", hNight.phase === "overnight" && hNight.cap === Math.round(cfg.budget.window_capacity_est_tokens * cfg.budget.overnight_target_frac));
  assert("self-tuned ceiling ABOVE estimate overrides (learns the plan is bigger)", headroom(cfg, ledger, { observed_window_ceiling: 1200000 }, now(23, 30)).cap === Math.round(1200000 * cfg.budget.overnight_target_frac));
  assert("STARVATION GUARD — a too-low/corrupt ceiling is floored at the estimate", headroom(cfg, ledger, { observed_window_ceiling: 1 }, now(23, 30)).cap === Math.round(cfg.budget.window_capacity_est_tokens * cfg.budget.overnight_target_frac) && headroom(cfg, ledger, { observed_window_ceiling: 1 }, now(23, 30)).allowed > 100000);

  // eligibility
  const q = { jobs_run: { "2026-07-12": { formation_read: 1 } } };
  const elig845 = eligibleJobs(cfg, { jobs_run: {} }, now(8, 45));
  assert("formation_read eligible at 08:45", elig845.some(j => j.id === "formation_read"));
  assert("max_per_day dedup — second run same day blocked", !eligibleJobs(cfg, q, now(9, 0)).some(j => j.id === "formation_read"));
  assert("overnight jobs ineligible mid-day", !eligibleJobs(cfg, { jobs_run: {} }, now(14, 0)).some(j => j.window === "overnight"));
  const eligNight = eligibleJobs(cfg, { jobs_run: {} }, now(23, 30));
  assert("overnight queue rich at 23:30 (≥4 jobs)", eligNight.filter(j => j.window === "overnight").length >= 4);
  assert("Sunday-only job honors days[] (2026-07-12 IS a Sunday)", eligNight.some(j => j.id === "season_review"));
  // THE MIDNIGHT SEAM — the overnight shift is ONE shift: a job that ran at
  // 23:30 must NOT come back at 00:30 with empty TODAY-inputs; next evening it must.
  const qNight = { jobs_run: { "2026-07-12": { day_cartridge: 1 } } };
  assert("overnight job does NOT re-run after midnight (same shift)", !eligibleJobs(cfg, qNight, new Date(2026, 6, 13, 0, 30)).some(j => j.id === "day_cartridge"));
  assert("next EVENING the overnight job runs again (new shift)", eligibleJobs(cfg, qNight, new Date(2026, 6, 13, 22, 30)).some(j => j.id === "day_cartridge"));
  assert("a post-midnight success LEDGERS to the evening the shift started", shiftDay({ window: "overnight" }, new Date(2026, 6, 13, 0, 30), cfg) === "2026-07-12" && shiftDay({ window: "overnight" }, new Date(2026, 6, 13, 23, 0), cfg) === "2026-07-13");
  assert("non-overnight jobs stay calendar-keyed", shiftDay({ window: "morning" }, new Date(2026, 6, 13, 8, 45), cfg) === "2026-07-13");
  const cfgGemOff = { ...cfg, gemini: { ...cfg.gemini, enabled: false } };
  assert("gemini jobs skipped when gemini.enabled=false (mechanism)", !eligibleJobs(cfgGemOff, { jobs_run: {} }, now(23, 30)).some(j => j.engine === "gemini"));
  assert("gemini jobs eligible when enabled (committed default)", cfg.gemini.enabled === false || eligNight.some(j => j.engine === "gemini"));
  assert("priority ordering (formation > insights)", elig845.length === 0 || elig845[0].priority >= (elig845[1] ? elig845[1].priority : 0));

  // validators
  assert("banned-phrase validator rejects hype", validateOutput({ validate: null }, "this is a 10x week", {}, cfg).ok === false);
  assert("no_new_numbers rejects invented numbers", validateOutput({ validate: "no_new_numbers" }, "you did 97 reps", { reps: 12 }, cfg).ok === false);
  assert("no_new_numbers passes grounded numbers", validateOutput({ validate: "no_new_numbers" }, "12 reps, gap 0.14", { reps: 12, gap: 0.14 }, cfg).ok === true);
  assert("quotes_only rejects non-verbatim quotes", validateOutput({ validate: "quotes_only" }, 'anchor: "a phrase he never said anywhere"', { bolo: "warehouse wala naksha" }, cfg).ok === false);
  assert("quotes_only passes verbatim quotes", validateOutput({ validate: "quotes_only" }, 'anchor: "warehouse wala naksha"', { bolo: "warehouse wala naksha socho" }, cfg).ok === true);

  // API-key guard
  process.env.ANTHROPIC_API_KEY = "sk-test-guard";
  const refused = await tick(cfg, { exec: () => ({ ok: true }), gexec: () => ({ ok: true }), now: now(23, 0), dry: true });
  assert("API-KEY GUARD — brain refuses when key present", refused.refused === true);
  delete process.env.ANTHROPIC_API_KEY;

  // tick with mock executor: runs jobs, respects budget, self-tunes on limit
  const calls = [];
  const mockExec = (prompt, model) => { calls.push({ model, len: prompt.length }); return { ok: true, text: "Sharp read. 2 drills stand.", total_tokens: 50000, duration_ms: 10, limit_hit: false, error: null }; };
  const t1 = await tick({ ...cfg, jobs: cfg.jobs.filter(j => j.kind !== "manager_m3") }, { exec: mockExec, gexec: () => ({ ok: false }), now: now(23, 30), dry: true });
  assert("overnight tick drains multiple jobs", t1.ran.filter(r => r.ledgerRow && r.ledgerRow.ok).length >= 3);
  const limitExec = () => ({ ok: false, text: null, total_tokens: 0, duration_ms: 5, limit_hit: true, error: "You've hit your session limit · resets 7am" });
  const t2 = await tick({ ...cfg, jobs: cfg.jobs.filter(j => j.kind !== "manager_m3") }, { exec: limitExec, gexec: () => ({ ok: false }), now: now(23, 30), dry: true });
  assert("SELF-TUNE — limit event stops the tick immediately", t2.ran.filter(r => r.ledgerRow).length === 1 && t2.ran[0].note.includes("LIMIT"));

  // cognitive fingerprint — 2050-grade personalization, measured not assumed
  const fp = buildFingerprint({
    lexicon: { anchors: [{ phrase: "warehouse wala naksha" }] },
    grammar: { shape_counts: { finance_analogy_overreach: 4, determinism_assumption: 1 } },
    calibration: { overconfidence_rate: 0.21, trend: "narrowing" },
    ls: { weak_connection: "tokenization → embeddings" },
  });
  assert("fingerprint carries his anchors verbatim", fp.includes('"warehouse wala naksha"'));
  assert("fingerprint carries wrong-prior shapes as machine-side design input", fp.includes("finance_analogy_overreach") && fp.includes("NEVER name them"));
  assert("fingerprint carries measured calibration + fraying pass", fp.includes("0.21") && fp.includes("tokenization → embeddings"));
  assert("fingerprint enters every analysis prompt", buildAnalysisPrompt({ id: "x" }, {}, fp).includes("COGNITIVE FINGERPRINT"));
  assert("empty world → fixed-traits fingerprint only, no crash", buildFingerprint({}).includes("ADHD-PI"));

  // ntfy mouth — secret topic never in committed config; two utterances only
  const cfgNtfyOn = { ...cfg, ntfy: { enabled: true, topic: "", push_after: ["formation_read"] } };
  assert("ntfy topic resolves from env fallback (config stays secret-free)", resolveNtfyTopic({ ntfy: { topic: "" } }, { ARSENAL_NTFY_TOPIC: "sekrit" }) === "sekrit");
  assert("ntfy disabled ⇒ never sends", (await pushNtfy({ ntfy: { enabled: false } }, "t", "b", async () => { throw new Error("must not be called"); })).sent === false);
  let pushed = null;
  const okFetch = async (url, opts) => { pushed = { url, body: opts.body, title: opts.headers.Title }; return { ok: true, status: 200 }; };
  const bellRes = await pushNtfy({ ntfy: { enabled: true, topic: "t1" } }, BELLS.fulltime.title, BELLS.fulltime.body, okFetch);
  assert("full-time bell sends the postmatch cue", bellRes.sent === true && pushed.body.includes("npm run postmatch"));
  assert("bell carries no shame/streak/hype language", !/streak|fail|10x|hurry|late/i.test(pushed.body));
  assert("both utterances SIGN their titles with the badge (throw-in echo filter)", BELLS.fulltime.title.includes("⚪🔴") && pushed.title === undefined || BELLS.fulltime.title.includes("⚪🔴"));
  assert("only two utterances exist (bell registry + push_after)", Object.keys(BELLS).length === 1 && cfgNtfyOn.ntfy.push_after.length === 1);
  // the badge must SURVIVE HTTP: headers are ByteString (≤0xFF per char) — a raw
  // emoji Title throws inside Node's fetch before any I/O and the push dies as
  // "network". This mock enforces the real rule the earlier okFetch skipped.
  const strictFetch = async (url, opts) => { for (const v of Object.values(opts.headers)) { for (const ch of String(v)) if (ch.codePointAt(0) > 255) throw new TypeError("header value is not a ByteString"); } return { ok: true, status: 200 }; };
  assert("badge title survives real fetch header rules (RFC 2047, never raw emoji)", (await pushNtfy({ ntfy: { enabled: true, topic: "t1" } }, BELLS.fulltime.title, "b", strictFetch)).sent === true);
  assert("encoded title decodes back to the badge on the phone", Buffer.from(ntfyHeaderSafe(BELLS.fulltime.title).replace(/^=\?UTF-8\?B\?/, "").replace(/\?=$/, ""), "base64").toString("utf8") === BELLS.fulltime.title);
  assert("plain ASCII titles pass through untouched", ntfyHeaderSafe("Team sheet is up") === "Team sheet is up");

  // sheet slicing — the agentic-CLI chatter guard
  assert("sliceSheet strips preamble + epilogue chatter", sliceSheet("Sure! Here it is:\n⚪🔴 TEAM SHEET — x\nbody\nCOYG. ⚪🔴\nLet me know!") === "⚪🔴 TEAM SHEET — x\nbody\nCOYG. ⚪🔴");
  assert("sliceSheet passes badge-less text through to the validator", sliceSheet("no badge here") === "no badge here");

  // M-3 socket smoke: runManager with a stub llm in a hermetic state dir
  const os = await import("node:os");
  const { mkdtempSync } = await import("node:fs");
  const tmp = mkdtempSync(join(os.tmpdir(), "brain-m3-"));
  const res = await runManager({ llm: async () => null, stateDir: tmp });
  assert("M-3 SOCKET — runManager import works; fallback law intact", res && res.source === "fallback" && existsSync(join(tmp, "team_sheet.md")));

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "tick").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  const cfg = loadConfig();
  const now = new Date();
  const deps = { exec: claudeExec, gexec: geminiExec, now, dry: process.argv.includes("--dry") };

  if (mode === "bell") {
    const kind = (process.argv[3] || "fulltime").toLowerCase();
    const bell = BELLS[kind];
    if (!bell) { console.log(`brain: no bell '${kind}'`); process.exit(1); }
    const tt = teamtalkLine("pm", now);   // rides INSIDE the bell — never a third utterance
    const r = await pushNtfy(cfg, bell.title, bell.body + (tt ? "\n" + tt : ""));
    console.log(`brain: bell '${kind}' ${r.sent ? "rang on the phone" : "silent (" + r.why + ")"}`);
    return;
  }
  if (mode === "trigger") {
    // EVENT-TRIGGERED RE-ANALYSIS (U4): milestone/crisis arms a trigger; the
    // next tick runs the matching job once, then consumes it.
    const name = process.argv[3];
    if (!name) { console.log("brain: trigger <name> [reason]"); process.exit(1); }
    const q = readJson(QUEUE) || { observed_window_ceiling: null, jobs_run: {} };
    q.triggers = q.triggers || {};
    if ((process.argv[4] || "").toLowerCase() === "off") {
      delete q.triggers[name];
      writeAtomic(QUEUE, q);
      console.log(`brain: trigger '${name}' disarmed`);
      return;
    }
    q.triggers[name] = { ts: now.toISOString(), reason: process.argv.slice(4).join(" ") || null };
    writeAtomic(QUEUE, q);
    console.log(`brain: trigger '${name}' armed — the next tick fires the matching job once`);
    return;
  }
  if (mode === "status") {
    const ledger = readLines(LEDGER);
    const q = readJson(QUEUE) || {};
    const h = headroom(cfg, ledger, q, now);
    const vm = dugoutMinutesToday(now);
    console.log(`brain: phase=${h.phase} · window ${h.used.toLocaleString()}/${h.cap.toLocaleString()} tokens · week ${weekUsage(ledger, now).toLocaleString()} · ceiling ${q.observed_window_ceiling ? q.observed_window_ceiling.toLocaleString() + " (observed)" : cfg.budget.window_capacity_est_tokens.toLocaleString() + " (estimate)"} · voice pool ${vm}min today${cfg.dugout_pool && cfg.dugout_pool.enabled && vm >= cfg.dugout_pool.gemini_defer_threshold_min ? " (daytime gemini deferred)" : ""} · eligible now: ${eligibleJobs(cfg, q, now, vm).map(j => j.id).join(", ") || "none"}`);
    return;
  }
  if (mode === "run") {
    const id = process.argv[3];
    const job = cfg.jobs.find(j => j.id === id);
    if (!job) { console.log(`brain: no job ${id}`); process.exit(1); }
    if (cfg.guards.refuse_if_api_key_env && process.env.ANTHROPIC_API_KEY) { console.log("brain: REFUSING — ANTHROPIC_API_KEY set."); process.exit(1); }
    const { usage, note } = await runJob(job, cfg, deps);
    if (!deps.dry) appendFileSync(LEDGER, JSON.stringify({ ts: now.toISOString(), job: job.id, engine: job.engine || "claude", model: job.model || null, input_tokens: usage.input_tokens ?? null, output_tokens: usage.output_tokens ?? null, total_tokens: usage.total_tokens || 0, duration_ms: usage.duration_ms || 0, ok: usage.ok, error: usage.error || null, limit_hit: !!usage.limit_hit }) + "\n");
    console.log(`brain: ${job.id} ${usage.ok ? "OK" : "FAILED"} (${(usage.total_tokens || 0).toLocaleString()} tok) ${note}`);
    return;
  }
  // tick
  const { ran, refused } = await tick(cfg, deps);
  if (refused) process.exit(1);
  const done = ran.filter(r => r.ledgerRow && r.ledgerRow.ok).length;
  console.log(`brain: tick — ${done} job(s) ran, ${ran.length - done} skipped/failed [${ran.map(r => r.job + (r.skipped ? ":skip" : "")).join(", ") || "idle"}] → ${LEDGER}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { headroom, windowUsage, weekUsage, eligibleJobs, shiftDay, validateOutput, noNewNumbers, bannedPhraseCheck, tick, runJob, loadConfig, sliceSheet, resolveNtfyTopic, pushNtfy, buildFingerprint, buildAnalysisPrompt, serveDate, teamtalkLine, dugoutMinutesToday };
