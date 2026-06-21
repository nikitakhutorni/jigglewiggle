export const DEFAULT_SENSITIVITY = 'medium';

export const SENSITIVITY_PROFILES = Object.freeze({
    high: Object.freeze({
        windowMs: 420,
        minDurationMs: 90,
        minTravelPx: 95,
        minAverageSpeedPxPerSec: 620,
        minDirectionChanges: 2,
        minTravelRatio: 1.55,
        minSegmentPx: 10,
        maxTurnDotProduct: 0.1,
        settleDelayMs: 180,
    }),
    medium: Object.freeze({
        windowMs: 360,
        minDurationMs: 110,
        minTravelPx: 130,
        minAverageSpeedPxPerSec: 850,
        minDirectionChanges: 3,
        minTravelRatio: 1.8,
        minSegmentPx: 12,
        maxTurnDotProduct: 0.0,
        settleDelayMs: 160,
    }),
    low: Object.freeze({
        windowMs: 320,
        minDurationMs: 130,
        minTravelPx: 180,
        minAverageSpeedPxPerSec: 1150,
        minDirectionChanges: 4,
        minTravelRatio: 2.2,
        minSegmentPx: 14,
        maxTurnDotProduct: -0.1,
        settleDelayMs: 140,
    }),
});

const EMPTY_METRICS = Object.freeze({
    durationMs: 0,
    totalDistancePx: 0,
    directDistancePx: 0,
    averageSpeedPxPerSec: 0,
    directionChanges: 0,
    travelRatio: 0,
});

const MIN_MOTION_PX = 0.25;
const MIN_SAMPLE_DISTANCE_PX = 1;

export class WiggleDetector {
    constructor(options = {}) {
        this.configure(options);
        this.reset();
    }

    configure({sensitivity = this._sensitivity ?? DEFAULT_SENSITIVITY} = {}) {
        this._sensitivity = normalizeSensitivity(sensitivity);
        this._profile = SENSITIVITY_PROFILES[this._sensitivity];
    }

    reset() {
        this._samples = [];
        this._wiggling = false;
        this._lastMotionTimeMs = -Infinity;
        this._lastMetrics = EMPTY_METRICS;
    }

    sample(x, y, timeMs) {
        assertFiniteSample(x, y, timeMs);

        this._addSample({x, y, timeMs});

        const metrics = this._calculateMetrics();
        const detected = this._isDetected(metrics);
        const shouldSettle = this._wiggling &&
            timeMs - this._lastMotionTimeMs > this._profile.settleDelayMs;

        const wasWiggling = this._wiggling;

        if (detected)
            this._wiggling = true;
        else if (shouldSettle)
            this._wiggling = false;

        this._lastMetrics = metrics;

        return {
            wiggling: this._wiggling,
            started: !wasWiggling && this._wiggling,
            ended: wasWiggling && !this._wiggling,
            metrics,
        };
    }

    get wiggling() {
        return this._wiggling;
    }

    get metrics() {
        return this._lastMetrics;
    }

    _addSample(sample) {
        const previous = this._samples.at(-1);

        if (previous) {
            const distance = distanceBetween(previous, sample);

            if (distance >= MIN_MOTION_PX)
                this._lastMotionTimeMs = sample.timeMs;

            if (distance < MIN_SAMPLE_DISTANCE_PX) {
                this._pruneSamples(sample.timeMs);
                return;
            }
        }

        this._samples.push(sample);
        this._pruneSamples(sample.timeMs);
    }

    _pruneSamples(timeMs) {
        const cutoff = timeMs - this._profile.windowMs;

        while (this._samples.length > 1 && this._samples[0].timeMs < cutoff)
            this._samples.shift();
    }

    _calculateMetrics() {
        if (this._samples.length < 2)
            return EMPTY_METRICS;

        const first = this._samples[0];
        const last = this._samples.at(-1);
        const durationMs = Math.max(last.timeMs - first.timeMs, 1);

        let totalDistancePx = 0;
        const vectors = [];

        for (let index = 1; index < this._samples.length; index++) {
            const previous = this._samples[index - 1];
            const current = this._samples[index];
            const dx = current.x - previous.x;
            const dy = current.y - previous.y;
            const distance = Math.hypot(dx, dy);

            totalDistancePx += distance;

            if (distance >= this._profile.minSegmentPx)
                vectors.push({dx, dy, distance});
        }

        const directDistancePx = distanceBetween(first, last);
        const averageSpeedPxPerSec = totalDistancePx / durationMs * 1000;
        const directionChanges = countDirectionChanges(
            vectors,
            this._profile.maxTurnDotProduct);
        const travelRatio = totalDistancePx / Math.max(directDistancePx, 1);

        return {
            durationMs,
            totalDistancePx,
            directDistancePx,
            averageSpeedPxPerSec,
            directionChanges,
            travelRatio,
        };
    }

    _isDetected(metrics) {
        return metrics.durationMs >= this._profile.minDurationMs &&
            metrics.totalDistancePx >= this._profile.minTravelPx &&
            metrics.averageSpeedPxPerSec >= this._profile.minAverageSpeedPxPerSec &&
            metrics.directionChanges >= this._profile.minDirectionChanges &&
            metrics.travelRatio >= this._profile.minTravelRatio;
    }
}

export function normalizeSensitivity(sensitivity) {
    return Object.hasOwn(SENSITIVITY_PROFILES, sensitivity)
        ? sensitivity
        : DEFAULT_SENSITIVITY;
}

function countDirectionChanges(vectors, maxTurnDotProduct) {
    let directionChanges = 0;

    for (let index = 1; index < vectors.length; index++) {
        const previous = vectors[index - 1];
        const current = vectors[index];
        const dotProduct = (
            previous.dx * current.dx +
            previous.dy * current.dy
        ) / (previous.distance * current.distance);

        if (dotProduct <= maxTurnDotProduct)
            directionChanges++;
    }

    return directionChanges;
}

function distanceBetween(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
}

function assertFiniteSample(x, y, timeMs) {
    if (![x, y, timeMs].every(Number.isFinite))
        throw new TypeError('WiggleDetector samples must be finite numbers');
}
