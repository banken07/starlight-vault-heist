// shots.js — stages the four screenshot scenes from the game itself.
// ?shot=1..4 in the URL freezes a real gameplay moment so the screenshots
// are renders of the game's own code, never composites.
var Shots = (function () {
  function param(name) {
    var m = window.location.search.match(new RegExp("[?&]" + name + "=(\\d+)"));
    return m ? parseInt(m[1], 10) : 0;
  }

  function apply(s, loadLevel, say) {
    var n = param("shot");
    if (!n) return;
    s.frozen = true;
    s.screen = "play";
    if (n === 1) {
      // COVER: the Star Vault, full room — the Comet Diamond glowing in
      // its glass case centre-frame, a red camera cone sweeping across
      // the case, guard Mara + yellow cone on the left, alarm UNEASY.
      loadLevel(2, false);
      s.player.loot = ["STAR CHART", "BRASS KEY"];
      s.player.x = 580; s.player.y = 590;
      s.player.coins = 20;
      s.tools.smoke = 1; // bought for 15 coins: 5 start + 6 coins here
      s.cameras[0].y = 140; // label clear of the callout, cone fully in frame
      s.cameras[0].angle = 1.23; // red cone sweeping down across the glass case
      s.guards[0].x = 340; s.guards[0].y = 420; s.guards[0].angle = 0.3;
      s.guards[1].x = 1080; s.guards[1].y = 580; s.guards[1].angle = Math.PI;
      s.timeText = "02:47";
      s.alarm = 38;
      s.callout = "THE STAR VAULT — READ THE CONES BEFORE YOU MOVE";
      s.calloutT = 999;
      s.frozen = true;
    } else if (n === 2) {
      // Camera sweeping while the thief waits behind the bookcase.
      loadLevel(0, false);
      s.player.x = 375; s.player.y = 235;
      s.player.coins = 2;
      s.tools.lenscap = 1; // bought for 8 coins: 5 start + 1 coin here
      s.cameras[0].t = 2.4; // sweep the cone across the room
      s.cameras[0].angle = s.cameras[0].base + Math.sin(2.4 * s.cameras[0].speed) * s.cameras[0].sweep;
      s.guards[0].y = 175; // tag clear of the callout
      s.timeText = "00:48";
      s.alarm = 8;
      s.callout = "CAMERA SWEEPING — WAIT FOR IT TO PASS";
      s.calloutT = 999;
      s.frozen = true;
    } else if (n === 3) {
      // Lockpick on the glass case, alarm UNEASY, case just opened.
      loadLevel(2, false);
      s.player.x = 738; s.player.y = 565; // clear of the RESEALS label
      s.player.coins = 15;
      s.tools.lockpick = 0;
      s.tools.caseOpen = true;
      s.tools.reseal = 9;
      s.guards[0].y = 175; // tag clear of the callout
      s.guards[1].x = 1080; s.guards[1].y = 580; s.guards[1].angle = Math.PI; // cone fully in frame
      s.timeText = "03:12";
      s.alarm = 38;
      s.callout = "LOCKPICKED — 10s BEFORE RESEAL";
      s.calloutT = 999;
      s.frozen = true;
    } else if (n === 4) {
      // Zipline getaway with the Comet Diamond, alarm HUNTED.
      loadLevel(2, false);
      s.level.loot.taken = true;
      s.player.loot = ["STAR CHART", "BRASS KEY", "COMET DIAMOND"];
      s.player.x = 1130; s.player.y = 150; // beside the zipline, label inside frame
      s.player.coins = 25;
      s.tools.smoke = 1;
      s.timeText = "04:05";
      s.alarm = 65;
      for (var i = 0; i < s.guards.length; i++) {
        s.guards[i].state = "chase";
        s.guards[i].lastSeen = [s.player.x, s.player.y];
      }
      s.guards[0].x = 980; s.guards[0].y = 200; s.guards[0].angle = -0.32;
      s.guards[1].x = 1060; s.guards[1].y = 320; s.guards[1].angle = -1.18;
      s.callout = "ZIPLINE — GO! GO! GO!";
      s.calloutT = 999;
      s.frozen = true;
    }
    // Keep the alarm meter and callout visible: frozen scenes never decay.
    if (say) say(s.callout, 999);
  }

  return { apply: apply, param: param };
})();
