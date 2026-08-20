import React from 'react';

interface CometBorderTracerProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  duration?: string;
  speed?: 'normal' | 'fast' | 'slow';
  active?: boolean;
}

export const CometBorderTracer: React.FC<CometBorderTracerProps> = ({
  children,
  className = '',
  glowColor = '#00f2ff',
  duration = '4s',
  speed = 'normal',
  active = true,
}) => {
  const getAnimationDuration = () => {
    switch (speed) {
      case 'fast':
        return '2s';
      case 'slow':
        return '6s';
      default:
        return duration;
    }
  };

  return (
    <div className={`relative p-[1px] rounded-xl overflow-hidden group ${className}`}>
      {/* Dynamic Comet Border Tracer Beam */}
      {active && (
        <div
          className="absolute inset-[-100%] rounded-full animate-comet-spin opacity-80 pointer-events-none"
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, transparent 0%, transparent 70%, ${glowColor} 92%, #ffffff 98%, transparent 100%)`,
            animationDuration: getAnimationDuration(),
          }}
        />
      )}

      {/* Inner Container */}
      <div className="relative w-full h-full rounded-xl z-10">
        {children}
      </div>
    </div>
  );
};
