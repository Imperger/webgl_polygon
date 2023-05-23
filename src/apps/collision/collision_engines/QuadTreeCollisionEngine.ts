import { CircleCollider } from '../CircleCollider';
import { MovingCircleCollider } from '../models/MovingCircleCollider';

import { CollisionEngine } from './CollisionEngine';
import { QuadTreeRenderer } from './renderers/QuadTreeRenderer';

import { Shape } from '@/lib/math/Shape';

export class Boundary {
  constructor(
    public X: number,
    public Y: number,
    public Width: number,
    public Height: number
  ) {}

  get Right(): number {
    return this.X + this.Width;
  }
  get Top(): number {
    return this.Y + this.Height;
  }

  IsIntersect(circle: CircleCollider): boolean {
    return Shape.RectangleCircleIntersect(this, circle);
  }

  public IsContain(circle: CircleCollider): boolean {
    if (circle.Center.X - circle.Radius < this.X) {
      return false;
    }

    if (circle.Center.X + circle.Radius > this.Right) {
      return false;
    }

    if (circle.Center.Y - circle.Radius < this.Y) {
      return false;
    }

    if (circle.Center.Y + circle.Radius > this.Top) {
      return false;
    }

    return true;
  }
}

interface QuadNodePoolItem<TCollider extends CircleCollider> {
  node: QuadNode<TCollider>;
  nextFree: number;
}

interface QuadNodePoolCreateResult<TCollider extends CircleCollider> {
  idx: number;
  node: QuadNode<TCollider>;
}

export class QuadNodePool<TCollider extends CircleCollider> {
  private static readonly NoNext = -1;
  private static readonly GrowthFactor = 2;

  private nextFree = QuadNodePool.NoNext;
  private pool: QuadNodePoolItem<TCollider>[] = [];

  Create(): QuadNodePoolCreateResult<TCollider> {
    if (this.IsFull) {
      this.Expand();
    }

    const free = this.pool[this.nextFree];
    const idx = this.nextFree;

    this.nextFree = free.nextFree;

    return { idx, node: free.node };
  }

  Free(roomIdx: number): void {
    this.pool[roomIdx].nextFree = this.nextFree;
    this.nextFree = roomIdx;
  }

  At(roomIdx: number): QuadNode<TCollider> {
    return this.pool[roomIdx].node;
  }

  private Expand(): void {
    this.nextFree = this.pool.length;

    this.pool = Array.from({ length: this.ExtendedSize }, (_x, n) => {
      const node =
        n < this.pool.length
          ? this.pool[n].node
          : new QuadNode<TCollider>(new Boundary(0, 0, 0, 0));

      return { node, nextFree: n + 1 };
    });

    this.pool[this.pool.length - 1].nextFree = QuadNodePool.NoNext;
  }

  private get IsFull(): boolean {
    return this.nextFree === QuadNodePool.NoNext;
  }

  private get ExtendedSize(): number {
    return this.pool.length === 0
      ? QuadNodePool.GrowthFactor
      : this.pool.length * QuadNodePool.GrowthFactor;
  }
}

export class QuadNode<TCollider extends CircleCollider> {
  private static readonly ChildrenPerNode = 4;
  private static readonly NullNode = -1;
  private static readonly MaxDepth = 8;
  private static readonly Capacity = 16;
  private static readonly CollapseRatio = 0.25;

  private readonly objects: TCollider[] = [];
  public childStart = QuadNode.NullNode;

  constructor(
    public readonly boundary: Boundary,
    private parent: number = QuadNode.NullNode,
    private isLeaf = true,
    private depth: number = 1
  ) {}

  Add(
    obj: TCollider,
    leafs: Set<number>,
    nodePool: QuadNodePool<TCollider>
  ): boolean {
    if (!this.boundary.IsIntersect(obj)) {
      return false;
    }

    if (this.IsLeaf) {
      if (this.NeedSplit) {
        this.Split(leafs, nodePool);

        return this.AddToChildren(obj, leafs, nodePool);
      } else if (!this.objects.includes(obj)) {
        this.objects.push(obj);
      }
    } else {
      return this.AddToChildren(obj, leafs, nodePool);
    }

    return true;
  }

  AddToChildren(
    obj: TCollider,
    leafs: Set<number>,
    nodePool: QuadNodePool<TCollider>
  ): boolean {
    let added = false;

    for (let n = 0; n < QuadNode.ChildrenPerNode; ++n) {
      added ||= nodePool.At(this.childStart + n).Add(obj, leafs, nodePool);
    }

    return added;
  }

  ForEachChild<TFn extends (val: QuadNode<TCollider>, idx: number) => void>(
    fn: TFn,
    nodePool: QuadNodePool<TCollider>
  ): void {
    for (let n = 0; n < QuadNode.ChildrenPerNode; ++n) {
      const idx = this.childStart + n;
      fn(nodePool.At(idx), idx);
    }
  }

  FindNodeContaining(
    obj: TCollider,
    nodePool: QuadNodePool<TCollider>
  ): number[] {
    const quads: number[] = [];

    const search = (nodeIdx: number) => {
      const node = nodePool.At(nodeIdx);

      if (!node.boundary.IsIntersect(obj)) {
        return;
      }

      if (node.isLeaf) {
        if (node.objects.indexOf(obj) >= 0) {
          quads.push(nodeIdx);
        }
      } else {
        node.ForEachChild((_child, idx) => search(idx), nodePool);
      }
    };

    search(this.PoolIdx(nodePool));

    return quads;
  }

  FilterCollided(circle: TCollider): TCollider[] {
    return this.objects.filter(
      object => circle !== object && object.IsCollide(circle)
    );
  }

  RecalculateBucket(
    root: QuadNode<TCollider>,
    leafs: Set<number>,
    nodePool: QuadNodePool<TCollider>
  ): void {
    const outOfNode: TCollider[] = [];

    leafs.forEach(leafIdx => {
      const leaf = nodePool.At(leafIdx);

      for (let n = 0, step = 1; n < leaf.objects.length; n += step) {
        const obj = leaf.objects[n];
        if (!leaf.boundary.IsIntersect(obj)) {
          leaf.RemoveFromNodes(obj, [leafIdx], leafs, nodePool);

          outOfNode.push(obj);

          step = 0;
        } else if (!leaf.boundary.IsContain(obj)) {
          outOfNode.push(obj);
          step = 1;
        } else {
          step = 1;
        }
      }
    });

    outOfNode.forEach(obj => root.Add(obj, leafs, nodePool));
  }

  RemoveFromNodes(
    obj: TCollider,
    nodesIdx: number[],
    leafs: Set<number>,
    nodePool: QuadNodePool<TCollider>
  ): boolean {
    if (nodesIdx.length === 0) {
      return false;
    }

    nodesIdx.forEach(nodeIdx => {
      const node = nodePool.At(nodeIdx);

      const remove = node.objects.indexOf(obj);
      if (remove >= 0) {
        node.objects.splice(remove, 1);
      }
    });

    for (const node of nodesIdx) {
      for (
        let collapseCandidate = node;
        collapseCandidate !== QuadNode.NullNode &&
        nodePool.At(collapseCandidate).NeedCollapse(nodePool);
        collapseCandidate = nodePool.At(collapseCandidate).parent
      ) {
        nodePool.At(collapseCandidate).Collapse(leafs, nodePool);
      }
    }

    return true;
  }

  Remove(
    obj: TCollider,
    leafs: Set<number>,
    nodePool: QuadNodePool<TCollider>
  ): boolean {
    return this.RemoveFromNodes(
      obj,
      this.FindNodeContaining(obj, nodePool),
      leafs,
      nodePool
    );
  }

  get HasChild(): boolean {
    return this.childStart !== QuadNode.NullNode;
  }

  Size(nodePool: QuadNodePool<TCollider>): number {
    return QuadNode.Size(this.PoolIdx(nodePool), nodePool);
  }

  private PoolIdx(nodePool: QuadNodePool<TCollider>): number {
    if (this.isLeaf) {
      if (this.parent === QuadNode.NullNode) {
        return 0;
      } else {
        const parent = nodePool.At(this.parent);
        for (let n = 0; n < QuadNode.ChildrenPerNode; ++n) {
          const idx = parent.childStart + n;

          if (nodePool.At(idx) === this) {
            return idx;
          }
        }
      }
    } else {
      return nodePool.At(this.childStart).parent;
    }

    return QuadNode.NullNode;
  }

  private get IsLeaf() {
    return this.isLeaf;
  }

  // Can be called only on leaf node
  private get NeedSplit() {
    return (
      this.objects.length >= QuadNode.Capacity && this.depth < QuadNode.MaxDepth
    );
  }

  // Can be called only on leaf node
  private NeedCollapse(nodePool: QuadNodePool<TCollider>): boolean {
    return (
      this.objects.length / QuadNode.Capacity < QuadNode.CollapseRatio &&
      this.parent !== QuadNode.NullNode &&
      QuadNode.Size(this.parent, nodePool) <= QuadNode.Capacity
    );
  }

  private Split(leafs: Set<number>, nodePool: QuadNodePool<TCollider>) {
    const halfWidth = this.boundary.Width / 2;
    const halfHeight = this.boundary.Height / 2;

    const firstChild = nodePool.Create();
    const idx = this.PoolIdx(nodePool);

    QuadNode.ConstructInPlace(firstChild.node, {
      boundary: new Boundary(
        this.boundary.X + halfWidth,
        this.boundary.Y + halfHeight,
        halfWidth,
        halfHeight
      ),
      parent: idx,
      isLeaf: true,
      depth: this.depth + 1
    });

    this.childStart = firstChild.idx;

    QuadNode.ConstructInPlace(nodePool.Create().node, {
      boundary: new Boundary(
        this.boundary.X,
        this.boundary.Y + halfHeight,
        halfWidth,
        halfHeight
      ),
      parent: idx,
      isLeaf: true,
      depth: this.depth + 1
    });

    QuadNode.ConstructInPlace(nodePool.Create().node, {
      boundary: new Boundary(
        this.boundary.X,
        this.boundary.Y,
        halfWidth,
        halfHeight
      ),
      parent: idx,
      isLeaf: true,
      depth: this.depth + 1
    });

    QuadNode.ConstructInPlace(nodePool.Create().node, {
      boundary: new Boundary(
        this.boundary.X + halfWidth,
        this.boundary.Y,
        halfWidth,
        halfHeight
      ),
      parent: idx,
      isLeaf: true,
      depth: this.depth + 1
    });

    this.objects.forEach(obj => {
      const added = this.AddToChildren(obj, leafs, nodePool);

      if (!added) {
        throw new Error(
          'Leaf has object that not fit. Probably some mistake in RecalculateBucket implementation'
        );
      }
    });

    this.objects.splice(0);
    this.isLeaf = false;

    leafs.delete(idx);
    this.ForEachChild((_leaf, idx) => leafs.add(idx), nodePool);
  }

  // Can be called only on leaf node with parent
  private Collapse(
    leafs: Set<number>,
    nodePool: QuadNodePool<TCollider>
  ): void {
    if (this.parent === QuadNode.NullNode) {
      throw new Error("Can't collapse a root node");
    }

    if (!this.IsLeaf) {
      throw new Error("Can't collapse a non leaf node");
    }

    const receiver = new Set<TCollider>();
    const gather = (node: QuadNode<TCollider>) => {
      if (node.IsLeaf) {
        node.objects.forEach(obj => receiver.add(obj));
        node.objects.splice(0);
        leafs.delete(node.PoolIdx(nodePool));
      } else {
        node.ForEachChild(node => gather(node), nodePool);
      }
    };

    const parent = nodePool.At(this.parent);
    gather(parent);

    for (
      let childOffset = QuadNode.ChildrenPerNode - 1;
      childOffset >= 0;
      --childOffset
    ) {
      nodePool.Free(parent.childStart + childOffset);
    }

    parent.objects.push(...receiver);
    parent.isLeaf = true;
    parent.childStart = QuadNode.NullNode;

    leafs.add(parent.PoolIdx(nodePool));
  }

  public static Size<TCollider extends CircleCollider>(
    nodeIdx: number,
    nodePool: QuadNodePool<TCollider>
  ): number {
    const node = nodePool.At(nodeIdx);

    if (node.IsLeaf) {
      return node.objects.length;
    } else {
      let sum = 0;

      for (let n = 0; n < QuadNode.ChildrenPerNode; ++n) {
        sum += QuadNode.Size(node.childStart + n, nodePool);
      }

      return sum;
    }
  }

  public static *ObjectIterator<TCollider extends CircleCollider>(
    node: QuadNode<TCollider>
  ) {
    for (const object of node.objects) {
      yield object;
    }
  }

  public static ConstructInPlace<TCollider extends CircleCollider>(
    target: QuadNode<TCollider>,
    args: {
      boundary: Boundary;
      parent?: number;
      isLeaf?: boolean;
      depth?: number;
    }
  ): QuadNode<TCollider> {
    const fullArgs = {
      parent: QuadNode.NullNode,
      isLeaf: true,
      depth: 1,
      ...args
    };

    target.boundary.X = fullArgs.boundary.X;
    target.boundary.Y = fullArgs.boundary.Y;
    target.boundary.Width = fullArgs.boundary.Width;
    target.boundary.Height = fullArgs.boundary.Height;

    target.objects.splice(0);
    target.parent = fullArgs.parent;
    target.isLeaf = fullArgs.isLeaf;
    target.depth = fullArgs.depth;
    target.childStart = QuadNode.NullNode;

    return target;
  }
}

export class QuadTreeCollisionEngine
  implements CollisionEngine<MovingCircleCollider>
{
  public root: QuadNode<MovingCircleCollider>;
  private readonly leafs = new Set<number>();
  private nodePool: QuadNodePool<MovingCircleCollider>;

  constructor(
    private readonly boundary: Boundary,
    private renderer: QuadTreeRenderer
  ) {
    this.nodePool = new QuadNodePool<MovingCircleCollider>();
    const fromPool = this.nodePool.Create();
    QuadNode.ConstructInPlace(fromPool.node, { boundary: this.boundary });
    this.root = fromPool.node;
    this.leafs.add(fromPool.idx);

    this.renderer.RootFetcher = () => this.root;
    this.renderer.NodePoolFetcher = () => this.nodePool;
  }

  Add(object: MovingCircleCollider): boolean {
    return this.root.Add(object, this.leafs, this.nodePool);
  }

  Remove(object: MovingCircleCollider): boolean {
    return this.root.Remove(object, this.leafs, this.nodePool);
  }

  RecalculateBuckets(): void {
    this.root.RecalculateBucket(this.root, this.leafs, this.nodePool);
  }

  FindCollisions(object: MovingCircleCollider): MovingCircleCollider[] {
    const nodes = this.root.FindNodeContaining(object, this.nodePool);

    return nodes.flatMap(node =>
      this.nodePool.At(node).FilterCollided(object)
    );
  }

  ForEachCollided(
    handler: (a: MovingCircleCollider, b: MovingCircleCollider) => void
  ): void {
    this.leafs.forEach(leaf => {
      const bodies = [...QuadNode.ObjectIterator(this.nodePool.At(leaf))];

      for (let aIdx = 0; aIdx < bodies.length; ++aIdx) {
        for (let bIdx = aIdx + 1; bIdx < bodies.length; ++bIdx) {
          const a = bodies[aIdx];
          const b = bodies[bIdx];

          if (a.IsCollide(b)) {
            handler(a, b);
          }
        }
      }
    });
  }

  Reset(): void {
    this.leafs.clear();

    this.nodePool = new QuadNodePool<MovingCircleCollider>();
    const fromPool = this.nodePool.Create();
    QuadNode.ConstructInPlace(fromPool.node, { boundary: this.boundary });
    this.root = fromPool.node;
    this.leafs.add(fromPool.idx);
  }

  Draw(elapsed: number): void {
    this.renderer.Draw(elapsed);
  }
}
