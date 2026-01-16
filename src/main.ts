import Phaser from "phaser";
import { MainScene } from "./scenes/MainScene";
import { RoomScene } from "./scenes/RoomScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  width: 393,
  height: 759,
  backgroundColor: "#0b0f1a",
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        y: 0,
        x: 0
      },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 393,
    height: 759
  },
  scene: [MainScene, RoomScene]
};

new Phaser.Game(config);
