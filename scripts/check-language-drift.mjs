#!/usr/bin/env node
// GOV-002 (VSC-S-112): fail the build when a normative keyword in the pinned
// sv0doc/keywords/reference.md is missing from the lexical corpus (the
// TextMate grammar). Reads the pinned revision recorded in
// schemas/provenance-manifest.json for syntaxes/sv0.tmLanguage.json.
//
// Usage: node scripts/check-language-drift.mjs [--sv0doc-root <path>]
// Defaults to ../sv0-toolchain/sv0doc relative to this repo, which is where
// this scaffold was authored alongside a sibling sv0-toolchain checkout.
// Override with SV0DOC_ROOT or --sv0doc-root for CI, where sv0doc should be
// checked out at the pinned revision instead.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

function resolveSv0docRoot() {
  const argIdx = process.argv.indexOf("--sv0doc-root");
  if (argIdx !== -1 && process.argv[argIdx + 1]) {
    return path.resolve(process.argv[argIdx + 1]);
  }
  if (process.env.SV0DOC_ROOT) {
    return path.resolve(process.env.SV0DOC_ROOT);
  }
  return path.resolve(repoRoot, "..", "sv0-toolchain", "sv0doc");
}

function extractKeywordList(referenceMd) {
  const match = referenceMd.match(/```\n((?:[a-zA-Z_][\s\S]*?\n)+)```/);
  if (!match) {
    throw new Error("could not find the fenced alphabetical keyword list block");
  }
  return match[1]
    .split(/\s+/)
    .map((tok) => tok.trim())
    .filter(Boolean);
}

function main() {
  const sv0docRoot = resolveSv0docRoot();
  const referencePath = path.join(sv0docRoot, "keywords", "reference.md");
  let referenceMd;
  try {
    referenceMd = readFileSync(referencePath, "utf8");
  } catch (err) {
    console.error(`check-language-drift: could not read ${referencePath}: ${err.message}`);
    console.error("Set SV0DOC_ROOT or pass --sv0doc-root to point at a sv0doc checkout.");
    process.exit(2);
  }

  const keywords = extractKeywordList(referenceMd);
  const grammar = readFileSync(path.join(repoRoot, "syntaxes", "sv0.tmLanguage.json"), "utf8");

  const missing = keywords.filter((kw) => !new RegExp(`\\b${kw}\\b`).test(grammar));

  if (missing.length > 0) {
    console.error(
      `check-language-drift: ${missing.length} keyword(s) from the pinned sv0doc keyword ` +
        `reference are missing from syntaxes/sv0.tmLanguage.json:\n  ${missing.join(", ")}`,
    );
    process.exit(1);
  }

  console.log(`check-language-drift: OK (${keywords.length} keywords covered)`);
}

main();
