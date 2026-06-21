import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';

const DEFAULT_INTERVAL_MS = 16;

export class PointerSampler {
    constructor(onSample) {
        this._onSample = onSample;
        this._sourceId = 0;
        this._eventSignalId = 0;
        this._intervalMs = 0;
    }

    start(intervalMs = DEFAULT_INTERVAL_MS) {
        const normalizedInterval = Math.max(10, Math.round(intervalMs));

        if (this._sourceId && this._intervalMs === normalizedInterval)
            return;

        this.stop();
        this._intervalMs = normalizedInterval;
        this._connectEventSampler();
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

        if (this._eventSignalId) {
            global.stage.disconnect(this._eventSignalId);
            this._eventSignalId = 0;
        }
    }

    _tick() {
        const [x, y] = global.get_pointer();

        this._sample(x, y);
        return GLib.SOURCE_CONTINUE;
    }

    _connectEventSampler() {
        if (!global.stage?.connect)
            return;

        this._eventSignalId = global.stage.connect('captured-event',
            (_actor, event) => this._handleEvent(event));
    }

    _handleEvent(event) {
        if (event.type() === Clutter.EventType.MOTION) {
            const [x, y] = event.get_coords();
            this._sample(x, y);
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _sample(x, y) {
        const timeMs = GLib.get_monotonic_time() / 1000;

        this._onSample(x, y, timeMs);
    }
}
