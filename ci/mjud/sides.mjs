#!/usr/bin/env node
// ci/mjud/sides.mjs — P2 / P4 / P5 runner. NEVER runs in the live tree: it lays the named ref's tracked files out
// under os.tmpdir() (git archive, LF as committed), links node_modules (a junction on Windows), and runs each gate
// there, so no selftest can touch the repository's dressing-room/state. Full output → ci/mjud/out/<side>_<name>.txt;
// the last line is read back from that file.
//   node ci/mjud/sides.mjs <side-name> <git-ref | --worktree> [gate ...]
//   --worktree = the CURRENT working files of the named scripts over HEAD's tree (a build not yet committed).
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, symlinkSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(REPO, "ci", "mjud", "out");
const NAMED = ["scripts/sitting.mjs", "scripts/dugout.mjs", "scripts/gaffer_brain.mjs", "scripts/brain.mjs"];
const GATES = {
  gaffer_brain: ["scripts/gaffer_brain.mjs", "selftest"],
  sitting: ["scripts/sitting.mjs", "selftest"],
  dugout: ["scripts/dugout.mjs", "selftest"],
  brain: ["scripts/brain.mjs", "selftest"],
  daily_green: ["scripts/daily_green.mjs", "selftest"],
  laws: ["scripts/organism_test.mjs", "laws"],
  models: ["scripts/models.mjs", "check"],
  lawpack: ["scripts/lawpack.mjs"],
  types: ["scripts/gates.mjs", "types"],
  lint: ["scripts/gates.mjs", "lint"],
};

export function layOut(ref, { worktree = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "mjud-side-"));
  const tar = execFileSync("git", ["-C", REPO, "archive", "--format=tar", worktree ? "HEAD" : ref], { maxBuffer: 1 << 30 });
  execFileSync("tar", ["-x", "-C", dir], { input: tar, maxBuffer: 1 << 30 });
  if (worktree) for (const f of NAMED) copyFileSync(join(REPO, f), join(dir, f));
  // laws / lawpack read `git ls-files`: the tree is its own one-commit repository (identity local to it, never global)
  const git = (...a) => execFileSync("git", ["-C", dir, "-c", "user.name=mjud-side", "-c", "user.email=mjud-side@invalid", "-c", "core.autocrlf=false", ...a], { stdio: "ignore" });
  git("init", "-q"); git("add", "-A"); git("commit", "-q", "--no-verify", "-m", `side ${worktree ? "worktree" : ref}`);
  if (existsSync(join(REPO, "node_modules"))) symlinkSync(join(REPO, "node_modules"), join(dir, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  return dir;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [side, ref, ...want] = process.argv.slice(2);
  const dir = layOut(ref, { worktree: ref === "--worktree" });
  mkdirSync(OUT, { recursive: true });
  // A FAKE claude FIRST ON PATH: no gate here may reach the live model. It logs every spawn and refuses.
  const bin = join(dir, ".fakebin"); mkdirSync(bin);
  const log = join(dir, ".fakebin", "spawns.log");
  writeFileSync(join(bin, "fake_claude.mjs"), `import { appendFileSync } from "node:fs";\nappendFileSync(${JSON.stringify(log)}, JSON.stringify(process.argv.slice(2).slice(0, 4)) + "\\n");\nprocess.stdout.write(JSON.stringify({ is_error: true, result: "fake claude (ci/mjud/sides.mjs): no live model call" }));\nprocess.exit(1);\n`);
  writeFileSync(join(bin, "claude"), `#!/bin/sh\nexec "${process.execPath}" "${join(bin, "fake_claude.mjs")}" "$@"\n`, { mode: 0o755 });
  writeFileSync(join(bin, "claude.cmd"), `@"${process.execPath}" "${join(bin, "fake_claude.mjs")}" %*\r\n`);
  for (const g of (want.length ? want : Object.keys(GATES))) {
    const env = { ...process.env, PATH: `${bin}${process.platform === "win32" ? ";" : ":"}${process.env.PATH}` }; delete env.ANTHROPIC_API_KEY;
    const r = spawnSync(process.execPath, GATES[g], { cwd: dir, encoding: "utf8", timeout: 1800000, maxBuffer: 1 << 28, env });
    const file = join(OUT, `${side}_${g}.txt`);
    // PUBLIC REPO: a person's name never lands in a stored output, even as part of a module's filename
    const scrub = (t) => String(t).replace(new RegExp(["n", "i", "k", "h", "i", "l"].join(""), "gi"), "<name>");
    writeFileSync(file, scrub(`${r.stdout || ""}${r.stderr || ""}\nexit ${r.status === null ? `killed ${r.signal}` : r.status}\n`));
    const lines = readFileSync(file, "utf8").split(/\r?\n/).filter((l) => l.trim());
    console.log(`${side} ${g}: ${lines.at(-2) || ""} · ${lines.at(-1)}`);
  }
  const spawns = existsSync(log) ? readFileSync(log, "utf8").split("\n").filter(Boolean).length : 0;
  console.log(`tree ${dir} · fake claude spawns logged: ${spawns}`);
}
