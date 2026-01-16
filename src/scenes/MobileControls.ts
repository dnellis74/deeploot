import Phaser from "phaser";
import { GameConfig } from "../config/gameConfig";
import type { VirtualJoystickInstance, PhaserPluginsWithJoystick } from "../types/joystick";

// Interface for scenes that support mobile controls
export interface IGameScene extends Phaser.Scene {
  isGameOver: boolean;
  nextFire: number;
  arrows: Phaser.Physics.Arcade.Group;
  joystick?: VirtualJoystickInstance;
  joystickCursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  shootArrow(): void;
}

export class MobileControls {
  constructor(private scene: IGameScene) {}

  loadAndSetup(): void {
    try {
      // Load the plugin from CDN
      this.scene.load.plugin('rexvirtualjoystickplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js', true);

      // Wait for the plugin to load before initializing
      this.scene.load.once('complete', () => {
        const { width, height } = this.scene.scale;
        this.setupJoystick(height);
        this.setupFireButton(width, height);
      });
      this.scene.load.start();
    } catch (error) {
      console.error('Error loading joystick plugin:', error);
    }
  }

  setupFireButton(width: number, height: number): void {
    // Bottom safe area offset for iPhone 16: ~34 points
    const bottomSafeArea = 34;
    // Create a fire button for mobile, accounting for bottom safe area
    const fireButton = this.scene.add.circle(width - 100, height - 100 - bottomSafeArea, 40, 0xff4444, 0.7);
    fireButton.setInteractive({ useHandCursor: true });
    fireButton.setDepth(GameConfig.UI_Z_DEPTH);
    fireButton.on('pointerdown', () => {
      if (!this.scene.isGameOver && this.scene.time.now > this.scene.nextFire && this.scene.arrows.countActive(true) === 0) {
        this.scene.shootArrow();
        this.scene.nextFire = this.scene.time.now + GameConfig.FIRE_RATE_DELAY;
      }
    });
    fireButton.on('pointerover', () => fireButton.setAlpha(0.9));
    fireButton.on('pointerout', () => fireButton.setAlpha(0.7));
  }

  setupJoystick(height: number): void {
    const plugins = this.scene.plugins as PhaserPluginsWithJoystick;
    const joystickPlugin = plugins.get('rexvirtualjoystickplugin');

    if (joystickPlugin) {
      // Bottom safe area offset for iPhone 16: ~34 points
      const bottomSafeArea = 34;
      const joystickX = 100;
      const joystickY = height - 100 - bottomSafeArea;
      
      // Create base and thumb at the joystick position
      const base = this.scene.add.circle(joystickX, joystickY, 60, 0x888888, 0.5);
      const thumb = this.scene.add.circle(joystickX, joystickY, 30, 0xcccccc, 0.8);
      base.setDepth(GameConfig.UI_Z_DEPTH);
      thumb.setDepth(GameConfig.UI_Z_DEPTH + 1);
      
      this.scene.joystick = joystickPlugin.add(this.scene, {
        x: joystickX,
        y: joystickY,
        radius: 60,
        base: base,
        thumb: thumb,
        dir: '8dir'
      });

      // Create cursor keys from joystick - this allows joystick to work exactly like keyboard
      this.scene.joystickCursors = this.scene.joystick.createCursorKeys();
    }
  }
}
