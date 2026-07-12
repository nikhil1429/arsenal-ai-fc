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
// INPUT:  dressing-room/state/mirror_config.json (canon, committed)
// OUTPUT: dressing-room/state/capsules/<id>.json  (verbatim fetched bytes)
//         dressing-room/state/mirror_manifest.json {date,status,generated_at,
//           fetched_at, per_id:{<id>:{ok,bytes,sha256,error}}}
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
  ids: ["tokenization", "embeddings", "inference", "context"],
  timeout_ms: 15000,
};

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

function loadConfig(path = CFG_PATH) {
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      return {
        base: typeof j.base === "string" ? j.base : DEFAULTS.base,
        ids: Array.isArray(j.ids) && j.ids.length ? j.ids.map(String) : DEFAULTS.ids.slice(),
        timeout_ms: typeof j.timeout_ms === "number" ? j.timeout_ms : DEFAULTS.timeout_ms,
      };
    }
  } catch { /* malformed config → defaults */ }
  return { base: DEFAULTS.base, ids: DEFAULTS.ids.slice(), timeout_ms: DEFAULTS.timeout_ms };
}

function writeAtomicText(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
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

// pure core: fetch every id, validate, keep-last-good. Returns {manifest, writes:[{path,text}]}
async function pull(cfg, fetchFn, hasLocal, now = new Date()) {
  const per_id = {};
  const writes = [];
  let okCount = 0;
  for (const id of cfg.ids) {
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
    per_id[id] = entry;
  }
  const manifest = {
    date: localDate(now),
    status: okCount > 0 ? "ok" : "awaiting_data",
    low_confidence: false,
    generated_at: now.toISOString(),
    fetched_at: now.toISOString(),
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
  assert("manifest ok when ≥1 fetched", manifest.status === "ok");
  assert("404 → not_locked (normal, not failure)", manifest.per_id.missing.error === "not_locked");
  assert("parse-fail flagged, nothing written", manifest.per_id.broken.error === "parse_fail" && !writes.find(w => w.path.includes("broken")));
  assert("KEEP-LAST-GOOD marked on existing local copy", manifest.per_id.broken.kept_last_good === true);
  assert("missing .id field rejected", manifest.per_id.noid.error === "no_id_field");
  assert("sha256 recorded for good fetch", typeof manifest.per_id.tok.sha256 === "string" && manifest.per_id.tok.sha256.length === 64);
  assert("envelope date local format", manifest.date === "2026-07-12");
  assert("fetch throw → fetch_fail, no crash", (await pull({ ...cfg, ids: ["boom"] }, async () => { throw new Error("net"); }, () => false)).manifest.per_id.boom.error === "fetch_fail");
  const all404 = await pull({ ...cfg, ids: ["missing"] }, stub, () => false);
  assert("all-miss → awaiting_data (never fabricate)", all404.manifest.status === "awaiting_data");
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
  const ok = Object.values(manifest.per_id).filter(x => x.ok).length;
  console.log(`mirror: ${ok}/${cfg.ids.length} capsules mirrored (${Object.entries(manifest.per_id).filter(([,v]) => !v.ok).map(([k,v]) => `${k}:${v.error}`).join(", ") || "all ok"}) → ${join(STATE_DIR, "mirror_manifest.json")}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { pull, loadConfig, sha256 };
