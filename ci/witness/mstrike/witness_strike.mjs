#!/usr/bin/env node
// ============================================================================
// ci/witness/mstrike/witness_strike.mjs — UNIT mstrike · C:capability-c22 · THE ASKED-FIRST STRIKE WAS ASKED, AND ASKED FIRST
// ----------------------------------------------------------------------------
// SPEC ci/mwit/MWIT_SPEC.md @ 88bf69d §C:capability-c22 (b); rulings forks rows 1162 / 1163 (where they differ, the ruling wins).
// TWO MODES, ONE READER:
//   node ci/witness/mstrike/witness_strike.mjs --day <YYYY-MM-DD IST>          THE READER (the receipt organ's form, F4 a)
//     exit 0 iff on real day D (day.mjs dayProof: a fulltime close with a bound host) a brief row of D recorded a strike
//            (brief_log.jsonl `asked_first.strike`, learnstate.mjs its sole writer) at or before the host session's first
//            prompt, AND the sitting's FIRST teacher turn (teaching_gate.mjs parseTranscript/turnsOf `firstTurn` over the
//            host's transcript; study_scope.mjs transcriptPathFor names the file) carries that strike's quoted trap BEFORE
//            its first question mark — no other question is asked before it
//     exit 1 a strike was briefed and the first teacher turn did not ask it first
//     exit 2 UNREAD — the day is not real, no strike was briefed (a day with no gate-passed note cannot witness the clause),
//            or the host transcript is absent/unreadable/holds no prompt. Never a green. On the cloud the transcript lives
//            only on his laptop, so a real day reads UNREAD here (row 1162 (5)).
//     It prints no state content: no strike text, no note id, no word of his — a verdict, the day and a reason shape only.
//   node ci/witness/mstrike/witness_strike.mjs plants [--org <dir>]   THE SUITE'S MODE (unit mmeter's one member, row 1162 (2)):
//     the six C22 plants and LAST over --org (default: this tree), no BOUND (the member hands no base); one
//     `CLAUSE C22 GREEN|RED · k/n plant(s)` line, then `PLANTS mstrike · k of n plant(s) as expected`; exit 0 iff k === n > 0
//   node ci/witness/mstrike/witness_strike.mjs --org <build tree> --base-org <base tree> [--only c22]   THE PLANTS BOTH WAYS
//     Every plant is ONE temp root under os.tmpdir(): a copy of --org's scripts/ and of --org's own reader
//     (ci/witness/mstrike/witness_strike.mjs — absent on the base, so every plant there reads RED), a planted
//     dressing-room/state (sitting_reviews.jsonl + brief_log.jsonl, nothing of his) and a planted HOME/USERPROFILE holding
//     the host transcripts. The reader is spawned in --day mode over each planted day. No git repo is planted (core.autocrlf:
//     nothing to clone or init); every line read is split on \r?\n; BOUND hashes text with CRLF folded to LF.
//     THE PORT CLASS (row 1053): binds no port, names no live service, POSTs nothing, restarts nothing. Every spawn is
//     bounded by the job's own timeout-minutes read from --org's .github/workflows/suite.yml (never typed here).
// CLAUSES:
//   C22.1 a strike briefed, the first teacher turn asks it first                → 0
//   C22.2 the strike asked only in the THIRD teacher turn                       → 1
//   C22.3 the first teacher turn asks another question before the strike        → 1
//   C22.4 the day's brief recorded no strike (a named absence)                  → 2
//   C22.5 the day closed by a rollover, never a fulltime end (not a real day)   → 2
//   C22.6 a real day with a strike, the host transcript absent                  → 2
//   BOUND only ci/witness/mstrike/ and ci/mstrike/ differ from --base-org
//   LAST  no node process naming the temp root survives
// LAST LINE: GREEN MSTRIKE <what> · <n> clause(s) (exit 0) · RED MSTRIKE · <clauses> (exit 1) · UNREAD MSTRIKE · <why> (exit 2)
// READS: scripts/
// READS: ci/witness/mstrike/
// READS: dressing-room/state/sitting_reviews.jsonl
// READS: dressing-room/state/brief_log.jsonl
// READS: .github/workflows/suite.yml
// ============================================================================
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");
const SELF_REL = "ci/witness/mstrike/witness_strike.mjs";
const OWN_DIRS = ["ci/witness/mstrike/", "ci/mstrike/"];
const argv = process.argv.slice(2);
const flag = (k) => { const i = argv.indexOf(k); return i > -1 ? argv[i + 1] : null; };
const rows = (p) => { try { return readFileSync(p, "utf8").split(/\r?\n/).filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((x) => x && typeof x === "object"); } catch { return null; } };
const istDay = (iso) => { const t = Date.parse(String(iso || "")); return Number.isFinite(t) ? new Date(t + 330 * 60000).toISOString().slice(0, 10) : null; };
const norm = (s) => String(s || "").toLowerCase().replace(/[“”]/g, "\"").replace(/\s+/g, " ").trim();

// ── THE READER ──────────────────────────────────────────────────────────────────────────────────────────────────────
/** The strike's quoted trap — the field askedFirst builds the strike from (learnstate.mjs:730: `— "<trap>" —`). */
export function trapOf(strike) {
  const m = /— "(.*)" —/.exec(String(strike || ""));
  if (!m) return null;
  const t = m[1].replace(/…$/u, "").trim();
  return t || null;
}
/** PURE: asked first? over the teacher turn the sitting opened with. */
export function askedFirstIn(turnBlocks, trap) {
  const text = norm(turnBlocks.filter((b) => b && b.kind === "text").map((b) => b.text).join("\n"));
  const i = text.indexOf(norm(trap));
  if (i < 0) return false;
  const q = text.search(/[?？]/);
  return q < 0 || i < q;
}
async function reader(D, root) {
  const out = (code, line) => ({ code, line });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(D || ""))) return out(2, "UNREAD MSTRIKE · --day is YYYY-MM-DD (IST)");
  const st = join(root, "dressing-room", "state");
  const reviews = rows(join(st, "sitting_reviews.jsonl"));
  if (reviews === null) return out(2, `UNREAD MSTRIKE · C22 day ${D} · sitting_reviews.jsonl unreadable`);
  const day = await import(pathToFileURL(join(root, "scripts", "day.mjs")).href);
  const proof = day.dayProof(D, { reviews });
  if (!proof.real) return out(2, `UNREAD MSTRIKE · C22 day ${D} · not a real day (dayProof: no fulltime close with a bound host)`);
  const rv = reviews.filter((r) => r.kind === "sitting_review" && String(r.sitting_id) === proof.sitting_id && r.reason === "fulltime" && r.host_session_id).at(-1);
  const host = rv && String(rv.host_session_id);
  const ss = await import(pathToFileURL(join(root, "scripts", "study_scope.mjs")).href);
  const tx = ss.transcriptPathFor(host, { root });
  if (!tx) return out(2, `UNREAD MSTRIKE · C22 day ${D} · the host is not a session id`);
  let raw; try { raw = readFileSync(tx, "utf8"); } catch { return out(2, `UNREAD MSTRIKE · C22 day ${D} · the host transcript is absent or unreadable here`); }
  const tg = await import(pathToFileURL(join(root, "scripts", "teaching_gate.mjs")).href);
  const parsed = tg.parseTranscript(raw);
  const T = tg.turnsOf(parsed);
  if (!parsed.prompts.length) return out(2, `UNREAD MSTRIKE · C22 day ${D} · the host transcript holds no prompt`);
  const firstAt = Date.parse(String(parsed.prompts[0].ts || "")) || Date.parse(String(rv.closed_at));
  const briefs = rows(join(st, "brief_log.jsonl"));
  if (briefs === null) return out(2, `UNREAD MSTRIKE · C22 day ${D} · brief_log.jsonl unreadable`);
  const b = briefs.filter((r) => (r.day || istDay(r.ts)) === D && Date.parse(String(r.ts)) <= firstAt && r.asked_first && typeof r.asked_first.strike === "string" && r.asked_first.strike).at(-1);
  if (!b) return out(2, `UNREAD MSTRIKE · C22 day ${D} · no brief of the day recorded a strike before the sitting's first prompt`);
  const trap = trapOf(b.asked_first.strike);
  if (!trap) return out(2, `UNREAD MSTRIKE · C22 day ${D} · the recorded strike carries no quoted trap`);
  const turn = T.firstTurn;
  return askedFirstIn(turn, trap)
    ? out(0, `GREEN MSTRIKE C22 day ${D} · the briefed strike was asked first in the sitting's first teacher turn · 1 clause(s)`)
    : out(1, `RED MSTRIKE · C22 (day ${D}: a strike was briefed and the first teacher turn did not ask it first)`);
}

// ── THE PLANTS ──────────────────────────────────────────────────────────────────────────────────────────────────────
const TRAP = "planted trap: a token is always one whole word";
const STRIKE = `planted-concept · axis a — "${TRAP}" — yeh kahan tootta hai, aur kyun? pehle khud jawab`;
const uuid = (k) => `00000000-0000-4000-8000-${String(k).padStart(12, "0")}`;
const urow = (ts, text) => ({ type: "user", timestamp: ts, message: { role: "user", content: text } });
const arow = (ts, text) => ({ type: "assistant", timestamp: ts, message: { role: "assistant", content: [{ type: "text", text }] } });
const PLANTS = [
  // id, day, reason, strike?, transcript turns (null = no transcript), want
  { id: "C22.1", day: "2026-10-01", reason: "fulltime", strike: true, turns: [`Tum yahan ho: step 1 of 12. "${TRAP}" — yeh kahan tootta hai, aur kyun?`, "theek", "aage"], want: 0 },
  { id: "C22.2", day: "2026-10-02", reason: "fulltime", strike: true, turns: ["Chalo shuru karte hain. Aaj tokenization.", "Pehle ek tasveer dekho.", `"${TRAP}" — yeh kahan tootta hai, aur kyun?`], want: 1 },
  { id: "C22.3", day: "2026-10-03", reason: "fulltime", strike: true, turns: [`Kya tum ready ho? Phir: "${TRAP}" — yeh kahan tootta hai?`, "theek", "aage"], want: 1 },
  { id: "C22.4", day: "2026-10-04", reason: "fulltime", strike: false, turns: [`"${TRAP}" — yeh kahan tootta hai?`], want: 2 },
  { id: "C22.5", day: "2026-10-05", reason: "rollover", strike: true, turns: [`"${TRAP}" — yeh kahan tootta hai?`], want: 2 },
  { id: "C22.6", day: "2026-10-06", reason: "fulltime", strike: true, turns: null, want: 2 },
];
function walk(dir, base = dir, out = new Map()) {
  let ents = []; try { ents = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    if (e.name === ".git" || e.name === "node_modules") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, base, out);
    else if (e.isFile()) out.set(relative(base, p).split(sep).join("/"), createHash("sha256").update(readFileSync(p).toString("latin1").replace(/\r\n/g, "\n")).digest("hex"));
  }
  return out;
}
function survivors(root) {
  const r = process.platform === "win32"
    ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true })
    : spawnSync("ps", ["-eo", "args"], { encoding: "utf8" });
  if (r.status !== 0) return null;
  return String(r.stdout || "").split(/\r?\n/).filter((l) => /node/i.test(l) && l.includes(root) && !l.includes("ps -eo"));
}
async function plants(org, base, only, suite = false) {
  const res = [];
  const ok = (id, pass, detail) => { res.push({ id, pass, detail }); console.log(`  ${pass ? "ok  " : "RED "} ${id} · ${detail}`); };
  const m = /timeout-minutes:\s*(\d+)/.exec((() => { try { return readFileSync(join(org, ".github", "workflows", "suite.yml"), "utf8"); } catch { return ""; } })());
  const JOB_MS = m ? Number(m[1]) * 60000 : 0;
  const root = mkdtempSync(join(tmpdir(), "mstrike-"));
  try {
    const want = !only || only.includes("c22");
    if (want) {
      if (!JOB_MS) ok("C22", false, "the spawn bound (suite.yml timeout-minutes) is unreadable in --org");
      const tree = join(root, "tree"), home = join(root, "home"), st = join(tree, "dressing-room", "state");
      cpSync(join(org, "scripts"), join(tree, "scripts"), { recursive: true });
      const rd = join(org, ...SELF_REL.split("/"));
      const hasReader = existsSync(rd);
      if (hasReader) { mkdirSync(join(tree, "ci", "witness", "mstrike"), { recursive: true }); cpSync(rd, join(tree, ...SELF_REL.split("/"))); }
      mkdirSync(st, { recursive: true });
      const ss = await import(pathToFileURL(join(org, "scripts", "study_scope.mjs")).href);
      const pdir = join(home, ".claude", "projects", ss.projectSlug(tree));
      mkdirSync(pdir, { recursive: true });
      const rev = [], briefs = [];
      PLANTS.forEach((p, k) => {
        const h = uuid(k + 1), z = (hh) => `${p.day}T${hh}:00:00.000Z`;
        rev.push({ kind: "sitting_review", sitting_id: `s-plant-${k + 1}`, opened_at: z("03"), closed_at: z("12"), reason: p.reason, host_session_id: h });
        briefs.push({ v: 1, id: `b-plant-${k + 1}`, ts: z("02"), day: p.day, pehla_kaam: "planted", carries_from: null, carry: null, rejirah: [], asked_first: p.strike ? { note_id: `n-plant-${k + 1}`, strike: STRIKE } : { absent: "planted absence" } });
        if (p.turns) {
          const lines = [];
          p.turns.forEach((t, j) => { lines.push(urow(z(String(4 + j).padStart(2, "0")), j === 0 ? "/learn" : "haan"), arow(z(String(4 + j).padStart(2, "0")), t)); });
          writeFileSync(join(pdir, `${h}.jsonl`), lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
        }
      });
      writeFileSync(join(st, "sitting_reviews.jsonl"), rev.map((r) => JSON.stringify(r)).join("\n") + "\n");
      writeFileSync(join(st, "brief_log.jsonl"), briefs.map((r) => JSON.stringify(r)).join("\n") + "\n");
      for (const p of PLANTS) {
        if (!JOB_MS) break;
        if (!hasReader) { ok(p.id, false, `want exit ${p.want} · the reader ${SELF_REL} is absent in --org`); continue; }
        const r = spawnSync(process.execPath, [join(tree, ...SELF_REL.split("/")), "--day", p.day], { cwd: tree, encoding: "utf8", windowsHide: true, timeout: JOB_MS, env: { ...process.env, HOME: home, USERPROFILE: home, ARSENAL_ORGAN: "1" } });
        const last = String(r.stdout || "").split(/\r?\n/).filter((l) => l.trim()).at(-1) || String(r.stderr || "").split(/\r?\n/).filter((l) => l.trim()).at(-1) || "";
        ok(p.id, r.status === p.want, `want exit ${p.want} · got ${r.status} · ${last.slice(0, 160)}`);
      }
    }
    // BOUND (not in the suite's plants mode: the member hands no base tree)
    if (suite) { /* BOUND is judged by the both-ways mode */ }
    else if (!base) ok("BOUND", false, "no --base-org");
    else {
      const A = walk(org), B = walk(base);
      const diff = [...new Set([...A.keys(), ...B.keys()])].filter((p) => A.get(p) !== B.get(p));
      const out = diff.filter((p) => !OWN_DIRS.some((d) => p.startsWith(d)));
      ok("BOUND", out.length === 0, out.length ? `${out.length} path(s) beyond the named files differ, first ${out[0]}` : `${diff.length} path(s) differ, all under ${OWN_DIRS.join(" ")}`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  const s = survivors(root);
  ok("LAST", Array.isArray(s) && s.length === 0, s === null ? "the process list is unreadable" : `${s.length} node process(es) name the temp root`);
  const red = res.filter((x) => !x.pass).map((x) => x.id);
  const n = res.filter((x) => /^C22\./.test(x.id)).length;
  if (suite) {
    const c = res.filter((x) => /^C22/.test(x.id)), k = c.filter((x) => x.pass).length, lastOk = !red.includes("LAST");
    console.log(`CLAUSE C22 ${k === c.length && c.length > 0 ? "GREEN" : "RED"} · ${k}/${c.length} plant(s)`);
    return { code: k === c.length && c.length > 0 && lastOk ? 0 : 1, line: `PLANTS mstrike · ${k} of ${c.length} plant(s) as expected` };
  }
  return red.length
    ? { code: 1, line: `RED MSTRIKE · ${[...new Set(red.map((x) => (/^C22/.test(x) ? "C22" : x)))].join(", ")} (${red.join(", ")})` }
    : { code: 0, line: `GREEN MSTRIKE the asked-first strike is read, and read first · 1 clause(s) (${n} plant(s), BOUND, LAST)` };
}

async function main() {
  const D = flag("--day"), org = flag("--org"), base = flag("--base-org"), only = flag("--only");
  let r;
  if (argv[0] === "plants") r = await plants(org || ROOT, null, null, true);
  else if (D) r = await reader(D, ROOT);
  else if (org) r = await plants(org, base, only ? only.toLowerCase().split(",") : null);
  else r = { code: 2, line: "UNREAD MSTRIKE · usage: --day <YYYY-MM-DD> | plants [--org <dir>] | --org <dir> --base-org <dir> [--only c22]" };
  console.log(r.line);
  process.exitCode = r.code;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
