import test from 'node:test';
import assert from 'node:assert/strict';

import {
    CursorSizeEffect,
    cursorSizeEffectLimits,
} from '../extension/cursorSizeEffect.js';

class FakeInterfaceSettings {
    constructor(size = 24) {
        this._size = size;
        this.writes = [];
        this.settings_schema = {
            has_key: key => key === 'cursor-size',
        };
    }

    get_int(key) {
        assert.equal(key, 'cursor-size');
        return this._size;
    }

    set_int(key, value) {
        assert.equal(key, 'cursor-size');
        this._size = value;
        this.writes.push(value);
    }
}

test('temporarily increases and restores cursor size', () => {
    const settings = new FakeInterfaceSettings(24);
    const effect = new CursorSizeEffect(settings);

    assert.equal(effect.show({maxScale: 2.5}), true);
    assert.equal(settings.get_int('cursor-size'), 60);

    effect.hide();
    assert.equal(settings.get_int('cursor-size'), 24);
    assert.deepEqual(settings.writes, [60, 24]);
});

test('caps cursor size to a sane maximum', () => {
    const settings = new FakeInterfaceSettings(64);
    const effect = new CursorSizeEffect(settings);

    effect.show({maxScale: 4});

    assert.equal(settings.get_int('cursor-size'), cursorSizeEffectLimits.max);
});

test('does not overwrite external cursor-size changes on restore', () => {
    const settings = new FakeInterfaceSettings(24);
    const effect = new CursorSizeEffect(settings);

    effect.show({maxScale: 3});
    settings.set_int('cursor-size', 32);
    effect.hide();

    assert.equal(settings.get_int('cursor-size'), 32);
});

test('returns false when cursor-size key is unavailable', () => {
    const settings = new FakeInterfaceSettings(24);
    settings.settings_schema = {
        has_key: () => false,
    };

    const effect = new CursorSizeEffect(settings);

    assert.equal(effect.show({maxScale: 3}), false);
    assert.equal(settings.get_int('cursor-size'), 24);
    assert.deepEqual(settings.writes, []);
});

