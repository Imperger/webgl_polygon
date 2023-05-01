import { XY } from './collision_engines/CollisionEngine';
import { DataDescriptor } from './models/DataDescriptor';

class CollisionDetector {
  static CircleCircle(c0: CircleCollider, c1: CircleCollider): boolean {
    return c0.Center.Distance(c1.Center) <= c0.Radius + c1.Radius;
  }
}

export class CircleCollider {
  constructor(private center: DataDescriptor, public Radius: number) {}

  get Center(): XY {
    return new XY(
      this.center.buffer[this.center.offset],
      this.center.buffer[this.center.offset + 1]
    );
  }

  set Center(center: XY) {
    this.center.buffer[this.center.offset] = center.X;
    this.center.buffer[this.center.offset + 1] = center.Y;
  }

  get CenterDescriptor(): DataDescriptor {
    return this.center;
  }

  IsCollide(obj: CircleCollider): boolean {
    return CollisionDetector.CircleCircle(this, obj);
  }
}
