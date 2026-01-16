/**
 * Type definitions for Rex Virtual Joystick Plugin
 * 
 * These interfaces provide type safety for the Rex Virtual Joystick plugin
 * loaded from CDN. The plugin is not included as a dependency, so we define
 * the types based on its API usage.
 */

import Phaser from "phaser";

/**
 * Configuration options for creating a virtual joystick
 */
export interface VirtualJoystickConfig {
  x: number;
  y: number;
  radius: number;
  base: Phaser.GameObjects.Arc;
  thumb: Phaser.GameObjects.Arc;
  dir: '8dir' | '4dir' | 'up&down';
}

/**
 * Virtual joystick instance returned by the plugin
 */
export interface VirtualJoystickInstance {
  /**
   * Creates cursor keys that work identically to keyboard cursor keys
   * @returns Cursor keys object compatible with Phaser's keyboard cursor keys
   */
  createCursorKeys(): Phaser.Types.Input.Keyboard.CursorKeys;
  
  /**
   * Destroys the joystick instance
   */
  destroy?(): void;
  
  /**
   * Additional properties may exist but are not used in this codebase
   */
  [key: string]: unknown;
}

/**
 * Rex Virtual Joystick Plugin interface
 */
export interface VirtualJoystickPlugin {
  /**
   * Creates a new virtual joystick instance
   * @param scene - Phaser scene to attach the joystick to
   * @param config - Configuration options for the joystick
   * @returns Virtual joystick instance
   */
  add(scene: Phaser.Scene, config: VirtualJoystickConfig): VirtualJoystickInstance;
}

/**
 * Extended Phaser Plugins interface to include the virtual joystick plugin
 */
export interface PhaserPluginsWithJoystick extends Phaser.Plugins.PluginManager {
  get(key: 'rexvirtualjoystickplugin'): VirtualJoystickPlugin | undefined;
}
