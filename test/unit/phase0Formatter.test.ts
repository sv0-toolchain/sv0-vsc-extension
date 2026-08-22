import assert from "node:assert/strict";
import { test } from "node:test";
import { formatPhase0 } from "../../src/common/formatting/phase0Formatter";

// FMT-001/002 (VSC-S-125/126). This is a starter unit suite, not yet the
// required differential-vs-fmt_sv0.py property test — see the checklist.

test("empty input becomes a single LF", () => {
  assert.equal(formatPhase0(""), "\n");
});

test("strips trailing whitespace per line", () => {
  assert.equal(formatPhase0("let x = 1;   \n\tlet y = 2;\t\n"), "let x = 1;\n\tlet y = 2;\n");
});

test("strips trailing blank lines", () => {
  assert.equal(formatPhase0("fn main() {}\n\n\n\n"), "fn main() {}\n");
});

test("always ends with exactly one final LF", () => {
  assert.equal(formatPhase0("fn main() {}"), "fn main() {}\n");
});

test("normalizes CRLF to LF", () => {
  assert.equal(formatPhase0("let x = 1;\r\nlet y = 2;\r\n"), "let x = 1;\nlet y = 2;\n");
});

test("is idempotent", () => {
  const once = formatPhase0("fn main() {   \n\n\n");
  assert.equal(formatPhase0(once), once);
});

test("preserves every non-whitespace character", () => {
  const input = "struct Point {\n\tx: i32,   \n\ty: i32,\n}\n\n\n";
  const output = formatPhase0(input);
  const stripNonEssentialWhitespace = (s: string) => s.replace(/[ \t]+(?=\n)|[ \t\n]+$/g, "");
  assert.equal(stripNonEssentialWhitespace(output), stripNonEssentialWhitespace(input));
});
