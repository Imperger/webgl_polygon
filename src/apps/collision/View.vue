<template>
  <div class="flex">
    <Viewport class="outline-none" tabindex="0" :width="width" :height="height" preserveDrawingBuffer="true"
      @context-ready="OnContextReady" @wheel.native.prevent="OnWheel" @mousemove.native="OnMouseMove"
      @mousedown.native="OnMouseDown" @mouseup.native="OnMouseUp" @keydown.native="OnKeyDown"
      @touchmove.native="OnTouchMove" @touchstart.native="OnTouchStart" @touchend.native="OnTouchEnd" />
    <my-aside-panel v-if="isAppInitialized" :app="app" v-model="state" />
  </div>
</template>

<style scoped></style>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { App } from './App';
import { SupportedCollisionEngine } from './collision_engines/CollisionEngineFactory';
import MyAsidePanel from './MyAsidePanel.vue';
import { BodiesSettings } from './MyBodiesSettings.vue';
import { Boundary } from './MyBoundarySettings.vue';

import Viewport from '@/components/Viewport.vue';

import '@/css/button.css';
import '@/css/input.css';

export interface AppState {
  engine: SupportedCollisionEngine,
  bodies: BodiesSettings;
  boundary: Boundary;
  showEngineInternals: boolean;
  fps: number;
}

@Component({
  components: {
    MyAsidePanel,
    Viewport
  }
})
export default class Main extends Vue {
  public width = 800;
  public height = 600;

  public readonly state: AppState = {
    engine: 'quad-tree',
    bodies: {
      count: { value: 10000, isValid: true },
      radius: { value: 2, isValid: true }
    },
    boundary: {
      width: { value: 1000, isValid: true },
      height: { value: 1000, isValid: true }
    },
    showEngineInternals: false,
    fps: 0
  };

  private drawCallCounter = 0;
  private drawCallCounterStart = Date.now();

  public app!: App;
  private isUnmounted!: boolean;
  public isAppInitialized = false;

  public async mounted() {
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
    this.app = new App(ctx, this.state.engine);
    this.app.BodiesCount = this.state.bodies.count.value;
    this.app.BodiesRadius = this.state.bodies.radius.value;
    this.app.ResizeField({
      Width: this.state.boundary.width.value,
      Height: this.state.boundary.height.value
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
      this.state.fps = Math.round(this.drawCallCounter * (elapsed / 1000));

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

  private OnResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.app.ResizeView({ Width: this.width, Height: this.height });
  }
}
</script>
