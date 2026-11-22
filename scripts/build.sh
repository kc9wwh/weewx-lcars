#!/usr/bin/env bash
# Build the installable extension zip:  scripts/build.sh  ->  dist/weewx-lcars-<version>.zip
# Install it with:  sudo weectl extension install dist/weewx-lcars-<version>.zip
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION="$(python3 -c "import re;print(re.search(r'VERSION = \"([^\"]+)\"', open('install.py').read()).group(1))")"
SKIN_VERSION="$(sed -n 's/^SKIN_VERSION = //p' skins/LCARS/skin.conf)"
if [[ "${1:-}" != "" && "$1" != "$VERSION" ]]; then
  echo "Tag version $1 does not match install.py VERSION $VERSION" >&2; exit 1
fi
if [[ "$SKIN_VERSION" != "$VERSION" ]]; then
  echo "skin.conf SKIN_VERSION ($SKIN_VERSION) does not match install.py VERSION ($VERSION)" >&2; exit 1
fi

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/weewx-lcars" dist
cp -r install.py README.md LICENSE skins "$STAGE/weewx-lcars/"
find "$STAGE" -name '.DS_Store' -delete
rm -f "dist/weewx-lcars-$VERSION.zip"
(cd "$STAGE" && zip -qr "$OLDPWD/dist/weewx-lcars-$VERSION.zip" weewx-lcars)
echo "Built dist/weewx-lcars-$VERSION.zip"
