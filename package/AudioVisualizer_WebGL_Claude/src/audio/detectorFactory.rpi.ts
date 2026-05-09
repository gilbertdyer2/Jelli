export { VirtualDetector as DetectorClass } from './VirtualDetector';
import { virtualDetectors } from './wsReceiver';
export function registerDetector(id: string, det: any): void {
  virtualDetectors.set(id, det);
}
