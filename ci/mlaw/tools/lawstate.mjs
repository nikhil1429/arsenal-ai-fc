// is lawpack gate's verdict a function of dressing-room/state? run it on two trees of one sha: state EXCLUDED vs the
// sha's TRACKED state INCLUDED (copied by this node script under os.tmpdir(), never printed). Compare output hashes.
import { execFileSync, spawnSync } from "node:child_process"; import { mkdtempSync, symlinkSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path"; import { tmpdir } from "node:os"; import { createHash } from "node:crypto";
const REPO = "/home/user/arsenal-ai-fc", sha = process.argv[2];
const mk = (withState) => { const d = mkdtempSync(join(tmpdir(), "mlaw-st-")); const tar = execFileSync("git", ["-C", REPO, "-c", "core.autocrlf=false", "archive", "--format=tar", sha], { maxBuffer: 1 << 30 });
  execFileSync("tar", ["-x", "-C", d, ...(withState ? [] : ["--exclude=dressing-room/state"])], { input: tar, maxBuffer: 1 << 30 });
  symlinkSync(join(REPO, "node_modules"), join(d, "node_modules"));
  const g = (...a) => execFileSync("git", ["-C", d, "-c", "user.email=s@l", "-c", "user.name=s", ...a], { stdio: "pipe" }); g("init", "-q"); g("add", "-A"); g("commit", "-qm", "t", "--no-verify"); return d; };
const env = { ...process.env }; delete env.ANTHROPIC_API_KEY; delete env.GITHUB_ACTIONS;
for (const ws of [false, true]) { const d = mk(ws); let n = 0; try { n = readdirSync(join(d, "dressing-room/state")).length; } catch {}
  const r = spawnSync(process.execPath, ["scripts/lawpack.mjs", "gate"], { cwd: d, env, encoding: "utf8" });
  const out = r.stdout.split("\n").filter((l) => !/^\s*$/.test(l)).join("\n");
  console.log(JSON.stringify({ sha, state_entries: n, exit: r.status, out_sha256: createHash("sha256").update(out).digest("hex").slice(0, 16), last: out.split("\n").pop() }));
  rmSync(d, { recursive: true, force: true }); }
