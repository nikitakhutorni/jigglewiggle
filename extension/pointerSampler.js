import GLib from 'gi://GLib';

const DEFAULT_INTERVAL_MS = 16;

export class PointerSampler {
    constructor(onSample) {
        this._onSample = onSample;
        this._sourceId = 0;
        this._intervalMs = 0;
    }

    start(intervalMs = DEFAULT_INTERVAL_MS) {
        const normalizedInterval = Math.max(10, Math.round(intervalMs));

        if (this._sourceId && this._intervalMs === normalizedInterval)
            return;

        this.stop();
        this._intervalMs = normalizedInterval;
        this._sourceId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            normalizedInterval,
            () => this._tick());

        if (GLib.Source.set_name_by_id)
            GLib.Source.set_name_by_id(this._sourceId, '[jigglewiggle] pointer sampler');
    }

    stop() {
        if (!this._sourceId)
            return;

        GLib.Source.remove(this._sourceId);
        this._sourceId = 0;
        this._intervalMs = 0;
    }

    _tick() {
        const [x, y] = global.get_pointer();
        const timeMs = GLib.get_monotonic_time() / 1000;

        this._onSample(x, y, timeMs);
        return GLib.SOURCE_CONTINUE;
    }
}

