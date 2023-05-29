import { Collider } from '../../../collision_engines/Collider';

import { Intersection } from '@/lib/math/Intersection';
import { AABBRectangle, Rectangle, Vec2 } from '@/lib/misc/Primitives';

export class CircleCollider implements Collider {
  public constructor(
    public readonly Center: Vec2,
    public Radius: number,
    private velocity: Vec2
  ) {}

  public IsOverlap(rect: AABBRectangle): boolean {
    return Intersection.AABBRectangleCircle(rect, this);
  }

  public IsInside(rect: AABBRectangle): boolean {
    if (this.Center.X - this.Radius < rect.X) {
      return false;
    }

    if (this.Center.X + this.Radius > rect.X + rect.Width) {
      return false;
    }

    if (this.Center.Y - this.Radius < rect.Y) {
      return false;
    }

    if (this.Center.Y + this.Radius > rect.Y + rect.Height) {
      return false;
    }

    return true;
  }

  public IsCollide(another: Collider): boolean {
    return another.CollideWithCircle(this);
  }

  public CollideWithCircle(circle: CircleCollider): boolean {
    return Intersection.CircleCircle(this, circle);
  }

  public CollideWithRectangle(rect: Rectangle): boolean {
    return Intersection.RectangleCircle(rect, this);
  }

  public CheckCollision(collider: Collider, elapsed: number): void {
    collider.CheckCollisionWithCircle(this, elapsed);
  }

  CheckCollisionWithCircle(circle: CircleCollider, elapsed: number): void {
    const angle = Math.atan2(
      circle.Center.Y - this.Center.Y,
      circle.Center.X - this.Center.X
    );

    const targetX = this.Center.X + Math.cos(angle) * 2 * this.Radius;
    const targetY = this.Center.Y + Math.sin(angle) * 2 * this.Radius;

    const ax = targetX - circle.Center.X;
    const ay = targetY - circle.Center.Y;

    const velocityAmplifier = 1000 / elapsed;
    this.velocity.X -= ax * velocityAmplifier;
    this.velocity.Y -= ay * velocityAmplifier;

    circle.velocity.X += ax * velocityAmplifier;
    circle.velocity.Y += ay * velocityAmplifier;
  }

  CheckCollisionWithRectangle(rect: Rectangle, elapsed: number): void {
    throw new Error('Method not implemented.');
  }

  public Move(boundary: AABBRectangle, elapsed: number): void {
    const MaxVelocity = 100;

    const velocity = Math.sqrt(this.velocity.X ** 2 + this.velocity.Y ** 2);

    if (velocity > MaxVelocity) {
      const normalizeFactor = MaxVelocity / velocity;

      this.velocity.X *= normalizeFactor;
      this.velocity.Y *= normalizeFactor;
    }

    let tickVelocityX = this.velocity.X * (elapsed / 1000);
    let tickVelocityY = this.velocity.Y * (elapsed / 1000);

    const boundaryRight = boundary.X + boundary.Width;
    const boundaryTop = boundary.Y + boundary.Height;

    if (this.Center.X - this.Radius + tickVelocityX < boundary.X) {
      this.Center.X = boundary.X + this.Radius;

      tickVelocityX *= -1;
      this.velocity.X *= -1;
    } else if (this.Center.X + this.Radius + tickVelocityX > boundaryRight) {
      this.Center.X = boundaryRight - this.Radius;

      tickVelocityX *= -1;
      this.velocity.X *= -1;
    }

    if (this.Center.Y - this.Radius + tickVelocityY < boundary.Y) {
      this.Center.Y = boundary.X + this.Radius;

      tickVelocityY *= -1;
      this.velocity.Y *= -1;
    } else if (this.Center.Y + this.Radius + tickVelocityY > boundaryTop) {
      this.Center.Y = boundaryTop - this.Radius;

      tickVelocityY *= -1;
      this.velocity.Y *= -1;
    }

    this.Center.X = this.Center.X + tickVelocityX;
    this.Center.Y = this.Center.Y + tickVelocityY;
  }
}
