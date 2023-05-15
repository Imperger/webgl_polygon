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

export enum RgbComponent {
  R = 0,
  G,
  B
}

export interface Rgb {
  [RgbComponent.R]: number;
  [RgbComponent.G]: number;
  [RgbComponent.B]: number;
  [Symbol.iterator](): IterableIterator<number>;
}

export enum RgbaComponent {
  R = 0,
  G,
  B,
  A
}

export interface Rgba {
  [RgbaComponent.R]: number;
  [RgbaComponent.G]: number;
  [RgbaComponent.B]: number;
  [RgbaComponent.A]: number;
  [Symbol.iterator](): IterableIterator<number>;
}

export interface Dimension {
  Width: number;
  Height: number;
}

export interface Rectangle {
  X: number;
  Y: number;
  Width: number;
  Height: number;
}

export interface Circle {
  Center: Vec2;
  Radius: number;
}
