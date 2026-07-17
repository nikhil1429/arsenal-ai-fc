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
import { join } from "node:path";

const LIMIT_RE = /limit|rate.?limit|quota|overloaded|429/i;
const BIN = () => {
  // Windows: npm shims live in %APPDATA%\npm as .cmd — bare name can ENOENT
  // under some spawn contexts; the shim path always works.
  if (process.platform === "win32" && process.env.APPDATA) return join(process.env.APPDATA, "npm", "claude.cmd");
  return "claude";
};
const ARGS = (model) => ["-p", "--output-format", "json", "--model", model || "sonnet"];

function parseOut(stdout, prompt, t0) {
  let text = stdout, inTok = null, outTok = null, isErr = false;
  try {
    const j = JSON.parse(stdout);
    text = j.result !== undefined ? String(j.result) : stdout;
    isErr = j.is_error === true;
    if (j.usage) { inTok = j.usage.input_tokens ?? null; outTok = j.usage.output_tokens ?? null; }
  } catch { /* non-json → raw text */ }
  const total = (inTok || 0) + (outTok || 0) || Math.ceil((String(prompt).length + String(text).length) / 4);
  return { ok: !isErr, text, total_tokens: total, duration_ms: Date.now() - t0, limit_hit: isErr && LIMIT_RE.test(text), error: isErr ? String(text).slice(0, 200) : null };
}
function parseErr(e, prompt, t0) {
  const msg = String((e.stderr || "") + (e.stdout || "") + e.message);
  return { ok: false, text: null, total_tokens: Math.ceil(String(prompt).length / 4), duration_ms: Date.now() - t0, limit_hit: LIMIT_RE.test(msg), error: msg.slice(0, 200) };
}
const refuse = () => ({ ok: false, text: null, total_tokens: 0, duration_ms: 0, limit_hit: false, error: "REFUSED — ANTHROPIC_API_KEY set (subscription only, ever)" });

function claudeGen(prompt, model = "sonnet", timeoutMs = 300000) {
  if (process.env.ANTHROPIC_API_KEY) return refuse();
  const t0 = Date.now();
  try {
    const stdout = execFileSync(BIN(), ARGS(model), { input: String(prompt), timeout: timeoutMs, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
    return parseOut(stdout, prompt, t0);
  } catch (e) { return parseErr(e, prompt, t0); }
}

function claudeGenAsync(prompt, model = "sonnet", timeoutMs = 300000) {
  if (process.env.ANTHROPIC_API_KEY) return Promise.resolve(refuse());
  const t0 = Date.now();
  return new Promise((resolve) => {
    const child = execFile(BIN(), ARGS(model), { timeout: timeoutMs, encoding: "utf8", windowsHide: true, maxBuffer: 8 * 1024 * 1024 },
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
  const lim = parseOut(JSON.stringify({ result: "rate limit reached", is_error: true }), "p", Date.now());
  assert("limit event detected honestly", lim.ok === false && lim.limit_hit === true);
  assert("raw non-json passes through", parseOut("plain", "p", Date.now()).text === "plain");
  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

import { pathToFileURL } from "node:url";
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) selftest().then(ok => process.exit(ok ? 0 : 1));

export { claudeGen, claudeGenAsync };
