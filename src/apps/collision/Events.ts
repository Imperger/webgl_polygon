import { Dimension } from '@/lib/misc/Primitives';
import { Camera2 } from '@/lib/render/Camera';

export enum AppEvent {
  ResizeView = 0,
  CameraMove
}

export interface AppEventSet {
  [AppEvent.ResizeView]: Dimension;
  [AppEvent.CameraMove]: Camera2;
}
