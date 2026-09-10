import Phaser from "phaser";

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super("ResultsScene");
  }

  create(data: {
    stormGlass: number;
    combo: number;
    time: number;
    forecast: string[];
  }): void {
    this.cameras.main.setBackgroundColor("#19333a");

    this.add.text(192, 38, "EXTRACTED", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#f5f1dd"
    }).setOrigin(0.5);

    this.add.text(192, 72, `STORM GLASS  ${data.stormGlass}`, {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#f5d76e"
    }).setOrigin(0.5);

    this.add.text(192, 91, `BEST COMBO   x${data.combo}`, {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#f5f1dd"
    }).setOrigin(0.5);

    this.add.text(192, 107, `TIME         ${data.time.toFixed(1)}s`, {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#f5f1dd"
    }).setOrigin(0.5);

    this.add.text(192, 130, `FORECAST     ${data.forecast.join(" → ")}`, {
      fontFamily: "monospace",
      fontSize: "8px",
      color: "#9fb9b7"
    }).setOrigin(0.5);

    this.add.text(192, 157, "Ask yourself: what would you change next run?", {
      fontFamily: "monospace",
      fontSize: "8px",
      color: "#f5d76e"
    }).setOrigin(0.5);

    const restart = this.add.rectangle(192, 188, 120, 25, 0x355b60)
      .setInteractive({ useHandCursor: true });

    this.add.text(192, 188, "REPLAN", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#f5f1dd"
    }).setOrigin(0.5);

    restart.on("pointerdown", () => this.scene.start("ForecastScene"));

    this.input.keyboard?.once("keydown-ENTER", () => this.scene.start("ForecastScene"));
  }
}
