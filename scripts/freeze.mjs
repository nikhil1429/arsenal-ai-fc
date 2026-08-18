#!/usr/bin/env node
// ============================================================================
// freeze.mjs · ARSENAL AI FC — THE FREEZE GUARD (OVERHAUL Block 8, §16, 18 Aug 2026)
//   Writes NOTHING. Owns no state file. Reads FREEZE.md, the git index and git log.
// ----------------------------------------------------------------------------
// WHY (his words, 18 Aug 2026): "i want to use it from now to study and not fix it.
// i am tired of wasting my time in fixing it." Blocks 0–7 rebuilt the organism; from
// the commit that lands FREEZE.md, the organism is FROZEN: no new organ, no
// constitution paragraph, no schedule change without a card he answered — CHANGES
// RIDE CARDS. A law is a code path (L4), so the freeze is this file, wired twice:
//
//   1. THE GUARD — hooks/commit-msg → `node scripts/freeze.mjs guard <msgfile>`.
//      A commit whose STAGED files touch a GUARDED path (tracked files under
//      scripts/ · hooks/ · setup/ — the constitution builder lives in scripts/dugout.mjs)
//      is REFUSED unless its message carries a card id (`c<digits>`, the card he
//      answered — captains_call.mjs numbers them) or the literal `freeze-exempt:<why>`.
//      Guard, not gate: `git commit --no-verify` skips every hook, and nothing here
//      pretends otherwise — which is exactly why there is a second layer.
//      (Why commit-msg and not pre-commit: git runs pre-commit BEFORE the message
//      exists — `-m` or editor, either way the text is only on disk at commit-msg.
//      The archive tripwire stays on pre-commit, untouched; this LAYERS beside it.)
//   2. THE WATCH — watchman.mjs reads `status()` nightly: every commit SINCE THE
//      FREEZE (the commit that added FREEZE.md) that touched a guarded path without a
//      card id or an exemption is RED `freeze-broken`, sha named. A --no-verify commit
//      or a commit from a machine without the hook installed is caught here, the next
//      night, by name.
//
// FREEZE.md is the switch. Absent ⇒ both layers are silent (the guard prints one line
// and exits 0). Present ⇒ armed. Removing FREEZE.md is itself a change under a
// guarded-adjacent path a human must make on purpose; git log keeps the record.
//
// WHAT IS NOT GUARDED (deliberately): dressing-room/ (state moves every minute) ·
// docs/ and *.md at the root and in learning-layer/ (canon corrections are not organs) ·
// .claude/skills/ (a skill is prose the sitting reads; the sitting brain is the organ) ·
// package.json (a suite entry rides with its organ's carded commit anyway).
//
// LAWS: read-only · exit codes are the whole API (0 pass · 1 refuse · 2 misuse) ·
//   never `--no-verify`, never edits a message · the selftest builds a THROWAWAY git
//   repo under os.tmpdir() and never touches this repo's index or hooks.
// WHO ELSE COULD ACT ON THIS OUTPUT? hooks/commit-msg (the guard) · watchman.mjs
//   (RED freeze-broken) · state.mjs could print "frozen since <date>" (not wired; a note).
// CLI: node scripts/freeze.mjs [guard <msgfile>|status [--json]|selftest]
// ============================================================================
import { readFileSync, existsSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, "..");
export const FREEZE_FILE = "FREEZE.md";

// The three guarded roots. A tracked file under any of them is an ORGAN, a HOOK or a
// SCHEDULE — the three things the freeze names. Compared repo-relative, forward slashes.
export const GUARDED = ["scripts/", "hooks/", "setup/"];
// A card id (`c59`, `c104`) or an explicit exemption with a reason. Word-bounded so
// "c1" inside "sec1" or a sha does not pass; the reason after the colon must be non-empty.
export const CARD_RE = /(?:^|[\s(\[,;:—·-])c\d{1,5}(?=$|[\s)\],;:.—·-])/i;
export const EXEMPT_RE = /freeze-exempt:\s*\S+/i;

const git = (args, cwd = ROOT) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

export const isGuarded = (rel) => { const p = String(rel).replace(/\\/g, "/"); return GUARDED.some((g) => p.startsWith(g)); };
export const messageAllows = (msg) => CARD_RE.test(String(msg)) || EXEMPT_RE.test(String(msg));
export const frozen = (cwd = ROOT) => existsSync(join(cwd, FREEZE_FILE));

// ── THE GUARD (commit-msg) ───────────────────────────────────────────────────
// Reads the message file git hands the hook and the STAGED file list. Returns a
// verdict; `main` maps it to an exit code so the hook can `exec` this file.
export function guard({ msgFile, cwd = ROOT } = {}) {
  if (!frozen(cwd)) return { armed: false, ok: true, why: `${FREEZE_FILE} absent — the freeze is not in force; nothing guarded` };
  let msg = "";
  try { msg = readFileSync(msgFile, "utf8"); } catch (e) { return { armed: true, ok: false, misuse: true, why: `cannot read the commit message file (${msgFile}): ${e.code || e.message}` }; }
  // strip comment lines git adds to the template
  const text = msg.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");
  let staged = [];
  try { staged = git(["diff", "--cached", "--name-only", "--diff-filter=ACMRD"], cwd).split("\n").map((s) => s.trim()).filter(Boolean); }
  catch (e) { return { armed: true, ok: false, misuse: true, why: `git diff --cached failed: ${String(e.message).slice(0, 120)}` }; }
  const touched = staged.filter(isGuarded);
  if (!touched.length) return { armed: true, ok: true, touched, why: "no guarded path staged" };
  if (messageAllows(text)) return { armed: true, ok: true, touched, carded: CARD_RE.test(text), exempt: EXEMPT_RE.test(text), why: CARD_RE.test(text) ? "card id present" : "freeze-exempt present" };
  return { armed: true, ok: false, touched, why: `THE FREEZE (FREEZE.md): ${touched.length} guarded file(s) staged — ${touched.slice(0, 6).join(", ")}${touched.length > 6 ? ", …" : ""} — and the message carries no card id (c<n>, the card he answered) and no \`freeze-exempt:<why>\`. Changes ride cards. Add one, or state the exemption and its reason.` };
}

// ── THE WATCH (status) ───────────────────────────────────────────────────────
// Every commit since the freeze commit that touched a guarded path; those whose
// message has neither a card nor an exemption are BROKEN. Read-only.
export function status({ cwd = ROOT, max = 400 } = {}) {
  if (!frozen(cwd)) return { armed: false, since: null, commits: [], broken: [], carded: 0, exempt: 0 };
  let since = null;
  try { since = git(["log", "--diff-filter=A", "--format=%H", "--", FREEZE_FILE], cwd).trim().split("\n").filter(Boolean).pop() || null; } catch { since = null; }
  if (!since) return { armed: true, since: null, uncommitted: true, commits: [], broken: [], carded: 0, exempt: 0, why: `${FREEZE_FILE} exists but is not yet committed — the freeze arms the guard now and the watch from its first commit` };
  let shas = [];
  try { shas = git(["log", `${since}..HEAD`, `--max-count=${max}`, "--format=%H"], cwd).split("\n").map((s) => s.trim()).filter(Boolean); } catch { shas = []; }
  const commits = [];
  // Two reads per commit, on purpose: this repo's commit BODIES run to paragraphs and
  // name paths mid-sentence, so a single `--name-only` walk cannot tell a body line
  // from a file line. `%B` gives the whole message; `--name-only --format=` gives only files.
  for (const sha of shas) {
    let meta = "", files = [];
    try { meta = git(["show", "-s", "--format=%aI%x1f%s%x1f%B", sha], cwd); } catch { continue; }
    try { files = git(["show", "--name-only", "--format=", sha], cwd).split("\n").map((s) => s.trim()).filter(Boolean); } catch { files = []; }
    const [at, subject, body] = meta.split("\x1f");
    const msg = String(body || subject || "");
    const touched = files.filter(isGuarded);
    if (!touched.length) continue;
    const allowed = messageAllows(msg);
    commits.push({ sha, at, subject: String(subject).slice(0, 100), touched: touched.length, files: touched.slice(0, 8), carded: CARD_RE.test(msg), exempt: EXEMPT_RE.test(msg), allowed });
  }
  const broken = commits.filter((c) => !c.allowed);
  return { armed: true, since, commits, broken, carded: commits.filter((c) => c.carded).length, exempt: commits.filter((c) => c.exempt).length };
}

// ── SELFTEST — a throwaway repo, the guard FIRES on a planted commit, stays silent on a carded one ──
let pass = 0, fail = 0; const fails = [];
const assert = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; fails.push({ n, d }); console.log(`  FAIL ${n}${d ? `\n         ${d}` : ""}`); } };

function selftest() {
  console.log("=== freeze.mjs selftest — the freeze is a code path, proven in a throwaway repo ===\n");
  // pure halves
  assert("guarded: scripts/ hooks/ setup/ are guarded; docs, dressing-room, learning-layer, skills, root .md are not",
    isGuarded("scripts/brain.mjs") && isGuarded("hooks/pre-commit") && isGuarded("setup/INSTALL_TASKS.ps1") && isGuarded("scripts\\dugout.mjs")
    && !isGuarded("docs/archive/x.md") && !isGuarded("dressing-room/state/x.json") && !isGuarded("learning-layer/PROJECT_OS.md") && !isGuarded(".claude/skills/forge/SKILL.md") && !isGuarded("CLAUDE.md") && !isGuarded("package.json"));
  assert("message: a card id passes (c59 · (c104) · 'card c7:'), an exemption with a reason passes", messageAllows("gate wake lane — c59") && messageAllows("fix (c104)") && messageAllows("card c7: done") && messageAllows("BLOCK 9 measure · freeze-exempt:the-block-that-measures"));
  assert("message: a bare change refuses; a sha or 'sec1' is not a card; an empty exemption refuses",
    !messageAllows("tidy the watchman") && !messageAllows("fix 3c12ab9") && !messageAllows("sec1 tweak") && !messageAllows("freeze-exempt:") && !messageAllows("freeze-exempt: "));

  // a THROWAWAY repo — never this one
  const tmp = mkdtempSync(join(tmpdir(), "arsenal-freeze-"));
  const cwd = tmp;
  const g = (a) => git(a, cwd);
  const w = (rel, txt) => { const p = join(cwd, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, txt); };
  const msgFile = join(tmp, "MSG");
  const tryGuard = (rel, txt, msg) => { w(rel, txt); g(["add", "-A"]); writeFileSync(msgFile, msg); return guard({ msgFile, cwd }); };
  const commit = (msg) => g(["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", msg]);
  try {
    g(["init", "-q"]);
    // 1) BEFORE the freeze: nothing is guarded
    let r = tryGuard("scripts/x.mjs", "// x\n", "no card, no exemption, no freeze yet");
    assert("UNFROZEN — without FREEZE.md the guard is silent (armed:false, ok:true)", r.armed === false && r.ok === true, JSON.stringify(r));
    commit("seed");
    // 2) the freeze lands
    w(FREEZE_FILE, "# FREEZE\nchanges ride cards\n"); g(["add", "-A"]); commit("BLOCK 8 · freeze-exempt:the-commit-that-freezes");
    assert("FROZEN — the guard is armed once FREEZE.md exists", guard({ msgFile: (writeFileSync(msgFile, "x"), msgFile), cwd }).armed === true);
    // 3) a PLANTED bare change under scripts/ → REFUSED
    r = tryGuard("scripts/x.mjs", "// x changed\n", "tidy x");
    assert("PLANTED — a bare edit to scripts/x.mjs with no card id is REFUSED (the DoD)", r.ok === false && r.touched && r.touched.includes("scripts/x.mjs") && /no card id/.test(r.why), JSON.stringify(r));
    // 4) the same change with a CARD → passes
    writeFileSync(msgFile, "tidy x — his word on card c59");
    r = guard({ msgFile, cwd });
    assert("CARDED — the same staged change with `c59` in the message PASSES", r.ok === true && r.carded === true, JSON.stringify(r));
    // 5) with an EXEMPTION and a reason → passes; empty reason → refused
    writeFileSync(msgFile, "hotfix · freeze-exempt:the-daemon-was-down-and-he-was-sitting");
    assert("EXEMPT — `freeze-exempt:<why>` PASSES", guard({ msgFile, cwd }).ok === true);
    writeFileSync(msgFile, "hotfix · freeze-exempt:");
    assert("…and an EMPTY exemption does not (a reason is the price)", guard({ msgFile, cwd }).ok === false);
    // 6) an unguarded path with no card → passes even while frozen
    g(["reset", "-q"]); g(["checkout", "-q", "--", "."]);   // drop the planted scripts/x.mjs edit entirely
    r = tryGuard("docs/note.md", "note\n", "docs only");
    assert("UNGUARDED — a docs/ change needs no card while frozen", r.ok === true && r.touched.length === 0, JSON.stringify(r));
    g(["reset", "-q"]); rmSync(join(cwd, "docs"), { recursive: true, force: true });
    // 7) THE WATCH: commit a broken change with --no-verify semantics (no hook installed here anyway) → status names it
    w("scripts/x.mjs", "// sneaked in\n"); g(["add", "-A"]); commit("sneaked past the hook");
    w("scripts/y.mjs", "// carded\n"); g(["add", "-A"]); commit("carded change c12");
    w("hooks/z", "z\n"); g(["add", "-A"]); commit("hook · freeze-exempt:hotfix");
    w("README.md", "readme\n"); g(["add", "-A"]); commit("readme only, no card");
    const s = status({ cwd });
    assert("WATCH — status names the ONE broken commit since the freeze (sneaked), not the carded, the exempt or the docs-only one",
      s.armed && s.broken.length === 1 && /sneaked/.test(s.broken[0].subject) && s.commits.length === 3 && s.carded === 1 && s.exempt === 1, JSON.stringify({ broken: s.broken.map((b) => b.subject), n: s.commits.length, carded: s.carded, exempt: s.exempt }));
    assert("…and the freeze commit itself is the anchor (`since` = the commit that ADDED FREEZE.md)", !!s.since && /freeze/.test(g(["log", "-1", "--format=%s", s.since])));
    // 8) misuse: unreadable message file ⇒ misuse, never a silent pass
    r = guard({ msgFile: join(tmp, "NOPE"), cwd });
    assert("MISUSE — an unreadable message file is a refusal with misuse:true, never a pass", r.ok === false && r.misuse === true);
  } finally { rmSync(tmp, { recursive: true, force: true }); }

  // the LIVE tree: is the freeze in force here, and is the hook installed?
  const live = status();
  const hookInstalled = existsSync(join(ROOT, ".git", "hooks", "commit-msg")) && /freeze\.mjs guard/.test((() => { try { return readFileSync(join(ROOT, ".git", "hooks", "commit-msg"), "utf8"); } catch { return ""; } })());
  console.log(`\n  live: ${live.armed ? `FROZEN since ${live.since ? live.since.slice(0, 7) : "(FREEZE.md uncommitted)"} · ${live.commits.length} guarded commit(s) since · ${live.broken.length} broken` : "not frozen (FREEZE.md absent)"} · commit-msg hook ${hookInstalled ? "INSTALLED" : "NOT installed (setup/INSTALL_ARCHIVE.ps1 copies it)"}`);
  assert("hooks/commit-msg (tracked) execs this guard", existsSync(join(ROOT, "hooks", "commit-msg")) && /freeze\.mjs guard/.test(readFileSync(join(ROOT, "hooks", "commit-msg"), "utf8")));

  console.log(`\nfreeze: ${pass} passed, ${fail} failed`);
  if (fail) for (const f of fails) console.log(`  · ${f.n}${f.d ? `\n      ${f.d}` : ""}`);
  process.exit(fail ? 1 : 0);
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
function main() {
  const mode = (process.argv[2] || "status").toLowerCase();
  if (mode === "selftest") return selftest();
  if (mode === "guard") {
    const msgFile = process.argv[3];
    if (!msgFile) { console.error("freeze: guard needs the commit message file (git passes it to hooks/commit-msg)"); process.exit(2); }
    const r = guard({ msgFile });
    if (!r.armed) { console.log(`freeze: ${r.why}`); process.exit(0); }
    if (r.ok) { if (r.touched && r.touched.length) console.log(`freeze: ${r.touched.length} guarded file(s) — ${r.why}`); process.exit(0); }
    console.error(`\n✋ ${r.why}\n   (never --no-verify: the watchman names any commit that slips past, the next night, as RED freeze-broken)\n`);
    process.exit(r.misuse ? 2 : 1);
  }
  if (mode === "status") {
    const s = status();
    if (process.argv.includes("--json")) { console.log(JSON.stringify(s, null, 1)); return; }
    if (!s.armed) { console.log("freeze: NOT in force (FREEZE.md absent)"); return; }
    console.log(`freeze: IN FORCE since ${s.since ? s.since.slice(0, 7) : "(FREEZE.md not yet committed)"} · ${s.commits.length} guarded commit(s) since · carded ${s.carded} · exempt ${s.exempt} · BROKEN ${s.broken.length}`);
    for (const b of s.broken) console.log(`  ✗ ${b.sha.slice(0, 7)} ${b.at.slice(0, 16)} ${b.subject} — ${b.touched} guarded file(s): ${b.files.join(", ")}`);
    return;
  }
  console.log("freeze: guard <msgfile> | status [--json] | selftest");
  process.exit(2);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
