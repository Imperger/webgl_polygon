<template>
  <div class="flex">
    <Viewport
      ref="view"
      :width="width"
      :height="height"
      preserveDrawingBuffer="true"
      @context-ready="OnContextReady"
      @wheel.native.prevent="OnWheel($event.deltaY, $event.ctrlKey)"
      @mousemove.native="OnMouseMove($event.buttons, $event.ctrlKey, $event.movementX, $event.movementY)"
      @drop.native.stop.prevent="OnLoadImage($event.dataTransfer.files[0])"
      @dragover.native.stop.prevent="_=>_"
    />
    <aside>
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
            <td>{{ imageState[0] }}</td>
            <td>{{ imageState[1] }}</td>
          </tr>
          <tr>
            <td>Scale</td>
            <td colspan="2">{{ ImageScale.toFixed(4) }}</td>
          </tr>
        </tbody>
      </table>
      <button @click="CenterImage" class="rightMargin">Center image</button>
      <button @click="Preview">Save</button>
    </aside>
  </div>
</template>

<style scoped>
@import '../../css/button.css';
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
aside table > thead {
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
import { Component, Emit, Mixins, Model, Prop, Ref, Vue, Watch } from 'vue-property-decorator';

import Viewport from '@/components/Viewport.vue';
import { ShaderProgram } from '@/render/ShaderProgram';
import { Mesh } from '@/render/Mesh';
import { ObjLoader } from '@/formats/ObjLoader';
import { EventWaiter } from '@/misc/EventWaiter';
import { DataUrlDownloader } from '@/misc/DataUrlDownloader';

import VShader from './grid.vert';
import FShader from './grid.frag';

@Component({
  components: {
    Viewport
  }
})
export default class Main extends Vue {
  private app!: ShaderProgram;
  private mesh!: Mesh;
  private gl!: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject | null = null;
  private vbo: WebGLBuffer | null = null;
  private gridState = [0, 0, 66];
  private imageState = [0, 0, 1];
  private width = 800;
  private height = 600;
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
    this.app.SetUniform3fv('u_image', this.imageState);

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
  private OnWheel(offset: number, ctrl: boolean) {
    if (ctrl)
      this.OnImageScale(offset);
    else
      this.OnGridScale(offset);
  }
  private OnMouseMove(btn: number, ctrl: boolean, offsetX: number, offsetY: number) {
    if (btn & 1) {
      if (ctrl)
        this.OnImageMove(offsetX, offsetY);
      else
        this.OnGridMove(offsetX, offsetY);
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
      this.ImageScale = this.imageState[2] + step;
    else if (this.ImageScale > 0.2)
      this.ImageScale = this.imageState[2] - step;
  }
  private OnGridMove(offsetX: number, offsetY: number) {
    this.$set(this.gridState, 0, this.gridState[0] - offsetX);
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
  private set GridScale(val: number) { this.$set(this.gridState, 2, val); }
  private get GridScale() { return this.gridState[2]; }
  private set ImageScale(val: number) { this.$set(this.imageState, 2, val); }
  private get ImageScale() { return this.imageState[2]; }
  @Watch('gridState')
  private OnGridUpdate() {
    this.app.SetUniform3fv('u_grid', this.gridState); // [offset_x, offset_y, cell_size_in_window_coords]
  }
  @Watch('imageState')
  private OnImageUpdate() {
    this.app.SetUniform3fv('u_image', this.imageState);
  }
  private async OnLoadImage(blob: File) {
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    await EventWaiter(img, 'load');

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
  private CenterImage() {
    this.ImageOffset = { x: 0, y: 0 };
  }
  private Preview() {
    DataUrlDownloader(this.view.canvas.toDataURL(), 'image.png');
  }
}
</script>