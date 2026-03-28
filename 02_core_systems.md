# 02 — Core Systems

## Board model
Represent the board as a grid or tile field that supports:
- safe territory
- unsafe territory
- temporary live trail
- player ownership markers for versus mode

A grid-based implementation is recommended for clarity and easier flood-fill capture.

## Territory capture algorithm
When the player reconnects a live trail to safe territory:
1. convert the trail into temporary walls
2. identify the regions created
3. detect which region contains enemies
4. capture the region(s) without enemies
5. convert captured tiles into safe owned territory
6. clear temporary trail state
7. award score based on area captured and streaks

## Collision rules

### Player death / hit rules
- touching an enemy kills or costs a life when vulnerable
- enemy crossing a live trail before closure breaks the attempt
- safe territory should protect movement unless a special hazard exists

## Enemy system
Implement simple, readable enemy AI:
- bounce movement within unsafe space
- clear velocity direction
- increasing speed or count by level
- optional enemy types later:
  - normal drifter
  - fast spark
  - patrol orb
  - trail hunter

## Game state machine
Required states:
- boot
- menu
- rules/help
- playing
- paused
- round won
- round lost
- match over

## Scoring
Suggested scoring inputs:
- area captured
- big region bonus
- quick successive capture combo
- win bonus
- survival bonus in solo mode
- elimination bonus in versus mode

## Performance
Keep rendering lightweight and stable in browser.
Prioritise smooth motion and reliable collision over fancy effects.
