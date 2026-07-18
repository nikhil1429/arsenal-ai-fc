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
  let stateFiles = []; try { stateFiles = (deps.stateFiles || readdirSync(STATE)).filter(f => /\.json$|\.jsonl$/.test(f)); } catch {}
  return { modules, npmScripts: Object.keys(pkg.scripts || {}), skills, stateFiles };
}

function buildPrompt(m) {
  const mod = m.modules.map(x => `### scripts/${x.file}\n${x.desc}`).join("\n\n");
  return `You are writing the DEFINITIVE, CURRENT self-portrait of a real personal AI organism, grounded ENTIRELY in its actual SOURCE CODE below — never in any external design doc (those are stale). Below is EVERY module's own header comment (what each part ACTUALLY does right now), plus its skills, run-scripts, and live state files.

CONTEXT: This is "Arsenal AI FC" — a football-club-themed cognitive prosthesis for ONE person (Nikhil, the captain, #14) who has ADHD-PI. It carries his executive function (initiation, working memory, time-sense) so he can just learn and work. He is training to become an AI Product Engineer.

YOUR JOB: Write a comprehensive, vivid, ACCURATE, engaging explanation of the WHOLE organism that a smart friend hearing it for the first time could follow for 30-40 minutes. It will be the knowledge THE GAFFER (the club's living voice) uses to explain itself to a guest, so it must be GOD-TIER and true to the code.

COVER (grounded in the real modules below — name the actual files/mechanisms):
1. What it IS (the one-line soul) and WHY it exists — the before-world of thoughts dying on staircases, the ADHD tax, a cognitive prosthesis.
2. THE LAYERS, clearly separated:
   - the EXECUTION / outwork layer (time-audit, presence, the daily match, the Manager team-sheet);
   - the LEARNING layer (the Forge 9-axis method, the rep engine, capture, FSRS, the Gems/Colab loop, the examiner/scrimmage);
   - the CYBORG BRAIN — the thalamus (the reception desk + salience bouncer), the cortex/deep Opus brain, memory/hippocampus (scribe, ledger-of-self, consolidator, biological forgetting), the seven parallel minds, the default-mode network / rest room, predictive presence, AND the newest working-memory layer (the externalized working-set/distiller, the continuous Haiku pulse, the resident daemon pacemaker, the ambient context river, the overnight concept-graph, the organism-memory MCP door).
3. How a single MOMENT flows through it, end to end.
4. The LAWS it obeys — AI proposes / code validates / human approves; the medical clamp (data-analyst never prescriber, RED = doctor-referral); earned-voice (a salient moment does not earn a voice); machine-is-public / moments-are-private; the budget governor pinning the plan.
5. What makes it genuinely HARD TO COPY (trust enforced in code, the longitudinal record, the category).

RULES: Ground EVERY claim in a module that actually exists below. Invent NOTHING. No hype words — the honesty IS the pitch. Structure it as a spoken tour with clear section headers. Output MARKDOWN only. Be maximally detailed and precise.

═══ THE ACTUAL MACHINERY (every module's own words — the source of truth) ═══
${mod}

═══ SKILLS ═══ ${m.skills.join(", ")}
═══ RUN-SCRIPTS ═══ ${m.npmScripts.join(", ")}
═══ LIVE STATE FILES (the organs' memory) ═══ ${m.stateFiles.slice(0, 60).join(", ")}`;
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
    modules: [{ file: "thalamus.mjs", desc: "THE THALAMUS — the salience door on :4113 where every sense lands." }, { file: "cortex.mjs", desc: "THE CORTEX — the deep Opus brain, serves wakes." }],
    npmScripts: ["brain", "dugout"], skills: ["forge", "learn"], stateFiles: ["afferent.jsonl"],
  });
  const p = buildPrompt(mockGather());
  assert("prompt grounds in REAL module headers (names the actual files)", p.includes("scripts/thalamus.mjs") && p.includes("scripts/cortex.mjs"));
  assert("prompt forbids stale docs + demands god-tier accuracy from source", /never in any external design doc|source of truth/i.test(p) && /Invent NOTHING/.test(p));
  assert("prompt covers all three layers + the newest working-memory brain layer", /EXECUTION/.test(p) && /LEARNING layer/.test(p) && /CYBORG BRAIN/.test(p) && /concept-graph|Haiku pulse|working-set/.test(p));
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
