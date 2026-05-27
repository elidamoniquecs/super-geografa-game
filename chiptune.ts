// Original 8-bit style adventure chiptune (synth) — no external assets.
// Plays a looping square-wave melody with a simple bass line via WebAudio.

type Note = [number | null, number]; // [midi or null(rest), beats]

// Original cheerful adventure melody (not copyrighted material).
const MELODY: Note[] = [
  [76, 0.5], [76, 0.5], [null, 0.5], [76, 0.5],
  [null, 0.5], [72, 0.5], [76, 0.5], [null, 0.5],
  [79, 1], [null, 1],
  [67, 1], [null, 1],

  [72, 0.75], [null, 0.25], [67, 0.5], [null, 0.5],
  [64, 0.5], [null, 0.5], [69, 0.5], [71, 0.5],
  [70, 0.5], [69, 0.5], [67, 0.5], [76, 0.5],
  [79, 0.5], [81, 0.5], [77, 0.5], [79, 0.5],
  [null, 0.5], [76, 0.5], [72, 0.5], [74, 0.25], [71, 0.75],

  [72, 0.75], [null, 0.25], [67, 0.5], [null, 0.5],
  [64, 0.5], [null, 0.5], [69, 0.5], [71, 0.5],
  [70, 0.5], [69, 0.5], [67, 0.5], [76, 0.5],
  [79, 0.5], [81, 0.5], [77, 0.5], [79, 0.5],
  [null, 0.5], [76, 0.5], [72, 0.5], [74, 0.25], [71, 0.75],
];

const BASS: Note[] = [
  [48, 1], [48, 1], [55, 1], [48, 1],
  [53, 1], [48, 1], [55, 1], [48, 1],
  [45, 1], [45, 1], [52, 1], [45, 1],
  [50, 1], [45, 1], [52, 1], [45, 1],
];

function mtof(m: number) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

export class Chiptune {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: number | null = null;
  private nextTime = 0;
  private melIdx = 0;
  private bassIdx = 0;
  private bassTimeLeft = 0;
  private bpm = 150;
  private muted = false;
  private started = false;

  get isMuted() { return this.muted; }
  get isStarted() { return this.started; }

  async start() {
    if (this.started) return;
    const AC =
      (window.AudioContext as typeof AudioContext) ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.18;
    this.master.connect(this.ctx.destination);
    this.nextTime = this.ctx.currentTime + 0.05;
    this.started = true;
    this.scheduler();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.18, this.ctx.currentTime, 0.05);
    }
  }

  toggle() { this.setMuted(!this.muted); }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.ctx) { this.ctx.close().catch(() => {}); this.ctx = null; }
    this.master = null;
    this.started = false;
  }

  private scheduler = () => {
    if (!this.ctx) return;
    this.timer = window.setInterval(() => {
      if (!this.ctx || !this.master) return;
      const lookahead = this.ctx.currentTime + 0.2;
      while (this.nextTime < lookahead) {
        const beat = 60 / this.bpm;
        const [m, dur] = MELODY[this.melIdx];
        if (m !== null) this.playNote(m, this.nextTime, dur * beat * 0.9, "square", 0.18);
        // bass tick
        if (this.bassTimeLeft <= 0.0001) {
          const [bm, bdur] = BASS[this.bassIdx];
          if (bm !== null) this.playNote(bm, this.nextTime, bdur * beat * 0.95, "triangle", 0.22);
          this.bassTimeLeft = bdur;
          this.bassIdx = (this.bassIdx + 1) % BASS.length;
        }
        this.bassTimeLeft -= dur;
        this.nextTime += dur * beat;
        this.melIdx = (this.melIdx + 1) % MELODY.length;
      }
    }, 50);
  };

  private playNote(
    midi: number,
    when: number,
    dur: number,
    type: OscillatorType,
    vol: number,
  ) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = mtof(midi);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.01);
    g.gain.linearRampToValueAtTime(vol * 0.7, when + dur * 0.6);
    g.gain.linearRampToValueAtTime(0, when + dur);
    osc.connect(g).connect(this.master);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }
}

let singleton: Chiptune | null = null;
export function getChiptune() {
  if (!singleton) singleton = new Chiptune();
  return singleton;
}