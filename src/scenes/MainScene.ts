import Phaser from "phaser";
import { Colors, Sizes, Positions, GameConfig } from "../config/gameConfig";
import { getHighScores, addHighScore, formatHighScoreDate } from "../config/highScores";
import dungeonWallImageUrl from "../assets/image/dungeon_brick_wall__8_bit__by_trarian_dez45u1-375w-2x.jpg";

export class MainScene extends Phaser.Scene {
  private highScoreTexts: Phaser.GameObjects.Text[] = [];
  private startButton!: Phaser.GameObjects.Text;

  constructor() {
    super("main");
  }

  preload() {
    // Load the dungeon wall background image
    this.load.image('dungeonWall', dungeonWallImageUrl);
  }

  create(data?: { finalScore?: number }) {
    const { width, height } = this.scale;

    // Create tiled dungeon wall background covering the entire game area
    this.add.tileSprite(0, 0, width, height, 'dungeonWall')
      .setOrigin(0, 0)
      .setDepth(-2);

    // Display game title
    this.add.text(width / 2, Positions.TITLE_Y, "Venture Arcade", {
      fontSize: Sizes.TITLE_FONT,
      color: Colors.TEXT_PRIMARY
    }).setOrigin(0.5, 0).setDepth(GameConfig.UI_Z_DEPTH);

    // Handle high score update if returning from RoomScene
    if (data?.finalScore !== undefined) {
      this.handleHighScoreUpdate(data.finalScore);
    } else {
      // Just load and display existing high scores
      this.displayHighScores();
    }

    // Create start button
    this.createStartButton();
  }

  private displayHighScores() {
    const { width } = this.scale;
    const scores = getHighScores();

    // Clear existing high score texts
    this.highScoreTexts.forEach(text => text.destroy());
    this.highScoreTexts = [];

    // Display "High Scores" label
    const labelY = Positions.INSTRUCTION_Y + 40;
    this.add.text(width / 2, labelY, "High Scores", {
      fontSize: Sizes.INSTRUCTION_FONT,
      color: Colors.TEXT_PRIMARY
    }).setOrigin(0.5, 0).setDepth(GameConfig.UI_Z_DEPTH);

    // Display high scores list
    const startY = labelY + 30;
    const lineHeight = 20;

    if (scores.length === 0) {
      // Show "No scores yet" message
      const noScoresText = this.add.text(width / 2, startY, "No scores yet", {
        fontSize: Sizes.INSTRUCTION_FONT,
        color: Colors.TEXT_SECONDARY
      }).setOrigin(0.5, 0).setDepth(GameConfig.UI_Z_DEPTH);
      this.highScoreTexts.push(noScoresText);
    } else {
      // Display top 10 scores with format: "1. 1250 - Jan 15, 2024"
      scores.forEach((highScore, index) => {
        const rank = index + 1;
        const formattedDate = formatHighScoreDate(highScore.date);
        const scoreText = `${rank}. ${highScore.score} - ${formattedDate}`;
        
        const text = this.add.text(width / 2, startY + (index * lineHeight), scoreText, {
          fontSize: "14px",
          color: Colors.TEXT_SECONDARY
        }).setOrigin(0.5, 0).setDepth(GameConfig.UI_Z_DEPTH);
        
        this.highScoreTexts.push(text);
      });
    }
  }

  private createStartButton() {
    const { width, height } = this.scale;

    // Position start button below high scores (or in center if no scores)
    const buttonY = this.highScoreTexts.length > 0
      ? this.highScoreTexts[this.highScoreTexts.length - 1].y + 50
      : height / 2 + 50;

    this.startButton = this.add.text(width / 2, buttonY, "START", {
      fontSize: "24px",
      color: Colors.TEXT_PRIMARY,
      backgroundColor: `#${Colors.WALL.toString(16).padStart(6, '0')}`,
      padding: { left: 20, right: 20, top: 10, bottom: 10 }
    }).setOrigin(0.5, 0.5)
      .setDepth(GameConfig.UI_Z_DEPTH)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.handleStartButton())
      .on('pointerover', () => {
        this.startButton.setStyle({ color: Colors.TREASURE });
      })
      .on('pointerout', () => {
        this.startButton.setStyle({ color: Colors.TEXT_PRIMARY });
      });
  }

  private handleStartButton() {
    // Transition to RoomScene
    this.scene.start('room');
  }

  private handleHighScoreUpdate(score: number) {
    // Add the new score to high scores
    addHighScore(score);
    
    // Refresh the display
    this.displayHighScores();
    
    // Recreate start button at new position
    if (this.startButton) {
      this.startButton.destroy();
    }
    this.createStartButton();
  }
}
