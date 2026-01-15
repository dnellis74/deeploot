import Phaser from "phaser";
import { MainScene } from "./scenes/MainScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  width: 800,
  height: 600,
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
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  plugins: {
    global: [
      {
        key: 'rexVirtualJoystick',
        plugin: window.RexPlugins?.plugins?.virtualjoystickplugin,
        start: true
      }
    ]
  },
  scene: [MainScene]
};

new Phaser.Game(config);
