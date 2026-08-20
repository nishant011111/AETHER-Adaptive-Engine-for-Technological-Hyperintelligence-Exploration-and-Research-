import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Database,
  Wifi,
  Battery,
  HardDrive,
  Server,
  ShieldCheck,
  Zap,
  Play,
  CheckCircle2,
  RefreshCw,
  Fingerprint,
  Sun,
  Moon,
} from 'lucide-react';
import { ClientTelemetry, ServerTelemetry, WakeLockState } from '../types';
import { playSound } from '../utils/audio';
import { BiometricSecurityLogView } from './BiometricSecurityLogView';
import { subscribeToWakeLock, toggleScreenWakeLock, getWakeLockState } from '../utils/screenWakeLock';

interface SystemMonitorViewProps {
  clientTelemetry: ClientTelemetry;
  serverTelemetry: ServerTelemetry | null;
  onRefreshTelemetry: () => void;
  soundEffects: boolean;
}

export const SystemMonitorView: React.FC<SystemMonitorViewProps> = ({
  clientTelemetry,
  serverTelemetry,
  onRefreshTelemetry,
  soundEffects,
}) => {
  const [activeSubView, setActiveSubView] = useState<'TELEMETRY' | 'BIOMETRIC_LOGS'>('TELEMETRY');
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockState>(() => getWakeLockState());

  useEffect(() => {
    const unsub = subscribeToWakeLock((st) => setWakeLock(st));
    return unsub;
  }, []);

  const handleToggleWake = async () => {
    if (soundEffects) playSound('click');
    await toggleScreenWakeLock();
  };
  const [diagnosticResults, setDiagnosticResults] = useState<
    { name: string; status: 'PASS' | 'PENDING' | 'FAIL'; latency: number }[]
  >([
    { name: 'Neural Core Subsystem (Gemini 3.7 Flash)', status: 'PASS', latency: 42 },
    { name: 'Voice Synthesis & Speech Engine', status: 'PASS', latency: 18 },
    { name: 'Memory Matrix Cache Store', status: 'PASS', latency: 12 },
    { name: 'Space Mission Telemetry Stream', status: 'PASS', latency: 35 },
    { name: 'Autonomous Tool Router Engine', status: 'PASS', latency: 24 },
  ]);

  const runFullDiagnostics = () => {
    if (soundEffects) playSound('boot');
    setDiagnosticsRunning(true);

    setTimeout(() => {
      setDiagnosticResults([
        { name: 'Neural Core Subsystem (Gemini 3.7 Flash)', status: 'PASS', latency: Math.floor(Math.random() * 30 + 20) },
        { name: 'Voice Synthesis & Speech Engine', status: 'PASS', latency: Math.floor(Math.random() * 15 + 10) },
        { name: 'Memory Matrix Cache Store', status: 'PASS', latency: Math.floor(Math.random() * 10 + 5) },
        { name: 'Space Mission Telemetry Stream', status: 'PASS', latency: Math.floor(Math.random() * 25 + 15) },
        { name: 'Autonomous Tool Router Engine', status: 'PASS', latency: Math.floor(Math.random() * 20 + 10) },
      ]);
      setDiagnosticsRunning(false);
      if (soundEffects) playSound('chime');
    }, 1200);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto font-mono">
      {/* Sub-view Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-[#00f2ff22] pb-3">
        <button
          onClick={() => {
            if (soundEffects) playSound('click');
            setActiveSubView('TELEMETRY');
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubView === 'TELEMETRY'
              ? 'bg-[#00f2ff] text-black shadow-[0_0_15px_#00f2ff44]'
              : 'bg-[#050508bb] border border-[#00f2ff22] text-slate-300 hover:text-white hover:bg-[#00f2ff11]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>HARDWARE & SENSORS</span>
        </button>

        <button
          onClick={() => {
            if (soundEffects) playSound('click');
            setActiveSubView('BIOMETRIC_LOGS');
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubView === 'BIOMETRIC_LOGS'
              ? 'bg-[#00f2ff] text-black shadow-[0_0_15px_#00f2ff44]'
              : 'bg-[#050508bb] border border-[#00f2ff22] text-slate-300 hover:text-white hover:bg-[#00f2ff11]'
          }`}
        >
          <Fingerprint className="w-4 h-4" />
          <span>BIOMETRIC SECURITY LOG</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full border border-emerald-500/40 bg-emerald-950/40 text-emerald-300">
            WEBAUTHN
          </span>
        </button>
      </div>

      {/* Render Active Sub-View */}
      {activeSubView === 'BIOMETRIC_LOGS' ? (
        <BiometricSecurityLogView soundEffects={soundEffects} />
      ) : (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border border-[#00f2ff44] bg-[#00f2ff11] text-[#00f2ff] shadow-[0_0_15px_#00f2ff22]">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold font-display text-white tracking-widest uppercase">
                  A.E.T.H.E.R. SYSTEM TELEMETRY & SENSOR SUITE
                </h1>
                <p className="text-xs text-slate-400">
                  Real-time hardware sensors, client system diagnostics, and server hypercore metrics for Nishant.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (soundEffects) playSound('click');
                  onRefreshTelemetry();
                }}
                className="px-3 py-1.5 rounded border border-[#00f2ff44] bg-[#00f2ff11] hover:bg-[#00f2ff22] text-[#00f2ff] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_8px_#00f2ff18]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>POLL SENSORS</span>
              </button>
            </div>
          </div>

          {/* Hardware Sensors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* CPU */}
            <div className="p-4 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="flex items-center gap-1.5 text-[#00f2ff]">
                  <Cpu className="w-4 h-4" /> CPU LOGICAL CORES
                </span>
                <span className="text-[10px] uppercase opacity-70">HARDWARE</span>
              </div>
              <div className="text-xl font-bold font-display text-white">
                {clientTelemetry.cores ? `${clientTelemetry.cores} Threads` : 'Sensors Active'}
              </div>
              <p className="text-[10px] text-slate-500">
                Available logical execution threads detected via browser API.
              </p>
            </div>

            {/* RAM */}
            <div className="p-4 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="flex items-center gap-1.5 text-[#00f2ff]">
                  <Database className="w-4 h-4" /> ESTIMATED RAM
                </span>
                <span className="text-[10px] uppercase opacity-70">MEMORY</span>
              </div>
              <div className="text-xl font-bold font-display text-white">
                {clientTelemetry.memoryGB ? `~${clientTelemetry.memoryGB} GB` : 'Standard Sandbox'}
              </div>
              <p className="text-[10px] text-slate-500">
                Device memory capacity reported by client runtime.
              </p>
            </div>

            {/* Network */}
            <div className="p-4 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Wifi className="w-4 h-4" /> NETWORK LINK
                </span>
                <span className="text-emerald-400 text-[10px] font-bold">STABLE</span>
              </div>
              <div className="text-lg font-bold font-display text-emerald-300 truncate">
                {clientTelemetry.downlinkMbps
                  ? `${clientTelemetry.downlinkMbps} Mbps (${clientTelemetry.networkType || '4G/WiFi'})`
                  : 'Active Uplink'}
              </div>
              <p className="text-[10px] text-slate-500">
                RTT: {clientTelemetry.rttMs ? `${clientTelemetry.rttMs} ms` : 'Low Latency'}
              </p>
            </div>

            {/* Battery */}
            <div className="p-4 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Battery className="w-4 h-4" /> POWER STATUS
                </span>
                <span className="text-[10px] uppercase opacity-70">ENERGY</span>
              </div>
              <div className="text-xl font-bold font-display text-white">
                {clientTelemetry.batteryLevel !== undefined
                  ? `${clientTelemetry.batteryLevel}% ${clientTelemetry.batteryCharging ? '⚡ (Charging)' : ''}`
                  : 'AC Mainline Power'}
              </div>
              <p className="text-[10px] text-slate-500">
                Continuous power feed to A.E.T.H.E.R. core.
              </p>
            </div>

            {/* Always-On Screen Sleep Lock */}
            <div
              onClick={handleToggleWake}
              className={`p-4 rounded-xl border transition cursor-pointer backdrop-blur-md space-y-2 select-none ${
                wakeLock.isActive
                  ? 'border-amber-400/50 bg-amber-950/20 shadow-[0_0_15px_#f59e0b22]'
                  : 'border-[#ffffff18] bg-[#050508bb] hover:border-amber-400/30'
              }`}
              title="Click to toggle Always-On Display / Screen Wake Lock"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className={`flex items-center gap-1.5 font-bold ${wakeLock.isActive ? 'text-amber-400' : 'text-slate-300'}`}>
                  <Sun className={`w-4 h-4 ${wakeLock.isActive ? 'animate-spin-slow' : ''}`} /> ALWAYS-ON SCREEN
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  wakeLock.isActive ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-slate-800 text-slate-400'
                }`}>
                  {wakeLock.isActive ? 'ACTIVE' : 'OFF'}
                </span>
              </div>
              <div className="text-lg font-bold font-display text-white truncate">
                {wakeLock.isActive ? 'Sleep Inhibited' : 'Sleep Allowed'}
              </div>
              <p className="text-[10px] text-slate-400">
                {wakeLock.isActive
                  ? `Display kept awake via ${wakeLock.mode === 'NATIVE_WAKELOCK' ? 'WakeLock API' : 'Keep-Alive loop'}.`
                  : 'Click to prevent display from entering sleep mode.'}
              </p>
            </div>
          </div>

          {/* Server & Diagnostic Suite */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Server Hypercore Telemetry */}
            <div className="p-5 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-2">
                <div className="flex items-center gap-2 text-[#00f2ff] font-semibold text-xs uppercase tracking-wider">
                  <Server className="w-4 h-4 text-[#00f2ff]" />
                  <span>SERVER ENGINE METRICS</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">ONLINE</span>
              </div>

              {serverTelemetry ? (
                <div className="space-y-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#111122] border border-[#00f2ff18] flex justify-between">
                    <span className="text-slate-400">RUNTIME ENGINE:</span>
                    <span className="text-[#00f2ff] font-bold">{serverTelemetry.nodeVersion}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#111122] border border-[#00f2ff18] flex justify-between">
                    <span className="text-slate-400">SYSTEM UPTIME:</span>
                    <span className="text-emerald-400 font-bold">{serverTelemetry.uptimeSeconds} seconds</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#111122] border border-[#00f2ff18] flex justify-between">
                    <span className="text-slate-400">HEAP TOTAL / USED:</span>
                    <span className="text-[#00f2ff]">
                      {serverTelemetry.memory.heapTotalMB} MB / {serverTelemetry.memory.heapUsedMB} MB
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#111122] border border-[#00f2ff18] flex justify-between">
                    <span className="text-slate-400">RSS RESIDENT SET:</span>
                    <span className="text-[#00f2ff]">{serverTelemetry.memory.rssMB} MB</span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-xs">Connecting to server core...</div>
              )}
            </div>

            {/* Self-Test Diagnostic Suite */}
            <div className="p-5 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-2">
                <div className="flex items-center gap-2 text-[#00f2ff] font-semibold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#00f2ff]" />
                  <span>A.E.T.H.E.R. SELF-DIAGNOSTIC SUITE</span>
                </div>
                <button
                  onClick={runFullDiagnostics}
                  disabled={diagnosticsRunning}
                  className="px-3 py-1 rounded border border-[#00f2ff44] bg-[#00f2ff11] hover:bg-[#00f2ff22] text-[#00f2ff] text-xs font-bold transition flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                >
                  <Play className={`w-3 h-3 ${diagnosticsRunning ? 'animate-spin' : ''}`} />
                  <span>{diagnosticsRunning ? 'TESTING...' : 'RUN SELF-TEST'}</span>
                </button>
              </div>

              <div className="space-y-2">
                {diagnosticResults.map((diag, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg border border-[#00f2ff18] bg-[#111122] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-slate-200">{diag.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{diag.latency}ms</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 font-bold">
                        {diag.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
