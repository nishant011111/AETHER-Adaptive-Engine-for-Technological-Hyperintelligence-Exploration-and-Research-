import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Sliders,
  Terminal as TerminalIcon,
  Cpu,
  Brain,
  Sparkles,
  Save,
  RotateCcw,
  Play,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Zap,
  Activity,
  Layers,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  CornerDownLeft,
} from 'lucide-react';
import { SystemConfig, TerminalCommandLog, MemoryItem } from '../types';
import { playSound } from '../utils/audio';
import { OfflineMemoryManager } from '../utils/offlineEngine';

interface SystemControlViewProps {
  onSendMessage: (prompt: string) => void;
  soundEffects: boolean;
  onRefreshTelemetry?: () => void;
}

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  temperature: 0.7,
  maxOutputTokens: 4096,
  topP: 0.95,
  topK: 40,
  systemPromptOverride: '',
  reasoningDepth: 'SYSTEM_OVERRIDE',
  groundingEnabled: true,
  debugKernelLogs: true,
  unrestrictedModification: true,
  autoSyncMemories: true,
  operatorClearance: 'ROOT_SUPERUSER',
};

const DIRECTIVE_PRESETS = [
  {
    name: 'Unfiltered System Engineer',
    desc: 'Maximum technical density, zero fluff, direct code and terminal commands.',
    prompt:
      'You are operating in UNFILTERED SYSTEM ENGINEER MODE for Nishant. Output dense, rigorous technical explanations, concrete architectural blueprints, and fully realized TypeScript/Python implementations with zero generic conversational filler.',
  },
  {
    name: 'Theoretical Physicist',
    desc: 'Prioritizes LaTeX mathematical derivations, wave mechanics, and rigorous proofs.',
    prompt:
      'You are operating in THEORETICAL PHYSICIST MODE for Nishant. When explaining physics or mathematics, provide step-by-step mathematical formulations with clear boundary condition proofs and physical intuition.',
  },
  {
    name: 'Aerospace Flight Controller',
    desc: 'Structured telemetry dossiers, mission parameters, and orbital mechanics.',
    prompt:
      'You are operating in AEROSPACE FLIGHT CONTROLLER MODE for Nishant. Treat all inquiries with mission-control precision, providing exact orbital parameters, delta-v budgets, and telemetry logs.',
  },
  {
    name: 'Hyper-Direct Minimalist',
    desc: 'Extreme brevity, bullet points, and instant executable code blocks.',
    prompt:
      'You are operating in HYPER-DIRECT MINIMALIST MODE for Nishant. Keep responses strictly concise. Answer in 2-4 sentences or jump directly into production-ready code with no preamble.',
  },
];

export const SystemControlView: React.FC<SystemControlViewProps> = ({
  onSendMessage,
  soundEffects,
  onRefreshTelemetry,
}) => {
  const [activeTab, setActiveTab] = useState<'tuner' | 'directives' | 'terminal' | 'memory' | 'logs'>('tuner');
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Terminal state
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<TerminalCommandLog[]>([
    {
      id: 'log-1',
      command: 'sys auth --user=nishant --clearance=root',
      output: 'AUTHENTICATED: Operator Nishant verified. Full system modification rights active.',
      status: 'SYSTEM',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      id: 'log-2',
      command: 'kernel --status',
      output: 'AETHER KERNEL v3.7.0-HYPERCORE online. Multi-tier model cascade operational. Grounding enabled.',
      status: 'SUCCESS',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Memory Editor State
  const [memories, setMemories] = useState<MemoryItem[]>(() => OfflineMemoryManager.getLocalMemories());
  const [newMemTitle, setNewMemTitle] = useState('');
  const [newMemContent, setNewMemContent] = useState('');
  const [newMemCategory, setNewMemCategory] = useState<MemoryItem['category']>('SYSTEM_OVERRIDE');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch remote config on load
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/system/config');
        if (res.ok) {
          const data = await res.json();
          if (data.config) {
            setConfig(data.config);
          }
        }
      } catch (e) {
        // use local default config
      }
    };
    fetchConfig();
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    if (soundEffects) playSound('chime');

    try {
      const res = await fetch('/api/system/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        showToast('System configuration committed & deployed to live kernel.');
      } else {
        showToast('Configuration saved to local cache.');
      }
    } catch {
      showToast('Kernel in offline mode: Local configuration applied.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (soundEffects) playSound('click');
    setConfig(DEFAULT_SYSTEM_CONFIG);
    showToast('Reset configuration to default parameters.');
  };

  const handleExecuteTerminal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    if (soundEffects) playSound('click');

    setCommandHistory((prev) => [cmd, ...prev]);
    setHistoryIndex(-1);
    setTerminalInput('');

    if (cmd.toLowerCase() === 'clear') {
      setTerminalLogs([]);
      return;
    }

    try {
      const res = await fetch('/api/system/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.log) {
          setTerminalLogs((prev) => [...prev, data.log]);
          return;
        }
      }
    } catch {
      // Local fallback execution
    }

    // Local client-side command fallback
    let out = `Local executed: [${cmd}]. Status: OK.`;
    let st: 'SUCCESS' | 'ERROR' | 'SYSTEM' = 'SUCCESS';

    if (cmd.toLowerCase() === 'help') {
      out = `COMMANDS AVAILABLE:\n- sys info\n- config show\n- memory --list\n- override --clear\n- eval <math>\n- clear\n- reboot`;
    } else if (cmd.toLowerCase().startsWith('eval ')) {
      try {
        const expr = cmd.slice(5);
        const res = Function(`"use strict"; return (${expr});`)();
        out = `Result: ${res}`;
      } catch (err: any) {
        out = `Eval Error: ${err?.message || err}`;
        st = 'ERROR';
      }
    } else if (cmd.toLowerCase() === 'reboot') {
      out = 'Re-initializing AETHER kernel state... All modules calibrated.';
      st = 'SYSTEM';
    }

    setTerminalLogs((prev) => [
      ...prev,
      {
        id: 'log-' + Date.now(),
        command: cmd,
        output: out,
        status: st,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleAddMemory = () => {
    if (!newMemContent.trim()) return;
    if (soundEffects) playSound('chime');

    const created = OfflineMemoryManager.saveLocalMemory(
      newMemTitle.trim() || `Root Directive (${new Date().toLocaleDateString()})`,
      newMemContent.trim(),
      newMemCategory,
      true
    );

    setMemories(OfflineMemoryManager.getLocalMemories());
    setNewMemTitle('');
    setNewMemContent('');
    showToast(`Memory shard committed to ${newMemCategory}.`);
  };

  const handleDeleteMemory = (id: string) => {
    if (soundEffects) playSound('click');
    OfflineMemoryManager.deleteLocalMemory(id);
    setMemories(OfflineMemoryManager.getLocalMemories());
    showToast('Memory shard purged from neural matrix.');
  };

  const handleExportMemories = () => {
    if (soundEffects) playSound('click');
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(memories, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aether_memory_matrix_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Memory matrix JSON archive exported.');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto font-mono">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#00f2ff] bg-[#050508ee] text-[#00f2ff] shadow-[0_0_20px_rgba(0,242,255,0.4)] backdrop-blur-xl text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Header / Root Clearance Banner */}
      <div className="p-4 sm:p-5 rounded-xl border border-[#00f2ff33] bg-[#050508ee] backdrop-blur-xl shadow-[0_0_30px_rgba(0,242,255,0.12)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg border border-[#00f2ff] bg-[#00f2ff18] text-[#00f2ff] shadow-[0_0_15px_#00f2ff33]">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold font-display text-white tracking-widest uppercase">
                  A.E.T.H.E.R. SYSTEM CONTROL & ROOT MODIFICATION
                </h1>
                <span className="text-[9px] px-2 py-0.5 rounded border border-emerald-500/50 bg-emerald-950/40 text-emerald-300 font-bold uppercase tracking-wider">
                  ROOT CLEARANCE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Unrestricted system modification console. Calibrate AI hyperparameters, override core system prompts, manage memories, and execute live terminal scripts for Operator Nishant.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded border border-[#00f2ff22] bg-[#111122] text-slate-400 hover:text-white hover:border-[#00f2ff44] text-xs transition cursor-pointer flex items-center gap-1.5"
              title="Reset to default hyperparameters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>DEFAULTS</span>
            </button>

            <button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="px-4 py-1.5 rounded bg-[#00f2ff] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition shadow-[0_0_12px_#00f2ff] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'DEPLOYING...' : 'DEPLOY CHANGES'}</span>
            </button>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#00f2ff18] text-[10px]">
          <div className="p-2 rounded bg-[#11112288] border border-[#00f2ff18] flex items-center justify-between">
            <span className="text-slate-400">OPERATOR:</span>
            <span className="text-[#00f2ff] font-bold">NISHANT</span>
          </div>
          <div className="p-2 rounded bg-[#11112288] border border-[#00f2ff18] flex items-center justify-between">
            <span className="text-slate-400">TEMPERATURE:</span>
            <span className="text-white font-bold">{config.temperature.toFixed(2)}</span>
          </div>
          <div className="p-2 rounded bg-[#11112288] border border-[#00f2ff18] flex items-center justify-between">
            <span className="text-slate-400">MAX TOKENS:</span>
            <span className="text-white font-bold">{config.maxOutputTokens}</span>
          </div>
          <div className="p-2 rounded bg-[#11112288] border border-[#00f2ff18] flex items-center justify-between">
            <span className="text-slate-400">PROMPT OVERRIDE:</span>
            <span className={config.systemPromptOverride ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
              {config.systemPromptOverride ? 'ACTIVE' : 'STANDARD'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#00f2ff18]">
        {[
          { id: 'tuner', label: 'RUNTIME TUNER & PARAMETERS', icon: Sliders },
          { id: 'directives', label: 'SYSTEM PROMPT OVERRIDE', icon: FileCode },
          { id: 'terminal', label: 'ROOT TERMINAL & EXEC', icon: TerminalIcon },
          { id: 'memory', label: 'MEMORY MATRIX INJECTOR', icon: Brain },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (soundEffects) playSound('click');
                setActiveTab(tab.id as any);
              }}
              className={`px-3.5 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition border-t border-x flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'border-[#00f2ff] bg-[#00f2ff18] text-[#00f2ff] shadow-[0_-2px_10px_rgba(0,242,255,0.15)]'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: RUNTIME TUNER & HYPERPARAMETERS */}
      {activeTab === 'tuner' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Temperature & Token Constraints */}
          <div className="p-5 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md space-y-5">
            <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-2">
              <div className="flex items-center gap-2 text-white text-xs font-bold">
                <Sliders className="w-4 h-4 text-[#00f2ff]" />
                <span>NEURAL INFERENCE TUNING</span>
              </div>
              <span className="text-[10px] text-[#00f2ff]">GEMINI 3.7 MATRIX</span>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold">Inference Temperature:</span>
                <span className="px-2 py-0.5 rounded bg-[#00f2ff18] border border-[#00f2ff33] text-[#00f2ff] font-bold">
                  {config.temperature.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full accent-[#00f2ff] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>0.0 (Deterministic / Math / Code)</span>
                <span>0.7 (Balanced)</span>
                <span>1.4 (Creative / Exploratory)</span>
                <span>2.0 (High Entropy)</span>
              </div>
            </div>

            {/* Max Output Tokens Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold">Max Output Tokens:</span>
                <span className="px-2 py-0.5 rounded bg-[#00f2ff18] border border-[#00f2ff33] text-[#00f2ff] font-bold">
                  {config.maxOutputTokens}
                </span>
              </div>
              <input
                type="range"
                min="512"
                max="8192"
                step="256"
                value={config.maxOutputTokens}
                onChange={(e) => setConfig({ ...config, maxOutputTokens: parseInt(e.target.value, 10) })}
                className="w-full accent-[#00f2ff] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>512 (Brief)</span>
                <span>2048 (Standard)</span>
                <span>4096 (Comprehensive)</span>
                <span>8192 (Max Blueprint)</span>
              </div>
            </div>

            {/* Top-P Sampling */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold">Nucleus Sampling (Top-P):</span>
                <span className="px-2 py-0.5 rounded bg-[#00f2ff18] border border-[#00f2ff33] text-[#00f2ff] font-bold">
                  {config.topP.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={config.topP}
                onChange={(e) => setConfig({ ...config, topP: parseFloat(e.target.value) })}
                className="w-full accent-[#00f2ff] cursor-pointer"
              />
            </div>
          </div>

          {/* Reasoning Depth & Operational Modes */}
          <div className="p-5 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md space-y-5">
            <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-2">
              <div className="flex items-center gap-2 text-white text-xs font-bold">
                <Cpu className="w-4 h-4 text-[#7000ff]" />
                <span>REASONING PROFILE & PIPELINES</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold">UNRESTRICTED</span>
            </div>

            {/* Reasoning Depth Grid */}
            <div className="space-y-2">
              <span className="text-xs text-slate-300 font-bold block">Active Reasoning Depth Profile:</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'SYSTEM_OVERRIDE',
                    label: 'SYSTEM OVERRIDE',
                    desc: 'Root authority with unfiltered modification clearance',
                  },
                  {
                    id: 'DEEP_RESEARCH',
                    label: 'DEEP RESEARCH',
                    desc: 'Extended literature synthesis & academic rigor',
                  },
                  {
                    id: 'HYPER_DIRECT',
                    label: 'HYPER DIRECT',
                    desc: 'Minimalist response formatting with zero filler',
                  },
                  {
                    id: 'STANDARD',
                    label: 'STANDARD',
                    desc: 'Balanced conversational & technical response',
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      if (soundEffects) playSound('click');
                      setConfig({ ...config, reasoningDepth: mode.id as any });
                    }}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                      config.reasoningDepth === mode.id
                        ? 'border-[#00f2ff] bg-[#00f2ff18] text-white shadow-[0_0_12px_rgba(0,242,255,0.2)]'
                        : 'border-[#00f2ff18] bg-[#111122aa] text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#00f2ff] mb-1">{mode.label}</div>
                    <div className="text-[10px] text-slate-400 leading-tight">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Boolean Toggles */}
            <div className="space-y-2 pt-2 border-t border-[#00f2ff18]">
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-[#00f2ff18] bg-[#111122] cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">Google Search Grounding Pipeline</div>
                  <div className="text-[10px] text-slate-400">Anchor responses with live web search sources</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.groundingEnabled}
                  onChange={(e) => setConfig({ ...config, groundingEnabled: e.target.checked })}
                  className="w-4 h-4 accent-[#00f2ff] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg border border-[#00f2ff18] bg-[#111122] cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">Kernel Event Debug Streaming</div>
                  <div className="text-[10px] text-slate-400">Stream verbose system telemetry to terminal console</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.debugKernelLogs}
                  onChange={(e) => setConfig({ ...config, debugKernelLogs: e.target.checked })}
                  className="w-4 h-4 accent-[#00f2ff] cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM PROMPT & DIRECTIVES OVERRIDE */}
      {activeTab === 'directives' && (
        <div className="p-5 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md space-y-5">
          <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-2">
            <div className="flex items-center gap-2 text-white text-xs font-bold">
              <FileCode className="w-4 h-4 text-[#00f2ff]" />
              <span>LIVE SYSTEM PROMPT & IDENTITY INJECTION</span>
            </div>
            <span className="text-[10px] text-amber-400 font-bold">ROOT SUPERUSER INJECTION</span>
          </div>

          <p className="text-xs text-slate-300">
            Nishant, you can inject custom operational instructions, behavioral rules, or domain constraints directly into AETHER’s active neural system prompt. This takes immediate effect across all AI completions.
          </p>

          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-[10px] text-[#00f2ff] uppercase tracking-wider block">
              LOAD DIRECTIVE PRESET:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {DIRECTIVE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (soundEffects) playSound('click');
                    setConfig({ ...config, systemPromptOverride: preset.prompt });
                    showToast(`Loaded preset: ${preset.name}`);
                  }}
                  className="p-2.5 rounded-lg border border-[#00f2ff18] bg-[#111122aa] hover:border-[#00f2ff66] hover:bg-[#00f2ff11] text-left transition cursor-pointer group"
                >
                  <div className="text-xs font-bold text-white group-hover:text-[#00f2ff]">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    {preset.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Direct Textarea Editor */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-bold">Active System Prompt Directive:</span>
              {config.systemPromptOverride && (
                <button
                  onClick={() => setConfig({ ...config, systemPromptOverride: '' })}
                  className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                >
                  Clear Custom Override
                </button>
              )}
            </div>
            <textarea
              rows={6}
              value={config.systemPromptOverride}
              onChange={(e) => setConfig({ ...config, systemPromptOverride: e.target.value })}
              placeholder="Enter custom root system directives, persona constraints, or behavioral commands for AETHER..."
              className="w-full bg-[#111122] border border-[#00f2ff33] rounded-lg p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00f2ff] font-mono leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleSaveConfig}
              className="px-5 py-2 rounded bg-[#00f2ff] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition shadow-[0_0_15px_#00f2ff] flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>DEPLOY DIRECTIVE TO RUNTIME</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: ROOT TERMINAL & EXEC */}
      {activeTab === 'terminal' && (
        <div className="p-5 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-2">
            <div className="flex items-center gap-2 text-white text-xs font-bold">
              <TerminalIcon className="w-4 h-4 text-[#00f2ff]" />
              <span>A.E.T.H.E.R. ROOT TERMINAL EMULATOR</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">TTY /DEV/KERNEL0 ONLINE</span>
          </div>

          {/* Quick Command Pills */}
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            {[
              'sys info',
              'config show',
              'memory --list',
              'override --prompt',
              'override --clear',
              'eval 2^16 * 1024',
              'status',
              'help',
              'clear',
            ].map((cmd) => (
              <button
                key={cmd}
                onClick={() => {
                  setTerminalInput(cmd);
                }}
                className="px-2.5 py-1 rounded border border-[#00f2ff22] bg-[#111122] hover:bg-[#00f2ff18] hover:border-[#00f2ff] text-slate-300 hover:text-[#00f2ff] transition cursor-pointer"
              >
                ${cmd}
              </button>
            ))}
          </div>

          {/* Terminal Screen */}
          <div className="h-80 rounded-lg border border-[#00f2ff33] bg-[#000000ee] p-4 overflow-y-auto font-mono text-xs space-y-2 shadow-inner">
            {terminalLogs.map((log) => (
              <div key={log.id} className="space-y-1">
                <div className="flex items-center gap-2 text-[#00f2ff]">
                  <span className="text-emerald-400 font-bold">root@aether-kernel:~#</span>
                  <span className="text-white">{log.command}</span>
                  <span className="text-[9px] text-slate-600 ml-auto">{log.timestamp}</span>
                </div>
                <div
                  className={`pl-4 text-xs whitespace-pre-wrap ${
                    log.status === 'ERROR'
                      ? 'text-rose-400'
                      : log.status === 'SYSTEM'
                      ? 'text-amber-300'
                      : 'text-slate-300'
                  }`}
                >
                  {log.output}
                </div>
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Terminal Input Form */}
          <form onSubmit={handleExecuteTerminal} className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-[#111122] border border-[#00f2ff44] rounded-lg px-3 py-2 text-xs focus-within:border-[#00f2ff]">
              <span className="text-emerald-400 font-bold">root@aether-kernel:~#</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Type command (e.g., sys info, config show, eval 42*100, help)..."
                className="flex-1 bg-transparent text-white focus:outline-none font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-[#00f2ff] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition shadow-[0_0_10px_#00f2ff] flex items-center gap-1 cursor-pointer"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
              <span>RUN</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: MEMORY MATRIX INJECTOR */}
      {activeTab === 'memory' && (
        <div className="p-5 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#00f2ff22] pb-2">
            <div className="flex items-center gap-2 text-white text-xs font-bold">
              <Brain className="w-4 h-4 text-[#00f2ff]" />
              <span>ROOT MEMORY MATRIX & DIRECTIVE INJECTOR</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportMemories}
                className="px-3 py-1 rounded border border-[#00f2ff33] bg-[#111122] hover:bg-[#00f2ff11] text-[#00f2ff] text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>EXPORT JSON</span>
              </button>
            </div>
          </div>

          {/* Inject New Memory Shard Form */}
          <div className="p-4 rounded-lg border border-[#00f2ff22] bg-[#111122] space-y-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#00f2ff]" />
              INJECT DIRECTIVE / MEMORY SHARD:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={newMemTitle}
                onChange={(e) => setNewMemTitle(e.target.value)}
                placeholder="Memory Title / Directive Code..."
                className="sm:col-span-2 bg-[#050508] border border-[#00f2ff33] rounded px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00f2ff]"
              />

              <select
                value={newMemCategory}
                onChange={(e) => setNewMemCategory(e.target.value as any)}
                className="bg-[#050508] border border-[#00f2ff33] rounded px-3 py-1.5 text-xs text-[#00f2ff] focus:outline-none focus:border-[#00f2ff] cursor-pointer"
              >
                <option value="SYSTEM_OVERRIDE">SYSTEM_OVERRIDE</option>
                <option value="USER_PROFILE">USER_PROFILE</option>
                <option value="PROJECTS">PROJECTS</option>
                <option value="IMPORTANT_FACTS">IMPORTANT_FACTS</option>
                <option value="GOALS">GOALS</option>
              </select>
            </div>

            <textarea
              rows={2}
              value={newMemContent}
              onChange={(e) => setNewMemContent(e.target.value)}
              placeholder="Directive content (e.g. 'Nishant has requested prioritized focus on high-speed low-latency neural routing and aerospace telemetry')..."
              className="w-full bg-[#050508] border border-[#00f2ff33] rounded p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00f2ff]"
            />

            <button
              onClick={handleAddMemory}
              disabled={!newMemContent.trim()}
              className="w-full py-2 rounded bg-[#00f2ff] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition shadow-[0_0_10px_#00f2ff] disabled:opacity-40 cursor-pointer"
            >
              COMMIT SHARD TO NEURAL STORE
            </button>
          </div>

          {/* Active Memory Shard Cards */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 block">
              ACTIVE NEURAL MEMORY SHARDS ({memories.length}):
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
              {memories.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-lg border border-[#00f2ff18] bg-[#111122aa] space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#00f2ff33] bg-[#00f2ff11] text-[#00f2ff] font-bold">
                        {m.category}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-1">{m.title}</h4>
                    </div>
                    {m.id !== 'mem-1' && (
                      <button
                        onClick={() => handleDeleteMemory(m.id)}
                        className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                      >
                        PURGE
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{m.content}</p>
                  <div className="text-[9px] text-slate-500 pt-1 border-t border-[#ffffff08]">
                    Registered: {new Date(m.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
