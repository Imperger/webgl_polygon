import { CircleCollider } from './CircleCollider';
import { CollisionEngine, XY } from './collision_engines/CollisionEngine';
import {
  CollisionEngineFactory,
  SupportedCollisionEngine
} from './collision_engines/CollisionEngineFactory';
import { Boundary } from './collision_engines/QuadTreeCollisionEngine';
import { EngineRenderer } from './collision_engines/renderers/EngineRenderer';
import { QuadTreeRenderer } from './collision_engines/renderers/QuadTreeRenderer';
import { MovingCircleCollider } from './models/MovingCircleCollider';
import FBodies from './shaders/bodies.frag';
import VBodies from './shaders/bodies.vert';
import FBorder from './shaders/border.frag';
import VBorder from './shaders/border.vert';

import { NotNull } from '@/lib/misc/NotNull';
import { Color, Dimension, Vec2 } from '@/lib/misc/Primitives';
import { RandomFloat } from '@/lib/misc/RandomFloat';
import { RVec2, RVec3 } from '@/lib/render/Primitives';
import { ShaderProgram } from '@/lib/render/ShaderProgram';

export interface CameraPosition {
  X: number;
  Y: number;
  Zoom: number;
}

enum CircleComponent {
  X = 0,
  Y,
  R,
  G,
  B
}
enum ResolutionComponent {
  Width = 0,
  Height
}
enum CameraComponent {
  X = 0,
  Y,
  Zoom
}

export class App {
  private bodiesVbo!: WebGLBuffer;
  private bodiesVao!: WebGLVertexArrayObject;
  private bodiesShader!: ShaderProgram;

  private bodies!: MovingCircleCollider[];
  // x, y, r, g, b
  private bodiesAttributes!: Float32Array;
  // [x, y, zoom]
  private readonly camera: RVec3 = [0, 0, 1];

  private fieldDimension: Dimension = { Width: 1000, Height: 1000 };
  private readonly resolution: RVec2 = [800, 600];
  private bodiesCount = 100;
  private bodyRadius = 15;
  private bodyColorConfig = {
    default: [0.392, 0.867, 0.09],
    collide: [1, 0, 0],
    selected: [0, 0, 1]
  };

  private borderVbo!: WebGLBuffer;
  private borderVao!: WebGLVertexArrayObject;
  private borderShader!: ShaderProgram;
  private borderAttributes!: Float32Array;
  private readonly borderColorConfig = {
    default: { R: 0.5, G: 0.5, B: 0.5 }
  };

  private collisionEngine!: CollisionEngine<MovingCircleCollider>;
  private collisionEngineFactory!: CollisionEngineFactory;

  private selectedBodies: MovingCircleCollider[] = [];

  private engineRenderer!: EngineRenderer;

  public IsEngineRenderrerEnabled = false;

  private isSimulationPaused = false;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private engineName: SupportedCollisionEngine
  ) {
    this.collisionEngineFactory = new CollisionEngineFactory({
      'quad-tree': () => [
        new Boundary(
          0,
          0,
          this.fieldDimension.Width,
          this.fieldDimension.Height
        ),
        (this.engineRenderer = new QuadTreeRenderer(this.gl))
      ]
    });

    this.collisionEngine = this.collisionEngineFactory.Create(engineName);

    this.Setup();
    (window as any)['app'] = this;
  }

  public SwitchCollisionEngine(engineName: SupportedCollisionEngine): void {
    this.engineName = engineName;

    this.collisionEngine.Reset();
    this.collisionEngine = this.collisionEngineFactory.Create(engineName);

    this.engineRenderer.Camera(this.camera);
    this.engineRenderer.ResizeView(this.resolution);

    this.bodies.forEach(body => this.collisionEngine.Add(body));
  }

  public SelectBody(x: number, y: number): boolean {
    const halfWidth = this.resolution[0] / 2;
    const halfHeight = this.resolution[1] / 2;
    const zoom = this.camera[2];

    const worldX = (x - halfWidth) / zoom + halfWidth - this.camera[0];
    const worldY =
      (this.resolution[1] - y - halfHeight) / zoom +
      halfHeight +
      this.camera[1];

    const defaultColor = this.bodyColorConfig.default;
    this.selectedBodies.forEach(body =>
      body.Color({ R: defaultColor[0], G: defaultColor[1], B: defaultColor[2] })
    );

    this.selectedBodies = this.bodies.filter(
      body => body.Center.Distance(new XY(worldX, worldY)) <= body.Radius
    );
    const selectedColor = this.bodyColorConfig.selected;
    this.selectedBodies.forEach(body =>
      body.Color({
        R: selectedColor[0],
        G: selectedColor[1],
        B: selectedColor[2]
      })
    );

    return true;
  }

  public ResizeView(dimension: Dimension) {
    this.resolution[ResolutionComponent.Width] = dimension.Width;
    this.resolution[ResolutionComponent.Height] = dimension.Height;

    this.bodiesShader.SetUniform2fv('u_resolution', this.resolution);
    this.borderShader.SetUniform2fv('u_resolution', this.resolution);
    this.engineRenderer.ResizeView(this.resolution);
  }

  public ResizeField(dimension: Dimension): void {
    if (this.IsDimensionShrink(dimension)) {
      this.bodies.forEach(body => {
        if (body.Center.X + body.Radius > dimension.Width) {
          body.Center = new XY(dimension.Width - body.Radius, body.Center.Y);
        }

        if (body.Center.Y + body.Radius > dimension.Height) {
          body.Center = new XY(body.Center.X, dimension.Height - body.Radius);
        }
      });
    }

    this.fieldDimension = { ...dimension };

    this.BuildBorder();
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.borderAttributes,
      this.gl.DYNAMIC_DRAW
    );

    this.SwitchCollisionEngine(this.engineName);
  }

  public get Pause(): boolean {
    return this.isSimulationPaused;
  }

  public set Pause(value: boolean) {
    this.isSimulationPaused = value;
  }

  public set Camera(position: CameraPosition) {
    this.camera[CameraComponent.X] = position.X;
    this.camera[CameraComponent.Y] = position.Y;
    this.camera[CameraComponent.Zoom] = position.Zoom;

    this.bodiesShader.SetUniform3fv('u_cam', this.camera);
    this.borderShader.SetUniform3fv('u_cam', this.camera);
    this.engineRenderer.Camera(this.camera);
  }

  public set BodiesCount(count: number) {
    this.bodiesCount = count;

    this.BuildBodies();
  }

  public set BodiesRadius(radius: number) {
    this.bodyRadius = radius;
    this.bodiesShader.SetUniform1f('u_radius', radius);
    this.UpdateRadiusForBodies();
  }

  public Draw(elapsed: number): void {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    if (this.collisionEngine !== null) {
      this.DrawBodies();
      this.DrawBorder();

      if (this.IsEngineRenderrerEnabled) {
        this.collisionEngine.Draw(elapsed);
      }
    }
  }

  private DrawBodies(): void {
    if (!this.isSimulationPaused) {
      const visited = new Set<CircleCollider>();
      this.bodies.forEach(circle => {
        circle.CheckCollision(
          this.collisionEngine
            .FindCollisions(circle)
            .filter(x => !visited.has(x))
        );

        visited.add(circle);
      });

      this.bodies.forEach(body => body.Move(this.fieldDimension));

      this.collisionEngine.RecalculateBuckets();
    }

    this.bodiesShader.Use();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bodiesVbo);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.bodiesAttributes,
      this.gl.DYNAMIC_DRAW
    );
    this.gl.bindVertexArray(this.bodiesVao);
    this.gl.drawArrays(this.gl.POINTS, 0, this.bodiesCount);
  }

  private DrawBorder(): void {
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

  private BuildBodies(): void {
    const ComponentsCount = Object.keys(CircleComponent).length >> 1;

    this.bodies = [];

    const attributeBuilder = [
      () => RandomFloat(0, this.fieldDimension.Width), // X
      () => RandomFloat(0, this.fieldDimension.Height), // Y
      () => this.bodyColorConfig.default[0], // R
      () => this.bodyColorConfig.default[1], // G
      () => this.bodyColorConfig.default[2] // B
    ];

    const data = Array.from(
      { length: this.bodiesCount * ComponentsCount },
      (_, n) => attributeBuilder[n % ComponentsCount]()
    );

    this.bodiesAttributes = new Float32Array(data);

    this.collisionEngine.Reset();

    for (let n = 0; n < this.bodiesCount; ++n) {
      const object = new MovingCircleCollider(
        { buffer: this.bodiesAttributes, offset: n * ComponentsCount },
        this.bodyRadius,
        { X: RandomFloat(-3, 3), Y: RandomFloat(-3, 3) }
      );

      this.bodies.push(object);

      this.collisionEngine.Add(object);
    }
  }

  private UpdateRadiusForBodies(): void {
    this.bodies.forEach(body => (body.Radius = this.bodyRadius));
  }

  private Setup(): void {
    this.SetupBodies();
    this.SetupBorder();

    this.engineRenderer.Camera(this.camera);
    this.engineRenderer.ResizeView(this.resolution);

    this.gl.disable(this.gl.DEPTH_TEST);

    this.gl.clearColor(1, 1, 1, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  private SetupBodies(): void {
    this.bodiesVbo = this.gl.createBuffer() ?? NotNull();
    this.bodiesVao = this.gl.createVertexArray() ?? NotNull();

    this.bodiesShader = new ShaderProgram(this.gl);
    this.bodiesShader.Attach(this.gl.FRAGMENT_SHADER, FBodies);
    this.bodiesShader.Attach(this.gl.VERTEX_SHADER, VBodies);
    this.bodiesShader.Link();
    this.bodiesShader.Use();

    this.SetupBodiesAttributes();

    this.bodiesShader.SetUniform3fv('u_cam', this.camera);
    this.bodiesShader.SetUniform1f('u_radius', this.bodyRadius);
    this.bodiesShader.SetUniform2fv('u_resolution', this.resolution);
  }

  private SetupBodiesAttributes(): void {
    const FloatSize = Float32Array.BYTES_PER_ELEMENT;
    const ComponentsCount = Object.keys(CircleComponent).length >> 1;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bodiesVbo);
    this.BuildBodies();
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.bodiesAttributes,
      this.gl.DYNAMIC_DRAW
    );

    this.gl.bindVertexArray(this.bodiesVao);

    const posLoc = this.bodiesShader.GetAttributeLocation('a_vertex');
    this.gl.enableVertexAttribArray(posLoc);
    this.gl.vertexAttribPointer(
      posLoc,
      2,
      this.gl.FLOAT,
      false,
      FloatSize * ComponentsCount,
      0
    );

    const colorLoc = this.bodiesShader.GetAttributeLocation('a_color');
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
    this.borderShader.SetUniform2fv('u_resolution', this.resolution);
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
      ...this.Rectangle(
        { X: -BorderWidth, Y: 0 },
        { Width: BorderWidth, Height: this.fieldDimension.Height },
        this.borderColorConfig.default
      ),
      ...this.Rectangle(
        { X: -BorderWidth, Y: this.fieldDimension.Height },
        {
          Width: this.fieldDimension.Width + 2 * BorderWidth,
          Height: BorderWidth
        },
        this.borderColorConfig.default
      ),
      ...this.Rectangle(
        { X: this.fieldDimension.Width, Y: 0 },
        { Width: BorderWidth, Height: this.fieldDimension.Height },
        this.borderColorConfig.default
      ),
      ...this.Rectangle(
        { X: -BorderWidth, Y: -BorderWidth },
        {
          Width: this.fieldDimension.Width + 2 * BorderWidth,
          Height: BorderWidth
        },
        this.borderColorConfig.default
      )
    ]);
  }

  private Rectangle(p0: Vec2, dimension: Dimension, color: Color): number[] {
    const leftBottom = [p0.X, p0.Y, color.R, color.G, color.B];
    const leftTop = [p0.X, p0.Y + dimension.Height, color.R, color.G, color.B];
    const rightTop = [
      p0.X + dimension.Width,
      p0.Y + dimension.Height,
      color.R,
      color.G,
      color.B
    ];
    const rightBottom = [
      p0.X + dimension.Width,
      p0.Y,
      color.R,
      color.G,
      color.B
    ];

    return [
      ...leftBottom,
      ...rightTop,
      ...leftTop,
      ...leftBottom,
      ...rightBottom,
      ...rightTop
    ];
  }

  private IsDimensionShrink(dimension: Dimension): boolean {
    return (
      dimension.Width < this.fieldDimension.Width ||
      dimension.Height < this.fieldDimension.Height
    );
  }
}
