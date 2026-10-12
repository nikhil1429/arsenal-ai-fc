// learnstate_hook.mjs — THE THIN SessionStart ENTRY FOR learnstate's brief (V609 (b), forks rows 629-631, 12 Oct 2026).
// WHY IT EXISTS: turn_hook's `start` imported learnstate.mjs on EVERY SessionStart, the headless organ sessions included,
// and learnstate's own guard (ARSENAL_ORGAN=1 → return) ran only AFTER its whole import graph had loaded: 281 ms of pure
// import on a path that prints nothing (measured c8f90e37 / 7b6ea18a, cloud/V609/CUT_SPEC.md). This file asks the SAME
// question FIRST, then imports. Nothing else changes: on his path it imports learnstate and awaits the very `hookMain`
// turn_hook used to call, so his brief is byte-equal; every verb other than `brief` is delegated whole, so learnstate's
// own guard still decides it.
// SHAPE: the CALL shape (turn_hook awaits `hookMain`), never an argv[1] shim — the ES-module cache would swallow a shim,
// and organism_test's NO SHIM CALLEE ratchet must keep seeing this callee.
// Writes nothing. No selftest verb of its own: turn_hook's selftest (G0) and the V609 (b) witness are its proof.
export async function hookMain() {
  const mode = (process.argv[2] || "brief").toLowerCase();
  if (process.env.ARSENAL_ORGAN === "1" && mode === "brief") return;   // a headless organ: silence, before any graph loads
  const m = await import("./learnstate.mjs");
  await m.hookMain();
}
