const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// === Game State ===
let gameRunning = true;
let gameOver = false;
let musicPlaying = true;
let gameTime = 0; // Time in seconds
let lastTimestamp = 0;

// === Audio Setup ===
const bgMusic = document.getElementById("bg-music");
bgMusic.volume = 1; // Set default volume to 100%

// === Car Setup ===
const car = {
  x: 200,
  y: 400, // Car is fixed vertically
  width: 40,
  height: 60,
  speed: 0,
  maxSpeed: 8,
  accel: 0.05,
  brake: 0.2,
  angle: 0,
  color: "red"
};

// === Input Keys ===
const keys = { left: false, right: false, down: false };
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") keys.left = true;
  if (e.key === "ArrowRight") keys.right = true;
  if (e.key === "ArrowDown") keys.down = true;
  
  // Pause controls
  if (e.key === "p" || e.key === "P" || e.key === " ") {
    togglePause();
    // Prevent page scrolling when using spacebar
    if (e.key === " ") e.preventDefault();
  }
  
  // Music controls
  if (e.key === "m" || e.key === "M") {
    toggleMusic();
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
  if (e.key === "ArrowDown") keys.down = false;
});

// === Pause Button ===
const pauseBtn = document.getElementById("pauseBtn");
pauseBtn.addEventListener("click", togglePause);

// === Music Button ===
const musicBtn = document.getElementById("musicBtn");
musicBtn.addEventListener("click", toggleMusic);

function togglePause() {
  gameRunning = !gameRunning;
  pauseBtn.textContent = gameRunning ? "â¸ Pause" : "â–¶ Resume";
  
  // Update last timestamp when resuming to prevent large time jumps
  if (gameRunning) {
    lastTimestamp = performance.now();
  }
}

function toggleMusic() {
  if (musicPlaying) {
    bgMusic.pause();
    musicBtn.textContent = "ðŸ”ˆ Music Off";
  } else {
    bgMusic.play();
    musicBtn.textContent = "ðŸ”Š Music On";
  }
  musicPlaying = !musicPlaying;
}

// === Opponent Cars ===
const opponents = [];
const totalOpponents = 20;
const carColors = ["blue", "green", "purple", "orange", "cyan"];

// === Score and Distance Tracking ===
let score = 0;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;
let distance = 0; // Distance in game units
let distanceMiles = 0; // Distance in miles (for display)
const distanceConversion = 0.02; // Convert game units to miles

// === Road Lines ===
const roadLines = [];
const lineSpacing = 40;
for (let i = 0; i < canvas.height / lineSpacing + 1; i++) {
  roadLines.push({ y: i * lineSpacing });
}

// === Sound Effects ===
const crashSound = new Audio();
crashSound.src = "crash.mp3"; // Make sure to have this file
crashSound.volume = 0.7;

const engineSound = new Audio();
engineSound.src = "engine.mp3"; // Make sure to have this file
engineSound.loop = true;
engineSound.volume = 0.2;

// Create a milestone tracking system
const milestones = {
  checkpoints: [1, 5, 10, 25, 50, 100],
  lastAchieved: 0
};

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function isColliding(a, b) {
  return !(
    a.x > b.x + b.width ||
    a.x + a.width < b.x ||
    a.y > b.y + b.height ||
    a.y + a.height < b.y
  );
}

function initOpponents() {
  // Clear existing opponents
  opponents.length = 0;
  
  // Generate the initial set of opponent cars
  for (let i = 0; i < totalOpponents; i++) {
    spawnOpponentCar();
  }
}

function spawnOpponentCar() {
  if (opponents.length >= totalOpponents) return;
  
  const width = 40, height = 60;
  let tries = 0;
  
  while (tries < 20) {
    // Distribute cars throughout the track
    const x = Math.random() * (canvas.width - width - 20) + 10;
    
    // Place them at different distances ahead
    const y = Math.random() * -canvas.height * 5;
    
    // Varying speeds, but always slower than player's max speed
    const opSpeed = 2 + Math.random() * 4;
    
    // Random car color from the palette
    const color = carColors[Math.floor(Math.random() * carColors.length)];
    
    const newCar = { x, y, width, height, speed: opSpeed, color };
    
    // Check for collisions with existing cars
    if (!opponents.some(ob => isColliding(newCar, ob))) {
      opponents.push(newCar);
      break;
    }
    tries++;
  }
}

function checkMilestones() {
  const nextMilestone = milestones.checkpoints.find(m => 
    distanceMiles >= m && m > milestones.lastAchieved
  );
  
  if (nextMilestone) {
    // We still track milestones for score purposes but don't show the banner
    milestones.lastAchieved = nextMilestone;
    
    // Give bonus points for reaching milestone
    score += nextMilestone * 100;
  }
}

function resetGame() {
  car.x = 200;
  car.speed = 0;
  car.angle = 0;
  
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
  
  score = 0;
  distance = 0;
  distanceMiles = 0;
  gameTime = 0;
  milestones.lastAchieved = 0;
  gameOver = false;
  
  // Reset last timestamp
  lastTimestamp = performance.now();
  
  // Initialize opponent cars
  initOpponents();
  
  // Resume engine sound if music is on
  if (musicPlaying) {
    engineSound.play();
  }
}

function update(timestamp) {
  // Update game time if game is running
  if (gameRunning && !gameOver) {
    if (lastTimestamp) {
      const deltaTime = (timestamp - lastTimestamp) / 1000; // Convert to seconds
      gameTime += deltaTime;
    }
    lastTimestamp = timestamp;
  }
  
  if (!gameRunning || gameOver) {
    // Pause engine sound when game is not running
    engineSound.pause();
    return;
  } else if (musicPlaying) {
    // Play engine sound when game is running and music is on
    engineSound.play();
  }

  // Adjust engine sound based on speed
  engineSound.playbackRate = 0.5 + (car.speed / car.maxSpeed);

  // Auto-acceleration and brakes
  if (keys.down) {
    car.speed -= car.brake;
    if (car.speed < 0) car.speed = 0;
  } else if (car.speed < car.maxSpeed) {
    car.speed += car.accel;
  }

  // Movement
  if (keys.left) {
    car.x -= 5;
    car.angle = Math.max(car.angle - 2, -20);
  } else if (keys.right) {
    car.x += 5;
    car.angle = Math.min(car.angle + 2, 20);
  } else {
    car.angle *= 0.9; // Return to center gradually
  }

  // Boundaries
  if (car.x < 10) car.x = 10;
  if (car.x + car.width > canvas.width - 10) car.x = canvas.width - 10 - car.width;

  // Update total distance traveled
  distance += car.speed;
  distanceMiles = distance * distanceConversion;
  
  // Check if we've hit any milestones
  checkMilestones();

  // Opponents relative movement - they move at their own pace
  opponents.forEach(op => {
    // The relative movement is the difference between the player's speed and opponent's speed
    op.y += (car.speed - op.speed);
    
    // If an opponent goes off-screen, reposition it ahead
    if (op.y > canvas.height) {
      // Instead of removing cars as they leave the viewport, 
      // we'll handle rear-end collisions by checking for cars behind the player
      
      // Only reposition cars if they're a certain distance behind the player
      // This allows for rear-end collisions if player slows down suddenly
      if (op.y > canvas.height + 300) {
        op.y = -op.height - Math.random() * canvas.height;
        op.x = Math.random() * (canvas.width - op.width - 20) + 10;
      }
    }
    
    // If an opponent goes too far up, reposition it to maintain the pool of cars
    if (op.y < -canvas.height * 2) {
      op.y = -op.height - Math.random() * 300;
      op.x = Math.random() * (canvas.width - op.width - 20) + 10;
    }
  });

  // Update score based on speed
  score += Math.floor(car.speed);

  // Move road lines
  roadLines.forEach(line => {
    line.y += car.speed;
    if (line.y > canvas.height) line.y -= canvas.height;
  });

  // Collision check
  for (const op of opponents) {
    if (isColliding(car, op)) {
      gameOver = true;
      
      // Play crash sound if music is on
      if (musicPlaying) {
        crashSound.play();
        engineSound.pause();
      }
      
      setTimeout(() => {
        alert(`ðŸ’¥ Crash! Score: ${score.toLocaleString()}\nDistance: ${distanceMiles.toFixed(1)} miles\nTime: ${formatTime(gameTime)}`);
        resetGame();
      }, 500);
      break;
    }
  }
}

function drawCar(obj, isPlayer = false) {
  ctx.save();
  ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
  
  if (isPlayer) {
    ctx.rotate((obj.angle * Math.PI) / 180);
  }
  
  // Car body
  ctx.fillStyle = obj.color;
  ctx.fillRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);
  
  // Car details - windshield
  ctx.fillStyle = "#222";
  ctx.fillRect(-obj.width / 4, -obj.height / 2 + 5, obj.width / 2, obj.height / 4);
  
  // Wheels
  ctx.fillStyle = "#111";
  // Front wheels
  ctx.fillRect(-obj.width / 2 - 3, -obj.height / 2 + 10, 5, 10);
  ctx.fillRect(obj.width / 2 - 2, -obj.height / 2 + 10, 5, 10);
  // Rear wheels
  ctx.fillRect(-obj.width / 2 - 3, obj.height / 2 - 20, 5, 10);
  ctx.fillRect(obj.width / 2 - 2, obj.height / 2 - 20, 5, 10);
  
  ctx.restore();
}

function drawTrackBorders() {
  // Road background
  ctx.fillStyle = "#333";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Roadside walls with texture
  const wallGradient = ctx.createLinearGradient(0, 0, 10, 0);
  wallGradient.addColorStop(0, "#555");
  wallGradient.addColorStop(1, "#777");
  
  ctx.fillStyle = wallGradient;
  ctx.fillRect(0, 0, 10, canvas.height);
  ctx.fillRect(canvas.width - 10, 0, 10, canvas.height);

  // Center dashed line
  ctx.fillStyle = "yellow";
  roadLines.forEach(line => {
    ctx.fillRect(canvas.width / 2 - 2, line.y, 4, 20);
  });
  
  // Side lane markings
  ctx.fillStyle = "white";
  roadLines.forEach(line => {
    // Left lane
    ctx.fillRect(canvas.width / 4 - 1, line.y, 2, 15);
    // Right lane
    ctx.fillRect(canvas.width * 3/4 - 1, line.y, 2, 15);
  });

  // Draw distance markers on the side
  ctx.fillStyle = "white";
  ctx.font = "10px Arial";
  
  // Display mile markers every 1 mile
  const currentMile = Math.floor(distanceMiles);
  const markerOffset = (distanceMiles - currentMile) * canvas.height;
  
  for (let i = 0; i < 5; i++) {
    const y = canvas.height - markerOffset - (i * canvas.height);
    if (y > -20 && y < canvas.height) {
      ctx.fillText(`${currentMile + i} mi`, canvas.width - 35, y);
      // Draw a small marker line
      ctx.fillRect(canvas.width - 40, y - 1, 5, 2);
    }
  }
}

function drawHUD() {
  // Top panel with gradient
  const hudGradient = ctx.createLinearGradient(0, 0, 0, 70);
  hudGradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
  hudGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  
  ctx.fillStyle = hudGradient;
  ctx.fillRect(0, 0, canvas.width, 70);
  
  // Score
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText(`Score: ${score.toLocaleString()}`, 15, 20);
  
  // High Score
  ctx.fillText(`Best: ${highScore.toLocaleString()}`, canvas.width - 120, 20);
  
  // Timer display
  ctx.fillStyle = "#FF9";
  ctx.font = "16px Arial";
  ctx.fillText(`Time: ${formatTime(gameTime)}`, 15, 45);
  
  // Distance display
  ctx.fillText(`Distance: ${distanceMiles.toFixed(1)} mi`, canvas.width - 150, 45);
  
  // Speed indicator
  ctx.fillStyle = "#0f0";
  ctx.fillText(`Speed: ${Math.floor(car.speed * 30)} mph`, canvas.width / 2 - 50, 25);
  
  // Music state indicator (small icon)
  ctx.fillStyle = musicPlaying ? "#0f0" : "#f00";
  ctx.fillText(musicPlaying ? "ðŸ”Š" : "ðŸ”ˆ", canvas.width - 30, 25);
  
  // Instruction if game is paused
  if (!gameRunning) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = "16px Arial";
    ctx.fillText("Press SPACE or P to resume", canvas.width / 2, canvas.height / 2);
    ctx.fillText("M to toggle music", canvas.width / 2, canvas.height / 2 + 30);
    
    // Show current stats
    ctx.fillStyle = "#AAA";
    ctx.fillText(`Time: ${formatTime(gameTime)}`, canvas.width / 2, canvas.height / 2 + 70);
    ctx.fillText(`Distance: ${distanceMiles.toFixed(1)} miles`, canvas.width / 2, canvas.height / 2 + 90);
    ctx.textAlign = "left";
  }
  
  // Game over state
  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "red";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 70);
    
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText(`Score: ${score.toLocaleString()}`, canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText(`Distance: ${distanceMiles.toFixed(1)} miles`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Time: ${formatTime(gameTime)}`, canvas.width / 2, canvas.height / 2 + 30);
    
    // Calculate average speed
    const avgSpeed = distanceMiles > 0 && gameTime > 0 
      ? (distanceMiles / (gameTime / 3600)).toFixed(1) 
      : 0;
    ctx.fillText(`Average Speed: ${avgSpeed} mph`, canvas.width / 2, canvas.height / 2 + 60);
    
    ctx.textAlign = "left";
  }
}

function gameLoop(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  drawTrackBorders();
  
  // Draw opponent cars
  opponents.forEach(op => drawCar(op));
  
  // Draw player car
  drawCar(car, true);
  
  // Draw HUD on top
  drawHUD();
  
  // Update game state
  update(timestamp);
  
  requestAnimationFrame(gameLoop);
}

// Initialize game and start music
bgMusic.play().catch(e => {
  console.log("Audio couldn't autoplay. User interaction needed:", e);
});
engineSound.play().catch(e => {
  console.log("Engine sound couldn't autoplay. User interaction needed:", e);
});

// Initialize timestamp
lastTimestamp = performance.now();

initOpponents();
requestAnimationFrame(gameLoop);
