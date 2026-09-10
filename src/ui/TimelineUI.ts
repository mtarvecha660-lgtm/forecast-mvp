import Phaser from "phaser";
import type { ForecastSlot, WeatherId } from "../core/Types";
import { ForecastManager } from "../simulation/forecast/ForecastManager";

const ICON: Record<WeatherId, string> = {
  RAIN: "☔",
  WIND: "≋",
  SUN: "☀"
};

export class TimelineUI {
  private container: Phaser.GameObjects.Container;
  private labels: Phaser.GameObjects.Text[] = [];
  private progress: Phaser.GameObjects.Rectangle;

  constructor(
    private scene: Phaser.Scene,
    private forecast: ForecastManager
  ) {
    this.container = scene.add.container(8, 7);

    scene.add.rectangle(184, 27, 360, 39, 0x102026, 0.92)
      .setStrokeStyle(1, 0x7fa0a5)
      .setDepth(50);

    this.progress = scene.add.rectangle(8, 47, 1, 2, 0xe9d27c)
      .setOrigin(0, 0.5)
      .setDepth(51);

    this.container.add(this.progress);
    this.container.setDepth(50);

    for (let i = 0; i < 3; i++) {
      const text = scene.add.text(0, 0, "", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#f5f1dd"
      }).setOrigin(0.5);
      this.labels.push(text);
      this.container.add(text);
    }
  }

  update(): void {
    const slots = this.forecast.getTimeline().slots;
    const current = this.forecast.getTimeline().currentSlotIndex;

    slots.forEach((slot: ForecastSlot, i) => {
      const x = 55 + i * 82;
      this.labels[i].setPosition(x, 25);
      this.labels[i].setText(`${ICON[slot.weatherId]} ${slot.weatherId}`);

      if (i < current) this.labels[i].setColor("#6c7779");
      else if (i === current) this.labels[i].setColor("#f5d76e");
      else this.labels[i].setColor("#f5f1dd");
    });

    const timeline = this.forecast.getTimeline();
    const total = timeline.slots.reduce((s, x) => s + x.duration, 0);
    const pct = total > 0 ? Math.min(1, timeline.elapsed / total) : 0;
    this.progress.width = 352 * pct;
  }
}
