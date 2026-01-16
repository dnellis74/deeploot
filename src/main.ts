import Phaser from "phaser";
import { MainScene } from "./scenes/MainScene";
import { RoomScene } from "./scenes/RoomScene";

// Expose Phaser globally for the Rex plugin
(window as any).Phaser = Phaser;

// Wait for plugin to be loaded if it exists
function initGame() {
  const joystickPlugin = (window as any).RexPlugins?.plugins?.virtualjoystickplugin;

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
    plugins: joystickPlugin ? {
      global: [
        {
          key: 'rexVirtualJoystick',
          plugin: joystickPlugin,
          start: true
        }
      ]
    } : undefined,
    scene: [MainScene, RoomScene]
  };

  new Phaser.Game(config);
}

// Initialize immediately (plugin will be loaded asynchronously)
initGame();
