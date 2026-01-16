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
  playShootSound,
  playHitSound,
  playBoomSound,
  playPickupSound,
  playPowerUpSound,
} from "../config/sounds";
import { DebugFlags } from "../config/debug";
import dungeonWallImageUrl from "../assets/image/dungeon_brick_wall__8_bit__by_trarian_dez45u1-375w-2x.jpg";
import type { VirtualJoystickInstance } from "../types/joystick";

export class RoomScene extends Phaser.Scene {

  // ============================================================================
  // Instance Properties
  // ============================================================================
  private player!: Phaser.GameObjects.Triangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireKey!: Phaser.Input.Keyboard.Key;
  joystick!: VirtualJoystickInstance; // Rex Virtual Joystick (public for MobileControls access)
  private isMobile: boolean = false;
  joystickCursors?: Phaser.Types.Input.Keyboard.CursorKeys; // Public for MobileControls access
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  arrows!: Phaser.Physics.Arcade.Group; // Public for MobileControls access
  private door!: Phaser.GameObjects.Rectangle;
  private treasure: Phaser.GameObjects.Arc | null = null;
  private enemies!: Phaser.Physics.Arcade.Group;
  private purpleEnemies = new Set<Phaser.GameObjects.Arc>(); // Track purple enemies that hunt the player
  private scoreText!: Phaser.GameObjects.Text;
  private roomText!: Phaser.GameObjects.Text;
  private score = 0;
  private roomIndex = 1;
  isGameOver = false; // Public for MobileControls access
  private lastDirection = 0; // 0-7 representing 8 directions
  nextFire = 0; // Fire rate limiting (public for MobileControls access)
  private roomStartTime = 0; // Timestamp when the current room started
  private hasSpawnedExtraEnemy = false; // Track if extra enemy has been spawned for current room
  private gameOverTransitioned = false; // Track if we've already triggered the transition back to MainScene

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
      this.cursors = this.input.keyboard!.createCursorKeys();
      this.fireKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
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
    playerPhysicsBody.setSize(Sizes.PLAYER_WIDTH, Sizes.PLAYER_HEIGHT);
    playerPhysicsBody.setCollideWorldBounds(true);
    this.lastDirection = 0; // Start facing up
    this.updatePlayerVisual();

    
    this.walls = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.arrows = this.physics.add.group({
      classType: Phaser.GameObjects.Rectangle, // Tells the group to create Rectangles
      createCallback: (obj) => {
          const rect = obj as Phaser.GameObjects.Rectangle;
          rect.setSize(Sizes.ARROW_WIDTH, Sizes.ARROW_HEIGHT);
          rect.setFillStyle(Colors.ARROW);
      }
  });

    // Create door once - it stays stationary on the wall
    const doorWidth = Sizes.DOOR_WIDTH;
    const doorX = width / 2;
    // Door position will be set in buildRoom, use temporary position here
    const doorY = bottomWallY;
    this.door = this.add.rectangle(doorX, doorY, doorWidth, wallThickness, Colors.DOOR);
    this.physics.add.existing(this.door, true);

    this.buildRoom();

    this.scoreText = this.add.text(Positions.UI_X, Positions.UI_SCORE_Y, "Score: 0", {
      fontSize: Sizes.SCORE_FONT,
      color: Colors.TEXT_SCORE
    }).setDepth(GameConfig.UI_Z_DEPTH);
    this.roomText = this.add.text(Positions.UI_X, Positions.UI_ROOM_Y, "Room: 1", {
      fontSize: Sizes.ROOM_FONT,
      color: Colors.TEXT_SECONDARY
    }).setDepth(GameConfig.UI_Z_DEPTH);

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.arrows, this.walls, (arrow) => {
      arrow.destroy();
    });

    // Set up enemy collisions (once for the group, works for all enemies)
    this.setupEnemyCollisions();

    // Set up periodic enemy direction changes
    this.time.addEvent({
      delay: GameConfig.ENEMY_DIRECTION_CHANGE_DELAY,
      callback: this.changeEnemyDirections,
      callbackScope: this,
      loop: true
    });

    // Set up periodic check for new enemy spawns (every second)
    this.time.addEvent({
      delay: 1000, // Check every second
      callback: this.checkEnemySpawn,
      callbackScope: this,
      loop: true
    });

    // Set up treasure collisions (will be re-established after each spawn)
    this.setupTreasureCollisions();

    // Load sound effects and background music
    loadSounds(this);
    playBackgroundMusic(this);

    this.physics.add.overlap(this.player, this.door, () => {
      if (this.isGameOver) {
        return;
      }
      
      // Log level completion time if debug logging is enabled
      if (DebugFlags.debugLog && this.roomStartTime > 0) {
        const elapsedSeconds = (this.time.now - this.roomStartTime) / 1000;
        console.log(`Room ${this.roomIndex} completed in ${elapsedSeconds.toFixed(2)} seconds`);
      }
      
      this.roomIndex += 1;
      this.roomText.setText(`Room: ${this.roomIndex}`);
      this.buildRoom();
      
      // Play power-up sound when exiting room
      playPowerUpSound(this);
    });

    // Player-enemy overlap will be set up in setupEnemyCollisions()
  }

  update() {
    if (this.isGameOver) {
      // Handle game over transition after 2 second delay
      if (!this.gameOverTransitioned) {
        this.gameOverTransitioned = true;
        this.time.delayedCall(2000, () => {
          // Transition back to MainScene with final score
          this.scene.start('main', { finalScore: this.score });
        });
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
    if (!this.isMobile && this.fireKey?.isDown && this.time.now > this.nextFire && this.arrows.countActive(true) === 0) {
      this.shootArrow();
      this.nextFire = this.time.now + GameConfig.FIRE_RATE_DELAY;
    }

    playerBody.setVelocity(velocityX, velocityY);

    // Update purple enemies to move toward player
    this.updatePurpleEnemies();

    // Clean up arrows that go off screen
    this.cleanupArrows();
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

  shootArrow() { // Public for MobileControls access
    const arrowSpeed = Speeds.ARROW;
    const angle = DirectionAngles[this.lastDirection];
    const angleRadians = Phaser.Math.DegToRad(angle + GameConfig.ANGLE_OFFSET);

    // 1. Get/Create from the Physics Group directly
    // This handles adding to the group and physics setup in one go
    const arrow = this.arrows.get(this.player.x, this.player.y) as Phaser.GameObjects.Rectangle;

    if (arrow) {
        arrow.setActive(true).setVisible(true);
        
        // 2. Set rotation
        arrow.setRotation(angleRadians);
        
        // 3. Set Velocity (Cast to Physics Body)
        const body = this.getArrowBody(arrow);
        body.setVelocity(
            Math.cos(angleRadians) * arrowSpeed,
            Math.sin(angleRadians) * arrowSpeed
        );

        // 4. Cleanup: Destroy arrow if it leaves the world bounds
        body.setCollideWorldBounds(true);
        body.onWorldBounds = true; 
        // Note: You'll need this.physics.world.on('worldbounds', ...) to actually kill it

        // Play shoot sound
        playShootSound(this);
    }
}

  private cleanupArrows() {
    const { width, height } = this.scale;
    const arrowsToDestroy: Phaser.GameObjects.Rectangle[] = [];
    const cleanupOffset = Positions.CLEANUP_OFFSET;
    
    this.forEachArrow((arrow) => {
      if (
        arrow.x < -cleanupOffset ||
        arrow.x > width + cleanupOffset ||
        arrow.y < -cleanupOffset ||
        arrow.y > height + cleanupOffset
      ) {
        arrowsToDestroy.push(arrow);
      }
    });
    
    arrowsToDestroy.forEach((arrow) => arrow.destroy());
  }

  // ============================================================================
  // Collision Handlers
  // ============================================================================

  private setupEnemyCollisions() {
    const { width, height } = this.scale;
    
    // Collider with walls
    this.physics.add.collider(this.enemies, this.walls);
    
    // Overlap with arrows
    this.physics.add.overlap(this.arrows, this.enemies, (arrow, enemy) => {
      const enemyCircle = enemy as Phaser.GameObjects.Arc;
      
      // Purple enemies are invulnerable to arrows - just destroy the arrow
      if (this.purpleEnemies.has(enemyCircle)) {
        arrow.destroy();
        return;
      }
      
      // Destroy the projectile (arrow), not the enemy
      arrow.destroy();
      
      // Turn enemy red, stop moving, but don't destroy
      enemyCircle.setFillStyle(Colors.ENEMY_HIT);
      const enemyBody = this.getEnemyBody(enemyCircle);
      enemyBody.setVelocity(0, 0); // Stop movement
      
      this.addScore(GameConfig.SCORE_ENEMY);
      
      // Play hit sound
      playHitSound(this);
    });

    // Overlap with player (game over)
    this.physics.add.overlap(this.player, this.enemies, () => {
      if (this.isGameOver) {
        return;
      }
      this.isGameOver = true;
      this.physics.pause();
      this.player.setFillStyle(Colors.GAME_OVER);
      this.add.text(width / 2, height / 2, "Game Over", {
        fontSize: Sizes.GAME_OVER_FONT,
        color: Colors.TEXT_GAME_OVER
      }).setOrigin(0.5);
      
      // Play game over sound
      playBoomSound(this);
    });
  }

  private setupTreasureCollisions() {
    if (!this.treasure) {
      return; // No treasure to set up collisions for
    }
    this.physics.add.overlap(this.player, this.treasure, () => {
      this.addScore(GameConfig.SCORE_TREASURE);
      // Destroy treasure when collected (new treasure spawns only at start of new room)
      if (this.treasure) {
        this.treasure.destroy();
        this.treasure = null;
      }
      
      // Play pickup sound
      playPickupSound(this);
    });
  }

  // ============================================================================
  // Game Logic - Room Building & Entity Management
  // ============================================================================

  private buildRoom() {
    const { width, height } = this.scale;
    const wallThickness = Sizes.WALL_THICKNESS;
    const doorWidth = Sizes.DOOR_WIDTH;

    // Start timer for this room
    this.roomStartTime = this.time.now;
    // Reset extra enemy spawn flag for new room
    this.hasSpawnedExtraEnemy = false;

    this.walls.clear(true, true);
    this.arrows.clear(true, true);
    this.enemies.clear(true, true);
    this.purpleEnemies.clear(); // Clear purple enemy tracking
    this.treasure?.destroy();

    // Calculate room dimensions to be roughly square
    // Top wall center should be at ROOM_TOP_OFFSET + wallThickness/2
    const topWallY = Positions.ROOM_TOP_OFFSET + wallThickness / 2;
    // Room height = width (for square), so bottom wall center = topWallY + width
    const roomHeight = width; // Make room square (width = 393)
    const bottomWallY = topWallY + roomHeight;
    const doorX = width / 2;
    const doorY = bottomWallY;
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
    // Wall height should be based on room height, not screen height, and never exceed 50%
    const wallHeight = Math.min(roomHeight * GameConfig.WALL_HEIGHT_RATIO, roomHeight * 0.5);
    this.createWall(wallX, wallY, wallThickness, wallHeight);
    
    for (let i = 0; i < GameConfig.ENEMY_COUNT; i++) {
      this.spawnEnemy();
    }

    const playerBody = this.getPlayerBody();
    playerBody.setVelocity(0, 0);
    this.player.setPosition(playerX, playerY);

    // Ensure UI text stays on top after building new room (if it exists)
    if (this.scoreText) {
      this.scoreText.setDepth(GameConfig.UI_Z_DEPTH);
    }
    if (this.roomText) {
      this.roomText.setDepth(GameConfig.UI_Z_DEPTH);
    }
  }

  private placeTreasure() {
    // Destroy existing treasure if it exists
    if (this.treasure) {
      this.treasure.destroy();
    }

    // Create a new treasure at a random position within the room
    const padding = Positions.PADDING;
    const topWallY = Positions.ROOM_TOP_OFFSET + Sizes.WALL_THICKNESS / 2;
    const roomTop = topWallY + Sizes.WALL_THICKNESS / 2 + padding;
    const roomBottom = topWallY + this.scale.width - Sizes.WALL_THICKNESS / 2 - padding;
    const x = Phaser.Math.Between(padding, this.scale.width - padding);
    const y = Phaser.Math.Between(roomTop + Positions.PADDING_TREASURE_Y_OFFSET, roomBottom);
    
    this.treasure = this.add.circle(x, y, Sizes.TREASURE_RADIUS, Colors.TREASURE);
    this.physics.add.existing(this.treasure, true);
    
    // Re-establish collisions with the new treasure
    this.setupTreasureCollisions();
  }

  private spawnEnemy() {
    const topWallY = Positions.ROOM_TOP_OFFSET + Sizes.WALL_THICKNESS / 2;
    const roomTop = topWallY + Sizes.WALL_THICKNESS / 2;
    const roomBottom = topWallY + this.scale.width - Sizes.WALL_THICKNESS / 2;
    const x = Phaser.Math.Between(Positions.SPAWN_MIN_X, this.scale.width - Positions.SPAWN_MIN_X);
    const y = Phaser.Math.Between(Math.max(roomTop + Positions.SPAWN_MIN_Y, Positions.SPAWN_MIN_Y), roomBottom - Positions.SPAWN_MAX_Y_OFFSET);
    const enemy = this.add.circle(x, y, Sizes.ENEMY_RADIUS, Colors.ENEMY);
    this.enemies.add(enemy);
    this.physics.add.existing(enemy);
    const enemyBody = this.getEnemyBody(enemy);
    this.setRandomEnemyVelocity(enemyBody);
    enemyBody.setBounce(1, 1);
    enemyBody.setCollideWorldBounds(true);
  }

  private spawnPurpleEnemy() {
    const { width } = this.scale;
    const wallThickness = Sizes.WALL_THICKNESS;
    const topWallY = Positions.ROOM_TOP_OFFSET + wallThickness / 2;
    
    // Spawn at the top of the room, centered horizontally
    const x = width / 2;
    const y = topWallY + wallThickness / 2 + Sizes.ENEMY_RADIUS + 10; // Just below top wall
    
    const enemy = this.add.circle(x, y, Sizes.ENEMY_RADIUS, Colors.ENEMY_PURPLE);
    this.enemies.add(enemy);
    this.purpleEnemies.add(enemy); // Track as purple enemy
    this.physics.add.existing(enemy);
    const enemyBody = this.getEnemyBody(enemy);
    enemyBody.setBounce(1, 1);
    enemyBody.setCollideWorldBounds(true);
    // Initial velocity will be set in updatePurpleEnemies
  }

  private updatePurpleEnemies() {
    if (this.purpleEnemies.size === 0 || this.isGameOver) {
      return;
    }

    const playerX = this.player.x;
    const playerY = this.player.y;
    // Purple enemy is 5% faster than the player
    const speed = Speeds.PLAYER * 1.05;

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

  private changeEnemyDirections() {
    this.forEachActiveEnemy((enemy, enemyBody) => {
      // Only change direction for active (green) enemies, not hit (red) ones
      if (enemyBody.velocity.x !== 0 && enemyBody.velocity.y !== 0) {
        this.setRandomEnemyVelocity(enemyBody);
      }
    });
  }

  private checkEnemySpawn() {
    // Don't spawn if game is over, room hasn't started, or already spawned extra enemy
    if (this.isGameOver || this.roomStartTime === 0 || this.hasSpawnedExtraEnemy) {
      return;
    }

    // Calculate elapsed time in seconds
    const elapsedSeconds = (this.time.now - this.roomStartTime) / 1000;

    // Spawn chance starts at 5 seconds with 5% chance
    if (elapsedSeconds < 5) {
      return;
    }

    // Calculate probability: starting at 5% at 5 seconds, increasing by 5% each second
    // At 5 seconds: 5% chance
    // At 6 seconds: 10% chance
    // At 7 seconds: 15% chance
    // At 24 seconds: 100% chance (capped)
    const probability = Math.min((elapsedSeconds - 4) * 5, 100);

    // Roll random chance (0-100)
    const roll = Phaser.Math.Between(0, 100);

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

  // ============================================================================
  // Helper Methods - Utilities & Type Casting
  // ============================================================================

  private createWall(x: number, y: number, width: number, height: number) {
    const wall = this.add.rectangle(x, y, width, height, Colors.WALL);
    this.physics.add.existing(wall, true);
    this.walls.add(wall);
  }

  // ============================================================================
  // Helper Methods - Type Casting & Common Patterns
  // ============================================================================

  private getPlayerBody(): Phaser.Physics.Arcade.Body {
    return this.player.body as Phaser.Physics.Arcade.Body;
  }

  private getEnemyBody(enemy: Phaser.GameObjects.Arc): Phaser.Physics.Arcade.Body {
    return enemy.body as Phaser.Physics.Arcade.Body;
  }

  private getArrowBody(arrow: Phaser.GameObjects.Rectangle): Phaser.Physics.Arcade.Body {
    return arrow.body as Phaser.Physics.Arcade.Body;
  }

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

  private forEachArrow(callback: (arrow: Phaser.GameObjects.Rectangle) => void): void {
    this.arrows.children.entries.forEach((child) => {
      const arrow = child as Phaser.GameObjects.Rectangle;
      callback(arrow);
    });
  }

  private setRandomEnemyVelocity(enemyBody: Phaser.Physics.Arcade.Body): void {
    const speed = Speeds.ENEMY;
    enemyBody.setVelocity(
      Phaser.Math.Between(-speed, speed),
      Phaser.Math.Between(-speed, speed)
    );
  }

  private addScore(points: number): void {
    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);
  }

  private getCenterX(): number {
    return this.scale.width / 2;
  }

  private getCenterY(): number {
    return this.scale.height / 2;
  }
}
