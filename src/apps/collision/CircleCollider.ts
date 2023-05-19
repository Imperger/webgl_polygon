import { XY } from './collision_engines/CollisionEngine';
import { DataDescriptor } from './models/DataDescriptor';

import { Shape } from '@/lib/math/Shape';

export class CircleCollider {
  private cachedCenter!: XY;

  constructor(private center: DataDescriptor, public Radius: number) {
    this.cachedCenter = new XY(
      this.center.buffer[this.center.offset],
      this.center.buffer[this.center.offset + 1]
    );
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
    return Shape.CircleCircleIntersect(this, obj);
  }
}
