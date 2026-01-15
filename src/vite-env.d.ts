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

// Rex Plugin declarations
declare global {
  interface Window {
    RexPlugins?: {
      plugins?: {
        virtualjoystickplugin?: any;
      };
    };
  }
}
