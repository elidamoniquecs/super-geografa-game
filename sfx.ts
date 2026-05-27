// Small WebAudio sound effects for shadow reactions.
let ac: AudioContext | null = null;
function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ac) {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    ac = new Ctx();
  }
  if (ac.state === "suspended") ac.resume().catch(() => {});
  return ac;
}

export function playEvilLaugh() {
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  // 4 descending "HA" bursts -> evil "MUUA-HAHAHA"
  const bursts = [0, 0.18, 0.34, 0.5, 0.7];
  bursts.forEach((bt, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sawtooth";
    const startF = i === 0 ? 110 : 200 - i * 18;
    o.frequency.setValueAtTime(startF, t0 + bt);
    o.frequency.exponentialRampToValueAtTime(60, t0 + bt + (i === 0 ? 0.22 : 0.14));
    g.gain.setValueAtTime(0.0001, t0 + bt);
    g.gain.exponentialRampToValueAtTime(0.28, t0 + bt + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + bt + (i === 0 ? 0.24 : 0.16));
    o.connect(g).connect(ctx.destination);
    o.start(t0 + bt);
    o.stop(t0 + bt + 0.3);
  });
}

export function playHappyChime() {
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  // Ascending arpeggio
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(f, t0 + i * 0.09);
    g.gain.setValueAtTime(0.0001, t0 + i * 0.09);
    g.gain.exponentialRampToValueAtTime(0.22, t0 + i * 0.09 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.09 + 0.18);
    o.connect(g).connect(ctx.destination);
    o.start(t0 + i * 0.09);
    o.stop(t0 + i * 0.09 + 0.25);
  });
}