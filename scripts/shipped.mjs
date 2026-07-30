#!/usr/bin/env node
// ============================================================================
// scripts/shipped.mjs · ARSENAL AI FC — THE OUTPUT SENSOR (artifacts, not hours)
// ----------------------------------------------------------------------------
// WHAT:  Every accountability number in this organism measures PRESENCE — Building
//   %, minutes, rep counts, "on track: no". All of it answers "did the camera see
//   him?". None of it answers "does something exist now that did not exist this
//   morning?". SYSTEM_METACOGNITION.md §0 finding 2: the one live accountability
//   signal is time-in-app; nothing measures shipped output. The sharp end showed up
//   on 30 Jul: when ActivityWatch went dark the sheet said "Building 0% — off
//   track", i.e. the machine accused him of a day it simply could not see.
//   This organ reads git and reports ARTIFACTS: commits, files touched, new files,
//   unpushed work, and the day's real events (a capsule locked, a matchday closed).
//   Deterministic. No LLM. No network beyond git's own local plumbing.
//
// WHAT IT IS HONEST ABOUT — stated here so no consumer overclaims:
//   Commits are not value. This measures that artifacts were PRODUCED, never that
//   they were good. It cannot see work done outside a watched repo (the FinOps repo
//   does not exist yet — sprint 1-08), and it will read a junk commit as output.
//   It is a second witness beside the time camera, not a replacement judge.
//
// LAWS:
//   · SOLE WRITER of shipped.json. Touches no other organ's file, grades nothing.
//   · Fail-honest, never fail-quiet: an unreadable repo is reported as unreadable,
//     never as a zero. A zero and a blindness are different facts (that distinction
//     is the whole reason this organ exists).
//   · Empty-safe: no repos ⇒ status "awaiting_data", not a failure.
//
// WRITER OF: dressing-room/state/shipped.json
// READS:     git (local, read-only) · shipped_config.json (optional, machine-local)
//            · dressing-room/state/capsules/ + post_match/ for artifact events
// MODES: (default) write · show · selftest
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(join(__dirname, ".."));
const STATE_DIR = join(REPO_ROOT, "dressing-room", "state");
const CFG_PATH  = join(STATE_DIR, "shipped_config.json");
const OUT       = join(STATE_DIR, "shipped.json");

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const localDate = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

// ---------------------------------------------------------------------------
// PURE CORE — git's output is parsed by pure functions so the selftest never
// needs a repo, a clock, or a network. (The organism's own rule: prove the maths
// on fixtures, then let the shell be the only untested part.)
// ---------------------------------------------------------------------------

// `git log --pretty=format:C%x09%H%x09%aI%x09%s --numstat` emits, per commit:
//   C<TAB>sha<TAB>iso-date<TAB>subject
//   adds<TAB>dels<TAB>path      (repeated; "-" for binary)
export function parseGitLog(raw) {
  const commits = [];
  let cur = null;
  for (const line of String(raw || "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    if (line.startsWith("C\t")) {
      const [, sha, date, ...rest] = line.split("\t");
      cur = { sha: (sha || "").slice(0, 8), date: date || null, subject: rest.join("\t") || "", files: [], insertions: 0, deletions: 0 };
      commits.push(cur);
      continue;
    }
    if (!cur) continue;                       // numstat before any commit header = ignore
    const [a, d, ...pathParts] = line.split("\t");
    const path = pathParts.join("\t");
    if (!path) continue;
    cur.files.push(path);
    if (a !== "-") cur.insertions += Number(a) || 0;   // "-" = binary, counted as a file only
    if (d !== "-") cur.deletions += Number(d) || 0;
  }
  return commits;
}

// Roll commits up into the day's honest picture. `subjects` are kept SHORT and
// capped — this file is gitignored, but a log is not a diary.
export function summarise(commits, newFiles = []) {
  const files = new Set();
  let insertions = 0, deletions = 0;
  for (const c of commits) {
    c.files.forEach(f => files.add(f));
    insertions += c.insertions; deletions += c.deletions;
  }
  return {
    commits: commits.length,
    files_touched: files.size,
    insertions, deletions,
    new_files: newFiles.length,
    subjects: commits.slice(0, 8).map(c => String(c.subject).slice(0, 80)),
  };
}

// The verdict this organ is allowed to state. Deliberately coarse: it answers
// "did anything get made today", never "was it good".
export function shippedVerdict(totals, reposDark) {
  if (reposDark) return { shipped: null, verdict: "unreadable", why: "no repo could be read — this is blindness, not a zero" };
  if (!totals) return { shipped: null, verdict: "awaiting_data", why: "no repo configured yet" };
  const made = totals.commits > 0 || totals.new_files > 0;
  return {
    shipped: made,
    verdict: made ? "shipped" : "nothing_committed",
    why: made
      ? `${totals.commits} commit(s), ${totals.files_touched} file(s), +${totals.insertions}/-${totals.deletions}`
      : "no commit landed today — output is not the only kind of work, but none was recorded here",
  };
}

// ---------------------------------------------------------------------------
// SHELL — the only untested layer, kept as thin as possible and always guarded.
// ---------------------------------------------------------------------------
function git(repo, args) {
  return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 15000 });
}

function readRepo(repo, day) {
  const since = `${day} 00:00:00`, until = `${day} 23:59:59`;
  try {
    const raw = git(repo, ["log", `--since=${since}`, `--until=${until}`, "--pretty=format:C%x09%H%x09%aI%x09%s", "--numstat"]);
    const commits = parseGitLog(raw);
    let newFiles = [];
    try {
      newFiles = git(repo, ["log", `--since=${since}`, `--until=${until}`, "--diff-filter=A", "--name-only", "--pretty=format:"])
        .split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      newFiles = [...new Set(newFiles)];
    } catch { /* older git / no commits → leave empty, never guess */ }
    let unpushed = null;
    try { unpushed = git(repo, ["log", "@{u}..HEAD", "--oneline"]).split(/\r?\n/).filter(s => s.trim()).length; }
    catch { unpushed = null; }              // no upstream configured — unknown, not zero
    return { repo, ok: true, ...summarise(commits, newFiles), unpushed };
  } catch (e) {
    return { repo, ok: false, error: e?.code || e?.message || String(e) };
  }
}

// Artifact events the bus itself can prove — the non-git half of "something exists
// now that did not this morning".
function artifactEvents(day) {
  const events = [];
  const capsDir = join(STATE_DIR, "capsules");
  if (existsSync(capsDir)) {
    for (const f of readdirSync(capsDir).filter(x => x.endsWith(".json"))) {
      const c = readJson(join(capsDir, f));
      if (c && c.lockedOn === day) events.push({ kind: "capsule_locked", what: c.id || f });
      if (c && Array.isArray(c.reJirahDone) && c.reJirahDone.includes(day)) events.push({ kind: "rejirah_served", what: c.id || f });
    }
  }
  const pmDir = join(STATE_DIR, "post_match");
  if (existsSync(pmDir) && readdirSync(pmDir).some(f => f.includes(day))) events.push({ kind: "matchday_closed", what: day });
  return events;
}

function loadRepos(cfgPath = CFG_PATH) {
  const j = readJson(cfgPath);
  const list = j && Array.isArray(j.repos) ? j.repos.filter(r => typeof r === "string" && r.trim()) : [];
  // default: the organism's own repo. The FinOps repo joins this list the day it
  // exists (sprint 1-08) — one line in shipped_config.json, no code change.
  return list.length ? list : [REPO_ROOT];
}

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  try { writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n"); renameSync(tmp, path); }
  catch (e) { try { if (existsSync(tmp)) rmSync(tmp, { force: true }); } catch {} throw e; }
}

function build(day = localDate(), repos = loadRepos()) {
  const per = repos.map(r => readRepo(r, day));
  const live = per.filter(r => r.ok);
  const dark = per.filter(r => !r.ok);
  const totals = live.length ? live.reduce((t, r) => ({
    commits: t.commits + r.commits,
    files_touched: t.files_touched + r.files_touched,
    insertions: t.insertions + r.insertions,
    deletions: t.deletions + r.deletions,
    new_files: t.new_files + r.new_files,
    unpushed: r.unpushed === null ? t.unpushed : (t.unpushed || 0) + r.unpushed,
    subjects: [...t.subjects, ...r.subjects].slice(0, 8),
  }), { commits: 0, files_touched: 0, insertions: 0, deletions: 0, new_files: 0, unpushed: null, subjects: [] }) : null;
  const events = artifactEvents(day);
  const v = shippedVerdict(totals, live.length === 0 && per.length > 0);
  return {
    date: day,
    generated_at: new Date().toISOString(),
    status: live.length ? "ok" : (per.length ? "unreadable" : "awaiting_data"),
    dataOk: live.length > 0,                        // same envelope timeaudit uses — dark ≠ zero
    engine: "shipped-v1 (artifacts produced, never artifact quality)",
    repos: per,
    totals,
    artifact_events: events,
    ...v,
    line: live.length
      ? (v.shipped || events.length
        ? `shipped: ${totals.commits} commit(s)${totals.new_files ? `, ${totals.new_files} new file(s)` : ""}${events.length ? `, ${events.map(e => e.kind).join(" + ")}` : ""}.`
        : "kuch commit nahi hua aaj — jo bana woh yahan nahi dikha.")
      : "output sensor dark — koi repo padha nahi ja saka (yeh blindness hai, zero nahi).",
  };
}

// ---------------------------------------------------------------------------
function selftest() {
  let pass = 0, fail = 0;
  const assert = (d, c) => { if (c) { pass++; console.log("  ✓ " + d); } else { fail++; console.log("  ✗ " + d); } };

  const RAW = [
    "C\tabc1234567\t2026-07-30T10:00:00+05:30\tfix the pacer",
    "12\t3\tscripts/forge_session.mjs",
    "4\t0\tpackage.json",
    "C\tdef7654321\t2026-07-30T12:00:00+05:30\tadd the bridge",
    "300\t0\tscripts/capsule_bridge.mjs",
    "-\t-\tarsenal_ai_fc_squad.png",
  ].join("\n");

  const commits = parseGitLog(RAW);
  assert("two commits parsed with short shas + subjects",
    commits.length === 2 && commits[0].sha === "abc12345" && commits[1].subject === "add the bridge");
  assert("numstat rolls into the right commit", commits[0].insertions === 16 && commits[0].deletions === 3);
  assert("a BINARY file counts as a file but adds no fake line count",
    commits[1].files.length === 2 && commits[1].insertions === 300 && commits[1].deletions === 0);
  assert("numstat before any commit header is ignored, never crashed on",
    parseGitLog("5\t5\tstray.txt").length === 0);
  assert("EMPTY-SAFE — no output ⇒ no commits", parseGitLog("").length === 0 && parseGitLog(null).length === 0);
  assert("a path containing a TAB survives", parseGitLog("C\ts\td\tsub\n1\t1\tdir\twith\ttab.md")[0].files[0] === "dir\twith\ttab.md");

  const sum = summarise(commits, ["scripts/capsule_bridge.mjs"]);
  assert("files are de-duplicated across commits", sum.files_touched === 4 && sum.commits === 2);
  assert("insertions/deletions total across the day", sum.insertions === 316 && sum.deletions === 3);
  assert("new files are counted separately from touched files", sum.new_files === 1);
  assert("subjects are capped and truncated (a log is not a diary)",
    summarise(Array.from({ length: 20 }, (_, i) => ({ files: [], insertions: 0, deletions: 0, subject: "x".repeat(200) + i })), []).subjects.length === 8
    && summarise([{ files: [], insertions: 0, deletions: 0, subject: "y".repeat(200) }], []).subjects[0].length === 80);

  // THE DISTINCTION THIS ORGAN EXISTS FOR
  const dark = shippedVerdict(null, true);
  assert("BLINDNESS IS NOT A ZERO — unreadable repos report null, never shipped:false",
    dark.shipped === null && dark.verdict === "unreadable" && /blindness, not a zero/.test(dark.why));
  const quiet = shippedVerdict({ commits: 0, files_touched: 0, insertions: 0, deletions: 0, new_files: 0 }, false);
  assert("a readable repo with nothing in it IS a real zero, stated without a verdict on him",
    quiet.shipped === false && quiet.verdict === "nothing_committed" && !/lazy|fail/i.test(quiet.why));
  const made = shippedVerdict({ commits: 2, files_touched: 4, insertions: 316, deletions: 3, new_files: 1 }, false);
  assert("commits OR new files count as shipped", made.shipped === true && /2 commit/.test(made.why));
  assert("new files alone count, with zero commits (a file written is output too)",
    shippedVerdict({ commits: 0, files_touched: 0, insertions: 0, deletions: 0, new_files: 3 }, false).shipped === true);
  assert("no repos configured ⇒ awaiting_data, not a failure",
    shippedVerdict(null, false).verdict === "awaiting_data");

  // the live wiring, exercised for real against this repo — it must never throw
  const live = build(localDate());
  assert("LIVE — reads this repo without throwing and reports dataOk honestly",
    typeof live.dataOk === "boolean" && live.repos.length >= 1 && typeof live.line === "string");
  assert("LIVE — an unreadable path is reported as unreadable, never as 0 commits",
    (() => { const b = build("2026-07-30", ["__no_such_repo__"]); return b.status === "unreadable" && b.shipped === null && b.repos[0].ok === false; })());
  assert("the emitted envelope matches timeaudit's dataOk contract (dark ≠ zero downstream)",
    "dataOk" in live && "status" in live && "line" in live);

  console.log(`\nshipped selftest: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

// ---------------------------------------------------------------------------
function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") return selftest();
  const out = build();
  if (mode === "show") { console.log(JSON.stringify(out, null, 2)); return; }
  writeAtomic(OUT, out);
  console.log(`shipped: ${out.verdict} · ${out.totals ? `${out.totals.commits} commit(s), ${out.totals.files_touched} file(s), ${out.totals.new_files} new` : "no data"} · ${out.artifact_events.length} artifact event(s) → ${OUT}`);
  console.log(`  ${out.line}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { build };
