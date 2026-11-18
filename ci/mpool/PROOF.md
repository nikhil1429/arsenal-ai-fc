# MPOOL BUILD — PROOF (draft; completed below as each step is measured)

## SETTINGS LINE

The project `.claude/settings.json` key the runner lands apart, by hand, under a later row (row 1062 F3 B). This
branch never edits that file; the witness plants this object into its temp copy only.

```json
{
  "statusLine": {
    "type": "command",
    "command": "node \"$CLAUDE_PROJECT_DIR/scripts/usage_tap.mjs\" statusline",
    "padding": 0
  }
}
```
