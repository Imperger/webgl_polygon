import { Dimension, MatrixMxN } from './Matrix';

import { RMat3, RVec3 } from '@/lib/render/Primitives';

type Matrix = InstanceType<ReturnType<typeof MatrixMxN<typeof Float32Array>>>;

type Mat3 = [RVec3, RVec3, RVec3];

export class Matrix3 extends MatrixMxN(Float32Array) {
  constructor(mat?: Mat3) {
    super(new Dimension(3, 3));

    if (mat) {
      this.Assign(mat);
    }
  }

  Mmul(m: Matrix3): Matrix3 {
    return Matrix3.MoveData(super.Mmul(m));
  }

  Translate(tx: number, ty: number): Matrix3 {
    return this.Mmul(Matrix3.Translation(tx, ty));
  }

  Scale(sx: number, sy: number): Matrix3 {
    return this.Mmul(Matrix3.Scaling(sx, sy));
  }

  private Assign(mat: RMat3): void {
    for (let row = 0; row < this.Rows; ++row) {
      for (let col = 0; col < this.Columns; ++col) {
        this.m[row * this.Columns + col] = mat[row][col];
      }
    }
  }

  static Identity(): Matrix3 {
    return Matrix3.MoveData(super.Identity(new Dimension(3, 3)));
  }

  static Translation(tx: number, ty: number): Matrix3 {
    return new Matrix3([
      [1, 0, 0],
      [0, 1, 0],
      [tx, ty, 1]
    ]);
  }

  static Scaling(sx: number, sy: number): Matrix3 {
    return new Matrix3([
      [sx, 0, 0],
      [0, sy, 0],
      [0, 0, 1]
    ]);
  }

  static Projection(width: number, height: number): Matrix3 {
    return new Matrix3([
      [2 / width, 0, 0],
      [0, -2 / height, 0],
      [-1, 1, 1]
    ]);
  }

  private static MoveData(matrix: Matrix): Matrix3 {
    const mat = new Matrix3();

    mat.m = super.Data(matrix);

    return mat;
  }
}
