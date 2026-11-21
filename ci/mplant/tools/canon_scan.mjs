// unit mlaw2 · THE CANON-COUNT REPLAY (row 1169) — LOAD ZERO BLOCK 7's rule (scripts/organism_test.mjs:1921-1938 at 6a6bdff,
// copied, not imported: the suite spawns organs and is never imported) replayed over the COMMIT's blobs: `git ls-tree` of
// <sha> for every tracked *.md outside docs/archive/, each read by `git show <sha>:<path>`, never the working tree.
//   node ci/mlaw2/tools/canon_scan.mjs <sha>      → exit 0 iff no undeclared line
import { execFileSync } from "node:child_process";
import { REPO } from "../plant.mjs";
const sha = process.argv[2] || "HEAD";
const files = execFileSync("git", ["-C", REPO, "ls-tree", "-r", "--name-only", sha], { encoding: "utf8", maxBuffer: 1 << 28 }).split("\n").filter((f) => f.endsWith(".md") && !f.startsWith("docs/archive/"));
const LIVE = /\b\d[\d,]*\s*(?:\/\s*\d+\s*)?(organs?|suite members?|selftests?|enabled jobs?|brain jobs?|open cards?|daemons?|lanes? (?:asleep|awake)|capsules? locked)\b/i;
const SUITE = /\b\d+\s+(passed|failed)\b/i;
const undeclared = [], declared = [];
for (const f of files) {
  const L = execFileSync("git", ["-C", REPO, "show", `${sha}:${f}`], { encoding: "utf8", maxBuffer: 1 << 28 }).split(/\r?\n/);
  let fence = false;
  L.forEach((l, i) => {
    if (/^\s*```/.test(l)) { fence = !fence; return; }
    if (fence || !(LIVE.test(l) || SUITE.test(l))) return;
    const prag = /<!--\s*canon-ok:\s*([^>]*?)\s*-->/.exec(l); if (prag) { declared.push(`${f}:${i + 1}`); return; }
    if (/\b20\d\d\b/.test(L.slice(Math.max(0, i - 2), i + 1).join(" "))) return;
    undeclared.push(`${f}:${i + 1}`);
  });
}
console.log(`canon scan ${sha}: ${files.length} md blobs · undeclared ${undeclared.length}${undeclared.length ? " · " + undeclared.join(", ") : ""} · declared ${declared.length}`);
process.exit(undeclared.length ? 1 : 0);
