#!/usr/bin/env node
// ============================================================================
// scripts/syllabus.mjs · ARSENAL AI FC — THE STUDY SYLLABUS THE TEACHER FOLLOWS (ruling row 1399, his word 346)
// ----------------------------------------------------------------------------
// WHY: his word 346 (26 Nov 2026): "please make sure the teacher there is following this exact syllabus completely".
//   The corrected syllabus (rows 1397 / 1398) lived in his Downloads folder and in the new repo; the teacher read
//   neither — /learn and /forge took their topic from the sheet and the capsule floor. This organ makes the order
//   DATA the old organism's own front door reads.
//
// LAWS:
//   · SOLE WRITER of learning-layer/SYLLABUS.json (a TRACKED file). Only `build` writes it, from the new repo's
//     corrected pack (packs/syllabus/syllabus.json) and its question bank (packs/syllabus/questions.json). The
//     source is read, never edited here; no salary is carried (it is not in the pack).
//   · Every count is computed; none is typed into the data file.
//   · READ-ONLY verbs: `next` (the first concept, in the syllabus order, that is not closed), `topic <id>` (its depth,
//     its list = the coverage contract for its axes, its reported questions = the interview reps), `show`, `check`.
//   · SOLE WRITER of dressing-room/state/syllabus_coverage.jsonl (a ruled state birth, row 1400 (5); registry lanes
//     row `syllabus_coverage`). APPEND-ONLY, two row kinds, never a rewrite:
//       {v:1, kind:"covered", at, concept, item, text, axis}                       `cover` — the teacher taught item N
//       {v:1, kind:"closed",  at, concept, by, his_words, covered[], skipped[]}    `close` — HIS word ended the topic
//   · A CONCEPT IS CLOSED by a seed closure carried from the pack (his word 321, ruling row 1338) or by a `closed`
//     row, and `close` REFUSES without his words (`--his "<verbatim>"`). A forge session's own close is NOT a concept
//     close (sessions close at every stop); nothing here infers closed.
//   · NEVER A BRAKE ON HIM (row 1400 (5)): if he ends a topic with items uncovered, in any words, `close` records them
//     `skipped` by his word; they stay OWED and the topic screen lists them at that topic's next sitting.
//   · BRANCH 1 OF ROW 1399 (row 1400 (1)): after a close, `close` calls the floor owner's own writer (sprintsync's
//     setFloor) with the syllabus's next concept and its own reason — never stamped as his word (row 1400 (2)).
//
// USAGE: node scripts/syllabus.mjs build [--pack <syllabus.json>] [--questions <questions.json>]
//        node scripts/syllabus.mjs next | topic <id> | show | check | selftest
//        node scripts/syllabus.mjs cover <concept> <item#> --axis <a-i>
//        node scripts/syllabus.mjs close <concept> --his "<his words, verbatim>"
//   The pack defaults to the sibling repo ../gaffer/packs/syllabus/ (env ARSENAL_SYLLABUS_PACK_DIR overrides).
// ============================================================================
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SYLLABUS = join(ROOT, "learning-layer", "SYLLABUS.json");
const PACK_DIR = () => process.env.ARSENAL_SYLLABUS_PACK_DIR || join(ROOT, "..", "gaffer", "packs", "syllabus");
const DEPTHS = ["core", "standard", "light"];

const arg = (argv, k) => { const i = argv.indexOf("--" + k); return i >= 0 ? argv[i + 1] : null; };
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

/** fromPack — PURE: the pack + the bank in, the teacher's syllabus out (or the problems, by name). */
export function fromPack(pack, bank, sourceNote = "") {
  const bad = [];
  if (!pack || !Array.isArray(pack.stages) || !pack.stages.length) return { ok: false, bad: ["the pack has no stages"] };
  const homes = new Set();
  const stages = pack.stages.map((st) => ({
    id: st.id, name: st.name, ...(st.product_step ? { product_step: st.product_step } : {}),
    concepts: (st.concepts || []).map((c) => {
      if (homes.has(c.id)) bad.push(`duplicate id ${c.id}`);
      homes.add(c.id);
      if (!DEPTHS.includes(c.depth)) bad.push(`concept ${c.id} has depth ${c.depth}`);
      return { id: c.id, name: c.name, depth: c.depth, depth_row: c.depth_row || null, aliases: c.aliases || [], list: c.names || [], ...(c.note ? { note: c.note } : {}), questions: [] };
    }),
  }));
  const tracks = (pack.tracks || []).map((t) => { homes.add(t.id); return { id: t.id, name: t.name, depth: t.depth || null, note: t.note || "", questions: [] }; });
  const where = new Map();
  for (const st of stages) for (const c of st.concepts) where.set(c.id, c);
  for (const t of tracks) where.set(t.id, t);
  for (const q of (bank && bank.questions) || []) {
    const h = where.get(q.concept);
    if (!h) { bad.push(`question ${q.id} maps to ${q.concept}, which the pack does not hold`); continue; }
    // NO SALARY (row 1399 (2)(a)): a pay figure riding a question's source line is cut here, never carried.
    h.questions.push({ id: q.id, text: q.text, source: String(q.source).replace(/,?\s*offer\s+[^,)]*\bLPA\b/gi, ""), ...(q.note ? { note: q.note } : {}) });
  }
  if (bad.length) return { ok: false, bad };
  return {
    ok: true,
    syllabus: {
      part: "study_syllabus", status: pack.status, status_note: pack.status_note || "",   // row 1403: the pack's own ruling cite rides the file
      written_by: "scripts/syllabus.mjs build (sole writer; ruling row 1399)", source: sourceNote,
      depth_words: pack.depth_words || {}, product_domain_note: pack.product_domain_note || "",
      stages, tracks, light: pack.light || [], not_studied: pack.not_studied || [],
      closures: (pack.closures || []).map((x) => ({ concept: x.concept, ruling_row: x.ruling_row, his_words_n: x.his_words_n || null, at: x.at })),
    },
  };
}

/** The concepts in syllabus order. */
export const order = (s) => s.stages.flatMap((st) => st.concepts.map((c) => ({ ...c, stage: st.id, stage_name: st.name })));
/** The id a name or alias refers to, or null. */
export function idOf(s, k) {
  const want = String(k || "").trim().toLowerCase();
  for (const c of order(s)) if (c.id === want || c.name.toLowerCase() === want || c.aliases.includes(want)) return c.id;
  return null;
}
/** next — PURE: the first concept in order that is not closed. `closed` is a set of ids. */
export function nextOf(s, closed = new Set((s.closures || []).map((x) => x.concept))) {
  return order(s).find((c) => !closed.has(c.id)) || null;
}
/** Every count, computed. */
export function counts(s) {
  const all = order(s);
  const q = all.reduce((n, c) => n + c.questions.length, 0) + s.tracks.reduce((n, t) => n + t.questions.length, 0);
  return { stages: s.stages.length, concepts: all.length, core: all.filter((c) => c.depth === "core").length, standard: all.filter((c) => c.depth === "standard").length, light: all.filter((c) => c.depth === "light").length, closed: (s.closures || []).length, questions: q };
}
/** topicLines — the teacher's screen for one concept. */
export function topicLines(s, id, rows = []) {
  const c = order(s).find((x) => x.id === id);
  if (!c) return [`syllabus: "${id}" is not a concept of the syllabus`];
  const cv = coverOf(s, rows, id);
  const L = [`SYLLABUS · ${c.name} [${c.depth}] · stage ${c.stage_name} · depth: ${c.depth_row || "unrated"}`];
  if (s.depth_words && s.depth_words[c.depth]) L.push(`  ${c.depth} = ${s.depth_words[c.depth]}`);
  L.push(`  THE LIST (the coverage contract: every item taught in some axis before the close; mark each: \`node scripts/syllabus.mjs cover ${c.id} <n> --axis <a-i>\`):`);
  c.list.forEach((x, i) => L.push(`    ${i + 1}. ${x}${cv.covered.includes(i + 1) ? " · COVERED" : ""}${cv.owed.includes(i + 1) ? " · OWED (skipped by his word at the last close)" : ""}`));
  if (!c.list.length) L.push("    (none named)");
  L.push(`  REPORTED INTERVIEW QUESTIONS (the interview reps): ${c.questions.length || "none in the bank"}`);
  for (const q of c.questions) L.push(`    ${q.id} · ${q.text} (${q.source})`);
  return L;
}

// ── THE COVERAGE LOG (row 1400 (5)) ──────────────────────────────────────────────────────────────────────────
const STATE_DIR = join(ROOT, "dressing-room", "state");
export const logPath = (dir = STATE_DIR) => join(dir, "syllabus_coverage.jsonl");
/** readLog — the rows, oldest first; a torn line is skipped. */
export function readLog(dir = STATE_DIR) {
  const p = logPath(dir);
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf8").split("\n").filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
}
const append = (dir, row) => appendFileSync(logPath(dir), JSON.stringify(row) + "\n");
/** closedSet — PURE over (syllabus, rows): seed closures + closed rows. */
export const closedSet = (s, rows) => new Set([...(s.closures || []).map((x) => x.concept), ...rows.filter((r) => r.kind === "closed").map((r) => r.concept)]);
/** coverOf — PURE: for one concept, the item numbers covered since its last close, and what an earlier close left owed. */
export function coverOf(s, rows, id) {
  const c = order(s).find((x) => x.id === id);
  const mine = rows.filter((r) => r.concept === id);
  const lastClose = [...mine].reverse().find((r) => r.kind === "closed");
  const since = lastClose ? mine.slice(mine.lastIndexOf(lastClose) + 1) : mine;
  const covered = [...new Set(since.filter((r) => r.kind === "covered").map((r) => r.item))].sort((a, b) => a - b);
  const all = c ? c.list.map((_, i) => i + 1) : [];
  // OWED = what HE skipped at the last close and nothing has covered since (row 1400 (5)).
  const owed = lastClose ? (lastClose.skipped || []).filter((n) => !covered.includes(n)) : [];
  return { covered, uncovered: all.filter((n) => !covered.includes(n)), owed };
}
/** coverRow — PURE: the row `cover` appends, or why not. */
export function coverRow(s, id, item, axis, at = new Date().toISOString()) {
  const c = order(s).find((x) => x.id === id);
  if (!c) return { ok: false, why: `"${id}" is not a concept of the syllabus` };
  const n = Number(item);
  if (!Number.isInteger(n) || n < 1 || n > c.list.length) return { ok: false, why: `item ${item} is not on ${c.name}'s list (1 to ${c.list.length})` };
  if (!/^[a-i]$/.test(String(axis || ""))) return { ok: false, why: "an item is taught in an axis: --axis <a-i>" };
  return { ok: true, row: { v: 1, kind: "covered", at, concept: id, item: n, text: c.list[n - 1], axis } };
}
/** closeRow — PURE: the row `close` appends and the next concept, or why not. Never a brake: uncovered = skipped. */
export function closeRow(s, rows, id, his, at = new Date().toISOString()) {
  const c = order(s).find((x) => x.id === id);
  if (!c) return { ok: false, why: `"${id}" is not a concept of the syllabus` };
  if (!String(his || "").trim()) return { ok: false, why: "a topic is closed only by HIS word: --his \"<his words, verbatim>\"" };
  const cv = coverOf(s, rows, id);
  const row = { v: 1, kind: "closed", at, concept: id, by: "his word", his_words: String(his), covered: cv.covered, skipped: cv.uncovered };
  const next = nextOf(s, new Set([...closedSet(s, rows), id]));
  return { ok: true, row, next, cover: cv };
}

function load() {
  if (!existsSync(SYLLABUS)) throw new Error(`syllabus: ${SYLLABUS} does not exist — run \`node scripts/syllabus.mjs build\``);
  return readJson(SYLLABUS);
}
function build(argv) {
  const dir = PACK_DIR();
  const packPath = arg(argv, "pack") || join(dir, "syllabus.json");
  const bankPath = arg(argv, "questions") || join(dir, "questions.json");
  const r = fromPack(readJson(packPath), readJson(bankPath), "the new repo's corrected pack and its question bank (rows 1397, 1398)");
  if (!r.ok) { console.error("syllabus build REFUSED:\n  " + r.bad.join("\n  ")); process.exit(1); }
  mkdirSync(dirname(SYLLABUS), { recursive: true });
  const tmp = SYLLABUS + "." + process.pid + ".tmp";
  writeFileSync(tmp, JSON.stringify(r.syllabus, null, 2) + "\n");
  renameSync(tmp, SYLLABUS);
  const c = counts(r.syllabus);
  console.log(`syllabus build · wrote learning-layer/SYLLABUS.json · ${Object.entries(c).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
}

function selftest() {
  let pass = 0, fail = 0;
  const ok = (name, cond) => { if (cond) pass++; else { fail++; console.log("  FAIL " + name); } };
  const pack = { status: "draft", stages: [
    { id: "m", name: "mech", concepts: [
      { id: "tokenization", name: "tokenization", depth: "standard", names: ["bpe"] },
      { id: "inference", name: "inference and sampling", depth: "core", names: ["KV cache", "prefill against decode"] },
      { id: "self_attention", name: "self-attention", depth: "standard", names: ["GQA"] },
    ] },
  ], tracks: [{ id: "python", name: "Python" }], closures: [{ concept: "tokenization", ruling_row: "1338", at: "2026-11-25T11:06:00+05:30" }] };
  const bank = { questions: [{ id: "q05", concept: "inference", text: "What is KV caching?", source: "x" }, { id: "q63", concept: "python", text: "SQL", source: "y" }] };
  const r = fromPack(pack, bank);
  ok("CONTROL · a good pack builds", r.ok);
  ok("ORDER · next after a seed closure is the first unclosed concept in order", nextOf(r.syllabus).id === "inference");
  ok("ORDER · with inference closed too, next is self-attention", nextOf(r.syllabus, new Set(["tokenization", "inference"])).id === "self_attention");
  ok("ORDER · all closed is null", nextOf(r.syllabus, new Set(["tokenization", "inference", "self_attention"])) === null);
  ok("BANK · a question lands on its concept", r.syllabus.stages[0].concepts[1].questions.map((q) => q.id).join() === "q05");
  ok("BANK · a question can land on a track", r.syllabus.tracks[0].questions.length === 1);
  ok("REFUSE · a question mapped to an unknown id", !fromPack(pack, { questions: [{ id: "q1", concept: "nope", text: "t", source: "s" }] }).ok);
  ok("REFUSE · a depth outside the three", !fromPack({ ...pack, stages: [{ id: "m", name: "m", concepts: [{ id: "a", name: "a", depth: "deep" }] }] }, { questions: [] }).ok);
  ok("REFUSE · a duplicate id", !fromPack({ ...pack, stages: [{ id: "m", name: "m", concepts: [{ id: "a", name: "a", depth: "core" }, { id: "a", name: "b", depth: "core" }] }] }, { questions: [] }).ok);
  ok("TOPIC · the screen carries the list and the questions", (() => { const t = topicLines(r.syllabus, "inference").join("\n"); return /1\. KV cache/.test(t) && /q05/.test(t); })());
  ok("COUNTS · computed", (() => { const c = counts(r.syllabus); return c.concepts === 3 && c.questions === 2 && c.closed === 1; })());
  ok("NAMES · an alias or a name resolves to its id", idOf(r.syllabus, "Inference and sampling") === "inference");
  ok("NO SALARY · nothing the pack lacks is invented", !JSON.stringify(r.syllabus).toLowerCase().includes("lpa"));
  // the coverage log (row 1400 (5)), pure
  const S = r.syllabus, T0 = "2026-11-26T10:00:00.000Z";
  const cv1 = coverRow(S, "inference", 1, "c", T0);
  ok("COVER · an item on the list in an axis is a row", cv1.ok && cv1.row.text === "KV cache");
  ok("COVER · refused: an item off the list, or no axis", !coverRow(S, "inference", 9, "c").ok && !coverRow(S, "inference", 1, null).ok);
  ok("CLOSE · refused without his words (never inferred)", !closeRow(S, [cv1.row], "inference", "").ok);
  const cl = closeRow(S, [cv1.row], "inference", "chalo yeh topic band karte hain", "2026-11-26T11:00:00.000Z");
  ok("CLOSE · prints covered and not covered", cl.ok && cl.row.covered.join() === "1" && cl.row.skipped.join() === "2");
  ok("CLOSE · NOT A BRAKE: uncovered items close as SKIPPED by his word", cl.row.by === "his word" && cl.row.skipped.length === 1);
  ok("CLOSE · the next concept is the first unclosed in order (self-attention after inference)", cl.next && cl.next.id === "self_attention");
  ok("CLOSE · a closed row closes the concept for next", nextOf(S, closedSet(S, [cv1.row, cl.row])).id === "self_attention");
  ok("OWED · what he skipped stays owed at that topic's next sitting", coverOf(S, [cv1.row, cl.row], "inference").owed.join() === "2");
  ok("OWED · covered after the close, it is no longer owed", coverOf(S, [cv1.row, cl.row, { ...coverRow(S, "inference", 2, "d", "2026-11-27T10:00:00.000Z").row }], "inference").owed.length === 0);
  ok("TOPIC · the screen marks covered and owed items", (() => { const t = topicLines(S, "inference", [cv1.row, cl.row]).join("\n"); return /KV cache · COVERED/.test(t) === false && /prefill against decode · OWED/.test(t); })());
  // the REAL file, when present: it loads, every question has a home, and its counts are computed
  if (existsSync(SYLLABUS)) {
    const s = load();
    ok("REAL · the tracked file has an unclosed next concept", !!nextOf(s));
    ok("REAL · the tracked file carries no salary", !/\bLPA\b/.test(readFileSync(SYLLABUS, "utf8")));
  }
  console.log(`syllabus selftest · ${pass} pass · ${fail} fail`);
  if (fail) process.exit(1);
}

const isMain = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const [mode, ...rest] = process.argv.slice(2);
  switch (mode) {
    case "build": build(rest); break;
    case "cover": {
      const s = load(); const id = idOf(s, rest[0]); const r = coverRow(s, id || rest[0], rest[1], arg(rest, "axis"));
      if (!r.ok) { console.error("syllabus cover REFUSED: " + r.why); process.exit(1); }
      append(STATE_DIR, r.row);
      const cv = coverOf(s, readLog(), r.row.concept);
      console.log(`syllabus cover · ${r.row.concept} item ${r.row.item} (${r.row.text}) · axis ${r.row.axis} · covered ${cv.covered.length} · not yet ${cv.uncovered.length}`);
      break;
    }
    case "close": {
      const s = load(); const id = idOf(s, rest[0]); const rows = readLog();
      const r = closeRow(s, rows, id || rest[0], arg(rest, "his"));
      if (!r.ok) { console.error("syllabus close REFUSED: " + r.why); process.exit(1); }
      append(STATE_DIR, r.row);
      const c = order(s).find((x) => x.id === r.row.concept);
      console.log(`syllabus close · ${c.name} · by his word: "${r.row.his_words}"`);
      console.log(`  covered: ${r.row.covered.length ? r.row.covered.map((n) => `${n}. ${c.list[n - 1]}`).join(" · ") : "none"}`);
      console.log(`  not covered: ${r.row.skipped.length ? r.row.skipped.map((n) => `${n}. ${c.list[n - 1]}`).join(" · ") + " — recorded SKIPPED by his word, OWED at this topic's next sitting" : "none"}`);
      if (r.next) {
        const { setFloor } = await import("./sprintsync.mjs");
        setFloor(r.next.id, `syllabus order, after ${c.id} closed`);
        console.log(`  next in the syllabus: ${r.next.name} (${r.next.id})`);
      } else console.log("  next in the syllabus: nothing — every concept is closed");
      break;
    }
    case "next": { const s = load(); const n = nextOf(s, closedSet(s, readLog())); console.log(n ? `syllabus next · ${n.name} (${n.id}) · ${n.depth} · stage ${n.stage_name}` : "syllabus next · nothing: every concept is closed"); break; }
    case "topic": { const s = load(); const id = idOf(s, rest.join(" ")); console.log(topicLines(s, id || rest.join(" "), readLog()).join("\n")); break; }
    case "show": { const s = load(); console.log(`syllabus · ${s.status} · ${Object.entries(counts(s)).map(([k, v]) => `${k} ${v}`).join(" · ")}`); for (const c of order(s)) console.log(`  ${c.stage_name} · ${c.name} [${c.depth}] · list ${c.list.length} · questions ${c.questions.length}`); break; }
    case "check": { const s = load(); console.log(`syllabus check · ${Object.entries(counts(s)).map(([k, v]) => `${k} ${v}`).join(" · ")} · next ${nextOf(s) ? nextOf(s).id : "none"}`); break; }
    case "selftest": selftest(); break;
    default: console.log("usage: node scripts/syllabus.mjs build | next | topic <id> | show | check | selftest"); process.exit(mode ? 1 : 0);
  }
}
