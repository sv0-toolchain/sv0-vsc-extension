# Security Policy

## Supported versions

No version of this extension is published yet. Once a Marketplace release
exists, this section will name the currently supported line(s) — expect only
the latest Preview/R0.x line to receive fixes until R1.

## Reporting a vulnerability

Please report suspected vulnerabilities privately via a GitHub security
advisory on this repository rather than a public issue, so a fix can ship
before disclosure. Include: affected version, VS Code/Cursor version and OS,
minimal reproduction, and impact.

## Secret handling

This extension collects no telemetry and makes no network requests (F0 and
R0.1). Do not include API keys, tokens, or credentials in reproduction steps
or attached logs — nothing is redacted automatically before this repository
implements `sv0: Copy Diagnostic Information` (R0.1, OBS-005).

## Supply chain

- Production runtime dependencies are pinned via the committed lockfile and
  reviewed for install scripts and transitive native code before being
  added.
- No upstream `sv0c`/`sv0vm`/`sv0-lsp`/Z3 binary is bundled with this
  extension until its license and redistribution permission are explicit
  and reviewed (PKG-008).
- Marketplace releases are published via GitHub Actions OIDC trusted
  publishing from a protected environment — no long-lived publish token is
  used in the standard release path.

This policy will be expanded with a full response-time commitment once the
extension reaches R0.1 (DOC-005).
