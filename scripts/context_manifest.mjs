#!/usr/bin/env node
// ============================================================================
// context_manifest.mjs · ARSENAL AI FC — THE SESSIONSTART ASSEMBLER (audit #107)
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. Three separate repairs — the hippocampus splice (31 Jul), the
// teaching card (31 Jul), the Re-Jirah line and the course brief (4 Aug) — each fixed
// a real "this never reached the session" defect the same way: by adding one more
// splice inside learnstate.mjs's brief(). That function now performs seven jobs, and
// the pattern had started to produce its own bug class:
//
//   MEASURED 5 Aug 2026 — the hippocampus cartridge is 4,157 characters and the brief
//   carried MEMO_MAX = 2,200 of them. 1,957 characters of his durable memory were
//   dropped at every single SessionStart, silently, with no line saying so. And the
//   PENDING IDENTITY FACTS queue — which mcp-memory.mjs surfaces precisely because
//   "staged facts rotted invisibly forever" — had no path into the brief at all.
//
// The size was never the problem: 7.3k characters is ~1% of the context window. The
// problem was SILENT loss. So this module does not add an eighth splice. It makes the
// question "did everything arrive?" answerable:
//
//   1. EVERY PART IS MEASURED. Each context source is a provider with a byte count.
//   2. THE BUDGET IS EXPLICIT, and spent worst-priority-first, so a squeeze trims the
//      most expendable part rather than whatever happens to be last in the string.
//   3. WHAT WAS TRIMMED OR MISSING IS NAMED, in a footer, every time. A missing leg
//      and an empty leg are different facts — the same law mcp-memory.mjs:249 already
//      applies to get_context. One law, now applied at both doors.
//
// LAWS INHERITED (unchanged):
//   · READ-ONLY. Writes nothing. The single-writer law is untouched.
//   · REPAIR TOWARD SILENCE. Every provider is wrapped; a provider that throws is
//     recorded as ERROR and the rest of the brief renders exactly as before.
//   · ORGAN-SAFE. Callers must apply their own ARSENAL_ORGAN guard BEFORE calling
//     this — a headless `claude -p` organ prompt must never carry his memory.
//   · FROZEN BELOW. learnstate.mjs's brief() is untouched and still renders the
//     memory and card blocks in their canonical positions (above the LAWS line).
//     This module decides HOW MUCH each gets and REPORTS what it spent.
// ============================================================================
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const STATE = join(ROOT, "dressing-room", "state");
const PENDING_FACTS = join(ROOT, "dressing-room", "hippocampus", "identity_facts.pending.jsonl");

// THE CEILING — approved 5 Aug 2026 (D2). Derived, not chosen: the assembled brief
// runs ~7,300 characters ≈ 1,800 tokens ≈ 1% of a 200k context window, so bytes are
// not the binding constraint here — attention is, and attention is protected by the
// per-provider caps below plus learnstate's own anti-wall discipline. 12,000 leaves
// ~4,700 of headroom for growth while still being a real, enforced, reported bound.
export const CEILING = 12_000;
export const MEMORY_CAP = 6_000;      // the cartridge is 4,157 today; this is headroom, not a trim
export const FOOTER_RESERVE = 260;    // the manifest line must always fit — it is the point

const clipTo = (s, n) => (typeof s === "string" && s.length > n)
  ? s.slice(0, n) + "\n… (truncated — full recall via the organism-memory MCP `get_context`)"
  : s;

// ── PENDING IDENTITY FACTS ───────────────────────────────────────────────────
// Law 4: remember_fact STAGES, it never writes canon. mcp-memory.mjs surfaces this
// queue because a staged fact with no surface to be confirmed on is a fact that rots.
// get_context was the only door that showed it, and get_context is a call a model has
// to remember to make — which is the exact failure mode this whole audit is about.
// THE THREE STATES ARE THREE FACTS (audit 6 Aug 2026). This module's own header says
// "a missing leg and an empty leg are different facts" — and then rendered a file that
// does not exist, a healthy queue with nothing in it, and an unreadable file as the SAME
// footer string, `pending_facts MISSING (0 staged)`. Its selftest pinned that. The word
// MISSING on a queue that is simply empty reads as breakage; the word EMPTY on a file
// that is genuinely gone reads as fine. Each now says which one it is.
//
// THE DOOR WAS CUTTING THE VERY THING IT EXISTS TO SHOW (audit 10 Aug 2026). This block
// rendered `.slice(0, 160)` per row — no ellipsis, no field naming the loss — and only
// `rows.slice(-5)` of them while the header printed the FULL count. MEASURED against the
// live queue that morning: all 3 staged rows are EXACTLY 400 characters, so 720 characters
// of HIS OWN RULINGS were dropped at every SessionStart, cut mid-word — row 0 lost "i do
// not rush things, i execute them perfectly", row 1 lost the Gaffer-ban removal — and the
// block then told the session to ask him to confirm or drop a fact it had shown 40% of.
// A silent cut, inside the module built to abolish silent cuts. Same shape as dugout.mjs:885
// (JSON.stringify + cut at 220 on the capsule door), found the same day.
//
// A QUEUE THAT WILL NOT PARSE IS NOT AN EMPTY QUEUE (audit 10 Aug 2026). The per-line
// reader below swallowed every JSON.parse failure in a bare `catch {}`, so a truncated
// append or an encoding-mangled file produced zero rows — and zero rows fell straight
// into the `EMPTY` return, the word this block's own header three paragraphs up reserves
// for "a healthy queue with nothing in it". A corrupt staging queue therefore read as
// FINE at every SessionStart, forever, with `pending_facts EMPTY (0 staged)` in the
// footer: exactly the rot that surfacing this queue at all (Law 4) was built to prevent,
// and the same shape as the three silent-loss defects already named in this file. The
// damage is worst precisely when it matters most — the rows are HIS OWN RULINGS awaiting
// his word, and a lost one is never asked about again.
// UNREADABLE ROWS ARE NOW COUNTED, and the count decides the word: nothing parsed and
// something was there → ERROR; nothing there at all → EMPTY. A PARTIAL corruption (some
// rows readable, some not) still renders — a readable fact must never be held hostage to
// an unreadable neighbour — but the block AND the footer both name the rows they could
// not read, the same way a budget squeeze already names what it hid.
// NO NEW ENGINE, so nothing new is frozen: the renderer below is byte-for-byte the
// 10 Aug one and pendingFactsBlockLegacy stays the frozen pre-repair door. What changed
// is CLASSIFICATION — which is how the EMPTY/MISSING/ERROR split itself landed on 6 Aug,
// also without a freeze. The legacy keeps the old swallow on purpose: it is the control
// the selftest measures this door against.
//
// THE 160 IS GONE, NOT RE-TUNED — no new number replaces it. Every row is ALREADY clipped
// to 400 characters by its OWNER at the staging door (mcp-memory.mjs:302/328, and the same
// clip in hippocampus.mjs:371 which calls 400 "not a new number either"), so a second cut
// here was a cut on top of a cut, and the only one nobody named. What bounds this block
// instead is a BUDGET the caller derives from the constants already in this file — see
// assemble() step 3 — and when that budget bites, the block AND the footer both say by how
// much. The pre-repair renderer is frozen verbatim below as pendingFactsBlockLegacy
// (LAYERING law: the old engine stays in the same file, named, so flipping back is one edit).
export function pendingFactsBlock(path = PENDING_FACTS, budget = Infinity) {
  try {
    if (!existsSync(path)) return { present: false, state: "MISSING", text: "", count: 0, shown: 0, hidden: 0, cut: 0, bad: 0 };
    const rows = [];
    let bad = 0;                                    // rows that are DAMAGE, not absence — see the note above
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const s = line.trim();
      if (!s) continue;
      let j = null;
      try { j = JSON.parse(s); } catch { bad++; continue; }        // truncated append / mangled encoding
      if (!j || typeof j !== "object") { bad++; continue; }        // a bare scalar is not a staged fact
      if ((j.status || "pending") !== "pending") continue;         // confirmed or dropped = healthily gone
      if (!j.text) { bad++; continue; }                            // claims pending, carries nothing
      rows.push(j);
    }
    // NOTHING PARSED but something WAS there → the file is unreadable, not empty. ERROR is
    // its own word here precisely so the footer stops saying "healthy" over a rotting queue.
    if (!rows.length) return { present: false, state: bad ? "ERROR" : "EMPTY", text: "", count: 0, shown: 0, hidden: 0, cut: 0, bad, error: !!bad };

    const head = `--- PENDING IDENTITY FACTS — ${rows.length} staged, awaiting HIS word (Law 4: nothing is canon until he says so) ---`;
    const foot = `  → ask him to confirm or drop each; only he promotes it (hippocampus.mjs is the single writer).`;
    const frame = (p, body) => `  · "${body}"   (staged ${String(p.ts || "").slice(0, 10) || "?"})`;
    const mark = (n) => `… (+${n} chars cut — full text via the organism-memory MCP \`get_context\`)`;
    const hiddenLine = (n) => `  · … ${n} older staged fact${n === 1 ? "" : "s"} not shown (budget) — get_context serves the whole queue.`;
    // PARTIAL DAMAGE IS SPOKEN, not swallowed: readable rows still render (a good fact is
    // never held hostage to a broken neighbour), and the broken ones are named right here
    // where he can act on them, because only the owner may touch that file.
    const badLine = (n) => `  · !! ${n} row${n === 1 ? "" : "s"} UNREADABLE (corrupt/truncated JSON) — those staged facts cannot be shown; hippocampus.mjs owns the file.`;

    // Room is spent NEWEST-FIRST, which is exactly the priority slice(-5) already had; what
    // changes is that whatever it cannot afford is NAMED instead of vanishing. The worst-case
    // "not shown" line is reserved up front, so the reserve can only go unspent, never
    // overdrawn — this block must never lie about its own size to the manifest. The damage
    // line is reserved the same way, and only when there IS damage, so a clean queue pays
    // nothing for it.
    let room = budget - head.length - foot.length - hiddenLine(rows.length).length
      - (bad ? badLine(bad).length + 1 : 0) - 2;
    const kept = [];
    let cut = 0, i = rows.length - 1;
    for (; i >= 0; i--) {
      const p = rows[i];
      const full = String(p.text).replace(/\s+/g, " ").trim();
      const cost = frame(p, full).length + 1;
      if (cost <= room) { kept.unshift(frame(p, full)); room -= cost; continue; }
      // It will not fit whole. Clip only as far as the budget FORCES, and say by how much.
      // mark(full.length) is the widest that marker can ever be, so this can never overrun.
      const spare = room - (frame(p, "").length + 1) - mark(full.length).length;
      if (spare > 0) {
        cut += full.length - spare;
        kept.unshift(frame(p, full.slice(0, spare) + mark(full.length - spare)));
        room = 0;
        i--;                                        // this row IS rendered; only older ones are hidden
      }
      break;
    }
    const hidden = i + 1;
    // A budget too small even for head+foot is pathological (it can only come from an absurd
    // ceiling), and the honest answer there is still to speak: the header count and the
    // "not shown" line are the whole point of the block. The manifest's `assembled X/ceiling`
    // reports the true size either way, so an overrun is visible rather than silent.
    return {
      present: true,
      state: "ok",
      count: rows.length,
      shown: kept.length,
      hidden,
      cut,
      bad,
      text: [head, ...kept, ...(hidden ? [hiddenLine(hidden)] : []), ...(bad ? [badLine(bad)] : []), foot].join("\n"),
    };
  } catch { return { present: false, state: "ERROR", text: "", count: 0, shown: 0, hidden: 0, cut: 0, bad: 0, error: true }; }
}

// FROZEN 10 Aug 2026 — the pre-repair renderer, verbatim (LAYERING law, precedents:
// hippocampus.mjs identityCartridgeLegacy · dugout.mjs capsuleProjectionLegacy ·
// fsrs.mjs buildStoreLegacy). Kept because the selftest above measures the new door
// AGAINST it: the assertion that would catch a re-introduced cut is "the legacy loses
// characters on the live queue and the new one does not", and that assertion needs the
// old engine to still be runnable, not merely described in a comment.
function pendingFactsBlockLegacy(path = PENDING_FACTS) {
  try {
    if (!existsSync(path)) return { present: false, state: "MISSING", text: "", count: 0 };
    const rows = [];
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const s = line.trim();
      if (!s) continue;
      try { const j = JSON.parse(s); if (j && j.text && (j.status || "pending") === "pending") rows.push(j); } catch {}
    }
    if (!rows.length) return { present: false, state: "EMPTY", text: "", count: 0 };
    const shown = rows.slice(-5).map((p) =>
      `  · "${String(p.text).replace(/\s+/g, " ").trim().slice(0, 160)}"   (staged ${String(p.ts || "").slice(0, 10) || "?"})`);
    return {
      present: true,
      state: "ok",
      count: rows.length,
      text: `--- PENDING IDENTITY FACTS — ${rows.length} staged, awaiting HIS word (Law 4: nothing is canon until he says so) ---\n`
        + shown.join("\n")
        + `\n  → ask him to confirm or drop each; only he promotes it (hippocampus.mjs is the single writer).`,
    };
  } catch { return { present: false, state: "ERROR", text: "", count: 0, error: true }; }
}

// ── THE ASSEMBLER ────────────────────────────────────────────────────────────
// deps are injectable so the selftest never needs the real disk, the real
// hippocampus, or a network.
export async function assemble(deps = {}) {
  const dir = deps.dir || STATE;
  const now = deps.now || Date.now();
  const ceiling = Number.isFinite(deps.ceiling) ? deps.ceiling : CEILING;
  const spent = [];
  // `state` is the WORD the footer prints: ok · EMPTY · MISSING · ERROR. It defaults from
  // `present` so every existing caller keeps its old meaning, and only the parts that can
  // genuinely be empty-but-healthy pass an explicit one.
  const record = (id, present, bytes, note, state) =>
    spent.push({ id, present, bytes, note: note || null, state: state || (present ? "ok" : "MISSING") });

  const ls = deps.learnstate || await import("./learnstate.mjs");
  const brief = ls.brief;

  // 1. ORIENTATION — the frozen brief with no memory and no card. brief()'s own
  //    selftest pins this as byte-for-byte the pre-31-Jul brief, so it is the one
  //    part whose size we can treat as a fixed floor.
  let base = "";
  try { base = brief(dir, now, null, null); record("orientation", true, base.length); }
  catch (e) { record("orientation", false, 0, "ERROR " + (e && e.message), "ERROR"); }

  // 2. TEACHING CARD — single-sourced from HOW_HE_LEARNS.md via learnstate's parser.
  let card = null;
  try { card = deps.card !== undefined ? deps.card : ls.loadTeachingCard(); }
  catch { card = null; }
  record("card", !!card, card ? card.length : 0, card ? null : "MISSING (marker or file absent)");

  // OVERHEAD IS MEASURED, NOT GUESSED (audit 6 Aug 2026). This was `3 * 90` — a hunch,
  // against his standing rule of 1 Aug: no number goes in by guess. brief() renders its
  // wrapper/label lines only when memory and card are TRUTHY, so a one-character probe
  // of each yields the exact wrapper cost: (probe render − base) − the 2 probe chars.
  // MOVED ABOVE STEP 3 on 10 Aug 2026: both budgets below are derived from it now, and
  // the pending budget is computed first. The probe itself is unchanged.
  let overhead = 3 * 90;                          // fallback only if the probe cannot render
  // THE PROBE'S SILENCE WAS ITS OWN DEFECT (audit 10 Aug 2026). This catch was empty. But the
  // probe IS the truthy path — `brief(dir, now, "X", "Y")` is the same call shape §5 makes with
  // the real memory and card — so a probe that throws is the EARLIEST honest warning that the
  // final render will drop both, and it also silently reinstated the 270-char hunch this very
  // block was written to abolish. Recorded ONLY on failure, so a healthy footer stays
  // byte-identical to every footer printed before today.
  try { const probe = brief(dir, now, "X", "Y"); if (probe && probe.length > base.length) overhead = probe.length - base.length - 2; }
  catch (e) { record("render_probe", false, 0, `truthy-path render threw (${(e && e.message) || e}) — overhead fell back to ${overhead}`, "ERROR"); }

  // 3. PENDING FACTS — computed before memory so its cost is known to the budget.
  // ITS BUDGET IS DERIVED, NOT CHOSEN (audit 10 Aug 2026, the 160-char cut above): it is
  // whatever the ceiling still holds once orientation, the card, memory's own MEMORY_CAP
  // floor and the footer reserve are set aside — every term already a constant in this
  // file, so no threshold is invented and memory's share cannot be eaten by a growing
  // queue. RAN 10 Aug on live state: budget 2,551 against a 1,487-char full render of all
  // 3 staged rows, memory unchanged at 3,856 — nothing is cut today, and the day it is,
  // the block's own "not shown"/"chars cut" lines and this footer both say so.
  const pendBudget = Math.max(0, ceiling - base.length - (card ? card.length : 0)
    - MEMORY_CAP - FOOTER_RESERVE - overhead);
  const pend = deps.pending !== undefined ? deps.pending : pendingFactsBlock(PENDING_FACTS, pendBudget);
  // UNREADABLE ROWS RIDE THE FOOTER (audit 10 Aug 2026). The reader can now tell damage from
  // absence, but a classification nobody prints is the producer-with-no-consumer shape all over
  // again — this footer is the only surface the SessionStart brief actually carries, so the
  // count lands here in both shapes: `ERROR (N rows UNREADABLE — nothing parsed)` when the whole
  // queue is rubble, and `… , N rows UNREADABLE` alongside the staged count when only some is.
  record("pending_facts", !!pend.present, pend.present ? pend.text.length : 0,
    pend.present
      ? `${pend.count} staged`
        + (pend.hidden ? `, ${pend.hidden} NOT SHOWN — budget` : "")
        + (pend.cut ? `, ${pend.cut} chars CUT — budget` : "")
        + (pend.bad ? `, ${pend.bad} rows UNREADABLE` : "")
      : pend.bad ? `${pend.bad} rows UNREADABLE — nothing parsed` : "0 staged",
    pend.state);

  // 4. MEMORY — gets whatever is left, which today is all of it. THE WHOLE POINT:
  //    the cap is computed from the budget rather than being a constant that silently
  //    ate 47% of the cartridge, and if it ever DOES bite, the footer says so.
  const room = ceiling - base.length - (card ? card.length : 0) - (pend.present ? pend.text.length : 0)
    - FOOTER_RESERVE - overhead;
  const memCap = Math.max(0, Math.min(MEMORY_CAP, room));
  let memory = null, memFull = 0, clipped = false;
  try {
    // THE FULL LENGTH IS READ BEFORE THE CUT, NOT AFTER (audit 10 Aug 2026). This
    // module used to call `loadMemory(memCap)` — which does its OWN clip at learnstate.mjs:280
    // and returns the already-shortened string — and then measured memFull off that return
    // value. So memFull WAS the trimmed length, and the footer printed `TRIMMED from N`
    // where N equalled the trimmed size itself: a cut from 1523 to 1523. RAN 10 Aug on live
    // state: true cartridge 3,856 chars, assemble({ceiling:6000}) → `memory 1523 (TRIMMED
    // from 1523 — budget)`. 2,333 characters gone, reported as zero characters gone — the
    // third time this exact silent-loss shape has been found inside this module's own ledger
    // (see the two notes below), and the one place it is least excusable. The live path never
    // hit it in the suite because only the selftest injected deps.memoryFullLength (4157),
    // so every assertion ran green straight over the defect.
    //
    // NO_CAP is not a threshold and not a guess — it is a sentinel derived from loadMemory's
    // own contract: it clips only when `raw.length > n`, so any n no string can exceed means
    // "hand me the cartridge whole". The budget is then spent HERE, by clipTo, which is where
    // learnstate.mjs:270 already says it belongs — "the party which knows the whole budget
    // (context_manifest.mjs) decides the share, and says out loud whenever it had to cut."
    // Output is byte-identical to before; only the reported number becomes true.
    const NO_CAP = Number.MAX_SAFE_INTEGER;
    memory = deps.memory !== undefined ? deps.memory : await ls.loadMemory(NO_CAP);
    // deps.memoryFullLength stays honoured FIRST: a caller injecting deps.memory hands us a
    // string we did not read, so only it can state the pre-cut size.
    memFull = deps.memoryFullLength !== undefined ? deps.memoryFullLength : (memory ? memory.length : 0);
    // TRIMMED IS TRACKED, NOT INFERRED (audit 6 Aug 2026). It used to be computed as
    // `memFull > memory.length` AFTER clipping — but clipTo appends a ~70-char "…
    // (truncated)" tail, so whenever the overflow was smaller than that tail the clipped
    // string came out LONGER than the original and the comparison read false. Real loss,
    // reported as no loss: the exact silent-drop this module exists to abolish, reproduced
    // inside its own accounting. The flag is now set where the cut happens.
    if (memory && memory.length > memCap) { memory = clipTo(memory, memCap); clipped = true; }
  } catch { memory = null; }
  const trimmed = clipped || !!(memory && memFull > memory.length);
  record("memory", !!memory, memory ? memory.length : 0,
    !memory ? "MISSING (hippocampus unreadable)" : trimmed ? `TRIMMED from ${memFull} — budget` : null);

  // 5. RENDER. brief() places memory and card in their canonical slots (above LAWS);
  //    this module never re-orders them, it only decides how much they get.
  //
  // THE LEDGER IS RECONCILED AGAINST THE TEXT THAT ACTUALLY SHIPPED (audit 10 Aug 2026).
  // Every row above was recorded BEFORE this render and nothing ever checked them against
  // it. So the fallback below — `catch { text = base }`, and `base` is by definition the
  // render with NO memory and NO card — dropped both legs while the footer, computed from
  // those stale rows, certified both as delivered. RAN 10 Aug with a stub brief() that
  // throws only on the truthy path (which is precisely how this fails in life: a bug in
  // the memory or card block cannot show up in the `base` probe, because that probe passes
  // nulls): text contained neither leg, footer read
  //   `orientation 13 · card 99 · pending_facts EMPTY (0 staged) · memory 3856 · assembled 13/12000`
  // — the manifest's one job, inverted, at the single moment it matters most.
  //
  // The fallback itself is UNCHANGED — a brief must never be the thing that breaks
  // SessionStart (learnstate.mjs:498, same law). What changes is that the ledger stops
  // being an assumption and becomes an observation: brief() splices both legs VERBATIM
  // (learnstate.mjs:505 `L.push(memory)`, :510 `L.push(card)`, joined on "\n"), so
  // "is it in the delivered string?" is an exact, cheap test — not a heuristic. That also
  // catches the wider class, not just the throw: any future brief() that silently ignores
  // an argument now reads DROPPED instead of being billed as sent.
  let text, renderErr = null;
  try { text = brief(dir, now, memory, card); }
  catch (e) { text = base; renderErr = (e && e.message) || String(e); }
  const reconcile = (id, part) => {
    if (!part || (typeof text === "string" && text.includes(part))) return;
    const row = spent.find((s) => s.id === id);
    if (!row) return;
    row.present = false; row.bytes = 0; row.state = "DROPPED";
    row.note = renderErr
      ? `render threw (${renderErr}) — fell back to orientation-only`
      : "not present in the rendered brief";
  };
  reconcile("memory", memory);
  reconcile("card", card);
  if (pend.present) text += "\n" + pend.text;

  const total = text.length + FOOTER_RESERVE;
  const footer = `[context manifest: ${spent.map((s) =>
    `${s.id} ${s.state === "ok" ? s.bytes : s.state}${s.note ? ` (${s.note})` : ""}`).join(" · ")}`
    + ` · assembled ${text.length}/${ceiling}]`;
  return { text: text + "\n" + footer, manifest: spent, bytes: text.length, ceiling, total, footer };
}

// ── SELFTEST ─────────────────────────────────────────────────────────────────
function selftest() {
  let pass = 0, fail = 0;
  const assert = (n, c) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; console.log(`  FAIL ${n}`); } };

  // A stub learnstate: brief() places memory/card exactly where the real one does, so
  // the ordering invariants below are asserted against the real CONTRACT, not the real disk.
  const stub = {
    brief: (d, n, mem, card) => ["KICKOFF", mem ? "HIS MEMORY\n" + mem : "", card ? "HOW TO TEACH HIM\n" + card : "", "LAWS:"].filter(Boolean).join("\n"),
    loadTeachingCard: () => "1. one idea",
    loadMemory: async (cap) => "M".repeat(Math.min(4157, cap)),
  };
  const run = (over = {}) => assemble({ learnstate: stub, pending: { present: false, text: "", count: 0 }, memoryFullLength: 4157, ...over });

  return (async () => {
    const r = await run();
    assert("ASSEMBLES — orientation, card and memory all land in one text",
      r.text.includes("KICKOFF") && r.text.includes("HIS MEMORY") && r.text.includes("HOW TO TEACH HIM"));
    assert("THE 47% BUG IS CLOSED — the full 4,157-char cartridge now fits inside the ceiling",
      r.manifest.find((m) => m.id === "memory").bytes === 4157);
    assert("CANONICAL ORDER — memory and card still sit ABOVE the LAWS line",
      r.text.indexOf("HIS MEMORY") < r.text.indexOf("LAWS:") && r.text.indexOf("HOW TO TEACH HIM") < r.text.indexOf("LAWS:"));
    assert("FOOTER — every provider is named with its byte count and the total against the ceiling",
      /context manifest:/.test(r.footer) && /memory 4157/.test(r.footer) && /card 11/.test(r.footer)
      && new RegExp(`assembled \\d+/${CEILING}`).test(r.footer));
    const tight = await assemble({ learnstate: stub, pending: { present: false, text: "", count: 0 }, memoryFullLength: 4157, ceiling: 900 });
    const tm = tight.manifest.find((m) => m.id === "memory");
    assert("SQUEEZE — under a 900-char ceiling memory is cut, and the cut is NAMED, never silent",
      tm.bytes < 4157 && /TRIMMED from 4157/.test(tm.note || ""));
    assert("SQUEEZE — orientation survives the squeeze intact (it is the floor)",
      tight.text.includes("KICKOFF") && tight.manifest.find((m) => m.id === "orientation").present === true);

    const noMem = await assemble({ learnstate: stub, memory: null, pending: { present: false, text: "", count: 0 } });
    assert("A MISSING LEG IS NAMED, never silently absent",
      /memory MISSING/.test(noMem.footer) && !noMem.text.includes("HIS MEMORY"));
    const noCard = await assemble({ learnstate: stub, card: null, pending: { present: false, text: "", count: 0 }, memoryFullLength: 4157 });
    assert("A MISSING CARD is named too, and the rest of the brief still renders",
      /card MISSING/.test(noCard.footer) && noCard.text.includes("KICKOFF"));

    const withPend = await assemble({ learnstate: stub, memoryFullLength: 4157,
      pending: { present: true, count: 2, text: "--- PENDING IDENTITY FACTS — 2 staged ---\n  · \"x\"" } });
    assert("PENDING FACTS REACH THE SESSION — the queue that only get_context used to show",
      withPend.text.includes("PENDING IDENTITY FACTS") && /pending_facts \d+ \(2 staged\)/.test(withPend.footer));
    assert("…and zero staged facts render NOTHING (a queue that is empty must stay quiet)",
      !(await run()).text.includes("PENDING IDENTITY FACTS"));
    // THE THREE STATES ARE THREE FACTS — the law this module states in its own header,
    // now held at the door instead of collapsed into one word.
    const empt = await assemble({ learnstate: stub, memoryFullLength: 4157, pending: { present: false, state: "EMPTY", text: "", count: 0 } });
    assert("EMPTY ≠ MISSING — a healthy queue with nothing in it reads EMPTY, not MISSING",
      /pending_facts EMPTY \(0 staged\)/.test(empt.footer));
    const gone = await assemble({ learnstate: stub, memoryFullLength: 4157, pending: { present: false, state: "MISSING", text: "", count: 0 } });
    assert("MISSING ≠ EMPTY — a file that is genuinely absent still reads MISSING",
      /pending_facts MISSING/.test(gone.footer));
    const err = await assemble({ learnstate: stub, memoryFullLength: 4157, pending: { present: false, state: "ERROR", text: "", count: 0, error: true } });
    assert("ERROR is its own word — an unreadable queue never hides behind 'empty'",
      /pending_facts ERROR/.test(err.footer));
    assert("the LIVE pending reader reports one of the three states, never a bare boolean",
      ["ok", "EMPTY", "MISSING", "ERROR"].includes(pendingFactsBlock().state));
    // THE CLIP-TAIL TRAP: overflow smaller than clipTo's ~70-char tail used to make the
    // clipped string LONGER than the original, so `trimmed` read false on a real cut.
    const tail = await assemble({ learnstate: { ...stub, loadMemory: async () => "M".repeat(4157) },
      pending: { present: false, text: "", count: 0 }, memoryFullLength: 4157, ceiling: 900 });
    assert("A CUT IS ALWAYS NAMED — even when the truncation notice is longer than the overflow",
      /TRIMMED from 4157/.test(tail.manifest.find((m) => m.id === "memory").note || ""));

    // THE FULL LENGTH IS READ BEFORE THE CUT (audit 10 Aug 2026). Every assertion above
    // injects deps.memoryFullLength — which is exactly why the suite ran green for weeks
    // over a live path that measured the cartridge AFTER learnstate had already trimmed it.
    // These two inject NOTHING and use a loadMemory that behaves like the real one
    // (learnstate.mjs:273-282): it clips at the cap it is GIVEN and appends its own tail,
    // so its return value can never reveal the pre-cut size. If the live call ever goes
    // back to handing loadMemory a budget, `TRIMMED from N` collapses to the trimmed
    // length again and both of these fail.
    const REAL_TAIL = "\n… (truncated — full recall via the organism-memory MCP `get_context`)";
    const CARTRIDGE = 9000;   // > MEMORY_CAP, so the cut is forced no matter what the ceiling leaves
    const realish = { ...stub,
      loadMemory: async (cap) => { const raw = "M".repeat(CARTRIDGE); return raw.length > cap ? raw.slice(0, cap) + REAL_TAIL : raw; } };
    const live = await assemble({ learnstate: realish, pending: { present: false, text: "", count: 0 }, ceiling: 3000 });
    const lm = live.manifest.find((m) => m.id === "memory");
    assert("TRIMMED NAMES THE PRE-CUT SIZE — the live path measures the cartridge WHOLE, never its own trimmed return",
      /TRIMMED from 9000 —/.test(lm.note || "") && lm.bytes < CARTRIDGE);
    assert("NO CUT IS EVER REPORTED AS A CUT FROM ITSELF — `TRIMMED from N` with N = the trimmed size is the tautology this killed",
      Number((/TRIMMED from (\d+)/.exec(lm.note || "") || [])[1]) > lm.bytes);

    const broken = await assemble({ learnstate: { ...stub, loadMemory: async () => { throw new Error("boom"); } },
      pending: { present: false, text: "", count: 0 } });
    assert("REPAIR TOWARD SILENCE — a provider that THROWS never breaks the brief",
      broken.text.includes("KICKOFF") && /memory MISSING/.test(broken.footer));
    assert("REPAIR TOWARD SILENCE — a broken orientation still yields a string, never a crash",
      typeof (await assemble({ learnstate: { ...stub, brief: () => { throw new Error("x"); } },
        pending: { present: false, text: "", count: 0 } })).text === "string");

    // ── THE LEDGER MUST MATCH THE TEXT (audit 10 Aug 2026) ───────────────────
    // Every assertion above this line reads the footer while the render SUCCEEDED, so not
    // one of them could see the fallback at §5 lie. These do. The stub below is the shape
    // this fails in life: `base` renders fine (it is called with nulls) and only the truthy
    // path throws, so the bug is invisible to every earlier probe.
    const truthyThrows = { ...stub,
      brief: (d, n, mem, card) => { if (mem || card) throw new Error("truthy path blew up"); return "KICKOFF\nLAWS:"; } };
    const dropped = await assemble({ learnstate: truthyThrows, memoryFullLength: 4157,
      pending: { present: false, state: "EMPTY", text: "", count: 0 } });
    assert("A DROPPED LEG IS NEVER BILLED AS DELIVERED — when the render falls back to orientation-only, the footer says DROPPED, not a byte count",
      !dropped.text.includes("HIS MEMORY") && !dropped.text.includes("HOW TO TEACH HIM")
      && /memory DROPPED \(render threw/.test(dropped.footer) && /card DROPPED \(render threw/.test(dropped.footer)
      && dropped.manifest.find((m) => m.id === "memory").bytes === 0
      && dropped.manifest.find((m) => m.id === "card").bytes === 0);
    assert("…and the fallback still yields the orientation brief — a lying footer is fixed by telling the truth, never by breaking SessionStart",
      dropped.text.includes("KICKOFF"));
    assert("THE PROBE'S FAILURE IS SPOKEN — the truthy-path probe is the earliest warning of exactly this, and its catch is no longer empty",
      /render_probe ERROR \(truthy-path render threw/.test(dropped.footer));
    // The wider class, no throw involved: a brief() that simply ignores an argument.
    const eatsCard = await assemble({ learnstate: { ...stub, brief: (d, n, mem) => stub.brief(d, n, mem, null) },
      memoryFullLength: 4157, pending: { present: false, state: "EMPTY", text: "", count: 0 } });
    assert("A SILENTLY IGNORED LEG READS DROPPED TOO — the ledger is an observation of the delivered text, not an assumption about it",
      /card DROPPED \(not present in the rendered brief\)/.test(eatsCard.footer)
      && /memory 4157/.test(eatsCard.footer) && eatsCard.text.includes("HIS MEMORY"));
    assert("NO FALSE POSITIVES — a healthy assembly never says DROPPED or render_probe",
      !/DROPPED/.test(r.footer) && !/render_probe/.test(r.footer));

    // the real reader, against the real file
    const pf = pendingFactsBlock(join(HERE, "__no_such_file__.jsonl"));
    assert("PENDING READER — a missing file is 0 staged, never a throw", pf.present === false && pf.count === 0);
    assert("PENDING READER — the LIVE file parses (or is honestly absent)",
      typeof pendingFactsBlock().count === "number");

    // ── THE 160-CHAR DOOR (audit 10 Aug 2026) ────────────────────────────────
    // The wire that broke: the block cut every staged fact at 160 chars and showed only
    // the newest 5, while the header printed the full count. These four run against a
    // FIXTURE that reproduces the live queue's shape — 7 rows at the owner's own 400-char
    // staging clip — plus the live file itself, and each fails the moment a cut returns.
    const fx = join(tmpdir(), `arsenal_pending_fixture_${process.pid}.jsonl`);
    const FULL = "R".repeat(399) + "!";                       // 400 = the staging clip, mcp-memory.mjs:302
    writeFileSync(fx, Array.from({ length: 7 }, (_, k) =>
      JSON.stringify({ ts: `2026-08-0${k + 1}T00:00:00.000Z`, text: `F${k}` + FULL.slice(2), status: "pending", source: "mcp" })).join("\n") + "\n", "utf8");
    try {
      const wide = pendingFactsBlock(fx, 20_000);
      assert("NO PER-ROW CUT — a 400-char staged fact reaches him WHOLE (the 160 is gone)",
        wide.text.includes(`F0${FULL.slice(2)}`) && wide.cut === 0);
      assert("EVERY STAGED ROW REACHES HIM — 7 staged, 7 rendered (slice(-5) is gone)",
        wide.shown === 7 && wide.hidden === 0 && wide.count === 7);
      const old = pendingFactsBlockLegacy(fx);
      assert("MEASURED AGAINST THE FROZEN ENGINE — the legacy door loses what this one keeps",
        old.text.length < wide.text.length && !old.text.includes(`F0${FULL.slice(2)}`));
      const squeezed = pendingFactsBlock(fx, 1_000);
      assert("A SQUEEZE IS NAMED, NEVER SILENT — hidden rows and cut chars both self-report",
        squeezed.count === 7 && (squeezed.hidden > 0 || squeezed.cut > 0)
        && (squeezed.hidden ? /not shown \(budget\)/.test(squeezed.text) : true)
        && (squeezed.cut ? /chars cut/.test(squeezed.text) : true));
    } finally { try { unlinkSync(fx); } catch {} }

    // ── A CORRUPT QUEUE IS NOT AN EMPTY QUEUE (audit 10 Aug 2026) ─────────────
    // The wire that broke: the per-line `catch {}` swallowed every parse failure, so a file
    // of nothing but rubble produced zero rows and returned state EMPTY — the word reserved
    // for a healthy queue with nothing in it. Every assertion above ran green over it, because
    // every one of them fed the reader well-formed rows. These four feed it damage. The first
    // is the one that would have caught it on day one; the third measures the new door against
    // the FROZEN legacy, which still swallows, so it can only pass while the two differ.
    const cx = join(tmpdir(), `arsenal_pending_corrupt_${process.pid}.jsonl`);
    writeFileSync(cx, ['{"ts":"2026-08-10T00:00:00.000Z","text":"his ruling","stat',   // truncated append
                       "not json at all",
                       '"a bare string"'].join("\n") + "\n", "utf8");
    const mx = join(tmpdir(), `arsenal_pending_mixed_${process.pid}.jsonl`);
    writeFileSync(mx, [JSON.stringify({ ts: "2026-08-09T00:00:00.000Z", text: "readable ruling A", status: "pending" }),
                       '{"ts":"2026-08-10T00:00:00.000Z","text":"half-written rul',
                       JSON.stringify({ ts: "2026-08-10T01:00:00.000Z", text: "readable ruling B", status: "pending" }),
                       JSON.stringify({ ts: "2026-08-08T00:00:00.000Z", text: "already answered", status: "confirmed" })].join("\n") + "\n", "utf8");
    try {
      const rubble = pendingFactsBlock(cx, 20_000);
      assert("A CORRUPT QUEUE READS ERROR, NEVER EMPTY — rows that will not parse are damage, not absence",
        rubble.state === "ERROR" && rubble.bad === 3 && rubble.count === 0 && rubble.error === true);
      // NO FALSE ALARM: a file of blank lines, and a file whose every row was already
      // answered, are both HEALTHY-and-empty. If those started reading ERROR the fix would
      // have traded a silent lie for a noisy one.
      writeFileSync(cx + ".empty", "\n\n", "utf8");
      writeFileSync(cx + ".done", JSON.stringify({ ts: "2026-08-08T00:00:00.000Z", text: "answered", status: "confirmed" }) + "\n", "utf8");
      assert("…and a genuinely empty queue still reads EMPTY — the fix must not turn every quiet queue into an alarm",
        pendingFactsBlock(cx + ".empty").state === "EMPTY" && pendingFactsBlock(cx + ".empty").bad === 0
        && pendingFactsBlock(cx + ".done").state === "EMPTY" && pendingFactsBlock(cx + ".done").bad === 0
        && pendingFactsBlock(join(tmpdir(), `arsenal_pending_none_${process.pid}.jsonl`)).state === "MISSING");
      const legacyRubble = pendingFactsBlockLegacy(cx);
      assert("MEASURED AGAINST THE FROZEN ENGINE — the legacy door still calls the same rubble 'EMPTY'",
        legacyRubble.state === "EMPTY" && legacyRubble.state !== rubble.state);
      const mixed = pendingFactsBlock(mx, 20_000);
      assert("PARTIAL DAMAGE — readable facts still render, the unreadable one is NAMED, and a confirmed row is not miscounted as broken",
        mixed.state === "ok" && mixed.count === 2 && mixed.bad === 1
        && mixed.text.includes("readable ruling A") && mixed.text.includes("readable ruling B")
        && /1 row UNREADABLE/.test(mixed.text));
      const corruptOut = await assemble({ learnstate: stub, memoryFullLength: 4157, pending: rubble });
      const mixedOut = await assemble({ learnstate: stub, memoryFullLength: 4157, pending: mixed });
      assert("THE DAMAGE REACHES THE SESSION — the footer carries the unreadable count in both shapes, not just the return value",
        /pending_facts ERROR \(3 rows UNREADABLE — nothing parsed\)/.test(corruptOut.footer)
        && /pending_facts \d+ \(2 staged, 1 rows UNREADABLE\)/.test(mixedOut.footer));
    } finally { for (const p of [cx, cx + ".empty", cx + ".done", mx]) { try { unlinkSync(p); } catch {} } }

    // THE LIVE WIRE: whatever is staged on disk right now must arrive uncut through the
    // real assembler. This is the assertion that would have caught the defect on day one.
    const livePend = pendingFactsBlock();
    const liveOut = await assemble({});
    assert("THE LIVE QUEUE ARRIVES UNCUT — every staged fact's full text is in the real brief",
      livePend.state !== "ok"
      || (livePend.cut === 0 && livePend.hidden === 0
        && readFileSync(PENDING_FACTS, "utf8").split(/\r?\n/).filter((l) => l.trim())
          .map((l) => { try { return JSON.parse(l); } catch { return null; } })
          .filter((j) => j && j.text && (j.status || "pending") === "pending")
          .every((j) => liveOut.text.includes(String(j.text).replace(/\s+/g, " ").trim()))));

    console.log(`\ncontext_manifest selftest: ${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  })();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = (process.argv[2] || "show").toLowerCase();
  if (mode === "selftest") selftest();
  else assemble().then((r) => console.log(mode === "footer" ? r.footer : r.text));
}
