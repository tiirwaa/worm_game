// Procedural Sound Manager using WebAudio
// Exposes a simple API: startBackground(), stopBackground(), playMove(), playEat(), playGameOver(), setMusicVolume(), setEffectsVolume()
class SoundManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.effectsGain = null;
    this.bgNodes = [];
    this.bgGain = null;
    this.isBackground = false;
    this.musicVolume = 0.5;
    this.effectsVolume = 0.5;
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
    this.master.gain.value = 1.0; // master is always 1, volumes controlled by sub-gains
    this.master.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume;
    this.musicGain.connect(this.master);

    this.effectsGain = this.ctx.createGain();
    this.effectsGain.gain.value = this.effectsVolume;
    this.effectsGain.connect(this.master);

    // small global final touch
    this.reverb = null; // placeholder for future
  }

  setMusicVolume(v) {
    this.musicVolume = v;
    if (this.musicGain) this.musicGain.gain.value = v;
  }

  setEffectsVolume(v) {
    this.effectsVolume = v;
    if (this.effectsGain) this.effectsGain.gain.value = v;
  }

  ensureContext() {
    this.init();
    // resume on user event
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Background arcade-style looping melody
  startBackground() {
    this.ensureContext();
    if (!this.ctx || this.isBackground) return;
    this.bgGain = this.ctx.createGain();
    this.bgGain.gain.value = 0.8; // adjusted volume
    this.bgGain.connect(this.musicGain);

    // Define a simple arcade melody: notes with frequencies and durations (in seconds)
    this.melody = [
      { freq: 261.63, dur: 0.3 }, // C4
      { freq: 329.63, dur: 0.3 }, // E4
      { freq: 392.00, dur: 0.3 }, // G4
      { freq: 523.25, dur: 0.6 }, // C5
      { freq: 392.00, dur: 0.3 }, // G4
      { freq: 329.63, dur: 0.3 }, // E4
      { freq: 261.63, dur: 0.6 }, // C4
      { freq: 220.00, dur: 0.3 }, // A3
      { freq: 261.63, dur: 0.3 }, // C4
      { freq: 293.66, dur: 0.3 }, // D4
      { freq: 329.63, dur: 0.6 }, // E4
      { freq: 293.66, dur: 0.3 }, // D4
      { freq: 261.63, dur: 0.3 }, // C4
      { freq: 220.00, dur: 0.6 }, // A3
    ];
    this.melodyIndex = 0;
    this.melodyStartTime = this.ctx.currentTime;

    // Function to play the next note in the melody
    const playNextNote = () => {
      if (!this.isBackground) return;
      const note = this.melody[this.melodyIndex];
      const osc = this.ctx.createOscillator();
      osc.type = 'square'; // arcade sound
      osc.frequency.value = note.freq;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + note.dur);
      osc.connect(gain);
      gain.connect(this.bgGain);
      osc.start();
      osc.stop(this.ctx.currentTime + note.dur);
      this.melodyIndex = (this.melodyIndex + 1) % this.melody.length;
    };

    // Play notes at appropriate times
    this._melodyTimer = setInterval(() => {
      playNextNote();
    }, 300); // play a note every 300ms

    this.bgNodes = [this.bgGain]; // minimal nodes
    this.isBackground = true;
    try { console.info('SoundManager.startBackground -> started arcade melody'); } catch(e) {}
  }

  stopBackground() {
    if (!this.ctx || !this.isBackground) return;
    try {
      clearInterval(this._melodyTimer);
      this.bgNodes.forEach(n => {
        try { if (n.stop) n.stop(); } catch (e) {}
        try { if (n.disconnect) n.disconnect(); } catch (e) {}
      });
      if (this.bgGain) { try { this.bgGain.disconnect(); } catch (e) {} }
    } catch (e) {}
      try { console.info('SoundManager.stopBackground -> stopped'); } catch(e) {}
    this.bgNodes = [];
    this.bgGain = null;
    this._melodyTimer = null;
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
    gain.connect(this.effectsGain);
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
      gain.connect(this.effectsGain);
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
    ng.connect(this.effectsGain);
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
      gain.connect(this.effectsGain);
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