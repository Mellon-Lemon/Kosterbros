import type { PowerUp } from './settings.ts';
export type Challenge =
  | 'rings'
  | 'ropes'
  | 'perfects'
  | 'lows'
  | 'combos'
  | 'powers';
export type Level = {
  id: number;
  name: string;
  duration: number;
  startSpeed: number;
  endSpeed: number;
  color: string;
  theme: 'forest' | 'canopy' | 'city' | 'works' | 'mix' | 'party';
  subtitle: string;
  lesson: string;
  challenge: Challenge;
  target: number;
  challengeLabel: string;
  pickups: PowerUp[];
};
export const LEVELS: Level[] = [
  {
    id: 0,
    name: 'Survivalpark',
    duration: 60,
    startSpeed: 300,
    endSpeed: 325,
    color: '#c4f659',
    theme: 'forest',
    subtitle: 'De eerste sprong naar avontuur.',
    lesson: 'Groen: spring over stammen. Paars: spin door beats.',
    challenge: 'rings',
    target: 4,
    challengeLabel: 'Pak 4 lage touwringen',
    pickups: ['shield'],
  },
  {
    id: 1,
    name: 'Boven de bomen',
    duration: 65,
    startSpeed: 310,
    endSpeed: 335,
    color: '#72e4be',
    theme: 'canopy',
    subtitle: 'Grijp de lucht. Pak dat touw.',
    lesson: 'Pak ↑↑. Tik groen, en nog eens in de lucht voor het hoge touw!',
    challenge: 'ropes',
    target: 3,
    challengeLabel: 'Grijp 3 hoge touwen',
    pickups: ['charge', 'shield'],
  },
  {
    id: 2,
    name: 'Beat Street',
    duration: 70,
    startSpeed: 320,
    endSpeed: 350,
    color: '#b49aff',
    theme: 'city',
    subtitle: 'Jouw moves. Jouw straat.',
    lesson: 'Spin vlak vóór een beatblok voor PERFECT. Vul BRO POWER!',
    challenge: 'perfects',
    target: 4,
    challengeLabel: 'Maak 4 perfecte spins',
    pickups: ['boost', 'shield', 'charge'],
  },
  {
    id: 3,
    name: 'Bouwplaats Bounce',
    duration: 75,
    startSpeed: 330,
    endSpeed: 365,
    color: '#ffc773',
    theme: 'works',
    subtitle: 'Onderdoor, erover, altijd door.',
    lesson: 'Lage balk? Blijf op de grond en spin eronderdoor.',
    challenge: 'lows',
    target: 4,
    challengeLabel: 'Passeer 4 lage doorgangen',
    pickups: ['magnet', 'double', 'boost', 'shield', 'charge'],
  },
  {
    id: 4,
    name: 'Neon Mix',
    duration: 80,
    startSpeed: 340,
    endSpeed: 375,
    color: '#ff92bf',
    theme: 'mix',
    subtitle: 'Twee moves. Eén perfect moment.',
    lesson: 'Stam + beat? Spring én spin. Beide knoppen werken samen.',
    challenge: 'combos',
    target: 3,
    challengeLabel: 'Passeer 3 spring-spincombinaties',
    pickups: ['heart', 'double', 'magnet', 'boost', 'shield', 'charge'],
  },
  {
    id: 5,
    name: 'Naar het feest!',
    duration: 90,
    startSpeed: 350,
    endSpeed: 390,
    color: '#ffdc7e',
    theme: 'party',
    subtitle: 'Alles wat jullie kunnen. Eén finale.',
    lesson: 'Alle skills bij elkaar. Gebruik BRO POWER zodra de meter vol is!',
    challenge: 'powers',
    target: 2,
    challengeLabel: 'Activeer BRO POWER 2 keer',
    pickups: ['charge', 'shield', 'magnet', 'double', 'boost', 'heart'],
  },
];
