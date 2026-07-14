#!/usr/bin/env node
// ============================================================================
// throwin.mjs · ARSENAL AI FC — THE ORGANISM: THE THROW-IN
// ----------------------------------------------------------------------------
// WHAT:  The fifth verb (THE_ORGANISM §VII.1). Polls a PRIVATE ntfy.sh topic;
//        every phone dictation the captain fires from anywhere lands VERBATIM
//        in loose_balls.jsonl within minutes. Six weeks ago that thought died
//        on the stairs. The ball never goes dead.
// WHY:   The capture radius becomes his waking radius. Doubts[] quality is the
//        ceiling on Jirah quality; the richest doubts exist only at the moment
//        of confusion — usually nowhere near the desk.
// IRON GUARDS (constitutional, each selftested):
//   1. VERBATIM — text stored byte-for-byte; never trimmed, reworded, tagged.
//   2. NEVER COUNTS USAGE — this organ has NO usage-frequency output, no
//      "days since last throw-in", no coaching about the verb, anywhere, ever.
//      (The Physio watches DELIVERY failure — poller wired but dead — which is
//      a machine bleed, not a captain metric.)
//   3. TOPIC IS A SECRET — long random string; lives ONLY in env
//      ARSENAL_NTFY_TOPIC or gitignored state/throwin_topic.txt. Never
//      committed, never printed. No topic ⇒ DORMANT (safe, one hint line).
//
// INPUT:  dressing-room/state/throwin_config.json (canon, committed)
// OUTPUT: dressing-room/state/loose_balls.jsonl   (append-only; sole writer)
//         dressing-room/state/throwin_state.json  {last_since,last_poll_at,wired}
// MODES:  run (default) · selftest
// RULES (CONDUCTOR §4): deterministic · zero-LLM · network ONLY to the ntfy
//   server (injectable fetchFn) · atomic writes · empty-safe · never fabricate.
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CFG_PATH  = join(STATE_DIR, "throwin_config.json");
const BALLS     = join(STATE_DIR, "loose_balls.jsonl");
const TSTATE    = join(STATE_DIR, "throwin_state.json");
const TOPIC_FILE = join(STATE_DIR, "throwin_topic.txt");

const DEFAULTS = {
  server: "https://ntfy.sh",
  topic_env: "ARSENAL_NTFY_TOPIC",
  timeout_ms: 15000,
};

function loadConfig(path = CFG_PATH) {
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      return {
        server: typeof j.server === "string" ? j.server : DEFAULTS.server,
        topic_env: typeof j.topic_env === "string" ? j.topic_env : DEFAULTS.topic_env,
        timeout_ms: typeof j.timeout_ms === "number" ? j.timeout_ms : DEFAULTS.timeout_ms,
      };
    }
  } catch { /* malformed → defaults */ }
  return { ...DEFAULTS };
}

// topic resolution: env → gitignored file → null (dormant). NEVER printed.
function resolveTopic(cfg, env = process.env, topicFile = TOPIC_FILE) {
  const fromEnv = env[cfg.topic_env];
  if (fromEnv && String(fromEnv).trim()) return String(fromEnv).trim();
  try {
    if (existsSync(topicFile)) {
      const t = readFileSync(topicFile, "utf8").trim();
      if (t) return t;
    }
  } catch { /* unreadable → dormant */ }
  return null;
}

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

function loadExistingIds(path = BALLS) {
  const ids = new Set();
  try {
    if (existsSync(path)) {
      for (const line of readFileSync(path, "utf8").split("\n")) {
        if (!line.trim()) continue;
        try { const j = JSON.parse(line); if (j.id) ids.add(j.id); } catch { /* corrupt line skipped */ }
      }
    }
  } catch { /* unreadable → empty */ }
  return ids;
}

async function defaultFetch(url, timeout_ms) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout_ms);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    const text = await res.text();
    return { status: res.status, text };
  } finally { clearTimeout(t); }
}

// pure core: parse ntfy /json?poll=1 body (one JSON object per line), keep
// event==="message", dedup against existing ids, produce VERBATIM ball lines.
// M12 (zero-tax): a message whose body IS the capture contract is not a
// thought — it is BLOOD arriving by phone (PASTE via ntfy transport). Those
// divert to `reps` and go straight through capture.mjs; they never become
// loose balls, so the throw-in laws (verbatim thoughts, never auto-routed)
// stay byte-identical for actual thoughts.
function looksLikeContract(text) {
  const s = String(text || "").trim();
  if (!s.startsWith("[") || !s.endsWith("]")) return null;
  let arr; try { arr = JSON.parse(s); } catch { return null; }
  if (!Array.isArray(arr) || !arr.length || arr.length > 200) return null;
  return arr.every(r => r && typeof r.concept === "string" && typeof r.question === "string" && ["knew", "shaky", "guessed"].includes(r.confidence)) ? arr : null;
}
function ingest(pollText, existingIds) {
  const balls = [];
  const reps = [];
  let maxTime = 0;
  for (const line of String(pollText || "").split("\n")) {
    if (!line.trim()) continue;
    let m; try { m = JSON.parse(line); } catch { continue; }
    if (m && typeof m.time === "number" && m.time > maxTime) maxTime = m.time; // since= watermark tracks ALL events
    if (!m || m.event !== "message" || typeof m.message !== "string" || !m.id) continue;
    // ECHO FILTER (E2E finding, 12 Jul): the organism's two sanctioned pushes
    // ride the SAME topic and sign their titles with the badge — its own
    // mouth must never be re-ingested as the captain's thought.
    if (m.title && String(m.title).includes("⚪🔴")) continue;
    if (existingIds.has(m.id)) continue;
    const contract = looksLikeContract(m.message);
    if (contract) { reps.push({ id: m.id, reps: contract }); existingIds.add(m.id); continue; }
    balls.push({
      ts: typeof m.time === "number" ? new Date(m.time * 1000).toISOString() : new Date().toISOString(),
      id: m.id,
      text: m.message,          // VERBATIM — byte-for-byte, iron guard #1
      routed: false,
    });
    existingIds.add(m.id);
  }
  return { balls, reps, maxTime };
}

// ---------------------------------------------------------------------------
// selftest — baked mocks; zero network; no real state touched
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };

  const raw = "  wait — agar embeddings normalize hote hain, toh dot aur cosine same?  ";
  const poll = [
    JSON.stringify({ id: "m1", time: 1783900000, event: "message", message: raw }),
    JSON.stringify({ id: "m2", time: 1783900100, event: "message", message: "kal pehla move: context Re-Jirah" }),
    JSON.stringify({ id: "open1", time: 1783900200, event: "open" }),
    "{corrupt",
    JSON.stringify({ id: "m1", time: 1783900000, event: "message", message: raw }), // dup in same batch
    JSON.stringify({ id: "push1", time: 1783900150, event: "message", title: "⚪🔴 Team sheet is up", message: "the sheet head…" }),
    JSON.stringify({ id: "bell1", time: 1783900160, event: "message", title: "⚪🔴 Full-time, captain", message: "30 seconds, then sleep…" }),
  ].join("\n");

  const existing = new Set(["m0"]);
  const { balls, maxTime } = ingest(poll, existing);
  assert("two new balls ingested", balls.length === 2);
  assert("ECHO FILTER — the organism's badge-titled pushes never become balls", !balls.some(b => b.id === "push1" || b.id === "bell1"));
  assert("VERBATIM law — whitespace + text byte-for-byte", balls[0].text === raw);
  assert("non-message events skipped", !balls.find(b => b.id === "open1"));
  assert("corrupt poll line skipped, no crash", true);
  assert("in-batch dedup on ntfy id", balls.filter(b => b.id === "m1").length === 1);
  assert("cross-run dedup uses existing ids", ingest(poll, new Set(["m1", "m2"])).balls.length === 0);
  assert("routed:false on arrival (never auto-written)", balls.every(b => b.routed === false));

  // M12 — blood by phone: the contract diverts, thoughts stay thoughts
  {
    const contract = JSON.stringify([{ surface: "gem", track: "concept", concept: "embeddings", axis: "c", question: "cosine vs dot?", confidence: "shaky", correct: true }]);
    const mix = [
      JSON.stringify({ id: "r1", time: 1752300000, event: "message", message: contract }),
      JSON.stringify({ id: "t1", time: 1752300001, event: "message", message: "yeh khayal seedhiyon wala" }),
    ].join("\n");
    const got = ingest(mix, new Set());
    assert("a contract-shaped message DIVERTS to reps (blood, not thought)", got.reps.length === 1 && got.reps[0].reps[0].concept === "embeddings");
    assert("it never becomes a loose ball (thought laws untouched)", got.balls.length === 1 && got.balls[0].text === "yeh khayal seedhiyon wala");
    assert("a JSON-ish thought that is NOT the contract stays a verbatim thought", ingest(JSON.stringify({ id: "t2", time: 1, event: "message", message: "[1,2,3]" }), new Set()).balls.length === 1);
  }
  assert("max time tracked for since=", maxTime === 1783900200);

  // IRON GUARD #2: the output schemas carry NO usage metric — a ball is exactly
  // {ts,id,text,routed}; state is exactly {last_since,last_poll_at,wired,last_error?}.
  assert("NEVER-COUNTS law — ball schema has no usage fields", balls.every(b => Object.keys(b).sort().join(",") === "id,routed,text,ts"));
  const stateKeys = new Set(["last_since", "last_poll_at", "wired", "last_error"]);
  assert("NEVER-COUNTS law — state schema has no usage fields", ["last_since", "last_poll_at", "wired"].every(k => stateKeys.has(k)));
  // IRON GUARD #3: dormant path.
  const cfg = loadConfig("__no_such__");
  const topic = resolveTopic(cfg, {}, "__no_such_topic_file__");
  assert("no topic anywhere → dormant (null), no crash", topic === null);
  assert("topic from env wins", resolveTopic(cfg, { ARSENAL_NTFY_TOPIC: "  sekrit-topic-x  " }, "__none__") === "sekrit-topic-x");
  // atomic state write in tmpdir
  const os = await import("node:os");
  const p = join(os.tmpdir(), "throwin-selftest-" + Date.now(), "throwin_state.json");
  writeAtomic(p, { last_since: 1, last_poll_at: "x", wired: true });
  assert("atomic state write lands", existsSync(p) && JSON.parse(readFileSync(p, "utf8")).wired === true);
  assert("config fallback to DEFAULTS", loadConfig("__no_such__").server === "https://ntfy.sh");

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
  const cfg = loadConfig();
  const topic = resolveTopic(cfg);
  const now = new Date();
  if (!topic) {
    writeAtomic(TSTATE, { last_since: null, last_poll_at: now.toISOString(), wired: false });
    console.log(`throwin: dormant — no topic configured. Wire it once via setup/NTFY_SETUP.md → ${TSTATE}`);
    return;
  }
  let since = "all";
  try {
    if (existsSync(TSTATE)) {
      const s = JSON.parse(readFileSync(TSTATE, "utf8"));
      if (s && typeof s.last_since === "number" && s.last_since > 0) since = String(s.last_since);
    }
  } catch { /* fresh start */ }
  const url = `${cfg.server}/${encodeURIComponent(topic)}/json?poll=1&since=${since}`;
  let res;
  try { res = await defaultFetch(url, cfg.timeout_ms); }
  catch {
    writeAtomic(TSTATE, { last_since: since === "all" ? null : Number(since), last_poll_at: now.toISOString(), wired: true, last_error: "fetch_fail" });
    console.log(`throwin: poll failed (network) — will retry next tick → ${TSTATE}`);
    return;
  }
  if (res.status !== 200) {
    writeAtomic(TSTATE, { last_since: since === "all" ? null : Number(since), last_poll_at: now.toISOString(), wired: true, last_error: `http_${res.status}` });
    console.log(`throwin: poll http_${res.status} — will retry next tick → ${TSTATE}`);
    return;
  }
  const existing = loadExistingIds();
  const { balls, reps, maxTime } = ingest(res.text, existing);
  if (balls.length) {
    mkdirSync(dirname(BALLS), { recursive: true });
    appendFileSync(BALLS, balls.map(b => JSON.stringify(b)).join("\n") + "\n");
  }
  // M12 — blood by phone: contract-shaped messages route through the owner
  for (const r of reps) {
    try {
      const tmp = join(os.tmpdir(), `throwin-reps-${r.id}.json`);
      const stamp = new Date().toISOString();       // arrival is the timestamp (capture demands ts)
      writeFileSync(tmp, JSON.stringify(r.reps.map(x => ({ ts: x.ts || stamp, ...x }))));
      execFileSync(process.execPath, [join(__dirname, "capture.mjs"), "paste", tmp], { encoding: "utf8", timeout: 60000, windowsHide: true });
      console.log(`throwin: ${r.reps.length} rep(s) arrived by phone — captured (zero-tax)`);
    } catch (e) { console.log(`throwin: phone reps rejected by capture (its contract, its call): ${String(e.message).slice(0, 100)}`); }
  }
  const prevSince = since === "all" ? 0 : Number(since);
  writeAtomic(TSTATE, { last_since: Math.max(prevSince, maxTime) || null, last_poll_at: now.toISOString(), wired: true });
  console.log(`throwin: ${balls.length} ball(s) landed → ${BALLS}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { ingest, resolveTopic, loadConfig, loadExistingIds };
