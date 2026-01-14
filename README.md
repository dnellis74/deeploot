# Venture Arcade

A clone of the classic Exidy Venture arcade game, built with TypeScript and Phaser 3.

## Overview

Venture is a dungeon crawler where players navigate through rooms, collect treasures, and avoid enemies. This project is a modern recreation using web technologies, maintaining the core gameplay mechanics of the original arcade classic.

## Tech Stack

- **TypeScript** (^5.7.3) - Type-safe JavaScript
- **Phaser 3** (^3.70.0) - HTML5 game framework
- **Vite** (^6.0.6) - Fast build tool and dev server
- **Node.js** - Runtime environment

## Architecture

### Game Structure

The game follows a scene-based architecture using Phaser 3:

- **Entry Point** (`src/main.ts`): Configures and initializes the Phaser game instance
- **Scenes** (`src/scenes/`): Individual game states and gameplay logic
  - `MainScene.ts`: Main game scene handling room traversal, player movement, enemies, and treasure collection

### Design Patterns

- **Scene Pattern**: Phaser's scene system manages game states
- **Component-Based**: Game objects are composed of Phaser components
- **Physics System**: Arcade physics for collision detection and movement

### Key Systems

1. **Player Control**: Arrow keys for 4-directional movement
2. **Room System**: Walled rooms with doorways for traversal
3. **Enemy AI**: Enemy movement and collision detection
4. **Treasure Collection**: Score system based on treasure pickup
5. **Game State**: Game over and room progression logic

## Project Structure

```
venture/
├── src/
│   ├── main.ts              # Game initialization and config
│   └── scenes/
│       └── MainScene.ts     # Main game scene
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
└── README.md                # This file
```

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd venture
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

### Running the Development Server

Start the development server with hot module replacement:

```bash
npm run dev
```

The game will be available at `http://localhost:5173` (default Vite port).

### Debugging

#### Enable Physics Debug Overlay

To visualize collision boundaries and physics bodies, enable debug mode in `src/main.ts`:

```typescript
physics: {
  default: "arcade",
  arcade: {
    gravity: { y: 0 },
    debug: true  // Change to true
  }
}
```

#### Browser DevTools

- **Console**: Check for runtime errors and game state
- **Performance Tab**: Monitor frame rate and performance metrics
- **Sources Tab**: Set breakpoints in TypeScript files (source maps enabled)

#### Common Debug Tasks

1. **Inspect Game Objects**: Use Phaser's scene inspector in the browser console
   ```javascript
   // In browser console
   window.game.scene.scenes[0].children.list
   ```

2. **Monitor Physics Bodies**: Enable debug mode to see collision boundaries

3. **Track Game State**: Add `console.log` statements in scene methods (e.g., `update()`, collision handlers)

### Hot Module Replacement

Vite provides hot module replacement (HMR) by default. Changes to source files will automatically reload in the browser without losing game state in some cases.

## Building for Production

### Build

Create an optimized production build:

```bash
npm run build
```

Output will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Controls

- **Arrow Keys**: Move player (↑ ↓ ← →)
- **Collision**: Avoid enemies, collect treasures

## Development Guidelines

### Code Style

- Use TypeScript strict mode
- Follow Phaser 3 conventions and patterns
- Use private/public modifiers appropriately
- Prefer type annotations for complex types

### Adding New Features

1. **New Scenes**: Create scene classes extending `Phaser.Scene` in `src/scenes/`
2. **Game Objects**: Use Phaser's game object factories (`this.add.*`)
3. **Physics**: Register objects with `this.physics.add.existing()`
4. **Collision**: Use `this.physics.add.overlap()` or `collider()`

### File Organization

- Keep scenes modular and focused on single responsibilities
- Place shared utilities in a `src/utils/` directory (if needed)
- Use TypeScript interfaces/types for complex data structures

## Troubleshooting

### Common Issues

1. **Type errors after installation**: Run `npm install` to ensure all types are installed
2. **Port already in use**: Change the port in `vite.config.ts` or use `--port` flag
3. **Physics not working**: Ensure objects are added to the physics world with `this.physics.add.existing()`

### Performance Tips

- Limit the number of active game objects
- Use object pooling for frequently created/destroyed objects
- Monitor frame rate in browser DevTools
- Profile memory usage if experiencing leaks

## Future Enhancements

Potential features to add:

- Multiple room layouts and level progression
- Various enemy types with different behaviors
- Sound effects and background music
- Sprite graphics instead of primitive shapes
- Power-ups and special items
- High score persistence
- Multiple difficulty levels

## License

[Add your license here]

## Contributing

[Add contributing guidelines if applicable]
