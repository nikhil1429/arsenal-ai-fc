// unit mlaw2 · THE VACUITY PROBE (forks row 1205 (1) (a): "VACUOUS on the planted tree … name how you measured that").
// For each organ named, run the suite's command in a fresh Z (planted, EMPTY) and a fresh T (tracked state). Each output
// line is FOLDED (the tree path masked, digit runs → #). Recorded, as COUNTS only (a T line can quote his bytes):
//   onlyZ / onlyT  = folded lines printed on one side only
//   unmeasured     = lines on each side that say a check did NOT judge (NOT MEASURED · skip · not measurable · unreadable)
//   zeroSubject    = lines on Z that report judging an EMPTY set ("0 file(s)", "(0 … checked)", "0/0")
// A member is VACUOUS when Z reports MORE unjudged checks than T, or a zero-subject line T does not, or it SWALLOWED an
// error on Z that T does not print; the Z-only lines are
// printed (the plant holds none of his bytes, so a Z line is code's own text), scrubbed.
//   node ci/mlaw2/tools/vacuity.mjs <sha> <organ> …
import { spawnSync } from "node:child_process";
import { plant, plantEnv, memberCmd, memberBound, lastLine } from "../plant.mjs";
const [sha, ...organs] = process.argv.slice(2);
const UNJ = /NOT MEASURED|not measurable|\bskip(ped)?\b|unreadable|cannot be measured/i;
const ZERO = /\bmeasured 0\b|\b0 file\(s\)|\(0 [^)]*checked\)|\b0\/0\b|\b0 (declaration|row|member|entr|file|law)s?\b/i;
const runIn = async (d, organ) => { const { env } = await plantEnv(d);
  const r = spawnSync(process.execPath, memberCmd(organ), { cwd: d, env, encoding: "utf8", timeout: memberBound(d) });
  const out = (r.stdout || "") + (r.stderr || "");
  return { code: r.status, lines: out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => l.split(d).join("<tree>").replace(/\/tmp\/[\w.-]+/g, "<tmp>").replace(/\d+/g, "#")), rawZero: out.split(/\r?\n/).filter((l) => ZERO.test(l)).length, d }; };
for (const organ of organs) {
  const z = await runIn(plant(sha), organ), t = await runIn(plant(sha, { trackedState: true }), organ);
  const zs = new Set(z.lines), ts = new Set(t.lines);
  const onlyZ = [...zs].filter((l) => !ts.has(l)), onlyT = [...ts].filter((l) => !zs.has(l));
  const row = { organ, Z: { code: z.code, unmeasured: z.lines.filter((l) => UNJ.test(l)).length, zeroSubject: z.rawZero }, T: { code: t.code, unmeasured: t.lines.filter((l) => UNJ.test(l)).length, zeroSubject: t.rawZero },
    onlyZ: onlyZ.length, onlyT: onlyT.length, onlyZ_lines: onlyZ.slice(0, 6).map((l) => lastLine(l, z.d)) };
  // SWALLOWED: a green member whose output on Z carries an error line T does not print — a child it spawns (or a call it
  // makes) could not answer on the empty plant, and the member passed over the degraded subject
  row.swallowed = z.code === 0 && onlyZ.some((l) => /^[A-Za-z]*Error: |did not answer/.test(l));
  row.vacuous = row.Z.unmeasured > row.T.unmeasured || row.Z.zeroSubject > row.T.zeroSubject || row.swallowed;
  console.log(JSON.stringify(row));
}
