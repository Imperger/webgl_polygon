<template>
  <div class="flex">
    <Viewport ref="view" :width="width" :height="height" preserveDrawingBuffer="true" @context-ready="OnContextReady"
      @wheel.native.prevent="OnWheel($event.deltaY, $event.ctrlKey, $event.altKey)"
      @mousemove.native="OnMouseMove($event.buttons, $event.ctrlKey, $event.movementX, $event.movementY)"
      @drop.native.stop.prevent="OnLoadImage($event.dataTransfer.files[0])" @dragover.native.stop.prevent="() => 0" />
    <aside>
      <fai class="panelHelpTrigger" icon="question-circle" />
      <div class="panelHelpContent">
        <ul>
          <li>
            <fai icon="mouse" />&nbsp;
            <span class="accent">LMB</span> - move grid
          </li>
          <li>
            <fai icon="mouse" />&nbsp;
            <span class="accent">WHEEL</span> - scale grid
          </li>
          <li>
            Image controlled in the same way by holding
            <span class="accent">CTRL</span>
          </li>
          <li>
            <fai icon="mouse" />&nbsp;
            <span class="accent">WHEEL</span> + ALT - rotate image
          </li>
        </ul>
      </div>
      <table>
        <thead>
          <tr>
            <th colspan="3">Grid</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Offset</td>
            <td>{{ gridState[0] }}</td>
            <td>{{ gridState[1] }}</td>
          </tr>
          <tr>
            <td>Scale</td>
            <td colspan="2">{{ GridScale.toFixed(4) }}</td>
          </tr>
        </tbody>
      </table>
      <table>
        <thead>
          <tr>
            <th colspan="3">Image</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Offset</td>
            <td>{{ imageState[0].toFixed(1) }}</td>
            <td>{{ imageState[1].toFixed(1) }}</td>
          </tr>
          <tr>
            <td>Angle</td>
            <td colspan="2">{{ ImageAngleDegrees.toFixed(1) }}</td>
          </tr>
          <tr>
            <td>Scale</td>
            <td colspan="2">{{ ImageScale.toFixed(4) }}</td>
          </tr>
        </tbody>
      </table>
      <button @click="CenterImage" :disabled="NoImage" class="rightMargin">Center image</button>
      <button @click="Preview">Save</button>
    </aside>
  </div>
</template>

<style scoped>
@import "../../css/button.css";

.panelHelpTrigger {
  position: absolute;
  font-size: 1.3em;
  top: 5px;
  right: 5px;
}

.panelHelpContent {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  visibility: hidden;
  background-color: black;
}

.panelHelpContent .accent {
  font-weight: bold;
}

.panelHelpContent ul {
  list-style: none;
  padding: 0 8px;
}

.panelHelpContent li {
  margin: 5px;
}

.panelHelpTrigger:hover {
  color: #455a64;
}

.panelHelpTrigger:hover+.panelHelpContent {
  visibility: visible;
}

.rightMargin {
  margin-right: 4px;
}

.flex {
  display: flex;
}

aside {
  position: absolute;
  padding: 5px;
  margin: 0;
  background-color: #0277bd;
  color: #f5f5f5;
  list-style-type: none;
}

aside table {
  width: 100%;
  margin: 3px 0;
}

aside table>thead {
  text-align: center;
}

aside table td:not(:first-child) {
  text-align: right;
}

aside table {
  padding: 2px 1px;
}
</style>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';

import Viewport from '@/components/Viewport.vue';
import { ShaderProgram } from '@/render/ShaderProgram';
import { EventWaiter } from '@/misc/EventWaiter';
import { DataUrlDownloader } from '@/misc/DataUrlDownloader';
import { ToDegrees } from '@/misc/Angle';

import VShader from './grid.vert';
import FShader from './grid.frag';

interface Dimension {
  width: number;
  height: number;
}

@Component({
  components: {
    Viewport
  }
})
export default class Main extends Vue {
  private app!: ShaderProgram;
  private gl!: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject | null = null;
  private vbo: WebGLBuffer | null = null;
  public gridState = [0, 0, 100];
  public imageState = [0, 0, 0, 1];
  public width = 800;
  public height = 600;
  private imgRealDimension: Dimension = { width: 0, height: 0 };
  @Ref() private readonly view!: any;
  public async mounted() {
    this.FillWindow();

    window.addEventListener('resize', () => this.FillWindow());

    this.app = new ShaderProgram(this.gl);

    this.app.Attach(this.gl.FRAGMENT_SHADER, FShader);
    this.app.Attach(this.gl.VERTEX_SHADER, VShader);

    this.app.Link();
    this.app.Use();

    this.SetupBackground();
    this.SetupImage();

    this.gl.disable(this.gl.DEPTH_TEST);

    this.gl.clearColor(1, 1, 1, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.app.SetUniform3fv('u_grid', this.gridState); // [offset_x, offset_y, cell_size_in_window_coords]
    this.app.SetUniform4fv('u_image', this.imageState);

    this.gl.bindVertexArray(this.vao);
    window.requestAnimationFrame(() => this.Draw());
  }
  public beforeDestroy() {
    console.log('unsubscribe from resize event');
  }
  public OnContextReady(ctx: WebGL2RenderingContext) { this.gl = ctx; }
  private SetupBackground() {
    const background = [
      /*triangle 1*/-1, -1, 1, -1, 1, 1,
     /* triangle 2*/1, 1, -1, 1, -1, -1
    ];
    this.vao = this.gl.createVertexArray();
    this.vbo = this.gl.createBuffer();

    this.gl.bindVertexArray(this.vao);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(background), this.gl.STATIC_DRAW);

    const posLoc = this.app.GetAttributeLocation('a_vertex');
    const target = this.app.SetUniform1i('u_target', 0);

    this.gl.enableVertexAttribArray(posLoc);
    this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.bindVertexArray(null);
  }
  private SetupImage() {
    const texture = this.gl.createTexture();
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
  }
  private Draw() {
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    window.requestAnimationFrame(() => this.Draw());
  }
  public OnWheel(offset: number, ctrl: boolean, alt: boolean) {
    if (ctrl)
      this.OnImageScale(offset);
    else if (alt)
      this.OnImageRotate(offset);
    else
      this.OnGridScale(offset);
  }
  /**
   * @param offsetX positive values for moving towards right
   * @param offsetY positive values for moving towards top
   */
  public OnMouseMove(btn: number, ctrl: boolean, offsetX: number, offsetY: number) {
    if (btn & 1) {
      if (ctrl)
        this.OnImageMove(offsetX, offsetY * -1);
      else
        this.OnGridMove(offsetX, offsetY * -1);
    }
  }
  private OnGridScale(offset: number) {
    const step = 1;
    if (offset < 0)
      this.GridScale = this.gridState[2] + step;
    else if (this.gridState[2] > 10)
      this.GridScale = this.gridState[2] - step;
  }
  private OnImageScale(offset: number) {
    const step = 0.01;
    if (offset < 0)
      this.ImageScale = this.imageState[3] + step;
    else if (this.ImageScale > 0.2)
      this.ImageScale = this.imageState[3] - step;
  }
  private OnImageRotate(offset: number) {
    const step = 2 * Math.PI / 360;
    const clip = 2 * Math.PI;
    if (offset > 0)
      this.ImageAngle = (this.imageState[2] + step) % clip;
    else if (this.imageState[2] < step)
      this.ImageAngle = clip - (step - this.imageState[2]);
    else
      this.ImageAngle = this.imageState[2] - step;
  }
  private OnGridMove(offsetX: number, offsetY: number) {
    this.$set(this.gridState, 0, this.gridState[0] + offsetX);
    this.$set(this.gridState, 1, this.gridState[1] + offsetY);
  }
  private OnImageMove(offsetX: number, offsetY: number) {
    this.ImageOffset = { x: this.imageState[0] + offsetX, y: this.imageState[1] + offsetY };
  }
  private set ImageOffset(offset: { x: number, y: number }) {
    this.$set(this.imageState, 0, offset.x);
    this.$set(this.imageState, 1, offset.y);
  }
  private get ImageOffset() { return { x: this.imageState[0], y: this.imageState[1] }; }
  public set GridScale(val: number) { this.$set(this.gridState, 2, val); }
  public get GridScale() { return this.gridState[2]; }
  public set ImageScale(val: number) { this.$set(this.imageState, 3, val); }
  public get ImageScale() { return this.imageState[3]; }
  private get ImageAngle() { return this.imageState[2]; }
  private set ImageAngle(angle: number) { this.$set(this.imageState, 2, angle); }
  public get ImageAngleDegrees() { return ToDegrees(this.ImageAngle); }
  private get ImageDimension(): Dimension {
    return {
      width: this.imgRealDimension.width * this.imageState[3],
      height: this.imgRealDimension.height * this.imageState[3]
    }
  }

  public get NoImage(): boolean { return this.imgRealDimension.width === 0 }

  @Watch('gridState')
  private OnGridUpdate() {
    this.app.SetUniform3fv('u_grid', this.gridState); // [offset_x, offset_y, cell_size_in_window_coords]
  }
  @Watch('imageState')
  private OnImageUpdate() {
    this.app.SetUniform4fv('u_image', this.imageState);
  }
  public async OnLoadImage(blob: File) {
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    await EventWaiter(img, 'load');

    this.imgRealDimension = { width: img.width, height: img.height };
    this.ImageOffset = { x: 0, y: 0 };
    this.ImageScale = this.AutoScale(img.width, img.height);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
  }
  private AutoScale(width: number, height: number) {
    return width > height ? this.width / width : this.height / height;
  }
  private FillWindow() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  }
  public CenterImage() {
    this.ImageOffset = { x: this.width / 2 - this.ImageDimension.width / 2, y: this.height / 2 - this.ImageDimension.height / 2 };
  }
  public Preview() {
    DataUrlDownloader(this.view.canvas.toDataURL(), 'image.png');
  }
}
</script>