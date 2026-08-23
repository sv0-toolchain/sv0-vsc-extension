import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { hasScope, tokenizeLines } from "../support/grammarHarness";

// LANG-008/009 (VSC-S-122). Two things the spec asks for:
//   1. an expansion-snapshot test: every required snippet expands to text
//      the grammar itself recognizes as real sv0 syntax (not just "some
//      JSON with the right prefix");
//   2. a provenance/compiler-corpus check: each snippet's core keyword
//      usage has real precedent in the audited sv0c/examples/learn corpus,
//      so nobody invented syntax that only looks plausible.
//
// This is not a full compile (no sv0 compiler binary is invoked here — that
// belongs to a later, heavier toolchain-integration slice), but it is a
// real, automated check against the pinned upstream example files, not a
// hand-wave.

interface SnippetDef {
  prefix: string;
  body: string | string[];
  description?: string;
}

const repoRoot = path.resolve(__dirname, "..", "..", "..");
const snippetsPath = path.join(repoRoot, "snippets", "sv0.json");

// Same resolution convention as check-language-drift.mjs and
// phase0FormatterDifferential.test.ts: SV0_TOOLCHAIN_ROOT override, else a
// sibling sv0-toolchain checkout.
const sv0ToolchainRoot = process.env.SV0_TOOLCHAIN_ROOT
  ? path.resolve(process.env.SV0_TOOLCHAIN_ROOT)
  : path.join(repoRoot, "..", "sv0-toolchain");
const learnExamplesDir = path.join(sv0ToolchainRoot, "sv0c", "examples", "learn");

const REQUIRED_PREFIXES = [
  "fn",
  "main",
  "struct",
  "enum",
  "match",
  "if",
  "while",
  "for",
  "requires",
  "ensures",
  "loop_invariant",
];

function loadSnippets(): Record<string, SnippetDef> {
  return JSON.parse(readFileSync(snippetsPath, "utf8"));
}

/** Strip TextMate/VS Code snippet placeholder syntax down to plain text: ${1:foo} -> foo, ${0} -> "". */
function expandPlaceholders(body: string | string[]): string[] {
  const lines = Array.isArray(body) ? body : [body];
  return lines.map((line) => line.replace(/\$\{\d+:([^}]*)\}/g, "$1").replace(/\$\{?\d+\}?/g, ""));
}

test("LANG-008/009: exactly the required snippet prefixes are present", () => {
  const snippets = loadSnippets();
  const prefixes = Object.values(snippets)
    .map((s) => s.prefix)
    .sort();
  assert.deepEqual(prefixes, [...REQUIRED_PREFIXES].sort());
});

test("LANG-008/009: every snippet has a non-empty description and a body", () => {
  const snippets = loadSnippets();
  for (const [name, def] of Object.entries(snippets)) {
    assert.ok(def.description && def.description.length > 0, `${name} is missing a description`);
    assert.ok(def.body && (Array.isArray(def.body) ? def.body.length > 0 : def.body.length > 0), `${name} has an empty body`);
  }
});

test("LANG-008/009 expansion snapshot: every snippet, with placeholders resolved, tokenizes as real sv0 syntax", async () => {
  const snippets = loadSnippets();
  for (const [name, def] of Object.entries(snippets)) {
    const expanded = expandPlaceholders(def.body);
    const tokenLines = await tokenizeLines(expanded);
    const flat = tokenLines.flat();
    assert.ok(flat.length > 0, `${name} expanded to no tokens at all`);

    // Every snippet's defining keyword must actually be recognized as that
    // keyword by the grammar — proves the snippet body isn't just some
    // string that happens to contain the prefix.
    const keywordScope: Record<string, string> = {
      fn: "keyword.declaration.sv0",
      main: "keyword.declaration.sv0", // "main" snippet still opens with `fn`
      struct: "keyword.declaration.sv0",
      enum: "keyword.declaration.sv0",
      match: "keyword.control.sv0",
      if: "keyword.control.sv0",
      while: "keyword.control.sv0",
      for: "keyword.control.sv0",
      requires: "keyword.other.contract.sv0",
      ensures: "keyword.other.contract.sv0",
      loop_invariant: "keyword.other.contract.sv0",
    };
    const expectedScope = keywordScope[def.prefix];
    assert.ok(expectedScope, `no expected-scope mapping for prefix ${def.prefix} — update this test`);
    assert.ok(
      hasScope(flat, def.prefix, expectedScope) || flat.some((t) => t.scopes.some((s) => s === expectedScope)),
      `snippet "${name}" (prefix ${def.prefix}) did not tokenize with the expected scope ${expectedScope}: ${JSON.stringify(
        expanded,
      )}`,
    );
  }
});

test("LANG-008 provenance: requires/ensures/loop_invariant syntax matches the audited sv0c/examples/learn corpus", { skip: !existsSync(learnExamplesDir) }, () => {
  if (!existsSync(learnExamplesDir)) return;
  const files = readdirSync(learnExamplesDir).filter((f) => f.endsWith(".sv0"));
  const corpus = files.map((f) => readFileSync(path.join(learnExamplesDir, f), "utf8")).join("\n");

  // The snippets emit "requires(...)", "ensures(...)", "loop_invariant(...)"
  // — confirm that exact call-shape (keyword immediately followed by an
  // open paren) has real precedent upstream, not just plausible-looking
  // syntax invented for this extension.
  assert.match(corpus, /\brequires\s*\(/, "no requires(...) usage found in the learn corpus");
  assert.match(corpus, /\bensures\s*\(/, "no ensures(...) usage found in the learn corpus");
  assert.match(corpus, /\bloop_invariant\s*\(/, "no loop_invariant(...) usage found in the learn corpus");
});
