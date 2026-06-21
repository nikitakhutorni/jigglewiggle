#!/usr/bin/env bash
set -euo pipefail

UUID="jigglewiggle@nikitakhutorni.github.io"
EXTENSIONS_HOME="${XDG_DATA_HOME:-"${HOME}/.local/share"}/gnome-shell/extensions"
TARGET_DIR="${EXTENSIONS_HOME}/${UUID}"

case "${TARGET_DIR}" in
    "${EXTENSIONS_HOME}/${UUID}") ;;
    *)
        echo "Refusing unexpected install target: ${TARGET_DIR}" >&2
        exit 1
        ;;
esac

if command -v gnome-extensions >/dev/null 2>&1; then
    gnome-extensions disable "${UUID}" >/dev/null 2>&1 || true
fi

rm -rf "${TARGET_DIR}"
echo "Removed ${TARGET_DIR}"
