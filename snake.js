/* Global variables */
var frontBuffer = document.getElementById('snake');
var frontCtx = frontBuffer.getContext('2d');
var backBuffer = document.createElement('canvas');
backBuffer.width = frontBuffer.width;
backBuffer.height = frontBuffer.height;
var backCtx = backBuffer.getContext('2d');
var oldTime = performance.now();
//var gridWidth = Math.floor(frontBuffer.width / scale);
//var gridHeight = Math.floor(frontBuffer.height / scale);

/* Helper functions */

//converts rectangular corrdinates to polar
function toPolar(x, y) {
  return [Math.sqrt(x*x + y*y), Math.atan2(y, x)];
}

//tweens a value a specified ratio between two values
function tween(start, finish, by, mn, mx) {
  //http://stackoverflow.com/questions/16201656/how-to-swap-two-variables-in-javascript
  if(mx < mn) mn = [mx, mx = mn][0];
  var diff = mx - mn
  var prob = (by / diff)
  return prob*start + (1-prob)*finish;
}

function gridSnap(pos, scale) {
  return [Math.floor(pos[0] / scale), Math.floor(pos[1] / scale)];
}

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


/* Snake Game class: acts more or less as the model*/
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
  this.headX = scale/2;
  this.headY = scale/2;
  this.tailX = scale/2;
  this.tailY = scale/2;
  this.apples = {}; //dictionary to lookup and set apples
  this.theta = 0;
}
SnakeGame.prototype.addApple = function(x, y) {
  this.apples[[x, y]] = true;
}
SnakeGame.prototype.removeApple = function(x, y) {
  delete apples[[x, y]];
}
SnakeGame.prototype.isAppleAt = function(x, y){ 
  return !!this.apples[[x, y]];
}
SnakeGame.prototype.checkSelfCollide = function() {
  for(var i = 0; i < this.turnPoints.length - 1; ++i) {
    var p1 = gridSnap(this.turnPoints[i], this.scale);
    var p2 = gridSnap(this.turnPoints[i + 1], this.scale);
    var gp = this.gridPos();
    var idx = +(p1[0] == p2[0]);
    var hit = Math.min(p1[idx], p2[idx]) <= gp[idx] && gp[idx] >= Math.max(p1[idx], p2[idx]);
    if(hit) return true;
  }
  return false;
}
SnakeGame.prototype.checkOutOfBounds = function() {
  var gp = this.gridPos();
  return gp[0] <= this.gridW && gp[1] <= this.gridH;
}
SnakeGame.prototype.gridPos = function() {
  return gridSnap(this.pos(), this.scale);
}
SnakeGame.prototype.pos = function() {
  return [this.headX, this.headY];
}
SnakeGame.prototype.tailPos = function() {
  return [this.tailX, this.tailY];
}
SnakeGame.prototype.setPos = function(x, y) {
  this.headX = x;
  this.headY = y;
}
SnakeGame.prototype.setTailPos = function(x, y) {
  this.tailX = x;
  this.tailY = y;
}
SnakeGame.prototype.addTurn = function(horz, vert) {
  if(Math.abs(this.dir[0]) == horz*horz || Math.abs(this.dir[1]) == vert) return;
  this.turn = [[horz, vert]];
}
SnakeGame.prototype.clearTurns = function() {
  this.turn = [];
}
//complicated way to ensure that we stay on the grid even though we're using continuous movement
//this is actully all simple with a vector library
SnakeGame.prototype.move = function(dt) {
  var gp = this.gridPos();
  var dir = this.dir;
  var center = [gp[0]*this.scale + this.scale/2, gp[1]*this.scale + this.scale/2];
  var dx = dir[0]*this.speed*dt;
  var dy = dir[1]*this.speed*dt;
  var nextX = this.headX + dx;
  var nextY = this.headY + dy;
  var dist = dx + dy;
  //if moving along x direction and went past turn point and need to turn
  if(this.turn.length && dx !== 0 && Math.sign(center[0]-this.headX) != Math.sign(center[0]-nextX)
  || this.turn.length && dy !== 0 && Math.sign(center[1]-this.headY) != Math.sign(center[1]-nextY)) {
    this.turnPoints.push(gp);
    this.dir = this.turn.pop();
    this.setPos(center[0], center[1]);
  } else {
    this.headX = nextX;
    this.headY = nextY;
  }
  //now move the tail
  var tp = this.turnPoints[0] || [(this.headX - this.scale/2)/this.scale, (this.headY - this.scale/2)/this.scale];
  var tx = tp[0]*this.scale + this.scale/2;
  var ty = tp[1]*this.scale + this.scale/2;
  if(Math.abs(tx-this.tailX) + Math.abs(ty-this.tailY) > this.tailspeed*dt) {
    this.tailY += Math.sign(ty - this.tailY)*this.tailspeed*dt;
    this.tailX += Math.sign(tx - this.tailX)*this.tailspeed*dt;
  } else {
    this.tailX = tx;
    this.tailY = ty;
    this.turnPoints.shift();
  }
}

//

/* now we setup the game details */
var snakeGameScale = 20;
snakeGame = new SnakeGame(0.1, 0.01, snakeGameScale, 
                         frontBuffer.width/snakeGameScale, frontBuffer.height/snakeGameScale)

document.onkeydown = function(e) {
  e = e || window.event;
  switch(e.key) {
    case 'ArrowUp':    snakeGame.addTurn(0, -1); break;
    case 'ArrowDown':  snakeGame.addTurn(0,  1); break;
    case 'ArrowRight': snakeGame.addTurn(1, 0); break;
    case 'ArrowLeft':  snakeGame.addTurn(-1,  0); break;
  }
}

/**
 * @function loop
 * The main game loop.
 * @param{time} the current time as a DOMHighResTimeStamp
 */
function loop(newTime) {
  var elapsedTime = newTime - oldTime;
  oldTime = newTime;

  update(elapsedTime);
  frontCtx.clearRect(0, 0, backBuffer.width, backBuffer.height);
  render(elapsedTime);
  frontCtx.drawImage(backBuffer, 0, 0);

  // Run the next loop
  window.requestAnimationFrame(loop);
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
  // TODO: Spawn an apple periodically
  // TODO: Grow the snake periodically
  // TODO: Move the snake
  // TODO: Determine if the snake has moved out-of-bounds (offscreen)
  // TODO: Determine if the snake has eaten an apple
  // TODO: Determine if the snake has eaten its tail
  // TODO: [Extra Credit] Determine if the snake has run into an obstacle

}

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
  var step = (start - finish) / res;
  for(var i = start; i < finish; i += step) {
      ctx.beginPath();
      ctx.moveTo(Math.round(i), Math.round(upper(i)));
      ctx.lineTo(Math.round(i), Math.round(lower(i)));
      ctx.stroke();
  }
}

function renderVertPath(ctx, left, right, res, start, finish) {
  var step = (start - finish) / res;
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

/**
  * @function render
  * Renders the current game state into a back buffer.
  * @param {elapsedTime} A DOMHighResTimeStamp indicting
  * the number of milliseconds passed since the last frame.
  */
theta = 0.0
function render(elapsedTime) {
  theta += 0.1 * elapsedTime;
  backCtx.clearRect(0, 0, backBuffer.width, backBuffer.height);
  renderGrid(backCtx, snakeGame.gridW, snakeGame.gridH, snakeGame.scale);
  renderCircle(backCtx, snakeGame.scale/2, snakeGame.headX, snakeGame.headY);
  renderCircle(backCtx, snakeGame.scale/2, snakeGame.tailX, snakeGame.tailY);
}

/* Launch the game */
window.requestAnimationFrame(loop);
