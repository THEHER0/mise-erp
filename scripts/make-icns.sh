#!/usr/bin/env bash
# Converts assets/icon.png → assets/icon.icns using macOS built-in tools
set -euo pipefail
SRC="$(dirname "$0")/../assets/icon.png"
ICONSET="$(dirname "$0")/../assets/icon.iconset"
DEST="$(dirname "$0")/../assets/icon.icns"

mkdir -p "$ICONSET"
for size in 16 32 64 128 256 512; do
  sips -z $size $size "$SRC" --out "$ICONSET/icon_${size}x${size}.png" >/dev/null
  sips -z $((size*2)) $((size*2)) "$SRC" --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$DEST"
rm -rf "$ICONSET"
echo "✓ Created $DEST"
