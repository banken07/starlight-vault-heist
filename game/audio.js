// audio.js — tiny WebAudio sounds for Starlight Vault. No audio files:
// every sound is a synthesized oscillator blip, so the game loads nothing
// over the network.
var AudioSys = (function () {
  var ctx = null;
  var enabled = true;

  function ensure() {
    if (!ctx) {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (!enabled) return;
    var c = ensure();
    if (!c) return;
    var t0 = c.currentTime;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol || 0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function pickup() { tone(880, 0.12, "sine", 0.10); setTimeout(function () { tone(1318, 0.14, "sine", 0.08); }, 70); }
  function coin() { tone(1180, 0.07, "triangle", 0.08); }
  function buy() { tone(660, 0.09, "square", 0.06); setTimeout(function () { tone(990, 0.1, "square", 0.05); }, 80); }
  function denied() { tone(180, 0.18, "sawtooth", 0.07, 120); }
  function spotted() { tone(520, 0.22, "sawtooth", 0.09, 780); }
  function alarmLoop() { tone(392, 0.16, "square", 0.05, 311); }
  function lockpickTick() { tone(1500, 0.04, "square", 0.05); }
  function unlock() { tone(523, 0.12, "sine", 0.1); setTimeout(function () { tone(784, 0.12, "sine", 0.1); }, 100); setTimeout(function () { tone(1046, 0.2, "sine", 0.1); }, 200); }
  function smoke() { tone(300, 0.4, "sine", 0.07, 90); }
  function caught() {
    tone(220, 0.5, "sawtooth", 0.12, 110);
    setTimeout(function () { tone(165, 0.6, "sawtooth", 0.1, 82); }, 250);
  }
  function win() {
    var notes = [523, 659, 784, 1046, 1318];
    notes.forEach(function (f, i) { setTimeout(function () { tone(f, 0.35, "sine", 0.1); }, i * 130); });
  }
  function step() { tone(140, 0.03, "sine", 0.02); }

  return {
    unlockAudio: ensure,
    toggle: function () { enabled = !enabled; return enabled; },
    pickup: pickup, coin: coin, buy: buy, denied: denied,
    spotted: spotted, alarmLoop: alarmLoop, lockpickTick: lockpickTick,
    unlock: unlock, smoke: smoke, caught: caught, win: win, step: step
  };
})();
