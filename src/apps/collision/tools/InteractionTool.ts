export enum AvailableInteractionTool {
  Pan = 0,
  Selection
}

export interface InteractionTool {
  get Type(): AvailableInteractionTool;

  OnMouseDown(e: MouseEvent): void;

  OnMouseUp(e: MouseEvent): void;

  OnKeyDown(e: KeyboardEvent): void;

  OnMouseMove(e: MouseEvent): void;

  OnWheel(e: WheelEvent): void;

  OnTouchMove(e: TouchEvent): void;

  OnTouchStart(e: TouchEvent): void;

  OnTouchEnd(e: TouchEvent): void;

  Draw(elapsed: number): void;

  Dispose(): void;
}
