import Gio from 'gi://Gio';

export function readExtensionSettings(
    settings,
    interfaceSettings = null) {
    return {
        enabled: settings.get_boolean('enabled'),
        sensitivity: settings.get_string('sensitivity'),
        effectMode: settings.get_string('effect-mode'),
        maxScale: settings.get_double('max-scale'),
        growthSpeedMs: settings.get_int('growth-speed-ms'),
        peakHoldMs: settings.get_int('peak-hold-ms'),
        minimumVisibleMs: settings.get_int('minimum-visible-ms'),
        shrinkSpeedMs: settings.get_int('shrink-speed-ms'),
        pointerOpacity: settings.get_double('pointer-opacity'),
        hideSystemCursor: settings.get_boolean('hide-system-cursor'),
        reduceMotion: shouldReduceMotion(settings, interfaceSettings),
        sampleIntervalMs: settings.get_int('sample-interval-ms'),
    };
}

function shouldReduceMotion(extensionSettings, interfaceSettings) {
    if (!extensionSettings.get_boolean('respect-reduced-motion'))
        return false;

    interfaceSettings ??= createOptionalSettings('org.gnome.desktop.interface');

    if (!interfaceSettings || !hasSettingsKey(interfaceSettings, 'enable-animations'))
        return false;

    return !interfaceSettings.get_boolean('enable-animations');
}

function createOptionalSettings(schemaId) {
    try {
        const source = Gio.SettingsSchemaSource.get_default();
        const schema = source?.lookup(schemaId, true);

        if (!schema)
            return null;

        return new Gio.Settings({schema_id: schemaId});
    } catch {
        return null;
    }
}

function hasSettingsKey(settings, key) {
    try {
        return settings.settings_schema.has_key(key);
    } catch {
        return false;
    }
}
