/**
 * Arrow Manager
 * 
 * Handles all arrow/shooting functionality including creation, movement,
 * cleanup, and collision detection.
 */

import Phaser from "phaser";
import {
  Colors,
  Sizes,
  Speeds,
  Positions,
  GameConfig,
  DirectionAngles,
} from "../config/gameConfig";
import { playShootSound } from "../config/sounds";
import { DebugFlags } from "../config/debug";

/**
 * Interface for scenes that use ArrowManager
 */
export interface IArrowScene extends Phaser.Scene {
  physics: Phaser.Physics.Arcade.ArcadePhysics;
  scale: Phaser.Scale.ScaleManager;
  time: Phaser.Time.Clock;
}

/**
 * Arrow Manager class
 * Manages arrow creation, shooting, cleanup, and collisions
 */
export class ArrowManager {
  private arrows: Phaser.Physics.Arcade.Group;
  private nextFire: number = 0;
  private scene: IArrowScene;

  constructor(scene: IArrowScene) {
    this.scene = scene;
    this.arrows = this.createArrowGroup();
    this.setupWorldBoundsHandler();
  }

  /**
   * Sets up world bounds event handler to automatically destroy arrows
   */
  private setupWorldBoundsHandler(): void {
    this.scene.physics.world.on('worldbounds', (event: any) => {
      // Only handle arrows
      if (event.body && event.body.gameObject) {
        const arrow = event.body.gameObject as Phaser.GameObjects.Rectangle;
        // Verify it's actually an arrow from our group
        if (this.arrows.contains(arrow)) {
          if (DebugFlags.debugLog) {
            console.log(`Arrow destroyed: Hit world bounds at (${arrow.x.toFixed(1)}, ${arrow.y.toFixed(1)})`);
          }
          arrow.destroy();
        }
      }
    });
  }

  /**
   * Creates the arrow physics group
   */
  private createArrowGroup(): Phaser.Physics.Arcade.Group {
    return this.scene.physics.add.group({
      classType: Phaser.GameObjects.Rectangle,
      createCallback: (obj) => {
        const rect = obj as Phaser.GameObjects.Rectangle;
        rect.setSize(Sizes.ARROW_WIDTH, Sizes.ARROW_HEIGHT);
        rect.setFillStyle(Colors.ARROW);
      }
    });
  }

  /**
   * Gets the arrow group (for external access)
   */
  public getArrows(): Phaser.Physics.Arcade.Group {
    return this.arrows;
  }

  /**
   * Gets the nextFire timestamp (for fire rate limiting)
   */
  public getNextFire(): number {
    return this.nextFire;
  }

  /**
   * Sets the nextFire timestamp
   */
  public setNextFire(time: number): void {
    this.nextFire = time;
  }

  /**
   * Checks if player can fire (no active arrows and fire rate allows)
   */
  public canFire(): boolean {
    return this.arrows.countActive(true) === 0 && this.scene.time.now > this.nextFire;
  }

  /**
   * Shoots an arrow from the player position in the specified direction
   * @param playerX - Player X position
   * @param playerY - Player Y position
   * @param direction - Direction index (0-7)
   */
  public shootArrow(playerX: number, playerY: number, direction: number): void {
    if (!this.canFire()) {
      return;
    }

    const arrowSpeed = Speeds.ARROW;
    const angle = DirectionAngles[direction];
    const angleRadians = Phaser.Math.DegToRad(angle + GameConfig.ANGLE_OFFSET);

    // Calculate offset to spawn arrow ahead of player to avoid immediate wall collisions
    // Offset by half player size (max 16/2 = 8) plus arrow length (12) plus a small buffer (4)
    const spawnOffset = Math.max(Sizes.PLAYER_WIDTH, Sizes.PLAYER_HEIGHT) / 2 + Sizes.ARROW_HEIGHT / 2 + 4;
    const arrowStartX = playerX + Math.cos(angleRadians) * spawnOffset;
    const arrowStartY = playerY + Math.sin(angleRadians) * spawnOffset;

    if (DebugFlags.debugLog) {
      console.log(`Arrow spawned: Player at (${playerX.toFixed(1)}, ${playerY.toFixed(1)}), Arrow at (${arrowStartX.toFixed(1)}, ${arrowStartY.toFixed(1)}), Direction: ${direction}`);
    }

    // Get/Create arrow from the Physics Group
    const arrow = this.arrows.get(arrowStartX, arrowStartY) as Phaser.GameObjects.Rectangle;

    if (arrow) {
      arrow.setActive(true).setVisible(true);
      
      // Set rotation
      arrow.setRotation(angleRadians);
      
      // Set velocity and ensure physics body size matches visual size
      const body = this.getArrowBody(arrow);
      body.setSize(Sizes.ARROW_WIDTH, Sizes.ARROW_HEIGHT);
      body.setVelocity(
        Math.cos(angleRadians) * arrowSpeed,
        Math.sin(angleRadians) * arrowSpeed
      );

      // Setup world bounds collision
      body.setCollideWorldBounds(true);
      body.onWorldBounds = true;

      // Update fire rate limit
      this.nextFire = this.scene.time.now + GameConfig.FIRE_RATE_DELAY;

      // Play shoot sound
      playShootSound(this.scene);
    }
  }


  /**
   * Sets up collision between arrows and walls
   * @param walls - Static group of walls
   */
  public setupWallCollisions(walls: Phaser.Physics.Arcade.StaticGroup): void {
    this.scene.physics.add.collider(this.arrows, walls, (arrow) => {
      const arrowRect = arrow as Phaser.GameObjects.Rectangle;
      if (DebugFlags.debugLog) {
        console.log(`Arrow destroyed: Collided with wall at (${arrowRect.x.toFixed(1)}, ${arrowRect.y.toFixed(1)})`);
      }
      arrowRect.destroy();
    });
  }

  /**
   * Sets up collision between arrows and enemies
   * @param enemies - Group of enemies
   * @param purpleEnemies - Set of purple enemies (invulnerable)
   * @param onEnemyHit - Callback when enemy is hit
   */
  public setupEnemyCollisions(
    enemies: Phaser.Physics.Arcade.Group,
    purpleEnemies: Set<Phaser.GameObjects.Arc>,
    onEnemyHit: (enemy: Phaser.GameObjects.Arc) => void
  ): void {
    this.scene.physics.add.overlap(this.arrows, enemies, (arrow, enemy) => {
      const arrowRect = arrow as Phaser.GameObjects.Rectangle;
      const enemyCircle = enemy as Phaser.GameObjects.Arc;
      
      // Purple enemies are invulnerable to arrows - just destroy the arrow
      if (purpleEnemies.has(enemyCircle)) {
        if (DebugFlags.debugLog) {
          console.log(`Arrow destroyed: Hit invulnerable purple enemy at (${arrowRect.x.toFixed(1)}, ${arrowRect.y.toFixed(1)})`);
        }
        arrowRect.destroy();
        return;
      }
      
      // Destroy the arrow
      if (DebugFlags.debugLog) {
        console.log(`Arrow destroyed: Hit enemy at (${arrowRect.x.toFixed(1)}, ${arrowRect.y.toFixed(1)})`);
      }
      arrowRect.destroy();
      
      // Call the hit callback
      onEnemyHit(enemyCircle);
    });
  }

  /**
   * Clears all arrows
   */
  public clear(): void {
    this.arrows.clear(true, true);
  }

  /**
   * Gets the physics body of an arrow
   */
  private getArrowBody(arrow: Phaser.GameObjects.Rectangle): Phaser.Physics.Arcade.Body {
    return arrow.body as Phaser.Physics.Arcade.Body;
  }
}
