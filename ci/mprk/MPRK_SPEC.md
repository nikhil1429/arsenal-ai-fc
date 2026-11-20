# MPRK SPEC · one owner for parked items, and the surface where each returns

Unit **mprk** · forks row 1173 (3) · residual mcap-2 (`git show b37ebfc:ci/mcap/PROOF.md`, §7, the
"Residual mcap-2" bullet after line 164). Branch `claude/mprk-spec`, cut from `origin/main` **5759cce**
(`git rev-parse FETCH_HEAD` → `5759cce4ba040299eb53ea5e0a3a8f5a7fbb6a90`, measured 20 Nov 2026). Spec only:
nothing here is built. Every `file:line` below is at 5759cce.

**HEADLINE.** A park today is a sentence in a teacher reply. Two lanes can keep its words (the MCP `note`
tool and the act tail's `note` verb, both into the hippocampus as a `thread`). Neither one brings it back
at an anchor or ever closes it. It comes back only if HE brings the same subject up again, which is the
design failure the row names. Proposed: a new organ **`scripts/parked.mjs`**, SOLE WRITER of
`dressing-room/state/parked.jsonl`, which keeps his words exactly as he said them. The teacher writes a
park through a new **`park` verb on the act lane**: a `<<ACT {…}>>` tail on the same reply that parks it,
dispatched by the Stop hook. He does nothing new. Each open park comes back as **one Captain's Call
card** (`park:<id>`), and the card ladder already deals at most one card per anchor and stays silent while
a fresh forge session is open. haan or na closes the park through its owner. baad sleeps the card to the
next local day.

---

## 1 · Measurement: every place that parks today

The command behind each row is a `grep -n` of the quoted symbol in the named file. The line shown is what that grep printed.

| # | Where a park is ORDERED or SHAPED | file:line | what it does with the parked thing |
|---|---|---|---|
| P1 | teaching contract rule `no-system-mid-concept` | `scripts/teaching_contract.mjs:197` | "naam lo, park karo, micro-question wapas" — a rule on the REPLY; records nothing |
| P2 | the 17-rule card #12 / #14 | `learning-layer/HOW_HE_LEARNS.md:423`, `:425` (evidence `:136`, `:219`) | "name it, park it" · buying topics "noted, on the list" — no list exists |
| P3 | forge / learn skills | `.claude/skills/forge/SKILL.md:77` · `.claude/skills/learn/SKILL.md:151` | "park it in one line" — prose, no writer |
| P4 | SAMJHAO_MERGED §3-A2 DEPTH CEILING + PARK BEAT | `docs/archive/SAMJHAO_MERGED__2026-08-30.md:158`, `:161` | a defect goes "to the crash belt in one line" — the crash belt is OUT OF REPO (§6 N1) |
| P5 | SAMJHAO close report | `docs/archive/SAMJHAO_MERGED__2026-08-30.md:218` · `learning-layer/teaching_gate/RULES.jsonl:451` (samjhao:R91) | "the close message includes the parked list with reasons" — a LIST at close (fork F5) |
| P6 | the teaching skeleton `[PARK]` slot | `scripts/teaching_bar.mjs:349` (trigger `parkDue` `:297`) | "ONE line naming it parked + the pointer question back, nothing else" |
| P7 | the teaching gate | `scripts/teaching_gate.mjs:39`, `:149` (`B.tools`) | a park message "passes by construction"; the fix text is the park line |
| P8 | the study rail | `scripts/rails.mjs:223` (`STUDY_DENY`), `:253` | denies mid-lesson system work with "park it: ek line" |
| P9 | the study rail lets the parking lane through | `scripts/rails.mjs:721`, `:731` | "parking rides MCP note" (row 305): `mcp__organism-memory__note` gets no opinion |
| P10 | the teaching audit | `scripts/teaching_audit.mjs:805`, `:933` | a backticked command is a compliant "named-and-parked"; nothing records the park |
| P11 | Captain's Call silence mid-concept | `scripts/captains_call.mjs:31-33`, `:1150` | a card WAITS while a fresh forge session is open; it does come back later (the only return path that works today) |
| P12 | the kickoff brief `CARRIED FROM` line | `scripts/learnstate.mjs:649` | carries the forge POINTER, never a parked item (mcap-2 confirmed) |
| P13 | organism notices held back during study | `scripts/turn_hook.mjs:311` · `scripts/learnstate.mjs:1310` | "ORGANISM: N notice(s) parked — /organism-doctor when the session closes": the return is a command he must remember (fork F6) |

Senses of "park" that are NOT his item (measured, out of scope): `scripts/scout.mjs:478` (a retired mission
FILE), `scripts/turnstile.mjs:52` and `scripts/capture.mjs:763` (unparseable data quarantined), `scripts/learnstate.mjs:1183`
(a course chapter's PARKED age tag: a reader of `current_at`, not a park).

## 2 · Measurement: every READER of a parked thing today

| lane | writer (header) | reader by file:line | returns at an anchor? | closes? |
|---|---|---|---|---|
| MCP `note(kind,text)` | `scripts/mcp-memory.mjs` owns `scribe_log.jsonl` only (header `:26`); kinds `:75` | `recall` merges scribe rows lexically, `scripts/mcp-memory.mjs:133`; a `thread` also becomes a hippocampus episode, `:168` | **no** — recall answers a query HE asks | **no** |
| act tail `note` verb | `scripts/acts.mjs:88` → `hippocampus.mjs mark thread` (`KINDS` `scripts/hippocampus.mjs:96`) | recall reflex: an open thread resurfaces "when he circles back", `scripts/hippocampus.mjs:969`, `:1051` | **no** — only when HIS turn overlaps it | **no** |
| consolidated `open_threads` | written by the model in the nightly who-he-is, `scripts/hippocampus.mjs:708`, `:772` | Gaffer prompt `scripts/gaffer_brain.mjs:264`; rehydrate `scripts/hippocampus.mjs:806`, `:836` | **no** — model-chosen, not his item; can drop it silently | **no** |
| act tail `card` verb | `scripts/acts.mjs:111` → `captains_call.mjs file --key act:<id>` | `pickCard` `scripts/captains_call.mjs:990` | **yes**, one per anchor | haan/na retire it; but it is a DECISION card, it has no concept/axis, and the decision gate wants a reason per file (`:1883-1897`) |
| crash belt line (P4) | out of repo, laptop only | `scripts/learn_digest.mjs:82-85` reads only the per-axis DOUBT MAP there | NAMED NOT GUESSED (§6 N1) | — |

So mcap-2's "nothing records it" is **half true** at 5759cce: the words CAN be recorded (two lanes), but
**nothing returns them unasked and nothing closes them**. That second half is what the row rules on.

RED on base, run 20 Nov 2026 in memory (nothing written). `dispatch` was given stub append and exec:

```
VERBS has park: false
dispatch park -> false unknown verb "park" (note|fact|pref|rule|agenda|job|card|reminder|mission|rep|design|hold)
tail acts: 0 had_tail: true
```

## 3 · The owner (proposed)

**`scripts/parked.mjs`**: a new organ. Its header line, verbatim:

```
//   SOLE WRITER of dressing-room/state/parked.jsonl (gitignored — his words verbatim). Writes NOTHING else.
```

- **File.** `dressing-room/state/parked.jsonl` is append-only. It has two row kinds:
  `{v, ev:"park", id, ts, text, concept, axis, step, door, act}` and `{v, ev:"close", id, ts, by, why}`,
  where `by` is one of `haan|na|undo|at-source`. A park is open while no close row names its id. The
  file must join `.gitignore` beside `dressing-room/state/acts.jsonl` (`.gitignore:469`, checked with
  `git check-ignore -v`), because `text` holds his words. Nothing is ever deleted or rewritten (L9).
- **Stamps.** `concept`, `axis` and `step` are read READ-ONLY from `forge_session.json`. Its sole writer
  is `scripts/forge_session.mjs:23`. A park outside a session carries `null` for all three.
- **State dir.** `ARSENAL_PARKED_STATE_DIR` is a selftest and witness seam only, the same shape as
  `ARSENAL_CALL_STATE_DIR` at `scripts/captains_call.mjs:80`.
- **CLI.** `add` (his words on stdin, never through shell quoting) · `close <id> --by <by> [--why …]` ·
  `status` (ONE line: open count and the oldest open park's age, L10) · `json` (machine face) ·
  `selftest`. Exported readers: `openParks(dir)` and `parkById(dir,id)`.
- **No network.** It imports no http, net or fetch, and it posts nothing. It is not a `posts` verb, so the
  home pin (`scripts/acts.mjs:210-226`) is never asked.

**How the teaching session writes a park with no new act of his.** Door 3 of the act lane already exists.
A `<<ACT {…}>>` tail on the teacher's reply (`scripts/acts.mjs:66`, `:224`, `:451`) is dispatched at
Stop by `turn_hook stop → acts stop` (`scripts/turn_hook.mjs:322`, `:326`). That spawns the owner as a child,
never as a tool call, so the study rail (a PreToolUse rail) is not crossed and the reply stays the
one-line park plus the micro-question. A build adds ONE row to the OWNER table (`scripts/acts.mjs:86`):

```
park: { organ: "parked.mjs", argv: () => ["add", "--door", "act"], stdin: (a) => a.text,
        reverse: (a, r) => { const id = r && /"id":"([^"]+)"/.exec(r); return id ? { argv: ["close", id[1], "--by", "undo"] } : { argv: null, why: "the park carried no id in its receipt" }; } },
```

and one clause to the skeleton's `[PARK]` line (`scripts/teaching_bar.mjs:349`): "…+ end the reply with
`<<ACT {"acts":[{"verb":"park","args":{"text":"<his words>"}}]}>>`". The act skill says the tail "is
stripped from what he reads" (`.claude/skills/act/SKILL.md:32`). He types nothing new and runs nothing.
His message is the park. VERBS derives from the table (`scripts/acts.mjs:141`), so the ball schema and
the selftest pick the verb up with no second list.

## 4 · The surface (proposed)

**One Captain's Call card per open park. It is source 6 in `deriveCards`** (`scripts/captains_call.mjs:384`),
read PULL-DERIVE from `openParks()`. It is read-only, like the other sources (header `:22-24`).

- **key** `park:<id>` · **source** `parked` · **line** `Parked (<concept or "bina concept">): "<his words>" — ab uthayein?`,
  clipped by the deck's existing `clip(line, …)` at the filing site. The spec types no new size.
- **dispatch** `{kind:"park", id}`, which follows the `pending-fact` pattern (`:1093-1094`). **haan** →
  `parked.mjs close <id> --by haan`, and the session takes the item up NOW (system work at an anchor is
  allowed: no concept is in motion). **na** → `close <id> --by na`, so it was dropped by his word.
  **baad** → the generic sleep to the next local day (`:1055-1059`). The park stays open and returns.
- **decision gate:** a `WHY_CODE_CANNOT_DECIDE` entry for `park:` (`:328`). The reason is that these
  are his own parked words, and only he can say whether to take them up now or drop them.
- **retire at source:** a card whose park is closed by another door (an `undo` of the act) retires on the
  next sync. That needs `park:` in `RETIRE_AT_SOURCE_KEYS` (`:1605`), and a class joins that list only by
  a ruling row (`:1599`), so this is fork F3.

**When an item returns.** It returns at the first anchor he already hits: session start (`turn_hook.mjs:313`
deals), `/matchday` or `/full-time`. It never returns while a fresh forge session is open, because
`dealGuard` stays silent then (`:1150`). Among live cards it rides the existing ladder: ONE card per deal,
a card dealt today rests for the rest of that day, and the least-dealt card goes first (`:986-1012`). A
park never becomes a list, and it never nags inside a day.
**When an item closes.** It closes ONLY on a close row: haan, na, undo of its act, or at-source (F3).
baad never closes it, and neither does time. Nothing expires.

## 5 · Witness clauses (a build adds `ci/mprk/witness.mjs`) · each RED on 5759cce, GREEN on the build · one mutant each

All state is planted under `os.tmpdir()` by the node script, through `ARSENAL_PARKED_STATE_DIR`,
`ARSENAL_CALL_STATE_DIR` and `ARSENAL_ACTS_LEDGER`. A fresh `forge_session.json` and `resume_pointer.jsonl`
are planted too. **PORT CLASS (row 1053):** no clause binds a port, names a live service, POSTs to a
daemon or restarts anything. Every child is a `spawnSync` with the suite's own bounded wait (no new
number typed), and `ARSENAL_ORGAN` is unset only for the `deal` child, because a headless deal is silent
by design (`:1145`).

| id | plant | reads back | RED on base because | mutant (must turn it RED) |
|---|---|---|---|---|
| K1 owner write | a teacher turn ending `<<ACT {"acts":[{"verb":"park","args":{"text":"<planted words>"}}]}>>`, fed to `actsFromTail` with real dispatch | exactly one `ev:"park"` row in the planted `parked.jsonl`, `text` byte-equal to the planted words, `concept`/`axis` equal to the planted forge session | `unknown verb "park"` (§2 block) | drop the `park` row from `OWNERS` |
| K2 sole writer | the build tree | `scripts/parked.mjs` carries the §3 header line, AND `node scripts/xray.mjs report` names `parked.mjs` as the only writer of `parked.jsonl` (Q2/Q5 stay 0) | no such organ | `captains_call.mjs` appends a close row itself |
| K3 not mid-concept | K1's park, the planted forge session FRESH | `captains_call.mjs sync` then `deal` print no `park:` card (the guard line instead) | — paired with K4 as ONE clause: base never deals a park at all, so K3+K4 are red together | `dealGuard` ignores the forge session |
| K4 returns at an anchor | the same, with the forge session given `closed_at` | `deal` prints exactly ONE card, its key `park:<id>`, its line carrying the planted words | source 6 absent | source 6 removed from `deriveCards` |
| K5 one per anchor | two parks plus one hand-filed card, forge closed | two `deal`s on one planted day print one card each, never two in one deal, and they are different cards (rotation) | no park ever dealt | deal emits every live park |
| K6 close haan / na | `answer <card> haan` on park A, `answer <card> na` on park B | `parked.mjs json` shows A closed `by:"haan"` and B closed `by:"na"`; the next sync deals neither | no `park` dispatch | the `park` dispatch never calls the owner |
| K7 baad returns | `answer <card> baad` | the park is still open; no deal the same planted day; it is dealt again the next planted local day | — | baad writes a close row |
| K8 undo | `acts.mjs undo <act id>` | the park is closed `by:"undo"` | no reverse | `reverse` returns `argv:null` |
| K9 study session not disturbed | sha256 of the planted `forge_session.json` and `resume_pointer.jsonl`, before and after K1–K8 | identical; the only files the flow created or changed in the planted dir are `parked.jsonl`, `captains_call.json` and the acts ledger | — (base writes nothing; the clause is red on base through K1's missing row, which it requires) | `parked.mjs add` stamps `forge_session.json` |

## 6 · NAMED NOT GUESSED (the cloud cannot reach these)

- **N1 · the crash belt.** P4's "one line on the crash belt" lands in an out-of-repo folder on his laptop
  (`scripts/learn_digest.mjs:36` names the constant; the path is not reproduced here). Whether park lines
  sit there today, and how many, is measured on the laptop by listing that folder's `*_BLOCKS.md` and
  grepping them for park lines.
- **N2 · how often the teacher actually parks.** `dressing-room/state/teaching_audit.jsonl` (laptop) holds
  the classified turns. On the laptop, count the turns whose `[PARK]` slot was due (`parkDue`) against the
  replies carrying a park line. That count decides F4.
- **N3 · live MCP park notes.** The scribe log and the hippocampus episodes are gitignored and on the
  laptop. The count of `[thread]` rows that read as parks (text containing "park") is measured there.
  That count decides F2 (whether to backfill).
- **N4 · deck pressure.** How many live cards sit in `captains_call.json` (`node scripts/captains_call.mjs status`
  on the laptop) decides whether parks starve behind other cards. That bears on F1.
- **N5 · whether `teaching_audit` flags an act tail.** Importing `teaching_audit.mjs` runs its top-level hook
  (`scripts/turn_hook.mjs:483` pins that shape), so this seat did not probe `auditTurn` with a planted tail.
  The build's K1 should also assert that `auditTurn` of the K1 turn raises no `no-system-mid-concept` drift.

## 7 · FORKS (each for the architect)

- **F1 · where a park card ranks.** (a) rank 0, beside hand-filed: they are his own words, and the
  least-dealt rotation (`:999-1010`) already stops any monopoly · (b) rank 2, the teaching/identity tier ·
  (c) rank 3, the outward tier. **Recommend (a).** Decided by N4.
- **F2 · old parks.** (a) no backfill; the owner starts empty on landing day · (b) a one-off import of
  hippocampus `thread` rows that read as parks, run through the owner's `add` · **Recommend (a)**: a
  pattern-matched import is keyword routing, which the act lane forbids (`scripts/acts.mjs:43-44`).
  Decided by N3.
- **F3 · retire at source.** (a) `park:` joins `RETIRE_AT_SOURCE_KEYS` by a ruling row · (b) no; a park
  card closed elsewhere stays until his next answer · **Recommend (a)**: otherwise an undone park still
  asks him.
- **F4 · the write door.** (a) the act tail `park` verb only (§3) · (b) the tail AND the MCP `note` tool
  (a new `park` kind that mcp-memory hands to `parked.mjs add`, as `remember_fact` hands off to the
  hippocampus) · (c) a Bash `parked.mjs add` allowed by the study rail · **Recommend (a)**. It needs no
  tool call mid-concept and no rail change, and the MCP server is not always connected (it failed to
  connect in this seat). Decided by N2.
- **F5 · SAMJHAO's close-time parked LIST (P5, samjhao:R91).** (a) it stays as a report, and the owner
  becomes its source · (b) it is superseded by the card surface, so no list is shown to him · **Recommend
  (b)** under his "never a list he must read" (`scripts/captains_call.mjs:25`). This is a canon edit to an
  archived record, so it needs his word.
- **F6 · machine notices held back mid-lesson (P13).** (a) out of scope for mprk; these are organism
  notices, not his items · (b) in scope; they ride the same owner · **Recommend (a)**, named so it is not
  lost.
- **F7 · the merit of a crash-belt line (P4).** (a) the PARK BEAT's crash-belt line stays, and the act tail
  is added beside it · (b) the act tail replaces it · **Recommend (a)**: layering, never replace (L9).

## 8 · Files a build would touch

`scripts/parked.mjs` (new) · `scripts/acts.mjs` (one OWNER row) · `scripts/captains_call.mjs` (source 6, the
`park` dispatch, the `WHY_CODE_CANNOT_DECIDE` entry, and the `RETIRE_AT_SOURCE_KEYS` row only if F3 (a) passes) ·
`scripts/teaching_bar.mjs` (the `[PARK]` line) · `.gitignore` (one line) · `schemas/captains_call.json.schema.json`
(if it enumerates dispatch kinds) · `package.json` (wire `parked` into exactly one suite: the coverage
law) · `ci/mprk/witness.mjs` (new). **Beyond these, each one is a fork:** `.claude/skills/forge/SKILL.md` /
`learn/SKILL.md` (the park line naming the tail) · the registry row for the new organ through
`node scripts/registry.mjs set` (sole writer `scripts/registry.mjs:4`) · F5's archive edit.

## 9 · Base measurement and CI

The hermetic profile, run 20 Nov 2026 at 5759cce (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`).
The first run was before `npm ci` and also failed the fsrs and mutagen members (`ERR_MODULE_NOT_FOUND`).
After `npm ci --ignore-scripts` it exits 2 with one FAIL, which is a BASE fact and not this spec's:

```
FAIL EVERY organ with a selftest is wired into a suite (package.json:_selftest_coverage_law)
      orphaned: deck_lint, home_pin, probe, study_scope
```

The neutral machine's check runs for this branch's tips are in `ci/mprk/LEDGER.jsonl` and in the seat's final message.
