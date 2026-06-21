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

test('stays active on fractional movement after detection', () => {
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

    result = detector.sample(65.4, 0, 300);
    assert.equal(result.wiggling, true);

    result = detector.sample(65.8, 0, 460);
    assert.equal(result.wiggling, true);
    assert.equal(result.ended, false);
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
