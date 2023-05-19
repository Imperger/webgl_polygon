import { Point } from '../math/Point';
import { EventBus, EventBusObserver } from '../misc/EventBus';

export type TouchZoomEvent = number; // Positive for zoom-out

interface TouchZoomTrace {
  Id: number;
  X: number;
  Y: number;
}

export enum TouchZoomEventBus {
  ZoomStart = 0,
  Zoom
}

interface TouchZoomEventBusSet {
  [TouchZoomEventBus.ZoomStart]: void;
  [TouchZoomEventBus.Zoom]: TouchZoomEvent;
}

export class TouchZoom {
  private broadcaster = new EventBus<
    TouchZoomEventBusSet,
    typeof TouchZoomEventBus
  >(TouchZoomEventBus);

  private readonly prev: TouchZoomTrace[] = [
    { Id: -1, X: 0, Y: 0 },
    { Id: -1, X: 0, Y: 0 }
  ];

  public OnTouchStart(e: TouchEvent): void {
    if (e.targetTouches.length !== 2) {
      return;
    }

    this.broadcaster.Publish(TouchZoomEventBus.ZoomStart);

    this.UpdateTrace(e);
  }

  public OnTouchEnd(e: TouchEvent): void {
    [...e.targetTouches].forEach(touch => {
      const prevTouch = this.prev.find(x => x.Id === touch.identifier);

      if (prevTouch) {
        prevTouch.Id = -1;
      }
    });
  }

  public OnTouchMove(e: TouchEvent): void {
    if (
      e.targetTouches.length !== 2 ||
      !this.prev.every(trace => trace.Id !== -1)
    ) {
      return;
    }

    e.preventDefault();

    const [p0, p1] = (
      e.targetTouches[0].identifier === this.prev[0].Id
        ? [e.targetTouches[0], e.targetTouches[1]]
        : [e.targetTouches[1], e.targetTouches[0]]
    ).map(touch => ({ X: touch.pageX, Y: touch.pageY }));

    const dist0 = Point.Distance(this.prev[0], this.prev[1]);
    const dist1 = Point.Distance(p0, p1);

    this.Notify(dist1 / dist0);
  }

  public get Observer(): EventBusObserver<TouchZoomEventBusSet> {
    return this.broadcaster;
  }

  private Notify(e: TouchZoomEvent): void {
    this.broadcaster.Publish(TouchZoomEventBus.Zoom, e);
  }

  private UpdateTrace(e: TouchEvent): void {
    for (let n = 0; n < e.targetTouches.length; ++n) {
      this.prev[n].Id = e.targetTouches[n].identifier;
      this.prev[n].X = e.targetTouches[n].pageX;
      this.prev[n].Y = e.targetTouches[n].pageY;
    }
  }
}
