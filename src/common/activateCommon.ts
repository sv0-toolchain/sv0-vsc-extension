import * as vscode from "vscode";
import { formatPhase0 } from "./formatting/phase0Formatter";

/**
 * Browser-safe activation shared by the Node and web extension entry points.
 * Registers only what needs no process spawning and no filesystem access
 * beyond the open document (SEC-002, SEC-007): phase-0 formatting and the
 * F0 status command. LSP client wiring is Node-only (src/node/client) and
 * is NOT called from here.
 */
export function activateCommon(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider("sv0", {
      provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
        const original = document.getText();
        const formatted = formatPhase0(original);
        if (formatted === original) {
          return [];
        }
        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(original.length),
        );
        return [vscode.TextEdit.replace(fullRange, formatted)];
      },
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("sv0.showServerStatus", () => {
      void vscode.window.showInformationMessage(
        "sv0: no language server is configured yet (F0 preview — lexical support only). " +
          "Semantic diagnostics, navigation, and completion arrive with the sv0-lsp-backed R0.1 release.",
      );
    }),
  );
}
