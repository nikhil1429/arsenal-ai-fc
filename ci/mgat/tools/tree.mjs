// unit mgat · an LF tree of <sha> under os.tmpdir(), dressing-room/state EXCLUDED, node_modules linked.
// Same recipe as ci/mlaw/tools/tree.mjs at da6d5e8 (read, not re-derived); the prefix names this unit.
import { execFileSync } from "node:child_process";
import { mkdtempSync, symlinkSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path"; import { tmpdir } from "node:os"; import { fileURLToPath } from "node:url";
export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export function tree(sha, { git = true } = {}) {
  const d = mkdtempSync(join(tmpdir(), `mgat-${sha.slice(0, 7)}-`));
  const tar = execFileSync("git", ["-C", REPO, "-c", "core.autocrlf=false", "archive", "--format=tar", sha], { maxBuffer: 1 << 30 });
  execFileSync("tar", ["-x", "-C", d, "--exclude=dressing-room/state", "--exclude=dressing-room/state/*"], { input: tar, maxBuffer: 1 << 30 });
  if (!existsSync(join(d, "node_modules"))) symlinkSync(join(REPO, "node_modules"), join(d, "node_modules"));
  if (git) {
    const g = (...a) => execFileSync("git", ["-C", d, "-c", "core.autocrlf=false", "-c", "user.email=seat@local", "-c", "user.name=seat", ...a], { stdio: "pipe" });
    g("init", "-q"); g("add", "-A"); g("commit", "-qm", "tree " + sha, "--no-verify");
  }
  return d;
}
