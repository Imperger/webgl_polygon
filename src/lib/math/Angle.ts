import { Vec2 } from '../misc/Primitives';

export class Angle {
  public static ToRadians(degree: number): number {
    return (degree / 180) * Math.PI;
  }

  public static Vec0Pi(a0: Vec2, a1: Vec2, b0: Vec2, b1: Vec2): number {
    const a: Vec2 = { X: a1.X - a0.X, Y: a1.Y - a0.Y };
    const b: Vec2 = { X: b1.X - b0.X, Y: b1.Y - b0.Y };

    const dotProduct: number = a.X * b.X + a.Y * b.Y;

    const aMagnitude: number = Math.sqrt(a.X * a.X + a.Y * a.Y);
    const bMagnitude: number = Math.sqrt(b.X * b.X + b.Y * b.Y);

    return Math.acos(dotProduct / (aMagnitude * bMagnitude));
  }
}
