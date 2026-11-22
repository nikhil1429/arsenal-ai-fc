#!/usr/bin/env node
// ============================================================================
// ci/mxb/witness_mxb.mjs — UNIT mxb · the six blindnesses Q6 named (B1-B6), one IR family in scripts/xray.mjs
//   forks row 1161 (1)-(5): F-SET A (five rules + the guard) · F-CTX0 A (`probe` leaves the fixture words) · F-AGREE A ·
//   F-RETL A · F-CTX A · F-E1 A · F-SELFTEST (the three NUL asserts re-stated) · spec ci/mxb/MXB_SPEC.md @ 4d329ff
// ----------------------------------------------------------------------------
// USAGE: node ci/mxb/witness_mxb.mjs --org <dir> --base-org <dir>
//   --org       the tree to witness (its scripts/xray.mjs is judged; the build reads GREEN, the base reads RED on W1-W7, W11)
//   --base-org  the BASE tree (ci/mxb/BASE; `node ci/mxb/plant_mxb.mjs base --repo <dir> --sha <BASE>` plants one)
// CONTRACT — every plant lives under ONE os.tmpdir() root (mkdtemp; the env door MXB_WITNESS_TMP moves its parent, for the
//   mutant runner) and the root is removed at the end. --org and --base-org are READ, never written: each is COPIED by
//   ci/mxb/plant_mxb.mjs (no .git, no ci/, an EMPTY dressing-room/state — nothing of his is copied, read or printed;
//   node_modules rides as one link, a junction on Windows). The IR is built from CODE ONLY.
//   xray's build() + queries() and its selftest run in SYNCHRONOUS child nodes (spawnSync: each wait is bounded by the
//   child's own exit; no timeout, budget or size is typed). THE PORT CLASS (row 1053): no port is bound, no service
//   named, no daemon touched or restarted, nothing POSTed, no git repo planted, no model called (ANTHROPIC_API_KEY is
//   blanked in every child). CRLF-PROOF: every tree is judged TWICE — the LF leg and the CRLF leg (every
//   scripts/**/*.mjs of the plant rewritten to CRLF, the base's too) — and a clause is GREEN only when BOTH legs are;
//   every line read from a process is split on \r?\n; BOUND folds CRLF to LF; the process table is read through
//   PowerShell on Windows, `ps` elsewhere (no POSIX-only shell).
// CLAUSES (each line prints the LF leg, then the CRLF leg):
//   W1-W6 B1-B6     the declared sole writer is the IR's ONE writer of its state file (models.json · sitting.json ·
//                   brain_outcomes.jsonl · manager_notes.json · rails_blind.jsonl · teaching_gate.jsonl)
//   W7    Q6        Q6 is exactly usage_reading.json<usage_tap.mjs (D1, kept outside the repo by F11 A)
//   W8 BOUND  GUARD     (row 1311 (1): a base-vs-head whole-tree count, judged at adoption, dropped by the member) no writer invented: Q2 rows = the base's, Q5 = 0, every ADDED writer edge lands on an unshared file
//   W9 BOUND  GUARD     (row 1311 (1), same shape) no organ's unresolved sites rise, base → org
//   W10   GUARD     P10, a planted idiom: a selftest's `facts({ stateDir: bare })` never makes the test dir a live read
//   W11   SELFTEST  xray's own selftest: the three NUL asserts (calibration · dmn · rejirah) read ok — main holds the
//                   `\u0000` escape and no raw NUL byte (forks row 616; lawpack raw-nul-in-source)
//   BOUND           only scripts/xray.mjs differs from --base-org (ci/** and dressing-room/state are not compared)
//   LAST            no node process naming the temp root survives
// A GUARD reads GREEN on the base by design (the base IS its reference); its RED is shown by its mutant
// (ci/mxb/run_mutants_mxb.mjs).
// LAST LINE: GREEN MXB <what> · <n> clause(s) (exit 0) or RED MXB · <clauses> (exit 1)
// ============================================================================
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, statSync, symlinkSync } from "node:fs";
import { join, resolve, relative, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { plant, slash, isState, nodeModulesOf, toCrlf } from "./plant_mxb.mjs";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null, BASE_ORG = arg("--base-org") ? resolve(arg("--base-org")) : null;
if (!ORG || !existsSync(join(ORG, "scripts", "xray.mjs")) || !BASE_ORG || !existsSync(join(BASE_ORG, "scripts", "xray.mjs"))) {
  console.log("RED MXB · USAGE (--org <dir> and --base-org <dir>, each with scripts/xray.mjs)"); process.exit(1);
}
const NAMED = ["scripts/xray.mjs"];
const SELF_REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const NM = nodeModulesOf(ORG, BASE_ORG, SELF_REPO);
const ROOT = mkdtempSync(join(process.env.MXB_WITNESS_TMP || tmpdir(), "mxb-wit-"));
const lines = (s) => String(s || "").split(/\r?\n/).filter((l) => l.trim());
const CHILD_ENV = { ...process.env, ANTHROPIC_API_KEY: "" };
const results = [];
const clause = (id, legs, why) => {
  const ok = legs.every(Boolean);
  results.push({ id, ok });
  console.log(`  ${ok ? "GREEN" : "RED  "} ${id} · ${why}`);
};
const legTxt = (eol, ok, s) => `${eol} ${ok ? "ok" : "RED"}: ${s}`;

// the IR facts of one tree, by a synchronous child (code only; paths and organ names out, never a file's content)
const FACTS = `
const { pathToFileURL } = await import("node:url"); const { join } = await import("node:path");
const x = await import(pathToFileURL(join(process.argv[1], "scripts", "xray.mjs")).href);
const ir = x.build(), q = x.queries(ir);
const p10 = ir.organs["p10.mjs"];
console.log(JSON.stringify({
  files: ir.files.map((f) => [f.path, f.writers]),
  q2: q.Q2.map((f) => f.path + "<" + f.writers.join("+")).sort(),
  q5: q.Q5.length,
  q6: q.Q6.map((r) => r.file + "<" + r.declared_by),
  organs: Object.fromEntries(Object.entries(ir.organs).map(([o, v]) => [o, v.unresolved])),
  total: ir.unresolved_sinks,
  allow: x.MULTI_WRITER_ALLOWLIST,
  p10: p10 ? p10.reads.map((r) => ({ path: r.path, fixture: r.fixture })) : null,
}));`;
const facts = (tree) => {
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", FACTS, tree], { encoding: "utf8", env: CHILD_ENV, cwd: tree });
  if (r.status !== 0) throw new Error(`facts child exit ${r.status} on ${basename(tree)}: ${lines(r.stderr).slice(-3).join(" | ")}`);
  return JSON.parse(lines(r.stdout).pop());
};
const selftestLines = (tree) => lines(spawnSync(process.execPath, [join(tree, "scripts", "xray.mjs"), "selftest"], { encoding: "utf8", env: CHILD_ENV, cwd: tree }).stdout);

// P10 — a selftest builds an object value pointing at a TEST dir and hands it to a production reader. The reader
// records its sink under its OWN ctx, so without the fixture-site guard the test dir lands as a live lane.
const P10_SRC = [
  'import { readFileSync } from "node:fs";',
  'import { join, dirname } from "node:path";',
  'import { fileURLToPath } from "node:url";',
  'const HERE = dirname(fileURLToPath(import.meta.url));',
  'const STATE_DIR = join(HERE, "..", "dressing-room", "state");',
  'export function facts({ stateDir = STATE_DIR } = {}) { return readFileSync(join(stateDir, "p10_live.json"), "utf8"); }',
  'function selftest() { const bare = join(HERE, "p10_testdir"); return facts({ stateDir: bare }); }',
  'if (process.argv[2] === "selftest") selftest();',
  "",
].join("\n");
function plantP10(name, eol) {
  const P = join(ROOT, name);
  mkdirSync(join(P, "scripts"), { recursive: true }); mkdirSync(join(P, "dressing-room", "state"), { recursive: true });
  if (NM) symlinkSync(NM, join(P, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  writeFileSync(join(P, "package.json"), JSON.stringify({ name: "mxb-p10", private: true, scripts: {} }) + "\n");   // rootSets reads it unguarded
  copyFileSync(join(ORG, "scripts", "xray.mjs"), join(P, "scripts", "xray.mjs"));
  writeFileSync(join(P, "scripts", "p10.mjs"), P10_SRC);
  if (eol === "crlf") toCrlf(join(P, "scripts"));
  return P;
}

const STATE = "dressing-room/state/";
const B = [
  ["W1", "B1", "models.json", "models.mjs"],
  ["W2", "B2", "sitting.json", "sitting.mjs"],
  ["W3", "B3", "brain_outcomes.jsonl", "scoreboard.mjs"],
  ["W4", "B4", "manager_notes.json", "manager.mjs"],
  ["W5", "B5", "rails_blind.jsonl", "rails.mjs"],
  ["W6", "B6", "teaching_gate.jsonl", "teaching_gate.mjs"],
];
const NUL_FILES = ["calibration.mjs", "dmn.mjs", "rejirah.mjs"];

let threw = false;
try {
  const legs = ["lf", "crlf"].map((eol) => {
    const org = plant(ORG, join(ROOT, `org_${eol}`), { eol, nm: NM }), base = plant(BASE_ORG, join(ROOT, `base_${eol}`), { eol, nm: NM });
    const crlfSeen = readFileSync(join(org, "scripts", "xray.mjs"), "utf8").includes("\r\n");
    if ((eol === "crlf") !== crlfSeen) throw new Error(`the ${eol} leg's plant does not carry ${eol} (CRLF seen: ${crlfSeen})`);
    return { eol, O: facts(org), Bf: facts(base), P: facts(plantP10(`p10_${eol}`, eol)), st: selftestLines(org) };
  });
  const per = (fn) => legs.map((L) => ({ eol: L.eol, ...fn(L) }));
  const say = (rs) => rs.map((r) => legTxt(r.eol, r.ok, r.s)).join(" ‖ ");

  for (const [id, b, file, organ] of B) {
    const rs = per(({ O }) => {
      const f = O.files.find(([p]) => p === STATE + file);
      const w = f ? f[1] : [];
      return { ok: w.length === 1 && w[0] === organ, s: `${b} ${file} writers=[${w}]` };
    });
    clause(id, rs.map((r) => r.ok), `${say(rs)} (want [${organ}])`);
  }
  {
    const rs = per(({ O }) => ({ ok: O.q6.length === 1 && O.q6[0] === "usage_reading.json<usage_tap.mjs", s: `Q6=[${O.q6.join(", ")}]` }));
    clause("W7", rs.map((r) => r.ok), `${say(rs)} (want [usage_reading.json<usage_tap.mjs])`);
  }
  {
    const rs = per(({ O, Bf }) => {
      const wB = new Map(Bf.files.map(([p, w]) => [p, new Set(w)]));
      const added = O.files.flatMap(([p, w]) => w.filter((o) => !(wB.get(p) || new Set()).has(o)).map((o) => ({ p, o, all: w })));
      const shared = added.filter((e) => e.all.length > 1 && !O.allow.includes(e.p));
      const same = O.q2.join(" | ") === Bf.q2.join(" | ");
      return { ok: same && O.q5 === 0 && shared.length === 0,
        s: `Q2 ${same ? "= base" : `[${O.q2.join(" | ")}] vs base [${Bf.q2.join(" | ")}]`} · Q5 ${O.q5} · added writer edges ${added.length}, onto a shared file ${shared.length}${shared.length ? " " + shared.map((e) => `${e.p}<${e.o}`).join(",") : ""}` };
    });
    clause("W8 BOUND", rs.map((r) => r.ok), say(rs));
  }
  {
    const rs = per(({ O, Bf }) => {
      const up = Object.keys(O.organs).filter((o) => o in Bf.organs && O.organs[o] > Bf.organs[o]).map((o) => `${o}:${Bf.organs[o]}->${O.organs[o]}`);
      return { ok: up.length === 0, s: `unresolved ${Bf.total} -> ${O.total}; organs that rose [${up.join(" ")}]` };
    });
    clause("W9 BOUND", rs.map((r) => r.ok), say(rs));
  }
  {
    const rs = per(({ P }) => {
      const reads = P.p10 || [], live = reads.filter((r) => !r.fixture).map((r) => basename(r.path));
      return { ok: live.includes("p10_live.json") && !reads.some((r) => /p10_testdir/.test(r.path) && !r.fixture), s: `p10 live reads=[${live.join(", ")}]` };
    });
    clause("W10", rs.map((r) => r.ok), `${say(rs)} (want p10_live.json, and no p10_testdir path read as live)`);
  }
  {
    const rs = per(({ st }) => {
      const got = NUL_FILES.map((f) => {
        const l = st.find((x) => new RegExp(`^\\s*(ok|FAIL)\\s+${f.replace(".", "\\.")}\\b.*NUL`).test(x));
        return { f, ok: !!l && /^\s*ok\b/.test(l), seen: !!l };
      });
      return { ok: got.every((g) => g.ok), s: got.map((g) => `${g.f} ${g.seen ? (g.ok ? "ok" : "FAIL") : "absent"}`).join(", ") };
    });
    clause("W11", rs.map((r) => r.ok), `xray selftest NUL asserts: ${say(rs)}`);
  }

  // ── BOUND ─────────────────────────────────────────────────────────────────────
  {
    const walk = (dir, acc = new Map(), top = dir) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name), rel = slash(relative(top, p));
        if ([".git", "node_modules", "ci"].includes(rel.split("/")[0]) || isState(rel) || /\.log$/.test(rel)) continue;
        const st = statSync(p);
        if (st.isDirectory()) walk(p, acc, top); else acc.set(rel, createHash("sha256").update(readFileSync(p, "utf8").replace(/\r\n/g, "\n")).digest("hex"));
      }
      return acc;
    };
    const a = walk(ORG), b = walk(BASE_ORG);
    const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort(), extra = diff.filter((f) => !NAMED.includes(f));
    clause("BOUND", [extra.length === 0], `${diff.length} file(s) differ from --base-org${diff.length ? ` (${diff.slice(0, 6).join(", ")})` : ""}${extra.length ? ` · BEYOND THE NAMED: ${extra.slice(0, 6).join(", ")}` : ""}`);
  }
} catch (e) {
  threw = true;
  clause("WITNESS", [false], `threw: ${lines(String((e && e.stack) || e)).slice(0, 3).join(" | ")}`);
}

// ── LAST ──────────────────────────────────────────────────────────────────────
{
  const listing = process.platform === "win32"
    ? spawnSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true })
    : spawnSync("ps", ["-eo", "args"], { encoding: "utf8" });
  const left = lines(listing.stdout).filter((l) => l.includes(ROOT) && !/\bps -eo\b/.test(l));
  rmSync(ROOT, { recursive: true, force: true });
  clause("LAST", [left.length === 0 && listing.status === 0], `${left.length} node process(es) naming the temp root survive${listing.status === 0 ? "" : " · the process table could not be read"} · the temp root removed`);
}
const red = results.filter((r) => !r.ok).map((r) => r.id);
if (red.length || threw) { console.log(`RED MXB · ${red.join(" ") || "WITNESS"}`); process.exit(1); }
console.log(`GREEN MXB the six Q6 blindnesses resolved by the five rules + the guard, no writer invented, the NUL asserts state main, LF and CRLF · ${results.length} clause(s)`);
process.exit(0);
