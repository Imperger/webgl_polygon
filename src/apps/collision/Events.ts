import { Dimension } from '@/lib/misc/Primitives';
import { Camera2 } from '@/lib/render/Camera';

export enum AppEvent {
  ResizeView = 0,
  CameraMove,
  TogglePause
}

export interface AppEventSet {
  [AppEvent.ResizeView]: Dimension;
  [AppEvent.CameraMove]: Camera2;
  [AppEvent.TogglePause]: boolean;
}
