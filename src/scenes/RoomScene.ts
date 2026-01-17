import Phaser from "phaser";
import { MobileControls } from "./MobileControls";
import {
  Colors,
  Sizes,
  Speeds,
  Positions,
  GameConfig,
  PlayerTrianglePoints,
  DirectionAngles,
} from "../config/gameConfig";
import {
  loadSounds,
  playBackgroundMusic,
  playPowerUpSound,
} from "../config/sounds";
import { DebugFlags } from "../config/debug";
import dungeonWallImageUrl from "../assets/image/dungeon_brick_wall__8_bit__by_trarian_dez45u1-375w-2x.jpg";
import type { VirtualJoystickInstance } from "../types/joystick";
import { ArrowManager } from "../utils/arrow";
import { EnemyManager } from "../utils/enemyManager";
import { RoomBuilder } from "../utils/roomBuilder";
import { CollisionManager } from "../utils/collisionManager";

export class RoomScene extends Phaser.Scene {

  // ============================================================================
  // Instance Properties
  // ============================================================================
  private player!: Phaser.GameObjects.Triangle;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireKey?: Phaser.Input.Keyboard.Key;
  public joystick!: VirtualJoystickInstance; // Rex Virtual Joystick (public for MobileControls access)
  private isMobile: boolean = false;
  public joystickCursors?: Phaser.Types.Input.Keyboard.CursorKeys; // Public for MobileControls access
  public arrowManager!: ArrowManager; // Arrow management (public for MobileControls access)
  private enemyManager!: EnemyManager; // Enemy management
  private roomBuilder!: RoomBuilder; // Room building
  private collisionManager!: CollisionManager; // Collision management
  private scoreText!: Phaser.GameObjects.Text;
  private roomText!: Phaser.GameObjects.Text;
  private score = 0;
  private roomIndex = 1;
  public isGameOver = false; // Public for MobileControls access
  private lastDirection = 0; // 0-7 representing 8 directions
  private gameOverTransitioned = false; // Track if we've already triggered the transition back to MainScene
  // Cleanup references
  private timerEvents: Phaser.Time.TimerEvent[] = []; // Store timer events for cleanup
  private delayedCalls: Phaser.Time.TimerEvent[] = []; // Store delayed calls for cleanup

  constructor() {
    super("room");
  }

  preload() {
    // Load the dungeon wall background image
    this.load.image('dungeonWall', dungeonWallImageUrl);
  }

  create() {
    // Reset game over state
    this.isGameOver = false;
    this.gameOverTransitioned = false;
    this.score = 0;
    this.roomIndex = 1;

    // Check if device is mobile (has touch support)
    this.isMobile = this.sys.game.device.input.touch;

    // Set up input controls
    if (this.isMobile) {
      // Create virtual joystick for mobile
      const mobileControls = new MobileControls(this);
      mobileControls.loadAndSetup();
    } else {
      // Keyboard controls for desktop
      if (this.input.keyboard) {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      } else {
        console.error('Keyboard input not available');
      }
    }

    const { width, height } = this.scale;

    // Create tiled dungeon wall background covering the entire game area
    this.add.tileSprite(0, 0, width, height, 'dungeonWall')
      .setOrigin(0, 0)
      .setDepth(-2); // Behind everything, including the playfield

    // Calculate playfield dimensions (room area inside walls)
    const wallThickness = Sizes.WALL_THICKNESS;
    const topWallY = Positions.ROOM_TOP_OFFSET + wallThickness / 2;
    const roomHeight = width; // Square room
    const bottomWallY = topWallY + roomHeight;
    
    // Playfield is the area inside the walls
    const playfieldX = wallThickness;
    const playfieldY = topWallY + wallThickness / 2;
    const playfieldWidth = width - 2 * wallThickness;
    const playfieldHeight = roomHeight - wallThickness;
    
    // Create black background for the playfield (on top of the wall background)
    this.add.rectangle(
      playfieldX + playfieldWidth / 2,
      playfieldY + playfieldHeight / 2,
      playfieldWidth,
      playfieldHeight,
      0x000000
    ).setDepth(-1); // Behind game elements but on top of wall background

    this.add.text(width / 2, Positions.TITLE_Y, "Venture Arcade", {
      fontSize: Sizes.TITLE_FONT,
      color: Colors.TEXT_PRIMARY
    }).setOrigin(0.5, 0).setDepth(GameConfig.UI_Z_DEPTH);

    this.add.text(
      width / 2,
      Positions.INSTRUCTION_Y,
      "Move: ← → ↑ ↓  |  Fire: Space  |  Grab treasure  |  Exit via door",
      { fontSize: Sizes.INSTRUCTION_FONT, color: Colors.TEXT_SECONDARY }
    ).setOrigin(0.5, 0).setDepth(GameConfig.UI_Z_DEPTH);

    // Create player as a triangle (arrow pointing up initially)
    const playerX = width / 2;
    // Player spawn: bottom of room minus offset
    const playerY = bottomWallY - Positions.PLAYER_OFFSET_Y;
    this.player = this.add.triangle(
      playerX,
      playerY,
      PlayerTrianglePoints.x1,
      PlayerTrianglePoints.y1,
      PlayerTrianglePoints.x2,
      PlayerTrianglePoints.y2,
      PlayerTrianglePoints.x3,
      PlayerTrianglePoints.y3,
      Colors.PLAYER
    );
    this.physics.add.existing(this.player);
    const playerPhysicsBody = this.getPlayerBody();
    // Use circular body to work correctly at any rotation (Arcade physics bodies don't rotate)
    // Radius based on diagonal of triangle bounding box to cover all rotations
    const diagonal = Math.sqrt(Sizes.PLAYER_WIDTH * Sizes.PLAYER_WIDTH + Sizes.PLAYER_HEIGHT * Sizes.PLAYER_HEIGHT);
    const radius = diagonal / 2;
    playerPhysicsBody.setCircle(radius);
    playerPhysicsBody.setCollideWorldBounds(true);
    this.lastDirection = 0; // Start facing up
    this.updatePlayerVisual();

    
    // Initialize managers
    this.arrowManager = new ArrowManager(this);
    this.enemyManager = new EnemyManager(this);
    this.roomBuilder = new RoomBuilder(this);
    this.collisionManager = new CollisionManager(this);

    // Initialize player reference in managers that need it
    this.enemyManager.init(this.player);

    // Initialize collision manager with all required references
    this.collisionManager.init(
      this.player,
      this.arrowManager,
      this.enemyManager,
      this.roomBuilder
    );

    // Set up collision callbacks
    this.collisionManager.setGameOverCallback(() => {
      if (this.isGameOver) {
        return;
      }
      this.isGameOver = true;
      this.enemyManager.setGameOver(true);
    });

    this.collisionManager.setScoreChangeCallback((points: number) => {
      this.addScore(points);
    });

    // Set up treasure collection callback
    this.roomBuilder.setTreasureCollectedCallback(() => {
      // Treasure collection is handled in collision manager
    });

    // Create door once - it stays stationary on the wall
    this.roomBuilder.initDoor();

    // Build the initial room
    this.buildRoom();

    this.scoreText = this.add.text(Positions.UI_X, Positions.UI_SCORE_Y, "Score: 0", {
      fontSize: Sizes.SCORE_FONT,
      color: Colors.TEXT_SCORE
    }).setDepth(GameConfig.UI_Z_DEPTH);
    this.roomText = this.add.text(Positions.UI_X, Positions.UI_ROOM_Y, "Room: 1", {
      fontSize: Sizes.ROOM_FONT,
      color: Colors.TEXT_SECONDARY
    }).setDepth(GameConfig.UI_Z_DEPTH);

    // Set up all collisions
    this.collisionManager.setupCollisions();

    // Set up door overlap
    this.collisionManager.setupDoorOverlap(() => {
      if (this.isGameOver) {
        return;
      }
      
      this.roomIndex += 1;
      this.roomText.setText(`Room: ${this.roomIndex}`);
      this.buildRoom();
      
      // Play power-up sound when exiting room
      playPowerUpSound(this);
    });

    // Set up periodic enemy direction changes
    const directionChangeTimer = this.time.addEvent({
      delay: GameConfig.ENEMY_DIRECTION_CHANGE_DELAY,
      callback: () => this.enemyManager.changeEnemyDirections(),
      callbackScope: this,
      loop: true
    });
    this.timerEvents.push(directionChangeTimer);

    // Set up periodic check for new enemy spawns (every second)
    const spawnCheckTimer = this.time.addEvent({
      delay: GameConfig.ENEMY_SPAWN_CHECK_DELAY,
      callback: () => this.enemyManager.checkEnemySpawn(),
      callbackScope: this,
      loop: true
    });
    this.timerEvents.push(spawnCheckTimer);

    // Load sound effects and background music
    loadSounds(this);
    playBackgroundMusic(this);
  }

  update() {
    if (this.isGameOver) {
      // Handle game over transition after delay
      if (!this.gameOverTransitioned) {
        this.gameOverTransitioned = true;
        const delayedCall = this.time.delayedCall(GameConfig.GAME_OVER_TRANSITION_DELAY, () => {
          // Transition back to MainScene with final score
          this.scene.start('main', { finalScore: this.score });
        });
        this.delayedCalls.push(delayedCall);
      }
      return;
    }

    const playerBody = this.getPlayerBody();
    const speed = Speeds.PLAYER;
    let velocityX = 0;
    let velocityY = 0;

    // Get input from joystick (mobile) or keyboard (desktop)
    // Use joystick cursors if available, otherwise use keyboard cursors
    const activeCursors = this.joystickCursors || this.cursors;
    
    if (activeCursors) {
      if (activeCursors.left?.isDown) {
        velocityX = -speed;
      } else if (activeCursors.right?.isDown) {
        velocityX = speed;
      }

      if (activeCursors.up?.isDown) {
        velocityY = -speed;
      } else if (activeCursors.down?.isDown) {
        velocityY = speed;
      }
    }

    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= Speeds.DIAGONAL_MULTIPLIER;
      velocityY *= Speeds.DIAGONAL_MULTIPLIER;
    }

    // Update direction based on movement
    if (velocityX !== 0 || velocityY !== 0) {
      this.updatePlayerDirection(velocityX, velocityY);
    }

    // Handle firing (only if no arrows exist) - keyboard only (mobile uses button)
    if (!this.isMobile && this.fireKey?.isDown && this.arrowManager.canFire()) {
      this.shootArrow();
    }

    playerBody.setVelocity(velocityX, velocityY);

    // Update purple enemies to move toward player
    this.enemyManager.updatePurpleEnemies();
  }


  // ============================================================================
  // Update Methods - Player Movement & Actions
  // ============================================================================

  private updatePlayerDirection(velocityX: number, velocityY: number) {
    // Determine direction (0-7): Up, Up-Right, Right, Down-Right, Down, Down-Left, Left, Up-Left
    let direction = 0;
    
    if (velocityY < 0) { // Moving up
      if (velocityX < 0) direction = 7; // Up-Left
      else if (velocityX > 0) direction = 1; // Up-Right
      else direction = 0; // Up
    } else if (velocityY > 0) { // Moving down
      if (velocityX < 0) direction = 5; // Down-Left
      else if (velocityX > 0) direction = 3; // Down-Right
      else direction = 4; // Down
    } else { // Only horizontal movement
      if (velocityX < 0) direction = 6; // Left
      else if (velocityX > 0) direction = 2; // Right
    }

    // Only update if direction changed
    if (direction !== this.lastDirection) {
      this.lastDirection = direction;
      this.updatePlayerVisual();
    }
  }

  private updatePlayerVisual() {
    // Rotate player triangle to point in the direction of movement
    // Directions: 0=Up, 1=Up-Right, 2=Right, 3=Down-Right, 4=Down, 5=Down-Left, 6=Left, 7=Up-Left
    this.player.setRotation(Phaser.Math.DegToRad(DirectionAngles[this.lastDirection]));
  }

  public shootArrow(): void { // Public for MobileControls access
    this.arrowManager.shootArrow(this.player.x, this.player.y, this.lastDirection);
  }


  // ============================================================================
  // Game Logic - Room Building & Entity Management
  // ============================================================================

  private buildRoom() {
    const { width } = this.scale;
    const wallThickness = Sizes.WALL_THICKNESS;

    // Clear existing room and entities
    this.arrowManager.clear();
    this.enemyManager.clearEnemies();

    // Build new room
    this.roomBuilder.buildRoom();

    // Start new room with enemies
    this.enemyManager.startRoom(GameConfig.ENEMY_COUNT);

    // Reset player position
    const topWallY = Positions.ROOM_TOP_OFFSET + wallThickness / 2;
    const roomHeight = width; // Make room square
    const bottomWallY = topWallY + roomHeight;
    const playerX = width / 2;
    const playerY = bottomWallY - Positions.PLAYER_OFFSET_Y;

    const playerBody = this.getPlayerBody();
    playerBody.setVelocity(0, 0);
    this.player.setPosition(playerX, playerY);

    // Re-establish treasure collisions after building room
    this.collisionManager.setupTreasureCollisions();

    // Ensure UI text stays on top after building new room (if it exists)
    if (this.scoreText) {
      this.scoreText.setDepth(GameConfig.UI_Z_DEPTH);
    }
    if (this.roomText) {
      this.roomText.setDepth(GameConfig.UI_Z_DEPTH);
    }
  }

  // ============================================================================
  // Helper Methods - Type Casting & Common Patterns
  // ============================================================================

  private getPlayerBody(): Phaser.Physics.Arcade.Body {
    return this.player.body as Phaser.Physics.Arcade.Body;
  }

  private addScore(points: number): void {
    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);
  }

  /**
   * Cleanup method called when scene is shut down
   * Removes all event listeners, timers, colliders, and physics bodies
   */
  shutdown() {
    // Destroy all timer events
    this.timerEvents.forEach(timer => {
      if (timer && !timer.hasDispatched) {
        timer.destroy();
      }
    });
    this.timerEvents = [];

    // Destroy all delayed calls
    this.delayedCalls.forEach(call => {
      if (call && !call.hasDispatched) {
        call.destroy();
      }
    });
    this.delayedCalls = [];

    // Clean up collision manager (removes all colliders and overlaps)
    if (this.collisionManager) {
      this.collisionManager.cleanup();
    }

    // Destroy arrow manager (cleans up its event listeners)
    if (this.arrowManager) {
      this.arrowManager.destroy();
    }

    // Clean up joystick if present (mobile controls)
    if (this.joystick && typeof this.joystick.destroy === 'function') {
      this.joystick.destroy();
    }
    this.joystick = undefined as any; // Reset to undefined but keep type compatibility
    this.joystickCursors = undefined;

    // Clean up keyboard listeners (Phaser handles this automatically, but we can clear references)
    this.cursors = undefined;
    this.fireKey = undefined;
  }
}
