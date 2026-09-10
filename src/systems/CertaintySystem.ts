import type { CertaintyState } from "../core/Types";
import { ForecastManager } from "../simulation/forecast/ForecastManager";

export class CertaintySystem {
  constructor(private state: CertaintyState) {}

  swap(
    forecast: ForecastManager,
    firstFutureIndex: number,
    secondFutureIndex: number
  ): boolean {
    if (this.state.charges <= 0) return false;

    const success = forecast.swapFutureSlots(
      firstFutureIndex,
      secondFutureIndex
    );

    if (!success) return false;

    this.state.charges -= 1;
    this.state.usedThisRun += 1;
    return true;
  }
}
