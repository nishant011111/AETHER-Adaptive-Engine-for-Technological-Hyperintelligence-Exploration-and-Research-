import React, { useEffect, useState, useRef } from 'react';
import { AIStatus } from '../types';
import { Sparkles, Mic, Terminal, Rocket, ShieldAlert, Code2, Zap } from 'lucide-react';
import { playSound, isSpeakingNow } from '../utils/audio';
import { AudioVisualizer } from './AudioVisualizer';

interface AICoreReactorProps {
  status: AIStatus;
  onQuickCommand: (cmd: string) => void;
  onToggleVoice: () => void;
  isListening: boolean;
  interimTranscript?: string;
  voiceVolume?: number;
  onTriggerCometBurst?: () => void;
}

export const AICoreReactor: React.FC<AICoreReactorProps> = ({
  status,
  onQuickCommand,
  onToggleVoice,
  isListening,
  interimTranscript,
  voiceVolume = 0,
  onTriggerCometBurst,
}) => {
  const [waveformData, setWaveformData] = useState<number[]>([15, 30, 50, 65, 45, 30, 60, 75, 55, 35, 20, 55]);
  const [cometBurstActive, setCometBurstActive] = useState(false);
  const reactorRef = useRef<HTMLDivElement | null>(null);

  // Current smoothed 3D transform values
  const [currentTilt, setCurrentTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const targetTiltRef = useRef({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const animFrameRef = useRef<number | null>(null);

  // Dynamic waveform equalizer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'PROCESSING' || status === 'RESPONDING' || isListening) {
      interval = setInterval(() => {
        setWaveformData((prev) =>
          prev.map(() => Math.floor(Math.random() * (isListening ? 80 : 60) + 20))
        );
      }, 80);
    } else {
      setWaveformData([12, 22, 30, 40, 30, 22, 35, 45, 32, 24, 18, 28]);
    }
    return () => clearInterval(interval);
  }, [status, isListening]);

  // Window-Wide Mouse & Gyroscope Parallax Tracking
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!reactorRef.current) return;
      const rect = reactorRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Distance from center of reactor in window viewport pixels
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      // Normalize across screen (max tilt ~18 deg for high-depth feel)
      const maxTilt = 18;
      const normX = Math.max(-1, Math.min(1, dx / (window.innerWidth * 0.45)));
      const normY = Math.max(-1, Math.min(1, dy / (window.innerHeight * 0.45)));

      const rotateY = normX * maxTilt;
      const rotateX = -normY * maxTilt;

      // Glare position percentage on reactor surface
      const glareX = Math.max(0, Math.min(100, 50 + normX * 45));
      const glareY = Math.max(0, Math.min(100, 50 + normY * 45));

      targetTiltRef.current = { rotateX, rotateY, glareX, glareY };
    };

    // Mobile Device Orientation Gyroscope Support
    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      const gamma = Math.max(-30, Math.min(30, e.gamma)); // left/right [-30, 30]
      const beta = Math.max(-30, Math.min(30, e.beta - 45)); // front/back [-30, 30]

      const rotateY = (gamma / 30) * 16;
      const rotateX = -(beta / 30) * 16;

      targetTiltRef.current = {
        rotateX,
        rotateY,
        glareX: 50 + (gamma / 30) * 40,
        glareY: 50 + (beta / 30) * 40,
      };
    };

    window.addEventListener('mousemove', handleWindowMouseMove, { passive: true });
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
    }

    // Smooth Lerp physics loop for organic spring feel
    const lerpLoop = () => {
      setCurrentTilt((prev) => {
        const lerpFactor = 0.12;
        const newRotateX = prev.rotateX + (targetTiltRef.current.rotateX - prev.rotateX) * lerpFactor;
        const newRotateY = prev.rotateY + (targetTiltRef.current.rotateY - prev.rotateY) * lerpFactor;
        const newGlareX = prev.glareX + (targetTiltRef.current.glareX - prev.glareX) * lerpFactor;
        const newGlareY = prev.glareY + (targetTiltRef.current.glareY - prev.glareY) * lerpFactor;

        return {
          rotateX: Math.round(newRotateX * 100) / 100,
          rotateY: Math.round(newRotateY * 100) / 100,
          glareX: Math.round(newGlareX * 10) / 10,
          glareY: Math.round(newGlareY * 10) / 10,
        };
      });
      animFrameRef.current = requestAnimationFrame(lerpLoop);
    };

    animFrameRef.current = requestAnimationFrame(lerpLoop);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleCometBurst = () => {
    playSound('pulse');
    setCometBurstActive(true);
    if (onTriggerCometBurst) onTriggerCometBurst();
    setTimeout(() => setCometBurstActive(false), 2000);
  };

  const getStatusText = () => {
    switch (status) {
      case 'LISTENING':
        return 'VOICE RECOGNITION ACTIVE';
      case 'PROCESSING':
        return 'COMET NEURAL PROCESSING...';
      case 'RESPONDING':
        return 'SYNTHESIZING RESPONSE...';
      case 'INITIALIZING':
        return 'INITIALIZING CORE...';
      default:
        return 'AWAITING DIRECTIVES';
    }
  };

  const quickPrompts = [
    { label: 'ISRO Latest Telemetry', icon: <Rocket className="w-3.5 h-3.5" />, cmd: 'A.E.T.H.E.R., search for the latest ISRO Gaganyaan, NISAR, and space telemetry.' },
    { label: 'Quantum Computing Derivation', icon: <Sparkles className="w-3.5 h-3.5" />, cmd: 'A.E.T.H.E.R., derive and explain quantum error correction and topological qubits.' },
    { label: 'Root System & Hyperparameters', icon: <ShieldAlert className="w-3.5 h-3.5" />, cmd: 'A.E.T.H.E.R., audit system configuration, temperature, top-p, and kernel state for Nishant.' },
    { label: 'Space Mission Roadmap & Telemetry', icon: <Terminal className="w-3.5 h-3.5" />, cmd: 'A.E.T.H.E.R., review the mission milestones for ISRO Gaganyaan and Chandrayaan-4.' },
    { label: 'Generate TypeScript React Module', icon: <Code2 className="w-3.5 h-3.5" />, cmd: 'A.E.T.H.E.R., synthesize a robust TypeScript React component with clean modular state handling.' },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-4 px-2 relative select-none">
      {/* 3D Perspective Stage Container */}
      <div
        ref={reactorRef}
        style={{ perspective: '1200px' }}
        className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 flex items-center justify-center my-1"
      >
        {/* Parallax Holographic Matrix Layer with Multi-Plane Depth */}
        <div
          className="relative w-full h-full flex items-center justify-center pointer-events-auto"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${currentTilt.rotateX}deg) rotateY(${currentTilt.rotateY}deg)`,
            willChange: 'transform',
          }}
        >
          {/* Plane Z: -45px (Backdrop Ambient Nebula Glow) */}
          <div
            className={`absolute inset-0 rounded-full bg-[#1e266d] opacity-35 blur-3xl pointer-events-none transition-all duration-700 ${
              status === 'PROCESSING' || isListening ? 'scale-125 opacity-65 bg-[#00f2ff44]' : ''
            }`}
            style={{ transform: 'translateZ(-45px)' }}
          />

          {/* Plane Z: -20px (Orbiting Comet Ring 1: Cyan High Speed) */}
          <div
            className="absolute inset-[-12px] rounded-full pointer-events-none animate-comet-spin"
            style={{
              animationDuration: isListening ? '1.8s' : '3.5s',
              transform: 'translateZ(-20px)',
            }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center">
              {/* Comet Head */}
              <div className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_18px_#00f2ff,0_0_35px_#00f2ff]" />
              {/* Comet Curved Tail */}
              <div className="w-24 h-1.5 bg-gradient-to-r from-[#00f2ff] via-[#00f2ff44] to-transparent rounded-full -ml-2 blur-[0.5px]" />
            </div>
          </div>

          {/* Plane Z: -10px (Orbiting Comet Ring 2: Violet Counter Orbit) */}
          <div
            className="absolute inset-[6px] rounded-full pointer-events-none"
            style={{
              animation: `cometSpin ${isListening ? '2.4s' : '5s'} linear infinite reverse`,
              transform: 'translateZ(-10px)',
            }}
          >
            <div className="absolute bottom-0 right-1/2 translate-x-1/2 flex items-center flex-row-reverse">
              {/* Comet Head */}
              <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_18px_#7000ff,0_0_35px_#7000ff]" />
              {/* Comet Tail */}
              <div className="w-20 h-1.5 bg-gradient-to-l from-[#7000ff] via-[#7000ff44] to-transparent rounded-full -mr-2 blur-[0.5px]" />
            </div>
          </div>

          {/* Plane Z: 0px (Outer Ring 1 - Dashed Cyber Reticle) */}
          <div
            className="absolute inset-0 rounded-full border border-[#00f2ff33] border-dashed animate-comet-spin pointer-events-none"
            style={{ animationDuration: '28s', transform: 'translateZ(0px)' }}
          />

          {/* Plane Z: 15px (Outer Ring 2 - Rotating Purple Reticle Accent) */}
          <div
            className="absolute inset-2 rounded-full border border-[#00f2ff22] relative flex items-center justify-center pointer-events-none"
            style={{ transform: 'translateZ(15px)' }}
          >
            <div
              className="absolute inset-0 rounded-full border-t-2 border-[#7000ff] animate-spin"
              style={{ animationDuration: '6s' }}
            />
          </div>

          {/* Plane Z: 25px (Outer Ring 3 - Double Cyan Glow Ring) */}
          <div
            className="absolute inset-6 rounded-full border border-[#00f2ff44] opacity-60 flex items-center justify-center pointer-events-none"
            style={{ transform: 'translateZ(25px)' }}
          >
            <div className="w-48 h-48 rounded-full border border-[#00f2ff22]" />
          </div>

          {/* Plane Z: 48px (Center Elevated Glowing AI Core Reactor Button) */}
          <div
            onClick={() => {
              playSound('pulse');
              onToggleVoice();
            }}
            style={{
              transform: 'translateZ(48px)',
            }}
            className={`relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-b from-[#111122] via-[#0a0b1e] to-[#050508] border cursor-pointer transition-all duration-300 flex flex-col items-center justify-center p-3 text-center group ${
              isListening
                ? 'scale-105 shadow-[0_0_45px_#00f2ff] border-[#00f2ff]'
                : 'border-[#00f2ff66] hover:scale-102 hover:shadow-[0_0_35px_#00f2ff66]'
            }`}
            title="Click to toggle Voice Recognition"
          >
            {/* Dynamic Glare Specular Sheen responding to Mouse Angle */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none opacity-45 transition-opacity duration-300 group-hover:opacity-85"
              style={{
                background: `radial-gradient(circle at ${currentTilt.glareX}% ${currentTilt.glareY}%, rgba(0, 242, 255, 0.45) 0%, rgba(112, 0, 255, 0.2) 40%, transparent 70%)`,
              }}
            />

            {/* Inner Pulsing Core Ring with Comet Plasma Glow */}
            <div className="absolute inset-1.5 rounded-full border border-[#00f2ff33] animate-pulse pointer-events-none" />
            <div className="absolute inset-3 rounded-full bg-radial from-[#00f2ff15] to-transparent pointer-events-none" />

            {/* Central Logo & Identifier Floating in Forefront (Z: 65px) */}
            <div
              className="relative z-10 flex flex-col items-center pointer-events-none"
              style={{ transform: 'translateZ(20px)' }}
            >
              <span className="font-display font-bold text-xl sm:text-2xl tracking-[0.25em] text-white drop-shadow-[0_0_14px_#00f2ff]">
                AETHER
              </span>
              <span className="text-[8px] sm:text-[9px] uppercase font-mono tracking-widest text-[#7000ff] font-bold mt-0.5 flex items-center gap-1">
                <span>COMET AI</span>
                <span className="w-1 h-1 rounded-full bg-[#00f2ff] animate-ping" />
              </span>

              {/* Status Pill */}
              <div className="mt-2 px-2.5 py-0.5 rounded-full bg-[#050508cc] border border-[#00f2ff33] backdrop-blur-sm flex items-center space-x-1.5 shadow-[0_0_10px_#00f2ff22]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] shadow-[0_0_6px_#00f2ff] animate-pulse" />
                <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider text-[#00f2ff]">
                  {getStatusText()}
                </span>
              </div>
            </div>
          </div>

          {/* Plane Z: 54px - Real-Time Glowing Pulsating Cyan AudioVisualizer Overlay across AI Core Reactor */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            style={{ transform: 'translateZ(54px)' }}
          >
            <AudioVisualizer
              status={status}
              isListening={isListening}
              isSpeaking={status === 'RESPONDING' || isSpeakingNow()}
              variant="reactor-overlay"
              showHudLabels={true}
              className="w-full h-full"
            />
          </div>

          {/* Plane Z: 58px (Dynamic Waveform Visualizer on Core Base) */}
          <div
            className="absolute bottom-3 sm:bottom-4 flex items-end space-x-1 h-6 z-20 pointer-events-none"
            style={{ transform: 'translateZ(58px)' }}
          >
            {waveformData.map((height, idx) => (
              <div
                key={idx}
                style={{ height: `${height}%` }}
                className={`w-1 rounded-full transition-all duration-100 ${
                  isListening
                    ? 'bg-[#00f2ff] shadow-[0_0_8px_#00f2ff]'
                    : status === 'PROCESSING'
                    ? 'bg-[#7000ff] shadow-[0_0_8px_#7000ff]'
                    : 'bg-[#00f2ff77]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Voice & Comet Controls Bar */}
      <div className="flex items-center gap-2 mt-1 mb-3 text-xs font-mono">
        <button
          onClick={() => {
            playSound('click');
            onToggleVoice();
          }}
          className={`flex items-center gap-2 px-3 py-1 rounded-full border transition cursor-pointer ${
            isListening
              ? 'bg-[#00f2ff22] border-[#00f2ff] text-[#00f2ff] shadow-[0_0_12px_#00f2ff55] animate-pulse'
              : 'bg-[#111122aa] border-[#00f2ff33] text-slate-300 hover:border-[#00f2ff] hover:text-[#00f2ff]'
          }`}
        >
          <Mic className={`w-3 h-3 ${isListening ? 'text-[#00f2ff] animate-bounce' : 'text-slate-400'}`} />
          <span className="text-[11px] tracking-wider">
            {isListening ? 'LISTENING TO NISHANT...' : 'VOICE STREAM READY'}
          </span>
        </button>

        {/* Comet Burst Button */}
        <button
          onClick={handleCometBurst}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#00f2ff33] bg-[#050508aa] text-[#00f2ff] hover:bg-[#00f2ff18] hover:border-[#00f2ff] transition cursor-pointer ${
            cometBurstActive ? 'shadow-[0_0_15px_#00f2ff] border-[#00f2ff] bg-[#00f2ff22]' : ''
          }`}
          title="Trigger instantaneous Comet particle streak"
        >
          <Zap className={`w-3 h-3 ${cometBurstActive ? 'text-white animate-spin' : 'text-[#00f2ff]'}`} />
          <span className="text-[10px] tracking-wider font-bold">
            {cometBurstActive ? 'COMET BURST!' : 'COMET BURST'}
          </span>
        </button>
      </div>

      {/* Real-Time Spoken Interim Voice Hearing Banner */}
      {isListening && (
        <div className="w-full max-w-lg mb-3 px-4 py-2 rounded-xl bg-[#00f2ff11] border border-[#00f2ff55] backdrop-blur-md shadow-[0_0_20px_#00f2ff22] flex items-center gap-3 animate-pulse">
          <div className="flex items-center gap-0.5 h-4">
            {[40, 85, 60, 100, 75, 45, 90].map((h, i) => (
              <div
                key={i}
                style={{ height: `${Math.max(20, Math.min(100, (voiceVolume || 30) * (h / 60)))}%` }}
                className="w-1 bg-[#00f2ff] rounded-full transition-all duration-75"
              />
            ))}
          </div>
          <div className="flex-1 text-left font-mono">
            <div className="text-[10px] text-[#00f2ff] uppercase font-bold tracking-wider">
              {interimTranscript ? 'AUDIO STREAM TRANSCRIBING:' : 'SPEAK YOUR COMMAND FREELY (NISHANT)...'}
            </div>
            <div className="text-xs text-white truncate font-medium">
              {interimTranscript ? `"${interimTranscript}"` : 'Listening on calibrated microphone...'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              playSound('click');
              onToggleVoice();
            }}
            className="px-2.5 py-1 rounded bg-[#00f2ff22] hover:bg-[#00f2ff44] border border-[#00f2ff66] text-[#00f2ff] text-[10px] font-mono cursor-pointer transition shrink-0"
          >
            DONE SPEAKING
          </button>
        </div>
      )}

      {/* Directives Bar */}
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[9px] uppercase tracking-[0.25em] text-[#00f2ff] font-mono flex items-center gap-1.5 opacity-80">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff]" />
            DIRECTIVE PROTOCOLS FOR NISHANT
          </span>
          <span className="text-[9px] font-mono text-[#00f2ff] opacity-70">COMET MATRIX ONLINE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => {
                playSound('click');
                onQuickCommand(p.cmd);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#11112288] border border-[#00f2ff22] hover:bg-[#00f2ff15] hover:border-[#00f2ff66] text-slate-300 hover:text-white transition text-left text-xs group cursor-pointer"
            >
              <span className="p-1 rounded bg-[#050508] border border-[#00f2ff33] text-[#00f2ff] group-hover:text-white shrink-0 group-hover:shadow-[0_0_8px_#00f2ff]">
                {p.icon}
              </span>
              <span className="truncate font-medium text-[11px] font-mono">{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
