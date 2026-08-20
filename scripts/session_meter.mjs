#!/usr/bin/env node
// ============================================================================
// session_meter.mjs · ARSENAL AI FC — THE OTHER HALF OF THE SPEND
//   (THE ORGANISM AUDIT §10-C · rung S1(a), 20 Aug 2026)
//   SOLE WRITER of dressing-room/state/session_meter.json (its own offset cache).
//   Writes nothing else, ever. Reads ~/.claude/projects/**/*.jsonl — HIS transcripts.
// ----------------------------------------------------------------------------
// THE BLIND SPOT THIS CLOSES (§3 of the order, measured 19 Aug 2026): *"the brain
//   ledger cannot see his Claude Code or Gaffer sessions."* Every lane the organism
//   fires is metered in brain_ledger.jsonl, so the board could always answer "what did
//   the ORGANISM spend" — and never "what did HE spend". The 19-Aug reading session
//   burned 505.02 lakh weighted, ~2× the organism's entire week, and NOTHING in the
//   repo could see it until a human added it up by hand the next morning. A meter that
//   only watches the cheap half is not a meter.
//
// TIER 0, BY LAW T. The numbers are already on disk: every assistant turn in every
//   session JSONL under ~/.claude/projects carries a `message.usage` block. Parsing
//   them costs ZERO model tokens. No API, no OTel collector, no daemon — free code
//   answering a question that used to need a post-mortem.
//
// THE FOUR RULES THIS ORGAN OBEYS
//   1. HIS vs THE ORGANISM, never mixed. `entrypoint: "sdk-cli"` is a headless
//      `claude -p` lane — the organism's own, ALREADY metered in brain_ledger, and
//      counting it here would double-count it. Every other entrypoint (claude-desktop,
//      cli, vscode, …) is HIM. A row with NO entrypoint is `unknown` and is printed as
//      `unknown` — never quietly folded into either side. (§4's law: a number that
//      flatters itself by dropping what it cannot read is worse than an admitted gap.)
//   2. SIDECHAINS COUNT. A subagent's turns live in the same transcript with
//      `isSidechain: true`. The 19-Aug disaster WAS the sidechains — a meter that
//      skipped them would have reported the one number that was already fine.
//   3. DEDUP OR OVER-COUNT. Resuming/forking a session copies earlier turns into a
//      NEW file; two files then carry the same assistant message. The key is
//      `message.id|requestId`, hashed short, first-seen-wins across files in mtime
//      order. Measured on his corpus before this existed: two 20-Aug files carried
//      byte-identical usage rows for the same turn.
//   4. THE HOOK NEVER SWEEPS. `stop` tail-parses ONE file — this session's transcript
//      — and reads the day total out of the cache. The full sweep of ~800 files/week
//      rides `line`/`today`/`report`, i.e. the state surface a human asked for. The
//      450 ms turn_hook budget is law (turn_hook.mjs BUDGET_MS) and a meter that
//      broke it would be uninstalled within a day, which meters nothing.
//
// WHY THE STOP HOOK AND NOT THE TURN START: the order says it in one line — the turn
//   start is the ONE anchor that is on his critical path (he is waiting, mid-thought),
//   and the number is only interesting AFTER the turn that spent it. Stop is free.
//
// THE CEILING (§10-D rule 2). A rung's ceiling is a STOP, not a suggestion, and until
//   now nothing could enforce it because nothing could see the spend. Export
//   ARSENAL_RUNG_CEILING=<lakh> (or pass --ceiling <lakh>) and every stop line carries
//   `rung <used>/<ceiling> lakh (NN%)` — the session can see its own brake.
//
// LAWS: read-only on everything except its own cache · never proposes a budget (a
//   number this repo has not ruled on is a RULING, never an auto-fix — treasury.mjs's
//   rule) · fail-silent on a hook path, loud on a CLI path · ARSENAL_ORGAN=1 ⇒ zero bytes.
// WHO ELSE COULD ACT ON THIS OUTPUT? state.mjs (`week` — the `sessions` line, wired) ·
//   treasury.mjs (could fold his half into the ρ table — NOT wired, deliberate: that is
//   a design decision, not a patch) · brain.mjs (never: it owns the organism's half only).
// CLI: node scripts/session_meter.mjs [line|today|status|report [days]|stop|sweep|selftest]
// ============================================================================
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, openSync, readSync, closeSync, renameSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir, tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const STATE_DIR = join(ROOT, "dressing-room", "state");
const CACHE = join(STATE_DIR, "session_meter.json");

// brain.mjs's cost weights, restated here as the only arithmetic this organ performs.
// They are NOT this organ's to change (treasury.mjs's precedent and its exact words).
export const W = { input: 1, cache_write: 1.25, cache_read: 0.1, output: 5 };
export const LANES = ["his", "organism", "unknown"];   // index 0/1/2 in a cached row
const CACHE_VERSION = 1;
const WINDOW_DAYS = 7;

export function projectsDir() {
  const cfg = process.env.CLAUDE_CONFIG_DIR && process.env.CLAUDE_CONFIG_DIR.trim();
  return join(cfg || join(homedir(), ".claude"), "projects");
}

// ── PURE: one transcript row → what it spent, and whose spend it was ────────
const num = (x) => (Number.isFinite(+x) ? +x : 0);

export function usageOf(row) {
  const m = row && row.message;
  if (!row || row.type !== "assistant" || !m || !m.usage) return null;
  // `<synthetic>` is Claude Code's placeholder for a turn that never hit the API
  // (an error stub). It carries a usage block of zeros and cost nothing.
  if (typeof m.model === "string" && m.model.startsWith("<")) return null;
  const u = m.usage;
  const p = {
    input: num(u.input_tokens),
    cache_write: num(u.cache_creation_input_tokens),
    cache_read: num(u.cache_read_input_tokens),
    output: num(u.output_tokens),
  };
  if (!(p.input || p.cache_write || p.cache_read || p.output)) return null;
  return p;
}

export const weighted = (p) => p.input * W.input + p.cache_write * W.cache_write + p.cache_read * W.cache_read + p.output * W.output;

// RULE 1. The organism's own headless lanes are `sdk-cli`; they are already in
// brain_ledger.jsonl. Absent entrypoint = unknown, and unknown is SAID.
export function laneOf(row) {
  const ep = typeof row.entrypoint === "string" ? row.entrypoint.trim() : "";
  if (!ep) return "unknown";
  return ep === "sdk-cli" ? "organism" : "his";
}

export function istDay(iso) {
  const t = Date.parse(iso || "");
  if (!Number.isFinite(t)) return null;
  return new Date(t + 5.5 * 3600000).toISOString().slice(0, 10);
}

// RULE 3. Short, stable, collision-safe at this scale (48 bits over ~10⁴ keys).
export const rowKey = (row) => createHash("sha1").update(`${(row.message && row.message.id) || ""}|${row.requestId || ""}|${row.uuid || ""}`).digest("hex").slice(0, 12);

// ── PURE: a chunk of JSONL → cached rows + how many BYTES were safely consumed ──
// Only whole lines are consumed, so the next incremental read resumes on a boundary.
export function scanChunk(text) {
  const cut = text.lastIndexOf("\n");
  const consumed = cut < 0 ? 0 : Buffer.byteLength(text.slice(0, cut + 1), "utf8");
  const days = {};
  let sid = null, entry = null;
  for (const line of (cut < 0 ? "" : text.slice(0, cut)).split("\n")) {
    if (!line || line.indexOf('"assistant"') < 0) continue;
    let j; try { j = JSON.parse(line); } catch { continue; }
    if (!j || j.type !== "assistant") continue;
    if (!sid && typeof j.sessionId === "string") sid = j.sessionId;
    if (!entry && typeof j.entrypoint === "string") entry = j.entrypoint;
    const p = usageOf(j);
    if (!p) continue;
    const d = istDay(j.timestamp);
    if (!d) continue;
    (days[d] = days[d] || []).push([rowKey(j), LANES.indexOf(laneOf(j)), Math.round(weighted(p)), p.output]);
  }
  return { days, consumed, sid, entrypoint: entry };
}

// ── THE CACHE ───────────────────────────────────────────────────────────────
export const emptyCache = () => ({ v: CACHE_VERSION, at: null, swept_at: null, files: {} });

export function loadCache(file = CACHE) {
  try {
    const c = JSON.parse(readFileSync(file, "utf8"));
    if (c && c.v === CACHE_VERSION && c.files && typeof c.files === "object") return c;
  } catch { /* a corrupt or absent cache is a cold start, never an error */ }
  return emptyCache();
}

export function saveCache(cache, file = CACHE) {
  cache.at = new Date().toISOString();
  try { mkdirSync(dirname(file), { recursive: true }); } catch { /* exists */ }
  // tmp + rename: the torn-write class (S11) does not get a new instance here.
  const tmp = `${file}.tmp${process.pid}`;
  writeFileSync(tmp, JSON.stringify(cache));
  renameSync(tmp, file);
  return file;
}

// Read only the bytes after `from`. Append-only JSONL is the assumption; a file that
// SHRANK was rewritten, so it is re-read whole (the caller decides that).
function readFrom(path, from) {
  const fd = openSync(path, "r");
  try {
    const size = statSync(path).size;
    if (size <= from) return "";
    const buf = Buffer.allocUnsafe(size - from);
    let off = 0;
    while (off < buf.length) {
      const n = readSync(fd, buf, off, buf.length - off, from + off);
      if (n <= 0) break;
      off += n;
    }
    return buf.slice(0, off).toString("utf8");
  } finally { closeSync(fd); }
}

// Fold ONE transcript into the cache, incrementally. Returns true if it changed.
export function foldFile(cache, path, { mtimeMs = null, size = null } = {}) {
  let st; try { st = statSync(path); } catch { return false; }
  const prev = cache.files[path];
  const full = !prev || (size ?? st.size) < (prev.offset || 0);
  if (prev && !full && st.size === prev.size && st.mtimeMs === prev.mtime) return false;   // untouched
  const from = full ? 0 : (prev.offset || 0);
  const text = readFrom(path, from);
  if (!text) {
    if (prev) { prev.size = st.size; prev.mtime = st.mtimeMs; }
    return false;
  }
  const scan = scanChunk(text);
  const row = full || !prev ? { size: 0, mtime: 0, offset: 0, sid: null, entrypoint: null, days: {} } : prev;
  for (const [d, rows] of Object.entries(scan.days)) (row.days[d] = row.days[d] || []).push(...rows);
  row.offset = from + scan.consumed;
  row.size = st.size;
  row.mtime = st.mtimeMs;
  row.sid = row.sid || scan.sid;
  row.entrypoint = row.entrypoint || scan.entrypoint;
  cache.files[path] = row;
  return true;
}

// Prune everything outside the window so the cache cannot grow without bound.
export function prune(cache, { now = new Date(), days = WINDOW_DAYS } = {}) {
  const floor = istDay(new Date(now.getTime() - days * 86400000).toISOString());
  for (const [p, f] of Object.entries(cache.files)) {
    for (const d of Object.keys(f.days)) if (d < floor) delete f.days[d];
    if (!Object.keys(f.days).length && !existsSync(p)) delete cache.files[p];
  }
  return cache;
}

// THE FULL SWEEP — every project dir, every transcript touched inside the window.
export function sweep(cache, { dir = projectsDir(), now = new Date(), days = WINDOW_DAYS } = {}) {
  const since = now.getTime() - days * 86400000;
  let seen = 0, read = 0;
  let dirs = []; try { dirs = readdirSync(dir, { withFileTypes: true }); } catch { return { seen, read, ok: false }; }
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    let files = []; try { files = readdirSync(join(dir, d.name)); } catch { continue; }
    for (const f of files) {
      if (!f.endsWith(".jsonl")) continue;
      const p = join(dir, d.name, f);
      let st; try { st = statSync(p); } catch { continue; }
      if (st.mtimeMs < since) continue;
      seen++;
      if (foldFile(cache, p, { mtimeMs: st.mtimeMs, size: st.size })) read++;
    }
  }
  prune(cache, { now, days });
  cache.swept_at = new Date().toISOString();
  return { seen, read, ok: true };
}

// ── PURE: cached rows → the numbers, deduped first-seen-wins in mtime order ──
export function aggregate(cache, { now = new Date(), days = WINDOW_DAYS } = {}) {
  const floor = istDay(new Date(now.getTime() - days * 86400000).toISOString());
  const today = istDay(now.toISOString());
  const seen = new Set();
  const blank = () => ({ w: 0, out: 0, n: 0, sessions: new Set() });
  const perDay = {};
  const files = Object.entries(cache.files).sort((a, b) => (a[1].mtime || 0) - (b[1].mtime || 0));
  let dupes = 0;
  for (const [, f] of files) {
    for (const [d, rows] of Object.entries(f.days || {})) {
      if (d < floor) continue;
      const bucket = (perDay[d] = perDay[d] || { his: blank(), organism: blank(), unknown: blank() });
      for (const r of rows) {
        const [key, laneIdx, w, out] = r;
        if (seen.has(key)) { dupes++; continue; }
        seen.add(key);
        const lane = bucket[LANES[laneIdx] || "unknown"];
        lane.w += w; lane.out += out; lane.n++;
        if (f.sid) lane.sessions.add(f.sid);
      }
    }
  }
  const roll = (pick) => {
    const out = { his: blank(), organism: blank(), unknown: blank() };
    for (const [d, b] of Object.entries(perDay)) {
      if (!pick(d)) continue;
      for (const L of LANES) { out[L].w += b[L].w; out[L].out += b[L].out; out[L].n += b[L].n; for (const s of b[L].sessions) out[L].sessions.add(s); }
    }
    return { his: plain(out.his), organism: plain(out.organism), unknown: plain(out.unknown) };
  };
  const plain = (x) => ({ weighted: Math.round(x.w), output: x.out, turns: x.n, sessions: x.sessions.size });
  return {
    at: now.toISOString(), day: today, days, dupes_skipped: dupes,
    today: roll((d) => d === today),
    window: roll(() => true),
    per_day: Object.fromEntries(Object.entries(perDay).sort().map(([d, b]) => [d, { his: plain(b.his), organism: plain(b.organism), unknown: plain(b.unknown) }])),
    swept_at: cache.swept_at || null,
  };
}

// ONE file's own total — the "this session" half of the stop line.
export function sessionTotal(cache, path) {
  const f = cache.files[path];
  const out = { weighted: 0, output: 0, turns: 0, sid: (f && f.sid) || null };
  if (!f) return out;
  const seen = new Set();
  for (const rows of Object.values(f.days || {})) for (const [key, , w, o] of rows) {
    if (seen.has(key)) continue;
    seen.add(key);
    out.weighted += w; out.output += o; out.turns++;
  }
  return out;
}

// ── THE LINES ───────────────────────────────────────────────────────────────
export const lakh = (n) => (n === null || n === undefined ? "?" : (n / 100000).toFixed(2) + " lakh");
const ago = (iso) => {
  const t = Date.parse(iso || "");
  if (!Number.isFinite(t)) return "never";
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
};

// The state surface's one line (§10-C S1a). Same shape as the board's other lines.
export function boardLine(a) {
  if (!a) return null;
  const t = a.today, wk = a.window;
  const unknown = t.unknown.turns ? ` · unknown entrypoint ${lakh(t.unknown.weighted)} (${t.unknown.turns} turn(s) — SAID, not folded)` : "";
  return `sessions   HIS ${lakh(t.his.weighted)} today (${t.his.sessions} session(s) · ${t.his.turns} turns · out ${lakh(t.his.output)}) · ${a.days} d ${lakh(wk.his.weighted)} · organism claude -p ${lakh(t.organism.weighted)} today (brain_ledger owns that half)${unknown} · swept ${ago(a.swept_at)}`;
}

export function stopLine(a, sess, { ceiling = null } = {}) {
  const parts = [`spend · this session ${lakh(sess.weighted)} weighted (${sess.turns} turn(s) · out ${lakh(sess.output)})`];
  if (ceiling) {
    const pct = Math.round((sess.weighted / (ceiling * 100000)) * 100);
    parts.push(`rung ${lakh(sess.weighted)}/${ceiling.toFixed(2)} lakh (${pct}%)${pct >= 100 ? " ⛔ CEILING — hand off" : pct >= 80 ? " ⚠ close the rung" : ""}`);
  }
  parts.push(`his sessions today ${lakh(a.today.his.weighted)} (swept ${ago(a.swept_at)})`);
  return parts.join(" · ");
}

// ── THE HOOK PAYLOAD (turn_hook contract 1: the handoff global, then fd 0) ──
let _payload;
function hookPayload() {
  if (_payload !== undefined) return _payload;
  _payload = null;
  try {
    const handed = globalThis.__ARSENAL_HOOK_STDIN__;
    if (typeof handed !== "string" && process.stdin.isTTY) return _payload;
    const raw = typeof handed === "string" ? handed : readFileSync(0, "utf8");
    if (!raw || !raw.trim()) return _payload;
    const j = JSON.parse(raw);
    if (j && typeof j === "object") _payload = j;
  } catch { _payload = null; }
  return _payload;
}

const ceilingFromEnv = () => {
  const i = process.argv.indexOf("--ceiling");
  const raw = i > 0 ? process.argv[i + 1] : process.env.ARSENAL_RUNG_CEILING;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};

// RULE 4: the hook path folds ONE file and reads the cache. It never sweeps.
export function stopHook({ cacheFile = CACHE, now = new Date() } = {}) {
  if (process.env.ARSENAL_ORGAN === "1") return null;
  const p = hookPayload();
  const tx = p && typeof p.transcript_path === "string" ? p.transcript_path.trim() : "";
  const cache = loadCache(cacheFile);
  let changed = false;
  if (tx && existsSync(tx)) changed = foldFile(cache, tx);
  if (changed) { try { saveCache(cache, cacheFile); } catch { /* a hook never blocks on its own cache */ } }
  const a = aggregate(cache, { now });
  const sess = tx ? sessionTotal(cache, tx) : { weighted: 0, output: 0, turns: 0, sid: null };
  if (!tx) return null;   // no transcript on the payload ⇒ nothing honest to say
  return stopLine(a, sess, { ceiling: ceilingFromEnv() });
}

export function live({ days = WINDOW_DAYS, now = new Date(), cacheFile = CACHE } = {}) {
  const cache = loadCache(cacheFile);
  const s = sweep(cache, { now, days: Math.max(days, WINDOW_DAYS) });
  try { saveCache(cache, cacheFile); } catch { /* read-only checkouts still report */ }
  return { ...aggregate(cache, { now, days }), sweep: s };
}

// ── SELFTEST — hermetic: a temp projects dir, a temp cache, no real transcripts ──
function selftest() {
  let pass = 0, fail = 0;
  const assert = (n, c, d) => { if (c) pass++; else fail++; console.log(`  ${c ? "✓" : "✗"} ${n}${c || !d ? "" : `\n      ${d}`}`); };
  const tmp = mkdtempSync(join(tmpdir(), "meter-"));
  const NOW = new Date("2026-08-20T12:00:00Z");   // 17:30 IST — the same IST day
  const proj = join(tmp, "projects", "C--x");
  mkdirSync(proj, { recursive: true });
  const cacheFile = join(tmp, "cache.json");
  const row = (o) => JSON.stringify({
    type: "assistant", uuid: o.uuid || o.id, requestId: o.req || "req_1", timestamp: o.ts || "2026-08-20T10:00:00.000Z",
    sessionId: o.sid || "S1", entrypoint: o.ep === null ? undefined : (o.ep || "claude-desktop"), isSidechain: !!o.side,
    message: { id: o.id, model: o.model || "claude-opus-5", usage: { input_tokens: o.i ?? 0, cache_creation_input_tokens: o.cw ?? 0, cache_read_input_tokens: o.cr ?? 0, output_tokens: o.o ?? 0 } },   // models-literal-ok — selftest fixture: a synthetic usage row needs a model field
  }) + "\n";

  // 1. the weights are brain.mjs's, and the arithmetic is the same arithmetic
  assert("WEIGHTS — input 1 · cache_write 1.25 · cache_read 0.1 · output 5 (brain.mjs's, restated)",
    W.input === 1 && W.cache_write === 1.25 && W.cache_read === 0.1 && W.output === 5);
  assert("WEIGHTED — 1000 in + 1000 cw + 1000 cr + 1000 out = 7350", weighted({ input: 1000, cache_write: 1000, cache_read: 1000, output: 1000 }) === 7350);

  // 2. the lane split — HIS vs the organism's own claude -p, and unknown SAID
  assert("LANE — entrypoint sdk-cli is the organism's own lane (already in brain_ledger)", laneOf({ entrypoint: "sdk-cli" }) === "organism");
  assert("LANE — claude-desktop / cli / anything else is HIM", laneOf({ entrypoint: "claude-desktop" }) === "his" && laneOf({ entrypoint: "cli" }) === "his");
  assert("LANE — a row with no entrypoint is `unknown`, never folded into either side", laneOf({}) === "unknown");

  // 3. `<synthetic>` and all-zero rows cost nothing and are skipped
  assert("USAGE — a <synthetic> turn never hit the API and is skipped",
    usageOf({ type: "assistant", message: { model: "<synthetic>", usage: { output_tokens: 12 } } }) === null);
  assert("USAGE — an all-zero usage block is skipped", usageOf({ type: "assistant", message: { model: "claude-opus-5", usage: { input_tokens: 0, output_tokens: 0 } } }) === null);   // models-literal-ok — selftest fixture: an all-zero usage row needs a model field

  // 4. THE SIDECHAIN RULE — a subagent's turns are the 505-lakh class; they must count
  const f1 = join(proj, "s1.jsonl");
  writeFileSync(f1, row({ id: "m1", i: 100, o: 200 }) + row({ id: "m2", side: true, req: "req_2", i: 50, o: 1000 }));
  let cache = emptyCache();
  foldFile(cache, f1);
  let a = aggregate(cache, { now: NOW });
  assert("SIDECHAIN — a subagent turn is INCLUDED (it was the whole 19-Aug disaster)",
    a.today.his.turns === 2 && a.today.his.weighted === (100 + 200 * 5) + (50 + 1000 * 5), JSON.stringify(a.today.his));

  // 5. INCREMENTAL — appending re-reads only the tail, and the total is right
  const before = cache.files[f1].offset;
  writeFileSync(f1, readFileSync(f1, "utf8") + row({ id: "m3", req: "req_3", i: 10, o: 10 }));
  foldFile(cache, f1);
  assert("INCREMENTAL — the offset advanced and only the new row was folded",
    cache.files[f1].offset > before && aggregate(cache, { now: NOW }).today.his.turns === 3);
  const unchanged = foldFile(cache, f1);
  assert("INCREMENTAL — an untouched file is not re-read at all", unchanged === false);

  // 6. A HALF-WRITTEN LINE is never consumed (the file is being appended to as we read)
  writeFileSync(f1, readFileSync(f1, "utf8") + '{"type":"assistant","message":{"id":"m4"');
  foldFile(cache, f1);
  assert("PARTIAL LINE — a torn tail is left for the next read, never parsed", aggregate(cache, { now: NOW }).today.his.turns === 3);

  // 7. DEDUP — a resumed session copies rows into a NEW file; the meter must not double-count
  const f2 = join(proj, "s2.jsonl");
  // (measured on his real corpus: a transcript file carries exactly ONE sessionId on
  // every row, including the rows a resume copied in — so the fixture does too.)
  writeFileSync(f2, row({ id: "m1", sid: "S2", i: 100, o: 200 }) + row({ id: "m9", req: "req_9", sid: "S2", i: 1, o: 1 }));
  foldFile(cache, f2);
  a = aggregate(cache, { now: NOW });
  assert("DEDUP — the copied turn is counted ONCE, and the skip is reported",
    a.today.his.turns === 4 && a.dupes_skipped === 1, JSON.stringify({ turns: a.today.his.turns, dupes: a.dupes_skipped }));
  assert("SESSIONS — two distinct transcripts = 2 sessions", a.today.his.sessions === 2);

  // 8. THE ORGANISM'S OWN LANES ARE NOT COUNTED AS HIS
  const f3 = join(proj, "s3.jsonl");
  writeFileSync(f3, row({ id: "m20", req: "r20", sid: "S3", ep: "sdk-cli", i: 1000, o: 1000 }));
  foldFile(cache, f3);
  a = aggregate(cache, { now: NOW });
  assert("SPLIT — a claude -p lane lands in `organism`, and HIS number does not move",
    a.today.organism.weighted === 6000 && a.today.his.turns === 4, JSON.stringify(a.today));

  // 9. UNKNOWN IS SAID
  const f4 = join(proj, "s4.jsonl");
  writeFileSync(f4, row({ id: "m30", req: "r30", sid: "S4", ep: null, i: 100, o: 0 }));
  foldFile(cache, f4);
  a = aggregate(cache, { now: NOW });
  assert("UNKNOWN — an entrypoint-less row is its own lane and prints in the board line",
    a.today.unknown.weighted === 100 && /unknown entrypoint/.test(boardLine(a)), boardLine(a));

  // 10. THE IST DAY BOUNDARY — 19:00 UTC is already TOMORROW in IST (00:30)
  assert("IST — 2026-08-19T19:00Z is 2026-08-20 in IST", istDay("2026-08-19T19:00:00Z") === "2026-08-20");
  assert("IST — 2026-08-20T18:00Z is 2026-08-20 in IST (23:30)", istDay("2026-08-20T18:00:00Z") === "2026-08-20");

  // 11. THE WINDOW — an old day is out of `today` but inside the 7-day roll, then pruned
  const f5 = join(proj, "s5.jsonl");
  writeFileSync(f5, row({ id: "m40", req: "r40", sid: "S5", ts: "2026-08-17T10:00:00.000Z", i: 0, o: 100 }));
  foldFile(cache, f5);
  a = aggregate(cache, { now: NOW });
  assert("WINDOW — a 3-day-old row is out of `today` and inside the 7-day roll",
    a.today.his.turns === 4 && a.window.his.turns === 5, JSON.stringify({ t: a.today.his.turns, w: a.window.his.turns }));
  prune(cache, { now: new Date("2026-08-30T12:00:00Z"), days: 7 });
  assert("PRUNE — days outside the window leave the cache (it cannot grow forever)",
    aggregate(cache, { now: new Date("2026-08-30T12:00:00Z") }).window.his.turns === 0);

  // 12. THE CACHE round-trips, and a corrupt cache is a cold start, not a crash
  saveCache(cache, cacheFile);
  assert("CACHE — round-trips through disk", JSON.stringify(loadCache(cacheFile)) === JSON.stringify(cache));
  writeFileSync(cacheFile, "{not json");
  assert("CACHE — a corrupt cache is a cold start, never a throw", loadCache(cacheFile).v === CACHE_VERSION && !Object.keys(loadCache(cacheFile).files).length);

  // 13. THE LINES — one line each, and the ceiling brake prints when it is set
  const a2 = aggregate((() => { const c = emptyCache(); foldFile(c, f1); return c; })(), { now: NOW });
  const bl = boardLine(a2);
  assert("BOARD LINE — one line, starts `sessions`, carries HIS number and names the organism half",
    !bl.includes("\n") && bl.startsWith("sessions ") && /HIS /.test(bl) && /organism claude -p/.test(bl), bl);
  const sl = stopLine(a2, { weighted: 400000, output: 1000, turns: 9 }, { ceiling: 5 });
  assert("STOP LINE — one line, this session first, and the rung ceiling shows a percentage",
    !sl.includes("\n") && sl.startsWith("spend · this session") && /rung 4\.00 lakh\/5\.00 lakh \(80%\) ⚠/.test(sl), sl);
  assert("STOP LINE — no ceiling set ⇒ no brake text, and the line still stands",
    !/rung /.test(stopLine(a2, { weighted: 1, output: 0, turns: 1 })));
  const sl2 = stopLine(a2, { weighted: 600000, output: 1, turns: 1 }, { ceiling: 5 });
  assert("STOP LINE — past the ceiling it says ⛔ HAND OFF, not a shrug", /⛔ CEILING/.test(sl2), sl2);

  // 14. ARSENAL_ORGAN=1 ⇒ the hook prints nothing at all (turn_hook's law)
  const wasOrgan = process.env.ARSENAL_ORGAN;
  process.env.ARSENAL_ORGAN = "1";
  assert("HEADLESS — ARSENAL_ORGAN=1 ⇒ the stop hook returns nothing", stopHook({ cacheFile, now: NOW }) === null);
  if (wasOrgan === undefined) delete process.env.ARSENAL_ORGAN; else process.env.ARSENAL_ORGAN = wasOrgan;

  // 15. THE SWEEP finds the temp transcripts and never touches the real cache
  const c2 = emptyCache();
  const s = sweep(c2, { dir: join(tmp, "projects"), now: NOW, days: 7 });
  assert("SWEEP — walks project dirs and folds every in-window transcript", s.ok && s.seen >= 5 && s.read >= 5, JSON.stringify(s));

  try { rmSync(tmp, { recursive: true, force: true }); } catch { /* temp */ }
  console.log(`session_meter selftest: ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
}
// ── CLI ─────────────────────────────────────────────────────────────────────
function main() {
  const mode = process.argv[2] || "line";
  if (mode === "selftest") return selftest();
  if (mode === "stop") { const l = stopHook({}); if (l) console.log(l); return; }
  const days = Math.max(1, Number(process.argv[3]) || WINDOW_DAYS);
  if (mode === "sweep") { const a = live({ days }); console.log(`session_meter: swept ${a.sweep.seen} transcript(s), ${a.sweep.read} changed · ${boardLine(a)}`); return; }
  if (mode === "line") { console.log(boardLine(live({ days })) || "sessions   ? (no transcripts readable)"); return; }
  if (mode === "today" || mode === "json") { console.log(JSON.stringify(live({ days }), null, 1)); return; }
  if (mode === "status" || mode === "report") {
    const a = live({ days });
    console.log(boardLine(a));
    console.log(`  window ${days} d · HIS ${lakh(a.window.his.weighted)} (${a.window.his.turns} turns · ${a.window.his.sessions} sessions) · organism ${lakh(a.window.organism.weighted)} · unknown ${lakh(a.window.unknown.weighted)} · ${a.dupes_skipped} duplicate row(s) skipped`);
    for (const [d, b] of Object.entries(a.per_day).sort().reverse()) {
      console.log(`  ${d}  his ${lakh(b.his.weighted).padStart(11)} (${String(b.his.turns).padStart(4)} turns · ${b.his.sessions} sess) · organism ${lakh(b.organism.weighted).padStart(11)}${b.unknown.turns ? ` · unknown ${lakh(b.unknown.weighted)}` : ""}`);
    }
    console.log(`  cache ${CACHE} · ${Object.keys(loadCache().files).length} file(s) tracked`);
    return;
  }
  console.log("session_meter: line | today | status | report [days] | sweep | stop | selftest");
  process.exit(2);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
