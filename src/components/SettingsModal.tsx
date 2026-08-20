import React, { useState, useEffect } from 'react';
import { Settings, Volume2, VolumeX, Sparkles, X, Play, Sliders, Sun, Eye, ShieldAlert } from 'lucide-react';
import { VoiceConfig, WakeLockState } from '../types';
import { getAvailableVoices, speakText, playSound } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceConfig: VoiceConfig;
  onUpdateConfig: (config: Partial<VoiceConfig>) => void;
  wakeLockState?: WakeLockState;
  onToggleWakeLock?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  voiceConfig,
  onUpdateConfig,
  wakeLockState,
  onToggleWakeLock,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (isOpen) {
      getAvailableVoices().then((v) => setVoices(v));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestVoice = () => {
    speakText(
      'Greetings Nishant. A.E.T.H.E.R. neural voice subsystem is online and calibrated to your specifications.',
      {
        voiceName: voiceConfig.voiceName,
        rate: voiceConfig.rate,
        pitch: voiceConfig.pitch,
        volume: voiceConfig.volume,
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none font-mono">
      <div className="w-full max-w-lg p-5 sm:p-6 rounded-2xl border border-[#00f2ff33] bg-[#050508ee] shadow-[0_0_35px_#00f2ff18] space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#00f2ff]" />
            <h2 className="text-sm font-bold text-white tracking-widest uppercase">
              A.E.T.H.E.R. SYSTEM PREFERENCES // NISHANT
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-[#00f2ff] hover:bg-[#00f2ff11] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice Parameters */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider text-[#00f2ff]">
              SYNTHESIS VOICE ENGINE:
            </label>
            <select
              value={voiceConfig.voiceName || ''}
              onChange={(e) => onUpdateConfig({ voiceName: e.target.value })}
              className="w-full bg-[#111122] border border-[#00f2ff33] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00f2ff]"
            >
              <option value="">Default Neural Voice</option>
              {voices.map((v, i) => (
                <option key={i} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Rate & Pitch Sliders */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-slate-300 mb-1 text-[10px]">
                <span className="opacity-70">SPEECH RATE:</span>
                <span className="text-[#00f2ff] font-bold">{voiceConfig.rate}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.05"
                value={voiceConfig.rate}
                onChange={(e) => onUpdateConfig({ rate: parseFloat(e.target.value) })}
                className="w-full accent-[#00f2ff] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1 text-[10px]">
                <span className="opacity-70">SPEECH PITCH:</span>
                <span className="text-[#00f2ff] font-bold">{voiceConfig.pitch}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={voiceConfig.pitch}
                onChange={(e) => onUpdateConfig({ pitch: parseFloat(e.target.value) })}
                className="w-full accent-[#00f2ff] cursor-pointer"
              />
            </div>
          </div>

          {/* Volume Slider */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1 text-[10px]">
              <span className="opacity-70">SYNTHESIS VOLUME:</span>
              <span className="text-[#00f2ff] font-bold">{Math.round(voiceConfig.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={voiceConfig.volume}
              onChange={(e) => onUpdateConfig({ volume: parseFloat(e.target.value) })}
              className="w-full accent-[#00f2ff] cursor-pointer"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-[#00f2ff18]">
            {/* Always On Screen Lock Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#111122] border border-[#00f2ff2a] shadow-[0_0_12px_#00f2ff0d]">
              <div className="flex items-start gap-2.5">
                <Sun className={`w-4 h-4 mt-0.5 ${wakeLockState?.isActive ? 'text-amber-400 animate-spin-slow' : 'text-slate-400'}`} />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white block text-[11px]">Always-On Screen (Inhibit Sleep Mode)</span>
                    <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                      wakeLockState?.isActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {wakeLockState?.isActive ? 'LOCKED AWAKE' : 'SLEEP ALLOWED'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Prevents screen dimming, timeout, and standby sleep while using A.E.T.H.E.R.
                  </span>
                  {wakeLockState?.isActive && (
                    <span className="text-[9px] text-[#00f2ff] font-mono mt-0.5 block">
                      MODE: {wakeLockState.mode === 'NATIVE_WAKELOCK' ? 'W3C Screen WakeLock API' : 'Micro-Render Edge Keep-Alive'}
                    </span>
                  )}
                </div>
              </div>
              <input
                type="checkbox"
                checked={wakeLockState?.isActive ?? voiceConfig.alwaysOnScreen ?? true}
                onChange={() => {
                  if (onToggleWakeLock) {
                    onToggleWakeLock();
                  } else {
                    onUpdateConfig({ alwaysOnScreen: !voiceConfig.alwaysOnScreen });
                  }
                }}
                className="w-4 h-4 accent-amber-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#111122] border border-[#00f2ff18]">
              <div>
                <span className="font-semibold text-white block text-[11px]">Auto-Speak AI Replies</span>
                <span className="text-[10px] text-slate-400">Automatically vocalize responses from A.E.T.H.E.R.</span>
              </div>
              <input
                type="checkbox"
                checked={voiceConfig.autoSpeak}
                onChange={(e) => onUpdateConfig({ autoSpeak: e.target.checked })}
                className="w-4 h-4 accent-[#00f2ff] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#111122] border border-[#00f2ff18]">
              <div>
                <span className="font-semibold text-white block text-[11px]">Sound Effects & HUD Chimes</span>
                <span className="text-[10px] text-slate-400">Synthesizer audio clicks, boot chimes & radar pings</span>
              </div>
              <input
                type="checkbox"
                checked={voiceConfig.soundEffects}
                onChange={(e) => onUpdateConfig({ soundEffects: e.target.checked })}
                className="w-4 h-4 accent-[#00f2ff] cursor-pointer"
              />
            </div>
          </div>

          {/* Test Voice Button */}
          <button
            type="button"
            onClick={handleTestVoice}
            className="w-full py-2.5 rounded-lg border border-[#00f2ff44] bg-[#00f2ff11] hover:bg-[#00f2ff22] text-[#00f2ff] font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_10px_#00f2ff18]"
          >
            <Play className="w-3.5 h-3.5 fill-[#00f2ff]" />
            <span>Test Neural Voice Calibration</span>
          </button>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-3 border-t border-[#00f2ff18]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded text-xs font-mono font-bold bg-[#00f2ff] text-black hover:bg-white transition uppercase tracking-widest cursor-pointer shadow-[0_0_8px_#00f2ff]"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
