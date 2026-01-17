/**
 * Collision Manager
 * 
 * Handles all collision and overlap setup, management, and cleanup.
 */

import Phaser from "phaser";
import { ArrowManager } from "./arrow";
import { EnemyManager } from "./enemyManager";
import { RoomBuilder } from "./roomBuilder";
import { Colors, Sizes, GameConfig } from "../config/gameConfig";
import { playHitSound, playBoomSound, playPickupSound } from "../config/sounds";

/**
 * Interface for scenes that use CollisionManager
 */
export interface ICollisionScene extends Phaser.Scene {
  physics: Phaser.Physics.Arcade.ArcadePhysics;
  scale: Phaser.Scale.ScaleManager;
}

/**
 * Collision Manager class
 * Manages all collisions and overlaps in the game
 */
export class CollisionManager {
  private scene: ICollisionScene;
  private colliders: Phaser.Physics.Arcade.Collider[] = [];
  private overlaps: Phaser.Physics.Arcade.Collider[] = [];
  private player?: Phaser.GameObjects.Triangle;
  private arrowManager?: ArrowManager;
  private enemyManager?: EnemyManager;
  private roomBuilder?: RoomBuilder;
  private onGameOver?: () => void;
  private onScoreChange?: (points: number) => void;

  constructor(scene: ICollisionScene) {
    this.scene = scene;
  }

  /**
   * Initialize collision manager with required game objects and managers
   */
  public init(
    player: Phaser.GameObjects.Triangle,
    arrowManager: ArrowManager,
    enemyManager: EnemyManager,
    roomBuilder: RoomBuilder
  ): void {
    this.player = player;
    this.arrowManager = arrowManager;
    this.enemyManager = enemyManager;
    this.roomBuilder = roomBuilder;
  }

  /**
   * Set callback for game over event
   */
  public setGameOverCallback(callback: () => void): void {
    this.onGameOver = callback;
  }

  /**
   * Set callback for score changes
   */
  public setScoreChangeCallback(callback: (points: number) => void): void {
    this.onScoreChange = callback;
  }

  /**
   * Set up all collisions in the game
   */
  public setupCollisions(): void {
    if (!this.player || !this.arrowManager || !this.enemyManager || !this.roomBuilder) {
      throw new Error('CollisionManager must be initialized before setting up collisions');
    }

    // Player-wall collisions
    const playerWallCollider = this.scene.physics.add.collider(
      this.player,
      this.roomBuilder.getWalls()
    );
    this.colliders.push(playerWallCollider);

    // Arrow-wall collisions (handled by ArrowManager)
    this.arrowManager.setupWallCollisions(this.roomBuilder.getWalls());

    // Enemy collisions
    this.setupEnemyCollisions();

    // Treasure collisions
    this.setupTreasureCollisions();
  }

  /**
   * Set up enemy-related collisions
   */
  private setupEnemyCollisions(): void {
    if (!this.player || !this.arrowManager || !this.enemyManager) {
      return;
    }

    const { width, height } = this.scene.scale;
    const enemies = this.enemyManager.getEnemies();
    const purpleEnemies = this.enemyManager.getPurpleEnemies();

    // Collider with walls
    const enemyWallCollider = this.scene.physics.add.collider(
      enemies,
      this.roomBuilder!.getWalls()
    );
    this.colliders.push(enemyWallCollider);

    // Overlap with arrows
    this.arrowManager.setupEnemyCollisions(
      enemies,
      purpleEnemies,
      (enemy) => {
        // Turn enemy red, stop moving, but don't destroy
        enemy.setFillStyle(Colors.ENEMY_HIT);
        const enemyBody = this.getEnemyBody(enemy);
        enemyBody.setVelocity(0, 0); // Stop movement

        if (this.onScoreChange) {
          this.onScoreChange(GameConfig.SCORE_ENEMY);
        }

        // Play hit sound
        playHitSound(this.scene);
      }
    );

    // Overlap with player (game over)
    const playerEnemyOverlap = this.scene.physics.add.overlap(
      this.player,
      enemies,
      () => {
        if (this.onGameOver) {
          this.onGameOver();
        }
        this.scene.physics.pause();
        this.player!.setFillStyle(Colors.GAME_OVER);
        this.scene.add.text(width / 2, height / 2, "Game Over", {
          fontSize: Sizes.GAME_OVER_FONT,
          color: Colors.TEXT_GAME_OVER
        }).setOrigin(0.5);

        // Play game over sound
        playBoomSound(this.scene);
      }
    );
    this.overlaps.push(playerEnemyOverlap);
  }

  /**
   * Set up treasure collisions
   */
  public setupTreasureCollisions(): void {
    if (!this.player || !this.roomBuilder) {
      return;
    }

    const treasure = this.roomBuilder.getTreasure();
    if (!treasure) {
      return; // No treasure to set up collisions for
    }

    const treasureOverlap = this.scene.physics.add.overlap(
      this.player,
      treasure,
      () => {
        // Defensive null check - treasure might have been destroyed elsewhere
        if (!this.roomBuilder!.getTreasure()) {
          return;
        }

        if (this.onScoreChange) {
          this.onScoreChange(GameConfig.SCORE_TREASURE);
        }

        // Destroy treasure when collected (new treasure spawns only at start of new room)
        this.roomBuilder!.collectTreasure();

        // Play pickup sound
        playPickupSound(this.scene);
      }
    );
    this.overlaps.push(treasureOverlap);
  }

  /**
   * Set up door overlap with player
   */
  public setupDoorOverlap(onDoorEnter: () => void): void {
    if (!this.player || !this.roomBuilder) {
      return;
    }

    const doorOverlap = this.scene.physics.add.overlap(
      this.player,
      this.roomBuilder.getDoor(),
      () => {
        onDoorEnter();
      }
    );
    this.overlaps.push(doorOverlap);
  }

  /**
   * Get enemy body helper
   */
  private getEnemyBody(enemy: Phaser.GameObjects.Arc): Phaser.Physics.Arcade.Body {
    return enemy.body as Phaser.Physics.Arcade.Body;
  }

  /**
   * Clean up all collisions and overlaps
   */
  public cleanup(): void {
    // Remove all colliders
    this.colliders.forEach(collider => {
      if (collider) {
        collider.destroy();
      }
    });
    this.colliders = [];

    // Remove all overlaps
    this.overlaps.forEach(overlap => {
      if (overlap) {
        overlap.destroy();
      }
    });
    this.overlaps = [];
  }
}
