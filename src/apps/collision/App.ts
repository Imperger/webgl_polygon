import { BodiesRenderer } from './bodies/BodiesRenderer';
import { BorderRenderer } from './border/BorderRenderer';
import { CollisionEngine, XY } from './collision_engines/CollisionEngine';
import {
  CollisionEngineFactory,
  SupportedCollisionEngine
} from './collision_engines/CollisionEngineFactory';
import { Boundary } from './collision_engines/QuadTreeCollisionEngine';
import { EngineRenderer } from './collision_engines/renderers/EngineRenderer';
import { QuadTreeRenderer } from './collision_engines/renderers/QuadTreeRenderer';
import { AppEvent, AppEventSet } from './Events';
import { MovingCircleCollider } from './models/MovingCircleCollider';
import {
  AvailableInteractionTool,
  InteractionTool
} from './tools/InteractionTool';
import { PanTool } from './tools/PanTool';
import { SelectionTool } from './tools/SelectionTool/SelectionTool';

import { Shape } from '@/lib/math/Shape';
import { MouseButton } from '@/lib/misc/Dom';
import { EventBus } from '@/lib/misc/EventBus';
import { Dimension, Rectangle } from '@/lib/misc/Primitives';
import { RandomFloat } from '@/lib/misc/RandomFloat';
import { Camera2, Camera2Component } from '@/lib/render/Camera';
import { RVec2, RVec3 } from '@/lib/render/Primitives';

type UpdatedCameraComponent = Partial<Camera2>;

enum ResolutionComponent {
  Width = 0,
  Height
}

export class App {
  public static EventBus = new EventBus<AppEventSet, typeof AppEvent>(AppEvent);

  private bodies!: MovingCircleCollider[];
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

  private border!: BorderRenderer;

  private collisionEngine!: CollisionEngine<MovingCircleCollider>;
  private collisionEngineFactory!: CollisionEngineFactory;

  private selectedBodies: MovingCircleCollider[] = [];

  private engineRenderer!: EngineRenderer;

  private bodiesRenderer!: BodiesRenderer;

  public IsEngineRendererEnabled = false;

  private isSimulationPaused = false;

  private interactionTool!: InteractionTool;

  private resizeViewBehavior = (d: Dimension) => this.CenterCamera(d);

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

    this.bodiesRenderer = new BodiesRenderer(this.gl);

    this.collisionEngine = this.collisionEngineFactory.Create(engineName);

    this.border = new BorderRenderer(gl, this.fieldDimension);

    this.interactionTool = new PanTool(this.gl, this);

    this.Setup();

    (window as any)['app'] = this;
  }

  public Dispose(): void {
    delete (window as any)['app'];

    App.EventBus.Reset();
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
    const world = this.ScreenToWorld(x, y);

    const defaultColor = this.bodyColorConfig.default;
    this.selectedBodies.forEach(body =>
      body.Color({ R: defaultColor[0], G: defaultColor[1], B: defaultColor[2] })
    );

    this.selectedBodies = this.bodies.filter(
      body => body.Center.Distance(new XY(world.X, world.Y)) <= body.Radius
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

  public SelectBodies(region: Rectangle): boolean {
    const defaultColor = this.bodyColorConfig.default;
    this.selectedBodies.forEach(body =>
      body.Color({ R: defaultColor[0], G: defaultColor[1], B: defaultColor[2] })
    );

    this.selectedBodies = this.bodies.filter(body =>
      Shape.RectangleCircleIntersect(region, body)
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
    this.resizeViewBehavior(dimension);
  }

  private CenterCamera(dimension: Dimension): void {
    this.Camera = {
      X: (dimension.Width - this.fieldDimension.Width) / 2,
      Y: -(dimension.Height - this.fieldDimension.Height) / 2
    };

    this.ResizeViewDefault(dimension);

    this.resizeViewBehavior = (d: Dimension) => this.ResizeViewDefault(d);
  }

  private ResizeViewDefault(dimension: Dimension): void {
    this.resolution[ResolutionComponent.Width] = dimension.Width;
    this.resolution[ResolutionComponent.Height] = dimension.Height;

    App.EventBus.Publish(AppEvent.ResizeView, dimension);

    this.bodiesRenderer.ResizeView(dimension);
    this.border.ResizeView(dimension);
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

    this.border.Dimension(this.fieldDimension);

    this.SwitchCollisionEngine(this.engineName);
  }

  public OnMouseMove(e: MouseEvent): void {
    this.interactionTool.OnMouseMove(e);
  }

  public OnMouseDown(e: MouseEvent): void {
    if (e.button === MouseButton.Left) {
      if (e.shiftKey) {
        this.SwitchInteractionTool(AvailableInteractionTool.Selection);
      } else {
        this.SwitchInteractionTool(AvailableInteractionTool.Pan);
      }
    }

    this.interactionTool.OnMouseDown(e);
  }

  public OnMouseUp(e: MouseEvent): void {
    this.interactionTool.OnMouseUp(e);

    if (
      e.button === MouseButton.Left &&
      this.interactionTool instanceof SelectionTool
    ) {
      this.SwitchInteractionTool(AvailableInteractionTool.Pan);
    }
  }

  public OnKeyDown(e: KeyboardEvent): void {
    this.interactionTool.OnKeyDown(e);
  }

  OnWheel(e: WheelEvent): void {
    this.interactionTool.OnWheel(e);
  }

  public OnTouchMove(e: TouchEvent): void {
    this.interactionTool.OnTouchMove(e);
  }

  public OnTouchStart(e: TouchEvent): void {
    this.interactionTool.OnTouchStart(e);
  }

  public OnTouchEnd(e: TouchEvent): void {
    this.interactionTool.OnTouchEnd(e);
  }

  public ScreenToWorld(x: number, y: number) {
    const halfWidth = this.resolution[0] / 2;
    const halfHeight = this.resolution[1] / 2;
    const zoom = this.camera[2];

    const worldX = (x - halfWidth) / zoom + halfWidth - this.camera[0];
    const worldY =
      (this.resolution[1] - y - halfHeight) / zoom +
      halfHeight +
      this.camera[1];

    return { X: worldX, Y: worldY };
  }

  public get Camera(): Required<UpdatedCameraComponent> {
    return {
      X: this.camera[Camera2Component.X],
      Y: this.camera[Camera2Component.Y],
      Zoom: this.camera[Camera2Component.Zoom]
    };
  }

  public set Camera(position: UpdatedCameraComponent) {
    if (position.X !== undefined) {
      this.camera[Camera2Component.X] = position.X;
    }

    if (position.Y !== undefined) {
      this.camera[Camera2Component.Y] = position.Y;
    }

    if (position.Zoom !== undefined) {
      this.camera[Camera2Component.Zoom] = position.Zoom;
    }

    App.EventBus.Publish(AppEvent.CameraMove, this.Camera);

    this.bodiesRenderer.Camera(this.camera);
    this.border.Camera(this.camera);
    this.engineRenderer.Camera(this.camera);
  }

  public get BodiesCount(): number {
    return this.bodiesCount;
  }

  public set BodiesCount(count: number) {
    this.bodiesCount = count;

    this.BuildBodies();
  }

  public get BodiesRadius(): number {
    return this.bodyRadius;
  }

  public set BodiesRadius(radius: number) {
    this.bodyRadius = radius;
    this.bodiesRenderer.Radius(radius);
    this.UpdateRadiusForBodies();
  }

  public get ViewDimension(): Dimension {
    return {
      Width: this.resolution[ResolutionComponent.Width],
      Height: this.resolution[ResolutionComponent.Height]
    };
  }

  public get FieldBoundary(): Dimension {
    return this.fieldDimension;
  }

  public get Pause(): boolean {
    return this.isSimulationPaused;
  }

  public set Pause(value: boolean) {
    this.isSimulationPaused = value;

    App.EventBus.Publish(AppEvent.TogglePause, value);
  }

  public Draw(elapsed: number): void {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    if (this.collisionEngine !== null) {
      this.UpdateBodies(elapsed);
      this.bodiesRenderer.Draw();
      this.border.Draw();

      if (this.IsEngineRendererEnabled) {
        this.collisionEngine.Draw(elapsed);
      }
    }

    this.interactionTool.Draw(elapsed);
  }

  private UpdateBodies(elapsed: number): void {
    if (!this.isSimulationPaused) {
      this.collisionEngine.ForEachCollided((a, b) =>
        a.CheckCollision(b, elapsed)
      );

      this.bodies.forEach(body => body.Move(this.fieldDimension, elapsed));

      this.collisionEngine.RecalculateBuckets();
    }
  }

  private BuildBodies(): void {
    const ComponentsCount = BodiesRenderer.ComponentsPerIndex;

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

    this.bodiesRenderer.ConstructAttributes(data);

    this.collisionEngine.Reset();

    for (let n = 0; n < this.bodiesCount; ++n) {
      const object = new MovingCircleCollider(
        this.bodiesRenderer.Attributes(n),
        this.bodyRadius,
        { X: RandomFloat(-100, 100), Y: RandomFloat(-100, 100) }
      );

      this.bodies.push(object);

      this.collisionEngine.Add(object);
    }
  }

  private UpdateRadiusForBodies(): void {
    this.bodies.forEach(body => (body.Radius = this.bodyRadius));
  }

  private Setup(): void {
    this.engineRenderer.Camera(this.camera);
    this.engineRenderer.ResizeView(this.resolution);

    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.clearColor(1, 1, 1, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  private IsDimensionShrink(dimension: Dimension): boolean {
    return (
      dimension.Width < this.fieldDimension.Width ||
      dimension.Height < this.fieldDimension.Height
    );
  }

  private SwitchInteractionTool(tool: AvailableInteractionTool): void {
    if (this.interactionTool !== null) {
      if (tool === this.interactionTool.Type) {
        return;
      }

      this.interactionTool.Dispose();
    }

    const factory = [
      () => new PanTool(this.gl, this),
      () => new SelectionTool(this.gl, this)
    ];

    this.interactionTool = factory[tool]();
  }
}
