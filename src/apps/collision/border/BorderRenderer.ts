import FBorder from './border.frag';
import VBorder from './border.vert';

import { NotNull } from '@/lib/misc/NotNull';
import { Dimension, Rgb } from '@/lib/misc/Primitives';
import { PrimitiveBuilder } from '@/lib/render/PrimitiveBuilder';
import { RVec2, RVec3 } from '@/lib/render/Primitives';
import { ShaderProgram } from '@/lib/render/ShaderProgram';

export class BorderRenderer {
  private vbo!: WebGLBuffer;
  private vao!: WebGLVertexArrayObject;
  private shader!: ShaderProgram;
  private attributes!: Float32Array;

  private viewDimension: RVec2 = [800, 600];
  private camera: RVec3 = [0, 0, 1];

  private readonly borderColorConfig = {
    default: [0.5, 0.5, 0.5] as Rgb
  };
  constructor(
    private gl: WebGL2RenderingContext,
    private fieldDimension: Dimension
  ) {
    this.SetupBorder();

    this.ResizeView(fieldDimension);
  }

  public ResizeView(size: Dimension): void {
    this.viewDimension = [size.Width, size.Height];

    this.shader.SetUniform2fv('u_resolution', this.viewDimension);
  }

  public Dimension(size: Dimension): void {
    this.fieldDimension = { ...size };

    this.BuildBorder();

    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.attributes,
      this.gl.DYNAMIC_DRAW
    );
  }

  public Camera(camera: RVec3): void {
    this.camera = [...camera];

    this.shader.SetUniform3fv('u_cam', this.camera);
  }

  public Draw(): void {
    this.shader.Use();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.attributes,
      this.gl.DYNAMIC_DRAW
    );
    this.gl.bindVertexArray(this.vao);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.attributes.length / 5);
  }

  private SetupBorder(): void {
    this.vbo = this.gl.createBuffer() ?? NotNull();
    this.vao = this.gl.createVertexArray() ?? NotNull();

    this.shader = new ShaderProgram(this.gl);
    this.shader.Attach(this.gl.FRAGMENT_SHADER, FBorder);
    this.shader.Attach(this.gl.VERTEX_SHADER, VBorder);
    this.shader.Link();
    this.shader.Use();

    this.SetupBorderAttributes();

    this.shader.SetUniform3fv('u_cam', this.camera);
    this.shader.SetUniform2fv('u_resolution', this.viewDimension);
  }

  private SetupBorderAttributes(): void {
    const FloatSize = Float32Array.BYTES_PER_ELEMENT;
    const ComponentsCount = 5;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.BuildBorder();
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.attributes,
      this.gl.DYNAMIC_DRAW
    );

    this.gl.bindVertexArray(this.vao);

    const posLoc = this.shader.GetAttributeLocation('a_vertex');
    this.gl.enableVertexAttribArray(posLoc);
    this.gl.vertexAttribPointer(
      posLoc,
      2,
      this.gl.FLOAT,
      false,
      FloatSize * ComponentsCount,
      0
    );

    const colorLoc = this.shader.GetAttributeLocation('a_color');
    this.gl.enableVertexAttribArray(colorLoc);
    this.gl.vertexAttribPointer(
      colorLoc,
      3,
      this.gl.FLOAT,
      false,
      FloatSize * ComponentsCount,
      FloatSize * 2
    );

    this.gl.bindVertexArray(null);
  }

  private BuildBorder(): void {
    const BorderWidth = 2;
    // Left, Top, Right, Bottom
    this.attributes = new Float32Array([
      ...PrimitiveBuilder.AABBColorRectangle(
        { X: -BorderWidth, Y: 0 },
        { Width: BorderWidth, Height: this.fieldDimension.Height },
        this.borderColorConfig.default
      ),
      ...PrimitiveBuilder.AABBColorRectangle(
        { X: -BorderWidth, Y: this.fieldDimension.Height },
        {
          Width: this.fieldDimension.Width + 2 * BorderWidth,
          Height: BorderWidth
        },
        this.borderColorConfig.default
      ),
      ...PrimitiveBuilder.AABBColorRectangle(
        { X: this.fieldDimension.Width, Y: 0 },
        { Width: BorderWidth, Height: this.fieldDimension.Height },
        this.borderColorConfig.default
      ),
      ...PrimitiveBuilder.AABBColorRectangle(
        { X: -BorderWidth, Y: -BorderWidth },
        {
          Width: this.fieldDimension.Width + 2 * BorderWidth,
          Height: BorderWidth
        },
        this.borderColorConfig.default
      )
    ]);
  }
}
