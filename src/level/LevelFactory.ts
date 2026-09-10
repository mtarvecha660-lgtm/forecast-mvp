import type { WorldObjectState } from "../core/Types";

export interface LevelData {
  playerSpawn: { x: number; y: number };
  extraction: { x: number; y: number };
  objects: WorldObjectState[];
}

export function createLevel01(): LevelData {
  return {
    playerSpawn: { x: 40, y: 160 },
    extraction: { x: 350, y: 70 },
    objects: [
      {
        id: "water_01",
        type: "WATER",
        position: { x: 125, y: 155 },
        active: true,
        tags: ["water"],
        properties: {},
        water: { volume: 0, maxVolume: 1 }
      },
      {
        id: "seed_01",
        type: "SEED",
        position: { x: 165, y: 155 },
        active: true,
        tags: ["seed", "movable"],
        properties: {},
        seed: {
          wet: false,
          planted: false,
          carriedByWind: false,
          growthProgress: 0
        }
      },
      {
        id: "soil_01",
        type: "SOIL",
        position: { x: 265, y: 155 },
        active: true,
        tags: ["soil"],
        properties: {}
      },
      {
        id: "plant_01",
        type: "PLANT",
        position: { x: 265, y: 143 },
        active: true,
        tags: ["plant", "traversal"],
        properties: {},
        plant: {
          growthProgress: 0,
          fullyGrown: false,
          temporary: true
        }
      },
      {
        id: "wind_01",
        type: "WIND_OBJECT",
        position: { x: 205, y: 110 },
        active: true,
        tags: ["wind"],
        properties: {}
      },
      {
        id: "gate_01",
        type: "GATE",
        position: { x: 315, y: 155 },
        active: true,
        tags: ["gate"],
        properties: {},
        gate: { opened: false }
      },
      {
        id: "exit_01",
        type: "EXTRACTION",
        position: { x: 350, y: 70 },
        active: true,
        tags: ["extraction"],
        properties: {}
      }
    ]
  };
}
