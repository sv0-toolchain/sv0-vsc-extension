#!/usr/bin/env bash
# Local non-publishing preflight (spec §26.4). Does NOT publish — builds a
# VSIX, inspects its file tree, and installs it into an isolated VS Code
# profile so it can be manually smoke-tested. Pass --pre-release for R0.x
# candidates; omit for R1 and later regular releases.
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION="$(node -p "require('./package.json').version")"
NAME="$(node -p "require('./package.json').name")"
OUT="dist/${NAME}-${VERSION}.vsix"

PRE_RELEASE_FLAG=()
if [[ "${1:-}" == "--pre-release" ]]; then
  PRE_RELEASE_FLAG=(--pre-release)
fi

npm ci
npm run check
node scripts/validate-manifest.mjs
node scripts/check-language-drift.mjs

./node_modules/.bin/vsce --version
./node_modules/.bin/vsce ls --tree

mkdir -p dist
./node_modules/.bin/vsce package "${PRE_RELEASE_FLAG[@]}" --out "$OUT"

if command -v sha256sum >/dev/null; then
  sha256sum "$OUT"
else
  shasum -a 256 "$OUT"
fi

echo "package.sh: built $OUT — this is a LOCAL PREFLIGHT, it does not publish."
