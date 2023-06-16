import { Color } from '@/lib/misc/Primitives';

export interface VisualBody {
  set Color(color: Color);
  get Color(): Color;
}
