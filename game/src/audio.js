// Every sound is made here with the Web Audio API, nothing loaded: knife taps, the splash into a
// pot, the wok's sizzle, the bell at the pass, and a small pentatonic tune that quickens in the rush.

const SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25];
const MELODY = [5, 4, 3, 4, 5, 7, 6, 5, 3, 2, 3, 5, 4, 3, 1, 2, 5, 4, 3, 4, 5, 7, 8, 7, 6, 5, 4, 5, 3, 2, 1, 0];
const BASS = [0, 0, 3, 3, 2, 2, 4, 1];

export class Sound {
  constructor() {
    this.context = null;
    this.muted = false;
    this.nextBeat = 0;
    this.beat = 0;
    this.tempo = 100;
    this.musicOn = false;
  }

  /** Make the audio context on the first gesture (browsers refuse sound before one). */
  unlock() {
    if (this.context === null) {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (AudioContext === undefined) return;
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55;
      this.master.connect(this.context.destination);
      this.music = this.context.createGain();
      this.music.gain.value = 0.32;
      this.music.connect(this.master);
      this.noiseBuffer = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      this.startSizzle();
    }
    if (this.context.state === 'suspended') this.context.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.55;
    return this.muted;
  }

  get ready() {
    return this.context !== null && this.context.state === 'running';
  }

  tone(frequency, duration, type = 'triangle', volume = 0.3, slideTo = null, delay = 0, target = null) {
    if (!this.ready) return;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo !== null) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(target ?? this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  noise(duration, volume, filterType, frequency, delay = 0) {
    if (!this.ready) return;
    const start = this.context.currentTime + delay;
    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.context.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(start, Math.random() * 0.5);
    source.stop(start + duration + 0.02);
  }

  /** A looping band of noise, faded up while a wok is busy. */
  startSizzle() {
    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;
    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 5200;
    filter.Q.value = 0.8;
    this.sizzle = this.context.createGain();
    this.sizzle.gain.value = 0;
    source.connect(filter);
    filter.connect(this.sizzle);
    this.sizzle.connect(this.master);
    source.start();
  }

  setSizzle(busyWoks) {
    if (!this.ready || !this.sizzle) return;
    this.sizzle.gain.setTargetAtTime(Math.min(2, busyWoks) * 0.035, this.context.currentTime, 0.08);
  }

  /** The sound for one of the night's events. */
  play(type) {
    switch (type) {
      case 'pick':
        this.tone(520, 0.07, 'triangle', 0.18, 700);
        break;
      case 'place':
        this.tone(360, 0.08, 'triangle', 0.18, 260);
        break;
      case 'knife':
        this.noise(0.05, 0.35, 'highpass', 2500);
        this.tone(170, 0.05, 'square', 0.08, 120);
        break;
      case 'chopped':
        this.tone(660, 0.08, 'triangle', 0.2);
        this.tone(990, 0.12, 'triangle', 0.2, null, 0.06);
        break;
      case 'drop-in':
        this.noise(0.28, 0.3, 'lowpass', 900);
        this.tone(300, 0.15, 'sine', 0.12, 160);
        break;
      case 'cooked':
        this.tone(880, 0.25, 'sine', 0.22);
        this.tone(1320, 0.4, 'sine', 0.18, null, 0.09);
        break;
      case 'warn':
        this.tone(760, 0.09, 'square', 0.1);
        this.tone(760, 0.09, 'square', 0.1, null, 0.16);
        break;
      case 'burnt':
        this.tone(140, 0.5, 'sawtooth', 0.16, 60);
        this.noise(0.5, 0.18, 'lowpass', 600);
        break;
      case 'plated':
        this.tone(784, 0.1, 'triangle', 0.2);
        this.tone(1046, 0.14, 'triangle', 0.16, null, 0.05);
        break;
      case 'served':
        [1046, 1318, 1568, 2093].forEach((frequency, index) => this.tone(frequency, 0.5, 'sine', 0.2, null, index * 0.07));
        this.noise(0.08, 0.1, 'highpass', 6000, 0.28);
        break;
      case 'refused':
        this.tone(220, 0.25, 'square', 0.12, 150);
        break;
      case 'missed':
        this.tone(196, 0.35, 'sawtooth', 0.13, 110);
        this.tone(147, 0.45, 'sawtooth', 0.11, 90, 0.18);
        break;
      case 'ticket':
        this.noise(0.09, 0.12, 'bandpass', 3200);
        this.tone(1480, 0.18, 'sine', 0.1, null, 0.05);
        break;
      case 'trash':
        this.noise(0.18, 0.25, 'lowpass', 700);
        break;
      case 'open':
        this.tone(392, 0.9, 'sine', 0.22);
        this.tone(588, 0.9, 'sine', 0.14, null, 0.02);
        break;
      case 'closed':
        [784, 659, 523, 392].forEach((frequency, index) => this.tone(frequency, 0.6, 'sine', 0.2, null, index * 0.16));
        break;
      case 'tick':
        this.tone(1200, 0.05, 'square', 0.07);
        break;
      default:
        break;
    }
  }

  /** Keep the tune scheduled a little ahead; `playing` false lets it rest. */
  updateMusic(playing, rush) {
    if (!this.ready) return;
    const now = this.context.currentTime;
    if (!playing) {
      this.nextBeat = now + 0.1;
      return;
    }
    this.tempo = rush ? 132 : 104;
    const beatLength = 60 / this.tempo / 2;
    if (this.nextBeat < now) this.nextBeat = now + 0.05;
    while (this.nextBeat < now + 0.25) {
      const delay = this.nextBeat - now;
      const step = this.beat % MELODY.length;
      if (step % 4 !== 3) this.tone(SCALE[MELODY[step]] * 2, beatLength * 1.6, 'triangle', 0.09, null, delay, this.music);
      if (step % 4 === 0) this.tone(SCALE[BASS[(step / 4) % BASS.length]] / 2, beatLength * 3, 'sine', 0.16, null, delay, this.music);
      if (step % 2 === 1) this.tone(rush ? 1900 : 1600, 0.03, 'square', 0.025, null, delay, this.music);
      this.nextBeat += beatLength;
      this.beat += 1;
    }
  }
}
