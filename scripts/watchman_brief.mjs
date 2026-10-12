// watchman_brief.mjs — THE THIN SessionStart ENTRY FOR the watchman's brief (V609 (b), forks rows 629-631, 12 Oct 2026).
// WHY IT EXISTS: turn_hook's `start` imported watchman.mjs on EVERY SessionStart, the headless organ sessions included;
// its brief prints nothing under ARSENAL_ORGAN=1, but the whole import graph had already loaded: 188 ms of pure import
// on a silent path (measured c8f90e37 / 7b6ea18a, cloud/V609/CUT_SPEC.md). This file asks the SAME question FIRST, then
// imports watchman and awaits its own main (exported as `hookMain`), so his brief is byte-equal; every verb other than
// `brief` is delegated whole (watchman's own default verb is `run`).
// SHAPE: the CALL shape, never a re-created argv[1] shim — the ES-module cache would swallow a shim (R-01), and
// organism_test's NO SHIM CALLEE ratchet must keep seeing this callee.
// Writes nothing. No selftest verb of its own: turn_hook's selftest (G0) and the V609 (b) witness are its proof.
export async function hookMain() {
  const mode = process.argv[2] || "run";
  if (process.env.ARSENAL_ORGAN === "1" && mode === "brief") return;   // a headless organ: the brief is silent there, so no graph loads either
  const m = await import("./watchman.mjs");
  await m.hookMain();
}
