/* EcoDash - educational delivery simulation.
   Built with vanilla JavaScript and HTML5 Canvas. */

"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  overlay: document.getElementById("overlay"),
  overlayTitle: document.getElementById("overlayTitle"),
  overlayText: document.getElementById("overlayText"),
  startButton: document.getElementById("startButton"),
  pauseButton: document.getElementById("pauseButton"),
  restartButton: document.getElementById("restartButton"),
  clearScoresButton: document.getElementById("clearScoresButton"),
  statusText: document.getElementById("statusText"),
  statusDot: document.getElementById("statusDot"),
  scoreValue: document.getElementById("scoreValue"),
  distanceValue: document.getElementById("distanceValue"),
  bestValue: document.getElementById("bestValue"),
  efficiencyValue: document.getElementById("efficiencyValue"),
  batteryText: document.getElementById("batteryText"),
  batteryBar: document.getElementById("batteryBar"),
  message: document.getElementById("message")
};

const WORLD = { width: canvas.width, height: canvas.height };
const keysPressed = new Set();
const SAVE_KEY = "ecodashBestScore";

const game = {
  state: "ready", // ready, playing, paused, won, lost
  score: 0,
  distance: 0,
  battery: 100,
  energyUsed: 0,
  delivered: false,
  blackout: false,
  elapsed: 0,
  lastTime: 0,
  blackoutClock: 0
};

class DeliveryVehicle {
  constructor() {
    this.x = 105;
    this.y = 425;
    this.width = 34;
    this.height = 24;
    this.vx = 0;
    this.vy = 0;
    this.acceleration = 0.16;
    this.maxSpeed = 2.8;
    this.drag = 0.965;
    this.angle = 0;
  }

  update(deltaScale) {
    let ax = 0;
    let ay = 0;
    if (keysPressed.has("ArrowUp") || keysPressed.has("w")) ay -= this.acceleration;
    if (keysPressed.has("ArrowDown") || keysPressed.has("s")) ay += this.acceleration;
    if (keysPressed.has("ArrowLeft") || keysPressed.has("a")) ax -= this.acceleration;
    if (keysPressed.has("ArrowRight") || keysPressed.has("d")) ax += this.acceleration;

    // Acceleration changes velocity; drag gradually slows the vehicle.
    this.vx = (this.vx + ax * deltaScale) * this.drag;
    this.vy = (this.vy + ay * deltaScale) * this.drag;

    // Limit diagonal speed so diagonal movement is not faster.
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }

    const oldX = this.x;
    const oldY = this.y;
    this.x = Math.max(20, Math.min(WORLD.width - 20, this.x + this.vx * deltaScale));
    this.y = Math.max(80, Math.min(WORLD.height - 20, this.y + this.vy * deltaScale));

    const moved = Math.hypot(this.x - oldX, this.y - oldY);
    game.distance += moved * 0.12;
    game.battery = Math.max(0, game.battery - moved * 0.0032);
    game.energyUsed += moved * 0.0032;

    if (Math.hypot(this.vx, this.vy) > 0.08) {
      this.angle = Math.atan2(this.vy, this.vx);
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    // Vehicle body and cabin are drawn directly on Canvas.
    ctx.fillStyle = "#174b36";
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.fillStyle = "#d9ef7a";
    ctx.fillRect(-3, -this.height / 2 + 3, 11, this.height - 6);
    ctx.fillStyle = "#f7f5e8";
    ctx.fillRect(this.width / 2 - 4, -this.height / 2 + 4, 4, 5);
    ctx.fillRect(this.width / 2 - 4, this.height / 2 - 9, 4, 5);
    ctx.restore();
  }

  reset() {
    this.x = 105; this.y = 425; this.vx = 0; this.vy = 0; this.angle = 0;
  }
}

const vehicle = new DeliveryVehicle();

const hazards = [
  { x: 250, y: 345, r: 22, type: "pothole" },
  { x: 375, y: 220, r: 25, type: "pothole" },
  { x: 520, y: 360, r: 24, type: "fallen tree" },
  { x: 665, y: 245, r: 22, type: "pothole" },
  { x: 760, y: 385, r: 20, type: "pothole" }
];

const solarZone = { x: 410, y: 90, width: 115, height: 75 };
const clinic = { x: 835, y: 110, width: 70, height: 60 };

function drawBackground() {
  ctx.fillStyle = "#dce8c6";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  // Stylised African landscape: dry grass patches and acacia-like trees.
  for (let i = 0; i < 26; i++) {
    const x = (i * 137 + 33) % WORLD.width;
    const y = (i * 79 + 25) % WORLD.height;
    ctx.fillStyle = i % 2 ? "#c8d8ad" : "#e9e3b5";
    ctx.beginPath(); ctx.ellipse(x, y, 18, 8, 0.4, 0, Math.PI * 2); ctx.fill();
  }
  drawRoad(35, 455, 285, 330);
  drawRoad(285, 330, 450, 300);
  drawRoad(450, 300, 620, 200);
  drawRoad(620, 200, 865, 140);

  // Decorative acacia trees.
  [[170,160],[310,125],[585,425],[715,95],[890,350],[115,290]].forEach(([x,y]) => {
    ctx.fillStyle = "#7a5736";
    ctx.fillRect(x - 3, y, 6, 17);
    ctx.fillStyle = "#47764b";
    ctx.beginPath(); ctx.ellipse(x, y, 22, 11, 0, 0, Math.PI * 2); ctx.fill();
  });
  ctx.fillStyle = "#5d4b2f";
  ctx.font = "bold 12px Arial";
  ctx.fillText("RURAL ROUTE", 45, 490);
}

function drawRoad(x1, y1, x2, y2) {
  ctx.lineCap = "round";
  ctx.strokeStyle = "#b9a77e";
  ctx.lineWidth = 52;
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.strokeStyle = "#e6d5a5";
  ctx.lineWidth = 3;
  ctx.setLineDash([13, 13]);
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.setLineDash([]);
}

function drawSolarZone() {
  ctx.save();
  ctx.fillStyle = game.blackout ? "rgba(170,90,64,.85)" : "rgba(242,193,78,.82)";
  ctx.fillRect(solarZone.x, solarZone.y, solarZone.width, solarZone.height);
  ctx.strokeStyle = game.blackout ? "#a73f35" : "#946b16";
  ctx.lineWidth = 3;
  ctx.strokeRect(solarZone.x, solarZone.y, solarZone.width, solarZone.height);
  ctx.fillStyle = "#263b2e";
  ctx.font = "bold 12px Arial";
  ctx.fillText(game.blackout ? "GRID OFF" : "SOLAR CHARGE", solarZone.x + 10, solarZone.y + 18);
  // Simple solar panel shapes.
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = "#386d8d";
    ctx.fillRect(solarZone.x + 12 + i * 30, solarZone.y + 29, 24, 22);
    ctx.strokeStyle = "#b9d8e5";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(solarZone.x + 24 + i * 30, solarZone.y + 29); ctx.lineTo(solarZone.x + 24 + i * 30, solarZone.y + 51); ctx.stroke();
  }
  ctx.restore();
}

function drawClinic() {
  ctx.fillStyle = "#f7f5e8";
  ctx.fillRect(clinic.x, clinic.y, clinic.width, clinic.height);
  ctx.strokeStyle = "#3c8c64"; ctx.lineWidth = 4; ctx.strokeRect(clinic.x, clinic.y, clinic.width, clinic.height);
  ctx.fillStyle = "#3c8c64"; ctx.fillRect(clinic.x + 29, clinic.y + 12, 12, 35); ctx.fillRect(clinic.x + 18, clinic.y + 23, 34, 12);
  ctx.fillStyle = "#174b36"; ctx.font = "bold 12px Arial"; ctx.fillText("CLINIC", clinic.x + 12, clinic.y + 55);
}

function drawHazards() {
  hazards.forEach((hazard) => {
    ctx.fillStyle = hazard.type === "fallen tree" ? "#68472e" : "#8b4a3e";
    ctx.beginPath(); ctx.arc(hazard.x, hazard.y, hazard.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#d6c9a4";
    ctx.beginPath(); ctx.arc(hazard.x - 5, hazard.y - 4, hazard.r * .35, 0, Math.PI * 2); ctx.fill();
    if (hazard.type === "fallen tree") {
      ctx.strokeStyle = "#8c633d"; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(hazard.x - 17, hazard.y + 13); ctx.lineTo(hazard.x + 16, hazard.y - 13); ctx.stroke();
    }
  });
}

function drawHudOnCanvas() {
  ctx.fillStyle = "rgba(23,35,30,.82)";
  ctx.fillRect(16, 16, 210, 48);
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 14px Arial";
  ctx.fillText(`MISSION SCORE: ${Math.round(game.score)}`, 28, 36);
  ctx.fillStyle = "#d9ef7a"; ctx.font = "12px Arial";
  ctx.fillText(`BATTERY: ${Math.round(game.battery)}%`, 28, 53);
}

function drawScene() {
  drawBackground();
  drawSolarZone();
  drawClinic();
  drawHazards();
  vehicle.draw();
  drawHudOnCanvas();

  if (game.blackout) {
    ctx.fillStyle = "rgba(30,35,38,.18)";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.fillStyle = "#7b2e26"; ctx.font = "bold 16px Arial";
    ctx.fillText("SIMULATED LOAD-SHEDDING: SOLAR STATION UNAVAILABLE", 255, 35);
  }
}

function circlesOverlap(x1, y1, r1, x2, y2, r2) {
  // Circle collision: compare centre distance with the sum of radii.
  return Math.hypot(x1 - x2, y1 - y2) < r1 + r2;
}

function vehicleTouchesRectangle(rect) {
  // Axis-aligned bounding-box (AABB) collision detection.
  const left = vehicle.x - vehicle.width / 2;
  const right = vehicle.x + vehicle.width / 2;
  const top = vehicle.y - vehicle.height / 2;
  const bottom = vehicle.y + vehicle.height / 2;
  return left < rect.x + rect.width && right > rect.x &&
         top < rect.y + rect.height && bottom > rect.y;
}

function updateGame(deltaScale) {
  if (game.state !== "playing") return;

  game.elapsed += deltaScale;
  game.blackoutClock += deltaScale;
  if (game.blackoutClock > 600) {
    game.blackout = !game.blackout;
    game.blackoutClock = 0;
    ui.message.textContent = game.blackout
      ? "Load-shedding has disabled the charging station. Plan your route carefully."
      : "Solar microgrid restored. You can recharge in the marked zone.";
  }

  const previousX = vehicle.x;
  const previousY = vehicle.y;
  vehicle.update(deltaScale);

  hazards.forEach((hazard) => {
    if (circlesOverlap(vehicle.x, vehicle.y, 13, hazard.x, hazard.y, hazard.r)) {
      vehicle.x = previousX;
      vehicle.y = previousY;
      vehicle.vx *= -0.45;
      vehicle.vy *= -0.45;
      game.score = Math.max(0, game.score - 5);
      ui.message.textContent = `Collision with ${hazard.type}! -5 points. Find a safer route.`;
    }
  });

  if (vehicleTouchesRectangle(solarZone) && !game.blackout) {
    game.battery = Math.min(100, game.battery + 0.13 * deltaScale);
    ui.message.textContent = "Charging from the solar microgrid.";
  }

  if (vehicleTouchesRectangle(clinic) && !game.delivered) {
    game.delivered = true;
    game.score += Math.max(50, 150 - Math.round(game.distance / 2));
    game.state = "won";
    finishGame(true);
  }

  if (game.battery <= 0) {
    game.state = "lost";
    finishGame(false);
  } else {
    game.score += 0.015 * deltaScale;
  }
}

function getBestScore() {
  try { return Number(localStorage.getItem(SAVE_KEY) || 0); }
  catch (error) { return 0; }
}

function saveBestScore() {
  try {
    if (game.score > getBestScore()) localStorage.setItem(SAVE_KEY, String(Math.round(game.score)));
  } catch (error) {
    ui.message.textContent = "This browser blocked local storage, so the best score could not be saved.";
  }
}

function finishGame(won) {
  if (won) saveBestScore();
  game.state = won ? "won" : "lost";
  ui.pauseButton.disabled = true;
  ui.statusText.textContent = won ? "Delivery complete" : "Battery depleted";
  ui.statusDot.style.background = won ? "#5d9b55" : "#c64c40";
  ui.overlay.classList.remove("hidden");
  ui.overlayTitle.textContent = won ? "Medical supplies delivered!" : "Mission ended";
  ui.overlayText.textContent = won
    ? `Great work. You travelled ${Math.round(game.distance)} m and earned ${Math.round(game.score)} points.`
    : "Your battery ran out before the delivery. Restart and use the solar zone to recharge.";
  ui.startButton.textContent = "Play again";
  ui.message.textContent = won ? "Mission successful. Your best score is saved on this device." : "Try another route and recharge before the battery runs out.";
  updateStats();
}

function updateStats() {
  ui.scoreValue.textContent = Math.round(game.score);
  ui.distanceValue.textContent = Math.round(game.distance);
  ui.bestValue.textContent = getBestScore();
  const efficiency = game.energyUsed <= 0 ? 100 : Math.max(0, Math.round(100 - game.energyUsed * 1.8));
  ui.efficiencyValue.textContent = `${efficiency}%`;
  ui.batteryText.textContent = `${Math.round(game.battery)}%`;
  ui.batteryBar.style.width = `${game.battery}%`;
  ui.batteryBar.style.background = game.battery < 25 ? "#c64c40" : game.battery < 50 ? "#e3a637" : "#5d9b55";
}

function resetGame() {
  game.state = "ready";
  game.score = 0;
  game.distance = 0;
  game.battery = 100;
  game.energyUsed = 0;
  game.delivered = false;
  game.blackout = false;
  game.elapsed = 0;
  game.blackoutClock = 0;
  vehicle.reset();
  keysPressed.clear();
  ui.overlay.classList.remove("hidden");
  ui.overlayTitle.textContent = "Deliver the medical supplies";
  ui.overlayText.textContent = "Drive to the clinic. Avoid road hazards and use the solar station to recharge.";
  ui.startButton.textContent = "Start mission";
  ui.pauseButton.disabled = true;
  ui.pauseButton.textContent = "Pause";
  ui.statusText.textContent = "Ready";
  ui.statusDot.style.background = "#f2c14e";
  ui.message.textContent = "Start the mission when ready.";
  updateStats();
}

function startGame() {
  if (game.state === "won" || game.state === "lost") resetGame();
  game.state = "playing";
  ui.overlay.classList.add("hidden");
  ui.pauseButton.disabled = false;
  ui.statusText.textContent = "In progress";
  ui.statusDot.style.background = "#5d9b55";
  ui.message.textContent = "Deliver the package and watch your battery.";
}

function togglePause() {
  if (game.state === "playing") {
    game.state = "paused";
    ui.overlay.classList.remove("hidden");
    ui.overlayTitle.textContent = "Mission paused";
    ui.overlayText.textContent = "Take a moment to plan your route. Press Resume when you are ready.";
    ui.startButton.textContent = "Resume";
    ui.pauseButton.textContent = "Resume";
    ui.statusText.textContent = "Paused";
  } else if (game.state === "paused") {
    game.state = "playing";
    ui.overlay.classList.add("hidden");
    ui.startButton.textContent = "Start mission";
    ui.pauseButton.textContent = "Pause";
    ui.statusText.textContent = "In progress";
  }
}

ui.startButton.addEventListener("click", () => {
  if (game.state === "paused") togglePause();
  else startGame();
});
ui.pauseButton.addEventListener("click", togglePause);
ui.restartButton.addEventListener("click", resetGame);
ui.clearScoresButton.addEventListener("click", () => {
  try { localStorage.removeItem(SAVE_KEY); } catch (error) { /* storage may be disabled */ }
  updateStats();
  ui.message.textContent = "Saved best score cleared.";
});

window.addEventListener("keydown", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
  if (key === "p") togglePause();
  keysPressed.add(key);
});
window.addEventListener("keyup", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keysPressed.delete(key);
});
window.addEventListener("blur", () => keysPressed.clear());

function animationLoop(timestamp) {
  const deltaScale = game.lastTime ? Math.min((timestamp - game.lastTime) / 16.67, 2.5) : 1;
  game.lastTime = timestamp;
  updateGame(deltaScale);
  drawScene();
  updateStats();
  requestAnimationFrame(animationLoop);
}

// STUDENT ORIGINAL FEATURE (must be implemented independently without Generative AI):
// Add a day/night cycle here. Suggested approach: create a variable that increases
// slowly each frame, then use a semi-transparent rectangle over the scene to
// represent evening/night. Write and test this code yourself, and explain it in
// your README and AI Reflection Log. Do not submit this TODO as the finished feature.

updateStats();
requestAnimationFrame(animationLoop);
