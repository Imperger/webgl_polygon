import { Point } from '../math/Point';
import { AABBRectangle, Rectangle, Rgb, Rgba } from '../misc/Primitives';

export class PrimitiveBuilder {
  // TODO Use AABBRectangle interface in params
  public static AABBColorRectangle(
    rect: AABBRectangle,
    color: Rgb | Rgba
  ): number[] {
    const leftBottom = [rect.X, rect.Y, ...color];
    const leftTop = [rect.X, rect.Y + rect.Height, ...color];
    const rightTop = [rect.X + rect.Width, rect.Y + rect.Height, ...color];
    const rightBottom = [rect.X + rect.Width, rect.Y, ...color];

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
