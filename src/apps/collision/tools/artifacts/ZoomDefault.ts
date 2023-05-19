import { App } from '../../App';

import { MathUtil } from '@/lib/math/MathUtil';

export class ZoomDefault {
  private readonly min = 0.5;
  private readonly max = 10;

  constructor(private readonly app: App) {}

  public Relative(value: number): void {
    const dir = -value / Math.abs(value);
    const zoom = this.app.Camera.Zoom;
    const step = dir * (dir > 0 ? 0.1 : 0.2);

    this.app.Camera = { Zoom: MathUtil.Clamp(zoom + step, this.min, this.max) };
  }

  public Absolute(value: number): void {
    this.app.Camera = { Zoom: MathUtil.Clamp(value, this.min, this.max) };
  }
}
