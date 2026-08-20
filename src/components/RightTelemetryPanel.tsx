import React from 'react';
import {
  Activity,
  Cpu,
  Database,
  Wifi,
  Battery,
  Server,
  Zap,
  CheckCircle2,
  X,
  Shield,
} from 'lucide-react';
import { ClientTelemetry, ServerTelemetry, MemoryItem, ConnectionStatus } from '../types';

interface RightTelemetryPanelProps {
  clientTelemetry: ClientTelemetry;
  serverTelemetry: ServerTelemetry | null;
  memories: MemoryItem[];
  isOpen: boolean;
  onClose: () => void;
  connectionStatus?: ConnectionStatus;
  forceOffline?: boolean;
}

export const RightTelemetryPanel: React.FC<RightTelemetryPanelProps> = ({
  clientTelemetry,
  serverTelemetry,
  memories,
  isOpen,
  onClose,
  connectionStatus = 'ONLINE',
  forceOffline = false,
}) => {
  if (!isOpen) return null;

  const pinnedMemories = memories.filter((m) => m.pinned);
  const cpuLoadPercent = 18.4;
  const ramUsagePercent = clientTelemetry.memoryGB ? Math.min(Math.round((clientTelemetry.memoryGB / 16) * 100), 100) : 35;
  const isOfflineActive = forceOffline || connectionStatus === 'OFFLINE_FALLBACK' || connectionStatus === 'DISCONNECTED';

  return (
    <aside className="w-72 sm:w-80 border-l border-[#00f2ff22] glass-hologram-telemetry flex flex-col justify-between overflow-y-auto font-mono text-xs select-none z-30 transition-all">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between p-4 border-b border-[#00f2ff22]">
          <div className="flex items-center gap-2">
            <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.3em] opacity-70">
              System Status
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-[#00f2ff] hover:bg-[#00f2ff11] transition"
            title="Close Telemetry"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Telemetry Metrics */}
        <div className="p-4 space-y-6">
          {/* Offline Logic Engine Matrix Card */}
          <div className={`p-3 rounded-lg border space-y-2 ${
            isOfflineActive
              ? 'border-amber-500/40 bg-amber-950/20 text-amber-300'
              : 'border-[#00f2ff33] bg-[#00f2ff08] text-[#00f2ff]'
          }`}>
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5" />
                {isOfflineActive ? 'OFFLINE LOGIC ENGINE' : 'GEMINI NEURAL ENGINE'}
              </span>
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${
                isOfflineActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {isOfflineActive ? 'LOCAL FALLBACK' : 'ONLINE'}
              </span>
            </div>
            <div className="text-[10px] space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="opacity-60">Local Memory Matrix:</span>
                <span className="text-white font-bold">{memories.length} Records</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Speech Synthesizer:</span>
                <span className="text-emerald-400 font-semibold">Web Audio (Ready)</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Domain Heuristics:</span>
                <span className="text-[#00f2ff] font-semibold">Physics / Space / Code</span>
              </div>
            </div>
          </div>

          {/* CPU LOAD Metric Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="opacity-50 uppercase text-[#00f2ff]">CPU LOAD ({clientTelemetry.cores || 8} THREADS)</span>
              <span className="text-white font-bold">{cpuLoadPercent}%</span>
            </div>
            <div className="h-1 bg-[#111122] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00f2ff] shadow-[0_0_5px_#00f2ff] transition-all duration-500"
                style={{ width: `${cpuLoadPercent}%` }}
              />
            </div>
          </div>

          {/* RAM USAGE Metric Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="opacity-50 uppercase text-[#00f2ff]">RAM USAGE</span>
              <span className="text-white font-bold">{clientTelemetry.memoryGB ? `${clientTelemetry.memoryGB} GB` : '4.2 GB'}</span>
            </div>
            <div className="h-1 bg-[#111122] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#7000ff] shadow-[0_0_5px_#7000ff] transition-all duration-500"
                style={{ width: `${ramUsagePercent}%` }}
              />
            </div>
          </div>

          {/* Network Traffic Equalizer */}
          <div className="space-y-2 text-[10px] font-mono">
            <div className="flex justify-between items-center">
              <span className="opacity-50 uppercase text-[#00f2ff]">Network Traffic</span>
              <span className="text-white text-[9px]">{clientTelemetry.downlinkMbps ? `${clientTelemetry.downlinkMbps} Mbps` : '100 Mbps (P2P)'}</span>
            </div>
            <div className="flex items-end space-x-[2px] h-8 bg-[#111122] p-1.5 rounded border border-[#00f2ff18]">
              <div className="bg-[#00f2ff] w-1 h-[20%] animate-pulse" />
              <div className="bg-[#00f2ff] w-1 h-[60%]" />
              <div className="bg-[#00f2ff] w-1 h-[40%]" />
              <div className="bg-[#00f2ff] w-1 h-[90%] shadow-[0_0_4px_#00f2ff]" />
              <div className="bg-[#00f2ff] w-1 h-[30%]" />
              <div className="bg-[#00f2ff] w-1 h-[70%]" />
              <div className="bg-[#00f2ff] w-1 h-[50%]" />
              <div className="bg-[#00f2ff] w-1 h-[80%] shadow-[0_0_4px_#00f2ff]" />
              <div className="bg-[#7000ff] w-1 h-[45%]" />
              <div className="bg-[#7000ff] w-1 h-[85%] shadow-[0_0_4px_#7000ff]" />
              <div className="bg-[#00f2ff] w-1 h-[65%]" />
              <div className="bg-[#00f2ff] w-1 h-[40%]" />
            </div>
          </div>

          {/* Hardware Sensors Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2 rounded bg-[#111122] border border-[#00f2ff18] space-y-1">
              <div className="flex items-center gap-1 text-[9px] opacity-50 uppercase text-[#00f2ff]">
                <Battery className="w-3 h-3 text-[#00f2ff]" /> POWER
              </div>
              <div className="text-white font-bold text-[11px]">
                {clientTelemetry.batteryLevel !== undefined
                  ? `${clientTelemetry.batteryLevel}% ${clientTelemetry.batteryCharging ? '⚡' : ''}`
                  : 'AC STABLE'}
              </div>
            </div>

            <div className="p-2 rounded bg-[#111122] border border-[#00f2ff18] space-y-1">
              <div className="flex items-center gap-1 text-[9px] opacity-50 uppercase text-[#00f2ff]">
                <Wifi className="w-3 h-3 text-[#00f2ff]" /> LINK STATUS
              </div>
              <div className="text-white font-bold text-[11px]">
                {clientTelemetry.networkType ? clientTelemetry.networkType.toUpperCase() : 'ONLINE'}
              </div>
            </div>
          </div>

          {/* Server Subsystem Telemetry */}
          {serverTelemetry && (
            <div className="space-y-2 pt-2 border-t border-[#00f2ff11]">
              <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest opacity-50 text-[#00f2ff]">
                <Server className="w-3 h-3 text-[#00f2ff]" />
                SERVER PROTOCOLS
              </div>

              <div className="p-2.5 rounded bg-[#111122] border border-[#00f2ff18] space-y-1.5 text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="opacity-50">NODE VERSION:</span>
                  <span className="text-white font-bold">{serverTelemetry.nodeVersion}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-50">HEAP ALLOC:</span>
                  <span className="text-[#00f2ff]">{serverTelemetry.memory.heapUsedMB} MB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-50">UPTIME:</span>
                  <span className="text-emerald-400 font-bold">{serverTelemetry.uptimeSeconds}s</span>
                </div>

                <div className="pt-1.5 border-t border-[#ffffff0c]">
                  <div className="flex flex-wrap gap-1 mt-1">
                    {serverTelemetry.activeProtocols.map((p, i) => (
                      <span
                        key={i}
                        className="text-[8px] px-1.5 py-0.5 rounded border border-[#00f2ff33] bg-[#00f2ff11] text-[#00f2ff] flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-2 h-2" />
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pinned Memories */}
          {pinnedMemories.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#00f2ff11]">
              <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest opacity-50 text-[#00f2ff]">
                <Zap className="w-3 h-3 text-[#00f2ff]" />
                PINNED MEMORY CACHE
              </div>
              <div className="space-y-1.5">
                {pinnedMemories.map((m) => (
                  <div
                    key={m.id}
                    className="p-2 rounded bg-[#111122] border border-[#00f2ff18] space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-[10px]">{m.title}</span>
                      <span className="text-[8px] px-1 rounded bg-[#00f2ff11] text-[#00f2ff] border border-[#00f2ff22]">
                        {m.category}
                      </span>
                    </div>
                    <p className="text-[9px] opacity-60 text-slate-300 line-clamp-2">
                      {m.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Temperature Widget */}
      <div className="mt-auto border-t border-[#00f2ff11] p-4 bg-[#11112288]">
        <div className="text-[9px] uppercase tracking-widest opacity-50 mb-1 text-[#00f2ff]">
          Core Temperature
        </div>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline">
            <span className="text-2xl font-light text-white mr-1">38</span>
            <span className="text-xs opacity-50 text-[#00f2ff]">°C</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#00f2ff33] bg-[#00f2ff11] text-[#00f2ff]">
            NOMINAL
          </span>
        </div>
      </div>
    </aside>
  );
};
