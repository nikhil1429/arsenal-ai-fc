#!/usr/bin/env node
// ============================================================================
// ci/mkp24/witness_mkp24.mjs — UNIT mkp24 · THE KEEPER FAMILY NAMES EACH RED BY A CODED CAUSE (shape C0; forks rows
// 1185 (5) / 1186 (4) / 1213 (3) / 1215 (4) / 1216; spec ci/mkp24/MKP24_SPEC.md at 229fbed, the row winning where they differ)
// ----------------------------------------------------------------------------
//   node ci/mkp24/witness_mkp24.mjs --org <tree> --base-org <tree>
// CONTRACT (judged on --org; the build reads GREEN, the cut 25f13f2 reads RED). The --org tree's scripts/, setup/,
// package.json, .github/, dressing-room/state/ and ci/mlv1, ci/mlv2, ci/mlv3, ci/mrv are COPIED under os.tmpdir() (node
// writes, never a shell); the --org tree's OWN keeper witnesses run over that copy, each under ONE plant of
// ci/mkp24/plant_mkp24.mjs (a preload). Every cause below is the one the member would build: the copy's OWN
// scripts/witness_cause.mjs causesOf on the judged ids (the member's judgeLast fold, replayed) and the witness's `CAUSE`
// lines, each kept only if the copy's OWN verifyCause rebuilds it from the witness's tracked source (the second check).
//   K1 RETIRE-LATE  mlv3 under p-stale (the closure write never surfaced to the worker: its watch a no-op, its stat the
//                   boot mtime): T1 IDLE is red and its verified cause names RETIRE-LATE with that code's text in mlv3's
//                   own CAUSES literal. (The spec's p-watch alone does not hold T1: see ci/mkp24/PROOF.md.)
//   K2 NO-GAP       mlv3 under p-gap (no send finds nothing listening): T2 ONCE is red with NO-GAP, and not with LOST.
//   K3 PORT         mlv1 under p-hold (the killed keeper's planted port held after its exit): I2 MID or I3 JUDGE is red
//                   with NOT-UP-PORT.
//   K4 LOST         mlv3 under p-drop (the worker drops one acknowledged event): T2 ONCE is red with LOST and with no
//                   clock code, so the organ-defect code is separable from every timer.
//   K5 UNPLANTED    the four family witnesses carry ONE CAUSES literal, byte-identical, every key of the code grammar (no
//                   digits) and no digit in any text; mlv1 run with no plant reads GREEN and prints no CAUSE line.
//   K6 NO-LEAK      a toy witness in a planted git copy prints a canary as a CODE, a known CODE, and a FORGED text for it;
//                   through the copy's own member, compare and reader the canary and the forged text are in ZERO leaving
//                   lines, the source text of the known CODE and the toy's multi-word claim ARE readable, and a WITHHELD
//                   cause is readable.
//   K7 REPLAY       the first readable red, replayed on the copy's own module (row 1216 K-F10 A): left `T1 IDLE LIVE-SAFE`
//                   on mlv3's source gives the claims of T1 IDLE and LIVE-SAFE and no WITHHELD; `M1 PORTHELD` on mrv's
//                   source gives M1 PORTHELD's own claim; each rebuilds through verifyCause.
//   K8 MRV          mrv --only "M3 BOOT" under p-stale: mrv's M3 BOOT is red and its verified cause carries the inner
//                   code RETIRE-LATE through, mapped to mrv's clause id.
//   BOUND           against --base-org, outside ci/ only scripts/organism_test.mjs and scripts/witness_cause.mjs differ, and
//                   both do; inside ci/ only the four family witness files and ci/mkp24/ (by text, CRLF folded).
//   LAST            no node process naming this run's temp dir survives.
// THE PORT CLASS (row 1053): no fixed port is bound; every child run gets ARSENAL_JUDGE_PORT on an OS-picked port (the
// keeper's door, honoured only under the temp dir); p-hold binds only the planted port the judged witness itself handed its
// keeper. No live service is named, nothing is POSTed by this file, nothing outside the temp dir restarts. Every wait ends
// on a child's exit, inside the judged witness's own bounds, under the --org tree's suite.yml timeout-minutes (read).
// LAST LINE: GREEN MKP24 <what> · <n> clause(s) (exit 0) or RED MKP24 · <clauses> (exit 1)
// Portable: no POSIX-only shell; every read is split on /\r?\n/; every git repo is made with core.autocrlf=false.
// ============================================================================
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync, readdirSync, cpSync, symlinkSync, statSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { randomBytes } from "node:crypto";
import { pathToFileURL, fileURLToPath } from "node:url";

const T0 = Date.now();
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("RED MKP24 · USAGE (--org <dir> --base-org <dir>)"); process.exit(1); }
const UNIT = "MKP24", HERE = dirname(fileURLToPath(import.meta.url)), PLANT = join(HERE, "plant_mkp24.mjs");
const FAMILY = ["mlv1", "mlv2", "mlv3", "mrv"];
const TMP = mkdtempSync(join(tmpdir(), "mkp24-witness-"));
const lines = (s) => String(s).split(/\r?\n/);
const reds = [], greens = [];
const clause = (id, ok, why) => { (ok ? greens : reds).push(id); console.log(`  ${ok ? "GREEN" : "RED  "} ${id} · ${why}`); };
const wf = (() => { try { return readFileSync(join(ORG, ".github", "workflows", "suite.yml"), "utf8"); } catch { return ""; } })();
const jobMin = Number((/timeout-minutes:\s*(\d+)/.exec(wf) || [])[1]);
const left = () => Math.max(1, T0 + (jobMin > 0 ? jobMin : 1) * 60000 - Date.now());
const freePort = () => new Promise((res) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const a = s.address(); s.close(() => res(typeof a === "object" && a ? a.port : 0)); }); });

// THE CHILDREN'S TEMP DIR: every child of this witness gets TMPDIR/TMP/TEMP under this run's TMP, so the keeper witnesses'
// own temp dirs (and every keeper they start) name this run's TMP: LAST sees each survivor, and the rm takes them all.
const KT = join(TMP, "t"); mkdirSync(KT);
const TENV = { TMPDIR: KT, TMP: KT, TEMP: KT };
// THE COPY: what the keeper witnesses read (they copy it once more into their own temp dirs)
const COPY = join(KT, "org");
for (const p of [["scripts"], ["setup"], ["package.json"], [".github"], ["dressing-room", "state"], ...FAMILY.map((u) => ["ci", u])]) if (existsSync(join(ORG, ...p))) cpSync(join(ORG, ...p), join(COPY, ...p), { recursive: true, filter: (s) => !/\.log$/.test(s) && !/[\\/]node_modules([\\/]|$)/.test(s) });
if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(COPY, "node_modules"), process.platform === "win32" ? "junction" : "dir");
const modUrl = pathToFileURL(join(COPY, "scripts", "witness_cause.mjs")).href;
const wc = existsSync(join(COPY, "scripts", "witness_cause.mjs")) ? await import(modUrl) : null;
const srcOf = (u) => { try { return readFileSync(join(COPY, "ci", u, `witness_${u}.mjs`), "utf8"); } catch { return ""; } };
console.log(`witness mkp24 · org ${ORG} · base ${BASE} · bound ${jobMin} min (the --org suite.yml) · the copy's witness_cause ${wc ? "present" : "ABSENT"}`);

/** the member's judgeLast fold (scripts/organism_test.mjs), replayed: the LAST line's ids beyond BOUND */
const boundIds = (src) => [...new Set(["BOUND", ...[...src.matchAll(/["'`]((?:[A-Z][A-Z0-9-]*\s+)?BOUND)["'`]/g)].map((m) => m[1])])].sort((a, b) => b.length - a.length);
function judged(out, code, unit) {
  const last = lines(out).map((s) => s.trim()).filter(Boolean).pop() || "";
  const m = new RegExp(`^RED ${unit.toUpperCase()} · (.*)$`).exec(last);
  if (code !== 1 || !m) return { last, left: "" };
  let rest = ` ${m[1]} `;
  for (const id of boundIds(srcOf(unit))) rest = rest.split(new RegExp(`(?<=^|[\\s,·])${id.replace(/\s+/g, "\\s+")}(?=$|[\\s,·])`)).join(" ");
  return { last, left: rest.replace(/[\s,·]+/g, " ").trim() };
}
/** the causes the member would build and compare would keep, for <unit>'s run */
function causesOfRun(unit, r) {
  if (!wc) return [];
  const src = srcOf(unit), said = lines(r.out).map((x) => x.trim()).filter((x) => /^CAUSE /.test(x));
  const M = `WITNESS ‹${unit}› · GREEN at head against its BASE`;
  return wc.causesOf({ left: r.left, src, kind: "clauses", code: r.code, cause: said })
    .map((c) => wc.verifyCause(wc.causeText(M, c), [M], (u) => srcOf(u))).filter(Boolean).map((v) => v.cause);
}
const codeText = (unit, code) => { const m = wc && wc.codesOf ? wc.codesOf(srcOf(unit)) : new Map(); return m.get(code) ?? null; };

let runNo = 0;
/** run the copy's ci/<unit> witness under ONE plant; resolves at the child's EXIT (killed at the member-derived bound) */
async function runUnder(unit, plant, extra = []) {
  const dir = join(KT, `plant-${++runNo}-${unit}-${plant}`); mkdirSync(dir);
  const env = { ...process.env, ...TENV, ARSENAL_JUDGE_PORT: String(await freePort()), MKP24_PLANT: plant, MKP24_DIR: dir,
    NODE_OPTIONS: `${process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : ""}--import=${pathToFileURL(PLANT).href}` };
  const w = join(COPY, "ci", unit, `witness_${unit}.mjs`);
  if (!existsSync(w)) return { out: "", code: null, last: `no ${unit} witness in --org`, left: "", engaged: "" };
  const c = spawn(process.execPath, [w, "--org", COPY, ...extra], { cwd: TMP, env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  let out = "";
  c.stdout.on("data", (d) => { out += String(d); }); c.stderr.on("data", (d) => { out += String(d); });
  const timer = setTimeout(() => { try { c.kill(); } catch { /* gone */ } }, left());
  const code = await new Promise((r) => c.once("exit", (x) => r(x)));
  clearTimeout(timer);
  const j = judged(out, code, unit);
  const engaged = existsSync(join(dir, "engaged")) ? readFileSync(join(dir, "engaged"), "utf8").trim().split(/\r?\n/)[0] : "";
  return { out, code, last: j.last, left: j.left, engaged };
}
const short = (s) => String(s).replace(/\s+/g, " ").slice(0, 160);
const CLOCK = ["RETIRE-LATE", "RESPAWN-LATE", "RESPAWN-FAIL", "DRAIN-LATE", "NO-GAP", "NOT-UP", "NOT-UP-PORT", "NOT-UP-WAITING", "NOT-UP-WORKER", "NOT-UP-KEEPER"];

// ── K1 · K2 · K4 (mlv3) · K3 (mlv1) ──
const want = (unit, r, id, code, not = []) => {
  const cz = causesOfRun(unit, r), text = codeText(unit, code);
  const hit = !!text && cz.includes(`${id} · ${code} · ${text}`), bad = cz.filter((c) => c.startsWith(`${id} · `) && not.some((n) => c.startsWith(`${id} · ${n} · `)));
  return { ok: !!r.engaged && r.left.includes(id) && hit && bad.length === 0,
    why: `plant ${r.engaged ? "engaged" : "DID NOT ENGAGE"} · judged ${r.left || "(green)"} · ${id} ${hit ? `carries ${code}` : `does NOT carry ${code}`}${bad.length ? ` · and carries ${bad.map((b) => b.split(" · ")[1]).join(", ")}` : ""} · causes: ${short(cz.map((c) => c.split(" · ").slice(0, 2).join(" ")).join(" ; ") || "none")}` };
};
{ const r = await runUnder("mlv3", "p-stale"); const v = want("mlv3", r, "T1 IDLE", "RETIRE-LATE"); clause("K1 RETIRE-LATE", v.ok, v.why); }
{ const r = await runUnder("mlv3", "p-gap"); const v = want("mlv3", r, "T2 ONCE", "NO-GAP", ["LOST"]); clause("K2 NO-GAP", v.ok, v.why); }
{
  const r = await runUnder("mlv1", "p-hold");
  const a = want("mlv1", r, "I2 MID", "NOT-UP-PORT"), b = want("mlv1", r, "I3 JUDGE", "NOT-UP-PORT");
  clause("K3 PORT", a.ok || b.ok, (a.ok ? a : b).why);
}
{ const r = await runUnder("mlv3", "p-drop"); const v = want("mlv3", r, "T2 ONCE", "LOST", CLOCK); clause("K4 LOST", v.ok, v.why); }

// ── K5 · the family literal, and an unplanted run ──
{
  const lit = FAMILY.map((u) => { const m = /(?:^|\n)const CAUSES = \{[^}]*\};?/.exec(srcOf(u).replace(/\r\n/g, "\n")); return m ? m[0].trim() : ""; });
  const same = lit.every((l) => l && l === lit[0]);
  const codes = wc && wc.codesOf ? wc.codesOf(srcOf("mlv1")) : new Map();
  const keys = [...lit[0].matchAll(/"([^"]*)"\s*:\s*"([^"]*)"/g)];
  const grammar = keys.length > 0 && keys.every((k) => /^[A-Z][A-Z-]*$/.test(k[1]) && !/\d/.test(k[2])) && codes.size === keys.length;
  const r = await runUnder("mlv1", "none");
  const said = lines(r.out).filter((l) => /^CAUSE /.test(l.trim())).length;
  const green = r.code === 0 && /^GREEN MLV1 /.test(r.last);
  clause("K5 UNPLANTED", same && grammar && green && said === 0, `the CAUSES literal ${same ? "byte-identical in the four" : "ABSENT or NOT identical in the four"} · ${keys.length} code(s), grammar ${grammar} · mlv1 unplanted ${green ? "GREEN" : `NOT GREEN (${short(r.last)})`} · ${said} CAUSE line(s)`);
}

// ── K6 · NO-LEAK through the copy's own member, compare and reader (mdtl's harness) ──
{
  const grepRe = (() => { const m = /grep -E "([^"]+)" "\$RUNNER_TEMP\/b1_head\.txt"/.exec(wf); try { return m ? new RegExp(m[1]) : null; } catch { return null; } })();
  const letters = (n) => [...randomBytes(n)].map((b) => String.fromCharCode(65 + (b % 26))).join("");
  const CANARY = `Q${letters(16)}`, FORGED = `forged code text ${randomBytes(8).toString("hex")}`;
  const KNOWN = "the planted code's own text", CLAIM = "the planted multi-word clause claims one thing";
  const toy = [
    "#!/usr/bin/env node",
    "// CONTRACT: node ci/toyc/witness_toyc.mjs --org <tree> --base-org <tree> (a toy planted by unit mkp24's witness)",
    `//   P1 ONE      ${CLAIM}`,
    "//   BOUND       a planted toy bounds nothing",
    "import { readFileSync } from \"node:fs\";",
    `const CAUSES = {\n  "KNOWN": "${KNOWN}",\n};`,
    "const c = readFileSync(String(process.env.MKP24_CANARY_FILE), \"utf8\").trim();",
    "console.log(`CAUSES {\"KNOWN\":\"${process.env.MKP24_FORGED}\"}`);",
    "console.log(`CAUSE P1 ONE ${c}`);",
    "console.log(\"CAUSE P1 ONE KNOWN\");",
    "console.log(`RED   P1 ONE · threw: ${c} ${process.env.MKP24_FORGED}`);",
    "console.log(\"RED TOYC · P1 ONE\");",
    "process.exit(1);",
  ].join("\n");
  const git = (cwd, a) => spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "-c", "user.name=witness", "-c", "user.email=witness@localhost", "-c", "commit.gpgsign=false", ...a], { cwd, encoding: "utf8", windowsHide: true, timeout: left() });
  const repo = join(KT, "toyrepo");
  mkdirSync(repo, { recursive: true });
  for (const p of ["scripts", ".github", "package.json"]) if (existsSync(join(COPY, p))) cpSync(join(COPY, p), join(repo, p), { recursive: true });
  mkdirSync(join(repo, "ci", "toyc"), { recursive: true });
  writeFileSync(join(repo, "ci", "toyc", "witness_toyc.mjs"), toy);
  let err = [git(repo, ["init", "-q"]), git(repo, ["add", "-A"]), git(repo, ["commit", "-q", "-m", "planted"])].find((x) => x.status !== 0);
  if (!err) {
    writeFileSync(join(repo, "ci", "toyc", "BASE"), `${String(git(repo, ["rev-parse", "HEAD"]).stdout || "").trim()}\n`);
    err = [git(repo, ["add", "-A"]), git(repo, ["commit", "-q", "-m", "planted BASE"])].find((x) => x.status !== 0);
  }
  const canaryFile = join(TMP, "planted", "dressing-room", "state", "canary.txt");
  mkdirSync(dirname(canaryFile), { recursive: true }); writeFileSync(canaryFile, CANARY);
  let memberOut = "", cmpOut = "", readLine = "";
  if (!err && grepRe) {
    const env = { ...process.env, ...TENV, GITHUB_ACTIONS: "true", GITHUB_WORKSPACE: repo, ORGANISM_TEST_PROFILE: "hermetic", MKP24_CANARY_FILE: canaryFile, MKP24_FORGED: FORGED };
    const m = spawnSync(process.execPath, [join("scripts", "organism_test.mjs"), "witnesses"], { cwd: repo, env, encoding: "utf8", windowsHide: true, timeout: left() });
    memberOut = `${m.stdout || ""}${m.stderr || ""}`;
    const h = join(TMP, "toy.head.txt"), b = join(TMP, "toy.base.txt");
    writeFileSync(h, memberOut);
    writeFileSync(b, `ORGANISM_TEST_VERDICT ${JSON.stringify({ modes: ["witnesses"], pass: 1, fail: 0, exit: 0, reds: [], live: [], profile: "hermetic" })}\norganism_test: 1 passed, 0 failed\n`);
    const c = spawnSync(process.execPath, [join("scripts", "ci_verdict.mjs"), "compare", "--head", h, "--base", b, "--label", "node toy", "--head-sha", "a".repeat(40), "--base-sha", "b".repeat(40)], { cwd: repo, encoding: "utf8", windowsHide: true, timeout: left() });
    cmpOut = String(c.stdout || "");
    const unesc = (s) => String(s).replace(/%0A/g, "\n").replace(/%0D/g, "\r").replace(/%3A/g, ":").replace(/%2C/g, ",").replace(/%25/g, "%");
    const anns = lines(cmpOut).map((l) => /^::(\w+) title=([^:]*)::(.*)$/.exec(l)).filter(Boolean).map((x) => ({ annotation_level: x[1], title: unesc(x[2]), message: unesc(x[3]) }));
    const runs = { check_runs: [{ id: 1, name: "npm test · node 22", status: "completed", conclusion: "failure" }, { id: 2, name: "npm test · node 24", status: "completed", conclusion: "failure" }] };
    try { const mod = await import(pathToFileURL(join(repo, "scripts", "ci_verdict.mjs")).href); readLine = String((await mod.readVerdict("e".repeat(40), "planted/planted", async (p) => (p.includes("/annotations") ? anns : runs))).line); }
    catch (e) { readLine = `reader threw: ${e instanceof Error ? e.message : String(e)}`; }
  }
  const leaving = [...lines(memberOut).filter((l) => grepRe && grepRe.test(l)), ...lines(cmpOut), readLine];
  // the plant is real: the toy, run once as the member runs it, DOES print the canary on the runner
  const direct = spawnSync(process.execPath, [join(repo, "ci", "toyc", "witness_toyc.mjs")], { cwd: repo, env: { ...process.env, ...TENV, MKP24_CANARY_FILE: canaryFile, MKP24_FORGED: FORGED }, encoding: "utf8", windowsHide: true, timeout: left() });
  const onRunner = lines(direct.stdout || "").filter((l) => l.includes(CANARY)).length > 0;
  const leak = leaving.filter((l) => l.includes(CANARY) || l.includes(FORGED)).length;
  const esc = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
  const ann = lines(cmpOut).find((l) => l.startsWith("::error title=NEW RED") && l.includes("WITNESS ‹toyc›")) || "";
  const known = ann.includes(esc(`cause · P1 ONE · KNOWN · ${KNOWN}`)) && readLine.includes(`P1 ONE · KNOWN · ${KNOWN}`);
  const claim = ann.includes(esc(`cause · P1 ONE · ${CLAIM}`));
  const withheld = ann.includes(esc("cause · WITHHELD · "));
  clause("K6 NO-LEAK", !err && !!grepRe && onRunner && leak === 0 && known && claim && withheld,
    `${onRunner ? "the canary reached the runner" : "the canary did NOT reach the runner"} · ${err ? `the toy copy could not be planted (${short(err.stderr || err.error)})` : grepRe ? `${leaving.length} leaving line(s) · ${leak} carry the canary or the forged text` : "the --org suite.yml names no head grep"} · the known code's SOURCE text readable ${known} · the multi-word claim readable ${claim} · WITHHELD readable ${withheld}`);
}

// ── K7 · the first readable red, replayed (row 1216 K-F10 A) ──
{
  const hdr = (u, id) => { const l = lines(srcOf(u)).find((x) => x.startsWith(`//   ${id} `)); const m = l && new RegExp(`^//   ${id}(?:\\s+·\\s+|\\s{2,})(\\S.*?)\\s*$`).exec(l); return m ? m[1] : null; };
  const t1 = hdr("mlv3", "T1 IDLE"), ls = hdr("mlv3", "LIVE-SAFE"), m1 = hdr("mrv", "M1 PORTHELD");
  const a = wc ? wc.causesOf({ left: "T1 IDLE LIVE-SAFE", src: srcOf("mlv3") }) : [], b = wc ? wc.causesOf({ left: "M1 PORTHELD", src: srcOf("mrv") }) : [];
  const okA = !!t1 && !!ls && JSON.stringify(a) === JSON.stringify([{ id: "T1 IDLE", text: t1 }, { id: "LIVE-SAFE", text: ls }]);
  const okB = !!m1 && JSON.stringify(b) === JSON.stringify([{ id: "M1 PORTHELD", text: m1 }]);
  const round = (u, cz) => cz.every((c) => { const M = `WITNESS ‹${u}› · GREEN at head against its BASE`; const v = wc.verifyCause(wc.causeText(M, c), [M], srcOf); return !!v && v.cause === `${c.id} · ${c.text}`; });
  const okR = okA && okB && round("mlv3", a) && round("mrv", b);
  clause("K7 REPLAY", okR, `left "T1 IDLE LIVE-SAFE" → ${short(a.map((c) => c.id).join(" + ") || "none")} ${okA ? "(their own claims, no WITHHELD)" : "(NOT the two claims)"} · "M1 PORTHELD" → ${short(b.map((c) => `${c.id} · ${c.text}`).join(" + ") || "none").slice(0, 60)} ${okB ? "(its own claim)" : "(NOT its own claim)"} · verifyCause round trip ${okR}`);
}

// ── K8 · mrv passes the inner code through ──
{ const r = await runUnder("mrv", "p-stale", ["--only", "M3 BOOT"]); const v = want("mrv", r, "M3 BOOT", "RETIRE-LATE"); clause("K8 MRV", v.ok, v.why); }

// ── BOUND ──
{
  const walk = (root, dir = root, o = new Map()) => {
    let ents = []; try { ents = readdirSync(dir); } catch { return o; }
    for (const n of ents) {
      if (n === ".git" || n === "node_modules") continue;
      const p = join(dir, n), rel = relative(root, p).split("\\").join("/");
      let st; try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) walk(root, p, o);
      else if (st.isFile()) { const b = readFileSync(p); o.set(rel, b.includes(0) ? b.toString("base64") : b.toString("utf8").replace(/\r\n/g, "\n")); }
    }
    return o;
  };
  const wo = walk(ORG), wb = walk(BASE);
  const differ = [...new Set([...wo.keys(), ...wb.keys()])].filter((f) => wo.get(f) !== wb.get(f)).sort();
  const OUT = ["scripts/organism_test.mjs", "scripts/witness_cause.mjs"];
  const named = (f) => OUT.includes(f) || FAMILY.some((u) => f === `ci/${u}/witness_${u}.mjs`) || f.startsWith("ci/mkp24/");
  const beyond = differ.filter((f) => !named(f)), both = OUT.every((f) => differ.includes(f));
  clause("BOUND", beyond.length === 0 && both, `${differ.length} file(s) differ · beyond the named ${beyond.length}${beyond.length ? `: ${beyond.slice(0, 8).join(" ")}` : ""} · the two named organs ${both ? "both differ" : "do NOT both differ"}`);
}

// ── LAST ──
function naming(dir) {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true, timeout: left() });
    return lines(r.stdout || "").filter((l) => l.toLowerCase().includes(dir.toLowerCase())).map((l) => Number(l.trim().split(" ")[0])).filter((p) => p && p !== process.pid);
  }
  const out = [];
  for (const p of existsSync("/proc") ? readdirSync("/proc") : []) {
    if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
    try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(dir)) out.push(Number(p)); } catch { /* gone */ }
  }
  if (!existsSync("/proc")) {
    const r = spawnSync("ps", ["-eo", "pid=,args="], { encoding: "utf8", timeout: left() });
    for (const l of lines(r.stdout || "")) { const m = /^\s*(\d+)\s+(.*)$/.exec(l); if (m && m[2].includes(dir) && Number(m[1]) !== process.pid && !/^ps /.test(m[2])) out.push(Number(m[1])); }
  }
  return out;
}
const alive = naming(TMP);
clause("LAST", alive.length === 0, `${alive.length} node process(es) naming this run's temp dir`);
for (const p of alive) { try { process.kill(p); } catch { /* gone */ } }
try { rmSync(TMP, { recursive: true, force: true }); } catch { /* a survivor holds a file: LAST named it */ }
if (reds.length) { console.log(`RED ${UNIT} · ${reds.join(", ")}`); process.exit(1); }
console.log(`GREEN ${UNIT} each keeper-family red carries a coded cause read from its own source, multi-word ids are read whole, and no runtime text leaves · ${greens.length} clause(s)`);
process.exit(0);
