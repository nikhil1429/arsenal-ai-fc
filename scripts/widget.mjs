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
//
// THE IN-SESSION PICTURE (6 Oct 2026 · rung L4 · fate 54, the R5 viz slot · forks rows
// 276, 550 (1), 561 (2)). His word #22 (24 Sep) — "pictures first then text, combine them
// both" — made EVERY new idea open with ONE picture before its text (VISUAL_CONTRACT §4).
// The registry now also NAMES that picture, per concept: the teaching_audit Stop hook sees
// which new-idea turn showed its picture FIRST and calls recordPicture (exported below)
// with the ts of the audit row it writes for that turn. This file stays the SOLE writer of
// widgets.json (the hook imports the writer, it never opens the file), and `list` stays
// READ-ONLY (forge_session's E8): it prints ONE line per recorded picture —
//   PICTURE <concept> · session <session_id> · audit <audit_ts> · <title>
// — the read-back rung L4's G3 runs through the exact argv the lock chain spawns. A picture
// with no such line is a red by name. KEEP (fate 09): nothing above moved; the pictures ride
// their OWN top-level key, so registerWidget (which rebuilds a concept's row) can never drop
// one, and the lock chain still reads `list`'s first line (no PICTURE line is self-named).
// CLI: list | register <concept> <file> [--gates N] | open <concept> | selftest
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, renameSync, mkdtempSync, rmSync, copyFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";   // L4: the selftest's temp registry + temp tree (never the live widgets.json)
import { spawnSync } from "node:child_process";   // L4: the selftest runs `list` by the lock chain's own argv

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
  // C2 (9 Aug 2026): tmp+rename — this was the last state-file OWNER still writing bare.
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp${process.pid}`;
  writeFileSync(tmp, JSON.stringify(reg, null, 2) + "\n");
  renameSync(tmp, path);
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
  // F4 (9 Aug 2026): a relative path used to be stored and later resolved against
  // whatever cwd the READER happened to have — register from anywhere, open from
  // anywhere. Absolute at the door; existing rows resolve against the repo root.
  if (file && !/^(?:[A-Za-z]:[\\/]|[\\/])/.test(String(file))) file = join(ROOT, String(file));
  if (!file || !existsSync(file)) return { ok: false, why: `no such file: ${file}` };
  const g = Number.isInteger(gates) ? gates : (reg.widgets[id] && reg.widgets[id].gates_driven) || 0;
  return { ok: true, reg: { ...reg, widgets: { ...reg.widgets, [id]: { file, gates_driven: g, registered_at: now.toISOString() } } } };
}

// THE IN-SESSION PICTURE (L4, fate 54) — the writer the teaching_audit Stop hook calls. Every
// refusal is NAMED and nothing is written: a picture with no concept, no session or no audit
// ts could never be read back to the turn that showed it, and a phantom read-back line is
// worse than none. One audit row = one picture (idempotent per session + audit ts). A
// widgets.json that is on disk but will not parse is NEVER overwritten from this automatic
// lane — loadRegistry() would hand back an empty registry and the save would erase every
// widget row; that repair is a hand's job, so it is refused and said.
const oneLine = (t) => String(t == null ? "" : t).replace(/\s+/g, " ").trim().slice(0, 120) || "untitled";
const picturesOf = (reg) => (reg && reg.pictures && typeof reg.pictures === "object" && !Array.isArray(reg.pictures) ? reg.pictures : {});
export function recordPicture({ concept, session_id, audit_ts, title } = {}, path = REGISTRY, now = new Date()) {
  const id = String(concept || "").toLowerCase().trim();
  const sid = String(session_id || "").trim();
  const ts = String(audit_ts || "").trim();
  if (!id) return { ok: false, why: "concept is required" };
  if (!sid) return { ok: false, why: "session_id is required" };
  if (!ts || Number.isNaN(Date.parse(ts))) return { ok: false, why: "audit_ts (the ts of the audit row that saw the picture) is required" };
  const onDisk = existsSync(path) ? readJson(path) : undefined;   // loadRegistry's own shape test, asked BEFORE it can default
  if (onDisk !== undefined && !(onDisk && typeof onDisk === "object" && onDisk.widgets && typeof onDisk.widgets === "object")) return { ok: false, why: `${basename(path)} is on disk but unreadable or shapeless — refused, never overwritten` };
  const reg = loadRegistry(path);
  const pics = picturesOf(reg);
  const list = Array.isArray(pics[id]) ? pics[id] : [];
  if (list.some((p) => p && p.session_id === sid && p.audit_ts === ts)) return { ok: true, concept: id, already: true };
  save({ ...reg, pictures: { ...pics, [id]: [...list, { session_id: sid, audit_ts: ts, title: oneLine(title), recorded_at: now.toISOString() }] } }, path);
  return { ok: true, concept: id };
}

// THE READ-BACK LINE (row 561 (2)) — ONE line per recorded picture, concept by concept, in the
// order they were recorded. Pure: `list` prints exactly these.
export function pictureLines(reg = loadRegistry()) {
  const pics = picturesOf(reg);
  return Object.keys(pics).sort().flatMap((c) => (Array.isArray(pics[c]) ? pics[c] : [])
    .filter((p) => p && p.session_id && p.audit_ts)
    .map((p) => `PICTURE ${c} · session ${p.session_id} · audit ${p.audit_ts} · ${oneLine(p.title)}`));
}

function selftest() {
  let pass = 0, fail = 0;
  const assert = (n, c) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; console.log(`  FAIL ${n}`); } };
  // L4 (6 Oct 2026) — THE CATCH-ALL: a throw is a FAIL line that NAMES it and the run still reaches its summary line (a
  // crash is never a verdict). `check` catches per case; the try below catches anything outside a named case.
  const check = (n, f) => { let c = false, why = ""; try { c = !!f(); } catch (e) { why = ` — THREW: ${String((e && e.message) || e).slice(0, 200)}`; } if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; console.log(`  FAIL ${n}${why}`); } };
  try {   // the catch-all opens here and closes above the summary line; the lines inside keep their indent
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

  // ── L4 · THE IN-SESSION PICTURE (fate 54 · row 561 (2)) — planted both ways on a TEMP registry, never the live one ──
  const tmp = mkdtempSync(join(tmpdir(), "widget-l4-"));
  try {
    const P = join(tmp, "widgets.json");
    writeFileSync(P, JSON.stringify({ version: 1, widgets: { tokenization: { file: "x.html", gates_driven: 0, registered_at: "2026-08-07T00:00:00.000Z" } } }, null, 2) + "\n");
    const A = { concept: "Tokenization", session_id: "s-1", audit_ts: "2026-10-06T05:00:00.000Z", title: "token ID ki\npicture" };
    const r1 = recordPicture(A, P);
    check("PICTURE (L4) · recordPicture names the in-session picture under its concept with the audit row's session + ts, and pictureLines prints the read-back line EXACTLY (one line, the title folded to one line)",
      () => r1.ok === true && r1.concept === "tokenization" && pictureLines(loadRegistry(P)).length === 1
        && pictureLines(loadRegistry(P))[0] === "PICTURE tokenization · session s-1 · audit 2026-10-06T05:00:00.000Z · token ID ki picture");
    check("PICTURE · no concept, no session, or no audit ts → REFUSED by name and NOTHING written (a picture that cannot be read back to its turn is a phantom)", () => {
      const before = readFileSync(P, "utf8");
      const rs = [recordPicture({ ...A, concept: " " }, P), recordPicture({ ...A, session_id: null }, P), recordPicture({ ...A, audit_ts: "not a time" }, P), recordPicture({ ...A, audit_ts: undefined }, P)];
      return rs.every((r) => r.ok === false && /required/.test(r.why)) && readFileSync(P, "utf8") === before;
    });
    check("PICTURE · ONE audit row is ONE picture (the same session + ts twice records once); a second concept's picture keeps the first concept's", () => {
      const again = recordPicture(A, P);
      const r2 = recordPicture({ concept: "embeddings", session_id: "s-1", audit_ts: "2026-10-06T05:10:00.000Z", title: "vector" }, P);
      const L = pictureLines(loadRegistry(P));
      return again.ok === true && again.already === true && r2.ok === true && L.length === 2
        && L.filter((l) => l.startsWith("PICTURE tokenization ")).length === 1 && L.includes("PICTURE embeddings · session s-1 · audit 2026-10-06T05:10:00.000Z · vector");
    });
    check("PICTURE · KEEP (fate 09), both ways: registerWidget after a picture keeps every picture, and recordPicture kept every widget row",
      () => { const reg = registerWidget(loadRegistry(P), "tokenization", join(HERE, "widget.mjs"), 2);
        return reg.ok && pictureLines(reg.reg).length === 2 && loadRegistry(P).widgets.tokenization.file === "x.html" && loadRegistry(P).version === 1; });
    check("PICTURE · a widgets.json on disk that will not parse, or has no widgets map, is REFUSED and never overwritten (the automatic lane cannot erase his widget rows)", () => {
      const torn = join(tmp, "torn.json"), shapeless = join(tmp, "shapeless.json");
      writeFileSync(torn, "{\"version\":1,\"widg"); writeFileSync(shapeless, "{\"version\":1}");
      const a = recordPicture(A, torn), b = recordPicture(A, shapeless);
      return a.ok === false && /refused/.test(a.why) && b.ok === false && /refused/.test(b.why)
        && readFileSync(torn, "utf8") === "{\"version\":1,\"widg" && readFileSync(shapeless, "utf8") === "{\"version\":1}";
    });
    check("PICTURE · an ABSENT registry is born with the picture (the first picture on a fresh tree is never refused)",
      () => { const fresh = join(tmp, "fresh", "widgets.json"); return recordPicture(A, fresh).ok === true && pictureLines(loadRegistry(fresh)).length === 1; });
    // THE READ-BACK, by the lock chain's own argv: this file copied into a temp tree, `node scripts/widget.mjs list` spawned there
    const listIn = (registryBytes) => {
      const org = mkdtempSync(join(tmp, "org-"));
      mkdirSync(join(org, "scripts")); mkdirSync(join(org, "dressing-room", "state"), { recursive: true });
      copyFileSync(fileURLToPath(import.meta.url), join(org, "scripts", "widget.mjs"));
      const W = join(org, "dressing-room", "state", "widgets.json");
      writeFileSync(W, registryBytes);
      const r = spawnSync(process.execPath, [join("scripts", "widget.mjs"), "list"], { cwd: org, encoding: "utf8", timeout: 15000 });
      const lines = String(r.stdout || "").split(/\r?\n/);
      return { status: r.status, lines, pics: lines.filter((l) => /^\s*PICTURE /.test(l)).map((l) => l.trim()), first: lines.map((l) => l.trim()).find(Boolean) || "", untouched: readFileSync(W, "utf8") === registryBytes };
    };
    check("PICTURE · `node scripts/widget.mjs list` — the argv forge_session's lock chain spawns — prints ONE PICTURE line per recorded picture, keeps line 1 the == WIDGETS == header the chain's door reads (no line self-named `widget:`), and writes NOTHING (E8)", () => {
      const L = listIn(readFileSync(P, "utf8"));
      return L.status === 0 && L.pics.length === 2 && L.pics.join("\n") === pictureLines(loadRegistry(P)).join("\n")
        && /^== WIDGETS ==/.test(L.first) && !L.lines.some((l) => /^\s*widget:/i.test(l)) && L.untouched;
    });
    check("PICTURE · and with NO picture recorded, `list` prints NO PICTURE line (the read-back can never pass vacuously)", () => {
      const L = listIn(JSON.stringify({ version: 1, widgets: {} }) + "\n");
      return L.status === 0 && L.pics.length === 0 && L.lines.some((l) => /in-session pictures .*: 0 recorded/.test(l)) && L.untouched;
    });
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  } catch (e) { fail++; console.log(`  FAIL THROW outside a named case — ${String((e && e.stack) || e).slice(0, 300)}`); }

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
  // L4 (fate 54) — the in-session picture of each new idea, ONE line per recorded picture (row 561 (2)'s read-back).
  // Below the header on purpose: the lock chain's door keeps line 1 (no line here is self-named `widget:`).
  const pics = pictureLines();
  console.log(`\n  in-session pictures (har naye idea ki picture, text se pehle): ${pics.length} recorded`);
  for (const l of pics) console.log(`  ${l}`);
  console.log(`\n  register: node scripts/widget.mjs register <concept> <file> --gates <n>`);
  console.log(`  kholo:    node scripts/widget.mjs open <concept>\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
export { report as widgetReport, selftest };
