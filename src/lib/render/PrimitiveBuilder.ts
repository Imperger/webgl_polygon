import { Point } from '../math/Point';
import { Dimension, Rectangle, Rgb, Rgba, Vec2 } from '../misc/Primitives';

export class PrimitiveBuilder {
  // TODO Use AABBRectangle interface in params
  public static AABBColorRectangle(
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

  public static ColorRectangle(rect: Rectangle, color: Rgb | Rgba): number[] {
    const [lb, rb, rt, lt] = Point.RectangleVertices(rect);

    return [
      lb.X,
      lb.Y,
      ...color,
      rt.X,
      rt.Y,
      ...color,
      lt.X,
      lt.Y,
      ...color,
      lb.X,
      lb.Y,
      ...color,
      rb.X,
      rb.Y,
      ...color,
      rt.X,
      rt.Y,
      ...color
    ];
  }
}
