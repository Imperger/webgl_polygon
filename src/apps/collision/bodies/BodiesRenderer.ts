import { DataDescriptor } from '../models/DataDescriptor';

import FBodies from './bodies.frag';
import VBodies from './bodies.vert';

import { EnumSize } from '@/lib/misc/EnumSize';
import { NotNull } from '@/lib/misc/NotNull';
import { Dimension } from '@/lib/misc/Primitives';
import { RVec2, RVec3 } from '@/lib/render/Primitives';
import { ShaderProgram } from '@/lib/render/ShaderProgram';

enum CircleComponent {
  X = 0,
  Y,
  R,
  G,
  B
}

export class BodiesRenderer {
  public static ComponentsPerIndex = EnumSize(CircleComponent);
  private vbo!: WebGLBuffer;
  private vao!: WebGLVertexArrayObject;
  private shader!: ShaderProgram;

  private viewDimension: RVec2 = [800, 600];
  private camera: RVec3 = [0, 0, 1];
  private bodyRadius = 5;

  // x, y, r, g, b
  private bodiesAttributes!: Float32Array;

  private indiciesCount = 0;

  constructor(private gl: WebGL2RenderingContext) {
    this.SetupBodies();
  }

  public ConstructAttributes(attrib: number[]): void {
    this.bodiesAttributes = new Float32Array(attrib);

    this.indiciesCount =
      this.bodiesAttributes.length / BodiesRenderer.ComponentsPerIndex;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.bodiesAttributes,
      this.gl.DYNAMIC_DRAW
    );
  }

  public Attributes(index: number): DataDescriptor {
    return {
      buffer: this.bodiesAttributes,
      offset: index * BodiesRenderer.ComponentsPerIndex
    };
  }

  public Draw(): void {
    this.shader.Use();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.bodiesAttributes,
      this.gl.DYNAMIC_DRAW
    );
    this.gl.bindVertexArray(this.vao);
    this.gl.drawArrays(this.gl.POINTS, 0, this.indiciesCount);
  }

  public ResizeView(size: Dimension): void {
    this.viewDimension = [size.Width, size.Height];

    this.shader.SetUniform2fv('u_resolution', this.viewDimension);
  }

  public Camera(camera: RVec3): void {
    this.camera = [...camera];

    this.shader.SetUniform3fv('u_cam', this.camera);
  }

  public Radius(radius: number): void {
    this.bodyRadius = radius;
    this.shader.SetUniform1f('u_radius', this.bodyRadius);
  }

  private SetupBodies(): void {
    this.vbo = this.gl.createBuffer() ?? NotNull();
    this.vao = this.gl.createVertexArray() ?? NotNull();

    this.shader = new ShaderProgram(this.gl);
    this.shader.Attach(this.gl.FRAGMENT_SHADER, FBodies);
    this.shader.Attach(this.gl.VERTEX_SHADER, VBodies);
    this.shader.Link();
    this.shader.Use();

    this.SetupBodiesAttributes();

    this.shader.SetUniform3fv('u_cam', this.camera);
    this.shader.SetUniform1f('u_radius', this.bodyRadius);
    this.shader.SetUniform2fv('u_resolution', this.viewDimension);
  }

  private SetupBodiesAttributes(): void {
    const FloatSize = Float32Array.BYTES_PER_ELEMENT;
    const ComponentsCount = EnumSize(CircleComponent);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);

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
}
