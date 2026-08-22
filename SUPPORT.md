# Support

## Compatibility matrix (current)

| Dimension | Support |
|---|---|
| VS Code | `>=1.85.0` (floor); CI matrix expands to floor + previous two stable minors + current once R0.1 work starts |
| Cursor | Not yet independently verified — tracked as VSC-S-343 |
| OS | Not yet certified on any platform — this is a source scaffold, no published build yet |
| Web (`vscode.dev`/`github.dev`) | Lexical features only, once published |

This extension is in **F0 (Preview, scaffold)**. No public release exists
yet. This table will be filled in with recorded evidence as each release
candidate passes its compatibility matrix (see the governing specification
§20.2 and §21).

## Known upstream gaps

- No `sv0-lsp` language server exists yet — semantic diagnostics,
  navigation, completion, and AST-aware formatting are all blocked on
  upstream work in `sv0c` (see `task/sv0-vsc-extension-plan.Rmd` §"upstream
  work required" in the `sv0-toolchain` repository).
- No installed, versioned `sv0` CLI contract exists yet for build/run/verify
  workflows (R0.2).

## Filing a diagnostic bundle

Once `sv0: Copy Diagnostic Information` ships (R0.1), use it to attach a
redacted environment summary to your report. Until then, please include:
extension version, VS Code/Cursor version and edition, operating system, and
the exact steps to reproduce. Do not paste source code containing anything
sensitive — nothing is redacted automatically in this scaffold.

## Response boundaries

This is a community-maintained Preview extension. There is no SLA. Security
reports should follow [SECURITY.md](./SECURITY.md) once published rather
than a public issue.
