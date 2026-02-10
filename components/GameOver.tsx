import React from 'react';
import { GameStats } from '../game/types';

interface Props {
  stats: GameStats;
  onRestart: () => void;
}

export const GameOver: React.FC<Props> = ({ stats, onRestart }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/20 backdrop-blur-md z-50 text-white">
      <h2 className="text-7xl font-black text-red-500 font-display mb-2 drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]">
        SYSTEM FAILURE
      </h2>
      <p className="text-xl text-red-200 mb-8 font-mono tracking-widest">SIGNAL LOST</p>

      <div className="bg-black/50 p-8 border border-red-500/30 backdrop-blur-xl w-96 mb-8">
        <div className="flex justify-between mb-2 border-b border-white/10 pb-2">
          <span className="text-gray-400">FINAL SCORE</span>
          <span className="text-2xl font-bold">{Math.floor(stats.score).toLocaleString()}</span>
        </div>
        <div className="flex justify-between mb-2 text-sm">
          <span className="text-gray-400">DISTANCE</span>
          <span className="text-cyan-400">{Math.floor(stats.distance)} KM</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">MAX COMBO</span>
          <span className="text-fuchsia-400">x{stats.multiplier}</span>
        </div>
      </div>

      <button 
        onClick={onRestart}
        className="px-10 py-3 bg-red-600 hover:bg-red-500 text-white font-bold font-display tracking-wider shadow-[0_0_20px_rgba(255,0,0,0.4)] transition-all hover:scale-105"
      >
        REBOOT SYSTEM
      </button>
    </div>
  );
};