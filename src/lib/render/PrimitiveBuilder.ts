import { Color, Dimension, Vec2 } from '../misc/Primitives';

export class PrimitiveBuilder {
  public static ColorRectangle(
    p0: Vec2,
    dimension: Dimension,
    color: Color
  ): number[] {
    const leftBottom = [p0.X, p0.Y, color.R, color.G, color.B];
    const leftTop = [p0.X, p0.Y + dimension.Height, color.R, color.G, color.B];
    const rightTop = [
      p0.X + dimension.Width,
      p0.Y + dimension.Height,
      color.R,
      color.G,
      color.B
    ];
    const rightBottom = [
      p0.X + dimension.Width,
      p0.Y,
      color.R,
      color.G,
      color.B
    ];

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
