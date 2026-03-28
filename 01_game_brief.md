# 01 — Game Brief

## Objective
Build a browser arcade game inspired by Xonix/Qix territory capture.

The player moves across safe territory. When entering the unsafe playfield, the player draws a vulnerable line. Reconnecting that line to safe territory closes a shape and captures territory.

## Required modes

### A. Solo vs Computer
- one human player
- AI enemies roam open space
- target: capture enough territory to win the round
- lose lives when struck or when the active trail is broken by an enemy

### B. Two Player Versus
- two human players local multiplayer
- both claim territory on the same map
- separate scores and colours
- configurable end condition:
  - timed match by highest area
  - or last-player-standing

## Win / lose ideas

### Solo
- win: capture 75% of the field
- lose: all lives depleted

### Versus
- win by greater owned area after timer ends
- optional sudden death if tied
- optional elimination mode for arcade variety

## Scope
Keep it polished and compact.

Do not over-expand into a large progression game.
Focus on a highly replayable core loop.

## Tone
Modern arcade energy:
- playful
- colourful
- clean
- satisfying
- readable
