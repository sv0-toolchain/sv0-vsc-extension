# Changelog

All notable changes to the sv0 extension are documented here. This file
follows [Keep a Changelog](https://keepachangelog.com/); versions follow
SemVer as constrained by the Marketplace publication runbook (numeric
`major.minor.patch`, no pre-release suffix in `package.json.version`).

## [Unreleased]

Repository scaffold only — not yet published to the Marketplace.

### Added

- Extension manifest, TextMate grammar, language configuration, and snippet
  set for `.sv0` files (F0 lexical support).
- Phase-0 document formatting (whitespace-only, matching
  `scripts/fmt_sv0.py`).
- `sv0: Show Language Server Status` command.

### Known limitations

- No semantic diagnostics, navigation, or completion (blocked on an upstream
  `sv0-lsp` server — see `task/sv0-vsc-extension-plan.Rmd` UP-002/UP-003 in
  the `sv0-toolchain` repository).
- Not yet published to the Visual Studio Marketplace.
