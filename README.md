# Neon Frontier X

Neon Frontier X is a browser arcade game inspired by Xonix and Qix territory capture. You skate around safe edges, dive into the wild zone to draw a vulnerable trail, and reconnect to safety to lock down territory before enemies or rivals ruin the run.

## Modes

- `Solo vs Computer`: Capture the target percentage of the arena while bouncing enemy drones pressure every risky line.
- `Two Player Versus`: Two local players share the same grid and fight over score and area using either `Area Battle` or `Lives Battle`.

## Controls

### Solo

- `WASD` or arrow keys: move
- `P`: pause
- `R`: restart solo run

### Versus

- Player 1: `WASD`
- Player 2: arrow keys
- `P`: pause

### Touch

- On-screen directional buttons are available for the primary player on smaller screens.

## How to Run

Open [index.html](/c:/Source/xonixarcade/index.html) in a browser, or serve the folder locally with any simple static server.

## Files

- [index.html](/c:/Source/xonixarcade/index.html): app shell, overlays, HUD, and menu structure
- [style.css](/c:/Source/xonixarcade/style.css): premium arcade presentation and responsive layout
- [game.js](/c:/Source/xonixarcade/game.js): board model, capture logic, solo mode, versus mode, particles, and audio hooks

## Design Notes

- Grid-based territory capture with flood-fill region resolution
- Solo rounds scale by adding more enemy pressure
- Versus mode keeps separate ownership colors and scoring
- Juice includes glow trails, floating text, bursts, pulses, flash warnings, and screen shake

## Next Ideas

- Additional enemy types
- Theme variants between rounds
- Expanded touch support for full tablet multiplayer
