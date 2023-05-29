import { Collider } from './Collider';
import { CollisionEngine } from './CollisionEngine';

export class BruteForceCollisionEngine implements CollisionEngine {
  Reset(): void {
    this.objects.splice(0);
  }
  private objects: Collider[] = [];

  Add(object: Collider): boolean {
    this.objects.push(object);

    return true;
  }

  Remove(object: Collider): boolean {
    const removedIdx = this.objects.indexOf(object);

    if (removedIdx >= 0) {
      this.objects.splice(removedIdx, 1);

      return true;
    }

    return false;
  }

  ForEachCollided(handler: (a: Collider, b: Collider) => void): void {
    for (let aIdx = 0; aIdx < this.objects.length; ++aIdx) {
      for (let bIdx = aIdx + 1; bIdx < this.objects.length; ++bIdx) {
        const a = this.objects[aIdx];
        const b = this.objects[bIdx];

        if (a.IsCollide(b)) {
          handler(a, b);
        }
      }
    }
  }

  RecalculateBuckets(): void {
    // No buckets no problem
  }

  Draw(_elapsed: number): void {
    // Nothing to draw
  }
}
