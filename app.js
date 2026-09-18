const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const gameOverScreen = document.getElementById("game-over");
const cycleEl = document.getElementById("cycle");
const loveMessageScreen = document.getElementById("love-message");

const chompSound = new Audio("sounds/chomp.mp3");
const powerSound = new Audio("sounds/power.mp3");
const eatGhostSound = new Audio("sounds/eat_ghost.mp3");
const deathSound = new Audio("sounds/death.mp3");
const freezeSound = new Audio("sounds/freeze.mp3");
const loveTheme = new Audio("sounds/love_theme.mp3");
loveTheme.loop = true;

const SIZE = 20;
let score = 0;
let highScore = localStorage.getItem("pacmanHighScore") || 0;
highScoreEl.innerText = highScore;

let gameOver = false;
let gameStarted = false;
let isPaused = false;
let isTransitioning = false;
let scaredModeTimer = 0;
let freezeTimer = 0;
let remainingPellets = 0;
let totalPellets = 0;
let cycleCount = 1;

let fruit = { active: false, gridX: -1, gridY: -1, timer: 0 };
let iceFruit = { active: false, gridX: -1, gridY: -1, timer: 0 };

const BASE_MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 0, 1, 1, 1, 3, 1, 3, 1, 1, 1, 0, 1, 1, 1, 1, 1],
  [3, 3, 3, 3, 1, 0, 1, 3, 3, 3, 3, 3, 3, 3, 1, 0, 1, 3, 3, 3, 3],
  [1, 1, 1, 1, 1, 0, 1, 3, 1, 1, 4, 1, 1, 3, 1, 0, 1, 1, 1, 1, 1],
  [3, 3, 3, 3, 3, 0, 3, 3, 1, 5, 5, 5, 1, 3, 3, 0, 3, 3, 3, 3, 3],
  [1, 1, 1, 1, 1, 0, 1, 3, 1, 1, 1, 1, 1, 3, 1, 0, 1, 1, 1, 1, 1],
  [3, 3, 3, 3, 1, 0, 1, 3, 3, 3, 3, 3, 3, 3, 1, 0, 1, 3, 3, 3, 3],
  [1, 1, 1, 1, 1, 0, 1, 3, 1, 1, 1, 1, 1, 3, 1, 0, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

let map = [];
let pacman;
let ghosts = [];
let keysDown = [];

window.addEventListener("keydown", (e) => {
  //if (e.key === "Enter") {
  //  cycleCount = 10;
  //  remainingPellets = 0;
  //}

  if (e.code === "Space") {
    if (gameOver) {
      location.reload();
    } else if (isTransitioning) {
      isTransitioning = false;
      loveMessageScreen.classList.add("hidden");
      loveTheme.pause();
      loveTheme.currentTime = 0;
      initLevel(false);
    } else if (gameStarted) {
      isPaused = !isPaused;
    }
    e.preventDefault();
  }

  if (isPaused || isTransitioning) return;

  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
    gameStarted = true;
    if (!keysDown.includes(e.key)) keysDown.unshift(e.key);
  }
});

window.addEventListener("keyup", (e) => {
  keysDown = keysDown.filter((k) => k !== e.key);
});

function isWalkable(gx, gy) {
  if (gx < 0) gx = map[0].length - 1;
  if (gx >= map[0].length) gx = 0;
  if (gy < 0 || gy >= map.length) return false;
  return map[gy][gx] !== 1;
}

function checkLineOfSight(gx, gy, px, py) {
  if (gx === px) {
    let minY = Math.min(gy, py);
    let maxY = Math.max(gy, py);
    for (let y = minY; y <= maxY; y++) if (map[y][gx] === 1) return null;
    return { dx: 0, dy: py > gy ? 1 : -1 };
  }
  if (gy === py) {
    let minX = Math.min(gx, px);
    let maxX = Math.max(gx, px);
    for (let x = minX; x <= maxX; x++) if (map[gy][x] === 1) return null;
    return { dx: px > gx ? 1 : -1, dy: 0 };
  }
  return null;
}

function getSafeFruitSpots() {
  let emptySpots = [];
  for (let r = 1; r < map.length - 1; r++) {
    for (let c = 3; c < map[0].length - 3; c++) {
      if (BASE_MAP[r][c] === 0 && map[r][c] === 3) {
        emptySpots.push({ r, c });
      }
    }
  }
  return emptySpots;
}

function spawnFruit() {
  let safeSpots = getSafeFruitSpots();
  if (safeSpots.length > 0) {
    let spot = safeSpots[Math.floor(Math.random() * safeSpots.length)];
    fruit.gridX = spot.c;
    fruit.gridY = spot.r;
    fruit.active = true;
    fruit.timer = 600;
  }
}

function spawnIceFruit() {
  let safeSpots = getSafeFruitSpots();
  if (safeSpots.length > 0) {
    let spot = safeSpots[Math.floor(Math.random() * safeSpots.length)];
    iceFruit.gridX = spot.c;
    iceFruit.gridY = spot.r;
    iceFruit.active = true;
    iceFruit.timer = 600;
  }
}

class Pacman {
  constructor() {
    this.x = 10 * SIZE;
    this.y = 15 * SIZE;
    this.dx = 0;
    this.dy = 0;
    this.angle = 0;
    this.moveAccumulator = 0;
  }

  update() {
    let activeKey = keysDown[0];
    let qDx = 0,
      qDy = 0;

    if (activeKey === "ArrowLeft") qDx = -1;
    else if (activeKey === "ArrowRight") qDx = 1;
    else if (activeKey === "ArrowUp") qDy = -1;
    else if (activeKey === "ArrowDown") qDy = 1;

    let gridX_center = Math.round(this.x / SIZE);
    let gridY_center = Math.round(this.y / SIZE);
    let currentSpeed = 2.0;

    if (
      map[gridY_center] &&
      (map[gridY_center][gridX_center] === 0 ||
        map[gridY_center][gridX_center] === 2)
    ) {
      currentSpeed = 1.6;
    }

    this.moveAccumulator += currentSpeed;
    let steps = Math.floor(this.moveAccumulator);
    this.moveAccumulator -= steps;

    for (let i = 0; i < steps; i++) {
      if (activeKey) {
        if (qDx === -this.dx && this.dx !== 0) {
          this.dx = qDx;
          this.dy = 0;
        } else if (qDy === -this.dy && this.dy !== 0) {
          this.dx = 0;
          this.dy = qDy;
        }
      }

      this.x += this.dx;
      this.y += this.dy;

      if (this.x < -SIZE) this.x = canvas.width;
      if (this.x > canvas.width) this.x = -SIZE;

      if (this.x % SIZE === 0 && this.y % SIZE === 0) {
        let gx = this.x / SIZE;
        let gy = this.y / SIZE;
        if (activeKey) {
          if (isWalkable(gx + qDx, gy + qDy)) {
            this.dx = qDx;
            this.dy = qDy;
          } else if (!isWalkable(gx + this.dx, gy + this.dy)) {
            this.dx = 0;
            this.dy = 0;
          }
        } else {
          this.dx = 0;
          this.dy = 0;
        }
      } else {
        let gx = Math.round(this.x / SIZE);
        let gy = Math.round(this.y / SIZE);
        let cx = gx * SIZE;
        let cy = gy * SIZE;
        let dist = Math.hypot(this.x - cx, this.y - cy);

        if (dist > 0 && dist <= 6) {
          let isMovingAway =
            (this.dx > 0 && this.x > cx) ||
            (this.dx < 0 && this.x < cx) ||
            (this.dy > 0 && this.y > cy) ||
            (this.dy < 0 && this.y < cy);
          if (!activeKey && isMovingAway) {
            this.x = cx;
            this.y = cy;
            this.dx = 0;
            this.dy = 0;
          } else if (activeKey && (qDx !== this.dx || qDy !== this.dy)) {
            if (qDx !== -this.dx && qDy !== -this.dy) {
              if (isWalkable(gx + qDx, gy + qDy)) {
                this.x = cx;
                this.y = cy;
                this.dx = qDx;
                this.dy = qDy;
              }
            }
          }
        }
      }
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x + SIZE / 2, this.y + SIZE / 2);
    if (this.dx === 1) this.angle = 0;
    else if (this.dx === -1) this.angle = Math.PI;
    else if (this.dy === 1) this.angle = Math.PI / 2;
    else if (this.dy === -1) this.angle = -Math.PI / 2;
    ctx.rotate(this.angle);

    let isMoving = this.dx !== 0 || this.dy !== 0;
    let mouth = isMoving ? (Math.sin(Date.now() / 80) + 1) * 0.25 : 0.1;

    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(0, 0, SIZE / 2 - 2, mouth * Math.PI, (2 - mouth) * Math.PI);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.restore();
  }
}

class Ghost {
  constructor(startX, startY, color) {
    this.x = startX * SIZE;
    this.y = startY * SIZE;
    this.color = color;
    this.dx = 0;
    this.dy = -1;
    this.isDead = false;
    this.respawnTimer = 0;
    this.moveAccumulator = 0;
  }

  update() {
    if (this.isDead) {
      let targetX = 10 * SIZE;
      let targetY = 9 * SIZE;
      let flySpeed = 2;
      if (this.x < targetX) this.x += flySpeed;
      else if (this.x > targetX) this.x -= flySpeed;
      if (this.y < targetY) this.y += flySpeed;
      else if (this.y > targetY) this.y -= flySpeed;

      if (
        Math.abs(this.x - targetX) < flySpeed &&
        Math.abs(this.y - targetY) < flySpeed
      ) {
        this.x = targetX;
        this.y = targetY;
        this.isDead = false;
        this.respawnTimer = Math.max(90, 300 - (cycleCount - 1) * 30);
        this.dx = 0;
        this.dy = -1;
      }
      return;
    }

    if (this.respawnTimer > 0) {
      this.respawnTimer--;
      return;
    }

    let currentFreezeMax = Math.max(150, 360 - (cycleCount - 1) * 30);
    let isCruiseElroy = this.color === "red" && remainingPellets < 15;

    if (freezeTimer > 0) {
      if (!(isCruiseElroy && freezeTimer < currentFreezeMax / 2)) {
        return;
      }
    }

    // --- ĐƯỜNG CONG TỐC ĐỘ ĐÃ GIẢM CỰC KỲ THẤP (Vòng 10 mới chỉ 0.95) ---
    let baseSpeed = 0.25;
    if (scaredModeTimer > 0) {
      baseSpeed = 0.25;
    } else {
      if (cycleCount === 1) baseSpeed = 0.25;
      else if (cycleCount === 2) baseSpeed = 0.3;
      else if (cycleCount === 3) baseSpeed = 0.35;
      else if (cycleCount === 4) baseSpeed = 0.4;
      else if (cycleCount === 5) baseSpeed = 0.45;
      else if (cycleCount === 6)
        baseSpeed = 0.55; // Rùa bò
      else if (cycleCount === 7) baseSpeed = 0.65;
      else if (cycleCount === 8) baseSpeed = 0.75;
      else if (cycleCount === 9) baseSpeed = 0.85;
      else baseSpeed = 0.95; // Max speed chưa bằng 1 nửa Pacman (2.0)
    }

    if (isCruiseElroy && scaredModeTimer === 0) {
      baseSpeed *= 1.25;
    }

    this.moveAccumulator += baseSpeed;
    let steps = Math.floor(this.moveAccumulator);
    this.moveAccumulator -= steps;

    for (let i = 0; i < steps; i++) {
      this.x += this.dx;
      this.y += this.dy;

      if (this.x < -SIZE) this.x = canvas.width;
      if (this.x > canvas.width) this.x = -SIZE;

      if (this.x % SIZE === 0 && this.y % SIZE === 0) {
        let gridX = this.x / SIZE;
        let gridY = this.y / SIZE;
        let pacX = Math.round(pacman.x / SIZE);
        let pacY = Math.round(pacman.y / SIZE);

        let moves = [
          { dx: 0, dy: -1 },
          { dx: 0, dy: 1 },
          { dx: -1, dy: 0 },
          { dx: 1, dy: 0 },
        ];

        let validMoves = moves.filter(
          (m) =>
            !(m.dx === -this.dx && m.dy === -this.dy) &&
            isWalkable(gridX + m.dx, gridY + m.dy),
        );
        if (validMoves.length === 0)
          validMoves = moves.filter((m) =>
            isWalkable(gridX + m.dx, gridY + m.dy),
          );

        let isChasing = false;

        if (scaredModeTimer === 0 && cycleCount >= 6) {
          let targetX = pacX;
          let targetY = pacY;

          if (this.color === "pink" || this.color === "green") {
            targetX += pacman.dx * 4;
            targetY += pacman.dy * 4;
          } else if (this.color === "orange" || this.color === "cyan") {
            let distToPac = Math.hypot(gridX - pacX, gridY - pacY);
            if (distToPac < 8 && !isCruiseElroy) {
              targetX = 1;
              targetY = 1;
            }
          }

          let bestMove = null;
          let minDist = Infinity;
          validMoves.forEach((m) => {
            let nextX = gridX + m.dx;
            let nextY = gridY + m.dy;
            let d = Math.hypot(nextX - targetX, nextY - targetY);
            if (d < minDist) {
              minDist = d;
              bestMove = m;
            }
          });

          if (bestMove) {
            this.dx = bestMove.dx;
            this.dy = bestMove.dy;
            isChasing = true;
          }
        } else if (scaredModeTimer === 0 && cycleCount >= 4) {
          let losDir = checkLineOfSight(gridX, gridY, pacX, pacY);
          if (losDir) {
            this.dx = losDir.dx;
            this.dy = losDir.dy;
            isChasing = true;
          }
        }

        if (!isChasing) {
          if (validMoves.length > 0) {
            let move =
              validMoves[Math.floor(Math.random() * validMoves.length)];
            this.dx = move.dx;
            this.dy = move.dy;
          } else {
            this.dx = 0;
            this.dy = 0;
          }
        }
      }
    }
  }

  draw() {
    let x = this.x + SIZE / 2;
    let y = this.y + SIZE / 2;
    let r = SIZE / 2 - 2;
    let color = this.color;

    if (this.isDead) {
      color = "transparent";
    } else if (scaredModeTimer > 0) {
      color =
        scaredModeTimer < 100 && Math.floor(Date.now() / 200) % 2 === 0
          ? "white"
          : "#0033ff";
    } else if (freezeTimer > 0) {
      color = "#00ffff";
    }

    if (!this.isDead) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, Math.PI, 0);
      ctx.lineTo(x + r, y + r);
      ctx.lineTo(x + r / 3, y + r - 3);
      ctx.lineTo(x - r / 3, y + r);
      ctx.lineTo(x - r, y + r - 3);
      ctx.lineTo(x - r, y);
      ctx.fill();
    }

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x - 3, y - 2, 3, 0, Math.PI * 2);
    ctx.arc(x + 3, y - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle =
      scaredModeTimer > 0 && !this.isDead && freezeTimer === 0 ? "red" : "blue";
    ctx.beginPath();
    ctx.arc(x - 3 + this.dx, y - 2 + this.dy, 1.5, 0, Math.PI * 2);
    ctx.arc(x + 3 + this.dx, y - 2 + this.dy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initLevel(resetPositions = true) {
  map = JSON.parse(JSON.stringify(BASE_MAP));

  let powerPelletCount = 10;
  if (cycleCount === 2) powerPelletCount = 8;
  else if (cycleCount === 3) powerPelletCount = 7;
  else if (cycleCount === 4) powerPelletCount = 6;
  else if (cycleCount === 5) powerPelletCount = 5;
  else if (cycleCount === 6) powerPelletCount = 4;
  else if (cycleCount === 7) powerPelletCount = 3;
  else if (cycleCount >= 8) powerPelletCount = 2;

  const FIXED_POWER_SPOTS = [
    { r: 1, c: 1 },
    { r: 1, c: 19 },
    { r: 19, c: 1 },
    { r: 19, c: 19 },
    { r: 5, c: 1 },
    { r: 5, c: 19 },
    { r: 15, c: 1 },
    { r: 15, c: 19 },
    { r: 3, c: 5 },
    { r: 17, c: 15 },
  ];

  let powerSpots = FIXED_POWER_SPOTS.slice(0, powerPelletCount);

  for (let spot of powerSpots) {
    map[spot.r][spot.c] = 2;
  }

  remainingPellets = 0;
  totalPellets = 0;
  for (let r = 0; r < map.length; r++) {
    for (let c = 0; c < map[0].length; c++) {
      if (map[r][c] === 0 || map[r][c] === 2) {
        remainingPellets++;
        totalPellets++;
      }
    }
  }

  let numGhosts = 2;
  if (cycleCount === 2 || cycleCount === 3) numGhosts = 3;
  else if (cycleCount === 4 || cycleCount === 5) numGhosts = 4;
  else if (cycleCount === 6 || cycleCount === 7) numGhosts = 5;
  else if (cycleCount >= 8) numGhosts = 6;

  const ghostColors = ["red", "pink", "cyan", "orange", "purple", "green"];

  if (resetPositions) {
    pacman = new Pacman();
    ghosts = [];
    for (let i = 0; i < numGhosts; i++) {
      ghosts.push(new Ghost(10, 9, ghostColors[i]));
    }
    keysDown = [];
  } else {
    while (ghosts.length < numGhosts) {
      ghosts.push(new Ghost(10, 9, ghostColors[ghosts.length]));
    }
  }
}

function updateScore(points) {
  score += points;
  scoreEl.innerText = score;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("pacmanHighScore", highScore);
    highScoreEl.innerText = highScore;
  }
}

function drawMap() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < map.length; r++) {
    for (let c = 0; c < map[0].length; c++) {
      let x = c * SIZE;
      let y = r * SIZE;
      let tile = map[r][c];
      if (tile === 1) {
        ctx.strokeStyle = "#1919A6";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, SIZE - 4, SIZE - 4);
      } else if (tile === 4) {
        ctx.fillStyle = "pink";
        ctx.fillRect(x, y + SIZE / 2 - 2, SIZE, 4);
      } else if (tile === 0) {
        ctx.fillStyle = "#ffb8ae";
        ctx.fillRect(x + SIZE / 2 - 2, y + SIZE / 2 - 2, 4, 4);
      } else if (tile === 2) {
        ctx.fillStyle = "#ffb8ae";
        ctx.beginPath();
        ctx.arc(x + SIZE / 2, y + SIZE / 2, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawFruit() {
  if (fruit.active) {
    let fx = fruit.gridX * SIZE + SIZE / 2;
    let fy = fruit.gridY * SIZE + SIZE / 2;
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(fx - 4, fy + 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(fx + 4, fy + 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx - 4, fy + 2);
    ctx.lineTo(fx, fy - 6);
    ctx.lineTo(fx + 4, fy + 2);
    ctx.stroke();
  }

  if (iceFruit.active) {
    let ix = iceFruit.gridX * SIZE + SIZE / 2;
    let iy = iceFruit.gridY * SIZE + SIZE / 2;
    ctx.fillStyle = "#00ffff";
    ctx.beginPath();
    ctx.moveTo(ix, iy - 6);
    ctx.lineTo(ix + 6, iy);
    ctx.lineTo(ix, iy + 6);
    ctx.lineTo(ix - 6, iy);
    ctx.fill();
  }
}

function handleLogic() {
  let gridX = Math.round(pacman.x / SIZE);
  let gridY = Math.round(pacman.y / SIZE);

  if (map[gridY] && map[gridY][gridX] === 0) {
    map[gridY][gridX] = 3;
    updateScore(10);
    remainingPellets--;
    chompSound.currentTime = 0;
    chompSound.play();

    let p85 = Math.floor(totalPellets * 0.85);
    let p70 = Math.floor(totalPellets * 0.7);
    let p55 = Math.floor(totalPellets * 0.55);
    let p40 = Math.floor(totalPellets * 0.4);
    let p25 = Math.floor(totalPellets * 0.25);
    let p10 = Math.floor(totalPellets * 0.1);

    if (
      remainingPellets === p85 ||
      remainingPellets === p55 ||
      remainingPellets === p25
    )
      spawnIceFruit();
    if (
      remainingPellets === p70 ||
      remainingPellets === p40 ||
      remainingPellets === p10
    )
      spawnFruit();
  } else if (map[gridY] && map[gridY][gridX] === 2) {
    map[gridY][gridX] = 3;
    updateScore(50);
    scaredModeTimer = 350;
    remainingPellets--;
    powerSound.currentTime = 0;
    powerSound.play();
  }

  if (fruit.active) {
    fruit.timer--;
    if (fruit.timer <= 0) fruit.active = false;
    else if (gridX === fruit.gridX && gridY === fruit.gridY) {
      fruit.active = false;
      updateScore(500);
      eatGhostSound.currentTime = 0;
      eatGhostSound.play();
    }
  }

  if (iceFruit.active) {
    iceFruit.timer--;
    if (iceFruit.timer <= 0) iceFruit.active = false;
    else if (gridX === iceFruit.gridX && gridY === iceFruit.gridY) {
      iceFruit.active = false;
      freezeTimer = Math.max(150, 360 - (cycleCount - 1) * 30);
      updateScore(300);
      freezeSound.currentTime = 0;
      freezeSound.play();
    }
  }

  if (scaredModeTimer > 0) scaredModeTimer--;
  if (freezeTimer > 0) freezeTimer--;

  if (remainingPellets === 0) {
    cycleCount++;
    cycleEl.innerText = cycleCount;

    if (cycleCount === 11) {
      loveMessageScreen.classList.remove("hidden");
      isTransitioning = true;
      loveTheme.play();
      return;
    }

    initLevel(false);
    return;
  }

  ghosts.forEach((g) => {
    let dist = Math.hypot(pacman.x - g.x, pacman.y - g.y);
    if (dist < SIZE - 4 && !g.isDead) {
      if (scaredModeTimer > 0) {
        updateScore(200);
        g.isDead = true;
        eatGhostSound.currentTime = 0;
        eatGhostSound.play();
      } else {
        gameOver = true;
        deathSound.play();
      }
    }
  });
}

function gameLoop() {
  if (gameOver) {
    gameOverScreen.classList.remove("hidden");
    return;
  }

  if (isTransitioning) {
    drawMap();
    pacman.draw();
    ghosts.forEach((g) => g.draw());
    if (cycleCount >= 8) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(gameLoop);
    return;
  }

  if (isPaused) {
    drawMap();
    drawFruit();
    pacman.draw();
    ghosts.forEach((g) => g.draw());

    if (cycleCount >= 8) {
      ctx.save();
      let gradient = ctx.createRadialGradient(
        pacman.x + SIZE / 2,
        pacman.y + SIZE / 2,
        SIZE * 1.5,
        pacman.x + SIZE / 2,
        pacman.y + SIZE / 2,
        SIZE * 6,
      );
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 1)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 255, 0, 0.6)";
    ctx.font = "20px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2 + 10);

    requestAnimationFrame(gameLoop);
    return;
  }

  if (!gameStarted) {
    drawMap();
    pacman.draw();
    ghosts.forEach((g) => g.draw());

    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.fillStyle = "yellow";
      ctx.font = "12px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "BẤM MŨI TÊN ĐỂ CHƠI",
        canvas.width / 2,
        canvas.height / 2 + 20,
      );
    }
    requestAnimationFrame(gameLoop);
    return;
  }

  pacman.update();
  ghosts.forEach((g) => g.update());
  handleLogic();

  drawMap();
  drawFruit();
  if (iceFruit.active) drawFruit();
  pacman.draw();
  ghosts.forEach((g) => g.draw());

  if (cycleCount >= 8) {
    ctx.save();
    let gradient = ctx.createRadialGradient(
      pacman.x + SIZE / 2,
      pacman.y + SIZE / 2,
      SIZE * 1.5,
      pacman.x + SIZE / 2,
      pacman.y + SIZE / 2,
      SIZE * 6,
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 1)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  requestAnimationFrame(gameLoop);
}

initLevel(true);
requestAnimationFrame(gameLoop);
