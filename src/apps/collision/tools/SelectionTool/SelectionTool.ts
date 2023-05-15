import { App } from '../../App';
import { AppEvent } from '../../Events';
import { ZoomDefault } from '../artifacts/ZoomDefault';
import { MouseTool } from '../MouseTool';

import FSelectionRectangle from './SelectionRectangle.frag';
import VSelectionRectangle from './SelectionRectangle.vert';

import { Point } from '@/lib/math/Point';
import { EnumSize } from '@/lib/misc/EnumSize';
import { Unsubscription } from '@/lib/misc/EventBus';
import { NotNull } from '@/lib/misc/NotNull';
import {
  Dimension,
  Rectangle,
  Rgba,
  RgbaComponent,
  Vec2
} from '@/lib/misc/Primitives';
import { Camera2Component } from '@/lib/render/Camera';
import { PrimitiveBuilder } from '@/lib/render/PrimitiveBuilder';
import { RVec2, RVec2Component, RVec3 } from '@/lib/render/Primitives';
import { ShaderProgram } from '@/lib/render/ShaderProgram';

export class SelectionTool implements MouseTool {
  private vbo!: WebGLBuffer;
  private vao!: WebGLVertexArrayObject;
  private shader!: ShaderProgram;
  private attributes: Float32Array | null = null;

  private viewDimension: RVec2 = [800, 600];
  private camera: RVec3 = [0, 0, 1];

  private selectionStart!: Vec2;
  private selectionRect: Rectangle | null = null;

  private readonly ComponentsCount =
    EnumSize(RVec2Component) + EnumSize(RgbaComponent);

  private eventBusUnsubs!: Unsubscription[];

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly app: App
  ) {
    this.SetupListeners();
    this.Setup();

    this.ResizeView(this.app.ViewDimension);

    const cam = this.app.Camera;
    this.Camera([cam.X, cam.Y, cam.Zoom]);
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

    const innerRegion = PrimitiveBuilder.ColorRectangle(
      rect.min,
      { Width: this.selectionRect.Width, Height: this.selectionRect.Height },
      [0.3764705882352941, 0.49019607843137253, 0.5450980392156862, 0.65]
    );

    const borderWidth = 1 / this.camera[Camera2Component.Zoom];
    const borderColor: Rgba = [0.47, 0.56, 0.61, 1];
    const borderTop = PrimitiveBuilder.ColorRectangle(
      { X: rect.min.X - borderWidth, Y: rect.max.Y },
      {
        Width: this.selectionRect.Width + 2 * borderWidth,
        Height: borderWidth
      },
      borderColor
    );

    const borderRight = PrimitiveBuilder.ColorRectangle(
      { X: rect.max.X, Y: rect.min.Y },
      { Width: borderWidth, Height: this.selectionRect.Height },
      borderColor
    );

    const borderBottom = PrimitiveBuilder.ColorRectangle(
      { X: rect.min.X - borderWidth, Y: rect.min.Y - borderWidth },
      {
        Width: this.selectionRect.Width + 2 * borderWidth,
        Height: borderWidth
      },
      borderColor
    );

    const borderLeft = PrimitiveBuilder.ColorRectangle(
      { X: rect.min.X - borderWidth, Y: rect.min.Y },
      { Width: borderWidth, Height: this.selectionRect.Height },
      borderColor
    );

    this.attributes = new Float32Array([
      ...innerRegion,
      ...borderTop,
      ...borderRight,
      ...borderBottom,
      ...borderLeft
    ]);
  }

  OnWheel(e: WheelEvent): void {
    ZoomDefault(this.app, e);
  }

  Draw(_elapsed: number): void {
    if (this.attributes === null) {
      return;
    }

    this.shader.Use();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.attributes,
      this.gl.DYNAMIC_DRAW
    );
    this.gl.bindVertexArray(this.vao);
    this.gl.drawArrays(
      this.gl.TRIANGLES,
      0,
      this.attributes.length / this.ComponentsCount
    );
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

  private Setup(): void {
    this.vbo = this.gl.createBuffer() ?? NotNull();
    this.vao = this.gl.createVertexArray() ?? NotNull();

    this.shader = new ShaderProgram(this.gl);
    this.shader.Attach(this.gl.FRAGMENT_SHADER, FSelectionRectangle);
    this.shader.Attach(this.gl.VERTEX_SHADER, VSelectionRectangle);
    this.shader.Link();
    this.shader.Use();

    this.SetupAttributes();

    this.shader.SetUniform3fv('u_cam', this.camera);
    this.shader.SetUniform2fv('u_resolution', this.viewDimension);
  }

  private SetupAttributes(): void {
    const ComponentSize = Float32Array.BYTES_PER_ELEMENT;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);

    this.gl.bindVertexArray(this.vao);

    const posLoc = this.shader.GetAttributeLocation('a_vertex');
    this.gl.enableVertexAttribArray(posLoc);
    this.gl.vertexAttribPointer(
      posLoc,
      EnumSize(RVec2Component),
      this.gl.FLOAT,
      false,
      ComponentSize * this.ComponentsCount,
      0
    );

    const colorLoc = this.shader.GetAttributeLocation('a_color');
    this.gl.enableVertexAttribArray(colorLoc);
    this.gl.vertexAttribPointer(
      colorLoc,
      EnumSize(RgbaComponent),
      this.gl.FLOAT,
      false,
      ComponentSize * this.ComponentsCount,
      ComponentSize * EnumSize(RVec2Component)
    );

    this.gl.bindVertexArray(null);
  }
}
