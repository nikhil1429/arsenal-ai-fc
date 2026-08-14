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
