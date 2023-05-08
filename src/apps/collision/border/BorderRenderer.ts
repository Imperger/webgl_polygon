import FBorder from './border.frag';
import VBorder from './border.vert';

import { NotNull } from '@/lib/misc/NotNull';
import { Dimension } from '@/lib/misc/Primitives';
import { PrimitiveBuilder } from '@/lib/render/PrimitiveBuilder';
import { RVec2, RVec3 } from '@/lib/render/Primitives';
import { ShaderProgram } from '@/lib/render/ShaderProgram';

export class BorderRenderer {
  private borderVbo!: WebGLBuffer;
  private borderVao!: WebGLVertexArrayObject;
  private borderShader!: ShaderProgram;
  private borderAttributes!: Float32Array;

  private viewDimension: RVec2 = [800, 600];
  private camera: RVec3 = [0, 0, 1];

  private readonly borderColorConfig = {
    default: { R: 0.5, G: 0.5, B: 0.5 }
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

    this.borderShader.SetUniform2fv('u_resolution', this.viewDimension);
  }

  public Dimension(size: Dimension): void {
    this.fieldDimension = { ...size };

    this.BuildBorder();

    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.borderAttributes,
      this.gl.DYNAMIC_DRAW
    );
  }

  public Camera(camera: RVec3): void {
    this.camera = [...camera];

    this.borderShader.SetUniform3fv('u_cam', this.camera);
  }

  public Draw(): void {
    this.borderShader.Use();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.borderVbo);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.borderAttributes,
      this.gl.DYNAMIC_DRAW
    );
    this.gl.bindVertexArray(this.borderVao);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.borderAttributes.length / 5);
  }

  private SetupBorder(): void {
    this.borderVbo = this.gl.createBuffer() ?? NotNull();
    this.borderVao = this.gl.createVertexArray() ?? NotNull();

    this.borderShader = new ShaderProgram(this.gl);
    this.borderShader.Attach(this.gl.FRAGMENT_SHADER, FBorder);
    this.borderShader.Attach(this.gl.VERTEX_SHADER, VBorder);
    this.borderShader.Link();
    this.borderShader.Use();

    this.SetupBorderAttributes();

    this.borderShader.SetUniform3fv('u_cam', this.camera);
    this.borderShader.SetUniform2fv('u_resolution', this.viewDimension);
  }

  private SetupBorderAttributes(): void {
    const FloatSize = Float32Array.BYTES_PER_ELEMENT;
    const ComponentsCount = 5;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.borderVbo);
    this.BuildBorder();
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.borderAttributes,
      this.gl.DYNAMIC_DRAW
    );

    this.gl.bindVertexArray(this.borderVao);

    const posLoc = this.borderShader.GetAttributeLocation('a_vertex');
    this.gl.enableVertexAttribArray(posLoc);
    this.gl.vertexAttribPointer(
      posLoc,
      2,
      this.gl.FLOAT,
      false,
      FloatSize * ComponentsCount,
      0
    );

    const colorLoc = this.borderShader.GetAttributeLocation('a_color');
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
    this.borderAttributes = new Float32Array([
      ...PrimitiveBuilder.ColorRectangle(
        { X: -BorderWidth, Y: 0 },
        { Width: BorderWidth, Height: this.fieldDimension.Height },
        this.borderColorConfig.default
      ),
      ...PrimitiveBuilder.ColorRectangle(
        { X: -BorderWidth, Y: this.fieldDimension.Height },
        {
          Width: this.fieldDimension.Width + 2 * BorderWidth,
          Height: BorderWidth
        },
        this.borderColorConfig.default
      ),
      ...PrimitiveBuilder.ColorRectangle(
        { X: this.fieldDimension.Width, Y: 0 },
        { Width: BorderWidth, Height: this.fieldDimension.Height },
        this.borderColorConfig.default
      ),
      ...PrimitiveBuilder.ColorRectangle(
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
