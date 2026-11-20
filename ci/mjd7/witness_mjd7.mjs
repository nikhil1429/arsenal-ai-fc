#!/usr/bin/env node
// ============================================================================
// witness_mjd7.mjs — unit mjd7 (forks row 1063 (4)): THE CARD OWNER'S SWEEP READS THE GRADE QUEUE FROM A CURSOR.
// CONTRACT:  node ci/mjd7/witness_mjd7.mjs --org <tree> --base-org <tree>
//   The --org tree's scripts/ is COPIED under os.tmpdir() per world (dressing-room/state is never copied). The REAL card
//   owner (the copy's captains_call.mjs) runs in a child process on a planted deck dir under os.tmpdir()
//   (ARSENAL_CALL_STATE_DIR, that organ's declared seam); the judge's grade queue is planted IN that dir, where the owner
//   reads it. Cards are minted through the owner's own `file` verb, as the judge round mints them (judge:in-doubt:<id>).
//   Every read the owner makes of the queue is COUNTED by a preload (--import, planted under the temp dir) that wraps
//   node:fs readFileSync (a whole read) and readSync (a ranged read, bytes summed) for that one path, and writes the count
//   to a file named by an env door under the temp dir. No model, no port, no service, no outbox: every card carries its
//   --why-code-cannot-decide, so the decision gate keeps it a question and posts nothing.
//   C1 BOUND     · a sync after one settled row arrived reads NO whole queue, and its ranged reads are exactly the anchor
//                  line plus the new row; that row's card retires and the other two stay live; the cursor sits at the end.
//   F1 AHEAD     · the cursor is past the queue — (a) the queue truncated under a seated cursor, (b) a deck carrying a
//                  cursor that never belonged to this queue — ONE whole read, the settled card retires, the cursor
//                  re-seats at the queue's end on its last line.
//   F2 REWRITTEN · the bytes before the cursor are not its anchor line any more — (a) the queue rewritten in place with a
//                  settled row moved before the cursor, (b) the queue truncated and grown back past the cursor — ONE whole
//                  read, the settled card retires, the cursor re-seats.
//   F3 MISSING   · (a) no cursor on the deck (a settled row already in the queue), (b) a malformed cursor — ONE whole read,
//                  the settled card retires, the cursor seats.
//   BOUND        outside ci/, only scripts/captains_call.mjs differs between the trees.
//   LAST         no node process naming this run's temp dir survives.
// THE PORT CLASS (row 1053): no port is bound, no live service is named or posted at; every child is spawnSync with a bound
// derived from a node start measured in this run (never a typed number of ms).
// LAST LINE: GREEN MJD7 <what> · <n> clause(s) (exit 0) | RED MJD7 · <clauses> (exit 1)
// Portable: no POSIX-only shell; every file read is split on /\r?\n/; bytes are measured, never typed.
// ============================================================================
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync, rmSync, cpSync, mkdirSync, lstatSync, appendFileSync, truncateSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("RED MJD7 · USAGE (--org <dir> --base-org <dir>)"); process.exit(1); }
const TMP = mkdtempSync(join(tmpdir(), "mjd7-"));
const reds = [], greens = [];
const clause = (id, ok, line) => { (ok ? greens : reds).push(id); console.log(`${ok ? "GREEN" : "RED  "} ${id} · ${line}`); };

const t0 = process.hrtime.bigint();
spawnSync(process.execPath, ["-e", ""], { encoding: "utf8" });
const nodeStartMs = Math.max(1, Number(process.hrtime.bigint() - t0) / 1e6);
const BOUND_MS = Math.ceil(nodeStartMs * 1000);

// THE COUNTED READ — a preload that wraps node:fs for ONE path (the queue) and writes {whole, ranged} at exit.
const COUNTER = join(TMP, "count_reads.mjs");
writeFileSync(COUNTER, String.raw`
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { resolve } from "node:path";
const Q = resolve(process.env.MJD7_QUEUE), OUT = process.env.MJD7_COUNT_OUT;
const c = { whole: 0, whole_bytes: 0, ranged: 0, ranged_calls: 0 };
const fds = new Set();
const rf = fs.readFileSync, rs = fs.readSync, os_ = fs.openSync, cs = fs.closeSync, wf = fs.writeFileSync;
const isQ = (p) => { try { return typeof p === "string" && resolve(p) === Q; } catch { return false; } };
let inWhole = 0;   // readFileSync of a Buffer reads through fs.readSync inside node: those bytes are the whole read, not a ranged one
fs.readFileSync = function (p, ...a) { inWhole++; let r; try { r = rf.call(this, p, ...a); } finally { inWhole--; } if (isQ(p)) { c.whole++; c.whole_bytes += Buffer.byteLength(r); } return r; };
fs.openSync = function (p, ...a) { const fd = os_.call(this, p, ...a); if (isQ(p) && !inWhole) fds.add(fd); return fd; };
fs.readSync = function (fd, ...a) { const n = rs.call(this, fd, ...a); if (fds.has(fd) && !inWhole) { c.ranged += n; c.ranged_calls++; } return n; };
fs.closeSync = function (fd, ...a) { fds.delete(fd); return cs.call(this, fd, ...a); };
syncBuiltinESMExports();
process.on("exit", () => { try { wf(OUT, JSON.stringify(c)); } catch { } });
`);

const sha = (b) => createHash("sha256").update(b).digest("hex");
const L = (o) => JSON.stringify(o) + "\n";
const tag = Math.random().toString(36).slice(2, 8);
const capRow = (id, i) => ({ v: 2, kind: "capture", id, type: "trap", ref: `tokenization:${i}`, concept: "tokenization", axis: "a", label: `w7 ${tag} q${i}`, asked: `w7 ${tag} q${i}`, gut: "knew", spoken: "x", ts: new Date().toISOString() });
const settledRow = (of) => ({ v: 2, kind: "settled", of, ts: new Date().toISOString(), resolved_from: "in-doubt" });

function world(src) {
  const tree = mkdtempSync(join(TMP, "tree-"));
  cpSync(join(src, "scripts"), join(tree, "scripts"), { recursive: true, verbatimSymlinks: true });
  if (existsSync(join(src, "package.json"))) cpSync(join(src, "package.json"), join(tree, "package.json"));
  const deckDir = mkdtempSync(join(TMP, "deck-"));
  const qf = join(deckDir, "gaffer_grade_queue.jsonl"), deckPath = join(deckDir, "captains_call.json");
  const ids = [0, 1, 2].map((i) => `w7${tag}${Math.random().toString(36).slice(2, 6)}${i}`);
  writeFileSync(qf, ids.map((id, i) => L(capRow(id, i))).join(""));
  const countOut = join(TMP, `count-${Math.random().toString(36).slice(2, 8)}.json`);
  const env = { ...process.env, ARSENAL_CALL_STATE_DIR: deckDir, ARSENAL_OUTBOX_LEDGER: join(deckDir, "outbox.jsonl"), MJD7_QUEUE: qf, MJD7_COUNT_OUT: countOut };
  delete env.ARSENAL_ORGAN;
  const opt = { encoding: "utf8", env, timeout: BOUND_MS, windowsHide: true };
  const cli = (argv) => {
    try { rmSync(countOut, { force: true }); } catch { }
    const r = spawnSync(process.execPath, ["--import", pathToFileURL(COUNTER).href, join(tree, "scripts", "captains_call.mjs"), ...argv], opt);
    const count = existsSync(countOut) ? JSON.parse(readFileSync(countOut, "utf8")) : null;
    if (process.env.MJD7_DEBUG && r.status !== 0) console.log("DEBUG", argv[0], r.status, String(r.stderr).slice(0, 600));
    return { status: r.status, out: String(r.stdout || ""), err: String(r.stderr || "").split(/\r?\n/).filter(Boolean).slice(-1)[0] || "", count };
  };
  for (const id of ids) cli(["file", "--line", `w7 ${tag} in doubt ${id.slice(-4)}`, "--key", `judge:in-doubt:${id}`, "--why-code-cannot-decide", "a capture in doubt is named at his anchor (witness mjd7)"]);
  const deck = () => (existsSync(deckPath) ? JSON.parse(readFileSync(deckPath, "utf8")) : { cards: [] });
  const live = () => deck().cards.filter((c) => /^judge:in-doubt:/.test(c.key) && !c.answer && !c.retired_at).map((c) => c.key.split(":").pop()).sort();
  const cursor = () => deck().grade_cursor;
  const setCursor = (c) => { const d = deck(); if (c === undefined) delete d.grade_cursor; else d.grade_cursor = c; writeFileSync(deckPath, JSON.stringify(d, null, 2)); };
  const qbytes = () => readFileSync(qf);
  const lastLine = (b) => { const s = b.toString("utf8"); const ls = s.split(/(?<=\n)/).filter((x) => x.endsWith("\n")); return Buffer.from(ls[ls.length - 1] || "", "utf8"); };
  // the cursor re-seated: at the queue's end, anchored on its last line
  const seated = () => { const c = cursor(), b = qbytes(), ll = lastLine(b); return !!c && c.offset === b.length && c.anchor_len === ll.length && c.anchor === sha(ll); };
  return { ids, qf, cli, deck, live, cursor, setCursor, qbytes, seated };
}
const isLive = (w, id) => w.live().includes(id);
const fmt = (c) => (c ? `whole ${c.whole} ranged ${c.ranged}B` : "no count");

// ── C1 BOUND ──
{
  const w = world(ORG);
  const s1 = w.cli(["sync"]);
  const anchorLen = Buffer.byteLength(w.qbytes().toString("utf8").split(/(?<=\n)/).filter(Boolean).pop() || "", "utf8");   // the queue's last line before the new row
  const add = L(settledRow(w.ids[0]));
  appendFileSync(w.qf, add);
  const s2 = w.cli(["sync"]);
  const c = s2.count, want = anchorLen + Buffer.byteLength(add);
  clause("C1", s1.status === 0 && s2.status === 0 && !!c && c.whole === 0 && c.ranged === want && c.ranged < w.qbytes().length
    && !isLive(w, w.ids[0]) && isLive(w, w.ids[1]) && isLive(w, w.ids[2]) && w.seated(),
    `sync after one settled row: ${fmt(c)} (must be whole 0, ranged ${want}B = anchor ${anchorLen}B + new row ${Buffer.byteLength(add)}B, of a ${w.qbytes().length}B queue) · its card retired ${!isLive(w, w.ids[0])} · the other two live ${isLive(w, w.ids[1]) && isLive(w, w.ids[2])} · cursor at the end ${w.seated()}`);
}

// a fallback is: ONE whole read of the queue, the settled card retired, the cursor re-seated at the end
const fallback = (w, s, id, probe = 0) => s.status === 0 && !!s.count && s.count.whole === 1 && s.count.whole_bytes === w.qbytes().length && s.count.ranged <= probe && !isLive(w, id) && w.seated();
const fline = (w, s, id, probe = 0) => `${fmt(s.count)} (must be whole 1 of ${w.qbytes().length}B, ranged ≤ ${probe}B) · card retired ${!isLive(w, id)} · cursor re-seated ${w.seated()}`;

// ── F1 AHEAD ──
{
  const a = world(ORG); a.cli(["sync"]);
  const keep = a.qbytes().toString("utf8").split(/(?<=\n)/)[0];
  writeFileSync(a.qf, keep + L(settledRow(a.ids[1])));                       // truncated under the seated cursor
  const ahead = a.cursor() && a.cursor().offset > a.qbytes().length;
  const sa = a.cli(["sync"]);
  const b = world(ORG);
  appendFileSync(b.qf, L(settledRow(b.ids[1])));
  const foreign = Buffer.from(L({ foreign: tag }));
  b.setCursor({ offset: b.qbytes().length + foreign.length, anchor_len: foreign.length, anchor: sha(foreign) });   // never this queue's
  const sb = b.cli(["sync"]);
  clause("F1", ahead && fallback(a, sa, a.ids[1]) && fallback(b, sb, b.ids[1]),
    `(a) truncated under the cursor (ahead ${ahead}): ${fline(a, sa, a.ids[1])} · (b) a foreign cursor past the queue: ${fline(b, sb, b.ids[1])}`);
}

// ── F2 REWRITTEN ──
{
  const a = world(ORG); a.cli(["sync"]);
  const old = a.qbytes(), pa = a.cursor() ? a.cursor().anchor_len : 0;   // the anchor probe is the one ranged read a rewrite may cost
  writeFileSync(a.qf, Buffer.concat([Buffer.from(L(settledRow(a.ids[2]))), old]));   // rewritten in place: a settled row moved before the cursor
  const sa = a.cli(["sync"]);
  const b = world(ORG); b.cli(["sync"]);
  const off = b.cursor() ? b.cursor().offset : b.qbytes().length, pb = b.cursor() ? b.cursor().anchor_len : 0;
  truncateSync(b.qf, 0);
  let grown = L(settledRow(b.ids[2])), i = 0;
  while (Buffer.byteLength(grown) < off) grown += L(capRow(`pad${tag}${i}`, i++));   // truncated, then grown back past the cursor
  writeFileSync(b.qf, grown);
  const sb = b.cli(["sync"]);
  clause("F2", fallback(a, sa, a.ids[2], pa) && fallback(b, sb, b.ids[2], pb),
    `(a) rewritten in place, settled row before the cursor: ${fline(a, sa, a.ids[2], pa)} · (b) truncated and grown back past the cursor: ${fline(b, sb, b.ids[2], pb)}`);
}

// ── F3 MISSING ──
{
  const a = world(ORG);
  appendFileSync(a.qf, L(settledRow(a.ids[0])));                              // the deck has never been synced: no cursor
  const absent = a.cursor() === undefined;
  const sa = a.cli(["sync"]);
  const b = world(ORG); b.cli(["sync"]);
  appendFileSync(b.qf, L(settledRow(b.ids[0])));
  b.setCursor({ offset: "x", anchor_len: null });                             // malformed
  const sb = b.cli(["sync"]);
  clause("F3", absent && fallback(a, sa, a.ids[0]) && fallback(b, sb, b.ids[0]),
    `(a) no cursor (absent ${absent}): ${fline(a, sa, a.ids[0])} · (b) a malformed cursor: ${fline(b, sb, b.ids[0])}`);
}

const walk = (root, d = root, acc = new Map()) => {
  for (const e of readdirSync(d)) {
    if (e === ".git" || e === "node_modules") continue;
    const p = join(d, e);
    if (lstatSync(p).isSymbolicLink()) continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(root, p, acc); else acc.set(relative(root, p).split(sep).join("/"), sha(readFileSync(p)));
  }
  return acc;
};
const A = walk(BASE), B = walk(ORG);
const differ = [...new Set([...A.keys(), ...B.keys()])].filter((k) => !k.startsWith("ci/") && A.get(k) !== B.get(k)).sort();
clause("BOUND", differ.every((f) => f === "scripts/captains_call.mjs"), `differs: ${differ.join(", ") || "nothing"}`);

const listing = process.platform === "win32"
  ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", timeout: BOUND_MS }).stdout || ""
  : spawnSync("ps", ["-eo", "args"], { encoding: "utf8", timeout: BOUND_MS }).stdout || "";
const alive = listing.split(/\r?\n/).filter((l) => l.includes(TMP) && !l.includes("Get-CimInstance") && !/^ps /.test(l));
clause("LAST", alive.length === 0, `${alive.length} node process(es) naming ${TMP}`);
try { rmSync(TMP, { recursive: true, force: true }); } catch { }
if (reds.length) { console.log(`RED MJD7 · ${reds.join(" ")}`); process.exit(1); }
console.log(`GREEN MJD7 the sweep reads the grade queue from its cursor — one whole read only when the cursor is missing, ahead or rewritten · ${greens.length} clause(s)`);
process.exit(0);
