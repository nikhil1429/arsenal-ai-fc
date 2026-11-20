// ci/mf4/clock.mjs — the witness's FIXED CLOCK, preloaded with `node --import <this file's URL>`.
// Reads MF4_CLOCK (an ISO instant) from the child's env; `new Date()` and `Date.now()` return it,
// every other Date form is untouched. Only the witness's children load it; no organ reads MF4_CLOCK.
const FIXED = Date.parse(String(process.env.MF4_CLOCK || ""));
if (Number.isFinite(FIXED)) {
  const Real = Date;
  class Fixed extends Real {
    constructor(...a) { if (a.length === 0) super(FIXED); else super(...a); }
    static now() { return FIXED; }
  }
  globalThis.Date = Fixed;
}
