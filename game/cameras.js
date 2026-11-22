// cameras.js — brass eye cameras mounted on the wall. Each one sweeps its
// vision cone back and forth; a lens cap blinds it for a while, and smoke
// hides the thief from it.
var Cameras = (function () {
  var CONE_HALF = 0.38; // narrower than a guard's cone, but longer
  var BLIND_SECONDS = 10;

  function create(defs) {
    return defs.map(function (d) {
      return {
        x: d.x, y: d.y,
        base: d.base, sweep: d.sweep, speed: d.speed, range: d.range,
        t: Math.random() * 6,
        blind: 0,
        angle: d.base
      };
    });
  }

  function update(list, dt) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      c.t += dt;
      c.angle = c.base + Math.sin(c.t * c.speed) * c.sweep;
      if (c.blind > 0) c.blind -= dt;
    }
  }

  function canSee(c, px, py, blockers, inSmoke) {
    if (c.blind > 0 || inSmoke) return false;
    var dx = px - c.x, dy = py - c.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > c.range) return false;
    if (dist < 20) return true;
    var diff = Math.abs(Guards.angleDiff(Math.atan2(dy, dx), c.angle));
    if (diff > CONE_HALF) return false;
    return !Rooms.segmentBlocked(c.x, c.y, px, py, blockers);
  }

  // Blind the nearest camera within reach; returns the camera or null.
  function blindNearest(list, px, py, reach) {
    var best = null, bestD = reach;
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      var d = Math.sqrt((c.x - px) * (c.x - px) + (c.y - py) * (c.y - py));
      if (d < bestD) { best = c; bestD = d; }
    }
    if (best) best.blind = BLIND_SECONDS;
    return best;
  }

  return {
    create: create,
    update: update,
    canSee: canSee,
    blindNearest: blindNearest,
    CONE_HALF: CONE_HALF,
    BLIND_SECONDS: BLIND_SECONDS
  };
})();
