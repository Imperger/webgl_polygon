import { Vec2 } from '../misc/Primitives';

export class Point {
  public static Distance(p0: Vec2, p1: Vec2): number {
    return Math.sqrt(Math.pow(p0.X - p1.X, 2) + Math.pow(p0.Y - p1.Y, 2));
  }
}
