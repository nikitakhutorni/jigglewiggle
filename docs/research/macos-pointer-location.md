# macOS Pointer Location Research

jigglewiggle v0.4.0 uses a clean-room approximation of macOS "Shake mouse
pointer to locate." Apple documents the feature, but the transient animation
timings and scale multiplier are not public API.

## Verified Public Surface

- Apple Support documents the setting under Accessibility > Display > Pointer:
  <https://support.apple.com/guide/mac-help/make-the-pointer-easier-to-see-mchlp2920/mac>
- AppKit exposes `disableCursorLocationAssistance` so applications can disable
  the behavior while active:
  <https://developer.apple.com/documentation/appkit/nsapplication/presentationoptions-swift.struct/disablecursorlocationassistance>
- Public macOS SDK headers name the option
  `NSApplicationPresentationDisableCursorLocationAssistance` and describe it as
  disabling "Shake mouse pointer to locate" for the application:
  <https://github.com/phracker/MacOSX-SDKs/blob/master/MacOSX11.1.sdk/System/Library/Frameworks/AppKit.framework/Versions/C/Headers/NSApplication.h>
- The global preference key commonly used to disable the feature is
  `CGDisableCursorLocationMagnification` in `NSGlobalDomain` or
  `.GlobalPreferences`. This appears in public setup scripts and macOS defaults
  collections, not in a documented Apple API surface.
- macOS cursor size is stored separately as
  `com.apple.universalaccess mouseDriverCursorSize`. Public references treat
  `1` as normal and `4` as maximum. Fastfetch maps that scale to roughly
  `scale * 32` pixels:
  <https://github.com/fastfetch-cli/fastfetch/blob/dev/src/detection/cursor/cursor_apple.m>
  <https://github.com/nix-darwin/nix-darwin/blob/master/modules/system/defaults/universalaccess.nix>

## What Is Not Public

I did not find published Apple constants for:

- wiggle trigger speed or turn threshold
- grow duration
- peak hold duration
- shrink duration
- easing curves
- transient peak multiplier

Those are either private implementation details or embedded in closed-source
system components.

## v0.4.0 Approximation

The defaults are intentionally tunable and conservative:

- sample interval: `16 ms`
- medium settle delay: `160 ms`
- maximum scale: `2.75x`
- grow duration: `130 ms`
- peak hold after settle: `180 ms`
- shrink duration: `240 ms`
- pointer opacity: `1.0`

The visual implementation is an animated pointer-shaped Shell actor anchored at
the pointer hotspot. It renders the SVG at 128 px before animation so large
sizes are not produced by scaling a 32 px texture. It avoids repeated writes to
the desktop cursor-size setting.

GNOME Shell 50 / Mutter 18 exposes cursor visibility inhibition through
`Meta.CursorTracker` in the local introspection data. jigglewiggle uses that
path only when available and restores visibility when the effect ends or the
extension is disabled.
