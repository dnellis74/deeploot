/**
 * Room Builder
 * 
 * Handles all room construction functionality including walls, doors,
 * treasure placement, and room layout.
 */

import Phaser from "phaser";
import {
  Colors,
  Sizes,
  Positions,
  GameConfig,
} from "../config/gameConfig";

/**
 * Interface for scenes that use RoomBuilder
 */
export interface IRoomScene extends Phaser.Scene {
  physics: Phaser.Physics.Arcade.ArcadePhysics;
  scale: Phaser.Scale.ScaleManager;
  add: Phaser.GameObjects.GameObjectFactory;
}

/**
 * Room Builder class
 * Manages room construction, walls, doors, and treasure
 */
export class RoomBuilder {
  private scene: IRoomScene;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private door!: Phaser.GameObjects.Rectangle;
  private treasure: Phaser.GameObjects.Arc | null = null;
  private onTreasureCollected?: () => void;

  constructor(scene: IRoomScene) {
    this.scene = scene;
    this.walls = this.scene.physics.add.staticGroup();
  }

  /**
   * Get the walls group
   */
  public getWalls(): Phaser.Physics.Arcade.StaticGroup {
    return this.walls;
  }

  /**
   * Get the door object
   */
  public getDoor(): Phaser.GameObjects.Rectangle {
    return this.door;
  }

  /**
   * Get the treasure object
   */
  public getTreasure(): Phaser.GameObjects.Arc | null {
    return this.treasure;
  }

  /**
   * Set callback for when treasure is collected
   */
  public setTreasureCollectedCallback(callback: () => void): void {
    this.onTreasureCollected = callback;
  }

  /**
   * Initialize the door (creates it once, called from scene create)
   */
  public initDoor(): void {
    const { width } = this.scene.scale;
    const wallThickness = Sizes.WALL_THICKNESS;
    const topWallY = Positions.ROOM_TOP_OFFSET + wallThickness / 2;
    const roomHeight = width; // Square room
    const bottomWallY = topWallY + roomHeight;
    const doorWidth = Sizes.DOOR_WIDTH;
    const doorX = width / 2;
    const doorY = bottomWallY;

    this.door = this.scene.add.rectangle(doorX, doorY, doorWidth, wallThickness, Colors.DOOR);
    this.scene.physics.add.existing(this.door, true);
  }

  /**
   * Build a new room - clears existing room and creates new one
   */
  public buildRoom(): void {
    const { width } = this.scene.scale;
    const wallThickness = Sizes.WALL_THICKNESS;

    // Clear existing room
    this.walls.clear(true, true);
    this.treasure?.destroy();
    this.treasure = null;

    // Calculate room dimensions to be roughly square
    // Top wall center should be at ROOM_TOP_OFFSET + wallThickness/2
    const topWallY = Positions.ROOM_TOP_OFFSET + wallThickness / 2;
    // Room height = width (for square), so bottom wall center = topWallY + width
    const roomHeight = width; // Make room square (width = 393)
    const bottomWallY = topWallY + roomHeight;
    const doorX = width / 2;
    const doorY = bottomWallY;
    const doorWidth = Sizes.DOOR_WIDTH;
    const doorHalfWidth = doorWidth / 2;

    // Create top wall (full wall) - positioned below instruction text
    this.createWall(width / 2, topWallY, width, wallThickness);
    
    // Create bottom wall with door opening (door stays stationary)
    const bottomWallSegmentWidth = width / 2 - doorHalfWidth;
    this.createWall(doorX - doorHalfWidth - bottomWallSegmentWidth / 2, doorY, bottomWallSegmentWidth, wallThickness);
    this.createWall(doorX + doorHalfWidth + bottomWallSegmentWidth / 2, doorY, bottomWallSegmentWidth, wallThickness);
    
    // Create left and right walls (spanning the room height)
    const roomCenterY = (topWallY + bottomWallY) / 2;
    this.createWall(wallThickness / 2, roomCenterY, wallThickness, roomHeight + wallThickness);

    this.createWall(width - wallThickness / 2, roomCenterY, wallThickness, roomHeight + wallThickness);

    // Place treasure
    this.placeTreasure();
    
    // Place a wall between player and treasure
    const playerX = width / 2;
    // Player spawn: bottom of room minus offset (reuse bottomWallY from above)
    const playerY = bottomWallY - Positions.PLAYER_OFFSET_Y;
    // placeTreasure() always creates a treasure, so it should not be null here
    if (!this.treasure) {
      throw new Error('Treasure was not created in placeTreasure()');
    }
    const treasureX = this.treasure.x;
    const treasureY = this.treasure.y;
    const wallX = (playerX + treasureX) / 2;
    const wallY = (playerY + treasureY) / 2;
    // Wall height should be based on room height, not screen height, and never exceed max ratio
    const wallHeight = Math.min(roomHeight * GameConfig.WALL_HEIGHT_RATIO, roomHeight * GameConfig.WALL_HEIGHT_MAX_RATIO);
    this.createWall(wallX, wallY, wallThickness, wallHeight);
  }

  /**
   * Place treasure at a random position within the room
   */
  private placeTreasure(): void {
    // Destroy existing treasure if it exists
    if (this.treasure) {
      this.treasure.destroy();
    }

    // Create a new treasure at a random position within the room
    const padding = Positions.PADDING;
    const topWallY = Positions.ROOM_TOP_OFFSET + Sizes.WALL_THICKNESS / 2;
    const roomTop = topWallY + Sizes.WALL_THICKNESS / 2 + padding;
    const roomBottom = topWallY + this.scene.scale.width - Sizes.WALL_THICKNESS / 2 - padding;
    const x = Phaser.Math.Between(padding, this.scene.scale.width - padding);
    const y = Phaser.Math.Between(roomTop + Positions.PADDING_TREASURE_Y_OFFSET, roomBottom);
    
    this.treasure = this.scene.add.circle(x, y, Sizes.TREASURE_RADIUS, Colors.TREASURE);
    this.scene.physics.add.existing(this.treasure, true);
  }

  /**
   * Create a wall segment
   */
  private createWall(x: number, y: number, width: number, height: number): void {
    const wall = this.scene.add.rectangle(x, y, width, height, Colors.WALL);
    this.scene.physics.add.existing(wall, true);
    this.walls.add(wall);
  }

  /**
   * Handle treasure collection (called from collision manager)
   */
  public collectTreasure(): void {
    if (this.treasure) {
      this.treasure.destroy();
      this.treasure = null;
      if (this.onTreasureCollected) {
        this.onTreasureCollected();
      }
    }
  }
}
