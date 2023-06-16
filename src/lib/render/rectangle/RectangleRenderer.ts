import { PrimitivesRenderer } from '../PrimitivesRenderer';
import { TypeSizeResolver } from '../TypeSizeResolver';

import FRectangle from './rectangle.frag';
import VRectangle from './rectangle.vert';

import { EnumSize } from '@/lib/misc/EnumSize';
import { Dimension } from '@/lib/misc/Primitives';
import { RVec2, RVec3 } from '@/lib/render/Primitives';

enum RectangleComponent {
  X = 0,
  Y,
  R,
  G,
  B
}

export class RectangleRenderer extends PrimitivesRenderer {
  public static ComponentsPerIndex = EnumSize(RectangleComponent);

  private viewDimension: RVec2 = [800, 600];
  private camera: RVec3 = [0, 0, 1];

  constructor(gl: WebGL2RenderingContext) {
    const floatSize = TypeSizeResolver.Resolve(gl.FLOAT);
    const stride = floatSize * RectangleRenderer.ComponentsPerIndex;

    super(
      gl,
      { vertex: VRectangle, fragment: FRectangle },
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
          size: 3,
          type: gl.FLOAT,
          normalized: false,
          stride,
          offset: 2 * floatSize
        }
      ],
      { indicesPerPrimitive: 6, basePrimitiveType: gl.TRIANGLES }
    );

    this.InitializeUniforms();
  }

  public ResizeView(size: Dimension): void {
    this.viewDimension = [size.Width, size.Height];

    this.shader.SetUniform2fv('u_resolution', this.viewDimension);
  }

  public Camera(camera: RVec3): void {
    this.camera = [...camera];

    this.shader.SetUniform3fv('u_cam', this.camera);
  }

  private InitializeUniforms(): void {
    this.shader.SetUniform3fv('u_cam', this.camera);
    this.shader.SetUniform2fv('u_resolution', this.viewDimension);
  }
}
