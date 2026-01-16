/// <reference types="vite/client" />

// Declare module for audio imports
declare module '*.mp3' {
  const src: string;
  export default src;
}

declare module '*.wav' {
  const src: string;
  export default src;
}

declare module '*.ogg' {
  const src: string;
  export default src;
}

// Declare module for image imports
declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

// Rex Plugin declarations
import type { VirtualJoystickPlugin } from './types/joystick';

declare global {
  interface Window {
    RexPlugins?: {
      plugins?: {
        virtualjoystickplugin?: VirtualJoystickPlugin;
      };
    };
  }
}

export {};
