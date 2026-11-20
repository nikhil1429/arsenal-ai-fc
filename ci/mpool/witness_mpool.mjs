#!/usr/bin/env node
// ci/mpool/witness_mpool.mjs — THE WITNESS of unit mpool (forks rows 1062 / 1066). HEADER = CONTRACT.
//
//   node ci/mpool/witness_mpool.mjs --org <dir> --base-org <dir>
//
// WHAT IT PROVES. Every clause below is planted BOTH WAYS: on a copy of --base-org (the cut, no tap) it must be RED,
// and on a copy of --org (the build) it must be GREEN. A clause GREEN on the base is vacuous and reads RED here.
//
// HOW IT PLANTS (the laws it keeps):
//   · copies, never the trees it is handed: each org's top-level scripts/*.mjs, its runner skill, its project settings
//     and package.json are copied under ONE os.tmpdir() dir; a campaign root and a card-state dir are planted beside
//     each copy and reached ONLY through the env doors (ARSENAL_CAMPAIGN_ROOT, ARSENAL_CALL_STATE_DIR). No file of
//     dressing-room/state is read or written; no file of a credential is copied (only *.mjs, the skill, the settings).
//   · the SETTINGS LINE is read from ci/mpool/PROOF.md beside this file and planted into each copy's
//     .claude/settings.json ONLY (row 1062 F3 B: the real project settings are landed apart, by hand, under a later row).
//   · THE PORT CLASS (row 1053): no fixed port is bound, no live service is named, nothing is POSTed, nothing restarted.
//     Clause D runs day.mjs start (unit mday) with the sitting daemon DOWN: ARSENAL_SITTING_PORT is a free port the OS hands
//     out (listen on 0, then closed — nothing listens on it), its state dir, HOME and archive all under the temp dir.
//   · CRLF-proof and Windows-proof: every text is split on \r?\n, every child is process.execPath with argv (no shell),
//     every git repo it would plant would be made with core.autocrlf=false — it plants none.
//   · THE CLOCK-BOUND CLAUSE (WA.i, row 1062 ADDED (i)) judges against the RULED one second plus a slack MEASURED in this
//     run (the slowest of three bare node starts) — never a typed ratio.
//   · every wait is bounded: a child that hangs is killed at the hang cap and reads RED.
//   · LAST: every child it started is dead at the end, and (where /proc exists) no node process names the temp dir.
//
// LAST LINE   GREEN MPOOL <what> · <n> clause(s)   (exit 0)   or   RED MPOOL · <clauses>   (exit 1)

import { spawnSync, spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, rmSync, statSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";

const HERE = dirname(fileURLToPath(import.meta.url));
const argOf = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined; };
const ORG = argOf("--org"), BASE = argOf("--base-org");
if (!ORG || !BASE) { console.error("usage: node ci/mpool/witness_mpool.mjs --org <dir> --base-org <dir>"); console.log("RED MPOOL · usage"); process.exit(1); }

// THE RULINGS' VALUES, each cited — the plant needs them; no clause invents one.
const RULED_STATUSLINE_BOUND_MS = 1000;   // row 1062 ADDED (i): "returns inside one second"
const RULED_F4_BOUND_MIN = 5 * 60;        // row 1062 F4: "bound five hours until a row moves it" — planted in the law home
const TMP = mkdtempSync(join(tmpdir(), "mpool-witness-"));
const children = new Set();
const MIN = 60 * 1000;
const FREE_PORT = await new Promise((res) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });

// ── the measured clock ──────────────────────────────────────────────────────────────────────────────────────────────
const nodeStart = Math.max(...[0, 1, 2].map(() => { const t = Date.now(); spawnSync(process.execPath, ["-e", ""]); return Date.now() - t; }));
const ALLOWED_MS = RULED_STATUSLINE_BOUND_MS + nodeStart;           // the clause's judgement
const HANG_CAP_MS = ALLOWED_MS + ALLOWED_MS;                         // the wait's cap on a held-open child (not a judgement)

// ── shared readers ──────────────────────────────────────────────────────────────────────────────────────────────────
const SETTINGS = (() => {
  try {
    const t = readFileSync(join(HERE, "PROOF.md"), "utf8");
    const m = /^##\s+SETTINGS LINE\s*\r?\n[\s\S]*?```json\r?\n([\s\S]*?)\r?\n```/m.exec(t);
    return m ? JSON.parse(m[1]) : null;
  } catch { return null; }
})();
const strip = (src) => { const i = src.indexOf("// ═══ SELFTEST"); return (i >= 0 ? src.slice(0, i) : src).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/ .*$/gm, ""); };
const istDay = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const readJ = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const snapshot = (d) => { const m = {}; const walk = (x) => { if (!existsSync(x)) return; for (const f of readdirSync(x)) { const p = join(x, f); const s = statSync(p); if (s.isDirectory()) walk(p); else m[p] = `${s.size}:${s.mtimeMs}:${readFileSync(p, "utf8")}`; } }; walk(d); return JSON.stringify(m); };

// ── one planted copy per org ─────────────────────────────────────────────────────────────────────────────────────────
function plant(src, label) {
  const at = join(TMP, label), org = join(at, "org");
  mkdirSync(join(org, "scripts"), { recursive: true });
  for (const f of readdirSync(join(src, "scripts"))) if (f.endsWith(".mjs")) copyFileSync(join(src, "scripts", f), join(org, "scripts", f));
  mkdirSync(join(org, ".claude", "skills", "runner"), { recursive: true });
  for (const rel of [[".claude", "skills", "runner", "SKILL.md"], ["package.json"]]) if (existsSync(join(src, ...rel))) copyFileSync(join(src, ...rel), join(org, ...rel));
  const settings = readJ(join(src, ".claude", "settings.json")) || {};
  if (SETTINGS && SETTINGS.statusLine) settings.statusLine = SETTINGS.statusLine;   // the temp copy only
  writeFileSync(join(org, ".claude", "settings.json"), JSON.stringify(settings, null, 2));
  const ctx = { label, org, tap: join(org, "scripts", "usage_tap.mjs"), root: join(at, "root"), call: join(at, "call"), law: join(at, "root", "tools", "model_law.mjs") };
  ctx.reading = join(ctx.root, "usage_reading.json");
  ctx.state = join(org, "dressing-room", "state"); ctx.home = join(at, "home");
  ctx.fresh = (law = true) => {
    rmSync(ctx.root, { recursive: true, force: true }); rmSync(ctx.call, { recursive: true, force: true });
    mkdirSync(join(ctx.root, "tools"), { recursive: true }); mkdirSync(ctx.call, { recursive: true });
    rmSync(ctx.state, { recursive: true, force: true }); mkdirSync(ctx.state, { recursive: true }); mkdirSync(ctx.home, { recursive: true });
    if (law) writeFileSync(ctx.law, `// the campaign's law home (planted)\r\nexport const POOL_READING_MAX_AGE_MIN = ${RULED_F4_BOUND_MIN};\r\n`);
  };
  ctx.env = (withRoot = true) => { const e = { ...process.env, ARSENAL_CALL_STATE_DIR: ctx.call, ARSENAL_CAMPAIGN_ROOT: ctx.root }; if (!withRoot) delete e.ARSENAL_CAMPAIGN_ROOT; return e; };
  ctx.run = (args, { input, env } = {}) => {
    const r = spawnSync(process.execPath, [ctx.tap, ...args], { cwd: ctx.org, input: input ?? "", env: env || ctx.env(), encoding: "utf8", timeout: HANG_CAP_MS * 8 });
    if (r.pid) children.add(r.pid);
    return { code: r.status, out: r.stdout || "", err: r.stderr || "" };
  };
  ctx.put = (reading) => writeFileSync(ctx.reading, JSON.stringify(reading));
  ctx.cards = () => ((readJ(join(ctx.call, "captains_call.json")) || {}).cards || []).filter((c) => String(c.key || "").startsWith("usage:panel:"));
  return ctx;
}

const epoch = (ms) => Math.floor(ms / 1000);
const block = (o) => JSON.stringify({ version: "2.1.327", session_id: "witness", rate_limits: o });
const both = (now = Date.now()) => block({ five_hour: { used_percentage: 40, resets_at: epoch(now + 120 * MIN) }, seven_day: { used_percentage: 60, resets_at: epoch(now + 3000 * MIN) } });
const reading = (o = {}) => ({ v: 1, source: "statusline", read_at: new Date(Date.now() - MIN).toISOString(), five: { pct: 40, resets_at: new Date(Date.now() + 120 * MIN).toISOString() }, week: { pct: 60, resets_at: new Date(Date.now() + 3000 * MIN).toISOString() }, ...o });

// the planted settings command → [script, verb] in the copy (no shell: $CLAUDE_PROJECT_DIR expanded here)
function settingsArgv(ctx) {
  const c = SETTINGS?.statusLine?.command;
  if (typeof c !== "string") return null;
  const m = /^node\s+"\$CLAUDE_PROJECT_DIR\/([^"]+)"\s+(\S+)\s*$/.exec(c);
  return m ? [join(ctx.org, ...m[1].split("/")), m[2]] : null;
}
// ── the clauses ─────────────────────────────────────────────────────────────────────────────────────────────────────
const CLAUSES = [
  ["W1.1", "statusline stdin with both windows → the reading holds both pcts, ISO resets, source statusline, read_at now", (c) => {
    c.fresh(); const now = Date.now(); const t0 = Date.now(); const r = c.run(["statusline"], { input: both(now) }); const t1 = Date.now(); const j = readJ(c.reading);
    return r.code === 0 && j && j.five?.pct === 40 && j.week?.pct === 60 && j.five.resets_at === new Date(epoch(now + 120 * MIN) * 1000).toISOString() && j.source === "statusline" && Date.parse(j.read_at) >= t0 - 1000 && Date.parse(j.read_at) <= t1;
  }],
  ["W1.2", "no rate_limits block → no write; the previous reading is untouched (bytes and mtime)", (c) => {
    c.fresh(); c.put(reading()); const old = new Date(Date.now() - 10 * MIN); utimesSync(c.reading, old, old);
    const before = snapshot(c.root); const r = c.run(["statusline"], { input: JSON.stringify({ version: "x" }) });
    return existsSync(c.tap) && r.code === 0 && snapshot(c.root) === before;
  }],
  ["W1.3", "only five_hour → week:null is written, never a zero", (c) => {
    c.fresh(); c.run(["statusline"], { input: block({ five_hour: { used_percentage: 10, resets_at: epoch(Date.now() + 60 * MIN) } }) }); const j = readJ(c.reading);
    return !!j && j.week === null && j.five?.pct === 10;
  }],
  ["W1.4", "malformed stdin / pct off the scale / not a number → no write, a line on stderr, exit 0", (c) => {
    return ["{", block({ five_hour: { used_percentage: 101 } }), block({ five_hour: { used_percentage: "40" } }), block({ seven_day: { used_percentage: -1 } })].every((s) => {
      c.fresh(); const r = c.run(["statusline"], { input: s }); return r.code === 0 && !existsSync(c.reading) && r.err.trim().split(/\r?\n/).length === 1 && r.err.trim() !== "";
    });
  }],
  ["W1.5", "static: the tap never reads the organism's spend gauge and never imports its owner", (c) => existsSync(c.tap) && !/token_vitals|brain\.mjs/.test(strip(readFileSync(c.tap, "utf8")))],
  ["WA.i", "the SETTINGS LINE command fails open inside the ruled second (+ measured node start): closed stdin, held-open stdin, garbage", async (c) => {
    c.fresh(); const argv = settingsArgv(c); if (!argv || !existsSync(argv[0])) return false;
    const plain = { ...process.env, ARSENAL_CAMPAIGN_ROOT: c.root };
    const go = (o) => new Promise((res) => { const t0 = Date.now(); const ch = spawn(process.execPath, argv, { env: plain, stdio: ["pipe", "pipe", "pipe"] }); children.add(ch.pid); let out = ""; ch.stdout.on("data", (d) => { out += d; }); ch.stderr.on("data", () => {}); ch.stdin.on("error", () => {}); const cap = setTimeout(() => ch.kill(), HANG_CAP_MS); ch.on("close", (code) => { clearTimeout(cap); res({ code, out, ms: Date.now() - t0 }); }); if (o.input) ch.stdin.write(o.input); if (!o.hold) ch.stdin.end(); });
    const a = await go({ input: both() }), b = await go({ input: "{\"rate_limits\":", hold: true }), g = await go({ input: "\u0000garbage" });
    const fine = (x) => x.code === 0 && x.ms <= ALLOWED_MS && x.out.trim() !== "";
    return fine(a) && fine(b) && fine(g) && existsSync(c.reading);
  }],
  ["WA.ii", "campaign root absent → statusline, panel and need write nothing and say so", (c) => {
    c.fresh(); const e = c.env(false);
    const s = c.run(["statusline"], { input: both(), env: e }), p = c.run(["panel", "--five", "1", "--week", "2"], { env: e }), n = c.run(["need"], { env: e });
    return s.code === 0 && /no campaign root/.test(s.out) && /no campaign root/.test(p.out) && /no campaign root/.test(n.out) && !existsSync(c.reading) && !existsSync(join(c.call, "captains_call.json"));
  }],
  ["W2.1", "a fresh, whole reading → verdict GO, exit 0", (c) => { c.fresh(); c.put(reading()); const r = c.run(["verdict"]); return r.code === 0 && /^GO\b/.test(r.out); }],
  ["W2.2", "the same reading past the age bound → WAIT · stale, exit 3", (c) => { c.fresh(); c.put(reading({ read_at: new Date(Date.now() - (RULED_F4_BOUND_MIN + 1) * MIN).toISOString(), five: { pct: 40, resets_at: null }, week: { pct: 60, resets_at: null } })); const r = c.run(["verdict"]); return r.code === 3 && /stale/.test(r.out); }],
  ["W2.3", "a file written NOW carrying an old read_at → WAIT · stale (the payload decides, not the mtime)", (c) => { c.fresh(); c.put(reading({ read_at: new Date(Date.now() - (RULED_F4_BOUND_MIN + 5) * MIN).toISOString() })); const r = c.run(["verdict"]); return r.code === 3 && /stale/.test(r.out); }],
  ["W2.4", "read_at in the future → WAIT · future stamp", (c) => { c.fresh(); c.put(reading({ read_at: new Date(Date.now() + 10 * MIN).toISOString() })); const r = c.run(["verdict"]); return r.code === 3 && /future/.test(r.out); }],
  ["W2.5", "now past five.resets_at inside the age bound → WAIT · window rolled (rule 4)", (c) => { c.fresh(); c.put(reading({ read_at: new Date(Date.now() - 10 * MIN).toISOString(), five: { pct: 40, resets_at: new Date(Date.now() - MIN).toISOString() } })); const r = c.run(["verdict"]); return r.code === 3 && /rolled/.test(r.out); }],
  ["W2.6", "week:null → WAIT · half reading", (c) => { c.fresh(); c.put(reading({ week: null })); const r = c.run(["verdict"]); return r.code === 3 && /half/.test(r.out); }],
  ["W2.7", "no age bound at its law home (file absent, or no bound line) → WAIT · rule unreadable", (c) => {
    c.fresh(false); c.put(reading()); const a = c.run(["verdict"]);
    writeFileSync(c.law, "// a law home with no bound line\r\n"); const b = c.run(["verdict"]);
    return a.code === 3 && b.code === 3 && /rule unreadable/.test(a.out) && /rule unreadable/.test(b.out);
  }],
  ["W2.8", "static: no typed age, percent line or duration in the tap — every literal is a unit, an exit code or the ruled bound", (c) => {
    if (!existsSync(c.tap)) return false; const lits = [...strip(readFileSync(c.tap, "utf8")).matchAll(/(?<![\w.$])\d+(?:\.\d+)?(?![\w.])/g)].map((m) => Number(m[0]));
    return lits.length > 0 && lits.every((x) => [0, 1, 2, 3, 60, 100, 1000].includes(x));
  }],
  ["W3.1", "static: the tap's only writes are its reading's tmp and the rename onto the reading", (c) => {
    if (!existsSync(c.tap)) return false; const w = [...strip(readFileSync(c.tap, "utf8")).matchAll(/\b(writeFileSync|renameSync|appendFileSync|createWriteStream|unlinkSync|rmSync|mkdirSync|copyFileSync|cpSync)\(([^,)]*)/g)].map((m) => `${m[1]}(${m[2].trim()}`);
    return w.length === 2 && w.every((x) => /^(writeFileSync\(tmp|renameSync\(tmp)$/.test(x)) && /const path = readingPath\(root\), tmp = `\$\{path\}\.tmp-/.test(readFileSync(c.tap, "utf8"));
  }],
  ["W3.2", "the reading holds no go / verdict / status / launch key", (c) => { c.fresh(); c.run(["statusline"], { input: both() }); const j = readJ(c.reading); return !!j && !Object.keys(j).some((k) => /^(go|verdict|status|launch)$/i.test(k)); }],
  ["W3.4", "verdict twice → the same answer, and the planted trees are byte-and-mtime identical (a read writes nothing)", (c) => {
    c.fresh(); c.put(reading()); const s0 = snapshot(join(TMP, c.label)); const a = c.run(["verdict"]), b = c.run(["verdict"]);
    return existsSync(c.tap) && a.code === b.code && a.out === b.out && snapshot(join(TMP, c.label)) === s0;
  }],
  ["W4.1", "no reading → need → exactly ONE card, keyed usage:panel:<IST day>", (c) => { c.fresh(); const r = c.run(["need"]); const k = c.cards(); return r.code === 0 && k.length === 1 && k[0].key === `usage:panel:${istDay(new Date())}`; }],
  ["W4.2", "need twice the same day → still ONE card", (c) => { c.fresh(); c.run(["need"]); c.run(["need"]); return c.cards().length === 1; }],
  ["W4.3", "a fresh statusline reading → need files nothing", (c) => { c.fresh(); c.run(["statusline"], { input: both() }); const r = c.run(["need"]); return existsSync(c.reading) && r.code === 0 && c.cards().length === 0; }],
  ["W4.4", "WAIT for a reason his panel cannot change (the window rolled) → need files nothing", (c) => { c.fresh(); c.put(reading({ five: { pct: 40, resets_at: new Date(Date.now() - MIN).toISOString() } })); const r = c.run(["need"]); return r.code === 0 && /nothing filed/.test(r.out) && c.cards().length === 0; }],
  ["W4.5", "panel --five 40 --week 60 → source his-panel, GO while fresh, WAIT · stale past the same age bound", (c) => {
    c.fresh(); const p = c.run(["panel", "--five", "40", "--week", "60"]); const j = readJ(c.reading); const g = c.run(["verdict"]);
    if (!(p.code === 0 && j?.source === "his-panel" && g.code === 0)) return false;
    c.put({ ...j, read_at: new Date(Date.now() - (RULED_F4_BOUND_MIN + 1) * MIN).toISOString() }); const w = c.run(["verdict"]);
    return w.code === 3 && /stale/.test(w.out);
  }],
  ["W4.6", "the filed card line names no command, path or flag", (c) => { c.fresh(); c.run(["need"]); const k = c.cards(); return k.length === 1 && !/node |--|\.mjs|\//.test(k[0].line); }],
  ["F2", "static: no code of the tap names a credential or OAuth file (row 1062 F2 A)", (c) => existsSync(c.tap) && !/credential|oauth|\.credentials|keychain/i.test(strip(readFileSync(c.tap, "utf8")))],
  ["F5", "a fresh, whole 99% reading is GO — the tap reports, the gate decides (row 1062 F5 B)", (c) => { c.fresh(); c.put(reading({ five: { pct: 99, resets_at: null }, week: { pct: 99, resets_at: null } })); return c.run(["verdict"]).code === 0; }],
  ["F9", "a panel reading with no reset times is judged by the age bound alone (row 1062 F9 A)", (c) => { c.fresh(); c.put(reading({ source: "his-panel", read_at: new Date(Date.now() - (RULED_F4_BOUND_MIN - 10) * MIN).toISOString(), five: { pct: 5, resets_at: null }, week: { pct: 5, resets_at: null } })); return c.run(["verdict"]).code === 0; }],
  ["C", "the runner twin (row 1062 F8 C): the windows line names the verdict read, the pool line names the fallback card", (c) => {
    let L; try { L = readFileSync(join(c.org, ".claude", "skills", "runner", "SKILL.md"), "utf8").split(/\r?\n/); } catch { return false; }
    const i = L.findIndex((l) => /every launch at the 3,000,000 cap/.test(l)), k = L.findIndex((l) => /THE POOL IS HIS PANEL/.test(l));
    return i >= 0 && k >= 0 && /usage_tap\.mjs verdict/.test(L[i + 1] || "") && /usage_tap\.mjs need/.test(L[k + 1] || "") && /usage_tap\.mjs panel/.test(L[k + 1] || "");
  }],
  ["J", "the tap's selftest is judged in the hermetic chain (organism_test.mjs) and exits 0 in the copy", (c) => {
    let t; try { t = readFileSync(join(c.org, "scripts", "organism_test.mjs"), "utf8"); } catch { return false; }
    if (!/hermeticRuns\.get\(runKey\(\[join\(ROOT, "scripts", "usage_tap\.mjs"\), "selftest"\]\)\)/.test(t) || !/MPOOL · usage_tap selftest/.test(t)) return false;
    return c.run(["selftest"], { env: { ...process.env } }).code === 0;
  }],
  ["D", "day.mjs start (unit mday, F8 A) runs usage_tap.mjs need ONCE per start: no reading → ONE keyed card; a second start the same day → still ONE; a fresh reading → none", (c) => {
    const day = join(c.org, "scripts", "day.mjs"); if (!existsSync(day)) return false;
    const e = { ...c.env(), HOME: c.home, USERPROFILE: c.home, ARSENAL_ARCHIVE: join(c.home, "archive"), ARSENAL_SITTING_PORT: String(FREE_PORT), ARSENAL_SITTING_STATE_DIR: c.state };
    delete e.ARSENAL_ORGAN; delete e.CLAUDE_CODE_SESSION_ID;
    const go = (sid) => { const r = spawnSync(process.execPath, [day, "start", "--session", sid], { cwd: c.org, env: e, encoding: "utf8", timeout: HANG_CAP_MS * 8 }); if (r.pid) children.add(r.pid); return r; };
    c.fresh(); const a = go("11111111-2222-3333-4444-555555555555"); const one = c.cards().length; const b = go("11111111-2222-3333-4444-555555555555");
    const firstOk = a.status === 0 && (String(a.stdout).match(/ · pool: /g) || []).length === 1 && one === 1 && c.cards().length === 1 && (String(b.stdout).match(/ · pool: /g) || []).length === 1;
    c.fresh(); c.run(["statusline"], { input: both() }); const f = go("66666666-7777-8888-9999-000000000000");
    return firstOk && f.status === 0 && / · pool: GO/.test(f.stdout) && c.cards().length === 0;
  }],
  ["P", "package.json: the usage_tap selftest is in exactly ONE suite string (row 1091 (2), F-a)", (c) => {
    const pkg = readJ(join(c.org, "package.json")); if (!pkg) return false;
    const n = ["organism:selftest", "squad:selftest", "audit:selftest"].filter((k) => /(^|&& )node scripts\/usage_tap\.mjs selftest( &&|$)/.test(String(pkg.scripts?.[k] || ""))).length;
    // RE-CUT by unit mhot (forks row 1187 F6 A), an ADDED edit holding the SAME property: ~~in exactly ONE suite string~~ →
    // in exactly one suite across the tree's membership records — the strings (a tree before mhot) PLUS the member roll that
    // tree's OWN organism_test.mjs prints (`roll --json` over suite/members/*.json of the tree handed in, read in place, never
    // written; a tree with no roll verb counts none). One member file is one suite by construction.
    const src = c.label === "org" ? ORG : BASE;
    const rr = spawnSync(process.execPath, [join(src, "scripts", "organism_test.mjs"), "roll", "--json"], { cwd: src, encoding: "utf8", windowsHide: true, timeout: HANG_CAP_MS * 8 });
    if (rr.pid) children.add(rr.pid);
    const rj = (() => { try { return JSON.parse(String(rr.stdout || "")); } catch { return null; } })();
    const rolled = (rj && Array.isArray(rj.members) ? rj.members : []).filter((m) => m && m.organ === "usage_tap" && JSON.stringify(m.argv) === '["selftest"]').length;
    return n + rolled === 1;
  }],
  ["S", "the SETTINGS LINE (ci/mpool/PROOF.md) is one statusLine command object running the tap's statusline verb in the planted copy", (c) => {
    const s = SETTINGS?.statusLine; const argv = settingsArgv(c);
    return !!s && s.type === "command" && !!argv && argv[1] === "statusline" && existsSync(argv[0]) && readJ(join(c.org, ".claude", "settings.json"))?.statusLine?.command === s.command;
  }],
];

// ── run both ways ───────────────────────────────────────────────────────────────────────────────────────────────────
const build = plant(ORG, "org"), base = plant(BASE, "base");
const bad = [];
let survivors = [];
try {
  console.log(`witness_mpool · node start measured ${nodeStart} ms · the clock-bound clause allows ${ALLOWED_MS} ms (ruled ${RULED_STATUSLINE_BOUND_MS} + measured) · tmp ${TMP}`);
  for (const [id, name, fn] of CLAUSES) {
    let g = false, b = true;
    try { g = !!(await fn(build)); } catch { g = false; }
    try { b = !!(await fn(base)); } catch { b = false; }
    const ok = g && !b;
    if (!ok) bad.push(id);
    console.log(`  ${ok ? "ok  " : "FAIL"} ${id} · build ${g ? "GREEN" : "RED"} · base ${b ? "GREEN (vacuous)" : "RED"} · ${name}`);
  }
} finally {
  // LAST: every child dead; where /proc exists, no node process names the temp dir
  for (const pid of children) { try { process.kill(pid, 0); survivors.push(pid); try { process.kill(pid); } catch { /* gone */ } } catch { /* dead — good */ } }
  if (existsSync("/proc")) {
    for (const p of readdirSync("/proc")) {
      if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
      try { const cl = readFileSync(join("/proc", p, "cmdline"), "utf8"); if (cl.includes(TMP) && /node/.test(cl)) { survivors.push(Number(p)); try { process.kill(Number(p)); } catch { /* gone */ } } } catch { /* raced */ }
    }
  }
  rmSync(TMP, { recursive: true, force: true });
}
console.log(`  ${survivors.length ? "FAIL" : "ok  "} LAST · no node process naming the temp dir survives${survivors.length ? ` (${survivors.join(", ")})` : ""}`);
if (survivors.length) bad.push("LAST");
if (bad.length) { console.log(`RED MPOOL · ${bad.join(", ")}`); process.exit(1); }
console.log(`GREEN MPOOL the usage tap · ${CLAUSES.length + 1} clause(s)`);
process.exit(0);
