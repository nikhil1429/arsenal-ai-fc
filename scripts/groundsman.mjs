#!/usr/bin/env node
// ============================================================================
// groundsman.mjs · ARSENAL AI FC — THE GROUNDSMAN (the Kennel's night-shift)
// ----------------------------------------------------------------------------
// WHAT:  The body that lets the laptop sleep (CYBORG_BRAIN.md §2, §9). Runs on
//        a ₹1,500 Pi Zero 2 W (or a retired Android + Termux) INSIDE his own
//        house: loop → git pull the bus → brain.mjs tick → git push
//        public-safe outputs only. Cloud = inference; storage = his house.
// THE BUS LEASE — the single-writer law ACROSS TWO NODES (load-bearing:
//        without it, laptop + Pi double-write the ledger and corrupt the
//        self-tuning budget). bus_lease.json holds {holder, host_id, ts, ttl}:
//        · the laptop heartbeats the lease while awake (it always has priority)
//        · the Kennel may TAKE the lease only when the laptop's heartbeat is
//          stale past TTL (laptop dark → the night-shift begins)
//        · the laptop RECLAIMS silently on wake (the Kennel yields at the
//          next check — it never fights the primary)
//        · nobody ticks the brain without holding the lease. Ever.
// TRANSPORT: today bus_lease.json is LOCAL (gitignored). The day the Kennel
//        physically arrives: (1) remove it from .gitignore so the lease
//        travels the git bus, (2) schedule `heartbeat` beside a push, and
//        (3) raise the TTL to match the transport (git-carried arbitration:
//        --ttl 90; the 20-min default fits same-disk arbitration only).
// SMOKE-TEST FIRST (unrun = hypothesis): `claude -p` under tmux on the Pi for
//        48h BEFORE trusting the Kennel with the window (§9). Fallback: the
//        Kennel runs only deterministic organs + the git bus (no LLM auth).
// MODES: node scripts/groundsman.mjs heartbeat            (laptop, scheduled)
//        node scripts/groundsman.mjs night --host <id>    (the Kennel loop)
//        node scripts/groundsman.mjs status · selftest
// ============================================================================

import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const LEASE     = join(STATE_DIR, "bus_lease.json");
const TTL_MIN   = 20;                                // laptop heartbeat is 5-min; 20 = safely dark

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

// ---------------------------------------------------------------------------
// THE LEASE PROTOCOL (pure — every decision testable)
// ---------------------------------------------------------------------------
function leaseState(lease, now = new Date()) {
  if (!lease || !lease.ts) return "vacant";
  const age = (now - new Date(lease.ts)) / 60000;
  return age <= (lease.ttl_min || TTL_MIN) ? "held" : "stale";
}
// the laptop: always writes its heartbeat — priority is structural
function heartbeat(hostId, deps = {}) {
  const now = deps.now || new Date();
  const lease = { holder: "laptop", host_id: hostId, ts: now.toISOString(), ttl_min: TTL_MIN };
  (deps.write || ((o) => writeAtomic(LEASE, o)))(lease);
  return lease;
}
// the Kennel: may take only what the laptop has abandoned
function tryTakeLease(hostId, deps = {}) {
  const now = deps.now || new Date();
  const cur = (deps.read || (() => readJson(LEASE)))();
  const state = leaseState(cur, now);
  if (state === "held" && cur.holder === "laptop") return { taken: false, why: "the laptop is awake — the Kennel idles" };
  if (state === "held" && cur.host_id === hostId) {                       // renew own
    const lease = { holder: "kennel", host_id: hostId, ts: now.toISOString(), ttl_min: TTL_MIN };
    (deps.write || ((o) => writeAtomic(LEASE, o)))(lease);
    return { taken: true, why: "renewed own lease" };
  }
  if (state === "held") return { taken: false, why: `held by ${cur.host_id}` };
  const lease = { holder: "kennel", host_id: hostId, ts: now.toISOString(), ttl_min: TTL_MIN, took_from: cur ? cur.host_id : null };
  (deps.write || ((o) => writeAtomic(LEASE, o)))(lease);
  return { taken: true, why: state === "vacant" ? "lease was vacant" : "laptop dark past TTL — night-shift begins" };
}
// EVERY brain tick checks this first — no lease, no write, no exceptions
function mayTick(hostId, role, deps = {}) {
  const cur = (deps.read || (() => readJson(LEASE)))();
  const now = deps.now || new Date();
  if (leaseState(cur, now) !== "held") return role === "laptop";          // vacant/stale → the laptop may tick (it IS the primary)
  return cur.host_id === hostId || (role === "laptop" && cur.holder === "laptop");
}

// ---------------------------------------------------------------------------
// THE PUBLISH ALLOWLIST — what the UNATTENDED night-shift may put on the
// internet (E2E audit 25 Jul 2026, CRITICAL). The old comment on the push step
// claimed it was "public-safe by construction: every personal file is
// gitignored, so `git add -A` can only ever stage machinery + public outputs."
// That claim was FALSE, and it was the most dangerous line in the repo:
// .gitignore is a hand-enumerated DENYLIST (~90 literal paths) and `origin` is
// a PUBLIC GitHub repo. Anything personal the captain drops in the tree that
// nobody thought to enumerate — medical correspondence, a new bible, an .md
// naming real people — is untracked AND unignored, and `git add -A` on a loop
// that fires every 30 minutes with nobody watching would stage it, commit it
// and push it to the internet. A denylist can never make a push safe; only an
// allowlist can. So the night-shift now carries two independent locks:
//   1. `git add -u -- <allowlist>` — `-u` stages ONLY files git already TRACKS,
//      so a brand-new file on disk cannot be staged by the Kennel at all.
//      Publishing something NEW stays a deliberate human act at the laptop.
//      (dressing-room/state/ sits on the list KNOWINGLY: since decision D10 and
//      his 9 Aug 2026 ruling — "i do not care putting my data in the public repo" —
//      his personal study/biometric state files ARE tracked and DO ride this push.
//      That is accepted by his word, not an oversight. Only credentials stay
//      ignored; lock 1 still blocks brand-new files, lock 2 still blocks off-list
//      paths.)
//   2. the index is read BACK with --name-only and every staged path matched
//      against this list; anything off it and the pass REFUSES to commit or
//      push. Lock 2 catches what lock 1 can't: paths left staged in the index
//      before this pass ever ran. Fail closed — it reports and idles.
// ---------------------------------------------------------------------------
const PUBLISH_ALLOWLIST = [
  "scripts/", "setup/", "hooks/", "dressing-room/state/",
  "package.json", "package-lock.json", "ci_manifest.json", "README.md",
];
function isPublishablePath(p) {
  const path = String(p == null ? "" : p).trim().replace(/^"(.*)"$/, "$1").replace(/\\/g, "/");
  if (!path || path.includes("..")) return false;    // empty or an escape out of the repo → never
  return PUBLISH_ALLOWLIST.some(a => (a.endsWith("/") ? path.startsWith(a) : path === a));
}

// ---------------------------------------------------------------------------
// THE NIGHT LOOP (Kennel side) — pull → lease → tick → push public-safe only
// ---------------------------------------------------------------------------
function sh(cmd, args, deps = {}) {
  const exec = deps.exec || ((c, a) => execFileSync(c, a, { encoding: "utf8", windowsHide: true, timeout: 120000, cwd: join(__dirname, "..") }));
  try { return { ok: true, out: exec(cmd, args) }; } catch (e) { return { ok: false, out: String(e.message).slice(0, 200) }; }
}
async function nightPass(hostId, deps = {}) {
  const run = (c, a) => (deps.sh || sh)(c, a, deps);
  const pull = run("git", ["pull", "--ff-only"]);
  if (!pull.ok) return { ok: false, step: "pull", why: pull.out };
  const take = tryTakeLease(hostId, deps);
  if (!take.taken) return { ok: false, step: "lease", why: take.why };
  const tick = run("node", [join(__dirname, "brain.mjs"), "tick"]);
  if (!tick.ok) return { ok: false, step: "tick", why: tick.out };
  // push is public-safe BY ENFORCEMENT now, not by assumption (E2E audit
  // 25 Jul 2026 — see THE PUBLISH ALLOWLIST above; this step used to be a bare
  // `git add -A` into a PUBLIC remote). Lock 1: tracked files, on the list only.
  // If a listed path has vanished git calls the whole pathspec fatal → nothing
  // stages → we stop before the index gate. Fail closed, and say so out loud.
  const add = run("git", ["add", "-u", "--", ...PUBLISH_ALLOWLIST]);
  if (!add.ok) return { ok: true, ticked: true, pushed: false, why: `staging refused: ${add.out}` };
  const diff = run("git", ["diff", "--cached", "--quiet"]);
  if (!diff.ok) {                                    // exit 1 = staged changes exist
    // Lock 2: read the index back and refuse on ANY path off the allowlist —
    // the index can carry paths staged by something other than this pass.
    const staged = run("git", ["diff", "--cached", "--name-only"]);
    if (!staged.ok) return { ok: true, ticked: true, pushed: false, refused: true, why: "refused: could not read the staged set back to verify it" };
    const offending = String(staged.out || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean).filter(p => !isPublishablePath(p));
    if (offending.length) return { ok: true, ticked: true, pushed: false, refused: true, why: `refused: ${offending.length} staged path(s) off the publish allowlist (${offending.slice(0, 3).join(", ")}) — a human publishes those, never the night-shift` };
    run("git", ["commit", "-m", `kennel: night-shift outputs (${hostId})`]);
    const push = run("git", ["push"]);
    if (!push.ok) return { ok: true, ticked: true, pushed: false, why: push.out };
    return { ok: true, ticked: true, pushed: true };
  }
  return { ok: true, ticked: true, pushed: false, why: "nothing public to push" };
}

// ---------------------------------------------------------------------------
// LADDER D3 (9 Aug 2026) — THE PUSH-ONLY LANE (laptop side).
// RECEIPT, dated, per the _gemini_lane pattern: this lane pushes UNATTENDED
// under his 9 Aug 2026 blanket ladder ruling — "okay let's implement every
// thing" — which explicitly covered the groundsman unattended-push (the one
// NEEDS-CARD item on the approved list), on top of his same-day words about the
// public repo: "i do not care putting my data in the public repo". Credentials
// stay gitignored; both allowlist locks below are the SAME two locks nightPass
// carries, unchanged.
// WHY a separate lane: nightPass is the KENNEL's loop — pull → lease → TICK →
// push. On the laptop the BrainDaemon already owns the beat, so running
// nightPass here double-ticks the brain by construction. This lane is the push
// HALF alone: stage (tracked, allowlisted) → verify the index back → commit →
// push. No pull, no lease, no tick. A push rejection (remote moved) is reported
// honestly and retried by the next night's task — never forced.
// ---------------------------------------------------------------------------
async function pushOnlyPass(hostId, deps = {}) {
  const run = (c, a) => (deps.sh || sh)(c, a, deps);
  // ── THE LANE READ-BACK (10 Aug 2026, wire-audit) ──────────────────────────
  // WHY IT LIVES HERE: this lane's push is what FIRES the away-day CI workflow
  // (.github/workflows/awayday.yml — push to main + a 03:00 IST cron), and until
  // today nothing on this side of the wire ever read the result back. awayday.mjs
  // wrote zero files and no organ knew whether the cloud lane was green or red;
  // a red reached him only as a Gmail subject line, which the anchor law forbids.
  // The organ that causes the run is the right organ to read its verdict.
  // FIRST, and UNCONDITIONAL: the verdict now on GitHub belongs to LAST night's
  // push, so it must be read even on a night with nothing new to push, and read
  // before the staging gate so awayday.json rides tonight's push out to the
  // remote (where the cloud sentinel's mini-brief can see it). This lane runs
  // 03:45 and the cloud cron lands 03:00 — the verdict read here is ~45 minutes
  // old, not a week.
  // NEVER FATAL: a laptop with no internet at 03:45 must still push in the
  // morning, so a failed read is reported and the pass carries on. awayday.mjs's
  // own check keeps the last known verdict rather than blanking it — silence
  // must never look green.
  const back = run("node", [join(__dirname, "awayday.mjs"), "check"]);
  // ── AND THE ANSWER IS READ (11 Aug 2026, wire-audit second pass) ──────────
  // The line above landed yesterday with `back` assigned and never touched again:
  // the read fired and its answer went in the bin. sh() CAPTURES stdout (:130 —
  // encoding "utf8", not stdio "inherit"), so the one human-readable line `check`
  // prints — "awayday: cloud lane RED on <sha> — failure" — reached no log at all;
  // and a `check` that crashed, got renamed, or died with node came back {ok:false}
  // into a variable nobody read while this lane went on printing "push-only —
  // PUSHED". A read whose answer is discarded is the SAME dead wire as no read —
  // exactly the shape the header above was written to close, re-grown one line
  // lower. The verdict now leaves on every return path and main()'s push mode
  // prints it, so it lands in scripts/groundsman.log (this task is registered
  // through run_logged.cmd — setup/INSTALL_CYBORG_TASKS.ps1 Mk()).
  // STILL NEVER FATAL, and still no new escalation invented here: a failed read is
  // NAMED and the pass carries on to the push. The RED card is awayday.mjs's own
  // job and stays there (owners-only); this lane only stops swallowing what it asked for.
  const readback = back.ok
    ? { ok: true, line: String(back.out || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean).join(" · ") || "check ran and printed nothing" }
    : { ok: false, line: `READ-BACK FAILED — ${String(back.out || "").split(/\r?\n/)[0]}` };
  // EVERY exit carries it. A verdict that survives only on the happy path is an
  // orphan again the first night the staging gate refuses — and a refusing night
  // is precisely a night somebody is reading this log.
  const withVerdict = (o) => ({ ...o, readback });
  const add = run("git", ["add", "-u", "--", ...PUBLISH_ALLOWLIST]);
  if (!add.ok) return withVerdict({ ok: true, pushed: false, why: `staging refused: ${add.out}` });
  const diff = run("git", ["diff", "--cached", "--quiet"]);
  if (diff.ok) return withVerdict({ ok: true, pushed: false, why: "nothing public to push" });
  const staged = run("git", ["diff", "--cached", "--name-only"]);
  if (!staged.ok) return withVerdict({ ok: true, pushed: false, refused: true, why: "refused: could not read the staged set back to verify it" });
  const offending = String(staged.out || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean).filter(p => !isPublishablePath(p));
  if (offending.length) return withVerdict({ ok: true, pushed: false, refused: true, why: `refused: ${offending.length} staged path(s) off the publish allowlist (${offending.slice(0, 3).join(", ")}) — a human publishes those, never this lane` });
  run("git", ["commit", "-m", `groundsman: unattended state push (${hostId}) — his 9 Aug 2026 ruling, receipt in pushOnlyPass`]);
  const push = run("git", ["push"]);
  if (!push.ok) return withVerdict({ ok: true, pushed: false, why: `push refused (${push.out.slice(0, 120)}) — tomorrow's pass retries; nothing forced` });
  return withVerdict({ ok: true, pushed: true });
}

async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const now = new Date("2026-07-14T02:00:00");
  const mkLease = (holder, host, agoMin) => ({ holder, host_id: host, ts: new Date(now - agoMin * 60000).toISOString(), ttl_min: TTL_MIN });

  // the lease protocol
  assert("fresh laptop heartbeat = held", leaseState(mkLease("laptop", "lap1", 5), now) === "held");
  assert("a heartbeat past TTL = stale (the laptop is dark)", leaseState(mkLease("laptop", "lap1", 25), now) === "stale");
  assert("no lease file = vacant", leaseState(null, now) === "vacant");
  {
    let written = null;
    const t1 = tryTakeLease("pi1", { read: () => mkLease("laptop", "lap1", 5), write: (o) => { written = o; }, now });
    assert("KENNEL NEVER FIGHTS THE PRIMARY: laptop awake → not taken", t1.taken === false && written === null);
    const t2 = tryTakeLease("pi1", { read: () => mkLease("laptop", "lap1", 25), write: (o) => { written = o; }, now });
    assert("laptop dark past TTL → the night-shift takes the lease", t2.taken === true && written.holder === "kennel" && written.took_from === "lap1");
    const t3 = tryTakeLease("pi1", { read: () => mkLease("kennel", "pi1", 5), write: (o) => { written = o; }, now });
    assert("the Kennel renews its own live lease", t3.taken === true && t3.why.includes("renewed"));
    const t4 = tryTakeLease("pi2", { read: () => mkLease("kennel", "pi1", 5), write: () => { throw new Error("no"); }, now });
    assert("a SECOND kennel cannot steal a live lease (single writer holds)", t4.taken === false);
  }
  {
    assert("no tick without the lease: kennel with someone else's lease → NO", mayTick("pi1", "kennel", { read: () => mkLease("laptop", "lap1", 5), now }) === false);
    assert("the leaseholder may tick", mayTick("pi1", "kennel", { read: () => mkLease("kennel", "pi1", 5), now }) === true);
    assert("vacant/stale lease → only the LAPTOP may tick (it is the primary)", mayTick("lap1", "laptop", { read: () => null, now }) === true && mayTick("pi1", "kennel", { read: () => null, now }) === false);
    let hb = null;
    heartbeat("lap1", { write: (o) => { hb = o; }, now });
    assert("the laptop heartbeat stamps holder/host/ts/ttl", hb.holder === "laptop" && hb.host_id === "lap1" && hb.ttl_min === TTL_MIN);
  }
  // the night pass
  {
    const calls = [];
    // the mock must now answer BOTH diff calls: --name-only returns the staged
    // set (the allowlist gate reads it), --quiet returns exit 1 = changes exist
    const mkSh = (fail = {}, stagedNames = "scripts/brain.mjs\n") => (c, a) => {
      calls.push(c + " " + a.join(" "));
      if (fail[c]) return { ok: false, out: "boom" };
      if (c === "git" && a[0] === "diff" && a.includes("--name-only")) return { ok: true, out: stagedNames };
      if (c === "git" && a[0] === "diff") return { ok: false, out: "" };
      return { ok: true, out: "" };
    };
    const r = await nightPass("pi1", { sh: mkSh(), read: () => mkLease("laptop", "lap1", 25), write: () => {}, now });
    assert("night pass: pull → take lease → tick → commit → push", r.ok && r.ticked && r.pushed && calls.some(c => c.includes("pull")) && calls.some(c => c.includes("brain.mjs")) && calls.some(c => c.includes("push")));
    const calls2 = [];
    const r2 = await nightPass("pi1", { sh: (c, a) => { calls2.push(c + a.join("")); if (c === "git" && a[0] === "pull") return { ok: true, out: "" }; return { ok: true, out: "" }; }, read: () => mkLease("laptop", "lap1", 5), write: () => {}, now });
    assert("laptop awake → the pass stops AT the lease (no tick, no push)", r2.ok === false && r2.step === "lease" && !calls2.some(c => c.includes("brain.mjs")));
    const r3 = await nightPass("pi1", { sh: mkSh({ git: true }), read: () => null, write: () => {}, now });
    assert("pull failure aborts the pass before anything writes", r3.ok === false && r3.step === "pull");

    // THE PUBLISH ALLOWLIST — the E2E audit's critical find (25 Jul 2026):
    // `git add -A` + push to a PUBLIC remote, on an unattended 30-min loop.
    assert("allowlist: machinery + the tracked bus files are publishable",
      isPublishablePath("scripts/brain.mjs") && isPublishablePath("dressing-room/state/brain_config.json") && isPublishablePath("README.md"));
    assert("allowlist: a personal file nobody enumerated is NOT publishable",
      !isPublishablePath("THE_DOCTORS_LETTER.md") && !isPublishablePath("dressing-room/hippocampus/episodes.jsonl") && !isPublishablePath("Jarvis/mood.md") && !isPublishablePath("../outside.md"));
    assert("the night-shift stages TRACKED files on the list only — never `git add -A`",
      calls.some(c => c.startsWith("git add -u --")) && !calls.some(c => c.includes("add -A")));
    const calls4 = [];
    const r4 = await nightPass("pi1", {
      sh: (c, a) => { calls4.push(c + " " + a.join(" ")); if (c === "git" && a[0] === "diff" && a.includes("--name-only")) return { ok: true, out: "scripts/brain.mjs\nTHE_DOCTORS_LETTER.md\n" }; if (c === "git" && a[0] === "diff") return { ok: false, out: "" }; return { ok: true, out: "" }; },
      read: () => mkLease("laptop", "lap1", 25), write: () => {}, now,
    });
    assert("ONE OFF-LIST PATH IN THE INDEX ABORTS THE PUSH (nothing personal reaches the internet)",
      r4.pushed === false && r4.refused === true && !calls4.some(c => c.includes("commit")) && !calls4.some(c => c.includes("push")));
    const calls5 = [];
    const r5 = await nightPass("pi1", {
      sh: (c, a) => { calls5.push(c + " " + a.join(" ")); if (c === "git" && a[0] === "diff" && a.includes("--name-only")) return { ok: false, out: "boom" }; if (c === "git" && a[0] === "diff") return { ok: false, out: "" }; return { ok: true, out: "" }; },
      read: () => mkLease("laptop", "lap1", 25), write: () => {}, now,
    });
    assert("can't READ the index back → fail closed, no push", r5.pushed === false && r5.refused === true && !calls5.some(c => c.includes("push")));

    // LADDER D3 — the push-only lane (laptop): same two locks, ZERO tick, ZERO pull
    // KAAM 0 (10 Aug 2026): this fixture named captains_call.json until that pass
    // gitignored it. A path that can never legitimately be staged is a misleading
    // example of a PUBLISHABLE one — the assert would still pass while teaching a
    // dead fact, which is the exact rot the claims register exists for. brain_config
    // .json is tracked, on the list, and exercises the identical prefix rule.
    const c6 = [];
    const r6 = await pushOnlyPass("laptop", {
      sh: (c, a) => { c6.push(c + " " + a.join(" ")); if (c === "git" && a[0] === "diff" && a.includes("--name-only")) return { ok: true, out: "dressing-room/state/brain_config.json\n" }; if (c === "git" && a[0] === "diff") return { ok: false, out: "" }; return { ok: true, out: "" }; },
    });
    assert("D3: push-only stages→verifies→commits→pushes, and NEVER ticks or pulls (the daemon owns the beat)",
      r6.ok && r6.pushed === true
      && !c6.some(x => x.includes("brain.mjs")) && !c6.some(x => x.includes("pull"))
      && c6.some(x => x.startsWith("git add -u --")) && c6.some(x => x.includes("commit")) && c6.some(x => x.includes("push")));
    const c7 = [];
    const r7 = await pushOnlyPass("laptop", {
      sh: (c, a) => { c7.push(c + " " + a.join(" ")); if (c === "git" && a[0] === "diff" && a.includes("--name-only")) return { ok: true, out: "scripts/brain.mjs\nTHE_DOCTORS_LETTER.md\n" }; if (c === "git" && a[0] === "diff") return { ok: false, out: "" }; return { ok: true, out: "" }; },
    });
    assert("D3: the SAME allowlist locks hold — one off-list path refuses the whole push",
      r7.pushed === false && r7.refused === true && !c7.some(x => x.includes("commit")));
    const r8 = await pushOnlyPass("laptop", {
      sh: (c, a) => { if (c === "git" && a[0] === "diff" && !a.includes("--name-only")) return { ok: true, out: "" }; return { ok: true, out: "" }; },
    });
    assert("D3: a clean index is 'nothing public to push', never an empty commit",
      r8.pushed === false && /nothing public/.test(r8.why));
    const r9 = await pushOnlyPass("laptop", {
      sh: (c, a) => { if (c === "git" && a[0] === "push") return { ok: false, out: "rejected (fetch first)" }; if (c === "git" && a[0] === "diff" && a.includes("--name-only")) return { ok: true, out: "scripts/brain.mjs\n" }; if (c === "git" && a[0] === "diff") return { ok: false, out: "" }; return { ok: true, out: "" }; },
    });
    assert("D3: a rejected push is reported honestly and NEVER forced (tomorrow retries)",
      r9.pushed === false && /retries/.test(r9.why) && /nothing forced/.test(r9.why));

    // THE LANE READ-BACK (10 Aug 2026, wire-audit) — see the header inside
    // pushOnlyPass. awayday.mjs was a producer with no consumer for six weeks:
    // this lane's push fires the cloud CI workflow and nothing on this side ever
    // read the verdict back, so a red lane (it was red on HEAD when this was
    // written) reached him only by email. These two fail the moment the wire is
    // cut again — c6 is the pushing pass, r8/c8 the pass with nothing to push.
    assert("THE LANE READ-BACK: the push pass reads the away-day CI verdict back, and does it BEFORE staging so tonight's verdict rides tonight's push",
      c6.some(x => x.includes("awayday.mjs") && x.includes("check"))
      && c6.findIndex(x => x.includes("awayday.mjs")) < c6.findIndex(x => x.startsWith("git add -u --")));
    const c8 = [];
    await pushOnlyPass("laptop", {
      sh: (c, a) => { c8.push(c + " " + a.join(" ")); if (c === "git" && a[0] === "diff" && !a.includes("--name-only")) return { ok: true, out: "" }; return { ok: true, out: "" }; },
    });
    assert("the read-back is UNCONDITIONAL — a night with nothing to push still reads yesterday's cloud verdict (that is exactly the night a red goes unseen)",
      c8.some(x => x.includes("awayday.mjs") && x.includes("check")));
    const c9 = [];
    const rBack = await pushOnlyPass("laptop", {
      sh: (c, a) => { c9.push(c + " " + a.join(" ")); if (c === "node") return { ok: false, out: "ENOTFOUND api.github.com" }; if (c === "git" && a[0] === "diff" && a.includes("--name-only")) return { ok: true, out: "dressing-room/state/brain_config.json\n" }; if (c === "git" && a[0] === "diff") return { ok: false, out: "" }; return { ok: true, out: "" }; },
    });
    assert("a failed read-back is NEVER fatal — an offline 03:45 still pushes in the morning",
      rBack.pushed === true && c9.some(x => x.includes("push")));

    // ── THE ANSWER IS HEARD (11 Aug 2026, wire-audit second pass) ────────────
    // The read above fired from 10 Aug and its result was assigned to `back` and
    // never read: sh() captures stdout, so the verdict line reached NO log and a
    // crashed `check` was indistinguishable from a green one. These three fail the
    // moment the answer stops leaving the pass, or stops being printed.
    const VERDICT = "awayday: cloud lane RED on 2c23168 — failure\nawayday: https://github.com/x/y/actions/runs/31359935125\n";
    const rHeard = await pushOnlyPass("laptop", {
      sh: (c, a) => { if (c === "node") return { ok: true, out: VERDICT }; if (c === "git" && a[0] === "diff" && a.includes("--name-only")) return { ok: true, out: "dressing-room/state/brain_config.json\n" }; if (c === "git" && a[0] === "diff") return { ok: false, out: "" }; return { ok: true, out: "" }; },
    });
    // …and on the night with NOTHING to push, which is the night the old code's
    // one surviving line ("nothing public to push") said the least.
    const rQuiet = await pushOnlyPass("laptop", {
      sh: (c, a) => { if (c === "node") return { ok: true, out: VERDICT }; if (c === "git" && a[0] === "diff" && !a.includes("--name-only")) return { ok: true, out: "" }; return { ok: true, out: "" }; },
    });
    // read through a defaulting accessor, never `r.readback.line` — a cut wire
    // must come back as a ✗ naming the broken assertion, not a TypeError stack
    // that buries which one it was (proven: the un-guarded first draft threw).
    const rb = (r) => (r && r.readback) || { ok: null, line: "" };
    assert("THE ANSWER LEAVES THE PASS: the verdict `check` printed is carried out of pushOnlyPass — on the pushing night AND the nothing-to-push night, not just the happy path",
      /RED on 2c23168/.test(rb(rHeard).line) && rb(rHeard).ok === true
      && /RED on 2c23168/.test(rb(rQuiet).line) && rQuiet.pushed === false);
    assert("A CRASHED READ-BACK IS NAMED, never silence: a non-zero `check` is reported as FAILED and the push still happens",
      rb(rBack).ok === false && /READ-BACK FAILED/.test(rb(rBack).line) && /ENOTFOUND/.test(rb(rBack).line) && rBack.pushed === true);
    assert("main()'s push mode PRINTS it — the consumer RUNS, it does not merely exist (the awayday.mjs:483 probe pattern)",
      (() => { const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
               const tail = src.slice(src.indexOf("async function main"));
               return /r\.readback/.test(tail) && /console\.log/.test(tail); })());
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  const hostFlag = process.argv.indexOf("--host");
  // the primary's identity is its ROLE (no machine hostname in a public bus file)
  const hostId = hostFlag > -1 ? process.argv[hostFlag + 1] : (mode === "heartbeat" ? "laptop" : os.hostname());
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "heartbeat") { const l = heartbeat(hostId); console.log(`groundsman: laptop heartbeat — lease held by ${l.host_id} till +${l.ttl_min}min`); return; }
  if (mode === "status") {
    const l = readJson(LEASE);
    console.log(l ? `groundsman: lease ${leaseState(l)} — holder ${l.holder}/${l.host_id} since ${l.ts}` : "groundsman: no lease yet (vacant — the laptop is the primary)");
    return;
  }
  if (mode === "night") {
    console.log(`groundsman: night loop on ${hostId} — 30min cadence. SMOKE-TEST claude -p under tmux 48h before trusting this with the window (§9).`);
    const pass = async () => { const r = await nightPass(hostId); console.log(`groundsman: ${r.ok ? `ticked${r.pushed ? " + pushed" : ""}` : `idle (${r.step}: ${r.why})`}`); };
    await pass();
    setInterval(pass, 30 * 60000);
    return;
  }
  if (mode === "push") {
    // LADDER D3 — the unattended laptop push (see pushOnlyPass's receipt header).
    const r = await pushOnlyPass("laptop");
    // THE CONSUMER (11 Aug 2026). Printed FIRST because it happened first, and
    // because a RED cloud lane is the more important news of the two lines. This
    // is the only place the away-day verdict becomes readable on the house side at
    // 03:45 — without it the read below is a call whose answer nobody hears.
    if (r.readback) console.log(`groundsman: away-day read-back — ${r.readback.line}`);
    console.log(`groundsman: push-only — ${r.pushed ? "PUSHED (the sentinel's mini-brief reads tonight's truth)" : r.why}`);
    return;
  }
  console.log("groundsman.mjs — heartbeat | night --host <id> | push | status | selftest");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { leaseState, heartbeat, tryTakeLease, mayTick, nightPass, pushOnlyPass, TTL_MIN, isPublishablePath, PUBLISH_ALLOWLIST };
