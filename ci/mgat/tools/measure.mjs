// unit mgat build seat · THE PROOF'S MEASUREMENTS on one LF tree of <sha> under os.tmpdir() (state PLANTED by this script):
//   1. `gates.mjs report` on E (state folder present, empty): exit + the no-empty count + the frozen LINT_BASELINE read FROM THE FILE
//   2. `lawpack.mjs gate` on E: its count line(s) (every frozen count, as printed)
//   3. each touched organ's selftest by headline line, on T (the commit's tracked state; cortex reads registry.json), hermetic env
//   4. the touched member: hermetic `organism_test.mjs gates` asserts on E (its GATES / LIVE line)
//   5. `models.mjs check` exit
// No port bound, nothing live named, no model called; every child is spawnSync (bounded: it returns). usage: node ci/mgat/tools/measure.mjs <sha> [--apply] [only,...]
import { REPO } from "./tree.mjs"; import { applyBuild } from "./build.mjs"; import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, symlinkSync, rmSync, readFileSync } from "node:fs"; import { join } from "node:path"; import { tmpdir } from "node:os";
const [s0, ...rest] = process.argv.slice(2); const apply = rest.includes("--apply"); const only = (rest.find((x) => !x.startsWith("--")) || "gates,lawpack,selftests,member,models").split(",");
const sha = execFileSync("git", ["-C", REPO, "rev-parse", "--short=7", s0], { encoding: "utf8" }).trim(); const tag = `${sha}${apply ? "+apply" : ""}`;
const SD = ["dressing-room", "state"];
function plant(kind) {
  const d = mkdtempSync(join(tmpdir(), `mgat-m-${kind}-`));
  const tar = execFileSync("git", ["-C", REPO, "-c", "core.autocrlf=false", "archive", "--format=tar", sha], { maxBuffer: 1 << 30 });
  execFileSync("tar", ["-x", "-C", d, ...(kind === "T" ? [] : ["--exclude=" + SD.join("/"), "--exclude=" + SD.join("/") + "/*"])], { input: tar, maxBuffer: 1 << 30 });
  if (kind === "E") mkdirSync(join(d, ...SD), { recursive: true });
  symlinkSync(join(REPO, "node_modules"), join(d, "node_modules")); if (apply) applyBuild(d);
  const g = (...a) => execFileSync("git", ["-C", d, "-c", "core.autocrlf=false", "-c", "user.email=seat@local", "-c", "user.name=seat", ...a], { stdio: "pipe" });
  g("init", "-q"); g("add", "-A"); g("commit", "-qm", "plant", "--no-verify"); return d;
}
const envOf = (profile) => { const e = { ...process.env }; delete e.ORGANISM_TEST_PROFILE; if (profile) e.ORGANISM_TEST_PROFILE = profile; return e; };
const node = (d, args, profile) => { const r = spawnSync(process.execPath, args, { cwd: d, encoding: "utf8", env: envOf(profile), maxBuffer: 1 << 28 }); return { code: r.status, out: (r.stdout || "") + (r.stderr || "") }; };
const once = (k, fn) => { const d = plant(k); try { return fn(d); } finally { rmSync(d, { recursive: true, force: true }); } };
if (only.includes("gates")) once("E", (d) => { const r = node(d, ["scripts/gates.mjs", "report"]);
  for (const l of r.out.split("\n").filter((l) => /no-empty|ROSE|FELL|RED|GREEN|verdict/i.test(l))) console.log("  " + l.trim().slice(0, 200));
  const ne = (r.out.match(/no-empty (\d+)/) || [])[1]; const fz = (readFileSync(join(d, "scripts/gates.mjs"), "utf8").match(/"no-empty": (\d+)/) || [])[1];
  console.log(`MEASURE gates ${tag}: gates.mjs report (E) exit ${r.code} · no-empty ${ne} · frozen LINT_BASELINE no-empty ${fz} (read from scripts/gates.mjs) · ${Number(ne) <= Number(fz) ? "AT OR UNDER" : "ABOVE"}`); });
if (only.includes("lawpack")) once("E", (d) => { const r = node(d, ["scripts/lawpack.mjs", "gate"]);
  for (const l of r.out.split("\n").filter((l) => /\d/.test(l) && /count|frozen|baseline|ROSE|FELL|rule|law|=|→|->/i.test(l)).slice(0, 40)) console.log("  " + l.trim().slice(0, 220));
  console.log(`MEASURE lawpack ${tag}: lawpack.mjs gate (E) exit ${r.code} · ${(r.out.trim().split("\n").pop() || "").trim().slice(0, 220)}`); });
if (only.includes("selftests")) for (const o of ["groundsman", "cortex", "captains_call", "rung_receipt"]) once("T", (d) => { const r = node(d, [`scripts/${o}.mjs`, "selftest"], "hermetic");
  const head = (r.out.trim().split("\n").filter((l) => /selftest|passed|failed|ALL CHECKS|FAIL/i.test(l)).pop() || "").trim().slice(0, 180);
  console.log(`MEASURE selftest ${o} ${tag}: exit ${r.code} · ${head}`); });
if (only.includes("member")) once("E", (d) => { const r = node(d, ["scripts/organism_test.mjs", "gates"], "hermetic");
  const a = r.out.split("\n").filter((l) => /^  (ok  |FAIL|LIVE) /.test(l) && /gates|GATES/.test(l)).map((l) => l.trim().slice(0, 160));
  for (const l of a) console.log("  " + l); console.log(`MEASURE member gates ${tag}: hermetic organism_test.mjs gates exit ${r.code} · ${a.join(" | ").slice(0, 300)}`); });
if (only.includes("models")) once("E", (d) => { const r = node(d, ["scripts/models.mjs", "check"]); console.log(`MEASURE models ${tag}: models.mjs check exit ${r.code} · ${(r.out.trim().split("\n").pop() || "").slice(0, 160)}`); });
