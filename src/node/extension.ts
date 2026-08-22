import * as vscode from "vscode";
import { activateCommon } from "../common/activateCommon";

/**
 * Node extension-host entry point. F0 owns only declarative/lexical
 * behavior here (PKG-002: activated by onLanguage:sv0, not eagerly).
 * The LSP client (src/node/client) is wired in starting Phase 2/R0.1 —
 * intentionally absent in this F0 scaffold.
 */
export function activate(context: vscode.ExtensionContext): void {
  activateCommon(context);
}

export function deactivate(): void {
  // No language server running yet in F0; nothing to tear down.
}
