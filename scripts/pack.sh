#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="${ROOT_DIR}/extension"
OUT_DIR="${ROOT_DIR}/dist"
SCHEMA="${SOURCE_DIR}/schemas/org.gnome.shell.extensions.jigglewiggle.gschema.xml"

mkdir -p "${OUT_DIR}"
glib-compile-schemas --strict "${SOURCE_DIR}/schemas"
gnome-extensions pack \
    --force \
    --out-dir "${OUT_DIR}" \
    --schema "${SCHEMA}" \
    --extra-source "${SOURCE_DIR}/assets/pointer.svg" \
    --extra-source "${SOURCE_DIR}/cursorSizeEffect.js" \
    --extra-source "${SOURCE_DIR}/cursorVisibility.js" \
    --extra-source "${SOURCE_DIR}/overlay.js" \
    --extra-source "${SOURCE_DIR}/pointerSampler.js" \
    --extra-source "${SOURCE_DIR}/settings.js" \
    --extra-source "${SOURCE_DIR}/wiggleDetector.js" \
    "${SOURCE_DIR}"
