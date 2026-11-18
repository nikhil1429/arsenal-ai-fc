# MPAST_SPEC — his full-time line for a past day the day-close card names (unit mpast · SPEC ONLY, nothing built)

For the architect. Every file:line is at **BASE = main 5767e21**. Nothing here is built; each branch says what would change,
**exactly what he is asked**, and the witness clauses that would prove it. A branch marked DEFAULT is the brief's default,
never a ruling: the ruling is the architect's.

## 0 · The gap, measured

| # | Fact at BASE | file:line |
|---|---|---|
| G1 | His full time keys the day off the clock, never a named day: `const now = new Date(); const dateStr = localDate(now);` | `scripts/postmatch.mjs:1185-1186` |
| G2 | Every write of his close uses that `dateStr`: the double-click guard, the post_match write, season.json's row, the notebook | `scripts/postmatch.mjs:1191-1195`, `:1246`, `:1247`, `:1249` |
| G3 | The upgrade over a machine record (his RESULT on top, the machine block kept below) works only for `<today>.md` | `scripts/postmatch.mjs:1191-1192`, `:1240` |
| G4 | The kept day-close card names every open day from its own key's day to the day the evening closed, oldest first | `scripts/postmatch.mjs:558-562`, `:604-618`; the door `scripts/captains_call.mjs:1548-1582` |
| G5 | The card asks "your HIT/MISS and tomorrow's line, if you want (/full-time)" — the skill runs `postmatch.mjs --hit …` with no date | `scripts/postmatch.mjs:567`, `:570`; `.claude/skills/full-time/SKILL.md` step 3 |
| G6 | So when the card names past days, his HIT/MISS lands on TODAY's file; every named past day stays a machine record (open) | follows from G1-G5; `openDaysOf` `scripts/postmatch.mjs:587-600` keeps counting them |
| G7 | His answer on the card ends its window; it runs nothing (a hand-filed card's dispatch is `none`): `applyAnswer` records the word | `scripts/captains_call.mjs:1044-1080`; the window rule `scripts/postmatch.mjs:559-560` |
| G8 | The MORNING close files no card and rewrites none (row 877) | comment `scripts/postmatch.mjs:370-371`; code `:751`, `:754`; pinned by the selftest `:1101-1103` |
| G9 | With NO kept card, the evening `file`s `dayclose:<D>` naming D alone — a morning-closed day before it, with no older kept card, is named on NO card | `scripts/postmatch.mjs:621`; the window starts at the kept card's day only (`:613`) |
| G10 | The KAL-line is read only from YESTERDAY's file (manager `last_post_match`) | `scripts/manager.mjs:86`, `:317` |
| G11 | season.json rows are APPENDED in close order and the streak reads the tail | `scripts/postmatch.mjs:144-146`, `:163-166` |
| G12 | daily_green rung 8 reads a legal RESULT on `post_match/<day>.md`; a machine record stays RED by its own code | `scripts/daily_green.mjs:244-252` |

## (a) Which day his ONE full-time line closes when the card names past days

| Branch | What changes | What he is asked | Witness clauses that would prove it |
|---|---|---|---|
| **A1 · DEFAULT — the newest named open day** | `postmatch.mjs` main gains `--date D` (G1 `:1185-1186`): honoured only when D ≤ today and `post_match/D.md` is a machine record (`parseMachineRecord` `:467`), else REFUSED by name. His RESULT/signal/KAL go on D (G3 upgrade, the machine block kept, L9). Every OLDER day the card named is closed "no line": ONE line appended to its machine record — `HIS WORD: none for this day — his full time closed <D> at <ts> (a recorded decision, never re-asked)` — which `parseMachineRecord`/`openDaysOf` (`:467`, `:587`) then read as closed, so no later card names it again. The full-time skill reads the named days through `relineTarget` (`captains_call.mjs:1548`) + `openDaysOf` before it asks. | ONE message, as today: "Result for **<newest named day>** (HIT/MISS/PARTIAL/REST)? · one signal? · KAL-line?" — the KAL asked ONLY when that day is yesterday or today (G10: an older day's KAL is read by nobody). The older named days are SAID, never asked: "<d1>, <d2> close with no line of yours." | **MP1** card naming D-2, D-1 kept; `--date D-1 --hit HIT` writes RESULT on D-1.md over the machine block (kept byte for byte), D-2.md gains the no-line line, today's file untouched · **MP2** a later `openDaysOf` over the window names neither day; the next evening's card names neither · **MP3** `--date` on a day with no machine record, a future day, his own closed day, or a malformed date: REFUSED, nothing written · **MP4** the no-line line carries no legal RESULT (daily_green rung 8 stays RED on D-2, G12) and matches_played does not move for it · **MP5** season.json: one row for D-1, placed per the G11 decision below · **BOUND** only `postmatch.mjs` + the skill file · mutant per clause |
| A2 · today, as BASE | Nothing changes in postmatch; the skill says the named past days close "no line" and runs the close on today. The no-line line is still needed so the card stops naming them. | "Result for today?" — the named past days are said, not asked | MP2 · MP4 · and **MP6** his RESULT lands on today's file only |
| A3 · every named day, one result | `--date` accepts a LIST; one RESULT copied onto each named day | "Result for <d1>…<dn>?" | REJECTED as written: it puts his one word on days he did not speak about (the forbidden act is inventing his word, rows 873 (3) / 877 F1-F2). Listed so the architect rules it out by name. |
| A4 · ask per day | One question per named day | n questions | REJECTED as written: violates "max ONE dealt per anchor" / "never re-asked" (CLAUDE.md THE CAPTAIN'S CALL). Listed for completeness. |

**Sub-decisions A1 carries (each the architect's, each with its proof):**
- **G11 season row order.** (i) append in close order (BASE behaviour; the streak then reads the close order) or (ii) insert by date. Clause **MP5** pins whichever is ruled.
- **A `na` on the card.** G7: `na` records the word and runs nothing. Under A1, `na` = every named day closes no line (the skill appends the line to each) — clause **MP7**: after `answer <id> na`, the next evening's card names none of them. `baad` sleeps the card a day (`captains_call.mjs:1051-1055`) and closes nothing.
- **The door's guard** reuses the double-click guard (`:1195`) keyed on D, not on today: clause MP3.

## (b) The MORNING close and the card naming the slept day — one card an anchor

| Branch | What changes | What he is asked, and at which anchor | Witness clauses that would prove it |
|---|---|---|---|
| **B1 · DEFAULT — the morning neither mints nor rewrites; the evening's card carries the slept day** | Only `dayCloseCard`'s no-kept branch (`:621`): instead of `dayClosedLine(day)` it files `dayCloseLine(openDaysOf(<the day after the newest ANSWERED dayclose card's day>, day))` (G9 closed). G8 stands untouched (row 877). | At the EVENING anchor only, one card: "<D-1>, <D>: the days closed themselves — your HIT/MISS and tomorrow's line, if you want (/full-time)" (the existing `dayCloseLine`, `:574`, inside `CARD_LINE_BOUND` 140, `captains_call.mjs:1544`) | **MB1** morning closes D-1 (no card kept, yesterday's answered): no card minted, deck bytes unchanged · **MB2** that evening closes D: ONE card keyed `dayclose:<D>` naming D-1 and D · **MB3** with a kept card the reline path is unchanged (mcard's clauses still GREEN) · **MB4** more open days than the bound fits: counted `+k more`, never dropped · **BOUND** `postmatch.mjs` only |
| B2 · the morning REWRITES a kept card (never mints) | The morning path calls the door (`reline`, `captains_call.mjs:1793`) when a card is kept; mints nothing when none is. Reverses half of G8 (row 877's "rewrites nothing"). | The kept card's line changes at the morning anchor; nothing new is dealt (a reline deals nothing) | **MB5** morning with a kept card: its line names D-1, its id/key/dealt unchanged, no card minted · **MB6** morning with no kept card: deck bytes unchanged · MB2 for the evening |
| B3 · the morning MINTS `dayclose:<D-1>` when none is kept | The morning path `file`s the card. Reverses G8 fully (row 877) and puts a second ask into the morning anchor, which already deals its one card (max ONE dealt per anchor). | A card at the MORNING anchor naming the slept day | **MB7** at most ONE card dealt at the morning anchor (the deal's own pick) · **MB8** the fileGuard keeps one live ask (`captains_call.mjs:1477-1487`): the evening then relines it, never mints a second. Needs a ruling that reverses row 877. |

**Recommendation for the architect (a reading, not a ruling):** A1 + B1. Both keep row 877 standing, both keep ONE ask
per anchor, and together they make every open day either named on the one card or closed by a recorded decision — no day
stays open unnamed (G9) and no day is asked twice.
