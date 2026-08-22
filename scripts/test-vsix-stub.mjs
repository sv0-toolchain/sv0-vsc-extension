#!/usr/bin/env node
// TODO(VSC-S-389): replace with the real release-candidate suite that
// installs the packaged .vsix passed as argv[2] into an isolated VS Code
// profile (--user-data-dir/--extensions-dir per spec §26.4) and runs the
// packaged-artifact acceptance scenarios (AC-001, AC-002, AC-006 at minimum
// for F0; the full in-scope scenario list once R0.1 features exist).
//
// This stub deliberately fails so the publish workflow cannot silently
// "pass" a release candidate that was never actually tested from the VSIX
// (TEST-008).

console.error(
  "test:vsix is not implemented yet (VSC-S-389) — refusing to report success " +
    "for an untested packaged artifact. See task/sv0-vsc-extension-checklist.Rmd.",
);
process.exit(1);
