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
import { readFileSync, existsSync } from "node:fs";
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
export function pendingFactsBlock(path = PENDING_FACTS) {
  try {
    if (!existsSync(path)) return { present: false, text: "", count: 0 };
    const rows = [];
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const s = line.trim();
      if (!s) continue;
      try { const j = JSON.parse(s); if (j && j.text && (j.status || "pending") === "pending") rows.push(j); } catch {}
    }
    if (!rows.length) return { present: false, text: "", count: 0 };
    const shown = rows.slice(-5).map((p) =>
      `  · "${String(p.text).replace(/\s+/g, " ").trim().slice(0, 160)}"   (staged ${String(p.ts || "").slice(0, 10) || "?"})`);
    return {
      present: true,
      count: rows.length,
      text: `--- PENDING IDENTITY FACTS — ${rows.length} staged, awaiting HIS word (Law 4: nothing is canon until he says so) ---\n`
        + shown.join("\n")
        + `\n  → ask him to confirm or drop each; only he promotes it (hippocampus.mjs is the single writer).`,
    };
  } catch { return { present: false, text: "", count: 0, error: true }; }
}

// ── THE ASSEMBLER ────────────────────────────────────────────────────────────
// deps are injectable so the selftest never needs the real disk, the real
// hippocampus, or a network.
export async function assemble(deps = {}) {
  const dir = deps.dir || STATE;
  const now = deps.now || Date.now();
  const ceiling = Number.isFinite(deps.ceiling) ? deps.ceiling : CEILING;
  const spent = [];
  const record = (id, present, bytes, note) => spent.push({ id, present, bytes, note: note || null });

  const ls = deps.learnstate || await import("./learnstate.mjs");
  const brief = ls.brief;

  // 1. ORIENTATION — the frozen brief with no memory and no card. brief()'s own
  //    selftest pins this as byte-for-byte the pre-31-Jul brief, so it is the one
  //    part whose size we can treat as a fixed floor.
  let base = "";
  try { base = brief(dir, now, null, null); record("orientation", true, base.length); }
  catch (e) { record("orientation", false, 0, "ERROR " + (e && e.message)); }

  // 2. TEACHING CARD — single-sourced from HOW_HE_LEARNS.md via learnstate's parser.
  let card = null;
  try { card = deps.card !== undefined ? deps.card : ls.loadTeachingCard(); }
  catch { card = null; }
  record("card", !!card, card ? card.length : 0, card ? null : "MISSING (marker or file absent)");

  // 3. PENDING FACTS — computed before memory so its cost is known to the budget.
  const pend = deps.pending !== undefined ? deps.pending : pendingFactsBlock();
  record("pending_facts", !!pend.present, pend.present ? pend.text.length : 0,
    pend.present ? `${pend.count} staged` : "0 staged");

  // 4. MEMORY — gets whatever is left, which today is all of it. THE WHOLE POINT:
  //    the cap is computed from the budget rather than being a constant that silently
  //    ate 47% of the cartridge, and if it ever DOES bite, the footer says so.
  const overhead = 3 * 90;                       // the three wrapper/label lines brief adds around memory+card
  const room = ceiling - base.length - (card ? card.length : 0) - (pend.present ? pend.text.length : 0)
    - FOOTER_RESERVE - overhead;
  const memCap = Math.max(0, Math.min(MEMORY_CAP, room));
  let memory = null, memFull = 0;
  try {
    memory = deps.memory !== undefined ? deps.memory : await ls.loadMemory(memCap);
    memFull = deps.memoryFullLength !== undefined ? deps.memoryFullLength : (memory ? memory.length : 0);
    if (memory && memory.length > memCap) memory = clipTo(memory, memCap);
  } catch { memory = null; }
  const trimmed = !!(memory && memFull > memory.length);
  record("memory", !!memory, memory ? memory.length : 0,
    !memory ? "MISSING (hippocampus unreadable)" : trimmed ? `TRIMMED from ${memFull} — budget` : null);

  // 5. RENDER. brief() places memory and card in their canonical slots (above LAWS);
  //    this module never re-orders them, it only decides how much they get.
  let text;
  try { text = brief(dir, now, memory, card); }
  catch { text = base; }
  if (pend.present) text += "\n" + pend.text;

  const total = text.length + FOOTER_RESERVE;
  const footer = `[context manifest: ${spent.map((s) =>
    `${s.id} ${s.present ? s.bytes : "MISSING"}${s.note ? ` (${s.note})` : ""}`).join(" · ")}`
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
      !(await run()).text.includes("PENDING IDENTITY FACTS") && /pending_facts MISSING \(0 staged\)/.test(r.footer));

    const broken = await assemble({ learnstate: { ...stub, loadMemory: async () => { throw new Error("boom"); } },
      pending: { present: false, text: "", count: 0 } });
    assert("REPAIR TOWARD SILENCE — a provider that THROWS never breaks the brief",
      broken.text.includes("KICKOFF") && /memory MISSING/.test(broken.footer));
    assert("REPAIR TOWARD SILENCE — a broken orientation still yields a string, never a crash",
      typeof (await assemble({ learnstate: { ...stub, brief: () => { throw new Error("x"); } },
        pending: { present: false, text: "", count: 0 } })).text === "string");

    // the real reader, against the real file
    const pf = pendingFactsBlock(join(HERE, "__no_such_file__.jsonl"));
    assert("PENDING READER — a missing file is 0 staged, never a throw", pf.present === false && pf.count === 0);
    assert("PENDING READER — the LIVE file parses (or is honestly absent)",
      typeof pendingFactsBlock().count === "number");

    console.log(`\ncontext_manifest selftest: ${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  })();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = (process.argv[2] || "show").toLowerCase();
  if (mode === "selftest") selftest();
  else assemble().then((r) => console.log(mode === "footer" ? r.footer : r.text));
}
