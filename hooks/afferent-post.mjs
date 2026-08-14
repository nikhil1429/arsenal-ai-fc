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
//   · SCRUB secrets before anything leaves the editor — since v3 by REDACTING
//     the credential and KEEPING his words, not by dropping the whole turn
//     (see THE SCRUBBER below; the drop path survives for the two cases where a
//     redaction cannot be bounded).
//   · ONLY HIS WORDS — never the organism's own (see SELF-CAPTURE GUARD below).
// WIRED BY: .claude/settings.json → hooks.UserPromptSubmit
// ============================================================================
import { readFileSync } from "node:fs";
import { join } from "node:path";

const THALAMUS = process.env.ARSENAL_THALAMUS || "http://127.0.0.1:4113";
const ZONE = "Asia/Kolkata";

// ── THE SCRUBBER (rebuilt 14 Aug 2026 — ARCHIVE__DAY_ONE_SPEC.md §7.5) ───────
// FROZEN, the shape this file carried until today (layering, never replace):
//   const SECRET_RE = /sk-[a-z0-9-]{12,}|api[_-]?key\s*[:=]|password\s*[:=]|
//                      secret\s*[:=]|token\s*[:=]|BEGIN [A-Z ]*PRIVATE KEY/i;
// It had TWO defects, one proven live the day this was rewritten:
//   1. A REAL HOLE. It does not match `sb_publishable_` / `sb_secret_`. On
//      14 Aug 2026 he pasted a Supabase key into a turn and it went to the bus
//      unscrubbed. No harm done (afferent.jsonl is gitignored, .gitignore:185),
//      but the scrubber had a hole, and life-scale capture is about to widen it.
//   2. THE FIX FOR (1) WOULD HAVE MADE THE SECOND DEFECT WORSE. A match DROPS
//      THE WHOLE TURN — so every pattern added costs him more of his own words.
//      The 14 Aug message was ~40 words of his thinking with one key inside it.
//      Adding patterns to a drop-list means losing more thinking, in the exact
//      week the ARCHIVE goes in — whose LAW 3 is "nothing is ever rejected at
//      the door; filtering belongs to the READER, never to the WRITER."
// So the live path REDACTS the credential and keeps his words. Three tiers:
//   HARD  — a recognisable credential token → the TOKEN is replaced, the message
//           survives, and `redactions` names what was taken out.
//   BLOCK — a PEM private key: the secret is the multi-line BODY, which no token
//           regex can bound. The whole turn is dropped, as before.
//   HINT  — `password: <something we could not identify>` → dropped, as before.
//           Deliberately does NOT fire when the value was already redacted, and
//           does not fire on a bare `api_key =` with nothing after it: there is
//           provably no secret in either, and dropping them was pure loss.
// Net effect: nothing that flows today gets dropped tomorrow, and the class of
// message that leaked a key today is now kept AND safe.
const SECRET_RE_LEGACY = /sk-[a-z0-9-]{12,}|api[_-]?key\s*[:=]|password\s*[:=]|secret\s*[:=]|token\s*[:=]|BEGIN [A-Z ]*PRIVATE KEY/i;
const HARD_SECRETS = [
  [/\bsk-(?:ant-)?[A-Za-z0-9_-]{16,}/g, "anthropic-or-openai-key"],
  [/\bsk_(?:live|test)_[A-Za-z0-9]{10,}/g, "stripe-key"],
  [/\bsb_(?:publishable|secret)_[A-Za-z0-9_-]{10,}/g, "supabase-key"],
  [/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, "jwt"],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}/g, "github-token"],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}/g, "slack-token"],
  [/\bAKIA[0-9A-Z]{16}\b/g, "aws-access-key-id"],
  [/\bAIza[0-9A-Za-z_-]{30,}/g, "google-api-key"],
  [/\bya29\.[0-9A-Za-z_-]{20,}/g, "google-oauth-token"],
  [/\bBearer\s+[A-Za-z0-9._~+/-]{20,}=*/g, "bearer-token"],
  [/\b(?:api[_-]?key|apikey|secret|password|passwd|token|access[_-]?token|client[_-]?secret)\b\s*[:=]\s*["']?([^\s"',;]{6,})/gi, "key-value"],
];
const BLOCK_RE = /BEGIN [A-Z ]*PRIVATE KEY/i;
const HINT_RE = /\b(?:api[_-]?key|apikey|secret|password|passwd|token|access[_-]?token|client[_-]?secret)\b\s*[:=]\s*(?!\[REDACTED)["']?\S/i;
function scrub(text) {
  const redactions = [];
  let out = text;
  for (const [re, label] of HARD_SECRETS) {
    out = out.replace(re, (m, val) => {
      redactions.push(label);
      if (label !== "key-value") return `[REDACTED:${label}]`;
      const i = m.lastIndexOf(val);                 // replace the VALUE, never the key's name
      return m.slice(0, i) + `[REDACTED:${label}]` + m.slice(i + val.length);
    });
  }
  return { text: out, redactions };
}

// ── THE MOMENT (ARCHIVE__DAY_ONE_SPEC.md §5.3) ───────────────────────────────
// sprint.json, the forge session and readiness.json are OVERWRITTEN as the
// organism runs. The words survive; the STATE does not — a record from three
// weeks ago can never again tell you which task was live when it was written,
// unless it was stamped HERE, at write time.
// DELIBERATELY DUPLICATED from scripts/archivist.mjs currentMoment(): this file
// imports nothing but node:fs/node:path on purpose (an import graph is a way for
// a capture nerve to start biting), and three small readFileSync calls are ~1 ms.
// Every read is wrapped, a missing value is null, and nothing here can throw.
function moment(cwd) {
  const m = { sprint_task: null, forge_step: null, forge_concept: null, readiness: null, focus_app: null, cwd };
  const rd = (f) => { try { return JSON.parse(readFileSync(join(process.cwd(), "dressing-room", "state", f), "utf8")); } catch { return null; } };
  try {
    const cur = (rd("sprint.json") || {}).progress;
    if (cur && cur.current) m.sprint_task = [cur.current.id, cur.current.task].filter(Boolean).join(" ") || null;
  } catch { /* never throws */ }
  try {
    const f = rd("forge_session.json");
    if (f && f.concept && !f.closed_at) { m.forge_step = Number.isFinite(f.step) ? f.step : null; m.forge_concept = f.concept; }
  } catch { /* never throws */ }
  try {
    const r = rd("readiness.json");
    if (r && r.verdict) m.readiness = { verdict: r.verdict, day: r.day || null };
  } catch { /* never throws */ }
  // focus_app stays NULL, and that is a decision, not an omission. No local file
  // knows the CURRENT focus app — timeaudit.json holds a DAY AGGREGATE
  // ("claude.exe 270m") and stamping a day total onto a moment would be exactly
  // the kind of quiet lie the archive exists to prevent. Reading the foreground
  // window needs a native call or a PowerShell spawn, both far past this hook's
  // ~250 ms budget. A surface that really knows its focus app carries it itself.
  return m;
}

// The WALL CLOCK, with its offset and its zone NAME. Never store only UTC:
// "he wrote this at 3am" is different information from the UTC instant, and for
// a man whose sleep schedule is inverted it is the most behaviourally
// informative field in the whole archive. The offset is DERIVED for this instant
// (not the +05:30 constant) so a zone-rule change is honoured, and the NAME is
// stored too, because offsets change when he travels and the name preserves intent.
function wallClock(d) {
  let off = 330;
  try {
    const p = {};
    for (const part of new Intl.DateTimeFormat("en-US", { timeZone: ZONE, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(d)) {
      if (part.type !== "literal") p[part.type] = part.value;
    }
    off = Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - (d.getTime() - d.getMilliseconds())) / 60000);
  } catch { /* no ICU → +05:30, which has been true since 1945 */ }
  const s = off < 0 ? "-" : "+", a = Math.abs(off);
  const hh = String(Math.floor(a / 60)).padStart(2, "0"), mm = String(a % 60).padStart(2, "0");
  return { ts_local: new Date(d.getTime() + off * 60000).toISOString().replace("Z", `${s}${hh}:${mm}`), tz: ZONE };
}
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
  if (BLOCK_RE.test(text)) return die();   // a PEM body cannot be bounded by a token regex
  const scrubbed = scrub(text);
  text = scrubbed.text;
  if (HINT_RE.test(text)) return die();    // a credential we could not identify — drop, as before
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
  // v3 (14 Aug 2026, ARCHIVE__DAY_ONE_SPEC.md §7.2 — ADDITIVE ONLY). Three more
  // irrecoverable facts join the five above, all of them things a later pass can
  // never reconstruct:
  //   ts_local + tz · the WALL CLOCK (see wallClock() above)
  //   tier          · sensitivity, stamped at write time, DEFAULT private. LAW 7:
  //                   only ever RELAXED by an explicit act, never tightened
  //                   retroactively, because you cannot un-see.
  //   moment        · the state that overwrites itself (see moment() above)
  //   redactions    · what the scrubber took out, so a reader knows a redaction
  //                   happened rather than silently reading a doctored sentence
  // DELIBERATELY NOT HERE: `seq` and the hashes. The archivist assigns those. A
  // counter file inside a nerve that must never bite is a new failure mode on the
  // hot path, for a field that is strictly better computed off it.
  const now = new Date();
  const clock = wallClock(now);
  const cwd = String(hook.cwd || "").split(/[\\/]/).slice(-1)[0] || null;
  const evt = {
    event_id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    modality: "code",
    source,
    surface: "claude-code",
    session_id: String(hook.session_id || "") || null,
    text,
    cwd,
    transcript_path: String(hook.transcript_path || "") || null,
    tier: "private",
    moment: moment(cwd),
    redactions: scrubbed.redactions.length ? scrubbed.redactions : null,
    v: 3,
    ts: now.toISOString(),
    ts_local: clock.ts_local,
    tz: clock.tz,
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
