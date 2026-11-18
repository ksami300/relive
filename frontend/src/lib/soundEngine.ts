class RelaxSoundEngine {
  private ctx: AudioContext | null = null;
  private oscMain: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  public isPlaying = false;
  public currentFreq = 432;

  async start(freq = 432) {
    if (typeof window === "undefined") return;
    this.stop();
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
    this.currentFreq = freq;

    this.oscMain = this.ctx.createOscillator();
    this.oscSub = this.ctx.createOscillator();
    this.gainNode = this.ctx.createGain();

    this.oscMain.type = "sine";
    this.oscMain.frequency.setValueAtTime(freq, this.ctx.currentTime);

    this.oscSub.type = "sine";
    this.oscSub.frequency.setValueAtTime(freq / 2, this.ctx.currentTime);

    this.gainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.gainNode.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 0.8);

    this.oscMain.connect(this.gainNode);
    this.oscSub.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    this.oscMain.start();
    this.oscSub.start();
    this.isPlaying = true;
  }

  stop() {
    if (this.oscMain) { try { this.oscMain.stop(); } catch {} this.oscMain.disconnect(); this.oscMain = null; }
    if (this.oscSub) { try { this.oscSub.stop(); } catch {} this.oscSub.disconnect(); this.oscSub = null; }
    if (this.ctx) { try { this.ctx.close(); } catch {} this.ctx = null; }
    this.isPlaying = false;
  }

  async toggle(freq = 432): Promise<boolean> {
    if (this.isPlaying && this.currentFreq === freq) {
      this.stop();
      return false;
    }
    await this.start(freq);
    return true;
  }
}

export const soundEngine = new RelaxSoundEngine();
