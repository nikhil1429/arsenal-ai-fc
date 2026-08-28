#!/usr/bin/env node
// ============================================================================
// audit.mjs · ARSENAL AI FC — THE FRONT DOOR (12 Aug 2026)
//   SOLE WRITER of dressing-room/state/audit_ledger.jsonl
// ----------------------------------------------------------------------------
// THE ONE RULE THIS ORGAN EXISTS TO OBEY: HE MUST NOT TRIAGE.
// There are already 27 cards waiting on him. An audit that produces 200 findings
// and cards them all reproduces that exact failure at 8× scale. So this prints
// ONE HEALTH NUMBER and "N rulings waiting" — never a list — and deals AT MOST
// ONE card. Auto-fix is the default; a card is the exception.
//
// PIPELINE
//   measure → fingerprint sha1(rule + file + normalised subject)
//           → dedupe against the ledger (an OPEN finding NEVER re-fires)
//           → gate (the four-condition test) → apply → cluster by root cause
//           → rank → deal ONE
//
// THE FOUR-CONDITION GATE. A finding is auto-fixed only if ALL FOUR hold:
//   1. DERIVABLE        the correct value is mechanically computable
//   2. ORACLE-VERIFIABLE a NEW assertion is RED before and GREEN after
//   3. REVERSIBLE       one commit, `git revert`-able, destroys no data
//   4. NON-SEMANTIC     it does not change what the organism SAYS to him or
//                       DECIDES on his behalf
// If any one fails it is a RULING. That is not a formality — measured today,
// most findings in this repo FAIL condition 1 or 4, and saying so honestly is
// better than inventing a fix. Q5 (a header claiming SOLE WRITER while the IR
// disagrees) is the sharpest example: "fixing" the comment to match the code
// would PAPER OVER a real single-writer breach. Harmonising a disagreement is
// how an audit becomes the bug.
//
// RULE ZERO, ENFORCED IN CODE: THE FIXER NEVER EDITS dressing-room/state/.
// Live daemons own those files. Any finding whose repair needs a state edit is a
// RULING by definition. (This organ writes its OWN ledger there — that is the
// audit ORGAN acting as an owner, not the FIXER acting on someone else's lane,
// and `assertNotStateEdit` refuses everything else.)
//
// NEVER AUTOMATED, EVER: canon .md BODIES (CLAUDE.md · THE_GAFFER.md ·
// OPS_STATE.md · MASTERPLAN · THE_MANAGER__Master_Prompt.md) — bug class 4 was
// CAUSED by an automated doc sweep · .gitignore · setup/INSTALL_TASKS.ps1 ·
// .claude/settings.json hooks · the billing guard · anything medical · any patch
// containing a NUMBER this repo has not already ruled on (a threshold, a budget
// or a cadence is a free parameter and therefore HIS) · deletion of code or a
// feature (a dead read may be an UNFINISHED feature — that is exactly what
// rejirah_state.json was) · "harmonising" any documented deliberate exception.
//
// CARD CAPS, IN CODE not in prose: ONE open card at a time · at most TWO dealt
// per 7 days · every card carries a TTL and a STATED DEFAULT, so his silence is
// a logged answer rather than a stall.
//
// LAWS: never pushes (the glance-before-push stays his) · never re-fires an open
//   finding · states what it did NOT measure.
// WHO ELSE COULD ACT ON THIS OUTPUT? captains_call.mjs (the one card), watchman
//   (the health number), organism_test (asserts the museum + the caps). Wired.
// CLI: node scripts/audit.mjs [run|report|fix|canon|ledger|docs|docexec|quarantine|selftest] [--deep] [--no-canon]
//   canon (Block 8, 18 Aug 2026) = the ROOT CANON executed: every cited path, grep
//   claim and `node scripts/X.mjs verb` in CLAUDE.md · THE_GAFFER.md · ARCHIVE__DAY_ONE_SPEC.md ·
//   OPS_STATE.md · THE_DAILY_LOOP.md · README.md · FREEZE.md · the learning-layer canon,
//   run inside the audit sandbox; exit 1 iff a claim there is dead. docs/archive/ = RECORDS.
// ============================================================================
import { readFileSync, writeFileSync, appendFileSync, existsSync, readdirSync, mkdirSync, statSync, unlinkSync, openSync, closeSync } from "node:fs";
import { join, dirname, basename, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { subjectsOf } from "./registry.mjs";   // S10 #9 — the claim-carrying file kinds are ROWS now

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const STATE_DIR = join(ROOT, "dressing-room", "state");
const LEDGER = join(STATE_DIR, "audit_ledger.jsonl");
const LOCK = join(STATE_DIR, "audit.lock");
const IR_PATH = join(STATE_DIR, "xray_graph.json");

let pass = 0, fail = 0; const fails = [];
const assert = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; fails.push({ n, d }); console.log(`  FAIL ${n}${d ? `\n         ${d}` : ""}`); } };

const sh = (cmd, args, opts = {}) => { try { return execFileSync(cmd, args, { cwd: ROOT, encoding: "utf8", timeout: 120000, ...opts }); } catch (e) { return (e.stdout || "") + (e.stderr || ""); } };
// ONE read site, ONE exists site for every COMPUTED doc path (Block 8, 18 Aug 2026): the
// xray sink ratchet counts DISTINCT unfollowable sites per organ, so every doc-corpus
// read funnels through these two rather than each lane paying its own sink.
const readAt = (p) => readFileSync(p, "utf8");
const existsAt = (p) => existsSync(p);
export const fingerprint = (rule, file, subject) => createHash("sha1").update(`${rule}|${file}|${String(subject).trim().toLowerCase()}`).digest("hex").slice(0, 16);

// ── THE LEDGER (sole writer) ─────────────────────────────────────────────────
export const ledger = () => (existsSync(LEDGER) ? readFileSync(LEDGER, "utf8").split("\n").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : []);
function append(row) { mkdirSync(STATE_DIR, { recursive: true }); appendFileSync(LEDGER, JSON.stringify(row) + "\n"); }

// ── RULE ZERO, IN CODE ───────────────────────────────────────────────────────
const STATE_RE = /dressing-room[\\/]state[\\/]/i;
const CANON = ["CLAUDE.md", "THE_GAFFER.md", "OPS_STATE.md", "docs/archive/ARSENAL_AI_FC_MASTERPLAN.md", "docs/archive/THE_MANAGER__Master_Prompt.md", "ARSENAL_AI_FC_MASTERPLAN.md", "THE_MANAGER__Master_Prompt.md"];   // Block 1 (18 Aug 2026 §13): two canon bodies moved to docs/archive/; both spellings kept so a stray copy at the root is still NEVER automated
const NEVER_TOUCH = [".gitignore", "setup/INSTALL_TASKS.ps1", ".claude/settings.json", "package-lock.json"];
export function assertFixable(path) {
  const p = String(path).replace(/\\/g, "/");
  if (STATE_RE.test(p)) throw new Error(`audit: RULE ZERO — the fixer never edits dressing-room/state/ (${p}). Live daemons own it; this is a RULING.`);
  if (CANON.includes(basename(p))) throw new Error(`audit: REFUSING — ${basename(p)} is CANON. Propose a diff; never write. Bug class 4 was caused by an automated doc sweep.`);
  if (NEVER_TOUCH.some((n) => p.endsWith(n))) throw new Error(`audit: REFUSING — ${p} is on the never-automate list.`);
  return true;
}
// A patch that introduces a number this repo has not already ruled on is a free
// parameter, and free parameters are HIS.
export function assertNoNewNumber(before, after) {
  const nums = (s) => new Set((String(s).match(/\b\d[\d._]*\b/g) || []));
  const b = nums(before);
  for (const x of nums(after)) if (!b.has(x)) throw new Error(`audit: REFUSING — the patch introduces the number ${x}, which is a free parameter and therefore a RULING.`);
  return true;
}

// ── PRECONDITIONS, fail-closed ───────────────────────────────────────────────
function preconditions({ allowDirty = false } = {}) {
  const notes = [];
  const dirty = sh("git", ["status", "--porcelain"]).trim();
  if (dirty && !allowDirty) throw new Error(`audit: REFUSING — the working tree is dirty. A fixer that commits on top of unrelated changes cannot be reverted per finding.\n${dirty.split("\n").slice(0, 8).join("\n")}`);
  const head = sh("git", ["rev-parse", "HEAD"]).trim();
  // AN OPEN FORGE SESSION IS A HARD REFUSE. He may be mid-study, and the one
  // thing this audit must never do is interrupt the thing the organism is for.
  // ⚠ READ THE SHAPE OFF DISK. This checked `j.open === true`, and
  // forge_session.json HAS NO `open` FIELD — it never has. Its real keys are
  // concept · started_at · step · axes_done · closed_at. So the "HARD REFUSE"
  // that exists to keep the audit from interrupting him mid-study could never
  // fire once, and the guard read as present while being structurally dead. The
  // repo's own law, broken by the file that quotes it.
  const fs_ = join(STATE_DIR, "forge_session.json");
  if (existsSync(fs_)) {
    let open = false;
    try {
      const j = JSON.parse(readFileSync(fs_, "utf8"));
      open = !!(j && j.concept && !j.closed_at);
    } catch { open = false; }
    if (open) throw new Error("audit: REFUSING — a forge session is OPEN (a concept is started and not closed). He may be mid-study; the audit waits.");
  }
  return { head, dirty: !!dirty, notes };
}

// ── THE WORKTREE — the fixer NEVER edits the live tree ───────────────────────
// Shipped without this the first time, and it was the right thing to be called
// out on: the fixer applied four edits directly to the working tree, two of them
// wrong, and only a hand-read of the diff caught it. A worktree makes that
// physically impossible instead of merely regrettable — the live tree he studies
// from is untouched no matter how badly a rule misbehaves, and the branch is
// there to inspect, merge, or delete without a single `git revert`.
export function makeWorktree() {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").replace(/Z$/, "");
  const branch = `audit/autofix-${ts}`;
  const dir = join(ROOT, ".audit-worktrees", ts);
  mkdirSync(join(ROOT, ".audit-worktrees"), { recursive: true });
  const out = sh("git", ["worktree", "add", "-b", branch, dir, "HEAD"]);
  if (!existsSync(join(dir, "package.json"))) throw new Error(`audit: could not create the worktree — refusing to fall back to the live tree.\n${out}`);
  return {
    dir, branch,
    commit(msg) {
      sh("git", ["add", "-A"], { cwd: dir });
      sh("git", ["-c", "user.name=arsenal-audit", "-c", "user.email=audit@localhost", "commit", "-q", "-m", msg], { cwd: dir });
      return sh("git", ["rev-parse", "HEAD"], { cwd: dir }).trim();
    },
    // Left in place on purpose when it holds commits: a branch he can read is
    // worth more than a tidy tree. Removed only when nothing was written.
    cleanup(keep) {
      if (keep) return;
      sh("git", ["worktree", "remove", "--force", dir]);
      sh("git", ["branch", "-D", branch]);
    },
  };
}

function lock() {
  mkdirSync(STATE_DIR, { recursive: true });
  if (existsSync(LOCK)) {
    try {
      const j = JSON.parse(readFileSync(LOCK, "utf8"));
      const age = Date.now() - new Date(j.at).getTime();
      if (age < 30 * 60 * 1000) throw new Error(`audit: REFUSING — another fixer holds the lock (pid ${j.pid}, ${Math.round(age / 60000)}m old). ONE FIXER, EVER.`);
      unlinkSync(LOCK);   // stale-break at 30 minutes
    } catch (e) { if (/REFUSING/.test(e.message)) throw e; try { unlinkSync(LOCK); } catch { /* ignore */ } }
  }
  const fd = openSync(LOCK, "wx");
  writeFileSync(LOCK, JSON.stringify({ pid: process.pid, at: new Date().toISOString() }));
  closeSync(fd);
  return () => { try { unlinkSync(LOCK); } catch { /* ignore */ } };
}

// ============================================================================
// MEASUREMENT — every source, one finding shape
// ============================================================================
const F = (rule, file, subject, detail, opts = {}) => ({
  rule, file, subject, detail,
  fp: fingerprint(rule, file, subject),
  blast: opts.blast ?? 1,          // live readers affected
  silent: opts.silent ?? true,     // does the lane have any exit at all?
  autofix: opts.autofix || null,   // a function, or null ⇒ RULING
  why_ruling: opts.why_ruling || null,
});

export function measure(opts = {}) {
  const out = [];
  const skipped = [];
  const ir = existsSync(IR_PATH) ? JSON.parse(readFileSync(IR_PATH, "utf8")) : null;
  if (!ir) { skipped.push("xray IR absent — run `node scripts/xray.mjs build`"); return { out, skipped }; }

  // ── from xray ────────────────────────────────────────────────────────────
  const xq = sh(process.execPath, [join(HERE, "xray.mjs"), "q"]);
  let q = {};
  try { q = JSON.parse(xq); } catch { skipped.push("xray q did not return JSON"); }
  for (const f of q.Q1 || []) out.push(F("dead-read", f.path, f.readers.join(","), `read by ${f.readers.join(", ")}; NOTHING writes it and it is not on disk`, { blast: f.readers.length, why_ruling: "a dead read may be an UNFINISHED FEATURE, not dead code — that is exactly what rejirah_state.json was. Deleting or rewiring it is his call." }));
  for (const f of q.Q2 || []) out.push(F("two-writers", f.path, f.writers.join(","), `${f.writers.length} writers: ${f.writers.join(", ")} — the single-writer law`, { blast: f.writers.length, why_ruling: "which organ should own the file is a DESIGN decision. Harmonising it in code is how a documented deliberate exception gets 'repaired'." }));
  for (const f of q.Q3 || []) out.push(F("orphan-lane", f.path, f.writers.join(","), `written by ${f.writers.join(", ")}, read by NOBODY`, { blast: 0, why_ruling: "a lane with no reader may be a dedupe ledger read by its own owner (harvest_log.jsonl is exactly that and is NOT a violation), or a consumer nobody built yet." }));
  for (const f of q.Q4 || []) out.push(F("ghost-state", f.path, "on-disk", "on disk; no live code reads or writes it", { blast: 0, why_ruling: "deleting state is destructive and irreversible. His call, always." }));
  for (const f of q.Q5 || []) out.push(F("sole-writer-drift", f.path, f.declared_by, `header of ${f.declared_by} claims SOLE WRITER; the IR also sees ${f.undeclared.join(", ")}`, { blast: f.actual_writers.length, why_ruling: "the header may be RIGHT and the code WRONG. Editing the comment to match the code would paper over a real law breach — the audit becoming the bug." }));

  const vq = sh(process.execPath, [join(HERE, "xray.mjs"), "verbs"]);
  let v = {};
  try { v = JSON.parse(vq); } catch { skipped.push("xray verbs did not return JSON"); }
  for (const e of v.brokenEdges || []) out.push(F("broken-edge", e.callee, `${e.caller}:${e.verb}`, `${e.caller} invokes \`${e.verb}\`, which ${e.callee} does not dispatch — the call silently does the DEFAULT thing`, { blast: 2 }));
  for (const d of v.dangling || []) out.push(F("dangling-lane", d.path, d.writers.join(","), `writers reachable, readers NOT — the '27 dealt / 0 answerable' shape`, { blast: d.readers.length }));

  // ── from herd (§7a — a LIVE bug, not a hypothetical) ─────────────────────
  try {
    const hm = sh(process.execPath, [join(HERE, "herd.mjs"), "collisions"]);
    const h = JSON.parse(hm);
    for (const [sec, ts] of h.sameSecond || []) {
      if (ts.length < 2) continue;
      out.push(F("same-second-start", "setup/INSTALL_TASKS.ps1", sec, `${ts.length} tasks trigger at the SAME SECOND (${sec}): ${ts.map((t) => t.organ).join(", ")} — concurrent every day, with no mutex between them`, { blast: ts.length, why_ruling: "a cadence is a free parameter, and INSTALL_TASKS.ps1 is on the never-automate list." }));
    }
    const herdN = (h.herd || []).length;
    // Block 6 (18 Aug 2026): the DAY-KEY LAW is built (daykey.mjs); the herd's day-key half is now MEASURED,
    // not asserted — `herd risks` counts the once-a-slot/chain organs still deriving today from now().
    let dk = null; try { dk = JSON.parse(sh(process.execPath, [join(HERE, "herd.mjs"), "risks"])); } catch { }
    const dkRisks = dk && Number.isFinite(dk.risks) ? dk.risks : null;
    if (herdN) out.push(F("catch-up-herd", "setup/INSTALL_TASKS.ps1", "StartWhenAvailable", `${herdN} overnight tasks carry StartWhenAvailable=true, so on a laptop that sleeps they ALL fire at once, in arbitrary order, at the wrong hour — their DAY is now the slot's by the DAY-KEY LAW (daykey.mjs); ${dkRisks === null ? "day-key risks UNMEASURED this run" : `${dkRisks} wrong-day-key risk(s) remain`}`, { blast: dkRisks === null ? herdN : dkRisks, why_ruling: "the ORDER half is a schedule change (stagger, or a shared mutex, or dropping StartWhenAvailable) — free parameters, never-automate. The DAY half is code and is measured above." }));
    for (const c of h.contention || []) out.push(F("lost-update-risk", c.path, c.writers.join(","), `${c.writers.join(", ")} are ALL scheduled and all write this file. writeAtomic makes the clobber SILENT — rename is atomic, so nothing corrupts, nothing throws, and one write simply ceases to exist`, { blast: c.writers.length }));
  } catch { skipped.push("herd model unavailable (no live schedule and no installers)"); }

  // ── from treasury ────────────────────────────────────────────────────────
  try {
    const bad = JSON.parse(sh(process.execPath, [join(HERE, "treasury.mjs"), "meter"]));
    const lies = bad.filter((b) => b.kind !== "no-components");
    if (lies.length) out.push(F("meter-inconsistent", "dressing-room/state/brain_ledger.jsonl", "total_vs_parts", `${lies.length} row(s) whose total_tokens disagrees with the sum of its four components — the shape of both C1 faults`, { blast: 3 }));
    const rho = JSON.parse(sh(process.execPath, [join(HERE, "treasury.mjs"), "rho"]));
    for (const e of rho.filter((x) => x.rho === null || x.rho > 25 || x.rho === "Infinity" || !Number.isFinite(x.rho))) {
      out.push(F("boot-tax", "dressing-room/state/brain_ledger.jsonl", e.job, `ρ=${e.rho} — ${Math.round(e.weighted).toLocaleString("en-IN")} weighted for ${e.output.toLocaleString("en-IN")} output tokens across ${e.n} run(s). Paying to boot, not to think`, { blast: 1, why_ruling: "the repair is either a prompt change or a model change; both change what the organism SAYS, so both are his." }));
    }
  } catch { skipped.push("treasury unavailable"); }

  // ── from pulse (12 Aug 2026, ULTRACODE — the ◇≤T liveness law) ───────────
  // The FULL pulse (reconcile included): this is the DAILY half of the mutual
  // watch. The watchman's nightly probePulse runs --no-reconcile; this one
  // walks everything, so a dead WATCHMAN is caught HERE within a day (its
  // watcher-stale class) exactly as a dead audit is caught by the watchman's
  // probe. Liveness repairs are never mechanical — a lane that has never
  // produced needs either its producer fixed or a decision that it is dormant
  // — so every violation lands as a RULING, ranked by the readers it starves.
  try {
    const pj = JSON.parse(sh(process.execPath, [join(HERE, "pulse.mjs"), "json"]));
    if (pj.measurable) {
      for (const v of pj.violations || []) {
        out.push(F(`liveness-${v.class}`, "dressing-room/state", v.name,
          `${v.name}: ${v.detail || v.class}${v.consumers ? ` — ${v.consumers} wired reader(s) starving` : ""}${v.age_h ? ` (age ${v.age_h}h)` : ""}`,
          { blast: (v.consumers || 0) + (/never|watcher/.test(v.class) ? 3 : 1), why_ruling: "a dead lane needs its producer fixed or a ruling that it is dormant; neither is mechanically derivable, and the loudest class (NEVER) is precisely the one no assertion can invent a fix for." }));
      }
    }
  } catch { skipped.push("pulse unavailable — every ◇≤T obligation unverified this run"); }

  // ── from the docs (§8) ───────────────────────────────────────────────────
  // Block 8 (18 Aug 2026): docs/archive/ is a RECORD — its rot is COUNTED and
  // stated below, never a finding (see canonExec). Root canon weighs more than
  // any other doc: a dead claim there misdirects EVERY session that reads it.
  const doc = docClaims();
  const records = { deadPaths: 0, deadOrgans: 0, staleGreps: 0, staleCounts: 0 };
  const canonBlast = (rel) => (isRootCanon(rel) ? 3 : 0);
  for (const d of doc.deadPaths) {
    if (isRecord(d.doc)) { records.deadPaths++; continue; }
    out.push(F("doc-dead-path", d.doc, d.path, `cites a path that does not exist: ${d.path}`, { blast: canonBlast(d.doc), autofix: null, why_ruling: CANON.includes(basename(d.doc)) ? "CANON — propose a diff, never write." : "the path may have MOVED rather than vanished; picking the replacement is a judgement." }));
  }
  for (const d of doc.deadOrgans) {
    if (isRecord(d.doc)) { records.deadOrgans++; continue; }
    out.push(F("doc-dead-organ", d.doc, d.organ, `cites \`${d.organ}\`, which does not exist in scripts/`, { blast: canonBlast(d.doc) }));
  }

  // §8 EXECUTED: a cited command that returns NOTHING, and a count that no longer
  // holds. Both are STALE CANON, and both are findable ONLY by running the claim.
  try {
    const x = docExec();
    for (const g of x.grep_stale) {
      if (isRecord(g.doc)) { records.staleGreps++; continue; }
      out.push(F("doc-command-stale", g.doc, g.cmd,
        `the doc cites this as EVIDENCE and it ${g.kind === "grep-target-missing" ? "names a file that does not exist" : "matches NOTHING"}: ${g.cmd}`,
        { blast: canonBlast(g.doc), why_ruling: "the claim may be right and the CODE may have moved. Choosing which of the two to change is a judgement, not a derivation." }));
    }
    for (const c of x.staleCounts) {
      if (isRecord(c.doc)) { records.staleCounts++; continue; }
      out.push(F("doc-count-stale", c.doc, c.claim, `claims "${c.claim}" — re-derived live it is ${c.actual}`,
        { blast: canonBlast(c.doc), why_ruling: "a corrected count is a NUMBER, and a number this repo has not ruled on is his. Counts also rot fastest, which is the argument for replacing the claim with a COMMAND rather than a new figure." }));
    }
  } catch (e) { skipped.push(`doc execution failed: ${String(e.message).slice(0, 80)}`); }
  const recN = records.deadPaths + records.deadOrgans + records.staleGreps + records.staleCounts;
  if (recN) skipped.push(`docs/archive/: ${recN} record claim(s) point at moved paths/verbs/counts (paths ${records.deadPaths} · organs ${records.deadOrgans} · greps ${records.staleGreps} · counts ${records.staleCounts}) — RECORDS, true as of their date; listed, never a finding`);

  // §8 · Block 8: THE ROOT CANON, EXECUTED — a cited `node scripts/X.mjs verb`
  // that is DEAD (organ missing · verb rejected · uncaught) is a finding on the
  // doc that cites it. Runs inside the audit sandbox; the classes that are the
  // sandbox's shape (collar · sandbox-shape · nonzero · timeout) are stated, not
  // counted. `opts.canonExec` (a pre-computed result) lets a caller run it once.
  if (opts.canonExec !== false) {
    try {
      const res = opts.canonExec || null;
      if (res) {
        for (const r of res.rows.filter((x) => x.klass === "dead")) for (const docRel of r.docs) {
          out.push(F("doc-command-dead", docRel, r.cmd, `cites \`${r.cmd}\` and it is DEAD: ${r.why}`, { blast: 3, why_ruling: "the DOC may cite a verb that moved, or the CODE may have lost a verb the canon promises. Which one to change is a judgement — never delete the claim." }));
        }
        const soft = res.rows.filter((x) => /^(collar|sandbox-shape|nonzero|timeout|not-run|template|unmeasured)$/.test(x.klass)).length;
        skipped.push(`root canon: ${res.unique} distinct command(s) cited across ${res.docs.length} doc(s) — ${res.by.ok || 0} ok · ${res.by.dead || 0} dead · ${soft} stated-not-counted (${Object.entries(res.by).filter(([k]) => !/^(ok|dead)$/.test(k)).map(([k, n]) => `${k} ${n}`).join(" · ") || "none"}) in ${Math.round(res.ms / 1000)} s`);
      } else skipped.push("root canon commands NOT executed this run (measure() was called without a canonExec result — `audit canon` runs it)");
    } catch (e) { skipped.push(`root canon execution failed: ${String(e.message).slice(0, 80)}`); }
  }

  // ── the one genuinely safe AUTO-FIX class ────────────────────────────────
  // An organ's own `// CLI:` header that OMITS a verb the organ demonstrably
  // dispatches. Adding it is derivable (the code is the truth), oracle-verifiable,
  // reversible, and non-semantic — it is the organ's own usage line, and it makes
  // a REAL verb discoverable. Note the deliberate ASYMMETRY: only ADDING is
  // automated. Removing a header verb the code lacks is NOT, because that is the
  // signature of "planned but never built" and deleting the plan hides the gap.
  for (const [organ, o] of Object.entries(ir.organs)) {
    const hdr = new Set(o.header_verbs || []);
    if (!hdr.size) continue;
    const missing = (o.verbs || []).filter((x) => !hdr.has(x) && x.length > 2 && !/^(true|false|null|json)$/.test(x));
    if (!missing.length) continue;
    out.push(F("header-verb-undocumented", `scripts/${organ}`, missing.join(","),
      `dispatches ${missing.map((x) => `\`${x}\``).join(", ")} but its own // CLI: header does not list ${missing.length > 1 ? "them" : "it"}`,
      { blast: 1, silent: false, autofix: (dry, treeRoot) => fixHeaderVerbs(organ, missing, dry, treeRoot) }));
  }

  return { out, skipped, ir };
}

// ── §8 THE DOCS, executed rather than read ───────────────────────────────────
// 1,697 runnable commands are cited across 99 .md files, so doc verification is
// largely EXECUTION. ⚠ read with readFileSync, NEVER grep: three organs contain
// literal NUL bytes and `grep -rn` drops their lines, so a grep-based checker
// reports false GREEN on 3 of 79 organs.
export function docClaims() {
  const docs = [];
  // S10 migration #9: WHICH file kinds carry checkable claims is a REGISTRY ROW
  // (doc_claim_extensions) — .ps1/.cmd/skills join by ROW ADD, never by editing
  // this walker (the shape: "does this cited path / command still exist?" is
  // general; the .md-only nailing was the ceiling).
  const DOC_EXTS = subjectsOf("doc_claim_extensions");
  const walk = (d, depth) => {
    if (depth > 3) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      // `.claude/worktrees/` holds a FULL COPY of the repo's docs from an old
      // agent worktree. Scanning it doubled EVERY doc finding exactly — 20 from
      // ORGANISM_REPAIR_PLAN.md and 20 more from its twin. A duplicated corpus
      // does not make a finding twice as true; it makes the count twice as wrong.
      if (["node_modules", ".git", "brain_out", "worktrees"].includes(e.name)) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (DOC_EXTS.some((x) => e.name.endsWith(x)) && e.name !== "ARSENAL_FC_FULL_REPO_BUNDLE.md") docs.push(p);
    }
  };
  walk(ROOT, 0);
  const organs = new Set(readdirSync(join(ROOT, "scripts")).filter((f) => f.endsWith(".mjs")));
  const deadPaths = [], deadOrgans = [], planned = [], cited = [], unwritten = [];
  // A DECLARED FORWARD REFERENCE IS NOT A DEAD ORGAN (18 Aug 2026, OVERHAUL Block 1).
  // CLAUDE.md and the learning-layer map name `scripts/sitting.mjs` (Block 3) before it
  // exists, and SAY SO on the same line — "(Block 3)", "not built", "BUILT NAHI". A
  // citation that announces its own absence is a plan, not rot; it is listed under
  // `planned` (still visible, never a finding) until the organ lands or the line changes.
  // A bare citation of a missing organ, with no such marker, stays a dead-organ finding.
  const PLANNED_RE = /\(Block \d|not built|BUILT NAHI|NOT BUILT|nahi ban[ai]|abhi banna/i;
  for (const f of docs) {
    const txt = readAt(f);
    const rel = relative(ROOT, f).replace(/\\/g, "/");
    for (const m of txt.matchAll(/scripts[\\/]([A-Za-z0-9_\-]+)\.mjs/g)) {
      cited.push({ doc: rel, organ: `${m[1]}.mjs` });
      if (!organs.has(`${m[1]}.mjs`)) {
        const ls = txt.lastIndexOf("\n", m.index) + 1, le = txt.indexOf("\n", m.index);
        const lineTxt = txt.slice(ls, le < 0 ? undefined : le);
        if (PLANNED_RE.test(lineTxt)) planned.push({ doc: rel, organ: `${m[1]}.mjs`, line: lineTxt.trim().slice(0, 140) });
        else deadOrgans.push({ doc: rel, organ: `${m[1]}.mjs` });
      }
    }
    // Path claims of the shape `dressing-room/state/x.jsonl` or `learning-layer/Y.md`.
    //
    // ⚠ THE ALTERNATION ORDER IS LOAD-BEARING, and getting it wrong FABRICATED
    // MOST OF THIS RULE'S FINDINGS. Regex alternation is leftmost-first, so
    // `(?:json|jsonl)` matches `reps_log.jsonl` as `reps_log.json` and silently
    // drops the trailing `l`. Every one of the repo's ~31 .jsonl lanes then read
    // as "a doc cites a path that does not exist" — reps_log, brain_ledger,
    // bootroom_log, afferent, presence_log, teaching_audit, all of them, in every
    // doc that mentions them. `jsonl` MUST come first, and the trailing boundary
    // makes it explicit rather than relying on order alone.
    for (const m of txt.matchAll(/\b((?:dressing-room|learning-layer|setup|\.claude)[\\/][A-Za-z0-9_\-./]+\.(?:jsonl|json|md|ps1|mjs))(?![A-Za-z0-9])/g)) {
      const p = m[1].replace(/\\/g, "/");
      if (/[*?<>]/.test(p)) continue;
      if (existsAt(join(ROOT, p))) continue;
      // Block 8 (18 Aug 2026): A PATH WITH AN OWNER IS A LANE, NOT ROT. rejirah_log.jsonl
      // is not on disk because no Re-Jirah round has ever been graded — and rejirah.mjs
      // is its declared writer (the IR sees the appendFileSync). The map that names it
      // as "rejirah.mjs's file" is telling the truth. Such a path is listed under
      // `unwritten` with its owner, never as dead. Ownership is read from the xray IR
      // (writes), so the exemption is a measurement, not a wish.
      const owner = ownersOf(p);
      if (owner.length) unwritten.push({ doc: rel, path: p, owner });
      else deadPaths.push({ doc: rel, path: p });
    }
  }
  // dedupe
  const uniq = (arr, k) => { const s = new Set(), o = []; for (const x of arr) { const key = k(x); if (!s.has(key)) { s.add(key); o.push(x); } } return o; };
  return { docs: docs.length, cited: cited.length, deadOrgans: uniq(deadOrgans, (x) => `${x.doc}|${x.organ}`), planned: uniq(planned, (x) => `${x.doc}|${x.organ}`), deadPaths: uniq(deadPaths, (x) => `${x.doc}|${x.path}`), unwritten: uniq(unwritten, (x) => `${x.doc}|${x.path}`), files: docs };
}
// which organs the IR sees WRITING this repo-relative path (empty ⇒ nobody owns it)
let _irWriters = null;
export function ownersOf(relPath) {
  if (!_irWriters) {
    _irWriters = new Map();
    try {
      const ir = JSON.parse(readFileSync(IR_PATH, "utf8"));
      for (const [organ, o] of Object.entries(ir.organs || {})) for (const w of o.writes || []) {
        const k = String(w.path || "").replace(/\\/g, "/");
        if (!k) continue;
        if (!_irWriters.has(k)) _irWriters.set(k, []);
        _irWriters.get(k).push(organ);
      }
    } catch { /* ownersOf: IR absent or unreadable → no owners known, every missing path stays dead */ }
  }
  return _irWriters.get(String(relPath).replace(/\\/g, "/")) || [];
}

// ── §8, THE EXECUTABLE HALF ──────────────────────────────────────────────────
// The docs cite ~1,697 RUNNABLE COMMANDS as evidence, which makes most doc
// verification EXECUTION rather than reading. A cited `grep -n "X" FILE` that
// returns NOTHING, in prose that plainly implies a hit, is a STALE CANON finding
// — and this repo's canon is full of exactly that shape ("verify with: grep -n
// …") precisely so a session can check it.
//
// ⚠ THE GREP CLAIMS ARE EVALUATED IN-PROCESS, NEVER BY SHELLING OUT. Shelling
// `grep` would reproduce the very blindness the whole audit is built around:
// calibration.mjs, dmn.mjs and rejirah.mjs carry literal NUL bytes and real grep
// DROPS their lines, so a checker built on grep would confirm a stale claim as
// GREEN on exactly the three organs where a claim is hardest to verify by eye.
// readFileSync + RegExp sees straight through them.
// BASIC REGULAR EXPRESSIONS ESCAPE THEIR METACHARACTERS BACKWARDS FROM JS, and
// this is the whole reason a grep-claim checker cannot just hand the pattern to
// `new RegExp`. In BRE:
//     \( \) \| \{ \} \+ \?   are the METACHARACTERS
//        (  )  |  {  }  +  ? are LITERALS
// JS is the exact inverse. So `grep -n "DIAGNOSTIC (pick one)"` — a literal
// string search — became a JS capture group matching "DIAGNOSTIC pick one",
// which is nowhere in the file, and a perfectly good piece of canon evidence was
// reported STALE. Translated in ONE pass, so a converted character is never
// re-converted by the next rule.
export function breToJs(pattern) {
  let out = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "\\" && i + 1 < pattern.length) {
      const n = pattern[i + 1];
      // escaped in BRE ⇒ metacharacter ⇒ BARE in JS
      if ("(){}|+?".includes(n)) { out += n; i++; continue; }
      out += c + n; i++; continue;                       // pass \d \s \. through
    }
    // bare in BRE ⇒ literal ⇒ ESCAPED in JS
    if ("(){}|+?".includes(c)) { out += "\\" + c; continue; }
    out += c;
  }
  return out;
}

export function docExec() {
  const d = docClaims();
  const stale = [], ok = [], unrunnable = [];
  const GREP = /grep\s+(-[a-zA-Z]+\s+)*["']([^"']{2,120})["']\s+([A-Za-z0-9_\-./\\]+)/g;

  for (const f of d.files) {
    const rel = relative(ROOT, f).replace(/\\/g, "/");
    const txt = readAt(f);
    const spans = [
      ...[...txt.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]),
      ...[...txt.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map((m) => m[1]),
    ].join("\n");
    for (const m of spans.matchAll(GREP)) {
      const pattern = m[2], target = m[3].replace(/\\/g, "/");
      // ⚠ THE TARGET MUST LOOK LIKE A PATH. The character class includes `-`, so
      // `grep -n "gemSyncDue" -A4` captured `-A4` as the FILE and then reported a
      // perfectly good command as citing a file that does not exist. A flag is not
      // a filename, and a claim this checker cannot actually run must be counted
      // as UNRUNNABLE, never as STALE — reporting "I could not check it" as "it is
      // wrong" is the same dishonesty as reporting a skip as a pass.
      if (/^-/.test(target) || !/[./]/.test(target)) { unrunnable.push({ doc: rel, cmd: m[0].slice(0, 100), why: "the command spans more arguments than this checker parses (flag captured as the target)" }); continue; }
      // Block 8 (18 Aug 2026): a doc INSIDE a folder cites its neighbours by bare name —
      // FORGE_SPEC.md says `grep -c "…" THE-FORGE.html`, meaning learning-layer/THE-FORGE.html.
      // Resolving from the repo root alone reported six WORKING claims as stale. Root first
      // (the repo's convention), then the doc's own directory; only both missing is a finding.
      const abs = existsAt(join(ROOT, target)) ? join(ROOT, target) : join(dirname(f), target);
      if (!existsAt(abs)) { stale.push({ doc: rel, kind: "grep-target-missing", cmd: m[0].slice(0, 100), target }); continue; }
      let src;
      try { src = statSync(abs).isDirectory() ? null : readAt(abs); } catch { src = null; }
      if (src === null) { unrunnable.push({ doc: rel, cmd: m[0].slice(0, 100), why: "target is a directory (recursive grep not modelled)" }); continue; }
      // ⚠ GREP SEMANTICS ARE NOT JS SEMANTICS, and getting this wrong made the
      // checker call WORKING evidence broken — the exact failure it exists to
      // find, committed by the finder. Two differences, both load-bearing:
      //   · `^` and `$` in grep are PER-LINE. In JS they anchor to the whole
      //     STRING unless the `m` flag is set. Without it, every `grep -n "^// MODES"`
      //     claim in the repo reported STALE while matching perfectly at line 34.
      //   · Basic regular expressions escape their metacharacters BACKWARDS:
      //     `\|` is ALTERNATION in BRE and a LITERAL PIPE in JS. So
      //     `grep -n "A\|B"` was being tested as the literal string "A|B".
      //     With -E the pattern is already ERE, which is close enough to JS.
      const flags = m[1] || "";
      const extended = /E/.test(flags);
      const jsPattern = extended ? pattern : breToJs(pattern);
      let re;
      try { re = new RegExp(jsPattern, "m" + (/i/.test(flags) ? "i" : "")); }
      catch { unrunnable.push({ doc: rel, cmd: m[0].slice(0, 100), why: "pattern is not translatable to a JS RegExp" }); continue; }
      if (re.test(src)) { ok.push({ doc: rel, target, pattern }); continue; }
      // ⚠ NOT EVERY CITED COMMAND IS A HIT-CLAIM. Some are ABSENCE PROOFS — this
      // repo cites `grep -rn -i "haiku" scripts/oura_coach.mjs` precisely to show
      // the model is NOT used there, and `grep … returns only its own definition`
      // to show a frozen function has no caller. For those, returning nothing is
      // the claim being TRUE. Reading the surrounding prose is the only way to
      // tell, so the prose is read rather than assumed.
      const idx = txt.indexOf(m[0]);
      const around = idx >= 0 ? txt.slice(Math.max(0, idx - 220), idx + 220) : "";
      // Block 8 (18 Aug 2026): the sharpest absence proof this repo writes is a COUNT —
      // `grep -c "…" THE-FORGE.html` = 0 — and it was read as a hit-claim: six working
      // FORGE_SPEC/FORGE_DESIGN claims reported STALE. A `-c` claim followed by `= 0`
      // asserts the count is zero, and zero is what came back: the claim HOLDS.
      const after = idx >= 0 ? txt.slice(idx + m[0].length, idx + m[0].length + 24) : "";
      if (/c/.test(flags) && /^`?\s*(?:=|→|->|:)\s*0\b/.test(after)) { ok.push({ doc: rel, target, pattern, kind: "absence-proof-holds" }); continue; }
      if (/\b(no |never|zero|nothing|absent|returns only|not present|does not|shouldn't|should not|must not)\b/i.test(around)) {
        ok.push({ doc: rel, target, pattern, kind: "absence-proof-holds" });
        continue;
      }
      stale.push({ doc: rel, kind: "grep-returns-nothing", cmd: m[0].slice(0, 100), target, pattern });
    }
  }

  // ── NUMERIC COUNT CLAIMS, RE-DERIVED FROM LIVE DATA ────────────────────────
  // Counts rot fastest — this repo's own canon says so, and then proves it: a
  // hardcoded count in the one file every session reads went on misinforming for
  // days after the thing it described had changed. Only claims whose quantity is
  // MECHANICALLY DERIVABLE are checked; everything else would be a guess dressed
  // as a measurement.
  const derive = {
    scripts: () => readdirSync(join(ROOT, "scripts")).filter((x) => x.endsWith(".mjs")).length,
    organs: () => readdirSync(join(ROOT, "scripts")).filter((x) => x.endsWith(".mjs")).length,
    skills: () => (existsSync(join(ROOT, ".claude", "skills")) ? readdirSync(join(ROOT, ".claude", "skills")).length : 0),
    "state files": () => readdirSync(STATE_DIR).filter((x) => /\.jsonl?$/.test(x)).length,
    "suite members": () => {
      const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
      const s = new Set();
      for (const n of ["organism:selftest", "squad:selftest", "audit:selftest"]) for (const m of String(pkg.scripts[n] || "").matchAll(/scripts\/([A-Za-z0-9_\-]+)\.mjs/g)) s.add(m[1]);
      return s.size;
    },
  };
  // ⚠ ONLY CLAIMS OF TOTALITY. A bare `N <noun>` in prose almost never asserts a
  // repo-wide total: "5 organs read reJirahDone" and "4 state files hold the
  // sitting" are LOCAL counts, and checking them against the global figure
  // produced 60 confident, entirely wrong findings — the audit inventing work at
  // exactly the scale §1 forbids. A claim only counts as global when the sentence
  // says so: "all N organs", "N scripts in scripts/", "N tracked .md".
  const counts = [];
  const nouns = Object.keys(derive).join("|");
  const CLAIM = new RegExp(
    `(?:\\ball\\s+(\\d{1,4})\\s+(${nouns})\\b)` +
    `|(?:\\b(\\d{1,4})\\s+(${nouns})\\s+(?:in\\s+scripts/|in\\s+the\\s+repo|total|altogether|exist))` +
    `|(?:\\b(\\d{1,4})\\s+tracked\\s+(${nouns}))`, "gi");
  for (const f of d.files) {
    const rel = relative(ROOT, f).replace(/\\/g, "/");
    const txt = readAt(f);
    for (const m of txt.matchAll(CLAIM)) {
      const claimed = +(m[1] || m[3] || m[5]);
      const key = String(m[2] || m[4] || m[6]).toLowerCase();
      if (!claimed || !derive[key]) continue;
      let actual;
      try { actual = derive[key](); } catch { continue; }
      // A claim inside an explicitly DATED sentence is a historical record, not a
      // live assertion — this repo writes those deliberately ("Measured 6 Aug
      // 2026: …") and flagging them would be flagging its own memory.
      const around = txt.slice(Math.max(0, m.index - 160), m.index + 160);
      const dated = /\b(20\d\d)\b|\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(around);
      counts.push({ doc: rel, claim: m[0], claimed, actual, key, stale: claimed !== actual, dated });
    }
  }
  const staleCounts = counts.filter((c) => c.stale && !c.dated);
  return { grep_ok: ok.length, grep_stale: stale, grep_unrunnable: unrunnable.length, counts: counts.length, staleCounts };
}

// ── §8 · BLOCK 8 (18 Aug 2026): THE ROOT CANON, EXECUTED ─────────────────────
// ROOT CANON = the docs a session is TOLD to read and act on (CLAUDE.md's own
// list + the learning-layer canon it names). A `node scripts/X.mjs verb` cited
// there is a PROMISE — "verify with:" — and a dead one sends the next session to
// a verb that no longer exists. So every one is RUN, inside the audit sandbox
// (sandbox.mjs: git-ls-files tree, collar, no billing, no network, no live
// state), and classified by what actually came back:
//   ok            exit 0
//   dead          the organ is missing · the verb is REJECTED (a usage line came
//                 back) · an UNCAUGHT exception (a stack, not a report)
//   collar        the command needed a spawn/net/live write the sandbox denies —
//                 the sandbox's shape, not the organism's (listed, never counted)
//   sandbox-shape it died on a path that is gitignored/absent in every sandbox
//                 but PRESENT live (capsules/, brain_out/…) — same rule mutagen
//                 applies to its NO-WRITER lane (listed, never counted)
//   nonzero       a clean non-zero — a status/report verb reporting red on an
//                 empty tree; the plan's "documented non-zero" (listed)
//   template      `<lane>` `…` `[a|b]` — a shape, not a command (listed)
//   not-run       daemons / servers / stdio loops (listed by name)
//   timeout       ran past its budget (listed — a timeout is not a death)
// docs/archive/ is a RECORD: a path or verb it cites was true AS OF ITS DATE.
// Records are listed in the report and NEVER become findings — rewriting a
// record to keep it "current" is how a record stops being one (CLAUDE.md:
// "Records, not work orders").
export const ROOT_CANON = [
  "CLAUDE.md", "THE_GAFFER.md", "ARCHIVE__DAY_ONE_SPEC.md", "OPS_STATE.md", "THE_DAILY_LOOP.md", "README.md", "FREEZE.md",
  "learning-layer/LEARNING_LAYER_MAP.md", "learning-layer/PROJECT_OS.md", "learning-layer/FORGE_SPEC.md", "learning-layer/FORGE_DESIGN.md", "learning-layer/HOW_HE_LEARNS.md",
];
export const isRecord = (rel) => /^docs[\\/]archive[\\/]/.test(String(rel));
export const isRootCanon = (rel) => ROOT_CANON.includes(String(rel).replace(/\\/g, "/"));
// verbs that hold a port, a loop or stdin open — never run from a checker
const NOT_RUN_VERB = /^(daemon|serve|server|watch|loop|listen|start|repl|talk|mcp|stdio|dugout|open)$/i;
const NOT_RUN_ORGAN = /^(mcp-memory|talk|speak|dugout_bridge)\.mjs$/i;   // stdio server · voice loop · audio · bridge
// `<lane>` · `…` · `[--force]` · `[a | b]` · `$VAR` — a SHAPE, not a command
const TEMPLATE_RE = /<[^>]*>|…|\.\.\.|\[|\$\{|\$[A-Z_]|"…"|'…'|\bX\.mjs\b/;
// the whole suite (minutes) is `npm test`'s job, not a checker's; its `coverage` verb is quick and stays
const NOT_RUN_CMD = /^node scripts\/organism_test\.mjs(\s+(all|selftest|alive|ci))?$/;

// args = whitespace-separated tokens up to a pipe/&&/;/paren, a `# comment`, or a `→` arrow —
// so `node a.mjs x → node b.mjs` yields TWO commands and both get run
const CMD_RE = /node\s+scripts[\\/]([A-Za-z0-9_\-]+\.mjs)((?:[ \t]+(?!(?:→|->|=>|⇒|#)(?:\s|$))[^\s`|&;)]+)*)/g;
export function canonCommandsIn(rel, txt) {
  const cmds = [];
  const spans = [
    ...[...txt.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]),
    ...[...txt.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map((m) => m[1]),
  ].join("\n");
  for (const m of spans.matchAll(CMD_RE)) {
    const organ = m[1];
    // a trailing `# comment` or a `→ next step` is prose riding the code line, not an argument
    const argText = String(m[2] || "").replace(/\s+#.*$/s, "").replace(/\s+(?:→|->|=>|⇒).*$/s, "").trim();
    const args = argText.split(/\s+/).filter(Boolean);
    const cmd = `node scripts/${organ}${args.length ? " " + args.join(" ") : ""}`;
    cmds.push({ doc: rel, organ, args, cmd });
  }
  return cmds;
}
export function canonCommands(files) {
  const cmds = [];
  for (const f of files) {
    if (!existsAt(f)) continue;
    cmds.push(...canonCommandsIn(relative(ROOT, f).replace(/\\/g, "/"), readAt(f)));
  }
  return cmds;
}

export function classifyRun(cmd, r, { organExists = true, liveExists = () => false } = {}) {
  const out = String(r.out || "");
  if (!organExists) return { klass: "dead", why: "organ-missing" };
  if (r.timedOut) return { klass: "timeout", why: "ran past its budget" };
  if (/ARSENAL COLLAR:/.test(out)) return { klass: "collar", why: (out.match(/ARSENAL COLLAR: [^\n]{0,100}/) || [""])[0] };
  const enoent = out.match(/ENOENT[^\n]*?['"]?((?:[A-Za-z]:)?[^'"\n]*?(?:dressing-room|capsules|brain_out|learning-layer)[^'"\n]*)/);
  if (enoent && liveExists(enoent[1])) return { klass: "sandbox-shape", why: `died on ${enoent[1].slice(-80)} — absent in every sandbox, present live` };
  // a module the organ imports is missing: present live ⇒ the sandbox's shape (an UNTRACKED file —
  // git ls-files builds the sandbox, so a new organ is invisible until it is `git add`ed); absent
  // live ⇒ a dead import
  const mod = out.match(/ERR_MODULE_NOT_FOUND[\s\S]{0,400}?url: '([^']+)'/) || out.match(/Cannot find (?:module|package) '([^']+)'/) || out.match(/Cannot find module ([^\s'"]+)/);
  if (mod) {
    const p = String(mod[1]).replace(/^file:\/\/\//, "");
    return liveExists(p) ? { klass: "sandbox-shape", why: `imports ${p.slice(-60)} — present live, absent in the sandbox (untracked? \`git add\` it)` } : { klass: "dead", why: `imports a module that does not exist: ${p.slice(-80)}` };
  }
  const lines = out.split("\n").map((s) => s.trimEnd()).filter((s) => s.trim());
  const last = lines[lines.length - 1] || "";
  // a usage line: "audit: run | report | fix …" or "usage: …" or "unknown verb"
  const usage = /^\s*(usage|Usage|USAGE)\b|unknown (verb|mode|command|sub-?command)|^\s*[a-z_\-]+(\.mjs)?:\s+\S+(\s+\|\s+\S+){2,}/m;
  if (usage.test(last) && lines.length <= 4) return { klass: "dead", why: `verb REJECTED — the organ answered with its usage line: ${last.slice(0, 120)}` };
  if (r.code !== 0 && usage.test(out) && lines.length <= 8) return { klass: "dead", why: `verb REJECTED — usage: ${(out.match(usage) || [""])[0].slice(0, 120)}` };
  const stack = /^\s+at .+\.(mjs|js|cjs):\d+/m.test(out) && /\b(TypeError|ReferenceError|SyntaxError|RangeError|Error):/.test(out);
  if (stack) return { klass: "dead", why: `UNCAUGHT — ${(out.match(/\b(?:TypeError|ReferenceError|SyntaxError|RangeError|Error):[^\n]{0,140}/) || [""])[0]}` };
  if (r.code === 0) return { klass: "ok", why: "" };
  return { klass: "nonzero", why: `exit ${r.code} without a crash — a state-dependent verdict on an empty tree` };
}

export async function canonExec({ files = null, budgetMs = 8 * 60 * 1000, perCmdMs = 45000, log = () => {} } = {}) {
  const docs = (files || ROOT_CANON.map((p) => join(ROOT, p))).filter((f) => existsAt(f));
  const cited = canonCommands(docs);
  const rows = [];
  const uniq = new Map();
  for (const c of cited) {
    const k = c.cmd;
    if (!uniq.has(k)) uniq.set(k, { ...c, docs: new Set() });
    uniq.get(k).docs.add(c.doc);
  }
  const organs = new Set(readdirSync(join(ROOT, "scripts")).filter((f) => f.endsWith(".mjs")));
  const { buildSandbox, runIn, assertArmed, destroy } = await import("./sandbox.mjs");
  const toRun = [];
  for (const c of uniq.values()) {
    const row = { cmd: c.cmd, organ: c.organ, args: c.args, docs: [...c.docs] };
    if (!organs.has(c.organ)) { rows.push({ ...row, klass: "dead", why: "organ-missing" }); continue; }
    if (TEMPLATE_RE.test(c.args.join(" "))) { rows.push({ ...row, klass: "template", why: "a shape, not a command" }); continue; }
    if (NOT_RUN_ORGAN.test(c.organ) || c.args.some((a) => NOT_RUN_VERB.test(a))) { rows.push({ ...row, klass: "not-run", why: "holds a port, a loop or stdin open" }); continue; }
    if (NOT_RUN_CMD.test(c.cmd)) { rows.push({ ...row, klass: "not-run", why: "the whole suite — `npm test` runs it, minutes long" }); continue; }
    toRun.push(row);
  }
  const t0 = Date.now();
  let unmeasured = 0;
  if (toRun.length) {
    const sb = buildSandbox({ trace: false });
    try {
      assertArmed(sb);
      // a sandbox path → the same path in the LIVE tree (repo-relative from the first known root dir)
      const liveExists = (p) => { try { const s = String(p).replace(/\\/g, "/"); const m = /(?:^|\/)((?:scripts|dressing-room|capsules|brain_out|learning-layer|setup|hooks|docs)\/.*)$/.exec(s); return m ? existsAt(join(ROOT, m[1])) : false; } catch { return false; } };
      for (const row of toRun) {
        if (Date.now() - t0 > budgetMs) { unmeasured++; rows.push({ ...row, klass: "unmeasured", why: "the lane's wall-clock budget ran out before this one" }); continue; }
        const r = runIn(sb, [join(sb.root, "scripts", row.organ), ...row.args], { label: `canon:${row.organ}`, timeout: perCmdMs, input: "" });
        const c = classifyRun(row.cmd, r, { organExists: true, liveExists });
        rows.push({ ...row, klass: c.klass, why: c.why, code: r.code, ms: null });
        log(`  ${c.klass.padEnd(13)} ${row.cmd}${c.why ? `   ← ${c.why.slice(0, 100)}` : ""}`);
      }
    } finally { destroy(sb); }
  }
  const by = {};
  for (const r of rows) by[r.klass] = (by[r.klass] || 0) + 1;
  return { docs: docs.map((f) => relative(ROOT, f).replace(/\\/g, "/")), cited: cited.length, unique: uniq.size, rows, by, unmeasured, ms: Date.now() - t0 };
}

// THE ROOT-CANON VERDICT — one call, one honest number per class. This is what
// Block 8's DoD reads ("0 dead-path / 0 stale-command / 0 dead-command on root
// canon") and what `measure()` folds into findings.
export async function canonCheck(opts = {}) {
  const d = docClaims();
  const x = docExec();
  const canonDocs = (rel) => isRootCanon(rel);
  const deadPaths = d.deadPaths.filter((r) => canonDocs(r.doc));
  const deadOrgans = d.deadOrgans.filter((r) => canonDocs(r.doc));
  const staleGreps = x.grep_stale.filter((r) => canonDocs(r.doc));
  const staleCounts = x.staleCounts.filter((r) => canonDocs(r.doc));
  const exec = await canonExec(opts);
  const deadCmds = exec.rows.filter((r) => r.klass === "dead");
  const unwritten = (d.unwritten || []).filter((r) => canonDocs(r.doc));
  const records = {
    deadPaths: d.deadPaths.filter((r) => isRecord(r.doc)).length,
    deadOrgans: d.deadOrgans.filter((r) => isRecord(r.doc)).length,
    staleGreps: x.grep_stale.filter((r) => isRecord(r.doc)).length,
    staleCounts: x.staleCounts.filter((r) => isRecord(r.doc)).length,
  };
  return { deadPaths, deadOrgans, staleGreps, staleCounts, deadCmds, unwritten, exec, records };
}

// ── QUARANTINE — APPLIED ≠ VERIFIED ──────────────────────────────────────────
// A fix is `applied_at` the moment it commits, and `held_at` only after ONE full
// nightly suite AND one real overnight run produce no new watchman RED. Anything
// applied but not HELD within 48h AUTO-REVERTS.
//
// This exists because "the suite went green" is the weakest possible evidence in
// this repo — every bug it has ever shipped was one the suite AGREED WITH. Time
// on the real machine, with the real daemons and the real herd, is the only
// oracle that has ever caught those. So a fix is on probation until the organism
// has actually lived a night with it.
export function quarantine({ apply = false } = {}) {
  const rows = ledger();
  const now = Date.now();
  const held = new Set(rows.filter((r) => r.event === "held").map((r) => r.fp));
  const reverted = new Set(rows.filter((r) => r.event === "reverted").map((r) => r.fp));
  const pending = rows.filter((r) => r.event === "fixed" && !held.has(r.fp) && !reverted.has(r.fp));

  // The night's evidence: the watchman's own verdict, which is the organism
  // reporting on itself rather than the audit grading its own homework.
  const wm = join(STATE_DIR, "watchman_last.json");
  let reds = null, wmAt = null;
  try { const j = JSON.parse(readFileSync(wm, "utf8")); reds = (j.findings || []).filter((f) => f.level === "RED").length; wmAt = j.at || j.ran_at || null; } catch { /* no watchman verdict yet */ }

  const out = { pending: [], held: [], expired: [] };
  for (const r of pending) {
    const ageH = (now - new Date(r.at).getTime()) / 3600000;
    const nightPassed = wmAt && new Date(wmAt).getTime() > new Date(r.at).getTime();
    if (nightPassed && reds === 0) {
      out.held.push({ ...r, ageH: +ageH.toFixed(1) });
      if (apply) append({ event: "held", at: new Date().toISOString(), fp: r.fp, rule: r.rule, file: r.file, sha: r.sha, evidence: `watchman ${wmAt} reported 0 RED after the fix` });
    } else if (ageH > 48) {
      out.expired.push({ ...r, ageH: +ageH.toFixed(1) });
      if (apply) {
        // ⚠ LOG WHAT HAPPENED, NOT WHAT WAS ATTEMPTED. This wrote the `reverted`
        // row unconditionally, so a revert that never ran — or ran against a
        // commit living on a WORKTREE BRANCH that main has never seen, which is
        // the normal case — was recorded as done. A ledger that records intent as
        // outcome is the same near-lie as a card reporting an unread item as
        // handled. The revert is verified, and a failure is recorded AS a failure.
        let done = false, note = "";
        if (r.sha) {
          const known = sh("git", ["cat-file", "-t", r.sha]).trim() === "commit";
          const onMain = known && sh("git", ["merge-base", "--is-ancestor", r.sha, "HEAD"]) !== null && sh("git", ["branch", "--contains", r.sha]).includes("main");
          if (!known) note = "the commit is not in this repository (worktree branch pruned)";
          else if (!onMain) note = `the fix was never merged — it is still only on ${r.branch || "its audit branch"}, so there is nothing on main to revert`;
          else { const out = sh("git", ["revert", "--no-edit", r.sha]); done = !/error|conflict/i.test(out); note = done ? "reverted on main" : out.slice(0, 140); }
        } else note = "no sha recorded";
        append({
          event: done ? "reverted" : "revert-failed",
          at: new Date().toISOString(), fp: r.fp, rule: r.rule, file: r.file, sha: r.sha,
          why: `applied ${ageH.toFixed(0)}h ago and never HELD — no clean night observed`,
          outcome: note,
        });
      }
    } else {
      out.pending.push({ ...r, ageH: +ageH.toFixed(1), needs: nightPassed ? `a night with 0 RED (last saw ${reds})` : "one overnight watchman run" });
    }
  }
  return { ...out, watchman_reds: reds, watchman_at: wmAt };
}

// ── THE AUTO-FIX ─────────────────────────────────────────────────────────────
function fixHeaderVerbs(organ, missing, dry, treeRoot = ROOT) {
  const p = join(treeRoot, "scripts", organ);
  assertFixable(`scripts/${organ}`);
  const src = readFileSync(p, "utf8");
  const m = /^\/\/\s*CLI:.*$/m.exec(src);
  if (!m) return { ok: false, why: "no `// CLI:` header line to extend" };
  const line = m[0];
  // ⚠ THE SHAPE GUARD, EARNED THE HARD WAY. The first version extended the FIRST
  // `[...]` on the line, which is only the verb list when the header is the
  // canonical `node scripts/X.mjs [a|b|c]` form. python_state's header is
  // `subtopic <name> [--tier T0] | close <name> …` and rejirah's is
  // `grade <concept> <axis> held|cracked [--gut w]` — in both, the first bracket
  // is an OPTION VALUE, and the fix produced `[--tier T0|brief|packet|selftest]`.
  // Real edits, applied and then reverted by hand. APPLIED ≠ VERIFIED, and a fix
  // that is plausible everywhere and correct only sometimes is worse than none.
  // Only the unambiguous single-bracket form is auto-fixable now; everything else
  // is a RULING, which is the honest answer.
  const canonical = /^\/\/\s*CLI:\s*node\s+scripts\/[A-Za-z0-9_\-]+\.mjs\s*\[[^\]]*\]\s*$/.test(line);
  if (!canonical) return { ok: false, why: "the CLI header is not the unambiguous `node scripts/X.mjs [a|b|c]` form (its first bracket may be an OPTION VALUE, not the verb list) — extending it would corrupt his usage line" };
  const next = line.replace(/\[([^\]]*)\]/, (_, inner) => `[${inner}|${missing.join("|")}]`);
  assertNoNewNumber(line, next);
  if (dry) return { ok: true, before: line, after: next };
  writeFileSync(p, src.replace(line, next));
  return { ok: true, before: line, after: next };
}

// THE LOAD-BEARING GATE — G-FIRST: NO RED ASSERTION, NO AUTO-FIX.
// Every fix must be preceded by an oracle that is RED before and GREEN after.
// This is what converts a fix into permanent coverage, and it is the single
// thing standing between this and another audit graveyard (#106/#107/#108, all
// of whose findings were stale within days because nothing held them).
function oracleFor(f, treeRoot = ROOT) {
  if (f.rule !== "header-verb-undocumented") return null;
  const organ = basename(f.file);
  const verbs = f.subject.split(",");
  return () => {
    // ⚠ THE ORACLE MUST READ THE TREE THE FIX LANDED IN. This read `ROOT` while
    // the fix was applied in the WORKTREE, so the "GREEN after" check re-read the
    // untouched live file, stayed RED, and EVERY auto-fix was refused with the
    // reason "the oracle stayed RED after the fix". The worktree change — added
    // for safety — silently disabled the entire fixer, and the refusal message
    // was plausible enough to read as a finding about the repo rather than a bug
    // in the audit. Found by the semantic pass, which is the only lens that could
    // have: every deterministic check was perfectly green.
    const src = readFileSync(join(treeRoot, "scripts", organ), "utf8");
    const m = /^\/\/\s*CLI:.*$/m.exec(src);
    if (!m) return false;
    // ⚠ THE ORACLE MUST CHECK THE BRACKET, NOT THE LINE. The first version asked
    // only "does the verb appear on the CLI line", which was TRUE even when the
    // fix had inserted it into an option-value bracket — so it went GREEN on two
    // corrupted headers and the damage was only caught by reading the diff. An
    // oracle that cannot distinguish a good fix from a bad one is not an oracle,
    // and G-FIRST is worthless without it.
    const b = /\[([^\]]*)\]/.exec(m[0]);
    if (!b) return false;
    const inner = b[1].split("|").map((s) => s.trim());
    return verbs.every((v) => inner.includes(v));
  };
}

// ── RANK ─────────────────────────────────────────────────────────────────────
// blast(live readers) × silence(1 if the lane has zero exits, else 0.3)
//   × log2(1+age_days) ÷ answer_cost
export function rank(f, ageDays = 0) {
  const blast = Math.max(1, f.blast || 1);
  const silence = f.silent ? 1 : 0.3;
  const age = Math.log2(1 + Math.max(0, ageDays));
  const answerCost = f.autofix ? 0.5 : 2;   // a ruling costs him a decision
  return +((blast * silence * (1 + age)) / answerCost).toFixed(3);
}

// ── THE RUN ──────────────────────────────────────────────────────────────────
async function runAudit(opts = {}) {
  const pre = preconditions(opts);
  const release = lock();
  try {
    // Block 8: the root canon is EXECUTED once per run (sandbox), then folded in.
    let canonRes = null;
    if (opts.canonExec !== false) {
      try { canonRes = await canonExec({ log: opts.verbose ? (l) => console.log(l) : () => {} }); }
      catch (e) { canonRes = null; console.log(`root canon lane did not run: ${String(e.message).slice(0, 120)}`); }
    }
    const { out, skipped } = measure({ ...opts, canonExec: canonRes });
    const seen = ledger();
    const open = new Map();
    for (const r of seen) {
      if (r.event === "found") open.set(r.fp, r);
      if (r.event === "closed" || r.event === "fixed") open.delete(r.fp);
    }

    // DEDUPE — an OPEN finding NEVER re-fires. This is the whole reason the
    // ledger exists: without it, every nightly run re-deals the same 13 things
    // and the audit becomes the noise it was built to remove.
    const fresh = out.filter((f) => !open.has(f.fp));
    for (const f of fresh) append({ event: "found", at: new Date().toISOString(), fp: f.fp, rule: f.rule, file: f.file, subject: f.subject, detail: f.detail, head: pre.head });

    // GATE + APPLY — inside a WORKTREE, never the live tree.
    const fixed = [], refused = [];
    let wt = null;
    if (opts.fix) {
      // THE NUCLEAR RESET. A tag at HEAD-BEFORE, so however badly a batch goes
      // the whole span is one `git reset --hard` away. Cheap, and the one thing
      // that makes an automated fixer safe to leave running unattended.
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").replace(/Z$/, "");
      sh("git", ["tag", "-f", `audit/${stamp}`, pre.head]);
      console.log(`nuclear reset point: git reset --hard audit/${stamp}   (HEAD before this batch)`);
      wt = makeWorktree();
      let sinceFullSuite = 0;
      try {
        for (const f of out) {
          if (!f.autofix) { refused.push({ f, why: f.why_ruling || "no derivable fix" }); continue; }
          const oracle = oracleFor(f, wt.dir);
          if (!oracle) { refused.push({ f, why: "G-FIRST: no oracle assertion exists for this rule, so a fix could not be proven. NO RED ASSERTION, NO AUTO-FIX." }); continue; }
          if (oracle()) { refused.push({ f, why: "the oracle is already GREEN — nothing to fix" }); continue; }
          try {
            const r = f.autofix(false, wt.dir);
            if (!r.ok) { refused.push({ f, why: r.why }); continue; }
            // RED BEFORE, GREEN AFTER — checked in the worktree, where a failure
            // costs nothing.
            if (!oracle()) { refused.push({ f, why: "the oracle stayed RED after the fix" }); continue; }
            // THE VERIFICATION CHAIN, in the order §5 sets it: node --check →
            // that organ's OWN selftest → then, every third commit and at batch
            // end, the FULL suite. A syntax check alone proves the file parses,
            // not that the organ still works, and this repo's whole thesis is
            // that parsing and passing are different questions.
            const chk = sh(process.execPath, ["--check", join(wt.dir, f.file)]);
            if (chk.trim()) { refused.push({ f, why: `node --check failed after the fix: ${chk.slice(0, 120)}` }); continue; }
            const organPath = join(wt.dir, f.file);
            const st = sh(process.execPath, [organPath, "selftest"], { cwd: wt.dir });
            if (/FAIL|failed|Error:/.test(st) && !/0 failed|ALL CHECKS PASSED/.test(st)) {
              refused.push({ f, why: `the organ's OWN selftest went red after the fix: ${st.split("\n").filter(Boolean).slice(-1)[0]?.slice(0, 140)}` });
              sh("git", ["checkout", "--", f.file], { cwd: wt.dir });
              continue;
            }
            // ONE FINDING = ONE COMMIT, so `git revert` is per finding and a bad
            // rule never takes the good fixes down with it.
            const sha = wt.commit(`autofix(${f.rule}): ${f.file}\n\nfingerprint: ${f.fp}\nred-assertion: oracleFor(${f.rule})\n`);
            fixed.push({ ...f, sha });
            append({ event: "fixed", at: new Date().toISOString(), fp: f.fp, rule: f.rule, file: f.file, before: r.before, after: r.after, sha, branch: wt.branch });
            // EVERY 3 COMMITS: the full cross-organ suite. A per-organ selftest
            // cannot see a defect BETWEEN organs, which is the only kind this
            // repo actually ships.
            if (++sinceFullSuite >= 3) {
              sinceFullSuite = 0;
              const full = sh(process.execPath, [join(wt.dir, "scripts", "organism_test.mjs"), "coverage"], { cwd: wt.dir });
              if (/failed/.test(full) && !/0 failed/.test(full)) {
                // NEW RED ⇒ revert to last green and downgrade the whole span.
                sh("git", ["reset", "--hard", "HEAD~1"], { cwd: wt.dir });
                const dropped = fixed.pop();
                refused.push({ f: dropped, why: "the FULL suite went red at the 3-commit checkpoint — reverted to last green, and this span is downgraded to a RULING" });
              }
            }
          } catch (e) { refused.push({ f, why: String(e.message).slice(0, 200) }); }
        }
        // BATCH END: the full suite once more, on everything together.
        if (fixed.length) {
          const full = sh(process.execPath, [join(wt.dir, "scripts", "organism_test.mjs"), "coverage"], { cwd: wt.dir });
          if (/failed/.test(full) && !/0 failed/.test(full)) console.log("⚠ the full suite is RED at batch end — the branch is NOT safe to merge; read it before touching main.");
        }
      } finally { wt.cleanup(fixed.length > 0); }
    }

    // CLUSTER by root cause, then RANK
    const rulings = out.filter((f) => !fixed.includes(f));
    const clusters = new Map();
    for (const f of rulings) {
      const k = f.rule;
      if (!clusters.has(k)) clusters.set(k, []);
      clusters.get(k).push(f);
    }
    const ranked = [...clusters].map(([rule, fs]) => ({
      rule, n: fs.length,
      score: fs.reduce((s, f) => s + rank(f), 0),
      head: fs[0],
    })).sort((a, b) => b.score - a.score);

    // ONE HEALTH NUMBER. Deliberately a single scalar: a dashboard is a list,
    // and a list is triage.
    //
    // ⚠ THE FIRST FORM WAS `100 - Σ(score)`, WHICH SATURATED AT 0 ON THE FIRST
    // REAL RUN and stayed there. A number that reads 0 whether there are twelve
    // problems or two hundred carries no information and, worse, can never
    // IMPROVE visibly — so nobody would ever watch it, which is the whole job.
    // A bounded decay keeps every reduction visible: halving the burden always
    // moves the number, at any scale.
    const burden = ranked.reduce((s, c) => s + c.score, 0);
    const health = Math.round(100 / (1 + burden / 25));

    console.log(`\n${"═".repeat(70)}`);
    console.log(`ARSENAL AUDIT · HEALTH ${health}/100 · ${ranked.length} ruling${ranked.length === 1 ? "" : "s"} waiting`);
    console.log(`${"═".repeat(70)}`);
    if (opts.fix) {
      console.log(`auto-fixed ${fixed.length} · refused ${refused.length} (each refusal names its reason)`);
      if (fixed.length) {
        console.log(`
the fixes are on BRANCH ${wt.branch} — the live tree was never touched.`);
        console.log(`  review : git log --oneline main..${wt.branch}`);
        console.log(`  take it: git merge --ff-only ${wt.branch}`);
        console.log(`  bin it : git branch -D ${wt.branch}`);
      }
    }
    if (skipped.length) { console.log(`\nNOT MEASURED (stated, never silent):`); for (const s of skipped) console.log(`  · ${s}`); }

    if (opts.verbose) {
      console.log(`\n── ranked clusters`);
      for (const c of ranked) console.log(`  ${String(c.score).padStart(7)}  ${c.rule.padEnd(26)} ×${c.n}   e.g. ${c.head.file}`);
      if (refused.length) {
        console.log(`\n── refused auto-fix (${refused.length}) — every one names WHY, because a silent refusal is a lie`);
        for (const r of refused.slice(0, 12)) console.log(`  ${r.f.rule} ${r.f.file}\n      ${r.why}`);
      }
    }
    return { health, ranked, fixed, refused, fresh, skipped, out };
  } finally { release(); }
}

// ── THE CARD ─────────────────────────────────────────────────────────────────
// AT MOST ONE, and the caps are code.
function deal(res) {
  const seen = ledger();
  const now = Date.now();
  const dealt = seen.filter((r) => r.event === "dealt");
  // ⚠ A CAP THAT CAN NEVER REOPEN IS NOT A CAP, IT IS A SHUTDOWN. Nothing in the
  // repo could write the `closed`/`answered` row this predicate waited for, so
  // after the FIRST card the audit could never deal another one — for good. The
  // organ built so he would never face a queue would instead have gone silent and
  // looked healthy doing it.
  // The TTL is what closes a card, and the card SAYS SO: "default if silent:
  // leave as-is and re-rank in 7 days". His silence is a logged answer, so the
  // expiry is recorded as one rather than left to rot.
  const closed = new Set(seen.filter((r) => r.event === "closed" || r.event === "answered").map((r) => r.fp));
  const openCards = [];
  for (const d of dealt) {
    if (closed.has(d.fp)) continue;
    const ageDays = (now - new Date(d.at).getTime()) / 86400000;
    if (ageDays > (d.ttl_days || 7)) {
      append({ event: "closed", at: new Date().toISOString(), fp: d.fp, rule: d.rule, file: d.file, why: `TTL ${d.ttl_days || 7}d expired; the STATED DEFAULT applies — ${d.default_if_silent || "left as-is"}. Silence is a logged answer, not a stall.` });
      continue;
    }
    openCards.push(d);
  }
  if (openCards.length >= 1) { console.log(`\ncard: NOT dealt — ${openCards.length} card already open (HARD CAP: one at a time; it closes on its ${openCards[0].ttl_days || 7}d TTL).`); return null; }
  const last7 = dealt.filter((d) => now - new Date(d.at).getTime() < 7 * 86400000);
  if (last7.length >= 2) { console.log(`\ncard: NOT dealt — ${last7.length} already dealt in the last 7 days (HARD CAP: two).`); return null; }
  const top = res.ranked[0];
  if (!top) { console.log(`\ncard: nothing to ask.`); return null; }
  const f = top.head;
  const line = `${top.rule} ×${top.n} — ${f.file}: ${f.detail.slice(0, 150)}`;
  const card = {
    event: "dealt", at: new Date().toISOString(), fp: f.fp, rule: top.rule, file: f.file,
    line,
    ttl_days: 7,
    // HIS SILENCE IS A LOGGED ANSWER, NOT A STALL.
    default_if_silent: "leave as-is and re-rank in 7 days (no code changes)",
  };
  append(card);
  console.log(`\n── ONE CARD (TTL 7d · default if silent: ${card.default_if_silent})`);
  console.log(`   ${line}`);
  return card;
}

// ── SELFTEST ─────────────────────────────────────────────────────────────────
function selftest() {
  console.log("=== audit.mjs selftest ===\n");
  // RULE ZERO must be a refusal, not a comment.
  let r0 = false; try { assertFixable("dressing-room/state/captains_call.json"); } catch { r0 = true; }
  assert("RULE ZERO — the fixer REFUSES to edit dressing-room/state/", r0);
  for (const c of CANON) {
    let ref = false; try { assertFixable(c); } catch { ref = true; }
    assert(`CANON is never written automatically — ${c}`, ref);
  }
  let ng = false; try { assertFixable(".gitignore"); } catch { ng = true; }
  assert("the never-automate list is enforced (.gitignore)", ng);
  let num = false; try { assertNoNewNumber("[a|b]", "[a|b|c] cap 500"); } catch { num = true; }
  assert("a patch introducing a NEW NUMBER is refused — a free parameter is HIS", num);
  assert("…but a patch introducing no new number passes", (() => { try { assertNoNewNumber("[a|b]", "[a|b|c]"); return true; } catch { return false; } })());

  assert("a fingerprint is stable across runs", fingerprint("r", "f", " Subject ") === fingerprint("r", "f", "subject"));
  assert("…and distinguishes different subjects", fingerprint("r", "f", "a") !== fingerprint("r", "f", "b"));

  // ranking must prefer a wide, silent, old finding over a narrow, loud, new one
  const wide = { blast: 8, silent: true, autofix: null };
  const narrow = { blast: 1, silent: false, autofix: null };
  assert("RANK prefers blast radius and silence", rank(wide, 10) > rank(narrow, 10));
  assert("…and an auto-fixable finding outranks a ruling of equal blast (it costs him nothing)",
    rank({ blast: 2, silent: true, autofix: () => { } }) > rank({ blast: 2, silent: true, autofix: null }));

  // THE CAPS ARE CODE
  const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
  assert("the ONE-OPEN-CARD cap is in code, not prose", /openCards\.length >= 1/.test(src));
  assert("the TWO-PER-7-DAYS cap is in code", /last7\.length >= 2/.test(src));
  assert("every card carries a TTL and a STATED DEFAULT (his silence is a logged answer)", /ttl_days/.test(src) && /default_if_silent/.test(src));
  assert("G-FIRST is enforced in code — no oracle, no auto-fix", /NO RED ASSERTION, NO AUTO-FIX/.test(src) && /if \(!oracle\)/.test(src));

  // the docs checker must actually read files (and not via grep)
  const d = docClaims();
  assert("the docs checker read the .md corpus", d.docs > 50, `${d.docs}`);
  assert("…and it uses readFileSync, never grep (3 organs carry NUL bytes and grep drops their lines)",
    !/execFileSync\(\s*["']grep/.test(src));

  // BRE → JS, with known answers. This translation is what makes 1,000+ cited
  // commands checkable, and getting it wrong reported WORKING evidence as broken.
  assert("BRE: bare `(` is a LITERAL, so it must be ESCAPED for JS", breToJs("DIAGNOSTIC (pick one)") === "DIAGNOSTIC \\(pick one\\)");
  assert("BRE: `\\|` is ALTERNATION, so it must become a bare `|` in JS", breToJs("a\\|b") === "a|b");
  assert("BRE: `\\(` is a GROUP, so it must become a bare `(` in JS", breToJs("\\(x\\)") === "(x)");
  assert("…and a character class / escape passes through untouched", breToJs("\\d+x") === "\\d\\+x");
  assert("the translation is ONE PASS — a converted char is never re-converted", breToJs("\\|(") === "|\\(");
  // and the grep-semantics fix itself, stated as a test
  assert("`^` is matched PER LINE, as grep does, not per string",
    new RegExp(breToJs("^// MODES"), "m").test("line one\n// MODES: a|b\n"));

  // QUARANTINE — applied is not held.
  const q = quarantine({ apply: false });
  assert("QUARANTINE reports without applying (a dry read never reverts anything)",
    q && Array.isArray(q.pending) && Array.isArray(q.held) && Array.isArray(q.expired));
  assert("…and it derives HELD from the WATCHMAN's verdict, not from its own suite run",
    /watchman/i.test(readFileSync(fileURLToPath(import.meta.url), "utf8").match(/export function quarantine[\s\S]{0,2200}/)[0]));

  // THE WORKTREE — the fixer must not be able to reach the live tree at all.
  const srcAll = readFileSync(fileURLToPath(import.meta.url), "utf8");
  assert("the fixer runs in a git WORKTREE, never the live tree", /makeWorktree\(\)/.test(srcAll) && /git", \["worktree", "add"/.test(srcAll));
  assert("…and one finding is ONE COMMIT, so `git revert` is per finding", /wt\.commit\(`autofix\(/.test(srcAll));
  assert("a NUCLEAR RESET tag is cut at HEAD-before, so a whole bad batch is one command away", /"tag", "-f"/.test(srcAll));
  assert("the verification chain is node --check → the ORGAN'S OWN selftest → the FULL suite every 3 commits",
    /--check/.test(srcAll) && /organ's OWN selftest went red/.test(srcAll) && /3-commit checkpoint/.test(srcAll));
  assert("…and a new RED reverts to the last green and downgrades the span to a RULING",
    /reset", "--hard", "HEAD~1"/.test(srcAll) && /downgraded to a RULING/.test(srcAll));

  // the fixer's oracle must be red before and green after, on a real organ
  const ir = existsSync(IR_PATH) ? JSON.parse(readFileSync(IR_PATH, "utf8")) : null;
  assert("the IR is present so measurement can run", !!ir);

  // ── Block 8 (18 Aug 2026): THE ROOT CANON, EXECUTED ────────────────────────
  console.log("\n── Block 8 · root canon lane");
  assert("docs/archive/ is a RECORD, root canon is not", isRecord("docs/archive/CYBORG_BRAIN.md") && !isRecord("CLAUDE.md") && isRootCanon("CLAUDE.md") && isRootCanon("learning-layer/FORGE_SPEC.md") && !isRootCanon("docs/archive/CLAUDE_2026-08-18.md"));
  // classifyRun — known answers, no process spawned
  const C = (out, code, extra = {}) => classifyRun("x", { out, code, ...extra }).klass;
  assert("classify: exit 0 ⇒ ok", C("all good", 0) === "ok");
  assert("classify: a usage line back ⇒ DEAD (verb rejected), even on exit 0", C("usage: node scripts/x.mjs [a | b | c]", 0) === "dead" && C("audit: run | report | fix | ledger", 1) === "dead");
  assert("classify: an uncaught stack ⇒ DEAD", C("TypeError: x is not a function\n    at main (file:///C:/r/scripts/x.mjs:12:5)\n", 1) === "dead");
  assert("classify: the collar's denial ⇒ collar (the sandbox's shape, never counted)", C("Error: ARSENAL COLLAR: network access is denied inside the audit sandbox → http://localhost:5600\n    at f (x.mjs:1:1)", 1) === "collar");
  assert("classify: ENOENT on a path PRESENT live ⇒ sandbox-shape", C("Error: ENOENT: no such file or directory, open 'C:\\r\\dressing-room\\state\\capsules\\x.json'\n    at f (x.mjs:1:1)", 1, {}) === "dead" && classifyRun("x", { out: "Error: ENOENT: no such file or directory, open 'C:\\r\\dressing-room\\state\\capsules\\x.json'\n    at f (x.mjs:1:1)", code: 1 }, { liveExists: () => true }).klass === "sandbox-shape");
  assert("classify: a clean non-zero ⇒ nonzero (a verdict on an empty tree, stated not counted)", C("3 lanes RED\n", 1) === "nonzero");
  assert("classify: a timeout is a timeout, not a death", C("", null, { timedOut: true }) === "timeout");
  assert("classify: a missing organ ⇒ dead", classifyRun("x", { out: "", code: 1 }, { organExists: false }).why === "organ-missing");
  // canonCommands — extraction on a planted doc: comments and arrows stripped, templates kept as shapes
  {
    const cmds = canonCommandsIn("PLANTED.md", "# planted\n`node scripts/validators.mjs selftest # read-only`\n```bash\nnode scripts/rejirah.mjs close <c> [--anyway]\nnode scripts/capture.mjs paste x.json → node scripts/heartbeat.mjs\n```\n");
    const byCmd = Object.fromEntries(cmds.map((c) => [c.cmd, c]));
    assert("extract: a trailing `# comment` is prose, not an argument", !!byCmd["node scripts/validators.mjs selftest"], Object.keys(byCmd).join(" ; "));
    assert("extract: `→ next step` is cut off the command", !!byCmd["node scripts/capture.mjs paste x.json"] && !!byCmd["node scripts/heartbeat.mjs"], Object.keys(byCmd).join(" ; "));
    assert("extract: `<c> [--anyway]` survives as the shape it is (classified template later)", !!byCmd["node scripts/rejirah.mjs close <c> [--anyway]"] && TEMPLATE_RE.test("<c> [--anyway]"));
  }
  // ownersOf — a path with an owner is a LANE, not rot (read from the IR)
  assert("ownersOf: rejirah_log.jsonl (never written yet) is OWNED by rejirah.mjs, so the map naming it is not a dead claim", ownersOf("dressing-room/state/rejirah_log.jsonl").includes("rejirah.mjs"), ownersOf("dressing-room/state/rejirah_log.jsonl").join(","));
  assert("ownersOf: a path nobody writes has no owner", ownersOf("dressing-room/state/NO_SUCH_LANE_EVER.json").length === 0);
  // THE STATIC HALF OF THE DoD, LIVE ON THIS TREE: root canon carries no dead path, no stale grep claim
  {
    const dc = docClaims();
    const dx = docExec();
    const dp = dc.deadPaths.filter((r) => isRootCanon(r.doc));
    const sg = dx.grep_stale.filter((r) => isRootCanon(r.doc));
    assert("DoD (static): ROOT CANON cites 0 dead paths", dp.length === 0, dp.map((r) => `${r.doc} → ${r.path}`).join(" ; "));
    assert("DoD (static): ROOT CANON cites 0 stale grep claims (a `-c … = 0` claim is an ABSENCE PROOF and holds)", sg.length === 0, sg.map((r) => `${r.doc} → ${r.cmd}`).join(" ; "));
    assert("…and the FORGE canon's six `-c … = 0` absence proofs are read as HOLDING, not stale", !dx.grep_stale.some((r) => /FORGE_(SPEC|DESIGN)/.test(r.doc) && /THE-FORGE\.html/.test(r.cmd)));
  }
  console.log("  (the EXECUTED half — every cited command run in the sandbox — is `node scripts/audit.mjs canon`; it exits 1 iff root canon carries a dead command)");

  console.log(`\naudit: ${pass} passed, ${fail} failed`);
  if (fail) for (const f of fails) console.log(`  · ${f.n}${f.d ? `\n      ${f.d}` : ""}`);
  process.exit(fail ? 1 : 0);
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
// `canon` — Block 8's DoD read-out: the ROOT CANON's claims, executed. Prints
// every class with its members and exits 1 iff root canon carries a dead path,
// a stale grep claim or a dead command (a red is a fact about the docs, not a
// crash of this organ). Records (docs/archive/) are counted on their own line.
async function canonMain() {
  console.log("=== audit canon — the ROOT CANON, executed (sandbox: no billing · no network · no live state) ===\n");
  const c = await canonCheck({ log: (l) => console.log(l) });
  const list = (title, rows, fmt) => { console.log(`\n${title} (${rows.length})`); for (const r of rows) console.log(`  · ${fmt(r)}`); };
  list("DEAD PATHS on root canon", c.deadPaths, (r) => `${r.doc} → ${r.path}`);
  list("DEAD ORGANS on root canon", c.deadOrgans, (r) => `${r.doc} → ${r.organ}`);
  list("STALE GREP CLAIMS on root canon", c.staleGreps, (r) => `${r.doc} → ${r.cmd} (${r.kind})`);
  list("STALE COUNTS on root canon", c.staleCounts, (r) => `${r.doc} → "${r.claim}" is ${r.actual}`);
  list("DEAD COMMANDS on root canon", c.deadCmds, (r) => `${r.docs.join(", ")} → ${r.cmd}   ← ${r.why}`);
  const soft = c.exec.rows.filter((x) => !/^(ok|dead)$/.test(x.klass));
  console.log(`\nSTATED, NOT COUNTED (${soft.length + c.unwritten.length}) — the sandbox's shape, a template, or a lane with an owner that has not written yet:`);
  for (const r of c.unwritten) console.log(`  · ${"unwritten".padEnd(13)} ${r.doc} → ${r.path}   ← owned by ${r.owner.join(", ")}; not on disk yet`);
  for (const r of soft) console.log(`  · ${r.klass.padEnd(13)} ${r.cmd}${r.why ? `   ← ${String(r.why).slice(0, 110)}` : ""}`);
  console.log(`\nrecords (docs/archive/, true as of their date — never findings): paths ${c.records.deadPaths} · organs ${c.records.deadOrgans} · greps ${c.records.staleGreps} · counts ${c.records.staleCounts}`);
  const red = c.deadPaths.length + c.deadOrgans.length + c.staleGreps.length + c.deadCmds.length;
  console.log(`\nROOT CANON · ${c.exec.docs.length} doc(s) · ${c.exec.unique} distinct command(s) (${c.exec.cited} citations) · ok ${c.exec.by.ok || 0} · dead ${c.exec.by.dead || 0} · ${Math.round(c.exec.ms / 1000)} s`);
  console.log(red ? `VERDICT: RED — ${red} claim(s) on root canon do not hold (fix the DOC or the CODE; never delete the claim)` : "VERDICT: GREEN — every path, grep claim and command the root canon cites holds");
  process.exit(red ? 1 : 0);
}

async function main() {
  const mode = (process.argv[2] || "run").toLowerCase();
  const opts = { deep: process.argv.includes("--deep"), verbose: process.argv.includes("-v") || process.argv.includes("--verbose"), fix: process.argv.includes("--fix"), allowDirty: process.argv.includes("--allow-dirty"), canonExec: process.argv.includes("--no-canon") ? false : undefined };
  if (mode === "selftest") return selftest();
  if (mode === "docs") { console.log(JSON.stringify(docClaims(), null, 1)); return; }
  if (mode === "docexec") { console.log(JSON.stringify(docExec(), null, 1)); return; }
  if (mode === "canon") return canonMain();
  if (mode === "quarantine") { console.log(JSON.stringify(quarantine({ apply: process.argv.includes("--apply") }), null, 1)); return; }
  if (mode === "ledger") { for (const r of ledger()) console.log(JSON.stringify(r)); return; }
  if (mode === "report") { await runAudit({ ...opts, verbose: true }); return; }
  if (mode === "fix") { const res = await runAudit({ ...opts, fix: true, verbose: true }); deal(res); return; }
  if (mode === "run") { const res = await runAudit(opts); deal(res); return; }
  console.log("audit: run | report | fix | canon | ledger | docs | docexec | quarantine | selftest  [--deep] [-v] [--fix] [--no-canon]");
  process.exit(1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(`audit: ${e.message}`); process.exit(1); });
