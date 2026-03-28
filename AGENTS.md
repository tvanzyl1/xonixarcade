# AGENTS.md — Xonix Arcade Browser Game Pack

Use this agent pack to build a **polished browser-based arcade game inspired by Xonix/Qix territory capture gameplay**.

This pack inherits the **style DNA** from the supplied generic arcade template: playful, juicy, colourful, readable, premium-feeling, mobile-aware, and immediately fun. The implementation should feel like a modern arcade remix rather than a bare clone. The source style template emphasises playful arcade polish, readable visuals, juicy feedback, and a premium browser-game feel. fileciteturn0file0

---

## Core game concept

Create a territory-capture arcade game where the main risk loop is:

- move safely along claimed edges / safe territory
- leave safe ground to draw a vulnerable line through open space
- reconnect the line to safe ground to capture a region
- avoid enemies touching the player or crossing the active line before closure

The game must support **2 distinct modes**:

### Mode 1 — Solo vs Computer
One human player versus computer-controlled enemies.

### Mode 2 — Two Player Versus
Two human players on the same device compete for score / territory control.

---

## Design goal

Build a **small premium-feeling arcade web game**, not a rough prototype.

It should feel:

- quick to understand
- dangerous in a fun way
- satisfying when territory closes
- readable at a glance
- juicy and animated
- suitable for short repeat sessions

The style blueprint provided by the user should be treated as the visual and UX source of truth: bright colourful visuals on darker backgrounds, responsive controls, oversized polished UI, humorous arcade tone, and strong feedback such as particles, flashes, floating text, shakes, pulses, and celebratory effects. fileciteturn0file0

---

## Platform target

- Browser
- Desktop first
- Tablet/phone supported where practical

---

## Technical direction

Prefer:

- HTML
- CSS
- JavaScript
- Canvas
- Minimal dependencies
- Clean modular code

Suggested structure:

- `index.html`
- `style.css`
- `game.js`
- optional split modules if the agent prefers lightweight separation

No heavy framework required.

---

## Gameplay rules

### Shared rules

- The board begins with a safe border / safe owned territory.
- Open field is unsafe.
- Leaving safe territory creates a live trail.
- Reconnecting to safe territory closes a shape and claims area.
- If an enemy touches the live trail before closure, the active player loses a life or is eliminated depending on mode/ruleset.
- Captured territory becomes safe.
- Enemies should move clearly and predictably enough to be learnable, but still create pressure.

### Solo vs Computer mode

- One player
- Multiple AI enemies
- Goal: capture a target % of the map before losing all lives
- Difficulty can scale by increasing enemy count, enemy speed, hazard types, or required territory %

### Two Player Versus mode

- Two local players
- Shared board
- Each player has a distinct colour and score
- Both players can claim territory
- Win condition can be the first of:
  - time limit reached, highest territory % wins
  - score target reached
  - last surviving player wins if elimination rules are enabled
- Include a simple settings toggle so versus rules can support either:
  - **Area Battle** (highest area at end wins)
  - **Lives Battle** (last player standing)

---

## Control scheme

### Desktop

**Solo mode**
- Arrow keys or WASD for player movement

**Two-player mode**
- Player 1: WASD
- Player 2: Arrow keys

### Mobile / touch

At minimum:
- offer simple on-screen directional controls
- or swipe-to-turn if implemented cleanly

Mobile support is desirable, but desktop readability and play feel come first.

---

## Required systems

The game should include:

1. Start menu
2. Game mode selection
3. Rules/help overlay
4. Main gameplay board
5. HUD
6. Pause and restart flow
7. Game over / victory screen
8. Score system
9. Territory capture logic
10. Enemy movement and collision logic
11. Round reset / respawn handling
12. Juice / feedback layer
13. Lightweight audio hooks if feasible

---

## Visual direction

Preserve the supplied arcade template feel:

- darker playfield background
- bright neon player colours
- strong contrast between safe territory, unsafe territory, active trails, enemies, and hazards
- rounded modern overlays and menus
- polished gradients and glow
- readable large HUD
- subtle ambient motion so menus feel alive

Suggested board readability:

- safe territory: darker filled colour with subtle pattern/glow
- unsafe territory: contrasting dark field
- live trail: bright flashing line
- captured area animation: flood-fill pulse / ripple / pixel sweep
- enemies: bold glowing orbs / drones / sparks with clear silhouettes

The source template explicitly prioritises clarity over visual complexity and asks for bold silhouettes, strong contrast, oversized readable UI, playful polish, and a colourful premium browser-game presentation. fileciteturn0file0

---

## Juice requirements

Territory capture must feel especially satisfying.

Include where appropriate:

- line glow while drawing
- danger pulse when enemies approach the trail
- pop / burst when area closes
- fill animation when territory is claimed
- floating score text for big captures
- combo text for consecutive captures
- small screen shake for death / major capture / round win
- celebratory overlay when target % is reached
- hover and press animation on buttons
- lively transitions between screens

The style template specifically calls for particles, flashes, floating text, glow pulses, smooth UI transitions, celebratory effects, and satisfying success/failure feedback, and those expectations should be carried into this game. fileciteturn0file0

---

## Game feel priorities

Prioritise in this order:

1. readability
2. responsive controls
3. correct territory rules
4. satisfying capture feedback
5. replayability
6. clean UI polish

---

## Agent workflow instruction

Implement the game in passes:

- first make the board, movement, and trail closure work reliably
- then add enemies and fail conditions
- then add both game modes
- then add menu/UI polish
- then add juice and balancing

Do not leave the game looking like a placeholder. Even the first playable version should have charm and clear visual hierarchy, consistent with the supplied style template. fileciteturn0file0
