import React, { useEffect, useRef } from 'react';
import { AIStatus, CommandMode } from '../types';

interface NeuralPathVisualizerProps {
  thinkingProgress: number; // 0 to 100
  thinkingStatus?: string;
  status: AIStatus;
  currentMode?: CommandMode;
  className?: string;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  radius: number;
  layer: number; // 0: core, 1: mid, 2: outer
  pulsePhase: number;
  activation: number; // 0 to 1
  color: string;
  connections: number[];
}

interface SynapticPulse {
  fromIndex: number;
  toIndex: number;
  progress: number; // 0 to 1
  speed: number;
  color: string;
  size: number;
}

export const NeuralPathVisualizer: React.FC<NeuralPathVisualizerProps> = ({
  thinkingProgress,
  thinkingStatus = '',
  status,
  currentMode = 'home',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });

  // Mode color palettes
  const getModeColors = () => {
    switch (currentMode) {
      case 'coding':
        return { primary: '#00ffaa', secondary: '#00f2ff', accent: '#ffffff' };
      case 'space':
        return { primary: '#ffaa00', secondary: '#00f2ff', accent: '#ff0077' };
      case 'control':
        return { primary: '#ff0055', secondary: '#00f2ff', accent: '#ffffff' };
      case 'research':
        return { primary: '#00f2ff', secondary: '#7000ff', accent: '#ffffff' };
      default:
        return { primary: '#00f2ff', secondary: '#7000ff', accent: '#ffffff' };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNodes();
    };

    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Initialize Neural Node Network
    let nodes: Node[] = [];
    let pulses: SynapticPulse[] = [];

    const initNodes = () => {
      nodes = [];
      pulses = [];

      // Calculate node count based on screen size
      const count = Math.floor(Math.min(Math.max((width * height) / 38000, 22), 48));
      const centerX = width / 2;
      const centerY = height / 2;

      for (let i = 0; i < count; i++) {
        // Distribute in concentric organic ellipses around central AI core
        const layer = i < 4 ? 0 : i < 14 ? 1 : 2;
        const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
        
        let dist = 0;
        if (layer === 0) {
          dist = Math.random() * (Math.min(width, height) * 0.15) + 60;
        } else if (layer === 1) {
          dist = Math.random() * (Math.min(width, height) * 0.3) + 140;
        } else {
          dist = Math.random() * (Math.min(width, height) * 0.48) + 240;
        }

        const x = centerX + Math.cos(angle) * dist * (width / Math.max(height, 1));
        const y = centerY + Math.sin(angle) * dist;

        nodes.push({
          x: Math.max(30, Math.min(width - 30, x)),
          y: Math.max(30, Math.min(height - 30, y)),
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          baseRadius: layer === 0 ? 3.5 : layer === 1 ? 2.5 : 1.8,
          radius: layer === 0 ? 3.5 : layer === 1 ? 2.5 : 1.8,
          layer,
          pulsePhase: Math.random() * Math.PI * 2,
          activation: 0,
          color: layer === 0 ? '#00f2ff' : layer === 1 ? '#7000ff' : '#00f2ff88',
          connections: [],
        });
      }

      // Build nearest-neighbor synaptic graph connections
      for (let i = 0; i < nodes.length; i++) {
        const distances: { index: number; dist: number }[] = [];
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 220) {
            distances.push({ index: j, dist: d });
          }
        }
        distances.sort((a, b) => a.dist - b.dist);
        // Connect to closest 2 to 4 nodes
        nodes[i].connections = distances.slice(0, Math.min(distances.length, 3)).map((d) => d.index);
      }
    };

    initNodes();

    let lastTime = performance.now();

    // Render loop
    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      const isProcessing = status === 'PROCESSING';
      const isResponding = status === 'RESPONDING';
      const isListening = status === 'LISTENING';
      const progressRatio = Math.max(0, Math.min(100, thinkingProgress)) / 100;
      const palette = getModeColors();

      // Dynamic activity factor
      const activityMultiplier = isProcessing ? 2.2 : isResponding ? 1.5 : isListening ? 1.4 : 0.8;

      // Spawn Synaptic Pulses along paths
      if (Math.random() < (isProcessing ? 0.45 : isResponding ? 0.25 : 0.08) && nodes.length > 0) {
        const sourceIdx = Math.floor(Math.random() * nodes.length);
        const sourceNode = nodes[sourceIdx];
        if (sourceNode.connections.length > 0) {
          const targetIdx = sourceNode.connections[Math.floor(Math.random() * sourceNode.connections.length)];
          pulses.push({
            fromIndex: sourceIdx,
            toIndex: targetIdx,
            progress: 0,
            speed: (Math.random() * 0.8 + 0.6) * (isProcessing ? 1.8 : 1),
            color: Math.random() > 0.4 ? palette.primary : palette.secondary,
            size: Math.random() * 2 + 2,
          });
        }
      }

      // Update and Draw Synaptic Paths
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];

        // Organic slight drift
        nodeA.x += nodeA.vx * activityMultiplier;
        nodeA.y += nodeA.vy * activityMultiplier;

        // Bounce from boundaries
        if (nodeA.x < 20 || nodeA.x > width - 20) nodeA.vx *= -1;
        if (nodeA.y < 20 || nodeA.y > height - 20) nodeA.vy *= -1;

        // Mouse interaction attraction / deflection
        if (mouseRef.current.active) {
          const mdx = nodeA.x - mouseRef.current.x;
          const mdy = nodeA.y - mouseRef.current.y;
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mDist < 160 && mDist > 5) {
            const force = (1 - mDist / 160) * 0.8;
            nodeA.x += (mdx / mDist) * force * 2;
            nodeA.y += (mdy / mDist) * force * 2;
          }
        }

        // Calculate activation level based on progress and layer
        const nodeThreshold = (i / nodes.length);
        const targetActivation = isProcessing
          ? Math.max(0, Math.min(1, (progressRatio * 1.3) - nodeThreshold + 0.4))
          : isResponding
          ? 0.7
          : isListening
          ? 0.4
          : 0.1;

        nodeA.activation += (targetActivation - nodeA.activation) * 0.08;
        nodeA.pulsePhase += dt * (2 + nodeA.activation * 4);

        // Draw connections
        for (const targetIdx of nodeA.connections) {
          if (targetIdx > i) { // Draw once per pair
            const nodeB = nodes[targetIdx];
            const dx = nodeA.x - nodeB.x;
            const dy = nodeA.y - nodeB.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const pathActivation = (nodeA.activation + nodeB.activation) / 2;
            const alpha = Math.max(0.04, Math.min(0.7, (1 - dist / 240) * (0.15 + pathActivation * 0.65)));

            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);

            if (pathActivation > 0.4) {
              ctx.strokeStyle = `rgba(0, 242, 255, ${alpha})`;
              ctx.shadowColor = palette.primary;
              ctx.shadowBlur = 8 * pathActivation;
            } else {
              ctx.strokeStyle = `rgba(112, 0, 255, ${alpha * 0.8})`;
              ctx.shadowBlur = 0;
            }
            ctx.stroke();
          }
        }
      }

      // Update and Draw Synaptic Pulses (Photons travelling paths)
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.progress += pulse.speed * dt;

        if (pulse.progress >= 1) {
          pulses.splice(p, 1);
          continue;
        }

        const nodeFrom = nodes[pulse.fromIndex];
        const nodeTo = nodes[pulse.toIndex];
        if (!nodeFrom || !nodeTo) {
          pulses.splice(p, 1);
          continue;
        }

        const curX = nodeFrom.x + (nodeTo.x - nodeFrom.x) * pulse.progress;
        const curY = nodeFrom.y + (nodeTo.y - nodeFrom.y) * pulse.progress;

        // Draw glowing photon packet
        ctx.beginPath();
        ctx.arc(curX, curY, pulse.size, 0, Math.PI * 2);
        ctx.fillStyle = pulse.color;
        ctx.shadowColor = pulse.color;
        ctx.shadowBlur = 12;
        ctx.fill();

        // Trail
        const trailX = nodeFrom.x + (nodeTo.x - nodeFrom.x) * Math.max(0, pulse.progress - 0.08);
        const trailY = nodeFrom.y + (nodeTo.y - nodeFrom.y) * Math.max(0, pulse.progress - 0.08);
        ctx.beginPath();
        ctx.moveTo(curX, curY);
        ctx.lineTo(trailX, trailY);
        ctx.strokeStyle = pulse.color;
        ctx.lineWidth = pulse.size * 0.8;
        ctx.stroke();
      }

      // Draw Nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const pulseScale = Math.sin(node.pulsePhase) * 0.4 + 1;
        const currentRadius = node.baseRadius * (1 + node.activation * 0.8) * pulseScale;

        // Outer glow halo for activated nodes
        if (node.activation > 0.2 || isProcessing) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, currentRadius * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 242, 255, ${node.activation * 0.18})`;
          ctx.fill();
        }

        // Main Node Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(1, currentRadius), 0, Math.PI * 2);
        
        if (node.activation > 0.5) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = palette.primary;
          ctx.shadowBlur = 15;
        } else {
          ctx.fillStyle = node.layer === 0 ? palette.primary : palette.secondary;
          ctx.shadowColor = palette.secondary;
          ctx.shadowBlur = 6;
        }
        ctx.fill();
      }

      // Reset shadows
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [thinkingProgress, status, currentMode]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none overflow-hidden z-[1] transition-opacity duration-700 ${
        status === 'PROCESSING'
          ? 'opacity-100'
          : status === 'RESPONDING'
          ? 'opacity-85'
          : status === 'LISTENING'
          ? 'opacity-75'
          : 'opacity-40'
      } ${className}`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Floating Neural Synapse HUD Status Widget when AI is Thinking */}
      {(status === 'PROCESSING' || thinkingProgress > 0) && (
        <div className="absolute top-16 right-6 sm:right-12 z-10 pointer-events-none flex flex-col items-end animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="px-3 py-1.5 rounded-lg border border-[#00f2ff44] bg-[#050508dd] backdrop-blur-md shadow-[0_0_20px_rgba(0,242,255,0.25)] flex items-center gap-2.5">
            {/* Spinning Neural Synapse Reticle */}
            <div className="relative w-4 h-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#00f2ff] border-t-transparent animate-spin" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] shadow-[0_0_8px_#00f2ff] animate-ping" />
            </div>

            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#00f2ff] uppercase">
                  NEURAL PATH MATRIX
                </span>
                <span className="text-[10px] font-mono font-bold text-white">
                  {Math.round(thinkingProgress)}%
                </span>
              </div>

              <span className="text-[8px] font-mono text-slate-400 tracking-wider">
                {thinkingStatus || 'SYNAPSE COHERENCE ACTIVE'}
              </span>
            </div>
          </div>

          {/* Miniature Step Progress Bar */}
          <div className="w-36 h-1 bg-[#111122] rounded-full mt-1 overflow-hidden border border-[#00f2ff22]">
            <div
              className="h-full bg-gradient-to-r from-[#7000ff] via-[#00f2ff] to-white shadow-[0_0_10px_#00f2ff] transition-all duration-150"
              style={{ width: `${Math.max(5, thinkingProgress)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
