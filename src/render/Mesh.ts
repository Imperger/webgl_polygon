import { VERTEX_IDX } from './Constants';

export class Mesh {
    private size = 0;
    protected vao: WebGLVertexArrayObject | null = null;
    protected vbo: WebGLBuffer | null = null;
    public constructor(protected gl: WebGL2RenderingContext) { }
    public Load(vertices: number[]) {
        this.size = vertices.length;
        this.vao = this.gl.createVertexArray();
        this.vbo = this.gl.createBuffer();

        this.gl.bindVertexArray(this.vao);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

        this.gl.enableVertexAttribArray(VERTEX_IDX);
        const stride = (3 + 2 + 3) * Float32Array.BYTES_PER_ELEMENT;
        this.gl.vertexAttribPointer(VERTEX_IDX, 3, this.gl.FLOAT, false, stride, 0);

        this.gl.bindVertexArray(null);
    }
    public Draw() {
        this.gl.bindVertexArray(this.vao);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.size);
    }
}
