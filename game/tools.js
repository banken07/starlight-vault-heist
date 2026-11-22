// tools.js — the thief's tools, all bought with coins picked up in the rooms.
//   [1] lockpick (10 coins) — opens the glass case in the Star Vault
//   [2] smoke bomb (15 coins) — a cloud that hides you from cones for 6s
//   [3] lens cap (8 coins) — blinds the nearest camera for 10s
// Buying is instant; using smoke is [Q] and the lens cap is [C].
var Tools = (function () {
  var DEFS = {
    lockpick: { key: "1", cost: 10, name: "LOCKPICK" },
    smoke: { key: "2", cost: 15, name: "SMOKE BOMB" },
    lenscap: { key: "3", cost: 8, name: "LENS CAP" }
  };
  var SMOKE_RADIUS = 95;
  var SMOKE_SECONDS = 6;

  function create() {
    return {
      lockpick: 0,
      smoke: 0,
      lenscap: 0,
      clouds: [], // {x, y, t} active smoke clouds
      lockpicking: 0, // 0..1 progress on the glass case, 0 = not picking
      caseOpen: false,
      reseal: 0 // seconds left before the open case reseals
    };
  }

  // Try to buy one tool. Returns a message for the callout line.
  function buy(player, tools, kind) {
    var def = DEFS[kind];
    if (player.coins < def.cost) {
      AudioSys.denied();
      return "NOT ENOUGH COINS — " + def.name + " costs " + def.cost + " (you have " + player.coins + ")";
    }
    player.coins -= def.cost;
    tools[kind] += 1;
    AudioSys.buy();
    return def.name + " BOUGHT — " + tools[kind] + " in pocket";
  }

  function useSmoke(player, tools) {
    if (tools.smoke <= 0) { AudioSys.denied(); return "NO SMOKE LEFT — buy one with [2] (15 coins)"; }
    tools.smoke -= 1;
    tools.clouds.push({ x: player.x, y: player.y, t: SMOKE_SECONDS });
    AudioSys.smoke();
    return "SMOKE OUT — cones cannot see you for 6s";
  }

  function useLensCap(player, tools, cameras) {
    if (tools.lenscap <= 0) { AudioSys.denied(); return "NO LENS CAP LEFT — buy one with [3] (8 coins)"; }
    var cam = Cameras.blindNearest(cameras, player.x, player.y, 300);
    if (!cam) { AudioSys.denied(); return "NO CAMERA IN REACH — get closer first"; }
    tools.lenscap -= 1;
    AudioSys.unlock();
    return "CAMERA BLINDED — 10s of darkness";
  }

  function inSmoke(tools, x, y) {
    for (var i = 0; i < tools.clouds.length; i++) {
      var c = tools.clouds[i];
      var dx = x - c.x, dy = y - c.y;
      if (dx * dx + dy * dy < SMOKE_RADIUS * SMOKE_RADIUS) return true;
    }
    return false;
  }

  function update(tools, dt) {
    for (var i = tools.clouds.length - 1; i >= 0; i--) {
      tools.clouds[i].t -= dt;
      if (tools.clouds[i].t <= 0) tools.clouds.splice(i, 1);
    }
    if (tools.caseOpen) {
      tools.reseal -= dt;
      if (tools.reseal <= 0) {
        tools.caseOpen = false;
        return "resealed";
      }
    }
    return null;
  }

  return {
    DEFS: DEFS,
    create: create,
    buy: buy,
    useSmoke: useSmoke,
    useLensCap: useLensCap,
    inSmoke: inSmoke,
    update: update,
    SMOKE_RADIUS: SMOKE_RADIUS,
    SMOKE_SECONDS: SMOKE_SECONDS
  };
})();
