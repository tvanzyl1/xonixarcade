const CELL = 18;
const COLS = 48;
const ROWS = 32;
const BORDER = 3;
const WIDTH = CELL * COLS;
const HEIGHT = CELL * ROWS;
const OPEN = 0;
const SAFE_NEUTRAL = 1;
const SAFE_P1 = 2;
const SAFE_P2 = 3;
const TRAIL_P1 = 10;
const TRAIL_P2 = 11;
const MODE_SOLO = "solo";
const MODE_VERSUS = "versus";
const STATE_MENU = "menu";
const STATE_RULES = "rules";
const STATE_PLAYING = "playing";
const STATE_PAUSED = "paused";
const STATE_MESSAGE = "message";

const COLORS = {
  bg: "#050c16",
  grid: "rgba(255,255,255,0.05)",
  open: "#07111e",
  neutral: "#102946",
  p1: "#37e8ff",
  p2: "#ff66c8",
  enemy: "#ffcf5c",
  danger: "#ff5f7f",
  text: "#eef9ff",
  gold: "#ffe67a",
};

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = WIDTH;
canvas.height = HEIGHT;

const ui = {
  pauseButton: document.getElementById("pauseButton"),
  menuButton: document.getElementById("menuButton"),
  restartButton: document.getElementById("restartButton"),
  menuOverlay: document.getElementById("menuOverlay"),
  rulesOverlay: document.getElementById("rulesOverlay"),
  messageOverlay: document.getElementById("messageOverlay"),
  startSoloButton: document.getElementById("startSoloButton"),
  startVersusButton: document.getElementById("startVersusButton"),
  howToPlayButton: document.getElementById("howToPlayButton"),
  closeRulesButton: document.getElementById("closeRulesButton"),
  soundToggleButton: document.getElementById("soundToggleButton"),
  messageEyebrow: document.getElementById("messageEyebrow"),
  messageTitle: document.getElementById("messageTitle"),
  messageBody: document.getElementById("messageBody"),
  messagePrimaryButton: document.getElementById("messagePrimaryButton"),
  messageSecondaryButton: document.getElementById("messageSecondaryButton"),
  modeLabel: document.getElementById("modeLabel"),
  modeSubtext: document.getElementById("modeSubtext"),
  scoreValue: document.getElementById("scoreValue"),
  zoneValue: document.getElementById("zoneValue"),
  livesValue: document.getElementById("livesValue"),
  roundValue: document.getElementById("roundValue"),
  versusHud: document.getElementById("versusHud"),
  controlsHint: document.getElementById("controlsHint"),
  touchControls: document.getElementById("touchControls"),
};

const app = {
  state: STATE_MENU,
  mode: null,
  versusRule: "area",
  soundOn: true,
  board: [],
  players: [],
  enemies: [],
  particles: [],
  floaters: [],
  pulses: [],
  shaker: 0,
  flash: 0,
  lastTime: 0,
  messageAction: null,
  solo: {
    round: 1,
    score: 0,
    lives: 3,
    targetPercent: 75,
  },
  versus: {
    timer: 90,
    maxTimer: 90,
  },
};

class SoundBoard {
  constructor() {
    this.ctx = null;
  }

  ensure() {
    if (!app.soundOn) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  beep(freq, duration, type = "sine", volume = 0.03) {
    const audioCtx = this.ensure();
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = freq;
    gain.gain.value = volume;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  capture() {
    this.beep(540, 0.12, "triangle", 0.035);
    this.beep(760, 0.18, "sine", 0.025);
  }

  death() {
    this.beep(180, 0.18, "sawtooth", 0.05);
    this.beep(120, 0.24, "square", 0.03);
  }

  click() {
    this.beep(420, 0.08, "square", 0.02);
  }

  victory() {
    this.beep(660, 0.12, "triangle", 0.03);
    this.beep(880, 0.22, "triangle", 0.03);
  }
}

const sounds = new SoundBoard();

function makeBoard() {
  const board = Array.from({ length: ROWS }, () => Array(COLS).fill(OPEN));
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (x < BORDER || y < BORDER || x >= COLS - BORDER || y >= ROWS - BORDER) {
        board[y][x] = SAFE_NEUTRAL;
      }
    }
  }
  return board;
}

function createPlayer(id, safeType, x, y, controls) {
  return {
    id,
    safeType,
    color: id === 1 ? COLORS.p1 : COLORS.p2,
    x,
    y,
    dir: { x: id === 2 ? -1 : 1, y: 0 },
    nextDir: { x: id === 2 ? -1 : 1, y: 0 },
    moveTimer: 0,
    moveDelay: 0.085,
    trail: [],
    vulnerable: false,
    alive: true,
    lives: 3,
    score: 0,
    combo: 0,
    controls,
    spawn: { x, y },
    respawnTimer: 0,
  };
}

function createEnemy(index, round) {
  const speed = 78 + round * 8 + index * 5;
  return {
    x: WIDTH * (0.3 + Math.random() * 0.4),
    y: HEIGHT * (0.24 + Math.random() * 0.46),
    vx: (Math.random() > 0.5 ? 1 : -1) * speed,
    vy: (Math.random() > 0.5 ? 1 : -1) * speed * 0.84,
    r: 8 + (index % 2) * 2,
  };
}

function isInside(x, y) {
  return x >= 0 && y >= 0 && x < COLS && y < ROWS;
}

function cellAt(x, y) {
  if (!isInside(x, y)) return SAFE_NEUTRAL;
  return app.board[y][x];
}

function isSafeForPlayer(player, value) {
  return value === SAFE_NEUTRAL || value === player.safeType;
}

function trailType(player) {
  return player.id === 1 ? TRAIL_P1 : TRAIL_P2;
}

function setState(state) {
  app.state = state;
  ui.menuOverlay.classList.toggle("active", state === STATE_MENU);
  ui.rulesOverlay.classList.toggle("active", state === STATE_RULES);
  ui.messageOverlay.classList.toggle("active", state === STATE_MESSAGE);
}

function resetFx() {
  app.particles = [];
  app.floaters = [];
  app.pulses = [];
  app.shaker = 0;
  app.flash = 0;
}

function launchSolo() {
  app.mode = MODE_SOLO;
  app.solo.round = 1;
  app.solo.score = 0;
  app.solo.lives = 3;
  app.solo.targetPercent = 75;
  startSoloRound();
}

function startSoloRound() {
  app.board = makeBoard();
  app.players = [
    createPlayer(1, SAFE_P1, 2, Math.floor(ROWS / 2), {
      up: ["w", "arrowup"],
      down: ["s", "arrowdown"],
      left: ["a", "arrowleft"],
      right: ["d", "arrowright"],
    }),
  ];
  app.players[0].lives = app.solo.lives;
  app.players[0].score = app.solo.score;
  app.enemies = Array.from({ length: Math.min(1 + app.solo.round, 5) }, (_, index) => createEnemy(index, app.solo.round));
  resetFx();
  updateHud();
  updateHelpText();
  setState(STATE_PLAYING);
}

function launchVersus() {
  app.mode = MODE_VERSUS;
  app.board = makeBoard();
  app.players = [
    createPlayer(1, SAFE_P1, 2, 6, {
      up: ["w"],
      down: ["s"],
      left: ["a"],
      right: ["d"],
    }),
    createPlayer(2, SAFE_P2, COLS - 3, ROWS - 7, {
      up: ["arrowup"],
      down: ["arrowdown"],
      left: ["arrowleft"],
      right: ["arrowright"],
    }),
  ];
  app.enemies = [];
  app.versus.timer = app.versusRule === "area" ? 90 : 999;
  app.versus.maxTimer = app.versus.timer;
  resetFx();
  updateHud();
  updateHelpText();
  setState(STATE_PLAYING);
}

function returnToMenu() {
  app.mode = null;
  app.players = [];
  app.enemies = [];
  resetFx();
  updateHud();
  updateHelpText();
  setState(STATE_MENU);
}

function showRules() {
  setState(STATE_RULES);
}

function showMessage({ eyebrow, title, body, primaryLabel, onPrimary }) {
  ui.messageEyebrow.textContent = eyebrow;
  ui.messageTitle.textContent = title;
  ui.messageBody.textContent = body;
  ui.messagePrimaryButton.textContent = primaryLabel;
  app.messageAction = onPrimary;
  setState(STATE_MESSAGE);
}

function awardFloater(text, x, y, color) {
  app.floaters.push({ text, x, y, color, life: 1.2 });
}

function burst(x, y, color, count = 22, speed = 120) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const magnitude = speed * (0.35 + Math.random() * 0.9);
    app.particles.push({
      x,
      y,
      vx: Math.cos(angle) * magnitude,
      vy: Math.sin(angle) * magnitude,
      life: 0.45 + Math.random() * 0.5,
      color,
    });
  }
}

function pulse(x, y, radius, color) {
  app.pulses.push({ x, y, radius, color, life: 0.5 });
}

function shake(amount) {
  app.shaker = Math.max(app.shaker, amount);
}

function setPlayerDirection(player, dirX, dirY) {
  if (!player.alive) return;
  if (player.dir.x === -dirX && player.dir.y === -dirY) return;
  player.nextDir = { x: dirX, y: dirY };
}

function handleKey(event) {
  const key = event.key.toLowerCase();
  if (key === "p" && (app.state === STATE_PLAYING || app.state === STATE_PAUSED)) {
    togglePause();
    return;
  }
  if (key === "r" && app.mode === MODE_SOLO) {
    launchSolo();
    return;
  }
  if (app.state !== STATE_PLAYING) return;
  for (const player of app.players) {
    const { controls } = player;
    if (controls.up.includes(key)) setPlayerDirection(player, 0, -1);
    if (controls.down.includes(key)) setPlayerDirection(player, 0, 1);
    if (controls.left.includes(key)) setPlayerDirection(player, -1, 0);
    if (controls.right.includes(key)) setPlayerDirection(player, 1, 0);
  }
}

function togglePause() {
  if (app.state === STATE_PLAYING) app.state = STATE_PAUSED;
  else if (app.state === STATE_PAUSED) app.state = STATE_PLAYING;
}

function restartCurrentMode() {
  if (app.mode === MODE_SOLO) {
    launchSolo();
  } else if (app.mode === MODE_VERSUS) {
    launchVersus();
  }
}

function clearTrail(player, convertToSafe) {
  for (const segment of player.trail) {
    if (isInside(segment.x, segment.y)) {
      app.board[segment.y][segment.x] = convertToSafe ? player.safeType : OPEN;
    }
  }
  player.trail = [];
}

function playerLosesLife(player, reason) {
  if (!player.alive) return;
  player.lives -= 1;
  player.vulnerable = false;
  clearTrail(player, false);
  burst((player.x + 0.5) * CELL, (player.y + 0.5) * CELL, COLORS.danger, 30, 150);
  shake(10);
  app.flash = 0.28;
  awardFloater(reason, (player.x + 0.5) * CELL, (player.y + 0.25) * CELL, COLORS.danger);
  sounds.death();
  if (app.mode === MODE_SOLO) app.solo.lives = player.lives;
  if (player.lives > 0) {
    player.x = player.spawn.x;
    player.y = player.spawn.y;
    player.dir = { x: player.id === 2 ? -1 : 1, y: 0 };
    player.nextDir = { ...player.dir };
    player.respawnTimer = 1.1;
  } else {
    player.alive = false;
  }
}

function nearestThreatDistance(player) {
  if (app.mode === MODE_SOLO) {
    return app.enemies.reduce((best, enemy) => {
      const dx = enemy.x - (player.x + 0.5) * CELL;
      const dy = enemy.y - (player.y + 0.5) * CELL;
      return Math.min(best, Math.hypot(dx, dy));
    }, Infinity);
  }
  return app.players.reduce((best, other) => {
    if (other.id === player.id || !other.alive) return best;
    const dx = (other.x - player.x) * CELL;
    const dy = (other.y - player.y) * CELL;
    return Math.min(best, Math.hypot(dx, dy));
  }, Infinity);
}

function closeTrail(player) {
  const trailSnapshot = [...player.trail];
  const hazardPoints = [];
  if (app.mode === MODE_SOLO) {
    for (const enemy of app.enemies) {
      hazardPoints.push({
        x: Math.max(0, Math.min(COLS - 1, Math.floor(enemy.x / CELL))),
        y: Math.max(0, Math.min(ROWS - 1, Math.floor(enemy.y / CELL))),
      });
    }
  } else {
    for (const other of app.players) {
      if (other.id !== player.id && other.alive) {
        hazardPoints.push({ x: other.x, y: other.y });
      }
    }
  }

  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const captures = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (app.board[y][x] !== OPEN || visited[y][x]) continue;
      const region = [];
      const queue = [{ x, y }];
      let pointer = 0;
      let hasHazard = false;
      visited[y][x] = true;
      while (pointer < queue.length) {
        const current = queue[pointer];
        pointer += 1;
        region.push(current);
        for (const hazard of hazardPoints) {
          if (hazard.x === current.x && hazard.y === current.y) {
            hasHazard = true;
            break;
          }
        }
        const neighbors = [
          { x: current.x + 1, y: current.y },
          { x: current.x - 1, y: current.y },
          { x: current.x, y: current.y + 1 },
          { x: current.x, y: current.y - 1 },
        ];
        for (const next of neighbors) {
          if (!isInside(next.x, next.y) || visited[next.y][next.x]) continue;
          if (app.board[next.y][next.x] !== OPEN) continue;
          visited[next.y][next.x] = true;
          queue.push(next);
        }
      }
      if (!hasHazard) captures.push(region);
    }
  }

  let selectedCaptures = captures;
  if (app.mode === MODE_VERSUS && captures.length > 1) {
    // In versus mode there are no free-roaming enemies to mark the "live"
    // side of the arena, so we claim only the smallest newly enclosed region.
    let smallest = captures[0];
    for (const region of captures) {
      if (region.length < smallest.length) smallest = region;
    }
    selectedCaptures = [smallest];
  }

  let claimed = 0;
  for (const segment of trailSnapshot) {
    app.board[segment.y][segment.x] = player.safeType;
    claimed += 1;
  }
  for (const region of selectedCaptures) {
    for (const tile of region) {
      app.board[tile.y][tile.x] = player.safeType;
      claimed += 1;
    }
  }
  player.trail = [];
  player.vulnerable = false;
  const points = claimed * 12 + player.combo * 35;
  player.combo += 1;
  player.score += points;
  if (app.mode === MODE_SOLO) app.solo.score = player.score;
  awardFloater(`+${points}`, (player.x + 0.5) * CELL, (player.y + 0.5) * CELL, player.color);
  if (claimed >= 20) {
    awardFloater(claimed >= 80 ? "Big Grab!" : "Line Closed!", (player.x + 0.5) * CELL, (player.y - 0.1) * CELL, COLORS.gold);
  }
  pulse((player.x + 0.5) * CELL, (player.y + 0.5) * CELL, 18, player.color);
  burst((player.x + 0.5) * CELL, (player.y + 0.5) * CELL, player.color, 24, 140);
  shake(claimed >= 50 ? 9 : 5);
  sounds.capture();
}

function movePlayer(player, dt) {
  if (!player.alive) return;
  if (player.respawnTimer > 0) {
    player.respawnTimer -= dt;
    return;
  }
  player.moveTimer += dt;
  while (player.moveTimer >= player.moveDelay) {
    player.moveTimer -= player.moveDelay;
    player.dir = { ...player.nextDir };
    const nx = player.x + player.dir.x;
    const ny = player.y + player.dir.y;
    if (!isInside(nx, ny)) return;

    const nextCell = cellAt(nx, ny);
    const safe = isSafeForPlayer(player, nextCell);
    const ownTrail = nextCell === trailType(player);
    const otherTrail = (nextCell === TRAIL_P1 || nextCell === TRAIL_P2) && nextCell !== trailType(player);
    const blockedEnemyZone = app.mode === MODE_VERSUS
      && (nextCell === SAFE_P1 || nextCell === SAFE_P2)
      && nextCell !== player.safeType
      && nextCell !== SAFE_NEUTRAL;

    if (ownTrail) {
      playerLosesLife(player, "Trail Crash!");
      player.combo = 0;
      return;
    }

    if (blockedEnemyZone) {
      return;
    }

    if (otherTrail) {
      const owner = app.players.find((candidate) => trailType(candidate) === nextCell);
      if (owner) {
        playerLosesLife(owner, "Trail Snapped!");
        owner.combo = 0;
      }
    }

    player.x = nx;
    player.y = ny;

    if (safe) {
      if (player.vulnerable) closeTrail(player);
    } else {
      player.vulnerable = true;
      app.board[ny][nx] = trailType(player);
      player.trail.push({ x: nx, y: ny });
      const dangerDistance = nearestThreatDistance(player);
      if (dangerDistance < CELL * 6) {
        app.flash = Math.max(app.flash, 0.08);
      }
    }
  }
}

function moveEnemyAxis(enemy, axis, dt) {
  const velocity = axis === "x" ? enemy.vx : enemy.vy;
  const next = (axis === "x" ? enemy.x : enemy.y) + velocity * dt;
  const futureX = axis === "x" ? next : enemy.x;
  const futureY = axis === "y" ? next : enemy.y;
  const sampleX = Math.max(0, Math.min(COLS - 1, Math.floor(futureX / CELL)));
  const sampleY = Math.max(0, Math.min(ROWS - 1, Math.floor(futureY / CELL)));
  const hitWall = cellAt(sampleX, sampleY) !== OPEN;
  if (hitWall) {
    if (axis === "x") enemy.vx *= -1;
    else enemy.vy *= -1;
  } else if (axis === "x") {
    enemy.x = next;
  } else {
    enemy.y = next;
  }
}

function moveEnemies(dt) {
  for (const enemy of app.enemies) {
    moveEnemyAxis(enemy, "x", dt);
    moveEnemyAxis(enemy, "y", dt);
    const cellX = Math.max(0, Math.min(COLS - 1, Math.floor(enemy.x / CELL)));
    const cellY = Math.max(0, Math.min(ROWS - 1, Math.floor(enemy.y / CELL)));
    const current = cellAt(cellX, cellY);
    if (current === TRAIL_P1 || current === TRAIL_P2) {
      const owner = app.players.find((player) => trailType(player) === current);
      if (owner) {
        playerLosesLife(owner, "Trail Snapped!");
        owner.combo = 0;
      }
    }
  }
}

function getOwnedCounts() {
  let p1 = 0;
  let p2 = 0;
  let neutral = 0;
  let capturableTotal = 0;
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const isCapturable = x >= BORDER && y >= BORDER && x < COLS - BORDER && y < ROWS - BORDER;
      if (isCapturable) {
        capturableTotal += 1;
      }
      if (app.board[y][x] === SAFE_P1) p1 += 1;
      else if (app.board[y][x] === SAFE_P2) p2 += 1;
      else if (app.board[y][x] === SAFE_NEUTRAL) neutral += 1;
    }
  }
  return { p1, p2, neutral, total: COLS * ROWS, capturableTotal };
}

function finishVersus() {
  const counts = getOwnedCounts();
  const [p1, p2] = app.players;
  const p1Percent = Math.round((counts.p1 / counts.capturableTotal) * 100);
  const p2Percent = Math.round((counts.p2 / counts.capturableTotal) * 100);
  let winner = "Draw";
  if (app.versusRule === "lives") {
    if (p1.alive && !p2.alive) winner = "Player 1";
    else if (p2.alive && !p1.alive) winner = "Player 2";
    else if (p1.score !== p2.score) winner = p1.score > p2.score ? "Player 1" : "Player 2";
  } else if (p1Percent !== p2Percent) {
    winner = p1Percent > p2Percent ? "Player 1" : "Player 2";
  } else if (p1.score !== p2.score) {
    winner = p1.score > p2.score ? "Player 1" : "Player 2";
  }
  updateHud();
  sounds.victory();
  showMessage({
    eyebrow: "Match Over",
    title: winner === "Draw" ? "Dead Heat!" : `${winner} Wins!`,
    body: `Final control: P1 ${p1Percent}% / P2 ${p2Percent}% • Score ${p1.score} - ${p2.score}.`,
    primaryLabel: "Rematch",
    onPrimary: launchVersus,
  });
}

function updateHud() {
  if (app.mode === MODE_SOLO) {
    const counts = getOwnedCounts();
    const capturedPercent = Math.round((counts.p1 / counts.capturableTotal) * 100);
    ui.modeLabel.textContent = "Solo vs Computer";
    ui.modeSubtext.textContent = "Seal empty zones, dodge the drones, and hit the target capture percentage.";
    ui.scoreValue.textContent = String(app.solo.score);
    ui.zoneValue.textContent = `${capturedPercent}%`;
    ui.livesValue.textContent = String(app.players[0]?.lives ?? 3);
    ui.roundValue.textContent = String(app.solo.round);
    ui.versusHud.classList.add("hidden");
  } else if (app.mode === MODE_VERSUS) {
    const counts = getOwnedCounts();
    const p1Percent = Math.round((counts.p1 / counts.capturableTotal) * 100);
    const p2Percent = Math.round((counts.p2 / counts.capturableTotal) * 100);
    ui.modeLabel.textContent = app.versusRule === "area" ? "Versus: Area Battle" : "Versus: Lives Battle";
    ui.modeSubtext.textContent = app.versusRule === "area"
      ? `Own the most territory before ${app.versus.maxTimer}s expires.`
      : "Snap trails, survive the chaos, and outlast your rival.";
    ui.scoreValue.textContent = `${app.players[0]?.score ?? 0} / ${app.players[1]?.score ?? 0}`;
    ui.zoneValue.textContent = `${p1Percent}% - ${p2Percent}%`;
    ui.livesValue.textContent = `${app.players[0]?.lives ?? 0} / ${app.players[1]?.lives ?? 0}`;
    ui.roundValue.textContent = app.versusRule === "area" ? `${Math.ceil(app.versus.timer)}s` : "Duel";
    ui.versusHud.innerHTML = `
      <div class="versus-card player1">
        <span>Player 1</span>
        <strong>${app.players[0]?.score ?? 0} pts • ${p1Percent}%</strong>
      </div>
      <div class="versus-card player2">
        <span>Player 2</span>
        <strong>${app.players[1]?.score ?? 0} pts • ${p2Percent}%</strong>
      </div>
    `;
    ui.versusHud.classList.remove("hidden");
  } else {
    ui.modeLabel.textContent = "Main Menu";
    ui.modeSubtext.textContent = "Claim the grid. Dodge the danger. Close the line.";
    ui.scoreValue.textContent = "0";
    ui.zoneValue.textContent = "0%";
    ui.livesValue.textContent = "-";
    ui.roundValue.textContent = "-";
    ui.versusHud.classList.add("hidden");
  }
}

function updateHelpText() {
  if (app.mode === MODE_VERSUS) {
    ui.controlsHint.innerHTML = "<p>`WASD` Player 1</p><p>Arrow keys Player 2</p><p>`P` pause</p>";
  } else {
    ui.controlsHint.innerHTML = "<p>`WASD` or arrow keys</p><p>`P` pause, `R` restart</p>";
  }
}

function updateFx(dt) {
  app.particles = app.particles.filter((particle) => {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.98;
    particle.vy *= 0.98;
    return particle.life > 0;
  });
  app.floaters = app.floaters.filter((floater) => {
    floater.life -= dt;
    floater.y -= 30 * dt;
    return floater.life > 0;
  });
  app.pulses = app.pulses.filter((ring) => {
    ring.life -= dt;
    ring.radius += 120 * dt;
    return ring.life > 0;
  });
  app.shaker = Math.max(0, app.shaker - 18 * dt);
  app.flash = Math.max(0, app.flash - 0.9 * dt);
}

function updateGame(dt) {
  if (app.state !== STATE_PLAYING) return;
  if (app.mode === MODE_VERSUS && app.versusRule === "area") {
    const counts = getOwnedCounts();
    const claimedPercent = Math.round(((counts.p1 + counts.p2) / counts.capturableTotal) * 100);
    if (claimedPercent >= 100) {
      finishVersus();
      return;
    }
    app.versus.timer -= dt;
    if (app.versus.timer <= 0) {
      finishVersus();
      return;
    }
  }

  for (const player of app.players) movePlayer(player, dt);

  if (app.mode === MODE_SOLO) {
    moveEnemies(dt);
    const player = app.players[0];
    if (!player.alive) {
      updateHud();
      showMessage({
        eyebrow: "Round Lost",
        title: "Too Slow!",
        body: `The drones held the wild zone this time. Final score: ${player.score}.`,
        primaryLabel: "Retry Solo",
        onPrimary: launchSolo,
      });
      return;
    }
    const counts = getOwnedCounts();
    const controlledPercent = Math.round((counts.p1 / counts.capturableTotal) * 100);
    if (controlledPercent >= app.solo.targetPercent) {
      app.solo.round += 1;
      app.solo.score = player.score + 500;
      app.solo.lives = player.lives;
      sounds.victory();
      updateHud();
      showMessage({
        eyebrow: "Round Won",
        title: "Zone Master!",
        body: `You locked down ${controlledPercent}% of the arena. Next round adds more pressure.`,
        primaryLabel: "Next Round",
        onPrimary: startSoloRound,
      });
      return;
    }
  } else if (app.mode === MODE_VERSUS) {
    const [p1, p2] = app.players;
    if (p1.alive && p2.alive && p1.x === p2.x && p1.y === p2.y) {
      playerLosesLife(p1, "Head-On!");
      playerLosesLife(p2, "Head-On!");
    }
    if (app.versusRule === "lives" && (!p1.alive || !p2.alive)) {
      finishVersus();
      return;
    }
  }

  updateFx(dt);
  updateHud();
}

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawBoard() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.save();
  if (app.shaker > 0) {
    ctx.translate((Math.random() - 0.5) * app.shaker, (Math.random() - 0.5) * app.shaker);
  }

  const background = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  background.addColorStop(0, "#091220");
  background.addColorStop(1, "#040912");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const cell = app.board[y]?.[x] ?? OPEN;
      if (cell === OPEN) ctx.fillStyle = COLORS.open;
      else if (cell === SAFE_NEUTRAL) ctx.fillStyle = "#102946";
      else if (cell === SAFE_P1) ctx.fillStyle = "#103752";
      else if (cell === SAFE_P2) ctx.fillStyle = "#4b163a";
      else if (cell === TRAIL_P1) ctx.fillStyle = `rgba(55, 232, 255, ${0.64 + Math.sin(performance.now() * 0.015 + x) * 0.2})`;
      else if (cell === TRAIL_P2) ctx.fillStyle = `rgba(255, 102, 200, ${0.64 + Math.sin(performance.now() * 0.015 + x) * 0.2})`;
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
  }

  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x += 1) {
    ctx.beginPath();
    ctx.moveTo(x * CELL + 0.5, 0);
    ctx.lineTo(x * CELL + 0.5, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y += 1) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL + 0.5);
    ctx.lineTo(WIDTH, y * CELL + 0.5);
    ctx.stroke();
  }

  for (const enemy of app.enemies) {
    const glow = ctx.createRadialGradient(enemy.x, enemy.y, 2, enemy.x, enemy.y, enemy.r * 2.4);
    glow.addColorStop(0, "#fff0b2");
    glow.addColorStop(1, "rgba(255, 207, 92, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.r * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.enemy;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const player of app.players) {
    if (!player.alive) continue;
    const px = (player.x + 0.5) * CELL;
    const py = (player.y + 0.5) * CELL;
    const alpha = player.respawnTimer > 0 ? 0.35 + Math.sin(performance.now() * 0.03) * 0.25 : 1;
    const glow = ctx.createRadialGradient(px, py, 2, px, py, 24);
    glow.addColorStop(0, hexToRgba(player.color, alpha));
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(px, py, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hexToRgba(player.color, alpha);
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();
    if (player.vulnerable) {
      ctx.strokeStyle = "rgba(255, 246, 181, 0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 11 + Math.sin(performance.now() * 0.02) * 1.4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  for (const particle of app.particles) {
    ctx.fillStyle = hexToRgba(particle.color, Math.max(0, particle.life));
    ctx.fillRect(particle.x, particle.y, 3, 3);
  }

  ctx.textAlign = "center";
  ctx.font = "700 18px 'Chakra Petch', sans-serif";
  for (const floater of app.floaters) {
    ctx.fillStyle = hexToRgba(floater.color, Math.max(0, floater.life));
    ctx.fillText(floater.text, floater.x, floater.y);
  }

  for (const ring of app.pulses) {
    ctx.strokeStyle = hexToRgba(ring.color, ring.life);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (app.flash > 0) {
    ctx.fillStyle = `rgba(255, 95, 127, ${app.flash})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  if (app.state === STATE_PAUSED) {
    ctx.fillStyle = "rgba(3, 7, 16, 0.58)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = COLORS.text;
    ctx.font = "700 48px 'Chakra Petch', sans-serif";
    ctx.fillText("PAUSED", WIDTH / 2, HEIGHT / 2 - 8);
    ctx.font = "400 18px 'Space Grotesk', sans-serif";
    ctx.fillText("Press P or tap Pause to jump back in.", WIDTH / 2, HEIGHT / 2 + 24);
  }

  ctx.restore();
}

function loop(timestamp) {
  const dt = Math.min((timestamp - app.lastTime) / 1000 || 0, 0.033);
  app.lastTime = timestamp;
  updateGame(dt);
  if (app.state !== STATE_PLAYING) updateFx(dt);
  drawBoard();
  requestAnimationFrame(loop);
}

function bindUi() {
  ui.startSoloButton.addEventListener("click", () => {
    sounds.click();
    launchSolo();
  });
  ui.startVersusButton.addEventListener("click", () => {
    sounds.click();
    launchVersus();
  });
  ui.howToPlayButton.addEventListener("click", () => {
    sounds.click();
    showRules();
  });
  ui.closeRulesButton.addEventListener("click", () => {
    sounds.click();
    returnToMenu();
  });
  ui.soundToggleButton.addEventListener("click", () => {
    app.soundOn = !app.soundOn;
    ui.soundToggleButton.textContent = `Sound: ${app.soundOn ? "On" : "Off"}`;
    sounds.click();
  });
  ui.pauseButton.addEventListener("click", () => {
    sounds.click();
    if (app.mode) togglePause();
  });
  ui.menuButton.addEventListener("click", () => {
    sounds.click();
    returnToMenu();
  });
  ui.restartButton.addEventListener("click", () => {
    sounds.click();
    restartCurrentMode();
  });
  ui.messagePrimaryButton.addEventListener("click", () => {
    sounds.click();
    if (app.messageAction) app.messageAction();
  });
  ui.messageSecondaryButton.addEventListener("click", () => {
    sounds.click();
    returnToMenu();
  });
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      sounds.click();
      app.versusRule = chip.dataset.rule;
      document.querySelectorAll(".chip").forEach((node) => node.classList.toggle("active", node === chip));
    });
  });
  document.addEventListener("keydown", handleKey);
  ui.touchControls.querySelectorAll("button[data-dir]").forEach((button) => {
    button.addEventListener("pointerdown", () => {
      if (!app.players[0]) return;
      const dir = button.dataset.dir;
      if (dir === "up") setPlayerDirection(app.players[0], 0, -1);
      if (dir === "down") setPlayerDirection(app.players[0], 0, 1);
      if (dir === "left") setPlayerDirection(app.players[0], -1, 0);
      if (dir === "right") setPlayerDirection(app.players[0], 1, 0);
    });
  });
}

bindUi();
updateHud();
updateHelpText();
setState(STATE_MENU);
requestAnimationFrame(loop);
