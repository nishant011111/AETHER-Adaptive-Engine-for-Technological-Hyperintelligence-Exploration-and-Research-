import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Mic,
  Trash2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Terminal,
  Waves,
  Camera,
  Image as ImageIcon,
  X,
  Scan,
  Maximize2,
  Cpu,
  Layers,
  Search,
  Upload,
  Zap,
} from 'lucide-react';
import { ChatMessage, CommandMode, VoiceConfig, ImageAttachment } from '../types';
import { playSound, speakText, stopSpeaking, isSpeakingNow } from '../utils/audio';
import { CometBorderTracer } from './CometBorderTracer';
import { HolographicWaveformVisualizer } from './HolographicWaveformVisualizer';
import { OpticalCameraModal } from './OpticalCameraModal';
import { ImageLightboxModal } from './ImageLightboxModal';

interface ChatConsoleProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, image?: ImageAttachment) => void;
  onClearMessages: () => void;
  onRegenerate: () => void;
  isProcessing: boolean;
  thinkingProgress: number;
  thinkingStatus: string;
  isListening: boolean;
  interimTranscript?: string;
  voiceVolume?: number;
  onToggleVoice: () => void;
  currentMode: CommandMode;
  voiceConfig: VoiceConfig;
  setVoiceConfig?: React.Dispatch<React.SetStateAction<VoiceConfig>>;
  isOfflineActive?: boolean;
}

export const ChatConsole: React.FC<ChatConsoleProps> = ({
  messages,
  onSendMessage,
  onClearMessages,
  onRegenerate,
  isProcessing,
  thinkingProgress,
  thinkingStatus,
  isListening,
  interimTranscript,
  voiceVolume = 0,
  onToggleVoice,
  currentMode,
  voiceConfig,
  setVoiceConfig,
  isOfflineActive = false,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [showVisualizer, setShowVisualizer] = useState<boolean>(true);
  const [attachedImage, setAttachedImage] = useState<ImageAttachment | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<ImageAttachment | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, thinkingStatus]);

  // Handle image file selection from Gallery / Disk
  const processImageFile = (file: File, sourceType: 'GALLERY' | 'CLIPBOARD' = 'GALLERY') => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WEBP, GIF).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        if (voiceConfig.soundEffects) playSound('chime');
        setAttachedImage({
          dataUrl,
          mimeType: file.type || 'image/jpeg',
          fileName: file.name,
          fileSizeBytes: file.size,
          sourceType,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImageFile(files[0], 'GALLERY');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clipboard paste support for screenshots
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file, 'CLIPBOARD');
          break;
        }
      }
    }
  };

  // Drag & drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFile(files[0], 'GALLERY');
    }
  };

  const handleCameraCapture = (image: ImageAttachment, presetPrompt?: string) => {
    setAttachedImage(image);
    if (presetPrompt) {
      setInputVal(presetPrompt);
    }
    inputRef.current?.focus();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputVal.trim();
    if ((!trimmed && !attachedImage) || isProcessing) return;

    // If A.E.T.H.E.R. is currently speaking or synthesizing, stop audio immediately for seamless interruption
    stopSpeaking();
    setSpeakingId(null);

    if (voiceConfig.soundEffects) playSound('click');
    onSendMessage(trimmed || 'AETHER, analyze this visual image in detail.', attachedImage || undefined);
    setInputVal('');
    setAttachedImage(null);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (voiceConfig.soundEffects) playSound('click');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakMessage = (text: string, id: string) => {
    if (speakingId === id || isSpeakingNow()) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }

    setSpeakingId(id);
    speakText(text, {
      voiceName: voiceConfig.voiceName,
      rate: voiceConfig.rate,
      pitch: voiceConfig.pitch,
      volume: voiceConfig.volume,
      onEnd: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  };

  const toggleMute = () => {
    playSound('click');
    if (!voiceConfig.isMuted) {
      stopSpeaking();
      setSpeakingId(null);
      if (setVoiceConfig) {
        setVoiceConfig((prev) => ({ ...prev, isMuted: true, autoSpeak: false }));
      }
    } else {
      if (setVoiceConfig) {
        setVoiceConfig((prev) => ({ ...prev, isMuted: false, autoSpeak: true }));
      }
    }
  };

  const renderProgressBar = (progress: number) => {
    const totalBlocks = 12;
    const filled = Math.min(Math.max(Math.round((progress / 100) * totalBlocks), 0), totalBlocks);
    const empty = totalBlocks - filled;
    return '■'.repeat(filled) + '□'.repeat(empty);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      className="flex flex-col h-full glass-hologram-panel rounded-xl overflow-hidden relative shadow-[0_15px_35px_rgba(0,0,0,0.8)]"
    >
      {/* Hidden File Input for Gallery Selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Drag & Drop Visual HUD Overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-40 bg-[#00f2ff18] backdrop-blur-md border-2 border-dashed border-[#00f2ff] rounded-xl flex flex-col items-center justify-center p-6 pointer-events-none animate-pulse">
          <Upload className="w-12 h-12 text-[#00f2ff] mb-2" />
          <span className="text-white font-mono font-bold tracking-widest text-sm uppercase">
            DROP IMAGE TO INGEST INTO A.E.T.H.E.R. OPTICAL MATRIX
          </span>
          <span className="text-[#00f2ff] text-xs font-mono mt-1">
            Accepts PNG, JPEG, WEBP, GIF for visual analysis & reasoning
          </span>
        </div>
      )}

      {/* Console Top Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#00f2ff22] bg-[#0a0b1e88] text-xs font-mono select-none">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] shadow-[0_0_5px_#00f2ff] animate-pulse" />
          <span className="text-white font-bold tracking-widest text-[11px]">
            NEURAL CONVERSATION MATRIX
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded border border-[#00f2ff33] bg-[#00f2ff11] text-[#00f2ff]">
            PROTOCOL: {currentMode.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Camera Quick Button */}
          <button
            onClick={() => {
              if (voiceConfig.soundEffects) playSound('click');
              setIsCameraModalOpen(true);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded border border-[#00f2ff33] bg-[#00f2ff11] text-[#00f2ff] hover:bg-[#00f2ff22] transition text-[9px] uppercase tracking-wider cursor-pointer"
            title="Open Optical Camera Viewfinder (Live Video Scan)"
          >
            <Camera className="w-3 h-3" />
            <span className="hidden sm:inline">CAMERA HUD</span>
          </button>

          {/* Gallery Upload Button */}
          <button
            onClick={() => {
              if (voiceConfig.soundEffects) playSound('click');
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded border border-[#00f2ff33] bg-[#00f2ff11] text-[#00f2ff] hover:bg-[#00f2ff22] transition text-[9px] uppercase tracking-wider cursor-pointer"
            title="Select Image from Gallery or Disk"
          >
            <ImageIcon className="w-3 h-3" />
            <span className="hidden sm:inline">GALLERY</span>
          </button>

          {/* Waveform Visualizer Toggle */}
          <button
            onClick={() => {
              playSound('click');
              setShowVisualizer((prev) => !prev);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition text-[9px] uppercase tracking-wider cursor-pointer ${
              showVisualizer
                ? 'border-[#00f2ff55] bg-[#00f2ff18] text-[#00f2ff]'
                : 'border-[#ffffff18] text-slate-400 hover:text-white'
            }`}
            title="Toggle Holographic Audio Waveform Visualizer"
          >
            <Waves className="w-3 h-3" />
            <span className="hidden sm:inline">HUD WAVE</span>
          </button>

          {/* Master Voice Mute Button */}
          {setVoiceConfig && (
            <button
              onClick={toggleMute}
              className={`flex items-center gap-1 px-2 py-1 rounded border transition text-[9px] uppercase font-mono tracking-wider cursor-pointer ${
                voiceConfig.isMuted
                  ? 'border-rose-500/60 bg-rose-950/40 text-rose-300'
                  : 'border-[#00f2ff44] bg-[#00f2ff15] text-[#00f2ff]'
              }`}
              title={voiceConfig.isMuted ? 'Muted: Click to enable voice synthesis' : 'Click to Mute all voice responses'}
            >
              {voiceConfig.isMuted ? (
                <>
                  <VolumeX className="w-3 h-3 text-rose-400" />
                  <span className="hidden sm:inline">MUTED</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3 text-[#00f2ff]" />
                  <span className="hidden sm:inline">VOICE ON</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => {
              if (voiceConfig.soundEffects) playSound('click');
              onRegenerate();
            }}
            disabled={isProcessing || messages.length === 0}
            className="flex items-center gap-1 px-2 py-1 rounded border border-[#00f2ff22] text-slate-400 hover:text-[#00f2ff] hover:border-[#00f2ff55] transition disabled:opacity-30 cursor-pointer"
            title="Regenerate last response"
          >
            <RefreshCw className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-[9px] uppercase tracking-wider">Regenerate</span>
          </button>

          <button
            onClick={() => {
              if (voiceConfig.soundEffects) playSound('click');
              stopSpeaking();
              onClearMessages();
            }}
            disabled={messages.length === 0}
            className="flex items-center gap-1 px-2 py-1 rounded border border-[#00f2ff22] text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition disabled:opacity-30 cursor-pointer"
            title="Clear conversation"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline text-[9px] uppercase tracking-wider">Clear</span>
          </button>
        </div>
      </div>

      {/* Real-time Holographic Audio Waveform Visualizer Banner */}
      {showVisualizer && (
        <div className="px-4 pt-3 pb-1">
          <HolographicWaveformVisualizer
            status={isProcessing ? 'PROCESSING' : isSpeakingNow() ? 'RESPONDING' : 'IDLE'}
            isListening={isListening}
            autoSpeak={voiceConfig.autoSpeak}
            isMuted={voiceConfig.isMuted}
            onToggleMute={toggleMute}
            compact={true}
          />
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 font-mono space-y-3">
            <div className="w-12 h-12 rounded-full border border-[#00f2ff44] bg-[#00f2ff11] flex items-center justify-center text-[#00f2ff] shadow-[0_0_12px_#00f2ff22]">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-white font-semibold text-sm tracking-wider">
                AETHER NEURAL & OPTICAL MATRIX READY
              </p>
              <p className="text-xs text-slate-400 max-w-md opacity-80">
                Awaiting input from Nishant. Ask complex scientific calculations, space telemetry, GPS navigation, coding architecture, or attach photos from your camera and gallery to analyze and think about.
              </p>
            </div>

            {/* Quick Vision Launcher Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  if (voiceConfig.soundEffects) playSound('click');
                  setIsCameraModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg border border-[#00f2ff44] bg-[#00f2ff11] hover:bg-[#00f2ff22] text-[#00f2ff] text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Open Optical Camera</span>
              </button>
              <button
                onClick={() => {
                  if (voiceConfig.soundEffects) playSound('click');
                  fileInputRef.current?.click();
                }}
                className="px-3 py-1.5 rounded-lg border border-[#00f2ff44] bg-[#00f2ff11] hover:bg-[#00f2ff22] text-[#00f2ff] text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Upload From Gallery</span>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSystem = msg.sender === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="px-3 py-1 rounded border border-[#00f2ff22] bg-[#00f2ff08] text-[10px] font-mono text-[#00f2ff] opacity-80">
                    [SYSTEM] {msg.text}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex justify-start ${isUser ? 'opacity-90' : 'opacity-100'}`}
              >
                <div className={`max-w-[92%] sm:max-w-[85%]`}>
                  {/* Sender Label */}
                  <div className="flex items-center space-x-2 mb-1.5 text-xs font-mono">
                    <span
                      className={`font-semibold tracking-wider ${
                        isUser ? 'text-[#a855f7]' : 'text-[#00f2ff]'
                      }`}
                    >
                      {isUser ? 'OPERATOR // NISHANT' : 'AETHER'}
                    </span>
                    {msg.image && (
                      <span className="px-1.5 py-0.2 rounded border border-[#00f2ff55] bg-[#00f2ff15] text-[#00f2ff] text-[9px] uppercase font-mono flex items-center gap-1">
                        <Scan className="w-2.5 h-2.5" />
                        OPTICAL ATTACHMENT
                      </span>
                    )}
                    {msg.isOffline && (
                      <span className="px-1.5 py-0.2 rounded border border-amber-500/40 bg-amber-950/40 text-amber-300 text-[9px] uppercase font-mono">
                        OFFLINE ENGINE
                      </span>
                    )}
                    {msg.autonomousRoute && (
                      <span className="hidden sm:inline-flex px-1.5 py-0.2 rounded border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 text-[9px] uppercase font-mono items-center gap-1">
                        <Zap className="w-2.5 h-2.5 text-cyan-400" />
                        <span>AUTO: {msg.autonomousRoute.subsystem} // {msg.autonomousRoute.protocol}</span>
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 opacity-60">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`${
                      isUser
                        ? 'bg-[#ffffff08] p-3.5 rounded-lg border border-[#ffffff11] text-sm text-slate-100 leading-relaxed'
                        : 'bg-[#00f2ff08] p-4 rounded-lg border border-[#00f2ff33] text-sm leading-relaxed text-white shadow-[0_0_20px_#00f2ff0a]'
                    }`}
                  >
                    {/* Attached Image Preview */}
                    {msg.image && (
                      <div className="mb-3">
                        <div
                          onClick={() => {
                            playSound('click');
                            setLightboxImage(msg.image!);
                          }}
                          className="relative inline-block group cursor-pointer overflow-hidden rounded-lg border border-[#00f2ff44] bg-black/40 hover:border-[#00f2ff] transition"
                        >
                          <img
                            src={msg.image.dataUrl}
                            alt={msg.image.fileName || 'Attached frame'}
                            className="max-h-56 w-auto object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-[#00f2ff] text-xs font-mono">
                            <Maximize2 className="w-4 h-4" />
                            <span>EXPAND OPTICAL FRAME</span>
                          </div>
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-[#00f2ff] border border-[#00f2ff33]">
                            {msg.image.sourceType || 'OPTICAL'}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="prose prose-invert max-w-none prose-p:my-1.5 prose-pre:my-2 prose-pre:bg-[#050508] prose-pre:border prose-pre:border-[#00f2ff22] prose-headings:text-[#00f2ff] prose-headings:font-display prose-a:text-[#00f2ff] prose-code:text-[#00f2ff] prose-code:font-mono">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>

                    {/* Grounding Sources / Citations */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-[#00f2ff22] text-xs font-mono">
                        <span className="text-[#00f2ff] text-[10px] uppercase tracking-wider block mb-1.5 opacity-80">
                          VERIFIED SOURCES // GROUNDING:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((src, idx) => (
                            <a
                              key={idx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-0.5 rounded border border-[#00f2ff33] bg-[#00f2ff11] text-[#00f2ff] hover:bg-[#00f2ff22] text-[10px] transition"
                            >
                              <span className="truncate max-w-[160px]">{src.title}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assistant Message Actions */}
                    {!isUser && (
                      <div className="mt-2.5 pt-2 flex items-center justify-end gap-2 text-slate-400 text-xs border-t border-[#00f2ff18]">
                        <button
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="p-1 rounded hover:text-[#00f2ff] hover:bg-[#00f2ff11] transition flex items-center gap-1 text-[10px] font-mono cursor-pointer"
                          title="Copy message"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === msg.id ? 'COPIED' : 'COPY'}</span>
                        </button>

                        <button
                          onClick={() => handleSpeakMessage(msg.text, msg.id)}
                          className={`p-1 rounded transition flex items-center gap-1 text-[10px] font-mono cursor-pointer ${
                            speakingId === msg.id
                              ? 'text-[#00f2ff] bg-[#00f2ff22] border border-[#00f2ff44]'
                              : 'hover:text-[#00f2ff] hover:bg-[#00f2ff11]'
                          }`}
                          title={speakingId === msg.id ? 'Stop Speaking' : 'Read Aloud'}
                        >
                          <Volume2 className={`w-3 h-3 ${speakingId === msg.id ? 'animate-pulse text-[#00f2ff]' : ''}`} />
                          <span>{speakingId === msg.id ? 'SPEAKING' : 'AUDIO'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* AI Thinking Animation */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="max-w-[85%] space-y-1">
              <div className="text-[10px] font-mono text-[#00f2ff] mb-1 flex items-center">
                <span className="mr-2">A.E.T.H.E.R.</span>
                <span className="w-1.5 h-1.5 bg-[#00f2ff] rounded-full shadow-[0_0_6px_#00f2ff] animate-ping" />
              </div>

              <div className="bg-[#00f2ff08] p-4 rounded-lg border border-[#00f2ff44] text-xs font-mono space-y-2 text-white shadow-[0_0_20px_#00f2ff11]">
                <div className="flex justify-between items-center text-[#00f2ff]">
                  <span className="text-[11px] font-semibold">{thinkingStatus}</span>
                  <span className="text-[10px]">{thinkingProgress}%</span>
                </div>

                <div className="text-[#00f2ff] tracking-widest text-xs bg-[#050508] px-3 py-1.5 rounded border border-[#00f2ff33]">
                  [{renderProgressBar(thinkingProgress)}]
                </div>

                <div className="flex items-center gap-2 text-[10px] opacity-60 text-slate-300">
                  <Terminal className="w-3 h-3 text-[#00f2ff]" />
                  <span>SYNTHESIZING HYPERINTELLIGENCE & OPTICAL TENSORS...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Draft Attached Image Banner */}
      {attachedImage && (
        <div className="px-4 sm:px-6 pt-2 pb-1 bg-[#0a0d2688] border-t border-[#00f2ff22]">
          <div className="flex items-center justify-between bg-[#05071a] p-2.5 rounded-xl border border-[#00f2ff44] shadow-[0_0_15px_#00f2ff11]">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#00f2ff66] bg-black shrink-0">
                <img
                  src={attachedImage.dataUrl}
                  alt="Draft frame"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-xs font-mono space-y-0.5">
                <div className="text-[#00f2ff] font-bold flex items-center gap-1 text-[11px]">
                  <Scan className="w-3 h-3" />
                  <span>OPTICAL FRAME ATTACHED</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-[#00f2ff22] text-[#00f2ff]">
                    {attachedImage.sourceType || 'CAMERA'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                  {attachedImage.fileName || 'Live Optical Sensor Capture'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Quick Prompt Presets */}
              <div className="hidden md:flex items-center gap-1 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() =>
                    setInputVal(
                      'AETHER, perform a comprehensive breakdown of this image. Identify all objects, architecture, text, and context.'
                    )
                  }
                  className="px-2 py-1 rounded border border-[#00f2ff33] bg-[#00f2ff11] text-[#00f2ff] hover:bg-[#00f2ff22] transition"
                >
                  General Analysis
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setInputVal(
                      'AETHER, analyze the technical schematic, diagram, code, or mathematics in this image.'
                    )
                  }
                  className="px-2 py-1 rounded border border-[#00f2ff33] bg-[#00f2ff11] text-[#00f2ff] hover:bg-[#00f2ff22] transition"
                >
                  Technical / Diagram
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setInputVal(
                      'AETHER, extract and transcribe all visible text and numerical labels in this image with exact precision.'
                    )
                  }
                  className="px-2 py-1 rounded border border-[#00f2ff33] bg-[#00f2ff11] text-[#00f2ff] hover:bg-[#00f2ff22] transition"
                >
                  OCR / Text
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (voiceConfig.soundEffects) playSound('click');
                  setAttachedImage(null);
                }}
                className="p-1.5 rounded-lg border border-slate-700 hover:border-rose-500 bg-black/40 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                title="Remove attached image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Spoken Interim Voice Hearing Banner */}
      {isListening && (
        <div className="px-4 sm:px-6 mb-2">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#00f2ff15] border border-[#00f2ff55] backdrop-blur-md shadow-[0_0_20px_#00f2ff22] animate-pulse">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex items-center gap-0.5 h-4 shrink-0">
                {[30, 80, 50, 100, 70, 40, 90].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${Math.max(20, Math.min(100, (voiceVolume || 30) * (h / 60)))}%` }}
                    className="w-1 bg-[#00f2ff] rounded-full transition-all duration-75"
                  />
                ))}
              </div>
              <div className="min-w-0 font-mono">
                <div className="text-[10px] text-[#00f2ff] uppercase font-bold tracking-wider">
                  {interimTranscript ? 'AUDIO STREAM TRANSCRIBING:' : 'LISTENING TO VOICE INPUT...'}
                </div>
                <div className="text-xs text-white truncate font-medium">
                  {interimTranscript ? `"${interimTranscript}"` : 'Speak your command freely (Nishant)...'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (voiceConfig.soundEffects) playSound('click');
                onToggleVoice();
              }}
              className="px-2.5 py-1 rounded bg-[#00f2ff22] hover:bg-[#00f2ff44] border border-[#00f2ff66] text-[#00f2ff] text-[10px] font-mono cursor-pointer transition shrink-0 ml-2"
            >
              SEND SPEECH
            </button>
          </div>
        </div>
      )}

      {/* Futuristic Bottom Input Area with Comet AI Border Tracer Beam */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-6 mt-auto">
        <CometBorderTracer
          glowColor={isListening ? '#00f2ff' : isProcessing ? '#7000ff' : '#00f2ff88'}
          speed={isListening || isProcessing ? 'fast' : 'normal'}
          active={true}
        >
          <form
            onSubmit={handleSubmit}
            className="flex items-center bg-[#0d0e24f0] border border-[#00f2ff44] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 backdrop-blur-xl shadow-[0_0_25px_rgba(0,242,255,0.12)]"
          >
            {/* Mic / Wake Button with Comet Pulse */}
            <div
              onClick={() => {
                if (voiceConfig.soundEffects) playSound('click');
                // Stop any speech when operator speaks
                stopSpeaking();
                onToggleVoice();
              }}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#00f2ff44] flex items-center justify-center mr-2 sm:mr-3 transition-all cursor-pointer shrink-0 ${
                isListening
                  ? 'bg-[#00f2ff33] border-[#00f2ff] shadow-[0_0_15px_#00f2ff]'
                  : 'hover:bg-[#00f2ff22]'
              }`}
              title={isListening ? 'Stop Voice Recognition' : 'Start Voice Recognition'}
            >
              {isListening ? (
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00f2ff] rounded-full shadow-[0_0_10px_#00f2ff] animate-ping" />
              ) : (
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#00f2ff] rounded-full shadow-[0_0_6px_#00f2ff]" />
              )}
            </div>

            {/* Camera Viewfinder Trigger Button */}
            <button
              type="button"
              onClick={() => {
                if (voiceConfig.soundEffects) playSound('click');
                setIsCameraModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#00f2ff] hover:bg-[#00f2ff11] transition mr-1 sm:mr-1.5 cursor-pointer shrink-0"
              title="Camera Scan: Capture optical telemetry live"
            >
              <Camera className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Gallery Upload Trigger Button */}
            <button
              type="button"
              onClick={() => {
                if (voiceConfig.soundEffects) playSound('click');
                fileInputRef.current?.click();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#00f2ff] hover:bg-[#00f2ff11] transition mr-2 sm:mr-2.5 cursor-pointer shrink-0"
              title="Gallery: Choose an image from device"
            >
              <ImageIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Main Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={
                attachedImage
                  ? 'Ask A.E.T.H.E.R. about this image (e.g. "What is this?", "Analyze schematic")...'
                  : 'Speak, type command, or attach camera/gallery image...'
              }
              disabled={isProcessing}
              className="bg-transparent border-none text-white focus:outline-none flex-grow placeholder:text-[#00f2ff55] text-xs sm:text-sm font-mono selection:bg-[#7000ff]"
            />

            {/* Clear Input */}
            {inputVal && (
              <button
                type="button"
                onClick={() => setInputVal('')}
                className="text-slate-400 hover:text-white text-xs font-mono mr-2 cursor-pointer"
              >
                ✕
              </button>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 shrink-0">
              {isProcessing ? (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="px-3 py-1 text-[10px] font-mono border border-[#00f2ff44] text-[#00f2ff] hover:bg-[#00f2ff22] uppercase tracking-widest transition-all rounded cursor-pointer"
                >
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputVal.trim() && !attachedImage}
                  className="px-3 sm:px-3.5 py-1.5 text-[10px] font-mono bg-[#00f2ff] text-black hover:bg-white uppercase font-bold tracking-widest transition-all rounded-lg shadow-[0_0_12px_#00f2ff] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Send
                </button>
              )}
            </div>
          </form>
        </CometBorderTracer>
      </div>

      {/* Optical Camera Modal */}
      <OpticalCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCaptureImage={handleCameraCapture}
        soundEffects={voiceConfig.soundEffects}
      />

      {/* Image Lightbox Modal */}
      <ImageLightboxModal
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};

