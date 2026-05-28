export const CLOSE_CONFETTI = {
  particleCount: 17,
  colors: ['#c8713a', '#e8a070', '#5a7a62', '#8aaa92', '#5a6b7a', '#8a9baa', '#d4b896', '#b35a5a'],
  sizeRange: [5, 11] as [number, number],
  speedRange: [60, 180] as [number, number],
  upwardBias: -80,
  gravity: 200,
  durationRange: [700, 900] as [number, number],
  rotation: 200,
} as const;

export const CLOSE_SOUND = {
  duration: 0.25,
  envelope: { attack: 0.1, decay: 1.5 },
  filter: { type: 'bandpass' as const, Q: 2.0, sweep: [4000, 400] as [number, number] },
  gain: { start: 0.15, end: 0.001 },
  contextCleanup: 500,
} as const;
