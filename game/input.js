// input.js — keyboard + mouse state for Starlight Vault.
// Tracks held keys and one-frame "just pressed" edges the game consumes.
var Input = (function () {
  var held = {};
  var pressed = {};
  var mouse = { x: 0, y: 0, clicked: false };

  function key(e) { return (e.key || "").toLowerCase(); }

  window.addEventListener("keydown", function (e) {
    var k = key(e);
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].indexOf(k) !== -1) e.preventDefault();
    if (!held[k]) pressed[k] = true;
    held[k] = true;
    AudioSys.unlockAudio();
  });
  window.addEventListener("keyup", function (e) { held[key(e)] = false; });
  window.addEventListener("blur", function () { held = {}; });
  window.addEventListener("mousemove", function (e) {
    var c = document.getElementById("game");
    if (!c) return;
    var r = c.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (c.width / r.width);
    mouse.y = (e.clientY - r.top) * (c.height / r.height);
  });
  window.addEventListener("mousedown", function (e) {
    if (e.button === 0) { mouse.clicked = true; AudioSys.unlockAudio(); }
  });

  return {
    held: held,
    mouse: mouse,
    // True only on the frame the key went down.
    wasPressed: function (k) { return !!pressed[k.toLowerCase()]; },
    isDown: function (k) { return !!held[k.toLowerCase()]; },
    moveX: function () {
      var x = 0;
      if (held["a"] || held["arrowleft"]) x -= 1;
      if (held["d"] || held["arrowright"]) x += 1;
      return x;
    },
    moveY: function () {
      var y = 0;
      if (held["w"] || held["arrowup"]) y -= 1;
      if (held["s"] || held["arrowdown"]) y += 1;
      return y;
    },
    sneaking: function () { return !!held["shift"]; },
    // Called once per frame after the game has read the edges.
    endFrame: function () { pressed = {}; mouse.clicked = false; }
  };
})();
