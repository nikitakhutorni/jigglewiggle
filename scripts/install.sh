#!/usr/bin/env bash
set -euo pipefail

UUID="jigglewiggle@nikitakhutorni.github.io"
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="${ROOT_DIR}/extension"
EXTENSIONS_HOME="${XDG_DATA_HOME:-"${HOME}/.local/share"}/gnome-shell/extensions"
TARGET_DIR="${EXTENSIONS_HOME}/${UUID}"
ENABLE=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --enable)
            ENABLE=1
            shift
            ;;
        --help|-h)
            cat <<USAGE
Usage: scripts/install.sh [--enable]

Install jigglewiggle for the current user.
USAGE
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            exit 2
            ;;
    esac
done

case "${TARGET_DIR}" in
    "${EXTENSIONS_HOME}/${UUID}") ;;
    *)
        echo "Refusing unexpected install target: ${TARGET_DIR}" >&2
        exit 1
        ;;
esac

mkdir -p "${EXTENSIONS_HOME}"
TMP_DIR="$(mktemp -d "${EXTENSIONS_HOME}/${UUID}.tmp.XXXXXX")"
trap 'rm -rf "${TMP_DIR}"' EXIT

cp -R "${SOURCE_DIR}/." "${TMP_DIR}/"
glib-compile-schemas --strict "${TMP_DIR}/schemas"

rm -rf "${TARGET_DIR}"
mv "${TMP_DIR}" "${TARGET_DIR}"
trap - EXIT

echo "Installed ${UUID} to ${TARGET_DIR}"

if [[ "${ENABLE}" -eq 1 ]]; then
    if gnome-extensions enable "${UUID}"; then
        echo "Enabled ${UUID}"
    else
        cat >&2 <<EOF
Installed ${UUID}, but the running GNOME Shell session has not registered it yet.
On GNOME Shell 50 Wayland, log out and back in, then run:

  gnome-extensions enable ${UUID}

EOF
        exit 1
    fi
fi
