export class Algorithm {
  public static IsEqualValues<T>(...values: T[]): boolean {
    for (let n = 1; n < values.length; ++n) {
      if (values[0] !== values[n]) {
        return false;
      }
    }

    return true;
  }
}
