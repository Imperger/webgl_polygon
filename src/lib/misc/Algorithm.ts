export class Algorithm {
  public static IsEqualValues<T>(...values: T[]): boolean {
    for (let n = 1; n < values.length; ++n) {
      if (values[0] !== values[n]) {
        return false;
      }
    }

    return true;
  }

  public static MaxElement<T>(
    iterable: Iterable<T>,
    comp: (a: T, b: T) => boolean = (a, b) => a < b
  ): T | null {
    let max: T | null = null;

    for (const value of iterable) {
      if (max === null) {
        max = value;
      } else if (comp(max, value)) {
        max = value;
      }
    }

    return max;
  }

  public static MinElement<T>(
    iterable: Iterable<T>,
    comp: (a: T, b: T) => boolean = (a, b) => a < b
  ): T | null {
    return Algorithm.MaxElement(iterable, (a, b) => comp(b, a));
  }
}
