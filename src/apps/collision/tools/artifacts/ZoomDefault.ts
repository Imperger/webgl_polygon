import { App } from '../../App';

export function ZoomDefault(app: App, e: WheelEvent) {
  const dir = -e.deltaY / Math.abs(e.deltaY);
  const zoom = app.Camera.Zoom;
  const step = dir * (dir > 0 ? 0.1 : 0.2);

  if (zoom + step > 0.5 && zoom + step < 10) {
    app.Camera = { Zoom: zoom + step };
  }
}
