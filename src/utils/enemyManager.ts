/**
 * Enemy Manager
 * 
 * Handles all enemy-related functionality including spawning, movement,
 * direction changes, and tracking.
 */

import Phaser from "phaser";
import {
  Colors,
  Sizes,
  Speeds,
  Positions,
  GameConfig,
} from "../config/gameConfig";
import { DebugFlags } from "../config/debug";

/**
 * Interface for scenes that use EnemyManager
 */
export interface IEnemyScene extends Phaser.Scene {
  physics: Phaser.Physics.Arcade.ArcadePhysics;
  scale: Phaser.Scale.ScaleManager;
  time: Phaser.Time.Clock;
  add: Phaser.GameObjects.GameObjectFactory;
}

/**
 * Enemy Manager class
 * Manages enemy creation, spawning, movement, and tracking
 */
export class EnemyManager {
  private enemies!: Phaser.Physics.Arcade.Group;
  private purpleEnemies = new Set<Phaser.GameObjects.Arc>(); // Track purple enemies that hunt the player
  private scene: IEnemyScene;
  private roomStartTime = 0; // Timestamp when the current room started
  private hasSpawnedExtraEnemy = false; // Track if extra enemy has been spawned for current room
  private player?: Phaser.GameObjects.Triangle;
  private isGameOver = false;

  constructor(scene: IEnemyScene) {
    this.scene = scene;
    this.enemies = this.scene.physics.add.group();
  }

  /**
   * Initialize enemy manager with player reference
   */
  public init(player: Phaser.GameObjects.Triangle): void {
    this.player = player;
  }

  /**
   * Get the enemies group
   */
  public getEnemies(): Phaser.Physics.Arcade.Group {
    return this.enemies;
  }

  /**
   * Get the purple enemies set
   */
  public getPurpleEnemies(): Set<Phaser.GameObjects.Arc> {
    return this.purpleEnemies;
  }

  /**
   * Start a new room - reset state and spawn initial enemies
   */
  public startRoom(enemyCount: number = GameConfig.ENEMY_COUNT): void {
    this.roomStartTime = this.scene.time.now;
    this.hasSpawnedExtraEnemy = false;
    this.clearEnemies();
    
    // Spawn initial enemies
    for (let i = 0; i < enemyCount; i++) {
      this.spawnEnemy();
    }
  }

  /**
   * Clear all enemies
   */
  public clearEnemies(): void {
    this.enemies.clear(true, true);
    this.purpleEnemies.clear();
  }

  /**
   * Set game over state
   */
  public setGameOver(isGameOver: boolean): void {
    this.isGameOver = isGameOver;
  }

  /**
   * Get enemy body helper
   */
  private getEnemyBody(enemy: Phaser.GameObjects.Arc): Phaser.Physics.Arcade.Body {
    return enemy.body as Phaser.Physics.Arcade.Body;
  }

  /**
   * Spawn a regular enemy at a random position
   */
  public spawnEnemy(): void {
    const topWallY = Positions.ROOM_TOP_OFFSET + Sizes.WALL_THICKNESS / 2;
    const roomTop = topWallY + Sizes.WALL_THICKNESS / 2;
    const roomBottom = topWallY + this.scene.scale.width - Sizes.WALL_THICKNESS / 2;
    const x = Phaser.Math.Between(Positions.SPAWN_MIN_X, this.scene.scale.width - Positions.SPAWN_MIN_X);
    const y = Phaser.Math.Between(
      Math.max(roomTop + Positions.SPAWN_MIN_Y, Positions.SPAWN_MIN_Y),
      roomBottom - Positions.SPAWN_MAX_Y_OFFSET
    );
    
    const enemy = this.scene.add.circle(x, y, Sizes.ENEMY_RADIUS, Colors.ENEMY);
    this.enemies.add(enemy);
    this.scene.physics.add.existing(enemy);
    const enemyBody = this.getEnemyBody(enemy);
    this.setRandomEnemyVelocity(enemyBody);
    enemyBody.setBounce(GameConfig.ENEMY_BOUNCE_X, GameConfig.ENEMY_BOUNCE_Y);
    enemyBody.setCollideWorldBounds(true);
  }

  /**
   * Spawn a purple enemy that hunts the player
   */
  public spawnPurpleEnemy(): void {
    const { width } = this.scene.scale;
    const wallThickness = Sizes.WALL_THICKNESS;
    const topWallY = Positions.ROOM_TOP_OFFSET + wallThickness / 2;
    
    // Spawn at the top of the room, centered horizontally
    const x = width / 2;
    const y = topWallY + wallThickness / 2 + Sizes.ENEMY_RADIUS + GameConfig.PURPLE_ENEMY_SPAWN_OFFSET;
    
    const enemy = this.scene.add.circle(x, y, Sizes.ENEMY_RADIUS, Colors.ENEMY_PURPLE);
    this.enemies.add(enemy);
    this.purpleEnemies.add(enemy); // Track as purple enemy
    this.scene.physics.add.existing(enemy);
    const enemyBody = this.getEnemyBody(enemy);
    enemyBody.setBounce(GameConfig.ENEMY_BOUNCE_X, GameConfig.ENEMY_BOUNCE_Y);
    enemyBody.setCollideWorldBounds(true);
    // Initial velocity will be set in updatePurpleEnemies
  }

  /**
   * Update purple enemies to move toward player
   */
  public updatePurpleEnemies(): void {
    if (this.purpleEnemies.size === 0 || this.isGameOver || !this.player) {
      return;
    }

    const playerX = this.player.x;
    const playerY = this.player.y;
    // Purple enemy is faster than the player
    const speed = Speeds.PLAYER * GameConfig.PURPLE_ENEMY_SPEED_MULTIPLIER;

    // Update each purple enemy to move toward player
    this.purpleEnemies.forEach((enemy) => {
      if (!enemy.active) {
        // Remove destroyed enemies from tracking
        this.purpleEnemies.delete(enemy);
        return;
      }

      const enemyBody = this.getEnemyBody(enemy);
      if (!enemyBody) {
        return;
      }

      // Calculate direction to player
      const dx = playerX - enemy.x;
      const dy = playerY - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        // Normalize and set velocity toward player
        const velocityX = (dx / distance) * speed;
        const velocityY = (dy / distance) * speed;
        enemyBody.setVelocity(velocityX, velocityY);
      }
    });
  }

  /**
   * Change directions for all active (non-hit) enemies
   */
  public changeEnemyDirections(): void {
    this.forEachActiveEnemy((enemy, enemyBody) => {
      // Only change direction for active (green) enemies, not hit (red) ones
      if (enemyBody.velocity.x !== 0 && enemyBody.velocity.y !== 0) {
        this.setRandomEnemyVelocity(enemyBody);
      }
    });
  }

  /**
   * Check if a new enemy should be spawned based on elapsed time
   */
  public checkEnemySpawn(): void {
    // Don't spawn if game is over, room hasn't started, or already spawned extra enemy
    if (this.isGameOver || this.roomStartTime === 0 || this.hasSpawnedExtraEnemy) {
      return;
    }

    // Calculate elapsed time in seconds
    const elapsedSeconds = (this.scene.time.now - this.roomStartTime) / GameConfig.MILLISECONDS_PER_SECOND;

    if (DebugFlags.debugLog) {
      console.log(`Elapsed: ${elapsedSeconds.toFixed(2)}`);
    }

    // Spawn chance starts after configured time with base chance
    if (elapsedSeconds < GameConfig.ENEMY_SPAWN_START_TIME) {
      return;
    }

    // Calculate probability: starting at base chance, increasing by increment each second
    const probability = Math.min(
      (elapsedSeconds - GameConfig.ENEMY_SPAWN_TIME_OFFSET) * GameConfig.ENEMY_SPAWN_CHANCE_INCREMENT,
      GameConfig.ENEMY_SPAWN_MAX_CHANCE
    );

    // Roll random chance
    const roll = Phaser.Math.Between(GameConfig.ENEMY_SPAWN_ROLL_MIN, GameConfig.ENEMY_SPAWN_ROLL_MAX);

    if (DebugFlags.debugLog) {
      console.log(`Elapsed: ${elapsedSeconds.toFixed(2)}s, Probability: ${probability.toFixed(1)}%, Roll: ${roll}`);
    }

    if (roll < probability) {
      // Mark that we've spawned an extra enemy for this room
      this.hasSpawnedExtraEnemy = true;
      
      // Spawn the purple enemy
      this.spawnPurpleEnemy();
      
      // Log debug message when new enemy appears
      if (DebugFlags.debugLog) {
        console.log(`New enemy spawn triggered! Elapsed: ${elapsedSeconds.toFixed(2)}s, Probability: ${probability.toFixed(1)}%, Roll: ${roll}`);
      }
    }
  }

  /**
   * Iterate over all active enemies
   */
  private forEachActiveEnemy(
    callback: (enemy: Phaser.GameObjects.Arc, enemyBody: Phaser.Physics.Arcade.Body) => void
  ): void {
    this.enemies.children.entries.forEach((child) => {
      const enemy = child as Phaser.GameObjects.Arc;
      const enemyBody = this.getEnemyBody(enemy);
      if (enemyBody) {
        callback(enemy, enemyBody);
      }
    });
  }

  /**
   * Set random velocity for an enemy
   */
  private setRandomEnemyVelocity(enemyBody: Phaser.Physics.Arcade.Body): void {
    const speed = Speeds.ENEMY;
    enemyBody.setVelocity(
      Phaser.Math.Between(-speed, speed),
      Phaser.Math.Between(-speed, speed)
    );
  }
}
