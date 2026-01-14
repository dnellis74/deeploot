import Phaser from "phaser";

export class MainScene extends Phaser.Scene {
  // ============================================================================
  // Constants - Colors
  // ============================================================================
  private static readonly COLOR_PLAYER = 0x38bdf8;
  private static readonly COLOR_DOOR = 0x22c55e;
  private static readonly COLOR_ENEMY = 0x22c55e;
  private static readonly COLOR_ENEMY_HIT = 0xef4444;
  private static readonly COLOR_TREASURE = 0xfacc15;
  private static readonly COLOR_ARROW = 0xfacc15;
  private static readonly COLOR_WALL = 0x1f2937;
  private static readonly COLOR_GAME_OVER = 0xf97316;
  private static readonly COLOR_TEXT_PRIMARY = "#e6edf3";
  private static readonly COLOR_TEXT_SECONDARY = "#94a3b8";
  private static readonly COLOR_TEXT_SCORE = "#e2e8f0";
  private static readonly COLOR_TEXT_GAME_OVER = "#fca5a5";

  // ============================================================================
  // Constants - Sizes
  // ============================================================================
  private static readonly SIZE_ENEMY_RADIUS = 14;
  private static readonly SIZE_TREASURE_RADIUS = 12;
  private static readonly SIZE_ARROW_WIDTH = 6;
  private static readonly SIZE_ARROW_HEIGHT = 12;
  private static readonly SIZE_PLAYER_WIDTH = 12;
  private static readonly SIZE_PLAYER_HEIGHT = 16;
  private static readonly SIZE_WALL_THICKNESS = 24;
  private static readonly SIZE_DOOR_WIDTH = 90;
  private static readonly SIZE_TITLE_FONT = "20px";
  private static readonly SIZE_INSTRUCTION_FONT = "14px";
  private static readonly SIZE_SCORE_FONT = "16px";
  private static readonly SIZE_ROOM_FONT = "14px";
  private static readonly SIZE_GAME_OVER_FONT = "36px";

  // ============================================================================
  // Constants - Speeds
  // ============================================================================
  private static readonly SPEED_PLAYER = 200;
  private static readonly SPEED_ARROW = 400;
  private static readonly SPEED_ENEMY = 140;
  private static readonly SPEED_DIAGONAL_MULTIPLIER = 0.7071;

  // ============================================================================
  // Constants - Positions & Offsets
  // ============================================================================
  private static readonly POS_TITLE_Y = 24;
  private static readonly POS_INSTRUCTION_Y = 48;
  private static readonly POS_PLAYER_OFFSET_Y = 80;
  private static readonly POS_UI_X = 16;
  private static readonly POS_UI_SCORE_Y = 16;
  private static readonly POS_UI_ROOM_Y = 36;
  private static readonly POS_PADDING = 80;
  private static readonly POS_PADDING_TREASURE_Y_OFFSET = 40;
  private static readonly POS_SPAWN_MIN_X = 100;
  private static readonly POS_SPAWN_MIN_Y = 120;
  private static readonly POS_SPAWN_MAX_Y_OFFSET = 160;
  private static readonly POS_CLEANUP_OFFSET = 50;

  // ============================================================================
  // Constants - Game Configuration
  // ============================================================================
  private static readonly CONFIG_ENEMY_COUNT = 3;
  private static readonly CONFIG_ENEMY_DIRECTION_CHANGE_DELAY = 2000;
  private static readonly CONFIG_FIRE_RATE_DELAY = 200;
  private static readonly CONFIG_WALL_HEIGHT_RATIO = 0.5;
  private static readonly CONFIG_SCORE_TREASURE = 50;
  private static readonly CONFIG_SCORE_ENEMY = 25;
  private static readonly CONFIG_ANGLE_OFFSET = -90;

  // ============================================================================
  // Constants - Player Triangle Points
  // ============================================================================
  private static readonly PLAYER_TRIANGLE_POINTS = {
    x1: 0,
    y1: -8,
    x2: -6,
    y2: 8,
    x3: 6,
    y3: 8
  };

  // ============================================================================
  // Constants - Direction Angles
  // ============================================================================
  private static readonly DIRECTION_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

  // ============================================================================
  // Instance Properties
  // ============================================================================
  private player!: Phaser.GameObjects.Triangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireKey!: Phaser.Input.Keyboard.Key;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private arrows!: Phaser.Physics.Arcade.Group;
  private door!: Phaser.GameObjects.Rectangle;
  private treasure!: Phaser.GameObjects.Arc;
  private enemies!: Phaser.Physics.Arcade.Group;
  private scoreText!: Phaser.GameObjects.Text;
  private roomText!: Phaser.GameObjects.Text;
  private score = 0;
  private roomIndex = 1;
  private isGameOver = false;
  private lastDirection = 0; // 0-7 representing 8 directions
  private nextFire = 0; // Fire rate limiting

  constructor() {
    super("main");
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, MainScene.POS_TITLE_Y, "Venture Arcade", {
      fontSize: MainScene.SIZE_TITLE_FONT,
      color: MainScene.COLOR_TEXT_PRIMARY
    }).setOrigin(0.5, 0);

    this.add.text(
      width / 2,
      MainScene.POS_INSTRUCTION_Y,
      "Move: \u2190 \u2192 \u2191 \u2193  |  Fire: Space  |  Grab treasure  |  Exit via door",
      { fontSize: MainScene.SIZE_INSTRUCTION_FONT, color: MainScene.COLOR_TEXT_SECONDARY }
    ).setOrigin(0.5, 0);

    // Create player as a triangle (arrow pointing up initially)
    const playerX = width / 2;
    const playerY = height - MainScene.POS_PLAYER_OFFSET_Y;
    this.player = this.add.triangle(
      playerX,
      playerY,
      MainScene.PLAYER_TRIANGLE_POINTS.x1,
      MainScene.PLAYER_TRIANGLE_POINTS.y1,
      MainScene.PLAYER_TRIANGLE_POINTS.x2,
      MainScene.PLAYER_TRIANGLE_POINTS.y2,
      MainScene.PLAYER_TRIANGLE_POINTS.x3,
      MainScene.PLAYER_TRIANGLE_POINTS.y3,
      MainScene.COLOR_PLAYER
    );
    this.physics.add.existing(this.player);
    const playerPhysicsBody = this.getPlayerBody();
    playerPhysicsBody.setSize(MainScene.SIZE_PLAYER_WIDTH, MainScene.SIZE_PLAYER_HEIGHT);
    playerPhysicsBody.setCollideWorldBounds(true);
    this.lastDirection = 0; // Start facing up
    this.updatePlayerVisual();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.fireKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.walls = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.arrows = this.arrows = this.physics.add.group({
      classType: Phaser.GameObjects.Rectangle, // Tells the group to create Rectangles
      createCallback: (obj) => {
          const rect = obj as Phaser.GameObjects.Rectangle;
          rect.setSize(MainScene.SIZE_ARROW_WIDTH, MainScene.SIZE_ARROW_HEIGHT);
          rect.setFillStyle(MainScene.COLOR_ARROW);
      }
  });

    // Create door once - it stays stationary on the wall
    const wallThickness = MainScene.SIZE_WALL_THICKNESS;
    const doorWidth = MainScene.SIZE_DOOR_WIDTH;
    const doorX = width / 2;
    const doorY = wallThickness / 2;
    this.door = this.add.rectangle(doorX, doorY, doorWidth, wallThickness, MainScene.COLOR_DOOR);
    this.physics.add.existing(this.door, true);

    this.buildRoom();

    this.scoreText = this.add.text(MainScene.POS_UI_X, MainScene.POS_UI_SCORE_Y, "Score: 0", {
      fontSize: MainScene.SIZE_SCORE_FONT,
      color: MainScene.COLOR_TEXT_SCORE
    });
    this.roomText = this.add.text(MainScene.POS_UI_X, MainScene.POS_UI_ROOM_Y, "Room: 1", {
      fontSize: MainScene.SIZE_ROOM_FONT,
      color: MainScene.COLOR_TEXT_SECONDARY
    });

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.arrows, this.walls, (arrow) => {
      arrow.destroy();
    });

    // Set up enemy collisions (once for the group, works for all enemies)
    this.setupEnemyCollisions();

    // Set up periodic enemy direction changes
    this.time.addEvent({
      delay: MainScene.CONFIG_ENEMY_DIRECTION_CHANGE_DELAY,
      callback: this.changeEnemyDirections,
      callbackScope: this,
      loop: true
    });

    // Set up treasure collisions (will be re-established after each spawn)
    this.setupTreasureCollisions();

    this.physics.add.overlap(this.player, this.door, () => {
      if (this.isGameOver) {
        return;
      }
      this.roomIndex += 1;
      this.roomText.setText(`Room: ${this.roomIndex}`);
      this.buildRoom();
    });

    // Player-enemy overlap will be set up in setupEnemyCollisions()
  }

  update() {
    if (this.isGameOver) {
      return;
    }

    const playerBody = this.getPlayerBody();
    const speed = MainScene.SPEED_PLAYER;
    let velocityX = 0;
    let velocityY = 0;

    if (this.cursors.left?.isDown) {
      velocityX = -speed;
    } else if (this.cursors.right?.isDown) {
      velocityX = speed;
    }

    if (this.cursors.up?.isDown) {
      velocityY = -speed;
    } else if (this.cursors.down?.isDown) {
      velocityY = speed;
    }

    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= MainScene.SPEED_DIAGONAL_MULTIPLIER;
      velocityY *= MainScene.SPEED_DIAGONAL_MULTIPLIER;
    }

    // Update direction based on movement
    if (velocityX !== 0 || velocityY !== 0) {
      this.updatePlayerDirection(velocityX, velocityY);
    }

    // Handle firing (only if no arrows exist)
    if (this.fireKey.isDown && this.time.now > this.nextFire && this.arrows.countActive(true) === 0) {
      this.shootArrow();
      this.nextFire = this.time.now + MainScene.CONFIG_FIRE_RATE_DELAY;
    }

    playerBody.setVelocity(velocityX, velocityY);

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
    this.player.setRotation(Phaser.Math.DegToRad(MainScene.DIRECTION_ANGLES[this.lastDirection]));
  }

  private shootArrow() {
    const arrowSpeed = MainScene.SPEED_ARROW;
    const angle = MainScene.DIRECTION_ANGLES[this.lastDirection];
    const angleRadians = Phaser.Math.DegToRad(angle + MainScene.CONFIG_ANGLE_OFFSET);

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
    }
}

  private cleanupArrows() {
    const { width, height } = this.scale;
    const arrowsToDestroy: Phaser.GameObjects.Rectangle[] = [];
    const cleanupOffset = MainScene.POS_CLEANUP_OFFSET;
    
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
      // Destroy the projectile (arrow), not the enemy
      arrow.destroy();
      
      // Turn enemy red, stop moving, but don't destroy
      const enemyCircle = enemy as Phaser.GameObjects.Arc;
      enemyCircle.setFillStyle(MainScene.COLOR_ENEMY_HIT);
      const enemyBody = this.getEnemyBody(enemyCircle);
      enemyBody.setVelocity(0, 0); // Stop movement
      this.addScore(MainScene.CONFIG_SCORE_ENEMY);
    });

    // Overlap with player (game over)
    this.physics.add.overlap(this.player, this.enemies, () => {
      if (this.isGameOver) {
        return;
      }
      this.isGameOver = true;
      this.physics.pause();
      this.player.setFillStyle(MainScene.COLOR_GAME_OVER);
      this.add.text(width / 2, height / 2, "Game Over", {
        fontSize: MainScene.SIZE_GAME_OVER_FONT,
        color: MainScene.COLOR_TEXT_GAME_OVER
      }).setOrigin(0.5);
    });
  }

  private setupTreasureCollisions() {
    this.physics.add.overlap(this.player, this.treasure, () => {
      this.addScore(MainScene.CONFIG_SCORE_TREASURE);
      // Destroy treasure when collected (new treasure spawns only at start of new room)
      if (this.treasure) {
        this.treasure.destroy();
        this.treasure = null as any;
      }
    });
  }

  // ============================================================================
  // Game Logic - Room Building & Entity Management
  // ============================================================================

  private buildRoom() {
    const { width, height } = this.scale;
    const wallThickness = MainScene.SIZE_WALL_THICKNESS;
    const doorWidth = MainScene.SIZE_DOOR_WIDTH;

    this.walls.clear(true, true);
    this.arrows.clear(true, true);
    this.enemies.clear(true, true);
    this.treasure?.destroy();

    const doorX = width / 2;
    const doorY = wallThickness / 2;
    const doorHalfWidth = doorWidth / 2;

    // Create top wall with door opening (door stays stationary)
    const topWallSegmentWidth = width / 2 - doorHalfWidth;
    this.createWall(doorX - doorHalfWidth - topWallSegmentWidth / 2, doorY, topWallSegmentWidth, wallThickness);
    this.createWall(doorX + doorHalfWidth + topWallSegmentWidth / 2, doorY, topWallSegmentWidth, wallThickness);
    // Create bottom, left, and right walls
    this.createWall(width / 2, height - wallThickness / 2, width, wallThickness);
    this.createWall(wallThickness / 2, height / 2, wallThickness, height);
    this.createWall(width - wallThickness / 2, height / 2, wallThickness, height);

    this.placeTreasure();
    
    // Place a wall between player and treasure
    const playerX = width / 2;
    const playerY = height - MainScene.POS_PLAYER_OFFSET_Y;
    const treasureX = this.treasure.x;
    const treasureY = this.treasure.y;
    const wallX = (playerX + treasureX) / 2;
    const wallY = (playerY + treasureY) / 2;
    const wallHeight = height * MainScene.CONFIG_WALL_HEIGHT_RATIO;
    this.createWall(wallX, wallY, wallThickness, wallHeight);
    
    for (let i = 0; i < MainScene.CONFIG_ENEMY_COUNT; i++) {
      this.spawnEnemy();
    }

    const playerBody = this.getPlayerBody();
    playerBody.setVelocity(0, 0);
    this.player.setPosition(playerX, playerY);
  }

  private placeTreasure() {
    // Destroy existing treasure if it exists
    if (this.treasure) {
      this.treasure.destroy();
    }

    // Create a new treasure at a random position
    const padding = MainScene.POS_PADDING;
    const x = Phaser.Math.Between(padding, this.scale.width - padding);
    const y = Phaser.Math.Between(padding + MainScene.POS_PADDING_TREASURE_Y_OFFSET, this.scale.height - padding);
    
    this.treasure = this.add.circle(x, y, MainScene.SIZE_TREASURE_RADIUS, MainScene.COLOR_TREASURE);
    this.physics.add.existing(this.treasure, true);
    
    // Re-establish collisions with the new treasure
    this.setupTreasureCollisions();
  }

  private spawnEnemy() {
    const x = Phaser.Math.Between(MainScene.POS_SPAWN_MIN_X, this.scale.width - MainScene.POS_SPAWN_MIN_X);
    const y = Phaser.Math.Between(MainScene.POS_SPAWN_MIN_Y, this.scale.height - MainScene.POS_SPAWN_MAX_Y_OFFSET);
    const enemy = this.add.circle(x, y, MainScene.SIZE_ENEMY_RADIUS, MainScene.COLOR_ENEMY);
    this.enemies.add(enemy);
    this.physics.add.existing(enemy);
    const enemyBody = this.getEnemyBody(enemy);
    this.setRandomEnemyVelocity(enemyBody);
    enemyBody.setBounce(1, 1);
    enemyBody.setCollideWorldBounds(true);
  }

  private changeEnemyDirections() {
    this.forEachActiveEnemy((enemy, enemyBody) => {
      // Only change direction for active (green) enemies, not hit (red) ones
      if (enemyBody.velocity.x !== 0 && enemyBody.velocity.y !== 0) {
        this.setRandomEnemyVelocity(enemyBody);
      }
    });
  }

  // ============================================================================
  // Helper Methods - Utilities & Type Casting
  // ============================================================================

  private createWall(x: number, y: number, width: number, height: number) {
    const wall = this.add.rectangle(x, y, width, height, MainScene.COLOR_WALL);
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
    const speed = MainScene.SPEED_ENEMY;
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
