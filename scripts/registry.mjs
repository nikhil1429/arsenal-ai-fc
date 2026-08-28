#!/usr/bin/env node
// ============================================================================
// registry.mjs · ARSENAL AI FC — THE REGISTRY (rung S10, 29 Aug 2026)
//   SOLE WRITER of dressing-room/state/registry.json
//   and SOLE WRITER of dressing-room/state/laws_register.json (a DERIVED build
//   artifact — see `laws collect`; hand-consolidating it is the drift disease).
// ----------------------------------------------------------------------------
// WHAT. ONE owner organ holding TABLES OF ROWS that until this rung lived as
//   literals inside twelve mechanisms, as bullets inside live documents, and as
//   facts inside sessions' heads (REGISTRY_SPEC__2026-08-27.md §0). A row is
//   DATA; a mechanism reads its subjects from rows; adding a subject is a ROW
//   EDIT with a receipt, never a code change. His own law, 11 Aug 2026:
//   "do not create jugad, do permanent stuff."
//
// THE ROW (spec §1 + the S10 pre-open ruling R1, 29 Aug 2026):
//   subject · schema_owner (+ appenders[] for declared shared lanes) · witness
//   (file:line / table row / ruling id — a row nothing can check is refused) ·
//   consumers as a DECLARED SET, each consumer with its own read-stamp, and a
//   reach policy per row: "all" | "any" | "quorum-N". EVERY policy seeded at
//   S10 is "any" — the organism's measured semantics today; flipping a row to
//   all/quorum is a RULING, never a build's quiet choice. first_real_row_at is
//   stamped by the reach-side meter (`meter`), from payload rows, never mtime.
//   BORN-RED LAW (R1): a row whose consumers are unknown/missing is a RED row
//   demanding create-or-fix — never a silent absence.
//
// LAYERING (L9): rows RETIRE (retired:true + why), they are never deleted.
// OWNERS-ONLY: every other organ READS via the exported readers or the CLI;
//   nothing else writes these two files. Seeding happens through this CLI —
//   never through a session's editor.
// SELF-HEALING POSTURE (spec §13): self_repair rows carry
//   {reversible, verified_by, report_anchor}; a subject whose reversal path or
//   report anchor is not written down is NOT eligible for auto-repair (red).
//
// CLI: node scripts/registry.mjs status | get --table T [--subject S] [--json]
//      | set --table T --json '{...}'        (upsert by subject; the receipt prints)
//      | retire --table T --subject S --why "…"
//      | meter [--json]                      (stamp first/newest/consumer reads)
//      | check [--json]                      (registry-owned standing checks)
//      | laws collect | laws check           (the DERIVED standing-laws register)
//      | rulings add --scope architecture|learning-method [--by who] [--at ISO]
//        [--source s] [--no-card]            (his word on stdin → dated row + ONE card)
//      | book [--out path]                   (THE ORGANISM BOOK's spine — derived render)
//      | backfill [--commit]                 (C4: RAW_FACTS → reps_log dry-run/receipt)
//      | selftest
// ============================================================================
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync, readdirSync, rmSync, mkdtempSync } from "node:fs";
import { join, dirname, isAbsolute } from "node:path";
import { tmpdir, homedir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const __dirname = dirname(SELF);
const ROOT = join(__dirname, "..");
const STATE_DIR = join(ROOT, "dressing-room", "state");
export const REGISTRY_PATH = process.env.ARSENAL_REGISTRY || join(STATE_DIR, "registry.json");
export const LAWS_REGISTER_PATH = process.env.ARSENAL_LAWS_REGISTER || join(STATE_DIR, "laws_register.json");
// The rulings queue and his memory index live OUT of the repo by his privacy law;
// both are env-pinnable so a selftest proves the logic in a sandbox, never live.
export const QUEUE_DIR = process.env.ARSENAL_QUEUE_DIR || join(homedir(), "arsenal-audit-artifacts", "queue");
export const MEMORY_DIR = process.env.ARSENAL_MEMORY_DIR || join(homedir(), ".claude", "projects", "C--Users-nikhi-GitHub-arsenal-ai-fc", "memory");
export const RAW_FACTS_PATH = process.env.ARSENAL_RAW_FACTS || join(homedir(), "arsenal-samjhao", "RAW_FACTS.jsonl");

export const isFixture = () => (process.argv[2] || "") === "selftest" || !!process.env.ARSENAL_AUDIT_COLLAR;

// THE TABLES. Keys are the closed set; `req` is what a row of that table cannot
// exist without (witness law, spec §6: a row nothing can resolve validates
// nothing). `consumers` marks the tables whose rows carry the R1 consumer-set +
// reach-policy shape. This is a STRUCTURE (an object over objects), not a
// subject list — the subjects themselves live in registry.json as rows.
const TABLES = {
  mechanisms:     { req: { subject: 1, schema_owner: 1, witness: 1 } },
  lanes:          { req: { subject: 1, schema_owner: 1, witness: 1 }, consumers: true },
  emit_contract:  { req: { subject: 1, surface: 1, writes_to: 1, fired_by: 1, witness: 1 } },
  checks:         { req: { subject: 1, owner: 1, evaluator: 1, witness: 1 } },
  docs:           { req: { subject: 1, vintage: 1, witness: 1 } },
  derived_copies: { req: { subject: 1, source_file: 1, derived_file: 1, witness: 1 } },
  orders:         { req: { subject: 1, path: 1, status: 1, witness: 1 } },
  self_repair:    { req: { subject: 1, artifact: 1, verified_by: 1, report_anchor: 1, witness: 1 } },
  predicates:     { req: { subject: 1, property: 1, site: 1, witness: 1 } },
  sandbox_subjects: { req: { subject: 1, env_pin: 1, schema_owner: 1, witness: 1 } },
  mcp:            { req: { subject: 1, mode: 1, status: 1, witness: 1 } },
  rulings:        { req: { id: 1, at: 1, scope: 1, text: 1 } },
};
const REACH_RE = /^(any|all|quorum-[1-9][0-9]*)$/;

const clip = (s, n = 300) => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n);
const nowISO = () => new Date().toISOString();

// ── storage: one JSON, atomic temp→rename, never hand-edited ─────────────────
export function loadRegistry(path = REGISTRY_PATH) {
  try {
    if (!existsSync(path)) return { version: 1, updated_at: null, tables: {}, missing: true };
    const j = JSON.parse(readFileSync(path, "utf8"));
    if (!j || typeof j !== "object" || !j.tables) return { version: 1, updated_at: null, tables: {}, corrupt: true };
    return j;
  } catch (e) { return { version: 1, updated_at: null, tables: {}, corrupt: true, why: String((e && e.message) || e).slice(0, 160) }; }
}
function saveRegistry(reg, path = REGISTRY_PATH) {
  reg.version = reg.version || 1;
  reg.updated_at = nowISO();
  delete reg.missing; delete reg.corrupt; delete reg.why;
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp" + process.pid;
  writeFileSync(tmp, JSON.stringify(reg, null, 1));
  renameSync(tmp, path);
  return true;
}

// ── readers (what every other organ imports; read-only, cheap, throw-loud) ───
export function tableRows(table, path = REGISTRY_PATH) {
  const reg = loadRegistry(path);
  return Array.isArray((reg.tables || {})[table]) ? reg.tables[table] : [];
}
export function rowOf(table, subject, path = REGISTRY_PATH) {
  return tableRows(table, path).find((r) => r && (r.subject === subject || r.id === subject)) || null;
}
/** subjectsOf — the un-nailed literal. A mechanism whose row is absent gets a
 *  LOUD throw, never a silent empty list: an enumeration that quietly shrinks
 *  to zero is exactly the failure the registry exists to kill. */
export function subjectsOf(mechanism, path = REGISTRY_PATH) {
  const row = rowOf("mechanisms", mechanism, path);
  if (!row || row.retired) throw new Error(`registry: no live mechanisms row "${mechanism}" in ${path} — seed it via \`node scripts/registry.mjs set --table mechanisms --json ...\``);
  return Array.isArray(row.subjects) ? [...row.subjects] : [];
}
export function laneRows(path = REGISTRY_PATH) { return tableRows("lanes", path).filter((r) => r && !r.retired); }
export function emitRows(path = REGISTRY_PATH) { return tableRows("emit_contract", path).filter((r) => r && !r.retired); }
/** slotPassed — "has the producer's slot passed today?" Row shape: slot:{after:"HH:MM"}.
 *  null when no row declares it (caller keeps its old behaviour and says so). */
export function slotPassed(subject, now = new Date(), path = REGISTRY_PATH) {
  const row = rowOf("mechanisms", subject, path);
  const after = row && !row.retired && row.slot && row.slot.after;
  if (!after || !/^\d{2}:\d{2}$/.test(String(after))) return null;
  const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return hm >= String(after);
}
/** coreAxes — per-concept core axes (S10 migration #12): the hand-curated
 *  `core_axes` array under the concept's own entry in concepts.json answers
 *  first (the canon lane forge_session.mjs:115-120 already named as the correct
 *  home, provably invisible to capture's loadRegistry); the registry row
 *  `core_axes_default` answers for every concept without one. The old global
 *  literal and its hand-mirrored twin die together — ONE reader, two callers. */
export function coreAxes(concept, { conceptsPath = join(STATE_DIR, "concepts.json"), path = REGISTRY_PATH } = {}) {
  try {
    const j = JSON.parse(readFileSync(conceptsPath, "utf8"));
    const e = j && j.concepts && typeof j.concepts === "object" && !Array.isArray(j.concepts) ? j.concepts[String(concept || "").toLowerCase()] : null;
    if (e && Array.isArray(e.core_axes) && e.core_axes.length && e.core_axes.every((a) => typeof a === "string")) return [...e.core_axes];
  } catch { /* canon unreadable → the default row still answers */ }
  return subjectsOf("core_axes_default", path);
}
/** fixturePin — sandbox_subjects reader: which env var pins this ledger to a
 *  sandbox (migration #7's general form; samjhao's guard is instance #1). */
export function fixturePin(subject, path = REGISTRY_PATH) {
  const row = rowOf("sandbox_subjects", subject, path);
  return row && !row.retired ? { env_pin: row.env_pin, live: row.live || null } : null;
}

// ── validation: the row law + R1's consumer-set law ──────────────────────────
export function validateRow(table, row) {
  const spec = TABLES[table];
  if (!spec) return { ok: false, why: `unknown table "${table}" — the closed set: ${Object.keys(TABLES).join(" | ")}` };
  if (!row || typeof row !== "object" || Array.isArray(row)) return { ok: false, why: "a row is an object" };
  for (const k of Object.keys(spec.req)) {
    if (row[k] == null || row[k] === "") return { ok: false, why: `${table} row needs "${k}" (witness law: a row nothing can check is refused)` };
  }
  if (spec.consumers) {
    if (!Array.isArray(row.consumers)) return { ok: false, why: "lanes rows carry consumers as a DECLARED SET (R1) — an array, each {name|kind:\"him\"}" };
    if (!REACH_RE.test(String(row.reach || ""))) return { ok: false, why: 'lanes rows declare reach: "any" | "all" | "quorum-N" (R1)' };
    for (const c of row.consumers) {
      if (!c || typeof c !== "object" || (c.kind !== "him" && !c.name)) return { ok: false, why: "each consumer is {name:\"organ.mjs\"} or {kind:\"him\"}" };
    }
  }
  return { ok: true };
}
/** redRows — the born-red law (R1) + §13's eligibility law, computed live. */
export function redRows(path = REGISTRY_PATH) {
  const reds = [];
  for (const r of laneRows(path)) {
    const declared = Array.isArray(r.consumers) ? r.consumers : [];
    // consumer_retired = the lane DECLARES nobody may eat it (gate's haiku_pulse
    // shape) — that is a declaration, not an absence, so it is not born-red.
    if (!declared.length && !r.retired && !r.consumer_retired) reds.push({ table: "lanes", subject: r.subject, why: "consumers UNKNOWN — a missing consumer is a RED row demanding create-or-fix (R1), never a silent absence" });
  }
  for (const r of tableRows("self_repair", path)) {
    if (r && !r.retired && (r.reversible !== true || !r.report_anchor)) reds.push({ table: "self_repair", subject: r.subject, why: "not auto-repair-eligible: reversibility and a report anchor he already hits must be DECLARED (spec §13)" });
  }
  for (const r of tableRows("mcp", path)) {
    if (r && !r.retired && r.status === "installed" && !r.evidence) reds.push({ table: "mcp", subject: r.subject, why: "installed with no evidence — the adoption contract runs evidence → owner → gates → window" });
  }
  return reds;
}

// ── mutations (CLI-only paths; the fixture guard keeps selftests off the live file) ──
function guardLive(path) {
  if (isFixture() && path === (join(STATE_DIR, "registry.json")) && !process.env.ARSENAL_REGISTRY) {
    return { ok: false, why: "a FIXTURE may never write the LIVE registry — point ARSENAL_REGISTRY at a sandbox file and prove it there" };
  }
  return { ok: true };
}
export function upsertRow(table, row, { path = REGISTRY_PATH, at = nowISO() } = {}) {
  const g = guardLive(path); if (!g.ok) return g;
  const v = validateRow(table, row); if (!v.ok) return v;
  const reg = loadRegistry(path);
  if (reg.corrupt) return { ok: false, why: `refusing to write over a corrupt registry (${reg.why || "unparseable"}) — fix ${path} first` };
  reg.tables[table] = reg.tables[table] || [];
  const key = row.subject || row.id;
  const i = reg.tables[table].findIndex((r) => r && (r.subject || r.id) === key);
  const stamped = { ...row, updated_at: at, ...(i < 0 ? { added_at: at } : { added_at: reg.tables[table][i].added_at || at }) };
  if (i < 0) reg.tables[table].push(stamped); else reg.tables[table][i] = { ...reg.tables[table][i], ...stamped };
  saveRegistry(reg, path);
  return { ok: true, table, subject: key, op: i < 0 ? "added" : "updated" };
}
export function retireRow(table, subject, why, { path = REGISTRY_PATH } = {}) {
  const g = guardLive(path); if (!g.ok) return g;
  const reg = loadRegistry(path);
  const rows = (reg.tables || {})[table] || [];
  const i = rows.findIndex((r) => r && (r.subject || r.id) === subject);
  if (i < 0) return { ok: false, why: `no ${table} row "${subject}"` };
  rows[i] = { ...rows[i], retired: true, retired_at: nowISO(), retired_why: clip(why, 200) || "no reason given" };
  saveRegistry(reg, path);
  return { ok: true, table, subject, op: "retired (L9: never deleted)" };
}

// ── THE REACH-SIDE METER (spec §4) — stamps from payload rows, never mtime ───
function firstLastTs(file) {
  try {
    if (!existsSync(file)) return { first: null, last: null, rows: 0 };
    const lines = readFileSync(file, "utf8").split("\n").filter((l) => l.trim());
    let first = null, last = null, rows = 0;
    for (const l of lines) {
      let r; try { r = JSON.parse(l); } catch { continue; }
      rows++;
      const ts = r && (r.ts || r.observed_at || r.at || r.ts_claimed);
      if (typeof ts === "string") { if (!first || ts < first) first = ts; if (!last || ts > last) last = ts; }
    }
    return { first, last, rows };
  } catch { return { first: null, last: null, rows: 0 }; }
}
function capsuleDirStamps(dir) {
  try {
    if (!existsSync(dir)) return { first: null, last: null, rows: 0 };
    let first = null, last = null, rows = 0;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".json")) continue;
      try {
        const j = JSON.parse(readFileSync(join(dir, f), "utf8"));
        const ts = j && (j.lockedOn || (j.capsule && j.capsule.lockedOn));
        rows++;
        if (typeof ts === "string") { if (!first || ts < first) first = ts; if (!last || ts > last) last = ts; }
      } catch { continue; }
    }
    return { first, last, rows };
  } catch { return { first: null, last: null, rows: 0 }; }
}
function consumptionReads(consumptionPath) {
  const bySubject = new Map();
  try {
    if (!existsSync(consumptionPath)) return bySubject;
    for (const l of readFileSync(consumptionPath, "utf8").split("\n")) {
      if (!l.trim()) continue;
      let r; try { r = JSON.parse(l); } catch { continue; }
      const subj = r && (r.subject || r.lane); const by = r && r.by; const ts = r && r.ts;
      if (!subj || !by || !ts) continue;
      const m = bySubject.get(subj) || new Map();
      const base = String(by).toLowerCase();
      m.set(base, m.get(base) && m.get(base) > ts ? m.get(base) : ts);
      bySubject.set(subj, m);
    }
  } catch { return bySubject; }
  return bySubject;
}
export function meter({ path = REGISTRY_PATH, stateDir = STATE_DIR, consumptionPath = null, save = true, now = new Date() } = {}) {
  const g = save ? guardLive(path) : { ok: true }; if (!g.ok) return { ok: false, why: g.why };
  const reg = loadRegistry(path);
  const reads = consumptionReads(consumptionPath || join(stateDir, "consumption.jsonl"));
  const report = [];
  for (const table of ["lanes", "emit_contract"]) {
    for (const r of (reg.tables || {})[table] || []) {
      if (!r || r.retired || !r.writes_to) continue;
      const target = isAbsolute(r.writes_to) ? r.writes_to : join(stateDir, r.writes_to);
      const s = r.writes_to.endsWith("/") || r.writes_to.endsWith("capsules") ? capsuleDirStamps(target) : firstLastTs(target);
      r.first_real_row_at = s.first;
      r.newest_row_at = s.last;
      r.payload_rows = s.rows;
      const m = reads.get(r.subject) || reads.get((r.surface || "").replace(/\.mjs$/, "")) || new Map();
      r.consumer_reads = {};
      for (const c of Array.isArray(r.consumers) ? r.consumers : []) {
        if (c.kind === "him") continue;
        // word-bounded on purpose — gate.mjs consumerMatches' lesson: `dmn` must not
        // match `dmn_rollout`, and `c` must not match the word "consumer".
        const base = String(c.name || "").toLowerCase().replace(/\.mjs$/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = base ? new RegExp(`(^|[^a-z0-9_])${base}([^a-z0-9_]|$)`) : null;
        let latest = null;
        for (const [by, ts] of m) if (re && re.test(by) && (!latest || ts > latest)) latest = ts;
        r.consumer_reads[c.name || "?"] = latest;
      }
      r.metered_at = now.toISOString();
      report.push({ table, subject: r.subject, first_real_row_at: r.first_real_row_at, newest_row_at: r.newest_row_at, rows: r.payload_rows, consumer_reads: r.consumer_reads });
    }
  }
  if (save) saveRegistry(reg, path);
  return { ok: true, metered: report.length, report };
}
/** neverFedLines — check #2 (spec §4): a lane registered > windowDays ago whose
 *  first_real_row_at is still null earns ONE line for state.mjs. */
export function neverFedLines({ path = REGISTRY_PATH, now = new Date(), windowDays = 7 } = {}) {
  const out = [];
  for (const table of ["lanes", "emit_contract"]) {
    for (const r of tableRows(table, path)) {
      if (!r || r.retired || !r.writes_to || r.first_real_row_at) continue;
      const born = r.added_at ? new Date(r.added_at) : null;
      const ageDays = born ? (now - born) / 86400000 : null;
      if (ageDays != null && ageDays > windowDays) out.push(`${r.subject}: registered ${Math.floor(ageDays)}d, first_real_row_at still null — the lane has never been fed`);
    }
  }
  return out;
}

// ── registry-owned standing checks (`check`) ─────────────────────────────────
function extractVersion(file, re) {
  try { const m = new RegExp(re, "m").exec(readFileSync(file, "utf8")); return m ? m[1] : null; } catch { return null; }
}
export function derivedCopyCheck({ path = REGISTRY_PATH, root = ROOT } = {}) {
  const rows = tableRows("derived_copies", path).filter((r) => r && !r.retired);
  const out = [];
  for (const r of rows) {
    const src = extractVersion(join(root, r.source_file), r.source_version_re || "v(\\d+\\.\\d+)");
    const der = extractVersion(join(root, r.derived_file), r.declared_version_re || "v(\\d+\\.\\d+)");
    out.push({ subject: r.subject, source_version: src, declared_version: der, drifted: src != null && der != null ? src !== der : null });
  }
  return out;
}
export function memoryIndexCheck({ dir = MEMORY_DIR } = {}) {
  try {
    if (!existsSync(dir)) return { ok: true, unreachable: true, why: `memory dir absent (${dir}) — nothing measured, nothing claimed`, unindexed: [] };
    const index = existsSync(join(dir, "MEMORY.md")) ? readFileSync(join(dir, "MEMORY.md"), "utf8") : "";
    const unindexed = readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "MEMORY.md" && !index.includes(`(${f})`) && !index.includes(`(${f.replace(/\\/g, "/")}`));
    return { ok: unindexed.length === 0, unreachable: false, unindexed };
  } catch (e) { return { ok: true, unreachable: true, why: String((e && e.message) || e).slice(0, 160), unindexed: [] }; }
}
export function orphanWritesCheck({ atlasPath = join(STATE_DIR, "flow_atlas.json") } = {}) {
  // Q2's family (spec §4 check #1). The atlas is the witness store; its orphan-write
  // list is the seed (11 at S6). The count is a RATCHET held in the checks row —
  // it may only FALL; this function only MEASURES.
  try {
    if (!existsSync(atlasPath)) return { measured: null, why: "flow_atlas.json absent — run `node scripts/flow_atlas.mjs build`" };
    const j = JSON.parse(readFileSync(atlasPath, "utf8"));
    const n = Array.isArray(j.orphan_writes) ? j.orphan_writes.length
      : Array.isArray(j.negative_space && j.negative_space.orphan_writes) ? j.negative_space.orphan_writes.length
      : typeof (j.counts && j.counts.orphan_writes) === "number" ? j.counts.orphan_writes : null;
    return { measured: n, why: n == null ? "atlas carries no orphan_writes field this reader knows" : null };
  } catch (e) { return { measured: null, why: String((e && e.message) || e).slice(0, 160) }; }
}
export function runChecks({ path = REGISTRY_PATH, memoryDir = MEMORY_DIR } = {}) {
  const reds = [], notes = [];
  const born = redRows(path);
  // Born-red rows are DEMANDS (create-or-fix), not suite failures: they are the
  // registry doing its job. They surface here and on the state line.
  if (born.length) notes.push(`${born.length} born-red row(s) demanding create-or-fix: ${born.map((r) => r.subject).join(" · ")}`);
  const mem = memoryIndexCheck({ dir: memoryDir });
  if (!mem.ok) reds.push(`MEMORY-INDEX RATCHET: ${mem.unindexed.length} memory file(s) not in MEMORY.md — an unindexed memory is a fact the organism has and cannot reach: ${mem.unindexed.join(" · ")}`);
  if (mem.unreachable) notes.push(`memory index: ${mem.why}`);
  const drift = derivedCopyCheck({ path });
  const drifted = drift.filter((d) => d.drifted === true);
  const driftRow = rowOf("checks", "derived_copy_drift", path);
  const allowed = driftRow && typeof driftRow.baseline === "number" ? driftRow.baseline : 0;
  if (drifted.length > allowed) reds.push(`SPEC→DERIVED-COPY DRIFT ROSE: ${drifted.length} drifted (baseline ${allowed}) — ${drifted.map((d) => d.subject).join(" · ")}`);
  else if (drifted.length) notes.push(`derived-copy drift at baseline (${drifted.length}/${allowed} known): ${drifted.map((d) => `${d.subject} ${d.source_version}→${d.declared_version}`).join(" · ")}`);
  const orphan = orphanWritesCheck({});
  const orphanRow = rowOf("checks", "orphan_writes", path);
  const orphanBase = orphanRow && typeof orphanRow.baseline === "number" ? orphanRow.baseline : null;
  if (orphan.measured != null && orphanBase != null && orphan.measured > orphanBase) reds.push(`ORPHAN WRITES ROSE: ${orphan.measured} (baseline ${orphanBase}) — an organ writes a path no organ reads and no anchor delivers`);
  else if (orphan.measured != null) notes.push(`orphan writes ${orphan.measured}${orphanBase != null ? `/${orphanBase} baseline` : ""}`);
  else if (orphan.why) notes.push(`orphan writes: ${orphan.why}`);
  const fed = neverFedLines({ path });
  for (const l of fed) notes.push(`never-fed: ${l}`);
  return { ok: reds.length === 0, reds, notes, born_red: born };
}

// ── THE STANDING-LAWS REGISTER (spec §3) — DERIVED, never hand-written ───────
export function collectLaws({ queueDir = QUEUE_DIR, orderPath = null, out = LAWS_REGISTER_PATH, save = true } = {}) {
  const laws = [];
  // 1) every ruling file in the queue: one row, first heading line = statement.
  let queueReachable = false;
  try {
    if (existsSync(queueDir)) {
      queueReachable = true;
      for (const f of readdirSync(queueDir).filter((x) => /^RULING__.*\.md$/i.test(x)).sort()) {
        try {
          const txt = readFileSync(join(queueDir, f), "utf8");
          const head = (txt.split("\n").find((l) => l.trim()) || f).replace(/^#+\s*/, "");
          laws.push({ law_id: f.replace(/\.md$/i, ""), statement: clip(head, 200), source_file: join(queueDir, f), scope: "ruling", check_site: null });
        } catch { continue; }
      }
    }
  } catch { queueReachable = false; }
  // 2) §10-D of the open engineering order: one row per numbered rule.
  const order = orderPath || resolveOpenOrder();
  if (order && existsSync(order)) {
    try {
      const txt = readFileSync(order, "utf8");
      const m = /### §10-D[^\n]*\n([\s\S]*?)\n### §10-E/.exec(txt);
      if (m) {
        for (const rm of m[1].matchAll(/^(\d+)\.\s+([^\n]+)/gm)) {
          laws.push({ law_id: `10D-${rm[1]}${laws.some((l) => l.law_id === `10D-${rm[1]}`) ? "b" : ""}`, statement: clip(rm[2].replace(/\*\*/g, ""), 200), source_file: order, scope: "standing", check_site: "§10-D" });
        }
      }
    } catch { /* the order stays the record; the register just misses it this run */ }
  }
  const register = { generated_at: nowISO(), generated_by: "registry.mjs laws collect (DERIVED — hand edits are the drift disease)", queue_dir: queueDir, queue_reachable: queueReachable, count: laws.length, laws };
  if (save) {
    if (isFixture() && out === join(STATE_DIR, "laws_register.json") && !process.env.ARSENAL_LAWS_REGISTER) return { ok: false, why: "a FIXTURE may never write the LIVE laws register" };
    mkdirSync(dirname(out), { recursive: true });
    const tmp = out + ".tmp" + process.pid;
    writeFileSync(tmp, JSON.stringify(register, null, 1));
    renameSync(tmp, out);
  }
  return { ok: true, count: laws.length, queue_reachable: queueReachable, out };
}
function resolveOpenOrder() {
  // The ORDER-GATE contract line is rails.mjs's law (S5-R2 ruling); the registry
  // reads the SAME line rather than keeping a second phrase (one-copy law).
  try {
    const m = /^ORDER-GATE:\s*(\S+\.md)\s*$/m.exec(readFileSync(join(ROOT, "CLAUDE.md"), "utf8"));
    return m ? join(ROOT, m[1]) : null;
  } catch { return null; }
}

// ── rulings lane (spec §3, C2): his word → a dated row (+ ONE card) ──────────
export function addRuling({ text, scope, by = "captain", at = nowISO(), source = "acts.design", card = true, path = REGISTRY_PATH, exec = null } = {}) {
  if (!clip(text)) return { ok: false, why: "a ruling is his words — empty text is refused" };
  if (!["architecture", "learning-method"].includes(scope)) return { ok: false, why: 'scope is a FIELD: "architecture" | "learning-method" (C2 — never a second lane)' };
  const id = `rul-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36).padStart(2, "0")}`;
  const r = upsertRow("rulings", { id, at, scope, by, source, text: clip(text, 2000) }, { path });
  if (!r.ok) return r;
  let cardResult = null;
  if (card) {
    const run = exec || ((argv, stdin) => spawnSync(process.execPath, [join(__dirname, "captains_call.mjs"), ...argv], { encoding: "utf8", input: stdin, timeout: 30000, windowsHide: true }));
    const line = `Ruling darj (${scope}): "${clip(text, 120)}" — galat likha ho to bolo, warna kuch nahi karna hai.`;
    const c = run(["file", "--line", line, "--key", `ruling:${id}`], null);
    cardResult = c && c.status === 0 ? "filed" : `card failed (${clip(c && (c.stderr || c.stdout), 120) || "no output"})`;
  }
  return { ok: true, id, scope, card: cardResult };
}

// ── THE ORGANISM BOOK's spine (pre-open ruling R5) — a derived render ────────
export function bookSpine({ path = REGISTRY_PATH } = {}) {
  const reg = loadRegistry(path);
  const L = [];
  L.push(`# THE ORGANISM BOOK — the spine (DERIVED from registry.json ${reg.updated_at || "never"}; counts are live-read, never prose)`);
  L.push(`> Generated by \`node scripts/registry.mjs book\`. Hand edits die at the next build (N2's drift law).`);
  for (const [table, rows] of Object.entries(reg.tables || {})) {
    const live = rows.filter((r) => r && !r.retired), retired = rows.length - live.length;
    L.push(`\n## ${table} — ${live.length} live row(s)${retired ? ` (+${retired} retired, kept by L9)` : ""}`);
    for (const r of live) {
      const bits = [];
      if (r.schema_owner) bits.push(`owner ${r.schema_owner}`);
      if (Array.isArray(r.subjects)) bits.push(`${r.subjects.length} subject(s): ${r.subjects.join(", ")}`);
      if (Array.isArray(r.consumers)) bits.push(`eats: ${r.consumers.map((c) => c.kind === "him" ? "HIM" : c.name).join(" + ")} (reach ${r.reach})`);
      if (r.writes_to) bits.push(`writes ${r.writes_to}`);
      if (r.first_real_row_at !== undefined) bits.push(r.first_real_row_at ? `fed since ${String(r.first_real_row_at).slice(0, 10)}` : "NEVER FED");
      if (r.witness) bits.push(`witness: ${clip(r.witness, 80)}`);
      L.push(`- **${r.subject || r.id}** — ${bits.join(" · ") || clip(r.text, 120)}`);
    }
  }
  const reds = redRows(path);
  if (reds.length) { L.push(`\n## born-red (create-or-fix demanded)`); for (const r of reds) L.push(`- ${r.table}/${r.subject}: ${r.why}`); }
  return L.join("\n") + "\n";
}

// ── C4 · THE BACK-FILL (dry-run transformer; ingestion rides the E1 ruling) ──
export function backfillPlan({ rawPath = RAW_FACTS_PATH } = {}) {
  const out = { source: rawPath, reachable: existsSync(rawPath), reps: [], skipped: [], rulings: [], rejirah: { rows: 0, note: "rejirah lane NEVER BORN during the window — 0 rows is the honest stamp; the wound stays visible" } };
  if (!out.reachable) return out;
  for (const l of readFileSync(rawPath, "utf8").split("\n")) {
    if (!l.trim()) continue;
    let r; try { r = JSON.parse(l); } catch { out.skipped.push({ why: "unparseable line" }); continue; }
    const [concept, axis] = String(r.topic_axis || "").split("/");
    if (r.kind === "his_ruling") { out.rulings.push({ ts: r.ts, scope: "learning-method", text: r.text }); continue; }
    if (!["check", "pehle_guess", "doubt_closed", "hand_work"].includes(r.kind)) { out.skipped.push({ ts: r.ts, kind: r.kind, why: "not a gradeable rep kind" }); continue; }
    const t = String(r.text || "");
    // ONLY the sessions' own verdict markers grade a row — nothing is invented.
    const correct = /\bALL THREE CORRECT\b|\bCORRECT\b(?!\s*ANSWER:)/i.test(t) && !/\bWRONG\b/.test(t) ? true : /\bWRONG\b/.test(t) ? false : null;
    if (/\bSKIPPED\b/.test(t)) { out.skipped.push({ ts: r.ts, kind: r.kind, why: "SKIPPED on his own call (the session's marker)" }); continue; }
    if (correct === null) { out.skipped.push({ ts: r.ts, kind: r.kind, why: "no verdict marker in the row — grading it would be invention" }); continue; }
    const confidence = /\bno idea\b/i.test(t) ? "guessed" : null;   // his words, or nothing
    out.reps.push({ ts: r.ts, surface: "samjhao-backfill", track: "concept", concept: concept || "unknown", axis: axis && /^[a-i]$/.test(axis) ? axis : null, question: clip(t, 160), confidence, correct, note: "back-fill 2026-08-29 from RAW_FACTS.jsonl (C4)" });
  }
  return out;
}

// ── selftest — a sandbox registry, never the live one ────────────────────────
function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond, detail) => { if (cond) pass++; else { fail++; } console.log(`  ${cond ? "✓" : "✗"} ${name}${!cond && detail ? ` — ${detail}` : ""}`); };
  const tmp = mkdtempSync(join(tmpdir(), "registry-"));
  const P = join(tmp, "registry.json");
  const T0 = "2026-08-29T10:00:00.000Z";

  assert("FIXTURE GUARD — a selftest may never write the LIVE registry (env-pin law, migration #7's own shape)",
    upsertRow("mechanisms", { subject: "x", schema_owner: "x.mjs", witness: "x" }, { path: join(STATE_DIR, "registry.json") }).ok === false);

  assert("WITNESS LAW — a row without subject/schema_owner/witness is refused (spec §6: a row nothing can check validates nothing)",
    upsertRow("mechanisms", { subject: "interruption_types" }, { path: P }).ok === false);
  assert("UNKNOWN TABLE — the table set is closed; an invented table is refused loudly",
    upsertRow("mystery", { subject: "x" }, { path: P }).ok === false);

  const m1 = upsertRow("mechanisms", { subject: "interruption_types", schema_owner: "shadow.mjs", witness: "shadow.mjs:47", subjects: ["stoppage_next_drill", "wall_breaker"] }, { path: P, at: T0 });
  assert("UPSERT — a mechanism row lands with its subjects[] (the un-nailed literal)", m1.ok === true && subjectsOf("interruption_types", P).length === 2);
  const m2 = upsertRow("mechanisms", { subject: "interruption_types", schema_owner: "shadow.mjs", witness: "shadow.mjs:47", subjects: ["stoppage_next_drill", "wall_breaker", "due_at_kickoff"] }, { path: P });
  assert("ROW EDIT IS THE MECHANISM — adding a subject is an upsert with a receipt, never a code change", m2.op === "updated" && subjectsOf("interruption_types", P).length === 3);
  assert("THROW-LOUD READER — an absent mechanism row throws with the seeding command, never returns a silent empty list",
    (() => { try { subjectsOf("never_seeded", P); return false; } catch (e) { return /seed it via/.test(String(e.message)); } })());

  assert("R1 · CONSUMER SET — a lanes row must declare consumers[] and a reach policy",
    upsertRow("lanes", { subject: "l1", schema_owner: "a.mjs", witness: "w" }, { path: P }).ok === false
    && upsertRow("lanes", { subject: "l1", schema_owner: "a.mjs", witness: "w", consumers: [{ name: "b.mjs" }], reach: "sometimes" }, { path: P }).ok === false
    && upsertRow("lanes", { subject: "l1", schema_owner: "a.mjs", witness: "w", consumers: [{ name: "b.mjs" }, { name: "c.mjs" }], reach: "any", writes_to: "l1.jsonl" }, { path: P }).ok === true);
  assert("R1 · BORN-RED — a lane with NO consumer is stored but demands create-or-fix (never a silent absence)",
    upsertRow("lanes", { subject: "l_orphan", schema_owner: "a.mjs", witness: "w", consumers: [], reach: "any" }, { path: P }).ok === true
    && redRows(P).some((r) => r.subject === "l_orphan"));
  assert("QUORUM SHAPE — reach accepts any | all | quorum-N",
    ["any", "all", "quorum-2"].every((x) => REACH_RE.test(x)) && !REACH_RE.test("quorum-0"));

  assert("L9 · RETIRE, NEVER DELETE — a retired row survives with its why",
    retireRow("lanes", "l_orphan", "selftest retirement", { path: P }).ok === true
    && tableRows("lanes", P).find((r) => r.subject === "l_orphan").retired === true
    && !redRows(P).some((r) => r.subject === "l_orphan"));

  // meter: a planted payload file with real rows; stamps come from ROWS, never mtime.
  writeFileSync(join(tmp, "l1.jsonl"), [
    JSON.stringify({ ts: "2026-08-21T05:00:00Z", v: 1 }),
    "not json — a torn line must not kill the meter",
    JSON.stringify({ ts: "2026-08-25T05:00:00Z", v: 2 }),
  ].join("\n"));
  writeFileSync(join(tmp, "consumption.jsonl"), JSON.stringify({ subject: "l1", by: "b consumer read", ts: "2026-08-26T00:00:00Z" }) + "\n");
  const mt = meter({ path: P, stateDir: tmp, now: new Date("2026-08-29T12:00:00Z") });
  const l1 = tableRows("lanes", P).find((r) => r.subject === "l1");
  assert("METER — first_real_row_at/newest_row_at stamped from PAYLOAD ROWS (torn line skipped, never fatal)",
    mt.ok === true && l1.first_real_row_at === "2026-08-21T05:00:00Z" && l1.newest_row_at === "2026-08-25T05:00:00Z" && l1.payload_rows === 2);
  assert("METER · PER-CONSUMER READ-STAMPS (R1) — each declared consumer carries its own last read",
    l1.consumer_reads["b.mjs"] === "2026-08-26T00:00:00Z" && l1.consumer_reads["c.mjs"] === null);
  assert("NEVER-FED — a lane older than the window with first_real_row_at null earns ONE line (heartbeat-proves-only-the-heartbeat class)",
    (() => {
      upsertRow("lanes", { subject: "l_dead", schema_owner: "a.mjs", witness: "w", consumers: [{ kind: "him" }], reach: "any", writes_to: "absent.jsonl" }, { path: P, at: "2026-08-01T00:00:00Z" });
      meter({ path: P, stateDir: tmp });
      return neverFedLines({ path: P, now: new Date("2026-08-29T12:00:00Z") }).some((l) => l.startsWith("l_dead"));
    })());

  // checks: memory index + derived copies, both against fixtures.
  const memDir = join(tmp, "memory"); mkdirSync(memDir);
  writeFileSync(join(memDir, "MEMORY.md"), "- [A](a.md) — hook\n");
  writeFileSync(join(memDir, "a.md"), "x"); writeFileSync(join(memDir, "b.md"), "y");
  const mc = memoryIndexCheck({ dir: memDir });
  assert("MEMORY-INDEX RATCHET — an unindexed memory file is a RED (a fact the organism has and cannot reach)",
    mc.ok === false && mc.unindexed.join() === "b.md");
  writeFileSync(join(memDir, "MEMORY.md"), "- [A](a.md)\n- [B](b.md)\n");
  assert("...and indexing it clears the red", memoryIndexCheck({ dir: memDir }).ok === true);
  assert("MEMORY-INDEX · UNREACHABLE DIR measures nothing and claims nothing (never a fake green-or-red)",
    memoryIndexCheck({ dir: join(tmp, "no-such") }).unreachable === true);

  writeFileSync(join(tmp, "src.md"), "# THING v2.2\n"); writeFileSync(join(tmp, "der.md"), "derived from THING v2.1\n");
  upsertRow("derived_copies", { subject: "thing→derived", source_file: "src.md", derived_file: "der.md", witness: "selftest", source_version_re: "v(\\d+\\.\\d+)", declared_version_re: "v(\\d+\\.\\d+)" }, { path: P });
  const dc = derivedCopyCheck({ path: P, root: tmp });
  assert("§7 · SPEC→DERIVED-COPY — versions extracted LIVE from both files; unequal = drifted",
    dc.length === 1 && dc[0].drifted === true && dc[0].source_version === "2.2" && dc[0].declared_version === "2.1");

  // laws register from a fixture queue + a fixture order.
  const qDir = join(tmp, "queue"); mkdirSync(qDir);
  writeFileSync(join(qDir, "RULING__2026-08-29_x.md"), "# RULING — the fixture law\nbody\n");
  const orderFx = join(tmp, "order.md");
  writeFileSync(orderFx, "### §10-D · THE STANDING RULES\n\n1. Open THIS file first.\n2. The ceiling is a STOP.\n### §10-E · x\n");
  const lc = collectLaws({ queueDir: qDir, orderPath: orderFx, out: join(tmp, "laws_register.json") });
  const lr = JSON.parse(readFileSync(join(tmp, "laws_register.json"), "utf8"));
  assert("STANDING-LAWS REGISTER — DERIVED from the ruling files + §10-D; 1 ruling + 2 rules collected",
    lc.ok === true && lr.count === 3 && lr.laws[0].law_id === "RULING__2026-08-29_x" && lr.laws.some((l) => l.law_id === "10D-1"));
  assert("...and an unreachable queue is NAMED, never invented around",
    collectLaws({ queueDir: join(tmp, "no-queue"), orderPath: orderFx, out: join(tmp, "laws2.json") }).queue_reachable === false);

  const rul = addRuling({ text: "fixture ruling — build the thing as data", scope: "architecture", path: P, exec: () => ({ status: 0, stdout: "filed" }) });
  assert("RULINGS LANE — his word lands as a dated row with scope as a FIELD (C2: never a second lane) + ONE card",
    rul.ok === true && rul.card === "filed" && tableRows("rulings", P).length === 1);
  assert("...and an unknown scope is refused", addRuling({ text: "x", scope: "vibes", path: P }).ok === false);

  assert("SELF-HEALING POSTURE (spec §13) — a self_repair row without declared reversibility + report anchor is NOT eligible (red)",
    (() => { upsertRow("self_repair", { subject: "sr1", artifact: "poster", verified_by: "render check", report_anchor: "", witness: "w", reversible: true }, { path: P }); return false; })() || (() => {
      upsertRow("self_repair", { subject: "sr1", artifact: "poster", verified_by: "render check", report_anchor: "the wall", witness: "w", reversible: false }, { path: P });
      const red1 = redRows(P).some((r) => r.subject === "sr1");
      upsertRow("self_repair", { subject: "sr1", artifact: "poster", verified_by: "render check", report_anchor: "the wall", witness: "w", reversible: true }, { path: P });
      return red1 && !redRows(P).some((r) => r.subject === "sr1");
    })());

  const spine = bookSpine({ path: P });
  assert("R5 · THE BOOK SPINE — a derived render over the rows, counts live-read (no hand-written twin)",
    /THE ORGANISM BOOK/.test(spine) && /interruption_types/.test(spine) && /DERIVED from registry.json/.test(spine));

  // slotPassed over a planted row.
  upsertRow("mechanisms", { subject: "team_sheet", schema_owner: "conductor.mjs", witness: "selftest", slot: { after: "07:30" } }, { path: P });
  assert("SLOT-AWARENESS (#6) — before the producer's slot the answer is false, after it true, and an undeclared subject is null (caller keeps its old behaviour and says so)",
    slotPassed("team_sheet", new Date("2026-08-29T06:00:00"), P) === false
    && slotPassed("team_sheet", new Date("2026-08-29T08:00:00"), P) === true
    && slotPassed("no_such_producer", new Date(), P) === null);

  upsertRow("sandbox_subjects", { subject: "samjhao_ledger", env_pin: "ARSENAL_SAMJHAO_LEDGER", schema_owner: "samjhao.mjs", witness: "samjhao.mjs:103" }, { path: P });
  assert("SANDBOX PINNING (#7) — the pin table answers which env var sandboxes a ledger",
    (fixturePin("samjhao_ledger", P) || {}).env_pin === "ARSENAL_SAMJHAO_LEDGER");

  // backfill transformer over a fixture RAW_FACTS: markers grade, absence skips, nothing invented.
  const rf = join(tmp, "RAW_FACTS.jsonl");
  writeFileSync(rf, [
    JSON.stringify({ ts: "2026-08-22T03:00:00Z", kind: "check", topic_axis: "tokenization/a", text: "CHECK 1 — hand count. HIS: 13. CORRECT first try." }),
    JSON.stringify({ ts: "2026-08-22T03:05:00Z", kind: "check", topic_axis: "tokenization/b", text: "CHECK 2 — HIS: 3. CORRECT ANSWER: 2. WRONG, but the reasoning is useful." }),
    JSON.stringify({ ts: "2026-08-22T03:06:00Z", kind: "check", topic_axis: "tokenization/b", text: "CHECK 7 — He opened with \"no idea\" and then derived a correct answer. CORRECT first try." }),
    JSON.stringify({ ts: "2026-08-22T03:07:00Z", kind: "check", topic_axis: "tokenization/a", text: "CHECK 5 — <pad>. SKIPPED, on his own call." }),
    JSON.stringify({ ts: "2026-08-22T03:08:00Z", kind: "fumble", topic_axis: "tokenization/b", text: "FUMBLE — HIS WORDS: i did not understand." }),
    JSON.stringify({ ts: "2026-08-22T03:09:00Z", kind: "his_ruling", topic_axis: "tokenization/-", text: "capture EVERY block of EVERY learning session, verbatim." }),
    JSON.stringify({ ts: "2026-08-22T03:10:00Z", kind: "check", topic_axis: "tokenization/c", text: "CHECK — a row with no verdict marker at all in it." }),
  ].join("\n"));
  const bf = backfillPlan({ rawPath: rf });
  assert("C4 · BACK-FILL TRANSFORMER — only the sessions' own verdict markers grade a row; correct/incorrect land, SKIPPED and marker-less rows are NAMED skips, nothing is invented",
    bf.reps.length === 3 && bf.reps[0].correct === true && bf.reps[1].correct === false
    && bf.skipped.some((s) => /SKIPPED/.test(s.why)) && bf.skipped.some((s) => /invention/.test(s.why)));
  assert("C4 · CONFIDENCE FROM HIS WORDS ONLY — \"no idea\" maps to guessed; silence maps to nothing (the E1 escalation owns the null shape)",
    bf.reps[2].confidence === "guessed" && bf.reps[0].confidence === null);
  assert("C4 · HIS RULINGS ROUTE TO THE RULINGS LANE, never to reps", bf.rulings.length === 1 && /verbatim/.test(bf.rulings[0].text));
  assert("C4 · AN UNREACHABLE SOURCE IS NAMED, NOT GUESSED AROUND", backfillPlan({ rawPath: join(tmp, "nope.jsonl") }).reachable === false);

  assert("ATOMIC WRITE — the registry file is whole JSON after every op (temp→rename, no torn state)",
    (() => { try { return !!JSON.parse(readFileSync(P, "utf8")).tables; } catch { return false; } })());
  assert("CORRUPT REGISTRY REFUSES WRITES — never silently rebuilt over",
    (() => { const C = join(tmp, "corrupt.json"); writeFileSync(C, "{not json"); return upsertRow("mechanisms", { subject: "x", schema_owner: "x.mjs", witness: "w" }, { path: C }).ok === false; })());

  try { rmSync(tmp, { recursive: true, force: true }); } catch { /* best effort */ }
  console.log(`\nregistry selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

// ── the entrypoint guard (F-06) — importing this module runs NOTHING ─────────
const INVOKED_DIRECTLY = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
const verb = process.argv[2] || "status";
const argOf = (flag) => { const i = process.argv.indexOf(flag); return i > -1 ? process.argv[i + 1] : null; };
if (!INVOKED_DIRECTLY) { /* imported for its readers — run NOTHING */ }
else if (verb === "selftest") { process.exit(selftest() ? 0 : 1); }
else if (verb === "get") {
  const t = argOf("--table"), s = argOf("--subject");
  console.log(JSON.stringify(s ? rowOf(t, s) : tableRows(t), null, 1));
} else if (verb === "set") {
  let row; try { row = JSON.parse(argOf("--json") || "null"); } catch { row = null; }
  const r = upsertRow(argOf("--table"), row);
  console.log(JSON.stringify(r)); process.exit(r.ok ? 0 : 1);
} else if (verb === "retire") {
  const r = retireRow(argOf("--table"), argOf("--subject"), argOf("--why"));
  console.log(JSON.stringify(r)); process.exit(r.ok ? 0 : 1);
} else if (verb === "meter") {
  const r = meter({});
  if (process.argv.includes("--json")) console.log(JSON.stringify(r, null, 1));
  else console.log(`registry: metered ${r.metered} lane(s) — ${r.report.filter((x) => x.first_real_row_at).length} fed · ${r.report.filter((x) => !x.first_real_row_at).length} never fed`);
} else if (verb === "check") {
  const r = runChecks({});
  if (process.argv.includes("--json")) console.log(JSON.stringify(r, null, 1));
  else {
    for (const red of r.reds) console.log(`RED  ${red}`);
    for (const n of r.notes) console.log(`  ·  ${n}`);
    console.log(`registry check: ${r.ok ? "GREEN" : `${r.reds.length} RED`} · ${r.born_red.length} born-red row(s)`);
  }
  process.exit(r.ok ? 0 : 1);
} else if (verb === "laws") {
  const sub = process.argv[3] || "collect";
  if (sub === "collect") { const r = collectLaws({}); console.log(`laws register: ${r.count} law(s) → ${r.out}${r.queue_reachable ? "" : " (QUEUE UNREACHABLE — collected from the order alone)"}`); process.exit(r.ok ? 0 : 1); }
  else { const r = collectLaws({ save: false }); console.log(`laws check: ${r.count} collectable · queue ${r.queue_reachable ? "reachable" : "UNREACHABLE"}`); }
} else if (verb === "rulings") {
  if (process.argv[3] !== "add") { console.log(JSON.stringify(tableRows("rulings"), null, 1)); }
  else {
    let text = ""; try { text = readFileSync(0, "utf8"); } catch { text = ""; }
    const r = addRuling({ text, scope: argOf("--scope"), by: argOf("--by") || "captain", at: argOf("--at") || nowISO(), source: argOf("--source") || "cli", card: !process.argv.includes("--no-card") });
    console.log(JSON.stringify(r)); process.exit(r.ok ? 0 : 1);
  }
} else if (verb === "book") {
  const out = argOf("--out");
  const spine = bookSpine({});
  if (out) { writeFileSync(out, spine); console.log(`book spine → ${out}`); } else console.log(spine);
} else if (verb === "backfill") {
  const plan = backfillPlan({});
  console.log(JSON.stringify({ source: plan.source, reachable: plan.reachable, reps: plan.reps.length, skipped: plan.skipped.length, rulings: plan.rulings.length, rejirah: plan.rejirah }, null, 1));
  if (process.argv.includes("--commit")) {
    console.log("backfill --commit is HELD on the E1 escalation ruling (queue\\ESCALATION__2026-08-29_s10-backfill.md) — the ingestion shape (confidence:null) is the architect's call, not this CLI's.");
    process.exit(2);
  }
  if (process.argv.includes("--receipt")) {
    for (const s of plan.skipped) console.log(`skip: ${s.ts || "?"} ${s.kind || "?"} — ${s.why}`);
    for (const r of plan.reps) console.log(`rep:  ${r.ts} ${r.concept}/${r.axis || "-"} correct=${r.correct} confidence=${r.confidence || "(unrecorded)"}`);
  }
} else {
  const reg = loadRegistry();
  const tables = Object.entries(reg.tables || {}).map(([k, v]) => `${k} ${v.filter((r) => r && !r.retired).length}`).join(" · ") || "EMPTY (no rows seeded yet)";
  const reds = reg.missing ? [] : redRows();
  console.log(`registry: ${reg.missing ? "MISSING — no registry.json yet" : tables}${reds.length ? ` · ${reds.length} born-red` : ""} · updated ${reg.updated_at || "never"}`);
}
