import React from 'react';
import { TravelingParticles } from './TravelingParticles';

interface EnergyWaveProps {
  isVertical?: boolean;
  isCompleted?: boolean;
}

export const EnergyWave: React.FC<EnergyWaveProps> = ({
  isVertical = false,
  isCompleted = false,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center overflow-visible pointer-events-none ${
        isVertical ? 'w-full h-24 my-2' : 'w-28 sm:w-36 md:w-48 h-20'
      }`}
    >
      {/* Background Soft Pulse Light */}
      <div
        className={`absolute inset-0 rounded-full blur-xl transition-all duration-700 ${
          isCompleted
            ? 'bg-emerald-400/20'
            : 'bg-gradient-to-r from-blue-500/25 via-cyan-400/30 to-sky-300/20 animate-pulse'
        }`}
      />

      {isVertical ? (
        /* Vertical SVG Wave for Mobile Screens */
        <svg
          className="w-16 h-full overflow-visible"
          viewBox="0 0 60 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="verticalEnergyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="100%" stopColor={isCompleted ? '#34D399' : '#818CF8'} stopOpacity="0.9" />
            </linearGradient>

            <filter id="vertGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Diffuse Outer Glow Wave */}
          <path
            d="M 30 0 Q 15 25, 30 50 T 30 100"
            fill="none"
            stroke={isCompleted ? '#10B981' : '#38BDF8'}
            strokeWidth="8"
            strokeOpacity="0.25"
            filter="url(#vertGlow)"
          />

          {/* Primary Sharp Core Wave */}
          <path
            d="M 30 0 Q 15 25, 30 50 T 30 100"
            fill="none"
            stroke="url(#verticalEnergyGrad)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Animated Dashed Stream */}
          {!isCompleted && (
            <path
              d="M 30 0 Q 15 25, 30 50 T 30 100"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeDasharray="6 8"
              className="animate-wave-flow-vert"
              strokeLinecap="round"
            />
          )}
        </svg>
      ) : (
        /* Horizontal SVG Wave for Desktop and Tablet Screens */
        <svg
          className="w-full h-full overflow-visible"
          viewBox="0 0 200 60"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="horizontalEnergyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
              <stop offset="45%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="75%" stopColor="#60A5FA" stopOpacity="0.9" />
              <stop offset="100%" stopColor={isCompleted ? '#34D399' : '#A78BFA'} stopOpacity="0.8" />
            </linearGradient>

            <filter id="horizGlow" x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Ambient Glow Wave */}
          <path
            d="M 0 30 Q 50 10, 100 30 T 200 30"
            fill="none"
            stroke={isCompleted ? '#10B981' : '#38BDF8'}
            strokeWidth="9"
            strokeOpacity="0.3"
            filter="url(#horizGlow)"
          />

          {/* Mid Layer Bright Energy Ribbon */}
          <path
            d="M 0 30 Q 50 10, 100 30 T 200 30"
            fill="none"
            stroke="url(#horizontalEnergyGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Fast Flowing Bright Dashed Stream */}
          {!isCompleted && (
            <path
              d="M 0 30 Q 50 10, 100 30 T 200 30"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeDasharray="8 10"
              className="animate-wave-flow"
              strokeLinecap="round"
            />
          )}

          {/* Secondary Counter-Harmonic Subtle Wave */}
          <path
            d="M 0 30 Q 50 50, 100 30 T 200 30"
            fill="none"
            stroke={isCompleted ? '#34D399' : '#60A5FA'}
            strokeWidth="1.5"
            strokeOpacity="0.45"
            strokeDasharray="4 6"
          />
        </svg>
      )}

      {/* Floating and Traveling Particles */}
      <TravelingParticles isVertical={isVertical} isCompleted={isCompleted} />
    </div>
  );
};

export default EnergyWave;
