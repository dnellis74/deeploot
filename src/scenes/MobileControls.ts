import Phaser from "phaser";
import { GameConfig, MobileControlsConfig } from "../config/gameConfig";
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
    // Create a fire button for mobile, accounting for bottom safe area
    const fireButtonX = width - MobileControlsConfig.FIRE_BUTTON_OFFSET_X;
    const fireButtonY = height - MobileControlsConfig.FIRE_BUTTON_OFFSET_Y - MobileControlsConfig.BOTTOM_SAFE_AREA;
    const fireButton = this.scene.add.circle(
      fireButtonX,
      fireButtonY,
      MobileControlsConfig.FIRE_BUTTON_RADIUS,
      MobileControlsConfig.FIRE_BUTTON_COLOR,
      MobileControlsConfig.FIRE_BUTTON_ALPHA
    );
    fireButton.setInteractive({ useHandCursor: true });
    fireButton.setDepth(GameConfig.UI_Z_DEPTH);
    fireButton.on('pointerdown', () => {
      if (!this.scene.isGameOver && this.scene.time.now > this.scene.nextFire && this.scene.arrows.countActive(true) === 0) {
        this.scene.shootArrow();
        this.scene.nextFire = this.scene.time.now + GameConfig.FIRE_RATE_DELAY;
      }
    });
    fireButton.on('pointerover', () => fireButton.setAlpha(MobileControlsConfig.FIRE_BUTTON_ALPHA_HOVER));
    fireButton.on('pointerout', () => fireButton.setAlpha(MobileControlsConfig.FIRE_BUTTON_ALPHA));
  }

  setupJoystick(height: number): void {
    const plugins = this.scene.plugins as unknown as PhaserPluginsWithJoystick;
    const joystickPlugin = plugins.get('rexvirtualjoystickplugin');

    if (joystickPlugin) {
      const joystickX = MobileControlsConfig.JOYSTICK_OFFSET_X;
      const joystickY = height - MobileControlsConfig.JOYSTICK_OFFSET_Y - MobileControlsConfig.BOTTOM_SAFE_AREA;
      
      // Create base and thumb at the joystick position
      const base = this.scene.add.circle(
        joystickX,
        joystickY,
        MobileControlsConfig.JOYSTICK_BASE_RADIUS,
        MobileControlsConfig.JOYSTICK_BASE_COLOR,
        MobileControlsConfig.JOYSTICK_BASE_ALPHA
      );
      const thumb = this.scene.add.circle(
        joystickX,
        joystickY,
        MobileControlsConfig.JOYSTICK_THUMB_RADIUS,
        MobileControlsConfig.JOYSTICK_THUMB_COLOR,
        MobileControlsConfig.JOYSTICK_THUMB_ALPHA
      );
      base.setDepth(GameConfig.UI_Z_DEPTH);
      thumb.setDepth(GameConfig.UI_Z_DEPTH + 1);
      
      this.scene.joystick = joystickPlugin.add(this.scene, {
        x: joystickX,
        y: joystickY,
        radius: MobileControlsConfig.JOYSTICK_BASE_RADIUS,
        base: base,
        thumb: thumb,
        dir: MobileControlsConfig.JOYSTICK_DIRECTION_MODE
      });

      // Create cursor keys from joystick - this allows joystick to work exactly like keyboard
      this.scene.joystickCursors = this.scene.joystick.createCursorKeys();
    }
  }
}
