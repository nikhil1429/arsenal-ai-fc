#!/usr/bin/env node
// ci/mtail/gates.mjs — runs the P2 / P4 / P5 gates of unit mtail on ONE tree and keeps each full output.
// USAGE: node ci/mtail/gates.mjs --org <dir> --side <base|build> [--only a,b]
// Each gate's full output goes to ci/mtail/out/<side>_<gate>.txt; its LAST LINE is read back from that file.
// No gate is skipped: one that cannot run prints its error as its output and is named in PROOF.md.
import { spawnSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out");
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const org = arg("--org"), side = arg("--side");
if (!org || !side) { console.error("usage: gates.mjs --org <dir> --side <base|build> [--only a,b]"); process.exit(2); }
const only = arg("--only") ? arg("--only").split(",") : null;
const GATES = [
  ["postmatch_selftest", ["scripts/postmatch.mjs", "selftest"]],
  ["sitting_selftest", ["scripts/sitting.mjs", "selftest"]],
  ["gaffer_brain_selftest", ["scripts/gaffer_brain.mjs", "selftest"]],
  ["brain_selftest", ["scripts/brain.mjs", "selftest"]],
  ["claudegen_selftest", ["scripts/claudegen.mjs"]],
  ["daily_green_selftest", ["scripts/daily_green.mjs", "selftest"]],
  ["organism_test_laws", ["scripts/organism_test.mjs", "laws"], /^organism_test: /],   // its summary line, then its RED detail lines
  ["models_check", ["scripts/models.mjs", "check"]],
  ["lawpack", ["scripts/lawpack.mjs"]],
  ["gates_types", ["scripts/gates.mjs", "types"]],
  ["gates_lint", ["scripts/gates.mjs", "lint"]],
];
mkdirSync(OUT, { recursive: true });
// THIS REPO IS PUBLIC: a committed output carries no person's name and no state file's content. The organism names files and
// fixtures after the person, so each word of the repo's own commit author name is masked in what is kept (read from git, never
// typed here, never HEAD's author alone); stderr (the daemons' logs, which can quote a live ledger) is kept OUTSIDE the repo, under os.tmpdir().
const ERR = join(tmpdir(), "mtail-gates-stderr"); mkdirSync(ERR, { recursive: true });
// every word (≥ 3 letters) of every human commit author in the repo's recent history — a session's own "Claude" commits excluded,
// so the mask never depends on which commit happens to be HEAD
const who = (() => { try { return [...new Set(String(spawnSync("git", ["-C", join(HERE, "..", ".."), "log", "-500", "--format=%an"], { encoding: "utf8" }).stdout || "").split(/\r?\n/).filter((a) => a.trim() && !/claude/i.test(a)).flatMap((a) => a.trim().split(/\s+/)).filter((w) => w.length >= 3))]; } catch { return []; } })();
const mask = (t) => who.reduce((acc, w) => acc.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "[name]"), String(t));
const env = { ...process.env };
delete env.ANTHROPIC_API_KEY;
for (const [name, argv, summary] of GATES) {
  if (only && !only.includes(name)) continue;
  const r = spawnSync(process.execPath, argv, { cwd: org, encoding: "utf8", env, timeout: 1800000, maxBuffer: 256 * 1024 * 1024 });
  // stdout and stderr are kept apart: an organ's verdict line is its last STDOUT line (a daemon's log rides stderr)
  const text = `${r.stdout || ""}${r.error ? `\n[gates.mjs] spawn error: ${r.error.message}` : ""}\n[gates.mjs] exit ${r.status === null ? `none (${r.signal})` : r.status}\n`;
  const file = join(OUT, `${side}_${name}.txt`);
  writeFileSync(file, mask(text));
  writeFileSync(join(ERR, `${side}_${name}.stderr.txt`), r.stderr || "");
  const lines = readFileSync(file, "utf8").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const body = lines.filter((l) => !l.startsWith("[gates.mjs]"));
  const last = (summary ? body.filter((l) => summary.test(l)).at(-1) : null) || body.at(-1) || "";
  console.log(`${side} · ${name} · exit ${r.status} · ${last}`);
}
