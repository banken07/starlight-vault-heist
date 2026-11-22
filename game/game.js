// game.js — Starlight Vault: state machine, alarm meter, detection,
// lockpicking, level flow and the main loop. Everything else is a module
// this file wires together.
var Game = (function () {
  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");

  var s = {
    screen: "menu", // menu | play | levelclear | caught | win
    levelIndex: 0,
    level: null,
    guards: [],
    cameras: [],
    player: null,
    tools: null,
    blockers: [],
    alarm: 0,
    callout: "",
    calloutT: 0,
    calloutHint: "reach the loot without being seen",
    time: 0,
    timeText: "00:00",
    frozen: false,
    grace: 0, // seconds of halved suspicion after first being spotted
    seenBefore: false,
    alarmTick: 0,
    snapshot: null // coins / loot / tools at level entry, for retries
  };
  window.GameState = s;

  function fmtTime(sec) {
    var m = Math.floor(sec / 60), ss = Math.floor(sec % 60);
    return (m < 10 ? "0" + m : m) + ":" + (ss < 10 ? "0" + ss : ss);
  }

  function say(text, seconds) {
    s.callout = text;
    s.calloutT = seconds || 3;
  }

  function loadLevel(index, keepPlayer) {
    s.levelIndex = index;
    s.level = Rooms.freshLevel(index);
    s.guards = Guards.create(s.level.guards);
    s.cameras = Cameras.create(s.level.cameras);
    s.tools = Tools.create();
    s.blockers = Rooms.blockers(s.level);
    s.alarm = 0;
    s.grace = 0;
    s.seenBefore = false;
    if (!keepPlayer) {
      s.player = Player.create(s.level.start);
      s.player.coins = 5;
    } else {
      s.player.x = s.level.start[0];
      s.player.y = s.level.start[1];
    }
    s.snapshot = {
      coins: s.player.coins,
      loot: s.player.loot.slice(),
      tools: { lockpick: s.tools.lockpick, smoke: s.tools.smoke, lenscap: s.tools.lenscap }
    };
    s.calloutHint = s.levelIndex === 2
      ? "take the diamond, then zipline out"
      : s.levelIndex === 1
      ? "the telescope blocks sight — use it"
      : "sneak with SHIFT · smoke hides you";
    say(s.level.name + " — " + s.level.subtitle, 4);
  }

  function retryLevel() {
    var snap = s.snapshot;
    loadLevel(s.levelIndex, true);
    s.player.coins = snap.coins;
    s.player.loot = snap.loot.slice();
    s.tools.lockpick = snap.tools.lockpick;
    s.tools.smoke = snap.tools.smoke;
    s.tools.lenscap = snap.tools.lenscap;
    s.screen = "play";
    say("TRY AGAIN — " + s.level.name, 3);
  }

  function startHeist() {
    s.time = 0;
    loadLevel(0, false);
    s.screen = "play";
  }

  function nextLevel() {
    if (s.levelIndex + 1 >= Rooms.LEVELS.length) {
      s.screen = "win";
      AudioSys.win();
      return;
    }
    loadLevel(s.levelIndex + 1, true);
    s.screen = "play";
  }

  function alarmLabel() {
    return Render.alarmState(s.alarm).label;
  }

  function update(dt) {
    if (s.screen !== "play" || s.frozen) return;
    s.time += dt;
    s.timeText = fmtTime(s.time);
    if (s.calloutT > 0) s.calloutT -= dt;
    if (s.grace > 0) s.grace -= dt;

    var p = s.player;
    Player.update(p, dt, s.blockers, Rooms.bounds());
    var got = Player.collectCoins(p, s.level);
    if (got > 0) { AudioSys.coin(); say("COIN +5 — " + p.coins + " coins in pocket", 2); }

    var inSmoke = Tools.inSmoke(s.tools, p.x, p.y);
    var prevAlarm = s.alarm;
    var anyoneSees = false;

    // Guards see the thief.
    for (var i = 0; i < s.guards.length; i++) {
      var g = s.guards[i];
      var seen = Guards.canSee(g, p.x, p.y, s.blockers, inSmoke);
      if (seen) {
        anyoneSees = true;
        g.lastSeen = [p.x, p.y];
        g.seenFlash = 0.5;
        var gain = 24 * dt * (Input.sneaking() ? 0.5 : 1) * (s.grace > 0 ? 0.5 : 1);
        s.alarm = Math.min(100, s.alarm + gain);
        if (!s.seenBefore) {
          s.seenBefore = true;
          s.grace = 1.2;
          say("SPOTTED — BREAK LINE OF SIGHT!", 2.5);
          AudioSys.spotted();
        }
        if (s.alarm >= 75) g.state = "chase";
        else if (s.alarm >= 50) g.state = "investigate";
      }
    }
    // Cameras see the thief.
    for (var j = 0; j < s.cameras.length; j++) {
      var c = s.cameras[j];
      if (Cameras.canSee(c, p.x, p.y, s.blockers, inSmoke)) {
        anyoneSees = true;
        var cgain = 20 * dt * (Input.sneaking() ? 0.5 : 1) * (s.grace > 0 ? 0.5 : 1);
        s.alarm = Math.min(100, s.alarm + cgain);
        if (!s.seenBefore) {
          s.seenBefore = true;
          s.grace = 1.2;
          say("CAMERA HAS YOU — GET OUT OF THE CONE!", 2.5);
          AudioSys.spotted();
        }
        // A camera that sees you tells the guards where you are.
        for (var k = 0; k < s.guards.length; k++) {
          s.guards[k].lastSeen = [p.x, p.y];
          if (s.alarm >= 50) s.guards[k].state = "investigate";
          if (s.alarm >= 75) s.guards[k].state = "chase";
        }
      }
    }
    if (!anyoneSees) {
      s.alarm = Math.max(0, s.alarm - 9 * dt);
      if (s.alarm < 25) s.seenBefore = false; // calm again: next spot warns again
    }
    // Alarm threshold callouts.
    if (prevAlarm < 25 && s.alarm >= 25) say("THE WATCH IS UNEASY…", 2.5);
    if (prevAlarm < 50 && s.alarm >= 50) { say("HUNTED — THEY ARE SEARCHING FOR YOU", 3); AudioSys.alarmLoop(); }
    if (prevAlarm < 75 && s.alarm >= 75) { say("ALARM! RUN — OR HIDE IN SMOKE!", 3); AudioSys.alarmLoop(); }
    if (s.alarm >= 75) {
      s.alarmTick += dt;
      if (s.alarmTick > 0.6) { s.alarmTick = 0; AudioSys.alarmLoop(); }
    }

    Guards.update(s.guards, p, s.level, s.blockers, dt, s.alarm);
    Cameras.update(s.cameras, dt);
    var resealed = Tools.update(s.tools, dt);
    if (resealed === "resealed") say("THE CASE RESEALED — PICK IT AGAIN", 3);

    // Lockpicking the glass case.
    if (s.tools.lockpicking > 0 && s.tools.lockpicking < 1) {
      if (!Player.nearCase(p, s.level)) {
        s.tools.lockpicking = 0;
        say("LOCKPICKING STOPPED — STAY BY THE CASE", 2.5);
      } else {
        s.tools.lockpicking += dt / 1.5;
        if (Math.random() < dt * 6) AudioSys.lockpickTick();
        if (s.tools.lockpicking >= 1) {
          s.tools.lockpicking = 0;
          s.tools.caseOpen = true;
          s.tools.reseal = 10;
          AudioSys.unlock();
          say("LOCKPICKED — 10s BEFORE RESEAL", 3);
        }
      }
    }

    // Interactions.
    if (Input.wasPressed("e")) {
      if (s.level.caseBox && Player.nearCase(p, s.level) && !s.tools.caseOpen && s.tools.lockpicking === 0) {
        if (s.tools.lockpick > 0) {
          s.tools.lockpick -= 1;
          s.tools.lockpicking = 0.01;
          say("LOCKPICKING… STAY STILL", 2);
        } else {
          AudioSys.denied();
          say("THE CASE IS LOCKED — BUY A LOCKPICK [1] (10 COINS)", 3);
        }
      } else if (s.level.caseBox && s.tools.caseOpen && Player.nearCase(p, s.level)) {
        takeLoot();
      } else if (Player.nearLoot(p, s.level)) {
        takeLoot();
      } else if (Player.nearExit(p, s.level)) {
        if (s.level.loot.taken) {
          if (s.levelIndex === 2) { s.screen = "win"; AudioSys.win(); }
          else { s.screen = "levelclear"; AudioSys.unlock(); }
        } else {
          AudioSys.denied();
          say("TAKE THE LOOT FIRST — " + s.level.loot.name, 2.5);
        }
      }
    }

    // Tools: buy with 1/2/3, use with Q (smoke) and C (lens cap).
    if (Input.wasPressed("1")) say(Tools.buy(p, s.tools, "lockpick"), 2.5);
    if (Input.wasPressed("2")) say(Tools.buy(p, s.tools, "smoke"), 2.5);
    if (Input.wasPressed("3")) say(Tools.buy(p, s.tools, "lenscap"), 2.5);
    if (Input.wasPressed("q")) say(Tools.useSmoke(p, s.tools), 2.5);
    if (Input.wasPressed("c")) say(Tools.useLensCap(p, s.tools, s.cameras), 2.5);
    if (Input.wasPressed("m")) {
      var on = AudioSys.toggle();
      say(on ? "SOUND ON" : "SOUND OFF", 1.5);
    }
    if (Input.wasPressed("r")) retryLevel();

    // Caught: a chasing guard reaches the thief.
    for (var m = 0; m < s.guards.length; m++) {
      var cg = s.guards[m];
      if (cg.state === "chase") {
        var dx = cg.x - p.x, dy = cg.y - p.y;
        if (dx * dx + dy * dy < 24 * 24) {
          s.screen = "caught";
          AudioSys.caught();
          return;
        }
      }
    }
  }

  function takeLoot() {
    var l = s.level.loot;
    l.taken = true;
    s.player.loot.push(l.name);
    AudioSys.pickup();
    if (l.kind === "diamond") say("THE COMET DIAMOND IS YOURS — TO THE ZIPLINE!", 4);
    else say(l.name + " SECURED — NOW THE EAST DOOR", 3);
  }

  function keyRouter() {
    if (Input.wasPressed("enter")) {
      if (s.screen === "menu") startHeist();
      else if (s.screen === "levelclear") nextLevel();
      else if (s.screen === "win") startHeist();
      else if (s.screen === "caught") startHeist();
    }
    // R retries the room straight from the caught screen (update() is
    // paused there, so the in-game R handler cannot hear it).
    if (Input.wasPressed("r") && s.screen === "caught") retryLevel();
    if (Input.mouse.clicked && s.screen === "menu") startHeist();
  }

  var last = 0, t = 0;
  function frame(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
    last = ts;
    t += dt;
    keyRouter();
    update(dt);
    Render.draw(ctx, s, t);
    Input.endFrame();
    requestAnimationFrame(frame);
  }

  // Boot: menu screen, then stage a screenshot scene if ?shot=N is set.
  s.level = Rooms.freshLevel(0);
  s.guards = Guards.create(s.level.guards);
  s.cameras = Cameras.create(s.level.cameras);
  s.player = Player.create(s.level.start);
  s.tools = Tools.create();
  s.blockers = Rooms.blockers(s.level);
  Shots.apply(s, loadLevel, say);
  requestAnimationFrame(frame);

  return { state: s, loadLevel: loadLevel, startHeist: startHeist };
})();
