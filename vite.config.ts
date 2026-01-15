import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173
  },
  assetsInclude: ['**/*.mp3', '**/*.wav', '**/*.ogg'],
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Keep audio files in a sounds subdirectory
          if (assetInfo.name && (assetInfo.name.endsWith('.mp3') || assetInfo.name.endsWith('.wav') || assetInfo.name.endsWith('.ogg'))) {
            return 'assets/sounds/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
});
