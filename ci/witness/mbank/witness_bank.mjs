#!/usr/bin/env node
// ============================================================================
// ci/witness/mbank/witness_bank.mjs — UNIT mbank · THE BANK TAKES HIS SPOKEN WORDS FROM THE PROMPT RECORD, BY PLANTS
//   (spec ci/mbank/MBANK_SPEC.md on claude/mbank-spec @ 653151d §4; ruling forks row 1230 — where they differ the ruling
//    wins, and ci/mbank/PROOF.md names each difference)
// ----------------------------------------------------------------------------
// USAGE
//   node ci/witness/mbank/witness_bank.mjs plants [--tree <dir>] [--only <id,…>] [--tmp <dir>]
//   --tree   the tree under test (default: this file's repository). Its scripts/ are COPIED for every plant.
//   --tmp    an existing dir to plant under (the unit witness ci/mbank/witness_mbank.mjs hands its own, for LAST).
// CONTRACT
//   · Every plant is a COPY under os.tmpdir(): <tree>/scripts + package.json, node_modules linked, and a planted
//     dressing-room/state written by THIS file's node code (writeFileSync) — the repository's own state dir is never
//     opened. Every organ runs as a CHILD on that copy (spawnSync; each organ's STATE_DIR is its own copy's), or is
//     imported from the copy and handed planted rows.
//   · No ARSENAL_* variable reaches a child (each is deleted from the env) but ONE, ARSENAL_AUDIT_NO_SPAWN=1, teaching_audit's
//     own test seam, so a planted Stop spawns nothing; CLAUDE_CODE_SESSION_ID is PLANTED (the plant's
//     own id, or a different one for B3 (d)); the PATH carries a shim for `claude` and `gemini` that refuses: no live
//     model call can happen here (the capture door is model-free by law anyway).
//   · THE PORT CLASS (row 1053): no port is bound, no service is named, nothing is POSTed, nothing restarts; no network.
//     Every wait is a spawnSync that ends with its child; the outer bound is the caller's (the suite member's own
//     timeout-minutes). No timeout, budget or size is typed here.
//   · CRLF-proof: every read splits on \r?\n and strips a BOM; no POSIX-only shell; no git repo is planted.
// THE CLAUSES (each RED on base 5301f15, GREEN on the build; planted both ways on the tree it judges)
//   B1  WORDS     prompt "pakka - plant  answer\n one two three" (turn T); capture --said "plant answer one two three"
//                 --surface code → ONE row: spoken = HIS slice byte for byte (his spaces and newline), spoken_src prompt, turn T
//   B2  DRIFT     the same prompt, --said "plant answer one 2 three" → exit 1 "--said is not inside his message", no row
//   B3  ABSENT    (a) no record (b) blank text (c) consumed_at set (d) another session's id (e) no turn_id (mbank-6 a)
//                 → each exit 1 naming its reason; the grade queue stays absent
//   B4  WHOLE     --surface code with no --said (and an empty stdin) → spoken = the whole message
//   B5  GUT       prompt "shayad - …", no --gut → row gut shaky; --gut knew on it → refused; --gut on a gutless message → refused
//   B6  HEDGE     prompt "shayad - …" (no hedge in the answer), --gut shaky, --said = the whole message → hedges 0 (mbank-7 a)
//   B7  TURN      an open forge session (axis a, a check_q), then the prompt (turn T): the capture's turn_id and the
//                 `forge_session.mjs crack` row's turn_id both equal T
//   B8  STDIN     --note "dugout-voice think:1ms", stdin words, NO prompt record → banked with those words, spoken_src voice
//   B9  ONE DOOR  forge_session.mjs exports hisPrompt + readHisPrompt; gaffer_brain.mjs reaches readHisPrompt and names
//                 no prompt-record path; crackRow calls hisPrompt
//   B10 ONCE      the B1 call twice → the second says `already banked <id>`, exit 0, one row
//   B11 READERS   over the B1 row: buildJudgePrompt holds spoken byte-equal, validateRegister reads it, buildNote's bank
//                 receipt carries it as `said` (a string) — and the row is a prompt-door row
//   B12 MCRK      crackRow through the re-pointed door: mcrk's refusal line for absent / before-session / blank, his words
//                 byte-equal on a good plant, and the prompt's turn_id on the row
//   B13 STAMP     (mbank-8 a) buildNote with a crack row carrying turn T → the compiled crack item carries turn_id T
//   B15 PARALLEL  (row 1246) the real UserPromptSubmit hook records HIS prompt (session S), then ANOTHER session's prompt
//                 lands in the shared slot before his bank call: the capture (CLAUDE_CODE_SESSION_ID = S) banks HIS bytes and
//                 HIS turn id from his own session's record
//   B16 AUDIT     (row 1248) a planted study day: an open forge session, then two of his turns, each with ANOTHER session's
//                 UserPromptSubmit landing between his prompt and his Stop: the teaching audit's own Stop rows read
//                 user_text_source "fresh" on both (session-mismatch ZERO), each naming HIS turn id
//   B14 MINT      the REAL UserPromptSubmit hook (teaching_audit.mjs hook, his prompt on stdin, the plant's session id) mints
//                 a UUID turn_id on the prompt record, and the code-door capture that follows carries that same id
// OUTPUT: one `CLAUSE <id> GREEN|RED · <why>` line per clause, then `PLANTS mbank · k of n plant(s) as expected` (exit 0
//   iff k === n and n > 0).
// ============================================================================
import { mkdtempSync, mkdirSync, cpSync, symlinkSync, existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve, dirname, delimiter } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
if (argv[0] !== "plants") { console.log("witness_bank: usage — plants [--tree <dir>] [--only <id,…>] [--tmp <dir>]"); process.exit(1); }
const TREE = resolve(arg("--tree") || join(HERE, "..", "..", ".."));
const ONLY = arg("--only") ? arg("--only").split(",").map((s) => s.trim()).filter(Boolean) : null;
const OWN_TMP = !arg("--tmp");
const TMP = arg("--tmp") ? mkdtempSync(join(resolve(arg("--tmp")), "bank-")) : mkdtempSync(join(tmpdir(), "mbank-bank-"));
for (const k of Object.keys(process.env)) if (/^ARSENAL_/i.test(k)) delete process.env[k];

const SHIM = join(TMP, "shim"); mkdirSync(SHIM);
for (const tool of ["claude", "gemini"]) {
  writeFileSync(join(SHIM, tool), "#!/bin/sh\necho \"REFUSED — no live model call in a witness (unit mbank)\" >&2\nexit 1\n", { mode: 0o755 });
  writeFileSync(join(SHIM, `${tool}.cmd`), "@echo REFUSED — no live model call in a witness (unit mbank) 1>&2\r\n@exit /b 1\r\n");
}
const SID = "sess-witness-mbank";
const envOf = (sid = SID) => {
  const e = { ...process.env }; const pk = Object.keys(e).find((k) => k.toUpperCase() === "PATH") || "PATH";
  e[pk] = `${SHIM}${delimiter}${e[pk] || ""}`;
  if (sid) e.CLAUDE_CODE_SESSION_ID = sid; else delete e.CLAUDE_CODE_SESSION_ID;
  e.ARSENAL_AUDIT_NO_SPAWN = "1";   // teaching_audit's own seam: its Stop auto-count spawns nothing from a plant
  return e;
};
const NM = [TREE, join(HERE, "..", "..", "..")].map((t) => join(t, "node_modules")).find((p) => existsSync(p)) || null;
const text = (p) => { try { return readFileSync(p, "utf8").replace(/^﻿/, ""); } catch { return null; } };
const lines = (s) => String(s || "").split(/\r?\n/);
const fold = (s) => String(s || "").replace(/\s+/g, " ").trim();
const T = "11111111-2222-4333-8444-555555555555";
const ASK = ["--asked", "Pehla merge kaunsa pair hota hai?"];

let seq = 0;
function plant(name) {
  const dir = join(TMP, `${++seq}-${name}`);
  cpSync(join(TREE, "scripts"), join(dir, "scripts"), { recursive: true });
  if (existsSync(join(TREE, "package.json"))) cpSync(join(TREE, "package.json"), join(dir, "package.json"));
  if (NM) symlinkSync(NM, join(dir, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  const state = join(dir, "dressing-room", "state");
  mkdirSync(state, { recursive: true });
  writeFileSync(join(state, "concepts.json"), JSON.stringify({ concepts: { tokenization: { core_axes: ["d"] } } }) + "\n");
  const at = (f) => join(state, f);
  const node = (file, a, { input = "", sid = SID } = {}) => {
    const r = spawnSync(process.execPath, [join(dir, "scripts", file), ...a], { cwd: dir, env: envOf(sid), input, encoding: "utf8", windowsHide: true });
    return { code: r.status, out: String(r.stdout || ""), err: String(r.stderr || ""), all: `${r.stdout || ""}${r.stderr || ""}` };
  };
  // the two registry rows the bank door reads (probe kinds, registers), seeded through the registry's OWN `set` verb
  for (const row of [{ subject: "probe_kinds", subjects: ["recall", "reconstruct", "defend", "novel", "negative_space", "jirah", "cross_axis"] },
    { subject: "registers", subjects: ["hinglish", "interview"] }]) {
    const r = node("registry.mjs", ["set", "--table", "mechanisms", "--json", JSON.stringify({ ...row, schema_owner: "gaffer_brain.mjs", witness: "ci/witness/mbank/witness_bank.mjs", note: "planted by ci/witness/mbank" })]);
    if (r.code !== 0) throw new Error(`registry seed ${row.subject} → ${brief(r)}`);
  }
  const cap = (a, o) => node("gaffer_brain.mjs", ["capture", "voice_rep", "tokenization:a", "--axis", "a", ...ASK, ...a], o);
  const queue = () => { const t = text(at("gaffer_grade_queue.jsonl")); return t === null ? null : lines(t).filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return { torn: l }; } }).filter((r) => r.kind === "capture" || r.torn); };
  const cracks = () => { const t = text(at("cracks.jsonl")); return t === null ? null : lines(t).filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return { torn: l }; } }); };
  // the record as its owner writes it (row 1246): the shared slot AND this session's own entry in prompts_by_session
  const prompt = (txt, extra = {}) => { const rec = { text: txt, step: 3, moments: 1, reps: 0, session_id: SID, at: new Date().toISOString(), turn_id: T, ...extra };
    writeFileSync(at("teaching_audit_last.json"), JSON.stringify({ prompt: rec, prompts_by_session: { [SID]: rec }, checked_rules: [] }, null, 2) + "\n"); };
  return { dir, state, at, node, cap, queue, cracks, prompt };
}
const results = [];
const clause = async (id, fn) => {
  if (ONLY && !ONLY.includes(id)) return;
  let ok = false, why = "";
  try { const r = await fn(); ok = r === true || (r && r.ok === true); why = (r && r.why) || ""; }
  catch (e) { why = `threw: ${String((e && e.message) || e).split(/\r?\n/)[0].slice(0, 200)}`; }
  results.push({ id, ok });
  console.log(`CLAUSE ${id} ${ok ? "GREEN" : "RED"}${why ? ` · ${why}` : ""}`);
};
const imp = async (dir, f) => import(pathToFileURL(join(dir, "scripts", f)).href);
const brief = (r) => `exit ${r.code}: ${fold(r.all).slice(0, 160)}`;

console.log(`witness_bank · tree ${TREE} · plants under ${TMP}`);
const B1P = "pakka - plant  answer\n one two three", B1S = "plant answer one two three", B1SLICE = "plant  answer\n one two three";

await clause("B1", () => {
  const p = plant("b1"); p.prompt(B1P);
  const r = p.cap(["--gut", "knew", "--said", B1S, "--surface", "code"]), q = p.queue() || [];
  const row = q[0] || {};
  return { ok: r.code === 0 && q.length === 1 && row.spoken === B1SLICE && row.spoken_src === "prompt" && row.turn_id === T,
    why: `${brief(r)} · rows ${q.length} · spoken ${JSON.stringify(row.spoken)} · src ${row.spoken_src} · turn ${row.turn_id === T ? "T" : row.turn_id}` };
});
await clause("B2", () => {
  const p = plant("b2"); p.prompt(B1P);
  const r = p.cap(["--gut", "knew", "--said", "plant answer one 2 three", "--surface", "code"]);
  const good = plant("b2-control"); good.prompt(B1P);
  const g = good.cap(["--gut", "knew", "--said", "answer one two", "--surface", "code"]);
  return { ok: r.code === 1 && /--said is not inside his message/.test(r.all) && p.queue() === null && g.code === 0 && (good.queue() || [])[0]?.spoken === "answer\n one two",
    why: `drifted ${brief(r)} · queue ${p.queue() === null ? "absent" : "WRITTEN"} · inside-control exit ${g.code}` };
});
await clause("B3", () => {
  const cases = [["a", null, "absent"], ["b", { text: "   " }, "absent"], ["c", { consumed_at: new Date().toISOString() }, "consumed"], ["d", {}, "absent", "sess-other"], ["e", { turn_id: undefined }, "no-turn-id"]];
  const bad = [];
  for (const [k, extra, reason, sid] of cases) {
    const p = plant(`b3${k}`);
    if (extra) p.prompt(B1P, extra);
    const r = p.cap(["--gut", "knew", "--said", B1S, "--surface", "code"], { sid: sid || SID });
    if (!(r.code === 1 && r.all.includes(`(${reason}:`) && p.queue() === null)) bad.push(`${k} ${brief(r)}`);
  }
  const ok = plant("b3-control"); ok.prompt(B1P);
  const g = ok.cap(["--gut", "knew", "--said", B1S, "--surface", "code"]);
  return { ok: bad.length === 0 && g.code === 0, why: bad.length ? bad.join(" | ") : `five refusals named, queue absent each time · control exit ${g.code}` };
});
await clause("B4", () => {
  const p = plant("b4"); p.prompt(B1P);
  const r = p.cap(["--gut", "knew", "--surface", "code"], { input: "" }), row = (p.queue() || [])[0] || {};
  return { ok: r.code === 0 && row.spoken === B1P && row.spoken_src === "prompt", why: `${brief(r)} · spoken ${JSON.stringify(row.spoken)}` };
});
const SH = "shayad - plant answer one two three";
await clause("B5", () => {
  const a = plant("b5a"); a.prompt(SH);
  const ra = a.cap(["--surface", "code"]), row = (a.queue() || [])[0] || {};
  const b = plant("b5b"); b.prompt(SH);
  const rb = b.cap(["--gut", "knew", "--surface", "code"]);
  const c = plant("b5c"); c.prompt("plant answer one two three, no gut word");
  const rc = c.cap(["--gut", "knew", "--surface", "code"]);
  return { ok: ra.code === 0 && row.gut === "shaky" && rb.code === 1 && b.queue() === null && rc.code === 1 && c.queue() === null,
    why: `no --gut ${brief(ra)} gut ${row.gut} · --gut knew on shayad exit ${rb.code} · --gut on gutless exit ${rc.code}` };
});
await clause("B6", () => {
  const p = plant("b6"); p.prompt(SH);
  const r = p.cap(["--gut", "shaky", "--said", SH, "--surface", "code"]), row = (p.queue() || [])[0] || {};
  const h = plant("b6-control"); h.prompt("shayad - maybe plant answer one two three");
  const rh = h.cap(["--surface", "code"]), hrow = (h.queue() || [])[0] || {};
  return { ok: r.code === 0 && row.spoken === SH && row.hedges === 0 && rh.code === 0 && hrow.hedges === 1, why: `${brief(r)} · hedges ${row.hedges} · a real hedge still counts: ${hrow.hedges}` };
});
await clause("B7", () => {
  const p = plant("b7");
  for (const s of [["start", "tokenization"], ["step", "3"], ["axis", "a", "now"], ["moment", "check_q"]]) {
    const r = p.node("forge_session.mjs", s); if (r.code !== 0) return { ok: false, why: `${s.join(" ")} → ${brief(r)}` };
  }
  p.prompt("pakka - plant answer for the crack turn");
  const rc = p.cap(["--surface", "code"]), k = p.node("forge_session.mjs", ["crack"]);
  const row = (p.queue() || [])[0] || {}, ck = (p.cracks() || [])[0] || {};
  return { ok: rc.code === 0 && k.code === 0 && row.turn_id === T && ck.turn_id === T, why: `capture ${brief(rc)} turn ${row.turn_id === T ? "T" : row.turn_id} · crack exit ${k.code} turn ${ck.turn_id === T ? "T" : ck.turn_id}` };
});
await clause("B8", () => {
  const p = plant("b8");
  const r = p.node("gaffer_brain.mjs", ["capture", "voice_rep", "tokenization", "--gut", "knew", ...ASK, "--note", "dugout-voice think:1ms"], { input: "voice plant words here" });
  const row = (p.queue() || [])[0] || {};
  const s = plant("b8-sitting");
  const rs = s.node("gaffer_brain.mjs", ["capture", "voice_rep", "tokenization", "--gut", "knew", ...ASK, "--note", "sitting sx · typed", "--json"], { input: "sitting plant words here" });
  const srow = (s.queue() || [])[0] || {};
  return { ok: r.code === 0 && row.spoken === "voice plant words here" && row.spoken_src === "voice" && rs.code === 0 && srow.spoken === "sitting plant words here" && srow.spoken_src === "sitting",
    why: `voice ${brief(r)} src ${row.spoken_src} · sitting exit ${rs.code} src ${srow.spoken_src}` };
});
await clause("B9", async () => {
  const fs = text(join(TREE, "scripts", "forge_session.mjs")) || "", gb = text(join(TREE, "scripts", "gaffer_brain.mjs")) || "";
  const m = await imp(plant("b9").dir, "forge_session.mjs");
  const crackSrc = String(m.crackRow || "");
  const ok = typeof m.hisPrompt === "function" && typeof m.readHisPrompt === "function" && /\breadHisPrompt\b/.test(gb)
    && !/teaching_audit_last/.test(gb) && /hisPrompt\(/.test(crackSrc) && /export function hisPrompt\b/.test(fs);
  return { ok, why: `hisPrompt ${typeof m.hisPrompt} · readHisPrompt ${typeof m.readHisPrompt} · gaffer_brain names the record path: ${/teaching_audit_last/.test(gb)} · crackRow through the door: ${/hisPrompt\(/.test(crackSrc)}` };
});
await clause("B10", () => {
  const p = plant("b10"); p.prompt(B1P);
  const a = p.cap(["--gut", "knew", "--said", B1S, "--surface", "code"]), b = p.cap(["--gut", "knew", "--said", B1S, "--surface", "code"]);
  const q = p.queue() || [];
  return { ok: a.code === 0 && b.code === 0 && /already banked/.test(b.all) && q.length === 1, why: `second ${brief(b)} · rows ${q.length}` };
});
await clause("B11", async () => {
  const p = plant("b11"); p.prompt(B1P);
  const r = p.cap(["--gut", "knew", "--said", B1S, "--surface", "code"]), row = (p.queue() || [])[0];
  if (!row) return { ok: false, why: `no row (${brief(r)})` };
  const gb = await imp(p.dir, "gaffer_brain.mjs"), rg = await imp(p.dir, "register.mjs"), nc = await imp(p.dir, "notes_compiler.mjs");
  const jp = String(gb.buildJudgePrompt([row], {}) || "");
  const vr = rg.validateRegister({ used: [], expected: [] }, { spoken: row.spoken, corpus: "" });
  const note = nc.buildNote({ concept: "tokenization", axis: "a", bank: [{ at: row.ts, rid: "r1", type: row.type, gut: row.gut, asked: row.asked, said: row.spoken }] });
  const ok = typeof row.spoken === "string" && jp.includes(row.spoken) && vr && typeof vr === "object" && note.bank[0].said === row.spoken && row.spoken_src === "prompt";
  return { ok, why: `judge prompt holds it ${jp.includes(row.spoken)} · register ${typeof vr} · note said ${note.bank[0].said === row.spoken} · src ${row.spoken_src}` };
});
await clause("B12", async () => {
  const m = await imp(plant("b12").dir, "forge_session.mjs");
  const t0 = Date.now(), iso = (min) => new Date(t0 + min * 60000).toISOString();
  const sess = { concept: "tokenization", step: 3, current_axis: "c", started_at: iso(0), updated_at: iso(5), steps_done: [0, 1, 2, 3], axes_done: [], axes_deferred: [],
    moments_log: [{ kind: "check_q", axis: "c", at: iso(1) }] };
  const words = "shaky — ek word ek token hota hai\n  (dekho)";
  const NOT = "his words are not on disk (the UserPromptSubmit record is absent) — no crack row is written from memory";
  const w = (al) => { const r = m.crackRow({ session: sess, auditLast: al, now: new Date(iso(3)) }); return r.ok ? r : r.why; };
  const good = w({ prompt: { text: words, at: iso(2), session_id: "s", turn_id: T } });
  const ok = w({}) === NOT && w({ prompt: { text: words, at: iso(-1) } }) === NOT && w({ prompt: { text: " ", at: iso(2) } }) === NOT
    && good && good.ok && good.row.words === words && good.row.words_src === "teaching_audit_last.prompt" && good.row.turn_id === T;
  return { ok, why: `refusals ${[w({}), w({ prompt: { text: words, at: iso(-1) } })].every((x) => x === NOT) ? "mcrk's line" : "CHANGED"} · words ${good && good.ok && good.row.words === words} · turn ${good && good.ok ? good.row.turn_id : "-"}` };
});
await clause("B13", async () => {
  const nc = await imp(plant("b13").dir, "notes_compiler.mjs");
  const at = (m) => new Date(Date.UTC(2026, 10, 21, 4, 0, 0) + m * 60000).toISOString();   // fractions kept
  const ex = [{ role: "teacher", at: at(1), rid: "k1", text: "Ek word kitne tokens?" }, { role: "him", at: at(2), rid: "k2", text: "shaky — ek word ek token" },
    { role: "teacher", at: at(3), rid: "k3", text: "```diff\n- ek word = ek token\n+ ek word = ek ya zyada tokens\n```\nKahan atke?" }];
  const row = { v: 1, kind: "crack", id: "ck-mbank-0001", at: at(2.5), concept: "x", axis: "a", moment: "check_q", words: "shaky — ek word ek token", prompt_at: at(2), turn_id: T };
  const it = nc.buildNote({ concept: "x", axis: "a", ex, cracks: [row] }).items.find((i) => i.kind === "crack") || {};
  return { ok: it.crack_id === row.id && it.turn_id === T, why: `crack item crack_id ${it.crack_id} · turn_id ${it.turn_id === T ? "T" : it.turn_id}` };
});

await clause("B14", () => {
  const p = plant("b14");
  const h = p.node("teaching_audit.mjs", ["hook"], { input: JSON.stringify({ hook_event_name: "UserPromptSubmit", session_id: SID, prompt: "pakka - plant answer typed into the hook" }) });
  let rec = null; try { rec = JSON.parse(text(p.at("teaching_audit_last.json"))); } catch { rec = null; }
  const minted = rec && rec.prompt ? rec.prompt.turn_id : undefined;
  const r = p.cap(["--surface", "code"]), row = (p.queue() || [])[0] || {};
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(String(minted || ""));
  return { ok: h.code === 0 && uuid && r.code === 0 && row.turn_id === minted && row.spoken === "pakka - plant answer typed into the hook",
    why: `hook exit ${h.code} · minted ${uuid ? "a UUID" : JSON.stringify(minted)} · capture ${brief(r)} · same turn ${row.turn_id === minted}` };
});

await clause("B15", () => {
  const p = plant("b15");
  const hook = (sid, prompt) => p.node("teaching_audit.mjs", ["hook"], { input: JSON.stringify({ hook_event_name: "UserPromptSubmit", session_id: sid, prompt }), sid });
  const his = "pakka - his own answer in his own session", other = "runner: please read the ledger of the other unit";
  const h1 = hook(SID, his);
  let mine = null; try { mine = JSON.parse(text(p.at("teaching_audit_last.json"))).prompt.turn_id; } catch { mine = null; }
  const h2 = hook("sess-parallel-architect", other);
  let slot = null; try { slot = JSON.parse(text(p.at("teaching_audit_last.json"))).prompt.text; } catch { slot = null; }
  const r = p.cap(["--surface", "code"]), row = (p.queue() || [])[0] || {};
  return { ok: h1.code === 0 && h2.code === 0 && slot === other && r.code === 0 && row.spoken === his && !!mine && row.turn_id === mine,
    why: `shared slot now the other session's: ${slot === other} · capture ${brief(r)} · his bytes ${row.spoken === his} · his turn ${!!mine && row.turn_id === mine}` };
});

await clause("B16", () => {
  const p = plant("b16");
  for (const s of [["start", "tokenization"], ["step", "3"]]) { const r = p.node("forge_session.mjs", s); if (r.code !== 0) return { ok: false, why: `${s.join(" ")} → ${brief(r)}` }; }
  const ev = (o, sid) => p.node("teaching_audit.mjs", ["hook"], { input: JSON.stringify({ session_id: sid, ...o }), sid });
  const OTHER = "sess-parallel-runner";
  const codes = [];
  for (const [k, his] of [["1", "pakka - his first answer of the day"], ["2", "shayad - his second answer of the day"]]) {
    codes.push(ev({ hook_event_name: "UserPromptSubmit", prompt: his }, SID).code);
    codes.push(ev({ hook_event_name: "UserPromptSubmit", prompt: `runner turn ${k} in a parallel session` }, OTHER).code);
    codes.push(ev({ hook_event_name: "Stop", last_assistant_message: "Theek. Ab agla sawaal — tumhare hisaab se kya hoga?" }, SID).code);
  }
  const t = text(p.at("teaching_audit.jsonl"));
  const rows = t === null ? [] : lines(t).filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return {}; } }).filter((r) => r.session_id === SID);
  const mism = rows.filter((r) => /session-mismatch/.test(String(r.user_text_source || ""))).length;
  return { ok: codes.every((c) => c === 0) && rows.length === 2 && mism === 0 && rows.every((r) => r.user_text_source === "fresh" && typeof r.turn_id === "string"),
    why: `hook exits ${codes.join(",")} · his Stop rows ${rows.length} · session-mismatch ${mism} · sources ${rows.map((r) => String(r.user_text_source).split(" ")[0]).join(",")}` };
});

if (OWN_TMP) { try { rmSync(TMP, { recursive: true, force: true }); } catch { /* the caller's LAST names a survivor */ } }
const k = results.filter((r) => r.ok).length, n = results.length;
console.log(`PLANTS mbank · ${k} of ${n} plant(s) as expected`);
process.exit(n > 0 && k === n ? 0 : 1);
