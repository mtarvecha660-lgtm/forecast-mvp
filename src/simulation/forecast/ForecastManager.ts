import type { ForecastSlot, ForecastTimeline, WeatherId } from "../../core/Types";
import { WEATHER } from "../weather/WeatherDefinitions";
import { EventBus } from "../../core/EventBus";

export class ForecastManager {
  constructor(
    private timeline: ForecastTimeline,
    private events: EventBus
  ) {}

  start(): void {
    this.timeline.running = true;
  }

  update(deltaSeconds: number): void {
    if (!this.timeline.running || this.isFinished()) return;

    const previousIndex = this.timeline.currentSlotIndex;
    this.timeline.elapsed += deltaSeconds;

    while (!this.isFinished()) {
      const slot = this.timeline.slots[this.timeline.currentSlotIndex];
      const nextBoundary = slot.startTime + slot.duration;

      if (this.timeline.elapsed < nextBoundary) break;

      this.timeline.currentSlotIndex += 1;

      this.events.emit({
        type: "WEATHER_ENDED",
        weather: slot.weatherId
      });

      if (!this.isFinished()) {
        const next = this.timeline.slots[this.timeline.currentSlotIndex];
        this.events.emit({
          type: "WEATHER_STARTED",
          weather: next.weatherId
        });
      }
    }

    if (previousIndex !== this.timeline.currentSlotIndex && this.isFinished()) {
      this.timeline.running = false;
    }
  }

  getCurrentWeather(): WeatherId | null {
    if (this.isFinished()) return null;
    return this.timeline.slots[this.timeline.currentSlotIndex].weatherId;
  }

  getCurrentProgress(): number {
    if (this.isFinished()) return 1;
    const slot = this.timeline.slots[this.timeline.currentSlotIndex];
    return PhaserMathClamp(
      (this.timeline.elapsed - slot.startTime) / slot.duration,
      0,
      1
    );
  }

  getUpcoming(): ForecastSlot[] {
    return this.timeline.slots.slice(this.timeline.currentSlotIndex + 1);
  }

  getTimeline(): ForecastTimeline {
    return this.timeline;
  }

  isFinished(): boolean {
    return this.timeline.currentSlotIndex >= this.timeline.slots.length;
  }

  swapFutureSlots(a: number, b: number): boolean {
    const current = this.timeline.currentSlotIndex;
    if (a <= current || b <= current || a === b) return false;

    const A = this.timeline.slots[a];
    const B = this.timeline.slots[b];
    if (!A || !B || A.locked || B.locked) return false;

    const temp = A.weatherId;
    A.weatherId = B.weatherId;
    B.weatherId = temp;
    A.modified = true;
    B.modified = true;

    this.rebuildStartTimes();
    this.events.emit({ type: "FORECAST_CHANGED" });
    return true;
  }

  private rebuildStartTimes(): void {
    let t = 0;
    for (const slot of this.timeline.slots) {
      slot.startTime = t;
      slot.duration = WEATHER[slot.weatherId].duration;
      t += slot.duration;
    }
  }
}

function PhaserMathClamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
