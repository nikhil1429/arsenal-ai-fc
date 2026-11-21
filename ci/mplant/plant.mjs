// unit mlaw2 · THE PLANTED TREE (forks rows 1137 (4) / 1205 (1)) — a census tool, not an organ.
//   node ci/mlaw2/plant.mjs <sha> [--with-tracked-state]      → prints the planted tree's path (one line)
//   import { plant, plantEnv, memberCmd, memberBound, liveTables } from "./plant.mjs"
// It builds ONE tree of <sha> under os.tmpdir(): an LF `git archive` (core.autocrlf=false), the state dir EXCLUDED and then
// re-made EMPTY (ci/mlaw2/plant_inputs.json: state_plant EMPTY, fixtures []), node_modules symlinked from this checkout,
// then `git init` + one commit inside (lawpack's NUL scan lists the tree with `git ls-files`). `--with-tracked-state` is the
// CONTRAST tree only (the sha's tracked state, what a fresh clone's full profile reads): its bytes are his, so a caller
// records exit codes and counts off it and never a line of its output.
// plantEnv() gives a spawn its doors: every home door under a fresh temp dir, a refusing claude + gemini shim first on
// PATH, the removed names removed, ORGANISM_TEST_PROFILE=hermetic set, and every ARSENAL_*PORT env door the tree's own
// scripts read handed a port the OS picked (listen 0, read, close). No port, wait, size or model id is typed here.
// It writes ONLY under os.tmpdir(). It never reads, prints or copies a file of the checkout's state dir.
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, mkdirSync, symlinkSync, writeFileSync, readFileSync, readdirSync, chmodSync, existsSync } from "node:fs";
import { join, dirname } from "node:path"; import { tmpdir } from "node:os"; import { fileURLToPath } from "node:url";
import net from "node:net";

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO = join(HERE, "..", "..");
export const INPUTS = JSON.parse(readFileSync(join(HERE, "plant_inputs.json"), "utf8"));
const SD = INPUTS.state_dir;

/** @param {string} sha @param {{ trackedState?: boolean, tag?: string, copyModules?: boolean }} [o] @returns {string} the tree's path */
export function plant(sha, o = {}) {
  const d = mkdtempSync(join(tmpdir(), `mlaw2-${o.tag || (o.trackedState ? "T" : "Z")}-`));
  const tar = execFileSync("git", ["-C", REPO, "-c", "core.autocrlf=false", "archive", "--format=tar", sha], { maxBuffer: 1 << 30 });
  execFileSync("tar", ["-x", "-C", d, ...(o.trackedState ? [] : [`--exclude=${SD}`])], { input: tar, maxBuffer: 1 << 30 });
  mkdirSync(join(d, SD), { recursive: true });
  for (const f of INPUTS.fixtures) throw new Error(`plant_inputs.json names a fixture (${f}): the mlaw2 census plants none`);
  // node_modules is LINKED (a junction on Windows) by default; copyModules makes it a real copy, for a member that itself
  // copies the tree with cpSync (sandbox, blackbox): cpSync refuses a linked directory ("Recursive option not enabled").
  if (o.copyModules) cpSync(join(REPO, "node_modules"), join(d, "node_modules"), { recursive: true, dereference: true });
  else if (!existsSync(join(d, "node_modules"))) symlinkSync(join(REPO, "node_modules"), join(d, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  const g = (...a) => execFileSync("git", ["-C", d, "-c", "core.autocrlf=false", "-c", "user.email=seat@local", "-c", "user.name=seat", ...a], { stdio: "pipe" });
  g("init", "-q"); g("add", "-A"); g("commit", "-qm", `planted ${sha}`, "--no-verify");
  return d;
}

/** the state dir of a planted tree holds zero files? @param {string} d */
export const plantIsEmpty = (d) => readdirSync(join(d, SD)).length === 0;

const shimDir = (() => { let s = null; return () => {
  if (s) return s; s = mkdtempSync(join(tmpdir(), "mlaw2-shim-"));
  for (const b of INPUTS.model_shims) {
    writeFileSync(join(s, b), "#!/bin/sh\necho 'REFUSED: no live model call (planted shim)' >&2\nexit 97\n"); chmodSync(join(s, b), 0o755);
    writeFileSync(join(s, `${b}.cmd`), "@echo REFUSED: no live model call (planted shim) 1>&2\r\n@exit /b 97\r\n");
  }
  return s; }; })();

/** an OS-picked port: listen 0, read, close — never a typed number */
export const freePort = () => new Promise((res, rej) => { const s = net.createServer(); s.on("error", rej); s.listen(0, "127.0.0.1", () => { const a = s.address(); const p = typeof a === "object" && a ? a.port : 0; s.close(() => res(p)); }); });

/** the ARSENAL_*PORT env doors the TREE's own scripts read @param {string} d */
export const portDoors = (d) => {
  const re = new RegExp(INPUTS.port_door_pattern, "g");
  return [...new Set(readdirSync(join(d, "scripts")).filter((f) => f.endsWith(".mjs")).flatMap((f) => [...readFileSync(join(d, "scripts", f), "utf8").matchAll(re)].map((m) => m[1])))].sort();
};

/** the env one member spawn takes @param {string} d @param {Record<string,string>} [extra] */
export async function plantEnv(d, extra = {}) {
  const home = mkdtempSync(join(tmpdir(), "mlaw2-home-"));
  /** @type {Record<string, string|undefined>} */ const env = { ...process.env };
  for (const k of INPUTS.env_removed) delete env[k];
  for (const k of INPUTS.home_doors) env[k] = home;
  env.APPDATA = join(home, "AppData", "Roaming"); env.LOCALAPPDATA = join(home, "AppData", "Local");
  mkdirSync(env.APPDATA, { recursive: true }); mkdirSync(env.LOCALAPPDATA, { recursive: true });
  env.PATH = `${shimDir()}${process.platform === "win32" ? ";" : ":"}${process.env.PATH}`;
  Object.assign(env, INPUTS.env_set);
  const ports = {};
  for (const k of portDoors(d)) { env[k] = String(await freePort()); ports[k] = "os-picked"; }
  return { env: { ...env, ...extra }, home, ports };
}

/** THE SCRUB — the one line a census keeps of a PLANT run's output: a stack's error line rather than the runtime banner, the
 *  plant's temp path masked, and any line that is a JSON value WITHHELD (an organ can print a record its code carries, and a
 *  record can carry a person's name: never into a census file). @param {string} out @param {string} d */
export function lastLine(out, d) {
  const L = out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let last = L.pop() || "";
  if (/^Node\.js v\d/.test(last)) last = L.find((l) => /^[A-Za-z]*Error\b|^Error:/.test(l)) || last;
  last = last.split(d).join("<plant>").replace(/\/tmp\/[\w.-]+/g, "<tmp>");
  if (/^[{[]/.test(last)) last = "<a JSON line, withheld by the scrub>";
  return last.slice(0, 200);
}

/** the organism_test.mjs source lines of a tree @param {string} d */
const src = (d) => readFileSync(join(d, "scripts", "organism_test.mjs"), "utf8").split("\n");
/** the member bound as organism_test.mjs resolves it (MEMBER_BOUND_MS = HEAVY_BOUND_MS when the door is unset) @param {string} d */
export const memberBound = (d) => { const m = src(d).join("\n").match(/const HEAVY_BOUND_MS = (\d+);/); if (!m) throw new Error("HEAVY_BOUND_MS not found in organism_test.mjs"); return Number(m[1]); };
/** the suite's own command for a member (suites(): bare for test_coach_v2, else `selftest`) @param {string} organ */
export const memberCmd = (organ) => organ === "test_coach_v2" ? [`scripts/${organ}.mjs`] : [`scripts/${organ}.mjs`, "selftest"];
/** the three LIVE tables, read off the tree's own source, with file:line @param {string} d */
export function liveTables(d) {
  const s = src(d);
  const block = (name) => {
    const a = s.findIndex((l) => l.startsWith(`const ${name} = Object.freeze({`)); if (a < 0) return [];
    const b = s.findIndex((l, i) => i > a && l.startsWith("});"));
    return s.slice(a + 1, b).map((l, i) => ({ line: a + 2 + i, key: (l.match(/^\s+"([^"]+)":/) || l.match(/^\s+([\w-]+):/) || [])[1], why: (l.match(/:\s*"(.*)",\s*$/) || [])[1] }))
      .filter((x) => x.key && !/^\s*\/\//.test(s[x.line - 1]));
  };
  return { selftests: block("LIVE_SELFTESTS"), asserts: block("LIVE_ASSERTS"), modes: block("LIVE_MODES") };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const sha = process.argv[2]; if (!sha) { console.error("usage: node ci/mlaw2/plant.mjs <sha> [--with-tracked-state]"); process.exit(2); }
  const d = plant(sha, { trackedState: process.argv.includes("--with-tracked-state") });
  console.log(d);
  console.error(`mlaw2 plant ${sha}: state dir ${plantIsEmpty(d) ? "EMPTY" : "tracked (contrast tree)"} · doors ${portDoors(d).join(",")} · member bound read off organism_test.mjs`);
}
