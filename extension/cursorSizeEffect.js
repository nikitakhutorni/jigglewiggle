const MIN_CURSOR_SIZE = 16;
const MAX_CURSOR_SIZE = 128;

export class CursorSizeEffect {
    constructor(interfaceSettings) {
        this._interfaceSettings = interfaceSettings;
        this._active = false;
        this._baseSize = 0;
        this._targetSize = 0;
        this._writing = false;
    }

    configure(config) {
        this._config = config;
    }

    show(config = this._config) {
        if (!this._canWriteCursorSize() || !config)
            return false;

        if (!this._active) {
            this._baseSize = this._interfaceSettings.get_int('cursor-size');
            this._targetSize = this._calculateTargetSize(this._baseSize, config.maxScale);
            this._active = true;
        }

        this._setCursorSize(this._targetSize);
        return true;
    }

    hide() {
        this._restore();
    }

    destroy() {
        this._restore();
        this._interfaceSettings = null;
        this._config = null;
    }

    _restore() {
        if (!this._active || !this._canWriteCursorSize())
            return;

        const currentSize = this._interfaceSettings.get_int('cursor-size');
        const shouldRestore = currentSize === this._targetSize || this._writing;

        this._active = false;

        if (shouldRestore)
            this._setCursorSize(this._baseSize);
    }

    _calculateTargetSize(baseSize, maxScale) {
        const targetSize = Math.round(baseSize * maxScale);
        return Math.min(Math.max(targetSize, MIN_CURSOR_SIZE), MAX_CURSOR_SIZE);
    }

    _setCursorSize(size) {
        if (this._interfaceSettings.get_int('cursor-size') === size)
            return;

        this._writing = true;
        try {
            this._interfaceSettings.set_int('cursor-size', size);
        } finally {
            this._writing = false;
        }
    }

    _canWriteCursorSize() {
        return Boolean(this._interfaceSettings?.settings_schema?.has_key('cursor-size'));
    }
}

export const cursorSizeEffectLimits = Object.freeze({
    min: MIN_CURSOR_SIZE,
    max: MAX_CURSOR_SIZE,
});
