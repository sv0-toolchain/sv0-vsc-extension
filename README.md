# sv0 for VS Code and Cursor

> **Status: Preview (F0).** This extension currently provides **lexical**
> editing support only. It does **not** provide semantic diagnostics,
> IntelliSense, debugging, or verification — those arrive with the R0.1
> release once a compiler-backed `sv0-lsp` language server exists upstream.
> See [Maturity](#maturity) below before filing an issue about "no
> autocomplete" or "no error checking."

Editor support for [sv0](https://github.com/sv0-toolchain), a systems
programming language with static contract verification.

## Supported editors

- Visual Studio Code (desktop), engine `>=1.85.0`
- Cursor (desktop), current stable — verified independently of VS Code
- `vscode.dev` / `github.dev` — lexical features only, no remote extension host required

## What works today (F0)

- Syntax highlighting for `.sv0` files
- Comments, bracket matching, auto-closing/surrounding pairs, folding
- Snippets for `fn`, `main`, `struct`, `enum`, `match`, `if`, `while`, `for`,
  `requires`, `ensures`, `loop_invariant`
- Phase-0 document formatting: strips trailing whitespace, strips trailing
  blank lines, ensures exactly one final newline — identical to the
  toolchain's `scripts/fmt_sv0.py`. Does **not** re-indent, reorder, or
  reflow code.
- `sv0: Show Language Server Status` — always explains that no semantic
  server is configured yet in F0

## What does not work yet

- Diagnostics (errors/warnings from the compiler)
- Go to definition, find references, rename, hover, completion, signature help
- AST-aware ("real") formatting
- Build, run, verify, or debug commands
- Any network request or telemetry — the extension makes none, ever, in F0 or R0.1

## Maturity

This extension follows a two-layer delivery strategy (see the governing
specification): **F0** ships safe declarative language support with zero
semantic pretense. **R0.1** adds semantic intelligence only through a
compiler-backed, versioned language-server protocol contract — never by
scraping compiler stderr or embedding a second parser. Until `sv0-lsp` ships
upstream, this extension will not claim IntelliSense.

## Trust and security

- Opening, previewing, or highlighting a file never executes code, starts a
  process, or makes a network request — in F0, and in every untrusted
  workspace regardless of release.
- This extension collects no telemetry.
- Source text, diagnostics, and project metadata never leave the workspace
  host.

See [SECURITY.md](./SECURITY.md) for the vulnerability-reporting process
(once published) and [SUPPORT.md](./SUPPORT.md) for the compatibility matrix
and known gaps.

## Setup

Install from the Visual Studio Marketplace once published (`sv0-toolchain.sv0-lang`).
No configuration is required for F0 — open any `.sv0` file.

## Source authority

This extension is independently versioned and consumes the following
upstream repositories as read-only authorities; it never forks grammar or
type rules:

| Concern | Authority |
|---|---|
| Language grammar, types, contracts, keywords | [`sv0doc`](https://github.com/sv0-toolchain/sv0doc) |
| Compiler, diagnostics, code generation | [`sv0c`](https://github.com/sv0-toolchain/sv0c) |
| Bytecode execution | [`sv0vm`](https://github.com/sv0-toolchain/sv0vm) |
| Workspace commands and orchestration | [`sv0-toolchain`](https://github.com/sv0-toolchain/sv0-toolchain) |

## License

MIT — see [LICENSE](./LICENSE).
