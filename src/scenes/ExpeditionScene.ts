import Phaser from "phaser";
import type { ForecastTimeline, RunState, WorldObjectState } from "../core/Types";
import { BALANCE, GAME_HEIGHT, GAME_WIDTH } from "../config/GameConfig";
import { EventBus } from "../core/EventBus";
import { ForecastManager } from "../simulation/forecast/ForecastManager";
import { EnvironmentRuleResolver } from "../simulation/environment/EnvironmentRuleResolver";
import { CertaintySystem } from "../systems/CertaintySystem";
import { ComboSystem } from "../systems/ComboSystem";
import { RewardSystem } from "../systems/RewardSystem";
import { createLevel01 } from "../level/LevelFactory";
import { PlayerController } from "../player/PlayerController";
import { TimelineUI } from "../ui/TimelineUI";

export class ExpeditionScene extends Phaser.Scene {
  private run!: RunState;
  private events!: EventBus;
  private forecast!: ForecastManager;
  private environment!: EnvironmentRuleResolver;
  private certainty!: CertaintySystem;
  private combo!: ComboSystem;
  private rewards!: RewardSystem;
  private playerSprite!: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
  private playerController!: PlayerController;
  private objectGraphics = new Map<string, Phaser.GameObjects.GameObject>();
  private timelineUI!: TimelineUI;
  private weatherText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private rewardText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private certaintyText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private flashText!: Phaser.GameObjects.Text;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private nearExit = false;
  private swapKey!: Phaser.Input.Keyboard.Key;
  private restartKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super("ExpeditionScene");
  }

  create(data: { forecast: ForecastTimeline }): void {
    this.cameras.main.setBackgroundColor("#8fae9b");

    const level = createLevel01();
    const objects = level.objects.map(o => structuredClone(o));

    this.run = {
      regionId: "level01",
      forecast: data.forecast,
      player: {
        position: { ...level.playerSpawn },
        movementSpeed: BALANCE.playerSpeed,
        facing: "RIGHT"
      },
      worldObjects: objects,
      weatherHistory: [],
      stormGlass: 0,
      combo: {
        count: 0,
        multiplier: 1,
        lastSuccessTime: -Infinity,
        active: false
      },
      certainty: {
        charges: BALANCE.certaintyCharges,
        maxCharges: BALANCE.certaintyCharges,
        usedThisRun: 0
      },
      extraction: {
        available: true,
        reached: false,
        banked: false
      },
      elapsedTime: 0,
      status: "ACTIVE"
    };

    this.events = new EventBus();
    this.forecast = new ForecastManager(this.run.forecast, this.events);
    this.environment = new EnvironmentRuleResolver(this.run.worldObjects, this.events);
    this.certainty = new CertaintySystem(this.run.certainty);
    this.combo = new ComboSystem(this.run.combo);
    this.rewards = new RewardSystem(this.run);

    this.drawLevel(level.extraction);
    this.createPlayer();
    this.bindEvents();
    this.forecast.start();

    this.timelineUI = new TimelineUI(this, this.forecast);

    this.weatherText = this.add.text(8, 55, "", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#13262b",
      backgroundColor: "#d9eadf",
      padding: { x: 4, y: 3 }
    }).setDepth(50);

    this.timerText = this.add.text(376, 55, "", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#13262b",
      backgroundColor: "#d9eadf",
      padding: { x: 4, y: 3 }
    }).setOrigin(1, 0).setDepth(50);

    this.rewardText = this.add.text(8, 73, "STORM GLASS 0", {
      fontFamily: "monospace",
      fontSize: "8px",
      color: "#13262b"
    }).setDepth(50);

    this.comboText = this.add.text(8, 85, "COMBO x1", {
      fontFamily: "monospace",
      fontSize: "8px",
      color: "#13262b"
    }).setDepth(50);

    this.certaintyText = this.add.text(376, 73, "CERTAINTY ◆◆", {
      fontFamily: "monospace",
      fontSize: "8px",
      color: "#13262b"
    }).setOrigin(1, 0).setDepth(50);

    this.hintText = this.add.text(192, 203, "WASD / ARROWS: move   •   Q: swap future weather   •   reach the flag", {
      fontFamily: "monospace",
      fontSize: "6px",
      color: "#163038",
      backgroundColor: "#d9eadf",
      padding: { x: 4, y: 3 }
    }).setOrigin(0.5).setDepth(50);

    this.flashText = this.add.text(192, 111, "", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#fff7c9",
      stroke: "#173238",
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(100);

    this.swapKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.restartKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Touch-friendly on-screen controls.
    this.createTouchControls();

    // Explain the core chain in the level itself, without a wiki.
    this.add.text(192, 127, "RAIN wets seed → WIND carries seed → SUN grows bridge", {
      fontFamily: "monospace",
      fontSize: "7px",
      color: "#173238",
      backgroundColor: "#d9eadf",
      padding: { x: 3, y: 2 }
    }).setOrigin(0.5).setDepth(50);
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    if (this.run.status !== "ACTIVE") return;

    this.run.elapsedTime += dt;
    this.forecast.update(dt);

    const weather = this.forecast.getCurrentWeather();
    this.environment.update(weather, dt);
    this.playerController.update();

    this.combo.update(this.run.elapsedTime);
    this.updateWorldGraphics(weather);
    this.updateUI(weather);

    if (Phaser.Input.Keyboard.JustDown(this.swapKey)) {
      this.trySwap();
    }

    if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.scene.restart({ forecast: this.cloneForecast(this.run.forecast) });
    }

    this.checkExtraction();
    if (Phaser.Input.Keyboard.JustDown(this.interactKey) && this.nearExit) {
      this.extract();
    }

    if (this.forecast.isFinished() && !this.run.extraction.reached) {
      this.run.status = "FAILED";
      this.flashText.setText("FORECAST ENDED — R TO REPLAN");
    }
  }

  private bindEvents(): void {
    this.events.on(event => {
      if (event.type === "BASIC_SUCCESS") {
        this.combo.success(this.run.elapsedTime);
        const reward = this.rewards.award(event.reward);
        this.flashText.setText(`+${reward} STORM GLASS`);
        this.tweens.add({
          targets: this.flashText,
          alpha: { from: 1, to: 0 },
          duration: 1200,
          onComplete: () => this.flashText.setAlpha(1).setText("")
        });
      }

      if (event.type === "CHAIN_SUCCESS") {
        this.combo.success(this.run.elapsedTime);
        const reward = this.rewards.award(event.reward);
        this.flashText.setText(`CHAIN! ${event.chainId}  +${reward}`);
        this.tweens.add({
          targets: this.flashText,
          scale: { from: 1, to: 1.15 },
          alpha: { from: 1, to: 0 },
          duration: 1600,
          onComplete: () => this.flashText.setScale(1).setAlpha(1).setText("")
        });
      }

      if (event.type === "WEATHER_STARTED") {
        this.run.weatherHistory.push({
          weatherId: event.weather,
          startedAt: this.run.elapsedTime,
          endedAt: this.run.elapsedTime + BALANCE.weatherDuration
        });
      }
    });
  }

  private createPlayer(): void {
    const sprite = this.add.rectangle(
      this.run.player.position.x,
      this.run.player.position.y,
      10,
      14,
      0x3c5d68
    );
    this.physics.add.existing(sprite);
    this.playerSprite = sprite as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
    this.playerSprite.body.setCollideWorldBounds(true);
    this.playerSprite.setDepth(30);

    this.playerController = new PlayerController(
      this,
      this.playerSprite,
      this.run.player
    );
  }

  private drawLevel(extraction: { x: number; y: number }): void {
    this.add.rectangle(192, 108, 384, 216, 0x8fae9b);
    this.add.rectangle(192, 178, 384, 76, 0x6f8d76);

    // Route boundaries / stepping stones.
    this.add.rectangle(192, 155, 330, 5, 0x4c665a);
    this.add.rectangle(192, 110, 300, 3, 0x668477);

    this.add.rectangle(extraction.x, extraction.y, 20, 20, 0xd7c46e)
      .setStrokeStyle(2, 0x5a4a2c);

    this.add.text(extraction.x, extraction.y, "EXIT", {
      fontFamily: "monospace",
      fontSize: "6px",
      color: "#2d342d"
    }).setOrigin(0.5);

    const water = this.getObject("water_01")!;
    this.objectGraphics.set(
      water.id,
      this.add.rectangle(water.position.x, water.position.y, 48, 28, 0x497f89)
        .setStrokeStyle(2, 0x31545c)
    );

    const seed = this.getObject("seed_01")!;
    this.objectGraphics.set(
      seed.id,
      this.add.circle(seed.position.x, seed.position.y, 5, 0x765b3e)
    );

    const soil = this.getObject("soil_01")!;
    this.objectGraphics.set(
      soil.id,
      this.add.rectangle(soil.position.x, soil.position.y, 24, 12, 0x765b3e)
    );

    const plant = this.getObject("plant_01")!;
    this.objectGraphics.set(
      plant.id,
      this.add.rectangle(plant.position.x, plant.position.y, 5, 15, 0x4e7a4d)
    );

    const wind = this.getObject("wind_01")!;
    this.objectGraphics.set(
      wind.id,
      this.add.text(wind.position.x, wind.position.y, "≋", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#eef4e7"
      }).setOrigin(0.5)
    );

    const gate = this.getObject("gate_01")!;
    this.objectGraphics.set(
      gate.id,
      this.add.rectangle(gate.position.x, gate.position.y, 14, 30, 0x493d3b)
        .setStrokeStyle(2, 0x302827)
    );
  }

  private updateWorldGraphics(weather: string | null): void {
    const water = this.getObject("water_01")!;
    const waterGraphic = this.objectGraphics.get("water_01") as Phaser.GameObjects.Rectangle;
    if (waterGraphic && water.water) {
      const alpha = 0.2 + water.water.volume * 0.75;
      waterGraphic.setAlpha(alpha);
    }

    const seed = this.getObject("seed_01")!;
    const seedGraphic = this.objectGraphics.get("seed_01") as Phaser.GameObjects.Arc;
    if (seedGraphic) seedGraphic.setPosition(seed.position.x, seed.position.y);

    const plant = this.getObject("plant_01")!;
    const plantGraphic = this.objectGraphics.get("plant_01") as Phaser.GameObjects.Rectangle;
    if (plantGraphic && plant.plant) {
      plantGraphic.setPosition(plant.position.x, plant.position.y);
      plantGraphic.setScale(1, Math.max(0.05, plant.plant.growthProgress));
      plantGraphic.setAlpha(plant.plant.growthProgress > 0 ? 1 : 0.35);
    }

    const gate = this.getObject("gate_01")!;
    const gateGraphic = this.objectGraphics.get("gate_01") as Phaser.GameObjects.Rectangle;
    if (gateGraphic && gate.gate) {
      gateGraphic.setAlpha(gate.gate.opened ? 0.25 : 1);
    }

    const windGraphic = this.objectGraphics.get("wind_01");
    if (windGraphic) {
      (windGraphic as Phaser.GameObjects.Text).setAlpha(weather === "WIND" ? 1 : 0.35);
    }
  }

  private updateUI(weather: string | null): void {
    this.timelineUI.update();

    const icon = weather === "RAIN" ? "☔" : weather === "WIND" ? "≋" : weather === "SUN" ? "☀" : "—";
    this.weatherText.setText(`NOW ${icon} ${weather ?? "DONE"}`);

    const remaining = Math.max(
      0,
      this.run.forecast.slots.reduce((s, x) => s + x.duration, 0) - this.run.forecast.elapsed
    );
    this.timerText.setText(`${remaining.toFixed(1)}s`);

    this.rewardText.setText(`STORM GLASS ${this.run.stormGlass}`);
    this.comboText.setText(`COMBO x${this.run.combo.multiplier}`);
    this.certaintyText.setText(
      `CERTAINTY ${"◆".repeat(this.run.certainty.charges)}${"◇".repeat(this.run.certainty.maxCharges - this.run.certainty.charges)}`
    );
  }

  private trySwap(): void {
    if (this.run.certainty.charges <= 0) {
      this.flashText.setText("NO CERTAINTY");
      return;
    }

    const current = this.run.forecast.currentSlotIndex;
    const a = current + 1;
    const b = current + 2;

    if (b >= this.run.forecast.slots.length) {
      this.flashText.setText("NO TWO FUTURE EVENTS TO SWAP");
      return;
    }

    if (this.certainty.swap(this.forecast, a, b)) {
      this.flashText.setText("CERTAINTY: FUTURE WEATHER SWAPPED");
      this.tweens.add({
        targets: this.flashText,
        alpha: { from: 1, to: 0 },
        duration: 1000,
        onComplete: () => this.flashText.setAlpha(1).setText("")
      });
    }
  }

  private checkExtraction(): void {
    if (this.run.extraction.reached) return;

    const dx = this.run.player.position.x - 350;
    const dy = this.run.player.position.y - 70;
    this.nearExit = Math.hypot(dx, dy) < 18;

    if (this.nearExit) {
      const gate = this.getObject("gate_01")!;
      if (!gate.gate?.opened) {
        this.flashText.setText("THE GATE IS CLOSED — GROW THE PLANT");
      } else {
        this.flashText.setText("PRESS E TO EXTRACT");
      }
    }
  }

  private extract(): void {
    if (this.run.extraction.reached) return;
    this.run.extraction.reached = true;
    this.run.extraction.banked = true;
    this.run.status = "EXTRACTED";
    this.run.stormGlass += BALANCE.stormGlass.extraction;

    this.scene.time.delayedCall(500, () => {
      this.scene.start("ResultsScene", {
        stormGlass: this.run.stormGlass,
        combo: this.run.combo.multiplier,
        time: this.run.elapsedTime,
        forecast: this.run.forecast.slots.map(s => s.weatherId)
      });
    });
  }

  private createTouchControls(): void {
    const base = this.add.circle(42, 181, 26, 0x173238, 0.65)
      .setStrokeStyle(1, 0xd9eadf, 0.6)
      .setDepth(80);
    void base;

    const buttons = [
      { label: "▲", x: 42, y: 166, dx: 0, dy: -1 },
      { label: "▼", x: 42, y: 196, dx: 0, dy: 1 },
      { label: "◀", x: 27, y: 181, dx: -1, dy: 0 },
      { label: "▶", x: 57, y: 181, dx: 1, dy: 0 }
    ];

    for (const b of buttons) {
      const t = this.add.text(b.x, b.y, b.label, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#f5f1dd"
      }).setOrigin(0.5).setDepth(81).setInteractive();
      t.on("pointerdown", () => this.playerController.setVirtualDirection(b.dx, b.dy));
      t.on("pointerup", () => this.playerController.setVirtualDirection(0, 0));
      t.on("pointerout", () => this.playerController.setVirtualDirection(0, 0));
    }

    const interact = this.add.rectangle(337, 184, 60, 25, 0x173238, 0.75)
      .setStrokeStyle(1, 0xd9eadf, 0.6)
      .setDepth(80)
      .setInteractive();
    this.add.text(337, 184, "INTERACT", {
      fontFamily: "monospace",
      fontSize: "7px",
      color: "#f5f1dd"
    }).setOrigin(0.5).setDepth(81);
    interact.on("pointerdown", () => {
      if (this.nearExit) this.extract();
    });
  }

  private getObject(id: string): WorldObjectState | undefined {
    return this.run.worldObjects.find(o => o.id === id);
  }

  private cloneForecast(forecast: ForecastTimeline): ForecastTimeline {
    return structuredClone({
      ...forecast,
      currentSlotIndex: 0,
      elapsed: 0,
      running: true
    });
  }
}
