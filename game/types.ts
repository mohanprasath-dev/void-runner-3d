export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export interface GameStats {
  score: number;
  highScore: number;
  speed: number;
  distance: number;
  lives: number;
  shieldActive: boolean;
  shieldCooldown: number;
  combo: number;
  multiplier: number;
}

export interface GameConfig {
  fov: number;
  baseSpeed: number;
  maxSpeed: number;
  laneWidth: number;
}

export const CONFIG: GameConfig = {
  fov: 75,
  baseSpeed: 60,
  maxSpeed: 200,
  laneWidth: 8,
};