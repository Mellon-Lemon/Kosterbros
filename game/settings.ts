/** Balance values in virtual canvas units / seconds. */
export const SETTINGS = {
  lives: 3,
  countdown: 3,
  resumeCountdown: 2,
  jumpVelocity: 880,
  gravity: 2050,
  spinDuration: 0.85,
  spinCooldown: 0.95,
  perfectWindow: 0.2,
  invulnerability: 1.7,
  effectDuration: 8,
  beatBoostDuration: 6,
  boostedSpinDuration: 1.2,
  boostedSpinCooldown: 0.65,
  broDuration: 5,
  ropeDuration: 0.8,
  discoDuration: 1.2,
  discoPoints: 150,
  obstaclePoints: 100,
  starPoints: 25,
  ringPoints: 75,
  ropePoints: 150,
  perfectPoints: 50,
  finishBonus: 1000,
  energy: { obstacle: 8, perfect: 4, ring: 4, rope: 10 },
  seed: 12010,
};
export const POWERUPS = {
  charge: {
    name: 'Dubbeljump',
    symbol: '↑↑',
    color: '#c4f659',
    description: 'Eén extra tik in de lucht. Maximaal één lading.',
  },
  shield: {
    name: 'Schild',
    symbol: '◇',
    color: '#74def2',
    description: 'Vangt één botsing op. Duurt 8 seconden.',
  },
  magnet: {
    name: 'Sterrenmagneet',
    symbol: 'U',
    color: '#ff92bf',
    description: 'Trekt sterren aan, 8 seconden lang.',
  },
  double: {
    name: 'Dubbele punten',
    symbol: '×2',
    color: '#ffdc7e',
    description: '8 seconden dubbele spelpunten.',
  },
  boost: {
    name: 'Beat Boost',
    symbol: '♫',
    color: '#b49aff',
    description:
      '6 seconden betere spins. Breek de 3 discoboxen voor Tieme’s bonus!',
  },
  heart: {
    name: 'Herstelhart',
    symbol: '♥',
    color: '#ff7896',
    description: 'Eén leven erbij, tot maximaal drie.',
  },
} as const;
export type PowerUp = keyof typeof POWERUPS;
