const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const gameOverScreen = document.getElementById("game-over");

const chompSound = new Audio("sounds/chomp.mp3");
const powerSound = new Audio("sounds/power.mp3");
const eatGhostSound = new Audio("sounds/eat_ghost.mp3");
const deathSound = new Audio("sounds/death.mp3");

const SIZE = 20;
let score = 0;
let highScore = localStorage.getItem("pacmanHighScore") || 0;
highScoreEl.innerText = highScore;

let gameOver = false;
let gameStarted = false;
let scaredModeTimer = 0;
let remainingPellets = 0;

const BASE_MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1],
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
  [1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 1],
  [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 2, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 2, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

let map = [];
let pacman;
let ghosts = [];
let keysDown = [];

window.addEventListener("keydown", (e) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
    gameStarted = true;
    if (!keysDown.includes(e.key)) {
      keysDown.unshift(e.key);
    }
  }
  if (e.code === "Space" && gameOver) location.reload();
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

class Pacman {
  constructor() {
    this.x = 10 * SIZE;
    this.y = 15 * SIZE;
    this.speed = 2;
    this.dx = 0;
    this.dy = 0;
    this.angle = 0;
  }

  update() {
    let activeKey = keysDown[0];
    let qDx = 0,
      qDy = 0;

    if (activeKey === "ArrowLeft") qDx = -1;
    else if (activeKey === "ArrowRight") qDx = 1;
    else if (activeKey === "ArrowUp") qDy = -1;
    else if (activeKey === "ArrowDown") qDy = 1;

    // 1. VÙNG DUNG SAI NAM CHÂM (Bảo vệ thao tác phanh muộn và rẽ muộn/sớm)
    let isMoving = this.dx !== 0 || this.dy !== 0;
    if (isMoving) {
      let gridX = Math.round(this.x / SIZE);
      let gridY = Math.round(this.y / SIZE);
      let centerX = gridX * SIZE;
      let centerY = gridY * SIZE;

      let dist = Math.hypot(this.x - centerX, this.y - centerY);

      // Nếu nằm trong bán kính 6 pixel quanh tâm ngã tư
      if (dist > 0 && dist <= 6) {
        // Kiểm tra xem Pacman đang đi hướng RA XA khỏi tâm hay không
        let isMovingAway =
          (this.dx > 0 && this.x > centerX) ||
          (this.dx < 0 && this.x < centerX) ||
          (this.dy > 0 && this.y > centerY) ||
          (this.dy < 0 && this.y < centerY);

        // TH 1: Người chơi thả tay (phanh) hơi muộn khi lố qua ngã tư -> Hút giật lùi về tâm và phanh
        if (!activeKey && isMovingAway) {
          this.x = centerX;
          this.y = centerY;
          this.dx = 0;
          this.dy = 0;
        }
        // TH 2: Bấm rẽ lúc chưa tới hoặc lố qua tâm -> Hút vào tâm và bẻ lái ngay lập tức
        else if (activeKey && (qDx !== this.dx || qDy !== this.dy)) {
          if (qDx !== -this.dx && qDy !== -this.dy) {
            // Loại trừ quay đầu
            if (isWalkable(gridX + qDx, gridY + qDy)) {
              this.x = centerX;
              this.y = centerY;
              this.dx = qDx;
              this.dy = qDy;
            }
          }
        }
      }
    }

    // 2. Cho phép quay đầu xe (U-turn) lập tức bất cứ lúc nào
    if (activeKey) {
      if (qDx === -this.dx && this.dx !== 0) {
        this.dx = qDx;
        this.dy = 0;
      } else if (qDy === -this.dy && this.dy !== 0) {
        this.dx = 0;
        this.dy = qDy;
      }
    }

    // 3. Logic lõi khi đi tới ĐÚNG TÂM của một ô
    if (this.x % SIZE === 0 && this.y % SIZE === 0) {
      let gridX = this.x / SIZE;
      let gridY = this.y / SIZE;

      if (activeKey) {
        // Cố gắng rẽ
        if (isWalkable(gridX + qDx, gridY + qDy)) {
          this.dx = qDx;
          this.dy = qDy;
        }
        // Nếu rẽ đâm tường, thử đi thẳng xem có vướng không
        else if (!isWalkable(gridX + this.dx, gridY + this.dy)) {
          this.dx = 0;
          this.dy = 0;
        }
      } else {
        // Không giữ phím nào -> Phanh lại chuẩn xác
        this.dx = 0;
        this.dy = 0;
      }
    }

    // 4. Cập nhật tọa độ di chuyển
    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;

    // 5. Tính năng xuyên hầm ở rìa bản đồ
    if (this.x < -SIZE) this.x = canvas.width;
    if (this.x > canvas.width) this.x = -SIZE;
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
    this.speed = 1;
    this.dx = 0;
    this.dy = -1;
    this.isDead = false;
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
        this.dx = 0;
        this.dy = -1;
      }
      return;
    }

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

      if (scaredModeTimer === 0) {
        let losDir = checkLineOfSight(gridX, gridY, pacX, pacY);
        if (losDir) {
          this.dx = losDir.dx;
          this.dy = losDir.dy;
          isChasing = true;
        }
      }

      if (!isChasing) {
        if (validMoves.length > 0) {
          let move = validMoves[Math.floor(Math.random() * validMoves.length)];
          this.dx = move.dx;
          this.dy = move.dy;
        } else {
          this.dx = 0;
          this.dy = 0;
        }
      }
    }

    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;
    if (this.x < -SIZE) this.x = canvas.width;
    if (this.x > canvas.width) this.x = -SIZE;
  }

  draw() {
    let x = this.x + SIZE / 2;
    let y = this.y + SIZE / 2;
    let r = SIZE / 2 - 2;
    let color = this.color;

    if (this.isDead) color = "transparent";
    else if (scaredModeTimer > 0)
      color =
        scaredModeTimer < 100 && Math.floor(Date.now() / 200) % 2 === 0
          ? "white"
          : "#0033ff";

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
    ctx.fillStyle = scaredModeTimer > 0 && !this.isDead ? "red" : "blue";
    ctx.beginPath();
    ctx.arc(x - 3 + this.dx, y - 2 + this.dy, 1.5, 0, Math.PI * 2);
    ctx.arc(x + 3 + this.dx, y - 2 + this.dy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initLevel() {
  map = JSON.parse(JSON.stringify(BASE_MAP));
  remainingPellets = 0;
  for (let r = 0; r < map.length; r++) {
    for (let c = 0; c < map[0].length; c++) {
      if (map[r][c] === 0 || map[r][c] === 2) remainingPellets++;
    }
  }
  pacman = new Pacman();
  ghosts = [
    new Ghost(10, 9, "red"),
    new Ghost(9, 9, "pink"),
    new Ghost(11, 9, "cyan"),
    new Ghost(10, 8, "orange"),
  ];
  keysDown = [];
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

function handleLogic() {
  let gridX = Math.round(pacman.x / SIZE);
  let gridY = Math.round(pacman.y / SIZE);

  if (map[gridY] && map[gridY][gridX] === 0) {
    map[gridY][gridX] = 3;
    updateScore(10);
    remainingPellets--;
    chompSound.currentTime = 0;
    chompSound.play();
  } else if (map[gridY] && map[gridY][gridX] === 2) {
    map[gridY][gridX] = 3;
    updateScore(50);
    scaredModeTimer = 350;
    remainingPellets--;
    powerSound.currentTime = 0;
    powerSound.play();
  }

  if (scaredModeTimer > 0) scaredModeTimer--;

  if (remainingPellets === 0) {
    initLevel();
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
  pacman.draw();
  ghosts.forEach((g) => g.draw());

  requestAnimationFrame(gameLoop);
}

initLevel();
requestAnimationFrame(gameLoop);
