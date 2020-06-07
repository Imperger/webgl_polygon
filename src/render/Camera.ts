import { Vec3 } from './Primitives';

export class Camera {
    protected position: Vec3 = { x: 0, y: 0, z: 0 };
    protected target: Vec3 = { x: 0, y: 0, z: 0 };
}
