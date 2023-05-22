<template>
  <div class="flex">
    <Viewport class="outline-none" tabindex="0" :width="width" :height="height" preserveDrawingBuffer="true"
      @context-ready="OnContextReady" @wheel.native.prevent="OnWheel" @mousemove.native="OnMouseMove"
      @mousedown.native="OnMouseDown" @mouseup.native="OnMouseUp" @keydown.native="OnKeyDown"
      @touchmove.native="OnTouchMove" @touchstart.native="OnTouchStart" @touchend.native="OnTouchEnd" />
    <aside v-if="isAppInitialized">
      <div class="absolute text-xs">
        <span>FPS: {{ fps }}</span>
      </div>
      <h3 class="text-center">Collision</h3>
      <help-popup />
      <fieldset class="border border-y-slate-200 border-x-transparent p-2">
        <legend>Detection engine</legend>
        <div>
          <input id="QuadTree" type="radio" name="detectionEngine" value="quad-tree" v-model="collisionEngine" checked />
          <label for="QuadTree">Quad tree</label>
        </div>
        <div>
          <input id="BruteForce" type="radio" value="brute-force" v-model="collisionEngine" name="detectionEngine" />
          <label for="BruteForce">Brute-force</label>
        </div>
      </fieldset>
      <my-tabs v-model="settingsTab" class="mb-2">
        <my-tab :tabid="TabId.Bodies">Bodies</my-tab>
        <my-tab :tabid="TabId.Boundary">Boundary</my-tab>
        <my-tab :tabid="TabId.Engine">Engine</my-tab>
      </my-tabs>
      <my-bodies-settings v-if="IsBodiesTab" v-model="bodies" />
      <my-boundary-settings v-else-if="IsBoundaryTab" v-model="fieldBoundary" />
      <div v-else-if="IsEngineTab">
        <label for="showEngineInternals" class="mr-2">Show engine internals</label>
        <input id="showEngineInternals" type="checkbox" v-model="showEngineInternals" min="1" max="500"
          class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
      </div>
      <div class="flex justify-between">
        <button @click="TogglePause">
          <fa-icon :icon="togglePauseIcon" />
        </button>
        <button @click="ApplySettings" :disabled="!CanApplySettings()" class="">
          <fa-icon icon="save"></fa-icon>
        </button>
      </div>
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
import { AppEvent } from './Events';
import HelpPopup from './HelpPopup.vue';
import MyBodiesSettings, { BodiesSettings } from './MyBodiesSettings.vue';
import MyBoundarySettings, { Boundary } from './MyBoundarySettings.vue';

import { MyTabs, MyTab  } from '@/components/Tabs';
import Viewport from '@/components/Viewport.vue';

import '@/css/button.css';
import '@/css/input.css';

enum TabId {
  Bodies,
  Boundary,
  Engine
}

@Component({
  components: {
    MyBodiesSettings,
    MyBoundarySettings,
    HelpPopup,
    Viewport,
    MyTabs,
    MyTab
  }
})
export default class Main extends Vue {
  public width = 800;
  public height = 600;

  public readonly bodies: BodiesSettings = {
    count: { value: 10000, isValid: true },
    radius: { value: 2, isValid: true }
  };

  public readonly fieldBoundary: Boundary = {
    width: { value: 1000, isValid: true },
    height: { value: 1000, isValid: true }
  };

  public showEngineInternals = false;

  public collisionEngine: SupportedCollisionEngine = 'quad-tree';

  private togglePauseIcons = ['pause', 'play'];
  public togglePauseIcon = this.togglePauseIcons[+false];

  public fps = 0;
  private drawCallCounter = 0;
  private drawCallCounterStart = Date.now();

  private app!: App;
  private isUnmounted!: boolean;
  public isAppInitialized = false;

  public settingsTab = TabId.Bodies;

  @Watch('collisionEngine')
  private CollisionEngineChange(
    value: SupportedCollisionEngine,
    _prev: SupportedCollisionEngine
  ): void {
    this.app.SwitchCollisionEngine(value);
  }

  @Watch('showEngineInternals')
  private ShowEngineInternalsChange(value: boolean, _prev: boolean): void {
    this.app.IsEngineRendererEnabled = value;
  }

  public async mounted() {
    App.EventBus.Subscribe(
      AppEvent.TogglePause,
      pause => (this.togglePauseIcon = this.togglePauseIcons[+pause])
    );

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
    this.app.BodiesCount = this.bodies.count.value;
    this.app.BodiesRadius = this.bodies.radius.value;
    this.app.ResizeField({
      Width: this.fieldBoundary.width.value,
      Height: this.fieldBoundary.height.value
    });

    this.OnResize();

    this.isAppInitialized = true;
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
    this.app.OnMouseMove(e);
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

  public ApplySettings(): void {
    if (this.IsFieldBoundaryWidthDiffer() || this.IsFieldBoundaryHeightDiffer()) {
      this.app.ResizeField({
        Width: this.fieldBoundary.width.value,
        Height: this.fieldBoundary.height.value
      });
    }

    if (this.IsBodiesCountDiffer()) {
      this.app.BodiesCount = this.bodies.count.value;
    }

    if (this.IsBodiesRadiusDiffer()) {
      this.app.BodiesRadius = this.bodies.radius.value;
    }

    this.$forceUpdate();
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

  public get IsBodiesTab(): boolean {
    return this.settingsTab === TabId.Bodies;
  }

  public get IsBoundaryTab(): boolean {
    return this.settingsTab === TabId.Boundary;
  }

  public get IsEngineTab(): boolean {
    return this.settingsTab === TabId.Engine;
  }

  public CanApplySettings(): boolean {
    return (
      this.fieldBoundary.width.isValid &&
      this.fieldBoundary.height.isValid &&
      this.bodies.count.isValid &&
      this.bodies.radius.isValid &&
      this.IsSettingsDiffer()
    );
  }

  private IsSettingsDiffer(): boolean {
    return this.IsFieldBoundaryWidthDiffer() ||
      this.IsFieldBoundaryHeightDiffer() ||
      this.IsBodiesCountDiffer() ||
      this.IsBodiesRadiusDiffer();
  }

  private IsFieldBoundaryWidthDiffer(): boolean {
    return this.app.FieldBoundary.Width !== this.fieldBoundary.width.value;
  }

  private IsFieldBoundaryHeightDiffer(): boolean {
    return this.app.FieldBoundary.Height !== this.fieldBoundary.height.value;
  }

  private IsBodiesCountDiffer(): boolean {
    return this.app.BodiesCount !== this.bodies.count.value;
  }

  private IsBodiesRadiusDiffer(): boolean {
    return this.app.BodiesRadius !== this.bodies.radius.value;
  }

  public get TabId() {
    return TabId;
  }
}
</script>
