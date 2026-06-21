import test from 'node:test';
import assert from 'node:assert/strict';

import {CursorVisibility} from '../extension/cursorVisibility.js';

class FakeTracker {
    constructor() {
        this.inhibits = 0;
        this.uninhibits = 0;
    }

    inhibit_cursor_visibility() {
        this.inhibits++;
    }

    uninhibit_cursor_visibility() {
        this.uninhibits++;
    }
}

test('hides and restores the system cursor once per effect', () => {
    const tracker = new FakeTracker();
    const visibility = new CursorVisibility({
        get_cursor_tracker: () => tracker,
    });

    visibility.configure({hideSystemCursor: true});

    assert.equal(visibility.hide(), true);
    assert.equal(visibility.hide(), false);
    assert.equal(tracker.inhibits, 1);

    visibility.show();
    visibility.show();
    assert.equal(tracker.uninhibits, 1);
});

test('disabling cursor hiding restores a hidden cursor', () => {
    const tracker = new FakeTracker();
    const visibility = new CursorVisibility({
        get_cursor_tracker: () => tracker,
    });

    visibility.configure({hideSystemCursor: true});
    visibility.hide();
    visibility.configure({hideSystemCursor: false});

    assert.equal(tracker.inhibits, 1);
    assert.equal(tracker.uninhibits, 1);
    assert.equal(visibility.hide(), false);
});

test('unavailable cursor tracker is a no-op', () => {
    const visibility = new CursorVisibility(null);

    visibility.configure({hideSystemCursor: true});

    assert.equal(visibility.hide(), false);
    assert.doesNotThrow(() => visibility.show());
    assert.doesNotThrow(() => visibility.destroy());
});
