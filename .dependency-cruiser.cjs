// ============================================================================
// .dependency-cruiser.cjs · ARSENAL AI FC — THE IMPORT HALF OF OWNERS-ONLY
//   (THE ORGANISM AUDIT §10-C · rung S3, 20 Aug 2026)
// ----------------------------------------------------------------------------
// The owners-only law has two halves. The STRING half — who writes which path under
// dressing-room/state — belongs to laws/owners-only-state-write.yml and to xray's IR,
// which resolves paths through joins and constants. The IMPORT half belongs here,
// declaratively, and it is the half nobody had: which module may reach which module.
//
// FOUR RULES, and each one is an accident this repo can actually have:
//   1 no-circular      — two organs that import each other have no owner between them;
//                        "who writes this" stops having an answer at a cycle.
//   2 not-to-unresolvable — an import of a module that is not there. The readJsonl class
//                        one level up: a name that does not exist, found before runtime.
//   3 no-dev-dep-in-prod — an ORGAN importing a devDependency. The organism runs from a
//                        bare checkout with no dev toolchain (gates.mjs's own
//                        NOT-MEASURABLE-HERE path exists for exactly that world); an organ
//                        that imports eslint or typescript dies at 03:00 on the scheduler.
//   4 no-orphans       — a module nothing imports and nothing runs. A LEAD, never a RED:
//                        in this organism almost every organ is a CLI with no importer by
//                        design, so this rule is informational and scripts/lawpack.mjs
//                        prints it as a lead (§4 binds new instruments too).
// A rule here NEVER edits anything. scripts/lawpack.mjs is the gate, and it is a ratchet.
// ============================================================================
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "A cycle between organs means the owners-only question has no answer inside it.",
      from: {},
      to: { circular: true },
    },
    {
      name: "not-to-unresolvable",
      severity: "error",
      comment: "An import of a module that does not exist — the undefined-symbol class, one level up.",
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: "no-dev-dep-in-prod",
      severity: "error",
      comment: "An organ must run from a bare checkout. A devDependency import dies on the scheduler at 03:00.",
      from: { path: "^(scripts|hooks)/", pathNot: "\.(test|spec)\.(m?js)$" },
      to: { dependencyTypes: ["npm-dev"] },
    },
    {
      name: "no-orphans",
      severity: "info",
      comment: "LEAD, not a defect: in this organism most organs are CLIs with no importer by design.",
      from: { orphan: true, pathNot: "\.d\.ts$" },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)(node_modules|dressing-room|docs|learning-layer|reference|\.audit_tmp)/|^scripts/legacy/" },
    tsPreCompilationDeps: false,
    combinedDependencies: false,
    preserveSymlinks: false,
    reporterOptions: { text: { highlightFocused: true } },
  },
};
