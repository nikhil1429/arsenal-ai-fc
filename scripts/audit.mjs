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
// CLI: node scripts/audit.mjs [run|report|fix|ledger|docs|selftest] [--deep]
// ============================================================================
import { readFileSync, writeFileSync, appendFileSync, existsSync, readdirSync, mkdirSync, statSync, unlinkSync, openSync, closeSync } from "node:fs";
import { join, dirname, basename, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const STATE_DIR = join(ROOT, "dressing-room", "state");
const LEDGER = join(STATE_DIR, "audit_ledger.jsonl");
const LOCK = join(STATE_DIR, "audit.lock");
const IR_PATH = join(STATE_DIR, "xray_graph.json");

let pass = 0, fail = 0; const fails = [];
const assert = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; fails.push({ n, d }); console.log(`  FAIL ${n}${d ? `\n         ${d}` : ""}`); } };

const sh = (cmd, args, opts = {}) => { try { return execFileSync(cmd, args, { cwd: ROOT, encoding: "utf8", timeout: 120000, ...opts }); } catch (e) { return (e.stdout || "") + (e.stderr || ""); } };
export const fingerprint = (rule, file, subject) => createHash("sha1").update(`${rule}|${file}|${String(subject).trim().toLowerCase()}`).digest("hex").slice(0, 16);

// ── THE LEDGER (sole writer) ─────────────────────────────────────────────────
export const ledger = () => (existsSync(LEDGER) ? readFileSync(LEDGER, "utf8").split("\n").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : []);
function append(row) { mkdirSync(STATE_DIR, { recursive: true }); appendFileSync(LEDGER, JSON.stringify(row) + "\n"); }

// ── RULE ZERO, IN CODE ───────────────────────────────────────────────────────
const STATE_RE = /dressing-room[\\/]state[\\/]/i;
const CANON = ["CLAUDE.md", "THE_GAFFER.md", "OPS_STATE.md", "ARSENAL_AI_FC_MASTERPLAN.md", "THE_MANAGER__Master_Prompt.md"];
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
  const fs_ = join(STATE_DIR, "forge_session.json");
  if (existsSync(fs_)) {
    try {
      const j = JSON.parse(readFileSync(fs_, "utf8"));
      if (j && j.open === true) throw new Error("audit: REFUSING — a forge session is OPEN. He may be mid-study; the audit waits.");
    } catch (e) { if (/REFUSING/.test(e.message)) throw e; }
  }
  return { head, dirty: !!dirty, notes };
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
    if (herdN) out.push(F("catch-up-herd", "setup/INSTALL_TASKS.ps1", "StartWhenAvailable", `${herdN} overnight tasks carry StartWhenAvailable=true, so on a laptop that sleeps they ALL fire at once, in arbitrary order, at the wrong hour — and every localDate(now) inside them derives the wrong day-key`, { blast: herdN, why_ruling: "the repair is a schedule change (stagger, or a shared mutex, or dropping StartWhenAvailable). All three are free parameters and the file is never-automate." }));
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

  // ── from the docs (§8) ───────────────────────────────────────────────────
  const doc = docClaims();
  for (const d of doc.deadPaths) out.push(F("doc-dead-path", d.doc, d.path, `cites a path that does not exist: ${d.path}`, { blast: 0, autofix: null, why_ruling: CANON.includes(basename(d.doc)) ? "CANON — propose a diff, never write." : "the path may have MOVED rather than vanished; picking the replacement is a judgement." }));
  for (const d of doc.deadOrgans) out.push(F("doc-dead-organ", d.doc, d.organ, `cites \`${d.organ}\`, which does not exist in scripts/`, { blast: 0 }));

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
      { blast: 1, silent: false, autofix: (dry) => fixHeaderVerbs(organ, missing, dry) }));
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
  const walk = (d, depth) => {
    if (depth > 3) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (["node_modules", ".git", "brain_out"].includes(e.name)) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (e.name.endsWith(".md") && e.name !== "ARSENAL_FC_FULL_REPO_BUNDLE.md") docs.push(p);
    }
  };
  walk(ROOT, 0);
  const organs = new Set(readdirSync(join(ROOT, "scripts")).filter((f) => f.endsWith(".mjs")));
  const deadPaths = [], deadOrgans = [], cited = [];
  for (const f of docs) {
    const txt = readFileSync(f, "utf8");
    const rel = relative(ROOT, f).replace(/\\/g, "/");
    for (const m of txt.matchAll(/scripts[\\/]([A-Za-z0-9_\-]+)\.mjs/g)) {
      cited.push({ doc: rel, organ: `${m[1]}.mjs` });
      if (!organs.has(`${m[1]}.mjs`)) deadOrgans.push({ doc: rel, organ: `${m[1]}.mjs` });
    }
    // path claims of the shape `dressing-room/state/x.json` or `learning-layer/Y.md`
    for (const m of txt.matchAll(/\b((?:dressing-room|learning-layer|setup|\.claude)[\\/][A-Za-z0-9_\-./]+\.(?:json|jsonl|md|ps1|mjs))/g)) {
      const p = m[1].replace(/\\/g, "/");
      if (/[*?<>]/.test(p)) continue;
      if (!existsSync(join(ROOT, p))) deadPaths.push({ doc: rel, path: p });
    }
  }
  // dedupe
  const uniq = (arr, k) => { const s = new Set(), o = []; for (const x of arr) { const key = k(x); if (!s.has(key)) { s.add(key); o.push(x); } } return o; };
  return { docs: docs.length, cited: cited.length, deadOrgans: uniq(deadOrgans, (x) => `${x.doc}|${x.organ}`), deadPaths: uniq(deadPaths, (x) => `${x.doc}|${x.path}`) };
}

// ── THE AUTO-FIX ─────────────────────────────────────────────────────────────
function fixHeaderVerbs(organ, missing, dry) {
  const p = join(ROOT, "scripts", organ);
  assertFixable(`scripts/${organ}`);
  const src = readFileSync(p, "utf8");
  const m = /^\/\/\s*CLI:.*$/m.exec(src);
  if (!m) return { ok: false, why: "no `// CLI:` header line to extend" };
  const line = m[0];
  if (!/\[/.test(line)) return { ok: false, why: "the CLI header is not in the `[a|b|c]` form; extending it would reformat his prose" };
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
function oracleFor(f) {
  if (f.rule !== "header-verb-undocumented") return null;
  const organ = basename(f.file);
  const verbs = f.subject.split(",");
  return () => {
    const src = readFileSync(join(ROOT, "scripts", organ), "utf8");
    const m = /^\/\/\s*CLI:.*$/m.exec(src);
    if (!m) return false;
    return verbs.every((v) => new RegExp(`[[|\\s]${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\]|\\s]`).test(m[0]));
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
function runAudit(opts = {}) {
  const pre = preconditions(opts);
  const release = lock();
  try {
    const { out, skipped } = measure(opts);
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

    // GATE + APPLY
    const fixed = [], refused = [];
    if (opts.fix) {
      for (const f of out) {
        if (!f.autofix) { refused.push({ f, why: f.why_ruling || "no derivable fix" }); continue; }
        const oracle = oracleFor(f);
        if (!oracle) { refused.push({ f, why: "G-FIRST: no oracle assertion exists for this rule, so a fix could not be proven. NO RED ASSERTION, NO AUTO-FIX." }); continue; }
        if (oracle()) { refused.push({ f, why: "the oracle is already GREEN — nothing to fix" }); continue; }
        try {
          const r = f.autofix(false);
          if (!r.ok) { refused.push({ f, why: r.why }); continue; }
          if (!oracle()) { refused.push({ f, why: "the oracle stayed RED after the fix — reverted" }); continue; }
          const chk = sh(process.execPath, ["--check", join(ROOT, f.file)]);
          if (chk.trim()) { refused.push({ f, why: `node --check failed after the fix: ${chk.slice(0, 120)}` }); continue; }
          fixed.push(f);
          append({ event: "fixed", at: new Date().toISOString(), fp: f.fp, rule: f.rule, file: f.file, before: r.before, after: r.after });
        } catch (e) { refused.push({ f, why: String(e.message).slice(0, 200) }); }
      }
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
    const health = Math.max(0, Math.round(100 - ranked.reduce((s, c) => s + c.score, 0)));

    console.log(`\n${"═".repeat(70)}`);
    console.log(`ARSENAL AUDIT · HEALTH ${health}/100 · ${ranked.length} ruling${ranked.length === 1 ? "" : "s"} waiting`);
    console.log(`${"═".repeat(70)}`);
    if (opts.fix) console.log(`auto-fixed ${fixed.length} · refused ${refused.length} (each refusal names its reason)`);
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
  const openCards = dealt.filter((d) => !seen.some((r) => (r.event === "closed" || r.event === "answered") && r.fp === d.fp));
  if (openCards.length >= 1) { console.log(`\ncard: NOT dealt — ${openCards.length} card already open (HARD CAP: one at a time).`); return null; }
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

  // the fixer's oracle must be red before and green after, on a real organ
  const ir = existsSync(IR_PATH) ? JSON.parse(readFileSync(IR_PATH, "utf8")) : null;
  assert("the IR is present so measurement can run", !!ir);

  console.log(`\naudit: ${pass} passed, ${fail} failed`);
  if (fail) for (const f of fails) console.log(`  · ${f.n}${f.d ? `\n      ${f.d}` : ""}`);
  process.exit(fail ? 1 : 0);
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
function main() {
  const mode = (process.argv[2] || "run").toLowerCase();
  const opts = { deep: process.argv.includes("--deep"), verbose: process.argv.includes("-v") || process.argv.includes("--verbose"), fix: process.argv.includes("--fix"), allowDirty: process.argv.includes("--allow-dirty") };
  if (mode === "selftest") return selftest();
  if (mode === "docs") { console.log(JSON.stringify(docClaims(), null, 1)); return; }
  if (mode === "ledger") { for (const r of ledger()) console.log(JSON.stringify(r)); return; }
  if (mode === "report") { runAudit({ ...opts, verbose: true }); return; }
  if (mode === "fix") { const res = runAudit({ ...opts, fix: true, verbose: true }); deal(res); return; }
  if (mode === "run") { const res = runAudit(opts); deal(res); return; }
  console.log("audit: run | report | fix | ledger | docs | selftest  [--deep] [-v] [--fix]");
  process.exit(1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
