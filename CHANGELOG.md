# Changelog

All notable changes to jigglewiggle are documented here.

This project follows Semantic Versioning.

## [0.4.0] - 2026-06-21

### Added

- Optional system cursor hiding while the animated pointer is visible, using
  Mutter cursor visibility inhibition when available.
- Cursor visibility unit tests for hide/restore idempotency.

### Changed

- Use the public extension UUID `jigglewiggle@nikitakhutorni.github.io`.
- Use the lowercase public extension name `jigglewiggle`.
- Document the name inspiration from Jiggle and Wiggle.
- Render the pointer SVG at high resolution before animation to avoid pixelated
  scaling at large sizes.
- Streamline preferences around the animated pointer path and hide the legacy
  cursor-size fallback from the main UI.
- Default animated pointer opacity is now fully opaque.

## [0.3.0] - 2026-06-21

### Added

- Animated pointer effect mode that grows a cursor-shaped overlay from the
  real pointer hotspot, briefly holds at peak size, then shrinks away.
- Peak-hold timing preference for tuning the Mac-like animation envelope.
- Clean-room pointer SVG asset for the animated pointer mode.

### Changed

- Default effect mode is now animated pointer instead of cursor-size writes.
- Default motion tuning is closer to macOS: `2.75x` scale, `130 ms` growth,
  `180 ms` hold, and `240 ms` shrink.
- Removed the halo overlay mode and its color/visibility preferences.

## [0.2.0] - 2026-06-21

### Added

- Real cursor-size effect mode that temporarily increases
  `org.gnome.desktop.interface cursor-size` during a wiggle and restores the
  previous value when movement settles.
- Effect mode preference for choosing real cursor size or the original overlay.

### Changed

- Default effect mode is now real cursor size instead of the blue overlay.

## [0.1.0] - 2026-06-21

### Added

- Initial GNOME Shell 50 extension.
- Pointer sampling with rolling wiggle detection.
- Cursor overlay with halo and pointer-icon visual modes.
- Native preferences window backed by GSettings.
- Per-user install, uninstall, validation, and packaging scripts.
- Node test coverage for the pure wiggle detector.
