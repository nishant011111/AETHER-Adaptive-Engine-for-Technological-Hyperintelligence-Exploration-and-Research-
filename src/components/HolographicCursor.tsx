import React, { useEffect, useRef, useState } from 'react';

export const HolographicCursor: React.FC = () => {
  const leadDotRef = useRef<HTMLDivElement | null>(null);
  const floatingRingRef = useRef<HTMLDivElement | null>(null);
  const ambientGlowRef = useRef<HTMLDivElement | null>(null);
  const coordsLabelRef = useRef<HTMLDivElement | null>(null);

  // Raw and interpolated coordinate state refs (to avoid React re-render overhead)
  const targetPos = useRef({ x: -100, y: -100 });
  const leadPos = useRef({ x: -100, y: -100 });
  const floatPos = useRef({ x: -100, y: -100 });
  const velocity = useRef({ x: 0, y: 0 });
  const isHoveringInteractive = useRef(false);
  const isMouseDown = useRef(false);
  const isVisible = useRef(false);

  const [hasMouse, setHasMouse] = useState(false);

  useEffect(() => {
    // Check if device supports fine pointer (mouse/stylus)
    const mediaQuery = window.matchMedia('(pointer: fine)');
    setHasMouse(mediaQuery.matches);

    const handlePointerMove = (e: MouseEvent) => {
      if (!isVisible.current) {
        isVisible.current = true;
        if (leadDotRef.current) leadDotRef.current.style.opacity = '1';
        if (floatingRingRef.current) floatingRingRef.current.style.opacity = '1';
        if (ambientGlowRef.current) ambientGlowRef.current.style.opacity = '1';
      }

      targetPos.current.x = e.clientX;
      targetPos.current.y = e.clientY;

      // Check if hovering interactive target
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = !!(
          target.closest('button') ||
          target.closest('a') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('select') ||
          target.closest('[role="button"]') ||
          target.closest('.cursor-pointer') ||
          target.tagName === 'BUTTON' ||
          target.tagName === 'A'
        );
        isHoveringInteractive.current = interactive;
      }
    };

    const handleMouseDown = () => {
      isMouseDown.current = true;
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
    };

    const handleMouseLeave = () => {
      isVisible.current = false;
      if (leadDotRef.current) leadDotRef.current.style.opacity = '0';
      if (floatingRingRef.current) floatingRingRef.current.style.opacity = '0';
      if (ambientGlowRef.current) ambientGlowRef.current.style.opacity = '0';
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    // Continuous Animation Physics Loop
    let animId: number;

    const renderLoop = () => {
      // 1. Lead Point Lerp (Fast response: 0.45)
      const leadLerp = 0.45;
      leadPos.current.x += (targetPos.current.x - leadPos.current.x) * leadLerp;
      leadPos.current.y += (targetPos.current.y - leadPos.current.y) * leadLerp;

      // 2. Floating Ring Lerp with Spring Inertia (Z-Depth Lag: 0.14)
      const floatLerp = 0.14;
      const prevFloatX = floatPos.current.x;
      const prevFloatY = floatPos.current.y;
      floatPos.current.x += (targetPos.current.x - floatPos.current.x) * floatLerp;
      floatPos.current.y += (targetPos.current.y - floatPos.current.y) * floatLerp;

      // Calculate instantaneous velocity for dynamic stretch
      velocity.current.x = floatPos.current.x - prevFloatX;
      velocity.current.y = floatPos.current.y - prevFloatY;
      const speed = Math.sqrt(velocity.current.x ** 2 + velocity.current.y ** 2);
      const angle = Math.atan2(velocity.current.y, velocity.current.x) * (180 / Math.PI);
      const stretch = Math.min(speed * 0.04, 0.4);

      const isHovered = isHoveringInteractive.current;
      const isClicked = isMouseDown.current;

      // Update Lead Dot Position (Z: 70px)
      if (leadDotRef.current) {
        const scale = isClicked ? 0.7 : isHovered ? 1.4 : 1;
        leadDotRef.current.style.transform = `translate3d(${leadPos.current.x}px, ${leadPos.current.y}px, 70px) translate(-50%, -50%) scale(${scale})`;
      }

      // Update Floating Ring with lag, tilt & dynamic expansion (Z: 95px)
      if (floatingRingRef.current) {
        const ringScale = isClicked ? 0.85 : isHovered ? 1.65 : 1;
        const ringRotate = isHovered ? 45 : 0;
        floatingRingRef.current.style.transform = `translate3d(${floatPos.current.x}px, ${floatPos.current.y}px, 95px) translate(-50%, -50%) rotate(${angle}deg) scale(${1 + stretch}, ${1 - stretch * 0.5}) rotate(${-angle + ringRotate}deg) scale(${ringScale})`;

        if (isHovered) {
          floatingRingRef.current.style.borderColor = '#00f2ff';
          floatingRingRef.current.style.boxShadow = '0 0 20px rgba(0, 242, 255, 0.6), inset 0 0 10px rgba(0, 242, 255, 0.4)';
        } else {
          floatingRingRef.current.style.borderColor = 'rgba(0, 242, 255, 0.4)';
          floatingRingRef.current.style.boxShadow = '0 0 12px rgba(0, 242, 255, 0.25)';
        }
      }

      // Update Ambient Cyan Incident Light Glow (Z: 25px)
      if (ambientGlowRef.current) {
        const glowScale = isClicked ? 0.75 : isHovered ? 1.5 : 1;
        const glowOpacity = isHovered ? '0.55' : '0.35';
        ambientGlowRef.current.style.transform = `translate3d(${floatPos.current.x}px, ${floatPos.current.y}px, 25px) translate(-50%, -50%) scale(${glowScale})`;
        ambientGlowRef.current.style.opacity = glowOpacity;
      }

      // Update Floating Telemetry Coordinates Tag
      if (coordsLabelRef.current && isHovered) {
        coordsLabelRef.current.innerText = `LOC: [${Math.round(targetPos.current.x)}, ${Math.round(targetPos.current.y)}]`;
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  if (!hasMouse) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-50 select-none"
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1200px',
      }}
    >
      {/* 1. Volumetric Incident Cyan Glow Halo (Casts soft light on glass panels underneath) */}
      <div
        ref={ambientGlowRef}
        className="fixed top-0 left-0 w-64 h-64 rounded-full pointer-events-none opacity-0 transition-opacity duration-300 will-change-transform"
        style={{
          background:
            'radial-gradient(circle, rgba(0, 242, 255, 0.25) 0%, rgba(112, 0, 255, 0.12) 40%, rgba(0, 242, 255, 0.03) 65%, transparent 80%)',
          filter: 'blur(16px)',
        }}
      />

      {/* 2. Floating Reticle Ring with Z-Depth Lag & Corner Targeting Brackets (Z: 95px) */}
      <div
        ref={floatingRingRef}
        className="fixed top-0 left-0 w-9 h-9 rounded-full border border-[#00f2ff66] pointer-events-none opacity-0 transition-[border-color,box-shadow] duration-200 will-change-transform flex items-center justify-center"
      >
        {/* Holographic Crosshair Ticks */}
        <div className="absolute top-[-3px] left-1/2 -translate-x-1/2 w-[2px] h-[4px] bg-[#00f2ff] opacity-80" />
        <div className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-[2px] h-[4px] bg-[#00f2ff] opacity-80" />
        <div className="absolute left-[-3px] top-1/2 -translate-y-1/2 w-[4px] h-[2px] bg-[#00f2ff] opacity-80" />
        <div className="absolute right-[-3px] top-1/2 -translate-y-1/2 w-[4px] h-[2px] bg-[#00f2ff] opacity-80" />

        {/* Diagonal Corner Laser Accents */}
        <div className="absolute inset-[-4px] rounded-full border border-dashed border-[#7000ff44] animate-comet-spin" style={{ animationDuration: '14s' }} />

        {/* Micro Telemetry Coordinate Display */}
        <div
          ref={coordsLabelRef}
          className="absolute top-10 left-6 text-[8px] font-mono tracking-widest text-[#00f2ff] opacity-70 whitespace-nowrap drop-shadow-[0_0_6px_#00f2ff]"
        />
      </div>

      {/* 3. High-Precision Central Lead Dot (Z: 70px) */}
      <div
        ref={leadDotRef}
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#00f2ff,0_0_16px_#00f2ff] pointer-events-none opacity-0 will-change-transform"
      >
        <div className="absolute inset-0 rounded-full bg-[#00f2ff] animate-ping opacity-60" />
      </div>
    </div>
  );
};
