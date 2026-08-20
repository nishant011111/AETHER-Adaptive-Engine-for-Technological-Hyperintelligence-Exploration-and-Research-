import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  Zap,
  Sparkles,
  Scan,
  Maximize2,
  Check,
  AlertCircle,
  FlipHorizontal,
  Layers,
  Search,
  Cpu,
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { ImageAttachment } from '../types';

interface OpticalCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureImage: (image: ImageAttachment, promptPreset?: string) => void;
  soundEffects?: boolean;
}

export const OpticalCameraModal: React.FC<OpticalCameraModalProps> = ({
  isOpen,
  onClose,
  onCaptureImage,
  soundEffects = true,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [activePresetPrompt, setActivePresetPrompt] = useState<string>(
    'AETHER, analyze this visual frame in detail. Identify key objects, structural layout, text, or components, and explain what you see.'
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize Camera Stream
  useEffect(() => {
    if (!isOpen) {
      cleanupCamera();
      return;
    }

    startCamera();

    return () => {
      cleanupCamera();
    };
  }, [isOpen, facingMode]);

  const cleanupCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startCamera = async () => {
    cleanupCamera();
    setCameraError(null);
    setCapturedPhoto(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera MediaDevices API is not supported in this browser context.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((err) => console.warn('Video play error:', err));
      }
      if (soundEffects) playSound('chime');
    } catch (err: any) {
      console.warn('Camera access denied or failed:', err);
      setCameraError(
        err?.message ||
          'Camera access was denied or no camera device was detected. Please check browser permissions.'
      );
    }
  };

  const toggleFacingMode = () => {
    if (soundEffects) playSound('click');
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (soundEffects) playSound('pulse');

    setIsScanning(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(dataUrl);
    }

    setTimeout(() => {
      setIsScanning(false);
    }, 400);
  };

  const handleConfirmAttach = (presetText?: string) => {
    if (!capturedPhoto) return;
    if (soundEffects) playSound('click');

    const attachment: ImageAttachment = {
      dataUrl: capturedPhoto,
      mimeType: 'image/jpeg',
      fileName: `camera-scan-${Date.now()}.jpg`,
      sourceType: 'CAMERA',
    };

    onCaptureImage(attachment, presetText || activePresetPrompt);
    cleanupCamera();
    onClose();
  };

  const handleRetake = () => {
    if (soundEffects) playSound('click');
    setCapturedPhoto(null);
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 font-mono select-none">
      <div className="relative w-full max-w-4xl bg-[#060714] border border-[#00f2ff55] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,242,255,0.25)] flex flex-col max-h-[95vh]">
        {/* Top Cyber Header */}
        <div className="px-4 py-3 bg-[#0a0c24] border-b border-[#00f2ff33] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00f2ff] animate-ping" />
            <span className="text-white font-bold tracking-widest text-xs uppercase flex items-center gap-1.5">
              <Scan className="w-4 h-4 text-[#00f2ff]" />
              A.E.T.H.E.R. OPTICAL VISION SENSOR ACQUISITION
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!capturedPhoto && !cameraError && (
              <button
                onClick={toggleFacingMode}
                className="p-1.5 rounded-lg border border-[#00f2ff33] bg-[#00f2ff11] text-[#00f2ff] hover:bg-[#00f2ff22] transition text-xs flex items-center gap-1 cursor-pointer"
                title="Switch Camera (Front/Back)"
              >
                <FlipHorizontal className="w-4 h-4" />
                <span className="text-[10px] hidden sm:inline">{facingMode.toUpperCase()}</span>
              </button>
            )}

            <button
              onClick={() => {
                if (soundEffects) playSound('click');
                cleanupCamera();
                onClose();
              }}
              className="p-1.5 rounded-lg border border-slate-700 hover:border-rose-500 bg-black/40 text-slate-400 hover:text-rose-400 transition cursor-pointer"
              title="Close Optical Viewfinder"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder Video / Canvas Display */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[300px] sm:min-h-[420px]">
          {/* Error Message Display */}
          {cameraError ? (
            <div className="p-8 text-center max-w-md space-y-4 text-slate-300">
              <div className="w-12 h-12 mx-auto rounded-full border border-rose-500/50 bg-rose-950/40 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-white font-bold text-sm tracking-wider uppercase">
                OPTICAL SENSOR DISCONNECTED
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {cameraError}
              </p>
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-lg bg-[#00f2ff] text-black font-bold text-xs uppercase tracking-wider hover:bg-white transition cursor-pointer flex items-center gap-1.5 mx-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>RETRY CAMERA ACQUISITION</span>
              </button>
            </div>
          ) : capturedPhoto ? (
            /* Captured Freeze Frame */
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={capturedPhoto}
                alt="Captured Telemetry Frame"
                className="max-h-[55vh] sm:max-h-[60vh] object-contain rounded-lg border border-[#00f2ff44] shadow-[0_0_30px_#00f2ff22]"
              />
              <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 border border-[#00f2ff44] text-[#00f2ff] text-[10px] tracking-wider uppercase">
                FRAME LOCKED // RESOLUTION MATRIX STABILIZED
              </div>
            </div>
          ) : (
            /* Live Camera Feed with HUD Overlay */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover sm:object-contain max-h-[55vh] sm:max-h-[60vh]"
              />

              {/* Laser Line Scanning Effect */}
              {isScanning && (
                <div className="absolute inset-0 bg-[#00f2ff22] flex items-center justify-center pointer-events-none animate-pulse">
                  <div className="w-full h-1 bg-[#00f2ff] shadow-[0_0_20px_#00f2ff]" />
                </div>
              )}

              {/* Sci-Fi HUD Crosshair & Overlay Reticles */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 border border-[#00f2ff22]">
                {/* HUD Corners */}
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-[#00f2ff]" />
                  <div className="w-6 h-6 border-t-2 border-r-2 border-[#00f2ff]" />
                </div>

                {/* Center Reticle */}
                <div className="self-center flex flex-col items-center">
                  <div className="w-20 h-20 border border-[#00f2ff44] rounded-full flex items-center justify-center relative animate-spin-slow">
                    <div className="w-12 h-12 border-dashed border border-[#00f2ff66] rounded-full" />
                    <div className="w-1.5 h-1.5 bg-[#00f2ff] rounded-full shadow-[0_0_8px_#00f2ff]" />
                  </div>
                  <span className="text-[9px] text-[#00f2ff] mt-2 tracking-widest bg-black/60 px-2 py-0.5 rounded border border-[#00f2ff33]">
                    TARGET LOCK: OPTICAL MATRIX ACTIVE
                  </span>
                </div>

                {/* Bottom HUD info */}
                <div className="flex justify-between items-end">
                  <div className="w-6 h-6 border-b-2 border-l-2 border-[#00f2ff]" />
                  <div className="text-right text-[9px] text-[#00f2ff] bg-black/60 px-2 py-1 rounded border border-[#00f2ff22]">
                    ISO: AUTO // F/1.8 // FPS: 60
                  </div>
                  <div className="w-6 h-6 border-b-2 border-r-2 border-[#00f2ff]" />
                </div>
              </div>
            </div>
          )}

          {/* Hidden Canvas for Frame Capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 bg-[#0a0c24] border-t border-[#00f2ff33] space-y-3">
          {capturedPhoto ? (
            <div className="space-y-3">
              {/* Preset Vision Reasoning Actions */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-[#00f2ff] uppercase tracking-wider block opacity-80">
                  SELECT ANALYSIS DIRECTIVE // REASONING MATRIX:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() =>
                      handleConfirmAttach(
                        'AETHER, perform a comprehensive optical scan on this image. Identify all objects, layout, and explain the scene in full detail.'
                      )
                    }
                    className="p-2 rounded-lg border border-[#00f2ff33] bg-[#00f2ff11] hover:bg-[#00f2ff22] text-[#00f2ff] text-[10px] font-bold text-left transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 shrink-0" />
                    <span>General Breakdown</span>
                  </button>

                  <button
                    onClick={() =>
                      handleConfirmAttach(
                        'AETHER, analyze the technical architecture, schematic, mathematical formulation, or code in this image.'
                      )
                    }
                    className="p-2 rounded-lg border border-[#00f2ff33] bg-[#00f2ff11] hover:bg-[#00f2ff22] text-[#00f2ff] text-[10px] font-bold text-left transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Cpu className="w-3.5 h-3.5 shrink-0" />
                    <span>Technical / Diagram</span>
                  </button>

                  <button
                    onClick={() =>
                      handleConfirmAttach(
                        'AETHER, extract and transcribe all visible text, numbers, formulas, and labels in this image with exact precision.'
                      )
                    }
                    className="p-2 rounded-lg border border-[#00f2ff33] bg-[#00f2ff11] hover:bg-[#00f2ff22] text-[#00f2ff] text-[10px] font-bold text-left transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span>OCR / Extract Text</span>
                  </button>

                  <button
                    onClick={() =>
                      handleConfirmAttach(
                        'AETHER, identify any problems, bugs, circuit flaws, or errors depicted in this image and propose solutions.'
                      )
                    }
                    className="p-2 rounded-lg border border-[#00f2ff33] bg-[#00f2ff11] hover:bg-[#00f2ff22] text-[#00f2ff] text-[10px] font-bold text-left transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    <span>Diagnostic Audit</span>
                  </button>
                </div>
              </div>

              {/* Custom Prompt Input + Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <input
                  type="text"
                  value={activePresetPrompt}
                  onChange={(e) => setActivePresetPrompt(e.target.value)}
                  placeholder="Custom question about this frame..."
                  className="flex-1 w-full bg-[#05050e] border border-[#00f2ff33] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#00f2ff44] focus:outline-none focus:border-[#00f2ff]"
                />

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleRetake}
                    className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Retake
                  </button>
                  <button
                    onClick={() => handleConfirmAttach()}
                    className="px-4 py-2 rounded-lg bg-[#00f2ff] hover:bg-white text-black font-bold text-xs uppercase tracking-wider transition shadow-[0_0_15px_#00f2ff66] flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Check className="w-4 h-4" />
                    <span>SEND TO A.E.T.H.E.R.</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Live Camera Capture Trigger */
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 hidden sm:inline">
                Point optical sensor at target object, document, hardware, or environment
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
                <button
                  onClick={handleCapture}
                  disabled={!!cameraError}
                  className="px-6 py-2.5 rounded-xl bg-[#00f2ff] hover:bg-white text-black font-bold text-xs uppercase tracking-widest transition shadow-[0_0_20px_#00f2ff] flex items-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Camera className="w-4 h-4" />
                  <span>CAPTURE FRAME</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
