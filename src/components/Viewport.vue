<template>
  <canvas ref="canvas" :style="{ width: Width, height: Height }"></canvas>
</template>

<style scoped>
</style>

<script lang="ts">
import { Component, Emit, Prop, Ref, Vue, Watch } from 'vue-property-decorator';

@Component
export default class Viewport extends Vue {
  @Prop() public readonly width!: number;
  @Prop() public readonly height!: number;
  @Prop({ default: false }) public readonly preserveDrawingBuffer!: boolean;
  @Ref() public readonly canvas!: HTMLCanvasElement;
  @Emit('context-ready') public ContextReady(_ctx: WebGL2RenderingContext) { /** Nope */ }
  private context: WebGL2RenderingContext | null = null;

  public get Width() { return this.width + 'px' ?? '100%'; }
  public get Height() { return this.height + 'px' ?? '100%'; }
  public async mounted() {
    this.context = this.canvas.getContext('webgl2', { preserveDrawingBuffer: this.preserveDrawingBuffer });
    if (this.context === null) {
      console.error('Can\'t initialize webgl2 context');
      return;
    }
    this.UpdateViewport();
    this.context.enable(this.context.CULL_FACE);
    this.context.enable(this.context.DEPTH_TEST);
    this.ContextReady(this.context);
  }
  @Watch('width')
  private OnWidth() {
    this.UpdateViewport();
  }
  @Watch('height')
  private OnHeight() {
    this.UpdateViewport();
  }
  private UpdateViewport() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.context?.viewport(0, 0, this.width, this.height);
  }
}
</script>