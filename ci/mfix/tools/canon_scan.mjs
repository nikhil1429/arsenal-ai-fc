// unit mfix — replay of the suite's LOAD ZERO BLOCK 7 canon-count scan (organism_test.mjs, the block under that
// heading) over the COMMIT BLOBS of <sha> (git show <sha>:<path>), never the working tree (forks row 1169).
//   node ci/mfix/tools/canon_scan.mjs <sha>     → exit 0 iff no undeclared line
import { execFileSync } from "node:child_process";
const sha = process.argv[2] || "HEAD";
const git = (...a) => execFileSync("git", a, { encoding: "utf8", maxBuffer: 1 << 30 });
const files = git("ls-tree", "-r", "--name-only", sha).split("\n").filter((f) => f.endsWith(".md") && !f.startsWith("docs/archive/"));
const LIVE = /\b\d[\d,]*\s*(?:\/\s*\d+\s*)?(organs?|suite members?|selftests?|enabled jobs?|brain jobs?|open cards?|daemons?|lanes? (?:asleep|awake)|capsules? locked)\b/i;
const SUITE = /\b\d+\s+(passed|failed)\b/i;
const undeclared = [], declared = [];
for (const f of files) {
  const L = git("show", `${sha}:${f}`).split(/\r?\n/); let fence = false;
  L.forEach((l, i) => {
    if (/^\s*```/.test(l)) { fence = !fence; return; } if (fence) return;
    if (!(LIVE.test(l) || SUITE.test(l))) return;
    if (/<!--\s*canon-ok:\s*([^>]*?)\s*-->/.test(l)) { declared.push(`${f}:${i + 1}`); return; }
    if (/\b20\d\d\b/.test(L.slice(Math.max(0, i - 2), i + 1).join(" "))) return;
    undeclared.push(`${f}:${i + 1}`);
  });
}
console.log(`canon scan ${sha.slice(0, 7)}: ${files.length} md blobs · undeclared ${undeclared.length}${undeclared.length ? " · " + undeclared.join(", ") : ""} · declared ${declared.length}`);
process.exit(undeclared.length ? 1 : 0);
