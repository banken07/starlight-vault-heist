// render.js — draws the whole game on one canvas: the night observatory,
// the guards and their cones, the cameras, the loot, the HUD with the alarm
// meter, the legend panel, callouts, and the menu / caught / win screens.
// Art is all code: no images, no network.
var Render = (function () {
  var W = 1280, H = 800;
  var stars = [];
  (function () {
    var s = 1234567;
    function rnd() { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }
    for (var i = 0; i < 130; i++) {
      stars.push({ x: 196 + rnd() * 1084, y: 56 + rnd() * 744, r: 0.6 + rnd() * 1.4, a: 0.25 + rnd() * 0.6 });
    }
  })();

  function alarmState(alarm) {
    if (alarm >= 75) return { label: "ALARM", color: "#ff3b30" };
    if (alarm >= 50) return { label: "HUNTED", color: "#ff9500" };
    if (alarm >= 25) return { label: "UNEASY", color: "#ffd60a" };
    return { label: "CALM", color: "#34c759" };
  }

  function conePath(ctx, x, y, angle, half, range) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, range, angle - half, angle + half);
    ctx.closePath();
  }

  function drawCone(ctx, x, y, angle, half, range, color, alpha) {
    ctx.save();
    conePath(ctx, x, y, angle, half, range);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.globalAlpha = alpha * 0.5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  function drawFloor(ctx, bounds) {
    ctx.fillStyle = "#0d1120";
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    // Dark marble tiles.
    ctx.strokeStyle = "rgba(120, 140, 200, 0.10)";
    ctx.lineWidth = 1;
    for (var x = bounds.x; x <= bounds.x + bounds.w; x += 90) {
      ctx.beginPath(); ctx.moveTo(x, bounds.y); ctx.lineTo(x, bounds.y + bounds.h); ctx.stroke();
    }
    for (var y = bounds.y; y <= bounds.y + bounds.h; y += 90) {
      ctx.beginPath(); ctx.moveTo(bounds.x, y); ctx.lineTo(bounds.x + bounds.w, y); ctx.stroke();
    }
    // Starlight speckles through the dome glass.
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      ctx.fillStyle = "rgba(190, 210, 255, " + s.a + ")";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawWalls(ctx, level) {
    var b = Rooms.bounds();
    ctx.fillStyle = "#1c2340";
    ctx.fillRect(b.x - 6, b.y - 6, b.w + 12, 6);
    ctx.fillRect(b.x - 6, b.y + b.h, b.w + 12, 6);
    ctx.fillRect(b.x - 6, b.y, 6, b.h);
    ctx.fillRect(b.x + b.w, b.y, 6, b.h);
    ctx.fillStyle = "#c9a227";
    ctx.fillRect(b.x - 6, b.y - 6, b.w + 12, 2);
    ctx.fillRect(b.x - 6, b.y + b.h + 4, b.w + 12, 2);
    for (var i = 0; i < level.walls.length; i++) {
      var w = level.walls[i];
      ctx.fillStyle = "#232c4d";
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = "#c9a227";
      ctx.lineWidth = 2;
      ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
    }
  }

  function drawCovers(ctx, level) {
    for (var i = 0; i < level.covers.length; i++) {
      var c = level.covers[i];
      if (c.kind === "scope") {
        // The great brass telescope: dome base + long tube.
        ctx.fillStyle = "#3a2f16";
        ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 62, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#c9a227"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 62, 0, Math.PI * 2); ctx.stroke();
        ctx.save();
        ctx.translate(c.x + c.w / 2, c.y + c.h / 2);
        ctx.rotate(-0.6);
        ctx.fillStyle = "#8a6d2b";
        ctx.fillRect(-110, -16, 220, 32);
        ctx.fillStyle = "#e8c85a";
        ctx.fillRect(88, -20, 26, 40);
        ctx.restore();
      } else {
        ctx.fillStyle = c.kind === "table" ? "#4a3520" : c.kind === "shelf" ? "#2e3a5c" : "#54401e";
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeStyle = "#c9a227"; ctx.lineWidth = 2;
        ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
      }
      ctx.fillStyle = "rgba(220, 200, 140, 0.9)";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(c.label, c.x + c.w / 2, c.y + c.h / 2 + 4);
    }
  }

  function drawLoot(ctx, level, t) {
    var l = level.loot;
    if (l.taken) return;
    var pulse = 1 + Math.sin(t * 3) * 0.12;
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.shadowColor = "#ffd60a";
    ctx.shadowBlur = 18;
    if (l.kind === "diamond") {
      ctx.scale(pulse, pulse);
      ctx.fillStyle = "#aee6ff";
      ctx.beginPath();
      ctx.moveTo(0, -20); ctx.lineTo(16, 0); ctx.lineTo(0, 20); ctx.lineTo(-16, 0);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(0, -20); ctx.lineTo(8, 0); ctx.lineTo(0, 20); ctx.lineTo(-8, 0);
      ctx.closePath(); ctx.fill();
    } else if (l.kind === "key") {
      ctx.fillStyle = "#e8c85a";
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(6, -3, 18, 6);
      ctx.fillRect(18, 3, 4, 8); ctx.fillRect(12, 3, 4, 6);
    } else {
      ctx.fillStyle = "#f5e6b8";
      ctx.fillRect(-16, -11, 32, 22);
      ctx.strokeStyle = "#c9a227"; ctx.lineWidth = 2;
      ctx.strokeRect(-16, -11, 32, 22);
      ctx.strokeStyle = "#8a6d2b";
      ctx.beginPath(); ctx.moveTo(-16, 0); ctx.quadraticCurveTo(0, -12, 16, 2); ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = "#ffd60a";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("★ " + l.name + " ★", l.x, l.y - 30);
  }

  function drawCase(ctx, level, tools, t) {
    if (!level.caseBox) return;
    var c = level.caseBox;
    ctx.save();
    if (tools.caseOpen) {
      ctx.strokeStyle = "#34c759";
      ctx.shadowColor = "#34c759"; ctx.shadowBlur = 14;
    } else {
      ctx.strokeStyle = "#aee6ff";
      ctx.shadowColor = "#aee6ff"; ctx.shadowBlur = 10;
    }
    ctx.lineWidth = 3;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = "rgba(174, 230, 255, 0.08)";
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.restore();
    ctx.fillStyle = "#e8f6ff";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    if (level.loot.taken) ctx.fillText("GLASS CASE — EMPTIED", c.x + c.w / 2, c.y - 10);
    else ctx.fillText(tools.caseOpen ? "CASE OPEN — TAKE IT!" : "GLASS CASE — LOCKPICK [E]", c.x + c.w / 2, c.y - 10);
    if (tools.lockpicking > 0 && tools.lockpicking < 1) {
      var bw = 110;
      ctx.fillStyle = "#111";
      ctx.fillRect(c.x + c.w / 2 - bw / 2, c.y + c.h + 8, bw, 10);
      ctx.fillStyle = "#ffd60a";
      ctx.fillRect(c.x + c.w / 2 - bw / 2, c.y + c.h + 8, bw * tools.lockpicking, 10);
      ctx.fillStyle = "#fff";
      ctx.font = "11px sans-serif";
      ctx.fillText("LOCKPICKING…", c.x + c.w / 2, c.y + c.h + 32);
    }
    if (tools.caseOpen) {
      ctx.fillStyle = "#34c759";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("RESEALS IN " + Math.ceil(tools.reseal) + "s", c.x + c.w / 2, c.y + c.h + 24);
    }
  }

  function drawExit(ctx, level, hasLoot, t) {
    var e = level.exit;
    var glow = hasLoot ? 0.6 + Math.sin(t * 4) * 0.3 : 0.25;
    ctx.save();
    ctx.shadowColor = hasLoot ? "#34c759" : "#888";
    ctx.shadowBlur = 18;
    ctx.fillStyle = hasLoot ? "#1d5c2e" : "#222";
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.restore();
    ctx.strokeStyle = hasLoot ? "#34c759" : "#666";
    ctx.lineWidth = 3;
    ctx.strokeRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = hasLoot ? "#b8ffc9" : "#999";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    if (level.exitLabel === "ZIPLINE") {
      // Zipline cable running off the roof to the night sky.
      ctx.strokeStyle = "#c9a227";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(e.x + e.w / 2, e.y + e.h / 2); ctx.lineTo(1256, 64); ctx.stroke();
      ctx.textAlign = "right";
      ctx.fillText("ZIPLINE →", 1254, e.y + e.h + 20);
      ctx.fillText(hasLoot ? "GO! GO! GO!" : "NEED THE DIAMOND", 1254, e.y - 8);
      ctx.textAlign = "center";
    } else {
      // The east door is flush with the right edge: label it well to its
      // left, anchored inside the canvas with a clear gap from the door.
      ctx.textAlign = "right";
      ctx.fillText("◀ " + level.exitLabel, e.x - 26, e.y + e.h / 2 + 5);
      if (!hasLoot) {
        ctx.fillStyle = "#ccc";
        ctx.font = "11px sans-serif";
        ctx.fillText("NEED THE LOOT", e.x - 26, e.y - 8);
      }
      ctx.textAlign = "center";
    }
  }

  function drawCoins(ctx, level, t) {
    for (var i = 0; i < level.coins.length; i++) {
      var c = level.coins[i];
      var bob = Math.sin(t * 2 + i) * 2;
      ctx.save();
      ctx.shadowColor = "#ffd60a"; ctx.shadowBlur = 8;
      ctx.fillStyle = "#ffd60a";
      ctx.beginPath(); ctx.arc(c[0], c[1] + bob, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#8a6d2b";
      ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("¢", c[0], c[1] + bob + 3);
      ctx.restore();
    }
  }

  function drawGuards(ctx, guards, t) {
    for (var i = 0; i < guards.length; i++) {
      var g = guards[i];
      var alert = g.state === "chase";
      var coneColor = alert ? "#ff3b30" : g.state === "investigate" ? "#ff9500" : "#ffd60a";
      drawCone(ctx, g.x, g.y, g.angle, Guards.CONE_HALF, Guards.CONE_RANGE, coneColor, alert ? 0.30 : 0.18);
      // Guard body: night-watch uniform, brass buttons, lantern glow.
      ctx.save();
      ctx.shadowColor = "#ffb340"; ctx.shadowBlur = 10;
      ctx.fillStyle = "#2b3a6e";
      ctx.beginPath(); ctx.arc(g.x, g.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#ffd60a";
      ctx.beginPath(); ctx.arc(g.x, g.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#e8c85a"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x + Math.cos(g.angle) * 20, g.y + Math.sin(g.angle) * 20); ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      var tag = g.name + " · " + (g.state === "patrol" ? "PATROL" : g.state === "investigate" ? "SEARCHING ?" : "CHASING !");
      ctx.fillText(tag, g.x, g.y - 22);
    }
  }

  function drawCameras(ctx, cameras) {
    for (var i = 0; i < cameras.length; i++) {
      var c = cameras[i];
      var blind = c.blind > 0;
      var color = blind ? "#888" : "#ff5a4e";
      if (!blind) drawCone(ctx, c.x, c.y, c.angle, Cameras.CONE_HALF, c.range, "#ff5a4e", 0.16);
      ctx.save();
      ctx.shadowColor = blind ? "#666" : "#ff5a4e"; ctx.shadowBlur = 10;
      ctx.fillStyle = "#8a6d2b";
      ctx.beginPath(); ctx.arc(c.x, c.y, 13, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = blind ? "#555" : "#ff3b30";
      ctx.beginPath(); ctx.arc(c.x, c.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(blind ? "CAMERA · BLIND " + Math.ceil(c.blind) + "s" : "CAMERA", c.x, c.y - 20);
    }
  }

  function drawPlayer(ctx, player, t) {
    var p = player;
    ctx.save();
    ctx.shadowColor = "#7fb2ff"; ctx.shadowBlur = 12;
    ctx.fillStyle = "#10182e";
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Starlight-trimmed hood + cloak direction.
    ctx.strokeStyle = "#7fb2ff"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, p.face - 1.1, p.face + 1.1); ctx.stroke();
    ctx.fillStyle = "#dfe9ff";
    ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
    // Keep the tag inside the canvas: the thief can walk to the edge.
    var lx = Math.max(250, Math.min(p.x, 1225));
    ctx.fillText("YOU · THIEF", lx, p.y - 22);
  }

  function drawSmoke(ctx, tools) {
    for (var i = 0; i < tools.clouds.length; i++) {
      var c = tools.clouds[i];
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = "#9aa3b5";
      ctx.beginPath(); ctx.arc(c.x, c.y, Tools.SMOKE_RADIUS, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.3;
      ctx.beginPath(); ctx.arc(c.x - 20, c.y + 10, 50, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#dfe3ea";
      ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("SMOKE " + Math.ceil(c.t) + "s", c.x, c.y - Tools.SMOKE_RADIUS - 6);
    }
  }

  function drawHUD(ctx, s) {
    var a = alarmState(s.alarm);
    ctx.fillStyle = "#0a0e1c";
    ctx.fillRect(0, 0, W, 56);
    ctx.fillStyle = "#c9a227";
    ctx.fillRect(0, 54, W, 2);
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffd60a";
    ctx.font = "bold 17px sans-serif";
    ctx.fillText("★ STARLIGHT VAULT", 12, 24);
    ctx.fillStyle = "#cdd6f4";
    ctx.font = "12px sans-serif";
    ctx.fillText(s.level.name, 12, 43);
    // Objective.
    ctx.fillStyle = "#9fb2e8";
    ctx.font = "13px sans-serif";
    ctx.fillText("OBJECTIVE: " + s.level.objective, 250, 24);
    ctx.fillStyle = "#8a93b8";
    ctx.font = "12px sans-serif";
    var lootShort = s.player.loot.length ? s.player.loot[s.player.loot.length - 1] : "—";
    ctx.fillText("Loot " + s.player.loot.length + "/3: " + lootShort + "   •   " + s.calloutHint, 250, 43);
    // Alarm meter.
    var mx = 800, mw = 200;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("ALARM", mx - 58, 24);
    ctx.fillStyle = "#1a2138";
    ctx.fillRect(mx, 12, mw, 16);
    ctx.fillStyle = a.color;
    ctx.fillRect(mx, 12, mw * Math.min(1, s.alarm / 100), 16);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1;
    ctx.strokeRect(mx, 12, mw, 16);
    ctx.fillStyle = a.color;
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(a.label + " " + Math.round(s.alarm), mx, 44);
    // Coins / tools / timer.
    ctx.fillStyle = "#ffd60a";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("◉ " + s.player.coins + " coins", 1268, 24);
    ctx.fillStyle = "#cdd6f4";
    ctx.font = "12px sans-serif";
    ctx.fillText("🔒" + s.tools.lockpick + "  💨" + s.tools.smoke + "  ◎" + s.tools.lenscap + "    ⏱ " + s.timeText, 1268, 43);
    ctx.textAlign = "left";
  }

  function drawLegend(ctx, s) {
    ctx.fillStyle = "#0a0e1c";
    ctx.fillRect(0, 56, 196, H - 56);
    ctx.fillStyle = "#c9a227";
    ctx.fillRect(194, 56, 2, H - 56);
    var x = 12, y = 84;
    ctx.fillStyle = "#ffd60a";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("LEGEND", x, y); y += 26;
    var rows = [
      ["#ffd60a", "Guard cone — danger"],
      ["#ff5a4e", "Camera cone — danger"],
      ["#7fb2ff", "Blue trim — YOU, thief"],
      ["#3a2f16", "Brass cover — hides you"],
      ["#ffd60a", "★ Gold — loot & coins"],
      ["#34c759", "Green door — exit / zipline"]
    ];
    ctx.font = "12px sans-serif";
    for (var i = 0; i < rows.length; i++) {
      ctx.fillStyle = rows[i][0];
      ctx.fillRect(x, y - 10, 14, 14);
      ctx.fillStyle = "#cdd6f4";
      ctx.fillText(rows[i][1], x + 20, y + 2);
      y += 24;
    }
    y += 10;
    ctx.fillStyle = "#ffd60a";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("CONTROLS", x, y); y += 24;
    ctx.fillStyle = "#cdd6f4";
    ctx.font = "12px sans-serif";
    var controls = [
      "WASD / arrows — move",
      "SHIFT — sneak (slow, quiet)",
      "E — take loot / use door",
      "[1] lockpick · 10 coins",
      "[2] smoke bomb · 15 coins",
      "[3] lens cap · 8 coins",
      "Q — throw smoke",
      "C — cap nearest camera",
      "M — mute · R — retry level"
    ];
    for (var j = 0; j < controls.length; j++) { ctx.fillText(controls[j], x, y); y += 22; }
    y += 10;
    ctx.fillStyle = "#ffd60a";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("TOOLS IN POCKET", x, y); y += 24;
    ctx.fillStyle = "#cdd6f4";
    ctx.font = "12px sans-serif";
    ctx.fillText("Lockpick × " + s.tools.lockpick, x, y); y += 20;
    ctx.fillText("Smoke × " + s.tools.smoke, x, y); y += 20;
    ctx.fillText("Lens cap × " + s.tools.lenscap, x, y); y += 20;
    y += 12;
    ctx.fillStyle = "#8a93b8";
    ctx.font = "11px sans-serif";
    ctx.fillText("Tip: cones you can read", x, y); y += 16;
    ctx.fillText("before you move. Wait", x, y); y += 16;
    ctx.fillText("for the sweep to pass.", x, y);
  }

  function drawCallout(ctx, s) {
    if (!s.callout || s.calloutT <= 0) return;
    var alpha = Math.min(1, s.calloutT);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = "bold 19px sans-serif";
    var w = ctx.measureText(s.callout).width + 36;
    ctx.fillStyle = "rgba(5, 8, 18, 0.85)";
    ctx.fillRect(W / 2 - w / 2, 66, w, 36);
    ctx.strokeStyle = "#c9a227"; ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - w / 2, 66, w, 36);
    ctx.fillStyle = "#ffe98a";
    ctx.textAlign = "center";
    ctx.fillText(s.callout, W / 2, 90);
    ctx.restore();
  }

  function overlay(ctx, title, lines, color) {
    ctx.fillStyle = "rgba(4, 6, 14, 0.82)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = color;
    ctx.font = "bold 52px sans-serif";
    ctx.fillText(title, W / 2, 300);
    ctx.fillStyle = "#e8ecf8";
    ctx.font = "19px sans-serif";
    for (var i = 0; i < lines.length; i++) ctx.fillText(lines[i], W / 2, 350 + i * 32);
    ctx.textAlign = "left";
  }

  function draw(ctx, s, t) {
    ctx.clearRect(0, 0, W, H);
    if (s.screen === "menu") {
      drawFloor(ctx, Rooms.bounds());
      overlay(ctx, "★ STARLIGHT VAULT ★", [
        "Midnight at the observatory. The Comet Diamond sleeps in the Star Vault.",
        "Cross three rooms, read every cone, and slip out on the zipline.",
        "",
        "WASD move · SHIFT sneak · E take / use · 1/2/3 buy tools · Q smoke · C lens cap",
        "",
        "Press ENTER to begin the heist"
      ], "#ffd60a");
      drawHUD(ctx, s);
      drawLegend(ctx, s);
      return;
    }
    drawFloor(ctx, Rooms.bounds());
    drawWalls(ctx, s.level);
    drawCovers(ctx, s.level);
    drawCoins(ctx, s.level, t);
    drawLoot(ctx, s.level, t);
    drawCase(ctx, s.level, s.tools, t);
    drawExit(ctx, s.level, s.level.loot.taken, t);
    drawGuards(ctx, s.guards, t);
    drawCameras(ctx, s.cameras);
    drawSmoke(ctx, s.tools);
    drawPlayer(ctx, s.player, t);
    drawHUD(ctx, s);
    drawLegend(ctx, s);
    drawCallout(ctx, s);
    if (s.screen === "caught") {
      overlay(ctx, "CAUGHT!", [
        "The watch caught you under the starlight.",
        "The alarm was " + Math.round(s.alarm) + " — next time, wait for the cone to pass.",
        "",
        "Press R to retry this room · Press ENTER to restart the heist"
      ], "#ff3b30");
    } else if (s.screen === "win") {
      overlay(ctx, "★ CLEAN GETAWAY ★", [
        "The Comet Diamond is yours. The zipline sings under the stars.",
        "Time: " + s.timeText + "   •   Loot: " + s.player.loot.join(", "),
        "Coins left: " + s.player.coins + "   •   Alarm at escape: " + Math.round(s.alarm),
        "",
        "Press ENTER to play again"
      ], "#ffd60a");
    } else if (s.screen === "levelclear") {
      overlay(ctx, "ROOM CLEAR", [
        s.level.name + " — loot secured.",
        "Press ENTER for the next room"
      ], "#34c759");
    }
  }

  return { draw: draw, alarmState: alarmState, W: W, H: H };
})();
