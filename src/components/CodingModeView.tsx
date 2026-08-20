import React, { useState } from 'react';
import {
  Code2,
  Terminal,
  Play,
  Bug,
  Sparkles,
  Copy,
  Check,
  FolderTree,
  GitBranch,
  Layers,
  FileCode,
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface CodingModeViewProps {
  onAskCode: (prompt: string) => void;
  soundEffects: boolean;
}

export const CodingModeView: React.FC<CodingModeViewProps> = ({ onAskCode, soundEffects }) => {
  const [selectedLang, setSelectedLang] = useState('TypeScript');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'A.E.T.H.E.R. CODE MATRIX v3.7 [Ready]',
    'Workspace: /home/nishant/projects/aether',
    'Type commands like "npm run build", "git status", "run tests", or enter code snippets to analyze.',
  ]);
  const [copied, setCopied] = useState(false);
  const [codeQuery, setCodeQuery] = useState('');

  const languages = ['TypeScript', 'Python', 'React', 'C++', 'Rust', 'SQL', 'FastAPI'];

  const sampleSnippets: Record<string, string> = {
    TypeScript: `// A.E.T.H.E.R. Autonomous Tool Router
export interface AgentTool {
  name: string;
  description: string;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

export class NeuralRouter {
  private tools: Map<string, AgentTool> = new Map();

  registerTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  async route(intent: string, args: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.get(intent);
    if (!tool) throw new Error(\`Tool \${intent} not initialized for Nishant.\`);
    return await tool.execute(args);
  }
}`,
    Python: `# AETHER Core - Autonomous Kernel & Orbital Guidance Matrix
import numpy as np
import torch
import torch.nn as nn

class AutonomousGuidanceKernel(nn.Module):
    """Deep Reinforcement Learning Attitude & Orbit Control System (AOCS) for AETHER."""
    def __init__(self, state_dim: int = 12, action_dim: int = 6):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(state_dim, 128),
            nn.LayerNorm(128),
            nn.GELU(),
            nn.Linear(128, 64),
            nn.GELU(),
            nn.Linear(64, action_dim),
            nn.Tanh()
        )

    def forward(self, telemetry_vector: torch.Tensor) -> torch.Tensor:
        # Computes continuous reaction wheel torque and RCS thruster pulses
        return self.encoder(telemetry_vector)`,
    React: `// Real-Time Telemetry HUD Component
import React, { FC } from 'react';

interface TelemetryProps {
  status: 'ONLINE' | 'ACTIVE';
  latencyMs: number;
}

export const TelemetryHUD: FC<TelemetryProps> = ({ status, latencyMs }) => {
  return (
    <div className="p-3 rounded-lg border border-[#00f2ff33] bg-[#050508bb] text-white">
      <span className="text-xs font-mono">STATUS: {status} // {latencyMs}ms</span>
    </div>
  );
};`,
  };

  const handleRunTerminal = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    if (soundEffects) playSound('click');
    const newLogs = [...terminalOutput, `$ ${cmd}`];

    if (cmd === 'clear') {
      setTerminalOutput(['A.E.T.H.E.R. Terminal Cleared.']);
      setTerminalInput('');
      return;
    } else if (cmd === 'git status') {
      newLogs.push('On branch main: All modules synced for Nishant.', 'Working tree clean.');
    } else if (cmd === 'npm run build' || cmd === 'build') {
      newLogs.push(
        'vite v6.2.3 building for production...',
        '✓ 42 modules transformed.',
        'dist/index.html   0.85 kB',
        'dist/assets/index.js   145.2 kB',
        '✓ Build complete in 420ms. Zero compilation errors.'
      );
    } else if (cmd.startsWith('python') || cmd.startsWith('node')) {
      newLogs.push('Executing script in virtual isolated sandbox...', 'Result: Code returned exit code 0.');
    } else {
      newLogs.push(`Command "${cmd}" dispatched to A.E.T.H.E.R. sub-shell.`);
    }

    setTerminalOutput(newLogs);
    setTerminalInput('');
  };

  const handleCopyCode = () => {
    const snippet = sampleSnippets[selectedLang] || sampleSnippets.TypeScript;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    if (soundEffects) playSound('click');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg border border-[#00f2ff44] bg-[#00f2ff11] text-[#00f2ff] shadow-[0_0_15px_#00f2ff22]">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold font-display text-white tracking-widest uppercase">
              A.E.T.H.E.R. CODING DECK & COMPILER MATRIX
            </h1>
            <p className="text-xs text-slate-400">
              High-performance code generator, error debugger, refactoring assistant, and terminal sandbox for Nishant.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] px-3 py-1 rounded border border-[#00f2ff33] bg-[#00f2ff11] text-[#00f2ff] uppercase font-bold tracking-wider">
            ENGINE: ACTIVE
          </span>
        </div>
      </div>

      {/* Language Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {languages.map((lang) => (
          <button
            key={lang}
            onClick={() => {
              if (soundEffects) playSound('click');
              setSelectedLang(lang);
            }}
            className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition border cursor-pointer ${
              selectedLang === lang
                ? 'bg-[#00f2ff11] border-l-2 border-[#00f2ff] text-[#00f2ff] shadow-[0_0_10px_#00f2ff22]'
                : 'border-[#00f2ff18] bg-[#11112288] text-slate-400 hover:text-white hover:border-[#00f2ff44]'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Code Editor & Architecture View */}
        <div className="p-4 sm:p-5 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-2">
            <div className="flex items-center gap-2 text-[#00f2ff] font-semibold text-xs tracking-wider">
              <FileCode className="w-4 h-4 text-[#00f2ff]" />
              <span>SOURCE GENERATOR // {selectedLang.toUpperCase()}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-[#00f2ff] transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>

          {/* Code Viewer */}
          <div className="rounded-lg border border-[#00f2ff22] bg-[#050508] p-3.5 overflow-x-auto shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <pre className="text-xs text-slate-200 leading-relaxed">
              <code>{sampleSnippets[selectedLang] || sampleSnippets.TypeScript}</code>
            </pre>
          </div>

          {/* Ask Coding Assistant */}
          <div className="space-y-2 pt-2 border-t border-[#00f2ff18]">
            <span className="text-[9px] uppercase text-[#00f2ff] opacity-80 tracking-wider">
              DISPATCH CODING TASK TO A.E.T.H.E.R.
            </span>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!codeQuery.trim()) return;
                onAskCode(`In ${selectedLang}: ${codeQuery}`);
                setCodeQuery('');
              }}
              className="space-y-2"
            >
              <input
                type="text"
                value={codeQuery}
                onChange={(e) => setCodeQuery(e.target.value)}
                placeholder={`Describe feature, API, or algorithm to generate in ${selectedLang}...`}
                className="w-full bg-[#111122] border border-[#00f2ff33] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#00f2ff44] focus:outline-none focus:border-[#00f2ff]"
              />
              <button
                type="submit"
                disabled={!codeQuery.trim()}
                className="w-full py-2 rounded bg-[#00f2ff] hover:bg-white text-black text-xs font-bold uppercase tracking-widest transition shadow-[0_0_8px_#00f2ff] disabled:opacity-40 cursor-pointer"
              >
                GENERATE & EXPLAIN CODE
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Interactive Terminal Sandbox */}
        <div className="p-4 sm:p-5 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-2">
              <div className="flex items-center gap-2 text-white font-semibold text-xs tracking-wider">
                <Terminal className="w-4 h-4 text-[#00f2ff]" />
                <span>INTERACTIVE CLI & SANDBOX</span>
              </div>
              <span className="text-[10px] text-emerald-400">STATUS: 0 ERRORS</span>
            </div>

            {/* Terminal Screen */}
            <div className="mt-3 h-64 bg-[#050508] rounded-lg border border-[#00f2ff18] p-3 text-xs overflow-y-auto space-y-1 text-slate-300">
              {terminalOutput.map((line, idx) => (
                <div
                  key={idx}
                  className={
                    line.startsWith('$')
                      ? 'text-[#00f2ff] font-semibold'
                      : line.includes('✓')
                      ? 'text-emerald-400'
                      : line.includes('Error')
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* Terminal Input Bar */}
          <form onSubmit={handleRunTerminal} className="flex items-center gap-2 pt-2 border-t border-[#00f2ff18]">
            <span className="text-[#00f2ff] text-xs font-bold">$</span>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="npm run build, git status, run tests, clear..."
              className="flex-1 bg-[#111122] border border-[#00f2ff33] rounded px-2.5 py-1.5 text-xs text-white placeholder:text-[#00f2ff44] focus:outline-none focus:border-[#00f2ff]"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded border border-[#00f2ff44] bg-[#00f2ff11] text-[#00f2ff] hover:bg-[#00f2ff22] text-xs font-bold uppercase transition cursor-pointer"
            >
              RUN
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
