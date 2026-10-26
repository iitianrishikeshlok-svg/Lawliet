/**
 * Pure Web Audio API Sound Synthesizer for "L"
 * Provides zero-dependency, ultra-low-latency futuristic sound effects.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setEnabled(val) {
    this.enabled = !!val;
  }

  playClick() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {
      // Ignore audio context autoplay restrictions
    }
  }

  playLaser() {
    this.playClick();
  }

  playExpand() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(620, this.ctx.currentTime + 0.16);

      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.09, this.ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {}
  }

  playCollapse() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }

  playShutter() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      // Synthetic camera shutter burst
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1600;
      filter.Q.value = 2.0;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      noise.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playSuccess() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [880, 1318].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.06, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.18);
      });
    } catch (e) {}
  }

  playLIntenseTheme() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Heavy cinematic sub-bass impact drop
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(28, now + 1.8);
      subGain.gain.setValueAtTime(0.55, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 2.6);

      // 1b. Cathedral Church Bell / Gothic Chime (Death Note signature)
      [220, 440, 660, 880].forEach((bellFreq, i) => {
        const bellOsc = this.ctx.createOscillator();
        const bellGain = this.ctx.createGain();
        bellOsc.type = 'sine';
        bellOsc.frequency.setValueAtTime(bellFreq, now);
        const bellAmp = 0.18 / (i + 1);
        bellGain.gain.setValueAtTime(bellAmp, now);
        bellGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
        bellOsc.connect(bellGain);
        bellGain.connect(this.ctx.destination);
        bellOsc.start(now);
        bellOsc.stop(now + 2.2);
      });

      // 2. Glitch static cybernetic burst
      const glitchLen = Math.floor(this.ctx.sampleRate * 0.32);
      const glitchBuffer = this.ctx.createBuffer(1, glitchLen, this.ctx.sampleRate);
      const glitchData = glitchBuffer.getChannelData(0);
      for (let i = 0; i < glitchLen; i++) {
        glitchData[i] = (Math.random() * 2 - 1) * (1 - i / glitchLen);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = glitchBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2800, now);
      filter.frequency.linearRampToValueAtTime(600, now + 0.32);
      filter.Q.value = 5.0;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.32, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);

      // 3. Iconic L Theme Arpeggio Melody Notes (E4, G4, A4, B4, C5, B4, G#4, A4)
      const notes = [
        { f: 329.63, t: 0.08, dur: 0.32 },  // E4
        { f: 392.00, t: 0.38, dur: 0.32 },  // G4
        { f: 440.00, t: 0.68, dur: 0.36 },  // A4
        { f: 493.88, t: 1.00, dur: 0.32 },  // B4
        { f: 523.25, t: 1.30, dur: 0.42 },  // C5
        { f: 493.88, t: 1.68, dur: 0.36 },  // B4
        { f: 415.30, t: 2.04, dur: 0.58 },  // G#4 (The tense Death Note semitone)
        { f: 440.00, t: 2.48, dur: 0.95 },  // A4 resolution chord
      ];

      notes.forEach((n) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + n.t);

        const overtone = this.ctx.createOscillator();
        const overGain = this.ctx.createGain();
        overtone.type = 'sine';
        overtone.frequency.setValueAtTime(n.f * 2, now + n.t);

        gain.gain.setValueAtTime(0.28, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.dur);

        overGain.gain.setValueAtTime(0.12, now + n.t);
        overGain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.dur * 0.7);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        overtone.connect(overGain);
        overGain.connect(this.ctx.destination);

        osc.start(now + n.t);
        osc.stop(now + n.t + n.dur);
        overtone.start(now + n.t);
        overtone.stop(now + n.t + n.dur);
      });
    } catch (e) {}
  }

  playRyukTheme() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Deep Gothic Cathedral Bell toll (A1/A2 fundamental)
      [110, 220, 330, 440].forEach((freq, idx) => {
        const bell = this.ctx.createOscillator();
        const bellGain = this.ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(freq, now);
        bellGain.gain.setValueAtTime(0.22 / (idx + 1), now);
        bellGain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);
        bell.connect(bellGain);
        bellGain.connect(this.ctx.destination);
        bell.start(now);
        bell.stop(now + 3.2);
      });

      // 2. Sinister Demonic Shiver / Noise Riser
      const noiseLen = Math.floor(this.ctx.sampleRate * 0.45);
      const noiseBuffer = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * Math.sin((i / noiseLen) * Math.PI);
      }
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(3400, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(800, now + 0.45);
      noiseFilter.Q.value = 6.0;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noiseSource.start(now);

      // 3. Ryuk's Theme Iconic Sinister Music Box Bell Motif (E5, B4, C5, D5, C5, B4, A4, G#4, A4)
      const ryukNotes = [
        { f: 659.25, t: 0.05, dur: 0.35 },  // E5
        { f: 493.88, t: 0.38, dur: 0.30 },  // B4
        { f: 523.25, t: 0.65, dur: 0.32 },  // C5
        { f: 587.33, t: 0.95, dur: 0.35 },  // D5
        { f: 523.25, t: 1.28, dur: 0.32 },  // C5
        { f: 493.88, t: 1.58, dur: 0.32 },  // B4
        { f: 440.00, t: 1.88, dur: 0.40 },  // A4
        { f: 415.30, t: 2.25, dur: 0.55 },  // G#4 (Ryuk's eerie tension note)
        { f: 440.00, t: 2.75, dur: 1.20 },  // A4 sinister sustain
      ];

      ryukNotes.forEach((note) => {
        const bellOsc = this.ctx.createOscillator();
        const bellGain = this.ctx.createGain();
        bellOsc.type = 'sine';
        bellOsc.frequency.setValueAtTime(note.f, now + note.t);

        // Metallic celesta harmonic overtone
        const chimeOsc = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chimeOsc.type = 'triangle';
        chimeOsc.frequency.setValueAtTime(note.f * 2.76, now + note.t); // Inharmonic metallic bell overtone

        bellGain.gain.setValueAtTime(0.24, now + note.t);
        bellGain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.dur);

        chimeGain.gain.setValueAtTime(0.08, now + note.t);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.dur * 0.6);

        bellOsc.connect(bellGain);
        bellGain.connect(this.ctx.destination);
        chimeOsc.connect(chimeGain);
        chimeGain.connect(this.ctx.destination);

        bellOsc.start(now + note.t);
        bellOsc.stop(now + note.t + note.dur);
        chimeOsc.start(now + note.t);
        chimeOsc.stop(now + note.t + note.dur);
      });
    } catch (e) {}
  }

  playShinigamiChuckle() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Deep eerie throat resonance & whisper breath
      const noiseLen = Math.floor(this.ctx.sampleRate * 1.8);
      const noiseBuffer = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * Math.sin((i / noiseLen) * Math.PI);
      }
      const noiseSrc = this.ctx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;
      const breathFilter = this.ctx.createBiquadFilter();
      breathFilter.type = 'bandpass';
      breathFilter.frequency.setValueAtTime(1400, now);
      breathFilter.Q.value = 3.5;
      const breathGain = this.ctx.createGain();
      breathGain.gain.setValueAtTime(0.08, now);
      breathGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      noiseSrc.connect(breathFilter);
      breathFilter.connect(breathGain);
      breathGain.connect(this.ctx.destination);
      noiseSrc.start(now);

      // 2. Ryuk's iconic rhythmic gutter chuckle pulses: "Heh... heh... heh... heh..."
      const chuckleTimes = [0.12, 0.42, 0.72, 1.05, 1.40];
      const chuckleFreqs = [150, 142, 134, 122, 110]; // descending pitch

      chuckleTimes.forEach((tOffset, i) => {
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        const formant = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(chuckleFreqs[i], now + tOffset);
        osc.frequency.exponentialRampToValueAtTime(chuckleFreqs[i] * 0.85, now + tOffset + 0.18);

        formant.type = 'bandpass';
        formant.frequency.setValueAtTime(1150 - i * 40, now + tOffset); // "eh" vocal formant
        formant.Q.value = 4.2;

        oscGain.gain.setValueAtTime(0.001, now + tOffset);
        oscGain.gain.linearRampToValueAtTime(0.18 - i * 0.02, now + tOffset + 0.04);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + tOffset + 0.22);

        osc.connect(formant);
        formant.connect(oscGain);
        oscGain.connect(this.ctx.destination);

        osc.start(now + tOffset);
        osc.stop(now + tOffset + 0.22);
      });

      // 3. Sub-bass demonic rumble
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(65, now);
      sub.frequency.exponentialRampToValueAtTime(35, now + 2.2);
      subGain.gain.setValueAtTime(0.35, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 2.2);
    } catch (e) {}
  }
}

const rawAudio = new SoundEngine();

export const audio = new Proxy(rawAudio, {
  get(target, prop) {
    if (prop in target) {
      const val = target[prop];
      return typeof val === 'function' ? val.bind(target) : val;
    }
    // Safe fallback for any unknown play* sound method to prevent runtime crashes
    if (typeof prop === 'string' && prop.startsWith('play')) {
      return () => {
        try {
          target.playClick();
        } catch {}
      };
    }
    return () => {};
  },
});

