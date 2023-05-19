export class MathUtil {
  public static Clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
  }
}
