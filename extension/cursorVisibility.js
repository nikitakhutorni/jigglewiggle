export class CursorVisibility {
    constructor(backend = null) {
        this._tracker = getCursorTracker(backend);
        this._hidden = false;
        this._enabled = false;
    }

    configure(config) {
        this._enabled = Boolean(config?.hideSystemCursor);

        if (!this._enabled)
            this.show();
    }

    hide() {
        if (!this._enabled || this._hidden || !this._canControl())
            return false;

        try {
            this._tracker.inhibit_cursor_visibility();
            this._hidden = true;
            return true;
        } catch (error) {
            console.debug(`jigglewiggle: cursor hiding unavailable: ${error}`);
            this._hidden = false;
            return false;
        }
    }

    show() {
        if (!this._hidden || !this._canControl())
            return;

        try {
            this._tracker.uninhibit_cursor_visibility();
        } catch (error) {
            console.debug(`jigglewiggle: cursor restore failed: ${error}`);
        } finally {
            this._hidden = false;
        }
    }

    destroy() {
        this.show();
        this._tracker = null;
        this._enabled = false;
    }

    _canControl() {
        return typeof this._tracker?.inhibit_cursor_visibility === 'function' &&
            typeof this._tracker?.uninhibit_cursor_visibility === 'function';
    }
}

function getCursorTracker(backend) {
    try {
        return backend?.get_cursor_tracker?.() ?? null;
    } catch (error) {
        console.debug(`jigglewiggle: cursor tracker unavailable: ${error}`);
        return null;
    }
}
