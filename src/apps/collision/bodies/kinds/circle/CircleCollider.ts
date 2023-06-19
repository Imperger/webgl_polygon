import { Collider } from '../../../collision_engines/Collider';
import { Collision } from '../../Collision';
import { StaticRectangleCollider } from '../rectangle/StaticRectangleCollider';

import { Intersection } from '@/lib/math/Intersection';
import { AABBRectangle, Vec2 } from '@/lib/misc/Primitives';

export class CircleCollider implements Collider {
  public constructor(
    public readonly Center: Vec2,
    public Radius: number,
    public readonly Velocity: Vec2
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

  public CollideWithRectangle(rect: StaticRectangleCollider): boolean {
    return Intersection.RectangleCircle(rect, this);
  }

  public CheckCollision(collider: Collider, elapsed: number): void {
    collider.CheckCollisionWithCircle(this, elapsed);
  }

  CheckCollisionWithCircle(circle: CircleCollider, _elapsed: number): void {
    // TODO Firstly if circles is overlapped we should move they to prevent it
    const angle = Math.atan2(
      circle.Center.Y - this.Center.Y,
      circle.Center.X - this.Center.X
    );

    const targetX = this.Center.X + Math.cos(angle) * 2 * this.Radius;
    const targetY = this.Center.Y + Math.sin(angle) * 2 * this.Radius;

    const ax = targetX - circle.Center.X;
    const ay = targetY - circle.Center.Y;

    this.Velocity.X -= ax;
    this.Velocity.Y -= ay;

    circle.Velocity.X += ax;
    circle.Velocity.Y += ay;
  }

  CheckCollisionWithRectangle(
    rect: StaticRectangleCollider,
    _elapsed: number
  ): void {
    Collision.CircleStaticRectangle(this, rect);
  }

  public Move(boundary: AABBRectangle, elapsed: number): void {
    const MaxVelocity = 25;

    const velocity = Math.sqrt(this.Velocity.X ** 2 + this.Velocity.Y ** 2);

    if (velocity > MaxVelocity) {
      const normalizeFactor = MaxVelocity / velocity;

      this.Velocity.X *= normalizeFactor;
      this.Velocity.Y *= normalizeFactor;
    }

    let tickVelocityX = this.Velocity.X * (elapsed / 1000);
    let tickVelocityY = this.Velocity.Y * (elapsed / 1000);

    const boundaryRight = boundary.X + boundary.Width;
    const boundaryTop = boundary.Y + boundary.Height;

    if (this.Center.X - this.Radius + tickVelocityX < boundary.X) {
      this.Center.X = boundary.X + this.Radius;

      tickVelocityX *= -1;
      this.Velocity.X *= -1;
    } else if (this.Center.X + this.Radius + tickVelocityX > boundaryRight) {
      this.Center.X = boundaryRight - this.Radius;

      tickVelocityX *= -1;
      this.Velocity.X *= -1;
    }

    if (this.Center.Y - this.Radius + tickVelocityY < boundary.Y) {
      this.Center.Y = boundary.X + this.Radius;

      tickVelocityY *= -1;
      this.Velocity.Y *= -1;
    } else if (this.Center.Y + this.Radius + tickVelocityY > boundaryTop) {
      this.Center.Y = boundaryTop - this.Radius;

      tickVelocityY *= -1;
      this.Velocity.Y *= -1;
    }

    this.Center.X = this.Center.X + tickVelocityX;
    this.Center.Y = this.Center.Y + tickVelocityY;
  }
}
