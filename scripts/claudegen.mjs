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

const LIMIT_RE = /limit|rate.?limit|quota|overloaded|429/i;
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
  const lim = parseOut(JSON.stringify({ result: "rate limit reached", is_error: true }), "p", Date.now());
  assert("limit event detected honestly", lim.ok === false && lim.limit_hit === true);
  assert("raw non-json passes through", parseOut("plain", "p", Date.now()).text === "plain");
  // THE ENGINE MUST BE SPAWNABLE (E2E audit 25 Jul): the old BIN() pointed at a
  // shim that does not exist here, so every organ failed with EINVAL and nobody
  // noticed for days. This check fails loudly the moment the binary is unreachable.
  {
    const bin = BIN();
    const resolvable = existsSync(bin) || (() => {
      try { execFileSync(process.platform === "win32" ? "where" : "which", [bin], { stdio: "pipe" }); return true; } catch { return false; }
    })();
    assert(`claude binary is resolvable (${bin})`, resolvable);
  }
  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

import { pathToFileURL } from "node:url";
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) selftest().then(ok => process.exit(ok ? 0 : 1));

export { claudeGen, claudeGenAsync };
