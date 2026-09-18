export interface BasketImageState {
  enabled: boolean;
  type: 'upload' | 'url';
  value: string;
}

export interface BasketImagesConfig {
  moving: BasketImageState;
  catch: BasketImageState;
  hit: BasketImageState;
}

export interface BackgroundState {
  enabled: boolean;
  type: 'upload' | 'url' | 'none';
  value: string;
  fallbackColor: string;
}

export interface BackgroundsConfig {
  welcome: BackgroundState;
  play: BackgroundState;
  success: BackgroundState;
  failed: BackgroundState;
}

export interface LevelConfig {
  id: number;
  name: string;
  targetScore: number;
  durationSeconds: number;
  fallSpeed: number;
  spawnIntervalMs: number;
  goldenProbability: number; // 0 to 1
  bombProbability: number; // 0 to 1
  backgroundGradient: string;
}

export interface GameConfig {
  branding: {
    gameTitle: string;
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    logoUrl: string;
    welcomeBgUrl: string;
    winBgUrl: string;
    gameOverBgUrl: string;
  };
  mechanics: {
    startingLives: number;
    defaultDuration: number;
    gravityCoefficient: number;
    basketSpeed: number;
    showDebugZone?: boolean;
  };
  assets: {
    basketUrl: string;
    normalCakeUrl: string;
    goldenCupcakeUrl: string;
    bombUrl: string;
    basketSize?: number;
    itemSize?: number;
    basketImages?: BasketImagesConfig;
  };
  backgrounds?: BackgroundsConfig;
  levels: LevelConfig[];
}

export type GameScreenState = 'WELCOME' | 'PLAYING' | 'LEVEL_COMPLETE' | 'VICTORY' | 'GAME_OVER';

export interface PlayStudioEventPayload {
  version: '1.0';
  gameID: string;
  sessionID: string;
  userID: string;
  timestamp: number;
  event: string;
  level: {
    current: number;
    total: number;
    hasNextLevel: boolean;
  };
  score: {
    levelScore: number;
    totalScore: number;
  };
  status: 'pending' | 'ongoing' | 'completed' | 'failed' | 'paused';
  metrics: {
    timeSpentSeconds: number;
    moves?: number;
    stars?: number;
    livesRemaining?: number;
    [key: string]: any;
  };
  signature: string;
}
