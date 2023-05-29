import { QuadNode, QuadNodePool } from '../QuadTreeCollisionEngine';

import { EngineRenderer } from './EngineRenderer';
import FQuadTreeNode from './QuadTreeNode.frag';
import VQuadTreeNode from './QuadTreeNode.vert';

import { NotNull } from '@/lib/misc/NotNull';
import { RVec2, RVec3 } from '@/lib/render/Primitives';
import { ShaderProgram } from '@/lib/render/ShaderProgram';

export class QuadTreeRenderer implements EngineRenderer {
  private nodesVbo!: WebGLBuffer;
  private nodesVao!: WebGLVertexArrayObject;
  private nodesShader!: ShaderProgram;
  private nodesAttributes!: Float32Array;

  private colorConfig = {
    default: [0.5, 0.5, 0.5]
  };

  public RootFetcher!: () => QuadNode;

  public NodePoolFetcher!: () => QuadNodePool;

  constructor(private gl: WebGL2RenderingContext) {
    this.Setup();
  }

  ResizeView(resolution: RVec2): void {
    this.nodesShader.SetUniform2fv('u_resolution', resolution);
  }

  Camera(camera: RVec3): void {
    this.nodesShader.SetUniform3fv('u_cam', camera);
  }

  Draw(_elapsed: number): void {
    const attributes: number[] = [];
    this.CollectNodeBounds(this.Root, attributes);
    this.nodesAttributes = new Float32Array(attributes);

    this.nodesShader.Use();

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nodesVbo);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.nodesAttributes,
      this.gl.DYNAMIC_DRAW
    );

    this.gl.bindVertexArray(this.nodesVao);
    this.gl.drawArrays(this.gl.LINES, 0, this.nodesAttributes.length / 2);
  }

  private CollectNodeBounds(node: QuadNode, receiver: number[]) {
    if (!node.HasChild) {
      return;
    }

    const halfWidth = node.boundary.Width / 2;
    const halfHeight = node.boundary.Height / 2;

    receiver.push(node.boundary.X + halfWidth, node.boundary.Y);
    receiver.push(node.boundary.X + halfWidth, node.boundary.Top);

    receiver.push(node.boundary.X, node.boundary.Y + halfHeight);
    receiver.push(node.boundary.Right, node.boundary.Y + halfHeight);

    node.ForEachChild(
      node => this.CollectNodeBounds(node, receiver),
      this.NodePoolFetcher()
    );
  }

  private Setup(): void {
    this.nodesVbo = this.gl.createBuffer() ?? NotNull();
    this.nodesVao = this.gl.createVertexArray() ?? NotNull();

    this.nodesShader = new ShaderProgram(this.gl);
    this.nodesShader.Attach(this.gl.FRAGMENT_SHADER, FQuadTreeNode);
    this.nodesShader.Attach(this.gl.VERTEX_SHADER, VQuadTreeNode);
    this.nodesShader.Link();
    this.nodesShader.Use();

    const FloatSize = Float32Array.BYTES_PER_ELEMENT;
    const ComponentsCount = 2;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nodesVbo);

    this.gl.bindVertexArray(this.nodesVao);

    const posLoc = this.nodesShader.GetAttributeLocation('a_vertex');
    this.gl.enableVertexAttribArray(posLoc);
    this.gl.vertexAttribPointer(
      posLoc,
      2,
      this.gl.FLOAT,
      false,
      FloatSize * ComponentsCount,
      0
    );

    this.gl.bindVertexArray(null);

    this.nodesShader.SetUniform3fv('u_color', this.colorConfig.default);
  }

  private get Root(): QuadNode {
    return this.RootFetcher();
  }
}
