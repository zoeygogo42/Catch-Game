import { GameConfig } from '../types';

export const defaultConfig: GameConfig = {
  branding: {
    gameTitle: 'Bakery Basket Catch',
    primaryColor: '#f87171', // red-400
    accentColor: '#fbbf24', // amber-400
    fontFamily: 'system-ui, sans-serif',
    logoUrl: '',
    welcomeBgUrl: '',
    winBgUrl: '',
    gameOverBgUrl: '',
  },
  mechanics: {
    startingLives: 3,
    defaultDuration: 30,
    gravityCoefficient: 1.0,
    basketSpeed: 10,
    showDebugZone: false,
  },
  assets: {
    basketUrl: '',
    normalCakeUrl: '',
    goldenCupcakeUrl: '',
    bombUrl: '',
    basketSize: 18,
    itemSize: 42,
    basketImages: {
      moving: {
        enabled: true,
        type: 'url',
        value: '',
      },
      catch: {
        enabled: true,
        type: 'url',
        value: '',
      },
      hit: {
        enabled: true,
        type: 'url',
        value: '',
      },
    },
  },
  backgrounds: {
    welcome: {
      enabled: true,
      type: 'none',
      value: '',
      fallbackColor: '#FFF7F2',
    },
    play: {
      enabled: true,
      type: 'none',
      value: '',
      fallbackColor: '#FFF7F2',
    },
    success: {
      enabled: true,
      type: 'none',
      value: '',
      fallbackColor: '#FFF7F2',
    },
    failed: {
      enabled: true,
      type: 'none',
      value: '',
      fallbackColor: '#EAF7FF',
    },
  },
  levels: [
    {
      id: 1,
      name: 'Cupcake Corner',
      targetScore: 100,
      durationSeconds: 30,
      fallSpeed: 2.0,
      spawnIntervalMs: 1200,
      goldenProbability: 0.15,
      bombProbability: 0.1,
      backgroundGradient: 'from-amber-50 to-orange-100',
    },
    {
      id: 2,
      name: 'Pastry Paradise',
      targetScore: 200,
      durationSeconds: 35,
      fallSpeed: 2.8,
      spawnIntervalMs: 1000,
      goldenProbability: 0.20,
      bombProbability: 0.15,
      backgroundGradient: 'from-orange-100 to-rose-100',
    },
    {
      id: 3,
      name: 'Master Bakery Blitz',
      targetScore: 350,
      durationSeconds: 40,
      fallSpeed: 3.6,
      spawnIntervalMs: 800,
      goldenProbability: 0.25,
      bombProbability: 0.20,
      backgroundGradient: 'from-rose-100 to-amber-200',
    },
  ],
};
