#!/usr/bin/env node
// ============================================================================
// hooks/afferent-post.mjs · ARSENAL AI FC — THE CLAUDE CODE CAPTURE NERVE (P1)
// ----------------------------------------------------------------------------
// WHAT: reads a Claude Code hook payload on stdin and FIRE-AND-FORGET POSTs the
//   captain's own words to the thalamus (:4113/afferent) as a 'code' afferent —
//   so his study (forge) and FinOps turns flow into the one working memory with
//   ZERO capture tax. Deterministic; no LLM; no API key.
// LAWS (each one keeps the live editor safe — a capture nerve must never bite):
//   · NEVER blocks the session: hard ~250ms timeout on the POST, and if the
//     thalamus is down the failure is swallowed silently.
//   · ALWAYS exits 0 and writes NOTHING to stdout — a UserPromptSubmit hook's
//     stdout would be injected into his prompt, so we emit nothing, ever.
//   · SCRUB obvious secrets before anything leaves the editor.
// WIRED BY: .claude/settings.json → hooks.UserPromptSubmit
// ============================================================================
import { readFileSync } from "node:fs";

const THALAMUS = process.env.ARSENAL_THALAMUS || "http://127.0.0.1:4113";
const SECRET_RE = /sk-[a-z0-9-]{12,}|api[_-]?key\s*[:=]|password\s*[:=]|secret\s*[:=]|token\s*[:=]|BEGIN [A-Z ]*PRIVATE KEY/i;
const die = () => process.exit(0);   // every path out is a clean, silent exit

async function main() {
  let raw = "";
  try { raw = readFileSync(0, "utf8"); } catch { return die(); }
  let hook = {};
  try { hook = JSON.parse(raw || "{}"); } catch { return die(); }

  // Capture BOTH sides of a Claude Code learning turn: his OWN words
  // (UserPromptSubmit) AND what he was TAUGHT (Stop → last_assistant_message), so the
  // brain sees the whole learning turn — not just the question, the answer too.
  const ev = hook.hook_event_name || "";
  let text, source, cap;
  if (ev === "UserPromptSubmit") { text = String(hook.prompt || "").trim(); source = "claude-code"; cap = 1200; }
  else if (ev === "Stop") { text = String(hook.last_assistant_message || "").trim(); source = "claude-code-teaching"; cap = 2000; }
  else return die();
  if (text.length < 3) return die();
  if (SECRET_RE.test(text)) return die();
  // skip slash-commands on HIS side (control, not cognition); teaching is always cognition
  if (source === "claude-code" && /^\//.test(text)) return die();

  const evt = {
    modality: "code",
    source,
    text: text.slice(0, cap),
    cwd: String(hook.cwd || "").split(/[\\/]/).slice(-1)[0] || null,
    ts: new Date().toISOString(),
  };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 250);
    await fetch(THALAMUS + "/afferent", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evt), signal: ctrl.signal,
    });
    clearTimeout(t);
  } catch { /* thalamus down or slow → the session never notices */ }
  die();
}
main().catch(die);
