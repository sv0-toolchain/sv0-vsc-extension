/**
 * Phase-0 formatting (FMT-001/002). Pure text transformation, no parsing.
 * Must stay byte-for-byte equivalent to the audited `scripts/fmt_sv0.py`
 * (sv0-toolchain@8a1eeb270078557bd713e5c03923b60f9f8db001):
 *   1. remove trailing whitespace on each line
 *   2. remove trailing blank lines
 *   3. append exactly one final LF
 * Empty input becomes a single LF.
 */
export function formatPhase0(text: string): string {
  const withoutCr = text.replace(/\r\n/g, "\n");
  const lines = withoutCr.split("\n").map((line) => line.replace(/[ \t\f\v]+$/, ""));

  let end = lines.length;
  while (end > 0 && lines[end - 1] === "") {
    end -= 1;
  }

  const kept = lines.slice(0, end);
  return kept.length === 0 ? "\n" : `${kept.join("\n")}\n`;
}
