// unit mgat · Q3: is the `gates` mode's verdict a function of the state folder? `gates.mjs report` and
// `organism_test.mjs gates` (FULL profile, the mode entered) on three plants of <sha>:
// argv: <sha> [verb, default report]
//   Z = state folder ABSENT · E = state folder present and EMPTY · T = the commit's TRACKED state present.
// Prints ONLY the gate's summary lines (no state byte, no ajv error body), each output's sha256, and the exits.
import { REPO } from "./tree.mjs"; import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, symlinkSync, rmSync } from "node:fs"; import { join } from "node:path"; import { tmpdir } from "node:os"; import { createHash } from "node:crypto";
const sha = process.argv[2] || "HEAD"; const short = execFileSync("git", ["-C", REPO, "rev-parse", "--short=7", sha], { encoding: "utf8" }).trim();
const plant = (kind) => {
  const d = mkdtempSync(join(tmpdir(), `mgat-sv-${kind}-`));
  const tar = execFileSync("git", ["-C", REPO, "-c", "core.autocrlf=false", "archive", "--format=tar", short], { maxBuffer: 1 << 30 });
  const ex = kind === "T" ? [] : ["--exclude=dressing-room/state", "--exclude=dressing-room/state/*"];
  execFileSync("tar", ["-x", "-C", d, ...ex], { input: tar, maxBuffer: 1 << 30 });
  if (kind === "E") mkdirSync(join(d, "dressing-room", "state"), { recursive: true });
  symlinkSync(join(REPO, "node_modules"), join(d, "node_modules"));
  const g = (...a) => execFileSync("git", ["-C", d, "-c", "core.autocrlf=false", "-c", "user.email=seat@local", "-c", "user.name=seat", ...a], { stdio: "pipe" });
  g("init", "-q"); g("add", "-A"); g("commit", "-qm", "plant", "--no-verify");
  return d;
};
const keep = (out) => out.split("\n").filter((l) => /^gates (types|lint|schema)|^\s+RED  (LINT|TYPE|SCHEMA COUNT|SCHEMA — \S+ (does NOT|has a|'s schema))|^gates: |GATES —|^organism_test: /.test(l))
  .map((l) => l.replace(/(does NOT match schemas\/\S+).*/, "$1").trim().slice(0, 220));
const env = { ...process.env }; delete env.ORGANISM_TEST_PROFILE;
for (const kind of ["Z", "E", "T"]) {
  const d = plant(kind);
  const verb = process.argv[3] || "report"; const g = spawnSync(process.execPath, ["scripts/gates.mjs", verb], { cwd: d, encoding: "utf8", env });
  const o = spawnSync(process.execPath, ["scripts/organism_test.mjs", "gates"], { cwd: d, encoding: "utf8", env, maxBuffer: 1 << 28 });
  const h = (s) => createHash("sha256").update(s).digest("hex").slice(0, 12);
  console.log(`--- ${kind} @ ${short}: gates ${verb} exit ${g.status} · stdout sha256 ${h(g.stdout)} · organism_test gates (full) exit ${o.status}`);
  for (const l of keep(g.stdout)) console.log("  " + l);
  for (const l of keep(o.stdout).filter((x) => /^organism_test: /.test(x))) console.log("  " + l);
  rmSync(d, { recursive: true, force: true });
}
console.log(`mgat stateverdict ${short}: done`);
