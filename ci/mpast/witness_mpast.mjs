#!/usr/bin/env node
// ============================================================================
// ci/mpast/witness_mpast.mjs — unit mpast (forks rows 956 (3) / 1015 (2)-(4)): HIS FULL-TIME LINE FOR A PAST DAY THE DAY-CLOSE
// CARD NAMES, as ruled: A1 (his ONE line closes the NEWEST open day the card names; every OLDER named day gets ONE line that
// records the ABSENCE of his word and is read as closed, never re-asked) and B1 (the morning neither mints nor rewrites a card;
// the evening card with no kept card names every open day since the day after the newest ANSWERED day-close card).
// ----------------------------------------------------------------------------
// USAGE: node ci/mpast/witness_mpast.mjs --org <dir> [--base-org <dir>]
//   --org       a repository tree to witness (an LF git-archive tree; never his live tree)
//   --base-org  the BASE tree (main c56b0a8) — MB3's byte-equal reading and the BOUND clause need it; absent, both are RED
// CONTRACT — every plant runs on its OWN COPY of a tree under os.tmpdir(), with its OWN empty dressing-room/state (only the
//   plant in it, nothing of his), its own HOME / USERPROFILE / ARSENAL_ARCHIVE / ARSENAL_CALL_STATE_DIR under the same temp
//   root, TZ=Asia/Kolkata, and every step's clock FIXED through postmatch's own clock door (ARSENAL_AUTOCLOSE_CLOCK, honoured
//   only for a copy under os.tmpdir()). The days are in 2099, so the judge's own rule (judgeDue, the real clock) answers NOT
//   DUE and no model is reached. A FAKE claude (`claude` and `claude.cmd`) sits FIRST on PATH and logs any spawn; no live model
//   call can happen. No timeout, budget or size is typed. Windows: a node_modules link is a junction; path keys use forward
//   slashes; processes are listed without /proc.
// THE DAYS: A = 2099-03-01, B = 2099-03-02, T = 2099-03-03 (today at his full time, 12:00Z = 17:30 IST). Each day's evidence is
//   one outstanding capture on the grade queue (the mpm F5 rule) at 05:00Z; an EVENING close runs at 16:00Z of its day, a
//   MORNING close at 02:00Z of the next day. The deck is driven only through captains_call.mjs's own CLI (answer) and the
//   closes' own card step.
// CLAUSES (each planted both ways — the effect, and its contrast on the same plant):
//   MP1  card kept naming A, B · `--date B --hit HIT` writes HIS RESULT on B.md over the machine block (kept byte for byte), A.md
//        gains exactly ONE absence line (its bytes above kept), today's T.md is never written.
//   MP2  after MP1: a morning close of A reads it closed by a recorded decision (bytes unchanged); the next evening's card names
//        neither A nor B and does name T; `named` then names T.
//   MP3  --date REFUSED by name, exit 1, the state dir byte-equal, for: a day with no machine record, a future day (its machine
//        record planted, so only the future rule can refuse it), his own
//        closed day (with --force too — the double-click guard keyed on the day closed), a malformed date, an impossible date.
//   MP4  the absence line carries no legal RESULT (daily_green rung 8's own regex, read from its source, finds none on A.md;
//        KAL_RE neither) while B.md carries HIT; matches_played moved by ONE (B's), season rows hold B only.
//   MP5  season.json holding [2099-02-27 HIT, T MISS]: his `--date B --hit HIT` row is INSERTED BY DATE → [02-27, B, T]; the
//        current run reads days (0, T's MISS is the newest day), never close order (which would read 1).
//   MP6  THE KAL RULE: `named` at T says "KAL asked" for B (yesterday); at T+2 the same card's B is older than yesterday →
//        "KAL not asked"; with no card `named` names today.
//   MP7  `answer <id> na` on the card naming A, B → the next evening closes A and B with the na absence line and its card names
//        neither; `answer <id> baad` on the same plant closes nothing (A, B stay open and the card names A, B, T).
//   MB1  the card for A answered (haan) · a MORNING close of B: no card minted, the deck byte-equal; B.md is written.
//   MB2  that evening closes T: ONE card more, keyed dayclose:T, naming B and T, never A (before the window).
//   MB3  with a KEPT card the reline path is BASE's: A evening, B morning, T evening → the deck (key, line, source of each card)
//        equals BASE's, and its line names A, B, T.
//   MB4  more open days than the card line bound fits: the oldest that fit are named and the rest COUNTED `+k more` (named +
//        counted = every open day), never over captains_call's CARD_LINE_BOUND (read from its source).
//   BOUND --org differs from --base-org ONLY in scripts/postmatch.mjs and .claude/skills/full-time/SKILL.md (ci/mpast/** is this
//        unit's own output; .claude/settings.json is the seat's effort key, which never lands on main — both left out by name).
//   LAST no node process naming the temp root survives, and the fake claude logged no spawn.
// LAST LINE: GREEN MPAST his full time closes the newest named day · <n> clause(s)  (exit 0)  ·  RED MPAST · <clauses>  (exit 1)
// ============================================================================
import { cpSync, mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, statSync, symlinkSync, chmodSync } from "node:fs";
import { join, resolve, relative, sep, delimiter } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? resolve(process.argv[i + 1]) : null; };
const ORG = arg("--org"), BASE_ORG = arg("--base-org");
if (!ORG || !existsSync(join(ORG, "scripts", "postmatch.mjs"))) { console.log("RED MPAST · USAGE (--org <dir> with scripts/postmatch.mjs)"); process.exit(1); }

const A = "2099-03-01", B = "2099-03-02", T = "2099-03-03";
const addDays = (d, n) => new Date(Date.parse(`${d}T00:00:00.000Z`) + n * 86400000).toISOString().slice(0, 10);
const EVE = (d) => `${d}T16:00:00.000Z`, MORN = (d) => `${addDays(d, 1)}T02:00:00.000Z`, NOON = (d) => `${d}T12:00:00.000Z`;
const SKIP_TOP = new Set([".git", "node_modules"]);
const ROOT = mkdtempSync(join(tmpdir(), "mpast-wit-"));
const results = [];
const clause = (id, ok, why) => { results.push({ id, ok: !!ok }); console.log(`  ${ok ? "ok  " : "RED "} ${id} · ${why}`); };
const slash = (p) => p.split(sep).join("/");
const sha = (b) => createHash("sha256").update(b).digest("hex");

// the fake claude, first on PATH (a .cmd beside it for Windows)
const FAKE = join(ROOT, "fakebin"), CLAUDE_LOG = join(ROOT, "claude_spawns.log");
mkdirSync(FAKE, { recursive: true });
writeFileSync(join(FAKE, "claude"), `#!/bin/sh\necho "spawn $*" >> "$MPAST_FAKE_CLAUDE_LOG"\nexit 1\n`);
chmodSync(join(FAKE, "claude"), 0o755);
writeFileSync(join(FAKE, "claude.cmd"), `@echo spawn %* >> "%MPAST_FAKE_CLAUDE_LOG%"\r\n@exit /b 1\r\n`);

let seq = 0;
/** a fresh copy of `src` with its own empty state dir and the planted queue (one capture per day in `days`) */
function copyOf(src, tag, days) {
  const dst = join(ROOT, `${tag}-${++seq}`);
  cpSync(src, dst, { recursive: true, filter: (p) => {
    const rel = slash(relative(src, p));
    if (!rel) return true;
    if (SKIP_TOP.has(rel.split("/")[0])) return false;
    return !(rel === "dressing-room/state" || rel.startsWith("dressing-room/state/"));
  } });
  const st = join(dst, "dressing-room", "state");
  mkdirSync(st, { recursive: true });
  if (existsSync(join(src, "node_modules"))) symlinkSync(join(src, "node_modules"), join(dst, "node_modules"), "junction");
  const q = days.map((d, i) => ({ kind: "capture", id: `wq-${i}`, type: "axis_weld", ref: `witness:${d}`, spoken: "planted", ts: `${d}T05:00:00.000Z`, day: d }));
  writeFileSync(join(st, "gaffer_grade_queue.jsonl"), q.map((r) => JSON.stringify(r)).join("\n") + "\n");
  return dst;
}
function envFor(copy, clock) {
  const home = join(ROOT, `home-${slash(relative(ROOT, copy)).replace(/\//g, "_")}`);
  mkdirSync(home, { recursive: true });
  const e = { ...process.env };
  delete e.ANTHROPIC_API_KEY; delete e.ARSENAL_DAY_KEY; delete e.ARSENAL_AUTOCLOSE_DEADLINE; delete e.ARSENAL_ORGAN;
  const pathKey = Object.keys(e).find((k) => k.toUpperCase() === "PATH") || "PATH";
  return { ...e, [pathKey]: `${FAKE}${delimiter}${e[pathKey] || ""}`, HOME: home, USERPROFILE: home, TZ: "Asia/Kolkata",
    ARSENAL_ARCHIVE: join(ROOT, `archive-${slash(relative(ROOT, copy)).replace(/\//g, "_")}`), ARSENAL_CALL_STATE_DIR: join(copy, "dressing-room", "state"),
    ARSENAL_AUTOCLOSE_CLOCK: clock, MPAST_FAKE_CLAUDE_LOG: CLAUDE_LOG };
}
const node = (copy, script, args, clock) => {
  const r = spawnSync(process.execPath, [join(copy, "scripts", script), ...args], { cwd: copy, encoding: "utf8", env: envFor(copy, clock), windowsHide: true, input: "" });
  return { status: r.status, out: String(r.stdout || ""), err: String(r.stderr || "") };
};
const autoclose = (copy, day, anchor) => node(copy, "postmatch.mjs", ["autoclose", "--date", day, "--anchor", anchor], anchor === "evening" ? EVE(day) : MORN(day));
const fullTime = (copy, args, clock = NOON(T)) => node(copy, "postmatch.mjs", ["--signal", "planted signal", ...args], clock);
const named = (copy, clock = NOON(T)) => { const r = node(copy, "postmatch.mjs", ["named"], clock); return (r.out.split(/\r?\n/).find((l) => l.startsWith("postmatch named")) || `(exit ${r.status}) ${r.err.trim().split(/\r?\n/).at(-1) || ""}`); };
const pm = (copy, d) => join(copy, "dressing-room", "state", "post_match", `${d}.md`);
const read = (f) => (existsSync(f) ? readFileSync(f, "utf8") : null);
const deck = (copy) => { try { return JSON.parse(readFileSync(join(copy, "dressing-room", "state", "captains_call.json"), "utf8")).cards || []; } catch { return []; } };
const deckBytes = (copy) => read(join(copy, "dressing-room", "state", "captains_call.json"));
const dayclose = (copy) => deck(copy).filter((c) => String(c.key || "").startsWith("dayclose:"));
const answer = (copy, id, word) => node(copy, "captains_call.mjs", ["answer", id, word], NOON(T));
const stateHash = (copy) => {
  const st = join(copy, "dressing-room", "state"), acc = [];
  const walk = (d) => { for (const n of readdirSync(d).sort()) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else acc.push(`${slash(relative(st, p))}:${sha(readFileSync(p))}`); } };
  walk(st);
  return sha(acc.join("\n"));
};
const ABS_FT = (d) => new RegExp(`^NO LINE OF HIS for this day — closed by his full time on ${d} at \\S+, a recorded decision`, "m");
const ABS_NA = /^NO LINE OF HIS for this day — closed by his na on the day-close card \S+ at \S+, a recorded decision/m;
const KAL_RE = /KAL-?LINE\s*→\s*(.+)/i;
const names = (line, d) => String(line || "").includes(d);
const rm = (p) => { try { rmSync(p, { recursive: true, force: true }); } catch {} };

let exitCode = 1;
try {
  // ── S1 · MP1 MP2 MP3 MP4 MP6 — the card kept naming A, B; his full time at T ──
  {
    const c = copyOf(ORG, "s1", [A, B, T, addDays(T, 2)]);
    const e1 = autoclose(c, A, "evening"), e2 = autoclose(c, B, "evening");
    const card = dayclose(c)[0] || {};
    const a0 = read(pm(c, A)), b0 = read(pm(c, B));
    const nT = named(c), nT2 = named(c, NOON(addDays(T, 2)));
    const f = fullTime(c, ["--date", B, "--hit", "HIT", "--kal", "planted kal"]);
    const a1 = read(pm(c, A)), b1 = read(pm(c, B)), t1 = read(pm(c, T));
    const setupOk = e1.status === 0 && e2.status === 0 && names(card.line, A) && names(card.line, B) && !!a0 && !!b0;
    const oneLineMore = !!a1 && !!a0 && a1.startsWith(a0) && a1.slice(a0.length).split("\n").filter(Boolean).length === 1 && ABS_FT(B).test(a1.slice(a0.length));
    clause("MP1", setupOk && f.status === 0 && !!b1 && /^RESULT: HIT\./m.test(b1) && b1.endsWith(`\nMACHINE CLOSE (kept, L9)\n${b0}`) && oneLineMore && t1 === null,
      `setup ${setupOk ? "card names A, B" : `NOT PLANTED (exit ${e1.status}/${e2.status}, card "${String(card.line || "none").slice(0, 40)}")`} · --date B exit ${f.status} · B.md ${b1 && /^RESULT: HIT\./m.test(b1) ? "HIS RESULT on top" : "no result of his"}${b1 && b0 && b1.endsWith(`\nMACHINE CLOSE (kept, L9)\n${b0}`) ? ", machine block kept byte for byte" : ", machine block NOT kept"} · A.md ${oneLineMore ? "+1 absence line" : "NOT closed by one absence line"} · T.md ${t1 === null ? "untouched" : "WRITTEN"}`);

    // MP4 — no legal RESULT on A by daily_green's OWN regex; KAL_RE neither; matches_played moved by one
    const dg = read(join(c, "scripts", "daily_green.mjs")) || "";
    const fn = dg.slice(dg.indexOf("function cFulltime("), dg.indexOf("\n}\n", dg.indexOf("function cFulltime(")));
    const lit = /\.match\(\/(\^RESULT:[^\n]*?)\/m\)/.exec(fn);
    const rung8 = lit ? new RegExp(lit[1], "m") : null;
    const season = (() => { try { return JSON.parse(read(join(c, "dressing-room", "state", "season.json"))); } catch { return null; } })();
    clause("MP4", !!rung8 && !!a1 && !rung8.test(a1) && !KAL_RE.test(a1) && !!b1 && rung8.test(b1) && !!season && season.matches_played === 1
        && Array.isArray(season.rows) && season.rows.map((r) => r.date).join() === B && ABS_FT(B).test(a1),
      `rung 8's regex ${rung8 ? "read from daily_green.mjs" : "NOT FOUND"} · A.md ${a1 && rung8 && !rung8.test(a1) ? "no legal RESULT" : "a legal RESULT"}${a1 && ABS_FT(B).test(a1) ? " (the absence line on it)" : " (NO absence line)"} · KAL ${a1 && KAL_RE.test(a1) ? "MATCHES" : "none"} · B.md ${b1 && rung8 && rung8.test(b1) ? "HIT" : "no RESULT"} · matches_played ${season ? season.matches_played : "?"} · rows ${season && season.rows ? season.rows.map((r) => r.date).join("|") : "?"}`);

    // MP6 — the KAL rule, both ways on one card
    clause("MP6", new RegExp(`his line closes ${B} \\(--date ${B}\\) · older, closed with no line of his: ${A} · KAL asked$`).test(nT)
        && /· KAL not asked \(/.test(nT2) && names(nT2, `his line closes ${B}`),
      `at T: ${nT.slice(16, 140)} · at T+2: ${nT2.includes("KAL not asked") ? "KAL not asked" : nT2.slice(16, 100)}`);

    // MP3 — refusals, nothing written
    const FUT = addDays(T, 2), fm = autoclose(c, FUT, "morning");   // a FUTURE day WITH a machine record: only the future rule refuses it
    const h0 = stateHash(c);
    const tries = [["no record", ["--date", "2099-02-20"]], [`future (${fm.status === 0 && read(pm(c, FUT)) ? "its machine record planted" : "NO RECORD PLANTED"})`, ["--date", FUT]], ["his own day", ["--date", B]], ["his own day --force", ["--date", B, "--force"]],
      ["malformed", ["--date", "2099-3-1"]], ["impossible", ["--date", "2099-02-30"]]];
    const bad = [];
    for (const [why, a] of tries) { const r = fullTime(c, [...a, "--hit", "MISS"]); if (!(r.status === 1 && /REFUSED — /.test(r.err) && /nothing written/.test(r.err))) bad.push(`${why} (exit ${r.status})`); }
    const h1 = stateHash(c);
    clause("MP3", setupOk && f.status === 0 && fm.status === 0 && !!read(pm(c, FUT)) && bad.length === 0 && h0 === h1,
      `the accepted --date B exit ${f.status} · ${tries.length - bad.length} of ${tries.length} refused by name${bad.length ? ` — NOT refused: ${bad.join(", ")}` : ""} · state ${h0 === h1 ? "byte-equal" : "CHANGED"}`);

    // MP2 — after MP1: A reads closed, the next evening's card names neither A nor B, and does name T
    const aBefore = read(pm(c, A));
    const m = autoclose(c, A, "morning");
    const e3 = autoclose(c, T, "evening");
    const cards = dayclose(c), live = cards.filter((x) => !x.answer && !x.retired_at);
    const nAfter = named(c, NOON(addDays(T, 1)));
    clause("MP2", /closed by a recorded decision \(no line of his\) · never touched/.test(m.out) && read(pm(c, A)) === aBefore && e3.status === 0
        && live.length === 1 && !names(live[0].line, A) && !names(live[0].line, B) && names(live[0].line, T) && names(nAfter, `his line closes ${T}`),
      `A re-closed: ${m.out.includes("recorded decision") ? "read closed, untouched" : (m.out.trim().split(/\r?\n/).at(-1) || "").slice(0, 70)} · T evening exit ${e3.status} · ${live.length} live card(s), line "${String((live[0] || {}).line || "").slice(0, 40)}" · named: ${nAfter.slice(16, 80)}`);
    rm(c);
  }

  // ── S2 · MP5 — season.json rows inserted by date ──
  {
    const c = copyOf(ORG, "s2", [B]);
    writeFileSync(join(c, "dressing-room", "state", "season.json"), JSON.stringify({ season_day: 2, matches_played: 1, trophy_state: "unlit", started_on: "2099-02-27",
      rows: [{ date: "2099-02-27", matchday: 1, result: "HIT", kal: null, signal: null }, { date: T, matchday: null, result: "MISS", kal: null, signal: null }] }, null, 2) + "\n");
    const mo = autoclose(c, B, "morning");
    const f = fullTime(c, ["--date", B, "--hit", "HIT"]);
    const s = (() => { try { return JSON.parse(read(join(c, "dressing-room", "state", "season.json"))); } catch { return null; } })();
    const dates = s && Array.isArray(s.rows) ? s.rows.map((r) => r.date) : [];
    let run = 0; for (let i = dates.length - 1; i >= 0; i--) { if (["HIT", "PARTIAL", "REST"].includes(s.rows[i].result)) run++; else break; }
    const smd = read(join(c, "dressing-room", "SEASON.md")) || "";
    clause("MP5", mo.status === 0 && f.status === 0 && dates.join() === `2099-02-27,${B},${T}` && run === 0 && s.matches_played === 2 && s.last_played === T && /current run: 0 won-day\(s\)/.test(smd),
      `--date B exit ${f.status} · rows ${dates.join("|") || "?"} (close order would be 02-27|T|B) · current run ${run} · SEASON.md ${/current run: 0 won-day\(s\)/.test(smd) ? "reads 0" : "does NOT read 0"} · last_played ${s ? s.last_played : "?"}`);
    rm(c);
  }

  // ── S3 · MP7 — na closes every named day by the absence line; baad closes nothing ──
  {
    const c = copyOf(ORG, "s3na", [A, B, T]), d = copyOf(ORG, "s3baad", [A, B, T]);
    for (const x of [c, d]) { autoclose(x, A, "evening"); autoclose(x, B, "evening"); }
    const cid = (dayclose(c)[0] || {}).id, did = (dayclose(d)[0] || {}).id;
    const ra = cid ? answer(c, cid, "na") : { status: null }, rb = did ? answer(d, did, "baad") : { status: null };
    const ec = autoclose(c, T, "evening"), ed = autoclose(d, T, "evening");
    const aN = read(pm(c, A)) || "", bN = read(pm(c, B)) || "";
    const newCard = dayclose(c).find((x) => x.key === `dayclose:${T}`) || {};
    const baadLive = dayclose(d).filter((x) => !x.answer && !x.retired_at);
    const aB = read(pm(d, A)) || "", bB = read(pm(d, B)) || "";
    const naOk = ra.status === 0 && ec.status === 0 && ABS_NA.test(aN) && ABS_NA.test(bN) && names(newCard.line, T) && !names(newCard.line, A) && !names(newCard.line, B);
    const baadOk = rb.status === 0 && ed.status === 0 && !ABS_NA.test(aB) && !ABS_NA.test(bB) && baadLive.length === 1 && [A, B, T].every((x) => names(baadLive[0].line, x));
    clause("MP7", naOk && baadOk,
      `na: answer exit ${ra.status} · A ${ABS_NA.test(aN) ? "closed" : "OPEN"}, B ${ABS_NA.test(bN) ? "closed" : "OPEN"} by the na absence line · the next card "${String(newCard.line || "none").slice(0, 36)}" · baad: answer exit ${rb.status} · A, B ${!ABS_NA.test(aB) && !ABS_NA.test(bB) ? "still open" : "CLOSED"} · card "${String((baadLive[0] || {}).line || "none").slice(0, 46)}"`);
    rm(c); rm(d);
  }

  // ── S4 · MB1 MB2 — the morning neither mints nor rewrites; the evening's card names the slept day ──
  {
    const c = copyOf(ORG, "s4", [A, B, T]);
    autoclose(c, A, "evening");
    const id = (dayclose(c)[0] || {}).id, ans = id ? answer(c, id, "haan") : { status: null };
    const d0 = deckBytes(c), n0 = deck(c).length;
    const mo = autoclose(c, B, "morning");
    const d1 = deckBytes(c);
    clause("MB1", ans.status === 0 && mo.status === 0 && !!read(pm(c, B)) && d0 !== null && d1 === d0,
      `answer haan exit ${ans.status} · morning close of B exit ${mo.status}, B.md ${read(pm(c, B)) ? "written" : "NONE"} · deck ${d1 === d0 ? "byte-equal (nothing minted, nothing rewritten)" : "CHANGED"}`);
    const ev = autoclose(c, T, "evening");
    const after = deck(c), fresh = after.find((x) => x.key === `dayclose:${T}`) || {};
    clause("MB2", ev.status === 0 && after.length === n0 + 1 && fresh.line === `${B}, ${T}: the days closed themselves — your HIT/MISS and tomorrow's line, if you want (/full-time)` && !names(fresh.line, A),
      `evening of T exit ${ev.status} · cards ${n0} → ${after.length} · dayclose:${T} line "${String(fresh.line || "none").slice(0, 60)}"`);
    rm(c);
  }

  // ── S5 · MB3 — with a KEPT card the reline path is BASE's ──
  {
    const flow = (src, tag) => { const c = copyOf(src, tag, [A, B, T]); autoclose(c, A, "evening"); autoclose(c, B, "morning"); autoclose(c, T, "evening"); const k = dayclose(c).map((x) => ({ key: x.key, line: x.line, source: x.source, answer: x.answer || null })); rm(c); return k; };
    const mine = flow(ORG, "s5org"), base = BASE_ORG ? flow(BASE_ORG, "s5base") : null;
    clause("MB3", !!base && JSON.stringify(mine) === JSON.stringify(base) && mine.length === 1 && [A, B, T].every((x) => names(mine[0].line, x)),
      `${mine.length} card(s), line "${String((mine[0] || {}).line || "none").slice(0, 60)}" · ${base ? (JSON.stringify(mine) === JSON.stringify(base) ? "equals BASE's" : "DIFFERS from BASE's") : "no --base-org"}`);
  }

  // ── S6 · MB4 — more open days than the bound fits: named oldest first, the rest counted ──
  {
    const D0 = "2099-04-01", ds = Array.from({ length: 6 }, (_, i) => addDays(D0, i));
    const c = copyOf(ORG, "s6", ds);
    autoclose(c, D0, "evening");
    const id = (dayclose(c)[0] || {}).id, ans = id ? answer(c, id, "haan") : { status: null };
    for (const d of ds.slice(1, 5)) autoclose(c, d, "morning");
    const ev = autoclose(c, ds[5], "evening");
    const cc = read(join(c, "scripts", "captains_call.mjs")) || "";
    const bound = Number((/export const CARD_LINE_BOUND = (\d+);/.exec(cc) || [])[1] || NaN);
    const card = dayclose(c).find((x) => x.key === `dayclose:${ds[5]}`) || {};
    const spelled = String(card.line || "").match(/\d{4}-\d{2}-\d{2}/g) || [], more = Number((/ \+(\d+) more: /.exec(String(card.line || "")) || [])[1] || 0);
    const want = ds.slice(1);
    clause("MB4", ans.status === 0 && ev.status === 0 && Number.isFinite(bound) && String(card.line || "").length <= bound && more > 0
        && spelled.join() === want.slice(0, spelled.length).join() && spelled.length + more === want.length,
      `bound ${bound} (read from captains_call.mjs) · line ${String(card.line || "").length} chars: "${String(card.line || "none").slice(0, 56)}" · named ${spelled.length} + counted ${more} of ${want.length} open day(s)`);
    rm(c);
  }

  // BOUND — the two trees, file by file (path keys with forward slashes)
  if (!BASE_ORG) clause("BOUND", false, "no --base-org given");
  else {
    const NAMED = new Set(["scripts/postmatch.mjs", ".claude/skills/full-time/SKILL.md"]);
    const OUT = (rel) => rel.startsWith("ci/mpast/") || rel === ".claude/settings.json";
    const walk = (dir, acc = new Map(), top = dir) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name), rel = slash(relative(top, p));
        if (SKIP_TOP.has(rel.split("/")[0]) || OUT(rel)) continue;
        const st = statSync(p);
        if (st.isDirectory()) walk(p, acc, top); else acc.set(rel, sha(readFileSync(p)));
      }
      return acc;
    };
    const a = walk(ORG), b = walk(BASE_ORG);
    const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort();
    clause("BOUND", diff.length > 0 && diff.every((k) => NAMED.has(k)) && diff.includes("scripts/postmatch.mjs"), `differs in ${diff.length} file(s): ${diff.slice(0, 6).join(", ") || "none"}`);
  }

  // LAST — no node process naming the temp root survives; the fake claude logged no spawn
  const listing = process.platform === "win32"
    ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true })
    : spawnSync("ps", ["-eo", "args"], { encoding: "utf8" });
  const procs = String(listing.stdout || "").split(/\r?\n/).filter((l) => /node/i.test(l) && (l.includes(ROOT) || l.includes(slash(ROOT))) && !l.includes("witness_mpast"));
  const spawns = existsSync(CLAUDE_LOG) ? readFileSync(CLAUDE_LOG, "utf8").trim() : "";
  clause("LAST", listing.status === 0 && procs.length === 0 && !spawns,
    `process list ${listing.status === 0 ? "read" : "NOT READ"} · ${procs.length} node process(es) naming the temp root · fake claude ${spawns ? `logged ${spawns.split(/\r?\n/).length} spawn(s)` : "logged no spawn"}`);
} catch (e) {
  clause("RUN", false, `the witness threw: ${(e && e.message) || e}`);
} finally {
  rm(ROOT);
}
const red = results.filter((r) => !r.ok).map((r) => r.id);
if (!red.length) { console.log(`GREEN MPAST his full time closes the newest named day · ${results.length} clause(s)`); exitCode = 0; }
else console.log(`RED MPAST · ${red.join(" ")}`);
process.exitCode = exitCode;
