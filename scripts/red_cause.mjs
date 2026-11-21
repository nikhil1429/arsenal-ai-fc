#!/usr/bin/env node
// @ts-check
// ============================================================================
// red_cause.mjs · ARSENAL AI FC — EVERY NO-CAUSE RED THAT IS NOT A WITNESS RED LEAVES ITS CAUSE, FROM PUBLIC BYTES ONLY
//   (unit mdtl2, forks rows 1186 (2) F7 A / 1207 (1) / 1220; spec ci/mdtl2/MDTL2_SPEC.md on claude/mdtl2-spec d39e060)
//   SOLE WRITER of: NOTHING. Pure exports; it reads only what a caller hands it (text, a file door, a tracked set), and
//   prints only in `selftest`.
// ----------------------------------------------------------------------------
// WHY IT EXISTS. Unit mdtl (scripts/witness_cause.mjs) gave a red WITNESS its cause. Every other red still reached the
// neutral verdict as a NAME and nothing else: `SUITE MEMBER · probe selftest exits 0` said WHICH member, never which check.
// The raw detail cannot leave (a planted state canary rides it, spec M10 / M11), so a cause here is REBUILT, by a different
// file from the one that built it, out of a CLOSED PUBLIC ALPHABET per kind (spec §3):
//   · LIT   one whole string literal of the tracked file that printed the line (acorn's tokenizer reads it, never a regex);
//   · SKEL  a template literal of that file, its static segments joined by `…` — the FILL BYTES NEVER LEAVE (F4 B);
//   · PATH  a repo-relative path tracked at head (an organ basename counts when scripts/<t>.mjs is tracked), with `:<line>`
//           only when the line exists in that file;
//   · ERR   a JS builtin error class name;
//   · SLOT  digits only in a slot the member computed (an exit code, the bound in ms, a count of further failing checks) or
//           validated as a whole grammar line (`CLAUSE <ID> RED · <k>/<n> plant(s)`) (F3 B);
//   · ID    mdtl's clause id and header claim (witness_cause.mjs idsInSource / claimOf, imported, never edited: F1 A);
//   · WITHHELD the one member literal below — anything else becomes it, and its bytes never leave.
// Two checks by two files: scripts/organism_test.mjs builds causes with the builders below; scripts/ci_verdict.mjs keeps a
// cause only if verify() re-reads the kind's own tracked source in the workspace and finds every piece in its alphabet.
// Without acorn (a bare checkout) the alphabet is EMPTY: every cause is WITHHELD — the lane fails closed, never open.
// Shape C (opt-in CAUSE codes in an organ) is named, not built (F8 A). No length, size or bound is typed in this file.
// MODES: selftest
// CLI: node scripts/red_cause.mjs selftest
// ============================================================================
import { pathToFileURL, fileURLToPath } from "node:url";
import { idsInSource, claimOf, NO_CLAIM } from "./witness_cause.mjs";

/** acorn is the repo's own pinned parser (package.json devDependencies); absent ⇒ null ⇒ every alphabet is empty */
const acorn = await import("acorn").catch(() => null);

export const WITHHELD = "WITHHELD · a cause that is not public bytes of its own tracked source was withheld";
/** the JS builtin error classes (ERR) */
export const ERRORS = new Set("Error TypeError RangeError SyntaxError ReferenceError EvalError URIError AggregateError".split(" "));
/** a check line that FAILED, as the members print them (✗ ✘ FAIL) */
const FAIL_LINE = /^\s*(?:✗|✘|FAIL)\s+(\S.*?)\s*$/;
const SLOT = String.raw`(?:exit (?:-?\d+|none)|killed at the member's bound \(\d+ ms\))`;
const MEMBER_TEXT = new RegExp(`^(${SLOT})(?: · (.+?))?(?: · and (\\d+) more)?$`);
const ROLLUP_TEXT = new RegExp(`^([A-Za-z0-9_\\-]+) · (${SLOT})$`);
const RULE_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/;
const CONCLUSIONS = new Set("success failure cancelled skipped timed_out action_required neutral stale".split(" "));

// ── THE ALPHABET ─────────────────────────────────────────────────────────────
/** @typedef {{ ok: boolean, lits: Set<string>, skels: Map<string, string[]> }} Alphabet */
/** @type {Map<string, Alphabet>} */
const ALPHA = new Map();
/** every whole single-line string literal (LIT) and every template skeleton (SKEL) of <src>, read by acorn's tokenizer
 *  @param {string} src @returns {Alphabet} */
export function alphabetOf(src) {
  const key = String(src || "");
  const hit = ALPHA.get(key);
  if (hit) return hit;
  /** @type {Alphabet} */
  const A = { ok: false, lits: new Set(), skels: new Map() };
  const one = (s) => typeof s === "string" && s.trim() !== "" && !/[\r\n]/.test(s);
  if (acorn && key) {
    try {
      /** @type {{ t: string, segs?: string[] }[]} */
      const stack = [];
      for (const tok of acorn.tokenizer(key, { ecmaVersion: "latest", sourceType: "module", allowHashBang: true, allowAwaitOutsideFunction: true, allowReturnOutsideFunction: true })) {
        const l = tok.type.label, top = stack[stack.length - 1];
        if (l === "string") { if (one(tok.value)) A.lits.add(tok.value); }
        else if (l === "`") {
          if (top && top.t === "tpl") {
            stack.pop();
            const segs = /** @type {string[]} */ (top.segs);
            if (segs.length === 1) { if (one(segs[0])) A.lits.add(segs[0]); }
            else if (segs.some((s) => s.trim() !== "") && !segs.some((s) => /[\r\n]/.test(s))) A.skels.set(segs.join("…"), segs);
          } else stack.push({ t: "tpl", segs: [] });
        } else if (l === "template" || l === "invalidTemplate") { if (top && top.segs) top.segs.push(typeof tok.value === "string" ? tok.value : ""); }
        else if (l === "${" || l === "{") stack.push({ t: l });
        else if (l === "}") stack.pop();
      }
      A.ok = true;
    } catch (e) { A.ok = false; A.lits.clear(); A.skels.clear(); void e; }   // an unparsable source has no alphabet: every cause from it is WITHHELD
  }
  ALPHA.set(key, A);
  return A;
}

/** the static segments of a skeleton, in order, cover <t> with the fills between them @param {string} t @param {string[]} segs */
function skelMatch(t, segs) {
  const first = segs[0], last = segs[segs.length - 1];
  if (!t.startsWith(first)) return false;
  let at = first.length;
  for (const s of segs.slice(1, -1)) { const i = t.indexOf(s, at); if (i < 0) return false; at = i + s.length; }
  return t.length - last.length >= at && t.endsWith(last);
}
const word = (c) => /[A-Za-z0-9_]/.test(c || "");
/** the public spelling of one printed text: the literal itself; else the skeleton that covers it (the most static bytes);
 *  else the longest literal that opens it at a word boundary, followed by ` …`; else null (WITHHELD)
 *  @param {string} text @param {Alphabet} A @returns {string | null} */
export function repOf(text, A) {
  const t = String(text);
  if (!A.ok || !t) return null;
  if (A.lits.has(t)) return t;
  let best = null, n = -1;
  for (const [k, segs] of A.skels) if (skelMatch(t, segs)) { const s = segs.join("").length; if (s > n) { best = k; n = s; } }
  if (best !== null) return best;
  let lp = null;
  for (const l of A.lits) if (l.length < t.length && t.startsWith(l) && (!word(l[l.length - 1]) || !word(t[l.length])) && (lp === null || l.length > lp.length)) lp = l;
  return lp === null ? null : `${lp} …`;
}
/** <rep> is in <A>: a literal, a skeleton, or a literal followed by ` …` @param {string} rep @param {Alphabet} A */
export const inAlphabet = (rep, A) => A.ok && (A.lits.has(rep) || A.skels.has(rep) || (rep.endsWith(" …") && A.lits.has(rep.slice(0, -2))));

// ── PATHS ────────────────────────────────────────────────────────────────────
/** a path token: tracked, or tracked with `:<line>` (the line exists in that file), or an organ's name under scripts/
 *  @param {string} t @param {Set<string>} tracked @param {(p: string) => string} readFile */
export function pathTok(t, tracked, readFile) {
  const m = /^(.+?)(?::(\d+))?$/.exec(String(t));
  if (!m || !tracked.size) return false;
  if (tracked.has(m[1])) { if (!m[2]) return true; const n = Number(m[2]); return n >= 1 && n <= String(readFile(m[1]) || "").split(/\r?\n/).length; }
  return !m[2] && /^[A-Za-z0-9_.\-]+$/.test(m[1]) && (tracked.has(`scripts/${m[1]}`) || tracked.has(`scripts/${m[1]}.mjs`));
}

// ── THE KINDS (spec §2) ──────────────────────────────────────────────────────
/** the kind of a red, by its name's literal opening (the grammar organism_test.mjs names its asserts in)
 *  @param {string} name @returns {{ kind: string, file?: string }} */
export function kindOf(name) {
  const n = String(name);
  let m = /^(?:SUITE MEMBER · |MPOOL · )([A-Za-z0-9_\-]+) selftest /.exec(n);
  if (m) return { kind: "member", file: `scripts/${m[1]}.mjs` };
  if (/^all \d+ (?:hermetic )?suite members pass \(every one RUN, not chained\)$/.test(n)) return { kind: "rollup" };
  if (/^MODE \S+ · ran to its end /.test(n)) return { kind: "throw" };
  if (/^LAW PACK (?:ROSE|BASELINE UNREADABLE) · /.test(n) || /^KNOWN-RED · /.test(n)) return { kind: "self" };
  if (/^LAW PACK — /.test(n)) return { kind: "lawpack", file: "scripts/lawpack.mjs" };
  if (/^WHAT IS LEFT · /.test(n)) return { kind: "done", file: "scripts/done.mjs" };
  m = /^CLAUSE WITNESS · (ci\/witness\/\S+) plants — /.exec(n);
  if (m) return { kind: "clause", file: m[1] };
  if (/^WITNESS ‹[^›]+› · GREEN at head against its BASE$/.test(n)) return { kind: "witness" };
  if (/^WITNESS ‹[^›]+› · (?:carries a BASE file|its BASE is in the clone)/.test(n)) return { kind: "own", file: "scripts/organism_test.mjs" };
  if (/^WITNESS ‹[^›]+› · its trees are built/.test(n)) return { kind: "trees" };
  return { kind: "detail" };
}

/** the exit SLOT of a member run (computed by the member, never parsed from its output) @param {number|null|undefined} code @param {number} [killed] */
const slotOf = (code, killed) => (Number.isInteger(killed) && /** @type {number} */ (killed) > 0 ? `killed at the member's bound (${killed} ms)` : `exit ${Number.isInteger(code) ? code : "none"}`);

/** K1 / K3 / K4: the exit SLOT, then the FIRST failing check as LIT or SKEL (else WITHHELD), then `and <n> more` (F2 B)
 *  @param {{ code?: number|null, killed?: number, out?: string, src?: string }} a @returns {string} */
export function memberCause({ code = null, killed, out = "", src = "" }) {
  const checks = String(out).split(/\r?\n/).map((l) => FAIL_LINE.exec(l)).filter(Boolean).map((m) => /** @type {RegExpExecArray} */ (m)[1]);
  const parts = [slotOf(code, killed)];
  if (checks.length) {
    const r = repOf(checks[0], alphabetOf(src));
    parts.push(r === null ? WITHHELD : `FAIL ${r}`);
    if (checks.length > 1) parts.push(`and ${checks.length - 1} more`);
  }
  return parts.join(" · ");
}

/** K2: the red member names, each with its SLOT, read off the roll-up's own `<m>: <why>` lines; the tail never leaves (F9 A)
 *  @param {string} detail @returns {string[]} */
export function rollupCause(detail) {
  const out = [];
  for (const l of String(detail).split(/\r?\n/)) {
    const m = /^\s*([A-Za-z0-9_\-]+): (?:exit (-?\d+|null)|killed by the suite bound \((\d+) ms\))/.exec(l);
    if (m) out.push(`${m[1]} · ${m[3] ? slotOf(null, Number(m[3])) : slotOf(m[2] === "null" ? null : Number(m[2]))}`);
  }
  return [...new Set(out)];
}

/** K6: the ERR class of a throw, and its first frame under <root> as `path:<line>`; the MESSAGE never leaves
 *  @param {string} detail @param {string} root @param {Set<string>} tracked @param {(p: string) => string} readFile @returns {string[]} */
export function throwCause(detail, root, tracked, readFile) {
  const parts = String(detail).split(" | ");
  const e = /^([A-Za-z]+)(?::|$)/.exec(parts[0] || "");
  const out = e && ERRORS.has(e[1]) ? [e[1]] : [];
  const norm = (p) => p.replace(/\\/g, "/");
  const R = norm(String(root)).replace(/\/+$/, "");
  for (const p of parts.slice(1)) {
    const m = /((?:file:\/\/)?[^\s()]+?):(\d+):\d+\)?\s*$/.exec(p);
    if (!m) continue;
    let f = m[1];
    if (f.startsWith("file://")) { try { f = fileURLToPath(f); } catch (err) { void err; continue; } }   // a malformed URL frame is no frame
    f = norm(f);
    const win = /^[A-Za-z]:\//.test(R);
    const under = win ? f.toLowerCase().startsWith(`${R.toLowerCase()}/`) : f.startsWith(`${R}/`);
    const tok = under ? `${f.slice(R.length + 1)}:${m[2]}` : "";
    if (tok && pathTok(tok, tracked, readFile)) { out.push(tok); break; }
  }
  return out.length ? [out.join(" · ")] : [WITHHELD];
}

/** K5 (and K12 PORT): the PATH tokens of a detail, in order, deduplicated; every run of other bytes is ONE `…` (F5 A)
 *  @param {string} detail @param {Set<string>} tracked @param {(p: string) => string} readFile @returns {string[]} */
export function detailCause(detail, tracked, readFile) {
  const out = [], seen = new Set();
  for (const raw of String(detail).split(/[\s,;|()'"`[\]{}<>=]+/)) {
    const t = raw.replace(/^[.:·]+|[.:·]+$/g, "");
    if (t && !seen.has(t) && pathTok(t, tracked, readFile)) { seen.add(t); out.push(t); }
    else if (raw && !seen.has(t) && out[out.length - 1] !== "…") out.push("…");
  }
  return out.some((t) => t !== "…") ? [out.join(" ")] : [];
}

/** K7: per law pack `RED` line, its RULE IDs (whole literals of lawpack.mjs) and its LIT/SKEL; counts ride K8 already
 *  @param {string} detail @param {string} src @returns {string[]} */
export function lawpackCause(detail, src) {
  const A = alphabetOf(src), out = [];
  for (const l of String(detail).split(/\r?\n/)) {
    const m = /^\s*RED\s+(\S.*?)\s*$/.exec(l);
    if (!m) continue;
    const rules = [...new Set(m[1].split(/[\s,;:()·]+/).filter((t) => RULE_ID.test(t) && A.lits.has(t)))];
    const r = repOf(m[1], A);
    out.push([...rules, r === null ? WITHHELD : r].join(" · "));
  }
  return [...new Set(out)];
}

/** K11: per `CLAUSE <ID> RED · <k>/<n> plant(s)` line of a clause witness, its id (a literal of the witness's own source)
 *  and that id's header claim; any other id is ONE WITHHELD entry @param {{ out?: string, src?: string }} a @returns {string[]} */
export function clauseCause({ out = "", src = "" }) {
  const ids = idsInSource(src), res = [];
  let withheld = false;
  for (const l of String(out).split(/\r?\n/)) {
    const m = /^CLAUSE (\S+) RED · (\d+)\/(\d+) plant\(s\)\s*$/.exec(l);
    if (!m) continue;
    if (/^[A-Z][A-Z0-9-]*$/.test(m[1]) && ids.has(m[1]) && Number(m[2]) <= Number(m[3])) res.push(`${m[1]} RED · ${m[2]}/${m[3]} plant(s) · ${claimOf(src, m[1]) ?? NO_CLAIM}`);
    else withheld = true;
  }
  if (withheld) res.push(WITHHELD);
  return [...new Set(res)];
}

/** K14 / K15: the last section a run reached, as LIT or SKEL of the workspace's organism_test.mjs (F7 A)
 *  @param {string} text the run's whole output @param {string} src @returns {string} */
export function sectionCause(text, src) {
  const last = String(text).split(/\r?\n/).filter((l) => l.startsWith("── ")).pop();
  if (last === undefined) return "no section reached";
  const r = repOf(last.slice(3).replace(/\s*─+\s*$/, ""), alphabetOf(src));
  return r === null ? WITHHELD : `last section · ${r}`;
}

/** K17: the failed step of a leg with no verdict annotation: its name only when it is a step the workflow names (or the
 *  runner's own shape for one), else `(unnamed)`; a conclusion outside GitHub's set is `(unknown)` (F6 A)
 *  @param {string} name @param {string} conclusion @param {string} yml @returns {string} */
export function stepCause(name, conclusion, yml) {
  const known = new Set(["Set up job", "Complete job"]);
  for (const l of String(yml).split(/\r?\n/)) {
    const n = /^\s*(?:-\s+)?name:\s*(.+?)\s*$/.exec(l);
    if (n) known.add(n[1].replace(/^(["'])(.*)\1$/, "$2"));
    const u = /^\s*(?:-\s+)?uses:\s*(\S+)\s*$/.exec(l);
    if (u) { known.add(`Run ${u[1]}`); known.add(`Post Run ${u[1]}`); }
    const r = /^\s*-\s+run:\s*([^|>\s].*?)\s*$/.exec(l);
    if (r) known.add(`Run ${r[1]}`);
  }
  return `step ${known.has(String(name)) ? name : "(unnamed)"} · ${CONCLUSIONS.has(String(conclusion)) ? conclusion : "(unknown)"}`;
}

/** THE BUILDER'S ONE DOOR for an assert red that has a detail (organism_test.mjs's one generic hook in assert): the causes of
 *  every kind that is fully known from (name, detail). Member, MPOOL and clause reds are built at their own sites (they need
 *  the run's output); a witness red is mdtl's; a self-naming red has none. Never throws.
 *  @param {string} name @param {string} detail @param {{ root: string, tracked: () => Set<string>, read: (p: string) => string }} io
 *  @returns {string[]} */
export function causesOfDetail(name, detail, io) {
  try {
    const k = kindOf(name);
    if (!detail || ["member", "clause", "witness", "self"].includes(k.kind)) return [];
    if (k.kind === "rollup") return rollupCause(detail);
    if (k.kind === "trees") return [WITHHELD];
    const tracked = io.tracked();
    if (k.kind === "throw") return throwCause(detail, io.root, tracked, io.read);
    if (k.kind === "detail") return detailCause(detail, tracked, io.read);
    const src = k.file && tracked.has(k.file) ? io.read(k.file) : "";
    if (k.kind === "lawpack") return lawpackCause(detail, src);
    const r = repOf(String(detail).split(" | ")[0], alphabetOf(src));
    return [r === null ? WITHHELD : r];
  } catch (e) { void e; return [WITHHELD]; }   // the hook never turns an assert into a throw: an unbuildable cause is WITHHELD
}

/** a cause as the machine line carries it @param {string} name @param {string} text */
export const causeLine = (name, text) => `${name} · ${text}`;

/** THE SECOND CHECK (made by ci_verdict.mjs, a different file). <line> must start with one of <reds>; its cause must parse
 *  by the red's kind and every piece must rebuild from the kind's own tracked source in the workspace — else it becomes
 *  WITHHELD. A line that names no red is dropped.
 *  @param {string} line @param {string[]} reds @param {(p: string) => string} readFile @param {Set<string>} tracked
 *  @returns {{ member: string, cause: string } | null} */
export function verify(line, reds, readFile, tracked) {
  const s = String(line);
  const member = [...reds].sort((a, b) => b.length - a.length).find((r) => s.startsWith(`${r} · `));
  if (!member) return null;
  const c = s.slice(member.length + 3);
  const kept = { member, cause: c }, withheld = { member, cause: WITHHELD };
  if (c === WITHHELD) return kept;
  if (/[\r\n]/.test(c)) return withheld;
  const k = kindOf(member);
  const src = (f) => (f && tracked.has(f) ? String(readFile(f) || "") : "");
  /** @param {string} t */
  const ok = (t) => {
    if (k.kind === "member") {
      const m = MEMBER_TEXT.exec(t);
      if (!m) return false;
      const piece = m[2];
      return piece === undefined || piece === WITHHELD || (piece.startsWith("FAIL ") && inAlphabet(piece.slice(5), alphabetOf(src(k.file))));
    }
    if (k.kind === "rollup") { const m = ROLLUP_TEXT.exec(t); return !!m && tracked.has(`scripts/${m[1]}.mjs`); }
    if (k.kind === "throw") {
      const p = t.split(" · "), frames = ERRORS.has(p[0]) ? p.slice(1) : p;
      return p.length <= 2 && frames.length <= 1 && (frames.length === 1 || ERRORS.has(p[0])) && frames.every((x) => /:\d+$/.test(x) && pathTok(x, tracked, readFile));
    }
    if (k.kind === "detail") { const p = t.split(" "); return p.some((x) => x !== "…") && p.every((x) => x === "…" || pathTok(x, tracked, readFile)); }
    if (k.kind === "lawpack") {
      const A = alphabetOf(src(k.file)), p = t.split(" · ");
      for (let i = 0; i < p.length; i++) {
        if (i && !(RULE_ID.test(p[i - 1]) && A.lits.has(p[i - 1]))) return false;
        const rest = p.slice(i).join(" · ");
        if (rest === WITHHELD || inAlphabet(rest, A)) return true;
      }
      return false;
    }
    if (k.kind === "clause") {
      const m = /^([A-Z][A-Z0-9-]*) RED · (\d+)\/(\d+) plant\(s\) · (.*)$/.exec(t), w = src(k.file);
      return !!m && !!w && Number(m[2]) <= Number(m[3]) && idsInSource(w).has(m[1]) && m[4] === (claimOf(w, m[1]) ?? NO_CLAIM);
    }
    if (k.kind === "done" || k.kind === "own") return inAlphabet(t, alphabetOf(src(k.file)));
    return false;   // trees · self · witness: no cause but WITHHELD is theirs here
  };
  return ok(c) ? kept : withheld;
}

// ── SELFTEST ─────────────────────────────────────────────────────────────────
function selftest() {
  let pass = 0, fail = 0;
  const ok = (name, cond) => { if (cond) pass++; else fail++; console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  ok("acorn (the repo's pinned parser) is importable: without it every alphabet is empty and every cause WITHHELD", !!acorn);
  const CAN = "ZQXJ0F3A9C1D77E2B4", NUM = "481516234299";
  const org = [
    "#!/usr/bin/env node",
    "const ok = (n, c) => console.log(`  ${c ? \"✓\" : \"✗\"} ${n}`);",
    "ok(\"the toy member planted check fails on purpose\", false);",
    "ok(`the toy check read ${word}`, false);",
    "ok('a check · with a dot', false); const r = /['\"`]x/; const t = `a${`b${c}d`}e ${f} tail`;",
    "const multi = `line one\nline two ${x}`;",
  ].join("\r\n");
  const A = alphabetOf(org);
  ok("alphabetOf: whole literals (\" ' `) and skeletons, a regex literal holding quotes does not derail it, CRLF-proof",
    A.ok && A.lits.has("the toy member planted check fails on purpose") && A.lits.has("a check · with a dot") && A.skels.has("the toy check read …") && A.skels.has("a…e … tail") && A.skels.has("b…d"));
  ok("alphabetOf: a multi-line template and a fill-only template are no skeleton; an unparsable source has no alphabet",
    ![...A.skels.keys()].some((k) => k.includes("line one")) && !A.skels.has("…") && alphabetOf("const s = \"never closed;").ok === false);
  ok("repOf: a literal is itself, a fill is `…`, a literal opening at a word boundary is `<lit> …`, anything else null",
    repOf("the toy member planted check fails on purpose", A) === "the toy member planted check fails on purpose" && repOf(`the toy check read ${CAN} salad words`, A) === "the toy check read …"
    && repOf("a check · with a dot and more", A) === "a check · with a dot …" && repOf(CAN, A) === null && repOf(`a check · with a dotX`, A) === null);
  const out = ["  ✓ fine", "  ✗ the toy member planted check fails on purpose", `  ✗ ${CAN}`, `  ✗ the toy check read ${CAN} words`, `  ✗ count ${NUM}`].join("\n");
  const m1 = memberCause({ code: 1, out, src: org });
  ok("memberCause (F2 B): the SLOT, the FIRST failing check as a literal, `and <n> more`", m1 === "exit 1 · FAIL the toy member planted check fails on purpose · and 3 more");
  const m2 = memberCause({ code: 1, out: `  ✗ ${CAN} ${NUM}\n  ✗ x`, src: org }), m3 = memberCause({ code: 1, out: `FAIL the toy check read ${CAN}`, src: org });
  ok("memberCause: a first check of no literal shape is WITHHELD (no canary, no digits of it); a salad reads as its skeleton",
    m2 === `exit 1 · ${WITHHELD} · and 1 more` && !m2.includes(CAN) && !m2.includes(NUM) && m3 === "exit 1 · FAIL the toy check read …");
  ok("memberCause: killed by the bound is the bound's SLOT; no failing check line is the SLOT alone; a null code is `exit none`",
    memberCause({ code: null, killed: 600000, out: "", src: org }) === "killed at the member's bound (600000 ms)" && memberCause({ code: null, out: "", src: "" }) === "exit none");
  const tracked = new Set(["scripts/toy_member.mjs", "scripts/organism_test.mjs", "scripts/lawpack.mjs", "scripts/done.mjs", "ci/witness/toy/witness_toy.mjs", "scripts/x.mjs"]);
  const files = { "scripts/toy_member.mjs": org, "scripts/organism_test.mjs": "const s = 'ci/<unit>/BASE is absent'; section(`${c} — LIVE`); section(\"SUITES — x\");\n".repeat(3),
    "scripts/lawpack.mjs": "const RULE_IDS = ['bare-catch']; push(`${id} ROSE — ${h}, baseline ${b}`);", "scripts/done.mjs": "log(`DONE · ${a} · laws ${b}`);",
    "ci/witness/toy/witness_toy.mjs": "// CONTRACT\n//   P1 · the planted clause claims one thing\n//   BOUND none\nimport x from \"y\";\nclause(\"P1\");" };
  const read = (p) => files[p] || "";
  ok("rollupCause (F9 A): member names and their SLOTs, never the tail", JSON.stringify(rollupCause(`toy_member: exit 1 | ${CAN} | x\n         toy_b: killed by the suite bound (5000 ms) — not an exit code | ${NUM}`)) === JSON.stringify(["toy_member · exit 1", "toy_b · killed at the member's bound (5000 ms)"]));
  const root = "/tmp/plant";
  const th = throwCause(`SyntaxError: Unexpected token '${CAN.slice(0, 10)}' | at JSON.parse (<anonymous>) | at coverage (file://${root}/scripts/organism_test.mjs:2:20)`, root, tracked, read);
  ok("throwCause: ERR and the first frame under the root as path:line; the message never leaves", JSON.stringify(th) === JSON.stringify(["SyntaxError · scripts/organism_test.mjs:2"]) && !JSON.stringify(th).includes(CAN.slice(0, 2)));
  ok("throwCause: a frame past the file's last line or outside the root is no frame; an unknown class is no ERR",
    JSON.stringify(throwCause(`Error: x | at f (${root}/scripts/organism_test.mjs:${NUM}:1)`, root, tracked, read)) === '["Error"]' && JSON.stringify(throwCause("Boom: x | at f (/elsewhere/scripts/x.mjs:1:1)", root, tracked, read)) === JSON.stringify([WITHHELD]));
  const d = detailCause(`orphaned: toy_member, c${CAN.toLowerCase()} · ${NUM} scripts/x.mjs:1 scripts/x.mjs:${NUM}`, tracked, read);
  ok("detailCause (F5 A): tracked paths and organ names in order, every other run one `…`, no digits but a line that exists", JSON.stringify(d) === JSON.stringify(["… toy_member … scripts/x.mjs:1 …"]));
  ok("detailCause: a detail with no tracked path has no cause (the name alone, as before)", detailCause(`${CAN} 3 of 4`, tracked, read).length === 0);
  ok("lawpackCause: the rule id and the red's skeleton; a raw red keeps only its public opening",
    JSON.stringify(lawpackCause(`RED  bare-catch ROSE — 9, baseline 8\n         RED  bare-catch ${CAN}`, files["scripts/lawpack.mjs"])) === JSON.stringify(["bare-catch · … ROSE — …, baseline …", "bare-catch · bare-catch …"]));
  ok("clauseCause: a literal id with its claim and its k/n SLOT; an id not in the source is ONE WITHHELD",
    JSON.stringify(clauseCause({ out: `CLAUSE P1 RED · 0/1 plant(s)\nCLAUSE Q${CAN} RED · 0/1 plant(s)\nCLAUSE P1 GREEN · 1/1 plant(s)`, src: files["ci/witness/toy/witness_toy.mjs"] })) === JSON.stringify(["P1 RED · 0/1 plant(s) · the planted clause claims one thing", WITHHELD]));
  const os = files["scripts/organism_test.mjs"];
  ok("sectionCause (F7 A): the last section as LIT or SKEL; a forged title is WITHHELD; no section is said",
    sectionCause("── SUITES — x ────\nnoise", os) === "last section · SUITES — x" && sectionCause("── GATES — LIVE ──", os) === "last section · … — LIVE" && sectionCause(`── SUITES — x ──\n── ${CAN} ──`, os) === WITHHELD && sectionCause("died", os) === "no section reached");
  const yml = "jobs:\n  t:\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - name: npm test · hermetic · head\n        run: |\n          x\n";
  ok("stepCause (F6 A): a step the workflow names, the runner's shapes for it, else (unnamed); an unknown conclusion is (unknown)",
    stepCause("npm test · hermetic · head", "failure", yml) === "step npm test · hermetic · head · failure" && stepCause("Run npm ci", "failure", yml) === "step Run npm ci · failure"
    && stepCause("Post Run actions/checkout@v4", "cancelled", yml) === "step Post Run actions/checkout@v4 · cancelled" && stepCause(CAN, "failure", yml) === "step (unnamed) · failure" && stepCause("Set up job", CAN, yml) === "step Set up job · (unknown)");
  const io = { root, tracked: () => tracked, read };
  ok("causesOfDetail: the hook builds only the kinds fully known from (name, detail); member, clause, witness, self get none here",
    causesOfDetail("SUITE MEMBER · toy_member selftest exits 0", "x", io).length === 0 && causesOfDetail("WITNESS ‹t› · GREEN at head against its BASE", "red beyond BOUND: P1", io).length === 0
    && causesOfDetail("WITNESS ‹t› · carries a BASE file (B6)", "ci/<unit>/BASE is absent", io)[0] === "ci/<unit>/BASE is absent"
    && causesOfDetail("WITNESS ‹t› · its trees are built (LF, under the temp dir)", `git: fatal ${CAN}`, io)[0] === WITHHELD
    && causesOfDetail("WHAT IS LEFT · x", `DONE · ${CAN} · laws 3/4 | y`, { ...io, tracked: () => tracked })[0] === "DONE · … · laws …"
    && causesOfDetail("all 3 hermetic suite members pass (every one RUN, not chained)", "toy_member: exit 1 | t", io)[0] === "toy_member · exit 1");
  ok("causesOfDetail never throws: a broken door reads WITHHELD", causesOfDetail("any red", "scripts/x.mjs", { root, tracked: () => { throw new Error("no git"); }, read })[0] === WITHHELD);
  const M = "SUITE MEMBER · toy_member selftest exits 0", R = "all 3 hermetic suite members pass (every one RUN, not chained)", T = "MODE coverage · ran to its end (a throw is a red, never a dead runner)";
  const D = "EVERY organ with a selftest is wired into a suite (package.json:_selftest_coverage_law)", L = "LAW PACK — every rule file present", C = "CLAUSE WITNESS · ci/witness/toy/witness_toy.mjs plants — exit 0";
  const reds = [M, R, T, D, L, C, "WHAT IS LEFT · y", "WITNESS ‹t› · carries a BASE file (B6)"];
  const v = (l) => (verify(l, reds, read, tracked) || { cause: null }).cause;
  const made = [[M, m1], [M, m2], [M, m3], [R, "toy_member · exit 1"], [T, th[0]], [T, "TypeError"], [D, d[0]], [L, "bare-catch · … ROSE — …, baseline …"], [L, `bare-catch · ${WITHHELD}`],
    [C, "P1 RED · 0/1 plant(s) · the planted clause claims one thing"], ["WHAT IS LEFT · y", "DONE · … · laws …"], ["WITNESS ‹t› · carries a BASE file (B6)", "ci/<unit>/BASE is absent"]];
  ok("verify keeps every cause a builder made (each kind rebuilds from its own tracked source)", made.every(([r, c]) => v(causeLine(r, c)) === c));
  const F = `forged cause ${CAN}`;
  ok("verify (the second check): a forged text of the RIGHT grammar is WITHHELD for every kind, and never leaves",
    [`${M} · exit 1 · FAIL ${F}`, `${R} · f${CAN.toLowerCase()} · exit 1`, `${T} · SyntaxError · scripts/f${CAN}.mjs:1`, `${T} · SyntaxError · scripts/x.mjs:${NUM}`, `${D} · … f${CAN} …`,
      `${L} · bare-catch · ${F}`, `${C} · P1 RED · 0/1 plant(s) · ${F}`, `${C} · Q${CAN} RED · 0/1 plant(s) · ${NO_CLAIM}`, `WHAT IS LEFT · y · ${F}`, `WITNESS ‹t› · carries a BASE file (B6) · ${F}`, `${M} · exit 1\n${F}`]
      .every((l) => v(l) === WITHHELD));
  ok("verify: WITHHELD passes; a line naming no red is dropped; with no tracked set (no git) every path cause is WITHHELD",
    v(causeLine(M, WITHHELD)) === WITHHELD && verify(`NOT A RED · exit 1`, reds, read, tracked) === null && verify(causeLine(D, d[0]), reds, read, new Set())?.cause === WITHHELD);
  ok("kindOf: a self-naming red (K8 · K9 · K13) and a witness red (mdtl's) are named, never a detail", kindOf("LAW PACK ROSE · x 1 → 2").kind === "self" && kindOf("KNOWN-RED · y").kind === "self" && kindOf("WITNESS ‹a-b› · GREEN at head against its BASE").kind === "witness" && kindOf("MPOOL · usage_tap selftest runs").file === "scripts/usage_tap.mjs");
  console.log(`\nred_cause selftest: ${pass} passed, ${fail} failed`);
  console.log(fail ? "SELFTEST FAILED" : "ALL CHECKS PASSED");
  return fail ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2] || "";
  if (mode === "selftest") process.exitCode = selftest();
  else { console.log("red_cause: selftest (a pure module; organism_test.mjs and ci_verdict.mjs import it)"); process.exitCode = 2; }
}
