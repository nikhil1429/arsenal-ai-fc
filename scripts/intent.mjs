#!/usr/bin/env node
// ============================================================================
// intent.mjs · ARSENAL AI FC — SESSION-INTENT MEMORY (18 Aug 2026, OVERHAUL Block 2 · §7.2)
// ----------------------------------------------------------------------------
// WHY THIS EXISTS (R6 in the overhaul: session-intent amnesia). No organ remembered
// what he asked, what a session promised, what it shipped. He asked "read my last
// N sessions byte by byte" 10+ times; sessions said DONE where DONE was false. This
// lane is the deterministic memory of ASKS: one row per turn at the Stop hook (his
// prompt's head + the reply's head, verbatim), a `close` row when a sitting closes
// with what it promised/shipped, and a nightly DIGEST (brain job `intent_digest`,
// sonnet, gated by §5) that labels each session promised / shipped / open. The brief
// shows the last five OPEN intents; "read my last sessions" is `intent.mjs show`.
//
// LAWS: SOLE WRITER of dressing-room/state/session_intent.jsonl (append-only,
//   gitignored — his words verbatim; the archivist tails it like every jsonl). READS
//   brain_out/intent_digest/<day>.json (brain.mjs writes it — this file NEVER writes
//   under brain_out) and teaching_audit_last.json (the prompt teaching_audit recorded
//   at UserPromptSubmit) — read-only, never touched. Hook path (`stop`) is fail-silent,
//   ≤250 ms, prints NOTHING (a Stop hook's stdout is noise), honours ARSENAL_ORGAN=1
//   (a headless organ session has no intent of his) and the STDIN HANDOFF
//   (turn_hook.mjs contract 1). No LLM here, ever: labels beyond `kind_guess` come
//   from the digest the brain runs, validated on the way in.
// WHO ELSE COULD ACT ON THIS OUTPUT? learnstate/context_manifest (the `brief` provider —
//   ≤ 6 lines, budgeted; consumption stamp `briefed` on the intent_digest job) ·
//   brain.mjs (`intent_digest` job reads `digestInput()`; its sibling parser reads
//   `digestCorpus()` for the no-invented-numbers check) · sitting.mjs (Block 3: writes
//   its promised/shipped through `intent.mjs close`) · archivist (tails the lane) ·
//   watchman (a future RED `intent-digest-missing`; not wired here) · his own read:
//   `intent.mjs show --days 7`. The `kind_guess` (study | build | other) is a keyword
//   GUESS stamped at Stop, never a verdict; the digest may overrule it.
// CLI: node scripts/intent.mjs init | stop | show [--days N] | brief | close --session <id>
//        [--promised "…"]* [--shipped "…"]* [--by <who>] | digest-input [--day YYYY-MM-DD]
//        | selftest
// ============================================================================
import { readFileSync, appendFileSync, existsSync, mkdtempSync, writeFileSync, rmSync, mkdirSync, openSync, readSync, closeSync, fstatSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const STATE_DIR = process.env.ARSENAL_INTENT_STATE_DIR || join(ROOT, "dressing-room", "state");
const LANE = () => join(STATE_DIR, "session_intent.jsonl");
const DIGEST_DIR = () => join(STATE_DIR, "brain_out", "intent_digest");
const AUDIT_LAST = () => join(STATE_DIR, "teaching_audit_last.json");

export const HEAD_CHARS = 400;   // §7.2: his_prompt_head(400 chars)
const TZ_OFFSET_MIN = 330;       // IST — the day key rides his clock, like every organ
export const localDate = (d = new Date()) => new Date(d.getTime() + TZ_OFFSET_MIN * 60000).toISOString().slice(0, 10);

const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
export const readRows = (p = LANE()) => {
  try { return readFileSync(p, "utf8").split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); }
  catch { return []; }
};
const head = (s, n = HEAD_CHARS) => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n);

// ── kind_guess — a keyword GUESS, never a verdict (the digest may overrule it) ──
const STUDY_RE = /\b(samjha|samjhao|padh|padhai|padhao|forge|rejirah|re-jirah|axis|jirah|concept|capsule|gut[- ]?word|knew|shaky|guessed|scrimmage|rematch|drill|quiz|revise|revision|seekh|sikha|explain|teach|learn|lesson|embedding|tokeni[sz]|hallucination|attention|transformer|inference|context window|rag\b|prompt engineering)/i;
const BUILD_RE = /\b(fix|bug|build|commit|push|test|selftest|suite|refactor|deploy|install|error|stack ?trace|hook|daemon|organ|script|schtasks|npm|git|overhaul|resume|plan|block \d|audit|xray|watchman|brain\.mjs|dugout|thalamus|state\.mjs)/i;
export function kindGuess(prompt = "", reply = "") {
  const t = `${prompt} ${reply}`;
  const study = STUDY_RE.test(t), build = BUILD_RE.test(t);
  if (study && !build) return "study";
  if (build && !study) return "build";
  if (study && build) return /forge|rejirah|samjha|padh|axis|gut[- ]?word/i.test(prompt) ? "study" : "build";
  return "other";
}

// ── the prompt head — where it comes from, in precedence ─────────────────────
// 1. teaching_audit_last.json's recorded prompt for THIS session (teaching_audit `hook`
//    records it at UserPromptSubmit — the same wire it uses for confusion-is-literal);
// 2. the transcript's tail (Claude Code JSONL: the last `user` line whose content is
//    HIS text, not a tool_result) — read from the END, at most TAIL_BYTES, so a 10 MB
//    transcript costs nothing;
// 3. nothing — the row still lands, `prompt_source: "none"`, so a silent miss is visible.
const TAIL_BYTES = 256 * 1024;
export function promptFromAuditLast(sessionId, auditLastPath = AUDIT_LAST()) {
  const j = readJson(auditLastPath);
  const p = j && j.prompt;
  if (!p || typeof p.text !== "string" || !p.text.trim()) return null;
  if (sessionId && p.session_id && p.session_id !== sessionId) return null;   // another session's prompt — never reused
  return { text: p.text, at: p.at || null };
}
export function promptFromTranscript(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) return null;
  let raw = "";
  try {
    const fd = openSync(transcriptPath, "r");
    try {
      const size = fstatSync(fd).size;
      const start = Math.max(0, size - TAIL_BYTES);
      const buf = Buffer.alloc(size - start);
      readSync(fd, buf, 0, buf.length, start);
      raw = buf.toString("utf8");
    } finally { closeSync(fd); }
  } catch { return null; }
  const lines = raw.split(/\r?\n/).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    let j = null; try { j = JSON.parse(lines[i]); } catch { continue; }   // the first line may be a torn tail
    if (!j || j.type !== "user" || !j.message) continue;
    const c = j.message.content;
    if (typeof c === "string" && c.trim()) return { text: c, at: j.timestamp || null };
    if (Array.isArray(c)) {
      const t = c.filter((b) => b && b.type === "text" && typeof b.text === "string" && b.text.trim()).map((b) => b.text).join("\n");
      if (t.trim()) return { text: t, at: j.timestamp || null };
    }
  }
  return null;
}

// ── the rows ─────────────────────────────────────────────────────────────────
export function turnRow(hook = {}, deps = {}) {
  const now = deps.now || new Date();
  const sid = typeof hook.session_id === "string" ? hook.session_id : null;
  const fromAudit = deps.promptFromAuditLast ? deps.promptFromAuditLast(sid) : promptFromAuditLast(sid);
  const fromTx = fromAudit ? null : (deps.promptFromTranscript ? deps.promptFromTranscript(hook.transcript_path) : promptFromTranscript(hook.transcript_path));
  const src = fromAudit ? "teaching_audit_last" : fromTx ? "transcript_tail" : "none";
  const promptText = (fromAudit || fromTx || {}).text || "";
  const replyText = typeof hook.last_assistant_message === "string" ? hook.last_assistant_message : "";
  return {
    kind: "turn", ts: now.toISOString(), day: localDate(now), session_id: sid, surface: deps.surface || "code",
    prompt_head: head(promptText), reply_head: head(replyText),
    prompt_source: src, kind_guess: kindGuess(promptText, replyText),
  };
}
export function appendRow(row, lane = LANE()) {
  try { mkdirSync(dirname(lane), { recursive: true }); appendFileSync(lane, JSON.stringify(row) + "\n"); return true; }
  catch { return false; }
}

// ── the digest (brain_out/intent_digest/<day>.json — READ ONLY here) ────────
export function readDigests(days = 7, dir = DIGEST_DIR(), now = new Date()) {
  const out = [];
  for (let i = 0; i < days; i++) {
    const day = localDate(new Date(now.getTime() - i * 86400000));
    const j = readJson(join(dir, day + ".json"));
    if (j && Array.isArray(j.sessions)) out.push({ day, ...j });
  }
  return out;
}

// ── grouping — a session is the unit an intent lives in ─────────────────────
export function sessions({ rows = readRows(), days = 7, now = new Date(), digests = null } = {}) {
  const since = now.getTime() - days * 86400000;
  const by = new Map();
  for (const r of rows) {
    if (!r || !r.session_id || !r.ts || Date.parse(r.ts) < since) continue;
    if (!by.has(r.session_id)) by.set(r.session_id, { session_id: r.session_id, surface: r.surface || "code", first_at: r.ts, last_at: r.ts, day: r.day || localDate(new Date(r.ts)), turns: 0, prompts: [], replies: [], kinds: {}, close: null });
    const s = by.get(r.session_id);
    if (r.kind === "turn") {
      s.turns++; s.last_at = r.ts;
      if (r.prompt_head) s.prompts.push(r.prompt_head);
      if (r.reply_head) s.replies.push(r.reply_head);
      s.kinds[r.kind_guess || "other"] = (s.kinds[r.kind_guess || "other"] || 0) + 1;
    } else if (r.kind === "close") {
      s.close = { promised: r.promised || [], shipped: r.shipped || [], by: r.by || null, ts: r.ts };
      s.last_at = r.ts;
    }
  }
  const dg = digests || readDigests(days + 1, undefined, now);
  const labelOf = new Map();
  for (const d of dg) for (const x of d.sessions || []) if (x && x.session_id && !labelOf.has(x.session_id)) labelOf.set(x.session_id, { ...x, day: d.day });
  const list = [...by.values()].map((s) => {
    const kind_guess = Object.entries(s.kinds).sort((a, b) => b[1] - a[1])[0]?.[0] || "other";
    const d = labelOf.get(s.session_id) || null;
    const promised = (d && d.promised) || (s.close && s.close.promised) || [];
    const shipped = (d && d.shipped) || (s.close && s.close.shipped) || [];
    const open = d ? (d.open || []) : null;   // null = no digest yet (undigested ≠ nothing open)
    return { ...s, kind: (d && d.kind) || kind_guess, kind_guess, promised, shipped, open, digested: !!d };
  });
  return list.sort((a, b) => (a.last_at < b.last_at ? 1 : a.last_at > b.last_at ? -1 : 0));
}

// ── the brief provider — ≤ 6 lines, the last 5 OPEN intents ─────────────────
// "open" = a digested session with open items, or an undigested session (its ask is
// on record and nobody has said what shipped). Newest first. Pure over `sessions()`.
export function briefLines({ rows, days = 3, now = new Date(), digests, max = 5 } = {}) {
  const list = sessions({ rows, days, now, digests }).filter((s) => s.turns > 0 && (s.open === null ? true : s.open.length > 0));
  if (!list.length) return [];
  const L = [`--- SESSION INTENTS (last ${days}d · his asks, what shipped, what is still open — \`node scripts/intent.mjs show\`) ---`];
  for (const s of list.slice(0, max)) {
    const ask = head(s.prompts[0] || "", 72);
    const tail = s.digested ? `open: ${s.open.map((o) => head(o, 48)).join(" · ") || "—"}${s.shipped.length ? ` · shipped: ${s.shipped.length}` : ""}` : `undigested — ${s.turns} turn(s)`;
    L.push(`  · ${s.day} ${s.surface} [${s.kind}] "${ask}" → ${tail}`);
  }
  return L;
}

// ── the digest INPUT — what the brain job reads (grouped, clipped, no raw lane dump) ──
export function digestInput({ rows, day = localDate(), maxPrompts = 12 } = {}) {
  const all = (rows || readRows()).filter((r) => r && r.kind === "turn" && (r.day || localDate(new Date(r.ts))) === day);
  const by = new Map();
  for (const r of all) {
    if (!by.has(r.session_id)) by.set(r.session_id, { session_id: r.session_id, surface: r.surface || "code", first_at: r.ts, last_at: r.ts, turns: 0, prompts: [], replies: [], kind_guess: {} });
    const s = by.get(r.session_id);
    s.turns++; s.last_at = r.ts;
    if (r.prompt_head && s.prompts.length < maxPrompts) s.prompts.push(head(r.prompt_head, 200));
    if (r.reply_head && s.replies.length < maxPrompts) s.replies.push(head(r.reply_head, 200));
    s.kind_guess[r.kind_guess || "other"] = (s.kind_guess[r.kind_guess || "other"] || 0) + 1;
  }
  return { day, sessions: [...by.values()].map((s) => ({ ...s, kind_guess: Object.entries(s.kind_guess).sort((a, b) => b[1] - a[1])[0]?.[0] || "other" })) };
}
// the corpus the digest may quote numbers from — the no-invented-numbers haystack
export function digestCorpus(input) { return (input.sessions || []).flatMap((s) => [...s.prompts, ...s.replies]).join("\n"); }

// ── validate a digest (used by brain.mjs's sibling parser) ───────────────────
// Rules: only session_ids that exist in the input survive; kind ∈ study|build|other;
// promised/shipped/open are arrays of short strings; a string carrying a number that
// appears NOWHERE in the input corpus is dropped (the no-invented-numbers law); the
// verdict says what it dropped and why — never a silent trim.
export function validateDigest(j, input) {
  if (!j || typeof j !== "object" || !Array.isArray(j.sessions)) return null;
  const known = new Set((input.sessions || []).map((s) => s.session_id));
  const corpusNums = new Set((digestCorpus(input).match(/\d[\d,.]*/g) || []).map((n) => n.replace(/[.,]$/, "")));
  const dropped = [];
  const okStr = (v) => typeof v === "string" && v.trim().length > 0 && v.length <= 300;
  const clean = (arr, sid, field) => (Array.isArray(arr) ? arr : []).filter((v) => {
    if (!okStr(v)) { dropped.push({ session_id: sid, field, why: "not a short string" }); return false; }
    const nums = v.match(/\d[\d,.]*/g) || [];
    const bad = nums.map((n) => n.replace(/[.,]$/, "")).find((n) => !corpusNums.has(n));
    if (bad !== undefined) { dropped.push({ session_id: sid, field, why: `number ${bad} not in the input`, text: v.slice(0, 80) }); return false; }
    return true;
  }).map((v) => v.trim().slice(0, 300));
  const sessions = [];
  for (const s of j.sessions) {
    if (!s || !known.has(s.session_id)) { dropped.push({ session_id: s && s.session_id, why: "unknown session_id" }); continue; }
    const kind = ["study", "build", "other"].includes(s.kind) ? s.kind : "other";
    sessions.push({ session_id: s.session_id, kind, promised: clean(s.promised, s.session_id, "promised"), shipped: clean(s.shipped, s.session_id, "shipped"), open: clean(s.open, s.session_id, "open") });
  }
  return { date: input.day, sessions, ...(dropped.length ? { dropped } : {}) };
}

// ── show — his "read my last sessions" ───────────────────────────────────────
export function showLines({ rows, days = 7, now = new Date(), digests } = {}) {
  const list = sessions({ rows, days, now, digests });
  const L = [`== SESSION INTENTS — last ${days} day(s) · ${list.length} session(s) (newest first) ==`];
  if (!list.length) { L.push("  (nothing recorded yet — the Stop hook appends a row per turn; the first study session fills this)"); return L; }
  for (const s of list) {
    L.push(`  ${s.day} ${String(s.first_at).slice(11, 16)}Z ${s.surface} · ${s.turns} turn(s) · ${s.kind}${s.digested ? "" : " (guess — no digest yet)"} · ${s.session_id.slice(0, 8)}`);
    if (s.prompts[0]) L.push(`     asked: "${head(s.prompts[0], 110)}"`);
    if (s.promised.length) L.push(`     promised: ${s.promised.map((x) => head(x, 60)).join(" · ")}`);
    if (s.shipped.length) L.push(`     shipped: ${s.shipped.map((x) => head(x, 60)).join(" · ")}`);
    if (s.open === null) L.push(`     open: undigested (the nightly intent_digest labels this)`);
    else L.push(`     open: ${s.open.length ? s.open.map((x) => head(x, 60)).join(" · ") : "— (nothing left open)"}`);
  }
  return L;
}

// ── SELFTEST — hermetic (a fixture state dir; the live lane is never touched) ──
function selftest() {
  let pass = 0, fail = 0; const fails = [];
  const assert = (name, cond, detail) => { if (cond) { pass++; console.log(`  ok   ${name}`); } else { fail++; fails.push({ name, detail }); console.log(`  FAIL ${name}${detail ? `\n         ${detail}` : ""}`); } };
  console.log("=== intent.mjs selftest (hermetic — fixture dir, no live write) ===\n");
  const tmp = mkdtempSync(join(tmpdir(), "intent-"));
  const lane = join(tmp, "session_intent.jsonl");
  const NOW = new Date("2026-08-18T05:00:00.000Z");
  // 1. a turn row from a Stop payload, prompt via the audit-last precedence
  const audit = { prompt: { text: "hallucinations ka axis d samjhao — main abhi tokenization pe tha, guessed", session_id: "sess-A", at: "2026-08-18T04:59:00.000Z" } };
  const r1 = turnRow({ session_id: "sess-A", transcript_path: null, last_assistant_message: "Axis d = grounding. Ek check-question: model kab confabulate karta hai?" },
    { now: NOW, promptFromAuditLast: (sid) => (sid === "sess-A" ? { text: audit.prompt.text } : null) });
  assert("turnRow: prompt head comes from teaching_audit_last (same session), reply head from the payload, kind_guess study", r1.prompt_source === "teaching_audit_last" && r1.prompt_head.startsWith("hallucinations ka axis d") && r1.reply_head.startsWith("Axis d = grounding") && r1.kind_guess === "study" && r1.kind === "turn" && r1.day === "2026-08-18");
  assert("turnRow: another session's recorded prompt is NEVER reused (prompt_source falls through)", turnRow({ session_id: "sess-B" }, { now: NOW, promptFromAuditLast: (sid) => (sid === "sess-A" ? { text: "x" } : null), promptFromTranscript: () => null }).prompt_source === "none");
  // 2. transcript tail — a fixture JSONL with tool_result noise after his last words
  const tx = join(tmp, "t.jsonl");
  writeFileSync(tx, [
    JSON.stringify({ type: "user", message: { role: "user", content: "pehla sawaal — build fix karo" }, timestamp: "2026-08-18T04:00:00Z" }),
    JSON.stringify({ type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "kar raha hoon" }] } }),
    JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "text", text: "ab embeddings samjhao, dheere" }] }, timestamp: "2026-08-18T04:30:00Z" }),
    JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "tool_result", tool_use_id: "t1", content: "ok" }] } }),
    "{\"type\":\"assistant\",\"mess",   // a torn tail line — must not break the read
  ].join("\n"));
  const p2 = promptFromTranscript(tx);
  assert("transcript tail: the LAST user line with HIS text wins (tool_result lines and a torn tail are skipped)", !!p2 && p2.text === "ab embeddings samjhao, dheere");
  const r2 = turnRow({ session_id: "sess-C", transcript_path: tx, last_assistant_message: "Embedding = number line pe jagah" }, { now: NOW, promptFromAuditLast: () => null });
  assert("turnRow: falls back to the transcript tail and says so", r2.prompt_source === "transcript_tail" && r2.prompt_head === "ab embeddings samjhao, dheere" && r2.kind_guess === "study");
  // 3. append + read + grouping + brief + show (fixture lane)
  assert("appendRow writes one JSON line per row (append-only)", appendRow(r1, lane) && appendRow(r2, lane) && appendRow({ ...r1, ts: "2026-08-18T05:01:00.000Z", prompt_head: "commit karo aur test chalao", reply_head: "npm test 48/48, pushed", kind_guess: "build" }, lane) && readRows(lane).length === 3);
  const list = sessions({ rows: readRows(lane), days: 7, now: NOW, digests: [] });
  assert("sessions(): grouped by session_id, newest first, turn counts + kind_guess majority", list.length === 2 && list[0].session_id === "sess-A" && list[0].turns === 2 && list[1].session_id === "sess-C" && list[0].kind_guess === "study" && list[0].open === null && !list[0].digested);
  const bl = briefLines({ rows: readRows(lane), days: 7, now: NOW, digests: [] });
  assert("brief: ≤ 6 lines, header + one line per open/undigested session, newest first, prompt head clipped", bl.length === 3 && bl.length <= 6 && /SESSION INTENTS/.test(bl[0]) && /sess|undigested — 2 turn/.test(bl[1]) && bl[1].includes('"hallucinations ka axis d samjhao'));
  // 4. a digest labels a session — open items make it stay in the brief; none = it leaves
  const dig = [{ day: "2026-08-18", date: "2026-08-18", sessions: [{ session_id: "sess-A", kind: "study", promised: ["axis d ka check-question"], shipped: [], open: ["axis d ka jirah baaki"] }, { session_id: "sess-C", kind: "study", promised: [], shipped: ["embeddings ka number-line samjhaya"], open: [] }] }];
  const list2 = sessions({ rows: readRows(lane), days: 7, now: NOW, digests: dig });
  assert("digest joins by session_id: kind/promised/shipped/open come from the digest, `digested` true", list2[0].digested && list2[0].open.length === 1 && list2[0].promised[0] === "axis d ka check-question" && list2[1].shipped.length === 1 && list2[1].open.length === 0);
  const bl2 = briefLines({ rows: readRows(lane), days: 7, now: NOW, digests: dig });
  assert("brief after the digest: only sessions with OPEN items remain (sess-C, all shipped, drops out)", bl2.length === 2 && /open: axis d ka jirah baaki/.test(bl2[1]) && !bl2.some((l) => /sess-C|number-line/.test(l)));
  const sh = showLines({ rows: readRows(lane), days: 7, now: NOW, digests: dig });
  assert("show: one block per session with asked / promised / shipped / open", sh.length >= 7 && sh.some((l) => /asked: "hallucinations/.test(l)) && sh.some((l) => /open: axis d ka jirah baaki/.test(l)) && sh.some((l) => /nothing left open/.test(l)));
  // 5. digest input + validation — the no-invented-numbers law
  const inp = digestInput({ rows: readRows(lane), day: "2026-08-18" });
  assert("digestInput: grouped per session for ONE day, prompts/replies clipped, kind_guess majority", inp.day === "2026-08-18" && inp.sessions.length === 2 && inp.sessions.find((s) => s.session_id === "sess-A").turns === 2 && inp.sessions.every((s) => s.prompts.every((p) => p.length <= 200)));
  const v = validateDigest({ sessions: [
    { session_id: "sess-A", kind: "study", promised: ["axis d ka check-question"], shipped: ["npm test 48/48 chala"], open: ["axis d ka jirah — 3 sawaal baaki"] },
    { session_id: "ghost", kind: "study", promised: ["x"], shipped: [], open: [] },
    { session_id: "sess-C", kind: "nonsense", promised: [42], shipped: ["embeddings ka number-line"], open: [] },
  ] }, inp);
  assert("validateDigest: unknown session dropped · unknown kind → other · non-string dropped · a number NOT in the input corpus is dropped and NAMED (48/48 IS in the corpus, 3 is not)",
    v.sessions.length === 2 && v.sessions[0].shipped.length === 1 && v.sessions[0].open.length === 0 && v.sessions[1].kind === "other" && v.sessions[1].promised.length === 0
    && v.dropped.some((d) => d.why === "unknown session_id") && v.dropped.some((d) => /number 3 not in the input/.test(d.why)) && v.dropped.some((d) => d.why === "not a short string"), JSON.stringify(v));
  assert("validateDigest: a reply that is not the shape returns null (the sibling stays ABSENT, degraded not fatal)", validateDigest({ nope: 1 }, inp) === null && validateDigest(null, inp) === null);
  // 6. kind_guess — a guess, both ways
  assert("kindGuess: study words → study, build words → build, neither → other", kindGuess("forge embeddings") === "study" && kindGuess("fix the daemon and commit") === "build" && kindGuess("hello") === "other");
  // 7. the hook path is silent + organ-guarded (source facts, since the CLI is not spawned here)
  const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
  assert("the `stop` verb honours ARSENAL_ORGAN=1 and the STDIN HANDOFF, prints nothing, never throws (source law)", /ARSENAL_ORGAN === "1"/.test(src) && /__ARSENAL_HOOK_STDIN__/.test(src) && /case "stop"/.test(src));
  assert("this file writes ONLY session_intent.jsonl (sole writer: one append site + the empty-lane init) and never under brain_out", !/writeFileSync\([^)]*brain_out/.test(src.replace(/\/\/.*$/gm, "")) && (src.match(/appendFileSync\(/g) || []).length === 1 && (src.match(/writeFileSync\(lane, ""\)/g) || []).length === 1);
  rmSync(tmp, { recursive: true, force: true });
  console.log(`\nintent: ${pass} passed, ${fail} failed`);
  if (fail) for (const f of fails) console.log(`  · ${f.name}${f.detail ? `\n      ${f.detail}` : ""}`);
  process.exit(fail ? 1 : 0);
}

// ── CLI ──────────────────────────────────────────────────────────────────────
function hookPayload() {
  const handed = globalThis.__ARSENAL_HOOK_STDIN__;
  let raw = "";
  try {
    if (typeof handed === "string") raw = handed;
    else if (!process.stdin.isTTY) raw = readFileSync(0, "utf8");
  } catch { raw = ""; }
  try { const j = JSON.parse(raw || "{}"); return j && typeof j === "object" ? j : {}; } catch { return {}; }
}
function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  const argv = process.argv.slice(3);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const opts = (k) => argv.map((a, i) => (a === k ? argv[i + 1] : null)).filter((v) => typeof v === "string");
  switch (mode) {
    case "stop": {                        // HOOK PATH — silent, fail-silent, organ-guarded
      if (process.env.ARSENAL_ORGAN === "1") return;
      try {
        const hook = hookPayload();
        if (!hook.session_id) return;      // no session, no intent — never a fabricated row
        appendRow(turnRow(hook));
      } catch { /* silence is the contract */ }
      return;
    }
    case "close": {
      const sid = opt("--session");
      if (!sid) { console.error("intent: close --session <id> [--promised …]* [--shipped …]* [--by <who>]"); process.exit(1); }
      const row = { kind: "close", ts: new Date().toISOString(), day: localDate(), session_id: sid, surface: opt("--surface") || "voice", promised: opts("--promised"), shipped: opts("--shipped"), by: opt("--by") || "sitting" };
      console.log(appendRow(row) ? `intent: close recorded for ${sid} (${row.promised.length} promised · ${row.shipped.length} shipped)` : "intent: close NOT recorded (lane unwritable)");
      return;
    }
    case "init": {
      // The lane exists from birth (idempotent): brain_config declares it a REQUIRED input
      // of intent_digest, so THE GATE's E and brain's #64 net both read "present, empty"
      // instead of "absent" between the first install and the first Stop. Empty ≠ absent.
      const lane = LANE();
      if (existsSync(lane)) { console.log(`intent: lane present (${readRows(lane).length} row(s)) — ${lane}`); return; }
      try { mkdirSync(dirname(lane), { recursive: true }); writeFileSync(lane, ""); console.log(`intent: lane created empty — ${lane}`); }
      catch (e) { console.error(`intent: could not create the lane — ${String((e && e.message) || e).slice(0, 80)}`); process.exit(1); }
      return;
    }
    case "show": { const days = Number(opt("--days")) || 7; for (const l of showLines({ days })) console.log(l); return; }
    case "brief": { for (const l of briefLines({ days: Number(opt("--days")) || 3 })) console.log(l); return; }
    case "digest-input": { console.log(JSON.stringify(digestInput({ day: opt("--day") || localDate() }), null, 1)); return; }
    case "selftest": return selftest();
    default:
      console.log("intent.mjs — init | stop (hook) | show [--days N] | brief [--days N] | close --session <id> [--promised …]* [--shipped …]* [--by <who>] | digest-input [--day YYYY-MM-DD] | selftest");
      if (mode) process.exit(1);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
