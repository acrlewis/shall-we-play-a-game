/**
 * ==============================================================================
 * "SHALL WE PLAY A GAME?" — WEB AUDIO API PROCEDURAL SOUND GENERATOR
 * Synthesizes retro terminal bleeps, chimes, and alarms without external assets
 * ==============================================================================
 */

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem("swpag_sound_muted") !== "true";
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    localStorage.setItem("swpag_sound_muted", String(!this.enabled));
    if (this.enabled) {
      this.playBeep(880, 0.08, "square");
    }
    return this.enabled;
  }

  playTone(freq, duration, type = "sine", gainVal = 0.15) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  playBeep(freq = 600, duration = 0.05, type = "square") {
    this.playTone(freq, duration, type, 0.08);
  }

  playKeypress() {
    this.playTone(1200 + Math.random() * 400, 0.02, "triangle", 0.03);
  }

  playHint() {
    if (!this.enabled) return;
    this.ensureContext();
    this.playTone(520, 0.1, "sine", 0.2);
    setTimeout(() => this.playTone(440, 0.15, "triangle", 0.18), 100);
  }

  playCorrect() {
    if (!this.enabled) return;
    this.ensureContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, "sine", 0.2);
      }, idx * 80);
    });
  }

  playError() {
    if (!this.enabled) return;
    this.ensureContext();
    this.playTone(180, 0.15, "sawtooth", 0.25);
    setTimeout(() => {
      this.playTone(140, 0.25, "sawtooth", 0.3);
    }, 120);
  }

  playRadarBlip() {
    if (!this.enabled) return;
    this.playTone(1400, 0.04, "sine", 0.05);
  }

  playVictory() {
    if (!this.enabled) return;
    this.ensureContext();
    const fanfare = [
      { f: 523.25, d: 0.15, t: 0 },
      { f: 659.25, d: 0.15, t: 150 },
      { f: 783.99, d: 0.2, t: 300 },
      { f: 1046.50, d: 0.4, t: 500 }
    ];
    fanfare.forEach(note => {
      setTimeout(() => {
        this.playTone(note.f, note.d, "square", 0.2);
      }, note.t);
    });
  }
}

export const SOUND = new SoundEngine();
