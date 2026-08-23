import { readFileSync } from "node:fs";
import path from "node:path";
import {
  INITIAL,
  Registry,
  parseRawGrammar,
  type IGrammar,
  type IOnigLib,
  type StateStack,
} from "vscode-textmate";
import { loadWASM, OnigScanner, OnigString } from "vscode-oniguruma";

// Compiled to dist/test/support/grammarHarness.js — three levels up is the repo root.
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const grammarPath = path.join(repoRoot, "syntaxes", "sv0.tmLanguage.json");

let oniguruma: IOnigLib | undefined;

async function getOniguruma(): Promise<IOnigLib> {
  if (oniguruma) return oniguruma;
  const wasmPath = require.resolve("vscode-oniguruma/release/onig.wasm");
  const wasmBin = readFileSync(wasmPath).buffer;
  await loadWASM(wasmBin);
  oniguruma = {
    createOnigScanner: (patterns: string[]) => new OnigScanner(patterns),
    createOnigString: (s: string) => new OnigString(s),
  };
  return oniguruma;
}

let grammarPromise: Promise<IGrammar> | undefined;

async function loadGrammar(): Promise<IGrammar> {
  if (grammarPromise) return grammarPromise;
  grammarPromise = (async () => {
    const registry = new Registry({
      onigLib: getOniguruma(),
      loadGrammar: async (scopeName: string) => {
        if (scopeName !== "source.sv0") return null;
        const content = readFileSync(grammarPath, "utf8");
        return parseRawGrammar(content, grammarPath);
      },
    });
    const grammar = await registry.loadGrammar("source.sv0");
    if (!grammar) {
      throw new Error("failed to load source.sv0 grammar");
    }
    return grammar;
  })();
  return grammarPromise;
}

export interface TokenScope {
  text: string;
  scopes: string[];
}

/** Tokenize a single line and return each token's text + full scope stack. */
export async function tokenizeLine(line: string, ruleStack: StateStack = INITIAL): Promise<{
  tokens: TokenScope[];
  ruleStack: StateStack;
}> {
  const grammar = await loadGrammar();
  const result = grammar.tokenizeLine(line, ruleStack);
  const tokens = result.tokens.map((t) => ({
    text: line.slice(t.startIndex, t.endIndex),
    scopes: t.scopes,
  }));
  return { tokens, ruleStack: result.ruleStack };
}

/** Tokenize multiple lines in order, threading the rule stack (for multi-line constructs like block comments). */
export async function tokenizeLines(lines: string[]): Promise<TokenScope[][]> {
  let stack = INITIAL;
  const out: TokenScope[][] = [];
  for (const line of lines) {
    const { tokens, ruleStack } = await tokenizeLine(line, stack);
    out.push(tokens);
    stack = ruleStack;
  }
  return out;
}

/** True if any token covering `needle` (exact text match) carries `scope` (or a more specific scope prefixed by it). */
export function hasScope(tokens: TokenScope[], needle: string, scope: string): boolean {
  return tokens.some((t) => t.text === needle && t.scopes.some((s) => s === scope || s.startsWith(`${scope}.`)));
}
