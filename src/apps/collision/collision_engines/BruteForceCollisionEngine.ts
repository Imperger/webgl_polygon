import { MovingCircleCollider } from '../models/MovingCircleCollider';

import { CollisionEngine } from './CollisionEngine';

export class BruteForceCollisionEngine
  implements CollisionEngine<MovingCircleCollider>
{
  Reset(): void {
    this.objects.splice(0);
  }
  private objects: MovingCircleCollider[] = [];

  Add(object: MovingCircleCollider): boolean {
    this.objects.push(object);

    return true;
  }

  Remove(object: MovingCircleCollider): boolean {
    const removedIdx = this.objects.indexOf(object);

    if (removedIdx >= 0) {
      this.objects.splice(removedIdx, 1);

      return true;
    }

    return false;
  }

  RecalculateBuckets(): void {
    // No buckets no problem
  }

  FindCollisions(object: MovingCircleCollider): MovingCircleCollider[] {
    const idx = this.objects.indexOf(object);

    if (idx === -1) {
      return [];
    }

    return this.objects
      .slice(idx + 1)
      .filter(obj => obj !== object && obj.IsCollide(object));
  }

  Draw(_elapsed: number): void {
    // Nothing to draw
  }
}
