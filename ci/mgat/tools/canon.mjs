// unit mgat · the LOAD ZERO BLOCK 7 canon-count scan (organism_test.mjs:1898-1915, its regexes and exemptions copied) over ONE file.
import { readFileSync } from "node:fs";
const f = process.argv[2]; const L = readFileSync(f, "utf8").split(/\r?\n/);
const LIVE = /\b\d[\d,]*\s*(?:\/\s*\d+\s*)?(organs?|suite members?|selftests?|enabled jobs?|brain jobs?|open cards?|daemons?|lanes? (?:asleep|awake)|capsules? locked)\b/i;
const SUITE = /\b\d+\s+(passed|failed)\b/i; const bad = []; let fence = false;
L.forEach((l, i) => { if (/^\s*```/.test(l)) { fence = !fence; return; } if (fence) return; if (!(LIVE.test(l) || SUITE.test(l))) return;
  if (/<!--\s*canon-ok:/.test(l)) return; if (/\b20\d\d\b/.test(L.slice(Math.max(0, i - 2), i + 1).join(" "))) return; bad.push(`${f}:${i + 1}`); });
for (const b of bad) console.log("UNDATED " + b);
console.log(`mgat canon ${f}: ${bad.length} undated live-count line(s)`);
process.exitCode = bad.length ? 1 : 0;   // a finding is a non-zero exit, so a pre-push `&&` chain stops on it (PROOF §11 (1))
