#!/usr/bin/env node
// @ts-check
// ============================================================================
// muna.mjs · ARSENAL AI FC — LANDING WITH NO SESSION AWAKE (unit muna; spec ci/muna/MUNA_SPEC.md; ruling row 1301)
//   SOLE WRITER of: .git/muna_journal.jsonl in the clone it runs in (inside .git: never tracked, never published) — and
//   NOTHING in dressing-room/state/. It moves no ref of main, publishes nothing, edits no file of the tree. The ONLY
//   writer of main is the LANDING COMMAND the door file names (lane M's wrapper on his laptop, which runs
//   scripts/land.mjs as it stands and writes the landed event; the bare verb in the witness), run as a child, ONCE.
// ----------------------------------------------------------------------------
// THE RULINGS IT CARRIES (row 1301): F1 A the adoption is lane M's sha gate, asked per (unit, sha), its argv read
//   from the door file — never a branch name, a commit message or a green verdict alone · F2 A every pass needs the
//   verb's own count at its ruled N (a human stop resets it; muna then stands down) · F3 A the names result is the
//   runner's, emitted at cut time as <unit>_<sha>.json into a names directory OUTSIDE the work tree; absent = LEFT ·
//   F5 A which stop needs a human is read from the row the verb itself appended to .git/land_ledger.jsonl ·
//   F6 A this journal lives in .git · F7 B no live witness is ever passed · F8 A one landing command per pass,
//   whatever it answers · F9 B one card per landing whose acts list is not empty · F10 A no lock (ff-only and a
//   plain non-forced publish make a race safe; the task's MultipleInstances is IgnoreNew).
//   A re-cut (a tip whose parent is not origin main) is NEVER done here: it is LEFT for the runner and named.
// THE DOOR FILE: .git/muna_door.json (git rev-parse --git-path muna_door.json), written by the runner, never by muna:
//   { "gate": [argv…], "gate_cwd": "<dir>", "land": [argv…], "land_cwd": "<dir>", "names_dir": "<dir outside the tree>" }
//   gate: muna appends  <unit> --sha <40-hex>   (exit 0 GO, anything else REFUSED; a GO line may name `row <n>`)
//   land: a template; each element has {unit} {sha} {names} {row} replaced (a {row} with no row from the gate = LEFT).
// NO MODEL CALL, no key (ANTHROPIC_API_KEY set ⇒ refused at the door), no port, no socket, no network of its own
//   beyond git's own reads of origin and the public verdict reader.
// MODES: node scripts/muna.mjs pass | status
// EXIT: 0 a pass that ran (LANDED · WAIT · LEFT · STAND-DOWN · IDLE · NO-DOOR — ONE line each) · 1 muna could not run
// The witness of this organ is ci/muna/witness_muna.mjs (real git, a bare origin, every clause planted both ways).
// ============================================================================
import { spawnSync } from "node:child_process";
import { readFileSync, appendFileSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative, isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LAND_PREFIX = "refs/heads/land/";

/** @param {string[]} args */
function git(args) {
  const r = spawnSync("git", args, { cwd: ROOT, encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 });
  return { ok: r.status === 0, out: String(r.stdout || "").trim() };
}
/** @param {string[]} argv @param {string} cwd */
function child(argv, cwd) {
  const [cmd, ...rest] = argv;
  const r = spawnSync(cmd === "node" ? process.execPath : cmd, rest, { cwd, encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 });
  const out = String(r.stdout || "") + String(r.stderr || "");
  const ls = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  return { code: r.status, out, lines: ls, last: ls[ls.length - 1] || "" };
}
const nodeScript = (name, args) => child([process.execPath, join(ROOT, "scripts", name), ...args], ROOT);
const gitPath = (name) => { const r = git(["rev-parse", "--git-path", name]); return r.ok ? resolve(ROOT, r.out) : null; };
const readJsonl = (p) => (p && existsSync(p) ? readFileSync(p, "utf8").split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : []);

// ── THE JOURNAL (sole writer) ───────────────────────────────────────────────────────────────────────────────────
function journal(row) { const p = gitPath("muna_journal.jsonl"); if (p) { try { appendFileSync(p, JSON.stringify({ ts: new Date().toISOString(), ...row }) + "\n"); } catch { /* status names an unwritable journal */ } } }

// ── THE DOOR ────────────────────────────────────────────────────────────────────────────────────────────────────
/** @returns {{ ok: true, door: any } | { ok: false, why: string }} */
function readDoor() {
  const p = gitPath("muna_door.json");
  if (!p || !existsSync(p)) return { ok: false, why: ".git/muna_door.json is absent" };
  let d; try { d = JSON.parse(readFileSync(p, "utf8")); } catch { return { ok: false, why: ".git/muna_door.json is unreadable" }; }
  const argv = (a) => Array.isArray(a) && a.length > 0 && a.every((x) => typeof x === "string" && x.length > 0);
  if (!argv(d.gate)) return { ok: false, why: "the door names no gate argv" };
  if (!argv(d.land)) return { ok: false, why: "the door names no landing command" };
  if (typeof d.names_dir !== "string" || !d.names_dir) return { ok: false, why: "the door names no names directory" };
  const top = git(["rev-parse", "--show-toplevel"]).out || ROOT;
  const rel = relative(resolve(top), resolve(d.names_dir));
  if (!rel.startsWith("..") && !isAbsolute(rel)) return { ok: false, why: "the names directory is inside the work tree (the names tool refuses it, and .git is inside it)" };
  return { ok: true, door: d };
}

// ── THE STEPS ───────────────────────────────────────────────────────────────────────────────────────────────────
function licence() {
  const r = nodeScript("land.mjs", ["count"]);
  const m = /unattended (\d+) of (\d+)/.exec(r.last);
  if (r.code !== 0 || !m) return { ok: false, line: r.last || "the verb's count could not be read" };
  return { ok: Number(m[1]) >= Number(m[2]), line: r.last };
}
function landRefs() {
  const r = git(["ls-remote", "origin", `${LAND_PREFIX}*`]);
  if (!r.ok) return null;
  return r.out.split(/\r?\n/).map((l) => l.trim().split(/\s+/)).filter(([s, ref]) => /^[0-9a-f]{40}$/.test(s || "") && String(ref || "").startsWith(LAND_PREFIX))
    .map(([s, ref]) => ({ unit: ref.slice(LAND_PREFIX.length), sha: s })).filter((x) => /^[a-z0-9-]+$/.test(x.unit));
}
/** @param {any} door @param {string} unit @param {string} sha */
function adopted(door, unit, sha) {
  const r = child([...door.gate, unit, "--sha", sha], door.gate_cwd || ROOT);
  const row = /\brow (\d+)\b/.exec(r.last);
  return { go: r.code === 0, row: row ? row[1] : null, line: r.last };
}
function verdict(sha) {
  const r = nodeScript("ci_verdict.mjs", [sha]);
  const line = r.lines.find((l) => l.startsWith("ci_verdict ")) || r.last;
  const m = /^ci_verdict \S+ (GREEN|RED|PENDING|NONE|UNREADABLE)\b/.exec(line);
  const v = m ? m[1] : "UNREADABLE";
  return { green: v === "GREEN" && r.code === 0, v, line };
}
/** the row the verb itself appended for this attempt (F5 A) @param {number} since @param {string} unit */
function verbRow(since, unit) {
  const rows = readJsonl(gitPath("land_ledger.jsonl")).filter((r) => r.unit === unit && Date.parse(r.ts) >= since);
  return rows[rows.length - 1] || null;
}
/** @param {string} line @param {string} key @param {string} why */
function card(line, key, why) {
  const r = nodeScript("captains_call.mjs", ["file", "--line", line, "--key", key, "--why-code-cannot-decide", why]);
  return r.last;
}

// ── THE PASS ────────────────────────────────────────────────────────────────────────────────────────────────────
function pass() {
  const say = (outcome, extra = {}, text = "") => { journal({ outcome, ...extra }); console.log(`muna ${outcome}${text ? " · " + text : ""}`); return 0; };
  if (process.env.ANTHROPIC_API_KEY) { console.log("muna REFUSED · ANTHROPIC_API_KEY is set — no organ runs on an API key"); return 1; }
  if (!git(["rev-parse", "--git-dir"]).ok) { console.log("muna REFUSED · not a git work tree"); return 1; }
  // A · the L2 licence, the verb's own count (F2 A)
  const lic = licence();
  if (!lic.ok) return say("STAND-DOWN", { why: lic.line }, `the verb's count is not at its N — ${lic.line}`);
  // B · the door (F1 A)
  const d = readDoor();
  if (!d.ok) { const c = card(`Muna ka darwaza nahi khula: ${d.why}. Runner: .git/muna_door.json dekhein`, "muna:door", "the door file names the campaign's own gate, landing command and names directory, which live off the repo on his machine — code cannot invent them"); return say("NO-DOOR", { why: d.why, card: c }, d.why); }
  const door = d.door;
  // C · the land refs, from origin itself; the adoption, per exact (unit, sha), through lane M's gate
  const refs = landRefs();
  if (!refs) return say("WAIT", { name: "NO-LS-REMOTE" }, "origin's land refs could not be read");
  if (!refs.length) return say("IDLE", {}, "no land ref on origin");
  const cand = [], refused = [];
  for (const r of refs) { const a = adopted(door, r.unit, r.sha); (a.go ? cand : refused).push({ ...r, row: a.row, gate: a.line }); }
  if (!cand.length) return say("IDLE", { refused: refused.map((x) => `${x.unit}@${x.sha.slice(0, 7)}`) }, `${refused.length} land ref(s), none adopted at its sha`);
  // D · the parent check — a re-cut is never muna's (§5)
  if (!git(["fetch", "-q", "--no-tags", "origin", "main"]).ok) return say("WAIT", { name: "NO-FETCH" }, "origin main could not be fetched");
  const O = git(["rev-parse", "--verify", "-q", "refs/remotes/origin/main^{commit}"]).out;
  const shas = new Set(cand.map((c) => c.sha));
  const left = [];
  let pick = null;
  for (const c of cand) {
    if (!git(["fetch", "-q", "--no-tags", "origin", `${LAND_PREFIX}${c.unit}`]).ok) { left.push({ unit: c.unit, sha: c.sha, why: "NO-FETCH" }); continue; }
    const ps = git(["rev-list", "--parents", "-n", "1", c.sha]).out.split(/\s+/).slice(1);
    if (ps.length === 1 && ps[0] === O) { if (!pick) pick = c; continue; }
    left.push({ unit: c.unit, sha: c.sha, why: ps.length === 1 && shas.has(ps[0]) ? "STACKED" : "RE-CUT" });
  }
  const leftTxt = left.map((x) => `${x.why} ${x.unit} ${x.sha.slice(0, 7)}`).join(", ");
  if (!pick) return say("LEFT", { left }, `nothing on origin main to land — left for the runner: ${leftTxt}`);
  // E · the names result (F3 A): the runner's, emitted at cut time; absent = LEFT
  const names = join(door.names_dir, `${pick.unit}_${pick.sha}.json`);
  if (!existsSync(names)) { left.push({ unit: pick.unit, sha: pick.sha, why: "NO-NAMES-RESULT" }); return say("LEFT", { left }, `no names result ${pick.unit}_${pick.sha.slice(0, 7)}… — left for the runner${leftTxt ? "; also " + leftTxt : ""}`); }
  // F · the legs, the public reader at the tip sha (a pre-filter: the verb reads it again at T, C1)
  const v = verdict(pick.sha);
  if (!v.green) return say("WAIT", { unit: pick.unit, sha: pick.sha, name: `VERDICT-${v.v}`, left }, `${pick.unit} ${pick.sha.slice(0, 7)} verdict ${v.v} — ${v.line}`);
  // G · THE LANDING COMMAND from the door, ONCE (F8 A); no live witness ever (F7 B)
  const vals = { unit: pick.unit, sha: pick.sha, names, row: pick.row || "" };
  if (door.land.some((x) => x.includes("{row}")) && !pick.row) { left.push({ unit: pick.unit, sha: pick.sha, why: "NO-ROW" }); return say("LEFT", { left }, `the gate named no row for ${pick.unit} and the landing command needs one`); }
  const argv = door.land.map((x) => x.replace(/\{(unit|sha|names|row)\}/g, (_, k) => vals[k]));
  const t0 = Date.now() - 1000;
  const r = child(argv, door.land_cwd || ROOT);
  const verbLine = r.lines.find((l) => /^(LANDED|REFUSED|STOP|PUSHED NO) /.test(l)) || r.last;
  if (r.code === 0 && /^LANDED /.test(verbLine)) {
    const am = /· acts (.+?) · stale units/.exec(verbLine);
    const acts = am && am[1] !== "none" ? am[1] : null;
    let c = null;
    if (acts) c = card(`Muna ne ${pick.unit} (${pick.sha.slice(0, 7)}) land kiya; ab haath ka kaam: ${acts.slice(0, 60)}. Runner: node scripts/muna.mjs status`, `muna:acts:${pick.unit}:${pick.sha.slice(0, 12)}`, "the verb prints the acts a landing needs and runs none; running them on his machine is a hand act");
    return say("LANDED", { unit: pick.unit, sha: pick.sha, line: verbLine, card: c, left }, verbLine);
  }
  // H · a refusal or a stop, the verb's own: which needs a human is the verb's row (F5 A), never a list here
  const row = verbRow(t0, pick.unit);
  const name = (row && row.name) || (/^(?:REFUSED|STOP|PUSHED NO) (\S+)/.exec(verbLine) || [])[1] || "UNKNOWN";
  let c = null;
  if (row && row.human && name !== "PUSH-REJECTED") c = card(`Landing ${pick.unit} (${pick.sha.slice(0, 7)}) ruki: ${name} — haath chahiye. Runner: node scripts/muna.mjs status`, `muna:stop:${pick.unit}:${pick.sha.slice(0, 12)}:${name}`, "the landing verb names this stop as one a human must resolve; muna never works around a refusal of the verb");
  return say(row && row.human ? "STOP" : "WAIT", { unit: pick.unit, sha: pick.sha, name, line: verbLine, card: c, left }, verbLine);
}

function status() {
  const rows = readJsonl(gitPath("muna_journal.jsonl"));
  const last = rows[rows.length - 1];
  const count = nodeScript("land.mjs", ["count"]).last;
  if (!last) { console.log(`muna · never ran · ${count}`); return 0; }
  const left = Array.isArray(last.left) && last.left.length ? ` · left for the runner: ${last.left.map((x) => `${x.why} ${x.unit} ${String(x.sha).slice(0, 7)}`).join(", ")}` : "";
  console.log(`muna · last pass ${last.ts} ${last.outcome}${last.unit ? ` ${last.unit} ${String(last.sha).slice(0, 7)}` : ""}${last.name ? ` ${last.name}` : ""}${left} · ${count}`);
  return 0;
}

function main() {
  const mode = process.argv[2] || "";
  if (mode === "pass") return pass();
  if (mode === "status") return status();
  console.log("muna.mjs pass | status");
  return mode ? 0 : 2;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main();
