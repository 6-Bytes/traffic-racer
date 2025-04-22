// F1-Style Game with Brakes and Non-overlapping Opponents
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const car = {
  x: 200,
  y: 500,
  width: 40,
  height: 60,
  speed: 0,
  maxSpeed: 8,
  accel: 0.05,
  brake: 0.2,
  angle: 0,
};

let isPaused = false;

const keys = {
  left: false,
  right: false,
  down: false,
};

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") keys.left = true;
  if (e.key === "ArrowRight") keys.right = true;
  if (e.key === "ArrowDown") keys.down = true;
  if (e.key === "p" || e.key === "P") isPaused = !isPaused;
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
  if (e.key === "ArrowDown") keys.down = false;
});

const opponents = [];
const totalOpponents = 20;

function isColliding(rect1, rect2) {
  return !(
    rect1.x > rect2.x + rect2.width ||
    rect1.x + rect1.width < rect2.x ||
    rect1.y > rect2.y + rect2.height ||
    rect1.y + rect1.height < rect2.y
  );
}

function spawnOpponentCar() {
  if (opponents.length >= totalOpponents) return;
  const width = 40;
  const height = 60;
  let tries = 0;
  while (tries < 20) {
    const x = Math.random() * (canvas.width - width);
    const y = -100;
    const newCar = { x, y, width, height, speed: car.speed * 0.6 + 1, color: "blue" };
    if (!opponents.some(ob => isColliding(newCar, ob))) {
      opponents.push(newCar);
      break;
    }
    tries++;
  }
}

function resetGame() {
  car.x = 200;
  car.y = 500;
  car.speed = 0;
  car.angle = 0;
  opponents.length = 0;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTrackBorders();
  drawCar(car, true);
}

function update() {
  // Auto-acceleration and brake
  if (keys.down) {
    car.speed -= car.brake;
    if (car.speed < 0) car.speed = 0;
  } else if (car.speed < car.maxSpeed) {
    car.speed += car.accel;
  }

  // Steering and tilt
  if (keys.left) {
    car.x -= 5;
    car.angle = Math.max(car.angle - 2, -20);
  } else if (keys.right) {
    car.x += 5;
    car.angle = Math.min(car.angle + 2, 20);
  } else {
    car.angle *= 0.9;
  }

  if (car.x < 0) car.x = 0;
  if (car.x + car.width > canvas.width) car.x = canvas.width - car.width;

  opponents.forEach(op => {
    op.y += op.speed;
  });

  // Remove off-screen cars
  for (let i = opponents.length - 1; i >= 0; i--) {
    if (opponents[i].y > canvas.height) {
      opponents.splice(i, 1);
    }
  }

  // Spawn opponents
  if (Math.random() < 0.03) {
    spawnOpponentCar();
  }

  // Collision detection
  for (const ob of opponents) {
    if (isColliding(car, ob)) {
      alert("💥 Crash! Game Over");
      resetGame();
    }
  }
}

function drawCar(obj, isPlayer = false) {
  ctx.save();
  ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
  if (isPlayer) {
    ctx.rotate((obj.angle * Math.PI) / 180);
  }
  ctx.fillStyle = obj.color || "red";
  ctx.fillRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);
  ctx.restore();
}

function drawTrackBorders() {
  ctx.fillStyle = "gray";
  ctx.fillRect(0, 0, 10, canvas.height); // left wall
  ctx.fillRect(canvas.width - 10, 0, 10, canvas.height); // right wall

  ctx.fillStyle = "white";
  ctx.font = "14px sans-serif";
  ctx.fillText("🏁 Sponsor A", 15, 50);
  ctx.fillText("🏎 Sponsor B", canvas.width - 100, 100);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!isPaused) {
    update();
  }

  drawTrackBorders();
  opponents.forEach(op => drawCar(op));
  drawCar(car, true);

  if (isPaused) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "32px sans-serif";
    ctx.fillText("⏸ Paused", canvas.width / 2 - 70, canvas.height / 2);
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();

const pauseBtn = document.getElementById("pauseBtn");
pauseBtn.addEventListener("click", () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "▶️ Resume" : "⏸ Pause";
});
