import Phaser from "phaser";

export class MainScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Triangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireKey!: Phaser.Input.Keyboard.Key;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private arrows!: Phaser.Physics.Arcade.Group;
  private door!: Phaser.GameObjects.Rectangle;
  private treasure!: Phaser.GameObjects.Arc;
  private enemy!: Phaser.GameObjects.Arc;
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

    this.add.text(width / 2, 24, "Venture Arcade", {
      fontSize: "20px",
      color: "#e6edf3"
    }).setOrigin(0.5, 0);

    this.add.text(
      width / 2,
      48,
      "Move: \u2190 \u2192 \u2191 \u2193  |  Fire: Space  |  Grab treasure  |  Exit via door",
      { fontSize: "14px", color: "#94a3b8" }
    ).setOrigin(0.5, 0);

    // Create player as a triangle (arrow pointing up initially)
    this.player = this.add.triangle(width / 2, height - 80, 0, -8, -6, 8, 6, 8, 0x38bdf8);
    this.physics.add.existing(this.player);
    const playerPhysicsBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerPhysicsBody.setSize(12, 16);
    playerPhysicsBody.setCollideWorldBounds(true);
    this.lastDirection = 0; // Start facing up
    this.updatePlayerVisual();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.fireKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.walls = this.physics.add.staticGroup();
    this.arrows = this.arrows = this.physics.add.group({
      classType: Phaser.GameObjects.Rectangle, // Tells the group to create Rectangles
      createCallback: (obj) => {
          const rect = obj as Phaser.GameObjects.Rectangle;
          rect.setSize(6, 12);
          rect.setFillStyle(0xfacc15);
      }
  });

    // Create door once - it stays stationary on the wall
    const wallThickness = 24;
    const doorWidth = 90;
    const doorX = width / 2;
    const doorY = wallThickness / 2;
    this.door = this.add.rectangle(doorX, doorY, doorWidth, wallThickness, 0x22c55e);
    this.physics.add.existing(this.door, true);

    this.buildRoom();

    this.scoreText = this.add.text(16, 16, "Score: 0", {
      fontSize: "16px",
      color: "#e2e8f0"
    });
    this.roomText = this.add.text(16, 36, "Room: 1", {
      fontSize: "14px",
      color: "#94a3b8"
    });

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.enemy, this.walls);
    this.physics.add.collider(this.arrows, this.walls, (arrow) => {
      arrow.destroy();
    });

    this.physics.add.overlap(this.arrows, this.enemy, (arrow, enemy) => {
      arrow.destroy();
      enemy.destroy();
      this.score += 25;
      this.scoreText.setText(`Score: ${this.score}`);
      this.spawnEnemy();
    });

    this.physics.add.overlap(this.player, this.treasure, () => {
      this.score += 50;
      this.scoreText.setText(`Score: ${this.score}`);
      this.placeTreasure();
    });

    this.physics.add.overlap(this.player, this.door, () => {
      if (this.isGameOver) {
        return;
      }
      this.roomIndex += 1;
      this.roomText.setText(`Room: ${this.roomIndex}`);
      this.buildRoom();
    });

    this.physics.add.overlap(this.player, this.enemy, () => {
      if (this.isGameOver) {
        return;
      }
      this.isGameOver = true;
      this.physics.pause();
      this.player.setFillStyle(0xf97316);
      this.add.text(width / 2, height / 2, "Game Over", {
        fontSize: "36px",
        color: "#fca5a5"
      }).setOrigin(0.5);
    });
  }

  update() {
    if (this.isGameOver) {
      return;
    }

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    const speed = 200;
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
      velocityX *= 0.7071;
      velocityY *= 0.7071;
    }

    // Update direction based on movement
    if (velocityX !== 0 || velocityY !== 0) {
      this.updatePlayerDirection(velocityX, velocityY);
    }

    // Handle firing
    if (this.fireKey.isDown && this.time.now > this.nextFire) {
      this.shootArrow();
      this.nextFire = this.time.now + 200; // Fire rate: 200ms between shots
    }

    playerBody.setVelocity(velocityX, velocityY);

    // Clean up arrows that go off screen
    this.cleanupArrows();
  }

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
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    this.player.setRotation(Phaser.Math.DegToRad(angles[this.lastDirection]));
  }

  private buildRoom() {
    const { width, height } = this.scale;
    const wallThickness = 24;
    const doorWidth = 90;

    this.walls.clear(true, true);
    this.arrows.clear(true, true);
    this.treasure?.destroy();
    this.enemy?.destroy();

    const doorX = width / 2;
    const doorY = wallThickness / 2;
    const doorHalf = doorWidth / 2;

    // Create top wall with door opening (door stays stationary)
    this.createWall(doorX - doorHalf - (width / 2 - doorHalf) / 2, doorY, width / 2 - doorHalf, wallThickness);
    this.createWall(doorX + doorHalf + (width / 2 - doorHalf) / 2, doorY, width / 2 - doorHalf, wallThickness);
    // Create bottom, left, and right walls
    this.createWall(width / 2, height - wallThickness / 2, width, wallThickness);
    this.createWall(wallThickness / 2, height / 2, wallThickness, height);
    this.createWall(width - wallThickness / 2, height / 2, wallThickness, height);

    this.placeTreasure();
    this.spawnEnemy();

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerBody.setVelocity(0, 0);
    this.player.setPosition(width / 2, height - 80);
  }

  private createWall(x: number, y: number, width: number, height: number) {
    const wall = this.add.rectangle(x, y, width, height, 0x1f2937);
    this.physics.add.existing(wall, true);
    this.walls.add(wall);
  }

  private placeTreasure() {
    const padding = 80;
    const x = Phaser.Math.Between(padding, this.scale.width - padding);
    const y = Phaser.Math.Between(padding + 40, this.scale.height - padding);

    if (!this.treasure) {
      this.treasure = this.add.circle(x, y, 12, 0xfacc15);
      this.physics.add.existing(this.treasure, true);
      return;
    }

    this.treasure.setPosition(x, y);
  }

  private spawnEnemy() {
    const x = Phaser.Math.Between(100, this.scale.width - 100);
    const y = Phaser.Math.Between(120, this.scale.height - 160);
    this.enemy = this.add.circle(x, y, 14, 0xf97316);
    this.physics.add.existing(this.enemy);
    const enemyBody = this.enemy.body as Phaser.Physics.Arcade.Body;
    enemyBody.setVelocity(Phaser.Math.Between(-140, 140), Phaser.Math.Between(-140, 140));
    enemyBody.setBounce(1, 1);
    enemyBody.setCollideWorldBounds(true);
  }

  private shootArrow() {
    const arrowSpeed = 400;
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    const angle = angles[this.lastDirection];
    const angleRad = Phaser.Math.DegToRad(angle - 90); // Add 90 degrees for 90 degree clockwise offset

    // 1. Get/Create from the Physics Group directly
    // This handles adding to the group and physics setup in one go
    const arrow = this.arrows.get(this.player.x, this.player.y) as Phaser.GameObjects.Rectangle;

    if (arrow) {
        arrow.setActive(true).setVisible(true);
        
        // 2. Set rotation (adjust for 90 degree clockwise offset)
        arrow.setRotation(angleRad);
        
        // 3. Set Velocity (Cast to Physics Body)
        const body = arrow.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(
            Math.cos(angleRad) * arrowSpeed,
            Math.sin(angleRad) * arrowSpeed
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
    
    this.arrows.children.entries.forEach((child) => {
      const arrow = child as Phaser.GameObjects.Rectangle;
      if (
        arrow.x < -50 ||
        arrow.x > width + 50 ||
        arrow.y < -50 ||
        arrow.y > height + 50
      ) {
        arrowsToDestroy.push(arrow);
      }
    });
    
    arrowsToDestroy.forEach((arrow) => arrow.destroy());
  }
}
