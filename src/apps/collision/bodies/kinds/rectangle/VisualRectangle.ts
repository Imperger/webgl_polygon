import { VisualBody } from '../../VisualBody';

import { Color } from '@/lib/misc/Primitives';
import { DataDescriptor } from '@/lib/render/PrimitivesRenderer';

export class VisualRectangle implements VisualBody {
  constructor(private readonly data: DataDescriptor) {}

  set Color(color: Color) {
    this.data.buffer[this.data.offset + 2] = color.R;
    this.data.buffer[this.data.offset + 3] = color.G;
    this.data.buffer[this.data.offset + 4] = color.B;

    this.data.buffer[this.data.offset + 7] = color.R;
    this.data.buffer[this.data.offset + 8] = color.G;
    this.data.buffer[this.data.offset + 9] = color.B;

    this.data.buffer[this.data.offset + 12] = color.R;
    this.data.buffer[this.data.offset + 13] = color.G;
    this.data.buffer[this.data.offset + 14] = color.B;

    this.data.buffer[this.data.offset + 17] = color.R;
    this.data.buffer[this.data.offset + 18] = color.G;
    this.data.buffer[this.data.offset + 19] = color.B;

    this.data.buffer[this.data.offset + 22] = color.R;
    this.data.buffer[this.data.offset + 23] = color.G;
    this.data.buffer[this.data.offset + 24] = color.B;

    this.data.buffer[this.data.offset + 27] = color.R;
    this.data.buffer[this.data.offset + 28] = color.G;
    this.data.buffer[this.data.offset + 29] = color.B;
  }

  get Color(): Color {
    return {
      R: this.data.buffer[this.data.offset + 2],
      G: this.data.buffer[this.data.offset + 3],
      B: this.data.buffer[this.data.offset + 4]
    };
  }
}
