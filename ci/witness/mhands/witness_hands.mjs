#!/usr/bin/env node
// ============================================================================
// ci/witness/mhands/witness_hands.mjs — UNIT mhands · HIS HANDS OFF THE RUNNER (spec ci/mwit/MWIT_SPEC.md @ 88bf69d,
//   B-hands:clicks-off :201-217 and B-hands:fresh-runner :219-231; rulings forks rows 1162 / 1163)
// ----------------------------------------------------------------------------
// USAGE (the clause commands — the receipt organ's form, `node <tracked path> [plain args]`, scripts/rung_receipt.mjs:224):
//   node ci/witness/mhands/witness_hands.mjs clicks [--day <YYYY-MM-DD IST>] [--campaign <dir>]
//   node ci/witness/mhands/witness_hands.mjs fresh  --campaign <dir> [--day <YYYY-MM-DD IST>]
//   node ci/witness/mhands/witness_hands.mjs plants                 (the self-plants, both clauses; the suite member's door, row 1162 (2):
//     one `CLAUSE <id> GREEN|RED · k/n plant(s)` line per clause, last line `PLANTS mhands · k of n plant(s) as expected`)
//   node ci/witness/mhands/witness_hands.mjs --org <dir> --base-org <dir> [--only <clause>[,<clause>…]]   (the unit's whole witness)
// EXIT LAW (spec §0): 0 the clause HOLDS · 1 RED (read, and it does not hold) · 2 UNREAD (a fact it needs is absent/unreadable — never
//   a green). Where one half reads RED and another reads UNREAD, the read RED wins (a read fact is reported, never hidden behind a miss).
// CONTRACT — the clause verbs READ ONLY: no file is written, no port bound, no service named, no process outlives the run, no model,
//   no network. The home is re-pointable ONLY by the env door MHANDS_HOME and the managed-policy folder ONLY by MHANDS_MANAGED, each
//   honoured only when it resolves under os.tmpdir() (outside it the verb refuses: exit 2). On the cloud (CLAUDE_CODE_REMOTE=true) with
//   no door, the user file is the cloud's, not his laptop's: UNREAD (row 1162 (5): a fact only his laptop holds reads UNREAD, never green).
//   Every plant runs on a COPY under os.tmpdir() (the witness, scripts/study_scope.mjs, the runner skill; a planted HOME, managed folder,
//   campaign dir and transcripts); no git repo is planted; every line read is split on \r?\n.
// CLAUSE clicks (B-hands:clicks-off). The settings chain Claude Code reads, precedence highest first (code.claude.com/docs/en/settings.md
//   "Settings precedence"; the --settings flag is a launch fact this file cannot read): managed (the OS folder's managed-settings.json, then
//   managed-settings.d/*.json in name order) > project .claude/settings.local.json > project .claude/settings.json > user
//   ~/.claude/settings.json. `auto` and `bypassPermissions` set in a project or local file are IGNORED by Claude Code (settings.md, "A value
//   you set is ignored"), so they are skipped here too. The effective permissions.defaultMode must be one of NO_PROMPT_MODES; for
//   bypassPermissions the interactive start's one-time warning is itself a click, so skipDangerousModePermissionPrompt must be true in a
//   user, local or managed file, and no file may carry permissions.disableBypassPermissionsMode "disable". REAL-DAY HALF: every runner
//   transcript of the day (a transcript whose first human prompt is a runner opener — the runner skill's OWN trigger list, read from its
//   frontmatter by study_scope.mjs learnTriggers, or a /runner slash call) carries zero HAND decisions: a tool-result row whose
//   permissionDecision.source is not in HANDS_FREE_SOURCES (measured in this cloud session's own transcript, 19 Nov 2026: "config").
//   The transcript format is internal and undocumented (settings docs, sessions.md) — the measured field is named in the proof (FORK Fh3).
//   The day: --day, else the latest IST day any runner transcript touches. No runner transcript → UNREAD.
// CLAUSE fresh (B-hands:fresh-runner). --campaign <dir> holds launches.jsonl (FORK Fh2: the campaign's launch record is NAMED N7; this is
//   the contract this witness reads): one row per launch { unit, session_id (the transcript id), at (ISO), brief_sha256? }. For every
//   launch of the window (--day, else the latest IST day any row is at): a DISTINCT session id per unit; the session's transcript (found by
//   name under <home>/.claude/projects/*/) begins at that unit — its first human prompt (study_scope.mjs firstHumanPrompt) hashes to
//   brief_sha256 when the row carries it, else names the unit id as a word; and no transcript carries a human /clear prompt (the /clear of
//   study_scope.mjs SLASH_NOISE, read through its humanText). No campaign, no launch in the window, or a transcript absent → UNREAD.
// BOTH-WAYS (--org/--base-org): each clause's plants run against the --org copy (must read GREEN: every plant its stated exit) and the
//   --base-org copy (must read RED: the base has no clause command, or its plants miss). BOUND: `git diff --name-only <base HEAD> <org HEAD>`
//   names only ci/witness/mhands/** and ci/mhands/**. LAST: no node process naming this run's temp root survives.
// LAST LINE: GREEN MHANDS <what> · <n> clause(s) (exit 0) or RED MHANDS · <clauses> (exit 1)
// ============================================================================
import { readFileSync, readdirSync, existsSync, realpathSync, mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync, statSync } from "node:fs";
import { join, dirname, resolve, relative, isAbsolute, sep } from "node:path";
import { homedir, tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const TREE = resolve(HERE, "..", "..", "..");
const SELF_REL = "ci/witness/mhands/witness_hands.mjs";
const UNIT = "MHANDS";
const CLAUSES = Object.freeze(["B-hands:clicks-off", "B-hands:fresh-runner"]);
const NAMED_PREFIXES = Object.freeze(["ci/witness/mhands/", "ci/mhands/"]);
// The modes in which a session asks the human nothing (code.claude.com/docs/en/permission-modes.md, "What runs without asking":
// bypassPermissions "Everything"; auto "Everything, with background safety checks"; dontAsk denies what would prompt). FORK Fh1.
export const NO_PROMPT_MODES = Object.freeze(["bypassPermissions", "auto", "dontAsk"]);
const PROJECT_IGNORED = Object.freeze(["bypassPermissions", "auto"]);
export const HANDS_FREE_SOURCES = Object.freeze(["config"]);

const ss = await import(pathToFileURL(join(TREE, "scripts", "study_scope.mjs")).href);
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null; };
const istDay = (iso) => { const t = Date.parse(String(iso || "")); return Number.isFinite(t) ? new Date(t + 330 * 60000).toISOString().slice(0, 10) : null; };
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const fold = (s) => String(s).replace(/\r\n/g, "\n").trim();
const readLines = (p) => readFileSync(p, "utf8").split(/\r?\n/).filter((l) => l.trim());
const parseJsonl = (p) => readLines(p).map((l) => { try { return JSON.parse(l); } catch { return undefined; } });

// ── THE DOORS (env, honoured only under os.tmpdir()) ──────────────────────────────────────────────────────────────────
const TMP = realpathSync(tmpdir());
function underTmp(p) {
  let r; try { r = realpathSync(resolve(p)); } catch { return false; }
  const rel = relative(TMP, r);
  return !!rel && !rel.startsWith("..") && !isAbsolute(rel);
}
function door(name) {
  const v = process.env[name];
  if (!v) return { set: false };
  return underTmp(v) ? { set: true, path: realpathSync(resolve(v)) } : { set: true, refused: `${name} does not resolve under os.tmpdir() — refused` };
}
function managedDir(platform = process.platform) {
  // code.claude.com/docs/en/managed-settings.md, "Deploy a managed settings file"
  if (platform === "win32") return "C:\\Program Files\\ClaudeCode";
  if (platform === "darwin") return "/Library/Application Support/ClaudeCode";
  return "/etc/claude-code";
}
function homeOf() {
  const d = door("MHANDS_HOME");
  if (d.refused) return { unread: d.refused };
  if (d.set) return { home: d.path };
  if (process.env.CLAUDE_CODE_REMOTE === "true") return { unread: "on the cloud: his user settings and transcripts are on his laptop (row 1162 (5), NAMED N6/N7)" };
  return { home: homedir() };
}

// ── THE SETTINGS CHAIN ────────────────────────────────────────────────────────────────────────────────────────────────
/** One settings file: { name, scope, absent } | { name, scope, obj } | { name, scope, bad }. */
function readSettings(path, scope) {
  if (!existsSync(path)) return { path, scope, absent: true };
  try { const obj = JSON.parse(readFileSync(path, "utf8")); return obj && typeof obj === "object" ? { path, scope, obj } : { path, scope, bad: "not an object" }; }
  catch (e) { return { path, scope, bad: String(e.message || e).slice(0, 80) }; }
}
export function settingsChain({ home, root = TREE, managed }) {
  const chain = [];
  chain.push(readSettings(join(managed, "managed-settings.json"), "managed"));
  const dDir = join(managed, "managed-settings.d");
  if (existsSync(dDir)) { let names = []; try { names = readdirSync(dDir).filter((n) => n.endsWith(".json")).sort(); } catch { /* unreadable dir */ }
    // the .d files merge AFTER the base file, so a later one wins: highest first means reversed
    for (const n of names.reverse()) chain.push(readSettings(join(dDir, n), "managed")); }
  chain.push(readSettings(join(root, ".claude", "settings.local.json"), "local"));
  chain.push(readSettings(join(root, ".claude", "settings.json"), "project"));
  chain.push(readSettings(join(home, ".claude", "settings.json"), "user"));
  return chain;   // highest precedence first
}
export function effectiveMode(chain) {
  const bad = chain.filter((f) => f.bad);
  if (bad.length) return { unread: `unparseable settings: ${bad.map((f) => `${f.scope} (${f.bad})`).join("; ")}` };
  const files = chain.filter((f) => f.obj);
  let mode = null, from = null;
  for (const f of files) {
    const m = f.obj.permissions && typeof f.obj.permissions === "object" ? f.obj.permissions.defaultMode : undefined;
    if (typeof m !== "string" || !m) continue;
    if ((f.scope === "project" || f.scope === "local") && PROJECT_IGNORED.includes(m)) continue;   // ignored by Claude Code
    mode = m === "manual" ? "default" : m; from = f.scope; break;
  }
  const disabled = files.some((f) => f.obj.permissions && f.obj.permissions.disableBypassPermissionsMode === "disable");
  const skip = files.some((f) => ["user", "local", "managed"].includes(f.scope) && f.obj.skipDangerousModePermissionPrompt === true);
  if (!mode) return { ok: false, why: `no permissions.defaultMode in any file of the chain (${files.map((f) => f.scope).join(", ") || "none present"})` };
  if (!NO_PROMPT_MODES.includes(mode)) return { ok: false, why: `effective defaultMode ${mode} (from ${from}) is a prompting mode` };
  if (mode === "bypassPermissions" && disabled) return { ok: false, why: "bypassPermissions is disabled by permissions.disableBypassPermissionsMode" };
  if (mode === "bypassPermissions" && !skip) return { ok: false, why: "bypassPermissions without skipDangerousModePermissionPrompt: the first interactive start asks him" };
  return { ok: true, why: `effective defaultMode ${mode} (from ${from})` };
}

// ── THE TRANSCRIPTS ───────────────────────────────────────────────────────────────────────────────────────────────────
const RUNNER_SKILL = (root) => join(root, ".claude", "skills", "runner", "SKILL.md");
const RUNNER_SLASH = /<command-name>\/runner\b/i;
function isRunnerOpener(text, triggers) { return RUNNER_SLASH.test(String(text || "")) || (triggers.length > 0 && ss.isLearnOpener(String(text || "").replace(/<command-name>\/(learn|forge)\b/gi, ""), triggers)); }
function transcriptsIn(dir) { try { return readdirSync(dir).filter((n) => /^[0-9a-f-]{36}\.jsonl$/i.test(n)).map((n) => join(dir, n)); } catch { return []; } }
function rowDay(o) { return o && typeof o.timestamp === "string" ? istDay(o.timestamp) : null; }
const isClear = (o) => { const t = ss.humanText(o); return t !== null && ss.SLASH_NOISE.test(t) && /\/clear\b/.test(t); };
const isHand = (o) => !!(o && o.permissionDecision && typeof o.permissionDecision === "object" && !HANDS_FREE_SOURCES.includes(o.permissionDecision.source));

export function clicks({ day = null, campaign = null } = {}) {
  const h = homeOf();
  if (h.unread) return { code: 2, line: `UNREAD clicks · ${h.unread}` };
  const md = door("MHANDS_MANAGED");
  if (md.refused) return { code: 2, line: `UNREAD clicks · ${md.refused}` };
  const managed = md.set ? md.path : managedDir();
  const eff = effectiveMode(settingsChain({ home: h.home, managed }));
  // the real-day half
  const triggers = ss.learnTriggers(RUNNER_SKILL(TREE));
  const dirs = [join(h.home, ".claude", "projects", ss.projectSlug(TREE))];
  if (campaign) dirs.push(join(h.home, ".claude", "projects", ss.projectSlug(resolve(campaign))));
  const runner = [];
  for (const p of [...new Set(dirs)].flatMap(transcriptsIn)) { if (isRunnerOpener(ss.firstHumanPrompt(p), triggers)) runner.push(p); }
  let half;
  if (!triggers.length) half = { code: 2, why: "the runner skill's trigger list is unreadable" };
  else if (!runner.length) half = { code: 2, why: "no runner transcript on this machine" };
  else {
    const rows = runner.map((p) => ({ p, rows: parseJsonl(p).filter(Boolean) }));
    const D = day || rows.flatMap((r) => r.rows.map(rowDay)).filter(Boolean).sort().at(-1) || null;
    const ofDay = rows.filter((r) => r.rows.some((o) => rowDay(o) === D));
    if (!D || !ofDay.length) half = { code: 2, why: `no runner transcript touches ${D || "any day"}` };
    else {
      const hands = ofDay.flatMap((r) => r.rows.filter((o) => rowDay(o) === D && isHand(o)));
      const srcs = [...new Set(hands.map((o) => String(o.permissionDecision.source)))];
      half = hands.length ? { code: 1, why: `${hands.length} hand decision(s) on ${D} (source ${srcs.join(",")}) across ${ofDay.length} runner transcript(s)` }
        : { code: 0, why: `0 hand decisions on ${D} across ${ofDay.length} runner transcript(s)` };
    }
  }
  if (eff.unread) return { code: 2, line: `UNREAD clicks · ${eff.unread}` };
  if (!eff.ok) return { code: 1, line: `RED clicks · ${eff.why} · day: ${half.why}` };
  if (half.code === 0) return { code: 0, line: `GREEN clicks · ${eff.why} · ${half.why}` };
  return { code: half.code, line: `${half.code === 1 ? "RED" : "UNREAD"} clicks · ${eff.why} · day: ${half.why}` };
}

export function fresh({ campaign = null, day = null } = {}) {
  if (!campaign) return { code: 2, line: "UNREAD fresh · no --campaign (the launch record is campaign-side, NAMED N7)" };
  const f = join(resolve(campaign), "launches.jsonl");
  if (!existsSync(f)) return { code: 2, line: `UNREAD fresh · no launches.jsonl in the campaign dir (FORK Fh2 / NAMED N7)` };
  const h = homeOf();
  if (h.unread) return { code: 2, line: `UNREAD fresh · ${h.unread}` };
  let rows; try { rows = parseJsonl(f); } catch (e) { return { code: 2, line: `UNREAD fresh · launches.jsonl unreadable (${String(e.message || e).slice(0, 60)})` }; }
  if (rows.some((r) => !r || typeof r !== "object")) return { code: 2, line: "UNREAD fresh · a launches.jsonl line does not parse" };
  const D = day || rows.map((r) => istDay(r.at)).filter(Boolean).sort().at(-1) || null;
  const win = rows.filter((r) => istDay(r.at) === D);
  if (!win.length) return { code: 2, line: `UNREAD fresh · no launch in the window ${D || "(none dated)"}` };
  if (win.some((r) => typeof r.unit !== "string" || !r.unit || !/^[0-9a-f-]{36}$/i.test(String(r.session_id || "")))) return { code: 2, line: "UNREAD fresh · a launch row lacks unit or a transcript session_id" };
  const reds = [], unread = [];
  // ONE SESSION PER UNIT: a session id carried by two different units is the "two units one session" shape
  const unitsBySession = new Map();
  for (const r of win) { const k = r.session_id.toLowerCase(); if (!unitsBySession.has(k)) unitsBySession.set(k, new Set()); unitsBySession.get(k).add(r.unit); }
  for (const [sid, us] of unitsBySession) if (us.size > 1) reds.push(`session ${sid.slice(0, 8)} ran ${us.size} units (${[...us].join(",")})`);
  const projects = join(h.home, ".claude", "projects");
  let pdirs = []; try { pdirs = readdirSync(projects).map((n) => join(projects, n)); } catch { /* none */ }
  for (const r of win) {
    const p = pdirs.map((d) => join(d, `${r.session_id}.jsonl`)).find((x) => existsSync(x));
    if (!p) { unread.push(`${r.unit}: transcript ${r.session_id.slice(0, 8)} not on this machine`); continue; }
    const first = ss.firstHumanPrompt(p);
    if (first === null) { unread.push(`${r.unit}: no human prompt in ${r.session_id.slice(0, 8)}`); continue; }
    const begins = typeof r.brief_sha256 === "string" ? sha256(fold(first)) === r.brief_sha256.toLowerCase()
      : new RegExp(`(^|[^A-Za-z0-9_-])${r.unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z0-9_-]|$)`, "i").test(first);
    if (!begins) reds.push(`${r.unit}: session ${r.session_id.slice(0, 8)} does not begin at its brief`);
    const clears = parseJsonl(p).filter((o) => o && isClear(o)).length;
    if (clears) reds.push(`${r.unit}: ${clears} human /clear prompt(s) in ${r.session_id.slice(0, 8)}`);
  }
  if (reds.length) return { code: 1, line: `RED fresh · ${D} · ${reds.join(" · ")}` };
  if (unread.length) return { code: 2, line: `UNREAD fresh · ${D} · ${unread.join(" · ")}` };
  return { code: 0, line: `GREEN fresh · ${D} · ${win.length} launch(es), ${unitsBySession.size} distinct session(s), each begins at its unit, 0 /clear` };
}

// ── THE PLANTS (both clauses, each a copied tree under os.tmpdir()) ───────────────────────────────────────────────────
const UUID = (n) => `${String(n).padStart(8, "0")}-0000-4000-8000-000000000000`;
const TODAY = "2026-11-19", AT = "2026-11-19T06:00:00.000Z";   // planted values: a plant's day, not a clock reading
const userRow = (text, extra = {}) => JSON.stringify({ type: "user", timestamp: AT, sessionId: "x", message: { role: "user", content: text }, ...extra });
const toolRow = (source) => JSON.stringify({ type: "user", timestamp: AT, message: { role: "user", content: [{ type: "tool_result", tool_use_id: "t", content: "ok" }] }, permissionDecision: { decision: "accept", source } });

function plantTree(org, root) {
  const tree = join(root, "tree");
  for (const rel of [SELF_REL, "scripts/study_scope.mjs", ".claude/skills/runner/SKILL.md"]) {
    const src = join(org, ...rel.split("/"));
    if (!existsSync(src)) return { missing: rel };
    mkdirSync(dirname(join(tree, ...rel.split("/"))), { recursive: true });
    cpSync(src, join(tree, ...rel.split("/")));
  }
  return { tree };
}
function writeJson(p, obj) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2)); }
function writeLines(p, ls) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, ls.join("\n") + "\n"); }

const RUNNER_OPEN = "runner";
const CLICKS_PLANTS = [
  { id: "user-file only: bypass + skip key, a clean runner day", want: 0, user: { permissions: { defaultMode: "bypassPermissions" }, skipDangerousModePermissionPrompt: true }, tr: [[userRow(RUNNER_OPEN), toolRow("config")]] },
  { id: "dontAsk in the user file", want: 0, user: { permissions: { defaultMode: "dontAsk" } }, tr: [[userRow(RUNNER_OPEN), toolRow("config")]] },
  { id: "unset everywhere", want: 1, user: { hooks: {} }, tr: [[userRow(RUNNER_OPEN)]] },
  { id: "bypass in the project file only (ignored by Claude Code)", want: 1, project: { permissions: { defaultMode: "bypassPermissions" } }, tr: [[userRow(RUNNER_OPEN)]] },
  { id: "local default over user bypass", want: 1, user: { permissions: { defaultMode: "bypassPermissions" }, skipDangerousModePermissionPrompt: true }, local: { permissions: { defaultMode: "default" } }, tr: [[userRow(RUNNER_OPEN)]] },
  { id: "managed default over user bypass", want: 1, user: { permissions: { defaultMode: "bypassPermissions" }, skipDangerousModePermissionPrompt: true }, managed: { permissions: { defaultMode: "default" } }, tr: [[userRow(RUNNER_OPEN)]] },
  { id: "bypass disabled by a managed file", want: 1, user: { permissions: { defaultMode: "bypassPermissions" }, skipDangerousModePermissionPrompt: true }, managed: { permissions: { disableBypassPermissionsMode: "disable" } }, tr: [[userRow(RUNNER_OPEN)]] },
  { id: "bypass without the skip key", want: 1, user: { permissions: { defaultMode: "bypassPermissions" } }, tr: [[userRow(RUNNER_OPEN)]] },
  { id: "mode set, the runner day carries a hand decision", want: 1, user: { permissions: { defaultMode: "dontAsk" } }, tr: [[userRow(RUNNER_OPEN), toolRow("config"), toolRow("user")]] },
  { id: "a hand decision in a NON-runner transcript is not his runner's", want: 0, user: { permissions: { defaultMode: "dontAsk" } }, tr: [[userRow(RUNNER_OPEN)], [userRow("architect"), toolRow("user")]] },
  { id: "unparseable user file", want: 2, user: "{ not json", tr: [[userRow(RUNNER_OPEN)]] },
  { id: "mode set, no runner transcript", want: 2, user: { permissions: { defaultMode: "dontAsk" } }, tr: [] },
  { id: "the home door outside os.tmpdir()", want: 2, homeOutside: true, user: { permissions: { defaultMode: "dontAsk" } }, tr: [[userRow(RUNNER_OPEN)]] },
  { id: "the cloud with no home door", want: 2, cloudNoDoor: true, user: { permissions: { defaultMode: "dontAsk" } }, tr: [[userRow(RUNNER_OPEN)]] },
];
const brief = (u) => `You are a CLOUD BUILDER. THE ONE ITEM · UNIT ${u.toUpperCase()} · build it.`;
const FRESH_PLANTS = [
  { id: "two units, two sessions", want: 0, launches: [["mhands", 1], ["mcanary", 2]], tr: { 1: [userRow(brief("mhands"))], 2: [userRow(brief("mcanary"))] } },
  { id: "two units, two sessions, brief hashes carried", want: 0, sha: true, launches: [["mhands", 1], ["mcanary", 2]], tr: { 1: [userRow(brief("mhands"))], 2: [userRow(brief("mcanary"))] } },
  { id: "two units, one session (its first prompt names both)", want: 1, launches: [["mhands", 1], ["mcanary", 1]], tr: { 1: [userRow(`${brief("mhands")} Then UNIT MCANARY.`), userRow(brief("mcanary"))] } },
  { id: "a /clear in a unit's session", want: 1, launches: [["mhands", 1], ["mcanary", 2]], tr: { 1: [userRow(brief("mhands")), userRow("<command-name>/clear</command-name>")], 2: [userRow(brief("mcanary"))] } },
  { id: "a session that begins at another unit's brief", want: 1, launches: [["mhands", 1], ["mcanary", 2]], tr: { 1: [userRow(brief("mhands"))], 2: [userRow(brief("mfactory")), userRow(brief("mcanary"))] } },
  { id: "a brief hash that does not match the first prompt", want: 1, sha: true, badSha: true, launches: [["mhands", 1], ["mcanary", 2]], tr: { 1: [userRow(brief("mhands"))], 2: [userRow(brief("mcanary"))] } },
  { id: "a launch whose transcript is not on the machine", want: 2, launches: [["mhands", 1], ["mcanary", 2]], tr: { 1: [userRow(brief("mhands"))] } },
  { id: "no launches.jsonl", want: 2, noFile: true, launches: [], tr: {} },
  { id: "no --campaign", want: 2, noCampaign: true, launches: [], tr: {} },
];

function runPlant(org, clause, p) {
  const root = mkdtempSync(join(tmpdir(), "mhands-plant-"));
  try {
    const t = plantTree(org, root);
    if (t.missing) return { got: null, line: `the tree has no ${t.missing}` };
    const home = join(root, "home"), managed = join(root, "managed"); mkdirSync(home, { recursive: true }); mkdirSync(managed, { recursive: true });
    const env = { ...process.env, MHANDS_HOME: home, MHANDS_MANAGED: managed };
    delete env.CLAUDE_CODE_REMOTE;
    const slugDir = join(home, ".claude", "projects", ss.projectSlug(realpathSync(t.tree)));
    let args;
    if (clause === "clicks") {
      if (p.user !== undefined) writeJson(join(home, ".claude", "settings.json"), p.user);
      if (p.project) writeJson(join(t.tree, ".claude", "settings.json"), p.project);
      if (p.local) writeJson(join(t.tree, ".claude", "settings.local.json"), p.local);
      if (p.managed) writeJson(join(managed, "managed-settings.json"), p.managed);
      p.tr.forEach((ls, i) => writeLines(join(slugDir, `${UUID(i + 1)}.jsonl`), ls));
      if (p.homeOutside) env.MHANDS_HOME = resolve(sep);   // the filesystem root: never under os.tmpdir()
      if (p.cloudNoDoor) { delete env.MHANDS_HOME; env.CLAUDE_CODE_REMOTE = "true"; }
      args = ["clicks"];
    } else {
      const camp = join(root, "campaign"); mkdirSync(camp, { recursive: true });
      const rows = p.launches.map(([unit, n]) => {
        const r = { unit, session_id: UUID(n), at: AT };
        if (p.sha) r.brief_sha256 = sha256(fold(p.badSha && unit === "mcanary" ? brief("mfactory") : brief(unit)));
        return JSON.stringify(r);
      });
      if (!p.noFile) writeLines(join(camp, "launches.jsonl"), rows);
      for (const [n, ls] of Object.entries(p.tr)) writeLines(join(home, ".claude", "projects", "-campaign-slug", `${UUID(n)}.jsonl`), ls);
      args = p.noCampaign ? ["fresh"] : ["fresh", "--campaign", camp];
    }
    const r = spawnSync(process.execPath, [join(t.tree, ...SELF_REL.split("/")), ...args], { cwd: t.tree, env, encoding: "utf8", windowsHide: true });
    const last = String((r.stdout || "") + (r.stderr || "")).split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) || "";
    return { got: r.status, line: last };
  } finally { rmSync(root, { recursive: true, force: true }); }
}
export function plantsOf(org, which = CLAUSES) {
  const out = [];
  for (const c of which) {
    const [verb, list] = c === "B-hands:clicks-off" ? ["clicks", CLICKS_PLANTS] : ["fresh", FRESH_PLANTS];
    const res = list.map((p) => ({ p, ...runPlant(org, verb, p) }));
    const miss = res.filter((r) => r.got !== r.p.want);
    out.push({ clause: c, ok: miss.length === 0, n: res.length, res, miss });
  }
  return out;
}

// ── THE WHOLE WITNESS (--org / --base-org) ────────────────────────────────────────────────────────────────────────────
function survivors(rootMark) {
  let txt = "";
  try {
    txt = process.platform === "win32"
      ? execFileSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true })
      : execFileSync("ps", ["-eo", "pid,args"], { encoding: "utf8" });
  } catch { return null; }
  return txt.split(/\r?\n/).filter((l) => l.includes(rootMark) && /node/i.test(l) && !l.includes(String(process.pid)));
}
async function whole() {
  const ORG = opt("--org") ? resolve(opt("--org")) : null, BASE_ORG = opt("--base-org") ? resolve(opt("--base-org")) : null;
  const ONLY = opt("--only") ? opt("--only").split(",") : null;
  if (!ORG || !existsSync(ORG)) { console.log(`RED ${UNIT} · USAGE (--org <dir>)`); return 1; }
  const orgHas = existsSync(join(ORG, ...SELF_REL.split("/")));
  const results = [];
  const clause = (id, ok, why) => { results.push({ id, ok: !!ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id} · ${why}`); };
  const mark = `mhands-plant-`;
  for (const c of CLAUSES.filter((c) => !ONLY || ONLY.includes(c))) {
    if (!orgHas) { clause(c, false, `the --org tree carries no ${SELF_REL}: the clause command cannot run`); continue; }
    const [b] = plantsOf(ORG, [c]);
    let baseWhy, baseRed;
    if (!BASE_ORG) { baseRed = false; baseWhy = "no --base-org given"; }
    else if (!existsSync(join(BASE_ORG, ...SELF_REL.split("/")))) { baseRed = true; baseWhy = `base RED: the base carries no ${SELF_REL} (the clause command cannot run)`; }
    else { const [a] = plantsOf(BASE_ORG, [c]); baseRed = !a.ok; baseWhy = `base ${a.ok ? "GREEN (not red!)" : `RED: ${a.miss.length} of ${a.n} plants miss`}`; }
    for (const m of b.miss) console.log(`      miss · ${m.p.id}: want ${m.p.want} got ${m.got} · ${m.line.slice(0, 200)}`);
    clause(c, b.ok && baseRed, `build ${b.n - b.miss.length}/${b.n} plants at their exit · ${baseWhy}`);
  }
  if (!BASE_ORG) clause("BOUND", false, "no --base-org given");
  else {
    const head = (d) => { try { return execFileSync("git", ["-C", d, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch { return null; } };
    const a = head(BASE_ORG), b = head(ORG);
    if (!a || !b) clause("BOUND", false, "a tree is not a git work tree");
    else {
      let names = [];
      try { names = execFileSync("git", ["-C", ORG, "diff", "--name-only", a, b], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean); } catch (e) { names = null; }
      if (!names) clause("BOUND", false, `git diff ${a.slice(0, 7)}..${b.slice(0, 7)} failed`);
      else { const extra = names.filter((n) => !NAMED_PREFIXES.some((p) => n.startsWith(p))); clause("BOUND", extra.length === 0, `${names.length} file(s) differ ${a.slice(0, 7)}..${b.slice(0, 7)}${extra.length ? ` · BEYOND THE NAMED: ${extra.slice(0, 6).join(", ")}` : ", all under ci/witness/mhands/ or ci/mhands/"}`); }
    }
  }
  const left = survivors(join(TMP, mark));
  clause("LAST", left !== null && left.length === 0, left === null ? "the process list is unreadable" : `${left.length} node process(es) naming ${mark}* survive`);
  const red = results.filter((r) => !r.ok).map((r) => r.id);
  if (red.length) { console.log(`RED ${UNIT} · ${red.join(", ")}`); return 1; }
  console.log(`GREEN ${UNIT} his hands off the runner: no click in the settings chain or the runner's day, one fresh session per unit · ${results.length} clause(s)`);
  return 0;
}

// ── CLI ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const verb = argv[0] && !argv[0].startsWith("--") ? argv[0] : null;
  let code;
  if (verb === "clicks") { const r = clicks({ day: opt("--day"), campaign: opt("--campaign") }); console.log(r.line); code = r.code; }
  else if (verb === "fresh") { const r = fresh({ campaign: opt("--campaign"), day: opt("--day") }); console.log(r.line); code = r.code; }
  else if (verb === "plants") {
    const out = plantsOf(TREE);
    // the suite member's shape (scripts/organism_test.mjs clauseWitnesses, unit mmeter; the CLAUSE line read by unit mdtl2's witness_cause.mjs)
    for (const o of out) {
      for (const r of o.res) console.log(`  ${r.got === r.p.want ? "ok  " : "FAIL"} ${o.clause} · ${r.p.id}${r.got === r.p.want ? "" : `\n         want ${r.p.want} got ${r.got} · ${r.line.slice(0, 200)}`}`);
      console.log(`CLAUSE ${o.clause} ${o.ok ? "GREEN" : "RED"} · ${o.n - o.miss.length}/${o.n} plant(s)`);
    }
    const n = out.reduce((s, o) => s + o.n, 0), k = out.reduce((s, o) => s + o.n - o.miss.length, 0);
    console.log(`PLANTS mhands · ${k} of ${n} plant(s) as expected`);
    code = k === n && n > 0 ? 0 : 1;
  }
  else if (verb === null && opt("--org")) code = await whole();
  else { console.log(`RED ${UNIT} · USAGE: clicks [--day D] [--campaign dir] | fresh --campaign dir [--day D] | plants | --org dir --base-org dir [--only c]`); code = 1; }
  process.exit(code);
}
