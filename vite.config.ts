import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173
  },
  assetsInclude: [
    '**/*.mp3', 
    '**/*.wav', 
    '**/*.ogg',
    '**/*.jpg',
    '**/*.jpeg',
    '**/*.png',
    '**/*.gif',
    '**/*.webp',
    '**/*.svg'
  ],
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          // Keep audio files in a sounds subdirectory
          if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.ogg')) {
            return 'assets/sounds/[name][extname]';
          }
          // Keep image files in an images subdirectory
          if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || 
              name.endsWith('.gif') || name.endsWith('.webp') || name.endsWith('.svg')) {
            return 'assets/images/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
});
