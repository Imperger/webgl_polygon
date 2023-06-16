import { Vec2 } from '../misc/Primitives';

import { Point } from './Point';

export class Vector2 {
  public static Add(a: Vec2, b: Vec2): Vec2 {
    return { X: a.X + b.X, Y: a.Y + b.Y };
  }

  public static Subtract(a: Vec2, b: Vec2): Vec2 {
    return { X: a.X - b.X, Y: a.Y - b.Y };
  }

  public static Multiply(vector: Vec2, scalar: number): Vec2 {
    return { X: vector.X * scalar, Y: vector.Y * scalar };
  }

  public static Divide(vector: Vec2, scalar: number): Vec2 {
    return { X: vector.X / scalar, Y: vector.Y / scalar };
  }

  public static CrossProduct(a: Vec2, b: Vec2): number {
    return a.X * b.Y - a.Y * b.X;
  }

  public static DotProduct(a: Vec2, b: Vec2): number {
    return a.X * b.X + a.Y * b.Y;
  }

  public static Normalize(vec: Vec2): Vec2 {
    return Vector2.Divide(vec, Point.Distance({ X: 0, Y: 0 }, vec));
  }

  public static Normal(vec: Vec2): Vec2 {
    return { X: vec.Y, Y: -vec.X };
  }

  public static Reflect(ray: Vec2, surface: Vec2): Vec2 {
    const normalizedSurface = Vector2.Normalize(surface);
    const dot = Vector2.DotProduct(ray, normalizedSurface);
    return Vector2.Subtract(Vector2.Multiply(normalizedSurface, 2 * dot), ray);
  }

  public static Angle(a: Vec2, b: Vec2): number {
    return Math.atan2(a.Y, b.X) - Math.atan2(b.Y, b.X);
  }
}
