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
//   · ONLY HIS WORDS — never the organism's own (see SELF-CAPTURE GUARD below).
// WIRED BY: .claude/settings.json → hooks.UserPromptSubmit
// ============================================================================
import { readFileSync } from "node:fs";

const THALAMUS = process.env.ARSENAL_THALAMUS || "http://127.0.0.1:4113";
const SECRET_RE = /sk-[a-z0-9-]{12,}|api[_-]?key\s*[:=]|password\s*[:=]|secret\s*[:=]|token\s*[:=]|BEGIN [A-Z ]*PRIVATE KEY/i;
// SELF-CAPTURE GUARD (E2E audit 25 Jul 2026). Every headless `claude -p` the
// organism spawns (brain, nightshift, dmn, cortex, council, selfknowledge, talk)
// runs inside this project, inherits .claude/settings.json, and fired this hook —
// so the machine's OWN organ prompts were logged as the captain's words. Measured
// on the live bus: 1,826 of 2,510 claude-code afferents (72.7%) were self-talk,
// and the SessionStart brief was quoting an organ prompt back at him as his
// "open loop". Two independent layers, because one can always be forgotten:
//   1. ARSENAL_ORGAN=1 — set by every spawner, inherited by the hook child.
//   2. the machine-preamble signature — belt and braces for any spawner that omits it.
// Layer 2 deliberately does NOT hard-code one preamble: the first purge caught
// "You are an organ of ARSENAL AI FC…" and still left 406 thalamus PULSE prompts
// ("You are the continuous PULSE of a personal learning brain…"). So: an organ
// prompt is second-person role framing PLUS an organism-specific marker. He never
// opens a message that way; every organ prompt in the repo does.
const ORGAN_PREAMBLE_RE = /^\s*You are\b/i;
const ORGAN_MARKER_RE = /ARSENAL AI FC|exocortex|the captain\b|STRICT JSON|personal learning brain/i;
const isSelfTalk = (text) =>
  process.env.ARSENAL_ORGAN === "1" || (ORGAN_PREAMBLE_RE.test(text) && ORGAN_MARKER_RE.test(text));
const die = () => process.exit(0);   // every path out is a clean, silent exit

async function main() {
  let raw = "";
  try { raw = readFileSync(0, "utf8"); } catch { return die(); }
  let hook = {};
  try { hook = JSON.parse(raw || "{}"); } catch { return die(); }

  // Capture BOTH sides of a Claude Code learning turn: his OWN words
  // (UserPromptSubmit) AND what he was TAUGHT (Stop → last_assistant_message), so the
  // brain sees the whole learning turn — not just the question, the answer too.
  // NO CAP. HIS RULING, 6 Aug 2026, in his own words: "there should be no limit."
  // The caps were 1200 on his side and 2000 on mine, and they were silently EATING
  // the record: 175 of 382 captured teaching messages sat exactly at 2000 chars, i.e.
  // 46% were truncated — and what a cap removes is always the END of the message,
  // which is precisely where the check-question, the hand-back and the close live.
  // Any organ that reads this stream to check how he was taught was reading a
  // message with its ending cut off. A truncated record is not a smaller record; it
  // is a record that is wrong in a specific, load-bearing place.
  const ev = hook.hook_event_name || "";
  let text, source;
  if (ev === "UserPromptSubmit") { text = String(hook.prompt || "").trim(); source = "claude-code"; }
  else if (ev === "Stop") { text = String(hook.last_assistant_message || "").trim(); source = "claude-code-teaching"; }
  else return die();
  if (text.length < 3) return die();
  if (isSelfTalk(text)) return die();      // the organism never mistakes itself for him
  if (SECRET_RE.test(text)) return die();
  // skip slash-commands on HIS side (control, not cognition); teaching is always cognition
  if (source === "claude-code" && /^\//.test(text)) return die();

  // THE THREAD (14 Aug 2026, his ruling — "resolved from this moment onwards").
  // Until today a row carried only {modality, source, text, cwd, ts}: the WORDS
  // but not the THREAD. Measured the same day on the live file — an 8-turn arc
  // (46 rows, 192,591 chars) sat interleaved with activitywatch + haiku-pulse
  // rows, and NOTHING in the record said which turn answered which. Storage is
  // cheap and re-analysis is cheap — you can run any future model over the whole
  // archive — but PROVENANCE cannot be recovered after the fact. These five
  // fields are the only part of this plan that is irreversible if skipped, which
  // is why they landed while the rest of the life-scale build parked to 28 Aug.
  //   event_id       · this moment's own identity (dedupe, reference, linking)
  //   session_id     · THE THREAD — which conversation this turn belongs to
  //   surface        · which BODY it came from. He is about to run four (typed ·
  //                    gaffer voice · XR glasses · room TV) and in 2028 "what he
  //                    said out loud" vs "what he typed" are different acts.
  //   v              · schema version of this hook. When this file changes, the
  //                    archive still knows which shape each row was written in.
  //   transcript_path· Claude Code already writes the FULL threaded transcript to
  //                    disk; naming it costs one string and keeps the complete
  //                    record reachable. Metadata is the spine, this is the body.
  // Every field is defensive: a missing hook field degrades to null, never throws
  // — this nerve must never bite the live editor (see LAWS at the top).
  const evt = {
    event_id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    modality: "code",
    source,
    surface: "claude-code",
    session_id: String(hook.session_id || "") || null,
    text,
    cwd: String(hook.cwd || "").split(/[\\/]/).slice(-1)[0] || null,
    transcript_path: String(hook.transcript_path || "") || null,
    v: 2,
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
