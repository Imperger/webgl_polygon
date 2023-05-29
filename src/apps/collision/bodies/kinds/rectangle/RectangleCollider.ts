import { Collider } from '../../../collision_engines/Collider';
import { CircleCollider } from '../circle/CircleCollider';

import { Intersection } from '@/lib/math/Intersection';
import { Point } from '@/lib/math/Point';
import {
  AABBRectangle,
  Dimension,
  Rectangle,
  Vec2
} from '@/lib/misc/Primitives';

export class RectangleCollider implements Collider {
  private vertices!: [Vec2, Vec2, Vec2, Vec2];
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
    return this.vertices.every(p => Intersection.AABBRectanglePoint(rect, p));
  }

  public IsCollide(another: Collider): boolean {
    return another.CollideWithRectangle(this);
  }

  public CollideWithCircle(circle: CircleCollider): boolean {
    return Intersection.RectangleCircle(this, circle);
  }

  public CollideWithRectangle(_rect: Rectangle): boolean {
    throw new Error('Not required now');
  }

  public CheckCollision(collider: Collider, elapsed: number): void {
    throw new Error('Method not implemented.');
  }

  public CheckCollisionWithCircle(
    circle: CircleCollider,
    elapsed: number
  ): void {
    throw new Error('Method not implemented.');
  }

  public CheckCollisionWithRectangle(rect: Rectangle, elapsed: number): void {
    throw new Error('Method not implemented.');
  }

  public Move(boundary: AABBRectangle, elapsed: number): void {
    throw new Error('Method not implemented.');
  }

  public get Angle(): number {
    return this.angle;
  }

  public set Angle(val: number) {
    this.angle = val;

    this.UpdateVertices();
  }

  private UpdateVertices(): void {
    this.vertices = Point.RectangleVertices(this);
  }
}
