<template>
  <div class="flex">
    <Viewport class="outline-none" tabindex="0" :width="width" :height="height" preserveDrawingBuffer="true"
      @context-ready="OnContextReady" @wheel.native.prevent="OnWheel" @mousemove.native="OnMouseMove"
      @mousedown.native="OnMouseDown" @mouseup.native="OnMouseUp" @keydown.native="OnKeyDown" 
      @touchmove.native="OnTouchMove" @touchstart.native="OnTouchStart"
      @touchend.native="OnTouchEnd"/>
    <aside>
      <div class="absolute text-xs">
        <span>FPS: {{ fps }}</span>
      </div>
      <h3 class="text-center">Collision</h3>
      <help-popup />
      <fieldset class="border border-y-slate-200 border-x-transparent p-2">
        <legend>Detection engine</legend>
        <div>
          <input id="QuadTree" type="radio" name="detectionEngine" value="quad-tree" v-model="collisionEngine" checked>
          <label for="QuadTree">Quad tree</label>
        </div>
        <div>
          <input id="BruteForce" type="radio" value="brute-force" v-model="collisionEngine" name="detectionEngine">
          <label for="BruteForce">Brute-force</label>
        </div>
      </fieldset>
      <div class="mt-2">
        <span :class="{ 'caption-validation-error': isInvalidBodiesCount }" class="mr-2">Bodies</span>
        <input type="number" :class="{ 'input-validation-error': isInvalidBodiesCount }" v-model.number="bodiesCount"
          min="2" max="1000000">
      </div>
      <div class="mt-1">
        <span :class="{ 'caption-validation-error': isInvalidBodiesRadius }" class="mr-2">Radius</span>
        <input type="number" :class="{ 'input-validation-error': isInvalidBodiesRadius }" v-model.number="bodiesRadius"
          min="1" max="500">
      </div>
      <div>
        <label for="showEngineInternals" class="mr-2 text-gray-900">Show engine internals</label>
        <input id="showEngineInternals" type="checkbox" v-model="showEngineInternals" min="1" max="500" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
      </div>
      <div>
        <button @click="TogglePause" class="mr-2"><fa-icon :icon="togglePauseIcon" /></button>
        <button @click="OpenDimensionEditor" class="bg-transparent text-white-700 font-semibold py-2 px-4">Boundary</button>
      </div>
      <dimension-editor v-if="isDimensionEditorOpened" :dimension="fieldDimension" @apply="ChangeFieldDimension"
        @cancel="CloseDimensionEditor" />
    </aside>
  </div>
</template>

<style scoped>

aside {
  position: absolute;
  padding: 10px;
  margin: 0;
  background-color: #0277bd;
  color: #f5f5f5;
  list-style-type: none;
}

</style>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';

import { App } from './App';
import { SupportedCollisionEngine } from './collision_engines/CollisionEngineFactory';
import DimensionEditor from './DimensionEditor.vue';
import { AppEvent } from './Events';
import HelpPopup from './HelpPopup.vue';

import Viewport from '@/components/Viewport.vue';
import { Dimension } from '@/lib/misc/Primitives';

import "../../css/input.css";

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

  public collisionEngine: SupportedCollisionEngine = 'quad-tree';

  private togglePauseIcons = ['pause', 'play'];
  public togglePauseIcon = this.togglePauseIcons[+false];

  public fps = 0;
  private drawCallCounter = 0;
  private drawCallCounterStart = Date.now();

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

  public async mounted() {
    App.EventBus.Subscribe(AppEvent.TogglePause, pause => this.togglePauseIcon = this.togglePauseIcons[+pause])
    
    this.isUnmounted = false;

    window.addEventListener('resize', this.OnResize);

    this.lastDrawCall = Date.now();
    window.requestAnimationFrame(() => {
      this.Draw(Date.now() - this.lastDrawCall);
    });
  }

  public beforeDestroy() {
    this.isUnmounted = true;
    window.removeEventListener('resize', this.OnResize);
    this.app.Dispose();
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

  public OnWheel(e: WheelEvent) {
    this.app.OnWheel(e);
  }
  /**
   * @param offsetX positive values for moving towards right
   * @param offsetY positive values for moving towards top
   */
  public OnMouseMove(e: MouseEvent) {
    this.app.OnMouseMove(e)
  }

  public OnMouseDown(e: MouseEvent): void {
    this.app.OnMouseDown(e);
  }

  public OnMouseUp(e: MouseEvent): void {
    this.app.OnMouseUp(e);
  }

  public OnKeyDown(e: KeyboardEvent): void {
    this.app.OnKeyDown(e);
  }

  public OnTouchMove(e: TouchEvent): void {
    this.app.OnTouchMove(e);
  }

  public OnTouchStart(e: TouchEvent): void {
    this.app.OnTouchStart(e);
  }

  public OnTouchEnd(e: TouchEvent): void {
    this.app.OnTouchEnd(e);
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

  public TogglePause(): void {
    this.app.Pause = !this.app.Pause;
    this.togglePauseIcon = this.togglePauseIcons[+this.app.Pause];
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
