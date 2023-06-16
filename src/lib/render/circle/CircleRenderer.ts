import { PrimitivesRenderer } from '../PrimitivesRenderer';
import { TypeSizeResolver } from '../TypeSizeResolver';

import FCircle from './circle.frag';
import VCircle from './circle.vert';

import { EnumSize } from '@/lib/misc/EnumSize';
import { Dimension } from '@/lib/misc/Primitives';
import { RVec2, RVec3 } from '@/lib/render/Primitives';

enum CircleComponent {
  X = 0,
  Y,
  R,
  G,
  B
}

export class CircleRenderer extends PrimitivesRenderer {
  public static ComponentsPerIndex = EnumSize(CircleComponent);

  private viewDimension: RVec2 = [800, 600];
  private camera: RVec3 = [0, 0, 1];
  private bodyRadius = 5;

  constructor(gl: WebGL2RenderingContext) {
    const floatSize = TypeSizeResolver.Resolve(gl.FLOAT);
    const stride = floatSize * CircleRenderer.ComponentsPerIndex;

    super(
      gl,
      { vertex: VCircle, fragment: FCircle },
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
      { indicesPerPrimitive: 1, basePrimitiveType: gl.POINTS }
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

  public Radius(radius: number): void {
    this.bodyRadius = radius;
    this.shader.SetUniform1f('u_radius', this.bodyRadius);
  }

  private InitializeUniforms(): void {
    this.shader.SetUniform3fv('u_cam', this.camera);
    this.shader.SetUniform1f('u_radius', this.bodyRadius);
    this.shader.SetUniform2fv('u_resolution', this.viewDimension);
  }
}
