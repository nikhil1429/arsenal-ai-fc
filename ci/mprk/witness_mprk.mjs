#!/usr/bin/env node
// ============================================================================
// ci/mprk/witness_mprk.mjs — UNIT mprk · ONE OWNER FOR PARKED ITEMS, ONE CARD WHERE EACH RETURNS (forks rows 1173 (3) / 1190)
// ----------------------------------------------------------------------------
// USAGE: node ci/mprk/witness_mprk.mjs --org <dir> --base-org <dir> [--only <clause>[,<clause>…]]
//   --org       the tree to witness (the build reads GREEN; the base 5759cce reads RED on every clause but LAST)
//   --base-org  the BASE tree (main 5759cce) — BOUND needs it; absent, BOUND is RED
//   --only      report only these clause ids (the mutant runner's door); the planted flow runs whole whenever one of its
//               clauses is asked, because each step stands on the one before it
// CONTRACT — every plant runs on a COPY of --org under os.tmpdir() (one temp root per run, TMP below; never .git, and
//   node_modules rides as a link), with its OWN planted state dir under TMP handed to the organs through their seams
//   only (ARSENAL_PARKED_STATE_DIR · ARSENAL_CALL_STATE_DIR · ARSENAL_ACTS_LEDGER): nothing of his is read, copied or
//   printed. TMPDIR / TMP / TEMP / HOME / USERPROFILE point under TMP, TZ is UTC, a `claude` and a `gemini` that REFUSE
//   sit first on PATH (a planted model, never a live call), ANTHROPIC_API_KEY is deleted, and ARSENAL_ORGAN is unset
//   (a headless deal is silent by design). THE CLOCK is planted: every node child (the organs' own children too) runs
//   with NODE_OPTIONS=--import <a preload under TMP> that starts Date at MPRK_WIT_NOW and lets it run. PORT CLASS (row
//   1053): no port is bound, no live service is named or posted to, nothing is restarted. Every spawn is bounded by the
//   job's own timeout-minutes read at run time from <org>/.github/workflows/suite.yml, never typed. No git repo is
//   planted (nothing to clone or init: row 1036's core.autocrlf has no subject here); every line read from a process
//   is split on \r?\n, BOUND hashes text with CRLF folded to LF, and processes are listed by PowerShell on Windows.
// CLAUSES (spec ci/mprk/MPRK_SPEC.md @ 5e604bc §5 K1-K9; rulings row 1190 — where they differ, the ruling wins):
//   K1    a teacher turn ending <<ACT {"acts":[{"verb":"park",…}]}>> through acts.mjs actsFromTail (real dispatch) →
//         exactly ONE ev:"park" row in the planted parked.jsonl, text byte-equal to the planted words, concept/axis = the
//         planted FRESH forge session's
//   K2    sole writer: scripts/parked.mjs carries the spec §3 header line verbatim, and xray's own IR (`xray.mjs q`, a
//         rebuild) names parked.mjs as the ONLY writer of dressing-room/state/parked.jsonl, with no Q2 / Q5 row naming it
//   K3K4  (one clause, spec §5) the forge session FRESH → `captains_call sync` + `deal` print no card; the session given
//         closed_at → `deal` prints exactly ONE card, keyed park:<id>, its line carrying the planted words
//   K5    two parks plus one hand-filed card (forge closed), two deals on one planted day → one card line each, never two
//         in one deal, and they are different cards (rotation)
//   K6    `answer <card> haan` on park A, `answer <card> na` on park B → `parked.mjs json` closes A by haan and B by na; the
//         next planted day's deal deals neither (both cards settled)
//   K7    `answer <card> baad` → the park is still open; no deal the same planted day; it is dealt again the next one
//   K8    `acts.mjs undo <act id>` of a park act → the park closed by:"undo"
//   F3    (row 1190 F3 a) after K8 the next sync retires that park's card AT SOURCE (resolved-at-source, never answered)
//   K9    study session not disturbed: forge_session.json and resume_pointer.jsonl are byte-identical across every organ
//         run (each re-planted only by the witness itself, and checked before every re-plant), and the only files the
//         flow created or changed in the planted dir are parked.jsonl, captains_call.json and the acts ledger
//   F4    (row 1190 F4 a) the act tail is the ONE write door: `acts.mjs do park --door cli` is refused (exit 1) and writes
//         no park row, while K1's tail door parked
//   F5    (row 1190 (2)) ships (a) with (b) behind ONE switch that is OFF, read BOTH ways: <org>'s
//         LIST_SUPERSEDED_BY_CARDS is false and `parked.mjs close-list` names this session's park with its reason (a);
//         a copy with the switch planted ON prints ONE line, no list, no words (b)
//   SKILL the [PARK] skeleton line (teaching_bar.mjs) and both skill lines (forge, learn SKILL.md) name the park tail
//   COVER package.json wires `node scripts/parked.mjs selftest` into exactly one suite, and it exits 0 on the copy
//   BOUND only the named files differ from --base-org (ci/mprk/** is this unit's own output)
//   LAST  no node process naming TMP survives
// LAST LINE: GREEN MPRK <what> · <n> clause(s) (exit 0) or RED MPRK · <clauses> (exit 1)
// ============================================================================
import { cpSync, mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, statSync, lstatSync, symlinkSync } from "node:fs";
import { join, resolve, relative, delimiter } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null, BASE_ORG = arg("--base-org") ? resolve(arg("--base-org")) : null;
const ONLY = arg("--only") ? arg("--only").split(",").map((s) => s.trim()).filter(Boolean) : null;
if (!ORG || !existsSync(join(ORG, "scripts", "acts.mjs"))) { console.log("RED MPRK · USAGE (--org <dir> with scripts/acts.mjs)"); process.exit(1); }
const NAMED = ["scripts/parked.mjs", "scripts/acts.mjs", "scripts/captains_call.mjs", "scripts/teaching_bar.mjs", ".gitignore",
  "schemas/captains_call.json.schema.json", "package.json", ".claude/skills/forge/SKILL.md", ".claude/skills/learn/SKILL.md"];
const want = (id) => !ONLY || ONLY.includes(id);
const reds = [], greens = [];
const clause = (id, ok, why) => { if (!want(id)) return; (ok ? greens : reds).push(id); console.log(`  ${ok ? "GREEN" : "RED  "} ${id} · ${why}`); };
const RD = (p) => { try { return readFileSync(p, "utf8"); } catch { return null; } };
const lines = (s) => String(s || "").split(/\r?\n/).filter((l) => l.trim());
const sha = (p) => { try { return createHash("sha256").update(readFileSync(p)).digest("hex"); } catch { return null; } };
const TMP = mkdtempSync(join(tmpdir(), "mprk-wit-"));

// ── the bound: the job's own timeout-minutes, read at run time ──
const T0 = Date.now();
const jobMin = Number((/timeout-minutes:\s*(\d+)/.exec(RD(join(ORG, ".github", "workflows", "suite.yml")) || "") || [])[1]);
const left = () => Math.max(1, T0 + (jobMin > 0 ? jobMin : 0) * 60000 - Date.now());

// ── the copy, the shims, the clock, the env ──
const copyTree = (src, name) => {
  const d = join(TMP, name);
  cpSync(src, d, { recursive: true, verbatimSymlinks: true, filter: (p) => { const r = relative(src, p).split(/[\\/]/)[0]; return r !== ".git" && r !== "node_modules"; } });
  if (existsSync(join(src, "node_modules"))) symlinkSync(join(src, "node_modules"), join(d, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  return d;
};
const SHIM = join(TMP, "shim"), CT = join(TMP, "ctmp"), HOME = join(TMP, "home");
for (const d of [SHIM, CT, HOME]) mkdirSync(d, { recursive: true });
for (const n of ["claude", "gemini"]) {
  writeFileSync(join(SHIM, n), "#!/bin/sh\necho 'planted: no model call (unit mprk)' >&2\nexit 1\n", { mode: 0o755 });
  writeFileSync(join(SHIM, `${n}.cmd`), "@echo planted: no model call (unit mprk) 1>&2\r\n@exit /b 1\r\n");
}
const CLOCK = join(TMP, "clock.mjs");
writeFileSync(CLOCK, [
  "// planted by ci/mprk/witness_mprk.mjs: Date starts at MPRK_WIT_NOW and runs from there (a witness clock, nothing else)",
  "const at = Date.parse(process.env.MPRK_WIT_NOW || '');",
  "if (Number.isFinite(at)) {",
  "  const R = globalThis.Date, t0 = R.now();",
  "  class D extends R { constructor(...a) { if (a.length === 0) super(at + (R.now() - t0)); else super(...a); } static now() { return at + (R.now() - t0); } }",
  "  globalThis.Date = D;",
  "}",
  ""].join("\n"));
const TAIL = join(TMP, "drive_tail.mjs");
writeFileSync(TAIL, [
  "// planted by ci/mprk/witness_mprk.mjs: door 3 exactly as acts stop runs it — actsFromTail(<the turn's text>)",
  "const m = await import(process.env.MPRK_ACTS_URL);",
  "const rows = await m.actsFromTail(process.env.MPRK_TAIL || '', {});",
  "console.log(JSON.stringify(rows.map((r) => ({ id: r.id, verb: r.verb, ok: r.ok, receipt: r.receipt, error: r.error }))));",
  ""].join("\n"));
const baseEnv = (() => {
  const e = { ...process.env };
  const pk = Object.keys(e).find((k) => k.toUpperCase() === "PATH") || "PATH";
  e[pk] = `${SHIM}${delimiter}${e[pk] || ""}`;
  for (const k of ["TMPDIR", "TMP", "TEMP"]) e[k] = CT;
  e.HOME = HOME; e.USERPROFILE = HOME; e.TZ = "UTC";
  for (const k of ["ANTHROPIC_API_KEY", "ARSENAL_ORGAN", "ORGANISM_TEST_PROFILE", "ARSENAL_AUDIT_COLLAR", "NODE_OPTIONS"]) delete e[k];
  return e;
})();
/** run a node child on tree <t> at planted instant <now> with planted state dir <S> */
const node = (t, S, now, argv, { input = null, extra = {} } = {}) => {
  const env = { ...baseEnv, ...extra, NODE_OPTIONS: `--import=${pathToFileURL(CLOCK).href}`, MPRK_WIT_NOW: now };
  if (S) Object.assign(env, { ARSENAL_PARKED_STATE_DIR: S, ARSENAL_CALL_STATE_DIR: S, ARSENAL_ACTS_LEDGER: join(S, "acts.jsonl") });
  const r = spawnSync(process.execPath, argv, { cwd: t, env, encoding: "utf8", input: input == null ? undefined : input, timeout: left(), maxBuffer: 1 << 28, windowsHide: true });
  return { code: r.status, out: String(r.stdout || ""), err: String(r.stderr || "") + (r.error ? ` (${r.error.message})` : "") };
};
const sc = (t, f) => join(t, "scripts", f);

// ── THE PLANTED FLOW (K1–K9, F3, F4) ──
const FLOW = ["K1", "K3K4", "K5", "K6", "K7", "K8", "F3", "K9", "F4"];
if (FLOW.some(want)) {
  const T = copyTree(ORG, "org");
  const S = join(TMP, "state"); mkdirSync(S, { recursive: true });
  const FORGE = join(S, "forge_session.json"), PTR = join(S, "resume_pointer.jsonl");
  const study = { [FORGE]: null, [PTR]: null };
  let disturbed = [];
  const plant = (p, text) => { if (study[p] !== null && sha(p) !== study[p]) disturbed.push(`${relative(S, p)} changed by an organ before a re-plant`); writeFileSync(p, text); study[p] = sha(p); };
  const studyHeld = () => { for (const p of Object.keys(study)) if (study[p] !== null && sha(p) !== study[p]) disturbed.push(`${relative(S, p)} changed by an organ`); };
  const D = (day, hm) => `2026-11-0${day}T${hm}:00.000Z`;
  const forge = (o) => JSON.stringify({ concept: "wit-concept", step: 3, current_axis: "c", started_at: D(2, "10:00"), updated_at: D(2, "10:00"), ...o });
  plant(FORGE, forge({}));
  plant(PTR, JSON.stringify({ v: 1, kind: "written", id: "rp-wit-1", written_at: D(2, "09:59"), concept: "wit-concept", step: 3, axis: "c", question: "planted pointer question", session_id: "wit" }) + "\n");
  const ACTS_URL = pathToFileURL(sc(T, "acts.mjs")).href;
  const tail = (now, words) => {
    const turn = `Yeh baad mein — abhi wapas: planted micro-question?\n<<ACT ${JSON.stringify({ acts: [{ verb: "park", args: { text: words } }] })}>>`;
    const rr = node(T, S, now, [TAIL], { extra: { MPRK_TAIL: turn, MPRK_ACTS_URL: ACTS_URL } });
    let rows = []; try { rows = JSON.parse(lines(rr.out).pop() || "[]"); } catch { rows = []; }
    return { rows, err: rr.err };
  };
  const parkRows = () => lines(RD(join(S, "parked.jsonl"))).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const parksJson = (now) => { const r = node(T, S, now, [sc(T, "parked.mjs"), "json"]); try { return JSON.parse(lines(r.out).pop() || "null"); } catch { return null; } };
  const deck = () => { try { return JSON.parse(RD(join(S, "captains_call.json")) || "null") || { cards: [] }; } catch { return { cards: [] }; } };
  const cardOf = (pid) => (deck().cards || []).find((c) => c.key === `park:${pid}`) || null;
  const deal = (now) => { const r = node(T, S, now, [sc(T, "captains_call.mjs"), "deal"]); return { ...r, cards: lines(r.out).filter((l) => /^🎴 CAPTAIN'S CALL/.test(l)) }; };
  const answer = (now, id, w) => node(T, S, now, [sc(T, "captains_call.mjs"), "answer", id, w]);
  const isOpen = (pid, now) => { const j = parksJson(now); return !!(j && (j.open || []).some((p) => p.id === pid)); };
  const closeOf = (pid, now) => { const j = parksJson(now); return j && (j.closes || []).find((c) => c.id === pid) || null; };
  const parkIdOf = (rows) => { const r = (rows || []).find((x) => x.verb === "park" && x.ok); const m = r && /"id":"([^"]+)"/.exec(r.receipt || ""); return m ? m[1] : null; };

  // K1 · the tail door, real dispatch, FRESH forge session
  const W1 = "planted words one — the notes ka format baad mein dekhna";
  const t1 = tail(D(2, "10:01"), W1);
  const p1 = parkIdOf(t1.rows);
  const pr1 = parkRows().filter((r) => r.ev === "park");
  clause("K1", pr1.length === 1 && pr1[0].text === W1 && pr1[0].concept === "wit-concept" && pr1[0].axis === "c" && p1 === pr1[0].id,
    `tail dispatch: ${JSON.stringify(t1.rows.map((r) => `${r.verb} ${r.ok ? "ok" : `✗ ${String(r.error || "").slice(0, 90)}`}`))} · park rows ${pr1.length} (must be 1) · words byte-equal ${!!pr1[0] && pr1[0].text === W1} · stamps ${pr1[0] ? `${pr1[0].concept}/${pr1[0].axis}` : "none"} (must be wit-concept/c)`);
  studyHeld();

  // K3K4 · silent while the session is FRESH; ONE park card once it is closed
  const sy = node(T, S, D(2, "10:02"), [sc(T, "captains_call.mjs"), "sync"]);
  const d3 = deal(D(2, "10:02"));
  studyHeld();
  plant(FORGE, forge({ closed_at: D(2, "10:03") }));
  const d4 = deal(D(2, "10:04"));
  const c1 = p1 ? cardOf(p1) : null;
  clause("K3K4", !!p1 && d3.cards.length === 0 && d4.cards.length === 1 && !!c1 && d4.cards[0].includes(W1) && (c1.dealt || []).length === 1,
    `fresh session: sync "${lines(sy.out).pop() || sy.err.trim().slice(0, 80)}" · deal printed ${d3.cards.length} card(s) (must be 0) · closed session: deal printed ${d4.cards.length} (must be 1) · keyed park:<id> ${!!c1} · carries the words ${!!d4.cards[0] && d4.cards[0].includes(W1)}`);

  // K5 · two parks + one hand-filed card, two deals on one planted day → one card each, different cards
  const hand = node(T, S, D(3, "10:00"), [sc(T, "captains_call.mjs"), "file", "--line", "planted hand card beside the parks", "--why-code-cannot-decide", "planted by the witness: a hand-filed card beside the parks, his own note"]);
  const W2 = "planted words two — tool wala sawaal";
  const t2 = tail(D(3, "10:01"), W2); const p2 = parkIdOf(t2.rows);
  const d5a = deal(D(3, "10:02")), d5b = deal(D(3, "10:03"));
  clause("K5", !!p2 && d5a.cards.length === 1 && d5b.cards.length === 1 && d5a.cards[0] !== d5b.cards[0] && [d5a.cards[0], d5b.cards[0]].some((l) => l.includes(W2)),
    `hand card "${lines(hand.out).pop() || hand.err.trim().slice(0, 60)}" · park two ${p2 ? "parked" : "NOT parked"} · deal 1: ${d5a.cards.length} card(s) · deal 2: ${d5b.cards.length} card(s) (one each) · different ${d5a.cards[0] !== d5b.cards[0]} · park two dealt ${[d5a.cards[0], d5b.cards[0]].some((l) => l && l.includes(W2))}`);
  studyHeld();

  // K6 · haan closes A, na closes B, through the owner; neither deals again
  const c1b = p1 ? cardOf(p1) : null, c2 = p2 ? cardOf(p2) : null;
  const handCard = (deck().cards || []).find((c) => c.source === "hand-filed");
  const aH = c1b ? answer(D(3, "10:05"), c1b.id, "haan") : { code: null, out: "", err: "no card for park one" };
  const aN = c2 ? answer(D(3, "10:06"), c2.id, "na") : { code: null, out: "", err: "no card for park two" };
  if (handCard) answer(D(3, "10:07"), handCard.id, "na");
  const x1 = p1 ? closeOf(p1, D(3, "10:08")) : null, x2 = p2 ? closeOf(p2, D(3, "10:08")) : null;
  const d6 = deal(D(4, "09:00"));
  clause("K6", !!x1 && x1.by === "haan" && !!x2 && x2.by === "na" && !d6.cards.some((l) => l.includes(W1) || l.includes(W2)),
    `haan: exit ${aH.code} "${(lines(aH.out).pop() || aH.err.trim()).slice(0, 80)}" · na: exit ${aN.code} · park one closed by ${x1 ? x1.by : "nothing"} (must be haan) · park two closed by ${x2 ? x2.by : "nothing"} (must be na) · next day deals either: ${d6.cards.some((l) => l.includes(W1) || l.includes(W2))}`);
  studyHeld();

  // K7 · baad sleeps the card a day; the park stays open and returns
  const W3 = "planted words three — baad wala";
  const t3 = tail(D(4, "10:00"), W3); const p3 = parkIdOf(t3.rows);
  const d7a = deal(D(4, "10:01"));
  const c3 = p3 ? cardOf(p3) : null;
  const aB = c3 ? answer(D(4, "10:02"), c3.id, "baad") : { code: null, out: "", err: "no card for park three" };
  const open3 = p3 ? isOpen(p3, D(4, "10:03")) : false;
  const d7b = deal(D(4, "10:04"));
  const d7c = deal(D(5, "10:00"));
  clause("K7", !!p3 && d7a.cards.some((l) => l.includes(W3)) && aB.code === 0 && open3 && !d7b.cards.some((l) => l.includes(W3)) && d7c.cards.some((l) => l.includes(W3)),
    `dealt first ${d7a.cards.some((l) => l.includes(W3))} · baad exit ${aB.code} · park still open ${open3} · same day dealt again ${d7b.cards.some((l) => l.includes(W3))} (must be false) · next day dealt ${d7c.cards.some((l) => l.includes(W3))} (must be true)`);
  studyHeld();

  // K8 + F3 · undo of the park act closes it by undo; the next sync retires its card at source
  const W4 = "planted words four — undo wala";
  const t4 = tail(D(5, "11:00"), W4); const p4 = parkIdOf(t4.rows);
  const act4 = (t4.rows.find((r) => r.verb === "park" && r.ok) || {}).id || null;
  node(T, S, D(5, "11:01"), [sc(T, "captains_call.mjs"), "sync"]);
  const minted4 = p4 ? !!cardOf(p4) : false;
  const u = act4 ? node(T, S, D(5, "11:02"), [sc(T, "acts.mjs"), "undo", act4]) : { code: null, out: "", err: "no park act" };
  const x4 = p4 ? closeOf(p4, D(5, "11:03")) : null;
  clause("K8", !!x4 && x4.by === "undo" && u.code === 0,
    `undo of act ${act4 || "none"}: exit ${u.code} "${(lines(u.out).pop() || u.err.trim()).slice(0, 90)}" · park four closed by ${x4 ? x4.by : "nothing"} (must be undo)`);
  node(T, S, D(5, "11:04"), [sc(T, "captains_call.mjs"), "sync"]);
  const c4 = p4 ? cardOf(p4) : null;
  clause("F3", minted4 && !!c4 && !!c4.retired_at && !c4.answer && /resolved-at-source/.test(String(c4.resolution || "")),
    `park four's card minted before the undo ${minted4} · after the next sync: retired ${!!(c4 && c4.retired_at)} · answered ${!!(c4 && c4.answer)} (must be false) · resolution "${c4 ? String(c4.resolution || "").slice(0, 80) : "no card"}"`);
  studyHeld();

  // F4 · the tail is the ONE write door: the cli door is refused and writes no park
  const before = parkRows().length;
  const f4 = node(T, S, D(5, "12:00"), [sc(T, "acts.mjs"), "do", "park", "--door", "cli", "--text", "planted words five — cli door"]);
  const after = parkRows().length;
  clause("F4", !!p1 && f4.code === 1 && after === before && /park/.test(f4.out + f4.err),
    `tail door parked ${!!p1} · \`acts.mjs do park --door cli\` exit ${f4.code} (must be 1) "${(lines(f4.out).pop() || f4.err.trim()).slice(0, 110)}" · park rows ${before} → ${after} (must not move)`);
  studyHeld();

  // K9 · the study session not disturbed; only the three flow files appear in the planted dir
  const files = readdirSync(S).sort();
  const extra = files.filter((f) => !["parked.jsonl", "captains_call.json", "acts.jsonl", "forge_session.json", "resume_pointer.jsonl"].includes(f) && !/\.tmp$/.test(f));
  clause("K9", !disturbed.length && files.includes("parked.jsonl") && files.includes("captains_call.json") && files.includes("acts.jsonl") && !extra.length,
    `forge_session.json / resume_pointer.jsonl ${disturbed.length ? `DISTURBED: ${disturbed.slice(0, 2).join("; ")}` : "byte-identical across every organ run"} · planted dir holds ${files.join(", ")}${extra.length ? ` · beyond the flow: ${extra.join(", ")}` : ""}`);
}

// ── K2 · sole writer ──
if (want("K2")) {
  const HEADER = "//   SOLE WRITER of dressing-room/state/parked.jsonl (gitignored — his words verbatim). Writes NOTHING else.";
  const src = RD(join(ORG, "scripts", "parked.mjs"));
  const hdr = !!src && src.split(/\r?\n/).includes(HEADER);
  const T = copyTree(ORG, "org-xray");
  const r = node(T, null, new Date().toISOString(), [sc(T, "xray.mjs"), "q"]);
  let q = null; try { q = JSON.parse(r.out); } catch { q = null; }
  const P = "dressing-room/state/parked.jsonl";
  const names = (rows) => (rows || []).filter((x) => x && String(x.path || "").endsWith("parked.jsonl"));
  const all = q ? [...(q.Q1 || []), ...(q.Q2 || []), ...(q.Q3 || []), ...(q.Q5 || [])] : [];
  // xray's IR is read through its own exported build() so the writer list is the IR's, not a query's subset
  const ir = node(T, null, new Date().toISOString(), ["--input-type=module", "-e",
    `const x = await import(${JSON.stringify(pathToFileURL(sc(T, "xray.mjs")).href)}); const ir = x.build(); const f = ir.files.find((f) => f.path === ${JSON.stringify(P)}); console.log(JSON.stringify(f ? { writers: f.writers, readers: f.readers } : null));`]);
  let f = null; try { f = JSON.parse(lines(ir.out).pop() || "null"); } catch { f = null; }
  const only = !!f && Array.isArray(f.writers) && f.writers.length === 1 && f.writers[0] === "parked.mjs";
  clause("K2", hdr && !!q && only && !names(q.Q2).length && !names(q.Q5).length,
    `header line verbatim ${hdr} · xray IR writers of ${P}: ${f ? JSON.stringify(f.writers) : "not in the IR"} (must be ["parked.mjs"]) · readers ${f ? JSON.stringify(f.readers) : "-"} · Q2 rows naming it ${q ? names(q.Q2).length : "?"} · Q5 rows naming it ${q ? names(q.Q5).length : "?"} · ${q ? `Q2 ${(q.Q2 || []).length} · Q5 ${(q.Q5 || []).length}` : `xray q unreadable (exit ${r.code} ${r.err.trim().slice(0, 80)})`}${all.length ? "" : ""}`);
}

// ── F5 · ships (a); (b) behind ONE switch that is OFF; read both ways ──
if (want("F5")) {
  const SW = /export const LIST_SUPERSEDED_BY_CARDS = (true|false);/;
  const src = RD(join(ORG, "scripts", "parked.mjs")) || "";
  const m = SW.exec(src);
  const run = (tree, tag) => {
    const S = join(TMP, `state-f5-${tag}`); mkdirSync(S, { recursive: true });
    writeFileSync(join(S, "forge_session.json"), JSON.stringify({ concept: "wit-concept", step: 4, current_axis: "d", started_at: "2026-11-07T10:00:00.000Z", updated_at: "2026-11-07T10:00:00.000Z" }));
    const a = node(tree, S, "2026-11-07T10:05:00.000Z", [sc(tree, "parked.mjs"), "add", "--door", "act", "--why", "planted reason: system talk mid-axis"], { input: "planted words six — close list wala" });
    const l = node(tree, S, "2026-11-07T10:06:00.000Z", [sc(tree, "parked.mjs"), "close-list"]);
    return { add: a, out: lines(l.out), code: l.code };
  };
  let off = null, on = null;
  if (m) {
    const T = copyTree(ORG, "org-f5a"); off = run(T, "a");
    const Tb = copyTree(ORG, "org-f5b");
    const p = sc(Tb, "parked.mjs"); writeFileSync(p, (RD(p) || "").replace(SW, "export const LIST_SUPERSEDED_BY_CARDS = true;"));
    on = run(Tb, "b");
  }
  const aOk = !!off && off.code === 0 && off.out.some((l) => l.includes("planted words six — close list wala") && l.includes("planted reason: system talk mid-axis"));
  const bOk = !!on && on.code === 0 && on.out.length === 1 && !on.out[0].includes("planted words six") && /card/i.test(on.out[0]);
  clause("F5", !!m && m[1] === "false" && aOk && bOk,
    `switch ${m ? `shipped ${m[1] === "false" ? "OFF" : "ON"}` : "absent"} (must ship OFF) · OFF = (a): ${off ? `${off.out.length} line(s), names the park with its reason ${aOk}` : "not run"} · planted ON = (b): ${on ? `${on.out.length} line(s), no words ${!!on.out[0] && !on.out[0].includes("planted words six")}` : "not run"}`);
}

// ── SKILL · the three lines that name the park tail ──
if (want("SKILL")) {
  const TAILRE = /<<ACT \{"acts":\[\{"verb":"park","args":\{"text":"<his words>"\}\}\]\}>>/;
  const bar = RD(join(ORG, "scripts", "teaching_bar.mjs")) || "";
  const barLine = bar.split(/\r?\n/).find((l) => /\[PARK\]/.test(l) && /L\.push\(/.test(l)) || "";
  const fs = RD(join(ORG, ".claude", "skills", "forge", "SKILL.md")) || "", ls = RD(join(ORG, ".claude", "skills", "learn", "SKILL.md")) || "";
  const near = (t) => { const L = t.split(/\r?\n/); const i = L.findIndex((l) => /No system \/ notes \/ tool work mid-concept/.test(l)); return i >= 0 && TAILRE.test(L.slice(i, i + 4).join("\n")); };
  clause("SKILL", TAILRE.test(barLine) && near(fs) && near(ls),
    `teaching_bar [PARK] line names the tail ${TAILRE.test(barLine)} · forge/SKILL.md park line ${near(fs)} · learn/SKILL.md park line ${near(ls)}`);
}

// ── COVER · exactly one suite, and it runs green ──
if (want("COVER")) {
  let pk = null; try { pk = JSON.parse(RD(join(ORG, "package.json")) || "null"); } catch { pk = null; }
  const suites = pk ? Object.entries(pk.scripts || {}).filter(([k]) => /:selftest$/.test(k) && /&&/.test(String(pk.scripts[k]))) : [];
  const n = suites.reduce((a, [, v]) => a + String(v).split("&&").map((s) => s.trim()).filter((s) => s === "node scripts/parked.mjs selftest").length, 0);
  let st = { code: null, out: "" };
  if (existsSync(join(ORG, "scripts", "parked.mjs"))) { const T = copyTree(ORG, "org-cover"); st = node(T, null, new Date().toISOString(), [sc(T, "parked.mjs"), "selftest"]); }
  clause("COVER", n === 1 && st.code === 0, `suite entries naming \`node scripts/parked.mjs selftest\`: ${n} (must be 1) · its selftest exit ${st.code} "${lines(st.out).pop() || ""}"`);
}

// ── BOUND ──
if (want("BOUND")) {
  if (!BASE_ORG || !existsSync(BASE_ORG)) clause("BOUND", false, "no --base-org");
  else {
    const walk = (root, d = root, acc = new Map()) => {
      for (const e of readdirSync(d)) {
        if (e === ".git" || e === "node_modules") continue;
        const p = join(d, e);
        if (lstatSync(p).isSymbolicLink()) continue;
        if (statSync(p).isDirectory()) walk(root, p, acc);
        else acc.set(relative(root, p).replace(/\\/g, "/"), createHash("sha256").update(readFileSync(p, "utf8").replace(/\r\n/g, "\n")).digest("hex"));
      }
      return acc;
    };
    const WA = walk(BASE_ORG), WB = walk(ORG);
    const differ = [...new Set([...WA.keys(), ...WB.keys()])].filter((k) => WA.get(k) !== WB.get(k)).sort();
    const beyond = differ.filter((f) => !NAMED.includes(f) && !f.startsWith("ci/mprk/"));
    clause("BOUND", differ.includes("scripts/parked.mjs") && !beyond.length, `differs: ${differ.join(", ") || "nothing"}${beyond.length ? ` · beyond the named files: ${beyond.join(", ")}` : ""}`);
  }
}

// ── LAST ──
{
  const listing = process.platform === "win32"
    ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", timeout: left(), windowsHide: true }).stdout || ""
    : spawnSync("ps", ["-eo", "args"], { encoding: "utf8", timeout: left() }).stdout || "";
  const alive = String(listing).split(/\r?\n/).filter((l) => l.includes(TMP) && !l.includes("Get-CimInstance") && !/^ps /.test(l));
  clause("LAST", alive.length === 0, `${alive.length} node process(es) naming the temp root${alive.length ? `: ${alive.slice(0, 2).join(" | ").slice(0, 200)}` : ""}`);
}
try { rmSync(TMP, { recursive: true, force: true }); } catch { }
if (reds.length) { console.log(`RED MPRK · ${reds.join(", ")}`); process.exit(1); }
console.log(`GREEN MPRK one owner for parked items, one card where each returns · ${greens.length} clause(s)`);
process.exit(0);
