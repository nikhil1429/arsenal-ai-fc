#!/usr/bin/env node
// ============================================================================
// widget.mjs · ARSENAL AI FC — THE WIDGET REGISTRY (audit #107, captain's D5 = A)
// ----------------------------------------------------------------------------
// WHAT WAS BROKEN. PROJECT_OS §VISUALIZATION CONTRACT is canon — "har concept ka EK
// widget; widget HI lesson hai" — and he re-ruled it personally on 1 Aug 2026. It had
// NO CODE OWNER. viz.mjs is the club WALL (a dashboard), not a concept-widget engine.
// Measured 5 Aug 2026: exactly ONE widget file exists in the whole repo
// (dressing-room/club/widgets/hallucinations.html, 31 Jul) and it belongs to a concept
// that is not even locked, while all FOUR locked capsules have ZERO. Nothing could say
// so, because nothing was looking.
//
// WHY A REGISTRY AND NOT A GENERATOR (his ruling, D5 = A). A widget's whole value is
// the bespoke hero example — the same invoice line, "Aristo Eco — ₹81,500", walking
// through every concept in HIS data. A generator produces the one thing the contract
// forbids: a generic widget. So the machine's job here is not to draw. It is to KNOW —
// which concept has one, which does not, when it was made, and whether its guess-gates
// were ever actually DRIVEN. (The contract's own "Chala mode: Nikhil drive kare" means
// an UNDRIVEN widget is a FAILED widget, so "built" was never the obligation.)
//
// LAWS: single writer of widgets.json · never edits or generates an .html · never
//   writes into a capsule (the schema's `viz` layer is RESERVED and stays that way) ·
//   discovery is additive, so a file that exists on disk is never invisible just
//   because nobody registered it.
// CLI: list | register <concept> <file> [--gates N] | open <concept> | selftest
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const STATE = join(ROOT, "dressing-room", "state");
const CAPSULES = join(STATE, "capsules");
const REGISTRY = join(STATE, "widgets.json");
const WIDGET_DIR = join(ROOT, "dressing-room", "club", "widgets");

// The contract's own numbers, not ours: 2-3 guess-gates per widget (PROJECT_OS
// §VISUALIZATION CONTRACT, mirrored in .claude/skills/forge/SKILL.md step 4).
const GATES_MIN = 2;

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };

export function lockedConcepts(dir = CAPSULES) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".json"))
    .map((f) => readJson(join(dir, f))).filter((c) => c && c.id)
    .sort((a, b) => String(a.num || "").localeCompare(String(b.num || "")))
    .map((c) => ({ id: c.id, num: c.num || null, title: c.title || c.id }));
}

// DISCOVERY IS ADDITIVE. A widget on disk that nobody registered still counts as
// present — the registry adds metadata (gates driven), it does not gatekeep reality.
// The convention is <concept>.html, which is what the one existing file already uses.
export function discover(dir = WIDGET_DIR) {
  const out = {};
  try {
    if (!existsSync(dir)) return out;
    for (const f of readdirSync(dir)) {
      if (!f.toLowerCase().endsWith(".html")) continue;
      const p = join(dir, f);
      out[basename(f, ".html").toLowerCase()] = { file: p, bytes: statSync(p).size, mtime: statSync(p).mtime.toISOString().slice(0, 10) };
    }
  } catch {}
  return out;
}

export function loadRegistry(path = REGISTRY) {
  const j = readJson(path);
  return (j && typeof j === "object" && j.widgets && typeof j.widgets === "object") ? j : { version: 1, widgets: {} };
}

function save(reg, path = REGISTRY) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(reg, null, 2) + "\n");
}

// THE REPORT. Every locked capsule appears, present or not — that is the point. A
// concept with no widget is stated, never omitted, because an omission reads as "fine".
export function report(deps = {}) {
  const caps = deps.caps || lockedConcepts();
  const found = deps.found || discover();
  const reg = (deps.reg || loadRegistry()).widgets;
  const rows = caps.map((c) => {
    const disk = found[c.id] || null;
    const meta = reg[c.id] || null;
    const gates = meta && Number.isInteger(meta.gates_driven) ? meta.gates_driven : 0;
    return {
      concept: c.id, num: c.num, present: !!disk,
      file: disk ? disk.file : null, made: disk ? disk.mtime : null,
      gates_driven: gates,
      // The contract judges a widget by whether it was DRIVEN, not whether it was built.
      status: !disk ? "MISSING" : gates >= GATES_MIN ? "driven" : "built, NOT driven",
    };
  });
  // A widget file with no locked capsule behind it is not an error — it is a concept
  // still in flight. Naming it is how "we have one widget, for an unlocked concept"
  // stops being invisible.
  const orphans = Object.keys(found).filter((k) => !caps.some((c) => c.id === k))
    .map((k) => ({ concept: k, file: found[k].file, made: found[k].mtime }));
  const have = rows.filter((r) => r.present).length;
  return {
    rows, orphans,
    counter: `${have}/${caps.length} locked capsules have a widget`,   // have/need, never a bare word
    driven: rows.filter((r) => r.status === "driven").length,
  };
}

export function registerWidget(reg, concept, file, gates, now = new Date()) {
  const id = String(concept || "").toLowerCase().trim();
  if (!id) return { ok: false, why: "concept is required" };
  if (!file || !existsSync(file)) return { ok: false, why: `no such file: ${file}` };
  const g = Number.isInteger(gates) ? gates : (reg.widgets[id] && reg.widgets[id].gates_driven) || 0;
  return { ok: true, reg: { ...reg, widgets: { ...reg.widgets, [id]: { file, gates_driven: g, registered_at: now.toISOString() } } } };
}

function selftest() {
  let pass = 0, fail = 0;
  const assert = (n, c) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; console.log(`  FAIL ${n}`); } };
  const caps = [{ id: "tokenization", num: "01" }, { id: "embeddings", num: "02" }];
  const found = { embeddings: { file: "/w/embeddings.html", bytes: 100, mtime: "2026-08-01" },
                  hallucinations: { file: "/w/hallucinations.html", bytes: 200, mtime: "2026-07-31" } };

  const r = report({ caps, found, reg: { widgets: { embeddings: { gates_driven: 3 } } } });
  assert("EVERY locked capsule appears — a MISSING widget is STATED, never omitted",
    r.rows.length === 2 && r.rows.find((x) => x.concept === "tokenization").status === "MISSING");
  assert("HAVE/NEED counter, never a bare word", r.counter === "1/2 locked capsules have a widget");
  assert("DRIVEN, not BUILT, is the standard — 3 gates counts as driven",
    r.rows.find((x) => x.concept === "embeddings").status === "driven" && r.driven === 1);
  assert("a widget with too few gates reads 'built, NOT driven' (the contract's Chala-mode rule)",
    report({ caps, found, reg: { widgets: { embeddings: { gates_driven: 1 } } } })
      .rows.find((x) => x.concept === "embeddings").status === "built, NOT driven");
  assert("DISCOVERY IS ADDITIVE — a file on disk counts even with an EMPTY registry",
    report({ caps, found, reg: { widgets: {} } }).rows.find((x) => x.concept === "embeddings").present === true);
  assert("ORPHAN — a widget for a not-yet-locked concept is NAMED, not silently dropped",
    r.orphans.length === 1 && r.orphans[0].concept === "hallucinations");
  assert("no capsules and no widgets -> an honest empty report, never a crash",
    report({ caps: [], found: {}, reg: { widgets: {} } }).counter === "0/0 locked capsules have a widget");
  assert("REGISTER refuses a file that does not exist (no phantom widgets)",
    registerWidget({ widgets: {} }, "x", "/nope/none.html", 2).ok === false);
  assert("REGISTER writes gates and keeps the previous count when none is supplied",
    (() => { const real = join(HERE, "widget.mjs");
      const a = registerWidget({ widgets: {} }, "tokenization", real, 2);
      const b = registerWidget(a.reg, "tokenization", real, undefined);
      return a.ok && a.reg.widgets.tokenization.gates_driven === 2 && b.reg.widgets.tokenization.gates_driven === 2; })());
  assert("THE LIVE TRUTH — the live counter's denominator IS the live locked-capsule count (was a hardcoded /4 that would go red the day a fifth capsule locked — the exact rot class CLAUDE.md documents)",
    (() => { const live = report(); return live.counter.endsWith(`/${lockedConcepts().length} locked capsules have a widget`); })());
  assert("A BROKEN/ABSENT REGISTRY FILE degrades to empty, never a throw",
    loadRegistry(join(HERE, "__nope__.json")).widgets && Object.keys(loadRegistry(join(HERE, "__nope__.json")).widgets).length === 0);

  console.log(`\nwidget selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const mode = String(cmd || "list").toLowerCase();
  if (mode === "selftest") process.exit(selftest() ? 0 : 1);

  if (mode === "register") {
    const gi = rest.indexOf("--gates");
    const gates = gi >= 0 ? parseInt(rest[gi + 1], 10) : undefined;
    const res = registerWidget(loadRegistry(), rest[0], rest[1], Number.isFinite(gates) ? gates : undefined);
    if (!res.ok) { console.error(`widget: ${res.why}`); process.exit(1); }
    save(res.reg);
    console.log(`widget: registered ${rest[0]} → ${rest[1]}${Number.isFinite(gates) ? ` · ${gates} guess-gates driven` : ""}`);
    return;
  }

  if (mode === "open") {
    const id = String(rest[0] || "").toLowerCase();
    const hit = discover()[id] || (loadRegistry().widgets[id] || {}).file;
    const file = typeof hit === "string" ? hit : hit && hit.file;
    if (!file) {
      console.log(`\nwidget: "${id}" ka koi widget nahi hai.`);
      console.log(`  Visualization Contract kehta hai har concept ka EK widget — yeh abhi khali hai.\n`);
      process.exit(1);
    }
    console.log(file);   // print the path; the session opens it — this organ never launches anything
    return;
  }

  const rep = report();
  console.log(`\n== WIDGETS ==   ${rep.counter} · ${rep.driven} driven\n`);
  for (const r of rep.rows) {
    console.log(`  ${String(r.num || "--")}  ${r.concept.padEnd(16)} ${r.status === "MISSING" ? "—  MISSING" : `${r.made}  ${r.status}${r.gates_driven ? ` (${r.gates_driven} gates)` : ""}`}`);
  }
  if (rep.orphans.length) {
    console.log(`\n  orphans (widget hai, capsule abhi locked nahi):`);
    for (const o of rep.orphans) console.log(`    ${o.concept.padEnd(16)} ${o.made}  ${o.file}`);
  }
  console.log(`\n  register: node scripts/widget.mjs register <concept> <file> --gates <n>`);
  console.log(`  kholo:    node scripts/widget.mjs open <concept>\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
export { report as widgetReport, selftest };
