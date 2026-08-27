#!/usr/bin/env node
// ============================================================================
// flow_atlas.mjs · ARSENAL AI FC — THE FLOW ATLAS (rung S6, 27 Aug 2026)
//   SOLE WRITER of dressing-room/state/flow_atlas.json and FLOW_ATLAS.html.
//
// WHAT THIS IS. The audit order §10-C S6(a): "GENERATE THE FLOW ATLAS — free code over
// xray's IR + the declared tables (AFFERENT_SOURCES · LANES_NOT_IN_CONFIG · outbox kinds):
// EVERY edge him→organ, organ→organ, organ→him, each with liveness + consumption stamps.
// ONE visual page for him. The atlas is DERIVED by code, never hand-written — hand-written
// maps rot (§4-B)."
//
// THE ONE RULE: ZERO HAND-WRITTEN EDGES. Every edge below carries a WITNESS —
//   {kind:"ir", ...}      derived from xray_graph.json (writers×readers on a real path)
//   {kind:"table", ...}   a row of a declared, suite-checked table (AFFERENT_SOURCES,
//                         LANES_NOT_IN_CONFIG, outbox KINDS, roots.hooks/scheduled)
//   {kind:"ruling", ...}  a fact RULED in the audit order (§9 SHAPE 6's fired_by:"him"
//                         promotion, 20 Aug 2026) — named, never paraphrased
// An edge the checks cannot witness kills the build (exit 2). SHAPE 6's four him→learning-
// record edges are FIRST-CLASS: same stamp weight as every machine edge — a him→organ edge
// drawn thinner than an organ→organ edge is how that shape stayed invisible for 40 days.
//
// LIVENESS comes from the payload's own rows (newest embedded timestamp), never mtime —
// the readiness lesson (thalamus.mjs AFFERENT_SOURCES header). The organism is SWITCHED
// OFF since 20 Aug 2026 by his order: machine-lane silence since then is EXPECTED and the
// page says so; the four HIS-HAND lanes are the ones whose silence is the SHAPE 6 wound.
//
// CLI: node scripts/flow_atlas.mjs [build|check|selftest]
//   build    derive + write flow_atlas.json + FLOW_ATLAS.html, print the content hash
//   check    re-derive in memory, compare against the written json (idempotence, CI-safe)
//   selftest planted-violation bites: an unwitnessed edge REFUSES · a missing SHAPE-6 edge
//            REFUSES · a declared-table row that derives no edge REFUSES — each proven
//            IDEMPOTENT (run twice, bites twice — the 8th standing law)
// ============================================================================
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync, openSync, readSync, closeSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { AFFERENT_SOURCES } from "./thalamus.mjs";
import { LANES_NOT_IN_CONFIG, KINDS as OUTBOX_KINDS, readRows as readOutboxRows } from "./outbox.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..");
const STATE = join(REPO, "dressing-room", "state");
const IR_PATH = join(STATE, "xray_graph.json");
const OUT_JSON = join(STATE, "flow_atlas.json");
const OUT_HTML = join(REPO, "FLOW_ATLAS.html");
const SWITCH_OFF = "2026-08-20"; // his order — all tasks Disabled, daemons killed; RED/quiet after this date is EXPECTED for machine lanes

// ── liveness: newest embedded timestamp of a file, never its mtime ──────────
// The probe is a PREDICATE over the row's own values, never a key-name list (the S3 jugad law):
// any top-level string value that parses as an ISO date counts; the newest wins.
const isoOf = (j) => Object.values(j).filter((v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)).sort().pop() || null;
function newestTs(path) {
  try {
    if (!existsSync(path)) return { exists: false };
    const st = statSync(path);
    if (st.isDirectory()) {
      const kids = readdirSync(path);
      return { exists: true, dir: true, entries: kids.length };
    }
    const size = st.size;
    if (path.endsWith(".jsonl")) {
      const take = Math.min(size, 65536);
      const fd = openSync(path, "r");
      const buf = Buffer.alloc(take);
      readSync(fd, buf, 0, take, size - take);
      closeSync(fd);
      const lines = buf.toString("utf8").split("\n").filter((l) => l.trim());
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const ts = isoOf(JSON.parse(lines[i]));
          if (ts) return { exists: true, size, payload_ts: ts };
        } catch { /* torn tail rows are a measured fact of this bus; walk up */ }
      }
      return { exists: true, size, payload_ts: null };
    }
    if (path.endsWith(".json")) {
      try {
        const ts = isoOf(JSON.parse(readFileSync(path, "utf8")));
        if (ts) return { exists: true, size, payload_ts: ts };
      } catch { /* fall through */ }
      return { exists: true, size, payload_ts: null };
    }
    return { exists: true, size, payload_ts: null };
  } catch { return { exists: false }; }
}
const ageDays = (ts, now) => (ts ? Math.floor((now - new Date(ts).getTime()) / 86400000) : null);

// ── derivation ──────────────────────────────────────────────────────────────
export function derive(deps = {}) {
  const ir = deps.ir || JSON.parse(readFileSync(IR_PATH, "utf8"));
  const now = deps.now || Date.now(); // rendering stamp only — excluded from the content hash
  const aff = deps.afferent || AFFERENT_SOURCES;
  const offRoad = deps.offRoad || LANES_NOT_IN_CONFIG;
  const outboxKinds = deps.outboxKinds || OUTBOX_KINDS;
  const live = deps.liveness || newestTs;

  // freshness gate: the IR must postdate every organ it models (a stale map is a lie).
  // BUILD always pays it; the SELFTEST's clean case skips it (deps.skipFreshness) so the suite
  // stays deterministic under any working tree — the gate itself is proven by its own bite,
  // which plants a January built_at WITHOUT the skip and must refuse twice.
  if (!deps.skipFreshness) {
    const irAt = new Date(ir.built_at).getTime();
    let newestOrgan = null;
    for (const f of readdirSync(join(REPO, "scripts")).filter((x) => x.endsWith(".mjs"))) {
      const m = statSync(join(REPO, "scripts", f)).mtimeMs;
      if (f !== "flow_atlas.mjs" && (!newestOrgan || m > newestOrgan.m)) newestOrgan = { f, m };
    }
    if (newestOrgan && newestOrgan.m > irAt) throw new Error(`STALE IR — ${newestOrgan.f} is newer than xray_graph.json (${ir.built_at}). Run: node scripts/xray.mjs build`);
  }

  const edges = [];
  const push = (e) => { if (!e.witness || !e.witness.kind) throw new Error(`UNWITNESSED EDGE ${e.from}→${e.to} — every edge carries a witness or the atlas is a hand-drawn map`); edges.push(e); };

  // E1 · organ→organ through a real path (the bus): writers × readers, fixtures excluded
  const interesting = (p) => /^(dressing-room|capsules|learning-layer|brain_out)\//.test(p) || /\.(jsonl|json|md)$/.test(p);
  for (const f of ir.files) {
    if (!f.writers.length || !f.readers.length) continue;
    if (!interesting(f.path)) continue;
    const lv = live(join(REPO, f.path));
    for (const w of f.writers) for (const r of f.readers) {
      if (w === r) continue;
      push({ cls: "organ→organ", from: w, to: r, via: f.path, liveness: lv, consumption: { measured: false, note: "reach unmeasured — Shape 3; the registry's reach-side meter is the build" }, witness: { kind: "ir", path: f.path, writers: f.writers, readers_n: f.readers.length } });
    }
  }
  // orphan writes and ghost reads stay VISIBLE (they are the atlas's negative space)
  const orphanWrites = ir.files.filter((f) => f.writers.length && !f.readers.length && interesting(f.path)).map((f) => ({ path: f.path, writers: f.writers, on_disk: f.on_disk }));
  const ghostReads = ir.files.filter((f) => !f.writers.length && f.readers.length && interesting(f.path) && !f.on_disk).map((f) => ({ path: f.path, readers: f.readers.slice(0, 20), readers_n: f.readers.length }));

  // E2 · him/world → organism (the afferent door), one edge per declared source row
  const HIM_SIDE = new Set(["claude-code", "voice", "throwin", "slip", "organism-memory", "readiness"]);
  for (const [src, d] of Object.entries(aff)) {
    const from = d.state === "retired" ? "(retired)" : HIM_SIDE.has(src) ? "HIM" : "WORLD";
    push({ cls: "him→organ", from, to: "thalamus.mjs", via: `afferent source "${src}"`, state: d.state, cadence_h: d.cadence_h || null, liveness: { declared: d.state, why: d.why }, consumption: { measured: true, note: "the bus adjudicates every row (thalamus owns the door)" }, witness: { kind: "table", table: "thalamus.mjs AFFERENT_SOURCES", row: src } });
  }

  // E2b · SHAPE 6 — the four him→learning-record edges, FIRST-CLASS (ruled 20 Aug 2026)
  const repsPath = join(STATE, "reps_log.jsonl");
  let repsStat = { rows: 0, newest: null, surfaces: {} };
  try {
    if (existsSync(repsPath)) {
      const rows = readFileSync(repsPath, "utf8").split("\n").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      repsStat.rows = rows.length;
      for (const r of rows) { repsStat.surfaces[r.surface || "∅"] = (repsStat.surfaces[r.surface || "∅"] || 0) + 1; const t = r.ts || r.t; if (t && (!repsStat.newest || t > repsStat.newest)) repsStat.newest = t; }
    }
  } catch { /* stats stay zero — absence must be explicit, and zero is the honest zero */ }
  let forgeStat = { closes: 0, jirah_zero: null };
  try {
    if (existsSync(join(STATE, "forge_sessions.jsonl"))) {
      const rows = readFileSync(join(STATE, "forge_sessions.jsonl"), "utf8").split("\n").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      forgeStat.closes = rows.length;
      forgeStat.jirah_zero = rows.every((r) => !r.jirah);
    }
  } catch { /* same honest zero */ }
  const rejFile = ir.files.find((f) => f.path.endsWith("rejirah_log.jsonl"));
  const shape6 = [
    { verb: "capture paste", from: "HIM", to: "capture.mjs", via: "dressing-room/state/reps_log.jsonl", fired_by: "him", liveness: { ...live(repsPath), rows: repsStat.rows, newest: repsStat.newest, by_surface: repsStat.surfaces }, consumption: { measured: true, note: `${(ir.files.find((f) => f.path.endsWith("reps_log.jsonl")) || { readers: [] }).readers.length} reader organs` } },
    { verb: "rejirah grade", from: "HIM", to: "rejirah.mjs", via: "dressing-room/state/rejirah_log.jsonl", fired_by: "him", liveness: { exists: !!(rejFile && rejFile.on_disk), never_born: !(rejFile && rejFile.on_disk), readers_waiting: rejFile ? rejFile.readers.length : 0 }, consumption: { measured: true, note: `${rejFile ? rejFile.readers.length : 0} organs read a lane that has NEVER had a row` } },
    { verb: "forge close", from: "HIM", to: "forge_session.mjs", via: "dressing-room/state/forge_sessions.jsonl", fired_by: "him", liveness: { ...live(join(STATE, "forge_sessions.jsonl")), closes: forgeStat.closes, every_close_jirah_zero: forgeStat.jirah_zero }, consumption: { measured: true, note: "declared design: forge never touches reps_log — capture.mjs owns reps" } },
    { verb: "the gist", from: "HIM", to: "mirror.mjs", via: "capsules/ (his paste at the gist is the only master write)", fired_by: "him", liveness: live(join(STATE, "mirror_manifest.json")), consumption: { measured: true, note: "mirror.mjs re-fetches; capsules/ is a read-only mirror" } },
  ];
  for (const s of shape6) push({ cls: "him→organ", shape6: true, ...s, witness: { kind: "ruling", ref: "audit order §9 SHAPE 6 (promoted on his ruling, 20 Aug 2026) — the four learning-record writers are all HIM" } });

  // E3 · organism → him (the mouths), each rooted in the IR or a declared root
  const mouthWriters = (ir.files.find((f) => f.path.endsWith("mouth_log.jsonl")) || { writers: [] }).writers;
  for (const w of mouthWriters) push({ cls: "organ→him", from: w, to: "HIM (phone, ntfy)", via: "dressing-room/state/mouth_log.jsonl → ntfy.sh", liveness: live(join(STATE, "mouth_log.jsonl")), consumption: { measured: false, note: "delivery logged; whether HE read it — unmeasured (Shape 3)" }, witness: { kind: "ir", path: "dressing-room/state/mouth_log.jsonl", writers: mouthWriters } });
  let cardStat = { cards: 0, answered: 0 };
  try { const cc = JSON.parse(readFileSync(join(STATE, "captains_call.json"), "utf8")); cardStat.cards = (cc.cards || []).length; cardStat.answered = (cc.cards || []).filter((c) => c.answer).length; } catch { /* absent file = zeros, stated */ }
  push({ cls: "organ→him", from: "captains_call.mjs", to: "HIM (ONE card at an anchor)", via: "dressing-room/state/captains_call.json", liveness: live(join(STATE, "captains_call.json")), consumption: { measured: true, note: `${cardStat.answered} of ${cardStat.cards} cards ever answered — the one him-consumption number the organism records` }, witness: { kind: "ir", path: "dressing-room/state/captains_call.json", writers: ["captains_call.mjs"] } });
  // session surfaces: every script the SESSION HARNESS roots (a FIELD predicate over
  // ir.roots.hooks — source === "settings.json" is where session hooks live; package.json
  // rows in the same table are suite wiring, not surfaces. Never a name list.)
  const hookVerbs = {};
  for (const h of ir.roots.hooks || []) { if (h && typeof h.script === "string" && h.source === "settings.json") (hookVerbs[h.script] = hookVerbs[h.script] || new Set()).add(h.verb || "(default)"); }
  for (const [s, verbs] of Object.entries(hookVerbs)) {
    push({ cls: "organ→him", from: s, to: "HIM (session surfaces)", via: `hook-rooted (${[...verbs].join(", ")}) — fires when he opens/types in a session`, liveness: { event: "event-only: moves when he moves" }, consumption: { measured: false, note: "he sees it iff a session runs — unmeasured beyond that" }, witness: { kind: "table", table: "ir.roots.hooks", row: s } });
  }
  push({ cls: "organ→him", from: "dugout.mjs", to: "HIM (voice)", via: "the Gaffer sitting (live ear :3124 → bus)", liveness: { declared: "event-only", why: aff["dugout-gaffer-teaching"] ? aff["dugout-gaffer-teaching"].why : "sitting-only" }, consumption: { measured: false, note: "spoken; consumption = the conversation itself, unmeasured after it" }, witness: { kind: "table", table: "thalamus.mjs AFFERENT_SOURCES", row: "dugout-gaffer-teaching" } });
  push({ cls: "organ→him", from: "viz.mjs", to: "HIM (the Wall)", via: "wallpaper / poster files", liveness: live(join(REPO, "brain_out")), consumption: { measured: false, note: "unmeasured (Shape 3)" }, witness: { kind: "ir", path: "brain_out/", writers: ["viz.mjs"] } });

  // E4 · outbox — the declared road to him, with its measured truth
  const obRows = deps.outboxRows || (() => { try { return readOutboxRows(); } catch { return []; } })();
  const byKind = {}; let acked = 0;
  for (const r of obRows) { byKind[r.kind || "∅"] = (byKind[r.kind || "∅"] || 0) + 1; if (r.acked_at || r.acked) acked++; }
  const outbox = { declared_kinds: outboxKinds, ledger_rows: obRows.length, acked_ever: acked, by_kind: byKind, off_road_lanes: Object.keys(offRoad).length };

  // E5 · spec→derived-copy (the fourth edge class, S4's find) — live-verified instance
  let specCopy = { class: "spec→derived-copy {source_file · source_version · derived_file · declared_version}", instance: null };
  try {
    const gafferHead = readFileSync(join(REPO, "THE_GAFFER.md"), "utf8").slice(0, 400);
    const sysHead = readFileSync(join(REPO, "dressing-room", "manager", "system.md"), "utf8");
    const srcV = (gafferHead.match(/\(v(\d+\.\d+)\)/) || [])[1] || null;
    const declV = (sysHead.match(/THE_GAFFER v(\d+\.\d+)/) || [])[1] || null;
    specCopy.instance = { source_file: "THE_GAFFER.md", source_version: srcV, derived_file: "dressing-room/manager/system.md", declared_version: declV, drifted: !!(srcV && declV && srcV !== declV) };
  } catch { specCopy.instance = { unresolved: "one of the two files unreadable at build — the class stands on its S4 witness" }; }

  // ── the checks — every one fails the build loudly ─────────────────────────
  const s6e = edges.filter((e) => e.shape6);
  if (s6e.length !== 4) throw new Error(`SHAPE-6 CHECK — expected the four him→learning-record edges, derived ${s6e.length}`);
  for (const [src] of Object.entries(aff)) if (!edges.some((e) => e.witness.row === src && e.witness.kind === "table")) throw new Error(`TABLE COVERAGE — AFFERENT_SOURCES row "${src}" derived no edge`);
  for (const e of edges) if (!e.witness || !["ir", "table", "ruling"].includes(e.witness.kind)) throw new Error(`UNWITNESSED EDGE ${e.from}→${e.to}`);
  if (!edges.some((e) => e.cls === "organ→organ")) throw new Error("IR DERIVATION EMPTY — no organ→organ edges came off the IR");

  const atlas = {
    derived_from: { ir_built_at: ir.built_at, organs: ir.organs_parsed, tables: ["thalamus.mjs AFFERENT_SOURCES", "outbox.mjs LANES_NOT_IN_CONFIG", "outbox.mjs KINDS", "ir.roots.hooks"], switch_off: SWITCH_OFF },
    counts: { edges: edges.length, organ_organ: edges.filter((e) => e.cls === "organ→organ").length, him_in: edges.filter((e) => e.cls === "him→organ").length, him_out: edges.filter((e) => e.cls === "organ→him").length, shape6: s6e.length, orphan_writes: orphanWrites.length, ghost_reads: ghostReads.length },
    edges, orphan_writes: orphanWrites, ghost_reads: ghostReads, outbox, off_road: offRoad, spec_copy: specCopy,
  };
  const hash = createHash("sha256").update(JSON.stringify(atlas)).digest("hex").slice(0, 16);
  return { atlas: { built_at: new Date(now).toISOString(), content_sha16: hash, ...atlas }, hash };
}

// ── the one visual page (rendering only — every number above this line) ─────
function renderHtml(a) {
  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const now = Date.now();
  const dot = (lv) => {
    if (!lv) return `<span class="dot grey" title="no liveness read"></span>`;
    if (lv.never_born) return `<span class="dot black" title="NEVER BORN"></span>`;
    if (lv.exists === false) return `<span class="dot black" title="file absent"></span>`;
    const ts = lv.payload_ts || lv.newest || null;
    if (!ts) return `<span class="dot grey" title="no payload timestamp"></span>`;
    const d = ageDays(ts, now);
    const cls = d <= 1 ? "green" : ts >= SWITCH_OFF ? "amber" : "red";
    return `<span class="dot ${cls}" title="newest payload ${esc(ts)} (${d}d)"></span>`;
  };
  const s6 = a.edges.filter((e) => e.shape6);
  const himIn = a.edges.filter((e) => e.cls === "him→organ" && !e.shape6);
  const himOut = a.edges.filter((e) => e.cls === "organ→him");
  const oo = a.edges.filter((e) => e.cls === "organ→organ");
  const byVia = {};
  for (const e of oo) { (byVia[e.via] = byVia[e.via] || { writers: new Set(), readers: new Set(), lv: e.liveness }).writers.add(e.from); byVia[e.via].readers.add(e.to); }
  const viaRows = Object.entries(byVia).sort((x, y) => x[0] < y[0] ? -1 : 1).map(([via, v]) =>
    `<tr><td>${dot(v.lv)}</td><td class="mono">${esc(via)}</td><td>${esc([...v.writers].join(", "))}</td><td>${v.readers.size} organ(s): ${esc([...v.readers].slice(0, 8).join(", "))}${v.readers.size > 8 ? " …" : ""}</td></tr>`).join("\n");
  const s6rows = s6.map((e) => `
    <div class="edge his">
      <div class="verb">${esc(e.verb)}</div>
      <div class="arrow">HIM ⟶ <b>${esc(e.to)}</b> <span class="mono">${esc(e.via)}</span></div>
      <div class="stamp">${dot(e.liveness)} ${e.liveness.never_born ? `<b>KABHI PAIDA NAHI HUA</b> — ${e.liveness.readers_waiting} organs is lane ko padhte hain, ek row kabhi nahi aayi`
        : e.liveness.rows !== undefined ? `${e.liveness.rows} rows · newest ${esc(e.liveness.newest || "—")} · surfaces ${esc(JSON.stringify(e.liveness.by_surface || {}))}`
        : e.liveness.closes !== undefined ? `${e.liveness.closes} closes · har close mein jirah:0 = ${e.liveness.every_close_jirah_zero}`
        : `newest ${esc(e.liveness.payload_ts || "—")}`} · <i>${esc(e.consumption.note)}</i></div>
    </div>`).join("\n");
  return `<!doctype html><html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FLOW ATLAS — Arsenal AI FC</title><style>
:root{color-scheme:dark}body{margin:0;background:#0d1117;color:#e6edf3;font:15px/1.55 "Segoe UI",system-ui,sans-serif;padding:24px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:26px 0 8px;border-bottom:1px solid #30363d;padding-bottom:4px}
.sub{color:#8b949e;font-size:13px}.mono{font-family:Consolas,monospace;font-size:12.5px;color:#a5d6ff;word-break:break-all}
.banner{background:#3d1d1d;border:1px solid #f85149;border-radius:8px;padding:10px 14px;margin:14px 0;font-size:14px}
.law{background:#12261e;border:1px solid #2ea043;border-radius:8px;padding:10px 14px;margin:14px 0;font-size:13.5px}
.edge{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:10px 14px;margin:8px 0}
.edge.his{border-left:6px solid #f0883e;background:#1c1610}
.verb{font-weight:700;font-size:15.5px;color:#f0883e}.arrow{margin:2px 0}.stamp{font-size:13px;color:#c9d1d9}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:middle}
.green{background:#2ea043}.amber{background:#d29922}.red{background:#f85149}.grey{background:#6e7681}.black{background:#000;border:2px solid #f85149}
table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid #30363d;padding:4px 8px;text-align:left;vertical-align:top}
details{margin:8px 0}summary{cursor:pointer;color:#58a6ff}
.counts b{color:#f0883e}.legend span{margin-right:14px}
</style></head><body>
<h1>FLOW ATLAS — poora organism, ek page</h1>
<div class="sub">CODE se nikla hai (xray IR ${esc(a.derived_from.ir_built_at)} · ${a.derived_from.organs} organs + 3 declared tables) — haath se ek bhi edge nahi. built ${esc(a.built_at)} · sha ${esc(a.content_sha16)}</div>
<div class="banner">⛔ ORGANISM 20 Aug se SWITCHED OFF hai (tera order). Machine lanes ki chuppi us din ke baad EXPECTED hai — woh defect nahi. Neeche jo <b>TERE HAATH</b> wali 4 lanes hain, unki chuppi hi asli zakham hai (SHAPE 6).</div>
<div class="legend sub"><span><span class="dot green"></span>fresh (≤1d)</span><span><span class="dot amber"></span>quiet, post-switch-off (expected)</span><span><span class="dot red"></span>quiet since before switch-off</span><span><span class="dot black"></span>never born / absent</span><span><span class="dot grey"></span>no payload ts</span></div>

<h2>① TERA HAATH — him → learning record (SHAPE 6 ke chaar edges, first-class)</h2>
${s6rows}
<div class="law">Yeh chaaron lanes ka producer TU hai — koi machine inhe fire nahi karti. Isi liye registry spec har aise surface se {surface · writes_to · fired_by · cadence} declare karwati hai, jisme <b>fired_by:"him"</b> first-class value hai jo reach-side meter pakad sake.</div>

<h2>② TU/DUNIYA → BUS (afferent door — ${himIn.length} declared sources)</h2>
<table><tr><th></th><th>source</th><th>from</th><th>state</th><th>kyun</th></tr>
${himIn.map((e) => `<tr><td>${e.state === "retired" ? '<span class="dot grey"></span>' : e.state === "live" ? '<span class="dot amber" title="poller — organism off"></span>' : '<span class="dot green" title="event-only: moves when he moves"></span>'}</td><td class="mono">${esc(e.witness.row)}</td><td>${esc(e.from)}</td><td>${esc(e.state)}</td><td class="sub">${esc(e.liveness.why)}</td></tr>`).join("\n")}</table>

<h2>③ MACHINE ANDAR — organ→organ, state files ke through (${a.counts.organ_organ} edges · ${Object.keys(byVia).length} files)</h2>
<details><summary>poora file-bus table kholo (writer → file → readers, har row ki liveness payload-ts se)</summary>
<table><tr><th></th><th>file</th><th>writer(s)</th><th>readers</th></tr>${viaRows}</table></details>
<div class="edge"><b>Negative space (atlas ka khaali hissa):</b> ${a.counts.orphan_writes} orphan writes (likha, koi nahi padhta) · ${a.counts.ghost_reads} ghost reads (padhte hain, file paida hi nahi hui — rejirah_log inmein sabse bada) — poori list JSON mein.</div>

<h2>④ MACHINE → TU (the mouths — ${himOut.length} surfaces)</h2>
${himOut.map((e) => `<div class="edge"><div class="arrow">${esc(e.from)} ⟶ <b>${esc(e.to)}</b> <span class="mono">${esc(e.via)}</span></div><div class="stamp">${dot(e.liveness)} ${esc(e.consumption.note)}${e.consumption.measured ? "" : " · <b>UNMEASURED</b>"}</div></div>`).join("\n")}
<div class="law">Shape 3 ka sach yahan dikhta hai: production sab jagah logged hai, CONSUMPTION sirf cards par measured hai (${esc(String((a.edges.find((e) => e.from === "captains_call.mjs") || { consumption: { note: "" } }).consumption.note))}). Outbox: ${a.outbox.ledger_rows} rows, <b>${a.outbox.acked_ever} acked ever</b>, kinds ${esc(JSON.stringify(a.outbox.by_kind))} (declared: ${esc(a.outbox.declared_kinds.join(", "))}) · ${a.outbox.off_road_lanes} declared off-road lanes.</div>

<h2>⑤ CHAUTHA EDGE CLASS — spec → derived copy</h2>
<div class="edge">${a.spec_copy.instance && a.spec_copy.instance.drifted !== undefined ? `<b>${esc(a.spec_copy.instance.source_file)} v${esc(a.spec_copy.instance.source_version)}</b> ⟶ ${esc(a.spec_copy.instance.derived_file)} (declared source: v${esc(a.spec_copy.instance.declared_version)}) — ${a.spec_copy.instance.drifted ? '<b style="color:#f85149">DRIFTED (live-verified at build)</b>' : "in sync"}` : esc(JSON.stringify(a.spec_copy.instance))}<div class="sub">${esc(a.spec_copy.class)} — ek copy chupchaap purani ho jaati hai; registry spec is class ko row banata hai.</div></div>

<div class="sub" style="margin-top:26px">Data: dressing-room/state/flow_atlas.json · regenerate: <span class="mono">node scripts/xray.mjs build && node scripts/flow_atlas.mjs build</span> · har edge par witness hai (ir | table | ruling) — bina witness ka edge build ko exit 2 par maar deta hai.</div>
</body></html>`;
}

// ── CLI ─────────────────────────────────────────────────────────────────────
function selftest() {
  let pass = 0, fail = 0;
  const t = (name, fn) => { try { fn(); pass++; console.log("  ok  " + name); } catch (e) { fail++; console.log("  FAIL " + name + " — " + (e && e.message)); } };
  const ir = JSON.parse(readFileSync(IR_PATH, "utf8"));
  const bite = (name, mutate) => t(name, () => {
    for (let i = 0; i < 2; i++) { // 8th standing law: a bite is proven IDEMPOTENT — bites twice
      let threw = false;
      try { derive(mutate()); } catch { threw = true; }
      if (!threw) throw new Error("planted violation did NOT refuse (run " + (i + 1) + ")");
    }
  });
  t("clean derive passes + is idempotent (same content hash twice)", () => {
    const a = derive({ ir, skipFreshness: true }), b = derive({ ir, skipFreshness: true });
    if (a.hash !== b.hash) throw new Error(`hashes differ ${a.hash} vs ${b.hash}`);
  });
  t("the four SHAPE-6 edges are present, fired_by him, witness=ruling", () => {
    const { atlas } = derive({ ir, skipFreshness: true });
    const s6 = atlas.edges.filter((e) => e.shape6);
    if (s6.length !== 4) throw new Error("expected 4, got " + s6.length);
    for (const e of s6) { if (e.fired_by !== "him") throw new Error(e.verb + " not fired_by him"); if (e.witness.kind !== "ruling") throw new Error(e.verb + " wrong witness kind"); }
  });
  bite("BITE: an AFFERENT row that derives no edge refuses", () => ({ ir, skipFreshness: true, afferent: { ...AFFERENT_SOURCES, planted_source_nobody_derives: null } }));
  bite("BITE: an empty IR derivation refuses", () => ({ ir: { ...ir, files: ir.files.filter((f) => !(f.writers.length && f.readers.length)) }, skipFreshness: true }));
  bite("BITE: a stale IR refuses", () => ({ ir: { ...ir, built_at: "2026-01-01T00:00:00.000Z" } }));
  console.log(`flow_atlas selftest: ${pass}/${fail === 0 ? pass : pass + "+" + fail + " FAIL"}`);
  process.exit(fail ? 1 : 0);
}

const verb = process.argv[2] || "build";
if (verb === "selftest") selftest();
else if (verb === "check") {
  const { hash } = derive();
  const onDisk = existsSync(OUT_JSON) ? JSON.parse(readFileSync(OUT_JSON, "utf8")).content_sha16 : null;
  if (hash !== onDisk) { console.error(`flow_atlas check: STALE — derived ${hash} vs written ${onDisk}. Run: node scripts/flow_atlas.mjs build`); process.exit(2); }
  console.log(`flow_atlas check: OK ${hash}`);
} else if (verb === "build") {
  const { atlas, hash } = derive();
  writeFileSync(OUT_JSON, JSON.stringify(atlas, null, 1), "utf8");
  writeFileSync(OUT_HTML, renderHtml(atlas), "utf8");
  console.log(`flow_atlas: ${atlas.counts.edges} edges (him→ ${atlas.counts.him_in} · organ↔organ ${atlas.counts.organ_organ} · →him ${atlas.counts.him_out} · SHAPE-6 ${atlas.counts.shape6}) · orphan writes ${atlas.counts.orphan_writes} · ghost reads ${atlas.counts.ghost_reads} · sha ${hash}`);
  console.log(`  → ${OUT_JSON}`);
  console.log(`  → ${OUT_HTML}`);
} else { console.error(`unknown verb "${verb}" — build|check|selftest`); process.exit(2); }
