# setup/services — WHO OWNS A DAEMON'S LIFE (S9 · OWNERSHIP, 28 Aug 2026)

**Every file in this folder is GENERATED.** Do not hand-edit them; edit the `surface`
column in `DAEMONS` (scripts/daemon_watchdog.mjs) or `scripts/services.mjs`, then:

```
node scripts/services.mjs emit
```

## Why this exists

The watchdog used to be the only thing that restarted a dead daemon, and it was
`LogonType=Interactive` — so **no logged-in session meant no supervisor at all**.
It also relaunched purely off "port closed", which on 28 Aug 2026 meant an
orientation `--help` woke four daemons inside a switched-off organism.

Ownership now belongs to the OS. The watchdog reports; it does not launch.

## The two classes, and why the split is not negotiable

| class | who | how | why not the other way |
|---|---|---|---|
| headless | cortex · thalamus · brain · sitting · context | WinSW **service**, restart-on-failure, delayed auto-start | — |
| desktop | turnstile · dugout | **logon task**, RestartOnFailure + StartWhenAvailable | session 0 has no clipboard, no mic, no browser — a service would install fine and do nothing |

## Install

`powershell -ExecutionPolicy Bypass -File setup\services\install.ps1` (elevated).
It asks for your Windows password once, for the services. **It goes to Windows, not
to a file** — no credential is ever written here, and no session sees it.

**Nothing starts.** Services install `start=demand`, tasks register disabled.
S12 turns the organism back on, stage by stage, on your word.
