import { Shape } from '../math/Shape';
import { EventBus, EventBusObserver } from '../misc/EventBus';
import { Circle } from '../misc/Primitives';

type TouchSlice = Pick<Touch, 'pageX' | 'pageY' | 'radiusX'>;

interface TouchTrace {
  timestamp: number;
  touch: TouchSlice;
}

export enum TouchDoubleTapEventBus {
  DoubleTap = 0
}

interface TouchDoubleTapEventBusSet {
  [TouchDoubleTapEventBus.DoubleTap]: Touch;
}

export class TouchDoubleTap {
  private readonly prev: TouchTrace[] = [];

  private broadcaster = new EventBus<
    TouchDoubleTapEventBusSet,
    typeof TouchDoubleTapEventBus
  >(TouchDoubleTapEventBus);

  public OnTouchStart(e: TouchEvent): void {
    const Timeout = 200;

    [...e.changedTouches].forEach(touch => {
      const Radius = touch.radiusX > 0 ? touch.radiusX : 15;

      const touchCircle: Circle = {
        Center: { X: touch.pageX, Y: touch.pageY },
        Radius: touch.radiusX
      };

      let add = true;
      for (let n = 0, step = 1; n < this.prev.length; n += step) {
        const prev = this.prev[n];

        const prevCircle: Circle = {
          Center: { X: prev.touch.pageX, Y: prev.touch.pageY },
          Radius
        };

        if (Date.now() - prev.timestamp >= Timeout) {
          step = 0;

          this.prev.splice(n, 1);
        } else if (Shape.CircleCircleIntersect(touchCircle, prevCircle)) {
          add = false;
          step = 0;

          this.prev.splice(n, 1);

          this.Notify(touch);
        } else {
          step = 1;
        }
      }

      if (add) {
        const copy: TouchSlice = {
          pageX: touch.pageX,
          pageY: touch.pageY,
          radiusX: Radius
        };
        this.prev.push({ timestamp: Date.now(), touch: copy });
      }
    });
  }

  public get Observer(): EventBusObserver<TouchDoubleTapEventBusSet> {
    return this.broadcaster;
  }

  private Notify(e: Touch): void {
    this.broadcaster.Publish(TouchDoubleTapEventBus.DoubleTap, e);
  }
}
