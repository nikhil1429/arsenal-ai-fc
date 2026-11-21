// unit mgat · which failures can REACH each new empty block? Plants under os.tmpdir() only; no port is bound
// (an http server is created, never listened on), nothing live is named. Each probe prints what the guarded call does.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, openSync, closeSync } from "node:fs"; import { join } from "node:path"; import { tmpdir } from "node:os";
import { createServer } from "node:http";
const d = mkdtempSync(join(tmpdir(), "mgat-fate-")); process.env.ARSENAL_CALL_STATE_DIR = join(d, "st"); mkdirSync(process.env.ARSENAL_CALL_STATE_DIR);
const probe = (name, f) => { try { const v = f(); console.log(`${name}: no throw${v === undefined ? "" : " · " + v}`); } catch (e) { console.log(`${name}: THROWS ${e.code || e.name}`); } };
// S1 groundsman.mjs:263 — rmSync(idx, { force: true }) on the private index
probe("S1 rmSync missing file, force", () => rmSync(join(d, "nope"), { force: true }));
mkdirSync(join(d, "idxdir")); probe("S1 rmSync a DIRECTORY at the index path, force", () => rmSync(join(d, "idxdir"), { force: true }));
// S2/S3 cortex.mjs:2344 — the retire callback on an http server that may not be listening
const s = createServer(() => {});
probe("S2 closeAllConnections, never listened", () => s.closeAllConnections && s.closeAllConnections());
probe("S3 close, never listened", () => { s.close(); return "close() returned"; });
probe("S3 close twice", () => { s.close(); return "close() returned"; });
s.on("error", () => {});
// S4/S5/S6 captains_call.mjs — parseRows / readRange / closeSync, through the exported reader on planted files
const cc = await import("../../../scripts/captains_call.mjs");
const q = join(d, "q.jsonl"); const good = (i) => JSON.stringify({ kind: "settled", of: "cap" + i }) + "\n";
writeFileSync(q, good(1) + '{"kind":"settled","of":' + good(2) + good(3));   // a torn append merged into the next row: one COMPLETE line that does not parse
const r = cc.readGradeQueueSince(q, undefined);
console.log(`S4 merged middle line: rows ${r.rows.length} of 3 appended (lines 3) · mode ${r.mode} · result keys ${Object.keys(r).join(",")} (no count of the dropped line)`);
writeFileSync(q, good(1) + '{"kind":"settled","of":"cap');
const t = cc.readGradeQueueSince(q, undefined); console.log(`S4 torn tail: rows ${t.rows.length} · cursor.offset ${t.cursor.offset} = first line bytes ${Buffer.byteLength(good(1))} (re-read next sync)`);
probe("S5 readRange missing path", () => "returned bytes " + cc.GRADE_QUEUE_IO.readRange(join(d, "gone"), 0, 10).length);
probe("S5 readRange a directory", () => "returned bytes " + cc.GRADE_QUEUE_IO.readRange(join(d, "idxdir"), 0, 10).length);
writeFileSync(q, good(1)); const c1 = cc.readGradeQueueSince(q, undefined).cursor; rmSync(q);
const gone = cc.readGradeQueueSince(q, c1); console.log(`S5 cursor held, file then removed: mode ${gone.mode} · why ${gone.why} · rows ${gone.rows.length}`);
const fd = openSync(join(d, "f"), "w"); closeSync(fd); probe("S6 closeSync an fd already closed", () => closeSync(fd));
rmSync(d, { recursive: true, force: true });
console.log("mgat fate: probes done");
