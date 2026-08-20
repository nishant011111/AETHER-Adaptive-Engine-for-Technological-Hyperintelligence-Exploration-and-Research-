import React from 'react';

interface GlassHologramLayerProps {
  children?: React.ReactNode;
  className?: string;
  depth?: 'deep' | 'mid' | 'hud' | 'surface' | 'floating';
  interactive?: boolean;
}

export const GlassHologramLayer: React.FC<GlassHologramLayerProps> = ({
  children,
  className = '',
  depth = 'hud',
  interactive = true,
}) => {
  // Map depth levels to specific 3D Z-axis translation and volumetric glass styles
  const getDepthStyle = () => {
    switch (depth) {
      case 'deep':
        return {
          transform: 'translateZ(-60px) scale(1.05)',
        };
      case 'mid':
        return {
          transform: 'translateZ(-20px)',
        };
      case 'hud':
        return {
          transform: 'translateZ(15px)',
        };
      case 'surface':
        return {
          transform: 'translateZ(30px)',
        };
      case 'floating':
        return {
          transform: 'translateZ(45px)',
        };
      default:
        return {
          transform: 'translateZ(15px)',
        };
    }
  };

  return (
    <div
      style={{
        transformStyle: 'preserve-3d',
        ...getDepthStyle(),
      }}
      className={`relative transition-transform duration-300 ${
        interactive ? 'pointer-events-auto' : 'pointer-events-none'
      } ${className}`}
    >
      {children}
    </div>
  );
};

// Ambient Holographic Specular Sheen & Glass Corner Accents
export const HolographicGlassOverlay: React.FC<{
  intensity?: 'subtle' | 'medium' | 'high';
}> = ({ intensity = 'medium' }) => {
  const opacity =
    intensity === 'high' ? 'opacity-40' : intensity === 'medium' ? 'opacity-25' : 'opacity-15';

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden z-20"
      style={{
        transformStyle: 'preserve-3d',
        transform: 'translateZ(35px)',
      }}
    >
      {/* Dynamic diagonal refractive laser sheen */}
      <div
        className={`absolute inset-0 bg-gradient-to-tr from-transparent via-[#00f2ff10] to-[#7000ff15] ${opacity}`}
        style={{
          maskImage: 'linear-gradient(135deg, black 0%, transparent 60%)',
          WebkitMaskImage: 'linear-gradient(135deg, black 0%, transparent 60%)',
        }}
      />

      {/* Hologram Corner Brackets */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#00f2ff66] pointer-events-none" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#00f2ff66] pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#00f2ff66] pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#00f2ff66] pointer-events-none" />

      {/* Ambient Sub-Surface Grid Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-radial from-[#00f2ff0a] via-[#7000ff05] to-transparent pointer-events-none blur-xl" />
    </div>
  );
};
