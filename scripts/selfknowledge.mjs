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
// MODES: node scripts/selfknowledge.mjs            -> generate (Opus)  [FROZEN, see below]
//        node scripts/selfknowledge.mjs --model sonnet
//        node scripts/selfknowledge.mjs consumers  -> who reads organism_self.md, right now
//        node scripts/selfknowledge.mjs --thaw     -> run anyway (an explicit human act)
//        node scripts/selfknowledge.mjs selftest   -> baked-mock checks (no claude)
//
// ============================ FROZEN (audit #46, 2026-08-04) ================
// THE ORGAN IS NOT DELETED AND NOT EDITED AWAY — it is FROZEN, and it says so.
// Measured on 4 Aug 2026: organism_self.md is 88,950 bytes and its ONLY TWO
// consumers were removed on 29 Jul 2026 — dugout.mjs:1280 and dugout.mjs:1323
// are now literal tombstone comments ("selfKnowledgeBlock() lived here until
// 29 Jul 2026. It pasted organism_self.md…"). Repo-wide, no line of code opens
// the file. Its one scheduled firing exited 1 having spent 0 tokens.
//
// WHY THE FREEZE COMES FIRST: the two fixes in flight for this file (#74, the
// stderr swallow directly below, and #45, the un-runnable task settings) are
// exactly the fixes that make it START SUCCEEDING. Landing either one first
// would ARM a weekly ~29k-token Opus call with no reader — and selfknowledge is
// NOT in brain_config.json: it shells `claude -p` at claudeCall() and self-meters
// at generate(), bypassing the brain's budget gate entirely. Fix the reporting
// of a job that must not run, and you have armed it.
//
// THE FREEZE IS SELF-LIFTING, WHICH IS THE POINT (the organism's law: never
// delete an organ because nobody reads its output — GIVE IT AN ADDRESS). This
// file does not hold a hand-set boolean. It COUNTS its consumers on every run
// (findConsumers below: a live `organism_self` reference in real code, comments
// and tombstones excluded). Zero consumers -> refuse, loudly, naming what would
// re-enable it. One consumer -> it thaws itself, automatically, and says so.
// Whether it gets that address is the captain's decision, not this file's.
// ============================================================================
import { readdirSync, readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync, renameSync, statSync } from "node:fs";
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
// THE_ORGANISM__EVERYTHING.md is the current source-of-truth self-portrait (hand-synthesized 2026-07-19
// from a full live-code deep-read; supersedes the older story/manual docs, which stay in the repo by the
// layering law but are no longer the regen source — they had gone stale). The Gaffer's spoken self-knowledge
// is regenerated FROM this book, so "tell me everything" / "explain just the brain|memory|learning" are grounded in it.
const FUNCTIONAL_DOCS = ["THE_ORGANISM__EVERYTHING.md"];

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
function writeAtomic(p, txt) { mkdirSync(dirname(p), { recursive: true }); const tmp = p + ".tmp"; writeFileSync(tmp, txt); renameSync(tmp, p); }

// ---------------------------------------------------------------------------
// THE FREEZE (audit #46) — does anything actually READ organism_self.md?
// ---------------------------------------------------------------------------
// Scans the directories that can hold a consumer for a LIVE reference to the
// artifact. A line is a consumer only if it is real code: pure `//` comment
// lines are skipped, which is precisely how dugout.mjs:1280/:1323 (the two
// tombstones left when the consumers were deleted on 29 Jul) are excluded
// without pretending they are not there — `consumers` mode prints them as
// `tombstones` so the human sees WHY the count is zero.
const SELF_ARTIFACT = "organism_self";
const CONSUMER_ROOTS = ["scripts", "hooks", "setup", join(".claude", "skills"), join("dressing-room", "manager")];
function findConsumers(deps = {}) {
  const root = deps.root || ROOT;
  const scan = deps.scan || ((dir) => {
    const out = [];
    const walk = (d) => {
      let entries = [];
      try { entries = readdirSync(d, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        const p = join(d, e.name);
        if (e.isDirectory()) { walk(p); continue; }
        if (!/\.(mjs|js|cjs|md|ps1|cmd|json)$/i.test(e.name)) continue;
        if (p === join(root, "scripts", "selfknowledge.mjs")) continue;   // the writer is not a reader
        let txt = ""; try { txt = readFileSync(p, "utf8"); } catch { continue; }
        if (!txt.includes(SELF_ARTIFACT)) continue;
        txt.split(/\r?\n/).forEach((line, i) => {
          if (!line.includes(SELF_ARTIFACT)) return;
          out.push({ file: p.slice(root.length + 1).replace(/\\/g, "/"), line: i + 1, text: line.trim().slice(0, 160) });
        });
      }
    };
    walk(dir);
    return out;
  });
  const hits = [];
  for (const rel of CONSUMER_ROOTS) hits.push(...scan(join(root, rel)));
  // a pure comment line is a tombstone, not a reader. Both are reported.
  const isComment = (t) => /^(\/\/|\*|\/\*|#|<!--)/.test(t.trim());
  const live = hits.filter(h => !isComment(h.text));
  const tombstones = hits.filter(h => isComment(h.text));
  return { count: live.length, live, tombstones };
}

// The refusal the captain reads. It never guesses: it prints the measured
// consumer count, the size and age of the artifact nobody is opening, and the
// ONE thing that re-enables the organ.
function freezeCheck(deps = {}) {
  const c = deps.consumers || findConsumers(deps);
  if (c.count > 0) {
    return { frozen: false, consumers: c.count, why: `${c.count} live consumer(s) of ${SELF_ARTIFACT}.md — the freeze has lifted itself`, detail: c };
  }
  let bytes = null, mtime = null;
  try { const s = statSync(SELF); bytes = s.size; mtime = new Date(s.mtimeMs).toISOString().slice(0, 10); } catch {}
  return {
    frozen: true,
    consumers: 0,
    why: `FROZEN — 0 live consumers of ${SELF_ARTIFACT}.md`
       + (bytes !== null ? ` (${bytes.toLocaleString()} bytes on disk, last written ${mtime})` : " (artifact not on disk)")
       + `; both readers were deleted on 29 Jul 2026 and ${c.tombstones.length} tombstone comment(s) remain.`,
    detail: c,
  };
}

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
  else for (const d of FUNCTIONAL_DOCS) { try { const p = join(ROOT, d); if (existsSync(p)) docs.push({ name: d, text: readFileSync(p, "utf8").slice(0, 200000) }); } catch {} }
  return { modules, npmScripts: Object.keys(pkg.scripts || {}), skills, docs };
}

function buildPrompt(m) {
  const modules = m.modules.map(x => x.desc).join("\n---\n").slice(0, 32000);
  const docs = (m.docs || []).map(d => `## ${d.name}\n${d.text}`).join("\n\n").slice(0, 200000);
  return `You are writing THE ORGANISM'S PLAIN-LANGUAGE EXPLANATION OF ITSELF — the knowledge THE GAFFER (its living voice) uses whenever someone says "explain the organism", "what is this", "how does my day work", or when Nikhil shows a FRIEND who does NOT code and does NOT care about code. The friend wants to understand, in plain human words: WHAT this thing does, HOW it works, WHERE it happens, and WHY it exists.

WHO NIKHIL IS: a person with ADHD-PI training to become an AI Product Engineer. The organism ("Arsenal AI FC") is a football-club-themed system that carries his executive function (starting things, holding context, sense of time) so he can just learn and work. He is the captain, #14.

OUTPUT CONTRACT (do not break): Respond with ONLY the document text — your entire reply IS the document. Do NOT use any tools, do NOT create or write any files, do NOT ask for approval or confirmation, do NOT preface or describe what you wrote. Begin directly with a markdown heading.

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

// AUDIT #74 (4 Aug 2026) — THE STDERR SWALLOW.
// The old catch was `String(e.message).slice(0, 200)`. For execFileSync, `e.message`
// is the CLI's synthetic banner — "Command failed: claude -p --output-format json
// --model opus" is 58 characters on its own — and the actual diagnosis (auth
// expired, model unavailable, the plan wall, a stack trace) is in `e.stderr`,
// which was thrown away untouched. That is why the one scheduled firing of this
// job "exited 1 with 0 tokens" and nobody could say why for six days.
// ERR_KEEP arithmetic (not a guess): the ledger row is one JSON line; the banner
// costs ~60 chars, `code=/exit=/signal=` ~30, so 600 leaves ~500 characters of
// real stderr — enough for a full auth error or the first frames of a stack —
// while keeping the row well under a 1 KB line.
const ERR_KEEP = 600;
function describeSpawnFailure(e) {
  const bits = [];
  if (e && e.code) bits.push(`code=${e.code}`);
  if (e && e.status !== undefined && e.status !== null) bits.push(`exit=${e.status}`);
  if (e && e.signal) bits.push(`signal=${e.signal}`);
  const stderr = String((e && e.stderr) || "").trim();
  const stdout = String((e && e.stdout) || "").trim();
  // an Error carries .message; a thrown string IS the message. An object with
  // neither must NOT be stringified into the useless literal "[object Object]" —
  // that is the same class of lie as the banner this function exists to replace.
  const msg = (e && typeof e.message === "string") ? e.message.trim()
    : (typeof e === "string" ? e.trim() : "");
  const parts = [
    bits.length ? bits.join(" ") : null,
    msg || null,
    stderr ? `stderr: ${stderr}` : null,
    // stdout only when stderr is silent — a CLI that fails on stdout still owes an answer
    !stderr && stdout ? `stdout: ${stdout}` : null,
  ].filter(Boolean);
  const full = parts.join(" — ");
  return {
    error: (full || "spawn failed with no message, no stderr and no exit code").slice(0, ERR_KEEP),
    stderr: stderr ? stderr.slice(0, ERR_KEEP) : null,
    // the limit test now reads the WHOLE failure, not just the banner: a plan-wall
    // message arrives on stderr, where the old test could never see it.
    limit_hit: /limit|overloaded|rate.?limit|resets \d/i.test(full),
  };
}

function claudeCall(prompt, model = "opus", timeoutMs = 400000) {
  const t0 = Date.now();
  try {
    const raw = execFileSync("claude", ["-p", "--output-format", "json", "--model", model], { input: prompt, timeout: timeoutMs, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, windowsHide: true, env: { ...process.env, ARSENAL_ORGAN: "1" } });
    const j = JSON.parse(raw);
    const inTok = (j.usage && j.usage.input_tokens) || 0, outTok = (j.usage && j.usage.output_tokens) || 0;
    return { ok: j.is_error !== true && !!j.result, text: String(j.result || ""), tokens: inTok + outTok, ms: Date.now() - t0, error: j.is_error ? String(j.result).slice(0, ERR_KEEP) : null, stderr: null, limit_hit: false };
  } catch (e) {
    const d = describeSpawnFailure(e);
    return { ok: false, text: "", tokens: 0, ms: Date.now() - t0, error: d.error, stderr: d.stderr, limit_hit: d.limit_hit };
  }
}

function generate(deps = {}) {
  // THE FREEZE (audit #46) — checked BEFORE the machinery is gathered and long
  // before a token is spent. `thaw: true` is the explicit human override (CLI
  // `--thaw`); it is recorded in the ledger row so a thawed run is never
  // mistaken for a normal one.
  const freeze = deps.freeze !== undefined ? deps.freeze : freezeCheck(deps);
  if (freeze.frozen && !deps.thaw) {
    return { ok: false, frozen: true, consumers: freeze.consumers, error: freeze.why, tokens: 0 };
  }
  const m = deps.gather ? deps.gather() : gatherMachinery();
  if (!m.modules.length) return { ok: false, error: "no modules found" };
  const call = deps.call || ((p) => claudeCall(p, deps.model || "opus"));
  const r = call(buildPrompt(m));
  (deps.meter || ((row) => { try { appendFileSync(BLEDGER, JSON.stringify(row) + "\n"); } catch {} }))({
    ts: new Date().toISOString(), job: "selfknowledge", engine: "claude", model: deps.model || "opus",
    total_tokens: r.tokens || 0, duration_ms: r.ms || 0, ok: !!r.ok,
    error: r.error || null,
    // #74: the ledger row carries the real cause now, not just the CLI's banner
    stderr: r.stderr || null,
    limit_hit: !!r.limit_hit,
    // #46: a run that only happened because a human forced it must say so
    thawed: !!(freeze.frozen && deps.thaw) || undefined,
    consumers: freeze.consumers,
  });
  if (!r.ok || !r.text.trim()) return { ok: false, error: r.error || "empty generation", tokens: r.tokens };
  // GUARD: the agentic CLI can misfire and return a META-MESSAGE ("I've written…, waiting on your approval…")
  // instead of the document text. Reject that so a good portrait is never clobbered by chatter.
  if (/\b(waiting on your approval|I've written|I have written|would you like me to|let me know if|go ahead and allow|approve the write|point me at a different|save (?:it|this) to)\b/i.test(r.text)) {
    return { ok: false, error: "agentic-meta response, not a portrait — old self-knowledge stands", tokens: r.tokens };
  }
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
  // AUDIT #46: these four exercise the GENERATION path, so they are handed an
  // explicitly UNFROZEN verdict. Without it they would silently start testing
  // the freeze instead of what their names claim — the exact drift this suite
  // exists to catch. The freeze itself is proven in its own block below.
  const OPEN = { frozen: false, consumers: 1, why: "test fixture: a reader exists" };
  const r = generate({ freeze: OPEN, gather: mockGather, now: new Date("2026-07-18T21:00:00Z"), call: () => ({ ok: true, text: "# The Organism\nA cognitive prosthesis...", tokens: 12000, ms: 25000 }), write: (t) => { wrote = t; }, meter: (row) => { metered = row; } });
  assert("generate: writes the self-portrait + stamps it live-generated", r.ok && wrote && /generated from the LIVE code/.test(wrote) && /The Organism/.test(wrote));
  assert("generate: metered as a 'selfknowledge' claude job", metered && metered.job === "selfknowledge" && metered.total_tokens === 12000);
  const bad = generate({ freeze: OPEN, gather: mockGather, call: () => ({ ok: false, error: "session limit", limit_hit: true }), write: () => { throw new Error("must not write on failed gen"); }, meter: () => {} });
  assert("generate: a failed/limit-hit call writes NOTHING (never a broken portrait)", bad.ok === false && /limit/.test(bad.error));
  const meta = generate({ freeze: OPEN, gather: mockGather, call: () => ({ ok: true, text: "I've written the full tour. It's waiting on your approval to save to X.md — go ahead and allow it." }), write: () => { throw new Error("must not write an agentic-meta response"); }, meter: () => {} });
  assert("generate: an agentic-meta response is rejected, never written as the portrait", meta.ok === false && /meta/.test(meta.error));
  assert("generate: empty machinery → honest fail, no crash", generate({ freeze: { frozen: false, consumers: 1 }, gather: () => ({ modules: [], npmScripts: [], skills: [], stateFiles: [] }) }).ok === false);
  assert("loadSelfKnowledge: absent file → null (caller falls back to legacy keynote)", loadSelfKnowledge({ path: join(STATE, "no_such_self.md") }) === null);

  // ---- AUDIT #74 — THE STDERR SWALLOW (fixed before #46's freeze made it safe) ----
  // The old code did String(e.message).slice(0,200). Reproduce the real shape
  // execFileSync throws (a synthetic banner + the true cause on .stderr) and
  // demand the cause survives.
  {
    const spawnErr = Object.assign(new Error("Command failed: claude -p --output-format json --model opus"),
      { status: 1, code: undefined, stderr: "Invalid API key · Please run /login\n  at authenticate (cli.js:1)", stdout: "" });
    const d = describeSpawnFailure(spawnErr);
    assert("#74 — the CLI's real stderr reaches the error string, not just its banner",
      /Invalid API key/.test(d.error) && /Please run \/login/.test(d.error) && d.stderr !== null);
    assert("#74 — the exit code is carried too (a bare 'Command failed' names nothing)", /exit=1/.test(d.error));
    const limitErr = Object.assign(new Error("Command failed"), { status: 1, stderr: "5-hour limit reached · resets 3pm" });
    assert("#74 — a plan-wall message on STDERR is now detected as limit_hit (it never could be before)",
      describeSpawnFailure(limitErr).limit_hit === true);
    const stdoutOnly = Object.assign(new Error("Command failed"), { status: 2, stderr: "", stdout: "model not found: opus-9" });
    assert("#74 — when stderr is silent, stdout is reported rather than nothing", /model not found/.test(describeSpawnFailure(stdoutOnly).error));
    const naked = describeSpawnFailure({});
    assert("#74 — a failure with NO message/stderr/code says exactly that, never an empty string",
      naked.error.length > 0 && /no message/.test(naked.error) && naked.stderr === null);
    let row = null;
    generate({ freeze: { frozen: false, consumers: 1 }, gather: mockGather, meter: (r) => { row = r; }, write: () => {},
      call: () => ({ ok: false, text: "", tokens: 0, ms: 5, error: "exit=1 — Command failed — stderr: Invalid API key", stderr: "Invalid API key", limit_hit: false }) });
    assert("#74 — the brain_ledger row carries stderr, so a silent failure is diagnosable tomorrow",
      row && row.stderr === "Invalid API key" && /Invalid API key/.test(row.error));
  }

  // ---- AUDIT #46 — THE FREEZE (sequenced AFTER #74 so the freeze itself is visible) ----
  {
    const noReaders = { count: 0, live: [], tombstones: [{ file: "scripts/dugout.mjs", line: 1280, text: "// selfKnowledgeBlock() lived here until 29 Jul 2026." }] };
    const fz = freezeCheck({ consumers: noReaders });
    assert("#46 — 0 live consumers ⇒ FROZEN, and the refusal names the tombstones", fz.frozen === true && /0 live consumers/.test(fz.why) && /tombstone/.test(fz.why));
    let spent = false;
    const blocked = generate({ consumers: noReaders, gather: mockGather, call: () => { spent = true; return { ok: true, text: "# x", tokens: 29000 }; }, write: () => { throw new Error("a frozen organ must not write"); }, meter: () => { throw new Error("a frozen organ must not bill"); } });
    assert("#46 — FROZEN refuses BEFORE the claude call: zero tokens, zero writes, zero ledger rows",
      blocked.ok === false && blocked.frozen === true && blocked.tokens === 0 && spent === false);
    assert("#46 — the refusal is loud and says what re-enables it", /FROZEN/.test(blocked.error) && /consumer/.test(blocked.error));
    // the override is a deliberate human act, and it is recorded as one
    let thawRow = null;
    const forced = generate({ consumers: noReaders, thaw: true, gather: mockGather, now: new Date("2026-07-18T21:00:00Z"),
      call: () => ({ ok: true, text: "# The Organism\nx", tokens: 29000, ms: 1 }), write: () => {}, meter: (r) => { thawRow = r; } });
    assert("#46 — `--thaw` runs, and the ledger row is stamped thawed:true (never silently normal)",
      forced.ok === true && thawRow && thawRow.thawed === true && thawRow.consumers === 0);
    // THE SELF-LIFTING PROPERTY — the day something reads the file, the organ wakes itself
    const withReader = { count: 1, live: [{ file: "scripts/dugout.mjs", line: 900, text: 'const self = readFileSync(join(STATE, "organism_self.md"))' }], tombstones: [] };
    assert("#46 — ONE live consumer lifts the freeze automatically (an address, not a hand-set flag)",
      freezeCheck({ consumers: withReader }).frozen === false
      && generate({ consumers: withReader, gather: mockGather, call: () => ({ ok: true, text: "# x", tokens: 1, ms: 1 }), write: () => {}, meter: () => {} }).ok === true);
    // and the scanner's comment rule, on the real tombstone shape
    const scanned = findConsumers({ scan: () => [
      { file: "scripts/dugout.mjs", line: 1280, text: "// selfKnowledgeBlock() lived here until 29 Jul 2026. It pasted organism_self.md" },
      { file: "scripts/dugout.mjs", line: 1323, text: "//   organism_self.md was the paste source" },
    ] });
    assert("#46 — a tombstone COMMENT is never counted as a consumer (that is how it reads zero today)",
      scanned.count === 0 && scanned.tombstones.length > 0 && scanned.tombstones.every(t => /selfKnowledgeBlock|paste source/.test(t.text)));
  }

  // THE LIVE READING, printed not asserted — honesty over green: the suite must
  // not pin a number that is the captain's to change.
  {
    const liveNow = findConsumers();
    console.log(`  · live reading: ${liveNow.count} consumer(s) of ${SELF_ARTIFACT}.md, ${liveNow.tombstones.length} tombstone reference(s) — organ is ${liveNow.count ? "ACTIVE" : "FROZEN"}`);
  }

  const passed = checks.every(Boolean);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "selftest") process.exit((await selftest()) ? 0 : 1);

  // `consumers` — the freeze's evidence, on demand. Read-only, always exit 0.
  if (args[0] === "consumers") {
    const c = findConsumers();
    console.log(`selfknowledge: ${c.count} LIVE consumer(s) of ${SELF_ARTIFACT}.md · ${c.tombstones.length} tombstone reference(s)`);
    for (const h of c.live) console.log(`  READER    ${h.file}:${h.line}  ${h.text}`);
    for (const h of c.tombstones) console.log(`  tombstone ${h.file}:${h.line}  ${h.text}`);
    console.log(c.count ? "  → the organ is ACTIVE (the freeze lifted itself)." : "  → the organ is FROZEN. Give it a surface and it wakes up on its own.");
    return;
  }

  const thaw = args.includes("--thaw");
  const freeze = freezeCheck();
  if (freeze.frozen && !thaw) {
    // A refusal the human can act on: what is true, why it is frozen, and the two
    // ways out. Exit 1 so a scheduled firing is a FAILURE, not a silent success.
    console.error(`selfknowledge: ${freeze.why}`);
    console.error("  This job would spend a weekly ~29k-token Opus call on a file nothing opens, and it is NOT");
    console.error("  in brain_config.json — it shells `claude -p` directly, outside the brain's budget gate.");
    console.error(`  Nothing was run. Nothing was written. Nothing was billed.`);
    console.error("  TO RE-ENABLE, give it an address: make something READ organism_self.md (the dugout briefing");
    console.error("  block that used to — see the tombstones at `node scripts/selfknowledge.mjs consumers`).");
    console.error("  The freeze lifts itself the moment one live reader exists. To run once anyway: --thaw");
    process.exit(1);
  }

  const mi = args.indexOf("--model");
  const model = mi >= 0 ? args[mi + 1] : "opus";
  if (freeze.frozen && thaw) console.log(`selfknowledge: --thaw — running a FROZEN organ deliberately (${freeze.consumers} consumers). This run is stamped thawed:true in the ledger.`);
  console.log(`selfknowledge: reading the live machinery + generating the organism self-portrait (${model})...`);
  const r = generate({ model, thaw, freeze });
  console.log(r.ok
    ? `selfknowledge: wrote organism_self.md — ${r.modules} modules read, ${(r.tokens || 0).toLocaleString()} tok, ${(r.bytes / 1024).toFixed(1)}KB. The Gaffer's self-knowledge is fresh.`
    : `selfknowledge: FAILED — ${r.error}${r.tokens ? ` (${r.tokens} tok spent)` : ""}`);
  process.exit(r.ok ? 0 : 1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { gatherMachinery, buildPrompt, generate, loadSelfKnowledge, moduleHeader, findConsumers, freezeCheck, describeSpawnFailure };
