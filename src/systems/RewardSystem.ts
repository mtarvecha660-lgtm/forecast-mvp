import type { RunState } from "../core/Types";

export class RewardSystem {
  constructor(private run: RunState) {}

  award(base: number): number {
    const value = Math.round(base * this.run.combo.multiplier);
    this.run.stormGlass += value;
    return value;
  }
}
