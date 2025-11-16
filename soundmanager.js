// Procedural Sound Manager using WebAudio
// Exposes a simple API: startBackground(), stopBackground(), playMove(), playEat(), playGameOver(), setMasterVolume()
class SoundManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.bgNodes = [];
    this.bgGain = null;
    this.isBackground = false;
    this.masterVolume = 0.5;
  }

  // small utility to create a reverb buffer with decaying noise
  _createReverbBuffer(duration = 2.0, decay = 2.0) {
    try {
      const rate = this.ctx.sampleRate;
      const length = rate * duration;
      const buffer = this.ctx.createBuffer(2, length, rate);
      for (let c = 0; c < 2; c++) {
        const data = buffer.getChannelData(c);
        for (let i = 0; i < length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
      }
      return buffer;
    } catch (e) {
      return null;
    }
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('AudioContext not supported');
      return;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.masterVolume;
    this.master.connect(this.ctx.destination);

    // small global final touch
    this.reverb = null; // placeholder for future
  }

  setMasterVolume(v) {
    this.masterVolume = v;
    if (this.master) this.master.gain.value = v;
  }

  ensureContext() {
    this.init();
    // resume on user event
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Background ambient music: combination of low pad + simple arpeggio
  startBackground() {
    this.ensureContext();
    if (!this.ctx || this.isBackground) return;
    this.bgGain = this.ctx.createGain();
    // raise slightly so it's audible but still subtle; user can toggle or change later
    this.bgGain.gain.value = 0.08; // set to subtle but audible
    this.bgGain.connect(this.master);

    // Futuristic ambient pad: 3-layer oscillators with bandpass + slow LFO
    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = 'bandpass';
    padFilter.frequency.value = 300;
    padFilter.Q.value = 0.9;
    padFilter.connect(this.bgGain);

    const padGain = this.ctx.createGain();
    padGain.gain.value = 0.22;
    padGain.connect(padFilter);

    const o1 = this.ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 55; o1.detune.value = -6;
    const o2 = this.ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 110; o2.detune.value = 8;
    const o3 = this.ctx.createOscillator(); o3.type = 'sine'; o3.frequency.value = 41.2; o3.detune.value = 10;

    const g1 = this.ctx.createGain(); g1.gain.value = 0.12; o1.connect(g1); g1.connect(padGain);
    const g2 = this.ctx.createGain(); g2.gain.value = 0.09; o2.connect(g2); g2.connect(padGain);
    const g3 = this.ctx.createGain(); g3.gain.value = 0.07; o3.connect(g3); g3.connect(padGain);

    const lfo = this.ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.05; // slow
    const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 120;
    lfo.connect(lfoGain); lfoGain.connect(padFilter.frequency);

    o1.start(); o2.start(); o3.start(); lfo.start();

    // Arpeggio using scheduled oscillator notes (uses setInterval)
    this.arpIndex = 0;
    this.arpNotes = [220, 261.63, 329.63, 392.00]; // A, C, E, G
    const playArp = () => {
      if (!this.bgGain) return;
      const freq = this.arpNotes[this.arpIndex % this.arpNotes.length];
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.006, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);
      osc.connect(g);
      g.connect(this.bgGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
      this.arpIndex++;
    };
    this._arpTimer = setInterval(playArp, 1800);

    // Add a light reverb to the whole background for warmth
    try {
      this.reverb = this.ctx.createConvolver();
      this.reverb.buffer = this._createReverbBuffer(2.2, 2.0);
      const send = this.ctx.createGain();
      send.gain.value = 0.035;
      // Send pad to the reverb
      padGain.connect(send);
      send.connect(this.reverb);
      this.reverb.connect(this.bgGain);
      this.bgNodes.push(this.reverb, send);
    } catch (e) {}

    this.bgNodes = [o1, o2, o3, g1, g2, g3, lfo, lfoGain];
    // Ensure reverb is included in background node list for cleanup
    this.isBackground = true;
    try { console.info('SoundManager.startBackground -> started (isBackground true)'); } catch(e) {}
  }

  stopBackground() {
    if (!this.ctx || !this.isBackground) return;
    try {
      clearInterval(this._arpTimer);
      this.bgNodes.forEach(n => {
        try { if (n.stop) n.stop(); } catch (e) {}
        try { if (n.disconnect) n.disconnect(); } catch (e) {}
      });
      if (this.reverb && this.reverb.disconnect) try { this.reverb.disconnect(); } catch (e) {}
      if (this.bgGain) { try { this.bgGain.disconnect(); } catch (e) {} }
    } catch (e) {}
      try { console.info('SoundManager.stopBackground -> stopped'); } catch(e) {}
    this.bgNodes = [];
    this.bgGain = null;
    this._arpTimer = null;
    this.isBackground = false;
  }

  // small percussive move sound
  playMove() {
    this.ensureContext();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(700 + Math.random() * 300, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.18);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 800;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // Eat sound: a bright arpeggio with short noise
  playEat() {
    this.ensureContext();
    if (!this.ctx) return;

    // Add a 3-note arpeggio
    const root = 440 + Math.random() * 120;
    const notes = [0, 4, 7];
    notes.forEach((n, idx) => {
      const time = this.ctx.currentTime + idx * 0.06;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      const gain = this.ctx.createGain();
      const f = root * Math.pow(2, n / 12);
      osc.frequency.setValueAtTime(f, time);
      gain.gain.setValueAtTime(0.04 / (idx + 1), time);
      gain.gain.exponentialRampToValueAtTime(0.00001, time + 0.25);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(time);
      osc.stop(time + 0.26);
    });

    // small noise pop
    const bufferSize = 0.2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const node = this.ctx.createBufferSource();
    node.buffer = buffer;
    const ng = this.ctx.createGain();
    ng.gain.value = 0.02;
    node.connect(ng);
    ng.connect(this.master);
    node.start(this.ctx.currentTime);
  }

  // Game over: descending tone
  playGameOver() {
    this.ensureContext();
    if (!this.ctx) return;
    // Stronger descending beep
    let t = this.ctx.currentTime;
    const root = 880;
    for (let i = 0; i < 6; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(root / Math.pow(1.12, i * 1.2), t + i * 0.1);
      gain.gain.setValueAtTime(0.08, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.1 + 0.2);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.25);
    }
  }
}

// make easy global instance if used inline
const soundManager = new SoundManager();
window.soundManager = soundManager;

// Note: we intentionally do NOT export as ES module so this file can be included
// as a classic script in a browser (<script src="./soundmanager.js"></script>).
// The SoundManager instance is exposed as window.soundManager above.