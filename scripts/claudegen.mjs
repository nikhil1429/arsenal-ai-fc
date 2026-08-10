#!/usr/bin/env node
// ============================================================================
// claudegen.mjs · ARSENAL AI FC — THE SHARED CLAUDE ENGINE (one pattern, many organs)
// ----------------------------------------------------------------------------
// WHAT:  The single, battle-tested way any organ speaks to Claude: `claude -p`
//        on the Max subscription (mirrors brain.mjs claudeExec, which stays
//        frozen in place — layering, never replace). Born 17 Jul 2026 when the
//        Gemini free tier shrank to ~20 req/day and the captain ordered all
//        cognition onto the engine that never runs dry.
// LAWS:  NO METERED KEY, EVER — refuses if ANTHROPIC_API_KEY is set.
//        Sync flavor for batch organs (nightshift, dmn, council); ASYNC flavor
//        for daemons (thalamus) — a daemon's event loop never blocks on a CLI.
// ============================================================================

import { execFileSync, execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";   // readFileSync: the selftest's WIRE scan of the callers (10 Aug 2026)
import { join } from "node:path";

// ── THE LIMIT CLASSIFIER (organism audit 4 Aug 2026, issue #8) ──────────────
// LIMIT_RE_LEGACY is the PRE-AUDIT regex, frozen verbatim (layering law). It is
// no longer the plan of record: it decided "is this a rate limit?" by scanning
// PROSE — including a bare `429` — across an entire CLI JSON envelope, so any
// three digits anywhere (a duration_ms, a cost, a uuid) read as a quota death.
// One such misfire on 1 Aug 2026 at 01:48 IST wrote a Gemini 429 onto five tanks
// whose Gemini quota was never touched and took the Rest Room down for ~22h.
const LIMIT_RE_LEGACY = /limit|rate.?limit|quota|overloaded|429/i;
//
// THE PLAN OF RECORD — structured field first, tight prose only as the fallback.
// Measured over the live dressing-room/state/brain_ledger.jsonl (2,882 rows) on
// 4 Aug 2026:
//   · 312 rows carry limit_hit:true
//   · 310 of those carry the CLI's own structured `"api_error_status":429`
//   ·   2 of those carry NO status field at all — and both are the demonstrated
//       FALSE POSITIVES (`{"is_error":true,…,"stop_reason":"stop_sequence",…}`,
//       job evening_voice, 29 Jul 16:24 + 16:39). 310/312 = the structured field
//       is the signal; the loose prose scan is the noise.
//   ·   2 further rows carry limit_hit:FALSE while their text reads verbatim
//       "You've hit your session limit · resets 8:30pm" (cortex_wake, 18 Jul) —
//       so the prose lane must stay, as a fallback, for envelopes with no status.
// The status field is read first; the prose phrases below are anchored to the
// real strings the CLI actually emits, and `429` as a bare number is GONE.
const LIMIT_PHRASE_RE = /hit your (?:weekly|session|usage|5-hour|five-hour) limit|(?:usage|session|weekly|rate) limit reached|rate.?limit(?:ed|_error)?|too many requests|overloaded_error|\boverloaded\b|quota (?:exceeded|exhausted|reached)|resets \d/i;
const API_STATUS_RE = /"api_error_status"\s*:\s*(\d{3})\b/;
// 429 = the plan/rate wall · 529 = upstream overloaded. Both mean "back off";
// neither is invented — both are codes the CLI stamps into the envelope itself.
const LIMIT_STATUS = new Set([429, 529]);
// The pre-audit code kept 200 chars of error text. The two false-positive rows
// above are truncated at EXACTLY 200 chars, one field short of the evidence that
// would have exonerated the tanks — the forensics were cut off by the slice.
// 600 keeps the whole `{…,"api_error_status":…,"result":"<the human message>"}`
// prefix of every real envelope observed in the ledger.
const ERR_KEEP = 600;
function classifyLimit(envelope, resultText) {
  const st = API_STATUS_RE.exec(String(envelope || ""));
  if (st) {
    const code = Number(st[1]);
    return { limit_hit: LIMIT_STATUS.has(code), http_status: code, limit_signal: "api_error_status" };
  }
  // no structured status → fall back to the human message ONLY (never the whole
  // envelope: that is what let a session_id or a duration read as a quota death)
  const hay = String(resultText !== undefined && resultText !== null && resultText !== "" ? resultText : envelope || "");
  if (LIMIT_PHRASE_RE.test(hay)) return { limit_hit: true, http_status: null, limit_signal: "phrase" };
  return { limit_hit: false, http_status: null, limit_signal: "none" };
}
// E2E audit 25 Jul 2026: this used to return the %APPDATA%\npm\claude.cmd shim
// UNCONDITIONALLY. That path does not exist under the native installer (the CLI
// lives at ~/.local/bin/claude.exe, on PATH), so EVERY organ on this engine died
// with a silent spawn EINVAL — nightshift, dmn, council, thalamus's adjudicator.
// Now mirrors brain.mjs:421-428, the pattern that was always correct: probe for
// the shim, else the bare name; .cmd needs shell:true on Node 22 (CVE-2024-27980).
const BIN = () => {
  if (process.platform === "win32" && process.env.APPDATA) {
    const shim = join(process.env.APPDATA, "npm", "claude.cmd");
    if (existsSync(shim)) return shim;
  }
  return "claude";
};
// zero argv strings carry spaces (fixed flags only) and the prompt rides stdin,
// so shell:true here cannot become an injection surface.
const needsShell = (bin) => bin.endsWith(".cmd");
// LADDER G0 (9 Aug 2026): THE LEAN FLAGS RIDE THIS ENGINE TOO. brain.mjs proved
// them 6 Aug — measured 88.5% off a bare probe, 57.5% off 11 real jobs
// (brain.mjs:867-880) — while every DMN/nightshift/council/adjudicator call
// through HERE kept paying the ~44k full-CLI boot tax (DMN alone: 58.7M real
// tokens in 3 days, mostly this). Same prompt discipline as brain's
// ORGAN_SYSTEM_PROMPT (mirrored verbatim — one law, two engines), same
// reversibility: ARSENAL_CLAUDEGEN_FULL=1 restores the old invocation verbatim.
// SHIM GUARD: the lean system-prompt carries spaces, which shell:true (the .cmd
// path) would mangle — so a shimmed box keeps the full CLI and SAYS so via the
// env probe below, never silently. This box runs the native exe (verified 9 Aug:
// ~/.local/bin/claude.exe, no %APPDATA% shim), so lean is live here.
const ORGAN_SYSTEM_PROMPT =
  "You are a deterministic text transformer inside a personal accountability system. "
  + "Everything you need is in the prompt: data is embedded, never fetched. "
  + "Return ONLY what the prompt asks for — no preamble, no commentary, no apology, "
  + "and no markdown fences unless the prompt explicitly asks for them.";
const LEAN_ARGS = ["--system-prompt", ORGAN_SYSTEM_PROMPT, "--tools", "", "--strict-mcp-config"];
const ARGS = (model) => {
  const base = ["-p", "--output-format", "json", "--model", model || "sonnet"];
  if (process.env.ARSENAL_CLAUDEGEN_FULL === "1") return base;
  if (needsShell(BIN())) return base;   // spaced args + shell:true don't mix — full CLI, out loud in the ledger's spend
  return [...base, ...LEAN_ARGS];
};

// audit 4 Aug 2026 (#7): the token SPLIT now rides every result. The DMN meters
// its ~57 nightly calls into brain_ledger.jsonl and the ledger's own honesty law
// is that an unmeasured number is null, never 0 — so a missing usage block gives
// null components and `tokens_estimated: true` beside the length-derived total.
function parseOut(stdout, prompt, t0) {
  let text = stdout, inTok = null, outTok = null, cacheCreate = null, cacheRead = null, isErr = false;
  let envelope = String(stdout || ""), resultText = null;
  try {
    const j = JSON.parse(stdout);
    resultText = j.result !== undefined ? String(j.result) : null;
    text = resultText !== null ? resultText : stdout;
    isErr = j.is_error === true;
    if (j.usage) {
      inTok = j.usage.input_tokens ?? null; outTok = j.usage.output_tokens ?? null;
      cacheCreate = j.usage.cache_creation_input_tokens ?? null;
      cacheRead = j.usage.cache_read_input_tokens ?? null;
    }
  } catch { /* non-json → raw text */ }
  // LADDER G1 (9 Aug 2026): THE HONEST METER — all four usage fields sum into
  // total_tokens. The old in+out pair saw ~1.7% of real spend (the cache pair is
  // where a CLI call's bulk lives; DMN under-reported 57.3×). NOTE, measured
  // context: 58.7M real tokens in 3.5 days on a 24M plan drew only 3 limit rows
  // — the PLAN does not charge cache reads at full weight, so this honest total
  // OVER-weights vs the wall. That is a MEASUREMENT WINDOW (his no-guessed-
  // numbers law): record honest totals now, fit lane-weights to observed limit
  // events before trusting any governor arithmetic built on them.
  const measured = (inTok || 0) + (outTok || 0) + (cacheCreate || 0) + (cacheRead || 0);
  const total = measured || Math.ceil((String(prompt).length + String(text).length) / 4);
  const cls = isErr ? classifyLimit(envelope, resultText) : { limit_hit: false, http_status: null, limit_signal: "none" };
  return {
    ok: !isErr, text, total_tokens: total,
    input_tokens: inTok, output_tokens: outTok, cache_creation_tokens: cacheCreate, cache_read_tokens: cacheRead,
    tokens_estimated: !measured,
    duration_ms: Date.now() - t0,
    limit_hit: cls.limit_hit, http_status: cls.http_status, limit_signal: cls.limit_signal,
    // FORENSICS (#8): a 22-hour outage used to leave nothing but a timestamp.
    // The envelope prefix is kept, because the discriminating field lives in it.
    error: isErr ? String(resultText !== null ? resultText : envelope).slice(0, ERR_KEEP) : null,
    error_envelope: isErr ? envelope.slice(0, ERR_KEEP) : null,
    // ONE shape across all three producers (THE SILENT KILL repair, 10 Aug 2026
    // — see resolveChild below): a reader must never have to ask whether the
    // field exists. A parsed envelope means the child SPOKE; resolveChild is the
    // only place that knows whether it also FINISHED, so it stamps these.
    killed: false, kill_signal: null,
  };
}
function parseErr(e, prompt, t0) {
  const killed = !!(e.killed || e.signal);
  // THE KILL IS NAMED IN THE TEXT TOO (10 Aug 2026). Probed on this box: a
  // timed-out execFile hands back `err.message === "Command failed: <cmd>"` and
  // NOTHING else — no "timeout", no "SIGTERM", and `err.stdout` is undefined.
  // Every reader of a failure in this organism reads TEXT (brain.mjs:662
  // forensicText → the dead-brain hint, watchman's token_health line, the
  // doctor), so a kill that lives only in a new field is a kill nobody reads.
  // The duration is DERIVED from t0, not a threshold — it is how long the call
  // actually ran before the axe, which is the one number that tells him whether
  // the ceiling was hit or the CLI hung early.
  const kmark = killed ? `KILLED (${e.signal || "no-signal"}) after ${Date.now() - t0}ms — the CLI was cut off, not answered. ` : "";
  const msg = kmark + String((e.stderr || "") + (e.stdout || "") + e.message);
  // a thrown spawn/timeout carries no `result` field — the envelope IS the message
  const cls = classifyLimit(msg, null);
  return {
    ok: false, text: null, total_tokens: Math.ceil(String(prompt).length / 4),
    input_tokens: null, output_tokens: null, cache_creation_tokens: null, cache_read_tokens: null,
    tokens_estimated: true,
    duration_ms: Date.now() - t0,
    limit_hit: cls.limit_hit, http_status: cls.http_status, limit_signal: cls.limit_signal,
    error: msg.slice(0, ERR_KEEP), error_envelope: msg.slice(0, ERR_KEEP),
    // the SYNC lane gets this for free: execFileSync's thrown error carries
    // `.signal === "SIGTERM"` on a timeout, so nightshift's five claudeGen sites
    // now name their own kills without a line of their own changing.
    killed, kill_signal: e.signal || null,
  };
}
const refuse = () => ({ ok: false, text: null, total_tokens: 0, input_tokens: null, output_tokens: null, cache_creation_tokens: null, cache_read_tokens: null, tokens_estimated: false, duration_ms: 0, limit_hit: false, http_status: null, limit_signal: "none", error: "REFUSED — ANTHROPIC_API_KEY set (subscription only, ever)", error_envelope: null, killed: false, kill_signal: null });

// ── THE SILENT KILL (wiring audit, 10 Aug 2026) ─────────────────────────────
// claudeGenAsync's callback used to branch on "an error AND no stdout at all".
// A child killed at the timeout AFTER flushing any bytes therefore landed in
// parseOut — where a truncated envelope fails JSON.parse and is swallowed by the
// deliberate raw-text lane at :122. The call came back **ok:true, error:null,
// limit_hit:false, with a FRAGMENT as the answer.** PROBED LIVE on this box,
// 10 Aug 2026 (execFile, timeout 600ms, child writes
// `{"type":"result","is_error":false,"result":"partial answ` then hangs):
//   err.killed=true · err.signal=SIGTERM · err.code=null · err.stdout=undefined
//   → the old expression routed it to parseOut.
// Timeouts are not hypothetical on this lane: 18 dmn rows died at duration_ms
// ≈301,000 (the 300s default) on 8 Aug, council caps a chair at 20s
// (council.mjs:190) and the thalamus adjudicator at 15s (thalamus.mjs:1137) —
// and that adjudicator's verdict is literally `text.startsWith("y")` on this
// string, so a fragment beginning "y" woke the expensive brain on a call that
// never finished, while a killed chair took a seat with half a sentence.
// THE RULE — `err` is the only truth about whether the child FINISHED:
//   · no err              → parseOut, byte-for-byte as before (a clean raw-text
//                           pass-through stays legal — that is a real lane, and
//                           the selftest above pins it).
//   · err + COMPLETE json → still parseOut: the CLI runs --output-format json,
//                           so a parseable envelope is a WHOLE envelope, and it
//                           carries the usage block and api_error_status that
//                           parseErr would throw away. The plan-wall shape
//                           (non-zero exit + full 429 envelope) must keep them.
//   · err + anything else → parseErr, with the partial stdout folded in BY HAND:
//                           execFile's error carries no `.stdout` (probed), so
//                           the fragment survives only if this passes it.
// Either way the kill is stamped, in the field and in the error text.
const jsonWhole = (s) => { if (!String(s).trim()) return false; try { JSON.parse(s); return true; } catch { return false; } };
function resolveChild(err, stdout, prompt, t0) {
  const out = String(stdout || "");
  if (!err) return parseOut(out, prompt, t0);
  if (!jsonWhole(out)) {
    // parseErr writes ok:false by construction — a fragment is never an answer.
    return parseErr({ message: String((err && err.message) || err), stdout: out, stderr: "", killed: err.killed, signal: err.signal }, prompt, t0);
  }
  const r = parseOut(out, prompt, t0);
  // it SPOKE in full and then died: keep the answer and the meter, say the axe
  // fell. ok still follows the envelope's own is_error — discarding a complete
  // reply because the exit code was ugly would trade one silent lie for another.
  r.killed = !!(err.killed || err.signal);
  r.kill_signal = err.signal || null;
  return r;
}
// FROZEN VERBATIM (layering law) — the pre-10-Aug branch, the one that reported a
// SIGTERM'd call as a success. Kept because every claudegen-produced row already
// on brain_ledger.jsonl came from it: an `ok:true` row with a short `text` and no
// error was NOT necessarily a call that finished. Read the history with this
// function in hand, not the one above.
const resolveChildLegacy = (err, stdout, prompt, t0) => (err && !stdout ? parseErr(err, prompt, t0) : parseOut(stdout || "", prompt, t0));

// ── THE LEDGER PROJECTION (wiring audit, 10 Aug 2026) ───────────────────────
// #8 BUILT the forensics above and not one caller carried them. Measured on the
// live dressing-room/state/brain_ledger.jsonl the same morning — 4,558 rows,
// 2,587 of them failures:
//   ·     0 rows carry error_envelope. Every caller hand-writes its own row
//         literal and none of them copied the field across, so the #8 repair
//         stopped at this door and a failure's cause stayed unrecoverable.
//   ·     3 rows carry http_status (dmn.mjs, the only caller that ever wired
//         it) — while 2,365 of the 2,587 failures have `"api_error_status":…`
//         sitting UNPARSED inside their error text. The discriminator was on
//         disk for weeks with nobody reading it.
// ONE shape, spread by every caller, so the next caller cannot forget a field.
// error_envelope rides ONLY when it says more than `error` already does:
// parseErr sets the two to the same string, and parseOut differs only when the
// CLI returned a `result` (the plan-wall shape). A null therefore means "the
// envelope IS the error field" — a reader takes `row.error_envelope || row.error`,
// never the envelope alone (brain.mjs failureStreak does exactly that). That
// rule keeps a 600-char blob off ~95% of failure rows in a journal brain.mjs
// rolls at 2 MB (brain.mjs:2285), so forensics cost retention nothing.
function ledgerForensics(r) {
  const o = r || {};
  return {
    error_envelope: (o.error_envelope && o.error_envelope !== o.error) ? o.error_envelope : null,
    http_status: Number.isFinite(o.http_status) ? o.http_status : null,
    limit_signal: o.limit_signal || null,
    // THE KILL RIDES THE ROW TOO (the SILENT KILL repair, same day). A timeout is
    // a death the other two fields cannot describe: no status, no limit phrase —
    // http_status stays null and the cause reads "unknown" forever. Same "say it
    // only when it says something" rule as error_envelope: null when the child
    // finished, so a healthy row grows by nothing.
    killed: o.killed === true ? true : null,
    kill_signal: o.kill_signal || null,
  };
}

function claudeGen(prompt, model = "sonnet", timeoutMs = 300000) {
  if (process.env.ANTHROPIC_API_KEY) return refuse();
  const t0 = Date.now();
  const bin = BIN();
  try {
    const stdout = execFileSync(bin, ARGS(model), { input: String(prompt), timeout: timeoutMs, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], windowsHide: true, shell: needsShell(bin), env: { ...process.env, ARSENAL_ORGAN: "1" } });
    return parseOut(stdout, prompt, t0);
  } catch (e) { return parseErr(e, prompt, t0); }
}

function claudeGenAsync(prompt, model = "sonnet", timeoutMs = 300000) {
  if (process.env.ANTHROPIC_API_KEY) return Promise.resolve(refuse());
  const t0 = Date.now();
  const bin = BIN();
  return new Promise((resolve) => {
    const child = execFile(bin, ARGS(model), { timeout: timeoutMs, encoding: "utf8", windowsHide: true, maxBuffer: 8 * 1024 * 1024, shell: needsShell(bin), env: { ...process.env, ARSENAL_ORGAN: "1" } },
      (err, stdout) => resolve(resolveChild(err, stdout, prompt, t0)));
    child.stdin.on("error", () => { });   // child died early — the callback reports it
    child.stdin.end(String(prompt));
  });
}

async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const old = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "sk-test";
  assert("API-KEY LAW — sync refuses with the key set", claudeGen("x").ok === false && claudeGen("x").error.includes("REFUSED"));
  assert("API-KEY LAW — async refuses with the key set", (await claudeGenAsync("x")).error.includes("REFUSED"));
  if (old === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = old;
  const good = parseOut(JSON.stringify({ result: "answer", is_error: false, usage: { input_tokens: 10, output_tokens: 5 } }), "p", Date.now());
  assert("json result parsed, tokens counted", good.ok && good.text === "answer" && good.total_tokens === 15);
  assert("token SPLIT rides the result (#7 — the ledger cannot bill a lump sum)",
    good.input_tokens === 10 && good.output_tokens === 5 && good.tokens_estimated === false);
  {
    // no usage block → the total is a LENGTH ESTIMATE and says so; the components
    // stay null, never 0 (an unmeasured number rendered as a measured zero is the
    // exact lie this audit exists to kill)
    const est = parseOut(JSON.stringify({ result: "answer", is_error: false }), "p", Date.now());
    assert("no usage block → estimated total, NULL components (never a fake zero)",
      est.tokens_estimated === true && est.input_tokens === null && est.output_tokens === null && est.total_tokens > 0);
  }
  const lim = parseOut(JSON.stringify({ result: "rate limit reached", is_error: true }), "p", Date.now());
  assert("limit event detected honestly", lim.ok === false && lim.limit_hit === true);
  assert("raw non-json passes through", parseOut("plain", "p", Date.now()).text === "plain");

  // ── #8 THE LIMIT CLASSIFIER ───────────────────────────────────────────────
  // Every fixture below is a VERBATIM shape lifted from the live brain_ledger:
  // 310 of the 312 limit_hit rows carry api_error_status 429; the only 2 that
  // do not are the two false positives that took five Gemini tanks down.
  {
    const realLimit = '{"type":"result","subtype":"success","is_error":true,"api_error_status":429,"duration_ms":782,"duration_api_ms":0,"num_turns":1,"result":"You\'ve hit your weekly limit · resets Jul 20, 11:30pm (Asia/Calcutta)"}';
    const rl = parseOut(realLimit, "p", Date.now());
    assert("REAL plan limit (api_error_status 429) is still caught, and says WHY",
      rl.ok === false && rl.limit_hit === true && rl.http_status === 429 && rl.limit_signal === "api_error_status");
    // THE 1 AUG 01:48 MISFIRE. This envelope is the live 29-Jul evening_voice row:
    // is_error true, stop_reason stop_sequence, NO api_error_status. The legacy
    // regex matched it (a bare 429 lives in the numbers that follow); it must not.
    const falsePos = '{"is_error":true,"duration_api_ms":0,"num_turns":1,"stop_reason":"stop_sequence","session_id":"a0937cb3-63b1-401e-8122-5b13dca9bcc9","total_cost_usd":0,"usage":{"input_tokens":0,"cache_creation_input_tokens":4291,"output_tokens":6}}';
    const fp = parseOut(falsePos, "p", Date.now());
    assert("a stop_sequence error is NOT a rate limit (the misfire that killed 5 tanks)",
      fp.ok === false && fp.limit_hit === false && fp.limit_signal === "none");
    assert("…and the LEGACY regex, frozen beside it, still proves the old behaviour",
      LIMIT_RE_LEGACY.test(falsePos) === true);
    // the digits-anywhere hole, isolated
    assert("a bare 429 inside an unrelated number never reads as a limit",
      classifyLimit('{"is_error":true,"duration_ms":14295,"result":"tool failed"}', "tool failed").limit_hit === false);
    // the prose fallback still saves the 2 ledger rows that carry no status field
    assert("PROSE FALLBACK: an envelope with no status still catches the real message",
      classifyLimit("You've hit your session limit · resets 8:30pm (Asia/Calcutta)", null).limit_hit === true);
    assert("an upstream 529 (overloaded) also backs off", classifyLimit('{"api_error_status":529}', null).limit_hit === true);
    assert("a 500 is a failure but NOT a limit (never a quota death for a server bug)",
      classifyLimit('{"api_error_status":500,"result":"internal error"}', "internal error").limit_hit === false);
    // FORENSICS: the error text survives past the old 200-char cut
    assert("FORENSICS: the failing envelope is preserved, not truncated one field short",
      fp.error_envelope && fp.error_envelope.includes("stop_sequence") && fp.error.length > 0);
  }

  // ── THE LEDGER PROJECTION — the wire #8 never had (10 Aug 2026) ───────────
  {
    const wall = parseOut('{"type":"result","is_error":true,"api_error_status":429,"session_id":"abc-123","result":"You\'ve hit your weekly limit · resets Jul 20, 11:30pm"}', "p", Date.now());
    const f = ledgerForensics(wall);
    assert("LEDGER PROJECTION: the discriminator rides the row (a plan wall stays nameable after the fact)",
      f.http_status === 429 && f.limit_signal === "api_error_status"
      && f.error_envelope && f.error_envelope.includes("session_id") && f.error_envelope !== wall.error);
    // parseErr sets error === error_envelope byte for byte; copying 600 chars
    // twice onto a 2 MB rolling journal buys no forensics at all, so the
    // projection drops the duplicate and the READER ORs the two fields.
    const spawnFail = parseErr(new Error("spawnSync claude ETIMEDOUT"), "p", Date.now());
    const f2 = ledgerForensics(spawnFail);
    assert("LEDGER PROJECTION: no envelope copy when it says nothing `error` doesn't (the reader ORs them)",
      spawnFail.error_envelope === spawnFail.error && f2.error_envelope === null
      && f2.http_status === null && f2.limit_signal === "none");
    // THE WIRE ITSELF — the assertion this file was missing. A shape with no
    // caller IS the defect being repaired here (error_envelope: produced on
    // every failure since 4 Aug, read by nobody, 0 of 4,558 ledger rows), and a
    // source scan is the only check that goes red the moment a future edit
    // quietly drops the spread out of a row literal. Reads siblings by URL so
    // it works from any cwd.
    // council.mjs joined the scan 10 Aug 2026: it was the third caller writing a
    // brain_ledger row by hand, and it hand-rolled http_status + limit_signal
    // while dropping error_envelope entirely — proof that a caller copying
    // fields one at a time WILL miss one. The scan is what makes that structural.
    for (const [file, builder] of [["nightshift.mjs", "genLedgered"], ["dmn.mjs", "ledgerRow"], ["council.mjs", "convene (the cross-family chair)"]]) {
      let src = "";
      try { src = readFileSync(new URL("./" + file, import.meta.url), "utf8"); } catch { }
      // COMMENTS ARE STRIPPED FIRST (10 Aug 2026, found by the negative control
      // that added council.mjs to this list). With the spread deleted off
      // council's row the scan still passed — because the comment ABOVE the row
      // names `...ledgerForensics(r)` in prose, and the raw-source regex cannot
      // tell an explanation from a call. A guard a comment can satisfy is not a
      // guard, which is the same built-but-not-wired shape this scan exists to
      // catch. This repo comments its WHY heavily, so that hole was wide open on
      // all three callers. (Line comments only; none of the three has a `//`
      // inside a string literal on the lines that matter, and stripping can only
      // make this check STRICTER, never let a missing wire through.)
      const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      assert(`WIRE: ${file} (${builder}) still spreads ledgerForensics onto its brain_ledger row`,
        /import\s*\{[^}]*ledgerForensics[^}]*\}\s*from\s*"\.\/claudegen\.mjs"/.test(code) && /\.\.\.ledgerForensics\(/.test(code));
    }
  }

  // ── THE SILENT KILL — a killed call must never come back as an answer ──────
  // Every fixture below is the LIVE PROBE of 10 Aug 2026, verbatim: execFile with
  // timeout 600ms against a child that writes a partial envelope and then hangs
  // gives killed=true · signal=SIGTERM · code=null · stdout=the fragment · and NO
  // err.stdout. These go red the moment the callback stops routing through
  // resolveChild, or the fragment is allowed to be an answer again.
  {
    const FRAG = '{"type":"result","is_error":false,"result":"partial answ';
    const sigterm = Object.assign(new Error("Command failed: node.exe"), { killed: true, signal: "SIGTERM", code: null });
    const k = resolveChild(sigterm, FRAG, "p", Date.now());
    assert("SILENT KILL: a SIGTERM'd child that flushed a PARTIAL envelope is a FAILURE, never an answer",
      k.ok === false && k.text === null && k.killed === true && k.kill_signal === "SIGTERM");
    assert("SILENT KILL: the kill is NAMED in the error text (the field brain/watchman/doctor already read) and the fragment survives",
      /^KILLED \(SIGTERM\) after \d+ms/.test(k.error) && k.error.includes('"result":"partial answ'));
    assert("SILENT KILL: a cut-off call is never mistaken for a plan wall (no status, no phrase — just dead)",
      k.limit_hit === false && k.http_status === null);
    // the repair must cost the two lanes that were always right: nothing.
    const clean = resolveChild(null, "plain", "p", Date.now());
    assert("SILENT KILL: a CLEAN raw-text call still passes through untouched (no err ⇒ the old lane, byte for byte)",
      clean.ok === true && clean.text === "plain" && clean.killed === false && clean.kill_signal === null);
    const wallExit = resolveChild(Object.assign(new Error("Command failed"), { code: 1 }),
      '{"type":"result","is_error":true,"api_error_status":429,"result":"You\'ve hit your weekly limit · resets Jul 20, 11:30pm","usage":{"input_tokens":7,"output_tokens":2}}', "p", Date.now());
    assert("SILENT KILL: a non-zero exit beside a COMPLETE envelope keeps its status AND its usage (parseErr would bin both)",
      wallExit.limit_hit === true && wallExit.http_status === 429 && wallExit.input_tokens === 7 && wallExit.tokens_estimated === false);
    // the projection — a killed row must still be nameable months later, and a
    // healthy row must not grow by two null fields it never needed
    const fk = ledgerForensics(k);
    assert("LEDGER PROJECTION: the kill rides the brain_ledger row, and a finished call adds nothing",
      fk.killed === true && fk.kill_signal === "SIGTERM"
      && ledgerForensics(clean).killed === null && ledgerForensics(clean).kill_signal === null);
    // LAYERING: the old branch is frozen beside the new one and still tells the lie
    const old = resolveChildLegacy(sigterm, FRAG, "p", Date.now());
    assert("…and the FROZEN legacy branch still reproduces the defect verbatim (ok:true, error:null, a fragment as the answer)",
      old.ok === true && old.error === null && old.text === FRAG);
    // THE WIRE ITSELF: a correct resolveChild that nothing calls is exactly the
    // built-but-not-wired shape this repair belongs to. Source scan, same
    // technique as the ledgerForensics checks above — re-inline the old
    // expression in the callback and this goes red in the same second.
    let self = "";
    try { self = readFileSync(new URL(import.meta.url), "utf8"); } catch { }
    assert("WIRE: claudeGenAsync's callback still routes through resolveChild (the async engine is the only one that can be killed mid-flush)",
      /\(err,\s*stdout\)\s*=>\s*resolve\(resolveChild\(err,\s*stdout,\s*prompt,\s*t0\)\)/.test(self));
  }
  // THE ENGINE MUST BE SPAWNABLE (E2E audit 25 Jul): the old BIN() pointed at a
  // shim that does not exist here, so every organ failed with EINVAL and nobody
  // noticed for days. This check fails loudly the moment the binary is unreachable.
  {
    const bin = BIN();
    // 9 Aug 2026 (the first away-day red after joining the suite): the CI runner
    // has no claude CLI BY CONSTRUCTION — asserting its presence there is "a truth
    // about a different computer" (commit 55335a1's law), not a defect. GitHub sets
    // CI=true; at home the check stays strict, because here a missing binary is the
    // EINVAL silent-death this check was born from.
    if (process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true") {
      console.log(`  – claude binary check SKIPPED (away-day runner has no claude CLI by construction)`);
    } else {
      const resolvable = existsSync(bin) || (() => {
        try { execFileSync(process.platform === "win32" ? "where" : "which", [bin], { stdio: "pipe" }); return true; } catch { return false; }
      })();
      assert(`claude binary is resolvable (${bin})`, resolvable);
    }
  }
  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

import { pathToFileURL } from "node:url";
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) selftest().then(ok => process.exit(ok ? 0 : 1));

export { claudeGen, claudeGenAsync, classifyLimit, ledgerForensics, LIMIT_PHRASE_RE, LIMIT_RE_LEGACY };
