/** Alle speelbalans op één plek. Tijden in seconden, afstanden in canvaspixels. */
export const SETTINGS = {
  duration: 90, lives: 3, countdown: 3,
  startSpeed: 350, endSpeed: 490,
  jumpVelocity: 880, gravity: 2050,
  spinDuration: 0.85, spinCooldown: 0.95,
  invulnerability: 1.7, shieldDuration: 5,
  obstaclePoints: 100, starPoints: 25, ringPoints: 75, finishBonus: 1000,
  seed: 12010,
  stages: [
    { name: '01 / SURVIVALPARK', color: '#c4f659', subtitle: 'Epke, laat je skills zien!' },
    { name: '02 / BEAT STREET', color: '#b49aff', subtitle: 'Tieme, tijd om te shinen!' },
    { name: '03 / DE LAATSTE SPRINT', color: '#ffc773', subtitle: 'Samen naar het feest!' },
  ],
} as const;
