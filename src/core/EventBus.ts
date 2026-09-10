import type { WeatherId } from "./Types";

export type GameEvent =
  | { type: "WEATHER_STARTED"; weather: WeatherId }
  | { type: "WEATHER_ENDED"; weather: WeatherId }
  | { type: "ENVIRONMENT_CHANGED"; objectId: string; reason: string }
  | { type: "CHAIN_SUCCESS"; chainId: string; reward: number }
  | { type: "BASIC_SUCCESS"; objectId: string; reward: number }
  | { type: "EXTRACTION_REACHED" }
  | { type: "FORECAST_CHANGED" };

type Listener = (event: GameEvent) => void;

export class EventBus {
  private listeners = new Set<Listener>();

  on(listener: Listener): void {
    this.listeners.add(listener);
  }

  off(listener: Listener): void {
    this.listeners.delete(listener);
  }

  emit(event: GameEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}
