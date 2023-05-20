import { EnumSize } from './EnumSize';

type EventEnum = {
  [id: number]: any;
};

type SubHandler<TPayload extends any[]> = (...payload: TPayload) => void;

export type Unsubscription = () => void;

class Observer<TListener extends SubHandler<any>> {
  private readonly listeners: TListener[] = [];

  public Publish(...payload: TListener[]): void {
    this.listeners.forEach(fn => fn(...payload));
  }

  public Subscribe(handler: TListener): Unsubscription {
    if (!this.listeners.includes(handler)) {
      this.listeners.push(handler);
    }

    return () => this.listeners.splice(this.listeners.indexOf(handler), 1);
  }
}

type EmptyIfVoid<T> = T extends void ? [] : [T];

export interface EventBusObserver<TEventSet> {
  Subscribe<TEvent extends keyof TEventSet & number>(
    event: TEvent,
    handler: SubHandler<[TEventSet[TEvent]]>
  ): Unsubscription;
}

export class EventBus<TEventSet, TEventEnum extends EventEnum>
  implements EventBusObserver<TEventSet>
{
  private readonly observers: Observer<any>[];

  constructor(eventSet: TEventEnum) {
    this.observers = Array.from(
      { length: EnumSize(eventSet) },
      () => new Observer()
    );
  }

  public Publish<TEvent extends keyof TEventSet & number>(
    event: TEvent,
    ...payload: EmptyIfVoid<TEventSet[TEvent]>
  ): void {
    this.observers[event].Publish(...payload);
  }

  public Subscribe<TEvent extends keyof TEventSet & number>(
    event: TEvent,
    handler: SubHandler<[TEventSet[TEvent]]>
  ): Unsubscription {
    return this.observers[event].Subscribe(handler);
  }

  public Reset(): void {
    for (let n = 0; n < this.observers.length; ++n) {
      this.observers[n] = new Observer();
    }
  }
}
