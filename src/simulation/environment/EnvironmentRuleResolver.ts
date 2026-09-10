import type { WeatherId, WorldObjectState } from "../../core/Types";
import { EventBus } from "../../core/EventBus";

export class EnvironmentRuleResolver {
  private windMovedSeed = false;
  private plantRewarded = false;

  constructor(
    private objects: WorldObjectState[],
    private events: EventBus
  ) {}

  resetRunFlags(): void {
    this.windMovedSeed = false;
    this.plantRewarded = false;
  }

  update(weather: WeatherId | null, deltaSeconds: number): void {
    if (!weather) return;

    const water = this.objects.find(o => o.type === "WATER");
    const waterState = water?.water;
    const seed = this.objects.find(o => o.type === "SEED");
    const soil = this.objects.find(o => o.type === "SOIL");
    const plant = this.objects.find(o => o.type === "PLANT");
    const gate = this.objects.find(o => o.type === "GATE");

    if (weather === "RAIN") {
      if (waterState) {
        const before = waterState.volume;
        waterState.volume = Math.min(
          waterState.maxVolume,
          before + deltaSeconds * 0.35
        );
        if (waterState.volume > before + 0.001) {
          this.events.emit({
            type: "ENVIRONMENT_CHANGED",
            objectId: water.id,
            reason: "rain fills basin"
          });
        }
      }

      if (seed?.seed && waterState && waterState.volume >= waterState.maxVolume * 0.35) {
        if (!seed.seed.wet) {
          seed.seed.wet = true;
          this.events.emit({
            type: "BASIC_SUCCESS",
            objectId: seed.id,
            reward: 10
          });
        }
      }
    }

    if (weather === "WIND" && seed?.seed && seed.seed.wet) {
      seed.seed.carriedByWind = true;
      seed.position.x += deltaSeconds * 42;
      this.windMovedSeed = true;

      if (soil && seed.position.x >= soil.position.x - 10) {
        seed.position.x = soil.position.x;
        seed.position.y = soil.position.y;
        seed.seed.carriedByWind = false;
        seed.seed.planted = true;

        this.events.emit({
          type: "BASIC_SUCCESS",
          objectId: seed.id,
          reward: 15
        });
      }
    }

    if (
      weather === "SUN" &&
      seed?.seed?.planted &&
      plant?.plant &&
      soil
    ) {
      plant.position.x = seed.position.x;
      plant.position.y = seed.position.y - 12;
      plant.plant.growthProgress = Math.min(
        1,
        plant.plant.growthProgress + deltaSeconds * 0.18
      );

      if (plant.plant.growthProgress >= 1 && !plant.plant.fullyGrown) {
        plant.plant.fullyGrown = true;
        if (gate?.gate) gate.gate.opened = true;

        if (!this.plantRewarded) {
          this.plantRewarded = true;
          this.events.emit({
            type: "CHAIN_SUCCESS",
            chainId: "RAIN_WIND_SUN",
            reward: 40
          });
        }
      }
    }

    if (weather === "SUN" && waterState) {
      waterState.volume = Math.max(
        0,
        waterState.volume - deltaSeconds * 0.12
      );
    }
  }
}
