import React, { useEffect, useRef } from 'react';
import { AIStatus, CommandMode } from '../types';

interface CometVisualizerBackgroundProps {
  status: AIStatus;
  isListening: boolean;
  currentMode: CommandMode;
  cometDensity?: 'LOW' | 'MEDIUM' | 'HIGH';
  interactive?: boolean;
}

interface Comet {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number; // in radians
  size: number;
  color: string;
  tailColor: string;
  opacity: number;
  maxOpacity: number;
  life: number;
  maxLife: number;
  particles: { x: number; y: number; size: number; opacity: number; color: string }[];
}

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  phase: number;
  color: string;
}

interface OrbitalComet {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  angle: number;
  speed: number;
  tilt: number;
  size: number;
  color: string;
  tailLength: number;
  history: { x: number; y: number; opacity: number }[];
}

export const CometVisualizerBackground: React.FC<CometVisualizerBackgroundProps> = ({
  status,
  isListening,
  currentMode,
  cometDensity = 'MEDIUM',
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };
    window.addEventListener('resize', handleResize);

    // Color palettes based on mode
    const getPalette = () => {
      switch (currentMode) {
        case 'space':
          return {
            primary: '#00f2ff',
            secondary: '#ffaa00',
            tertiary: '#7000ff',
            core: '#ffffff',
          };
        case 'research':
          return {
            primary: '#00f2ff',
            secondary: '#10b981',
            tertiary: '#06b6d4',
            core: '#e0f2fe',
          };
        case 'control':
          return {
            primary: '#ff0055',
            secondary: '#00f2ff',
            tertiary: '#ffaa00',
            core: '#ffffff',
          };
        case 'coding':
          return {
            primary: '#00f2ff',
            secondary: '#7000ff',
            tertiary: '#3b82f6',
            core: '#ffffff',
          };
        default:
          return {
            primary: '#00f2ff',
            secondary: '#7000ff',
            tertiary: '#38bdf8',
            core: '#ffffff',
          };
      }
    };

    // Stars collection
    let stars: Star[] = [];
    const initStars = () => {
      stars = [];
      const starCount = Math.floor((width * height) / 4500);
      const colors = ['#ffffff', '#00f2ff', '#a78bfa', '#93c5fd'];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.6 + 0.4,
          baseAlpha: Math.random() * 0.6 + 0.2,
          twinkleSpeed: Math.random() * 0.03 + 0.01,
          phase: Math.random() * Math.PI * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };
    initStars();

    // Streaking Comets
    const comets: Comet[] = [];
    const spawnComet = (customX?: number, customY?: number, customAngle?: number) => {
      const palette = getPalette();
      const angle =
        customAngle !== undefined
          ? customAngle
          : (Math.PI / 4) + (Math.random() * 0.4 - 0.2); // ~45 degree diagonal sweep
      
      const startX = customX !== undefined ? customX : Math.random() * width * 1.2 - width * 0.1;
      const startY = customY !== undefined ? customY : -40;

      const baseSpeed = status === 'PROCESSING' || isListening ? 14 : 7;
      const speed = baseSpeed + Math.random() * 6;
      const length = 120 + Math.random() * 180;
      const size = 2.2 + Math.random() * 2.2;
      const maxLife = 180 + Math.random() * 100;

      const cometColors = [palette.primary, palette.secondary, palette.tertiary];
      const selectedColor = cometColors[Math.floor(Math.random() * cometColors.length)];

      comets.push({
        x: startX,
        y: startY,
        length,
        speed,
        angle,
        size,
        color: palette.core,
        tailColor: selectedColor,
        opacity: 0,
        maxOpacity: 0.85 + Math.random() * 0.15,
        life: 0,
        maxLife,
        particles: [],
      });
    };

    // Orbital center Comets (orbiting center reactor screen area)
    const orbitalComets: OrbitalComet[] = [
      {
        cx: width / 2,
        cy: height / 2.6,
        rx: Math.min(width * 0.25, 260),
        ry: Math.min(height * 0.18, 140),
        angle: 0,
        speed: 0.022,
        tilt: -0.28,
        size: 3.5,
        color: '#00f2ff',
        tailLength: 26,
        history: [],
      },
      {
        cx: width / 2,
        cy: height / 2.6,
        rx: Math.min(width * 0.32, 340),
        ry: Math.min(height * 0.22, 190),
        angle: Math.PI,
        speed: -0.016,
        tilt: 0.35,
        size: 3,
        color: '#7000ff',
        tailLength: 30,
        history: [],
      },
      {
        cx: width / 2,
        cy: height / 2.6,
        rx: Math.min(width * 0.18, 180),
        ry: Math.min(height * 0.14, 110),
        angle: Math.PI / 2,
        speed: 0.03,
        tilt: 0.1,
        size: 2.5,
        color: '#38bdf8',
        tailLength: 20,
        history: [],
      },
    ];

    // Interactive mouse spawning
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      // Spawn burst of 2-3 interactive micro-comets
      for (let i = 0; i < 3; i++) {
        const randAngle = Math.random() * Math.PI * 2;
        spawnComet(clientX, clientY, randAngle);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Recalculate orbital centers on viewport
      orbitalComets[0].cx = width / 2;
      orbitalComets[0].cy = height / 2.5;
      orbitalComets[1].cx = width / 2;
      orbitalComets[1].cy = height / 2.5;
      orbitalComets[2].cx = width / 2;
      orbitalComets[2].cy = height / 2.5;

      // 1. Draw Twinkling Starfield
      stars.forEach((star) => {
        star.phase += star.twinkleSpeed;
        const currentAlpha = star.baseAlpha + Math.sin(star.phase) * 0.25;
        ctx.save();
        ctx.globalAlpha = Math.max(0.1, Math.min(1, currentAlpha));
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Starlight glow on bright stars
        if (star.size > 1.4 && currentAlpha > 0.6) {
          ctx.shadowBlur = 6;
          ctx.shadowColor = star.color;
          ctx.fill();
        }
        ctx.restore();
      });

      // 2. Spawn periodic streaking comets
      const spawnRate =
        status === 'PROCESSING' || isListening
          ? 35
          : cometDensity === 'HIGH'
          ? 60
          : cometDensity === 'LOW'
          ? 180
          : 95;

      if (frame % spawnRate === 0) {
        spawnComet();
      }

      // 3. Update & Draw Streaking Comets
      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        c.life++;

        // Fade in and out smoothly
        if (c.life < 20) {
          c.opacity = (c.life / 20) * c.maxOpacity;
        } else if (c.life > c.maxLife - 30) {
          c.opacity = Math.max(0, ((c.maxLife - c.life) / 30) * c.maxOpacity);
        } else {
          c.opacity = c.maxOpacity;
        }

        // Advance comet
        c.x += Math.cos(c.angle) * c.speed;
        c.y += Math.sin(c.angle) * c.speed;

        // Spawn trailing stardust spark particles
        if (frame % 2 === 0 && Math.random() > 0.3) {
          c.particles.push({
            x: c.x - Math.cos(c.angle) * (Math.random() * 30),
            y: c.y - Math.sin(c.angle) * (Math.random() * 30),
            size: Math.random() * 2 + 0.8,
            opacity: c.opacity,
            color: c.tailColor,
          });
        }

        // Draw Comet Tail with radiant gradient
        const tailX = c.x - Math.cos(c.angle) * c.length;
        const tailY = c.y - Math.sin(c.angle) * c.length;

        ctx.save();
        ctx.globalAlpha = c.opacity;

        const grad = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.15, c.color);
        grad.addColorStop(0.5, c.tailColor);
        grad.addColorStop(1, 'transparent');

        ctx.strokeStyle = grad;
        ctx.lineWidth = c.size;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // Glowing Comet Head
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = c.tailColor;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size * 1.4, 0, Math.PI * 2);
        ctx.fill();

        // Secondary Head Aura
        ctx.fillStyle = c.tailColor;
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size * 0.9, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Draw stardust particles
        for (let pIdx = c.particles.length - 1; pIdx >= 0; pIdx--) {
          const p = c.particles[pIdx];
          p.opacity -= 0.025;
          p.size *= 0.96;

          if (p.opacity <= 0 || p.size <= 0.2) {
            c.particles.splice(pIdx, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Cleanup off-screen or dead comets
        if (
          c.life >= c.maxLife ||
          c.x > width + 300 ||
          c.y > height + 300 ||
          c.x < -300 ||
          c.y < -300
        ) {
          comets.splice(i, 1);
        }
      }

      // 4. Update & Draw 3D Orbital Comets around AI Core Reactor
      orbitalComets.forEach((oc, idx) => {
        const speedBoost = status === 'PROCESSING' || isListening ? 2.2 : 1;
        oc.angle += oc.speed * speedBoost;

        // Parametric ellipse with tilt rotation
        const unrotatedX = oc.rx * Math.cos(oc.angle);
        const unrotatedY = oc.ry * Math.sin(oc.angle);

        const currentX =
          oc.cx + unrotatedX * Math.cos(oc.tilt) - unrotatedY * Math.sin(oc.tilt);
        const currentY =
          oc.cy + unrotatedX * Math.sin(oc.tilt) + unrotatedY * Math.cos(oc.tilt);

        // Store trail history
        oc.history.unshift({ x: currentX, y: currentY, opacity: 1 });
        if (oc.history.length > oc.tailLength) {
          oc.history.pop();
        }

        // Render curved comet tail
        if (oc.history.length > 2) {
          ctx.save();
          for (let h = 0; h < oc.history.length - 1; h++) {
            const progress = 1 - h / oc.history.length;
            ctx.beginPath();
            ctx.moveTo(oc.history[h].x, oc.history[h].y);
            ctx.lineTo(oc.history[h + 1].x, oc.history[h + 1].y);
            ctx.strokeStyle = oc.color;
            ctx.lineWidth = oc.size * progress * 1.5;
            ctx.globalAlpha = progress * 0.65;
            ctx.shadowBlur = 8 * progress;
            ctx.shadowColor = oc.color;
            ctx.stroke();
          }
          ctx.restore();
        }

        // Render orbital comet head
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = oc.color;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(currentX, currentY, oc.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = oc.color;
        ctx.shadowBlur = 28;
        ctx.beginPath();
        ctx.arc(currentX, currentY, oc.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handlePointerDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [status, isListening, currentMode, cometDensity, interactive]);

  return (
    <canvas
      ref={canvasRef}
      id="comet-ai-canvas-viewport"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    />
  );
};
