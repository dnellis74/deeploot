/**
 * Debug configuration flags
 * 
 * This file contains debug flags that can be modified locally without
 * affecting the committed version. Consider adding this file to .gitignore
 * or using a template file (debug.ts.example) that gets copied to debug.ts.
 */

export const DebugFlags = {
  /**
   * When true, mutes background music/pads
   */
  mutePads: false,
  /**
   * When true, logs debug information (e.g., level completion times)
   */
  debugLog: false,
  /**
   * When true, shows physics debug overlay (collision boundaries and physics bodies)
   */
  physicsDebug: false,
} as const;
