#!/bin/sh
# ci/mrj/mutants.sh <head-tree> <witness_mjud.mjs> — one mutant per re-based clause (M3, M5, M6) plus a CONTROL, each on a
# fresh copy of the LF head tree under a temp dir (never the live tree). Prints `<name> · <witness last line>` per run.
# A mutant must read RED by ITS clause's name; the CONTROL must read GREEN. No port, no daemon, no model call.
H="$1"; W="$2"; T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
run() { rm -rf "$T/mu"; cp -r "$H" "$T/mu"; sh -c "$2"; printf '%s · ' "$1"; node "$W" --org "$T/mu" | tail -1; }
run CONTROL "true"
run MU-M3 "sed -i 's/^export const JUDGE_CHILD_MS = JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS;/export const JUDGE_CHILD_MS = JUDGE_BUDGET_MS;/' $T/mu/scripts/postmatch.mjs"
run MU-M5 "sed -i 's/budget_ms: sz.call_ms, batch:/budget_ms: remaining, batch:/' $T/mu/scripts/gaffer_brain.mjs"
run MU-M6 "sed -i 's/const floor = floors.length ? Math.max(...floors) : null;/const floor = null;/; s/const seen = \[...rates, ...floors\];/const seen = [...rates];/' $T/mu/scripts/gaffer_brain.mjs"
