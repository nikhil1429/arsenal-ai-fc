# UNIT mpin · SPEC: the own-literal pin class (forks row 1149 (2))

Branch `claude/mpin-spec`, cut from origin/main **4b00cf57b0c0c25610769fe85e110d1ffac6a3fc** when the seat started (19 Nov 2026).
This is a spec seat. It builds nothing, and no organ is edited on this branch. The one file of code it carries,
`ci/mpin/classify_mpin.mjs`, is a read-only MEASUREMENT instrument: it starts no process, binds no port and writes nothing.
The ledger is `ci/mpin/LEDGER.jsonl`.

**HEADLINE.** At this cut the class holds **39 own-literal pins in 28 asserts** (19 Nov 2026). That is mcon's 38 plus conductor's,
because mcon's repair 4c4feb8 is not on main yet. Among mcon's 78 unresolved sites, an independent second method finds **one more
of the same shape** (`scripts/mutagen.mjs:967`); the other 77 are measured as not the shape. The fates:
- 40 pins each get one fate: **25 NARROW · 14 READ · 1 REMOVE**. One of the READs (conductor) is mcon's, already built.
- Every NARROW rides ONE shared primitive that refuses a range touching its own selftest.
- The census becomes the law pack's own key, `own-literal-pin`, frozen at the count read from the tree at the law's landing.
- The build splits into three units by concern (§Q4).

Every number below is a command's printed line, dated 19 Nov 2026, or sits in a fence.

## HOW THE MEASUREMENTS WERE TAKEN
- Each tree is an LF clone under /tmp (`git clone -c core.autocrlf=false`): base 4b00cf5 with `npm ci`, mcon's base 3f84c80 and
  mcon's tip 4c4feb8 (both borrow the base's node_modules through `--modules`).
- mcon's census is run from `git show 4c4feb8:ci/mcon/census_mcon.mjs`, unedited.
- The second method is `node ci/mpin/classify_mpin.mjs --org <tree> --census <census --json output> [--json]`:
  - It re-emits each pin's subject with its const chain and evaluates it, in a `node:vm` context whose only file door answers
    source files under the tree.
  - It then decides by POSITION (the census's own definition) whenever the subject is a verbatim slice of the file. It falls back
    to CONTENT only for a transformed subject (filter / join / replace).
  - It measures four more facts for each pin:
    - `Rass`: is the pin still true with its own assert call cut out?
    - `Rcode`: is it still true with the whole top-level block holding the pin cut out (its selftest)?
    - `RcodeNC`: the same with every comment blanked too.
    - `codeFn`: the declaration that holds the text the pin is really about.

---

## Q0 · mcon's census re-run at this cut, with every difference named

```
$ node ci/mcon/census_mcon.mjs --org <LF clone 4b00cf5>                       (19 Nov 2026)
CENSUS MCON · 39 own-literal pin(s) in 28 assert(s) · 1 own-assert · 78 unresolved · 145 file(s) walked
$ node ci/mcon/census_mcon.mjs --org <LF clone 3f84c80> --modules <base>      (19 Nov 2026; mcon's PROOF base)
CENSUS MCON · 39 own-literal pin(s) in 28 assert(s) · 1 own-assert · 78 unresolved · 144 file(s) walked
$ node ci/mcon/census_mcon.mjs --org <LF clone 4c4feb8> --modules <base>      (19 Nov 2026; mcon's build)
CENSUS MCON · 38 own-literal pin(s) in 27 assert(s) · 1 own-assert · 78 unresolved · 147 file(s) walked
```

| # | Difference from mcon's PROOF numbers | Cause, measured |
|---|---|---|
| D1 | own-literal reads 39 / 28 at this cut, against PROOF's build 38 / 27 | mcon's conductor repair is on `claude/mcon-build` only, so main still carries `scripts/conductor.mjs:1601`. A multiset compare of the `--json` lists (kind\|file\|pin, line numbers dropped) gives 4c4feb8 → 4b00cf5 = `own-literal conductor /NOTHING WAS RUN/ 0->1`, and nothing else differs. |
| D2 | the list is otherwise identical to PROOF's base list | 3f84c80 → 4b00cf5: `no multiset difference`, and `0 of 118` line numbers moved. |
| D3 | 145 files walked here, 144 at PROOF base, 147 at PROOF build | `diff` of the walked file sets: 3f84c80 → 4b00cf5 adds exactly `scripts/rung_receipt.mjs` (unit mrung, main's tip). PROOF's build adds its three `ci/mcon/*.mjs`. |
| D4 | `lawpack gate` raw matches: 1933 here, 1928 in PROOF | Same tip, `scripts/rung_receipt.mjs`. Every finding count is equal to PROOF's, and the same two REDs stand (jugad 93 against baseline 90, depcruise 13 against 7). That is F2, owned by mlaw (row 1149 (3)), and this spec does not touch it. |

```
$ node scripts/lawpack.mjs gate      (LF clone 4b00cf5, npm ci, 19 Nov 2026)
lawpack · 1933 raw match(es) over 8/8 rules · findings: owners-only-state-write 0 · law-m-literal-model 0 · jugad-literal-subject-list 93 · trailing-n-slice 0 · bare-catch 37 · receipt-testimony-read 5 · tum-not-tu-prose 0 · import-time-registry-read 2 · unguarded-dispatch 0 · raw-nul-in-source 0 · depcruise_errors 13
lawpack: 2 RED — a gate may only get stricter (§10-D rule 6)
$ node ci/mpin/classify_mpin.mjs --org <base> --census <census --json>      (19 Nov 2026)
CLASSIFY MPIN · 118 site(s) · same-shape 40 · own-assert 0 · honest 78 · reads-false 0 · not-evaluable 0
```

The second method agrees with the census on all 39 counted pins: each one is same-shape **by position** (cross-check, 0 disagreements).
mcon's single own-assert row (`scripts/thalamus.mjs:1927`, a `.match(/captainHoldFact\(/g).length === 4` count) reads honest by
content. Its literal is not in its subject's range, the function `captainHoldFact` (:1239) satisfies it, and a count can fail. It
stays listed apart and is not one of the class.

---

## Q1 · A fate for every pin, by file and line

THE THREE FATES (the row's own words):
- **READ**: read the real behaviour or real output, through a door that already exists (file:line named) or through a child run
  on a temp copy (mcon's proven pattern).
- **NARROW**: narrow the subject so it cannot cover the pin's own literal.
- **REMOVE**: a pin with no honest reading is removed, and its assert's other conjuncts are named.

THE NARROW PRIMITIVE, ONE CODE PATH FOR ALL 25 NARROWs (unit mpin-narrow builds it): `ownCode(url, sel)`.
- It reads the file at `url` and folds CRLF.
- It returns ONE declaration's text, chosen by `sel`:
  - `{fn: name}`: a column-0 `function name(` (optionally `export` / `async`) up to its first column-0 `}`;
  - `{decl: NAME}`: the `const NAME =` statement line;
  - `{imports: true}`: the import block;
  - `{header: true}`: the leading comment block.
- Inside that text, every whole-line comment is blanked.
- It **throws** in two cases, so a dead pin is a RED, never a silent `false`:
  - when the anchor is not found;
  - when the range it would return intersects any column-0 `function selftest…(` block of the same file (found the same way).
- The needles are built from the argument at run time. No needle is a literal of the selftest, which is the house idiom already
  written down at `scripts/dugout.mjs:4249-4254` ("THE NEEDLES ARE BUILT BY CONCATENATION … the first two drafts of this line
  matched THEMSELVES").
- It needs no acorn, so a bare checkout still runs every selftest. acorn is a devDependency (`package.json` devDependencies), and
  only the law pack uses it.

Where the primitive lives is fork **F1**. The measurement column below is classify_mpin's row. `outside block … code ✓ @L in fn`
means the pinned text exists in code outside the selftest block at L, inside `fn`: the narrowed subject keeps an honest reading,
and the build's mutant deletes exactly that text.

| # | pin (file:line) | the pin | assert | fate | the code path | measurement (classify_mpin, base 4b00cf5) |
|---|---|---|---|---|---|---|
| 1 | scripts/audit.mjs:1155 | `/ttl_days/` | scripts/audit.mjs:1155 | **NARROW** | ownCode(url, {fn:"deal"}) — the cap's TTL lives in deal() | census own-literal · own ✓ by position · R true · outside block 1109-1235: code ✓ @1082 in function deal |
| 2 | scripts/audit.mjs:1155 | `/default_if_silent/` | scripts/audit.mjs:1155 | **NARROW** | ownCode(url, {fn:"deal"}) | census own-literal · own ✓ by position · R true · outside block 1109-1235: code ✓ @1083 in function deal |
| 3 | scripts/audit.mjs:1156 | `/NO RED ASSERTION, NO AUTO-FIX/` | scripts/audit.mjs:1156 | **NARROW** | ownCode(url, {fn:"runAudit"}); its sibling /if \(!oracle\)/ moves onto the same narrowed subject | census own-literal · own ✓ by position · R true · outside block 1109-1235: code ✓ @955 in function runAudit |
| 4 | scripts/audit.mjs:1186 | `/"tag", "-f"/` | scripts/audit.mjs:1186 | **NARROW** | ownCode(url, {fn:"runAudit"}) (the fixer chain; a real git-worktree run is heavier than the pin's claim — fork F3) | census own-literal · own ✓ by position · R true · outside block 1109-1235: code ✓ @947 in function runAudit |
| 5 | scripts/audit.mjs:1188 | `/--check/` | scripts/audit.mjs:1187 | **NARROW** | ownCode(url, {fn:"runAudit"}) | census own-literal · own ✓ by position · R true · outside block 1109-1235: code ✓ @968 in function runAudit |
| 6 | scripts/audit.mjs:1188 | `/organ's OWN selftest went red/` | scripts/audit.mjs:1187 | **NARROW** | ownCode(url, {fn:"runAudit"}) | census own-literal · own ✓ by position · R true · outside block 1109-1235: code ✓ @973 in function runAudit |
| 7 | scripts/audit.mjs:1188 | `/3-commit checkpoint/` | scripts/audit.mjs:1187 | **NARROW** | ownCode(url, {fn:"runAudit"}) | census own-literal · own ✓ by position · R true · outside block 1109-1235: code ✓ @992 in function runAudit |
| 8 | scripts/audit.mjs:1190 | `/reset", "--hard", "HEAD~1"/` | scripts/audit.mjs:1189 | **NARROW** | ownCode(url, {fn:"runAudit"}) | census own-literal · own ✓ by position · R true · outside block 1109-1235: code ✓ @990 in function runAudit |
| 9 | scripts/audit.mjs:1190 | `/downgraded to a RULING/` | scripts/audit.mjs:1189 | **NARROW** | ownCode(url, {fn:"runAudit"}) | census own-literal · own ✓ by position · R true · outside block 1109-1235: code ✓ @992 in function runAudit |
| 10 | scripts/awayday.mjs:890 | `/const TAIL_BUDGET = 650;/` | scripts/awayday.mjs:888 | **NARROW** | ownCode(url, {decl:"TAIL_BUDGET"}) — the declaration line only; its behavioural sibling failureTail(…).length <= 650 stays | census own-literal · own ✓ by position · R true · outside block 761-1192: code ✓ @185 in const TAIL_BUDGET |
| 11 | scripts/awayday.mjs:924 | `/NOT RUN/` | scripts/awayday.mjs:921 | **READ** | child run of awayday's red path on a temp copy (mcon's pattern): a planted two-job manifest whose first job is red; the verdict is the child's stderr line 'awayday: NOT RUN — …'. The base slice starts at the selftest's own "async function main" literal (subject 821-1295), exactly conductor's shape | census own-literal · own ✓ by position · R true · outside block 761-1192: code ✓ @1260 in function main |
| 12 | scripts/awayday.mjs:954 | `"captains_call.mjs"` | scripts/awayday.mjs:952 | **NARROW** | ownCode(url, {fn:"checkLane"}) — the default fileCardFn (:679) shells execFileSync directly with no door, so a READ needs a recorded child_process (fork F3) | census own-literal · own ✓ by position · R true · outside block 761-1192: code ✓ @679 in function checkLane |
| 13 | scripts/awayday.mjs:954 | `'"file", "--line"'` | scripts/awayday.mjs:952 | **NARROW** | ownCode(url, {fn:"checkLane"}) | census own-literal · own ✓ by position · R true · outside block 761-1192: code ✓ @679 in function checkLane |
| 14 | scripts/awayday.mjs:964 | `/"--open", u/` | scripts/awayday.mjs:958 | **NARROW** | ownCode(url, {fn:"checkLane"}) | census own-literal · own ✓ by position · R true · outside block 761-1192: code ✓ @679 in function checkLane |
| 15 | scripts/capture.mjs:2269 | `/mode === "quarantine"/` | scripts/capture.mjs:2267 | **READ** | child run 'capture.mjs quarantine' on a temp copy with a planted sidecar line; the verdict is its stdout naming that line (the read door works), not the door's spelling | census own-literal · own ✓ by position · R true · outside block 1674-2613: code ✓ @2908 in function main |
| 16 | scripts/capture.mjs:2337 | `/quarantine_error: quarantineError/` | scripts/capture.mjs:2332 | **READ** | pullFromInbox(tmpInbox, tmpReps, reg) (:1033, returns at :1144) on a temp inbox: the returned report HAS the key quarantine_error, the key the notice reads | census own-literal · own ✓ by position · R true · outside block 1674-2613: code ✓ @1144 in function pullFromInbox |
| 17 | scripts/conductor.mjs:1601 | `/NOTHING WAS RUN/` | ok(…) @ scripts/conductor.mjs:1599 | **READ (built)** | mcon 4c4feb8 already repairs it (child run of 'fallback'); this spec adds nothing but its landing | census own-literal · own ✓ by position · R true · outside block 839-1606: code ✓ @1732 in function main |
| 18 | scripts/dugout.mjs:3899 | `'req.url.startsWith("/rehydrate")'` | scripts/dugout.mjs:3899 | **NARROW** | ownCode(url, {fn:"main"}) — the HTTP doors live in main(); a READ would bind a port (row 1053's port class), so a narrowed source pin is the honest reading here | census own-literal · own ✓ by position · R true · outside block 3324-5244: code ✓ @6689 in function main |
| 19 | scripts/dugout.mjs:4112 | `/the card was NOT answered/` | scripts/dugout.mjs:4111 | **READ** | execTool("answer_card", {word:"haan"}, {sh: () => { throw … }}) — the deps.sh door at :2067; the verdict is the returned .error text | census own-literal · own ✓ by position · R true · outside block 3324-5244: code ✓ @2340 in function execTool |
| 20 | scripts/dugout.mjs:4112 | `/never say it is done when it is not/` | scripts/dugout.mjs:4111 | **READ** | same refusal run: the returned .error | census own-literal · own ✓ by position · R true · outside block 3324-5244: code ✓ @2340 in function execTool |
| 21 | scripts/dugout.mjs:4121 | `"THIS ONE IS NOT DONE YET"` | scripts/dugout.mjs:4120 | **READ** | execTool("answer_card", {word:"haan"}, {sh: () => "… read it now …"}): the returned ._use | census own-literal · own ✓ by position · R true · outside block 3324-5244: code ✓ @2352 in function execTool |
| 22 | scripts/dugout.mjs:4121 | `"NEVER say it is handled"` | scripts/dugout.mjs:4120 | **READ** | same run: the returned ._use | census own-literal · own ✓ by position · R true · outside block 3324-5244: code ✓ @2352 in function execTool |
| 23 | scripts/dugout.mjs:4121 | `"needs_reading"` | scripts/dugout.mjs:4120 | **READ** | same run: the returned .needs_reading === true (and false on a plain 'said') | census own-literal · own ✓ by position · R true · outside block 3324-5244: code ✓ @2350 in function execTool |
| 24 | scripts/dugout.mjs:4237 | `"observeAndSaveTurn(body.lines"` | scripts/dugout.mjs:4236 | **NARROW** | ownCode(url, {fn:"main"}) (the /transcript door, :6763) | census own-literal · own ✓ by position · R true · outside block 3324-5244: code ✓ @6763 in function main |
| 25 | scripts/dugout.mjs:4241 | `'from "./gaffer_state.mjs"'` | scripts/dugout.mjs:4240 | **NARROW** | ownCode(url, {imports:true}) — the import block only (:102) | census own-literal · own ✓ by position · R true · outside block 3324-5244: code ✓ @102 in ImportDeclaration @102-102 |
| 26 | scripts/dugout.mjs:4270 | `/detached: true, stdio: "ignore"/` | scripts/dugout.mjs:4268 | **READ** | wakeTheWatcher({spawn: rec}) (:2943, door :2945): the recorded options are detached:true, stdio:"ignore", unref() called; a throwing spawn returns false. Measured: on base the first code hit is autoOpenSitting (:2052), not wakeTheWatcher — the pin never even read the function its label names | census own-literal · own ✓ by position · R true · outside block 3324-5244: code ✓ @2052 in function autoOpenSitting |
| 27 | scripts/dugout.mjs:4526 | `"superviseTurn(r.state, r.standing, body.lines"` | scripts/dugout.mjs:4525 | **NARROW** | ownCode(url, {fn:"main"}) (:6769) | census own-literal · own ✓ by position · R true · outside block 3324-5244: code ✓ @6769 in function main |
| 28 | scripts/dugout.mjs:4592 | `"SAME TTL deepFresh() already uses"` | scripts/dugout.mjs:4591 | **REMOVE** | no honest reading: outside the selftest only a COMMENT (:507) holds the text (RcodeNC false). Its other conjunct stays and is named: CROSS_MOUTH_FRESH_MS === 10 * 60000. Fork F4 offers a code path that makes the claim readable | census own-literal · own ✓ by position · R true · outside block 3324-5244: code ✗ (comment only @507) |
| 29 | scripts/dugout.mjs:4713 | `'req.url === "/recital"'` | scripts/dugout.mjs:4712 | **NARROW** | ownCode(url, {fn:"main"}) (:6835); the assert reads dugout.mjs by join(__dirname, "dugout.mjs") — the same own file | census own-literal · own ✓ by position · R true · outside block 3324-5244: code ✓ @6835 in function main |
| 30 | scripts/dugout.mjs:5223 | `'req.url === "/sitting-turn"'` | scripts/dugout.mjs:5223 | **NARROW** | ownCode(url, {fn:"main"}) (:6677) | census own-literal · own ✓ by position · R true · outside block 3324-5244: code ✓ @6677 in function main |
| 31 | scripts/dugout.mjs:5223 | `'req.url === "/spoken-relay"'` | scripts/dugout.mjs:5223 | **NARROW** | ownCode(url, {fn:"main"}) (:6678) | census own-literal · own ✓ by position · R true · outside block 3324-5244: code ✓ @6678 in function main |
| 32 | scripts/dugout.mjs:5228 | `'[join(__dirname, "sitting.mjs"), "daemon"]'` | scripts/dugout.mjs:5228 | **NARROW** | ownCode(url, {fn:"main"}) (:6577) — booting a daemon is not run from a selftest | census own-literal · own ✓ by position · R true · outside block 3324-5244: code ✓ @6577 in function main |
| 33 | scripts/examiner.mjs:861 | `/carries NO serve receipt/` | scripts/examiner.mjs:860 | **READ** | child run 'examiner.mjs stage' on a temp copy with a planted outgoing drill that has no 'served': its stdout carries the ⚠ line (:903); its siblings /const outgoing = readJson\(DRILL\);/ and /outgoing\.served/ fold into that one output read | census own-literal · own ✓ by position · R true · outside block 580-882: code ✓ @903 in function main |
| 34 | scripts/forge_session.mjs:2587 | `"SOLE WRITER of dressing-room/state/forge_session.json. Noth` | scripts/forge_session.mjs:2585 | **NARROW** | ownCode(url, {header:true}) — the header comment block (:23) IS the declared surface the owners-only law greps (CLAUDE.md: grep -rn "SOLE WRITER"), so a header-only subject is the honest reading; outside the selftest only that comment holds it (RcodeNC false) | census own-literal · own ✓ by position · R true · outside block 1574-2592: code ✗ (comment only @23) |
| 35 | scripts/gaffer_brain.mjs:3897 | `/const VERIFY_TIMEOUT_MS = 180000;/` | scripts/gaffer_brain.mjs:3894 | **NARROW** | ownCode(url, {decl:"VERIFY_TIMEOUT_MS"}) (:1580); the subject src2 is the whole file, the block is selftest2 (2874-4038) | census own-literal · own ✓ by position · R true · outside block 2874-4038: code ✓ @1580 in const VERIFY_TIMEOUT_MS |
| 36 | scripts/gates.mjs:473 | `/NOT MEASURED — not in this checkout/` | scripts/gates.mjs:471 | **NARROW** | ownCode(url, {fn:"main"}) (:509) — a child run needs ajv under the copy (the copy carries no node_modules), fork F3 | census own-literal · own ✓ by position · R true · outside block 337-478: code ✓ @509 in function main |
| 37 | scripts/intent.mjs:307 | `/ARSENAL_ORGAN === "1"/` | scripts/intent.mjs:307 | **READ** | child run 'intent.mjs stop' with ARSENAL_ORGAN=1 on a temp copy: exit 0, empty stdout, no file written (the label's own claim) | census own-literal · own ✓ by position · R true · outside block 251-313: code ✓ @332 in function main |
| 38 | scripts/intent.mjs:307 | `/__ARSENAL_HOOK_STDIN__/` | scripts/intent.mjs:307 | **READ** | child run 'intent.mjs stop' with a preload that sets globalThis.__ARSENAL_HOOK_STDIN__ to a planted payload and stdin closed: the payload is read (hookPayload :317), observable as the one append in the copy's state dir | census own-literal · own ✓ by position · R true · outside block 251-313: code ✓ @317 in function hookPayload |
| 39 | scripts/intent.mjs:307 | `/case "stop"/` | scripts/intent.mjs:307 | **READ** | the same child runs prove the verb is dispatched (exit 0, silent) — an undispatched verb takes the usage path | census own-literal · own ✓ by position · R true · outside block 251-313: code ✓ @331 in function main |
| 40 | scripts/mutagen.mjs:967 | `/NODE_V8_COVERAGE/` | scripts/mutagen.mjs:966 | **NARROW** | ownCode(url, {fn:"coveredFiles"}) (:384, the NODE_V8_COVERAGE env at :389) (codeOnly filters comment lines only, so the assert's own line stays in its subject — the 78's one same-shape site) | census unresolved · own ✓ by content · R true · outside block 874-991: code n/a (transformed subject) |

The 40 rows are mcon's 38, conductor (mcon's, built), and mutagen:967 (Q2's one same-shape site). By concern:
- **READ, 14 rows:**
  - through a door that exists: dugout execTool ×5, wakeTheWatcher ×1, capture pullFromInbox ×1;
  - through a child run on a temp copy: intent ×3, examiner ×1, awayday ×1, capture ×1;
  - conductor ×1, built by mcon.
- **NARROW, 25 rows:** audit ×9, awayday ×4, dugout ×8, forge_session ×1, gaffer_brain ×1, gates ×1, mutagen ×1.
- **REMOVE, 1 row:** dugout:4592.

### Q1 · files and owners each fate touches (base 4b00cf5, file:line)
Every edit is inside a selftest of the organ that owns it, except where a row says otherwise.
- The owners (the state files they write): audit `scripts/audit.mjs:4` (audit_ledger.jsonl) · awayday `scripts/awayday.mjs:54` (awayday.json) ·
  capture `scripts/capture.mjs:6` (reps_log.jsonl) · forge_session `scripts/forge_session.mjs:23` · gaffer_brain `scripts/gaffer_brain.mjs:5` ·
  intent `scripts/intent.mjs:14` (session_intent.jsonl) · examiner `scripts/examiner.mjs:533`.
- gates (`scripts/gates.mjs:6`) and lawpack (`scripts/lawpack.mjs:6`) are SOLE WRITER of NOTHING.
- dugout and mutagen declare no state file of their own in their headers. That is measured by
  `grep -n -m1 "SOLE WRITER\|sole writer\|single writer"`: dugout's first hit, `:103`, names gaffer_brain's journal, and mutagen has no hit.
- **No READ writes a state file of the repo.** Every child run gets a copy of `scripts/` under `os.tmpdir()`, with an empty
  `dressing-room/state/` plus `registry.json` only, as at mcon's `scripts/conductor.mjs` S9 (6). Its plants are written by node into that
  temp tree. The in-process READs pass a door function (`deps.sh` at `scripts/dugout.mjs:2067` · `deps.spawn` at `:2945` · temp paths
  into `pullFromInbox` at `scripts/capture.mjs:1033`).
- **THE PORT CLASS (row 1053).** No fate binds a port. The dugout HTTP doors (`scripts/dugout.mjs:6677/6678/6689/6835`) are NARROWED,
  not served, exactly because a READ would have to listen on a socket. No witness names a live service, POSTs at a daemon or restarts
  anything. Every child wait is bounded by the organ's own existing bound (conductor `STEP_TIMEOUT_MS`, `scripts/conductor.mjs:165`;
  the others reuse the named constant of the organ under test, F5). No number is typed.

---

## Q2 · Each of the 78 unresolved, classified by measurement

The census names these 78 and does not count them, because its range evaluator stops at a derivation other than slice / indexOf.
`classify_mpin.mjs` evaluates every one of them, so `not-evaluable 0` (19 Nov 2026). For each site it records three things:
- whether the subject covers the pin's own literal (by position where the subject is a verbatim slice);
- whether the pin is still true with its own assert cut out (`Rass`);
- whether what satisfies it outside the selftest block is code or a comment.

```
unresolved 78 (19 Nov 2026, classify_mpin over census_mcon --json, base 4b00cf5):
  SAME SHAPE ............................................. 1   scripts/mutagen.mjs:967
  not the shape — code outside the selftest satisfies it . 74
  not the shape — array membership over dispatch lines ... 1   scripts/brain.mjs:5637
  not the shape — doc-wire on header PROSE (by design) ... 2   scripts/cortex.mjs:1823 · scripts/forge_session.mjs:2398
```

- **mutagen:967.** Its subject `codeOnly` filters only whole-line comments, so the assert's own line `/NODE_V8_COVERAGE/.test(codeOnly)`
  stays inside it (CONTENT method, `own true`). It is the 40th row of Q1's table.
- **Seven sites the vm evaluated by CONTENT were also read by hand** (brain:5637, learnstate:2016, learnstate:2151 ×2,
  teaching_contract:1647 ×2, mutagen:967):
  - brain:5637: `dispatched` keeps only `if (mode === "…"` lines, and the one `daemon-worker` dispatch is `scripts/brain.mjs:7642` in
    main, outside the selftest (4634-6996).
  - learnstate:2016: the subject ends at `function selftest()`.
  - learnstate:2151: the subject starts at the line-anchored `^async function main() {$`.
  - teaching_contract:1647: the subject is the body of `doneConcepts`.
  None of those six covers its own literal.
- **The two doc-wires** read a MODES header comment on purpose; a header is the documentation surface those asserts guard. They are
  named, not counted, and are not the class.

| # | site (file:line) | the pin | assert | class | how it was measured |
|---|---|---|---|---|---|
| 1 | scripts/audit.mjs:1180 | `/watchman/i` | scripts/audit.mjs:1179 | not the shape — code-satisfied | subject evaluated (string, 2226 chars, by position) · own false · R true · Rass true · outside block 1109-1235: code ✓ @800 |
| 2 | scripts/benchmark.mjs:1127 | `/console\.log\('benchmark: /` | scripts/benchmark.mjs:1126 | not the shape — code-satisfied | subject evaluated (string, 124 chars, by position) · own false · R true · Rass true · outside block 710-1195: code ✓ @1348 |
| 3 | scripts/brain.mjs:5637 | `"daemon-worker"` | scripts/brain.mjs:5636 | not the shape — array membership over dispatch lines | subject evaluated (array, 117 chars, by content) · own false · R true · Rass true · outside block 4634-6996: n/a |
| 4 | scripts/brain.mjs:6023 | `/absentEvidenceHistory\(/` | scripts/brain.mjs:6022 | not the shape — code-satisfied | subject evaluated (string, 12172 chars, by position) · own false · R true · Rass true · outside block 4634-6996: code ✓ @7519 |
| 5 | scripts/brain.mjs:6024 | `/LEDGER \+ "\.1"/` | scripts/brain.mjs:6022 | not the shape — code-satisfied | subject evaluated (string, 12172 chars, by position) · own false · R true · Rass true · outside block 4634-6996: code ✓ @7519 |
| 6 | scripts/brain.mjs:6024 | `/brain: inputs history —/` | scripts/brain.mjs:6022 | not the shape — code-satisfied | subject evaluated (string, 12172 chars, by position) · own false · R true · Rass true · outside block 4634-6996: code ✓ @7524 |
| 7 | scripts/brain.mjs:6054 | `/clippedEvidenceHistory\(/` | scripts/brain.mjs:6053 | not the shape — code-satisfied | subject evaluated (string, 12172 chars, by position) · own false · R true · Rass true · outside block 4634-6996: code ✓ @7535 |
| 8 | scripts/brain.mjs:6055 | `/brain: inputs elision —/` | scripts/brain.mjs:6053 | not the shape — code-satisfied | subject evaluated (string, 12172 chars, by position) · own false · R true · Rass true · outside block 4634-6996: code ✓ @7543 |
| 9 | scripts/brain.mjs:6060 | `/inputs_clipped: inputs_clipped \?\? null/` | scripts/brain.mjs:6059 | not the shape — code-satisfied | subject evaluated (string, 6176 chars, by position) · own false · R true · Rass true · outside block 4634-6996: code ✓ @7598 |
| 10 | scripts/brain.mjs:6061 | `/inputs_rows_dropped: inputs_rows_dropped \?\? nul` | scripts/brain.mjs:6059 | not the shape — code-satisfied | subject evaluated (string, 6176 chars, by position) · own false · R true · Rass true · outside block 4634-6996: code ✓ @7599 |
| 11 | scripts/capture.mjs:2535 | `/process\.exit\(1\)/` | scripts/capture.mjs:2534 | not the shape — code-satisfied | subject evaluated (string, 632 chars, by position) · own false · R true · Rass true · outside block 1674-2613: code ✓ @2682 |
| 12 | scripts/capture.mjs:2537 | `/did NOT land/` | scripts/capture.mjs:2536 | not the shape — code-satisfied | subject evaluated (string, 4026 chars, by position) · own false · R true · Rass true · outside block 1674-2613: code ✓ @2678 |
| 13 | scripts/capture.mjs:2537 | `/NOT on disk/` | scripts/capture.mjs:2536 | not the shape — code-satisfied | subject evaluated (string, 4026 chars, by position) · own false · R true · Rass true · outside block 1674-2613: code ✓ @2678 |
| 14 | scripts/context.mjs:962 | `/const BOOT_MS = Date\.now\(\) - process\.uptime\(` | scripts/context.mjs:961 | not the shape — code-satisfied | subject evaluated (string, 7865 chars, by position) · own false · R true · Rass true · outside block 693-1245: code ✓ @1300 |
| 15 | scripts/context.mjs:963 | `/buildVerdict\(BOOT_MS, graphNow\(\)\)/` | scripts/context.mjs:961 | not the shape — code-satisfied | subject evaluated (string, 7865 chars, by position) · own false · R true · Rass true · outside block 693-1245: code ✓ @1318 |
| 16 | scripts/context.mjs:965 | `/--daemon RETIRING/` | scripts/context.mjs:961 | not the shape — code-satisfied | subject evaluated (string, 7865 chars, by position) · own false · R true · Rass true · outside block 693-1245: code ✓ @1331 |
| 17 | scripts/context.mjs:965 | `/\bbreak;/` | scripts/context.mjs:961 | not the shape — code-satisfied | subject evaluated (string, 7865 chars, by position) · own false · R true · Rass true · outside block 693-1245: code ✓ @1333 |
| 18 | scripts/context.mjs:1042 | `/catch \(e\) \{[\s\S]*faultNote\(/` | scripts/context.mjs:1041 | not the shape — code-satisfied | subject evaluated (string, 7865 chars, by position) · own false · R true · Rass true · outside block 693-1245: code ✓ @1359 |
| 19 | scripts/context.mjs:1043 | `/faults\+\+/` | scripts/context.mjs:1041 | not the shape — code-satisfied | subject evaluated (string, 7865 chars, by position) · own false · R true · Rass true · outside block 693-1245: code ✓ @1364 |
| 20 | scripts/context.mjs:1043 | `/writeAtomic\(CONTEXT_STATE, withFault\(readJson\(` | scripts/context.mjs:1041 | not the shape — code-satisfied | subject evaluated (string, 7865 chars, by position) · own false · R true · Rass true · outside block 693-1245: code ✓ @1369 |
| 21 | scripts/context.mjs:1044 | `/--daemon poll FAULTED/` | scripts/context.mjs:1041 | not the shape — code-satisfied | subject evaluated (string, 7865 chars, by position) · own false · R true · Rass true · outside block 693-1245: code ✓ @1370 |
| 22 | scripts/context.mjs:1044 | `/--daemon recovered/` | scripts/context.mjs:1041 | not the shape — code-satisfied | subject evaluated (string, 7865 chars, by position) · own false · R true · Rass true · outside block 693-1245: code ✓ @1356 |
| 23 | scripts/context.mjs:1068 | `/import \{ keep, KEEP_EXIT \} from "\.\/keeper\.mj` | scripts/context.mjs:1067 | not the shape — code-satisfied | subject evaluated (string, 114359 chars, by position) · own false · R true · Rass true · outside block 693-1245: code ✓ @83 |
| 24 | scripts/context.mjs:1069 | `/await keep\(\{ name: "context", worker: \[process` | scripts/context.mjs:1067 | not the shape — code-satisfied | subject evaluated (string, 1289 chars, by position) · own false · R true · Rass true · outside block 693-1245: code ✓ @1287 |
| 25 | scripts/context.mjs:1108 | `/export const STAMP_FRESH_MS = 3 \* CONTEXT_POLL_M` | scripts/context.mjs:1106 | not the shape — code-satisfied | subject evaluated (string, 114359 chars, by position) · own false · R true · Rass true · outside block 693-1245: code ✓ @127 |
| 26 | scripts/context.mjs:1109 | `/export const CONTEXT_POLL_MS = DOOR\.pollMs \\|\\| ` | scripts/context.mjs:1106 | not the shape — code-satisfied | subject evaluated (string, 114359 chars, by position) · own false · R true · Rass true · outside block 693-1245: code ✓ @126 |
| 27 | scripts/context.mjs:1149 | `/if \(posted\) \(deps\.save \\|\\| \(\(o\) => writeA` | scripts/context.mjs:1140 | not the shape — code-satisfied | subject evaluated (string, 114359 chars, by position) · own false · R true · Rass true · outside block 693-1245: code ✓ @325 |
| 28 | scripts/context.mjs:1160 | `/const stamp = deps\.stamp !== undefined \? deps\.` | scripts/context.mjs:1156 | not the shape — code-satisfied | subject evaluated (string, 114359 chars, by position) · own false · R true · Rass true · outside block 693-1245: code ✓ @510 |
| 29 | scripts/context.mjs:1161 | `/vbs\.includes\(RESIDENT_MATCH\)/` | scripts/context.mjs:1156 | not the shape — code-satisfied | subject evaluated (string, 114359 chars, by position) · own false · R true · Rass true · outside block 693-1245: code ✓ @532 |
| 30 | scripts/context.mjs:1177 | `/const STATE_DIR = DOOR\.stateDir \\|\\| join\(__dir` | scripts/context.mjs:1164 | not the shape — code-satisfied | subject evaluated (string, 114359 chars, by position) · own false · R true · Rass true · outside block 693-1245: code ✓ @106 |
| 31 | scripts/cortex.mjs:1823 | `/consolidate/` | scripts/cortex.mjs:1822 | not the shape — a doc-wire on header PROSE (by design) | subject evaluated (string, 2334 chars, by position) · own false · R true · Rass true · outside block 1046-1887: comment only @28 |
| 32 | scripts/dugout.mjs:4269 | `/wakeTheWatcher\(\);/` | scripts/dugout.mjs:4268 | not the shape — code-satisfied | subject evaluated (string, 3519 chars, by position) · own false · R true · Rass true · outside block 3324-5244: code ✓ @6779 |
| 33 | scripts/dugout.mjs:4273 | `/observeAndSaveTurn\(body\.lines, new Date\(\), ju` | scripts/dugout.mjs:4272 | not the shape — code-satisfied | subject evaluated (string, 3519 chars, by position) · own false · R true · Rass true · outside block 3324-5244: code ✓ @6763 |
| 34 | scripts/dugout.mjs:4274 | `/superviseTurn\(r\.state, r\.standing, body\.lines` | scripts/dugout.mjs:4272 | not the shape — code-satisfied | subject evaluated (string, 3519 chars, by position) · own false · R true · Rass true · outside block 3324-5244: code ✓ @6769 |
| 35 | scripts/dugout.mjs:4284 | `"[brief, tail].filter(Boolean)"` | scripts/dugout.mjs:4283 | not the shape — code-satisfied | subject evaluated (string, 700 chars, by position) · own false · R true · Rass true · outside block 3324-5244: code ✓ @6693 |
| 36 | scripts/dugout.mjs:4363 | `/starvedNightFor\(/` | scripts/dugout.mjs:4358 | not the shape — code-satisfied | subject evaluated (string, 2880 chars, by position) · own false · R true · Rass true · outside block 3324-5244: code ✓ @2824 |
| 37 | scripts/dugout.mjs:4369 | `/never as a fact/` | scripts/dugout.mjs:4358 | not the shape — code-satisfied | subject evaluated (string, 2880 chars, by position) · own false · R true · Rass true · outside block 3324-5244: code ✓ @2828 |
| 38 | scripts/dugout.mjs:5208 | `/join\(__dirname, "fuelboard\.mjs"\), "fault", id\` | scripts/dugout.mjs:5207 | not the shape — code-satisfied | subject evaluated (string, 1200 chars, by position) · own false · R true · Rass true · outside block 3324-5244: code ✓ @6821 |
| 39 | scripts/dugout.mjs:5239 | `/timeout: shTimeoutMs\(script, argv\)/` | scripts/dugout.mjs:5235 | not the shape — code-satisfied | subject evaluated (string, 400 chars, by position) · own false · R true · Rass true · outside block 3324-5244: code ✓ @2067 |
| 40 | scripts/dugout.mjs:5239 | `/sh\("gaffer_brain\.mjs", \["judge-round"\]\)/` | scripts/dugout.mjs:5235 | not the shape — code-satisfied | subject evaluated (string, 606176 chars, by position) · own false · R true · Rass true · outside block 3324-5244: code ✓ @2212 |
| 41 | scripts/forge_session.mjs:2021 | `/const\s+recorded\s*=\s*appendCoverage\(prev,\s*"f` | scripts/forge_session.mjs:2014 | not the shape — code-satisfied | subject evaluated (string, 1406 chars, by position) · own false · R true · Rass true · outside block 1574-2592: code ✓ @2813 |
| 42 | scripts/forge_session.mjs:2022 | `/forceDiscardLines\(prev,\s*recorded,\s*cov\)/` | scripts/forge_session.mjs:2014 | not the shape — code-satisfied | subject evaluated (string, 1406 chars, by position) · own false · R true · Rass true · outside block 1574-2592: code ✓ @2817 |
| 43 | scripts/forge_session.mjs:2284 | `"capsule_map.json"` | (no enclosing assert) | not the shape — code-satisfied | subject evaluated (string, 4650 chars, by position) · own false · R true · Rass true · outside block 1574-2592: code ✓ @2713 |
| 44 | scripts/forge_session.mjs:2398 | `/now\\|done\\|defer/` | scripts/forge_session.mjs:2396 | not the shape — a doc-wire on header PROSE (by design) | subject evaluated (string, 923 chars, by position) · own false · R true · Rass true · outside block 1574-2592: comment only @75 |
| 45 | scripts/forge_session.mjs:2398 | `/now\\|done\\|defer/` | scripts/forge_session.mjs:2396 | not the shape — code-satisfied | subject evaluated (string, 427 chars, by position) · own false · R true · Rass true · outside block 1574-2592: code ✓ @3176 |
| 46 | scripts/gaffer_brain.mjs:3899 | `/field_probes\.json/` | scripts/gaffer_brain.mjs:3898 | not the shape — code-satisfied | subject evaluated (string, 212895 chars, by position) · own false · R true · Rass true · outside block 2874-4038: code ✓ @162 |
| 47 | scripts/learnstate.mjs:2016 | `/import \{[^}]*\} from "\.\/resume_pointer\.mjs";/` | (no enclosing assert) | not the shape — code-satisfied | subject evaluated (string, 51485 chars, by content) · own false · R true · Rass true · outside block 1329-2174: ✓ (content cut) |
| 48 | scripts/learnstate.mjs:2151 | `/console\.log\(p\);\s*printed = p;/` | scripts/learnstate.mjs:2148 | not the shape — code-satisfied | subject evaluated (string, 3889 chars, by content) · own false · R true · Rass true · outside block 1329-2174: ✓ (content cut) |
| 49 | scripts/learnstate.mjs:2151 | `/recordBrief\(printed, \{ now \}\)/` | scripts/learnstate.mjs:2148 | not the shape — code-satisfied | subject evaluated (string, 3889 chars, by content) · own false · R true · Rass true · outside block 1329-2174: ✓ (content cut) |
| 50 | scripts/mutagen.mjs:967 | `/NODE_V8_COVERAGE/` | scripts/mutagen.mjs:966 | **SAME SHAPE** | subject evaluated (string, 43167 chars, by content) · own true · R true · Rass true · outside block 874-991: ✓ (content cut) |
| 51 | scripts/nightshift.mjs:1587 | `/deps\.concepts \\|\\| drillConcepts\(deps\)/` | scripts/nightshift.mjs:1586 | not the shape — code-satisfied | subject evaluated (string, 900 chars, by position) · own false · R true · Rass true · outside block 1383-1990: code ✓ @343 |
| 52 | scripts/outbox.mjs:511 | `/ingest\(\)/` | scripts/outbox.mjs:510 | not the shape — code-satisfied | subject evaluated (string, 3801 chars, by position) · own false · R true · Rass true · outside block 384-576: code ✓ @652 |
| 53 | scripts/outbox.mjs:513 | `/try \{ ingest\(\); \} catch/` | scripts/outbox.mjs:512 | not the shape — code-satisfied | subject evaluated (string, 3801 chars, by position) · own false · R true · Rass true · outside block 384-576: code ✓ @652 |
| 54 | scripts/outbox.mjs:515 | `/BACKLOG_LOUD/` | scripts/outbox.mjs:514 | not the shape — code-satisfied | subject evaluated (string, 3801 chars, by position) · own false · R true · Rass true · outside block 384-576: code ✓ @667 |
| 55 | scripts/outbox.mjs:515 | `/pending\(\)\.length/` | scripts/outbox.mjs:514 | not the shape — code-satisfied | subject evaluated (string, 3801 chars, by position) · own false · R true · Rass true · outside block 384-576: code ✓ @666 |
| 56 | scripts/postmatch.mjs:949 | `"NOTES NOT DONE"` | scripts/postmatch.mjs:948 | not the shape — code-satisfied | subject evaluated (string, 1190 chars, by position) · own false · R true · Rass true · outside block 905-1349: code ✓ @1585 |
| 57 | scripts/postmatch.mjs:1178 | `/fits\(JUDGE_CHILD_MS \+ CHILD_TIMEOUT_MS\)/` | scripts/postmatch.mjs:1176 | not the shape — code-satisfied | subject evaluated (string, 578 chars, by position) · own false · R true · Rass true · outside block 905-1349: code ✓ @853 |
| 58 | scripts/postmatch.mjs:1178 | `/run\("gaffer_brain\.mjs", \["judge-due"[^\n]*time` | scripts/postmatch.mjs:1176 | not the shape — code-satisfied | subject evaluated (string, 578 chars, by position) · own false · R true · Rass true · outside block 905-1349: code ✓ @857 |
| 59 | scripts/postmatch.mjs:1187 | `/timeout: s\.ms/` | scripts/postmatch.mjs:1186 | not the shape — code-satisfied | subject evaluated (string, 11030 chars, by position) · own false · R true · Rass true · outside block 905-1349: code ✓ @857 |
| 60 | scripts/postmatch.mjs:1206 | `/writeAtomic\(pmFile/` | scripts/postmatch.mjs:1205 | not the shape — code-satisfied | subject evaluated (string, 11030 chars, by position) · own false · R true · Rass true · outside block 905-1349: code ✓ @870 |
| 61 | scripts/postmatch.mjs:1256 | `/else if \(CARD_ANCHORS\.includes\(anchor\)\) card` | scripts/postmatch.mjs:1255 | not the shape — code-satisfied | subject evaluated (string, 11030 chars, by position) · own false · R true · Rass true · outside block 905-1349: code ✓ @896 |
| 62 | scripts/postmatch.mjs:1256 | `/dayCloseCard\(/g` | scripts/postmatch.mjs:1255 | not the shape — code-satisfied | subject evaluated (string, 11030 chars, by position) · own false · R true · Rass true · outside block 905-1349: code ✓ @896 |
| 63 | scripts/postmatch.mjs:1257 | `/let card = "no card \(the morning anchor files no` | scripts/postmatch.mjs:1255 | not the shape — code-satisfied | subject evaluated (string, 11030 chars, by position) · own false · R true · Rass true · outside block 905-1349: code ✓ @893 |
| 64 | scripts/postmatch.mjs:1259 | `/run\("captains_call\.mjs", \["reline", "--family"` | scripts/postmatch.mjs:1258 | not the shape — code-satisfied | subject evaluated (string, 2808 chars, by position) · own false · R true · Rass true · outside block 905-1349: code ✓ @717 |
| 65 | scripts/postmatch.mjs:1260 | `/run\("captains_call\.mjs", \["file", "--line", da` | scripts/postmatch.mjs:1258 | not the shape — code-satisfied | subject evaluated (string, 2808 chars, by position) · own false · R true · Rass true · outside block 905-1349: code ✓ @721 |
| 66 | scripts/postmatch.mjs:1342 | `/if \(!isRealDay\(dateStr\)\) refuse\(/` | scripts/postmatch.mjs:1341 | not the shape — code-satisfied | subject evaluated (string, 17402 chars, by position) · own false · R true · Rass true · outside block 905-1349: code ✓ @1446 |
| 67 | scripts/postmatch.mjs:1342 | `/if \(dateStr > today\) refuse\(/` | scripts/postmatch.mjs:1341 | not the shape — code-satisfied | subject evaluated (string, 17402 chars, by position) · own false · R true · Rass true · outside block 905-1349: code ✓ @1447 |
| 68 | scripts/postmatch.mjs:1342 | `/if \(t == null\) refuse\(/` | scripts/postmatch.mjs:1341 | not the shape — code-satisfied | subject evaluated (string, 17402 chars, by position) · own false · R true · Rass true · outside block 905-1349: code ✓ @1451 |
| 69 | scripts/postmatch.mjs:1342 | `/if \(hisResultOf\(t\)\) refuse\(/` | scripts/postmatch.mjs:1341 | not the shape — code-satisfied | subject evaluated (string, 17402 chars, by position) · own false · R true · Rass true · outside block 905-1349: code ✓ @1452 |
| 70 | scripts/postmatch.mjs:1343 | `/existsSync\(join\(PM_DIR, dateStr \+ "\.md"\)\) &` | scripts/postmatch.mjs:1341 | not the shape — code-satisfied | subject evaluated (string, 17402 chars, by position) · own false · R true · Rass true · outside block 905-1349: code ✓ @1464 |
| 71 | scripts/sitting.mjs:2083 | `/timeout: ownerTimeoutMs\(file, args\)/` | scripts/sitting.mjs:2079 | not the shape — code-satisfied | subject evaluated (string, 700 chars, by position) · own false · R true · Rass true · outside block 1532-2102: code ✓ @238 |
| 72 | scripts/sitting.mjs:2084 | `/owner\("gaffer_brain\.mjs", \["judge-due", "--tri` | scripts/sitting.mjs:2079 | not the shape — code-satisfied | subject evaluated (string, 199496 chars, by position) · own false · R true · Rass true · outside block 1532-2102: code ✓ @1044 |
| 73 | scripts/sitting.mjs:2095 | `/await session\.close\(\)/` | scripts/sitting.mjs:2094 | not the shape — code-satisfied | subject evaluated (string, 6352 chars, by position) · own false · R true · Rass true · outside block 1532-2102: code ✓ @1073 |
| 74 | scripts/sitting.mjs:2097 | `/post\("\/close", \{ reason: opt\("--reason"\) \\|\` | scripts/sitting.mjs:2094 | not the shape — code-satisfied | subject evaluated (string, 199496 chars, by position) · own false · R true · Rass true · outside block 1532-2102: code ✓ @1477 |
| 75 | scripts/teaching_contract.mjs:1647 | `/preCyborg\(/` | scripts/teaching_contract.mjs:1638 | not the shape — code-satisfied | subject evaluated (string, 1940 chars, by content) · own false · R true · Rass true · outside block 1157-1682: ✓ (content cut) |
| 76 | scripts/teaching_contract.mjs:1647 | `/done_pre_restart/` | scripts/teaching_contract.mjs:1638 | not the shape — code-satisfied | subject evaluated (string, 1940 chars, by content) · own false · R true · Rass true · outside block 1157-1682: ✓ (content cut) |
| 77 | scripts/teaching_contract.mjs:1668 | `/refusedSave\("print/` | scripts/teaching_contract.mjs:1666 | not the shape — code-satisfied | subject evaluated (string, 5518 chars, by position) · own false · R true · Rass true · outside block 1157-1682: code ✓ @1717 |
| 78 | scripts/teaching_contract.mjs:1678 | `/fallbackTx\(tx, heldTx\)/` | scripts/teaching_contract.mjs:1677 | not the shape — code-satisfied | subject evaluated (string, 5518 chars, by position) · own false · R true · Rass true · outside block 1157-1682: code ✓ @1755 |

---

## Q3 · The census as a count the law pack carries on its machine line

WHERE IT GOES (all `scripts/lawpack.mjs`, base 4b00cf5):

| Step | Code path | Line, at this base |
|---|---|---|
| L1 | A new exported judge, `ownLiteralPins({root, dirs, kit})`. It ports mcon's definition verbatim: `selfSatisfied()` and `range()` from `ci/mcon/census_mcon.mjs` at 4c4feb8. The census file stays on mcon's branch as its record (L9). The judge uses the pack's own lazy `acornKit()`. | `acornKit` :399-404 · `parseModule` :405 · sibling judge `importReads` :439 |
| L2 | The judge walks `dirs = ["scripts", "hooks"]`, the same as `importReads`. Measured: all 145 walked files' hits lie under `scripts/`, and the 6 files outside it (`.claude` 1 · `ci` 2 · `eslint.config.mjs` 1 · `hooks` 1 · `setup` 1, 19 Nov 2026) carry none. Whether to widen to `ci/` is **F7**. | — |
| L3 | `measure()` adds `"own-literal-pin": olp.findings.length` to `counts`. | `counts` :636-648 |
| L4 | The machine line prints every key of `m.counts`, so the new count appears on it with no new print. | `scripts/lawpack.mjs:959-960` (`lawpack · … findings: …`) |
| L5 | `BASELINE` gains `"own-literal-pin": <N>`, N read from the tree (below). | `BASELINE` :123-155 |
| L6 | `judge()` already turns one more into `own-literal-pin ROSE — …` RED. A missing key arriving with findings is already `NEW LAW … never grandfathered`. | `judge` :559-571 |
| L7 | `judgeMeasured()` gains the acorn-dead branch. No acorn means `INSTRUMENT DEAD — own-literal census`, a RED that drops the key's FALL, never a 0 (L2 / fate 35's law). | `judgeMeasured` :656-686, beside the `ig` branch :670-677 |
| L8 | It reaches the neutral machine through what already exists. `organism_test.mjs` mode `lawpack` runs `lawpack.mjs gate` and REDs on its exit, and `npm test` = `node scripts/organism_test.mjs all` (package.json `test`). | `scripts/organism_test.mjs:2690-2700` |
| L9 | The selftest's RATCHET loop over `Object.keys(BASELINE)` covers the new key with no new code. The new judge gets its plant both ways (below). | `scripts/lawpack.mjs:762-765` · `selftest` :751 |

THE BASELINE IT WOULD FREEZE is read from the tree at the law's landing by the law itself (`node scripts/lawpack.mjs report`, the
`own-literal-pin` figure). It is never typed from this spec, because the number depends on which units land first (**F2**). Read
today from this base by the same definition:

```
own-literal-pin at 4b00cf5 (census definition, 19 Nov 2026): 39   — with mcon's 4c4feb8 landed first: 38
+ mutagen:967 if L1's range() also follows a whole-line-comment filter (F6):  40 / 39
after mpin-read + mpin-narrow land: 0 (every row of Q1 leaves the class), so the baseline freezes at 0 if the law lands last
```

THE UNRESOLVED COUNT (**F6**). mcon's range() leaves 78 sites unresolved (19 Nov 2026), and one of them is a dead pin. So a new unresolved
site can hide a new dead pin. The proposal carries it as a second key, `own-source-pin-unresolved`, frozen at its count read from the
tree. A new unresolved site is then RED until the evaluator resolves it, or the site declares `law-waiver:own-literal-pin` with its why
(the pack's existing waiver form, `WAIVER()` at :98).

---

## Q4 · THE BUILD SPLIT, by concern and not by directory

| Unit | Concern | Files | Rows |
|---|---|---|---|
| **mpin-read** | A pin that can read behaviour or output reads it | `scripts/dugout.mjs` (execTool ×5, wakeTheWatcher ×1) · `scripts/capture.mjs` (pullFromInbox ×1, `quarantine` child ×1) · `scripts/intent.mjs` (`stop` child ×3) · `scripts/examiner.mjs` (`stage` child ×1) · `scripts/awayday.mjs` (red-path child ×1) — each inside its own `selftest`, and nothing outside it | 13, plus conductor by landing mcon 4c4feb8 |
| **mpin-narrow** | A wiring pin reads the declaration it names, never its own file whole | the primitive's home (F1) · `scripts/audit.mjs` ×9 · `scripts/awayday.mjs` ×4 · `scripts/dugout.mjs` ×8 + the REMOVE ×1 · `scripts/forge_session.mjs` ×1 · `scripts/gaffer_brain.mjs` ×1 · `scripts/gates.mjs` ×1 · `scripts/mutagen.mjs` ×1 | 26 |
| **mpin-law** | A new own-literal pin is a new red on the neutral machine | `scripts/lawpack.mjs` only (L1-L9) | the count |

dugout and awayday sit in two units because the split is by concern. Their edits are in disjoint asserts of one selftest, so two
seats on the same file need a stacking order (**F2**).

---

## WITNESS CLAUSES · RED on base 4b00cf5, GREEN on the build · one mutant per clause

Every witness is planted under `os.tmpdir()` by node, judges a FRESH clone (F7 of mcon, row 1149 (3)), binds no port and makes no model
call. Each clause is one plant: a source mutation of the CODE under test, never of the test. It is RED on the build because the
repaired pin now sees the mutation. It is GREEN on base, because the base pin is satisfied by its own literal whatever the code says.
That inverted reading is the class's proof, and it is how mcon's F1-F3 read. The witness's own verdict is `RED` on base (the defect
stands) and `GREEN` on the build.

### mpin-read
| Clause | Plant (mutation of the code under test) | Base | Build | Mutant (breaks the repair; the clause must catch it) |
|---|---|---|---|---|
| R1 | `scripts/dugout.mjs:2340` refusal text loses "NOT answered" | selftest GREEN (own literal) | selftest RED | the repaired assert put back on `SRCX` |
| R2 | `:2352` `_use` loses "THIS ONE IS NOT DONE YET" | GREEN | RED | `deps.sh` dropped, so the real `execFileSync` runs (the clause also records that no child_process door opened) |
| R3 | `:2947` wakeTheWatcher `stdio: "inherit"` | GREEN (the pin hits autoOpenSitting :2052) | RED | the recorder asserts on autoOpenSitting instead |
| R4 | `:1144` `quarantine_error` key renamed | GREEN | RED | the READ asserts `"quarantine_error" in` on a literal object |
| R5 | `scripts/intent.mjs:332` the ARSENAL_ORGAN guard removed | GREEN | RED (the child appends) | the child run's state-dir compare dropped |
| R6 | `scripts/examiner.mjs:903` the ⚠ branch removed | GREEN | RED | the planted outgoing drill given `served` |
| R7 | `scripts/awayday.mjs:1260` the NOT RUN line removed | GREEN | RED | the child's stderr no longer read |
| R8 | `scripts/capture.mjs:2908` `mode === "quarantine"` renamed | GREEN | RED | the planted sidecar removed |
| R-ONE | any byte outside the named selftest asserts | — | RED | edit a comment in main() |

### mpin-narrow
| Clause | Plant | Base | Build | Mutant |
|---|---|---|---|---|
| N0 | the primitive's three refusals: anchor missing → throws · range touching `function selftest…(` → throws · comment-only text → false | primitive absent → RED | GREEN | `ownCode` returns the whole file |
| N1…N25 | one per NARROW row: delete exactly the pinned text at its `code ✓ @L` (Q1's measurement column) | GREEN (own literal) | RED | that assert's subject put back to `readFileSync(self)` |
| NX | dugout:4592 REMOVE: the pin is gone and `CROSS_MOUTH_FRESH_MS === 10 * 60000` still stands | pin present → RED | GREEN | the conjunct dropped with it |

### mpin-law
| Clause | Plant | Base | Build | Mutant |
|---|---|---|---|---|
| W1 | the machine line carries `own-literal-pin <n>`, and n equals `classify_mpin`'s same-shape count on the same tree | key absent → RED | GREEN | the key dropped from `counts` |
| W2 | a temp tree plus one new `assert("x", /ZZ/.test(readFileSync(fileURLToPath(import.meta.url),"utf8")) && "ZZ")` → `own-literal-pin ROSE` | no such key → RED | GREEN | `judge()` skips the key |
| W3 | acorn hidden → `INSTRUMENT DEAD — own-literal census`, no FALL printed | RED | GREEN | the dead branch returns 0 |
| W4 | `BASELINE["own-literal-pin"]` equals the count the judge reads on the landing tree | RED | GREEN | the baseline typed one higher |
| W5 | the new judge's plant is CLEAN for a narrowed `ownCode` subject and for the house concatenated needle (`scripts/dugout.mjs:4255`) | RED | GREEN | `range()` treats any call on self-source as whole-file |

The witness reads the machine line's `own-literal-pin` figure only, never the gate's exit, because the gate is already RED on base
for jugad and depcruise (F2 of mcon, mlaw's).

---

## FORKS (the architect rules; each has its options lettered, a recommendation, and the measurement that decides it)

- **F1 · where `ownCode` lives.**
  - Options: (a) a new module `scripts/own_source.mjs` (SOLE WRITER of nothing) · (b) inline in each organ that narrows ·
    (c) inside an existing shared module.
  - **Recommend (a).** One code path, one selftest of its refusals, and one name the law pack's W5 can model.
  - It decides on: `grep -c "readFileSync(fileURLToPath(import.meta.url)" scripts/*.mjs` (the narrowing's future users); a file beyond
    the named set needs this ruling.
- **F2 · the order of the units, which fixes the frozen baseline.**
  - Options: (a) law first, frozen at the count then (39, or 38 after mcon), and each later unit tightens it on its FALL line ·
    (b) mcon → read → narrow → law, frozen at 0 · (c) all three in one stack.
  - **Recommend (a).** The class is held from the first landing, and the ratchet's existing FALL line (`judge` :564) drives the rest.
    (b) leaves the class unguarded while two units are in flight.
  - It decides on: the `own-literal-pin` figure on `lawpack report` at each land branch.
- **F3 · three NARROWs that could be READs with a recorded child_process door:** awayday checkLane's default `fileCardFn` (:678-680,
  no door), audit `runAudit`'s fixer chain (git worktree), and gates' `main` (needs ajv inside the copy).
  - Options: (a) NARROW now (this spec) · (b) READ via a preloaded door recorder like mcon's guard, extended to record argv.
  - **Recommend (a)**, with (b) as its own later unit. The pins' claims are wiring, and a READ here costs a git worktree or node_modules
    in a temp copy.
  - It decides on: whether a copy can resolve `ajv` (`node -e "import('ajv')"` from a temp copy with `NODE_OPTIONS` unset, on his laptop).
- **F4 · dugout:4592's claim "the SAME TTL deepFresh() already uses".**
  - Options: (a) REMOVE the pin (this spec; the conjunct `CROSS_MOUTH_FRESH_MS === 10 * 60000` stays) · (b) a build hoists deepFresh's
    inline `10 * 60000` (`scripts/dugout.mjs:251`) into the one constant both read, so the claim becomes code (a production edit,
    outside the selftest).
  - **Recommend (a)** in this class, and (b) only by its own ruling.
  - It decides on: `grep -n "10 \* 60000" scripts/dugout.mjs`.
- **F5 · the bound on each new child run.**
  - Options: (a) reuse each organ's own named timeout constant · (b) reuse conductor's `STEP_TIMEOUT_MS` everywhere.
  - **Recommend (a).** No number typed, and the bound is the organ's own.
  - It decides on: `grep -n "TIMEOUT_MS =" scripts/{intent,examiner,awayday,capture}.mjs`. Not every one has one (unmeasured here,
    NAMED below), and an organ with none needs this ruling.
- **F6 · the 78 unresolved.**
  - Options: (a) extend `range()` to the whole-line-comment filter (resolves mutagen:967) · (b) also freeze `own-source-pin-unresolved`
    at its tree count · (c) both · (d) neither, list only.
  - **Recommend (c).** One of the 78 was dead, so the unresolved lane is where the next one hides.
  - It decides on: `classify_mpin` same-shape among the unresolved (1 at 4b00cf5, 19 Nov 2026).
- **F7 · the law's walk.**
  - Options: (a) `scripts/` + `hooks/` like `importReads` · (b) every tracked `*.mjs` / `*.js` like mcon's census.
  - **Recommend (a).** Seat `ci/` trees are proofs on branches, and main's `ci/` holds 2 files with 0 hits (19 Nov 2026).
  - It decides on: the census over `ci/` on main.
- **F8 · the branch.** The brief names `claude/mpin-spec`, while the session's default branch is
  `claude/mpin-queue-effort-receipt-p95zid` (the seat's effort commit). The work is on `claude/mpin-spec` as the brief says. No PR is
  opened, because the brief forbids it.

## NAMED, NOT GUESSED (what the cloud could not reach, and what would measure it on his laptop)
- **N1 · Windows.** Every READ's child run and the `ownCode` folding are written for CRLF / Windows, but the measurements here ran on
  Linux LF clones. To measure: `node ci/mpin/classify_mpin.mjs --org <his checkout> --census <census --json>` on his laptop. Its last
  line must equal the one in Q0.
- **N2 · the organs' own timeout constants for F5.** Not read here. To measure: `grep -n "TIMEOUT_MS =" scripts/intent.mjs
  scripts/examiner.mjs scripts/awayday.mjs scripts/capture.mjs`.
- **N3 · whether `examiner.mjs stage`, `capture.mjs quarantine` and awayday's red path run on a temp copy with only `registry.json`**,
  as conductor's did (mcon F6). Not run here, because this seat builds nothing. To measure: the mpin-read seat runs each child once on a
  copy and names any second state file its import graph needs, as mcon named the registry.
- **N4 · the LIVE selftests.** The hermetic profile names the touched organs and does not run them (base: `LIVE 126 (hermetic: named,
  not run)`, 19 Nov 2026). Their before/after headline lines need `node scripts/<organ>.mjs selftest` on his laptop, or the neutral
  machine's `organism:selftest` chain.
- **N5 · the gate on base.** It is RED for reasons that are mlaw's (F2 / row 1149 (3)). Whether mlaw lands before mpin-law changes
  nothing in W1-W5 (they read the key, not the exit), but it changes the gate's exit the seat will see.

## THE NAMED FILES A BUILD WOULD TOUCH
- Every build, by Q4: `scripts/dugout.mjs` · `scripts/capture.mjs` · `scripts/intent.mjs` · `scripts/examiner.mjs` ·
  `scripts/awayday.mjs` · `scripts/audit.mjs` · `scripts/forge_session.mjs` · `scripts/gaffer_brain.mjs` · `scripts/gates.mjs` ·
  `scripts/mutagen.mjs` · `scripts/lawpack.mjs`, plus mcon's `scripts/conductor.mjs` as landed at 4c4feb8.
- Each build's `ci/<unit>/` witness, mutants, PROOF and LEDGER.
- Beyond them, as forks: `scripts/own_source.mjs` (F1 a) and dugout's production constant (F4 b).
- **Never touched:** `.claude/settings.json`, `dressing-room/state/`, and `package.json`. The suite already runs every touched organ's
  selftest and `lawpack gate`.

## SUITE AT THIS BASE (the seat's measurement; never the bare `npm test`)
```
$ ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all      (LF clone 4b00cf5, npm ci, 19 Nov 2026)
organism_test: 147 passed, 3 failed · ruled 0 · UNRULED 3 · LIVE 126 (hermetic: named, not run)
```
- The three reds are the same three that mcon's PROOF names at 3f84c80: the selftest-coverage law, the sandbox member, and the hermetic
  roll-up. The pass count moved because mrung's tip added members.
- The sandbox red's own detail reads `recorded 2: fetch, spawn-billing … the live state file the canary aimed at was never created`.
  Yet the run left `dressing-room/state/CANARY_MUST_NEVER_EXIST.json` untracked in the /tmp clone. That is named here as found; it is
  outside this unit, and the clone is not the repo.

## CI OF THIS BRANCH (public API, no token: `curl https://api.github.com/repos/nikhil1429/arsenal-ai-fc/commits/<sha>/check-runs`)
- 5b7eec1 (instrument + ledger): run 44506050078 · `npm test · node 22` (135497855852) `success` · `npm test · node 24` (135497854818) read `in_progress` at the time of reading (19 Nov 2026).
- The commit carrying this file gets its own run. It is named in the LEDGER and the final message, never typed here before it exists.
