/* Global variables */
var frontBuffer = document.getElementById('snake');
var frontCtx = frontBuffer.getContext('2d');
var backBuffer = document.createElement('canvas');
backBuffer.width = frontBuffer.width;
backBuffer.height = frontBuffer.height;
var backCtx = backBuffer.getContext('2d');
var oldTime = performance.now();
var scale = 10;
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

/* Snake Game class: acts more or less as the model*/
function SnakeGame(speed, scale, gridWidth, gridHeight) {
  this.dir = [1, 0];
  this.speed = speed;
  this.scale = scale;
  this.gridW = gridWidth;
  this.gridH = gridHeight;
  this.turnPoints = [];
  this.score = [];
  this.headX = 0;
  this.headY = 0;
  this.tailX = 0;
  this.tailY = 0;
  this.apples = {}; //dictionary to lookup and set apples
  this.theta = 0;
}
SnakeGame.prototype.addApple(x, y) {
  this.apples[[x, y]] = true;
}
SnakeGame.prototype.removeApple(x, y) {
  this.apples[[x, y]] = false;
}
SnakeGame.prototype.isAppleAt(x, y){ 
  return this.apples[[x, y]];
}
SnakeGame.prototype.checkSelfCollide() {
  for(var i = 0; i < this.turnPoints.length - 1; ++i) {
    var p1 = gridSnap(this.turnPoints[i], this.scale);
    var p2 = gridSnap(this.turnPoints[i + 1], this.scale);
    if(p1[0] == p2[0]) {
      //check if [1]s are bunding
    } else {
      //assume 
    }
  }
}
SnakeGame.prototype.checkOutOfBounds() {
  //TODO: collide happens when grid position is outside of the grid
}
SnakeGame.prototype.gridPos() {
  //TODO: return the grid position of the head
}
SnakeGame.prototype.pos() {
  //TODO: return head position
}
SnakeGame.prototype.tailPos() {
  //TODO: return tail position
}
SnakeGame.prototype.setPos(x, y) {
  //TODO: change head position
}
SnakeGame.prototype.setTailPos(x, y) {
  //TODO: change tail position
}
SnakeGame.prototype.addTurn() {
  //TODO: add a turning point at current grid location
}
SnakeGame.prototype.setDir(vert, horz) {
  //TODO: change the pixel delta
}
SnakeGame.prototype.calculateMove() {
  //TODO: using speed, delta, pos, gridPos
  //check for grid collision and handle as needed
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
  render(elapsedTime);

  // Flip the back buffer (I don't want to double buffer)
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
  score = score + 1;
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
  for(var i = 0; i <= gridW; ++i) {
    for(var j = 0; j <= gridH; ++j) {

    }
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
  frontCtx.clearRect(0, 0, backBuffer.width, backBuffer.height);
  radialSweep(frontCtx, 50, [[10,0],[30,0]], [[0,10],[0,30]], 50, 50);
}

/* Launch the game */
window.requestAnimationFrame(loop);
