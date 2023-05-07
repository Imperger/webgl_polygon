import { RVec2, RVec3 } from '@/lib/render/Primitives';

export interface EngineRenderer {
  Draw(elapsed: number): void;
  ResizeView(resolution: RVec2): void;
  Camera(camera: RVec3): void;
}
