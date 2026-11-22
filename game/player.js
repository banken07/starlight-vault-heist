// player.js — the thief: movement, collision, coins and loot pickups.
// Sneaking (Shift) is slower but halves how fast suspicion grows.
var Player = (function () {
  var RADIUS = 13;
  var RUN_SPEED = 165;   // pixels per second
  var SNEAK_SPEED = 95;

  function create(start) {
    return {
      x: start[0], y: start[1],
      r: RADIUS,
      face: 0, // facing angle, for the cloak's starlight trim
      coins: 5,
      loot: [], // names of big loot taken
      moving: false,
      stepT: 0
    };
  }

  function update(p, dt, blockers, bounds) {
    var mx = Input.moveX(), my = Input.moveY();
    var len = Math.sqrt(mx * mx + my * my);
    p.moving = len > 0;
    if (!len) return;
    var sneak = Input.sneaking();
    var speed = (sneak ? SNEAK_SPEED : RUN_SPEED) * dt;
    var nx = p.x + mx / len * speed;
    var ny = p.y + my / len * speed;
    // Clamp to the playfield first, then resolve cover/wall collisions.
    nx = Math.max(bounds.x + p.r, Math.min(bounds.x + bounds.w - p.r, nx));
    ny = Math.max(bounds.y + p.r, Math.min(bounds.y + bounds.h - p.r, ny));
    var fixed = Rooms.collideCircle(nx, ny, p.r, blockers);
    p.x = fixed.x; p.y = fixed.y;
    p.face = Math.atan2(my, mx);
    p.stepT += dt;
    if (p.stepT > 0.28) { p.stepT = 0; AudioSys.step(); }
  }

  // Walk-over coin pickups. Returns the coins collected this frame.
  function collectCoins(p, level) {
    var got = 0;
    for (var i = level.coins.length - 1; i >= 0; i--) {
      var c = level.coins[i];
      var dx = c[0] - p.x, dy = c[1] - p.y;
      if (dx * dx + dy * dy < 26 * 26) {
        level.coins.splice(i, 1);
        p.coins += 5;
        got += 5;
      }
    }
    return got;
  }

  function nearLoot(p, level) {
    var l = level.loot;
    if (l.taken) return false;
    var dx = l.x - p.x, dy = l.y - p.y;
    return dx * dx + dy * dy < 60 * 60;
  }

  function nearExit(p, level) {
    var e = level.exit;
    return p.x > e.x - 10 && p.x < e.x + e.w + 10 && p.y > e.y - 10 && p.y < e.y + e.h + 10;
  }

  function nearCase(p, level) {
    if (!level.caseBox) return false;
    var c = level.caseBox;
    var cx = Math.max(c.x, Math.min(p.x, c.x + c.w));
    var cy = Math.max(c.y, Math.min(p.y, c.y + c.h));
    var dx = p.x - cx, dy = p.y - cy;
    return dx * dx + dy * dy < 70 * 70;
  }

  return {
    create: create,
    update: update,
    collectCoins: collectCoins,
    nearLoot: nearLoot,
    nearExit: nearExit,
    nearCase: nearCase,
    RADIUS: RADIUS
  };
})();
