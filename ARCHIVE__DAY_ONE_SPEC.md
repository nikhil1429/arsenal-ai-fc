# THE ARCHIVE — DAY-ONE SPEC
## The permanent, self-describing record of Nikhil Panwar
### Sealed 14 August 2026 (IST) · his word: *"yes create every single thing which we need from day 1"*

> **NEXT SESSION: READ THIS WHOLE FILE FIRST, THEN BUILD IT. It is self-contained — you do not
> need the conversation that produced it.**
>
> Before writing any code, also read: `CLAUDE.md` (repo law) and
> `~/.claude/projects/C--Users-nikhi-GitHub-arsenal-ai-fc/memory/artifact-organ-diagnosis.md`
> (everything parked to 28 Aug — do NOT re-open those threads; they are decided and waiting).

---

## 0. WHAT THIS IS, IN ONE PARAGRAPH

Nikhil is building a **cyborg organism** — an anti-self-deception machine he intends to live
inside for 20+ years, across every sector of his life. Everything he says or types is data he
refuses to waste. This spec builds the **permanent archive**: the substrate that guarantees a
model in 2035 or 2046 can read, trust, slice, re-index and re-interpret the complete record of
his life with **zero information loss** — including the ability to prove nothing was altered.

**This spec builds ONLY what cannot be recovered later.** Everything recoverable (embeddings,
tables, summaries, knowledge graphs) is deliberately excluded — see §9.

---

## 1. THE GOVERNING TEST

Every proposed item was filtered through one question:

> **"If we skip this today, can a 2035 model recover it from what we DID store?"**
> **Recoverable → NOT Day 1.** · **Not recoverable → Day 1, or never.**

The list is short *because* most things are recoverable. Building schemas, indexes and
projections on Day 1 is the mistake that killed his previous project (JARVIS OS: 39 tables,
162 features, 82 build sessions, ~35 events actually logged).

**Do not add scope. Refusing scope IS the strategy.**

---

## 2. THE EIGHT LAWS (canon — approved by him, 14 Aug 2026)

Each law is traceable to a real failure in one of his two projects. Do not "improve" them.

**LAW 1 — ONE DOOR.** Every byte enters through one door. Not elegance — a second door is a
lane that dies silently and nobody notices.

**LAW 2 — THE RAW IS SACRED AND NEVER TOUCHED.** No pass may edit, summarise-in-place, delete
or reorder. Every derived thing is a NEW record that POINTS at the raw.
*(JARVIS broke this: its cascade made summaries the thing Opus read — violating its own
"Opus Principle" inside its own document.)*

**LAW 3 — NOTHING IS EVER REJECTED AT THE DOOR.** Filtering belongs to the READER, never to
the WRITER. A consumer that does not want a record skips it at read time; it may never prevent
the write.
*(Proven necessary: on 14 Aug 2026, `learningArcVerdict` in `hippocampus.mjs` vetoed **33 of 33**
of his typed turns from `who_he_is` — top reason "machine talk (organism, cyborg)". The words he
chose to name his own identity are on the machine-noise blocklist. That is a READ-time bug, and
this law makes it structurally impossible for a consumer to cause data loss.)*

**LAW 4 — EVERY RECORD CARRIES ITS OWN PROVENANCE AND ITS OWN SHAPE.** who · when · where ·
which thread · which surface · which schema version. **Content is recoverable; context is not.**

**LAW 5 — BELIEF IS DATA.** Every interpretation the machine produces is stored as a dated,
attributed, falsifiable CLAIM — never as a state file that overwrites itself.
*(`who_he_is.json` violates this today. Without stored beliefs, disconfirmation is impossible.)*

**LAW 6 — THE ARCHIVE HAS VITAL SIGNS.** Mechanically, forever: records per lane per day,
field-fill rates, silence detection. **An archive that cannot report its own health is a
hypothesis.** *(His own law: "unrun system = hypothesis.")*

**LAW 7 — RETENTION IS A DECISION, NOT A DEFAULT.** Demote, seal, encrypt — never delete.
`tier` is stamped at write time, defaults to `private`, and may only ever be relaxed by an
explicit act — never tightened retroactively, because you cannot un-see.

**LAW 8 — STRUCTURE IS DISPOSABLE.** Any index, embedding, table or projection may be dropped
and rebuilt from raw at any time. **If something can only exist in the projection, it belongs
in the raw.**

---

## 3. ARCHITECTURE — HOW THIS FITS THE LIVE ORGANISM

**Do not touch the live path.** `afferent.jsonl` and the thalamus keep working exactly as they
do; 14 organs read that file. Layering, never replace.

```
  HIS SURFACES  (typed · gaffer voice · activitywatch · pulse · presence · readiness)
        │
        ▼
  THALAMUS DOOR  127.0.0.1:4113/afferent        ← LAW 1, already exists, unchanged
        │
        ▼
  dressing-room/state/afferent.jsonl            ← WRITE-AHEAD LOG (hot, fast, never blocks)
        │                                          + every other *.jsonl lane
        │  tail + checkpoint
        ▼
  archivist.mjs   ← NEW ORGAN, sole writer of the archive tree
        │           adds: seq · sha256 · prev_hash · archived_at
        ▼
  $ARSENAL_ARCHIVE/   ← THE DURABLE RECORD. Outside the repo. Goes on the external disk.
```

**Why a tailing archivist and not a write inside the thalamus:**
- zero risk to the live path (the capture nerve must never bite)
- single-writer law preserved — `archivist.mjs` owns the archive tree and nothing else
- expensive work (hashing, chaining, fsync) happens off the hot path
- it can backfill all existing history on first run
- if it dies, nothing else in the organism breaks

**The pattern is WAL → durable store.** `afferent.jsonl` is the write-ahead log; the archive is
the permanent record. Because of that, **the archivist must run often** (see §7 scheduling) —
anything lost from the WAL before it is archived is lost forever.

---

## 4. TIME — IST IS LOAD-BEARING (he confirmed: "my timezone is IST")

Three separate clock facts. All three are irrecoverable if skipped.

**4.1 `ts_utc`** — the instant, ISO-8601 UTC: `2026-08-14T04:17:32.123Z`

**4.2 `ts_local` + `tz`** — the WALL CLOCK with offset, plus the zone name:
`2026-08-14T09:47:32.123+05:30` and `"Asia/Kolkata"`.
**Never store only UTC.** *"He wrote this at 3am"* is different information from the UTC
instant, and it is the single most behaviourally informative field in the archive for a man
whose sleep schedule is inverted. Store the zone NAME as well as the offset — offsets change
when he travels; the name preserves intent.

**4.3 `seq`** — a monotonic per-lane counter assigned by the archivist.
**Timestamps collide.** Two records in the same millisecond have no recoverable order. With
four future surfaces (laptop · phone · voice · glasses) the clocks will also disagree with each
other. `seq` is the only total order that survives.

**4.4 DAY PARTITIONING IS BY IST DAY, NOT UTC DAY.**
He routinely works until 2-3 AM IST. A UTC-partitioned archive splits a single working night
across two files and silently destroys the shape of his day. Partition on
`Asia/Kolkata` local date. **The manifest must state this explicitly**, or a future reader will
assume UTC and be wrong about every late-night session in the archive.

**4.5 Bitemporal fields are RESERVED in the schema now, unused on raw records:**
`valid_from` · `valid_to` · `recorded_at`. Raw utterances need only `recorded_at` (= `ts_utc`).
Derived FACT records (Phase 1) require all three. Reserve them today so the first derived fact
cannot be written without them.

---

## 5. THE RECORD SCHEMA v1 — every field, and why it is irrecoverable

A record is one line of JSON in a `.jsonl` file. **Field order is fixed** (below) so a diff of
two archives is readable by a human.

```jsonc
{
  // ── IDENTITY & INTEGRITY ──────────────────────────────────────────────
  "rid":        "01K2X…",     // record id (ULID: sortable, distributed-safe)
  "sha256":     "a3f2…",      // hash of the CANONICAL BYTES of this record's payload (§5.1)
  "prev_sha256":"b71c…",      // hash of the previous record IN THIS LANE  → chain (§5.2)
  "seq":        184213,        // monotonic per lane, assigned by archivist
  "v":          1,             // SCHEMA VERSION of this record

  // ── TIME (§4) ─────────────────────────────────────────────────────────
  "ts_utc":     "2026-08-14T04:17:32.123Z",
  "ts_local":   "2026-08-14T09:47:32.123+05:30",
  "tz":         "Asia/Kolkata",
  "recorded_at":"2026-08-14T04:17:33.001Z",   // when the ARCHIVE learned it
  "valid_from": null,          // reserved (§4.5)
  "valid_to":   null,          // reserved

  // ── PROVENANCE (LAW 4) ────────────────────────────────────────────────
  "lane":       "afferent",    // which stream
  "surface":    "claude-code",  // which BODY: claude-code | gaffer-voice | activitywatch |
                               //             phone-note | glasses | tv | system
  "source":     "claude-code",  // sub-source within the surface
  "modality":   "code",         // code | voice | context | pulse | bus | gemini | vision
  "session_id": "sess-abc-123", // THE THREAD
  "event_id":   "mssfz0ck-n9…", // the hook's own id, if present

  // ── SENSITIVITY (LAW 7) ───────────────────────────────────────────────
  "tier":       "private",      // public | personal | private | sealed. DEFAULT private.
                                // May only ever be RELAXED by an explicit act. Never tightened
                                // retroactively — you cannot un-see.

  // ── THE MOMENT'S STATE (§5.3) — irrecoverable, state files overwrite ──
  "moment": {
    "sprint_task":  "1-04 Hallucinations",
    "forge_step":   4,
    "forge_concept":"hallucinations",
    "readiness":    null,        // last known Oura readiness verdict + its date
    "focus_app":    "claude.exe",
    "cwd":          "arsenal-ai-fc"
  },

  // ── THE PAYLOAD — EXACT BYTES, NEVER NORMALISED (§5.4) ────────────────
  "payload": { /* the original row, verbatim, unmodified */ },

  // ── DERIVATION (only on derived records — LAW 2 / LAW 5) ──────────────
  "derived_from": null,        // array of source `rid`s
  "agent":        null,        // { model, model_version, prompt_sha256, effort, at }

  // ── BACKFILL HONESTY (§8) ─────────────────────────────────────────────
  "backfilled":   false        // true = imported from history; seq/prev chain is
                               // archive-order, NOT original write-order. Never lie about this.
}
```

### 5.1 `sha256` — Day 1 or never
Hash of the record's **canonical serialisation** (JCS-style: keys sorted, no insignificant
whitespace, UTF-8) EXCLUDING `sha256` and `prev_sha256` themselves. It serves four jobs at once:
dedupe key · corruption detector · tamper evidence · **stable citation id** that survives any
future re-formatting.

> **A hash computed in 2028 certifies whatever corruption already happened.** Retroactive
> fixity proves nothing. This is the clearest Day-1-or-never item in the entire spec.

### 5.2 `prev_sha256` — the chain
Each record carries the hash of the previous record **in its own lane**. The lane becomes
tamper-evident *as a sequence*: no record can be removed, altered or reordered without breaking
the chain. This is what git does. It is roughly three lines of code and it is the reason a 2046
verification can **prove** nothing was taken out.

### 5.3 `moment` — the state that overwrites itself
`sprint.json`, the forge session file and `readiness.json` are **overwritten** as the organism
runs. The words survive; the *state* does not. A record from three weeks ago can never again
tell you which task was live when it was written — unless it was stamped at write time.

Read these from local files, wrapped in try/catch, **never throwing**. A missing value is
`null`; a missing `moment` must never block a write.

### 5.4 `payload` — exact bytes, no normalisation
**Do not** Unicode-normalise, trim whitespace, strip emoji, lowercase, collapse newlines or
"fix" anything. Every one of those is irreversible. Normalisation is a READ-time or
derived-record operation. Store what arrived.

---

## 6. THE ARCHIVE ON DISK

```
$ARSENAL_ARCHIVE/                       ← env var. Default: %USERPROFILE%\CyborgArchive
                                          MUST be outside the repo (LAW: app-independent)
  README.md                             ← for a HUMAN in 2046: what this is, how to read it
  bagit.txt                             ← BagIt declaration (version + encoding)
  bag-info.txt                          ← who, when, contact, source organisation
  manifest-sha256.txt                   ← checksum of every file in data/
  tagmanifest-sha256.txt                ← checksum of the manifests themselves

  SCHEMA/
    v1.json                             ← this schema, machine-readable (JSON Schema)
    CHANGELOG.md                        ← every shape change: WHAT, WHEN (IST), and WHY
                                          NEVER migrate old records. Add a version; readers
                                          handle all versions.

  LEXICON/
    terms.jsonl                         ← §10. The dictionary of his private language.
    CHANGELOG.md

  data/
    afferent/2026/08/14.jsonl           ← IST days (§4.4)
    episodes/2026/08/14.jsonl
    reps/…  rejirah/…  brain_ledger/…  teaching_audit/…  harvest/…
    _checkpoints.json                   ← archivist's read position per source file

  health/
    vitals-2026-08.jsonl                ← LAW 6: per-lane counts, fill rates, silence flags
    fixity-2026-08.jsonl                ← verification runs: when, what, pass/fail

  derived/
    README.md                           ← "EVERYTHING IN HERE IS DISPOSABLE. Drop it and
                                          rebuild from data/. Nothing here is truth."
```

`data/` is sacred. `derived/` is garbage that can be regenerated. That distinction is the
whole architecture.

**Why the archive is outside the repo:** in twenty years `arsenal-ai-fc` will not exist. The
archive must be a standalone, self-describing, application-independent object — a folder that
copies to any machine, opens in any tool, and is understandable **without the code**.
The app writes to the archive. **The app does not own the archive.**

---

## 7. WHAT TO BUILD — the concrete work list

Follow repo convention: Node 22, `.mjs`, Windows paths, a header comment stating WHAT / LAWS /
MODES, a `selftest` mode, and membership in `scripts/organism_test.mjs`.

### 7.1 `scripts/archivist.mjs` — NEW ORGAN, sole writer of `$ARSENAL_ARCHIVE`

Modes:
- `init` — create the tree, write `README.md`, `bagit.txt`, `bag-info.txt`, `SCHEMA/v1.json`,
  `LEXICON/terms.jsonl` seed, `derived/README.md`. Idempotent.
- `run` — tail every configured source lane from its checkpoint, wrap each row into a record
  (§5), append to the correct IST-day file, update the checkpoint. **Idempotent and
  crash-safe**: a re-run after a crash must not duplicate records (dedupe on payload `sha256`).
- `backfill` — import all existing history with `backfilled: true`. One-time, resumable.
- `verify [--month YYYY-MM]` — recompute every hash, walk every chain, report breaks. Writes
  `health/fixity-*.jsonl`.
- `vitals` — LAW 6. Per-lane record counts, field-fill rates, **silence detection** (a lane
  that produced rows for 14 days and then zero for 3 is a RED). Writes `health/vitals-*.jsonl`.
  **Zero LLM. Pure arithmetic.**
- `seal [--quarter]` — regenerate `manifest-sha256.txt` + `tagmanifest-sha256.txt` so the tree
  is a valid BagIt bag, ready to copy to the external disk.
- `selftest` — §11.

Source lanes to archive (discover, do not hardcode a closed list — but these must be covered):
`dressing-room/state/afferent.jsonl` · `dressing-room/hippocampus/episodes.jsonl` ·
`reps_log.jsonl` · `rejirah_log.jsonl` · `brain_ledger.jsonl` · `teaching_audit.jsonl` ·
`harvest_log.jsonl` · `gate_tune_ledger.jsonl` · `brain_outcomes.jsonl` ·
`bootroom_log.jsonl` · `gemini_quality.jsonl` · `salience_ledger.jsonl`

Write discipline: `O_APPEND`, one `write()` per record, `fsync` at the end of each batch. A
power cut must leave at most one partial line, and the hash makes that partial line detectable.

### 7.2 `hooks/afferent-post.mjs` — extend (additive only)

Already carries `event_id · session_id · surface · v:2 · transcript_path` (added 14 Aug,
commit `3fcce43`). Add:
- `ts_local` + `tz` (`Asia/Kolkata`) alongside the existing UTC `ts`
- `tier: "private"` (default)
- `moment` — sprint task, forge step/concept, focus app, cwd (local file reads only,
  try/catch, never throws)

**Do NOT add `seq` or hashes here.** The archivist assigns those — a counter file in a hook is
a new failure mode in a nerve that must never bite. Keep the hook's laws intact: never blocks,
never writes to stdout, always exits 0, ~250 ms budget.

### 7.3 `SCHEMA/v1.json` — machine-readable JSON Schema of §5

### 7.4 `LEXICON/terms.jsonl` — see §10 (seed it in this session)

### 7.5 Security work

- `$ARSENAL_ARCHIVE` **must never be inside the repo.** Add a defensive check in `init` that
  refuses to initialise inside a git work tree.
- Add `.gitignore` entries for any archive path that could appear locally.
- **Commit tripwire**: a `pre-commit` hook that refuses any staged file under an archive path
  or matching `*.jsonl` from the capture tree. One accidental push is irreversible on a public
  repo.
- **Fix `SECRET_RE` in `hooks/afferent-post.mjs`** — it does not match `sb_publishable_` /
  `sb_secret_`. Proven live on 14 Aug when he pasted a Supabase key: it went to the bus
  unscrubbed. No harm done (`afferent.jsonl` is gitignored, `.gitignore:185`) but the scrubber
  has a real hole. Add the Supabase prefixes and common token shapes.
- **Do NOT encrypt the archive files themselves.** Per-file encryption makes the archive
  unreadable to future tools and turns key-loss into total loss — the opposite of preservation.
  Encrypt the DISK (BitLocker on Windows, and on the external drive). Confirm BitLocker status
  and tell him if it is off.

### 7.6 Scheduling (Windows Task Scheduler, per `setup/INSTALL_TASKS.ps1` convention)

| Task | Cadence | Mode |
|---|---|---|
| `ArsenalFC-Archivist` | every 15 min | `archivist.mjs run` |
| `ArsenalFC-ArchiveVitals` | daily 23:40 IST | `archivist.mjs vitals` |
| `ArsenalFC-ArchiveFixity` | monthly, 1st, 04:00 IST | `archivist.mjs verify` |

Also run `run` from the SessionEnd/Stop path if cheap, so a session's tail is archived promptly.

---

## 8. BACKFILL — and the honesty rule

Import all existing history. Every backfilled record carries `backfilled: true`.

**Why this matters:** a backfilled record's `seq` and `prev_sha256` reflect **archive order**,
not original write order — the original order is not recoverable for rows that were never
sequenced. Marking them is not bureaucracy; an unmarked backfill is a **lie about provenance**
that a 2035 analysis would silently trust.

Current volumes (measured 14 Aug 2026): `afferent.jsonl` ≈ 1,477 rows; `episodes.jsonl` has
records from at least 7 Aug. Backfill must be resumable and idempotent.

---

## 9. EXPLICITLY OUT OF SCOPE — do not build these

❌ **Embeddings / vector DB.** Confirmed by research: changing embedding model requires
re-embedding the entire corpus. Any index built today is thrown away later. **The source text
is what survives; the index is disposable (LAW 8).**
❌ Tables, projections, Parquet, knowledge graph, entity extraction
❌ Summaries, `who_he_is` improvements, the SELF-arc filter, the belief store (LAW 5 store)
❌ The Falsifier (Ring 3)
❌ Off-laptop / phone capture — **he parked it.** Noted here only because it is the one
remaining item that genuinely fails the §1 test: unspoken words are irrecoverable. Its full
design is already written in the 28 Aug memory file. **Do not re-litigate it.**
❌ Anything from the JARVIS OS feature corpus (18 modes, 6 tabs, achievements, boot sequence,
3D reactor, TV dashboard, XR, PWA, Telegram, the 39-table projection layer). **JARVIS died of
feature count.**

---

## 10. THE LEXICON — the least obvious and highest-value Day-1 artifact

Over twenty years the thing that fails is **not** corruption and **not** format. It is
**meaning drift.**

His archive is written in a private language. The dictionary for that language exists in
exactly two places: his head, and code that will one day be deleted. Without it, a 2035
analysis will not fail loudly — it will be **quietly wrong**, because the data is intact and
the interpretation key is gone. *(Archival science calls this Representation Information; it is
the part of OAIS everyone skips.)*

**Seed `LEXICON/terms.jsonl` now**, one record per term:
`{ term, definition, first_seen (IST date), status: "live"|"retired", version, source }`

Terms to seed (harvest definitions from `CLAUDE.md`, `learning-layer/*.md`, `THE_GAFFER.md`,
and the script headers — **do not invent definitions; quote the canon**):

*The method*: Bolo · Jirah · Re-Jirah · forge · capsule · gist · weld · deep · mechanism · hook
· traps · threeWays · interviewLines · gut-word (knew/shaky/guessed) · axis · Pehle-Guess ·
crack-map · cold-reader standard · successive relearning · the 9 axes · the 12 steps
*The organs*: Goalkeeper · Manager · Gaffer · Nemesis · Scout · Distiller · Doubtminer ·
Thalamus · Hippocampus · DMN · Cortex · Watchman · Boot Room · Scoreboard · Mirror · Archivist
*The club*: dugout · dressing room · matchday · full-time · kickoff · throw-in · captain's call
· anchor law · the wall · SEASON
*The laws*: layering-never-replace · unrun-system-is-hypothesis · single writer · owners-only
writes · AI proposes / code validates / human approves · drift · auto-hit · teaching contract
*This spec*: lane · surface · tier · moment · chain · fixity · backfilled · derived

Every future shape or vocabulary change appends to `LEXICON/CHANGELOG.md`. **Never edit a term
in place — retire it and add the new one** (LAW 2 applied to language).

---

## 11. ACCEPTANCE TESTS — his law: *"unrun system = hypothesis"*

Write these as real tests in `scripts/archivist.mjs selftest` and register the organ in
`scripts/organism_test.mjs`. **Every one must RUN and pass; show the output.**

1. **Chain integrity** — build a 100-record lane; `verify` passes.
2. **Tamper detection** — alter one byte in a middle record; `verify` names that exact record.
3. **Deletion detection** — remove a middle record; `verify` reports the chain break.
4. **Idempotency** — run `run` twice on the same input; zero duplicate records.
5. **Crash safety** — truncate the last line mid-write; the next `run` detects the partial line,
   quarantines it, and continues without data loss.
6. **IST day boundary** — a record at `2026-08-14T02:30:00+05:30` (i.e. `20:30Z` on the 13th)
   lands in `data/afferent/2026/08/14.jsonl`, **not** the 13th.
7. **No normalisation** — a payload containing `"  नमस्ते  🙏\r\n"` round-trips byte-identical.
8. **Backfill honesty** — every backfilled record has `backfilled: true`; no live record does.
9. **Tier default** — a record with no tier gets `"private"`, never anything looser.
10. **Repo safety** — `init` refuses to create the archive inside a git work tree.
11. **Vitals silence detection** — a lane with 14 days of rows then 3 days of zero is flagged.
12. **Schema validity** — every written record validates against `SCHEMA/v1.json`.
13. **Hook still safe** — the extended `afferent-post.mjs` exits 0, writes 0 bytes to stdout,
    and degrades to `null` on every missing hook field (exercise it against a local listener,
    as was done for commit `3fcce43`).

---

## 12. THE PHYSICAL LAYER — tell him this out loud

He said he will buy a hard disk or pendrive. **One disk is one copy — that is not a backup, it
is a second point of failure.**

The archival standard, still current in 2026, is **3-2-1**:
> **3 copies · 2 different media types · 1 kept off-site**

Practical shape for him: laptop (working copy) + external SSD/HDD (BagIt bag, refreshed on
`seal`) + one off-site copy (a second drive kept elsewhere, or an encrypted cloud copy — his
privacy ruling is still OPEN, see §13).

**Bit rot is real and silent.** A drive in a drawer degrades and nothing will tell you — which
is exactly why `verify` (§7.1) exists and must run monthly. Fixity is the only thing standing
between him and a corrupted archive he still believes.

---

## 13. STILL OPEN — needs HIS word, do not decide these for him

> **✅ ALL THREE CLOSED — 14 Aug 2026, by him, hours after this file was sealed. The three
> items below are kept VERBATIM as the record of what was open; the resolutions are here.
> DO NOT RE-RAISE ANY OF THEM.**
>
> 1. **PRIVACY — RULED.** *"archive HAMESHA repo ke bahar rahega. Code public, data private.
>    Koi apwaad nahi, kabhi nahi."* Written into canon (`CLAUDE.md` §Secrets & safety) and held
>    by three code belts, not by prose: `init` refuses a git work tree · `.gitignore` · the
>    `pre-commit` tripwire.
> 2. **THE THREE STAGED FACTS — CONFIRMED**, promoted to canon the same day via
>    `hippocampus.mjs promote --at <ts>`. `identity_facts.pending.jsonl` now has zero pending
>    rows. Side effect worth knowing: the SessionStart brief's budget could not fit all three
>    at once, so `context_manifest`'s "THE LIVE QUEUE ARRIVES UNCUT" assertion was RED. It was
>    never a code bug — **that assertion is a canary for "his unanswered questions have piled
>    up past their share of the brief"**, and the correct repair is to ANSWER the queue, which
>    is what closed it.
> 3. **THE v4 TENSION — PARKED, deliberately and for good.** His ruling: the OPERATIONAL half
>    is already settled by the five autonomy laws (see the 28 Aug memory file), and the rest
>    gets MEASURED, never guessed. *"Flag band karo, dobara mat uthao."* Do not re-open it as
>    an open question; if it ever returns it returns as data, not as a debate.
>
> §12's 3-2-1 is a separate matter and is **still genuinely pending**: he has not bought the
> disk (14 Aug — *"record pe rakho, nagging nahi"*). Say it if asked; never nag.

1. **PRIVACY RULING** — when life-scale data starts flowing, does it go in the PUBLIC repo or a
   private store? This is the second irreversible decision (after capture). Currently the
   archive lives outside the repo, which is safe by construction, but the ruling is unmade.
2. **Three staged identity facts** await confirm in `identity_facts.pending.jsonl`
   (his six clout people · "becoming a cyborg is my life calling" + TV/glasses plan · the
   JARVIS ruling). `remember_fact` only STAGES; canon needs his explicit word.
3. **The v4 tension he never resolved** — JARVIS Bible v4 §1 says dependency IS the goal
   (*"If Nikhil can still function normally with JARVIS turned off, JARVIS has failed"*) while
   Risk 2 in the same section prescribes periodically deciding WITHOUT it. One document, two
   opposite instructions. Open since April 2026. **His ruling only.**

---

## 14. HIS STUDY STATE — the reason all of this exists

Report this at the end of the build, and do not let the infrastructure eat the week:

- `hallucinations` forge — **step 4/12**, 9 recorded runs, 8 of them died before step 4
- Re-Jirah overdue — tokenization **53d** · embeddings **51d** · inference **48d**;
  **three concepts have never had a single round**
- `node scripts/deep.mjs due` is the queue. `tokenization` already has 9 strike questions written.

**His scope ruling, 14 Aug 2026, verbatim:** *"my pain priority is just using the cyborg
organism to study untill i get the job and then make it like to use it in every sector of my
life."*

---

## 15. HOW TO WORK THIS SESSION

1. Read `CLAUDE.md` and the 28 Aug memory file. Do not re-open parked threads.

2. 🔴 **DO NOT ASK HIM TO APPROVE THIS PLAN. BUILD IT.**
   **This spec IS the approved plan** — he ruled on it 14 Aug 2026 in his own words:
   *"i liked this plan"* and *"yes create every single thing which we need from day 1."*
   Asking again would force him to reconstruct a decision he already made, which is exactly
   the failure his own standing law names: *"MERA DIMAAG KABHI YAAD NAHI RAKHEGA … jo cheez USE
   yaad rakhni pade, woh ek DESIGN FAILURE hai"* (11 Aug 2026).

   **He approved the CLASS. Do not bring him the CASE.** Every file, function, path, cadence
   and naming choice inside this spec is yours to make — just make it and report it.
   `implementation-before-modification` is satisfied by this document.

   **Stop and ask ONLY for:**
   - the three open rulings in **§13** (privacy · the 3 staged facts · the v4 tension)
   - a genuine fork this spec does not cover, where two reasonable readings lead to
     materially different work
   - anything irreversible and outward-facing (a push, a deletion, a schedule that touches
     his machine outside the archive)

   Everything else: build it, test it, show the output.

3. Build in this order — each step green before the next:
   **`init` → schema → lexicon seed → `run` → `verify` → `backfill` → `vitals` → `seal` →
   hook extension → security (tripwire + SECRET_RE) → scheduling**
4. Run `node scripts/archivist.mjs selftest` and `npm test`. **Show the real output.**
5. Glance before any push — the repo is PUBLIC.
6. Commit with a message that carries the WHY, in repo style.

**Talk to him in Hinglish. One idea per message. Technical terms stay in English.**
**Never make it longer — always make it deeper.**

---

*Sealed 14 August 2026, IST. Every law here is traceable to a real failure in one of his two
projects. Nothing in this spec is speculative, and nothing that can be rebuilt later is in it.*

---
---

# 16. THE WORK ORDER — `archive_audit.mjs`, HIS DECISION 15 Aug 2026
## READ THIS WHOLE SECTION BEFORE WRITING A LINE. It is self-contained.

> **CLOSED 15 Aug 2026 — §16.8 at the bottom is the receipt.** Everything §16.5 asked for is
> built, everything §16.6 asked for is met, and the whole file is now a RECORD, not a work
> order. **Do not re-plan any of it.** Read §16.0–§16.7 for the reasoning (the six corrected
> laws in §16.4 are still the most expensive knowledge here and they now sit as comments above
> the code they protect); read §16.8 for what was actually done, the three forks it resolved,
> and the seventh law that running it turned up. Verify live, never from this page:
> `node scripts/archive_audit.mjs run`.

> **§1–§15 above are the SEALED SPEC and are DONE.** This section was the ONE piece of work
> that remained, decided by him on 15 Aug 2026 after the build was finished, reviewed twice,
> and pushed. Do not re-plan §1–§15. Do not treat this section as optional.

---

## 16.0 WHERE THINGS STAND (so you do not re-do finished work)

**BUILT, RUN, COMMITTED AND PUSHED** — `3fcce43..46876c1` on `origin/main`, 8 commits:

| commit | what |
|---|---|
| `ac3e613` | the archive itself — `scripts/archivist.mjs`, the spec, hook v3, tripwire, installers |
| `f311f59` | tripwire scar: it read the INDEX, not HEAD |
| `ea00fe6` | the lock: two archivists ran 119 ms apart |
| `103ea5c` | the checkpoint leaves the payload directory (`_writer/`) |
| `65262f3` | runtime state + the crash dump that was jamming `audit.mjs` |
| `92e7958` | second pass: `seal --quarter`, §4.5's guard made reachable, fixity self-watch |
| `2805fd7` | his rulings into canon, three watchman REDs closed |
| `46876c1` | the deep pass: 5 defects, plus `reconcile` + `dedupe` + the lexicon door |

Verified at hand-off: `npm test` 43/0 · `archivist.mjs selftest` 105/0 · spec audit 59/0 ·
independent deep pass 24/0 (three consecutive runs) · `verify` ALL CHAINS INTACT ·
`reconcile` clean · bag sealed CURRENT · working tree clean, nothing unpushed.

**Modes that already exist** — do not rebuild any of them:
`init · run · backfill · verify [--month] · reconcile · vitals · seal [--quarter] ·
rebuild <lane> · dedupe <lane> · lanes · lexicon <list|add|retire> · tripwire · status · selftest`

---

## 16.1 THE PROBLEM, IN ONE PARAGRAPH

The archive's entire justification for living outside the repo is: **"verifiable from its own
README alone."** Nothing tests that claim. `archivist.mjs selftest` checks the archive using
archivist.mjs's OWN `canon()`, `sha256Hex()`, `istStamp()` and `buildRecord()` — so if the
canonical-bytes rule is subtly wrong, records are written wrong, the test computes the same
wrong expectation, the suite is GREEN, and a 2046 reader following the README gets a mismatch
and concludes the archive is corrupt.

**A claim with no check is a hypothesis, and this repo's own law says an unrun system is a
hypothesis.** His framing, and it is the one that settles the maintenance argument:

> **This is not a test of `archivist.mjs`. It IS the 2046 reader, rehearsed early.**

This already paid off THIS WEEK: an independent harness written during the 15 Aug review found
**five real defects in one pass**, including one that LOST A RECORD — a mid-line read on the
rewritten `identity_facts.pending.jsonl` that erased the archive's record of the moment three
staged facts became canon. None of the five were visible to `verify`, `npm test`, or a spec audit.

---

## 16.2 HIS DECISION — all seven points, none optional

**1. BUILD IT — YES.**

**2. SCOPE — EXACTLY FOUR CHECKS. Not three, not twenty-four.**
The filter is: **does this check test the DOCUMENT or the DATA?** Document-testing belongs here.
Data-testing is already covered and duplicating it is maintenance with no value.

- **(a) Independent fixity** — recompute every record's `sha256` from the README's recipe.
- **(b) Field order, on EVERY record** — the spec fixes field order so a human diff of two
  archives is readable; nothing else checks more than a sample.
- **(c) IST partition, on EVERY record** — the record must sit in the day file its own local
  clock names, AND `ts_local` must be the SAME INSTANT as `ts_utc` (not a second, drifting clock).
- **(d) SCHEMA conformance, on EVERY record, with a GENERIC JSON-Schema validator — NOT
  archivist's.** This was missing from the original proposal and it is document-testing: it
  proves `SCHEMA/v1.json` is a sufficient DESCRIPTION, not merely that the writer agrees with
  itself.

**DROP everything else.** Chain walking is `verify`'s job. Multiplicity is `reconcile`'s job.

**3. CADENCE — monthly floor, but the real trigger is an EVENT.**
Time-based cadence is wrong here: what is being tested — "is the README sufficient" — only
changes when one of FIVE things changes. So:
- **MONTHLY, with fixity**, as the floor (catches drift nobody noticed). Not weekly — weekly
  by the clock is wasted runs.
- **AND a passing `archive_audit` run is part of the DEFINITION OF DONE for any change to:**
  `README.md` (the recipe) · `SCHEMA/v1.json` · `canon()` · `istStamp()` · `buildRecord()`.
  *(That rule is written into §16.6 below so it survives.)*
- **AND if it has not run in 90 days, the watchman raises it.** An auditor that silently stops
  is worse than none, because the green memory persists.

**4. TWO THINGS MISSING FROM THE PROPOSAL — both matter MORE than the code.**
- **(a) KNOWN-ANSWER TEST VECTORS IN THE README.** Publish real records verbatim next to their
  expected `sha256`. Then ANY future implementation, in ANY language, on ANY machine, can check
  ITSELF against the vectors before trusting itself on 34,000 records. This is how crypto
  standards make a spec self-sufficient. It is language-independent, costs nothing, and does
  more for the 2046 claim than any amount of JavaScript. **The auditor's own selftest must
  verify the vectors still match — that closes the loop.**
- **(b) THE ARCHIVE CARRIES ITS OWN VERIFIER.** If the promise is "verify without
  arsenal-ai-fc", the verifier must travel WITH the bag. At `seal`, copy `archive_audit.mjs`
  into the archive tree, clearly labelled a **REFERENCE IMPLEMENTATION, subordinate to the
  README**. The README stays the authority because it is language-independent; the code is a
  convenience. Both in the bag.

**5. THE SIX CORRECTED LAWS ARE THE REAL ASSET — see §16.4. Write each as a comment ABOVE the
check it governs, with the measurement that disproved the wrong version.** Not a summary at the
top of the file — attached to the code it protects.

**6. INDEPENDENCE GUARD — keep it and HARDEN it.** The grep-for-`archivist`-import selftest is
necessary; without it the independence rots the first time someone "removes the duplication".
Extend it: **fail if the file imports ANY local module from `scripts/`. The only permitted
imports are Node built-ins.** State that reason in the header so a future reader does not "fix" it.

**7. NOT IN SCOPE — no repair arms.** This organ REPORTS and never writes into the archive.
`archivist.mjs` remains the SOLE WRITER; a second writer would produce a chain that verifies
while being wrong about the order of his life.

---

## 16.3 THE TEST VECTORS — ALREADY COMPUTED, USE THESE EXACTLY

Generated 15 Aug 2026 and verified against the live rule. **They are SYNTHETIC on purpose** —
hand-authored, not sampled from live data, because a `rebuild` re-mints `rid` and `recorded_at`
and a vector that can change is not a vector. These three cover: a plain live record · exotic
bytes (Devanagari + emoji + CRLF + tabs + padding, testing that nothing is normalised) · a
null-clock record with a populated `moment`, a nested payload, a non-integer number, and a
relaxed `tier`.

Publish all three in the archive's `README.md`, each on one line, with its expected hash.

```
sha256 = 086f08ee288ff00e5b930052d12eb85a8e622baa8b581eb30f8af305fce87696
{"rid":"01M000000000000000000000V1","sha256":"086f08ee288ff00e5b930052d12eb85a8e622baa8b581eb30f8af305fce87696","prev_sha256":null,"seq":1,"v":1,"ts_utc":"2026-08-14T04:17:32.123Z","ts_local":"2026-08-14T09:47:32.123+05:30","tz":"Asia/Kolkata","recorded_at":"2026-08-14T04:17:33.001Z","valid_from":null,"valid_to":null,"lane":"afferent","surface":"claude-code","source":"claude-code","modality":"code","session_id":"sess-abc-123","event_id":"evt-1","tier":"private","moment":null,"payload":{"text":"hello","v":3},"derived_from":null,"agent":null,"backfilled":false}

sha256 = ab255f4501a8c07a487bb5b82be1339b5c5bbcd66ddb81492a951a3e26a10922
{"rid":"01M000000000000000000000V2","sha256":"ab255f4501a8c07a487bb5b82be1339b5c5bbcd66ddb81492a951a3e26a10922","prev_sha256":"0000000000000000000000000000000000000000000000000000000000000000","seq":2,"v":1,"ts_utc":"2026-08-14T20:08:14.198Z","ts_local":"2026-08-15T01:38:14.198+05:30","tz":"Asia/Kolkata","recorded_at":"2026-08-14T20:09:00.000Z","valid_from":null,"valid_to":null,"lane":"afferent","surface":"claude-code","source":"claude-code","modality":"code","session_id":null,"event_id":null,"tier":"private","moment":null,"payload":{"text":"  नमस्ते  🙏\r\n\ttrailing  "},"derived_from":null,"agent":null,"backfilled":true}

sha256 = 7fa088c355802a0a92bfc7ed58f9130a2e7190e9bd1185c91830e7134f4de8ae
{"rid":"01M000000000000000000000V3","sha256":"7fa088c355802a0a92bfc7ed58f9130a2e7190e9bd1185c91830e7134f4de8ae","prev_sha256":"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff","seq":3,"v":1,"ts_utc":null,"ts_local":null,"tz":null,"recorded_at":"2026-08-14T21:00:00.000Z","valid_from":null,"valid_to":null,"lane":"reps_log","surface":"system","source":"reps_log","modality":null,"session_id":null,"event_id":null,"tier":"public","moment":{"sprint_task":"1-04 Hallucinations","forge_step":4,"forge_concept":"hallucinations","readiness":{"verdict":"GREEN","day":"2026-08-04"},"focus_app":null,"cwd":"arsenal-ai-fc"},"payload":{"nested":{"b":2,"a":[1,"x",null]},"n":1.5},"derived_from":null,"agent":null,"backfilled":true}
```

**The rule they encode, restated so a reader in any language can implement it:** take the
record, REMOVE the `sha256` and `prev_sha256` fields, serialise what remains with keys sorted
(UTF-16 code-unit order, recursively) and no insignificant whitespace, encode UTF-8, SHA-256.
Vector 2 is the important one — if an implementation normalises Unicode, trims whitespace or
rewrites line endings, it will not match.

> **ALREADY PROVEN, 15 Aug 2026, and this is §16's first real evidence.** All three vectors
> were recomputed by a fresh implementation written from the paragraph above and NOTHING else —
> no import of `archivist.mjs`, no copied function. All three reproduced exactly. That is the
> first time the sentence *"the README alone is sufficient"* has been anything other than a
> hypothesis. The auditor's selftest must keep re-proving it; if a vector ever stops
> reproducing, either the rule was edited or the writer drifted, and BOTH are emergencies.

---

## 16.4 THE SIX CORRECTED LAWS — the most expensive knowledge in this file

Each of these is a law the review harness got WRONG before it got right, and every wrong
version reported a PHANTOM defect. **A checker that cries wolf costs exactly as much as one
that sleeps.** Attach each as a comment above the check it governs, with its measurement.

1. **"No lane holds the same payload twice" is WRONG.** `salience_ledger`'s SOURCE genuinely
   contains ten byte-identical payload groups (measured: 8,945 rows, 10 duplicate groups,
   multiplicities 2–4) — real events that produced identical rows — and LAW 3 forbids the
   writer to drop either. The right law is **MULTIPLICITY**: archive count == source count.
   *(That law lives in `reconcile` and is NOT this organ's job — recorded here so nobody
   re-adds a uniqueness check.)*
2. **"No backfilled record carries a moment" is WRONG.** A v3 hook row stamps its own `moment`
   at capture time, so a backfilled row legitimately keeps it. Measured: 23 backfilled records
   with a moment, all 23 from their own payload, **zero invented**. The right law is: the
   archivist never INVENTS a moment.
3. **`LEXICON/terms.jsonl` is a LOG, not a table.** A term's state is its LAST row, and a
   RETIREMENT row legitimately carries no `definition`. **Fold before judging.** Reading it as
   a table reported the retired v1 definitions as broken citations.
4. **A fixture that tests itself tests nothing.** A crash-recovery fixture rewound the
   checkpoint's `offset` but not its `anchor` — a state the code cannot produce — and went red
   against a CORRECT build. Same shape as the tripwire's injected `tracked` and §4.5's
   inline-restated guard.
5. **"No new file since the seal" ≠ "the seal is current".** Records are appended to EXISTING
   day files, so a bag goes stale with ZERO new files. Ask `sealState()`'s three numbers
   (added · changed · removed).
6. **Source-vs-archive equality on a LIVE writer flaps forever.** Measured on a healthy
   archive across three consecutive runs: **23/1, 24/0, 23/1**. The organism appends rows every
   minute, so a green result is just a quiet instant. **Snapshot the sources first, then
   measure against the snapshot**: everything that existed AT START must be archived; what
   arrives mid-check belongs to the next tick.

---

## 16.5 THE BUILD — concrete steps, in order

1. **`scripts/archive_audit.mjs`** — new organ.
   - Header states WHAT / the four checks / the independence rule / MODES.
   - **Imports: `node:fs`, `node:path`, `node:crypto`, `node:url` ONLY.** No `scripts/*` import,
     ever, and the header says why.
   - Reads `$ARSENAL_ARCHIVE` (env, default `%USERPROFILE%\CyborgArchive`).
   - Implements `canon` + sha256 **from §16.3's written rule**, and the IST offset from the
     README's stated `+05:30` — NOT by importing anything.
   - Writes a **generic** JSON-Schema validator (draft-07 subset: `type · enum · const ·
     required · properties · additionalProperties · items · minimum · minLength · pattern ·
     if/then`). Do not copy archivist's — that separation is the whole point.
   - Modes: `run` (full pass over every record) · `selftest`.
   - Journals its verdict to `health/audit-YYYY-MM.jsonl` in the archive. **Journalling its own
     result is the ONLY write it makes, and it is a health row, never a data record.** If even
     that feels like a breach of §16.2.7, have `archivist.mjs` write the row on the auditor's
     behalf — but do NOT lose the record of when it last ran, because §16.2.3's 90-day rule
     depends on it.
2. **Test vectors into the archive README** — extend `README_MD()` in `archivist.mjs` with a
   section carrying all three vectors from §16.3 and the plain-language rule. Re-run
   `archivist.mjs init` to regenerate the live README.
3. **`seal` copies the verifier into the bag** — `archivist.mjs sealArchive()` copies
   `scripts/archive_audit.mjs` to `<archive>/VERIFIER/archive_audit.mjs` plus a short
   `VERIFIER/README.md` saying: *this is a REFERENCE IMPLEMENTATION, subordinate to the
   archive's README; the README is the authority because it is language-independent.* Cover
   `VERIFIER/` in the **tagmanifest** (not the payload manifest — it is not data).
4. **Suite membership** — add `node scripts/archive_audit.mjs selftest` to `audit:selftest` in
   `package.json` (the measurement-organ suite, which exists for costly full walks). The
   coverage law in `organism_test.mjs` will then hold it automatically.
5. **Schedule** — add `ArsenalFC-ArchiveAudit` to `setup/INSTALL_ARCHIVE.ps1`, MONTHLY on the
   1st alongside `ArsenalFC-ArchiveFixity` (04:00 is taken; use 04:20). **It will hit the same
   `Set-ScheduledTask` refusal every MONTHLY task hits — the XML fallback and the
   `SetSetting`/`HardenViaXml` helpers are already in that file; reuse them.** Add it to
   `UNINSTALL_ARCHIVE.ps1` and to `dressing-room/state/tasks_expected.json`'s
   `expected_enabled` in the SAME commit (that file's own `_doc` asks for this).
6. **The 90-day watch** — `scripts/watchman.mjs` raises a finding if the newest
   `health/audit-*.jsonl` row is older than 90 days, or if there has never been one.
   *(If watchman's shape makes this expensive, the fallback is `archivist.mjs vitals`, which
   already watches the fixity lane the same way — but watchman is what he asked for. Try it
   first.)*
7. **Canon** — add one line to `CLAUDE.md`'s ARCHIVE section naming `archive_audit.mjs`, what it
   alone proves, and the definition-of-done rule from §16.6.

---

## 16.6 DEFINITION OF DONE — write this rule down, it is the point of §16.2.3

> **Any change to the archive's `README.md` recipe, `SCHEMA/v1.json`, `canon()`, `istStamp()`
> or `buildRecord()` is NOT DONE until `node scripts/archive_audit.mjs run` passes.**
> These five are the only things that can make the README insufficient. Everything else in the
> archive can change freely without re-auditing.

And for the build itself, done means ALL of:

- [ ] `node scripts/archive_audit.mjs selftest` — green, and it verifies the §16.3 vectors
- [ ] `node scripts/archive_audit.mjs run` — green over the whole live archive
- [ ] the independence guard fails on a planted `import … from "./archivist.mjs"` (**test that
      it BITES — do not just write it**; the tripwire shipped green and failed open)
- [ ] the three vectors are in the live archive's `README.md`
- [ ] `VERIFIER/` is in the sealed bag and in the tagmanifest
- [ ] `npm test` green · `archivist.mjs selftest` green · `verify` ALL CHAINS INTACT
- [ ] `ArsenalFC-ArchiveAudit` exists, battery-conditions cleared, catch-up on, fired once
      (a never-run lane reads as a dead lane)
- [ ] `tasks_expected.json` updated in the same commit
- [ ] glance, commit with the WHY, push

---

## 16.7 THE HARNESS THAT FOUND ALL THIS — IT SURVIVED

**CORRECTED within the hour it was written.** This section first said the harness was gone,
lived only in a temp folder, and "do not hunt for it". That was wrong when written: a parallel
session had already copied it to **`reference/deepcheck_harness.mjs.txt`** (304 lines, the
final corrected version — it carries the MULTIPLICITY law, the LOG-not-table fold, the
snapshot-before-comparing fix and the `23/1, 24/0, 23/1` measurement). It is UNTRACKED, so it
is on the laptop and not on the public remote. **Read it before writing the organ** — it is the
only running implementation of the four checks that exist.

*(TRACKED since 15 Aug 2026 — his "commit and push everything" — so the two sentences above are
true only of the hours before that, and the "not on the public remote" half is now false. It was
scanned before publishing: no credentials, no personal data, and its one absolute path is
already in a dozen tracked files. It stays a `.txt` deliberately, so the coverage law and the
suites never pick it up as an organ.)*

It is a REFERENCE, not the plan. It carries ~24 checks; sixteen of them duplicate `verify` and
`reconcile` and were correctly dropped by his §16.2 scope ruling. Take the four, take the
comments, leave the rest.

### AND A DUPLICATE WORK ORDER EXISTS — resolve it before building

That same parallel session also wrote **`ARCHIVE_AUDIT__WORK_ORDER.md`** at the repo root
(~19 KB, untracked), covering this same job. He then instructed, explicitly:

> *"write in the same file where your instructions were written with the work you did, no new file"*

**This section — §16 of this file — is the one he asked for, and it is the one that is
committed and pushed.** The standalone file is a second description of one job, which is
precisely the failure mode that killed the predecessor project: JARVIS died of DOCUMENT rot —
four Bibles with colliding version numbers — not of code. **Two work orders for one organ will
diverge.** Read it once for anything §16 missed, fold that in here, then delete it. Do not
maintain both.

**RESOLVED, 15 Aug 2026.** It was read in full, the four things it carried that §16 did not are
folded into §16.8 below, and the file is DELETED. One work order, in this file, as he asked.
`reference/deepcheck_harness.mjs.txt` is now TRACKED, on his "commit and push everything" the
same day (this line read "stays UNTRACKED" for about an hour). It was the reference for this
build; its six laws now live in `archive_audit.mjs`'s comments and in §16.4, and it carries
sixteen checks his §16.2 scope ruling correctly dropped. **Nothing depends on it and nothing
runs it** — it is kept as a `.txt` precisely so no suite ever does, and it is history, not an
organ. Do not "revive" it: the four checks worth keeping are already a live organ.

---
---

## 16.8 WHAT WAS BUILT — 15 Aug 2026, the record (this section is a RECEIPT, not a plan)

**All of §16.5 is done and all of §16.6 is met.** Read the live numbers, never these:
`node scripts/archive_audit.mjs run` · `node scripts/archive_audit.mjs selftest`.

| § | what landed |
|---|---|
| 16.5.1 | `scripts/archive_audit.mjs` — Node built-ins only · `canon`+sha256 and the +05:30 arithmetic written from the README's prose · a generic draft-07 validator · the four checks on every record · modes `run · selftest · guard` |
| 16.5.2 | the three vectors published verbatim in the archive's `README.md`, with the recipe restated in language; live README regenerated by `archivist.mjs init` |
| 16.5.3 | `seal` copies the organ to `<archive>/VERIFIER/archive_audit.mjs` + a `VERIFIER/README.md` that says it is subordinate to the archive README; covered by the **tagmanifest**, never the payload manifest |
| 16.5.4 | `audit:selftest` in `package.json`; `organism_test.mjs coverage` green |
| 16.5.5 | `ArsenalFC-ArchiveAudit`, MONTHLY 1st 04:20, in `INSTALL_ARCHIVE.ps1` + `UNINSTALL_ARCHIVE.ps1` + `tasks_expected.json`, same commit |
| 16.5.6 | watchman `c12` — `archive-audit-never-ran` · `archive-audit-silent` · `archive-audit-red` |
| 16.5.7 | `CLAUDE.md`'s ARCHIVE section names the organ and carries the §16.6 gate |

### THE THREE FORKS §16 LEFT OPEN, AND WHICH WAY EACH WENT

1. **WHERE THE VERDICT IS JOURNALLED.** §16.5.1 offered `health/audit-YYYY-MM.jsonl` inside the
   archive and named its own escape hatch. **Taken: the escape hatch**, through the mechanism
   that already exists. The organ writes only `dressing-room/state/archive_audit.jsonl` (its own
   lane, SOLE WRITER) and the archivist's tail carries it into the archive as lane
   `archive_audit` — so §16.2.7 holds *literally* (this organ never writes into the bag), the
   record of when it last ran survives in BOTH places, the archive-side copy is hash-chained
   like everything else, and no second door was cut into the bag. The watchman reads the
   repo-side file, which also means the 90-day rule needs no archive path — see fork 3.
2. **WHERE THE VERIFIER LIVES IN THE BAG.** §16.5.3 says `VERIFIER/`; the deleted standalone
   said `REFERENCE_VERIFIER.mjs` at top level. **§16 wins** — it is the committed order.
3. **HOW THE WATCHMAN ARMS.** It may not name the archive's env var or default folder *even in
   a comment*: `archivist.mjs`'s SINGLE WRITER guard greps all of `scripts/` for exactly those
   two strings. So c12 arms off `tasks_expected.json` instead — if the schedule contract expects
   `ArsenalFC-ArchiveAudit`, the lane is installed here and silence is a finding; on a machine
   without it, no claim. (This was not theory: the first draft of that comment *did* name them
   and reddened the guard within the minute. The guard works.)

### AND THE SINGLE-WRITER GUARD WAS TIGHTENED, NOT WHITELISTED

`archive_audit.mjs` legitimately knows where the archive lives, which broke
`archivist.mjs`'s "no other organ even knows" assertion. **A filename whitelist would have been
the wrong repair** — a name in a list is how a guard goes quietly dead. So the law now reads
*any organ that knows the path must PROVE it is read-only*, and the proof is dynamic: the
selftest spawns **the copy sealed into `VERIFIER/`**, from inside the bag with no repo around
it, and asserts three things at once — it runs and comes back GREEN, the archive tree is
**byte-identical** afterwards (§16.2.7 measured, not asserted from a header), and with no
`dressing-room/` beside it the missing journal is *named* rather than silently dropped.

### WHAT RUNNING IT FOUND — a seventh law, of the same family as §16.4's six

**§16.3's own prose overstates what the vectors prove.** It says an implementation that
"normalises Unicode, trims whitespace or rewrites line endings" will fail V2. Two of those three
are true. **The first is not:** V2's payload is normalisation-STABLE in all four Unicode forms —
NFC, NFD, NFKC and NFKD were each measured as a no-op on it (the Devanagari has no precomposed
alternative and the emoji has no decomposition), so a normalising reader still reproduces all
three hashes. The vectors catch trimming, CRLF rewriting, tab collapsing and non-UTF-8 encoding,
and they do **not** catch Unicode normalisation.
**Stated, not patched.** The vectors are frozen by his ruling and a fourth is his call, not a
session's. The archive's README now says out loud what these vectors do not cover, and the
auditor asserts the measurement rather than the claim — because asserting the sentence as
written would have been a check that passes for the wrong reason, which is exactly the shape of
all six laws in §16.4. *A document that overstates what it proves is worse than one that proves
less and says so.*

### AND TWO MORE THINGS THE SECOND VERIFICATION PASS TURNED UP

- **A DIAGNOSTIC RUN CAN POISON THE LANE THE WATCHMAN READS — `--no-journal` exists because of
  it.** A two-second check that a missing archive is fatal (`ARSENAL_ARCHIVE=C:/nonexistent
  archive_audit run`) appended an entirely legitimate `ok:false` row, and c12 then raised
  `archive-audit-red` against a perfectly healthy archive. **Every component behaved correctly** —
  that is the interesting part. The journal simply cannot tell *"the record is wrong"* from
  *"I was pointed somewhere else"*, and only a human knows which run was a probe. So `run` takes
  `--no-journal`: the verdict still prints, the exit code is unchanged, the lane is left alone.
  The red row was NOT deleted — the lane self-healed on the next real run and both red rows stay
  in history, because rewriting a journal to make a graph look better is the thing this whole
  archive exists to prevent. **Use `--no-journal` for any run against a root that is not his live
  archive.**
- **`scripts/watchman.mjs` had NO entrypoint guard — FIXED on his ruling the same hour.** Its
  dispatch (`const cmd = process.argv[2] || "run"`) ran at MODULE SCOPE, so importing it — even
  just for `gather`/`checks`, both of which it EXPORTS — executed the entire nightly job: state
  written, the whole selftest suite spawned, the Tier-2 arm reachable. Found the hard way: a
  one-line import meant only to READ state dirtied four state files mid-`npm test` and
  false-fired the "selftests leave live state untouched" law. It is now guarded with the same
  line `conductor.mjs` has carried for weeks — the one this file's own line 93 praises conductor
  for having. **Measured both directions**, because a guard that also stops the CLI is worse than
  no guard: a bare import now takes 44 ms and writes nothing (a real run took ~2 minutes), and a
  spawned CLI still reaches `main()`. Both are selftest assertions driven through real child
  processes.
  **AND IT COST SIX SINKS, WHICH IS ITS OWN LESSON.** Those two spawns are unanalysable to
  `xray.mjs`, whose per-organ ratchet — *no EXISTING organ may get blinder* — went red at
  watchman 32→38. The fix was NOT to weaken the ratchet or exempt the file: two pre-existing
  block-local path bindings (`gemini_quality.jsonl`, `mouth_log.jsonl`) were hoisted to module
  constants, the CLI spawn was switched to `join(__dirname, …)` so xray can fold it, and watchman
  came out at **23 — sharper than the baseline it started at**, with three lanes newly visible in
  the static graph. A ratchet you satisfy by making the organ genuinely more legible is a ratchet
  doing its job.

### FOLDED IN FROM THE DELETED WORK ORDER (§16.7's instruction)

- **A pass that flaps is a pass that lies** (law 6, applied to this organ): acceptance is
  `run` GREEN **three consecutive times**, not once. Done — three runs, three greens.
- **Never edit a live organ while its scheduled task is firing.** A run at 21:09:22 on 14 Aug
  loaded a half-written `archivist.mjs`, doubled five lanes and died holding the lock. Stopping
  `ArsenalFC-Archivist` first was refused by this session's permission layer, so the other
  branch of that trap was taken instead: `verify` + `reconcile` after the edits, clean.
- **`data/` still holds nothing but records** is part of acceptance, and `VERIFIER/` is the
  newest thing that had to be kept out of it.
- **After this, the archive work is finished.** What remains is HIS and only his: **3-2-1** (the
  archive is copy 1, alone; his call, "record pe rakho, nagging nahi") and `sentinel-blind`,
  which is a claude.ai routine, not a repo thing.

---

*Work order written 15 August 2026, IST, on his decision the same day. §1–§15 were DONE and
pushed before it; §16 was the only open work, and §16.8 records that it is now closed. Talk to
him in Hinglish. Never make it longer — always make it deeper.*
