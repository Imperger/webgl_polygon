import { describe, expect, test } from '@jest/globals';

import { Point } from './Point';

import { Line } from '@/lib/misc/Primitives';

describe('ClosestLine', () => {
  test('Case#1', () => {
    const lines: Line[] = [
      { A: { X: 0, Y: 0 }, B: { X: 9, Y: 0 } },
      { A: { X: 0, Y: 0 }, B: { X: 0, Y: 5 } }
    ];

    expect(Point.ClosestLine({ X: 2, Y: 1 }, lines)).toEqual(lines[0]);
  });

  test('Case#2', () => {
    const lines: Line[] = [
      { A: { X: 0, Y: 0 }, B: { X: 3, Y: 0 } },
      { A: { X: 0, Y: 0 }, B: { X: 0, Y: 3 } }
    ];

    expect(Point.ClosestLine({ X: 2, Y: 1 }, lines)).toEqual(lines[0]);
  });

  test('Case#3', () => {
    const lines: Line[] = [
      { A: { X: 0, Y: 0 }, B: { X: 3, Y: 0 } },
      { A: { X: 0, Y: 0 }, B: { X: 0, Y: 3 } }
    ];

    expect(Point.ClosestLine({ X: 1, Y: 4 }, lines)).toEqual(lines[1]);
  });

  test('Case#4', () => {
    const lines: Line[] = [
      { A: { X: 0, Y: 0 }, B: { X: 3, Y: 0 } },
      { A: { X: 0, Y: 0 }, B: { X: 0, Y: 3 } }
    ];

    expect(Point.ClosestLine({ X: 4, Y: 1 }, lines)).toEqual(lines[0]);
  });

  test('Closest point is shared, should be chosen first matched line', () => {
    const lines: Line[] = [
      { A: { X: 0, Y: 0 }, B: { X: 3, Y: 0 } },
      { A: { X: 0, Y: 0 }, B: { X: 0, Y: 3 } }
    ];

    expect(Point.ClosestLine({ X: -2, Y: -1 }, lines)).toEqual(lines[0]);
  });
});
