import { XY } from '../collision_engines/CollisionEngine';

import { App } from './../App';
import { ZoomDefault } from './artifacts/ZoomDefault';
import { MouseTool } from './MouseTool';

import { MouseButton, MouseButtons } from '@/lib/misc/Dom';

export class PanTool implements MouseTool {
  private lmbDownPosition!: XY;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly app: App
  ) {}

  OnMouseDown(e: MouseEvent): void {
    this.lmbDownPosition = new XY(e.offsetX, e.offsetY);
  }

  OnMouseUp(e: MouseEvent): void {
    if (e.button === MouseButton.Left) {
      if (this.lmbDownPosition.Distance(new XY(e.offsetX, e.offsetY)) < 2) {
        this.app.SelectBody(e.offsetX, e.offsetY);
      }
    }
  }

  OnKeyDown(e: KeyboardEvent): void {
    switch (e.code) {
      case 'Space':
        this.app.Pause = !this.app.Pause;
        break;
    }
  }

  OnMouseMove(e: MouseEvent): void {
    if (e.buttons & MouseButtons.Left) {
      const zoom = this.app.Camera.Zoom;

      this.app.Camera = {
        X: this.app.Camera.X + e.movementX / zoom,
        Y: this.app.Camera.Y + e.movementY / zoom
      };
    }
  }

  OnWheel(e: WheelEvent): void {
    ZoomDefault(this.app, e);
  }

  Draw(_elapsed: number): void {
    // Nothing to draw
  }

  Dispose(): void {
    // Nothing to dispose
  }
}
