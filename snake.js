/* Global variables */
var frontBuffer = document.getElementById('snake');
var frontCtx = frontBuffer.getContext('2d');
var backBuffer = document.createElement('canvas');
backBuffer.width = frontBuffer.width;
backBuffer.height = frontBuffer.height;
var backCtx = backBuffer.getContext('2d');
var oldTime = performance.now();
var score = 0
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

  // Flip the back buffer
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


function renderHorzPath(upper, lower, res, start, finish) {
  var step = (start - finish) / res;
  for(var i = start; i < finish; i += step) {
      frontCtx.beginPath();
      frontCtx.moveTo(Math.round(i), Math.round(upper(i)));
      frontCtx.lineTo(Math.round(i), Math.round(lower(i)));
      frontCtx.stroke();
  }
}

function renderVertPath(left, right, res, start, finish) {
  var step = (start - finish) / res;
  for(var i = start; i < finish; i += step) {
      frontCtx.beginPath();
      frontCtx.moveTo(Math.round(left(i)), Math.round(i));
      frontCtx.lineTo(Math.round(right(i)), Math.round(i));
      frontCtx.stroke();
  }
}

function renderPolorPath(lowerMag, upperMag, res, start, finish, xoff, yoff) {
  var step = Math.abs(finish - start) / res;
  for(var i = start; i < finish; i += step) {
    frontCtx.beginPath();
    var lmag = lowerMag(i);
    var umag = upperMag(i);
    var xmod = Math.cos(i);
    var ymod = Math.sin(i);
    var lx = lmag*xmod;
    var ly = lmag*ymod;
    var ux = umag*xmod;
    var uy = umag*ymod;
    frontCtx.moveTo(Math.round(lx + xoff), Math.round(ly + yoff));
    frontCtx.lineTo(Math.round(ux + xoff), Math.round(uy + yoff));
    frontCtx.stroke();
  }
}

function toPolar(x, y) {
  return [Math.sqrt(x*x + y*y), Math.atan2(y, x)];
}

function tween(start, finish, by, mn, mx) {
  var diff = mx - mn
  var prob = (by / diff)
  return prob*start + (1-prob)*finish;
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
  xoffset = 3*Math.cos(theta/33);
  yoffset = 3*Math.sin(theta/33);
  width = 30;
  inradius = 30;
  outradius = inradius + width;
  botTop = toPolar(0, yoffset + inradius)[0];
  botBot = toPolar(0, yoffset + outradius)[0];
  topLeft = toPolar(xoffset + inradius, 0)[0];
  topRight = toPolar(xoffset + outradius, 0)[0]
  totalSweep = Math.PI/2;
  renderPolorPath(
    function(phi){return tween(botTop, topLeft, phi, 0, totalSweep);}, 
    function(phi){return tween(botBot, topRight, phi, 0, totalSweep);}, 
    100, 0.0, totalSweep, 50, 50);
}

/* Launch the game */
window.requestAnimationFrame(loop);
