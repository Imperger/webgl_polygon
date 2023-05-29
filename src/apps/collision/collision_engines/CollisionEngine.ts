import { Collider } from './Collider';

import { Point } from '@/lib/math/Point';

export class XY {
  constructor(public readonly X: number, public readonly Y: number) {}

  Distance(p: XY): number {
    return Point.Distance({ X: this.X, Y: this.Y }, p);
  }
}

export interface CollisionEngine {
  // Returns true if added
  Add(object: Collider): boolean;

  // Returns true if found
  Remove(object: Collider): boolean;

  RecalculateBuckets(): void;

  ForEachCollided(handler: (a: Collider, b: Collider) => void): void;

  Reset(): void;

  Draw(elapsed: number): void;
}
