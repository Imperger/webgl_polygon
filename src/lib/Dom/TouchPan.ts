import { EventBus, Unsubscription } from '../misc/EventBus';

interface TouchPanTrace {
  id: number;
  x: number;
  y: number;
}

export interface TouchPanEvent {
  dx: number;
  dy: number;
}

type Handler = (e: TouchPanEvent) => void;

enum TouchPanEventBus {
  Pan = 0
}

interface TouchPanEventBusSet {
  [TouchPanEventBus.Pan]: TouchPanEvent;
}

export class TouchPan {
  private broadcaster = new EventBus<
    TouchPanEventBusSet,
    typeof TouchPanEventBus
  >(TouchPanEventBus);
  private prev!: TouchPanTrace;

  public OnTouchStart(e: TouchEvent): void {
    const touch = e.targetTouches[0];
    this.prev = {
      id: touch.identifier,
      x: touch.pageX,
      y: touch.pageY
    };
  }

  public OnTouchMove(e: TouchEvent): void {
    if (e.targetTouches.item(0)?.identifier !== this.prev.id) {
      return;
    }

    const touch = e.targetTouches[0];

    this.Notify({
      dx: touch.pageX - this.prev.x,
      dy: touch.pageY - this.prev.y
    });

    this.prev.x = touch.pageX;
    this.prev.y = touch.pageY;
  }

  public Subscribe(handle: Handler): Unsubscription {
    return this.broadcaster.Subscribe(TouchPanEventBus.Pan, handle);
  }

  private Notify(e: TouchPanEvent): void {
    this.broadcaster.Publish(TouchPanEventBus.Pan, e);
  }
}
