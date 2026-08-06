# Incident backups — moved out of the live bus 2026-08-06 (audit #108)

These four files sat in `dressing-room/state/` for 12 days after the incidents that
produced them. Nothing reads them (`grep -rn "\.bak" scripts/*.mjs` → no hits) and
none was ever tracked by git. They are kept, not deleted — the layering law — but a
live state directory should contain live state, and 4.7 MB of frozen incident data
sitting beside the files organs actually read is a trap for the next reader.

| file | frozen at | the incident |
|---|---|---|
| `afferent.jsonl.pre-decontam.bak` | 2026-07-26 03:18 | the 25 Jul SELF-CAPTURE decontamination — the assistant's own output had been ingested as his words |
| `working_set.json.pre-decontam.bak` | 2026-07-26 03:10 | same incident, the downstream working set |
| `brain_ledger.jsonl.pre-phantom-cleanup.bak` | 2026-07-26 03:15 | the phantom-row cleanup of the token ledger |
| `readiness_stale_2026-07-25.json.bak` | 2026-07-30 00:10 | a stale Goalkeeper reading, parked rather than overwritten |

Restore is a plain `mv` back into `dressing-room/state/` if any of it is ever needed.

Note for the record: the self-capture class of defect **reopened on a different key**
and was closed again on 6 Aug 2026 — see `scripts/distiller.mjs` CUT 3. The 25 Jul fix
screened `modality`; the 6 Aug one screens `source`.
