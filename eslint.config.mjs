// ============================================================================
// eslint.config.mjs · ARSENAL AI FC — THE LINT GATE (AUDIT §10-C rung S2, 20 Aug 2026)
// ----------------------------------------------------------------------------
// THREE RULES, AND ONLY THREE. The rung names them, and the restraint is the point: a
// linter switched on at full volume over 105 organs produces a number nobody ever drives
// to zero, and a gate nobody can satisfy is a gate that gets deleted. These three are the
// ones that name real defects in THIS codebase:
//   · no-undef        — the readJsonl() class from the other side: a name that does not
//                       exist, caught without running the organ. The type gate catches it
//                       inside a @ts-check'd organ; this catches it in all 105.
//   · no-unused-vars  — the half-finished refactor: a binding nothing reads. Args are
//                       exempt (a callback's signature is a contract, not dead code) and
//                       a leading underscore is the declared "deliberately unused".
//   · no-empty        — `catch {}`. The organism has 445 measured silent swallows and
//                       swallow.mjs exists BECAUSE of them; this rung does not fix a single
//                       one (its FORBIDDEN line says so) — it FREEZES them, so the number
//                       can only fall from here.
// THE PARSER is typescript-eslint's, so the linter and `tsc --checkJs` agree on syntax
// rather than disagreeing at the edges; the RULES stay core ESLint, because these three
// are language rules, not type rules.
// THE RATCHET LIVES IN scripts/gates.mjs, not here: this file says WHAT is checked, the
// gate says the count MAY ONLY FALL, and `npm test` refuses a rise.
// ============================================================================
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    files: ["scripts/**/*.mjs", "hooks/**/*.mjs"],
    ignores: ["scripts/legacy/**", "node_modules/**", "dressing-room/**"],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["error", { args: "none", varsIgnorePattern: "^_", caughtErrors: "none" }],
      "no-empty": ["error", { allowEmptyCatch: false }],
    },
  },
];
