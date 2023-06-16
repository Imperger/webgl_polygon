import { AABBRectangle, Line, Rectangle, Vec2 } from '../misc/Primitives';

import { Real } from './Real';
import { Vector2 } from './Vector';

interface ExtremumResult<TPoint> {
  min: TPoint;
  max: TPoint;
}

export type RotatedRectangleVertices = [Vec2, Vec2, Vec2, Vec2];

export class Point {
  public static Distance(p0: Vec2, p1: Vec2): number {
    return Math.sqrt(Point.SqrDistance(p0, p1));
  }

  public static SqrDistance(p0: Vec2, p1: Vec2): number {
    return Math.pow(p0.X - p1.X, 2) + Math.pow(p0.Y - p1.Y, 2);
  }

  public static Extremum2(points: Vec2[]): ExtremumResult<Vec2> {
    const min: Vec2 = {
      X: Number.POSITIVE_INFINITY,
      Y: Number.POSITIVE_INFINITY
    };
    const max: Vec2 = {
      X: Number.NEGATIVE_INFINITY,
      Y: Number.NEGATIVE_INFINITY
    };

    points.forEach(p => {
      if (p.X < min.X) min.X = p.X;
      if (p.X > max.X) max.X = p.X;
      if (p.Y < min.Y) min.Y = p.Y;
      if (p.Y > max.Y) max.Y = p.Y;
    });

    return { min, max };
  }

  /**
   * Counterclockwise rotation around origin
   */
  public static Rotate(p: Vec2, angle: number): Vec2 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    return {
      X: p.X * c - p.Y * s,
      Y: p.X * s + p.Y * c
    };
  }

  /**
   * Counterclockwise rotation around another point
   */
  public static RotateAroundPoint(p: Vec2, origin: Vec2, angle: number): Vec2 {
    const rotated = Point.Rotate(
      { X: p.X - origin.X, Y: p.Y - origin.Y },
      angle
    );

    rotated.X += origin.X;
    rotated.Y += origin.Y;

    return rotated;
  }

  /**
   * Calculate vertices of a rotated rectangle
   * @param rect rectangle
   * @returns Array of vertices: [left bottom, right bottom, right top, left top]
   */
  public static RectangleVertices(rect: Rectangle): RotatedRectangleVertices {
    const rectHalfWidth = rect.Dimension.Width / 2;
    const rectHalfHeight = rect.Dimension.Height / 2;

    return [
      Point.RotateAroundPoint(
        { X: rect.Center.X - rectHalfWidth, Y: rect.Center.Y - rectHalfHeight },
        rect.Center,
        rect.Angle
      ),
      Point.RotateAroundPoint(
        { X: rect.Center.X + rectHalfWidth, Y: rect.Center.Y - rectHalfHeight },
        rect.Center,
        rect.Angle
      ),
      Point.RotateAroundPoint(
        { X: rect.Center.X + rectHalfWidth, Y: rect.Center.Y + rectHalfHeight },
        rect.Center,
        rect.Angle
      ),
      Point.RotateAroundPoint(
        { X: rect.Center.X - rectHalfWidth, Y: rect.Center.Y + rectHalfHeight },
        rect.Center,
        rect.Angle
      )
    ];
  }

  /**
   * Calculate vertices of an AABB rectangle
   * @param rect rectangle
   * @returns Array of vertices: [left bottom, right bottom, right top, left top]
   */
  public static AabbRectangleVertices(
    rect: AABBRectangle
  ): RotatedRectangleVertices {
    return [
      { X: rect.X, Y: rect.Y },
      { X: rect.X + rect.Width, Y: rect.Y },
      { X: rect.X + rect.Width, Y: rect.Y + rect.Width },
      { X: rect.X, Y: rect.Y + rect.Width }
    ];
  }

  public static ClosestLine(point: Vec2, lines: Line[]): Line {
    let closestIdx = -1;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (let n = 0; n < lines.length; ++n) {
      const line = lines[n];

      const distance = Point.Distance(Point.ClosestToLine(point, line), point);

      if (distance < closestDistance) {
        closestIdx = n;
        closestDistance = distance;
      }
    }

    return lines[closestIdx];
  }

  public static ClosestToLine(point: Vec2, line: Line): Vec2 {
    const ab = Vector2.Subtract(line.B, line.A);
    const ap = Vector2.Subtract(point, line.A);

    const proj = Vector2.DotProduct(ap, ab);

    const abSqrLen = Vector2.DotProduct(ab, ab);

    const d = proj / abSqrLen;

    if (d <= 0) {
      return line.A;
    } else if (d >= 1) {
      return line.B;
    } else {
      return Vector2.Add(line.A, Vector2.Multiply(ab, d));
    }
  }

  public static IsEqual(a: Vec2, b: Vec2): boolean {
    return Real.IsEqual(a.X, b.X) && Real.IsEqual(a.Y, b.Y);
  }
}
