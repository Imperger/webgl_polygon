import { Circle, Rectangle } from '../misc/Primitives';

export class Shape {
  public static RectanlgeCircleIntersect(
    rect: Rectangle,
    circle: Circle
  ): boolean {
    const circleDistanceX = Math.abs(
      circle.Center.X - (rect.X + rect.Width / 2)
    );
    const circleDistanceY = Math.abs(
      circle.Center.Y - (rect.Y + rect.Height / 2)
    );

    if (circleDistanceX > rect.Width / 2 + circle.Radius) {
      return false;
    }
    if (circleDistanceY > rect.Height / 2 + circle.Radius) {
      return false;
    }

    if (circleDistanceX <= rect.Width / 2) {
      return true;
    }
    if (circleDistanceY <= rect.Height / 2) {
      return true;
    }

    const cornerDistance_sq =
      (circleDistanceX - rect.Width / 2) ** 2 +
      (circleDistanceY - rect.Height / 2) ** 2;

    return cornerDistance_sq <= circle.Radius ** 2;
  }
}
