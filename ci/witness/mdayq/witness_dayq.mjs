#!/usr/bin/env node
// ============================================================================
// ci/witness/mdayq/witness_dayq.mjs — UNIT mdayq · TWO COLD QUESTIONS AT HIS DAY END, BANKED, THEN THE CLOSE, BY PLANTS
//   (spec ci/mdayq/MDAYQ_SPEC.md on claude/mdayq-spec @ d9ee129 §7 / ROW 1246; ruling forks row 1257 — where they differ
//    the ruling wins, and ci/mdayq/PROOF.md names each difference)
// ----------------------------------------------------------------------------
// USAGE
//   node ci/witness/mdayq/witness_dayq.mjs plants [--tree <dir>] [--only <id,…>] [--tmp <dir>]
//   --tree   the tree under test (default: this file's repository).
//   --tmp    an existing dir to plant under (the unit witness ci/mdayq/witness_mdayq.mjs hands its own, for LAST).
// CONTRACT
//   · Every plant is a COPY under os.tmpdir(). A LITE plant copies <tree>/scripts + package.json; a FULL plant (W8-W10, the
//     day's end run end to end, mday's own temp-org shape) copies the whole tree but .git, node_modules and
//     dressing-room/state. node_modules rides as a link. Each plant's dressing-room/state is written by THIS file's node
//     code (writeFileSync) or by the organs it runs as children on the copy — the repository's own state dir is never
//     opened, and nothing of his is copied or printed.
//   · No ARSENAL_* variable reaches a child but ARSENAL_AUDIT_NO_SPAWN=1 (teaching_audit's own seam) and, on a FULL plant,
//     ARSENAL_ARCHIVE and ARSENAL_SITTING_PORT, both pointing under the plant (mday's env door). ANTHROPIC_API_KEY never
//     reaches a child. CLAUDE_CODE_SESSION_ID is PLANTED (the plant's own id), or deleted for W14.
//   · NO LIVE MODEL CALL: a shim for `claude` and `gemini` sits FIRST on PATH; it appends one line to a log under the temp
//     dir and refuses (exit 1). The seat clause W11 reads that log: every spawn a plant drew is the shim's, counted, named.
//   · THE PORT CLASS (row 1053): no fixed port is bound. A FULL plant takes an ephemeral free port (bound to 127.0.0.1:0 and
//     released at once) and hands it to the sitting through its env door ARSENAL_SITTING_PORT: nothing ever listens on it,
//     so the sitting's daemon is DOWN and its local door runs (mday F10). No service is named, nothing is POSTed, nothing
//     restarts. Every wait is a spawnSync that ends with its child; the outer bound is the caller's. No timeout, budget or
//     size is typed here.
//   · CRLF-proof: every read splits on \r?\n and strips a BOM; no POSIX-only shell (the shim has a .cmd twin); no git repo is
//     planted.
// THE CLAUSES (each RED on base f635d68, GREEN on the build; planted both ways on the tree it judges)
//   W1  KIND     an open forge session, axis c ON: `moment day_close` → exit 0, counted in question_moments, in
//                moments_by_axis.c, and logged in moments_log with axis c
//   W2  FENCE    the pacer's MOMENTS = the gate's MOMENT_KINDS, both holding day_close; the kinds the teaching skeleton's
//                [EK CHECK] line prints = those minus day_close, exactly (FORK mdayq-1)
//   W3  DUE      a reply to `moment day_close` is his answer with no gut-word lead and his gut word is read off a lead;
//                bankDueAt says due; BANKED_MOMENTS and GUT_BEARING_MOMENTS hold day_close — and (spec W6, a guard that is
//                green at base on its own, carried here) check_q / pehle_guess / widget_gate stay out of the bank
//   W4  ROW      the code door with `--moment day_close` → ONE row, moment "day_close"; `--moment pop` → refused bad-moment,
//                nothing banked; no --moment → the row's moment is null (present, never guessed)
//   W5  AXIS     axis c ON, ONE day-close answer banked on it through the code door: `axis c done` refuses NAMING "no banked
//                answer for axis c" — the day-close row pays nothing of the axis-done gate (F3 B)
//   W5L LOCK     lockGate over a `--probe negative_space` row with moment day_close → the LOCK still wants its own
//                concept-level negative-space probe (F3 B)
//   W7  SKIP     dayCloseDue: axis b done on D → not due · deferred on D → due · nothing on D → not due, taught false ·
//                declared on D → due with the last axis and the material by name · two day-close rows → not due, done
//   W8  ORDER    a FULL plant: his sitting open (/learn through the hook), axis c taught today; `day.mjs end` → prints
//                `DAYQ · ask first`, exit 0, and EVERY state byte is identical (no sitting close, no post_match record, no
//                night row, no card dealt)
//   W9  ANSWERED the same day, the two day-close answers banked through the code door (recall, negative_space), then
//                `day.mjs end` → CLOSED, its line says the pair is banked, the sitting closed with the judge fired by its
//                close (judge ran|FAILED on the line — the round reached the planted shim at most), the queue holds both rows
//   W10 LEFT     the same day, nothing banked, `day.mjs end --dayq left` → CLOSED, its line says `unanswered (he left) · day
//                taught · nothing banked`, no card names the day-close, nothing on the line is RED
//   W14 NOSESS   the code door with `--moment day_close` and NO CLAUDE_CODE_SESSION_ID → refused no-session, nothing banked
//   W15 CONT     (row 1280 (2), mdayq-3 b) dayCloseDue: axis c declared on D-1 and worked on D (a moments_log entry on D carrying
//                axis c) → due on axis c; the same day with that entry's axis null → not due (a null axis counts for nothing)
//   W16 CLOSED   (row 1280 (3), mdayq-4 b) a lite plant whose forge session is CLOSED: `forge_session.mjs moment day_close` →
//                exit 0, its log entry names the IST day it closes (and the line says so), the last touch unmoved; `moment
//                check_q` on the same session → still refused
//   W17 READFAIL (row 1280 (5), mdayq-6 a) a FULL plant taught today whose step-0 read throws (the plant's own copy of the
//                pacer's dayCloseDue is made to throw, AFTER the day was taught): `day.mjs end` → CLOSED, exit 0, its line reads
//                `day-close: READ FAILED (<reason>)` and never `not due`
//   (W13 PARALLEL is UNREACHABLE by plant at this base — the per-session record holds; row 1257's BRANCH, PROOF §F10)
//   SEAT W11     every model spawn of every plant above was the refusing shim's (counted), and no plant carried an API key
// OUTPUT: one `CLAUSE <id> GREEN|RED · <why>` line per clause, `SEAT W11 GREEN|RED · <why>`, then
//   `PLANTS mdayq · k of n plant(s) as expected` (exit 0 iff k === n and n > 0).
// ============================================================================
import { mkdtempSync, mkdirSync, cpSync, symlinkSync, existsSync, readFileSync, writeFileSync, readdirSync, chmodSync, rmSync } from "node:fs";
import { join, resolve, dirname, delimiter, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath, pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
if (argv[0] !== "plants") { console.log("witness_dayq: usage — plants [--tree <dir>] [--only <id,…>] [--tmp <dir>]"); process.exit(1); }
const TREE = resolve(arg("--tree") || join(HERE, "..", "..", ".."));
const ONLY = arg("--only") ? arg("--only").split(",").map((s) => s.trim()).filter(Boolean) : null;
const OWN_TMP = !arg("--tmp");
const TMP = arg("--tmp") ? mkdtempSync(join(resolve(arg("--tmp")), "dayq-")) : mkdtempSync(join(tmpdir(), "mdayq-dayq-"));
for (const k of Object.keys(process.env)) if (/^ARSENAL_/i.test(k) || k === "ANTHROPIC_API_KEY" || k === "CLAUDE_CODE_SESSION_ID" || k === "CLAUDE_CODE_ENTRYPOINT") delete process.env[k];

const SHIM = join(TMP, "shim"), SPAWNS = join(TMP, "model_spawns.log"); mkdirSync(SHIM);
for (const tool of ["claude", "gemini"]) {
  writeFileSync(join(SHIM, tool), `#!/bin/sh\necho "spawn ${tool}" >> "$MDAYQ_SPAWN_LOG"\necho "REFUSED — no live model call in a witness (unit mdayq)" >&2\nexit 1\n`);
  chmodSync(join(SHIM, tool), 0o755);
  writeFileSync(join(SHIM, `${tool}.cmd`), `@echo spawn ${tool} >> "%MDAYQ_SPAWN_LOG%"\r\n@echo REFUSED — no live model call in a witness (unit mdayq) 1>&2\r\n@exit /b 1\r\n`);
}
const SID = "a0d1c105-0000-4000-8000-00000000da11";   // the plant's own session id (UUID-shaped: day.mjs start wants one)
const NM = [TREE, join(HERE, "..", "..", "..")].map((t) => join(t, "node_modules")).find((p) => existsSync(p)) || null;
const text = (p) => { try { return readFileSync(p, "utf8").replace(/^﻿/, ""); } catch { return null; } };
const lines = (s) => String(s || "").split(/\r?\n/);
const fold = (s) => String(s || "").replace(/\s+/g, " ").trim();
const slash = (p) => p.split(sep).join("/");
const istDay = (d = new Date()) => new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 10);
const freePort = () => new Promise((res) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });
const ASKED = "Aaj ka ek idea apne shabdon mein — merge kya karta hai?";

let seq = 0;
async function plant(name, { full = false } = {}) {
  const dir = join(TMP, `${++seq}-${name}`);
  if (full) {
    cpSync(TREE, dir, { recursive: true, filter: (p) => {
      const rel = slash(relative(TREE, p));
      if (!rel) return true;
      const top = rel.split("/")[0];
      if (top === ".git" || top === "node_modules") return false;
      return !(rel === "dressing-room/state" || rel.startsWith("dressing-room/state/")) && !/\.log$/.test(rel);
    } });
  } else {
    cpSync(join(TREE, "scripts"), join(dir, "scripts"), { recursive: true });
    if (existsSync(join(TREE, "package.json"))) cpSync(join(TREE, "package.json"), join(dir, "package.json"));
  }
  if (NM) symlinkSync(NM, join(dir, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  const state = join(dir, "dressing-room", "state");
  mkdirSync(state, { recursive: true });
  writeFileSync(join(state, "concepts.json"), JSON.stringify({ concepts: { tokenization: { core_axes: ["d"] } }, axes: { b: "planted-b", c: "planted-c" } }) + "\n");
  const home = join(TMP, `home-${seq}`); mkdirSync(home, { recursive: true });
  const port = full ? await freePort() : 0;
  const envOf = (sid = SID) => {
    const e = { ...process.env }; const pk = Object.keys(e).find((k) => k.toUpperCase() === "PATH") || "PATH";
    e[pk] = `${SHIM}${delimiter}${e[pk] || ""}`;
    if (sid) e.CLAUDE_CODE_SESSION_ID = sid; else delete e.CLAUDE_CODE_SESSION_ID;
    e.ARSENAL_AUDIT_NO_SPAWN = "1"; e.MDAYQ_SPAWN_LOG = SPAWNS;
    if (full) Object.assign(e, { TZ: "Asia/Kolkata", HOME: home, USERPROFILE: home, ARSENAL_ARCHIVE: join(TMP, `archive-${seq}`), ARSENAL_SITTING_PORT: String(port) });
    return e;
  };
  const node = (file, a, { input = "", sid = SID } = {}) => {
    const r = spawnSync(process.execPath, [join(dir, "scripts", file), ...a], { cwd: dir, env: envOf(sid), input, encoding: "utf8", windowsHide: true });
    return { code: r.status, out: String(r.stdout || ""), err: String(r.stderr || ""), all: `${r.stdout || ""}${r.stderr || ""}` };
  };
  // the two registry rows the bank door reads (probe kinds, registers), seeded through the registry's OWN `set` verb
  for (const row of [{ subject: "probe_kinds", subjects: ["recall", "reconstruct", "defend", "novel", "negative_space", "jirah", "cross_axis"] },
    { subject: "registers", subjects: ["hinglish", "interview"] }]) {
    const r = node("registry.mjs", ["set", "--table", "mechanisms", "--json", JSON.stringify({ ...row, schema_owner: "gaffer_brain.mjs", witness: "ci/witness/mdayq/witness_dayq.mjs", note: "planted by ci/witness/mdayq" })]);
    if (r.code !== 0) throw new Error(`registry seed ${row.subject} → exit ${r.code}: ${fold(r.all).slice(0, 160)}`);
  }
  const at = (f) => join(state, f);
  // the prompt record as its owner writes it (mbank row 1246): the shared slot AND this session's own entry
  const prompt = (txt) => { const rec = { text: txt, step: 3, moments: 1, reps: 0, session_id: SID, at: new Date().toISOString(), turn_id: randomUUID() };
    writeFileSync(at("teaching_audit_last.json"), JSON.stringify({ prompt: rec, prompts_by_session: { [SID]: rec }, checked_rules: [] }, null, 2) + "\n"); };
  const queue = () => { const t = text(at("gaffer_grade_queue.jsonl")); return t === null ? null : lines(t).filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return { torn: l }; } }).filter((r) => r.kind === "capture" || r.torn); };
  const cap = (extra, o) => node("gaffer_brain.mjs", ["capture", "voice_rep", "tokenization:c", "--axis", "c", "--surface", "code", "--asked", ASKED, "--json", ...extra], o);
  const forge = (...steps) => { for (const s of steps) { const r = node("forge_session.mjs", s); if (r.code !== 0) throw new Error(`forge_session ${s.join(" ")} → exit ${r.code}: ${fold(r.all).slice(0, 160)}`); } };
  // every file under the plant's state, by content (W8's byte-identity), CRLF untouched (the same bytes either way)
  const snap = () => { const o = new Map(); const walk = (d) => { let es = []; try { es = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) { const p = join(d, e.name); if (e.isDirectory()) walk(p); else if (e.isFile()) o.set(slash(relative(state, p)), readFileSync(p).toString("base64")); } }; walk(state); return o; };
  return { dir, state, at, node, prompt, queue, cap, forge, snap };
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
const imp = async (f) => import(pathToFileURL(join(TREE, "scripts", f)).href);
const brief = (r) => `exit ${r.code}: ${fold(r.all).slice(0, 160)}`;
const verdict = (r) => { const l = lines(r.out).filter((x) => x.trim().startsWith("{")).pop(); try { return JSON.parse(l); } catch { return null; } };

console.log(`witness_dayq · tree ${TREE} · plants under ${TMP}`);

await clause("W1", async () => {
  const p = await plant("w1"); p.forge(["start", "tokenization"], ["step", "3"], ["axis", "c", "now"]);
  const r = p.node("forge_session.mjs", ["moment", "day_close"]);
  const s = JSON.parse(text(p.at("forge_session.json")) || "{}"), last = (s.moments_log || []).at(-1) || {};
  return { ok: r.code === 0 && (s.question_moments || {}).day_close === 1 && ((s.moments_by_axis || {}).c || {}).day_close === 1 && last.kind === "day_close" && last.axis === "c",
    why: `${brief(r)} · question_moments.day_close ${(s.question_moments || {}).day_close} · on axis c ${((s.moments_by_axis || {}).c || {}).day_close} · log ${last.kind}/${last.axis}` };
});
await clause("W2", async () => {
  const pacer = await imp("forge_session.mjs"), gate = await imp("teaching_gate.mjs");
  const bar = text(join(TREE, "scripts", "teaching_bar.mjs")) || "";
  const ek = lines(bar).find((l) => /\[EK CHECK\]/.test(l) && /moment [a-z_|]+/.test(l)) || "";
  const sk = ((/moment ((?:[a-z_]+\|)+[a-z_]+)/.exec(ek) || [])[1] || "").split("|").filter(Boolean);
  const P = [...(pacer.MOMENTS || [])], G = [...(gate.MOMENT_KINDS || [])];
  const same = (a, b) => a.length === b.length && a.every((k) => b.includes(k));
  const minus = G.filter((k) => k !== "day_close");
  return { ok: same(P, G) && P.includes("day_close") && same(sk, minus) && minus.length === G.length - 1,
    why: `pacer ${P.join("|")} · gate ${G.join("|")} · skeleton ${sk.join("|")}` };
});
await clause("W3", async () => {
  const ss = await imp("study_scope.mjs");
  const bare = ss.classifyPrompt("wo do padosi pieces ko jod deta hai, split nahi karta", { prevMoments: ["day_close"] });
  const lead = ss.classifyPrompt("shayad - wo do padosi pieces ko jod deta hai", { prevMoments: ["day_close"] });
  const due = ss.bankDueAt({ cls: bare, prevMoments: ["day_close"] });
  const perIdea = ["check_q", "pehle_guess", "widget_gate"].map((k) => ss.bankDueAt({ cls: { answer: true, gut: "pakka" }, prevMoments: [k] }));
  const banked = [...(ss.BANKED_MOMENTS || [])], gut = [...(ss.GUT_BEARING_MOMENTS || [])];
  return { ok: bare.answer === true && lead.gut === "shayad" && typeof due === "string" && /day-close/.test(due) && banked.includes("day_close") && gut.includes("day_close")
      && perIdea.every((x) => x === null) && !["check_q", "pehle_guess", "widget_gate"].some((k) => banked.includes(k)),
    why: `bare answer ${bare.answer} · lead gut ${lead.gut} · due ${JSON.stringify(due)} · BANKED ${banked.join("|")} · per-idea due ${perIdea.map((x) => x === null ? "null" : "DUE").join("/")}` };
});
await clause("W4", async () => {
  const p = await plant("w4"); p.prompt("shayad - wo do padosi pieces ko jod deta hai");
  const r = p.cap(["--moment", "day_close", "--probe", "recall"]), row = (p.queue() || [])[0] || {};
  const b = await plant("w4-pop"); b.prompt("shayad - wo do padosi pieces ko jod deta hai");
  const rb = b.cap(["--moment", "pop"]), vb = verdict(rb) || {};
  const n = await plant("w4-none"); n.prompt("shayad - wo do padosi pieces ko jod deta hai");
  const rn = n.cap([]), nrow = (n.queue() || [])[0] || {};
  return { ok: r.code === 0 && (p.queue() || []).length === 1 && row.moment === "day_close" && rb.code === 1 && vb.reason === "bad-moment" && b.queue() === null
      && rn.code === 0 && Object.prototype.hasOwnProperty.call(nrow, "moment") && nrow.moment === null,
    why: `day_close ${brief(r)} moment ${JSON.stringify(row.moment)} · pop exit ${rb.code} reason ${vb.reason} queue ${b.queue() === null ? "absent" : "WRITTEN"} · none moment ${JSON.stringify(nrow.moment)}` };
});
await clause("W5", async () => {
  const p = await plant("w5"); p.forge(["start", "tokenization"], ["step", "3"], ["axis", "c", "now"], ["moment", "day_close"]);
  p.prompt("pakka - wo do padosi pieces ko jod deta hai, split nahi");
  const c = p.cap(["--moment", "day_close", "--probe", "recall"]);
  const g = p.node("forge_session.mjs", ["axis", "c", "done"]);
  return { ok: c.code === 0 && (p.queue() || []).length === 1 && g.code !== 0 && /no banked answer for axis c/.test(g.all),
    why: `bank ${brief(c)} · axis c done exit ${g.code} · ${/no banked answer for axis c/.test(g.all) ? "names no banked answer for axis c" : `does NOT name it: ${fold(g.all).slice(0, 140)}`}` };
});
await clause("W5L", async () => {
  const f = await imp("forge_session.mjs");
  const s = { concept: "tokenization", started_at: "2026-11-20T00:00:00.000Z", axes_done: [] };
  const row = { id: "x:dc", axis: "c", ts: "2026-11-20T05:00:00.000Z", probe: "negative_space", moment: "day_close" };
  const l = f.lockGate(s, [row], []), ctl = f.lockGate(s, [{ ...row, moment: null }], []);
  const wants = (g) => (g.missing || []).some((m) => /does NOT do/.test(m));
  return { ok: wants(l) && !wants(ctl), why: `day-close negative_space → LOCK ${wants(l) ? "still asks its own" : "COUNTS it"} · control ${wants(ctl) ? "asks (?)" : "counts"}` };
});
await clause("W7", async () => {
  const f = await imp("forge_session.mjs");
  if (typeof f.dayCloseDue !== "function") return { ok: false, why: "forge_session.mjs exports no dayCloseDue" };
  const D = "2026-11-20", at = (h) => `2026-11-20T0${h}:00:00.000Z`;
  const day = (x = {}) => ({ concept: "tokenization", axes_done: [], axes_deferred: [], axes_now_history: [{ axis: "b", at: at(3) }, { axis: "c", at: at(4) }], moments_log: [{ kind: "check_q", axis: "c", at: at(5) }], ...x });
  const mark = { b: { at: at(4), step: 3, jirah_before: 0 } };
  const rows = (n) => Array.from({ length: n }, (_, i) => ({ id: `dc${i}`, kind: "capture", moment: "day_close", ts: at(6), probe: i ? "negative_space" : "recall" }));
  const i = f.dayCloseDue({ session: day({ axes_done: ["b"], axes_marked_at: mark }), D });
  const ii = f.dayCloseDue({ session: day({ axes_deferred: ["b"], axes_marked_at: mark }), D });
  const iii = f.dayCloseDue({ session: { concept: "tokenization", axes_now_history: [{ axis: "c", at: "2026-11-19T04:00:00.000Z" }], moments_log: [] }, D });
  const iv = f.dayCloseDue({ session: day(), D, axisNames: { b: "planted-b", c: "planted-c" } });
  const v = f.dayCloseDue({ session: null, history: [day()], D, bank: rows(2) });
  return { ok: !i.due && ii.due && !iii.due && iii.taught === false && iv.due && iv.axis === "c" && iv.concept === "tokenization"
      && (iv.material || {}).axes.join("|") === "b (planted-b)|c (planted-c)" && !v.due && v.done === true,
    why: `(i) ${i.due ? "DUE" : "not due"} · (ii) ${ii.due ? "due" : "NOT due"} · (iii) ${iii.due ? "DUE" : `not due, taught ${iii.taught}`} · (iv) axis ${iv.axis} material ${JSON.stringify((iv.material || {}).axes)} · (v) ${v.due ? "DUE" : `done ${v.done}`}` };
});
// ── W8-W10 · THE DAY'S END, END TO END (FULL plants, the daemon DOWN) ────────────────────────────────────────────────────
async function taughtDay(name) {
  const p = await plant(name, { full: true });
  const o = p.node("turn_hook.mjs", ["prompt"], { input: JSON.stringify({ hook_event_name: "UserPromptSubmit", session_id: SID, transcript_path: join(TMP, `${SID}.jsonl`), cwd: p.dir, prompt: "/learn" }) });
  const s = JSON.parse(text(p.at("sitting.json")) || "{}");
  if (!(s.id && !s.closed_at)) throw new Error(`the sitting did not open through the /learn hook (${brief(o)})`);
  p.forge(["start", "tokenization"], ["step", "3"], ["axis", "c", "now"], ["moment", "check_q"]);
  return p;
}
const D = istDay();
await clause("W8", async () => {
  const p = await taughtDay("w8");
  const before = p.snap();
  const r = p.node("day.mjs", ["end"]);
  const after = p.snap();
  const changed = [...new Set([...before.keys(), ...after.keys()])].filter((k) => before.get(k) !== after.get(k));
  const s = JSON.parse(text(p.at("sitting.json")) || "{}");
  return { ok: r.code === 0 && /^DAYQ · ask first/m.test(r.out) && changed.length === 0 && !s.closed_at && !existsSync(p.at(join("post_match", `${D}.md`))),
    why: `${brief(r)} · state files changed ${changed.length}${changed.length ? ` (${changed.slice(0, 6).join(", ")})` : ""} · sitting ${s.closed_at ? "CLOSED" : "open"}` };
});
await clause("W9", async () => {
  const p = await taughtDay("w9");
  const asked = [];
  for (const [probe, said] of [["recall", "pakka - wo do padosi pieces ko ek naya piece bana deta hai"], ["negative_space", "shayad - wo meaning nahi samajhta, sirf ginta hai"]]) {
    p.node("forge_session.mjs", ["moment", "day_close"]); p.prompt(said);
    const c = p.cap(["--moment", "day_close", "--probe", probe]); asked.push(`${probe} exit ${c.code}`);
  }
  const r = p.node("day.mjs", ["end"]);
  const close = lines(r.out).find((l) => l.startsWith("day: CLOSED")) || "";
  const q = (p.queue() || []).filter((x) => x.moment === "day_close");
  const s = JSON.parse(text(p.at("sitting.json")) || "{}");
  return { ok: r.code === 0 && /day-close: pair banked \(2 row/.test(close) && /judge (ran|FAILED)/.test(close) && !!s.closed_at && q.length === 2,
    why: `banks ${asked.join(", ")} · ${brief(r)} · close line ${close ? fold(close).slice(0, 200) : "ABSENT"} · day-close rows ${q.length} · sitting ${s.closed_at ? "closed" : "OPEN"}` };
});
await clause("W10", async () => {
  const p = await taughtDay("w10");
  const r = p.node("day.mjs", ["end", "--dayq", "left"]);
  const close = lines(r.out).find((l) => l.startsWith("day: CLOSED")) || "";
  const cards = text(p.at("captains_call.json")) || "";
  const s = JSON.parse(text(p.at("sitting.json")) || "{}");
  return { ok: r.code === 0 && /day-close: unanswered \(he left\) · day taught · nothing banked/.test(close) && !/day-close|DAYQ/i.test(cards) && !/\bRED\b/.test(close) && !!s.closed_at && !p.queue(),
    why: `${brief(r)} · close line ${close ? fold(close).slice(0, 200) : "ABSENT"} · a card names the day-close ${/day-close|DAYQ/i.test(cards) ? "YES" : "no"} · sitting ${s.closed_at ? "closed" : "OPEN"}` };
});
await clause("W14", async () => {
  const p = await plant("w14"); p.prompt("pakka - wo do padosi pieces ko jod deta hai");
  const r = p.cap(["--moment", "day_close", "--probe", "recall"], { sid: null }), v = verdict(r) || {};
  const ctl = await plant("w14-ctl"); ctl.prompt("pakka - wo do padosi pieces ko jod deta hai");
  const rc = ctl.cap(["--moment", "day_close", "--probe", "recall"]);
  return { ok: r.code === 1 && v.reason === "no-session" && p.queue() === null && rc.code === 0 && (ctl.queue() || []).length === 1,
    why: `no session id ${brief(r)} reason ${v.reason} · queue ${p.queue() === null ? "absent" : "WRITTEN"} · with its id exit ${rc.code}` };
});
await clause("W15", async () => {
  const f = await imp("forge_session.mjs");
  if (typeof f.dayCloseDue !== "function") return { ok: false, why: "forge_session.mjs exports no dayCloseDue" };
  const D = "2026-11-20", old = [{ axis: "c", at: "2026-11-19T04:00:00.000Z" }];
  const cont = f.dayCloseDue({ session: { concept: "tokenization", axes_now_history: old, moments_log: [{ kind: "check_q", axis: "c", at: "2026-11-20T05:00:00.000Z" }] }, D });
  const nul = f.dayCloseDue({ session: { concept: "tokenization", axes_now_history: old, moments_log: [{ kind: "check_q", axis: null, at: "2026-11-20T05:00:00.000Z" }] }, D });
  return { ok: cont.due === true && cont.axis === "c" && nul.due === false,
    why: `old axis worked on D → ${cont.due ? `due on ${cont.axis}` : `NOT due (${cont.why})`} · null axis on D → ${nul.due ? "DUE" : "not due"}` };
});
await clause("W16", async () => {
  const p = await plant("w16"); p.forge(["start", "tokenization"], ["step", "3"], ["axis", "c", "now"]);
  const s0 = JSON.parse(text(p.at("forge_session.json")) || "{}");
  const touched = "2026-11-01T00:00:00.000Z";
  writeFileSync(p.at("forge_session.json"), JSON.stringify({ ...s0, closed_at: touched, updated_at: touched }, null, 2) + "\n");
  const r = p.node("forge_session.mjs", ["moment", "day_close"]);
  const s = JSON.parse(text(p.at("forge_session.json")) || "{}"), last = (s.moments_log || []).at(-1) || {};
  const other = p.node("forge_session.mjs", ["moment", "check_q"]);
  const today = istDay();
  return { ok: r.code === 0 && last.kind === "day_close" && last.day === today && r.out.includes(`day-close moment for ${today}`) && s.updated_at === touched && other.code !== 0,
    why: `day_close on a closed session ${brief(r)} · log ${last.kind}/day ${last.day} · last touch ${s.updated_at === touched ? "unmoved" : "MOVED"} · check_q exit ${other.code}` };
});
await clause("W17", async () => {
  const p = await taughtDay("w17");
  const fs = join(p.dir, "scripts", "forge_session.mjs"), src = text(fs) || "";
  const anchor = "export function dayCloseDue({";
  if (src.split(anchor).length === 2) writeFileSync(fs, src.replace(anchor, 'export function dayCloseDue() { throw new Error("planted read fault"); }\nfunction dayCloseDueReal({'));
  const r = p.node("day.mjs", ["end"]);
  const close = lines(r.out).find((l) => l.startsWith("day: CLOSED")) || "";
  const s = JSON.parse(text(p.at("sitting.json")) || "{}");
  return { ok: r.code === 0 && /day-close: READ FAILED \(planted read fault\)/.test(close) && !/day-close: not due/.test(close) && !!s.closed_at,
    why: `${brief(r)} · close line ${close ? fold(close).slice(0, 200) : "ABSENT"} · sitting ${s.closed_at ? "closed" : "OPEN"}` };
});
// ── SEAT W11 · NO LIVE MODEL CALL ────────────────────────────────────────────────────────────────────────────────────
{
  const spawned = lines(text(SPAWNS) || "").filter((l) => /^spawn (claude|gemini)\b/.test(l.trim()));   // one line per spawn, no argument kept
  const key = !!process.env.ANTHROPIC_API_KEY;
  console.log(`SEAT W11 ${!key ? "GREEN" : "RED"} · ${spawned.length} model spawn(s) drawn by the plants, every one the refusing shim's (planted, never live) · API key in the env ${key ? "YES" : "no"}`);
}
const k = results.filter((r) => r.ok).length;
console.log(`PLANTS mdayq · ${k} of ${results.length} plant(s) as expected`);
if (OWN_TMP) try { rmSync(TMP, { recursive: true, force: true }); } catch { /* a survivor holds a file: the unit witness's LAST names it */ }
process.exit(k === results.length && results.length > 0 ? 0 : 1);
