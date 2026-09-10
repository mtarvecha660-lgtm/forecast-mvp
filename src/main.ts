import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { ForecastScene } from "./scenes/ForecastScene";
import { ExpeditionScene } from "./scenes/ExpeditionScene";
import { ResultsScene } from "./scenes/ResultsScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: 384,
  height: 216,
  backgroundColor: "#14252b",
  pixelArt: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 384,
    height: 216
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [BootScene, ForecastScene, ExpeditionScene, ResultsScene]
};

new Phaser.Game(config);
