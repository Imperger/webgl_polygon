import { CircleCollider } from '../CircleCollider';
import { XY } from '../collision_engines/CollisionEngine';

import { DataDescriptor } from './DataDescriptor';

import { Color, Vec2 } from '@/lib/misc/Primitives';
import { Dimension } from '@/lib/misc/Primitives';

export class MovingCircleCollider extends CircleCollider {
  constructor(center: DataDescriptor, radius: number, private velocity: Vec2) {
    super(center, radius);
  }

  public get Velocity(): Vec2 {
    return this.velocity;
  }

  CheckCollision(collider: MovingCircleCollider, elapsed: number): void {
    const angle = Math.atan2(
      collider.Center.Y - this.Center.Y,
      collider.Center.X - this.Center.X
    );

    const targetX = this.Center.X + Math.cos(angle) * 2 * this.Radius;
    const targetY = this.Center.Y + Math.sin(angle) * 2 * this.Radius;

    const ax = targetX - collider.Center.X;
    const ay = targetY - collider.Center.Y;

    const velocityAmplifier = 1000 / elapsed;
    this.velocity.X -= ax * velocityAmplifier;
    this.velocity.Y -= ay * velocityAmplifier;

    collider.velocity.X += ax * velocityAmplifier;
    collider.velocity.Y += ay * velocityAmplifier;
  }

  Move(boundaryField: Dimension, elapsed: number): void {
    const MaxVelocity = 100;

    const velocity = Math.sqrt(this.velocity.X ** 2 + this.velocity.Y ** 2);

    if (velocity > MaxVelocity) {
      const normalizeFactor = MaxVelocity / velocity;

      this.velocity.X *= normalizeFactor;
      this.velocity.Y *= normalizeFactor;
    }

    let tickVelocityX = this.velocity.X * (elapsed / 1000);
    let tickVelocityY = this.velocity.Y * (elapsed / 1000);

    if (this.Center.X - this.Radius + tickVelocityX < 0) {
      this.Center = new XY(this.Radius, this.Center.Y);
      tickVelocityX *= -1;
      this.velocity.X *= -1;
    } else if (
      this.Center.X + this.Radius + tickVelocityX >
      boundaryField.Width
    ) {
      this.Center = new XY(boundaryField.Width - this.Radius, this.Center.Y);
      tickVelocityX *= -1;
      this.velocity.X *= -1;
    }

    if (this.Center.Y - this.Radius + tickVelocityY < 0) {
      this.Center = new XY(this.Center.X, this.Radius);
      tickVelocityY *= -1;
      this.velocity.Y *= -1;
    } else if (
      this.Center.Y + this.Radius + tickVelocityY >
      boundaryField.Height
    ) {
      this.Center = new XY(this.Center.X, boundaryField.Height - this.Radius);
      tickVelocityY *= -1;
      this.velocity.Y *= -1;
    }

    this.Center = new XY(
      this.Center.X + tickVelocityX,
      this.Center.Y + tickVelocityY
    );
  }

  Color(color: Color): void {
    const colorOffset = this.CenterDescriptor.offset + 2;

    this.CenterDescriptor.buffer[colorOffset] = color.R;
    this.CenterDescriptor.buffer[colorOffset + 1] = color.G;
    this.CenterDescriptor.buffer[colorOffset + 2] = color.B;
  }
}
