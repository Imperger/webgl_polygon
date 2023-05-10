import { CircleCollider } from '../CircleCollider';
import { MovingCircleCollider } from '../models/MovingCircleCollider';

import { CollisionEngine } from './CollisionEngine';
import { QuadTreeRenderer } from './renderers/QuadTreeRenderer';

export class Boundary {
  constructor(
    private readonly x: number,
    private readonly y: number,
    private readonly width: number,
    private readonly height: number
  ) {}

  get X(): number {
    return this.x;
  }
  get Y(): number {
    return this.y;
  }
  get Width(): number {
    return this.width;
  }
  get Height(): number {
    return this.height;
  }
  get Right(): number {
    return this.x + this.width;
  }
  get Top(): number {
    return this.y + this.height;
  }

  IsIntersect(circle: CircleCollider): boolean {
    const circleDistanceX = Math.abs(
      circle.Center.X - (this.x + this.width / 2)
    );
    const circleDistanceY = Math.abs(
      circle.Center.Y - (this.y + this.height / 2)
    );

    if (circleDistanceX > this.width / 2 + circle.Radius) {
      return false;
    }
    if (circleDistanceY > this.height / 2 + circle.Radius) {
      return false;
    }

    if (circleDistanceX <= this.width / 2) {
      return true;
    }
    if (circleDistanceY <= this.height / 2) {
      return true;
    }

    const cornerDistance_sq =
      (circleDistanceX - this.width / 2) ** 2 +
      (circleDistanceY - this.height / 2) ** 2;

    return cornerDistance_sq <= circle.Radius ** 2;
  }

  public IsContain(circle: CircleCollider): boolean {
    if (circle.Center.X - circle.Radius < this.x) {
      return false;
    }

    if (circle.Center.X + circle.Radius > this.Right) {
      return false;
    }

    if (circle.Center.Y - circle.Radius < this.y) {
      return false;
    }

    if (circle.Center.Y + circle.Radius > this.Top) {
      return false;
    }

    return true;
  }
}

export class QuadNode<TCollider extends CircleCollider> {
  private static readonly MaxDepth = 8;
  private static readonly Capacity = 16;
  private static readonly CollapseRatio = 0.25;

  private readonly objects: TCollider[] = [];
  public readonly nodes: QuadNode<TCollider>[] = [];

  constructor(
    public readonly boundary: Boundary,
    private parent: QuadNode<TCollider> | null = null,
    private isLeaf = true,
    private readonly depth: number = 1
  ) {}

  Add(
    obj: TCollider,
    leafs: Set<QuadNode<TCollider>>,
    nosplit = false
  ): boolean {
    if (!this.boundary.IsIntersect(obj)) {
      return false;
    }

    if (this.IsLeaf) {
      if (!nosplit && this.NeedSplit) {
        this.Split(leafs);

        return this.nodes
          .map(node => node.Add(obj, leafs, nosplit))
          .some(x => x);
      } else if (!this.objects.includes(obj)) {
        this.objects.push(obj);
      }
    } else {
      return this.nodes
        .map(node => node.Add(obj, leafs, nosplit))
        .some(x => x);
    }

    return true;
  }

  FindNodeContaining(obj: TCollider): QuadNode<TCollider>[] {
    const quads: QuadNode<TCollider>[] = [];

    const search = (node: QuadNode<TCollider>) => {
      if (!node.boundary.IsIntersect(obj)) {
        return;
      }

      if (node.isLeaf) {
        if (node.objects.indexOf(obj) >= 0) {
          quads.push(node);
        }
      } else {
        node.nodes.forEach(child => search(child));
      }
    };

    search(this);

    return quads;
  }

  FilterCollided(circle: TCollider): TCollider[] {
    return this.objects.filter(
      object => circle !== object && object.IsCollide(circle)
    );
  }

  RecalculateBucket(
    root: QuadNode<TCollider>,
    leafs: Set<QuadNode<TCollider>>
  ): void {
    if (this.isLeaf) {
      const outOfNode: TCollider[] = [];
      for (let n = 0, step = 1; n < this.objects.length; n += step) {
        const obj = this.objects[n];
        if (!this.boundary.IsIntersect(obj)) {
          this.objects.splice(n, 1);

          outOfNode.push(obj);

          step = 0;
        } else if (!this.boundary.IsContain(obj)) {
          outOfNode.push(obj);
          step = 1;
        } else {
          step = 1;
        }
      }

      outOfNode.forEach(obj => root.Add(obj, leafs, true));

      if (this.NeedCollapse) {
        this.Collapse(leafs);

        this.parent?.RecalculateBucket(root, leafs);
      }
    } else {
      this.nodes.forEach(node => node.RecalculateBucket(root, leafs));
    }

    if (this === root) {
      const processLeafs = (node: QuadNode<TCollider>) => {
        if (node.isLeaf) {
          if (node.NeedSplit) {
            node.Split(leafs);
          }
        } else {
          node.nodes.forEach(node => processLeafs(node));
        }
      };

      processLeafs(this);
    }
  }

  Remove(obj: TCollider, leafs: Set<QuadNode<TCollider>>): boolean {
    const nodes = this.FindNodeContaining(obj);

    if (nodes.length === 0) {
      return false;
    }

    nodes.forEach(node => {
      const remove = node.objects.indexOf(obj);
      if (remove >= 0) {
        node.objects.splice(remove, 1);
      }
    });

    for (const node of nodes) {
      for (
        let collapseCandidate: QuadNode<TCollider> | null = node;
        collapseCandidate && collapseCandidate.NeedCollapse;
        collapseCandidate = collapseCandidate.parent
      ) {
        collapseCandidate.Collapse(leafs);
      }
    }

    return true;
  }

  get Size(): number {
    return QuadNode.Size(this);
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
  private get NeedCollapse(): boolean {
    return (
      this.objects.length / QuadNode.Capacity < QuadNode.CollapseRatio &&
      this.parent !== null &&
      this.parent.nodes.reduce((acc, node) => acc + QuadNode.Size(node), 0) <=
        QuadNode.Capacity
    );
  }

  private Split(leafs: Set<QuadNode<TCollider>>) {
    const halfWidth = this.boundary.Width / 2;
    const halfHeight = this.boundary.Height / 2;

    this.nodes.push(
      new QuadNode(
        new Boundary(
          this.boundary.X + halfWidth,
          this.boundary.Y + halfHeight,
          halfWidth,
          halfHeight
        ),
        this,
        true,
        this.depth + 1
      )
    );
    this.nodes.push(
      new QuadNode(
        new Boundary(
          this.boundary.X,
          this.boundary.Y + halfHeight,
          halfWidth,
          halfHeight
        ),
        this,
        true,
        this.depth + 1
      )
    );
    this.nodes.push(
      new QuadNode(
        new Boundary(this.boundary.X, this.boundary.Y, halfWidth, halfHeight),
        this,
        true,
        this.depth + 1
      )
    );
    this.nodes.push(
      new QuadNode(
        new Boundary(
          this.boundary.X + halfWidth,
          this.boundary.Y,
          halfWidth,
          halfHeight
        ),
        this,
        true,
        this.depth + 1
      )
    );

    this.objects.forEach(obj => {
      const added = this.nodes
        .map(node => node.Add(obj, leafs))
        .some(x => x);

      if (!added) {
        throw new Error(
          'Leaf has object that not fit. Probably some mistake in RecalculateBucket implementation'
        );
      }
    });

    this.objects.splice(0);
    this.isLeaf = false;

    leafs.delete(this);
    this.nodes.forEach(leaf => leafs.add(leaf));
  }

  // Can be called only on leaf node with parent
  private Collapse(leafs: Set<QuadNode<TCollider>>): void {
    if (!this.parent) {
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
        leafs.delete(node);
      } else {
        node.nodes.forEach(node => gather(node));
      }
    };

    gather(this.parent);

    this.parent.nodes.splice(0);
    this.parent.objects.push(...receiver);
    this.parent.isLeaf = true;

    leafs.add(this.parent);
  }

  public static Size<TCollider extends CircleCollider>(
    node: QuadNode<TCollider>
  ): number {
    if (node.IsLeaf) {
      return node.objects.length;
    } else {
      return node.nodes.reduce((acc, x) => acc + QuadNode.Size(x), 0);
    }
  }

  public static *ObjectIterator<TCollider extends CircleCollider>(
    node: QuadNode<TCollider>
  ) {
    for (const object of node.objects) {
      yield object;
    }
  }
}

export class QuadTreeCollisionEngine
  implements CollisionEngine<MovingCircleCollider>
{
  public root: QuadNode<MovingCircleCollider>;
  private readonly leafs = new Set<QuadNode<MovingCircleCollider>>();

  constructor(
    private readonly boundary: Boundary,
    private renderer: QuadTreeRenderer
  ) {
    this.root = new QuadNode(boundary);
    this.renderer.RootFetcher = () => this.root;
  }

  Add(object: MovingCircleCollider): boolean {
    return this.root.Add(object, this.leafs);
  }

  Remove(object: MovingCircleCollider): boolean {
    return this.root.Remove(object, this.leafs);
  }

  RecalculateBuckets(): void {
    this.root.RecalculateBucket(this.root, this.leafs);
  }

  FindCollisions(object: MovingCircleCollider): MovingCircleCollider[] {
    const nodes = this.root.FindNodeContaining(object);

    return nodes.flatMap(node => node.FilterCollided(object));
  }

  ForEachCollided(
    handler: (a: MovingCircleCollider, b: MovingCircleCollider) => void
  ): void {
    this.leafs.forEach(leaf => {
      const bodies = [...QuadNode.ObjectIterator(leaf)];

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
    this.root = new QuadNode(this.boundary);
  }

  Draw(elapsed: number): void {
    this.renderer.Draw(elapsed);
  }
}
