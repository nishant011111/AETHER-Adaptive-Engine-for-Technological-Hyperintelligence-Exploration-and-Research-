import React, { useState, useEffect } from 'react';
import {
  Activity,
  Volume2,
  VolumeX,
  Sliders,
  Menu,
  ShieldCheck,
  Wifi,
  Cpu,
  Lock,
  Fingerprint,
  Sun,
  Moon,
} from 'lucide-react';
import { AIStatus, VoiceConfig, ConnectionStatus, AuthenticatedOperator, WakeLockState } from '../types';
import { playSound, stopSpeaking } from '../utils/audio';

interface TopBarProps {
  status: AIStatus;
  voiceConfig: VoiceConfig;
  setVoiceConfig: React.Dispatch<React.SetStateAction<VoiceConfig>>;
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
  onToggleTelemetry: () => void;
  showTelemetry: boolean;
  connectionStatus?: ConnectionStatus;
  forceOffline?: boolean;
  onToggleForceOffline?: () => void;
  operator?: AuthenticatedOperator | null;
  onLockGateway?: () => void;
  wakeLockState?: WakeLockState;
  onToggleWakeLock?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  status,
  voiceConfig,
  setVoiceConfig,
  onOpenSettings,
  onToggleSidebar,
  onToggleTelemetry,
  showTelemetry,
  connectionStatus = 'ONLINE',
  forceOffline = false,
  onToggleForceOffline,
  operator,
  onLockGateway,
  wakeLockState,
  onToggleWakeLock,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [utcStr, setUtcStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setUtcStr(
        now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).toUpperCase()
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusDisplay = () => {
    switch (status) {
      case 'LISTENING':
        return { label: 'LISTENING', dotColor: 'bg-[#00f2ff] shadow-[0_0_8px_#00f2ff] animate-ping', textColor: 'text-[#00f2ff]' };
      case 'PROCESSING':
        return { label: 'SYNTHESIZING', dotColor: 'bg-[#7000ff] shadow-[0_0_8px_#7000ff] animate-pulse', textColor: 'text-[#7000ff]' };
      case 'RESPONDING':
        return { label: 'TRANSMITTING', dotColor: 'bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse', textColor: 'text-emerald-400' };
      case 'INITIALIZING':
        return { label: 'CALIBRATING', dotColor: 'bg-amber-400 animate-spin', textColor: 'text-amber-400' };
      default:
        return { label: 'STANDBY', dotColor: 'bg-[#00f2ff88]', textColor: 'text-slate-400' };
    }
  };

  const statusInfo = getStatusDisplay();

  const toggleMute = () => {
    playSound('click');
    if (!voiceConfig.isMuted) {
      stopSpeaking();
      setVoiceConfig((prev) => ({ ...prev, isMuted: true, autoSpeak: false }));
    } else {
      setVoiceConfig((prev) => ({ ...prev, isMuted: false, autoSpeak: true }));
    }
  };

  const isOfflineActive = forceOffline || connectionStatus === 'OFFLINE_FALLBACK' || connectionStatus === 'DISCONNECTED';

  return (
    <header className="h-14 sm:h-16 border-b border-[#00f2ff22] bg-[#050508dd] backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between z-30 select-none">
      {/* Brand & Sidebar Toggle */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button
          onClick={() => {
            playSound('click');
            onToggleSidebar();
          }}
          className="p-1.5 rounded border border-[#00f2ff33] bg-[#050508bb] text-[#00f2ff] hover:bg-[#00f2ff22] transition lg:hidden"
          title="Toggle Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-[0.2em] text-white leading-tight font-display">
              AETHER
            </h1>
            <span className="hidden sm:inline-block text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border border-[#00f2ff33] bg-[#00f2ff11] text-[#00f2ff]">
              v3.7 HYPERCORE
            </span>
          </div>
          <p className="text-[8px] uppercase tracking-widest opacity-60 text-[#7000ff] font-mono hidden md:block">
            Adaptive Engine for Technological Hyperintelligence, Exploration, and Research
          </p>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="flex items-center space-x-3 sm:space-x-6">
        {/* Uplink / Offline Engine Toggle Pill */}
        <button
          onClick={() => {
            if (onToggleForceOffline) {
              playSound('click');
              onToggleForceOffline();
            }
          }}
          className={`px-2.5 py-1 rounded-full border font-mono text-[10px] flex items-center gap-1.5 transition cursor-pointer ${
            isOfflineActive
              ? 'border-amber-500/60 bg-amber-950/40 text-amber-300 shadow-[0_0_12px_#f59e0b33]'
              : 'border-emerald-500/50 bg-emerald-950/30 text-emerald-400 shadow-[0_0_8px_#10b98122]'
          }`}
          title={
            isOfflineActive
              ? 'Offline Logic Engine Active (Local State Fallback). Click to switch to Gemini Uplink.'
              : 'Gemini 3.7 Cloud Uplink Active. Click to simulate Offline Logic Engine.'
          }
        >
          {isOfflineActive ? (
            <>
              <Cpu className="w-3 h-3 text-amber-400 animate-pulse" />
              <span className="font-bold tracking-wider">OFFLINE ENGINE</span>
              {forceOffline && <span className="hidden md:inline text-[8px] opacity-70">(SIMULATED)</span>}
            </>
          ) : (
            <>
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span className="font-bold tracking-wider hidden xs:inline">GEMINI UPLINK</span>
            </>
          )}
        </button>

        {/* System Status */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] uppercase opacity-50 tracking-tighter font-mono text-[#00f2ff]">
            System Status
          </span>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
            <span className={`text-xs font-mono font-bold ${statusInfo.textColor}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Authorized User */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase opacity-50 tracking-tighter font-mono text-[#00f2ff]">
            Authorized Operator
          </span>
          <div className="flex items-center gap-1">
            {operator?.authMethod === 'BIOMETRIC_PASSKEY' ? (
              <Fingerprint className="w-3 h-3 text-[#10b981] hidden sm:inline" />
            ) : (
              <ShieldCheck className="w-3 h-3 text-[#00f2ff] hidden sm:inline" />
            )}
            <span className="text-xs font-mono text-white font-bold tracking-wider truncate max-w-[90px] sm:max-w-none">
              {(operator?.displayName || 'NISHANT').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Time & Date */}
        <div className="flex flex-col items-end border-l border-[#00f2ff22] pl-3 sm:pl-4 hidden md:flex">
          <span className="text-xs font-mono text-[#00f2ff] font-semibold">{timeStr}</span>
          <span className="text-[9px] opacity-50 text-slate-300 uppercase tracking-tight">{utcStr}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 pl-1 sm:pl-2">
          {/* Always-On Screen / Sleep Mode Inhibitor Button */}
          {onToggleWakeLock && (
            <button
              onClick={() => {
                playSound('click');
                onToggleWakeLock();
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded border transition font-mono text-[10px] cursor-pointer ${
                wakeLockState?.isActive
                  ? 'border-amber-400/60 bg-amber-950/40 text-amber-300 shadow-[0_0_10px_#f59e0b44]'
                  : 'border-[#ffffff18] bg-[#05050888] text-slate-400 hover:text-amber-300 hover:border-amber-400/30'
              }`}
              title={
                wakeLockState?.isActive
                  ? 'Always-On Screen: ACTIVE (Display will not sleep). Click to toggle.'
                  : 'Always-On Screen: STANDBY (Display sleep allowed). Click to keep screen awake.'
              }
            >
              {wakeLockState?.isActive ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                  <span className="hidden sm:inline font-bold">SCREEN AWAKE</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">SLEEP ALLOWED</span>
                </>
              )}
            </button>
          )}

          {/* Master Audio Mute Switch */}
          <button
            onClick={toggleMute}
            className={`flex items-center gap-1.5 px-2 py-1 rounded border transition font-mono text-[10px] ${
              voiceConfig.isMuted
                ? 'border-rose-500/60 bg-rose-950/40 text-rose-300 shadow-[0_0_10px_#f43f5e44]'
                : voiceConfig.autoSpeak
                ? 'border-[#00f2ff66] bg-[#00f2ff22] text-[#00f2ff] shadow-[0_0_8px_#00f2ff44]'
                : 'border-[#ffffff18] bg-[#05050888] text-slate-400 hover:text-[#00f2ff] hover:border-[#00f2ff33]'
            }`}
            title={voiceConfig.isMuted ? 'Muted: Click to enable voice synthesis' : 'Click to Mute all voice responses'}
          >
            {voiceConfig.isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline font-bold">MUTED</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#00f2ff]" />
                <span className="hidden sm:inline font-bold">VOICE ON</span>
              </>
            )}
          </button>

          {/* Lock Core Gateway Button */}
          {onLockGateway && (
            <button
              onClick={() => {
                playSound('error');
                onLockGateway();
              }}
              className="p-1.5 rounded border border-red-500/30 bg-red-950/30 text-red-300 hover:text-white hover:bg-red-900/50 hover:border-red-500/60 transition cursor-pointer"
              title="Lock A.E.T.H.E.R. Core Gateway (Re-engage Firebase / Biometric Gate)"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Telemetry Switch */}
          <button
            onClick={() => {
              playSound('click');
              onToggleTelemetry();
            }}
            className={`p-1.5 rounded border transition ${
              showTelemetry
                ? 'border-[#00f2ff66] bg-[#00f2ff22] text-[#00f2ff] shadow-[0_0_8px_#00f2ff44]'
                : 'border-[#ffffff18] bg-[#05050888] text-slate-400 hover:text-[#00f2ff] hover:border-[#00f2ff33]'
            }`}
            title="Toggle System Status Telemetry"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          {/* Settings Modal */}
          <button
            onClick={() => {
              playSound('click');
              onOpenSettings();
            }}
            className="p-1.5 rounded border border-[#ffffff18] bg-[#05050888] text-slate-400 hover:text-[#00f2ff] hover:border-[#00f2ff44] transition"
            title="Neural Preferences"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
};
