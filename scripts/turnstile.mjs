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
// MODES: node scripts/turnstile.mjs           → daemon (4s clipboard cadence)
//        node scripts/turnstile.mjs selftest
// ============================================================================

import { writeFileSync, readFileSync, unlinkSync } from "node:fs";
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
    const tmp = join(deps.tmpdir || os.tmpdir(), `turnstile-${Date.now()}.json`);
    (deps.write || writeFileSync)(tmp, JSON.stringify(stamped));
    let out = "";
    try {
      out = (deps.sh || ((script, argv) => execFileSync(process.execPath, [join(__dirname, script), ...argv], { encoding: "utf8", timeout: 60000, windowsHide: true })))("capture.mjs", ["paste", tmp]);
    } catch (e) {
      return { ingested: 0, why: `capture rejected it (its contract, its call): ${String(e.message).slice(0, 120)}` };
    } finally {
      try { (deps.unlink || unlinkSync)(tmp); } catch { }   // rep content never lingers in %TEMP%
    }
    seen.push(h); if (seen.length > CAP) seen.shift();
    if (deps.persist) { try { deps.persist(seen); } catch { } }
    // CAPTURE'S MOUTH IS THE TRUTH — its exit 0 only means the JSON parsed;
    // the real appended/rejected counts ride its stdout. Speaking a rep the
    // owner rejected would be a fabricated success, so we read the counts.
    const m = String(out || "").match(/appended (\d+), rejected (\d+), duplicates (\d+)/);
    const appended = m ? Number(m[1]) : reps.length;
    const rejected = m ? Number(m[2]) : 0, dupes = m ? Number(m[3]) : 0;
    if (appended === 0) return { ingested: 0, why: `capture accepted none (rejected ${rejected}, duplicates ${dupes}) — the reps are missing required fields` };
    return { ingested: appended, why: (rejected || dupes) ? `captured ${appended} (capture rejected ${rejected}, duplicates ${dupes})` : "captured" };
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
    const gate = makeGate({ sh: (s, a) => calls.push({ s, a }), write: (p, c) => writes.push({ p, c }), tmpdir: "T" });
    const blob = JSON.stringify([REP, { ...REP, concept: "attention", confidence: "knew" }]);
    const r1 = gate(blob);
    assert("COPY = CAPTURED: contract routes through capture.mjs (the owner)", r1.ingested === 2 && calls[0].s === "capture.mjs" && calls[0].a[0] === "paste");
    assert("the temp file carries the reps, ARRIVAL-STAMPED (capture demands ts)", JSON.parse(writes[0].c).length === 2 && JSON.parse(writes[0].c).every(r => typeof r.ts === "string" && r.ts.includes("T")));
    const r2 = gate(blob);
    assert("the SAME copy never ingests twice (hash-ring dedupe)", r2.ingested === 0 && r2.why.includes("dedupe") && calls.length === 1);
    const r3 = gate("just some copied text about football");
    assert("non-contract clipboard: ignored, unlogged, untouched", r3.ingested === 0 && calls.length === 1);
    const gateRej = makeGate({ sh: () => { throw new Error("bad rep line 3"); }, write: () => {}, tmpdir: "T" });
    const r4 = gateRej(blob);
    assert("capture's rejection is final (turnstile never overrides the owner)", r4.ingested === 0 && r4.why.includes("its contract"));
    // FABRICATION GUARD — capture exits 0 even when it appends nothing; only
    // its stdout counts are the truth, and the gate must repeat them honestly
    const gateNone = makeGate({ sh: () => "paste: appended 0, rejected 2, duplicates 0 → x (total 5)", write: () => {}, tmpdir: "T" });
    const r5 = gateNone(JSON.stringify([REP]));
    assert("FABRICATION GUARD: capture accepting none ⇒ ingested 0, said honestly", r5.ingested === 0 && r5.why.includes("accepted none"));
    const gatePart = makeGate({ sh: () => "paste: appended 1, rejected 1, duplicates 0 → x (total 6)", write: () => {}, tmpdir: "T" });
    const r6 = gatePart(JSON.stringify([REP, { ...REP, concept: "attention" }]));
    assert("PARTIAL TRUTH: only capture's appended count is ever spoken", r6.ingested === 1 && r6.why.includes("rejected 1"));
    const ringOut = [];
    const gateP = makeGate({ sh: () => "paste: appended 1, rejected 0, duplicates 0 → x (total 1)", write: () => {}, tmpdir: "T", persist: (ring) => ringOut.push(ring.length) });
    gateP(JSON.stringify([REP]));
    assert("RESTART ARMOR: the hash ring rides deps.persist after each ingest", ringOut.length === 1 && ringOut[0] === 1);
    const gateTs = makeGate({ sh: () => "paste: appended 1, rejected 0, duplicates 0 → x (total 1)", write: (p, c) => writes.push({ p, c }), tmpdir: "T" });
    gateTs(JSON.stringify([{ ...REP, ts: null }]));
    assert("a model's ts:null never erases the arrival stamp", typeof JSON.parse(writes[writes.length - 1].c)[0].ts === "string" && JSON.parse(writes[writes.length - 1].c)[0].ts.includes("T"));
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
  let seenRing = []; try { seenRing = JSON.parse(readFileSync(SEEN_FILE, "utf8")).slice(-20); } catch { }
  const gate = makeGate({ seen: seenRing, persist: (ring) => writeFileSync(SEEN_FILE, JSON.stringify(ring)) });
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
    } else if (r.why && r.why.includes("accepted none")) {
      // a contract that capture fully rejected must be SAID, not swallowed —
      // silence here reads as success to the captain
      console.log(`turnstile: ${r.why}`);
      import("./speak.mjs").then(({ say }) => say("Woh session capture nahi hua, captain — reps reject ho gaye. Format check karo.")).catch(() => {});
    }
  }, CADENCE_MS);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { parseContract, makeGate };
