// guards.js — patrol guards: waypoints, vision cones, suspicion,
// investigation and chase. A guard only sees the thief when the thief is
// inside the cone AND no wall or cover blocks the line of sight.
var Guards = (function () {
  var CONE_RANGE = 185;
  var CONE_HALF = 0.5; // radians, about 29 degrees each side
  var CHASE_SPEED = 2.25;

  function create(defs) {
    return defs.map(function (d) {
      return {
        name: d.name,
        path: d.path,
        wp: 0,
        x: d.path[0][0],
        y: d.path[0][1],
        angle: 0,
        speed: d.speed,
        state: "patrol", // patrol | investigate | chase
        pause: 0,
        lastSeen: null,
        seenFlash: 0
      };
    });
  }

  function angleTo(g, tx, ty) { return Math.atan2(ty - g.y, tx - g.x); }

  function angleDiff(a, b) {
    var d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  // Can this guard see point (px, py) right now?
  function canSee(g, px, py, blockers, inSmoke) {
    if (inSmoke) return false;
    var dx = px - g.x, dy = py - g.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > CONE_RANGE) return false;
    if (dist < 26) return true; // bumped into the guard: seen, no cone needed
    var diff = Math.abs(angleDiff(Math.atan2(dy, dx), g.angle));
    if (diff > CONE_HALF) return false;
    return !Rooms.segmentBlocked(g.x, g.y, px, py, blockers);
  }

  function moveToward(g, tx, ty, speed) {
    var dx = tx - g.x, dy = ty - g.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 2) return true;
    var step = Math.min(speed, dist);
    g.x += dx / dist * step;
    g.y += dy / dist * step;
    var target = Math.atan2(dy, dx);
    g.angle += angleDiff(target, g.angle) * 0.18;
    return false;
  }

  function update(list, player, level, blockers, dt, alarm) {
    for (var i = 0; i < list.length; i++) {
      var g = list[i];
      if (g.seenFlash > 0) g.seenFlash -= dt;
      if (g.state === "chase") {
        moveToward(g, player.x, player.y, CHASE_SPEED);
        if (alarm < 50) g.state = "investigate";
      } else if (g.state === "investigate") {
        if (g.lastSeen) {
          var arrived = moveToward(g, g.lastSeen[0], g.lastSeen[1], g.speed + 0.55);
          if (arrived) {
            g.pause += dt;
            g.angle += 0.02; // look around while searching
            if (g.pause > 2.5) { g.state = "patrol"; g.pause = 0; g.lastSeen = null; }
          }
        } else { g.state = "patrol"; }
      } else {
        // Patrol: walk the waypoint loop, pausing at each corner to look.
        if (g.pause > 0) {
          g.pause -= dt;
          g.angle += 0.015;
        } else {
          var wp = g.path[g.wp];
          var done = moveToward(g, wp[0], wp[1], g.speed);
          if (done) {
            g.wp = (g.wp + 1) % g.path.length;
            g.pause = 0.9;
          }
        }
      }
    }
  }

  return {
    create: create,
    update: update,
    canSee: canSee,
    angleDiff: angleDiff,
    CONE_RANGE: CONE_RANGE,
    CONE_HALF: CONE_HALF
  };
})();
