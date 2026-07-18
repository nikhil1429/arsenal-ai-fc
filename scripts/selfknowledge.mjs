#!/usr/bin/env node
// ============================================================================
// selfknowledge.mjs · ARSENAL AI FC — THE ORGANISM'S SELF-PORTRAIT (live, not stale)
// ----------------------------------------------------------------------------
// WHAT: the Gaffer must be able to explain the WHOLE organism — every layer, the
//   cyborg brain, how it works — in god-tier detail, to a guest. The old way was
//   HAND-WRITTEN keynote scripts that go STALE the moment the machine evolves.
//   This kills that: a Claude model reads the ACTUAL SOURCE (every module's own
//   header = what it truly does NOW) + the live wiring, and writes a fresh,
//   accurate, comprehensive self-portrait -> organism_self.md. Regenerate anytime;
//   it can never be stale, because it is reconstructed from the code itself.
// WHY (the captain's law): "the docs are stale — the Claude model's brain should be
//   smart enough to RETRIEVE the real information in maximum detail and give it to
//   the Gaffer, not read a stupid script." This is that retriever.
// READS (read-only): scripts/*.mjs headers, package.json, .claude/skills, the state
//   inventory. Grounds EVERYTHING in real modules — invents nothing. NO personal
//   data ever touches this (machine is public; moments are private).
// WRITES: dressing-room/state/organism_self.md (own file). Metered to brain_ledger.
// MODES: node scripts/selfknowledge.mjs            -> generate (Opus)
//        node scripts/selfknowledge.mjs --model sonnet
//        node scripts/selfknowledge.mjs selftest   -> baked-mock checks (no claude)
// ============================================================================
import { readdirSync, readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, "..");
const SCRIPTS   = join(ROOT, "scripts");
const STATE     = join(ROOT, "dressing-room", "state");
const SELF      = join(STATE, "organism_self.md");
const BLEDGER   = join(STATE, "brain_ledger.jsonl");
// the HUMAN-framing sources: what the organism does + how his day flows, in story form
// (NOT code). Claude uses these for the feel/routine, and the live modules for currency.
const FUNCTIONAL_DOCS = ["THE_ORGANISM_THE_WHOLE_STORY.md", "THE_CYBORG_OWNERS_MANUAL.md", "learning-layer/GEMINI_LOOP.md"];

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
function writeAtomic(p, txt) { mkdirSync(dirname(p), { recursive: true }); const tmp = p + ".tmp"; writeFileSync(tmp, txt); renameSync(tmp, p); }

// pull each module's leading comment header — its OWN description of what it does NOW
function moduleHeader(file) {
  const lines = readFileSync(join(SCRIPTS, file), "utf8").split(/\r?\n/);
  const out = [];
  for (const l of lines) {
    const t = l.trim();
    if (t.startsWith("#!")) continue;
    if (t.startsWith("//")) { out.push(t.replace(/^\/\/+\s?/, "").replace(/^=+$/, "").trim()); continue; }
    if (t === "" && out.length === 0) continue;   // skip leading blanks
    break;                                          // first real code line ends the header
  }
  return out.filter(Boolean).join("\n").slice(0, 1600);
}

function gatherMachinery(deps = {}) {
  const files = (deps.files || readdirSync(SCRIPTS)).filter(f => f.endsWith(".mjs") && !/test_|_demo/.test(f)).sort();
  const modules = [];
  for (const f of files) {
    try { const desc = (deps.read ? deps.read(f) : moduleHeader(f)); if (desc && desc.length > 20) modules.push({ file: f, desc }); } catch {}
  }
  const pkg = deps.pkg || readJson(join(ROOT, "package.json")) || {};
  let skills = []; try { skills = deps.skills || readdirSync(join(ROOT, ".claude", "skills")); } catch {}
  // the human-framing story + routine docs (feel, day-flow, WHY) — for a plain explanation
  let docs = [];
  if (deps.docs) docs = deps.docs;
  else for (const d of FUNCTIONAL_DOCS) { try { const p = join(ROOT, d); if (existsSync(p)) docs.push({ name: d, text: readFileSync(p, "utf8").slice(0, 16000) }); } catch {} }
  return { modules, npmScripts: Object.keys(pkg.scripts || {}), skills, docs };
}

function buildPrompt(m) {
  const modules = m.modules.map(x => x.desc).join("\n---\n").slice(0, 32000);
  const docs = (m.docs || []).map(d => `## ${d.name}\n${d.text}`).join("\n\n").slice(0, 60000);
  return `You are writing THE ORGANISM'S PLAIN-LANGUAGE EXPLANATION OF ITSELF — the knowledge THE GAFFER (its living voice) uses whenever someone says "explain the organism", "what is this", "how does my day work", or when Nikhil shows a FRIEND who does NOT code and does NOT care about code. The friend wants to understand, in plain human words: WHAT this thing does, HOW it works, WHERE it happens, and WHY it exists.

WHO NIKHIL IS: a person with ADHD-PI training to become an AI Product Engineer. The organism ("Arsenal AI FC") is a football-club-themed system that carries his executive function (starting things, holding context, sense of time) so he can just learn and work. He is the captain, #14.

ABSOLUTE RULES FOR YOUR OUTPUT (this is the whole point — do not break them):
- PLAIN HUMAN LANGUAGE ONLY. NO code, NO file names, NO script names, NO ports, NO technical jargon. If a concept is technical, explain it with an everyday analogy. A friend who has never programmed must follow EVERY sentence.
- Explain WHAT it does for him, HOW it works (as a feeling/story, not a mechanism), WHERE each thing happens (which room / app / moment), and how his WHOLE DAY FLOWS start to finish.
- Cover his real daily routine in order: the morning kickoff; LEARNING (he learns AI concepts and Python by talking to a coach on his computer); PRACTICE (he writes code in an online notebook); his TWO assistant-coaches (one reviews his code like a senior developer, one quizzes him daily); the 30-second evening close; and what the machine does OVERNIGHT while he sleeps so tomorrow is ready.
- Cover, in plain terms: the whole club and its "rooms"; the BRAIN — how it quietly decides which moments deserve deep thought, how it remembers the important things, and how it forgets the rest on purpose (like a human); the coaches and the honesty rules; and the features they deliberately REFUSED to build (and why that restraint is the point).
- Be vivid and warm — like showing a friend around a stadium you built by hand. Ground everything in what actually exists below. Invent NOTHING. No hype words — the honesty IS the pitch.
- Output MARKDOWN, structured as a spoken tour with clear section headings. Make it LONG and detailed — a genuine 30-40 minute telling.

═══ THE STORY, THE ROUTINE, THE WHY (the human framing — draw the feel, the day-flow, and the soul from here) ═══
${docs}

═══ WHAT ACTUALLY EXISTS RIGHT NOW (each line is one real capability — TRANSLATE each into a plain-human "what it does for him"; this list keeps you CURRENT and complete; NEVER name any of these files/scripts in your output) ═══
${modules}

SKILLS HE CAN INVOKE: ${m.skills.join(", ")}`;
}

function claudeCall(prompt, model = "opus", timeoutMs = 400000) {
  const t0 = Date.now();
  try {
    const raw = execFileSync("claude", ["-p", "--output-format", "json", "--model", model], { input: prompt, timeout: timeoutMs, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, windowsHide: true });
    const j = JSON.parse(raw);
    const inTok = (j.usage && j.usage.input_tokens) || 0, outTok = (j.usage && j.usage.output_tokens) || 0;
    return { ok: j.is_error !== true && !!j.result, text: String(j.result || ""), tokens: inTok + outTok, ms: Date.now() - t0, error: j.is_error ? String(j.result).slice(0, 200) : null, limit_hit: false };
  } catch (e) {
    const msg = String((e && e.message) || e);
    return { ok: false, text: "", tokens: 0, ms: Date.now() - t0, error: msg.slice(0, 200), limit_hit: /limit|overloaded|rate.?limit|resets \d/i.test(msg) };
  }
}

function generate(deps = {}) {
  const m = deps.gather ? deps.gather() : gatherMachinery();
  if (!m.modules.length) return { ok: false, error: "no modules found" };
  const call = deps.call || ((p) => claudeCall(p, deps.model || "opus"));
  const r = call(buildPrompt(m));
  (deps.meter || ((row) => { try { appendFileSync(BLEDGER, JSON.stringify(row) + "\n"); } catch {} }))({ ts: new Date().toISOString(), job: "selfknowledge", engine: "claude", model: deps.model || "opus", total_tokens: r.tokens || 0, duration_ms: r.ms || 0, ok: !!r.ok, error: r.error || null, limit_hit: !!r.limit_hit });
  if (!r.ok || !r.text.trim()) return { ok: false, error: r.error || "empty generation", tokens: r.tokens };
  const stamp = deps.now ? deps.now.toISOString() : new Date().toISOString();
  const out = `<!-- ORGANISM SELF-PORTRAIT · generated from the LIVE code by selfknowledge.mjs · ${stamp} · do NOT hand-edit — regenerate. -->\n\n${r.text.trim()}\n`;
  (deps.write || ((t) => writeAtomic(SELF, t)))(out);
  return { ok: true, tokens: r.tokens, modules: m.modules.length, bytes: out.length };
}

// what the Gaffer reads at briefing time (fresh if present; caller falls back to the legacy keynote if absent)
function loadSelfKnowledge(deps = {}) {
  const p = deps.path || SELF;
  try { if (existsSync(p)) return readFileSync(p, "utf8"); } catch {}
  return null;
}

async function selftest() {
  const checks = [];
  const assert = (n, c) => { checks.push(!!c); console.log(`  ${c ? "✓" : "✗"} ${n}`); };
  const mockGather = () => ({
    modules: [{ file: "thalamus.mjs", desc: "THE THALAMUS — the salience door where every sense lands." }, { file: "cortex.mjs", desc: "THE CORTEX — the deep brain, serves wakes." }],
    npmScripts: ["brain", "dugout"], skills: ["forge", "learn"], docs: [{ name: "STORY.md", text: "He is the captain. Thoughts died on staircases before the club." }],
  });
  const p = buildPrompt(mockGather());
  assert("prompt demands PLAIN HUMAN language — explicitly NO code / files / jargon", /PLAIN HUMAN LANGUAGE ONLY/.test(p) && /NO code, NO file names/.test(p) && /never programmed/.test(p));
  assert("prompt draws feel + day-flow from the human STORY + ROUTINE docs", /THE STORY, THE ROUTINE/.test(p) && /staircases/.test(p));
  assert("prompt covers his real WHOLE-DAY flow + overnight, for a non-coder friend", /WHOLE DAY FLOWS/.test(p) && /OVERNIGHT/.test(p) && /daily routine/i.test(p));
  assert("prompt stays CURRENT via live modules but forbids naming any file/script", /WHAT ACTUALLY EXISTS RIGHT NOW/.test(p) && /NEVER name any of these files/.test(p));
  let wrote = null, metered = null;
  const r = generate({ gather: mockGather, now: new Date("2026-07-18T21:00:00Z"), call: () => ({ ok: true, text: "# The Organism\nA cognitive prosthesis...", tokens: 12000, ms: 25000 }), write: (t) => { wrote = t; }, meter: (row) => { metered = row; } });
  assert("generate: writes the self-portrait + stamps it live-generated", r.ok && wrote && /generated from the LIVE code/.test(wrote) && /The Organism/.test(wrote));
  assert("generate: metered as a 'selfknowledge' claude job", metered && metered.job === "selfknowledge" && metered.total_tokens === 12000);
  const bad = generate({ gather: mockGather, call: () => ({ ok: false, error: "session limit", limit_hit: true }), write: () => { throw new Error("must not write on failed gen"); }, meter: () => {} });
  assert("generate: a failed/limit-hit call writes NOTHING (never a broken portrait)", bad.ok === false && /limit/.test(bad.error));
  assert("generate: empty machinery → honest fail, no crash", generate({ gather: () => ({ modules: [], npmScripts: [], skills: [], stateFiles: [] }) }).ok === false);
  assert("loadSelfKnowledge: absent file → null (caller falls back to legacy keynote)", loadSelfKnowledge({ path: join(STATE, "no_such_self.md") }) === null);
  const passed = checks.every(Boolean);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "selftest") process.exit((await selftest()) ? 0 : 1);
  const mi = args.indexOf("--model");
  const model = mi >= 0 ? args[mi + 1] : "opus";
  console.log(`selfknowledge: reading the live machinery + generating the organism self-portrait (${model})...`);
  const r = generate({ model });
  console.log(r.ok
    ? `selfknowledge: wrote organism_self.md — ${r.modules} modules read, ${(r.tokens || 0).toLocaleString()} tok, ${(r.bytes / 1024).toFixed(1)}KB. The Gaffer's self-knowledge is fresh.`
    : `selfknowledge: FAILED — ${r.error}${r.tokens ? ` (${r.tokens} tok spent)` : ""}`);
  process.exit(r.ok ? 0 : 1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { gatherMachinery, buildPrompt, generate, loadSelfKnowledge, moduleHeader };
