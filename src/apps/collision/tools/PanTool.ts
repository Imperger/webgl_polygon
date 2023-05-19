import { XY } from '../collision_engines/CollisionEngine';

import { App } from './../App';
import { ZoomDefault } from './artifacts/ZoomDefault';
import { AvailableInteractionTool, InteractionTool } from './InteractionTool';

import {
  TouchDoubleTap,
  TouchDoubleTapEventBus
} from '@/lib/Dom/TouchDoubleTap';
import { TouchPan, TouchPanEvent } from '@/lib/Dom/TouchPan';
import {
  TouchZoom,
  TouchZoomEvent,
  TouchZoomEventBus
} from '@/lib/Dom/TouchZoom';
import { MouseButton, MouseButtons } from '@/lib/misc/Dom';
import { Unsubscription } from '@/lib/misc/EventBus';

export class PanTool implements InteractionTool {
  private lmbDownPosition!: XY;

  private zoom: ZoomDefault;

  private touchMovement = new TouchPan();
  private touchZoom = new TouchZoom();
  private touchDoubleTap = new TouchDoubleTap();
  private unsubs: Unsubscription[] = [];

  private initialZoom = 0;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly app: App
  ) {
    this.zoom = new ZoomDefault(this.app);
    this.unsubs.push(
      this.touchMovement.Subscribe(e => this.TouchMovement(e))
    );

    this.touchZoom.Observer.Subscribe(
      TouchZoomEventBus.ZoomStart,
      () => (this.initialZoom = this.app.Camera.Zoom)
    );
    this.unsubs.push(
      this.touchZoom.Observer.Subscribe(TouchZoomEventBus.Zoom, e =>
        this.TouchZoom(e)
      )
    );

    this.unsubs.push(
      this.touchDoubleTap.Observer.Subscribe(
        TouchDoubleTapEventBus.DoubleTap,
        e => this.TouchDoubleTap(e)
      )
    );
  }

  public get Type(): AvailableInteractionTool {
    return AvailableInteractionTool.Pan;
  }

  public OnMouseDown(e: MouseEvent): void {
    this.lmbDownPosition = new XY(e.offsetX, e.offsetY);
  }

  public OnMouseUp(e: MouseEvent): void {
    if (e.button === MouseButton.Left) {
      if (this.lmbDownPosition.Distance(new XY(e.offsetX, e.offsetY)) < 2) {
        this.app.SelectBody(e.offsetX, e.offsetY);
      }
    }
  }

  public OnKeyDown(e: KeyboardEvent): void {
    switch (e.code) {
      case 'Space':
        this.app.Pause = !this.app.Pause;
        break;
    }
  }

  public OnMouseMove(e: MouseEvent): void {
    if (e.buttons & MouseButtons.Left) {
      this.MoveCamera(e.movementX, e.movementY);
    }
  }

  public OnWheel(e: WheelEvent): void {
    this.zoom.Relative(e.deltaY);
  }

  public OnTouchMove(e: TouchEvent): void {
    this.touchMovement.OnTouchMove(e);
    this.touchZoom.OnTouchMove(e);
  }

  public OnTouchStart(e: TouchEvent): void {
    this.touchMovement.OnTouchStart(e);
    this.touchZoom.OnTouchStart(e);
    this.touchDoubleTap.OnTouchStart(e);
  }

  public OnTouchEnd(e: TouchEvent): void {
    this.touchZoom.OnTouchEnd(e);
  }

  public Draw(_elapsed: number): void {}

  public Dispose(): void {
    this.unsubs.forEach(unsub => unsub());
  }

  private MoveCamera(dx: number, dy: number) {
    const zoom = this.app.Camera.Zoom;

    this.app.Camera = {
      X: this.app.Camera.X + dx / zoom,
      Y: this.app.Camera.Y + dy / zoom
    };
  }

  private TouchMovement(e: TouchPanEvent): void {
    this.MoveCamera(e.dx, e.dy);
  }

  private TouchZoom(zoom: TouchZoomEvent): void {
    this.zoom.Absolute(this.initialZoom * zoom);
  }

  private TouchDoubleTap(_e: Touch): void {
    this.app.Pause = !this.app.Pause;
  }
}
