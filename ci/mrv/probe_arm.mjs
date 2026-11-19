#!/usr/bin/env node
// ci/mrv/probe_arm.mjs — UNIT mrv · A MEASUREMENT INSTRUMENT, NOT A WITNESS. Times the sitting keeper's three moments on a
// planted LF tree under os.tmpdir(): SPAWN → the worker's "THE SITTING BRAIN live" line (its port answers, what the mlv1
// witness's BOOT measures) → its "watching N file(s)" line (retireWhenIdle ARMED, scripts/sitting.mjs:1411-1413). The
// gap between the last two is the ARM: a closure write inside it is seen only by the arm-time check(). Ports: OS-picked,
// through the env doors (ARSENAL_SITTING_PORT, ARSENAL_JUDGE_PORT); ANTHROPIC_API_KEY planted so every model lane refuses.
//   node ci/mrv/probe_arm.mjs --root <repo> --head <sha> --n <reps> [--out <jsonl>]
// LAST LINE: MRV ARM · node <v> · <n> rep(s) · slack med <ms> · boot med <ms> max <ms> · arm med <ms> max <ms> · arm > boot+slack in <k>/<n>
import { mkdtempSync, mkdirSync, rmSync, appendFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ROOT = resolve(arg("--root") || "."), HEAD = arg("--head") || "HEAD", N = Number(arg("--n") || 1), OUT = arg("--out");
const freePort = () => new Promise((res) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });
const tmp = mkdtempSync(join(tmpdir(), "mrv-arm-")), org = join(tmp, "org");
mkdirSync(org, { recursive: true });
spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "-C", ROOT, `--work-tree=${org}`, "checkout", "-q", HEAD, "--", "scripts", "setup", "package.json", ["dressing-room", "state"].join("/")], { env: { ...process.env, GIT_INDEX_FILE: `${org}.index` } });
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const rows = [];
try {
  for (let k = 0; k < N; k++) {
    const sd = join(tmp, `s${k}`); mkdirSync(sd);
    const env = { ...process.env, ARSENAL_SITTING_PORT: String(await freePort()), ARSENAL_JUDGE_PORT: String(await freePort()), ARSENAL_SITTING_STATE_DIR: sd, ANTHROPIC_API_KEY: "planted-refusal-not-a-key" };
    const t0 = performance.now(); spawnSync(process.execPath, ["-e", "0"]); const slack = Math.max(1, Math.round(performance.now() - t0));
    const s = performance.now();
    const c = spawn(process.execPath, [join(org, "scripts", "sitting.mjs"), "daemon"], { cwd: org, env, stdio: ["ignore", "pipe", "pipe"] });
    const at = {};
    await new Promise((res) => {
      const on = (d) => { for (const l of String(d).split(/\r?\n/)) { if (!at.live && /THE SITTING BRAIN live/.test(l)) at.live = performance.now() - s; if (!at.watch && /watching \d+ file/.test(l)) { at.watch = performance.now() - s; at.files = Number(/watching (\d+)/.exec(l)[1]); res(); } } };
      c.stdout.on("data", on); c.stderr.on("data", on); c.once("exit", res);
    });
    c.kill("SIGTERM"); await new Promise((r) => (c.exitCode != null || c.signalCode != null ? r() : c.once("exit", r)));
    spawnSync("pkill", ["-f", sd]);
    const row = { node: process.version, rep: k + 1, slack, boot: Math.round(at.live), arm: Math.round(at.watch - at.live), files: at.files };
    rows.push(row); if (OUT) appendFileSync(OUT, JSON.stringify(row) + "\n");
  }
} finally { spawnSync("pkill", ["-f", tmp]); rmSync(tmp, { recursive: true, force: true }); }
const over = rows.filter((r) => r.arm > r.boot + r.slack).length;
console.log(`MRV ARM · node ${process.version} · ${rows.length} rep(s) · files ${rows[0] && rows[0].files} · slack med ${med(rows.map((r) => r.slack))} ms · boot med ${med(rows.map((r) => r.boot))} max ${Math.max(...rows.map((r) => r.boot))} ms · arm med ${med(rows.map((r) => r.arm))} max ${Math.max(...rows.map((r) => r.arm))} ms · arm > boot+slack in ${over}/${rows.length}`);
