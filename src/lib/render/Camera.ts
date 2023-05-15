export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export class Camera {
  protected position: Vec3 = { x: 0, y: 0, z: 0 };
  protected target: Vec3 = { x: 0, y: 0, z: 0 };
}

export interface Camera2 {
  X: number;
  Y: number;
  Zoom: number;
}

export enum Camera2Component {
  X = 0,
  Y,
  Zoom
}
