import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { test } from "node:test";
import path from "node:path";
import { formatPhase0 } from "../../src/common/formatting/phase0Formatter";

// FMT-001 (VSC-S-125): differential property test against the audited
// scripts/fmt_sv0.py. Shells out to a real Python 3 process running the
// pinned reference implementation and asserts byte-identical output for a
// fixed, deterministic corpus of inputs (TEST-003: no randomness, no clock).
//
// Requires a sibling sv0-toolchain checkout (SV0_TOOLCHAIN_ROOT overrides
// the default `../sv0-toolchain`) and a `python3` on PATH. Skips — does not
// fail — when either is unavailable, same pattern as
// scripts/check-language-drift.mjs, so this suite still runs standalone.

function resolveFmtScript(): string | undefined {
  // Compiled to dist/test/unit/*.js — four levels up is this repo's parent
  // directory, where a sibling sv0-toolchain checkout is expected by default.
  const root = process.env.SV0_TOOLCHAIN_ROOT
    ? path.resolve(process.env.SV0_TOOLCHAIN_ROOT)
    : path.resolve(__dirname, "..", "..", "..", "..", "sv0-toolchain");
  const script = path.join(root, "scripts", "fmt_sv0.py");
  return existsSync(script) ? script : undefined;
}

function runFmtSv0Py(script: string, input: string): string {
  return execFileSync("python3", ["-c", "import sys; from pathlib import Path; sys.path.insert(0, str(Path(sys.argv[1]).parent)); import fmt_sv0; sys.stdout.write(fmt_sv0.format_sv0(sys.stdin.read()))", script], {
    input,
    encoding: "utf8",
  });
}

const script = resolveFmtScript();

const corpus: string[] = [
  "",
  "\n",
  "\n\n\n",
  "fn main() {}",
  "fn main() {}\n",
  "fn main() {}\n\n\n\n",
  "let x = 1;   \nlet y = 2;\t\n",
  "struct Point {\n\tx: i32,   \n\ty: i32,\n}\n\n\n",
  "   \n   \n   \n",
  "no trailing newline at all",
  "line with only spaces\t   \nnext",
  "unicode: café ☃ \n\n",
  "\t\tindented\t\t\n\t\t\n",
];

test("FMT-001 differential: formatPhase0 matches scripts/fmt_sv0.py byte-for-byte", { skip: !script }, () => {
  if (!script) return;
  for (const input of corpus) {
    const expected = runFmtSv0Py(script, input);
    const actual = formatPhase0(input);
    assert.equal(
      actual,
      expected,
      `mismatch for input ${JSON.stringify(input)}: fmt_sv0.py gave ${JSON.stringify(expected)}, formatPhase0 gave ${JSON.stringify(actual)}`,
    );
  }
});
