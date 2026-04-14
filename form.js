var ctx;
var WIDTH;
var HEIGHT;

// žoga
var x = 150;
var y = 150;
var dx = 2;
var dy = 4;
var r = 10;

// paddle
var paddlex;
var paddleh = 10;
var paddlew = 75;

// kontrole
var rightDown = false;
var leftDown = false;

// bricks
var bricks;
var NROWS = 5;
var NCOLS = 5;
var BRICKWIDTH;
var BRICKHEIGHT = 15;
var PADDING = 1;

// točke in čas
var tocke = 0;
var sekunde = 0;
var intervalId;

// ozadna glasba
var bratTracks = [
  "360",
  "Club classics",
  "Sympathy is a knife",
  "Talk talk",
  "Von dutch",
  "Everything is romantic",
  "Rewind",
  "Apple",
  "B2b",
  "365",
  "360 featuring robyn & yung lean",
  "365 featuring shygirl",
  "Guess featuring Billie Eilish",
  "Von dutch a.g. cook remix featuring addison"

];
var bratAudio = null;
var bratJeZagnan = false;
var bratVolume = 0.2;

function predvajajAudioOdZacetka(audio) {
  if (!audio) return;

  try {
    audio.currentTime = 0;
  } catch (e) {}

  audio.play().catch(function() {
    // Browser je blokiral autoplay; počakamo na interakcijo uporabnika.
  });
}

function predvajajRandomBratPesem() {
  var randomIndex = Math.floor(Math.random() * bratTracks.length);
  var randomTrack = bratTracks[randomIndex];

  $.ajax({
    url: "https://itunes.apple.com/search",
    dataType: "jsonp",
    data: {
      term: "charli xcx " + randomTrack,
      entity: "song",
      limit: 20
    },
    success: function(response) {
      var results = response && response.results ? response.results : [];
      var kandidat = results.find(function(item) {
        var artist = (item.artistName || "").toLowerCase();
        var album = (item.collectionName || "").toLowerCase();
        var track = (item.trackName || "").toLowerCase();

        return artist.indexOf("charli xcx") !== -1 &&
          album.indexOf("brat") !== -1 &&
          track.indexOf(randomTrack.toLowerCase()) !== -1 &&
          !!item.previewUrl;
      });

      if (!kandidat) return;

      if (bratAudio) {
        try {
          bratAudio.pause();
        } catch (e) {}
      }

      bratAudio = new Audio(kandidat.previewUrl + "?v=" + Date.now());
      bratAudio.loop = true;
      bratAudio.volume = bratVolume;
      bratAudio.preload = "auto";

      bratAudio.addEventListener("canplay", function() {
        predvajajAudioOdZacetka(bratAudio);
      }, { once: true });

      bratAudio.load();
    }
  });
}

function poskusiPredvajatiPoInterakciji() {
  if (bratAudio) {
    if (!bratAudio.paused && !bratAudio.ended) return;

    bratAudio.play().catch(function() {
      // Če autoplay še vedno blokira, ne resetiramo komada.
    });
    return;
  }

  bratJeZagnan = false;
  zagonBratGlasbe();
}

function zagonBratGlasbe() {
  if (bratJeZagnan) return;
  bratJeZagnan = true;
  predvajajRandomBratPesem();
}

function zagonBratGlasbeObInterakciji() {
  poskusiPredvajatiPoInterakciji();
}

// ================= INIT =================
function init() {
  var canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  WIDTH = canvas.width;
  HEIGHT = canvas.height;

  paddlex = WIDTH / 2;

  initbricks();
  // Poskus autoplay ob odprtju.
  zagonBratGlasbe();
  // Če autoplay blokira, naj prvi klik/tipka zanesljivo ponovno sproži predvajanje.
  document.addEventListener("click", zagonBratGlasbeObInterakciji, { once: true });
  document.addEventListener("keydown", zagonBratGlasbeObInterakciji, { once: true });
  document.addEventListener("touchstart", zagonBratGlasbeObInterakciji, { once: true });

  intervalId = setInterval(draw, 10);
  setInterval(timer, 1000);
}

// ================= TIMER =================
function timer() {
  sekunde++;

  var min = Math.floor(sekunde / 60);
  var sec = sekunde % 60;

  if (sec < 10) sec = "0" + sec;
  if (min < 10) min = "0" + min;

  $("#cas").html(min + ":" + sec);
}

// ================= BRICKS =================
function initbricks() {
  bricks = [];
  BRICKWIDTH = (WIDTH / NCOLS) - 1;

  for (var i = 0; i < NROWS; i++) {
    bricks[i] = [];
    for (var j = 0; j < NCOLS; j++) {
      bricks[i][j] = 1;
    }
  }
}

// ================= DRAW HELPERS =================
function circle(x,y,r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.fill();
}

function rect(x,y,w,h) {
  ctx.beginPath();
  ctx.rect(x,y,w,h);
  ctx.fill();
}

function clear() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

// ================= CONTROLS =================
$(document).keydown(function(e) {
  if (e.key === "ArrowRight") rightDown = true;
  if (e.key === "ArrowLeft") leftDown = true;
});

$(document).keyup(function(e) {
  if (e.key === "ArrowRight") rightDown = false;
  if (e.key === "ArrowLeft") leftDown = false;
});

// ================= MAIN DRAW =================
function draw() {
  clear();
ctx.save();
ctx.globalAlpha = 0.1; // prosojnost
ctx.fillStyle = "black";
ctx.font = "200px Arial";
ctx.textAlign = "center";
ctx.fillText("brih", WIDTH / 2, HEIGHT / 2);
ctx.restore();
  // premik paddle
  if (rightDown && paddlex + paddlew < WIDTH) paddlex += 5;
  if (leftDown && paddlex > 0) paddlex -= 5;

  // žoga
  circle(x, y, r);

  // paddle
  rect(paddlex, HEIGHT - paddleh, paddlew, paddleh);

  // bricks
  for (var i = 0; i < NROWS; i++) {
    for (var j = 0; j < NCOLS; j++) {
      if (bricks[i][j] == 1) {
        rect(
          j * (BRICKWIDTH + PADDING) + PADDING,
          i * (BRICKHEIGHT + PADDING) + PADDING,
          BRICKWIDTH,
          BRICKHEIGHT
        );
      }
    }
  }

  // zadetek opeke
  var rowheight = BRICKHEIGHT + PADDING;
  var colwidth = BRICKWIDTH + PADDING;

  var row = Math.floor(y / rowheight);
  var col = Math.floor(x / colwidth);

  if (y < NROWS * rowheight && bricks[row] && bricks[row][col] == 1) {
    dy = -dy;
    bricks[row][col] = 0;

    tocke++;
    $("#tocke").html(tocke);
  }

  // stene
  if (x + dx > WIDTH - r || x + dx < r) dx = -dx;
  if (y + dy < r) dy = -dy;

  // paddle collision
  if (y + dy > HEIGHT - r) {
    if (x > paddlex && x < paddlex + paddlew) {
      dy = -dy;

      // kot odbijanja
      dx = 8 * ((x - (paddlex + paddlew/2)) / paddlew);
    } else {
      clearInterval(intervalId);
      alert("Game Over");
    }
  }

  x += dx;
  y += dy;
}

// ================= START =================
init();
