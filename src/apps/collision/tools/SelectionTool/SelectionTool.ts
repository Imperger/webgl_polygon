import { App } from '../../App';
import { AppEvent } from '../../Events';
import { ZoomDefault } from '../artifacts/ZoomDefault';
import { AvailableInteractionTool, InteractionTool } from '../InteractionTool';

import FSelectionRectangle from './SelectionRectangle.frag';
import VSelectionRectangle from './SelectionRectangle.vert';

import { Point } from '@/lib/math/Point';
import { EnumSize } from '@/lib/misc/EnumSize';
import { Unsubscription } from '@/lib/misc/EventBus';
import {
  Dimension,
  AABBRectangle,
  Rgba,
  RgbaComponent,
  Vec2
} from '@/lib/misc/Primitives';
import { Camera2Component } from '@/lib/render/Camera';
import { PrimitiveBuilder } from '@/lib/render/PrimitiveBuilder';
import { RVec2, RVec2Component, RVec3 } from '@/lib/render/Primitives';
import { PrimitivesRenderer } from '@/lib/render/PrimitivesRenderer';
import { TypeSizeResolver } from '@/lib/render/TypeSizeResolver';

export class SelectionTool
  extends PrimitivesRenderer
  implements InteractionTool
{
  public static readonly ComponentsPerIndex =
    EnumSize(RVec2Component) + EnumSize(RgbaComponent);

  private baseDraw = () => {};

  private viewDimension: RVec2 = [800, 600];
  private camera: RVec3 = [0, 0, 1];

  private selectionStart!: Vec2;
  private selectionRect: AABBRectangle | null = null;

  private zoom: ZoomDefault;

  private eventBusUnsubs!: Unsubscription[];

  constructor(gl: WebGL2RenderingContext, private readonly app: App) {
    const floatSize = TypeSizeResolver.Resolve(gl.FLOAT);
    const stride = floatSize * SelectionTool.ComponentsPerIndex;

    super(
      gl,
      { vertex: VSelectionRectangle, fragment: FSelectionRectangle },
      [
        {
          name: 'a_vertex',
          size: 2,
          type: gl.FLOAT,
          normalized: false,
          stride,
          offset: 0
        },
        {
          name: 'a_color',
          size: 4,
          type: gl.FLOAT,
          normalized: false,
          stride,
          offset: 2 * floatSize
        }
      ],
      { indicesPerPrimitive: 6, basePrimitiveType: gl.TRIANGLES }
    );

    this.zoom = new ZoomDefault(this.app);

    this.SetupListeners();

    this.ResizeView(this.app.ViewDimension);

    const cam = this.app.Camera;
    this.Camera([cam.X, cam.Y, cam.Zoom]);
  }

  public get Type(): AvailableInteractionTool {
    return AvailableInteractionTool.Selection;
  }

  public ResizeView(size: Dimension): void {
    this.viewDimension = [size.Width, size.Height];

    this.shader.SetUniform2fv('u_resolution', this.viewDimension);
  }

  public Camera(camera: RVec3): void {
    this.camera = [...camera];

    this.shader.SetUniform3fv('u_cam', this.camera);
  }

  OnMouseDown(e: MouseEvent): void {
    this.selectionStart = this.app.ScreenToWorld(e.offsetX, e.offsetY);
  }

  OnMouseUp(_e: MouseEvent): void {
    if (this.selectionRect !== null) {
      this.app.SelectBodies(this.selectionRect);
    }
  }

  OnKeyDown(_e: KeyboardEvent): void {
    // Nothing to do
  }

  OnMouseMove(e: MouseEvent): void {
    const selectionEnd = this.app.ScreenToWorld(e.offsetX, e.offsetY);

    const rect = Point.Extremum2([this.selectionStart, selectionEnd]);

    this.selectionRect = {
      X: rect.min.X,
      Y: rect.min.Y,
      Width: rect.max.X - rect.min.X,
      Height: rect.max.Y - rect.min.Y
    };

    const innerRegion = PrimitiveBuilder.AABBColorRectangle(
      rect.min,
      { Width: this.selectionRect.Width, Height: this.selectionRect.Height },
      [0.3764705882352941, 0.49019607843137253, 0.5450980392156862, 0.65]
    );

    const borderWidth = 1 / this.camera[Camera2Component.Zoom];
    const borderColor: Rgba = [0.47, 0.56, 0.61, 1];
    const borderTop = PrimitiveBuilder.AABBColorRectangle(
      { X: rect.min.X - borderWidth, Y: rect.max.Y },
      {
        Width: this.selectionRect.Width + 2 * borderWidth,
        Height: borderWidth
      },
      borderColor
    );

    const borderRight = PrimitiveBuilder.AABBColorRectangle(
      { X: rect.max.X, Y: rect.min.Y },
      { Width: borderWidth, Height: this.selectionRect.Height },
      borderColor
    );

    const borderBottom = PrimitiveBuilder.AABBColorRectangle(
      { X: rect.min.X - borderWidth, Y: rect.min.Y - borderWidth },
      {
        Width: this.selectionRect.Width + 2 * borderWidth,
        Height: borderWidth
      },
      borderColor
    );

    const borderLeft = PrimitiveBuilder.AABBColorRectangle(
      { X: rect.min.X - borderWidth, Y: rect.min.Y },
      { Width: borderWidth, Height: this.selectionRect.Height },
      borderColor
    );

    this.UploadAttributes([
      ...innerRegion,
      ...borderTop,
      ...borderRight,
      ...borderBottom,
      ...borderLeft
    ]);

    this.baseDraw = super.Draw;
  }

  OnWheel(e: WheelEvent): void {
    this.zoom.Relative(e.deltaY);
  }

  public OnTouchMove(_e: TouchEvent): void {}

  public OnTouchStart(_e: TouchEvent): void {}

  public OnTouchEnd(_e: TouchEvent): void {}

  Draw(): void {
    this.baseDraw();
  }

  private SetupListeners(): void {
    const resizeUnsub = App.EventBus.Subscribe(AppEvent.ResizeView, dim =>
      this.ResizeView(dim)
    );
    const camMoveUnsub = App.EventBus.Subscribe(AppEvent.CameraMove, cam =>
      this.Camera([cam.X, cam.Y, cam.Zoom])
    );

    this.eventBusUnsubs = [resizeUnsub, camMoveUnsub];
  }

  public Dispose(): void {
    this.eventBusUnsubs.forEach(unsub => unsub());
  }
}
