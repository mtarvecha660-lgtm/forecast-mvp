import type { WeatherDefinition, WeatherId } from "../../core/Types";
import { BALANCE } from "../../config/GameConfig";

export const WEATHER: Record<WeatherId, WeatherDefinition> = {
  RAIN: {
    id: "RAIN",
    duration: BALANCE.weatherDuration,
    tags: ["water", "wet"],
    effects: ["CREATE_WATER", "WET_SEED"],
    visualKey: "rain",
    audioKey: "rain"
  },
  WIND: {
    id: "WIND",
    duration: BALANCE.weatherDuration,
    tags: ["air", "push"],
    effects: ["PUSH_SEED"],
    visualKey: "wind",
    audioKey: "wind"
  },
  SUN: {
    id: "SUN",
    duration: BALANCE.weatherDuration,
    tags: ["light", "dry", "growth"],
    effects: ["GROW_PLANTS", "DRY_WATER"],
    visualKey: "sun",
    audioKey: "sun"
  }
};
