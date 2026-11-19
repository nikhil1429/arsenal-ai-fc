#!/usr/bin/env node
// ============================================================================
// mint.mjs · ARSENAL AI FC — THE ONE ID MINT (unit mid, forks row 1159 (1), 19 Nov 2026)
//   PURE. Writes NOTHING, reads NOTHING, imports no organ. Every ledger keeps its ONE writer;
//   this module only hands that writer an id.
// ----------------------------------------------------------------------------
// THE BUG THIS EXISTS FOR (ci/mid/MID_SPEC.md on claude/mid-spec 8b2c556, Q1-Q3, measured):
//   six organs each kept their own inline mint `<prefix><ms base36><one of 1296 buckets>` (the
//   sitting agenda's had no random part at all). Two mints in one ms shared an id 1 time in 1296,
//   and every by-id reader then did one of four wrong things with the two rows (acted on the first,
//   dropped the second, overwrote the first, closed both). Unit mact put a PROCESS-LOCAL sequence
//   into two of them — measured, that closes ONE process and leaves TWO processes on one clock
//   minting the SAME id (each fresh process starts its sequence at 0).
// THE RULE (row 1159 (1), F-1 A + F-2 A): ONE shared mint, used by all six, carrying the PROCESS
//   IDENTITY beside the sequence: `<prefix><ms36 ×8><pid36 ×7><seq36><bucket36 ×2>`.
//   · ms36  fixed 8 (36^8 ms reaches year 5188; an older planted clock is zero-padded)
//   · pid36 fixed 7 (36^7 > 2^32 — the whole Windows PID range); unique among LIVE processes on one
//     machine, so pid + seq is unique on one machine at one time (a guarantee, not a draw)
//   · seq36 the rest — process-local, never reset
//   · bucket fixed 2 — kept as the belt for a pid reused inside one ms
//   The widths are fixed so parseId() reads every part back whole. An id of the old shape (10 chars
//   after its prefix) can never equal a new one (≥ 18).
// WHAT IT DOES NOT CLOSE (NAMED in the spec, Q3): two MACHINES writing one ledger.
// ----------------------------------------------------------------------------
// CLI: node scripts/mint.mjs selftest | node scripts/mint.mjs <prefix>   (prints one id)
// ============================================================================
import { pathToFileURL } from "node:url";

export const MS_WIDTH = 8;
export const PID_WIDTH = 7;
export const BUCKET_WIDTH = 2;
const BUCKETS = 36 ** BUCKET_WIDTH;

let seq = 0;   // process-local; with the pid beside it, one id per (machine, process, mint)

const msOf = (now) => {
  const d = now instanceof Date ? now : new Date(now);
  const t = d.getTime();
  return Number.isFinite(t) ? t : Date.now();
};

/** mintId(prefix, now, { pid, random }) → `<prefix><ms36 8><pid36 7><seq36><bucket36 2>` */
export function mintId(prefix, now = new Date(), { pid = process.pid, random = Math.random } = {}) {
  const ms = msOf(now).toString(36).padStart(MS_WIDTH, "0");
  const p = Math.abs(Math.trunc(Number(pid) || 0)).toString(36).padStart(PID_WIDTH, "0");
  const s = (seq++).toString(36);
  const b = Math.floor(random() * BUCKETS).toString(36).padStart(BUCKET_WIDTH, "0");
  return `${String(prefix)}${ms}${p}${s}${b}`;
}

/** parseId(prefix, id) → { ms, pid, seq, bucket } or null (an old-shape id, or another prefix) */
export function parseId(prefix, id) {
  const s = String(id == null ? "" : id);
  const pre = String(prefix);
  if (!s.startsWith(pre)) return null;
  const body = s.slice(pre.length);
  if (body.length < MS_WIDTH + PID_WIDTH + 1 + BUCKET_WIDTH || !/^[0-9a-z]+$/.test(body)) return null;
  const ms = parseInt(body.slice(0, MS_WIDTH), 36);
  const pid = parseInt(body.slice(MS_WIDTH, MS_WIDTH + PID_WIDTH), 36);
  const sq = parseInt(body.slice(MS_WIDTH + PID_WIDTH, body.length - BUCKET_WIDTH), 36);
  const bucket = parseInt(body.slice(body.length - BUCKET_WIDTH), 36);
  return { ms, pid, seq: sq, bucket };
}

function selftest() {
  console.log("=== mint.mjs selftest — one id per mint, the parts read back whole ===\n");
  let pass = 0, fail = 0;
  const assert = (name, ok, detail = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${ok || !detail ? "" : ` — ${detail}`}`); };
  const NOW = new Date("2026-11-19T06:00:00.000Z");
  const zero = () => 0;
  const many = Array.from({ length: 64 }, () => mintId("a", NOW, { random: zero }));
  assert("ONE PROCESS · 64 mints on one clock with the draw pinned are 64 distinct ids", new Set(many).size === 64, `${new Set(many).size} distinct`);
  const x = mintId("t", NOW, { pid: 7, random: zero }), y = mintId("t", NOW, { pid: 8, random: zero });
  assert("TWO PROCESSES · two pids on one clock, one draw, never share an id", x !== y);
  const r = parseId("t", x);
  assert("READ BACK · parseId returns the planted ms and pid", !!r && r.ms === NOW.getTime() && r.pid === 7 && r.bucket === 0, JSON.stringify(r));
  const s1 = parseId("t", mintId("t", NOW, { pid: 7, random: zero })).seq, s2 = parseId("t", mintId("t", NOW, { pid: 7, random: zero })).seq;
  assert("READ BACK · the sequence reads back whole and rises by one", s2 === s1 + 1, `${s1} → ${s2}`);
  const big = parseId("rul-", mintId("rul-", NOW, { pid: 2 ** 32 - 1, random: () => 0.9999 }));
  assert("WIDTHS · the largest 32-bit pid and the last bucket read back whole", !!big && big.pid === 2 ** 32 - 1 && big.bucket === BUCKETS - 1, JSON.stringify(big));
  const old = new Date("1971-01-01T00:00:00.000Z");
  assert("WIDTHS · an old planted clock is zero-padded and reads back", parseId("ag", mintId("ag", old, { pid: 1, random: zero })).ms === old.getTime());
  assert("OLD SHAPE · a 10-char legacy id is not parsed as a new one", parseId("o", "omwn551c000") === null);
  assert("CHARSET · an id is its prefix plus [0-9a-z] only", /^ag[0-9a-z]+$/.test(mintId("ag", NOW)) && /^rul-[0-9a-z]+$/.test(mintId("rul-", NOW)));
  console.log(`\n${fail ? "✗" : "✓"} mint.mjs selftest — ${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2] || "";
  if (mode === "selftest") selftest();
  else if (mode) console.log(mintId(mode));
  else { console.log("mint: node scripts/mint.mjs selftest | <prefix>"); process.exitCode = 1; }
}
