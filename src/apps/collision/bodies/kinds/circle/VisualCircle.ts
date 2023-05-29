import { DataDescriptor } from '../../../models/DataDescriptor';
import { VisualBody } from '../../VisualBody';

import { Color, Vec2 } from '@/lib/misc/Primitives';

export class VisualCircle implements VisualBody {
  constructor(private readonly center: DataDescriptor) {}

  public Color(color: Color): void {
    const colorOffset = this.center.offset + 2;

    this.center.buffer[colorOffset] = color.R;
    this.center.buffer[colorOffset + 1] = color.G;
    this.center.buffer[colorOffset + 2] = color.B;
  }

  public Center(center: Vec2): void {
    this.center.buffer[this.center.offset + 0] = center.X;
    this.center.buffer[this.center.offset + 1] = center.Y;
  }
}
