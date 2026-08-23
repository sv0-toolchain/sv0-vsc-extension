import assert from "node:assert/strict";
import { test } from "node:test";
import { tokenizeLine } from "../support/grammarHarness";

// PERF-002 (VSC-S-124): a deterministic adversarial-pattern corpus, not a
// randomized fuzzer (TEST-003 forbids non-deterministic test inputs). Each
// case targets a specific catastrophic-backtracking shape a naive
// hand-written TextMate grammar is prone to: long runs of a single
// near-match character, deeply repeated escape-like prefixes, and
// almost-but-not-quite valid multi-char operator/comment/numeric prefixes
// that could force a regex engine into exponential-time backtracking if a
// pattern were built with nested quantifiers instead of the grammar's
// single bounded alternations.
//
// Budget: every case must tokenize in well under a second. Linear-time
// patterns finish in low single-digit milliseconds; this budget only needs
// to be tight enough to fail loudly on genuine catastrophic backtracking
// (which manifests as seconds-to-minutes, not milliseconds).
const BUDGET_MS = 2000;
const REPEAT = 200_000;

const cases: Array<[string, string]> = [
  ["long run of a single comparison char (never completes an operator)", "<".repeat(REPEAT)],
  ["long run of a single bitwise/shift char", "&".repeat(REPEAT)],
  ["long run of forward slashes (near-miss for // and /* )", "/".repeat(REPEAT)],
  ["long run of asterisks (near-miss for block-comment close)", "*".repeat(REPEAT)],
  ["deeply repeated backslash (near-miss escape prefix, unterminated string)", `"${"\\".repeat(REPEAT)}`],
  ["long run of underscores (near-miss numeric-literal separator, no digits)", `0x${"_".repeat(REPEAT)}`],
  ["long run of digits with no terminator (decimal-literal stress)", "1".repeat(REPEAT)],
  ["long run of a near-miss range operator prefix", ".".repeat(REPEAT)],
  ["alternating near-miss operator chars", "<>".repeat(REPEAT / 2)],
  ["long identifier-shaped run (word-boundary stress)", "a".repeat(REPEAT)],
];

for (const [description, line] of cases) {
  test(`PERF-002 fuzz: ${description}`, async () => {
    const start = Date.now();
    const { tokens } = await tokenizeLine(line);
    const elapsedMs = Date.now() - start;
    assert.ok(tokens.length > 0, "expected at least one token");
    assert.ok(
      elapsedMs < BUDGET_MS,
      `tokenizing took ${elapsedMs}ms, expected < ${BUDGET_MS}ms (possible catastrophic backtracking)`,
    );
  });
}
