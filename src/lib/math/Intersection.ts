import { Algorithm } from '../misc/Algorithm';
import {
  Circle,
  AABBRectangle,
  Rectangle,
  Vec2,
  Line
} from '../misc/Primitives';

import { Point } from './Point';
import { Vector2 } from './Vector';

export class Intersection {
  public static AABBRectangleCircle(
    rect: AABBRectangle,
    circle: Circle
  ): boolean {
    const circleDistanceX = Math.abs(
      circle.Center.X - (rect.X + rect.Width / 2)
    );
    const circleDistanceY = Math.abs(
      circle.Center.Y - (rect.Y + rect.Height / 2)
    );

    if (circleDistanceX > rect.Width / 2 + circle.Radius) {
      return false;
    }
    if (circleDistanceY > rect.Height / 2 + circle.Radius) {
      return false;
    }

    if (circleDistanceX <= rect.Width / 2) {
      return true;
    }
    if (circleDistanceY <= rect.Height / 2) {
      return true;
    }

    const cornerDistance_sq =
      (circleDistanceX - rect.Width / 2) ** 2 +
      (circleDistanceY - rect.Height / 2) ** 2;

    return cornerDistance_sq <= circle.Radius ** 2;
  }

  public static RectangleCircle(rect: Rectangle, circle: Circle): boolean {
    const transformedRect: AABBRectangle = {
      X: -rect.Dimension.Width / 2,
      Y: -rect.Dimension.Height / 2,
      Width: rect.Dimension.Width,
      Height: rect.Dimension.Height
    };

    const transformedCircle: Circle = {
      Center: Point.Rotate(
        {
          X: circle.Center.X - rect.Center.X,
          Y: circle.Center.Y - rect.Center.Y
        },
        -rect.Angle
      ),
      Radius: circle.Radius
    };

    return Intersection.AABBRectangleCircle(transformedRect, transformedCircle);
  }

  public static AABBRectanglePoint(rect: AABBRectangle, point: Vec2): boolean {
    return (
      point.X <= rect.X + rect.Width &&
      point.X >= rect.X &&
      point.Y <= rect.Y + rect.Height &&
      point.Y >= rect.Y
    );
  }

  /**
   * Determine if two lines intersect
   *
   * @see https://github.com/pgkelley4/line-segments-intersect
   * @see https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect/565282#565282
   * @param a first line
   * @param b second line
   * @returns true if lines is intersected
   */
  public static LineLine(a: Line, b: Line): boolean {
    const r = Vector2.Subtract(a.B, a.A);
    const s = Vector2.Subtract(b.B, b.A);

    const ba = Vector2.Subtract(b.A, a.A);
    const uNumerator = Vector2.CrossProduct(ba, r);
    const denominator = Vector2.CrossProduct(r, s);

    if (uNumerator === 0 && denominator === 0) {
      if (
        Point.IsEqual(a.A, b.A) ||
        Point.IsEqual(a.A, b.B) ||
        Point.IsEqual(a.B, b.A) ||
        Point.IsEqual(a.B, b.B)
      ) {
        return true;
      }

      return (
        !Algorithm.IsEqualValues(
          b.A.X - a.A.X < 0,
          b.A.X - a.B.X < 0,
          b.B.X - a.A.X < 0,
          b.B.X - a.B.X < 0
        ) ||
        !Algorithm.IsEqualValues(
          b.A.Y - a.A.Y < 0,
          b.A.Y - a.B.Y < 0,
          b.B.Y - a.A.Y < 0,
          b.B.Y - a.B.Y < 0
        )
      );
    }

    if (denominator === 0) {
      return false;
    }

    const u = uNumerator / denominator;
    const t = Vector2.CrossProduct(ba, s) / denominator;

    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  public static AABBRectangleLine(rect: AABBRectangle, line: Line): boolean {
    const lb: Vec2 = { X: rect.X, Y: rect.Y };
    const rb: Vec2 = { X: rect.X + rect.Width, Y: rect.Y };
    const rt: Vec2 = { X: rb.X, Y: rect.Y + rect.Height };
    const lt: Vec2 = { X: rect.X, Y: rt.Y };

    // At least one the line point inside the rectangle
    if (
      Intersection.AABBRectanglePoint(rect, line.A) ||
      Intersection.AABBRectanglePoint(rect, line.B)
    ) {
      return true;
    }

    // The line intersect at least one the rectangle edge
    return (
      Intersection.LineLine(line, { A: lb, B: rb }) ||
      Intersection.LineLine(line, { A: rb, B: rt }) ||
      Intersection.LineLine(line, { A: rt, B: lt }) ||
      Intersection.LineLine(line, { A: lt, B: lb })
    );
  }

  public static RectangleAABBRectangle(
    rect: Rectangle,
    aabbRectangle: AABBRectangle
  ): boolean {
    const rectHalfWidth = rect.Dimension.Width / 2;
    const rectHalfHeight = rect.Dimension.Height / 2;

    /**
     * Case when the aabb rectangle inscribed in the rotated rectangle.
     * Convert the rotated rectangle to aabb by rotating the points of both rectangles by a negative angle.
     */
    {
      const [lb, rb, rt, lt] = Point.AabbRectangleVertices(aabbRectangle).map(
        v => Point.RotateAroundPoint(v, rect.Center, -rect.Angle)
      );

      const aabbNonRotated: AABBRectangle = {
        X: rect.Center.X - rectHalfWidth,
        Y: rect.Center.Y - rectHalfHeight,
        Width: rect.Dimension.Width,
        Height: rect.Dimension.Height
      };

      // TODO Rethink this. We can return true if any of this point inscribed
      if (
        Intersection.AABBRectanglePoint(aabbNonRotated, lb) &&
        Intersection.AABBRectanglePoint(aabbNonRotated, rb) &&
        Intersection.AABBRectanglePoint(aabbNonRotated, rt) &&
        Intersection.AABBRectanglePoint(aabbNonRotated, lt)
      ) {
        return true;
      }
    }

    // Case when the rotated rectangle inscribed in the aabb rectangle or it edges crosses the aabb rectangle edges
    {
      const [lb, rb, rt, lt] = Point.RectangleVertices(rect);

      return (
        Intersection.AABBRectangleLine(aabbRectangle, { A: lb, B: rb }) ||
        Intersection.AABBRectangleLine(aabbRectangle, { A: rb, B: rt }) ||
        Intersection.AABBRectangleLine(aabbRectangle, { A: rt, B: lt }) ||
        Intersection.AABBRectangleLine(aabbRectangle, { A: lt, B: lb })
      );
    }
  }

  public static LinePoint(line: Line, point: Vec2): boolean {
    const aToPointDistance = Point.Distance(line.A, point);
    const bToPointDistance = Point.Distance(line.B, point);
    const lineLength = Point.Distance(line.A, line.B);

    // TODO Tune epsilon
    return Math.abs(aToPointDistance + bToPointDistance - lineLength) <= 0.01;
  }

  public static CirclePoint(circle: Circle, point: Vec2): boolean {
    return Point.Distance(circle.Center, point) <= circle.Radius;
  }

  public static LineCircle(line: Line, circle: Circle): boolean {
    if (Intersection.CirclePoint(circle, line.A)) {
      return true;
    }

    if (Intersection.CirclePoint(circle, line.B)) {
      return true;
    }

    const lineLength = Point.Distance(line.A, line.B);

    const dot =
      Vector2.DotProduct(
        Vector2.Subtract(circle.Center, line.A),
        Vector2.Subtract(line.B, line.A)
      ) /
      lineLength ** 2;

    const closest = Vector2.Add(
      Vector2.Multiply(Vector2.Subtract(line.B, line.A), dot),
      line.A
    );

    if (!Intersection.LinePoint(line, closest)) {
      return false;
    }

    return Point.Distance(closest, circle.Center) <= circle.Radius;
  }

  public static CircleCircle(c0: Circle, c1: Circle): boolean {
    // TODO Implementation without sqrt: square sum <= (r1 + r2) ^ 2
    return Point.Distance(c0.Center, c1.Center) <= c0.Radius + c1.Radius;
  }
}
