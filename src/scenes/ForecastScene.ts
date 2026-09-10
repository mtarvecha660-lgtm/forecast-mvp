import Phaser from "phaser";
import type { ForecastSlot, ForecastTimeline, WeatherId } from "../core/Types";
import { BALANCE } from "../config/GameConfig";

const WEATHER: WeatherId[] = ["RAIN", "WIND", "SUN"];

export class ForecastScene extends Phaser.Scene {
  private selected: WeatherId[] = [];
  private status!: Phaser.GameObjects.Text;
  private sequenceText!: Phaser.GameObjects.Text;

  constructor() {
    super("ForecastScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#19333a");

    this.add.text(192, 20, "FORECAST", {
      fontFamily: "monospace",
      fontSize: "22px",
      color: "#f5f1dd"
    }).setOrigin(0.5);

    this.add.text(192, 43, "Plan the weather. Survive your prediction.", {
      fontFamily: "monospace",
      fontSize: "8px",
      color: "#9fb9b7"
    }).setOrigin(0.5);

    this.add.text(192, 64, "Choose all 3 cards, then order them.", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#f5d76e"
    }).setOrigin(0.5);

    WEATHER.forEach((weather, i) => this.makeCard(weather, 88 + i * 105, 105));

    this.sequenceText = this.add.text(192, 151, "FORECAST: —", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.status = this.add.text(192, 166, "Tap/click cards in the order you want.", {
      fontFamily: "monospace",
      fontSize: "7px",
      color: "#9fb9b7"
    }).setOrigin(0.5);

    const start = this.add.rectangle(192, 193, 130, 25, 0x355b60)
      .setInteractive({ useHandCursor: true });

    this.add.text(192, 193, "START EXPEDITION", {
      fontFamily: "monospace",
      fontSize: "8px",
      color: "#f5f1dd"
    }).setOrigin(0.5);

    start.on("pointerdown", () => this.startRun());

    this.add.text(192, 210, `Certainty available during run: ${BALANCE.certaintyCharges} swaps`, {
      fontFamily: "monospace",
      fontSize: "6px",
      color: "#7fa0a5"
    }).setOrigin(0.5);
  }

  private makeCard(weather: WeatherId, x: number, y: number): void {
    const card = this.add.rectangle(x, y, 88, 48, 0x24464c)
      .setStrokeStyle(1, 0x7fa0a5)
      .setInteractive({ useHandCursor: true });

    const icon = weather === "RAIN" ? "☔" : weather === "WIND" ? "≋" : "☀";
    this.add.text(x, y - 8, icon, {
      fontFamily: "monospace",
      fontSize: "15px"
    }).setOrigin(0.5);

    this.add.text(x, y + 12, weather, {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#f5f1dd"
    }).setOrigin(0.5);

    card.on("pointerdown", () => {
      if (this.selected.includes(weather)) {
        this.selected = this.selected.filter(w => w !== weather);
      } else if (this.selected.length < 3) {
        this.selected.push(weather);
      }
      this.refresh();
    });
  }

  private refresh(): void {
    this.sequenceText.setText(
      `FORECAST: ${this.selected.length ? this.selected.join(" → ") : "—"}`
    );

    this.status.setText(
      this.selected.length === 3
        ? "Good. Start when you're ready."
        : `${3 - this.selected.length} card(s) remaining.`
    );
  }

  private startRun(): void {
    if (this.selected.length !== 3) {
      this.status.setText("You must choose all 3 weather cards.");
      return;
    }

    const slots: ForecastSlot[] = this.selected.map((weather, index) => ({
      index,
      weatherId: weather,
      startTime: index * BALANCE.weatherDuration,
      duration: BALANCE.weatherDuration,
      locked: false,
      modified: false
    }));

    const forecast: ForecastTimeline = {
      slots,
      currentSlotIndex: 0,
      elapsed: 0,
      running: true
    };

    this.scene.start("ExpeditionScene", { forecast });
  }
}
