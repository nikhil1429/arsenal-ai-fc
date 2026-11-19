#!/usr/bin/env node
// ============================================================================
// ci/mlaw/witness_mlaw.mjs — unit mlaw (forks rows 1137 (1)-(3)): the law pack is judged on the neutral machine and its rise
// has a number. P1 (F1 B) REQUIRED_LEGS derived from suite.yml · P2 (F2 A) the law pack leaves the LIVE tables, the NUL scan
// whole · P3 (F3 A) ORGANISM_TEST_LAWPACK + a rise at head over the merge base is a NEW red by law and numbers, a base with no
// such line compared against lawpack.mjs BASELINE · F6 B conductor's closed-port probe takes an OS-picked port.
// ----------------------------------------------------------------------------
// USAGE: node ci/mlaw/witness_mlaw.mjs --org <dir> --base-org <dir>
//   --org       the tree to witness (an LF tree; never his live tree — every organ run is on a COPY of it under os.tmpdir())
//   --base-org  the BASE tree (ci/mlaw/BASE): JUGAD's counts and BOUND's file set are read against it.
// CONTRACT — every organ run (an import, a selftest, lawpack gate, organism_test, ci_verdict compare) is on its OWN COPY of a
//   tree under os.tmpdir(), made by this script: the tree's files minus .git / node_modules / dressing-room/state, an EMPTY
//   dressing-room/state planted in (PORT alone copies in the three TRACKED files the conductor selftest's census names:
//   registry.json, captain.json, tasks_expected.json — from the tree, never from his live state), node_modules linked (a
//   junction on Windows), and — where the law pack lists the tree with `git ls-files` — a git repository made with
//   core.autocrlf=false at init. Each child gets its own HOME / USERPROFILE / APPDATA / TMPDIR under the temp root; a FAKE
//   claude and gemini sit FIRST on PATH and log any spawn (no live model call); ANTHROPIC_API_KEY, GITHUB_ACTIONS,
//   ORGANISM_TEST_PROFILE, NODE_OPTIONS and ARSENAL_ORGAN are removed. No fixed service port: the witness binds nothing; PORT's
//   journal only RECORDS the ports the conductor selftest listens on and connects to. Nothing is POSTed at a daemon, nothing
//   restarted, every child is a spawnSync that ends by itself (its own wait: the organs' own bounds, none typed here).
//   Windows: path keys use forward slashes, every read is CRLF-proof, processes are listed without /proc.
// CLAUSES (each planted both ways: RED on the BASE, GREEN on the build — ci/mlaw/run_mutants_mlaw.mjs breaks each one alone):
//   LEGS      P1 · on a copy whose suite.yml matrix line gains a node, ci_verdict.mjs's REQUIRED_LEGS gains that leg (derived,
//             never typed), and on the unplanted copy it equals one leg per matrix node; and the tree's own law pack scan
//             (judgeJugad(scan().matches)) sites NO jugad finding in scripts/ci_verdict.mjs.
//   JUGAD     P1 · `lawpack.mjs gate` on a copy of --org and of --base-org: no count on --org's findings line is higher than
//             --base-org's, jugad-literal-subject-list is LOWER, and lawpack.mjs's BASELINE is byte-equal on both sides.
//   HERMETIC  P2 · lawpack is in neither LIVE_MODES nor LIVE_SELFTESTS of --org's organism_test.mjs, and every key of the three
//             LIVE tables at --org is a key at --base-org (they only shrink); on an EMPTY-state copy the hermetic
//             `organism_test.mjs lawpack` prints no `LIVE MODE lawpack`, JUDGES the LAW PACK assert, and prints an
//             ORGANISM_TEST_LAWPACK line equal to the full profile's on the same copy; `lawpack.mjs selftest` there exits 0.
//   RISE      P3 · two copies, A = the tree + one planted literal subject list, B = the tree + two: the tree's own organism_test
//             lawpack run on each, judged by the tree's own `ci_verdict.mjs compare`: head B over base A is RED with the NEW red
//             `LAW PACK ROSE · jugad-literal-subject-list <a> → <b>`; head A over base B (a FALL) and A over A are GREEN.
//   NOLINE    P3 · head B over base B with the base's law pack line REMOVED is RED naming the rise against lawpack.mjs's
//             BASELINE (read from the tree's lawpack.mjs, never typed); a head whose counts EQUAL that BASELINE is GREEN.
//   PORT      F6 B · scripts/conductor.mjs calls portOpen with no literal port, and its selftest on a copy, under a preload that
//             journals listen() and connect(), exits 0 with its portOpen assert passing, and connects to NO port that the same
//             process did not first get from a listen(0) (a fixed closed port would be a live service on his laptop).
//   BOUND     --org differs from --base-org ONLY in the named files (scripts/organism_test.mjs, scripts/ci_verdict.mjs,
//             scripts/conductor.mjs, scripts/done.mjs, scripts/usage_tap.mjs); ci/mlaw/** is this unit's own output and
//             .claude/settings.json the seat's effort key, both left out by name. Tracked files when the side is a git tree.
//   LAST      no node process naming the temp root survives, and the fake claude / gemini logged no spawn.
// LAST LINE: GREEN MLAW the law pack judged hermetic, its rise a new red · <n> clause(s)  (exit 0)  ·  RED MLAW · <clauses>  (exit 1)
// ============================================================================
import { cpSync, mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, symlinkSync, chmodSync } from "node:fs";
import { join, resolve, relative, sep, delimiter } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? resolve(process.argv[i + 1]) : null; };
const ORG = arg("--org"), BASE_ORG = arg("--base-org");
if (!ORG || !existsSync(join(ORG, "scripts", "lawpack.mjs")) || !BASE_ORG || !existsSync(join(BASE_ORG, "scripts", "lawpack.mjs"))) {
  console.log("RED MLAW · USAGE (--org <dir> --base-org <dir>, each with scripts/lawpack.mjs)"); process.exit(1);
}

const NAMED = ["scripts/organism_test.mjs", "scripts/ci_verdict.mjs", "scripts/conductor.mjs", "scripts/done.mjs", "scripts/usage_tap.mjs"];
const JUGAD = "jugad-literal-subject-list";
const LP_LINE = "ORGANISM_TEST_LAWPACK";
const SKIP_TOP = new Set([".git", "node_modules"]);
const STATE = "dressing-room/state";
const ROOT = mkdtempSync(join(tmpdir(), "mlaw-wit-"));
const results = [];
const clause = (id, ok, why) => { results.push({ id, ok: !!ok }); console.log(`  ${ok ? "ok  " : "RED "} ${id} · ${why}`); };
const slash = (p) => p.split(sep).join("/");
const sha = (b) => createHash("sha256").update(b).digest("hex");
const read = (f) => (existsSync(f) ? readFileSync(f, "utf8").replace(/\r\n/g, "\n") : null);
const lines = (t) => String(t || "").split(/\r?\n/);
const clip = (s, n = 110) => { const t = String(s ?? "").replace(/\s+/g, " ").trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };

// the fake claude and gemini, first on PATH (a .cmd beside each for Windows)
const FAKE = join(ROOT, "fakebin"), FAKE_LOG = join(ROOT, "fake_spawns.log");
mkdirSync(FAKE, { recursive: true });
for (const tool of ["claude", "gemini"]) {
  writeFileSync(join(FAKE, tool), `#!/bin/sh\necho "${tool} $*" >> "$MLAW_FAKE_LOG"\nexit 1\n`);
  chmodSync(join(FAKE, tool), 0o755);
  writeFileSync(join(FAKE, `${tool}.cmd`), `@echo ${tool} %* >> "%MLAW_FAKE_LOG%"\r\n@exit /b 1\r\n`);
}

let seq = 0;
/** a fresh copy of `src` under the temp root: no .git / node_modules / state; an EMPTY state dir, `stateFiles` copied in from
 *  the TREE's own (tracked) state; node_modules linked; a git repository (core.autocrlf=false) when `git` */
function copyOf(src, tag, { git = false, stateFiles = [] } = {}) {
  const dst = join(ROOT, `${tag}-${++seq}`);
  cpSync(src, dst, { recursive: true, filter: (p) => {
    const rel = slash(relative(src, p));
    if (!rel) return true;
    if (SKIP_TOP.has(rel.split("/")[0])) return false;
    return !(rel === STATE || rel.startsWith(`${STATE}/`));
  } });
  const st = join(dst, ...STATE.split("/"));
  mkdirSync(st, { recursive: true });
  for (const f of stateFiles) { const from = join(src, ...STATE.split("/"), f); if (existsSync(from)) cpSync(from, join(st, f)); }
  if (existsSync(join(src, "node_modules"))) symlinkSync(join(src, "node_modules"), join(dst, "node_modules"), "junction");
  if (git) {
    const g = (...a) => spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "-c", "user.name=mlaw-witness", "-c", "user.email=witness@invalid", "-c", "commit.gpgsign=false", ...a], { cwd: dst, encoding: "utf8", windowsHide: true, maxBuffer: 1 << 28 });
    g("init", "-q");
    g("config", "core.autocrlf", "false");
    writeFileSync(join(dst, ".git", "info", "exclude"), "node_modules\n");
    g("add", "-A");
    const c = g("commit", "-q", "--no-verify", "-m", "mlaw witness plant");
    if (c.status !== 0) throw new Error(`git commit in the copy failed: ${clip(c.stderr)}`);
  }
  return dst;
}
/** commit a planted edit inside a git copy (the law pack lists the tree with git ls-files) */
const recommit = (copy) => {
  const g = (...a) => spawnSync("git", ["-c", "core.autocrlf=false", "-c", "user.name=mlaw-witness", "-c", "user.email=witness@invalid", "-c", "commit.gpgsign=false", ...a], { cwd: copy, encoding: "utf8", windowsHide: true });
  g("add", "-A"); g("commit", "-q", "--no-verify", "-m", "mlaw witness edit");
};
function envFor(copy, extra = {}) {
  const tag = slash(relative(ROOT, copy)).replace(/\//g, "_");
  const home = join(ROOT, `home-${tag}`), tmp = join(ROOT, `tmp-${tag}`);
  mkdirSync(home, { recursive: true }); mkdirSync(tmp, { recursive: true });
  const e = { ...process.env };
  for (const k of ["ANTHROPIC_API_KEY", "NODE_OPTIONS", "ARSENAL_ORGAN", "GITHUB_ACTIONS", "ORGANISM_TEST_PROFILE"]) delete e[k];
  const pathKey = Object.keys(e).find((k) => k.toUpperCase() === "PATH") || "PATH";
  return { ...e, [pathKey]: `${FAKE}${delimiter}${e[pathKey] || ""}`, HOME: home, USERPROFILE: home, APPDATA: home, TMPDIR: tmp, TEMP: tmp, TMP: tmp,
    ARSENAL_ARCHIVE: join(ROOT, `archive-${tag}`), MLAW_FAKE_LOG: FAKE_LOG, ...extra };
}
const node = (copy, args, extra = {}) => {
  const r = spawnSync(process.execPath, args, { cwd: copy, encoding: "utf8", env: envFor(copy, extra), windowsHide: true, maxBuffer: 1 << 28, input: "" });
  return { status: r.status, out: String(r.stdout || ""), err: String(r.stderr || ""), all: String(r.stdout || "") + String(r.stderr || "") };
};
const evalIn = (copy, code) => {
  const r = node(copy, ["--input-type=module", "-e", code]);
  try { return JSON.parse(lines(r.out.trim()).at(-1)); } catch { return { error: clip(lines(r.err.trim()).filter(Boolean).at(-1) || r.out) }; }
};
const href = (copy, rel) => JSON.stringify(pathToFileURL(join(copy, ...rel.split("/"))).href);
/** the law pack gate's `findings:` line as { law: n } */
function counts(out) {
  const l = lines(out).find((x) => /^lawpack · .* · findings: /.test(x));
  if (!l) return null;
  const c = {};
  for (const part of l.slice(l.indexOf("findings: ") + 10).split(" · ")) { const m = /^(\S+) (\d+)$/.exec(part.trim()); if (m) c[m[1]] = Number(m[2]); }
  return Object.keys(c).length ? c : null;
}
const lpLine = (out) => lines(out).find((l) => l.startsWith(`${LP_LINE} `)) || null;
/** the keys of one `const <NAME> = Object.freeze({ … });` table in organism_test.mjs's source */
function tableKeys(src, name) {
  const s = String(src || "");
  const i = s.indexOf(`const ${name} = Object.freeze({`);
  if (i < 0) return null;
  const body = s.slice(i, s.indexOf("\n});", i));
  return lines(body).slice(1).map((l) => /^\s*(?:"((?:[^"\\]|\\.)*)"|([A-Za-z_$][\w$-]*))\s*:/.exec(l)).filter(Boolean).map((m) => (m[1] !== undefined ? m[1] : m[2]));
}
const PLANT = (n) => Array.from({ length: n }, (_, i) => `const MLAW_PLANT_${i} = ["alpha${i}", "beta${i}"];\nexport { MLAW_PLANT_${i} };\n`).join("");

let exitCode = 1;
try {
  // ── LEGS ──
  {
    const c = copyOf(ORG, "legs", { git: true });
    const civ = href(c, "scripts/ci_verdict.mjs");
    const plain = evalIn(c, `const m = await import(${civ}); console.log(JSON.stringify(m.REQUIRED_LEGS));`);
    const yml = join(c, ".github", "workflows", "suite.yml");
    const text = read(yml) || "";
    const mm = /^(\s*node:\s*\[)([^\]]*)(\])/m.exec(text);
    const nodes = mm ? mm[2].split(",").map((s) => s.trim()).filter(Boolean) : [];
    const extra = String(Math.max(0, ...nodes.map(Number).filter(Number.isFinite)) + 2);
    let planted = { error: "no matrix line to plant" };
    const site = evalIn(c, `const lp = await import(${href(c, "scripts/lawpack.mjs")}); const j = lp.judgeJugad(lp.scan().matches); console.log(JSON.stringify(j.findings.filter((f) => /(^|\\/)ci_verdict\\.mjs$/.test(f.file)).map((f) => f.file + ":" + f.line)));`);
    if (mm) {
      const c2 = copyOf(ORG, "legs-plant");
      writeFileSync(join(c2, ".github", "workflows", "suite.yml"), text.replace(mm[0], `${mm[1]}${[...nodes, extra].join(", ")}${mm[3]}`));
      planted = evalIn(c2, `const m = await import(${href(c2, "scripts/ci_verdict.mjs")}); console.log(JSON.stringify(m.REQUIRED_LEGS));`);
    }
    const okPlain = Array.isArray(plain) && nodes.length > 0 && plain.length === nodes.length && nodes.every((n, i) => String(plain[i]).endsWith(` ${n}`));
    const okPlant = Array.isArray(planted) && planted.length === nodes.length + 1 && String(planted.at(-1)).endsWith(` ${extra}`);
    clause("LEGS", okPlain && okPlant && Array.isArray(site) && site.length === 0,
      `matrix [${nodes.join(", ")}] → ${Array.isArray(plain) ? plain.length : "?"} leg(s) · planted [+${extra}] → ${Array.isArray(planted) ? `${planted.length} leg(s), last "${planted.at(-1)}"` : clip(planted.error)} · jugad finding(s) in ci_verdict.mjs: ${Array.isArray(site) ? (site.join(", ") || "none") : clip(site.error)}`);
  }

  // ── JUGAD ──
  {
    const gate = (tree, tag) => { const c = copyOf(tree, tag, { git: true }); const r = node(c, [join(c, "scripts", "lawpack.mjs"), "gate"]); return { c, r, n: counts(r.all) }; };
    const o = gate(ORG, "jo"), b = gate(BASE_ORG, "jb");
    const baselineOf = (tree) => { const s = read(join(tree, "scripts", "lawpack.mjs")) || ""; const i = s.indexOf("export const BASELINE = {"); return i < 0 ? null : s.slice(i, s.indexOf("\n};", i)); };
    const bo = baselineOf(ORG), bb = baselineOf(BASE_ORG);
    const rose = o.n && b.n ? Object.keys(o.n).filter((k) => o.n[k] > (b.n[k] ?? 0)) : null;
    const fell = o.n && b.n ? o.n[JUGAD] < b.n[JUGAD] : false;
    clause("JUGAD", !!o.n && !!b.n && rose.length === 0 && fell && !!bo && bo === bb,
      `${JUGAD} ${o.n ? o.n[JUGAD] : "?"} at --org, ${b.n ? b.n[JUGAD] : "?"} at --base-org · count(s) higher at --org: ${rose ? (rose.join(", ") || "none") : "? (no findings line)"} · lawpack.mjs BASELINE ${bo && bo === bb ? "byte-equal" : "DIFFERS or unreadable"} · ${clip(lines(o.r.all).filter((l) => /^lawpack: /.test(l.trim())).at(-1), 70)}`);
  }

  // ── HERMETIC ──
  {
    const so = read(join(ORG, "scripts", "organism_test.mjs")), sb = read(join(BASE_ORG, "scripts", "organism_test.mjs"));
    const T = ["LIVE_SELFTESTS", "LIVE_ASSERTS", "LIVE_MODES"];
    const ko = Object.fromEntries(T.map((t) => [t, tableKeys(so, t)])), kb = Object.fromEntries(T.map((t) => [t, tableKeys(sb, t)]));
    const tablesRead = T.every((t) => Array.isArray(ko[t]) && Array.isArray(kb[t]) && kb[t].length > 0);
    const grown = tablesRead ? T.flatMap((t) => ko[t].filter((k) => !kb[t].includes(k)).map((k) => `${t}.${k}`)) : null;
    const inLive = tablesRead ? ["LIVE_SELFTESTS", "LIVE_MODES"].filter((t) => ko[t].includes("lawpack")) : null;
    const c = copyOf(ORG, "herm", { git: true });
    const h = node(c, [join(c, "scripts", "organism_test.mjs"), "lawpack"], { ORGANISM_TEST_PROFILE: "hermetic" });
    const f = node(c, [join(c, "scripts", "organism_test.mjs"), "lawpack"]);
    const st = node(c, [join(c, "scripts", "lawpack.mjs"), "selftest"]);
    const liveLine = lines(h.all).some((l) => /^\s*LIVE MODE lawpack\b/.test(l));
    const judged = lines(h.all).some((l) => /^\s*(ok|FAIL)\s+LAW PACK — /.test(l));
    const lh = lpLine(h.all), lf = lpLine(f.all);
    const stHead = lines(st.all).filter((l) => /^lawpack selftest: /.test(l.trim())).at(-1) || "no headline";
    clause("HERMETIC", tablesRead && grown.length === 0 && inLive.length === 0 && !liveLine && judged && !!lh && lh === lf && st.status === 0,
      `lawpack in LIVE table(s): ${inLive ? (inLive.join(", ") || "none") : "? (tables unread)"} · keys at --org not at --base-org: ${grown ? (grown.join(", ") || "none") : "?"} · hermetic run on an EMPTY state dir: ${liveLine ? "LIVE MODE lawpack (not judged)" : judged ? "the LAW PACK assert judged" : "no LAW PACK assert line"} · machine line ${lh ? (lh === lf ? "equal to the full profile's" : "DIFFERS from the full profile's") : "ABSENT"} · ${clip(stHead, 50)} (exit ${st.status})`);
  }

  // ── RISE + NOLINE ── (the tree's own instruments, on two planted copies)
  {
    const plantRun = (n, tag) => {
      const c = copyOf(ORG, tag, { git: true });
      writeFileSync(join(c, "scripts", "zz_mlaw_plant.mjs"), PLANT(n));
      recommit(c);
      return { c, out: node(c, [join(c, "scripts", "organism_test.mjs"), "lawpack"]).all };
    };
    const A = plantRun(1, "riseA"), B = plantRun(2, "riseB");
    const io = join(ROOT, "io"); mkdirSync(io, { recursive: true });
    const put = (name, text) => { const p = join(io, name); writeFileSync(p, text); return p; };
    const pa = put("a.txt", A.out), pb = put("b.txt", B.out);
    const pbNo = put("b_noline.txt", lines(B.out).filter((l) => !l.startsWith(`${LP_LINE} `)).join("\n"));
    const compare = (head, base) => {
      const r = node(A.c, [join(A.c, "scripts", "ci_verdict.mjs"), "compare", "--head", head, "--base", base, "--label", "mlaw"]);
      const v = lines(r.all).find((l) => l.startsWith("B1_VERDICT ") && l.includes("{")) || lines(r.all).find((l) => l.includes("B1_VERDICT {")) || "";
      let p = null; try { p = JSON.parse(v.slice(v.indexOf("{"))); } catch { p = null; }
      return { code: r.status, p };
    };
    const ca = (lpLine(A.out) ? JSON.parse(lpLine(A.out).slice(LP_LINE.length + 1)) : null), cb = (lpLine(B.out) ? JSON.parse(lpLine(B.out).slice(LP_LINE.length + 1)) : null);
    const na = ca ? ca[JUGAD] : counts(A.out)?.[JUGAD], nb = cb ? cb[JUGAD] : counts(B.out)?.[JUGAD];
    const up = compare(pb, pa), down = compare(pa, pb), eq = compare(pa, pa);
    const want = `LAW PACK ROSE · ${JUGAD} ${na} → ${nb}`;
    const upOk = up.code === 1 && !!up.p && up.p.v === "RED" && (up.p.new || []).includes(want);
    const calm = (x) => x.code === 0 && !!x.p && x.p.v === "GREEN" && !(x.p.new || []).some((n) => /^LAW PACK ROSE/.test(n));
    clause("RISE", Number.isSafeInteger(na) && nb === na + 1 && upOk && calm(down) && calm(eq),
      `planted ${JUGAD} ${na ?? "?"} (A) → ${nb ?? "?"} (B) · head B over base A: ${up.p ? `${up.p.v}, new [${(up.p.new || []).map((n) => clip(n, 70)).join(" ; ")}]` : "no verdict"} (exit ${up.code}) · A over B (a fall): ${down.p ? down.p.v : "?"} · A over A: ${eq.p ? eq.p.v : "?"}`);
    // NOLINE — the base printed no law pack line: the tree's own lawpack.mjs BASELINE is the base
    const frozen = evalIn(A.c, `const m = await import(${href(A.c, "scripts/lawpack.mjs")}); console.log(JSON.stringify(m.BASELINE));`);
    const atBase = frozen && !frozen.error ? lines(B.out).map((l) => (l.startsWith(`${LP_LINE} `) ? `${LP_LINE} ${JSON.stringify(frozen)}` : l)).join("\n") : "";
    const noline = compare(pb, pbNo), flat = compare(put("at_baseline.txt", atBase), pbNo);
    const fb = frozen && !frozen.error ? frozen[JUGAD] : null;
    const want2 = `LAW PACK ROSE · ${JUGAD} ${fb} → ${nb}`;
    clause("NOLINE", Number.isSafeInteger(fb) && nb > fb && noline.code === 1 && !!noline.p && (noline.p.new || []).some((n) => n.startsWith(want2)) && calm(flat),
      `lawpack.mjs BASELINE ${JUGAD} ${fb ?? "? (unreadable)"} · head B over a base with no law pack line: ${noline.p ? `${noline.p.v}, new [${(noline.p.new || []).map((n) => clip(n, 70)).join(" ; ")}]` : "no verdict"} (exit ${noline.code}) · a head AT the baseline: ${flat.p ? flat.p.v : "?"}`);
  }

  // ── PORT ──
  {
    const src = read(join(ORG, "scripts", "conductor.mjs")) || "";
    const literal = lines(src).map((l, i) => (/\bportOpen\(\s*\d+\s*[,)]/.test(l) ? `conductor.mjs:${i + 1}` : null)).filter(Boolean);
    const c = copyOf(ORG, "port", { stateFiles: ["registry.json", "captain.json", "tasks_expected.json"] });
    const jr = join(ROOT, "port_journal.jsonl");
    const pre = join(ROOT, "port_preload.mjs");
    writeFileSync(pre, `import net from "node:net";\nimport { appendFileSync } from "node:fs";\nconst J = ${JSON.stringify(jr)};\nconst log = (o) => { try { appendFileSync(J, JSON.stringify(o) + "\\n"); } catch (e) { void e; } };\n`
      + `const L = net.Server.prototype.listen;\nnet.Server.prototype.listen = function (...a) { this.once("listening", () => { const ad = this.address(); log({ k: "listen", asked: typeof a[0] === "number" ? a[0] : (a[0] && typeof a[0] === "object" ? a[0].port : a[0]), got: ad && typeof ad === "object" ? ad.port : null }); }); return L.apply(this, a); };\n`
      + `const C = net.Socket.prototype.connect;\nnet.Socket.prototype.connect = function (...a) { const o = a[0]; const port = typeof o === "number" || typeof o === "string" ? Number(o) : o && typeof o === "object" ? Number(o.port) : null; if (port) log({ k: "connect", port }); return C.apply(this, a); };\n`);
    const r = node(c, ["--import", pathToFileURL(pre).href, join(c, "scripts", "conductor.mjs"), "selftest"]);
    const j = lines(read(jr)).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    const picked = new Set(j.filter((x) => x.k === "listen" && Number(x.asked) === 0 && x.got).map((x) => x.got));
    const fixedConnect = [...new Set(j.filter((x) => x.k === "connect" && !picked.has(x.port)).map((x) => x.port))];
    const fixedListen = [...new Set(j.filter((x) => x.k === "listen" && Number(x.asked) > 0).map((x) => x.asked))];
    const assertOk = lines(r.all).some((l) => /✓ DAEMON — portOpen says false for a port nobody is listening on/.test(l));
    const head = lines(r.all).filter((l) => /ALL CHECKS PASSED|SELFTEST FAILED|passed, \d+ failed/.test(l)).at(-1) || "no headline";
    clause("PORT", literal.length === 0 && r.status === 0 && assertOk && fixedConnect.length === 0 && fixedListen.length === 0,
      `portOpen with a literal port: ${literal.join(", ") || "none"} · conductor selftest exit ${r.status} (${clip(head, 50)}) · portOpen assert ${assertOk ? "passed" : "NOT passed"} · ${picked.size} OS-picked listen(s) · connect(s) to a port not OS-picked: ${fixedConnect.join(", ") || "none"} · fixed listen(s): ${fixedListen.join(", ") || "none"}`);
  }

  // ── BOUND ──
  {
    const files = (root) => {
      const acc = new Map();
      const g = existsSync(join(root, ".git")) ? spawnSync("git", ["-C", root, "ls-files", "-z"], { encoding: "utf8", maxBuffer: 1 << 28, windowsHide: true }) : null;
      let rels;
      if (g && g.status === 0) rels = String(g.stdout).split("\0").filter(Boolean);
      else {
        rels = [];
        const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name), rel = slash(relative(root, p)); if (SKIP_TOP.has(rel.split("/")[0])) continue; if (e.isDirectory()) walk(p); else if (e.isFile()) rels.push(rel); } };
        walk(root);
      }
      for (const rel of rels) { const p = join(root, rel); acc.set(rel, existsSync(p) ? sha(Buffer.from(readFileSync(p, "latin1").replace(/\r\n/g, "\n"), "latin1")) : "(missing)"); }
      return acc;
    };
    const a = files(ORG), bb = files(BASE_ORG);
    const diff = [...new Set([...a.keys(), ...bb.keys()])].filter((k) => a.get(k) !== bb.get(k)).filter((k) => !k.startsWith("ci/mlaw/") && k !== ".claude/settings.json").sort();
    const outside = diff.filter((k) => !NAMED.includes(k));
    clause("BOUND", outside.length === 0, `differs from BASE in ${diff.length} file(s): ${diff.join(", ") || "none"}${outside.length ? ` · OUTSIDE THE NAMED: ${outside.slice(0, 12).join(", ")}${outside.length > 12 ? ` … (+${outside.length - 12})` : ""}` : ""}`);
  }
} catch (e) {
  clause("WITNESS", false, `threw: ${String((e && e.stack) || e).split("\n").slice(0, 3).join(" | ")}`);
} finally {
  // ── LAST ──
  const procs = (() => {
    const r = process.platform === "win32"
      ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true })
      : spawnSync("ps", ["-eo", "pid,args"], { encoding: "utf8" });
    const rootFwd = slash(ROOT);
    return lines(r.stdout).filter((l) => (l.includes(ROOT) || l.includes(rootFwd)) && !l.trim().startsWith(String(process.pid) + " ") && !/\b(ps|powershell)\b/.test(l));
  })();
  const spawned = lines(read(FAKE_LOG)).filter(Boolean);
  clause("LAST", procs.length === 0 && spawned.length === 0, `${procs.length} node process(es) naming the temp root survive · the fake claude / gemini logged ${spawned.length} spawn(s)`);
  try { rmSync(ROOT, { recursive: true, force: true }); } catch { /* the temp root is the OS's to reap if it is still held */ }
  const red = results.filter((r) => !r.ok).map((r) => r.id);
  if (red.length) console.log(`RED MLAW · ${red.join(" · ")}`);
  else { console.log(`GREEN MLAW the law pack judged hermetic, its rise a new red · ${results.length} clause(s)`); exitCode = 0; }
  process.exitCode = exitCode;
}
