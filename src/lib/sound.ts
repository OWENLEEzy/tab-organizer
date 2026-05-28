import { CLOSE_SOUND } from './close-effect-constants';

/**
 * Play a swoosh sound effect using the Web Audio API.
 * Creates a filtered noise sweep that descends in pitch, like air moving.
 * No sound files needed -- entirely synthesized.
 */
export function playCloseSound(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const t = ctx.currentTime;

    const { duration, envelope, filter, gain, contextCleanup } = CLOSE_SOUND;

    // Create noise buffer with shaped envelope
    const buffer = ctx.createBuffer(1, Math.round(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const pos = i / data.length;
      const env =
        pos < envelope.attack
          ? pos / envelope.attack
          : Math.pow(1 - (pos - envelope.attack) / (1 - envelope.attack), envelope.decay);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Bandpass filter sweeps from high to low -- creates the "swoosh" character
    const biquadFilter = ctx.createBiquadFilter();
    biquadFilter.type = filter.type;
    biquadFilter.Q.value = filter.Q;
    biquadFilter.frequency.setValueAtTime(filter.sweep[0], t);
    biquadFilter.frequency.exponentialRampToValueAtTime(filter.sweep[1], t + duration);

    // Volume envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(gain.start, t);
    gainNode.gain.exponentialRampToValueAtTime(gain.end, t + duration);

    source.connect(biquadFilter).connect(gainNode).connect(ctx.destination);
    source.start(t);

    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        // Context may already be closed
      }
    }, contextCleanup);
  } catch {
    // Audio not supported -- fail silently
  }
}
