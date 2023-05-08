import { CircleCollider } from '../CircleCollider';

import { Point } from '@/lib/math/Point';

export class XY {
  constructor(public readonly X: number, public readonly Y: number) {}

  Distance(p: XY): number {
    return Point.Distance({ X: this.X, Y: this.Y }, p);
  }
}

export interface CollisionEngine<TCollider extends CircleCollider> {
  // Returns true if added
  Add(object: TCollider): boolean;
  // Returns true if found
  Remove(object: TCollider): boolean;
  RecalculateBuckets(): void;
  FindCollisions(object: TCollider): TCollider[];
  Reset(): void;
  Draw(elapsed: number): void;
}
