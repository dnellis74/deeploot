/**
 * Sound configuration and management
 * 
 * Centralized sound loading and playback for the game.
 */

import shootSoundUrl from "../assets/sounds/Shoot33.wav";
import hitSoundUrl from "../assets/sounds/Hit2.wav";
import boomSoundUrl from "../assets/sounds/Boom2.wav";
import pickupSoundUrl from "../assets/sounds/Pickup1.wav";
import powerUpSoundUrl from "../assets/sounds/PowerUp2.wav";
import backgroundMusicUrl from "../assets/sounds/caverns.ogg";
import { DebugFlags } from "./debug";

// ============================================================================
// Sound Keys
// ============================================================================
export const SoundKeys = {
  SHOOT: 'shoot',
  HIT: 'hit',
  BOOM: 'boom',
  PICKUP: 'pickup',
  POWER_UP: 'powerUp',
  BACKGROUND_MUSIC: 'backgroundMusic',
} as const;

// ============================================================================
// Sound URLs
// ============================================================================
const SoundUrls = {
  [SoundKeys.SHOOT]: shootSoundUrl,
  [SoundKeys.HIT]: hitSoundUrl,
  [SoundKeys.BOOM]: boomSoundUrl,
  [SoundKeys.PICKUP]: pickupSoundUrl,
  [SoundKeys.POWER_UP]: powerUpSoundUrl,
  [SoundKeys.BACKGROUND_MUSIC]: backgroundMusicUrl,
} as const;

// ============================================================================
// Sound Loading
// ============================================================================

/**
 * Loads all sound effects and background music into the scene
 * @param scene - Phaser scene to load sounds into
 */
export function loadSounds(scene: Phaser.Scene): void {
  // Load sound effects
  scene.load.audio(SoundKeys.SHOOT, SoundUrls[SoundKeys.SHOOT]);
  scene.load.audio(SoundKeys.HIT, SoundUrls[SoundKeys.HIT]);
  scene.load.audio(SoundKeys.BOOM, SoundUrls[SoundKeys.BOOM]);
  scene.load.audio(SoundKeys.PICKUP, SoundUrls[SoundKeys.PICKUP]);
  scene.load.audio(SoundKeys.POWER_UP, SoundUrls[SoundKeys.POWER_UP]);
  
  // Load background music only if not muted
  if (!DebugFlags.mutePads) {
    scene.load.audio(SoundKeys.BACKGROUND_MUSIC, SoundUrls[SoundKeys.BACKGROUND_MUSIC]);
  }
  
  scene.load.start();
}

/**
 * Starts playing background music when sounds are loaded
 * @param scene - Phaser scene containing the loaded sounds
 */
export function playBackgroundMusic(scene: Phaser.Scene): void {
  if (!DebugFlags.mutePads) {
    scene.load.once('complete', () => {
      scene.sound.play(SoundKeys.BACKGROUND_MUSIC, { loop: true, volume: 0.5 });
    });
  }
}

// ============================================================================
// Sound Playback Helpers
// ============================================================================

/**
 * Plays a sound effect
 * @param scene - Phaser scene
 * @param soundKey - Key of the sound to play
 */
export function playSound(scene: Phaser.Scene, soundKey: string): void {
  scene.sound.play(soundKey);
}

/**
 * Plays the shoot sound effect
 */
export function playShootSound(scene: Phaser.Scene): void {
  playSound(scene, SoundKeys.SHOOT);
}

/**
 * Plays the hit sound effect
 */
export function playHitSound(scene: Phaser.Scene): void {
  playSound(scene, SoundKeys.HIT);
}

/**
 * Plays the boom (game over) sound effect
 */
export function playBoomSound(scene: Phaser.Scene): void {
  playSound(scene, SoundKeys.BOOM);
}

/**
 * Plays the pickup (treasure) sound effect
 */
export function playPickupSound(scene: Phaser.Scene): void {
  playSound(scene, SoundKeys.PICKUP);
}

/**
 * Plays the power-up (exit room) sound effect
 */
export function playPowerUpSound(scene: Phaser.Scene): void {
  playSound(scene, SoundKeys.POWER_UP);
}
