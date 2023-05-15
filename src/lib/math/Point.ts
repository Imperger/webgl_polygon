import { Vec2 } from '../misc/Primitives';

interface ExtremumResult<TPoint> {
  min: TPoint;
  max: TPoint;
}

export class Point {
  public static Distance(p0: Vec2, p1: Vec2): number {
    return Math.sqrt(Math.pow(p0.X - p1.X, 2) + Math.pow(p0.Y - p1.Y, 2));
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
}
