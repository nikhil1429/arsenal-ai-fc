#!/usr/bin/env node
// ============================================================================
// turnstile.mjs · ARSENAL AI FC — THE TURNSTILE (copy = captured)
// ----------------------------------------------------------------------------
// WHAT:  The zero-tax capture daemon (M12). The old flow taxed the exact brain
//        this club protects: copy the reps JSON → switch app → run a command →
//        paste. Four junctions; each one a wall. Now: COPY IS THE WHOLE MOVE.
//        This daemon watches the Windows clipboard; the moment a copied text
//        parses as the CAPTURE CONTRACT (a JSON array of reps with the
//        gut-word law intact), it routes it through capture.mjs — the owner —
//        runs a heartbeat, and speaks one quiet confirmation. From claude.ai,
//        Colab, a Gem on the laptop — tap copy, done. Session captured.
// LAWS:  PRIVACY BY SHAPE: everything on the clipboard that is NOT a capture
//        contract is IGNORED — never parsed further, never logged, never
//        stored (the hash ring holds hashes only, for dedupe). Writes go
//        through owners (capture.mjs validates; malformed reps still get
//        rejected THERE — this daemon only detects the shape). Dedupe: the
//        same copied blob never ingests twice. Singleton lock :4111.
// SOLE WRITER of: dressing-room/state/turnstile_seen.json (the dedupe ring — hashes only)
//                 dressing-room/state/turnstile_rejected.jsonl (L2 · fate 13 — every batch capture
//                 refused or could not take, parked WHOLE, append-only, never rewritten)
// L2 (6 Oct 2026, fate 13 · capture.txt:8): A REJECTED BATCH IS WRITTEN TO DISK, NEVER VANISHES.
//        The temp file holding his reps was unlinked in a `finally` BEFORE capture's verdict was
//        even read, and the blob was remembered as ingested before anyone knew whether a rep
//        landed — so a batch capture refused existed only on the clipboard, and a re-copy was
//        deduped into silence. Now: capture's counts are read FIRST; a batch it rejected (whole or
//        in part) or could not take at all is PARKED in turnstile_rejected.jsonl (verified on
//        disk) before the temp is removed; only a blob that is now on reps_log is remembered; and
//        a re-copy of an already-captured session is said as exactly that — never "reject ho gaye".
// MODES: node scripts/turnstile.mjs           → daemon (4s clipboard cadence)
//        node scripts/turnstile.mjs selftest
// ============================================================================

import { writeFileSync, readFileSync, unlinkSync, appendFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync, execFile } from "node:child_process";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCK_PORT = 4111;                             // one below the cortex's lock
const CADENCE_MS = 4000;
// the dedupe ring SURVIVES restarts — hashes only (never content), so a daemon
// respawn with the same session still on the clipboard can't double-ingest it
const SEEN_FILE = join(__dirname, "..", "dressing-room", "state", "turnstile_seen.json");
// L2 (fate 13): the parking lot for a batch capture did not take — append-only, one row per batch
const REJECTED_FILE = join(__dirname, "..", "dressing-room", "state", "turnstile_rejected.jsonl");

// parkBatch — APPEND ONE parked batch, VERIFIED ON DISK (the file must grow by the row's bytes — the
// law capture.mjs's quarantine wire learned on 11 Aug). Returns, never throws: the caller says the
// outcome out loud, because a failed park means the clipboard is the only copy left.
function parkBatch(row, path = REJECTED_FILE) {
  const line = JSON.stringify(row) + "\n";
  const bytes = Buffer.byteLength(line, "utf8");
  try {
    mkdirSync(dirname(path), { recursive: true });
    const before = existsSync(path) ? statSync(path).size : 0;
    appendFileSync(path, line, "utf8");
    if (statSync(path).size < before + bytes) return { ok: false, error: "the parking file did not grow by the batch — it is NOT on disk" };
    return { ok: true, path };
  } catch (e) { return { ok: false, error: `${(e && e.code) || "error"}: ${String((e && e.message) || e).slice(0, 160)}` }; }
}

// ---------------------------------------------------------------------------
// THE SHAPE TEST — is this copied text the capture contract? (pure)
// A contract is a JSON array (1..200 items) where EVERY item carries a
// concept, a question, and a legal gut-word. Anything else: not our business.
// ---------------------------------------------------------------------------
function parseContract(text) {
  const s = String(text || "").trim();
  if (!s.startsWith("[") || !s.endsWith("]") || s.length > 200000) return null;
  let arr; try { arr = JSON.parse(s); } catch { return null; }
  if (!Array.isArray(arr) || arr.length < 1 || arr.length > 200) return null;
  const ok = arr.every(r => r && typeof r === "object" &&
    typeof r.concept === "string" && r.concept.trim() &&
    typeof r.question === "string" && r.question.trim() &&
    ["knew", "shaky", "guessed"].includes(r.confidence));
  return ok ? arr : null;
}
const hash32 = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(16); };

// ---------------------------------------------------------------------------
// THE PASS — one clipboard reading through the gate (pure-ish, deps injected)
// ---------------------------------------------------------------------------
function makeGate(deps = {}) {
  const seen = deps.seen || [];                      // hash ring, most-recent-last
  const CAP = 20;
  return function pass(clip) {
    const reps = parseContract(clip);
    if (!reps) return { ingested: 0, why: "not a contract — ignored (never logged)" };
    const h = hash32(String(clip).trim());
    if (seen.includes(h)) return { ingested: 0, why: "same blob already ingested (dedupe)" };
    // ARRIVAL IS THE TIMESTAMP — models never have to emit clocks (capture's
    // contract requires ts; the copy-moment is the honest one, like voice reps).
    // The stamp rides AFTER the spread so a model's "ts": null can't erase it.
    const now = (deps.now || new Date()).toISOString();
    const stamped = reps.map(r => ({ ...r, ts: r.ts || now }));
    // L2 (fate 13) — THE ORDER IS THE FIX. 1 hand the batch to the owner · 2 READ its verdict ·
    // 3 PARK anything it did not take, verified on disk · 4 only THEN remove the temp · 5 remember
    // the blob only if its reps are now on reps_log. The old order deleted the temp (in a finally)
    // and remembered the blob before step 2, so a rejected batch existed nowhere but the clipboard.
    const park = (verdict, why) => {
      const r = (deps.park || parkBatch)({ v: 1, kind: "rejected_batch", ts: now, blob: h, n: stamped.length, verdict, why: String(why).slice(0, 300), reps: stamped });
      return r && r.ok ? { parked: true, park_path: r.path || null } : { parked: false, park_error: (r && r.error) || "the parking writer gave no answer" };
    };
    const lost = (p) => p.parked ? "" : ` — ⚠ and it could NOT be parked (${p.park_error}): the clipboard is the only copy`;
    const tmp = join(deps.tmpdir || os.tmpdir(), `turnstile-${Date.now()}.json`);
    try { (deps.write || writeFileSync)(tmp, JSON.stringify(stamped)); }
    catch (e) { const p = park(null, `the temp file for capture could not be written: ${String((e && e.message) || e).slice(0, 120)}`); return { ingested: 0, ...p, why: `the batch never reached capture (temp write failed)${lost(p)}` }; }
    const removeTmp = () => { try { (deps.unlink || unlinkSync)(tmp); } catch { /* best effort — the batch is already on reps_log or parked */ } };   // rep content never lingers in %TEMP%
    let out = "";
    try {
      out = (deps.sh || ((script, argv) => execFileSync(process.execPath, [join(__dirname, script), ...argv], { encoding: "utf8", timeout: 60000, windowsHide: true })))("capture.mjs", ["paste", tmp]);
    } catch (e) {
      const p = park(null, `capture refused the batch outright: ${String(e.message).slice(0, 120)}`);
      removeTmp();
      return { ingested: 0, ...p, why: `capture rejected it (its contract, its call): ${String(e.message).slice(0, 120)}${p.parked ? " — the batch is parked on disk" : lost(p)}` };
    }
    // CAPTURE'S MOUTH IS THE TRUTH — its exit 0 only means the JSON parsed;
    // the real appended/rejected counts ride its stdout. Speaking a rep the
    // owner rejected would be a fabricated success, so we read the counts.
    const m = String(out || "").match(/appended (\d+), rejected (\d+), duplicates (\d+)/);
    const appended = m ? Number(m[1]) : 0;
    const rejected = m ? Number(m[2]) : 0, dupes = m ? Number(m[3]) : 0;
    // nothing readable came back, or capture refused some or all of it → the WHOLE batch is parked
    // (capture names no rep by index, and the accepted ones dedupe on any later re-paste)
    const p = (!m || rejected > 0) ? park(m ? { appended, rejected, duplicates: dupes } : null, m ? `capture rejected ${rejected} of ${stamped.length}` : `capture printed no counts line (${String(out || "").trim().slice(0, 120) || "no output"})`) : null;
    removeTmp();
    // remembered ONLY when its reps are on reps_log now (something landed, or every rep was already there)
    if (m && (appended > 0 || (rejected === 0 && dupes > 0))) {
      seen.push(h); if (seen.length > CAP) seen.shift();
      if (deps.persist) { try { deps.persist(seen); } catch { /* the ring is an optimisation; reps_log already holds the batch */ } }
    }
    if (!m) return { ingested: 0, ...p, why: `capture's verdict was unreadable — the batch is ${p.parked ? "parked on disk" : "NOT parked"}${lost(p)}` };
    if (appended === 0 && rejected === 0 && dupes > 0) return { ingested: 0, duplicate: true, why: `already captured — capture counted all ${dupes} as duplicates (the session is safely on reps_log)` };
    if (appended === 0) return { ingested: 0, ...p, why: `capture accepted none (rejected ${rejected}, duplicates ${dupes}) — ${p.parked ? "the batch is parked on disk" : "NOT parked"}${lost(p)}` };
    return { ingested: appended, ...(p || {}), why: (rejected || dupes) ? `captured ${appended} (capture rejected ${rejected}, duplicates ${dupes})${p ? (p.parked ? " — the batch is parked on disk" : lost(p)) : ""}` : "captured" };
  };
}

// windows clipboard read (daemon only)
function readClipboard() {
  try {
    // PS 5.1 pipes stdout in the legacy OEM codepage — force UTF-8 so
    // Hinglish/Devanagari question text survives the trip intact
    return execFileSync("powershell", ["-NoProfile", "-Command", "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; Get-Clipboard -Raw"], { encoding: "utf8", timeout: 8000, windowsHide: true });
  } catch { return ""; }
}

async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const REP = { surface: "gem", track: "concept", concept: "embeddings", axis: "c", question: "cosine vs dot?", confidence: "shaky", correct: true };

  // the shape test — privacy by shape
  assert("a real contract parses", parseContract(JSON.stringify([REP])).length === 1);
  assert("prose is ignored (not our business)", parseContract("meeting notes: call bank at 5") === null);
  assert("random JSON is ignored (no gut-word, no entry)", parseContract(JSON.stringify([{ a: 1 }])) === null && parseContract(JSON.stringify({ reps: [REP] })) === null);
  assert("an illegal gut-word is ignored here (capture would reject anyway)", parseContract(JSON.stringify([{ ...REP, confidence: "maybe" }])) === null);
  assert("empty/huge blobs ignored", parseContract("[]") === null && parseContract("[" + "1,".repeat(300000) + "1]") === null);

  // the gate — one gesture, owner writes, dedupe
  {
    const calls = []; const writes = [];
    // L2 (fate 13): every gate below parks into a SINK — a selftest never writes his state dir. And the
    // owner's stub now speaks capture's REAL counts line: the old one returned a number, and passed only
    // because a missing counts line used to be read as "everything landed" (now it is parked, never assumed).
    const parks = []; const parkSink = (row) => { parks.push(row); return { ok: true, path: "P" }; };
    const gate = makeGate({ sh: (s, a) => { calls.push({ s, a }); return "paste: appended 2, rejected 0, duplicates 0 → x (total 2)"; }, write: (p, c) => writes.push({ p, c }), tmpdir: "T", park: parkSink });
    const blob = JSON.stringify([REP, { ...REP, concept: "attention", confidence: "knew" }]);
    const r1 = gate(blob);
    assert("COPY = CAPTURED: contract routes through capture.mjs (the owner)", r1.ingested === 2 && calls[0].s === "capture.mjs" && calls[0].a[0] === "paste");
    assert("the temp file carries the reps, ARRIVAL-STAMPED (capture demands ts)", JSON.parse(writes[0].c).length === 2 && JSON.parse(writes[0].c).every(r => typeof r.ts === "string" && r.ts.includes("T")));
    const r2 = gate(blob);
    assert("the SAME copy never ingests twice (hash-ring dedupe)", r2.ingested === 0 && r2.why.includes("dedupe") && calls.length === 1);
    const r3 = gate("just some copied text about football");
    assert("non-contract clipboard: ignored, unlogged, untouched", r3.ingested === 0 && calls.length === 1);
    const gateRej = makeGate({ sh: () => { throw new Error("bad rep line 3"); }, write: () => {}, tmpdir: "T", park: parkSink });
    const r4 = gateRej(blob);
    assert("capture's rejection is final (turnstile never overrides the owner)", r4.ingested === 0 && r4.why.includes("its contract"));
    // FABRICATION GUARD — capture exits 0 even when it appends nothing; only
    // its stdout counts are the truth, and the gate must repeat them honestly
    const gateNone = makeGate({ sh: () => "paste: appended 0, rejected 2, duplicates 0 → x (total 5)", write: () => {}, tmpdir: "T", park: parkSink });
    const r5 = gateNone(JSON.stringify([REP]));
    assert("FABRICATION GUARD: capture accepting none ⇒ ingested 0, said honestly", r5.ingested === 0 && r5.why.includes("accepted none"));
    const gatePart = makeGate({ sh: () => "paste: appended 1, rejected 1, duplicates 0 → x (total 6)", write: () => {}, tmpdir: "T", park: parkSink });
    const r6 = gatePart(JSON.stringify([REP, { ...REP, concept: "attention" }]));
    assert("PARTIAL TRUTH: only capture's appended count is ever spoken", r6.ingested === 1 && r6.why.includes("rejected 1"));
    const ringOut = [];
    const gateP = makeGate({ sh: () => "paste: appended 1, rejected 0, duplicates 0 → x (total 1)", write: () => {}, tmpdir: "T", persist: (ring) => ringOut.push(ring.length), park: parkSink });
    gateP(JSON.stringify([REP]));
    assert("RESTART ARMOR: the hash ring rides deps.persist after each ingest", ringOut.length === 1 && ringOut[0] === 1);
    const gateTs = makeGate({ sh: () => "paste: appended 1, rejected 0, duplicates 0 → x (total 1)", write: (p, c) => writes.push({ p, c }), tmpdir: "T", park: parkSink });
    gateTs(JSON.stringify([{ ...REP, ts: null }]));
    assert("a model's ts:null never erases the arrival stamp", typeof JSON.parse(writes[writes.length - 1].c)[0].ts === "string" && JSON.parse(writes[writes.length - 1].c)[0].ts.includes("T"));

    // ── L2 · fate 13 (6 Oct 2026, capture.txt:8) — A REJECTED BATCH IS WRITTEN TO DISK, NEVER VANISHES ──
    {
      const order = []; const pk = [];
      const sink = (row) => { order.push("park"); pk.push(row); return { ok: true, path: "P" }; };
      const blobR = JSON.stringify([{ ...REP, question: "l2 rejected" }, { ...REP, concept: "attention", question: "l2 rejected 2" }]);
      const gR = makeGate({ sh: () => { order.push("capture"); return "paste: appended 0, rejected 2, duplicates 0 → x (total 5)"; }, write: () => order.push("write"), unlink: () => order.push("unlink"), tmpdir: "T", park: sink });
      const rR = gR(blobR);
      assert("L2 · A REJECTED BATCH IS PARKED ON DISK — capture taking none (rejected 2) parks the WHOLE batch with capture's own counts, and only then is the temp removed (the old finally deleted it before the verdict was read)",
        rR.ingested === 0 && rR.parked === true && pk.length === 1 && pk[0].kind === "rejected_batch" && pk[0].n === 2 && pk[0].reps.length === 2
        && pk[0].verdict && pk[0].verdict.rejected === 2 && order.join(">") === "write>capture>park>unlink", order.join(">"));
      const rR2 = gR(blobR);
      assert("L2 · …and a blob nothing landed from is NOT remembered — a re-copy re-tries the owner instead of being deduped into silence",
        rR2.ingested === 0 && !/dedupe/.test(rR2.why) && pk.length === 2);
      const pkT = [];
      const rT = makeGate({ sh: () => { throw new Error("capture: bad rep line 3"); }, write: () => {}, unlink: () => {}, tmpdir: "T", park: (row) => { pkT.push(row); return { ok: true, path: "P" }; } })(JSON.stringify([REP]));
      assert("L2 · a batch capture REFUSED OUTRIGHT (it threw) is parked too — never left on the clipboard alone",
        rT.ingested === 0 && rT.parked === true && pkT.length === 1 && /refused the batch outright/.test(pkT[0].why));
      const pkP = []; const ringP = [];
      const rP = makeGate({ sh: () => "paste: appended 1, rejected 1, duplicates 0 → x (total 6)", write: () => {}, unlink: () => {}, tmpdir: "T", seen: ringP, park: (row) => { pkP.push(row); return { ok: true, path: "P" }; } })(JSON.stringify([REP, { ...REP, concept: "attention" }]));
      assert("L2 · a PARTIAL rejection parks the whole batch (capture names no rep by index) AND the blob is remembered — its good rep is on reps_log",
        rP.ingested === 1 && pkP.length === 1 && pkP[0].verdict.appended === 1 && ringP.length === 1);
      const pkD = [];
      const rD = makeGate({ sh: () => "paste: appended 0, rejected 0, duplicates 3 → x (total 9)", write: () => {}, unlink: () => {}, tmpdir: "T", park: (row) => { pkD.push(row); return { ok: true }; } })(JSON.stringify([REP]));
      assert("L2 · a RE-COPY OF AN ALREADY-CAPTURED SESSION (duplicates only) is said as exactly that — never 'reps reject ho gaye', and nothing is parked",
        rD.ingested === 0 && rD.duplicate === true && /already captured/.test(rD.why) && !/accepted none/.test(rD.why) && pkD.length === 0);
      const rF = makeGate({ sh: () => "paste: appended 0, rejected 1, duplicates 0 → x (total 1)", write: () => {}, unlink: () => {}, tmpdir: "T", park: () => ({ ok: false, error: "EROFS" }) })(JSON.stringify([REP]));
      assert("L2 · a park that FAILS is SAID — the reason names that the clipboard is now the only copy",
        rF.ingested === 0 && rF.parked === false && /only copy/.test(rF.why) && /EROFS/.test(rF.why));
      const pkN = [];
      const rN = makeGate({ sh: () => "", write: () => {}, unlink: () => {}, tmpdir: "T", park: (row) => { pkN.push(row); return { ok: true }; } })(JSON.stringify([REP]));
      assert("L2 · NO counts line at all is NOT a success — nothing is assumed landed: ingested 0, the batch parked",
        rN.ingested === 0 && pkN.length === 1 && /unreadable/.test(rN.why));
      const { mkdtempSync, rmSync } = await import("node:fs");
      const td = mkdtempSync(join(os.tmpdir(), "turnstile-l2-"));
      try {
        const okP = parkBatch({ kind: "rejected_batch", n: 1, reps: [REP] }, join(td, "rej.jsonl"));
        writeFileSync(join(td, "file"), "x");
        const badP = parkBatch({ kind: "rejected_batch", n: 1, reps: [REP] }, join(td, "file", "rej.jsonl"));
        assert("L2 · the real parking writer appends VERIFIED ON DISK, and a path it cannot write returns ok:false with the errno — it never throws",
          okP.ok === true && readFileSync(join(td, "rej.jsonl"), "utf8").includes('"kind":"rejected_batch"') && badP.ok === false && /ENOTDIR|EEXIST/.test(String(badP.error)));
      } finally { try { rmSync(td, { recursive: true, force: true }); } catch { /* the OS reaps its own temp dir */ } }
    }
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  if ((process.argv[2] || "").toLowerCase() === "selftest") process.exit((await selftest()) ? 0 : 1);
  // singleton — two turnstiles double-ingest
  const { createServer } = await import("node:http");
  const lock = createServer(() => {});
  await new Promise((resolve) => {
    lock.on("error", (e) => { if (e.code === "EADDRINUSE") { console.log("turnstile: another turnstile holds :4111 — standing down."); process.exit(0); } throw e; });
    lock.listen(LOCK_PORT, "127.0.0.1", resolve);
  });
  console.log(`turnstile: watching the clipboard (${CADENCE_MS / 1000}s cadence) — copy a capture-contract JSON anywhere and it's in. Everything else is ignored by shape.`);
  // the ring survives restarts (hashes only) — a respawn with the session
  // still on the clipboard must not re-ingest it as fresh-stamped duplicates
  // law-waiver:trailing-n the seen ring is a DEDUPE SET of capture hashes (makeGate caps it at CAP = 20), never a window of
  // rows read as recent: a clipboard blob seen once is a duplicate at any age (forks row 649 (0), lawpack trailing-n-slice)
  let seenRing = []; try { seenRing = JSON.parse(readFileSync(SEEN_FILE, "utf8")).slice(-20); } catch { }
  const gate = makeGate({ seen: seenRing, persist: (ring) => writeFileSync(SEEN_FILE, JSON.stringify(ring)), park: (row) => parkBatch(row) });
  let lastHash = "";
  setInterval(() => {
    const clip = readClipboard();
    if (!clip) return;
    const h = hash32(clip);
    if (h === lastHash) return;                      // unchanged — free
    lastHash = h;
    const r = gate(clip);
    if (r.ingested) {
      console.log(`turnstile: ${r.why === "captured" ? r.ingested + " rep(s) captured from the clipboard" : r.why}`);
      execFile(process.execPath, [join(__dirname, "heartbeat.mjs")], { windowsHide: true }, () => {});
      import("./speak.mjs").then(({ say }) => say(`${r.ingested} reps andar. Session captured.`)).catch(() => {});
    } else if (r.duplicate) {
      // L2 (fate 13): a re-copy of a session that is ALREADY banked is not a failure — said as itself
      console.log(`turnstile: ${r.why}`);
    } else if (r.why && (r.why.includes("accepted none") || r.why.includes("rejected it") || r.why.includes("unreadable") || r.why.includes("never reached"))) {
      // a contract that capture did not take must be SAID, not swallowed — silence here reads as
      // success to the captain. L2: and where it went (parked on disk, or the clipboard alone).
      console.log(`turnstile: ${r.why}`);
      import("./speak.mjs").then(({ say }) => say(r.parked ? "Woh session capture nahi hua, captain — reps reject ho gaye, par file mein bacha liye hain. Format check karo." : "Woh session capture nahi hua aur bacha bhi nahi — clipboard hi akeli copy hai, captain. Abhi dobara copy mat karna.")).catch(() => {});
    }
  }, CADENCE_MS);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { parseContract, makeGate, parkBatch };
