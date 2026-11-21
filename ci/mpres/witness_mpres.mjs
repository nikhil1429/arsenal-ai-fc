#!/usr/bin/env node
// ============================================================================
// ci/mpres/witness_mpres.mjs — UNIT mpres · A SENSOR WHOSE INPUT IS DEAD READS RED BY NAME ON THE ONE STATE LINE
//   (forks rows 1177 (2) / 1191; spec ci/mpres/MPRES_SPEC.md @ e2e18d2 on claude/mpres-spec — where they differ, the ruling wins)
// ----------------------------------------------------------------------------
// USAGE: node ci/mpres/witness_mpres.mjs --org <dir> --base-org <dir> [--only <clause>[,<clause>…]]
//   --org       the tree to witness (the build reads GREEN; the base 5759cce reads RED on every clause but BOUND and LAST)
//   --base-org  the BASE tree (main 5759cce) — BOUND needs it; absent, BOUND is RED
//   --only      run only the groups holding these clause ids (the mutant runner's door); LAST always runs
// CONTRACT — every plant is a COPY of --org's scripts/ + package.json under os.tmpdir(), with its OWN dressing-room/state that is
//   EMPTY but for the plant (the tree's tracked registry.json, then the senses row seeded THROUGH registry.mjs set, the
//   lander's own command; nothing of his is copied, nothing printed). HOME / USERPROFILE / ARSENAL_ARCHIVE point under the same
//   temp root, and a refusing `claude` / `gemini` (+ .cmd) sits FIRST on PATH (a planted model, never a live call).
// THE PORT CLASS (row 1053): nothing here binds a port, names a live service, POSTs at a daemon or restarts anything. Every
//   child runs with `--import <temp>/deadnet.mjs`, which replaces fetch with a thrower that only RECORDS the URL it was handed
//   (ECONNREFUSED, the dead input, planted); this process replaces its own fetch the same way. The service door is the env
//   AW_API_BASE (or its alias ARSENAL_AW) set to an RFC 6761 `.invalid` host; the launcher door ARSENAL_AW_LAUNCHER points at a
//   path under the temp dir that does not exist, so the one ask presence makes starts NO process (the OS answers ENOENT). The
//   module-level clauses inject a dead fetchFn and a launch seam that counts and starts nothing. No git repo is planted
//   (core.autocrlf: nothing to clone or init), every line read from a process is split on \r?\n, BOUND hashes text with CRLF
//   folded to LF, processes are listed through PowerShell on Windows and `ps` elsewhere. No timeout, budget or size is typed:
//   every wait is a child's exit, and each child's own waits are the organ's own abort bounds.
// CLAUSES (spec §5 W1–W13; the ruling's F7 and F9 B):
//   W1       presence, dead fetch → presence_input.json written: alive:false, input activitywatch, the pass says dead
//   W2       two dead passes then a live one → dead_since = the FIRST dead pass; the live pass reads alive:true + last_live_at
//   W3       senses.senseFacts over a planted dead presence snapshot → the wound is named presence, since its first dead pass
//   W4       END TO END, no act of his: `presence.mjs sense` on a dead door, then `state.mjs line` → the line carries
//            `senses ✗ presence: activitywatch dead since <IST>` (the line the SessionStart brief prints first)
//   W5       every sensor healthy → no wound, no unknown, and the line carries NO senses characters (L7)
//   W6       `touchline.mjs` on a dead door → pitch_read tunnel.state input_dead (never no_data), input.activitywatch false, exit ≠ 0
//   W7       timeaudit dataOk:false is a wound; a record with dataOk ABSENT is not read as false
//   W8       mirror: a failed gist listing that fetched nothing is a wound; an ok listing with have 0 (nothing locked) is not
//   W9       throwin: wired + last_error is a wound; a dormant (wired:false) throwin is not
//   W10      dmn: a dead AFK read is input_dead, and the gate STAMPS dmn_input.json alive:false with dead_since carried
//   W11      `capture.mjs pull` with a configured inbox that is absent → wired configured-missing, capture_pull.json (no path),
//            exit ≠ 0, and senses names capture
//   W12      `presence.mjs sense` on a dead door exits NON-ZERO (F2 B)
//   W13      senses over an absent state dir → every sensor a stated unknown, none dead; the line says `senses ?`
//   F7       one door: presence and dmn dial AW_API_BASE; presence and touchline read ARSENAL_AW as its alias
//   F9-ONCE  presence asks the launcher ONCE per dead span (a repeat dead pass asks nothing; a new span may ask once more)
//   F9-RED   the CLI's one ask at an absent launcher is recorded failed (ENOENT) and the line reads `repair FAILED` by name
//   BOUND    only the named files differ between --base-org and --org (ci/mpres/ is this unit's own output)
//   LAST     no node process naming the temp root survives
// LAST LINE: GREEN MPRES <what> · <n> clause(s) (exit 0) or RED MPRES · <clauses> (exit 1)
// ============================================================================
import { cpSync, mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, symlinkSync } from "node:fs";
import { join, resolve, delimiter } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null, BASE_ORG = arg("--base-org") ? resolve(arg("--base-org")) : null;
const ONLY = arg("--only") ? arg("--only").split(",") : null;
if (!ORG || !existsSync(join(ORG, "scripts", "presence.mjs"))) { console.log("RED MPRES · USAGE (--org <dir> with scripts/presence.mjs)"); process.exit(1); }
const UNIT = "MPRES";
const NAMED = ["scripts/presence.mjs", "scripts/touchline.mjs", "scripts/dmn.mjs", "scripts/capture.mjs", "scripts/state.mjs",
  "scripts/senses.mjs", "scripts/context.mjs", "package.json", ".gitignore"];
const NAMED_DIRS = ["ci/mpres/"];
const ROOT = mkdtempSync(join(tmpdir(), "mpres-wit-"));
const results = [];
const clause = (id, ok, why) => { results.push({ id, ok: !!ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id} · ${why}`); };
const want = (...ids) => !ONLY || ids.some((i) => ONLY.includes(i));
const lines = (s) => String(s || "").split(/\r?\n/).filter((l) => l.trim());
const readJson = (p) => { try { return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null; } catch { return null; } };
const isoAt = (m) => new Date(Date.UTC(2026, 10, 17, 5, m, 0)).toISOString();

// ── THE PLANTED DEAD NETWORK ────────────────────────────────────────────────────────────────────────────────────────────
const DIAL_LOG = join(ROOT, "dialled.txt");
const DEADNET = join(ROOT, "deadnet.mjs");
writeFileSync(DEADNET, [
  "import { appendFileSync } from 'node:fs';",
  "const LOG = process.env.MPRES_DIAL_LOG;",
  "globalThis.fetch = async (url) => {",
  "  try { if (LOG) appendFileSync(LOG, `${process.pid} ${String(url && url.url ? url.url : url)}\\n`); } catch { /* the record is best-effort; the throw is the plant */ }",
  "  const e = new TypeError('fetch failed'); e.cause = Object.assign(new Error('connect ECONNREFUSED (planted by ci/mpres)'), { code: 'ECONNREFUSED' }); throw e;",
  "};",
].join("\n") + "\n");
const dialled = () => { try { return lines(readFileSync(DIAL_LOG, "utf8")).map((l) => l.slice(l.indexOf(" ") + 1)); } catch { return []; } };
const hostOf = (u) => { try { return new URL(u).hostname; } catch { return "?"; } };
// this process dials nothing either
globalThis.fetch = async (url) => { const e = new TypeError("fetch failed"); e.cause = { code: "ECONNREFUSED", url: String(url) }; throw e; };
const DOOR = "http://aw-door.invalid", ALIAS = "http://aw-alias.invalid";
process.env.AW_API_BASE = DOOR; delete process.env.ARSENAL_AW;   // the module-level imports read the door at import
const recorded = [];
const deadFetch = async (url) => { recorded.push(String(url)); throw Object.assign(new Error("connect ECONNREFUSED (planted)"), { code: "ECONNREFUSED" }); };
const NO_LAUNCHER = join(ROOT, "no-such-launcher");

// ── PLANTS ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const SHIM = join(ROOT, "shim");
mkdirSync(SHIM);
for (const tool of ["claude", "gemini"]) {
  writeFileSync(join(SHIM, tool), "#!/bin/sh\necho \"REFUSED — no live model call in a witness (unit mpres)\" >&2\nexit 1\n", { mode: 0o755 });
  writeFileSync(join(SHIM, `${tool}.cmd`), "@echo REFUSED — no live model call in a witness (unit mpres) 1>&2\r\n@exit /b 1\r\n");
}
const plant = (name) => {
  const dir = join(ROOT, name);
  cpSync(join(ORG, "scripts"), join(dir, "scripts"), { recursive: true });
  if (existsSync(join(ORG, "package.json"))) cpSync(join(ORG, "package.json"), join(dir, "package.json"));
  const sd = join(dir, "dressing-room", "state");
  mkdirSync(sd, { recursive: true });
  const reg = join(ORG, "dressing-room", "state", "registry.json");
  if (existsSync(reg)) writeFileSync(join(sd, "registry.json"), readFileSync(reg));
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(dir, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  return { dir, sd, reg: join(sd, "registry.json") };
};
const childEnv = (extra = {}) => {
  const env = { ...process.env };
  for (const k of ["ARSENAL_AW", "ARSENAL_REPS_INBOX", "ARSENAL_REGISTRY", "NODE_OPTIONS", "ANTHROPIC_API_KEY"]) delete env[k];
  const home = join(ROOT, "home"); mkdirSync(home, { recursive: true });
  Object.assign(env, { HOME: home, USERPROFILE: home, ARSENAL_ARCHIVE: join(home, "archive"), AW_API_BASE: DOOR, ARSENAL_AW_LAUNCHER: NO_LAUNCHER, MPRES_DIAL_LOG: DIAL_LOG });
  const pk = Object.keys(env).find((k) => k.toUpperCase() === "PATH") || "PATH";
  env[pk] = `${SHIM}${delimiter}${env[pk] || ""}`;
  for (const [k, v] of Object.entries(extra)) { if (v === null) delete env[k]; else env[k] = v; }
  return env;
};
const runNode = (p, args, extra = {}) => {
  const r = spawnSync(process.execPath, ["--import", pathToFileURL(DEADNET).href, ...args], { cwd: p.dir, env: childEnv(extra), encoding: "utf8", windowsHide: true });
  return { code: r.status, out: String(r.stdout || "") + String(r.stderr || ""), last: lines(r.stdout).pop() || "" };
};
const mod = (p, rel) => import(pathToFileURL(join(p.dir, rel)).href);
// the senses row, seeded through the owner's own CLI (the lander's command) — only where the tree carries senses.mjs
const seed = async (p) => {
  if (!existsSync(join(p.dir, "scripts", "senses.mjs"))) return "no senses.mjs in this tree (nothing to seed)";
  const s = await mod(p, "scripts/senses.mjs");
  const r = spawnSync(process.execPath, [join(p.dir, "scripts", "registry.mjs"), "set", "--table", "mechanisms", "--json", JSON.stringify(s.SEED_ROW)],
    { cwd: p.dir, env: childEnv({ ARSENAL_REGISTRY: p.reg }), encoding: "utf8", windowsHide: true });
  return r.status === 0 ? "seeded" : `seed refused (exit ${r.status}: ${lines(r.stdout).pop() || ""})`;
};
const guard = async (id, fn) => { try { const v = await fn(); clause(id, v.ok, v.why); } catch (e) { clause(id, false, `threw: ${String((e && e.message) || e).slice(0, 200)}`); } };
const TONE = { arousal: "open", effects: { dmn_allowed: true } };

// ── GROUP P · presence, module level (W1 W2 F9-ONCE) ──────────────────────────────────────────────────────────────────
if (want("W1", "W2", "F9-ONCE")) {
  const p = plant("p");
  const m = await mod(p, "scripts/presence.mjs");
  const f = join(ROOT, "p-input.json");
  const asks = [];
  const launch = async () => { asks.push(1); return { ok: false, why: "ENOENT" }; };
  const env = { ARSENAL_AW_LAUNCHER: NO_LAUNCHER };
  const dead = (min) => m.sense({ now: new Date(isoAt(min)), tone: TONE, fetchFn: deadFetch, inputFile: f, env, launch });
  const d1 = await dead(28); const s1 = readJson(f);
  const d2 = await dead(29); const s2 = readJson(f);
  const asksAfterSpan = asks.length;
  await m.sense({ now: new Date(isoAt(30)), events: [{ timestamp: isoAt(29), data: { app: "Code.exe", title: "a" } }], inputFile: f, tone: TONE,
    signature: m.SIGNATURE, matcher: m.bucketsMatcher({ browsers: [], rules: {} }), afk: null, roll: null,
    registry: { conceptAlias: new Map(), skillAlias: new Map(), loaded: false }, sprint: null, prevEdge: null, prevFocus: null,
    post: async () => true, append: () => {} });
  const s3 = readJson(f);
  await dead(31); const s4 = readJson(f);
  if (want("W1")) await guard("W1", () => ({ ok: !!(d1 && d1.ok === false && s1 && s1.alive === false && s1.input === "activitywatch"),
    why: s1 ? `snapshot alive:${s1.alive} input:${s1.input}` : `no snapshot written (the pass returned ${JSON.stringify(d1).slice(0, 90)})` }));
  if (want("W2")) await guard("W2", () => ({ ok: !!(s2 && s2.dead_since === isoAt(28) && s3 && s3.alive === true && s3.dead_since === null && s3.last_live_at === isoAt(30)),
    why: `after 2 dead passes dead_since ${s2 ? s2.dead_since : "(no file)"} (first ${isoAt(28)}); after a live pass alive:${s3 ? s3.alive : "?"} last_live_at ${s3 ? s3.last_live_at : "?"}` }));
  if (want("F9-ONCE")) await guard("F9-ONCE", () => ({ ok: asksAfterSpan === 1 && asks.length === 2 && !!(s2 && s2.repair && s2.repair.span === s2.dead_since && s4 && s4.dead_since === isoAt(31)),
    why: `${asksAfterSpan} ask(s) over one dead span of 2 passes, ${asks.length} after a live pass and a new span (want 1 then 2); d2 ${d2 && d2.dead ? "dead" : "?"}` }));
}

// ── GROUP C · presence CLI + the line, end to end (W4 W12 F9-RED, and F7's presence legs) ──────────────────────────────
if (want("W4", "W12", "F9-RED", "F7")) {
  const p = plant("pc");
  const seeded = await seed(p);
  const n0 = dialled().length;
  const r = runNode(p, ["scripts/presence.mjs", "sense"]);
  const dialP = dialled().slice(n0);
  const snap = readJson(join(p.sd, "presence_input.json"));
  const line = runNode(p, ["scripts/state.mjs", "line"]).last;
  const n1 = dialled().length;
  runNode(p, ["scripts/presence.mjs", "sense"], { AW_API_BASE: null, ARSENAL_AW: ALIAS });
  const dialAlias = dialled().slice(n1);
  if (want("W12")) await guard("W12", () => ({ ok: r.code !== 0 && r.code !== null, why: `presence sense on a dead door exited ${r.code} · ${r.last.slice(0, 120)}` }));
  if (want("F9-RED")) await guard("F9-RED", () => ({ ok: !!(snap && snap.repair && snap.repair.result === "failed" && snap.repair.why === "ENOENT" && / · repair FAILED \(ENOENT\)/.test(line)),
    why: `repair ${snap && snap.repair ? `${snap.repair.result} (${snap.repair.why})` : "(none recorded)"} · line ${/repair FAILED/.test(line) ? "names it" : "does not name it"}` }));
  if (want("W4")) await guard("W4", () => ({ ok: /^STATE · /.test(line) && / · senses ✗ presence: activitywatch dead since \d{1,2} [A-Z][a-z]{2} \d\d:\d\d IST/.test(line),
    why: `${seeded} · the line's tail: …${line.slice(-150)}` }));
  if (want("F7")) {
    const d = await mod(plant("pd"), "scripts/dmn.mjs");
    recorded.length = 0; await d.isAway({ fetchFn: deadFetch }); const dmnDial = recorded.slice();
    const t = plant("tf");
    const n2 = dialled().length; runNode(t, ["scripts/touchline.mjs"], { AW_API_BASE: null, ARSENAL_AW: ALIAS }); const tAlias = dialled().slice(n2);
    const ok = dialP.length > 0 && dialP.every((u) => hostOf(u) === "aw-door.invalid") && dialAlias.length > 0 && dialAlias.every((u) => hostOf(u) === "aw-alias.invalid")
      && dmnDial.length > 0 && dmnDial.every((u) => hostOf(u) === "aw-door.invalid") && tAlias.length > 0 && tAlias.every((u) => hostOf(u) === "aw-alias.invalid");
    await guard("F7", () => ({ ok, why: `presence AW_API_BASE → ${[...new Set(dialP.map(hostOf))].join(",") || "nothing dialled"} · presence ARSENAL_AW → ${[...new Set(dialAlias.map(hostOf))].join(",") || "nothing"} · dmn → ${[...new Set(dmnDial.map(hostOf))].join(",") || "nothing"} · touchline ARSENAL_AW → ${[...new Set(tAlias.map(hostOf))].join(",") || "nothing"}` }));
  }
}

// ── GROUP T · touchline CLI (W6) ────────────────────────────────────────────────────────────────────────────────────────
if (want("W6")) {
  const p = plant("t");
  const r = runNode(p, ["scripts/touchline.mjs"]);
  const pr = readJson(join(p.sd, "pitch_read.json"));
  await guard("W6", () => ({ ok: !!(pr && pr.tunnel && pr.tunnel.state === "input_dead" && pr.input && pr.input.activitywatch === false && r.code !== 0 && r.code !== null),
    why: `tunnel.state ${pr && pr.tunnel ? pr.tunnel.state : "(no read)"} · input.activitywatch ${pr && pr.input ? pr.input.activitywatch : "(absent)"} · exit ${r.code}` }));
}

// ── GROUP D · dmn, module level (W10) ───────────────────────────────────────────────────────────────────────────────────
if (want("W10")) {
  const p = plant("d");
  const m = await mod(p, "scripts/dmn.mjs");
  const a = await m.isAway({ fetchFn: deadFetch });
  const stamps = []; let prior = null;
  const writeInput = (o) => { stamps.push(o); prior = o; };
  const opts = (min) => ({ force: false, now: new Date(isoAt(min)), tone: TONE, fetchFn: deadFetch, writeInput, readInput: () => prior, write: () => { throw new Error("no precache on a dead gate"); } });
  const r1 = await m.dream(opts(0)); await m.dream(opts(60));
  const s = stamps[1];
  await guard("W10", () => ({ ok: a.away === false && a.input_dead === true && !!(r1 && r1.input_dead === true && s && s.alive === false && s.dead_since === isoAt(0)),
    why: `isAway input_dead:${a.input_dead} away:${a.away} · ${stamps.length} stamp(s)${s ? `, alive:${s.alive} dead_since ${s.dead_since}` : ""}` }));
}

// ── GROUP K · capture pull CLI (W11) ────────────────────────────────────────────────────────────────────────────────────
if (want("W11")) {
  const p = plant("k");
  const seeded = await seed(p);
  const inbox = join(ROOT, "k-inbox-that-is-not-there");
  const r = runNode(p, ["scripts/capture.mjs", "pull", "--no-chain"], { ARSENAL_REPS_INBOX: inbox });
  const raw = existsSync(join(p.sd, "capture_pull.json")) ? readFileSync(join(p.sd, "capture_pull.json"), "utf8") : null;
  const snap = raw ? JSON.parse(raw) : null;
  let named = false;
  if (existsSync(join(p.dir, "scripts", "senses.mjs"))) { const s = await mod(p, "scripts/senses.mjs"); named = s.senseFacts({ stateDir: p.sd, registryPath: p.reg }).wounds.some((w) => w.sensor === "capture"); }
  await guard("W11", () => ({ ok: !!(snap && snap.configured === true && snap.alive === false && !raw.includes("k-inbox-that-is-not-there") && r.code !== 0 && r.code !== null && named && /configured-missing|configured but not found/.test(r.out)),
    why: `${seeded} · exit ${r.code} · snapshot ${snap ? `configured:${snap.configured} alive:${snap.alive}${raw.includes("k-inbox") ? " (CARRIES THE PATH)" : ""}` : "(none)"} · senses ${named ? "names capture" : "does not name capture"}` }));
}

// ── GROUP S · senses + the line, module level (W3 W5 W7 W8 W9 W13) ───────────────────────────────────────────────────
if (want("W3", "W5", "W7", "W8", "W9", "W13")) {
  const p = plant("s");
  const has = existsSync(join(p.dir, "scripts", "senses.mjs"));
  const sm = has ? await mod(p, "scripts/senses.mjs") : null;
  const st = await mod(p, "scripts/state.mjs");
  const sd = join(ROOT, "s-state"); mkdirSync(sd, { recursive: true });
  const reg = join(ROOT, "s-registry.json");
  if (sm) writeFileSync(reg, JSON.stringify({ version: 1, tables: { mechanisms: [sm.SEED_ROW] } }));
  const put = (f, o) => writeFileSync(join(sd, f), JSON.stringify(o));
  const facts = (dir = sd) => sm ? sm.senseFacts({ stateDir: dir, registryPath: reg }) : null;
  const healthy = () => {
    put("presence_input.json", { at: isoAt(1), input: "activitywatch", alive: true, dead_since: null });
    put("pitch_read.json", { tunnel: { state: "clear" }, input: { activitywatch: true } });
    put("timeaudit.json", { dataOk: true, generatedAt: isoAt(1) });
    put("dmn_input.json", { alive: true });
    put("mirror_manifest.json", { enumeration: { ok: true }, have: 0, need: 0 });
    put("capture_pull.json", { configured: false, alive: null });
    put("throwin_state.json", { wired: false });
  };
  const lineOf = (senses) => st.stateFrom({ cards: { known: true, live: 0 }, senses }, new Date(isoAt(40))).line;
  const NONE = "senses.mjs is not in this tree";
  if (want("W3")) await guard("W3", () => {
    if (!sm) return { ok: false, why: NONE };
    healthy(); put("presence_input.json", { at: isoAt(29), input: "activitywatch", alive: false, dead_since: isoAt(28) });
    const w = facts().wounds;
    return { ok: w.length === 1 && w[0].sensor === "presence" && w[0].since === isoAt(28), why: `wounds: ${w.map((x) => `${x.sensor} since ${x.since}`).join(", ") || "none"}` };
  });
  if (want("W5")) await guard("W5", () => {
    if (!sm) return { ok: false, why: NONE };
    healthy(); const f = facts(); const line = lineOf(f);
    return { ok: f.wounds.length === 0 && f.unknown.length === 0 && f.healthy.length === sm.SEED_ROW.subjects.length && !/senses/.test(line),
      why: `${f.healthy.length} healthy · ${f.wounds.length} wound(s) · ${f.unknown.length} unknown · the line ${/senses/.test(line) ? "CARRIES senses characters" : "carries none"}` };
  });
  if (want("W7")) await guard("W7", () => {
    if (!sm) return { ok: false, why: NONE };
    healthy(); put("timeaudit.json", { dataOk: false, generatedAt: isoAt(5), mode: "pulse" });
    const dead = facts().wounds.some((w) => w.sensor === "timeaudit");
    put("timeaudit.json", { generatedAt: isoAt(5), mode: "pulse" });
    const absent = facts().wounds.some((w) => w.sensor === "timeaudit");
    return { ok: dead && !absent, why: `dataOk:false → ${dead ? "wound" : "no wound"} · dataOk absent → ${absent ? "WOUND" : "no wound"}` };
  });
  if (want("W8")) await guard("W8", () => {
    if (!sm) return { ok: false, why: NONE };
    healthy(); put("mirror_manifest.json", { enumeration: { ok: false, error: "fetch_fail" }, have: 0, need: 4, generated_at: isoAt(5) });
    const dead = facts().wounds.some((w) => w.sensor === "mirror");
    put("mirror_manifest.json", { enumeration: { ok: true }, have: 0, need: 0, generated_at: isoAt(5) });
    const quiet = facts().wounds.some((w) => w.sensor === "mirror");
    return { ok: dead && !quiet, why: `failed listing, nothing fetched → ${dead ? "wound" : "no wound"} · ok listing, nothing locked → ${quiet ? "WOUND" : "no wound"}` };
  });
  if (want("W9")) await guard("W9", () => {
    if (!sm) return { ok: false, why: NONE };
    healthy(); put("throwin_state.json", { wired: true, last_error: "fetch_fail", last_poll_at: isoAt(5) });
    const dead = facts().wounds.some((w) => w.sensor === "throwin");
    put("throwin_state.json", { wired: false, last_error: "fetch_fail" });
    const dormant = facts().wounds.some((w) => w.sensor === "throwin");
    return { ok: dead && !dormant, why: `wired + last_error → ${dead ? "wound" : "no wound"} · dormant → ${dormant ? "WOUND" : "no wound"}` };
  });
  if (want("W13")) await guard("W13", () => {
    if (!sm) return { ok: false, why: NONE };
    const f = facts(join(ROOT, "s-no-such-state-dir")); const line = lineOf(f);
    return { ok: f.known === true && f.wounds.length === 0 && f.unknown.length === sm.SEED_ROW.subjects.length && / · senses \? presence,/.test(line) && !/senses ✗/.test(line),
      why: `${f.unknown.length} unknown · ${f.wounds.length} wound(s) · line tail …${line.slice(-60)}` };
  });
}

// ── BOUND · LAST ────────────────────────────────────────────────────────────────────────────────────────────────────────
const walk = (root, dir = "", o = new Map()) => {
  for (const e of readdirSync(join(root, dir), { withFileTypes: true })) {
    const rel = dir ? `${dir}/${e.name}` : e.name;
    if (!dir && (e.name === "node_modules" || e.name === ".git")) continue;
    if (e.isDirectory()) walk(root, rel, o);
    else if (e.isFile()) { const b = readFileSync(join(root, rel)); const t = b.includes(0) ? b : Buffer.from(b.toString("utf8").replace(/\r\n/g, "\n")); o.set(rel, createHash("sha256").update(t).digest("hex")); }
  }
  return o;
};
if (!ONLY) await guard("BOUND", () => {
  if (!BASE_ORG) return { ok: false, why: "no --base-org: the bound cannot be measured" };
  const a = walk(BASE_ORG), b = walk(ORG);
  const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort();
  const extra = diff.filter((f) => !NAMED.includes(f) && !NAMED_DIRS.some((d) => f.startsWith(d)));
  return { ok: extra.length === 0, why: `${diff.length} file(s) differ${extra.length ? ` · BEYOND THE NAMED: ${extra.slice(0, 12).join(", ")}${extra.length > 12 ? ` (+${extra.length - 12})` : ""}` : ""}` };
});
try { rmSync(ROOT, { recursive: true, force: true }); } catch { /* a survivor holds a file: LAST names it */ }
await guard("LAST", () => {
  let table = "";
  try {
    table = process.platform === "win32"
      ? execFileSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8" })
      : execFileSync("ps", ["-eo", "args"], { encoding: "utf8" });
  } catch (e) { return { ok: false, why: `process table unreadable: ${e.message}` }; }
  const left = table.split(/\r?\n/).filter((l) => l.includes(ROOT) && !/\bps -eo\b/.test(l));
  return { ok: left.length === 0, why: `${left.length} survivor(s)` };
});
const red = results.filter((r) => !r.ok).map((r) => r.id);
if (red.length) { console.log(`RED ${UNIT} · ${red.join(", ")}`); process.exit(1); }
console.log(`GREEN ${UNIT} a sensor whose input is dead reads red by name on the one state line, exits non-zero, and asks its launcher once per dead span · ${results.length} clause(s)`);
process.exit(0);
