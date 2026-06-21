import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

class PreferencesPage extends Adw.PreferencesPage {
    static {
        GObject.registerClass(this);
    }

    constructor(settings) {
        super({
            title: _('jigglewiggle'),
            icon_name: 'input-mouse-symbolic',
        });

        this._settings = settings;
        this._actions = new Gio.SimpleActionGroup();
        this.insert_action_group('jigglewiggle', this._actions);

        this._actions.add_action(this._settings.create_action('sensitivity'));
        this._addGeneralGroup();
        this._addDetectionGroup();
        this._addVisualGroup();
        this._addMotionGroup();
    }

    _addGeneralGroup() {
        const group = new Adw.PreferencesGroup({
            title: _('General'),
        });
        this.add(group);

        const enabledRow = new Adw.SwitchRow({
            title: _('Enabled'),
            subtitle: _('React when the pointer is wiggled.'),
        });
        this._settings.bind('enabled', enabledRow, 'active',
            Gio.SettingsBindFlags.DEFAULT);
        group.add(enabledRow);

        const hideCursorRow = new Adw.SwitchRow({
            title: _('Hide System Cursor'),
            subtitle: _('Avoid showing two cursors while locating the pointer.'),
        });
        this._settings.bind('hide-system-cursor', hideCursorRow, 'active',
            Gio.SettingsBindFlags.DEFAULT);
        group.add(hideCursorRow);
    }

    _addDetectionGroup() {
        const group = new Adw.PreferencesGroup({
            title: _('Detection'),
        });
        this.add(group);

        const sensitivityRows = [
            ['high', _('High'), _('Triggers with smaller and slower wiggles.')],
            ['medium', _('Medium'), _('Balanced default detection.')],
            ['low', _('Low'), _('Requires more deliberate wiggles.')],
        ];

        let firstButton = null;
        for (const [mode, title, subtitle] of sensitivityRows) {
            const button = new Gtk.CheckButton({
                action_name: 'jigglewiggle.sensitivity',
                action_target: new GLib.Variant('s', mode),
                group: firstButton,
            });
            firstButton ??= button;

            const row = new Adw.ActionRow({
                title,
                subtitle,
                activatable_widget: button,
            });
            row.add_prefix(button);
            group.add(row);
        }
    }

    _addVisualGroup() {
        const group = new Adw.PreferencesGroup({
            title: _('Visuals'),
        });
        this.add(group);

        group.add(this._spinRow({
            key: 'max-scale',
            title: _('Maximum Scale'),
            subtitle: _('How large the pointer becomes.'),
            lower: 1.5,
            upper: 4.0,
            step: 0.05,
            digits: 2,
        }));
    }

    _addMotionGroup() {
        const group = new Adw.PreferencesGroup({
            title: _('Motion'),
        });
        this.add(group);

        group.add(this._spinRow({
            key: 'growth-speed-ms',
            title: _('Growth Speed'),
            subtitle: _('Milliseconds used for the grow animation.'),
            lower: 0,
            upper: 500,
            step: 10,
            digits: 0,
        }));

        group.add(this._spinRow({
            key: 'peak-hold-ms',
            title: _('Peak Hold'),
            subtitle: _('Milliseconds to stay large after the wiggle settles.'),
            lower: 0,
            upper: 800,
            step: 10,
            digits: 0,
        }));

        group.add(this._spinRow({
            key: 'shrink-speed-ms',
            title: _('Shrink Speed'),
            subtitle: _('Milliseconds used for the fade and shrink animation.'),
            lower: 0,
            upper: 800,
            step: 10,
            digits: 0,
        }));

        const reducedMotionRow = new Adw.SwitchRow({
            title: _('Respect Reduced Motion'),
            subtitle: _('Skip smooth animation when desktop animations are disabled.'),
        });
        this._settings.bind('respect-reduced-motion', reducedMotionRow, 'active',
            Gio.SettingsBindFlags.DEFAULT);
        group.add(reducedMotionRow);
    }

    _spinRow({key, title, subtitle, lower, upper, step, digits}) {
        const adjustment = new Gtk.Adjustment({
            lower,
            upper,
            step_increment: step,
            page_increment: step * 10,
            value: this._settings.get_value(key).deepUnpack(),
        });

        const row = new Adw.SpinRow({
            title,
            subtitle,
            adjustment,
            digits,
        });

        this._settings.bind(key, row, 'value',
            Gio.SettingsBindFlags.DEFAULT);

        return row;
    }
}

export default class Preferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window.add(new PreferencesPage(this.getSettings()));
        window.set_default_size(520, 640);
    }
}
