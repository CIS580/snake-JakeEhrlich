/*///-----------------------------------------------------------------------
| Global varibles used mainly in rendering stuff
*///------------------------------------------------------------------------
var frontBuffer = document.getElementById('snake');
var frontCtx = frontBuffer.getContext('2d');
var backBuffer = document.createElement('canvas');
backBuffer.width = frontBuffer.width;
backBuffer.height = frontBuffer.height;
var backCtx = backBuffer.getContext('2d');
var oldTime = performance.now();

/*///-----------------------------------------------------------------------
| A bunch of helper functions
*///------------------------------------------------------------------------

//converts rectangular corrdinates to polar
function toPolar(x, y) {
  return [Math.sqrt(x*x + y*y), Math.atan2(y, x)];
}

//tweens a value a specified ratio between two values
function tween(start, finish, by, mn, mx) {
  //neat trick from stack overflow that I use a lot in this program
  //http://stackoverflow.com/questions/16201656/how-to-swap-two-variables-in-javascript
  if(mx < mn) mn = [mx, mx = mn][0];
  var diff = mx - mn
  var prob = (by / diff)
  return prob*start + (1-prob)*finish;
}

function gridSnap(pos, scale) {
  return [Math.floor(pos[0] / scale), Math.floor(pos[1] / scale)];
}

//apprently javascript has no way to compare arrays for equality so I got this from here
//http://stackoverflow.com/questions/3115982/how-to-check-if-two-arrays-are-equal-with-javascript
function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function addv(v1, v2) {
  out = [];
  for(var i = 0; i < Math.min(v1.length, v2.length); ++i) {
    out.push(v1[i] + v2[i]);
  }
  return out;
}

function subv(v1, v2) {
  out = [];
  for(var i = 0; i < Math.min(v1.length, v2.length); ++i) {
    out.push(v1[i] - v2[i]);
  }
  return out;
}

function smul(s, v) {
  out = [];
  for(var i = 0; i < v.length; ++i) {
    out.push(s*v[i]);
  }
  return out;
}

function sadd(v, s) {
  out = [];
  for(var i = 0; i < v.length; ++i) {
    out.push(s + v[i]);
  }
  return out;
}

function sum(v) {
  out = 0;
  for(var i = 0; i < v.length; ++i) {
    out += v[i];
  }
  return out;
}

function mag(v) {
  out = 0;
  for(var i = 0; i < v.length; ++i) {
    out += v[i]*v[i];
  }
  return Math.sqrt(out);
}

function normalize(v) {
  return smul(1/mag(v), v);
}

function eqv(v1, v2) { return arraysEqual(v1, v2); }

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

/*///-----------------------------------------------------------------------
| A class to define the varibles of a snake game and change them
*///------------------------------------------------------------------------

function SnakeGame(speed, growth, scale, gridWidth, gridHeight) {
  this.dir = [1, 0];
  this.turn = [];
  this.tailspeed = speed - growth;
  this.speed = speed;
  this.scale = scale;
  this.gridW = gridWidth;
  this.gridH = gridHeight;
  this.turnPoints = [];
  this.score = [];
  this.head = smul(scale/2, [1, 1]);
  this.tail= smul(scale/2, [1, 1]);
  this.apples = {}; //dictionary to lookup and set apples
  this.theta = 0;
}
SnakeGame.prototype.addApple = function(pos) {
  this.apples[pos] = true;
}
SnakeGame.prototype.removeApple = function(pos) {
  console.log(this.apples);
  delete this.apples[pos];
  console.log(this.apples);
  console.log(Object.keys(this.apples));
}
SnakeGame.prototype.getApples = function() {
  console.log(this.apples);
  return Object.keys(this.apples).map(function(p){ return JSON.parse("["+p+"]")})
}
SnakeGame.prototype.isAppleAt = function(pos){ 
  return !!this.apples[pos];
}
SnakeGame.prototype.checkSelfCollide = function() {
  var visited = {};
  var nodes = [this.tail].concat(this.turnPoints.concat([this.head]));
  var self=this;
  nodes = nodes.map(function(p){return gridSnap(p, self.scale);});
  for(var i = 0; i < nodes.length - 1; ++i) {
    var p1 = nodes[i];
    var p2 = nodes[i+1];
    var diff = normalize(subv(p2, p1)); //should be [0,1],[0,-1],[1,0], or [-1,0]
    while(!eqv(p1, p2)) {
      if(visited[p1]) return true;
      visited[p1] = true;
      p1 = addv(p1, diff);
    }
  }
  return false;
}
SnakeGame.prototype.checkOutOfBounds = function() {
  var gp = this.gridPos();
  return gp[0] < 0 || gp[1] < 0 || gp[0] >= this.gridW || gp[1] >= this.gridH;
}
SnakeGame.prototype.gridPos = function() {
  return gridSnap(this.head, this.scale);
}
SnakeGame.prototype.pos = function() {
  return this.head;
}
SnakeGame.prototype.tailPos = function() {
  return this.tail;
}
SnakeGame.prototype.setPos = function(pos) {
  this.head = pos;
}
SnakeGame.prototype.setTailPos = function(pos) {
  this.tail = pos;
}
SnakeGame.prototype.addTurn = function(newdir) {
  if(eqv(this.dir, newdir) || eqv(this.dir, smul(-1, newdir))) return;
  this.turn = [newdir];
}
SnakeGame.prototype.clearTurns = function() {
  this.turn = [];
}
//complicated way to ensure that we stay on the grid even though we're using continuous movement
//this is actully all simple with a vector library that I might add soon
SnakeGame.prototype.move = function(dt) {
  var gp = this.gridPos();
  var dir = this.dir;
  var center = sadd(smul(this.scale, gp), this.scale/2);
  var delta = smul(this.speed*dt, dir);
  var next = addv(this.head, delta);
  var cdist = mag(subv(center, this.head));
  var ndist = mag(delta);
  //move head snapping to center if need be
  if(this.turn.length && cdist < ndist) {
    this.turnPoints.push(center);
    this.dir = this.turn.pop();
    this.setPos(center);
  } else {
    this.head = next;
  }
  //now move the tail
  var tp = this.turnPoints[0] || this.head;
  var tdelta = subv(tp, this.tail);
  var delta = smul(this.tailspeed*dt/mag(tdelta), tdelta);
  if(mag(tdelta) > this.tailspeed*dt) {
    this.tail = addv(this.tail, delta);
  } else {
    this.tail = tp;
    this.turnPoints.shift();
  }
}

/*///-----------------------------------------------------------------------
| A bunch of functions to help render stuff
*///------------------------------------------------------------------------

//used for debugging of the visual effects and movement
function renderGrid(ctx, gridW, gridH, scale) {
  for(var i = 0; i <= gridH; ++i) {
    ctx.beginPath();
    ctx.moveTo(0, i*scale);
    ctx.lineTo(gridW*scale, i*scale);
    ctx.stroke();
  }
  for(var i = 0; i <= gridW; ++i) {
    ctx.beginPath();
    ctx.moveTo(i*scale, 0);
    ctx.lineTo(i*scale, gridH*scale);
    ctx.stroke();
  }
}

function renderHorzPath(ctx, upper, lower, res, start, finish) {
  if(finish < start) start = [finish, finish = start][0];
  var step = Math.abs(start - finish) / res;
  for(var i = start; i < finish; i += step) {
      ctx.beginPath();
      ctx.moveTo(Math.round(i), Math.round(upper(i)));
      ctx.lineTo(Math.round(i), Math.round(lower(i)));
      ctx.stroke();
  }
}

function renderVertPath(ctx, left, right, res, start, finish) {
  if(finish < start) start = [finish, finish = start][0];
  var step = Math.abs(start - finish) / res;
  for(var i = start; i < finish; i += step) {
      ctx.beginPath();
      ctx.moveTo(Math.round(left(i)), Math.round(i));
      ctx.lineTo(Math.round(right(i)), Math.round(i));
      ctx.stroke();
  }
}

function renderCircle(ctx, radius, xoff, yoff) {
  backCtx.beginPath();
  backCtx.arc(xoff, yoff, radius, 0, 2 * Math.PI, false);
  backCtx.stroke();
}

function renderPolorPath(ctx, lowerMag, upperMag, res, start, finish, xoff, yoff) {
  if(finish < start) start = [finish, finish = start][0];
  var step = Math.abs(finish - start) / res;
  //TODO: vary the step size so that steps are smaller further away from orthogonal directions
  //and less dense near orthgonal directions
  //this should, with fewer lines, produce a better effect
  //we basically have a sampeling problem
  for(var i = start; i < finish; i += step) {
    ctx.beginPath();
    var lmag = lowerMag(i);
    var umag = upperMag(i);
    var xmod = Math.cos(i);
    var ymod = Math.sin(i);
    var lx = lmag*xmod;
    var ly = lmag*ymod;
    var ux = umag*xmod;
    var uy = umag*ymod;
    ctx.moveTo(Math.round(lx + xoff), Math.round(ly + yoff));
    ctx.lineTo(Math.round(ux + xoff), Math.round(uy + yoff));
    ctx.stroke();
  }
}

//results undefined if lines are not pointing at same point of rotation
function radialSweep(ctx, res, line1, line2, xoff, yoff) {
  //convert lines to polar
  bot1 = toPolar(line1[0][0], line1[0][1]);
  bot2 = toPolar(line1[1][0], line1[1][1]);
  top1 = toPolar(line2[0][0], line2[0][1]);
  top2 = toPolar(line2[1][0], line2[1][1]);
  //figure out the direction of the lines
  botMin = Math.min(bot1[0], bot2[0]);
  topMin = Math.min(top1[0], top2[0]);
  topMax = Math.max(top1[0], top2[0]);
  botMax = Math.max(bot1[0], bot2[0]);
  renderPolorPath(ctx,
    function(phi){return tween(botMin, topMin, phi, bot1[1], top1[1]);}, 
    function(phi){return tween(botMax, topMax, phi, bot1[1], top1[1]);}, 
    res, bot1[1], top1[1], xoff, yoff);
}


/*///-----------------------------------------------------------------------
| Game Definition
|    now we define all the little speicifcs
*///------------------------------------------------------------------------


/* now we setup the game details */
var score = 0;
var snakeGameScale = 20;
snakeGame = new SnakeGame(0.1, 0.01, snakeGameScale, 
                         frontBuffer.width/snakeGameScale, frontBuffer.height/snakeGameScale)

//add an apple before the games starts
var x = getRandomInt(3,snakeGame.gridW-3);
var y = getRandomInt(3,snakeGame.gridH-3);
snakeGame.addApple([x,y]);

document.onkeydown = function(e) {
  e = e || window.event;
  switch(e.code) {
    case 'ArrowUp':    snakeGame.addTurn([0, -1]); break;
    case 'ArrowDown':  snakeGame.addTurn([0,  1]); break;
    case 'ArrowRight': snakeGame.addTurn([1,  0]); break;
    case 'ArrowLeft':  snakeGame.addTurn([-1, 0]); break;
    case 'Space': snakeGame.speed = 0.0; snakeGame.tailspeed = 0.0; break;
  }
  console.log(e);
}

/**
 * @function loop
 * The main game loop.
 * @param{time} the current time as a DOMHighResTimeStamp
 */
function loop(newTime) {
  var elapsedTime = newTime - oldTime;
  oldTime = newTime;

  if(update(elapsedTime)) return window.requestAnimationFrame(looseLoop);
  frontCtx.clearRect(0, 0, backBuffer.width, backBuffer.height);
  render(elapsedTime);
  frontCtx.drawImage(backBuffer, 0, 0);

  // Run the next loop
  window.requestAnimationFrame(loop);
}

function looseLoop(_) {
  backCtx.font="48px Hellki";
  backCtx.fillText("You Dead",backBuffer.width/2-140,backBuffer.height/2);
  frontCtx.clearRect(0, 0, backBuffer.width, backBuffer.height);
  frontCtx.drawImage(backBuffer, 0, 0);
  window.requestAnimationFrame(looseLoop);
}

/**
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {elapsedTime} A DOMHighResTimeStamp indicting
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime) {
  snakeGame.move(elapsedTime);
  if(snakeGame.checkSelfCollide()) {
    //TODO: lose/restart game
    console.log("hit!");
    return true;
  }
  if(snakeGame.isAppleAt(snakeGame.gridPos())) {
    console.log("you ate an apple!");
    //TODO: update points
    snakeGame.removeApple(snakeGame.gridPos());
    var x = getRandomInt(0,snakeGame.gridW);
    var y = getRandomInt(0,snakeGame.gridH);
    snakeGame.addApple([x,y]);
    snakeGame.speed *= 1.02;
    score = score + 1;
  }
  if(snakeGame.checkOutOfBounds()) {
    //TODO: lose/restart game
    console.log("out of bounds!");
    return true;
  }
  return false;
}

/**
  * @function render
  * Renders the current game state into a back buffer.
  * @param {elapsedTime} A DOMHighResTimeStamp indicting
  * the number of milliseconds passed since the last frame.
  */
function render(elapsedTime) {
  backCtx.clearRect(0, 0, backBuffer.width, backBuffer.height);
  //renderGrid(backCtx, snakeGame.gridW, snakeGame.gridH, snakeGame.scale);
  renderCircle(backCtx, snakeGame.scale/2, snakeGame.head[0], snakeGame.head[1]);
  renderCircle(backCtx, snakeGame.scale/2, snakeGame.tail[0], snakeGame.tail[1]);
  var snakeRadius = 3;
  var points = [snakeGame.tail].concat(snakeGame.turnPoints.concat([snakeGame.head]));
  var off = snakeGame.scale/2;
  function wave(amp, lam, vol, x, t) {
    var factor = Math.PI*2/lam;
    return amp*Math.sin(factor*x - factor*vol*t);
  }
  var wl = 40;
  var vol = 10/1000;
  var d = new Date();
  var n = d.getTime();
  for(var i = 0; i < points.length - 1; ++i) {
    var p1 = points[i];
    var p2 = points[i+1];
    var delta = subv(p1, p2);
    var mny = Math.min(p1[1], p2[1]);
    var mnx = Math.min(p1[0], p2[0]);
    var mxy = Math.max(p1[1], p2[1]);
    var mxx = Math.max(p1[0], p2[0]);
    renderVertPath(backCtx, 
                   function(y) {return wave(3,wl,vol,y,n) + p1[0] - snakeRadius;}, 
                   function(y) {return wave(3,wl,vol,y,n) + p1[0] + snakeRadius;},
                   Math.floor(Math.abs(p1[1] - p2[1])), mny + off, mxy - off);
    renderHorzPath(backCtx, 
                   function(x) {return wave(3,wl,vol,x,n) + p2[1] - snakeRadius;}, 
                   function(x) {return wave(3,wl,vol,x,n) + p2[1] + snakeRadius;},
                   Math.floor(Math.abs(p1[0] - p2[0])), mnx + off, mxx - off);       
  }
  for(var i = 0; i < snakeGame.turnPoints.length; ++i) {
    renderCircle(backCtx, snakeGame.scale/2, snakeGame.turnPoints[i][0], snakeGame.turnPoints[i][1]);
  }
  var apples = snakeGame.getApples();
  for(var i = 0; i < apples.length; ++i) {
    backCtx.beginPath();
    var p = sadd(smul(snakeGame.scale, apples[i]), snakeGame.scale/2);
    backCtx.arc(p[0], p[1], snakeGame.scale/2, 0, 2 * Math.PI, false);
    backCtx.fillStyle = 'red';
    backCtx.fill();
  }
  backCtx.font="20px Hellki";
  backCtx.fillText(score,30,30);
}

/* Launch the game */
window.requestAnimationFrame(loop);
