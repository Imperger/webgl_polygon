import { XY } from './collision_engines/CollisionEngine';
import { DataDescriptor } from './models/DataDescriptor';

class CollisionDetector {
  static CircleCircle(c0: CircleCollider, c1: CircleCollider): boolean {
    return c0.Center.Distance(c1.Center) <= c0.Radius + c1.Radius;
  }
}

export class CircleCollider {
  private cachedCenter!: XY;

  constructor(private center: DataDescriptor, public Radius: number) {
    this.cachedCenter = new XY(
      this.center.buffer[this.center.offset], 
      this.center.buffer[this.center.offset + 1]);
  }

  get Center(): XY {
    return this.cachedCenter;
  }

  set Center(center: XY) {
    this.center.buffer[this.center.offset] = center.X;
    this.center.buffer[this.center.offset + 1] = center.Y;

    this.cachedCenter = new XY(center.X, center.Y);
  }

  get CenterDescriptor(): DataDescriptor {
    return this.center;
  }

  IsCollide(obj: CircleCollider): boolean {
    return CollisionDetector.CircleCircle(this, obj);
  }
}
