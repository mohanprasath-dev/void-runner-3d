import React from 'react';
import { GameStats } from '../game/types';

interface Props {
  stats: GameStats;
}

export const HUD: React.FC<Props> = ({ stats }) => {
  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between text-white font-display select-none">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-xs text-cyan-400 tracking-widest">SCORE</span>
          <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-cyan-200">
            {Math.floor(stats.score).toLocaleString()}
          </span>
          <span className="text-xs text-fuchsia-400 mt-1">
             x{stats.multiplier} MULTIPLIER
          </span>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs text-red-400 tracking-widest">INTEGRITY</span>
            <div className="flex gap-1 mt-1">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-8 h-2 skew-x-12 ${i < stats.lives ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-gray-800'}`} 
                />
              ))}
            </div>
          </div>
          
          <div className="flex flex-col items-end w-32">
             <span className="text-xs text-green-400 tracking-widest">SHIELD</span>
             {stats.shieldActive ? (
                 <div className="text-green-400 font-bold animate-pulse">ACTIVE</div>
             ) : (
                <div className="w-full bg-gray-800 h-2 mt-2 skew-x-12 overflow-hidden">
                    <div 
                        className="h-full bg-green-500 shadow-[0_0_10px_lime]" 
                        style={{ width: `${Math.max(0, (5 - stats.shieldCooldown) / 5) * 100}%` }}
                    />
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Bottom Center */}
      <div className="self-center flex flex-col items-center mb-8">
         <div className="text-6xl font-black text-white/10 relative">
            {Math.floor(stats.speed)} <span className="text-lg">KM/H</span>
            <div className="absolute inset-0 text-white/80 blur-sm">
                {Math.floor(stats.speed)} <span className="text-lg">KM/H</span>
            </div>
         </div>
      </div>
    </div>
  );
};