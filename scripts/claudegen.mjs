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
import { existsSync, readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";   // readFileSync: the selftest's WIRE scan of the callers (10 Aug 2026). The four write/temp calls: the selftest's LIVE shim probe (11 Aug 2026) — a fake %APPDATA%\npm\claude.cmd in a temp dir is the only way to actually walk the npm-install lane on a box that has no shim.
import { tmpdir } from "node:os";
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
// ── THE ARG-SET NAMES ITSELF (wiring audit, 11 Aug 2026) ────────────────────
// The SHIM GUARD three lines up promised that a shimmed box "SAYS so via the env
// probe below, never silently", and the old chooser said NOTHING: both full-CLI
// lanes returned `base` and no field, row, or organ recorded which invocation a
// call had used. The trailing comment claimed it was "out loud in the ledger's
// spend" — spend is an effect, not a cause; a row that costs 3× cannot tell you
// whether the model thought harder or the boot tax came back.
// DAMAGE IS ZERO TODAY and the shape is the danger: this box resolves the native
// ~/.local/bin/claude.exe (no %APPDATA%\npm\claude.cmd), so lean is live. But the
// fallback is INSTALLATION-shaped, not config-shaped — reinstall the CLI via npm
// and every organ on this door silently reverts to the full-CLI boot tax G0
// measured at 88.5% off a bare probe / 57.5% off 11 real jobs (brain.mjs, "VERIFIED
// THE SAME DAY ON 11 REAL JOBS"). brain.mjs's twin switch is at least READABLE —
// budget.lean_calls, a key in brain_config.json you can open; this one was a
// filesystem probe that left no trace anywhere.
// ONE DECIDER, so the name and the args can never drift apart: ARGS is defined in
// terms of ARG_PROFILE, not beside it. The three names are the three lanes that
// already existed — nothing new is invented here, they are given a spelling.
const ARG_PROFILE = () => {
  if (process.env.ARSENAL_CLAUDEGEN_FULL === "1") return "full-env";    // his explicit revert
  if (needsShell(BIN())) return "full-shim";                            // spaced args + shell:true don't mix
  return "lean";
};
// `extra` (11 Aug 2026) — per-call argv a CALLER needs and the shared lane cannot
// assume, e.g. `--allowedTools WebSearch` for the field-probe job that has to read
// the actual internet. It is APPENDED, never merged into the base, so the profile
// choice above is untouched and ARGS_LEGACY still agrees argv-for-argv on every
// existing call (extra defaults to [], and [...x].concat([]) is x). A caller that
// passes nothing gets exactly the bytes it got yesterday.
const ARGS = (model, extra = []) => {
  const base = ["-p", "--output-format", "json", "--model", model || "sonnet"];
  const chosen = ARG_PROFILE() === "lean" ? [...base, ...LEAN_ARGS] : base;
  return Array.isArray(extra) && extra.length ? [...chosen, ...extra] : chosen;
};
// FROZEN VERBATIM (layering law) — the pre-11-Aug chooser. Frozen not because the
// invocation changed but because the repair's whole claim is that IT DID NOT: only
// the choice became readable. The selftest asserts the two agree argv-for-argv on
// every lane, so the day they disagree this repair broke a spawn instead of
// describing one, and it goes red in the same second.
const ARGS_LEGACY = (model) => {
  const base = ["-p", "--output-format", "json", "--model", model || "sonnet"];
  if (process.env.ARSENAL_CLAUDEGEN_FULL === "1") return base;
  if (needsShell(BIN())) return base;
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
    // WHICH CLI WAS ACTUALLY SPOKEN TO (wiring audit, 11 Aug 2026 — see
    // ARG_PROFILE). Same ONE-SHAPE rule as the pair above: it rides EVERY result,
    // so no reader has to ask whether the field exists. Read here rather than
    // threaded down from the spawn because ARG_PROFILE is a pure function of this
    // process's env + the binary on disk, and both are the same at spawn and at
    // parse — while threading it would have meant changing the two signatures the
    // WIRE scans below pin, for no extra truth.
    arg_profile: ARG_PROFILE(),
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
    arg_profile: ARG_PROFILE(),   // a spawn that DIED still chose an arg-set — that is exactly the row you want it on
  };
}
// refuse() carries arg_profile NULL, not "lean": the key refuses BEFORE any spawn,
// so no arg-set was ever chosen. An unmade choice rendered as a made one is the
// same lie as this file's unmeasured-number law (null components, never a fake 0).
const refuse = () => ({ ok: false, text: null, total_tokens: 0, input_tokens: null, output_tokens: null, cache_creation_tokens: null, cache_read_tokens: null, tokens_estimated: false, duration_ms: 0, limit_hit: false, http_status: null, limit_signal: "none", error: "REFUSED — ANTHROPIC_API_KEY set (subscription only, ever)", error_envelope: null, killed: false, kill_signal: null, arg_profile: null });

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
//
// BOTH LANES RIDE THIS DOOR SINCE 11 Aug 2026 (wiring audit). The 10 Aug repair
// above reached the ASYNC callback only — claudeGen kept its own `catch → parseErr`
// and so threw away the usage block on exactly the shape this comment names at
// :204-205. See the dated note on claudeGen below for the live two-lane probe.
const jsonWhole = (s) => { if (!String(s).trim()) return false; try { JSON.parse(s); return true; } catch { return false; } };
function resolveChild(err, stdout, prompt, t0) {
  const out = String(stdout || "");
  if (!err) return parseOut(out, prompt, t0);
  if (!jsonWhole(out)) {
    // parseErr writes ok:false by construction — a fragment is never an answer.
    // stderr (11 Aug 2026): the ASYNC caller's `err` never carries one — execFile
    // hands stderr to the callback's THIRD argument, which this door does not take
    // — so `|| ""` leaves that lane byte-for-byte as it was. The SYNC caller's DOES
    // (probed this box: execFileSync's thrown error has a string `.stderr`), and
    // parseErr:163 has always folded it into the message. Hardcoding "" here would
    // have charged the sync lane forensics it already had for a meter it lacked.
    return parseErr({ message: String((err && err.message) || err), stdout: out, stderr: err.stderr || "", killed: err.killed, signal: err.signal }, prompt, t0);
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
    // THE ARG-SET RIDES THE ROW TOO (wiring audit, 11 Aug 2026). This one is
    // stamped ALWAYS, and deliberately breaks the "say it only when it says
    // something" rule the two fields above follow — because here the COMPARISON is
    // the whole value. A ledger that named only the anomaly could not show him the
    // night the lane flipped: an absent key already means "a row written before
    // this wire existed", so a null lean-row would be indistinguishable from
    // history. ~20 bytes against a 600-char envelope is why that trade is free on a
    // journal brain.mjs rolls at 2 MB. Rides ledgerForensics rather than four hand-
    // copied row literals for the reason the WIRE scan below was written down: a
    // caller copying fields one at a time WILL miss one.
    arg_profile: o.arg_profile || null,
  };
}

// FROZEN VERBATIM (layering law) — the pre-11-Aug catch, the one that binned a
// complete envelope's usage block because the exit code was non-zero. Kept
// because every ns_* row already on brain_ledger.jsonl came from it: a failed
// night shift's `total_tokens` is a LENGTH GUESS of the prompt, not spend, and
// `tokens_estimated:true` beside four nulls is the only marker saying so. Read
// that history with this function in hand, not the one below.
const claudeGenCatchLegacy = (e, prompt, t0) => parseErr(e, prompt, t0);

// ── THE HALF-WIRED DOOR (wiring audit, 11 Aug 2026) ─────────────────────────
// resolveChild landed 10 Aug and this lane never got it: claudeGen's catch went
// straight to parseErr, which nulls all four usage components and substitutes
// Math.ceil(prompt.length/4). The shape it cost is the one resolveChild was
// written for and names at :204-205 — a non-zero exit BESIDE a complete 429
// envelope — and the CLI hands that envelope over intact: probed on this box,
// execFileSync's thrown error carries `.stdout` as a 232-char string that
// JSON.parse accepts whole (status=1, signal=null).
// LIVE TWO-LANE PROBE, 11 Aug 2026 — the real claudeGen and claudeGenAsync, one
// fake CLI printing the plan-wall envelope (usage 7 + 2 + 14434 + 100) and
// exiting 1, identical prompt:
//   SYNC  → total_tokens=23     tokens_estimated=true   all four components null
//   ASYNC → total_tokens=14543  tokens_estimated=false  in=7 out=2 cc=14434 cr=100
// The CLASSIFIER was never hurt (both lanes returned limit_hit=true,
// http_status=429 — parseErr's classifyLimit scans the folded-in stdout); the
// METER was. And this is the only door nightshift has: nightshift.mjs:104
// genLedgered funnels five job generators through it and appends every result to
// the SHARED brain_ledger, so brain.mjs's window governor and limits.mjs's
// brain_calls_estimated counter read a night's plan-wall spend as ~600× less
// than it was. The success path routes through the same call for one door, not
// two: with encoding:"utf8" `resolveChild(null, stdout, …)` IS `parseOut(stdout,
// …)`, so that lane is unchanged byte-for-byte and the WIRE scan below can pin
// the whole function on one shape.
function claudeGen(prompt, model = "sonnet", timeoutMs = 300000, extraArgs = []) {
  if (process.env.ANTHROPIC_API_KEY) return refuse();
  const t0 = Date.now();
  const bin = BIN();
  try {
    const stdout = execFileSync(bin, ARGS(model, extraArgs), { input: String(prompt), timeout: timeoutMs, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], windowsHide: true, shell: needsShell(bin), env: { ...process.env, ARSENAL_ORGAN: "1" } });
    return resolveChild(null, stdout, prompt, t0);
  } catch (e) { return resolveChild(e, e.stdout, prompt, t0); }
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
    // thalamus.mjs joined 11 Aug 2026 — the FOURTH caller, and the proof that a
    // scan listing three doors guards three doors. meterAdjudication was written
    // on 10 Aug, the same day the other three were moved onto this shape, and it
    // hand-copied 8 fields: no error_envelope, no http_status, no limit_signal, no
    // kill, no tokens_estimated. Nothing went red because this list did not name it.
    for (const [file, builder] of [["nightshift.mjs", "genLedgered"], ["dmn.mjs", "ledgerRow"], ["council.mjs", "convene (the cross-family chair)"], ["thalamus.mjs", "meterAdjudication (the ε-band adjudicator)"]]) {
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
    // …AND SOMEBODY READS IT (wiring pass, 11 Aug 2026). For one day this pair
    // was a producer with no consumer — the exact black-box shape the repair
    // above was written to kill. `grep -rn kill_signal --include=*.mjs
    // scripts/ hooks/` returned THIS FILE and nothing else, while brain.mjs's
    // cause ladder (not_logged_in | plan_limit | api_error | unknown) sent every
    // SIGTERM'd night to "unknown". brain.mjs now reads BOTH shapes — the field
    // and parseErr's `KILLED (…) after <n>ms` text prefix — in killOf(), and
    // resolves the tail to cause "timeout". Source scan with comments stripped,
    // same technique (and same reason) as the ledgerForensics scan above: a
    // guard a comment can satisfy is not a guard.
    {
      let bsrc = "";
      try { bsrc = readFileSync(new URL("./brain.mjs", import.meta.url), "utf8"); } catch { }
      const bcode = bsrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      assert("WIRE: brain.mjs still READS the kill (killed field + the KILLED text prefix) and still has a `timeout` cause",
        /r\.killed\s*===\s*true/.test(bcode) && /KILL_TEXT_RE/.test(bcode)
        && /KILLED \\\(\(SIG\[A-Z\]\+\|no-signal\)\\\) after/.test(bcode)
        && /"timeout"/.test(bcode));
    }
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
  // ── THE HALF-WIRED DOOR — the SYNC lane rides resolveChild too (11 Aug 2026) ─
  // Fixtures are the LIVE PROBE of this box, verbatim: execFileSync against a CLI
  // that prints the plan-wall envelope and exits 1 gives status=1 · signal=null ·
  // killed=undefined · `.stdout` = the WHOLE 232-char envelope · `.stderr` = a
  // string. Before the repair the same envelope metered 14543 on the async lane
  // and 23 on this one.
  {
    const WALL = '{"type":"result","is_error":true,"api_error_status":429,"result":"You\'ve hit your weekly limit · resets Jul 20, 11:30pm","usage":{"input_tokens":7,"output_tokens":2,"cache_creation_input_tokens":14434,"cache_read_input_tokens":100}}';
    const exit1 = Object.assign(new Error("Command failed: claude"), { status: 1, signal: null, stdout: WALL, stderr: "" });
    const sync = resolveChild(exit1, exit1.stdout, "p", Date.now());
    assert("SYNC DOOR: a non-zero exit beside a COMPLETE envelope keeps the HONEST 4-field meter (nightshift's whole spend rode this)",
      sync.total_tokens === 14543 && sync.tokens_estimated === false
      && sync.input_tokens === 7 && sync.output_tokens === 2
      && sync.cache_creation_tokens === 14434 && sync.cache_read_tokens === 100);
    assert("SYNC DOOR: …and the classifier it never lost still names the wall",
      sync.ok === false && sync.limit_hit === true && sync.http_status === 429 && sync.limit_signal === "api_error_status");
    // LAYERING: the frozen catch still tells the lie, so the ns_* rows already on
    // the ledger stay readable. 23 = Math.ceil("p…".length/4) of ITS prompt, which
    // is the whole point — the number is the PROMPT's length, never the spend.
    const oldSync = claudeGenCatchLegacy(exit1, "p", Date.now());
    assert("…and the FROZEN legacy catch still reproduces the defect verbatim (length guess, four NULL components)",
      oldSync.tokens_estimated === true && oldSync.input_tokens === null && oldSync.output_tokens === null
      && oldSync.cache_creation_tokens === null && oldSync.cache_read_tokens === null
      && oldSync.total_tokens === Math.ceil("p".length / 4));
    // the two things the sync lane already had right must survive the re-route:
    // a fragment is never an answer, and stderr stays in the forensics.
    const frag = Object.assign(new Error("Command failed: claude"), { signal: "SIGTERM", stdout: '{"type":"result","result":"partial answ', stderr: "cli said something on stderr" });
    const fr = resolveChild(frag, frag.stdout, "p", Date.now());
    assert("SYNC DOOR: a killed sync child with a PARTIAL envelope is still a failure, and its stderr is not dropped by the re-route",
      fr.ok === false && fr.text === null && fr.killed === true && fr.kill_signal === "SIGTERM"
      && fr.error.includes("cli said something on stderr") && fr.error.includes('"result":"partial answ'));
    // THE WIRE ITSELF — the assertion this file was missing, and the reason the
    // 10 Aug repair could land on one lane and be called done. The async callback
    // has had its own scan since that day (above); the sync lane had none, so
    // nothing went red while it sat half-wired. Pins BOTH exits of claudeGen.
    let self2 = "";
    try { self2 = readFileSync(new URL(import.meta.url), "utf8"); } catch { }
    const syncBody = self2.slice(self2.indexOf("function claudeGen(prompt"), self2.indexOf("function claudeGenAsync(prompt"));
    assert("WIRE: BOTH of claudeGen's exits route through resolveChild (re-inline parseErr and this goes red in the same second)",
      syncBody.length > 0
      && /return resolveChild\(null, stdout, prompt, t0\);/.test(syncBody)
      && /catch \(e\) \{ return resolveChild\(e, e\.stdout, prompt, t0\); \}/.test(syncBody)
      && !/return parseErr\(/.test(syncBody));
  }

  // ── THE UNNAMED ARG-SET — which CLI did this call actually boot? (11 Aug 2026) ─
  // The SHIM GUARD promised a shimmed box would SAY it kept the full CLI. Nothing
  // said it: both full lanes returned the same argv as the lean lane returns minus
  // LEAN_ARGS, and no field carried the choice. These go red if the name is dropped,
  // if the name stops matching the argv, or if the reader on the other end is cut.
  {
    const hasLean = (a) => a.includes("--system-prompt") && a.includes("--strict-mcp-config");
    // 1. THE NAME MATCHES THE ARGV — the only property that makes the name worth
    //    anything. Asserted as an equivalence, never as a hardcoded lane: this box
    //    is native today, an npm box is shimmed, and BOTH must hold here.
    assert("ARG-SET: the profile NAMES the argv it chose (lean ⇔ LEAN_ARGS present), on whatever lane this box is on",
      hasLean(ARGS("sonnet")) === (ARG_PROFILE() === "lean"));
    // 2. LAYERING: the frozen pre-11-Aug chooser and the new one agree argv-for-argv.
    assert("ARG-SET: the invocation did NOT change — the frozen legacy chooser returns the identical argv",
      JSON.stringify(ARGS("sonnet")) === JSON.stringify(ARGS_LEGACY("sonnet"))
      && JSON.stringify(ARGS("opus")) === JSON.stringify(ARGS_LEGACY("opus")));
    // 3. THE ENV LANE, WALKED FOR REAL (his documented revert switch).
    const oldFull = process.env.ARSENAL_CLAUDEGEN_FULL;
    process.env.ARSENAL_CLAUDEGEN_FULL = "1";
    const envArgs = ARGS("sonnet"), envProf = ARG_PROFILE(), envLegacy = ARGS_LEGACY("sonnet");
    if (oldFull === undefined) delete process.env.ARSENAL_CLAUDEGEN_FULL; else process.env.ARSENAL_CLAUDEGEN_FULL = oldFull;
    assert("ARG-SET: ARSENAL_CLAUDEGEN_FULL=1 reverts to the full CLI and SAYS `full-env` (the revert is legible, not just effective)",
      envProf === "full-env" && !hasLean(envArgs) && JSON.stringify(envArgs) === JSON.stringify(envLegacy));
    // 4. THE SHIM LANE — the one this repair exists for, walked LIVE. A fake
    //    %APPDATA%\npm\claude.cmd in a temp dir IS the npm-install scenario: BIN()
    //    finds it, needsShell() is true, the spaced system-prompt cannot ride
    //    shell:true, and the box falls back to the full CLI. Before today that
    //    fallback was invisible; now it has a name. win32-only because BIN()'s shim
    //    probe is win32-only by construction — on the away-day runner there is no
    //    lane to walk, and asserting one would be "a truth about a different
    //    computer" (the same law as the binary check below).
    if (process.platform === "win32") {
      const fakeAppData = mkdtempSync(join(tmpdir(), "arsenal-shim-"));
      const oldAppData = process.env.APPDATA;
      try {
        mkdirSync(join(fakeAppData, "npm"), { recursive: true });
        writeFileSync(join(fakeAppData, "npm", "claude.cmd"), "@echo off\r\n");
        process.env.APPDATA = fakeAppData;
        const shimProf = ARG_PROFILE(), shimArgs = ARGS("sonnet"), shimLegacy = ARGS_LEGACY("sonnet");
        const shimResult = parseOut(JSON.stringify({ result: "x", is_error: false }), "p", Date.now());
        assert("ARG-SET: an npm-shimmed box falls back to the FULL CLI and says `full-shim` out loud (the silent revert that cost 88.5%)",
          BIN().endsWith("claude.cmd") && shimProf === "full-shim" && !hasLean(shimArgs)
          && JSON.stringify(shimArgs) === JSON.stringify(shimLegacy)
          && shimResult.arg_profile === "full-shim"
          && ledgerForensics(shimResult).arg_profile === "full-shim");
      } finally {
        if (oldAppData === undefined) delete process.env.APPDATA; else process.env.APPDATA = oldAppData;
        try { rmSync(fakeAppData, { recursive: true, force: true }); } catch { }
      }
    } else {
      console.log(`  – shim-lane probe SKIPPED (BIN()'s %APPDATA% shim probe is win32-only — no lane to walk on ${process.platform})`);
    }
    // 5. THE SHAPE — every result names its lane, and the one call that never
    //    spawned names NULL instead of guessing "lean".
    const good2 = parseOut(JSON.stringify({ result: "a", is_error: false }), "p", Date.now());
    const bad2 = parseErr(new Error("spawnSync claude ENOENT"), "p", Date.now());
    const oldKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const refused = claudeGen("x");
    if (oldKey === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = oldKey;
    assert("ARG-SET: it rides EVERY result — the answer, the failure, and the kill — while an UNMADE call carries null, never a fake lane",
      good2.arg_profile === ARG_PROFILE() && bad2.arg_profile === ARG_PROFILE()
      && "arg_profile" in refused && refused.arg_profile === null);
    // 6. THE LEDGER PROJECTION — always stamped, unlike the two conditional fields
    //    beside it, because an absent key already means "written before the wire".
    assert("LEDGER PROJECTION: the arg-set rides the row ALWAYS (a lean row that says nothing is indistinguishable from history)",
      ledgerForensics(good2).arg_profile === ARG_PROFILE()
      && ledgerForensics({}).arg_profile === null);
    // 7. THE WIRE ITSELF — a name nobody reads is the black box this whole audit is
    //    about. limits.mjs's WHAT-HE-ACTUALLY-HAS ledger is the consumer (the same
    //    home that adopted tokens_estimated on 10 Aug, for the same reason). Source
    //    scan with comments stripped, same technique and same reason as the scans
    //    above: a guard a comment can satisfy is not a guard.
    let lsrc = "";
    try { lsrc = readFileSync(new URL("./limits.mjs", import.meta.url), "utf8"); } catch { }
    const lcode = lsrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    assert("WIRE: limits.mjs still COUNTS the arg-set off the bus (drop the reader and this producer is a black box again)",
      /brain_calls_lean:/.test(lcode) && /brain_calls_full_cli:/.test(lcode) && /arg_profile/.test(lcode));
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
