#!/bin/zsh
set -euo pipefail

ROOT="${0:A:h}"
APP="$ROOT/dist/划词助手.app"

cd "$ROOT"
node "$ROOT/Calculator/build.mjs"
swift build -c release

mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$ROOT/.build/release/SelectionPal" "$APP/Contents/MacOS/SelectionPal"
cp "$ROOT/Info.plist" "$APP/Contents/Info.plist"
cp "$ROOT/Sources/Resources/QuickCalculator.js" "$APP/Contents/Resources/QuickCalculator.js"
# Keep a stable designated requirement across local rebuilds. Without this,
# ad-hoc signing defaults to a changing cdhash and macOS forgets the app's
# Accessibility permission after every update.
codesign --force --deep --sign - \
  --requirements '=designated => identifier "local.selectionpal.app"' \
  "$APP"

echo "$APP"
