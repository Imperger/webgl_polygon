export class Real {
  public static IsEqual(a: number, b: number): boolean {
    return Math.abs(a - b) < Number.EPSILON;
  }
}
