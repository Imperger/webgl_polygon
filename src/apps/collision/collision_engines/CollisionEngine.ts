import { CircleCollider } from '../CircleCollider';

export class XY {
  constructor(public readonly X: number, public readonly Y: number) {}

  Distance(p: XY): number {
    return Math.sqrt(Math.pow(p.X - this.X, 2) + Math.pow(p.Y - this.Y, 2));
  }
}

export interface Position {
  X: number;
  Y: number;
}

export interface CollisionEngine<TCollider extends CircleCollider> {
  // Returns true if added
  Add(object: TCollider): boolean;
  // Returns true if found
  Remove(object: TCollider): boolean;
  RecalculateBuckets(): void;
  FindCollisions(object: TCollider): TCollider[];
  Reset(): void;
}
