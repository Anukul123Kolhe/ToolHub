import React from 'react';

interface TravelingParticlesProps {
  isVertical?: boolean;
  isAnalyzing?: boolean;
  isCompleted?: boolean;
}

export const TravelingParticles: React.FC<TravelingParticlesProps> = ({
  isVertical = false,
  isAnalyzing = false,
  isCompleted = false,
}) => {
  // Luminous floating particles around the wave path
  const particles = [
    { id: 1, top: '25%', left: '15%', delay: '0s', size: 'w-2 h-2', glow: 'bg-cyan-400' },
    { id: 2, top: '65%', left: '30%', delay: '0.6s', size: 'w-1.5 h-1.5', glow: 'bg-blue-400' },
    { id: 3, top: '35%', left: '50%', delay: '1.2s', size: 'w-2.5 h-2.5', glow: 'bg-sky-300' },
    { id: 4, top: '75%', left: '70%', delay: '0.9s', size: 'w-1.5 h-1.5', glow: 'bg-indigo-400' },
    { id: 5, top: '20%', left: '85%', delay: '1.5s', size: 'w-2 h-2', glow: 'bg-violet-400' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Ambient Floating Luminous Orbs */}
      {particles.map((p) => (
        <span
          key={p.id}
          className={`absolute rounded-full ${p.size} ${
            isCompleted
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
              : isAnalyzing
              ? 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]'
              : `${p.glow} shadow-[0_0_8px_rgba(56,189,248,0.8)]`
          } animate-float-particle`}
          style={{
            top: p.top,
            left: p.left,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* Traveling Data Packets Stream */}
      {!isCompleted && (
        <div className="absolute inset-0 flex items-center justify-center">
          {isVertical ? (
            <div className="relative w-1 h-32 flex flex-col items-center">
              <span
                className={`w-2.5 h-4 rounded-sm ${
                  isAnalyzing
                    ? 'bg-gradient-to-b from-white to-violet-400 shadow-[0_0_10px_#a78bfa]'
                    : 'bg-gradient-to-b from-white to-cyan-400 shadow-[0_0_10px_#38bdf8]'
                } animate-wave-flow-vert`}
                style={{ animationDuration: isAnalyzing ? '2.4s' : '1.6s' }}
              />
              <span
                className={`w-1.5 h-3 rounded-sm ${
                  isAnalyzing ? 'bg-fuchsia-400 shadow-[0_0_8px_#e879f9]' : 'bg-blue-400 shadow-[0_0_8px_#60a5fa]'
                } animate-wave-flow-vert`}
                style={{ animationDuration: isAnalyzing ? '3s' : '2.2s', animationDelay: '0.7s' }}
              />
            </div>
          ) : (
            <div className="relative w-full h-8 flex items-center">
              <span
                className={`absolute w-4 h-2 rounded-sm ${
                  isAnalyzing
                    ? 'bg-gradient-to-r from-white to-violet-400 shadow-[0_0_10px_#a78bfa]'
                    : 'bg-gradient-to-r from-white to-cyan-400 shadow-[0_0_10px_#38bdf8]'
                } animate-wave-flow`}
                style={{ animationDuration: isAnalyzing ? '2.4s' : '1.8s' }}
              />
              <span
                className={`absolute w-3 h-1.5 rounded-sm ${
                  isAnalyzing ? 'bg-fuchsia-400 shadow-[0_0_8px_#e879f9]' : 'bg-blue-400 shadow-[0_0_8px_#60a5fa]'
                } animate-wave-flow`}
                style={{ animationDuration: isAnalyzing ? '3.2s' : '2.4s', animationDelay: '0.8s' }}
              />
              <span
                className="absolute w-2.5 h-1.5 rounded-sm bg-sky-300 shadow-[0_0_8px_#7dd3fc] animate-wave-flow"
                style={{ animationDuration: '2.0s', animationDelay: '1.3s' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TravelingParticles;
