import React from 'react';

interface Props {
  onStart: () => void;
  highScore: number;
}

export const MainMenu: React.FC<Props> = ({ onStart, highScore }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-50 text-white">
      <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 font-display mb-8 animate-pulse drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">
        VOID RUNNER
      </h1>
      
      <div className="flex flex-col gap-6 items-center">
        <button 
          onClick={onStart}
          className="group relative px-12 py-4 bg-cyan-900/30 border border-cyan-500 overflow-hidden hover:bg-cyan-500/20 transition-all duration-300"
        >
          <div className="absolute inset-0 w-0 bg-cyan-500/20 transition-all duration-[250ms] ease-out group-hover:w-full opacity-30"></div>
          <span className="relative text-2xl font-bold font-display tracking-widest text-cyan-100 group-hover:text-white">
            INITIALIZE RUN
          </span>
        </button>

        <div className="mt-8 text-center space-y-2 font-mono text-cyan-300/70">
          <p>HIGH SCORE: <span className="text-fuchsia-400">{highScore.toLocaleString()}</span></p>
          <div className="text-sm border-t border-cyan-900/50 pt-4 mt-4">
            <p>[W/A/S/D] or [ARROWS] to Move</p>
            <p>[SPACE] for Shield</p>
            <p>[SHIFT] for Boost</p>
          </div>
        </div>
      </div>
    </div>
  );
};