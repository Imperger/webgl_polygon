import { Collider } from '../collision_engines/Collider';

import { VisualBody } from './VisualBody';

import { AABBRectangle } from '@/lib/misc/Primitives';

export interface Body extends VisualBody, Collider {
  // Move the body so that it is inside the rect
  MoveInto(rect: AABBRectangle): void;
}
