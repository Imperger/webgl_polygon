import { TypeSizeResolver } from './TypeSizeResolver';

import { NotNull } from '@/lib/misc/NotNull';
import { ShaderProgram } from '@/lib/render/ShaderProgram';

interface ShaderProgramSource {
  vertex: string;
  fragment: string;
}

type AttributeType =
  | typeof WebGL2RenderingContext.BYTE
  | typeof WebGL2RenderingContext.SHORT
  | typeof WebGL2RenderingContext.UNSIGNED_BYTE
  | typeof WebGL2RenderingContext.UNSIGNED_SHORT
  | typeof WebGL2RenderingContext.FLOAT
  | typeof WebGL2RenderingContext.HALF_FLOAT
  | typeof WebGL2RenderingContext.INT
  | typeof WebGL2RenderingContext.UNSIGNED_INT
  | typeof WebGL2RenderingContext.INT_2_10_10_10_REV
  | typeof WebGL2RenderingContext.UNSIGNED_INT_2_10_10_10_REV;

type BasePrimitiveType =
  | typeof WebGL2RenderingContext.POINTS
  | typeof WebGL2RenderingContext.LINES
  | typeof WebGL2RenderingContext.LINE_LOOP
  | typeof WebGL2RenderingContext.LINE_STRIP
  | typeof WebGL2RenderingContext.TRIANGLES
  | typeof WebGL2RenderingContext.TRIANGLE_STRIP
  | typeof WebGL2RenderingContext.TRIANGLE_FAN;

interface AttributeDescription {
  name: string;
  size: GLint;
  type: AttributeType;
  normalized: GLboolean;
  stride: GLsizei;
  offset: GLintptr;
}

interface PrimitiveDescription {
  indicesPerPrimitive: number;
  basePrimitiveType: BasePrimitiveType;
}

export interface DataDescriptor {
  buffer: Float32Array;
  offset: number;
}

export class PrimitivesRenderer {
  private vbo!: WebGLBuffer;
  private vao!: WebGLVertexArrayObject;
  protected shader!: ShaderProgram;

  private attributes!: Float32Array;

  private componentsPerAttributeSet = 0;
  private attributeSetCount = 0;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    shaderSource: ShaderProgramSource,
    attributes: AttributeDescription[],
    private readonly primitiveDescription: PrimitiveDescription
  ) {
    this.Setup(shaderSource);
    this.SetupAttributes(attributes);
  }

  public UploadAttributes(attrib: number[]): void {
    this.attributes = new Float32Array(attrib);

    this.attributeSetCount =
      this.attributes.length / this.componentsPerAttributeSet;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.attributes,
      this.gl.DYNAMIC_DRAW
    );
  }

  public PrimitiveAttributes(index: number): DataDescriptor {
    return {
      buffer: this.attributes,
      offset:
        index *
        this.componentsPerAttributeSet *
        this.primitiveDescription.indicesPerPrimitive
    };
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
    this.gl.drawArrays(
      this.primitiveDescription.basePrimitiveType,
      0,
      this.attributeSetCount
    );
  }

  private Setup(shaderSource: ShaderProgramSource): void {
    this.vbo = this.gl.createBuffer() ?? NotNull();
    this.vao = this.gl.createVertexArray() ?? NotNull();

    this.shader = new ShaderProgram(this.gl);
    this.shader.Attach(this.gl.FRAGMENT_SHADER, shaderSource.fragment);
    this.shader.Attach(this.gl.VERTEX_SHADER, shaderSource.vertex);
    this.shader.Link();
    this.shader.Use();
  }

  private SetupAttributes(attributes: AttributeDescription[]): void {
    if (attributes.length === 0) {
      throw new Error("Attributes description can't be empty");
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);

    this.gl.bindVertexArray(this.vao);

    const stride = attributes.reduce(
      (stride, attr) =>
        stride + attr.size * TypeSizeResolver.Resolve(attr.type),
      0
    );

    this.componentsPerAttributeSet =
      stride / TypeSizeResolver.Resolve(attributes[0].type);

    for (
      let n = 0, offset = 0;
      n < attributes.length;
      offset +=
        attributes[n].size * TypeSizeResolver.Resolve(attributes[n].type),
        ++n
    ) {
      const attr = attributes[n];

      const location = this.shader.GetAttributeLocation(attr.name);
      this.gl.enableVertexAttribArray(location);
      this.gl.vertexAttribPointer(
        location,
        attr.size,
        attr.type,
        attr.normalized,
        stride,
        offset
      );
    }

    this.gl.bindVertexArray(null);
  }
}
