// Run with: node measure.test.js
const assert = require('assert');
const { measureGap } = require('./measure.js');

const box = (left, top, right, bottom) => ({ left, top, right, bottom });
const lengths = (segs) => segs.map(s => s.length).sort((x, y) => x - y);

// Same element: nothing
assert.deepStrictEqual(measureGap(box(0, 0, 10, 10), box(0, 0, 10, 10)), []);

// Side by side, overlapping vertically: one horizontal line at the overlap's middle
let segs = measureGap(box(0, 0, 10, 10), box(34, 4, 50, 20));
assert.deepStrictEqual(segs, [{ x1: 10, y1: 7, x2: 34, y2: 7, length: 24 }]);

// Same, but b on the left of a
segs = measureGap(box(34, 4, 50, 20), box(0, 0, 10, 10));
assert.deepStrictEqual(segs, [{ x1: 10, y1: 7, x2: 34, y2: 7, length: 24 }]);

// Stacked: one vertical line
segs = measureGap(box(0, 0, 10, 10), box(0, 30, 10, 40));
assert.deepStrictEqual(segs, [{ x1: 5, y1: 10, x2: 5, y2: 30, length: 20 }]);

// Diagonal: both gaps, drawn through the anchor's middle
segs = measureGap(box(0, 0, 10, 10), box(20, 40, 30, 50));
assert.deepStrictEqual(segs, [
  { x1: 10, y1: 5, x2: 20, y2: 5, length: 10 },
  { x1: 5, y1: 10, x2: 5, y2: 40, length: 30 }
]);

// Touching: zero gap, nothing drawn
assert.deepStrictEqual(measureGap(box(0, 0, 10, 10), box(10, 0, 20, 10)), []);

// Partial overlap on both axes: nothing
assert.deepStrictEqual(measureGap(box(0, 0, 10, 10), box(5, 5, 15, 15)), []);

// Nested (either order): 4 lines from inner edges to outer edges
const outer = box(0, 0, 100, 50);
const inner = box(10, 5, 70, 45);
assert.deepStrictEqual(lengths(measureGap(outer, inner)), [5, 5, 10, 30]);
assert.deepStrictEqual(lengths(measureGap(inner, outer)), [5, 5, 10, 30]);

// Nested and flush on one side: that side is skipped
assert.deepStrictEqual(lengths(measureGap(box(0, 0, 100, 50), box(0, 5, 70, 45))), [5, 5, 30]);

console.log('measure.test.js: all passed');
