import { Collider } from '../../../collision_engines/Collider';
import { Collision } from '../../Collision';
import { CircleCollider } from '../circle/CircleCollider';

import { Intersection } from '@/lib/math/Intersection';
import { Point } from '@/lib/math/Point';
import { AABBRectangle, Dimension, Vec2 } from '@/lib/misc/Primitives';

export class StaticRectangleCollider implements Collider {
  public Vertices!: [Vec2, Vec2, Vec2, Vec2];
  public constructor(
    public readonly Center: Vec2,
    public readonly Dimension: Dimension,
    private angle: number
  ) {
    this.UpdateVertices();
  }

  public IsOverlap(rect: AABBRectangle): boolean {
    return Intersection.RectangleAABBRectangle(this, rect);
  }

  IsInside(rect: AABBRectangle): boolean {
    return this.Vertices.every(p => Intersection.AABBRectanglePoint(rect, p));
  }

  public IsCollide(another: Collider): boolean {
    return another.CollideWithRectangle(this);
  }

  public CollideWithCircle(circle: CircleCollider): boolean {
    return Intersection.RectangleCircle(this, circle);
  }

  public CollideWithRectangle(_rect: StaticRectangleCollider): boolean {
    throw new Error('Not required now');
  }

  public CheckCollision(collider: Collider, elapsed: number): void {
    collider.CheckCollisionWithRectangle(this, elapsed);
  }

  public CheckCollisionWithCircle(
    circle: CircleCollider,
    _elapsed: number
  ): void {
    Collision.CircleStaticRectangle(circle, this);
  }

  public CheckCollisionWithRectangle(
    _rect: StaticRectangleCollider,
    _elapsed: number
  ): void {
    // Since we doesn't have any moving rectangles its not necessary
    throw new Error('Method not implemented.');
  }

  public Move(_boundary: AABBRectangle, _elapsed: number): void {
    // Since it's a static - nothing to do
  }

  public get Angle(): number {
    return this.angle;
  }

  public set Angle(val: number) {
    this.angle = val;

    this.UpdateVertices();
  }

  private UpdateVertices(): void {
    this.Vertices = Point.RectangleVertices(this);
  }
}
