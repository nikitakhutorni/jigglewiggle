import test from 'node:test';
import assert from 'node:assert/strict';

import {
    normalizeSensitivity,
    WiggleDetector,
} from '../extension/wiggleDetector.js';

test('normalizes unknown sensitivity values to medium', () => {
    assert.equal(normalizeSensitivity('unknown'), 'medium');
    assert.equal(normalizeSensitivity('high'), 'high');
});

test('does not trigger on slow one-way movement', () => {
    const detector = new WiggleDetector({sensitivity: 'medium'});
    let result;

    for (let index = 0; index < 20; index++)
        result = detector.sample(index * 8, 0, index * 80);

    assert.equal(result.wiggling, false);
    assert.equal(result.started, false);
});

test('triggers on fast back-and-forth movement', () => {
    const detector = new WiggleDetector({sensitivity: 'medium'});
    const points = [
        [0, 0],
        [45, 2],
        [-10, -1],
        [55, 1],
        [-15, -2],
        [60, 0],
        [-20, 2],
        [65, -1],
    ];

    let started = false;
    let result;

    for (let index = 0; index < points.length; index++) {
        const [x, y] = points[index];
        result = detector.sample(x, y, index * 24);
        started ||= result.started;
    }

    assert.equal(started, true);
    assert.equal(result.wiggling, true);
    assert.ok(result.metrics.directionChanges >= 3);
    assert.ok(result.metrics.travelRatio >= 1.8);
});

test('triggers on compact terminal-style back-and-forth movement', () => {
    const detector = new WiggleDetector({sensitivity: 'medium'});
    let startedAt = null;
    let result;

    for (let index = 0; index < 14; index++) {
        const x = (index % 2 === 0 ? -1 : 1) * 8;
        result = detector.sample(x, 0, index * 24);

        if (result.started && startedAt === null)
            startedAt = index * 24;
    }

    assert.equal(result.wiggling, true);
    assert.ok(startedAt !== null);
    assert.ok(startedAt <= 180);
});

test('stays active briefly and ends after movement settles', () => {
    const detector = new WiggleDetector({sensitivity: 'medium'});
    const points = [
        [0, 0],
        [45, 0],
        [-10, 0],
        [55, 0],
        [-15, 0],
        [60, 0],
        [-20, 0],
        [65, 0],
    ];

    let result;
    for (let index = 0; index < points.length; index++) {
        const [x, y] = points[index];
        result = detector.sample(x, y, index * 24);
    }

    assert.equal(result.wiggling, true);

    result = detector.sample(65, 0, 180);
    assert.equal(result.wiggling, true);
    assert.equal(result.ended, false);

    result = detector.sample(65, 0, 520);
    assert.equal(result.wiggling, false);
    assert.equal(result.ended, true);
});

test('stays active on meaningful movement after detection', () => {
    const detector = new WiggleDetector({sensitivity: 'medium'});
    const points = [
        [0, 0],
        [45, 0],
        [-10, 0],
        [55, 0],
        [-15, 0],
        [60, 0],
        [-20, 0],
        [65, 0],
    ];

    let result;
    for (let index = 0; index < points.length; index++) {
        const [x, y] = points[index];
        result = detector.sample(x, y, index * 24);
    }

    assert.equal(result.wiggling, true);

    result = detector.sample(68.5, 0, 300);
    assert.equal(result.wiggling, true);

    result = detector.sample(72, 0, 460);
    assert.equal(result.wiggling, true);
    assert.equal(result.ended, false);
});

test('settles during non-wiggle movement after detection', () => {
    const detector = new WiggleDetector({sensitivity: 'medium'});
    const points = [
        [0, 0],
        [45, 0],
        [-10, 0],
        [55, 0],
        [-15, 0],
        [60, 0],
        [-20, 0],
        [65, 0],
    ];

    let result;
    for (let index = 0; index < points.length; index++) {
        const [x, y] = points[index];
        result = detector.sample(x, y, index * 24);
    }

    assert.equal(result.wiggling, true);

    for (const [x, timeMs] of [
        [68.5, 300],
        [72, 460],
        [75.5, 620],
    ]) {
        result = detector.sample(x, 0, timeMs);
        assert.equal(result.wiggling, true);
    }

    result = detector.sample(79, 0, 760);
    assert.equal(result.wiggling, false);
    assert.equal(result.ended, true);
});

test('settles after jitter below the meaningful movement threshold', () => {
    const detector = new WiggleDetector({sensitivity: 'medium'});
    const points = [
        [0, 0],
        [45, 0],
        [-10, 0],
        [55, 0],
        [-15, 0],
        [60, 0],
        [-20, 0],
        [65, 0],
    ];

    let result;
    for (let index = 0; index < points.length; index++) {
        const [x, y] = points[index];
        result = detector.sample(x, y, index * 24);
    }

    assert.equal(result.wiggling, true);

    for (const [x, timeMs] of [
        [65.4, 220],
        [65.8, 300],
        [65.3, 380],
        [65.7, 460],
    ])
        result = detector.sample(x, 0, timeMs);

    assert.equal(result.wiggling, false);
    assert.equal(result.ended, true);
});

test('settles after repeated-coordinate samples', () => {
    const detector = new WiggleDetector({sensitivity: 'medium'});
    const points = [
        [0, 0],
        [45, 0],
        [-10, 0],
        [55, 0],
        [-15, 0],
        [60, 0],
        [-20, 0],
        [65, 0],
    ];

    let result;
    for (let index = 0; index < points.length; index++) {
        const [x, y] = points[index];
        result = detector.sample(x, y, index * 24);
    }

    assert.equal(result.wiggling, true);

    result = detector.sample(65, 0, 460);
    assert.equal(result.wiggling, false);
    assert.equal(result.ended, true);
});

test('settles after stale Shell-like jitter samples', () => {
    const detector = new WiggleDetector({sensitivity: 'medium'});
    const points = [
        [0, 0],
        [45, 0],
        [-10, 0],
        [55, 0],
        [-15, 0],
        [60, 0],
        [-20, 0],
        [65, 0],
    ];

    let result;
    for (let index = 0; index < points.length; index++) {
        const [x, y] = points[index];
        result = detector.sample(x, y, index * 24);
    }

    assert.equal(result.wiggling, true);

    for (const [x, y, timeMs] of [
        [66.2, 0.4, 220],
        [64.9, -0.2, 300],
        [65.6, 0.3, 380],
    ]) {
        result = detector.sample(x, y, timeMs);
        assert.equal(result.wiggling, true);
    }

    result = detector.sample(65.1, 0.1, 460);
    assert.equal(result.wiggling, false);
    assert.equal(result.ended, true);
});

test('high sensitivity triggers before low sensitivity for smaller wiggles', () => {
    const high = new WiggleDetector({sensitivity: 'high'});
    const low = new WiggleDetector({sensitivity: 'low'});
    const points = [
        [0, 0],
        [22, 0],
        [-4, 0],
        [25, 0],
        [-5, 0],
        [27, 0],
        [-6, 0],
    ];

    let highStarted = false;
    let lowStarted = false;

    for (let index = 0; index < points.length; index++) {
        const [x, y] = points[index];
        highStarted ||= high.sample(x, y, index * 28).started;
        lowStarted ||= low.sample(x, y, index * 28).started;
    }

    assert.equal(highStarted, true);
    assert.equal(lowStarted, false);
});

test('reset clears active state and metrics', () => {
    const detector = new WiggleDetector({sensitivity: 'medium'});

    detector.sample(0, 0, 0);
    detector.sample(50, 0, 20);
    detector.sample(-10, 0, 40);
    detector.reset();

    assert.equal(detector.wiggling, false);
    assert.equal(detector.metrics.totalDistancePx, 0);
});
