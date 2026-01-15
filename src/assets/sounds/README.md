# Sound Assets

Place your MP3 sound files in this directory.

## How to use sounds in your game:

1. **Import the sound file in your scene:**
```typescript
import shootSoundUrl from './assets/sounds/shoot.mp3';
import collectSoundUrl from './assets/sounds/collect.mp3';
```

2. **Load sounds in the `create()` method:**
```typescript
this.load.audio('shoot', shootSoundUrl);
this.load.audio('collect', collectSoundUrl);
this.load.start(); // Start loading
```

3. **Play sounds when needed:**
```typescript
this.sound.play('shoot');
this.sound.play('collect');
```

## Example integration in MainScene:

```typescript
// At the top of MainScene.ts
import shootSoundUrl from '../assets/sounds/shoot.mp3';

// In create() method, after other setup:
this.load.audio('shoot', shootSoundUrl);
this.load.start();

// When shooting:
this.sound.play('shoot');
```

Note: Vite will automatically bundle these MP3 files with your build.
