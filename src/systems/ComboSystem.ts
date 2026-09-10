import type { ComboState } from "../core/Types";
import { BALANCE } from "../config/GameConfig";

export class ComboSystem {
  constructor(private state: ComboState) {}

  success(now: number): void {
    if (
      !this.state.active ||
      now - this.state.lastSuccessTime > BALANCE.comboTimeout
    ) {
      this.state.count = 0;
    }

    this.state.count += 1;
    this.state.active = true;
    this.state.lastSuccessTime = now;
    this.state.multiplier = Math.min(5, 1 + Math.floor(this.state.count / 2));
  }

  update(now: number): void {
    if (this.state.active && now - this.state.lastSuccessTime > BALANCE.comboTimeout) {
      this.state.active = false;
      this.state.count = 0;
      this.state.multiplier = 1;
    }
  }
}
