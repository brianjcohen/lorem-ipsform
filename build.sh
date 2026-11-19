#!/bin/bash
# Build script for Lorem Ipsform.
# One Manifest V3 package works in both Chrome and Firefox.
set -euo pipefail
cd "$(dirname "$0")"

FILES=(manifest.json popup.html popup.js content.js icon16.png icon48.png icon128.png LICENSE README.md)
OUT=build/extension
ZIP=build/lorem-ipsform.zip

rm -rf build
mkdir -p "$OUT"
cp "${FILES[@]}" "$OUT/"
echo "Copied ${#FILES[@]} files to $OUT/"

if command -v zip >/dev/null 2>&1; then
    (cd "$OUT" && zip -qr "../$(basename "$ZIP")" .)
    echo "Package: $ZIP (upload to both the Chrome Web Store and addons.mozilla.org)"
else
    echo "zip not installed: zip the $OUT directory by hand"
fi

echo
echo "Chrome:  chrome://extensions > Developer mode > Load unpacked > $OUT"
echo "Firefox: about:debugging > This Firefox > Load Temporary Add-on > $OUT/manifest.json"
echo "         or: cd $OUT && web-ext run"
