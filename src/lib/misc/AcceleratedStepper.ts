export class AcceleratedStepper {
  private step: number;
  private prevActionTimestamp = 0;

  constructor(
    private readonly defaultStep: number,
    private readonly upperBound: number,
    private readonly acceleration: number,
    private readonly resetTimeout: number
  ) {
    this.step = defaultStep;
  }

  public Step(): number {
    if (this.NeedAccelerate) {
      if (this.step + this.acceleration <= this.upperBound) {
        this.step += this.acceleration;
      }
    } else {
      this.step = this.defaultStep;
    }

    this.prevActionTimestamp = Date.now();

    return this.step;
  }

  private get NeedAccelerate(): boolean {
    return Date.now() - this.prevActionTimestamp <= this.resetTimeout;
  }
}
