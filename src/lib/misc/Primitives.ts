export interface Vec2 {
  X: number;
  Y: number;
}

export interface Vec3 extends Vec2 {
  Z: number;
}

export interface Color {
  R: number;
  G: number;
  B: number;
}

export interface Dimension {
  Width: number;
  Height: number;
}
