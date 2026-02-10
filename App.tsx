import React, { useEffect, useRef, useState } from 'react';
import { Game } from './game/GameEngine';
import { GameStats, GameState } from './game/types';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { GameOver } from './components/GameOver';

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: parseInt(localStorage.getItem('void_high') || '0'),
    speed: 0,
    distance: 0,
    lives: 3,
    shieldActive: false,
    shieldCooldown: 0,
    combo: 0,
    multiplier: 1
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Game Engine
    const game = new Game(
      containerRef.current,
      (newStats) => setStats(newStats),
      (finalStats) => {
        setStats(finalStats);
        setGameState('GAMEOVER');
      }
    );
    
    gameRef.current = game;

    return () => {
      game.dispose();
    };
  }, []);

  const handleStart = () => {
    if (gameRef.current) {
      gameRef.current.restart();
      setGameState('PLAYING');
    }
  };

  const handleRestart = () => {
    if (gameRef.current) {
      gameRef.current.restart();
      setGameState('PLAYING');
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      <div ref={containerRef} className="absolute inset-0" />
      
      {/* UI Layers */}
      {gameState === 'MENU' && (
        <MainMenu onStart={handleStart} highScore={stats.highScore} />
      )}
      
      {gameState === 'PLAYING' && (
        <HUD stats={stats} />
      )}
      
      {gameState === 'GAMEOVER' && (
        <GameOver stats={stats} onRestart={handleRestart} />
      )}
      
      <div className="absolute bottom-2 right-2 text-white/20 text-xs font-mono">
        v1.0.0 | THREE.JS | WEB AUDIO
      </div>
    </div>
  );
};

export default App;