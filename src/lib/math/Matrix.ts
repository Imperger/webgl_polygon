export class Dimension {
  constructor(public readonly Rows: number, public readonly Columns: number) {}

  IsSquare(): boolean {
    return this.Rows === this.Columns;
  }
}

interface ArrayLike {
  [index: number]: number;
  length: number;
  set(array: ArrayLike, targetOffset?: number): void;
}

interface ArrayConstructor {
  new (...args: unknown[]): ArrayLike;
}

export function MatrixMxN<TTypedArrayConstructor extends ArrayConstructor>(
  TypedArray: TTypedArrayConstructor
) {
  return class Matrix {
    protected m: ArrayLike;

    constructor(protected dimension: Dimension) {
      this.m = new TypedArray(dimension.Rows * dimension.Columns);
    }

    get Rows(): number {
      return this.dimension.Rows;
    }

    get Columns(): number {
      return this.dimension.Columns;
    }

    get ElementCount(): number {
      return this.m.length;
    }

    Mmul(m: Matrix): Matrix {
      if (!this.IsMulCompatible(m)) {
        throw new Error('Incompatible matrices');
      }

      const mul = new Matrix(new Dimension(this.Rows, m.Columns));

      const bCol = new TypedArray(this.Columns);
      for (let colR = 0; colR < m.Columns; ++colR) {
        for (let colL = 0; colL < this.Columns; ++colL) {
          bCol[colL] = m.Get(colL, colR);
        }

        for (let rowL = 0; rowL < this.Rows; ++rowL) {
          let sum = 0;

          for (let colL = 0; colL < this.Columns; ++colL) {
            sum += this.Get(rowL, colL) * bCol[colL];
          }

          mul.Set(rowL, colR, sum);
        }
      }

      return mul;
    }

    Get(row: number, column: number): number {
      return this.m[this.IndexAt(row, column)];
    }

    Set(row: number, column: number, value: number): void {
      this.m[this.IndexAt(row, column)] = value;
    }

    Clone(): Matrix {
      const copy = new Matrix(this.dimension);

      copy.m.set(this.m);

      return copy;
    }

    private IndexAt(row: number, column: number): number {
      return row * this.Columns + column;
    }

    private IsMulCompatible(m: Matrix): boolean {
      return this.Columns === m.Rows;
    }

    static Identity(dimension: Dimension): Matrix {
      if (!dimension.IsSquare()) {
        throw new Error('Identity matrix should be NxN');
      }

      const identity = new Matrix(dimension);

      for (let n = 0; n < identity.ElementCount; n += identity.Columns + 1) {
        identity.m[n] = 1;
      }

      return identity;
    }

    static Data(mat: Matrix): ArrayLike {
      return mat.m;
    }
  };
}
