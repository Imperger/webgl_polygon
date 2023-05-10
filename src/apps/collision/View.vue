<template>
  <div class="flex">
    <Viewport class="no-focus" tabindex="0" :width="width" :height="height" preserveDrawingBuffer="true"
      @context-ready="OnContextReady" @wheel.native.prevent="OnWheel($event.deltaY, $event.ctrlKey, $event.altKey)"
      @mousemove.native="OnMouseMove($event.buttons, $event.ctrlKey, $event.movementX, $event.movementY)"
      @mousedown.native="OnMouseDown($event.button, $event.ctrlKe, $event.offsetX, $event.offsetY)"
      @mouseup.native="OnMouseUp($event.button, $event.ctrlKe, $event.offsetX, $event.offsetY)"
      @keydown.native="OnKeyDown" />
    <aside>
      <help-popup />
      <h3 class="control-panel-title">Collision</h3>
      <fieldset class="detection-engine-group">
        <legend>Detection engine</legend>
        <div class="detection-engine-selector">
          <input id="QuadTree" type="radio" name="detectionEngine" value="quad-tree" v-model="collisionEngine" checked>
          <label for="QuadTree">Quad tree</label>
        </div>
        <div class="detection-engine-selector">
          <input id="BruteForce" type="radio" value="brute-force" v-model="collisionEngine" name="detectionEngine">
          <label for="BruteForce">Brute-force</label>
        </div>
      </fieldset>
      <div class="input-group">
        <span :class="{ 'caption-validation-error': isInvalidBodiesCount }" class="input-title">Bodies</span>
        <input type="number" :class="{ 'input-validation-error': isInvalidBodiesCount }" v-model.number="bodiesCount"
          min="2" max="1000000">
      </div>
      <div class="input-group">
        <span :class="{ 'caption-validation-error': isInvalidBodiesRadius }" class="input-title">Radius</span>
        <input type="number" :class="{ 'input-validation-error': isInvalidBodiesRadius }" v-model.number="bodiesRadius"
          min="1" max="500">
      </div>
      <div class="input-group">
        <label for="showEngineInternals" class="input-title">Show engine internals</label>
        <input id="showEngineInternals" type="checkbox" v-model="showEngineInternals" min="1" max="500">
      </div>
      <div class="input-group">
        <button @click="OpenDimensionEditor">Set field dimension</button>
      </div>
      <dimension-editor v-if="isDimensionEditorOpened" :dimension="fieldDimension" @apply="ChangeFieldDimension"
        @cancel="CloseDimensionEditor" />
      <div class="fps-counter">
        <span>FPS: </span>
        <span class="fps-counter-value">{{ fps }}</span>
      </div>
    </aside>
  </div>
</template>

<style scoped>
@import "../../css/button.css";
@import "../../css/input.css";

.no-focus:focus {
  outline: none;
}

.flex {
  display: flex;
}

aside {
  position: absolute;
  padding: 10px;
  margin: 0;
  background-color: #0277bd;
  color: #f5f5f5;
  list-style-type: none;
}

.control-panel-title {
  margin: 0 0 5px 0;
  text-align: center;
}

.input-group {
  margin-bottom: 5px;
}

.input-title {
  margin-right: 5px;
}

.detection-engine-group {
  border-color: black;
  margin: 0 0 10px 0;
}

.bodies-count>input[type='number'] {
  margin-left: 5px;
}

.fps-counter {
  text-align: right;
}

.fps-counter-value {
  display: inline-block;
  width: 18px;
  text-align: left;
}
</style>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';

import { App, CameraPosition } from './App';
import { XY } from './collision_engines/CollisionEngine';
import { SupportedCollisionEngine } from './collision_engines/CollisionEngineFactory';
import DimensionEditor from './DimensionEditor.vue';
import HelpPopup from './HelpPopup.vue';

import Viewport from '@/components/Viewport.vue';
import { MouseButton, MouseButtons } from '@/lib/misc/Dom';
import { Dimension } from '@/lib/misc/Primitives';
import { RVec3 } from '@/lib/render/Primitives';

@Component({
  components: {
    DimensionEditor,
    HelpPopup,
    Viewport
  }
})
export default class Main extends Vue {
  public width = 800;
  public height = 600;

  public isDimensionEditorOpened = false;
  public fieldDimension: Dimension = { Width: 1000, Height: 1000 };

  public bodiesCount = 10000;
  public bodiesRadius = 2;
  public showEngineInternals = false;
  public camera: CameraPosition = { X: 0, Y: 0, Zoom: 1 };

  public collisionEngine: SupportedCollisionEngine = 'quad-tree';

  public fps = 0;
  private drawCallCounter = 0;
  private drawCallCounterStart = Date.now();

  private leftBtnPressPosition!: XY;

  private app!: App;
  private isUnmounted!: boolean;

  @Watch('collisionEngine')
  private CollisionEngineChange(value: SupportedCollisionEngine, _prev: SupportedCollisionEngine): void {
    this.app.SwitchCollisionEngine(value);
  }

  @Watch('bodiesCount')
  private BodiesCountChange(value: number, _prev: number): void {
    this.app.BodiesCount = value;
  }

  @Watch('bodiesRadius')
  private BodiesRadiusChange(value: number, _prev: number): void {
    this.app.BodiesRadius = value;
  }

  @Watch('showEngineInternals')
  private ShowEngineInternalsChange(value: boolean, _prev: boolean): void {
    this.app.IsEngineRenderrerEnabled = value;
  }

  @Watch('camera')
  private CameraChange(value: CameraPosition, _prev: RVec3): void {
    this.app.Camera = value;
  }

  public async mounted() {
    this.isUnmounted = false;

    this.leftBtnPressPosition = new XY(0, 0);

    window.addEventListener('resize', this.OnResize);

    this.lastDrawCall = Date.now();
    window.requestAnimationFrame(() => {
      this.Draw(Date.now() - this.lastDrawCall);
    });
  }

  public beforeDestroy() {
    this.isUnmounted = true;
    window.removeEventListener('resize', this.OnResize);
  }

  public OnContextReady(ctx: WebGL2RenderingContext) {
    this.app = new App(ctx, this.collisionEngine);
    this.app.BodiesCount = this.bodiesCount;
    this.app.BodiesRadius = this.bodiesRadius;
    this.app.ResizeField(this.fieldDimension);

    this.OnResize();
  }

  private lastDrawCall = 0;

  private Draw(elapsed: number) {
    if (this.isUnmounted) {
      return;
    }

    this.TrackFps();

    this.app.Draw(elapsed);

    window.requestAnimationFrame(() => {
      const elapsed = Date.now() - this.lastDrawCall;
      this.lastDrawCall = Date.now();

      this.Draw(elapsed);
    });

    ++this.drawCallCounter;
  }

  private TrackFps(): void {
    const elapsed = Date.now() - this.drawCallCounterStart;
    if (elapsed >= 1000) {
      this.fps = Math.round(this.drawCallCounter * (elapsed / 1000));

      this.drawCallCounterStart = Date.now();
      this.drawCallCounter = 0;
    }
  }

  public OnWheel(offset: number, _ctrl: boolean, _alt: boolean) {
    const dir = -offset / Math.abs(offset);
    const zoom = this.camera.Zoom;
    const step = dir * (dir > 0 ? 0.1 : 0.2);

    if (zoom + step > 0.5 && zoom + step < 10) {
      this.camera.Zoom = zoom + step;

      this.app.Camera = this.camera;
    }
  }
  /**
   * @param offsetX positive values for moving towards right
   * @param offsetY positive values for moving towards top
   */
  public OnMouseMove(btn: MouseButtons, ctrl: boolean, offsetX: number, offsetY: number) {
    if (btn & MouseButtons.Left) {
      this.camera.X += offsetX / this.camera.Zoom;
      this.camera.Y += offsetY / this.camera.Zoom;

      this.app.Camera = this.camera;
    }
  }

  public OnMouseDown(btn: MouseButton, ctrl: boolean, x: number, y: number): void {
    if (btn === MouseButton.Left) {
      this.leftBtnPressPosition = new XY(x, y);
    }
  }

  public OnMouseUp(btn: MouseButton, ctrl: boolean, x: number, y: number): void {
    if (btn === MouseButton.Left) {
      if (this.leftBtnPressPosition.Distance(new XY(x, y)) < 2) {
        this.app.SelectBody(x, y);
      }
    }
  }

  public OnKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'Space':
        this.app.Pause = !this.app.Pause;
        break;
    }
  }

  public ChangeFieldDimension(dimension: Dimension): void {
    this.fieldDimension = dimension;

    this.app.ResizeField(this.fieldDimension);

    this.CloseDimensionEditor();
  }

  public OpenDimensionEditor(): void {
    this.isDimensionEditorOpened = true;
  }

  public CloseDimensionEditor(): void {
    this.isDimensionEditorOpened = false;
  }

  private OnResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.app.ResizeView({ Width: this.width, Height: this.height });
  }

  public get isInvalidBodiesCount() {
    return this.bodiesCount < 2 || this.bodiesCount > 1000000;
  }

  public get isInvalidBodiesRadius() {
    return this.bodiesRadius < 1 || this.bodiesRadius > 500;
  }
}
</script>
