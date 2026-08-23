import assert from "node:assert/strict";
import { test } from "node:test";
import { hasScope, tokenizeLine, tokenizeLines } from "../support/grammarHarness";

// LANG-001..005, LANG-010, PERF-002 (VSC-S-115..119, 123, 124). Golden
// token-scope tests over canonical positive fixtures, run through a real
// vscode-textmate tokenizer against syntaxes/sv0.tmLanguage.json — the same
// engine VS Code itself uses, not a hand-rolled scope check.

test("LANG-001: keywords get keyword.declaration.sv0 / keyword.control.sv0 / keyword.other.contract.sv0", async () => {
  const { tokens } = await tokenizeLine("fn main() { if requires(x) { return x; } }");
  assert.ok(hasScope(tokens, "fn", "keyword.declaration.sv0"));
  assert.ok(hasScope(tokens, "if", "keyword.control.sv0"));
  assert.ok(hasScope(tokens, "requires", "keyword.other.contract.sv0"));
  assert.ok(hasScope(tokens, "return", "keyword.control.sv0"));
});

test("LANG-001: primitive types and self get storage/variable scopes", async () => {
  const { tokens } = await tokenizeLine("fn f(self: &Self) -> i32 { return 0; }");
  assert.ok(hasScope(tokens, "self", "variable.language.self.sv0"));
  assert.ok(hasScope(tokens, "Self", "variable.language.self.sv0"));
  assert.ok(hasScope(tokens, "i32", "storage.type.primitive.sv0"));
});

test("LANG-001: true/false get constant.language.sv0", async () => {
  const { tokens } = await tokenizeLine("let ok = true; let bad = false;");
  assert.ok(hasScope(tokens, "true", "constant.language.sv0"));
  assert.ok(hasScope(tokens, "false", "constant.language.sv0"));
});

test("LANG-002: line, doc, and block comments get distinct scopes", async () => {
  const lineTok = await tokenizeLine("// plain comment");
  assert.ok(hasScope(lineTok.tokens, "// plain comment", "comment.line.double-slash.sv0"));

  const docTok = await tokenizeLine("/// doc comment");
  assert.ok(hasScope(docTok.tokens, "/// doc comment", "comment.line.documentation.sv0"));

  const blockLines = await tokenizeLines(["/* block", "comment */", "let x = 1;"]);
  assert.ok(blockLines[0]!.some((t) => t.scopes.some((s) => s === "comment.block.sv0")));
  assert.ok(blockLines[1]!.some((t) => t.scopes.some((s) => s === "comment.block.sv0")));
  assert.ok(hasScope(blockLines[2]!, "let", "keyword.declaration.sv0"));
});

test("LANG-002: nesting is not implied — a nested /* is plain text inside the outer block comment", async () => {
  const lines = await tokenizeLines(["/* outer /* inner */", "still code after close;"]);
  // The grammar's block-comment rule ends at the FIRST */, so "still code
  // after close;" must be tokenized as ordinary code, not comment text.
  const secondLineText = lines[1]!.map((t) => t.text).join("");
  assert.equal(secondLineText, "still code after close;");
  assert.ok(!lines[1]!.some((t) => t.scopes.includes("comment.block.sv0")));
});

test("LANG-003: string escapes (plain, hex, unicode) get constant.character.escape scopes", async () => {
  const { tokens } = await tokenizeLine('let s = "a\\nb\\x41c\\u{1F600}";');
  assert.ok(hasScope(tokens, "\\n", "constant.character.escape.sv0"));
  assert.ok(hasScope(tokens, "\\x41", "constant.character.escape.hex.sv0"));
  assert.ok(hasScope(tokens, "\\u{1F600}", "constant.character.escape.unicode.sv0"));
});

test("LANG-003: an invalid escape shape is not classified as constant.character.escape", async () => {
  // \q is not a defined escape in sv0doc's lexical grammar; the grammar
  // must not over-match it as a valid escape scope.
  const { tokens } = await tokenizeLine('let s = "a\\qb";');
  assert.ok(!hasScope(tokens, "\\q", "constant.character.escape.sv0"));
});

test("LANG-004: numeric literals across all bases, with suffixes, without adjacent-identifier bleed", async () => {
  const { tokens } = await tokenizeLine("let a = 0xFF_i32 + 0o17 + 0b1010_u8 + 42usize + 3.14f64;");
  assert.ok(hasScope(tokens, "0xFF_i32", "constant.numeric.integer.hex.sv0"));
  assert.ok(hasScope(tokens, "0o17", "constant.numeric.integer.octal.sv0"));
  assert.ok(hasScope(tokens, "0b1010_u8", "constant.numeric.integer.binary.sv0"));
  assert.ok(hasScope(tokens, "42usize", "constant.numeric.integer.decimal.sv0"));
  assert.ok(hasScope(tokens, "3.14f64", "constant.numeric.float.sv0"));
});

test("LANG-004: a number directly followed by an identifier does not swallow the identifier", async () => {
  // e.g. `0xffresult` should not appear as one numeric token that eats
  // `result` into the hex literal's own token.
  const { tokens } = await tokenizeLine("let x = 1result;");
  const numberTokens = tokens.filter((t) => t.scopes.some((s) => s.startsWith("constant.numeric.")));
  assert.ok(numberTokens.every((t) => t.text !== "1result"));
});

test("LANG-005: comparison, logical, shift, and range operators are scoped without disambiguating & vs &mut", async () => {
  const { tokens } = await tokenizeLine("if a >= b && c << 2 == d..=e { }");
  assert.ok(hasScope(tokens, ">=", "keyword.operator.comparison.sv0"));
  assert.ok(hasScope(tokens, "&&", "keyword.operator.logical.sv0"));
  assert.ok(hasScope(tokens, "<<", "keyword.operator.shift.sv0"));
  assert.ok(hasScope(tokens, "==", "keyword.operator.comparison.sv0"));
  assert.ok(hasScope(tokens, "..=", "keyword.operator.range.sv0"));
});

test("LANG-005: compound assignment operators tokenize as one operator, not a shorter prefix + leftover char", async () => {
  // Regression: the underlying oniguruma scanner breaks same-start-position
  // ties by pattern array order, not match length, so a naively-ordered
  // grammar can split "<<=" into "<<" (shift) + "=" (assignment), or "&="
  // into "&" (bitwise) + "=" (assignment). Each of these must be ONE token.
  const cases: Array<[string, string]> = [
    ["x <<= 1;", "<<="],
    ["x >>= 1;", ">>="],
    ["x += 1;", "+="],
    ["x -= 1;", "-="],
    ["x *= 1;", "*="],
    ["x /= 1;", "/="],
    ["x %= 1;", "%="],
    ["x &= 1;", "&="],
    ["x |= 1;", "|="],
    ["x ^= 1;", "^="],
  ];
  for (const [line, op] of cases) {
    const { tokens } = await tokenizeLine(line);
    assert.ok(
      hasScope(tokens, op, "keyword.operator.assignment.sv0"),
      `expected a single "${op}" assignment token in "${line}", got: ${JSON.stringify(tokens.map((t) => t.text))}`,
    );
  }
});

test("LANG-010: empty input tokenizes without error", async () => {
  const { tokens } = await tokenizeLine("");
  assert.deepEqual(tokens.map((t) => t.text).join(""), "");
});

test("LANG-010: a line with non-BMP Unicode before an invalid expression tokenizes without throwing", async () => {
  const { tokens } = await tokenizeLine('let s = "\u{1F600}"; @@@ garbage ###');
  assert.ok(tokens.length > 0);
  assert.ok(hasScope(tokens, "let", "keyword.declaration.sv0"));
});

test("LANG-010 / GOV-003: malformed/incomplete source tokenizes as text, never throws (TextMate is not a validity check)", async () => {
  await assert.doesNotReject(async () => {
    await tokenizeLine('fn ((( { "unterminated string');
  });
});

test("PERF-002: a 1 MiB single line tokenizes within a bounded time budget (no catastrophic backtracking)", async () => {
  const longLine = `let x = ${"1".repeat(1024 * 1024)};`;
  const start = Date.now();
  const { tokens } = await tokenizeLine(longLine);
  const elapsedMs = Date.now() - start;
  assert.ok(tokens.length > 0);
  assert.ok(elapsedMs < 5000, `tokenizing a 1 MiB line took ${elapsedMs}ms, expected < 5000ms`);
});
