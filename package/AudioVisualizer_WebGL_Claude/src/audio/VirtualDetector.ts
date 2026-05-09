import type { IBeatDetector } from '@types';

export class VirtualDetector implements IBeatDetector {
  targetHz       = 0;
  parameter      = 0;
  idleDecayRate  = 0;
  freqDecayBias  = 0;
  minFluxFloor   = 0;
  readonly currentFlux       = 0;
  readonly maxLoudnessThresh = 0;
  readonly avgPeakThresh     = 0;

  private _pending = false;

  constructor(_cfg?: any) {}

  get justTriggered(): boolean {
    const v = this._pending;
    this._pending = false;
    return v;
  }

  trigger(): void {
    this._pending  = true;
    this.parameter = 1.0;
  }

  updateData(..._args: any[]): number { return 0; }
  reset(): void {}
}
