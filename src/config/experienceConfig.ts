export const CONFIG = {
  defaultLecture: 'physics',
  lectureDuration: 150,
  waterStartProgress: 0,
  waterFullProgress: 0.82,
  teacherMouthY: 0.44,
  waveAmplitude: 0.012,
  waveSpeed: 1.0,
  textSpawnRate: 1.6,
  maxFloatingTexts: 115,
  audio: {
    normalCutoff: 18000,
    underwaterCutoff: 780,
    underwaterGain: 0.24,
    bubbleMaxGain: 0.82,
    wetMix: 0.58,
  },
  flush: {
    pullThreshold: 68,
    delay: 360,
    duration: 4.8,
    drainX: 0.58,
    drainY: 0.98,
    suctionStrength: 2.6,
  },
  silenceDuration: 10,
} as const;

export type ExperienceState = 'IDLE' | 'LECTURE' | 'OVERFLOW' | 'FLOODING' | 'SUBMERGED' | 'FLUSHING' | 'SILENCE';
