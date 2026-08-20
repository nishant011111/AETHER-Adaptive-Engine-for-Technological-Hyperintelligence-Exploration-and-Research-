import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, Activity, Mic, Waves, Radio } from 'lucide-react';
import { subscribeToWaveform, isSpeakingNow, stopSpeaking, playSound } from '../utils/audio';
import { AIStatus } from '../types';

interface HolographicWaveformVisualizerProps {
  status: AIStatus;
  isListening?: boolean;
  autoSpeak?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  compact?: boolean;
  className?: string;
}

export const HolographicWaveformVisualizer: React.FC<HolographicWaveformVisualizerProps> = ({
  status,
  isListening = false,
  autoSpeak = true,
  isMuted = false,
  onToggleMute,
  compact = false,
  className = '',
}) => {
  const [bands, setBands] = useState<number[]>(Array(24).fill(15));
  const [amplitude, setAmplitude] = useState<number>(15);
  const [speaking, setSpeaking] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  // Subscribe to real-time audio waveform stream
  useEffect(() => {
    const unsubscribe = subscribeToWaveform((updatedBands, updatedAmp, isSpk) => {
      setBands(updatedBands);
      setAmplitude(updatedAmp);
      setSpeaking(isSpk || isSpeakingNow());
    });
    return () => unsubscribe();
  }, []);

  // Oscilloscope canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderOscilloscope = () => {
      phaseRef.current += speaking ? 0.08 : 0.02;
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Draw subtle grid
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += 20) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += 12) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Draw central baseline
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      const activeAmp = speaking
        ? Math.max(15, amplitude * 0.45)
        : isListening
        ? 22
        : status === 'PROCESSING'
        ? 18
        : 6;

      // Draw primary waveform glow
      const drawWave = (color: string, glowColor: string, waveAmp: number, freq: number, phaseOffset: number, lineWidth: number) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = speaking ? 14 : 6;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();

        const points = 80;
        for (let i = 0; i <= points; i++) {
          const x = (i / points) * width;
          const normalizedX = (i / points) * Math.PI * 2;
          
          // Gaussian envelope (tapers at edges)
          const envelope = Math.sin((i / points) * Math.PI);
          
          const y =
            centerY +
            Math.sin(normalizedX * freq + phaseRef.current + phaseOffset) *
              waveAmp *
              envelope +
            Math.sin(normalizedX * (freq * 2.3) - phaseRef.current * 1.5) *
              (waveAmp * 0.35) *
              envelope;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      };

      // 1. Core Cyan Wave
      drawWave('#00f2ff', '#00f2ff', activeAmp, 3.2, 0, 2);
      // 2. Harmonic Violet Secondary Wave
      drawWave('#a855f7', '#7000ff', activeAmp * 0.7, 4.8, Math.PI / 3, 1.5);
      // 3. Electric Blue Tertiary Wave
      if (speaking) {
        drawWave('#38bdf8', '#0284c7', activeAmp * 0.4, 6.4, Math.PI / 1.8, 1);
      }

      animFrameRef.current = requestAnimationFrame(renderOscilloscope);
    };

    animFrameRef.current = requestAnimationFrame(renderOscilloscope);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [speaking, amplitude, isListening, status]);

  const isActive = speaking || isListening || status === 'RESPONDING';

  return (
    <div
      className={`rounded-xl border transition-all duration-300 relative overflow-hidden backdrop-blur-md ${
        isActive
          ? 'border-[#00f2ff66] bg-[#050b18dd] shadow-[0_0_20px_#00f2ff22]'
          : 'border-[#00f2ff22] bg-[#050508bb]'
      } ${className}`}
    >
      {/* Top HUD Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#00f2ff22] bg-[#00f2ff08]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {isActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f2ff] opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isMuted
                  ? 'bg-rose-500'
                  : speaking
                  ? 'bg-[#00f2ff]'
                  : isListening
                  ? 'bg-emerald-400'
                  : 'bg-indigo-400'
              }`}
            />
          </span>

          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#00f2ff]">
            {isMuted
              ? 'AUDIO SYNTHESIS MUTED'
              : speaking
              ? 'A.E.T.H.E.R. VOCAL STREAM'
              : isListening
              ? 'OPERATOR AUDIO INPUT'
              : status === 'PROCESSING'
              ? 'NEURAL SYNTHESIZING'
              : 'VOCAL HUD STANDBY'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Amplitude & dB Display */}
          <span className="text-[9px] font-mono text-slate-400">
            {speaking ? `AMP: ${amplitude}% | -${(100 - amplitude) / 2}dB` : '48kHz / 32-bit'}
          </span>

          {/* Quick Mute Action */}
          {onToggleMute && (
            <button
              onClick={() => {
                playSound('click');
                if (speaking) stopSpeaking();
                onToggleMute();
              }}
              className={`p-1 rounded text-xs transition ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-[#00f2ff11] text-[#00f2ff] border border-[#00f2ff33] hover:bg-[#00f2ff22]'
              }`}
              title={isMuted ? 'Unmute voice synthesis' : 'Mute voice synthesis'}
            >
              {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Visualizer Body */}
      <div className="p-3 flex flex-col gap-2.5">
        {/* Oscilloscope Canvas */}
        <div className="relative h-12 w-full rounded border border-[#00f2ff18] bg-[#020308] overflow-hidden">
          <canvas
            ref={canvasRef}
            width={380}
            height={48}
            className="w-full h-full block"
          />
          <div className="absolute top-1 right-1.5 text-[8px] font-mono text-[#00f2ff66] pointer-events-none">
            OSCILLOSCOPE 48kHz
          </div>
        </div>

        {/* 24-Band Equalizer Frequency Bars */}
        <div className="flex items-end justify-between gap-1 h-10 px-1 py-1 rounded bg-[#02030888] border border-[#00f2ff12]">
          {bands.map((val, idx) => {
            const isMid = idx >= 8 && idx <= 15;
            const barHeight = Math.max(8, val);
            return (
              <div
                key={idx}
                className="flex-1 flex flex-col justify-end items-center h-full group relative"
              >
                <div
                  className={`w-full rounded-t-sm transition-all duration-75 ${
                    isMuted
                      ? 'bg-rose-500/30'
                      : speaking
                      ? isMid
                        ? 'bg-gradient-to-t from-[#7000ff] to-[#00f2ff] shadow-[0_0_8px_#00f2ff88]'
                        : 'bg-gradient-to-t from-[#1e1b4b] to-[#00f2ff]'
                      : 'bg-[#00f2ff28]'
                  }`}
                  style={{ height: `${barHeight}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Frequency Range Sub-Labels */}
        {!compact && (
          <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 px-1">
            <span>SUB-BASS 20Hz</span>
            <span>VOCAL MID 1.2kHz</span>
            <span>AIR 16kHz</span>
          </div>
        )}
      </div>
    </div>
  );
};
