var ctx, WIDTH, HEIGHT;
var x = 150, y = 150, dx = 2, dy = 4, r = 10;
var gameStarted = false, gameOver = false, gameWon = false;
var paddlex, paddleh = 10, paddlew = 95;
var rightDown = false, leftDown = false;
var bricks, brickSkins, brickPhases;
var NROWS = 5, NCOLS = 5, BRICKWIDTH, BRICKHEIGHT = 64, PADDING = 20;
var hitEffects = [], frameTick = 0;
var tocke = 0, sekunde = 0;
var bratAudio = null, bratVolume = 0.2, currentTrackUrl = "", bgResizeBound = false;
var clipStopTimer = null;
var clipDurationSec = 18;
var clipStartRatio = 0.48;
var instructionsOpen = true;
var targetVinylImg = null;
var allowedTracks = ["360", "Club classics", "Sympathy is a knife", "Talk talk", "Von dutch", "Everything is romantic", "Rewind", "Apple", "B2b", "365", "360 featuring robyn & yung lean", "Von dutch a.g cook remix faturing addison", "365 featuring shygirl", "Guess featuring billie eilish", "Girl, so confusing featuring lorde"];

var localTrackUrls = {
  "360": "music/360_spotdown.org.mp3",
  "club classics": "music/Club classics_spotdown.org.mp3",
  "sympathy is a knife": "music/Sympathy is a knife_spotdown.org.mp3",
  "talk talk": "music/Talk talk_spotdown.org.mp3",
  "von dutch": "music/Von dutch_spotdown.org.mp3",
  "everything is romantic": "music/Everything is romantic_spotdown.org.mp3",
  "rewind": "music/Rewind_spotdown.org.mp3",
  "apple": "music/Apple_spotdown.org.mp3",
  "b2b": "music/B2b_spotdown.org.mp3",
  "365": "music/365_spotdown.org.mp3",
  "360 featuring robyn and yung lean": "music/360 featuring robyn & yung lean_spotdown.org.mp3",
  "von dutch a g cook remix featuring addison": "music/Von dutch a. g. cook remix featuring addison rae_spotdown.org.mp3",
  "365 featuring shygirl": "music/365 featuring shygirl_spotdown.org.mp3",
  "guess featuring billie eilish": "music/Guess featuring billie eilish_spotdown.org.mp3",
  "girl so confusing featuring lorde": "music/Girl, so confusing featuring lorde.mp3"
};

function normalizeTrackName(value) {
  return (value || "")
    .toLowerCase()
    .replace(/faturing/g, "featuring")
    .replace(/\bfeat\.?\b/g, "featuring")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function resolveAllowedTrack(trackName) {
  if (!trackName) return "";
  var normalizedTrack = normalizeTrackName(trackName);
  if (!normalizedTrack) return "";
  var exact = "";
  var contains = "";
  allowedTracks.forEach(function(name) {
    var normalizedAllowed = normalizeTrackName(name);
    if (!normalizedAllowed) return;
    if (normalizedTrack === normalizedAllowed) {
      exact = name;
      return;
    }
    if (
      normalizedTrack.indexOf(normalizedAllowed) !== -1 ||
      normalizedAllowed.indexOf(normalizedTrack) !== -1
    ) {
      if (!contains || normalizedAllowed.length > normalizeTrackName(contains).length) {
        contains = name;
      }
    }
  });
  return exact || contains;
}

function isBratItem(item) {
  if (!item) return false;
  var artist = (item.artistName || "").toLowerCase();
  var collection = (item.collectionName || "").toLowerCase();
  return artist.indexOf("charli xcx") !== -1 && collection.indexOf("brat") !== -1;
}

function stopCurrentAudio() {
  if (!bratAudio) return;
  if (clipStopTimer) {
    clearTimeout(clipStopTimer);
    clipStopTimer = null;
  }
  try { bratAudio.pause(); } catch (e) {}
}

function playTrackUrl(trackUrl) {
  if (!trackUrl) return;
  var target = (trackUrl || "").trim();
  if (!target) return;

  stopCurrentAudio();
  bratAudio = new Audio(target);
  bratAudio.loop = false;
  bratAudio.volume = bratVolume;
  bratAudio.preload = "auto";
  currentTrackUrl = target;
  bratAudio.addEventListener("loadedmetadata", function() {
    var duration = isFinite(bratAudio.duration) ? bratAudio.duration : 0;
    var startAt = duration > 0 ? Math.max(0, Math.min(duration - 1, duration * clipStartRatio)) : 0;
    try { bratAudio.currentTime = startAt; } catch (e) {}
    bratAudio.play().catch(function() {});
    if (clipStopTimer) clearTimeout(clipStopTimer);
    clipStopTimer = setTimeout(function() {
      try { bratAudio.pause(); } catch (e) {}
    }, clipDurationSec * 1000);
  }, { once: true });
  bratAudio.load();
}

function playTrackByName(trackName) {
  var allowedTrack = resolveAllowedTrack(trackName);
  if (!allowedTrack) return;
  var key = normalizeTrackName(allowedTrack);
  var localUrl = localTrackUrls[key];
  if (!localUrl) return;
  playTrackUrl(encodeURI(localUrl));
}

function tryResumeAudio() {
  if (!bratAudio) return;
  if (!bratAudio.paused && !bratAudio.ended) return;
  bratAudio.play().catch(function() {});
}

function buildMovingBackground() {
  var bg = document.getElementById("bgMarquee");
  if (!bg) return;
  var rowHeight = 36;
  var rowCount = Math.ceil(window.innerHeight / rowHeight) + 4;
  var phrase = "BRAT X BRIH XCX CLUB 360 B2b";
  var segment = (phrase + "  ").repeat(16);
  bg.innerHTML = "";
  for (var i = 0; i < rowCount; i++) {
    var row = document.createElement("div");
    row.className = "bg-row" + (i % 2 === 1 ? " reverse" : "");
    var track = document.createElement("div");
    track.className = "bg-track";
    var partA = document.createElement("span");
    var partB = document.createElement("span");
    partA.textContent = segment;
    partB.textContent = segment;

    track.appendChild(partA);
    track.appendChild(partB);
    row.appendChild(track);
    bg.appendChild(row);
  }
  if (!bgResizeBound) {
    bgResizeBound = true;
    window.addEventListener("resize", buildMovingBackground);
  }
}

function startGame() {
  if (instructionsOpen || gameStarted || gameOver || gameWon) return;
  gameStarted = true;
  dx = 0;
  dy = -4;
}

function closeInstructionsAndStart() {
  var overlay = document.getElementById("startOverlay");
  if (overlay) overlay.classList.add("hidden");
  instructionsOpen = false;
  startGame();
}

function resetGame() {
  initBricks();
  paddlex = WIDTH / 2 - paddlew / 2;
  x = paddlex + paddlew / 2;
  y = HEIGHT - paddleh - r - 2;
  dx = 0;
  dy = 0;
  gameStarted = false;
  gameOver = false;
  gameWon = false;
  rightDown = false;
  leftDown = false;
  hitEffects = [];
  frameTick = 0;
  tocke = 0;
  sekunde = 0;
  $("#tocke").html(tocke);
  $("#cas").html("00:00");
}

function timer() {
  if (!gameStarted || gameOver || gameWon) return;
  sekunde++;
  var min = Math.floor(sekunde / 60);
  var sec = sekunde % 60;
  if (sec < 10) sec = "0" + sec;
  if (min < 10) min = "0" + min;
  $("#cas").html(min + ":" + sec);
}

function initBricks() {
  bricks = [];
  brickSkins = [];
  brickPhases = [];
  BRICKWIDTH = (WIDTH - (NCOLS + 1) * PADDING) / NCOLS;

  var totalBricks = NROWS * NCOLS;
  var trackIndexes = [];
  for (var k = 0; k < totalBricks; k++) {
    trackIndexes.push(k % allowedTracks.length);
  }
  for (var s = trackIndexes.length - 1; s > 0; s--) {
    var rand = Math.floor(Math.random() * (s + 1));
    var temp = trackIndexes[s];
    trackIndexes[s] = trackIndexes[rand];
    trackIndexes[rand] = temp;
  }

  var idx = 0;
  for (var i = 0; i < NROWS; i++) {
    bricks[i] = [];
    brickSkins[i] = [];
    brickPhases[i] = [];
    for (var j = 0; j < NCOLS; j++) {
      bricks[i][j] = 1;
      brickSkins[i][j] = trackIndexes[idx++];
      brickPhases[i][j] = Math.random() * Math.PI * 2;
    }
  }
}

function wrapTextLines(text, maxCharsPerLine, maxLines) {
  var words = (text || "").split(" ");
  var lines = [];
  var current = "";
  for (var i = 0; i < words.length; i++) {
    var next = current ? current + " " + words[i] : words[i];
    if (next.length <= maxCharsPerLine) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = words[i];
      if (lines.length === maxLines - 1) break;
    }
  }

  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length === 0) lines.push(text || "");
  return lines.slice(0, maxLines);
}

function drawTarget(trackName, brickX, brickY, brickW, brickH, pulse) {
  ctx.save();
  
  var centerX = brickX + brickW / 2;
  var centerY = brickY + brickH / 2;
  var radius = Math.min(brickW, brickH) / 2 * 1.4;
  var moveX = Math.sin(frameTick * 0.024 + pulse * 1.6) * 0.85;
  var moveY = Math.cos(frameTick * 0.026 + pulse * 1.3) * 0.75;
  var vinylCenterX = centerX + radius * 0.35 + moveX;
  var vinylCenterY = centerY + moveY;
  var sleeveSize = radius * 1.8;
  var sleeveX = centerX - radius * 0.45 + moveX;
  var sleeveY = centerY + moveY;
  
  // Draw spinning vinyl record first so sleeve appears on top.
  ctx.beginPath();
  ctx.arc(vinylCenterX, vinylCenterY, radius, 0, Math.PI * 2);
  ctx.clip();
  
  if (targetVinylImg) {
    ctx.translate(vinylCenterX, vinylCenterY);
    ctx.rotate((frameTick * 1.2) * Math.PI / 180);
    ctx.translate(-vinylCenterX, -vinylCenterY);
    var squareSize = radius * 2;
    ctx.drawImage(targetVinylImg, vinylCenterX - radius, vinylCenterY - radius, squareSize, squareSize);
    ctx.fillStyle = "rgba(130, 130, 130, 0.2)";
    ctx.fillRect(vinylCenterX - radius, vinylCenterY - radius, squareSize, squareSize);

    // Curved white marker to make rotation easier to perceive.
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = Math.max(1.5, radius * 0.07);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(vinylCenterX, vinylCenterY, radius * 0.68, -0.4, 0.2);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(vinylCenterX, vinylCenterY, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Draw white sleeve above vinyl.
  ctx.save();
  ctx.translate(sleeveX, sleeveY);
  ctx.rotate(0);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-sleeveSize / 2, -sleeveSize / 2, sleeveSize, sleeveSize);
  ctx.strokeStyle = "#d0d0d0";
  ctx.lineWidth = 1.6;
  ctx.strokeRect(-sleeveSize / 2, -sleeveSize / 2, sleeveSize, sleeveSize);

  // Song title on the sleeve.
  var titleMaxChars = Math.max(8, Math.floor(sleeveSize / 7.4));
  var titleLines = wrapTextLines(trackName, titleMaxChars, 3);
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 12px Arial";
  var lineStep = 13;
  var startY = -((titleLines.length - 1) * lineStep) / 2;
  for (var l = 0; l < titleLines.length; l++) {
    ctx.fillText(titleLines[l], 0, startY + l * lineStep);
  }
  ctx.restore();
}

function addHitEffect(brickX, brickY, brickW, brickH) {
  hitEffects.push({ x: brickX + brickW / 2, y: brickY + brickH / 2, r: 8, alpha: 0.85, life: 16 });

  for (var i = 0; i < 10; i++) {
    var a = (Math.PI * 2 * i) / 10;
    var speed = 1.5 + Math.random() * 1.5;
    hitEffects.push({
      x: brickX + brickW / 2,
      y: brickY + brickH / 2,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      size: 2 + Math.random() * 2,
      alpha: 1,
      life: 18,
      particle: true
    });
  }

  for (var n = 0; n < 4; n++) {
    var spread = (n - 1.5) * 0.55;
    hitEffects.push({
      x: brickX + brickW / 2 + spread * 6,
      y: brickY + brickH / 2 + 3,
      vx: spread,
      vy: -1.9 - Math.random() * 0.8,
      size: 3 + Math.random() * 1.5,
      alpha: 1,
      life: 28,
      note: true
    });
  }
}

function drawHitEffects() {
  for (var i = hitEffects.length - 1; i >= 0; i--) {
    var e = hitEffects[i];
    e.life -= 1;

    if (e.life <= 0) {
      hitEffects.splice(i, 1);
      continue;
    }

    e.alpha = e.life / 18;

    if (e.note) {
      e.x += e.vx;
      e.y += e.vy;
      e.vy += 0.015;
      ctx.save();
      ctx.globalAlpha = Math.max(0, e.life / 28);
      ctx.fillStyle = "#0f0f0f";
      ctx.strokeStyle = "#0f0f0f";
      ctx.lineWidth = 1.4;

      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      ctx.fill();

      var stemH = e.size * 4.2;
      var stemW = Math.max(1.1, e.size * 0.35);
      ctx.fillRect(e.x + e.size - stemW * 0.5, e.y - stemH, stemW, stemH);

      ctx.beginPath();
      ctx.moveTo(e.x + e.size, e.y - stemH);
      ctx.quadraticCurveTo(e.x + e.size + 4, e.y - stemH + 1.5, e.x + e.size + 6, e.y - stemH + 5);
      ctx.stroke();
      ctx.restore();
    } else if (e.particle) {
      e.x += e.vx;
      e.y += e.vy;
      e.vy += 0.02;
      ctx.save();
      ctx.globalAlpha = e.alpha;
      ctx.fillStyle = "#eaffc6";
      ctx.fillRect(e.x, e.y, e.size, e.size);
      ctx.restore();
    } else {
      e.r += 1.8;
      ctx.save();
      ctx.globalAlpha = e.alpha;
      ctx.strokeStyle = "#eaffc6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawApple(cx, cy, radius) {
  var bodyR = Math.max(7, radius - 1);
  ctx.save();
  ctx.fillStyle = "#f4f7ff";
  ctx.beginPath();
  ctx.arc(cx - bodyR * 0.28, cy + bodyR * 0.03, bodyR * 0.62, 0, Math.PI * 2);
  ctx.arc(cx + bodyR * 0.28, cy + bodyR * 0.03, bodyR * 0.62, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#8ACE00";
  ctx.beginPath();
  ctx.arc(cx, cy - bodyR * 0.52, bodyR * 0.24, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 1, cy - bodyR * 0.72);
  ctx.lineTo(cx + bodyR * 0.18, cy - bodyR * 1.03);
  ctx.stroke();
  ctx.fillStyle = "#e8f5e9";
  ctx.beginPath();
  ctx.ellipse(cx + bodyR * 0.33, cy - bodyR * 0.9, bodyR * 0.2, bodyR * 0.1, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

$(document).keydown(function(e) {
  if (instructionsOpen) {
    if (e.key === " " || e.key === "Spacebar" || e.key === "Enter") {
      e.preventDefault();
      closeInstructionsAndStart();
    }
    return;
  }
  if (e.key === "ArrowRight") rightDown = true;
  if (e.key === "ArrowLeft") leftDown = true;

  if (e.key === " " || e.key === "Spacebar" || e.key === "ArrowUp" || e.key === "Enter") {
    e.preventDefault();
    if (gameOver) resetGame();
    if (gameWon) resetGame();
    if (!gameStarted) startGame();
  }
});

$(document).keyup(function(e) {
  if (e.key === "ArrowRight") rightDown = false;
  if (e.key === "ArrowLeft") leftDown = false;
});

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  frameTick++;
  if (gameOver) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 64px Arial";
    ctx.fillText("Game Over", WIDTH / 2, HEIGHT / 2 - 24);
    ctx.font = "bold 24px Arial";
    ctx.fillText("Score: " + tocke, WIDTH / 2, HEIGHT / 2 + 20);
    ctx.fillText("Time: " + $("#cas").text(), WIDTH / 2, HEIGHT / 2 + 56);
    ctx.font = "20px Arial";
    ctx.fillText("Press Space / Enter to play again", WIDTH / 2, HEIGHT / 2 + 94);
    ctx.restore();
    return;
  }
  if (gameWon) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 64px Arial";
    ctx.fillText("You Win!", WIDTH / 2, HEIGHT / 2 - 24);
    ctx.font = "bold 24px Arial";
    ctx.fillText("Score: " + tocke, WIDTH / 2, HEIGHT / 2 + 20);
    ctx.fillText("Time: " + $("#cas").text(), WIDTH / 2, HEIGHT / 2 + 56);
    ctx.font = "20px Arial";
    ctx.fillText("Press Space / Enter to play again", WIDTH / 2, HEIGHT / 2 + 94);
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.fillStyle = "black";
  ctx.font = "190px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("brih", WIDTH / 2, HEIGHT / 2);
  ctx.restore();
  if (rightDown && paddlex + paddlew < WIDTH) paddlex += 5;
  if (leftDown && paddlex > 0) paddlex -= 5;
  if (!gameStarted) {
    x = paddlex + paddlew / 2;
    y = HEIGHT - paddleh - r - 2;
  }
  drawApple(x, y, r * 1.9);
  ctx.fillStyle = "black";
  ctx.fillRect(paddlex, HEIGHT - paddleh, paddlew, paddleh);
  for (var i = 0; i < NROWS; i++) {
    for (var j = 0; j < NCOLS; j++) {
      if (bricks[i][j] !== 1) continue;

      var brickX = j * (BRICKWIDTH + PADDING) + PADDING;
      var brickY = i * (BRICKHEIGHT + PADDING) + PADDING;
      var trackIndex = brickSkins[i][j];
      var trackName = allowedTracks[trackIndex % allowedTracks.length];
      var pulse = Math.sin(frameTick * 0.07 + brickPhases[i][j]);

      drawTarget(trackName, brickX, brickY, BRICKWIDTH, BRICKHEIGHT, pulse);
    }
  }
  drawHitEffects();
  if (!gameStarted) return;
  var rowheight = BRICKHEIGHT + PADDING;
  var colwidth = BRICKWIDTH + PADDING;
  var row = Math.floor(y / rowheight);
  var col = Math.floor(x / colwidth);
  if (y < NROWS * rowheight && bricks[row] && bricks[row][col] === 1) {
    dy = -dy;

    var hitX = col * (BRICKWIDTH + PADDING) + PADDING;
    var hitY = row * (BRICKHEIGHT + PADDING) + PADDING;
    addHitEffect(hitX, hitY, BRICKWIDTH, BRICKHEIGHT);
    var hitTrackIndex = brickSkins[row][col];
    var hitTrackName = allowedTracks[hitTrackIndex % allowedTracks.length];
    bricks[row][col] = 0;
    tocke++;
    $("#tocke").html(tocke);
    playTrackByName(hitTrackName);
    if (tocke >= NROWS * NCOLS) {
      gameWon = true;
      gameStarted = false;
      dx = 0;
      dy = 0;
      return;
    }
  }
  if (x + dx > WIDTH - r || x + dx < r) dx = -dx;
  if (y + dy < r) dy = -dy;

  if (y + dy > HEIGHT - r) {
    if (x > paddlex && x < paddlex + paddlew) {
      dy = -dy;
      dx = 8 * ((x - (paddlex + paddlew / 2)) / paddlew);
    } else {
      gameOver = true;
      gameStarted = false;
      dx = 0;
      dy = 0;
    }
  }
  x += dx;
  y += dy;
}

function init() {
  var canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  WIDTH = canvas.width;
  HEIGHT = canvas.height;
  paddlex = WIDTH / 2 - paddlew / 2;
  x = paddlex + paddlew / 2;
  y = HEIGHT - paddleh - r - 2;
  dx = 0;
  dy = 0;
  gameStarted = false;
  gameOver = false;
  instructionsOpen = true;
  
  targetVinylImg = new Image();
  targetVinylImg.src = "assets/target_vinyl_brat.png";
  
  buildMovingBackground();
  initBricks();
  var startBtn = document.getElementById("startGameBtn");
  if (startBtn) {
    startBtn.addEventListener("click", function() {
      closeInstructionsAndStart();
    });
  }
  document.addEventListener("click", tryResumeAudio, { once: true });
  document.addEventListener("keydown", tryResumeAudio, { once: true });
  document.addEventListener("touchstart", tryResumeAudio, { once: true });
  canvas.addEventListener("click", function() {
    if (instructionsOpen) return;
    if (gameOver || gameWon) resetGame();
    startGame();
  });
  canvas.addEventListener("touchstart", function() {
    if (instructionsOpen) return;
    if (gameOver || gameWon) resetGame();
    startGame();
  });
  setInterval(draw, 10);
  setInterval(timer, 1000);
}

init();
