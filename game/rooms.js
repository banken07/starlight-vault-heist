// rooms.js — the three rooms of the observatory and the geometry helpers
// every other module uses: rectangles, circle collision and line of sight.
// Playfield: x 196..1280, y 56..800 (HUD on top, legend on the left).
var Rooms = (function () {
  var PX = 196, PY = 56, PW = 1084, PH = 744;

  function rect(x, y, w, h) { return { x: x, y: y, w: w, h: h }; }

  var LEVELS = [
    {
      name: "ROOM 1 — THE MAP ROOM",
      subtitle: "Steal the Star Chart from the map table",
      objective: "Take the STAR CHART, then leave by the east door",
      loot: { x: 740, y: 335, kind: "chart", name: "STAR CHART", taken: false },
      start: [260, 700],
      exit: rect(1240, 380, 40, 90),
      exitLabel: "EAST DOOR",
      walls: [
        rect(560, 56, 26, 220), rect(560, 420, 26, 200),
        rect(880, 300, 26, 320)
      ],
      covers: [
        { x: 640, y: 220, w: 190, h: 90, kind: "table", label: "MAP TABLE" },
        { x: 300, y: 140, w: 150, h: 60, kind: "shelf", label: "BOOKCASE" },
        { x: 300, y: 660, w: 130, h: 70, kind: "shelf", label: "GLOBE STAND" },
        { x: 980, y: 680, w: 170, h: 80, kind: "crate", label: "CRATES" }
      ],
      guards: [
        { path: [[600, 130], [1120, 130], [1120, 640], [600, 640]], speed: 1.15, name: "MARA" }
      ],
      cameras: [
        { x: 1180, y: 120, base: Math.PI * 0.75, sweep: 0.9, speed: 0.55, range: 230 }
      ],
      coins: [[340, 420], [760, 700], [1150, 250], [480, 620]]
    },
    {
      name: "ROOM 2 — THE TELESCOPE DOME",
      subtitle: "Take the Brass Key from under the great telescope",
      objective: "Take the BRASS KEY, then leave by the east door",
      loot: { x: 738, y: 560, kind: "key", name: "BRASS KEY", taken: false },
      start: [260, 700],
      exit: rect(1240, 380, 40, 90),
      exitLabel: "EAST DOOR",
      walls: [
        rect(420, 56, 26, 180), rect(420, 560, 26, 240),
        rect(1020, 56, 26, 180), rect(1020, 560, 26, 240)
      ],
      covers: [
        { x: 620, y: 330, w: 240, h: 180, kind: "scope", label: "GREAT TELESCOPE" },
        { x: 300, y: 140, w: 150, h: 60, kind: "shelf", label: "STAR ATLAS" },
        { x: 1080, y: 640, w: 150, h: 60, kind: "crate", label: "LENS CRATES" },
        { x: 1080, y: 140, w: 150, h: 60, kind: "shelf", label: "CHART RACK" }
      ],
      guards: [
        { path: [[500, 130], [500, 700], [960, 700], [960, 130]], speed: 1.25, name: "MARA" },
        { path: [[1120, 600], [1120, 300], [900, 300], [900, 600]], speed: 1.1, name: "JULES" }
      ],
      cameras: [
        { x: 640, y: 100, base: Math.PI * 0.5, sweep: 1.0, speed: 0.7, range: 240 },
        { x: 1215, y: 745, base: Math.PI * 1.5, sweep: 0.9, speed: 0.6, range: 240 }
      ],
      coins: [[320, 300], [560, 700], [900, 120], [1150, 420], [760, 600]]
    },
    {
      name: "ROOM 3 — THE STAR VAULT",
      subtitle: "Lockpick the glass case. Take the Comet Diamond. Zipline out.",
      objective: "Lockpick the case, take the COMET DIAMOND, reach the ZIPLINE",
      loot: { x: 738, y: 420, kind: "diamond", name: "COMET DIAMOND", taken: false },
      caseBox: rect(668, 350, 140, 140),
      start: [260, 700],
      exit: rect(1180, 80, 100, 60),
      exitLabel: "ZIPLINE",
      walls: [
        rect(420, 56, 26, 200), rect(420, 540, 26, 260),
        rect(1020, 300, 26, 320), rect(560, 620, 460, 26)
      ],
      covers: [
        { x: 300, y: 140, w: 150, h: 60, kind: "shelf", label: "VAULT LEDGER" },
        { x: 1080, y: 690, w: 150, h: 70, kind: "crate", label: "BRASS CRATES" },
        { x: 480, y: 300, w: 110, h: 90, kind: "table", label: "STAR GLOBE" },
        { x: 940, y: 640, w: 120, h: 70, kind: "table", label: "ORRERY" }
      ],
      guards: [
        { path: [[600, 130], [980, 130], [980, 560], [640, 560]], speed: 1.35, name: "MARA" },
        { path: [[1120, 660], [1120, 200], [900, 200], [900, 560]], speed: 1.2, name: "JULES" }
      ],
      cameras: [
        { x: 640, y: 100, base: Math.PI * 0.5, sweep: 1.0, speed: 0.8, range: 250 },
        { x: 1180, y: 420, base: Math.PI, sweep: 0.9, speed: 0.65, range: 250 }
      ],
      coins: [[320, 300], [560, 700], [900, 120], [1150, 560], [900, 730], [760, 730]]
    }
  ];

  function bounds() { return { x: PX, y: PY, w: PW, h: PH }; }

  function pointInRect(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  // Circle (player) vs rectangle: push the circle out, return corrected pos.
  function collideCircle(px, py, r, rects) {
    var out = { x: px, y: py };
    for (var i = 0; i < rects.length; i++) {
      var rc = rects[i];
      var cx = Math.max(rc.x, Math.min(out.x, rc.x + rc.w));
      var cy = Math.max(rc.y, Math.min(out.y, rc.y + rc.h));
      var dx = out.x - cx, dy = out.y - cy;
      var d2 = dx * dx + dy * dy;
      if (d2 < r * r) {
        if (d2 > 0.0001) {
          var d = Math.sqrt(d2);
          out.x = cx + dx / d * r;
          out.y = cy + dy / d * r;
        } else {
          out.y = rc.y - r; // centre inside: push up out
        }
      }
    }
    return out;
  }

  // True when the segment is blocked by any rectangle (sampled steps).
  function segmentBlocked(x1, y1, x2, y2, rects) {
    var dx = x2 - x1, dy = y2 - y1;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var steps = Math.max(1, Math.ceil(dist / 8));
    for (var i = 1; i < steps; i++) {
      var t = i / steps;
      var px = x1 + dx * t, py = y1 + dy * t;
      for (var j = 0; j < rects.length; j++) {
        if (pointInRect(px, py, rects[j])) return true;
      }
    }
    return false;
  }

  // Everything that blocks movement and sight in a level.
  function blockers(level) {
    var list = level.walls.slice();
    for (var i = 0; i < level.covers.length; i++) {
      var c = level.covers[i];
      list.push({ x: c.x, y: c.y, w: c.w, h: c.h });
    }
    if (level.caseBox) list.push(level.caseBox);
    return list;
  }

  function freshLevel(index) {
    // Deep-copy so a retry starts clean (coins/loot reset).
    return JSON.parse(JSON.stringify(LEVELS[index]));
  }

  return {
    LEVELS: LEVELS,
    bounds: bounds,
    pointInRect: pointInRect,
    collideCircle: collideCircle,
    segmentBlocked: segmentBlocked,
    blockers: blockers,
    freshLevel: freshLevel
  };
})();
