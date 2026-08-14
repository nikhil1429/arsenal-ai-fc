#!/usr/bin/env node
// ============================================================================
// archive_audit.mjs · ARSENAL AI FC — THE 2046 READER, REHEARSED EARLY
// ----------------------------------------------------------------------------
// WHAT THIS IS. Not a test of archivist.mjs. The archive's entire justification
//   for living outside the repo is one sentence — "verifiable from its own
//   README alone" — and until this file existed, NOTHING tested that sentence.
//   `archivist.mjs selftest` checks the archive using archivist's OWN canon(),
//   sha256Hex(), istStamp() and buildRecord(): if the canonical-bytes rule were
//   subtly wrong, records would be written wrong, the test would compute the
//   same wrong expectation, the suite would be GREEN, and a reader in 2046
//   following the README would get a mismatch and conclude the archive is
//   corrupt. A claim with no check is a hypothesis, and this repo's own law
//   says an unrun system is a hypothesis. So this organ IS that future reader:
//   it re-implements the rule from the published documents and audits the
//   archive against its own contract rather than against the code that wrote it.
//
// HIS DECISION (ARCHIVE__DAY_ONE_SPEC.md §16, 15 Aug 2026) — EXACTLY FOUR
//   CHECKS, and the filter is "does this test the DOCUMENT or the DATA?":
//     (a) INDEPENDENT FIXITY   — every record's sha256 recomputed from the
//         README's written recipe, by code that has never seen archivist.mjs.
//     (b) FIELD ORDER          — on EVERY record. The spec fixes field order so
//         that a human diff of two archives is readable; nothing else checks
//         more than a sample.
//     (c) IST PARTITION        — on EVERY record: it must sit in the day file
//         its own local clock names, AND ts_local must be the SAME INSTANT as
//         ts_utc, not a second clock free to drift.
//     (d) SCHEMA CONFORMANCE   — on EVERY record, with a GENERIC JSON-Schema
//         validator written here. This proves SCHEMA/v1.json is a sufficient
//         DESCRIPTION of the records, not merely that the writer agrees with
//         itself.
//   DELIBERATELY NOT HERE: chain walking is `verify`'s job; multiplicity is
//   `reconcile`'s job. Duplicating them is maintenance with no value. The three
//   laws that make those two checks HARD, and that a future reader will
//   re-derive wrongly if they are not written down, sit beside the code where
//   someone would add them (search "DELIBERATELY NOT HERE").
//
// THE IMPORT RULE — READ THIS BEFORE YOU "REMOVE THE DUPLICATION".
//   The duplication in this file is the POINT. canon(), the sha256 recipe, the
//   +05:30 arithmetic and the schema validator are all re-implemented from the
//   archive's own README and SCHEMA/v1.json, deliberately, so that the two
//   implementations can DISAGREE. An auditor that imports the thing it audits
//   proves only that a function equals itself. THEREFORE: the only permitted
//   imports in this file are Node built-ins (`node:*`). No `scripts/*` import,
//   ever — not archivist.mjs, not a shared util, not "just the constants".
//   This is not a style rule; it is the whole guarantee. `guard` enforces it
//   mechanically on this file's own bytes, and the selftest proves the guard
//   BITES by running a planted copy in a child process — because a guard tested
//   in-process by the code it guards is exactly the failure class this archive
//   has already shipped twice (see LAW 4, below).
//
// WHAT IT WRITES — NOTHING INTO THE ARCHIVE (§16.2.7). archivist.mjs remains the
//   SOLE WRITER of $ARSENAL_ARCHIVE; a second writer would produce a chain that
//   VERIFIES while being wrong about the order of his life. This organ REPORTS.
//   Its one write is its own verdict, journalled to
//   `dressing-room/state/archive_audit.jsonl` in the REPO — and this file is
//   that lane's SOLE WRITER. That location is §16.5's own escape hatch ("have
//   archivist.mjs write the row on the auditor's behalf"), taken through the
//   mechanism that already exists: the archivist TAILS every *.jsonl under
//   dressing-room/, so the verdict reaches the archive as lane `archive_audit`,
//   hash-chained, written by the sole writer, with no second door cut into the
//   bag. The record of WHEN THIS LAST RAN therefore survives in both places,
//   which is what §16.2.3's 90-day rule depends on.
//
// CADENCE (§16.2.3) — monthly is the FLOOR, not the trigger. What this organ
//   tests only changes when one of five things changes, so a passing run is
//   part of the DEFINITION OF DONE for any change to: the archive's README
//   recipe · SCHEMA/v1.json · canon() · istStamp() · buildRecord(). Nothing
//   else in the archive can make the README insufficient. And if this has not
//   run in 90 days the watchman raises it, because an auditor that silently
//   stops is worse than none — the green memory persists.
//
// MODES: run · selftest · guard
//   run       — the full pass over every record in the live archive.
//   selftest  — hermetic: the known-answer vectors, the validator, the guard.
//   guard     — the independence door, alone, exiting 0/1. It is a mode ONLY so
//               the selftest can prove it bites FROM OUTSIDE this process.
// ============================================================================

// Node built-ins ONLY — see THE IMPORT RULE above. `guard` fails this file if
// this list ever grows a specifier that does not start with "node:".
import { readFileSync, readdirSync, existsSync, appendFileSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname, relative, resolve, sep } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const SELF = fileURLToPath(import.meta.url);

// The archive root, from the env var the README names, defaulting to the path
// the spec names. Read from process.env rather than node:os.homedir() so this
// file stays inside the four modules §16.5 lists — and because %USERPROFILE% is
// literally what the documents say.
const archiveRoot = () =>
  process.env.ARSENAL_ARCHIVE || join(process.env.USERPROFILE || process.env.HOME || ".", "CyborgArchive");

// ── THE RECIPE, RE-IMPLEMENTED FROM THE README ───────────────────────────────
// The README's own words: "take the record, remove the sha256 and prev_sha256
// fields; serialise what remains with keys sorted and no whitespace (JCS-style,
// UTF-8); SHA-256 that." That paragraph, and nothing else, is what the next
// three lines are. Keys sort in UTF-16 code-unit order — JavaScript's default
// Array#sort on strings — which is what JCS specifies. JSON.stringify's number
// and string escaping rules ARE the JCS rules, so this is a sort and a concat.
// If you find yourself reaching for a canonicalisation library here, don't: a
// 2046 reader must be able to re-derive this from the README in an hour, and
// that is the property being tested.
const canon = (v) => {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
};
const sha256Hex = (s) => createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex");
const recordHash = (rec) => { const { sha256: _s, prev_sha256: _p, ...body } = rec; return sha256Hex(canon(body)); };

// README: "the date in the path is the INDIAN day (Asia/Kolkata, UTC+05:30)".
// The number comes from the DOCUMENT, not from a tz lookup and not from the
// record's own stated offset — a reader with no ICU data must get the same
// answer, and an offset read out of the record could never disagree with it.
const IST_OFFSET_MIN = 330;
const istDay = (iso) => {
  const t = Date.parse(String(iso));
  return Number.isFinite(t) ? new Date(t + IST_OFFSET_MIN * 60000).toISOString().slice(0, 10) : null;
};

// SCHEMA/v1.json fixes this order, and the README says why: so that a human
// diff of two archives is readable. Written out here rather than derived from
// the schema's `required` array, because `required` is a SET and this is a
// SEQUENCE — deriving one from the other would silently stop testing the order.
const FIELDS = [
  "rid", "sha256", "prev_sha256", "seq", "v", "ts_utc", "ts_local", "tz", "recorded_at",
  "valid_from", "valid_to", "lane", "surface", "source", "modality", "session_id", "event_id",
  "tier", "moment", "payload", "derived_from", "agent", "backfilled",
];

// ── THE KNOWN-ANSWER TEST VECTORS (§16.2.4a / §16.3) ─────────────────────────
// Published verbatim in the archive's README beside these hashes, so that ANY
// future implementation, in ANY language, on ANY machine, can check ITSELF
// before trusting itself on 34,000 records. This is how crypto standards make a
// spec self-sufficient, and it does more for the 2046 claim than any amount of
// JavaScript. They are SYNTHETIC on purpose: a `rebuild` re-mints `rid` and
// `recorded_at`, and a vector that can change is not a vector.
//   V1 a plain live-shaped record, every field populated.
//   V2 THE IMPORTANT ONE — Devanagari + emoji + CRLF + tabs + padding. An
//      implementation that Unicode-normalises, trims whitespace or rewrites
//      line endings will fail this one and pass the other two.
//   V3 null clocks (so the day must come from recorded_at), a populated moment,
//      a nested payload, a non-integer number, and a relaxed tier.
// FROZEN. If your implementation does not reproduce these three hashes, your
// implementation is wrong, not the vectors.
export const TEST_VECTORS = [
  { n: "V1", sha256: "086f08ee288ff00e5b930052d12eb85a8e622baa8b581eb30f8af305fce87696", line: String.raw`{"rid":"01M000000000000000000000V1","sha256":"086f08ee288ff00e5b930052d12eb85a8e622baa8b581eb30f8af305fce87696","prev_sha256":null,"seq":1,"v":1,"ts_utc":"2026-08-14T04:17:32.123Z","ts_local":"2026-08-14T09:47:32.123+05:30","tz":"Asia/Kolkata","recorded_at":"2026-08-14T04:17:33.001Z","valid_from":null,"valid_to":null,"lane":"afferent","surface":"claude-code","source":"claude-code","modality":"code","session_id":"sess-abc-123","event_id":"evt-1","tier":"private","moment":null,"payload":{"text":"hello","v":3},"derived_from":null,"agent":null,"backfilled":false}` },
  { n: "V2", sha256: "ab255f4501a8c07a487bb5b82be1339b5c5bbcd66ddb81492a951a3e26a10922", line: String.raw`{"rid":"01M000000000000000000000V2","sha256":"ab255f4501a8c07a487bb5b82be1339b5c5bbcd66ddb81492a951a3e26a10922","prev_sha256":"0000000000000000000000000000000000000000000000000000000000000000","seq":2,"v":1,"ts_utc":"2026-08-14T20:08:14.198Z","ts_local":"2026-08-15T01:38:14.198+05:30","tz":"Asia/Kolkata","recorded_at":"2026-08-14T20:09:00.000Z","valid_from":null,"valid_to":null,"lane":"afferent","surface":"claude-code","source":"claude-code","modality":"code","session_id":null,"event_id":null,"tier":"private","moment":null,"payload":{"text":"  नमस्ते  🙏\r\n\ttrailing  "},"derived_from":null,"agent":null,"backfilled":true}` },
  { n: "V3", sha256: "7fa088c355802a0a92bfc7ed58f9130a2e7190e9bd1185c91830e7134f4de8ae", line: String.raw`{"rid":"01M000000000000000000000V3","sha256":"7fa088c355802a0a92bfc7ed58f9130a2e7190e9bd1185c91830e7134f4de8ae","prev_sha256":"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff","seq":3,"v":1,"ts_utc":null,"ts_local":null,"tz":null,"recorded_at":"2026-08-14T21:00:00.000Z","valid_from":null,"valid_to":null,"lane":"reps_log","surface":"system","source":"reps_log","modality":null,"session_id":null,"event_id":null,"tier":"public","moment":{"sprint_task":"1-04 Hallucinations","forge_step":4,"forge_concept":"hallucinations","readiness":{"verdict":"GREEN","day":"2026-08-04"},"focus_app":null,"cwd":"arsenal-ai-fc"},"payload":{"nested":{"b":2,"a":[1,"x",null]},"n":1.5},"derived_from":null,"agent":null,"backfilled":true}` },
];

// ── LAW 3 · THE LEXICON IS A LOG, NOT A TABLE ────────────────────────────────
// Attached here because this is the DOCUMENT-READING code, and the LEXICON is
// the next document a future reader will want audited (it is the archive's
// Representation Information — without it an analysis does not fail loudly, it
// comes out quietly wrong). When you add that check: a term's state is its LAST
// ROW, and a RETIREMENT row legitimately carries no `definition` and no
// `source`. FOLD BEFORE JUDGING. The review harness read terms.jsonl as a table
// and reported every retired v1 definition as a broken citation — the checker
// was wrong about the shape, not the dictionary wrong about the world.
// Parses the vectors back OUT of the archive's published README. This is the
// leg that closes the loop: it proves the README carries what an independent
// implementation needs, rather than proving this file agrees with itself.
export function parseReadmeVectors(readmeText) {
  const out = [];
  const lines = String(readmeText).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^sha256 = ([0-9a-f]{64})\s*$/);
    if (!m) continue;
    let j = i + 1;
    while (j < lines.length && !lines[j].trim()) j++;
    if (j < lines.length) out.push({ sha256: m[1], line: lines[j] });
  }
  return out;
}

// ── A GENERIC JSON-SCHEMA VALIDATOR (draft-07 subset) ────────────────────────
// Written fresh, NOT copied from archivist's — that separation is the whole
// point of check (d). It is generic: it reads SCHEMA/v1.json as a DOCUMENT and
// applies whatever that document says, so a change to the schema changes what
// is enforced without a line changing here.
// THE KEYWORD GUARD BELOW IS LOAD-BEARING. A validator that silently ignores a
// keyword it does not implement reports GREEN on records the schema rejects —
// which is the "shipped green and dead" class this archive has already paid for
// twice. So the schema is walked FIRST and any keyword outside this set is a
// hard failure that names itself, rather than a silent pass.
const SUPPORTED = new Set([
  "$schema", "$id", "title", "description", "default", "examples",
  "type", "enum", "const", "required", "properties", "additionalProperties",
  "items", "minimum", "maximum", "minLength", "maxLength", "pattern",
  "if", "then", "else",
]);
const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const typeName = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);
const isType = (v, t) =>
  t === "null" ? v === null
    : t === "array" ? Array.isArray(v)
      : t === "object" ? isPlainObject(v)
        : t === "integer" ? Number.isInteger(v)
          : t === "number" ? typeof v === "number"
            : t === "string" ? typeof v === "string"
              : t === "boolean" ? typeof v === "boolean"
                : false;
const sameValue = (a, b) => canon(a) === canon(b);

export function unsupportedKeywords(schema, path = "(root)", out = []) {
  if (!isPlainObject(schema)) return out;
  for (const k of Object.keys(schema)) if (!SUPPORTED.has(k)) out.push(`${path}: ${k}`);
  for (const k of ["if", "then", "else", "items", "additionalProperties"]) {
    if (isPlainObject(schema[k])) unsupportedKeywords(schema[k], `${path}.${k}`, out);
  }
  if (isPlainObject(schema.properties)) {
    for (const [p, sub] of Object.entries(schema.properties)) unsupportedKeywords(sub, `${path}.properties.${p}`, out);
  }
  return out;
}

export function validate(schema, value, path = "(root)", errs = []) {
  if (schema === true || schema === undefined) return errs;
  if (schema === false) { errs.push(`${path}: schema false — nothing may validate here`); return errs; }
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => isType(value, t))) errs.push(`${path}: expected type ${JSON.stringify(schema.type)}, got ${typeName(value)}`);
  }
  if (schema.enum !== undefined && !schema.enum.some((e) => sameValue(e, value))) {
    errs.push(`${path}: ${JSON.stringify(value)} is not one of ${JSON.stringify(schema.enum)}`);
  }
  if (schema.const !== undefined && !sameValue(schema.const, value)) {
    errs.push(`${path}: ${JSON.stringify(value)} !== const ${JSON.stringify(schema.const)}`);
  }
  if (typeof value === "string") {
    // JSON Schema counts CHARACTERS, not UTF-16 code units — a record whose id
    // held an astral character would otherwise measure long by one per emoji.
    if (schema.minLength !== undefined && [...value].length < schema.minLength) errs.push(`${path}: shorter than minLength ${schema.minLength}`);
    if (schema.maxLength !== undefined && [...value].length > schema.maxLength) errs.push(`${path}: longer than maxLength ${schema.maxLength}`);
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) errs.push(`${path}: does not match /${schema.pattern}/`);
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) errs.push(`${path}: below minimum ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) errs.push(`${path}: above maximum ${schema.maximum}`);
  }
  if (isPlainObject(value)) {
    for (const k of schema.required || []) if (!(k in value)) errs.push(`${path}: missing required property "${k}"`);
    const props = isPlainObject(schema.properties) ? schema.properties : {};
    for (const [k, v] of Object.entries(value)) {
      if (props[k] !== undefined) validate(props[k], v, `${path}.${k}`, errs);
      else if (schema.additionalProperties === false) errs.push(`${path}: additional property "${k}" is not allowed`);
      else if (isPlainObject(schema.additionalProperties)) validate(schema.additionalProperties, v, `${path}.${k}`, errs);
    }
  }
  if (Array.isArray(value) && schema.items !== undefined) {
    value.forEach((v, i) => validate(schema.items, v, `${path}[${i}]`, errs));
  }
  // draft-07 if/then/else. v1.json carries §4.5's derived-record reservation as
  // an if/then: a record with an ARRAY derived_from must also carry valid_from,
  // valid_to (which may be null — an open interval is not a missing value) and
  // recorded_at. A raw record has derived_from: null, the `if` does not apply,
  // and `then` is correctly never evaluated.
  if (schema.if !== undefined) {
    const applies = validate(schema.if, value, path, []).length === 0;
    if (applies && schema.then !== undefined) validate(schema.then, value, path, errs);
    if (!applies && schema.else !== undefined) validate(schema.else, value, path, errs);
  }
  return errs;
}

// ── THE INDEPENDENCE GUARD (§16.2.6) ─────────────────────────────────────────
// Necessary because without it the independence rots the FIRST time someone
// tidies up the duplication. It is a whole-file rule, not a grep for one name:
// ANY specifier that is not a Node built-in fails — a local module, a shared
// util, an npm package. Comment lines are skipped so this file may discuss the
// forbidden import in prose (as its header does) without accusing itself; a
// checker that cries wolf costs exactly as much as one that sleeps.
export function independenceViolations(source) {
  const out = [];
  const lines = String(source).split(/\r?\n/);
  const bad = (spec) => !/^node:/.test(spec);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const t = raw.trim();
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) continue;
    const hits = [];
    let m;
    const statik = /^\s*(?:import|export)\b[^;]*?\bfrom\s*["']([^"']+)["']/.exec(raw);
    if (statik) hits.push(statik[1]);
    const bare = /^\s*import\s+["']([^"']+)["']/.exec(raw);
    if (bare) hits.push(bare[1]);
    const dyn = /\bimport\s*\(\s*["']([^"']+)["']/g;
    while ((m = dyn.exec(raw)) !== null) hits.push(m[1]);
    const req = /\brequire\s*\(\s*["']([^"']+)["']/g;
    while ((m = req.exec(raw)) !== null) hits.push(m[1]);
    for (const spec of hits) if (bad(spec)) out.push({ line: i + 1, spec, text: t.slice(0, 120) });
  }
  return out;
}
const guardSelf = () => independenceViolations(readFileSync(SELF, "utf8"));

// ── READING THE ARCHIVE ──────────────────────────────────────────────────────
// LAW 6 · A LIVE WRITER MAKES LIVE EQUALITY UNSTABLE, AND THIS ORGAN IS WALKING
// A TREE THAT IS STILL BEING APPENDED TO. Measured during the 15 Aug review, on
// a healthy archive, three consecutive runs of a source-vs-archive check: 23/1,
// 24/0, 23/1. The organism appends rows every minute, so demanding zero lag is
// demanding a running system hold still, and a green result is just a quiet
// instant. TWO CONSEQUENCES, both live here:
//   1. This organ NEVER compares the archive to its sources. That comparison
//      belongs to `reconcile`, which snapshots the sources first.
//   2. The only way a live writer can touch THIS walk is a torn final line in a
//      day file the archivist is appending to at that exact moment. A torn tail
//      reported as a defect is a phantom, so the file is re-read once before a
//      trailing parse failure is believed. Everything else here is a prefix
//      read, which on an append-only file is always consistent.
function readRecords(file) {
  const parse = (text) => {
    const rows = [];
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      try { rows.push({ rec: JSON.parse(lines[i]), lineNo: i + 1 }); }
      catch { rows.push({ rec: null, lineNo: i + 1, torn: i >= lines.length - 2 }); }
    }
    return rows;
  };
  let rows = parse(readFileSync(file, "utf8"));
  if (rows.some((r) => r.rec === null && r.torn)) rows = parse(readFileSync(file, "utf8"));
  return rows;
}

function dayFilesOf(dataDir) {
  const out = [];
  const walk = (d) => {
    let es = [];
    try { es = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of es.sort((a, b) => a.name.localeCompare(b.name))) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".jsonl")) out.push(p);
    }
  };
  walk(dataDir);
  return out;
}

// ── THE PASS ─────────────────────────────────────────────────────────────────
// DELIBERATELY NOT HERE (1) · MULTIPLICITY, and the law that makes it hard.
//   "No lane holds the same payload twice" is WRONG, and the review harness
//   asserted it for three rounds. salience_ledger's SOURCE genuinely contains
//   ten byte-identical payload groups (measured: 8,945 rows, 10 groups,
//   multiplicities 2-4) — real events that produced identical rows — and LAW 3
//   forbids the writer to drop either copy. The law that actually separates a
//   defect from faithful capture is MULTIPLICITY: the archive must hold a
//   payload exactly as many times as its source does, and a payload the source
//   no longer holds at all is superseded history, not surplus. That law lives in
//   `reconcile`. DO NOT ADD A UNIQUENESS CHECK HERE.
// DELIBERATELY NOT HERE (2) · THE CHAIN. `verify` walks it. Note what the chain
//   cannot do, because it is the reason `reconcile` exists at all: duplicates
//   appended in seq order chain PERFECTLY. A valid chain is not a correct
//   archive.
export function auditArchive(root, opts = {}) {
  const started = Date.now();
  const dataDir = join(root, "data");
  const schemaPath = join(root, "SCHEMA", "v1.json");
  const readmePath = join(root, "README.md");

  const res = {
    root, ok: false, records: 0, files: 0, lanes: 0,
    vectors: { embedded: { checked: 0, failed: 0 }, readme: { checked: 0, failed: 0, present: false } },
    schema_keywords_unsupported: [],
    checks: {
      fixity: { checked: 0, failed: 0, examples: [] },
      field_order: { checked: 0, failed: 0, examples: [] },
      ist_partition: { checked: 0, failed: 0, examples: [] },
      schema: { checked: 0, failed: 0, examples: [] },
    },
    unparseable: { count: 0, examples: [] },
    fatal: [],
  };
  const note = (bucket, msg) => { bucket.failed++; if (bucket.examples.length < 5) bucket.examples.push(msg); };

  // THE SELF-CHECK BEFORE THE 34,000. §16.2.4a's whole argument: an
  // implementation checks itself against the published vectors BEFORE it is
  // allowed to have an opinion about the archive.
  for (const v of TEST_VECTORS) {
    res.vectors.embedded.checked++;
    const rec = JSON.parse(v.line);
    if (recordHash(rec) !== v.sha256 || rec.sha256 !== v.sha256) res.vectors.embedded.failed++;
  }
  if (res.vectors.embedded.failed) {
    res.fatal.push("this implementation does not reproduce the published known-answer vectors — it has no standing to judge the archive");
    return res;
  }

  if (!existsSync(dataDir)) { res.fatal.push(`no archive at ${root} (data/ missing)`); return res; }
  if (!existsSync(schemaPath)) { res.fatal.push("SCHEMA/v1.json missing — the records have no published description at all"); return res; }

  // The README leg of the loop: the vectors must be READABLE OUT OF THE
  // PUBLISHED DOCUMENT, byte for byte, or the document is not sufficient.
  if (existsSync(readmePath)) {
    res.vectors.readme.present = true;
    const found = parseReadmeVectors(readFileSync(readmePath, "utf8"));
    const byHash = new Map(found.map((f) => [f.sha256, f.line]));
    for (const v of TEST_VECTORS) {
      res.vectors.readme.checked++;
      const line = byHash.get(v.sha256);
      if (line === undefined) { res.vectors.readme.failed++; res.fatal.push(`README publishes no vector for ${v.n} (${v.sha256.slice(0, 12)}…)`); continue; }
      if (line !== v.line) { res.vectors.readme.failed++; res.fatal.push(`README's ${v.n} body differs from the frozen vector — one of the two has drifted`); continue; }
      if (recordHash(JSON.parse(line)) !== v.sha256) { res.vectors.readme.failed++; res.fatal.push(`README's ${v.n} does not hash to its own published sha256`); }
    }
  } else {
    res.fatal.push("README.md missing — the archive's only self-description is gone, which is the exact failure this organ exists to catch");
  }

  const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
  res.schema_keywords_unsupported = unsupportedKeywords(schema);
  if (res.schema_keywords_unsupported.length) {
    res.fatal.push(`SCHEMA/v1.json uses keyword(s) this validator does not implement: ${res.schema_keywords_unsupported.join(", ")} — check (d) would be silently weaker than the document it claims to enforce`);
  }

  const lanes = new Set();
  for (const file of dayFilesOf(dataDir)) {
    res.files++;
    const parts = relative(dataDir, file).split(sep);       // lane/YYYY/MM/DD.jsonl
    if (parts.length < 4) { res.fatal.push(`unexpected path shape under data/: ${relative(root, file)}`); continue; }
    const lane = parts[0];
    const fileDay = `${parts[1]}-${parts[2]}-${parts[3].replace(/\.jsonl$/, "")}`;
    lanes.add(lane);

    for (const { rec, lineNo } of readRecords(file)) {
      if (rec === null) {
        res.unparseable.count++;
        if (res.unparseable.examples.length < 5) res.unparseable.examples.push(`${relative(root, file)}:${lineNo}`);
        continue;
      }
      res.records++;
      const where = `${lane}#${rec.seq} (${relative(root, file)}:${lineNo})`;

      // (a) INDEPENDENT FIXITY — recomputed from the README's recipe, by code
      //     that has never imported archivist.mjs. This is the check the whole
      //     "verifiable from its own README alone" sentence rests on.
      res.checks.fixity.checked++;
      if (recordHash(rec) !== rec.sha256) note(res.checks.fixity, `${where}: stored ${String(rec.sha256).slice(0, 16)}… recomputes to ${recordHash(rec).slice(0, 16)}…`);

      // (b) FIELD ORDER, ON EVERY RECORD. JSON.parse preserves on-disk key order
      //     for every non-integer-like key, and none of the 23 field names are
      //     integer-like, so Object.keys IS the file's order here.
      res.checks.field_order.checked++;
      const keys = Object.keys(rec);
      if (keys.length !== FIELDS.length || keys.some((k, i) => k !== FIELDS[i])) {
        note(res.checks.field_order, `${where}: ${keys.join(",")}`);
      }

      // (c) IST PARTITION, ON EVERY RECORD — two separate claims:
      //     the record sits in the day file its own clock names (falling back to
      //     recorded_at when ts_utc is null, exactly as the writer does), AND
      //     ts_local is the SAME INSTANT as ts_utc rather than a second clock
      //     free to drift. The second is why ts_local can be trusted as "he
      //     wrote this at 3am" twenty years from now.
      res.checks.ist_partition.checked++;
      const day = istDay(rec.ts_utc || rec.recorded_at);
      if (day !== fileDay) note(res.checks.ist_partition, `${where}: ts ${rec.ts_utc || rec.recorded_at} → IST ${day} but filed under ${fileDay}`);
      else if (rec.ts_local && rec.ts_utc && Math.abs(Date.parse(rec.ts_local) - Date.parse(rec.ts_utc)) > 1) {
        note(res.checks.ist_partition, `${where}: ts_local ${rec.ts_local} is a DIFFERENT INSTANT from ts_utc ${rec.ts_utc}`);
      }

      // (d) SCHEMA CONFORMANCE, ON EVERY RECORD, against SCHEMA/v1.json read as
      //     a document by a generic validator. It proves the published schema is
      //     a sufficient DESCRIPTION, not merely that the writer agrees with
      //     itself.
      //     LAW 2 · "NO BACKFILLED RECORD CARRIES A MOMENT" IS WRONG, and it is
      //     the rule someone will want to add to this schema. A v3 hook row
      //     stamps its own `moment` at capture time and that survives a
      //     backfill. Measured: 23 backfilled records carried a moment, all 23
      //     came from their own payload, ZERO were invented. The right law is
      //     the archivist never INVENTS a moment — stating it the strict way
      //     would force the writer to throw away the most valuable kind of
      //     moment there is.
      res.checks.schema.checked++;
      const errs = validate(schema, rec, "record", []);
      if (errs.length) note(res.checks.schema, `${where}: ${errs.slice(0, 3).join(" · ")}`);
    }
  }

  res.lanes = lanes.size;
  res.ms = Date.now() - started;
  const failed = Object.values(res.checks).reduce((a, c) => a + c.failed, 0);
  res.ok = res.fatal.length === 0 && failed === 0 && res.unparseable.count === 0;
  if (opts.requireRecords !== false && res.records === 0 && res.fatal.length === 0) {
    res.fatal.push("the archive holds ZERO records — a green verdict over nothing is the loudest kind of false green");
    res.ok = false;
  }
  return res;
}

// ── THE VERDICT, JOURNALLED ──────────────────────────────────────────────────
// LAW 5 · "NO NEW FILE SINCE THE SEAL" IS NOT "THE SEAL IS CURRENT", and this is
// where a future reader will want to add a seal check to the verdict. Records
// are appended to EXISTING day files, so a bag goes stale with ZERO new files —
// measured during the review: added 0, changed 5, i.e. STALE, while a
// new-files-only check called it CURRENT and went red against a correct organ.
// Ask sealState()'s three numbers (added · changed · removed) or do not ask.
// That check belongs to `archivist.mjs status`; it is named here so nobody
// re-derives the weak version inside this organ.
const REPO_STATE = join(dirname(dirname(SELF)), "dressing-room", "state");
const JOURNAL = join(REPO_STATE, "archive_audit.jsonl");

// THE JOURNAL IS TRACKED IN A PUBLIC REPO, SO IT MUST NEVER CARRY HIS WORDS —
// and that is a property of what the four checks CAN report, not a filter bolted
// on afterwards. Walk the failure messages: fixity prints hashes; field order
// prints field NAMES; the partition check prints timestamps; and the validator
// only ever prints a VALUE for `enum` and `const`, which in v1.json are `tier`
// and `v`. `payload` carries no schema constraints at all, so no value inside it
// is ever formatted into an error. The archive stays private (his 14 Aug ruling);
// the verdict about it is machine bookkeeping and is safe in the open. If you
// ever add a check that quotes a payload, this stops being true — re-read this
// line before you do.
function journal(res) {
  // The VERIFIER copy inside the bag has no repo around it. Say so out loud
  // rather than silently skipping — a verdict that vanishes is how the 90-day
  // rule ends up watching a lane that never gets written.
  if (!existsSync(REPO_STATE)) return { written: false, why: `no repo state dir at ${REPO_STATE} (running from outside the repo — the verdict is printed, not journalled)` };
  const row = {
    ts: new Date().toISOString(),
    ok: res.ok,
    root: res.root,
    records: res.records, files: res.files, lanes: res.lanes, ms: res.ms,
    vectors: res.vectors,
    checks: Object.fromEntries(Object.entries(res.checks).map(([k, c]) => [k, { checked: c.checked, failed: c.failed }])),
    unparseable: res.unparseable.count,
    schema_keywords_unsupported: res.schema_keywords_unsupported,
    fatal: res.fatal,
    examples: Object.entries(res.checks).flatMap(([k, c]) => c.examples.map((e) => `${k}: ${e}`)).slice(0, 10),
  };
  try {
    mkdirSync(REPO_STATE, { recursive: true });
    appendFileSync(JOURNAL, JSON.stringify(row) + "\n", "utf8");
    return { written: true, path: JOURNAL };
  } catch (e) { return { written: false, why: String(e && e.message || e) }; }
}

function report(res, j) {
  const L = console.log;
  L(`\nTHE ARCHIVE AUDIT · ${res.root}`);
  L(`  ${res.records} record(s) · ${res.lanes} lane(s) · ${res.files} day file(s) · ${res.ms} ms`);
  L(`  known-answer vectors: ${res.vectors.embedded.checked - res.vectors.embedded.failed}/${res.vectors.embedded.checked} reproduced by this implementation` +
    (res.vectors.readme.present ? ` · ${res.vectors.readme.checked - res.vectors.readme.failed}/${res.vectors.readme.checked} read back out of the archive's own README` : " · README ABSENT"));
  for (const [name, c] of Object.entries(res.checks)) {
    L(`  ${c.failed === 0 ? "OK  " : "FAIL"} ${name.padEnd(14)} ${c.checked - c.failed}/${c.checked}`);
    for (const e of c.examples) L(`         x ${e}`);
    if (c.failed > c.examples.length) L(`         … and ${c.failed - c.examples.length} more (examples capped at 5, the COUNT above is complete)`);
  }
  if (res.unparseable.count) { L(`  FAIL unparseable    ${res.unparseable.count} line(s) in data/`); for (const e of res.unparseable.examples) L(`         x ${e}`); }
  for (const f of res.fatal) L(`  FATAL · ${f}`);
  L(`  verdict: ${res.ok ? "GREEN — the archive is verifiable from its own README alone" : "RED"}`);
  L(`  journal: ${j.written ? j.path : "NOT WRITTEN — " + j.why}`);
  return res.ok;
}

// ── SELFTEST ─────────────────────────────────────────────────────────────────
async function selftest() {
  let pass = 0, fail = 0;
  const ok = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };
  console.log("\n== archive_audit selftest ==\n");

  // THE VECTORS — the loop §16.2.4a asks to be closed, closed twice: against
  // the frozen constants, and against what the archive actually publishes.
  ok("VECTORS · all three known-answer records reproduce their published sha256 from the README's recipe alone",
    TEST_VECTORS.every((v) => recordHash(JSON.parse(v.line)) === v.sha256));
  ok("VECTORS · each vector's own stored sha256 field equals the published hash (the record is self-consistent, not just the recipe)",
    TEST_VECTORS.every((v) => JSON.parse(v.line).sha256 === v.sha256));
  // MEASURED 15 Aug 2026, and it corrects §16.3's own prose: that paragraph says
  // "if an implementation normalises Unicode, trims whitespace or rewrites line
  // endings, it will not match." Two of those three are true of these bytes; the
  // FIRST IS NOT. V2's payload is normalisation-STABLE in all four forms (NFC,
  // NFD, NFKC, NFKD all measured as no-ops here — the Devanagari sequence has no
  // precomposed alternative and the emoji has no decomposition), so a
  // normalising implementation would still reproduce this hash. The three
  // published vectors therefore catch trimming, line-ending rewriting and
  // non-UTF-8 encoding, and DO NOT catch Unicode normalisation. Stated rather
  // than patched: the vectors are frozen by his ruling, and a fourth vector is
  // his call, not this file's. Asserting the claim as written would have been a
  // check that passes for the wrong reason — the same shape as the six laws.
  ok("VECTORS · V2 is the one that bites — trimming, rewriting CRLF, collapsing the tab, or hashing anything but UTF-8 bytes each change the hash",
    (() => { const r = JSON.parse(TEST_VECTORS[1].line); const t = r.payload.text; const want = TEST_VECTORS[1].sha256;
      const withText = (s) => recordHash({ ...r, payload: { text: s } });
      const { sha256: _s, prev_sha256: _p, ...body } = r;
      return t.includes("\r\n") && t.includes("\t") && t.startsWith("  ") && t.endsWith("  ")
        && withText(t.trim()) !== want
        && withText(t.replace(/\r\n/g, "\n")) !== want
        && withText(t.replace(/\t/g, " ")) !== want
        && createHash("sha256").update(Buffer.from(canon(body), "utf16le")).digest("hex") !== want; })());
  ok("VECTORS · and the measurement behind that wording — all four Unicode normalisation forms are NO-OPS on V2, so no vector here can catch a normalising reader",
    (() => { const t = JSON.parse(TEST_VECTORS[1].line).payload.text;
      return ["NFC", "NFD", "NFKC", "NFKD"].every((f) => t.normalize(f) === t); })());
  ok("VECTORS · the parser reads them back out of a README block, hash and body paired",
    (() => { const md = `x\n\n\`\`\`\nsha256 = ${TEST_VECTORS[0].sha256}\n${TEST_VECTORS[0].line}\n\`\`\`\n`;
      const got = parseReadmeVectors(md); return got.length === 1 && got[0].sha256 === TEST_VECTORS[0].sha256 && got[0].line === TEST_VECTORS[0].line; })());

  // CANON — the rule, not this implementation of it.
  ok("CANON · keys sort recursively, no insignificant whitespace, and key order in the input cannot change the output",
    canon({ b: 1, a: { d: 2, c: [3, { f: 4, e: 5 }] } }) === '{"a":{"c":[3,{"e":5,"f":4}],"d":2},"b":1}'
    && canon({ a: { c: [3, { e: 5, f: 4 }], d: 2 }, b: 1 }) === canon({ b: 1, a: { d: 2, c: [3, { f: 4, e: 5 }] } }));
  ok("CANON · sha256 and prev_sha256 are the two fields excluded, and re-chaining a record cannot change its hash (that is what makes sha256 a stable citation id)",
    (() => { const r = JSON.parse(TEST_VECTORS[0].line);
      return recordHash({ ...r, prev_sha256: "f".repeat(64) }) === r.sha256 && recordHash({ ...r, sha256: "0".repeat(64) }) === r.sha256; })());

  // THE VALIDATOR — generic, driven by a document, including the keyword guard.
  const S = { type: "object", additionalProperties: false, required: ["a"], properties: { a: { type: ["string", "null"], minLength: 2 }, n: { type: "integer", minimum: 1 }, e: { enum: ["x", "y"] } } };
  ok("SCHEMA · a conforming object passes; each of type / required / minLength / minimum / enum / additionalProperties fails on its own",
    validate(S, { a: "hi", n: 2, e: "x" }).length === 0
    && validate(S, { a: 5 }).length === 1
    && validate(S, { n: 2 }).some((e) => /missing required property "a"/.test(e))
    && validate(S, { a: "h" }).some((e) => /minLength/.test(e))
    && validate(S, { a: "hi", n: 0 }).some((e) => /minimum/.test(e))
    && validate(S, { a: "hi", e: "z" }).some((e) => /not one of/.test(e))
    && validate(S, { a: "hi", zzz: 1 }).some((e) => /additional property "zzz"/.test(e)));
  ok("SCHEMA · null is a first-class type, not an absent value (a null ts_utc is an honest record, not a broken one)",
    validate(S, { a: null }).length === 0 && validate({ type: "string" }, null).length === 1);
  ok("SCHEMA · integer vs number is enforced (1.5 is not an integer)",
    validate({ type: "integer" }, 1.5).length === 1 && validate({ type: "number" }, 1.5).length === 0);
  ok("SCHEMA · if/then applies only when `if` matches — §4.5's derived-record rule fires on an array derived_from and stays silent on null",
    (() => { const s = { type: "object", if: { properties: { derived_from: { type: "array" } }, required: ["derived_from"] }, then: { required: ["valid_from"] } };
      return validate(s, { derived_from: ["01ABC"] }).some((e) => /valid_from/.test(e))
        && validate(s, { derived_from: ["01ABC"], valid_from: "2026-08-14T00:00:00Z" }).length === 0
        && validate(s, { derived_from: null }).length === 0; })());
  ok("SCHEMA · THE KEYWORD GUARD — a schema using a keyword this validator does not implement is NAMED, never silently ignored (the 'green and dead' class)",
    unsupportedKeywords({ type: "object", properties: { a: { oneOf: [] } } }).some((k) => /oneOf/.test(k))
    && unsupportedKeywords(S).length === 0);

  // THE LIVE SCHEMA — the document this organ actually enforces. Read from the
  // real archive when there is one, so a keyword added to v1.json cannot slip
  // past the validator unnoticed.
  {
    const sp = join(archiveRoot(), "SCHEMA", "v1.json");
    if (existsSync(sp)) {
      const live = JSON.parse(readFileSync(sp, "utf8"));
      ok("SCHEMA · the LIVE SCHEMA/v1.json uses no keyword outside this validator's subset (check (d) is as strong as the document claims)",
        unsupportedKeywords(live).length === 0);
      ok("SCHEMA · all three known-answer vectors validate against the LIVE schema (the published records and the published description agree)",
        TEST_VECTORS.every((v) => validate(live, JSON.parse(v.line), "record", []).length === 0));
    } else {
      console.log(`  ⚠ SKIPPED (no archive at ${archiveRoot()}) — the live-schema leg did not run on this machine; the frozen-vector legs above did`);
    }
  }

  // IST — the partition rule, from the README's stated +05:30.
  ok("IST · 20:08Z on the 14th is the 15th in Delhi, and that is the file it must live in (a UTC partition would split his working night in two)",
    istDay("2026-08-14T20:08:14.198Z") === "2026-08-15" && istDay("2026-08-14T04:17:32.123Z") === "2026-08-14");
  ok("IST · a null-clock record partitions on recorded_at, exactly as the writer does (V3 lands on the 15th)",
    (() => { const r = JSON.parse(TEST_VECTORS[2].line); return r.ts_utc === null && istDay(r.ts_utc || r.recorded_at) === "2026-08-15"; })());
  ok("IST · ts_local is checked as the SAME INSTANT as ts_utc, so a drifting second clock is caught",
    (() => { const r = JSON.parse(TEST_VECTORS[0].line);
      return Math.abs(Date.parse(r.ts_local) - Date.parse(r.ts_utc)) <= 1
        && Math.abs(Date.parse("2026-08-14T09:47:33.123+05:30") - Date.parse(r.ts_utc)) > 1; })());

  // FIELD ORDER — the sequence, and that it is a sequence.
  ok("FIELD ORDER · the 23 spec fields in the spec's order; a re-ordered record is caught even though it holds exactly the same fields",
    (() => { const r = JSON.parse(TEST_VECTORS[0].line);
      const keys = Object.keys(r);
      const swapped = Object.fromEntries([["sha256", r.sha256], ["rid", r.rid], ...FIELDS.slice(2).map((f) => [f, r[f]])]);
      return keys.length === 23 && keys.every((k, i) => k === FIELDS[i])
        && Object.keys(swapped).some((k, i) => k !== FIELDS[i]); })());

  // ── THE INDEPENDENCE GUARD ────────────────────────────────────────────────
  // LAW 4 · A FIXTURE THAT TESTS ITSELF TESTS NOTHING. This archive has already
  // shipped that failure twice — the commit tripwire's injected `tracked` and
  // §4.5's inline-restated guard, both green, both dead — and a third time in
  // the review harness, whose crash fixture rewound the checkpoint's offset but
  // not its anchor, a state the code cannot produce, and went RED against a
  // CORRECT build. So this proof does not re-state the rule and does not mock
  // the door: it writes a REAL copy of this file with a REAL forbidden import
  // that REALLY RESOLVES (a stub archivist.mjs sits beside it, so the child
  // cannot fail for the wrong reason), runs it as a SEPARATE PROCESS, and reads
  // its exit code. If the guard is ever softened, this goes red.
  ok("GUARD · this file's own bytes import nothing but node: built-ins, right now",
    guardSelf().length === 0);
  // THE BINDING IS ALIASED, AND THAT ALIAS IS THE WHOLE TEST. The first version
  // of the physical proof below planted `import { canon } from "./archivist.mjs"`
  // verbatim — and this file already declares its own `canon`, so the child died
  // with a SyntaxError before a single line ran. It exited 1, the assertion read
  // 1, and it went GREEN while proving NOTHING about the guard. That is LAW 4
  // committed inside the comment that quotes LAW 4, caught only by reading the
  // child's actual output. The specifier is what §16.6 names and the specifier is
  // unchanged; the alias just lets the module LOAD, so the exit code can mean the
  // guard's verdict and nothing else. The assertion below now forbids the
  // wrong-reason pass explicitly.
  const planted = `import { sha256Hex as __plantedProbe } from ${JSON.stringify("./archivist.mjs")};\nvoid __plantedProbe;\n`;
  ok("GUARD · the exact §16.6 shape is caught by the rule, with its line number and specifier",
    (() => { const v = independenceViolations(readFileSync(SELF, "utf8") + planted);
      const literal = independenceViolations(`import { canon } from ${JSON.stringify("./archivist.mjs")};`);
      return v.length === 1 && v[0].spec === "./archivist.mjs" && literal.length === 1 && literal[0].spec === "./archivist.mjs"; })());
  ok("GUARD · an npm package and a dynamic local import are caught too (the rule is 'node: built-ins only', not 'grep for archivist')",
    independenceViolations(`import ajv from ${JSON.stringify("ajv")};`).length === 1
    && independenceViolations(`const m = await import(${JSON.stringify("./canon.mjs")});`).length === 1
    && independenceViolations(`const x = require(${JSON.stringify("../scripts/util.mjs")});`).length === 1);
  ok("GUARD · prose about the forbidden import does not accuse the file of it — a checker that cries wolf costs what one that sleeps costs",
    independenceViolations(`// import { canon } from ${JSON.stringify("./archivist.mjs")}  <- forbidden, see the header`).length === 0
    && independenceViolations(` * import { canon } from ${JSON.stringify("./archivist.mjs")}`).length === 0);
  ok("GUARD · IT BITES END-TO-END — a planted, RESOLVABLE local import makes a real child process REACH the guard and exit on ITS verdict, not on a load error",
    (() => {
      const tmp = mkdtempSync(join(process.env.TEMP || process.env.TMPDIR || "/tmp", "arcaudit-"));
      try {
        // The stub exports what the planted line imports, so the specifier
        // RESOLVES and the child cannot fail for the wrong reason.
        writeFileSync(join(tmp, "archivist.mjs"), "export const sha256Hex = (s) => String(s);\n", "utf8");
        writeFileSync(join(tmp, "archive_audit.mjs"), readFileSync(SELF, "utf8") + planted, "utf8");
        const r = spawnSync(process.execPath, [join(tmp, "archive_audit.mjs"), "guard"], { encoding: "utf8" });
        const out = String(r.stdout) + String(r.stderr);
        // Four claims, and the last one is the one that matters: the child must
        // have RUN. A SyntaxError also exits 1 and also prints the specifier.
        return r.status === 1 && /archive_audit guard: FAILED/.test(out) && /\.\/archivist\.mjs/.test(out) && !/SyntaxError/.test(out);
      } finally { try { rmSync(tmp, { recursive: true, force: true }); } catch { /* a temp dir that outlives the test is litter, not a failure */ } }
    })());
  ok("GUARD · …and the UNPLANTED copy of this same file, run the same way in the same place, exits 0 — so the assertion above is measuring the plant and not the harness",
    (() => {
      const tmp = mkdtempSync(join(process.env.TEMP || process.env.TMPDIR || "/tmp", "arcclean-"));
      try {
        writeFileSync(join(tmp, "archive_audit.mjs"), readFileSync(SELF, "utf8"), "utf8");
        const r = spawnSync(process.execPath, [join(tmp, "archive_audit.mjs"), "guard"], { encoding: "utf8" });
        return r.status === 0 && /guard: OK/.test(String(r.stdout));
      } finally { try { rmSync(tmp, { recursive: true, force: true }); } catch { /* litter, not a failure */ } }
    })());

  // THE PASS ITSELF, on a hermetic fixture: a two-record archive built by hand
  // from the published documents, then broken four ways, one per check.
  {
    const tmp = mkdtempSync(join(process.env.TEMP || process.env.TMPDIR || "/tmp", "arcfix-"));
    try {
      const schema = existsSync(join(archiveRoot(), "SCHEMA", "v1.json"))
        ? readFileSync(join(archiveRoot(), "SCHEMA", "v1.json"), "utf8")
        : JSON.stringify({ type: "object", required: FIELDS, additionalProperties: false, properties: Object.fromEntries(FIELDS.map((f) => [f, {}])) });
      const build = (lines, day = "2026-08-14") => {
        const d = join(tmp, "data", "afferent", "2026", "08");
        mkdirSync(d, { recursive: true });
        mkdirSync(join(tmp, "SCHEMA"), { recursive: true });
        writeFileSync(join(tmp, "SCHEMA", "v1.json"), schema, "utf8");
        writeFileSync(join(tmp, "README.md"), TEST_VECTORS.map((v) => `sha256 = ${v.sha256}\n${v.line}\n`).join("\n"), "utf8");
        writeFileSync(join(d, `${day.slice(8)}.jsonl`), lines.join("\n") + "\n", "utf8");
        return auditArchive(tmp);
      };
      const v1 = JSON.parse(TEST_VECTORS[0].line);
      ok("PASS · a hand-built archive holding V1 in its correct IST day file comes back GREEN on all four checks",
        (() => { const r = build([JSON.stringify(v1)]); return r.ok && r.records === 1 && r.fatal.length === 0; })());
      ok("PASS · one flipped byte in a payload is caught by FIXITY and by nothing else (the chain would still link perfectly)",
        (() => { const bad = { ...v1, payload: { ...v1.payload, text: "hellp" } };
          const r = build([JSON.stringify(bad)]);
          return !r.ok && r.checks.fixity.failed === 1 && r.checks.field_order.failed === 0 && r.checks.ist_partition.failed === 0; })());
      ok("PASS · a record whose fields are correct but RE-ORDERED is caught by FIELD ORDER and passes fixity (order is not in the hash — that is exactly why it needs its own check)",
        (() => { const reordered = {}; for (const f of [...FIELDS.slice(1, 2), ...FIELDS.slice(0, 1), ...FIELDS.slice(2)]) reordered[f] = v1[f];
          const r = build([JSON.stringify(reordered)]);
          return !r.ok && r.checks.field_order.failed === 1 && r.checks.fixity.failed === 0; })());
      ok("PASS · a record filed under the wrong IST day is caught by PARTITION (V2's 20:08Z belongs to the 15th, not the 14th)",
        (() => { const r = build([TEST_VECTORS[1].line]);
          return !r.ok && r.checks.ist_partition.failed === 1 && /filed under 2026-08-14/.test(r.checks.ist_partition.examples[0]); })());
      ok("PASS · an extra field the schema does not allow is caught by SCHEMA conformance, with the property named",
        (() => { const extra = { ...v1, oops: 1 };
          const r = build([JSON.stringify(extra)]);
          return !r.ok && r.checks.schema.failed === 1 && /oops/.test(r.checks.schema.examples[0]); })());
      ok("PASS · an unparseable line is REPORTED, never skipped into a green verdict",
        (() => { const r = build([JSON.stringify(v1), "{not json"]); return !r.ok && r.unparseable.count === 1; })());
      ok("PASS · an empty archive is RED, not green — a clean verdict over zero records is the loudest false green there is",
        (() => { mkdirSync(join(tmp, "data", "empty_lane"), { recursive: true }); const r = build([], "2026-08-14");
          const r2 = auditArchive(join(tmp, "nothing-here")); return r2.fatal.length > 0 && !r2.ok && r.records >= 0; })());
      ok("PASS · a missing README is FATAL — an archive that cannot describe itself has lost the only thing that makes it readable in 2046",
        (() => { rmSync(join(tmp, "README.md"), { force: true });
          const r = auditArchive(tmp); return !r.ok && r.fatal.some((f) => /README\.md missing/.test(f)); })());
    } finally { try { rmSync(tmp, { recursive: true, force: true }); } catch { /* litter, not a failure */ } }
  }

  console.log(`\n  ${pass} passed / ${fail} failed\n`);
  return fail === 0;
}

// ── CLI ──────────────────────────────────────────────────────────────────────
async function main() {
  const mode = process.argv[2] || "run";
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  if (mode === "guard") {
    const v = guardSelf();
    if (v.length === 0) { console.log(`archive_audit guard: OK — ${SELF} imports node: built-ins only`); process.exit(0); }
    console.log("archive_audit guard: FAILED — this file must import Node built-ins ONLY.");
    console.log("  The duplication in this organ is deliberate: an auditor that imports the thing it audits");
    console.log("  proves only that a function equals itself. Do not 'remove the duplication'.");
    for (const o of v) console.log(`  x line ${o.line}: ${o.spec}   ${o.text}`);
    process.exit(1);
  }
  if (mode !== "run") { console.log("usage: node scripts/archive_audit.mjs [run|selftest|guard]"); process.exit(2); }

  // An auditor whose independence has been quietly removed has no standing to
  // certify anything, so the guard runs BEFORE the pass, not after it.
  const v = guardSelf();
  if (v.length) { console.log(`archive_audit run REFUSED: the independence guard is red (${v.map((o) => o.spec).join(", ")}). Run \`guard\` for the detail.`); process.exit(1); }

  const res = auditArchive(archiveRoot());
  const j = journal(res);
  process.exit(report(res, j) ? 0 : 1);
}

// ENTRYPOINT BY PATH, NOT BY NAME. This read `endsWith("archive_audit.mjs")`
// for about an hour, which meant a copy under any other filename imported its
// whole module body, ran NOTHING, and exited 0 — silently green. That is a
// worse failure here than anywhere else in the repo, because copies of this
// file under other names are exactly how it gets tested and exactly how it
// travels (VERIFIER/ in the bag, a temp plant in the selftest). Resolved-path
// equality is exact, survives renames, and cannot be satisfied by an import.
if (process.argv[1] && resolve(process.argv[1]) === resolve(SELF)) await main();
