import { Collider } from '../../../collision_engines/Collider';
import { DataDescriptor } from '../../../models/DataDescriptor';
import { Body } from '../../Body';

import { CircleCollider } from './CircleCollider';
import { VisualCircle } from './VisualCircle';

import { AABBRectangle, Color, Rectangle, Vec2 } from '@/lib/misc/Primitives';

export class CircleBody implements Body {
  private collider: CircleCollider;

  private visual: VisualCircle;

  constructor(center: DataDescriptor, radius: number, velocity: Vec2) {
    this.collider = new CircleCollider(
      this.ExtractCenter(center),
      radius,
      velocity
    );
    this.visual = new VisualCircle(center);
  }

  public IsOverlap(rect: AABBRectangle): boolean {
    return this.collider.IsOverlap(rect);
  }

  public IsInside(rect: AABBRectangle): boolean {
    return this.collider.IsInside(rect);
  }

  public IsCollide(another: Collider): boolean {
    return this.collider.IsCollide(another);
  }

  public CollideWithCircle(circle: CircleCollider): boolean {
    return this.collider.CollideWithCircle(circle);
  }

  public CollideWithRectangle(rect: Rectangle): boolean {
    return this.collider.CollideWithRectangle(rect);
  }

  public Color(color: Color): void {
    this.visual.Color(color);
  }

  public MoveInto(rect: AABBRectangle): void {
    const radius = this.collider.Radius;

    const rectRight = rect.X + rect.Width;
    const rectTop = rect.Y + rect.Height;

    if (this.Center.X + radius > rectRight) {
      this.Center = { X: rectRight - radius, Y: this.Center.Y };
    } else if (this.Center.X - radius < rect.X) {
      this.Center = { X: rect.X + radius, Y: this.Center.Y };
    }

    if (this.Center.Y + radius > rectTop) {
      this.Center = { X: this.Center.X, Y: rectTop - radius };
    } else if (this.Center.Y - radius < rect.Y) {
      this.Center = { X: this.Center.X, Y: rect.Y + radius };
    }
  }

  public CheckCollision(collider: Collider, elapsed: number): void {
    this.collider.CheckCollision(collider, elapsed);
  }

  public CheckCollisionWithCircle(
    circle: CircleCollider,
    elapsed: number
  ): void {
    this.collider.CheckCollisionWithCircle(circle, elapsed);
  }

  public CheckCollisionWithRectangle(rect: Rectangle, elapsed: number): void {
    this.collider.CheckCollisionWithRectangle(rect, elapsed);
  }

  public Move(boundary: AABBRectangle, elapsed: number): void {
    this.collider.Move(boundary, elapsed);

    this.Center = this.collider.Center;
  }

  private get Center(): Vec2 {
    return this.collider.Center;
  }

  private set Center(center: Vec2) {
    this.collider.Center.X = center.X;
    this.collider.Center.Y = center.Y;

    this.visual.Center(center);
  }

  public get Radius(): number {
    return this.collider.Radius;
  }

  public set Radius(radius: number) {
    this.collider.Radius = radius;
  }

  private ExtractCenter(center: DataDescriptor): Vec2 {
    return {
      X: center.buffer[center.offset],
      Y: center.buffer[center.offset + 1]
    };
  }
}
