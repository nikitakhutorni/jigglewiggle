# Agent Notes

This repository is a GNOME Shell extension project. Keep the installable extension
source under `extension/`; do not make the repository root itself the extension
directory.

Validation:

```bash
npm test
./scripts/pack.sh
```

Rules:

- Runtime code must stay compatible with GNOME Shell 50 ES modules.
- Keep `extension/wiggleDetector.js` free of GNOME imports so Node tests can cover
  wiggle detection without a live Shell session.
- Do not commit generated files such as `extension/schemas/gschemas.compiled` or
  `dist/*.zip`.
- Use Conventional Commits and SemVer tags. Initial public version is `0.1.0`.
- Keep the implementation clean-room. Do not copy code from Jiggle or other
  cursor extensions.

