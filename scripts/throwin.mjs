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
//         dressing-room/state/throwin_state.json
//           {last_since,last_poll_at,wired,rep_ids[,last_error]} — rep_ids is the
//           cross-run dedup memory for phone-delivered cartridges (E2E audit
//           25 Jul 2026: it was documented away here and dropped by three of the
//           four writers; every write now goes through buildState()).
// MODES:  run (default) · selftest
// RULES (CONDUCTOR §4): deterministic · zero-LLM · network ONLY to the ntfy
//   server (injectable fetchFn) · atomic writes · empty-safe · never fabricate.
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, appendFileSync, unlinkSync } from "node:fs";
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

// --- throwin_state.json: ONE reader, ONE builder --------------------------
// E2E audit 25 Jul 2026 found the state file being written from four sites with
// four different shapes: the dormant write nulled last_since and dropped rep_ids,
// and both error writes dropped rep_ids. Because ntfy's since= is INCLUSIVE, the
// newest message re-serves on every poll — so one Wi-Fi blip wiped the dedup
// memory and the next successful poll re-fed the SAME phone session into
// reps_log with a fresh arrival stamp (capture dedups on ts+question, and the
// stamp is new ⇒ a real duplicate). Now: read prior state ONCE before any write,
// and route EVERY write through buildState so no path can silently drop a field.
const STATE_KEYS = new Set(["last_since", "last_poll_at", "wired", "last_error", "rep_ids"]);

function readPriorState(path = TSTATE) {
  try {
    if (existsSync(path)) {
      const s = JSON.parse(readFileSync(path, "utf8"));
      if (s && typeof s === "object") {
        return {
          last_since: typeof s.last_since === "number" && s.last_since > 0 ? s.last_since : null,
          rep_ids: Array.isArray(s.rep_ids) ? s.rep_ids.filter(x => typeof x === "string") : [],
        };
      }
    }
  } catch { /* unreadable/corrupt → fresh start (same as before) */ }
  return { last_since: null, rep_ids: [] };
}

// prior carries forward unless the caller explicitly overrides. last_error is
// omitted (not null) on healthy writes so the schema stays exactly STATE_KEYS.
function buildState({ prior = {}, last_poll_at, wired, last_since, rep_ids, last_error }) {
  const carriedIds = Array.isArray(rep_ids) ? rep_ids
    : (Array.isArray(prior.rep_ids) ? prior.rep_ids : []);
  const st = {
    last_since: last_since !== undefined ? last_since
      : (typeof prior.last_since === "number" ? prior.last_since : null),
    last_poll_at,
    wired: !!wired,
    rep_ids: carriedIds.slice(-100),
  };
  if (last_error) st.last_error = last_error;
  return st;
}

// since= watermark. retryFloor = the earliest cartridge whose capture verdict is
// UNKNOWN (capture crashed/timed out): hold the watermark down to it so ntfy's
// inclusive since= re-serves that message next tick. Balls re-dedup on id, landed
// reps re-dedup on rep_ids, so re-serving is cheap and lossless.
function nextWatermark(prevSince, maxTime, retryFloor = Infinity) {
  const w = Math.max(Number(prevSince) || 0, Number(maxTime) || 0) || null;
  if (!Number.isFinite(retryFloor) || retryFloor <= 0) return w;
  return w === null ? retryFloor : Math.min(w, retryFloor);
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
// mirrored from capture.mjs (AXES) — NOT imported: capture stays the validator of
// record, this is only the diversion gate deciding "blood or thought".
const CONTRACT_AXES = new Set("abcdefghi".split(""));
function looksLikeContract(text) {
  const s = String(text || "").trim();
  if (!s.startsWith("[") || !s.endsWith("]")) return null;
  let arr; try { arr = JSON.parse(s); } catch { return null; }
  if (!Array.isArray(arr) || !arr.length || arr.length > 200) return null;
  // E2E audit 25 Jul 2026: this gate used to pass on {concept,question,confidence}
  // alone — LOOSER than capture.mjs validateRep, which HARD-REJECTS axis===undefined
  // ("axis missing (use null)") and non-boolean `correct`. A near-miss cartridge was
  // therefore diverted AWAY from loose_balls.jsonl (the only verbatim, recoverable
  // store), handed to capture, rejected, and gone — silently, forever. The gate now
  // demands the FULL documented contract [{concept,axis,question,confidence,correct}];
  // anything short of it falls through and is kept VERBATIM as a loose ball, which the
  // captain can still recover by hand. Divert only what capture will certainly take.
  return arr.every(r => r
    && typeof r.concept === "string" && r.concept.trim() !== ""
    && typeof r.question === "string" && r.question.trim() !== ""
    && ["knew", "shaky", "guessed"].includes(r.confidence)
    && typeof r.correct === "boolean"
    && r.axis !== undefined                                   // capture: field required, null allowed
    && (r.axis === null || CONTRACT_AXES.has(r.axis))         // capture: non-null ⇒ a..i
    && !(r.track === "skill" && r.axis !== null)              // capture: skill MUST carry axis null
  ) ? arr : null;
}
// the documented cartridge contract is [{concept,axis,question,confidence,correct}]
// — no surface/track (the Gem doesn't know transport). The PHONE LANE owns those
// defaults; explicit fields still win, and capture remains the validator of record.
// ts rides AFTER the spread so a model's "ts": null never erases the stamp.
function completeReps(arr, stamp) {
  return arr.map(x => ({ surface: "gem", track: "concept", ...x, ts: x.ts || stamp }));
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
    // `time` rides along (additive, E2E audit 25 Jul 2026) so main() can clamp the
    // since= watermark back to a cartridge whose capture verdict never came in —
    // an id that is not burned is useless if ntfy will never re-serve the message.
    if (contract) { reps.push({ id: m.id, time: typeof m.time === "number" ? m.time : 0, reps: contract }); existingIds.add(m.id); continue; }
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
  // AUDIT #76 (4 Aug 2026) — this was `assert("corrupt poll line skipped, no crash", true)`:
  // a LITERAL that could not fail, guarding the one branch that decides whether a
  // single malformed byte from ntfy costs him a whole 15-minute poll. It is now
  // three real claims: the junk never becomes a thought, a poll made ENTIRELY of
  // junk returns empty instead of throwing, and — the load-bearing one — the
  // since= watermark still advances past the corrupt line (1783900200 is the
  // `open1` event above, the newest `time` in the batch). If the parse threw, the
  // watermark would stall and every later poll would re-serve the same window.
  assert("corrupt poll line skipped — it never becomes a ball, and the watermark still advances past it",
    !balls.some(b => String(b.text).includes("{corrupt"))
    && maxTime === 1783900200
    && ingest("{corrupt\n{\"id\":\"x\",\"event\":\n\nnot json at all", new Set()).balls.length === 0);
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
    // the DOCUMENTED cartridge contract has no surface/track — the phone lane
    // fills the transport defaults; explicit fields win; ts:null gets stamped
    const bare = [{ concept: "embeddings", axis: "c", question: "cosine vs dot?", confidence: "shaky", correct: true, ts: null }];
    const filled = completeReps(bare, "2026-07-12T10:00:00Z");
    assert("CARTRIDGE CONTRACT lands: surface/track defaults filled by the lane", filled[0].surface === "gem" && filled[0].track === "concept");
    assert("a model's ts:null never erases the arrival stamp", filled[0].ts === "2026-07-12T10:00:00Z");
    assert("explicit surface/track always win over the defaults", completeReps([{ surface: "colab", track: "skill", concept: "x", question: "q", confidence: "knew" }], "t")[0].surface === "colab");
    // ntfy since= is inclusive — a diverted rep id must dedupe on the NEXT poll too
    const again = ingest(mix, new Set(["r1"]));
    assert("PERSISTED rep id blocks the re-served message (no 15-min duplicates)", again.reps.length === 0 && again.balls.length === 1);

    // E2E audit 25 Jul 2026 — the diversion gate must not be LOOSER than capture's
    // validateRep. A near-miss cartridge diverted out of loose_balls and then
    // hard-rejected by capture is a session that no longer exists anywhere.
    const nearMiss = (body) => {
      const g = ingest(JSON.stringify({ id: "nm", time: 1752300009, event: "message", message: body }), new Set());
      return g.reps.length === 0 && g.balls.length === 1 && g.balls[0].text === body;   // kept VERBATIM, recoverable
    };
    assert("near-miss cartridge (axis MISSING — capture hard-rejects) stays a verbatim loose ball",
      nearMiss(JSON.stringify([{ concept: "embeddings", question: "cosine vs dot?", confidence: "shaky", correct: true }])));
    assert("near-miss cartridge (correct:\"yes\", not a boolean) stays a verbatim loose ball",
      nearMiss(JSON.stringify([{ concept: "embeddings", axis: "c", question: "q?", confidence: "shaky", correct: "yes" }])));
    assert("near-miss cartridge (axis not a..i) stays a verbatim loose ball",
      nearMiss(JSON.stringify([{ concept: "embeddings", axis: "z", question: "q?", confidence: "knew", correct: false }])));
    assert("near-miss cartridge (track:skill carrying an axis — capture rejects) stays a verbatim loose ball",
      nearMiss(JSON.stringify([{ track: "skill", concept: "pydantic", axis: "a", question: "q?", confidence: "knew", correct: true }])));
    assert("axis:null is the DOCUMENTED contract and still diverts (skill lane)",
      ingest(JSON.stringify({ id: "ok2", time: 1752300010, event: "message", message: JSON.stringify([{ track: "skill", concept: "pydantic", axis: null, question: "q?", confidence: "knew", correct: true }]) }), new Set()).reps.length === 1);
    // one bad rep poisons the batch on capture's side, so the whole message stays a ball
    assert("a MIXED array (one rep short of contract) stays a verbatim loose ball",
      nearMiss(JSON.stringify([{ concept: "a", axis: "b", question: "q", confidence: "knew", correct: true }, { concept: "b", question: "q2", confidence: "knew", correct: true }])));
    assert("diverted reps carry their ntfy time (watermark clamp needs it)",
      got.reps[0].time === 1752300000);
  }
  assert("max time tracked for since=", maxTime === 1783900200);

  // IRON GUARD #2: the output schemas carry NO usage metric — a ball is exactly
  // {ts,id,text,routed}; state is exactly {last_since,last_poll_at,wired,rep_ids,last_error?}
  // — rep_ids is machine dedup memory (ids only, no counts), never a captain metric.
  assert("NEVER-COUNTS law — ball schema has no usage fields", balls.every(b => Object.keys(b).sort().join(",") === "id,routed,text,ts"));
  // E2E audit 25 Jul 2026: the old version of this check built a hardcoded Set and
  // then asked whether that same hardcoded list was in it — a tautology that could
  // never fail and never looked at anything main() writes. It now exercises the REAL
  // writer (buildState, the single source of every throwin_state.json write).
  {
    const written = [
      buildState({ prior: { last_since: 9, rep_ids: ["r1"] }, last_poll_at: "t", wired: false }),                    // dormant
      buildState({ prior: { last_since: 9, rep_ids: ["r1"] }, last_poll_at: "t", wired: true, last_error: "fetch_fail" }),
      buildState({ prior: { last_since: 9, rep_ids: ["r1"] }, last_poll_at: "t", wired: true, last_since: 12, rep_ids: ["r1", "r2"] }),
    ];
    assert("NEVER-COUNTS law — every state the real writer emits is a subset of {last_since,last_poll_at,wired,last_error,rep_ids}",
      written.every(st => Object.keys(st).every(k => STATE_KEYS.has(k))));
    // ntfy since= is inclusive → losing rep_ids on a blip re-feeds the same session
    // to capture with a FRESH stamp, and capture dedups on ts+question, so it lands twice.
    assert("dormant write PRESERVES rep_ids and last_since (never resets the poller to 'all')",
      written[0].rep_ids.length === 1 && written[0].rep_ids[0] === "r1" && written[0].last_since === 9 && written[0].wired === false);
    assert("fetch/http error write PRESERVES rep_ids (no duplicate reps after a Wi-Fi blip)",
      written[1].rep_ids[0] === "r1" && written[1].last_since === 9 && written[1].last_error === "fetch_fail");
    assert("healthy write carries NO last_error key at all", !("last_error" in written[2]) && written[2].rep_ids.length === 2);
    assert("rep_ids memory stays bounded at 100", buildState({ last_poll_at: "t", wired: true, rep_ids: Array.from({ length: 250 }, (_, i) => "x" + i) }).rep_ids.length === 100);
    // prior state is read (not guessed) before any write
    // NB: `os` is re-declared with const further down this function (TDZ), so the
    // tmpdir is pulled inline here rather than through that shadowed binding.
    const sp = join((await import("node:os")).tmpdir(), "throwin-selftest-prior-" + Date.now(), "throwin_state.json");
    writeAtomic(sp, { last_since: 77, last_poll_at: "t", wired: true, rep_ids: ["a", 5, "b"] });
    const rp = readPriorState(sp);
    assert("readPriorState round-trips last_since + rep_ids (non-strings dropped)", rp.last_since === 77 && rp.rep_ids.join(",") === "a,b");
    assert("readPriorState on a missing file is empty-safe", readPriorState("__no_such_state__").last_since === null && readPriorState("__no_such_state__").rep_ids.length === 0);
    // watermark: a cartridge whose capture verdict never came must be re-served
    assert("watermark advances normally when every cartridge settled", nextWatermark(100, 500, Infinity) === 500);
    assert("watermark is HELD BACK to an unsettled cartridge (inclusive since= re-serves it)", nextWatermark(100, 500, 300) === 300);
    assert("first-ever poll with nothing seen stays null", nextWatermark(0, 0, Infinity) === null);
    // every TSTATE writer must go through buildState — this is what stops a future
    // refactor from re-introducing a bespoke state literal that drops rep_ids.
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
    const writers = src.match(/writeAtomic\(TSTATE,\s*[A-Za-z]*/g) || [];
    assert("ALL throwin_state.json writers route through buildState (no bespoke literals)",
      writers.length >= 4 && writers.every(w => w.endsWith("buildState")));
  }
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
  // E2E audit 25 Jul 2026: prior state is read BEFORE the dormant branch — the
  // dormant write used to fire without ever reading, so a momentarily unreadable
  // topic (env not injected by the scheduler, file locked) reset the watermark to
  // "all" AND erased rep_ids, replaying the whole topic on the next wired poll.
  const prior = readPriorState();
  const priorRepIds = prior.rep_ids;
  if (!topic) {
    writeAtomic(TSTATE, buildState({ prior, last_poll_at: now.toISOString(), wired: false }));
    console.log(`throwin: dormant — no topic configured. Wire it once via setup/NTFY_SETUP.md → ${TSTATE}`);
    return;
  }
  const since = prior.last_since ? String(prior.last_since) : "all";
  const url = `${cfg.server}/${encodeURIComponent(topic)}/json?poll=1&since=${since}`;
  let res;
  try { res = await defaultFetch(url, cfg.timeout_ms); }
  catch {
    writeAtomic(TSTATE, buildState({ prior, last_poll_at: now.toISOString(), wired: true, last_error: "fetch_fail" }));
    console.log(`throwin: poll failed (network) — will retry next tick → ${TSTATE}`);
    return;
  }
  if (res.status !== 200) {
    writeAtomic(TSTATE, buildState({ prior, last_poll_at: now.toISOString(), wired: true, last_error: `http_${res.status}` }));
    console.log(`throwin: poll http_${res.status} — will retry next tick → ${TSTATE}`);
    return;
  }
  const existing = loadExistingIds();
  // ntfy's since= is INCLUSIVE, so the newest message re-serves every poll —
  // diverted rep-message ids must persist across runs or the same session
  // re-ingests every 15 minutes with a fresh arrival stamp (new dedup key).
  for (const id of priorRepIds) existing.add(id);
  const { balls, reps, maxTime } = ingest(res.text, existing);
  if (balls.length) {
    mkdirSync(dirname(BALLS), { recursive: true });
    appendFileSync(BALLS, balls.map(b => JSON.stringify(b)).join("\n") + "\n");
  }
  // M12 — blood by phone: contract-shaped messages route through the owner.
  // The lane fills the transport defaults (the cartridge contract carries no
  // surface/track) and repeats CAPTURE'S OWN COUNTS — never a fabricated success.
  // E2E audit 25 Jul 2026: an id used to be burned into rep_ids even when capture
  // never rendered a verdict (crash / 60s timeout / capture.mjs missing) — the
  // cartridge was neither in reps_log nor in loose_balls: gone. Now an id is
  // recorded only once capture has actually SPOKEN (accepted or rejected — both are
  // deterministic, so re-running would only repeat itself). A crashed invocation
  // leaves the id unburned and drags the watermark back to that message's time.
  const settledRepIds = [];
  let retryFloor = Infinity;
  for (const r of reps) {
    try {
      const tmp = join(os.tmpdir(), `throwin-reps-${r.id}.json`);
      const stamp = new Date().toISOString();       // arrival is the timestamp (capture demands ts)
      writeFileSync(tmp, JSON.stringify(completeReps(r.reps, stamp)));
      let out = "";
      try { out = execFileSync(process.execPath, [join(__dirname, "capture.mjs"), "paste", tmp], { encoding: "utf8", timeout: 60000, windowsHide: true }); }
      finally { try { unlinkSync(tmp); } catch { } }
      settledRepIds.push(r.id);                     // capture ran to completion — verdict is final
      const mm = String(out || "").match(/appended (\d+), rejected (\d+)/);
      if (mm && Number(mm[1]) === 0) console.log(`throwin: phone reps ALL rejected by capture (rejected ${mm[2]}) — the session did NOT land; check the cartridge shape`);
      else console.log(`throwin: ${mm ? mm[1] : r.reps.length} rep(s) arrived by phone — captured (zero-tax)`);
    } catch (e) {
      if (r.time) retryFloor = Math.min(retryFloor, r.time);
      console.log(`throwin: capture did not answer for a phone cartridge — id NOT burned, retrying next tick: ${String(e.message).slice(0, 100)}`);
    }
  }
  const prevSince = since === "all" ? 0 : Number(since);
  writeAtomic(TSTATE, buildState({
    prior, last_poll_at: now.toISOString(), wired: true,
    last_since: nextWatermark(prevSince, maxTime, retryFloor),
    rep_ids: priorRepIds.concat(settledRepIds),
  }));
  console.log(`throwin: ${balls.length} ball(s) landed → ${BALLS}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { ingest, resolveTopic, loadConfig, loadExistingIds, completeReps, readPriorState, buildState, nextWatermark };
