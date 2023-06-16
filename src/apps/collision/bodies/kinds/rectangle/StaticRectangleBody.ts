import { Body } from '../../Body';
import { CircleCollider } from '../circle/CircleCollider';

import { StaticRectangleCollider } from './StaticRectangleCollider';
import { VisualRectangle } from './VisualRectangle';

import { Collider } from '@/apps/collision/collision_engines/Collider';
import { AABBRectangle, Color, Rectangle } from '@/lib/misc/Primitives';
import { DataDescriptor } from '@/lib/render/PrimitivesRenderer';

export class StaticRectangleBody implements Body {
  private collider: StaticRectangleCollider;

  private visual: VisualRectangle;

  constructor(data: DataDescriptor, rect: Rectangle) {
    this.collider = new StaticRectangleCollider(
      rect.Center,
      rect.Dimension,
      rect.Angle
    );
    this.visual = new VisualRectangle(data);
  }

  MoveInto(_rect: AABBRectangle): void {
    throw new Error('Method not implemented.');
  }

  set Color(color: Color) {
    this.visual.Color = color;
  }

  get Color(): Color {
    return this.visual.Color;
  }

  IsOverlap(rect: AABBRectangle): boolean {
    return this.collider.IsOverlap(rect);
  }

  IsInside(rect: AABBRectangle): boolean {
    return this.collider.IsInside(rect);
  }

  IsCollide(another: Collider): boolean {
    return this.collider.IsCollide(another);
  }

  CollideWithCircle(circle: CircleCollider): boolean {
    return this.collider.CollideWithCircle(circle);
  }

  CollideWithRectangle(rect: StaticRectangleCollider): boolean {
    return this.collider.CollideWithRectangle(rect);
  }

  CheckCollision(collider: Collider, elapsed: number): void {
    this.collider.CheckCollision(collider, elapsed);
  }

  CheckCollisionWithCircle(circle: CircleCollider, elapsed: number): void {
    this.collider.CheckCollisionWithCircle(circle, elapsed);
  }

  CheckCollisionWithRectangle(
    rect: StaticRectangleCollider,
    elapsed: number
  ): void {
    this.collider.CheckCollisionWithRectangle(rect, elapsed);
  }

  Move(boundary: AABBRectangle, elapsed: number): void {
    this.collider.Move(boundary, elapsed);
  }
}
