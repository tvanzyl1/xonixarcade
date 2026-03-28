# 04 — Two Player Mode

## Overview
Create a local multiplayer mode with two players competing on the same board.

## Player distinction
- Player 1 colour: cyan / blue family
- Player 2 colour: pink / orange family
- all trail, owned area, score pops, and HUD items should clearly match each player

## Control scheme
- Player 1: WASD
- Player 2: Arrow keys

## Match variants
Include a small pre-match toggle:

### Area Battle
- fixed match timer, e.g. 90 seconds
- player with highest owned territory wins

### Lives Battle
- each player has limited lives, e.g. 3
- last surviving player wins

## Territory logic in versus mode
Decide and implement one clear rule set:
- captured area becomes owned by the capturing player
- neutral safe border remains neutral or shared safe zone
- if one player encloses previously owned enemy territory, either:
  - steal it, or
  - only convert neutral/open territory

Recommendation:
- keep it simple for the first version
- let players convert only open territory plus their own trail closure spaces
- do not steal already-owned enemy area unless a later refinement phase adds it carefully

## Fairness rules
- both players spawn safely apart
- both players are visible and readable at all times
- if players collide while both are vulnerable, resolve clearly and consistently
- expose rules on the help panel

## HUD
Show for each player:
- score
- lives if relevant
- territory %

## End screen
Show:
- winner banner
- final area %
- final score
- rematch button
- return to menu button
