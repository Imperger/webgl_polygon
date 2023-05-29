import { CircleCollider } from '../bodies/kinds/circle/CircleCollider';

import { AABBRectangle, Rectangle } from '@/lib/misc/Primitives';

export interface Collider {
  /**
   * Check is collider overlap rectangle.
   * Used to determine if the collider should be added to the node
   * @param rect Describes the boundaries of the node
   * @return Whether the collider overlaps the rectangle
   */
  IsOverlap(rect: AABBRectangle): boolean;

  /**
   * Check is collider inscribed in to AABB rectangle
   * @param rect
   */
  IsInside(rect: AABBRectangle): boolean;

  /**
   * Check collision between two colliders
   * @param another Another collider
   * @return Is collision happened
   */
  IsCollide(another: Collider): boolean;

  CollideWithCircle(circle: CircleCollider): boolean;

  CollideWithRectangle(rect: Rectangle): boolean;

  CheckCollision(collider: Collider, elapsed: number): void;

  CheckCollisionWithCircle(circle: CircleCollider, elapsed: number): void;

  CheckCollisionWithRectangle(rect: Rectangle, elapsed: number): void;

  Move(boundary: AABBRectangle, elapsed: number): void;
}
