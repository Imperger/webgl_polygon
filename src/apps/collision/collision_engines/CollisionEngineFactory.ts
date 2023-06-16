import { BruteForceCollisionEngine } from './BruteForceCollisionEngine';
import { CollisionEngine } from './CollisionEngine';
import { QuadTreeCollisionEngine } from './QuadTreeCollisionEngine';

interface Constructor {
  new (...args: any[]): any;
}

interface Creator<TConstructor extends Constructor> {
  constructor: TConstructor;
  args?: () => ConstructorParameters<TConstructor>;
}

interface Engines {
  'quad-tree': Creator<typeof QuadTreeCollisionEngine>;
  'brute-force': Creator<typeof BruteForceCollisionEngine>;
}

export type SupportedCollisionEngine = keyof Engines;

type HasArguments<T extends Constructor> =
  ConstructorParameters<T>['length'] extends 0 ? false : true;

type EnginesWithoutOptions = Pick<
  Engines,
  {
    [Prop in keyof Engines]: HasArguments<
      Engines[Prop]['constructor']
    > extends true
      ? Prop
      : never;
  }[keyof Engines]
>;

type ArgsBuilder = {
  [Prop in keyof EnginesWithoutOptions]: EnginesWithoutOptions[Prop]['args'];
};

export class CollisionEngineFactory {
  private readonly engines: Engines = {
    'quad-tree': { constructor: QuadTreeCollisionEngine },
    'brute-force': { constructor: BruteForceCollisionEngine }
  };

  constructor(argsBuilder: ArgsBuilder) {
    for (const prop in argsBuilder) {
      const engine = prop as keyof ArgsBuilder;
      this.engines[engine].args = argsBuilder[engine];
    }
  }

  Create(name: keyof Engines): CollisionEngine {
    const engine = this.engines[name];

    const ctor = engine.constructor as Constructor;
    const args = engine.args;

    if (args) {
      return new ctor(...args());
    } else {
      return new ctor();
    }
  }
}
