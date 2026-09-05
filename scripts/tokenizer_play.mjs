#!/usr/bin/env node
// scripts/tokenizer_play.mjs — THE TOKENIZER PLAYGROUND for axis d (math · value RANGE · high/low ka matlab)
// Row 68 (f), 6 Sep 2026 — plan v3 §12 "tokenizer-JS playground for axis d", built on his order
// "implement everything and merge it". READ-ONLY, model-free, state-free: it writes nothing anywhere
// (TIER 0 by construction; no state file, no owner, nothing for xray to see).
//
// WHAT IT IS FOR. The pen stays in HIS hand (HOW_HE_LEARNS #4: run every example by hand). He runs
// the factory on his own line — counts the neighbouring pairs, picks the merge, writes the rule —
// and this tool is the ANSWER KEY he checks against, never the thing that does the step for him.
// Every number it prints is one he can re-derive on paper in under a minute.
//
// THE TOY FACTORY (BPE — byte-pair encoding, plan v3 §3's worked example):
//   1. register = single characters; a chunk that follows a space carries a "␣" first (the way real
//      tokenizers mark a word boundary — SentencePiece's ▁, GPT-2's Ġ — so merges never cross words).
//   2. count every NEIGHBOURING pair across the whole text (the corpus).
//   3. glue the most frequent ONE pair (tie → the pair seen first) and write the rule "a + b → ab".
//   4. back to 2, until the merge count you asked for is reached, or no pair repeats.
//   The frozen rulebook is applied in the SAME order at runtime, so the same text = the same tokens.
//
// VERBS (text is one quoted argument):
//   bytes "<text>"                      har character ke UTF-8 bytes (₹ = 3 bytes; a byte-level tokenizer sees bytes, not letters)
//   pairs "<text>" [--rules "E+c,Ec+o"]  rules lagane ke baad: token list · register size · padosi-jodi ki ginti (top 12)
//   merge "<text>" --rules "E+c,Ec+o"   sirf token list aur count (rules isi order mein — factory ka frozen rulebook)
//   train "<text>" --merges N           factory ko N merges chalao: har step pe kaun si jodi chuni aur kyun; rulebook print
//   ids   "<text>" [--rules "..."]      register order mein IDs — number ke andar MEANING nahi hota, sirf register mein jagah
//   dial  "<text>" --merges 0,5,20      vocab-size dial: kam/zyada merges par token count · register size · chars-per-token (axis d ka RANGE)
//   selftest
import { fileURLToPath, pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";   // used by the SELFTEST only, to read this file's own source; the module body never touches the disk

const SPACE = "␣";

// ── PURE CORE ────────────────────────────────────────────────────────────────
/** Split into chunks by whitespace; every chunk after the first starts with the boundary mark. */
export function toBase(text) {
  const words = String(text ?? "").split(/\s+/).filter(Boolean);
  return words.map((w, i) => (i === 0 ? [] : [SPACE]).concat(Array.from(w)));
}

/** UTF-8 byte count per character — the number a byte-level tokenizer actually sees. */
export function bytesOf(text) {
  return Array.from(String(text ?? "")).map((ch) => ({ ch, bytes: Buffer.byteLength(ch, "utf8") }));
}

/** Count neighbouring pairs across all chunks; ties keep first-seen order (the factory's fixed rule). */
export function pairCounts(chunks) {
  const counts = new Map();
  for (const ch of chunks) for (let i = 0; i + 1 < ch.length; i++) {
    const k = ch[i] + "" + ch[i + 1];
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  return [...counts.entries()].map(([k, n], order) => { const [a, b] = k.split(""); return { a, b, n, order }; })
    .sort((x, y) => y.n - x.n || x.order - y.order);
}

/** Apply ONE merge rule left-to-right inside every chunk (non-overlapping, like the real thing). */
export function applyRule(chunks, [a, b]) {
  return chunks.map((ch) => {
    const out = [];
    for (let i = 0; i < ch.length; i++) {
      if (i + 1 < ch.length && ch[i] === a && ch[i + 1] === b) { out.push(a + b); i++; } else out.push(ch[i]);
    }
    return out;
  });
}

export function applyRules(chunks, rules) { return rules.reduce((c, r) => applyRule(c, r), chunks); }

/** Parse "E+c,Ec+o" → [["E","c"],["Ec","o"]]. A rule needs exactly one "+"; "␣+E" is legal. */
export function parseRules(s) {
  return String(s ?? "").split(",").map((r) => r.trim()).filter(Boolean).map((r) => {
    const i = r.indexOf("+");
    if (i <= 0 || i === r.length - 1) throw new Error(`rule "${r}" is not a+b`);
    return [r.slice(0, i), r.slice(i + 1)];
  });
}

/** Run the factory for up to N merges; stop early (and say why) when no pair repeats. */
export function train(text, merges) {
  let chunks = toBase(text);
  const rules = [], log = [];
  const base = registerOf(chunks, []).length;
  let stopped = null;
  for (let step = 1; step <= merges; step++) {
    const top = pairCounts(chunks)[0];
    if (!top || top.n < 2) { stopped = `koi jodi 2 baar nahi aati — factory ke paas glue karne ko kuch nahi bacha (${step - 1} merge${step - 1 === 1 ? "" : "s"} hue)`; break; }
    const rule = [top.a, top.b];
    chunks = applyRule(chunks, rule);
    rules.push(rule);
    log.push({ step, pair: rule, count: top.n, register_size: base + rules.length, tokens: flat(chunks).length });
  }
  return { rules, chunks, tokens: flat(chunks), log, base, stopped };
}

/** Register order: base characters by first appearance, then merged tokens in rule order. */
export function registerOf(chunks, rules) {
  const reg = [];
  for (const ch of toBaseFromChunks(chunks)) for (const t of ch) if (!reg.includes(t)) reg.push(t);
  for (const [a, b] of rules) if (!reg.includes(a + b)) reg.push(a + b);
  return reg;
}
const toBaseFromChunks = (chunks) => chunks.map((ch) => Array.from(ch.join("")));

export function idsOf(text, rules) {
  const base = toBase(text);
  const chunks = applyRules(base, rules);
  const reg = registerOf(base, rules);
  const tokens = flat(chunks);
  return { tokens, ids: tokens.map((t) => reg.indexOf(t)), register: reg };
}

export function dial(text, mergeList) {
  const chars = Array.from(String(text ?? "").replace(/\s+/g, "")).length;
  return mergeList.map((m) => {
    const t = train(text, m);
    return { merges: m, rules_used: t.rules.length, tokens: t.tokens.length, register_size: t.base + t.rules.length, chars_per_token: t.tokens.length ? Math.round((chars / t.tokens.length) * 100) / 100 : null };
  });
}

const flat = (chunks) => chunks.flat();

// ── PRINTERS (Hinglish, "tum", plain words — what he reads) ──────────────────
const show = (tokens) => tokens.map((t) => `[${t}]`).join(" ");
function printPairs(chunks, rules = [], top = 12) {
  const pc = pairCounts(chunks);
  console.log(`  tokens (${flat(chunks).length}): ${show(flat(chunks))}`);
  console.log(`  register size (alag-alag tukde, base + merges): ${registerOf(chunks, rules).length}`);
  if (!pc.length) { console.log("  padosi jodi: koi nahi (har chunk ek tukde ka hai)"); return; }
  console.log(`  padosi jodiyan (sabse zyada pehle · barabar ho to jo pehle mili):`);
  for (const p of pc.slice(0, top)) console.log(`    ${String(`[${p.a}] + [${p.b}]`).padEnd(22)} ${String(p.n).padStart(3)}×${p.n >= 2 ? "" : "   (ek baar — glue nahi hoga)"}`);
  if (pc.length > top) console.log(`    … ${pc.length - top} aur`);
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const argOf = (flag, argv) => { const i = argv.indexOf(flag); return i > 0 && argv[i + 1] != null ? String(argv[i + 1]) : null; };
function usage() {
  console.error('usage: tokenizer_play.mjs bytes "<text>" | pairs "<text>" [--rules "a+b,..."] | merge "<text>" --rules "a+b,..." | train "<text>" --merges N | ids "<text>" [--rules "..."] | dial "<text>" --merges 0,5,20 | selftest');
  process.exit(2);
}
function main(argv = process.argv) {
  const verb = argv[2];
  const text = argv[3] && !String(argv[3]).startsWith("--") ? String(argv[3]) : null;
  if (verb === "selftest") return selftest();
  if (!verb || !text) usage();
  if (verb === "bytes") {
    const rows = bytesOf(text);
    console.log(`  ${rows.length} character(s) · ${rows.reduce((n, r) => n + r.bytes, 0)} byte(s) — jo character 1 se zyada byte leta hai, byte-level tokenizer use utne hi tukdon mein dekhta hai:`);
    for (const r of rows) console.log(`    ${JSON.stringify(r.ch).padEnd(8)} ${r.bytes} byte${r.bytes === 1 ? "" : "s"}${r.bytes > 1 ? "  ←" : ""}`);
    return;
  }
  if (verb === "pairs" || verb === "merge") {
    const rules = parseRules(argOf("--rules", argv) || "");
    if (verb === "merge" && !rules.length) usage();
    const chunks = applyRules(toBase(text), rules);
    if (rules.length) console.log(`  rulebook (isi order mein): ${rules.map(([a, b]) => `${a}+${b}→${a + b}`).join(" · ")}`);
    if (verb === "merge") { console.log(`  tokens (${flat(chunks).length}): ${show(flat(chunks))}`); return; }
    printPairs(chunks, rules);
    return;
  }
  if (verb === "train") {
    const n = Number(argOf("--merges", argv));
    if (!Number.isInteger(n) || n < 0) usage();
    const t = train(text, n);
    console.log(`  shuru: ${show(flat(toBase(text)))}  (${flat(toBase(text)).length} tukde · register ${t.base})`);
    for (const l of t.log) console.log(`  merge ${l.step}: [${l.pair[0]}] + [${l.pair[1]}] → [${l.pair.join("")}]   (${l.count}× — sabse zyada) · register ${l.register_size} · tokens ${l.tokens}`);
    if (t.stopped) console.log(`  ruk gaya: ${t.stopped}`);
    console.log(`  rulebook FROZEN: ${t.rules.length ? t.rules.map(([a, b]) => `${a}+${b}`).join(", ") : "(khaali)"}`);
    console.log(`  ant: ${show(t.tokens)}  (${t.tokens.length} tukde)`);
    return;
  }
  if (verb === "ids") {
    const r = idsOf(text, parseRules(argOf("--rules", argv) || ""));
    console.log(`  register (id = jagah): ${r.register.map((t, i) => `${i}:[${t}]`).join(" ")}`);
    console.log(`  tokens: ${show(r.tokens)}`);
    console.log(`  ids:    [${r.ids.join(", ")}]   ← same tukda = same number, har jagah; number ke ANDAR meaning nahi — meaning agle stage (embedding) mein milti hai`);
    return;
  }
  if (verb === "dial") {
    const list = String(argOf("--merges", argv) || "").split(",").map((x) => Number(x.trim())).filter((x) => Number.isInteger(x) && x >= 0);
    if (!list.length) usage();
    console.log(`  ${"merges".padEnd(8)} ${"rules".padEnd(6)} ${"tokens".padEnd(7)} ${"register".padEnd(9)} chars/token`);
    for (const d of dial(text, list)) console.log(`  ${String(d.merges).padEnd(8)} ${String(d.rules_used).padEnd(6)} ${String(d.tokens).padEnd(7)} ${String(d.register_size).padEnd(9)} ${d.chars_per_token}`);
    console.log(`  padho: zyada merges → bada register, kam tokens, har token zyada characters (compression); kam merges → chhota register, zyada tokens. Dial ka RANGE yahi hai — high aur low ka matlab.`);
    return;
  }
  usage();
}

// ── SELFTEST — pure, disk-free ───────────────────────────────────────────────
function selftest() {
  let pass = 0, fail = 0;
  const assert = (d, c) => { if (c) { pass++; console.log("  ✓ " + d); } else { fail++; console.log("  ✗ " + d); } };
  const T = "Eco Eco Eco";
  assert("bytes — ₹ is 3 bytes, a is 1, and the total adds up", bytesOf("₹8")[0].bytes === 3 && bytesOf("₹8")[1].bytes === 1 && bytesOf("₹8").reduce((n, r) => n + r.bytes, 0) === 4);
  assert("base — characters per chunk, a boundary mark on every chunk after the first", JSON.stringify(toBase("Aristo Eco")) === JSON.stringify([["A", "r", "i", "s", "t", "o"], [SPACE, "E", "c", "o"]]));
  const pc = pairCounts(toBase(T));
  assert("pairs — E+c and c+o both 3×, the boundary pair 2×, and the tie goes to the pair seen FIRST (E+c)", pc[0].a === "E" && pc[0].b === "c" && pc[0].n === 3 && pc[1].a === "c" && pc[1].n === 3 && pc.find((p) => p.a === SPACE).n === 2);
  const r1 = applyRule(toBase(T), ["E", "c"]);
  assert("applyRule — one rule glues every E+c, left to right, inside chunks only", flat(r1).join("|") === ["Ec", "o", SPACE, "Ec", "o", SPACE, "Ec", "o"].join("|"));
  const t2 = train(T, 2);
  assert("train — two merges give the rulebook E+c then Ec+o, 5 tokens, register 4 base + 2", JSON.stringify(t2.rules) === JSON.stringify([["E", "c"], ["Ec", "o"]]) && t2.tokens.length === 5 && t2.base === 4 && t2.log[1].register_size === 6);
  assert("train — every merge in the log was the most frequent pair at its step", t2.log[0].count === 3 && t2.log[1].count === 3);
  const t9 = train("abc", 3);
  assert("train — stops when no pair repeats, with 0 rules and a stated reason", t9.rules.length === 0 && /koi jodi 2 baar nahi/.test(t9.stopped));
  const ids = idsOf(T, t2.rules);
  assert("ids — register order is base-by-first-appearance then merges; the same token is the same number everywhere", ids.register.join("|") === ["E", "c", "o", SPACE, "Ec", "Eco"].join("|") && ids.ids.join(",") === "5,3,5,3,5");
  const dl = dial(T, [0, 2]);
  assert("dial — 0 merges = 11 tokens (3+4+4), 2 merges = 5 tokens; chars-per-token RISES with the dial", dl[0].tokens === 11 && dl[1].tokens === 5 && dl[1].chars_per_token > dl[0].chars_per_token);
  assert("determinism — the same text trains to the same rulebook twice (frozen rulebook law)", JSON.stringify(train(T, 3).rules) === JSON.stringify(train(T, 3).rules));
  assert("order matters — Ec+o BEFORE E+c never fires (Ec does not exist yet), so the tokens stay unmerged", flat(applyRules(toBase(T), [["Ec", "o"], ["E", "c"]])).length === 8);
  assert("parseRules — 'E+c,Ec+o' and a boundary rule parse; a rule without + is refused", JSON.stringify(parseRules("E+c, Ec+o")) === JSON.stringify([["E", "c"], ["Ec", "o"]]) && parseRules(`${SPACE}+E`)[0][0] === SPACE && (() => { try { parseRules("Eco"); return false; } catch { return true; } })());
  // READ-ONLY, proven on the source itself: the module body imports no writer. The one fs read
  // below is the selftest's own, loaded here so the module keeps zero fs imports at the top.
  const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
  const body = src.slice(0, src.indexOf("function selftest()"));
  assert("read-only — the module body spawns nothing, names no state dir and calls no writer (its one fs import is a reader, used by this selftest alone)", !/node:child_process|STATE_DIR|writeFileSync|appendFileSync|mkdirSync|rmSync|renameSync|unlinkSync/.test(body));
  console.log(`\ntokenizer_play selftest: ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
