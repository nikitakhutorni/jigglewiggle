import Gio from 'gi://Gio';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {CursorSizeEffect} from './cursorSizeEffect.js';
import {CursorVisibility} from './cursorVisibility.js';
import {CursorOverlay} from './overlay.js';
import {PointerSampler} from './pointerSampler.js';
import {readExtensionSettings} from './settings.js';
import {WiggleDetector} from './wiggleDetector.js';

const INTERFACE_SCHEMA = 'org.gnome.desktop.interface';

export default class ExtensionImpl extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._interfaceSettings = this._createOptionalSettings(INTERFACE_SCHEMA);
        this._detector = new WiggleDetector();
        this._cursorVisibility = new CursorVisibility(global.backend);
        this._overlay = new CursorOverlay(this.path, () => {
            this._cursorVisibility?.show();
        });
        this._cursorSizeEffect = new CursorSizeEffect(this._interfaceSettings);
        this._sampler = new PointerSampler((x, y, timeMs) => {
            this._samplePointer(x, y, timeMs);
        });

        Main.uiGroup.add_child(this._overlay.actor);

        this._settings.connectObject('changed',
            () => this._syncSettings(), this);

        this._interfaceSettings?.connectObject(
            'changed::enable-animations', () => this._syncSettings(),
            this);

        this._syncSettings();
    }

    disable() {
        this._sampler?.stop();
        this._sampler = null;

        this._overlay?.destroy();
        this._overlay = null;

        this._cursorVisibility?.destroy();
        this._cursorVisibility = null;

        this._cursorSizeEffect?.destroy();
        this._cursorSizeEffect = null;

        this._detector?.reset();
        this._detector = null;

        this._settings?.disconnectObject(this);
        this._settings = null;

        this._interfaceSettings?.disconnectObject(this);
        this._interfaceSettings = null;

        this._config = null;
    }

    _syncSettings() {
        if (!this._settings)
            return;

        this._config = readExtensionSettings(
            this._settings,
            this._interfaceSettings);

        this._detector.configure({sensitivity: this._config.sensitivity});
        this._overlay.configure(this._config);
        this._cursorSizeEffect.configure(this._config);
        this._cursorVisibility.configure(this._config);

        if (this._config.effectMode === 'cursor-size') {
            this._overlay.hideImmediate();
            this._cursorVisibility.show();
        } else {
            this._cursorSizeEffect.hide();
        }

        if (!this._config.enabled) {
            this._sampler.stop();
            this._detector.reset();
            this._overlay.hideImmediate();
            this._cursorVisibility.show();
            this._cursorSizeEffect.hide();
            return;
        }

        this._sampler.start(this._config.sampleIntervalMs);
    }

    _samplePointer(x, y, timeMs) {
        if (!this._config?.enabled)
            return;

        const result = this._detector.sample(x, y, timeMs);

        if (result.started) {
            this._showEffect(x, y);
            return;
        }

        if (result.wiggling) {
            if (this._config.effectMode !== 'cursor-size')
                this._overlay.moveTo(x, y);
            return;
        }

        if (result.ended)
            this._hideEffect(x, y);
    }

    _showEffect(x, y) {
        if (this._config.effectMode === 'cursor-size') {
            this._overlay.hideImmediate();

            if (this._cursorSizeEffect.show(this._config))
                return;
        }

        this._cursorVisibility.hide();
        this._overlay.showAt(x, y, this._config);
    }

    _hideEffect(x, y) {
        if (this._config.effectMode === 'cursor-size') {
            this._cursorSizeEffect.hide();
            return;
        }

        this._overlay.hideAt(x, y, this._config);
    }

    _createOptionalSettings(schemaId) {
        try {
            const source = Gio.SettingsSchemaSource.get_default();
            const schema = source?.lookup(schemaId, true);

            if (!schema)
                return null;

            return new Gio.Settings({schema_id: schemaId});
        } catch (error) {
            console.debug(`jigglewiggle: optional settings unavailable: ${error}`);
            return null;
        }
    }
}
