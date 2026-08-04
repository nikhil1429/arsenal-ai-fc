# COMMIT NOTES — read this before the next commit

> Written 4 Aug 2026 during the 106-defect repair. Delete this file once the commit below
> has landed and CI is green.

## 1. THE CI LANDMINE (audit issue #77) — the one thing that MUST NOT be split

`package.json`'s `organism:selftest` now runs four scripts that **git does not track yet**:

```
scripts/conductor.mjs      (new — the morning chain)
scripts/limits.mjs         (new — every numerical limit next to its real data)
scripts/validators.mjs     (new — the ONE zero-hallucination validator)
scripts/reconcile.mjs      (new — the produce-and-consume check)
```

`.github/workflows/awayday.yml` runs `organism:selftest` **on every push to main and on a
nightly cron**. So a selective commit — `git commit -am`, or committing `package.json` on its
own — reddens every push and the nightly away-day with `Cannot find module`.

The workflow's own header records that this exact class of red already happened once:
**~24 red emails between 15–29 Jul trained everyone to ignore CI.** Do not do it twice.

**These must land in the SAME commit:**

```bash
git add scripts/conductor.mjs scripts/limits.mjs scripts/validators.mjs scripts/reconcile.mjs package.json
```

Verify before pushing — this must print nothing:

```bash
for s in $(grep -o 'scripts/[a-z_]*\.mjs' package.json | sort -u); do git ls-files --error-unmatch "$s" >/dev/null 2>&1 || echo "UNTRACKED: $s"; done
```

## 2. ALSO NEW, and worth committing with them

```
setup/run_logged.cmd            every scheduled organ gets a log + keeps its exit code (#98)
setup/INSTALL_CONDUCTOR.ps1     WRITTEN BUT NEVER RUN — needs the captain (#41/#42/#43)
```

`setup/run_logged.cmd` **must stay CRLF + ASCII.** A `.cmd` saved with LF-only line endings
makes cmd.exe eat the first character of every line (`REM` parses as `M`) — this was hit and
fixed during the repair. Check before committing:

```bash
file setup/run_logged.cmd    # should say "with CRLF line terminators"
```

## 3. THE PUBLIC-REPO GLANCE (CLAUDE.md: "glance before every push")

Two gitignore holes were found and closed on 4 Aug. Both were rules that stopped one
character short of the file they were written for — the same shape as the `.bak` leak the
E2E audit caught:

- `*.log` did **not** match rolled logs (`thalamus.log.1`). The #10/#98 fixes both roll at
  2 MB, so that pattern is now reachable. Closed with `*.log.[0-9]`.
- `dressing-room/state/presence_log.jsonl` did **not** match the monthly roll
  (`presence_log.2026-07.jsonl`), which carries the same activity telemetry. Closed.
- `**/readiness.json` + `**/intake_log.json` added (#79) — the old rules were path-anchored,
  so a copy anywhere else in the tree was publishable. These hold Oura biometrics and
  **medication-intake timing**.

Confirm nothing personal is staged:

```bash
git status --short | grep '^??'
```

Should list only source files and the two audit documents.

## 4. STILL UNDECIDED — do not commit blind

- `ORGANISM_ISSUES.md` / `ORGANISM_REPAIR_PLAN.md` are untracked. They describe the machine
  in detail and name his condition in places. **Repo is PUBLIC** — his call whether these
  belong in it (this is audit issue #80's neighbourhood).
- `.audit_tmp/` is leftover scratch from the audit session. Ignored now; delete when done.
