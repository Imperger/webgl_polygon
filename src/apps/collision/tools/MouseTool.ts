export enum AvailableMouseTool {
  Pan = 0,
  Selection
}

export interface MouseTool {
  OnMouseDown(e: MouseEvent): void;

  OnMouseUp(e: MouseEvent): void;

  OnKeyDown(e: KeyboardEvent): void;

  OnMouseMove(e: MouseEvent): void;

  OnWheel(e: WheelEvent): void;

  Draw(elapsed: number): void;

  Dispose(): void;
}
