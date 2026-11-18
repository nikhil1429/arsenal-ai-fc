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

import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import os from "node:os";
import { slotDate, launchContext, issueDayKeyToken, ENV_TOKEN } from "./daykey.mjs";   // Block 6 — THE DAY-KEY LAW
export { slotDate };   // the plan's export lives here too (the push lane knows its slot)

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
// ROW 769 (15 Oct 2026) — STATE ONLY. This list reached scripts/, setup/, hooks/ and package.json, so at 03:45 IST the
// unattended push (dcd23ff) swept a runner's UNCOMMITTED scripts/brain.mjs to origin/main without the keeper.mjs it
// imports: lock 1's `-u` stops a NEW file, never a half-landed edit of a TRACKED one. Machinery reaches origin only by
// a deliberate commit at the laptop (the campaign's witnessed landings); this loop publishes his tracked state and
// nothing else. Every other entry it carried is machinery (code, setup, hooks, manifests, docs), never a night output.
const PUBLISH_ALLOWLIST = [
  "dressing-room/state/",
];
function isPublishablePath(p) {
  const path = String(p == null ? "" : p).trim().replace(/^"(.*)"$/, "$1").replace(/\\/g, "/");
  if (!path || path.includes("..")) return false;    // empty or an escape out of the repo → never
  return PUBLISH_ALLOWLIST.some(a => (a.endsWith("/") ? path.startsWith(a) : path === a));
}

// ---------------------------------------------------------------------------
// THE NIGHT LOOP (Kennel side) — pull → lease → tick → push public-safe only
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ROW 808 (2) (19 Oct 2026) — THE HELD-LANDING REFUSAL. At 03:45 IST on 18 Oct this lane's push (04071ab) carried THREE
// commits a runner had landed on main and was HOLDING for the architect's re-run (6826d2ab, 87dab91, 5049da33): `git push`
// sends every commit in origin..HEAD, not only tonight's state commit, so the state-only allowlist (row 769) guarded the
// INDEX and never the RANGE. The content was lawful and adopted after the fact; the road was wrong. So the unattended push
// reads origin..HEAD FIRST: a commit in it that is not this lane's own state commit (its own subject AND every path on the
// publish allowlist; a subject alone never passes) is a HELD LANDING, and the pass refuses before it stages anything,
// cards him ONCE (keyed by the first held sha, so the same hold never re-mints; no --why-code-cannot-decide, so the
// decision gate deals it as news, not homework) and never pushes. A landing reaches origin only by its runner's deliberate
// push after the re-run. A range that cannot be read (no upstream: a hold branch checked out) fails closed, like lock 2.
// ---------------------------------------------------------------------------
const OWN_SUBJECTS = ["groundsman: unattended state push (", "kennel: night-shift outputs ("];
function heldCommits(run) {
  const RS = String.fromCharCode(30), NL = String.fromCharCode(10);
  const log = run("git", ["log", "--reverse", "--format=%x1e%H %s", "--name-only", "@{u}..HEAD"]);
  if (!log.ok) return { ok: false, held: [], why: `refused: could not read origin..HEAD (${String(log.out || "").split(NL)[0].slice(0, 100)}) — fail closed, nothing staged, nothing pushed` };
  const held = [];
  for (const rec of String(log.out || "").split(RS).slice(1)) {
    const lines = rec.split(NL).map((s) => s.trim()).filter(Boolean);
    const head = lines.shift() || "";
    const sha = head.slice(0, 40), subject = head.slice(41);
    const own = OWN_SUBJECTS.some((p) => subject.startsWith(p)) && lines.length > 0 && lines.every(isPublishablePath);
    if (!own) held.push({ sha, subject, paths: lines });
  }
  return { ok: true, held };
}
function refuseHeld(run, h, extra = {}) {
  const first = h.held[0];
  const line = `Raat ka auto-push ruka: main par ${h.held.length} commit review mein hain (pehla ${first.sha.slice(0, 7)}). Runner push karega; tab tak state push band.`;
  run("node", [join(__dirname, "captains_call.mjs"), "file", "--line", line, "--key", `groundsman:held:${first.sha.slice(0, 12)}`]);
  return { ok: true, ...extra, pushed: false, refused: true, held: h.held.map((x) => x.sha),
    why: `refused: ${h.held.length} held commit(s) in origin..HEAD that are not this lane's own (first ${first.sha.slice(0, 7)} "${first.subject.slice(0, 60)}") — a held landing reaches origin by its runner's push, never by the night` };
}
// OVERHAUL Block 6 (18 Aug 2026) — THE DAY-KEY LAW for the push lane. This lane
// is scheduled (ArsenalFC-Groundsman-Push 03:45) and runs one-shots of its own
// (awayday check, brain tick in the night loop): they take THIS lane's day, so a
// >24 h sleep that lands the 03:45 catch-up at 01:00 the day after keys the
// slot's day, not the clock's. Resolved once per process (token → slot → clock).
function laneDay(deps = {}) {
  if (deps.dayInfo) return deps.dayInfo;
  const ctx = launchContext({ now: deps.now });
  return { day: ctx.day, source: ctx.source, why: ctx.why };
}
let _laneEnv = null;
function laneEnv(deps = {}) {
  if (deps.env) return deps.env;
  if (!_laneEnv) _laneEnv = { ...process.env, [ENV_TOKEN]: issueDayKeyToken(laneDay(deps).day) };
  return _laneEnv;
}
function sh(cmd, args, deps = {}, extraEnv = null) {   // extraEnv (row 1029 (3)): the rebuild's private GIT_INDEX_FILE, never his index
  const exec = deps.exec || ((c, a, x) => execFileSync(c, a, { encoding: "utf8", windowsHide: true, timeout: 120000, cwd: join(__dirname, ".."), env: x ? { ...laneEnv(deps), ...x } : laneEnv(deps) }));
  try { return { ok: true, out: exec(cmd, args, extraEnv) }; } catch (e) { return { ok: false, out: String(e.message).slice(0, 200) }; }
}

// ---------------------------------------------------------------------------
// ROW 1029 (3) (unit mgrd, spec ci/mcr/B2_SPEC.md §4, G1 A + G2 A) — THE STATE PUSH MEETS ORIGIN FIRST. Until this unit
// the lane never fetched: a moved origin (a landing pushed by a runner) left the night's commit made locally, the push
// rejected, and every later night added one more own commit to a DIVERGED main. Now, every night, before staging:
//   · fetch origin main — a refusal idles (NO-FETCH), nothing staged;
//   · origin is an ancestor of HEAD → as before;
//   · no own unpushed commit → a fast-forward-only merge to origin (git refuses only for a dirty path origin moved:
//     idle DIRTY-PATH, ONE card by the owner CLI, nothing moved);
//   · own unpushed STATE commits (heldCommits has already proven each is this lane's own, state paths only) and origin
//     moved by commits that touch NO state path → each own commit is REBUILT by plumbing on origin's head: a private
//     index (GIT_INDEX_FILE) holds origin's tree with that commit's dressing-room/state/ subtree laid over it,
//     commit-tree with its own author and message, then `read-tree -m -u` (two-way, refuses a dirty path) + a CAS
//     `update-ref` move main. Never a stash, never a force, never a rebase of a commit that is not its own;
//   · origin moved a STATE path → idle STATE-CONFLICT, ONE card, nothing rewritten (his word decides).
// ---------------------------------------------------------------------------
const STATE_PREFIX = "dressing-room/state/";
const linesOf = (s) => String(s || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
function cardOnce(run, line, key) { run("node", [join(__dirname, "captains_call.mjs"), "file", "--line", line, "--key", key]); return key; }
function dirtyOverlap(run, from, to) {
  const moved = new Set(linesOf(run("git", ["diff", "--name-only", "--no-renames", from, to]).out));
  const dirty = [...linesOf(run("git", ["diff", "--name-only", "HEAD"]).out), ...linesOf(run("git", ["ls-files", "--others", "--exclude-standard"]).out)];
  return dirty.find((p) => moved.has(p)) || null;
}
function meetOrigin(run) {
  const anc = run("git", ["merge-base", "--is-ancestor", "@{u}", "HEAD"]);
  if (anc.ok) return { ok: true, how: "even" };
  const O = run("git", ["rev-parse", "@{u}"]), H = run("git", ["rev-parse", "HEAD"]), B = run("git", ["merge-base", "HEAD", "@{u}"]);
  const own = run("git", ["rev-list", "--reverse", "@{u}..HEAD"]);
  if (!O.ok || !H.ok || !B.ok || !own.ok) return { ok: false, idle: "NO-BASE", why: "idle NO-BASE — origin's head, HEAD or their meeting point could not be read; fail closed, nothing staged, nothing moved" };
  const o = O.out.trim(), hd = H.out.trim(), base = B.out.trim(), mine = linesOf(own.out), o12 = o.slice(0, 12);
  if (!mine.length) {                                                       // behind only: fast-forward to origin
    const ff = run("git", ["merge", "--ff-only", o]);
    if (!ff.ok) {
      const p = dirtyOverlap(run, hd, o) || String(ff.out).split(/\r?\n/).slice(1).join(" ").trim().slice(0, 100);
      const key = cardOnce(run, `Raat ka state push ruka: origin aage gaya aur ${p} par aapka kaam chal raha hai. Aap merge karein; tab tak push band.`, `groundsman:dirty:${o12}`);
      return { ok: false, idle: "DIRTY-PATH", card: key, why: `idle DIRTY-PATH ${p} — origin ${o.slice(0, 7)} moved a path that is dirty here; no stash, no force, nothing moved` };
    }
    return { ok: true, how: "ff", to: o };
  }
  const movedPaths = linesOf(run("git", ["log", "--no-renames", "--format=", "--name-only", `${base}..${o}`]).out);
  const statePath = movedPaths.find((p) => p.startsWith(STATE_PREFIX));
  if (statePath) {
    const key = cardOnce(run, `Raat ka state push ruka: origin ne bhi state badli (${statePath}) aur yahan ${mine.length} state commit unpushed hain. Aapka faisla; kuch rewrite nahi hua.`, `groundsman:conflict:${o12}`);
    return { ok: false, idle: "STATE-CONFLICT", card: key, why: `idle STATE-CONFLICT ${statePath} — origin ${o.slice(0, 7)} moved a state path and ${mine.length} own state commit(s) are unpushed; nothing rewritten` };
  }
  const idx = join(os.tmpdir(), `groundsman-index-${process.pid}-${o12}`);
  const env = { GIT_INDEX_FILE: idx };
  let parent = o;
  try {
    for (const c of mine) {
      const meta = run("git", ["show", "-s", "--format=%an%x00%ae%x00%aI%x00%B", c]);
      const steps = [
        run("git", ["read-tree", o], env),
        run("git", ["rm", "--cached", "-r", "-q", "-f", "--ignore-unmatch", "--", STATE_PREFIX.slice(0, -1)], env),
      ];
      if (run("git", ["rev-parse", "--verify", "-q", `${c}:${STATE_PREFIX.slice(0, -1)}`]).ok)
        steps.push(run("git", ["read-tree", `--prefix=${STATE_PREFIX}`, `${c}:${STATE_PREFIX.slice(0, -1)}`], env));
      const tree = run("git", ["write-tree"], env);
      if (!meta.ok || steps.some((s) => !s.ok) || !tree.ok) return { ok: false, idle: "REBUILD-FAILED", why: `idle REBUILD-FAILED at ${c.slice(0, 7)} — the private index could not be built; nothing moved` };
      const [an, ae, ad, ...msg] = String(meta.out).split("\0");
      const made = run("git", ["commit-tree", tree.out.trim(), "-p", parent, "-m", msg.join("\0").replace(/\s+$/, "")], { GIT_AUTHOR_NAME: an, GIT_AUTHOR_EMAIL: ae, GIT_AUTHOR_DATE: ad });
      if (!made.ok) return { ok: false, idle: "REBUILD-FAILED", why: `idle REBUILD-FAILED at ${c.slice(0, 7)} — commit-tree refused; nothing moved` };
      parent = made.out.trim();
    }
  } finally { try { rmSync(idx, { force: true }); } catch {} }
  const move = run("git", ["read-tree", "-m", "-u", hd, parent]);           // two-way: his dirty paths stay, an overlap refuses
  if (!move.ok) {
    const p = dirtyOverlap(run, hd, parent) || String(move.out).split(/\r?\n/).slice(1).join(" ").trim().slice(0, 100);
    const key = cardOnce(run, `Raat ka state push ruka: origin aage gaya aur ${p} par aapka kaam chal raha hai. Aap merge karein; tab tak push band.`, `groundsman:dirty:${o12}`);
    return { ok: false, idle: "DIRTY-PATH", card: key, why: `idle DIRTY-PATH ${p} — the rebuilt head moves a path that is dirty here; nothing moved` };
  }
  const ref = run("git", ["update-ref", "-m", `groundsman: own state commits rebuilt on origin ${o.slice(0, 7)}`, "HEAD", parent, hd]);
  if (!ref.ok) return { ok: false, idle: "REBUILD-FAILED", why: "idle REBUILD-FAILED — HEAD moved under the rebuild (compare-and-swap refused)" };
  return { ok: true, how: "rebuilt", n: mine.length, to: parent };
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
  const h = heldCommits(run);                       // ROW 808 (2): the RANGE first — a held landing refuses before anything stages
  if (!h.ok) return { ok: true, ticked: true, pushed: false, refused: true, why: h.why };
  if (h.held.length) return refuseHeld(run, h, { ticked: true });
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
  const run = (c, a, x) => (deps.sh || sh)(c, a, deps, x);
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
  const fetched = run("git", ["fetch", "origin", "main"]);   // ROW 1029 (3): every night, before the range and the staging
  if (!fetched.ok) return withVerdict({ ok: true, pushed: false, idle: "NO-FETCH", why: `idle NO-FETCH — origin could not be read (${String(fetched.out).split(/\r?\n/)[0].slice(0, 100)}); nothing staged, tomorrow retries` });
  const h = heldCommits(run);                       // ROW 808 (2): the RANGE first — after the read-back, before staging
  if (!h.ok) return withVerdict({ ok: true, pushed: false, refused: true, why: h.why });
  if (h.held.length) return withVerdict(refuseHeld(run, h));
  const met = meetOrigin(run);                      // ROW 1029 (3): a moved origin is met (ff, or rebuilt by plumbing) or idles with ONE card
  if (!met.ok) return withVerdict({ ok: true, pushed: false, idle: met.idle, card: met.card || null, why: met.why });
  const add = run("git", ["add", "-u", "--", ...PUBLISH_ALLOWLIST]);
  if (!add.ok) return withVerdict({ ok: true, pushed: false, why: `staging refused: ${add.out}` });
  const diff = run("git", ["diff", "--cached", "--quiet"]);
  if (diff.ok) {
    // ROW 1029 (3): nothing new to stage, but own commits still unpushed (rebuilt tonight, or a past night's refused push) → push them
    const ahead = linesOf(run("git", ["rev-list", "@{u}..HEAD"]).out);
    if (!ahead.length) return withVerdict({ ok: true, pushed: false, met: met.how, why: "nothing public to push" });
    const pushOwn = run("git", ["push"]);
    if (!pushOwn.ok) return withVerdict({ ok: true, pushed: false, idle: "PUSH-RACE", met: met.how, why: `idle PUSH-RACE — push refused (${pushOwn.out.slice(0, 120)}) — tomorrow's pass retries; nothing forced` });
    return withVerdict({ ok: true, pushed: true, met: met.how });
  }
  const staged = run("git", ["diff", "--cached", "--name-only"]);
  if (!staged.ok) return withVerdict({ ok: true, pushed: false, refused: true, why: "refused: could not read the staged set back to verify it" });
  const offending = String(staged.out || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean).filter(p => !isPublishablePath(p));
  if (offending.length) return withVerdict({ ok: true, pushed: false, refused: true, why: `refused: ${offending.length} staged path(s) off the publish allowlist (${offending.slice(0, 3).join(", ")}) — a human publishes those, never this lane` });
  run("git", ["commit", "-m", `groundsman: unattended state push (${hostId}) — his 9 Aug 2026 ruling, receipt in pushOnlyPass`]);
  const push = run("git", ["push"]);
  if (!push.ok) return withVerdict({ ok: true, pushed: false, idle: "PUSH-RACE", met: met.how, why: `idle PUSH-RACE — push refused (${push.out.slice(0, 120)}) — tomorrow's pass retries; nothing forced` });
  return withVerdict({ ok: true, pushed: true, met: met.how });
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
    const mkSh = (fail = {}, stagedNames = "dressing-room/state/brain_config.json\n") => (c, a) => {
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
    assert("allowlist (row 769): the tracked bus files are publishable, and NO machinery is — scripts/, skills, setup/, hooks/, package.json, README.md all refuse",
      isPublishablePath("dressing-room/state/brain_config.json") && isPublishablePath("dressing-room/state/registry.json")
      && !isPublishablePath("scripts/brain.mjs") && !isPublishablePath(".claude/skills/learn/SKILL.md") && !isPublishablePath("setup/INSTALL_TASKS.ps1")
      && !isPublishablePath("hooks/pre-commit") && !isPublishablePath("package.json") && !isPublishablePath("README.md"));
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
    // ROW 769 — STATE ONLY, planted both ways: a machinery path staged ALONE (the dcd23ff shape: one dirty tracked
    // script and nothing personal) refuses the whole push; the state path above (r6) still pushes.
    for (const machinery of ["scripts/brain.mjs", ".claude/skills/learn/SKILL.md", "package.json", "setup/INSTALL_TASKS.ps1", "hooks/pre-commit"]) {
      const cm = [];
      const rm = await pushOnlyPass("laptop", {
        sh: (c, a) => { cm.push(c + " " + a.join(" ")); if (c === "git" && a[0] === "diff" && a.includes("--name-only")) return { ok: true, out: machinery + String.fromCharCode(10) }; if (c === "git" && a[0] === "diff") return { ok: false, out: "" }; return { ok: true, out: "" }; },
      });
      assert(`ROW 769 · STATE ONLY — ${machinery} staged alone REFUSES the unattended push (no commit, no push)`,
        rm.pushed === false && rm.refused === true && !cm.some(x => x.includes("commit")) && !cm.some(x => x.startsWith("git push")));
    }
    assert("ROW 769 · STATE ONLY — lock 1 stages dressing-room/state/ and nothing else",
      c6.some(x => x === "git add -u -- dressing-room/state/") && !c6.some(x => x.startsWith("git add") && /scripts|setup|hooks|package|README/.test(x)));
    const r8 = await pushOnlyPass("laptop", {
      sh: (c, a) => { if (c === "git" && a[0] === "diff" && !a.includes("--name-only")) return { ok: true, out: "" }; return { ok: true, out: "" }; },
    });
    assert("D3: a clean index is 'nothing public to push', never an empty commit",
      r8.pushed === false && /nothing public/.test(r8.why));
    const r9 = await pushOnlyPass("laptop", {
      sh: (c, a) => { if (c === "git" && a[0] === "push") return { ok: false, out: "rejected (fetch first)" }; if (c === "git" && a[0] === "diff" && a.includes("--name-only")) return { ok: true, out: "dressing-room/state/brain_config.json\n" }; if (c === "git" && a[0] === "diff") return { ok: false, out: "" }; return { ok: true, out: "" }; },
    });
    assert("D3: a rejected push is reported honestly and NEVER forced (tomorrow retries)",
      r9.pushed === false && /retries/.test(r9.why) && /nothing forced/.test(r9.why));
    // ROW 1029 (3) — the fetch comes first, every night; a fetch that fails stages nothing (the real-git plants: ci/mgrd/)
    assert("ROW 1029 (3) · the push pass FETCHES origin main before the range read and before staging",
      c6.some(x => x === "git fetch origin main") && c6.findIndex(x => x === "git fetch origin main") < c6.findIndex(x => x.startsWith("git add -u --"))
      && c6.findIndex(x => x === "git fetch origin main") < c6.findIndex(x => x.startsWith("git log")));
    const c10 = [];
    const r10 = await pushOnlyPass("laptop", { sh: (c, a) => { c10.push(c + " " + a.join(" ")); if (c === "git" && a[0] === "fetch") return { ok: false, out: "fatal: unable to access" }; return { ok: true, out: "" }; } });
    assert("ROW 1029 (3) · a fetch that fails idles NO-FETCH: nothing staged, nothing committed, nothing pushed",
      r10.pushed === false && r10.idle === "NO-FETCH" && !c10.some(x => x.startsWith("git add")) && !c10.some(x => x.startsWith("git commit")) && !c10.some(x => x.startsWith("git push")));

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

  // ROW 808 (2) — THE HELD-LANDING REFUSAL, planted both ways. The mock answers `git log … @{u}..HEAD` with the range a
  // runner's held landings left on main on 18 Oct (a skill landing, then a state-only birth commit).
  {
    const RS = String.fromCharCode(30), NL = String.fromCharCode(10);
    const rec = (sha, subject, paths) => RS + sha + " " + subject + NL + NL + paths.join(NL) + NL;
    const DOOR = "6826d2ab6d5f45c719a48f7a5a82cc623b23e68a", BIRTH = "5049da33baf497150eb431303479d18774a20081", OWN = "04071ab000000000000000000000000000000aaa";
    const mk = (range, calls, logFails = false) => (c, a) => {
      calls.push(c + " " + a.join(" "));
      if (c === "git" && a[0] === "log") return logFails ? { ok: false, out: "fatal: no upstream configured for branch" } : { ok: true, out: range };
      if (c === "git" && a[0] === "diff" && a.includes("--name-only")) return { ok: true, out: "dressing-room/state/brain_config.json" + NL };
      if (c === "git" && a[0] === "diff") return { ok: false, out: "" };
      return { ok: true, out: "" };
    };
    const birth = rec(BIRTH, "state: the three UNTRACKED state files are added by pathspec", ["dressing-room/state/daily_green.jsonl"]);
    const heldRange = rec(DOOR, "rung L3 THE DOOR: the learn and forge skills CONSUME the resume pointer", [".claude/skills/forge/SKILL.md", ".claude/skills/learn/SKILL.md"]) + birth;
    const c1 = [];
    const r1 = await pushOnlyPass("laptop", { sh: mk(heldRange, c1) });
    const cards = c1.filter((x) => x.includes("captains_call.mjs") && x.includes(" file "));
    assert("ROW 808 (2) · A HELD LANDING IN origin..HEAD REFUSES the unattended push before anything stages: no add, no commit, no push, both held shas named",
      r1.pushed === false && r1.refused === true && (r1.held || []).join(" ") === DOOR + " " + BIRTH
      && !c1.some((x) => x.startsWith("git add")) && !c1.some((x) => x.startsWith("git commit")) && !c1.some((x) => x.startsWith("git push")));
    assert("ROW 808 (2) · it cards him ONCE: one captains_call file keyed by the first held sha (the same hold never re-mints), and the read-back still rides the refusal",
      cards.length === 1 && cards[0].includes("--key groundsman:held:" + DOOR.slice(0, 12)) && !!r1.readback);
    const c2 = [];
    const r2 = await pushOnlyPass("laptop", { sh: mk(birth, c2) });
    assert("ROW 808 (2) · a STATE-ONLY commit that is not this lane's own is still held (the 5049da33 shape): refused, no push",
      r2.refused === true && r2.pushed === false && !c2.some((x) => x.startsWith("git push")));
    const c3 = [];
    const r3 = await pushOnlyPass("laptop", { sh: mk(rec(OWN, "groundsman: unattended state push (laptop) — his 9 Aug 2026 ruling", ["scripts/brain.mjs"]), c3) });
    assert("ROW 808 (2) · this lane's own SUBJECT on a machinery path is held too (a subject alone never passes)",
      r3.refused === true && r3.pushed === false && !c3.some((x) => x.startsWith("git push")));
    const c4 = [];
    const r4 = await pushOnlyPass("laptop", { sh: mk(rec(OWN, "groundsman: unattended state push (laptop) — his 9 Aug 2026 ruling", ["dressing-room/state/audit_ledger.jsonl"]), c4) });
    const r4e = await pushOnlyPass("laptop", { sh: mk("", []) });
    assert("ROW 808 (2) · the other way: this lane's OWN unpushed state commit (yesterday's rejected push) and an empty range both still push, and card nothing",
      r4.pushed === true && c4.some((x) => x.startsWith("git push")) && !c4.some((x) => x.includes("captains_call.mjs")) && r4e.pushed === true);
    const c5 = [];
    const r5 = await pushOnlyPass("laptop", { sh: mk("", c5, true) });
    assert("ROW 808 (2) · a range that cannot be read FAILS CLOSED: refused, nothing staged, nothing pushed",
      r5.refused === true && r5.pushed === false && !c5.some((x) => x.startsWith("git add")) && !c5.some((x) => x.startsWith("git push")));
    const c6n = [];
    const r6n = await nightPass("pi1", { sh: mk(heldRange, c6n), read: () => mkLease("laptop", "lap1", 25), write: () => {}, now });
    assert("ROW 808 (2) · the Kennel's night pass carries the same refusal after its tick: no commit, no push",
      r6n.refused === true && r6n.pushed === false && r6n.ticked === true && !c6n.some((x) => x.startsWith("git commit")) && !c6n.some((x) => x.startsWith("git push")));
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
    const d = laneDay(); console.log(`groundsman: day-key ${d.day} (${d.source})`);
    return;
  }
  console.log("groundsman.mjs — heartbeat | night --host <id> | push | status | selftest");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { leaseState, heartbeat, tryTakeLease, mayTick, nightPass, pushOnlyPass, TTL_MIN, isPublishablePath, PUBLISH_ALLOWLIST };
