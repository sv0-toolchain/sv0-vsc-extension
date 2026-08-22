import * as vscode from "vscode";
import { activateCommon } from "../common/activateCommon";

/**
 * Web extension-host entry point (vscode.dev / github.dev / web workers).
 * Must import only browser-safe common modules (COMP-001, COMP-007) — no
 * Node `child_process`, `fs`, or `net`. Lexical/status/phase-0-formatting
 * behavior only; semantic features are never advertised from this entry
 * point without a remote extension host (spec §17.2).
 */
export function activate(context: vscode.ExtensionContext): void {
  activateCommon(context);
}

export function deactivate(): void {
  // No language server in the web host; nothing to tear down.
}
