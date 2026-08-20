import React, { useEffect, useRef, useState } from 'react';
import { isSpeakingNow, subscribeToWaveform, getCurrentAmplitude } from '../utils/audio';
import { AIStatus } from '../types';

interface AudioVisualizerProps {
  status?: AIStatus;
  isListening?: boolean;
  isSpeaking?: boolean;
  variant?: 'reactor-overlay' | 'circular' | 'horizontal' | 'compact';
  width?: number;
  height?: number;
  className?: string;
  showHudLabels?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  status = 'IDLE',
  isListening = false,
  isSpeaking = false,
  variant = 'reactor-overlay',
  width,
  height,
  className = '',
  showHudLabels = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Web Audio API references for real microphone analysis
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const [activeMode, setActiveMode] = useState<'MIC' | 'TTS_SYNTH' | 'STANDBY'>('STANDBY');
  const [micPermission, setMicPermission] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [decibels, setDecibels] = useState<number>(-60);

  const phaseRef = useRef<number>(0);
  const smoothedAmpRef = useRef<number>(10);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const freqArrayRef = useRef<Uint8Array | null>(null);

  // Subscribe to speech synthesis audio waveform events from audio.ts
  const ttsAmpRef = useRef<number>(10);
  const ttsBandsRef = useRef<number[]>(Array(24).fill(15));
  const isSpeakingStatusRef = useRef<boolean>(false);

  useEffect(() => {
    const unsubscribe = subscribeToWaveform((bands, amp, isSpk) => {
      ttsBandsRef.current = bands;
      ttsAmpRef.current = amp;
      isSpeakingStatusRef.current = isSpk || isSpeakingNow();
    });
    return () => unsubscribe();
  }, []);

  // Initialize Web Audio API & Microphone Analyzer on demand
  useEffect(() => {
    let isCancelled = false;

    async function initMicrophone() {
      if (!isListening) {
        // Cleanup microphone when not listening
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach((t) => t.stop());
          micStreamRef.current = null;
        }
        if (micSourceRef.current) {
          micSourceRef.current.disconnect();
          micSourceRef.current = null;
        }
        return;
      }

      try {
        if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
          setMicPermission('denied');
          return;
        }

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContextClass();
        }

        if (audioCtxRef.current.state === 'suspended') {
          await audioCtxRef.current.resume();
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        micStreamRef.current = stream;
        setMicPermission('granted');

        const analyser = audioCtxRef.current.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.82;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;

        const source = audioCtxRef.current.createMediaStreamSource(stream);
        source.connect(analyser);

        analyserRef.current = analyser;
        micSourceRef.current = source;

        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        freqArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      } catch (err) {
        console.warn('Web Audio Microphone input not accessible:', err);
        setMicPermission('denied');
      }
    }

    initMicrophone();

    return () => {
      isCancelled = true;
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (micSourceRef.current) {
        micSourceRef.current.disconnect();
        micSourceRef.current = null;
      }
    };
  }, [isListening]);

  // Main Canvas 60 FPS Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let localParticles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      color: string;
    }> = [];

    const render = () => {
      const parent = containerRef.current;
      const rectWidth = parent ? parent.clientWidth : width || 320;
      const rectHeight = parent ? parent.clientHeight : height || 320;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== rectWidth * dpr || canvas.height !== rectHeight * dpr) {
        canvas.width = rectWidth * dpr;
        canvas.height = rectHeight * dpr;
        canvas.style.width = `${rectWidth}px`;
        canvas.style.height = `${rectHeight}px`;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rectWidth, rectHeight);

      const centerX = rectWidth / 2;
      const centerY = rectHeight / 2;

      // Determine state: Mic Input vs A.E.T.H.E.R. Speech vs Idle
      const currentlySpeaking = isSpeaking || isSpeakingStatusRef.current || isSpeakingNow();
      let targetAmp = 8;
      let rawData: Uint8Array | null = null;
      let freqData: Uint8Array | null = null;

      if (isListening && analyserRef.current && dataArrayRef.current) {
        setActiveMode('MIC');
        analyserRef.current.getByteTimeDomainData(dataArrayRef.current as any);
        if (freqArrayRef.current) {
          analyserRef.current.getByteFrequencyData(freqArrayRef.current as any);
          freqData = freqArrayRef.current;
        }
        rawData = dataArrayRef.current;

        // Compute RMS amplitude from microphone time domain buffer
        let sumSquares = 0;
        for (let i = 0; i < rawData.length; i++) {
          const norm = (rawData[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / rawData.length);
        targetAmp = Math.max(12, Math.min(100, rms * 240 + 10));

        const dbVal = Math.round(20 * Math.log10(Math.max(0.0001, rms)));
        setDecibels(Math.max(-80, Math.min(0, dbVal)));
      } else if (currentlySpeaking) {
        setActiveMode('TTS_SYNTH');
        targetAmp = Math.max(25, Math.min(95, ttsAmpRef.current));
        setDecibels(-14 + Math.round(Math.sin(phaseRef.current * 3) * 6));
      } else if (status === 'PROCESSING') {
        setActiveMode('STANDBY');
        targetAmp = 22 + Math.sin(phaseRef.current * 4) * 8;
        setDecibels(-45);
      } else {
        setActiveMode('STANDBY');
        targetAmp = 8 + Math.sin(phaseRef.current * 1.5) * 3;
        setDecibels(-60);
      }

      // Smooth amplitude lerp for organic feel
      smoothedAmpRef.current += (targetAmp - smoothedAmpRef.current) * 0.18;
      const currentAmp = smoothedAmpRef.current;
      const speedMultiplier = isListening ? 0.16 : currentlySpeaking ? 0.14 : 0.04;
      phaseRef.current += speedMultiplier;

      // -------------------------------------------------------------
      // 1. CIRCULAR PULSATING AURA & RADIAL ENERGY FIELD
      // -------------------------------------------------------------
      const radiusBase = Math.min(rectWidth, rectHeight) * 0.38;
      const pulseRingCount = isListening || currentlySpeaking ? 3 : 2;

      for (let r = 0; r < pulseRingCount; r++) {
        const ringPulse = Math.sin(phaseRef.current * 2 + r * 1.2) * (currentAmp * 0.15);
        const radius = radiusBase + r * 14 + ringPulse;

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle =
          r === 0
            ? 'rgba(0, 242, 255, 0.45)'
            : r === 1
            ? 'rgba(0, 242, 255, 0.22)'
            : 'rgba(112, 0, 255, 0.25)';
        ctx.lineWidth = r === 0 ? 1.5 : 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.restore();
      }

      // -------------------------------------------------------------
      // 2. RADIAL FREQUENCY SPIKES AROUND THE CORE RIM
      // -------------------------------------------------------------
      if (isListening || currentlySpeaking || status === 'PROCESSING') {
        const numSpikes = 48;
        ctx.save();
        for (let i = 0; i < numSpikes; i++) {
          const angle = (i / numSpikes) * Math.PI * 2 + phaseRef.current * 0.2;
          let spikeHeight = 4;

          if (freqData && i < freqData.length) {
            const freqVal = freqData[Math.floor((i / numSpikes) * freqData.length)] / 255;
            spikeHeight = 3 + freqVal * 28;
          } else {
            const bandIdx = Math.floor((i / numSpikes) * ttsBandsRef.current.length);
            const bandVal = (ttsBandsRef.current[bandIdx] || 15) / 100;
            spikeHeight = 3 + bandVal * 24 * Math.sin(phaseRef.current * 3 + i * 0.5);
          }

          const x1 = centerX + Math.cos(angle) * (radiusBase - 2);
          const y1 = centerY + Math.sin(angle) * (radiusBase - 2);
          const x2 = centerX + Math.cos(angle) * (radiusBase + spikeHeight);
          const y2 = centerY + Math.sin(angle) * (radiusBase + spikeHeight);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle =
            i % 2 === 0
              ? `rgba(0, 242, 255, ${0.4 + (spikeHeight / 30) * 0.6})`
              : `rgba(56, 189, 248, ${0.3 + (spikeHeight / 30) * 0.5})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      // -------------------------------------------------------------
      // 3. GLOWING, PULSATING CYAN WAVEFORM LINE (HORIZONTAL OVERLAY)
      // -------------------------------------------------------------
      const points = 120;
      const waveWidth = rectWidth * 0.92;
      const startX = (rectWidth - waveWidth) / 2;

      // Function to render smooth bezier glowing waveform
      const drawGlowingWave = (
        color: string,
        glowColor: string,
        glowBlur: number,
        lineWidth: number,
        ampScale: number,
        freq: number,
        phaseOffset: number,
        harmonic2Amp: number
      ) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowBlur;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();

        for (let i = 0; i <= points; i++) {
          const frac = i / points;
          const x = startX + frac * waveWidth;
          const normX = frac * Math.PI * 2;

          // Parabolic / Bell curve envelope so the line pins cleanly at the left/right boundaries
          const envelope = Math.sin(frac * Math.PI);

          let displacement = 0;

          if (rawData && rawData.length > 0) {
            // Live real-time Web Audio API microphone time-domain mapping
            const rawIdx = Math.floor(frac * (rawData.length - 1));
            const byteVal = (rawData[rawIdx] - 128) / 128; // -1 to 1
            displacement =
              byteVal * (currentAmp * ampScale * 0.85) * envelope +
              Math.sin(normX * freq + phaseRef.current + phaseOffset) * (currentAmp * 0.25) * envelope;
          } else {
            // High-fidelity multi-harmonic synthetic / vocal waveform
            displacement =
              (Math.sin(normX * freq + phaseRef.current + phaseOffset) * (currentAmp * ampScale) +
                Math.sin(normX * (freq * 2.1) - phaseRef.current * 1.6) * (currentAmp * harmonic2Amp) +
                Math.sin(normX * (freq * 0.5) + phaseRef.current * 0.7) * (currentAmp * 0.2)) *
              envelope;
          }

          const y = centerY + displacement;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          // Spawn audio peak reactive particles during high energy
          if (
            (isListening || currentlySpeaking) &&
            Math.abs(displacement) > 20 &&
            Math.random() < 0.08 &&
            localParticles.length < 35
          ) {
            localParticles.push({
              x,
              y,
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 2 - (displacement > 0 ? 0.8 : -0.8),
              life: 1,
              maxLife: 20 + Math.random() * 20,
              size: Math.random() * 2 + 1,
              color: Math.random() > 0.3 ? '#00f2ff' : '#7000ff',
            });
          }
        }

        ctx.stroke();
        ctx.restore();
      };

      // Layer 1: Outer Holographic Ambient Cyan Glow Ribbon
      drawGlowingWave(
        'rgba(0, 242, 255, 0.15)',
        '#00f2ff',
        24,
        6,
        0.55,
        2.4,
        0,
        0.3
      );

      // Layer 2: Harmonic Electric Blue / Violet Wave (Depth Offset)
      drawGlowingWave(
        'rgba(168, 85, 247, 0.75)',
        '#7000ff',
        14,
        1.8,
        0.42,
        4.2,
        Math.PI / 2.5,
        0.25
      );

      // Layer 3: Secondary Cyan Energy Harmonic Wave
      drawGlowingWave(
        'rgba(56, 189, 248, 0.85)',
        '#00f2ff',
        16,
        2.0,
        0.65,
        3.1,
        Math.PI / 4,
        0.35
      );

      // Layer 4: PRIMARY LASER CYAN WAVEFORM LINE (Ultra High Contrast Core)
      drawGlowingWave(
        '#ffffff',
        '#00f2ff',
        isListening || currentlySpeaking ? 22 : 10,
        isListening || currentlySpeaking ? 2.8 : 1.8,
        0.8,
        3.6,
        0,
        0.4
      );

      // -------------------------------------------------------------
      // 4. FLOATING SPARKS / ENERGY PARTICLES AT WAVE PEAKS
      // -------------------------------------------------------------
      ctx.save();
      for (let p = localParticles.length - 1; p >= 0; p--) {
        const pt = localParticles[p];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life++;

        const alpha = Math.max(0, 1 - pt.life / pt.maxLife);
        if (alpha <= 0) {
          localParticles.splice(p, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 6;
        ctx.globalAlpha = alpha;
        ctx.fill();
      }
      ctx.restore();

      // -------------------------------------------------------------
      // 5. CYBER HUD RETICLE TICKS & DECIBEL METERS (OPTIONAL HUD OVERLAYS)
      // -------------------------------------------------------------
      if (showHudLabels && variant === 'reactor-overlay') {
        ctx.save();
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(0, 242, 255, 0.7)';
        ctx.textBaseline = 'middle';

        // Left Reticle Marker
        ctx.textAlign = 'left';
        ctx.fillText('◄ 44.1 kHz', startX + 4, centerY - 14);
        ctx.fillText(`${decibels} dB`, startX + 4, centerY + 14);

        // Right Reticle Marker
        ctx.textAlign = 'right';
        ctx.fillText(
          isListening ? 'MIC ACTIVE ►' : currentlySpeaking ? 'TTS VOCAL ►' : 'STANDBY ►',
          startX + waveWidth - 4,
          centerY - 14
        );
        ctx.fillText(
          `${Math.round(currentAmp)}% AMP`,
          startX + waveWidth - 4,
          centerY + 14
        );

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isListening, isSpeaking, status, variant, width, height, showHudLabels, decibels]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center pointer-events-none select-none overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
