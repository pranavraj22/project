import React, { useState, useEffect } from 'react';

const BoxBreathingLoader: React.FC = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // 4-4-4-4 second cycle
    const interval = setInterval(() => {
      setPhase((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getInstruction = () => {
    switch (phase) {
      case 0: return "Inhale... 🌸";
      case 1: return "Hold... 😶";
      case 2: return "Exhale... 🌬️";
      case 3: return "Hold... 😶";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy/95 backdrop-blur-md text-white animate-fade-in">
      
      <div className="relative flex items-center justify-center w-64 h-64 mb-12">
        {/* Visual Track - The Box */}
        <div className="absolute inset-0 border-4 border-white/20 rounded-3xl"></div>
        
        {/* Animated Circle */}
        <div 
          className={`
            w-16 h-16 bg-neon rounded-full shadow-[0_0_30px_rgba(0,212,170,0.6)]
            transition-all duration-[4000ms] ease-in-out
            ${phase === 0 ? 'scale-[3] opacity-100' : ''} 
            ${phase === 1 ? 'scale-[3] opacity-80' : ''}
            ${phase === 2 ? 'scale-[0.5] opacity-100' : ''}
            ${phase === 3 ? 'scale-[0.5] opacity-80' : ''}
          `}
        />
      </div>

      <h2 className="text-5xl font-bold tracking-wider mb-6 min-w-[300px] text-center transition-all duration-500">
        {getInstruction()}
      </h2>
      
      <p className="text-blue-200 text-xl font-medium animate-pulse">
        Gemini is analyzing your notes...
      </p>
    </div>
  );
};

export default BoxBreathingLoader;