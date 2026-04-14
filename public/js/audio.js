// audio.js — Procedural sound effects using Web Audio API
const GameAudio = (() => {
  let ctx = null;
  let muted = false;
  let initialized = false;

  // Persistent engine sound nodes
  let engineOsc = null;
  let engineGain = null;
  let engineFilter = null;

  function init() {
    if (initialized) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      initialized = true;
    } catch (e) {
      console.warn('Web Audio API not available');
    }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function isMuted() {
    return muted;
  }

  function toggleMute() {
    muted = !muted;
    if (engineGain) {
      engineGain.gain.value = muted ? 0 : 0.08;
    }
    return muted;
  }

  // Engine sound — continuous oscillator mapped to speed
  function startEngine() {
    if (!ctx || !initialized) return;
    resume();

    if (engineOsc) return; // Already running

    engineOsc = ctx.createOscillator();
    engineGain = ctx.createGain();
    engineFilter = ctx.createBiquadFilter();

    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 80;
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 800;
    engineFilter.Q.value = 2;
    engineGain.gain.value = muted ? 0 : 0.08;

    engineOsc.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(ctx.destination);

    engineOsc.start();
  }

  function updateEngine(speed, maxSpeed) {
    if (!engineOsc || !ctx) return;
    const ratio = Math.abs(speed) / maxSpeed;
    const freq = 80 + ratio * 320;
    const filterFreq = 400 + ratio * 1200;

    engineOsc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.05);
    engineFilter.frequency.setTargetAtTime(filterFreq, ctx.currentTime, 0.05);

    if (!muted) {
      const vol = 0.04 + ratio * 0.06;
      engineGain.gain.setTargetAtTime(vol, ctx.currentTime, 0.05);
    }
  }

  function stopEngine() {
    if (engineOsc) {
      try {
        engineOsc.stop();
        engineOsc.disconnect();
        engineFilter.disconnect();
        engineGain.disconnect();
      } catch (e) { /* already stopped */ }
      engineOsc = null;
      engineGain = null;
      engineFilter = null;
    }
  }

  // Tire squeal
  function playSqueal() {
    if (!ctx || muted) return;
    resume();

    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 5;

    const gain = ctx.createGain();
    gain.gain.value = 0.06;
    gain.gain.exponentialDecayTo && gain.gain.setTargetAtTime(0.001, ctx.currentTime + 0.15, 0.05);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + 0.2);
  }

  // Collision thud
  function playCollision() {
    if (!ctx || muted) return;
    resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 60;
    gain.gain.value = 0.15;
    gain.gain.setTargetAtTime(0.001, ctx.currentTime + 0.05, 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  // Lap complete chime — C, E, G ascending
  function playLapChime() {
    if (!ctx || muted) return;
    resume();

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.value = 0;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.12 + 0.02);
      gain.gain.setTargetAtTime(0.001, ctx.currentTime + i * 0.12 + 0.15, 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.4);
    });
  }

  // Countdown beep
  function playCountdownBeep(isGo) {
    if (!ctx || muted) return;
    resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = isGo ? 880 : 440;
    gain.gain.value = 0.1;
    gain.gain.setTargetAtTime(0.001, ctx.currentTime + (isGo ? 0.3 : 0.15), 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (isGo ? 0.4 : 0.2));
  }

  // Checkered flag fanfare
  function playFanfare() {
    if (!ctx || muted) return;
    resume();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.value = 0;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.15 + 0.02);
      gain.gain.setTargetAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3, 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.6);
    });
  }

  // Simple menu music loop
  let menuOsc1 = null, menuOsc2 = null, menuGain = null;
  let menuInterval = null;

  function startMenuMusic() {
    if (!ctx || muted) return;
    resume();
    stopMenuMusic();

    menuGain = ctx.createGain();
    menuGain.gain.value = 0.04;
    menuGain.connect(ctx.destination);

    const melody = [262, 330, 392, 330, 349, 392, 440, 392, 330, 262, 294, 330, 262];
    let noteIndex = 0;

    function playNote() {
      if (muted || !menuGain) return;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = melody[noteIndex % melody.length];
      noteGain.gain.value = 1;
      noteGain.gain.setTargetAtTime(0.001, ctx.currentTime + 0.3, 0.1);
      osc.connect(noteGain);
      noteGain.connect(menuGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
      noteIndex++;
    }

    playNote();
    menuInterval = setInterval(playNote, 400);
  }

  function stopMenuMusic() {
    if (menuInterval) {
      clearInterval(menuInterval);
      menuInterval = null;
    }
    if (menuGain) {
      try { menuGain.disconnect(); } catch (e) {}
      menuGain = null;
    }
  }

  return {
    init,
    resume,
    isMuted,
    toggleMute,
    startEngine,
    updateEngine,
    stopEngine,
    playSqueal,
    playCollision,
    playLapChime,
    playCountdownBeep,
    playFanfare,
    startMenuMusic,
    stopMenuMusic,
  };
})();
