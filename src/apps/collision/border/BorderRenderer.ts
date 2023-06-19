import FBorder from './border.frag';
import VBorder from './border.vert';

import { EnumSize } from '@/lib/misc/EnumSize';
import { Dimension, Rgb } from '@/lib/misc/Primitives';
import { PrimitiveBuilder } from '@/lib/render/PrimitiveBuilder';
import { RVec2, RVec3 } from '@/lib/render/Primitives';
import { PrimitivesRenderer } from '@/lib/render/PrimitivesRenderer';
import { TypeSizeResolver } from '@/lib/render/TypeSizeResolver';

enum BorderComponent {
  X = 0,
  Y,
  R,
  G,
  B
}

export class BorderRenderer extends PrimitivesRenderer {
  public static ComponentsPerIndex = EnumSize(BorderComponent);

  private viewDimension: RVec2 = [800, 600];
  private camera: RVec3 = [0, 0, 1];

  private readonly borderColorConfig = {
    default: [0.5, 0.5, 0.5] as Rgb
  };
  constructor(gl: WebGL2RenderingContext, private borderDimension: Dimension) {
    const floatSize = TypeSizeResolver.Resolve(gl.FLOAT);
    const stride = floatSize * BorderRenderer.ComponentsPerIndex;

    super(
      gl,
      { vertex: VBorder, fragment: FBorder },
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

    this.ResizeView(borderDimension);
  }

  public ResizeView(size: Dimension): void {
    this.viewDimension = [size.Width, size.Height];

    this.shader.SetUniform2fv('u_resolution', this.viewDimension);
  }

  public Dimension(size: Dimension): void {
    this.borderDimension = { ...size };

    this.UploadAttributes(this.BuildBorder());
  }

  public Camera(camera: RVec3): void {
    this.camera = [...camera];

    this.shader.SetUniform3fv('u_cam', this.camera);
  }

  private BuildBorder() {
    const BorderWidth = 2;
    // Left, Top, Right, Bottom
    return [
      ...PrimitiveBuilder.AABBColorRectangle(
        { X: -BorderWidth, Y: 0 },
        { Width: BorderWidth, Height: this.borderDimension.Height },
        this.borderColorConfig.default
      ),
      ...PrimitiveBuilder.AABBColorRectangle(
        { X: -BorderWidth, Y: this.borderDimension.Height },
        {
          Width: this.borderDimension.Width + 2 * BorderWidth,
          Height: BorderWidth
        },
        this.borderColorConfig.default
      ),
      ...PrimitiveBuilder.AABBColorRectangle(
        { X: this.borderDimension.Width, Y: 0 },
        { Width: BorderWidth, Height: this.borderDimension.Height },
        this.borderColorConfig.default
      ),
      ...PrimitiveBuilder.AABBColorRectangle(
        { X: -BorderWidth, Y: -BorderWidth },
        {
          Width: this.borderDimension.Width + 2 * BorderWidth,
          Height: BorderWidth
        },
        this.borderColorConfig.default
      )
    ];
  }
}
