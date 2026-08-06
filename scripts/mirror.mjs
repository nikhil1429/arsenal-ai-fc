#!/usr/bin/env node
// ============================================================================
// mirror.mjs · ARSENAL AI FC — THE ORGANISM: THE CAPSULE-MIRROR
// ----------------------------------------------------------------------------
// WHAT:  Pulls the captain's FORGE capsules from the public GitHub gist to a
//        LOCAL READ-ONLY copy (dressing-room/state/capsules/<id>.json) so the
//        Doubt Engine can finally read his richest signal — 100+ doubts that
//        were write-only until this organ existed. Named honestly in
//        THE_ORGANISM §IV.2 as a first-class prerequisite; this is it.
// WHY:   Five mechanisms silently need the capsules on the local bus (decoy
//        map · lexicon · tape room · derby seeds · set-piece rematches).
//        The gist stays the MASTER (captain's manual Option-A writes only);
//        the mirror never writes back — a one-way afferent nerve.
// LAWS:  Single writer of capsules/ + mirror_manifest.json. Network allowed
//        ONLY to the configured gist raw base (injectable fetchFn — selftest
//        never touches the network). KEEP-LAST-GOOD: a failed fetch NEVER
//        deletes or overwrites an existing local copy. 404 = not locked yet
//        (normal — concepts #05..#17 aren't learned yet). Never fabricate.
//
//
// ===================== AUDIT #92 (2026-08-04) — ENUMERATE, AND MEAN "ALL" ====
// Two defects, one shape: the mirror could under-supply five downstream
// mechanisms and report health while doing it.
//
//  (1) THE ID LIST WAS A HARDCODED FOUR, TWICE. mirror_config.json carried
//      ids:["tokenization","embeddings","inference","context"] and DEFAULTS
//      below carried the SAME four — so a malformed config silently fell back
//      to the identical blind spot. pull() iterated cfg.ids only; there was no
//      gist listing anywhere in the file. concepts.json registers ~24 concepts
//      against 4 locked, so ~20 future locks sit on this path: the day a fifth
//      capsule locks, the mirror would have kept saying "all ok" while feeding
//      the decoy map, the lexicon, the tape room, the derby seeds and the
//      set-piece rematches only four. Fixed by ENUMERATING the gist — the
//      GitHub Gist API needs no credential (verified) — and treating cfg.ids
//      as a FLOOR, never as the truth.
//
//  (2) "ok" DID NOT MEAN "all". The old status was `okCount > 0 ? "ok" : ...`,
//      i.e. "at least one succeeded". This is not hypothetical: the live
//      manifest on 2026-08-04T10:58Z read "status":"ok" with tokenization
//      sitting at "error":"fetch_fail". Three of four, reported as health.
//      Fixed: "ok" now requires enumeration to have SUCCEEDED and EVERY known
//      capsule to have been fetched this run. Anything less is "degraded",
//      with a have/need counter (#106) naming the shortfall.
//
//  HONESTY RULE APPLIED (never render an unmeasured silence as a measured
//  zero): if the enumeration itself fails we do NOT quietly fall back to the
//  configured four and call it fine. We fall back to them to keep working, set
//  low_confidence:true, and say in the manifest that we could not learn whether
//  a fifth capsule exists.
// ============================================================================
//
// INPUT:  dressing-room/state/mirror_config.json (canon, committed)
// OUTPUT: dressing-room/state/capsules/<id>.json  (verbatim fetched bytes)
//         dressing-room/state/mirror_manifest.json {date,status,have,need,counter,
//           generated_at, fetched_at, enumeration:{ok,ids,error,source},
//           unlisted_ids, missing_from_gist, per_id:{<id>:{ok,bytes,sha256,error}}}
// MODES:  run (default) · selftest
// RULES (CONDUCTOR §4): deterministic · zero-LLM · no API key · Node 22 ESM ·
//   Windows-safe entry guard · atomic writes · empty-safe · never fabricate.
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CFG_PATH  = join(STATE_DIR, "mirror_config.json");

const DEFAULTS = {
  base: "https://gist.githubusercontent.com/nikhil1429/ce50c28d585c2fcd915a9dbf61871a56/raw/",
  // #92: this list is now a FLOOR, not the truth. Enumeration (below) is
  // authoritative; these four survive only so a total network failure still
  // mirrors the capsules we already know about. Kept deliberately in sync with
  // mirror_config.json — but no longer load-bearing, because a stale copy here
  // can no longer hide a fifth capsule.
  ids: ["tokenization", "embeddings", "inference", "context"],
  api_base: "https://api.github.com/gists/",
  timeout_ms: 15000,
};

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

function loadConfig(path = CFG_PATH) {
  // config_source is carried into the manifest so "we fell back to the hardcoded
  // four" can never again be indistinguishable from "the config said four".
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      const idsOk = Array.isArray(j.ids) && j.ids.length;
      return {
        base: typeof j.base === "string" ? j.base : DEFAULTS.base,
        ids: idsOk ? j.ids.map(String) : DEFAULTS.ids.slice(),
        api_base: typeof j.api_base === "string" ? j.api_base : DEFAULTS.api_base,
        timeout_ms: typeof j.timeout_ms === "number" ? j.timeout_ms : DEFAULTS.timeout_ms,
        config_source: idsOk ? "mirror_config.json" : "DEFAULTS (mirror_config.json has no usable ids[])",
      };
    }
  } catch { /* malformed config → defaults, and the manifest SAYS so */ }
  return { base: DEFAULTS.base, ids: DEFAULTS.ids.slice(), api_base: DEFAULTS.api_base, timeout_ms: DEFAULTS.timeout_ms, config_source: "DEFAULTS (mirror_config.json missing or malformed)" };
}

// ---------------------------------------------------------------------------
// #92 — GIST ENUMERATION. The raw base is
//   https://gist.githubusercontent.com/<user>/<gist_id>/raw/
// so the gist id is the LAST non-empty path segment before "raw". The API needs
// no credential (verified against the live gist on 2026-08-04); unauthenticated
// GitHub is rate-limited per hour, which is why a failure here degrades to the
// configured floor rather than aborting the mirror.
// ---------------------------------------------------------------------------
function gistIdFromBase(base) {
  const m = /^https?:\/\/gist\.githubusercontent\.com\/[^/]+\/([0-9a-f]{16,})/i.exec(String(base || ""));
  return m ? m[1] : null;
}
// A capsule id becomes a FILENAME on disk. Only accept shapes that are safe as a
// path segment — never let a remote listing choose where this organ writes.
const SAFE_ID = /^[a-z0-9][a-z0-9_-]{0,63}$/i;

async function enumerateGist(cfg, fetchFn) {
  const id = gistIdFromBase(cfg.base);
  if (!id) return { ok: false, ids: null, error: "no gist id in base url", source: cfg.base };
  const url = cfg.api_base + id;
  try {
    const res = await fetchFn(url, cfg.timeout_ms);
    if (res.status !== 200) return { ok: false, ids: null, error: `http_${res.status}`, source: url };
    let j = null;
    try { j = JSON.parse(res.text); } catch { return { ok: false, ids: null, error: "parse_fail", source: url }; }
    if (!j || typeof j !== "object" || !j.files || typeof j.files !== "object") {
      return { ok: false, ids: null, error: "no files map in gist response", source: url };
    }
    const ids = Object.keys(j.files)
      .filter(f => /\.json$/i.test(f))
      .map(f => f.replace(/\.json$/i, ""))
      .filter(x => SAFE_ID.test(x));
    return { ok: true, ids, error: null, source: url };
  } catch (e) {
    return { ok: false, ids: null, error: "fetch_fail", source: url };
  }
}

function writeAtomicText(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, text);
  renameSync(tmp, path);
}
function writeAtomic(path, obj) { writeAtomicText(path, JSON.stringify(obj, null, 2) + "\n"); }

// default fetcher — global fetch (Node 22) with timeout; the ONLY network path.
async function defaultFetch(url, timeout_ms) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout_ms);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    const text = await res.text();
    return { status: res.status, text };
  } finally { clearTimeout(t); }
}

// pure core: enumerate the gist, fetch every id, validate, keep-last-good.
// Returns {manifest, writes:[{path,text}]}
async function pull(cfg, fetchFn, hasLocal, now = new Date()) {
  const per_id = {};
  const writes = [];
  let okCount = 0;

  // #92 — ENUMERATE FIRST. cfg.ids is a floor; the gist is the truth.
  const enumeration = await enumerateGist(cfg, fetchFn);
  const configured = cfg.ids.slice();
  const discovered = enumeration.ok ? enumeration.ids : [];
  // union, configured order first so the manifest reads the way the config does
  const targets = [...configured, ...discovered.filter(x => !configured.includes(x))];
  const unlisted_ids = discovered.filter(x => !configured.includes(x));            // in the gist, absent from the config
  const missing_from_gist = enumeration.ok ? configured.filter(x => !discovered.includes(x)) : [];

  for (const id of targets) {
    const url = cfg.base + id + ".json";
    let entry;
    try {
      const res = await fetchFn(url, cfg.timeout_ms);
      if (res.status === 404) entry = { ok: false, bytes: 0, sha256: null, error: "not_locked" };
      else if (res.status !== 200) entry = { ok: false, bytes: 0, sha256: null, error: `http_${res.status}` };
      else {
        let parsed = null;
        try { parsed = JSON.parse(res.text); } catch { /* parse_fail below */ }
        if (parsed === null) entry = { ok: false, bytes: 0, sha256: null, error: "parse_fail" };
        else if (!parsed || typeof parsed !== "object" || !parsed.id) entry = { ok: false, bytes: 0, sha256: null, error: "no_id_field" };
        else {
          writes.push({ path: join(STATE_DIR, "capsules", id + ".json"), text: res.text });
          entry = { ok: true, bytes: Buffer.byteLength(res.text), sha256: sha256(res.text), error: null };
          okCount++;
        }
      }
    } catch (e) {
      entry = { ok: false, bytes: 0, sha256: null, error: "fetch_fail" };
    }
    // KEEP-LAST-GOOD: on any non-ok outcome we write nothing for that id —
    // an existing local copy stays untouched by construction. Mark it so the
    // manifest is honest about what the reader will actually see on disk.
    if (!entry.ok && hasLocal(id)) entry.kept_last_good = true;
    if (unlisted_ids.includes(id)) entry.unlisted = true;      // in the gist, not in mirror_config.json
    per_id[id] = entry;
  }

  // #92 + #106 — "ok" MEANS ALL, and the number is always shown.
  //   ok            = enumeration succeeded AND every known capsule fetched this run
  //   degraded      = at least one fetched, but not all of them (the live 3-of-4 case)
  //   awaiting_data = nothing fetched at all (never fabricate)
  // A failed enumeration can never be "ok": we do not know what we did not see.
  const need = targets.length;
  const have = okCount;
  const status = have === 0 ? "awaiting_data"
    : (enumeration.ok && have === need) ? "ok"
    : "degraded";
  const shortfall = Object.entries(per_id).filter(([, v]) => !v.ok).map(([k, v]) => `${k}:${v.error}`);

  const manifest = {
    date: localDate(now),
    status,
    // never render an unmeasured silence as a measured zero: if we could not list
    // the gist, we cannot claim the id set is complete, whatever the fetches said.
    low_confidence: !enumeration.ok,
    have, need,
    counter: `${have}/${need} capsules mirrored`,
    generated_at: now.toISOString(),
    fetched_at: now.toISOString(),
    config_source: cfg.config_source || "unknown",
    enumeration: { ok: enumeration.ok, ids: enumeration.ok ? discovered : null, error: enumeration.error, source: enumeration.source },
    // the whole point of #92: a capsule the config never heard of is now VISIBLE
    unlisted_ids,
    missing_from_gist,
    shortfall,
    note: !enumeration.ok
      ? `gist listing failed (${enumeration.error}) — mirrored the ${configured.length} configured id(s) only; a NEWLY LOCKED capsule would be invisible to this run. Not a measured "all".`
      : unlisted_ids.length
        ? `${unlisted_ids.length} capsule(s) in the gist are not in mirror_config.json (${unlisted_ids.join(", ")}) — they were mirrored anyway; add them to the config so a listing outage still sees them.`
        : null,
    per_id,
  };
  return { manifest, writes };
}

// ---------------------------------------------------------------------------
// selftest — baked mocks; zero network; no real state touched
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const cfg = { base: "https://example.test/raw/", ids: ["tok", "emb", "missing", "broken", "noid"], timeout_ms: 10 };
  const capsule = JSON.stringify({ id: "tok", doubts: [{ q: "q1", a: "a1" }] });
  const stub = async (url) => {
    if (url.endsWith("tok.json"))    return { status: 200, text: capsule };
    if (url.endsWith("emb.json"))    return { status: 200, text: JSON.stringify({ id: "emb" }) };
    if (url.endsWith("missing.json")) return { status: 404, text: "" };
    if (url.endsWith("broken.json")) return { status: 200, text: "{not json" };
    if (url.endsWith("noid.json"))   return { status: 200, text: JSON.stringify({ nope: 1 }) };
    throw new Error("unexpected url " + url);
  };
  const hasLocal = (id) => id === "broken";           // pretend broken.json existed locally before
  const { manifest, writes } = await pull(cfg, stub, hasLocal, new Date(2026, 6, 12, 7, 0, 0));

  assert("two good capsules produce writes", writes.length === 2 && writes.every(w => w.text.length > 0));
  assert("good capsule verbatim bytes", writes[0].text === capsule);
  // audit #92 — THIS ASSERTION USED TO ENCODE THE BUG.
  // It read `assert("manifest ok when ≥1 fetched", manifest.status === "ok")`, which
  // is exactly the defect: "ok" meant okCount > 0, so the mirror reported health while
  // silently under-supplying five downstream mechanisms (decoy map, lexicon, tape room,
  // derby seeds, set-piece rematches). This fixture fetches 2 of 5 — that is DEGRADED,
  // and the counter must be visible.
  assert("#92 — 2-of-5 fetched is DEGRADED, not 'ok' (the old assertion asserted the bug)",
    manifest.status === "degraded" && manifest.have === 2 && manifest.need === 5);
  assert("404 → not_locked (normal, not failure)", manifest.per_id.missing.error === "not_locked");
  assert("parse-fail flagged, nothing written", manifest.per_id.broken.error === "parse_fail" && !writes.find(w => w.path.includes("broken")));
  assert("KEEP-LAST-GOOD marked on existing local copy", manifest.per_id.broken.kept_last_good === true);
  assert("missing .id field rejected", manifest.per_id.noid.error === "no_id_field");
  assert("sha256 recorded for good fetch", typeof manifest.per_id.tok.sha256 === "string" && manifest.per_id.tok.sha256.length === 64);
  assert("envelope date local format", manifest.date === "2026-07-12");
  assert("fetch throw → fetch_fail, no crash", (await pull({ ...cfg, ids: ["boom"] }, async () => { throw new Error("net"); }, () => false)).manifest.per_id.boom.error === "fetch_fail");
  const all404 = await pull({ ...cfg, ids: ["missing"] }, stub, () => false);
  assert("all-miss → awaiting_data (never fabricate)", all404.manifest.status === "awaiting_data");
  // ...and the other half of #92: "ok" is reachable, but ONLY when the gist enumeration
  // SUCCEEDED and every capsule it lists actually landed. This needs a gist-shaped base
  // and an api stub, because a failed enumeration can never be "ok" (we cannot claim the
  // id set is complete when we could not list it).
  const gistCfg = {
    base: "https://gist.githubusercontent.com/nikhil/0123456789abcdef0123/raw/",
    api_base: "https://api.github.com/gists/",
    ids: ["tok"], timeout_ms: 10,
  };
  const gistStub = async (url) => {
    if (url.startsWith("https://api.github.com/gists/")) {
      return { status: 200, text: JSON.stringify({ files: { "tok.json": {}, "emb.json": {} } }) };
    }
    if (url.endsWith("tok.json")) return { status: 200, text: capsule };
    if (url.endsWith("emb.json")) return { status: 200, text: JSON.stringify({ id: "emb" }) };
    throw new Error("unexpected url " + url);
  };
  const allGood = await pull(gistCfg, gistStub, () => false);
  assert("#92 — 'ok' IS reachable when enumeration succeeds and have === need",
    allGood.manifest.status === "ok" && allGood.manifest.have === allGood.manifest.need &&
    allGood.manifest.low_confidence === false);
  assert("#92 — ENUMERATION FINDS A CAPSULE THE CONFIG NEVER LISTED (the whole point)",
    allGood.manifest.need === 2 && allGood.manifest.enumeration.ids.includes("emb"));
  // A failed enumeration must NEVER read "ok", however well the fetches went.
  const blindStub = async (url) => (url.startsWith("https://api.github.com/")
    ? { status: 403, text: "rate limited" }
    : { status: 200, text: capsule });
  const blind = await pull(gistCfg, blindStub, () => false);
  assert("#92 — a rate-limited enumeration is never 'ok', and says so via low_confidence",
    blind.manifest.status !== "ok" && blind.manifest.low_confidence === true);
  // atomic write check in a temp dir
  const os = await import("node:os");
  const tmpBase = join(os.tmpdir(), "mirror-selftest-" + Date.now());
  const p = join(tmpBase, "capsules", "tok.json");
  writeAtomicText(p, capsule);
  assert("atomic write lands (temp→rename)", existsSync(p) && readFileSync(p, "utf8") === capsule);
  assert("config fallback to DEFAULTS on missing file", loadConfig("__no_such__").ids.length === 4);

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "run").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  const cfg = loadConfig();
  const hasLocal = (id) => existsSync(join(STATE_DIR, "capsules", id + ".json"));
  const { manifest, writes } = await pull(cfg, defaultFetch, hasLocal, new Date());
  for (const w of writes) writeAtomicText(w.path, w.text);
  writeAtomic(join(STATE_DIR, "mirror_manifest.json"), manifest);
  // The console denominator is the MANIFEST's need (enumeration-aware), never the
  // configured floor — cfg.ids.length is 4 forever, so a fifth locked capsule would
  // have printed "5/4 capsules mirrored" while the manifest itself was right. (7 Aug 2026)
  console.log(`mirror: ${manifest.counter} · ${manifest.status} (${manifest.shortfall.join(", ") || "all ok"}) → ${join(STATE_DIR, "mirror_manifest.json")}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { pull, loadConfig, sha256 };
