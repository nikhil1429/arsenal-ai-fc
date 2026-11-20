// unit mgat · runs ONE other unit's witness exactly as the suite's WITNESSES member does (scripts/organism_test.mjs:2855 lfTree,
// :2895-2935): LF trees of <org-sha> and <base-sha> under os.tmpdir() (git --work-tree checkout, core.autocrlf=false, core.eol=lf),
// node_modules linked, a refusing claude/gemini first on PATH, ci/<unit> copied from THIS checkout (the member's ROOT) into a scratch cwd. Writes nothing outside os.tmpdir().
// usage: node ci/mgat/tools/mf2run.mjs <unit> <org-sha> <base-sha>
import { spawnSync } from "node:child_process"; import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, cpSync, rmSync, existsSync } from "node:fs";
import { join, delimiter } from "node:path"; import { tmpdir } from "node:os"; import { REPO } from "./tree.mjs";
const [unit, orgSha, baseSha] = process.argv.slice(2);
const tmp = mkdtempSync(join(tmpdir(), `mgat-${unit}-`));
const lf = (sha, into) => { mkdirSync(into, { recursive: true }); const r = spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "-C", REPO, `--work-tree=${into}`, "checkout", "-q", sha, "--", "."], { encoding: "utf8", env: { ...process.env, GIT_INDEX_FILE: `${into}.index` } }); if (r.status !== 0) throw new Error(r.stderr); };
try {
  const orgT = join(tmp, "org"), baseT = join(tmp, "base"), shim = join(tmp, "shim"), wd = join(tmp, "w");
  lf(orgSha, orgT); lf(baseSha, baseT);
  for (const t of [orgT, baseT]) symlinkSync(join(REPO, "node_modules"), join(t, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  mkdirSync(shim); for (const tool of ["claude", "gemini"]) writeFileSync(join(shim, tool), "#!/bin/sh\necho REFUSED >&2\nexit 1\n", { mode: 0o755 });
  const env = { ...process.env, PATH: `${shim}${delimiter}${process.env.PATH || ""}` }; delete env.ORGANISM_TEST_PROFILE;
  // the witness bytes come from THIS checkout, as the member copies them from ROOT (organism_test.mjs: dir = join(ROOT, "ci", unit))
  const witnessDir = join(REPO, "ci", unit); if (!existsSync(witnessDir)) throw new Error(`no ci/${unit} in this checkout`);
  cpSync(witnessDir, join(wd, "ci", unit), { recursive: true });
  const r = spawnSync(process.execPath, [join("ci", unit, `witness_${unit}.mjs`), "--org", orgT, "--base-org", baseT], { cwd: wd, env, encoding: "utf8", maxBuffer: 1 << 30 });
  process.stdout.write((r.stdout || "") + (r.stderr || ""));
  console.log(`mgat ${unit}run org ${orgSha} base ${baseSha}: witness exit ${r.status}`);
} finally { rmSync(tmp, { recursive: true, force: true }); }
