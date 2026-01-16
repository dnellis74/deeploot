# Venture Arcade - Project Context

## Project Overview
A clone of the classic Exidy Venture arcade game built with TypeScript and Phaser 3. It's a dungeon crawler where players navigate rooms, collect treasures, avoid enemies, and progress through levels.

## Tech Stack
- **TypeScript** (^5.7.3)
- **Phaser 3** (^3.70.0) - HTML5 game framework
- **Vite** (^6.0.6) - Build tool and dev server
- **Rex Virtual Joystick Plugin** - For mobile touch controls (loaded from CDN)

## Project Structure
```
venture/
├── src/
│   ├── main.ts                    # Phaser game initialization
│   ├── scenes/
│   │   ├── MainScene.ts          # Main game scene (all gameplay logic)
│   │   └── MobileControls.ts     # Mobile joystick and fire button setup
│   ├── assets/
│   │   └── sounds/                # Audio files (WAV, OGG)
│   └── vite-env.d.ts             # TypeScript declarations
├── index.html                     # Entry point
├── package.json
├── vite.config.ts                # Vite config (audio bundling)
└── tsconfig.json
```

## Key Architecture Decisions

### Code Organization
- **Constants**: All magic numbers extracted to `private static readonly` constants in `MainScene.ts`
  - Colors, sizes, speeds, positions, game config
  - Organized into logical sections (Colors, Sizes, Speeds, etc.)
- **Method Organization**: Methods grouped into sections:
  - Lifecycle Methods (`create`, `update`)
  - Update Methods (player movement, direction)
  - Collision Handlers
  - Game Logic (room building, scoring)
  - Helper Methods (getters, utilities)

### Input System
- **Desktop**: Keyboard (arrow keys + spacebar)
- **Mobile**: Rex Virtual Joystick plugin + on-screen fire button
- **Unified Input**: Both use cursor keys API - joystick creates `createCursorKeys()` that work identically to keyboard
- **Mobile Detection**: `this.sys.game.device.input.touch`

### Audio System
- **Sound Effects**: WAV files loaded via Vite imports
  - `Shoot33.wav` - Player shoots
  - `Hit2.wav` - Arrow hits enemy
  - `Boom2.wav` - Game over
  - `Pickup1.wav` - Treasure collected
  - `PowerUp2.wav` - Exit room
- **Background Music**: `caverns.ogg` loops at 50% volume
- **Bundling**: Audio files bundled via Vite, placed in `assets/sounds/` in build output

### Mobile Controls
- **Plugin Loading**: Rex Virtual Joystick loaded from CDN (`jsdelivr.net`)
- **Setup**: Handled in `MobileControls.ts` class
- **Joystick**: Creates cursor keys via `joystick.createCursorKeys()` for unified input
- **Fire Button**: On-screen circle button for mobile shooting
- **Z-Depth**: UI elements (joystick, fire button) use `MainScene.UI_Z_DEPTH = 1000`

## Important Constants

### Speeds
- `SPEED_PLAYER = 200` - Player movement speed
- `SPEED_ARROW = 400` - Arrow projectile speed
- `SPEED_ENEMY = 140` - Enemy movement speed
- `SPEED_DIAGONAL_MULTIPLIER = 0.7071` - Diagonal movement normalization

### Game Config
- `CONFIG_ENEMY_COUNT = 3` - Enemies per room
- `CONFIG_FIRE_RATE_DELAY = 200` - Milliseconds between shots
- `CONFIG_SCORE_TREASURE = 50` - Points for treasure
- `CONFIG_SCORE_ENEMY = 25` - Points for enemy kill
- `UI_Z_DEPTH = 1000` - Z-depth for all UI elements

## Key Patterns

### Movement System
- Player uses `setVelocity()` for movement
- Direction-based rotation (8 directions: 0-7)
- Diagonal movement normalized to prevent faster diagonal speed
- Input unified: `joystickCursors || cursors` pattern

### Collision System
- Arcade physics with overlap detection
- Player-enemy collision = game over
- Arrow-enemy collision = enemy destroyed
- Player-treasure collision = score increase
- Player-door collision = next room

### Room System
- Dynamic room building with walls and door
- Door positioned at center of bottom wall (brown color: `0x8B4513`)
- Top wall is full width
- Bottom wall has door opening
- Room index tracks progression

### Game State
- `isGameOver` flag controls game loop
- Score and room tracking
- Game over text overlay
- Room progression on door collision

## Recent Changes (Last Session)

1. **Mobile Controls Refactoring**
   - Extracted mobile control logic to `MobileControls.ts`
   - Plugin loading moved to `MobileControls.loadAndSetup()`
   - Joystick uses `createCursorKeys()` for unified input

2. **Input Simplification**
   - Removed velocity calculations from joystick
   - Joystick now provides same speed as keyboard via cursor keys
   - Unified input handling: `const activeCursors = this.joystickCursors || this.cursors`

3. **Code Quality**
   - All constants extracted
   - Methods organized into logical sections
   - Helper methods extracted for common patterns

## Dependencies & Setup

### External Dependencies
- Phaser 3 (npm package)
- Rex Virtual Joystick Plugin (loaded from CDN at runtime)

### Build Configuration
- Vite bundles audio files (MP3, WAV, OGG)
- Audio files output to `assets/sounds/` in dist
- TypeScript strict mode enabled
- Source maps enabled for debugging

## Development Commands
```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
```

## Important Files to Know

### `src/main.ts`
- Phaser game configuration
- Exposes Phaser globally for Rex plugin: `(window as any).Phaser = Phaser`
- Conditional plugin registration (only if plugin loaded)

### `src/scenes/MainScene.ts`
- Main game logic (600+ lines)
- All gameplay, collisions, room building
- Constants defined at top
- Methods organized by purpose

### `src/scenes/MobileControls.ts`
- Mobile-specific setup
- Joystick and fire button creation
- Plugin loading logic

### `index.html`
- Loads main.ts
- Dynamically loads Rex plugin script after Phaser is available
- Dispatches `rexPluginLoaded` event

## TypeScript Declarations
- Audio module declarations (`.mp3`, `.wav`, `.ogg`)
- Global `Window` interface for `RexPlugins`
- File must have `export {}` to be treated as module

## Current State
- ✅ Core gameplay working (movement, shooting, enemies, treasure)
- ✅ Audio system integrated (all sound effects + background music)
- ✅ Mobile controls working (joystick + fire button)
- ✅ Code refactored (constants, organization, helpers)
- ✅ Room progression system
- ✅ Score and game over states

## Next Steps / Potential Features
- Multiple room layouts
- Different enemy types/behaviors
- Sprite graphics (currently using primitive shapes)
- Power-ups
- High score persistence
- Difficulty levels
- More sound effects
- Particle effects
