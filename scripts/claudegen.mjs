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
import { existsSync } from "node:fs";
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
  };
}
function parseErr(e, prompt, t0) {
  const msg = String((e.stderr || "") + (e.stdout || "") + e.message);
  // a thrown spawn/timeout carries no `result` field — the envelope IS the message
  const cls = classifyLimit(msg, null);
  return {
    ok: false, text: null, total_tokens: Math.ceil(String(prompt).length / 4),
    input_tokens: null, output_tokens: null, cache_creation_tokens: null, cache_read_tokens: null,
    tokens_estimated: true,
    duration_ms: Date.now() - t0,
    limit_hit: cls.limit_hit, http_status: cls.http_status, limit_signal: cls.limit_signal,
    error: msg.slice(0, ERR_KEEP), error_envelope: msg.slice(0, ERR_KEEP),
  };
}
const refuse = () => ({ ok: false, text: null, total_tokens: 0, input_tokens: null, output_tokens: null, cache_creation_tokens: null, cache_read_tokens: null, tokens_estimated: false, duration_ms: 0, limit_hit: false, http_status: null, limit_signal: "none", error: "REFUSED — ANTHROPIC_API_KEY set (subscription only, ever)", error_envelope: null });

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
      (err, stdout) => resolve(err && !stdout ? parseErr(err, prompt, t0) : parseOut(stdout || "", prompt, t0)));
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

export { claudeGen, claudeGenAsync, classifyLimit, LIMIT_PHRASE_RE, LIMIT_RE_LEGACY };
