import Phaser from "phaser";
import type { Direction, PlayerState } from "../core/Types";

type PhysicsRect = Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };

export class PlayerController {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys: Record<string, Phaser.Input.Keyboard.Key>;
  private virtual = { x: 0, y: 0 };

  constructor(
    private scene: Phaser.Scene,
    private sprite: PhysicsRect,
    private state: PlayerState
  ) {
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.keys = scene.input.keyboard!.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
  }

  setVirtualDirection(x: number, y: number): void {
    this.virtual.x = Math.max(-1, Math.min(1, x));
    this.virtual.y = Math.max(-1, Math.min(1, y));
  }

  update(): void {
    const left = this.cursors.left?.isDown || this.keys.A.isDown;
    const right = this.cursors.right?.isDown || this.keys.D.isDown;
    const up = this.cursors.up?.isDown || this.keys.W.isDown;
    const down = this.cursors.down?.isDown || this.keys.S.isDown;

    let x = this.virtual.x;
    let y = this.virtual.y;

    if (left) x -= 1;
    if (right) x += 1;
    if (up) y -= 1;
    if (down) y += 1;

    const length = Math.hypot(x, y) || 1;
    const body = this.sprite.body;
    body.setVelocity(
      (x / length) * this.state.movementSpeed,
      (y / length) * this.state.movementSpeed
    );

    if (x < 0) this.state.facing = "LEFT";
    if (x > 0) this.state.facing = "RIGHT";

    this.state.position.x = this.sprite.x;
    this.state.position.y = this.sprite.y;
  }
}
