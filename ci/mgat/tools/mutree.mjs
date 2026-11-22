// unit mgat · commit ONE mutant tree to a throwaway ref-less commit in this repo's object store (no branch, no ref moved):
// a clone of the BUILD <sha> under os.tmpdir() with ONE mutant's patch lines applied to it (each must match once), committed
// there, and fetched back by sha so mf2run.mjs can check it out (the tree keeps the build's ci/mf2). usage: node ci/mgat/tools/mutree.mjs <build-sha> <Mk>
import { execFileSync } from "node:child_process"; import { mkdtempSync, rmSync } from "node:fs"; import { join } from "node:path"; import { tmpdir } from "node:os";
import { REPO } from "./tree.mjs"; import { MUTANTS } from "./build.mjs"; import { readFileSync, writeFileSync } from "node:fs";
const [base, m] = process.argv.slice(2); const d = mkdtempSync(join(tmpdir(), `mgat-mt-${m}-`));
const g = (...a) => execFileSync("git", ["-C", d, "-c", "core.autocrlf=false", "-c", "user.email=seat@local", "-c", "user.name=seat", ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
try {
  execFileSync("git", ["clone", "-q", "-c", "core.autocrlf=false", "--no-checkout", REPO, d], { stdio: "pipe" }); g("checkout", "-q", base);
  for (const [from, to] of MUTANTS[m].patch || []) { const f = "scripts/organism_test.mjs"; const p = join(d, f); const t = readFileSync(p, "utf8");
    if (t.split(from).length - 1 !== 1) throw new Error(`mutant ${m} patch matched ${t.split(from).length - 1} times`); writeFileSync(p, t.replace(from, () => to)); }
  g("commit", "-qam", `mutant ${m}`, "--no-verify"); const sha = g("rev-parse", "HEAD").trim();
  execFileSync("git", ["-C", REPO, "fetch", "-q", d, sha], { stdio: "pipe" }); console.log(sha);
} finally { rmSync(d, { recursive: true, force: true }); }
