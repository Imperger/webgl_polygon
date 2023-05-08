import { CircleCollider } from '../CircleCollider';
import { XY } from '../collision_engines/CollisionEngine';

import { DataDescriptor } from './DataDescriptor';

import { Color } from '@/lib/misc/Primitives';
import { Dimension } from '@/lib/misc/Primitives';

interface SpeedVector {
  X: number;
  Y: number;
}

export class MovingCircleCollider extends CircleCollider {
  private lastCollision: number = Date.now();

  constructor(
    center: DataDescriptor,
    radius: number,
    private velocity: SpeedVector
  ) {
    super(center, radius);
  }

  public get Velocity(): SpeedVector {
    return this.velocity;
  }

  CheckCollision(colliders: MovingCircleCollider[]): void {
    colliders.forEach(collider => {
      const angle = Math.atan2(
        collider.Center.Y - this.Center.Y,
        collider.Center.X - this.Center.X
      );

      const targetX = this.Center.X + Math.cos(angle) * 2 * this.Radius;
      const targetY = this.Center.Y + Math.sin(angle) * 2 * this.Radius;

      const ax = targetX - collider.Center.X;
      const ay = targetY - collider.Center.Y;

      this.velocity.X -= ax;
      this.velocity.Y -= ay;

      this.lastCollision = Date.now();
      collider.lastCollision = this.lastCollision;

      collider.velocity.X += ax;
      collider.velocity.Y += ay;
    });
  }

  Move(boundaryField: Dimension): void {
    // FOR DEBUGGING
    /*  if (Date.now() - this.lastCollision > 10000) {
        this.Color({ R: 1, G: 0, B: 0 });
    } else {
      this.Color({R: 0.392, G:0.867, B: 0.09 });
    } */

    const MaxVelocity = 0.6;

    const velocity = Math.sqrt(this.velocity.X**2 + this.velocity.Y**2);

    if (velocity > MaxVelocity) {
      const normalizeFactor = MaxVelocity / velocity;

      this.velocity.X *= normalizeFactor;
      this.velocity.Y *= normalizeFactor;
    }
    

    if (this.Center.X - this.Radius + this.velocity.X < 0) {
      this.Center = new XY(this.Radius, this.Center.Y);
      this.Velocity.X *= -1;
    } else if (
      this.Center.X + this.Radius + this.velocity.X >
      boundaryField.Width
    ) {
      this.Center = new XY(boundaryField.Width - this.Radius, this.Center.Y);
      this.Velocity.X *= -1;
    }

    if (this.Center.Y - this.Radius + this.velocity.Y < 0) {
      this.Center = new XY(this.Center.X, this.Radius);
      this.Velocity.Y *= -1;
    } else if (
      this.Center.Y + this.Radius + this.velocity.Y >
      boundaryField.Height
    ) {
      this.Center = new XY(this.Center.X, boundaryField.Height - this.Radius);
      this.Velocity.Y *= -1;
    }

    this.Center = new XY(
      this.Center.X + this.velocity.X,
      this.Center.Y + this.velocity.Y
    );
  }

  Color(color: Color): void {
    const colorOffset = this.CenterDescriptor.offset + 2;

    this.CenterDescriptor.buffer[colorOffset] = color.R;
    this.CenterDescriptor.buffer[colorOffset + 1] = color.G;
    this.CenterDescriptor.buffer[colorOffset + 2] = color.B;
  }
}
