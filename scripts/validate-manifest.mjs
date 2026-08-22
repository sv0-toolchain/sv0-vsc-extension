#!/usr/bin/env node
// PKG-001/PKG-003 (VSC-S-102/104): automated manifest-schema test. Fails the
// build if package.json is missing a required field or the language
// registration doesn't match the spec (id `sv0`, alias `sv0`, extension
// `.sv0`).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));

const errors = [];

function require_(cond, msg) {
  if (!cond) errors.push(msg);
}

require_(typeof pkg.name === "string" && /^[a-z0-9][a-z0-9-]*$/.test(pkg.name), "name must be lowercase, no wildcards");
require_(typeof pkg.publisher === "string" && pkg.publisher.length > 0, "publisher must be set");
require_(/^\d+\.\d+\.\d+$/.test(pkg.version), "version must be numeric major.minor.patch (no pre-release suffix, spec §26.5)");
require_(typeof pkg.engines?.vscode === "string" && pkg.engines.vscode !== "*", "engines.vscode must be a non-wildcard floor (OD-005)");
require_(typeof pkg.license === "string" && pkg.license.length > 0, "license must be set");
require_(typeof pkg.repository?.url === "string", "repository.url must be set");
require_(typeof pkg.bugs?.url === "string", "bugs.url must be set");
require_(Array.isArray(pkg.categories) && pkg.categories.includes("Programming Languages"), 'categories must include "Programming Languages"');
require_(Array.isArray(pkg.keywords) && pkg.keywords.length <= 30, "keywords must be present and <=30 (Marketplace limit)");
require_(Array.isArray(pkg.activationEvents) && !pkg.activationEvents.includes("*"), "activationEvents must not eagerly activate on startup (PKG-002)");

const lang = pkg.contributes?.languages?.find((l) => l.id === "sv0");
require_(!!lang, "contributes.languages must register language id sv0 (PKG-003)");
require_(lang && lang.aliases?.includes("sv0"), "sv0 language must have alias sv0 (PKG-003)");
require_(lang && lang.extensions?.includes(".sv0"), "sv0 language must register extension .sv0 (PKG-003)");

const grammar = pkg.contributes?.grammars?.find((g) => g.language === "sv0");
require_(!!grammar && grammar.scopeName === "source.sv0", "contributes.grammars must register scopeName source.sv0");

if (errors.length > 0) {
  console.error(`validate-manifest: ${errors.length} error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log("validate-manifest: OK");
