import { Vec2 } from '../misc/Primitives';

export class Vector2 {
  public static Subtract(a: Vec2, b: Vec2): Vec2 {
    return { X: a.X - b.X, Y: a.Y - b.Y };
  }

  public static CrossProduct(a: Vec2, b: Vec2): number {
    return a.X * b.Y - a.Y * b.X;
  }
}
