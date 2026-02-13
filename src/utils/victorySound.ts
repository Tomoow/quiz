/**
 * Play a brass-style victory fanfare using the Web Audio API (no audio files).
 * Sawtooth + filter envelope for trumpet-like tone; classic short-long fanfare motif.
 * Used when someone takes first place on the ranking screen.
 */
export function playVictorySound(): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.setValueAtTime(0.45, now);

    // Brass-like tone: sawtooth through low-pass filter that opens on attack
    function playBrassNote(freq: number, startTime: number, duration: number, velocity: number): void {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, startTime);
      filter.frequency.linearRampToValueAtTime(2400, startTime + 0.03);
      filter.frequency.setValueAtTime(2200, startTime + duration * 0.4);
      filter.frequency.exponentialRampToValueAtTime(600, startTime + duration);
      filter.Q.setValueAtTime(1, startTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(velocity, startTime + 0.02);
      gain.gain.setValueAtTime(velocity * 0.9, startTime + duration * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      const saw = ctx.createOscillator();
      saw.type = 'sawtooth';
      saw.frequency.setValueAtTime(freq, startTime);
      saw.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      saw.start(startTime);
      saw.stop(startTime + duration);

      // Second oscillator an octave down for body (subtle)
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(freq / 2, startTime);
      subGain.gain.setValueAtTime(0, startTime);
      subGain.gain.linearRampToValueAtTime(velocity * 0.25, startTime + 0.02);
      subGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      sub.connect(subGain);
      subGain.connect(masterGain);
      sub.start(startTime);
      sub.stop(startTime + duration);
    }

    // Classic victory fanfare motif: short-short-LONG, short-short-LONG, LONG (C5, C5, G5, C5, E5, G5, C6)
    const C5 = 523.25;
    const E5 = 659.25;
    const G5 = 783.99;
    const C6 = 1046.5;

    const motif = [
      { freq: C5, duration: 0.18, gap: 0.06 },
      { freq: C5, duration: 0.18, gap: 0.06 },
      { freq: G5, duration: 0.55, gap: 0.12 },
      { freq: C5, duration: 0.18, gap: 0.06 },
      { freq: E5, duration: 0.18, gap: 0.06 },
      { freq: G5, duration: 0.5, gap: 0.12 },
      { freq: C6, duration: 0.75, gap: 0 },
    ];

    let t = now;
    motif.forEach(({ freq, duration, gap }) => {
      playBrassNote(freq, t, duration, 0.85);
      t += duration + gap;
    });
  } catch {
    // Ignore if AudioContext is not supported or blocked (e.g. autoplay policy)
  }
}
