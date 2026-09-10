export type WeatherId = "RAIN" | "WIND" | "SUN";
export type GamePhase = "FORECAST" | "EXPEDITION" | "RESULTS";
export type RunStatus = "PLANNING" | "ACTIVE" | "EXTRACTED" | "FAILED";
export type Direction = "LEFT" | "RIGHT";

export type WorldObjectType =
  | "WATER"
  | "SEED"
  | "SOIL"
  | "PLANT"
  | "WIND_OBJECT"
  | "GATE"
  | "EXTRACTION";

export interface Vec2 {
  x: number;
  y: number;
}

export interface WeatherDefinition {
  id: WeatherId;
  duration: number;
  tags: string[];
  effects: string[];
  visualKey: string;
  audioKey: string;
}

export interface ForecastSlot {
  index: number;
  weatherId: WeatherId;
  startTime: number;
  duration: number;
  locked: boolean;
  modified: boolean;
}

export interface ForecastTimeline {
  slots: ForecastSlot[];
  currentSlotIndex: number;
  elapsed: number;
  running: boolean;
}

export interface WeatherHistoryEntry {
  weatherId: WeatherId;
  startedAt: number;
  endedAt: number;
}

export interface WaterState {
  volume: number;
  maxVolume: number;
}

export interface SeedState {
  wet: boolean;
  planted: boolean;
  carriedByWind: boolean;
  growthProgress: number;
}

export interface PlantState {
  growthProgress: number;
  fullyGrown: boolean;
  temporary: boolean;
}

export interface GateState {
  opened: boolean;
}

export interface WorldObjectState {
  id: string;
  type: WorldObjectType;
  position: Vec2;
  active: boolean;
  tags: string[];
  properties: Record<string, unknown>;
  water?: WaterState;
  seed?: SeedState;
  plant?: PlantState;
  gate?: GateState;
}

export interface PlayerState {
  position: Vec2;
  movementSpeed: number;
  facing: Direction;
}

export interface CertaintyState {
  charges: number;
  maxCharges: number;
  usedThisRun: number;
}

export interface ComboState {
  count: number;
  multiplier: number;
  lastSuccessTime: number;
  active: boolean;
}

export interface ExtractionState {
  available: boolean;
  reached: boolean;
  banked: boolean;
}

export interface RunState {
  regionId: string;
  forecast: ForecastTimeline;
  player: PlayerState;
  worldObjects: WorldObjectState[];
  weatherHistory: WeatherHistoryEntry[];
  stormGlass: number;
  combo: ComboState;
  certainty: CertaintyState;
  extraction: ExtractionState;
  elapsedTime: number;
  status: RunStatus;
}
