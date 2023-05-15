import { Dimension, Rgb, Rgba, Vec2 } from '../misc/Primitives';

export class PrimitiveBuilder {
  public static ColorRectangle(
    p0: Vec2,
    dimension: Dimension,
    color: Rgb | Rgba
  ): number[] {
    const leftBottom = [p0.X, p0.Y, ...color];
    const leftTop = [p0.X, p0.Y + dimension.Height, ...color];
    const rightTop = [
      p0.X + dimension.Width,
      p0.Y + dimension.Height,
      ...color
    ];
    const rightBottom = [p0.X + dimension.Width, p0.Y, ...color];

    return [
      ...leftBottom,
      ...rightTop,
      ...leftTop,
      ...leftBottom,
      ...rightBottom,
      ...rightTop
    ];
  }
}
