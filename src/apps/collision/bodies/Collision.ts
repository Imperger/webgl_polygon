import { CircleCollider } from './kinds/circle/CircleCollider';
import { StaticRectangleCollider } from './kinds/rectangle/StaticRectangleCollider';

import { Intersection } from '@/lib/math/Intersection';
import { Point } from '@/lib/math/Point';
import { Vector2 } from '@/lib/math/Vector';
import { Line, Vec2 } from '@/lib/misc/Primitives';

export class Collision {
  public static CircleStaticRectangle(
    circle: CircleCollider,
    rectangle: StaticRectangleCollider
  ): void {
    const sides = [
      { A: rectangle.Vertices[0], B: rectangle.Vertices[1] },
      { A: rectangle.Vertices[1], B: rectangle.Vertices[2] },
      { A: rectangle.Vertices[2], B: rectangle.Vertices[3] },
      { A: rectangle.Vertices[3], B: rectangle.Vertices[0] }
    ];

    const collided = sides.filter(side =>
      Intersection.LineCircle(side, circle)
    );

    let tangent: Vec2;

    if (collided.length > 1) {
      const collidedSidePoints = collided.flatMap(x => [x.A, x.B]);
      const collidedCorner =
        collidedSidePoints.find(a =>
          collidedSidePoints.find(b => b === a)
        ) ?? collidedSidePoints[0];
      tangent = Vector2.Normal(Vector2.Subtract(collidedCorner, circle.Center));
    } else if (collided.length === 0) {
      const closestSide = Collision.MoveOutCircleFromStaticRectangle(
        sides,
        circle
      );
      tangent = Vector2.Subtract(closestSide.A, closestSide.B);
    } else {
      tangent = Vector2.Subtract(collided[0].A, collided[0].B);
    }

    if (collided.length > 0) {
      Collision.SolveCollision(collided, circle);
    }

    const afterBounce = Vector2.Reflect(circle.Velocity, tangent);

    circle.Velocity.X = afterBounce.X;
    circle.Velocity.Y = afterBounce.Y;
  }

  private static MoveOutCircleFromStaticRectangle(
    sides: Line[],
    circle: CircleCollider
  ): Line {
    return Collision.AttachToClosestSide(sides, circle, true);
  }

  private static SolveCollision(sides: Line[], circle: CircleCollider): void {
    Collision.AttachToClosestSide(sides, circle, false);
  }

  private static AttachToClosestSide(
    sides: Line[],
    circle: CircleCollider,
    oppositeSide: boolean
  ): Line {
    const closestSide = Point.ClosestLine(circle.Center, sides);

    const closestPointOnSide = Point.ClosestToLine(circle.Center, closestSide);

    const transformNormal = Vector2.Normalize(
      Vector2.Subtract(closestPointOnSide, circle.Center)
    );

    const operator = oppositeSide ? Vector2.Add : Vector2.Subtract;

    const centerOutside = operator(
      closestPointOnSide,
      Vector2.Multiply(transformNormal, circle.Radius)
    );

    circle.Center.X = centerOutside.X;
    circle.Center.Y = centerOutside.Y;

    return closestSide;
  }
}
