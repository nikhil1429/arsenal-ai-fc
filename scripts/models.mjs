#!/usr/bin/env node
// ============================================================================
// models.mjs · ARSENAL AI FC — LAW M: ONE MODEL RESOLVER FOR THE WHOLE ORGANISM
//   (MODELS + ACTS work order, Block 1, 18 Aug 2026 — his word: "apply the latest
//   gemini models which can work with the best condition for our organism … a god
//   tier plan which solves this problem universally and globally for the entire
//   future from now onwards" · "do it everywhere inside the entire organism").
//   SOLE WRITER of dressing-room/state/models.json (gitignored; STATUS ONLY —
//   never a key). Reads ~/.gemini/.env (keys) and the wire. Nothing else.
// ----------------------------------------------------------------------------
// THE BUG THIS EXISTS FOR (measured 18 Aug 2026 19:30–19:55 IST, not recalled):
//   the keys were never dry — the ALIAS was dead. 9 keys; `gemini-flash-latest`
//   → 429 on all 9; `gemini-3.5-flash` → OK on all 9; `gemini-2.0/2.5-flash` → 404
//   "no longer available". Every caller folded 404 · 429 · 400/403 · 503 · network
//   into ONE string ("flash pool dry or every key refused" / "lane dry (keys/quota)")
//   — so a retired alias read as "no quota" for days, and the Gaffer's Watcher (the
//   thing that fills its blocks: how_to_speak · what_he_asked_for · where_we_are)
//   died on 13:42 IST with it. Model names sat in 12 files, ~40 sites.
//
// THE RULE: *No organ names a model. An organ names a ROLE; the resolver picks the
//   live model, the live key, and says why.*
//   · roles     text (Watcher · chalkboard · urlctx · council · distiller · nightshift
//               text · hippocampus gen · dmn) · lite (adjudicator, cheap classifiers,
//               ball parser) · pro (nightshift pro, hippocampus pro — free tier absent
//               18 Aug: falls back to text and SAYS so) · live (dugout voice) · embed
//               (dugout + hippocampus — dim recorded; a dim change is a RED, never
//               silent) · image (paint lane — unseeded until he names it).
//   · policy    candidates per role, ORDERED capability-tier desc → free-tier
//               availability MEASURED → latency MEASURED. The SEED below is the 18 Aug
//               live list; env override per role stays highest (the seven legacy env
//               names map to roles and keep working: LEGACY_ENV).
//   · discovery `probe` = GET /v1beta/models (one key) + one cheap call per role per
//               candidate → models.json (nightly, as a step of the watchman's run —
//               NOT a new scheduled row). New family names Google ships are RANKED by
//               generation automatically (gemini-<gen>-flash*); an unranked name is
//               LISTED, never chosen, until the seed names it (that is the human step,
//               a one-line edit in THIS file).
//   · classes   classify(status, body) → model-gone (404: next candidate, key NOT
//               rotated) · quota (429: next key, key×model on cooldown) · key-bad
//               (400 "API key"/401/403: key marked, WARN) · demand (5xx: backoff 2×
//               then next candidate) · net (ECONN/abort: retry once, then next key) ·
//               schema (200, empty: next candidate) · request (400 not-a-key: stop,
//               rotating cannot heal a bad body). "pool dry" is RETIRED: every failure
//               is {ok:false, tried:[{model,key,class}], why} and callers print `why`.
//   · receipts  every success is {model, key_index, latency_ms, fell_back_from}.
//   · the law   `check` FAILS if a literal gemini-… model name appears in scripts/*.mjs
//               outside this file (labels allowlisted by exact string; a fixture line
//               may carry `models-literal-ok` and is counted, not failed). Joins
//               organism:selftest. Claude side: brain_config names only opus|sonnet|haiku.
//   · NARROWED 20 Aug 2026 (AUDIT §10-C rung S3, LAW T's rule: the industry tool wins on
//               shape, the hand-rolled scan keeps what only this organism knows). The
//               SHAPE half now belongs to `laws/law-m-literal-model.yml`, which matches
//               STRING NODES on the parsed tree — so a model name inside a comment is
//               history and not a hit, which no regex over source text can promise — and
//               which covers the claude-* and gpt-* families this scan never did. It found
//               watchman.mjs:1067 naming `claude-opus-5` in a LIVE command line on its
//               first run. THIS scan keeps the KNOWLEDGE: the LABELS allowlist, the
//               `models-literal-ok` declaration, the roster, and brain_config's aliases.
//               Both still run, on every commit. Where they disagree, the AST tool wins.
// LAWS: hermetic in a fixture (selftest / ARSENAL_AUDIT_COLLAR ⇒ probe writes to a
//   scratch path or nowhere, never the live file) · owners-only (this file is the one
//   writer of models.json) · never throws from generate/embed/resolve · no key material
//   ever leaves this process in a return value or a file.
// WHO ACTS ON THIS: watchman.mjs (RED model-role-dead · WARN model-fell-back · INFO
//   quota-keys · RED embed-dim-changed) · state.mjs week (one gemini line) · every
//   Gemini caller (generate/embed) · dugout's /config (the LIVE role's model).
// CLI: node scripts/models.mjs [status|probe|check|resolve <role>|selftest]
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, readdirSync, statSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { tmpdir, homedir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STATE_DIR = join(ROOT, "dressing-room", "state");
export const MODELS_JSON = join(STATE_DIR, "models.json");
export const GEMINI_ENV = join(homedir(), ".gemini", ".env");
const API = "https://generativelanguage.googleapis.com/v1beta";

// ── THE SEED (18 Aug 2026 live list; his call which leads when two are both free-tier OK — default: highest generation that answered today) ──
export const ROLES = ["text", "lite", "pro", "live", "embed", "image"];
export const SEED = {
  text: ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3-flash-preview", "gemini-flash-latest"],
  lite: ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-flash-lite-latest"],
  pro: ["gemini-3.1-pro-preview", "gemini-pro-latest"],
  live: ["gemini-3.1-flash-live-preview", "gemini-2.5-flash-native-audio-latest"],
  embed: ["gemini-embedding-001", "gemini-embedding-2"],
  image: [],   // unseeded on purpose: the probe LISTS image-family names; he names the one that leads (a one-line edit here)
};
export const ROLE_FALLBACK = { pro: "text" };            // pro's free tier is absent today → text, and the receipt says fell_back_role
export const ROLE_ENV = { text: "ARSENAL_MODEL_TEXT", lite: "ARSENAL_MODEL_LITE", pro: "ARSENAL_MODEL_PRO", live: "ARSENAL_MODEL_LIVE", embed: "ARSENAL_MODEL_EMBED", image: "ARSENAL_MODEL_IMAGE" };
// the seven env names that existed before this file — kept working, mapped to roles
export const LEGACY_ENV = { GAFFER_WATCHER_MODEL: "text", CHALKBOARD_MODEL: "text", URLCTX_MODEL: "text", HIPPO_GEN_MODEL: "text", DUGOUT_MODEL: "live", DUGOUT_EMBED_MODEL: "embed", HIPPO_EMBED_MODEL: "embed" };
// which discovered names belong to which role (family filters for the probe's discovery)
// (loose on purpose: a name that LOOKS like the family but has no parseable generation lands in
//  `unranked` — listed, never chosen — instead of being invisible)
const NOT_TEXT = /lite|live|audio|image|tts|embedding|thinking-exp|robotics|computer-use/;
const FAMILY = {
  text: (n) => /^gemini-.*flash/.test(n) && !NOT_TEXT.test(n),
  lite: (n) => /^gemini-.*flash-lite/.test(n),
  pro: (n) => /^gemini-.*-pro(-|$)/.test(n) && !/image|tts|live|audio/.test(n),
  live: (n) => /^gemini-/.test(n) && /live|native-audio/.test(n),
  embed: (n) => /^gemini-embedding-/.test(n),
  image: (n) => /^gemini-.*image/.test(n),
};
// LABELS that are not model ids (allowlisted by exact string for `check`)
export const LABELS = new Set(["gemini-study", "gemini-study-teaching", "gemini-quality", "gemini-quality-recorded", "gemini-lane", "gemini-quarantine", "gemini-login", "gemini-flash", "gemini-quality-quarantine"]);
export const LITERAL_OK = "models-literal-ok";        // a fixture line that must carry a retired/known literal declares itself with this word
const FRESH_H = 36;                                    // models.json older than this is stale: resolveSync falls back to the seed and says so

// ── rank: generation parsed from the name; -latest aliases rank BELOW any explicit generation (an alias is a moving target — 18 Aug it moved onto a paid tier) ──
export function rank(name) {
  const n = String(name || "");
  const m = /^gemini-(\d+(?:\.\d+)?)-/.exec(n);
  if (m) return Number(m[1]);
  const e = /^gemini-embedding-(\d+)/.exec(n);      // gemini-embedding-001 → 1 · gemini-embedding-2 → 2
  if (e) return Number(e[1]);
  if (/-latest$/.test(n)) return 0.5;
  return null;                                         // unranked: listed, never chosen automatically
}

// ORDER within a role: capability tier desc (rank) → latency. EXCEPT embed, which is STICKY: the
// seed order IS the policy (a higher-generation embedding model is a different vector space — every
// stored vector becomes incomparable; switching is his call + a re-index, never the probe's).
// live and image are sticky too (measured 18 Aug on the first live probe: presence-ranking chose
// `gemini-3.5-live-translate-preview` for the Gaffer's mouth — a translator outranked the voice
// model by generation). A discovered name in a STICKY role is LISTED with ok measured, never chosen.
export const STICKY = new Set(["embed", "live", "image"]);
export function cmp(role) {
  if (STICKY.has(role)) return (x, y) => { const ix = SEED[role].indexOf(x.model), iy = SEED[role].indexOf(y.model); return ((ix < 0 ? 1e6 : ix) - (iy < 0 ? 1e6 : iy)) || ((x.latency_ms || 1e9) - (y.latency_ms || 1e9)); };
  return (x, y) => (rank(y.model) - rank(x.model)) || ((x.latency_ms || 1e9) - (y.latency_ms || 1e9));
}
const eligible = (role, model) => !STICKY.has(role) || SEED[role].includes(model);   // may this name LEAD the role?

// ── keys (same reader every organ carried; ONE copy now) ──
export function loadKeys(envText = null) {
  const keys = [];
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY.trim());
  const text = envText !== null ? envText : (existsSync(GEMINI_ENV) ? readFileSync(GEMINI_ENV, "utf8") : "");
  for (const line of String(text).split("\n")) {
    const m = line.match(/^GEMINI_API_KEY(_\d+)?\s*=\s*(.+)$/);
    if (m && m[2].trim() && !keys.includes(m[2].trim())) keys.push(m[2].trim());
  }
  return keys;
}

// ── classify: FIVE facts that used to be one string ──
export function classify(status, body) {
  const b = typeof body === "string" ? body : (body ? JSON.stringify(body) : "");
  if (status === 404) return "model-gone";
  if (status === 429) return "quota";
  if (status === 401 || status === 403) return "key-bad";
  if (status === 400) return /API[_ ]?KEY|api key/i.test(b) ? "key-bad" : "request";
  if (status >= 500) return "demand";
  if (status === 0 || status == null) return "net";
  if (status >= 200 && status < 300) return "ok";
  return "request";
}
// retryDelay in a 429 body ("retryDelay":"37s") → ms; else the default cooldown
const DEFAULT_COOLDOWN_MS = 15 * 60 * 1000;
export function cooldownMs(body) {
  const m = /retryDelay"?\s*:\s*"?(\d+(?:\.\d+)?)s/.exec(typeof body === "string" ? body : JSON.stringify(body || ""));
  return m ? Math.max(1000, Math.round(Number(m[1]) * 1000)) : DEFAULT_COOLDOWN_MS;
}

// ── in-process memory: quota cooldowns per model×key · dead models (404) · bad keys ──
const cooldown = new Map();      // `${model}|${keyIdx}` → until (ms epoch)
const deadModels = new Set();    // 404 this process → skipped without a call (the in-process re-probe)
const badKeys = new Set();       // 401/403/400-key this process
export function _resetMemory() { cooldown.clear(); deadModels.clear(); badKeys.clear(); }
export function memory() { return { cooldowns: [...cooldown.entries()].map(([k, until]) => ({ key: k, until })), dead: [...deadModels], bad_keys: [...badKeys] }; }

// ── models.json (status only) ──
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch { /* models.json unreadable → null: the resolver falls back to the seed */ } return null; };
export function board(path = MODELS_JSON, now = Date.now()) {
  const j = readJson(path);
  if (!j) return null;
  const at = Date.parse(j.at || "");
  return { ...j, age_h: Number.isFinite(at) ? (now - at) / 3600000 : null, fresh: Number.isFinite(at) && (now - at) / 3600000 <= FRESH_H };
}

// ── candidates(role): env → probe-ranked live → seed; then the fallback role's, marked ──
export function candidates(role, { env = null, boardObj = undefined, now = Date.now() } = {}) {
  const out = [];
  const push = (model, source, extra = {}) => { if (model && !out.some((c) => c.model === model)) out.push({ model, source, ...extra }); };
  if (!ROLES.includes(role)) return out;
  if (env && process.env[env]) push(process.env[env].trim(), `env:${env}`);
  if (process.env[ROLE_ENV[role]]) push(process.env[ROLE_ENV[role]].trim(), `env:${ROLE_ENV[role]}`);
  const b = boardObj === undefined ? board(MODELS_JSON, now) : boardObj;
  const probed = b && b.fresh && b.roles && b.roles[role] ? (b.roles[role].candidates || []) : [];
  const okProbed = probed.filter((c) => c.ok && rank(c.model) !== null && eligible(role, c.model)).sort(cmp(role));
  for (const c of okProbed) push(c.model, "probe", { latency_ms: c.latency_ms });
  for (const m of SEED[role]) push(m, "seed");
  // a probed-dead seed member sinks to the tail (still tried last — the probe is nightly, the wire is now)
  const dead = new Set(probed.filter((c) => c.ok === false && c.class === "model-gone").map((c) => c.model));
  out.sort((x, y) => (dead.has(x.model) ? 1 : 0) - (dead.has(y.model) ? 1 : 0));
  const fb = ROLE_FALLBACK[role];
  if (fb) for (const c of candidates(fb, { boardObj: b, now })) push(c.model, c.source, { fell_back_role: fb });
  return out;
}

// resolveSync(role) — the model a hot path should NAME (no network): env → fresh probe → seed[0]
export function resolveSync(role, { env = null, boardObj = undefined, now = Date.now() } = {}) {
  const c = candidates(role, { env, boardObj, now });
  const first = c.find((x) => !x.fell_back_role) || c[0];
  if (!first) return { ok: false, role, model: null, source: null, why: `${role}: no candidate seeded — name one in scripts/models.mjs SEED` };
  const b = boardObj === undefined ? board(MODELS_JSON, now) : boardObj;
  return { ok: true, role, model: first.model, source: first.source, fell_back_role: first.fell_back_role || null,
    stale: !!(b && !b.fresh), why: first.source === "seed" && b && !b.fresh ? `models.json stale (${b.age_h.toFixed(0)} h) — seed policy` : first.source };
}
export const resolve = async (role, opts) => resolveSync(role, opts);

// ── the walker: candidates × keys with the classes' own actions ──
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function fetchOnce(fetchFn, url, init, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetchFn(url, { ...init, signal: ctrl.signal });
    let bodyText = "";
    let json = null;
    try { if (typeof r.text === "function") { bodyText = await r.text(); try { json = JSON.parse(bodyText); } catch { /* not JSON */ } } else if (typeof r.json === "function") { json = await r.json(); bodyText = JSON.stringify(json); } } catch { /* body unreadable → classified on status alone */ }
    return { status: r.status || (r.ok ? 200 : 0), ok: !!r.ok, json, bodyText };
  } catch (e) { return { status: 0, ok: false, json: null, bodyText: String((e && e.message) || e), threw: true }; }
  finally { clearTimeout(t); }
}
function summarize(role, tried, cands, keysN) {
  const per = new Map();
  for (const t of tried) { const k = t.model; if (!per.has(k)) per.set(k, {}); per.get(k)[t.class] = (per.get(k)[t.class] || 0) + 1; }
  const parts = [...per.entries()].map(([m, c]) => `${m} ${Object.entries(c).map(([cl, n]) => `${cl}×${n}`).join(",")}`);
  return `${role}: ${parts.join(" · ") || "no call made"} (0 of ${cands.length} candidate(s) answered on ${keysN} key(s))`;
}
/**
 * generate(role, body, opts) → the site keeps its own body (contents · tools · generationConfig)
 * and its own parse; the walk, the classes and the receipt live HERE.
 *   opts: keys · fetchFn · timeoutMs (30000) · env (a legacy env name) · maxCandidates ·
 *         method ("generateContent") · now · sleepFn · boardObj
 * → {ok:true, json, text, model, key_index, latency_ms, fell_back_from, fell_back_role, tried, role}
 * → {ok:false, tried, why, role, latency_ms}
 */
export async function generate(role, body, opts = {}) {
  const t0 = Date.now();
  const keys = opts.keys || loadKeys();
  const fetchFn = opts.fetchFn || fetch;
  const timeoutMs = opts.timeoutMs || 30000;
  const method = opts.method || "generateContent";
  const zzz = opts.sleepFn || sleep;
  // `override` = an explicit candidate list — the FIXTURE escape hatch (hippocampus generatePool's
  // legacy `models` param); a production caller naming a model fails `check`.
  const cands = (Array.isArray(opts.override) && opts.override.length
    ? opts.override.map((m) => ({ model: m, source: "override" }))
    : candidates(role, { env: opts.env || null, boardObj: opts.boardObj, now: opts.now || Date.now() })).slice(0, opts.maxCandidates || 8);
  const tried = [];
  if (!cands.length) return { ok: false, role, tried, why: `${role}: no candidate seeded — name one in scripts/models.mjs SEED`, latency_ms: 0 };
  if (!keys.length) return { ok: false, role, tried, why: `${role}: no Gemini key in the pool (~/.gemini/.env)`, latency_ms: 0 };
  const first = cands[0].model;
  for (const c of cands) {
    if (deadModels.has(c.model)) { tried.push({ model: c.model, key: null, class: "model-gone", ms: 0, cached: true }); continue; }
    let nextCandidate = false;
    for (let ki = 0; ki < keys.length && !nextCandidate; ki++) {
      if (badKeys.has(ki)) { tried.push({ model: c.model, key: ki, class: "key-bad", ms: 0, cached: true }); continue; }
      const cdKey = `${c.model}|${ki}`;
      const until = cooldown.get(cdKey);
      if (until && until > Date.now()) { tried.push({ model: c.model, key: ki, class: "quota", ms: 0, cached: true }); continue; }
      let attempt = 0, backoff = 500;
      while (attempt < 2) {
        attempt++;
        const ts = Date.now();
        const r = await fetchOnce(fetchFn, `${API}/models/${c.model}:${method}?key=${encodeURIComponent(keys[ki])}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, timeoutMs);
        const cls = r.threw ? "net" : classify(r.status, r.bodyText);
        const ms = Date.now() - ts;
        if (cls === "ok") {
          const j = r.json || {};
          const parts = (((j.candidates || [])[0] || {}).content || {}).parts || [];
          const text = parts.map((p) => p.text || "").join("");
          const hasAny = parts.length > 0 || (j.embedding || j.embeddings);
          if (!hasAny) { tried.push({ model: c.model, key: ki, class: "schema", ms }); nextCandidate = true; break; }
          tried.push({ model: c.model, key: ki, class: "ok", ms });
          return { ok: true, role, json: j, text, parts, model: c.model, key_index: ki, latency_ms: Date.now() - t0, fell_back_from: c.model === first ? null : first, fell_back_role: c.fell_back_role || null, source: c.source, tried };
        }
        tried.push({ model: c.model, key: ki, class: cls, ms, status: r.status });
        if (cls === "model-gone") { deadModels.add(c.model); nextCandidate = true; break; }
        if (cls === "quota") { cooldown.set(cdKey, Date.now() + cooldownMs(r.bodyText)); break; }             // next key
        if (cls === "key-bad") { badKeys.add(ki); break; }                                                       // next key
        if (cls === "request") return { ok: false, role, tried, why: `${role}: ${c.model} 400 (not a key problem — the request body): ${r.bodyText.slice(0, 200)}`, latency_ms: Date.now() - t0 };
        if (cls === "demand") { if (attempt < 2) { await zzz(backoff); backoff *= 2; continue; } nextCandidate = true; break; }   // backoff 2×, then next candidate
        if (cls === "net") { if (attempt < 2) { await zzz(200); continue; } break; }                              // retry once, then next key
        break;
      }
    }
  }
  return { ok: false, role, tried, why: summarize(role, tried, cands, keys.length), latency_ms: Date.now() - t0 };
}

/** embed(role, texts, opts) → {ok, vectors, dim, model, key_index, latency_ms, fell_back_from, tried} */
export async function embed(role, texts, opts = {}) {
  const list = (texts || []).map((t) => String(t).slice(0, opts.clip || 1500));
  if (!list.length) return { ok: true, vectors: [], dim: null, model: null, tried: [] };
  const wrap = { requests: list.map((t) => ({ model: "models/__MODEL__", content: { parts: [{ text: t }] } })) };
  // the batch body names the model INSIDE each request too — patch per candidate via a fetch shim
  const fetchFn = opts.fetchFn || fetch;
  const shim = (url, init) => {
    const m = /\/models\/([^:]+):/.exec(url);
    const b = JSON.parse(init.body); for (const q of b.requests) q.model = `models/${m ? m[1] : ""}`;
    return fetchFn(url, { ...init, body: JSON.stringify(b) });
  };
  const r = await generate(role, wrap, { ...opts, fetchFn: shim, method: "batchEmbedContents", timeoutMs: opts.timeoutMs || 15000 });
  if (!r.ok) return r;
  const vectors = ((r.json || {}).embeddings || []).map((e) => e.values);
  if (!vectors.length) return { ok: false, role, tried: r.tried, why: `${role}: ${r.model} 200 with no embeddings (schema)`, latency_ms: r.latency_ms };
  return { ok: true, role, vectors, dim: (vectors[0] || []).length, model: r.model, key_index: r.key_index, latency_ms: r.latency_ms, fell_back_from: r.fell_back_from, tried: r.tried };
}

// ── PROBE — discovery, not memory (nightly as a watchman step; on demand by hand) ──
export async function probe({ keys = loadKeys(), fetchFn = fetch, write = true, path = MODELS_JSON, now = new Date(), timeoutMs = 20000, sleepFn = sleep, prev = undefined } = {}) {
  const t0 = Date.now();
  const out = { at: now.toISOString(), keys: { n: keys.length, ok: [], quota: [], bad: [] }, listed: [], unranked: [], roles: {}, ms: 0 };
  if (!keys.length) { out.error = "no Gemini key in the pool"; return finishProbe(out, { write, path, prev, t0 }); }
  // 1) the list, on one key
  const lr = await fetchOnce(fetchFn, `${API}/models?pageSize=200&key=${encodeURIComponent(keys[0])}`, { method: "GET" }, timeoutMs);
  const listed = lr.ok && lr.json && Array.isArray(lr.json.models) ? lr.json.models.map((m) => ({ name: String(m.name || "").replace(/^models\//, ""), methods: m.supportedGenerationMethods || [] })) : [];
  out.listed = listed.map((m) => m.name);
  out.list_status = lr.status;
  // 2) per role: seed ∪ discovered family names (ranked ≥ the seed's lowest explicit generation), one cheap call each on key 0; on quota try the next key so "quota on key 0" is not "dead"
  for (const role of ROLES) {
    const seedGen = Math.min(...SEED[role].map(rank).filter((g) => g !== null && g >= 1), Infinity);
    const discovered = listed.filter((m) => FAMILY[role](m.name)).map((m) => m.name);
    for (const n of discovered) if (rank(n) === null && !out.unranked.includes(n)) out.unranked.push(n);
    const names = [...new Set([...SEED[role], ...discovered.filter((n) => rank(n) !== null && rank(n) >= (Number.isFinite(seedGen) ? seedGen : 0))])];
    const cands = [];
    for (const model of names) {
      const entry = { model, ok: false, class: null, latency_ms: null, keys_tried: 0, method: null };
      const listedRow = listed.find((m) => m.name === model);
      const wantsBidi = role === "live";
      if (wantsBidi) {   // no cheap bidi call — presence + method is the probe
        entry.method = "listed";
        entry.ok = !!listedRow && (listedRow.methods.includes("bidiGenerateContent") || listedRow.methods.length === 0);
        entry.class = entry.ok ? "ok" : listedRow ? "schema" : "model-gone";
        cands.push(entry); continue;
      }
      if (role === "image") { entry.method = "listed"; entry.ok = !!listedRow; entry.class = entry.ok ? "ok" : "model-gone"; cands.push(entry); continue; }
      const isEmbed = role === "embed";
      for (let ki = 0; ki < keys.length; ki++) {
        entry.keys_tried++;
        const ts = Date.now();
        const url = isEmbed ? `${API}/models/${model}:embedContent?key=${encodeURIComponent(keys[ki])}` : `${API}/models/${model}:generateContent?key=${encodeURIComponent(keys[ki])}`;
        const body = isEmbed ? { model: `models/${model}`, content: { parts: [{ text: "ok" }] } } : { contents: [{ parts: [{ text: "Reply with the single word ok." }] }], generationConfig: { maxOutputTokens: 8, temperature: 0 } };
        const r = await fetchOnce(fetchFn, url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, timeoutMs);
        const cls = r.threw ? "net" : classify(r.status, r.bodyText);
        entry.class = cls; entry.latency_ms = Date.now() - ts; entry.method = isEmbed ? "embedContent" : "generateContent";
        if (cls === "ok") {
          entry.ok = true;
          if (isEmbed) entry.dim = (((r.json || {}).embedding || {}).values || []).length || null;
          if (!out.keys.ok.includes(ki)) out.keys.ok.push(ki);
          break;
        }
        if (cls === "quota") { if (!out.keys.quota.includes(ki)) out.keys.quota.push(ki); await sleepFn(150); continue; }   // next key: is it the model or the key?
        if (cls === "key-bad") { if (!out.keys.bad.includes(ki)) out.keys.bad.push(ki); continue; }
        if (cls === "demand") { await sleepFn(500); continue; }
        break;   // model-gone / request / net / schema: the model, not the key
      }
      cands.push(entry);
    }
    for (const c of cands) if (!eligible(role, c.model)) c.unseeded = true;   // listed, measured, never leads
    const okRanked = cands.filter((c) => c.ok && rank(c.model) !== null && eligible(role, c.model)).sort(cmp(role));
    const chosen = okRanked[0] ? okRanked[0].model : null;
    const seedTop = SEED[role][0] || null;
    const prevRole = prev && prev.roles ? prev.roles[role] : null;
    out.roles[role] = {
      chosen, seed_top: seedTop, fell_back_from: chosen && seedTop && chosen !== seedTop ? seedTop : null,
      chosen_since: prevRole && prevRole.chosen === chosen && prevRole.chosen_since ? prevRole.chosen_since : now.toISOString(),
      dead: !chosen && !(ROLE_FALLBACK[role]), fallback_role: !chosen && ROLE_FALLBACK[role] ? ROLE_FALLBACK[role] : null,
      candidates: cands, embed_dim: role === "embed" ? ((okRanked[0] || {}).dim || null) : undefined,
    };
    // keys quota'd on EVERY candidate of this role were never proven ok — those the model answered on are ok
    if (role === "embed" && prevRole && prevRole.embed_dim && out.roles[role].embed_dim && prevRole.embed_dim !== out.roles[role].embed_dim) out.roles[role].dim_changed_from = prevRole.embed_dim;
  }
  // 3) THE KEY SWEEP — "keys ok n/N" is a measurement, not a leftover: every key not yet proven
  //    answers once on text's chosen model (the cheapest live call). A key that never answered
  //    on any role and said quota is quota; ok beats quota; bad is bad.
  const sweepModel = (out.roles.text || {}).chosen;
  if (sweepModel) for (let ki = 0; ki < keys.length; ki++) {
    if (out.keys.ok.includes(ki) || out.keys.bad.includes(ki)) continue;
    const r = await fetchOnce(fetchFn, `${API}/models/${sweepModel}:generateContent?key=${encodeURIComponent(keys[ki])}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: "Reply with the single word ok." }] }], generationConfig: { maxOutputTokens: 8, temperature: 0 } }) }, timeoutMs);
    const cls = r.threw ? "net" : classify(r.status, r.bodyText);
    if (cls === "ok") out.keys.ok.push(ki); else if (cls === "quota") { if (!out.keys.quota.includes(ki)) out.keys.quota.push(ki); } else if (cls === "key-bad") out.keys.bad.push(ki);
    await sleepFn(100);
  }
  out.keys.sweep_model = sweepModel || null;
  // a key that answered ok on ANY role is ok; a key that only ever said quota is quota; the rest is what it is
  out.keys.quota = out.keys.quota.filter((k) => !out.keys.ok.includes(k));
  out.keys.ok.sort((a, b) => a - b); out.keys.quota.sort((a, b) => a - b); out.keys.bad.sort((a, b) => a - b);
  return finishProbe(out, { write, path, prev, t0 });
}
function finishProbe(out, { write, path, prev, t0 }) {
  out.ms = Date.now() - t0;
  const p = prev === undefined ? readJson(path) : prev;
  if (p && p.at) out.previous_at = p.at;
  if (write && !isFixture()) {
    try { mkdirSync(dirname(path), { recursive: true }); const tmp = `${path}.${process.pid}.tmp`; writeFileSync(tmp, JSON.stringify(out, null, 1) + "\n"); renameSync(tmp, path); out.written = path; }
    catch (e) { out.written = false; out.write_error = String((e && e.message) || e); }
  } else out.written = false;
  return out;
}
export function isFixture() { return (process.argv[2] || "") === "selftest" || !!process.env.ARSENAL_AUDIT_COLLAR; }

// ── the board line (state week · watchman) ──
export function boardLine(b = board()) {
  if (!b) return "gemini: never probed — `node scripts/models.mjs probe`";
  const r = (role) => { const x = (b.roles || {})[role] || {}; return x.chosen ? x.chosen.replace(/^gemini-/, "") : x.fallback_role ? `→${x.fallback_role}` : !SEED[role].length ? `unseeded(${(x.candidates || []).filter((c) => c.ok).length} listed)` : "DEAD"; };
  return `gemini: text→${r("text")} · lite→${r("lite")} · pro→${r("pro")} · live→${r("live")} · image→${r("image")} · embed→${r("embed")}${(b.roles || {}).embed && b.roles.embed.embed_dim ? `(${b.roles.embed.embed_dim})` : ""} · keys ok ${(b.keys || {}).ok ? b.keys.ok.length : "?"}/${(b.keys || {}).n || "?"}${(b.keys || {}).quota && b.keys.quota.length ? ` quota ${b.keys.quota.length}` : ""}${(b.keys || {}).bad && b.keys.bad.length ? ` BAD ${b.keys.bad.length}` : ""} · probed ${b.age_h === null ? "?" : b.age_h.toFixed(0)} h ago${b.fresh ? "" : " (STALE)"}`;
}
// findings for the watchman (pure over a board object)
export function findings(b = board(), now = Date.now()) {
  const F = [];
  if (!b) return [{ id: "model-never-probed", level: "WARN", finding: "models.json absent — no role has been measured; every caller rides the seed", evidence: "`node scripts/models.mjs probe`" }];
  for (const role of ROLES) {
    const x = (b.roles || {})[role]; if (!x) continue;
    // LOAD ZERO BLOCK 8 (19 Aug 2026) — A ROLE MAY BE UNSEEDED BY DESIGN; IT MAY NOT BE SILENT.
    // This line used to be `if (role === "image") continue;` — the role was skipped out of the
    // findings loop entirely, so `image` sat DEAD while SIX image models measured `ok` on the live
    // probe (2.5-flash-image · 3-pro-image-preview · 3-pro-image · 3.1-flash-image-preview ·
    // 3.1-flash-image · 3.1-flash-lite-image) and nothing anywhere said so. Unseeded IS the design
    // — which model leads a generation role is HIS call, not a measurement — but "waiting for his
    // word" and "silently dark" are different states and only one of them is honest.
    // It is a WARN, not a RED: nothing is broken. And it is shaped as an ASK that can be answered in
    // one line, because under BLOCK 6 an organ may only put a thing in his lane if it can say why
    // code cannot decide it — which here it can, and does.
    if (role === "image") {
      const ok = (x.candidates || []).filter((c) => c.class === "ok");
      if (!x.chosen && ok.length) F.push({ id: "model-role-unseeded", level: "WARN",
        finding: `role image has ${ok.length} model(s) answering OK and NONE may lead — the role is dark until he names one`,
        why_code_cannot_decide: "which image model leads is a taste call about the pictures it makes, not a measurement — the probe can rank latency but cannot choose the look he wants",
        evidence: `${ok.map((c) => c.model).join(" · ")} — one-line edit: SEED.image in scripts/models.mjs · \`node scripts/models.mjs status\`` });
      continue;
    }
    if (x.dead) F.push({ id: "model-role-dead", level: "RED", finding: `role ${role}: zero live candidates on all keys — every organ on this role is dark`, evidence: `${(x.candidates || []).map((c) => `${c.model} ${c.class}`).join(" · ")} · seed: scripts/models.mjs SEED.${role} · \`node scripts/models.mjs probe\`` });
    else if (x.fell_back_from && x.chosen_since && now - Date.parse(x.chosen_since) > 24 * 3600000) F.push({ id: "model-fell-back", level: "WARN", finding: `role ${role} served by ${x.chosen} (seed top ${x.fell_back_from}) for ${((now - Date.parse(x.chosen_since)) / 3600000).toFixed(0)} h`, evidence: `${(x.candidates || []).filter((c) => c.model === x.fell_back_from).map((c) => `${c.model} ${c.class}`).join("") || "seed top not probed"} · his one-line seed edit or Google's tier — \`node scripts/models.mjs status\`` });
    if (x.dim_changed_from) F.push({ id: "embed-dim-changed", level: "RED", finding: `embed dim changed ${x.dim_changed_from} → ${x.embed_dim} — every stored vector (hippocampus recall index, dugout) is now incomparable`, evidence: `${x.chosen} · re-index or pin the previous model in SEED.embed` });
  }
  if (b.keys && b.keys.n) F.push({ id: "quota-keys", level: "INFO", finding: `gemini keys ok ${b.keys.ok.length}/${b.keys.n}${b.keys.quota.length ? ` · quota ${b.keys.quota.join(",")}` : ""}${b.keys.bad.length ? ` · BAD ${b.keys.bad.join(",")}` : ""}`, evidence: boardLine(b) });
  return F;
}

// ── THE MECHANICAL LAW: no literal model name outside this file ──
export function check({ dir = __dirname, files = null } = {}) {
  const self = basename(fileURLToPath(import.meta.url));
  const list = files || readdirSync(dir).filter((f) => f.endsWith(".mjs") && f !== self).map((f) => join(dir, f));
  const hits = [], declared = [];
  const RE = /gemini-[0-9a-z][0-9a-z.\-]*/g;
  for (const f of list) {
    let src = ""; try { src = readFileSync(f, "utf8"); } catch { continue; }
    const orig = src.split("\n");                                             // the pragma may sit inside a block comment
    src = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));   // block comments blanked, lines kept
    const lines = src.split("\n");
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (/^\s*\/\//.test(line)) continue;                       // a comment line is history, not a call
      const cut = line.indexOf(" //"); if (cut > 0) line = line.slice(0, cut);   // trailing comment
      let m; RE.lastIndex = 0;
      while ((m = RE.exec(line))) {
        const tok = m[0].replace(/[.\-]+$/, "");
        if (LABELS.has(tok)) continue;
        if (!/^gemini-(\d|flash|pro|embedding|exp|live)/.test(tok)) continue;   // gemini-quality etc. handled by LABELS; only model-shaped tokens count
        const row = { file: basename(f), line: i + 1, literal: tok, text: lines[i].trim().slice(0, 140) };
        if (orig[i].includes(LITERAL_OK)) declared.push(row); else hits.push(row);
      }
    }
  }
  // Claude side: brain_config names only opus|sonnet|haiku
  let claude = { ok: true, offenders: [] };
  try {
    const cfg = readJson(join(STATE_DIR, "brain_config.json"));
    const walk = (o, path) => { if (!o || typeof o !== "object") return; for (const [k, v] of Object.entries(o)) { if (/^model$/i.test(k) && typeof v === "string" && !/^(opus|sonnet|haiku)$/.test(v)) claude.offenders.push(`${path}.${k}=${v}`); walk(v, `${path}.${k}`); } };
    if (cfg) walk(cfg, "brain_config");
    claude.ok = claude.offenders.length === 0;
  } catch { /* unreadable brain_config → not this check's finding */ }
  return { ok: hits.length === 0 && claude.ok, hits, declared, claude, files: list.length };
}

// ── SELFTEST — hermetic: a scripted fetch, a scratch models.json, the live file untouched ──
let pass = 0, fail = 0; const fails = [];
const assert = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; fails.push({ n, d }); console.log(`  FAIL ${n}${d ? `\n         ${d}` : ""}`); } };
const res = (status, body) => ({ ok: status >= 200 && status < 300, status, text: async () => typeof body === "string" ? body : JSON.stringify(body) });
const okGen = (txt = "ok") => res(200, { candidates: [{ content: { parts: [{ text: txt }] } }] });
function scripted(table) {   // table: fn(model, keyIdx, url) → response | throws
  const calls = [];
  const f = async (url, init) => {
    const m = /\/models\/([^:?]+)(?::([a-zA-Z]+))?\?key=([^&]+)/.exec(url);
    const model = m ? m[1] : null, method = m ? m[2] : null, key = m ? decodeURIComponent(m[3]) : null;
    const ki = key ? Number(key.replace(/^k/, "")) : -1;
    calls.push({ model, method, ki, url });
    const r = table(model, ki, url, init, method);
    if (r instanceof Error) throw r;
    return r;
  };
  f.calls = calls;
  return f;
}
async function selftest() {
  console.log("=== models.mjs selftest — the resolver is a code path; the classes each have their own action ===\n");
  const liveStat = existsSync(MODELS_JSON) ? (() => { const s = statSync(MODELS_JSON); return `${s.size}:${s.mtimeMs}`; })() : "absent";
  const K = ["k0", "k1", "k2"];
  const noBoard = null;
  _resetMemory();
  // classify
  assert("classify: 404 model-gone · 429 quota · 401/403 key-bad · 400 'API key' key-bad · 400 other request · 503 demand · 0 net · 200 ok",
    classify(404) === "model-gone" && classify(429) === "quota" && classify(401) === "key-bad" && classify(403) === "key-bad" && classify(400, "API key not valid") === "key-bad" && classify(400, "Invalid JSON payload") === "request" && classify(503) === "demand" && classify(0) === "net" && classify(200) === "ok");
  assert("cooldown: a 429 body's retryDelay is honoured (37s → 37000 ms), else the 15-min default", cooldownMs('{"error":{"details":[{"retryDelay":"37s"}]}}') === 37000 && cooldownMs("{}") === DEFAULT_COOLDOWN_MS);
  assert("rank: explicit generation parsed (3.6 > 3.5 > 3), -latest below any generation (0.5), an unknown shape unranked (null)", rank("gemini-3.6-flash") === 3.6 && rank("gemini-3-flash-preview") === 3 && rank("gemini-flash-latest") === 0.5 && rank("gemma-4") === null);
  assert("candidates(text) with no board = env → seed order; the seed's top is 3.6-flash; pro appends text's as fell_back_role",
    candidates("text", { boardObj: noBoard })[0].model === SEED.text[0] && candidates("pro", { boardObj: noBoard }).some((c) => c.fell_back_role === "text"));
  process.env.__MODELS_T = "gemini-9-flash";
  assert("env override: a site's legacy env name leads the candidates and resolveSync names it (source env:<name>)", candidates("text", { env: "__MODELS_T", boardObj: noBoard })[0].model === "gemini-9-flash" && resolveSync("text", { env: "__MODELS_T", boardObj: noBoard }).source === "env:__MODELS_T");
  delete process.env.__MODELS_T;
  assert("LEGACY_ENV: the seven pre-existing env names map to roles", Object.keys(LEGACY_ENV).length === 7 && LEGACY_ENV.GAFFER_WATCHER_MODEL === "text" && LEGACY_ENV.DUGOUT_EMBED_MODEL === "embed" && LEGACY_ENV.DUGOUT_MODEL === "live");

  // 404 → next candidate, key NOT rotated
  _resetMemory();
  let f = scripted((model, ki) => model === SEED.text[0] ? res(404, "no longer available") : okGen("hi"));
  let r = await generate("text", { contents: [] }, { keys: K, fetchFn: f, boardObj: noBoard, sleepFn: async () => {} });
  assert("404 model-gone → NEXT CANDIDATE on the SAME key (no key rotation), receipt names fell_back_from", r.ok && r.model === SEED.text[1] && r.key_index === 0 && r.fell_back_from === SEED.text[0] && f.calls.length === 2 && f.calls[0].ki === 0 && f.calls[1].ki === 0, JSON.stringify(r.tried));
  r = await generate("text", { contents: [] }, { keys: K, fetchFn: f, boardObj: noBoard, sleepFn: async () => {} });
  assert("…and the dead model is remembered in-process: the second call skips it WITHOUT a wire call (tried[0].cached)", r.ok && r.tried[0].class === "model-gone" && r.tried[0].cached === true && f.calls.length === 3);
  // 429 → next key + cooldown
  _resetMemory();
  f = scripted((model, ki) => model === SEED.text[0] && ki < 2 ? res(429, '{"error":{"details":[{"retryDelay":"9s"}]}}') : okGen("hi"));
  r = await generate("text", { contents: [] }, { keys: K, fetchFn: f, boardObj: noBoard, sleepFn: async () => {} });
  assert("429 quota → NEXT KEY on the same model; key 2 answers; receipt key_index 2, no fell_back_from", r.ok && r.model === SEED.text[0] && r.key_index === 2 && r.fell_back_from === null && f.calls.length === 3, JSON.stringify(r.tried));
  const mem = memory();
  assert("…and key×model cooldowns are set for keys 0 and 1 (retryDelay 9s honoured), so the next call goes straight to key 2", mem.cooldowns.length === 2 && mem.cooldowns.every((c) => c.until - Date.now() <= 9000 && c.until > Date.now()));
  r = await generate("text", { contents: [] }, { keys: K, fetchFn: f, boardObj: noBoard, sleepFn: async () => {} });
  assert("…second call: keys 0,1 skipped as cached quota, ONE wire call", r.ok && r.key_index === 2 && f.calls.length === 4 && r.tried.filter((t) => t.cached).length === 2);
  // every candidate quota on every key → why names the classes, never "pool dry"
  _resetMemory();
  f = scripted(() => res(429, "{}"));
  r = await generate("text", { contents: [] }, { keys: K, fetchFn: f, boardObj: noBoard, sleepFn: async () => {} });
  assert("all quota → ok:false with a `why` that names each candidate's class×count and the key count — the phrase 'pool dry' is retired", !r.ok && /quota×3/.test(r.why) && /on 3 key/.test(r.why) && !/pool dry/.test(r.why), r.why);
  // 503 → backoff 2× then next candidate
  _resetMemory();
  const naps = [];
  f = scripted((model) => model === SEED.text[0] ? res(503, "high demand") : okGen("hi"));
  r = await generate("text", { contents: [] }, { keys: K, fetchFn: f, boardObj: noBoard, sleepFn: async (ms) => { naps.push(ms); } });
  assert("503 demand → one backoff (500 ms) and a retry on the same key, then NEXT CANDIDATE", r.ok && r.model === SEED.text[1] && naps.length === 1 && naps[0] === 500 && f.calls.filter((c) => c.model === SEED.text[0]).length === 2, JSON.stringify({ naps, tried: r.tried }));
  // net → retry once then next key
  _resetMemory();
  f = scripted((model, ki) => ki === 0 ? new Error("ECONNRESET") : okGen("hi"));
  r = await generate("text", { contents: [] }, { keys: K, fetchFn: f, boardObj: noBoard, sleepFn: async () => {} });
  assert("net (fetch throws) → retry once on the same key, then NEXT KEY", r.ok && r.key_index === 1 && f.calls.filter((c) => c.ki === 0).length === 2 && r.tried.filter((t) => t.class === "net").length === 2, JSON.stringify(r.tried));
  // key-bad → key marked, next key
  _resetMemory();
  f = scripted((model, ki) => ki === 0 ? res(403, "forbidden") : okGen("hi"));
  r = await generate("text", { contents: [] }, { keys: K, fetchFn: f, boardObj: noBoard, sleepFn: async () => {} });
  assert("403 key-bad → key 0 marked bad for the process, key 1 answers", r.ok && r.key_index === 1 && memory().bad_keys.includes(0));
  // schema (200 empty) → next candidate
  _resetMemory();
  f = scripted((model) => model === SEED.text[0] ? res(200, { candidates: [] }) : okGen("hi"));
  r = await generate("text", { contents: [] }, { keys: K, fetchFn: f, boardObj: noBoard, sleepFn: async () => {} });
  assert("200-but-empty schema → NEXT CANDIDATE", r.ok && r.model === SEED.text[1] && r.tried[0].class === "schema");
  // request (400 not a key) → stop
  _resetMemory();
  f = scripted(() => res(400, "Invalid JSON payload received"));
  r = await generate("text", { contents: [] }, { keys: K, fetchFn: f, boardObj: noBoard, sleepFn: async () => {} });
  assert("400 request (not a key problem) → STOP after one call; rotating cannot heal a bad body; why carries the body", !r.ok && f.calls.length === 1 && /request body/.test(r.why));
  // pro → falls back to text and says so
  _resetMemory();
  f = scripted((model) => /pro/.test(model) ? res(429, "{}") : okGen("hi"));
  r = await generate("pro", { contents: [] }, { keys: K, fetchFn: f, boardObj: noBoard, sleepFn: async () => {} });
  assert("pro with no free tier → falls back to the text role and the receipt SAYS fell_back_role:'text'", r.ok && r.fell_back_role === "text" && r.model === SEED.text[0], JSON.stringify({ model: r.model, fb: r.fell_back_role }));
  // embed → dim recorded; the batch body names the candidate model in every request
  _resetMemory();
  let seenBody = null;
  f = scripted((model, ki, url, init) => { seenBody = JSON.parse(init.body); return res(200, { embeddings: [{ values: [0.1, 0.2, 0.3] }, { values: [0.4, 0.5, 0.6] }] }); });
  const e = await embed("embed", ["a", "b"], { keys: K, fetchFn: f, boardObj: noBoard });
  assert("embed: batchEmbedContents on the embed role, dim recorded (3), model + key in the receipt, request bodies name the candidate", e.ok && e.dim === 3 && e.vectors.length === 2 && e.model === SEED.embed[0] && seenBody.requests[0].model === `models/${SEED.embed[0]}` && f.calls[0].method === "batchEmbedContents", JSON.stringify(e.tried));
  // no keys / no candidate
  r = await generate("text", {}, { keys: [], fetchFn: f, boardObj: noBoard });
  assert("no key in the pool → ok:false, why says so, zero calls", !r.ok && /no Gemini key/.test(r.why));
  r = await generate("image", {}, { keys: K, fetchFn: f, boardObj: noBoard });
  assert("an unseeded role (image) → ok:false 'no candidate seeded', zero calls — never a guess", !r.ok && /no candidate seeded/.test(r.why));

  // resolveSync from a FRESH board: the probe's ranked ok candidate leads over the seed; STALE board → seed and says so
  const fresh = { at: new Date().toISOString(), fresh: true, age_h: 1, roles: { text: { chosen: "gemini-3.5-flash", candidates: [{ model: "gemini-3.6-flash", ok: false, class: "quota" }, { model: "gemini-3.5-flash", ok: true, class: "ok", latency_ms: 800 }, { model: "gemini-4-flash", ok: true, class: "ok", latency_ms: 900 }] } } };
  const rs = resolveSync("text", { boardObj: fresh });
  assert("resolveSync on a FRESH board: the highest-ranked probed-ok candidate leads (a discovered gemini-4-flash outranks the seed's 3.6 that was quota)", rs.model === "gemini-4-flash" && rs.source === "probe", JSON.stringify(rs));
  const stale = { ...fresh, fresh: false, age_h: 80 };
  const rs2 = resolveSync("text", { boardObj: stale });
  assert("…on a STALE board (80 h): the seed leads and why says 'models.json stale'", rs2.model === SEED.text[0] && /stale/.test(rs2.why), JSON.stringify(rs2));
  const cq = candidates("text", { boardObj: { fresh: true, roles: { text: { candidates: [{ model: SEED.text[0], ok: false, class: "model-gone" }] } } } });
  assert("a probed-dead seed member (404 last night) sinks to the tail of the candidates — still tried last, never first", cq[cq.length - 1].model === SEED.text[0] && cq[0].model === SEED.text[1]);

  // PROBE — scripted wire, scratch path; the LIVE models.json is untouched (this is a fixture process)
  const scratch = mkdtempSync(join(tmpdir(), "arsenal-models-"));
  const scratchJson = join(scratch, "models.json");
  try {
    const listBody = { models: [
      { name: "models/gemini-3.6-flash", supportedGenerationMethods: ["generateContent"] }, { name: "models/gemini-3.5-flash", supportedGenerationMethods: ["generateContent"] },
      { name: "models/gemini-4-flash", supportedGenerationMethods: ["generateContent"] }, { name: "models/gemini-flash-latest", supportedGenerationMethods: ["generateContent"] },
      { name: "models/gemini-3.5-flash-lite", supportedGenerationMethods: ["generateContent"] }, { name: "models/gemini-3.1-pro-preview", supportedGenerationMethods: ["generateContent"] },
      { name: "models/gemini-3.1-flash-live-preview", supportedGenerationMethods: ["bidiGenerateContent"] }, { name: "models/gemini-3.5-live-translate-preview", supportedGenerationMethods: ["bidiGenerateContent"] }, { name: "models/gemini-embedding-001", supportedGenerationMethods: ["embedContent"] },
      { name: "models/gemini-weird-thing-flash", supportedGenerationMethods: ["generateContent"] },
    ] };
    const pf = async (url, init) => {
      if (/\/models\?/.test(url)) return res(200, listBody);
      const m = /\/models\/([^:?]+):([a-zA-Z]+)\?key=([^&]+)/.exec(url); const model = m[1], method = m[2], ki = Number(m[3].replace("k", ""));
      if (model === "gemini-flash-latest") return res(429, "{}");                       // the dead alias: quota on every key
      if (model === "gemini-4-flash") return ki === 0 ? res(429, "{}") : okGen("ok"); // quota on key 0 only → still ok (key 1)
      if (/pro/.test(model)) return res(429, "{}");                                    // no free tier
      if (method === "embedContent") return res(200, { embedding: { values: new Array(3072).fill(0.01) } });
      if (model === "gemini-3-flash-preview") return res(404, "gone");
      return okGen("ok");
    };
    const p = await probe({ keys: K, fetchFn: pf, write: true, path: scratchJson, sleepFn: async () => {}, prev: { at: "2026-08-17T00:00:00Z", roles: { text: { chosen: "gemini-3.5-flash", chosen_since: "2026-08-10T00:00:00Z" }, embed: { embed_dim: 768 } } } });
    assert("PROBE: text chosen = the highest-ranked ok candidate (discovered gemini-4-flash, ok on key 1 after quota on key 0); flash-latest quota×3 recorded as a class, not as 'dry'",
      p.roles.text.chosen === "gemini-4-flash" && p.roles.text.candidates.find((c) => c.model === "gemini-flash-latest").class === "quota" && p.roles.text.candidates.find((c) => c.model === "gemini-flash-latest").keys_tried === 3, JSON.stringify(p.roles.text));
    assert("PROBE: pro has no free tier → chosen null, dead:false, fallback_role 'text' (the role is served, by text, and the board says so)", p.roles.pro.chosen === null && p.roles.pro.dead === false && p.roles.pro.fallback_role === "text");
    assert("PROBE: live is probed by PRESENCE + bidiGenerateContent (no cheap bidi call exists) → 3.1-flash-live ok", p.roles.live.chosen === "gemini-3.1-flash-live-preview" && p.roles.live.candidates[0].method === "listed");
    assert("PROBE: live is STICKY — a discovered gemini-3.5-live-translate-preview (higher generation, listed ok) is marked unseeded and never leads the Gaffer's mouth (measured 18 Aug: presence-ranking chose it)", p.roles.live.candidates.find((c) => c.model === "gemini-3.5-live-translate-preview").unseeded === true && p.roles.live.chosen === "gemini-3.1-flash-live-preview");
    assert("PROBE: embed dim recorded (3072) and a change from the previous board (768) is flagged dim_changed_from", p.roles.embed.embed_dim === 3072 && p.roles.embed.dim_changed_from === 768);
    assert("PROBE: embed is STICKY — seed order wins (embedding-001 chosen although embedding-2 ranks higher and answered): a vector space never moves on the probe's own", p.roles.embed.chosen === "gemini-embedding-001", p.roles.embed.chosen);
    assert("PROBE: an unranked family name (gemini-weird-thing-flash) is LISTED under unranked, never chosen", p.unranked.includes("gemini-weird-thing-flash") && p.roles.text.chosen !== "gemini-weird-thing-flash");
    assert("PROBE: keys — ok [0,1,2] (each answered on some role); quota list holds only keys that NEVER answered", p.keys.ok.length === 3 && p.keys.quota.length === 0, JSON.stringify(p.keys));
    assert("PROBE: chosen_since carries over when the choice is unchanged, resets when it changes (text changed 3.5→4: reset)", p.roles.text.chosen_since !== "2026-08-10T00:00:00Z");
    assert("PROBE (fixture process): NEVER writes the live models.json — written:false on the live path; the scratch path is written on request", p.written === false && !existsSync(scratchJson));
    // findings + board line off the probe object
    const bObj = { ...p, fresh: true, age_h: 0.1 };
    const F = findings({ ...bObj, roles: { ...bObj.roles, text: { ...bObj.roles.text, chosen_since: new Date(Date.now() - 30 * 3600000).toISOString(), fell_back_from: "gemini-3.6-flash", chosen: "gemini-3.5-flash" }, lite: { ...bObj.roles.lite, chosen: null, dead: true, fallback_role: null } } });
    assert("FINDINGS: RED model-role-dead (lite dead) · WARN model-fell-back (text on a lower candidate > 24 h) · RED embed-dim-changed · INFO quota-keys",
      F.some((x) => x.id === "model-role-dead" && x.level === "RED") && F.some((x) => x.id === "model-fell-back" && x.level === "WARN") && F.some((x) => x.id === "embed-dim-changed" && x.level === "RED") && F.some((x) => x.id === "quota-keys" && x.level === "INFO"), JSON.stringify(F.map((x) => x.id)));
    assert("FINDINGS: a fell-back role under 24 h is NOT a finding (the seed top may be back tomorrow); a healthy board = INFO only", !findings({ ...bObj, roles: { text: { ...bObj.roles.text, fell_back_from: "gemini-3.6-flash", chosen_since: new Date().toISOString() } } }).some((x) => x.level !== "INFO"));
    assert("BOARD LINE: one line for state week — roles → models, image unseeded(n listed), embed dim, keys ok n/N, probed h ago", /gemini: text→4-flash · lite→3\.5-flash-lite · pro→→text · live→3\.1-flash-live-preview · image→unseeded\(0 listed\) · embed→embedding-001\(3072\) · keys ok 3\/3/.test(boardLine(bObj)), boardLine(bObj));
    assert("BOARD LINE with no board: names the probe command", /never probed/.test(boardLine(null)));
    // check() on a fixture dir
    const cdir = join(scratch, "scripts"); mkdirSync(cdir);
    writeFileSync(join(cdir, "a.mjs"), `const m = "gemini-3.5-flash";\n// gemini-2.0-flash in a comment is history\nconst label = "gemini-study";\nconst fx = "gemini-flash-lite-latest"; // ${LITERAL_OK}: a retired name the selftest feeds on purpose\nconst z = 1; // gemini-2.5-flash trailing comment\n`);
    writeFileSync(join(cdir, "b.mjs"), `import { generate } from "./models.mjs";\nawait generate("text", {});\n`);
    const c1 = check({ dir: cdir });
    assert("CHECK: ONE literal model name in code = FAIL, naming file:line; comment lines, trailing comments, labels and a `models-literal-ok` fixture line do not count (declared: 1)", !c1.ok && c1.hits.length === 1 && c1.hits[0].line === 1 && c1.declared.length === 1 && c1.hits[0].literal === "gemini-3.5-flash", JSON.stringify({ hits: c1.hits, declared: c1.declared }));
    writeFileSync(join(cdir, "a.mjs"), `import { resolveSync } from "./models.mjs";\nconst m = resolveSync("text").model;\nconst label = "gemini-study";\n`);
    assert("CHECK: rewired to a role → ok:true", check({ dir: cdir }).ok === true);
  } finally { rmSync(scratch, { recursive: true, force: true }); }
  _resetMemory();
  const liveStat2 = existsSync(MODELS_JSON) ? (() => { const s = statSync(MODELS_JSON); return `${s.size}:${s.mtimeMs}`; })() : "absent";
  assert("HERMETIC: the live dressing-room/state/models.json is byte-for-byte untouched by this selftest (size:mtime unchanged)", liveStat === liveStat2, `${liveStat} → ${liveStat2}`);
  // THE LAW on the live tree
  const live = check();
  assert(`THE LAW (live tree): zero literal gemini model names in scripts/*.mjs outside models.mjs (${live.files} files scanned · ${live.declared.length} declared fixture line(s))`, live.hits.length === 0, live.hits.map((h) => `${h.file}:${h.line} ${h.literal}`).join(" · "));
  assert("THE LAW (Claude side): brain_config.json names only opus|sonnet|haiku", live.claude.ok, live.claude.offenders.join(" · "));
  console.log(`\nmodels selftest: ${pass} passed, ${fail} failed`);
  if (fail) for (const x of fails) console.log(`  · ${x.n}${x.d ? `\n      ${x.d}` : ""}`);
  process.exit(fail ? 1 : 0);
}

// ── CLI ──
async function main() {
  const mode = (process.argv[2] || "status").toLowerCase();
  if (mode === "selftest") return selftest();
  if (mode === "check") {
    const c = check();
    console.log(`models check: ${c.files} file(s) · literal model names outside models.mjs: ${c.hits.length} · declared fixture lines: ${c.declared.length} · brain_config claude aliases ${c.claude.ok ? "ok" : "OFFENDERS " + c.claude.offenders.join(", ")}`);
    for (const h of c.hits) console.log(`  ✗ ${h.file}:${h.line} ${h.literal} — ${h.text}`);
    for (const d of c.declared) console.log(`  · declared ${d.file}:${d.line} ${d.literal}`);
    process.exit(c.ok ? 0 : 1);
  }
  if (mode === "probe") {
    const p = await probe({ prev: readJson(MODELS_JSON) });
    console.log(`models probe: ${p.ms} ms · listed ${p.listed.length} · keys ${p.keys.n} (ok ${p.keys.ok.length} · quota ${p.keys.quota.length} · bad ${p.keys.bad.length}) · written ${p.written || "no"}`);
    for (const role of ROLES) { const x = p.roles[role]; if (!x) continue; console.log(`  ${role.padEnd(6)} → ${x.chosen || (x.fallback_role ? `(none free — falls back to ${x.fallback_role})` : "DEAD")}${x.fell_back_from ? ` (seed top ${x.fell_back_from} not chosen)` : ""}${x.embed_dim ? ` dim ${x.embed_dim}` : ""}`); for (const c of x.candidates) console.log(`         ${c.ok ? "ok  " : "✗   "} ${c.model.padEnd(40)} ${c.class || "?"}${c.latency_ms != null ? ` ${c.latency_ms} ms` : ""}${c.keys_tried > 1 ? ` (keys tried ${c.keys_tried})` : ""}${c.unseeded ? " · unseeded (listed, never leads — a seed edit names it)" : ""}`); }
    if (p.unranked.length) console.log(`  unranked (listed, never chosen until the seed names them): ${p.unranked.join(", ")}`);
    return;
  }
  if (mode === "resolve") { const role = process.argv[3]; console.log(JSON.stringify(resolveSync(role), null, 1)); return; }
  if (mode === "status") {
    const b = board();
    console.log(boardLine(b));
    if (!b) return;
    for (const role of ROLES) { const x = b.roles[role]; if (!x) continue; console.log(`  ${role.padEnd(6)} ${x.chosen || (x.fallback_role ? `→ ${x.fallback_role}` : "DEAD")}${x.fell_back_from ? ` · seed top ${x.fell_back_from} not chosen` : ""} · since ${String(x.chosen_since || "").slice(0, 16)} · ${(x.candidates || []).map((c) => `${c.model.replace(/^gemini-/, "")} ${c.class}${c.keys_tried > 1 ? `×${c.keys_tried}` : ""}`).join(" · ")}`); }
    if (b.unranked && b.unranked.length) console.log(`  unranked: ${b.unranked.join(", ")}`);
    const F = findings(b); for (const x of F) console.log(`  [${x.level}] ${x.id} — ${x.finding}`);
    return;
  }
  console.log("models: status | probe | check | resolve <role> | selftest");
  process.exit(2);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
