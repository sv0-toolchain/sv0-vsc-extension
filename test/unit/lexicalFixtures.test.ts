import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { tokenizeLine } from "../support/grammarHarness";

// LANG-010 (VSC-S-123): the fixture inventory itself. Five of the six
// required case categories are committed files under test/fixtures/lexical/
// (LF, CRLF, Unicode, empty-file, malformed/incomplete-source); the sixth
// (very-long-line) is generated at test time rather than committed, to
// avoid a multi-hundred-KB blob in git history — its behavior is exercised
// here AND already covered by the PERF-002 budget test in grammar.test.ts.
//
// Every fixture's contract is simply: tokenizing it, line by line, must
// never throw. That is the whole LANG-010 promise — lexical robustness, not
// semantic validity (GOV-003).

// Compiled to dist/test/unit/*.js. Fixtures are plain .sv0 text, not
// compiled, so they're read from the SOURCE tree: three levels up from
// dist/test/unit is the repo root, then back down into test/fixtures.
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const fixturesDir = path.join(repoRoot, "test", "fixtures", "lexical");

function splitLines(content: string): string[] {
  // Deliberately does NOT special-case \r\n vs \n here — the fixture
  // inventory exists to prove BOTH line-ending styles survive, so the CRLF
  // fixture is split on the same regex a real line-ending-agnostic caller
  // would use.
  return content.split(/\r\n|\r|\n/);
}

async function assertFixtureTokenizesCleanly(fileName: string): Promise<string[]> {
  const filePath = path.join(fixturesDir, fileName);
  const content = readFileSync(filePath, "utf8");
  const lines = splitLines(content);
  for (const line of lines) {
    await assert.doesNotReject(async () => {
      await tokenizeLine(line);
    }, `fixture ${fileName} failed to tokenize line: ${JSON.stringify(line)}`);
  }
  return lines;
}

test("LANG-010 fixture inventory: every committed fixture file is accounted for", () => {
  const expected = ["lf.sv0", "crlf.sv0", "unicode.sv0", "empty.sv0", "malformed.sv0"];
  const actual = readdirSync(fixturesDir).filter((f) => f.endsWith(".sv0")).sort();
  assert.deepEqual(actual, [...expected].sort());
});

test("LANG-010: LF fixture tokenizes cleanly", async () => {
  const lines = await assertFixtureTokenizesCleanly("lf.sv0");
  assert.ok(lines.length > 5, "expected a multi-line fixture");
});

test("LANG-010: CRLF fixture tokenizes cleanly and actually contains CRLF terminators", async () => {
  const raw = readFileSync(path.join(fixturesDir, "crlf.sv0"), "utf8");
  assert.ok(raw.includes("\r\n"), "fixture must contain real CRLF terminators to test anything");
  await assertFixtureTokenizesCleanly("crlf.sv0");
});

test("LANG-010: Unicode fixture (non-BMP emoji, CJK, accents) tokenizes cleanly", async () => {
  const raw = readFileSync(path.join(fixturesDir, "unicode.sv0"), "utf8");
  assert.ok([...raw].some((ch) => ch.codePointAt(0)! > 0xffff), "fixture must contain a real non-BMP code point");
  await assertFixtureTokenizesCleanly("unicode.sv0");
});

test("LANG-010: empty-file fixture is genuinely empty and tokenizes to nothing", async () => {
  const raw = readFileSync(path.join(fixturesDir, "empty.sv0"), "utf8");
  assert.equal(raw.length, 0);
  // vscode-textmate always returns at least one (zero-width, base-scope)
  // token for an empty line — that's expected engine behavior, not a bug.
  // The real assertion is that no non-empty text is produced.
  const { tokens } = await tokenizeLine("");
  assert.equal(tokens.map((t) => t.text).join(""), "");
});

test("LANG-010 / GOV-003: malformed fixture tokenizes as text without throwing", async () => {
  await assertFixtureTokenizesCleanly("malformed.sv0");
});

test("LANG-010: very-long-line case (generated, not committed) tokenizes cleanly", async () => {
  const veryLongLine = `let s = "${"x".repeat(500_000)}";`;
  const { tokens } = await tokenizeLine(veryLongLine);
  assert.ok(tokens.length > 0);
});
